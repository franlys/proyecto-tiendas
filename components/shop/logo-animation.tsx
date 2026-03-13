"use client";

import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const FRAMES = [
  "/assets/gs-animation/gs-start.png",
  "/assets/gs-animation/gs-mid1.png",
  "/assets/gs-animation/gs-mid2.png",
  "/assets/gs-animation/gs-impact.png",
  "/assets/gs-animation/gs-master.png",
];

// Duración que cada frame espera antes de avanzar (ms)
// El impacto (frame 3) es rápido y energético; el master (frame 4) es la pausa elegante
const FRAME_DURATIONS = [900, 180, 180, 100, Infinity];

export function LogoAnimation({ onComplete }: { onComplete?: () => void }) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax: el logo sube levemente al hacer scroll
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, -40]);

  useEffect(() => {
    const duration = FRAME_DURATIONS[currentFrame];
    if (duration === Infinity) {
      onComplete?.();
      return;
    }
    const timer = setTimeout(() => {
      setCurrentFrame((prev) => prev + 1);
    }, duration);
    return () => clearTimeout(timer);
  }, [currentFrame, onComplete]);

  const isImpact = currentFrame === 3;
  const isMaster = currentFrame === 4;

  return (
    <motion.div
      ref={containerRef}
      style={{ y }}
      className="relative w-full h-[420px] flex items-center justify-center select-none pointer-events-none"
      // fondo negro absoluto — los bordes de los assets desaparecen
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Fondo negro puro — garantiza que no haya halo entre imagen y página */}
      <div className="absolute inset-0 bg-black" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentFrame}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{
            duration: isImpact ? 0.08 : isMaster ? 0.7 : 0.25,
            ease: isMaster ? [0.25, 1, 0.5, 1] : "easeOut",
          }}
          className="relative w-full h-full max-w-2xl"
        >
          <Image
            src={FRAMES[currentFrame]}
            alt="GS Gonzalez Smartphone"
            fill
            className="object-contain"
            priority
          />

          {/* Chispa eléctrica en el impacto */}
          {isImpact && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0] }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute inset-0 bg-blue-500/15 blur-3xl pointer-events-none"
            />
          )}

          {/* Aura roja elegante en el master logo */}
          {isMaster && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 1.2, ease: "easeOut" }}
              className="absolute inset-0 bg-red-600/8 blur-[80px] pointer-events-none"
            />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
