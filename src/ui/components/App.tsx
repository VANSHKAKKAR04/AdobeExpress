// To support: system="express" scale="medium" color="light"
// import these spectrum web components modules:
import "@spectrum-web-components/theme/express/scale-medium.js";
import "@spectrum-web-components/theme/express/theme-light.js";

// To learn more about using "swc-react" visit:
// https://opensource.adobe.com/spectrum-web-components/using-swc-react/
import { Button } from "@swc-react/button";
import { Theme } from "@swc-react/theme";
import React, { useState, useEffect } from "react";
import { DocumentSandboxApi } from "../../models/DocumentSandboxApi";
import { BrandKit } from "../../models/BrandKit";
import { FileUpload } from "./FileUpload";
import { extractBrandKitFromImage, checkMistralAPI } from "../../services/mistralService";
import { transformToBrandKit } from "../../services/brandKitService";
import { generateBrandGuidelinesPDF } from "../../services/pdfService";
import { convertToAllPlatforms, PLATFORM_SPECS } from "../../services/platformConverterService";
import { generatePlatformPDF, generatePlatformImage, downloadBlob } from "../../services/platformDownloadService";
import { getSavedBrandKits, saveBrandKit, deleteSavedBrandKit, SavedBrandKit } from "../../services/brandKitStorageService";
import "./App.css";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

type ProcessingState = "idle" | "uploading" | "analyzing" | "ready" | "applying" | "converting" | "error" | "exporting";
type ExportFormat = "pdf" | "json" | "zip";

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
    const [state, setState] = useState<ProcessingState>("idle");
    const [error, setError] = useState<string | null>(null);
    const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [apiStatus, setApiStatus] = useState<{ checked: boolean; working: boolean; message?: string }>({ checked: false, working: false });
    const [showCommunicationStyle, setShowCommunicationStyle] = useState<boolean>(false);
    const [showExportPanel, setShowExportPanel] = useState<boolean>(false);
    const [pdfDownloadLink, setPdfDownloadLink] = useState<string | null>(null);
    const [showSavedKitsModal, setShowSavedKitsModal] = useState<boolean>(false);
    const [savedBrandKits, setSavedBrandKits] = useState<SavedBrandKit[]>([]);
    const [isLoadingSavedKit, setIsLoadingSavedKit] = useState<boolean>(false);
    const [isViewingSavedKit, setIsViewingSavedKit] = useState<boolean>(false);
    const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
    const [saveKitName, setSaveKitName] = useState<string>("");
    const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
    
    // PDF selection state
    const [selectedForPDF, setSelectedForPDF] = useState<{
        colors: string[]; // Array of hex colors
        typography: number[]; // Array of typography indices
        spacing: boolean;
        logos: boolean;
        graphics: boolean;
        contrastRules: boolean;
        communicationStyle: boolean;
        tone: boolean;
    }>({
        colors: [],
        typography: [],
        spacing: true,
        logos: true,
        graphics: true,
        contrastRules: true,
        communicationStyle: false,
        tone: true,
    });
    
    // Multi-platform converter state
    const [rawDesignFile, setRawDesignFile] = useState<File | null>(null);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['linkedin', 'instagram', 'youtube_thumbnail']);
    const [platformResults, setPlatformResults] = useState<Array<Awaited<ReturnType<typeof convertToAllPlatforms>>[0]> | null>(null);
    const [downloadLinks, setDownloadLinks] = useState<Record<string, { pdf?: string; png?: string }>>({});

    // Check API status on mount
    useEffect(() => {
        checkMistralAPI().then((result) => {
            setApiStatus({
                checked: true,
                working: result.success,
                message: result.error || (result.availableModels.length > 0 
                    ? `Available models: ${result.availableModels.join(", ")}`
                    : "No models available")
            });
            
            if (!result.success) {
                setError(`API Check Failed: ${result.error}`);
            }
        }).catch((err) => {
            setApiStatus({
                checked: true,
                working: false,
                message: err.message || "Failed to check API"
            });
        });
    }, []);

    // Load saved brand kits on mount
    useEffect(() => {
        setSavedBrandKits(getSavedBrandKits());
    }, []);

    const handleFileSelect = async (file: File) => {
        setState("uploading");
        setError(null);
        setUploadedFileName(file.name);

        try {
            setState("analyzing");
            
            // Extract brand kit using Mistral API
            const extractionResult = await extractBrandKitFromImage(file);
            
            // Transform to structured brand kit
            const transformedBrandKit = transformToBrandKit(extractionResult);
            setBrandKit(transformedBrandKit);
            setIsViewingSavedKit(false); // Mark as newly generated
            
            // Initialize PDF selections - select all by default
            const allColors = [
                ...transformedBrandKit.colors.primary.map(c => c.hex),
                ...transformedBrandKit.colors.secondary.map(c => c.hex),
                ...transformedBrandKit.colors.accent.map(c => c.hex),
                ...transformedBrandKit.colors.neutral.map(c => c.hex),
            ];
            const allTypographyIndices = transformedBrandKit.typography.map((_, i) => i);
            
            setSelectedForPDF({
                colors: allColors,
                typography: allTypographyIndices,
                spacing: true,
                logos: true,
                graphics: true,
                contrastRules: true,
                communicationStyle: false,
                tone: true,
            });
            
            setState("ready");
            
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to extract brand kit");
            setState("error");
            console.error("Error extracting brand kit:", err);
        }
    };

    const handleApplyBrandKit = async () => {
        if (!brandKit) return;
        
        setState("applying");
        try {
            await sandboxProxy.applyBrandKit(brandKit);
            setState("ready");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to apply brand kit");
            setState("error");
        }
    };

    /**
     * Export brand kit in the specified format
     */
    const handleExportBrandKit = async (format: ExportFormat) => {
        if (!brandKit) {
            setError("No brand kit available. Please extract a brand kit first.");
            setState("error");
            return;
        }
        
        if (format === "pdf") {
            try {
                setState("exporting");
                setShowExportPanel(false);
                setError(null);

                // Create filtered brand kit based on selections
                const filteredBrandKit: BrandKit = {
                    colors: {
                        primary: brandKit.colors.primary.filter(c => selectedForPDF.colors.includes(c.hex)),
                        secondary: brandKit.colors.secondary.filter(c => selectedForPDF.colors.includes(c.hex)),
                        accent: brandKit.colors.accent.filter(c => selectedForPDF.colors.includes(c.hex)),
                        neutral: brandKit.colors.neutral.filter(c => selectedForPDF.colors.includes(c.hex)),
                    },
                    typography: brandKit.typography.filter((_, i) => selectedForPDF.typography.includes(i)),
                    logos: selectedForPDF.logos ? brandKit.logos : {
                        full: '',
                        icon: undefined,
                        monochrome: undefined,
                        inverted: undefined,
                        styles: undefined,
                    },
                    spacing: selectedForPDF.spacing ? brandKit.spacing : {
                        baseUnit: 8,
                        sectionGap: 32,
                        paragraphGap: 16,
                        elementPadding: 16,
                    },
                    graphics: selectedForPDF.graphics ? brandKit.graphics : undefined,
                    contrastRules: selectedForPDF.contrastRules ? brandKit.contrastRules : undefined,
                    communicationStyle: selectedForPDF.communicationStyle ? brandKit.communicationStyle : undefined,
                    tone: selectedForPDF.tone ? brandKit.tone : undefined,
                };

                const pdfBlob = await generateBrandGuidelinesPDF(filteredBrandKit);

                if (!pdfBlob || pdfBlob.size === 0) {
                    throw new Error("PDF generation failed - empty file");
                }

                // Convert blob to data URL for copyable link
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error("Failed to convert PDF to data URL"));
                reader.readAsDataURL(pdfBlob);
            });
            
                // Store the link for user to copy
                setPdfDownloadLink(dataUrl);
                setState("ready");
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Failed to generate PDF";
                setError(errorMsg);
            setState("error");
            }
        } else if (format === "json") {
            // Future: JSON export
            setError("JSON export coming soon");
            setState("error");
        } else if (format === "zip") {
            // Future: ZIP export
            setError("ZIP export coming soon");
            setState("error");
        }
    };

    const handleReset = () => {
        // Clean up download URLs to prevent memory leaks
        Object.values(downloadLinks).forEach(links => {
            if (links.pdf) URL.revokeObjectURL(links.pdf);
            if (links.png) URL.revokeObjectURL(links.png);
        });
        
        setState("idle");
        setError(null);
        setBrandKit(null);
        setUploadedFileName(null);
        setRawDesignFile(null);
        setPlatformResults(null);
        setDownloadLinks({});
        setShowExportPanel(false);
        setPdfDownloadLink(null);
        setIsViewingSavedKit(false);
        setSaveSuccessMessage(null);
        setSelectedForPDF({
            colors: [],
            typography: [],
            spacing: true,
            logos: true,
            graphics: true,
            contrastRules: true,
            communicationStyle: false,
            tone: true,
        });
    };

    /**
     * Save current brand kit
     */
    const handleSaveBrandKit = () => {
        if (!brandKit) {
            setError("No brand kit to save");
            return;
        }

        // Set default name and show modal
        setSaveKitName(`Brand Kit ${new Date().toLocaleDateString()}`);
        setShowSaveModal(true);
    };

    /**
     * Confirm save brand kit (called from modal)
     */
    const handleConfirmSave = () => {
        if (!brandKit) {
            return;
        }

        const name = saveKitName.trim();
        if (!name || name === "") {
            setError("Please enter a name for the brand kit");
            return;
        }

        const result = saveBrandKit(brandKit, name, uploadedFileName || undefined);
        if (result.success) {
            setSavedBrandKits(getSavedBrandKits());
            setShowSaveModal(false);
            setSaveKitName("");
            setError(null);
            setSaveSuccessMessage("✅ Brand kit saved successfully!");
            setTimeout(() => setSaveSuccessMessage(null), 3000);
        } else {
            setError(result.error || "Failed to save brand kit");
        }
    };

    /**
     * Load a saved brand kit
     */
    const handleLoadSavedBrandKit = (savedKit: SavedBrandKit) => {
        setIsLoadingSavedKit(true);
        setShowSavedKitsModal(false);
        setError(null);
        setIsViewingSavedKit(true); // Mark as viewing saved kit
        
        // Set the brand kit
        setBrandKit(savedKit.brandKit);
        setUploadedFileName(savedKit.sourceFileName || null);
        
        // Initialize PDF selections
        const allColors = [
            ...savedKit.brandKit.colors.primary.map(c => c.hex),
            ...savedKit.brandKit.colors.secondary.map(c => c.hex),
            ...savedKit.brandKit.colors.accent.map(c => c.hex),
            ...savedKit.brandKit.colors.neutral.map(c => c.hex),
        ];
        const allTypographyIndices = savedKit.brandKit.typography.map((_, i) => i);
        
        setSelectedForPDF({
            colors: allColors,
            typography: allTypographyIndices,
            spacing: true,
            logos: true,
            graphics: true,
            contrastRules: true,
            communicationStyle: false,
            tone: true,
        });
        
        setState("ready");
        setIsLoadingSavedKit(false);
    };

    /**
     * Delete a saved brand kit
     */
    const handleDeleteSavedBrandKit = (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) {
            return;
        }

        const result = deleteSavedBrandKit(id);
        if (result.success) {
            setSavedBrandKits(getSavedBrandKits());
        } else {
            setError(result.error || "Failed to delete brand kit");
        }
    };

    // Convert file to base64
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Handle raw design upload for multi-platform conversion
    const handleRawDesignSelect = async (file: File) => {
        if (!brandKit) {
            setError("Please extract a brand kit first before converting designs.");
            setState("error");
            return;
        }

        setRawDesignFile(file);
        setState("converting");
        setError(null);
        setDownloadLinks({});

        try {
            const imageBase64 = await fileToBase64(file);
            const mimeType = file.type || "image/png";

            console.log("Converting to platforms:", selectedPlatforms);
            const results = await convertToAllPlatforms(
                imageBase64,
                mimeType,
                brandKit,
                selectedPlatforms
            );

            console.log("Platform conversion results:", results);
            setPlatformResults(results);
            
            // Generate download links for all platforms
            const links: Record<string, { pdf?: string; png?: string }> = {};
            for (const result of results) {
                try {
                    const pdfBlob = await generatePlatformPDF(result);
                    const pngBlob = await generatePlatformImage(result);
                    
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    const pngUrl = URL.createObjectURL(pngBlob);
                    
                    links[result.platform] = {
                        pdf: pdfUrl,
                        png: pngUrl
                    };
                } catch (err) {
                    console.error(`Error generating downloads for ${result.platform}:`, err);
                }
            }
            setDownloadLinks(links);
            setState("ready");
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Failed to convert design";
            setError(errorMsg);
            setState("error");
            console.error("Error converting to platforms:", err);
        }
    };

    return (
        <Theme system="express" scale="medium" color="light">
            <div className="container">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: "18px", fontWeight: "bold" }}>
                    Auto Brand Kit Rebuilder
                </h2>
                    <Button 
                        size="s" 
                        variant="secondary" 
                        onClick={() => {
                            setSavedBrandKits(getSavedBrandKits());
                            setShowSavedKitsModal(true);
                        }}
                    >
                        📚 Saved ({savedBrandKits.length})
                    </Button>
                </div>
                <p style={{ marginBottom: "16px", fontSize: "12px", color: "#666" }}>
                    Upload a screenshot, app UI, or PDF to extract brand colors, typography, and design elements.
                </p>

                {/* API Status Indicator */}
                {apiStatus.checked && (
                    <div style={{ 
                        marginBottom: "16px", 
                        padding: "8px 12px", 
                        borderRadius: "4px",
                        backgroundColor: apiStatus.working ? "#e8f5e9" : "#ffebee",
                        border: `1px solid ${apiStatus.working ? "#4caf50" : "#f44336"}`,
                        fontSize: "11px"
                    }}>
                        <strong>{apiStatus.working ? "✅" : "❌"} API Status:</strong>{" "}
                        {apiStatus.working 
                            ? `Connected${apiStatus.message ? ` - ${apiStatus.message}` : ""}` 
                            : apiStatus.message || "Not connected"}
                    </div>
                )}

                {state === "idle" && (
                    <FileUpload 
                        onFileSelect={handleFileSelect}
                        disabled={false}
                    />
                )}

                {state === "uploading" && (
                    <div>
                        <p>Uploading {uploadedFileName}...</p>
                    </div>
                )}

                {state === "analyzing" && (
                    <div>
                        <p>🔍 Analyzing image with AI...</p>
                        <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                            Extracting colors, typography, and design elements...
                        </p>
                    </div>
                )}

                {saveSuccessMessage && (
                    <div style={{
                        marginBottom: "16px",
                        padding: "12px",
                        backgroundColor: "#e8f5e9",
                        borderRadius: "8px",
                        border: "1px solid #4caf50",
                        color: "#2e7d32",
                        fontSize: "12px",
                        fontWeight: "bold",
                    }}>
                        {saveSuccessMessage}
                    </div>
                )}

                {state === "error" && (
                    <div>
                        <p style={{ color: "#d32f2f", marginBottom: "16px" }}>
                            ❌ {error || "An error occurred"}
                        </p>
                        <Button size="m" onClick={handleReset}>
                            Try Again
                        </Button>
                    </div>
                )}

                {state === "ready" && brandKit && (
                    <div>
                        <div style={{ marginBottom: "16px" }}>
                            <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "8px" }}>
                                ✅ Brand Kit Extracted
                            </p>
                            {uploadedFileName && (
                                <p style={{ fontSize: "12px", color: "#666" }}>
                                    From: {uploadedFileName}
                                </p>
                            )}
                        </div>

                        {/* Colors Preview */}
                        {(brandKit.colors.primary.length > 0 || 
                          brandKit.colors.secondary.length > 0 || 
                          brandKit.colors.accent.length > 0) && (
                            <div style={{ marginBottom: "16px" }}>
                                <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>
                                    Colors: <span style={{ fontSize: "10px", fontWeight: "normal", color: "#666" }}>(Select for PDF)</span>
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {brandKit.colors.primary.map((color, i) => (
                                        <label key={`primary-${i}`} style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedForPDF.colors.includes(color.hex)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedForPDF({
                                                            ...selectedForPDF,
                                                            colors: [...selectedForPDF.colors, color.hex]
                                                        });
                                                    } else {
                                                        setSelectedForPDF({
                                                            ...selectedForPDF,
                                                            colors: selectedForPDF.colors.filter(c => c !== color.hex)
                                                        });
                                                    }
                                                }}
                                                style={{ cursor: "pointer" }}
                                            />
                                            <div 
                                                style={{ 
                                                    width: "24px", 
                                                    height: "24px", 
                                                    backgroundColor: color.hex,
                                                    borderRadius: "4px",
                                                    border: "1px solid #ddd"
                                                }}
                                            />
                                            <span style={{ fontSize: "11px" }}>{color.hex}</span>
                                        </label>
                                    ))}
                                    {brandKit.colors.secondary.map((color, i) => (
                                        <label key={`secondary-${i}`} style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedForPDF.colors.includes(color.hex)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedForPDF({
                                                            ...selectedForPDF,
                                                            colors: [...selectedForPDF.colors, color.hex]
                                                        });
                                                    } else {
                                                        setSelectedForPDF({
                                                            ...selectedForPDF,
                                                            colors: selectedForPDF.colors.filter(c => c !== color.hex)
                                                        });
                                                    }
                                                }}
                                                style={{ cursor: "pointer" }}
                                            />
                                            <div 
                                                style={{ 
                                                    width: "24px", 
                                                    height: "24px", 
                                                    backgroundColor: color.hex,
                                                    borderRadius: "4px",
                                                    border: "1px solid #ddd"
                                                }}
                                            />
                                            <span style={{ fontSize: "11px" }}>{color.hex}</span>
                                        </label>
                                    ))}
                                    {brandKit.colors.accent.map((color, i) => (
                                        <label key={`accent-${i}`} style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedForPDF.colors.includes(color.hex)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedForPDF({
                                                            ...selectedForPDF,
                                                            colors: [...selectedForPDF.colors, color.hex]
                                                        });
                                                    } else {
                                                        setSelectedForPDF({
                                                            ...selectedForPDF,
                                                            colors: selectedForPDF.colors.filter(c => c !== color.hex)
                                                        });
                                                    }
                                                }}
                                                style={{ cursor: "pointer" }}
                                            />
                                            <div 
                                                style={{ 
                                                    width: "24px", 
                                                    height: "24px", 
                                                    backgroundColor: color.hex,
                                                    borderRadius: "4px",
                                                    border: "1px solid #ddd"
                                                }}
                                            />
                                            <span style={{ fontSize: "11px" }}>{color.hex}</span>
                                        </label>
                                    ))}
                                    {brandKit.colors.neutral.map((color, i) => (
                                        <label key={`neutral-${i}`} style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedForPDF.colors.includes(color.hex)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedForPDF({
                                                            ...selectedForPDF,
                                                            colors: [...selectedForPDF.colors, color.hex]
                                                        });
                                                    } else {
                                                        setSelectedForPDF({
                                                            ...selectedForPDF,
                                                            colors: selectedForPDF.colors.filter(c => c !== color.hex)
                                                        });
                                                    }
                                                }}
                                                style={{ cursor: "pointer" }}
                                            />
                                            <div 
                                                style={{ 
                                                    width: "24px", 
                                                    height: "24px", 
                                                    backgroundColor: color.hex,
                                                    borderRadius: "4px",
                                                    border: "1px solid #ddd"
                                                }}
                                            />
                                            <span style={{ fontSize: "11px" }}>{color.hex}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Typography Preview */}
                        {brandKit.typography.length > 0 && (
                            <div style={{ marginBottom: "16px" }}>
                                <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>
                                    Typography: <span style={{ fontSize: "10px", fontWeight: "normal", color: "#666" }}>(Select for PDF)</span>
                                </p>
                                {brandKit.typography.map((typo, i) => (
                                    <label key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", marginBottom: "4px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedForPDF.typography.includes(i)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedForPDF({
                                                        ...selectedForPDF,
                                                        typography: [...selectedForPDF.typography, i]
                                                    });
                                                } else {
                                                    setSelectedForPDF({
                                                        ...selectedForPDF,
                                                        typography: selectedForPDF.typography.filter(idx => idx !== i)
                                                    });
                                                }
                                            }}
                                            style={{ cursor: "pointer" }}
                                        />
                                        <span>{typo.role}: {typo.fontFamily} ({typo.fontWeight})</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Logo Variations & Styles Preview */}
                        {(brandKit.logos.styles || brandKit.logos.full || brandKit.logos.icon) && (
                            <div style={{ marginBottom: "16px" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "bold", marginBottom: "8px", cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedForPDF.logos}
                                        onChange={(e) => setSelectedForPDF({ ...selectedForPDF, logos: e.target.checked })}
                                        style={{ cursor: "pointer" }}
                                    />
                                    <span>Logo Variations & Styles:</span>
                                    <span style={{ fontSize: "10px", fontWeight: "normal", color: "#666" }}>(Select for PDF)</span>
                                </label>
                                
                                {/* Display extracted logo images if available */}
                                {brandKit.logos.full && brandKit.logos.full.startsWith('data:image') && (
                                    <div style={{ marginBottom: "8px" }}>
                                        <p style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px" }}>
                                            Extracted Logo{((brandKit.logos as any).allLogos?.length || 1) > 1 ? 's' : ''}:
                                        </p>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                            {((brandKit.logos as any).allLogos || [brandKit.logos.full]).map((logo: any, idx: number) => (
                                                <div key={idx} style={{ padding: "8px", backgroundColor: "#f9f9f9", borderRadius: "4px", border: "1px solid #e0e0e0" }}>
                                                    {typeof logo === 'string' ? (
                                                        <img 
                                                            src={logo} 
                                                            alt={`Brand Logo ${idx + 1}`} 
                                                            style={{ 
                                                                maxWidth: "150px", 
                                                                maxHeight: "80px", 
                                                                border: "1px solid #ddd",
                                                                borderRadius: "4px",
                                                                backgroundColor: "white"
                                                            }} 
                                                        />
                                                    ) : (
                                                        <>
                                                            {logo.description && (
                                                                <p style={{ fontSize: "10px", color: "#666", marginBottom: "4px" }}>
                                                                    {logo.description}
                                                                </p>
                                                            )}
                                                            <img 
                                                                src={logo.image} 
                                                                alt={logo.description || `Logo ${idx + 1}`} 
                                                                style={{ 
                                                                    maxWidth: "150px", 
                                                                    maxHeight: "80px", 
                                                                    border: "1px solid #ddd",
                                                                    borderRadius: "4px",
                                                                    backgroundColor: "white"
                                                                }} 
                                                            />
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {brandKit.logos.styles && (
                                    <div style={{ fontSize: "11px", marginBottom: "4px" }}>
                                        {brandKit.logos.styles.clearSpace && (
                                            <div>Clear Space: {brandKit.logos.styles.clearSpace}</div>
                                        )}
                                        {brandKit.logos.styles.minSize && (
                                            <div>Min Size: {brandKit.logos.styles.minSize}</div>
                                        )}
                                        {brandKit.logos.styles.usage && brandKit.logos.styles.usage.length > 0 && (
                                            <div style={{ marginTop: "4px" }}>
                                                <strong>Usage:</strong>
                                                <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                                                    {brandKit.logos.styles.usage.map((usage, i) => (
                                                        <li key={i} style={{ fontSize: "10px" }}>{usage}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {brandKit.logos.styles.donts && brandKit.logos.styles.donts.length > 0 && (
                                            <div style={{ marginTop: "4px" }}>
                                                <strong>Don'ts:</strong>
                                                <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                                                    {brandKit.logos.styles.donts.map((dont, i) => (
                                                        <li key={i} style={{ fontSize: "10px", color: "#d32f2f" }}>{dont}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Icons & Graphics Preview */}
                        {brandKit.graphics && (
                            <div style={{ marginBottom: "16px" }}>
                                <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>
                                    Icons & Graphics:
                                </p>
                                {brandKit.graphics.patterns && brandKit.graphics.patterns.length > 0 && (
                                    <div style={{ fontSize: "11px", marginBottom: "4px" }}>
                                        <strong>Patterns:</strong> {brandKit.graphics.patterns.join(", ")}
                                    </div>
                                )}
                                {brandKit.graphics.illustrations && (
                                    <div style={{ fontSize: "11px", marginBottom: "4px" }}>
                                        <strong>Illustration Style:</strong> {brandKit.graphics.illustrations}
                                    </div>
                                )}
                                {brandKit.graphics.icons && brandKit.graphics.icons.length > 0 && (
                                    <div style={{ fontSize: "11px" }}>
                                        <strong>Icons:</strong>
                                        <ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
                                            {brandKit.graphics.icons.map((icon, i) => (
                                                <li key={i} style={{ fontSize: "10px" }}>
                                                    {icon.name}
                                                    {icon.description && ` - ${icon.description}`}
                                                    {icon.usage && ` (${icon.usage})`}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Contrast Rules Preview */}
                        {brandKit.contrastRules && brandKit.contrastRules.length > 0 && (
                            <div style={{ marginBottom: "16px" }}>
                                <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>
                                    Contrast Rules:
                                </p>
                                {brandKit.contrastRules.map((rule, i) => (
                                    <div key={i} style={{ fontSize: "11px", marginBottom: "6px", padding: "6px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                                            <div 
                                                style={{ 
                                                    width: "16px", 
                                                    height: "16px", 
                                                    backgroundColor: rule.colorPair.foreground,
                                                    borderRadius: "2px",
                                                    border: "1px solid #ddd"
                                                }}
                                            />
                                            <span>on</span>
                                            <div 
                                                style={{ 
                                                    width: "16px", 
                                                    height: "16px", 
                                                    backgroundColor: rule.colorPair.background,
                                                    borderRadius: "2px",
                                                    border: "1px solid #ddd"
                                                }}
                                            />
                                        </div>
                                        <div style={{ fontSize: "10px", color: "#666" }}>
                                            Ratio: {rule.ratio}:1 | Level: {rule.level}
                                            {rule.usage && ` | ${rule.usage}`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Communication Style (Advanced/Collapsible) */}
                        {brandKit.communicationStyle && (
                            <div style={{ marginBottom: "16px" }}>
                                <button
                                    onClick={() => setShowCommunicationStyle(!showCommunicationStyle)}
                                    style={{
                                        fontSize: "11px",
                                        fontWeight: "bold",
                                        color: "#666",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "4px 0",
                                        textAlign: "left",
                                        width: "100%",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px"
                                    }}
                                >
                                    <span>{showCommunicationStyle ? "▼" : "▶"}</span>
                                    <span>Communication Style (Inferred)</span>
                                    <span style={{ fontSize: "9px", fontWeight: "normal", color: "#999", marginLeft: "auto" }}>
                                        AI content rules
                                    </span>
                                </button>
                                {showCommunicationStyle && (
                                    <div style={{ 
                                        fontSize: "10px", 
                                        marginTop: "8px", 
                                        padding: "8px", 
                                        backgroundColor: "#f9f9f9", 
                                        borderRadius: "4px",
                                        border: "1px solid #e0e0e0"
                                    }}>
                                        <p style={{ fontSize: "9px", color: "#666", marginBottom: "6px", fontStyle: "italic" }}>
                                            These rules are inferred from brand materials and used for AI-generated content to maintain brand consistency.
                                        </p>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", fontSize: "10px" }}>
                                            <div><strong>Formality:</strong> {brandKit.communicationStyle.formality}</div>
                                            <div><strong>Language:</strong> {brandKit.communicationStyle.languageStyle}</div>
                                            <div><strong>Audience:</strong> {brandKit.communicationStyle.audienceType}</div>
                                            <div><strong>CTA Style:</strong> {brandKit.communicationStyle.ctaStyle}</div>
                                            <div style={{ gridColumn: "1 / -1" }}>
                                                <strong>Approach:</strong> {brandKit.communicationStyle.communicationApproach}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Multi-Platform Converter Section */}
                        <div style={{ 
                            marginTop: "24px", 
                            padding: "16px", 
                            backgroundColor: "#f5f5f5", 
                            borderRadius: "8px",
                            border: "1px solid #e0e0e0"
                        }}>
                            <p style={{ fontSize: "14px", fontWeight: "bold", marginBottom: "12px" }}>
                                🚀 Multi-Platform Converter
                            </p>
                            <p style={{ fontSize: "11px", color: "#666", marginBottom: "12px" }}>
                                Upload a raw design to apply brand kit styling and create platform-optimized versions.
                            </p>

                            {/* Platform Selection */}
                            <div style={{ marginBottom: "12px" }}>
                                <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>
                                    Select Platforms:
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {Object.keys(PLATFORM_SPECS).map(platformKey => (
                                        <label key={platformKey} style={{ 
                                            display: "flex", 
                                            alignItems: "center", 
                                            gap: "4px",
                                            fontSize: "11px",
                                            cursor: "pointer"
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedPlatforms.includes(platformKey)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedPlatforms([...selectedPlatforms, platformKey]);
                                                    } else {
                                                        setSelectedPlatforms(selectedPlatforms.filter(p => p !== platformKey));
                                                    }
                                                }}
                                                style={{ cursor: "pointer" }}
                                            />
                                            {PLATFORM_SPECS[platformKey].name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Raw Design Upload */}
                            {!rawDesignFile && (
                                <FileUpload 
                                    onFileSelect={handleRawDesignSelect}
                                    disabled={false}
                                />
                            )}

                            {/* Platform Results */}
                            {platformResults && platformResults.length > 0 && (
                                <div style={{ marginTop: "16px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                                        <p style={{ fontSize: "12px", fontWeight: "bold", margin: 0 }}>
                                            ✅ Platform Versions Created:
                                        </p>
                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                            {platformResults.map((result) => (
                                                downloadLinks[result.platform]?.png && (
                                                    <a
                                                        key={`all-png-${result.platform}`}
                                                        href={downloadLinks[result.platform].png}
                                                        download={`${result.platform}-${result.aspectRatio.width}x${result.aspectRatio.height}.png`}
                                                        style={{
                                                            padding: "6px 12px",
                                                            fontSize: "11px",
                                                            backgroundColor: "#4caf50",
                                                            color: "white",
                                                            textDecoration: "none",
                                                            borderRadius: "4px",
                                                            cursor: "pointer",
                                                            display: "inline-block"
                                                        }}
                                                    >
                                                        📥 {result.platform} PNG
                                                    </a>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                    {platformResults.map((result, index) => (
                                        <div key={index} style={{ 
                                            marginBottom: "12px", 
                                            padding: "12px", 
                                            backgroundColor: "white", 
                                            borderRadius: "4px",
                                            border: "1px solid #ddd"
                                        }}>
                                            <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>
                                                {result.platform} ({result.aspectRatio.width}x{result.aspectRatio.height})
                                            </p>
                                            <div style={{ fontSize: "11px", color: "#666", marginBottom: "4px" }}>
                                                <strong>Headline:</strong> {result.headline}
                                            </div>
                                            <div style={{ fontSize: "11px", color: "#666", marginBottom: "8px" }}>
                                                <strong>Caption:</strong> {result.caption.substring(0, 100)}...
                                            </div>
                                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
                                                {result.brandColors.map((color, i) => (
                                                    <div 
                                                        key={i}
                                                        style={{ 
                                                            width: "20px", 
                                                            height: "20px", 
                                                            backgroundColor: color,
                                                            borderRadius: "3px",
                                                            border: "1px solid #ddd"
                                                        }}
                                                        title={color}
                                                    />
                                                ))}
                                            </div>
                                            <div style={{ marginTop: "8px" }}>
                                                {/* Download Links Section */}
                                                <div style={{ marginBottom: "8px" }}>
                                                    <p style={{ fontSize: "11px", fontWeight: "bold", marginBottom: "4px", color: "#666" }}>
                                                        Download Links (Copy & Paste):
                                                    </p>
                                                    
                                                    {downloadLinks[result.platform]?.pdf && (
                                                        <div style={{ marginBottom: "6px" }}>
                                                            <div style={{ display: "flex", gap: "4px", alignItems: "center", marginBottom: "2px" }}>
                                                                <span style={{ fontSize: "10px", color: "#666", minWidth: "60px" }}>PDF:</span>
                                                                <input
                                                                    type="text"
                                                                    value={downloadLinks[result.platform].pdf}
                                                                    readOnly
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: "4px 8px",
                                                                        fontSize: "10px",
                                                                        border: "1px solid #ddd",
                                                                        borderRadius: "4px",
                                                                        fontFamily: "monospace",
                                                                        backgroundColor: "#f9f9f9"
                                                                    }}
                                                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(downloadLinks[result.platform].pdf!);
                                                                        alert("PDF link copied to clipboard!");
                                                                    }}
                                                                    style={{
                                                                        padding: "4px 8px",
                                                                        fontSize: "10px",
                                                                        backgroundColor: "#4caf50",
                                                                        color: "white",
                                                                        border: "none",
                                                                        borderRadius: "4px",
                                                                        cursor: "pointer"
                                                                    }}
                                                                >
                                                                    📋 Copy
                                                                </button>
                                                                <a
                                                                    href={downloadLinks[result.platform].pdf}
                                                                    download={`${result.platform}-${result.aspectRatio.width}x${result.aspectRatio.height}.pdf`}
                                                                    style={{
                                                                        padding: "4px 8px",
                                                                        fontSize: "10px",
                                                                        backgroundColor: "#0066cc",
                                                                        color: "white",
                                                                        textDecoration: "none",
                                                                        borderRadius: "4px",
                                                                        display: "inline-block"
                                                                    }}
                                                                >
                                                                    📥 Download
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    {downloadLinks[result.platform]?.png && (
                                                        <div style={{ marginBottom: "6px" }}>
                                                            <div style={{ display: "flex", gap: "4px", alignItems: "center", marginBottom: "2px" }}>
                                                                <span style={{ fontSize: "10px", color: "#666", minWidth: "60px" }}>PNG:</span>
                                                                <input
                                                                    type="text"
                                                                    value={downloadLinks[result.platform].png}
                                                                    readOnly
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: "4px 8px",
                                                                        fontSize: "10px",
                                                                        border: "1px solid #ddd",
                                                                        borderRadius: "4px",
                                                                        fontFamily: "monospace",
                                                                        backgroundColor: "#f9f9f9"
                                                                    }}
                                                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(downloadLinks[result.platform].png!);
                                                                        alert("PNG link copied to clipboard!");
                                                                    }}
                                                                    style={{
                                                                        padding: "4px 8px",
                                                                        fontSize: "10px",
                                                                        backgroundColor: "#4caf50",
                                                                        color: "white",
                                                                        border: "none",
                                                                        borderRadius: "4px",
                                                                        cursor: "pointer"
                                                                    }}
                                                                >
                                                                    📋 Copy
                                                                </button>
                                                                <a
                                                                    href={downloadLinks[result.platform].png}
                                                                    download={`${result.platform}-${result.aspectRatio.width}x${result.aspectRatio.height}.png`}
                                                                    style={{
                                                                        padding: "4px 8px",
                                                                        fontSize: "10px",
                                                                        backgroundColor: "#0066cc",
                                                                        color: "white",
                                                                        textDecoration: "none",
                                                                        borderRadius: "4px",
                                                                        display: "inline-block"
                                                                    }}
                                                                >
                                                                    📥 Download
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Create in Express Button */}
                                                <Button 
                                                    size="s" 
                                                    variant="secondary"
                                                    onClick={async () => {
                                                        try {
                                                            await sandboxProxy.createPlatformDesign(
                                                                result.platform,
                                                                result.aspectRatio,
                                                                result.headline,
                                                                result.caption,
                                                                result.brandColors
                                                            );
                                                        } catch (err) {
                                                            setError(err instanceof Error ? err.message : "Failed to create in Express");
                                                            setState("error");
                                                        }
                                                    }}
                                                >
                                                    ✨ Create in Express
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {rawDesignFile && !platformResults && (
                                <p style={{ fontSize: "11px", color: "#666", fontStyle: "italic" }}>
                                    Uploaded: {rawDesignFile.name}
                                </p>
                            )}
                        </div>

                        {/* PDF Selection Options */}
                        <div style={{
                            marginTop: "16px",
                            padding: "12px",
                            backgroundColor: "#f9f9f9",
                            borderRadius: "8px",
                            border: "1px solid #e0e0e0"
                        }}>
                            <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>
                                📄 PDF Content Selection:
                            </p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedForPDF.tone}
                                        onChange={(e) => setSelectedForPDF({ ...selectedForPDF, tone: e.target.checked })}
                                        style={{ cursor: "pointer" }}
                                    />
                                    <span>Brand Tone</span>
                                </label>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedForPDF.spacing}
                                        onChange={(e) => setSelectedForPDF({ ...selectedForPDF, spacing: e.target.checked })}
                                        style={{ cursor: "pointer" }}
                                    />
                                    <span>Spacing System</span>
                                </label>
                                {(brandKit.logos.styles || brandKit.logos.full || brandKit.logos.icon) && (
                                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedForPDF.logos}
                                            onChange={(e) => setSelectedForPDF({ ...selectedForPDF, logos: e.target.checked })}
                                            style={{ cursor: "pointer" }}
                                        />
                                        <span>Logo Usage & Variations</span>
                                    </label>
                                )}
                                {brandKit.graphics && (
                                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedForPDF.graphics}
                                            onChange={(e) => setSelectedForPDF({ ...selectedForPDF, graphics: e.target.checked })}
                                            style={{ cursor: "pointer" }}
                                        />
                                        <span>Icons & Graphics</span>
                                    </label>
                                )}
                                {brandKit.contrastRules && brandKit.contrastRules.length > 0 && (
                                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedForPDF.contrastRules}
                                            onChange={(e) => setSelectedForPDF({ ...selectedForPDF, contrastRules: e.target.checked })}
                                            style={{ cursor: "pointer" }}
                                        />
                                        <span>Contrast Rules</span>
                                    </label>
                                )}
                                {brandKit.communicationStyle && (
                                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={selectedForPDF.communicationStyle}
                                            onChange={(e) => setSelectedForPDF({ ...selectedForPDF, communicationStyle: e.target.checked })}
                                            style={{ cursor: "pointer" }}
                                        />
                                        <span>Communication Style (Inferred)</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                            <Button size="m" onClick={handleApplyBrandKit}>
                                Apply Brand Kit to Document
                            </Button>
                            {!isViewingSavedKit && (
                            <Button 
                                size="m" 
                                variant="secondary" 
                                    onClick={handleSaveBrandKit}
                            >
                                    💾 Save Brand Kit
                            </Button>
                            )}
                            
                            {/* Export Panel */}
                            {showExportPanel && (
                                <div style={{
                                    marginTop: "8px",
                                    padding: "12px",
                                    backgroundColor: "#f5f5f5",
                                    borderRadius: "8px",
                                    border: "1px solid #e0e0e0"
                                }}>
                                    <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>
                                        Choose Export Format:
                                    </p>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                        <div style={{ width: "100%" }}>
                                            <Button
                                                size="s"
                                                variant="secondary"
                                                onClick={() => handleExportBrandKit("pdf")}
                                            >
                                                Brand Guidelines (PDF)
                                            </Button>
                                        </div>
                                        {/* Future formats can be added here */}
                                        {/* <div style={{ width: "100%" }}>
                                            <Button size="s" variant="secondary" onClick={() => handleExportBrandKit("json")}>
                                                Brand Kit (JSON)
                                            </Button>
                                        </div>
                                        <div style={{ width: "100%" }}>
                                            <Button size="s" variant="secondary" onClick={() => handleExportBrandKit("zip")}>
                                                Complete Package (ZIP)
                                            </Button>
                                        </div> */}
                                    </div>
                                    <div style={{ marginTop: "8px", width: "100%" }}>
                                        <Button
                                            size="s"
                                            variant="secondary"
                                            onClick={() => setShowExportPanel(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* PDF Download Link Display */}
                            {pdfDownloadLink && (
                                <div style={{
                                    marginTop: "12px",
                                    padding: "12px",
                                    backgroundColor: "#e8f5e9",
                                    borderRadius: "8px",
                                    border: "1px solid #4caf50"
                                }}>
                                    <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px", color: "#2e7d32" }}>
                                        ✅ PDF Ready! Copy this link to download:
                                    </p>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                                        <input
                                            type="text"
                                            value={pdfDownloadLink}
                                            readOnly
                                            onClick={(e) => (e.target as HTMLInputElement).select()}
                                            style={{
                                                flex: 1,
                                                padding: "8px",
                                                fontSize: "11px",
                                                border: "1px solid #ccc",
                                                borderRadius: "4px",
                                                fontFamily: "monospace",
                                                backgroundColor: "white",
                                                cursor: "text"
                                            }}
                                        />
                                        <Button
                                            size="s"
                                            variant="secondary"
                                            onClick={async () => {
                                                try {
                                                    await navigator.clipboard.writeText(pdfDownloadLink);
                                                    alert("✅ Link copied! Paste it in a new browser tab to download the PDF.");
                                                } catch (err) {
                                                    // Fallback: select the input text
                                                    const inputs = document.querySelectorAll('input[type="text"]');
                                                    const pdfInput = Array.from(inputs).find((input: any) => 
                                                        input.value === pdfDownloadLink
                                                    ) as HTMLInputElement;
                                                    if (pdfInput) {
                                                        pdfInput.select();
                                                        pdfInput.setSelectionRange(0, pdfDownloadLink.length);
                                                        try {
                                                            document.execCommand('copy');
                                                            alert("✅ Link copied! Paste it in a new browser tab to download the PDF.");
                                                        } catch (e) {
                                                            alert("⚠️ Please manually select and copy the link (Ctrl+C or Cmd+C), then paste it in a new tab.");
                                                        }
                                                    }
                                                }
                                            }}
                                        >
                                            📋 Copy Link
                                        </Button>
                                    </div>
                                    <p style={{ fontSize: "11px", color: "#666", marginTop: "4px" }}>
                                        Paste this link in a new browser tab to open and download the PDF.
                                    </p>
                                    <Button
                                        size="s"
                                        variant="secondary"
                                        onClick={() => setPdfDownloadLink(null)}
                                        style={{ marginTop: "8px", width: "100%" }}
                                    >
                                        Close
                                    </Button>
                                </div>
                            )}

                            <Button 
                                size="m" 
                                variant="secondary" 
                                onClick={() => setShowExportPanel(!showExportPanel)}
                            >
                                {showExportPanel ? "Hide Export Options" : "Download Brand Kit"}
                            </Button>
                            
                            <Button size="m" variant="secondary" onClick={handleReset}>
                                Start Over
                            </Button>
                        </div>
                    </div>
                )}

                {state === "applying" && (
                    <div>
                        <p>Applying brand kit to document...</p>
                        <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                            Creating color swatches and typography samples...
                        </p>
                    </div>
                )}

                {state === "exporting" && (
                    <div>
                        <p>Preparing your brand kit...</p>
                        <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                            Generating export file...
                        </p>
                    </div>
                )}

                {state === "converting" && (
                    <div>
                        <p>🔄 Converting design to platforms...</p>
                        <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                            Applying brand kit styling and creating platform-optimized versions...
                        </p>
                        <p style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>
                            This may take 30-60 seconds...
                        </p>
                    </div>
                )}

                {/* Save Brand Kit Modal */}
                {showSaveModal && (
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10000,
                    }} onClick={() => {
                        setShowSaveModal(false);
                        setSaveKitName("");
                    }}>
                        <div style={{
                            backgroundColor: "white",
                            borderRadius: "8px",
                            padding: "20px",
                            maxWidth: "400px",
                            width: "90%",
                            boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                        }} onClick={(e) => e.stopPropagation()}>
                            <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: "bold" }}>
                                💾 Save Brand Kit
                            </h3>
                            <p style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>
                                Enter a name for this brand kit:
                            </p>
                            <input
                                type="text"
                                value={saveKitName}
                                onChange={(e) => setSaveKitName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleConfirmSave();
                                    } else if (e.key === "Escape") {
                                        setShowSaveModal(false);
                                        setSaveKitName("");
                                    }
                                }}
                                autoFocus
                                style={{
                                    width: "100%",
                                    padding: "8px",
                                    fontSize: "12px",
                                    border: "1px solid #ccc",
                                    borderRadius: "4px",
                                    marginBottom: "16px",
                                    boxSizing: "border-box",
                                }}
                                placeholder="Brand Kit Name"
                            />
                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                <Button
                                    size="s"
                                    variant="secondary"
                                    onClick={() => {
                                        setShowSaveModal(false);
                                        setSaveKitName("");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="s"
                                    variant="primary"
                                    onClick={handleConfirmSave}
                                    disabled={!saveKitName.trim()}
                                >
                                    Save
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Saved Brand Kits Modal */}
                {showSavedKitsModal && (
                    <div style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10000,
                    }} onClick={() => setShowSavedKitsModal(false)}>
                        <div style={{
                            backgroundColor: "white",
                            borderRadius: "8px",
                            padding: "20px",
                            maxWidth: "600px",
                            width: "90%",
                            maxHeight: "80vh",
                            overflowY: "auto",
                            boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                        }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "bold" }}>
                                    📚 Saved Brand Kits ({savedBrandKits.length})
                                </h3>
                                <button
                                    onClick={() => setShowSavedKitsModal(false)}
                                    style={{
                                        background: "none",
                                        border: "none",
                                        fontSize: "20px",
                                        cursor: "pointer",
                                        padding: "0",
                                        width: "24px",
                                        height: "24px",
                                    }}
                                >
                                    ×
                                </button>
                            </div>

                            {savedBrandKits.length === 0 ? (
                                <p style={{ fontSize: "12px", color: "#666", textAlign: "center", padding: "20px" }}>
                                    No saved brand kits yet. Generate and save a brand kit to see it here.
                                </p>
                            ) : (
                                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                    {savedBrandKits.map((savedKit) => (
                                        <div
                                            key={savedKit.id}
                                            style={{
                                                padding: "12px",
                                                border: "1px solid #e0e0e0",
                                                borderRadius: "8px",
                                                backgroundColor: "#f9f9f9",
                                            }}
                                        >
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: "13px", fontWeight: "bold", margin: "0 0 4px 0" }}>
                                                        {savedKit.name}
                                                    </p>
                                                    <p style={{ fontSize: "11px", color: "#666", margin: "0 0 4px 0" }}>
                                                        Saved: {new Date(savedKit.createdAt).toLocaleString()}
                                                    </p>
                                                    {savedKit.sourceFileName && (
                                                        <p style={{ fontSize: "11px", color: "#999", margin: 0 }}>
                                                            Source: {savedKit.sourceFileName}
                                                        </p>
                                                    )}
                                                    <div style={{ fontSize: "11px", color: "#666", marginTop: "8px" }}>
                                                        <span>Colors: {savedKit.brandKit.colors.primary.length + savedKit.brandKit.colors.secondary.length + savedKit.brandKit.colors.accent.length}</span>
                                                        {" | "}
                                                        <span>Typography: {savedKit.brandKit.typography.length}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                                <Button
                                                    size="s"
                                                    variant="primary"
                                                    onClick={() => handleLoadSavedBrandKit(savedKit)}
                                                    disabled={isLoadingSavedKit}
                                                >
                                                    {isLoadingSavedKit ? "Loading..." : "📂 Open"}
                                                </Button>
                                                <Button
                                                    size="s"
                                                    variant="secondary"
                                                    onClick={() => handleDeleteSavedBrandKit(savedKit.id, savedKit.name)}
                                                >
                                                    🗑️ Delete
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Theme>
    );
};

export default App;
