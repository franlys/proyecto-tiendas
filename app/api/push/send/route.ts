/**
 * POST /api/push/send
 * Body: { shopId, title, body, tag?, data? }
 * Sends a Web Push notification to all subscribed devices for the shop.
 */

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendPushToShop } from "@/lib/push-notify";

export async function POST(request: NextRequest) {
    try {
        const { shopId, title, body, tag, icon, data } = await request.json();

        if (!shopId || !title || !body) {
            return NextResponse.json(
                { error: "Missing required fields: shopId, title, body" },
                { status: 400 }
            );
        }

        const db = adminDb();
        if (!db) {
            return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
        }

        await sendPushToShop(db, shopId, { title, body, tag, icon, data });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[Push Send] Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
