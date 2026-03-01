"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================
// DOPAMINE CONTEXT
// Central system for managing micro-interactions
// ============================================

interface DopamineContextType {
    // Trigger effects
    triggerSlam: (x: number, y: number, emojis?: string[]) => void;
    triggerRipple: (x: number, y: number, color?: string) => void;
    triggerConfetti: (x: number, y: number) => void;
    triggerShake: () => void;
    triggerGlitch: () => void;

    // State
    isGlitching: boolean;
}

const DopamineContext = createContext<DopamineContextType | null>(null);

export function useDopamine() {
    const context = useContext(DopamineContext);
    if (!context) {
        throw new Error("useDopamine must be used within DopamineProvider");
    }
    return context;
}

// ============================================
// PARTICLE TYPES
// ============================================

interface SlamParticle {
    id: number;
    x: number;
    y: number;
    emoji: string;
    offsetX: number;
    offsetY: number;
    rotation: number;
    scale: number;
}

interface RippleParticle {
    id: number;
    x: number;
    y: number;
    color: string;
}

interface ConfettiParticle {
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    offsetX: number;
    offsetY: number;
}

// ============================================
// PROVIDER COMPONENT
// ============================================

const DEFAULT_EMOJIS = ["🔥", "💯", "⚡", "🖤", "💀", "⭐", "🎯", "💪"];
const CONFETTI_COLORS = ["#FF0033", "#FFD700", "#00FF00", "#00FFFF", "#FF00FF", "#FFFFFF"];

export function DopamineProvider({ children }: { children: ReactNode }) {
    const [slamParticles, setSlamParticles] = useState<SlamParticle[]>([]);
    const [ripples, setRipples] = useState<RippleParticle[]>([]);
    const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);
    const [isGlitching, setIsGlitching] = useState(false);
    const [isShaking, setIsShaking] = useState(false);

    const particleIdRef = useRef(0);

    // GPU acceleration
    const gpuStyle: React.CSSProperties = {
        willChange: "transform, opacity",
        transform: "translateZ(0)",
        backfaceVisibility: "hidden",
    };

    // Trigger slam effect (emojis flying out)
    const triggerSlam = useCallback((x: number, y: number, emojis = DEFAULT_EMOJIS) => {
        const newParticles: SlamParticle[] = Array.from({ length: 8 }, () => ({
            id: particleIdRef.current++,
            x,
            y,
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            offsetX: (Math.random() - 0.5) * 200,
            offsetY: -Math.random() * 150 - 50,
            rotation: Math.random() * 720 - 360,
            scale: 0.8 + Math.random() * 0.6,
        }));

        setSlamParticles(prev => [...prev, ...newParticles]);

        // Haptic feedback simulation (vibration on supported devices)
        if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate([50, 30, 50]);
        }

        // Clean up after animation
        setTimeout(() => {
            setSlamParticles(prev =>
                prev.filter(p => !newParticles.find(np => np.id === p.id))
            );
        }, 1000);
    }, []);

    // Trigger ripple effect (expanding circle)
    const triggerRipple = useCallback((x: number, y: number, color = "#FF0033") => {
        const newRipple: RippleParticle = {
            id: particleIdRef.current++,
            x,
            y,
            color,
        };

        setRipples(prev => [...prev, newRipple]);

        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== newRipple.id));
        }, 600);
    }, []);

    // Trigger confetti effect
    const triggerConfetti = useCallback((x: number, y: number) => {
        const newConfetti: ConfettiParticle[] = Array.from({ length: 20 }, () => ({
            id: particleIdRef.current++,
            x,
            y,
            color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
            rotation: Math.random() * 720,
            offsetX: (Math.random() - 0.5) * 300,
            offsetY: -Math.random() * 200 - 100,
        }));

        setConfetti(prev => [...prev, ...newConfetti]);

        setTimeout(() => {
            setConfetti(prev =>
                prev.filter(c => !newConfetti.find(nc => nc.id === c.id))
            );
        }, 1500);
    }, []);

    // Trigger screen shake
    const triggerShake = useCallback(() => {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 300);
    }, []);

    // Trigger glitch effect
    const triggerGlitch = useCallback(() => {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 200);
    }, []);

    return (
        <DopamineContext.Provider
            value={{
                triggerSlam,
                triggerRipple,
                triggerConfetti,
                triggerShake,
                triggerGlitch,
                isGlitching,
            }}
        >
            {/* Main container with shake effect */}
            <div
                className={cn(
                    "relative",
                    isShaking && "animate-[shake_0.3s_ease-in-out]"
                )}
            >
                {children}
            </div>

            {/* Glitch overlay */}
            <AnimatePresence>
                {isGlitching && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 pointer-events-none z-[9999] mix-blend-screen"
                        style={{
                            background: "repeating-linear-gradient(0deg, rgba(255,0,51,0.1) 0px, transparent 2px, transparent 4px)",
                            ...gpuStyle,
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Slam particles layer */}
            <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden">
                <AnimatePresence>
                    {slamParticles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            initial={{
                                x: particle.x,
                                y: particle.y,
                                scale: 0,
                                rotate: 0,
                                opacity: 1,
                            }}
                            animate={{
                                x: particle.x + particle.offsetX,
                                y: particle.y + particle.offsetY,
                                scale: particle.scale,
                                rotate: particle.rotation,
                                opacity: 0,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 0.8,
                                ease: [0.2, 0.8, 0.2, 1],
                            }}
                            className="absolute text-3xl"
                            style={{ ...gpuStyle }}
                        >
                            {particle.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Ripple layer */}
            <div className="fixed inset-0 pointer-events-none z-[9997] overflow-hidden">
                <AnimatePresence>
                    {ripples.map((ripple) => (
                        <motion.div
                            key={ripple.id}
                            initial={{
                                x: ripple.x,
                                y: ripple.y,
                                scale: 0,
                                opacity: 0.6,
                            }}
                            animate={{
                                scale: 3,
                                opacity: 0,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="absolute w-20 h-20 rounded-full -translate-x-1/2 -translate-y-1/2"
                            style={{
                                background: `radial-gradient(circle, ${ripple.color} 0%, transparent 70%)`,
                                ...gpuStyle,
                            }}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Confetti layer */}
            <div className="fixed inset-0 pointer-events-none z-[9996] overflow-hidden">
                <AnimatePresence>
                    {confetti.map((piece) => (
                        <motion.div
                            key={piece.id}
                            initial={{
                                x: piece.x,
                                y: piece.y,
                                scale: 1,
                                rotate: 0,
                                opacity: 1,
                            }}
                            animate={{
                                x: piece.x + piece.offsetX,
                                y: piece.y + piece.offsetY + 200,
                                scale: 0.5,
                                rotate: piece.rotation,
                                opacity: 0,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 1.2,
                                ease: [0.2, 0.8, 0.4, 1],
                            }}
                            className="absolute w-2 h-3"
                            style={{
                                backgroundColor: piece.color,
                                ...gpuStyle,
                            }}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* CSS for shake animation */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
            `}} />
        </DopamineContext.Provider>
    );
}

// ============================================
// INTERACTIVE BUTTON COMPONENT
// Button with built-in dopamine effects
// ============================================

interface InteractiveButtonProps {
    children: ReactNode;
    onClick?: (e: React.MouseEvent) => void;
    variant?: "primary" | "secondary" | "ghost";
    effect?: "slam" | "ripple" | "confetti" | "none";
    className?: string;
    disabled?: boolean;
}

export function InteractiveButton({
    children,
    onClick,
    variant = "primary",
    effect = "slam",
    className,
    disabled = false,
}: InteractiveButtonProps) {
    const dopamine = useDopamine();
    const buttonRef = useRef<HTMLButtonElement>(null);

    const handleClick = (e: React.MouseEvent) => {
        if (disabled) return;

        const rect = buttonRef.current?.getBoundingClientRect();
        const x = rect ? rect.left + rect.width / 2 : e.clientX;
        const y = rect ? rect.top : e.clientY;

        switch (effect) {
            case "slam":
                dopamine.triggerSlam(x, y);
                dopamine.triggerShake();
                break;
            case "ripple":
                dopamine.triggerRipple(e.clientX, e.clientY);
                break;
            case "confetti":
                dopamine.triggerConfetti(x, y);
                break;
        }

        onClick?.(e);
    };

    const variantStyles = {
        primary: "bg-red-500 text-white border-red-500 hover:bg-black hover:text-red-500",
        secondary: "bg-black text-red-500 border-red-500 hover:bg-red-500 hover:text-white",
        ghost: "bg-transparent text-red-500 border-transparent hover:border-red-500",
    };

    return (
        <motion.button
            ref={buttonRef}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClick}
            disabled={disabled}
            className={cn(
                "relative px-6 py-3 font-black uppercase tracking-widest text-sm",
                "border-2 transition-colors duration-200",
                "shadow-[3px_3px_0px_rgba(0,0,0,1)]",
                "active:shadow-none active:translate-x-[3px] active:translate-y-[3px]",
                variantStyles[variant],
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
            style={{
                willChange: "transform",
            }}
        >
            {children}
        </motion.button>
    );
}

// ============================================
// PRODUCT CARD WRAPPER
// Adds hover and interaction effects to product cards
// ============================================

interface ProductCardWrapperProps {
    children: ReactNode;
    onAddToCart?: () => void;
    className?: string;
}

export function ProductCardWrapper({
    children,
    onAddToCart,
    className,
}: ProductCardWrapperProps) {
    const dopamine = useDopamine();
    const cardRef = useRef<HTMLDivElement>(null);

    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const springRotateX = useSpring(rotateX, { stiffness: 200, damping: 20 });
    const springRotateY = useSpring(rotateY, { stiffness: 200, damping: 20 });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        // Subtle tilt effect
        rotateY.set(mouseX * 0.02);
        rotateX.set(-mouseY * 0.02);
    };

    const handleMouseLeave = () => {
        rotateX.set(0);
        rotateY.set(0);
    };

    const handleAddToCart = () => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        dopamine.triggerSlam(x, y);
        dopamine.triggerGlitch();

        onAddToCart?.();
    };

    return (
        <motion.div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                rotateX: springRotateX,
                rotateY: springRotateY,
                transformPerspective: 1000,
                transformStyle: "preserve-3d",
            }}
            className={cn(
                "group relative transition-all duration-300",
                className
            )}
        >
            {children}
        </motion.div>
    );
}

// ============================================
// SCROLL REVEAL COMPONENT
// Reveals content with effects as it enters viewport
// ============================================

interface ScrollRevealProps {
    children: ReactNode;
    effect?: "fade" | "slide-up" | "slide-left" | "glitch";
    delay?: number;
    className?: string;
}

export function ScrollReveal({
    children,
    effect = "fade",
    delay = 0,
    className,
}: ScrollRevealProps) {
    const variants = {
        fade: {
            hidden: { opacity: 0 },
            visible: { opacity: 1 },
        },
        "slide-up": {
            hidden: { opacity: 0, y: 50 },
            visible: { opacity: 1, y: 0 },
        },
        "slide-left": {
            hidden: { opacity: 0, x: 50 },
            visible: { opacity: 1, x: 0 },
        },
        glitch: {
            hidden: { opacity: 0, x: -10 },
            visible: {
                opacity: 1,
                x: 0,
                transition: {
                    opacity: { duration: 0.3 },
                    x: {
                        type: "spring" as const,
                        stiffness: 500,
                        damping: 10,
                    },
                },
            },
        },
    };

    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={variants[effect]}
            transition={{ duration: 0.5, delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
