/**
 * Mistral API Service for brand kit extraction
 */

import { MistralExtractionResult } from "../models/BrandKit";

// Get API key from environment variable (configured via dotenv-webpack plugin)
// For browser-based apps, dotenv-webpack will load .env and inject process.env.MISTRAL_API_KEY at build time
// Create a .env file in the root directory with: MISTRAL_API_KEY=your_api_key_here
// Get your API key from: https://console.mistral.ai/
// dotenv-webpack replaces process.env.MISTRAL_API_KEY with the actual string value at build time

// At build time, dotenv-webpack will replace process.env.MISTRAL_API_KEY with the actual value
// In the browser, this will be a string literal or empty string
const MISTRAL_API_KEY: string = (process?.env?.MISTRAL_API_KEY as string) || "";
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

if (!MISTRAL_API_KEY) {
    console.error("⚠️ MISTRAL_API_KEY is not set! Please create a .env file with your API key.");
    console.error("Create .env file: MISTRAL_API_KEY=your_api_key_here");
    console.error("Note: You need to restart your dev server after creating/updating the .env file");
}

/**
 * Make a request to Mistral API
 * Exported for use by other services
 */
export async function queryMistral(
    prompt: string,
    imageBase64?: string,
    mimeType?: string,
    model: string = "pixtral-large-latest"
): Promise<string> {
    if (!MISTRAL_API_KEY) {
        throw new Error("MISTRAL_API_KEY is not set. Please create a .env file with your API key.");
    }

    const headers = {
        "Authorization": `Bearer ${MISTRAL_API_KEY}`,
        "Content-Type": "application/json",
    };

    // Build messages array
    const messages: any[] = [{ role: "user", content: [] }];

    // Add text content
    messages[0].content.push({ type: "text", text: prompt });

    // Add image if provided (for vision models)
    if (imageBase64 && mimeType) {
        messages[0].content.push({
            type: "image_url",
            image_url: {
                url: `data:${mimeType};base64,${imageBase64}`
            }
        });
    }

    const payload = {
        model: model,
        messages: messages,
        max_tokens: 4000,
        temperature: 0.7,
    };

    try {
        const response = await fetch(MISTRAL_API_URL, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Mistral API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            return data.choices[0].message.content;
        } else {
            throw new Error("Invalid response format from Mistral API");
        }
    } catch (error: any) {
        console.error("Error from Mistral API:", error);
        throw new Error(`Failed to query Mistral API: ${error.message || String(error)}`);
    }
}

/**
 * Check API connection and list available models
 */
export async function checkMistralAPI(): Promise<{ success: boolean; availableModels: string[]; error?: string }> {
    try {
        if (!MISTRAL_API_KEY) {
            return {
                success: false,
                availableModels: [],
                error: "MISTRAL_API_KEY is not set. Please create a .env file in the root directory with: MISTRAL_API_KEY=your_api_key_here"
            };
        }

        console.log("Testing Mistral API connection...");
        console.log("API Key (first 10 chars):", MISTRAL_API_KEY.substring(0, 10) + "...");

        // Test with a simple text request
        const modelsToCheck = [
            "pixtral-large-latest",  // Vision model
            "pixtral-12b",           // Vision model
            "mistral-large-latest",   // Text model
            "mistral-small-latest",   // Text model
            "mistral-tiny",           // Text model
        ];

        console.log(`Testing ${modelsToCheck.length} models:`, modelsToCheck);

        const availableModels: string[] = [];
        let lastError: any = null;

        // Try each model with a simple text request
        for (const modelName of modelsToCheck) {
            try {
                console.log(`Testing model: ${modelName}...`);
                const response = await queryMistral("test", undefined, undefined, modelName);
                
                availableModels.push(modelName);
                console.log(`✅ Model ${modelName} is available! Response: "${response.substring(0, 50)}..."`);

                // Found a working model, continue to test a few more to see all options
                if (availableModels.length >= 3) {
                    break; // Stop after finding 3 working models
                }
            } catch (error: any) {
                lastError = error;
                const errorMsg = error.message || String(error);
                console.log(`❌ Model ${modelName} failed:`, errorMsg.substring(0, 150));

                // Check for 429 (rate limit)
                if (errorMsg.includes("429") || errorMsg.includes("rate limit") || errorMsg.includes("quota")) {
                    return {
                        success: false,
                        availableModels: [],
                        error: `API Rate Limit Exceeded (429): You've reached the rate limit. Please wait a moment and try again. See https://docs.mistral.ai/api/ for rate limits.`
                    };
                }

                // If it's not a 404 (model not found), it might be a different issue
                // Stop trying if it's an authentication/permission error
                if (errorMsg.includes("403") || errorMsg.includes("401") || errorMsg.includes("API_KEY") || errorMsg.includes("Unauthorized")) {
                    return {
                        success: false,
                        availableModels: [],
                        error: `API authentication error (403/401). Your API key may be invalid or expired. Please: 1) Check your API key at https://console.mistral.ai/, 2) Ensure the key is not restricted, 3) Try regenerating the API key. Error: ${errorMsg.substring(0, 150)}`
                    };
                }

                // Continue to next model if it's a 404
                continue;
            }
        }

        if (availableModels.length > 0) {
            console.log("✅ API Connection successful!");
            console.log(`Available models: ${availableModels.join(", ")}`);

            return {
                success: true,
                availableModels,
            };
        } else {
            // All models failed
            const errorMsg = lastError?.message || "Unknown error";
            console.error("❌ All models failed. Last error:", errorMsg);

            // Check for 429 (rate limit) first
            if (errorMsg.includes("429") || errorMsg.includes("rate limit") || errorMsg.includes("quota")) {
                return {
                    success: false,
                    availableModels: [],
                    error: `API Rate Limit Exceeded (429): You've reached the rate limit. Please wait a moment and try again. See https://docs.mistral.ai/api/ for rate limits.`
                };
            }

            // Provide more specific error messages
            if (errorMsg.includes("404") || errorMsg.includes("not found")) {
                return {
                    success: false,
                    availableModels: [],
                    error: `Could not connect to Mistral API. Possible issues: 1) API key is invalid or expired, 2) Network/CORS issues, 3) API endpoint changed. Try: https://console.mistral.ai/ to check your API key.`
                };
            } else if (errorMsg.includes("API_KEY") || errorMsg.includes("403") || errorMsg.includes("401")) {
                return {
                    success: false,
                    availableModels: [],
                    error: `Invalid API key or insufficient permissions (403/401). Please: 1) Check your API key at https://console.mistral.ai/, 2) Ensure it's not restricted, 3) Regenerate the key if needed.`
                };
            } else {
                return {
                    success: false,
                    availableModels: [],
                    error: `API Error: ${errorMsg.substring(0, 300)}. Check console for details.`
                };
            }
        }

    } catch (error: any) {
        const errorMsg = error.message || String(error);
        console.error("❌ Failed to check API:", errorMsg);
        return {
            success: false,
            availableModels: [],
            error: `Failed to check API: ${errorMsg.substring(0, 300)}. This might be a CORS issue or network problem.`
        };
    }
}

/**
 * Convert image file to base64 for Mistral API
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Extract brand kit from image using Mistral Vision API
 */
export async function extractBrandKitFromImage(file: File): Promise<MistralExtractionResult> {
    try {
        if (!MISTRAL_API_KEY) {
            throw new Error("MISTRAL_API_KEY is not set. Please create a .env file with your API key.");
        }

        const imageBase64 = await fileToBase64(file);

        const prompt = `You are a brand identity expert. Analyze this image (which could be a website screenshot, app UI, poster, or brand material) and extract the complete brand kit information.

Extract the following information and return ONLY a valid JSON object with no additional text:

{
  "colors": {
    "primary": ["#hex1", "#hex2"],
    "secondary": ["#hex3"],
    "accent": ["#hex4"],
    "neutral": ["#hex5", "#hex6"]
  },
  "typography": {
    "heading": {
      "font": "font family name (approximate if exact name not visible, e.g., 'Sans-serif', 'Serif', 'Display')",
      "weight": "light|regular|medium|bold|black",
      "size": number_in_points
    },
    "subheading": {
      "font": "font family name",
      "weight": "light|regular|medium|bold|black",
      "size": number_in_points
    },
    "body": {
      "font": "font family name",
      "weight": "light|regular|medium|bold|black",
      "size": number_in_points
    },
    "caption": {
      "font": "font family name",
      "weight": "light|regular|medium|bold|black",
      "size": number_in_points
    }
  },
  "spacing": {
    "base_unit": number (e.g., 8),
    "section_gap": number,
    "paragraph_gap": number,
    "element_padding": number
  },
  "logos": {
    "styles": {
      "clear_space": "minimum clear space requirement (e.g., '2x logo height' or '24px')",
      "min_size": "minimum size requirement (e.g., '24px' or '0.5in')",
      "usage": ["guideline 1", "guideline 2"],
      "donts": ["what not to do 1", "what not to do 2"]
    }
  },
  "graphics": {
    "patterns": ["description of pattern 1", "description of pattern 2"],
    "illustrations": "description of illustration style (e.g., 'Minimalist line art', 'Bold geometric shapes', 'Hand-drawn sketches')",
    "icons": [
      {
        "name": "icon name or category",
        "description": "description of icon style",
        "usage": "when to use",
        "category": "social|navigation|action|decorative|other"
      }
    ]
  },
  "contrast_rules": [
    {
      "foreground": "#hex_color",
      "background": "#hex_color",
      "ratio": number (WCAG contrast ratio, e.g., 4.5 for AA, 7 for AAA),
      "level": "AA|AAA|AA-Large|AAA-Large",
      "usage": "when to use this color combination"
    }
  ],
  "communication_style": {
    "formality": "formal|casual|neutral (infer from design style, language, and visual elements)",
    "language_style": "promotional|informative|educational|conversational (infer from text tone and purpose)",
    "audience_type": "enterprise|consumer|startup|creator|professional (infer from design sophistication and messaging)",
    "cta_style": "aggressive|subtle|moderate (infer from call-to-action prominence and language)",
    "communication_approach": "direct|friendly|authoritative|approachable (infer from overall brand personality)"
  },
  "tone": "brief description of brand tone (e.g., 'Professional and modern', 'Playful and energetic')"
}

Important guidelines:
1. For colors: Identify the most prominent colors and categorize them by their visual role (primary = main brand colors, secondary = supporting colors, accent = highlights, neutral = grays/backgrounds)
2. For typography: Infer font family from appearance (Sans-serif, Serif, etc.) and estimate weights. Identify which text is heading vs body vs caption based on size and visual hierarchy.
3. For spacing: Analyze gaps between sections, paragraphs, and elements to determine the spacing system (often based on an 8px or 4px grid)
4. For logos: If a logo is visible, describe its style guidelines (clear space, minimum size, usage rules, what not to do). Note variations if visible (horizontal, vertical, stacked).
5. For graphics: Identify any patterns, illustration styles, or icon styles used in the design. Describe their characteristics and usage.
6. For contrast rules: Analyze text-on-background combinations and determine WCAG contrast ratios. Include common combinations like primary text on white, white text on primary color, etc.
7. For communication_style: Infer these from visual design, text content, and overall brand presentation. Analyze: design sophistication (enterprise vs consumer), language used (formal vs casual), CTA prominence (aggressive vs subtle), and overall brand personality. These are inferred rules for AI content generation to maintain brand consistency.
8. Return valid JSON only, no markdown formatting or explanations. Use empty arrays/objects if information is not visible.

Now analyze the image and return the JSON:`;

        let result;
        let lastError;

        // Try different vision models in order of preference
        const modelsToTry = [
            "pixtral-large-latest",  // Best vision model
            "pixtral-12b",           // Alternative vision model
        ];

        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying model: ${modelName} for vision extraction...`);
                const response = await queryMistral(prompt, imageBase64, file.type || "image/png", modelName);
                result = response;
                console.log(`✅ Successfully used model: ${modelName}`);
                break; // Success, exit loop
            } catch (error: any) {
                lastError = error;
                const errorMsg = error.message || String(error);

                // If 429 (rate limit), stop trying and give clear message
                if (errorMsg.includes("429") || errorMsg.includes("rate limit") || errorMsg.includes("quota")) {
                    throw new Error(`API Rate Limit Exceeded: You've reached the rate limit. Please wait a moment and try again. See https://docs.mistral.ai/api/ for rate limits.`);
                }

                // If 404, try next model
                if (errorMsg.includes("404") || errorMsg.includes("not found")) {
                    console.warn(`Model ${modelName} not available (404), trying next...`);
                    continue;
                }
                // If authentication error, don't try more models
                if (errorMsg.includes("403") || errorMsg.includes("401") || errorMsg.includes("API_KEY") || errorMsg.includes("Unauthorized")) {
                    throw new Error(`API authentication error: ${errorMsg}. Please check your API key permissions.`);
                }
                // If other error, try next model but log it
                console.warn(`Model ${modelName} failed: ${errorMsg.substring(0, 100)}`);
                continue;
            }
        }

        if (!result) {
            const errorMsg = lastError?.message || "Unknown error";
            throw new Error(`All models failed. Last error: ${errorMsg}. 

Troubleshooting steps:
1. Check that your API key has access to vision models at https://console.mistral.ai/
2. Ensure the API key is valid and not expired
3. Try regenerating your API key
4. Check the browser console for detailed error messages`);
        }

        // Clean the response text (remove markdown code blocks if present)
        let jsonText = result.trim();
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/```\n?/g, "");
        }

        const brandKit = JSON.parse(jsonText) as MistralExtractionResult;
        
        // Always try to extract logo images using V2 pipeline
        try {
            // Use V2 pipeline: Detect → Crop → Refine → Filter
            const extractedLogos = await extractLogosFromImageV2(file);
            
            if (extractedLogos && extractedLogos.length > 0) {
                // Store the extracted logo images
                brandKit.logos = brandKit.logos || {};
                // Store first logo as 'full' for backward compatibility
                brandKit.logos.full = extractedLogos[0].imageBase64;
                // Store all logos in a new 'allLogos' array with V2 format
                (brandKit.logos as any).allLogos = extractedLogos.map(logo => ({
                    image: logo.imageBase64,
                    description: logo.name,
                    name: logo.name,
                    confidence: logo.confidence
                }));
                console.log(`✅ Stored ${extractedLogos.length} confirmed logo(s) in brand kit`);
            } else {
                console.log("ℹ️ No logos confirmed by V2 pipeline");
            }
        } catch (logoError) {
            console.warn("Logo extraction failed, continuing without logo images:", logoError);
            // Continue without logo images - this is optional
        }
        
        return brandKit;

    } catch (error) {
        console.error("Error extracting brand kit:", error);
        throw new Error(`Failed to extract brand kit: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Step 1: Detect logo regions in an image
 * Returns array of detected logos with bounding boxes
 */
async function detectLogoRegions(
    file: File,
    imageBase64: string
): Promise<Array<{
    name: string;
    boundingBox: { x: number; y: number; width: number; height: number };
    confidence: number;
}>> {
    try {
        if (!MISTRAL_API_KEY) {
            console.warn("MISTRAL_API_KEY is not set, skipping logo detection...");
            return [];
        }

        // Get image dimensions first
        const imageDimensions = await getImageDimensions(imageBase64);

        // STEP 1: Detection - Identify logos with coordinates and confidence
        const prompt = `Identify all brand or organizational logos in this image. 

The image dimensions are: ${imageDimensions.width}x${imageDimensions.height} pixels.

For each logo, return:
- name (if recognizable, otherwise "Unknown Logo")
- bounding box in pixel coordinates (x, y, width, height)
- confidence score (0–1)

Return ONLY valid JSON in this format:
{
  "logos": [
    {
      "name": "string (logo name if recognizable, else 'Unknown Logo')",
      "boundingBox": {
        "x": number (pixel X of top-left corner, 0 to ${imageDimensions.width}),
        "y": number (pixel Y of top-left corner, 0 to ${imageDimensions.height}),
        "width": number (pixel width, must be > 0),
        "height": number (pixel height, must be > 0)
      },
      "confidence": number (0.0 to 1.0)
    }
  ]
}

IMPORTANT:
- Only identify real brand/organization logos (not decorative icons)
- Each logo should have its own separate bounding box
- Ensure x + width <= ${imageDimensions.width} and y + height <= ${imageDimensions.height}
- If no logos found, return: {"logos": []}

Return ONLY valid JSON, no markdown, no explanations.`;

        // Try vision models
        const modelsToTry = [
            "pixtral-large-latest",
            "pixtral-12b",
        ];

        let logoInfo: any = null;
        for (const modelName of modelsToTry) {
            try {
                // Use base64 without data URL prefix for API
                const imageBase64ForAPI = imageBase64.includes(',') 
                    ? imageBase64.split(',')[1] 
                    : imageBase64;
                
                const response = await queryMistral(prompt, imageBase64ForAPI, file.type || "image/png", modelName);
                
                // Clean and parse response
                let jsonText = response.trim();
                if (jsonText.startsWith("```json")) {
                    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
                } else if (jsonText.startsWith("```")) {
                    jsonText = jsonText.replace(/```\n?/g, "");
                }
                
                logoInfo = JSON.parse(jsonText);
                console.log(`Step 1 (Detection): Using model ${modelName}`, logoInfo);
                break;
            } catch (error: any) {
                if (error.message?.includes("404") || error.message?.includes("not found")) {
                    continue; // Try next model
                }
                console.warn(`Model ${modelName} failed:`, error.message);
                continue;
            }
        }

        // Validate detection results
        if (!logoInfo || !logoInfo.logos || logoInfo.logos.length === 0) {
            console.log("Step 1 (Detection): No logos detected in image");
            return [];
        }

        console.log(`Step 1 (Detection): Found ${logoInfo.logos.length} logo(s)`);
        
        // Return detected regions
        return logoInfo.logos.map((logo: any) => ({
            name: logo.name || "Unknown Logo",
            boundingBox: logo.boundingBox || logo.logoBox,
            confidence: logo.confidence || 0
        }));

    } catch (error) {
        console.error("Error detecting logo regions:", error);
        return [];
    }
}

/**
 * Extract logo from image using Mistral Vision API (V1 - legacy)
 * Identifies logo location and extracts the actual logo image
 */
export async function extractLogosFromImage(
    file: File,
    originalImageBase64: string
): Promise<{ logos: Array<{ image: string; description?: string }> }> {
    try {
        if (!MISTRAL_API_KEY) {
            console.warn("MISTRAL_API_KEY is not set, skipping logo extraction...");
            return { logos: [] };
        }

        // Get image dimensions first
        const imageDimensions = await getImageDimensions(originalImageBase64);

        // STEP 1: Detection - Identify logos with coordinates and confidence
        const prompt = `Identify all brand or organizational logos in this image. 

The image dimensions are: ${imageDimensions.width}x${imageDimensions.height} pixels.

For each logo, return:
- name (if recognizable, otherwise "Unknown Logo")
- bounding box in pixel coordinates (x, y, width, height)
- confidence score (0–1)

Return ONLY valid JSON in this format:
{
  "logos": [
    {
      "name": "string (logo name if recognizable, else 'Unknown Logo')",
      "boundingBox": {
        "x": number (pixel X of top-left corner, 0 to ${imageDimensions.width}),
        "y": number (pixel Y of top-left corner, 0 to ${imageDimensions.height}),
        "width": number (pixel width, must be > 0),
        "height": number (pixel height, must be > 0)
      },
      "confidence": number (0.0 to 1.0)
    }
  ]
}

IMPORTANT:
- Only identify real brand/organization logos (not decorative icons)
- Each logo should have its own separate bounding box
- Ensure x + width <= ${imageDimensions.width} and y + height <= ${imageDimensions.height}
- If no logos found, return: {"logos": []}

Return ONLY valid JSON, no markdown, no explanations.`;

        // Try vision models
        const modelsToTry = [
            "pixtral-large-latest",
            "pixtral-12b",
        ];

        let logoInfo: any = null;
        for (const modelName of modelsToTry) {
            try {
                // Use base64 without data URL prefix for API
                const imageBase64ForAPI = originalImageBase64.includes(',') 
                    ? originalImageBase64.split(',')[1] 
                    : originalImageBase64;
                
                const response = await queryMistral(prompt, imageBase64ForAPI, file.type || "image/png", modelName);
                
                // Clean and parse response
                let jsonText = response.trim();
                if (jsonText.startsWith("```json")) {
                    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
                } else if (jsonText.startsWith("```")) {
                    jsonText = jsonText.replace(/```\n?/g, "");
                }
                
                logoInfo = JSON.parse(jsonText);
                console.log(`Step 1 (Detection): Using model ${modelName}`, logoInfo);
                break;
            } catch (error: any) {
                if (error.message?.includes("404") || error.message?.includes("not found")) {
                    continue; // Try next model
                }
                console.warn(`Model ${modelName} failed:`, error.message);
                continue;
            }
        }

        // STEP 1: Validate detection results
        if (!logoInfo || !logoInfo.logos || logoInfo.logos.length === 0) {
            console.log("Step 1 (Detection): No logos detected in image");
            return { logos: [] };
        }

        console.log(`Step 1 (Detection): Found ${logoInfo.logos.length} logo(s)`);

        // STEP 2: Crop each detected logo
        const extractedLogos: Array<{ image: string; description?: string }> = [];

        for (let i = 0; i < logoInfo.logos.length; i++) {
            const logo = logoInfo.logos[i];
            const box = logo.boundingBox || logo.logoBox; // Support both formats

            // Validate coordinates
            if (!box || !box.x || !box.y || !box.width || !box.height || 
                box.width <= 0 || box.height <= 0 ||
                box.x < 0 || box.y < 0 ||
                box.x + box.width > imageDimensions.width ||
                box.y + box.height > imageDimensions.height) {
                console.warn(`Step 2 (Crop): Invalid coordinates for logo ${i + 1}, skipping`);
                continue;
            }

            // Filter by confidence if available
            if (logo.confidence !== undefined && logo.confidence < 0.5) {
                console.warn(`Step 2 (Crop): Logo ${i + 1} has low confidence (${logo.confidence}), skipping`);
                continue;
            }

            // Filter out logos that are too large (likely include background elements)
            const maxLogoWidth = imageDimensions.width * 0.3;
            const maxLogoHeight = imageDimensions.height * 0.3;
            
            if (box.width > maxLogoWidth || box.height > maxLogoHeight) {
                console.warn(`Step 2 (Crop): Logo ${i + 1} is too large (${box.width}x${box.height}), skipping`);
                continue;
            }

            // Filter out very small logos (likely noise)
            if (box.width < 20 || box.height < 20) {
                console.warn(`Step 2 (Crop): Logo ${i + 1} is too small (${box.width}x${box.height}), skipping`);
                continue;
            }

            try {
                // STEP 2: Crop the logo
                const logoBase64 = await cropImageFromBase64(
                    originalImageBase64,
                    Math.max(0, box.x),
                    Math.max(0, box.y),
                    Math.min(box.width, imageDimensions.width - box.x),
                    Math.min(box.height, imageDimensions.height - box.y)
                );

                extractedLogos.push({
                    image: logoBase64,
                    description: logo.name || logo.description || `Logo ${i + 1}`
                });
                
                console.log(`Step 2 (Crop): Extracted logo ${i + 1} - ${logo.name || 'Unknown'} (${box.width}x${box.height}px, confidence: ${logo.confidence || 'N/A'})`);
            } catch (error) {
                console.warn(`Step 2 (Crop): Failed to extract logo ${i + 1}:`, error);
                continue;
            }
        }

        console.log(`✅ Pipeline complete: Extracted ${extractedLogos.length} logo(s) successfully`);
        return { logos: extractedLogos };

    } catch (error) {
        console.error("Error extracting logos:", error);
        return { logos: []         };
    }
}

/**
 * V2: Orchestrator function for multi-step logo extraction pipeline
 * Flow: Detect → Crop → Refine → Filter
 * 
 * Returns final array of clean logos in format: { name, imageBase64, confidence }
 * 
 * This is an additive, backward-compatible upgrade.
 * The existing Stage 1 logic (extractLogosFromImage) remains unchanged.
 */
export async function extractLogosFromImageV2(file: File): Promise<Array<{
    name: string;
    imageBase64: string;
    confidence: number;
}>> {
    try {
        console.log("🚀 Starting V2 logo extraction pipeline");
        
        // Convert file → base64 + mime type
        const mimeType = file.type || "image/png";
        const fullImageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        // Get base64 without data URL prefix for detection
        const imageBase64ForDetection = fullImageBase64.includes(',') 
            ? fullImageBase64.split(',')[1] 
            : fullImageBase64;

        // Step 1: Call detectLogoRegions
        const detectedRegions = await detectLogoRegions(file, fullImageBase64);
        
        if (detectedRegions.length === 0) {
            console.log("No logo regions detected");
            return [];
        }

        console.log(`Found ${detectedRegions.length} logo region(s) to process`);

        // Process each detected region
        const results: Array<{
            name: string;
            imageBase64: string;
            confidence: number;
        }> = [];

        for (let i = 0; i < detectedRegions.length; i++) {
            const region = detectedRegions[i];
            
            try {
                // Step 2: Crop using cropImageRegion (returns base64 without data URL prefix)
                const croppedBase64NoPrefix = await cropImageRegion(
                    imageBase64ForDetection,
                    mimeType,
                    region.boundingBox
                );

                // Step 3: Call refineLogoCrop (needs base64 with data URL prefix for Image object)
                const croppedBase64WithPrefix = `data:${mimeType};base64,${croppedBase64NoPrefix}`;
                const refinement = await refineLogoCrop(croppedBase64WithPrefix);

                // Step 4: Keep only items where confirmed === true and confidence >= 0.6
                if (refinement.confirmed === true && refinement.confidence >= 0.6) {
                    results.push({
                        name: refinement.name,
                        imageBase64: croppedBase64WithPrefix, // Return with data URL prefix for UI usage
                        confidence: refinement.confidence
                    });
                    console.log(`✅ Logo ${i + 1} confirmed: ${refinement.name} (confidence: ${refinement.confidence})`);
                } else {
                    console.log(`❌ Logo ${i + 1} rejected: confirmed=${refinement.confirmed}, confidence=${refinement.confidence}`);
                }
            } catch (error) {
                console.warn(`Failed to process logo region ${i + 1}:`, error);
                continue;
            }
        }

        console.log(`✅ Pipeline complete: ${results.length} logo(s) extracted and confirmed`);
        return results;

    } catch (error) {
        console.error("Error in V2 logo extraction pipeline:", error);
        return [];
    }
}

/**
 * Get image dimensions from base64
 */
function getImageDimensions(imageBase64: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            resolve({ width: img.width, height: img.height });
        };
        img.onerror = reject;
        img.src = imageBase64;
    });
}

/**
 * Refine logo crop by confirming if it's a real brand/organizational logo
 */
async function refineLogoCrop(croppedBase64: string): Promise<{
    confirmed: boolean;
    name: string;
    description?: string;
    confidence: number;
}> {
    console.log("Step 3 (Refine): Sending crop to AI for confirmation");
    
    try {
        if (!MISTRAL_API_KEY) {
            console.warn("MISTRAL_API_KEY is not set, skipping refinement...");
            return {
                confirmed: false,
                name: "Unknown Logo",
                confidence: 0
            };
        }

        const prompt = `This image is a possible logo.
Confirm if it is a real brand or organizational logo.
If yes, return:
{
  "confirmed": true,
  "name": "string (logo name if recognizable, else 'Unknown Logo')",
  "description": "string (short description of the logo)",
  "confidence": number (0.0 to 1.0)
}
If not a real logo, return:
{
  "confirmed": false,
  "confidence": number (0.0 to 1.0)
}
Return ONLY strict JSON.`;

        // Try vision models
        const modelsToTry = [
            "pixtral-large-latest",
            "pixtral-12b",
        ];

        let result: any = null;
        for (const modelName of modelsToTry) {
            try {
                // Prepare base64 for API (ensure it doesn't have data URL prefix)
                const base64ForAPI = croppedBase64.includes(',') 
                    ? croppedBase64.split(',')[1] 
                    : croppedBase64;
                
                const response = await queryMistral(prompt, base64ForAPI, "image/png", modelName);
                
                // Clean and parse response
                let jsonText = response.trim();
                if (jsonText.startsWith("```json")) {
                    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
                } else if (jsonText.startsWith("```")) {
                    jsonText = jsonText.replace(/```\n?/g, "");
                }
                
                result = JSON.parse(jsonText);
                console.log("Step 3 (Refine): Result", result);
                break;
            } catch (error: any) {
                if (error.message?.includes("404") || error.message?.includes("not found")) {
                    continue; // Try next model
                }
                console.warn(`Model ${modelName} failed for refinement:`, error.message);
                continue;
            }
        }

        // Validate and return result
        if (!result) {
            console.warn("Step 3 (Refine): No valid response from AI, defaulting to unconfirmed");
            return {
                confirmed: false,
                name: "Unknown Logo",
                confidence: 0
            };
        }

        // Ensure required fields
        if (result.confirmed === true) {
            return {
                confirmed: true,
                name: result.name || "Unknown Logo",
                description: result.description,
                confidence: typeof result.confidence === 'number' ? result.confidence : 0.5
            };
        } else {
            return {
                confirmed: false,
                name: "Unknown Logo",
                confidence: typeof result.confidence === 'number' ? result.confidence : 0
            };
        }

    } catch (error) {
        console.error("Step 3 (Refine): Error during refinement:", error);
        return {
            confirmed: false,
            name: "Unknown Logo",
            confidence: 0
        };
    }
}

/**
 * Crop an image region from base64 using canvas
 * Returns base64 string without data URL prefix
 */
async function cropImageRegion(
    base64: string,
    mimeType: string,
    bbox: { x: number; y: number; width: number; height: number }
): Promise<string> {
    console.log("Step 2 (Crop): Cropping region", bbox);
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            try {
                // Create canvas for the cropped region
                const canvas = document.createElement('canvas');
                canvas.width = bbox.width;
                canvas.height = bbox.height;
                const ctx = canvas.getContext('2d');
                
                if (!ctx) {
                    reject(new Error('Could not get canvas context'));
                    return;
                }

                // Draw only the bounding box region onto the canvas
                ctx.drawImage(
                    img,
                    bbox.x, bbox.y, bbox.width, bbox.height,  // Source rectangle (from original image)
                    0, 0, bbox.width, bbox.height             // Destination rectangle (to canvas)
                );

                // Export the cropped region as base64 (same mime type)
                const dataUrl = canvas.toDataURL(mimeType);
                
                // Return base64 string without data URL prefix
                const base64String = dataUrl.includes(',') 
                    ? dataUrl.split(',')[1] 
                    : dataUrl;
                
                resolve(base64String);
            } catch (error) {
                reject(error);
            }
        };
        
        img.onerror = () => {
            reject(new Error('Failed to load image for cropping'));
        };
        
        // Handle base64 with or without data URL prefix
        if (base64.startsWith('data:')) {
            img.src = base64;
        } else {
            img.src = `data:${mimeType};base64,${base64}`;
        }
    });
}

/**
 * Crop an image from base64 using canvas (legacy function, kept for backward compatibility)
 * Returns base64 with data URL prefix
 */
function cropImageFromBase64(
    imageBase64: string,
    x: number,
    y: number,
    width: number,
    height: number
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            // Create canvas and crop
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            // Draw the cropped portion
            ctx.drawImage(
                img,
                x, y, width, height,  // Source rectangle
                0, 0, width, height   // Destination rectangle
            );

            // Convert to base64 PNG
            const croppedBase64 = canvas.toDataURL('image/png');
            resolve(croppedBase64);
        };
        img.onerror = reject;
        img.src = imageBase64;
    });
}
