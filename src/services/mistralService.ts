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
        return brandKit;

    } catch (error) {
        console.error("Error extracting brand kit:", error);
        throw new Error(`Failed to extract brand kit: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Extract logo from image using Mistral Vision API
 * This tries to identify and describe the logo area for extraction
 */
export async function extractLogosFromImage(file: File): Promise<{ full?: string; icon?: string }> {
    try {
        if (!MISTRAL_API_KEY) {
            console.warn("MISTRAL_API_KEY is not set, skipping logo extraction...");
            return {};
        }

        const imageBase64 = await fileToBase64(file);

        const prompt = `Analyze this image and identify if there's a logo present. If a logo is found, describe its characteristics:

1. Is there a full logo (wordmark + icon/symbol)?
2. Is there a standalone icon mark?
3. What are the approximate dimensions and position of the logo?

Return a JSON object:
{
  "hasFullLogo": boolean,
  "hasIconMark": boolean,
  "logoPosition": "description",
  "logoDimensions": "description"
}

If no logo is found, return:
{
  "hasFullLogo": false,
  "hasIconMark": false
}

Return ONLY valid JSON, no additional text.`;

        // Try vision models
        const modelsToTry = [
            "pixtral-large-latest",
            "pixtral-12b",
        ];

        for (const modelName of modelsToTry) {
            try {
                await queryMistral(prompt, imageBase64, file.type || "image/png", modelName);
                console.log(`Using model ${modelName} for logo extraction`);
                break;
            } catch (error: any) {
                if (error.message?.includes("404") || error.message?.includes("not found")) {
                    continue; // Try next model
                }
                throw error; // Other errors should be thrown
            }
        }

        // For MVP, we'll return empty logos - logo extraction would require image segmentation
        // which is beyond the scope of this MVP. In production, you could use vision APIs
        // with image cropping or computer vision libraries.

        return {
            // Logo extraction from screenshots requires image segmentation
            // For MVP, we'll create placeholder logos or skip this step
        };

    } catch (error) {
        console.error("Error extracting logos:", error);
        // Return empty logos on error - logo extraction is optional for MVP
        return {};
    }
}
