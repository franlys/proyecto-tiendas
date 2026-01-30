"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ShopConfig, ShopTheme } from "@/lib/constants";
import { DEFAULT_THEME } from "@/lib/constants";

interface ThemeContextValue {
  shop: ShopConfig | null;
  theme: ShopTheme;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  shop: ShopConfig | null;
}

export function ThemeProvider({ children, shop }: ThemeProviderProps) {
  const theme = shop?.theme ?? DEFAULT_THEME;

  return (
    <ThemeContext.Provider value={{ shop, theme }}>
      <div
        style={
          {
            "--theme-primary": theme.primaryColor,
            "--theme-accent": theme.accentColor,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export function useShop() {
  const { shop } = useTheme();
  return shop;
}
