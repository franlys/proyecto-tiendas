"use server";

import { adminDb } from "@/lib/firebase-admin";
import type { Campaign } from "@/components/shared/marketing-context";

const getCol = (shopId: string) => `shops/${shopId}/campaigns`;
const getDoc = (shopId: string, id: string) => `shops/${shopId}/campaigns/${id}`;

export async function getCampaignsAdmin(shopId: string): Promise<Campaign[]> {
  const db = adminDb();
  if (!db) return [];
  try {
    const snap = await db.collection(getCol(shopId)).orderBy("createdAt", "desc").get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Campaign));
  } catch {
    return [];
  }
}

export async function createCampaignAdmin(shopId: string, campaign: Omit<Campaign, "id">): Promise<Campaign> {
  const db = adminDb();
  if (!db) throw new Error("DB unavailable");
  const ref = await db.collection(getCol(shopId)).add(campaign);
  return { id: ref.id, ...campaign };
}

export async function updateCampaignAdmin(
  shopId: string,
  id: string,
  updates: Partial<Campaign>
): Promise<void> {
  const db = adminDb();
  if (!db) return;
  await db.doc(getDoc(shopId, id)).update({ ...updates, updatedAt: new Date().toISOString() });
}

export async function deleteCampaignAdmin(shopId: string, id: string): Promise<void> {
  const db = adminDb();
  if (!db) return;
  await db.doc(getDoc(shopId, id)).delete();
}
