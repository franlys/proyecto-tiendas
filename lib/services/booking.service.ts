import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
} from "firebase/firestore";
import { sendTextMessage, getInstanceName } from "@/lib/evolution";
import type {
  Booking,
  BookingConfig,
  BookingConversation,
  DaySlots,
  TimeSlot,
  CreateBookingInput,
  RescheduleBookingInput,
  AvailableSlot,
  ConversationState,
} from "@/lib/types/booking.types";
import {
  calculateEndTime,
  formatBookingDate,
} from "@/lib/types/booking.types";

// Colecciones
const getBookingsCollection = (shopId: string) => `shops/${shopId}/bookings`;
const getSlotsCollection = (shopId: string) => `shops/${shopId}/bookingSlots`;
const getConfigDoc = (shopId: string) => `shops/${shopId}/bookingConfig/config`;
const getConversationsCollection = (shopId: string) =>
  `shops/${shopId}/bookingConversations`;

// ==================== CONFIG ====================

export async function getBookingConfig(
  shopId: string
): Promise<BookingConfig> {
  const docRef = doc(db, getConfigDoc(shopId));
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as BookingConfig;
  }

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

export async function updateBookingConfig(
  shopId: string,
  config: Partial<BookingConfig>
): Promise<void> {
  const docRef = doc(db, getConfigDoc(shopId));
  await setDoc(docRef, { ...config, updatedAt: serverTimestamp() }, { merge: true });
}

// ==================== BOOKINGS CRUD ====================

export async function createBooking(
  shopId: string,
  input: CreateBookingInput
): Promise<Booking> {
  const endTime = calculateEndTime(input.time, input.serviceDuration);

  // Build booking data, only including optional fields if they have values
  const bookingData: Record<string, unknown> = {
    shopId,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    serviceId: input.serviceId,
    serviceName: input.serviceName,
    serviceDuration: input.serviceDuration,
    servicePrice: input.servicePrice,
    date: input.date,
    time: input.time,
    endTime,
    status: "pending",
    reminderSentAt: null,
    reminderMessageId: null,
    customerResponse: null,
    customerRespondedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Add optional fields only if they have values (Firestore doesn't accept undefined)
  if (input.customerEmail) bookingData.customerEmail = input.customerEmail;
  if (input.assignedStaffId) bookingData.assignedStaffId = input.assignedStaffId;
  if (input.assignedStaffName) bookingData.assignedStaffName = input.assignedStaffName;
  if (input.notes) bookingData.notes = input.notes;

  const docRef = await addDoc(
    collection(db, getBookingsCollection(shopId)),
    bookingData
  );

  // Reservar el slot
  await reserveSlot(shopId, input.date, input.time, docRef.id);

  return {
    id: docRef.id,
    ...bookingData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  } as Booking;
}

export async function getBooking(
  shopId: string,
  bookingId: string
): Promise<Booking | null> {
  const docRef = doc(db, getBookingsCollection(shopId), bookingId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as Booking;
}

export async function updateBooking(
  shopId: string,
  bookingId: string,
  data: Partial<Booking>
): Promise<void> {
  const docRef = doc(db, getBookingsCollection(shopId), bookingId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function getBookingsForDate(
  shopId: string,
  date: string
): Promise<Booking[]> {
  const ref = collection(db, getBookingsCollection(shopId));
  const q = query(
    ref,
    where("date", "==", date),
    where("status", "in", ["pending", "confirmed"]),
    orderBy("time", "asc")
  );

  const snapshot = await getDocs(q);
  const bookings: Booking[] = [];

  snapshot.forEach((doc) => {
    bookings.push({
      id: doc.id,
      ...doc.data(),
    } as Booking);
  });

  return bookings;
}

export async function getUpcomingBookings(
  shopId: string,
  customerPhone: string
): Promise<Booking[]> {
  const today = new Date().toISOString().split("T")[0];
  const ref = collection(db, getBookingsCollection(shopId));
  const q = query(
    ref,
    where("customerPhone", "==", customerPhone),
    where("date", ">=", today),
    where("status", "in", ["pending", "confirmed"]),
    orderBy("date", "asc"),
    limit(5)
  );

  const snapshot = await getDocs(q);
  const bookings: Booking[] = [];

  snapshot.forEach((doc) => {
    bookings.push({
      id: doc.id,
      ...doc.data(),
    } as Booking);
  });

  return bookings;
}

// ==================== CONFIRMACIÓN ====================

export async function confirmBooking(
  shopId: string,
  bookingId: string
): Promise<void> {
  await updateBooking(shopId, bookingId, {
    status: "confirmed",
    customerResponse: "confirmed",
    customerRespondedAt: Timestamp.now(),
  });

  const booking = await getBooking(shopId, bookingId);
  if (!booking) return;

  const config = await getBookingConfig(shopId);

  if (config.notifyBusinessOnConfirm && config.businessNotificationPhone) {
    const instanceName = getInstanceName(shopId);
    await sendTextMessage(
      instanceName,
      config.businessNotificationPhone,
      `✅ *CITA CONFIRMADA*

${booking.customerName} confirmó su cita:
📅 ${formatBookingDate(booking.date)}
⏰ ${booking.time}
💇 ${booking.serviceName}`
    );
  }
}

export async function cancelBooking(
  shopId: string,
  bookingId: string,
  reason?: string
): Promise<void> {
  const booking = await getBooking(shopId, bookingId);
  if (!booking) return;

  await updateBooking(shopId, bookingId, {
    status: "cancelled",
    customerResponse: "cancel",
    customerRespondedAt: Timestamp.now(),
    internalNotes: reason ? `Cancelada: ${reason}` : "Cancelada por cliente",
  });

  // Liberar el slot
  await releaseSlot(shopId, booking.date, booking.time);

  const config = await getBookingConfig(shopId);

  if (config.notifyBusinessOnCancel && config.businessNotificationPhone) {
    const instanceName = getInstanceName(shopId);
    await sendTextMessage(
      instanceName,
      config.businessNotificationPhone,
      `❌ *CITA CANCELADA*

${booking.customerName} canceló su cita:
📅 ${formatBookingDate(booking.date)}
⏰ ${booking.time}
💇 ${booking.serviceName}

El horario está disponible nuevamente.`
    );
  }
}

export async function rescheduleBooking(
  shopId: string,
  bookingId: string,
  input: RescheduleBookingInput
): Promise<Booking | null> {
  const oldBooking = await getBooking(shopId, bookingId);
  if (!oldBooking) return null;

  const config = await getBookingConfig(shopId);

  // Verificar disponibilidad del nuevo slot
  const isAvailable = await isSlotAvailable(shopId, input.newDate, input.newTime);
  if (!isAvailable) {
    return null;
  }

  // Liberar slot anterior
  await releaseSlot(shopId, oldBooking.date, oldBooking.time);

  // Actualizar la reservación
  const endTime = calculateEndTime(input.newTime, oldBooking.serviceDuration);

  await updateBooking(shopId, bookingId, {
    date: input.newDate,
    time: input.newTime,
    endTime,
    status: "rescheduled",
    customerResponse: "reschedule",
    customerRespondedAt: Timestamp.now(),
    rescheduledFrom: {
      date: oldBooking.date,
      time: oldBooking.time,
      bookingId: oldBooking.id,
    },
    reminderSentAt: null,  // Reset para enviar nuevo recordatorio
    reminderMessageId: null,
  });

  // Reservar nuevo slot
  await reserveSlot(shopId, input.newDate, input.newTime, bookingId);

  // Notificar al negocio
  if (config.notifyBusinessOnReschedule && config.businessNotificationPhone) {
    const instanceName = getInstanceName(shopId);
    await sendTextMessage(
      instanceName,
      config.businessNotificationPhone,
      `🔄 *CITA REAGENDADA*

${oldBooking.customerName} cambió su cita:

❌ Antes: ${formatBookingDate(oldBooking.date)} a las ${oldBooking.time}
✅ Ahora: ${formatBookingDate(input.newDate)} a las ${input.newTime}

💇 ${oldBooking.serviceName}`
    );
  }

  return await getBooking(shopId, bookingId);
}

// ==================== SLOTS ====================

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

export async function getDaySlots(
  shopId: string,
  date: string
): Promise<DaySlots | null> {
  const docRef = doc(db, getSlotsCollection(shopId), date);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as DaySlots;
  }

  return null;
}

export async function generateDaySlots(
  shopId: string,
  date: string
): Promise<DaySlots> {
  const config = await getBookingConfig(shopId);
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
    updatedAt: Timestamp.now(),
  };

  await setDoc(doc(db, getSlotsCollection(shopId), date), daySlots);

  return daySlots;
}

export async function getAvailableSlots(
  shopId: string,
  date: string
): Promise<AvailableSlot[]> {
  let daySlots = await getDaySlots(shopId, date);

  if (!daySlots) {
    daySlots = await generateDaySlots(shopId, date);
  }

  const config = await getBookingConfig(shopId);
  const available: AvailableSlot[] = [];

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

export async function isSlotAvailable(
  shopId: string,
  date: string,
  time: string
): Promise<boolean> {
  let daySlots = await getDaySlots(shopId, date);

  if (!daySlots) {
    daySlots = await generateDaySlots(shopId, date);
  }

  const slot = daySlots.slots[time];
  return slot?.available ?? false;
}

export async function reserveSlot(
  shopId: string,
  date: string,
  time: string,
  bookingId: string
): Promise<void> {
  let daySlots = await getDaySlots(shopId, date);

  if (!daySlots) {
    daySlots = await generateDaySlots(shopId, date);
  }

  if (daySlots.slots[time]) {
    daySlots.slots[time] = {
      time,
      available: false,
      bookingId,
    };

    await setDoc(doc(db, getSlotsCollection(shopId), date), {
      ...daySlots,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function releaseSlot(
  shopId: string,
  date: string,
  time: string
): Promise<void> {
  const daySlots = await getDaySlots(shopId, date);

  if (daySlots && daySlots.slots[time]) {
    daySlots.slots[time] = {
      time,
      available: true,
      bookingId: null,
    };

    await setDoc(doc(db, getSlotsCollection(shopId), date), {
      ...daySlots,
      updatedAt: serverTimestamp(),
    });
  }
}

// ==================== CONVERSACIONES ====================

export async function getConversation(
  shopId: string,
  phone: string
): Promise<BookingConversation | null> {
  const docRef = doc(db, getConversationsCollection(shopId), phone);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  const data = docSnap.data() as BookingConversation;

  // Verificar si expiró
  if (data.stateExpiresAt.toMillis() < Date.now()) {
    await clearConversation(shopId, phone);
    return null;
  }

  return data;
}

export async function startConversation(
  shopId: string,
  phone: string,
  bookingId: string,
  state: ConversationState,
  stateData: Record<string, unknown> = {}
): Promise<void> {
  const config = await getBookingConfig(shopId);
  const timeoutMs = config.rescheduleTimeoutMinutes * 60 * 1000;

  const conversation: BookingConversation = {
    phone,
    shopId,
    currentBookingId: bookingId,
    state,
    stateData,
    stateExpiresAt: Timestamp.fromMillis(Date.now() + timeoutMs),
    lastMessageAt: Timestamp.now(),
  };

  await setDoc(doc(db, getConversationsCollection(shopId), phone), conversation);
}

export async function updateConversationState(
  shopId: string,
  phone: string,
  state: ConversationState,
  stateData: Record<string, unknown> = {}
): Promise<void> {
  const config = await getBookingConfig(shopId);
  const timeoutMs = config.rescheduleTimeoutMinutes * 60 * 1000;

  await updateDoc(doc(db, getConversationsCollection(shopId), phone), {
    state,
    stateData,
    stateExpiresAt: Timestamp.fromMillis(Date.now() + timeoutMs),
    lastMessageAt: serverTimestamp(),
  });
}

export async function clearConversation(
  shopId: string,
  phone: string
): Promise<void> {
  await deleteDoc(doc(db, getConversationsCollection(shopId), phone));
}

// ==================== RECORDATORIOS ====================

export async function sendReminder(
  shopId: string,
  booking: Booking
): Promise<void> {
  const config = await getBookingConfig(shopId);
  const instanceName = getInstanceName(shopId);

  // Obtener nombre de la tienda
  const shopDoc = await getDoc(doc(db, "shops", shopId));
  const shopName = shopDoc.exists() ? shopDoc.data().name : "Negocio";

  const message = `Hola ${booking.customerName}! 👋

Te recordamos tu cita en *${shopName}*:

📅 ${formatBookingDate(booking.date)}
⏰ ${booking.time}
💇 ${booking.serviceName}

Por favor confirma respondiendo:
✅ *SÍ* - Confirmar asistencia
📅 *CAMBIAR* - Reagendar cita
❌ *CANCELAR* - Cancelar cita`;

  try {
    const result = await sendTextMessage(
      instanceName,
      booking.customerPhone,
      message
    );

    // Actualizar booking con info del recordatorio
    await updateBooking(shopId, booking.id, {
      reminderSentAt: Timestamp.now(),
      reminderMessageId: result?.key?.id || null,
    });

    // Iniciar tracking de conversación
    await startConversation(
      shopId,
      booking.customerPhone,
      booking.id,
      "awaiting_confirmation"
    );

    console.log(`Reminder sent for booking ${booking.id}`);
  } catch (error) {
    console.error("Error sending reminder:", error);
  }
}

export async function getBookingsNeedingReminder(
  shopId: string,
  hoursAhead: number
): Promise<Booking[]> {
  const now = new Date();
  const targetDate = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
  const dateStr = targetDate.toISOString().split("T")[0];

  const ref = collection(db, getBookingsCollection(shopId));
  const q = query(
    ref,
    where("date", "==", dateStr),
    where("status", "in", ["pending"]),
    where("reminderSentAt", "==", null)
  );

  const snapshot = await getDocs(q);
  const bookings: Booking[] = [];

  snapshot.forEach((doc) => {
    bookings.push({
      id: doc.id,
      ...doc.data(),
    } as Booking);
  });

  return bookings;
}

// ==================== CRON JOB ====================

export async function sendDailyReminders(): Promise<number> {
  let remindersSent = 0;

  // Obtener todas las tiendas con booking habilitado
  const shopsRef = collection(db, "shops");
  const shopsSnapshot = await getDocs(shopsRef);

  for (const shopDoc of shopsSnapshot.docs) {
    const shopId = shopDoc.id;
    const config = await getBookingConfig(shopId);

    if (!config.enabled || !config.reminderEnabled) continue;

    const bookings = await getBookingsNeedingReminder(
      shopId,
      config.reminderHoursBefore
    );

    for (const booking of bookings) {
      await sendReminder(shopId, booking);
      remindersSent++;
    }
  }

  return remindersSent;
}

// ==================== BUSCAR POR TELÉFONO ====================

export async function findConversationByPhone(
  phone: string
): Promise<{ shopId: string; conversation: BookingConversation } | null> {
  // Buscar en todas las tiendas
  const shopsRef = collection(db, "shops");
  const shopsSnapshot = await getDocs(shopsRef);

  for (const shopDoc of shopsSnapshot.docs) {
    const shopId = shopDoc.id;
    const conversation = await getConversation(shopId, phone);

    if (conversation && conversation.state !== "idle") {
      return { shopId, conversation };
    }
  }

  return null;
}

// Helper function exports
export { calculateEndTime, formatBookingDate };
