/**
 * API Route para enviar notificaciones de inscripción de entrenamiento via WhatsApp
 *
 * POST /api/training/notify
 * Body: { shopId, enrollmentId, customerPhone, customerName, packageName, status }
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendTextMessage, isEvolutionConfigured, getInstanceName } from "@/lib/evolution";
import { formatPhoneForWhatsApp } from "@/lib/utils";

const STATUS_MESSAGES: Record<string, (name: string, packageName: string) => string> = {
    pending: (name, pkg) =>
        `Hola ${name} 👋\n\n📋 Hemos recibido tu inscripción al plan *${pkg}*.\n\nEn breve nos ponemos en contacto contigo para confirmar los detalles.\n\n¡Gracias por tu interés! 💪`,

    active: (name, pkg) =>
        `Hola ${name} 👋\n\n✅ Tu inscripción al plan *${pkg}* ha sido *CONFIRMADA*.\n\n¡Bienvenido! Estamos listos para empezar contigo. 💪\n\nCualquier duda, escríbenos.`,

    completed: (name, pkg) =>
        `Hola ${name} 👋\n\n🎉 Has completado el plan *${pkg}*.\n\n¡Felicidades por tu dedicación! ⭐\n\nEsperamos seguir acompañándote en tu camino. 💪`,

    cancelled: (name, pkg) =>
        `Hola ${name} 👋\n\n❌ Tu inscripción al plan *${pkg}* ha sido *CANCELADA*.\n\nSi tienes alguna pregunta o deseas reagendarte, no dudes en contactarnos.\n\nDisculpa las molestias.`,

    contact: (name, pkg) =>
        `Hola ${name} 👋\n\nTe contactamos sobre tu inscripción al plan *${pkg}*.\n\n¿Tienes alguna pregunta? Estamos para ayudarte. 💪`,
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { shopId, enrollmentId, customerPhone, customerName, packageName, status = "contact" } = body;

        if (!shopId || !customerPhone || !customerName) {
            return NextResponse.json(
                { error: "Missing required fields: shopId, customerPhone, customerName" },
                { status: 400 }
            );
        }

        const messageGenerator = STATUS_MESSAGES[status];
        if (!messageGenerator) {
            return NextResponse.json({ error: `Unknown status: ${status}` }, { status: 400 });
        }

        const message = messageGenerator(customerName, packageName || "entrenamiento");

        // Fallback wa.me URL (used if Evolution not configured)
        const cleanPhone = formatPhoneForWhatsApp(customerPhone);
        const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

        if (!isEvolutionConfigured()) {
            return NextResponse.json({
                success: false,
                needsSetup: true,
                error: "Bot de WhatsApp no configurado.",
                whatsappUrl: waUrl,
            });
        }

        const db = adminDb();
        let shopSlug = shopId;

        if (db) {
            const shopDoc = await db.collection("shops").doc(shopId).get();
            if (shopDoc.exists) {
                shopSlug = shopDoc.data()?.slug || shopId;
            }
        }

        const instanceName = getInstanceName(shopSlug);
        const result = await sendTextMessage(instanceName, cleanPhone, message);

        if (db && enrollmentId) {
            await db.collection("shops").doc(shopId).collection("trainingNotifications").add({
                enrollmentId,
                customerPhone: cleanPhone,
                customerName,
                packageName,
                status,
                message,
                sentAt: new Date().toISOString(),
                method: "evolution_api",
                success: true,
                messageId: result.key?.id,
            });
        }

        return NextResponse.json({ success: true, method: "evolution_api", messageId: result.key?.id });

    } catch (error: any) {
        console.error("[Training Notify] Error:", error);
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
    }
}
