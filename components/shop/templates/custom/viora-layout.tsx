"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import type { ShopLayoutProps } from "@/lib/templates/component-registry";
import { VioraHome } from "./viora-home";
import { VioraCollection } from "./viora-collection";
import { useCart } from "@/components/shared";
import { ShoppingBag } from "lucide-react";

// ─── TYPE ───────────────────────────────────────────────────────────────────

type VioraView = "home" | "collection" | "discounts";

// ─── MAIN LAYOUT ─────────────────────────────────────────────────────────────

export function VioraLayout({ shop, products }: ShopLayoutProps) {
  const searchParams = useSearchParams();
  const view = (searchParams.get("view") || "home") as VioraView;

  // Scroll-aware navbar
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { cart } = useCart();
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // On route change, close mobile menu
  useEffect(() => setMenuOpen(false), [view]);

  const isHome = view === "home";
  // On home and not yet scrolled, navbar is transparent with white text
  const transparent = isHome && !scrolled;

  return (
    <>
      {/* ─── FONTS ─────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&family=DM+Sans:wght@300;400;500&display=swap');

        .viora-root {
          font-family: 'DM Sans', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .viora-serif {
          font-family: 'Cormorant Garamond', serif;
        }

        /* Navbar transition — only background + color, not all */
        .viora-nav {
          transition:
            background-color 350ms cubic-bezier(0.23, 1, 0.32, 1),
            border-color 350ms cubic-bezier(0.23, 1, 0.32, 1),
            color 350ms cubic-bezier(0.23, 1, 0.32, 1);
        }

        /* Nav links: underline reveal via clip-path */
        .viora-navlink {
          position: relative;
          letter-spacing: 0.14em;
          font-size: 10px;
          font-weight: 500;
          text-transform: uppercase;
        }
        .viora-navlink::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 1px;
          background: currentColor;
          transform-origin: left;
          transform: scaleX(0);
          transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        @media (hover: hover) and (pointer: fine) {
          .viora-navlink:hover::after { transform: scaleX(1); }
        }

        /* Mobile menu slide */
        .viora-menu {
          transform: translateY(-100%);
          transition: transform 380ms cubic-bezier(0.32, 0.72, 0, 1);
        }
        .viora-menu.open {
          transform: translateY(0);
        }

        /* Cart badge pop */
        @keyframes badgePop {
          0%   { transform: scale(0.4); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
        .viora-badge {
          animation: badgePop 220ms cubic-bezier(0.23, 1, 0.32, 1) both;
        }

        /* Global: no outline visible rings */
        .viora-root *:focus-visible {
          outline: 1px solid currentColor;
          outline-offset: 2px;
        }

        /* Selection */
        .viora-root ::selection {
          background: #000;
          color: #fff;
        }
      `}</style>

      <div className="viora-root min-h-screen bg-white text-black">

        {/* ─── NAVBAR ──────────────────────────────────────────────────── */}
        <header
          className={`viora-nav fixed top-0 left-0 right-0 z-50 border-b ${
            transparent
              ? "bg-transparent border-transparent text-white"
              : "bg-white border-black/8 text-black"
          }`}
        >
          <div className="flex items-center justify-between px-5 md:px-10 h-14 md:h-16">

            {/* Left */}
            <div className="flex items-center gap-6 md:gap-8 w-1/3">
              {/* Hamburger — mobile only */}
              <button
                onClick={() => setMenuOpen(v => !v)}
                className="md:hidden flex flex-col gap-[5px] py-1"
                aria-label="Menú"
              >
                <span className={`block w-5 h-px transition-all duration-300 ${menuOpen ? "rotate-45 translate-y-[6px]" : ""} bg-current`} />
                <span className={`block w-5 h-px transition-all duration-300 ${menuOpen ? "opacity-0" : ""} bg-current`} />
                <span className={`block w-5 h-px transition-all duration-300 ${menuOpen ? "-rotate-45 -translate-y-[6px]" : ""} bg-current`} />
              </button>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-6">
                <a href="?view=collection" className="viora-navlink">Colección</a>
                <a href="?view=discounts" className="viora-navlink text-red-500">Sale</a>
              </nav>
            </div>

            {/* Center — Logo */}
            <a
              href="?view=home"
              className="viora-serif absolute left-1/2 -translate-x-1/2 text-xl md:text-2xl font-light tracking-[0.22em] uppercase whitespace-nowrap"
            >
              {shop?.name || "VIORA"}
            </a>

            {/* Right */}
            <div className="flex items-center gap-4 md:gap-6 w-1/3 justify-end">
              <button className="viora-navlink hidden md:block">Búsqueda</button>
              <button className="relative p-1" aria-label={`Bolsa (${totalItems})`}>
                <ShoppingBag className="w-4 h-4 stroke-[1.5]" />
                {totalItems > 0 && (
                  <span
                    key={totalItems}
                    className="viora-badge absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-black text-white text-[8px] font-bold rounded-full flex items-center justify-center"
                  >
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* ─── MOBILE MENU ─────────────────────────────────────────────── */}
        <div className={`viora-menu fixed top-14 left-0 right-0 z-40 bg-white border-b border-black/8 px-5 py-8 flex flex-col gap-6 md:hidden ${menuOpen ? "open" : ""}`}>
          <a href="?view=collection" className="text-sm font-medium uppercase tracking-[0.18em]">Colección</a>
          <a href="?view=discounts" className="text-sm font-medium uppercase tracking-[0.18em] text-red-500">Sale</a>
          <a href="?view=home" className="text-sm font-medium uppercase tracking-[0.18em]">Inicio</a>
        </div>

        {/* ─── CONTENT ─────────────────────────────────────────────────── */}
        <main className={isHome ? "w-full" : "w-full pt-14 md:pt-16"}>
          {view === "home"       && <VioraHome shop={shop as any} />}
          {view === "collection" && <VioraCollection products={products} />}
          {view === "discounts"  && <VioraCollection products={products} isDiscountView />}
        </main>

        {/* ─── FOOTER ──────────────────────────────────────────────────── */}
        <footer className="w-full border-t border-black/8 px-5 md:px-10 pt-16 pb-10 mt-24">
          <div className="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">

            {/* Brand */}
            <div>
              <p className="viora-serif text-3xl font-light tracking-[0.2em] uppercase mb-4">
                {shop?.name || "VIORA"}
              </p>
              {shop?.description && (
                <p className="text-xs leading-relaxed text-black/40 max-w-xs">{shop.description}</p>
              )}
            </div>

            {/* Help */}
            <div>
              <h4 className="text-[10px] font-medium uppercase tracking-[0.2em] mb-5">Ayuda</h4>
              <ul className="space-y-3">
                {["Envíos y Devoluciones", "Guía de Tallas", "Política de Privacidad", "Contacto"].map(l => (
                  <li key={l}>
                    <a href="#" className="viora-navlink text-xs text-black/50 hover:text-black transition-colors duration-200">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-[10px] font-medium uppercase tracking-[0.2em] mb-5">Empresa</h4>
              <ul className="space-y-3">
                {["Acerca de Nosotros", "Sostenibilidad", "Carreras", "Términos Legales"].map(l => (
                  <li key={l}>
                    <a href="#" className="viora-navlink text-xs text-black/50 hover:text-black transition-colors duration-200">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <h4 className="text-[10px] font-medium uppercase tracking-[0.2em] mb-5">Newsletter</h4>
              <p className="text-xs text-black/40 leading-relaxed mb-5">
                Nuevas colecciones y acceso anticipado a los mejores precios.
              </p>
              <div className="border-b border-black pb-2 flex gap-2">
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  className="flex-1 outline-none text-xs tracking-wide bg-transparent placeholder-black/25 py-1"
                />
                <button className="text-[10px] font-medium uppercase tracking-[0.16em] hover:opacity-50 transition-opacity duration-200 pb-1">
                  →
                </button>
              </div>
            </div>
          </div>

          <div className="max-w-screen-xl mx-auto mt-16 pt-6 border-t border-black/6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-black/30 tracking-widest uppercase">
              © {new Date().getFullYear()} {shop?.name || "Viora"}. Todos los derechos reservados.
            </p>
            <p className="text-[10px] text-black/20 tracking-widest uppercase">Powered by Linko</p>
          </div>
        </footer>
      </div>
    </>
  );
}
