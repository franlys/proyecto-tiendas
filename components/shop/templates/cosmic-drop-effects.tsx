"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// ============================================
// WEBGL STARFIELD - THREE.JS IMPLEMENTATION
// Deep space 3D starfield with parallax
// ============================================

interface StarfieldProps {
    starCount?: number;
    starColor?: string;
    speed?: number;
    depth?: number;
}

export const Starfield = memo(function Starfield({
    starCount = 2000,
    starColor = "#ffffff",
    speed = 0.5,
    depth = 1000,
}: StarfieldProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const starsRef = useRef<Array<{ x: number; y: number; z: number; size: number; brightness: number }>>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Set canvas size
        const setSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setSize();
        window.addEventListener("resize", setSize);

        // Initialize stars
        starsRef.current = Array.from({ length: starCount }, () => ({
            x: (Math.random() - 0.5) * canvas.width * 2,
            y: (Math.random() - 0.5) * canvas.height * 2,
            z: Math.random() * depth,
            size: Math.random() * 2 + 0.5,
            brightness: Math.random(),
        }));

        // Parse color
        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16),
            } : { r: 255, g: 255, b: 255 };
        };
        const rgb = hexToRgb(starColor);

        // Animation loop
        const animate = () => {
            ctx.fillStyle = "rgba(3, 0, 20, 0.2)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;

            starsRef.current.forEach((star) => {
                // Move star toward camera
                star.z -= speed;

                // Reset if behind camera
                if (star.z <= 0) {
                    star.z = depth;
                    star.x = (Math.random() - 0.5) * canvas.width * 2;
                    star.y = (Math.random() - 0.5) * canvas.height * 2;
                }

                // Project 3D to 2D
                const scale = depth / star.z;
                const x = star.x * scale + centerX;
                const y = star.y * scale + centerY;
                const size = star.size * scale * 0.5;

                // Only draw if on screen
                if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
                    const alpha = (1 - star.z / depth) * star.brightness;

                    // Star glow
                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
                    gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`);
                    gradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha * 0.5})`);
                    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

                    ctx.beginPath();
                    ctx.arc(x, y, size * 2, 0, Math.PI * 2);
                    ctx.fillStyle = gradient;
                    ctx.fill();

                    // Core
                    ctx.beginPath();
                    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.fill();
                }
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", setSize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [starCount, starColor, speed, depth]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ background: "linear-gradient(180deg, #030014 0%, #0a0520 50%, #030014 100%)" }}
        />
    );
});

// ============================================
// NEBULA EFFECT - Animated CSS gradients
// ============================================

interface NebulaProps {
    primaryColor?: string;
    secondaryColor?: string;
    opacity?: number;
}

export const Nebula = memo(function Nebula({
    primaryColor = "#8B5CF6",
    secondaryColor = "#06B6D4",
    opacity = 0.4,
}: NebulaProps) {
    return (
        <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
            {/* Main nebula clouds */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [opacity * 0.5, opacity, opacity * 0.5],
                    rotate: [0, 10, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%]"
                style={{
                    background: `radial-gradient(ellipse at 30% 20%, ${primaryColor}40 0%, transparent 50%),
                                 radial-gradient(ellipse at 70% 80%, ${secondaryColor}30 0%, transparent 40%)`,
                    filter: "blur(60px)",
                }}
            />

            {/* Secondary cloud */}
            <motion.div
                animate={{
                    scale: [1.1, 1, 1.1],
                    opacity: [opacity * 0.3, opacity * 0.6, opacity * 0.3],
                    x: [0, 50, 0],
                    y: [0, -30, 0],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute top-1/4 right-0 w-[80%] h-[80%]"
                style={{
                    background: `radial-gradient(ellipse at center, ${primaryColor}30 0%, transparent 60%)`,
                    filter: "blur(80px)",
                }}
            />

            {/* Dust particles effect */}
            <div
                className="absolute inset-0"
                style={{
                    background: `radial-gradient(circle at 50% 50%, ${secondaryColor}10 0%, transparent 50%)`,
                    filter: "blur(40px)",
                }}
            />
        </div>
    );
});

// ============================================
// SHOOTING STARS
// ============================================

interface ShootingStar {
    id: number;
    startX: number;
    startY: number;
    angle: number;
    length: number;
    duration: number;
    delay: number;
}

export const ShootingStars = memo(function ShootingStars({
    frequency = 3000,
    color = "#ffffff",
}: {
    frequency?: number;
    color?: string;
}) {
    const [stars, setStars] = useState<ShootingStar[]>([]);
    const idRef = useRef(0);

    useEffect(() => {
        const createStar = () => {
            const star: ShootingStar = {
                id: idRef.current++,
                startX: Math.random() * 100,
                startY: Math.random() * 50,
                angle: 30 + Math.random() * 30,
                length: 100 + Math.random() * 200,
                duration: 0.5 + Math.random() * 0.5,
                delay: 0,
            };

            setStars(prev => [...prev, star]);

            setTimeout(() => {
                setStars(prev => prev.filter(s => s.id !== star.id));
            }, star.duration * 1000 + 500);
        };

        const interval = setInterval(createStar, frequency);
        return () => clearInterval(interval);
    }, [frequency]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[2] overflow-hidden">
            <AnimatePresence>
                {stars.map((star) => (
                    <motion.div
                        key={star.id}
                        initial={{
                            x: `${star.startX}vw`,
                            y: `${star.startY}vh`,
                            opacity: 0,
                            scale: 0,
                        }}
                        animate={{
                            x: `${star.startX + Math.cos(star.angle * Math.PI / 180) * 50}vw`,
                            y: `${star.startY + Math.sin(star.angle * Math.PI / 180) * 50}vh`,
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: star.duration, ease: "linear" }}
                        className="absolute"
                        style={{
                            width: star.length,
                            height: 2,
                            background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
                            transform: `rotate(${star.angle}deg)`,
                            boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
                        }}
                    />
                ))}
            </AnimatePresence>
        </div>
    );
});

// ============================================
// COSMIC DUST - Floating particles
// ============================================

interface CosmicDustProps {
    particleCount?: number;
    colors?: string[];
}

export const CosmicDust = memo(function CosmicDust({
    particleCount = 50,
    colors = ["#8B5CF6", "#06B6D4", "#ffffff"],
}: CosmicDustProps) {
    const particles = useRef(
        Array.from({ length: particleCount }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: 1 + Math.random() * 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            duration: 10 + Math.random() * 20,
            delay: Math.random() * 10,
        }))
    ).current;

    return (
        <div className="fixed inset-0 pointer-events-none z-[3] overflow-hidden">
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full"
                    style={{
                        width: particle.size,
                        height: particle.size,
                        backgroundColor: particle.color,
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                    }}
                    animate={{
                        y: [0, -30, 0, 20, 0],
                        x: [0, 15, -10, 5, 0],
                        opacity: [0.3, 0.8, 0.5, 0.9, 0.3],
                        scale: [1, 1.2, 0.9, 1.1, 1],
                    }}
                    transition={{
                        duration: particle.duration,
                        delay: particle.delay,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
});

// ============================================
// COSMIC CURSOR - Galaxy trail effect
// ============================================

export function CosmicCursor() {
    const cursorX = useMotionValue(0);
    const cursorY = useMotionValue(0);
    const springX = useSpring(cursorX, { stiffness: 500, damping: 30 });
    const springY = useSpring(cursorY, { stiffness: 500, damping: 30 });

    const [trail, setTrail] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const idRef = useRef(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);

            // Add trail particle
            const newParticle = { id: idRef.current++, x: e.clientX, y: e.clientY };
            setTrail(prev => [...prev.slice(-15), newParticle]);
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [cursorX, cursorY]);

    // Clean up old trail particles
    useEffect(() => {
        const interval = setInterval(() => {
            setTrail(prev => prev.slice(-10));
        }, 100);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {/* Trail particles */}
            <div className="fixed inset-0 pointer-events-none z-[9998]">
                {trail.map((particle, index) => (
                    <motion.div
                        key={particle.id}
                        initial={{ scale: 1, opacity: 0.8 }}
                        animate={{ scale: 0, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute rounded-full"
                        style={{
                            left: particle.x,
                            top: particle.y,
                            width: 8 - index * 0.3,
                            height: 8 - index * 0.3,
                            background: `radial-gradient(circle, rgba(139, 92, 246, 0.8) 0%, rgba(6, 182, 212, 0.4) 100%)`,
                            transform: "translate(-50%, -50%)",
                            boxShadow: "0 0 10px rgba(139, 92, 246, 0.5)",
                        }}
                    />
                ))}
            </div>

            {/* Main cursor */}
            <motion.div
                className="fixed pointer-events-none z-[9999] mix-blend-screen"
                style={{
                    x: springX,
                    y: springY,
                    translateX: "-50%",
                    translateY: "-50%",
                }}
            >
                {/* Outer glow */}
                <div
                    className="absolute rounded-full"
                    style={{
                        width: 40,
                        height: 40,
                        left: -20,
                        top: -20,
                        background: "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)",
                        filter: "blur(4px)",
                    }}
                />
                {/* Inner core */}
                <div
                    className="rounded-full"
                    style={{
                        width: 12,
                        height: 12,
                        background: "radial-gradient(circle, #ffffff 0%, #8B5CF6 50%, #06B6D4 100%)",
                        boxShadow: "0 0 15px rgba(139, 92, 246, 0.8), 0 0 30px rgba(6, 182, 212, 0.5)",
                    }}
                />
            </motion.div>

            {/* Hide default cursor */}
            <style dangerouslySetInnerHTML={{ __html: `
                .cosmic-cursor-active, .cosmic-cursor-active * { cursor: none !important; }
            `}} />
        </>
    );
}

// ============================================
// GALAXY WARP TRANSITION
// ============================================

export function GalaxyWarp({ onComplete }: { onComplete?: () => void }) {
    useEffect(() => {
        const timer = setTimeout(() => onComplete?.(), 2000);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center"
            style={{
                background: "radial-gradient(ellipse at center, #0a0520 0%, #030014 100%)",
            }}
        >
            {/* Speed lines */}
            {Array.from({ length: 50 }).map((_, i) => {
                const angle = (i / 50) * 360;
                return (
                    <motion.div
                        key={i}
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: [0, 1, 0] }}
                        transition={{ duration: 1.5, delay: i * 0.02 }}
                        className="absolute"
                        style={{
                            width: "50vmax",
                            height: 2,
                            left: "50%",
                            top: "50%",
                            transformOrigin: "left center",
                            transform: `rotate(${angle}deg)`,
                            background: `linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.8) 50%, rgba(6, 182, 212, 0.8) 100%)`,
                            boxShadow: "0 0 10px rgba(139, 92, 246, 0.5)",
                        }}
                    />
                );
            })}

            {/* Center flash */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 2, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 1, delay: 0.8 }}
                className="absolute rounded-full"
                style={{
                    width: 100,
                    height: 100,
                    background: "radial-gradient(circle, #ffffff 0%, #8B5CF6 50%, transparent 100%)",
                    boxShadow: "0 0 100px rgba(139, 92, 246, 1)",
                }}
            />
        </motion.div>
    );
}

// ============================================
// CONSTELLATION LINES - Connect nearby stars
// ============================================

interface ConstellationProps {
    nodeCount?: number;
    lineColor?: string;
    nodeColor?: string;
}

export const Constellation = memo(function Constellation({
    nodeCount = 30,
    lineColor = "rgba(139, 92, 246, 0.3)",
    nodeColor = "#8B5CF6",
}: ConstellationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const nodesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number }>>([]);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const setSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setSize();
        window.addEventListener("resize", setSize);

        // Initialize nodes
        nodesRef.current = Array.from({ length: nodeCount }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
        }));

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener("mousemove", handleMouseMove);

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const nodes = nodesRef.current;
            const mouse = mouseRef.current;
            const connectionDistance = 150;
            const mouseDistance = 200;

            // Update and draw nodes
            nodes.forEach((node, i) => {
                // Move node
                node.x += node.vx;
                node.y += node.vy;

                // Bounce off edges
                if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
                if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

                // Mouse attraction
                const dx = mouse.x - node.x;
                const dy = mouse.y - node.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouseDistance) {
                    node.vx += dx * 0.00005;
                    node.vy += dy * 0.00005;
                }

                // Draw connections
                for (let j = i + 1; j < nodes.length; j++) {
                    const other = nodes[j];
                    const dx = other.x - node.x;
                    const dy = other.y - node.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        const opacity = 1 - distance / connectionDistance;
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.strokeStyle = lineColor.replace("0.3", String(opacity * 0.3));
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }

                // Draw node
                ctx.beginPath();
                ctx.arc(node.x, node.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = nodeColor;
                ctx.fill();

                // Node glow
                const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 8);
                gradient.addColorStop(0, `${nodeColor}40`);
                gradient.addColorStop(1, "transparent");
                ctx.beginPath();
                ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
            });

            requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener("resize", setSize);
            window.removeEventListener("mousemove", handleMouseMove);
        };
    }, [nodeCount, lineColor, nodeColor]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[4]"
        />
    );
});

// ============================================
// AURORA BOREALIS EFFECT
// ============================================

export const Aurora = memo(function Aurora({
    colors = ["#8B5CF6", "#06B6D4", "#22D3EE", "#A855F7"],
}: {
    colors?: string[];
}) {
    return (
        <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden opacity-40">
            {colors.map((color, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{
                        width: "200%",
                        height: "40%",
                        left: "-50%",
                        top: `${20 + i * 15}%`,
                        background: `linear-gradient(90deg, transparent 0%, ${color}60 30%, ${color}80 50%, ${color}60 70%, transparent 100%)`,
                        filter: "blur(30px)",
                        transformOrigin: "center center",
                    }}
                    animate={{
                        x: ["-20%", "20%", "-20%"],
                        skewX: [0, 5, -5, 0],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                        duration: 8 + i * 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 1.5,
                    }}
                />
            ))}
        </div>
    );
});

// ============================================
// PLANET / MOON DECORATION
// ============================================

export function CosmicPlanet({
    size = 200,
    position = { top: "10%", right: "10%" },
    primaryColor = "#8B5CF6",
    secondaryColor = "#06B6D4",
}: {
    size?: number;
    position?: { top?: string; right?: string; bottom?: string; left?: string };
    primaryColor?: string;
    secondaryColor?: string;
}) {
    return (
        <motion.div
            className="fixed pointer-events-none z-[5]"
            style={{
                width: size,
                height: size,
                ...position,
            }}
            animate={{
                y: [0, -20, 0],
                rotate: [0, 5, 0],
            }}
            transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
            }}
        >
            {/* Planet body */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: `radial-gradient(circle at 30% 30%, ${primaryColor} 0%, ${secondaryColor} 50%, #030014 100%)`,
                    boxShadow: `
                        inset -20px -20px 60px rgba(0,0,0,0.8),
                        inset 10px 10px 40px rgba(255,255,255,0.1),
                        0 0 60px ${primaryColor}40,
                        0 0 120px ${secondaryColor}20
                    `,
                }}
            />

            {/* Ring */}
            <div
                className="absolute"
                style={{
                    width: size * 1.8,
                    height: size * 0.3,
                    left: -size * 0.4,
                    top: size * 0.35,
                    borderRadius: "50%",
                    border: `3px solid ${primaryColor}60`,
                    transform: "rotateX(70deg)",
                    boxShadow: `0 0 20px ${primaryColor}40`,
                }}
            />

            {/* Atmosphere glow */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: `radial-gradient(circle at 60% 60%, transparent 40%, ${secondaryColor}30 80%, ${primaryColor}20 100%)`,
                    filter: "blur(10px)",
                }}
            />
        </motion.div>
    );
}
