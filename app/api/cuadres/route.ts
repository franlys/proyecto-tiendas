import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { Cuadre, CuadreEntry, CuadreExpense } from "@/lib/types/cuadre.types";
import { calcCuadreTotals } from "@/lib/types/cuadre.types";

// GET /api/cuadres?shopId=xxx
// GET /api/cuadres?shopId=xxx&branchId=yyy
// GET /api/cuadres?shopId=xxx&employeeId=zzz
// GET /api/cuadres?shopId=xxx&status=submitted
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");
  const branchId = searchParams.get("branchId");
  const employeeId = searchParams.get("employeeId");
  const status = searchParams.get("status");

  if (!shopId) return NextResponse.json({ error: "shopId is required" }, { status: 400 });

  const db = adminDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  try {
    let q = db.collection("shops").doc(shopId).collection("cuadres")
      .orderBy("createdAt", "desc") as FirebaseFirestore.Query;

    if (branchId) q = q.where("branchId", "==", branchId);
    if (employeeId) q = q.where("employeeId", "==", employeeId);
    if (status) q = q.where("status", "==", status);

    const snap = await q.get();
    const cuadres = snap.docs.map(d => ({ id: d.id, ...d.data() } as Cuadre));
    return NextResponse.json({ cuadres });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch cuadres" }, { status: 500 });
  }
}

// POST /api/cuadres
// Body: { shopId, branchId, branchName, employeeId, employeeName, employeeRole, startDate, endDate, weekLabel, entries, expenses, notes }
export async function POST(request: NextRequest) {
  const db = adminDb();
  if (!db) return NextResponse.json({ error: "DB unavailable" }, { status: 500 });

  try {
    const body = await request.json();
    const {
      shopId, branchId, branchName,
      employeeId, employeeName, employeeRole,
      startDate, endDate, weekLabel,
      entries = [], expenses = [],
      notes,
    } = body as Partial<Cuadre>;

    if (!shopId || !branchId || !employeeId || !startDate || !endDate) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const totals = calcCuadreTotals(entries as CuadreEntry[], expenses as CuadreExpense[]);
    const now = new Date().toISOString();

    const data: Omit<Cuadre, "id"> = {
      shopId: shopId!,
      branchId: branchId!,
      branchName: branchName || "",
      employeeId: employeeId!,
      employeeName: employeeName || "",
      employeeRole,
      periodType: "weekly",
      weekLabel: weekLabel || "",
      startDate: startDate!,
      endDate: endDate!,
      entries: entries as CuadreEntry[],
      expenses: expenses as CuadreExpense[],
      ...totals,
      status: "draft",
      notes,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await db.collection("shops").doc(shopId!).collection("cuadres").add(data);
    return NextResponse.json({ cuadre: { id: ref.id, ...data } }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create cuadre" }, { status: 500 });
  }
}
