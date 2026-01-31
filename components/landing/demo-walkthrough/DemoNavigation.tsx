"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { useDemo } from "./DemoProvider";
import { Button } from "@/components/ui";

interface DemoNavigationProps {
  onContactClick?: () => void;
}

export function DemoNavigation({ onContactClick }: DemoNavigationProps) {
  const { currentStep, totalSteps, nextStep, prevStep, goToStep } = useDemo();

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex items-center justify-between gap-4 w-full max-w-xl mx-auto">
      {/* Previous Button */}
      <motion.button
        onClick={prevStep}
        disabled={isFirstStep}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          isFirstStep
            ? "text-slate-600 cursor-not-allowed"
            : "text-slate-300 hover:text-white hover:bg-white/10"
        }`}
        whileHover={!isFirstStep ? { x: -2 } : {}}
        whileTap={!isFirstStep ? { scale: 0.95 } : {}}
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Anterior</span>
      </motion.button>

      {/* Center Actions */}
      <div className="flex items-center gap-3">
        {/* Skip to End */}
        {!isLastStep && (
          <button
            onClick={() => goToStep(totalSteps - 1)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            <SkipForward className="w-3 h-3" />
            <span>Saltar</span>
          </button>
        )}

        {/* Contact CTA on last step */}
        {isLastStep && onContactClick && (
          <Button onClick={onContactClick} size="sm">
            Quiero mi NEXO
          </Button>
        )}
      </div>

      {/* Next Button */}
      <motion.button
        onClick={nextStep}
        disabled={isLastStep}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
          isLastStep
            ? "text-slate-600 cursor-not-allowed"
            : "text-white bg-cyan-600 hover:bg-cyan-500"
        }`}
        whileHover={!isLastStep ? { x: 2 } : {}}
        whileTap={!isLastStep ? { scale: 0.95 } : {}}
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
