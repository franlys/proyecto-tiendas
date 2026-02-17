/**
 * API de diagnóstico para verificar el estado de WhatsApp/Evolution API
 *
 * GET /api/debug/whatsapp-status?shopId=xxx
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { isEvolutionConfigured, getInstanceName, getInstance, getConnectionState, sendTextMessage } from "@/lib/evolution";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");
    const testSend = searchParams.get("testSend") === "true";
    const testPhone = searchParams.get("testPhone");

    const status: Record<string, any> = {
        timestamp: new Date().toISOString(),
        shopId,
    };

    // 1. Verificar variables de entorno
    status.envVariables = {
        EVOLUTION_API_URL: !!process.env.EVOLUTION_API_URL,
        EVOLUTION_API_KEY: !!process.env.EVOLUTION_API_KEY,
        evolutionConfigured: isEvolutionConfigured(),
    };

    if (!isEvolutionConfigured()) {
        status.error = "Evolution API no está configurada. Configura EVOLUTION_API_URL y EVOLUTION_API_KEY en .env";
        return NextResponse.json(status);
    }

    // 2. Si hay shopId, verificar configuración de la tienda
    if (shopId) {
        const db = adminDb();
        if (db) {
            try {
                // Verificar configuración del bot
                const configDoc = await db
                    .collection("shops")
                    .doc(shopId)
                    .collection("whatsapp_bot")
                    .doc("config")
                    .get();

                if (configDoc.exists) {
                    const data = configDoc.data();
                    status.shopConfig = {
                        botEnabled: data?.enabled || false,
                        ownerNotificationPhone: data?.ownerNotificationPhone ? "✅ Configurado" : "❌ No configurado",
                        ownerPhoneValue: data?.ownerNotificationPhone || null,
                        staffCount: data?.staffNotificationPhones?.filter((s: any) => s.enabled)?.length || 0,
                    };
                } else {
                    status.shopConfig = {
                        error: "No existe configuración del bot para esta tienda",
                    };
                }

                // Verificar si hay ownerNotificationPhone en el documento de la tienda
                const shopDoc = await db.collection("shops").doc(shopId).get();
                if (shopDoc.exists) {
                    const shopData = shopDoc.data();
                    status.shopDocument = {
                        ownerNotificationPhone: shopData?.ownerNotificationPhone ? "✅ Configurado" : "❌ No configurado",
                        contactPhone: shopData?.contact?.phone ? "✅ Configurado" : "❌ No configurado",
                    };
                }
            } catch (error: any) {
                status.shopConfigError = error.message;
            }
        }

        // 3. Verificar estado de la instancia de Evolution
        const instanceName = getInstanceName(shopId);
        status.instanceName = instanceName;

        try {
            const [instanceInfo, connectionState] = await Promise.all([
                getInstance(instanceName).catch(() => null),
                getConnectionState(instanceName).catch(() => null),
            ]);
            status.instanceStatus = {
                connected: connectionState?.state === "open",
                state: connectionState?.state || "unknown",
                instanceExists: !!instanceInfo,
                profileName: instanceInfo?.profileName,
            };
        } catch (error: any) {
            status.instanceStatus = {
                error: error.message,
                connected: false,
            };
        }
    }

    // 4. Prueba de envío opcional
    if (testSend && testPhone) {
        try {
            const instanceName = shopId ? getInstanceName(shopId) : "default";
            const result = await sendTextMessage(
                instanceName,
                testPhone,
                `🧪 Mensaje de prueba desde el sistema\n\nFecha: ${new Date().toLocaleString("es-DO")}\n\nSi recibes este mensaje, el bot está funcionando correctamente.`
            );
            status.testResult = {
                success: true,
                messageId: result.key?.id,
            };
        } catch (error: any) {
            status.testResult = {
                success: false,
                error: error.message,
            };
        }
    }

    return NextResponse.json(status);
}
