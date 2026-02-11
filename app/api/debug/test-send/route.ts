import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get("phone");
    const instance = "shop_surprise_gifts_v2";

    if (!phone) {
        return NextResponse.json({ error: "Missing phone param (?phone=...)" }, { status: 400 });
    }

    try {
        const { sendTextMessage } = await import("@/lib/evolution");
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
