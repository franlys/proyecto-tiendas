import { Timestamp } from "firebase/firestore";

// IDs de planes
export type PlanId = "basic" | "pro" | "enterprise";

// Límites del plan
export interface PlanLimits {
  maxProducts: number;       // -1 = ilimitado
  maxStaff: number;          // -1 = ilimitado
  maxOrders: number;         // -1 = ilimitado (por mes)
  maxStorage: number;        // MB de almacenamiento
  maxCampaigns: number;      // -1 = ilimitado (por mes)
}

// Plan en Firestore
export interface FirestorePlan {
  // Identificación
  name: string;
  description: string;

  // Precio
  monthlyPrice: number;
  annualPrice?: number;    // Precio anual con descuento

  // Features incluidas
  features: string[];

  // Límites
  limits: PlanLimits;

  // Estado
  isActive: boolean;
  isPopular?: boolean;     // Para destacar en pricing

  // Orden de visualización
  order: number;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Plan con ID (para uso en frontend)
export interface Plan extends Omit<FirestorePlan, "createdAt" | "updatedAt"> {
  id: PlanId;
  createdAt: string;
  updatedAt: string;
}

// Planes predefinidos
export const DEFAULT_PLANS: Record<PlanId, Omit<Plan, "createdAt" | "updatedAt">> = {
  basic: {
    id: "basic",
    name: "Básico",
    description: "Perfecto para empezar tu negocio digital",
    monthlyPrice: 299,
    annualPrice: 2990,
    features: [
      "inventory",
      "orders",
      "crm",
      "clientHistory",
    ],
    limits: {
      maxProducts: 50,
      maxStaff: 2,
      maxOrders: 100,
      maxStorage: 500,
      maxCampaigns: 2,
    },
    isActive: true,
    order: 1,
  },
  pro: {
    id: "pro",
    name: "Profesional",
    description: "Para negocios en crecimiento",
    monthlyPrice: 499,
    annualPrice: 4990,
    features: [
      "inventory",
      "variants",
      "lowStockAlerts",
      "orders",
      "kanban",
      "whatsappIntegration",
      "crm",
      "clientHistory",
      "campaigns",
      "staffManagement",
    ],
    limits: {
      maxProducts: 200,
      maxStaff: 5,
      maxOrders: 500,
      maxStorage: 2000,
      maxCampaigns: 10,
    },
    isActive: true,
    isPopular: true,
    order: 2,
  },
  enterprise: {
    id: "enterprise",
    name: "Empresarial",
    description: "Solución completa para grandes operaciones",
    monthlyPrice: 999,
    annualPrice: 9990,
    features: [
      "inventory",
      "variants",
      "lowStockAlerts",
      "orders",
      "kanban",
      "whatsappIntegration",
      "crm",
      "clientHistory",
      "loyalty",
      "campaigns",
      "promoGenerator",
      "emailMarketing",
      "staffManagement",
      "staffCommissions",
      "analytics",
      "multiLocation",
      "api",
    ],
    limits: {
      maxProducts: -1,
      maxStaff: -1,
      maxOrders: -1,
      maxStorage: 10000,
      maxCampaigns: -1,
    },
    isActive: true,
    order: 3,
  },
};

// Respuesta de API
export interface PlanResponse {
  plan: Plan;
}

export interface PlansListResponse {
  plans: Plan[];
}
