/**
 * Mistral Image Generation Service
 * Uses Mistral Agents API with image_generation tool to create templates
 * Based on: https://docs.mistral.ai/agents/tools/built-in/image_generation
 */

const MISTRAL_API_KEY: string = (process?.env?.MISTRAL_API_KEY as string) || "";
// Use backend proxy to avoid CORS issues
// Set PROXY_URL in .env or use default localhost:3001
const PROXY_URL = (process?.env?.PROXY_URL as string) || "http://localhost:3001";
const USE_PROXY = true; // Set to false to use direct API (will fail due to CORS)

const MISTRAL_AGENTS_API_URL = USE_PROXY 
    ? `${PROXY_URL}/api/mistral/agents`
    : "https://api.mistral.ai/v1/beta/agents";
const MISTRAL_CONVERSATIONS_API_URL = USE_PROXY
    ? `${PROXY_URL}/api/mistral/conversations/start`
    : "https://api.mistral.ai/v1/conversations";
const MISTRAL_FILES_API_URL = USE_PROXY
    ? `${PROXY_URL}/api/mistral/files`
    : "https://api.mistral.ai/v1/files";

if (!MISTRAL_API_KEY) {
    console.warn("⚠️ MISTRAL_API_KEY is not set! Mistral image generation will be disabled.");
}

export interface GeneratedTemplate {
    name: string;
    type: 'hero' | 'card' | 'grid' | 'sidebar' | 'fullscreen' | 'magazine' | 'minimal';
    imageBase64: string;
    description: string;
    usage?: string;
}

/**
 * Create a Mistral agent with image generation capability
 */
async function createImageGenerationAgent(): Promise<string> {
    // When using proxy, API key check is not needed (proxy handles it)
    if (!USE_PROXY && !MISTRAL_API_KEY) {
        throw new Error("MISTRAL_API_KEY is not set");
    }

    try {
        // When using proxy, don't send API key (proxy handles it)
        // When using direct API, send API key
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        
        if (!USE_PROXY && MISTRAL_API_KEY) {
            headers["Authorization"] = `Bearer ${MISTRAL_API_KEY}`;
        }

        const response = await fetch(`${MISTRAL_AGENTS_API_URL}`, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                model: "mistral-medium-latest",
                name: "Brand Kit Template Generator",
                description: "Agent used to generate brand kit templates based on design guidelines.",
                instructions: "Use the image generation tool to create professional brand templates that showcase the brand's colors, typography, and design language. Generate clean, modern templates suitable for marketing materials.",
                tools: [{ type: "image_generation" }],
                completion_args: {
                    temperature: 0.3,
                    top_p: 0.95,
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create agent: ${errorText}`);
        }

        const data = await response.json();
        return data.id;
    } catch (error: any) {
        // Check if it's a CORS error
        if (error.message?.includes("CORS") || 
            error.message?.includes("Failed to fetch") ||
            error.name === "TypeError") {
            const corsError = new Error("CORS_ERROR: Mistral Agents API does not support browser requests. Template generation requires a backend proxy.");
            (corsError as any).isCorsError = true;
            throw corsError;
        }
        console.error("Error creating Mistral agent:", error);
        throw error;
    }
}

/**
 * Generate a template image using Mistral's image generation agent
 */
async function generateTemplateWithAgent(
    agentId: string,
    prompt: string,
    onProgress?: (progress: string) => void
): Promise<string> {
    // When using proxy, API key check is not needed (proxy handles it)
    if (!USE_PROXY && !MISTRAL_API_KEY) {
        throw new Error("MISTRAL_API_KEY is not set");
    }

    try {
        onProgress?.("Starting conversation with Mistral image generation agent...");
        
        // Start a conversation with the agent
        // According to Mistral docs, we use conversations.start endpoint
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        
        if (!USE_PROXY && MISTRAL_API_KEY) {
            headers["Authorization"] = `Bearer ${MISTRAL_API_KEY}`;
        }

        const conversationResponse = await fetch(MISTRAL_CONVERSATIONS_API_URL, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                agent_id: agentId,
                inputs: prompt,
            }),
        });

        if (!conversationResponse.ok) {
            const errorText = await conversationResponse.text();
            let errorMessage = `Failed to start conversation: ${errorText}`;
            
            // Handle rate limit errors specifically
            if (conversationResponse.status === 429) {
                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.detail && errorJson.detail.includes("rate limit")) {
                        errorMessage = `Rate limit exceeded: Mistral's image generation API has reached its rate limit. Please wait a few minutes before trying again. If this persists, consider upgrading your Mistral API plan for higher rate limits.`;
                    }
                } catch (e) {
                    // If JSON parsing fails, use generic rate limit message
                    errorMessage = `Rate limit exceeded: Mistral's image generation API has reached its rate limit. Please wait a few minutes before trying again.`;
                }
            }
            
            throw new Error(errorMessage);
        }

        const conversationData = await conversationResponse.json();
        onProgress?.("Waiting for image generation...");

        // Wait for the response to complete (poll if needed)
        // According to Mistral docs, outputs contain entries with type "message.output"
        // and content chunks that can be "tool_file" type
        if (conversationData.outputs && conversationData.outputs.length > 0) {
            // Find the message.output entry
            for (const output of conversationData.outputs) {
                if (output.type === "message.output" && output.content && Array.isArray(output.content)) {
                    // Find the tool_file chunk
                    for (const chunk of output.content) {
                        if (chunk.type === "tool_file" && chunk.file_id) {
                            onProgress?.("Downloading generated template image...");
                            return await downloadImageFromMistral(chunk.file_id);
                        }
                    }
                }
            }
        }

        throw new Error("No image file found in agent response. The agent may still be processing.");
    } catch (error: any) {
        console.error("Error generating template with Mistral agent:", error);
        throw error;
    }
}

/**
 * Download an image from Mistral using file_id
 */
async function downloadImageFromMistral(fileId: string): Promise<string> {
    // When using proxy, API key check is not needed (proxy handles it)
    if (!USE_PROXY && !MISTRAL_API_KEY) {
        throw new Error("MISTRAL_API_KEY is not set");
    }

    try {
        const headers: Record<string, string> = {};
        
        if (!USE_PROXY && MISTRAL_API_KEY) {
            headers["Authorization"] = `Bearer ${MISTRAL_API_KEY}`;
        }

        const response = await fetch(`${MISTRAL_FILES_API_URL}/${fileId}`, {
            method: "GET",
            headers: headers,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to download file: ${errorText}`);
        }

        // Convert response to blob, then to base64
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Remove data URL prefix if present
                const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
                resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error: any) {
        console.error("Error downloading image from Mistral:", error);
        throw error;
    }
}

/**
 * Generate a brand kit template using Mistral's image generation
 */
export async function generateBrandKitTemplate(
    brandKit: any,
    referenceImageBase64?: string,
    customPrompt?: string, // Custom user instructions for template generation
    onProgress?: (progress: string) => void
): Promise<GeneratedTemplate | null> {
    // When using proxy, API key check is not needed (proxy handles it)
    if (!USE_PROXY && !MISTRAL_API_KEY) {
        console.warn("MISTRAL_API_KEY not set, skipping template generation");
        return null;
    }

    try {
        onProgress?.("Creating Mistral image generation agent...");
        
        // Create agent (or reuse if we cache it)
        // Note: This will fail with CORS error in browser - Mistral Agents API doesn't support CORS
        const agentId = await createImageGenerationAgent();
        
        // Build prompt based on brand kit and user instructions
        const primaryColors = brandKit.colors?.primary?.map((c: any) => c.hex).join(", ") || "";
        const typography = brandKit.typography?.map((t: any) => t.fontFamily).filter(Boolean).join(", ") || "";
        const designLanguage = brandKit.designLanguage || "modern and clean";
        const brandName = brandKit.brandName || "Brand";
        
        // Base prompt with brand kit information
        let basePrompt = `Generate a professional brand template design for ${brandName}. 

Brand Kit Requirements:
- Primary Colors: ${primaryColors || "Use brand colors"}
- Typography: ${typography || "Use brand fonts"}
- Design Style: ${designLanguage}
- Include: Header area, main content area, footer area
- Style: Clean, modern, professional
- Layout: Balanced composition with proper spacing
- Colors: Use the brand's primary colors prominently
- Typography: Showcase the brand's typography system`;

        // Add custom user instructions if provided
        let prompt = basePrompt;
        if (customPrompt && customPrompt.trim()) {
            prompt = `${basePrompt}

User Instructions:
${customPrompt}

Create a complete template that follows the user's instructions while incorporating the brand kit elements. The template should be suitable for marketing materials, presentations, or digital content.`;
        } else {
            prompt = `${basePrompt}

Create a complete template that demonstrates how to use the brand kit elements together. The template should be suitable for marketing materials, presentations, or digital content.`;
        }

        onProgress?.("Generating template image with Mistral...");
        const imageBase64 = await generateTemplateWithAgent(agentId, prompt, onProgress);
        
        return {
            name: `${brandName} Template`,
            type: 'hero',
            imageBase64: imageBase64,
            description: `Professional brand template showcasing ${brandName}'s design system`,
            usage: "Use this template as a starting point for marketing materials, presentations, and digital content."
        };
    } catch (error: any) {
        // Check if it's a CORS error
        if ((error as any).isCorsError || 
            error.message?.includes("CORS") || 
            error.message?.includes("Failed to fetch")) {
            console.warn("Template generation unavailable: Mistral Agents API requires a backend proxy (CORS limitation)");
            onProgress?.("ℹ️ Template generation skipped (requires backend - CORS limitation)");
            return null;
        }
        console.error("Error generating brand kit template:", error);
        onProgress?.("⚠️ Template generation failed, continuing without template");
        return null;
    }
}
