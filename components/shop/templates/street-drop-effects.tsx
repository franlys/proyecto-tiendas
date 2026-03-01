"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

// ==============================================
// 1. STICKER SLAP EFFECT
// Click anywhere to place "ALL FOR THE LOVE" stickers
// ==============================================
const STICKER_PHRASES = ["ALL FOR THE LOVE", "LOVE", "STREET", "RAW", "HUSTLE", "GRIT"];
const STICKER_EMOJIS = ["🔥", "💯", "⚡", "💀", "🖤", "⭐"];

interface Sticker {
    id: number;
    x: number;
    y: number;
    rotation: number;
    phrase: string;
    emoji: string;
    scale: number;
}

export function StickerSlapEffect() {
    const [stickers, setStickers] = useState<Sticker[]>([]);
    const stickerIdRef = useRef(0);

    const handleClick = useCallback((e: MouseEvent) => {
        // Ignore clicks on interactive elements
        const target = e.target as HTMLElement;
        if (
            target.closest("button") ||
            target.closest("a") ||
            target.closest("input") ||
            target.closest("[role='button']") ||
            target.closest(".glass-panel")
        ) {
            return;
        }

        const newSticker: Sticker = {
            id: stickerIdRef.current++,
            x: e.pageX,
            y: e.pageY,
            rotation: Math.random() * 40 - 20, // -20 to 20 degrees
            phrase: STICKER_PHRASES[Math.floor(Math.random() * STICKER_PHRASES.length)],
            emoji: STICKER_EMOJIS[Math.floor(Math.random() * STICKER_EMOJIS.length)],
            scale: 0.8 + Math.random() * 0.4, // 0.8 to 1.2
        };

        setStickers((prev) => [...prev.slice(-10), newSticker]); // Keep max 11 stickers

        // Remove sticker after 3 seconds
        setTimeout(() => {
            setStickers((prev) => prev.filter((s) => s.id !== newSticker.id));
        }, 3000);
    }, []);

    useEffect(() => {
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, [handleClick]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[60]">
            <AnimatePresence>
                {stickers.map((sticker) => (
                    <motion.div
                        key={sticker.id}
                        initial={{ scale: 0, opacity: 0, rotate: sticker.rotation - 20 }}
                        animate={{ scale: sticker.scale, opacity: 1, rotate: sticker.rotation }}
                        exit={{ scale: 0, opacity: 0, rotate: sticker.rotation + 20 }}
                        transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 25,
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: sticker.x,
                            top: sticker.y,
                            // Safari-compatible transform
                            WebkitTransform: `rotate(${sticker.rotation}deg)`,
                        }}
                    >
                        <div className="relative">
                            {/* Sticker body */}
                            <div className="bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_rgba(0,0,0,1)] font-black text-black text-sm md:text-base uppercase tracking-tight whitespace-nowrap select-none">
                                <span className="mr-2">{sticker.emoji}</span>
                                {sticker.phrase}
                            </div>
                            {/* Corner fold effect */}
                            <div
                                className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 border-2 border-black"
                                style={{
                                    clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                                    WebkitClipPath: "polygon(100% 0, 100% 100%, 0 100%)"
                                }}
                            />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

// ==============================================
// 2. STENCIL MASK / FLASHLIGHT EFFECT
// Reveals hidden text as cursor moves
// ==============================================
interface StencilMaskProps {
    text?: string;
    className?: string;
}

export function StencilMaskReveal({ text = "ALL FOR THE LOVE", className = "" }: StencilMaskProps) {
    const maskX = useMotionValue(0);
    const maskY = useMotionValue(0);

    // Smooth lerp effect for more natural feel
    const smoothX = useSpring(maskX, { damping: 25, stiffness: 150 });
    const smoothY = useSpring(maskY, { damping: 25, stiffness: 150 });

    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        maskX.set(e.clientX - rect.left);
        maskY.set(e.clientY - rect.top);
    }, [maskX, maskY]);

    // Handle touch for mobile/iOS Safari
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!containerRef.current || e.touches.length === 0) return;
        const rect = containerRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        maskX.set(touch.clientX - rect.left);
        maskY.set(touch.clientY - rect.top);
    }, [maskX, maskY]);

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onTouchStart={() => setIsHovering(true)}
            onTouchEnd={() => setIsHovering(false)}
            className={`relative overflow-hidden cursor-none select-none ${className}`}
        >
            {/* Hidden layer (dark) */}
            <div className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-zinc-900">
                {text}
            </div>

            {/* Revealed layer with mask */}
            <motion.div
                className="absolute inset-0 text-4xl md:text-7xl font-black uppercase tracking-tighter text-white"
                style={{
                    // Safari-compatible mask
                    WebkitMaskImage: `radial-gradient(circle 80px at var(--mask-x) var(--mask-y), white 0%, transparent 100%)`,
                    maskImage: `radial-gradient(circle 80px at var(--mask-x) var(--mask-y), white 0%, transparent 100%)`,
                    opacity: isHovering ? 1 : 0,
                    transition: "opacity 0.3s ease",
                }}
            >
                <motion.div
                    style={{
                        ["--mask-x" as any]: smoothX,
                        ["--mask-y" as any]: smoothY,
                    }}
                >
                    {text}
                </motion.div>
            </motion.div>

            {/* Custom cursor / flashlight glow */}
            <AnimatePresence>
                {isHovering && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute pointer-events-none w-40 h-40 -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: smoothX,
                            top: smoothY,
                            background: "radial-gradient(circle, rgba(255,0,51,0.3) 0%, transparent 70%)",
                            filter: "blur(10px)",
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ==============================================
// 3. SHUTTER TRANSITION (Metal Blinds)
// ==============================================
interface ShutterTransitionProps {
    isOpen: boolean;
    onComplete?: () => void;
    sloganText?: string;
}

export function ShutterTransition({ isOpen, onComplete, sloganText = "ALL FOR THE LOVE" }: ShutterTransitionProps) {
    const SLAT_COUNT = 10;

    return (
        <AnimatePresence onExitComplete={onComplete}>
            {!isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100] flex flex-col overflow-hidden"
                    initial="closed"
                    animate="closed"
                    exit="open"
                    variants={{
                        open: {},
                        closed: {},
                    }}
                >
                    {/* Metal slats */}
                    {Array.from({ length: SLAT_COUNT }).map((_, i) => (
                        <motion.div
                            key={i}
                            className="flex-1 relative overflow-hidden"
                            style={{
                                background: `linear-gradient(180deg,
                                    #3a3a3a 0%,
                                    #4a4a4a 10%,
                                    #5a5a5a 30%,
                                    #4a4a4a 70%,
                                    #3a3a3a 90%,
                                    #2a2a2a 100%
                                )`,
                                borderTop: i === 0 ? "none" : "1px solid #222",
                                borderBottom: "1px solid #555",
                            }}
                            variants={{
                                open: {
                                    scaleY: 0,
                                    originY: i % 2 === 0 ? 0 : 1,
                                },
                                closed: {
                                    scaleY: 1,
                                },
                            }}
                            transition={{
                                duration: 0.4,
                                delay: i * 0.05,
                                ease: [0.4, 0, 0.2, 1],
                            }}
                        >
                            {/* Metal texture lines */}
                            <div
                                className="absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage: "repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 21px)",
                                }}
                            />
                        </motion.div>
                    ))}

                    {/* Center slogan (visible when closed) */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        variants={{
                            open: { opacity: 0 },
                            closed: { opacity: 1 },
                        }}
                        transition={{ duration: 0.2 }}
                    >
                        <h1 className="text-4xl md:text-8xl font-black uppercase tracking-tighter text-white drop-shadow-[0_0_30px_rgba(255,0,51,0.5)] text-center">
                            {sloganText}
                        </h1>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ==============================================
// 4. X-RAY / BLUEPRINT IMAGE LOADING
// ==============================================
interface XRayImageProps {
    src: string;
    alt: string;
    className?: string;
}

export function XRayImage({ src, alt, className = "" }: XRayImageProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const [imageSrc, setImageSrc] = useState("");

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            setImageSrc(src);
            // Small delay for effect
            setTimeout(() => setIsLoaded(true), 100);
        };
    }, [src]);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Blueprint/X-Ray layer (visible during load) */}
            <div
                className={`absolute inset-0 transition-opacity duration-700 ${isLoaded ? "opacity-0" : "opacity-100"}`}
                style={{
                    filter: "invert(1) grayscale(1) contrast(1.2)",
                    WebkitFilter: "invert(1) grayscale(1) contrast(1.2)"
                }}
            >
                {imageSrc && (
                    <img src={imageSrc} alt={alt} className="w-full h-full object-cover" />
                )}
                {/* Grid overlay */}
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(0,255,255,0.3) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,255,255,0.3) 1px, transparent 1px)
                        `,
                        backgroundSize: "20px 20px",
                    }}
                />
                {/* Coordinates text */}
                <div className="absolute top-2 left-2 font-mono text-xs text-cyan-400 opacity-50">
                    LOADING...
                </div>
            </div>

            {/* Final image (fades in when loaded) */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isLoaded ? 1 : 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10"
            >
                {imageSrc && (
                    <img src={imageSrc} alt={alt} className="w-full h-full object-cover" />
                )}
            </motion.div>
        </div>
    );
}

// ==============================================
// 5. CURSOR FOLLOWER (Custom cursor)
// ==============================================
export function StreetCursor() {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);
    const springX = useSpring(cursorX, { damping: 25, stiffness: 200 });
    const springY = useSpring(cursorY, { damping: 25, stiffness: 200 });

    const [isPointer, setIsPointer] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Don't show custom cursor on touch devices
        if ("ontouchstart" in window) return;

        const handleMouseMove = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
            setIsVisible(true);
        };

        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseLeave = () => setIsVisible(false);

        const handlePointerOver = (e: PointerEvent) => {
            const target = e.target as HTMLElement;
            const isClickable =
                target.tagName === "BUTTON" ||
                target.tagName === "A" ||
                target.closest("button") ||
                target.closest("a") ||
                target.closest("[role='button']") ||
                getComputedStyle(target).cursor === "pointer";
            setIsPointer(isClickable);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseenter", handleMouseEnter);
        window.addEventListener("mouseleave", handleMouseLeave);
        document.addEventListener("pointerover", handlePointerOver);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseenter", handleMouseEnter);
            window.removeEventListener("mouseleave", handleMouseLeave);
            document.removeEventListener("pointerover", handlePointerOver);
        };
    }, [cursorX, cursorY]);

    // Don't render on touch devices
    if (typeof window !== "undefined" && "ontouchstart" in window) {
        return null;
    }

    return (
        <>
            {/* Hide default cursor on the page */}
            <style dangerouslySetInnerHTML={{ __html: `
                .street-drop-cursor-active * {
                    cursor: none !important;
                }
            `}} />

            {/* Custom cursor */}
            <motion.div
                className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
                style={{
                    x: springX,
                    y: springY,
                    opacity: isVisible ? 1 : 0,
                }}
            >
                {/* Outer ring */}
                <motion.div
                    className="absolute -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-full"
                    animate={{
                        width: isPointer ? 50 : 30,
                        height: isPointer ? 50 : 30,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
                {/* Inner dot */}
                <motion.div
                    className="absolute -translate-x-1/2 -translate-y-1/2 bg-[#FF0033] rounded-full"
                    animate={{
                        width: isPointer ? 10 : 6,
                        height: isPointer ? 10 : 6,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
            </motion.div>
        </>
    );
}

// ==============================================
// 6. SPRAY PAINT EFFECT (on hover)
// ==============================================
interface SprayPaintEffectProps {
    children: React.ReactNode;
    color?: string;
}

export function SprayPaintEffect({ children, color = "#FF0033" }: SprayPaintEffectProps) {
    const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number }[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const particleIdRef = useRef(0);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Add spray particles
        const newParticles = Array.from({ length: 3 }, () => ({
            id: particleIdRef.current++,
            x: x + (Math.random() - 0.5) * 40,
            y: y + (Math.random() - 0.5) * 40,
            size: 2 + Math.random() * 6,
        }));

        setParticles((prev) => [...prev.slice(-50), ...newParticles]);

        // Clean up old particles
        setTimeout(() => {
            setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
        }, 1000);
    }, []);

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative overflow-hidden"
        >
            {children}

            {/* Spray particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        initial={{ scale: 0, opacity: 0.8 }}
                        animate={{ scale: 1, opacity: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="absolute rounded-full"
                        style={{
                            left: particle.x,
                            top: particle.y,
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: color,
                            transform: "translate(-50%, -50%)",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
