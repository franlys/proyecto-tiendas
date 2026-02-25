"use client";

import { useMemo, useRef } from "react";
import { ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./product-card";
import { MealPrepProductCard } from "./meal-prep-product-card";
import { StaggerContainer, StaggerItem, ScrollReveal, useShop, useCart } from "@/components/shared";
import { useBusinessFeatures, useCombinedBusinessFeatures } from "@/lib/hooks";
import {
  PRODUCT_CATEGORY_LABELS,
  type Product,
  type ProductCategory,
} from "@/lib/constants";
import { useState, useEffect } from "react";
import { MealPrepModal } from "./meal-prep-modal";
import { ChefHat, ArrowRight } from "lucide-react";
import type { MealPlate } from "@/lib/types/meal-prep.types";
import { cn } from "@/lib/utils";

interface ProductGridProps {
  products: Product[];
  hidePriceIfZero?: boolean;
  trainingPackages?: any[];
  isMealModalOpen?: boolean;
  setIsMealModalOpen?: (open: boolean) => void;
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

export function ProductGrid({
  products,
  hidePriceIfZero,
  trainingPackages = [],
  isMealModalOpen = false,
  setIsMealModalOpen = () => { },
}: ProductGridProps) {
  const shop = useShop();
  const { addProduct } = useCart();
  const { hasInventory, config } = useCombinedBusinessFeatures(shop?.businessTypes || [shop?.businessType || "otro"]);

  const isMealPrep = hidePriceIfZero ||
    (shop?.businessType as any) === "meal_prep" ||
    (shop?.businessType as any) === "fitness" ||
    (shop?.businessType as any) === "entrenamiento" ||
    shop?.businessTypes?.some(t => ["meal_prep", "fitness", "gym", "entrenamiento", "food", "personal_trainer", "gimnasio", "entrenador_personal"].includes(t)) ||
    (config.category as any) === "food" ||
    (config.category as any) === "fitness" ||
    products.some(p => (p as any).plateCount || (p as any).category === "meal_prep_package");

  console.log("🥘 [DEBUG] isMealPrep logic:", {
    shopSlug: shop?.slug,
    isMealPrep,
    hidePriceIfZero,
    businessType: shop?.businessType,
    businessTypes: shop?.businessTypes,
    category: config.category,
    hasPlateCount: products.some(p => (p as any).plateCount)
  });

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
  const scrollRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scroll = (category: string, direction: 'left' | 'right') => {
    const container = scrollRefs.current[category];
    if (container) {
      const scrollAmount = 300; // Un plato aproximado + gap
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };


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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600/30 to-emerald-900/40 border-2 border-green-500/50 p-8 md:p-12 mb-16 shadow-2xl shadow-green-500/10">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-500 text-white text-xs font-bold uppercase tracking-wider mb-6 shadow-lg shadow-green-500/30">
                <ChefHat className="w-4 h-4" />
                Plan Nutricional Activo
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
                ¡Arma tu paquete de <span className="text-green-400">Meal Prep</span> hoy!
              </h2>
              <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                Selecciona tus proteínas, carbohidratos y vegetales favoritos. Mínimo 3 platos personalizados para potenciar tu semana.
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                <button
                  onClick={() => setIsMealModalOpen(true)}
                  className="group relative flex items-center gap-3 px-10 py-5 rounded-full bg-white text-black font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-2xl"
                >
                  <ChefHat className="w-6 h-6 text-green-600" />
                  REALIZAR MI ORDEN
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
                  <span className="text-green-400 font-bold">$13</span>
                  <span className="text-slate-400 text-sm ml-1">por plato estándar</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block relative group">
              <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full group-hover:bg-green-500/30 transition-all" />
              <ChefHat className="relative w-48 h-48 text-green-500 animate-pulse" />
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-green-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-[80px]" />
        </div>
      )}

      {/* Floating CTA for Mobile */}
      {isMealPrep && (
        <div className="fixed bottom-6 right-6 z-40 md:hidden">
          <button
            onClick={() => setIsMealModalOpen(true)}
            className="flex items-center gap-2 p-4 rounded-full bg-green-500 text-white font-bold shadow-2xl shadow-green-500/40 animate-bounce"
          >
            <ChefHat className="w-6 h-6" />
            <span>Ordenar Ahora</span>
          </button>
        </div>
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
        businessCoordinates={shop?.coordinates}
        trainingPackages={trainingPackages}
      />
      {categories.map((category) => {
        const catInfo = getCategoryInfo(category);
        return (
          <div key={category} className="relative">
            {/* Category Header */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="font-display text-xl md:text-2xl font-bold text-white mb-2 uppercase tracking-tight">
                  {catInfo.label}
                </h2>
                {catInfo.isCustom && catInfo.backgroundColor ? (
                  <div
                    className="w-12 h-0.5 rounded-full"
                    style={{ backgroundColor: catInfo.backgroundColor }}
                  />
                ) : (
                  <div className="w-12 h-0.5 bg-gradient-to-r from-gold to-orange-400 rounded-full" />
                )}
              </div>

              <div className="flex items-center gap-2">
                {isMealPrep && (
                  <button
                    onClick={() => setIsMealModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] sm:text-xs font-bold hover:bg-green-500/20 transition-all mr-2"
                  >
                    <ChefHat className="w-3 h-3 sm:w-4 h-4" />
                    Armar Paquete
                  </button>
                )}
                {/* Navigation Arrows */}
                <button
                  onClick={() => scroll(category, 'left')}
                  className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all hidden md:flex"
                  aria-label="Anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => scroll(category, 'right')}
                  className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all hidden md:flex"
                  aria-label="Siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Horizontal Product Carousel */}
            <div
              ref={(el) => { scrollRefs.current[category] = el; }}
              className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar snap-x-mandatory -mx-2 px-2"
            >
              {productsByCategory[category]?.map((product) => (
                <div key={product.id} className="min-w-[280px] sm:min-w-[320px] md:min-w-[340px] snap-start">
                  <StaggerContainer staggerDelay={0.05} className="w-full">
                    <StaggerItem>
                      {isMealPrep && (product as any).plateCount && shop ? (
                        <MealPrepProductCard
                          product={product as any}
                          allProducts={products}
                          shopName={shop.name}
                          whatsappNumber={shop.contact?.whatsapp || shop.contact?.phone}
                        />
                      ) : (
                        <ProductCard
                          product={product}
                          hidePriceIfZero={isMealPrep}
                          onClickIntercept={() => setIsMealModalOpen(true)}
                        />
                      )}
                    </StaggerItem>
                  </StaggerContainer>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
