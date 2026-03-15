import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// GET /api/training/packages?shopId=xxx
export async function GET(request: NextRequest) {
    const shopId = new URL(request.url).searchParams.get("shopId");
    if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    try {
        const snap = await db
            .collection("shops").doc(shopId)
            .collection("training-packages")
            .orderBy("sortOrder", "asc")
            .get();

        const packages = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ packages });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/training/packages
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { shopId, ...data } = body;

    if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });
    if (!data.name || data.sessionsPerWeek == null || data.price == null) {
        return NextResponse.json({ error: "name, sessionsPerWeek, and price are required" }, { status: 400 });
    }

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    try {
        const now = new Date().toISOString();
        const pkg = { ...data, isActive: data.isActive ?? true, createdAt: now, updatedAt: now };
        const ref = await db.collection("shops").doc(shopId).collection("training-packages").add(pkg);
        return NextResponse.json({ package: { id: ref.id, ...pkg } }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
