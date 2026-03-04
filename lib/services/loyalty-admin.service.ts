// Loyalty Service - Admin SDK (for API routes)
import { adminDb } from "@/lib/firebase-admin";
import type {
  LoyaltyConfig,
  CustomerLoyalty,
  LoyaltyStamp,
  LoyaltyRedemption,
  DEFAULT_LOYALTY_CONFIG,
} from "@/lib/types/loyalty.types";
import { FieldValue } from "firebase-admin/firestore";

// ============ CONFIG FUNCTIONS ============

export async function getLoyaltyConfigAdmin(
  shopId: string
): Promise<LoyaltyConfig | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const docRef = db.doc(`shops/${shopId}/settings/loyalty`);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return docSnap.data() as LoyaltyConfig;
    }
    return null;
  } catch (error) {
    console.error("Error getting loyalty config:", error);
    return null;
  }
}

export async function saveLoyaltyConfigAdmin(
  shopId: string,
  config: Partial<LoyaltyConfig>
): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;

  try {
    const docRef = db.doc(`shops/${shopId}/settings/loyalty`);
    const existing = await docRef.get();

    if (existing.exists) {
      await docRef.update({
        ...config,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await docRef.set({
        enabled: false,
        stampsRequired: 10,
        reward: "Servicio Gratis",
        rewardType: "freeService",
        rewardValue: 100,
        stampsPerOrder: 1,
        minimumOrderAmount: 0,
        expirationDays: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...config,
      });
    }

    // Sync the "loyalty" string with the main shop document's feature arrays
    const shopRef = db.doc(`shops/${shopId}`);
    if (config.enabled) {
      // Add 'loyalty' to both arrays to ensure compatibility
      await shopRef.update({
        features: FieldValue.arrayUnion("loyalty"),
        enabledFeatures: FieldValue.arrayUnion("loyalty"),
      });
    } else if (config.enabled === false) {
      // Remove 'loyalty' from both arrays
      await shopRef.update({
        features: FieldValue.arrayRemove("loyalty"),
        enabledFeatures: FieldValue.arrayRemove("loyalty"),
      });
    }

    return true;
  } catch (error) {
    console.error("Error saving loyalty config:", error);
    return false;
  }
}

// ============ CUSTOMER LOYALTY FUNCTIONS ============

export async function getCustomerLoyaltyAdmin(
  shopId: string,
  phone: string
): Promise<CustomerLoyalty | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const normalizedPhone = normalizePhone(phone);
    const docRef = db.doc(`shops/${shopId}/customerLoyalty/${normalizedPhone}`);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      return docSnap.data() as CustomerLoyalty;
    }
    return null;
  } catch (error) {
    console.error("Error getting customer loyalty:", error);
    return null;
  }
}

export async function initializeCustomerLoyaltyAdmin(
  shopId: string,
  phone: string
): Promise<CustomerLoyalty | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const normalizedPhone = normalizePhone(phone);
    const config = await getLoyaltyConfigAdmin(shopId);

    const newLoyalty: CustomerLoyalty = {
      phone: normalizedPhone,
      shopId,
      currentStamps: 0,
      totalStampsEarned: 0,
      totalRewardsRedeemed: 0,
      stampHistory: [],
      redemptionHistory: [],
      nextRewardAt: config?.stampsRequired || 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = db.doc(`shops/${shopId}/customerLoyalty/${normalizedPhone}`);
    await docRef.set(newLoyalty);

    return newLoyalty;
  } catch (error) {
    console.error("Error initializing customer loyalty:", error);
    return null;
  }
}

export async function addStampsAdmin(
  shopId: string,
  phone: string,
  orderId: string,
  orderNumber: string,
  orderAmount: number
): Promise<{ success: boolean; stampsAdded: number; newTotal: number; canRedeem: boolean }> {
  const db = adminDb();
  if (!db) {
    return { success: false, stampsAdded: 0, newTotal: 0, canRedeem: false };
  }

  try {
    const normalizedPhone = normalizePhone(phone);
    let loyalty = await getCustomerLoyaltyAdmin(shopId, normalizedPhone);

    if (!loyalty) {
      loyalty = await initializeCustomerLoyaltyAdmin(shopId, normalizedPhone);
      if (!loyalty) {
        return { success: false, stampsAdded: 0, newTotal: 0, canRedeem: false };
      }
    }

    const config = await getLoyaltyConfigAdmin(shopId);
    if (!config?.enabled) {
      return { success: false, stampsAdded: 0, newTotal: loyalty.currentStamps, canRedeem: false };
    }

    // Check minimum order amount
    if (config.minimumOrderAmount && orderAmount < config.minimumOrderAmount) {
      return { success: false, stampsAdded: 0, newTotal: loyalty.currentStamps, canRedeem: false };
    }

    // Calculate stamps to add
    let stamps = 1;
    if (config.stampsPerAmount && config.stampsPerAmount > 0) {
      stamps = Math.floor(orderAmount / config.stampsPerAmount);
    } else {
      stamps = config.stampsPerOrder || 1;
    }

    if (stamps <= 0) {
      return { success: false, stampsAdded: 0, newTotal: loyalty.currentStamps, canRedeem: false };
    }

    const newStamp: LoyaltyStamp = {
      id: `stamp-${Date.now()}`,
      date: new Date().toISOString(),
      orderId,
      orderNumber,
      amount: orderAmount,
      stampsEarned: stamps,
    };

    const newCurrentStamps = loyalty.currentStamps + stamps;
    const nextRewardAt = Math.max(0, config.stampsRequired - (newCurrentStamps % config.stampsRequired));

    const docRef = db.doc(`shops/${shopId}/customerLoyalty/${normalizedPhone}`);
    await docRef.update({
      currentStamps: newCurrentStamps,
      totalStampsEarned: loyalty.totalStampsEarned + stamps,
      stampHistory: [...loyalty.stampHistory, newStamp],
      lastStampDate: new Date().toISOString(),
      nextRewardAt: newCurrentStamps >= config.stampsRequired ? 0 : nextRewardAt,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      stampsAdded: stamps,
      newTotal: newCurrentStamps,
      canRedeem: newCurrentStamps >= config.stampsRequired,
    };
  } catch (error) {
    console.error("Error adding stamps:", error);
    return { success: false, stampsAdded: 0, newTotal: 0, canRedeem: false };
  }
}

export async function redeemRewardAdmin(
  shopId: string,
  phone: string,
  orderId?: string
): Promise<{ success: boolean; message: string; redemption?: LoyaltyRedemption }> {
  const db = adminDb();
  if (!db) {
    return { success: false, message: "Database not initialized" };
  }

  try {
    const normalizedPhone = normalizePhone(phone);
    const loyalty = await getCustomerLoyaltyAdmin(shopId, normalizedPhone);

    if (!loyalty) {
      return { success: false, message: "Cliente no encontrado en programa de lealtad" };
    }

    const config = await getLoyaltyConfigAdmin(shopId);
    if (!config?.enabled) {
      return { success: false, message: "Programa de lealtad no está activo" };
    }

    if (loyalty.currentStamps < config.stampsRequired) {
      return {
        success: false,
        message: `Necesitas ${config.stampsRequired - loyalty.currentStamps} sellos más para canjear`,
      };
    }

    const redemption: LoyaltyRedemption = {
      id: `redeem-${Date.now()}`,
      date: new Date().toISOString(),
      reward: config.reward,
      rewardType: config.rewardType,
      rewardValue: config.rewardValue,
      orderId,
    };

    const newCurrentStamps = loyalty.currentStamps - config.stampsRequired;

    const docRef = db.doc(`shops/${shopId}/customerLoyalty/${normalizedPhone}`);
    await docRef.update({
      currentStamps: newCurrentStamps,
      totalRewardsRedeemed: loyalty.totalRewardsRedeemed + 1,
      redemptionHistory: [...loyalty.redemptionHistory, redemption],
      nextRewardAt: config.stampsRequired - newCurrentStamps,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Recompensa canjeada: ${config.reward}`,
      redemption,
    };
  } catch (error) {
    console.error("Error redeeming reward:", error);
    return { success: false, message: "Error al canjear recompensa" };
  }
}

// ============ ADMIN QUERIES ============

export async function getAllCustomersWithLoyaltyAdmin(
  shopId: string
): Promise<CustomerLoyalty[]> {
  const db = adminDb();
  if (!db) return [];

  try {
    const collectionRef = db.collection(`shops/${shopId}/customerLoyalty`);
    const snapshot = await collectionRef.orderBy("currentStamps", "desc").get();

    return snapshot.docs.map((doc) => doc.data() as CustomerLoyalty);
  } catch (error) {
    console.error("Error getting all customers with loyalty:", error);
    return [];
  }
}

export async function getCustomersReadyToRedeemAdmin(
  shopId: string
): Promise<CustomerLoyalty[]> {
  const db = adminDb();
  if (!db) return [];

  try {
    const config = await getLoyaltyConfigAdmin(shopId);
    if (!config) return [];

    const collectionRef = db.collection(`shops/${shopId}/customerLoyalty`);
    const snapshot = await collectionRef
      .where("currentStamps", ">=", config.stampsRequired)
      .get();

    return snapshot.docs.map((doc) => doc.data() as CustomerLoyalty);
  } catch (error) {
    console.error("Error getting customers ready to redeem:", error);
    return [];
  }
}

// ============ UTILITY ============

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}
