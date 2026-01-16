/**
 * Brand Kit data model extracted from images
 */

export interface BrandColor {
    hex: string;
    rgb: { red: number; green: number; blue: number };
    role: 'primary' | 'secondary' | 'accent' | 'background' | 'foreground' | 'neutral';
    usage?: string;
}

export interface BrandTypography {
    role: 'heading' | 'subheading' | 'body' | 'caption';
    fontFamily: string;
    fontWeight: 'light' | 'regular' | 'medium' | 'bold' | 'black';
    fontSize?: number;
    lineHeight?: number;
    letterSpacing?: number;
}

export interface BrandLogo {
    full: string; // base64 PNG
    icon?: string; // base64 PNG (icon mark only)
    monochrome?: string; // base64 PNG
    inverted?: string; // base64 PNG (for dark backgrounds)
    variations?: {
        horizontal?: string; // base64 PNG
        vertical?: string; // base64 PNG
        stacked?: string; // base64 PNG
    };
    styles?: {
        clearSpace?: string; // Minimum clear space requirement (e.g., "2x logo height")
        minSize?: string; // Minimum size requirement (e.g., "24px")
        usage?: string[]; // Usage guidelines
        donts?: string[]; // What not to do
    };
}

export interface BrandSpacing {
    baseUnit: number;
    sectionGap: number;
    paragraphGap: number;
    elementPadding: number;
}

export interface BrandIcon {
    name: string;
    description?: string;
    usage?: string;
    category?: 'social' | 'navigation' | 'action' | 'decorative' | 'other';
    imageBase64?: string; // Extracted icon image
    dimensions?: { width: number; height: number };
}

export interface ExtractedGraphic {
    name: string;
    type: 'logo' | 'icon' | 'badge' | 'emblem' | 'symbol' | 'graphic';
    description?: string;
    imageBase64: string; // Cropped/extracted image
    dimensions: { width: number; height: number };
    position?: { x: number; y: number; width: number; height: number }; // Original position in image (percentages)
    usage?: string;
}

export interface BrandGraphics {
    patterns?: string[]; // Descriptions of patterns used
    illustrations?: string; // Description of illustration style
    icons?: BrandIcon[];
    extractedGraphics?: ExtractedGraphic[]; // Graphics/logos extracted from the uploaded image
}

export interface ContrastRule {
    colorPair: {
        foreground: string; // hex color
        background: string; // hex color
    };
    ratio: number; // WCAG contrast ratio (e.g., 4.5 for AA, 7 for AAA)
    level: 'AA' | 'AAA' | 'AA-Large' | 'AAA-Large';
    usage?: string; // When to use this combination
}

/**
 * Communication style rules inferred from brand materials
 * These are used internally for AI-generated content to maintain brand consistency
 */
export interface CommunicationStyle {
    formality: 'formal' | 'casual' | 'neutral'; // Brand tone formality level
    languageStyle: 'promotional' | 'informative' | 'educational' | 'conversational'; // How brand communicates
    audienceType: 'enterprise' | 'consumer' | 'startup' | 'creator' | 'professional'; // Target audience
    ctaStyle: 'aggressive' | 'subtle' | 'moderate'; // Call-to-action approach
    communicationApproach: 'direct' | 'friendly' | 'authoritative' | 'approachable'; // Overall communication tone
}

/**
 * Color patterns and harmonies extracted from brand
 */
export interface ColorPattern {
    type: 'gradient' | 'harmony' | 'theme' | 'complementary' | 'triadic' | 'analogous';
    name: string;
    colors: string[]; // hex colors
    direction?: 'horizontal' | 'vertical' | 'radial' | 'diagonal';
    stops?: number[]; // gradient stops (0-1)
    description?: string;
    usage?: string; // When to use this pattern
}

/**
 * Color theme variations (light, dark, seasonal)
 */
export interface ColorTheme {
    name: string;
    variant: 'light' | 'dark' | 'seasonal' | 'high-contrast' | 'muted';
    colors: {
        primary: string[];
        secondary: string[];
        accent: string[];
        background: string;
        foreground: string;
        neutral: string[];
    };
    description?: string;
    useCase?: string; // When to use this theme
}

/**
 * Generated visual assets (logos, patterns, textures)
 */
export interface GeneratedAsset {
    type: 'logo' | 'pattern' | 'texture' | 'icon' | 'illustration';
    variant: string; // e.g., 'full', 'icon', 'monochrome', 'gradient-pattern'
    base64: string; // base64 encoded image
    format: 'png' | 'svg' | 'jpg';
    dimensions?: { width: number; height: number };
    description?: string;
    source?: 'janus-generated' | 'extracted' | 'inspired';
}

/**
 * Layout template structures
 */
export interface LayoutTemplate {
    name: string;
    type: 'hero' | 'card' | 'grid' | 'sidebar' | 'fullscreen' | 'magazine' | 'minimal';
    structure: {
        sections: Array<{
            name: string;
            position: { x: number; y: number; width: number; height: number }; // percentages
            content: 'text' | 'image' | 'logo' | 'cta' | 'navigation' | 'footer';
            recommendedColors?: string[]; // hex colors
        }>;
    };
    usage?: string;
    example?: string; // base64 preview image
}

/**
 * Typography system with detailed specifications
 */
export interface TypographySystem {
    fontFamilies: {
        primary: string;
        secondary?: string;
        accent?: string;
        monospace?: string;
    };
    scale: {
        base: number; // base font size
        ratio: number; // modular scale ratio (e.g., 1.25 for Major Third)
        sizes: {
            display?: number;
            h1?: number;
            h2?: number;
            h3?: number;
            h4?: number;
            body?: number;
            small?: number;
            caption?: number;
        };
    };
    weights: {
        light?: number;
        regular: number;
        medium?: number;
        bold: number;
        black?: number;
    };
    lineHeights: {
        tight: number;
        normal: number;
        relaxed: number;
    };
    letterSpacing?: {
        tight: number;
        normal: number;
        wide: number;
    };
}

export interface BrandKit {
    // Core Brand Elements
    brandName?: string;
    brandYear?: string;
    designLanguage?: string;
    colors: {
        primary: BrandColor[];
        secondary: BrandColor[];
        accent: BrandColor[];
        neutral: BrandColor[];
    };
    typography: BrandTypography[];
    typographySystem?: TypographySystem; // Comprehensive typography system
    logos: BrandLogo;
    spacing: BrandSpacing;
    
    // Enhanced Features
    colorPatterns?: ColorPattern[]; // Gradients, harmonies, themes
    colorThemes?: ColorTheme[]; // Light/dark/seasonal variations
    generatedAssets?: GeneratedAsset[]; // AI-generated logos, patterns, textures
    layoutTemplates?: LayoutTemplate[]; // Pre-designed layout structures
    characters?: BrandCharacter[]; // Brand mascots and characters
    imagery?: BrandImagery; // Imagery guidelines and themes
    
    // Existing Features
    graphics?: BrandGraphics;
    contrastRules?: ContrastRule[];
    communicationStyle?: CommunicationStyle; // Inferred communication rules for AI content generation
    tone?: string; // Brand tone description
    brandMessage?: string; // Core brand message or tagline
    guidelines?: string; // Generated guidelines text
    
    // Metadata
    extractedFrom?: string; // Source file name
    extractionDate?: string; // ISO date string
    version?: string; // Brand kit version
}

export interface BrandCharacter {
    name: string;
    type: 'mascot' | 'character' | 'symbol';
    element?: 'earth' | 'water' | 'fire' | 'air' | 'other';
    description: string;
    usage?: string;
}

export interface BrandImagery {
    style?: string;
    guidelines?: string[];
    themes?: string[];
}

export interface MistralExtractionResult {
    brand_name?: string;
    brand_year?: string;
    design_language?: string;
    colors: {
        primary: string[];
        secondary: string[];
        accent: string[];
        neutral?: string[];
        background?: string[];
        foreground?: string[];
    };
    color_meaning?: {
        earth?: string[];
        water?: string[];
        fire?: string[];
        air?: string[];
    };
    typography: {
        heading?: {
            font: string;
            weight: string;
            size?: number;
            style?: string;
        };
        subheading?: {
            font: string;
            weight: string;
            size?: number;
            style?: string;
        };
        body?: {
            font: string;
            weight: string;
            size?: number;
            style?: string;
        };
        caption?: {
            font: string;
            weight: string;
            size?: number;
            style?: string;
        };
        display?: {
            font: string;
            weight: string;
            size?: number;
        };
    };
    logos?: {
        wordmark_description?: string;
        logomark_description?: string;
        logo_style?: string;
        full?: string;
        icon?: string;
        monochrome?: string;
        inverted?: string;
        variations?: {
            horizontal?: string;
            vertical?: string;
            stacked?: string;
        };
        styles?: {
            clear_space?: string;
            min_size?: string;
            usage?: string[];
            donts?: string[];
        };
    };
    spacing?: {
        base_unit: number;
        section_gap: number;
        paragraph_gap?: number;
        element_padding?: number;
    };
    characters?: Array<{
        name: string;
        type: string;
        element?: string;
        description: string;
        usage?: string;
    }>;
    imagery?: {
        style?: string;
        guidelines?: string[];
        themes?: string[];
    };
    graphics?: {
        patterns?: string[];
        illustrations?: string;
        icons?: Array<{
            name: string;
            description?: string;
            usage?: string;
            category?: string;
        }>;
        textures?: string[];
        visible_logos?: Array<{
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
        }>;
    };
    contrast_rules?: Array<{
        foreground: string;
        background: string;
        ratio?: number;
        level?: string;
        usage?: string;
    }>;
    communication_style?: {
        formality?: 'formal' | 'casual' | 'neutral';
        language_style?: 'promotional' | 'informative' | 'educational' | 'conversational';
        audience_type?: 'enterprise' | 'consumer' | 'startup' | 'creator' | 'professional';
        cta_style?: 'aggressive' | 'subtle' | 'moderate';
        communication_approach?: 'direct' | 'friendly' | 'authoritative' | 'approachable';
    };
    tone?: string;
    brand_message?: string;
}
