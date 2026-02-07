import { Timestamp } from "firebase/firestore";
import type { ShopLimits } from "./plan.types";
import type { FeatureId } from "./feature.types";
import type { BusinessType, BusinessCategory } from "@/lib/types/business.types";
import type {
  ShopMedia,
  ShopLinks,
  ShopBranding,
  ShopFeatureToggles,
} from "@/lib/types/shop-customization.types";

// Re-export para compatibilidad
export type { BusinessType, BusinessCategory };

// Categorías de negocio soportadas (legacy - usar BusinessCategory)
export type ShopCategory = BusinessCategory;

// Estados de suscripción (simplificado - cobro manual)
export type SubscriptionStatus = "active" | "trial" | "past_due" | "canceled";

// Configuración de tema (legacy - ahora en ShopBranding.theme)
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
  // Enlaces adicionales
  website?: string;
  mapLink?: string;
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
  businessType: BusinessType;

  // Estado
  isActive: boolean;

  // Configuración visual (legacy)
  theme: ShopTheme;

  // Contacto
  contact: ShopContact;

  // Suscripción (cobro manual)
  subscription: ShopSubscription;

  // Features habilitados (el super admin activa/desactiva individualmente)
  enabledFeatures: string[];

  // Feature toggles (nuevo sistema)
  featureToggles?: ShopFeatureToggles;

  // Límites personalizados (opcional)
  limits?: ShopLimits;

  // Configuración de negocio
  wholesaleEnabled: boolean;

  // Personalización avanzada (nuevo)
  media?: ShopMedia;
  links?: ShopLinks;
  branding?: ShopBranding;

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
  businessType: BusinessType;
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
  businessType?: BusinessType;
  phone?: string;
  email?: string;
  address?: string;
  website?: string;
  mapLink?: string;
  wholesaleEnabled?: boolean;
  theme?: Partial<ShopTheme>;
  monthlyPrice?: number;
  // Nuevos campos de personalización
  media?: Partial<ShopMedia>;
  links?: Partial<ShopLinks>;
  branding?: Partial<ShopBranding>;
  featureToggles?: Partial<ShopFeatureToggles>;
}

// Respuesta de API
export interface ShopResponse {
  shop: Shop;
}

export interface ShopsListResponse {
  shops: Shop[];
  total: number;
}
