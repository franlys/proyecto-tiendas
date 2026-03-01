"use client";

import { useEffect, useState } from "react";
import { type ManagedShop } from "@/components/shared";
import { type Product, type Service } from "@/lib/constants";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ChevronDown, ShoppingBag } from "lucide-react";
import { ProductGrid } from "@/components/shop";

interface PremiumDropLayoutProps {
    shop: ManagedShop | null;
    products: Product[];
    services: Service[];
    loadingData: boolean;
}

export function PremiumDropLayout({ shop, products, loadingData }: PremiumDropLayoutProps) {
    const [showCatalog, setShowCatalog] = useState(false);
    const { scrollYProgress } = useScroll();
    const yBackground = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
    const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

    // Lock scroll initially so the user focuses on the intro animation
    useEffect(() => {
        if (!showCatalog) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showCatalog]);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">

            {/* 
        ======================================================================
        SECTION 1: THE INTRO / STORY / DROP
        ======================================================================
      */}
            <AnimatePresence>
                {!showCatalog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black overflow-hidden"
                    >
                        {/* Dynamic Background Image / Video for the Drop */}
                        {shop?.banner && (
                            <motion.div
                                initial={{ scale: 1.1, opacity: 0 }}
                                animate={{ scale: 1, opacity: 0.6 }}
                                transition={{ duration: 2, ease: "easeOut" }}
                                className="absolute inset-0"
                            >
                                <img
                                    src={shop.banner}
                                    alt="Drop Background"
                                    className="w-full h-full object-cover grayscale-[30%]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                            </motion.div>
                        )}

                        {/* Typography & Branding */}
                        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-4xl">

                            {shop?.logo && (
                                <motion.img
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 0.8 }}
                                    src={shop.logo}
                                    alt="Brand Logo"
                                    className="w-24 h-24 md:w-32 md:h-32 rounded-none mb-8 filter invert"
                                    style={{ mixBlendMode: 'difference' }}
                                />
                            )}

                            <motion.h1
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
                                className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-none mb-6"
                            >
                                {shop?.name || "THE DROP"}
                            </motion.h1>

                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100px" }}
                                transition={{ delay: 0.8, duration: 1 }}
                                className="h-[2px] bg-white mb-6"
                            />

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1, duration: 0.8 }}
                                className="text-lg md:text-xl text-zinc-400 font-light max-w-2xl leading-relaxed"
                            >
                                {shop?.description || "This is more than clothing. It's a statement. Welcome to the new era of streetwear, designed to break boundaries and set the standard."}
                            </motion.p>

                            {/* Enter Button */}
                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1.5, duration: 0.8 }}
                                onClick={() => setShowCatalog(true)}
                                className="mt-12 group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-black hover:text-white border border-white transition-all overflow-hidden"
                            >
                                <span className="relative z-10">Enter Collection</span>
                                <ChevronDown className="w-4 h-4 relative z-10 group-hover:translate-y-1 transition-transform" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 
        ======================================================================
        SECTION 2: THE MAIN CATALOG VIEWER (Only mounts when intro is cleared)
        ======================================================================
      */}
            {showCatalog && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10"
                >
                    {/* Minimal Header */}
                    <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
                        <div className="font-bold tracking-widest uppercase text-lg">
                            {shop?.name}
                        </div>
                        <div className="text-xs uppercase tracking-widest text-zinc-500">
                            Season 1 // Drop 01
                        </div>
                    </header>

                    <main className="pt-24 pb-32">

                        {/* Hero Banner for the scrolling catalog */}
                        <div className="px-4 md:px-8 mb-16 h-[40vh] md:h-[60vh] flex items-center justify-center relative overflow-hidden group">
                            {shop?.banner && (
                                <motion.img
                                    style={{ y: yBackground }}
                                    src={shop.banner}
                                    className="absolute inset-0 w-full h-[150%] object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-1000"
                                />
                            )}
                            <motion.div style={{ opacity: opacityText }} className="relative z-10 text-center">
                                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">
                                    Latest Arrivals
                                </h2>
                                <p className="mt-4 text-zinc-400 uppercase tracking-widest text-sm">
                                    Limited Quantities available
                                </p>
                            </motion.div>
                        </div>

                        {/* The Drop Grid (We reuse ProductGrid but it will implicitly look nice because of the dark background) */}
                        <div className="container mx-auto px-4 md:px-8">
                            {loadingData ? (
                                <div className="flex justify-center items-center h-64 h-[40vh]">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                        className="w-12 h-12 border-2 border-white border-t-transparent rounded-full"
                                    />
                                </div>
                            ) : (
                                <div className="[&_.glass-panel]:bg-zinc-900/50 [&_.glass-panel]:border-zinc-800 [&_.glass-panel]:rounded-none [&_.text-slate-800]:text-white [&_img]:rounded-none">
                                    {/* CSS Scope Hack to force the standard ProductGrid into a brutalist/dark theme */}
                                    <ProductGrid
                                        products={products}
                                        businessCoordinates={shop?.coordinates}
                                        businessAddress={shop?.contact?.address}
                                    />
                                </div>
                            )}
                        </div>

                    </main>

                    {/* Brutalist Footer */}
                    <footer className="border-t border-white/10 py-12 px-8 bg-zinc-950 text-center">
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">{shop?.name}</h3>
                        <p className="text-zinc-600 text-sm uppercase tracking-widest mb-8">
                            {shop?.slogan || "Built for the streets. Designed for the culture."}
                        </p>
                        <div className="flex justify-center gap-6">
                            {shop?.social?.instagram && (
                                <a href={`https://instagram.com/${shop.social.instagram.replace('@', '')}`} className="text-zinc-500 hover:text-white uppercase text-xs tracking-widest transition-colors">Instagram</a>
                            )}
                            {shop?.social?.website && (
                                <a href={shop.social.website} className="text-zinc-500 hover:text-white uppercase text-xs tracking-widest transition-colors">Website</a>
                            )}
                        </div>
                        <p className="mt-12 text-zinc-800 text-xs">
                            © {new Date().getFullYear()} {shop?.name}. ALL RIGHTS RESERVED.
                        </p>
                    </footer>
                </motion.div>
            )}

        </div>
    );
}
