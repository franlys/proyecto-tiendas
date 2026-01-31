"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface DemoStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  accentColor: string;
  mockupType: "phone" | "desktop";
}

interface DemoContextType {
  currentStep: number;
  totalSteps: number;
  direction: 1 | -1;
  isAutoPlaying: boolean;
  steps: DemoStep[];

  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  toggleAutoPlay: () => void;
  exitDemo: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

interface DemoProviderProps {
  children: ReactNode;
  steps: DemoStep[];
  onExit?: () => void;
}

export function DemoProvider({ children, steps, onExit }: DemoProviderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const totalSteps = steps.length;

  const nextStep = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < totalSteps) {
      setDirection(index > currentStep ? 1 : -1);
      setCurrentStep(index);
    }
  }, [currentStep, totalSteps]);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlaying((prev) => !prev);
  }, []);

  const exitDemo = useCallback(() => {
    onExit?.();
  }, [onExit]);

  return (
    <DemoContext.Provider
      value={{
        currentStep,
        totalSteps,
        direction,
        isAutoPlaying,
        steps,
        nextStep,
        prevStep,
        goToStep,
        toggleAutoPlay,
        exitDemo,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
