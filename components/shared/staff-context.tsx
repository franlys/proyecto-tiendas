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
// ROLE-BASED ACCESS CONTROL (RBAC)
// ============================================

export type StaffRole = "owner" | "manager" | "sales" | "warehouse";

export const STAFF_ROLES: Record<StaffRole, {
  label: string;
  color: string;
  icon: string;
  description: string;
}> = {
  owner: {
    label: "Dueño",
    color: "gold",
    icon: "👑",
    description: "Acceso total al sistema",
  },
  manager: {
    label: "Gerente",
    color: "purple",
    icon: "🟣",
    description: "Gestión de inventario, marketing y pedidos",
  },
  sales: {
    label: "Vendedor",
    color: "blue",
    icon: "🔵",
    description: "Atención a clientes y ventas",
  },
  warehouse: {
    label: "Almacén",
    color: "orange",
    icon: "🟠",
    description: "Despacho y control de inventario",
  },
};

// Permission definitions
export type Permission =
  | "billing.read"
  | "billing.write"
  | "settings.read"
  | "settings.write"
  | "staff.read"
  | "staff.write"
  | "inventory.read"
  | "inventory.write"
  | "orders.read"
  | "orders.write"
  | "orders.status"
  | "crm.read"
  | "crm.write"
  | "marketing.read"
  | "marketing.write"
  | "automation.read"
  | "automation.write"
  | "repair.read"
  | "repair.write"
  | "promos.read"
  | "promos.write"
  | "agency.read"
  | "agency.write";

// Role -> Permissions mapping
export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  owner: [
    "billing.read", "billing.write",
    "settings.read", "settings.write",
    "staff.read", "staff.write",
    "inventory.read", "inventory.write",
    "orders.read", "orders.write", "orders.status",
    "crm.read", "crm.write",
    "marketing.read", "marketing.write",
    "automation.read", "automation.write",
    "repair.read", "repair.write",
    "promos.read", "promos.write",
    "agency.read", "agency.write",
  ],
  manager: [
    "staff.read",
    "inventory.read", "inventory.write",
    "orders.read", "orders.write", "orders.status",
    "crm.read", "crm.write",
    "marketing.read", "marketing.write",
    "automation.read",
    "repair.read", "repair.write",
    "promos.read", "promos.write",
  ],
  sales: [
    "orders.read", "orders.write",
    "crm.read",
    "inventory.read",
    "repair.read",
  ],
  warehouse: [
    "orders.read", "orders.status",
    "inventory.read", "inventory.write",
    "repair.read", "repair.write",
  ],
};

// Route -> Required permission mapping
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/admin/billing": "billing.read",
  "/admin/settings": "settings.read",
  "/admin/staff": "staff.read",
  "/admin/inventory": "inventory.read",
  "/admin/orders": "orders.read",
  "/admin/clients": "crm.read",
  "/admin/marketing": "marketing.read",
  "/admin/automation": "automation.read",
  "/admin/repair": "repair.read",
  "/admin/promos": "promos.read",
  "/agency": "agency.read",
};

// ============================================
// STAFF MEMBER INTERFACE
// ============================================

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: StaffRole;
  assignedAgentId?: string; // Link to WhatsApp agent (Phase 14)
  isActive: boolean;
  avatar?: string;
  // Performance metrics
  commissionRate?: number; // Percentage (e.g. 10 for 10%)
  totalSales: number;
  totalOrders: number;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CONTEXT
// ============================================

interface StaffContextType {
  staff: StaffMember[];
  currentUser: StaffMember | null;
  getStaffMember: (id: string) => StaffMember | undefined;
  addStaffMember: (member: Omit<StaffMember, "id" | "createdAt" | "updatedAt" | "totalSales" | "totalOrders">) => StaffMember;
  updateStaffMember: (id: string, updates: Partial<StaffMember>) => void;
  deleteStaffMember: (id: string) => void;
  toggleStaffStatus: (id: string) => void;
  // RBAC helpers
  hasPermission: (permission: Permission) => boolean;
  canAccessRoute: (route: string) => boolean;
  getPermissionsForRole: (role: StaffRole) => Permission[];
  // Performance
  recordSale: (staffId: string, amount: number) => void;
  getTopPerformers: (limit?: number) => StaffMember[];
  isLoading: boolean;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

interface StaffProviderProps {
  children: ReactNode;
  shopId: string;
  currentUserId?: string;
}

const getStorageKey = (shopId: string) => `staff-${shopId}`;

// Demo staff members
const DEMO_STAFF: StaffMember[] = [
  {
    id: "staff-owner",
    name: "Ana García",
    email: "ana@mitienda.com",
    phone: "555-100-0001",
    role: "owner",
    isActive: true,
    avatar: "https://ui-avatars.com/api/?name=Ana+Garcia&background=D4AF37&color=fff",
    totalSales: 125000,
    totalOrders: 234,
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "staff-manager",
    name: "Carlos López",
    email: "carlos@mitienda.com",
    phone: "555-100-0002",
    role: "manager",
    isActive: true,
    avatar: "https://ui-avatars.com/api/?name=Carlos+Lopez&background=8B5CF6&color=fff",
    totalSales: 67500,
    totalOrders: 156,
    lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "staff-sales1",
    name: "María Rodríguez",
    email: "maria@mitienda.com",
    phone: "555-100-0003",
    role: "sales",
    assignedAgentId: "agent-ventas-1",
    isActive: true,
    avatar: "https://ui-avatars.com/api/?name=Maria+Rodriguez&background=3B82F6&color=fff",
    commissionRate: 10,
    totalSales: 45200,
    totalOrders: 89,
    lastActiveAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "staff-sales2",
    name: "Juan Martínez",
    email: "juan@mitienda.com",
    phone: "555-100-0004",
    role: "sales",
    assignedAgentId: "agent-ventas-2",
    isActive: true,
    avatar: "https://ui-avatars.com/api/?name=Juan+Martinez&background=3B82F6&color=fff",
    commissionRate: 8,
    totalSales: 38900,
    totalOrders: 72,
    lastActiveAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "staff-warehouse",
    name: "Pedro Sánchez",
    email: "pedro@mitienda.com",
    phone: "555-100-0005",
    role: "warehouse",
    isActive: true,
    avatar: "https://ui-avatars.com/api/?name=Pedro+Sanchez&background=F97316&color=fff",
    totalSales: 0,
    totalOrders: 145, // Orders dispatched
    lastActiveAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "staff-inactive",
    name: "Laura Díaz",
    email: "laura@mitienda.com",
    role: "sales",
    isActive: false,
    avatar: "https://ui-avatars.com/api/?name=Laura+Diaz&background=64748B&color=fff",
    totalSales: 12300,
    totalOrders: 28,
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function StaffProvider({ children, shopId, currentUserId }: StaffProviderProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default to owner for demo
  const currentUser = staff.find((s) => s.id === currentUserId) || staff.find((s) => s.role === "owner") || null;

  // Load staff from localStorage
  useEffect(() => {
    const storageKey = getStorageKey(shopId);
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setStaff(JSON.parse(stored));
      } else {
        setStaff(DEMO_STAFF);
        localStorage.setItem(storageKey, JSON.stringify(DEMO_STAFF));
      }
    } catch (error) {
      console.error("Error loading staff:", error);
      setStaff(DEMO_STAFF);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  // Save to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(getStorageKey(shopId), JSON.stringify(staff));
    }
  }, [staff, isLoading, shopId]);

  const getStaffMember = useCallback(
    (id: string) => staff.find((s) => s.id === id),
    [staff]
  );

  const addStaffMember = useCallback(
    (memberData: Omit<StaffMember, "id" | "createdAt" | "updatedAt" | "totalSales" | "totalOrders">): StaffMember => {
      const now = new Date().toISOString();
      const newMember: StaffMember = {
        ...memberData,
        id: `staff-${Date.now()}`,
        totalSales: 0,
        totalOrders: 0,
        createdAt: now,
        updatedAt: now,
      };
      setStaff((prev) => [...prev, newMember]);
      return newMember;
    },
    []
  );

  const updateStaffMember = useCallback((id: string, updates: Partial<StaffMember>) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
      )
    );
  }, []);

  const deleteStaffMember = useCallback((id: string) => {
    // Don't allow deleting the last owner
    const owners = staff.filter((s) => s.role === "owner");
    const memberToDelete = staff.find((s) => s.id === id);
    if (memberToDelete?.role === "owner" && owners.length <= 1) {
      console.error("Cannot delete the last owner");
      return;
    }
    setStaff((prev) => prev.filter((s) => s.id !== id));
  }, [staff]);

  const toggleStaffStatus = useCallback((id: string) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, isActive: !s.isActive, updatedAt: new Date().toISOString() } : s
      )
    );
  }, []);

  // RBAC: Check if current user has a specific permission
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!currentUser) return false;
      const permissions = ROLE_PERMISSIONS[currentUser.role];
      return permissions.includes(permission);
    },
    [currentUser]
  );

  // RBAC: Check if current user can access a route
  const canAccessRoute = useCallback(
    (route: string): boolean => {
      if (!currentUser) return false;
      const requiredPermission = ROUTE_PERMISSIONS[route];
      if (!requiredPermission) return true; // No permission required
      return hasPermission(requiredPermission);
    },
    [currentUser, hasPermission]
  );

  // Get permissions for a specific role
  const getPermissionsForRole = useCallback(
    (role: StaffRole): Permission[] => ROLE_PERMISSIONS[role],
    []
  );

  // Record a sale for performance tracking
  const recordSale = useCallback((staffId: string, amount: number) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? {
            ...s,
            totalSales: s.totalSales + amount,
            totalOrders: s.totalOrders + 1,
            lastActiveAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          : s
      )
    );
  }, []);

  // Get top performers sorted by sales
  const getTopPerformers = useCallback(
    (limit: number = 5): StaffMember[] => {
      return [...staff]
        .filter((s) => s.isActive && s.role !== "warehouse")
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, limit);
    },
    [staff]
  );

  return (
    <StaffContext.Provider
      value={{
        staff,
        currentUser,
        getStaffMember,
        addStaffMember,
        updateStaffMember,
        deleteStaffMember,
        toggleStaffStatus,
        hasPermission,
        canAccessRoute,
        getPermissionsForRole,
        recordSale,
        getTopPerformers,
        isLoading,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
}

export function useStaff() {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error("useStaff must be used within a StaffProvider");
  }
  return context;
}

// ============================================
// HELPER COMPONENTS
// ============================================

// Role Badge Component
export function RoleBadge({ role }: { role: StaffRole }) {
  const config = STAFF_ROLES[role];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color === "gold"
        ? "bg-gold/20 text-gold"
        : config.color === "purple"
          ? "bg-purple-500/20 text-purple-400"
          : config.color === "blue"
            ? "bg-blue-500/20 text-blue-400"
            : "bg-orange-500/20 text-orange-400"
        }`}
    >
      {config.icon} {config.label}
    </span>
  );
}
