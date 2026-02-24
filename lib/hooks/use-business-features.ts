/**
 * Hook para obtener las características y configuración de un tipo de negocio
 *
 * Este hook centraliza la lógica para determinar qué módulos mostrar
 * en el panel de administración según el tipo de negocio.
 */

import { useMemo } from "react";
import {
    BusinessType,
    BusinessTypeConfig,
    BUSINESS_TYPE_CONFIG,
    getBusinessTypeConfig,
} from "@/lib/types/business.types";

// Tipos de negocio relacionados con belleza
const BEAUTY_BUSINESS_TYPES = [
    "salon",
    "spa",
    "barberia",
    "estetica",
    "unas",
    "maquillaje",
];

/**
 * Verifica si un tipo de negocio es de belleza/estética
 */
function isBeautyBusiness(businessType: BusinessType | undefined | null): boolean {
    if (!businessType) return false;
    const type = businessType.toLowerCase();
    return BEAUTY_BUSINESS_TYPES.some(beautyType => type.includes(beautyType));
}

export interface BusinessFeatures {
    // Características del negocio
    hasCatalog: boolean;        // Muestra catálogo de productos
    hasServices: boolean;       // Ofrece servicios
    hasBookings: boolean;       // Sistema de citas/reservaciones
    hasOrders: boolean;         // Procesa pedidos
    hasInventory: boolean;      // Maneja inventario
    hasWholesale: boolean;      // Precios mayoreo
    hasRepairs: boolean;        // Ofrece reparaciones
    hasRentals: boolean;        // Ofrece rentas
    hasTables: boolean;         // Maneja mesas (restaurantes)
    hasDelivery: boolean;       // Ofrece delivery

    // Labels personalizados
    labels: {
        cta: string;            // "Reservar Cita", "Ver Menú", etc.
        products: string;       // "Productos", "Platillos", "Vehículos", etc.
        services: string;       // "Servicios", "Tratamientos", "Reparaciones", etc.
        booking: string;        // "Cita", "Reservación", "Turno", etc.
        order: string;          // "Pedido", "Orden", "Renta", etc.
    };

    // Configuración completa
    config: BusinessTypeConfig;

    // Módulos del admin que deben mostrarse
    adminModules: {
        orders: boolean;        // Módulo de pedidos
        bookings: boolean;      // Módulo de citas/calendario
        inventory: boolean;     // Módulo de inventario
        services: boolean;      // Módulo de servicios
        repairs: boolean;       // Módulo de reparaciones
        rentals: boolean;       // Módulo de rentas
        tables: boolean;        // Módulo de mesas
        wholesale: boolean;     // Configuración de mayoreo
        delivery: boolean;      // Configuración de delivery
        beautyConsultations: boolean; // Pre-consultas de belleza
        trainingPackages: boolean;    // Módulo de paquetes de entrenamiento
    };

    // Widgets del dashboard
    dashboardWidgets: {
        pendingOrders: boolean;     // Widget de pedidos pendientes
        upcomingBookings: boolean;  // Widget de próximas citas
        inventoryAlerts: boolean;   // Alertas de inventario bajo
        repairStatus: boolean;      // Estado de reparaciones
        tableStatus: boolean;       // Estado de mesas
        rentalCalendar: boolean;    // Calendario de rentas
    };
}

/**
 * Hook para obtener las características de un tipo de negocio
 */
export function useBusinessFeatures(businessType: BusinessType | undefined | null): BusinessFeatures {
    return useMemo(() => {
        // Default a "otro" si no hay tipo definido
        const type = businessType || "otro";
        const config = getBusinessTypeConfig(type);
        const features = config.features;

        return {
            // Características básicas
            hasCatalog: features.catalog,
            hasServices: features.services,
            hasBookings: features.bookings,
            hasOrders: features.orders,
            hasInventory: features.inventory,
            hasWholesale: features.wholesale,
            hasRepairs: features.repairs,
            hasRentals: features.rentals,
            hasTables: features.tables,
            hasDelivery: features.delivery,

            // Labels personalizados
            labels: config.labels,

            // Configuración completa
            config,

            // Módulos del admin
            adminModules: {
                orders: features.orders,
                bookings: features.bookings,
                inventory: features.inventory || features.catalog,
                services: features.services,
                repairs: features.repairs,
                rentals: features.rentals,
                tables: features.tables,
                wholesale: features.wholesale,
                delivery: features.delivery,
                beautyConsultations: isBeautyBusiness(type),
                trainingPackages: type === "meal_prep" || type === "gimnasio" || type === "entrenador_personal",
            },

            // Widgets del dashboard
            dashboardWidgets: {
                pendingOrders: features.orders,
                upcomingBookings: features.bookings,
                inventoryAlerts: features.inventory,
                repairStatus: features.repairs,
                tableStatus: features.tables,
                rentalCalendar: features.rentals,
            },
        };
    }, [businessType]);
}

/**
 * Obtiene las características de un tipo de negocio (versión sin hook)
 */
export function getBusinessFeatures(businessType: BusinessType | undefined | null): BusinessFeatures {
    const type = businessType || "otro";
    const config = getBusinessTypeConfig(type);
    const features = config.features;

    return {
        hasCatalog: features.catalog,
        hasServices: features.services,
        hasBookings: features.bookings,
        hasOrders: features.orders,
        hasInventory: features.inventory,
        hasWholesale: features.wholesale,
        hasRepairs: features.repairs,
        hasRentals: features.rentals,
        hasTables: features.tables,
        hasDelivery: features.delivery,
        labels: config.labels,
        config,
        adminModules: {
            orders: features.orders,
            bookings: features.bookings,
            inventory: features.inventory || features.catalog,
            services: features.services,
            repairs: features.repairs,
            rentals: features.rentals,
            tables: features.tables,
            wholesale: features.wholesale,
            delivery: features.delivery,
            beautyConsultations: isBeautyBusiness(businessType),
            trainingPackages: type === "meal_prep" || type === "gimnasio" || type === "entrenador_personal",
        },
        dashboardWidgets: {
            pendingOrders: features.orders,
            upcomingBookings: features.bookings,
            inventoryAlerts: features.inventory,
            repairStatus: features.repairs,
            tableStatus: features.tables,
            rentalCalendar: features.rentals,
        },
    };
}

/**
 * Determina si un negocio es principalmente de servicios
 */
export function isServiceBusiness(businessType: BusinessType | undefined | null): boolean {
    const features = getBusinessFeatures(businessType);
    return features.hasServices && features.hasBookings && !features.hasOrders;
}

/**
 * Determina si un negocio es principalmente de productos
 */
export function isProductBusiness(businessType: BusinessType | undefined | null): boolean {
    const features = getBusinessFeatures(businessType);
    return features.hasCatalog && features.hasOrders && !features.hasBookings;
}

/**
 * Determina si un negocio es híbrido (productos + servicios)
 */
export function isHybridBusiness(businessType: BusinessType | undefined | null): boolean {
    const features = getBusinessFeatures(businessType);
    return (features.hasCatalog || features.hasInventory) && features.hasServices;
}

// ============================================
// MULTI-TYPE SUPPORT (Para negocios con múltiples tipos)
// ============================================

import { getBusinessType, type BusinessTypeConfig as BusinessTypeConfigV2 } from "@/lib/types/business-types-v2";

export interface CombinedBusinessFeatures extends BusinessFeatures {
    // Array de todos los tipos de negocio
    businessTypes: string[];
    // Configuraciones de cada tipo
    typeConfigs: { id: string; label: string; icon: string; features: BusinessFeatures }[];
    // Indica si es un negocio multi-tipo
    isMultiType: boolean;
}

/**
 * Combina los features de múltiples tipos de negocio
 * Útil para negocios como "Meal Prep + Entrenamiento" que necesitan
 * mostrar funcionalidades de ambos tipos.
 */
export function getCombinedFeatures(businessTypes: string[]): CombinedBusinessFeatures {
    // Si no hay tipos o solo hay uno, usar la función normal
    if (!businessTypes || businessTypes.length === 0) {
        const defaultFeatures = getBusinessFeatures("otro");
        return {
            ...defaultFeatures,
            businessTypes: ["otro"],
            typeConfigs: [{
                id: "otro",
                label: "Otro",
                icon: "🏬",
                features: defaultFeatures,
            }],
            isMultiType: false,
        };
    }

    // Obtener features de cada tipo
    const typeConfigs = businessTypes.map(typeId => {
        const typeInfo = getBusinessType(typeId);
        const features = getBusinessFeatures(typeId as BusinessType);
        return {
            id: typeId,
            label: typeInfo?.label || typeId,
            icon: typeInfo?.icon || "🏬",
            features,
        };
    });

    // Combinar todos los features con OR (si cualquier tipo lo tiene, se habilita)
    const combined: BusinessFeatures = {
        hasCatalog: typeConfigs.some(t => t.features.hasCatalog),
        hasServices: typeConfigs.some(t => t.features.hasServices),
        hasBookings: typeConfigs.some(t => t.features.hasBookings),
        hasOrders: typeConfigs.some(t => t.features.hasOrders),
        hasInventory: typeConfigs.some(t => t.features.hasInventory),
        hasWholesale: typeConfigs.some(t => t.features.hasWholesale),
        hasRepairs: typeConfigs.some(t => t.features.hasRepairs),
        hasRentals: typeConfigs.some(t => t.features.hasRentals),
        hasTables: typeConfigs.some(t => t.features.hasTables),
        hasDelivery: typeConfigs.some(t => t.features.hasDelivery),

        // Labels del tipo principal (primero de la lista)
        labels: typeConfigs[0].features.labels,

        // Config del tipo principal
        config: typeConfigs[0].features.config,

        // Admin modules combinados
        adminModules: {
            orders: typeConfigs.some(t => t.features.adminModules.orders),
            bookings: typeConfigs.some(t => t.features.adminModules.bookings),
            inventory: typeConfigs.some(t => t.features.adminModules.inventory),
            services: typeConfigs.some(t => t.features.adminModules.services),
            repairs: typeConfigs.some(t => t.features.adminModules.repairs),
            rentals: typeConfigs.some(t => t.features.adminModules.rentals),
            tables: typeConfigs.some(t => t.features.adminModules.tables),
            wholesale: typeConfigs.some(t => t.features.adminModules.wholesale),
            delivery: typeConfigs.some(t => t.features.adminModules.delivery),
            beautyConsultations: typeConfigs.some(t => t.features.adminModules.beautyConsultations),
            trainingPackages: typeConfigs.some(t =>
                t.id === "meal_prep" || t.id === "gimnasio" || t.id === "entrenador_personal"
            ),
        },

        // Dashboard widgets combinados
        dashboardWidgets: {
            pendingOrders: typeConfigs.some(t => t.features.dashboardWidgets.pendingOrders),
            upcomingBookings: typeConfigs.some(t => t.features.dashboardWidgets.upcomingBookings),
            inventoryAlerts: typeConfigs.some(t => t.features.dashboardWidgets.inventoryAlerts),
            repairStatus: typeConfigs.some(t => t.features.dashboardWidgets.repairStatus),
            tableStatus: typeConfigs.some(t => t.features.dashboardWidgets.tableStatus),
            rentalCalendar: typeConfigs.some(t => t.features.dashboardWidgets.rentalCalendar),
        },
    };

    return {
        ...combined,
        businessTypes,
        typeConfigs,
        isMultiType: businessTypes.length > 1,
    };
}

/**
 * Hook para obtener features combinados de múltiples tipos de negocio
 */
export function useCombinedBusinessFeatures(businessTypes: string[] | undefined): CombinedBusinessFeatures {
    return useMemo(() => {
        return getCombinedFeatures(businessTypes || []);
    }, [businessTypes?.join(",")]);
}
