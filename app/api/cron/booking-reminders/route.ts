import { NextRequest, NextResponse } from "next/server";
import { sendDailyReminders } from "@/lib/services/booking.service";

/**
 * Cron Job para enviar recordatorios de citas del día siguiente.
 * Se ejecuta diariamente a las 7:00 AM.
 *
 * Vercel Cron: schedule = "0 7 * * *"
 */
export async function GET(request: NextRequest) {
  // Verificar autenticación del cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // En desarrollo, permitir sin auth
  if (process.env.NODE_ENV === "production" && cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Cron] Unauthorized request to booking-reminders");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  console.log("[Cron] Starting booking reminders...");

  try {
    const remindersSent = await sendDailyReminders();

    console.log(`[Cron] Booking reminders complete - Sent: ${remindersSent}`);

    return NextResponse.json({
      success: true,
      remindersSent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Booking reminders error:", error);
    return NextResponse.json(
      { error: "Cron job failed", details: String(error) },
      { status: 500 }
    );
  }
}

// Configuración para Vercel
export const runtime = "nodejs";
export const maxDuration = 120; // 2 minutos máximo (puede haber muchos recordatorios)
