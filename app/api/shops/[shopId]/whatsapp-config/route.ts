import { NextRequest, NextResponse } from "next/server";
import {
    getWhatsAppConfigWithDefaults,
    saveWhatsAppConfig,
} from "@/lib/services/whatsapp-config.service";

/**
 * GET /api/shops/[shopId]/whatsapp-config
 * Obtener configuración de WhatsApp de una tienda
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string }> }
) {
    try {
        const { shopId } = await params;

        if (!shopId) {
            return NextResponse.json(
                { error: "shopId is required" },
                { status: 400 }
            );
        }

        const { config, shop } = await getWhatsAppConfigWithDefaults(shopId);

        // Fetch current webhook status from Evolution
        // This helps debug if the webhook is actually set correctly
        let webhookStatus = null;
        let webhookStatusLog = null;

        if (shop) {
            try {
                // Check Evolution Status
                const { getInstanceName, getWebhook } = await import("@/lib/evolution");
                const instanceName = getInstanceName(shop.slug);
                webhookStatus = await getWebhook(instanceName);

                // Check Internal Firestore Log (Proof of Life)
                const { adminDb } = await import("@/lib/firebase-admin");
                const db = adminDb();
                if (db) {
                    const statusDoc = await db.collection("shops").doc(shopId).collection("whatsappConfig").doc("status").get();
                    if (statusDoc.exists) {
                        webhookStatusLog = statusDoc.data();
                    }
                }
            } catch (e) {
                console.error("Failed to fetch webhook status/logs:", e);
            }
        }

        return NextResponse.json({
            success: true,
            config,
            shop,
            webhook: webhookStatus,
            diagnostics: webhookStatusLog, // Exposed for debugging
        });
    } catch (error: any) {
        console.error("Error getting WhatsApp config:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get config" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/shops/[shopId]/whatsapp-config
 * Actualizar configuración de WhatsApp de una tienda
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string }> }
) {
    try {
        const { shopId } = await params;

        if (!shopId) {
            return NextResponse.json(
                { error: "shopId is required" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const success = await saveWhatsAppConfig(shopId, body);

        if (!success) {
            return NextResponse.json(
                { error: "Failed to save config" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Config saved successfully",
        });
    } catch (error: any) {
        console.error("Error saving WhatsApp config:", error);
        return NextResponse.json(
            { error: error.message || "Failed to save config" },
            { status: 500 }
        );
    }
}
