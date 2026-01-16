// This interface declares all the APIs that the document sandbox runtime ( i.e. code.ts ) exposes to the UI/iframe runtime
import { BrandKit } from "./BrandKit";

export interface DocumentSandboxApi {
    /**
     * Apply brand kit to the current Adobe Express document
     */
    applyBrandKit(brandKit: BrandKit): Promise<void>;
    
    /**
     * Create a brand kit preview by adding color swatches and typography samples
     */
    createBrandKitPreview(brandKit: BrandKit): Promise<void>;
    
    /**
     * Create a platform-optimized design in the document
     */
    createPlatformDesign(
        platform: string,
        aspectRatio: { width: number; height: number },
        headline: string,
        caption: string,
        brandColors: string[]
    ): Promise<void>;
}
