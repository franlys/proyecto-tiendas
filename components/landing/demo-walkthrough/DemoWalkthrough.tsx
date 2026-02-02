"use client";

import { useEffect, useCallback } from "react";
import { useSwipeable } from "react-swipeable";
import { DemoProvider, useDemo } from "./DemoProvider";
import { DemoStep } from "./DemoStep";
import { DemoProgress } from "./DemoProgress";
import { DemoNavigation } from "./DemoNavigation";
import { DEMO_STEPS } from "./demoSteps";
import {
  ShopFrontendMockup,
  CartWhatsAppMockup,
  DashboardMockup,
  InventoryMockup,
  CRMMockup,
  OrdersKanbanMockup,
  MarketingMockup,
  PromoGeneratorMockup,
  SettingsMockup,
} from "./steps";

// Map step IDs to their mockup components
const STEP_MOCKUPS: Record<string, React.ComponentType> = {
  "shop-frontend": ShopFrontendMockup,
  "cart-whatsapp": CartWhatsAppMockup,
  dashboard: DashboardMockup,
  inventory: InventoryMockup,
  crm: CRMMockup,
  "orders-kanban": OrdersKanbanMockup,
  marketing: MarketingMockup,
  "promo-generator": PromoGeneratorMockup,
  settings: SettingsMockup,
};

interface DemoWalkthroughInnerProps {
  onContactClick?: () => void;
}

function DemoWalkthroughInner({ onContactClick }: DemoWalkthroughInnerProps) {
  const { currentStep, steps, totalSteps, nextStep, prevStep } = useDemo();
  const currentStepData = steps[currentStep];
  const MockupComponent = STEP_MOCKUPS[currentStepData.id];

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentStep < totalSteps - 1) {
        nextStep();
      }
    },
    onSwipedRight: () => {
      if (currentStep > 0) {
        prevStep();
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50, // Minimum swipe distance
    preventScrollOnSwipe: true,
  });

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextStep();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prevStep();
      }
    },
    [nextStep, prevStep]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <section id="demo" className="py-16 md:py-24 border-t border-white/10">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-gold text-sm font-medium uppercase tracking-wider">
            Demo Interactiva
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mt-4 mb-4">
            Descubre <span className="text-gradient-gold">todo lo que puedes hacer</span>
          </h2>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
            Navega paso a paso por las funcionalidades de NEXO
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 md:mb-12">
          <DemoProgress />
        </div>

        {/* Main Demo Area with Swipe Support */}
        <div
          {...swipeHandlers}
          className="max-w-6xl mx-auto mb-8 md:mb-12 touch-pan-y"
        >
          <DemoStep>
            {MockupComponent && <MockupComponent />}
          </DemoStep>
        </div>

        {/* Swipe Hint for Mobile */}
        <p className="text-center text-xs text-slate-500 mb-4 md:hidden flex items-center justify-center gap-2">
          <span className="inline-block animate-pulse">👈</span>
          Desliza para navegar
          <span className="inline-block animate-pulse">👉</span>
        </p>

        {/* Navigation */}
        <div className="mb-8">
          <DemoNavigation onContactClick={onContactClick} />
        </div>

        {/* Keyboard Hint */}
        <p className="text-center text-xs text-slate-500 hidden md:block">
          Usa las flechas del teclado para navegar
        </p>
      </div>
    </section>
  );
}

interface DemoWalkthroughProps {
  onContactClick?: () => void;
}

export function DemoWalkthrough({ onContactClick }: DemoWalkthroughProps) {
  return (
    <DemoProvider steps={DEMO_STEPS}>
      <DemoWalkthroughInner onContactClick={onContactClick} />
    </DemoProvider>
  );
}
