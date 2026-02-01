/**
 * Servicio de Rentas - Rent-a-Car
 *
 * Maneja:
 * - CRUD de vehículos
 * - Gestión de rentas (reservaciones)
 * - Disponibilidad por día
 * - Notificaciones WhatsApp al dueño
 * - Conversaciones de confirmación
 */

import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  writeBatch,
  limit,
} from "firebase/firestore";
import { sendTextMessage } from "@/lib/evolution";
import type {
  Vehicle,
  VehicleStatus,
  Rental,
  RentalStatus,
  RentalConfig,
  VehicleMonthAvailability,
  VehicleDayAvailability,
  DayStatus,
  CreateRentalInput,
  RescheduleRentalInput,
  RentalConversation,
  RentalConversationState,
  SelectedExtra,
} from "@/lib/types/rental.types";
import {
  calculateRentalDays,
  calculateBestRate,
  generateRentalNumber,
  formatRentalDates,
} from "@/lib/types/rental.types";

// ============================================
// COLECCIONES
// ============================================

const getVehiclesCollection = (shopId: string) => `shops/${shopId}/vehicles`;
const getRentalsCollection = (shopId: string) => `shops/${shopId}/rentals`;
const getAvailabilityCollection = (shopId: string, vehicleId: string) =>
  `shops/${shopId}/vehicleAvailability/${vehicleId}/months`;
const getConfigDoc = (shopId: string) => `shops/${shopId}/rentalConfig/config`;
const getConversationsCollection = (shopId: string) =>
  `shops/${shopId}/rentalConversations`;

// ============================================
// VEHÍCULOS
// ============================================

export async function getVehicles(shopId: string): Promise<Vehicle[]> {
  const q = query(
    collection(db, getVehiclesCollection(shopId)),
    where("isActive", "==", true),
    orderBy("featured", "desc"),
    orderBy("name", "asc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Vehicle[];
}

export async function getVehicle(
  shopId: string,
  vehicleId: string
): Promise<Vehicle | null> {
  const docRef = doc(db, getVehiclesCollection(shopId), vehicleId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return { id: docSnap.id, ...docSnap.data() } as Vehicle;
}

export async function createVehicle(
  shopId: string,
  data: Omit<Vehicle, "id" | "createdAt" | "updatedAt">
): Promise<Vehicle> {
  const vehicleData = {
    ...data,
    shopId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(
    collection(db, getVehiclesCollection(shopId)),
    vehicleData
  );

  return { id: docRef.id, ...vehicleData } as Vehicle;
}

export async function updateVehicle(
  shopId: string,
  vehicleId: string,
  data: Partial<Vehicle>
): Promise<void> {
  const docRef = doc(db, getVehiclesCollection(shopId), vehicleId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteVehicle(
  shopId: string,
  vehicleId: string
): Promise<void> {
  // Soft delete - marcar como inactivo
  await updateVehicle(shopId, vehicleId, { isActive: false });
}

// ============================================
// DISPONIBILIDAD
// ============================================

/**
 * Obtiene la disponibilidad de un vehículo para un mes
 */
export async function getMonthAvailability(
  shopId: string,
  vehicleId: string,
  month: string // "2026-02"
): Promise<VehicleMonthAvailability | null> {
  const docRef = doc(db, getAvailabilityCollection(shopId, vehicleId), month);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return docSnap.data() as VehicleMonthAvailability;
}

/**
 * Verifica si un vehículo está disponible para un rango de fechas
 */
export async function isVehicleAvailable(
  shopId: string,
  vehicleId: string,
  startDate: string, // "2026-02-15"
  endDate: string // "2026-02-18"
): Promise<boolean> {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Iterar cada día del rango
  const current = new Date(start);
  while (current <= end) {
    const month = current.toISOString().slice(0, 7); // "2026-02"
    const day = current.getDate().toString().padStart(2, "0"); // "15"

    const availability = await getMonthAvailability(shopId, vehicleId, month);

    if (availability?.days[day]) {
      const dayStatus = availability.days[day].status;
      if (dayStatus !== "available") {
        return false; // Día no disponible
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return true;
}

/**
 * Bloquea días para una renta
 */
async function blockDaysForRental(
  shopId: string,
  vehicleId: string,
  rentalId: string,
  startDate: string,
  endDate: string,
  status: DayStatus = "reserved"
): Promise<void> {
  const batch = writeBatch(db);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);

  // Agrupar días por mes para batch updates
  const monthUpdates: Record<string, Record<string, VehicleDayAvailability>> =
    {};

  while (current <= end) {
    const month = current.toISOString().slice(0, 7);
    const day = current.getDate().toString().padStart(2, "0");
    const dateStr = current.toISOString().split("T")[0];

    if (!monthUpdates[month]) {
      monthUpdates[month] = {};
    }

    monthUpdates[month][day] = {
      date: dateStr,
      status,
      rentalId,
    };

    current.setDate(current.getDate() + 1);
  }

  // Aplicar updates por mes
  for (const [month, days] of Object.entries(monthUpdates)) {
    const monthRef = doc(db, getAvailabilityCollection(shopId, vehicleId), month);
    const existing = await getDoc(monthRef);

    const currentDays = existing.exists()
      ? (existing.data() as VehicleMonthAvailability).days
      : {};

    batch.set(
      monthRef,
      {
        vehicleId,
        shopId,
        month,
        days: { ...currentDays, ...days },
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  await batch.commit();
}

/**
 * Libera días de una renta (al cancelar)
 */
async function releaseDaysForRental(
  shopId: string,
  vehicleId: string,
  rentalId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  const batch = writeBatch(db);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);

  const monthUpdates: Record<string, string[]> = {};

  while (current <= end) {
    const month = current.toISOString().slice(0, 7);
    const day = current.getDate().toString().padStart(2, "0");

    if (!monthUpdates[month]) {
      monthUpdates[month] = [];
    }
    monthUpdates[month].push(day);

    current.setDate(current.getDate() + 1);
  }

  for (const [month, days] of Object.entries(monthUpdates)) {
    const monthRef = doc(db, getAvailabilityCollection(shopId, vehicleId), month);
    const existing = await getDoc(monthRef);

    if (existing.exists()) {
      const data = existing.data() as VehicleMonthAvailability;
      const updatedDays = { ...data.days };

      for (const day of days) {
        if (updatedDays[day]?.rentalId === rentalId) {
          updatedDays[day] = {
            date: updatedDays[day].date,
            status: "available",
            rentalId: undefined,
          };
        }
      }

      batch.update(monthRef, {
        days: updatedDays,
        updatedAt: serverTimestamp(),
      });
    }
  }

  await batch.commit();
}

/**
 * Obtiene vehículos disponibles para un rango de fechas
 */
export async function getAvailableVehicles(
  shopId: string,
  startDate: string,
  endDate: string,
  category?: string
): Promise<Vehicle[]> {
  const vehicles = await getVehicles(shopId);

  const availableVehicles: Vehicle[] = [];

  for (const vehicle of vehicles) {
    if (category && vehicle.category !== category) continue;
    if (vehicle.status === "maintenance" || vehicle.status === "inactive")
      continue;

    const isAvailable = await isVehicleAvailable(
      shopId,
      vehicle.id,
      startDate,
      endDate
    );

    if (isAvailable) {
      availableVehicles.push(vehicle);
    }
  }

  return availableVehicles;
}

// ============================================
// RENTAS
// ============================================

/**
 * Obtiene el siguiente número de renta
 */
async function getNextRentalNumber(shopId: string): Promise<string> {
  const year = new Date().getFullYear();
  const q = query(
    collection(db, getRentalsCollection(shopId)),
    where("rentalNumber", ">=", `R-${year}-`),
    where("rentalNumber", "<", `R-${year + 1}-`),
    orderBy("rentalNumber", "desc"),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return generateRentalNumber(year, 1);
  }

  const lastNumber = snapshot.docs[0].data().rentalNumber as string;
  const sequence = parseInt(lastNumber.split("-")[2]) + 1;

  return generateRentalNumber(year, sequence);
}

/**
 * Crea una nueva renta
 */
export async function createRental(
  shopId: string,
  input: CreateRentalInput
): Promise<Rental> {
  // Verificar disponibilidad
  const isAvailable = await isVehicleAvailable(
    shopId,
    input.vehicleId,
    input.pickupDate,
    input.returnDate
  );

  if (!isAvailable) {
    throw new Error("El vehículo no está disponible para las fechas seleccionadas");
  }

  // Obtener vehículo
  const vehicle = await getVehicle(shopId, input.vehicleId);
  if (!vehicle) {
    throw new Error("Vehículo no encontrado");
  }

  // Calcular precios
  const totalDays = calculateRentalDays(input.pickupDate, input.returnDate);
  const { dailyRate, rateType } = calculateBestRate(vehicle, totalDays);
  const subtotal = dailyRate * totalDays;

  // Obtener configuración para extras
  const config = await getRentalConfig(shopId);
  const selectedExtras: SelectedExtra[] = [];
  let extrasTotal = 0;

  if (input.extras && config) {
    for (const extraId of input.extras) {
      const extra = config.availableExtras.find((e) => e.id === extraId);
      if (extra) {
        const cost = extra.flatRate || extra.dailyRate * totalDays;
        selectedExtras.push({
          extraId: extra.id,
          name: extra.name,
          dailyRate: extra.dailyRate,
          flatRate: extra.flatRate,
          totalCost: cost,
        });
        extrasTotal += cost;
      }
    }
  }

  const rentalNumber = await getNextRentalNumber(shopId);

  const rentalData: Omit<Rental, "id"> = {
    shopId,
    vehicleId: input.vehicleId,
    rentalNumber,
    vehicleSnapshot: {
      name: vehicle.name,
      plate: vehicle.plate,
      category: vehicle.category,
      thumbnail: vehicle.thumbnail,
    },
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail,
    customerIdNumber: input.customerIdNumber,
    customerLicenseNumber: input.customerLicenseNumber,
    pickupDate: input.pickupDate,
    pickupTime: input.pickupTime,
    returnDate: input.returnDate,
    returnTime: input.returnTime,
    pickupLocation: input.pickupLocation,
    returnLocation: input.returnLocation,
    dailyRate,
    totalDays,
    subtotal,
    extras: selectedExtras,
    extrasTotal,
    depositAmount: vehicle.depositAmount,
    depositStatus: "pending",
    total: subtotal + extrasTotal,
    status: "pending",
    paymentStatus: "pending",
    customerNotes: input.customerNotes,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(
    collection(db, getRentalsCollection(shopId)),
    rentalData
  );

  const rental = { id: docRef.id, ...rentalData } as Rental;

  // Bloquear días
  await blockDaysForRental(
    shopId,
    input.vehicleId,
    docRef.id,
    input.pickupDate,
    input.returnDate,
    "reserved"
  );

  // Notificar al dueño
  await notifyOwnerNewRental(shopId, rental);

  return rental;
}

/**
 * Obtiene una renta por ID
 */
export async function getRental(
  shopId: string,
  rentalId: string
): Promise<Rental | null> {
  const docRef = doc(db, getRentalsCollection(shopId), rentalId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return { id: docSnap.id, ...docSnap.data() } as Rental;
}

/**
 * Obtiene todas las rentas de un shop
 */
export async function getRentals(
  shopId: string,
  status?: RentalStatus
): Promise<Rental[]> {
  let q = query(
    collection(db, getRentalsCollection(shopId)),
    orderBy("pickupDate", "desc")
  );

  if (status) {
    q = query(
      collection(db, getRentalsCollection(shopId)),
      where("status", "==", status),
      orderBy("pickupDate", "desc")
    );
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Rental[];
}

/**
 * Confirma una renta (después del pago/depósito)
 */
export async function confirmRental(
  shopId: string,
  rentalId: string
): Promise<void> {
  const rental = await getRental(shopId, rentalId);
  if (!rental) throw new Error("Renta no encontrada");

  await updateDoc(doc(db, getRentalsCollection(shopId), rentalId), {
    status: "confirmed",
    depositStatus: "collected",
    customerConfirmedAt: serverTimestamp(),
    customerResponse: "confirmed",
    updatedAt: serverTimestamp(),
  });

  // Actualizar disponibilidad de reservado a confirmado (mismo status realmente)
  // No se cambia el status en availability porque ya está bloqueado
}

/**
 * Registra la entrega del vehículo
 */
export async function pickupVehicle(
  shopId: string,
  rentalId: string,
  data: {
    mileage: number;
    conditionNotes?: string;
    conditionPhotos?: string[];
    staffId?: string;
  }
): Promise<void> {
  const rental = await getRental(shopId, rentalId);
  if (!rental) throw new Error("Renta no encontrada");

  // Actualizar renta
  await updateDoc(doc(db, getRentalsCollection(shopId), rentalId), {
    status: "active",
    actualPickupAt: serverTimestamp(),
    mileageAtPickup: data.mileage,
    pickupConditionNotes: data.conditionNotes,
    pickupConditionPhotos: data.conditionPhotos,
    pickedUpByStaffId: data.staffId,
    updatedAt: serverTimestamp(),
  });

  // Actualizar vehículo
  await updateVehicle(shopId, rental.vehicleId, {
    status: "rented",
    currentRentalId: rentalId,
    currentMileage: data.mileage,
  });

  // Cambiar días a "rented"
  await blockDaysForRental(
    shopId,
    rental.vehicleId,
    rentalId,
    rental.pickupDate,
    rental.returnDate,
    "rented"
  );
}

/**
 * Registra la devolución del vehículo
 */
export async function returnVehicle(
  shopId: string,
  rentalId: string,
  data: {
    mileage: number;
    conditionNotes?: string;
    conditionPhotos?: string[];
    damageReported?: boolean;
    damageDescription?: string;
    damageCost?: number;
    staffId?: string;
  }
): Promise<void> {
  const rental = await getRental(shopId, rentalId);
  if (!rental) throw new Error("Renta no encontrada");

  const depositStatus = data.damageReported ? "partial_returned" : "returned";

  // Actualizar renta
  await updateDoc(doc(db, getRentalsCollection(shopId), rentalId), {
    status: "completed",
    actualReturnAt: serverTimestamp(),
    mileageAtReturn: data.mileage,
    returnConditionNotes: data.conditionNotes,
    returnConditionPhotos: data.conditionPhotos,
    damageReported: data.damageReported,
    damageDescription: data.damageDescription,
    damageCost: data.damageCost,
    depositStatus,
    returnedToStaffId: data.staffId,
    updatedAt: serverTimestamp(),
  });

  // Actualizar vehículo
  await updateVehicle(shopId, rental.vehicleId, {
    status: "available",
    currentRentalId: undefined,
    currentMileage: data.mileage,
  });

  // Liberar días futuros (si devolvió antes)
  const today = new Date().toISOString().split("T")[0];
  if (today < rental.returnDate) {
    // Devolvió antes, liberar días restantes
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await releaseDaysForRental(
      shopId,
      rental.vehicleId,
      rentalId,
      tomorrow.toISOString().split("T")[0],
      rental.returnDate
    );
  }
}

/**
 * Cancela una renta
 */
export async function cancelRental(
  shopId: string,
  rentalId: string,
  reason?: string
): Promise<void> {
  const rental = await getRental(shopId, rentalId);
  if (!rental) throw new Error("Renta no encontrada");

  if (rental.status === "active") {
    throw new Error("No se puede cancelar una renta activa. Use devolución.");
  }

  // Actualizar renta
  await updateDoc(doc(db, getRentalsCollection(shopId), rentalId), {
    status: "cancelled",
    customerResponse: "cancelled",
    internalNotes: reason,
    updatedAt: serverTimestamp(),
  });

  // Liberar días
  await releaseDaysForRental(
    shopId,
    rental.vehicleId,
    rentalId,
    rental.pickupDate,
    rental.returnDate
  );

  // Notificar al dueño
  await notifyOwnerCancellation(shopId, rental, reason);
}

/**
 * Reagenda una renta
 */
export async function rescheduleRental(
  shopId: string,
  rentalId: string,
  input: RescheduleRentalInput
): Promise<Rental | null> {
  const rental = await getRental(shopId, rentalId);
  if (!rental) return null;

  const newPickupDate = input.newPickupDate || rental.pickupDate;
  const newReturnDate = input.newReturnDate || rental.returnDate;

  // Verificar disponibilidad de nuevas fechas
  // Primero liberar las fechas actuales temporalmente
  await releaseDaysForRental(
    shopId,
    rental.vehicleId,
    rentalId,
    rental.pickupDate,
    rental.returnDate
  );

  const isAvailable = await isVehicleAvailable(
    shopId,
    rental.vehicleId,
    newPickupDate,
    newReturnDate
  );

  if (!isAvailable) {
    // Restaurar fechas originales
    await blockDaysForRental(
      shopId,
      rental.vehicleId,
      rentalId,
      rental.pickupDate,
      rental.returnDate,
      rental.status === "active" ? "rented" : "reserved"
    );
    throw new Error("Las nuevas fechas no están disponibles");
  }

  // Recalcular precios
  const totalDays = calculateRentalDays(newPickupDate, newReturnDate);
  const vehicle = await getVehicle(shopId, rental.vehicleId);
  if (!vehicle) throw new Error("Vehículo no encontrado");

  const { dailyRate } = calculateBestRate(vehicle, totalDays);
  const subtotal = dailyRate * totalDays;

  // Recalcular extras
  let extrasTotal = 0;
  const updatedExtras = rental.extras.map((extra) => {
    const cost = extra.flatRate || extra.dailyRate * totalDays;
    extrasTotal += cost;
    return { ...extra, totalCost: cost };
  });

  // Actualizar renta
  await updateDoc(doc(db, getRentalsCollection(shopId), rentalId), {
    pickupDate: newPickupDate,
    pickupTime: input.newPickupTime || rental.pickupTime,
    returnDate: newReturnDate,
    returnTime: input.newReturnTime || rental.returnTime,
    totalDays,
    dailyRate,
    subtotal,
    extras: updatedExtras,
    extrasTotal,
    total: subtotal + extrasTotal,
    customerResponse: "rescheduled",
    updatedAt: serverTimestamp(),
  });

  // Bloquear nuevas fechas
  await blockDaysForRental(
    shopId,
    rental.vehicleId,
    rentalId,
    newPickupDate,
    newReturnDate,
    rental.status === "active" ? "rented" : "reserved"
  );

  return getRental(shopId, rentalId);
}

// ============================================
// CONFIGURACIÓN
// ============================================

export async function getRentalConfig(
  shopId: string
): Promise<RentalConfig | null> {
  const docRef = doc(db, getConfigDoc(shopId));
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return docSnap.data() as RentalConfig;
}

export async function updateRentalConfig(
  shopId: string,
  config: Partial<RentalConfig>
): Promise<void> {
  const docRef = doc(db, getConfigDoc(shopId));
  await updateDoc(docRef, {
    ...config,
    updatedAt: serverTimestamp(),
  });
}

// ============================================
// CONVERSACIONES WHATSAPP
// ============================================

export async function getRentalConversation(
  shopId: string,
  phone: string
): Promise<RentalConversation | null> {
  const docRef = doc(db, getConversationsCollection(shopId), phone);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return docSnap.data() as RentalConversation;
}

export async function findRentalConversationByPhone(
  phone: string
): Promise<{ shopId: string; conversation: RentalConversation } | null> {
  // Buscar en todas las tiendas (esto es costoso, idealmente tener índice)
  const shopsSnapshot = await getDocs(collection(db, "shops"));

  for (const shopDoc of shopsSnapshot.docs) {
    const config = await getRentalConfig(shopDoc.id);
    if (!config?.enabled) continue;

    const conversation = await getRentalConversation(shopDoc.id, phone);
    if (conversation && conversation.state !== "idle") {
      return { shopId: shopDoc.id, conversation };
    }
  }

  return null;
}

export async function startRentalConversation(
  shopId: string,
  phone: string,
  rentalId: string,
  state: RentalConversationState
): Promise<void> {
  const docRef = doc(db, getConversationsCollection(shopId), phone);
  await updateDoc(docRef, {
    phone,
    shopId,
    currentRentalId: rentalId,
    state,
    stateData: {},
    stateExpiresAt: Timestamp.fromDate(
      new Date(Date.now() + 30 * 60 * 1000) // 30 min expiry
    ),
    lastMessageAt: serverTimestamp(),
  });
}

export async function clearRentalConversation(
  shopId: string,
  phone: string
): Promise<void> {
  const docRef = doc(db, getConversationsCollection(shopId), phone);
  await updateDoc(docRef, {
    state: "idle",
    currentRentalId: null,
    stateData: {},
    lastMessageAt: serverTimestamp(),
  });
}

// ============================================
// NOTIFICACIONES
// ============================================

/**
 * Notifica al dueño sobre nueva renta
 */
async function notifyOwnerNewRental(
  shopId: string,
  rental: Rental
): Promise<void> {
  const config = await getRentalConfig(shopId);
  if (!config?.notifyOnNewRental || !config.notificationPhone) return;

  const dates = formatRentalDates(rental.pickupDate, rental.returnDate);

  const message = `🚗 *NUEVA RESERVA DE VEHÍCULO*

📋 Reserva: ${rental.rentalNumber}
🚙 Vehículo: ${rental.vehicleSnapshot.name}
📅 Fechas: ${dates}
⏰ Recogida: ${rental.pickupTime}

👤 Cliente: ${rental.customerName}
📞 Teléfono: ${rental.customerPhone}

💰 Total: $${rental.total.toLocaleString()}
💵 Depósito: $${rental.depositAmount.toLocaleString()}

Estado: ⏳ Pendiente de confirmación

Revisa el panel para confirmar.`;

  try {
    // Obtener instancia de WhatsApp del shop
    const shopDoc = await getDoc(doc(db, "shops", shopId));
    const instanceName = shopDoc.data()?.whatsappInstance;

    if (instanceName) {
      await sendTextMessage(instanceName, config.notificationPhone, message);
    }
  } catch (error) {
    console.error("[Rental] Error notifying owner:", error);
  }
}

/**
 * Notifica al dueño sobre cancelación
 */
async function notifyOwnerCancellation(
  shopId: string,
  rental: Rental,
  reason?: string
): Promise<void> {
  const config = await getRentalConfig(shopId);
  if (!config?.notifyOnCancellation || !config.notificationPhone) return;

  const dates = formatRentalDates(rental.pickupDate, rental.returnDate);

  const message = `❌ *RESERVA CANCELADA*

📋 Reserva: ${rental.rentalNumber}
🚙 Vehículo: ${rental.vehicleSnapshot.name}
📅 Fechas: ${dates}

👤 Cliente: ${rental.customerName}
📞 Teléfono: ${rental.customerPhone}

${reason ? `📝 Motivo: ${reason}` : ""}

El vehículo ha sido liberado y está disponible nuevamente.`;

  try {
    const shopDoc = await getDoc(doc(db, "shops", shopId));
    const instanceName = shopDoc.data()?.whatsappInstance;

    if (instanceName) {
      await sendTextMessage(instanceName, config.notificationPhone, message);
    }
  } catch (error) {
    console.error("[Rental] Error notifying cancellation:", error);
  }
}

/**
 * Envía recordatorio de recogida al cliente
 */
export async function sendPickupReminder(
  shopId: string,
  rental: Rental
): Promise<void> {
  const config = await getRentalConfig(shopId);
  if (!config?.reminderEnabled) return;

  const pickupDate = new Date(rental.pickupDate + "T12:00:00");
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  const dateStr = pickupDate.toLocaleDateString("es-MX", options);

  const message = `🚗 *Recordatorio de tu reserva*

Hola ${rental.customerName}!

Te recordamos que mañana tienes programada la recogida de tu vehículo:

🚙 *${rental.vehicleSnapshot.name}*
📅 ${dateStr}
⏰ ${rental.pickupTime}
📍 ${rental.pickupLocation}

📋 Reserva: ${rental.rentalNumber}

Por favor responde:
✅ *SÍ* - Confirmo mi recogida
📅 *CAMBIAR* - Necesito modificar fechas
❌ *CANCELAR* - Cancelar reserva`;

  try {
    const shopDoc = await getDoc(doc(db, "shops", shopId));
    const instanceName = shopDoc.data()?.whatsappInstance;

    if (instanceName) {
      await sendTextMessage(instanceName, rental.customerPhone, message);

      // Iniciar conversación de confirmación
      await startRentalConversation(
        shopId,
        rental.customerPhone,
        rental.id,
        "awaiting_confirmation"
      );

      // Marcar recordatorio enviado
      await updateDoc(doc(db, getRentalsCollection(shopId), rental.id), {
        reminderSentAt: serverTimestamp(),
      });
    }
  } catch (error) {
    console.error("[Rental] Error sending pickup reminder:", error);
  }
}

/**
 * Envía recordatorios de recogida para mañana
 */
export async function sendDailyPickupReminders(shopId: string): Promise<number> {
  const config = await getRentalConfig(shopId);
  if (!config?.reminderEnabled) return 0;

  // Buscar rentas con recogida mañana
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const q = query(
    collection(db, getRentalsCollection(shopId)),
    where("pickupDate", "==", tomorrowStr),
    where("status", "in", ["pending", "confirmed"]),
    where("reminderSentAt", "==", null)
  );

  const snapshot = await getDocs(q);
  let sent = 0;

  for (const docSnap of snapshot.docs) {
    const rental = { id: docSnap.id, ...docSnap.data() } as Rental;
    await sendPickupReminder(shopId, rental);
    sent++;
  }

  return sent;
}
