"use client";

import { type ReactNode } from "react";
import { ShopConfigProvider, useShopConfig, UIProvider, useUI, type BackgroundType } from "@/components/shared";
import { BackgroundEffects } from "./background-effects";

interface ShopLayoutClientProps {
  children: ReactNode;
  shop?: any; // We can improve type later (ShopConfig)
}

function ShopLayoutInner({ children }: ShopLayoutClientProps) {
  const { config, isLoading } = useShopConfig();
  const { activeSection } = useUI();

  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      <BackgroundEffects
        effect={config.backgroundEffect}
        backgroundType={config.backgroundType}
        backgroundUrl={config.backgroundUrl}
        contextualBackgrounds={config.contextualBackgrounds}
        sectionBackgrounds={config.sectionBackgrounds}
        activeSection={activeSection}
        overlayOpacity={config.overlayOpacity}
      />
      {children}
    </>
  );
}

export function ShopLayoutClient({ children, shop }: ShopLayoutClientProps & { shop?: any }) {
  // Convert shop data to ShopVisualConfig format if available
  const initialConfig = shop ? {
    shopName: shop.name,
    // Map Firestore theme/background data to VisualConfig
    primaryColor: shop.theme?.primaryColor,
    accentColor: shop.theme?.accentColor,
    backgroundType: (shop.background?.type || "preset") as BackgroundType,
    backgroundUrl: shop.background?.type === "video" ? shop.background.video : (shop.background?.image || shop.banner),
    // Background effect and overlay
    backgroundEffect: shop.background?.effect || "clean",
    overlayOpacity: shop.background?.overlayOpacity ?? 40,
    // Support new background structure
    sectionBackgrounds: {
      hero: shop.background?.hero,
      services: shop.background?.services,
      products: shop.background?.products,
      contact: shop.background?.contact,
    }
  } : undefined;

  return (
    <ShopConfigProvider initialConfig={initialConfig} enablePersistence={false}>
      <UIProvider>
        <ShopLayoutInner>{children}</ShopLayoutInner>
      </UIProvider>
    </ShopConfigProvider>
  );
}
