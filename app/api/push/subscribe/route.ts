import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

interface PushSubscriptionJSON {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}

export async function POST(req: NextRequest) {
    try {
        const { shopId, subscription, userId } = await req.json();

        if (!shopId || !subscription) {
            return NextResponse.json(
                { error: "Missing shopId or subscription" },
                { status: 400 }
            );
        }

        const db = adminDb();
        if (!db) {
            return NextResponse.json(
                { error: "Database not available" },
                { status: 500 }
            );
        }

        const subscriptionData: PushSubscriptionJSON = subscription;

        // Use endpoint as document ID (hashed)
        const endpointHash = Buffer.from(subscriptionData.endpoint)
            .toString("base64")
            .replace(/[/+=]/g, "_")
            .slice(0, 50);

        await db
            .collection("shops")
            .doc(shopId)
            .collection("pushSubscriptions")
            .doc(endpointHash)
            .set({
                endpoint: subscriptionData.endpoint,
                keys: subscriptionData.keys,
                userId: userId || null,
                userAgent: req.headers.get("user-agent") || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

        console.log(`[Push] Subscription saved for shop ${shopId}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Push] Error saving subscription:", error);
        return NextResponse.json(
            { error: "Failed to save subscription" },
            { status: 500 }
        );
    }
}
