import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

interface RouteParams { params: Promise<{ enrollmentId: string }>; }

// PUT /api/training/enrollments/[enrollmentId]
export async function PUT(request: NextRequest, { params }: RouteParams) {
    const { enrollmentId } = await params;
    const body = await request.json();
    const { shopId, ...updates } = body;

    if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    try {
        const ref = db.collection("shops").doc(shopId).collection("trainingEnrollments").doc(enrollmentId);
        await ref.update({ ...updates, updatedAt: new Date().toISOString() });
        const snap = await ref.get();
        return NextResponse.json({ enrollment: { id: snap.id, ...snap.data() } });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/training/enrollments/[enrollmentId]?shopId=xxx
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    const { enrollmentId } = await params;
    const shopId = new URL(request.url).searchParams.get("shopId");

    if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    try {
        await db.collection("shops").doc(shopId).collection("trainingEnrollments").doc(enrollmentId).delete();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
