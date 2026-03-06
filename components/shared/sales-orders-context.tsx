"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { updateOrderStatusAction, updatePaymentStatusAction } from "@/lib/actions/order-actions";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  orderBy,
  where,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { localToken } from "@/lib/utils/safe-storage";

import { SalesOrder, OrderStatus, SalesOrderItem } from "@/lib/types/order.types";
export type { SalesOrder, OrderStatus, SalesOrderItem };

// Helper to deeply clean undefined values from objects (Firestore doesn't accept undefined)
function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item));
  }
  if (typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanForFirestore(v)])
    );
  }
  return obj;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  color: string;
  icon: string;
  description: string;
}> = {
  pending: {
    label: "Pendiente",
    color: "yellow",
    icon: "⏳",
    description: "Pedido recibido, en espera de confirmación",
  },
  confirmed: {
    label: "Confirmado",
    color: "blue",
    icon: "✅",
    description: "Pedido confirmado, en proceso",
  },
  preparing: {
    label: "Preparando",
    color: "orange",
    icon: "🍳",
    description: "Pedido en preparación",
  },
  dispatched: {
    label: "Despachado",
    color: "purple",
    icon: "🚚",
    description: "Pedido enviado o listo para retiro",
  },
  delivered: {
    label: "Entregado",
    color: "green",
    icon: "🎉",
    description: "Pedido entregado con éxito",
  },
  cancelled: {
    label: "Cancelado",
    color: "red",
    icon: "❌",
    description: "Pedido cancelado",
  },
};

interface NotificationConfig {
  new_order: string[];
  payment_alert: string[];
  low_stock: string[];
  order_update: string[];
}

interface SalesOrdersContextType {
  orders: SalesOrder[];
  getOrder: (id: string) => SalesOrder | undefined;
  createOrder: (order: Omit<SalesOrder, "id" | "orderNumber" | "createdAt" | "updatedAt">) => Promise<SalesOrder | null>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  updatePaymentStatus: (id: string, status: SalesOrder["paymentStatus"]) => Promise<void>;
  updateOrder: (id: string, updates: Partial<SalesOrder>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  getOrdersByStatus: (status: OrderStatus) => SalesOrder[];
  getPendingOrders: () => SalesOrder[];
  getTodayOrders: () => SalesOrder[];
  notificationConfig: NotificationConfig;
  updateNotificationConfig: (config: Partial<NotificationConfig>) => void;
  isLoading: boolean;
}

const SalesOrdersContext = createContext<SalesOrdersContextType | undefined>(undefined);

interface SalesOrdersProviderProps {
  children: ReactNode;
  shopId: string;
}

const getNotificationKey = (shopId: string) => `notification-config-${shopId}`;

function generateOrderNumber(): string {
  const date = new Date();
  const prefix = `ORD`;
  const datePart = date.toISOString().slice(2, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${datePart}-${random}`;
}

const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  new_order: [],
  payment_alert: [],
  low_stock: [],
  order_update: [],
};

// Helper to convert Firestore timestamp to ISO string
const formatDate = (date: any): string => {
  if (!date) return new Date().toISOString();
  if (date instanceof Timestamp) return date.toDate().toISOString();
  if (date.toDate) return date.toDate().toISOString(); // Handle legacy
  if (typeof date === 'string') return date;
  return new Date().toISOString();
};

export function SalesOrdersProvider({ children, shopId }: SalesOrdersProviderProps) {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>(DEFAULT_NOTIFICATION_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Sync with Firestore
  useEffect(() => {
    if (!shopId || shopId === "default") {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, "shops", shopId, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders: SalesOrder[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedOrders.push({
          id: doc.id,
          orderNumber: data.orderNumber || doc.id,
          customerName: data.customerName || "Cliente",
          customerPhone: data.customerPhone || "",
          customerEmail: data.customerEmail,
          customerAddress: data.customerAddress,
          items: data.items || [],
          subtotal: data.subtotal || 0,
          tax: data.tax || 0,
          total: data.total || 0,
          status: data.status || "pending",
          paymentStatus: data.paymentStatus || "pending",
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          isWholesale: data.isWholesale || false,
          createdAt: formatDate(data.createdAt),
          updatedAt: formatDate(data.updatedAt),
          confirmedAt: data.confirmedAt ? formatDate(data.confirmedAt) : undefined,
          dispatchedAt: data.dispatchedAt ? formatDate(data.dispatchedAt) : undefined,
          deliveredAt: data.deliveredAt ? formatDate(data.deliveredAt) : undefined,
          tableId: data.tableId,
          source: data.source,
          paymentInfo: data.paymentInfo
        });
      });
      setOrders(fetchedOrders);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching orders:", error);
      setIsLoading(false);
    });

    // Load notification config from localStorage (client preference) or could be Firestore too
    const storedNotifications = localToken.get(getNotificationKey(shopId));
    if (storedNotifications) {
      setNotificationConfig(JSON.parse(storedNotifications));
    }

    return () => unsubscribe();
  }, [shopId]);

  const getOrder = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders]
  );

  const createOrder = useCallback(
    async (orderData: Omit<SalesOrder, "id" | "orderNumber" | "createdAt" | "updatedAt">): Promise<SalesOrder | null> => {
      try {
        const now = new Date();
        const orderNumber = generateOrderNumber();
        const newOrderData = {
          ...orderData,
          orderNumber,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        const docRef = await addDoc(collection(db, "shops", shopId, "orders"), newOrderData);

        // Optimistic update handled by onSnapshot, but we return the object for UI
        return {
          ...orderData,
          id: docRef.id,
          orderNumber,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        } as SalesOrder;

      } catch (error) {
        console.error("Error creating order:", error);
        return null;
      }
    },
    [shopId]
  );

  const updateOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    console.log(`[Orders] Updating order ${id} to status: ${status} for shop: ${shopId}`);
    try {
      // Use Server Action to trigger side effects (Inventory deduction/restoration)
      const result = await updateOrderStatusAction(shopId, id, status);
      if (!result.success) {
        throw new Error(result.error);
      }
      console.log(`[Orders] ✅ Order ${id} updated to ${status} (with inventory sync)`);
    } catch (error: any) {
      console.error("[Orders] ❌ Error updating order status:", error);
      // Show error to user
      if (typeof window !== "undefined") {
        alert(`Error al actualizar el pedido: ${error.message || "Error desconocido"}`);
      }
    }
  }, [shopId]);

  const updatePaymentStatus = useCallback(async (id: string, status: SalesOrder["paymentStatus"]) => {
    try {
      // Use Server Action to trigger side effects (Invoice)
      const result = await updatePaymentStatusAction(shopId, id, status);
      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      throw error;
    }
  }, [shopId]);

  const updateOrder = useCallback(async (id: string, updates: Partial<SalesOrder>) => {
    try {
      // Clean undefined values before saving to Firestore
      const cleanUpdates = cleanForFirestore(updates);
      await updateDoc(doc(db, "shops", shopId, "orders", id), {
        ...cleanUpdates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating order:", error);
    }
  }, [shopId]);

  const deleteOrder = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "shops", shopId, "orders", id));
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  }, [shopId]);

  const getOrdersByStatus = useCallback(
    (status: OrderStatus) => orders.filter((o) => o.status === status),
    [orders]
  );

  const getPendingOrders = useCallback(
    () => orders.filter((o) => o.status === "pending"),
    [orders]
  );

  const getTodayOrders = useCallback(() => {
    const today = new Date();
    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return (
        orderDate.getDate() === today.getDate() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear()
      );
    });
  }, [orders]);

  const updateNotificationConfig = useCallback((config: Partial<NotificationConfig>) => {
    setNotificationConfig((prev) => {
      const updated = { ...prev, ...config };
      localToken.set(getNotificationKey(shopId), JSON.stringify(updated));
      return updated;
    });
  }, [shopId]);

  return (
    <SalesOrdersContext.Provider
      value={{
        orders,
        getOrder,
        createOrder,
        updateOrderStatus,
        updatePaymentStatus,
        updateOrder,
        deleteOrder,
        getOrdersByStatus,
        getPendingOrders,
        getTodayOrders,
        notificationConfig,
        updateNotificationConfig,
        isLoading,
      }}
    >
      {children}
    </SalesOrdersContext.Provider>
  );
}

export function useSalesOrders() {
  const context = useContext(SalesOrdersContext);
  if (context === undefined) {
    throw new Error("useSalesOrders must be used within a SalesOrdersProvider");
  }
  return context;
}
