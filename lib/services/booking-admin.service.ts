"use server";

import { adminDb } from "@/lib/firebase-admin";
import type {
  BookingConfig,
  Booking,
  CreateBookingInput,
  DaySlots,
  TimeSlot,
  BookingService,
  CreateServiceInput
} from "@/lib/types/booking.types";
import { calculateEndTime } from "@/lib/types/booking.types";

// Colecciones
const getConfigDoc = (shopId: string) => `shops/${shopId}/bookingConfig/config`;
const getBookingsCollection = (shopId: string) => `shops/${shopId}/bookings`;
const getSlotsCollection = (shopId: string) => `shops/${shopId}/bookingSlots`;
const getServicesCollection = (shopId: string) => `shops/${shopId}/bookingServices`;

// ==================== CONFIG (ADMIN SDK) ====================

export async function getBookingConfigAdmin(
  shopId: string
): Promise<BookingConfig> {
  const db = adminDb();
  if (!db) {
    console.error("Admin DB not initialized");
    return getDefaultConfig();
  }

  try {
    const docRef = db.doc(getConfigDoc(shopId));
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return docSnap.data() as BookingConfig;
    }

    return getDefaultConfig();
  } catch (error) {
    console.error("Error getting booking config (Admin):", error);
    return getDefaultConfig();
  }
}

export async function updateBookingConfigAdmin(
  shopId: string,
  config: Partial<BookingConfig>
): Promise<void> {
  const db = adminDb();
  if (!db) {
    throw new Error("Admin DB not initialized");
  }

  const docRef = db.doc(getConfigDoc(shopId));
  await docRef.set(
    { ...config, updatedAt: new Date().toISOString() },
    { merge: true }
  );
}

// ==================== CLOSED DATES MANAGEMENT ====================

/**
 * Add a specific date to closed dates (one-time closure)
 */
export async function addClosedDateAdmin(
  shopId: string,
  date: string
): Promise<{ success: boolean; alreadyClosed?: boolean }> {
  const db = adminDb();
  if (!db) {
    throw new Error("Admin DB not initialized");
  }

  const config = await getBookingConfigAdmin(shopId);
  const closedDates = config.closedDates || [];

  // Check if already closed
  if (closedDates.includes(date)) {
    return { success: true, alreadyClosed: true };
  }

  // Add the date
  closedDates.push(date);

  await updateBookingConfigAdmin(shopId, { closedDates });

  return { success: true, alreadyClosed: false };
}

/**
 * Remove a specific date from closed dates (reopen)
 */
export async function removeClosedDateAdmin(
  shopId: string,
  date: string
): Promise<{ success: boolean; wasNotClosed?: boolean }> {
  const db = adminDb();
  if (!db) {
    throw new Error("Admin DB not initialized");
  }

  const config = await getBookingConfigAdmin(shopId);
  const closedDates = config.closedDates || [];

  // Check if was closed
  if (!closedDates.includes(date)) {
    return { success: true, wasNotClosed: true };
  }

  // Remove the date
  const newClosedDates = closedDates.filter(d => d !== date);

  await updateBookingConfigAdmin(shopId, { closedDates: newClosedDates });

  return { success: true, wasNotClosed: false };
}

/**
 * Check if a specific date is closed (either by day of week or specific date)
 */
export async function isDateClosedAdmin(
  shopId: string,
  date: string
): Promise<{ closed: boolean; reason?: string }> {
  const config = await getBookingConfigAdmin(shopId);

  // Check specific closed dates
  if (config.closedDates?.includes(date)) {
    return { closed: true, reason: "Cierre temporal" };
  }

  // Check day of week
  const dateObj = new Date(date + "T12:00:00");
  const dayOfWeek = dateObj.getDay();

  if (config.closedDays.includes(dayOfWeek)) {
    const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return { closed: true, reason: `Cerrado los ${dayNames[dayOfWeek]}` };
  }

  return { closed: false };
}

/**
 * Get all closed dates for a shop
 */
export async function getClosedDatesAdmin(shopId: string): Promise<string[]> {
  const config = await getBookingConfigAdmin(shopId);
  return config.closedDates || [];
}

function getDefaultConfig(): BookingConfig {
  return {
    enabled: false,
    reminderEnabled: true,
    reminderHoursBefore: 24,
    openTime: "09:00",
    closeTime: "18:00",
    slotDurationMinutes: 30,
    bufferMinutes: 0,
    breakEnabled: false,
    breakStartTime: "12:00",
    breakEndTime: "14:00",
    closedDays: [0],
    closedDates: [],
    confirmKeywords: ["SI", "SÍ", "CONFIRMO", "OK", "LISTO", "1"],
    rescheduleKeywords: ["CAMBIAR", "REAGENDAR", "MOVER", "OTRA", "2"],
    cancelKeywords: ["CANCELAR", "NO PUEDO", "NO VOY", "3"],
    notifyBusinessOnConfirm: true,
    notifyBusinessOnCancel: true,
    notifyBusinessOnReschedule: true,
    businessNotificationPhone: "",
    rescheduleTimeoutMinutes: 30,
    maxAdvanceBookingDays: 30,
    minAdvanceBookingHours: 2,
  };
}

// ==================== BOOKINGS CRUD (ADMIN SDK) ====================

export async function createBookingAdmin(
  shopId: string,
  input: CreateBookingInput
): Promise<Booking> {
  const db = adminDb();
  if (!db) {
    throw new Error("Admin DB not initialized");
  }

  const endTime = calculateEndTime(input.time, input.serviceDuration);
  const now = new Date().toISOString();

  const bookingData = {
    shopId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail || null,
    serviceId: input.serviceId,
    serviceName: input.serviceName,
    serviceDuration: input.serviceDuration,
    servicePrice: input.servicePrice,
    date: input.date,
    time: input.time,
    endTime,
    status: "pending" as const,
    reminderSentAt: null,
    reminderMessageId: null,
    customerResponse: null,
    customerRespondedAt: null,
    assignedStaffId: input.assignedStaffId || null,
    assignedStaffName: input.assignedStaffName || null,
    notes: input.notes || null,
    internalNotes: null,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection(getBookingsCollection(shopId)).add(bookingData);

  // Reservar todos los slots necesarios para la duración del servicio
  await reserveSlotAdmin(shopId, input.date, input.time, docRef.id, input.serviceDuration);

  return {
    id: docRef.id,
    ...bookingData,
  } as unknown as Booking;
}

export async function getBookingsForDateAdmin(
  shopId: string,
  date: string
): Promise<Booking[]> {
  const db = adminDb();
  if (!db) {
    console.error("Admin DB not initialized");
    return [];
  }

  try {
    const ref = db.collection(getBookingsCollection(shopId));
    const snapshot = await ref
      .where("date", "==", date)
      .where("status", "in", ["pending", "confirmed"])
      .orderBy("time", "asc")
      .get();

    const bookings: Booking[] = [];
    snapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      } as Booking);
    });

    return bookings;
  } catch (error) {
    console.error("Error getting bookings for date (Admin):", error);
    return [];
  }
}

// ==================== SLOTS (ADMIN SDK) ====================

async function getDaySlotsAdmin(
  shopId: string,
  date: string
): Promise<DaySlots | null> {
  const db = adminDb();
  if (!db) return null;

  const docRef = db.doc(`${getSlotsCollection(shopId)}/${date}`);
  const docSnap = await docRef.get();

  if (docSnap.exists) {
    return docSnap.data() as DaySlots;
  }

  return null;
}

interface GenerateSlotsOptions {
  openTime: string;
  closeTime: string;
  slotDurationMinutes: number;
  breakEnabled?: boolean;
  breakStartTime?: string;
  breakEndTime?: string;
}

function generateTimeSlots(options: GenerateSlotsOptions): string[] {
  const { openTime, closeTime, slotDurationMinutes, breakEnabled, breakStartTime, breakEndTime } = options;

  const slots: string[] = [];
  const [openHour, openMin] = openTime.split(":").map(Number);
  const [closeHour, closeMin] = closeTime.split(":").map(Number);

  let currentMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  // Calculate break time in minutes if enabled
  let breakStartMinutes = 0;
  let breakEndMinutes = 0;
  if (breakEnabled && breakStartTime && breakEndTime) {
    const [breakStartH, breakStartM] = breakStartTime.split(":").map(Number);
    const [breakEndH, breakEndM] = breakEndTime.split(":").map(Number);
    breakStartMinutes = breakStartH * 60 + breakStartM;
    breakEndMinutes = breakEndH * 60 + breakEndM;
  }

  while (currentMinutes < closeMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    const timeStr = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;

    // Skip slots that fall within the break time
    const slotEndMinutes = currentMinutes + slotDurationMinutes;
    const isInBreak = breakEnabled &&
      breakStartMinutes > 0 &&
      (currentMinutes < breakEndMinutes && slotEndMinutes > breakStartMinutes);

    if (!isInBreak) {
      slots.push(timeStr);
    }

    currentMinutes += slotDurationMinutes;
  }

  return slots;
}

async function generateDaySlotsAdmin(
  shopId: string,
  date: string
): Promise<DaySlots> {
  const db = adminDb();
  if (!db) {
    throw new Error("Admin DB not initialized");
  }

  const config = await getBookingConfigAdmin(shopId);
  const timeSlots = generateTimeSlots({
    openTime: config.openTime,
    closeTime: config.closeTime,
    slotDurationMinutes: config.slotDurationMinutes,
    breakEnabled: config.breakEnabled,
    breakStartTime: config.breakStartTime,
    breakEndTime: config.breakEndTime,
  });

  const slots: Record<string, TimeSlot> = {};
  for (const time of timeSlots) {
    slots[time] = {
      time,
      available: true,
      bookingId: null,
    };
  }

  const daySlots: DaySlots = {
    date,
    shopId,
    slots,
    updatedAt: new Date().toISOString() as unknown as import("firebase/firestore").Timestamp,
  };

  await db.doc(`${getSlotsCollection(shopId)}/${date}`).set(daySlots);

  return daySlots;
}

/**
 * Reserve all slots that a booking covers (based on duration)
 */
async function reserveSlotAdmin(
  shopId: string,
  date: string,
  time: string,
  bookingId: string,
  durationMinutes?: number
): Promise<void> {
  const db = adminDb();
  if (!db) return;

  let daySlots = await getDaySlotsAdmin(shopId, date);

  if (!daySlots) {
    daySlots = await generateDaySlotsAdmin(shopId, date);
  }

  const config = await getBookingConfigAdmin(shopId);
  const slotDuration = config.slotDurationMinutes;
  const serviceDuration = durationMinutes || slotDuration;

  // Calculate how many slots to reserve
  const slotsToReserve = Math.ceil(serviceDuration / slotDuration);

  // Get all slot times sorted
  const allTimes = Object.keys(daySlots.slots).sort();
  const startIndex = allTimes.indexOf(time);

  if (startIndex === -1) return;

  // Reserve all consecutive slots for the duration
  for (let i = 0; i < slotsToReserve && startIndex + i < allTimes.length; i++) {
    const slotTime = allTimes[startIndex + i];
    if (daySlots.slots[slotTime]) {
      daySlots.slots[slotTime] = {
        time: slotTime,
        available: false,
        bookingId,
      };
    }
  }

  await db.doc(`${getSlotsCollection(shopId)}/${date}`).set({
    ...daySlots,
    updatedAt: new Date().toISOString(),
  });
}

export async function getAvailableSlotsAdmin(
  shopId: string,
  date: string
): Promise<{ time: string; endTime: string; available: boolean }[]> {
  const config = await getBookingConfigAdmin(shopId);
  // Use the duration-aware function with default slot duration
  return getAvailableSlotsForDurationAdmin(shopId, date, config.slotDurationMinutes);
}

/**
 * Get available slots that can accommodate a specific service duration
 * This checks actual bookings and calculates time overlaps
 * to ensure the full service duration fits without conflicts
 */
export async function getAvailableSlotsForDurationAdmin(
  shopId: string,
  date: string,
  serviceDurationMinutes: number
): Promise<{ time: string; endTime: string; available: boolean }[]> {
  const db = adminDb();
  if (!db) {
    console.error("Admin DB not initialized");
    return [];
  }

  const config = await getBookingConfigAdmin(shopId);

  // Generate all possible time slots for the day
  const allSlots = generateTimeSlots({
    openTime: config.openTime,
    closeTime: config.closeTime,
    slotDurationMinutes: config.slotDurationMinutes,
    breakEnabled: config.breakEnabled,
    breakStartTime: config.breakStartTime,
    breakEndTime: config.breakEndTime,
  });

  // Get existing bookings for the date
  const bookings = await getBookingsForDateAdmin(shopId, date);

  const closeMinutes = timeToMinutes(config.closeTime);
  const breakStartMinutes = config.breakEnabled && config.breakStartTime
    ? timeToMinutes(config.breakStartTime)
    : 0;
  const breakEndMinutes = config.breakEnabled && config.breakEndTime
    ? timeToMinutes(config.breakEndTime)
    : 0;

  const available: { time: string; endTime: string; available: boolean }[] = [];

  for (const slotTime of allSlots) {
    const slotStart = timeToMinutes(slotTime);
    const slotEnd = slotStart + serviceDurationMinutes;

    // 1. Check if service fits before closing time
    if (slotEnd > closeMinutes) {
      continue;
    }

    // 2. Check if service overlaps with break time
    if (config.breakEnabled && breakStartMinutes > 0) {
      if (slotStart < breakEndMinutes && slotEnd > breakStartMinutes) {
        continue;
      }
    }

    // 3. Check for conflicts with existing bookings
    let hasConflict = false;
    for (const booking of bookings) {
      if (booking.status === "cancelled") continue;

      const bookingStart = timeToMinutes(booking.time);
      const bookingDuration = booking.serviceDuration || config.slotDurationMinutes;
      const bookingEnd = bookingStart + bookingDuration;

      // Check time overlap: [slotStart, slotEnd) overlaps with [bookingStart, bookingEnd)
      if (slotStart < bookingEnd && slotEnd > bookingStart) {
        hasConflict = true;
        break;
      }
    }

    if (!hasConflict) {
      available.push({
        time: slotTime,
        endTime: minutesToTimeStr(slotEnd),
        available: true,
      });
    }
  }

  return available;
}

/**
 * Helper to convert minutes to time string "HH:MM"
 */
function minutesToTimeStr(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Helper to convert time string to minutes
 */
function timeToMinutes(time: string): number {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

export async function isSlotAvailableAdmin(
  shopId: string,
  date: string,
  time: string
): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;

  let daySlots = await getDaySlotsAdmin(shopId, date);

  if (!daySlots) {
    daySlots = await generateDaySlotsAdmin(shopId, date);
  }

  const slot = daySlots.slots[time];
  return slot?.available ?? false;
}

// ==================== CANCEL BOOKING (ADMIN SDK) ====================

/**
 * Cancel a single booking and free up the slot
 */
export async function cancelBookingAdmin(
  shopId: string,
  bookingId: string,
  reason?: string
): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  const db = adminDb();
  if (!db) return { success: false, error: "Database not initialized" };

  try {
    const bookingRef = db.collection(getBookingsCollection(shopId)).doc(bookingId);
    const bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      return { success: false, error: "Booking not found" };
    }

    const booking = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;

    // Update booking status
    await bookingRef.update({
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason || "Cancelled by business",
      updatedAt: new Date().toISOString(),
    });

    // Free up all slots for this booking
    await freeSlotAdmin(shopId, booking.date, booking.time, bookingId);

    return { success: true, booking };
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Free all slots that were reserved for a booking (by bookingId)
 */
async function freeSlotAdmin(
  shopId: string,
  date: string,
  time: string,
  bookingId?: string
): Promise<void> {
  const db = adminDb();
  if (!db) return;

  const daySlots = await getDaySlotsAdmin(shopId, date);

  if (!daySlots) return;

  // Free all slots that belong to this booking
  let updated = false;
  for (const slotTime of Object.keys(daySlots.slots)) {
    const slot = daySlots.slots[slotTime];
    // Free slot if it matches the bookingId OR if it's the start time
    if (slot.bookingId === bookingId || (slotTime === time && !bookingId)) {
      daySlots.slots[slotTime] = {
        time: slotTime,
        available: true,
        bookingId: null,
      };
      updated = true;
    }
  }

  if (updated) {
    await db.doc(`${getSlotsCollection(shopId)}/${date}`).set({
      ...daySlots,
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Cancel ALL bookings for a specific date (owner sick day, emergency closure)
 * Returns list of cancelled bookings for notification purposes
 */
export async function cancelAllBookingsForDateAdmin(
  shopId: string,
  date: string,
  reason: string
): Promise<{ success: boolean; cancelledBookings: Booking[]; error?: string }> {
  const db = adminDb();
  if (!db) return { success: false, cancelledBookings: [], error: "Database not initialized" };

  try {
    // Get all active bookings for the date
    const bookingsSnap = await db.collection(getBookingsCollection(shopId))
      .where("date", "==", date)
      .where("status", "in", ["pending", "confirmed"])
      .get();

    const cancelledBookings: Booking[] = [];

    for (const doc of bookingsSnap.docs) {
      const booking = { id: doc.id, ...doc.data() } as Booking;

      // Cancel each booking
      await doc.ref.update({
        status: "cancelled",
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason,
        updatedAt: new Date().toISOString(),
      });

      // Free all slots for this booking
      await freeSlotAdmin(shopId, booking.date, booking.time, booking.id);

      cancelledBookings.push(booking);
    }

    console.log(`[Booking] Cancelled ${cancelledBookings.length} bookings for ${date}`);

    return { success: true, cancelledBookings };
  } catch (error) {
    console.error("Error cancelling all bookings:", error);
    return { success: false, cancelledBookings: [], error: String(error) };
  }
}

/**
 * Get booking by ID
 */
export async function getBookingByIdAdmin(
  shopId: string,
  bookingId: string
): Promise<Booking | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const docSnap = await db.collection(getBookingsCollection(shopId)).doc(bookingId).get();
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() } as Booking;
  } catch (error) {
    console.error("Error getting booking:", error);
    return null;
  }
}

// ==================== SERVICES CRUD (ADMIN SDK) ====================

/**
 * Get all services for a shop
 */
export async function getServicesAdmin(shopId: string): Promise<BookingService[]> {
  const db = adminDb();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection(getServicesCollection(shopId))
      .orderBy("order", "asc")
      .get();

    const services: BookingService[] = [];
    snapshot.forEach((doc) => {
      services.push({
        id: doc.id,
        ...doc.data(),
      } as BookingService);
    });

    return services;
  } catch (error) {
    console.error("Error getting services:", error);
    return [];
  }
}

/**
 * Get active services only
 */
export async function getActiveServicesAdmin(shopId: string): Promise<BookingService[]> {
  const db = adminDb();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection(getServicesCollection(shopId))
      .where("isActive", "==", true)
      .orderBy("order", "asc")
      .get();

    const services: BookingService[] = [];
    snapshot.forEach((doc) => {
      services.push({
        id: doc.id,
        ...doc.data(),
      } as BookingService);
    });

    return services;
  } catch (error) {
    console.error("Error getting active services:", error);
    return [];
  }
}

/**
 * Get a single service by ID
 */
export async function getServiceByIdAdmin(
  shopId: string,
  serviceId: string
): Promise<BookingService | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const docSnap = await db
      .collection(getServicesCollection(shopId))
      .doc(serviceId)
      .get();

    if (!docSnap.exists) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as BookingService;
  } catch (error) {
    console.error("Error getting service:", error);
    return null;
  }
}

/**
 * Create a new service
 */
export async function createServiceAdmin(
  shopId: string,
  input: CreateServiceInput
): Promise<BookingService> {
  const db = adminDb();
  if (!db) {
    throw new Error("Admin DB not initialized");
  }

  const now = new Date().toISOString();

  // Get current max order
  const existing = await getServicesAdmin(shopId);
  const maxOrder = existing.length > 0
    ? Math.max(...existing.map(s => s.order || 0))
    : 0;

  const serviceData = {
    shopId,
    name: input.name,
    description: input.description || "",
    duration: input.duration,
    price: input.price,
    category: input.category || "",
    isActive: input.isActive !== false,
    order: input.order ?? maxOrder + 1,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection(getServicesCollection(shopId)).add(serviceData);

  return {
    id: docRef.id,
    ...serviceData,
  };
}

/**
 * Update a service
 */
export async function updateServiceAdmin(
  shopId: string,
  serviceId: string,
  updates: Partial<CreateServiceInput>
): Promise<BookingService | null> {
  const db = adminDb();
  if (!db) {
    throw new Error("Admin DB not initialized");
  }

  const docRef = db.collection(getServicesCollection(shopId)).doc(serviceId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return null;
  }

  await docRef.update({
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  const updated = await docRef.get();
  return {
    id: updated.id,
    ...updated.data(),
  } as BookingService;
}

/**
 * Delete a service
 */
export async function deleteServiceAdmin(
  shopId: string,
  serviceId: string
): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;

  try {
    await db.collection(getServicesCollection(shopId)).doc(serviceId).delete();
    return true;
  } catch (error) {
    console.error("Error deleting service:", error);
    return false;
  }
}

/**
 * Reorder services
 */
export async function reorderServicesAdmin(
  shopId: string,
  serviceIds: string[]
): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;

  try {
    const batch = db.batch();

    serviceIds.forEach((id, index) => {
      const docRef = db.collection(getServicesCollection(shopId)).doc(id);
      batch.update(docRef, { order: index, updatedAt: new Date().toISOString() });
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error reordering services:", error);
    return false;
  }
}
