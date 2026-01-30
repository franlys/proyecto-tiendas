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

const ACTIVITY_STORAGE_KEY = "nexo-last-activity";
const AUTH_STORAGE_KEY = "nexo-auth";
const SHOP_SESSIONS_KEY = "nexo-shop-sessions";

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
    // Load shop session configs
    const storedSessions = localStorage.getItem(SHOP_SESSIONS_KEY);
    if (storedSessions) {
      try {
        setShopSessions({ ...DEFAULT_SHOP_SESSIONS, ...JSON.parse(storedSessions) });
      } catch {
        // Use defaults
      }
    }

    // Load auth session
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        // First parse to get user info for timeout calculation
        const parsed = JSON.parse(stored);

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

          if (elapsed > timeout) {
            clearSession();
            setSessionExpired(true);
          } else {
            setUser(parsed);
            updateActivity();
          }
        } else {
          setUser(parsed);
          updateActivity();
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
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
    await new Promise((resolve) => setTimeout(resolve, 500));

    const userRecord = ADMIN_USERS_DB[username.toLowerCase()];
    if (userRecord && userRecord.password === password) {
      setUser(userRecord.user);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userRecord.user));
      updateActivity();
      setSessionExpired(false);
      return true;
    }
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

  const canAccessShop = (shopId: string): boolean => {
    if (!user) return false;
    if (user.role === "SUPER_ADMIN") return true;
    return user.shopId === shopId;
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
