import addOnSandboxSdk from "add-on-sdk-document-sandbox";
import { editor, colorUtils } from "express-document-sdk";
import { BrandKit, BrandColor } from "../models/BrandKit";

const { runtime } = addOnSandboxSdk.instance;

/**
 * Convert hex color to Adobe Express Color format (0-1 range)
 */
function hexToColor(hex: string): { red: number; green: number; blue: number; alpha: number } {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    
    const red = parseInt(hex.substring(0, 2), 16) / 255;
    const green = parseInt(hex.substring(2, 4), 16) / 255;
    const blue = parseInt(hex.substring(4, 6), 16) / 255;
    
    return { red, green, blue, alpha: 1 };
}

/**
 * Create brand kit preview with color swatches and typography samples
 */
async function createBrandKitPreview(brandKit: BrandKit): Promise<void> {
    const insertionParent = editor.context.insertionParent;
    let xPos = 50;
    let yPos = 50;
    const swatchSize = 80;
    const gap = 20;
    
    // Title
    const title = editor.createText("Brand Kit Preview");
    title.fullContent.text = "Brand Kit Preview";
    title.fullContent.applyCharacterStyles({
        fontSize: 32,
        color: { red: 0, green: 0, blue: 0, alpha: 1 },
    }, { start: 0, length: title.fullContent.text.length });
    title.translation = { x: xPos, y: yPos };
    insertionParent.children.append(title);
    yPos += 60;
    
    // Primary Colors
    if (brandKit.colors.primary.length > 0) {
        const primaryLabel = editor.createText("Primary Colors");
        primaryLabel.fullContent.text = "Primary Colors";
        primaryLabel.fullContent.applyCharacterStyles({
            fontSize: 20,
            color: { red: 0, green: 0, blue: 0, alpha: 1 },
        });
        primaryLabel.translation = { x: xPos, y: yPos };
        insertionParent.children.append(primaryLabel);
        yPos += 40;
        
        let currentX = xPos;
        for (const color of brandKit.colors.primary) {
            const swatch = editor.createRectangle();
            swatch.width = swatchSize;
            swatch.height = swatchSize;
            swatch.translation = { x: currentX, y: yPos };
            swatch.fill = editor.makeColorFill(hexToColor(color.hex));
            insertionParent.children.append(swatch);
            
            // Color label
            const label = editor.createText(color.hex);
            label.fullContent.text = color.hex;
            label.fullContent.applyCharacterStyles({
                fontSize: 12,
                color: { red: 0.5, green: 0.5, blue: 0.5, alpha: 1 },
            });
            label.translation = { x: currentX, y: yPos + swatchSize + 10 };
            insertionParent.children.append(label);
            
            currentX += swatchSize + gap;
        }
        yPos += swatchSize + 60;
    }
    
    // Secondary Colors
    if (brandKit.colors.secondary.length > 0) {
        const secondaryLabel = editor.createText("Secondary Colors");
        secondaryLabel.fullContent.text = "Secondary Colors";
        secondaryLabel.fullContent.applyCharacterStyles({
            fontSize: 20,
            color: { red: 0, green: 0, blue: 0, alpha: 1 },
        });
        secondaryLabel.translation = { x: xPos, y: yPos };
        insertionParent.children.append(secondaryLabel);
        yPos += 40;
        
        let currentX = xPos;
        for (const color of brandKit.colors.secondary) {
            const swatch = editor.createRectangle();
            swatch.width = swatchSize;
            swatch.height = swatchSize;
            swatch.translation = { x: currentX, y: yPos };
            swatch.fill = editor.makeColorFill(hexToColor(color.hex));
            insertionParent.children.append(swatch);
            
            const label = editor.createText(color.hex);
            label.fullContent.text = color.hex;
            label.fullContent.applyCharacterStyles({
                fontSize: 12,
                color: { red: 0.5, green: 0.5, blue: 0.5, alpha: 1 },
            });
            label.translation = { x: currentX, y: yPos + swatchSize + 10 };
            insertionParent.children.append(label);
            
            currentX += swatchSize + gap;
        }
        yPos += swatchSize + 60;
    }
    
    // Accent Colors
    if (brandKit.colors.accent.length > 0) {
        const accentLabel = editor.createText("Accent Colors");
        accentLabel.fullContent.text = "Accent Colors";
        accentLabel.fullContent.applyCharacterStyles({
            fontSize: 20,
            color: { red: 0, green: 0, blue: 0, alpha: 1 },
        });
        accentLabel.translation = { x: xPos, y: yPos };
        insertionParent.children.append(accentLabel);
        yPos += 40;
        
        let currentX = xPos;
        for (const color of brandKit.colors.accent) {
            const swatch = editor.createRectangle();
            swatch.width = swatchSize;
            swatch.height = swatchSize;
            swatch.translation = { x: currentX, y: yPos };
            swatch.fill = editor.makeColorFill(hexToColor(color.hex));
            insertionParent.children.append(swatch);
            
            const label = editor.createText(color.hex);
            label.fullContent.text = color.hex;
            label.fullContent.applyCharacterStyles({
                fontSize: 12,
                color: { red: 0.5, green: 0.5, blue: 0.5, alpha: 1 },
            });
            label.translation = { x: currentX, y: yPos + swatchSize + 10 };
            insertionParent.children.append(label);
            
            currentX += swatchSize + gap;
        }
        yPos += swatchSize + 60;
    }
    
    // Typography Samples
    if (brandKit.typography.length > 0) {
        const typoLabel = editor.createText("Typography");
        typoLabel.fullContent.text = "Typography";
        typoLabel.fullContent.applyCharacterStyles({
            fontSize: 20,
            color: { red: 0, green: 0, blue: 0, alpha: 1 },
        });
        typoLabel.translation = { x: xPos, y: yPos };
        insertionParent.children.append(typoLabel);
        yPos += 40;
        
        for (const typo of brandKit.typography) {
            const sampleText = editor.createText(`${typo.role.charAt(0).toUpperCase() + typo.role.slice(1)}: The quick brown fox jumps over the lazy dog`);
            sampleText.fullContent.text = `${typo.role.charAt(0).toUpperCase() + typo.role.slice(1)}: The quick brown fox jumps over the lazy dog`;
            sampleText.fullContent.applyCharacterStyles({
                fontSize: typo.fontSize || 16,
                color: { red: 0, green: 0, blue: 0, alpha: 1 },
            });
            sampleText.translation = { x: xPos, y: yPos };
            insertionParent.children.append(sampleText);
            yPos += 40;
        }
    }
}

/**
 * Apply brand kit to document (for future use - creating brand assets in Express)
 * Note: Adobe Express doesn't have a direct "Brand Kit" API, so we create visual previews
 */
async function applyBrandKit(brandKit: BrandKit): Promise<void> {
    // For MVP, we'll create a brand kit preview
    // In production, this could integrate with Express Brand Kit APIs when available
    await createBrandKitPreview(brandKit);
}

/**
 * Create a platform-optimized design in the document
 */
async function createPlatformDesign(
    platform: string,
    aspectRatio: { width: number; height: number },
    headline: string,
    caption: string,
    brandColors: string[]
): Promise<void> {
    const insertionParent = editor.context.insertionParent;
    
    // Set document size (if possible)
    // Note: Adobe Express SDK may not support direct canvas resizing
    // This creates the design elements instead
    
    const margin = 50;
    let yPos = margin;
    
    // Background rectangle with brand color
    if (brandColors.length > 0) {
        const bg = editor.createRectangle();
        bg.width = aspectRatio.width;
        bg.height = aspectRatio.height;
        bg.translation = { x: 0, y: 0 };
        bg.fill = editor.makeColorFill(hexToColor(brandColors[0]));
        insertionParent.children.append(bg);
    }
    
    // Headline
    const headlineText = editor.createText(headline);
    headlineText.fullContent.text = headline;
    headlineText.fullContent.applyCharacterStyles({
        fontSize: 32,
        color: { red: 1, green: 1, blue: 1, alpha: 1 }, // White text
    }, { start: 0, length: headline.length });
    headlineText.translation = { x: margin, y: yPos };
    insertionParent.children.append(headlineText);
    yPos += 60;
    
    // Caption
    const captionText = editor.createText(caption);
    captionText.fullContent.text = caption;
    captionText.fullContent.applyCharacterStyles({
        fontSize: 16,
        color: { red: 0.95, green: 0.95, blue: 0.95, alpha: 1 },
    }, { start: 0, length: caption.length });
    captionText.translation = { x: margin, y: yPos };
    insertionParent.children.append(captionText);
    
    // Platform label
    const platformLabel = editor.createText(`${platform} - ${aspectRatio.width}x${aspectRatio.height}`);
    platformLabel.fullContent.text = `${platform} - ${aspectRatio.width}x${aspectRatio.height}`;
    platformLabel.fullContent.applyCharacterStyles({
        fontSize: 12,
        color: { red: 0.8, green: 0.8, blue: 0.8, alpha: 1 },
    }, { start: 0, length: platformLabel.fullContent.text.length });
    platformLabel.translation = { x: margin, y: aspectRatio.height - 40 };
    insertionParent.children.append(platformLabel);
}

function start() {
    runtime.exposeApi({
        applyBrandKit,
        createBrandKitPreview,
        createPlatformDesign,
    });
}

start();
