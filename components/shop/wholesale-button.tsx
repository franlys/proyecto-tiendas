"use client";

import { useState } from "react";
import { ShoppingBag, Unlock } from "lucide-react";
import { useWholesale } from "@/components/shared";
import { WholesaleModal } from "./wholesale-modal";
import { cn } from "@/lib/utils";

interface WholesaleButtonProps {
  shopId: string;
}

export function WholesaleButton({ shopId }: WholesaleButtonProps) {
  const { isWholesaleMode, wholesalerName } = useWholesale();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
          isWholesaleMode
            ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30"
            : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
        )}
      >
        {isWholesaleMode ? (
          <>
            <Unlock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{wholesalerName ? `Mayorista: ${wholesalerName}` : "Modo Mayorista"}</span>
            <span className="sm:hidden">Mayorista</span>
          </>
        ) : (
          <>
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Mayorista</span>
          </>
        )}
      </button>

      <WholesaleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        shopId={shopId}
      />
    </>
  );
}
