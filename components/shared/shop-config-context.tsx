"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { BackgroundEffect } from "@/components/shop/background-effects";
import type { BusinessType } from "@/lib/constants";

export type ColorTheme = "preset" | "custom";
export type BackgroundType = "preset" | "image" | "video";

export interface ShopVisualConfig {
  colorTheme: ColorTheme;
  primaryColor: string;
  accentColor: string;
  backgroundEffect: BackgroundEffect;
  backgroundType: BackgroundType;
  backgroundUrl: string;
  overlayOpacity: number; // 0-90
  shopName: string;
  // Phase 13: Business Type & Wholesale
  businessType: BusinessType;
  wholesaleCode: string;
  wholesaleEnabled: boolean;

  // Phase 8: Contextual Backgrounds
  contextualBackgrounds: {
    home?: string;
    shop?: string; // /shop or catalog
    repair?: string; // /repair
    admin?: string; // /admin
  };

  // Phase 20: Section Backgrounds (Scrollytelling)
  sectionBackgrounds: {
    hero?: string;
    services?: string;
    products?: string;
    testimonials?: string;
    footer?: string;
  };
}

interface ShopConfigContextValue {
  config: ShopVisualConfig;
  updateConfig: (updates: Partial<ShopVisualConfig>) => void;
  saveConfig: () => void;
  isLoading: boolean;
  getPrimaryColor: () => string;
  getAccentColor: () => string;
}

const defaultConfig: ShopVisualConfig = {
  colorTheme: "preset",
  primaryColor: "#F43F5E",
  accentColor: "#D4AF37",
  backgroundEffect: "clean",
  backgroundType: "preset",
  backgroundUrl: "",
  overlayOpacity: 40,
  shopName: "Mi Tienda",
  // Phase 13: Business Type & Wholesale
  businessType: "beauty",
  wholesaleCode: "",
  wholesaleEnabled: false,
  contextualBackgrounds: {
    home: "https://videos.pexels.com/video-files/3571264/3571264-sd_640_360_30fps.mp4", // Abstract Gold
    shop: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920", // Marble (Clean for products)
    repair: "https://videos.pexels.com/video-files/3196070/3196070-sd_640_360_25fps.mp4", // Particles (Tech feel) replacement
    admin: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920", // Dark texture
  },
  // Phase 20: Section Backgrounds for Scrollytelling
  sectionBackgrounds: {
    hero: "https://videos.pexels.com/video-files/3571264/3571264-sd_640_360_30fps.mp4", // Abstract Gold
    services: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920", // Marble (Clean)
    products: "https://videos.pexels.com/video-files/3196070/3196070-sd_640_360_25fps.mp4", // Particles (Tech) replacement
    testimonials: "https://videos.pexels.com/video-files/2022395/2022395-sd_640_360_30fps.mp4", // Bokeh Lights
    footer: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920", // Dark texture
  },
};

const STORAGE_KEY = "shop-visual-config";

const ShopConfigContext = createContext<ShopConfigContextValue | undefined>(
  undefined
);

interface ShopConfigProviderProps {
  children: ReactNode;
  initialConfig?: Partial<ShopVisualConfig>;
}

export function ShopConfigProvider({
  children,
  initialConfig,
}: ShopConfigProviderProps) {
  const [config, setConfig] = useState<ShopVisualConfig>({
    ...defaultConfig,
    ...initialConfig,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load config from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig((prev) => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error("Error loading config:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateConfig = useCallback((updates: Partial<ShopVisualConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const saveConfig = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      console.log("Config saved:", config);
    } catch (error) {
      console.error("Error saving config:", error);
    }
  }, [config]);

  const getPrimaryColor = useCallback(() => {
    return config.primaryColor;
  }, [config.primaryColor]);

  const getAccentColor = useCallback(() => {
    return config.accentColor;
  }, [config.accentColor]);

  // Auto-save when config changes
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        } catch (error) {
          console.error("Error auto-saving config:", error);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [config, isLoading]);

  return (
    <ShopConfigContext.Provider
      value={{ config, updateConfig, saveConfig, isLoading, getPrimaryColor, getAccentColor }}
    >
      {children}
    </ShopConfigContext.Provider>
  );
}

export function useShopConfig() {
  const context = useContext(ShopConfigContext);
  if (context === undefined) {
    throw new Error("useShopConfig must be used within a ShopConfigProvider");
  }
  return context;
}

// Preset color themes for quick selection
export const COLOR_PRESETS: { id: string; primary: string; accent: string; label: string }[] = [
  { id: "rose-gold", primary: "#F43F5E", accent: "#D4AF37", label: "Rose Gold" },
  { id: "golden", primary: "#D4AF37", accent: "#F43F5E", label: "Golden" },
  { id: "teal", primary: "#14B8A6", accent: "#D4AF37", label: "Teal" },
  { id: "purple", primary: "#8B5CF6", accent: "#F59E0B", label: "Purple" },
  { id: "blue", primary: "#3B82F6", accent: "#10B981", label: "Blue" },
  { id: "pink", primary: "#EC4899", accent: "#8B5CF6", label: "Pink" },
  { id: "orange", primary: "#F97316", accent: "#EAB308", label: "Orange" },
  { id: "emerald", primary: "#10B981", accent: "#3B82F6", label: "Emerald" },
  { id: "red", primary: "#EF4444", accent: "#F59E0B", label: "Red" },
  { id: "indigo", primary: "#6366F1", accent: "#EC4899", label: "Indigo" },
  { id: "cyan", primary: "#06B6D4", accent: "#8B5CF6", label: "Cyan" },
  { id: "amber", primary: "#F59E0B", accent: "#EF4444", label: "Amber" },
];

// Legacy export for backwards compatibility
export const COLOR_THEMES = COLOR_PRESETS.reduce((acc, preset) => {
  acc[preset.id] = { primary: preset.primary, accent: preset.accent, label: preset.label };
  return acc;
}, {} as Record<string, { primary: string; accent: string; label: string }>);

export type { ColorTheme as LegacyColorTheme };

// Demo video backgrounds from Pexels (free to use)
export const DEMO_VIDEOS = [
  {
    id: "abstract-gold",
    label: "Abstract Gold",
    url: "https://videos.pexels.com/video-files/3571264/3571264-sd_640_360_30fps.mp4",
    thumbnail: "https://images.pexels.com/videos/3571264/free-video-3571264.jpg?auto=compress&w=200",
  },
  {
    id: "particles",
    label: "Partículas",
    url: "https://videos.pexels.com/video-files/3196070/3196070-sd_640_360_25fps.mp4",
    thumbnail: "https://images.pexels.com/videos/3196070/free-video-3196070.jpg?auto=compress&w=200",
  },
  {
    id: "bokeh-lights",
    label: "Luces Bokeh",
    url: "https://videos.pexels.com/video-files/2022395/2022395-sd_640_360_30fps.mp4",
    thumbnail: "https://images.pexels.com/videos/2022395/free-video-2022395.jpg?auto=compress&w=200",
  },
];

// Demo background images
export const DEMO_IMAGES = [
  {
    id: "marble",
    label: "Mármol",
    url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920",
    thumbnail: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200",
  },
  {
    id: "gold-texture",
    label: "Oro Textura",
    url: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1920",
    thumbnail: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=200",
  },
  {
    id: "dark-floral",
    label: "Floral Oscuro",
    url: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1920",
    thumbnail: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=200",
  },
  {
    id: "gradient-blur",
    label: "Gradiente",
    url: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1920",
    thumbnail: "https://images.unsplash.com/photo-1557683316-973673baf926?w=200",
  },
];
