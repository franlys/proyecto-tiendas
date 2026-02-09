"use client";

import { useMemo } from "react";
import { ShoppingBag } from "lucide-react";
import { ProductCard } from "./product-card";
import { StaggerContainer, StaggerItem, ScrollReveal } from "@/components/shared";
import {
  PRODUCT_CATEGORY_LABELS,
  type Product,
  type ProductCategory,
} from "@/lib/constants";

interface ProductGridProps {
  products: Product[];
}

// Helper to get category display name (handles custom categories)
function getCategoryLabel(product: Product): string {
  // Check if it's a predefined category
  const predefinedLabel = PRODUCT_CATEGORY_LABELS[product.category as ProductCategory];
  if (predefinedLabel) {
    return predefinedLabel;
  }
  // Check for customCategory field
  if ((product as any).customCategory) {
    return (product as any).customCategory;
  }
  // Fallback: capitalize the category key
  return product.category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function ProductGrid({ products }: ProductGridProps) {
  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, Product[]> = {};

    // Featured products first
    const featured = products.filter((p) => p.featured && p.stock > 0);
    const regular = products.filter((p) => !p.featured || p.stock === 0);

    [...featured, ...regular].forEach((product) => {
      const categoryKey = product.category;
      if (!grouped[categoryKey]) {
        grouped[categoryKey] = [];
      }
      grouped[categoryKey].push(product);
    });

    return grouped;
  }, [products]);

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

  // Get the display label for a category (from first product in that category)
  const getCategoryDisplayLabel = (categoryKey: string): string => {
    const firstProduct = productsByCategory[categoryKey]?.[0];
    if (firstProduct) {
      return getCategoryLabel(firstProduct);
    }
    // Fallback
    const predefinedLabel = PRODUCT_CATEGORY_LABELS[categoryKey as ProductCategory];
    if (predefinedLabel) {
      return predefinedLabel;
    }
    return categoryKey
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-12">
      {categories.map((category, categoryIndex) => (
        <div key={category}>
          {/* Category Header */}
          <ScrollReveal delay={categoryIndex * 0.1}>
            <div className="mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
                {getCategoryDisplayLabel(category)}
              </h2>
              <div className="w-20 h-1 bg-gradient-to-r from-gold to-orange-400 rounded-full" />
            </div>
          </ScrollReveal>

          {/* Products Grid */}
          <StaggerContainer
            staggerDelay={0.08}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {productsByCategory[category]?.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      ))}
    </div>
  );
}
