/**
 * Drop Theme System
 * Allows shops to customize their visual experience per collection/drop
 *
 * Example: GINGER STUDIOS "ALL FOR THE LOVE" collection
 */

export type DropThemePreset =
    | "street-classic"      // Black + Red (#FF0033) - Raw street vibes
    | "midnight-gold"       // Black + Gold - Luxury streetwear
    | "neon-nights"         // Dark + Neon Pink/Cyan - Cyberpunk
    | "earth-tones"         // Brown/Tan/Forest - Nature inspired
    | "arctic-white"        // White + Ice Blue - Clean minimalist
    | "custom";             // Full custom colors

export interface DropThemeColors {
    primary: string;        // Main accent color (e.g., #FF0033)
    secondary: string;      // Secondary accent (e.g., #FFD700)
    background: string;     // Main background (e.g., #1a1a1a)
    surface: string;        // Card/panel background (e.g., #0a0a0a)
    text: string;           // Primary text color (e.g., #ffffff)
    textMuted: string;      // Muted/secondary text (e.g., #94a3b8)
}

export interface DropThemeAnimations {
    // Entry animations
    entryEffect: "flash" | "shutter" | "fade" | "glitch" | "none";

    // Interactive effects
    stickerSlap: boolean;           // Click to place stickers
    stencilReveal: boolean;         // Flashlight text reveal
    customCursor: boolean;          // Custom cursor follower
    sprayPaint: boolean;            // Spray paint on hover
    parallax: boolean;              // Parallax scrolling

    // Product interactions
    productHoverEffect: "glitch" | "zoom" | "tilt" | "glow" | "none";
    addToCartEffect: "slam" | "pulse" | "confetti" | "shake" | "none";
}

export interface DropThemeTypography {
    headingFont: string;            // e.g., "Impact, sans-serif"
    bodyFont: string;               // e.g., "ui-monospace, monospace"
    sloganStyle: "graffiti" | "stencil" | "neon" | "classic";
}

export interface DropThemeMedia {
    backgroundImage?: string;       // Optional background texture
    backgroundVideo?: string;       // Optional background video
    logoOverride?: string;          // Collection-specific logo
    heroImage?: string;             // Hero/banner image for the drop
    ambientAudio?: string;          // Ambient sound URL
}

export interface DropTheme {
    id: string;                     // Unique identifier
    name: string;                   // Display name (e.g., "ALL FOR THE LOVE")
    slogan: string;                 // Main slogan/tagline
    description?: string;           // Optional description

    // Visual Configuration
    preset: DropThemePreset;
    colors: DropThemeColors;
    animations: DropThemeAnimations;
    typography: DropThemeTypography;
    media?: DropThemeMedia;

    // Ticker/Marquee
    tickerEnabled: boolean;
    tickerPhrases: string[];        // Rotating phrases

    // Date range (optional - for limited time drops)
    startDate?: string;             // ISO date
    endDate?: string;               // ISO date

    // Meta
    createdAt: string;
    updatedAt: string;
}

/**
 * Simplified Drop Theme Configuration for Shop Settings
 * Used in admin profile page for quick configuration
 */
export interface DropThemeConfig {
    preset: DropThemePreset;
    slogan: string;
    primaryColor: string;
    tickerPhrases: string[];
    animations: {
        stickerSlap: boolean;
        stencilReveal: boolean;
        customCursor: boolean;
        parallax: boolean;
        productGlitch: boolean;
    };
}

// ============================================
// PRESET DEFINITIONS
// ============================================

export const DROP_THEME_PRESETS: Record<Exclude<DropThemePreset, "custom">, Partial<DropTheme>> = {
    "street-classic": {
        name: "Street Classic",
        colors: {
            primary: "#FF0033",
            secondary: "#FFD700",
            background: "#1a1a1a",
            surface: "#0a0a0a",
            text: "#ffffff",
            textMuted: "#94a3b8",
        },
        animations: {
            entryEffect: "flash",
            stickerSlap: true,
            stencilReveal: true,
            customCursor: true,
            sprayPaint: false,
            parallax: true,
            productHoverEffect: "glitch",
            addToCartEffect: "slam",
        },
        typography: {
            headingFont: "'Impact', 'Arial Black', sans-serif",
            bodyFont: "ui-monospace, 'Courier New', monospace",
            sloganStyle: "graffiti",
        },
        tickerEnabled: true,
        tickerPhrases: ["ALL FOR THE LOVE", "STREET", "RAW", "HUSTLE", "GRIT"],
    },

    "midnight-gold": {
        name: "Midnight Gold",
        colors: {
            primary: "#FFD700",
            secondary: "#B8860B",
            background: "#0d0d0d",
            surface: "#1a1a1a",
            text: "#ffffff",
            textMuted: "#a3a3a3",
        },
        animations: {
            entryEffect: "shutter",
            stickerSlap: false,
            stencilReveal: true,
            customCursor: true,
            sprayPaint: false,
            parallax: true,
            productHoverEffect: "glow",
            addToCartEffect: "pulse",
        },
        typography: {
            headingFont: "'Playfair Display', serif",
            bodyFont: "'Inter', sans-serif",
            sloganStyle: "classic",
        },
        tickerEnabled: true,
        tickerPhrases: ["LUXURY", "EXCLUSIVE", "LIMITED"],
    },

    "neon-nights": {
        name: "Neon Nights",
        colors: {
            primary: "#FF00FF",
            secondary: "#00FFFF",
            background: "#0a0015",
            surface: "#150025",
            text: "#ffffff",
            textMuted: "#c084fc",
        },
        animations: {
            entryEffect: "glitch",
            stickerSlap: true,
            stencilReveal: true,
            customCursor: true,
            sprayPaint: true,
            parallax: true,
            productHoverEffect: "glitch",
            addToCartEffect: "confetti",
        },
        typography: {
            headingFont: "'Orbitron', sans-serif",
            bodyFont: "ui-monospace, monospace",
            sloganStyle: "neon",
        },
        tickerEnabled: true,
        tickerPhrases: ["CYBER", "FUTURE", "NEON", "VIBES"],
    },

    "earth-tones": {
        name: "Earth Tones",
        colors: {
            primary: "#8B4513",
            secondary: "#228B22",
            background: "#1c1917",
            surface: "#292524",
            text: "#fafaf9",
            textMuted: "#a8a29e",
        },
        animations: {
            entryEffect: "fade",
            stickerSlap: false,
            stencilReveal: false,
            customCursor: false,
            sprayPaint: false,
            parallax: true,
            productHoverEffect: "zoom",
            addToCartEffect: "pulse",
        },
        typography: {
            headingFont: "'Bebas Neue', sans-serif",
            bodyFont: "'Lato', sans-serif",
            sloganStyle: "classic",
        },
        tickerEnabled: false,
        tickerPhrases: [],
    },

    "arctic-white": {
        name: "Arctic White",
        colors: {
            primary: "#0EA5E9",
            secondary: "#38BDF8",
            background: "#f8fafc",
            surface: "#ffffff",
            text: "#0f172a",
            textMuted: "#64748b",
        },
        animations: {
            entryEffect: "fade",
            stickerSlap: false,
            stencilReveal: true,
            customCursor: true,
            sprayPaint: false,
            parallax: true,
            productHoverEffect: "tilt",
            addToCartEffect: "pulse",
        },
        typography: {
            headingFont: "'Montserrat', sans-serif",
            bodyFont: "'Inter', sans-serif",
            sloganStyle: "classic",
        },
        tickerEnabled: true,
        tickerPhrases: ["FRESH", "CLEAN", "PURE"],
    },
};

// ============================================
// DEFAULT THEME (GINGER STUDIOS - ALL FOR THE LOVE)
// ============================================

export const DEFAULT_DROP_THEME: DropTheme = {
    id: "ginger-all-for-love",
    name: "ALL FOR THE LOVE",
    slogan: "ALL FOR THE LOVE",
    description: "GINGER STUDIOS - The official drop collection",
    preset: "street-classic",
    colors: {
        primary: "#FF0033",
        secondary: "#FFD700",
        background: "#1a1a1a",
        surface: "#0a0a0a",
        text: "#ffffff",
        textMuted: "#94a3b8",
    },
    animations: {
        entryEffect: "flash",
        stickerSlap: true,
        stencilReveal: true,
        customCursor: true,
        sprayPaint: false,
        parallax: true,
        productHoverEffect: "glitch",
        addToCartEffect: "slam",
    },
    typography: {
        headingFont: "'Impact', 'Arial Black', sans-serif",
        bodyFont: "ui-monospace, 'Courier New', monospace",
        sloganStyle: "graffiti",
    },
    tickerEnabled: true,
    tickerPhrases: ["ALL FOR THE LOVE", "GINGER STUDIOS", "STREET", "RAW", "HUSTLE"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function createDropTheme(
    preset: DropThemePreset,
    overrides?: Partial<DropTheme>
): DropTheme {
    if (preset === "custom") {
        return {
            id: `custom-${Date.now()}`,
            name: overrides?.name || "Custom Theme",
            slogan: overrides?.slogan || "",
            preset: "custom",
            colors: overrides?.colors || DROP_THEME_PRESETS["street-classic"].colors!,
            animations: overrides?.animations || DROP_THEME_PRESETS["street-classic"].animations!,
            typography: overrides?.typography || DROP_THEME_PRESETS["street-classic"].typography!,
            tickerEnabled: overrides?.tickerEnabled ?? false,
            tickerPhrases: overrides?.tickerPhrases || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...overrides,
        };
    }

    const presetData = DROP_THEME_PRESETS[preset];
    return {
        id: `${preset}-${Date.now()}`,
        name: presetData.name || preset,
        slogan: overrides?.slogan || "",
        preset,
        colors: { ...presetData.colors!, ...overrides?.colors },
        animations: { ...presetData.animations!, ...overrides?.animations },
        typography: { ...presetData.typography!, ...overrides?.typography },
        tickerEnabled: overrides?.tickerEnabled ?? presetData.tickerEnabled ?? true,
        tickerPhrases: overrides?.tickerPhrases || presetData.tickerPhrases || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

export function applyDropThemeCSS(theme: DropTheme): string {
    return `
        :root {
            --drop-primary: ${theme.colors.primary};
            --drop-secondary: ${theme.colors.secondary};
            --drop-background: ${theme.colors.background};
            --drop-surface: ${theme.colors.surface};
            --drop-text: ${theme.colors.text};
            --drop-text-muted: ${theme.colors.textMuted};
            --drop-heading-font: ${theme.typography.headingFont};
            --drop-body-font: ${theme.typography.bodyFont};
        }

        .drop-theme-container {
            background-color: var(--drop-background);
            color: var(--drop-text);
            font-family: var(--drop-body-font);
        }

        .drop-theme-container h1,
        .drop-theme-container h2,
        .drop-theme-container h3 {
            font-family: var(--drop-heading-font);
        }

        .drop-theme-container .text-primary {
            color: var(--drop-primary) !important;
        }

        .drop-theme-container .bg-primary {
            background-color: var(--drop-primary) !important;
        }

        .drop-theme-container .border-primary {
            border-color: var(--drop-primary) !important;
        }

        .drop-theme-container .text-muted {
            color: var(--drop-text-muted) !important;
        }

        .drop-theme-container .glass-panel {
            background: var(--drop-surface) !important;
            border-color: color-mix(in srgb, var(--drop-primary) 30%, transparent) !important;
        }
    `;
}
