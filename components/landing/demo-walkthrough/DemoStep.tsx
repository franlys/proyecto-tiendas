"use client";

import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useDemo } from "./DemoProvider";
import { DemoMockup } from "./DemoMockup";

interface DemoStepProps {
  children: ReactNode;
}

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 200 : -200,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -200 : 200,
    opacity: 0,
    transition: {
      duration: 0.3,
    },
  }),
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
    },
  },
};

const featureVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      delay: 0.3 + i * 0.1,
    },
  }),
};

export function DemoStep({ children }: DemoStepProps) {
  const { currentStep, direction, steps } = useDemo();
  const step = steps[currentStep];

  const accentColors: Record<string, string> = {
    cyan: "text-cyan-400",
    green: "text-green-400",
    purple: "text-purple-400",
    teal: "text-teal-400",
    blue: "text-blue-400",
    amber: "text-amber-400",
    pink: "text-pink-400",
    rose: "text-rose-400",
    orange: "text-orange-400",
  };

  const accentColor = accentColors[step.accentColor] || "text-cyan-400";

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      {/* Mockup Side */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step.id}
          custom={direction}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="order-1 lg:order-1"
        >
          <DemoMockup type={step.mockupType}>
            {children}
          </DemoMockup>
        </motion.div>
      </AnimatePresence>

      {/* Content Side */}
      <motion.div
        key={`content-${step.id}`}
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        className="order-2 lg:order-2 text-center lg:text-left"
      >
        {/* Step Number */}
        <span className={`text-sm font-medium ${accentColor}`}>
          {String(currentStep + 1).padStart(2, "0")}
        </span>

        {/* Title */}
        <h3 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-2">
          {step.title}
        </h3>

        {/* Subtitle */}
        <p className={`text-lg ${accentColor} mb-4`}>{step.subtitle}</p>

        {/* Description */}
        <p className="text-slate-400 mb-6 max-w-md mx-auto lg:mx-0">
          {step.description}
        </p>

        {/* Features List */}
        <ul className="space-y-3 max-w-md mx-auto lg:mx-0">
          {step.features.map((feature, i) => (
            <motion.li
              key={i}
              custom={i}
              variants={featureVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center gap-3 text-sm text-slate-300"
            >
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
              <span>{feature}</span>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
