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
}

export interface BrandGraphics {
    patterns?: string[]; // Descriptions of patterns used
    illustrations?: string; // Description of illustration style
    icons?: BrandIcon[];
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

export interface BrandKit {
    colors: {
        primary: BrandColor[];
        secondary: BrandColor[];
        accent: BrandColor[];
        neutral: BrandColor[];
    };
    typography: BrandTypography[];
    logos: BrandLogo;
    spacing: BrandSpacing;
    graphics?: BrandGraphics;
    contrastRules?: ContrastRule[];
    communicationStyle?: CommunicationStyle; // Inferred communication rules for AI content generation
    tone?: string; // Brand tone description
    guidelines?: string; // Generated guidelines text
}

export interface MistralExtractionResult {
    colors: {
        primary: string[];
        secondary: string[];
        accent: string[];
        neutral?: string[];
    };
    typography: {
        heading?: {
            font: string;
            weight: string;
            size?: number;
        };
        subheading?: {
            font: string;
            weight: string;
            size?: number;
        };
        body?: {
            font: string;
            weight: string;
            size?: number;
        };
        caption?: {
            font: string;
            weight: string;
            size?: number;
        };
    };
    logos?: {
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
    graphics?: {
        patterns?: string[];
        illustrations?: string;
        icons?: Array<{
            name: string;
            description?: string;
            usage?: string;
            category?: string;
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
}
