"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ShoppingBag, ChevronRight } from "lucide-react";
import type { Product, ProductVariant } from "@/lib/constants";
import { useCart } from "@/components/shared";

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `RD$${n.toLocaleString("es-DO")}`;
}

// ─── RELATED PRODUCTS STRIP ──────────────────────────────────────────────────

function RelatedStrip({
  products,
  current,
  onSelect,
}: {
  products: Product[];
  current: Product;
  onSelect: (p: Product) => void;
}) {
  const related = products
    .filter(p => p.id !== current.id && p.category === current.category)
    .slice(0, 6);

  if (related.length === 0) return null;

  return (
    <div className="border-t border-black/8 pt-6 pb-10 px-6 md:px-8">
      <p className="text-[9px] uppercase tracking-[0.22em] font-medium text-black/40 mb-4">
        También te puede gustar
      </p>
      <div className="grid grid-cols-3 gap-2">
        {related.map(p => {
          const hasPromo = !!(p.promoPrice && Number(p.promoPrice) < Number(p.price));
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p)}
              className="group text-left"
            >
              <div className="relative overflow-hidden bg-[#f4f4f4]" style={{ aspectRatio: "3/4" }}>
                <img
                  src={p.image || "https://placehold.co/300x400/f4f4f4/999?text=Viora"}
                  alt={p.name}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-[1.04]"
                  loading="lazy"
                />
              </div>
              <p className="text-[9px] font-medium uppercase tracking-[0.08em] text-black mt-1.5 line-clamp-1">{p.name}</p>
              <p className={`text-[9px] mt-0.5 ${hasPromo ? "text-red-500" : "text-black/50"}`}>
                {fmt(Number(hasPromo ? p.promoPrice : p.price))}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── MODAL ───────────────────────────────────────────────────────────────────

interface VioraProductModalProps {
  product: Product;
  allProducts: Product[];
  onClose: () => void;
}

export function VioraProductModal({ product, allProducts, onClose }: VioraProductModalProps) {
  const { addProduct } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants && product.variants.length === 1 ? product.variants[0] : null
  );
  const [added, setAdded] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(product);
  const [shake, setShake] = useState(false);

  const hasPromo = !!(currentProduct.promoPrice && Number(currentProduct.promoPrice) < Number(currentProduct.price));
  const displayPrice = hasPromo ? Number(currentProduct.promoPrice) : Number(currentProduct.price);
  const discount = hasPromo
    ? Math.round((1 - Number(currentProduct.promoPrice) / Number(currentProduct.price)) * 100)
    : 0;

  // Reset variant selection when product changes
  useEffect(() => {
    setSelectedVariant(
      currentProduct.variants && currentProduct.variants.length === 1
        ? currentProduct.variants[0]
        : null
    );
    setAdded(false);
  }, [currentProduct]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleAddToCart = useCallback(() => {
    const hasVariants = currentProduct.variants && currentProduct.variants.length > 1;
    if (hasVariants && !selectedVariant) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    addProduct(currentProduct, 1, selectedVariant || undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [currentProduct, selectedVariant, addProduct]);

  const handleSelectRelated = (p: Product) => {
    setCurrentProduct(p);
    // Scroll panel to top
    document.getElementById("viora-modal-scroll")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        @keyframes vioraModalSlideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes vioraModalSlideRight {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        @keyframes vioraModalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes vioraShake {
          0%, 100% { transform: translateX(0); }
          20%      { transform: translateX(-6px); }
          40%      { transform: translateX(6px); }
          60%      { transform: translateX(-4px); }
          80%      { transform: translateX(4px); }
        }
        .viora-modal-backdrop {
          animation: vioraModalFadeIn 200ms ease both;
        }
        /* Mobile: slide up from bottom */
        .viora-modal-panel {
          animation: vioraModalSlideUp 380ms cubic-bezier(0.32, 0.72, 0, 1) both;
        }
        /* Desktop: slide from right */
        @media (min-width: 768px) {
          .viora-modal-panel {
            animation: vioraModalSlideRight 360ms cubic-bezier(0.32, 0.72, 0, 1) both;
          }
        }
        .viora-size-shake {
          animation: vioraShake 400ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        @media (prefers-reduced-motion: reduce) {
          .viora-modal-backdrop,
          .viora-modal-panel { animation: none !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="viora-modal-backdrop fixed inset-0 z-[80] bg-black/40"
        onClick={onClose}
      />

      {/* Panel
          Mobile: drawer desde abajo, altura máx 92vh, bordes redondeados arriba
          Desktop: panel fijo derecha, altura completa, sin border-radius
      */}
      <div
        id="viora-modal-scroll"
        className="viora-modal-panel fixed z-[90] bg-white overflow-y-auto overscroll-contain"
        style={{
          // Mobile
          bottom: 0, left: 0, right: 0,
          maxHeight: "92dvh",
          borderRadius: "20px 20px 0 0",
          // Desktop override via media query inline workaround — see className below
        }}
      >
        {/* Desktop override — full right panel */}
        <style>{`
          @media (min-width: 768px) {
            #viora-modal-scroll {
              top: 0 !important;
              bottom: 0 !important;
              left: auto !important;
              right: 0 !important;
              width: 480px !important;
              max-height: 100dvh !important;
              border-radius: 0 !important;
            }
          }
        `}</style>
        {/* Close button */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm flex items-center justify-between px-6 md:px-8 py-4 border-b border-black/6">
          <p className="text-[9px] uppercase tracking-[0.22em] font-medium text-black/40">
            {currentProduct.category}
          </p>
          <button
            onClick={onClose}
            className="p-1.5 text-black/30 hover:text-black transition-colors duration-150"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product image — 3/4 ratio sin restricción de altura */}
        <div className="relative overflow-hidden bg-[#f4f4f4]" style={{ aspectRatio: "3/4" }}>
          <img
            src={currentProduct.image || "https://placehold.co/600x800/f4f4f4/999?text=Viora"}
            alt={currentProduct.name}
            className="w-full h-full object-cover object-top"
          />
          {hasPromo && (
            <span className="absolute top-4 left-4 bg-black text-white text-[9px] font-medium tracking-[0.1em] uppercase px-2 py-1">
              -{discount}%
            </span>
          )}
        </div>

        {/* Info */}
        <div className="px-6 md:px-8 pt-5 pb-4">
          <h2 className="text-sm font-medium uppercase tracking-[0.1em] text-black leading-snug">
            {currentProduct.name}
          </h2>

          {/* Price */}
          <div className="mt-2 flex items-baseline gap-3">
            <span className={`text-lg font-medium ${hasPromo ? "text-red-500" : "text-black"}`}>
              {fmt(displayPrice)}
            </span>
            {hasPromo && (
              <span className="text-sm text-black/30 line-through font-light">
                {fmt(Number(currentProduct.price))}
              </span>
            )}
          </div>

          {/* Description */}
          {currentProduct.description && (
            <p className="mt-3 text-xs text-black/50 leading-relaxed">
              {currentProduct.description}
            </p>
          )}
        </div>

        {/* Variants / tallas */}
        {currentProduct.variants && currentProduct.variants.length > 1 && (
          <div className={`px-6 md:px-8 pb-4 ${shake ? "viora-size-shake" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-[0.18em] font-medium text-black">
                Talla
              </p>
              {!selectedVariant && (
                <p className="text-[9px] text-red-400 tracking-wide">Selecciona una talla</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {currentProduct.variants.map(v => {
                const outOfStock = v.stock !== undefined && v.stock <= 0;
                const isSelected = selectedVariant?.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => !outOfStock && setSelectedVariant(v)}
                    disabled={outOfStock}
                    className="relative min-w-[44px] h-10 px-3 border text-[10px] font-medium uppercase tracking-[0.1em] transition-all duration-150"
                    style={{
                      borderColor: isSelected ? "#000" : outOfStock ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.18)",
                      background:  isSelected ? "#000" : "transparent",
                      color:       isSelected ? "#fff" : outOfStock ? "rgba(0,0,0,0.2)" : "#000",
                      cursor:      outOfStock ? "not-allowed" : "pointer",
                    }}
                  >
                    {v.name}
                    {outOfStock && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="absolute w-full h-px bg-black/20 rotate-[-25deg]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Add to cart */}
        <div className="px-6 md:px-8 pb-6">
          <button
            onClick={handleAddToCart}
            className="w-full h-12 flex items-center justify-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] transition-all duration-200"
            style={{
              background: added ? "#16a34a" : "#000",
              color: "#fff",
            }}
          >
            {added ? (
              <>Agregado al carrito ✓</>
            ) : (
              <><ShoppingBag className="w-3.5 h-3.5" /> Agregar al carrito</>
            )}
          </button>
        </div>

        {/* Related products */}
        <RelatedStrip
          products={allProducts}
          current={currentProduct}
          onSelect={handleSelectRelated}
        />
      </div>
    </>
  );
}
