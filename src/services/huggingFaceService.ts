/**
 * Hugging Face Service for Janus-1.3B Integration
 * Supports both Inference API and custom backend endpoints
 */

// Get API key from environment variable
const HUGGINGFACE_API_KEY: string = (process?.env?.HUGGINGFACE_API_KEY as string) || "";
const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models";

// For Janus-1.3B, we'll use the model endpoint
// Note: If model isn't deployed, you'll need to deploy it or use a custom backend
const JANUS_MODEL_ID = "deepseek-ai/Janus-1.3B";

if (!HUGGINGFACE_API_KEY) {
    console.warn("⚠️ HUGGINGFACE_API_KEY is not set! Logo generation will be disabled.");
    console.warn("Create .env file: HUGGINGFACE_API_KEY=your_api_key_here");
    console.warn("Get your API key from: https://huggingface.co/settings/tokens");
}

/**
 * Check if Hugging Face API is available
 */
export async function checkHuggingFaceAPI(): Promise<{ 
    success: boolean; 
    modelAvailable: boolean; 
    error?: string 
}> {
    if (!HUGGINGFACE_API_KEY) {
        return {
            success: false,
            modelAvailable: false,
            error: "HUGGINGFACE_API_KEY is not set. Please create a .env file with your API key."
        };
    }

    try {
        // Check if model is available via Inference API
        const response = await fetch(`${HUGGINGFACE_API_URL}/${JANUS_MODEL_ID}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
            },
        });

        if (response.ok) {
            return {
                success: true,
                modelAvailable: true,
            };
        } else if (response.status === 404) {
            return {
                success: false,
                modelAvailable: false,
                error: "Janus-1.3B model is not deployed on Hugging Face Inference API. You may need to deploy it or use a custom backend."
            };
        } else {
            const errorText = await response.text();
            return {
                success: false,
                modelAvailable: false,
                error: `API error (${response.status}): ${errorText.substring(0, 200)}`
            };
        }
    } catch (error: any) {
        return {
            success: false,
            modelAvailable: false,
            error: `Failed to check API: ${error.message || String(error)}`
        };
    }
}

/**
 * Generate image using Janus with reference image
 * @param prompt Description of what to generate
 * @param style Brand style description
 * @param colors Brand colors to incorporate
 * @param referenceImageBase64 Optional reference image (base64) to guide generation
 * @param onProgress Optional progress callback
 * @returns Base64 encoded PNG image
 */
export async function generateImageWithJanus(
    prompt: string,
    style: string,
    colors: string[] = [],
    referenceImageBase64?: string,
    onProgress?: (progress: string) => void
): Promise<string> {
    onProgress?.("Initializing Janus image generation...");
    
    // Try custom backend first (if available)
    const JANUS_BACKEND_URL = process?.env?.JANUS_BACKEND_URL || "http://localhost:8000";
    
    try {
        onProgress?.("Connecting to Janus backend...");
        const response = await fetch(`${JANUS_BACKEND_URL}/generate/image`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt,
                style,
                colors,
                reference_image: referenceImageBase64,
            }),
        });

        if (response.ok) {
            onProgress?.("Generating image with Janus...");
            const data = await response.json();
            onProgress?.("Image generated successfully!");
            return data.image_base64;
        }
    } catch (error) {
        console.log("Custom backend not available, trying Hugging Face API...");
    }

    // Fallback to Hugging Face API
    return generateImageWithHuggingFace(prompt, style, colors, referenceImageBase64, onProgress);
}

/**
 * Generate image using Hugging Face Inference API
 */
async function generateImageWithHuggingFace(
    prompt: string,
    style: string,
    colors: string[] = [],
    referenceImageBase64?: string,
    onProgress?: (progress: string) => void
): Promise<string> {
    if (!HUGGINGFACE_API_KEY) {
        throw new Error("HUGGINGFACE_API_KEY is not set. Please configure your API key.");
    }

    onProgress?.("Preparing prompt for Hugging Face...");
    
    // Construct detailed prompt with reference image context
    let fullPrompt = `Create a professional design: ${prompt}. Style: ${style}.`;
    if (colors.length > 0) {
        fullPrompt += ` Use these brand colors: ${colors.join(", ")}.`;
    }
    if (referenceImageBase64) {
        fullPrompt += ` Reference the uploaded design's style, composition, and aesthetic. Match the visual language and design approach.`;
    }
    fullPrompt += ` Generate a high-quality image that represents the brand identity.`;

    try {
        onProgress?.("Sending request to Hugging Face API...");
        
        // Use a text-to-image model (Stable Diffusion or similar)
        // Note: Janus-1.3B might not be available, so we'll use a compatible model
        const IMAGE_MODEL = process?.env?.IMAGE_GENERATION_MODEL || "stabilityai/stable-diffusion-2-1";
        
        const response = await fetch(`${HUGGINGFACE_API_URL}/${IMAGE_MODEL}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: fullPrompt,
                parameters: {
                    num_inference_steps: 50,
                    guidance_scale: 7.5,
                    width: 512,
                    height: 512,
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Hugging Face API error (${response.status}): ${errorText}`);
        }

        onProgress?.("Processing generated image...");
        const imageBlob = await response.blob();
        
        // Convert blob to base64
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                const base64 = result.split(',')[1];
                onProgress?.("Image ready!");
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(imageBlob);
        });
    } catch (error: any) {
        console.error("Error generating image with Hugging Face:", error);
        throw new Error(`Failed to generate image: ${error.message || String(error)}`);
    }
}

/**
 * Generate logo using Janus-1.3B via Hugging Face Inference API
 * @param prompt Description of the logo to generate
 * @param style Brand style description
 * @param colors Brand colors to incorporate
 * @param referenceImageBase64 Optional reference image
 * @param onProgress Optional progress callback
 * @returns Base64 encoded PNG image
 */
export async function generateLogoWithJanus(
    prompt: string,
    style: string,
    colors: string[] = [],
    referenceImageBase64?: string,
    onProgress?: (progress: string) => void
): Promise<string> {
    if (!HUGGINGFACE_API_KEY) {
        throw new Error("HUGGINGFACE_API_KEY is not set. Please configure your API key.");
    }

    return generateImageWithJanus(
        `Create a professional logo design: ${prompt}`,
        style,
        colors,
        referenceImageBase64,
        onProgress
    );
}

/**
 * Generate pattern using Janus-1.3B
 * @param description Pattern description
 * @param colors Brand colors to use
 * @param patternType Type of pattern (geometric, organic, abstract, etc.)
 * @returns Base64 encoded PNG image
 */
export async function generatePatternWithJanus(
    description: string,
    colors: string[] = [],
    patternType: string = "geometric",
    referenceImageBase64?: string,
    onProgress?: (progress: string) => void
): Promise<string> {
    return generateImageWithJanus(
        `Create a seamless ${patternType} pattern: ${description}. The pattern should be tileable and suitable for background use. Make it subtle and professional.`,
        "geometric pattern style",
        colors,
        referenceImageBase64,
        onProgress
    );
}

/**
 * Alternative: Use custom backend endpoint (if you deploy Janus-1.3B yourself)
 * This is useful if the model isn't available on Hugging Face Inference API
 */
export async function generateLogoWithCustomBackend(
    prompt: string,
    style: string,
    colors: string[] = [],
    backendUrl: string = "http://localhost:8000"
): Promise<string> {
    try {
        const response = await fetch(`${backendUrl}/generate/logo`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt,
                style,
                colors,
                model: "janus-1.3b",
            }),
        });

        if (!response.ok) {
            throw new Error(`Backend error (${response.status}): ${await response.text()}`);
        }

        const data = await response.json();
        return data.image_base64; // Backend should return { image_base64: "..." }
    } catch (error: any) {
        console.error("Error with custom backend:", error);
        throw new Error(`Failed to generate logo via backend: ${error.message || String(error)}`);
    }
}

/**
 * Generate multiple logo variations
 */
export async function generateLogoVariations(
    baseDescription: string,
    style: string,
    colors: string[],
    referenceImageBase64?: string,
    onProgress?: (progress: string) => void
): Promise<Array<{ variant: string; base64: string }>> {
    const variations = [
        { variant: "full", prompt: `${baseDescription}, full logo with wordmark` },
        { variant: "icon", prompt: `${baseDescription}, icon mark only, simplified symbol` },
        { variant: "monochrome", prompt: `${baseDescription}, monochrome version, single color` },
        { variant: "minimal", prompt: `${baseDescription}, minimal geometric version` },
    ];

    const results: Array<{ variant: string; base64: string }> = [];
    
    for (let i = 0; i < variations.length; i++) {
        const variation = variations[i];
        try {
            onProgress?.(`Generating ${variation.variant} logo (${i + 1}/${variations.length})...`);
            const base64 = await generateLogoWithJanus(
                variation.prompt, 
                style, 
                colors,
                referenceImageBase64,
                (msg) => onProgress?.(`${variation.variant}: ${msg}`)
            );
            results.push({
                variant: variation.variant,
                base64,
            });
        } catch (error) {
            console.error(`Error generating ${variation.variant} logo:`, error);
            // Continue with other variations even if one fails
        }
    }

    return results;
}
