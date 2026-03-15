import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// GET /api/repair/tickets?shopId=xxx
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    try {
        const snap = await db
            .collection("shops").doc(shopId)
            .collection("repairTickets")
            .orderBy("createdAt", "desc")
            .get();

        const tickets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ tickets });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/repair/tickets — customer submits inquiry OR admin creates ticket
export async function POST(request: NextRequest) {
    const body = await request.json();
    const { shopId, ...data } = body;

    if (!shopId) return NextResponse.json({ error: "shopId required" }, { status: 400 });
    if (!data.customerPhone || !data.issueDescription) {
        return NextResponse.json({ error: "customerPhone and issueDescription are required" }, { status: 400 });
    }

    const db = adminDb();
    if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

    try {
        const now = new Date().toISOString();
        const folio = `REP-${Date.now().toString(36).toUpperCase().slice(-5)}`;

        const ticket = {
            ...data,
            folio,
            status: data.status || "received",
            createdAt: now,
            updatedAt: now,
        };

        const ref = await db
            .collection("shops").doc(shopId)
            .collection("repairTickets")
            .add(ticket);

        return NextResponse.json({ ticket: { id: ref.id, ...ticket } }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
