/**
 * Graphic Extraction Service
 * Extracts logos, icons, and graphics from uploaded images
 */

import { ExtractedGraphic } from "../models/BrandKit";

/**
 * Crop a region from an image using canvas
 */
function cropImageFromBase64(
    imageBase64: string,
    x: number,
    y: number,
    width: number,
    height: number,
    originalWidth: number,
    originalHeight: number
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                reject(new Error("Could not get canvas context"));
                return;
            }
            
            // Calculate actual pixel coordinates from percentages
            const actualX = (x / 100) * originalWidth;
            const actualY = (y / 100) * originalHeight;
            const actualWidth = (width / 100) * originalWidth;
            const actualHeight = (height / 100) * originalHeight;
            
            // Set canvas size to cropped dimensions
            canvas.width = actualWidth;
            canvas.height = actualHeight;
            
            // Draw the cropped region
            ctx.drawImage(
                img,
                actualX, actualY, actualWidth, actualHeight,
                0, 0, actualWidth, actualHeight
            );
            
            // Convert to base64
            const croppedBase64 = canvas.toDataURL('image/png').split(',')[1];
            resolve(croppedBase64);
        };
        img.onerror = reject;
        img.src = `data:image/png;base64,${imageBase64}`;
    });
}

/**
 * Get image dimensions from base64
 */
function getImageDimensions(imageBase64: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = `data:image/png;base64,${imageBase64}`;
    });
}

/**
 * Extract graphics from image based on identified positions
 */
export async function extractGraphicsFromImage(
    imageBase64: string,
    visibleLogos: Array<{
        name: string;
        type: string;
        description?: string;
        position: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        usage?: string;
    }>,
    onProgress?: (progress: string) => void
): Promise<ExtractedGraphic[]> {
    const extractedGraphics: ExtractedGraphic[] = [];
    
    if (!visibleLogos || visibleLogos.length === 0) {
        return extractedGraphics;
    }
    
    // Get original image dimensions
    onProgress?.("Getting image dimensions...");
    const { width: originalWidth, height: originalHeight } = await getImageDimensions(imageBase64);
    
    // Extract each graphic
    for (let i = 0; i < visibleLogos.length; i++) {
        const logo = visibleLogos[i];
        try {
            onProgress?.(`Extracting ${logo.name} (${i + 1}/${visibleLogos.length})...`);
            
            // Add padding around the logo (10% on each side)
            const padding = 10;
            const x = Math.max(0, logo.position.x - padding);
            const y = Math.max(0, logo.position.y - padding);
            const width = Math.min(100 - x, logo.position.width + (padding * 2));
            const height = Math.min(100 - y, logo.position.height + (padding * 2));
            
            // Crop the graphic
            const croppedBase64 = await cropImageFromBase64(
                imageBase64,
                x,
                y,
                width,
                height,
                originalWidth,
                originalHeight
            );
            
            // Calculate actual dimensions
            const actualWidth = (width / 100) * originalWidth;
            const actualHeight = (height / 100) * originalHeight;
            
            extractedGraphics.push({
                name: logo.name,
                type: (logo.type as ExtractedGraphic['type']) || 'graphic',
                description: logo.description,
                imageBase64: croppedBase64,
                dimensions: {
                    width: Math.round(actualWidth),
                    height: Math.round(actualHeight),
                },
                position: {
                    x: logo.position.x,
                    y: logo.position.y,
                    width: logo.position.width,
                    height: logo.position.height,
                },
                usage: logo.usage,
            });
            
            onProgress?.(`✅ Extracted ${logo.name}`);
        } catch (error) {
            console.error(`Error extracting ${logo.name}:`, error);
            onProgress?.(`⚠️ Failed to extract ${logo.name}, continuing...`);
        }
    }
    
    return extractedGraphics;
}
