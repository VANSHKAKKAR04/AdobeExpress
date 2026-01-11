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
    if (brandKit.logos.full || brandKit.logos.icon) {
        if (yPos > pageHeight - 50) {
            doc.addPage();
            yPos = margin;
        }
        
        yPos += 15;
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Logo Usage", margin, yPos);
        yPos += 10;
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("• Always maintain minimum clear space around logos", margin + 5, yPos);
        yPos += 6;
        doc.text("• Use full logo when space allows", margin + 5, yPos);
        yPos += 6;
        doc.text("• Use icon mark in constrained spaces", margin + 5, yPos);
        if (brandKit.logos.monochrome) {
            yPos += 6;
            doc.text("• Use monochrome version on colored backgrounds", margin + 5, yPos);
        }
        if (brandKit.logos.inverted) {
            yPos += 6;
            doc.text("• Use inverted version on dark backgrounds", margin + 5, yPos);
        }
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
