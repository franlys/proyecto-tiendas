"use client";

import { useEffect, useRef, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ManagedShop } from "@/components/shared";

interface VioraMedia {
  heroImage?: string;
  gridImage1?: string;
  gridImage2?: string;
  gridImage3?: string;
  editorialImage?: string;
}

// ─── DEFAULT IMAGES (fashion editorial — swimwear/clothing) ──────────────────
const DEFAULTS = {
  heroImage:
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2400&auto=format&fit=crop",
  gridImage1:
    "https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=1600&auto=format&fit=crop",
  gridImage2:
    "https://images.unsplash.com/photo-1554568218-0f1715e72254?q=80&w=1200&auto=format&fit=crop",
  gridImage3:
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop",
  editorialImage:
    "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?q=80&w=1800&auto=format&fit=crop",
};

// ─── INTERSECTION REVEAL HOOK ────────────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─── HOME ────────────────────────────────────────────────────────────────────

export function VioraHome({ shop }: { shop: ManagedShop }) {
  const editorial = useReveal(0.1);
  const story = useReveal(0.12);
  const newArrivals = useReveal(0.08);

  // Load custom photos from Firestore (set via /admin/viora-fotos)
  const [media, setMedia] = useState<VioraMedia>({});
  useEffect(() => {
    if (!shop?.id) return;
    getDoc(doc(db, "shops", shop.id, "settings", "viora"))
      .then(snap => { if (snap.exists()) setMedia(snap.data() as VioraMedia); })
      .catch(() => {});
  }, [shop?.id]);

  const heroImage    = media.heroImage    || DEFAULTS.heroImage;
  const gridImage1   = media.gridImage1   || DEFAULTS.gridImage1;
  const gridImage2   = media.gridImage2   || DEFAULTS.gridImage2;
  const gridImage3   = media.gridImage3   || DEFAULTS.gridImage3;
  const editorialImage = media.editorialImage || DEFAULTS.editorialImage;

  return (
    <>
      <style>{`
        /* Hero text stagger reveal */
        @keyframes vioraFadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Image clip reveal (scroll-triggered) */
        @keyframes vioraClipReveal {
          from { clip-path: inset(0 0 100% 0); }
          to   { clip-path: inset(0 0 0% 0); }
        }

        /* Fade in for editorial text */
        @keyframes vioraFadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .hero-line-1 {
          animation: vioraFadeUp 900ms cubic-bezier(0.23, 1, 0.32, 1) 200ms both;
        }
        .hero-line-2 {
          animation: vioraFadeUp 900ms cubic-bezier(0.23, 1, 0.32, 1) 380ms both;
        }
        .hero-cta {
          animation: vioraFadeUp 700ms cubic-bezier(0.23, 1, 0.32, 1) 560ms both;
        }

        /* Image hover zoom — long duration = luxury feel */
        .viora-img-zoom img {
          transition: transform 1200ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        @media (hover: hover) and (pointer: fine) {
          .viora-img-zoom:hover img { transform: scale(1.04); }
        }

        /* Scroll reveal clip */
        .viora-reveal {
          clip-path: inset(0 0 100% 0);
          transition: clip-path 900ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .viora-reveal.is-visible {
          clip-path: inset(0 0 0% 0);
        }

        /* Stagger for new arrivals label */
        .arrivals-label {
          opacity: 0;
          transform: translateY(12px);
          transition: opacity 600ms ease, transform 600ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .arrivals-label.is-visible {
          opacity: 1;
          transform: translateY(0);
        }
        .arrivals-label:nth-child(1) { transition-delay: 0ms; }
        .arrivals-label:nth-child(2) { transition-delay: 80ms; }
        .arrivals-label:nth-child(3) { transition-delay: 160ms; }
        .arrivals-label:nth-child(4) { transition-delay: 240ms; }

        /* CTA button: flat with explicit hover invert per variant */
        .viora-btn {
          display: inline-block;
          padding: 10px 22px;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          border: 1px solid currentColor;
          transition:
            background-color 220ms ease,
            color 220ms ease,
            border-color 220ms ease;
        }
        @media (min-width: 640px) {
          .viora-btn {
            padding: 13px 32px;
            font-size: 10px;
            letter-spacing: 0.18em;
          }
        }
        /* light = white text on dark bg → hover = white bg + black text */
        @media (hover: hover) and (pointer: fine) {
          .viora-btn.light:hover {
            background-color: #fff;
            color: #000;
            border-color: #fff;
          }
          /* dark = black text on light bg → hover = black bg + white text */
          .viora-btn.dark:hover {
            background-color: #000;
            color: #fff;
            border-color: #000;
          }
        }
        /* Press feedback — 120ms, scale(0.97) */
        .viora-btn:active {
          transform: scale(0.97);
          transition: transform 120ms cubic-bezier(0.23, 1, 0.32, 1);
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-line-1, .hero-line-2, .hero-cta,
          .viora-reveal, .arrivals-label {
            animation: none !important;
            transition: none !important;
            clip-path: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative w-full h-screen overflow-hidden viora-img-zoom">
        <img
          src={heroImage}
          alt="Nueva Colección"
          className="absolute inset-0 w-full h-full object-cover object-center"
          fetchPriority="high"
        />
        {/* Gradient: stronger at bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-black/10" />

        {/* Hero text — bottom left, Zara style */}
        <div className="absolute bottom-0 left-0 px-5 md:px-10 pb-16 md:pb-20">
          <p className="hero-line-1 viora-serif text-white text-[10px] tracking-[0.3em] uppercase mb-3 font-light">
            {new Date().getFullYear()} — Nueva Temporada
          </p>
          <h1 className="hero-line-2 viora-serif text-white text-[clamp(44px,9vw,110px)] font-light leading-[0.9] tracking-[-0.01em] italic mb-6 md:mb-10">
            Verano<br />eterno.
          </h1>
          <div className="hero-cta flex gap-3 md:gap-4 flex-wrap">
            <a href="?view=collection" className="viora-btn light text-white">
              Ver Colección
            </a>
            <a href="?view=discounts" className="viora-btn light text-white/70 border-white/40">
              Sale
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 right-6 md:right-10 flex flex-col items-center gap-2 opacity-40">
          <div className="w-px h-10 bg-white" style={{ animation: "vioraFadeUp 1s ease 1.2s both" }} />
        </div>
      </section>

      {/* ── EDITORIAL GRID: asymmetric 3-panel ───────────────────────── */}
      <section className="w-full grid grid-cols-2 md:grid-cols-3 gap-[2px] mt-[2px]">

        {/* Tall left panel — toda la imagen es clickable */}
        <a href="?view=collection" className="col-span-1 md:col-span-1 viora-img-zoom overflow-hidden relative block cursor-pointer" style={{ aspectRatio: "3/4" }}>
          <img src={gridImage1} alt="Mujer" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <span className="viora-serif text-white text-xl font-light italic">Mujer</span>
          </div>
        </a>

        {/* Right: stacked 2 shorter panels */}
        <div className="col-span-1 md:col-span-2 grid grid-rows-2 gap-[2px]">
          <a href="?view=collection" className="viora-img-zoom overflow-hidden relative block cursor-pointer" style={{ aspectRatio: "4/3" }}>
            <img src={gridImage2} alt="Nueva llegada" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <span className="viora-serif text-white text-base md:text-lg font-light italic">Nueva Llegada</span>
              <span className="viora-btn light text-white pointer-events-none">Ver Todo</span>
            </div>
          </a>
          <a href="?view=collection&category=Trajes+de+Ba%C3%B1o" className="viora-img-zoom overflow-hidden relative block cursor-pointer" style={{ aspectRatio: "4/3" }}>
            <img src={gridImage3} alt="Trajes de baño" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <span className="viora-serif text-white text-base md:text-lg font-light italic">Trajes de Baño</span>
            </div>
          </a>
        </div>
      </section>

      {/* ── EDITORIAL QUOTE ──────────────────────────────────────────── */}
      <section
        ref={editorial.ref as any}
        className="w-full py-24 md:py-36 px-5 md:px-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-8 max-w-screen-xl mx-auto"
      >
        <div style={{ transition: "opacity 800ms cubic-bezier(0.23,1,0.32,1), transform 800ms cubic-bezier(0.23,1,0.32,1)" }} className={editorial.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}>
          <p className="text-[10px] tracking-[0.3em] uppercase text-black/30 mb-5">Filosofía</p>
          <blockquote className="viora-serif text-[clamp(30px,5vw,58px)] font-light leading-[1.1] tracking-[-0.01em] italic max-w-2xl">
            "La moda no es sólo ropa — es el lenguaje silencioso de quién eres."
          </blockquote>
        </div>
        <div style={{ transition: "opacity 800ms cubic-bezier(0.23,1,0.32,1) 200ms, transform 800ms cubic-bezier(0.23,1,0.32,1) 200ms" }} className={`shrink-0 ${editorial.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
          <a href="?view=collection" className="viora-btn dark text-black">Explorar</a>
        </div>
      </section>

      {/* ── FULL-BLEED EDITORIAL STORY ───────────────────────────────── */}
      <section
        ref={story.ref as any}
        className="w-full relative overflow-hidden viora-img-zoom"
        style={{ height: "70vh" }}
      >
        <div className={`viora-reveal ${story.visible ? "is-visible" : ""} w-full h-full`}>
          <img
            src={editorialImage}
            alt="Viora Editorial"
            className="w-full h-full object-cover object-center"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-start justify-center px-8 md:px-16">
          <p className="text-white/50 text-[10px] tracking-[0.3em] uppercase mb-4">Colección Verano</p>
          <h2 className="viora-serif text-white text-[clamp(36px,6vw,80px)] font-light italic leading-[1] mb-8 max-w-lg">
            La piel del sol
          </h2>
          <a href="?view=collection" className="viora-btn light text-white">Descubrir</a>
        </div>
      </section>

      {/* ── NEW ARRIVALS TICKER ──────────────────────────────────────── */}
      <section
        ref={newArrivals.ref as any}
        className="w-full border-y border-black/8 py-6 px-5 md:px-10 overflow-hidden"
      >
        <div className="flex items-center gap-8 md:gap-16 whitespace-nowrap">
          {[
            { label: "Nueva Colección",   href: "?view=collection" },
            { label: "Trajes de Baño",    href: "?view=collection&category=trajes" },
            { label: "Vestidos",          href: "?view=collection&category=vestidos" },
            { label: "Accesorios",        href: "?view=collection&category=accesorios" },
            { label: "Sale — Hasta 50%",  href: "?view=discounts" },
          ].map(({ label, href }, i) => (
            <a
              key={label}
              href={href}
              className={`arrivals-label viora-serif italic text-base font-light tracking-wide ${i === 4 ? "text-red-500" : "text-black/60"} ${newArrivals.visible ? "is-visible" : ""}`}
            >
              {label}
              {i < 4 && <span className="mx-8 md:mx-16 text-black/20 not-italic font-light">·</span>}
            </a>
          ))}
        </div>
      </section>

      {/* ── BOTTOM SPACER ────────────────────────────────────────────── */}
      <div className="h-4" />
    </>
  );
}
