/**
 * Brand Kit Service - transforms raw extraction results into usable brand kits
 */

import { BrandKit, BrandColor, BrandTypography, MistralExtractionResult, BrandIcon, CommunicationStyle, ColorPattern, ColorTheme, GeneratedAsset, TypographySystem, BrandCharacter, BrandImagery, ExtractedGraphic } from "../models/BrandKit";
import { generateLogoWithJanus, generateLogoVariations, generatePatternWithJanus } from "./huggingFaceService";
import { extractGraphicsFromImage } from "./graphicExtractionService";

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
        neutral: [
            ...(extraction.colors?.neutral || []),
            ...(extraction.colors?.background || []),
            ...(extraction.colors?.foreground || []),
        ].map(hex => {
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
        // Extracted graphics will be added later in generateComprehensiveBrandKit
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

    // Transform characters
    const characters: BrandKit['characters'] = extraction.characters?.map(char => ({
        name: char.name,
        type: (char.type as BrandCharacter['type']) || 'character',
        element: char.element as BrandCharacter['element'],
        description: char.description,
        usage: char.usage,
    }));

    // Transform imagery
    const imagery: BrandKit['imagery'] = extraction.imagery ? {
        style: extraction.imagery.style,
        guidelines: extraction.imagery.guidelines,
        themes: extraction.imagery.themes,
    } : undefined;

    return {
        brandName: extraction.brand_name,
        brandYear: extraction.brand_year,
        designLanguage: extraction.design_language,
        colors,
        typography,
        logos,
        spacing,
        graphics,
        contrastRules,
        communicationStyle,
        tone: extraction.tone,
        brandMessage: extraction.brand_message,
        characters,
        imagery,
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

/**
 * Generate color patterns from brand colors
 */
export function generateColorPatterns(brandKit: BrandKit): ColorPattern[] {
    const patterns: ColorPattern[] = [];
    const allColors = [
        ...brandKit.colors.primary,
        ...brandKit.colors.secondary,
        ...brandKit.colors.accent,
    ].map(c => c.hex);

    if (allColors.length < 2) return patterns;

    // Generate gradient patterns
    if (allColors.length >= 2) {
        patterns.push({
            type: 'gradient',
            name: 'Primary Gradient',
            colors: [allColors[0], allColors[1]],
            direction: 'horizontal',
            stops: [0, 1],
            description: 'Primary brand gradient for backgrounds and hero sections',
            usage: 'Use in hero sections, backgrounds, and large visual elements'
        });

        if (allColors.length >= 3) {
            patterns.push({
                type: 'gradient',
                name: 'Tri-Color Gradient',
                colors: [allColors[0], allColors[1], allColors[2]],
                direction: 'diagonal',
                stops: [0, 0.5, 1],
                description: 'Three-color gradient for dynamic backgrounds',
                usage: 'Use for premium features, special promotions, or high-impact sections'
            });
        }
    }

    // Generate complementary harmony
    if (allColors.length >= 2) {
        patterns.push({
            type: 'complementary',
            name: 'Complementary Harmony',
            colors: [allColors[0], allColors[1]],
            description: 'Complementary color pairing for contrast and emphasis',
            usage: 'Use for CTAs, important information, and visual hierarchy'
        });
    }

    // Generate triadic harmony
    if (allColors.length >= 3) {
        patterns.push({
            type: 'triadic',
            name: 'Triadic Harmony',
            colors: [allColors[0], allColors[1], allColors[2]],
            description: 'Three-color harmony for balanced, vibrant designs',
            usage: 'Use for multi-section layouts and diverse content areas'
        });
    }

    // Generate analogous harmony
    if (brandKit.colors.primary.length >= 2) {
        patterns.push({
            type: 'analogous',
            name: 'Analogous Primary',
            colors: brandKit.colors.primary.slice(0, 3).map(c => c.hex),
            description: 'Analogous color scheme for cohesive, harmonious designs',
            usage: 'Use for related content sections and subtle variations'
        });
    }

    return patterns;
}

/**
 * Generate color theme variations
 */
export function generateColorThemes(brandKit: BrandKit): ColorTheme[] {
    const themes: ColorTheme[] = [];
    const primary = brandKit.colors.primary[0]?.hex || '#000000';
    const secondary = brandKit.colors.secondary[0]?.hex || '#666666';
    const accent = brandKit.colors.accent[0]?.hex || primary;
    const neutral = brandKit.colors.neutral[0]?.hex || '#F5F5F5';

    // Light theme
    themes.push({
        name: 'Light Theme',
        variant: 'light',
        colors: {
            primary: brandKit.colors.primary.map(c => c.hex),
            secondary: brandKit.colors.secondary.map(c => c.hex),
            accent: brandKit.colors.accent.map(c => c.hex),
            background: '#FFFFFF',
            foreground: primary,
            neutral: brandKit.colors.neutral.map(c => c.hex),
        },
        description: 'Standard light theme for most applications',
        useCase: 'Use for websites, apps, and documents with light backgrounds'
    });

    // Dark theme
    themes.push({
        name: 'Dark Theme',
        variant: 'dark',
        colors: {
            primary: brandKit.colors.primary.map(c => c.hex),
            secondary: brandKit.colors.secondary.map(c => c.hex),
            accent: brandKit.colors.accent.map(c => c.hex),
            background: '#1A1A1A',
            foreground: '#FFFFFF',
            neutral: ['#2A2A2A', '#3A3A3A', '#4A4A4A'],
        },
        description: 'Dark theme for modern, eye-friendly interfaces',
        useCase: 'Use for dark mode applications, presentations, and night-time viewing'
    });

    // High contrast theme
    themes.push({
        name: 'High Contrast Theme',
        variant: 'high-contrast',
        colors: {
            primary: brandKit.colors.primary.map(c => c.hex),
            secondary: brandKit.colors.secondary.map(c => c.hex),
            accent: brandKit.colors.accent.map(c => c.hex),
            background: '#FFFFFF',
            foreground: '#000000',
            neutral: ['#000000', '#FFFFFF', '#808080'],
        },
        description: 'High contrast theme for accessibility',
        useCase: 'Use for accessibility compliance and clear visual hierarchy'
    });

    return themes;
}

/**
 * Generate comprehensive typography system
 */
export function generateTypographySystem(brandKit: BrandKit): TypographySystem {
    const heading = brandKit.typography.find(t => t.role === 'heading');
    const body = brandKit.typography.find(t => t.role === 'body');
    const baseSize = body?.fontSize || 16;

    // Modular scale (Major Third: 1.25)
    const ratio = 1.25;
    
    return {
        fontFamilies: {
            primary: heading?.fontFamily || body?.fontFamily || 'Sans-serif',
            secondary: body?.fontFamily || heading?.fontFamily || 'Sans-serif',
        },
        scale: {
            base: baseSize,
            ratio: ratio,
            sizes: {
                display: Math.round(baseSize * ratio * ratio * ratio * ratio), // ~39px
                h1: Math.round(baseSize * ratio * ratio * ratio), // ~31px
                h2: Math.round(baseSize * ratio * ratio), // ~25px
                h3: Math.round(baseSize * ratio), // ~20px
                h4: Math.round(baseSize), // 16px
                body: baseSize,
                small: Math.round(baseSize / ratio), // ~13px
                caption: Math.round(baseSize / (ratio * ratio)), // ~10px
            },
        },
        weights: {
            light: 300,
            regular: 400,
            medium: 500,
            bold: 700,
            black: 900,
        },
        lineHeights: {
            tight: 1.2,
            normal: 1.5,
            relaxed: 1.8,
        },
        letterSpacing: {
            tight: -0.5,
            normal: 0,
            wide: 1,
        },
    };
}

/**
 * Generate logo variations using Janus-1.3B
 */
export async function generateLogoAssets(
    brandKit: BrandKit,
    logoDescription?: string,
    referenceImageBase64?: string,
    onProgress?: (progress: string) => void
): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];
    
    // Use extracted logo descriptions if available
    const wordmarkDesc = brandKit.logos?.styles?.usage?.[0] || 
        (brandKit as any).logos?.wordmark_description || 
        logoDescription || 
        `Logo for ${brandKit.brandName || brandKit.tone || 'brand'}`;
    
    const logomarkDesc = (brandKit as any).logos?.logomark_description || 
        `Icon mark for ${brandKit.brandName || brandKit.tone || 'brand'}`;
    
    const logoStyle = (brandKit as any).logos?.logo_style || 
        brandKit.designLanguage || 
        (brandKit.communicationStyle 
            ? `${brandKit.communicationStyle.formality} ${brandKit.communicationStyle.communicationApproach} style`
            : 'modern professional');
    
    const colors = [
        ...brandKit.colors.primary,
        ...brandKit.colors.secondary,
        ...brandKit.colors.accent,
    ].map(c => c.hex);

    try {
        // Generate wordmark logo
        if (wordmarkDesc) {
            try {
                onProgress?.("Generating wordmark logo...");
                const wordmarkBase64 = await generateLogoWithJanus(
                    wordmarkDesc,
                    logoStyle,
                    colors,
                    referenceImageBase64,
                    (msg) => onProgress?.(`Wordmark: ${msg}`)
                );
                assets.push({
                    type: 'logo',
                    variant: 'wordmark',
                    base64: wordmarkBase64,
                    format: 'png',
                    dimensions: { width: 512, height: 512 },
                    description: `Wordmark: ${wordmarkDesc}`,
                    source: 'janus-generated',
                });
            } catch (error) {
                console.error("Error generating wordmark:", error);
            }
        }

        // Generate logomark/icon
        if (logomarkDesc) {
            try {
                onProgress?.("Generating logomark/icon...");
                const logomarkBase64 = await generateLogoWithJanus(
                    logomarkDesc,
                    logoStyle,
                    colors,
                    referenceImageBase64,
                    (msg) => onProgress?.(`Logomark: ${msg}`)
                );
                assets.push({
                    type: 'logo',
                    variant: 'logomark',
                    base64: logomarkBase64,
                    format: 'png',
                    dimensions: { width: 512, height: 512 },
                    description: `Logomark: ${logomarkDesc}`,
                    source: 'janus-generated',
                });
            } catch (error) {
                console.error("Error generating logomark:", error);
            }
        }

        // Generate additional logo variations
        onProgress?.("Generating logo variations...");
        const variations = await generateLogoVariations(
            wordmarkDesc || logomarkDesc,
            logoStyle,
            colors,
            referenceImageBase64,
            onProgress
        );
        
        variations.forEach((variation) => {
            assets.push({
                type: 'logo',
                variant: variation.variant,
                base64: variation.base64,
                format: 'png',
                dimensions: { width: 512, height: 512 },
                description: `${variation.variant} logo variation`,
                source: 'janus-generated',
            });
        });
    } catch (error) {
        console.error("Error generating logos with Janus:", error);
        // Continue without generated logos - they're optional
    }

    return assets;
}

/**
 * Generate character/mascot assets using Janus-1.3B
 */
export async function generateCharacterAssets(
    brandKit: BrandKit,
    referenceImageBase64?: string,
    onProgress?: (progress: string) => void
): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];
    
    if (!brandKit.characters || brandKit.characters.length === 0) {
        return assets;
    }

    const colors = [
        ...brandKit.colors.primary,
        ...brandKit.colors.secondary,
        ...brandKit.colors.accent,
    ].map(c => c.hex);

    const style = brandKit.designLanguage || 
        (brandKit.communicationStyle 
            ? `${brandKit.communicationStyle.formality} ${brandKit.communicationStyle.communicationApproach} style`
            : 'professional');

    for (let i = 0; i < brandKit.characters.length; i++) {
        const character = brandKit.characters[i];
        try {
            onProgress?.(`Generating character: ${character.name} (${i + 1}/${brandKit.characters.length})...`);
            const prompt = `${character.description}. ${character.name} ${character.type}${character.element ? ` representing ${character.element} element` : ''}. ${style}. Use brand colors: ${colors.join(', ')}. High quality, detailed illustration.`;
            
            const base64 = await generateLogoWithJanus(
                prompt,
                style,
                colors,
                referenceImageBase64,
                (msg) => onProgress?.(`${character.name}: ${msg}`)
            );
            
            assets.push({
                type: 'illustration',
                variant: character.name.toLowerCase().replace(/\s+/g, '-'),
                base64,
                format: 'png',
                dimensions: { width: 512, height: 512 },
                description: `${character.name} - ${character.description}`,
                source: 'janus-generated',
            });
        } catch (error) {
            console.error(`Error generating character ${character.name}:`, error);
            // Continue with next character
        }
    }

    return assets;
}

/**
 * Generate imagery assets based on brand imagery guidelines using Janus-1.3B
 */
export async function generateImageryAssets(
    brandKit: BrandKit,
    referenceImageBase64?: string,
    onProgress?: (progress: string) => void
): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];
    
    if (!brandKit.imagery || !brandKit.imagery.style) {
        return assets;
    }

    const colors = [
        ...brandKit.colors.primary,
        ...brandKit.colors.secondary,
        ...brandKit.colors.accent,
    ].map(c => c.hex);

    const style = brandKit.designLanguage || 
        (brandKit.communicationStyle 
            ? `${brandKit.communicationStyle.formality} ${brandKit.communicationStyle.communicationApproach} style`
            : 'professional');

    // Generate imagery based on themes
    const themes = brandKit.imagery.themes || ['main theme'];
    
    for (let i = 0; i < themes.slice(0, 3).length; i++) {
        const theme = themes[i];
        try {
            onProgress?.(`Generating imagery: ${theme} (${i + 1}/3)...`);
            const prompt = `${brandKit.imagery.style}. Theme: ${theme}. ${style}. Use brand colors: ${colors.join(', ')}. High quality, detailed illustration.`;
            
            const base64 = await generateLogoWithJanus(
                prompt,
                style,
                colors,
                referenceImageBase64,
                (msg) => onProgress?.(`${theme}: ${msg}`)
            );
            
            assets.push({
                type: 'illustration',
                variant: theme.toLowerCase().replace(/\s+/g, '-'),
                base64,
                format: 'png',
                dimensions: { width: 512, height: 512 },
                description: `${theme} - ${brandKit.imagery.style}`,
                source: 'janus-generated',
            });
        } catch (error) {
            console.error(`Error generating imagery for theme ${theme}:`, error);
            // Continue with next theme
        }
    }

    return assets;
}

/**
 * Generate pattern assets using Janus-1.3B
 */
export async function generatePatternAssets(
    brandKit: BrandKit,
    referenceImageBase64?: string,
    onProgress?: (progress: string) => void
): Promise<GeneratedAsset[]> {
    const assets: GeneratedAsset[] = [];
    const colors = [
        ...brandKit.colors.primary,
        ...brandKit.colors.secondary,
    ].map(c => c.hex);

    if (colors.length === 0) return assets;

    // Get pattern descriptions from graphics
    const patternDescriptions = brandKit.graphics?.patterns || [
        'geometric pattern',
        'subtle texture',
        'minimal background pattern'
    ];

    for (let i = 0; i < patternDescriptions.slice(0, 3).length; i++) {
        const patternDesc = patternDescriptions[i];
        try {
            onProgress?.(`Generating pattern: ${patternDesc} (${i + 1}/3)...`);
            const base64 = await generatePatternWithJanus(
                patternDesc,
                colors,
                'geometric',
                referenceImageBase64,
                (msg) => onProgress?.(`Pattern ${i + 1}: ${msg}`)
            );
            
            assets.push({
                type: 'pattern',
                variant: patternDesc.toLowerCase().replace(/\s+/g, '-'),
                base64,
                format: 'png',
                dimensions: { width: 512, height: 512 },
                description: patternDesc,
                source: 'janus-generated',
            });
        } catch (error) {
            console.error(`Error generating pattern "${patternDesc}":`, error);
            // Continue with next pattern
        }
    }

    return assets;
}

/**
 * Generate comprehensive brand kit with all assets using Janus and Mistral
 * This is the main function that creates a complete brand kit similar to the Moksha'25 example
 */
export async function generateComprehensiveBrandKit(
    brandKit: BrandKit,
    options: {
        generateLogos?: boolean;
        generateCharacters?: boolean;
        generatePatterns?: boolean;
        generateImagery?: boolean;
        extractGraphics?: boolean;
        referenceImageBase64?: string;
        extractionResult?: MistralExtractionResult;
        onProgress?: (progress: string) => void;
    } = {}
): Promise<BrandKit> {
    const {
        generateLogos = true,
        generateCharacters = true,
        generatePatterns = true,
        generateImagery = true,
        extractGraphics = true,
        referenceImageBase64,
        extractionResult,
        onProgress,
    } = options;

    const enhanced: BrandKit = {
        ...brandKit,
        colorPatterns: generateColorPatterns(brandKit),
        colorThemes: generateColorThemes(brandKit),
        typographySystem: generateTypographySystem(brandKit),
    };

    const allAssets: GeneratedAsset[] = [];

    // IMAGE GENERATION DISABLED - Commented out to remove Janus image generation
    // Generate logo assets if requested
    // if (generateLogos) {
    //     try {
    //         onProgress?.("Starting logo generation with Janus...");
    //         const logos = await generateLogoAssets(brandKit, undefined, referenceImageBase64, onProgress);
    //         allAssets.push(...logos);
    //         onProgress?.(`✅ Generated ${logos.length} logo assets`);
    //     } catch (error) {
    //         console.error("Error generating logos:", error);
    //         onProgress?.("⚠️ Logo generation encountered an error, continuing...");
    //     }
    // }

    // Generate character assets if requested
    // if (generateCharacters && brandKit.characters && brandKit.characters.length > 0) {
    //     try {
    //         onProgress?.("Starting character generation with Janus...");
    //         const characters = await generateCharacterAssets(brandKit, referenceImageBase64, onProgress);
    //         allAssets.push(...characters);
    //         onProgress?.(`✅ Generated ${characters.length} character assets`);
    //     } catch (error) {
    //         console.error("Error generating characters:", error);
    //         onProgress?.("⚠️ Character generation encountered an error, continuing...");
    //     }
    // }

    // Generate pattern assets if requested
    // if (generatePatterns) {
    //     try {
    //         onProgress?.("Starting pattern generation with Janus...");
    //         const patterns = await generatePatternAssets(brandKit, referenceImageBase64, onProgress);
    //         allAssets.push(...patterns);
    //         onProgress?.(`✅ Generated ${patterns.length} pattern assets`);
    //     } catch (error) {
    //         console.error("Error generating patterns:", error);
    //         onProgress?.("⚠️ Pattern generation encountered an error, continuing...");
    //     }
    // }

    // Generate imagery assets if requested
    // if (generateImagery && brandKit.imagery) {
    //     try {
    //         onProgress?.("Starting imagery generation with Janus...");
    //         const imagery = await generateImageryAssets(brandKit, referenceImageBase64, onProgress);
    //         allAssets.push(...imagery);
    //         onProgress?.(`✅ Generated ${imagery.length} imagery assets`);
    //     } catch (error) {
    //         console.error("Error generating imagery:", error);
    //         onProgress?.("⚠️ Imagery generation encountered an error, continuing...");
    //     }
    // }

    enhanced.generatedAssets = allAssets;
    // console.log(`✅ Total generated assets: ${allAssets.length}`);

    // Extract graphics from uploaded image if available
    // Try GPT-4 Vision first for better accuracy, fallback to Mistral positions
    if (extractGraphics && referenceImageBase64) {
        try {
            onProgress?.("Extracting graphics and logos from uploaded image...");
            
            let graphicsToExtract: Array<{
                name: string;
                type: string;
                description?: string;
                position: { x: number; y: number; width: number; height: number; };
                usage?: string;
            }> = [];
            
            // Try GPT-4 Vision first for more accurate positions
            try {
                const { extractGraphicsWithGPT4Vision } = await import("./gpt4VisionService");
                onProgress?.("Using GPT-4 Vision for precise graphics detection...");
                const gpt4Graphics = await extractGraphicsWithGPT4Vision(referenceImageBase64, "image/png");
                if (gpt4Graphics && gpt4Graphics.length > 0) {
                    graphicsToExtract = gpt4Graphics;
                    onProgress?.(`✅ GPT-4 Vision detected ${gpt4Graphics.length} graphics`);
                }
            } catch (gpt4Error) {
                console.log("GPT-4 Vision not available, using Mistral positions:", gpt4Error);
                // Fallback to Mistral positions
                const visibleLogos = extractionResult?.graphics?.visible_logos || 
                                    (brandKit as any).graphics?.visible_logos;
                if (visibleLogos && visibleLogos.length > 0) {
                    graphicsToExtract = visibleLogos;
                    onProgress?.("Using Mistral-detected graphics positions...");
                }
            }
            
            // Extract graphics using detected positions
            if (graphicsToExtract.length > 0) {
                const extractedGraphics = await extractGraphicsFromImage(
                    referenceImageBase64,
                    graphicsToExtract,
                    onProgress
                );
                
                if (extractedGraphics.length > 0) {
                    if (!enhanced.graphics) {
                        enhanced.graphics = {};
                    }
                    enhanced.graphics.extractedGraphics = extractedGraphics;
                    onProgress?.(`✅ Extracted ${extractedGraphics.length} graphics from image`);
                }
            } else {
                onProgress?.("⚠️ No graphics detected in image");
            }
        } catch (error) {
            console.error("Error extracting graphics:", error);
            onProgress?.("⚠️ Graphic extraction encountered an error, continuing...");
        }
    }

    return enhanced;
}

/**
 * Enhance brand kit with comprehensive features (backward compatibility)
 */
export async function enhanceBrandKit(
    brandKit: BrandKit,
    generateLogos: boolean = true,
    generatePatterns: boolean = true
): Promise<BrandKit> {
    return generateComprehensiveBrandKit(brandKit, {
        generateLogos,
        generatePatterns,
        generateCharacters: true,
        generateImagery: true,
    });
}
