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
import "./App.css";

import { AddOnSDKAPI } from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

type ProcessingState = "idle" | "uploading" | "analyzing" | "ready" | "applying" | "error";

const App = ({ addOnUISdk, sandboxProxy }: { addOnUISdk: AddOnSDKAPI; sandboxProxy: DocumentSandboxApi }) => {
    const [state, setState] = useState<ProcessingState>("idle");
    const [error, setError] = useState<string | null>(null);
    const [brandKit, setBrandKit] = useState<BrandKit | null>(null);
    const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
    const [apiStatus, setApiStatus] = useState<{ checked: boolean; working: boolean; message?: string }>({ checked: false, working: false });

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
            
            // Create download link
            console.log("Creating download link...");
            const url = URL.createObjectURL(pdfBlob);
            console.log("Blob URL created:", url);
            
            const a = document.createElement("a");
            a.href = url;
            a.download = "brand-usage-guidelines.pdf";
            a.style.display = "none";
            
            // Append to body
            console.log("Appending link to DOM...");
            document.body.appendChild(a);
            
            // Trigger download
            console.log("Clicking download link...");
            a.click();
            console.log("Download link clicked!");
            
            // Clean up after a delay
            setTimeout(() => {
                if (document.body.contains(a)) {
                    document.body.removeChild(a);
                }
                URL.revokeObjectURL(url);
                console.log("Cleanup complete");
            }, 500);
            
            setState(originalState); // Return to previous state
            console.log("Download process complete");
            
            // Show success message briefly
            alert("PDF download started! Check your downloads folder.");
            
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
        setState("idle");
        setError(null);
        setBrandKit(null);
        setUploadedFileName(null);
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

                        {/* Actions */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
                            <Button size="m" onClick={handleApplyBrandKit}>
                                Apply Brand Kit to Document
                            </Button>
                            <Button 
                                size="m" 
                                variant="secondary" 
                                onClick={(e) => {
                                    console.log("Download button clicked!", e);
                                    e.preventDefault();
                                    handleDownloadPDF();
                                }}
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
            </div>
        </Theme>
    );
};

export default App;
