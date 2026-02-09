import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
    try {
        const { shopId, endpoint } = await req.json();

        if (!shopId || !endpoint) {
            return NextResponse.json(
                { error: "Missing shopId or endpoint" },
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

        // Create same hash as used in subscribe
        const endpointHash = Buffer.from(endpoint)
            .toString("base64")
            .replace(/[/+=]/g, "_")
            .slice(0, 50);

        await db
            .collection("shops")
            .doc(shopId)
            .collection("pushSubscriptions")
            .doc(endpointHash)
            .delete();

        console.log(`[Push] Subscription removed for shop ${shopId}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Push] Error removing subscription:", error);
        return NextResponse.json(
            { error: "Failed to remove subscription" },
            { status: 500 }
        );
    }
}
