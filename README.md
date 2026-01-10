## Auto Brand Kit Rebuilder - Adobe Express Add-on

An Adobe Express Add-on that reverse-engineers complete brand kits from screenshots using multimodal AI (Gemini Vision API).

### 🎯 Overview

This add-on analyzes screenshots, app UIs, PDFs, or images and extracts:
- **Brand Colors** (primary, secondary, accent, neutral)
- **Typography** (heading, subheading, body, caption styles)
- **Spacing System** (base units, gaps, padding)
- **Logo Detection** (identification of logo elements)
- **Brand Tone** (description of visual personality)

The extracted brand kit can then be applied directly to Adobe Express documents and exported as a Brand Usage Guidelines PDF.

### 🚀 Features

- Upload screenshots, app UIs, or PDFs
- AI-powered brand extraction using Google Gemini Vision API
- Visual preview of extracted colors and typography
- Apply brand kit directly to Adobe Express documents
- Generate downloadable Brand Usage Guidelines PDF
- Clean, enterprise-friendly UX

### 📋 Prerequisites

- Node.js version 18 or above ([download here](https://nodejs.org/en/download))
- An account in Adobe Express ([sign up here](https://new.express.adobe.com))
- Google Gemini API Key ([get one here](https://ai.google.dev/))

### 🛠️ Setup

1. Clone this repository:
   ```bash
   git clone <repository-url>
   cd AdobeExpress
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Gemini API Key:
   
   Option A: Environment Variable (Recommended for production)
   ```bash
   # Create a .env file in the root directory
   echo "GEMINI_API_KEY=your_api_key_here" > .env
   ```
   
   Option B: Direct Configuration (For development/testing)
   
   Edit `src/services/geminiService.ts` and replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key:
   ```typescript
   const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "your_actual_api_key";
   ```

4. Start the development server:
   ```bash
   npm run start
   ```

5. Load the add-on in Adobe Express:
   - Open Adobe Express (https://new.express.adobe.com)
   - Go to Add-ons panel
   - Click "Load unpacked add-on" or use the development workflow
   - Point to the `dist` folder after building

### 🏗️ Build

To build for production:
```bash
npm run build
```

To package the add-on:
```bash
npm run package
```

### 📁 Project Structure

```
AdobeExpress/
├── src/
│   ├── ui/                    # React UI components
│   │   ├── components/
│   │   │   ├── App.tsx       # Main app component
│   │   │   └── FileUpload.tsx # File upload component
│   │   └── index.tsx         # UI entry point
│   ├── sandbox/
│   │   └── code.ts           # Document sandbox APIs
│   ├── services/
│   │   ├── geminiService.ts  # Gemini API integration
│   │   ├── brandKitService.ts # Brand kit transformation
│   │   └── pdfService.ts     # PDF generation
│   ├── models/
│   │   ├── BrandKit.ts       # Data models
│   │   └── DocumentSandboxApi.ts # API interfaces
│   └── manifest.json         # Add-on manifest
├── dist/                      # Build output
└── package.json
```

### 🔧 Configuration

#### Gemini API Setup

1. Get your API key from [Google AI Studio](https://ai.google.dev/)
2. Set it as an environment variable or configure in the service file
3. The add-on uses `gemini-1.5-pro-vision` model for image analysis

#### Add-on Manifest

The add-on is configured in `src/manifest.json`:
- **Name**: Auto Brand Kit Rebuilder
- **Entry Point**: Panel-based UI
- **Document Sandbox**: Enabled for document manipulation

### 🎨 Usage

1. **Launch Add-on**: Open the add-on from the Adobe Express Add-ons panel
2. **Upload Image**: Click "Upload Screenshot or PDF" and select your brand material
3. **AI Analysis**: Wait for Gemini to analyze the image (usually 5-15 seconds)
4. **Preview**: Review the extracted colors, typography, and spacing
5. **Apply**: Click "Apply Brand Kit to Document" to create a preview in Express
6. **Download PDF**: Generate and download Brand Usage Guidelines

### 🔍 How It Works

1. **Image Upload**: User uploads a screenshot, app UI, or PDF
2. **AI Analysis**: Gemini Vision API analyzes the image structure:
   - Identifies color palette and categorizes by role
   - Extracts typography hierarchy (heading, body, etc.)
   - Analyzes spacing patterns and grid system
   - Describes brand tone and visual personality
3. **Transformation**: Raw extraction results are transformed into structured brand kit
4. **Application**: Brand kit is applied to Adobe Express document:
   - Color swatches are created
   - Typography samples are generated
   - Spacing system is documented
5. **PDF Generation**: Brand Usage Guidelines PDF is generated with:
   - Color palette with hex codes
   - Typography rules
   - Spacing system documentation
   - Logo usage guidelines

### 🧪 MVP Scope

**Required Features** ✅:
- Upload image/PDF
- Extract colors + typography roles
- Apply brand kit to Express
- Generate PDF guidelines

**Future Enhancements** (Optional):
- Logo extraction with image segmentation
- Multiple input images
- Template generation using brand kit
- Brand kit persistence/storage

### 🏆 Hackathon Categories

- Design Intelligence & Automation
- Enterprise Efficiency
- Connected Workflows
- Most Valuable for Designers
- Best Use of AI for Coding

### 📝 Notes

- **API Key Security**: For production, use environment variables or secure configuration. Never commit API keys to version control.
- **Logo Extraction**: Current MVP identifies logos but doesn't extract image data (requires image segmentation). Future versions could integrate vision APIs for actual logo extraction.
- **Font Matching**: The add-on approximates font families (Sans-serif, Serif, etc.) rather than exact font matching. This is acceptable for MVP scope.
- **Brand Kit Storage**: The add-on doesn't persist brand kits. Each session extracts fresh data from uploaded images.

### 🐛 Troubleshooting

**Gemini API Errors**:
- Verify your API key is correctly configured
- Check API quota limits in Google AI Studio
- Ensure the image format is supported (PNG, JPG, PDF)

**Build Errors**:
- Ensure Node.js version is 18+
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript configuration matches project structure

**Add-on Not Loading**:
- Verify manifest.json is in `dist` folder after build
- Check browser console for errors
- Ensure document sandbox is enabled in manifest

### 📄 License

This project is created for an enterprise hackathon. See individual dependencies for their respective licenses.

### 🤝 Contributing

This is a hackathon MVP. Contributions and feedback welcome!

---

**Built with**: React, TypeScript, Adobe Express SDK, Google Gemini API, jsPDF
