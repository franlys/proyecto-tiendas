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
  | "dispatch"
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
  // Restaurante
  | "tables"
  | "waiterPanel"
  | "kitchenDisplay"
  // Rent-a-Car
  | "vehicles"
  | "rentals"
  | "rentalCalendar"
  // Servicios
  | "bookings"
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
  | "restaurant"
  | "rentcar"
  | "services"
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

  // Ventas - Despacho
  dispatch: {
    id: "dispatch",
    name: "Despacho de Pedidos",
    description: "Panel de despacho conectado al inventario",
    category: "sales",
    icon: "Truck",
  },

  // Restaurante
  tables: {
    id: "tables",
    name: "Gestión de Mesas",
    description: "Control de mesas y QR codes",
    category: "restaurant",
    icon: "LayoutGrid",
  },
  waiterPanel: {
    id: "waiterPanel",
    name: "Panel de Meseros",
    description: "Toma de pedidos y servicio en mesa",
    category: "restaurant",
    icon: "ClipboardList",
  },
  kitchenDisplay: {
    id: "kitchenDisplay",
    name: "Display de Cocina",
    description: "Pantalla para órdenes en cocina",
    category: "restaurant",
    icon: "MonitorPlay",
  },

  // Rent-a-Car
  vehicles: {
    id: "vehicles",
    name: "Gestión de Vehículos",
    description: "Flota de vehículos para renta",
    category: "rentcar",
    icon: "Car",
  },
  rentals: {
    id: "rentals",
    name: "Gestión de Rentas",
    description: "Reservaciones y entregas de vehículos",
    category: "rentcar",
    icon: "Key",
  },
  rentalCalendar: {
    id: "rentalCalendar",
    name: "Calendario de Disponibilidad",
    description: "Vista de disponibilidad por vehículo",
    category: "rentcar",
    icon: "CalendarDays",
  },

  // Servicios
  bookings: {
    id: "bookings",
    name: "Reservaciones",
    description: "Sistema de citas y reservaciones",
    category: "services",
    icon: "Calendar",
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
