/**
 * Centralized theme configuration for premium templates.
 * This replaces ad-hoc conditionals across the codebase.
 */

export interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    border: string;
    glow: string;
}

export interface ThemeConfig {
    id: string;
    colors: ThemeColors;
    blur: number;
    borderRadius: string;
    fontFamily: string;
    effects: {
        scanlines?: boolean;
        grid?: boolean;
        particles?: boolean;
        parallax?: boolean;
    };
}

export const THEME_CONFIGS: Record<string, ThemeConfig> = {
    "tech-drop-v1": {
        id: "tech-drop-v1",
        colors: {
            primary: "cyan-500",
            secondary: "blue-600",
            accent: "cyan-400",
            background: "#05070a",
            text: "#ffffff",
            border: "rgba(6, 182, 212, 0.3)",
            glow: "rgba(6, 182, 212, 0.4)",
        },
        blur: 16,
        borderRadius: "2rem",
        fontFamily: "font-sans",
        effects: {
            scanlines: true,
            grid: true,
            parallax: true,
        },
    },
    "tech-3d-v1": {
        id: "tech-3d-v1",
        colors: {
            primary: "cyan-500",
            secondary: "violet-600",
            accent: "cyan-400",
            background: "#020408",
            text: "#ffffff",
            border: "rgba(6, 182, 212, 0.4)",
            glow: "rgba(139, 92, 246, 0.5)",
        },
        blur: 24,
        borderRadius: "2.5rem",
        fontFamily: "font-sans",
        effects: {
            scanlines: true,
            grid: true,
            parallax: true,
        },
    },
    "street-drop-v1": {
        id: "street-drop-v1",
        colors: {
            primary: "red-600",
            secondary: "zinc-900",
            accent: "white",
            background: "#000000",
            text: "#ffffff",
            border: "rgba(255, 0, 51, 0.5)",
            glow: "rgba(255, 0, 51, 0.3)",
        },
        blur: 8,
        borderRadius: "0",
        fontFamily: "font-black",
        effects: {
            parallax: true,
        },
    },
};

export function getThemeConfig(templateId?: string): ThemeConfig {
    return THEME_CONFIGS[templateId || "default"] || THEME_CONFIGS["tech-drop-v1"]; // Fallback to tech-drop-v1 for now as it's the primary target
}
