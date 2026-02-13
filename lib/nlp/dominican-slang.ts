
export type Intent =
    | "GREETING"
    | "PRICE_INQUIRY"
    | "PAYMENT_PROOF"
    | "PAYMENT_INFO"      // NEW: Asking for bank accounts/how to pay
    | "ORDER_STATUS"      // NEW: Asking about their order
    | "ORDER_MODIFICATION"// NEW: Want to modify/cancel order
    | "ADDRESS_INQUIRY"
    | "HUMAN_HANDOVER"
    | "CATALOG_INQUIRY"
    | "BOOKING_STATUS"
    | "PAYMENT_POLICY"
    | "UNKNOWN";

interface IntentRule {
    intent: Intent;
    keywords: string[];
    minMatch: number;
    priority: number; // Higher priority = checked first
}

const RULES: IntentRule[] = [
    // HIGH PRIORITY: Specific intents that should NOT be confused with greeting
    {
        intent: "PAYMENT_INFO",
        keywords: [
            // Direct payment questions
            "cuenta", "cuentas", "numero de cuenta", "cuenta bancaria",
            "como pago", "como te pago", "como le pago", "como les pago",
            "como transfiero", "como te transfiero", "transferencia",
            "datos de pago", "datos bancarios", "banco", "bancos",
            "a donde transfiero", "donde deposito", "donde pago",
            "metodo de pago", "metodos de pago", "formas de pago",
            "aceptan tarjeta", "tarjeta de credito", "efectivo",
            "pago movil", "zelle", "paypal", "nequi", "yape",
            "a que cuenta", "dame la cuenta", "pasa la cuenta",
            "numero para transferir", "para hacerte el pago",
            "quiero pagar", "listo para pagar", "voy a pagar"
        ],
        minMatch: 1,
        priority: 10
    },
    {
        intent: "ORDER_STATUS",
        keywords: [
            // Order tracking
            "mi pedido", "como va mi pedido", "estado de mi pedido",
            "donde esta mi pedido", "ya salio", "ya lo enviaron",
            "cuando llega", "cuando me llega", "tracking", "rastreo",
            "ya viene", "ya esta listo", "lo tienen listo",
            "status del pedido", "estado del orden", "mi orden",
            "pedido numero", "orden numero", "seguimiento",
            "cuanto falta", "eta", "hora de entrega",
            "lo van a entregar", "me lo entregan hoy"
        ],
        minMatch: 1,
        priority: 10
    },
    {
        intent: "ORDER_MODIFICATION",
        keywords: [
            // Modify/cancel orders
            "modificar", "cambiar pedido", "cambiar mi pedido",
            "cancelar", "cancelar pedido", "quiero cancelar",
            "agregar algo", "quitar algo", "cambiar direccion",
            "cambiar la direccion", "cambiar hora", "otra direccion",
            "agregar producto", "quitar producto", "añadir",
            "remover", "eliminar del pedido", "error en pedido",
            "me equivoque", "pedido equivocado", "cambio de pedido"
        ],
        minMatch: 1,
        priority: 10
    },
    {
        intent: "PAYMENT_PROOF",
        keywords: [
            // Already paid - confirmation
            "ya pague", "ya pagué", "pague", "pagué",
            "transferi", "transferí", "deposite", "deposité",
            "comprobante", "capture", "captura", "screenshot",
            "aqui ta el pago", "ahi ta el pago", "recibo",
            "ya te solte", "ya te solté", "ya transferi",
            "copia del pago", "foto del pago", "imagen del pago",
            "listo el pago", "hecho el pago", "pago realizado",
            "te acabo de transferir", "te acabo de pagar"
        ],
        minMatch: 1,
        priority: 9
    },
    {
        intent: "BOOKING_STATUS",
        keywords: [
            "mi cita", "como va lo mio", "confirmaron", "status cita",
            "tengo cita", "cita pendiente", "como va la cita",
            "mi reserva", "mi reservacion", "tengo reserva",
            "confirmar cita", "confirmar reserva", "recordatorio",
            "a que hora es mi cita", "que dia es mi cita"
        ],
        minMatch: 1,
        priority: 8
    },
    {
        intent: "HUMAN_HANDOVER",
        keywords: [
            // Frustration / want human
            "hablar con alguien", "gente real", "humano", "persona real",
            "no quiero robot", "no quiero bot", "quiero hablar con alguien",
            "asistencia", "soporte", "atencion al cliente",
            "me tiene harto", "jarto", "cansao", "harto",
            "no me entiende", "no entiende", "no sirve",
            "quiero un agente", "agente real", "operador"
        ],
        minMatch: 1,
        priority: 8
    },
    {
        intent: "PAYMENT_POLICY",
        keywords: [
            // Payment policy questions
            "se paga antes", "cuanto adelanto", "fiao", "pago adelantado",
            "el 50", "mitad antes", "abonar", "cuanto hay que pagar",
            "anticipo", "deposito previo", "pago por adelantado",
            "pagan al recibir", "contra entrega", "al entregar",
            "primero se paga", "hay que adelantar"
        ],
        minMatch: 1,
        priority: 7
    },
    {
        intent: "ADDRESS_INQUIRY",
        keywords: [
            "ubicacion", "donde estan", "donde se encuentra", "direccion",
            "donde e", "llegar", "local", "tienda fisica",
            "mandame la loqueichon", "como llego", "donde queda",
            "tienen local", "estan abiertos", "horario",
            "a que hora abren", "a que hora cierran"
        ],
        minMatch: 1,
        priority: 6
    },
    {
        intent: "PRICE_INQUIRY",
        keywords: [
            "precio", "cuanto cuesta", "a como sale", "dame luz",
            "cuanto e", "precio de", "cuanto vale", "cotizame",
            "a como lo tiene", "cuanto es", "me sale en cuanto",
            "cuanto por", "que precio tiene", "valor"
        ],
        minMatch: 1,
        priority: 5
    },
    {
        intent: "CATALOG_INQUIRY",
        keywords: [
            "catalogo", "que venden", "productos", "menu", "lista",
            "que tienen", "cuales son los articulo", "ver productos",
            "mostrar productos", "que hay", "que ofrecen",
            "servicios", "que servicios", "carta"
        ],
        minMatch: 1,
        priority: 5
    },
    // LOW PRIORITY: Greeting should only match if nothing else does
    {
        intent: "GREETING",
        keywords: [
            "klk", "k l k", "saludos", "buenas", "hola", "dime a ver",
            "que lo que", "que to", "tato", "como tu ta", "saludo",
            "buenas tardes", "buenas noches", "buenos dias",
            "buen dia", "hey", "alo", "ey"
        ],
        minMatch: 1,
        priority: 1 // Lowest priority
    }
];

// Sort rules by priority (highest first)
const SORTED_RULES = [...RULES].sort((a, b) => b.priority - a.priority);

export function detectIntent(message: string): Intent {
    const normalized = message.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .trim();

    // Skip very short messages that could be ambiguous
    if (normalized.length < 2) {
        return "UNKNOWN";
    }

    // Check rules in priority order
    for (const rule of SORTED_RULES) {
        for (const keyword of rule.keywords) {
            if (normalized.includes(keyword)) {
                return rule.intent;
            }
        }
    }

    return "UNKNOWN";
}

/**
 * Returns confidence score (0-1) based on how many keywords matched
 */
export function detectIntentWithConfidence(message: string): { intent: Intent; confidence: number; matchedKeywords: string[] } {
    const normalized = message.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .trim();

    if (normalized.length < 2) {
        return { intent: "UNKNOWN", confidence: 0, matchedKeywords: [] };
    }

    let bestMatch: { intent: Intent; matchCount: number; keywords: string[] } = {
        intent: "UNKNOWN",
        matchCount: 0,
        keywords: []
    };

    for (const rule of SORTED_RULES) {
        const matchedKeywords = rule.keywords.filter(kw => normalized.includes(kw));

        if (matchedKeywords.length > 0) {
            // Prioritize by: 1) rule priority, 2) number of matches
            const score = (rule.priority * 10) + matchedKeywords.length;
            const currentScore = (SORTED_RULES.find(r => r.intent === bestMatch.intent)?.priority || 0) * 10 + bestMatch.matchCount;

            if (score > currentScore) {
                bestMatch = {
                    intent: rule.intent,
                    matchCount: matchedKeywords.length,
                    keywords: matchedKeywords
                };
            }
        }
    }

    // Calculate confidence based on match count and keyword coverage
    const confidence = bestMatch.matchCount > 0
        ? Math.min(0.5 + (bestMatch.matchCount * 0.15), 1.0)
        : 0;

    return {
        intent: bestMatch.intent,
        confidence,
        matchedKeywords: bestMatch.keywords
    };
}
