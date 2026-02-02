// Theme Constants for Multi-Tenancy Support

export interface ShopTheme {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  style: "premium-dark" | "elegant-light" | "modern-minimal";
}

// Business Types for Phase 13+
export type BusinessType = "beauty" | "retail" | "repair" | "restaurant" | "rentcar";

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  beauty: "Belleza & Servicios",
  retail: "Tienda / Retail",
  repair: "Taller / Reparación",
  restaurant: "Restaurante / Bar",
  rentcar: "Rent-a-Car",
};

export const BUSINESS_TYPE_CONFIG: Record<BusinessType, {
  label: string;
  icon: string;
  showBooking: boolean;
  showRepairTracking: boolean;
  showRentals: boolean;
  showTables: boolean;
  showWaiterPanel: boolean;
  ctaText: string;
  servicesLabel: string;
}> = {
  beauty: {
    label: "Belleza & Servicios",
    icon: "✨",
    showBooking: true,
    showRepairTracking: false,
    showRentals: false,
    showTables: false,
    showWaiterPanel: false,
    ctaText: "Agendar Cita",
    servicesLabel: "Servicios",
  },
  retail: {
    label: "Tienda / Retail",
    icon: "🛍️",
    showBooking: false,
    showRepairTracking: false,
    showRentals: false,
    showTables: false,
    showWaiterPanel: false,
    ctaText: "Comprar por WhatsApp",
    servicesLabel: "Catálogo",
  },
  repair: {
    label: "Servicio Técnico & Ventas", // Changed from "Taller / Reparación"
    icon: "🔧",
    showBooking: true,
    showRepairTracking: true,
    showRentals: false,
    showTables: false,
    showWaiterPanel: false,
    ctaText: "Agendar Servicio", // More generic than "Solicitar Reparación"
    servicesLabel: "Catálogo & Servicios", // Implies both products and services
  },
  restaurant: {
    label: "Restaurante / Bar",
    icon: "🍽️",
    showBooking: false,
    showRepairTracking: false,
    showRentals: false,
    showTables: true,
    showWaiterPanel: true,
    ctaText: "Ver Menú",
    servicesLabel: "Menú",
  },
  rentcar: {
    label: "Rent-a-Car / Alquiler",
    icon: "🚗",
    showBooking: false,
    showRepairTracking: false,
    showRentals: true,
    showTables: false,
    showWaiterPanel: false,
    ctaText: "Reservar Vehículo",
    servicesLabel: "Flota de Vehículos",
  },
};

export interface ShopSocialMedia {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  website?: string;
}

export type BackgroundType = "solid" | "image" | "video";

export interface ShopBackground {
  type: BackgroundType;
  color?: string;
  image?: string;
  video?: string;
  // Section-specific backgrounds
  hero?: string;
  services?: string;
  products?: string;
  contact?: string;
}

export interface ShopSchedule {
  monday?: { open: string; close: string; closed?: boolean };
  tuesday?: { open: string; close: string; closed?: boolean };
  wednesday?: { open: string; close: string; closed?: boolean };
  thursday?: { open: string; close: string; closed?: boolean };
  friday?: { open: string; close: string; closed?: boolean };
  saturday?: { open: string; close: string; closed?: boolean };
  sunday?: { open: string; close: string; closed?: boolean };
}

export interface ShopConfig {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  banner?: string; // Cover/header image
  slogan?: string; // Short tagline
  theme: ShopTheme;
  background?: ShopBackground; // Background configuration
  contact: {
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
  };
  social?: ShopSocialMedia;
  schedule?: ShopSchedule;
  // Phase 13: Business Type & Wholesale
  businessType?: BusinessType;
  wholesaleCode?: string;
  wholesaleEnabled?: boolean;
  // Auth (for Mock/Seeding purposes)
  ownerUsername?: string;
  ownerPassword?: string;
}

// ============================================
// SHARED TYPES & FEATURES
// ============================================

export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trial";

export type ShopCategory = BusinessType; // Alias for backward compatibility

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
  "variants",
  "orders",
  "kanban",
  "whatsappIntegration",
  "staffManagement"
];

// Default Theme - Premium Dark
export const DEFAULT_THEME: ShopTheme = {
  id: "premium-dark",
  name: "Premium Dark",
  primaryColor: "#F43F5E", // Rose 500
  accentColor: "#D4AF37", // Gold
  style: "premium-dark",
};

// Example Shop Configurations (Hardcoded for Phase 1)
export const MOCK_SHOPS: Record<string, ShopConfig> = {
  "estetica-lola": {
    id: "demo-0",
    name: "Estética Lola",
    slug: "estetica-lola",
    description: "Centro de belleza y estética profesional",
    theme: {
      id: "lola-theme",
      name: "Elegance Rose",
      primaryColor: "#F43F5E",
      accentColor: "#D4AF37",
      style: "premium-dark",
    },
    contact: {
      phone: "+34 600 123 456",
      email: "info@estetica-lola.com",
      address: "Calle Mayor 15, Madrid",
    },
    businessType: "beauty",
  },
  "ejemplo-estetica": {
    id: "demo-1",
    name: "Glow Beauty Studio",
    slug: "ejemplo-estetica",
    description: "Tu espacio de belleza y relajación. Expertos en color y cuidado personal.",
    theme: {
      id: "theme-estetica",
      name: "Beauty Pink",
      primaryColor: "#ec4899", // Pink 500
      accentColor: "#fbcfe8", // Pink 100
      style: "premium-dark",
    },
    contact: {
      phone: "", // To be configured by user
      email: "contacto@glowstudio.com",
      address: "Av. Reforma 222, CDMX",
    },
    businessType: "beauty",
  },
  "ejemplo-rentcar": {
    id: "demo-2",
    name: "Speedy Rent a Car",
    slug: "ejemplo-rentcar",
    description: "Renta de autos premium y utilitarios para tu viaje.",
    theme: {
      id: "theme-rentcar",
      name: "Speedy Blue",
      primaryColor: "#3b82f6", // Blue 500
      accentColor: "#60a5fa", // Blue 400
      style: "modern-minimal",
    },
    contact: {
      phone: "",
      email: "reservas@speedyrent.com",
      address: "Aeropuerto Terminal 1, CDMX",
    },
    businessType: "rentcar",
    ownerUsername: "rentcar",
    ownerPassword: "123",
  },
  "ejemplo-mayoreo": {
    id: "demo-3",
    name: "Mega Importaciones",
    slug: "ejemplo-mayoreo",
    description: "Venta al mayoreo de electrónica y accesorios. Precios especiales a distribuidores.",
    theme: {
      id: "theme-mayoreo",
      name: "Wholesale Orange",
      primaryColor: "#f97316", // Orange 500
      accentColor: "#fdba74", // Orange 300
      style: "elegant-light",
    },
    contact: {
      phone: "",
      email: "ventas@megaimport.com",
      address: "Centro Mayorista Bodega 4",
    },
    businessType: "retail",
    wholesaleEnabled: true,
  },
  "ejemplo-dental": {
    id: "demo-4",
    name: "Clínica Dental Sonrisas",
    slug: "ejemplo-dental",
    description: "Especialistas en ortodoncia y estética dental.",
    theme: {
      id: "theme-dental",
      name: "Medical Teal",
      primaryColor: "#14b8a6", // Teal 500
      accentColor: "#5eead4", // Teal 300
      style: "elegant-light",
    },
    contact: {
      phone: "",
      email: "citas@sonrisasdental.com",
      address: "Torre Médica Piso 4",
    },
    businessType: "beauty", // Uses booking system
    ownerUsername: "dental",
    ownerPassword: "123",
  },
  "ejemplo-restaurante": {
    id: "demo-5",
    name: "La Parrilla Urbana",
    slug: "ejemplo-restaurante",
    description: "Cortes finos, hamburguesas gourmet y mixología.",
    theme: {
      id: "theme-restaurante",
      name: "Grill Red",
      primaryColor: "#dc2626", // Red 600
      accentColor: "#fca5a5", // Red 300
      style: "premium-dark",
    },
    contact: {
      phone: "",
      email: "reservas@parrillaurbana.com",
      address: "Zona Gastronómica Local 12",
    },
    businessType: "restaurant",
    ownerUsername: "restaurante",
    ownerPassword: "123",
  },
  "ejemplo-perfumeria": {
    id: "demo-6",
    name: "Essence Perfumería",
    slug: "ejemplo-perfumeria",
    description: "Fragancias exclusivas, perfumes de autor y esencias importadas.",
    theme: {
      id: "theme-perfumeria",
      name: "Elegant Violet",
      primaryColor: "#8b5cf6", // Violet 500
      accentColor: "#ddd6fe", // Violet 100
      style: "elegant-light",
    },
    contact: {
      phone: "",
      email: "contacto@essence.com",
      address: "Plaza Luxury Local 5",
    },
    businessType: "retail",
    wholesaleEnabled: true,
  },
  "gonzalezsmartphone": {
    id: "legacy-1",
    name: "Gonzalez Smartphone",
    slug: "gonzalezsmartphone",
    description: "Venta y reparación de telefonía móvil. Servicio técnico especializado.",
    theme: {
      id: "theme-gonzalez",
      name: "Tech Blue",
      primaryColor: "#0ea5e9", // Sky 500
      accentColor: "#38bdf8", // Sky 400
      style: "modern-minimal",
    },
    contact: {
      phone: "",
      email: "contacto@gonzalezsmartphone.com",
      address: "Local Comercial",
    },
    businessType: "repair", // Explicitly set type
    wholesaleEnabled: true,
    ownerUsername: "gonzalez",
    ownerPassword: "123",
  },
};

// Navigation Items
export const NAV_ITEMS = [
  { label: "Inicio", href: "/" },
  { label: "Servicios", href: "#servicios" },
  { label: "Portfolio", href: "#portfolio" },
  { label: "Contacto", href: "#contacto" },
] as const;

// Service Categories
export type ServiceCategory = "cabello" | "unas" | "spa" | "barberia" | "facial";

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number; // minutes
  category: ServiceCategory;
  image: string;
}

// Mock Services for Estética Lola
export const MOCK_SERVICES: Record<string, Service[]> = {
  "estetica-lola": [
    // Cabello
    {
      id: "s1",
      name: "Corte Bob Moderno",
      description: "Corte estilizado con acabado profesional",
      price: 400,
      duration: 45,
      category: "cabello",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&h=400&fit=crop",
    },
    {
      id: "s2",
      name: "Balayage Premium",
      description: "Técnica de mechas naturales y degradadas",
      price: 1200,
      duration: 120,
      category: "cabello",
      image: "https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=400&h=400&fit=crop",
    },
    {
      id: "s3",
      name: "Tratamiento Keratina",
      description: "Alisado y nutrición profunda",
      price: 800,
      duration: 90,
      category: "cabello",
      image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&h=400&fit=crop",
    },
    // Uñas
    {
      id: "s4",
      name: "Uñas Gel Esculpidas",
      description: "Diseño personalizado con gel premium",
      price: 450,
      duration: 60,
      category: "unas",
      image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop",
    },
    {
      id: "s5",
      name: "Manicure Spa",
      description: "Tratamiento completo con masaje",
      price: 250,
      duration: 45,
      category: "unas",
      image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&h=400&fit=crop",
    },
    // Spa
    {
      id: "s6",
      name: "Masaje Relajante",
      description: "60 minutos de relajación total",
      price: 600,
      duration: 60,
      category: "spa",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=400&fit=crop",
    },
    // Facial
    {
      id: "s7",
      name: "Limpieza Facial Profunda",
      description: "Hidratación y limpieza de poros",
      price: 350,
      duration: 50,
      category: "facial",
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop",
    },
  ],
  "barberia-classic": [
    // Barbería
    {
      id: "b1",
      name: "Corte Clásico",
      description: "Corte tradicional con tijera y máquina",
      price: 200,
      duration: 30,
      category: "barberia",
      image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=400&fit=crop",
    },
    {
      id: "b2",
      name: "Corte + Barba",
      description: "Servicio completo de corte y perfilado",
      price: 350,
      duration: 45,
      category: "barberia",
      image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop",
    },
    {
      id: "b3",
      name: "Afeitado Tradicional",
      description: "Navaja, toalla caliente y bálsamo",
      price: 180,
      duration: 30,
      category: "barberia",
      image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=400&fit=crop",
    },
    {
      id: "b4",
      name: "Tratamiento Capilar",
      description: "Hidratación y fortalecimiento",
      price: 280,
      duration: 40,
      category: "cabello",
      image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=400&fit=crop",
    },
    {
      id: "b5",
      name: "Diseño de Barba",
      description: "Perfilado y diseño personalizado",
      price: 150,
      duration: 25,
      category: "barberia",
      image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=400&fit=crop",
    },
  ],
};

// Category Labels
export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  cabello: "Cabello",
  unas: "Uñas",
  spa: "Spa & Masajes",
  barberia: "Barbería",
  facial: "Facial",
};

// ============================================
// PRODUCTS (Phase 7 - Inventory & eCommerce)
// ============================================

export type ProductCategory =
  | "comida"
  | "bebidas"
  | "cabello"
  | "unas"
  | "barberia"
  | "accesorios"
  | "spa"
  | "facial"
  | "autos"
  | "electronica"
  | "perfumes"
  | "sets"
  | "skincare" // Re-added
  | "otros";



export interface ProductVariant {
  id: string;
  name: string; // "Original", "OLED", "Genérica AAA"
  description?: string; // Phase 7 Refinement: Mini-description
  price: number;
  wholesalePrice?: number; // Precio B2B
  stock?: number; // Optional per variant stock
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Base price (or min price)
  promoPrice?: number;
  wholesalePrice?: number; // Base wholesale price
  stock: number; // Total stock
  lowStockThreshold: number;
  category: ProductCategory;
  image: string;
  featured?: boolean;
  // New: Variants support
  variants?: ProductVariant[];
}

// Product Category Labels
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  cabello: "Cabello",
  skincare: "Skincare",
  unas: "Uñas",
  accesorios: "Accesorios",
  barberia: "Barbería",
  comida: "Comida",
  bebidas: "Bebidas",
  spa: "Spa",
  facial: "Facial",
  autos: "Autos",
  electronica: "Electrónica",
  perfumes: "Perfumes",
  sets: "Sets",
  otros: "Otros",
};

// Mock Products
export const MOCK_PRODUCTS: Record<string, Product[]> = {
  "estetica-lola": [
    // Cabello
    {
      id: "p1",
      name: "Shampoo Hidratante Premium",
      description: "Hidratación profunda para cabello seco y dañado. 300ml.",
      price: 280,
      stock: 15,
      lowStockThreshold: 5,
      category: "cabello",
      image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop",
      featured: true,
    },
    {
      id: "p2",
      name: "Mascarilla Keratina",
      description: "Tratamiento intensivo de keratina. 250ml.",
      price: 450,
      promoPrice: 380,
      stock: 8,
      lowStockThreshold: 3,
      category: "cabello",
      image: "https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=400&fit=crop",
      featured: true,
    },
    {
      id: "p3",
      name: "Aceite de Argán",
      description: "Aceite nutritivo para puntas. 100ml.",
      price: 320,
      stock: 12,
      lowStockThreshold: 4,
      category: "cabello",
      image: "https://images.unsplash.com/photo-1599305090598-fe179d501227?w=400&h=400&fit=crop",
    },
    {
      id: "p4",
      name: "Serum Anti-Frizz",
      description: "Control del frizz por 48 horas. 50ml.",
      price: 220,
      stock: 20,
      lowStockThreshold: 5,
      category: "cabello",
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
    },
    // Skincare
    {
      id: "p5",
      name: "Crema Facial Vitamina C",
      description: "Iluminadora y antioxidante. 50ml.",
      price: 580,
      stock: 6,
      lowStockThreshold: 3,
      category: "skincare",
      image: "https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=400&h=400&fit=crop",
      featured: true,
    },
    {
      id: "p6",
      name: "Serum Ácido Hialurónico",
      description: "Hidratación profunda. 30ml.",
      price: 420,
      stock: 10,
      lowStockThreshold: 3,
      category: "skincare",
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop",
    },
    {
      id: "p7",
      name: "Contorno de Ojos",
      description: "Reduce ojeras y líneas de expresión. 15ml.",
      price: 380,
      promoPrice: 299,
      stock: 4,
      lowStockThreshold: 2,
      category: "skincare",
      image: "https://images.unsplash.com/photo-1617897903246-719242758050?w=400&h=400&fit=crop",
    },
    // Uñas
    {
      id: "p8",
      name: "Kit Esmaltes Gel",
      description: "Set de 6 colores tendencia. Incluye base y top coat.",
      price: 650,
      stock: 7,
      lowStockThreshold: 2,
      category: "unas",
      image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=400&fit=crop",
    },
    {
      id: "p9",
      name: "Aceite Cutículas",
      description: "Nutre y fortalece las cutículas. 10ml.",
      price: 120,
      stock: 25,
      lowStockThreshold: 8,
      category: "unas",
      image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?w=400&h=400&fit=crop",
    },
    // Accesorios
    {
      id: "p10",
      name: "Cepillo Térmico Premium",
      description: "Cepillo cerámico para secado profesional.",
      price: 480,
      stock: 3,
      lowStockThreshold: 2,
      category: "accesorios",
      image: "https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=400&h=400&fit=crop",
    },
    // New: Product with Variants (iPhone Screen)
    {
      id: "p11-variant",
      name: "Pantalla iPhone X (Repuesto)",
      description: "Display completo para reemplazo. Elige la calidad que prefieras.",
      price: 1200, // Base/Original price
      wholesalePrice: 1000,
      stock: 10, // Total stock (sum of variants or just generic)
      lowStockThreshold: 2,
      category: "accesorios",
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=400&h=400&fit=crop",
      variants: [
        {
          id: "v1",
          name: "Original (OLED)",
          description: "La mejor calidad. Colores vibrantes y garantía de 1 año.",
          price: 1200,
          wholesalePrice: 1000,
          stock: 3,
        },
        {
          id: "v2",
          name: "Calidad Premium (Soft OLED)",
          description: "Excelente relación calidad-precio. Tonos negros profundos.",
          price: 900,
          wholesalePrice: 750,
          stock: 5,
        },
        {
          id: "v3",
          name: "Económica (Incell)",
          description: "Funcional y económica. Garantía de 30 días.",
          price: 500,
          wholesalePrice: 400,
          stock: 2,
        },
      ],
    },
  ],
  "barberia-classic": [
    // Barbería
    {
      id: "bp1",
      name: "Cera Mate Fijación Fuerte",
      description: "Acabado mate y fijación todo el día. 100g.",
      price: 180,
      stock: 20,
      lowStockThreshold: 5,
      category: "barberia",
      image: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop",
      featured: true,
    },
    {
      id: "bp2",
      name: "Pomada Clásica",
      description: "Brillo y fijación media. 100g.",
      price: 160,
      stock: 15,
      lowStockThreshold: 5,
      category: "barberia",
      image: "https://images.unsplash.com/photo-1621607512022-6aecc4fed814?w=400&h=400&fit=crop",
      featured: true,
    },
    {
      id: "bp3",
      name: "Aceite de Barba Premium",
      description: "Hidrata y da brillo. Aroma madera. 30ml.",
      price: 250,
      promoPrice: 199,
      stock: 12,
      lowStockThreshold: 4,
      category: "barberia",
      image: "https://images.unsplash.com/photo-1621607512022-6aecc4fed814?w=400&h=400&fit=crop",
    },
    {
      id: "bp4",
      name: "Bálsamo Aftershave",
      description: "Calma e hidrata después del afeitado. 100ml.",
      price: 220,
      stock: 18,
      lowStockThreshold: 6,
      category: "barberia",
      image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&h=400&fit=crop",
    },
    {
      id: "bp5",
      name: "Shampoo para Barba",
      description: "Limpieza suave para barba. 200ml.",
      price: 190,
      stock: 10,
      lowStockThreshold: 3,
      category: "barberia",
      image: "https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?w=400&h=400&fit=crop",
    },
    // Cabello
    {
      id: "bp6",
      name: "Shampoo Anticaspa",
      description: "Control de caspa y frescura. 300ml.",
      price: 240,
      stock: 8,
      lowStockThreshold: 3,
      category: "cabello",
      image: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=400&fit=crop",
    },
    {
      id: "bp7",
      name: "Gel Fijador Extra Fuerte",
      description: "Máxima fijación sin residuos. 250ml.",
      price: 150,
      stock: 22,
      lowStockThreshold: 7,
      category: "barberia",
      image: "https://images.unsplash.com/photo-1597854710266-9b0c96bab731?w=400&h=400&fit=crop",
    },
    // Accesorios
    {
      id: "bp8",
      name: "Peine de Madera Premium",
      description: "Peine antiestático de madera de sándalo.",
      price: 120,
      stock: 15,
      lowStockThreshold: 5,
      category: "accesorios",
      image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=400&fit=crop",
    },
    {
      id: "bp9",
      name: "Navaja de Afeitar",
      description: "Navaja clásica con mango de madera.",
      price: 450,
      stock: 5,
      lowStockThreshold: 2,
      category: "accesorios",
      image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=400&fit=crop",
    },
  ],
  "ejemplo-perfumeria": [
    {
      id: "pf1",
      name: "Eau de Parfum 'Midnight'",
      description: "Fragancia nocturna con notas de vainilla y orquídea. 100ml.",
      price: 1800,
      stock: 12,
      lowStockThreshold: 3,
      category: "perfumes",
      image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop",
    },
    {
      id: "pf2",
      name: "Cítricos de Sicilia",
      description: "Esencia fresca de limón y bergamota. Unisex. 100ml.",
      price: 1500,
      stock: 20,
      lowStockThreshold: 5,
      category: "perfumes",
      image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&h=400&fit=crop",
    },
    {
      id: "pf3",
      name: "Ocean Breeze Man",
      description: "Aroma acuático y maderas. 100ml.",
      price: 1350,
      stock: 15,
      lowStockThreshold: 4,
      category: "perfumes",
      image: "https://images.unsplash.com/photo-1523293188086-b46e0a804130?w=400&h=400&fit=crop",
    },
    {
      id: "pf4",
      name: "Rose Garden Set",
      description: "Set de regalo con perfume de rosas y crema corporal.",
      price: 2200,
      stock: 8,
      lowStockThreshold: 2,
      category: "sets",
      image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=400&h=400&fit=crop",
    },
  ],
  "gonzalezsmartphone": [
    {
      id: "gs1",
      name: "Cambio de Pantalla iPhone",
      description: "Servicio de reparación con pantalla calidad original.",
      price: 1200,
      stock: 10,
      lowStockThreshold: 2,
      category: "accesorios",
      image: "https://images.unsplash.com/photo-1599580492317-062e70b7986c?w=400&h=400&fit=crop",
    },
    {
      id: "gs2",
      name: "Mica de Hidrogel",
      description: "Protección premium para cualquier modelo.",
      price: 150,
      stock: 50,
      lowStockThreshold: 10,
      category: "accesorios",
      image: "https://images.unsplash.com/photo-1603351154351-5cf99bc32f2d?w=400&h=400&fit=crop",
    },
  ],
};
