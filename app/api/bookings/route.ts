import { NextRequest, NextResponse } from "next/server";
import {
  createBookingAdmin,
  getBookingsForDateAdmin,
  getBookingConfigAdmin,
} from "@/lib/services/booking-admin.service";
import type { CreateBookingInput } from "@/lib/types/booking.types";
import { sendTextMessage, getInstanceName } from "@/lib/evolution";
import { getShopBasicInfo } from "@/lib/services/whatsapp-config.service";
import { addStampsAdmin } from "@/lib/services/loyalty-admin.service";

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

    // Validar campos requeridos (customerPhone can be empty for web-whatsapp bookings)
    const requiredFields = [
      "customerName",
      "serviceId",
      "serviceName",
      "serviceDuration",
      "servicePrice",
      "date",
      "time",
    ];

    for (const field of requiredFields) {
      if (!bookingData[field] && bookingData[field] !== 0) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Ensure customerPhone has a default
    if (!bookingData.customerPhone) {
      bookingData.customerPhone = "pending";
    }

    // Check if slot is available before creating
    const existingBookings = await getBookingsForDateAdmin(shopId, bookingData.date);
    const requestedTime = bookingData.time;
    const requestedDuration = bookingData.serviceDuration || 60;
    const assignedStaffId = bookingData.assignedStaffId;

    // Convert time to minutes for comparison
    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    const requestedStart = timeToMinutes(requestedTime);
    const requestedEnd = requestedStart + requestedDuration;

    // Check for conflicts with existing bookings
    // If assignedStaffId is provided, only check conflicts for that staff member
    // Otherwise, check all bookings (single-staff mode)
    for (const existing of existingBookings) {
      if (existing.status === "cancelled") continue;

      // If multi-staff mode (assignedStaffId provided), only check same staff
      if (assignedStaffId && existing.assignedStaffId !== assignedStaffId) {
        continue; // Different staff member, no conflict
      }

      const existingStart = timeToMinutes(existing.time);
      const existingEnd = existingStart + (existing.serviceDuration || 60);

      // Check if times overlap
      if (requestedStart < existingEnd && requestedEnd > existingStart) {
        const staffInfo = assignedStaffId
          ? ` (${existing.assignedStaffName || "empleado"})`
          : "";
        return NextResponse.json(
          {
            error: "Slot not available",
            message: `Ya hay una cita a las ${existing.time} para ${existing.serviceName}${staffInfo}`,
            conflictWith: {
              time: existing.time,
              endTime: existing.endTime,
              service: existing.serviceName,
              staffId: existing.assignedStaffId,
              staffName: existing.assignedStaffName,
            }
          },
          { status: 409 } // Conflict
        );
      }
    }

    const booking = await createBookingAdmin(shopId, bookingData as CreateBookingInput);

    // Update with additional fields if provided (referenceCode, source)
    if (bookingData.referenceCode || bookingData.source) {
      const { adminDb } = await import("@/lib/firebase-admin");
      const db = adminDb();
      if (db) {
        await db.collection("shops").doc(shopId).collection("bookings").doc(booking.id).update({
          ...(bookingData.referenceCode && { referenceCode: bookingData.referenceCode }),
          ...(bookingData.source && { source: bookingData.source }),
        });
      }
    }

    // Add loyalty stamps for the booking (non-blocking)
    if (bookingData.customerPhone && bookingData.customerPhone !== "pending") {
      addStampsAdmin(
        shopId,
        bookingData.customerPhone,
        booking.id,
        `CITA-${booking.id.slice(-6).toUpperCase()}`,
        bookingData.servicePrice || 0
      ).then(result => {
        if (result.success) {
          console.log(`[Booking Loyalty] ✅ Added ${result.stampsAdded} stamp(s) for ${bookingData.customerPhone}. Total: ${result.newTotal}`);
        }
      }).catch(err => {
        console.error("[Booking Loyalty] Error adding stamps:", err);
      });
    }

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

    // Include staff info if assigned
    const staffLine = booking.assignedStaffName
      ? `👩‍💼 *Atendido por:* ${booking.assignedStaffName}\n`
      : "";

    const message = `📅 *NUEVA RESERVACIÓN*\n\n` +
      `👤 *Cliente:* ${booking.customerName}\n` +
      `📱 *Teléfono:* ${booking.customerPhone}\n` +
      `✂️ *Servicio:* ${booking.serviceName}\n` +
      staffLine +
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
