"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { Service } from "@/lib/constants";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
}

export interface Order {
  id: string;
  shopId: string;
  shopName: string;
  items: OrderItem[];
  total: number;
  date: string; // ISO string
  status: "pending" | "completed" | "cancelled";
  // Phase 9: Customer Data
  customerName?: string;
  customerPhone?: string;

  // Phase 26: Restaurant
  tableId?: string;
  orderType?: "dine-in" | "takeout" | "delivery";
}

interface OrdersContextValue {
  orders: Order[];
  addOrder: (order: Omit<Order, "id" | "date" | "status">) => Order;
  getOrdersByDate: (date: Date) => Order[];
  getOrdersByDateRange: (startDate: Date, endDate: Date) => Order[];
  getTodayOrders: () => Order[];
  getTodayStats: () => {
    totalSales: number;
    totalOrders: number;
    averageTicket: number;
    topService: string | null;
  };
  getLast7DaysStats: () => Array<{
    date: string;
    day: string;
    sales: number;
    orders: number;
  }>;
  clearOrders: () => void;
  updateStatus: (orderId: string, status: Order["status"]) => void;
}

const STORAGE_KEY = "shop-orders";

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

interface OrdersProviderProps {
  children: ReactNode;
}

// Helper to generate unique ID
function generateOrderId(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to format date for comparison
function formatDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}

// Helper to get day name
function getDayName(date: Date): string {
  const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  return days[date.getDay()];
}

export function OrdersProvider({ children }: OrdersProviderProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setOrders(parsed);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when orders change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
      } catch (error) {
        console.error("Error saving orders:", error);
      }
    }
  }, [orders, isLoaded]);

  const addOrder = useCallback(
    (orderData: Omit<Order, "id" | "date" | "status">): Order => {
      const newOrder: Order = {
        ...orderData,
        id: generateOrderId(),
        date: new Date().toISOString(),
        status: "completed", // For demo, assume completed
        tableId: orderData.tableId,
        orderType: orderData.orderType || "takeout",
      };

      setOrders((prev) => [...prev, newOrder]);
      return newOrder;
    },
    []
  );

  const getOrdersByDate = useCallback(
    (date: Date): Order[] => {
      const dateKey = formatDateKey(date);
      return orders.filter(
        (order) => formatDateKey(new Date(order.date)) === dateKey
      );
    },
    [orders]
  );

  const getOrdersByDateRange = useCallback(
    (startDate: Date, endDate: Date): Order[] => {
      return orders.filter((order) => {
        const orderDate = new Date(order.date);
        return orderDate >= startDate && orderDate <= endDate;
      });
    },
    [orders]
  );

  const getTodayOrders = useCallback((): Order[] => {
    return getOrdersByDate(new Date());
  }, [getOrdersByDate]);

  const getTodayStats = useCallback(() => {
    const todayOrders = getTodayOrders();
    const totalSales = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = todayOrders.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Find top service
    const serviceCount: Record<string, number> = {};
    todayOrders.forEach((order) => {
      order.items.forEach((item) => {
        serviceCount[item.name] = (serviceCount[item.name] || 0) + 1;
      });
    });

    let topService: string | null = null;
    let maxCount = 0;
    Object.entries(serviceCount).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topService = name;
      }
    });

    return { totalSales, totalOrders, averageTicket, topService };
  }, [getTodayOrders]);

  const getLast7DaysStats = useCallback(() => {
    const stats: Array<{
      date: string;
      day: string;
      sales: number;
      orders: number;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOrders = getOrdersByDate(date);

      stats.push({
        date: formatDateKey(date),
        day: getDayName(date),
        sales: dayOrders.reduce((sum, order) => sum + order.total, 0),
        orders: dayOrders.length,
      });
    }

    return stats;
  }, [getOrdersByDate]);

  const clearOrders = useCallback(() => {
    setOrders([]);
  }, []);

  const updateStatus = useCallback((orderId: string, status: Order["status"]) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
  }, []);

  return (
    <OrdersContext.Provider
      value={{
        orders,
        addOrder,
        getOrdersByDate,
        getOrdersByDateRange,
        getTodayOrders,
        getTodayStats,
        getLast7DaysStats,
        clearOrders,
        updateStatus,
      }}
    >
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrdersProvider");
  }
  return context;
}
