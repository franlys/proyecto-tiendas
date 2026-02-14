import { NextResponse } from "next/server";
import { getInstanceName } from "@/lib/evolution";
import { getAllNotificationPhones } from "@/lib/handlers/whatsapp-order.handler";

/**
 * Test sending endpoint
 *
 * Usage:
 * - GET /api/debug/test-send?phone=1234567890 - Send test to specific phone
 * - GET /api/debug/test-send?shopId=xxx&testOwner=true - Send test to all notification phones for a shop
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const shopId = searchParams.get("shopId");
    const testOwner = searchParams.get("testOwner");

    try {
        const { sendTextMessage } = await import("@/lib/evolution");

        // If testing owner notifications
        if (shopId && testOwner === "true") {
            const instanceName = getInstanceName(shopId);
            const phones = await getAllNotificationPhones(shopId);

            if (phones.length === 0) {
                return NextResponse.json({
                    error: "No notification phones configured for this shop",
                    shopId,
                    hint: "Set ownerNotificationPhone in shop settings or whatsapp_bot/config"
                }, { status: 400 });
            }

            const results = await Promise.all(
                phones.map(async (p) => {
                    try {
                        console.log(`[DEBUG] Sending test to ${p.name} (${p.role}): ${p.phone}`);
                        const result = await sendTextMessage(
                            instanceName,
                            p.phone,
                            `🔔 *PRUEBA DE NOTIFICACIÓN*\n\nHola ${p.name}!\n\nEste es un mensaje de prueba para verificar que las notificaciones de pedidos funcionan correctamente.\n\n✅ Si lees esto, las notificaciones están configuradas correctamente.`
                        );
                        return { phone: p.phone, name: p.name, role: p.role, success: true, messageId: result.key?.id };
                    } catch (e: any) {
                        return { phone: p.phone, name: p.name, role: p.role, success: false, error: e.message };
                    }
                })
            );

            const successCount = results.filter(r => r.success).length;

            return NextResponse.json({
                success: successCount > 0,
                shopId,
                instance: instanceName,
                totalPhones: phones.length,
                sent: successCount,
                failed: phones.length - successCount,
                results
            });
        }

        // Original behavior: send to specific phone
        if (!phone) {
            return NextResponse.json({
                error: "Missing parameters",
                usage: {
                    specific: "/api/debug/test-send?phone=1234567890",
                    owner: "/api/debug/test-send?shopId=your-shop-id&testOwner=true"
                }
            }, { status: 400 });
        }

        // Default to first shop instance (can be improved)
        const instance = shopId ? getInstanceName(shopId) : "shop_surprise_gifts_v2";
        console.log(`[DEBUG] Attempting to send test message to ${phone} via ${instance}`);

        const result = await sendTextMessage(instance, phone, "🔔 *PRUEBA DE CONEXIÓN*\n\nSi lees esto, el servidor puede ENVIAR mensajes (Salida OK).");

        return NextResponse.json({
            success: true,
            instance,
            target: phone,
            result
        });
    } catch (error: any) {
        return NextResponse.json({
            error: "Failed to send message",
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
