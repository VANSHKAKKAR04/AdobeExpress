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
}

export interface BrandSpacing {
    baseUnit: number;
    sectionGap: number;
    paragraphGap: number;
    elementPadding: number;
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
    };
    spacing?: {
        base_unit: number;
        section_gap: number;
        paragraph_gap?: number;
        element_padding?: number;
    };
    tone?: string;
}
