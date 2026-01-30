"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type SectionId = "hero" | "services" | "products" | "testimonials" | "footer" | string;

interface UIContextType {
  activeSection: SectionId;
  setActiveSection: (id: SectionId) => void;
  isScrolling: boolean;
  setIsScrolling: (value: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

interface UIProviderProps {
  children: ReactNode;
}

export function UIProvider({ children }: UIProviderProps) {
  const [activeSection, setActiveSectionState] = useState<SectionId>("hero");
  const [isScrolling, setIsScrolling] = useState(false);

  const setActiveSection = useCallback((id: SectionId) => {
    setActiveSectionState(id);
  }, []);

  return (
    <UIContext.Provider
      value={{
        activeSection,
        setActiveSection,
        isScrolling,
        setIsScrolling,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
