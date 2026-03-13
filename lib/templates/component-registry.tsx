/**
 * REGISTRO DE COMPONENTES DE PLANTILLAS
 *
 * Este archivo mapea IDs de plantilla → componentes React.
 * Al agregar una plantilla custom, SOLO hay que:
 *   1. Crear el componente en components/shop/templates/custom/
 *   2. Registrarlo aquí con una línea
 *   3. Agregarlo a BUILT_IN_TEMPLATES en lib/templates/registry.ts
 *
 * NO es necesario modificar app/(shops)/[shopId]/page.tsx
 */

import React from "react";
import type { ManagedShop } from "@/components/shared";
import type { Service, Product } from "@/lib/constants";

// Built-in templates
import { StandardShopLayout } from "@/components/shop/templates/standard-shop-layout";
import { PremiumDropLayout } from "@/components/shop/templates/premium-drop-layout";
import { StreetDropLayout } from "@/components/shop/templates/street-drop-layout";
import { CosmicDropLayout } from "@/components/shop/templates/cosmic-drop-layout";
import { TechDropLayout } from "@/components/shop/templates/tech-drop-layout";
import { Tech3DLayout } from "@/components/shop/templates/tech-3d-layout";
import { TechPremiumV2Layout } from "@/components/shop/templates/tech-premium-v2-layout";

// Custom templates (uncomment/add when ready)
// import { MiClienteLayout } from "@/components/shop/templates/custom/mi-cliente-layout";

export interface ShopLayoutProps {
    shop: ManagedShop | null;
    products: Product[];
    services: Service[];
    loadingData: boolean;
}

/**
 * Mapa de plantillas registradas.
 * Clave = templateType guardado en Firestore del shop.
 * Valor = componente React que renderiza esa plantilla.
 */
export const TEMPLATE_REGISTRY: Record<string, React.ComponentType<ShopLayoutProps>> = {
    // --- Built-in ---
    "standard":         StandardShopLayout,
    "premium-drop-v1":  PremiumDropLayout,
    "street-drop-v1":   StreetDropLayout,
    "cosmic-drop-v1":   CosmicDropLayout,
    "tech-drop-v1":     TechDropLayout,
    "tech-3d-v1":       Tech3DLayout,
    "tech-premium-v2":  TechPremiumV2Layout,

    // --- Custom (per-client) ---
    // "mi-cliente-v1": MiClienteLayout,
};

/** Resuelve el componente de layout para un templateType dado. Fallback a "standard". */
export function resolveTemplate(templateType?: string | null): React.ComponentType<ShopLayoutProps> {
    if (templateType && TEMPLATE_REGISTRY[templateType]) {
        return TEMPLATE_REGISTRY[templateType];
    }
    return StandardShopLayout;
}
