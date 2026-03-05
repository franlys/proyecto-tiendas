"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { localToken } from "@/lib/utils/safe-storage";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Phase 24: Agency configuration for white-label support
export interface AgencyConfig {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  location: string; // Agency physical location
  logoInitial: string; // Single letter for the logo
  logoUrl?: string; // Opt-in image URL for the logo
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
  location: "Ciudad de México, México",
  logoInitial: "L",
  logoUrl: "",
};

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export function AgencyProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AgencyConfig>(DEFAULT_AGENCY);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load config from Firestore (with localStorage fallback for instant load if available)
  useEffect(() => {
    let mounted = true;

    async function fetchAgencyConfig() {
      try {
        // 1. Fast load from local storage first (optimistic UI)
        const stored = localToken.get(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (mounted) setConfig({ ...DEFAULT_AGENCY, ...parsed });
        }

        // 2. Fetch ground truth from Firestore
        const docRef = doc(db, "agency", "config");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const dbConfig = docSnap.data() as AgencyConfig;
          const mergedConfig = { ...DEFAULT_AGENCY, ...dbConfig };
          if (mounted) {
            setConfig(mergedConfig);
            // Update cache
            localToken.set(STORAGE_KEY, JSON.stringify(mergedConfig));
          }
        }
      } catch (error) {
        console.error("Error loading agency config from Firestore:", error);
      } finally {
        if (mounted) setIsLoaded(true);
      }
    }

    fetchAgencyConfig();
    return () => { mounted = false; };
  }, []);

  // Update config and persist to Firestore + localStorage
  const updateConfig = useCallback(async (updates: Partial<AgencyConfig>) => {
    // We use a local variable to safely compute the new config
    let newConfig: AgencyConfig = DEFAULT_AGENCY;

    setConfig((prev) => {
      newConfig = { ...prev, ...updates };

      // Update logoInitial if name changed and it's still the default or empty
      if (updates.name && (!updates.logoInitial)) {
        newConfig.logoInitial = updates.name.charAt(0).toUpperCase();
      }

      // Optimistic cache update
      try {
        localToken.set(STORAGE_KEY, JSON.stringify(newConfig));
      } catch (error) {
        console.error("Error saving agency config to cache:", error);
      }

      return newConfig;
    });

    // Background push to Firebase
    try {
      const docRef = doc(db, "agency", "config");
      // Use setDoc with merge: true to avoid overwriting unrelated fields if any
      await setDoc(docRef, newConfig, { merge: true });
    } catch (error) {
      console.error("Error saving agency config to Firestore:", error);
    }
  }, []);

  // Reset to default configuration
  const resetToDefaults = useCallback(async () => {
    setConfig(DEFAULT_AGENCY);
    try {
      localToken.remove(STORAGE_KEY);
      // Reset Firebase too
      const docRef = doc(db, "agency", "config");
      await setDoc(docRef, DEFAULT_AGENCY);
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
