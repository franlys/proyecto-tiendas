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

  // Debug log for background issues
  if (typeof window !== 'undefined') {
    console.log('[ShopLayoutInner] Background config:', {
      backgroundType: config.backgroundType,
      backgroundUrl: config.backgroundUrl,
      backgroundEffect: config.backgroundEffect,
      overlayOpacity: config.overlayOpacity,
    });
  }

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
  // Debug log for background issues - server-side data
  console.log('[ShopLayoutClient] Received shop.background:', JSON.stringify(shop?.background, null, 2));

  // Convert shop data to ShopVisualConfig format if available
  // Determine background URL based on type
  const getBackgroundUrl = () => {
    if (!shop?.background) return shop?.banner || "";

    const bgType = shop.background.type;
    if (bgType === "video") {
      return shop.background.video || "";
    } else if (bgType === "image") {
      return shop.background.image || shop.banner || "";
    }
    // For "preset" type, no URL needed (uses CSS effects)
    return "";
  };

  const backgroundUrl = getBackgroundUrl();
  console.log('[ShopLayoutClient] Computed backgroundUrl:', backgroundUrl);

  const initialConfig = shop ? {
    shopName: shop.name,
    // Map Firestore theme/background data to VisualConfig
    primaryColor: shop.theme?.primaryColor,
    accentColor: shop.theme?.accentColor,
    backgroundType: (shop.background?.type || "preset") as BackgroundType,
    backgroundUrl: backgroundUrl,
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
