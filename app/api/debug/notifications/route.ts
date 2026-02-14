/**
 * Debug endpoint to check notification configuration
 * GET /api/debug/notifications?shopId=xxx
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import {
    isEvolutionConfigured,
    getInstanceName,
    getConnectionState,
} from "@/lib/evolution";
import { getAllNotificationPhones } from "@/lib/handlers/whatsapp-order.handler";
import { formatPhoneForWhatsApp } from "@/lib/utils";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) {
        return NextResponse.json(
            { error: "Missing shopId parameter" },
            { status: 400 }
        );
    }

    const diagnostics: any = {
        shopId,
        timestamp: new Date().toISOString(),
        evolutionApi: {
            configured: false,
            instanceName: null,
            connectionState: null,
        },
        shopConfig: {
            found: false,
            name: null,
            ownerNotificationPhone: null,
            contactPhone: null,
        },
        whatsappBotConfig: {
            found: false,
            ownerNotificationPhone: null,
            staffPhones: [],
        },
        allNotificationPhones: [],
        errors: [],
    };

    try {
        // 1. Check Evolution API Configuration
        diagnostics.evolutionApi.configured = isEvolutionConfigured();

        if (diagnostics.evolutionApi.configured) {
            const instanceName = getInstanceName(shopId);
            diagnostics.evolutionApi.instanceName = instanceName;

            try {
                const state = await getConnectionState(instanceName);
                diagnostics.evolutionApi.connectionState = state;
            } catch (e: any) {
                diagnostics.evolutionApi.connectionState = "error";
                diagnostics.errors.push(`Evolution instance error: ${e.message}`);
            }
        } else {
            diagnostics.errors.push("Evolution API not configured (missing EVOLUTION_API_URL or EVOLUTION_API_KEY)");
        }

        // 2. Check Shop Document
        const db = adminDb();
        if (db) {
            const shopDoc = await db.collection("shops").doc(shopId).get();

            if (shopDoc.exists) {
                const data = shopDoc.data();
                diagnostics.shopConfig.found = true;
                diagnostics.shopConfig.name = data?.name;
                diagnostics.shopConfig.ownerNotificationPhone = data?.ownerNotificationPhone || null;
                diagnostics.shopConfig.contactPhone = data?.contact?.phone || null;

                // Format for display
                if (data?.ownerNotificationPhone) {
                    diagnostics.shopConfig.ownerNotificationPhoneFormatted = formatPhoneForWhatsApp(data.ownerNotificationPhone);
                }
            } else {
                diagnostics.errors.push(`Shop document not found: ${shopId}`);
            }

            // 3. Check WhatsApp Bot Config
            const configDoc = await db
                .collection("shops")
                .doc(shopId)
                .collection("whatsapp_bot")
                .doc("config")
                .get();

            if (configDoc.exists) {
                const data = configDoc.data();
                diagnostics.whatsappBotConfig.found = true;
                diagnostics.whatsappBotConfig.ownerNotificationPhone = data?.ownerNotificationPhone || null;
                diagnostics.whatsappBotConfig.staffPhones = data?.staffNotificationPhones || [];
            } else {
                diagnostics.errors.push("whatsapp_bot/config document not found - notifications may not work");
            }

            // 4. Get all notification phones using the actual function
            const phones = await getAllNotificationPhones(shopId);
            diagnostics.allNotificationPhones = phones;

            if (phones.length === 0) {
                diagnostics.errors.push("No notification phones configured! Please set ownerNotificationPhone in shop settings.");
            }
        } else {
            diagnostics.errors.push("Database connection failed");
        }

        // Summary
        diagnostics.summary = {
            canSendNotifications:
                diagnostics.evolutionApi.configured &&
                diagnostics.evolutionApi.connectionState?.state === "open" &&
                diagnostics.allNotificationPhones.length > 0,
            issues: diagnostics.errors,
        };

        return NextResponse.json(diagnostics);
    } catch (error: any) {
        return NextResponse.json(
            {
                error: "Diagnostic failed",
                details: error.message,
                diagnostics,
            },
            { status: 500 }
        );
    }
}
