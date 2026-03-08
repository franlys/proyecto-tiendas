"use client";

import React, { createContext, useContext, useState, useCallback, useRef } from "react";
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
            return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
            };
        }
        // Fallback to bottom center
        return { x: typeof window !== "undefined" ? window.innerWidth / 2 : 0, y: typeof window !== "undefined" ? window.innerHeight - 50 : 0 };
    };

    const triggerFlyToCart = useCallback((startX: number, startY: number, image?: string) => {
        const { x: endX, y: endY } = getCartPosition();
        const id = Math.random().toString(36).substring(7);

        setElements((prev) => [
            ...prev,
            { id, startX, startY, endX, endY, image, type: "add" },
        ]);

        setTimeout(() => {
            setElements((prev) => prev.filter((el) => el.id !== id));
        }, 800);
    }, []);

    const triggerTrashItem = useCallback((startX: number, startY: number) => {
        const id = Math.random().toString(36).substring(7);
        // Trash effect - falls down with slight horizontal drift
        const endX = startX + (Math.random() - 0.5) * 60;
        const endY = startY + 150;

        setElements((prev) => [
            ...prev,
            { id, startX, startY, endX, endY, type: "remove" },
        ]);

        setTimeout(() => {
            setElements((prev) => prev.filter((el) => el.id !== id));
        }, 600);
    }, []);

    return (
        <VisualFeedbackContext.Provider value={{ triggerFlyToCart, triggerTrashItem, cartRef }}>
            {children}
            <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                <AnimatePresence>
                    {elements.map((el) => (
                        <motion.div
                            key={el.id}
                            initial={{
                                x: el.startX - 24,
                                y: el.startY - 24,
                                scale: 1,
                                opacity: 1,
                                rotate: 0,
                            }}
                            animate={el.type === "add" ? {
                                x: [el.startX - 24, el.startX - 24 - 30, el.endX - 24],
                                y: [el.startY - 24, el.startY - 80, el.endY - 24],
                                scale: [1, 1.2, 0.3],
                                opacity: [1, 1, 0],
                                rotate: [0, -15, 0],
                            } : {
                                x: el.endX - 24,
                                y: el.endY - 24,
                                scale: 0.3,
                                opacity: 0,
                                rotate: 45,
                            }}
                            transition={el.type === "add" ? {
                                duration: 0.7,
                                times: [0, 0.3, 1],
                                ease: [0.32, 0, 0.67, 0],
                            } : {
                                duration: 0.5,
                                ease: [0.4, 0, 1, 1],
                            }}
                            className="absolute top-0 left-0"
                        >
                            {el.type === "add" ? (
                                <div className="relative">
                                    {/* Glow effect */}
                                    <div className="absolute inset-0 bg-primary/40 rounded-full blur-lg scale-150" />
                                    {/* Main circle */}
                                    <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center shadow-2xl shadow-primary/50 border-2 border-white/30">
                                        {el.image ? (
                                            <img
                                                src={el.image}
                                                alt=""
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <Check className="w-6 h-6 text-white" />
                                        )}
                                    </div>
                                    {/* Sparkle particles */}
                                    <motion.div
                                        initial={{ scale: 0, opacity: 1 }}
                                        animate={{ scale: 2, opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="absolute inset-0 rounded-full border-2 border-primary/50"
                                    />
                                </div>
                            ) : (
                                <div className="relative">
                                    {/* Red glow for trash */}
                                    <div className="absolute inset-0 bg-red-500/30 rounded-full blur-md scale-125" />
                                    {/* Trash icon */}
                                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/40 border border-red-400/50">
                                        <Trash2 className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                            )}
                        </motion.div>
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
