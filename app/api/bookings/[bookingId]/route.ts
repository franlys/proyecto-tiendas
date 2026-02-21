import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendTextMessage, getInstanceName } from "@/lib/evolution";
import { getShopBasicInfo } from "@/lib/services/whatsapp-config.service";
import { formatBookingDate } from "@/lib/types/booking.types";
import type { Booking, BookingConfig } from "@/lib/types/booking.types";

// Helper to get booking config
async function getBookingConfig(shopId: string): Promise<BookingConfig | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const docRef = db.doc(`shops/${shopId}/bookingConfig/config`);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return docSnap.data() as BookingConfig;
    }
    return null;
  } catch {
    return null;
  }
}

// Helper to get booking by ID
async function getBookingById(shopId: string, bookingId: string): Promise<Booking | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const docSnap = await db.collection(`shops/${shopId}/bookings`).doc(bookingId).get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as Booking;
  } catch {
    return null;
  }
}

/**
 * PATCH /api/bookings/[bookingId]
 * Update booking status with notifications
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const body = await request.json();
    const { shopId, action, reason } = body;

    if (!shopId || !bookingId) {
      return NextResponse.json(
        { error: "shopId and bookingId are required" },
        { status: 400 }
      );
    }

    const db = adminDb();
    if (!db) {
      return NextResponse.json(
        { error: "Database not initialized" },
        { status: 500 }
      );
    }

    const booking = await getBookingById(shopId, bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const bookingRef = db.collection(`shops/${shopId}/bookings`).doc(bookingId);
    const config = await getBookingConfig(shopId);
    const shopInfo = await getShopBasicInfo(shopId);
    const instanceName = getInstanceName(shopInfo?.slug || shopId);

    switch (action) {
      case "confirm": {
        // Update booking status
        await bookingRef.update({
          status: "confirmed",
          customerResponse: "confirmed",
          customerRespondedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Send notification to business owner
        if (config?.notifyBusinessOnConfirm && config?.businessNotificationPhone) {
          try {
            await sendTextMessage(
              instanceName,
              config.businessNotificationPhone,
              `✅ *CITA CONFIRMADA*\n\n` +
              `${booking.customerName} confirmó su cita:\n` +
              `📅 ${formatBookingDate(booking.date)}\n` +
              `⏰ ${booking.time}\n` +
              `💇 ${booking.serviceName}`
            );
          } catch (err) {
            console.error("[Booking API] Error sending owner notification:", err);
          }
        }

        // Send confirmation message to customer
        if (booking.customerPhone && booking.customerPhone !== "pending") {
          try {
            const shopName = shopInfo?.name || "el negocio";
            await sendTextMessage(
              instanceName,
              booking.customerPhone,
              `✅ *Tu cita ha sido confirmada*\n\n` +
              `Nos vemos en *${shopName}*:\n` +
              `📅 ${formatBookingDate(booking.date)}\n` +
              `⏰ ${booking.time}\n` +
              `💇 ${booking.serviceName}\n\n` +
              `¡Te esperamos! 💜`
            );
          } catch (err) {
            console.error("[Booking API] Error sending customer notification:", err);
          }
        }

        return NextResponse.json({
          success: true,
          status: "confirmed",
          message: "Cita confirmada y notificaciones enviadas"
        });
      }

      case "cancel": {
        // Update booking status
        await bookingRef.update({
          status: "cancelled",
          customerResponse: "cancelled",
          customerRespondedAt: new Date().toISOString(),
          cancellationReason: reason || "Cancelada por el negocio",
          updatedAt: new Date().toISOString(),
        });

        // Free up the slot
        const slotsRef = db.doc(`shops/${shopId}/bookingSlots/${booking.date}`);
        const slotsSnap = await slotsRef.get();
        if (slotsSnap.exists) {
          const slots = slotsSnap.data();
          if (slots?.slots?.[booking.time]) {
            slots.slots[booking.time] = {
              time: booking.time,
              available: true,
              bookingId: null,
            };
            await slotsRef.set({ ...slots, updatedAt: new Date().toISOString() });
          }
        }

        // Send notification to business owner
        if (config?.notifyBusinessOnCancel && config?.businessNotificationPhone) {
          try {
            await sendTextMessage(
              instanceName,
              config.businessNotificationPhone,
              `❌ *CITA CANCELADA*\n\n` +
              `${booking.customerName} - Cita cancelada:\n` +
              `📅 ${formatBookingDate(booking.date)}\n` +
              `⏰ ${booking.time}\n` +
              `💇 ${booking.serviceName}\n\n` +
              `El horario está disponible nuevamente.`
            );
          } catch (err) {
            console.error("[Booking API] Error sending cancel notification:", err);
          }
        }

        // Notify customer if we have their phone
        if (booking.customerPhone && booking.customerPhone !== "pending") {
          try {
            const shopName = shopInfo?.name || "el negocio";
            await sendTextMessage(
              instanceName,
              booking.customerPhone,
              `❌ *Cita cancelada*\n\n` +
              `Tu cita en *${shopName}* ha sido cancelada:\n` +
              `📅 ${formatBookingDate(booking.date)}\n` +
              `⏰ ${booking.time}\n\n` +
              `${reason ? `Motivo: ${reason}\n\n` : ""}` +
              `Puedes agendar una nueva cita cuando gustes. 💜`
            );
          } catch (err) {
            console.error("[Booking API] Error sending customer cancel notification:", err);
          }
        }

        return NextResponse.json({
          success: true,
          status: "cancelled",
          message: "Cita cancelada y notificaciones enviadas"
        });
      }

      case "complete": {
        await bookingRef.update({
          status: "completed",
          completedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          status: "completed",
          message: "Cita marcada como completada"
        });
      }

      case "no_show": {
        await bookingRef.update({
          status: "no_show",
          updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          status: "no_show",
          message: "Cita marcada como no asistió"
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: confirm, cancel, complete, no_show" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Booking API] Error:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/bookings/[bookingId]
 * Get a specific booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get("shopId");

    if (!shopId || !bookingId) {
      return NextResponse.json(
        { error: "shopId and bookingId are required" },
        { status: 400 }
      );
    }

    const booking = await getBookingById(shopId, bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ booking });
  } catch (error) {
    console.error("[Booking API] Error:", error);
    return NextResponse.json(
      { error: "Failed to get booking" },
      { status: 500 }
    );
  }
}
