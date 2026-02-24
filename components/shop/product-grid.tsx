"use client";

import { useMemo } from "react";
import { ShoppingBag } from "lucide-react";
import { ProductCard } from "./product-card";
import { MealPrepProductCard } from "./meal-prep-product-card";
import { StaggerContainer, StaggerItem, ScrollReveal, useShop } from "@/components/shared";
import { useBusinessFeatures, useCombinedBusinessFeatures } from "@/lib/hooks";
import {
  PRODUCT_CATEGORY_LABELS,
  type Product,
  type ProductCategory,
} from "@/lib/constants";

interface ProductGridProps {
  products: Product[];
  hidePriceIfZero?: boolean;
}

// Extended product type with custom category colors
interface ExtendedProduct extends Product {
  customCategory?: string;
  categoryColors?: {
    backgroundColor: string;
    textColor: string;
  };
}

// Category display info with optional colors
interface CategoryDisplayInfo {
  label: string;
  backgroundColor?: string;
  isCustom: boolean;
}

// Helper to get category display info (handles custom categories with colors)
function getCategoryDisplayInfo(product: ExtendedProduct): CategoryDisplayInfo {
  // Check if it's a predefined category
  const predefinedLabel = PRODUCT_CATEGORY_LABELS[product.category as ProductCategory];
  if (predefinedLabel) {
    return { label: predefinedLabel, isCustom: false };
  }

  // It's a custom category
  let label: string = product.category;

  // Check for customCategory field
  if (product.customCategory) {
    label = product.customCategory;
  } else {
    // Fallback: capitalize the category key
    label = product.category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  return {
    label,
    backgroundColor: product.categoryColors?.backgroundColor,
    isCustom: true,
  };
}

export function ProductGrid({ products, hidePriceIfZero }: ProductGridProps) {
  const shop = useShop();
  const { hasInventory, config } = useCombinedBusinessFeatures(shop?.businessTypes || [shop?.businessType || "otro"]);

  const isMealPrep = hidePriceIfZero ?? (shop?.businessType === "meal_prep" ||
    shop?.businessTypes?.includes("meal_prep") ||
    config.category === "food" ||
    (config.category as string) === "fitness");

  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, Product[]> = {};

    // Featured products first
    // If hasInventory is false, we ignore the stock check
    const featured = products.filter((p) => p.featured && (!hasInventory || p.stock > 0));
    const regular = products.filter((p) => !p.featured || (hasInventory && p.stock === 0));

    [...featured, ...regular].forEach((product) => {
      const categoryKey = product.category;
      if (!grouped[categoryKey]) {
        grouped[categoryKey] = [];
      }
      grouped[categoryKey].push(product);
    });

    return grouped;
  }, [products, hasInventory]);

  const categories = Object.keys(productsByCategory);

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="w-10 h-10 text-slate-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Próximamente
        </h3>
        <p className="text-slate-400">
          Estamos preparando nuestro catálogo de productos.
        </p>
      </div>
    );
  }

  // Get the display info for a category (from first product in that category)
  const getCategoryInfo = (categoryKey: string): CategoryDisplayInfo => {
    const firstProduct = productsByCategory[categoryKey]?.[0];
    if (firstProduct) {
      return getCategoryDisplayInfo(firstProduct as ExtendedProduct);
    }
    // Fallback
    const predefinedLabel = PRODUCT_CATEGORY_LABELS[categoryKey as ProductCategory];
    if (predefinedLabel) {
      return { label: predefinedLabel, isCustom: false };
    }
    return {
      label: categoryKey
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      isCustom: false,
    };
  };

  return (
    <div className="space-y-12">
      {categories.map((category, categoryIndex) => {
        const catInfo = getCategoryInfo(category);
        return (
          <div key={category}>
            {/* Category Header */}
            <ScrollReveal delay={categoryIndex * 0.1}>
              <div className="mb-8">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
                  {catInfo.label}
                </h2>
                {catInfo.isCustom && catInfo.backgroundColor ? (
                  <div
                    className="w-20 h-1 rounded-full"
                    style={{ backgroundColor: catInfo.backgroundColor }}
                  />
                ) : (
                  <div className="w-20 h-1 bg-gradient-to-r from-gold to-orange-400 rounded-full" />
                )}
              </div>
            </ScrollReveal>

            {/* Products Grid */}
            <StaggerContainer
              staggerDelay={0.08}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
            >
              {productsByCategory[category]?.map((product) => (
                <StaggerItem key={product.id}>
                  {/* Si es un negocio de Meal Prep y el producto tiene configuración de platos, usar tarjeta especial */}
                  {isMealPrep && (product as any).plateCount && shop ? (
                    <MealPrepProductCard
                      product={product as any}
                      shopName={shop.name}
                      whatsappNumber={shop.contact?.whatsapp || shop.contact?.phone}
                    />
                  ) : (
                    /* De lo contrario, usar tarjeta estándar (componentes o paquetes pre-armados) */
                    <ProductCard
                      product={product}
                      hidePriceIfZero={isMealPrep}
                    />
                  )}
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        );
      })}
    </div>
  );
}
