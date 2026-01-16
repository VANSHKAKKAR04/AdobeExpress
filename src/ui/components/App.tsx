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
import "./App.css";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

type ProcessingState = "idle" | "uploading" | "analyzing" | "ready" | "applying" | "converting" | "error";

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
    const [state, setState] = useState<ProcessingState>("idle");
    const [error, setError] = useState<string | null>(null);
    const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [apiStatus, setApiStatus] = useState<{ checked: boolean; working: boolean; message?: string }>({ checked: false, working: false });
    const [showCommunicationStyle, setShowCommunicationStyle] = useState<boolean>(false);
    
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

    const handleDownloadPDF = async () => {
        console.log("Download button clicked!");
        console.log("Current brandKit:", brandKit);
        console.log("Current state:", state);
        
        if (!brandKit) {
            console.error("No brand kit available for PDF generation");
            setError("No brand kit available. Please extract a brand kit first.");
            setState("error");
            return;
        }
        
        try {
            console.log("Starting PDF generation with brand kit:", brandKit);
            
            // Show feedback immediately
            const originalState = state;
            setState("applying");
            
            console.log("Calling generateBrandGuidelinesPDF...");
            const pdfBlob = await generateBrandGuidelinesPDF(brandKit);
            console.log("PDF generated successfully, blob:", pdfBlob);
            console.log("PDF blob size:", pdfBlob?.size, "bytes");
            console.log("PDF blob type:", pdfBlob?.type);
            
            if (!pdfBlob) {
                throw new Error("PDF generation returned null/undefined");
            }
            
            if (pdfBlob.size === 0) {
                throw new Error("PDF generation failed - empty blob (0 bytes)");
            }
            
            // Convert blob to data URL for more reliable opening in sandboxed iframes
            console.log("Converting PDF blob to data URL...");
            const dataUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = () => reject(new Error("Failed to convert PDF to data URL"));
                reader.readAsDataURL(pdfBlob);
            });
            
            console.log("Data URL created, length:", dataUrl.length);
            
            // Open PDF in new window - user can download from browser's PDF viewer
            console.log("Opening PDF in new window...");
            const newWindow = window.open(dataUrl, "_blank");
            
            if (newWindow) {
                console.log("PDF opened successfully in new window - user can download from browser");
                setState(originalState);
            } else {
                console.warn("Popup blocked - showing manual copy instructions");
                // Since all automated methods are blocked, provide a manual copy solution
                const linkContainer = document.createElement("div");
                linkContainer.style.cssText = "position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 2px solid #0066cc; border-radius: 8px; z-index: 10000; box-shadow: 0 8px 16px rgba(0,0,0,0.2); max-width: 500px; max-height: 80vh; overflow-y: auto;";
                
                // Title
                const title = document.createElement("div");
                title.textContent = "📄 PDF Ready!";
                title.style.cssText = "margin-bottom: 12px; font-weight: bold; color: #333; font-size: 16px;";
                linkContainer.appendChild(title);
                
                // Instructions
                const instructions = document.createElement("div");
                instructions.innerHTML = `
                    <div style="font-size: 12px; color: #666; margin-bottom: 12px; line-height: 1.5;">
                        <strong>Due to security restrictions, please follow these steps:</strong><br><br>
                        1. Select all text in the box below (Ctrl+A or Cmd+A)<br>
                        2. Copy it (Ctrl+C or Cmd+C)<br>
                        3. Open a new browser tab<br>
                        4. Paste the link in the address bar and press Enter<br>
                        5. The PDF will open and you can download it
                    </div>
                `;
                linkContainer.appendChild(instructions);
                
                // Selectable textarea with the data URL
                const textArea = document.createElement("textarea");
                textArea.value = dataUrl;
                textArea.readOnly = true;
                textArea.style.cssText = "width: 100%; height: 120px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; font-size: 11px; resize: vertical; margin-bottom: 12px; box-sizing: border-box;";
                textArea.addEventListener("focus", () => {
                    textArea.select();
                });
                textArea.addEventListener("click", () => {
                    textArea.select();
                });
                linkContainer.appendChild(textArea);
                
                // Select all button
                const selectButton = document.createElement("button");
                selectButton.textContent = "📋 Select All Text";
                selectButton.style.cssText = "margin-bottom: 8px; padding: 8px 12px; cursor: pointer; background: #0066cc; color: white; border: none; border-radius: 4px; width: 100%; font-size: 12px; font-weight: bold;";
                selectButton.addEventListener("click", () => {
                    textArea.focus();
                    textArea.select();
                    try {
                        // Try to copy (may fail due to permissions, but selection will work)
                        document.execCommand("copy");
                        selectButton.textContent = "✓ Selected! (Copy with Ctrl+C)";
                        selectButton.style.background = "#4caf50";
                        setTimeout(() => {
                            selectButton.textContent = "📋 Select All Text";
                            selectButton.style.background = "#0066cc";
                        }, 2000);
                    } catch (e) {
                        selectButton.textContent = "✓ Selected! (Copy with Ctrl+C)";
                        selectButton.style.background = "#4caf50";
                        setTimeout(() => {
                            selectButton.textContent = "📋 Select All Text";
                            selectButton.style.background = "#0066cc";
                        }, 2000);
                    }
                });
                linkContainer.appendChild(selectButton);
                
                // Alternative: Right-clickable link
                const altInstructions = document.createElement("div");
                altInstructions.style.cssText = "font-size: 11px; color: #666; margin-bottom: 8px; text-align: center;";
                altInstructions.innerHTML = "Or right-click this link: ";
                const directLink = document.createElement("a");
                directLink.href = dataUrl;
                directLink.textContent = "Open PDF Link";
                directLink.style.cssText = "color: #0066cc; text-decoration: underline; cursor: pointer; margin-left: 4px;";
                altInstructions.appendChild(directLink);
                linkContainer.appendChild(altInstructions);
                
                // Close button
                const closeButton = document.createElement("button");
                closeButton.textContent = "Close";
                closeButton.style.cssText = "margin-top: 8px; padding: 8px 12px; cursor: pointer; background: #f0f0f0; border: 1px solid #ccc; border-radius: 4px; width: 100%; font-size: 12px;";
                closeButton.addEventListener("click", () => {
                    if (document.body.contains(linkContainer)) {
                        document.body.removeChild(linkContainer);
                    }
                });
                linkContainer.appendChild(closeButton);
                
                document.body.appendChild(linkContainer);
                
                // Auto-select text on open
                setTimeout(() => {
                    textArea.focus();
                    textArea.select();
                }, 100);
                
                // Auto-remove after 5 minutes
                setTimeout(() => {
                    if (document.body.contains(linkContainer)) {
                        document.body.removeChild(linkContainer);
                    }
                }, 300000);
                
                setState(originalState);
            }
            
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Failed to generate PDF";
            console.error("❌ Error generating PDF:", err);
            console.error("Error stack:", err instanceof Error ? err.stack : "No stack trace");
            setError(`Failed to generate PDF: ${errorMsg}. Check console (F12) for details.`);
            setState("error");
            alert(`Error: ${errorMsg}. Check console for details.`);
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
                <h2 style={{ marginTop: 0, marginBottom: "16px", fontSize: "18px", fontWeight: "bold" }}>
                    Auto Brand Kit Rebuilder
                </h2>
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
                                    Colors:
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {brandKit.colors.primary.map((color, i) => (
                                        <div key={`primary-${i}`} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
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
                                        </div>
                                    ))}
                                    {brandKit.colors.secondary.map((color, i) => (
                                        <div key={`secondary-${i}`} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
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
                                        </div>
                                    ))}
                                    {brandKit.colors.accent.map((color, i) => (
                                        <div key={`accent-${i}`} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
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
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Typography Preview */}
                        {brandKit.typography.length > 0 && (
                            <div style={{ marginBottom: "16px" }}>
                                <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>
                                    Typography:
                                </p>
                                {brandKit.typography.map((typo, i) => (
                                    <div key={i} style={{ fontSize: "11px", marginBottom: "4px" }}>
                                        {typo.role}: {typo.fontFamily} ({typo.fontWeight})
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Logo Variations & Styles Preview */}
                        {(brandKit.logos.styles || brandKit.logos.full || brandKit.logos.icon) && (
                            <div style={{ marginBottom: "16px" }}>
                                <p style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "8px" }}>
                                    Logo Variations & Styles:
                                </p>
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

                        {/* Actions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                            <Button size="m" onClick={handleApplyBrandKit}>
                                Apply Brand Kit to Document
                            </Button>
                            <Button 
                                size="m" 
                                variant="secondary" 
                                onClick={handleDownloadPDF}
                            >
                                Download Guidelines PDF
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
            </div>
        </Theme>
    );
};

export default App;
