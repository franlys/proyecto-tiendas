"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Order } from "./orders-context";

export interface ClientNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isVIP: boolean;
  notes: ClientNote[];
  totalSpent: number;
  totalVisits: number;
  lastVisit: string;
  orders: Order[];
}

interface ClientsContextValue {
  clients: Client[];
  getClient: (clientId: string) => Client | undefined;
  addNote: (clientId: string, note: string) => void;
  deleteNote: (clientId: string, noteId: string) => void;
  toggleVIP: (clientId: string) => void;
  refreshClients: (orders: Order[]) => void;
}

const NOTES_STORAGE_KEY = "client_notes";
const VIP_STORAGE_KEY = "client_vip";

const ClientsContext = createContext<ClientsContextValue | undefined>(undefined);

interface ClientsProviderProps {
  children: ReactNode;
  orders: Order[];
}

// Generate client ID from name (simplified, in production would use phone/email)
function generateClientId(shopName: string): string {
  return `client_${shopName.toLowerCase().replace(/\s+/g, "_")}`;
}

export function ClientsProvider({ children, orders }: ClientsProviderProps) {
  const [clientNotes, setClientNotes] = useState<Record<string, ClientNote[]>>({});
  const [clientVIP, setClientVIP] = useState<Record<string, boolean>>({});
  const [clients, setClients] = useState<Client[]>([]);

  // Load notes and VIP status from localStorage
  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
      if (storedNotes) {
        setClientNotes(JSON.parse(storedNotes));
      }

      const storedVIP = localStorage.getItem(VIP_STORAGE_KEY);
      if (storedVIP) {
        setClientVIP(JSON.parse(storedVIP));
      }
    } catch (error) {
      console.error("Error loading client data:", error);
    }
  }, []);

  // Save notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(clientNotes));
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  }, [clientNotes]);

  // Save VIP status to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(VIP_STORAGE_KEY, JSON.stringify(clientVIP));
    } catch (error) {
      console.error("Error saving VIP status:", error);
    }
  }, [clientVIP]);

  // Extract unique clients from orders
  const refreshClients = useCallback(
    (ordersList: Order[]) => {
      const clientMap = new Map<string, Client>();

      ordersList.forEach((order) => {
        // Phase 9: Use Phone as unique identifier
        // If no phone, we use a fallback (e.g. for content created before this feature)
        // In a real app we'd enforce phone on checkout.
        const clientId = order.customerPhone
          ? order.customerPhone.replace(/\D/g, "")
          : `guest_${order.id}`;

        if (!order.customerPhone) {
          // Skip guest orders for loyalty tracking (or handle differently)
          return;
        }

        if (clientMap.has(clientId)) {
          const existing = clientMap.get(clientId)!;
          existing.totalSpent += order.total;
          existing.totalVisits += 1;
          existing.orders.push(order);

          // Update last visit if this order is more recent
          if (new Date(order.date) > new Date(existing.lastVisit)) {
            existing.lastVisit = order.date;
          }
        } else {
          clientMap.set(clientId, {
            id: clientId,
            name: order.customerName || "Cliente",
            phone: order.customerPhone,
            isVIP: clientVIP[clientId] || false,
            notes: clientNotes[clientId] || [],
            totalSpent: order.total,
            totalVisits: 1,
            lastVisit: order.date,
            orders: [order],
          });
        }
      });

      // Convert map to array and sort by last visit
      const clientsList = Array.from(clientMap.values()).sort(
        (a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
      );

      setClients(clientsList);
    },
    [clientNotes, clientVIP]
  );

  // Refresh clients when orders change
  useEffect(() => {
    refreshClients(orders);
  }, [orders, refreshClients]);

  const getClient = useCallback(
    (clientId: string): Client | undefined => {
      return clients.find((c) => c.id === clientId);
    },
    [clients]
  );

  const addNote = useCallback((clientId: string, text: string) => {
    const newNote: ClientNote = {
      id: `note_${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
    };

    setClientNotes((prev) => ({
      ...prev,
      [clientId]: [...(prev[clientId] || []), newNote],
    }));

    // Update the client in the list
    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? { ...client, notes: [...client.notes, newNote] }
          : client
      )
    );
  }, []);

  const deleteNote = useCallback((clientId: string, noteId: string) => {
    setClientNotes((prev) => ({
      ...prev,
      [clientId]: (prev[clientId] || []).filter((n) => n.id !== noteId),
    }));

    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId
          ? { ...client, notes: client.notes.filter((n) => n.id !== noteId) }
          : client
      )
    );
  }, []);

  const toggleVIP = useCallback((clientId: string) => {
    setClientVIP((prev) => ({
      ...prev,
      [clientId]: !prev[clientId],
    }));

    setClients((prev) =>
      prev.map((client) =>
        client.id === clientId ? { ...client, isVIP: !client.isVIP } : client
      )
    );
  }, []);

  return (
    <ClientsContext.Provider
      value={{
        clients,
        getClient,
        addNote,
        deleteNote,
        toggleVIP,
        refreshClients,
      }}
    >
      {children}
    </ClientsContext.Provider>
  );
}

export function useClients() {
  const context = useContext(ClientsContext);
  if (context === undefined) {
    throw new Error("useClients must be used within a ClientsProvider");
  }
  return context;
}
