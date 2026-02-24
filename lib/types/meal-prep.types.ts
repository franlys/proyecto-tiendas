/**
 * Tipos para Meal Prep / Preparación de Comidas
 *
 * Este archivo define los tipos para negocios de meal prep
 * que ofrecen paquetes de comidas personalizables.
 */

// ============================================
// CONFIGURACIÓN DE PLATOS
// ============================================

/**
 * Componentes de un plato personalizado
 */
export interface MealPlateComponents {
    proteina: string;      // Texto libre: "Pollo", "Res", "Salmón", etc.
    carbohidrato: string;  // Texto libre: "Arroz", "Papa", "Quinoa", etc.
    vegetales: string;     // Texto libre: "Brócoli y zanahoria", etc.
    frutas: string;        // Texto libre: "Manzana", "Plátano", etc.
}

/**
 * Un plato individual dentro de un paquete
 */
export interface MealPlate {
    id: string;
    components: MealPlateComponents;
    isPremiumProtein?: boolean;   // Si usa proteína premium (+$1-$7)
    premiumSurcharge?: number;    // Cargo extra por proteína premium
}

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
    { id: "beef", name: "Res Premium", surcharge: 1 },
    { id: "shrimp", name: "Camarones", surcharge: 5 },
    { id: "salmon", name: "Salmón", surcharge: 7 },
    { id: "steak", name: "Filete", surcharge: 5 },
    { id: "lamb", name: "Cordero", surcharge: 6 },
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
    basePrice: number;          // plateCount * pricePerPlate
    premiumTotal: number;       // Sum of all premium surcharges
    deliveryDistance?: number;  // Distancia en millas
    deliverySurcharge: number;  // $30 si >10 millas
    totalPrice: number;         // basePrice + premiumTotal + deliverySurcharge
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
    surchargeAmount: 30,
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

    // Precios calculados
    basePrice: number;  // plateCount * pricePerPlate
    featured?: boolean;
}

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Calcula el precio total de un pedido de meal prep
 */
export function calculateMealPrepTotal(
    plates: MealPlate[],
    pricePerPlate: number,
    distanceMiles?: number
): { basePrice: number; premiumTotal: number; deliverySurcharge: number; total: number } {
    const basePrice = plates.length * pricePerPlate;
    const premiumTotal = plates.reduce((sum, plate) => sum + (plate.premiumSurcharge || 0), 0);
    const deliverySurcharge = distanceMiles && distanceMiles > DEFAULT_DELIVERY_CONFIG.freeDistanceMiles
        ? DEFAULT_DELIVERY_CONFIG.surchargeAmount
        : 0;

    return {
        basePrice,
        premiumTotal,
        deliverySurcharge,
        total: basePrice + premiumTotal + deliverySurcharge,
    };
}

/**
 * Crea un plato vacío
 */
export function createEmptyPlate(id: string): MealPlate {
    return {
        id,
        components: {
            proteina: "",
            carbohidrato: "",
            vegetales: "",
            frutas: "",
        },
    };
}

/**
 * Crea un conjunto de platos vacíos para un paquete
 */
export function createEmptyPlates(count: number): MealPlate[] {
    return Array.from({ length: count }, (_, i) => createEmptyPlate(`plate-${i + 1}`));
}

/**
 * Verifica si un paquete está completo (todos los platos tienen los 3 componentes)
 */
export function isMealPackageComplete(plates: MealPlate[]): boolean {
    return plates.every(plate =>
        plate.components.proteina.trim() !== "" &&
        plate.components.carbohidrato.trim() !== "" &&
        plate.components.vegetales.trim() !== "" &&
        plate.components.frutas.trim() !== ""
    );
}

/**
 * Formatea el resumen de un plato para mostrar
 */
export function formatPlateDescription(plate: MealPlate): string {
    const { proteina, carbohidrato, vegetales, frutas } = plate.components;
    const parts = [];
    if (proteina) parts.push(proteina);
    if (carbohidrato) parts.push(carbohidrato);
    if (vegetales) parts.push(vegetales);
    if (frutas) parts.push(frutas);
    return parts.join(" + ") || "Sin configurar";
}
