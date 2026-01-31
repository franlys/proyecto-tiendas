// IDs de features del sistema
export type FeatureId =
  // Inventario
  | "inventory"
  | "variants"
  | "lowStockAlerts"
  // Ventas
  | "orders"
  | "kanban"
  | "whatsappIntegration"
  // Clientes
  | "crm"
  | "clientHistory"
  | "loyalty"
  // Marketing
  | "campaigns"
  | "promoGenerator"
  | "emailMarketing"
  // Staff
  | "staffManagement"
  | "staffCommissions"
  // Avanzado
  | "analytics"
  | "multiLocation"
  | "api";

// Categorías de features
export type FeatureCategory =
  | "inventory"
  | "sales"
  | "clients"
  | "marketing"
  | "staff"
  | "advanced";

// Definición de un feature
export interface FeatureDefinition {
  id: FeatureId;
  name: string;
  description: string;
  category: FeatureCategory;
  icon?: string;
}

// Todas las features del sistema
export const SYSTEM_FEATURES: Record<FeatureId, FeatureDefinition> = {
  // Inventario
  inventory: {
    id: "inventory",
    name: "Gestión de Inventario",
    description: "Control de stock, productos y servicios",
    category: "inventory",
    icon: "Package",
  },
  variants: {
    id: "variants",
    name: "Variantes de Productos",
    description: "Múltiples tallas, colores y opciones",
    category: "inventory",
    icon: "Layers",
  },
  lowStockAlerts: {
    id: "lowStockAlerts",
    name: "Alertas de Stock Bajo",
    description: "Notificaciones cuando el inventario está bajo",
    category: "inventory",
    icon: "AlertTriangle",
  },

  // Ventas
  orders: {
    id: "orders",
    name: "Gestión de Pedidos",
    description: "Procesar y dar seguimiento a pedidos",
    category: "sales",
    icon: "ShoppingCart",
  },
  kanban: {
    id: "kanban",
    name: "Tablero Kanban",
    description: "Visualización drag-and-drop de pedidos",
    category: "sales",
    icon: "Trello",
  },
  whatsappIntegration: {
    id: "whatsappIntegration",
    name: "Integración WhatsApp",
    description: "Pedidos y notificaciones por WhatsApp",
    category: "sales",
    icon: "MessageCircle",
  },

  // Clientes
  crm: {
    id: "crm",
    name: "CRM de Clientes",
    description: "Gestión de base de datos de clientes",
    category: "clients",
    icon: "Users",
  },
  clientHistory: {
    id: "clientHistory",
    name: "Historial de Clientes",
    description: "Registro completo de interacciones",
    category: "clients",
    icon: "Clock",
  },
  loyalty: {
    id: "loyalty",
    name: "Programa de Lealtad",
    description: "Puntos, descuentos y recompensas",
    category: "clients",
    icon: "Award",
  },

  // Marketing
  campaigns: {
    id: "campaigns",
    name: "Campañas de Marketing",
    description: "Crear y gestionar campañas",
    category: "marketing",
    icon: "Megaphone",
  },
  promoGenerator: {
    id: "promoGenerator",
    name: "Generador de Promociones",
    description: "Crear imágenes para redes sociales",
    category: "marketing",
    icon: "Image",
  },
  emailMarketing: {
    id: "emailMarketing",
    name: "Email Marketing",
    description: "Envío masivo de correos",
    category: "marketing",
    icon: "Mail",
  },

  // Staff
  staffManagement: {
    id: "staffManagement",
    name: "Gestión de Empleados",
    description: "Administrar personal y permisos",
    category: "staff",
    icon: "UserCog",
  },
  staffCommissions: {
    id: "staffCommissions",
    name: "Comisiones de Empleados",
    description: "Cálculo automático de comisiones",
    category: "staff",
    icon: "DollarSign",
  },

  // Avanzado
  analytics: {
    id: "analytics",
    name: "Analíticas Avanzadas",
    description: "Reportes detallados y métricas",
    category: "advanced",
    icon: "BarChart",
  },
  multiLocation: {
    id: "multiLocation",
    name: "Múltiples Ubicaciones",
    description: "Gestionar varias sucursales",
    category: "advanced",
    icon: "MapPin",
  },
  api: {
    id: "api",
    name: "Acceso a API",
    description: "Integración con sistemas externos",
    category: "advanced",
    icon: "Code",
  },
};

// Obtener features por categoría
export function getFeaturesByCategory(category: FeatureCategory): FeatureDefinition[] {
  return Object.values(SYSTEM_FEATURES).filter((f) => f.category === category);
}

// Verificar si una shop tiene acceso a un feature (simplificado)
export function hasFeatureAccess(
  featureId: FeatureId,
  enabledFeatures: FeatureId[]
): boolean {
  return enabledFeatures.includes(featureId);
}
