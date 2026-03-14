"use server";

import { adminDb } from "@/lib/firebase-admin";
import type { Wholesaler, CreateWholesalerInput } from "@/lib/types/wholesale.types";

const getCol = (shopId: string) => `shops/${shopId}/wholesalers`;
const getDoc = (shopId: string, id: string) => `shops/${shopId}/wholesalers/${id}`;

export async function getWholesalersAdmin(shopId: string): Promise<Wholesaler[]> {
  const db = adminDb();
  if (!db) return [];
  try {
    const snap = await db.collection(getCol(shopId)).orderBy("createdAt", "desc").get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Wholesaler));
  } catch {
    return [];
  }
}

export async function createWholesalerAdmin(
  shopId: string,
  input: CreateWholesalerInput
): Promise<Wholesaler> {
  const db = adminDb();
  if (!db) throw new Error("DB unavailable");

  const now = new Date().toISOString();
  const data = {
    shopId,
    name: input.name,
    email: input.email || "",
    phone: input.phone || "",
    code: input.code.trim().toUpperCase(),
    isActive: true,
    notes: input.notes || "",
    createdAt: now,
    updatedAt: now,
  };

  const ref = await db.collection(getCol(shopId)).add(data);
  return { id: ref.id, ...data };
}

export async function updateWholesalerAdmin(
  shopId: string,
  id: string,
  updates: Partial<Omit<Wholesaler, "id" | "shopId" | "createdAt">>
): Promise<Wholesaler | null> {
  const db = adminDb();
  if (!db) return null;

  const ref = db.doc(getDoc(shopId, id));
  const payload = { ...updates, updatedAt: new Date().toISOString() };
  if (payload.code) payload.code = payload.code.trim().toUpperCase();

  await ref.update(payload);
  const snap = await ref.get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as Wholesaler;
}

export async function deleteWholesalerAdmin(shopId: string, id: string): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;
  try {
    await db.doc(getDoc(shopId, id)).delete();
    return true;
  } catch {
    return false;
  }
}

export async function validateWholesaleCodeAdmin(
  shopId: string,
  input: string // Can be a 4-digit code or a registered phone number
): Promise<{ valid: boolean; wholesalerId?: string; wholesalerName?: string }> {
  const db = adminDb();
  if (!db) return { valid: false };
  try {
    const col = db.collection(getCol(shopId));
    const normalized = input.trim();

    // Try by code first (uppercase, 4 digits)
    const byCode = await col
      .where("code", "==", normalized.toUpperCase())
      .where("isActive", "==", true)
      .limit(1)
      .get();

    if (!byCode.empty) {
      const doc = byCode.docs[0];
      return { valid: true, wholesalerId: doc.id, wholesalerName: (doc.data() as Wholesaler).name };
    }

    // Try by phone (strip non-digits for flexible matching)
    const digitsOnly = normalized.replace(/\D/g, "");
    if (digitsOnly.length >= 8) {
      const allSnap = await col.where("isActive", "==", true).get();
      const match = allSnap.docs.find((d) => {
        const phone = (d.data().phone || "").replace(/\D/g, "");
        return phone.length >= 8 && (phone === digitsOnly || phone.endsWith(digitsOnly) || digitsOnly.endsWith(phone));
      });
      if (match) {
        return { valid: true, wholesalerId: match.id, wholesalerName: (match.data() as Wholesaler).name };
      }
    }

    return { valid: false };
  } catch {
    return { valid: false };
  }
}

export async function isCodeTakenAdmin(shopId: string, code: string, excludeId?: string): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;
  try {
    const snap = await db
      .collection(getCol(shopId))
      .where("code", "==", code.trim().toUpperCase())
      .get();

    return snap.docs.some((d) => d.id !== excludeId);
  } catch {
    return false;
  }
}
