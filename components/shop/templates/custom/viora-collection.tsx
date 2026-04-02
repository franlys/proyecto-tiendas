"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type { Product } from "@/lib/constants";

interface VioraCollectionProps {
  products: Product[];
  isDiscountView?: boolean;
}

// ─── CATEGORY FILTER BAR ─────────────────────────────────────────────────────

function FilterBar({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex items-center gap-6 md:gap-8 overflow-x-auto hide-scrollbar">
      {["Todos", ...categories].map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat === "Todos" ? "todos" : cat)}
          className={`viora-filter-btn shrink-0 text-[10px] uppercase tracking-[0.18em] font-medium pb-1 transition-colors duration-200 ${
            (cat === "Todos" ? active === "todos" : active === cat)
              ? "text-black border-b border-black"
              : "text-black/35 border-b border-transparent hover:text-black/70"
          }`}
          style={{ transition: "color 200ms ease, border-color 200ms ease" }}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────

function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const hasPromo = !!(product.promoPrice && Number(product.promoPrice) < Number(product.price));
  const discount = hasPromo
    ? Math.round((1 - Number(product.promoPrice) / Number(product.price)) * 100)
    : 0;
  const [hovered, setHovered] = useState(false);

  return (
    <article
      className="viora-card group flex flex-col cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container */}
      <div className="relative overflow-hidden bg-[#f4f4f4]" style={{ aspectRatio: "3/4" }}>
        <img
          src={product.image || "https://placehold.co/600x800/f4f4f4/999999?text=Viora"}
          alt={product.name}
          className="viora-card-img w-full h-full object-cover object-top"
          loading={priority ? "eager" : "lazy"}
        />

        {/* Badges — top left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {hasPromo && (
            <span className="bg-black text-white text-[9px] font-medium tracking-[0.1em] uppercase px-2 py-1">
              -{discount}%
            </span>
          )}
          {product.featured && !hasPromo && (
            <span className="bg-black/80 text-white text-[9px] font-medium tracking-[0.1em] uppercase px-2 py-1">
              Nuevo
            </span>
          )}
        </div>

        {/* Quick add — slides up from bottom */}
        <div
          className="viora-quick-add absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm py-3 px-4 flex items-center justify-between"
          aria-hidden={!hovered}
        >
          <span className="text-[9px] font-medium uppercase tracking-[0.16em]">Agregar</span>
          <span className="text-[9px] text-black/40 tracking-wide">
            {product.variants && product.variants.length > 0
              ? product.variants.slice(0, 3).map(v => v.name).join(" · ")
              : "Talla única"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 px-0.5">
        {/* Category tag */}
        {product.category && (
          <p className="text-[9px] text-black/30 uppercase tracking-[0.14em] mb-1">
            {product.category}
          </p>
        )}

        {/* Name */}
        <h3 className="text-[11px] font-medium uppercase tracking-[0.1em] text-black leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* Price — Zara exact style */}
        <div className="mt-2 flex items-baseline gap-2">
          {hasPromo ? (
            <>
              <span className="text-sm font-medium text-red-500">
                RD${Number(product.promoPrice).toLocaleString("es-DO")}
              </span>
              <span className="text-xs text-black/30 line-through font-light">
                RD${Number(product.price).toLocaleString("es-DO")}
              </span>
            </>
          ) : (
            <span className="text-sm font-medium text-black">
              RD${Number(product.price).toLocaleString("es-DO")}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

// ─── COLLECTION ──────────────────────────────────────────────────────────────

export function VioraCollection({ products, isDiscountView = false }: VioraCollectionProps) {
  const [activeCategory, setActiveCategory] = useState("todos");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "promo">("default");
  const headerRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => {
    return Array.from(
      new Set(products.map(p => p.category).filter(Boolean))
    ) as string[];
  }, [products]);

  const filtered = useMemo(() => {
    let list = isDiscountView
      ? products.filter(p => p.promoPrice && Number(p.promoPrice) < Number(p.price))
      : products;

    if (activeCategory !== "todos") {
      list = list.filter(p => p.category === activeCategory);
    }

    switch (sortBy) {
      case "price-asc":
        return [...list].sort((a, b) => (a.promoPrice || a.price) - (b.promoPrice || b.price));
      case "price-desc":
        return [...list].sort((a, b) => (b.promoPrice || b.price) - (a.promoPrice || a.price));
      case "promo":
        return [...list].sort((a, b) => {
          const da = a.promoPrice ? (1 - Number(a.promoPrice) / Number(a.price)) : 0;
          const db = b.promoPrice ? (1 - Number(b.promoPrice) / Number(b.price)) : 0;
          return db - da;
        });
      default:
        return list;
    }
  }, [products, isDiscountView, activeCategory, sortBy]);

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* Card image hover — long duration = luxury */
        .viora-card-img {
          transition: transform 1100ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        @media (hover: hover) and (pointer: fine) {
          .viora-card:hover .viora-card-img { transform: scale(1.05); }
        }

        /* Quick-add slides up — off main thread with translateY */
        .viora-quick-add {
          transform: translateY(100%);
          transition: transform 280ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        @media (hover: hover) and (pointer: fine) {
          .viora-card:hover .viora-quick-add { transform: translateY(0); }
        }

        /* Card grid stagger entrance */
        @keyframes vioraCardIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .viora-card {
          animation: vioraCardIn 500ms cubic-bezier(0.23, 1, 0.32, 1) both;
        }
        .viora-card:nth-child(1)  { animation-delay: 0ms; }
        .viora-card:nth-child(2)  { animation-delay: 50ms; }
        .viora-card:nth-child(3)  { animation-delay: 100ms; }
        .viora-card:nth-child(4)  { animation-delay: 150ms; }
        .viora-card:nth-child(n+5) { animation-delay: 200ms; }

        /* Sort select */
        .viora-select {
          appearance: none;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(0,0,0,0.12);
          padding: 4px 20px 4px 0;
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-family: inherit;
          cursor: pointer;
          outline: none;
          transition: border-color 200ms ease;
        }
        .viora-select:focus { border-color: #000; }

        @media (prefers-reduced-motion: reduce) {
          .viora-card { animation: none !important; }
          .viora-card-img { transition: none !important; }
          .viora-quick-add { transition: none !important; }
        }
      `}</style>

      <div className="w-full max-w-screen-2xl mx-auto">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div ref={headerRef} className="sticky top-14 md:top-16 z-30 bg-white border-b border-black/6 px-5 md:px-10 py-4 md:py-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-xs font-medium uppercase tracking-[0.2em]">
                {isDiscountView ? "Sale" : "Colección"}
              </h1>
              <p className="text-[10px] text-black/30 mt-0.5 tracking-wide">
                {filtered.length} {filtered.length === 1 ? "artículo" : "artículos"}
              </p>
            </div>
            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="viora-select"
              >
                <option value="default">Destacados</option>
                <option value="price-asc">Precio: Menor</option>
                <option value="price-desc">Precio: Mayor</option>
                <option value="promo">Mayor Descuento</option>
              </select>
              {/* arrow */}
              <span className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-black/40 text-[10px]">↓</span>
            </div>
          </div>

          {/* Category filters */}
          <FilterBar
            categories={categories}
            active={activeCategory}
            onChange={setActiveCategory}
          />
        </div>

        {/* ── Grid ─────────────────────────────────────────────────────── */}
        <div className="px-5 md:px-10 py-8 md:py-12 pb-24">
          {filtered.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-3 md:gap-x-4 gap-y-10 md:gap-y-14">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 4} />
              ))}
            </div>
          ) : (
            // Empty state
            <div className="flex flex-col items-center justify-center py-36 gap-4">
              <p className="viora-serif italic text-[clamp(28px,4vw,48px)] font-light text-black/20">
                Sin resultados
              </p>
              <p className="text-xs text-black/30 tracking-widest uppercase">
                {isDiscountView
                  ? "No hay artículos en oferta por el momento"
                  : "No hay productos en esta categoría"}
              </p>
              {activeCategory !== "todos" && (
                <button
                  onClick={() => setActiveCategory("todos")}
                  className="mt-4 text-[10px] uppercase tracking-[0.16em] border-b border-black pb-0.5 hover:opacity-50 transition-opacity"
                >
                  Ver todo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
