import { adminDb } from "@/lib/firebase-admin";
import type { Branch, BranchStockEntry, CreateBranchInput } from "@/lib/types/branch.types";

const getBranchesCol = (shopId: string) => `shops/${shopId}/branches`;
const getBranchDoc = (shopId: string, branchId: string) => `shops/${shopId}/branches/${branchId}`;
const getStockCol = (shopId: string) => `shops/${shopId}/branchStock`;
const stockDocId = (branchId: string, productId: string) => `${branchId}__${productId}`;

// ─── BRANCHES ────────────────────────────────────────────────────────────────

export async function getBranchesAdmin(shopId: string): Promise<Branch[]> {
  try {
    const db = adminDb();
    if (!db) return [];
    const snap = await db.collection(getBranchesCol(shopId)).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Branch));
  } catch (err) {
    console.error("[getBranchesAdmin]", err);
    throw err; // re-throw so route can log the real error
  }
}

export async function getActiveBranchesAdmin(shopId: string): Promise<Branch[]> {
  try {
    const db = adminDb();
    if (!db) return [];
    const snap = await db.collection(getBranchesCol(shopId)).where("isActive", "==", true).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Branch));
  } catch (err) {
    console.error("[getActiveBranchesAdmin]", err);
    throw err;
  }
}

export async function getBranchByIdAdmin(shopId: string, branchId: string): Promise<Branch | null> {
  const db = adminDb();
  if (!db) return null;
  try {
    const doc = await db.doc(getBranchDoc(shopId, branchId)).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Branch;
  } catch {
    return null;
  }
}

export async function createBranchAdmin(shopId: string, input: CreateBranchInput): Promise<Branch> {
  const db = adminDb();
  if (!db) throw new Error("Admin DB not initialized");

  // If isMain, demote other main branches
  if (input.isMain) {
    const existing = await getBranchesAdmin(shopId);
    const batch = db.batch();
    existing.filter(b => b.isMain).forEach(b => {
      batch.update(db.doc(getBranchDoc(shopId, b.id)), { isMain: false });
    });
    await batch.commit();
  }

  const now = new Date().toISOString();
  const ref = db.collection(getBranchesCol(shopId)).doc();

  // Firestore Admin SDK throws on `undefined` values — build object without optional undefined fields
  const branch: Record<string, unknown> = {
    shopId,
    name: input.name,
    address: input.address,
    phone: input.phone || "",
    whatsapp: input.whatsapp || "",
    isActive: true,
    isMain: input.isMain ?? false,
    createdAt: now,
    updatedAt: now,
  };
  if (input.coordinates) branch.coordinates = input.coordinates;
  if (input.schedule)    branch.schedule    = input.schedule;

  await ref.set(branch);
  return { id: ref.id, ...branch } as Branch;
}

export async function updateBranchAdmin(shopId: string, branchId: string, updates: Partial<Branch>): Promise<Branch | null> {
  const db = adminDb();
  if (!db) return null;
  try {
    // If promoting to main, demote others
    if (updates.isMain) {
      const existing = await getBranchesAdmin(shopId);
      const batch = db.batch();
      existing.filter(b => b.isMain && b.id !== branchId).forEach(b => {
        batch.update(db.doc(getBranchDoc(shopId, b.id)), { isMain: false });
      });
      await batch.commit();
    }

    // Strip undefined values before sending to Firestore
    const safeUpdates = Object.fromEntries(
      Object.entries({ ...updates, updatedAt: new Date().toISOString() })
        .filter(([, v]) => v !== undefined)
    );
    const ref = db.doc(getBranchDoc(shopId, branchId));
    await ref.set(safeUpdates, { merge: true });
    const updated = await ref.get();
    return { id: updated.id, ...updated.data() } as Branch;
  } catch {
    return null;
  }
}

export async function deleteBranchAdmin(shopId: string, branchId: string): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;
  try {
    await db.doc(getBranchDoc(shopId, branchId)).delete();
    return true;
  } catch {
    return false;
  }
}

// ─── BRANCH STOCK ─────────────────────────────────────────────────────────────

export async function getBranchStockAdmin(shopId: string, branchId: string): Promise<BranchStockEntry[]> {
  const db = adminDb();
  if (!db) return [];
  try {
    const snap = await db.collection(getStockCol(shopId))
      .where("branchId", "==", branchId)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as BranchStockEntry));
  } catch {
    return [];
  }
}

export async function getProductBranchStockAdmin(shopId: string, productId: string): Promise<BranchStockEntry[]> {
  const db = adminDb();
  if (!db) return [];
  try {
    const snap = await db.collection(getStockCol(shopId))
      .where("productId", "==", productId)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as BranchStockEntry));
  } catch {
    return [];
  }
}

export async function setBranchStockAdmin(
  shopId: string,
  branchId: string,
  productId: string,
  quantity: number
): Promise<BranchStockEntry> {
  const db = adminDb();
  if (!db) throw new Error("Admin DB not initialized");

  const id = stockDocId(branchId, productId);
  const ref = db.collection(getStockCol(shopId)).doc(id);
  const entry: BranchStockEntry = { id, branchId, productId, quantity, updatedAt: new Date().toISOString() };
  await ref.set(entry);
  return entry;
}

export async function decrementBranchStockAdmin(
  shopId: string,
  branchId: string,
  items: Array<{ productId: string; quantity: number }>
): Promise<void> {
  const db = adminDb();
  if (!db) return;

  for (const item of items) {
    try {
      const id = stockDocId(branchId, item.productId);
      const ref = db.collection(getStockCol(shopId)).doc(id);
      const snap = await ref.get();
      if (!snap.exists) continue;
      const current = (snap.data()?.quantity ?? 0) as number;
      await ref.update({
        quantity: Math.max(0, current - item.quantity),
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.error(`Error decrementing branch stock for ${item.productId}:`, e);
    }
  }
}
