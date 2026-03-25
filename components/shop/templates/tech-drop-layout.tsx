"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getThemeConfig } from "@/lib/theme-config";
import {
    Search,
    ShoppingBag,
    MapPin,
    ShieldCheck,
    Zap,
    Cpu,
    Smartphone,
    ChevronRight,
    ArrowRight,
    Plus,
    Minus,
    Trash2,
    Package,
    CheckCircle2,
    Lock,
    Globe
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart, useCursor, CursorProvider } from "@/components/shared";
import type { Product, Service } from "@/lib/constants";
import { Button } from "@/components/ui";
import { ProductOptionsModal } from "@/components/shop/product-card";
import { WholesaleButton } from "@/components/shop";
import { useVisualFeedback } from "@/components/shared";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface TechDropLayoutProps {
    shop: any;
    products: Product[];
    services: Service[];
    loadingData: boolean;
}

type TechView = "products" | "services" | "location";

export function TechDropLayout({ shop, products, services, loadingData }: TechDropLayoutProps) {
    const { items: cart, addProduct: addToCart, removeItem: removeFromCart, updateProductQuantity: updateQuantity, setIsCartOpen } = useCart();
    const [currentView, setCurrentView] = useState<TechView>("products");
    const [activeCategory, setActiveCategory] = useState<string>("todos");
    const [searchQuery, setSearchQuery] = useState("");
    const [showStickyBar, setShowStickyBar] = useState(false);
    const { setType } = useCursor();

    const theme = getThemeConfig(shop.templateType || "tech-drop-v1");

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 600) {
                setShowStickyBar(true);
            } else {
                setShowStickyBar(false);
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    // Ref for GSAP animations
    const pageRef = useRef<HTMLDivElement>(null);
    const cartRef = useRef<HTMLDivElement>(null);

    // Categories
    const productCategories = useMemo(() => {
        const cats = Array.from(new Set(products.map(p => p.category)));
        return ["todos", ...cats];
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = activeCategory === "todos" || p.category === activeCategory;
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            // Hide products with explicit stock=0 (unless infiniteStock)
            if (!p.infiniteStock && p.stock !== undefined) {
                const hasVariants = p.variants && p.variants.length > 0;
                const anyVariantInStock = hasVariants ? p.variants!.some(v => (Number(v.stock) || 0) > 0) : false;
                const isOutOfStock = (Number(p.stock) || 0) === 0 && (!hasVariants || !anyVariantInStock);
                if (isOutOfStock) return false;
            }
            return matchesCategory && matchesSearch;
        });
    }, [products, activeCategory, searchQuery]);

    // Page Transitions with GSAP
    useEffect(() => {
        if (pageRef.current) {
            gsap.fromTo(pageRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
            );
        }

        // GSAP Hero Choreography
        if (currentView === "products") {
            const tl = gsap.timeline();
            tl.from(".hero-slogan", { opacity: 0, x: -30, duration: 0.8, ease: "power3.out" })
                .from(".hero-title", { opacity: 0, y: 50, duration: 1, ease: "power4.out" }, "-=0.4")
                .from(".hero-desc", { opacity: 0, duration: 0.8 }, "-=0.6")
                .from(".hero-card", { scale: 0.8, opacity: 0, duration: 1, ease: "back.out(1.7)" }, "-=0.8");
        }
    }, [currentView]);

    return (
        <CursorProvider>
        <div className={cn("min-h-screen relative text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-400", theme.fontFamily)} style={{ backgroundColor: theme.colors.background }}>
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                {theme.effects.grid && <div className="absolute inset-0 grid-bg opacity-20" />}
                {theme.effects.scanlines && (
                    <div
                        className="absolute inset-0 pointer-events-none z-10"
                        style={{
                            background: 'linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))',
                            backgroundSize: '100% 4px, 6px 100%',
                            opacity: 0.04,
                            mixBlendMode: 'overlay'
                        }}
                    />
                )}
            </div>

            {/* Header / Navbar */}
            <header className="sticky top-0 z-50 transition-all duration-300">
                <div className="backdrop-blur-xl bg-black/60 border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <div
                            className="flex items-center gap-3 group cursor-pointer"
                            onMouseEnter={() => setType("button")}
                            onMouseLeave={() => setType("default")}
                        >
                            <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-2xl group-hover:border-cyan-500/50 group-hover:shadow-cyan-500/20 transition-all duration-500 overflow-hidden">
                                {shop.logo ? (
                                    <img src={shop.logo} alt={shop.name} className="w-full h-full object-contain p-1.5" />
                                ) : (
                                    <Cpu className="text-cyan-400 w-6 h-6" />
                                )}
                            </div>
                            <h1 className="text-xl font-black tracking-tighter text-white uppercase group-hover:text-cyan-400 transition-colors">
                                {shop.name}
                            </h1>
                        </div>

                        {/* Nav Links */}
                        <nav className="hidden md:flex items-center gap-2">
                            {[
                                { id: "products", label: "Equipamiento", icon: <Smartphone className="w-4 h-4" /> },
                                { id: "services", label: "Soporte Técnico", icon: <ShieldCheck className="w-4 h-4" /> },
                                { id: "location", label: "Tiendas Físicas", icon: <MapPin className="w-4 h-4" /> },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentView(item.id as TechView)}
                                    onMouseEnter={() => setType("button")}
                                    onMouseLeave={() => setType("default")}
                                    className={cn(
                                        "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                                        currentView === item.id
                                            ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        {shop.wholesaleEnabled && (
                            <WholesaleButton
                                shopId={shop.id}
                                className="px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest"
                            />
                        )}
                        <CartButton cart={cart} onOpen={() => setIsCartOpen(true)} />
                    </div>
                </div>
            </header>

            {/* Sticky Checkout Bar */}
            <AnimatePresence>
                {showStickyBar && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-black/80 backdrop-blur-2xl border-t border-white/10 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                                <ShoppingBag className="text-cyan-400 w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Resumen de Compra</div>
                                <div className="text-white font-black text-sm uppercase tracking-tight">
                                    {cart.length} Productos // Total: ${cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="bg-white text-black px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest hover:bg-cyan-400 transition-all active:scale-95"
                        >
                            Ver Carrito
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="relative z-10 p-6 md:p-12 lg:p-20 max-w-screen-2xl mx-auto">
                <div ref={pageRef} className="opacity-0">
                    {currentView === "products" && (
                        <div className="space-y-16">
                            {/* Hero Section */}
                            <section className={cn(
                                "relative rounded-[40px] overflow-hidden border border-white/5 min-h-[500px] flex items-center",
                                shop.templateType === "tech-3d-v1" ? "perspective-3d" : ""
                            )}>
                                {shop.templateType === "tech-3d-v1" && shop.heroProductImage && (
                                    <div className="absolute right-[-10%] top-1/2 -translate-y-1/2 w-1/2 h-full z-20 pointer-events-none preserve-3d">
                                        <motion.img
                                            initial={{ x: 100, opacity: 0, rotateY: -30 }}
                                            animate={{ x: 0, opacity: 1, rotateY: 0 }}
                                            transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
                                            src={shop.heroProductImage}
                                            alt="Featured Product"
                                            className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                                        />
                                    </div>
                                )}

                                {shop.banner ? (
                                    <>
                                        <div className="absolute inset-0 z-0">
                                            <img src={shop.banner} alt="Banner" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                                            <div className="absolute inset-0 bg-[#05070a]/40 backdrop-blur-[2px]" />
                                            <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
                                            <div className="absolute inset-0 grid-bg opacity-30" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/40 to-black z-0" />
                                )}

                                <div className="relative z-10 px-8 py-16 md:px-16 max-w-3xl">
                                    <span
                                        className="hero-slogan inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black tracking-[0.3em] uppercase mb-6"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                        {shop.slogan || "Próxima Generación de Tecnología"}
                                    </span>

                                    <h2
                                        className="hero-title text-5xl md:text-7xl font-black text-white leading-[0.9] mb-8 uppercase tracking-tighter"
                                    >
                                        Descubre el Futuro de la <span className="text-cyan-400 italic">Innovación</span>
                                    </h2>

                                    <p
                                        className="hero-desc text-slate-400 text-lg md:text-xl leading-relaxed max-w-xl font-medium"
                                    >
                                        {shop.description || "Experiencia premium en hardware, software y seguridad. Solo productos certificados con la máxima confianza del mercado."}
                                    </p>
                                </div>

                                {/* Floating Tech Element */}
                                <div className="hero-card hidden lg:block absolute right-20 top-1/2 -translate-y-1/2">
                                    <div className="w-64 h-64 rounded-[60px] border border-white/10 bg-white/5 backdrop-blur-3xl p-8 flex flex-col justify-between animate-float">
                                        <div className="flex justify-between items-start">
                                            <Cpu className="w-8 h-8 text-cyan-500" />
                                            <div className="text-right">
                                                <div className="text-[10px] text-slate-500 font-mono">STATUS</div>
                                                <div className="text-xs text-cyan-400 font-black">ONLINE</div>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-slate-500 font-mono mb-1 uppercase tracking-widest">System Core</div>
                                            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: "80%" }}
                                                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                                                    className="h-full bg-cyan-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Enhanced Category Carousel */}
                            <CategoryCarousel
                                categories={productCategories}
                                activeCategory={activeCategory}
                                onSelect={setActiveCategory}
                            />

                            {/* Product Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                <AnimatePresence mode="popLayout">
                                    {filteredProducts.map((product, index) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            index={index}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {currentView === "services" && (
                        <div className="space-y-12">
                            <section className="text-center py-10">
                                <h2 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase italic tracking-tighter">
                                    Servicio Técnico Especializado
                                </h2>
                                <div className="flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-500 tracking-widest uppercase mb-12">
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                                        <ShieldCheck className="w-4 h-4 text-cyan-400" /> Confianza Total
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                                        <Zap className="w-4 h-4 text-yellow-400" /> Rapidez Extrema
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                                        <CheckCircle2 className="w-4 h-4 text-green-400" /> Garantía Real
                                    </div>
                                </div>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {services.map((service) => (
                                    <ServiceCard key={service.id} service={service} />
                                ))}
                            </div>
                        </div>
                    )}

                    {currentView === "location" && <LocationView shop={shop} />}
                </div>

                {/* Tech Trust Section */}
                <section className="mt-32 pt-32 border-t border-white/5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
                        <div className="space-y-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-500">
                                <ShieldCheck className="text-cyan-400 w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Seguridad Avanzada</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Protección de datos de grado militar y transacciones 100% encriptadas para su absoluta tranquilidad.
                            </p>
                        </div>

                        <div className="space-y-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-500">
                                <Lock className="text-blue-400 w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Confianza Garantizada</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Cada producto pasa por un riguroso proceso de certificación antes de llegar a sus manos.
                            </p>
                        </div>

                        <div className="space-y-4 group">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500">
                                <Zap className="text-indigo-400 w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Calidad de Élite</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Hardware de última generación seleccionado por expertos para ofrecer el máximo rendimiento.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Request Quote Section */}
            {shop.requestQuoteEnabled && (
                <section className="py-24 px-6 md:px-12 bg-zinc-950 relative overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 blur-[100px] rounded-full pointer-events-none" />
                    <div className="max-w-4xl mx-auto backdrop-blur-md bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-16 relative z-10">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <span className="text-cyan-400 text-[10px] font-black tracking-widest uppercase mb-4 block">Personalización Elite</span>
                                <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6 leading-none">
                                    ¿No ves lo que <br /> <span className="text-cyan-400 italic">buscas</span>?
                                </h2>
                                <p className="text-slate-400 text-lg leading-relaxed mb-8">
                                    Dinos qué modelo o accesorio necesitas y te lo conseguiremos al mejor precio del mercado. Respuesta garantizada en minutos.
                                </p>
                                <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
                                    <span className="flex items-center gap-2 italic">
                                        <Zap className="w-3 h-3 text-cyan-400" /> Concierge Tech 24/7
                                    </span>
                                </div>
                            </div>
                            <form className="space-y-4" onSubmit={(e) => {
                                e.preventDefault();
                                (e.target as HTMLFormElement).reset();
                                alert("Solicitud recibida. Un asesor técnico te contactará en breve con la mejor cotización.");
                            }}>
                                <div className="grid grid-cols-1 gap-4">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Nombre completo"
                                        className="bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="tel"
                                            required
                                            placeholder="WhatsApp / Tel"
                                            className="bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
                                        />
                                        <input
                                            type="email"
                                            required
                                            placeholder="Email"
                                            className="bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-cyan-500/50 outline-none transition-all"
                                        />
                                    </div>
                                    <textarea
                                        required
                                        rows={4}
                                        placeholder="Dinos exactamente qué necesitas..."
                                        className="bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-cyan-500/50 outline-none transition-all resize-none"
                                    />
                                    <button
                                        type="submit"
                                        className="w-full py-5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                                    >
                                        Enviar Petición <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            )}

            <Footer shop={shop} />

            <style jsx global>{`
        .text-gradient {
          background: linear-gradient(to right, #ffffff, #94a3b8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .grid-bg {
          background-image: linear-gradient(to right, #1e293b 1px, transparent 1px),
                            linear-gradient(to bottom, #1e293b 1px, transparent 1px);
          background-size: 40px 40px;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
        </div>
        </CursorProvider>
    );
}

// --- SUBCOMPONENTS ---

function CategoryCarousel({ categories, activeCategory, onSelect }: { categories: string[], activeCategory: string, onSelect: (c: string) => void }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Reveal animation for items with GSAP
        if (containerRef.current) {
            gsap.fromTo('.category-item',
                { scale: 0.9, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.8, stagger: 0.1, ease: "back.out(1.7)" }
            );
        }
    }, [categories]); // Added categories to dependency array for re-trigger if categories change

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                    <Zap className="w-5 h-5 text-cyan-400" /> Categorías Disponibles
                </h3>
                <span className="text-slate-500 text-sm font-mono tracking-tighter">01 // BROWSE DISCOVER</span>
            </div>

            <div
                ref={containerRef}
                className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide no-scrollbar -mx-4 px-4 mask-fade items-center h-32"
            >
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => onSelect(cat)}
                        className={cn(
                            "category-item relative flex-shrink-0 px-8 py-5 rounded-2xl transition-all duration-300 overflow-hidden group min-w-[150px] text-center",
                            activeCategory === cat
                                ? "text-white scale-110 z-20"
                                : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-cyan-500/30 hover:scale-105"
                        )}
                    >
                        {/* Animated BG on Active */}
                        {activeCategory === cat && (
                            <motion.div
                                layoutId="active-category-bg"
                                transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                                className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[0_0_30px_rgba(6,182,212,0.5)] border-t-2 border-cyan-300 -z-10"
                            />
                        )}

                        <span className={cn(
                            "text-[10px] uppercase font-black tracking-widest block mb-1",
                            activeCategory === cat ? "text-cyan-100/60" : "text-slate-500"
                        )}>
                            #0{categories.indexOf(cat) + 1}
                        </span>
                        <span className="text-sm font-bold uppercase tracking-tight">{cat}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function ProductCard({ product, index }: { product: Product, index: number }) {
    const { addProduct } = useCart();
    const { triggerFlyToCart } = useVisualFeedback();
    const [isHovered, setIsHovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const hasVariants = product.variants && product.variants.length > 0;
    const hasExtras = product.extras && product.extras.length > 0;
    const hasOptions = hasVariants || hasExtras;

    const { setType } = useCursor();

    // Stock check for visual label
    const isOutOfStock = !product.infiniteStock && (Number(product.stock) || 0) <= 0 && (!hasVariants || !product.variants!.some(v => (Number(v.stock) || 0) > 0));

    useEffect(() => {
        if (cardRef.current) {
            // Floating Idle Animation with GSAP
            gsap.to(cardRef.current, {
                y: -10,
                rotation: 1,
                duration: 2 + Math.random(),
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }
    }, []);

    const handleAction = () => {
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
        <motion.div
            layout
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                transition: {
                    type: "spring",
                    damping: 20,
                    stiffness: 260,
                    mass: 0.8,
                    delay: (index % 8) * 0.04 
                }
            }}
            exit={{
                opacity: 0,
                scale: 0.95,
                transition: { duration: 0.15 }
            }}
            transition={{
                layout: {
                    type: "spring",
                    damping: 20,
                    stiffness: 260,
                    mass: 0.8
                }
            }}
            ref={cardRef}
            onMouseEnter={() => {
                setIsHovered(true);
                setType("product");
            }}
            onMouseLeave={() => {
                setIsHovered(false);
                setType("default");
            }}
            className="group relative h-[480px] rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-all duration-500"
        >
            {/* Product Image Wrapper */}
            <div className="h-2/3 relative overflow-hidden bg-black/40">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 opacity-80 group-hover:opacity-100"
                />

                {/* Premium Glass Reflection Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none overflow-hidden">
                    <motion.div 
                        initial={{ x: "-100%", skewX: -20 }}
                        animate={isHovered ? { x: "200%" } : { x: "-100%" }}
                        transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 3 }}
                        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent h-full"
                    />
                </div>

                {/* Overlay Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                    {product.infiniteStock ? (
                        <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 backdrop-blur-md">
                            <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                            Disponible
                        </span>
                    ) : !isOutOfStock ? (
                        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 backdrop-blur-md">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                            Stock Disponible
                        </span>
                    ) : (
                        <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 backdrop-blur-md">
                            Agotado
                        </span>
                    )}
                </div>

                {/* Spec Highlight Overlay (Premium Tech Feel) */}
                <div className="absolute inset-0 z-10 pointer-events-none p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]" />
                            <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest">PREMIUM BUILD</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]" />
                            <span className="text-[8px] font-mono text-cyan-400 uppercase tracking-widest">CERTIFIED HW</span>
                        </div>
                    </div>
                </div>

                {/* Ambient Glow on Hover */}
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-cyan-500/5 pointer-events-none"
                    />
                )}
            </div>

            {/* Content */}
            <div className="p-6 h-1/3 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-black text-white uppercase tracking-tighter group-hover:text-cyan-400 transition-colors">
                            {product.name}
                        </h4>
                        <div className="flex flex-col items-end">
                            {(() => {
                                const hv = product.variants && product.variants.length > 0;
                                const nonZeroPrices = hv
                                    ? product.variants!.map(v => Number(v.price) || 0).filter(p => p > 0)
                                    : [];
                                const base = Number(product.promoPrice || product.price) || 0;
                                const minPrice = nonZeroPrices.length > 0 ? Math.min(...nonZeroPrices) : base;
                                const maxPrice = nonZeroPrices.length > 0 ? Math.max(...nonZeroPrices) : base;
                                const label = minPrice === 0
                                    ? "Consultar"
                                    : maxPrice > minPrice
                                        ? `Desde $${minPrice.toLocaleString()}`
                                        : `$${minPrice.toLocaleString()}`;
                                return (
                                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                                        {label}
                                    </span>
                                );
                            })()}
                            {/* Pricing Pulse for Tech Theme */}
                            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping opacity-75 mt-1" />
                        </div>
                    </div>
                    <p className="text-slate-500 text-xs line-clamp-1 mb-4">
                        {product.description}
                    </p>
                </div>

                <button
                    onClick={handleAction}
                    disabled={isOutOfStock && !hasOptions}
                    className={cn(
                        "w-full py-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group/btn",
                        isOutOfStock && !hasOptions
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                            : "bg-white text-black hover:bg-cyan-400"
                    )}
                >
                    <ShoppingBag className="w-4 h-4" />
                    {hasOptions ? "Opciones" : "Agregar al Carrito"}
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <ProductOptionsModal
                        product={product}
                        onClose={() => setIsModalOpen(false)}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function ServiceCard({ service }: { service: Service }) {
    const { setType } = useCursor();
    return (
        <div
            className="relative p-8 rounded-[40px] bg-white/5 border border-white/10 overflow-hidden group hover:bg-white/10 transition-all duration-500"
            onMouseEnter={() => setType("button")}
            onMouseLeave={() => setType("default")}
        >
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-700">
                <Zap className="w-32 h-32" />
            </div>

            <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <div className="text-cyan-400 font-bold text-2xl">
                    {service.name.charAt(0).toUpperCase()}
                </div>
            </div>

            <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-2">
                {service.name}
            </h4>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                {service.description}
            </p>

            <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-auto">
                <div>
                    <span className="text-xs text-slate-500 uppercase font-black tracking-widest">Duración</span>
                    <p className="text-sm font-bold text-white">{service.duration} MIN</p>
                </div>
                <div className="text-right">
                    <span className="text-xs text-slate-500 uppercase font-black tracking-widest">Inversión</span>
                    <p className="text-xl font-black text-cyan-400">${service.price.toLocaleString()}</p>
                </div>
            </div>
        </div>
    );
}

function LocationView({ shop }: { shop: any }) {
    return (
        <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 order-2 lg:order-1">
                <section>
                    <h2 className="text-4xl md:text-7xl font-black text-white mb-6 uppercase tracking-tighter">
                        Donde la Magia <br /> <span className="text-cyan-400 italic">Sucede</span>.
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                        Visita nuestros laboratorios físicos para asesoría personalizada, diagnóstico técnico profundo y retiro de productos premium.
                    </p>
                </section>

                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                        <h5 className="text-white font-bold mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-cyan-400" /> Dirección
                        </h5>
                        <p className="text-slate-400 text-sm">{shop.contact?.address || "Consultar disponibilidad"}</p>
                        <p className="text-cyan-400 text-sm mt-1">{shop.contact?.city || ""}</p>
                    </div>
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 tracking-widest font-mono">
                        <h5 className="text-white font-bold mb-2 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-cyan-400" /> Contacto
                        </h5>
                        <p className="text-slate-400 text-sm uppercase">{shop.contact?.whatsapp || shop.contact?.phone}</p>
                        <p className="text-slate-500 text-xs mt-1 lowercase">{shop.contact?.email}</p>
                    </div>
                </div>

                <MagneticButton>
                    <button className="flex items-center gap-4 bg-white text-black px-8 py-5 rounded-full font-black uppercase text-sm tracking-widest hover:bg-cyan-400 transition-all duration-300">
                        Obtener Indicaciones <ArrowRight className="w-5 h-5" />
                    </button>
                </MagneticButton>
            </div>

            <div className="order-1 lg:order-2">
                <div className="relative aspect-square rounded-[60px] overflow-hidden border border-white/10 shadow-2xl shadow-cyan-500/10 float-anim">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/40 to-transparent z-10" />
                    <img
                        src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80"
                        alt="Office Location"
                        className="w-full h-full object-cover"
                    />
                    {/* Decorative Map Pins */}
                    <div className="absolute top-1/3 left-1/2 w-12 h-12 bg-white rounded-2xl flex items-center justify-center rotate-12 animate-pulse z-20 shadow-xl shadow-black">
                        <MapPin className="text-cyan-500 w-6 h-6" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function CartButton({ cart, onOpen }: { cart: any[]; onOpen: () => void }) {
    const [totalItems, setTotalItems] = useState(0);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const iconRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const newTotal = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (newTotal > totalItems && buttonRef.current) {
            // GSAP Pulse animation when adding items
            gsap.to(buttonRef.current, {
                scale: 1.1,
                duration: 0.2,
                yoyo: true,
                repeat: 1,
                ease: "power2.out"
            });

            if (iconRef.current) {
                gsap.to(iconRef.current, {
                    rotation: 360,
                    duration: 0.5,
                    ease: "power2.inOut"
                });
            }
        }
        setTotalItems(newTotal);
    }, [cart, totalItems]);

    return (
        <button
            ref={buttonRef}
            onClick={onOpen}
            className="relative px-6 py-2.5 rounded-full bg-cyan-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 active:scale-95 overflow-hidden group"
        >
            <div ref={iconRef} className="relative z-10">
                <ShoppingBag className="w-4 h-4" />
            </div>
            <span className="relative z-10">Carrito</span>
            {totalItems > 0 && (
                <span className="relative z-10 w-5 h-5 rounded-full bg-white text-cyan-600 flex items-center justify-center text-[10px] font-black ml-1">
                    {totalItems}
                </span>
            )}

            {/* Interactive Glitch Effect on Hover */}
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 mt-[-100%]" />
        </button>
    );
}

function Footer({ shop }: { shop: any }) {
    return (
        <footer className="border-t border-white/5 py-20 px-6 md:px-12 bg-black/40">
            <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between gap-12">
                <div className="max-w-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
                            <Cpu className="text-white w-5 h-5" />
                        </div>
                        <span className="text-xl font-black uppercase text-white tracking-widest">{shop.name}</span>
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed mb-8">
                        Empoderando el presente con la tecnología del futuro. Su satisfacción y seguridad son nuestra prioridad absoluta.
                    </p>
                    <div className="flex gap-4">
                        {['IG', 'FB', 'TW'].map(social => (
                            <div key={social} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black text-slate-400 hover:text-white hover:border-cyan-500/40 cursor-pointer transition-all">
                                {social}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-12">
                    <div>
                        <h5 className="text-white font-black text-xs uppercase tracking-widest mb-6 border-l-2 border-cyan-500 pl-4">Compañía</h5>
                        <ul className="space-y-4 text-sm text-slate-500">
                            <li className="hover:text-cyan-400 cursor-pointer transition-colors">Nosotros</li>
                            <li className="hover:text-cyan-400 cursor-pointer transition-colors">Servicios</li>
                            <li className="hover:text-cyan-400 cursor-pointer transition-colors">Contacto</li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="text-white font-black text-xs uppercase tracking-widest mb-6 border-l-2 border-cyan-500 pl-4">Soporte</h5>
                        <ul className="space-y-4 text-sm text-slate-500">
                            <li className="hover:text-cyan-400 cursor-pointer transition-colors">Ayuda</li>
                            <li className="hover:text-cyan-400 cursor-pointer transition-colors">Garantía</li>
                            <li className="hover:text-cyan-400 cursor-pointer transition-colors">Reparaciones</li>
                        </ul>
                    </div>
                    <div className="hidden lg:block">
                        <h5 className="text-white font-black text-xs uppercase tracking-widest mb-6 border-l-2 border-cyan-500 pl-4">Legal</h5>
                        <ul className="space-y-4 text-sm text-slate-500">
                            <li className="hover:text-cyan-400 cursor-pointer transition-colors">Términos</li>
                            <li className="hover:text-cyan-400 cursor-pointer transition-colors">Privacidad</li>
                            <li className="hover:text-cyan-400 cursor-pointer transition-colors">Cookies</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="max-w-screen-2xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <p className="text-slate-600 text-xs font-mono">
                    &copy; {new Date().getFullYear()} {shop.name} // BUILT ON LINKO PLATFORM
                </p>
                <div className="flex items-center gap-6 text-slate-600 text-xs font-mono tracking-widest uppercase">
                    <span className="flex items-center gap-2">
                        <ShieldCheck className="w-3 h-3" /> Secure Payment
                    </span>
                    <span className="flex items-center gap-2">
                        <Globe className="w-3 h-3" /> Global Shipping
                    </span>
                </div>
            </div>
        </footer>
    );
}

function MagneticButton({ children }: { children: React.ReactElement }) {
    const ref = useRef<HTMLDivElement>(null);
    const { setType } = useCursor();

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const { left, top, width, height } = element.getBoundingClientRect();
            const centerX = left + width / 2;
            const centerY = top + height / 2;
            const deltaX = clientX - centerX;
            const deltaY = clientY - centerY;

            gsap.to(element, {
                x: deltaX * 0.2,
                y: deltaY * 0.2,
                duration: 0.3,
                ease: "power2.out"
            });
        };

        const handleMouseLeave = () => {
            gsap.to(element, {
                x: 0,
                y: 0,
                duration: 0.5,
                ease: "elastic.out(1, 0.3)"
            });
            setType("default");
        };

        element.addEventListener("mousemove", handleMouseMove);
        element.addEventListener("mouseleave", handleMouseLeave);
        element.addEventListener("mouseenter", () => setType("button"));

        return () => {
            element.removeEventListener("mousemove", handleMouseMove);
            element.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [setType]);

    return (
        <div ref={ref} className="inline-block transition-transform duration-200">
            {children}
        </div>
    );
}
