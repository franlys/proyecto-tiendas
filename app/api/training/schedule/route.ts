import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// GET /api/training/schedule?shopId=xxx
export async function GET(request: NextRequest) {
    const shopId = new URL(request.url).searchParams.get("shopId");
    if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    try {
        const snap = await db
            .collection("shops").doc(shopId)
            .collection("settings").doc("trainingSchedule")
            .get();

        if (!snap.exists) {
            return NextResponse.json({ schedule: null });
        }
        return NextResponse.json({ schedule: snap.data() });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/training/schedule
export async function PUT(request: NextRequest) {
    const body = await request.json();
    const { shopId, availableDays, timeSlots } = body;

    if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    try {
        const ref = db.collection("shops").doc(shopId).collection("settings").doc("trainingSchedule");
        const data = { availableDays: availableDays || [], timeSlots: timeSlots || [], updatedAt: new Date().toISOString() };
        await ref.set(data, { merge: true });
        return NextResponse.json({ schedule: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
