/**
 * GPT-4 Vision Service for Enhanced Graphics Extraction
 * Provides more accurate graphics position detection as an alternative to Mistral
 */

// Get API key from environment variable
const OPENAI_API_KEY: string = (process?.env?.OPENAI_API_KEY as string) || "";
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

if (!OPENAI_API_KEY) {
    console.warn("⚠️ OPENAI_API_KEY is not set! GPT-4 Vision graphics extraction will be disabled.");
    console.warn("Create .env file: OPENAI_API_KEY=your_api_key_here");
    console.warn("Get your API key from: https://platform.openai.com/api-keys");
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
 * Extract graphics positions from image using GPT-4 Vision
 * This provides more accurate bounding box detection than Mistral
 */
export async function extractGraphicsWithGPT4Vision(
    imageBase64: string,
    mimeType: string = "image/png"
): Promise<GraphicsPosition[]> {
    if (!OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set. Please create a .env file with your API key.");
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

    try {
        const response = await fetch(OPENAI_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o", // GPT-4 Omni for vision tasks
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: prompt
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBase64}`
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 2000,
                temperature: 0.3, // Lower temperature for more precise results
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenAI API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            const content = data.choices[0].message.content.trim();
            
            // Clean the response (remove markdown code blocks if present)
            let jsonText = content;
            if (jsonText.startsWith("```json")) {
                jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
            } else if (jsonText.startsWith("```")) {
                jsonText = jsonText.replace(/```\n?/g, "");
            }
            
            const graphics = JSON.parse(jsonText);
            
            if (Array.isArray(graphics)) {
                return graphics as GraphicsPosition[];
            } else {
                throw new Error("Invalid response format: expected array");
            }
        } else {
            throw new Error("Invalid response format from OpenAI API");
        }
    } catch (error: any) {
        console.error("Error extracting graphics with GPT-4 Vision:", error);
        throw new Error(`Failed to extract graphics with GPT-4 Vision: ${error.message || String(error)}`);
    }
}

/**
 * Check if GPT-4 Vision API is available
 */
export async function checkGPT4VisionAPI(): Promise<{ 
    success: boolean; 
    error?: string 
}> {
    if (!OPENAI_API_KEY) {
        return {
            success: false,
            error: "OPENAI_API_KEY is not set. Please create a .env file with your API key."
        };
    }

    try {
        // Simple test request to check API availability
        const response = await fetch(OPENAI_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "user", content: "test" }],
                max_tokens: 5,
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
