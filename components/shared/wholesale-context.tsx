"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface WholesaleContextType {
  isWholesaleMode: boolean;
  wholesalerName: string | null;
  activateWholesale: (code: string, shopId: string) => Promise<boolean>;
  deactivateWholesale: () => void;
  getDisplayPrice: (retailPrice: number, wholesalePrice?: number) => number;
}

const WholesaleContext = createContext<WholesaleContextType | undefined>(undefined);

export function WholesaleProvider({ children }: { children: ReactNode }) {
  const [isWholesaleMode, setIsWholesaleMode] = useState(false);
  const [wholesalerName, setWholesalerName] = useState<string | null>(null);

  const activateWholesale = useCallback(async (code: string, shopId: string): Promise<boolean> => {
    if (!code.trim() || !shopId) return false;
    try {
      const res = await fetch("/api/wholesale/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, code }),
      });
      const data = await res.json();
      if (data.valid) {
        setIsWholesaleMode(true);
        setWholesalerName(data.wholesalerName || null);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  const deactivateWholesale = useCallback(() => {
    setIsWholesaleMode(false);
    setWholesalerName(null);
  }, []);

  const getDisplayPrice = useCallback(
    (retailPrice: number, wholesalePrice?: number): number => {
      if (isWholesaleMode && wholesalePrice !== undefined && wholesalePrice > 0) {
        return wholesalePrice;
      }
      return retailPrice;
    },
    [isWholesaleMode]
  );

  return (
    <WholesaleContext.Provider
      value={{
        isWholesaleMode,
        wholesalerName,
        activateWholesale,
        deactivateWholesale,
        getDisplayPrice,
      }}
    >
      {children}
    </WholesaleContext.Provider>
  );
}

export function useWholesale() {
  const context = useContext(WholesaleContext);
  if (context === undefined) {
    throw new Error("useWholesale must be used within a WholesaleProvider");
  }
  return context;
}
