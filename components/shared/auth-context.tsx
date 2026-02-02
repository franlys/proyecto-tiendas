"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

// ============================================
// DEBUG LOGGING - SUPER ADMIN
// ============================================
const DEBUG_PREFIX = "🔐 [AUTH-DEBUG]";

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
// ROLES DEL SISTEMA
// ============================================
// SUPER_ADMIN: Agencia - configura WhatsApp, gestiona todas las tiendas
// SHOP_OWNER: Dueño de tienda - gestiona su tienda, staff, timeout de sesión
// SHOP_STAFF: Empleado - login con usuario/contraseña, timeout configurable

export type UserRole = "SUPER_ADMIN" | "SHOP_OWNER" | "SHOP_STAFF";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  shopId?: string;
  // Staff-specific fields
  staffRole?: "owner" | "manager" | "sales" | "warehouse";
  email?: string;
  phone?: string;
  avatar?: string;
}

// Shop session configuration (set by SHOP_OWNER)
export interface ShopSessionConfig {
  shopId: string;
  sessionTimeoutMinutes: number; // Configurable by shop owner
  requireLoginOnMobile: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  staffLogin: (shopId: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isShopOwner: boolean;
  isStaff: boolean;
  canAccessShop: (shopId: string) => boolean;
  canConfigureWhatsApp: boolean; // Only SUPER_ADMIN
  // Session management
  sessionExpired: boolean;
  clearSessionExpired: () => void;
  // Shop session config
  getShopSessionConfig: (shopId: string) => ShopSessionConfig;
  updateShopSessionConfig: (shopId: string, config: Partial<ShopSessionConfig>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default session timeout for admin (30 minutes)
const DEFAULT_ADMIN_TIMEOUT = 30 * 60 * 1000;

// Default session timeout for staff (configurable per shop, default 24 hours)
const DEFAULT_STAFF_TIMEOUT = 24 * 60 * 60 * 1000;

const ACTIVITY_STORAGE_KEY = "linko-last-activity";
const AUTH_STORAGE_KEY = "linko-auth";
const SHOP_SESSIONS_KEY = "linko-shop-sessions";

// ============================================
// DEMO USERS DATABASE
// ============================================

// Admin/Owner users (login at /login)
const ADMIN_USERS_DB: Record<string, { password: string; user: User }> = {
  // Real Super Admin
  "franlysgonzaleztejeda@gmail.com": {
    password: "Progreso070901*",
    user: {
      id: "super-admin-1",
      username: "franlysgonzaleztejeda@gmail.com",
      name: "Franlys González",
      role: "SUPER_ADMIN",
      email: "franlysgonzaleztejeda@gmail.com",
    },
  },
  // Demo shop owners (for testing - can be removed later)
  demo_owner: {
    password: "demo2024",
    user: {
      id: "demo-owner-1",
      username: "demo_owner",
      name: "Usuario Demo",
      role: "SHOP_OWNER",
      shopId: "estetica-lola",
    },
  },
};

// Staff users per shop (login at /staff/login)
const STAFF_USERS_DB: Record<string, Record<string, { password: string; user: User }>> = {
  "estetica-lola": {
    "maria.rodriguez": {
      password: "1234",
      user: {
        id: "staff-sales1",
        username: "maria.rodriguez",
        name: "María Rodríguez",
        role: "SHOP_STAFF",
        shopId: "estetica-lola",
        staffRole: "sales",
        email: "maria@estetica-lola.com",
        phone: "555-100-0003",
      },
    },
    "juan.martinez": {
      password: "1234",
      user: {
        id: "staff-sales2",
        username: "juan.martinez",
        name: "Juan Martínez",
        role: "SHOP_STAFF",
        shopId: "estetica-lola",
        staffRole: "sales",
        email: "juan@estetica-lola.com",
      },
    },
    "pedro.sanchez": {
      password: "1234",
      user: {
        id: "staff-warehouse",
        username: "pedro.sanchez",
        name: "Pedro Sánchez",
        role: "SHOP_STAFF",
        shopId: "estetica-lola",
        staffRole: "warehouse",
        email: "pedro@estetica-lola.com",
      },
    },
    "carlos.lopez": {
      password: "1234",
      user: {
        id: "staff-manager",
        username: "carlos.lopez",
        name: "Carlos López",
        role: "SHOP_STAFF",
        shopId: "estetica-lola",
        staffRole: "manager",
        email: "carlos.lopez@estetica-lola.com",
      },
    },
  },
  "barberia-classic": {
    "empleado1": {
      password: "1234",
      user: {
        id: "staff-bc-1",
        username: "empleado1",
        name: "Empleado Barbería",
        role: "SHOP_STAFF",
        shopId: "barberia-classic",
        staffRole: "sales",
      },
    },
  },
};

// Default shop session configs
const DEFAULT_SHOP_SESSIONS: Record<string, ShopSessionConfig> = {
  "estetica-lola": {
    shopId: "estetica-lola",
    sessionTimeoutMinutes: 60 * 24, // 24 hours
    requireLoginOnMobile: true,
  },
  "barberia-classic": {
    shopId: "barberia-classic",
    sessionTimeoutMinutes: 60 * 8, // 8 hours
    requireLoginOnMobile: true,
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [shopSessions, setShopSessions] = useState<Record<string, ShopSessionConfig>>(DEFAULT_SHOP_SESSIONS);

  // Get shop session config helper
  const getShopSessionConfig = useCallback((shopId: string): ShopSessionConfig => {
    return (
      shopSessions[shopId] || {
        shopId,
        sessionTimeoutMinutes: 60 * 24, // Default 24 hours
        requireLoginOnMobile: true,
      }
    );
  }, [shopSessions]);

  // Get timeout based on user type
  const getSessionTimeout = useCallback((): number => {
    if (!user) return DEFAULT_ADMIN_TIMEOUT;

    // Admin/Owner: 30 minutes
    if (user.role === "SUPER_ADMIN" || user.role === "SHOP_OWNER") {
      return DEFAULT_ADMIN_TIMEOUT;
    }

    // Staff: Use shop's configured timeout
    if (user.role === "SHOP_STAFF" && user.shopId) {
      const config = getShopSessionConfig(user.shopId);
      return config.sessionTimeoutMinutes * 60 * 1000;
    }

    return DEFAULT_STAFF_TIMEOUT;
  }, [user, getShopSessionConfig]);

  // Update last activity timestamp
  const updateActivity = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVITY_STORAGE_KEY, Date.now().toString());
    }
  }, []);

  // Check if session has expired
  const checkSessionExpiration = useCallback((): boolean => {
    const lastActivity = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!lastActivity) return false;

    const elapsed = Date.now() - parseInt(lastActivity, 10);
    return elapsed > getSessionTimeout();
  }, [getSessionTimeout]);

  // Clear session (logout due to inactivity)
  const clearSession = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(ACTIVITY_STORAGE_KEY);
  }, []);

  // Load session and shop configs from localStorage on init
  useEffect(() => {
    debugLog("INIT - Loading session from localStorage");

    // Load shop session configs
    const storedSessions = localStorage.getItem(SHOP_SESSIONS_KEY);
    if (storedSessions) {
      try {
        setShopSessions({ ...DEFAULT_SHOP_SESSIONS, ...JSON.parse(storedSessions) });
        debugLog("Shop sessions loaded", JSON.parse(storedSessions));
      } catch {
        debugWarn("Failed to parse shop sessions, using defaults");
      }
    }

    // MIGRATION: Check for legacy "nexo" auth data
    const legacyAuth = localStorage.getItem("nexo-auth");
    const migrationAuthDone = localStorage.getItem("linko-migration-auth-v1");

    if (legacyAuth && !migrationAuthDone) {
      debugWarn("MIGRATION: Found legacy auth data. Restoring session...");
      localStorage.setItem(AUTH_STORAGE_KEY, legacyAuth);
      localStorage.setItem("linko-migration-auth-v1", "true");

      // Also migrate shop sessions and activity if present
      const legacySessions = localStorage.getItem("nexo-shop-sessions");
      if (legacySessions) localStorage.setItem(SHOP_SESSIONS_KEY, legacySessions);

      const legacyActivity = localStorage.getItem("nexo-last-activity");
      if (legacyActivity) localStorage.setItem(ACTIVITY_STORAGE_KEY, legacyActivity);
    }

    // Load auth session
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    debugLog("Stored auth data found", { hasStoredAuth: !!stored });

    if (stored) {
      try {
        // First parse to get user info for timeout calculation
        const parsed = JSON.parse(stored);
        debugLog("Parsed stored user", {
          userId: parsed.id,
          role: parsed.role,
          name: parsed.name,
          isSuperAdmin: parsed.role === "SUPER_ADMIN",
        });

        // Check expiration based on user type
        const lastActivity = localStorage.getItem(ACTIVITY_STORAGE_KEY);
        if (lastActivity) {
          const elapsed = Date.now() - parseInt(lastActivity, 10);
          let timeout = DEFAULT_ADMIN_TIMEOUT;

          if (parsed.role === "SHOP_STAFF" && parsed.shopId) {
            const config = DEFAULT_SHOP_SESSIONS[parsed.shopId];
            if (config) {
              timeout = config.sessionTimeoutMinutes * 60 * 1000;
            } else {
              timeout = DEFAULT_STAFF_TIMEOUT;
            }
          }

          debugLog("Session timeout check", {
            elapsed: Math.round(elapsed / 1000) + "s",
            timeout: Math.round(timeout / 1000) + "s",
            expired: elapsed > timeout
          });

          if (elapsed > timeout) {
            debugWarn("SESSION EXPIRED - clearing");
            clearSession();
            setSessionExpired(true);
          } else {
            debugLog("SESSION RESTORED ✅", {
              role: parsed.role,
              isSuperAdmin: parsed.role === "SUPER_ADMIN",
            });
            setUser(parsed);
            updateActivity();
          }
        } else {
          debugLog("No last activity, restoring session", { role: parsed.role });
          setUser(parsed);
          updateActivity();
        }
      } catch {
        debugError("Failed to parse stored auth, removing");
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } else {
      debugLog("No stored session found - user needs to login");
    }
    setIsLoading(false);
  }, [clearSession, updateActivity]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    const activityEvents = ["mousedown", "keydown", "touchstart", "scroll"];
    let lastUpdate = Date.now();
    const throttleMs = 60000; // Update at most every 1 minute

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > throttleMs) {
        lastUpdate = now;
        updateActivity();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Check session expiration periodically
    const intervalId = setInterval(() => {
      if (checkSessionExpiration()) {
        clearSession();
        setSessionExpired(true);
      }
    }, 60000);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearInterval(intervalId);
    };
  }, [user, updateActivity, checkSessionExpiration, clearSession]);

  // Admin/Owner login
  const login = async (username: string, password: string): Promise<boolean> => {
    debugLog("LOGIN ATTEMPT", { username, passwordLength: password.length });
    debugLog("Available users in DB", Object.keys(ADMIN_USERS_DB));

    await new Promise((resolve) => setTimeout(resolve, 500));

    // 1. First check static ADMIN_USERS_DB
    const userRecord = ADMIN_USERS_DB[username.toLowerCase()];
    debugLog("User lookup result", { found: !!userRecord, username: username.toLowerCase() });

    if (userRecord && userRecord.password === password) {
      debugLog("LOGIN SUCCESS ✅", {
        userId: userRecord.user.id,
        role: userRecord.user.role,
        name: userRecord.user.name,
        isSuperAdmin: userRecord.user.role === "SUPER_ADMIN",
        canConfigureWhatsApp: userRecord.user.role === "SUPER_ADMIN",
      });
      setUser(userRecord.user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userRecord.user));
      updateActivity();
      setSessionExpired(false);
      return true;
    }

    // 2. Check managed shops in localStorage (dynamic shop owners)
    debugLog("Checking managed shops for dynamic login...");
    try {
      const storedShops = localStorage.getItem("linko-managed-shops");
      if (storedShops) {
        const managedShops = JSON.parse(storedShops);
        debugLog("Found managed shops", { count: managedShops.length });

        const matchingShop = managedShops.find(
          (shop: { ownerUsername?: string; ownerPassword?: string }) =>
            shop.ownerUsername?.toLowerCase() === username.toLowerCase() &&
            shop.ownerPassword === password
        );

        if (matchingShop) {
          const dynamicUser: User = {
            id: `shop-owner-${matchingShop.slug}`,
            username: matchingShop.ownerUsername,
            name: matchingShop.name,
            role: "SHOP_OWNER",
            shopId: matchingShop.slug,
          };

          debugLog("DYNAMIC SHOP OWNER LOGIN SUCCESS ✅", {
            userId: dynamicUser.id,
            role: dynamicUser.role,
            shopId: dynamicUser.shopId,
            shopName: matchingShop.name,
          });

          setUser(dynamicUser);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(dynamicUser));
          updateActivity();
          setSessionExpired(false);
          return true;
        }
      }
    } catch (error) {
      debugError("Error checking managed shops", error);
    }

    debugWarn("LOGIN FAILED", {
      reason: !userRecord ? "Usuario no encontrado en DB ni en tiendas gestionadas" : "Contraseña incorrecta",
      attemptedUsername: username.toLowerCase()
    });
    return false;
  };

  // Staff login (for employees of a specific shop)
  const staffLogin = async (
    shopId: string,
    username: string,
    password: string
  ): Promise<boolean> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const shopStaff = STAFF_USERS_DB[shopId];
    if (!shopStaff) return false;

    const userRecord = shopStaff[username.toLowerCase()];
    if (userRecord && userRecord.password === password) {
      setUser(userRecord.user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userRecord.user));
      updateActivity();
      setSessionExpired(false);
      return true;
    }
    return false;
  };

  const logout = () => {
    clearSession();
    setSessionExpired(false);
  };

  const clearSessionExpired = () => {
    setSessionExpired(false);
  };

  // Update shop session config
  const updateShopSessionConfig = (
    shopId: string,
    config: Partial<ShopSessionConfig>
  ) => {
    setShopSessions((prev) => {
      const updated = {
        ...prev,
        [shopId]: {
          ...getShopSessionConfig(shopId),
          ...config,
        },
      };
      localStorage.setItem(SHOP_SESSIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const isAuthenticated = !!user;
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isShopOwner = user?.role === "SHOP_OWNER";
  const isStaff = user?.role === "SHOP_STAFF";

  // Only SUPER_ADMIN can configure WhatsApp
  const canConfigureWhatsApp = isSuperAdmin;

  // Log permission state whenever user changes
  useEffect(() => {
    if (user) {
      debugLog("PERMISSIONS STATE", {
        user: user.name,
        role: user.role,
        isAuthenticated,
        isSuperAdmin,
        isShopOwner,
        isStaff,
        canConfigureWhatsApp,
        shopId: user.shopId || "N/A (Super Admin tiene acceso a todas)",
      });
    }
  }, [user, isAuthenticated, isSuperAdmin, isShopOwner, isStaff, canConfigureWhatsApp]);

  const canAccessShop = (shopId: string): boolean => {
    const hasAccess = !user ? false : user.role === "SUPER_ADMIN" ? true : user.shopId === shopId;
    debugLog("canAccessShop check", { shopId, hasAccess, userRole: user?.role });
    return hasAccess;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        staffLogin,
        logout,
        isAuthenticated,
        isSuperAdmin,
        isShopOwner,
        isStaff,
        canAccessShop,
        canConfigureWhatsApp,
        sessionExpired,
        clearSessionExpired,
        getShopSessionConfig,
        updateShopSessionConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
