import { NextRequest, NextResponse } from "next/server";
import {
  getAvailableStaffForDateAdmin,
  isStaffWorkingOnDateAdmin,
  getStaffByIdAdmin,
} from "@/lib/services/staff-admin.service";
import { getBookingsForDateAdmin } from "@/lib/services/booking-admin.service";
import type { AvailableStaff } from "@/lib/types/staff.types";

/**
 * GET /api/staff/available
 * Obtiene empleados disponibles para una fecha y servicios específicos
 *
 * Query params:
 * - shopId: ID de la tienda (requerido)
 * - date: Fecha en formato YYYY-MM-DD (requerido)
 * - services: IDs de servicios separados por coma (opcional)
 * - time: Hora específica para verificar disponibilidad (opcional)
 * - duration: Duración del servicio en minutos (opcional)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");
  const date = searchParams.get("date");
  const servicesParam = searchParams.get("services");
  const time = searchParams.get("time");
  const durationParam = searchParams.get("duration");

  if (!shopId || !date) {
    return NextResponse.json(
      { error: "shopId and date are required" },
      { status: 400 }
    );
  }

  try {
    const serviceIds = servicesParam?.split(",").filter(Boolean) || [];
    const duration = durationParam ? parseInt(durationParam, 10) : 60;

    // Obtener empleados que trabajan ese día y pueden hacer los servicios
    const staffList = await getAvailableStaffForDateAdmin(shopId, date, serviceIds);

    // Si se especificó hora, filtrar por disponibilidad en ese horario
    if (time) {
      const availableStaff: AvailableStaff[] = [];

      for (const staff of staffList) {
        const slots = await getAvailableSlotsForStaff(shopId, staff.id, date, duration);

        if (slots.includes(time)) {
          availableStaff.push({
            id: staff.id,
            name: staff.name,
            role: staff.role,
            avatar: staff.avatar,
            rating: staff.rating,
            availableSlots: slots,
          });
        }
      }

      return NextResponse.json({ staff: availableStaff });
    }

    // Sin hora específica, devolver todos los que trabajan ese día
    const availableStaff: AvailableStaff[] = [];

    for (const staff of staffList) {
      const slots = await getAvailableSlotsForStaff(shopId, staff.id, date, duration);

      availableStaff.push({
        id: staff.id,
        name: staff.name,
        role: staff.role,
        avatar: staff.avatar,
        rating: staff.rating,
        availableSlots: slots,
      });
    }

    return NextResponse.json({ staff: availableStaff });
  } catch (error) {
    console.error("Error fetching available staff:", error);
    return NextResponse.json(
      { error: "Failed to fetch available staff" },
      { status: 500 }
    );
  }
}

/**
 * Helper: Obtener slots disponibles para un empleado en una fecha
 */
async function getAvailableSlotsForStaff(
  shopId: string,
  staffId: string,
  date: string,
  serviceDuration: number
): Promise<string[]> {
  const staff = await getStaffByIdAdmin(shopId, staffId);
  if (!staff) return [];

  // Obtener horario del día
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

  // Generar slots según horario del empleado
  const slots = generateTimeSlots(
    daySchedule.open,
    daySchedule.close,
    30, // Intervalo de 30 minutos
    staff.schedule.breakEnabled,
    staff.schedule.breakStartTime,
    staff.schedule.breakEndTime
  );

  // Obtener reservaciones existentes del empleado
  const bookings = await getBookingsForDateAdmin(shopId, date);
  const staffBookings = bookings.filter(
    (b) => b.assignedStaffId === staffId && b.status !== "cancelled"
  );

  // Filtrar slots ocupados
  const availableSlots: string[] = [];

  for (const slotTime of slots) {
    const slotStart = timeToMinutes(slotTime);
    const slotEnd = slotStart + serviceDuration;

    // Verificar si hay conflicto con alguna reservación
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
      availableSlots.push(slotTime);
    }
  }

  return availableSlots;
}

/**
 * Helper: Generar slots de tiempo
 */
function generateTimeSlots(
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

    const hours = Math.floor(m / 60);
    const mins = m % 60;
    slots.push(`${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`);
  }

  return slots;
}

/**
 * Helper: Convertir tiempo a minutos
 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
