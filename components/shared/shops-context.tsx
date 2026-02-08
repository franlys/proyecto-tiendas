"use client";

import { createShopAction } from "@/lib/actions/shop-actions";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  setDoc,
  doc,
  writeBatch,
  query
} from "firebase/firestore";
import {
  MOCK_SHOPS,
  type ShopConfig,
  type ShopTheme,
  type ShopSocialMedia,
  type ShopSchedule,
  type ShopBackground,
  DEFAULT_THEME,
  DEFAULT_FEATURES, // Ensure this is exported from constants
  type FeatureId,
  type SubscriptionStatus,
  type ShopCategory
} from "@/lib/constants";

// RE-EXPORT for consumers that import from here
export { DEFAULT_FEATURES };
export type { FeatureId, SubscriptionStatus, ShopCategory, ShopBackground };

// ============================================
// TYPES
// ============================================

export interface ManagedShop extends ShopConfig {
  isActive: boolean;
  createdAt: string;
  // Auth
  ownerUsername?: string;
  ownerPassword?: string;
  // Subscription
  subscriptionStatus: SubscriptionStatus;
  nextPaymentDate: string;
  monthlyPrice?: number;
  invoiceReminders?: boolean;
  // Stats
  stats: {
    monthlyRevenue: number;
    activeOrders: number;
    completedOrders: number;
    totalCustomers: number;
  };
  // Features
  enabledFeatures?: FeatureId[];
  features?: FeatureId[]; // Legacy compatibility
  // Business Logic
  businessType: ShopCategory;
  category: ShopCategory; // Added to fix type error
  wholesaleEnabled?: boolean;
  customDomain?: string;
  paymentLink?: string; // For manual payments
  // Appearance (from agency panel)
  logo?: string;
  banner?: string;
  slogan?: string;
  background?: ShopBackground;
  social?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    website?: string;
  };
}

interface CreateShopData {
  name: string;
  slug: string;
  category: ShopCategory;
  description: string;
  phone: string;
  wholesale: boolean;
  customDomain?: string;
  monthlyPrice: number;
}

interface UpdateShopData extends Partial<ManagedShop> { }

interface ShopsContextType {
  shops: ManagedShop[];
  getShop: (shopId: string) => ManagedShop | undefined;
  createShop: (data: CreateShopData) => Promise<ManagedShop>; // Changed to Promise
  updateShop: (shopId: string, data: UpdateShopData) => Promise<void>; // Changed to Promise
  toggleShopStatus: (shopId: string) => Promise<void>;
  updateShopCredentials: (shopId: string, username: string, password: string) => Promise<void>;
  isShopActive: (shopId: string) => boolean;
  deleteShop: (shopId: string) => Promise<void>;
  // Subscription management
  updateSubscriptionStatus: (shopId: string, status: SubscriptionStatus) => Promise<void>;
  registerPayment: (shopId: string, method?: "stripe" | "manual") => Promise<void>;
  updatePaymentLink: (shopId: string, link: string) => Promise<void>;
  isSubscriptionActive: (shopId: string) => boolean;
  // Feature management
  updateShopFeatures: (shopId: string, features: FeatureId[]) => Promise<void>;
  toggleFeature: (shopId: string, featureId: FeatureId) => Promise<void>;
  restoreDemos: () => Promise<void>;

  // State
  isLoading: boolean;
  isInitialized: boolean;
}

const ShopsContext = createContext<ShopsContextType | undefined>(undefined);
const SHOPS_STORAGE_KEY = "linko-managed-shops";
const DEBUG_PREFIX = "☁️ [SHOPS-CLOUD]";

function debugLog(action: string, data?: unknown) {
  console.log(`${DEBUG_PREFIX} ${action}`, data ?? "");
}

function debugError(action: string, data?: unknown) {
  console.error(`${DEBUG_PREFIX} ❌ ${action}`, data ?? "");
}

// ============================================
// CLOUD HELPER: Initialize Data
// ============================================
async function initializeCloudShops(currentShops: ManagedShop[]) {
  // Demo logic removed per user request
  debugLog("CLOUD INIT: Demos disabled.");
}


export function ShopsProvider({ children }: { children: ReactNode }) {
  const [shops, setShops] = useState<ManagedShop[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Manual Restore Trigger
  const restoreDemos = useCallback(async () => {
    debugLog("MANUAL RESTORE DISABLED");
  }, []);

  // ============================================
  // SYNC LOGIC
  // ============================================
  useEffect(() => {
    debugLog("Initializing Cloud Sync...");
    const q = query(collection(db, "shops"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cloudShops: ManagedShop[] = [];
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();

        // Default stats object
        const defaultStats = {
          monthlyRevenue: 0,
          activeOrders: 0,
          completedOrders: 0,
          totalCustomers: 0,
        };

        cloudShops.push({
          id: docSnapshot.id,
          // Basic fields
          name: data.name || "",
          slug: data.slug || docSnapshot.id,
          description: data.description || "",
          // Theme
          theme: data.theme || DEFAULT_THEME,
          // Contact
          contact: data.contact || { phone: "" },
          // Business type
          businessType: data.businessType || data.category || "retail",
          category: data.category || data.businessType || "retail",
          wholesaleEnabled: data.wholesaleEnabled ?? false,
          customDomain: data.customDomain,
          // State
          isActive: data.isActive ?? true,
          createdAt: data.createdAt || new Date().toISOString(),
          // Auth
          ownerUsername: data.ownerUsername || data.slug || "",
          ownerPassword: data.ownerPassword || "123",
          // Subscription - Handle both flat and nested structures
          subscriptionStatus: data.subscriptionStatus ?? data.subscription?.status ?? "trial",
          nextPaymentDate: data.nextPaymentDate ?? data.subscription?.nextPaymentDate ?? new Date().toISOString(),
          monthlyPrice: data.monthlyPrice ?? data.subscription?.monthlyPrice ?? 0,
          paymentLink: data.paymentLink,
          // Features
          enabledFeatures: data.enabledFeatures ?? data.features ?? [],
          features: data.features ?? data.enabledFeatures ?? [],
          // Stats - Always ensure it exists
          stats: data.stats ? { ...defaultStats, ...data.stats } : defaultStats,
          // Appearance (from agency panel)
          logo: data.logo,
          banner: data.banner,
          slogan: data.slogan,
          background: data.background,
          social: data.social,
        } as ManagedShop);
      });

      debugLog("Shops loaded:", cloudShops.length);
      setShops(cloudShops);
      setIsLoading(false);

    }, (error) => {
      debugError("Sync Failed", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ============================================
  // IMPLEMENTATION API
  // ============================================

  const getShop = useCallback((shopId: string) => shops.find((s) => s.id === shopId || s.slug === shopId), [shops]);

  const isShopActive = useCallback((shopId: string) => {
    const shop = shops.find((s) => s.slug === shopId || s.id === shopId);
    return shop?.isActive ?? false;
  }, [shops]);

  const isSubscriptionActive = useCallback((shopId: string) => {
    const shop = shops.find((s) => s.slug === shopId || s.id === shopId);
    return shop ? (shop.subscriptionStatus === "active" || shop.subscriptionStatus === "trial") : false;
  }, [shops]);

  // --- WRITE OPERATIONS (Direct to Firestore) ---

  const createShop = useCallback(async (data: CreateShopData): Promise<ManagedShop> => {
    // 1. Validation: Check if shop exists
    if (shops.some(s => s.slug === data.slug)) {
      alert("¡Error! Ya existe una tienda con este nombre/slug.");
      throw new Error("Duplicate shop slug");
    }

    const newId = `shop-${Date.now()}`;
    const newShop: ManagedShop = {
      id: newId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      theme: { ...DEFAULT_THEME, id: `theme-${data.slug}`, name: `${data.name} Theme` },
      contact: { phone: data.phone },
      businessType: data.category, // Use category directly as they share the same type definition
      wholesaleEnabled: data.wholesale,
      customDomain: data.customDomain,
      category: data.category,

      isActive: true,
      createdAt: new Date().toISOString(),
      ownerUsername: data.slug, // Default
      ownerPassword: "123",
      subscriptionStatus: "trial",
      nextPaymentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      monthlyPrice: data.monthlyPrice || 0, // Set the custom price
      features: DEFAULT_FEATURES as FeatureId[],
      enabledFeatures: DEFAULT_FEATURES as FeatureId[],
      stats: { monthlyRevenue: 0, activeOrders: 0, completedOrders: 0, totalCustomers: 0 }
    };

    debugLog("CREANDO TIENDA (Server Action)...", newShop);
    try {
      const result = await createShopAction(newShop);

      if (!result.success) {
        throw new Error(result.error);
      }

      debugLog("TIENDA GUARDADA EXITOSAMENTE ✅");
      setShops(prev => [...prev, newShop]);
    } catch (error) {
      console.error("ERROR GUARDANDO TIENDA ❌", error);
      alert(`Error guardando en base de datos: ${(error as any).message}`);
      throw error;
    }
    return newShop;
  }, []);

  const updateShop = useCallback(async (shopId: string, data: UpdateShopData) => {
    // Need actual ID, might receive slug
    const shop = shops.find(s => s.id === shopId || s.slug === shopId);

    console.log("🛠️ [DEBUG] updateShop called:", {
      searchInput: shopId,
      foundShop: shop?.id,
      dataToSave: data
    });

    if (!shop) {
      console.error("❌ [DEBUG] Shop not found for update:", shopId);
      return;
    }

    try {
      await setDoc(doc(db, "shops", shop.id), data, { merge: true });
      console.log("✅ [DEBUG] Shop updated in Firestore successfully");
    } catch (e) {
      console.error("❌ [DEBUG] Error writing to Firestore:", e);
    }
  }, [shops]);

  const toggleShopStatus = useCallback(async (shopId: string) => {
    const shop = shops.find(s => s.id === shopId || s.slug === shopId);
    if (!shop) return;
    await setDoc(doc(db, "shops", shop.id), { isActive: !shop.isActive }, { merge: true });
  }, [shops]);

  const deleteShop = useCallback(async (shopId: string) => {
    // Soft delete or real delete? User didn't specify. Admin panel uses deleteShop. 
    // Just de-activate for now or do nothing if we want to preserve data.
    // Let's implement Delete logic but maybe just console log it effectively for "protection"
    // Or actually delete. Let's strictly delete.
    const shop = shops.find(s => s.id === shopId || s.slug === shopId);
    if (shop) {
      try {
        const { deleteDoc, doc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "shops", shop.id));
        debugLog("Shop deleted successfully", shopId);
        // Update local state to remove the deleted shop immediately
        setShops(prev => prev.filter(s => s.id !== shop.id));
      } catch (error) {
        console.error("Error deleting shop:", error);
        alert("Error eliminando la tienda. Verifica tu conexión o permisos.");
      }
    }
  }, [shops]);

  const updateShopCredentials = useCallback(async (shopId: string, u: string, p: string) => {
    const shop = shops.find(s => s.id === shopId || s.slug === shopId);
    if (!shop) return;
    await setDoc(doc(db, "shops", shop.id), { ownerUsername: u, ownerPassword: p }, { merge: true });
  }, [shops]);

  const updateSubscriptionStatus = useCallback(async (shopId: string, status: SubscriptionStatus) => {
    const shop = shops.find(s => s.id === shopId || s.slug === shopId);
    if (!shop) return;
    await setDoc(doc(db, "shops", shop.id), { subscriptionStatus: status }, { merge: true });
  }, [shops]);

  const registerPayment = useCallback(async (shopId: string, method?: "stripe" | "manual") => {
    const shop = shops.find(s => s.id === shopId || s.slug === shopId);
    if (!shop) return;

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 30);

    // Ensure stats has default values
    const currentStats = shop.stats || {
      monthlyRevenue: 0,
      activeOrders: 0,
      completedOrders: 0,
      totalCustomers: 0,
    };

    await setDoc(doc(db, "shops", shop.id), {
      subscriptionStatus: "active",
      nextPaymentDate: nextDate.toISOString(),
      stats: {
        ...currentStats,
        monthlyRevenue: (currentStats.monthlyRevenue || 0) + (shop.monthlyPrice || 0)
      }
    }, { merge: true });
  }, [shops]);

  const updatePaymentLink = useCallback(async (shopId: string, link: string) => {
    // No-op
  }, []);

  const updateShopFeatures = useCallback(async (shopId: string, features: FeatureId[]) => {
    const shop = shops.find(s => s.id === shopId || s.slug === shopId);
    if (!shop) return;
    await setDoc(doc(db, "shops", shop.id), { enabledFeatures: features, features: features }, { merge: true });
  }, [shops]);

  const toggleFeature = useCallback(async (shopId: string, featureId: FeatureId) => {
    const shop = shops.find(s => s.id === shopId || s.slug === shopId);
    if (!shop) return;
    const current = shop.enabledFeatures || [];
    const newFeatures = current.includes(featureId)
      ? current.filter(f => f !== featureId)
      : [...current, featureId];
    await setDoc(doc(db, "shops", shop.id), { enabledFeatures: newFeatures, features: newFeatures }, { merge: true });
  }, [shops]);

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
        restoreDemos,
        isLoading,
        isInitialized: !isLoading
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
