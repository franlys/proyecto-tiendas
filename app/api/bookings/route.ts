import { NextRequest, NextResponse } from "next/server";
import {
  createBookingAdmin,
  getBookingsForDateAdmin,
  getBookingConfigAdmin,
} from "@/lib/services/booking-admin.service";
import type { CreateBookingInput } from "@/lib/types/booking.types";
import { sendTextMessage, getInstanceName } from "@/lib/evolution";
import { getShopBasicInfo } from "@/lib/services/whatsapp-config.service";

/**
 * GET /api/bookings?shopId=xxx&date=2026-02-15
 * Obtener reservaciones para una fecha específica (usando Admin SDK)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");
  const date = searchParams.get("date");

  if (!shopId) {
    return NextResponse.json({ error: "shopId is required" }, { status: 400 });
  }

  try {
    if (date) {
      const bookings = await getBookingsForDateAdmin(shopId, date);
      return NextResponse.json({ bookings });
    }

    // Si no hay fecha, retornar config
    const config = await getBookingConfigAdmin(shopId);
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bookings
 * Crear nueva reservación (usando Admin SDK)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, ...bookingData } = body;

    if (!shopId) {
      return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    // Validar campos requeridos
    const requiredFields = [
      "customerName",
      "customerPhone",
      "serviceId",
      "serviceName",
      "serviceDuration",
      "servicePrice",
      "date",
      "time",
    ];

    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const booking = await createBookingAdmin(shopId, bookingData as CreateBookingInput);

    // Send WhatsApp notification to owner (non-blocking)
    notifyOwnerOfNewBooking(shopId, bookingData as CreateBookingInput).catch(err => {
      console.error("Error notifying owner of booking:", err);
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}

/**
 * Send WhatsApp notification to shop owner about new booking
 */
async function notifyOwnerOfNewBooking(shopId: string, booking: CreateBookingInput) {
  try {
    const shopInfo = await getShopBasicInfo(shopId);
    if (!shopInfo?.ownerNotificationPhone) {
      console.log(`[Booking Notify] No owner phone for shop ${shopId}`);
      return;
    }

    // Get Evolution instance name for this shop
    const instance = getInstanceName(shopInfo.slug || shopId);

    // Format date in Spanish
    const dateObj = new Date(booking.date + "T12:00:00");
    const dateStr = dateObj.toLocaleDateString("es-MX", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    const message = `📅 *NUEVA RESERVACIÓN*\n\n` +
      `👤 *Cliente:* ${booking.customerName}\n` +
      `📱 *Teléfono:* ${booking.customerPhone}\n` +
      `✂️ *Servicio:* ${booking.serviceName}\n` +
      `📆 *Fecha:* ${dateStr}\n` +
      `🕐 *Hora:* ${booking.time}\n` +
      `⏱️ *Duración:* ${booking.serviceDuration} min\n` +
      `💰 *Precio:* $${booking.servicePrice.toLocaleString()}\n\n` +
      `_Responde "Citas" para ver todas las citas del día._`;

    await sendTextMessage(instance, shopInfo.ownerNotificationPhone, message);
    console.log(`[Booking Notify] ✅ Sent booking notification to ${shopInfo.ownerNotificationPhone}`);
  } catch (error) {
    console.error("[Booking Notify] Error:", error);
  }
}
