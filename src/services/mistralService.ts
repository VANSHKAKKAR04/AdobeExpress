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

        const prompt = `You are a brand identity expert. Analyze this image or PDF (which could be a brand kit document, website screenshot, app UI, poster, or brand material) and extract the COMPLETE and COMPREHENSIVE brand kit information.

This may be a brand kit PDF with detailed guidelines. Extract ALL information including logos, colors, typography, characters, imagery, and design language.

Extract the following information and return ONLY a valid JSON object with no additional text:

{
  "brand_name": "brand name if visible",
  "brand_year": "year or event name if visible (e.g., '2025', 'Moksha'25')",
  "design_language": "detailed description of the design style, aesthetic, and visual approach (e.g., 'Mythical Echoes blends earthy tones with mystical hues, incorporating natural textures like moss and bark enhanced by soft glows')",
  "colors": {
    "primary": ["#hex1", "#hex2"],
    "secondary": ["#hex3"],
    "accent": ["#hex4"],
    "neutral": ["#hex5", "#hex6"],
    "background": ["#hex7"],
    "foreground": ["#hex8"]
  },
  "color_meaning": {
    "earth": ["#hex colors representing earth element"],
    "water": ["#hex colors representing water element"],
    "fire": ["#hex colors representing fire element"],
    "air": ["#hex colors representing air element"]
  },
  "typography": {
    "heading": {
      "font": "exact font family name if visible (e.g., 'Cinzel', 'Playfair Display', 'EB Garamond') or approximate if not visible",
      "weight": "light|regular|medium|bold|black|semi-bold",
      "size": number_in_points,
      "style": "normal|italic"
    },
    "subheading": {
      "font": "font family name",
      "weight": "light|regular|medium|bold|black|semi-bold",
      "size": number_in_points,
      "style": "normal|italic"
    },
    "body": {
      "font": "font family name",
      "weight": "light|regular|medium|bold|black|semi-bold",
      "size": number_in_points,
      "style": "normal|italic"
    },
    "caption": {
      "font": "font family name",
      "weight": "light|regular|medium|bold|black|semi-bold",
      "size": number_in_points,
      "style": "normal|italic"
    },
    "display": {
      "font": "font family name for large display text",
      "weight": "light|regular|medium|bold|black|semi-bold",
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
    "wordmark_description": "detailed description of the wordmark logo (e.g., 'sharp angular typeface inspired by dragon spikes, M symbolizes dragon head with pointed horns, A forms tail')",
    "logomark_description": "detailed description of the logomark/icon (e.g., 'front-facing dragon mascot integrated with letter M')",
    "logo_style": "description of logo style (geometric, organic, minimalist, ornate, etc.)",
    "styles": {
      "clear_space": "minimum clear space requirement (e.g., '10% of logo width', '2x logo height', '24px')",
      "min_size": "minimum size requirement (e.g., '50px height for digital', '1.5cm for print')",
      "usage": ["guideline 1", "guideline 2", "guideline 3"],
      "donts": ["what not to do 1", "what not to do 2"]
    }
  },
  "characters": [
    {
      "name": "character name (e.g., 'Dragon', 'Kelpie', 'Phoenix')",
      "type": "mascot|character|symbol",
      "element": "earth|water|fire|air|other",
      "description": "detailed description of the character for image generation",
      "usage": "when and how to use this character"
    }
  ],
  "imagery": {
    "style": "description of imagery style (e.g., 'mythical motifs such as glowing mushrooms, enchanted castles, fantastical creatures')",
    "guidelines": ["imagery guideline 1", "imagery guideline 2"],
    "themes": ["theme 1", "theme 2"]
  },
  "graphics": {
    "patterns": ["description of pattern 1", "description of pattern 2"],
    "illustrations": "description of illustration style (e.g., 'Minimalist line art', 'Bold geometric shapes', 'Hand-drawn sketches', 'Organic flowing shapes merged with geometric patterns')",
    "icons": [
      {
        "name": "icon name or category",
        "description": "description of icon style",
        "usage": "when to use",
        "category": "social|navigation|action|decorative|other"
      }
    ],
    "textures": ["description of texture 1 (e.g., 'moss', 'bark', 'natural textures')"],
    "visible_logos": [
      {
        "name": "logo/graphic name (e.g., 'NSS Logo', 'NSUT Logo', 'Company Badge')",
        "type": "logo|icon|badge|emblem|symbol|graphic",
        "description": "detailed description of the logo/graphic",
        "position": {
          "x": number (percentage 0-100, approximate horizontal position from left),
          "y": number (percentage 0-100, approximate vertical position from top),
          "width": number (percentage 0-100, approximate width),
          "height": number (percentage 0-100, approximate height)
        },
        "usage": "when and how to use this graphic"
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
  "tone": "brief description of brand tone (e.g., 'Mythical and harmonious, inviting reflection on nature and protection')",
  "brand_message": "core brand message or tagline if visible"
}

Important guidelines:
1. For colors: Extract ALL color hex codes visible. If colors are organized by elements (earth, water, fire, air), include them in color_meaning. Identify the most prominent colors and categorize them by their visual role (primary = main brand colors, secondary = supporting colors, accent = highlights, neutral = grays/backgrounds).
2. For typography: Extract EXACT font names if visible in the document (e.g., 'Cinzel', 'Playfair Display', 'EB Garamond', 'Against', 'Firlest'). Include all font weights mentioned (regular, bold, semi-bold, italic, etc.). Identify which text is heading vs body vs caption based on size and visual hierarchy.
3. For logos: Extract detailed descriptions of wordmark and logomark. These descriptions will be used for AI image generation, so be very specific about visual elements, shapes, and style.
4. For characters: If mascots or characters are mentioned (e.g., Dragon, Kelpie, Reindeer, Phoenix, Pegasus), extract their names, descriptions, and associated elements. These will be used for image generation.
5. For imagery: Extract imagery style descriptions, themes, and guidelines. Be specific about visual motifs, styles, and usage.
6. For design_language: Extract the overall design philosophy, aesthetic description, and visual approach. This is crucial for maintaining brand consistency.
7. For spacing: Analyze gaps between sections, paragraphs, and elements to determine the spacing system (often based on an 8px or 4px grid).
8. For graphics: Identify any patterns (geometric, organic, abstract), illustration styles, textures, or icon styles used. Be specific about characteristics, colors used, and usage contexts.
9. For contrast rules: Analyze text-on-background combinations and determine WCAG contrast ratios.
10. For characters: Even if no explicit characters/mascots are visible, infer potential brand mascots or symbolic characters based on the design style, colors, and theme. For example, if the design has nature themes, suggest characters like animals or nature spirits. If tech-focused, suggest abstract or geometric characters. Be creative but relevant.

11. For imagery: Even if specific imagery isn't shown, describe the type of imagery that would fit this brand based on the design language, colors, and overall aesthetic. Suggest themes, styles, and visual motifs that align with the brand identity.

12. For design_language: Create a compelling, detailed description of the design aesthetic. This should be comprehensive and capture the essence of the brand's visual identity, even if inferred from limited information.

13. For visible_logos: This is THE MOST IMPORTANT task. Identify ALL visible logos, badges, emblems, icons, and graphics in the image. Look carefully at every corner and section of the image. For each graphic element you find, provide:
    - Exact name if visible (e.g., "NSS Logo", "NSUT Logo", "Company Badge", "Event Emblem")
    - Type (logo, icon, badge, emblem, symbol, graphic)
    - Approximate position as percentages (x, y, width, height) - be as accurate as possible. 
      * x: horizontal position of top-left corner (0-100, where 0 is left edge, 100 is right edge)
      * y: vertical position of top-left corner (0-100, where 0 is top edge, 100 is bottom edge)
      * width: horizontal width of the graphic (0-100, as percentage of image width)
      * height: vertical height of the graphic (0-100, as percentage of image height)
      * IMPORTANT: Be precise with positions. If a logo is in the top-left corner, use small x and y values (e.g., x: 5, y: 5). If it's centered, use values around 50. If it's bottom-right, use large values (e.g., x: 85, y: 90).
      * For width and height, estimate the actual size relative to the image. A small icon might be 5-10%, while a large logo might be 20-30%.
    - Description of what it looks like (colors, shapes, text if any, distinctive features)
    - Usage context if apparent
    These graphics will be automatically extracted and cropped from the image to be included in the brand kit for designers to use directly. Be thorough and identify every graphic element. Accuracy in position detection is critical for successful extraction.

14. IMPORTANT: Do not use special characters like asterisks, exclamation marks, arrows, or emojis in any text fields. Use plain text only. Return valid JSON only, no markdown formatting or explanations. Use empty arrays/objects only if absolutely no information can be inferred. Be creative and comprehensive in your extraction.

Now analyze the image/PDF and return the JSON:`;

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
