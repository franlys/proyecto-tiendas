"use client";

import { useEffect, useState, useRef } from "react";
import { type ShopConfig, type Product, type Service } from "@/lib/constants";
import { Loader2 } from "lucide-react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import { ProductGrid } from "@/components/shop";

export interface StreetDropLayoutProps {
    shop: ShopConfig;
    products: Product[];
    services: Service[];
    loadingData: boolean;
}

// 1. Flash-Street Overlay
const FlashOverlay = ({ onComplete }: { onComplete: () => void }) => {
    const words = ["LOVE", "STREET", "ALL", "PURE", "GRIT", "HUSTLE", "RAW", "URBAN"];
    const [activeCells, setActiveCells] = useState<number[]>([]);

    useEffect(() => {
        // Randomly flash cells for a short duration
        const interval = setInterval(() => {
            const newCells = Array.from({ length: 4 }, () => Math.floor(Math.random() * 16));
            setActiveCells(newCells);
        }, 100);

        const timeout = setTimeout(() => {
            clearInterval(interval);
            onComplete();
        }, 800);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
            className="fixed inset-0 z-[100] bg-[#1a1a1a] grid grid-cols-4 grid-rows-4 pointer-events-none mix-blend-normal"
        >
            {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="flex items-center justify-center border border-white/5 relative overflow-hidden">
                    {activeCells.includes(i) && (
                        <motion.span
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute text-white/90 font-black text-2xl md:text-5xl tracking-tighter uppercase font-sans mix-blend-difference"
                        >
                            {words[Math.floor(Math.random() * words.length)]}
                        </motion.span>
                    )}
                </div>
            ))}
        </motion.div>
    );
};

// 2. Love Tag Graffiti SVG
const LoveTagGraffiti = () => {
    return (
        <div className="relative w-full max-w-5xl mx-auto flex justify-center items-center py-32 pointer-events-none mt-20">
            <svg viewBox="0 0 1000 250" className="w-full h-auto drop-shadow-2xl overflow-visible">
                <defs>
                    <filter id="graffiti-grunge" x="-20%" y="-20%" width="140%" height="140%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
                    </filter>
                </defs>
                <motion.text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="transparent"
                    stroke="#FF0033"
                    strokeWidth="3"
                    filter="url(#graffiti-grunge)"
                    className="font-black text-[6rem] md:text-[8rem] italic tracking-tighter"
                    initial={{ strokeDasharray: 2000, strokeDashoffset: 2000 }}
                    animate={{ strokeDashoffset: 0 }}
                    transition={{ duration: 2.5, ease: [0.4, 0, 0.2, 1], delay: 0.5 }}
                >
                    ALL FOR THE LOVE
                </motion.text>
                <motion.text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#FF0033"
                    filter="url(#graffiti-grunge)"
                    className="font-black text-[6rem] md:text-[8rem] italic tracking-tighter"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 2.8 }}
                >
                    ALL FOR THE LOVE
                </motion.text>
            </svg>
        </div>
    );
};

// 3. Ticker
const IndustrialTicker = ({ parallaxX }: { parallaxX: any }) => {
    return (
        <div className="w-full overflow-hidden bg-yellow-400 text-black py-4 border-y-8 border-black rotate-[-2deg] scale-[1.05] my-20 z-20 relative shadow-2xl">
            <motion.div
                className="flex whitespace-nowrap font-black text-3xl md:text-5xl tracking-widest uppercase items-center"
                animate={{ x: [0, -2000] }}
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                style={{ x: parallaxX }} // Apply parallax speed boost
            >
                {Array.from({ length: 40 }).map((_, i) => (
                    <span key={i} className="mx-8 flex items-center">
                        ALL FOR THE LOVE <span className="ml-8 text-black opacity-40">///</span>
                    </span>
                ))}
            </motion.div>
        </div>
    );
};

// Main Layout
export function StreetDropLayout({ shop, products, services, loadingData }: StreetDropLayoutProps) {
    const [showFlash, setShowFlash] = useState(true);
    const containerRef = useRef(null);

    const { scrollY } = useScroll();
    const springScroll = useSpring(scrollY, { damping: 20, stiffness: 100 });

    // Parallax layers
    const bgY = useTransform(springScroll, [0, 2000], [0, 200]); // 0.1x background
    const frontY = useTransform(springScroll, [0, 2000], [0, -800]); // 1.2x floating text

    // Create an offset mapping for ticker depending on scroll
    const [tickerOffset, setTickerOffset] = useState(0);
    useEffect(() => {
        const unsub = scrollY.on("change", (latest) => {
            // Just additive velocity
            const velocity = scrollY.getVelocity();
            if (Math.abs(velocity) > 0) {
                setTickerOffset(prev => prev - (velocity * 0.05));
            }
        });
        return () => unsub();
    }, [scrollY]);

    return (
        <div ref={containerRef} className="min-h-screen bg-[#1a1a1a] text-white overflow-hidden relative font-sans">
            <AnimatePresence>
                {showFlash && <FlashOverlay onComplete={() => setShowFlash(false)} />}
            </AnimatePresence>

            {/* Global Grain Noise overlay */}
            <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.06] mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

            {/* Parallax Background: Brick wall */}
            <motion.div
                style={{ y: bgY, backgroundImage: 'url("https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&q=80")' }}
                className="fixed inset-[-10%] w-[120%] h-[120vh] bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none z-0 grayscale"
            />

            {/* Content wrapper */}
            <div className="relative z-10 w-full pt-10 pb-40">

                {/* Navigation placeholder -> just a back button for the vibe */}
                <nav className="container mx-auto px-6 py-4 flex justify-between items-center relative z-20">
                    <div className="flex items-center gap-2 text-[#FF0033] font-black tracking-widest uppercase">
                        <span className="w-4 h-4 rounded-full bg-[#FF0033] animate-pulse"></span>
                        LIVE DROP
                    </div>
                </nav>

                <LoveTagGraffiti />

                <IndustrialTicker parallaxX={tickerOffset} />

                {/* 5. VHS Glitch Styles */}
                <style dangerouslySetInnerHTML={{
                    __html: `
          .vhs-glitch-container .glass-panel {
             background: rgba(10, 10, 10, 0.95) !important;
             border: 2px solid #333 !important;
             box-shadow: 15px 15px 0px rgba(0,0,0,0.8) !important;
             backdrop-filter: none !important;
             border-radius: 0 !important;
             transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .vhs-glitch-container .glass-panel * {
             border-radius: 0 !important;
          }
          
          /* Aspect Square is normally the Image Container */
          .vhs-glitch-container .aspect-square {
            position: relative;
            overflow: hidden;
            background: #000;
            transition: all 0.1s;
            border-bottom: 2px solid #333;
          }
          .vhs-glitch-container .group:hover .aspect-square {
            filter: contrast(1.2) brightness(1.1);
          }
          
          /* VHS Text/Title overrides */
          .vhs-glitch-container h3 {
             font-weight: 900 !important;
             text-transform: uppercase !important;
             color: white !important;
             font-family: ui-sans-serif, system-ui, sans-serif !important;
          }
          .vhs-glitch-container .text-primary {
             color: #FF0033 !important;
          }

          /* VHS Split Layers */
          .vhs-glitch-container .aspect-square::before,
          .vhs-glitch-container .aspect-square::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background: inherit;
            background-size: cover;
            background-position: center;
            opacity: 0;
            z-index: 10;
            pointer-events: none;
          }
          
          .vhs-glitch-container .group:hover .aspect-square::before {
             content: '';
             position: absolute;
             top: 0; left: 0; width: 100%; height: 100%;
             background-color: rgba(255, 0, 51, 0.2);
             mix-blend-mode: screen;
             transform: translate(-4px, 0);
             animation: glitch-anim-1 0.2s infinite linear alternate-reverse;
             opacity: 1;
             z-index: 20;
          }
          .vhs-glitch-container .group:hover .aspect-square::after {
             content: '';
             position: absolute;
             top: 0; left: 0; width: 100%; height: 100%;
             background-color: rgba(0, 255, 255, 0.2);
             mix-blend-mode: screen;
             transform: translate(4px, 0);
             animation: glitch-anim-2 0.2s infinite linear alternate-reverse;
             opacity: 1;
             z-index: 20;
          }

          @keyframes glitch-anim-1 {
            0% { clip-path: inset(2% 0 95% 0); transform: translate(-2px, 1px); }
            20% { clip-path: inset(15% 0 15% 0); transform: translate(-4px, -1px); }
            40% { clip-path: inset(10% 0 80% 0); transform: translate(-2px, 2px); }
            60% { clip-path: inset(1% 0 98% 0); transform: translate(-5px, -2px); }
            80% { clip-path: inset(33% 0 60% 0); transform: translate(-1px, 1px); }
            100% { clip-path: inset(44% 0 44% 0); transform: translate(-3px, -1px); }
          }
          @keyframes glitch-anim-2 {
            0% { clip-path: inset(50% 0 40% 0); transform: translate(2px, -1px); }
            20% { clip-path: inset(75% 0 20% 0); transform: translate(4px, 1px); }
            40% { clip-path: inset(65% 0 30% 0); transform: translate(2px, -2px); }
            60% { clip-path: inset(90% 0 5% 0); transform: translate(5px, 2px); }
            80% { clip-path: inset(80% 0 10% 0); transform: translate(1px, -1px); }
            100% { clip-path: inset(80% 0 10% 0); transform: translate(3px, 1px); }
          }
        `}} />

                <div className="container mx-auto px-4 lg:px-12 vhs-glitch-container relative z-20">
                    {loadingData ? (
                        <div className="flex justify-center py-32">
                            <Loader2 className="w-16 h-16 text-[#FF0033] animate-spin" />
                        </div>
                    ) : (
                        <div className="mt-12 relative">

                            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between border-b 4 border-zinc-800 pb-6 gap-4">
                                <div>
                                    <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">THE RELEASE.</h2>
                                    <p className="font-mono text-zinc-400 mt-2 uppercase tracking-widest text-sm">Quantities are strictly limited. No restocks.</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-4 py-2 bg-[#FF0033] text-white font-black uppercase text-xl transform skew-x-[-10deg]">
                                        {products.length} ITEMS //
                                    </span>
                                </div>
                            </div>

                            {/* Product Grid Area with its own relative positioning so it doesn't parallax crazily */}
                            <motion.div style={{ y: 0 }} className="relative drop-shadow-[15px_15px_0px_rgba(0,0,0,1)]">
                                <ProductGrid products={products} />
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* Floating Typography Parallax Map */}
                <motion.div
                    style={{ y: frontY }}
                    className="pointer-events-none absolute right-[-10%] top-[40%] text-[8rem] md:text-[20rem] leading-[0.8] font-black text-transparent [-webkit-text-stroke:2px_rgba(255,255,255,0.03)] uppercase break-words w-[120%] text-right z-0 mix-blend-overlay rotate-[-5deg]"
                >
                    ALL FOR<br />THE LOVE
                </motion.div>
            </div>
        </div>
    );
}
