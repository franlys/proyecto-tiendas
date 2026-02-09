"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { SalesOrder } from "./sales-orders-context";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";

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
  orders: SalesOrder[];
}

interface ClientsContextValue {
  clients: Client[];
  getClient: (clientId: string) => Client | undefined;
  addNote: (clientId: string, note: string) => void;
  deleteNote: (clientId: string, noteId: string) => void;
  toggleVIP: (clientId: string) => void;
  refreshClients: (orders: SalesOrder[]) => void;
  firestoreCustomers: any[];
}

const NOTES_STORAGE_KEY = "client_notes";
const VIP_STORAGE_KEY = "client_vip";

const ClientsContext = createContext<ClientsContextValue | undefined>(undefined);

interface ClientsProviderProps {
  children: ReactNode;
  orders: SalesOrder[];
  shopId?: string;
}

export function ClientsProvider({ children, orders, shopId }: ClientsProviderProps) {
  const [clientNotes, setClientNotes] = useState<Record<string, ClientNote[]>>({});
  const [clientVIP, setClientVIP] = useState<Record<string, boolean>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [firestoreCustomers, setFirestoreCustomers] = useState<any[]>([]);

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

  // Subscribe to Firestore Customers
  useEffect(() => {
    if (!shopId || shopId === "default") return;

    const q = query(
      collection(db, "shops", shopId, "customers"),
      orderBy("lastActive", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const customers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFirestoreCustomers(customers);
    }, (error) => {
      console.error("Error fetching customers:", error);
    });

    return () => unsubscribe();
  }, [shopId]);

  // Extract unique clients from orders AND Firestore
  const refreshClients = useCallback(
    (ordersList: SalesOrder[]) => {
      const clientMap = new Map<string, Client>();

      // 1. Process Orders first
      ordersList.forEach((order) => {
        const clientId = order.customerPhone
          ? order.customerPhone.replace(/\D/g, "")
          : `guest_${order.id}`;

        if (!order.customerPhone) {
          return;
        }

        if (clientMap.has(clientId)) {
          const existing = clientMap.get(clientId)!;
          existing.totalSpent += order.total;
          existing.totalVisits += 1;
          existing.orders.push(order);

          // Update last visit if this order is more recent
          // SalesOrder uses createdAt, Order used date
          if (new Date(order.createdAt) > new Date(existing.lastVisit)) {
            existing.lastVisit = order.createdAt;
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
            lastVisit: order.createdAt,
            orders: [order],
          });
        }
      });

      // 2. Merge with Firestore Customers
      firestoreCustomers.forEach(customer => {
        // ID in Firestore is usually the phone number
        const clientId = customer.id;

        if (clientMap.has(clientId)) {
          // Update existing with Firestore data (name might be better?)
          const existing = clientMap.get(clientId)!;
          if (customer.name && existing.name === "Cliente") {
            existing.name = customer.name;
          }
        } else {
          // Add new client from Firestore (WhatsApp contact without orders)
          clientMap.set(clientId, {
            id: clientId,
            name: customer.name || "Cliente WhatsApp",
            phone: customer.phone || clientId,
            isVIP: clientVIP[clientId] || false,
            notes: clientNotes[clientId] || [],
            totalSpent: 0,
            totalVisits: 0,
            lastVisit: customer.lastActive || new Date().toISOString(),
            orders: [],
          });
        }
      });

      // Convert map to array and sort by last visit
      const clientsList = Array.from(clientMap.values()).sort(
        (a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
      );

      setClients(clientsList);
    },
    [clientNotes, clientVIP, firestoreCustomers]
  );

  // Refresh clients when orders change or firestore customers change
  useEffect(() => {
    refreshClients(orders);
  }, [orders, firestoreCustomers, refreshClients]);

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
        firestoreCustomers
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
