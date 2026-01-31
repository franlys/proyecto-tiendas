"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface DemoMockupProps {
  type: "phone" | "desktop";
  children: ReactNode;
  className?: string;
}

export function DemoMockup({ type, children, className = "" }: DemoMockupProps) {
  if (type === "phone") {
    return (
      <motion.div
        className={`relative mx-auto ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Phone Frame */}
        <div className="relative w-[280px] sm:w-[320px] h-[560px] sm:h-[640px] mx-auto">
          {/* Phone Border */}
          <div className="absolute inset-0 rounded-[3rem] bg-gradient-to-b from-slate-700 to-slate-800 p-2 shadow-2xl">
            {/* Inner Border */}
            <div className="absolute inset-2 rounded-[2.5rem] bg-slate-900 overflow-hidden">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-900 rounded-b-2xl z-20" />

              {/* Screen Content */}
              <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden bg-background">
                <div className="h-full w-full overflow-y-auto overflow-x-hidden scrollbar-hide">
                  {children}
                </div>
              </div>
            </div>
          </div>

          {/* Side Buttons */}
          <div className="absolute -right-1 top-24 w-1 h-12 bg-slate-700 rounded-r" />
          <div className="absolute -right-1 top-40 w-1 h-8 bg-slate-700 rounded-r" />
          <div className="absolute -left-1 top-32 w-1 h-16 bg-slate-700 rounded-l" />
        </div>
      </motion.div>
    );
  }

  // Desktop Frame
  return (
    <motion.div
      className={`relative mx-auto ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Desktop Monitor */}
      <div className="relative w-full max-w-[800px] mx-auto">
        {/* Monitor Frame */}
        <div className="relative bg-gradient-to-b from-slate-700 to-slate-800 rounded-t-xl p-2 shadow-2xl">
          {/* Screen Bezel */}
          <div className="bg-slate-900 rounded-lg overflow-hidden">
            {/* Browser Bar */}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border-b border-slate-700">
              {/* Traffic Lights */}
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              {/* URL Bar */}
              <div className="flex-1 mx-4">
                <div className="bg-slate-900 rounded-md px-3 py-1 text-xs text-slate-400 flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>nexo.app/tu-negocio</span>
                </div>
              </div>
            </div>

            {/* Screen Content */}
            <div className="bg-background h-[400px] sm:h-[450px] overflow-y-auto overflow-x-hidden">
              {children}
            </div>
          </div>
        </div>

        {/* Monitor Stand */}
        <div className="flex justify-center">
          <div className="w-24 h-4 bg-gradient-to-b from-slate-700 to-slate-800" />
        </div>
        <div className="flex justify-center">
          <div className="w-40 h-2 bg-gradient-to-b from-slate-800 to-slate-900 rounded-b-lg" />
        </div>
      </div>
    </motion.div>
  );
}
