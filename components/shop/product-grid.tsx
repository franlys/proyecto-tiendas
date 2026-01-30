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

export function ProductGrid({ products }: ProductGridProps) {
  // Group products by category
  const productsByCategory = useMemo(() => {
    const grouped: Partial<Record<ProductCategory, Product[]>> = {};

    // Featured products first
    const featured = products.filter((p) => p.featured && p.stock > 0);
    const regular = products.filter((p) => !p.featured || p.stock === 0);

    [...featured, ...regular].forEach((product) => {
      if (!grouped[product.category]) {
        grouped[product.category] = [];
      }
      grouped[product.category]!.push(product);
    });

    return grouped;
  }, [products]);

  const categories = Object.keys(productsByCategory) as ProductCategory[];

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

  return (
    <div className="space-y-12">
      {categories.map((category, categoryIndex) => (
        <div key={category}>
          {/* Category Header */}
          <ScrollReveal delay={categoryIndex * 0.1}>
            <div className="mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
                {PRODUCT_CATEGORY_LABELS[category]}
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
