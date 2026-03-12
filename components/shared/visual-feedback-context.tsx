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

function CachedImage({ src }: { src: string }) {
    return <img src={src} alt="" className="w-full h-full object-cover" />;
}

interface VisualFeedbackContextValue {
    triggerFlyToCart: (startX: number, startY: number, image?: string) => void;
    triggerTrashItem: (startX: number, startY: number) => void;
    cartRef: React.RefObject<HTMLDivElement | null>;
}

const VisualFeedbackContext = createContext<VisualFeedbackContextValue | undefined>(undefined);

// 6 particles — angles evenly spaced
const PARTICLE_ANGLES = Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2);

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
        // Leer posición en el momento exacto del click para evitar posición stale
        const pos = getCartPosition();
        const id = Math.random().toString(36).substring(7);
        setElements(prev => [...prev, { id, startX, startY, endX: pos.x, endY: pos.y, image, type: "add" }]);
        setTimeout(() => setElements(prev => prev.filter(el => el.id !== id)), 1200);
    }, []);

    const triggerTrashItem = useCallback((startX: number, startY: number) => {
        const id = Math.random().toString(36).substring(7);
        const endX = startX + (Math.random() - 0.5) * 80;
        const endY = startY + 180;
        setElements(prev => [...prev, { id, startX, startY, endX, endY, type: "remove" }]);
        setTimeout(() => setElements(prev => prev.filter(el => el.id !== id)), 700);
    }, []);

    return (
        <VisualFeedbackContext.Provider value={{ triggerFlyToCart, triggerTrashItem, cartRef }}>
            {children}
            <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                <AnimatePresence>
                    {elements.map(el => (
                        <Fragment key={el.id}>

                            {/* ── BURST RING ── */}
                            {el.type === "add" && (
                                <motion.div
                                    initial={{ x: el.startX - 32, y: el.startY - 32, scale: 0.3, opacity: 0.8 }}
                                    animate={{ x: el.startX - 32, y: el.startY - 32, scale: 2.5, opacity: 0 }}
                                    transition={{ duration: 0.35, ease: "easeOut" }}
                                    style={{ willChange: "transform, opacity" }}
                                    className="absolute top-0 left-0 w-16 h-16 rounded-full border-2 border-cyan-400/70"
                                />
                            )}

                            {/* ── FLYING BUBBLE ── */}
                            <motion.div
                                initial={{ x: el.startX - 28, y: el.startY - 28, scale: 1, opacity: 1 }}
                                animate={el.type === "add" ? {
                                    x: [el.startX - 28, el.startX - 20, el.endX - 28],
                                    y: [el.startY - 28, el.startY - 70, el.endY - 28],
                                    scale: [1, 1.1, 0.3],
                                    opacity: [1, 1, 0],
                                } : {
                                    x: el.endX - 28,
                                    y: el.endY - 28,
                                    scale: 0.2,
                                    opacity: 0,
                                    rotate: 60,
                                }}
                                transition={el.type === "add" ? {
                                    duration: 0.75,
                                    times: [0, 0.3, 1],
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                } : {
                                    duration: 0.45,
                                    ease: [0.4, 0, 1, 1],
                                }}
                                style={{ willChange: "transform, opacity" }}
                                className="absolute top-0 left-0"
                            >
                                {el.type === "add" ? (
                                    <div className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shadow-xl border-2 border-cyan-400/80 ${el.image ? "bg-slate-900" : "bg-gradient-to-br from-cyan-400 to-blue-600"}`}>
                                        {el.image ? <CachedImage src={el.image} /> : <Check className="w-6 h-6 text-white" />}
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg border border-red-400/50">
                                        <Trash2 className="w-5 h-5 text-white" />
                                    </div>
                                )}
                            </motion.div>

                            {/* ── PARTICLES (6, no blur) ── */}
                            {el.type === "add" && PARTICLE_ANGLES.map((angle, i) => {
                                const dist = 60 + i * 12;
                                return (
                                    <motion.div
                                        key={`p-${el.id}-${i}`}
                                        initial={{ x: el.startX - 3, y: el.startY - 3, scale: 1, opacity: 0.9 }}
                                        animate={{
                                            x: el.startX - 3 + Math.cos(angle) * dist,
                                            y: el.startY - 3 + Math.sin(angle) * dist,
                                            scale: 0,
                                            opacity: 0,
                                        }}
                                        transition={{ duration: 0.55, ease: "easeOut", delay: i * 0.015 }}
                                        style={{
                                            willChange: "transform, opacity",
                                            backgroundColor: i % 2 === 0 ? "#06b6d4" : "#7c3aed",
                                        }}
                                        className="absolute top-0 left-0 w-2 h-2 rounded-full"
                                    />
                                );
                            })}

                            {/* ── ARRIVAL FLASH ── */}
                            {el.type === "add" && (
                                <motion.div
                                    initial={{ x: el.endX - 20, y: el.endY - 20, scale: 0, opacity: 0 }}
                                    animate={{ x: el.endX - 20, y: el.endY - 20, scale: [0, 1.6, 0], opacity: [0, 0.8, 0] }}
                                    transition={{ duration: 0.3, delay: 0.65, ease: "easeOut" }}
                                    style={{ willChange: "transform, opacity", background: "radial-gradient(circle, rgba(6,182,212,0.9) 0%, transparent 70%)" }}
                                    className="absolute top-0 left-0 w-10 h-10 rounded-full"
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
    if (!context) throw new Error("useVisualFeedback must be used within a VisualFeedbackProvider");
    return context;
}
