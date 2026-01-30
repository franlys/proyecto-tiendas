"use client";

import { type ReactNode } from "react";
import { ShopConfigProvider, useShopConfig, UIProvider, useUI } from "@/components/shared";
import { BackgroundEffects } from "./background-effects";

interface ShopLayoutClientProps {
  children: ReactNode;
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

export function ShopLayoutClient({ children }: ShopLayoutClientProps) {
  return (
    <ShopConfigProvider>
      <UIProvider>
        <ShopLayoutInner>{children}</ShopLayoutInner>
      </UIProvider>
    </ShopConfigProvider>
  );
}
