/**
 * PDF Generation Service for Brand Usage Guidelines
 */

import { jsPDF } from "jspdf";
import { BrandKit } from "../models/BrandKit";
import { generateGuidelines } from "./brandKitService";

/**
 * Generate comprehensive Brand Kit PDF matching Moksha-level depth and quality
 * Creates an attractive, professional brand kit document with all sections
 */
export async function generateBrandGuidelinesPDF(brandKit: BrandKit, fileName: string = "brand-guidelines.pdf"): Promise<Blob> {
    console.log("generateBrandGuidelinesPDF called with brandKit:", brandKit);
    
    console.log("Initializing jsPDF...");
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
    
        // ========== COVER PAGE ==========
        // Brand Name (Large, Centered)
        const brandName = brandKit.brandName || "BRAND KIT";
        const brandYear = brandKit.brandYear || new Date().getFullYear().toString();
        
        doc.setFontSize(36);
    doc.setFont("helvetica", "bold");
        const brandNameWidth = doc.getTextWidth(brandName);
        doc.text(brandName, (pageWidth - brandNameWidth) / 2, pageHeight / 2 - 30);
        
        // Year/Subtitle
        doc.setFontSize(18);
        doc.setFont("helvetica", "normal");
        const yearWidth = doc.getTextWidth(brandYear);
        doc.text(brandYear, (pageWidth - yearWidth) / 2, pageHeight / 2 - 5);
        
        // Design Language / Tagline
        if (brandKit.designLanguage) {
        doc.setFontSize(14);
            doc.setFont("helvetica", "italic");
            const designLines = doc.splitTextToSize(brandKit.designLanguage, maxWidth);
            let designY = pageHeight / 2 + 20;
            designLines.forEach((line: string) => {
                const lineWidth = doc.getTextWidth(line);
                doc.text(line, (pageWidth - lineWidth) / 2, designY);
                designY += 8;
            });
        }
        
        // Brand Message / Tone
        if (brandKit.brandMessage || brandKit.tone) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "normal");
            const message = brandKit.brandMessage || brandKit.tone || "";
            const messageLines = doc.splitTextToSize(message, maxWidth);
            let messageY = pageHeight - 60;
            messageLines.forEach((line: string) => {
                const lineWidth = doc.getTextWidth(line);
                doc.text(line, (pageWidth - lineWidth) / 2, messageY);
                messageY += 7;
            });
        }
        
        // ========== DESIGN LANGUAGE / THE GIST ==========
        // New page for this section
        doc.addPage();
        yPos = margin;
        
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("DESIGN LANGUAGE", margin, yPos);
        yPos += 10;
        
        if (brandKit.designLanguage) {
        doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            const designLines = doc.splitTextToSize(brandKit.designLanguage, maxWidth);
            designLines.forEach((line: string) => {
                if (yPos > pageHeight - 30) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.text(line, margin, yPos);
                yPos += 6;
            });
            yPos += 8;
        }
        
        if (brandKit.tone) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Brand Tone", margin, yPos);
            yPos += 8;
            doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const toneLines = doc.splitTextToSize(brandKit.tone, maxWidth);
            toneLines.forEach((line: string) => {
                if (yPos > pageHeight - 30) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.text(line, margin, yPos);
                yPos += 6;
            });
            yPos += 6;
        }
    
    // ========== COLORS SECTION ==========
    // New page for colors section only if we have colors
    if (brandKit.colors.primary.length > 0 || brandKit.colors.secondary.length > 0 || brandKit.colors.accent.length > 0) {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        } else if (yPos > margin + 20) {
            doc.addPage();
            yPos = margin;
        }
    }
    
    if (brandKit.colors.primary.length > 0 || brandKit.colors.secondary.length > 0 || brandKit.colors.accent.length > 0) {
        doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
        doc.text("COLORS", margin, yPos);
    yPos += 10;
        
        // Color description/intro
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const colorIntro = "The color palette captures the brand essence through carefully selected hues that evoke the desired emotions and associations.";
        const introLines = doc.splitTextToSize(colorIntro, maxWidth);
        introLines.forEach((line: string) => {
            doc.text(line, margin, yPos);
            yPos += 5;
        });
        yPos += 5;
    
    // Primary Colors
    if (brandKit.colors.primary.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Primary Colors", margin, yPos);
        yPos += 6;
        
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
            yPos += 7;
        });
        yPos += 4;
    }
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
        yPos += 6;
        
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
            yPos += 7;
        });
        yPos += 4;
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
        yPos += 6;
        
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
            yPos += 7;
        });
        yPos += 4;
    }
    
    // ========== TYPOGRAPHY SECTION ==========
    if (brandKit.typography.length > 0) {
        // New page for typography section only if needed
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        } else if (yPos > margin + 30) {
            doc.addPage();
            yPos = margin;
        }
        
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("TYPOGRAPHY", margin, yPos);
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
            yPos += 4;
        });
    }
    
    // Spacing System
    if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = margin;
    } else {
        yPos += 4;
    }
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Spacing System", margin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Base Unit: ${brandKit.spacing.baseUnit}px`, margin + 5, yPos);
    yPos += 6;
    doc.text(`Section Gap: ${brandKit.spacing.sectionGap}px`, margin + 5, yPos);
    yPos += 6;
    doc.text(`Paragraph Gap: ${brandKit.spacing.paragraphGap}px`, margin + 5, yPos);
    yPos += 6;
    doc.text(`Element Padding: ${brandKit.spacing.elementPadding}px`, margin + 5, yPos);
    yPos += 6;
    doc.text("Use multiples of the base unit for consistent spacing throughout designs.", margin, yPos);
    yPos += 6;
    
    // Logo Usage
    if (brandKit.logos.full || brandKit.logos.icon || brandKit.logos.styles) {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        } else {
            yPos += 4;
        }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Logo Usage & Variations", margin, yPos);
        yPos += 6;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        if (brandKit.logos.styles) {
            if (brandKit.logos.styles.clearSpace) {
                doc.text(`Minimum clear space: ${brandKit.logos.styles.clearSpace}`, margin + 5, yPos);
                yPos += 6;
            }
            if (brandKit.logos.styles.minSize) {
                doc.text(`Minimum size: ${brandKit.logos.styles.minSize}`, margin + 5, yPos);
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
                    doc.text(`  ${usage}`, margin + 5, yPos);
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
                    doc.text(`  ${dont}`, margin + 5, yPos);
                    yPos += 6;
                });
            }
        } else {
            doc.text("Always maintain minimum clear space around logos", margin + 5, yPos);
            yPos += 6;
            doc.text("Use full logo when space allows", margin + 5, yPos);
            yPos += 6;
            doc.text("Use icon mark in constrained spaces", margin + 5, yPos);
        }
        if (brandKit.logos.monochrome) {
            yPos += 6;
            doc.text("Use monochrome version on colored backgrounds", margin + 5, yPos);
        }
        if (brandKit.logos.inverted) {
            yPos += 6;
            doc.text("Use inverted version on dark backgrounds", margin + 5, yPos);
        }
    }
    
    // ========== EXTRACTED GRAPHICS & ICONS SECTION ==========
    if (brandKit.graphics?.extractedGraphics && brandKit.graphics.extractedGraphics.length > 0) {
        // New page for extracted graphics section only if needed
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        } else if (yPos > margin + 30) {
            doc.addPage();
            yPos = margin;
        }
        
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("GRAPHICS & ICONS", margin, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Extracted from uploaded design for easy reference and use:", margin, yPos);
        yPos += 6;
        
        brandKit.graphics.extractedGraphics.forEach((graphic, index) => {
            if (yPos > pageHeight - 120) {
                doc.addPage();
                yPos = margin;
            }
            
            // Graphic name and type
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(graphic.name, margin, yPos);
            yPos += 6;
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text(`Type: ${graphic.type.charAt(0).toUpperCase() + graphic.type.slice(1)}`, margin, yPos);
            yPos += 6;
            
            // Add graphic image
            try {
                const imgData = `data:image/png;base64,${graphic.imageBase64}`;
                const maxWidth = 120;
                const imgWidth = Math.min(maxWidth, graphic.dimensions.width);
                const imgHeight = (imgWidth / graphic.dimensions.width) * graphic.dimensions.height;
                
                if (yPos + imgHeight > pageHeight - 30) {
                    doc.addPage();
                    yPos = margin;
                }
                
                doc.addImage(imgData, "PNG", margin, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 6;
            } catch (error) {
                console.error(`Error adding graphic image ${graphic.name}:`, error);
                doc.setFontSize(9);
                doc.text("(Graphic image could not be embedded)", margin, yPos);
                yPos += 8;
            }
            
            // Description
            if (graphic.description) {
                doc.setFontSize(9);
                const descLines = doc.splitTextToSize(graphic.description, maxWidth);
                descLines.forEach((line: string) => {
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = margin;
                    }
                    doc.text(line, margin, yPos);
                    yPos += 5;
                });
            }
            
            // Usage
            if (graphic.usage) {
                yPos += 3;
                doc.setFontSize(8);
                doc.setFont("helvetica", "italic");
                doc.text(`Usage: ${graphic.usage}`, margin, yPos);
                yPos += 6;
            }
            
            yPos += 6;
        });
    }
    
    // Icons & Graphics (descriptions)
    if (brandKit.graphics && (!brandKit.graphics.extractedGraphics || brandKit.graphics.extractedGraphics.length === 0)) {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        } else {
            yPos += 4;
        }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Icons & Graphics", margin, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        if (brandKit.graphics.patterns && brandKit.graphics.patterns.length > 0) {
            doc.setFont("helvetica", "bold");
            doc.text("Patterns:", margin + 5, yPos);
            yPos += 6;
            doc.setFont("helvetica", "normal");
            brandKit.graphics.patterns.forEach(pattern => {
                if (yPos > pageHeight - 30) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.text(pattern, margin + 5, yPos);
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
            yPos += 6;
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
            yPos += 6;
            doc.setFont("helvetica", "normal");
            brandKit.graphics.icons.forEach(icon => {
                if (yPos > pageHeight - 30) {
                    doc.addPage();
                    yPos = margin;
                }
                let iconText = icon.name;
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
        } else {
            yPos += 4;
        }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Contrast Rules", margin, yPos);
        yPos += 6;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("These color combinations meet WCAG accessibility standards:", margin + 5, yPos);
        yPos += 6;
        
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
    
    // ========== COMPREHENSIVE BRAND KIT SECTIONS ==========
    
    // Color Patterns Section
    if (brandKit.colorPatterns && brandKit.colorPatterns.length > 0) {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        } else {
            yPos += 4;
        }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Color Patterns & Harmonies", margin, yPos);
        yPos += 6;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        brandKit.colorPatterns.forEach((pattern, index) => {
            if (yPos > pageHeight - 60) {
                doc.addPage();
                yPos = margin;
            }
            
            // Pattern name and type
            doc.setFont("helvetica", "bold");
            doc.text(`${pattern.name} (${pattern.type})`, margin + 5, yPos);
            yPos += 8;
            
            // Color swatches
            doc.setFont("helvetica", "normal");
            let xPos = margin + 5;
            pattern.colors.forEach((color, i) => {
                if (xPos > pageWidth - 30) {
                    xPos = margin + 5;
                    yPos += 12;
                }
                // Parse hex to RGB
                const hex = color.replace('#', '');
                const r = parseInt(hex.substring(0, 2), 16);
                const g = parseInt(hex.substring(2, 4), 16);
                const b = parseInt(hex.substring(4, 6), 16);
                
                doc.setFillColor(r, g, b);
                doc.rect(xPos, yPos - 5, 12, 8, "F");
                doc.setDrawColor(200, 200, 200);
                doc.rect(xPos, yPos - 5, 12, 8, "S");
                
                doc.setFontSize(8);
                doc.text(color, xPos + 14, yPos);
                xPos += 60;
            });
            yPos += 10;
            
            // Description
            if (pattern.description) {
                const descLines = doc.splitTextToSize(pattern.description, maxWidth - 10);
                descLines.forEach((line: string) => {
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = margin;
                    }
                    doc.setFontSize(9);
                    doc.text(line, margin + 5, yPos);
                    yPos += 5;
                });
            }
            
            // Usage
            if (pattern.usage) {
                doc.setFontSize(8);
                doc.setFont("helvetica", "italic");
                const usageLines = doc.splitTextToSize(`Usage: ${pattern.usage}`, maxWidth - 10);
                usageLines.forEach((line: string) => {
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = margin;
                    }
                    doc.text(line, margin + 5, yPos);
                    yPos += 5;
                });
            }
            
            yPos += 8;
            doc.setFontSize(10);
        });
    }
    
    // Color Themes Section
    if (brandKit.colorThemes && brandKit.colorThemes.length > 0) {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        } else {
            yPos += 4;
        }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Color Theme Variations", margin, yPos);
        yPos += 6;
        
        doc.setFontSize(10);
        
        brandKit.colorThemes.forEach((theme) => {
            if (yPos > pageHeight - 80) {
                doc.addPage();
                yPos = margin;
            }
            
            // Theme name and variant
            doc.setFont("helvetica", "bold");
            doc.text(`${theme.name} (${theme.variant})`, margin + 5, yPos);
            yPos += 6;
            
            // Background and foreground colors
            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            
            // Background
            const bgHex = theme.colors.background.replace('#', '');
            const bgR = parseInt(bgHex.substring(0, 2), 16);
            const bgG = parseInt(bgHex.substring(2, 4), 16);
            const bgB = parseInt(bgHex.substring(4, 6), 16);
            doc.setFillColor(bgR, bgG, bgB);
            doc.rect(margin + 5, yPos - 5, 15, 8, "F");
            doc.setDrawColor(200, 200, 200);
            doc.rect(margin + 5, yPos - 5, 15, 8, "S");
            doc.text(`Background: ${theme.colors.background}`, margin + 23, yPos);
            yPos += 8;
            
            // Foreground
            const fgHex = theme.colors.foreground.replace('#', '');
            const fgR = parseInt(fgHex.substring(0, 2), 16);
            const fgG = parseInt(fgHex.substring(2, 4), 16);
            const fgB = parseInt(fgHex.substring(4, 6), 16);
            doc.setFillColor(fgR, fgG, fgB);
            doc.rect(margin + 5, yPos - 5, 15, 8, "F");
            doc.setDrawColor(200, 200, 200);
            doc.rect(margin + 5, yPos - 5, 15, 8, "S");
            doc.text(`Foreground: ${theme.colors.foreground}`, margin + 23, yPos);
            yPos += 8;
            
            // Primary colors
            if (theme.colors.primary.length > 0) {
                doc.text("Primary colors:", margin + 5, yPos);
                yPos += 5;
                let xPos = margin + 10;
                theme.colors.primary.slice(0, 3).forEach((color) => {
                    if (xPos > pageWidth - 30) {
                        xPos = margin + 10;
                        yPos += 10;
                    }
                    const hex = color.replace('#', '');
                    const r = parseInt(hex.substring(0, 2), 16);
                    const g = parseInt(hex.substring(2, 4), 16);
                    const b = parseInt(hex.substring(4, 6), 16);
                    doc.setFillColor(r, g, b);
                    doc.rect(xPos, yPos - 4, 10, 6, "F");
                    doc.setDrawColor(200, 200, 200);
                    doc.rect(xPos, yPos - 4, 10, 6, "S");
                    xPos += 35;
                });
                yPos += 6;
            }
            
            // Description
            if (theme.description) {
                const descLines = doc.splitTextToSize(theme.description, maxWidth - 10);
                descLines.forEach((line: string) => {
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = margin;
                    }
                    doc.setFontSize(8);
                    doc.text(line, margin + 5, yPos);
                    yPos += 5;
                });
            }
            
            // Use case
            if (theme.useCase) {
                doc.setFontSize(8);
                doc.setFont("helvetica", "italic");
                const useCaseLines = doc.splitTextToSize(`Use case: ${theme.useCase}`, maxWidth - 10);
                useCaseLines.forEach((line: string) => {
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = margin;
                    }
                    doc.text(line, margin + 5, yPos);
                    yPos += 5;
                });
            }
            
            yPos += 6;
            doc.setFontSize(10);
        });
    }
    
    // Generated Logos Section
    if (brandKit.generatedAssets && brandKit.generatedAssets.filter(a => a.type === 'logo').length > 0) {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        } else {
            yPos += 4;
        }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("AI-Generated Logo Variations", margin, yPos);
        yPos += 6;
        
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.text("AI-generated logo variations", margin + 5, yPos);
        yPos += 6;
        
        const logos = brandKit.generatedAssets.filter(a => a.type === 'logo');
        logos.forEach((logo, index) => {
            if (yPos > pageHeight - 100) {
                doc.addPage();
                yPos = margin;
            }
            
            // Logo variant name
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            doc.text(`${logo.variant.charAt(0).toUpperCase() + logo.variant.slice(1)} Logo`, margin + 5, yPos);
            yPos += 6;
            
            // Add logo image
            try {
                // Convert base64 to image data
                const imgData = `data:image/${logo.format};base64,${logo.base64}`;
                // jsPDF addImage can handle base64 data URLs
                const imgWidth = 80;
                const imgHeight = logo.dimensions 
                    ? (imgWidth * logo.dimensions.height / logo.dimensions.width)
                    : 80;
                
                doc.addImage(imgData, logo.format.toUpperCase(), margin + 5, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 6;
            } catch (error) {
                console.error(`Error adding logo image ${logo.variant}:`, error);
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.text("(Logo image could not be embedded)", margin + 5, yPos);
                yPos += 8;
            }
            
            // Description
            if (logo.description) {
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                const descLines = doc.splitTextToSize(logo.description, maxWidth - 10);
                descLines.forEach((line: string) => {
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = margin;
                    }
                    doc.text(line, margin + 5, yPos);
                    yPos += 5;
                });
            }
            
            yPos += 5;
        });
    }
    
    // ========== IMAGERY SECTION ==========
    if (brandKit.imagery || (brandKit.generatedAssets && brandKit.generatedAssets.filter(a => a.type === 'illustration' && !brandKit.characters?.some(c => c.name.toLowerCase().replace(/\s+/g, '-') === a.variant)).length > 0)) {
        // New page for imagery section only if needed
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        } else if (yPos > margin + 30) {
            doc.addPage();
            yPos = margin;
        }
        
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("IMAGERY", margin, yPos);
        yPos += 10;
        
        if (brandKit.imagery?.style) {
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            const styleLines = doc.splitTextToSize(brandKit.imagery.style, maxWidth);
            styleLines.forEach((line: string) => {
                if (yPos > pageHeight - 30) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.text(line, margin, yPos);
                yPos += 6;
            });
            yPos += 6;
        }
        
        // Generated imagery images
        const imageryAssets = brandKit.generatedAssets?.filter(a => a.type === 'illustration' && !brandKit.characters?.some(c => c.name.toLowerCase().replace(/\s+/g, '-') === a.variant)) || [];
        if (imageryAssets.length > 0) {
            imageryAssets.slice(0, 3).forEach((asset) => {
            if (yPos > pageHeight - 100) {
                doc.addPage();
                yPos = margin;
            }
            
                try {
                    const imgData = `data:image/${asset.format};base64,${asset.base64}`;
                    const imgWidth = Math.min(100, maxWidth);
                    const imgHeight = asset.dimensions 
                        ? (imgWidth * asset.dimensions.height / asset.dimensions.width)
                        : imgWidth;
                    
                    doc.addImage(imgData, asset.format.toUpperCase(), margin, yPos, imgWidth, imgHeight);
                    yPos += imgHeight + 6;
                } catch (error) {
                    console.error("Error adding imagery:", error);
                }
            });
        }
        
        if (brandKit.imagery?.guidelines && brandKit.imagery.guidelines.length > 0) {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
            }
            yPos += 5;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Guidelines:", margin, yPos);
            yPos += 6;
            doc.setFont("helvetica", "normal");
            brandKit.imagery.guidelines.forEach((guideline) => {
                if (yPos > pageHeight - 30) {
                    doc.addPage();
                    yPos = margin;
                }
                doc.text(guideline, margin + 5, yPos);
                yPos += 6;
            });
        }
    }
    
    // ========== PATTERNS SECTION ==========
    if (brandKit.generatedAssets && brandKit.generatedAssets.filter(a => a.type === 'pattern').length > 0) {
        // New page for patterns section only if needed
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        } else if (yPos > margin + 30) {
            doc.addPage();
            yPos = margin;
        }
        
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("PATTERNS", margin, yPos);
        yPos += 10;
        
        const patterns = brandKit.generatedAssets.filter(a => a.type === 'pattern');
        patterns.forEach((pattern, index) => {
            if (yPos > pageHeight - 100) {
                doc.addPage();
                yPos = margin;
            }
            
            // Add pattern image
            try {
                const imgData = `data:image/${pattern.format};base64,${pattern.base64}`;
                const imgWidth = Math.min(120, maxWidth);
                const imgHeight = pattern.dimensions 
                    ? (imgWidth * pattern.dimensions.height / pattern.dimensions.width)
                    : imgWidth;
                
                doc.addImage(imgData, pattern.format.toUpperCase(), margin, yPos, imgWidth, imgHeight);
                yPos += imgHeight + 5;
            } catch (error) {
                console.error(`Error adding pattern image ${pattern.variant}:`, error);
            }
            
            // Description
            if (pattern.description) {
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                const descLines = doc.splitTextToSize(pattern.description, maxWidth);
                descLines.forEach((line: string) => {
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = margin;
                    }
                    doc.text(line, margin, yPos);
                    yPos += 5;
                });
            }
            
            yPos += 8;
        });
    }
    
    // Typography System Section
    if (brandKit.typographySystem) {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        } else {
            yPos += 4;
        }
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Comprehensive Typography System", margin, yPos);
        yPos += 6;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        
        // Font Families
        doc.setFont("helvetica", "bold");
        doc.text("Font Families:", margin + 5, yPos);
        yPos += 6;
        doc.setFont("helvetica", "normal");
        doc.text(`Primary: ${brandKit.typographySystem.fontFamilies.primary}`, margin + 10, yPos);
        yPos += 6;
        if (brandKit.typographySystem.fontFamilies.secondary) {
            doc.text(`Secondary: ${brandKit.typographySystem.fontFamilies.secondary}`, margin + 10, yPos);
            yPos += 6;
        }
        yPos += 5;
        
        // Modular Scale
        doc.setFont("helvetica", "bold");
        doc.text("Modular Scale:", margin + 5, yPos);
        yPos += 6;
        doc.setFont("helvetica", "normal");
        doc.text(`Base Size: ${brandKit.typographySystem.scale.base}px`, margin + 10, yPos);
        yPos += 6;
        doc.text(`Ratio: ${brandKit.typographySystem.scale.ratio}`, margin + 10, yPos);
        yPos += 8;
        
        // Type Scale
        doc.setFont("helvetica", "bold");
        doc.text("Type Scale:", margin + 5, yPos);
        yPos += 6;
        doc.setFont("helvetica", "normal");
        
        const sizes = brandKit.typographySystem.scale.sizes;
        const sizeEntries = Object.entries(sizes).sort((a, b) => (b[1] || 0) - (a[1] || 0));
        
        sizeEntries.forEach(([name, size]) => {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
            }
            
            doc.setFontSize(9);
            doc.text(`${name.toUpperCase()}:`, margin + 10, yPos);
            doc.text(`${size}px`, margin + 50, yPos);
            
            // Show example text
            doc.setFontSize(size / 2); // Scale down for PDF
            doc.text("Sample", margin + 90, yPos);
            
            yPos += 8;
            doc.setFontSize(10);
        });
        
        yPos += 5;
        
        // Line Heights
        if (brandKit.typographySystem.lineHeights) {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
            }
            
            doc.setFont("helvetica", "bold");
            doc.text("Line Heights:", margin + 5, yPos);
            yPos += 6;
            doc.setFont("helvetica", "normal");
            doc.text(`Tight: ${brandKit.typographySystem.lineHeights.tight}`, margin + 10, yPos);
            yPos += 6;
            doc.text(`Normal: ${brandKit.typographySystem.lineHeights.normal}`, margin + 10, yPos);
            yPos += 6;
            doc.text(`Relaxed: ${brandKit.typographySystem.lineHeights.relaxed}`, margin + 10, yPos);
            yPos += 8;
        }
    }
    
    // ========== CHARACTERS SECTION ==========
    if (brandKit.characters && brandKit.characters.length > 0) {
        // New page for characters section only if needed
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        } else if (yPos > margin + 30) {
            doc.addPage();
            yPos = margin;
        }
        
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("CHARACTERS", margin, yPos);
        yPos += 10;
        
        const characterAssets = brandKit.generatedAssets?.filter(a => a.type === 'illustration' && brandKit.characters?.some(c => c.name.toLowerCase().replace(/\s+/g, '-') === a.variant)) || [];
        
        brandKit.characters.forEach((character, index) => {
            if (yPos > pageHeight - 100) {
                doc.addPage();
                yPos = margin;
            }
            
            // Character name and type
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text(character.name, margin, yPos);
            yPos += 6;
            
            doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
            let charInfo = character.type.charAt(0).toUpperCase() + character.type.slice(1);
            if (character.element) {
                charInfo += ` - ${character.element.charAt(0).toUpperCase() + character.element.slice(1)}`;
            }
            doc.text(charInfo, margin, yPos);
            yPos += 6;
            
            // Character image if available
            const charAsset = characterAssets.find(a => a.variant === character.name.toLowerCase().replace(/\s+/g, '-'));
            if (charAsset) {
                try {
                    const imgData = `data:image/${charAsset.format};base64,${charAsset.base64}`;
                    const imgWidth = 80;
                    const imgHeight = charAsset.dimensions 
                        ? (imgWidth * charAsset.dimensions.height / charAsset.dimensions.width)
                        : imgWidth;
                    
                    doc.addImage(imgData, charAsset.format.toUpperCase(), margin, yPos, imgWidth, imgHeight);
                    yPos += imgHeight + 6;
                } catch (error) {
                    console.error("Error adding character image:", error);
                }
            }
            
            // Description
            if (character.description) {
                doc.setFontSize(9);
                const descLines = doc.splitTextToSize(character.description, maxWidth);
                descLines.forEach((line: string) => {
                    if (yPos > pageHeight - 30) {
                        doc.addPage();
                        yPos = margin;
                    }
                    doc.text(line, margin, yPos);
        yPos += 5;
                });
            }
            
            if (character.usage) {
                yPos += 3;
                doc.setFontSize(8);
                doc.setFont("helvetica", "italic");
                doc.text(`Usage: ${character.usage}`, margin, yPos);
        yPos += 6;
            }
            
        yPos += 6;
        });
    }
    
    // ========== THANK YOU PAGE ==========
    if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = margin;
    }
    
    yPos = pageHeight / 2 - 20;
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const thankYouWidth = doc.getTextWidth(`${brandName.toUpperCase()}`);
    doc.text(`${brandName.toUpperCase()}`, (pageWidth - thankYouWidth) / 2, yPos);
    
    yPos += 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    const thankYouText = "THANK YOU";
    const thankYouTextWidth = doc.getTextWidth(thankYouText);
    doc.text(thankYouText, (pageWidth - thankYouTextWidth) / 2, yPos);
    
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
}
