"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
    ShoppingBag,
    ShieldCheck,
    Zap,
    Cpu,
    Smartphone,
    ArrowRight,
    Package,
    Globe,
    Search,
    MapPin,
    Star,
    Lock,
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

// ─── WARP PORTAL CANVAS ──────────────────────────────────────────────────────
function WarpPortalCanvas({ active, speed = 1 }: { active: boolean; speed?: number }) {
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

            timeRef.current += 0.018 * speed;
            const t = timeRef.current;
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const rings = 16;
            for (let i = rings; i > 0; i--) {
                const progress = i / rings;
                const radius = progress * Math.min(canvas.width, canvas.height) * 0.48;
                const warp = Math.sin(t * 2.5 + progress * Math.PI * 2.5) * 10;
                const alpha = (1 - progress) * 0.7 + 0.04;
                const hue = (t * 50 + progress * 220) % 360;

                ctx.beginPath();
                for (let a = 0; a <= Math.PI * 2; a += 0.04) {
                    const distort = Math.sin(a * 7 + t * 4) * warp * (1 - progress);
                    const r = radius + distort;
                    const x = cx + Math.cos(a) * r;
                    const y = cy + Math.sin(a) * r;
                    if (a === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.strokeStyle = `hsla(${hue}, 95%, 68%, ${alpha})`;
                ctx.lineWidth = 1.8 * (1 - progress * 0.5);
                ctx.stroke();
            }

            // Central glow
            const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 90);
            grd.addColorStop(0, `hsla(${(t * 60) % 360}, 100%, 85%, 0.45)`);
            grd.addColorStop(0.4, `hsla(${(t * 60 + 120) % 360}, 80%, 55%, 0.2)`);
            grd.addColorStop(1, "transparent");
            ctx.beginPath();
            ctx.arc(cx, cy, 90, 0, Math.PI * 2);
            ctx.fillStyle = grd;
            ctx.fill();

            // Scan sweep
            const scanAngle = t * 1.8;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(scanAngle);
            const scanGrd = ctx.createLinearGradient(0, 0, Math.min(canvas.width, canvas.height) * 0.48, 0);
            scanGrd.addColorStop(0, `hsla(${(t * 70) % 360}, 100%, 75%, 0.0)`);
            scanGrd.addColorStop(0.5, `hsla(${(t * 70) % 360}, 100%, 75%, 0.4)`);
            scanGrd.addColorStop(1, "transparent");
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, Math.min(canvas.width, canvas.height) * 0.48, -0.05, 0.05);
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
    }, [active, speed]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ opacity: active ? 1 : 0, transition: "opacity 0.6s ease" }}
        />
    );
}

// ─── LIQUID METAL BLOB ───────────────────────────────────────────────────────
function LiquidMetalBlob({ color = "#06b6d4" }: { color?: string }) {
    return (
        <div className="relative w-full h-full flex items-center justify-center">
            <svg viewBox="0 0 200 200" className="absolute w-full h-full" style={{ filter: "url(#liquid-filter)" }}>
                <defs>
                    <filter id="liquid-filter">
                        <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="4" seed="2">
                            <animate attributeName="baseFrequency" values="0.012;0.02;0.012" dur="7s" repeatCount="indefinite" />
                            <animate attributeName="seed" values="2;6;10;6;2" dur="11s" repeatCount="indefinite" />
                        </feTurbulence>
                        <feDisplacementMap in="SourceGraphic" scale="18" xChannelSelector="R" yChannelSelector="G">
                            <animate attributeName="scale" values="18;32;18" dur="5s" repeatCount="indefinite" />
                        </feDisplacementMap>
                    </filter>
                    <radialGradient id="metal-grad" cx="45%" cy="40%" r="55%">
                        <stop offset="0%" stopColor="#e2e8f0" stopOpacity="1" />
                        <stop offset="30%" stopColor={color} stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.7" />
                    </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="78" fill="url(#metal-grad)" />
                <ellipse cx="78" cy="72" rx="24" ry="11" fill="white" opacity="0.4" transform="rotate(-30 78 72)">
                    <animate attributeName="opacity" values="0.4;0.65;0.4" dur="3.5s" repeatCount="indefinite" />
                </ellipse>
                <ellipse cx="118" cy="132" rx="13" ry="6" fill="white" opacity="0.22" transform="rotate(20 118 132)">
                    <animate attributeName="opacity" values="0.22;0.45;0.22" dur="4.5s" repeatCount="indefinite" />
                </ellipse>
            </svg>
        </div>
    );
}

// ─── SCREEN BREAKOUT HERO ────────────────────────────────────────────────────
function ScreenBreakoutHero({ shop }: { shop: any }) {
    const phoneRef = useRef<HTMLDivElement>(null);
    const screenRef = useRef<HTMLDivElement>(null);
    const shatterRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<HTMLDivElement>(null);
    const [portalActive, setPortalActive] = useState(false);
    const [breakoutDone, setBreakoutDone] = useState(false);
    const [glitchActive, setGlitchActive] = useState(false);
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const springX = useSpring(mouseX, { stiffness: 70, damping: 22 });
    const springY = useSpring(mouseY, { stiffness: 70, damping: 22 });
    const rotateX = useTransform(springY, [-200, 200], [14, -14]);
    const rotateY = useTransform(springX, [-200, 200], [-14, 14]);

    useEffect(() => {
        if (!phoneRef.current || !screenRef.current) return;

        // Trigger glitch animation periodically
        const glitchInterval = setInterval(() => {
            setGlitchActive(true);
            setTimeout(() => setGlitchActive(false), 300);
        }, 4000);

        const tl = gsap.timeline({ delay: 0.3 });

        tl.set(phoneRef.current, { z: -200, scale: 0.5, opacity: 0, rotationX: 10 })
            .set(screenRef.current, { opacity: 1 })
            .add(() => setPortalActive(true))
            .to(phoneRef.current, {
                z: 0, scale: 1, opacity: 1, rotationX: 0,
                duration: 1.8, ease: "power3.out",
            }, "+=0.4")
            .to(phoneRef.current, {
                z: 70, y: -20,
                duration: 1.0, ease: "back.out(1.7)",
            }, "-=0.5")
            // Shatter burst
            .add(() => {
                if (shatterRef.current) {
                    gsap.fromTo(shatterRef.current,
                        { opacity: 1, scale: 1.08 },
                        { opacity: 0, scale: 1.2, duration: 0.7, ease: "power2.out" }
                    );
                }
                // Particles burst
                if (particlesRef.current) {
                    const particles = particlesRef.current.children;
                    gsap.fromTo(Array.from(particles),
                        { opacity: 1, x: 0, y: 0, scale: 1 },
                        {
                            opacity: 0,
                            x: () => (Math.random() - 0.5) * 180,
                            y: () => (Math.random() - 0.5) * 180,
                            scale: () => Math.random() * 1.5 + 0.5,
                            duration: 0.9,
                            stagger: 0.04,
                            ease: "power2.out",
                        }
                    );
                }
            }, "-=0.6")
            // Float loop
            .to(phoneRef.current, {
                y: -10, duration: 2.8, ease: "sine.inOut", yoyo: true, repeat: -1,
            })
            .add(() => setBreakoutDone(true), 1.5);

        return () => {
            tl.kill();
            clearInterval(glitchInterval);
        };
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
            className="relative min-h-[540px] flex items-center overflow-hidden rounded-[40px] border border-white/8"
            style={{ perspective: "900px", background: "linear-gradient(135deg, #020408 0%, #080d18 60%, #050c14 100%)" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Grid bg */}
            <div className="absolute inset-0 grid-3d-bg opacity-20 pointer-events-none" />

            {/* Ambient glows */}
            <div className="absolute top-[-20%] left-[-8%] w-[55%] h-[80%] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-8%] w-[50%] h-[70%] bg-violet-600/10 blur-[110px] rounded-full pointer-events-none" />

            {/* Text */}
            <div className="relative z-20 px-10 py-16 md:px-16 max-w-[55%]">
                <motion.span
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5, duration: 0.7 }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-[10px] font-black tracking-[0.35em] uppercase mb-5"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    {shop.slogan || "Tecnología de Próxima Generación"}
                </motion.span>

                <div className="relative mb-8">
                    <motion.h1
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[0.88] uppercase tracking-tighter"
                    >
                        <span className={cn("block", glitchActive && "hero-glitch")}>
                            {shop.name || "Tech"}
                        </span>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 block">
                            Premium
                        </span>
                        <span className="text-white/40 text-3xl md:text-4xl block mt-2">
                            Store
                        </span>
                    </motion.h1>
                </div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0, duration: 0.8 }}
                    className="text-slate-400 text-base md:text-lg leading-relaxed max-w-md mb-10"
                >
                    {shop.description || "Hardware certificado, soporte experto y la experiencia más premium del mercado."}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    className="flex flex-wrap items-center gap-4"
                >
                    {[
                        { icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, label: "Garantía" },
                        { icon: <Zap className="w-3.5 h-3.5 text-yellow-400" />, label: "Express" },
                        { icon: <Star className="w-3.5 h-3.5 text-amber-400" />, label: "Premium" },
                        { icon: <Lock className="w-3.5 h-3.5 text-violet-400" />, label: "Seguro" },
                    ].map((b, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono uppercase tracking-widest">
                            {b.icon} {b.label}
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Phone Breakout */}
            <div className="absolute right-[5%] top-0 bottom-0 w-[42%] flex items-center justify-center pointer-events-none">
                {/* Screen frame */}
                <div
                    ref={screenRef}
                    className="relative w-52 h-[340px] rounded-[20px] border-2 border-white/12 bg-black/50 overflow-hidden opacity-0"
                    style={{ boxShadow: "0 0 80px rgba(6,182,212,0.18), inset 0 0 40px rgba(6,182,212,0.06)" }}
                >
                    <WarpPortalCanvas active={portalActive} speed={1.2} />
                    <div className="absolute inset-0 pointer-events-none opacity-15"
                        style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.04) 2px, rgba(0,255,255,0.04) 4px)" }}
                    />
                    {/* Shatter */}
                    <div ref={shatterRef} className="absolute inset-0 z-20 opacity-0"
                        style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.95) 0%, rgba(6,182,212,0.6) 25%, rgba(139,92,246,0.3) 55%, transparent 75%)" }}
                    />
                    {/* Particles container */}
                    <div ref={particlesRef} className="absolute inset-0 z-30 flex items-center justify-center">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="absolute w-2 h-2 rounded-full"
                                style={{
                                    background: i % 2 === 0 ? "#06b6d4" : "#7c3aed",
                                    left: `${45 + (Math.random() - 0.5) * 10}%`,
                                    top: `${45 + (Math.random() - 0.5) * 10}%`,
                                    opacity: 0,
                                    boxShadow: `0 0 8px ${i % 2 === 0 ? "#06b6d4" : "#7c3aed"}`,
                                }}
                            />
                        ))}
                    </div>
                    {/* Corner decorations */}
                    {[["top-1.5 left-1.5", "border-t-2 border-l-2"], ["top-1.5 right-1.5", "border-t-2 border-r-2"], ["bottom-1.5 left-1.5", "border-b-2 border-l-2"], ["bottom-1.5 right-1.5", "border-b-2 border-r-2"]].map(([pos, cls], i) => (
                        <div key={i} className={`absolute ${pos} w-4 h-4 ${cls} border-cyan-400/70`} />
                    ))}
                </div>

                {/* Floating product card */}
                <motion.div
                    ref={phoneRef as any}
                    style={{ rotateX, rotateY, transformStyle: "preserve-3d", position: "absolute" }}
                    className="w-48 h-[320px] rounded-[28px] overflow-hidden border border-white/20 shadow-2xl"
                >
                    <div className="absolute inset-0 z-0">
                        <LiquidMetalBlob color="#06b6d4" />
                    </div>
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4">
                        {shop.heroProductImage ? (
                            <img
                                src={shop.heroProductImage}
                                alt={shop.name}
                                className="w-full h-[78%] object-contain drop-shadow-2xl"
                                style={{ filter: "drop-shadow(0 0 30px rgba(6,182,212,0.6))" }}
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center mb-4">
                                <Smartphone className="w-12 h-12 text-cyan-300" />
                            </div>
                        )}
                        <span className="text-white text-xs font-black uppercase tracking-widest text-center mt-2">
                            {shop.name || "Tech Store"}
                        </span>
                        <span className="text-cyan-400/70 text-[9px] font-mono mt-0.5 uppercase tracking-[0.2em]">
                            Premium
                        </span>
                    </div>
                    {/* Metallic sheen */}
                    <div className="absolute inset-0 z-20 pointer-events-none"
                        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 50%, rgba(6,182,212,0.1) 100%)" }}
                    />
                    {/* Depth glow */}
                    <div className="absolute -inset-1 rounded-[30px] z-[-1] pointer-events-none"
                        style={{ background: "radial-gradient(circle, rgba(6,182,212,0.35) 0%, transparent 70%)", filter: "blur(14px)" }}
                    />
                </motion.div>
            </div>
        </section>
    );
}

// ─── PRODUCT CARD ─────────────────────────────────────────────────────────────
function PortalProductCard({ product, index }: { product: Product; index: number }) {
    const { addProduct } = useCart();
    const { triggerFlyToCart } = useVisualFeedback();
    const cardRef = useRef<HTMLDivElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Subtle 3D tilt
    const mouseX = useMotionValue(0.5);
    const mouseY = useMotionValue(0.5);
    const springX = useSpring(mouseX, { stiffness: 120, damping: 22 });
    const springY = useSpring(mouseY, { stiffness: 120, damping: 22 });
    const rotateY = useTransform(springX, [0, 1], [-6, 6]);
    const rotateX = useTransform(springY, [0, 1], [4, -4]);

    const hasVariants = product.variants && product.variants.length > 0;
    const hasExtras = product.extras && product.extras.length > 0;
    const hasOptions = hasVariants || hasExtras;
    const isOutOfStock = !product.infiniteStock && (Number(product.stock) || 0) <= 0 && (!hasVariants || !product.variants!.some(v => (Number(v.stock) || 0) > 0));

    useEffect(() => {
        if (!cardRef.current) return;
        gsap.fromTo(cardRef.current,
            { opacity: 0, y: 40 },
            {
                opacity: 1, y: 0,
                duration: 0.7,
                delay: index * 0.05,
                ease: "power3.out",
                scrollTrigger: { trigger: cardRef.current, start: "top 94%", once: true },
            }
        );
    }, [index]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left) / rect.width);
        mouseY.set((e.clientY - rect.top) / rect.height);
    };

    const handleMouseLeave = () => {
        mouseX.set(0.5);
        mouseY.set(0.5);
    };

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
            ref={cardRef as any}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            style={{ rotateX, rotateY, transformStyle: "preserve-3d", opacity: 0 }}
            className="group relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/8 transition-all duration-400 hover:border-cyan-500/40 hover:bg-white/[0.05] hover:shadow-[0_4px_40px_rgba(6,182,212,0.12)] cursor-pointer"
        >
            {/* Image */}
            <div className="relative h-56 overflow-hidden bg-black">
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-14 h-14 text-slate-800" />
                    </div>
                )}

                {/* Top gradient fade */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                {/* Badge */}
                <div className="absolute top-3 left-3 z-10">
                    {isOutOfStock ? (
                        <span className="bg-black/70 text-red-400 border border-red-500/30 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest backdrop-blur-sm">
                            Agotado
                        </span>
                    ) : (
                        <span className="bg-black/70 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-sm">
                            <span className="w-1 h-1 rounded-full bg-emerald-400" />
                            En Stock
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <p className="text-[9px] text-slate-600 font-mono uppercase tracking-[0.25em] mb-1.5">{product.category || "Tecnología"}</p>
                <h4 className="text-white font-bold leading-snug mb-2 group-hover:text-cyan-300 transition-colors duration-300 line-clamp-2 text-sm">
                    {product.name}
                </h4>
                <p className="text-slate-600 text-xs leading-relaxed line-clamp-2 mb-5">{product.description}</p>

                <div className="flex items-center justify-between">
                    <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-400">
                        ${product.price.toLocaleString()}
                    </span>
                    <button
                        onClick={handleAction}
                        disabled={isOutOfStock && !hasOptions}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-[11px] tracking-wide transition-all duration-200 active:scale-95",
                            isOutOfStock && !hasOptions
                                ? "bg-white/4 text-slate-700 cursor-not-allowed"
                                : "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-black hover:border-cyan-400"
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
        </motion.div>
    );
}

// ─── SERVICE CARD ─────────────────────────────────────────────────────────────
function ServiceCard3D({ service }: { service: Service }) {
    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative p-6 rounded-2xl bg-white/[0.03] border border-white/8 overflow-hidden group hover:border-violet-500/35 hover:bg-white/[0.05] transition-all duration-400"
        >
            {/* Subtle top accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400" />

            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-5 group-hover:border-violet-400/40 transition-colors duration-300">
                <span className="text-violet-400 font-black text-xl">{service.name.charAt(0).toUpperCase()}</span>
            </div>
            <h4 className="text-white font-bold text-base mb-2 group-hover:text-violet-300 transition-colors duration-300">
                {service.name}
            </h4>
            <p className="text-slate-600 text-sm leading-relaxed mb-6 line-clamp-3">{service.description}</p>
            <div className="flex items-center justify-between pt-4 border-t border-white/6">
                <div>
                    <span className="text-[9px] text-slate-700 font-mono uppercase tracking-widest">Duración</span>
                    <p className="text-sm font-bold text-slate-400">{service.duration} min</p>
                </div>
                <div className="text-right">
                    <span className="text-[9px] text-slate-700 font-mono uppercase tracking-widest">Precio</span>
                    <p className="text-xl font-black text-violet-400">${service.price.toLocaleString()}</p>
                </div>
            </div>
        </motion.div>
    );
}

// ─── MAIN LAYOUT ──────────────────────────────────────────────────────────────
export function Tech3DLayout({ shop, products, services, loadingData }: Tech3DLayoutProps) {
    const { items: cart, setIsCartOpen } = useCart();
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

            {/* Animated bg */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute inset-0 grid-3d-bg opacity-12" />
                <div className="absolute top-0 left-0 w-[60%] h-[50%] bg-cyan-500/4 blur-[180px] rounded-full" />
                <div className="absolute bottom-0 right-0 w-[50%] h-[45%] bg-violet-600/4 blur-[160px] rounded-full" />
            </div>

            {/* ─── NAVBAR ─── */}
            <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/75 border-b border-white/6">
                <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
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

                    {/* Cart button */}
                    <button
                        onClick={() => setIsCartOpen(true)}
                        className="relative flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-white/8 transition-all duration-300 text-sm font-bold text-white"
                    >
                        <ShoppingBag className="w-4 h-4 text-cyan-400" />
                        <span className="hidden sm:inline">Carrito</span>
                        {totalItems > 0 && (
                            <motion.span
                                key={totalItems}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                className="w-5 h-5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-black flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                            >
                                {totalItems}
                            </motion.span>
                        )}
                    </button>
                </div>
            </header>

            {/* ─── MAIN ─── */}
            <main className="relative z-10 max-w-screen-2xl mx-auto px-6 md:px-12 py-10 space-y-16">

                <ScreenBreakoutHero shop={shop} />

                {/* Mobile nav */}
                <div className="flex md:hidden gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {navItems.map(n => (
                        <button
                            key={n.id}
                            onClick={() => setView(n.id as View)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase whitespace-nowrap transition-all",
                                view === n.id ? "bg-cyan-500 text-black" : "bg-white/5 text-slate-400"
                            )}
                        >
                            {n.icon}{n.label}
                        </button>
                    ))}
                </div>

                {/* ── PRODUCTS ── */}
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
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Buscar productos..."
                                        className="w-full pl-11 pr-5 py-3.5 rounded-2xl bg-white/4 border border-white/8 text-white placeholder-slate-700 text-sm focus:outline-none focus:border-cyan-500/50 focus:bg-white/6 transition-all"
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
                                                    ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                                                    : "bg-white/4 text-slate-500 border border-white/8 hover:border-cyan-500/30 hover:text-white"
                                            )}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
                                <span className="text-[11px] font-mono text-slate-700 uppercase tracking-[0.3em]">
                                    {filtered.length} producto{filtered.length !== 1 ? "s" : ""}
                                </span>
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
                            </div>

                            {loadingData ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="h-80 rounded-3xl bg-white/3 border border-white/6 animate-pulse" />
                                    ))}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="py-24 text-center">
                                    <Package className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                                    <p className="text-slate-600 font-mono text-sm uppercase tracking-widest">Sin productos encontrados</p>
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

                    {/* ── SERVICES ── */}
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
                                    <Cpu className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                                    <p className="text-slate-600 font-mono text-sm uppercase tracking-widest">No hay servicios disponibles</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {services.map(s => <ServiceCard3D key={s.id} service={s} />)}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── LOCATION ── */}
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
                                    className="w-full h-full object-cover opacity-60"
                                />
                                <div className="absolute inset-0 bg-gradient-to-tr from-black/70 to-transparent" />
                                <div className="absolute inset-0">
                                    <WarpPortalCanvas active={true} speed={0.7} />
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
                                transition={{ delay: i * 0.15, duration: 0.7 }}
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
            <footer className="relative z-10 border-t border-white/6 py-16 px-6 md:px-12 bg-black/60 mt-10">
                <div className="max-w-screen-2xl mx-auto flex flex-col md:flex-row justify-between gap-10">
                    <div className="max-w-xs">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                                <Cpu className="text-white w-4 h-4" />
                            </div>
                            <span className="text-white font-black uppercase tracking-widest">{shop.name}</span>
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed">
                            Tecnología de élite para quienes exigen lo mejor.
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
                                <ul className="space-y-3 text-slate-700">
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

            {/* ─── STYLES ─── */}
            <style jsx global>{`
                .grid-3d-bg {
                    background-image:
                        linear-gradient(to right, rgba(6,182,212,0.06) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(6,182,212,0.06) 1px, transparent 1px);
                    background-size: 48px 48px;
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                @keyframes glitch-anim {
                    0%   { clip-path: inset(40% 0 61% 0); transform: translate(-4px, 0); }
                    20%  { clip-path: inset(92% 0 1% 0);  transform: translate(4px, 0); }
                    40%  { clip-path: inset(43% 0 1% 0);  transform: translate(0, 0); }
                    60%  { clip-path: inset(25% 0 58% 0); transform: translate(2px, 2px); color: #06b6d4; }
                    80%  { clip-path: inset(54% 0 7% 0);  transform: translate(-2px, 0); color: #7c3aed; }
                    100% { clip-path: inset(58% 0 43% 0); transform: translate(0, 0); color: white; }
                }
                .hero-glitch {
                    animation: glitch-anim 0.3s linear forwards;
                    text-shadow: 2px 0 #06b6d4, -2px 0 #7c3aed;
                }
            `}</style>
        </div>
    );
}
