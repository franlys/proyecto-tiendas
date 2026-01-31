// Theme Constants for Multi-Tenancy Support

export interface ShopTheme {
  id: string;
  name: string;
  primaryColor: string;
  accentColor: string;
  style: "premium-dark" | "elegant-light" | "modern-minimal";
}

// Business Types for Phase 13
export type BusinessType = "beauty" | "retail" | "repair";

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  beauty: "Belleza & Servicios",
  retail: "Tienda / Retail",
  repair: "Taller / Reparación",
};

export const BUSINESS_TYPE_CONFIG: Record<BusinessType, {
  label: string;
  icon: string;
  showBooking: boolean;
  showRepairTracking: boolean;
  ctaText: string;
  servicesLabel: string;
}> = {
  beauty: {
    label: "Belleza & Servicios",
    icon: "✨",
    showBooking: true,
    showRepairTracking: false,
    ctaText: "Agendar Cita",
    servicesLabel: "Servicios",
  },
  retail: {
    label: "Tienda / Retail",
    icon: "🛍️",
    showBooking: false,
    showRepairTracking: false,
    ctaText: "Comprar por WhatsApp",
    servicesLabel: "Catálogo",
  },
  repair: {
    label: "Taller / Reparación",
    icon: "🔧",
    showBooking: true,
    showRepairTracking: true,
    ctaText: "Solicitar Reparación",
    servicesLabel: "Servicios",
  },
};

export interface ShopSocialMedia {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  website?: string;
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
}

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
    id: "1",
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
  },
  "barberia-classic": {
    id: "2",
    name: "Barbería Classic",
    slug: "barberia-classic",
    description: "Barbería tradicional con estilo moderno",
    theme: {
      id: "classic-theme",
      name: "Classic Gold",
      primaryColor: "#D4AF37",
      accentColor: "#F43F5E",
      style: "premium-dark",
    },
    contact: {
      phone: "+34 600 789 012",
      email: "info@barberia-classic.com",
      address: "Plaza España 8, Madrid",
    },
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

export type ProductCategory = "cabello" | "skincare" | "unas" | "accesorios" | "barberia";

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
};
