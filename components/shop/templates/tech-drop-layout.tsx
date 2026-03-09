"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import anime from "animejs";
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
import { useCart } from "@/components/shared";
import type { Product, Service } from "@/lib/constants";
import { Button } from "@/components/ui";

interface TechDropLayoutProps {
    shop: any;
    products: Product[];
    services: Service[];
    loadingData: boolean;
}

type TechView = "products" | "services" | "location";

export function TechDropLayout({ shop, products, services, loadingData }: TechDropLayoutProps) {
    const { cart, addToCart, removeFromCart, updateQuantity } = useCart();
    const [currentView, setCurrentView] = useState<TechView>("products");
    const [activeCategory, setActiveCategory] = useState<string>("todos");
    const [searchQuery, setSearchQuery] = useState("");

    // Ref for anime.js animations
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
            return matchesCategory && matchesSearch;
        });
    }, [products, activeCategory, searchQuery]);

    // Page Transitions with Anime.js
    useEffect(() => {
        if (pageRef.current) {
            anime({
                targets: pageRef.current,
                opacity: [0, 1],
                translateY: [20, 0],
                easing: 'easeOutExpo',
                duration: 800
            });
        }
    }, [currentView]);

    return (
        <div className="min-h-screen bg-[#05070a] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-400">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
                <div className="absolute inset-0 grid-bg opacity-20" />
            </div>

            {/* Header / Navbar */}
            <header className="sticky top-0 z-50 transition-all duration-300">
                <div className="backdrop-blur-xl bg-black/40 border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-2 group cursor-pointer">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform duration-300">
                                {shop.logo ? (
                                    <img src={shop.logo} alt={shop.name} className="w-6 h-6 object-contain" />
                                ) : (
                                    <Cpu className="text-white w-6 h-6" />
                                )}
                            </div>
                            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 uppercase">
                                {shop.name}
                            </h1>
                        </div>

                        {/* Nav Links */}
                        <nav className="hidden md:flex items-center gap-1">
                            {[
                                { id: "products", label: "Equipamiento", icon: <Smartphone className="w-4 h-4" /> },
                                { id: "services", label: "Soporte Técnico", icon: <ShieldCheck className="w-4 h-4" /> },
                                { id: "location", label: "Tiendas Físicas", icon: <MapPin className="w-4 h-4" /> },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentView(item.id as TechView)}
                                    className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
                                        currentView === item.id
                                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
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
                        <button className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 hover:border-cyan-500/30 text-white transition-all duration-300 group">
                            <Search className="w-5 h-5 group-hover:text-cyan-400" />
                        </button>
                        <CartButton cart={cart} />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 p-6 md:p-12 lg:p-20 max-w-screen-2xl mx-auto">
                <div ref={pageRef} className="opacity-0">
                    {currentView === "products" && (
                        <div className="space-y-12">
                            <section className="text-center md:text-left max-w-3xl">
                                <span className="text-cyan-400 text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2 mb-4">
                                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                    Próxima Generación de Tecnología
                                </span>
                                <h2 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
                                    Descubre el Futuro de la <span className="text-gradient decoration-cyan-500/40">Innovación</span>
                                </h2>
                                <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
                                    Experiencia premium en hardware, software y seguridad. Solo productos certificados con la máxima confianza del mercado.
                                </p>
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
                                    {filteredProducts.map((product) => (
                                        <ProductCard key={product.id} product={product} onAdd={() => addToCart(product as any)} />
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
    );
}

// --- SUBCOMPONENTS ---

function CategoryCarousel({ categories, activeCategory, onSelect }: { categories: string[], activeCategory: string, onSelect: (c: string) => void }) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Reveal animation for items
        anime({
            targets: '.category-item',
            opacity: [0, 1],
            scale: [0.8, 1],
            delay: anime.stagger(50),
            easing: 'easeOutBack',
            duration: 600
        });
    }, []);

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
                            "category-item relative flex-shrink-0 px-8 py-5 rounded-2xl transition-all duration-700 overflow-hidden group min-w-[150px] text-center",
                            activeCategory === cat
                                ? "bg-cyan-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.5)] scale-110 z-20 border-t-2 border-cyan-300"
                                : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-cyan-500/30 hover:scale-105"
                        )}
                    >
                        {/* Animated BG on Active */}
                        {activeCategory === cat && (
                            <motion.div
                                layoutId="active-bg"
                                className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 -z-10"
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

function ProductCard({ product, onAdd }: { product: Product, onAdd: () => void }) {
    const [isHovered, setIsHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleAddToCart = () => {
        // Anime.js interaction animation
        if (cardRef.current) {
            anime({
                targets: cardRef.current,
                scale: [1, 0.95, 1.02, 1],
                duration: 400,
                easing: 'easeInOutQuad'
            });
        }
        onAdd();
    };

    return (
        <motion.div
            layout
            ref={cardRef}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative h-[480px] rounded-3xl overflow-hidden bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-all duration-500"
        >
            {/* Product Image Wrapper */}
            <div className="h-2/3 relative overflow-hidden bg-black/40">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0"
                />

                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,255,255,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%]" />
                </div>

                {/* Overlay Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                    {product.stock > 0 ? (
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

                {/* Zoomed Featured View on Hover (Premium Tech Feel) */}
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-cyan-600/10 pointer-events-none mix-blend-screen"
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
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                            ${product.price.toLocaleString()}
                        </span>
                    </div>
                    <p className="text-slate-500 text-xs line-clamp-1 mb-4">
                        {product.description}
                    </p>
                </div>

                <button
                    onClick={handleAddToCart}
                    className="w-full py-4 rounded-xl bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-cyan-400 transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                >
                    <ShoppingBag className="w-4 h-4" />
                    Agregar al Carrito
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </button>
            </div>
        </motion.div>
    );
}

function ServiceCard({ service }: { service: Service }) {
    return (
        <div className="relative p-8 rounded-[40px] bg-white/5 border border-white/10 overflow-hidden group hover:bg-white/10 transition-all duration-500">
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

                <button className="flex items-center gap-4 bg-white text-black px-8 py-5 rounded-full font-black uppercase text-sm tracking-widest hover:bg-cyan-400 transition-all duration-300">
                    Obtener Indicaciones <ArrowRight className="w-5 h-5" />
                </button>
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

function CartButton({ cart }: { cart: any[] }) {
    const [totalItems, setTotalItems] = useState(0);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const iconRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const newTotal = cart.reduce((sum, item) => sum + item.quantity, 0);
        if (newTotal > totalItems && buttonRef.current) {
            // Morph/Pulse animation when adding items
            anime({
                targets: buttonRef.current,
                scale: [1, 1.1, 1],
                backgroundColor: ['#06b6d4', '#0891b2', '#06b6d4'],
                duration: 400,
                easing: 'easeOutElastic(1, .5)'
            });

            if (iconRef.current) {
                anime({
                    targets: iconRef.current,
                    rotate: '1turn',
                    duration: 600,
                    easing: 'easeInOutBack'
                });
            }
        }
        setTotalItems(newTotal);
    }, [cart, totalItems]);

    return (
        <button
            ref={buttonRef}
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
