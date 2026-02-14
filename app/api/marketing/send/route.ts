import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendTextMessage, sendImage, sendDocument, getInstanceName, isEvolutionConfigured } from "@/lib/evolution";
import { formatPhoneForWhatsApp } from "@/lib/utils";

interface SendRequest {
    shopId: string;
    phone: string;
    message: string;
    mediaType?: "none" | "image" | "video" | "document";
    mediaUrl?: string;
    mediaName?: string;
}

/**
 * POST /api/marketing/send
 * Send a single marketing message to a phone number
 */
export async function POST(request: NextRequest) {
    if (!isEvolutionConfigured()) {
        return NextResponse.json(
            { error: "WhatsApp bot not configured" },
            { status: 503 }
        );
    }

    try {
        const body: SendRequest = await request.json();
        const { shopId, phone, message, mediaType = "none", mediaUrl, mediaName } = body;

        if (!shopId || !phone || !message) {
            return NextResponse.json(
                { error: "shopId, phone, and message are required" },
                { status: 400 }
            );
        }

        const instanceName = getInstanceName(shopId);

        // Get shop URL for message substitution
        const db = adminDb();
        let shopUrl = `https://tu-tienda.com/${shopId}`;
        if (db) {
            const shopDoc = await db.collection("shops").doc(shopId).get();
            if (shopDoc.exists) {
                const shopData = shopDoc.data();
                shopUrl = shopData?.customDomain || `https://tu-tienda.com/${shopId}`;
            }
        }

        // Replace {shopUrl} placeholder in message
        const finalMessage = message.replace(/{shopUrl}/g, shopUrl);

        // Format phone number with country code
        const formattedPhone = formatPhoneForWhatsApp(phone);

        let result;

        switch (mediaType) {
            case "image":
                if (mediaUrl) {
                    result = await sendImage(instanceName, formattedPhone, mediaUrl, finalMessage);
                } else {
                    result = await sendTextMessage(instanceName, formattedPhone, finalMessage);
                }
                break;

            case "document":
                if (mediaUrl && mediaName) {
                    result = await sendDocument(instanceName, formattedPhone, mediaUrl, mediaName, finalMessage);
                } else {
                    result = await sendTextMessage(instanceName, formattedPhone, finalMessage);
                }
                break;

            case "video":
                // For now, treat video same as image (Evolution API handles both with sendMedia)
                if (mediaUrl) {
                    result = await sendImage(instanceName, formattedPhone, mediaUrl, finalMessage);
                } else {
                    result = await sendTextMessage(instanceName, formattedPhone, finalMessage);
                }
                break;

            default:
                result = await sendTextMessage(instanceName, formattedPhone, finalMessage);
        }

        return NextResponse.json({
            success: true,
            messageId: result.key?.id,
            status: result.status,
        });

    } catch (error: any) {
        console.error("[Marketing] Send error:", error.message);
        return NextResponse.json(
            { error: error.message || "Failed to send message" },
            { status: 500 }
        );
    }
}
