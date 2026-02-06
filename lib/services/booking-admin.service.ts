"use server";

import { adminDb } from "@/lib/firebase-admin";
import type {
  BookingConfig,
  Booking,
  CreateBookingInput,
  DaySlots,
  TimeSlot
} from "@/lib/types/booking.types";
import { calculateEndTime } from "@/lib/types/booking.types";

// Colecciones
const getConfigDoc = (shopId: string) => `shops/${shopId}/bookingConfig/config`;
const getBookingsCollection = (shopId: string) => `shops/${shopId}/bookings`;
const getSlotsCollection = (shopId: string) => `shops/${shopId}/bookingSlots`;

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

function getDefaultConfig(): BookingConfig {
  return {
    enabled: false,
    reminderEnabled: true,
    reminderHoursBefore: 24,
    openTime: "09:00",
    closeTime: "18:00",
    slotDurationMinutes: 30,
    bufferMinutes: 0,
    closedDays: [0],
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

  // Reservar el slot
  await reserveSlotAdmin(shopId, input.date, input.time, docRef.id);

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

function generateTimeSlots(
  openTime: string,
  closeTime: string,
  slotDurationMinutes: number
): string[] {
  const slots: string[] = [];
  const [openHour, openMin] = openTime.split(":").map(Number);
  const [closeHour, closeMin] = closeTime.split(":").map(Number);

  let currentMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  while (currentMinutes < closeMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    slots.push(`${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`);
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
  const timeSlots = generateTimeSlots(
    config.openTime,
    config.closeTime,
    config.slotDurationMinutes
  );

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

async function reserveSlotAdmin(
  shopId: string,
  date: string,
  time: string,
  bookingId: string
): Promise<void> {
  const db = adminDb();
  if (!db) return;

  let daySlots = await getDaySlotsAdmin(shopId, date);

  if (!daySlots) {
    daySlots = await generateDaySlotsAdmin(shopId, date);
  }

  if (daySlots.slots[time]) {
    daySlots.slots[time] = {
      time,
      available: false,
      bookingId,
    };

    await db.doc(`${getSlotsCollection(shopId)}/${date}`).set({
      ...daySlots,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function getAvailableSlotsAdmin(
  shopId: string,
  date: string
): Promise<{ time: string; endTime: string; available: boolean }[]> {
  const db = adminDb();
  if (!db) {
    console.error("Admin DB not initialized");
    return [];
  }

  let daySlots = await getDaySlotsAdmin(shopId, date);

  if (!daySlots) {
    daySlots = await generateDaySlotsAdmin(shopId, date);
  }

  const config = await getBookingConfigAdmin(shopId);
  const available: { time: string; endTime: string; available: boolean }[] = [];

  for (const [time, slot] of Object.entries(daySlots.slots)) {
    if (slot.available) {
      available.push({
        time,
        endTime: calculateEndTime(time, config.slotDurationMinutes),
        available: true,
      });
    }
  }

  return available;
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
