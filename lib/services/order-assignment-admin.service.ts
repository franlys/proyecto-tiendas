"use server";

import { adminDb } from "@/lib/firebase-admin";
import type { OrderAssignmentConfig } from "@/lib/types/order-assignment.types";

// Colecciones
const getConfigDoc = (shopId: string) =>
  `shops/${shopId}/orderAssignmentConfig/config`;

// ==================== CONFIG (ADMIN SDK) ====================

export async function getAssignmentConfigAdmin(
  shopId: string
): Promise<OrderAssignmentConfig> {
  const db = adminDb();
  if (!db) {
    console.error("Admin DB not initialized");
    return getDefaultConfig();
  }

  try {
    const docRef = db.doc(getConfigDoc(shopId));
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return docSnap.data() as OrderAssignmentConfig;
    }

    return getDefaultConfig();
  } catch (error) {
    console.error("Error getting assignment config (Admin):", error);
    return getDefaultConfig();
  }
}

export async function updateAssignmentConfigAdmin(
  shopId: string,
  config: Partial<OrderAssignmentConfig>
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

function getDefaultConfig(): OrderAssignmentConfig {
  return {
    enabled: false,
    initialTimeoutMinutes: 5,
    rotationTimeoutMinutes: 8,
    maxRotations: 3,
    eligibleRoles: ["sales", "manager"],
    notifyOwnerOnExpiry: true,
    acceptKeywords: ["SI", "SÍ", "ACEPTO", "ACEPTAR", "OK", "1"],
    rejectKeywords: ["NO", "RECHAZAR", "PASO", "OCUPADO", "2"],
    businessHoursOnly: false,
    businessHoursStart: "09:00",
    businessHoursEnd: "18:00",
  };
}
