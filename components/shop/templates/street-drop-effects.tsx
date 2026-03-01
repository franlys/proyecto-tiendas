"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

// ==============================================
// PERFORMANCE UTILITIES
// ==============================================

// Check for reduced motion preference (accessibility)
function usePrefersReducedMotion(): boolean {
    const prefersReducedMotion = useReducedMotion();
    return prefersReducedMotion ?? false;
}

// Throttle function for smoother event handling - uses requestAnimationFrame
function useThrottledCallback<T extends (...args: any[]) => void>(callback: T, delay: number = 16): T {
    const lastCall = useRef(0);
    const rafId = useRef<number | undefined>(undefined);
    const pendingArgs = useRef<Parameters<T> | undefined>(undefined);

    useEffect(() => {
        return () => {
            if (rafId.current) {
                cancelAnimationFrame(rafId.current);
            }
        };
    }, []);

    return useCallback((...args: Parameters<T>) => {
        const now = performance.now();
        pendingArgs.current = args;

        if (now - lastCall.current >= delay) {
            lastCall.current = now;
            callback(...args);
        } else if (!rafId.current) {
            rafId.current = requestAnimationFrame(() => {
                lastCall.current = performance.now();
                if (pendingArgs.current) {
                    callback(...pendingArgs.current);
                }
                rafId.current = undefined;
            });
        }
    }, [callback, delay]) as T;
}

// GPU-optimized spring config - smoother and faster
const SMOOTH_SPRING = {
    type: "spring" as const,
    stiffness: 200,
    damping: 30,
    mass: 0.5,
    restDelta: 0.001, // Stops animation sooner for performance
};

// Fast spring for immediate feedback
const FAST_SPRING = {
    type: "spring" as const,
    stiffness: 400,
    damping: 40,
    mass: 0.3,
    restDelta: 0.001,
};

// Ultra-smooth spring for cursor following
const CURSOR_SPRING = {
    damping: 25,
    stiffness: 300,
    mass: 0.2,
    restDelta: 0.001,
};

// GPU acceleration style hints
const GPU_ACCELERATED_STYLE: React.CSSProperties = {
    willChange: "transform, opacity",
    transform: "translateZ(0)",
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
} as React.CSSProperties;

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
    const prefersReducedMotion = usePrefersReducedMotion();

    const handleClick = useCallback((e: MouseEvent) => {
        // Skip effect if user prefers reduced motion
        if (prefersReducedMotion) return;

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
    }, [prefersReducedMotion]);

    useEffect(() => {
        // Use passive event listener for better scroll performance
        window.addEventListener("click", handleClick, { passive: true });
        return () => window.removeEventListener("click", handleClick);
    }, [handleClick]);

    // Don't render anything if reduced motion is preferred
    if (prefersReducedMotion) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[40]" style={GPU_ACCELERATED_STYLE}>
            <AnimatePresence mode="popLayout">
                {stickers.map((sticker) => (
                    <motion.div
                        key={sticker.id}
                        initial={{ scale: 0, opacity: 0, rotate: sticker.rotation - 15 }}
                        animate={{ scale: sticker.scale, opacity: 1, rotate: sticker.rotation }}
                        exit={{ scale: 0.5, opacity: 0, rotate: sticker.rotation + 10 }}
                        transition={FAST_SPRING}
                        className="absolute -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: sticker.x,
                            top: sticker.y,
                            ...GPU_ACCELERATED_STYLE,
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
    const prefersReducedMotion = usePrefersReducedMotion();

    // Smooth lerp effect for more natural feel - GPU optimized springs
    const smoothX = useSpring(maskX, CURSOR_SPRING);
    const smoothY = useSpring(maskY, CURSOR_SPRING);

    const containerRef = useRef<HTMLDivElement>(null);
    const [isHovering, setIsHovering] = useState(false);

    // Throttled mouse move handler using RAF for smooth 60fps updates
    const updateMaskPosition = useCallback((clientX: number, clientY: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        maskX.set(clientX - rect.left);
        maskY.set(clientY - rect.top);
    }, [maskX, maskY]);

    const throttledUpdatePosition = useThrottledCallback(updateMaskPosition, 8); // ~120fps

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        throttledUpdatePosition(e.clientX, e.clientY);
    }, [throttledUpdatePosition]);

    // Handle touch for mobile/iOS Safari - also throttled
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 0) return;
        const touch = e.touches[0];
        throttledUpdatePosition(touch.clientX, touch.clientY);
    }, [throttledUpdatePosition]);

    // Don't render complex effects if reduced motion is preferred
    if (prefersReducedMotion) {
        return (
            <div className={`relative overflow-hidden select-none ${className}`}>
                <div className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-white">
                    {text}
                </div>
            </div>
        );
    }

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
            style={GPU_ACCELERATED_STYLE}
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
                    transition: "opacity 0.2s ease-out",
                    ...GPU_ACCELERATED_STYLE,
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
            <AnimatePresence mode="wait">
                {isHovering && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={SMOOTH_SPRING}
                        className="absolute pointer-events-none w-40 h-40 -translate-x-1/2 -translate-y-1/2"
                        style={{
                            left: smoothX,
                            top: smoothY,
                            background: "radial-gradient(circle, rgba(255,0,51,0.3) 0%, transparent 70%)",
                            filter: "blur(10px)",
                            WebkitFilter: "blur(10px)",
                            ...GPU_ACCELERATED_STYLE,
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
    const prefersReducedMotion = usePrefersReducedMotion();

    // Memoize slat data to avoid recalculation on each render
    const slats = useMemo(() =>
        Array.from({ length: SLAT_COUNT }, (_, i) => ({
            id: i,
            originY: i % 2 === 0 ? 0 : 1,
            delay: prefersReducedMotion ? 0 : i * 0.04, // Faster stagger
        })),
        [prefersReducedMotion]
    );

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
                    style={GPU_ACCELERATED_STYLE}
                >
                    {/* Metal slats */}
                    {slats.map((slat) => (
                        <motion.div
                            key={slat.id}
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
                                borderTop: slat.id === 0 ? "none" : "1px solid #222",
                                borderBottom: "1px solid #555",
                                ...GPU_ACCELERATED_STYLE,
                            }}
                            variants={{
                                open: {
                                    scaleY: 0,
                                    originY: slat.originY,
                                },
                                closed: {
                                    scaleY: 1,
                                },
                            }}
                            transition={prefersReducedMotion ? { duration: 0.1 } : {
                                duration: 0.35,
                                delay: slat.delay,
                                ease: [0.22, 1, 0.36, 1], // Smoother easing
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
                        transition={{ duration: 0.15 }}
                        style={GPU_ACCELERATED_STYLE}
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
    const prefersReducedMotion = usePrefersReducedMotion();

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => {
            setImageSrc(src);
            // Small delay for effect (skip if reduced motion)
            if (prefersReducedMotion) {
                setIsLoaded(true);
            } else {
                requestAnimationFrame(() => {
                    setTimeout(() => setIsLoaded(true), 50);
                });
            }
        };
    }, [src, prefersReducedMotion]);

    // Simple fallback for reduced motion
    if (prefersReducedMotion) {
        return (
            <div className={`relative overflow-hidden ${className}`}>
                {imageSrc && (
                    <img src={imageSrc} alt={alt} className="w-full h-full object-cover" />
                )}
            </div>
        );
    }

    return (
        <div className={`relative overflow-hidden ${className}`} style={GPU_ACCELERATED_STYLE}>
            {/* Blueprint/X-Ray layer (visible during load) */}
            <div
                className={`absolute inset-0 ${isLoaded ? "opacity-0" : "opacity-100"}`}
                style={{
                    filter: "invert(1) grayscale(1) contrast(1.2)",
                    WebkitFilter: "invert(1) grayscale(1) contrast(1.2)",
                    transition: "opacity 0.5s ease-out",
                    ...GPU_ACCELERATED_STYLE,
                }}
            >
                {imageSrc && (
                    <img src={imageSrc} alt={alt} className="w-full h-full object-cover" loading="lazy" />
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
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative z-10"
                style={GPU_ACCELERATED_STYLE}
            >
                {imageSrc && (
                    <img src={imageSrc} alt={alt} className="w-full h-full object-cover" loading="lazy" />
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
    const prefersReducedMotion = usePrefersReducedMotion();

    // Ultra-smooth cursor following with GPU-optimized springs
    const springX = useSpring(cursorX, CURSOR_SPRING);
    const springY = useSpring(cursorY, CURSOR_SPRING);

    const [isPointer, setIsPointer] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    // Detect touch device on mount
    useEffect(() => {
        setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
    }, []);

    // Throttled pointer check to avoid expensive getComputedStyle calls
    const checkPointerState = useThrottledCallback((target: HTMLElement) => {
        const isClickable =
            target.tagName === "BUTTON" ||
            target.tagName === "A" ||
            target.tagName === "INPUT" ||
            !!target.closest("button") ||
            !!target.closest("a") ||
            !!target.closest("[role='button']") ||
            target.dataset.clickable === "true";
        setIsPointer(isClickable);
    }, 50);

    useEffect(() => {
        // Don't show custom cursor on touch devices or reduced motion
        if (isTouchDevice || prefersReducedMotion) return;

        // Use RAF-based throttling for mouse move
        let rafId: number | null = null;
        const handleMouseMove = (e: MouseEvent) => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                cursorX.set(e.clientX);
                cursorY.set(e.clientY);
                if (!isVisible) setIsVisible(true);
                rafId = null;
            });
        };

        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseLeave = () => setIsVisible(false);

        const handlePointerOver = (e: PointerEvent) => {
            checkPointerState(e.target as HTMLElement);
        };

        // Use passive listeners for better scroll performance
        window.addEventListener("mousemove", handleMouseMove, { passive: true });
        window.addEventListener("mouseenter", handleMouseEnter, { passive: true });
        window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
        document.addEventListener("pointerover", handlePointerOver, { passive: true });

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseenter", handleMouseEnter);
            window.removeEventListener("mouseleave", handleMouseLeave);
            document.removeEventListener("pointerover", handlePointerOver);
        };
    }, [cursorX, cursorY, isTouchDevice, prefersReducedMotion, isVisible, checkPointerState]);

    // Don't render on touch devices or if reduced motion is preferred
    if (isTouchDevice || prefersReducedMotion) {
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
                    ...GPU_ACCELERATED_STYLE,
                }}
            >
                {/* Outer ring */}
                <motion.div
                    className="absolute -translate-x-1/2 -translate-y-1/2 border-2 border-white rounded-full"
                    animate={{
                        width: isPointer ? 50 : 30,
                        height: isPointer ? 50 : 30,
                    }}
                    transition={FAST_SPRING}
                    style={GPU_ACCELERATED_STYLE}
                />
                {/* Inner dot */}
                <motion.div
                    className="absolute -translate-x-1/2 -translate-y-1/2 bg-[#FF0033] rounded-full"
                    animate={{
                        width: isPointer ? 10 : 6,
                        height: isPointer ? 10 : 6,
                    }}
                    transition={FAST_SPRING}
                    style={GPU_ACCELERATED_STYLE}
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
    const prefersReducedMotion = usePrefersReducedMotion();

    // Throttled spray generation for smoother performance
    const createSprayParticles = useCallback((x: number, y: number) => {
        // Add spray particles - fewer particles for better performance
        const newParticles = Array.from({ length: 2 }, () => ({
            id: particleIdRef.current++,
            x: x + (Math.random() - 0.5) * 40,
            y: y + (Math.random() - 0.5) * 40,
            size: 2 + Math.random() * 5,
        }));

        setParticles((prev) => [...prev.slice(-30), ...newParticles]); // Reduced max particles

        // Clean up old particles
        setTimeout(() => {
            setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
        }, 800);
    }, []);

    const throttledCreateParticles = useThrottledCallback(createSprayParticles, 32); // ~30fps for particles

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!containerRef.current || prefersReducedMotion) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        throttledCreateParticles(x, y);
    }, [throttledCreateParticles, prefersReducedMotion]);

    // Don't render particles if reduced motion is preferred
    if (prefersReducedMotion) {
        return (
            <div ref={containerRef} className="relative overflow-hidden">
                {children}
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative overflow-hidden"
        >
            {children}

            {/* Spray particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={GPU_ACCELERATED_STYLE}>
                {particles.map((particle) => (
                    <motion.div
                        key={particle.id}
                        initial={{ scale: 0, opacity: 0.7 }}
                        animate={{ scale: 1, opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute rounded-full"
                        style={{
                            left: particle.x,
                            top: particle.y,
                            width: particle.size,
                            height: particle.size,
                            backgroundColor: color,
                            transform: "translate(-50%, -50%)",
                            ...GPU_ACCELERATED_STYLE,
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
