/**
 * Brand Kit Service - transforms raw extraction results into usable brand kits
 */

import { BrandKit, BrandColor, BrandTypography, MistralExtractionResult, BrandIcon, CommunicationStyle } from "../models/BrandKit";

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
 * Transform Mistral extraction result into structured BrandKit
 */
export function transformToBrandKit(extraction: MistralExtractionResult): BrandKit {
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

    const logos: BrandKit['logos'] = {
        full: extraction.logos?.full || '',
        icon: extraction.logos?.icon,
        monochrome: extraction.logos?.monochrome,
        inverted: extraction.logos?.inverted,
        variations: extraction.logos?.variations ? {
            horizontal: extraction.logos.variations.horizontal,
            vertical: extraction.logos.variations.vertical,
            stacked: extraction.logos.variations.stacked,
        } : undefined,
        styles: extraction.logos?.styles ? {
            clearSpace: extraction.logos.styles.clear_space,
            minSize: extraction.logos.styles.min_size,
            usage: extraction.logos.styles.usage || [],
            donts: extraction.logos.styles.donts || [],
        } : undefined,
    };

    const graphics: BrandKit['graphics'] = extraction.graphics ? {
        patterns: extraction.graphics.patterns || [],
        illustrations: extraction.graphics.illustrations,
        icons: extraction.graphics.icons?.map(icon => ({
            name: icon.name,
            description: icon.description,
            usage: icon.usage,
            category: (icon.category as BrandIcon['category']) || 'other',
        })) || [],
    } : undefined;

    const contrastRules: BrandKit['contrastRules'] = extraction.contrast_rules?.map(rule => ({
        colorPair: {
            foreground: rule.foreground,
            background: rule.background,
        },
        ratio: rule.ratio || 4.5,
        level: (rule.level as 'AA' | 'AAA' | 'AA-Large' | 'AAA-Large') || 'AA',
        usage: rule.usage,
    })) || undefined;

    const communicationStyle: BrandKit['communicationStyle'] = extraction.communication_style ? {
        formality: extraction.communication_style.formality || 'neutral',
        languageStyle: extraction.communication_style.language_style || 'informative',
        audienceType: extraction.communication_style.audience_type || 'consumer',
        ctaStyle: extraction.communication_style.cta_style || 'moderate',
        communicationApproach: extraction.communication_style.communication_approach || 'friendly',
    } : undefined;

    return {
        colors,
        typography,
        logos,
        spacing,
        graphics,
        contrastRules,
        communicationStyle,
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
    
    if (brandKit.logos.full || brandKit.logos.icon || brandKit.logos.styles) {
        guidelines += `\n## Logo Usage\n\n`;
        if (brandKit.logos.styles) {
            if (brandKit.logos.styles.clearSpace) {
                guidelines += `- Minimum clear space: ${brandKit.logos.styles.clearSpace}\n`;
            }
            if (brandKit.logos.styles.minSize) {
                guidelines += `- Minimum size: ${brandKit.logos.styles.minSize}\n`;
            }
            if (brandKit.logos.styles.usage && brandKit.logos.styles.usage.length > 0) {
                guidelines += `\nUsage Guidelines:\n`;
                brandKit.logos.styles.usage.forEach(usage => {
                    guidelines += `- ${usage}\n`;
                });
            }
            if (brandKit.logos.styles.donts && brandKit.logos.styles.donts.length > 0) {
                guidelines += `\nWhat NOT to do:\n`;
                brandKit.logos.styles.donts.forEach(dont => {
                    guidelines += `- ${dont}\n`;
                });
            }
        } else {
            guidelines += `- Always maintain minimum clear space around logos\n`;
            guidelines += `- Use full logo when space allows\n`;
            guidelines += `- Use icon mark in constrained spaces\n`;
        }
        if (brandKit.logos.monochrome) {
            guidelines += `- Use monochrome version on colored backgrounds\n`;
        }
        if (brandKit.logos.inverted) {
            guidelines += `- Use inverted version on dark backgrounds\n`;
        }
    }
    
    if (brandKit.graphics) {
        guidelines += `\n## Icons & Graphics\n\n`;
        if (brandKit.graphics.patterns && brandKit.graphics.patterns.length > 0) {
            guidelines += `### Patterns\n`;
            brandKit.graphics.patterns.forEach(pattern => {
                guidelines += `- ${pattern}\n`;
            });
            guidelines += `\n`;
        }
        if (brandKit.graphics.illustrations) {
            guidelines += `### Illustration Style\n`;
            guidelines += `${brandKit.graphics.illustrations}\n\n`;
        }
        if (brandKit.graphics.icons && brandKit.graphics.icons.length > 0) {
            guidelines += `### Icons\n`;
            brandKit.graphics.icons.forEach(icon => {
                guidelines += `- **${icon.name}**`;
                if (icon.description) {
                    guidelines += `: ${icon.description}`;
                }
                if (icon.usage) {
                    guidelines += ` - ${icon.usage}`;
                }
                guidelines += `\n`;
            });
            guidelines += `\n`;
        }
    }
    
    if (brandKit.contrastRules && brandKit.contrastRules.length > 0) {
        guidelines += `\n## Contrast Rules\n\n`;
        guidelines += `These color combinations meet WCAG accessibility standards:\n\n`;
        brandKit.contrastRules.forEach(rule => {
            guidelines += `- **${rule.colorPair.foreground}** on **${rule.colorPair.background}**\n`;
            guidelines += `  - Contrast Ratio: ${rule.ratio}:1\n`;
            guidelines += `  - WCAG Level: ${rule.level}\n`;
            if (rule.usage) {
                guidelines += `  - Usage: ${rule.usage}\n`;
            }
            guidelines += `\n`;
        });
    }
    
    if (brandKit.communicationStyle) {
        guidelines += `\n## Communication Style (Inferred)\n\n`;
        guidelines += `*These communication rules are inferred from the brand materials and used for AI-generated content to maintain brand consistency.*\n\n`;
        guidelines += `- **Formality:** ${brandKit.communicationStyle.formality}\n`;
        guidelines += `- **Language Style:** ${brandKit.communicationStyle.languageStyle}\n`;
        guidelines += `- **Audience Type:** ${brandKit.communicationStyle.audienceType}\n`;
        guidelines += `- **CTA Style:** ${brandKit.communicationStyle.ctaStyle}\n`;
        guidelines += `- **Communication Approach:** ${brandKit.communicationStyle.communicationApproach}\n`;
    }
    
    return guidelines;
}
