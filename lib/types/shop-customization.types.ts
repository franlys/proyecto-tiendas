/**
 * Tipos de Personalización de Tienda
 *
 * Define la configuración visual y de contenido personalizable
 * para cada tienda, incluyendo URLs, archivos y branding.
 */

import type { BusinessType } from "./business.types";

// ============================================
// CONFIGURACIÓN DE ARCHIVOS/MEDIA
// ============================================

export interface MediaFile {
    url: string;
    filename: string;
    contentType: string;
    size: number;           // bytes
    uploadedAt: string;
    path: string;           // storage path
}

export interface ShopMedia {
    // Logos
    logo?: MediaFile;
    logoWhite?: MediaFile;      // Logo para fondos oscuros
    favicon?: MediaFile;

    // Banner/Hero
    heroBanner?: MediaFile;
    heroVideo?: MediaFile;

    // Galería general
    gallery?: MediaFile[];

    // Backgrounds
    backgroundPattern?: MediaFile;
    backgroundImage?: MediaFile;
}

// ============================================
// CONFIGURACIÓN DE ENLACES/URLs
// ============================================

export interface SocialLinks {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
    pinterest?: string;
    threads?: string;
}

export interface ContactLinks {
    website?: string;
    whatsappLink?: string;      // wa.me link
    telegramLink?: string;
    mapLink?: string;           // Google Maps link
    wazeLink?: string;
    uber?: string;              // Para restaurantes
    rappi?: string;
    didi?: string;
}

export interface PaymentLinks {
    paypalMe?: string;
    mercadoPago?: string;
    stripe?: string;
    transferInfo?: string;      // Datos de transferencia
}

export interface ShopLinks {
    social: SocialLinks;
    contact: ContactLinks;
    payment: PaymentLinks;
    custom: CustomLink[];       // Enlaces personalizados
}

export interface CustomLink {
    id: string;
    label: string;
    url: string;
    icon?: string;
    visible: boolean;
    order: number;
}

// ============================================
// CONFIGURACIÓN DE BRANDING/TEMA
// ============================================

export interface ShopTheme {
    // Colores principales
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;

    // Colores de texto
    textColor: string;
    textLightColor: string;

    // Colores de fondo
    backgroundColor: string;
    surfaceColor: string;

    // Modo oscuro
    darkMode: {
        enabled: boolean;
        primaryColor?: string;
        backgroundColor?: string;
        textColor?: string;
    };

    // Fuentes
    fontFamily: string;
    headingFontFamily?: string;

    // Bordes
    borderRadius: "none" | "small" | "medium" | "large" | "full";

    // Estilo de botones
    buttonStyle: "solid" | "outline" | "ghost";
}

export interface ShopBranding {
    // Información básica de marca
    tagline?: string;           // Eslogan
    shortDescription?: string;  // Descripción corta (para meta)
    fullDescription?: string;   // Descripción completa

    // Tema visual
    theme: ShopTheme;

    // Configuración de layout
    layout: ShopLayout;
}

export interface ShopLayout {
    // Tipo de navegación
    navStyle: "top" | "sidebar" | "bottom";
    navPosition: "fixed" | "sticky" | "static";

    // Hero section
    heroStyle: "full" | "half" | "minimal" | "none";
    heroOverlay: boolean;
    heroTextAlign: "left" | "center" | "right";

    // Grid de productos
    productGridColumns: 2 | 3 | 4;
    productCardStyle: "minimal" | "detailed" | "compact";

    // Footer
    showFooter: boolean;
    footerStyle: "simple" | "detailed";
}

// ============================================
// FEATURE TOGGLES (Admin)
// ============================================

export interface ShopFeatureToggles {
    // Características principales
    catalogEnabled: boolean;        // Mostrar catálogo de productos
    servicesEnabled: boolean;       // Mostrar servicios
    bookingsEnabled: boolean;       // Sistema de citas/reservaciones
    ordersEnabled: boolean;         // Sistema de pedidos

    // Características secundarias
    inventoryEnabled: boolean;      // Gestión de inventario
    wholesaleEnabled: boolean;      // Precios de mayoreo
    repairsEnabled: boolean;        // Sistema de reparaciones
    rentalsEnabled: boolean;        // Sistema de rentas
    tablesEnabled: boolean;         // Gestión de mesas (restaurantes)
    deliveryEnabled: boolean;       // Servicio de entrega

    // Características de comunicación
    whatsappEnabled: boolean;       // Integración WhatsApp
    chatEnabled: boolean;           // Chat en vivo
    notificationsEnabled: boolean;  // Notificaciones push

    // Características de marketing
    reviewsEnabled: boolean;        // Sistema de reseñas
    loyaltyEnabled: boolean;        // Programa de lealtad
    couponsEnabled: boolean;        // Cupones de descuento
    promotionsEnabled: boolean;     // Promociones

    // Características de pagos
    onlinePaymentEnabled: boolean;  // Pagos en línea
    codEnabled: boolean;            // Contra entrega
    installmentsEnabled: boolean;   // Pagos a plazos

    // Características adicionales
    multiLanguageEnabled: boolean;  // Múltiples idiomas
    analyticsEnabled: boolean;      // Dashboard de analytics
    reportsEnabled: boolean;        // Reportes avanzados

    // Staff / Empleados (para negocios de servicios)
    multiStaffEnabled: boolean;     // Múltiples empleados (estilistas, manicuristas, etc.)
}

// ============================================
// CONFIGURACIÓN COMPLETA DE TIENDA
// ============================================

export interface ShopCustomization {
    // Identificación
    shopId: string;
    businessType: BusinessType;

    // Media (archivos)
    media: ShopMedia;

    // Enlaces
    links: ShopLinks;

    // Branding
    branding: ShopBranding;

    // Features activos
    features: ShopFeatureToggles;

    // Metadata
    createdAt: string;
    updatedAt: string;
}

// ============================================
// DEFAULTS
// ============================================

export const DEFAULT_THEME: ShopTheme = {
    primaryColor: "#2563eb",
    secondaryColor: "#1e40af",
    accentColor: "#f59e0b",
    textColor: "#1f2937",
    textLightColor: "#6b7280",
    backgroundColor: "#ffffff",
    surfaceColor: "#f3f4f6",
    darkMode: {
        enabled: false,
    },
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "medium",
    buttonStyle: "solid",
};

export const DEFAULT_LAYOUT: ShopLayout = {
    navStyle: "top",
    navPosition: "sticky",
    heroStyle: "half",
    heroOverlay: true,
    heroTextAlign: "center",
    productGridColumns: 3,
    productCardStyle: "detailed",
    showFooter: true,
    footerStyle: "simple",
};

export const DEFAULT_BRANDING: ShopBranding = {
    theme: DEFAULT_THEME,
    layout: DEFAULT_LAYOUT,
};

export const DEFAULT_LINKS: ShopLinks = {
    social: {},
    contact: {},
    payment: {},
    custom: [],
};

export const DEFAULT_MEDIA: ShopMedia = {};

export const DEFAULT_FEATURE_TOGGLES: ShopFeatureToggles = {
    // Principales - dependen del tipo de negocio
    catalogEnabled: true,
    servicesEnabled: false,
    bookingsEnabled: false,
    ordersEnabled: true,

    // Secundarios
    inventoryEnabled: true,
    wholesaleEnabled: false,
    repairsEnabled: false,
    rentalsEnabled: false,
    tablesEnabled: false,
    deliveryEnabled: true,

    // Comunicación
    whatsappEnabled: true,
    chatEnabled: false,
    notificationsEnabled: true,

    // Marketing
    reviewsEnabled: true,
    loyaltyEnabled: false,
    couponsEnabled: true,
    promotionsEnabled: true,

    // Pagos
    onlinePaymentEnabled: false,
    codEnabled: true,
    installmentsEnabled: false,

    // Adicionales
    multiLanguageEnabled: false,
    analyticsEnabled: true,
    reportsEnabled: false,

    // Staff
    multiStaffEnabled: false,       // Por defecto, negocio simple (solo dueño)
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

import { getBusinessTypeConfig } from "./business.types";

/**
 * Genera los feature toggles por defecto basados en el tipo de negocio
 */
export function getDefaultFeatureToggles(businessType: BusinessType): ShopFeatureToggles {
    const config = getBusinessTypeConfig(businessType);

    return {
        ...DEFAULT_FEATURE_TOGGLES,
        catalogEnabled: config.features.catalog,
        servicesEnabled: config.features.services,
        bookingsEnabled: config.features.bookings,
        ordersEnabled: config.features.orders,
        inventoryEnabled: config.features.inventory,
        wholesaleEnabled: config.features.wholesale,
        repairsEnabled: config.features.repairs,
        rentalsEnabled: config.features.rentals,
        tablesEnabled: config.features.tables,
        deliveryEnabled: config.features.delivery,
    };
}

/**
 * Crea una configuración de personalización por defecto
 */
export function createDefaultCustomization(
    shopId: string,
    businessType: BusinessType
): ShopCustomization {
    const now = new Date().toISOString();

    return {
        shopId,
        businessType,
        media: DEFAULT_MEDIA,
        links: DEFAULT_LINKS,
        branding: DEFAULT_BRANDING,
        features: getDefaultFeatureToggles(businessType),
        createdAt: now,
        updatedAt: now,
    };
}

/**
 * Valida una URL
 */
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Normaliza una URL de red social
 */
export function normalizeSocialUrl(platform: keyof SocialLinks, value: string): string {
    // Si ya es una URL completa, devolverla
    if (value.startsWith("http://") || value.startsWith("https://")) {
        return value;
    }

    // Remover @ si existe
    const handle = value.replace(/^@/, "");

    const baseUrls: Record<keyof SocialLinks, string> = {
        facebook: "https://facebook.com/",
        instagram: "https://instagram.com/",
        tiktok: "https://tiktok.com/@",
        twitter: "https://twitter.com/",
        youtube: "https://youtube.com/@",
        linkedin: "https://linkedin.com/in/",
        pinterest: "https://pinterest.com/",
        threads: "https://threads.net/@",
    };

    return baseUrls[platform] + handle;
}
