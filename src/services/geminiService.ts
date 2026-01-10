/**
 * Gemini API Service for brand kit extraction
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { GeminiExtractionResult } from "../models/BrandKit";

// Get API key from environment variable (configured via dotenv-webpack plugin)
// For browser-based apps, dotenv-webpack will load .env and inject process.env.GEMINI_API_KEY at build time
// Create a .env file in the root directory with: GEMINI_API_KEY=your_api_key_here
// Get your API key from: https://ai.google.dev/
// dotenv-webpack replaces process.env.GEMINI_API_KEY with the actual string value at build time

// At build time, dotenv-webpack will replace process.env.GEMINI_API_KEY with the actual value
// In the browser, this will be a string literal or empty string
const GEMINI_API_KEY: string = (process?.env?.GEMINI_API_KEY as string) || "";

if (!GEMINI_API_KEY) {
    console.error("⚠️ GEMINI_API_KEY is not set! Please create a .env file with your API key.");
    console.error("Create .env file: GEMINI_API_KEY=your_api_key_here");
    console.error("Note: You need to restart your dev server after creating/updating the .env file");
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Check API connection and list available models
 * This helps diagnose API key and model availability issues
 */
/**
 * Try to fetch available models from the API directly
 * This helps diagnose which models are actually available
 */
async function fetchAvailableModels(): Promise<string[]> {
    try {
        if (!GEMINI_API_KEY) {
            console.error("Cannot fetch models: GEMINI_API_KEY is not set");
            return [];
        }
        
        // Try to fetch models using REST API
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
        );
        
        if (!response.ok) {
            console.error(`Failed to fetch models: ${response.status} ${response.statusText}`);
            return [];
        }
        
        const data = await response.json();
        const models = data.models || [];
        const modelNames = models
            .map((m: any) => m.name?.replace('models/', '') || m.name)
            .filter((name: string) => name && name.includes('gemini'));
        
        console.log("Available models from API:", modelNames);
        return modelNames;
    } catch (error: any) {
        console.error("Failed to fetch models list:", error.message);
        return [];
    }
}

export async function checkGeminiAPI(): Promise<{ success: boolean; availableModels: string[]; error?: string }> {
    try {
        if (!GEMINI_API_KEY || !genAI) {
            return {
                success: false,
                availableModels: [],
                error: "GEMINI_API_KEY is not set. Please create a .env file in the root directory with: GEMINI_API_KEY=your_api_key_here"
            };
        }
        
        console.log("Testing Gemini API connection...");
        console.log("API Key (first 10 chars):", GEMINI_API_KEY.substring(0, 10) + "...");
        
        // First, try to fetch the list of available models from the API
        console.log("Fetching available models from API...");
        const apiModels = await fetchAvailableModels();
        
        // Build list of models to try
        // Use API models if available, otherwise try common names
        const modelsToCheck = apiModels.length > 0 
            ? apiModels
            : [
                "gemini-1.5-flash-latest",
                "gemini-1.5-pro-latest", 
                "gemini-1.5-flash",
                "gemini-1.5-pro",
                "gemini-pro",
                "gemini-pro-vision", // Older vision model
                "models/gemini-1.5-flash",
                "models/gemini-pro"
            ];
        
        console.log(`Testing ${modelsToCheck.length} models:`, modelsToCheck);
        
        const availableModels: string[] = [];
        let lastError: any = null;
        
        // Try each model with a simple text request
        for (const modelName of modelsToCheck) {
            try {
                console.log(`Testing model: ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                // Make a minimal text request to test if model is available
                const testResult = await model.generateContent("test");
                const response = await testResult.response;
                const text = response.text();
                
                availableModels.push(modelName);
                console.log(`✅ Model ${modelName} is available! Response: "${text.substring(0, 50)}..."`);
                
                // Found a working model, continue to test a few more to see all options
                if (availableModels.length >= 3) {
                    break; // Stop after finding 3 working models
                }
            } catch (error: any) {
                lastError = error;
                const errorMsg = error.message || String(error);
                console.log(`❌ Model ${modelName} failed:`, errorMsg.substring(0, 150));
                
                // Check for 429 (quota exceeded) FIRST - this is not an auth error
                if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("Quota exceeded")) {
                    const retryDelay = errorMsg.match(/retry in ([\d.]+)s/)?.[1] || errorMsg.match(/(\d+)s/)?.[1] || "unknown";
                    return {
                        success: false,
                        availableModels: [],
                        error: `API Quota Exceeded (429): You've reached the free tier limit (20 requests/day). Please wait ${retryDelay} seconds or upgrade your plan. See https://ai.google.dev/gemini-api/docs/rate-limits`
                    };
                }
                
                // Check for 429 (quota exceeded) FIRST - this is not an auth error
                if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("Quota exceeded")) {
                    const retryDelay = errorMsg.match(/retry in ([\d.]+)s/)?.[1] || errorMsg.match(/(\d+)s/)?.[1] || "unknown";
                    return {
                        success: false,
                        availableModels: [],
                        error: `API Quota Exceeded (429): You've reached the free tier limit (20 requests/day). Please wait ${retryDelay} seconds or upgrade your plan. See https://ai.google.dev/gemini-api/docs/rate-limits`
                    };
                }
                
                // If it's not a 404 (model not found), it might be a different issue
                // Stop trying if it's an authentication/permission error
                if (errorMsg.includes("403") || errorMsg.includes("API_KEY") || errorMsg.includes("PERMISSION") || errorMsg.includes("401")) {
                    return {
                        success: false,
                        availableModels: [],
                        error: `API authentication error (403/401). Your API key may be invalid or expired. Please: 1) Check your API key at https://ai.google.dev/, 2) Ensure the key is not restricted, 3) Try regenerating the API key. Error: ${errorMsg.substring(0, 150)}`
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
            
            // Check for 429 (quota exceeded) first
            if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("Quota exceeded")) {
                const retryDelay = errorMsg.match(/retry in ([\d.]+)s/)?.[1] || "unknown";
                return {
                    success: false,
                    availableModels: [],
                    error: `API Quota Exceeded (429): You've reached the free tier limit (20 requests/day). Please wait ${retryDelay} seconds or upgrade your plan. See https://ai.google.dev/gemini-api/docs/rate-limits`
                };
            }
            
            // Provide more specific error messages
            if (errorMsg.includes("404") || errorMsg.includes("not found")) {
                const suggestions = apiModels.length > 0
                    ? `Found ${apiModels.length} models in API but none worked. Your API key might not have access to generateContent method. Check permissions at https://ai.google.dev/`
                    : `Could not fetch available models. Possible issues: 1) API key is invalid or expired, 2) Generative Language API not enabled in Google Cloud Console, 3) API key doesn't have required permissions, 4) Network/CORS issues. Try: https://ai.google.dev/ to regenerate API key.`;
                
                return {
                    success: false,
                    availableModels: [],
                    error: suggestions
                };
            } else if (errorMsg.includes("API_KEY") || errorMsg.includes("403") || errorMsg.includes("401")) {
                return {
                    success: false,
                    availableModels: [],
                    error: `Invalid API key or insufficient permissions (403/401). Please: 1) Check your API key at https://ai.google.dev/, 2) Ensure it's not restricted, 3) Regenerate the key if needed.`
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
 * Convert image file to base64 for Gemini API
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
 * Extract brand kit from image using Gemini Vision API
 */
export async function extractBrandKitFromImage(file: File): Promise<GeminiExtractionResult> {
    try {
        if (!GEMINI_API_KEY || !genAI) {
            throw new Error("GEMINI_API_KEY is not set. Please create a .env file with your API key.");
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
  "tone": "brief description of brand tone (e.g., 'Professional and modern', 'Playful and energetic')"
}

Important guidelines:
1. For colors: Identify the most prominent colors and categorize them by their visual role (primary = main brand colors, secondary = supporting colors, accent = highlights, neutral = grays/backgrounds)
2. For typography: Infer font family from appearance (Sans-serif, Serif, etc.) and estimate weights. Identify which text is heading vs body vs caption based on size and visual hierarchy.
3. For spacing: Analyze gaps between sections, paragraphs, and elements to determine the spacing system (often based on an 8px or 4px grid)
4. If a logo is visible, note it but don't extract the actual image (we'll handle logo extraction separately)
5. Return valid JSON only, no markdown formatting or explanations

Now analyze the image and return the JSON:`;

        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: file.type || "image/png"
            }
        };

        let result;
        let lastError;
        
        // Try different models in order of preference
        // Start with the newest available models, then fall back to older ones
        // Based on what was found available: gemini-2.5-flash, gemini-flash-latest, gemini-flash-lite-latest
        const modelsToTry = [
            "gemini-2.5-flash",
            "gemini-flash-latest",
            "gemini-flash-lite-latest",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest", 
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-pro-vision", // Older vision-specific model
            "gemini-pro",
            "models/gemini-2.5-flash",
            "models/gemini-flash-latest"
        ];
        
        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying model: ${modelName} for vision extraction...`);
                const currentModel = genAI.getGenerativeModel({ model: modelName });
                result = await currentModel.generateContent([prompt, imagePart]);
                console.log(`✅ Successfully used model: ${modelName}`);
                break; // Success, exit loop
            } catch (error: any) {
                lastError = error;
                const errorMsg = error.message || String(error);
                
                // If 429 (quota exceeded), stop trying and give clear message
                if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("Quota exceeded")) {
                    const retryDelay = errorMsg.match(/retry in ([\d.]+)s/)?.[1] || "unknown";
                    throw new Error(`API Quota Exceeded: You've reached the free tier limit (20 requests/day). Please wait ${retryDelay} seconds or upgrade your plan. See https://ai.google.dev/gemini-api/docs/rate-limits`);
                }
                
                // If 404, try next model
                if (errorMsg.includes("404") || errorMsg.includes("not found")) {
                    console.warn(`Model ${modelName} not available (404), trying next...`);
                    continue;
                }
                // If authentication error, don't try more models
                if (errorMsg.includes("403") || errorMsg.includes("API_KEY") || errorMsg.includes("PERMISSION")) {
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
1. Check that your API key has access to vision models at https://ai.google.dev/
2. Ensure the Generative Language API is enabled in Google Cloud Console
3. Try regenerating your API key
4. Check the browser console for detailed error messages`);
        }
        
        const response = await result.response;
        const text = response.text();
        
        // Clean the response text (remove markdown code blocks if present)
        let jsonText = text.trim();
        if (jsonText.startsWith("```json")) {
            jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
        } else if (jsonText.startsWith("```")) {
            jsonText = jsonText.replace(/```\n?/g, "");
        }
        
        const brandKit = JSON.parse(jsonText) as GeminiExtractionResult;
        return brandKit;
        
    } catch (error) {
        console.error("Error extracting brand kit:", error);
        throw new Error(`Failed to extract brand kit: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Extract logo from image using Gemini Vision API
 * This tries to identify and describe the logo area for extraction
 */
export async function extractLogosFromImage(file: File): Promise<{ full?: string; icon?: string }> {
    try {
        // Use the same models as extraction - try available models first
        const modelsToTry = [
            "gemini-2.5-flash",
            "gemini-flash-latest",
            "gemini-flash-lite-latest",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest", 
            "gemini-1.5-flash",
            "gemini-pro"
        ];
        
        let model;
        for (const modelName of modelsToTry) {
            try {
                model = genAI.getGenerativeModel({ model: modelName });
                // Test if model works with a simple request
                await model.generateContent("test");
                console.log(`Using model ${modelName} for logo extraction`);
                break;
            } catch (error: any) {
                if (error.message?.includes("404") || error.message?.includes("not found")) {
                    continue; // Try next model
                }
                throw error; // Other errors should be thrown
            }
        }
        
        if (!model) {
            console.warn("No available models found for logo extraction, skipping...");
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

        const imagePart = {
            inlineData: {
                data: imageBase64,
                mimeType: file.type || "image/png"
            }
        };

        const result = await model.generateContent([prompt, imagePart]);
        const response = await result.response;
        const text = response.text();
        
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
