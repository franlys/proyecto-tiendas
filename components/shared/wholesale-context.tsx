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
  activateWholesale: (code: string, correctCode: string) => boolean;
  deactivateWholesale: () => void;
  getDisplayPrice: (retailPrice: number, wholesalePrice?: number) => number;
}

const WholesaleContext = createContext<WholesaleContextType | undefined>(undefined);

interface WholesaleProviderProps {
  children: ReactNode;
}

export function WholesaleProvider({ children }: WholesaleProviderProps) {
  const [isWholesaleMode, setIsWholesaleMode] = useState(false);

  const activateWholesale = useCallback((code: string, correctCode: string): boolean => {
    if (!correctCode) return false;

    const isValid = code.trim().toUpperCase() === correctCode.trim().toUpperCase();
    if (isValid) {
      setIsWholesaleMode(true);
      return true;
    }
    return false;
  }, []);

  const deactivateWholesale = useCallback(() => {
    setIsWholesaleMode(false);
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
