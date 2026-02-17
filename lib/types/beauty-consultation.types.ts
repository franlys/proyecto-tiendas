/**
 * Tipos para el Sistema de Pre-Consulta de Belleza
 *
 * Permite a las clientas comunicar sus preferencias antes de la cita
 * para servicios de maquillaje, uñas, peinados, etc.
 */

// ============================================
// TONOS DE PIEL
// ============================================

export type SkinTone =
    | "very_light"   // Muy clara / Porcelana
    | "light"        // Clara
    | "light_medium" // Clara-Media
    | "medium"       // Media
    | "medium_tan"   // Media-Bronceada
    | "tan"          // Bronceada
    | "dark"         // Oscura
    | "very_dark";   // Muy oscura

export interface SkinToneOption {
    id: SkinTone;
    label: string;
    description: string;
    colorHex: string;      // Color representativo
    undertone: "warm" | "cool" | "neutral";
}

export const SKIN_TONES: SkinToneOption[] = [
    { id: "very_light", label: "Muy Clara", description: "Porcelana, se quema fácilmente", colorHex: "#FFE4D1", undertone: "cool" },
    { id: "light", label: "Clara", description: "Piel clara con tonos rosados", colorHex: "#F5D0B5", undertone: "cool" },
    { id: "light_medium", label: "Clara-Media", description: "Beige claro", colorHex: "#E8C4A8", undertone: "neutral" },
    { id: "medium", label: "Media", description: "Beige dorado", colorHex: "#D4A574", undertone: "warm" },
    { id: "medium_tan", label: "Media-Bronceada", description: "Canela, oliva", colorHex: "#C4956A", undertone: "warm" },
    { id: "tan", label: "Bronceada", description: "Caramelo", colorHex: "#A67B5B", undertone: "warm" },
    { id: "dark", label: "Oscura", description: "Café, chocolate", colorHex: "#8B5A3C", undertone: "warm" },
    { id: "very_dark", label: "Muy Oscura", description: "Ébano", colorHex: "#5C3D2E", undertone: "neutral" },
];

// ============================================
// SUBTONOS DE PIEL
// ============================================

export type Undertone = "warm" | "cool" | "neutral";

export interface UndertoneOption {
    id: Undertone;
    label: string;
    description: string;
    indicators: string[];
}

export const UNDERTONES: UndertoneOption[] = [
    {
        id: "warm",
        label: "Cálido",
        description: "Tonos dorados, melocotón, amarillos",
        indicators: ["Venas verdes en la muñeca", "El oro te favorece", "Te bronceas fácil"]
    },
    {
        id: "cool",
        label: "Frío",
        description: "Tonos rosados, rojos, azulados",
        indicators: ["Venas azules/moradas", "La plata te favorece", "Te quemas fácil"]
    },
    {
        id: "neutral",
        label: "Neutro",
        description: "Mezcla de tonos cálidos y fríos",
        indicators: ["Venas verde-azuladas", "Ambos metales te quedan", "Te bronceas gradualmente"]
    },
];

// ============================================
// TIPOS DE EVENTO
// ============================================

export type EventType =
    | "wedding_bride"      // Novia
    | "wedding_guest"      // Invitada de boda
    | "wedding_party"      // Dama de honor / Madrina
    | "quinceanera"        // XV Años
    | "graduation"         // Graduación
    | "prom"               // Baile de graduación
    | "party"              // Fiesta
    | "gala"               // Gala / Evento formal
    | "photoshoot"         // Sesión fotográfica
    | "video"              // Video / Contenido
    | "everyday"           // Día a día
    | "work"               // Trabajo / Oficina
    | "date_night"         // Cita romántica
    | "halloween"          // Halloween / Disfraz
    | "costume"            // Caracterización
    | "other";             // Otro

export interface EventTypeOption {
    id: EventType;
    label: string;
    icon: string;
    suggestedStyles: MakeupStyle[];
}

export const EVENT_TYPES: EventTypeOption[] = [
    { id: "wedding_bride", label: "Novia", icon: "👰", suggestedStyles: ["romantic", "elegant", "natural"] },
    { id: "wedding_guest", label: "Invitada de Boda", icon: "💒", suggestedStyles: ["elegant", "glamour", "romantic"] },
    { id: "wedding_party", label: "Dama / Madrina", icon: "💐", suggestedStyles: ["romantic", "elegant", "soft_glam"] },
    { id: "quinceanera", label: "XV Años", icon: "👑", suggestedStyles: ["glamour", "romantic", "dramatic"] },
    { id: "graduation", label: "Graduación", icon: "🎓", suggestedStyles: ["elegant", "natural", "soft_glam"] },
    { id: "prom", label: "Baile", icon: "💃", suggestedStyles: ["glamour", "dramatic", "trendy"] },
    { id: "party", label: "Fiesta", icon: "🎉", suggestedStyles: ["glamour", "trendy", "dramatic"] },
    { id: "gala", label: "Gala / Formal", icon: "✨", suggestedStyles: ["elegant", "glamour", "dramatic"] },
    { id: "photoshoot", label: "Sesión de Fotos", icon: "📸", suggestedStyles: ["natural", "editorial", "artistic"] },
    { id: "video", label: "Video / Contenido", icon: "🎬", suggestedStyles: ["natural", "soft_glam", "trendy"] },
    { id: "everyday", label: "Día a Día", icon: "☀️", suggestedStyles: ["natural", "no_makeup", "soft_glam"] },
    { id: "work", label: "Trabajo", icon: "💼", suggestedStyles: ["natural", "elegant", "no_makeup"] },
    { id: "date_night", label: "Cita Romántica", icon: "💕", suggestedStyles: ["romantic", "soft_glam", "glamour"] },
    { id: "halloween", label: "Halloween", icon: "🎃", suggestedStyles: ["artistic", "dramatic", "editorial"] },
    { id: "costume", label: "Caracterización", icon: "🎭", suggestedStyles: ["artistic", "editorial", "dramatic"] },
    { id: "other", label: "Otro", icon: "📝", suggestedStyles: ["natural", "glamour", "elegant"] },
];

// ============================================
// ESTILOS DE MAQUILLAJE
// ============================================

export type MakeupStyle =
    | "no_makeup"    // No-makeup makeup
    | "natural"      // Natural / Fresco
    | "soft_glam"    // Soft Glam
    | "glamour"      // Glamour completo
    | "dramatic"     // Dramático
    | "romantic"     // Romántico / Suave
    | "elegant"      // Elegante / Clásico
    | "trendy"       // Tendencia / Moderno
    | "editorial"    // Editorial / Alto impacto
    | "artistic";    // Artístico / Creativo

export interface MakeupStyleOption {
    id: MakeupStyle;
    label: string;
    description: string;
    icon: string;
    intensity: 1 | 2 | 3 | 4 | 5; // 1 = muy sutil, 5 = muy intenso
    characteristics: string[];
}

export const MAKEUP_STYLES: MakeupStyleOption[] = [
    {
        id: "no_makeup",
        label: "No-Makeup Makeup",
        description: "Casi imperceptible, solo mejora la piel",
        icon: "🌿",
        intensity: 1,
        characteristics: ["Piel perfecta", "Cejas naturales", "Labios nude", "Sin sombras"]
    },
    {
        id: "natural",
        label: "Natural",
        description: "Fresco y luminoso, como si no llevaras nada",
        icon: "🌸",
        intensity: 2,
        characteristics: ["Piel luminosa", "Sombras neutras", "Máscara suave", "Rubor natural"]
    },
    {
        id: "soft_glam",
        label: "Soft Glam",
        description: "Elegante pero no exagerado",
        icon: "💫",
        intensity: 3,
        characteristics: ["Contorno suave", "Sombras blend", "Pestañas definidas", "Highlight sutil"]
    },
    {
        id: "glamour",
        label: "Glamour",
        description: "Full glam, para brillar",
        icon: "💎",
        intensity: 4,
        characteristics: ["Contorno marcado", "Ojos definidos", "Labios bold", "Highlight intenso"]
    },
    {
        id: "dramatic",
        label: "Dramático",
        description: "Impactante y audaz",
        icon: "🔥",
        intensity: 5,
        characteristics: ["Smokey eye", "Delineado gráfico", "Pestañas XXL", "Colores intensos"]
    },
    {
        id: "romantic",
        label: "Romántico",
        description: "Suave, femenino, soñador",
        icon: "🌹",
        intensity: 3,
        characteristics: ["Tonos rosados", "Piel de porcelana", "Labios suaves", "Mirada dulce"]
    },
    {
        id: "elegant",
        label: "Elegante",
        description: "Clásico y sofisticado",
        icon: "👸",
        intensity: 3,
        characteristics: ["Cat eye clásico", "Labio rojo", "Piel mate", "Cejas definidas"]
    },
    {
        id: "trendy",
        label: "Tendencia",
        description: "Lo último en moda",
        icon: "🦋",
        intensity: 3,
        characteristics: ["Técnicas nuevas", "Colores de moda", "Acabados únicos", "Detalles creativos"]
    },
    {
        id: "editorial",
        label: "Editorial",
        description: "Para fotos de alto impacto",
        icon: "📷",
        intensity: 4,
        characteristics: ["Colores vibrantes", "Formas geométricas", "Texturas", "Arte en la piel"]
    },
    {
        id: "artistic",
        label: "Artístico",
        description: "Creativo sin límites",
        icon: "🎨",
        intensity: 5,
        characteristics: ["Body paint", "Efectos especiales", "Fantasía", "Sin reglas"]
    },
];

// ============================================
// DETALLES ESPECÍFICOS
// ============================================

export type EyeDetail =
    | "smokey"           // Ojos ahumados
    | "cut_crease"       // Cut crease
    | "cat_eye"          // Cat eye / Delineado felino
    | "graphic_liner"    // Delineado gráfico
    | "glitter"          // Glitter / Brillos
    | "natural_lashes"   // Pestañas naturales
    | "dramatic_lashes"  // Pestañas dramáticas
    | "colored_lashes"   // Pestañas de color
    | "colored_shadow"   // Sombras de color
    | "neutral_shadow";  // Sombras neutras

export type LipDetail =
    | "nude"             // Nude / Natural
    | "pink"             // Rosa
    | "red"              // Rojo
    | "berry"            // Vino / Berry
    | "coral"            // Coral
    | "bold"             // Color intenso
    | "ombre"            // Ombré
    | "glossy"           // Brilloso
    | "matte"            // Mate
    | "no_lipstick";     // Sin labial

export type SkinDetail =
    | "natural_finish"   // Acabado natural
    | "matte_finish"     // Acabado mate
    | "dewy_finish"      // Acabado húmedo/glow
    | "light_contour"    // Contorno ligero
    | "heavy_contour"    // Contorno marcado
    | "highlight"        // Iluminador
    | "no_makeup_skin"   // Piel casi sin base
    | "full_coverage";   // Cobertura total

export interface DetailOption {
    id: string;
    label: string;
    icon: string;
}

export const EYE_DETAILS: DetailOption[] = [
    { id: "smokey", label: "Ojos Ahumados", icon: "💨" },
    { id: "cut_crease", label: "Cut Crease", icon: "✂️" },
    { id: "cat_eye", label: "Cat Eye", icon: "🐱" },
    { id: "graphic_liner", label: "Delineado Gráfico", icon: "📐" },
    { id: "glitter", label: "Glitter / Brillos", icon: "✨" },
    { id: "natural_lashes", label: "Pestañas Naturales", icon: "👁️" },
    { id: "dramatic_lashes", label: "Pestañas XXL", icon: "🦋" },
    { id: "colored_lashes", label: "Pestañas de Color", icon: "🌈" },
    { id: "colored_shadow", label: "Sombras de Color", icon: "🎨" },
    { id: "neutral_shadow", label: "Sombras Neutras", icon: "🤎" },
];

export const LIP_DETAILS: DetailOption[] = [
    { id: "nude", label: "Nude", icon: "🫦" },
    { id: "pink", label: "Rosa", icon: "💗" },
    { id: "red", label: "Rojo", icon: "❤️" },
    { id: "berry", label: "Vino / Berry", icon: "🍇" },
    { id: "coral", label: "Coral", icon: "🧡" },
    { id: "bold", label: "Color Bold", icon: "💜" },
    { id: "ombre", label: "Ombré", icon: "🌅" },
    { id: "glossy", label: "Brilloso", icon: "💋" },
    { id: "matte", label: "Mate", icon: "🖤" },
    { id: "no_lipstick", label: "Sin Labial", icon: "⚪" },
];

export const SKIN_DETAILS: DetailOption[] = [
    { id: "natural_finish", label: "Acabado Natural", icon: "🌿" },
    { id: "matte_finish", label: "Acabado Mate", icon: "📝" },
    { id: "dewy_finish", label: "Acabado Glow", icon: "💧" },
    { id: "light_contour", label: "Contorno Suave", icon: "🌙" },
    { id: "heavy_contour", label: "Contorno Marcado", icon: "🔺" },
    { id: "highlight", label: "Iluminador", icon: "⭐" },
    { id: "no_makeup_skin", label: "Piel Sin Base", icon: "🍃" },
    { id: "full_coverage", label: "Cobertura Total", icon: "🛡️" },
];

// ============================================
// INFORMACIÓN ADICIONAL
// ============================================

export interface SkinConcerns {
    acne: boolean;
    rosacea: boolean;
    darkCircles: boolean;
    dryPatches: boolean;
    oilySkin: boolean;
    sensitiveSkin: boolean;
    wrinkles: boolean;
    hyperpigmentation: boolean;
}

export interface Allergies {
    latex: boolean;
    gluten: boolean;
    fragrance: boolean;
    nickel: boolean;
    specificProducts: string[];
}

// ============================================
// DOCUMENTO DE PRE-CONSULTA
// ============================================

export interface BeautyConsultation {
    id: string;

    // Relación con la cita
    bookingId: string;
    shopId: string;
    customerId?: string;
    customerPhone: string;
    customerName: string;

    // Preferencias de look
    skinTone?: SkinTone;
    undertone?: Undertone;
    eventType: EventType;
    eventDate?: string;           // Fecha del evento (puede ser diferente a la cita)
    eventDescription?: string;    // Descripción adicional del evento

    // Estilo deseado
    preferredStyle: MakeupStyle;
    alternativeStyles?: MakeupStyle[];

    // Detalles específicos
    eyeDetails: EyeDetail[];
    lipDetails: LipDetail[];
    skinDetails: SkinDetail[];

    // Inspiración
    inspirationImages: string[];  // URLs de imágenes subidas
    pinterestLinks?: string[];
    instagramLinks?: string[];
    notes?: string;               // Notas adicionales de la clienta

    // Información de salud/alergias
    skinConcerns?: SkinConcerns;
    allergies?: Allergies;
    wearContactLenses: boolean;
    hadReactionBefore: boolean;
    reactionDetails?: string;

    // Preferencias de productos
    preferVegan: boolean;
    preferCrueltyFree: boolean;
    preferFragranceFree: boolean;

    // Metadata
    createdAt: string;
    updatedAt: string;
    viewedByArtist: boolean;
    artistNotes?: string;         // Notas del maquillista

    // Review status
    reviewedAt?: string;          // Fecha de revisión
    reviewedBy?: string;          // ID del artista que revisó
}

// ============================================
// GALERÍA DE LOOKS
// ============================================

export interface LookInspiration {
    id: string;
    shopId: string;

    // Info del look
    title: string;
    description?: string;
    imageUrl: string;
    thumbnailUrl?: string;

    // Categorización
    eventTypes: EventType[];
    styles: MakeupStyle[];
    skinTones: SkinTone[];        // Tonos de piel para los que funciona bien

    // Tags
    tags: string[];

    // Engagement
    likes: number;
    saves: number;

    // Metadata
    featured: boolean;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

// ============================================
// VALORES POR DEFECTO
// ============================================

export const DEFAULT_CONSULTATION: Partial<BeautyConsultation> = {
    eyeDetails: [],
    lipDetails: [],
    skinDetails: [],
    inspirationImages: [],
    wearContactLenses: false,
    hadReactionBefore: false,
    preferVegan: false,
    preferCrueltyFree: false,
    preferFragranceFree: false,
    viewedByArtist: false,
};

// ============================================
// HELPERS
// ============================================

export function getSkinToneOption(id: SkinTone): SkinToneOption | undefined {
    return SKIN_TONES.find(t => t.id === id);
}

export function getEventTypeOption(id: EventType): EventTypeOption | undefined {
    return EVENT_TYPES.find(e => e.id === id);
}

export function getMakeupStyleOption(id: MakeupStyle): MakeupStyleOption | undefined {
    return MAKEUP_STYLES.find(s => s.id === id);
}

export function getSuggestedStylesForEvent(eventType: EventType): MakeupStyleOption[] {
    const event = EVENT_TYPES.find(e => e.id === eventType);
    if (!event) return [];
    return event.suggestedStyles
        .map(styleId => MAKEUP_STYLES.find(s => s.id === styleId))
        .filter((s): s is MakeupStyleOption => s !== undefined);
}
