"use client";

import { useMemo } from "react";
import { ShoppingBag } from "lucide-react";
import { ProductCard } from "./product-card";
import { MealPrepProductCard } from "./meal-prep-product-card";
import { StaggerContainer, StaggerItem, ScrollReveal, useShop, useCart } from "@/components/shared";
import { useBusinessFeatures, useCombinedBusinessFeatures } from "@/lib/hooks";
import {
  PRODUCT_CATEGORY_LABELS,
  type Product,
  type ProductCategory,
} from "@/lib/constants";
import { useState } from "react";
import { MealPrepModal } from "./meal-prep-modal";
import { ChefHat, ArrowRight } from "lucide-react";
import type { MealPlate } from "@/lib/types/meal-prep.types";

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
  const { addProduct } = useCart();
  const [isMealModalOpen, setIsMealModalOpen] = useState(false);
  const { hasInventory, config } = useCombinedBusinessFeatures(shop?.businessTypes || [shop?.businessType || "otro"]);

  const isMealPrep = hidePriceIfZero ||
    shop?.businessType === "meal_prep" ||
    shop?.businessTypes?.includes("meal_prep") ||
    config.category === "food" ||
    config.category === "entertainment" ||
    (config.category as string) === "fitness" ||
    products.some(p => (p as any).plateCount);

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

  const handleMealPrepConfirm = (plates: MealPlate[], totalPrice: number, distance?: number) => {
    // Resumen para el carrito
    const platesSummary = plates.map((p, i) => {
      const components = Object.entries(p.components)
        .map(([catId, prodName]) => `${catId}: ${prodName}`)
        .join(', ');
      return `Plato ${i + 1}: ${components}${p.notes ? ` (Nota: ${p.notes})` : ''}`;
    }).join(' | ');

    // Crear un objeto de producto virtual para el carrito
    const virtualProduct: Product = {
      id: `meal-prep-custom-${Date.now()}`,
      name: `Paquete de ${plates.length} Platos Personalizados`,
      price: totalPrice,
      category: "meal_prep_package",
      stock: 999,
      lowStockThreshold: 0,
      description: "Paquete configurado a medida",
      image: "",
      featured: false
    };

    addProduct(virtualProduct, 1, undefined, undefined, platesSummary);
    setIsMealModalOpen(false);
  };

  return (
    <div className="space-y-12">
      {/* Global Meal Prep CTA */}
      {isMealPrep && (
        <ScrollReveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600/20 to-emerald-900/20 border border-green-500/30 p-8 md:p-12 mb-16">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-wider mb-4">
                  <ChefHat className="w-4 h-4" />
                  Meal Prep Personalizado
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Arma tu paquete y potenta tu nutrición
                </h2>
                <p className="text-slate-400 text-lg mb-6">
                  Mínimo 3 platos. Selección flexible de proteínas, carbohidratos y vegetales. Opción de platos personalizados con tus propias especificaciones.
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <button
                    onClick={() => setIsMealModalOpen(true)}
                    className="flex items-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold transition-all shadow-xl shadow-green-500/20 active:scale-95"
                  >
                    Personalizar Orden Ahora
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <div className="text-sm text-slate-500 italic">
                    Desde $13 por plato
                  </div>
                </div>
              </div>
              <div className="hidden md:block relative w-64 h-64 opacity-20">
                <ChefHat className="w-full h-full text-green-500" />
              </div>
            </div>

            {/* Background elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl" />
          </div>
        </ScrollReveal>
      )}

      {/* Modal */}
      <MealPrepModal
        isOpen={isMealModalOpen}
        onClose={() => setIsMealModalOpen(false)}
        onConfirm={handleMealPrepConfirm}
        shopName={shop?.name}
        whatsappNumber={shop?.contact?.whatsapp || shop?.contact?.phone}
        catalog={products}
        hidePriceIfZero={isMealPrep}
      />
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
                      allProducts={products}
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
