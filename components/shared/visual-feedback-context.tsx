"use client";

import React, { createContext, useContext, useState, useCallback, useRef, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Check } from "lucide-react";

interface FlyElement {
    id: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    image?: string;
    type: "add" | "remove";
}

// Cached image component - loads instantly from browser cache
function CachedImage({ src }: { src: string }) {
    return (
        <img
            src={src}
            alt=""
            className="w-full h-full object-cover"
        />
    );
}

interface VisualFeedbackContextValue {
    triggerFlyToCart: (startX: number, startY: number, image?: string) => void;
    triggerTrashItem: (startX: number, startY: number) => void;
    cartRef: React.RefObject<HTMLDivElement | null>;
}

const VisualFeedbackContext = createContext<VisualFeedbackContextValue | undefined>(undefined);

export function VisualFeedbackProvider({ children }: { children: React.ReactNode }) {
    const [elements, setElements] = useState<FlyElement[]>([]);
    const cartRef = useRef<HTMLDivElement>(null);

    const getCartPosition = () => {
        if (cartRef.current) {
            const rect = cartRef.current.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
        return {
            x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
            y: typeof window !== "undefined" ? window.innerHeight - 50 : 0,
        };
    };

    const triggerFlyToCart = useCallback((startX: number, startY: number, image?: string) => {
        const { x: endX, y: endY } = getCartPosition();
        const id = Math.random().toString(36).substring(7);

        setElements(prev => [...prev, { id, startX, startY, endX, endY, image, type: "add" }]);

        setTimeout(() => {
            setElements(prev => prev.filter(el => el.id !== id));
        }, 2800);
    }, []);

    const triggerTrashItem = useCallback((startX: number, startY: number) => {
        const id = Math.random().toString(36).substring(7);
        const endX = startX + (Math.random() - 0.5) * 80;
        const endY = startY + 180;

        setElements(prev => [...prev, { id, startX, startY, endX, endY, type: "remove" }]);

        setTimeout(() => {
            setElements(prev => prev.filter(el => el.id !== id));
        }, 700);
    }, []);

    return (
        <VisualFeedbackContext.Provider value={{ triggerFlyToCart, triggerTrashItem, cartRef }}>
            {children}
            <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                <AnimatePresence>
                    {elements.map(el => (
                        <Fragment key={el.id}>

                            {/* ── BURST RING (expands from click point) ── */}
                            {el.type === "add" && (
                                <motion.div
                                    initial={{ x: el.startX - 36, y: el.startY - 36, scale: 0, opacity: 0.9 }}
                                    animate={{ x: el.startX - 36, y: el.startY - 36, scale: 3.5, opacity: 0 }}
                                    transition={{ duration: 0.55, ease: "easeOut" }}
                                    className="absolute top-0 left-0 w-[72px] h-[72px] rounded-full border-2 border-cyan-400"
                                    style={{ boxShadow: "0 0 20px rgba(6,182,212,0.5)" }}
                                />
                            )}

                            {/* ── SECONDARY RING (slightly delayed) ── */}
                            {el.type === "add" && (
                                <motion.div
                                    initial={{ x: el.startX - 28, y: el.startY - 28, scale: 0, opacity: 0.7 }}
                                    animate={{ x: el.startX - 28, y: el.startY - 28, scale: 2.8, opacity: 0 }}
                                    transition={{ duration: 0.65, ease: "easeOut", delay: 0.08 }}
                                    className="absolute top-0 left-0 w-[56px] h-[56px] rounded-full border border-violet-400/70"
                                />
                            )}

                            {/* ── FLYING PRODUCT BUBBLE ── */}
                            <motion.div
                                initial={{
                                    x: el.startX - 32,
                                    y: el.startY - 32,
                                    scale: 1,
                                    opacity: 1,
                                    rotate: 0,
                                }}
                                animate={el.type === "add" ? {
                                    // Rise → Arc → Land at cart
                                    x: [el.startX - 32, el.startX - 32, el.startX - 32 - 50, el.endX - 32, el.endX - 32],
                                    y: [el.startY - 32, el.startY - 32, el.startY - 130, el.endY - 32, el.endY - 32],
                                    scale: [1, 1.25, 1.35, 0.45, 0.2],
                                    opacity: [1, 1, 1, 1, 0],
                                    rotate: [0, -5, -15, 0, 0],
                                } : {
                                    x: el.endX - 32,
                                    y: el.endY - 32,
                                    scale: 0.2,
                                    opacity: 0,
                                    rotate: 60,
                                }}
                                transition={el.type === "add" ? {
                                    duration: 1.9,
                                    times: [0, 0.15, 0.38, 0.88, 1],
                                    ease: [0.22, 0.68, 0.32, 1],
                                } : {
                                    duration: 0.65,
                                    ease: [0.4, 0, 1, 1],
                                }}
                                className="absolute top-0 left-0"
                            >
                                {el.type === "add" ? (
                                    <div className="relative">
                                        {/* Outer glow */}
                                        <div className="absolute -inset-3 rounded-full blur-xl bg-cyan-400/40 scale-100" />
                                        {/* Inner violet glow */}
                                        <div className="absolute -inset-1 rounded-full blur-md bg-violet-500/30" />
                                        {/* Main bubble */}
                                        <div className={`relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shadow-2xl border-2 border-cyan-400/80 ${el.image ? "bg-slate-900/90 backdrop-blur-md" : "bg-gradient-to-br from-cyan-400 to-blue-600"}`}
                                            style={{ boxShadow: "0 0 25px rgba(6,182,212,0.6), inset 0 0 15px rgba(6,182,212,0.2)" }}>
                                            {el.image ? (
                                                <CachedImage src={el.image} />
                                            ) : (
                                                <Check className="w-7 h-7 text-white" />
                                            )}
                                        </div>
                                        {/* Speed lines (2 streaks trailing behind) */}
                                        <motion.div
                                            initial={{ scaleX: 0, opacity: 0.8 }}
                                            animate={{ scaleX: [0, 1, 0], opacity: [0, 0.7, 0] }}
                                            transition={{ duration: 0.4, delay: 0.35, repeat: 2, repeatDelay: 0.3 }}
                                            className="absolute top-1/2 -translate-y-1/2 -left-12 w-10 h-[2px] bg-gradient-to-l from-cyan-400 to-transparent origin-right"
                                        />
                                        <motion.div
                                            initial={{ scaleX: 0, opacity: 0.6 }}
                                            animate={{ scaleX: [0, 1, 0], opacity: [0, 0.5, 0] }}
                                            transition={{ duration: 0.35, delay: 0.45, repeat: 2, repeatDelay: 0.3 }}
                                            className="absolute top-[60%] -translate-y-1/2 -left-9 w-7 h-px bg-gradient-to-l from-violet-400 to-transparent origin-right"
                                        />
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-red-500/40 rounded-full blur-md scale-150" />
                                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg border border-red-400/50">
                                            <Trash2 className="w-5 h-5 text-white" />
                                        </div>
                                    </div>
                                )}
                            </motion.div>

                            {/* ── PARTICLE BURST (16 particles, 2 sizes, 2 colors) ── */}
                            {el.type === "add" && Array.from({ length: 16 }).map((_, i) => {
                                const angle = (i / 16) * Math.PI * 2;
                                const distance = 80 + (i % 3) * 35;
                                const isLarge = i % 3 === 0;
                                const isCyan = i % 2 === 0;
                                return (
                                    <motion.div
                                        key={`p-${el.id}-${i}`}
                                        initial={{ x: el.startX - 4, y: el.startY - 4, scale: 1, opacity: 1 }}
                                        animate={{
                                            x: el.startX - 4 + Math.cos(angle) * distance,
                                            y: el.startY - 4 + Math.sin(angle) * distance,
                                            scale: 0,
                                            opacity: 0,
                                        }}
                                        transition={{ duration: 0.7 + (i % 3) * 0.1, ease: "easeOut", delay: 0.02 * i }}
                                        className={`absolute rounded-full ${isLarge ? "w-3 h-3" : "w-1.5 h-1.5"} blur-[1px]`}
                                        style={{ backgroundColor: isCyan ? "#06b6d4" : "#7c3aed" }}
                                    />
                                );
                            })}

                            {/* ── ARRIVAL FLASH (at the cart destination) ── */}
                            {el.type === "add" && (
                                <motion.div
                                    initial={{ x: el.endX - 24, y: el.endY - 24, scale: 0, opacity: 0 }}
                                    animate={{ x: el.endX - 24, y: el.endY - 24, scale: [0, 1.8, 0], opacity: [0, 0.9, 0] }}
                                    transition={{ duration: 0.45, delay: 1.6, ease: "easeOut" }}
                                    className="absolute top-0 left-0 w-12 h-12 rounded-full"
                                    style={{ background: "radial-gradient(circle, rgba(6,182,212,0.9) 0%, rgba(124,58,237,0.5) 50%, transparent 70%)" }}
                                />
                            )}

                        </Fragment>
                    ))}
                </AnimatePresence>
            </div>
        </VisualFeedbackContext.Provider>
    );
}

export function useVisualFeedback() {
    const context = useContext(VisualFeedbackContext);
    if (!context) {
        throw new Error("useVisualFeedback must be used within a VisualFeedbackProvider");
    }
    return context;
}
