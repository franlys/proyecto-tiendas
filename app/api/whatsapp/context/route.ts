import { NextRequest, NextResponse } from "next/server";
import {
    createProductInquiryContext,
    createServiceInquiryContext,
    getConversationContext,
} from "@/lib/services/conversation-context.service";

/**
 * POST /api/whatsapp/context
 * Registra el contexto antes de que el cliente abra WhatsApp
 * Se llama cuando el cliente hace clic en "Contactar por WhatsApp"
 *
 * Body:
 * {
 *   shopId: string,
 *   phone: string,
 *   type: "product" | "service",
 *   itemId: string,
 *   itemName: string,
 *   customerName?: string
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shopId, phone, type, itemId, itemName, customerName } = body;

        if (!shopId || !phone || !type || !itemId || !itemName) {
            return NextResponse.json(
                { error: "Missing required fields: shopId, phone, type, itemId, itemName" },
                { status: 400 }
            );
        }

        let context;

        if (type === "product") {
            context = await createProductInquiryContext(
                shopId,
                phone,
                itemId,
                itemName,
                customerName
            );
        } else if (type === "service") {
            context = await createServiceInquiryContext(
                shopId,
                phone,
                itemId,
                itemName,
                customerName
            );
        } else {
            return NextResponse.json(
                { error: "Invalid type. Must be 'product' or 'service'" },
                { status: 400 }
            );
        }

        if (!context) {
            return NextResponse.json(
                { error: "Failed to create context" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            context,
            // Devolver el link de WhatsApp con mensaje pre-formateado
            whatsappLink: generateWhatsAppLink(phone, type, itemName),
        });
    } catch (error) {
        console.error("Error creating conversation context:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/whatsapp/context?shopId=xxx&phone=xxx
 * Obtiene el contexto actual de una conversación
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const shopId = searchParams.get("shopId");
        const phone = searchParams.get("phone");

        if (!shopId || !phone) {
            return NextResponse.json(
                { error: "shopId and phone are required" },
                { status: 400 }
            );
        }

        const context = await getConversationContext(shopId, phone);

        return NextResponse.json({
            hasContext: !!context,
            context,
        });
    } catch (error) {
        console.error("Error getting conversation context:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Genera el link de WhatsApp con mensaje pre-formateado
 */
function generateWhatsAppLink(
    businessPhone: string,
    type: "product" | "service",
    itemName: string
): string {
    const cleanPhone = businessPhone.replace(/\D/g, "");

    let message: string;
    if (type === "product") {
        message = `Hola! Me interesa el producto: *${itemName}*. ¿Podrían darme más información?`;
    } else {
        message = `Hola! Me gustaría agendar una cita para: *${itemName}*. ¿Tienen disponibilidad?`;
    }

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}
