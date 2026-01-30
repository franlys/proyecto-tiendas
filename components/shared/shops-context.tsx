"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { MOCK_SHOPS, type ShopConfig, DEFAULT_THEME } from "@/lib/constants";

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trial";

export interface ManagedShop extends ShopConfig {
  isActive: boolean;
  createdAt: string;
  ownerUsername?: string;
  ownerPassword?: string;
  // Subscription fields
  subscriptionStatus: SubscriptionStatus;
  nextPaymentDate: string; // ISO date string
  monthlyPrice: number;
  paymentLink?: string; // Stripe/MercadoPago link
  lastPaymentDate?: string;
}

interface ShopsContextType {
  shops: ManagedShop[];
  getShop: (shopId: string) => ManagedShop | undefined;
  createShop: (data: CreateShopData) => ManagedShop;
  toggleShopStatus: (shopId: string) => void;
  updateShopCredentials: (shopId: string, username: string, password: string) => void;
  isShopActive: (shopId: string) => boolean;
  // Subscription management
  updateSubscriptionStatus: (shopId: string, status: SubscriptionStatus) => void;
  registerPayment: (shopId: string) => void;
  updatePaymentLink: (shopId: string, link: string) => void;
  isSubscriptionActive: (shopId: string) => boolean;
}

interface CreateShopData {
  name: string;
  slug: string;
  description: string;
  phone: string;
}

const ShopsContext = createContext<ShopsContextType | undefined>(undefined);

const SHOPS_STORAGE_KEY = "nexo-managed-shops";

// Helper to get next month date
function getNextMonthDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date.toISOString();
}

// Convertir MOCK_SHOPS a ManagedShops iniciales
function initializeShops(): ManagedShop[] {
  const initialShops: ManagedShop[] = Object.values(MOCK_SHOPS).map((shop, index) => ({
    ...shop,
    isActive: true,
    createdAt: new Date().toISOString(),
    ownerUsername: shop.slug === "estetica-lola" ? "lola" : "carlos",
    ownerPassword: "123",
    // Subscription defaults - first shop is active, second is past_due for demo
    subscriptionStatus: index === 0 ? "active" : "past_due",
    nextPaymentDate: getNextMonthDate(),
    monthlyPrice: 299,
    lastPaymentDate: new Date().toISOString(),
  }));
  return initialShops;
}

export function ShopsProvider({ children }: { children: ReactNode }) {
  const [shops, setShops] = useState<ManagedShop[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cargar tiendas desde localStorage
  useEffect(() => {
    const stored = localStorage.getItem(SHOPS_STORAGE_KEY);
    if (stored) {
      try {
        setShops(JSON.parse(stored));
      } catch {
        setShops(initializeShops());
      }
    } else {
      setShops(initializeShops());
    }
    setIsInitialized(true);
  }, []);

  // Guardar en localStorage cuando cambian
  useEffect(() => {
    if (isInitialized && shops.length > 0) {
      localStorage.setItem(SHOPS_STORAGE_KEY, JSON.stringify(shops));
    }
  }, [shops, isInitialized]);

  const getShop = (shopId: string): ManagedShop | undefined => {
    return shops.find((s) => s.slug === shopId);
  };

  const createShop = (data: CreateShopData): ManagedShop => {
    const newShop: ManagedShop = {
      id: `shop-${Date.now()}`,
      name: data.name,
      slug: data.slug,
      description: data.description,
      theme: { ...DEFAULT_THEME, id: `theme-${data.slug}`, name: `${data.name} Theme` },
      contact: {
        phone: data.phone,
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      ownerUsername: data.slug,
      ownerPassword: "123456",
      // New shops start with trial
      subscriptionStatus: "trial",
      nextPaymentDate: getNextMonthDate(),
      monthlyPrice: 299,
    };

    setShops((prev) => [...prev, newShop]);
    return newShop;
  };

  const toggleShopStatus = (shopId: string) => {
    setShops((prev) =>
      prev.map((shop) =>
        shop.slug === shopId ? { ...shop, isActive: !shop.isActive } : shop
      )
    );
  };

  const updateShopCredentials = (
    shopId: string,
    username: string,
    password: string
  ) => {
    setShops((prev) =>
      prev.map((shop) =>
        shop.slug === shopId
          ? { ...shop, ownerUsername: username, ownerPassword: password }
          : shop
      )
    );
  };

  const isShopActive = (shopId: string): boolean => {
    const shop = shops.find((s) => s.slug === shopId);
    return shop?.isActive ?? false;
  };

  // Subscription management functions
  const updateSubscriptionStatus = (shopId: string, status: SubscriptionStatus) => {
    setShops((prev) =>
      prev.map((shop) =>
        shop.slug === shopId ? { ...shop, subscriptionStatus: status } : shop
      )
    );
  };

  const registerPayment = (shopId: string) => {
    setShops((prev) =>
      prev.map((shop) =>
        shop.slug === shopId
          ? {
              ...shop,
              subscriptionStatus: "active" as SubscriptionStatus,
              lastPaymentDate: new Date().toISOString(),
              nextPaymentDate: getNextMonthDate(),
            }
          : shop
      )
    );
  };

  const updatePaymentLink = (shopId: string, link: string) => {
    setShops((prev) =>
      prev.map((shop) =>
        shop.slug === shopId ? { ...shop, paymentLink: link } : shop
      )
    );
  };

  const isSubscriptionActive = (shopId: string): boolean => {
    const shop = shops.find((s) => s.slug === shopId);
    if (!shop) return false;
    return shop.subscriptionStatus === "active" || shop.subscriptionStatus === "trial";
  };

  return (
    <ShopsContext.Provider
      value={{
        shops,
        getShop,
        createShop,
        toggleShopStatus,
        updateShopCredentials,
        isShopActive,
        updateSubscriptionStatus,
        registerPayment,
        updatePaymentLink,
        isSubscriptionActive,
      }}
    >
      {children}
    </ShopsContext.Provider>
  );
}

export function useShops() {
  const context = useContext(ShopsContext);
  if (context === undefined) {
    throw new Error("useShops must be used within a ShopsProvider");
  }
  return context;
}
