/**
 * Tipos para Meal Prep / Preparación de Comidas
 *
 * Este archivo define los tipos para negocios de meal prep
 * que ofrecen paquetes de comidas personalizables.
 */

// ============================================
// CONFIGURACIÓN DE PLATOS
// ============================================

import { SelectedExtra } from "./product-extra.types";

/**
 * Componentes de un plato personalizado (mapea id_categoria -> nombre_producto)
 */
export interface MealPlateComponents {
    [categoryId: string]: string;
}

/**
 * Extras por componente (mapea id_categoria -> lista de extras seleccionados)
 */
export interface MealPlateComponentExtras {
    [categoryId: string]: SelectedExtra[];
}

/**
 * Un plato individual dentro de un paquete
 */
export interface MealPlate {
    id: string;
    components: MealPlateComponents;
    componentExtras?: MealPlateComponentExtras;
    componentSurcharges?: Record<string, number>; // Maps category ID -> surcharge amount
    notes?: string;               // Notas por plato individual
    isPremiumProtein?: boolean;   // Si usa proteína premium
    premiumSurcharge?: number;    // Cargo extra
    isCustom?: boolean;           // Si el plato es personalizado (entrada libre), sube a $15
    extraCategories?: Record<string, boolean>; // Categorías desbloqueadas como extras (pago adicional)
}

// Precios base
export const MEAL_PREP_PRICES = {
    STANDARD_PLATE: 13,
    CUSTOM_PLATE: 15,
};

// ============================================
// PROTEÍNAS PREMIUM
// ============================================

/**
 * Definición de proteínas premium con su cargo adicional
 */
export interface PremiumProtein {
    id: string;
    name: string;
    surcharge: number;  // Cargo adicional por plato (ej: $1 para pollo premium, $7 para salmón)
}

/**
 * Proteínas premium predefinidas
 */
export const PREMIUM_PROTEINS: PremiumProtein[] = [
    { id: "res_premium", name: "Res Premium", surcharge: 1 },
    { id: "shrimp", name: "Camarones", surcharge: 5 },
    { id: "salmon", name: "Salmón", surcharge: 7 },
    { id: "churrasco", name: "Churrasco", surcharge: 6 },
    { id: "filete_mignon", name: "Filete Mignon", surcharge: 7 },
    { id: "steak", name: "Steak / Filete", surcharge: 5 },
];

// ============================================
// PAQUETES DE COMIDA
// ============================================

/**
 * Tipo de paquete de meal prep
 */
export type MealPrepPackageType = "3_plates" | "4_plates" | "5_plates" | "6_plates";

/**
 * Configuración de un tipo de paquete
 */
export interface MealPrepPackageConfig {
    type: MealPrepPackageType;
    plateCount: number;
    label: string;
    pricePerPlate: number;  // Precio base por plato ($13)
}

/**
 * Configuraciones de paquetes disponibles
 */
export const MEAL_PREP_PACKAGES: MealPrepPackageConfig[] = [
    { type: "3_plates", plateCount: 3, label: "Paquete de 3 platos", pricePerPlate: 13 },
    { type: "4_plates", plateCount: 4, label: "Paquete de 4 platos", pricePerPlate: 13 },
    { type: "5_plates", plateCount: 5, label: "Paquete de 5 platos", pricePerPlate: 13 },
    { type: "6_plates", plateCount: 6, label: "Paquete de 6 platos", pricePerPlate: 13 },
];

/**
 * Un pedido de meal prep completo
 */
export interface MealPrepOrder {
    id: string;
    packageType: MealPrepPackageType;
    plates: MealPlate[];
    basePrice: number;          // platos * precio_base
    premiumTotal: number;       // Sum of all premium surcharges
    deliveryDistance?: number;  // Distancia en millas
    deliverySurcharge: number;  // $30 si >10 millas
    trainingPlan?: TrainingPlanConfig; // Plan de entrenamiento opcional
    totalPrice: number;         // basePrice + premiumTotal + deliverySurcharge + trainingPlan.price
    customerNotes?: string;
    createdAt: string;
}

// ============================================
// SERVICIOS DE ENTRENAMIENTO
// ============================================

/**
 * Tipo de plan de entrenamiento personal
 */
export type TrainingPlanType = "2_days" | "3_days";

/**
 * Configuración de planes de entrenamiento
 */
export interface TrainingPlanConfig {
    type: TrainingPlanType;
    daysPerWeek: number;
    monthlyPrice: number;
    label: string;
}

/**
 * Planes de entrenamiento disponibles
 */
export const TRAINING_PLANS: TrainingPlanConfig[] = [
    { type: "2_days", daysPerWeek: 2, monthlyPrice: 100, label: "2 días por semana" },
    { type: "3_days", daysPerWeek: 3, monthlyPrice: 130, label: "3 días por semana" },
];

// ============================================
// CARGOS DE ENTREGA
// ============================================

/**
 * Configuración de cargos por distancia
 */
export interface DeliveryConfig {
    freeDistanceMiles: number;   // Hasta 10 millas gratis
    surchargeAmount: number;     // $30 por más de 10 millas
}

export const DEFAULT_DELIVERY_CONFIG: DeliveryConfig = {
    freeDistanceMiles: 10,
    surchargeAmount: 30, // Se cobra si es mayor a 10 millas, pero el usuario dijo que el flujo es fundamental
};

// ============================================
// HORARIO DE OPERACIÓN
// ============================================

/**
 * Horario de operación del negocio meal prep
 * Lunes-Sábado (excepto Miércoles): 6am-6pm
 */
export interface MealPrepSchedule {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };  // CERRADO
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };     // CERRADO
}

export const DEFAULT_MEAL_PREP_SCHEDULE: MealPrepSchedule = {
    monday: { open: "06:00", close: "18:00", closed: false },
    tuesday: { open: "06:00", close: "18:00", closed: false },
    wednesday: { open: "06:00", close: "18:00", closed: true },  // Cerrado los miércoles
    thursday: { open: "06:00", close: "18:00", closed: false },
    friday: { open: "06:00", close: "18:00", closed: false },
    saturday: { open: "06:00", close: "18:00", closed: false },
    sunday: { open: "06:00", close: "18:00", closed: true },     // Cerrado los domingos
};

// ============================================
// PRODUCTO MEAL PREP EXTENDIDO
// ============================================

/**
 * Extiende el producto base con configuración de meal prep
 */
export interface MealPrepProduct {
    id: string;
    name: string;
    description: string;
    image?: string;
    category: "meal_prep_package";

    // Configuración de paquete
    packageType: MealPrepPackageType;
    plateCount: number;
    pricePerPlate: number;

    // Opciones predeterminadas de ejemplo
    sampleProteinas?: string[];
    sampleCarbohidratos?: string[];
    sampleVegetales?: string[];

    // Permite proteínas premium
    allowPremiumProteins?: boolean;

    // Paquete pre-armado (no personalizable)
    isCustomizable?: boolean;

    // Categorías de componentes permitidas (ej: ["proteinas", "carbs"])
    // Si no se especifica, usa todas las del catálogo excepto meal_prep_package
    allowedComponentCategories?: string[];

    // Precios calculados
    basePrice: number;  // plateCount * pricePerPlate
    featured?: boolean;
}

// ============================================
// CONFIGURACIÓN DE TIENDA (PAQUETES, REGLAS Y CATEGORÍAS DINÁMICAS)
// ============================================

export interface MealPrepPackage {
    id: string;
    name: string;
    mealsPerWeek: number;
    daysPerWeek: number;
    price: number;
    isActive: boolean;
}

export interface MealPrepDynamicCategory {
    id: string;
    name: string;
    isPremium: boolean;
    isRequired: boolean;
    selectionLimit?: number; // Cuántos items se pueden elegir de esta categoría
    extraPrice?: number; // Precio por agregar esta categoría como extra o desbloquearla
    order?: number; // Orden de visualización
}

export interface MealPrepExtraItem {
    id: string;
    name: string;
    price: number;
    categoryId: string; // Referencia a MealPrepDynamicCategory
    isActive: boolean;
}

export interface MealPrepRule {
    id: string;
    type: "exclude" | "require" | "surcharge";
    sourceCategoryId: string;
    targetCategoryId: string;
    surchargeAmount?: number;
}

export interface MealPrepShopConfig {
    packages?: MealPrepPackage[];
    categories?: MealPrepDynamicCategory[];
    extras?: MealPrepExtraItem[];
    rules?: MealPrepRule[];
    customInstructionsEnabled?: boolean;
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Calcula el precio total de un pedido de meal prep
 */
export function calculateMealPrepTotal(
    plates: MealPlate[],
    trainingPlan?: TrainingPlanConfig,
    distanceMiles?: number,
    mealPrepConfig?: MealPrepShopConfig
): {
    basePrice: number;
    premiumTotal: number;
    deliverySurcharge: number;
    trainingTotal: number;
    extrasTotal: number;
    total: number
} {
    // Calcular base considerando platos estandard vs custom
    const basePrice = plates.reduce((sum, plate) => {
        return sum + (plate.isCustom ? MEAL_PREP_PRICES.CUSTOM_PLATE : MEAL_PREP_PRICES.STANDARD_PLATE);
    }, 0);

    const premiumTotal = plates.reduce((sum, plate) => {
        let plateSurcharge = plate.premiumSurcharge || 0;
        if (plate.componentSurcharges) {
            plateSurcharge += Object.values(plate.componentSurcharges).reduce((a, b) => a + b, 0);
        }
        return sum + plateSurcharge;
    }, 0);

    // Calcular cargos por extras
    const extrasTotal = plates.reduce((sum, plate) => {
        let plateExtrasSum = 0;

        // Product-based extras
        if (plate.componentExtras) {
            Object.values(plate.componentExtras).forEach(extras => {
                extras.forEach(extra => {
                    plateExtrasSum += (extra.price * extra.quantity);
                });
            });
        }

        // Category-based extra unlocking/quantity surcharges
        if (plate.extraCategories && mealPrepConfig?.categories) {
            Object.keys(plate.extraCategories).forEach(catId => {
                if (plate.extraCategories![catId]) {
                    const catConfig = mealPrepConfig.categories?.find(c => c.id === catId);
                    if (catConfig?.extraPrice) {
                        plateExtrasSum += catConfig.extraPrice;
                    }
                }
            });
        }

        return sum + plateExtrasSum;
    }, 0);

    const deliverySurcharge = distanceMiles && distanceMiles > DEFAULT_DELIVERY_CONFIG.freeDistanceMiles
        ? DEFAULT_DELIVERY_CONFIG.surchargeAmount
        : 0;
    const trainingTotal = trainingPlan?.monthlyPrice || 0;

    return {
        basePrice,
        premiumTotal,
        deliverySurcharge,
        trainingTotal,
        extrasTotal,
        total: basePrice + premiumTotal + extrasTotal + deliverySurcharge + trainingTotal,
    };
}

/**
 * Crea un plato vacío
 */
export function createEmptyPlate(id: string): MealPlate {
    return {
        id,
        components: {},
        componentExtras: {},
    };
}

/**
 * Crea un conjunto de platos vacíos para un paquete
 */
export function createEmptyPlates(count: number): MealPlate[] {
    return Array.from({ length: count }, (_, i) => createEmptyPlate(`plate-${i + 1}`));
}

/**
 * Verifica si un paquete está completo (todos los platos tienen sus componentes seleccionados)
 * Se pasan las categorías requeridas para validar
 */
export function isMealPackageComplete(plates: MealPlate[], requiredCategories: string[]): boolean {
    return plates.every(plate =>
        requiredCategories.every(catId =>
            plate.components[catId] && plate.components[catId].trim() !== ""
        )
    );
}

/**
 * Formatea el resumen de un plato para mostrar
 */
export function formatPlateDescription(plate: MealPlate): string {
    const parts: string[] = [];

    // Agregar componentes con sus extras
    Object.entries(plate.components).forEach(([catId, name]) => {
        if (!name) return;
        let componentDesc = name;

        // Product-based extras
        const extras = plate.componentExtras?.[catId];
        if (extras && extras.length > 0) {
            const extrasStr = extras.map(e => e.quantity > 1 ? `${e.name} x${e.quantity}` : e.name).join(", ");
            componentDesc += ` (+ ${extrasStr})`;
        }

        // Category-based extra surcharge
        if (plate.extraCategories?.[catId]) {
            componentDesc += " [EXTRA]";
        }

        parts.push(componentDesc);
    });

    let desc = parts.join(" + ") || "Sin configurar";
    if (plate.notes) {
        desc += ` (${plate.notes})`;
    }
    return desc;
}
