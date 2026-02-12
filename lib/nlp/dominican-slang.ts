
export type Intent =
    | "GREETING"
    | "PRICE_INQUIRY"
    | "PAYMENT_PROOF"
    | "ADDRESS_INQUIRY"
    | "HUMAN_HANDOVER"
    | "CATALOG_INQUIRY"
    | "UNKNOWN";

interface IntentRule {
    intent: Intent;
    keywords: string[];
    minMatch: number; // Minimum number of keywords/phrases to match
}

const RULES: IntentRule[] = [
    {
        intent: "GREETING",
        keywords: [
            "klk", "k l k", "saludos", "buenas", "hola", "dime a ver",
            "que lo que", "que to", "tato", "como tu ta", "saludo"
        ],
        minMatch: 1
    },
    {
        intent: "PRICE_INQUIRY",
        keywords: [
            "precio", "cuanto cuesta", "a como sale", "dame luz", "cuanto e",
            "precio de", "cuanto vale", "cotizame", "a como lo tiene"
        ],
        minMatch: 1
    },
    {
        intent: "PAYMENT_PROOF",
        keywords: [
            "ya pague", "pagué", "transferi", "deposite", "comprobante",
            "aqui ta el pago", "recibo", "ya te solté", "ya transferi", "copia del pago"
        ],
        minMatch: 1
    },
    {
        intent: "ADDRESS_INQUIRY",
        keywords: [
            "ubicacion", "donde estan", "donde se encuentra", "direccion",
            "donde e", "llegar", "local", "tienda fisica", "mandame la loqueichon"
        ],
        minMatch: 1
    },
    {
        intent: "HUMAN_HANDOVER",
        keywords: [
            "hablar con alguien", "gente real", "humano", "persona",
            "no quiero robot", "me tiene harto", "asistencia", "soporte"
        ],
        minMatch: 1
    },
    {
        intent: "CATALOG_INQUIRY",
        keywords: [
            "catalogo", "que venden", "productos", "menu", "lista",
            "que tienen", "cuales son los articulo"
        ],
        minMatch: 1
    }
];

export function detectIntent(message: string): Intent {
    const normalized = message.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .trim();

    // Check strict exact/partial phrase matches
    for (const rule of RULES) {
        for (const keyword of rule.keywords) {
            if (normalized.includes(keyword)) {
                return rule.intent;
            }
        }
    }

    return "UNKNOWN";
}
