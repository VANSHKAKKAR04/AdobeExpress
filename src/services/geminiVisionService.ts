/**
 * Gemini Vision Service for Graphics Extraction
 * Free alternative to GPT-4 Vision
 */

const GEMINI_API_KEY: string = (process?.env?.GEMINI_API_KEY as string) || "";
// Use gemini-2.5-flash-image for vision tasks (optimized for image analysis with structured outputs)
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

if (!GEMINI_API_KEY) {
    console.warn("⚠️ GEMINI_API_KEY is not set! Gemini Vision graphics extraction will be disabled.");
    console.warn("Get your API key from: https://aistudio.google.com/app/apikey");
}

export interface GraphicsPosition {
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
}

/**
 * Extract graphics positions from image using Gemini Vision
 * Free alternative to GPT-4 Vision
 */
export async function extractGraphicsWithGemini(
    imageBase64: string,
    mimeType: string = "image/png"
): Promise<GraphicsPosition[]> {
    if (!GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set. Please create a .env file with your API key.");
    }

    const prompt = `You are a graphics detection expert. Analyze this image and identify ALL visible logos, badges, emblems, icons, and graphics.

For each graphic element you find, provide:
- Exact name if visible (e.g., "NSS Logo", "NSUT Logo", "Company Badge", "Event Emblem")
- Type (logo, icon, badge, emblem, symbol, graphic)
- Precise position as percentages:
  * x: horizontal position of top-left corner (0-100, where 0 is left edge, 100 is right edge)
  * y: vertical position of top-left corner (0-100, where 0 is top edge, 100 is bottom edge)
  * width: horizontal width of the graphic (0-100, as percentage of image width)
  * height: vertical height of the graphic (0-100, as percentage of image height)
- Description of what it looks like (colors, shapes, text if any, distinctive features)
- Usage context if apparent

CRITICAL: Be extremely precise with positions. Use the coordinate system where:
- Top-left corner of image is (0, 0)
- Bottom-right corner of image is (100, 100)
- Position values are percentages of the image dimensions

Return ONLY a valid JSON array with this structure:
[
  {
    "name": "logo name",
    "type": "logo|icon|badge|emblem|symbol|graphic",
    "description": "detailed description",
    "position": {
      "x": number (0-100),
      "y": number (0-100),
      "width": number (0-100),
      "height": number (0-100)
    },
    "usage": "usage context if apparent"
  }
]

Return valid JSON only, no markdown formatting or explanations.`;

    // Try multiple model names as fallback (stable versions first, avoid preview)
    // Note: Free tier has quota limits - if exceeded, will fallback to Mistral
    const modelNames = [
        "gemini-2.5-flash-image",      // Latest stable - optimized for image tasks
        "gemini-2.0-flash-preview-image-generation",
        "gemini-3-pro-image-preview"
                  // Fallback 3 (older model)
    ];
    
    let lastError: Error | null = null;
    
    for (const modelName of modelNames) {
        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`;
            const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: imageBase64
                                }
                            }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 2000,
                        responseMimeType: "application/json"
                    }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                // If 404, try next model
                if (response.status === 404) {
                    console.log(`Model ${modelName} not found, trying next...`);
                    lastError = new Error(`Model ${modelName} not available`);
                    continue;
                }
                // If 429 (quota exceeded), try next model
                if (response.status === 429) {
                    console.log(`Model ${modelName} quota exceeded, trying next model...`);
                    lastError = new Error(`Quota exceeded for ${modelName}`);
                    continue;
                }
                throw new Error(`Gemini API error (${response.status}): ${errorText}`);
            }
            
            // Success - use this response
            const data = await response.json();
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const content = data.candidates[0].content.parts[0].text.trim();
                
                // Clean the response (remove markdown code blocks if present)
                let jsonText = content;
                if (jsonText.startsWith("```json")) {
                    jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
                } else if (jsonText.startsWith("```")) {
                    jsonText = jsonText.replace(/```\n?/g, "");
                }
                
                const graphics = JSON.parse(jsonText);
                
                if (Array.isArray(graphics)) {
                    console.log(`✅ Successfully used model: ${modelName}`);
                    return graphics as GraphicsPosition[];
                } else {
                    throw new Error("Invalid response format: expected array");
                }
            } else {
                throw new Error("Invalid response format from Gemini API");
            }
        } catch (error: any) {
            lastError = error;
            // If it's a 404 or 429, try next model
            if (error.message?.includes("404") || error.message?.includes("not found")) {
                console.log(`Model ${modelName} not found, trying next...`);
                continue;
            }
            if (error.message?.includes("429") || error.message?.includes("quota") || error.message?.includes("RESOURCE_EXHAUSTED")) {
                console.log(`Model ${modelName} quota exceeded, trying next model...`);
                continue;
            }
            // For other errors, throw immediately
            throw error;
        }
    }
    
    // All models failed
    if (lastError) {
        throw new Error(`All Gemini models failed. Last error: ${lastError.message}`);
    }
    
    throw new Error("No Gemini models available");
}

/**
 * Check if Gemini Vision API is available
 */
export async function checkGeminiVisionAPI(): Promise<{ 
    success: boolean; 
    error?: string 
}> {
    if (!GEMINI_API_KEY) {
        return {
            success: false,
            error: "GEMINI_API_KEY is not set. Please create a .env file with your API key."
        };
    }

    try {
        // Simple test request to check API availability
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: "test" }]
                }],
                generationConfig: {
                    maxOutputTokens: 5,
                }
            }),
        });

        if (response.ok || response.status === 400) { // 400 is OK, means API is reachable
            return {
                success: true,
            };
        } else {
            const errorText = await response.text();
            return {
                success: false,
                error: `API error (${response.status}): ${errorText.substring(0, 200)}`
            };
        }
    } catch (error: any) {
        return {
            success: false,
            error: `Failed to check API: ${error.message || String(error)}`
        };
    }
}
