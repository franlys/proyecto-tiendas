"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
    ShoppingBag,
    ShieldCheck,
    Zap,
    Cpu,
    Smartphone,
    ChevronRight,
    ArrowRight,
    Package,
    Globe,
    Search,
    MapPin,
    Star,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/shared";
import type { Product, Service } from "@/lib/constants";
import { ProductOptionsModal } from "@/components/shop/product-card";
import { useVisualFeedback } from "@/components/shared";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
}

interface Tech3DLayoutProps {
    shop: any;
    products: Product[];
    services: Service[];
    loadingData: boolean;
}

type View = "products" | "services" | "location";

// ─── WARP PORTAL CANVAS (Digital Warp Portal) ───────────────────────────────
function WarpPortalCanvas({ active }: { active: boolean }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animFrameRef = useRef<number>(0);
    const timeRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        const draw = () => {
            if (!active) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                animFrameRef.current = requestAnimationFrame(draw);
                return;
            }

            timeRef.current += 0.015;
            const t = timeRef.current;
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Portal rings - simulating the warp distortion effect
            const rings = 12;
            for (let i = rings; i > 0; i--) {
                const progress = i / rings;
                const radius = progress * Math.min(canvas.width, canvas.height) * 0.48;
                const warp = Math.sin(t * 2 + progress * Math.PI * 2) * 8;
                const alpha = (1 - progress) * 0.6 + 0.05;

                // Hue shift for portal color sweep
                const hue = (t * 40 + progress * 200) % 360;
                ctx.beginPath();

                // Distorted circle (warp effect)
                for (let a = 0; a <= Math.PI * 2; a += 0.05) {
                    const distort = Math.sin(a * 6 + t * 3) * warp * (1 - progress);
                    const r = radius + distort;
                    const x = cx + Math.cos(a) * r;
                    const y = cy + Math.sin(a) * r;
                    if (a === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.strokeStyle = `hsla(${hue}, 90%, 65%, ${alpha})`;
                ctx.lineWidth = 1.5 * (1 - progress * 0.5);
                ctx.stroke();
            }

            // Central portal glow
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
            grd.addColorStop(0, `hsla(${(t * 50) % 360}, 100%, 80%, 0.35)`);
            grd.addColorStop(0.5, `hsla(${(t * 50 + 120) % 360}, 80%, 50%, 0.15)`);
            grd.addColorStop(1, "transparent");
            ctx.beginPath();
            ctx.arc(cx, cy, 80, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();

            // Scan line sweep
            const scanAngle = t * 1.5;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(scanAngle);
            const scanGrd = ctx.createLinearGradient(0, 0, Math.min(canvas.width, canvas.height) * 0.48, 0);
            scanGrd.addColorStop(0, `hsla(${(t * 60) % 360}, 100%, 70%, 0.0)`);
            scanGrd.addColorStop(0.6, `hsla(${(t * 60) % 360}, 100%, 70%, 0.3)`);
            scanGrd.addColorStop(1, "transparent");
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, Math.min(canvas.width, canvas.height) * 0.48, -0.04, 0.04);
            ctx.closePath();
            ctx.fillStyle = scanGrd;
            ctx.fill();
            ctx.restore();

            animFrameRef.current = requestAnimationFrame(draw);
        };

        animFrameRef.current = requestAnimationFrame(draw);
        return () => {
            cancelAnimationFrame(animFrameRef.current);
            window.removeEventListener("resize", resize);
        };
    }, [active]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: active ? 1 : 0, transition: "opacity 0.8s ease" }}
        />
    );
}

// ─── LIQUID METAL BLOB (Liquid Metal Morph) ──────────────────────────────────
function LiquidMetalBlob({ color = "#06b6d4" }: { color?: string }) {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="absolute w-full h-full" style={{ filter: "url(#liquid-filter)" }}>
                <defs>
                    <filter id="liquid-filter">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.012"
                            numOctaves="4"
                            seed="2"
                        >
                            <animate attributeName="baseFrequency" values="0.012;0.018;0.012" dur="8s" repeatCount="indefinite" />
                            <animate attributeName="seed" values="2;5;8;5;2" dur="12s" repeatCount="indefinite" />
                        </feTurbulence>
                        <feDisplacementMap in="SourceGraphic" scale="18" xChannelSelector="R" yChannelSelector="G">
                            <animate attributeName="scale" values="18;28;18" dur="6s" repeatCount="indefinite" />
                        </feDisplacementMap>
                    </filter>
                    <radialGradient id="metal-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.95" />
                        <stop offset="40%" stopColor={color} stopOpacity="0.85" />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.6" />
                    </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="78" fill="url(#metal-grad)" />
                {/* Highlight streaks */}
                <ellipse cx="80" cy="75" rx="22" ry="10" fill="white" opacity="0.35" transform="rotate(-30 80 75)">
                    <animate attributeName="opacity" values="0.35;0.55;0.35" dur="4s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="115" cy="130" rx="12" ry="5" fill="white" opacity="0.2" transform="rotate(20 115 130)">
                    <animate attributeName="opacity" values="0.2;0.4;0.2" dur="5s" repeatCount="indefinite" />
                </ellipse>
            </svg>
        </div>
    );
}

// ─── SCREEN BREAKOUT HERO (Screen Breakout Animation) ────────────────────────
function ScreenBreakoutHero({ shop }: { shop: any }) {
    const phoneRef = useRef<HTMLDivElement>(null);
    const screenRef = useRef<HTMLDivElement>(null);
    const shatterRef = useRef<HTMLDivElement>(null);
    const [portalActive, setPortalActive] = useState(false);
    const [breakoutDone, setBreakoutDone] = useState(false);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
    const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });
    const rotateX = useTransform(springY, [-200, 200], [12, -12]);
    const rotateY = useTransform(springX, [-200, 200], [-12, 12]);

    useEffect(() => {
        if (!phoneRef.current || !screenRef.current) return;

        const tl = gsap.timeline({ delay: 0.4 });

        // Phase 1: Screen is flat, phone inside
        tl.set(phoneRef.current, { z: -180, scale: 0.55, opacity: 0.3, rotationX: 8 })
            .set(screenRef.current, { opacity: 1 })

            // Phase 2: Portal activates
            .add(() => setPortalActive(true))

            // Phase 3: Phone pushes toward viewer (breakout)
            .to(phoneRef.current, {
                z: 0,
                scale: 1,
                opacity: 1,
                rotationX: 0,
                duration: 1.6,
                ease: "power3.out",
            }, "+=0.3")

            // Phase 4: Phone floats past the screen plane (z > 0)
            .to(phoneRef.current, {
                z: 60,
                y: -16,
                duration: 0.9,
                ease: "power2.out",
            }, "-=0.4")

            // Phase 5: Shatter overlay flashes
            .add(() => {
                if (shatterRef.current) {
                    gsap.fromTo(shatterRef.current,
                        { opacity: 0.9, scale: 1.05 },
                        { opacity: 0, scale: 1, duration: 0.6, ease: "power2.out" }
                    );
                }
            }, "-=0.5")

            // Phase 6: Final float state
            .to(phoneRef.current, {
                y: -8,
                duration: 3,
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1,
            })
            .add(() => setBreakoutDone(true), 2);

        return () => { tl.kill(); };
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!breakoutDone) return;
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
    }, [breakoutDone, mouseX, mouseY]);

    const handleMouseLeave = useCallback(() => {
        mouseX.set(0);
        mouseY.set(0);
    }, [mouseX, mouseY]);

    return (
        <section
            className="relative min-h-[520px] flex items-center overflow-hidden rounded-[40px] border border-white/8"
            style={{ perspective: "900px", background: "linear-gradient(135deg, #03050a 0%, #0a0f1a 60%, #061018 100%)" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Background grid */}
            <div className="absolute inset-0 grid-3d-bg opacity-25 pointer-events-none" />

            {/* Ambient glows */}
            <div className="absolute top-[-15%] left-[-5%] w-[50%] h-[70%] bg-cyan-500/8 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-15%] right-[-5%] w-[45%] h-[60%] bg-violet-600/8 blur-[100px] rounded-full pointer-events-none" />

            {/* Text content */}
            <div className="relative z-20 px-10 py-16 md:px-16 max-w-[52%]">
                <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6, duration: 0.7 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-[10px] font-black tracking-[0.35em] uppercase mb-5"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    {shop.slogan || "Tecnología de Próxima Generación"}
                </motion.span>

                <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.88] mb-8 uppercase tracking-tighter"
                >
                    Rompe los<br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400">
                        Límites
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.1, duration: 0.8 }}
                    className="text-slate-400 text-base md:text-lg leading-relaxed max-w-md mb-10"
                >
                    {shop.description || "Hardware certificado, soporte experto y la experiencia más premium del mercado. Tecnología que supera expectativas."}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3, duration: 0.6 }}
                    className="flex items-center gap-4"
                >
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono uppercase tracking-widest">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Certificado
                    </div>
                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono uppercase tracking-widest">
                        <Zap className="w-3.5 h-3.5 text-yellow-400" /> Envío Express
                    </div>
                    <div className="w-1 h-1 bg-white/20 rounded-full" />
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono uppercase tracking-widest">
                        <Star className="w-3.5 h-3.5 text-amber-400" /> Garantía Total
                    </div>
                </motion.div>
            </div>

            {/* Phone / Product Breakout Zone */}
            <div className="absolute right-[6%] top-0 bottom-0 w-[40%] flex items-center justify-center pointer-events-none">
                {/* Screen frame (the "monitor" being broken) */}
                <div
                    ref={screenRef}
                    className="relative w-52 h-[340px] rounded-[20px] border-2 border-white/15 bg-black/40 overflow-hidden opacity-0"
                    style={{ boxShadow: "0 0 60px rgba(6,182,212,0.15), inset 0 0 30px rgba(6,182,212,0.05)" }}
                >
                    {/* Portal inside screen */}
                    <WarpPortalCanvas active={portalActive} />

                    {/* Screen scanlines */}
                    <div className="absolute inset-0 pointer-events-none opacity-20"
                        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)" }}
                    />

                    {/* Screen shatter overlay */}
                    <div ref={shatterRef} className="absolute inset-0 z-20 opacity-0"
                        style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.9) 0%, rgba(6,182,212,0.5) 30%, transparent 70%)" }}
                    />

                    {/* Screen corner decorations */}
                    {[["top-1 left-1", "w-4 h-4 border-t-2 border-l-2"], ["top-1 right-1", "w-4 h-4 border-t-2 border-r-2"], ["bottom-1 left-1", "w-4 h-4 border-b-2 border-l-2"], ["bottom-1 right-1", "w-4 h-4 border-b-2 border-r-2"]].map(([pos, cls], i) => (
                        <div key={i} className={`absolute ${pos} ${cls} border-cyan-500/60`} />
                    ))}
                </div>

                {/* Floating phone card (breakout subject) */}
                <motion.div
                    ref={phoneRef as any}
                    style={{ rotateX, rotateY, transformStyle: "preserve-3d", position: "absolute" }}
                    className="w-44 h-80 rounded-[28px] overflow-hidden border border-white/20 shadow-2xl"
                    whileHover={{ scale: 1.03 }}
                >
                    {/* Liquid Metal background blob */}
                    <div className="absolute inset-0 z-0">
                        <LiquidMetalBlob color="#06b6d4" />
                    </div>

                    {/* Product display */}
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4">
                        {shop.heroProductImage ? (
                            <img
                                src={shop.heroProductImage}
                                alt={shop.name}
                                className="w-full h-[75%] object-contain drop-shadow-2xl"
                                style={{ filter: "drop-shadow(0 0 24px rgba(6,182,212,0.5))" }}
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4 shadow-xl">
                                <Smartphone className="w-10 h-10 text-cyan-300" />
                            </div>
                        )}
                        <span className="text-white text-xs font-black uppercase tracking-widest text-center mt-2">
                            {shop.name || "Tech Store"}
                        </span>
                        <span className="text-cyan-400/70 text-[9px] font-mono mt-0.5 uppercase tracking-[0.2em]">
                            Premium Edition
                        </span>
                    </div>

                    {/* Metallic sheen */}
                    <div className="absolute inset-0 z-20 pointer-events-none"
                        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(6,182,212,0.08) 100%)" }}
                    />

                    {/* Z-axis glow (depth cue) */}
                    <div className="absolute -inset-1 rounded-[30px] z-[-1] pointer-events-none"
                        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)", filter: "blur(12px)" }}
                    />
                </motion.div>
            </div>
        </section>
    );
}

// ─── PORTAL PRODUCT CARD ──────────────────────────────────────────────────────
function PortalProductCard({ product, index }: { product: Product; index: number }) {
    const { addProduct } = useCart();
    const { triggerFlyToCart } = useVisualFeedback();
    const cardRef = useRef<HTMLDivElement>(null);
    const [hovered, setHovered] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [portalVisible, setPortalVisible] = useState(false);

    const hasVariants = product.variants && product.variants.length > 0;
    const hasExtras = product.extras && product.extras.length > 0;
    const hasOptions = hasVariants || hasExtras;
    const isOutOfStock = !product.infiniteStock && (Number(product.stock) || 0) <= 0 && (!hasVariants || !product.variants!.some(v => (Number(v.stock) || 0) > 0));

    // Warp portal appears on hover
    useEffect(() => {
        if (hovered) {
            const t = setTimeout(() => setPortalVisible(true), 100);
            return () => clearTimeout(t);
        } else {
            setPortalVisible(false);
        }
    }, [hovered]);

    // GSAP entrance animation
    useEffect(() => {
        if (!cardRef.current) return;
        gsap.fromTo(cardRef.current,
            { opacity: 0, y: 40, scale: 0.92 },
            {
                opacity: 1, y: 0, scale: 1,
                duration: 0.7,
                delay: index * 0.07,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: cardRef.current,
                    start: "top 90%",
                    once: true,
                }
            }
        );
    }, [index]);

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
        <div
            ref={cardRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="group relative rounded-3xl overflow-hidden bg-white/4 border border-white/10 transition-all duration-500 hover:border-cyan-500/50 hover:shadow-[0_0_40px_rgba(6,182,212,0.15)] cursor-pointer"
            style={{ opacity: 0 }}
        >
            {/* Product Image with Portal Overlay */}
            <div className="relative h-56 overflow-hidden bg-gradient-to-b from-slate-900 to-black">
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-slate-600" />
                    </div>
                )}

                {/* Digital Warp Portal overlay on hover */}
                <div className={cn("absolute inset-0 transition-opacity duration-500", portalVisible ? "opacity-100" : "opacity-0")}>
                    <WarpPortalCanvas active={portalVisible} />
                </div>

                {/* Scanline effect */}
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-30 transition-opacity duration-500"
                    style={{ background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.04) 2px, rgba(6,182,212,0.04) 4px)" }}
                />

                {/* Stock badge */}
                <div className="absolute top-3 left-3 z-10">
                    {isOutOfStock ? (
                        <span className="bg-red-900/70 text-red-300 border border-red-500/30 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-sm">
                            Agotado
                        </span>
                    ) : (
                        <span className="bg-emerald-900/70 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-sm">
                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                            En Stock
                        </span>
                    )}
                </div>

                {/* Liquid Metal corner accent */}
                <div className="absolute -bottom-8 -right-8 w-28 h-28 opacity-20 group-hover:opacity-40 transition-opacity duration-500">
                    <LiquidMetalBlob color="#7c3aed" />
                </div>
            </div>

            {/* Card content */}
            <div className="p-5">
                <p className="text-[10px] text-slate-600 font-mono uppercase tracking-[0.2em] mb-1">{product.category || "Tecnología"}</p>
                <h4 className="text-white font-black uppercase tracking-tight leading-tight mb-2 group-hover:text-cyan-300 transition-colors line-clamp-2">
                    {product.name}
                </h4>
                <p className="text-slate-500 text-xs leading-relaxed line-clamp-2 mb-4">{product.description}</p>

                <div className="flex items-center justify-between">
                    <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400">
                        ${product.price.toLocaleString()}
                    </span>

                    <button
                        onClick={handleAction}
                        disabled={isOutOfStock && !hasOptions}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all duration-300",
                            isOutOfStock && !hasOptions
                                ? "bg-white/5 text-slate-600 cursor-not-allowed"
                                : "bg-cyan-500 text-black hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
                        )}
                    >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {hasOptions ? "Ver" : "Agregar"}
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <ProductOptionsModal product={product} onClose={() => setIsModalOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── SERVICE CARD ─────────────────────────────────────────────────────────────
function ServiceCard3D({ service }: { service: Service }) {
    const [hovered, setHovered] = useState(false);
    return (
        <motion.div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative p-7 rounded-3xl bg-white/4 border border-white/10 overflow-hidden group hover:border-violet-500/40 transition-colors duration-500"
        >
            {/* Liquid metal background on hover */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute -top-12 -right-12 w-40 h-40 pointer-events-none"
                    >
                        <LiquidMetalBlob color="#7c3aed" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Warp portal background on hover */}
            {hovered && (
                <div className="absolute inset-0 pointer-events-none opacity-30">
                    <WarpPortalCanvas active={hovered} />
                </div>
            )}

            <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-500">
                    <span className="text-violet-400 font-black text-xl">
                        {service.name.charAt(0).toUpperCase()}
                    </span>
                </div>
                <h4 className="text-white font-black uppercase tracking-tighter text-lg mb-2 group-hover:text-violet-300 transition-colors">
                    {service.name}
                </h4>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">{service.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-white/8">
                    <div>
                        <span className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">Duración</span>
                        <p className="text-sm font-bold text-slate-300">{service.duration} min</p>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] text-slate-600 font-mono uppercase tracking-widest">Precio</span>
                        <p className="text-xl font-black text-violet-400">${service.price.toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── MAIN LAYOUT ──────────────────────────────────────────────────────────────
export function Tech3DLayout({ shop, products, services, loadingData }: Tech3DLayoutProps) {
    const { items: cart, addProduct, setIsCartOpen } = useCart();
    const [view, setView] = useState<View>("products");
    const [activeCategory, setActiveCategory] = useState("todos");
    const [search, setSearch] = useState("");

    const categories = useMemo(() => {
        const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
        return ["todos", ...cats];
    }, [products]);

    const filtered = useMemo(() => products.filter(p => {
        const catOk = activeCategory === "todos" || p.category === activeCategory;
        const searchOk = p.name.toLowerCase().includes(search.toLowerCase());
        return catOk && searchOk;
    }), [products, activeCategory, search]);

    const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

    const navItems = [
        { id: "products", label: "Productos", icon: <Smartphone className="w-4 h-4" /> },
        { id: "services", label: "Servicios", icon: <ShieldCheck className="w-4 h-4" /> },
        { id: "location", label: "Ubicación", icon: <MapPin className="w-4 h-4" /> },
    ];

    return (
        <div className="min-h-screen text-slate-100" style={{ background: "#03050a" }}>

            {/* Animated background - subtle grid */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute inset-0 grid-3d-bg opacity-15" />
                <div className="absolute top-0 left-0 w-[60%] h-[50%] bg-cyan-500/5 blur-[160px] rounded-full" />
                <div className="absolute bottom-0 right-0 w-[50%] h-[45%] bg-violet-600/5 blur-[140px] rounded-full" />
            </div>

            {/* ─── NAVBAR ─── */}
            <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/70 border-b border-white/6">
                <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/12 flex items-center justify-center overflow-hidden shadow-xl">
                            {shop.logo ? (
                                <img src={shop.logo} alt={shop.name} className="w-full h-full object-contain p-1" />
                            ) : (
                                <Cpu className="w-5 h-5 text-cyan-400" />
                            )}
                        </div>
                        <span className="text-white font-black uppercase tracking-tighter text-lg">{shop.name}</span>
                    </div>

                    {/* Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map(n => (
                            <button
                                key={n.id}
                                onClick={() => setView(n.id as View)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                                    view === n.id
                                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.35)]"
                                        : "text-slate-500 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {n.icon}{n.label}
                            </button>
                        ))}
                    </nav>

                    {/* Cart */}
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/6 border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition-all duration-300 text-sm font-bold text-white"
                    >
                        <ShoppingBag className="w-4 h-4 text-cyan-400" />
                        Carrito
                        {totalItems > 0 && (
                            <motion.span
                                key={totalItems}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-5 h-5 rounded-full bg-cyan-500 text-black text-[10px] font-black flex items-center justify-center"
                            >
                                {totalItems}
                            </motion.span>
                        )}
                    </button>
                </div>
            </header>

            {/* ─── MAIN ─── */}
            <main className="relative z-10 max-w-screen-2xl mx-auto px-6 md:px-12 py-10 space-y-16">

                {/* Screen Breakout Hero */}
                <ScreenBreakoutHero shop={shop} />

                {/* Mobile nav */}
                <div className="flex md:hidden gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {navItems.map(n => (
                        <button
                            key={n.id}
                            onClick={() => setView(n.id as View)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase whitespace-nowrap transition-all",
                                view === n.id
                                    ? "bg-cyan-500 text-black"
                                    : "bg-white/5 text-slate-400"
                            )}
                        >
                            {n.icon}{n.label}
                        </button>
                    ))}
                </div>

                {/* ── PRODUCTS VIEW ── */}
                <AnimatePresence mode="wait">
                    {view === "products" && (
                        <motion.div
                            key="products"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-10"
                        >
                            {/* Search + Filter bar */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Buscar productos..."
                                        className="w-full pl-11 pr-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                                    />
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setActiveCategory(cat)}
                                            className={cn(
                                                "whitespace-nowrap px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                                                activeCategory === cat
                                                    ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.35)]"
                                                    : "bg-white/5 text-slate-400 border border-white/8 hover:border-cyan-500/30 hover:text-white"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section header */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-white/6" />
                                <span className="text-[11px] font-mono text-slate-600 uppercase tracking-[0.3em]">
                                    {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
                                </span>
                                <div className="flex-1 h-px bg-white/6" />
                            </div>

                            {loadingData ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="h-80 rounded-3xl bg-white/4 border border-white/8 animate-pulse" />
                                    ))}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="py-24 text-center">
                                    <Package className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                    <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">Sin productos encontrados</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filtered.map((product, i) => (
                                        <PortalProductCard key={product.id} product={product} index={i} />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── SERVICES VIEW ── */}
                    {view === "services" && (
                        <motion.div
                            key="services"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="space-y-10"
                        >
                            <div className="text-center max-w-2xl mx-auto">
                                <motion.h2
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4"
                                >
                                    Soporte <span className="text-violet-400">Experto</span>
                                </motion.h2>
                                <p className="text-slate-500 leading-relaxed">Diagnóstico, reparación y configuración por técnicos certificados.</p>
                            </div>

                            {services.length === 0 ? (
                                <div className="py-16 text-center">
                                    <Cpu className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                    <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">No hay servicios disponibles</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {services.map(s => <ServiceCard3D key={s.id} service={s} />)}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── LOCATION VIEW ── */}
                    {view === "location" && (
                        <motion.div
                            key="location"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="grid lg:grid-cols-2 gap-14 items-center"
                        >
                            <div className="space-y-8">
                                <h2 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter leading-none">
                                    Nuestro <br /><span className="text-cyan-400">Lab</span>
                                </h2>
                                <p className="text-slate-400 leading-relaxed text-lg max-w-md">
                                    Visítanos para asesoría personalizada, diagnóstico técnico y retiro de equipos premium.
                                </p>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-2xl bg-white/4 border border-white/8">
                                        <h5 className="text-white font-bold mb-2 flex items-center gap-2 text-sm">
                                            <MapPin className="w-4 h-4 text-cyan-400" />Dirección
                                        </h5>
                                        <p className="text-slate-400 text-sm">{shop.contact?.address || "Consultar disponibilidad"}</p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-white/4 border border-white/8">
                                        <h5 className="text-white font-bold mb-2 flex items-center gap-2 text-sm">
                                            <Globe className="w-4 h-4 text-cyan-400" />Contacto
                                        </h5>
                                        <p className="text-slate-400 text-sm">{shop.contact?.whatsapp || shop.contact?.phone || "—"}</p>
                                    </div>
                                </div>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.contact?.address || shop.name || "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-3 bg-white text-black px-7 py-4 rounded-full font-black uppercase text-sm tracking-widest hover:bg-cyan-400 transition-colors"
                                >
                                    Obtener Indicaciones <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>

                            <div className="relative aspect-[4/3] rounded-[40px] overflow-hidden border border-white/10">
                                <img
                                    src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1200&q=80"
                                    alt="Office"
                                    className="w-full h-full object-cover opacity-70"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent" />
                                <div className="absolute inset-0">
                                    <WarpPortalCanvas active={true} />
                                </div>
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-2xl rotate-12 z-10">
                                    <MapPin className="w-7 h-7 text-cyan-500" />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── TRUST BADGES ── */}
                <section className="border-t border-white/6 pt-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[
                            { icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />, color: "emerald", title: "Certificación Total", desc: "Todos nuestros productos pasan por control de calidad riguroso antes de ser comercializados." },
                            { icon: <Zap className="w-6 h-6 text-yellow-400" />, color: "yellow", title: "Soporte 24/7", desc: "Equipo de expertos disponible en todo momento para resolver cualquier inquietud técnica." },
                            { icon: <Globe className="w-6 h-6 text-cyan-400" />, color: "cyan", title: "Envío Global", desc: "Llevamos tecnología premium a cualquier parte del mundo de forma rápida y segura." },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15, duration: 0.6 }}
                                className="group space-y-4"
                            >
                                <div className={`w-12 h-12 rounded-2xl bg-${item.color}-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                                    {item.icon}
                                </div>
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">{item.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>
            </main>

            {/* ─── FOOTER ─── */}
            <footer className="relative z-10 border-t border-white/6 py-16 px-6 md:px-12 bg-black/50 mt-10">
                <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between gap-10">
                    <div className="max-w-xs">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center">
                                <Cpu className="text-black w-4 h-4" />
                            </div>
                            <span className="text-white font-black uppercase tracking-widest">{shop.name}</span>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Tecnología de élite para quienes exigen lo mejor. Calidad, seguridad y rendimiento sin compromisos.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-10 text-sm">
                        {[
                            { title: "Tienda", items: ["Productos", "Servicios", "Novedades"] },
                            { title: "Soporte", items: ["Garantía", "Reparaciones", "Ayuda"] },
                            { title: "Legal", items: ["Términos", "Privacidad", "Cookies"] },
                        ].map(col => (
                            <div key={col.title}>
                                <h5 className="text-white font-black text-xs uppercase tracking-widest mb-5 border-l-2 border-cyan-500 pl-3">{col.title}</h5>
                                <ul className="space-y-3 text-slate-600">
                                    {col.items.map(item => (
                                        <li key={item} className="hover:text-cyan-400 cursor-pointer transition-colors">{item}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="max-w-screen-2xl mx-auto mt-14 pt-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-700 text-xs font-mono">&copy; {new Date().getFullYear()} {shop.name} // POWERED BY LINKO</p>
                    <div className="flex items-center gap-6 text-slate-700 text-xs font-mono uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Pago Seguro</span>
                        <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" /> Envío Global</span>
                    </div>
                </div>
            </footer>

            {/* ─── GLOBAL STYLES ─── */}
            <style jsx global>{`
                .grid-3d-bg {
                    background-image:
                        linear-gradient(to right, rgba(6,182,212,0.07) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(6,182,212,0.07) 1px, transparent 1px);
                    background-size: 48px 48px;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}
