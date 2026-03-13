"use client";

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

// Frame 4 es la imagen maestra completa (estado final del logo)
const MASTER_FRAME = "/assets/tech-premium-animation/frame4.png";

export function LogoAnimation() {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) return null;

    // Orquestación: los hijos aparecen con stagger
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.35,
                delayChildren: 0.1,
            },
        },
    };

    // "G" vuela desde la izquierda
    const gVariants: Variants = {
        hidden: { x: -120, y: -40, opacity: 0, scale: 0.85 },
        show: {
            x: 0, y: 0, opacity: 1, scale: 1,
            transition: { type: "spring", bounce: 0.18, duration: 1.4 },
        },
    };

    // "S" vuela desde la derecha
    const sVariants: Variants = {
        hidden: { x: 120, y: -40, opacity: 0, scale: 0.85 },
        show: {
            x: 0, y: 0, opacity: 1, scale: 1,
            transition: { type: "spring", bounce: 0.18, duration: 1.4 },
        },
    };

    // Texto sube desde abajo con blur
    const textVariants: Variants = {
        hidden: { y: 40, opacity: 0, filter: "blur(10px)" },
        show: {
            y: 0, opacity: 1, filter: "blur(0px)",
            transition: { duration: 1.2, ease: [0.25, 1, 0.5, 1], delay: 0.5 },
        },
    };

    // Chispa eléctrica en el punto de impacto entre G y S
    const sparkVariants: Variants = {
        hidden: { opacity: 0, scale: 0.4 },
        show: {
            opacity: [0, 1, 0, 0.6, 0],
            scale:   [0.6, 1.3, 0.8, 1.1, 1],
            transition: { duration: 0.35, times: [0, 0.2, 0.45, 0.7, 1], delay: 0.95 },
        },
    };

    return (
        <div className="relative w-full max-w-2xl aspect-square mx-auto flex items-center justify-center bg-black">

            {/* Aura de fondo que pulsa suavemente */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.25, 0.08] }}
                transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
                <div className="w-[45%] h-[45%] bg-blue-600/25 blur-[90px] rounded-full mix-blend-screen" />
                <div className="w-[45%] h-[45%] bg-red-600/20 blur-[90px] rounded-full mix-blend-screen -ml-10" />
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="relative w-full h-full"
            >
                {/* Pieza 1: la "G" — mitad izquierda superior */}
                <motion.div
                    variants={gVariants}
                    className="absolute inset-0"
                    style={{ clipPath: "polygon(0% 0%, 50% 0%, 50% 64%, 0% 64%)" }}
                >
                    <Image src={MASTER_FRAME} alt="G" fill className="object-contain" priority />
                </motion.div>

                {/* Pieza 2: la "S" — mitad derecha superior */}
                <motion.div
                    variants={sVariants}
                    className="absolute inset-0"
                    style={{ clipPath: "polygon(50% 0%, 100% 0%, 100% 64%, 50% 64%)" }}
                >
                    <Image src={MASTER_FRAME} alt="S" fill className="object-contain" priority />
                </motion.div>

                {/* Pieza 3: "Gonzalez Smartphone" — banda inferior */}
                <motion.div
                    variants={textVariants}
                    className="absolute inset-0"
                    style={{ clipPath: "polygon(0% 64%, 100% 64%, 100% 100%, 0% 100%)" }}
                >
                    <Image src={MASTER_FRAME} alt="Gonzalez Smartphone" fill className="object-contain" priority />
                </motion.div>

                {/* Chispa eléctrica en el punto de impacto */}
                <motion.div
                    variants={sparkVariants}
                    className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-14 pointer-events-none mix-blend-screen"
                >
                    <div className="absolute inset-0 bg-blue-400 blur-[6px] opacity-80 rounded-full scale-y-50" />
                    <div className="absolute inset-0 bg-white blur-[2px] rounded-full scale-y-[0.08]" />
                    <div className="absolute inset-0 bg-red-500 blur-[14px] opacity-35 rounded-full scale-150" />
                </motion.div>
            </motion.div>
        </div>
    );
}
