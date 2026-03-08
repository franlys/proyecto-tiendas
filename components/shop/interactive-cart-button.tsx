"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface InteractiveCartButtonProps {
    onClick: (e: React.MouseEvent) => void;
    className?: string;
    iconClassName?: string;
}

export function InteractiveCartButton({ onClick, className, iconClassName }: InteractiveCartButtonProps) {
    const [isAnimating, setIsAnimating] = useState(false);
    const [showCheck, setShowCheck] = useState(false);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (isAnimating) return;

        setIsAnimating(true);
        onClick(e);

        // Sequence: 
        // 1. Initial bounce
        // 2. Show checkmark
        // 3. Reset
        setTimeout(() => {
            setShowCheck(true);
            setTimeout(() => {
                setShowCheck(false);
                setIsAnimating(false);
            }, 1500);
        }, 200);
    };

    return (
        <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleClick}
            className={cn(
                "relative flex items-center justify-center overflow-hidden transition-shadow",
                className
            )}
        >
            <AnimatePresence mode="wait">
                {!showCheck ? (
                    <motion.div
                        key="cart-icon"
                        initial={{ y: 0 }}
                        animate={isAnimating ? {
                            y: [0, -4, 0],
                            scale: [1, 1.2, 1],
                            rotate: [0, -10, 10, 0]
                        } : { y: 0 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <ShoppingBag className={cn("w-5 h-5", iconClassName)} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="check-icon"
                        initial={{ y: 20, opacity: 0, scale: 0.5 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    >
                        <Check className={cn("w-5 h-5 text-green-500", iconClassName)} />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Floating particles on click */}
            <AnimatePresence>
                {isAnimating && !showCheck && (
                    <motion.div className="absolute inset-0 pointer-events-none">
                        {[...Array(5)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                                animate={{
                                    opacity: 0,
                                    scale: 1,
                                    x: (Math.random() - 0.5) * 50,
                                    y: (Math.random() - 0.5) * 50
                                }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-white/80 rounded-full"
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
}
