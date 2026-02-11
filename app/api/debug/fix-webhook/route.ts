import { NextResponse } from "next/server";
import { getInstanceName } from "@/lib/evolution";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const shopSlug = searchParams.get("slug") || "surprise-gifts";
    const instanceName = getInstanceName(shopSlug);

    const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
    const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
    // This is the SINGLE valid webhook URL
    const WEBHOOK_URL = "https://linko-app-pied.vercel.app/api/whatsapp/webhook";

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
        return NextResponse.json({ error: "Missing Env Vars" }, { status: 500 });
    }

    try {
        console.log(`[FIX] Setting webhook for ${instanceName} to ${WEBHOOK_URL} (webhook_by_events: FALSE)`);

        const url = `${EVOLUTION_API_URL}/webhook/set/${instanceName}`;
        const body = {
            url: WEBHOOK_URL,
            webhook_by_events: false, // <--- THE CRITICAL FIX
            webhook_base64: true,
            events: [
                "MESSAGES_UPSERT",
                "MESSAGES_UPDATE",
                "CONNECTION_UPDATE",
                "QRCODE_UPDATED"
            ]
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                apikey: EVOLUTION_API_KEY
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        return NextResponse.json({
            success: true,
            instance: instanceName,
            target_url: WEBHOOK_URL,
            api_response: data
        });

    } catch (error: any) {
        return NextResponse.json({
            error: "Failed to fix webhook",
            details: error.message
        }, { status: 500 });
    }
}
