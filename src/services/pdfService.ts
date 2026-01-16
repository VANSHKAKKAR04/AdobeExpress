/**
 * PDF Generation Service for Brand Usage Guidelines
 */

import { jsPDF } from "jspdf";
import { BrandKit } from "../models/BrandKit";
import { generateGuidelines } from "./brandKitService";

/**
 * Generate and download Brand Usage Guidelines PDF
 */
export async function generateBrandGuidelinesPDF(brandKit: BrandKit, fileName: string = "brand-guidelines.pdf"): Promise<Blob> {
    console.log("generateBrandGuidelinesPDF called with brandKit:", brandKit);
    
    try {
        console.log("Initializing jsPDF...");
        console.log("jsPDF available?", typeof jsPDF !== "undefined", jsPDF);
        
        if (typeof jsPDF === "undefined") {
            throw new Error("jsPDF is not defined. Check if jspdf package is installed.");
        }
        
        const doc = new jsPDF();
        console.log("jsPDF instance created successfully");
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPos = margin;
    
    // Title
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("Brand Usage Guidelines", margin, yPos);
    yPos += 15;
    
    // Brand Tone
    if (brandKit.tone) {
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Brand Tone", margin, yPos);
        yPos += 8;
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        const toneLines = doc.splitTextToSize(brandKit.tone, maxWidth);
        doc.text(toneLines, margin, yPos);
        yPos += toneLines.length * 6 + 10;
    }
    
    // Color Palette
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Color Palette", margin, yPos);
    yPos += 10;
    
    // Primary Colors
    if (brandKit.colors.primary.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Primary Colors", margin, yPos);
        yPos += 8;
        
        brandKit.colors.primary.forEach((color, index) => {
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = margin;
            }
            
            // Color swatch
            doc.setFillColor(color.rgb.red * 255, color.rgb.green * 255, color.rgb.blue * 255);
            doc.rect(margin, yPos - 5, 15, 10, "F");
            
            // Color hex
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`${color.hex} - Primary brand elements, headlines, key CTAs`, margin + 18, yPos);
            yPos += 8;
        });
        yPos += 5;
    }
    
    // Secondary Colors
    if (brandKit.colors.secondary.length > 0) {
        if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = margin;
        }
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Secondary Colors", margin, yPos);
        yPos += 8;
        
        brandKit.colors.secondary.forEach((color) => {
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = margin;
            }
            
            doc.setFillColor(color.rgb.red * 255, color.rgb.green * 255, color.rgb.blue * 255);
            doc.rect(margin, yPos - 5, 15, 10, "F");
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`${color.hex} - Supporting elements, secondary information`, margin + 18, yPos);
            yPos += 8;
        });
        yPos += 5;
    }
    
    // Accent Colors
    if (brandKit.colors.accent.length > 0) {
        if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = margin;
        }
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Accent Colors", margin, yPos);
        yPos += 8;
        
        brandKit.colors.accent.forEach((color) => {
            if (yPos > pageHeight - 30) {
                doc.addPage();
                yPos = margin;
            }
            
            doc.setFillColor(color.rgb.red * 255, color.rgb.green * 255, color.rgb.blue * 255);
            doc.rect(margin, yPos - 5, 15, 10, "F");
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`${color.hex} - Highlights and emphasis (use sparingly)`, margin + 18, yPos);
            yPos += 8;
        });
        yPos += 5;
    }
    
    // Typography
    if (brandKit.typography.length > 0) {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        }
        
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Typography", margin, yPos);
        yPos += 10;
        
        brandKit.typography.forEach((type) => {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
            }
            
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            const roleName = type.role.charAt(0).toUpperCase() + type.role.slice(1);
            doc.text(roleName, margin, yPos);
            yPos += 8;
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Font Family: ${type.fontFamily}`, margin + 5, yPos);
            yPos += 6;
            doc.text(`Weight: ${type.fontWeight}`, margin + 5, yPos);
            yPos += 6;
            if (type.fontSize) {
                doc.text(`Size: ${type.fontSize}pt`, margin + 5, yPos);
                yPos += 6;
            }
            yPos += 5;
        });
    }
    
    // Spacing System
    if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = margin;
    }
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Spacing System", margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Base Unit: ${brandKit.spacing.baseUnit}px`, margin + 5, yPos);
    yPos += 6;
    doc.text(`Section Gap: ${brandKit.spacing.sectionGap}px`, margin + 5, yPos);
    yPos += 6;
    doc.text(`Paragraph Gap: ${brandKit.spacing.paragraphGap}px`, margin + 5, yPos);
    yPos += 6;
    doc.text(`Element Padding: ${brandKit.spacing.elementPadding}px`, margin + 5, yPos);
    yPos += 8;
    doc.text("Use multiples of the base unit for consistent spacing throughout designs.", margin, yPos);
    
    // Logo Usage
    if (brandKit.logos.full || brandKit.logos.icon || brandKit.logos.styles) {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        }
        
        yPos += 15;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Logo Usage & Variations", margin, yPos);
        yPos += 10;
        
        // Add logo images if available
        if (brandKit.logos.full && brandKit.logos.full.startsWith('data:image')) {
            try {
                // Get all logos (either from allLogos array or just the single full logo)
                const allLogos = (brandKit.logos as any).allLogos || [{ image: brandKit.logos.full }];
                
                doc.setFontSize(10);
                doc.setFont("helvetica", "normal");
                doc.text(`Logo Image${allLogos.length > 1 ? 's' : ''}:`, margin + 5, yPos);
                yPos += 8;
                
                // Add each logo
                for (let i = 0; i < allLogos.length; i++) {
                    const logo = allLogos[i];
                    const logoDataUrl = typeof logo === 'string' ? logo : logo.image;
                    
                    // Load image to get dimensions
                    const imgDimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
                        const img = new Image();
                        img.onload = () => resolve({ width: img.width, height: img.height });
                        img.onerror = reject;
                        img.src = logoDataUrl;
                    });
                    
                    // Calculate logo size (max 80px width, maintain aspect ratio)
                    const maxLogoWidth = 80;
                    const maxLogoHeight = 80;
                    const logoAspectRatio = imgDimensions.width / imgDimensions.height;
                    let logoWidth = maxLogoWidth;
                    let logoHeight = maxLogoWidth / logoAspectRatio;
                    
                    if (logoHeight > maxLogoHeight) {
                        logoHeight = maxLogoHeight;
                        logoWidth = maxLogoHeight * logoAspectRatio;
                    }
                    
                    // Check if we need a new page
                    if (yPos + logoHeight + 15 > pageHeight - 20) {
                        doc.addPage();
                        yPos = margin;
                    }
                    
                    // Add logo description if available
                    if (typeof logo !== 'string' && logo.description) {
                        doc.setFontSize(9);
                        doc.setFont("helvetica", "italic");
                        doc.text(logo.description, margin + 5, yPos);
                        yPos += 6;
                    }
                    
                    // Add image to PDF
                    doc.addImage(logoDataUrl, 'PNG', margin + 5, yPos, logoWidth, logoHeight);
                    yPos += logoHeight + (i < allLogos.length - 1 ? 8 : 10); // Add spacing between logos
                }
            } catch (error) {
                console.warn("Could not add logo images to PDF:", error);
                // Continue without logo images
            }
        }
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        if (brandKit.logos.styles) {
            if (brandKit.logos.styles.clearSpace) {
                doc.text(`• Minimum clear space: ${brandKit.logos.styles.clearSpace}`, margin + 5, yPos);
                yPos += 6;
            }
            if (brandKit.logos.styles.minSize) {
                doc.text(`• Minimum size: ${brandKit.logos.styles.minSize}`, margin + 5, yPos);
                yPos += 6;
            }
            if (brandKit.logos.styles.usage && brandKit.logos.styles.usage.length > 0) {
                yPos += 3;
                doc.setFont("helvetica", "bold");
                doc.text("Usage Guidelines:", margin + 5, yPos);
                yPos += 6;
                doc.setFont("helvetica", "normal");
                brandKit.logos.styles.usage.forEach(usage => {
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = margin;
                    }
                    doc.text(`  • ${usage}`, margin + 5, yPos);
                    yPos += 6;
                });
            }
            if (brandKit.logos.styles.donts && brandKit.logos.styles.donts.length > 0) {
                yPos += 3;
                doc.setFont("helvetica", "bold");
                doc.text("What NOT to do:", margin + 5, yPos);
                yPos += 6;
                doc.setFont("helvetica", "normal");
                brandKit.logos.styles.donts.forEach(dont => {
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = margin;
                    }
                    doc.text(`  • ${dont}`, margin + 5, yPos);
                    yPos += 6;
                });
            }
        } else {
            doc.text("• Always maintain minimum clear space around logos", margin + 5, yPos);
            yPos += 6;
            doc.text("• Use full logo when space allows", margin + 5, yPos);
            yPos += 6;
            doc.text("• Use icon mark in constrained spaces", margin + 5, yPos);
        }
        if (brandKit.logos.monochrome) {
            yPos += 6;
            doc.text("• Use monochrome version on colored backgrounds", margin + 5, yPos);
        }
        if (brandKit.logos.inverted) {
            yPos += 6;
            doc.text("• Use inverted version on dark backgrounds", margin + 5, yPos);
        }
    }
    
    // Icons & Graphics
    if (brandKit.graphics) {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        }
        
        yPos += 15;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Icons & Graphics", margin, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        if (brandKit.graphics.patterns && brandKit.graphics.patterns.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Patterns:", margin + 5, yPos);
            yPos += 8;
            doc.setFont("helvetica", "normal");
            brandKit.graphics.patterns.forEach(pattern => {
                if (yPos > pageHeight - 30) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.text(`• ${pattern}`, margin + 5, yPos);
                yPos += 6;
            });
            yPos += 3;
        }
        
        if (brandKit.graphics.illustrations) {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
            }
            doc.setFont("helvetica", "bold");
            doc.text("Illustration Style:", margin + 5, yPos);
            yPos += 8;
            doc.setFont("helvetica", "normal");
            const illustrationLines = doc.splitTextToSize(brandKit.graphics.illustrations, maxWidth - 10);
            illustrationLines.forEach((line: string) => {
                if (yPos > pageHeight - 30) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.text(line, margin + 5, yPos);
                yPos += 6;
            });
            yPos += 3;
        }
        
        if (brandKit.graphics.icons && brandKit.graphics.icons.length > 0) {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
            }
            doc.setFont("helvetica", "bold");
            doc.text("Icons:", margin + 5, yPos);
            yPos += 8;
            doc.setFont("helvetica", "normal");
            brandKit.graphics.icons.forEach(icon => {
                if (yPos > pageHeight - 30) {
                    doc.addPage();
                    yPos = margin;
                }
                let iconText = `• ${icon.name}`;
                if (icon.description) {
                    iconText += `: ${icon.description}`;
                }
                if (icon.usage) {
                    iconText += ` - ${icon.usage}`;
                }
                const iconLines = doc.splitTextToSize(iconText, maxWidth - 10);
                iconLines.forEach((line: string) => {
                    doc.text(line, margin + 5, yPos);
                    yPos += 6;
                });
                yPos += 2;
            });
        }
    }
    
    // Contrast Rules
    if (brandKit.contrastRules && brandKit.contrastRules.length > 0) {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        }
        
        yPos += 15;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Contrast Rules", margin, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("These color combinations meet WCAG accessibility standards:", margin + 5, yPos);
        yPos += 8;
        
        brandKit.contrastRules.forEach(rule => {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
            }
            
            // Color combination
            doc.setFont("helvetica", "bold");
            doc.text(`${rule.colorPair.foreground} on ${rule.colorPair.background}`, margin + 5, yPos);
            yPos += 6;
            
            doc.setFont("helvetica", "normal");
            doc.text(`  Contrast Ratio: ${rule.ratio}:1`, margin + 10, yPos);
            yPos += 6;
            doc.text(`  WCAG Level: ${rule.level}`, margin + 10, yPos);
            if (rule.usage) {
                yPos += 6;
                const usageLines = doc.splitTextToSize(`  Usage: ${rule.usage}`, maxWidth - 10);
                usageLines.forEach((line: string) => {
                    doc.text(line, margin + 10, yPos);
                    yPos += 6;
                });
            }
            yPos += 5;
        });
    }
    
    // Communication Style (subtle section at the end)
    if (brandKit.communicationStyle) {
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = margin;
        }
        
        yPos += 15;
        doc.setFontSize(12);
        doc.setFont("helvetica", "italic");
        doc.text("Communication Style (Inferred)", margin, yPos);
        yPos += 8;
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("These communication rules are inferred from brand materials and used", margin + 5, yPos);
        yPos += 5;
        doc.text("for AI-generated content to maintain brand consistency.", margin + 5, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.text(`Formality: ${brandKit.communicationStyle.formality}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Language Style: ${brandKit.communicationStyle.languageStyle}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Audience Type: ${brandKit.communicationStyle.audienceType}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`CTA Style: ${brandKit.communicationStyle.ctaStyle}`, margin + 5, yPos);
        yPos += 6;
        doc.text(`Communication Approach: ${brandKit.communicationStyle.communicationApproach}`, margin + 5, yPos);
    }
    
        // Generate PDF blob
        try {
            console.log("Generating PDF blob...");
            const pdfBlob = doc.output("blob");
            console.log("PDF generated successfully, blob size:", pdfBlob.size);
            return pdfBlob;
        } catch (error) {
            console.error("Error creating PDF blob:", error);
            // Fallback: use arraybuffer if blob fails
            console.log("Trying arraybuffer fallback...");
            const arrayBuffer = doc.output("arraybuffer");
            const blob = new Blob([arrayBuffer], { type: "application/pdf" });
            console.log("Fallback blob created, size:", blob.size);
            return blob;
        }
    } catch (error) {
        console.error("Error in generateBrandGuidelinesPDF:", error);
        throw error;
    }
}
