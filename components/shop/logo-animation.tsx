"use client";

import { motion, type Variants } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

const MASTER_FRAME = "/assets/tech-premium-animation/frame4.png";

export function LogoAnimation() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  // Apple-style smooth animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.4,
        delayChildren: 0.2,
      },
    },
  };

  const gPieceVariants: Variants = {
    hidden: { x: -100, y: -50, opacity: 0, scale: 0.8 },
    show: { 
      x: 0, y: 0, opacity: 1, scale: 1,
      transition: { type: "spring", bounce: 0.2, duration: 1.5, ease: [0.25, 1, 0.5, 1] } 
    },
  };

  const sPieceVariants: Variants = {
    hidden: { x: 100, y: -50, opacity: 0, scale: 0.8 },
    show: { 
      x: 0, y: 0, opacity: 1, scale: 1,
      transition: { type: "spring", bounce: 0.2, duration: 1.5, ease: [0.25, 1, 0.5, 1] } 
    },
  };

  const textVariants: Variants = {
    hidden: { y: 50, opacity: 0, filter: "blur(10px)" },
    show: { 
      y: 0, opacity: 1, filter: "blur(0px)",
      transition: { duration: 1.5, ease: [0.25, 1, 0.5, 1], delay: 0.6 } 
    },
  };

  const electricVariants: Variants = {
    hidden: { opacity: 0, scale: 0.5 },
    show: { 
      opacity: [0, 1, 0, 0.8, 0], 
      scale: [0.8, 1.2, 0.9, 1.1, 1],
      transition: { duration: 0.3, times: [0, 0.2, 0.4, 0.6, 1], delay: 1.2 } 
    },
  };

  return (
    <div className="relative w-full max-w-3xl aspect-square mx-auto flex items-center justify-center bg-black">
      
      {/* Background glow that pulses slightly */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0.1] }}
        transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div className="w-[40%] h-[40%] bg-blue-600/20 blur-[100px] rounded-full mix-blend-screen" />
        <div className="w-[40%] h-[40%] bg-red-600/20 blur-[100px] rounded-full mix-blend-screen -ml-10" />
      </motion.div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative w-full h-full"
      >
        {/* Piece 1: The 'G' - Clipped from the master image */}
        <motion.div 
          variants={gPieceVariants}
          className="absolute inset-0"
          style={{ clipPath: "polygon(0% 0%, 50% 0%, 50% 64%, 0% 64%)" }}
        >
          <Image src={MASTER_FRAME} alt="G" fill className="object-contain" priority />
        </motion.div>

        {/* Piece 2: The 'S' - Clipped from the master image */}
        <motion.div 
          variants={sPieceVariants}
          className="absolute inset-0"
          style={{ clipPath: "polygon(50% 0%, 100% 0%, 100% 64%, 50% 64%)" }}
        >
          <Image src={MASTER_FRAME} alt="S" fill className="object-contain" priority />
        </motion.div>

        {/* Piece 3: The 'GONZALEZ SMARTPHONE' text - Clipped from the master image */}
        <motion.div 
          variants={textVariants}
          className="absolute inset-0"
          style={{ clipPath: "polygon(0% 64%, 100% 64%, 100% 100%, 0% 100%)" }}
        >
          <Image src={MASTER_FRAME} alt="Gonzalez Smartphone" fill className="object-contain" priority />
        </motion.div>

        {/* Synthetic "Electric Impact" between G and S */}
        <motion.div
           variants={electricVariants}
           className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-16 pointer-events-none mix-blend-screen"
        >
           {/* Simulate electric spark using CSS blur and bright colors */}
           <div className="absolute inset-0 bg-blue-400 blur-[8px] opacity-80 rounded-full scale-y-50"></div>
           <div className="absolute inset-0 bg-white blur-[2px] rounded-full scale-y-[0.1]"></div>
           <div className="absolute inset-0 bg-red-500 blur-[15px] opacity-40 rounded-full scale-150"></div>
        </motion.div>
      </motion.div>
    </div>
  );
}
