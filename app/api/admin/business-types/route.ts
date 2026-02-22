import { NextResponse } from "next/server";
import {
    BUSINESS_TYPE_CONFIG,
    BUSINESS_CATEGORY_LABELS,
    type BusinessType,
    type BusinessCategory,
} from "@/lib/types/business.types";

// Tipos legacy que no deberían usarse para nuevos negocios
const LEGACY_TYPES = ["beauty", "retail", "repair", "restaurant", "rentcar", "technology"];

/**
 * GET /api/admin/business-types
 * Returns all available business types with their features
 * Useful as a reference for what each type enables
 */
export async function GET() {
    // Agrupar por categoría
    const byCategory: Record<BusinessCategory, {
        id: BusinessType;
        label: string;
        icon: string;
        description: string;
        features: Record<string, boolean>;
        labels: Record<string, string>;
        isLegacy: boolean;
    }[]> = {} as any;

    for (const [key, config] of Object.entries(BUSINESS_TYPE_CONFIG)) {
        const category = config.category;
        if (!byCategory[category]) {
            byCategory[category] = [];
        }

        byCategory[category].push({
            id: key as BusinessType,
            label: config.label,
            icon: config.icon,
            description: config.description,
            features: config.features,
            labels: config.labels,
            isLegacy: LEGACY_TYPES.includes(key),
        });
    }

    // Lista plana para búsqueda rápida
    const allTypes = Object.entries(BUSINESS_TYPE_CONFIG).map(([key, config]) => ({
        id: key,
        label: config.label,
        icon: config.icon,
        category: config.category,
        categoryLabel: BUSINESS_CATEGORY_LABELS[config.category],
        isLegacy: LEGACY_TYPES.includes(key),
        features: config.features,
    }));

    // Resumen de features
    const featureSummary = {
        withTables: allTypes.filter(t => t.features.tables && !t.isLegacy).map(t => ({ id: t.id, label: t.label })),
        withBookings: allTypes.filter(t => t.features.bookings && !t.isLegacy).map(t => ({ id: t.id, label: t.label })),
        withServices: allTypes.filter(t => t.features.services && !t.isLegacy).map(t => ({ id: t.id, label: t.label })),
        withDelivery: allTypes.filter(t => t.features.delivery && !t.isLegacy).map(t => ({ id: t.id, label: t.label })),
        withRentals: allTypes.filter(t => t.features.rentals && !t.isLegacy).map(t => ({ id: t.id, label: t.label })),
        withRepairs: allTypes.filter(t => t.features.repairs && !t.isLegacy).map(t => ({ id: t.id, label: t.label })),
    };

    return NextResponse.json({
        // Grouped by category (for UI display)
        byCategory,
        categoryLabels: BUSINESS_CATEGORY_LABELS,

        // Flat list (for dropdowns/selects)
        allTypes: allTypes.filter(t => !t.isLegacy),
        legacyTypes: allTypes.filter(t => t.isLegacy),

        // Feature summary (quick lookup)
        featureSummary,

        // Quick reference table
        quickReference: {
            forRestaurants: ["restaurante", "cafeteria", "bar", "food_truck", "pasteleria"],
            forBeauty: ["salon_belleza", "barberia", "spa", "nail_salon", "estetica_facial"],
            forRetail: ["tienda_ropa", "zapateria", "perfumeria", "joyeria", "tienda_general", "farmacia", "papeleria", "floreria"],
            forTech: ["celulares", "computadoras", "electronica"],
            forAutomotive: ["taller_mecanico", "autolavado", "rent_a_car", "refaccionaria"],
            forHealth: ["clinica_dental", "consultorio_medico", "veterinaria", "optica", "laboratorio"],
            forFitness: ["gimnasio", "estudio_yoga", "meal_prep"],
        },

        // Usage hint
        usage: {
            endpoint: "PUT /api/admin/shops/[shopId]",
            body: { businessType: "<type_id>" },
            example: { businessType: "pasteleria" },
        },
    });
}
