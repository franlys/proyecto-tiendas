"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const FRAMES = [
    "/assets/tech-premium-animation/frame1.png",
    "/assets/tech-premium-animation/frame2.png",
    "/assets/tech-premium-animation/frame3.png",
    "/assets/tech-premium-animation/frame4.png",
] as const;

// Time each frame is displayed before advancing (ms)
const FRAME_DURATIONS: number[] = [700, 700, 700];

export function TechPremiumLogoAnimation() {
    const [currentFrame, setCurrentFrame] = useState(0);

    // Advance frames one by one — stops at the last frame
    useEffect(() => {
        if (currentFrame >= FRAMES.length - 1) return;
        const timer = setTimeout(() => {
            setCurrentFrame(f => f + 1);
        }, FRAME_DURATIONS[currentFrame]);
        return () => clearTimeout(timer);
    }, [currentFrame]);

    const isPreImpact = currentFrame === 2;

    return (
        // Container animates scale 1→1.05 over 4s (subtle cinematic zoom)
        <motion.div
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1.05, opacity: 1 }}
            transition={{ duration: 4, ease: "easeOut" }}
            className="relative flex items-center justify-center w-full py-8 px-4"
        >
            <img
                src={FRAMES[currentFrame]}
                alt="Logo animado"
                className="w-full max-w-[360px] mx-auto object-contain select-none"
                draggable={false}
                style={{
                    filter: isPreImpact
                        ? "drop-shadow(0 0 14px #3b82f6) drop-shadow(0 0 32px #1d4ed8)"
                        : "drop-shadow(0 12px 40px rgba(255,255,255,0.04))",
                    transition: "filter 0.08s ease",
                    background: "transparent",
                }}
            />
        </motion.div>
    );
}
