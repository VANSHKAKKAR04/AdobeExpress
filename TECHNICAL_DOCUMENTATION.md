# Auto Brand Kit Rebuilder - Technical Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Core Features](#core-features)
4. [Technical Stack](#technical-stack)
5. [Project Structure](#project-structure)
6. [Component Details](#component-details)
7. [Data Flow](#data-flow)
8. [API Integration](#api-integration)
9. [Current Limitations](#current-limitations)
10. [Future Enhancements](#future-enhancements)

---

## Overview

**Auto Brand Kit Rebuilder** is an Adobe Express Add-on that reverse-engineers complete brand kits from screenshots, app UIs, PDFs, or images using multimodal AI (Mistral Vision API). The add-on extracts brand identity elements and provides tools to apply them to Adobe Express documents, generate brand guidelines, and convert designs for multiple social media platforms.

### Key Capabilities
- ✅ **AI-Powered Brand Extraction**: Analyzes images to extract colors, typography, spacing, logos, graphics, and communication style
- ✅ **Adobe Express Integration**: Applies extracted brand kits directly to Express documents
- ✅ **Brand Guidelines PDF**: Generates downloadable PDF documentation with complete brand usage guidelines
- ✅ **Multi-Platform Converter**: Converts raw designs to platform-optimized versions (Instagram, LinkedIn, YouTube, TikTok, etc.)

---

## Architecture

The add-on follows a **three-tier architecture**:

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Layer (React)                        │
│  - User Interface Components                                │
│  - State Management                                         │
│  - User Interactions                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ IPC Communication (Sandbox Proxy)
                     │
┌────────────────────▼────────────────────────────────────────┐
│              Services Layer (Business Logic)                │
│  - Mistral API Service (AI extraction)                      │
│  - Brand Kit Service (data transformation)                  │
│  - PDF Service (document generation)                        │
│  - Platform Converter Service (multi-platform conversion)   │
│  - Platform Download Service (file generation)              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ API Calls
                     │
┌────────────────────▼────────────────────────────────────────┐
│          Document Sandbox Layer (Adobe Express SDK)         │
│  - Document manipulation                                    │
│  - Color creation                                           │
│  - Text creation                                            │
│  - Shape/Element creation                                   │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Separation of Concerns**: UI, business logic, and document manipulation are cleanly separated
2. **TypeScript**: Full type safety across the codebase
3. **React + Spectrum Web Components**: Uses Adobe's design system for consistent UI
4. **AI-First Design**: Services are built around AI vision model capabilities
5. **Sandbox Architecture**: Adobe Express uses a sandbox model where document manipulation runs in isolation

---

## Core Features

### 1. Brand Kit Extraction

**What it does**: Analyzes uploaded images/screenshots to extract comprehensive brand identity information.

**Extracted Elements**:
- **Colors**: Primary, secondary, accent, and neutral colors (with hex and RGB values)
- **Typography**: Heading, subheading, body, and caption styles (font family, weight, size)
- **Spacing System**: Base unit, section gaps, paragraph gaps, element padding
- **Logos**: Logo variations, usage guidelines, clear space requirements, minimum size
- **Graphics**: Patterns, illustration styles, icon systems
- **Contrast Rules**: WCAG-compliant color combinations with ratios and usage guidelines
- **Communication Style**: Inferred brand voice (formality, language style, audience type, CTA style)

**Technology**: Mistral Pixtral Vision API (`pixtral-large-latest` or `pixtral-12b`)

**Implementation Location**: 
- `src/services/mistralService.ts` - API integration
- `src/services/brandKitService.ts` - Data transformation

### 2. Apply Brand Kit to Document

**What it does**: Creates a visual preview of the extracted brand kit directly in the Adobe Express document.

**Created Elements**:
- Color swatches (rectangles) for primary, secondary, and accent colors
- Color labels with hex codes
- Typography samples showing font hierarchy
- Organized layout with section labels

**Technology**: Adobe Express Document SDK (`express-document-sdk`)

**Implementation Location**: 
- `src/sandbox/code.ts` - `createBrandKitPreview()` function

### 3. Brand Guidelines PDF Generation

**What it does**: Generates a comprehensive PDF document with complete brand usage guidelines.

**PDF Contents**:
- Brand tone description
- Complete color palette with swatches and hex codes
- Typography rules for all text styles
- Spacing system documentation
- Logo usage guidelines (clear space, minimum size, dos and don'ts)
- Icons & graphics patterns
- Contrast rules (WCAG accessibility)
- Communication style (inferred rules)

**Technology**: jsPDF library

**Implementation Location**: 
- `src/services/pdfService.ts` - `generateBrandGuidelinesPDF()` function

### 4. Multi-Platform Design Converter

**What it does**: Converts a raw design to multiple platform-optimized versions, applying brand kit styling.

**Supported Platforms**:
- Instagram Post (1080x1080)
- Instagram Story (1080x1920)
- LinkedIn Post (1200x627)
- Pinterest Pin (1000x1500)
- YouTube Thumbnail (1280x720)
- TikTok (1080x1920)
- Twitter/X Post (1200x675)

**Conversion Process**:
1. **Analyze Raw Design**: Uses vision AI to identify layout elements, colors, and structure
2. **Apply Brand Kit**: Recolors, refines typography, and adjusts spacing to match brand
3. **Platform Adaptation**: Resizes to platform dimensions, adjusts safe zones, generates platform-specific copy
4. **Generate Platform-Specific Content**: AI generates headlines and captions optimized for each platform

**Outputs**:
- Platform-optimized design instructions
- Headlines and captions tailored to each platform
- Downloadable PDF and PNG files for each platform version
- Direct Adobe Express document creation option

**Technology**: 
- Mistral Vision API for layout analysis
- Mistral Text API for content generation
- Canvas API for PNG generation
- jsPDF for PDF generation

**Implementation Location**: 
- `src/services/platformConverterService.ts` - Core conversion logic
- `src/services/platformDownloadService.ts` - File generation

---

## Technical Stack

### Frontend
- **React 18.2.0**: UI framework
- **TypeScript 5.3.2**: Type safety
- **Spectrum Web Components**: Adobe's design system
  - `@swc-react/button`: Button components
  - `@swc-react/theme`: Theme system

### AI/ML
- **Mistral AI API**: Multimodal AI services
  - `pixtral-large-latest`: Vision model for image analysis
  - `pixtral-12b`: Alternative vision model
  - `mistral-large-latest`: Text model for content generation

### Adobe Express SDK
- **`@adobe/ccweb-add-on-scripts`**: Build tools and SDK
- **`express-document-sdk`**: Document manipulation APIs
- **`add-on-sdk-document-sandbox`**: Sandbox runtime

### Document Generation
- **jsPDF 2.5.1**: PDF generation library
- **Canvas API**: PNG image generation

### Build Tools
- **Webpack 5.98.0**: Module bundler
- **TypeScript Compiler**: Type checking and transpilation
- **dotenv-webpack**: Environment variable management

---

## Project Structure

```
AdobeExpress/
├── src/
│   ├── ui/                          # React UI Components
│   │   ├── components/
│   │   │   ├── App.tsx             # Main application component
│   │   │   ├── FileUpload.tsx      # File upload component
│   │   │   └── App.css             # Component styles
│   │   ├── index.tsx               # UI entry point
│   │   └── tsconfig.json           # TypeScript config for UI
│   │
│   ├── sandbox/                     # Adobe Express Document Sandbox
│   │   ├── code.ts                 # Document manipulation logic
│   │   └── tsconfig.json           # TypeScript config for sandbox
│   │
│   ├── services/                    # Business Logic Services
│   │   ├── mistralService.ts       # Mistral AI API integration
│   │   ├── brandKitService.ts      # Brand kit data transformation
│   │   ├── pdfService.ts           # PDF generation
│   │   ├── platformConverterService.ts  # Multi-platform conversion
│   │   └── platformDownloadService.ts   # File download generation
│   │
│   ├── models/                      # TypeScript Data Models
│   │   ├── BrandKit.ts             # Brand kit data structures
│   │   └── DocumentSandboxApi.ts   # Sandbox API interface
│   │
│   ├── manifest.json                # Add-on manifest
│   └── index.html                   # HTML entry point
│
├── dist/                            # Build output directory
├── package.json                     # Dependencies and scripts
├── webpack.config.js                # Webpack configuration
├── tsconfig.json                    # Root TypeScript config
└── .env                             # Environment variables (API keys)
```

---

## Component Details

### UI Components

#### `App.tsx` (Main Component)
**Location**: `src/ui/components/App.tsx`

**Purpose**: Main application component that orchestrates the entire user workflow.

**Key Responsibilities**:
- State management (idle, uploading, analyzing, ready, applying, converting, error)
- File upload handling
- API status checking
- Brand kit display and preview
- User action handlers (Apply, Download PDF, Reset, Platform Conversion)

**State Management**:
```typescript
- state: ProcessingState ("idle" | "uploading" | "analyzing" | "ready" | "applying" | "converting" | "error")
- brandKit: BrandKit | null
- error: string | null
- apiStatus: API connection status
- selectedPlatforms: string[]
- platformResults: Platform conversion results
```

**Key Functions**:
- `handleFileSelect()`: Initiates brand kit extraction
- `handleApplyBrandKit()`: Applies brand kit to Express document
- `handleDownloadPDF()`: Generates and downloads PDF guidelines
- `handleRawDesignSelect()`: Initiates multi-platform conversion

#### `FileUpload.tsx`
**Location**: `src/ui/components/FileUpload.tsx`

**Purpose**: Reusable file upload component.

**Features**:
- Hidden file input with button trigger
- Accepts images and PDFs
- Disabled state support

---

### Services

#### `mistralService.ts`
**Location**: `src/services/mistralService.ts`

**Purpose**: Integration with Mistral AI API for vision and text generation.

**Key Functions**:

1. **`queryMistral()`**
   - Generic function to query Mistral API
   - Supports text-only and vision (image) requests
   - Handles different models (vision and text)

2. **`checkMistralAPI()`**
   - Tests API connection on app startup
   - Lists available models
   - Provides detailed error messages

3. **`extractBrandKitFromImage()`**
   - Main brand kit extraction function
   - Converts image to base64
   - Sends structured prompt to vision model
   - Parses JSON response into `MistralExtractionResult`
   - Handles markdown code block removal
   - Tries multiple models on failure

4. **`extractLogosFromImage()`**
   - Attempts logo identification (currently placeholder for MVP)

**API Configuration**:
- Uses environment variable: `MISTRAL_API_KEY`
- API URL: `https://api.mistral.ai/v1/chat/completions`
- Primary models: `pixtral-large-latest`, `pixtral-12b` (vision), `mistral-large-latest` (text)

#### `brandKitService.ts`
**Location**: `src/services/brandKitService.ts`

**Purpose**: Transforms raw AI extraction results into structured brand kit objects.

**Key Functions**:

1. **`transformToBrandKit()`**
   - Converts `MistralExtractionResult` to `BrandKit`
   - Handles color conversion (hex to RGB)
   - Maps typography roles
   - Structures spacing, logos, graphics, contrast rules
   - Infers communication style

2. **`generateGuidelines()`**
   - Generates markdown-formatted brand guidelines text
   - Used for documentation and display

**Data Transformations**:
- Hex colors → RGB (0-1 range for Adobe Express)
- Typography object → Array of `BrandTypography`
- Logo styles → Structured `BrandLogo` object

#### `pdfService.ts`
**Location**: `src/services/pdfService.ts`

**Purpose**: Generates Brand Usage Guidelines PDF.

**Key Function**:
- **`generateBrandGuidelinesPDF()`**: Creates multi-page PDF with:
  - Brand tone
  - Color palette with visual swatches
  - Typography documentation
  - Spacing system
  - Logo usage guidelines
  - Icons & graphics
  - Contrast rules (WCAG)
  - Communication style

**PDF Features**:
- Automatic pagination
- Color swatches visualization
- Multi-page support
- Professional formatting

#### `platformConverterService.ts`
**Location**: `src/services/platformConverterService.ts`

**Purpose**: Multi-platform design conversion service.

**Key Functions**:

1. **`analyzeDesignLayout()`**
   - Uses vision AI to analyze raw design structure
   - Identifies elements (text, images, logos, CTAs)
   - Extracts color scheme and layout type

2. **`applyBrandKitToDesign()`**
   - Maps original colors to brand colors
   - Applies brand typography to text elements
   - Adjusts spacing to match brand system
   - Returns styled layout with instructions

3. **`generatePlatformHeadline()`**
   - Generates platform-optimized headlines using text AI
   - Considers platform specs (length, style, psychology)

4. **`generatePlatformCaption()`**
   - Generates platform-specific captions
   - Includes appropriate hashtags/formatting

5. **`convertToPlatform()`**
   - Orchestrates conversion for single platform
   - Combines layout analysis, brand styling, and platform adaptation

6. **`convertToAllPlatforms()`**
   - Batch conversion to multiple platforms
   - Optimizes by sharing brand styling step

**Platform Specifications** (`PLATFORM_SPECS`):
- Aspect ratios
- Safe zones
- CTA zones
- Color psychology
- Headline styles
- Max text lengths

#### `platformDownloadService.ts`
**Location**: `src/services/platformDownloadService.ts`

**Purpose**: Generates downloadable files for platform versions.

**Key Functions**:

1. **`generatePlatformPDF()`**
   - Creates PDF for specific platform dimensions
   - Includes headline, caption, brand colors

2. **`generatePlatformImage()`**
   - Creates PNG image using Canvas API
   - Applies brand colors as background
   - Renders text content

---

### Document Sandbox

#### `code.ts`
**Location**: `src/sandbox/code.ts`

**Purpose**: Document manipulation logic running in Adobe Express sandbox.

**Key Functions**:

1. **`createBrandKitPreview()`**
   - Creates visual brand kit preview in document
   - Adds color swatches (rectangles)
   - Adds typography samples
   - Organizes with section labels

2. **`applyBrandKit()`**
   - Main entry point for applying brand kit
   - Currently calls `createBrandKitPreview()` (can be extended)

3. **`createPlatformDesign()`**
   - Creates platform-optimized design in document
   - Sets canvas size (if supported)
   - Adds background with brand color
   - Adds headline and caption text
   - Adds platform label

**Adobe Express SDK Usage**:
- `editor.createRectangle()`: Color swatches
- `editor.createText()`: Typography samples and labels
- `editor.makeColorFill()`: Color application
- `editor.context.insertionParent`: Document root

---

### Data Models

#### `BrandKit.ts`
**Location**: `src/models/BrandKit.ts`

**Purpose**: TypeScript interfaces for brand kit data structures.

**Key Interfaces**:

- **`BrandKit`**: Complete brand kit structure
  - Colors (primary, secondary, accent, neutral)
  - Typography array
  - Logos object
  - Spacing system
  - Graphics (optional)
  - Contrast rules (optional)
  - Communication style (optional)
  - Tone description

- **`BrandColor`**: Individual color with hex, RGB, role
- **`BrandTypography`**: Font styling (role, family, weight, size)
- **`BrandLogo`**: Logo variations and usage guidelines
- **`BrandSpacing`**: Spacing system values
- **`ContrastRule`**: WCAG color combination rules
- **`CommunicationStyle`**: Inferred brand voice rules

- **`MistralExtractionResult`**: Raw AI response format

#### `DocumentSandboxApi.ts`
**Location**: `src/models/DocumentSandboxApi.ts`

**Purpose**: Interface definition for sandbox API methods exposed to UI.

**Methods**:
- `applyBrandKit(brandKit: BrandKit): Promise<void>`
- `createBrandKitPreview(brandKit: BrandKit): Promise<void>`
- `createPlatformDesign(...): Promise<void>`

---

## Data Flow

### Brand Kit Extraction Flow

```
1. User uploads image
   ↓
2. App.tsx → handleFileSelect()
   ↓
3. mistralService.extractBrandKitFromImage()
   - Convert image to base64
   - Send prompt to Mistral Vision API
   - Receive JSON extraction result
   ↓
4. brandKitService.transformToBrandKit()
   - Convert raw extraction to structured BrandKit
   - Hex to RGB conversion
   - Data normalization
   ↓
5. App.tsx → setBrandKit()
   - Update state
   - Display preview in UI
   ↓
6. User actions:
   - Apply to Document → sandboxProxy.applyBrandKit()
   - Download PDF → pdfService.generateBrandGuidelinesPDF()
   - Multi-Platform Conversion → platformConverterService.convertToAllPlatforms()
```

### Multi-Platform Conversion Flow

```
1. User uploads raw design + selects platforms
   ↓
2. App.tsx → handleRawDesignSelect()
   ↓
3. platformConverterService.convertToAllPlatforms()
   ↓
4. For each platform:
   a. analyzeDesignLayout() [Vision AI]
      - Extract layout elements
      - Identify colors and structure
   ↓
   b. applyBrandKitToDesign() [Vision + Text AI]
      - Map colors to brand colors
      - Apply brand typography
      - Adjust spacing
   ↓
   c. generatePlatformHeadline() [Text AI]
      - Create platform-optimized headline
   ↓
   d. generatePlatformCaption() [Text AI]
      - Create platform-specific caption
   ↓
   e. adaptLayoutForPlatform()
      - Resize for platform dimensions
      - Adjust safe zones
   ↓
5. platformDownloadService
   - Generate PDF for each platform
   - Generate PNG for each platform
   ↓
6. App.tsx → Display results with download links
```

---

## API Integration

### Mistral AI API

**Configuration**:
- API Key: Environment variable `MISTRAL_API_KEY`
- Endpoint: `https://api.mistral.ai/v1/chat/completions`
- Models:
  - Vision: `pixtral-large-latest`, `pixtral-12b`
  - Text: `mistral-large-latest`

**Request Format**:
```typescript
{
  model: "pixtral-large-latest",
  messages: [{
    role: "user",
    content: [
      { type: "text", text: "prompt..." },
      { type: "image_url", image_url: { url: "data:image/png;base64,..." } }
    ]
  }],
  max_tokens: 4000,
  temperature: 0.7
}
```

**Error Handling**:
- Model fallback (tries multiple models)
- Rate limit detection (429 errors)
- Authentication errors (401/403)
- Network/CORS error handling

### Adobe Express SDK

**APIs Used**:
- `editor.createRectangle()`: Create colored swatches
- `editor.createText()`: Create text elements
- `editor.makeColorFill()`: Apply colors (RGB 0-1 range)
- `editor.context.insertionParent`: Access document root

**Color Format**:
- Input: Hex strings (e.g., `#FF5733`)
- Conversion: Hex → RGB (0-1 range)
- Usage: `{ red: 1.0, green: 0.34, blue: 0.20, alpha: 1 }`

---

## Current Limitations

### MVP Scope Limitations

1. **Logo Extraction**
   - ❌ Does not extract actual logo image data
   - ✅ Identifies and describes logos
   - 📝 Requires image segmentation for full extraction (future enhancement)

2. **Font Matching**
   - ❌ Approximates font families (Sans-serif, Serif, etc.)
   - ❌ Does not identify exact font names
   - 📝 Acceptable for MVP scope

3. **Brand Kit Persistence**
   - ❌ Brand kits are not saved between sessions
   - ❌ Each session requires fresh extraction
   - 📝 Future: Could integrate with Express storage or backend

4. **Single Image Input**
   - ❌ Only processes one image at a time
   - ✅ Can process multiple images sequentially
   - 📝 Future: Batch processing support

5. **API Key Security**
   - ⚠️ API keys are client-side (acceptable for hackathon/MVP)
   - 📝 Production: Should use backend proxy

6. **Platform Conversion Image Quality**
   - ⚠️ PNG generation uses simple Canvas API
   - 📝 Production: Could use html2canvas or server-side rendering

7. **PDF Download in Sandboxed Environment**
   - ⚠️ Some browsers block direct downloads
   - ✅ Fallback: Data URL display with manual download option

---

## Future Enhancements

### Short-term (Post-MVP)

1. **Logo Extraction Enhancement**
   - Integrate image segmentation APIs
   - Extract actual logo PNG files
   - Support logo variations (full, icon, monochrome)

2. **Brand Kit Storage**
   - Save brand kits to Adobe Express storage
   - Load previously extracted brand kits
   - Brand kit library management

3. **Multi-Image Processing**
   - Upload multiple images at once
   - Aggregate brand elements from multiple sources
   - Merge conflicting brand information

4. **Improved Font Matching**
   - Integrate font recognition APIs (e.g., WhatTheFont)
   - Better font family identification
   - Font download suggestions

5. **Template Generation**
   - Generate Adobe Express templates using brand kit
   - Pre-styled components (headers, buttons, cards)
   - Brand-consistent design elements

### Medium-term

6. **Backend API Proxy**
   - Move API keys to secure backend
   - Rate limiting and caching
   - User authentication

7. **Advanced Platform Optimization**
   - A/B testing for headlines
   - Platform-specific image optimization
   - Analytics integration

8. **Collaborative Features**
   - Share brand kits with team members
   - Brand kit versioning
   - Approval workflows

### Long-term

9. **AI Model Fine-tuning**
   - Custom model training on brand data
   - Industry-specific brand extraction
   - Improved accuracy

10. **Integration with Adobe Creative Cloud**
    - Export to Photoshop, Illustrator
    - Sync with Adobe Fonts
    - Color palette export to Adobe Color

11. **Enterprise Features**
    - Organization-wide brand kit library
    - Brand compliance checking
    - Audit logs and usage analytics

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
MISTRAL_API_KEY=your_mistral_api_key_here
```

### Add-on Manifest

Located at: `src/manifest.json`

Key configuration:
- **Name**: "Auto Brand Kit Rebuilder"
- **Version**: "1.0.0"
- **Entry Point**: Panel-based UI (`index.html`)
- **Document Sandbox**: Enabled (`code.js`)

### Build Configuration

**Development**:
```bash
npm run start
```

**Production Build**:
```bash
npm run build
```

**Package for Distribution**:
```bash
npm run package
```

---

## Troubleshooting

### Common Issues

1. **Mistral API Errors**
   - Verify API key in `.env` file
   - Check API quota limits
   - Ensure network connectivity
   - Review console for detailed error messages

2. **Build Errors**
   - Ensure Node.js 18+
   - Run `npm install` to install dependencies
   - Check TypeScript configuration

3. **Add-on Not Loading**
   - Verify `manifest.json` is in `dist/` after build
   - Check browser console for errors
   - Ensure document sandbox is enabled

4. **PDF Download Issues**
   - Check browser popup blockers
   - Use fallback manual download option
   - Verify jsPDF is properly bundled

---

## Conclusion

The **Auto Brand Kit Rebuilder** add-on provides a comprehensive solution for extracting brand identity from visual materials and applying it across Adobe Express and multiple social media platforms. The architecture is designed for extensibility, with clear separation between UI, business logic, and document manipulation layers.

The current MVP successfully demonstrates:
- ✅ AI-powered brand extraction
- ✅ Adobe Express integration
- ✅ PDF generation
- ✅ Multi-platform conversion

Future enhancements will focus on improving extraction accuracy, adding persistence, and expanding integration capabilities.

---

**Document Version**: 1.0  
**Last Updated**: Based on current codebase analysis  
**Maintained By**: Hackathon Team
