/**
 * Multi-Platform Design Converter Service
 * Converts one design to multiple platform-optimized versions
 */

import { BrandKit } from "../models/BrandKit";
import { queryMistral } from "./mistralService";

/**
 * Platform-specific design requirements
 */
export interface PlatformSpec {
    name: string;
    aspectRatio: { width: number; height: number };
    safeZone: { top: number; right: number; bottom: number; left: number };
    ctaZone: 'top' | 'center' | 'bottom';
    colorPsychology: 'formal' | 'bold' | 'vibrant' | 'minimal';
    headlineStyle: 'short' | 'medium' | 'long';
    maxTextLength: number;
}

/**
 * Platform specifications
 */
export const PLATFORM_SPECS: Record<string, PlatformSpec> = {
    instagram: {
        name: 'Instagram Post',
        aspectRatio: { width: 1080, height: 1080 },
        safeZone: { top: 50, right: 50, bottom: 200, left: 50 },
        ctaZone: 'bottom',
        colorPsychology: 'vibrant',
        headlineStyle: 'short',
        maxTextLength: 125
    },
    instagram_story: {
        name: 'Instagram Story',
        aspectRatio: { width: 1080, height: 1920 },
        safeZone: { top: 200, right: 50, bottom: 300, left: 50 },
        ctaZone: 'center',
        colorPsychology: 'bold',
        headlineStyle: 'short',
        maxTextLength: 50
    },
    linkedin: {
        name: 'LinkedIn Post',
        aspectRatio: { width: 1200, height: 627 },
        safeZone: { top: 40, right: 40, bottom: 150, left: 40 },
        ctaZone: 'bottom',
        colorPsychology: 'formal',
        headlineStyle: 'medium',
        maxTextLength: 150
    },
    pinterest: {
        name: 'Pinterest Pin',
        aspectRatio: { width: 1000, height: 1500 },
        safeZone: { top: 50, right: 50, bottom: 200, left: 50 },
        ctaZone: 'top',
        colorPsychology: 'vibrant',
        headlineStyle: 'long',
        maxTextLength: 200
    },
    youtube_thumbnail: {
        name: 'YouTube Thumbnail',
        aspectRatio: { width: 1280, height: 720 },
        safeZone: { top: 40, right: 40, bottom: 120, left: 40 },
        ctaZone: 'top',
        colorPsychology: 'bold',
        headlineStyle: 'short',
        maxTextLength: 60
    },
    tiktok: {
        name: 'TikTok',
        aspectRatio: { width: 1080, height: 1920 },
        safeZone: { top: 200, right: 50, bottom: 300, left: 50 },
        ctaZone: 'center',
        colorPsychology: 'vibrant',
        headlineStyle: 'short',
        maxTextLength: 100
    },
    twitter: {
        name: 'Twitter/X Post',
        aspectRatio: { width: 1200, height: 675 },
        safeZone: { top: 40, right: 40, bottom: 120, left: 40 },
        ctaZone: 'center',
        colorPsychology: 'bold',
        headlineStyle: 'short',
        maxTextLength: 100
    }
};

/**
 * Analyze design layout using vision model
 */
export async function analyzeDesignLayout(
    designImageBase64: string,
    mimeType: string
): Promise<{
    elements: Array<{
        type: 'text' | 'image' | 'logo' | 'cta' | 'background';
        position: { x: number; y: number; width: number; height: number };
        content?: string;
        importance: 'high' | 'medium' | 'low';
    }>;
    colorScheme: string[];
    layoutType: 'centered' | 'grid' | 'asymmetric' | 'minimal';
    primaryMessage: string;
}> {
    const prompt = `Analyze this design layout and return a JSON object describing its structure:

{
  "elements": [
    {
      "type": "text|image|logo|cta|background",
      "position": { "x": number, "y": number, "width": number, "height": number },
      "content": "text content if type is text",
      "importance": "high|medium|low"
    }
  ],
  "colorScheme": ["#hex1", "#hex2"],
  "layoutType": "centered|grid|asymmetric|minimal",
  "primaryMessage": "main message or headline"
}

Identify all visual elements, their positions (as percentages 0-100), and importance. Return ONLY valid JSON.`;

    const response = await queryMistral(prompt, designImageBase64, mimeType, "pixtral-large-latest");
    
    // Clean and parse response
    let jsonText = response.trim();
    if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/g, "");
    }

    return JSON.parse(jsonText);
}

/**
 * Generate platform-specific headline using text model
 */
export async function generatePlatformHeadline(
    originalMessage: string,
    platform: string,
    brandKit: BrandKit,
    platformSpec: PlatformSpec
): Promise<string> {
    const communicationStyle = brandKit.communicationStyle 
        ? `Brand communication style: ${brandKit.communicationStyle.formality}, ${brandKit.communicationStyle.languageStyle}, ${brandKit.communicationStyle.communicationApproach}`
        : '';

    const prompt = `Generate a platform-specific headline for ${platformSpec.name}.

Original message: "${originalMessage}"

Platform requirements:
- Max length: ${platformSpec.maxTextLength} characters
- Style: ${platformSpec.headlineStyle}
- Color psychology: ${platformSpec.colorPsychology}
- CTA zone: ${platformSpec.ctaZone}
${communicationStyle}

Generate a catchy, platform-optimized headline that:
1. Fits the platform's audience and style
2. Maintains the original message intent
3. Uses appropriate tone for the platform
4. Is engaging and shareable

Return ONLY the headline text, no quotes or explanations.`;

    const response = await queryMistral(prompt, undefined, undefined, "mistral-large-latest");
    return response.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
}

/**
 * Generate platform-specific caption
 */
export async function generatePlatformCaption(
    originalMessage: string,
    platform: string,
    brandKit: BrandKit
): Promise<string> {
    const communicationStyle = brandKit.communicationStyle 
        ? `Brand communication style: ${brandKit.communicationStyle.formality}, ${brandKit.communicationStyle.languageStyle}`
        : '';

    const platformGuidelines: Record<string, string> = {
        instagram: 'Use emojis, hashtags (3-5), engaging and visual language',
        linkedin: 'Professional tone, value-driven, no emojis, industry-focused',
        pinterest: 'Descriptive, keyword-rich, actionable, DIY-friendly',
        youtube_thumbnail: 'Click-worthy, question-based, curiosity-driven',
        tiktok: 'Trendy, short, punchy, use trending sounds context',
        twitter: 'Concise, witty, news-worthy, engagement-focused'
    };

    const prompt = `Generate a ${platform} caption for this content:

Original: "${originalMessage}"
${communicationStyle}

Platform guidelines: ${platformGuidelines[platform] || 'Engaging and platform-appropriate'}

Generate a caption that:
1. Matches ${platform} style and audience
2. Includes appropriate hashtags/formatting for ${platform}
3. Maintains brand voice
4. Is optimized for engagement

Return ONLY the caption text.`;

    const response = await queryMistral(prompt, undefined, undefined, "mistral-large-latest");
    return response.trim();
}

/**
 * Apply brand kit styling to raw design
 * This is the first step: recolor, refine typography, align spacing
 */
export async function applyBrandKitToDesign(
    rawDesignImageBase64: string,
    mimeType: string,
    brandKit: BrandKit
): Promise<{
    styledLayout: {
        elements: Array<{
            type: 'text' | 'image' | 'logo' | 'cta' | 'background';
            position: { x: number; y: number; width: number; height: number };
            content?: string;
            importance: 'high' | 'medium' | 'low';
            // Brand kit styling applied
            brandColor?: string; // Applied brand color hex
            brandFont?: { family: string; weight: string; size?: number }; // Applied brand typography
            spacing?: { margin: number; padding: number }; // Applied brand spacing
        }>;
        colorScheme: string[]; // Brand kit colors
        layoutType: 'centered' | 'grid' | 'asymmetric' | 'minimal';
        primaryMessage: string;
    };
    stylingInstructions: {
        colorMapping: Array<{ original: string; brand: string }>; // Map original colors to brand colors
        typographyMapping: Array<{ element: string; brandFont: string }>; // Map text elements to brand fonts
        spacingAdjustments: Array<{ element: string; spacing: number }>; // Spacing adjustments
    };
}> {
    // Step 1: Analyze raw design
    const rawLayout = await analyzeDesignLayout(rawDesignImageBase64, mimeType);

    // Step 2: Generate styling instructions using AI
    const stylingPrompt = `Analyze this raw design and the brand kit, then provide styling instructions.

Raw Design Analysis:
- Colors found: ${rawLayout.colorScheme.join(', ')}
- Layout type: ${rawLayout.layoutType}
- Primary message: "${rawLayout.primaryMessage}"

Brand Kit:
- Primary colors: ${brandKit.colors.primary.map(c => c.hex).join(', ')}
- Secondary colors: ${brandKit.colors.secondary.map(c => c.hex).join(', ')}
- Typography: ${brandKit.typography.map(t => `${t.role}: ${t.fontFamily} ${t.fontWeight}`).join(', ')}
- Spacing base unit: ${brandKit.spacing.baseUnit}px

Return a JSON object with styling instructions:
{
  "colorMapping": [
    { "original": "#hex", "brand": "#hex", "reason": "why this mapping" }
  ],
  "typographyMapping": [
    { "element": "headline|body|cta", "brandFont": "font family name", "weight": "bold|regular", "reason": "why" }
  ],
  "spacingAdjustments": [
    { "element": "element description", "spacing": number_in_pixels, "reason": "why" }
  ]
}

Map original colors to brand colors intelligently (e.g., bright colors → brand primary, neutrals → brand neutrals).
Apply brand typography to text elements based on their role.
Adjust spacing to match brand spacing system.
Return ONLY valid JSON.`;

    const stylingResponse = await queryMistral(
        stylingPrompt,
        rawDesignImageBase64,
        mimeType,
        "pixtral-large-latest"
    );

    // Clean and parse styling instructions
    let stylingJson = stylingResponse.trim();
    if (stylingJson.startsWith("```json")) {
        stylingJson = stylingJson.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (stylingJson.startsWith("```")) {
        stylingJson = stylingJson.replace(/```\n?/g, "");
    }

    const stylingInstructions = JSON.parse(stylingJson);

    // Step 3: Apply styling to layout elements
    const styledElements = rawLayout.elements.map(element => {
        const styledElement: any = { ...element };

        // Apply brand colors
        if (element.type === 'text' || element.type === 'cta' || element.type === 'background') {
            const colorMap = stylingInstructions.colorMapping?.find(
                (m: any) => rawLayout.colorScheme.includes(m.original)
            );
            if (colorMap) {
                styledElement.brandColor = colorMap.brand;
            } else if (brandKit.colors.primary.length > 0) {
                // Default to primary brand color
                styledElement.brandColor = brandKit.colors.primary[0].hex;
            }
        }

        // Apply brand typography to text elements
        if (element.type === 'text' || element.type === 'cta') {
            const typoMap = stylingInstructions.typographyMapping?.find(
                (m: any) => element.content && m.element
            );
            if (typoMap) {
                const brandTypo = brandKit.typography.find(
                    t => t.fontFamily.toLowerCase().includes(typoMap.brandFont.toLowerCase()) ||
                         typoMap.brandFont.toLowerCase().includes(t.fontFamily.toLowerCase())
                ) || brandKit.typography.find(t => t.role === 'body') || brandKit.typography[0];
                
                if (brandTypo) {
                    styledElement.brandFont = {
                        family: brandTypo.fontFamily,
                        weight: typoMap.weight || brandTypo.fontWeight,
                        size: brandTypo.fontSize
                    };
                }
            } else if (brandKit.typography.length > 0) {
                // Default typography
                const defaultTypo = brandKit.typography.find(t => t.role === 'body') || brandKit.typography[0];
                styledElement.brandFont = {
                    family: defaultTypo.fontFamily,
                    weight: defaultTypo.fontWeight,
                    size: defaultTypo.fontSize
                };
            }
        }

        // Apply brand spacing
        const spacingAdj = stylingInstructions.spacingAdjustments?.find(
            (s: any) => s.element && element.content?.includes(s.element)
        );
        if (spacingAdj) {
            styledElement.spacing = {
                margin: spacingAdj.spacing,
                padding: brandKit.spacing.elementPadding
            };
        } else {
            styledElement.spacing = {
                margin: brandKit.spacing.sectionGap,
                padding: brandKit.spacing.elementPadding
            };
        }

        return styledElement;
    });

    return {
        styledLayout: {
            ...rawLayout,
            elements: styledElements,
            colorScheme: brandKit.colors.primary.map(c => c.hex)
        },
        stylingInstructions
    };
}

/**
 * Convert brand-styled design to platform-optimized version
 * This is the second step: take the styled design and adapt it for specific platforms
 */
export async function convertToPlatform(
    rawDesignImageBase64: string,
    mimeType: string,
    platform: string,
    brandKit: BrandKit
): Promise<{
    platform: string;
    aspectRatio: { width: number; height: number };
    styledLayout: any; // Brand kit styled layout
    adaptedLayout: any; // Platform-adapted layout instructions for Adobe Express API
    headline: string;
    caption: string;
    brandColors: string[]; // Applied brand colors
}> {
    const platformSpec = PLATFORM_SPECS[platform];
    if (!platformSpec) {
        throw new Error(`Unknown platform: ${platform}`);
    }

    // Step 1: Apply brand kit to raw design (recolor, refine typography, spacing)
    const { styledLayout, stylingInstructions } = await applyBrandKitToDesign(
        rawDesignImageBase64,
        mimeType,
        brandKit
    );

    // Step 2: Generate platform-specific copy
    const headline = await generatePlatformHeadline(
        styledLayout.primaryMessage,
        platform,
        brandKit,
        platformSpec
    );

    const caption = await generatePlatformCaption(
        styledLayout.primaryMessage,
        platform,
        brandKit
    );

    // Step 3: Create platform-adapted layout instructions
    const adaptedLayout = adaptLayoutForPlatform(
        styledLayout,
        platformSpec,
        brandKit
    );

    return {
        platform,
        aspectRatio: platformSpec.aspectRatio,
        styledLayout: {
            ...styledLayout,
            stylingInstructions
        },
        adaptedLayout,
        headline,
        caption,
        brandColors: brandKit.colors.primary.map(c => c.hex)
    };
}

/**
 * Convert raw design to all platforms at once
 */
export async function convertToAllPlatforms(
    rawDesignImageBase64: string,
    mimeType: string,
    brandKit: BrandKit,
    platforms: string[] = ['linkedin', 'instagram', 'youtube_thumbnail']
): Promise<Array<Awaited<ReturnType<typeof convertToPlatform>>>> {
    // First apply brand kit once (shared step)
    const { styledLayout, stylingInstructions } = await applyBrandKitToDesign(
        rawDesignImageBase64,
        mimeType,
        brandKit
    );

    // Then convert to each platform
    const conversions = await Promise.all(
        platforms.map(async (platform) => {
            const platformSpec = PLATFORM_SPECS[platform];
            if (!platformSpec) {
                throw new Error(`Unknown platform: ${platform}`);
            }

            const headline = await generatePlatformHeadline(
                styledLayout.primaryMessage,
                platform,
                brandKit,
                platformSpec
            );

            const caption = await generatePlatformCaption(
                styledLayout.primaryMessage,
                platform,
                brandKit
            );

            const adaptedLayout = adaptLayoutForPlatform(
                styledLayout,
                platformSpec,
                brandKit
            );

            return {
                platform,
                aspectRatio: platformSpec.aspectRatio,
                styledLayout: {
                    ...styledLayout,
                    stylingInstructions
                },
                adaptedLayout,
                headline,
                caption,
                brandColors: brandKit.colors.primary.map(c => c.hex)
            };
        })
    );

    return conversions;
}

/**
 * Adapt layout for platform (heuristic-based, can be enhanced)
 * Takes the brand-styled layout and adapts it for platform dimensions
 */
function adaptLayoutForPlatform(
    styledLayout: Awaited<ReturnType<typeof applyBrandKitToDesign>>['styledLayout'],
    platformSpec: PlatformSpec,
    brandKit: BrandKit
): any {
    // This contains instructions for Adobe Express API
    // to resize canvas, reposition elements, and apply platform-specific adjustments
    return {
        canvasSize: platformSpec.aspectRatio,
        safeZone: platformSpec.safeZone,
        elementPositions: styledLayout.elements.map(el => ({
            ...el,
            // Reposition based on platform safe zones while maintaining brand styling
            adjustedPosition: calculateAdjustedPosition(el.position, platformSpec),
            // Keep brand styling (colors, fonts, spacing) from previous step
            brandColor: el.brandColor,
            brandFont: el.brandFont,
            spacing: el.spacing
        })),
        // Platform-specific color adjustments (subtle, maintain brand identity)
        colorAdjustments: adaptColorsForPlatform(brandKit, platformSpec),
        // Platform-specific typography scaling
        typographyScaling: {
            headline: platformSpec.headlineStyle === 'short' ? 0.9 : 1.0,
            body: platformSpec.maxTextLength < 100 ? 0.85 : 1.0
        }
    };
}

function calculateAdjustedPosition(
    original: { x: number; y: number; width: number; height: number },
    spec: PlatformSpec
): { x: number; y: number; width: number; height: number } {
    // Simple heuristic: maintain relative positions within safe zone
    const safeWidth = 100 - spec.safeZone.left - spec.safeZone.right;
    const safeHeight = 100 - spec.safeZone.top - spec.safeZone.bottom;
    
    return {
        x: spec.safeZone.left + (original.x * safeWidth / 100),
        y: spec.safeZone.top + (original.y * safeHeight / 100),
        width: original.width * (safeWidth / 100),
        height: original.height * (safeHeight / 100)
    };
}

function adaptColorsForPlatform(
    brandKit: BrandKit,
    spec: PlatformSpec
): string[] {
    // Adjust color intensity based on platform psychology
    const colors = [
        ...brandKit.colors.primary,
        ...brandKit.colors.secondary,
        ...brandKit.colors.accent
    ].map(c => c.hex);

    // For now, return original colors
    // Could add color psychology adjustments here
    return colors.slice(0, 3);
}
