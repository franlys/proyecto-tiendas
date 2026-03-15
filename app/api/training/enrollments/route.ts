import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// GET /api/training/enrollments?shopId=xxx
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");
    if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    try {
        const snap = await db
            .collection("shops").doc(shopId)
            .collection("trainingEnrollments")
            .orderBy("createdAt", "desc")
            .get();

        const enrollments = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ enrollments });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/training/enrollments
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { shopId, ...data } = body;

    if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });
    if (!data.customerName || !data.customerPhone) {
        return NextResponse.json({ error: "customerName and customerPhone are required" }, { status: 400 });
    }
    if (!data.packageId || !data.preferredDays?.length || !data.startDate || !data.preferredTime) {
        return NextResponse.json(
            { error: "packageId, preferredDays, startDate, and preferredTime are required" },
            { status: 400 }
        );
    }

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    try {
        const now = new Date().toISOString();
        const enrollment = { ...data, shopId, status: "pending", createdAt: now, updatedAt: now };
        const ref = await db.collection("shops").doc(shopId).collection("trainingEnrollments").add(enrollment);
        return NextResponse.json({ enrollment: { id: ref.id, ...enrollment } }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
