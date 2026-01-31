import { Timestamp } from "firebase/firestore";
import type { ShopLimits } from "./plan.types";
import type { FeatureId } from "./feature.types";

// Categorías de negocio soportadas
export type ShopCategory = "beauty" | "retail" | "repair" | "restaurant" | "technology";

// Estados de suscripción (simplificado - cobro manual)
export type SubscriptionStatus = "active" | "trial" | "past_due" | "canceled";

// Configuración de tema
export interface ShopTheme {
  id: string;
  name: string;
  primaryColor: string;
  backgroundColor: string;
  backgroundImage?: string;
  fontFamily?: string;
}

// Información de contacto
export interface ShopContact {
  phone: string;
  email?: string;
  address?: string;
  whatsapp?: string;
}

// Información de suscripción (simplificada para cobro manual)
export interface ShopSubscription {
  status: SubscriptionStatus;
  nextPaymentDate: string;
  monthlyPrice: number;
  lastPaymentDate?: string;
  notes?: string;  // Notas de pago (ej: "Pagó por transferencia el 15/01")
}

// Shop en Firestore
export interface FirestoreShop {
  // Identificación
  name: string;
  slug: string;
  description?: string;

  // Categorización
  category: ShopCategory;
  businessType: "beauty" | "retail" | "repair";

  // Estado
  isActive: boolean;

  // Configuración visual
  theme: ShopTheme;

  // Contacto
  contact: ShopContact;

  // Suscripción (cobro manual)
  subscription: ShopSubscription;

  // Features habilitados (el super admin activa/desactiva individualmente)
  enabledFeatures: string[];

  // Límites personalizados (opcional)
  limits?: ShopLimits;

  // Configuración de negocio
  wholesaleEnabled: boolean;

  // Credenciales del owner (temporal - migrar a users collection)
  ownerUsername?: string;
  ownerPassword?: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Shop con ID (para uso en frontend)
export interface Shop extends Omit<FirestoreShop, "createdAt" | "updatedAt"> {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Input para crear shop
export interface CreateShopInput {
  name: string;
  slug: string;
  description?: string;
  category: ShopCategory;
  phone: string;
  wholesaleEnabled?: boolean;
  enabledFeatures?: FeatureId[];  // Features iniciales
  monthlyPrice?: number;
}

// Input para actualizar shop
export interface UpdateShopInput {
  name?: string;
  description?: string;
  category?: ShopCategory;
  phone?: string;
  email?: string;
  address?: string;
  wholesaleEnabled?: boolean;
  theme?: Partial<ShopTheme>;
  monthlyPrice?: number;
}

// Respuesta de API
export interface ShopResponse {
  shop: Shop;
}

export interface ShopsListResponse {
  shops: Shop[];
  total: number;
}
