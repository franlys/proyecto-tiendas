"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

export type OrderStatus = "pending" | "confirmed" | "preparing" | "dispatched" | "delivered" | "cancelled";

export const ORDER_STATUS_CONFIG: Record<OrderStatus, {
  label: string;
  color: string;
  icon: string;
  description: string;
}> = {
  pending: {
    label: "Por Confirmar",
    color: "amber",
    icon: "🔔",
    description: "Esperando confirmación",
  },
  confirmed: {
    label: "Confirmado",
    color: "blue",
    icon: "✅",
    description: "Pedido confirmado",
  },
  preparing: {
    label: "Preparando",
    color: "purple",
    icon: "📦",
    description: "En preparación",
  },
  dispatched: {
    label: "Despachado",
    color: "cyan",
    icon: "🚚",
    description: "En camino",
  },
  delivered: {
    label: "Entregado",
    color: "green",
    icon: "🎉",
    description: "Pedido completado",
  },
  cancelled: {
    label: "Cancelado",
    color: "red",
    icon: "❌",
    description: "Pedido cancelado",
  },
};

export interface SalesOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  items: SalesOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: "pending" | "paid" | "refunded";
  paymentMethod?: string;
  notes?: string;
  isWholesale: boolean;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
}

interface NotificationConfig {
  new_order: string[];
  payment_alert: string[];
  low_stock: string[];
  order_update: string[];
}

interface SalesOrdersContextType {
  orders: SalesOrder[];
  getOrder: (id: string) => SalesOrder | undefined;
  createOrder: (order: Omit<SalesOrder, "id" | "orderNumber" | "createdAt" | "updatedAt">) => SalesOrder;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  updatePaymentStatus: (id: string, status: SalesOrder["paymentStatus"]) => void;
  updateOrder: (id: string, updates: Partial<SalesOrder>) => void;
  deleteOrder: (id: string) => void;
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

const getStorageKey = (shopId: string) => `sales-orders-${shopId}`;
const getNotificationKey = (shopId: string) => `notification-config-${shopId}`;

// Generate order number
function generateOrderNumber(): string {
  const date = new Date();
  const prefix = `ORD`;
  const datePart = date.toISOString().slice(2, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${datePart}-${random}`;
}

// Demo orders
const DEMO_ORDERS: SalesOrder[] = [
  {
    id: "so1",
    orderNumber: "ORD-260129-A1B2",
    customerName: "Juan Martínez",
    customerPhone: "555-123-4567",
    customerEmail: "juan@email.com",
    customerAddress: "Calle Principal 123, Col. Centro",
    items: [
      { productId: "p1", productName: "Shampoo Hidratante Premium", quantity: 2, unitPrice: 280, total: 560 },
      { productId: "p2", productName: "Mascarilla Keratina", quantity: 1, unitPrice: 380, total: 380 },
    ],
    subtotal: 940,
    tax: 150.40,
    total: 1090.40,
    status: "pending",
    paymentStatus: "pending",
    isWholesale: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "so2",
    orderNumber: "ORD-260129-C3D4",
    customerName: "María López",
    customerPhone: "555-987-6543",
    items: [
      { productId: "p5", productName: "Crema Facial Vitamina C", quantity: 3, unitPrice: 580, total: 1740 },
    ],
    subtotal: 1740,
    tax: 278.40,
    total: 2018.40,
    status: "confirmed",
    paymentStatus: "paid",
    paymentMethod: "Transferencia",
    isWholesale: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "so3",
    orderNumber: "ORD-260128-E5F6",
    customerName: "Distribuidora García",
    customerPhone: "555-456-7890",
    customerAddress: "Av. Industrial 500, Zona Norte",
    items: [
      { productId: "p1", productName: "Shampoo Hidratante Premium", quantity: 24, unitPrice: 180, total: 4320 },
      { productId: "p3", productName: "Aceite de Argán", quantity: 12, unitPrice: 200, total: 2400 },
      { productId: "p4", productName: "Serum Anti-Frizz", quantity: 12, unitPrice: 140, total: 1680 },
    ],
    subtotal: 8400,
    tax: 1344,
    total: 9744,
    status: "preparing",
    paymentStatus: "paid",
    paymentMethod: "Crédito 30 días",
    notes: "Pedido mayorista - Entregar en almacén",
    isWholesale: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    confirmedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
];

const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  new_order: [],
  payment_alert: [],
  low_stock: [],
  order_update: [],
};

export function SalesOrdersProvider({ children, shopId }: SalesOrdersProviderProps) {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>(DEFAULT_NOTIFICATION_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Load orders from localStorage
  useEffect(() => {
    const storageKey = getStorageKey(shopId);
    const notificationKey = getNotificationKey(shopId);
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setOrders(JSON.parse(stored));
      } else {
        setOrders(DEMO_ORDERS);
        localStorage.setItem(storageKey, JSON.stringify(DEMO_ORDERS));
      }

      const storedNotifications = localStorage.getItem(notificationKey);
      if (storedNotifications) {
        setNotificationConfig(JSON.parse(storedNotifications));
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders(DEMO_ORDERS);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  // Save to localStorage when orders change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(getStorageKey(shopId), JSON.stringify(orders));
    }
  }, [orders, isLoading, shopId]);

  const getOrder = useCallback(
    (id: string) => orders.find((o) => o.id === id),
    [orders]
  );

  const createOrder = useCallback(
    (orderData: Omit<SalesOrder, "id" | "orderNumber" | "createdAt" | "updatedAt">): SalesOrder => {
      const now = new Date().toISOString();
      const newOrder: SalesOrder = {
        ...orderData,
        id: `so-${Date.now()}`,
        orderNumber: generateOrderNumber(),
        createdAt: now,
        updatedAt: now,
      };
      setOrders((prev) => [newOrder, ...prev]);

      // Trigger notification (would call Evolution API in production)
      console.log(`[Notification] New order ${newOrder.orderNumber} - notify: ${notificationConfig.new_order.join(", ")}`);

      return newOrder;
    },
    [notificationConfig]
  );

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === id) {
          const updates: Partial<SalesOrder> = {
            status,
            updatedAt: new Date().toISOString(),
          };

          if (status === "confirmed") updates.confirmedAt = new Date().toISOString();
          if (status === "dispatched") updates.dispatchedAt = new Date().toISOString();
          if (status === "delivered") updates.deliveredAt = new Date().toISOString();

          return { ...o, ...updates };
        }
        return o;
      })
    );
  }, []);

  const updatePaymentStatus = useCallback((id: string, paymentStatus: SalesOrder["paymentStatus"]) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, paymentStatus, updatedAt: new Date().toISOString() } : o
      )
    );
  }, []);

  const updateOrder = useCallback((id: string, updates: Partial<SalesOrder>) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o
      )
    );
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const getOrdersByStatus = useCallback(
    (status: OrderStatus) => orders.filter((o) => o.status === status),
    [orders]
  );

  const getPendingOrders = useCallback(
    () => orders.filter((o) => o.status === "pending"),
    [orders]
  );

  const getTodayOrders = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    return orders.filter((o) => o.createdAt.startsWith(today));
  }, [orders]);

  const updateNotificationConfig = useCallback((config: Partial<NotificationConfig>) => {
    setNotificationConfig((prev) => {
      const updated = { ...prev, ...config };
      localStorage.setItem(getNotificationKey(shopId), JSON.stringify(updated));
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
