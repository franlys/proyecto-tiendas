import { NextRequest, NextResponse } from "next/server";
import { escalatePendingAssignments } from "@/lib/services/order-assignment.service";

/**
 * Cron Job para escalar asignaciones de pedidos pendientes.
 * Se ejecuta cada minuto para verificar timeouts.
 *
 * Vercel Cron: schedule = "* * * * *"
 */
export async function GET(request: NextRequest) {
  // Verificar autenticación del cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // En desarrollo, permitir sin auth
  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Cron] Unauthorized request to order-escalation");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  console.log("[Cron] Starting order escalation check...");

  try {
    const result = await escalatePendingAssignments();

    console.log(
      `[Cron] Order escalation complete - Escalated: ${result.escalated}, Expired: ${result.expired}`
    );

    return NextResponse.json({
      success: true,
      escalated: result.escalated,
      expired: result.expired,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Order escalation error:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: String(error) },
      { status: 500 }
    );
  }
}

// Configuración para Vercel
export const runtime = "nodejs";
export const maxDuration = 60; // 60 segundos máximo
