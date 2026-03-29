"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  CreditCard,
  MessageSquarePlus,
  MessageCircle,
  Unlock,
  ShoppingBag,
  ChevronRight,
  ArrowUpRight,
  MapPin,
  Globe,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Product } from "@/lib/constants";
import { useCart, useWholesale } from "@/components/shared";
import { WholesaleButton } from "@/components/shop";
import { QuoteRequestModal } from "@/components/shop/quote-request-modal";
import { FinancingModal } from "@/components/shop/financing-modal";
import { LiveChatWidget } from "@/components/shop/live-chat-widget";
import { LogoAnimation } from "@/components/shop/logo-animation";
import Link from "next/link";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import gsap from "gsap";

// ─── TYPES ─────────────────────────────────────────────────────────────────

interface FeatureConfig {
  enabled: boolean;
  title: string;
  description: string;
}

interface HomepageConfig {
  features: {
    financing: FeatureConfig;
    quote: FeatureConfig;
    chat: FeatureConfig;
    wholesale: FeatureConfig;
  };
}

const DEFAULT_CONFIG: HomepageConfig = {
  features: {
    financing: {
      enabled: true,
      title: "Financiamiento",
      description: "Aprueba tu crédito con BANFONDESA en minutos. Lleva tu equipo hoy y paga cómodamente.",
    },
    quote: {
      enabled: true,
      title: "Cotizaciones",
      description: "¿Buscas algo específico? Solicita una cotización y te respondemos con el mejor precio.",
    },
    chat: {
      enabled: true,
      title: "Chat en Vivo",
      description: "Habla directamente con nuestro equipo. Estamos listos para resolver tus dudas.",
    },
    wholesale: {
      enabled: true,
      title: "Precios Mayoristas",
      description: "Precios especiales para distribuidores y compras al por mayor. Activa tu acceso hoy.",
    },
  },
};

// ─── FEATURE CARD ──────────────────────────────────────────────────────────

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  cta: string;
  onClick: () => void;
  delay?: number;
}

type FeatureCardItem = FeatureCardProps & { key: string };

function FeatureCard({
  icon,
  title,
  description,
  accent,
  accentBg,
  accentBorder: _accentBorder,
  cta,
  onClick,
  delay = 0,
}: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, transition: { duration: 0.22, ease: [0.23, 1, 0.32, 1] } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.12 } }}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      className={cn(
        "group relative flex flex-col gap-5 p-7 rounded-3xl border cursor-pointer transition-colors duration-300",
        "bg-white/[0.025] border-white/8 hover:border-white/16 hover:bg-white/[0.04]"
      )}
    >
      {/* Icon */}
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300", accentBg, "group-hover:scale-110")}>
        <span className={cn("transition-colors duration-300", accent)}>{icon}</span>
      </div>

      {/* Text */}
      <div className="flex flex-col gap-2 flex-1">
        <h3 className="text-base font-black text-white tracking-tight">{title}</h3>
        <p className="text-sm text-white/40 leading-relaxed">{description}</p>
      </div>

      {/* CTA — slides up from overflow-hidden container */}
      <div className="overflow-hidden">
        <div className={cn(
          "flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest",
          "translate-y-full group-hover:translate-y-0 transition-transform duration-300",
          accent
        )} style={{ transitionTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)" }}>
          {cta}
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>

      {/* Mouse-follow spotlight glow */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: "radial-gradient(280px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.055), transparent 70%)" }}
      />
    </motion.div>
  );
}

// ─── HERO ──────────────────────────────────────────────────────────────────

function HomeHero({ shop, tiendaHref }: { shop: any; tiendaHref: string }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 55, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 55, damping: 25 });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".home-hero-line",
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, stagger: 0.12, ease: "power3.out", delay: 0.1 }
      );
      gsap.fromTo(
        ".home-hero-sub",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: "power2.out", delay: 0.55 }
      );
    }, heroRef);
    return () => ctx.revert();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <section ref={heroRef} onMouseMove={handleMouseMove} className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Static ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white/[0.018] rounded-full blur-[160px] pointer-events-none" />
      {/* Mouse-follow glow */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none"
        style={{
          left: springX,
          top: springY,
          translateX: "-50%",
          translateY: "-50%",
          background: "radial-gradient(circle, rgba(255,255,255,0.035) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-screen-xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-16 items-center py-24">
        <div className="space-y-8">
          <div className="overflow-hidden">
            <p className="home-hero-line text-[10px] font-semibold uppercase tracking-[0.4em] text-white/35 mb-6 font-mono">
              {shop.slogan || "Tecnología de nueva generación"}
            </p>
          </div>

          <div style={{ overflow: "hidden clip" }}>
            <h1
              className="home-hero-line font-black leading-[0.88] tracking-[-0.04em] text-white"
              style={{ fontSize: "clamp(2.4rem, 5.5vw, 5.2rem)" }}
            >
              {shop.name}
            </h1>
          </div>

          <p className="home-hero-sub text-white/38 text-[15px] md:text-base leading-[1.7] max-w-md font-light tracking-wide">
            {shop.description || "Dispositivos de élite. Diseño sin concesiones. La experiencia premium que mereces."}
          </p>

          <div className="home-hero-sub flex items-center gap-4 flex-wrap">
            <Link
              href={tiendaHref}
              className="flex items-center gap-2 px-7 py-3.5 bg-white text-black rounded-full font-bold text-sm tracking-wide hover:bg-white/90 active:scale-[0.97] transition-all"
            >
              Ver Catálogo <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <LogoAnimation />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
    </section>
  );
}

// ─── FEATURES SECTION ──────────────────────────────────────────────────────

function FeaturesSection({
  config,
  shop,
  onFinancing,
  onQuote,
}: {
  config: HomepageConfig;
  shop: any;
  onFinancing: () => void;
  onQuote: () => void;
}) {
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true });

  const { features } = config;
  const showWholesale = shop.wholesaleEnabled && features.wholesale.enabled;

  const cards: FeatureCardItem[] = [
    features.financing.enabled && {
      key: "financing",
      icon: <CreditCard className="w-5 h-5" />,
      title: features.financing.title,
      description: features.financing.description,
      accent: "text-blue-400",
      accentBg: "bg-blue-500/12",
      accentBorder: "from-blue-500/8",
      cta: "Solicitar crédito",
      onClick: onFinancing,
    },
    features.quote.enabled && {
      key: "quote",
      icon: <MessageSquarePlus className="w-5 h-5" />,
      title: features.quote.title,
      description: features.quote.description,
      accent: "text-emerald-400",
      accentBg: "bg-emerald-500/12",
      accentBorder: "from-emerald-500/8",
      cta: "Cotizar ahora",
      onClick: onQuote,
    },
    features.chat.enabled && {
      key: "chat",
      icon: <MessageCircle className="w-5 h-5" />,
      title: features.chat.title,
      description: features.chat.description,
      accent: "text-sky-400",
      accentBg: "bg-sky-500/12",
      accentBorder: "from-sky-500/8",
      cta: "Iniciar chat",
      // Chat is opened via LiveChatWidget — scroll hint
      onClick: () => document.querySelector<HTMLButtonElement>("[data-chat-trigger]")?.click(),
    },
    showWholesale && {
      key: "wholesale",
      icon: <Unlock className="w-5 h-5" />,
      title: features.wholesale.title,
      description: features.wholesale.description,
      accent: "text-amber-400",
      accentBg: "bg-amber-500/12",
      accentBorder: "from-amber-500/8",
      cta: "Activar acceso",
      onClick: () => document.querySelector<HTMLButtonElement>("[data-wholesale-trigger]")?.click(),
    },
  ].filter(Boolean) as FeatureCardItem[];

  if (cards.length === 0) return null;

  return (
    <section className="max-w-screen-xl mx-auto px-6 md:px-12 py-20 space-y-14">
      {/* Section heading */}
      <div ref={titleRef} className="max-w-lg">
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/25 mb-4"
        >
          Lo que ofrecemos
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={titleInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight"
        >
          Todo lo que necesitas,<br />
          <span className="text-white/35">en un solo lugar.</span>
        </motion.h2>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ key, ...card }, i) => (
          <FeatureCard key={key} {...card} delay={i * 0.08} />
        ))}
      </div>
    </section>
  );
}

// ─── FEATURED PRODUCTS ──────────────────────────────────────────────────────

function FeaturedCard({ product, tiendaHref, index }: { product: Product; tiendaHref: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const { isWholesaleMode } = useWholesale();

  const price = (() => {
    const base = Number((product as any).promoPrice || product.price) || 0;
    if (isWholesaleMode) {
      const wholesale = Number((product as any).wholesalePrice) || 0;
      return wholesale > 0 ? wholesale : base;
    }
    return base;
  })();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.55, delay: Math.min(index * 0.07, 0.21), ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={tiendaHref} className="group block bg-[#0c0c0c] border border-white/6 rounded-2xl overflow-hidden hover:border-white/14 transition-colors duration-300">
        {/* Image */}
        <div className="relative overflow-hidden bg-[#0f0f0f]" style={{ paddingTop: "100%" }}>
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Package className="w-10 h-10 text-white/10" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          {product.category && (
            <p className="text-[9px] text-white/25 font-mono uppercase tracking-[0.25em]">{product.category}</p>
          )}
          <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">{product.name}</h3>
          <div className="flex items-center justify-between pt-1">
            <span className={cn("text-sm font-bold", isWholesaleMode ? "text-amber-400" : "text-white")}>
              {price > 0 ? `$${price.toLocaleString()}` : "Consultar"}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-white/30 group-hover:text-white/60 transition-colors duration-200 font-medium">
              Ver <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function FeaturedProductsSection({
  products,
  loadingData,
  tiendaHref,
}: {
  products: Product[];
  loadingData: boolean;
  tiendaHref: string;
}) {
  const titleRef = useRef<HTMLDivElement>(null);
  const titleInView = useInView(titleRef, { once: true });

  const featured = products.slice(0, 6);

  if (!loadingData && featured.length === 0) return null;

  return (
    <section className="max-w-screen-xl mx-auto px-6 md:px-12 py-20 space-y-12">
      <div ref={titleRef} className="flex items-end justify-between">
        <div className="space-y-3">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/25"
          >
            Catálogo
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={titleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="text-3xl md:text-4xl font-black tracking-tight text-white leading-tight"
          >
            Productos Destacados
          </motion.h2>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={titleInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            href={tiendaHref}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-white/35 hover:text-white transition-colors duration-200"
          >
            Ver todos <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>

      {loadingData ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/3 rounded-2xl animate-pulse" style={{ paddingTop: "140%" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {featured.map((product, i) => (
            <FeaturedCard key={product.id} product={product} tiendaHref={tiendaHref} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── CTA SECTION ────────────────────────────────────────────────────────────

function CTASection({ tiendaHref }: { tiendaHref: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <section ref={ref} className="max-w-screen-xl mx-auto px-6 md:px-12 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7 }}
        className="relative rounded-3xl border border-white/8 bg-white/[0.025] overflow-hidden p-12 md:p-16 text-center space-y-6"
      >
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />

        <div className="relative space-y-4">
          <p className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/25">Catálogo completo</p>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            Explora todos nuestros productos
          </h2>
          <p className="text-white/35 text-sm md:text-base max-w-md mx-auto leading-relaxed">
            Smartphones, accesorios, equipos de trabajo y más. Todos con garantía y soporte técnico.
          </p>
        </div>

        <Link
          href={tiendaHref}
          className="relative inline-flex items-center gap-2 px-8 py-4 bg-white text-black rounded-full font-bold text-sm tracking-wide hover:bg-white/90 active:scale-[0.97] transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          Ver Catálogo Completo
          <ChevronRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </section>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

interface TechPremiumV2HomeProps {
  shop: any;
  products?: Product[];
  loadingData?: boolean;
}

export function TechPremiumV2Home({ shop, products = [], loadingData = false }: TechPremiumV2HomeProps) {
  const { shopId } = useParams<{ shopId: string }>();
  const { items: cart, setIsCartOpen } = useCart();
  const { isWholesaleMode, wholesalerName } = useWholesale();
  const [config, setConfig] = useState<HomepageConfig>(DEFAULT_CONFIG);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isFinancingOpen, setIsFinancingOpen] = useState(false);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const tiendaHref = `/${shopId}/tienda`;

  // Load homepage config from Firestore
  useEffect(() => {
    if (!shop?.id) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "shops", shop.id, "settings", "homepage"));
        if (snap.exists()) {
          const data = snap.data() as HomepageConfig;
          // Merge with defaults so new features always have fallback values
          setConfig({
            features: {
              financing: { ...DEFAULT_CONFIG.features.financing, ...data.features?.financing },
              quote: { ...DEFAULT_CONFIG.features.quote, ...data.features?.quote },
              chat: { ...DEFAULT_CONFIG.features.chat, ...data.features?.chat },
              wholesale: { ...DEFAULT_CONFIG.features.wholesale, ...data.features?.wholesale },
            },
          });
        }
      } catch {}
    };
    load();
  }, [shop?.id]);

  return (
    <div className="min-h-screen" style={{ background: "#060606", color: "#fff" }}>

      {/* ─── NAVBAR ─── */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/5">
        <div className="max-w-screen-xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {shop.logo ? (
              <img src={shop.logo} alt={shop.name} className="h-7 w-auto object-contain" />
            ) : (
              <span className="text-sm font-black uppercase tracking-[-0.04em] text-white">{shop.name}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsFinancingOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-white/45 hover:text-white hover:bg-white/8 transition-all uppercase tracking-widest"
            >
              <CreditCard className="w-3.5 h-3.5" />
              Financiamiento
            </button>
            <button
              type="button"
              onClick={() => setIsQuoteOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold text-white/45 hover:text-white hover:bg-white/8 transition-all uppercase tracking-widest"
            >
              <MessageSquarePlus className="w-3.5 h-3.5" />
              Cotizar
            </button>
            {shop.wholesaleEnabled && (
              <WholesaleButton
                shopId={shop.id}
                className="px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest border-0 bg-transparent text-white/45 hover:text-white hover:bg-white/8"
              />
            )}
            <Link
              href={tiendaHref}
              className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-white/90 active:scale-[0.97] transition-all ml-1"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Catálogo</span>
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", duration: 0.4, bounce: 0.35 }}
                  className="w-4 h-4 bg-black text-white text-[9px] font-black rounded-full flex items-center justify-center"
                >
                  {totalItems}
                </motion.span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* ─── CONTENT ─── */}
      <div className="pt-16">
        <HomeHero shop={shop} tiendaHref={tiendaHref} />
        <FeaturesSection
          config={config}
          shop={shop}
          onFinancing={() => setIsFinancingOpen(true)}
          onQuote={() => setIsQuoteOpen(true)}
        />
        <FeaturedProductsSection
          products={products}
          loadingData={loadingData}
          tiendaHref={tiendaHref}
        />
        <CTASection tiendaHref={tiendaHref} />
      </div>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/5 py-12 px-6 md:px-12">
        <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-[11px] font-mono uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} {shop.name}
          </p>
          <p className="text-white/15 text-[10px] font-mono uppercase tracking-widest">Powered by Linko</p>
        </div>
      </footer>

      {/* Mobile FABs */}
      <button
        type="button"
        onClick={() => setIsQuoteOpen(true)}
        className="sm:hidden fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/15 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-xl"
      >
        <MessageSquarePlus className="w-4 h-4" />
        Cotizar
      </button>
      <button
        type="button"
        onClick={() => setIsFinancingOpen(true)}
        className="lg:hidden fixed bottom-36 right-4 z-40 flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/15 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-xl"
      >
        <CreditCard className="w-4 h-4" />
        Financiamiento
      </button>

      {/* Modals */}
      <QuoteRequestModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        shopId={shop.id}
        categories={[]}
      />
      <FinancingModal
        isOpen={isFinancingOpen}
        onClose={() => setIsFinancingOpen(false)}
        shopId={shop.id}
      />
      <LiveChatWidget shopId={shop.id} shopName={shop.name} />
    </div>
  );
}
