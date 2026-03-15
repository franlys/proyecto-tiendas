"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

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
  estimatedCost?: number;    // Costo estimado (cotización)
  quoteSentAt?: string;      // Cuándo se envió la cotización al cliente
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



export function RepairProvider({ children, shopId }: RepairProviderProps) {
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load tickets from Firestore
  useEffect(() => {
    if (!shopId || shopId === "default") { setIsLoading(false); return; }
    setIsLoading(true);
    fetch(`/api/repair/tickets?shopId=${shopId}`)
      .then((r) => r.ok ? r.json() : { tickets: [] })
      .then((d) => setTickets(d.tickets || []))
      .catch(() => setTickets([]))
      .finally(() => setIsLoading(false));
  }, [shopId]);

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
      const tempId = `temp-${Date.now()}`;
      const newTicket: RepairTicket = {
        ...ticketData,
        id: tempId,
        folio: `REP-${Date.now().toString(36).toUpperCase().slice(-5)}`,
        createdAt: now,
        updatedAt: now,
      };
      setTickets((prev) => [newTicket, ...prev]);
      fetch("/api/repair/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, ...newTicket, id: undefined }),
      })
        .then((r) => r.ok ? r.json() : null)
        .then((d) => {
          if (d?.ticket?.id) {
            setTickets((prev) =>
              prev.map((t) => t.id === tempId ? { ...t, id: d.ticket.id, folio: d.ticket.folio } : t)
            );
          }
        })
        .catch(() => {});
      return newTicket;
    },
    [shopId]
  );

  const updateTicketStatus = useCallback((id: string, status: RepairStatus, notes?: string) => {
    const now = new Date().toISOString();
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const updates: Partial<RepairTicket> = { status, updatedAt: now };
          if (notes) updates.notes = notes;
          if (status === "delivered") updates.completedAt = now;
          return { ...t, ...updates };
        }
        return t;
      })
    );
    if (!id.startsWith("temp-")) {
      const updateData: Record<string, unknown> = { status };
      if (notes) updateData.notes = notes;
      if (status === "delivered") updateData.completedAt = new Date().toISOString();
      fetch(`/api/repair/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, ...updateData }),
      }).catch(() => {});
    }
  }, [shopId]);

  const updateTicket = useCallback((id: string, updates: Partial<RepairTicket>) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
      )
    );
    if (!id.startsWith("temp-")) {
      fetch(`/api/repair/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, ...updates }),
      }).catch(() => {});
    }
  }, [shopId]);

  const deleteTicket = useCallback((id: string) => {
    setTickets((prev) => prev.filter((t) => t.id !== id));
    if (!id.startsWith("temp-")) {
      fetch(`/api/repair/tickets/${id}?shopId=${shopId}`, { method: "DELETE" }).catch(() => {});
    }
  }, [shopId]);

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
