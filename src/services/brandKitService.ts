/**
 * Brand Kit Service - transforms raw extraction results into usable brand kits
 */

import { BrandKit, BrandColor, BrandTypography, GeminiExtractionResult } from "../models/BrandKit";

/**
 * Convert hex color to RGB (0-1 range for Adobe Express)
 */
function hexToRgb(hex: string): { red: number; green: number; blue: number } | null {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle 3-digit hex
    if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('');
    }
    
    if (hex.length !== 6) {
        return null;
    }
    
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    return { red: r, green: g, blue: b };
}

/**
 * Transform Gemini extraction result into structured BrandKit
 */
export function transformToBrandKit(extraction: GeminiExtractionResult): BrandKit {
    const colors: BrandKit['colors'] = {
        primary: (extraction.colors?.primary || []).map(hex => {
            const rgb = hexToRgb(hex);
            return {
                hex,
                rgb: rgb || { red: 0, green: 0, blue: 0 },
                role: 'primary' as const,
            };
        }),
        secondary: (extraction.colors?.secondary || []).map(hex => {
            const rgb = hexToRgb(hex);
            return {
                hex,
                rgb: rgb || { red: 0, green: 0, blue: 0 },
                role: 'secondary' as const,
            };
        }),
        accent: (extraction.colors?.accent || []).map(hex => {
            const rgb = hexToRgb(hex);
            return {
                hex,
                rgb: rgb || { red: 0, green: 0, blue: 0 },
                role: 'accent' as const,
            };
        }),
        neutral: (extraction.colors?.neutral || []).map(hex => {
            const rgb = hexToRgb(hex);
            return {
                hex,
                rgb: rgb || { red: 0, green: 0, blue: 0 },
                role: 'neutral' as const,
            };
        }),
    };

    const typography: BrandTypography[] = [];
    
    if (extraction.typography?.heading) {
        typography.push({
            role: 'heading',
            fontFamily: extraction.typography.heading.font,
            fontWeight: extraction.typography.heading.weight as BrandTypography['fontWeight'],
            fontSize: extraction.typography.heading.size,
        });
    }
    
    if (extraction.typography?.subheading) {
        typography.push({
            role: 'subheading',
            fontFamily: extraction.typography.subheading.font,
            fontWeight: extraction.typography.subheading.weight as BrandTypography['fontWeight'],
            fontSize: extraction.typography.subheading.size,
        });
    }
    
    if (extraction.typography?.body) {
        typography.push({
            role: 'body',
            fontFamily: extraction.typography.body.font,
            fontWeight: extraction.typography.body.weight as BrandTypography['fontWeight'],
            fontSize: extraction.typography.body.size,
        });
    }
    
    if (extraction.typography?.caption) {
        typography.push({
            role: 'caption',
            fontFamily: extraction.typography.caption.font,
            fontWeight: extraction.typography.caption.weight as BrandTypography['fontWeight'],
            fontSize: extraction.typography.caption.size,
        });
    }

    const spacing = {
        baseUnit: extraction.spacing?.base_unit || 8,
        sectionGap: extraction.spacing?.section_gap || 32,
        paragraphGap: extraction.spacing?.paragraph_gap || 16,
        elementPadding: extraction.spacing?.element_padding || 16,
    };

    return {
        colors,
        typography,
        logos: {
            full: extraction.logos?.full || '',
            icon: extraction.logos?.icon,
            monochrome: extraction.logos?.monochrome,
            inverted: extraction.logos?.inverted,
        },
        spacing,
        tone: extraction.tone,
    };
}

/**
 * Generate brand usage guidelines text
 */
export function generateGuidelines(brandKit: BrandKit): string {
    let guidelines = `# Brand Usage Guidelines\n\n`;
    
    if (brandKit.tone) {
        guidelines += `## Brand Tone\n${brandKit.tone}\n\n`;
    }
    
    guidelines += `## Color Palette\n\n`;
    
    if (brandKit.colors.primary.length > 0) {
        guidelines += `### Primary Colors\n`;
        brandKit.colors.primary.forEach(color => {
            guidelines += `- ${color.hex} - Use for primary brand elements, headlines, and key CTAs\n`;
        });
        guidelines += `\n`;
    }
    
    if (brandKit.colors.secondary.length > 0) {
        guidelines += `### Secondary Colors\n`;
        brandKit.colors.secondary.forEach(color => {
            guidelines += `- ${color.hex} - Use for supporting elements and secondary information\n`;
        });
        guidelines += `\n`;
    }
    
    if (brandKit.colors.accent.length > 0) {
        guidelines += `### Accent Colors\n`;
        brandKit.colors.accent.forEach(color => {
            guidelines += `- ${color.hex} - Use sparingly for highlights and emphasis\n`;
        });
        guidelines += `\n`;
    }
    
    if (brandKit.colors.neutral.length > 0) {
        guidelines += `### Neutral Colors\n`;
        brandKit.colors.neutral.forEach(color => {
            guidelines += `- ${color.hex} - Use for backgrounds, borders, and subtle elements\n`;
        });
        guidelines += `\n`;
    }
    
    if (brandKit.typography.length > 0) {
        guidelines += `## Typography\n\n`;
        brandKit.typography.forEach(type => {
            guidelines += `### ${type.role.charAt(0).toUpperCase() + type.role.slice(1)}\n`;
            guidelines += `- Font Family: ${type.fontFamily}\n`;
            guidelines += `- Weight: ${type.fontWeight}\n`;
            if (type.fontSize) {
                guidelines += `- Size: ${type.fontSize}pt\n`;
            }
            guidelines += `\n`;
        });
    }
    
    guidelines += `## Spacing System\n\n`;
    guidelines += `- Base Unit: ${brandKit.spacing.baseUnit}px\n`;
    guidelines += `- Section Gap: ${brandKit.spacing.sectionGap}px\n`;
    guidelines += `- Paragraph Gap: ${brandKit.spacing.paragraphGap}px\n`;
    guidelines += `- Element Padding: ${brandKit.spacing.elementPadding}px\n`;
    guidelines += `\n`;
    guidelines += `Use multiples of the base unit for consistent spacing throughout designs.\n`;
    
    if (brandKit.logos.full || brandKit.logos.icon) {
        guidelines += `\n## Logo Usage\n\n`;
        guidelines += `- Always maintain minimum clear space around logos\n`;
        guidelines += `- Use full logo when space allows\n`;
        guidelines += `- Use icon mark in constrained spaces\n`;
        if (brandKit.logos.monochrome) {
            guidelines += `- Use monochrome version on colored backgrounds\n`;
        }
        if (brandKit.logos.inverted) {
            guidelines += `- Use inverted version on dark backgrounds\n`;
        }
    }
    
    return guidelines;
}
