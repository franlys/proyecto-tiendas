/**
 * API Route para enviar notificaciones de estado de pedido via WhatsApp
 *
 * POST /api/orders/notify
 * Body: { shopId, orderId, orderNumber, customerPhone, customerName, status, total }
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendTextMessage, sendDocument, isEvolutionConfigured, getInstanceName } from "@/lib/evolution";
import { formatPhoneForWhatsApp } from "@/lib/utils";

interface NotifyRequest {
    shopId: string;
    orderId: string;
    orderNumber: string;
    customerPhone: string;
    customerName: string;
    status: string;
    total: number;
}

// Status messages in Spanish
const STATUS_MESSAGES: Record<string, (name: string, orderNum: string, total: number) => string> = {
    confirmed: (name, orderNum, total) =>
        `Hola ${name} 👋\n\n✅ Tu pedido *#${orderNum}* ha sido *CONFIRMADO*.\n\nEstamos preparando tu orden.\n💰 Total: $${total.toLocaleString()}\n\n¡Gracias por tu compra!`,

    preparing: (name, orderNum, total) =>
        `Hola ${name} 👋\n\n📦 Tu pedido *#${orderNum}* está siendo *PREPARADO*.\n\nPronto estará listo.\n💰 Total: $${total.toLocaleString()}`,

    dispatched: (name, orderNum, total) =>
        `Hola ${name} 👋\n\n🚚 Tu pedido *#${orderNum}* ha sido *DESPACHADO*.\n\n¡Va en camino!\n💰 Total: $${total.toLocaleString()}\n\n📍 Por favor comparte tu ubicación si necesitas entrega a domicilio.`,

    delivered: (name, orderNum, total) =>
        `Hola ${name} 👋\n\n🎉 Tu pedido *#${orderNum}* ha sido *ENTREGADO*.\n\n¡Gracias por tu compra!\n💰 Total: $${total.toLocaleString()}\n\n⭐ Esperamos que disfrutes tu pedido. ¡Vuelve pronto!`,

    cancelled: (name, orderNum, total) =>
        `Hola ${name} 👋\n\n❌ Tu pedido *#${orderNum}* ha sido *CANCELADO*.\n\nSi tienes alguna pregunta, no dudes en contactarnos.\n\nDisculpa las molestias.`,

    payment_reminder: (name, orderNum, total) =>
        `Hola ${name} 👋\n\n💳 *RECORDATORIO DE PAGO*\n\nTu pedido *#${orderNum}* está pendiente de pago.\n\n💰 *Total a pagar:* $${total.toLocaleString()}\n\n¿Tienes alguna duda sobre el pago? Estamos para ayudarte. 🙏`,

    payment_confirmed: (name, orderNum, total) =>
        `Hola ${name} 👋\n\n✅ *PAGO CONFIRMADO*\n\nHemos recibido tu pago de *$${total.toLocaleString()}* para el pedido *#${orderNum}*.\n\n¡Muchas gracias! 🙏`,

    ready_pickup: (name, orderNum, total) =>
        `Hola ${name} 👋\n\nTu pedido *#${orderNum}* está *LISTO* ✅.\n\nPuedes pasar a recogerlo cuando gustes.\n\n💰 Total a pagar: $${total.toLocaleString()}`,

    on_way_location: (name, orderNum, total) =>
        `Hola ${name} 👋\n\nTu pedido *#${orderNum}* va en camino 🛵.\n\nPor favor, compártenos tu ubicación actual para facilitar la entrega 📍.\n\n💰 Total: $${total.toLocaleString()}`,
};

export async function POST(request: NextRequest) {
    try {
        const body: NotifyRequest = await request.json();
        const { shopId, orderId, orderNumber, customerPhone, customerName, status, total } = body;

        // Validate required fields
        if (!shopId || !customerPhone || !status) {
            return NextResponse.json(
                { error: "Missing required fields: shopId, customerPhone, status" },
                { status: 400 }
            );
        }

        // Check if Evolution API is configured
        if (!isEvolutionConfigured()) {
            console.warn("[Notify] Evolution API not configured - returning error");
            return NextResponse.json(
                {
                    success: false,
                    needsSetup: true,
                    error: "Bot de WhatsApp no configurado. Configura EVOLUTION_API_URL y EVOLUTION_API_KEY en las variables de entorno.",
                    // Include fallback URL only for manual option
                    whatsappUrl: generateWhatsAppUrl(customerPhone, customerName, orderNumber, status, total)
                },
                { status: 200 }
            );
        }

        // Get the message generator for this status
        const messageGenerator = STATUS_MESSAGES[status];
        if (!messageGenerator) {
            return NextResponse.json(
                { error: `Unknown status: ${status}` },
                { status: 400 }
            );
        }

        // Generate message
        const message = messageGenerator(customerName || "Cliente", orderNumber || orderId, total || 0);

        // Send via Evolution API
        try {
            // Get order details to check for invoiceUrl and shop slug
            const db = adminDb();
            let invoiceUrl = null;
            let shopSlug = shopId; // Fallback to shopId if slug not found

            if (db) {
                // Fetch shop document for slug
                const shopDoc = await db.collection("shops").doc(shopId).get();
                if (shopDoc.exists) {
                    shopSlug = shopDoc.data()?.slug || shopId;
                }

                // Fetch order document for invoice
                const orderDoc = await db.collection("shops").doc(shopId).collection("orders").doc(orderId).get();
                if (orderDoc.exists) {
                    invoiceUrl = orderDoc.data()?.invoiceUrl;
                }
            }

            // Get instance name for this shop using PRECISELY the slug (as in confirm/route.ts)
            const instanceName = getInstanceName(shopSlug);

            // Generate message
            let message = messageGenerator(customerName || "Cliente", orderNumber || orderId, total || 0);

            // Add PDF link fallback if available
            if (invoiceUrl) {
                message += `\n\n📄 *Factura Digital:*\n${invoiceUrl}`;
            }

            // Format phone number
            const formattedPhone = formatPhoneForWhatsApp(customerPhone);

            const result = await sendTextMessage(instanceName, formattedPhone, message);

            // Send PDF if available
            if (invoiceUrl) {
                try {
                    await sendDocument(
                        instanceName,
                        formattedPhone,
                        invoiceUrl,
                        `Factura_${orderNumber || orderId}.pdf`,
                        `Factura actualizada de tu pedido #${orderNumber || orderId}`
                    );
                } catch (pdfError) {
                    console.error("[Notify] Error sending PDF document:", pdfError);
                }
            }

            // Log notification to Firestore
            if (db) {
                await db.collection("shops").doc(shopId).collection("orderNotifications").add({
                    orderId,
                    orderNumber,
                    customerPhone: formattedPhone,
                    status,
                    message,
                    sentAt: new Date().toISOString(),
                    method: "evolution_api",
                    success: true,
                    messageId: result.key?.id
                });
            }

            return NextResponse.json({
                success: true,
                method: "evolution_api",
                messageId: result.key?.id
            });
        } catch (evolutionError: any) {
            console.error("[Notify] Evolution API error:", evolutionError);

            // Return fallback URL
            return NextResponse.json({
                success: false,
                method: "fallback",
                error: evolutionError.message,
                whatsappUrl: generateWhatsAppUrl(customerPhone, customerName, orderNumber, status, total)
            });
        }

    } catch (error: any) {
        console.error("[Notify] Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}

function generateWhatsAppUrl(
    phone: string,
    name: string,
    orderNumber: string,
    status: string,
    total: number
): string {
    const messageGenerator = STATUS_MESSAGES[status];
    if (!messageGenerator) return "";

    const message = messageGenerator(name || "Cliente", orderNumber, total || 0);
    const cleanPhone = formatPhoneForWhatsApp(phone);

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
