"use server";

/**
 * Rental Admin Service - Admin SDK version for server-side use
 *
 * Used by webhook handlers that need to access rental data
 * without client authentication
 */

import { adminDb } from "@/lib/firebase-admin";
import type {
  Rental,
  RentalConfig,
  RentalConversation,
  RentalConversationState,
} from "@/lib/types/rental.types";

// ============================================
// COLLECTIONS
// ============================================

const getRentalsCollection = (shopId: string) => `shops/${shopId}/rentals`;
const getConfigDoc = (shopId: string) => `shops/${shopId}/rentalConfig/config`;
const getConversationsCollection = (shopId: string) =>
  `shops/${shopId}/rentalConversations`;
const getAvailabilityCollection = (shopId: string, vehicleId: string) =>
  `shops/${shopId}/vehicleAvailability/${vehicleId}/months`;

// ============================================
// CONFIG (ADMIN SDK)
// ============================================

export async function getRentalConfigAdmin(
  shopId: string
): Promise<RentalConfig | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const docRef = db.doc(getConfigDoc(shopId));
    const docSnap = await docRef.get();

    if (!docSnap.exists) return null;

    return docSnap.data() as RentalConfig;
  } catch (error) {
    console.error("[RentalAdmin] Error getting config:", error);
    return null;
  }
}

// ============================================
// RENTALS (ADMIN SDK)
// ============================================

export async function getRentalAdmin(
  shopId: string,
  rentalId: string
): Promise<Rental | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const docRef = db.collection(getRentalsCollection(shopId)).doc(rentalId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return null;

    return { id: docSnap.id, ...docSnap.data() } as Rental;
  } catch (error) {
    console.error("[RentalAdmin] Error getting rental:", error);
    return null;
  }
}

export async function confirmRentalAdmin(
  shopId: string,
  rentalId: string
): Promise<void> {
  const db = adminDb();
  if (!db) return;

  const rental = await getRentalAdmin(shopId, rentalId);
  if (!rental) throw new Error("Renta no encontrada");

  await db.collection(getRentalsCollection(shopId)).doc(rentalId).update({
    status: "confirmed",
    depositStatus: "collected",
    customerConfirmedAt: new Date().toISOString(),
    customerResponse: "confirmed",
    updatedAt: new Date().toISOString(),
  });
}

export async function cancelRentalAdmin(
  shopId: string,
  rentalId: string,
  reason?: string
): Promise<void> {
  const db = adminDb();
  if (!db) return;

  const rental = await getRentalAdmin(shopId, rentalId);
  if (!rental) throw new Error("Renta no encontrada");

  if (rental.status === "active") {
    throw new Error("No se puede cancelar una renta activa. Use devolución.");
  }

  // Update rental
  await db.collection(getRentalsCollection(shopId)).doc(rentalId).update({
    status: "cancelled",
    customerResponse: "cancelled",
    internalNotes: reason || null,
    updatedAt: new Date().toISOString(),
  });

  // Release days
  await releaseDaysForRentalAdmin(
    shopId,
    rental.vehicleId,
    rentalId,
    rental.pickupDate,
    rental.returnDate
  );
}

export async function rescheduleRentalAdmin(
  shopId: string,
  rentalId: string,
  input: { newPickupDate?: string; newReturnDate?: string }
): Promise<Rental | null> {
  const db = adminDb();
  if (!db) return null;

  const rental = await getRentalAdmin(shopId, rentalId);
  if (!rental) return null;

  const newPickupDate = input.newPickupDate || rental.pickupDate;
  const newReturnDate = input.newReturnDate || rental.returnDate;

  // Release current dates first
  await releaseDaysForRentalAdmin(
    shopId,
    rental.vehicleId,
    rentalId,
    rental.pickupDate,
    rental.returnDate
  );

  // Check availability of new dates
  const isAvailable = await isVehicleAvailableAdmin(
    shopId,
    rental.vehicleId,
    newPickupDate,
    newReturnDate
  );

  if (!isAvailable) {
    // Restore original dates
    await reserveDaysForRentalAdmin(
      shopId,
      rental.vehicleId,
      rentalId,
      rental.pickupDate,
      rental.returnDate
    );
    return null;
  }

  // Calculate new pricing
  const days = calculateDaysBetween(newPickupDate, newReturnDate);
  const dailyRate = rental.vehicleSnapshot.dailyRate || rental.subtotal / calculateDaysBetween(rental.pickupDate, rental.returnDate);
  const newSubtotal = dailyRate * days;
  const newTotal = newSubtotal + (rental.extrasTotal || 0);

  // Update rental
  await db.collection(getRentalsCollection(shopId)).doc(rentalId).update({
    pickupDate: newPickupDate,
    returnDate: newReturnDate,
    totalDays: days,
    subtotal: newSubtotal,
    total: newTotal,
    status: "pending",
    customerResponse: "rescheduled",
    rescheduledFrom: {
      pickupDate: rental.pickupDate,
      returnDate: rental.returnDate,
    },
    updatedAt: new Date().toISOString(),
  });

  // Reserve new dates
  await reserveDaysForRentalAdmin(
    shopId,
    rental.vehicleId,
    rentalId,
    newPickupDate,
    newReturnDate
  );

  return await getRentalAdmin(shopId, rentalId);
}

// ============================================
// AVAILABILITY (ADMIN SDK)
// ============================================

export async function isVehicleAvailableAdmin(
  shopId: string,
  vehicleId: string,
  startDate: string,
  endDate: string
): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;

  const start = new Date(startDate);
  const end = new Date(endDate);

  const current = new Date(start);
  while (current <= end) {
    const month = current.toISOString().slice(0, 7);
    const day = current.getDate().toString().padStart(2, "0");

    const availability = await getMonthAvailabilityAdmin(shopId, vehicleId, month);

    if (availability?.days[day]) {
      const dayStatus = availability.days[day].status;
      if (dayStatus !== "available") {
        return false;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return true;
}

async function getMonthAvailabilityAdmin(
  shopId: string,
  vehicleId: string,
  month: string
): Promise<{ days: Record<string, { status: string; rentalId?: string }> } | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const docRef = db.doc(`${getAvailabilityCollection(shopId, vehicleId)}/${month}`);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return null;

    return docSnap.data() as { days: Record<string, { status: string; rentalId?: string }> };
  } catch (error) {
    return null;
  }
}

async function releaseDaysForRentalAdmin(
  shopId: string,
  vehicleId: string,
  rentalId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  const db = adminDb();
  if (!db) return;

  const start = new Date(startDate);
  const end = new Date(endDate);

  const current = new Date(start);
  while (current <= end) {
    const month = current.toISOString().slice(0, 7);
    const day = current.getDate().toString().padStart(2, "0");

    const docRef = db.doc(`${getAvailabilityCollection(shopId, vehicleId)}/${month}`);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data() as { days: Record<string, any> };
      if (data.days[day]?.rentalId === rentalId) {
        data.days[day] = { status: "available" };
        await docRef.update({ days: data.days, updatedAt: new Date().toISOString() });
      }
    }

    current.setDate(current.getDate() + 1);
  }
}

async function reserveDaysForRentalAdmin(
  shopId: string,
  vehicleId: string,
  rentalId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  const db = adminDb();
  if (!db) return;

  const start = new Date(startDate);
  const end = new Date(endDate);

  const current = new Date(start);
  while (current <= end) {
    const month = current.toISOString().slice(0, 7);
    const day = current.getDate().toString().padStart(2, "0");

    const docRef = db.doc(`${getAvailabilityCollection(shopId, vehicleId)}/${month}`);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const data = docSnap.data() as { days: Record<string, any> };
      data.days[day] = { status: "reserved", rentalId };
      await docRef.update({ days: data.days, updatedAt: new Date().toISOString() });
    } else {
      // Create month document if doesn't exist
      const days: Record<string, any> = {};
      days[day] = { status: "reserved", rentalId };
      await docRef.set({
        vehicleId,
        month,
        days,
        updatedAt: new Date().toISOString(),
      });
    }

    current.setDate(current.getDate() + 1);
  }
}

function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// ============================================
// CONVERSATIONS (ADMIN SDK)
// ============================================

export async function findRentalConversationByPhoneAdmin(
  phone: string
): Promise<{ shopId: string; conversation: RentalConversation } | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const shopsSnapshot = await db.collection("shops").get();

    for (const shopDoc of shopsSnapshot.docs) {
      const config = await getRentalConfigAdmin(shopDoc.id);
      if (!config?.enabled) continue;

      const conversation = await getRentalConversationAdmin(shopDoc.id, phone);
      if (conversation && conversation.state !== "idle") {
        return { shopId: shopDoc.id, conversation };
      }
    }

    return null;
  } catch (error) {
    console.error("[RentalAdmin] Error finding conversation:", error);
    return null;
  }
}

export async function getRentalConversationAdmin(
  shopId: string,
  phone: string
): Promise<RentalConversation | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const docRef = db.doc(`${getConversationsCollection(shopId)}/${phone}`);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return null;

    return docSnap.data() as RentalConversation;
  } catch (error) {
    console.error("[RentalAdmin] Error getting conversation:", error);
    return null;
  }
}

export async function clearRentalConversationAdmin(
  shopId: string,
  phone: string
): Promise<void> {
  const db = adminDb();
  if (!db) return;

  try {
    const { FieldValue } = await import("firebase-admin/firestore");
    await db.doc(`${getConversationsCollection(shopId)}/${phone}`).update({
      state: "idle",
      currentRentalId: null,
      stateData: {},
      lastMessageAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    // Ignore errors (doc might not exist)
  }
}

export async function updateRentalConversationStateAdmin(
  shopId: string,
  phone: string,
  state: RentalConversationState,
  stateData: Record<string, unknown> = {}
): Promise<void> {
  const db = adminDb();
  if (!db) return;

  const { FieldValue } = await import("firebase-admin/firestore");

  await db.doc(`${getConversationsCollection(shopId)}/${phone}`).update({
    state,
    stateData,
    stateExpiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min expiry
    lastMessageAt: FieldValue.serverTimestamp(),
  });
}
