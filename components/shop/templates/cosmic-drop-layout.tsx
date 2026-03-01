"use client";

import { useState, useEffect, useRef, useCallback, memo } from "react";
import Image from "next/image";
import { Loader2, ShoppingBag, Star, Sparkles } from "lucide-react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence, useInView } from "framer-motion";
import type { ShopConfig, Product, Service } from "@/lib/constants";
import { ProductGrid } from "@/components/shop";
import {
    Starfield,
    Nebula,
    ShootingStars,
    CosmicDust,
    CosmicCursor,
    GalaxyWarp,
    Constellation,
    Aurora,
    CosmicPlanet,
} from "./cosmic-drop-effects";
import { useCart } from "@/components/shared";
import { cn } from "@/lib/utils";

export interface CosmicDropLayoutProps {
    shop: ShopConfig;
    products: Product[];
    services: Service[];
    loadingData: boolean;
}

// ============================================
// COSMIC TICKER - Floating text marquee
// ============================================

const CosmicTicker = memo(function CosmicTicker({
    phrases,
    speed = 30,
}: {
    phrases: string[];
    speed?: number;
}) {
    const content = phrases.join(" /// ");
    const repeated = `${content} /// ${content} /// ${content} /// `;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 overflow-hidden py-3 bg-gradient-to-r from-violet-900/80 via-cyan-900/80 to-violet-900/80 backdrop-blur-md border-t border-violet-500/30">
            <motion.div
                className="whitespace-nowrap flex"
                animate={{ x: [0, -2000] }}
                transition={{
                    duration: speed,
                    repeat: Infinity,
                    ease: "linear",
                }}
            >
                <span className="text-sm md:text-base font-bold tracking-[0.3em] uppercase text-white/90 mr-8">
                    {repeated}
                </span>
                <span className="text-sm md:text-base font-bold tracking-[0.3em] uppercase text-white/90">
                    {repeated}
                </span>
            </motion.div>

            {/* Glow effect */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-32 h-full bg-gradient-to-r from-violet-900 to-transparent" />
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-violet-900 to-transparent" />
            </div>
        </div>
    );
});

// ============================================
// COSMIC HERO SECTION
// ============================================

const CosmicHero = memo(function CosmicHero({
    slogan,
    shopName,
    logo,
}: {
    slogan: string;
    shopName: string;
    logo?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true });

    return (
        <div ref={ref} className="relative min-h-[80vh] flex flex-col items-center justify-center px-4">
            {/* Logo */}
            {logo && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={isInView ? { scale: 1, opacity: 1 } : {}}
                    transition={{ duration: 1, delay: 0.5, type: "spring" }}
                    className="mb-8"
                >
                    <div className="relative w-32 h-32 md:w-40 md:h-40">
                        <Image
                            src={logo}
                            alt={shopName}
                            fill
                            className="object-contain"
                            priority
                        />
                        {/* Logo glow */}
                        <div
                            className="absolute inset-0 rounded-full"
                            style={{
                                background: "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
                                filter: "blur(20px)",
                                transform: "scale(1.5)",
                            }}
                        />
                    </div>
                </motion.div>
            )}

            {/* Main Slogan */}
            <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 1, delay: 0.8 }}
                className="text-5xl md:text-8xl lg:text-9xl font-black text-center uppercase tracking-wider"
                style={{
                    fontFamily: "'Orbitron', 'Rajdhani', sans-serif",
                    background: "linear-gradient(180deg, #ffffff 0%, #8B5CF6 50%, #06B6D4 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 0 60px rgba(139, 92, 246, 0.5)",
                    filter: "drop-shadow(0 0 30px rgba(139, 92, 246, 0.3))",
                }}
            >
                {slogan}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : {}}
                transition={{ duration: 1, delay: 1.2 }}
                className="mt-6 text-lg md:text-xl text-violet-300 tracking-[0.5em] uppercase"
            >
                {shopName}
            </motion.p>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 2 }}
                className="absolute bottom-10"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="flex flex-col items-center gap-2 text-violet-400"
                >
                    <Sparkles className="w-5 h-5" />
                    <span className="text-xs tracking-widest uppercase">Explora</span>
                </motion.div>
            </motion.div>
        </div>
    );
});

// ============================================
// COSMIC PRODUCT CARD
// ============================================

const CosmicProductCard = memo(function CosmicProductCard({
    product,
    index,
}: {
    product: Product;
    index: number;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });
    const [isHovered, setIsHovered] = useState(false);
    const { addProduct } = useCart();

    const handleAddToCart = useCallback(() => {
        addProduct(product, 1);
    }, [addProduct, product]);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative"
        >
            {/* Card glow on hover */}
            <motion.div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
                style={{
                    background: "radial-gradient(circle at center, rgba(139, 92, 246, 0.2) 0%, transparent 70%)",
                    filter: "blur(30px)",
                    transform: "scale(1.2)",
                }}
            />

            {/* Main card */}
            <motion.div
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-900/30 to-cyan-900/20 border border-violet-500/20 backdrop-blur-sm"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
            >
                {/* Product image */}
                <div className="relative aspect-square overflow-hidden">
                    {product.image ? (
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-violet-800/50 to-cyan-800/50 flex items-center justify-center">
                            <Star className="w-12 h-12 text-violet-400" />
                        </div>
                    )}

                    {/* Overlay */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-violet-900/90 via-transparent to-transparent"
                        animate={{ opacity: isHovered ? 1 : 0.5 }}
                    />

                    {/* Quick add button */}
                    <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: isHovered ? 0 : 20, opacity: isHovered ? 1 : 0 }}
                        onClick={handleAddToCart}
                        className="absolute bottom-4 left-4 right-4 py-3 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl font-bold uppercase tracking-wider text-sm text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <ShoppingBag className="w-4 h-4" />
                            Agregar
                        </span>
                    </motion.button>
                </div>

                {/* Product info */}
                <div className="p-4">
                    <h3 className="text-lg font-bold text-white truncate">
                        {product.name}
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                        <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                            ${product.price.toLocaleString()}
                        </span>
                        {product.stock !== undefined && product.stock < 10 && (
                            <span className="text-xs text-cyan-400 uppercase tracking-wider">
                                Solo {product.stock} left
                            </span>
                        )}
                    </div>
                </div>

                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden">
                    <div
                        className="absolute -top-10 -right-10 w-20 h-20 rotate-45"
                        style={{
                            background: "linear-gradient(180deg, rgba(139, 92, 246, 0.5) 0%, transparent 100%)",
                        }}
                    />
                </div>
            </motion.div>
        </motion.div>
    );
});

// ============================================
// COSMIC SECTION TITLE
// ============================================

const CosmicSectionTitle = memo(function CosmicSectionTitle({
    title,
    subtitle,
}: {
    title: string;
    subtitle?: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
        >
            <h2
                className="text-3xl md:text-5xl font-black uppercase tracking-wider"
                style={{
                    fontFamily: "'Orbitron', sans-serif",
                    background: "linear-gradient(90deg, #8B5CF6 0%, #06B6D4 50%, #8B5CF6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                }}
            >
                {title}
            </h2>
            {subtitle && (
                <p className="mt-3 text-violet-300 tracking-widest uppercase text-sm">
                    {subtitle}
                </p>
            )}

            {/* Decorative line */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : {}}
                transition={{ duration: 1, delay: 0.3 }}
                className="mt-6 mx-auto w-48 h-0.5 bg-gradient-to-r from-transparent via-violet-500 to-transparent"
            />
        </motion.div>
    );
});

// ============================================
// MAIN COSMIC DROP LAYOUT
// ============================================

export function CosmicDropLayout({
    shop,
    products,
    loadingData,
}: CosmicDropLayoutProps) {
    const [showWarp, setShowWarp] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Get drop theme config
    const dropTheme = shop.dropTheme || {
        preset: "cosmic-galaxy",
        slogan: "BEYOND THE STARS",
        primaryColor: "#8B5CF6",
        secondaryColor: "#06B6D4",
        tickerPhrases: ["BEYOND THE STARS", "INFINITE", "COSMIC", "UNIVERSE"],
        animations: {
            starfield: true,
            nebula: true,
            shootingStars: true,
            cosmicDust: true,
            customCursor: true,
            parallax: true,
        },
    };

    const primaryColor = dropTheme.primaryColor || "#8B5CF6";
    const secondaryColor = dropTheme.secondaryColor || "#06B6D4";

    // Parallax effect
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -200]);
    const springY = useSpring(parallaxY, { stiffness: 100, damping: 30 });

    return (
        <div
            ref={containerRef}
            className={cn(
                "min-h-screen text-white overflow-hidden relative font-sans",
                dropTheme.animations?.customCursor && "cosmic-cursor-active"
            )}
            style={{
                background: "linear-gradient(180deg, #030014 0%, #0a0520 50%, #030014 100%)",
            }}
        >
            {/* Entry transition */}
            <AnimatePresence>
                {showWarp && (
                    <GalaxyWarp onComplete={() => setShowWarp(false)} />
                )}
            </AnimatePresence>

            {/* Background effects */}
            {dropTheme.animations?.starfield !== false && (
                <Starfield starColor={primaryColor} speed={0.3} starCount={1500} />
            )}

            {dropTheme.animations?.nebula !== false && (
                <Nebula primaryColor={primaryColor} secondaryColor={secondaryColor} />
            )}

            {dropTheme.animations?.shootingStars !== false && (
                <ShootingStars color={secondaryColor} frequency={4000} />
            )}

            {dropTheme.animations?.cosmicDust !== false && (
                <CosmicDust colors={[primaryColor, secondaryColor, "#ffffff"]} />
            )}

            <Constellation lineColor={`${primaryColor}30`} nodeColor={primaryColor} />
            <Aurora colors={[primaryColor, secondaryColor, "#22D3EE", "#A855F7"]} />

            {/* Decorative planet */}
            <CosmicPlanet
                size={150}
                position={{ top: "5%", right: "5%" }}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
            />

            {/* Custom cursor */}
            {dropTheme.animations?.customCursor !== false && <CosmicCursor />}

            {/* Main content */}
            <div className="relative z-10">
                {/* Hero Section */}
                <CosmicHero
                    slogan={dropTheme.slogan || shop.name}
                    shopName={shop.name}
                    logo={shop.logo}
                />

                {/* Products Section */}
                <section className="relative px-4 md:px-8 py-20 pb-32">
                    <CosmicSectionTitle
                        title="Colección"
                        subtitle="Productos exclusivos de esta galaxia"
                    />

                    {loadingData ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-10 h-10 text-violet-500 animate-spin" />
                        </div>
                    ) : products.length > 0 ? (
                        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product, index) => (
                                <CosmicProductCard
                                    key={product.id}
                                    product={product}
                                    index={index}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <Sparkles className="w-16 h-16 mx-auto text-violet-500 mb-4" />
                            <p className="text-violet-300 text-lg">
                                Próximamente nuevos productos
                            </p>
                        </div>
                    )}
                </section>
            </div>

            {/* Ticker */}
            {dropTheme.tickerPhrases && dropTheme.tickerPhrases.length > 0 && (
                <CosmicTicker phrases={dropTheme.tickerPhrases} />
            )}

            {/* Global styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;700&display=swap');

                .cosmic-cursor-active,
                .cosmic-cursor-active * {
                    cursor: none !important;
                }

                @keyframes cosmicPulse {
                    0%, 100% { opacity: 0.5; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.1); }
                }
            `}} />
        </div>
    );
}
