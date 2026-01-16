/**
 * Brand Kit Storage Service
 * Handles saving, loading, and deleting brand kits using browser LocalStorage
 */

import { BrandKit } from "../models/BrandKit";

export interface SavedBrandKit {
    id: string;
    name: string;
    createdAt: string;
    brandKit: BrandKit;
    sourceFileName?: string;
}

const STORAGE_KEY = "saved_brand_kits";
const MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit for LocalStorage

/**
 * Get all saved brand kits
 */
export function getSavedBrandKits(): SavedBrandKit[] {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return [];
        }
        return JSON.parse(stored) as SavedBrandKit[];
    } catch (error) {
        console.error("Error loading saved brand kits:", error);
        return [];
    }
}

/**
 * Save a brand kit
 */
export function saveBrandKit(
    brandKit: BrandKit,
    name: string,
    sourceFileName?: string
): { success: boolean; error?: string } {
    try {
        const savedKits = getSavedBrandKits();
        
        // Check storage size
        const newKit: SavedBrandKit = {
            id: `brandkit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: name || `Brand Kit ${new Date().toLocaleDateString()}`,
            createdAt: new Date().toISOString(),
            brandKit,
            sourceFileName,
        };
        
        const serialized = JSON.stringify([...savedKits, newKit]);
        const sizeInBytes = new Blob([serialized]).size;
        
        if (sizeInBytes > MAX_STORAGE_SIZE) {
            return {
                success: false,
                error: "Storage limit reached. Please delete some saved brand kits first.",
            };
        }
        
        savedKits.push(newKit);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedKits));
        
        return { success: true };
    } catch (error) {
        console.error("Error saving brand kit:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to save brand kit",
        };
    }
}

/**
 * Get a saved brand kit by ID
 */
export function getSavedBrandKit(id: string): SavedBrandKit | null {
    try {
        const savedKits = getSavedBrandKits();
        return savedKits.find(kit => kit.id === id) || null;
    } catch (error) {
        console.error("Error loading brand kit:", error);
        return null;
    }
}

/**
 * Delete a saved brand kit
 */
export function deleteSavedBrandKit(id: string): { success: boolean; error?: string } {
    try {
        const savedKits = getSavedBrandKits();
        const filtered = savedKits.filter(kit => kit.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return { success: true };
    } catch (error) {
        console.error("Error deleting brand kit:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete brand kit",
        };
    }
}

/**
 * Update a saved brand kit name
 */
export function updateSavedBrandKitName(id: string, newName: string): { success: boolean; error?: string } {
    try {
        const savedKits = getSavedBrandKits();
        const kit = savedKits.find(k => k.id === id);
        if (!kit) {
            return { success: false, error: "Brand kit not found" };
        }
        kit.name = newName;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedKits));
        return { success: true };
    } catch (error) {
        console.error("Error updating brand kit name:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update brand kit name",
        };
    }
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): { used: number; max: number; percentage: number } {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const size = stored ? new Blob([stored]).size : 0;
        return {
            used: size,
            max: MAX_STORAGE_SIZE,
            percentage: (size / MAX_STORAGE_SIZE) * 100,
        };
    } catch (error) {
        return { used: 0, max: MAX_STORAGE_SIZE, percentage: 0 };
    }
}
