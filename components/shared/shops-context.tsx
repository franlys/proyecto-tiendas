"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { MOCK_SHOPS, type ShopConfig, type ShopTheme, type ShopSocialMedia, type ShopSchedule, type ShopBackground, DEFAULT_THEME } from "@/lib/constants";

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

// ============================================
// API HELPER FUNCTIONS
// ============================================
const API_BASE = "/api/admin/shops";

async function getAuthToken(): Promise<string | null> {
  // Check if we have an authenticated session
  const authData = localStorage.getItem("linko-auth");
  if (!authData) return null;

  try {
    const user = JSON.parse(authData);
    // In development, create a dev token
    if (user.role === "SUPER_ADMIN") {
      return `dev-admin-${user.email || user.username}`;
    } else if (user.role === "SHOP_OWNER" && user.shopId) {
      return `dev-owner-${user.shopId}`;
    }
  } catch {
    return null;
  }
  return null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { error: "No authentication token" };
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || `Error ${response.status}` };
    }

    return { data };
  } catch (error) {
    debugError("API request failed", error);
    return { error: error instanceof Error ? error.message : "API request failed" };
  }
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
  customDomain?: string;
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
  // Background
  background?: ShopBackground;
  // Contact extended
  email?: string;
  address?: string;
  city?: string;
  // Social media
  social?: ShopSocialMedia;
  // Schedule
  schedule?: ShopSchedule;
  customDomain?: string;
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
  customDomain?: string;
}

const ShopsContext = createContext<ShopsContextType | undefined>(undefined);

const SHOPS_STORAGE_KEY = "linko-managed-shops";

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
  const [useFirestore, setUseFirestore] = useState(false);

  // Función para cargar tiendas desde la API de Firestore
  const loadFromFirestore = useCallback(async (): Promise<ManagedShop[] | null> => {
    debugLog("Attempting to load shops from Firestore API...");
    const { data, error } = await apiRequest<{ shops: ManagedShop[] }>("");

    if (error) {
      debugWarn("Firestore API error, falling back to localStorage", { error });
      return null;
    }

    if (data?.shops) {
      debugLog("Shops loaded from Firestore ✅", {
        count: data.shops.length,
        shops: data.shops.map(s => s.slug)
      });
      setUseFirestore(true);
      return data.shops;
    }

    return null;
  }, []);

  // Cargar tiendas - intenta Firestore primero, luego localStorage
  useEffect(() => {
    async function loadShops() {
      debugLog("INIT - Loading shops...");

      // Intentar cargar desde Firestore API
      const firestoreShops = await loadFromFirestore();

      if (firestoreShops && firestoreShops.length > 0) {
        setShops(firestoreShops);
        // También sincronizar con localStorage como cache
        localStorage.setItem(SHOPS_STORAGE_KEY, JSON.stringify(firestoreShops));
        setIsInitialized(true);
        return;
      }

      // Fallback a localStorage
      debugLog("Loading from localStorage as fallback...");
      const stored = localStorage.getItem(SHOPS_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          debugLog("Shops loaded from localStorage", { count: parsed.length, shops: parsed.map((s: ManagedShop) => s.slug) });
          setShops(parsed);
        } catch {
          debugWarn("Failed to parse shops, initializing defaults");
          setShops(initializeShops());
        }
      } else {
        // MIGRATION: Check for legacy "nexo" data
        const legacyData = localStorage.getItem("nexo-managed-shops");
        if (legacyData) {
          try {
            debugWarn("MIGRATION: Found legacy 'nexo' data. Migrating to 'linko'...");
            const parsedLegacy = JSON.parse(legacyData);
            setShops(parsedLegacy);
            localStorage.setItem(SHOPS_STORAGE_KEY, legacyData); // Persist to new key
            debugLog("MIGRATION: Success ✅ Data restored.");
          } catch {
            setShops(initializeShops());
          }
        } else {
          debugLog("No stored shops, initializing defaults");
          setShops(initializeShops());
        }
      }
      setIsInitialized(true);
    }

    loadShops();
  }, [loadFromFirestore]);

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
        customDomain: s.customDomain,
        description: s.description || "",
        theme: s.theme,
        contact: s.contact,
        businessType: s.businessType,
        wholesaleEnabled: s.wholesaleEnabled,
        category: s.category,
      }));
      document.cookie = `linko-managed-shops=${encodeURIComponent(JSON.stringify(simplifiedShops))}; path=/; max-age=${60 * 60 * 24 * 365}`;
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
      customDomain: data.customDomain,
    };

    debugLog("CREATE SHOP - New shop object", {
      id: newShop.id,
      slug: newShop.slug,
      name: newShop.name,
      ownerUsername: newShop.ownerUsername,
      ownerPassword: newShop.ownerPassword,
    });

    // También crear en Firestore si está disponible
    if (useFirestore) {
      apiRequest<{ shop: ManagedShop }>("", {
        method: "POST",
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          category: data.category,
          description: data.description,
          phone: data.phone,
          wholesaleEnabled: data.wholesale,
          customDomain: data.customDomain,
        }),
      }).then(({ data: responseData, error }) => {
        if (error) {
          debugWarn("Failed to create shop in Firestore", { error });
        } else if (responseData?.shop) {
          debugLog("Shop created in Firestore ✅", { shopId: responseData.shop.id });
          // Actualizar con el ID real de Firestore
          setShops((prev) =>
            prev.map((s) => (s.slug === newShop.slug ? { ...s, id: responseData.shop.id } : s))
          );
        }
      });
    }

    setShops((prev) => {
      debugLog("CREATE SHOP - Adding to state", { previousCount: prev.length });
      return [...prev, newShop];
    });

    debugLog("CREATE SHOP - SUCCESS ✅", { shopId: newShop.id, slug: newShop.slug });
    return newShop;
  };

  const updateShop = (shopId: string, data: UpdateShopData) => {
    debugLog("UPDATE SHOP", { shopId, data });

    // Actualizar en Firestore si está disponible
    if (useFirestore) {
      const shop = shops.find((s) => s.slug === shopId);
      if (shop?.id) {
        apiRequest(`/${shop.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        }).then(({ error }) => {
          if (error) {
            debugWarn("Failed to update shop in Firestore", { error });
          } else {
            debugLog("Shop updated in Firestore ✅", { shopId });
          }
        });
      }
    }

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
          if (data.customDomain !== undefined) updated.customDomain = data.customDomain;
          if (data.description !== undefined) updated.description = data.description;
          // Visual customization
          if (data.logo !== undefined) updated.logo = data.logo;
          if (data.banner !== undefined) updated.banner = data.banner;
          if (data.slogan !== undefined) updated.slogan = data.slogan;
          // Theme
          if (data.theme !== undefined) updated.theme = { ...updated.theme, ...data.theme };
          // Background
          if (data.background !== undefined) {
            updated.background = { ...updated.background, ...data.background };
          }
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

    // Sincronizar con Firestore si está disponible
    if (useFirestore) {
      const shop = shops.find((s) => s.slug === shopId);
      if (shop?.id) {
        apiRequest(`/${shop.id}/toggle`, {
          method: "POST",
        }).then(({ error }) => {
          if (error) {
            debugWarn("Failed to toggle shop status in Firestore", { error });
          } else {
            debugLog("Shop status toggled in Firestore ✅", { shopId });
          }
        });
      }
    }

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

    // Eliminar en Firestore si está disponible
    if (useFirestore && shopToDelete.id) {
      apiRequest(`/${shopToDelete.id}`, {
        method: "DELETE",
      }).then(({ error }) => {
        if (error) {
          debugWarn("Failed to delete shop in Firestore", { error });
        } else {
          debugLog("Shop deleted in Firestore ✅", { shopId });
        }
      });
    }

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
