/**
 * Training Package Types
 * For personal trainers, gyms, fitness coaches
 */

export type SessionFrequency = 1 | 2 | 3 | 4 | 5 | 6 | 7; // Sessions per week
export type SessionDuration = 30 | 45 | 60 | 90 | 120; // Minutes
export type PackageBillingCycle = "weekly" | "biweekly" | "monthly";

export interface TrainingPackage {
    id: string;
    name: string;
    description?: string;

    // Session details
    sessionsPerWeek: SessionFrequency;
    sessionDuration: SessionDuration; // Minutes

    // Pricing
    price: number;
    billingCycle: PackageBillingCycle;

    // What's included
    includes: string[]; // ["Rutina personalizada", "Seguimiento nutricional", etc.]

    // Location options
    locationType: "in_person" | "online" | "both";

    // Distance limit (for in-person sessions)
    maxDistanceMiles?: number; // e.g., 10 miles included
    extraMileFee?: number; // Fee per mile beyond limit

    // Active status
    isActive: boolean;

    // Order for display
    sortOrder?: number;

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

export interface TrainingSubscription {
    id: string;
    packageId: string;
    packageName: string;

    // Customer info
    customerId: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerAddress?: string;
    customerCoordinates?: { lat: number; lng: number };

    // Subscription details
    sessionsPerWeek: SessionFrequency;
    sessionDuration: SessionDuration;
    billingCycle: PackageBillingCycle;
    price: number;

    // Distance-based pricing
    distanceMiles?: number;
    distanceFee?: number;
    totalPrice: number;

    // Preferred schedule
    preferredDays: DayOfWeek[];
    preferredTimeSlot: string; // e.g., "morning", "afternoon", "evening"
    specificTimes?: { day: DayOfWeek; time: string }[]; // Specific times per day

    // Status
    status: SubscriptionStatus;
    startDate: string;
    endDate?: string;
    renewalDate?: string;

    // Notes
    notes?: string;
    fitnessGoals?: string;
    healthConditions?: string;

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";
export type SubscriptionStatus = "pending" | "active" | "paused" | "cancelled" | "expired";

export const DAY_LABELS: Record<DayOfWeek, string> = {
    monday: "Lunes",
    tuesday: "Martes",
    wednesday: "Miércoles",
    thursday: "Jueves",
    friday: "Viernes",
    saturday: "Sábado",
    sunday: "Domingo",
};

export const BILLING_CYCLE_LABELS: Record<PackageBillingCycle, string> = {
    weekly: "Semanal",
    biweekly: "Quincenal",
    monthly: "Mensual",
};

export const FREQUENCY_LABELS: Record<SessionFrequency, string> = {
    1: "1 sesión/semana",
    2: "2 sesiones/semana",
    3: "3 sesiones/semana",
    4: "4 sesiones/semana",
    5: "5 sesiones/semana",
    6: "6 sesiones/semana",
    7: "Diario",
};

export const DURATION_LABELS: Record<SessionDuration, string> = {
    30: "30 min",
    45: "45 min",
    60: "1 hora",
    90: "1.5 horas",
    120: "2 horas",
};

// Default packages for quick setup
export const DEFAULT_TRAINING_PACKAGES: Omit<TrainingPackage, "id" | "createdAt" | "updatedAt">[] = [
    {
        name: "Plan Básico",
        description: "Ideal para comenzar tu transformación",
        sessionsPerWeek: 2,
        sessionDuration: 60,
        price: 2500,
        billingCycle: "monthly",
        includes: [
            "2 entrenamientos semanales",
            "Rutina personalizada",
            "Seguimiento por WhatsApp",
        ],
        locationType: "both",
        maxDistanceMiles: 10,
        extraMileFee: 50,
        isActive: true,
        sortOrder: 1,
    },
    {
        name: "Plan Intermedio",
        description: "Para resultados más rápidos",
        sessionsPerWeek: 3,
        sessionDuration: 60,
        price: 3500,
        billingCycle: "monthly",
        includes: [
            "3 entrenamientos semanales",
            "Rutina personalizada",
            "Plan nutricional básico",
            "Seguimiento por WhatsApp",
        ],
        locationType: "both",
        maxDistanceMiles: 10,
        extraMileFee: 50,
        isActive: true,
        sortOrder: 2,
    },
    {
        name: "Plan Premium",
        description: "Transformación completa",
        sessionsPerWeek: 5,
        sessionDuration: 60,
        price: 5000,
        billingCycle: "monthly",
        includes: [
            "5 entrenamientos semanales",
            "Rutina personalizada avanzada",
            "Plan nutricional completo",
            "Seguimiento diario",
            "Mediciones mensuales",
        ],
        locationType: "both",
        maxDistanceMiles: 15,
        extraMileFee: 40,
        isActive: true,
        sortOrder: 3,
    },
];
