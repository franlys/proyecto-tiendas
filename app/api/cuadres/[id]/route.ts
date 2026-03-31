import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { Cuadre, CuadreEntry, CuadreExpense, CuadreStatus } from "@/lib/types/cuadre.types";
import { calcCuadreTotals } from "@/lib/types/cuadre.types";

// GET /api/cuadres/[id]?shopId=xxx
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shopId = new URL(request.url).searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });

  const db = adminDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const snap = await db.collection("shops").doc(shopId).collection("cuadres").doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: "Cuadre not found" }, { status: 404 });

  return NextResponse.json({ cuadre: { id: snap.id, ...snap.data() } as Cuadre });
}

// PATCH /api/cuadres/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = adminDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  try {
    const body = await request.json();
    const { shopId, action, entries, expenses, notes, rejectionReason, approvedBy } = body;

    if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });

    const ref = db.collection("shops").doc(shopId).collection("cuadres").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: "Cuadre not found" }, { status: 404 });

    const now = new Date().toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = { updatedAt: now };

    if (action === "submit") {
      updates.status = "submitted" as CuadreStatus;
      updates.submittedAt = now;
    } else if (action === "approve") {
      updates.status = "approved" as CuadreStatus;
      updates.approvedAt = now;
      updates.approvedBy = approvedBy || "Dueño";
    } else if (action === "reject") {
      updates.status = "rejected" as CuadreStatus;
      updates.rejectionReason = rejectionReason || "";
    } else {
      if (entries !== undefined) updates.entries = entries;
      if (expenses !== undefined) updates.expenses = expenses;
      if (notes !== undefined) updates.notes = notes;

      if (entries !== undefined || expenses !== undefined) {
        const current = snap.data() as Cuadre;
        const e = entries ?? current.entries;
        const ex = expenses ?? current.expenses;
        const totals = calcCuadreTotals(e as CuadreEntry[], ex as CuadreExpense[]);
        Object.assign(updates, totals);
      }
    }

    await ref.update(updates);
    const updated = await ref.get();
    return NextResponse.json({ cuadre: { id: updated.id, ...updated.data() } as Cuadre });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update cuadre" }, { status: 500 });
  }
}

// DELETE /api/cuadres/[id]?shopId=xxx  (solo borradores)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shopId = new URL(request.url).searchParams.get("shopId");
  if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });

  const db = adminDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  const ref = db.collection("shops").doc(shopId).collection("cuadres").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = snap.data() as Cuadre;
  if (data.status !== "draft") {
    return NextResponse.json({ error: "Solo se pueden eliminar borradores" }, { status: 403 });
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
