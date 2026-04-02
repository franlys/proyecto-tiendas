/**
 * REGISTRO DE PLANTILLAS
 * Solo el Super Admin puede gestionar estas plantillas.
 * Los dueños de negocio no pueden editar la apariencia de su tienda.
 */

export type TemplateCategory = "standard" | "premium" | "custom";
export type TemplateStatus = "active" | "hidden" | "deleted";

export interface TemplateDefinition {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    status: TemplateStatus;
    thumbnail?: string;
    isPremium?: boolean;
    /** Nombre del cliente o negocio para el que fue creada (si es custom) */
    customFor?: string;
    /** Notas internas del equipo sobre esta plantilla */
    notes?: string;
    createdAt: string;
    updatedAt?: string;
}

/**
 * Plantillas nativas del sistema.
 * Para agregar una plantilla custom, guardarla en Firestore:
 * `system/config` → campo `customTemplates: TemplateDefinition[]`
 */
export const BUILT_IN_TEMPLATES: TemplateDefinition[] = [
    {
        id: "standard",
        name: "Estándar",
        description: "Diseño limpio y funcional para todo tipo de negocios.",
        category: "standard",
        status: "active",
        createdAt: "2024-01-01",
    },
    {
        id: "premium-drop-v1",
        name: "Premium Drop",
        description: "Enfoque en productos destacados y elegancia.",
        category: "premium",
        status: "active",
        createdAt: "2024-03-01",
    },
    {
        id: "street-drop-v1",
        name: "Street Style",
        description: "Estética urbana, ideal para moda y accesorios.",
        category: "premium",
        status: "active",
        createdAt: "2024-04-01",
    },
    {
        id: "cosmic-drop-v1",
        name: "Cosmic",
        description: "Inspirado en el espacio, efectos galácticos.",
        category: "premium",
        status: "active",
        createdAt: "2024-05-01",
    },
    {
        id: "tech-drop-v1",
        name: "Tech Premium",
        description: "Innovación y tecnología con animaciones avanzadas.",
        category: "premium",
        status: "active",
        isPremium: true,
        createdAt: "2024-06-01",
    },
    {
        id: "tech-3d-v1",
        name: "Tech 3D Breakout",
        description: "Screen Breakout, Liquid Metal y portal digital. El tema más avanzado.",
        category: "premium",
        status: "active",
        isPremium: true,
        createdAt: "2024-08-01",
    },
    {
        id: "tech-premium-v2",
        name: "Tech Premium v2",
        description: "Minimalismo total tipo Apple/Nothing. Tipografía enorme.",
        category: "premium",
        status: "active",
        isPremium: true,
        createdAt: "2024-10-01",
    },
    {
        id: "viora-premium",
        name: "Viora Premium",
        description: "Minimalismo extremo editorial estilo Zara. Múltiples vistas dinámicas.",
        category: "premium",
        status: "active",
        isPremium: true,
        createdAt: "2026-04-02",
    },
];

/** IDs de plantillas activas (no ocultas ni eliminadas) */
export function getActiveTemplateIds(customTemplates: TemplateDefinition[] = []): string[] {
    return [...BUILT_IN_TEMPLATES, ...customTemplates]
        .filter(t => t.status === "active")
        .map(t => t.id);
}

/** Obtiene la definición completa de una plantilla por ID */
export function getTemplateById(
    id: string,
    customTemplates: TemplateDefinition[] = []
): TemplateDefinition | undefined {
    return [...BUILT_IN_TEMPLATES, ...customTemplates].find(t => t.id === id);
}
