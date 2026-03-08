import { NextRequest, NextResponse } from "next/server";
import {
  getAvailableSlotsAdmin,
  getAvailableSlotsForDurationAdmin,
  getBookingConfigAdmin,
  isSlotAvailableAdmin,
  getBookingsForDateAdmin,
} from "@/lib/services/booking-admin.service";
import { getStaffByIdAdmin } from "@/lib/services/staff-admin.service";

/**
 * GET /api/bookings/slots?shopId=xxx&date=2026-02-15&duration=90
 * GET /api/bookings/slots?shopId=xxx&date=2026-02-15&staffId=xxx&duration=90
 * Obtener slots disponibles para una fecha (usando Admin SDK)
 * Optional staffId for multi-staff shops
 * Optional duration parameter for dynamic slot calculation based on service duration
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");
  const date = searchParams.get("date");
  const time = searchParams.get("time");
  const durationParam = searchParams.get("duration");
  const staffId = searchParams.get("staffId");

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
    console.log(`[SLOTS_API] Fetching slots for shopId: ${shopId}, date: ${date}`);
    const config = await getBookingConfigAdmin(shopId);
    console.log(`[SLOTS_API] Config found for ${shopId}: enabled=${config.enabled}, slotDuration=${config.slotDurationMinutes}`);

    // Verificar si está habilitado
    if (!config.enabled) {
      console.log(`[SLOTS_API] Booking is DISABLED for shopId: ${shopId}`);
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

    // Parse service duration
    const serviceDuration = durationParam ? parseInt(durationParam, 10) : config.slotDurationMinutes;

    let slots;

    // Si se especifica staffId, obtener slots del empleado específico
    if (staffId) {
      slots = await getStaffAvailableSlots(shopId, staffId, date, serviceDuration);
    } else {
      // Slots a nivel tienda (comportamiento original)
      slots = serviceDuration && serviceDuration > 0
        ? await getAvailableSlotsForDurationAdmin(shopId, date, serviceDuration)
        : await getAvailableSlotsAdmin(shopId, date);
    }

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

/**
 * Helper: Obtener slots disponibles para un empleado específico
 */
async function getStaffAvailableSlots(
  shopId: string,
  staffId: string,
  date: string,
  serviceDuration: number
): Promise<{ time: string; endTime: string; available: boolean }[]> {
  const staff = await getStaffByIdAdmin(shopId, staffId);
  if (!staff || !staff.isActive) {
    return [];
  }

  // Verificar si el empleado trabaja ese día
  const dateObj = new Date(date + "T12:00:00");
  const dayOfWeek = dateObj.getDay();
  const dayKeys = [
    "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"
  ] as const;
  const dayKey = dayKeys[dayOfWeek];
  const daySchedule = staff.schedule[dayKey];

  if (!daySchedule.isWorking || !daySchedule.open || !daySchedule.close) {
    return [];
  }

  // Verificar días libres recurrentes
  if (staff.recurringOff?.some(r => r.dayOfWeek === dayOfWeek)) {
    return [];
  }

  // Verificar ausencias (vacaciones, etc.)
  const isOnTimeOff = staff.timeOff?.some(t => {
    if (!t.approved) return false;
    return date >= t.startDate && date <= t.endDate;
  });
  if (isOnTimeOff) {
    return [];
  }

  // Generar slots según horario del empleado
  const allSlots = generateStaffTimeSlots(
    daySchedule.open,
    daySchedule.close,
    30, // Intervalo base de 30 minutos
    staff.schedule.breakEnabled,
    staff.schedule.breakStartTime,
    staff.schedule.breakEndTime
  );

  // Obtener reservaciones existentes del empleado ese día
  const bookings = await getBookingsForDateAdmin(shopId, date);
  const staffBookings = bookings.filter(
    (b) => b.assignedStaffId === staffId && b.status !== "cancelled"
  );

  // Filtrar slots ocupados considerando la duración del servicio
  const availableSlots: { time: string; endTime: string; available: boolean }[] = [];

  for (const slotTime of allSlots) {
    const slotStart = timeToMinutes(slotTime);
    const slotEnd = slotStart + serviceDuration;

    // Verificar que el slot + duración no exceda el horario de cierre
    const closeMinutes = timeToMinutes(daySchedule.close);
    if (slotEnd > closeMinutes) {
      continue;
    }

    // Verificar que no choque con el descanso
    if (staff.schedule.breakEnabled && staff.schedule.breakStartTime && staff.schedule.breakEndTime) {
      const breakStart = timeToMinutes(staff.schedule.breakStartTime);
      const breakEnd = timeToMinutes(staff.schedule.breakEndTime);
      if (slotStart < breakEnd && slotEnd > breakStart) {
        continue;
      }
    }

    // Verificar si hay conflicto con alguna reservación existente
    let hasConflict = false;

    for (const booking of staffBookings) {
      const bookingStart = timeToMinutes(booking.time);
      const bookingEnd = bookingStart + (booking.serviceDuration || 60);

      // Verificar solapamiento
      if (slotStart < bookingEnd && slotEnd > bookingStart) {
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      availableSlots.push({
        time: slotTime,
        endTime: minutesToTime(slotEnd),
        available: true,
      });
    }
  }

  return availableSlots;
}

/**
 * Helper: Generar slots de tiempo para un empleado
 */
function generateStaffTimeSlots(
  openTime: string,
  closeTime: string,
  intervalMinutes: number,
  breakEnabled?: boolean,
  breakStart?: string,
  breakEnd?: string
): string[] {
  const slots: string[] = [];
  const openMinutes = timeToMinutes(openTime);
  const closeMinutes = timeToMinutes(closeTime);

  let breakStartMinutes = 0;
  let breakEndMinutes = 0;

  if (breakEnabled && breakStart && breakEnd) {
    breakStartMinutes = timeToMinutes(breakStart);
    breakEndMinutes = timeToMinutes(breakEnd);
  }

  for (let m = openMinutes; m < closeMinutes; m += intervalMinutes) {
    // Saltar slots durante el descanso
    if (breakEnabled && m >= breakStartMinutes && m < breakEndMinutes) {
      continue;
    }

    slots.push(minutesToTime(m));
  }

  return slots;
}

/**
 * Helper: Convertir tiempo "HH:MM" a minutos
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Helper: Convertir minutos a tiempo "HH:MM"
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}
