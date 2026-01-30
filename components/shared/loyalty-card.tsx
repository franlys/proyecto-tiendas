"use client";

import { useState, useEffect } from "react";
import { Heart, Sparkles, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "./theme-context";

interface LoyaltyCardProps {
  totalStamps?: number;
  initialStamps?: number;
  reward?: string;
}

export function LoyaltyCard({
  totalStamps = 10,
  initialStamps = 3,
  reward = "Servicio Gratis",
}: LoyaltyCardProps) {
  const shop = useShop();
  const [stamps, setStamps] = useState(initialStamps);
  const [lastAdded, setLastAdded] = useState<number | null>(null);
  const [cardNumber, setCardNumber] = useState(1234);

  // Generate random card number only on client to avoid hydration mismatch
  useEffect(() => {
    setCardNumber(Math.floor(1000 + Math.random() * 9000));
  }, []);

  const handleAddStamp = () => {
    if (stamps < totalStamps) {
      const newStampIndex = stamps;
      setStamps((prev) => prev + 1);
      setLastAdded(newStampIndex);

      // Reset animation trigger after animation completes
      setTimeout(() => setLastAdded(null), 600);
    }
  };

  const isComplete = stamps >= totalStamps;

  return (
    <div
      onClick={handleAddStamp}
      className={cn(
        "relative w-full max-w-md mx-auto cursor-pointer",
        "animate-in slide-in-from-bottom-4 duration-500"
      )}
    >
      {/* Card */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl p-6",
          "bg-gradient-to-br from-primary via-rose-600 to-orange-500",
          "shadow-2xl shadow-primary/30",
          "transition-transform duration-300 hover:scale-[1.02]",
          isComplete && "from-gold via-gold-light to-amber-400"
        )}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white_1px,transparent_1px)] bg-[length:20px_20px]" />
        </div>

        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

        {/* Header */}
        <div className="relative flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white font-display text-xl font-bold">
              {shop?.name || "Mi Tienda"}
            </h3>
            <p className="text-white/80 text-sm">Tarjeta de Fidelidad</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {isComplete ? (
              <Gift className="w-6 h-6 text-white" />
            ) : (
              <Heart className="w-6 h-6 text-white" />
            )}
          </div>
        </div>

        {/* Stamps Grid */}
        <div className="relative grid grid-cols-5 gap-3 mb-6">
          {Array.from({ length: totalStamps }).map((_, index) => {
            const isFilled = index < stamps;
            const isAnimating = index === lastAdded;

            return (
              <div
                key={index}
                className={cn(
                  "aspect-square rounded-xl flex items-center justify-center",
                  "transition-all duration-300",
                  isFilled
                    ? "bg-white shadow-lg"
                    : "bg-white/20 border-2 border-dashed border-white/40"
                )}
              >
                {isFilled && (
                  <div
                    className={cn(
                      "text-primary",
                      isAnimating && "animate-stamp"
                    )}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Text */}
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm">
              {isComplete ? "¡Felicidades!" : "Progreso"}
            </p>
            <p className="text-white font-bold text-lg">
              {isComplete ? reward : `${stamps} / ${totalStamps} sellos`}
            </p>
          </div>

          {!isComplete && (
            <div className="text-right">
              <p className="text-white/60 text-xs">Toca para probar</p>
              <p className="text-white/80 text-sm">+1 sello demo</p>
            </div>
          )}

          {isComplete && (
            <button className="px-4 py-2 bg-white text-primary font-bold rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              Canjear
            </button>
          )}
        </div>

        {/* Card Number (decorative) */}
        <div className="absolute bottom-4 right-6 text-white/30 text-xs font-mono">
          **** **** **** {cardNumber}
        </div>
      </div>

      {/* Instruction */}
      {!isComplete && (
        <p className="text-center text-slate-500 text-sm mt-3">
          Toca la tarjeta para simular un sello
        </p>
      )}
    </div>
  );
}
