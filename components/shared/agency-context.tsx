"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// Phase 24: Agency configuration for white-label support
export interface AgencyConfig {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  logoInitial: string; // Single letter for the logo
}

interface AgencyContextType {
  config: AgencyConfig;
  updateConfig: (updates: Partial<AgencyConfig>) => void;
  resetToDefaults: () => void;
  isLoaded: boolean;
}

const STORAGE_KEY = "agency-config";

// Default agency configuration
const DEFAULT_AGENCY: AgencyConfig = {
  name: "Linko App",
  phone: "+52 55 1234 5678",
  whatsapp: "5215512345678",
  email: "soporte@linko.app",
  logoInitial: "L",
};

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export function AgencyProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AgencyConfig>(DEFAULT_AGENCY);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load config from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setConfig({ ...DEFAULT_AGENCY, ...parsed });
      }
    } catch (error) {
      console.error("Error loading agency config:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Update config and persist to localStorage
  const updateConfig = useCallback((updates: Partial<AgencyConfig>) => {
    setConfig((prev) => {
      const newConfig = { ...prev, ...updates };

      // Update logoInitial if name changed and it's still the default or empty
      if (updates.name && (!updates.logoInitial)) {
        newConfig.logoInitial = updates.name.charAt(0).toUpperCase();
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      } catch (error) {
        console.error("Error saving agency config:", error);
      }

      return newConfig;
    });
  }, []);

  // Reset to default configuration
  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_AGENCY);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Error resetting agency config:", error);
    }
  }, []);

  return (
    <AgencyContext.Provider
      value={{
        config,
        updateConfig,
        resetToDefaults,
        isLoaded,
      }}
    >
      {children}
    </AgencyContext.Provider>
  );
}

export function useAgency() {
  const context = useContext(AgencyContext);
  if (context === undefined) {
    throw new Error("useAgency must be used within an AgencyProvider");
  }
  return context;
}
