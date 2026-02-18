import { NextRequest, NextResponse } from "next/server";
import {
  getAvailableSlotsAdmin,
  getBookingConfigAdmin,
  isSlotAvailableAdmin,
} from "@/lib/services/booking-admin.service";

/**
 * GET /api/bookings/slots?shopId=xxx&date=2026-02-15
 * Obtener slots disponibles para una fecha (usando Admin SDK)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");
  const date = searchParams.get("date");
  const time = searchParams.get("time");

  if (!shopId || !date) {
    return NextResponse.json(
      { error: "shopId and date are required" },
      { status: 400 }
    );
  }

  try {
    // Si se pide una hora específica, verificar disponibilidad
    if (time) {
      const available = await isSlotAvailableAdmin(shopId, date, time);
      return NextResponse.json({ available, date, time });
    }

    // Obtener todos los slots disponibles
    const config = await getBookingConfigAdmin(shopId);

    // Verificar si está habilitado
    if (!config.enabled) {
      return NextResponse.json(
        { error: "Booking is not enabled for this shop", enabled: false },
        { status: 400 }
      );
    }

    // Verificar día cerrado (día de la semana)
    const dateObj = new Date(date + "T12:00:00");
    const dayOfWeek = dateObj.getDay();

    if (config.closedDays.includes(dayOfWeek)) {
      return NextResponse.json({
        slots: [],
        closed: true,
        message: "El negocio está cerrado este día",
      });
    }

    // Verificar fecha cerrada específica (cierre temporal)
    if (config.closedDates?.includes(date)) {
      return NextResponse.json({
        slots: [],
        closed: true,
        message: "El negocio está cerrado este día (cierre temporal)",
      });
    }

    // Verificar límite de días de anticipación
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + config.maxAdvanceBookingDays);

    if (dateObj > maxDate) {
      return NextResponse.json({
        slots: [],
        error: `Solo puedes reservar con ${config.maxAdvanceBookingDays} días de anticipación`,
      });
    }

    // Verificar mínimo de anticipación
    const minDateTime = new Date();
    minDateTime.setHours(minDateTime.getHours() + config.minAdvanceBookingHours);

    if (dateObj < today) {
      return NextResponse.json({
        slots: [],
        error: "No puedes reservar en fechas pasadas",
      });
    }

    const slots = await getAvailableSlotsAdmin(shopId, date);

    // Filtrar slots que ya pasaron si es hoy
    const isToday = dateObj.toDateString() === new Date().toDateString();
    const filteredSlots = isToday
      ? slots.filter((slot) => {
          const [hours, minutes] = slot.time.split(":").map(Number);
          const slotTime = new Date();
          slotTime.setHours(hours, minutes, 0, 0);
          return slotTime > minDateTime;
        })
      : slots;

    return NextResponse.json({
      slots: filteredSlots,
      config: {
        openTime: config.openTime,
        closeTime: config.closeTime,
        slotDurationMinutes: config.slotDurationMinutes,
      },
    });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch slots" },
      { status: 500 }
    );
  }
}
