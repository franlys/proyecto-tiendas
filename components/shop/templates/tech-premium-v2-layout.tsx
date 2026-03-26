"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
    ShoppingBag,
    Search,
    Package,
    MapPin,
    Globe,
    ChevronRight,
    ArrowUpRight,
    MessageSquarePlus,
    CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart, useVisualFeedback, useWholesale } from "@/components/shared";
import type { Product, Service } from "@/lib/constants";
import { ProductOptionsModal } from "@/components/shop/product-card";
import { WholesaleButton } from "@/components/shop";
import { QuoteRequestModal } from "@/components/shop/quote-request-modal";
import { LiveChatWidget } from "@/components/shop/live-chat-widget";
import { FinancingModal } from "@/components/shop/financing-modal";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { LogoAnimation } from "@/components/shop/logo-animation";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface TechPremiumV2Props {
    shop: any;
    products: Product[];
    services: Service[];
    loadingData: boolean;
}

type View = "products" | "services" | "location";

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function ProductCard({ product, index }: { product: Product; index: number }) {
    const { addProduct } = useCart();
    const { triggerFlyToCart } = useVisualFeedback();
    const { isWholesaleMode, getDisplayPrice } = useWholesale();
    const cardRef = useRef<HTMLDivElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const hasVariants = product.variants && product.variants.length > 0;
    const hasExtras = product.extras && product.extras.length > 0;
    const hasOptions = hasVariants || hasExtras;
    const isOutOfStock =
        !product.infiniteStock &&
        (Number(product.stock) || 0) <= 0 &&
        (!hasVariants || !product.variants!.some(v => (Number(v.stock) || 0) > 0));

    useEffect(() => {
        const el = cardRef.current;
        if (!el) return;
        gsap.fromTo(
            el,
            { opacity: 0, y: 24 },
            {
                opacity: 1, y: 0,
                duration: 0.5,
                delay: Math.min(index * 0.035, 0.3), // cap delay so late cards don't wait too long
                ease: "power2.out",
                scrollTrigger: { trigger: el, start: "top 96%", once: true },
                clearProps: "willChange", // release GPU layer after animation
            }
        );
        el.style.willChange = "transform, opacity";
    }, [index]);

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (hasOptions) {
            setIsModalOpen(true);
        } else if (!isOutOfStock) {
            if (cardRef.current) {
                const rect = cardRef.current.getBoundingClientRect();
                triggerFlyToCart(rect.left + rect.width / 2, rect.top + rect.height / 3, product.image);
            }
            addProduct(product, 1);
        }
    };

    return (
        <>
            <div
                ref={cardRef}
                className="group relative flex flex-col bg-[#0c0c0c] border border-white/6 rounded-2xl overflow-hidden hover:border-white/12 transition-colors duration-300 cursor-pointer"
                style={{ opacity: 0, transform: "translateZ(0)" }}
            >
                {/* Image area */}
                <div className="relative bg-[#0f0f0f] overflow-hidden" style={{ paddingTop: "100%" }}>
                    {product.image ? (
                        <img
                            src={product.image}
                            alt={product.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Package className="w-12 h-12 text-white/10" />
                        </div>
                    )}

                    {/* Stock badge */}
                    {isOutOfStock && (
                        <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/80 backdrop-blur-sm border border-white/10 rounded-full text-[9px] font-bold uppercase tracking-widest text-white/50">
                            Agotado
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                    <div>
                        {product.category && (
                            <p className="text-[9px] text-white/30 font-mono uppercase tracking-[0.25em] mb-1">{product.category}</p>
                        )}
                        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2">{product.name}</h3>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/5">
                        <span className={cn("text-base font-bold", isWholesaleMode ? "text-amber-400" : "text-white")}>
                            {(() => {
                                const nonZeroPrices = hasVariants
                                    ? product.variants!.map(v => {
                                        const retail = Number(v.price) || 0;
                                        const wholesale = Number((v as any).wholesalePrice) || 0;
                                        return getDisplayPrice(retail, wholesale || undefined);
                                    }).filter(p => p > 0)
                                    : [];
                                const retailBase = Number(product.promoPrice || product.price) || 0;
                                const base = getDisplayPrice(retailBase, Number((product as any).wholesalePrice) || undefined);
                                const minPrice = nonZeroPrices.length > 0 ? Math.min(...nonZeroPrices) : base;
                                const maxPrice = nonZeroPrices.length > 0 ? Math.max(...nonZeroPrices) : base;
                                if (minPrice === 0) return "Consultar";
                                return maxPrice > minPrice
                                    ? `Desde $${minPrice.toLocaleString()}`
                                    : `$${minPrice.toLocaleString()}`;
                            })()}
                        </span>
                        <button
                            onClick={handleAction}
                            disabled={isOutOfStock && !hasOptions}
                            className={cn(
                                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all duration-150 active:scale-95",
                                isOutOfStock && !hasOptions
                                    ? "bg-white/4 text-white/20 cursor-not-allowed"
                                    : "bg-white text-black hover:bg-white/90"
                            )}
                        >
                            <ShoppingBag className="w-3 h-3" />
                            {hasOptions ? "Ver" : "Agregar"}
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <ProductOptionsModal product={product} onClose={() => setIsModalOpen(false)} />
                )}
            </AnimatePresence>
        </>
    );
}

// ─── SERVICE CARD ─────────────────────────────────────────────────────────────
function ServiceCard({ service }: { service: Service }) {
    return (
        <div className="flex items-start justify-between p-5 bg-[#0c0c0c] border border-white/6 rounded-2xl hover:border-white/12 transition-colors duration-300 group">
            <div className="flex-1 min-w-0 mr-4">
                <h3 className="text-sm font-semibold text-white mb-1 truncate">{service.name}</h3>
                <p className="text-xs text-white/35 leading-relaxed line-clamp-2">{service.description}</p>
                {service.duration && (
                    <p className="text-[10px] text-white/25 font-mono mt-2 uppercase tracking-widest">{service.duration} min</p>
                )}
            </div>
            <div className="text-right flex-shrink-0">
                <p className="text-base font-bold text-white">${service.price.toLocaleString()}</p>
            </div>
        </div>
    );
}

// ─── HERO ────────────────────────────────────────────────────────────────────
function Hero({ shop, onExplore }: { shop: any; onExplore: () => void }) {
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                ".v2-hero-line",
                { y: 60, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.1, stagger: 0.12, ease: "power3.out", delay: 0.1 }
            );
            gsap.fromTo(
                ".v2-hero-sub",
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.9, ease: "power2.out", delay: 0.55 }
            );
            gsap.fromTo(
                ".v2-hero-img",
                { scale: 1.08, opacity: 0 },
                { scale: 1, opacity: 1, duration: 1.4, ease: "power3.out", delay: 0.2 }
            );
        }, heroRef);
        return () => ctx.revert();
    }, []);

    return (
        <section ref={heroRef} className="relative min-h-[88vh] flex items-center overflow-hidden">
            {/* Subtle radial glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-[140px] pointer-events-none" />

            <div className="relative z-10 w-full max-w-screen-xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-16 items-center py-20">

                {/* Text */}
                <div className="space-y-8">
                    <div className="overflow-hidden">
                        <p className="v2-hero-line text-[10px] font-semibold uppercase tracking-[0.4em] text-white/35 mb-6 font-mono">
                            {shop.slogan || "Tecnología de nueva generación"}
                        </p>
                    </div>

                    <div style={{ overflow: "hidden clip" }}>
                        <h1 className="v2-hero-line font-black leading-[0.88] tracking-[-0.04em] text-white"
                            style={{ fontSize: "clamp(2.4rem, 5.5vw, 5.2rem)" }}>
                            {shop.name}
                        </h1>
                    </div>

                    <p className="v2-hero-sub text-white/38 text-[15px] md:text-base leading-[1.7] max-w-md font-light tracking-wide">
                        {shop.description || "Dispositivos de élite. Diseño sin concesiones. La experiencia premium que mereces."}
                    </p>

                    <div className="v2-hero-sub flex items-center gap-4">
                        <button
                            onClick={onExplore}
                            className="flex items-center gap-2 px-7 py-3.5 bg-white text-black rounded-full font-bold text-sm tracking-wide hover:bg-white/90 active:scale-95 transition-all"
                        >
                            Ver Catálogo <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Animated Logo */}
                <div className="relative flex items-center justify-center">
                    <LogoAnimation />
                </div>
            </div>

            {/* Bottom divider */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        </section>
    );
}

// ─── MAIN LAYOUT ──────────────────────────────────────────────────────────────
export function TechPremiumV2Layout({ shop, products, services, loadingData }: TechPremiumV2Props) {
    const { items: cart, setIsCartOpen } = useCart();
    const [view, setView] = useState<View>("products");
    const [activeCategory, setActiveCategory] = useState("todos");
    const [search, setSearch] = useState("");
    const [isQuoteOpen, setIsQuoteOpen] = useState(false);
    const [isFinancingOpen, setIsFinancingOpen] = useState(false);
    const catalogRef = useRef<HTMLElement>(null);
    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

    const categories = useMemo(() => {
        const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
        return ["todos", ...cats];
    }, [products]);

    const filtered = useMemo(() =>
        products.filter(p => {
            const catOk = activeCategory === "todos" || p.category === activeCategory;
            const searchOk = p.name.toLowerCase().includes(search.toLowerCase());
            if (!p.infiniteStock && p.stock !== undefined) {
                const hasVariants = p.variants && p.variants.length > 0;
                const anyVariantInStock = hasVariants ? p.variants!.some(v => (Number(v.stock) || 0) > 0) : false;
                if ((Number(p.stock) || 0) === 0 && (!hasVariants || !anyVariantInStock)) return false;
            }
            return catOk && searchOk;
        }),
        [products, activeCategory, search]
    );

    const scrollToCatalog = useCallback(() => {
        catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    return (
        <div className="min-h-screen" style={{ background: "#060606", color: "#fff" }}>

            {/* ─── NAVBAR ─── */}
            <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/5">
                <div className="max-w-screen-xl mx-auto px-6 md:px-12 h-16 flex items-center justify-between gap-4">

                    {/* Logo / Name */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {shop.logo ? (
                            <img src={shop.logo} alt={shop.name} className="h-7 w-auto object-contain" />
                        ) : (
                            <span className="text-sm font-black uppercase tracking-[-0.04em] text-white">{shop.name}</span>
                        )}
                    </div>

                    {/* Nav — desktop */}
                    <nav className="hidden md:flex items-center gap-1">
                        {(["products", "services", "location"] as View[]).map(v => (
                            <button
                                key={v}
                                onClick={() => { setView(v); scrollToCatalog(); }}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all",
                                    view === v ? "bg-white/8 text-white" : "text-white/35 hover:text-white/70"
                                )}
                            >
                                {v === "products" ? "Productos" : v === "services" ? "Servicios" : "Ubicación"}
                            </button>
                        ))}
                    </nav>

                    {/* Actions + Search + Cart */}
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
                                className="px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest"
                            />
                        )}

                        <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/8 rounded-lg focus-within:border-white/15 transition-colors ml-1">
                            <Search className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Buscar..."
                                className="bg-transparent text-xs text-white placeholder-white/20 outline-none w-20 focus:w-28 transition-all"
                            />
                        </div>

                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="relative flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-xs font-bold hover:bg-white/90 active:scale-95 transition-all ml-1"
                        >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Carrito</span>
                            {totalItems > 0 && (
                                <motion.span
                                    key={totalItems}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                    className="w-4 h-4 bg-black text-white text-[9px] font-black rounded-full flex items-center justify-center"
                                >
                                    {totalItems}
                                </motion.span>
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── HERO ─── */}
            <div className="pt-16">
                <Hero shop={shop} onExplore={scrollToCatalog} />
            </div>

            {/* ─── CATALOG ─── */}
            <main ref={catalogRef} className="max-w-screen-xl mx-auto px-6 md:px-12 py-16 space-y-12">

                {/* Tab + Filter bar */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    {/* View tabs */}
                    <div className="flex items-center bg-white/[0.04] rounded-2xl p-1 border border-white/[0.07]">
                        {(["products", "services", "location"] as View[]).map(v => (
                            <button
                                key={v}
                                onClick={() => setView(v)}
                                className="relative px-5 py-2.5 rounded-xl text-[11px] font-semibold uppercase tracking-[0.12em]"
                            >
                                {/* Sliding pill lives inside the active button — layoutId moves it between buttons */}
                                {view === v && (
                                    <motion.span
                                        layoutId="tab-pill"
                                        transition={{ type: "spring", stiffness: 420, damping: 36, mass: 0.7 }}
                                        className="absolute inset-0 bg-white rounded-xl"
                                        style={{ zIndex: 0 }}
                                    />
                                )}
                                <motion.span
                                    animate={{ color: view === v ? "#000000" : "rgba(255,255,255,0.38)" }}
                                    transition={{ duration: 0.15 }}
                                    className="relative block"
                                    style={{ zIndex: 1 }}
                                >
                                    {v === "products" ? "Productos" : v === "services" ? "Servicios" : "Ubicación"}
                                </motion.span>
                            </button>
                        ))}
                    </div>

                    {/* Mobile search */}
                    <div className="flex sm:hidden items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/8 rounded-lg w-full">
                        <Search className="w-3.5 h-3.5 text-white/30" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar productos..."
                            className="bg-transparent text-xs text-white placeholder-white/25 outline-none flex-1"
                        />
                    </div>
                </div>

                <AnimatePresence mode="wait">

                    {/* ── PRODUCTS ── */}
                    {view === "products" && (
                        <motion.div
                            key="products"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8"
                        >
                            {/* Category pills */}
                            {categories.length > 1 && (
                                <div className="flex gap-2 flex-wrap">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={cn(
                                                "px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.12em] border transition-all duration-200",
                                                activeCategory === cat
                                                    ? "bg-white text-black border-white"
                                                    : "border-white/10 text-white/30 hover:border-white/22 hover:text-white/55"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Count */}
                            <p className="text-[10px] text-white/20 font-mono uppercase tracking-[0.3em]">
                                {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
                            </p>

                            {/* Grid */}
                            {loadingData ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="bg-white/3 rounded-2xl animate-pulse" style={{ paddingTop: "140%" }} />
                                    ))}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="py-24 text-center space-y-3">
                                    <Package className="w-10 h-10 text-white/10 mx-auto" />
                                    <p className="text-white/25 text-sm font-mono uppercase tracking-widest">Sin resultados</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {filtered.map((product, i) => (
                                        <ProductCard key={product.id} product={product} index={i} />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── SERVICES ── */}
                    {view === "services" && (
                        <motion.div
                            key="services"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            <h2 className="text-2xl font-black tracking-tight text-white mb-8">Servicios</h2>
                            {services.length === 0 ? (
                                <div className="py-20 text-center space-y-3">
                                    <p className="text-white/25 text-sm font-mono uppercase tracking-widest">Sin servicios disponibles</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {services.map(s => <ServiceCard key={s.id} service={s} />)}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── LOCATION ── */}
                    {view === "location" && (
                        <motion.div
                            key="location"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-8 max-w-2xl"
                        >
                            <h2 className="text-2xl font-black tracking-tight text-white">Ubicación</h2>
                            <div className="space-y-3">
                                <div className="p-5 bg-[#0c0c0c] border border-white/6 rounded-2xl flex items-start gap-4">
                                    <MapPin className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-1">Dirección</p>
                                        <p className="text-sm text-white">{shop.contact?.address || "Consultar disponibilidad"}</p>
                                    </div>
                                </div>
                                <div className="p-5 bg-[#0c0c0c] border border-white/6 rounded-2xl flex items-start gap-4">
                                    <Globe className="w-4 h-4 text-white/40 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest mb-1">Contacto</p>
                                        <p className="text-sm text-white">{shop.contact?.whatsapp || shop.contact?.phone || "—"}</p>
                                    </div>
                                </div>
                            </div>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.contact?.address || shop.name || "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-white/90 active:scale-95 transition-all"
                            >
                                Abrir en Maps <ArrowUpRight className="w-4 h-4" />
                            </a>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>

            {/* ─── FOOTER ─── */}
            <footer className="border-t border-white/5 py-12 px-6 md:px-12">
                <div className="max-w-screen-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-white/20 text-[11px] font-mono uppercase tracking-[0.3em]">
                        &copy; {new Date().getFullYear()} {shop.name}
                    </p>
                    <p className="text-white/15 text-[10px] font-mono uppercase tracking-widest">Powered by Linko</p>
                </div>
            </footer>

            <style jsx global>{`
                .group:hover .group-hover\\:scale-103 {
                    transform: scale(1.03);
                }
            `}</style>

            {/* Mobile FAB — Cotizar */}
            <button
                type="button"
                onClick={() => setIsQuoteOpen(true)}
                className="sm:hidden fixed bottom-24 right-4 z-40 flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/15 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-xl"
            >
                <MessageSquarePlus className="w-4 h-4" />
                Cotizar
            </button>

            {/* Quote Request Modal */}
            <QuoteRequestModal
                isOpen={isQuoteOpen}
                onClose={() => setIsQuoteOpen(false)}
                shopId={shop.id}
                categories={categories}
            />

            {/* Financing Modal */}
            <FinancingModal
                isOpen={isFinancingOpen}
                onClose={() => setIsFinancingOpen(false)}
                shopId={shop.id}
            />

            {/* Mobile FAB — Financiamiento */}
            <button
                type="button"
                onClick={() => setIsFinancingOpen(true)}
                className="lg:hidden fixed bottom-36 right-4 z-40 flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/15 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-xl"
            >
                <CreditCard className="w-4 h-4" />
                Financiamiento
            </button>

            {/* Live Chat Widget */}
            <LiveChatWidget shopId={shop.id} shopName={shop.name} />
        </div>
    );
}
