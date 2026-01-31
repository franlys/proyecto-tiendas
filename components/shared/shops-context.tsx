"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { MOCK_SHOPS, type ShopConfig, type ShopTheme, type ShopSocialMedia, type ShopSchedule, DEFAULT_THEME } from "@/lib/constants";

// ============================================
// DEBUG LOGGING - SHOPS CONTEXT
// ============================================
const DEBUG_PREFIX = "🏪 [SHOPS-DEBUG]";

function debugLog(action: string, data?: unknown) {
  console.log(`${DEBUG_PREFIX} ${action}`, data ?? "");
}

function debugWarn(action: string, data?: unknown) {
  console.warn(`${DEBUG_PREFIX} ⚠️ ${action}`, data ?? "");
}

function debugError(action: string, data?: unknown) {
  console.error(`${DEBUG_PREFIX} ❌ ${action}`, data ?? "");
}

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trial";

export type ShopCategory = "beauty" | "retail" | "repair" | "restaurant" | "technology";

// Features que pueden activarse por tienda
export type FeatureId =
  | "inventory" | "variants" | "lowStockAlerts"
  | "orders" | "kanban" | "whatsappIntegration"
  | "crm" | "clientHistory" | "loyalty"
  | "campaigns" | "promoGenerator" | "emailMarketing"
  | "staffManagement" | "staffCommissions"
  | "analytics" | "multiLocation" | "api";

// Features básicos que todas las tiendas nuevas tienen
export const DEFAULT_FEATURES: FeatureId[] = [
  "inventory",
  "orders",
  "crm",
  "clientHistory",
];

export interface ManagedShop extends ShopConfig {
  isActive: boolean;
  category: ShopCategory;
  createdAt: string;
  ownerUsername?: string;
  ownerPassword?: string;
  // Subscription fields
  subscriptionStatus: SubscriptionStatus;
  nextPaymentDate: string; // ISO date string
  monthlyPrice: number;
  paymentLink?: string; // Stripe/MercadoPago link
  paymentMethod?: "stripe" | "manual";
  lastPaymentDate?: string;
  // Features enabled for this shop
  enabledFeatures?: FeatureId[];
}

interface UpdateShopData {
  name?: string;
  category?: ShopCategory;
  phone?: string;
  description?: string;
  // Visual customization
  logo?: string;
  banner?: string;
  slogan?: string;
  // Theme
  theme?: ShopTheme;
  // Contact extended
  email?: string;
  address?: string;
  city?: string;
  // Social media
  social?: ShopSocialMedia;
  // Schedule
  schedule?: ShopSchedule;
}

interface ShopsContextType {
  shops: ManagedShop[];
  getShop: (shopId: string) => ManagedShop | undefined;
  createShop: (data: CreateShopData) => ManagedShop;
  updateShop: (shopId: string, data: UpdateShopData) => void;
  toggleShopStatus: (shopId: string) => void;
  updateShopCredentials: (shopId: string, username: string, password: string) => void;
  isShopActive: (shopId: string) => boolean;
  deleteShop: (shopId: string) => void;
  // Subscription management
  updateSubscriptionStatus: (shopId: string, status: SubscriptionStatus) => void;
  registerPayment: (shopId: string, method?: "stripe" | "manual") => void;
  updatePaymentLink: (shopId: string, link: string) => void;
  isSubscriptionActive: (shopId: string) => boolean;
  // Feature management
  updateShopFeatures: (shopId: string, features: FeatureId[]) => void;
  toggleFeature: (shopId: string, featureId: FeatureId) => void;
}

interface CreateShopData {
  name: string;
  slug: string;
  category: ShopCategory;
  description: string;
  phone: string;
  wholesale: boolean;
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
    category: "beauty", // Default legacy
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
    debugLog("INIT - Loading shops from localStorage");
    const stored = localStorage.getItem(SHOPS_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        debugLog("Shops loaded from storage", { count: parsed.length, shops: parsed.map((s: ManagedShop) => s.slug) });
        setShops(parsed);
      } catch {
        debugWarn("Failed to parse shops, initializing defaults");
        setShops(initializeShops());
      }
    } else {
      debugLog("No stored shops, initializing defaults");
      setShops(initializeShops());
    }
    setIsInitialized(true);
  }, []);

  // Guardar en localStorage Y en cookies cuando cambian
  useEffect(() => {
    if (isInitialized && shops.length > 0) {
      debugLog("Saving shops to localStorage", { count: shops.length });
      localStorage.setItem(SHOPS_STORAGE_KEY, JSON.stringify(shops));

      // También guardar en cookie para que el Server pueda leerlo
      // Usamos una versión simplificada para no exceder el límite de cookies
      const simplifiedShops = shops.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description || "",
        theme: s.theme,
        contact: s.contact,
        businessType: s.businessType,
        wholesaleEnabled: s.wholesaleEnabled,
        category: s.category,
      }));
      document.cookie = `nexo-managed-shops=${encodeURIComponent(JSON.stringify(simplifiedShops))}; path=/; max-age=${60 * 60 * 24 * 365}`;
      debugLog("Saved shops to cookie for SSR access");
    }
  }, [shops, isInitialized]);

  const getShop = (shopId: string): ManagedShop | undefined => {
    const shop = shops.find((s) => s.slug === shopId);
    debugLog("getShop", { shopId, found: !!shop });
    return shop;
  };

  const createShop = (data: CreateShopData): ManagedShop => {
    debugLog("CREATE SHOP - Starting", data);

    const newShop: ManagedShop = {
      id: `shop-${Date.now()}`,
      name: data.name,
      slug: data.slug,
      category: data.category,
      description: data.description,
      theme: { ...DEFAULT_THEME, id: `theme-${data.slug}`, name: `${data.name} Theme` },
      contact: {
        phone: data.phone,
      },
      // Business Logic
      businessType: data.category === "beauty" ? "beauty" : data.category === "repair" ? "repair" : "retail",
      wholesaleEnabled: data.wholesale,

      isActive: true,
      createdAt: new Date().toISOString(),
      ownerUsername: data.slug,
      ownerPassword: "123456",
      // New shops start with trial
      subscriptionStatus: "trial",
      nextPaymentDate: getNextMonthDate(),
      monthlyPrice: 299,
    };

    debugLog("CREATE SHOP - New shop object", {
      id: newShop.id,
      slug: newShop.slug,
      name: newShop.name,
      ownerUsername: newShop.ownerUsername,
      ownerPassword: newShop.ownerPassword,
    });

    setShops((prev) => {
      debugLog("CREATE SHOP - Adding to state", { previousCount: prev.length });
      return [...prev, newShop];
    });

    debugLog("CREATE SHOP - SUCCESS ✅", { shopId: newShop.id, slug: newShop.slug });
    return newShop;
  };

  const updateShop = (shopId: string, data: UpdateShopData) => {
    debugLog("UPDATE SHOP", { shopId, data });
    setShops((prev) =>
      prev.map((shop) => {
        if (shop.slug === shopId) {
          const updated = { ...shop };
          if (data.name !== undefined) updated.name = data.name;
          if (data.category !== undefined) {
            updated.category = data.category;
            // También actualizar businessType basado en categoría
            updated.businessType = data.category === "beauty" ? "beauty" : data.category === "repair" ? "repair" : "retail";
          }
          if (data.phone !== undefined) {
            updated.contact = { ...updated.contact, phone: data.phone };
          }
          if (data.description !== undefined) updated.description = data.description;
          // Visual customization
          if (data.logo !== undefined) updated.logo = data.logo;
          if (data.banner !== undefined) updated.banner = data.banner;
          if (data.slogan !== undefined) updated.slogan = data.slogan;
          // Theme
          if (data.theme !== undefined) updated.theme = { ...updated.theme, ...data.theme };
          // Contact extended
          if (data.email !== undefined) {
            updated.contact = { ...updated.contact, email: data.email };
          }
          if (data.address !== undefined) {
            updated.contact = { ...updated.contact, address: data.address };
          }
          if (data.city !== undefined) {
            updated.contact = { ...updated.contact, city: data.city };
          }
          // Social media
          if (data.social !== undefined) {
            updated.social = { ...updated.social, ...data.social };
          }
          // Schedule
          if (data.schedule !== undefined) {
            updated.schedule = { ...updated.schedule, ...data.schedule };
          }
          debugLog("UPDATE SHOP - Applied changes", { shopId, changes: data });
          return updated;
        }
        return shop;
      })
    );
  };

  const toggleShopStatus = (shopId: string) => {
    debugLog("TOGGLE SHOP STATUS", { shopId });
    setShops((prev) =>
      prev.map((shop) => {
        if (shop.slug === shopId) {
          debugLog("TOGGLE SHOP STATUS - Changing", { from: shop.isActive, to: !shop.isActive });
          return { ...shop, isActive: !shop.isActive };
        }
        return shop;
      })
    );
  };

  const updateShopCredentials = (
    shopId: string,
    username: string,
    password: string
  ) => {
    debugLog("UPDATE CREDENTIALS", { shopId, username, passwordLength: password.length });
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
    const active = shop?.isActive ?? false;
    debugLog("isShopActive check", { shopId, active });
    return active;
  };

  // Subscription management functions
  const updateSubscriptionStatus = (shopId: string, status: SubscriptionStatus) => {
    debugLog("UPDATE SUBSCRIPTION STATUS", { shopId, newStatus: status });
    setShops((prev) =>
      prev.map((shop) => {
        if (shop.slug === shopId) {
          debugLog("UPDATE SUBSCRIPTION STATUS - Changing", { from: shop.subscriptionStatus, to: status });
          return { ...shop, subscriptionStatus: status };
        }
        return shop;
      })
    );
  };

  const deleteShop = (shopId: string) => {
    debugLog("DELETE SHOP - Starting", { shopId });
    const shopToDelete = shops.find(s => s.slug === shopId);
    if (!shopToDelete) {
      debugError("DELETE SHOP - Shop not found!", { shopId, availableSlugs: shops.map(s => s.slug) });
      return;
    }
    debugLog("DELETE SHOP - Found shop to delete", { name: shopToDelete.name, slug: shopToDelete.slug });

    setShops((prev) => {
      const filtered = prev.filter((shop) => shop.slug !== shopId);
      debugLog("DELETE SHOP - Filtered", { previousCount: prev.length, newCount: filtered.length });
      return filtered;
    });
    debugLog("DELETE SHOP - SUCCESS ✅", { shopId });
  };

  const registerPayment = (shopId: string, method: "stripe" | "manual" = "manual") => {
    debugLog("REGISTER PAYMENT", { shopId, method });
    setShops((prev) =>
      prev.map((shop) => {
        if (shop.slug === shopId) {
          debugLog("REGISTER PAYMENT - Processing", {
            shopName: shop.name,
            previousStatus: shop.subscriptionStatus,
            newStatus: "active",
            nextPaymentDate: getNextMonthDate()
          });
          return {
            ...shop,
            subscriptionStatus: "active" as SubscriptionStatus,
            lastPaymentDate: new Date().toISOString(),
            nextPaymentDate: getNextMonthDate(),
            paymentMethod: method,
          };
        }
        return shop;
      })
    );
  };

  const updatePaymentLink = (shopId: string, link: string) => {
    debugLog("UPDATE PAYMENT LINK", { shopId, link });
    setShops((prev) =>
      prev.map((shop) =>
        shop.slug === shopId ? { ...shop, paymentLink: link } : shop
      )
    );
  };

  const isSubscriptionActive = (shopId: string): boolean => {
    const shop = shops.find((s) => s.slug === shopId);
    if (!shop) {
      debugWarn("isSubscriptionActive - Shop not found", { shopId });
      return false;
    }
    const active = shop.subscriptionStatus === "active" || shop.subscriptionStatus === "trial";
    debugLog("isSubscriptionActive check", { shopId, status: shop.subscriptionStatus, isActive: active });
    return active;
  };

  // Feature management
  const updateShopFeatures = (shopId: string, features: FeatureId[]) => {
    debugLog("UPDATE SHOP FEATURES", { shopId, features });
    setShops((prev) =>
      prev.map((shop) =>
        shop.slug === shopId ? { ...shop, enabledFeatures: features } : shop
      )
    );
  };

  const toggleFeature = (shopId: string, featureId: FeatureId) => {
    debugLog("TOGGLE FEATURE", { shopId, featureId });
    setShops((prev) =>
      prev.map((shop) => {
        if (shop.slug === shopId) {
          const currentFeatures = shop.enabledFeatures || DEFAULT_FEATURES;
          const hasFeature = currentFeatures.includes(featureId);
          const newFeatures = hasFeature
            ? currentFeatures.filter(f => f !== featureId)
            : [...currentFeatures, featureId];
          debugLog("TOGGLE FEATURE - Result", { featureId, wasEnabled: hasFeature, isNowEnabled: !hasFeature });
          return { ...shop, enabledFeatures: newFeatures };
        }
        return shop;
      })
    );
  };

  return (
    <ShopsContext.Provider
      value={{
        shops,
        getShop,
        createShop,
        updateShop,
        deleteShop,
        toggleShopStatus,
        updateShopCredentials,
        isShopActive,
        updateSubscriptionStatus,
        registerPayment,
        updatePaymentLink,
        isSubscriptionActive,
        updateShopFeatures,
        toggleFeature,
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
