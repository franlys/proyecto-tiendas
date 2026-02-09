// Custom Category Types for Shop Personalization

export interface CustomCategory {
    id: string;           // Unique ID (e.g., "arreglos-florales")
    name: string;         // Display name (e.g., "Arreglos Florales")
    backgroundColor: string; // Hex color for badge background (e.g., "#4f46e5")
    textColor: string;    // Hex color for text (e.g., "#ffffff")
    createdAt?: Date;
}

// Preset color themes for categories
export const CATEGORY_COLOR_PRESETS: { name: string; bg: string; text: string }[] = [
    { name: "Índigo", bg: "#4f46e5", text: "#ffffff" },
    { name: "Rosa", bg: "#ec4899", text: "#ffffff" },
    { name: "Verde", bg: "#10b981", text: "#ffffff" },
    { name: "Ámbar", bg: "#f59e0b", text: "#000000" },
    { name: "Rojo", bg: "#ef4444", text: "#ffffff" },
    { name: "Cian", bg: "#06b6d4", text: "#000000" },
    { name: "Púrpura", bg: "#8b5cf6", text: "#ffffff" },
    { name: "Naranja", bg: "#f97316", text: "#ffffff" },
    { name: "Esmeralda", bg: "#059669", text: "#ffffff" },
    { name: "Azul", bg: "#3b82f6", text: "#ffffff" },
    { name: "Lima", bg: "#84cc16", text: "#000000" },
    { name: "Fucsia", bg: "#d946ef", text: "#ffffff" },
];

// Default colors for new categories
export const DEFAULT_CATEGORY_COLORS = {
    backgroundColor: "#4f46e5",
    textColor: "#ffffff",
};

// Helper to generate ID from name
export function generateCategoryId(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
        .trim()
        .replace(/\s+/g, '-');
}
