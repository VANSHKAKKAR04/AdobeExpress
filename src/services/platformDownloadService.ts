/**
 * Platform Download Service
 * Generates downloadable files for platform versions
 */

import { jsPDF } from "jspdf";

export interface PlatformVersion {
    platform: string;
    aspectRatio: { width: number; height: number };
    headline: string;
    caption: string;
    brandColors: string[];
}

/**
 * Generate a downloadable PDF for a platform version
 */
export async function generatePlatformPDF(
    platformVersion: PlatformVersion,
    rawDesignBase64?: string
): Promise<Blob> {
    const doc = new jsPDF({
        orientation: platformVersion.aspectRatio.width > platformVersion.aspectRatio.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [platformVersion.aspectRatio.width, platformVersion.aspectRatio.height]
    });

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    let yPos = margin;

    // Background with brand color
    if (platformVersion.brandColors.length > 0) {
        const bgColor = platformVersion.brandColors[0];
        const rgb = hexToRgb(bgColor);
        if (rgb) {
            doc.setFillColor(rgb.r, rgb.g, rgb.b);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
        }
    }

    // Headline
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255); // White text on colored background
    const headlineLines = doc.splitTextToSize(platformVersion.headline, pageWidth - 2 * margin);
    doc.text(headlineLines, margin, yPos + 20);
    yPos += headlineLines.length * 30 + 20;

    // Caption
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const captionLines = doc.splitTextToSize(platformVersion.caption, pageWidth - 2 * margin);
    doc.text(captionLines, margin, yPos);
    yPos += captionLines.length * 15 + 20;

    // Platform info
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text(`${platformVersion.platform} - ${platformVersion.aspectRatio.width}x${platformVersion.aspectRatio.height}`, margin, pageHeight - 20);

    // Generate PDF blob
    const pdfBlob = doc.output("blob");
    return pdfBlob;
}

/**
 * Generate a downloadable image (PNG) for a platform version
 * Note: This creates a simple canvas-based image. For production, you might want to use html2canvas or similar.
 */
export async function generatePlatformImage(
    platformVersion: PlatformVersion,
    rawDesignBase64?: string
): Promise<Blob> {
    // Create a canvas
    const canvas = document.createElement('canvas');
    canvas.width = platformVersion.aspectRatio.width;
    canvas.height = platformVersion.aspectRatio.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Could not get canvas context');
    }

    // Background with brand color
    if (platformVersion.brandColors.length > 0) {
        ctx.fillStyle = platformVersion.brandColors[0];
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Add text (headline and caption)
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    const margin = 40;
    let yPos = margin;

    // Headline
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    const headlineLines = wrapText(ctx, platformVersion.headline, canvas.width - 2 * margin, yPos);
    headlineLines.forEach((line: { text: string; y: number }) => {
        ctx.fillText(line.text, margin, line.y);
    });
    yPos = headlineLines[headlineLines.length - 1].y + 40;

    // Caption
    ctx.fillStyle = '#f0f0f0';
    ctx.font = '16px Arial';
    const captionLines = wrapText(ctx, platformVersion.caption, canvas.width - 2 * margin, yPos);
    captionLines.forEach((line: { text: string; y: number }) => {
        ctx.fillText(line.text, margin, line.y);
    });

    // Platform label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'italic 12px Arial';
    ctx.fillText(
        `${platformVersion.platform} - ${platformVersion.aspectRatio.width}x${platformVersion.aspectRatio.height}`,
        margin,
        canvas.height - 30
    );

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to create image blob'));
            }
        }, 'image/png');
    });
}

/**
 * Helper: Wrap text to fit width
 */
function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    startY: number
): Array<{ text: string; y: number }> {
    const words = text.split(' ');
    const lines: Array<{ text: string; y: number }> = [];
    let currentLine = '';
    let y = startY;
    const lineHeight = parseInt(ctx.font) * 1.2;

    for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
            lines.push({ text: currentLine, y });
            currentLine = words[i] + ' ';
            y += lineHeight;
        } else {
            currentLine = testLine;
        }
    }
    lines.push({ text: currentLine, y });
    return lines;
}

/**
 * Helper: Convert hex to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
