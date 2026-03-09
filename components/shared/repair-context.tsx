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

export type RepairStatus = "received" | "diagnosing" | "repairing" | "ready" | "delivered";

export const REPAIR_STATUS_CONFIG: Record<RepairStatus, {
  label: string;
  color: string;
  icon: string;
  description: string;
}> = {
  received: {
    label: "Recibido",
    color: "blue",
    icon: "📥",
    description: "Hemos recibido tu dispositivo",
  },
  diagnosing: {
    label: "En Diagnóstico",
    color: "purple",
    icon: "🔍",
    description: "Analizando el problema",
  },
  repairing: {
    label: "En Reparación",
    color: "amber",
    icon: "🔧",
    description: "Trabajando en la solución",
  },
  ready: {
    label: "Listo para Recoger",
    color: "green",
    icon: "✅",
    description: "Tu dispositivo está listo",
  },
  delivered: {
    label: "Entregado",
    color: "slate",
    icon: "🎉",
    description: "Reparación completada",
  },
};

export interface RepairTicket {
  id: string;
  folio: string;
  customerName: string;
  customerPhone: string;
  deviceType: string;
  deviceModel: string;
  issueDescription: string;
  status: RepairStatus;
  estimatedCost?: number;
  finalCost?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

interface RepairContextType {
  tickets: RepairTicket[];
  getTicket: (id: string) => RepairTicket | undefined;
  getTicketByFolio: (folio: string) => RepairTicket | undefined;
  createTicket: (ticket: Omit<RepairTicket, "id" | "folio" | "createdAt" | "updatedAt">) => RepairTicket;
  updateTicketStatus: (id: string, status: RepairStatus, notes?: string) => void;
  updateTicket: (id: string, updates: Partial<RepairTicket>) => void;
  deleteTicket: (id: string) => void;
  getActiveTickets: () => RepairTicket[];
  isLoading: boolean;
}

const RepairContext = createContext<RepairContextType | undefined>(undefined);

interface RepairProviderProps {
  children: ReactNode;
  shopId: string;
}

const getStorageKey = (shopId: string) => `repair-tickets-${shopId}`;

// Generate a unique folio
function generateFolio(): string {
  const prefix = "REP";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}${random}`.substring(0, 12);
}



export function RepairProvider({ children, shopId }: RepairProviderProps) {
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load tickets from localStorage
  useEffect(() => {
    const storageKey = getStorageKey(shopId);
    try {
      const stored = localToken.get(storageKey);
      if (stored) {
        setTickets(JSON.parse(stored));
      } else {
        setTickets([]);
      }
    } catch (error) {
      console.error("Error loading repair tickets:", error);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  // Save to localStorage when tickets change
  useEffect(() => {
    if (!isLoading) {
      const storageKey = getStorageKey(shopId);
      localToken.set(storageKey, JSON.stringify(tickets));
    }
  }, [tickets, isLoading, shopId]);

  const getTicket = useCallback(
    (id: string) => tickets.find((t) => t.id === id),
    [tickets]
  );

  const getTicketByFolio = useCallback(
    (folio: string) => tickets.find((t) => t.folio.toLowerCase() === folio.toLowerCase()),
    [tickets]
  );

  const createTicket = useCallback(
    (ticketData: Omit<RepairTicket, "id" | "folio" | "createdAt" | "updatedAt">): RepairTicket => {
      const now = new Date().toISOString();
      const newTicket: RepairTicket = {
        ...ticketData,
        id: `rt-${Date.now()}`,
        folio: generateFolio(),
        createdAt: now,
        updatedAt: now,
      };
      setTickets((prev) => [newTicket, ...prev]);
      return newTicket;
    },
    []
  );

  const updateTicketStatus = useCallback((id: string, status: RepairStatus, notes?: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updates: Partial<RepairTicket> = {
            status,
            updatedAt: new Date().toISOString(),
          };
          if (notes) updates.notes = notes;
          if (status === "delivered") updates.completedAt = new Date().toISOString();
          return { ...t, ...updates };
        }
        return t;
      })
    );
  }, []);

  const updateTicket = useCallback((id: string, updates: Partial<RepairTicket>) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      )
    );
  }, []);

  const deleteTicket = useCallback((id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getActiveTickets = useCallback(() => {
    return tickets.filter((t) => t.status !== "delivered");
  }, [tickets]);

  return (
    <RepairContext.Provider
      value={{
        tickets,
        getTicket,
        getTicketByFolio,
        createTicket,
        updateTicketStatus,
        updateTicket,
        deleteTicket,
        getActiveTickets,
        isLoading,
      }}
    >
      {children}
    </RepairContext.Provider>
  );
}

export function useRepair() {
  const context = useContext(RepairContext);
  if (context === undefined) {
    throw new Error("useRepair must be used within a RepairProvider");
  }
  return context;
}
