"use client";

import { motion } from "framer-motion";
import { useDemo } from "./DemoProvider";

export function DemoProgress() {
  const { currentStep, totalSteps, steps, goToStep } = useDemo();

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Progress Bar */}
      <div className="w-full max-w-md mx-auto">
        <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Step Dots */}
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => goToStep(index)}
            className="relative group"
            aria-label={`Ir al paso ${index + 1}: ${step.title}`}
          >
            <motion.div
              className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                index === currentStep
                  ? "bg-cyan-400"
                  : index < currentStep
                  ? "bg-cyan-600"
                  : "bg-white/20"
              }`}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
            />

            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {step.title}
              </div>
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
            </div>
          </button>
        ))}
      </div>

      {/* Step Counter */}
      <div className="text-sm text-slate-400">
        <span className="text-cyan-400 font-medium">{currentStep + 1}</span>
        <span className="mx-1">/</span>
        <span>{totalSteps}</span>
      </div>
    </div>
  );
}
