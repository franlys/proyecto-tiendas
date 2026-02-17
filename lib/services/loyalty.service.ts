// Loyalty Service - Client SDK
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import type {
  LoyaltyConfig,
  CustomerLoyalty,
  LoyaltyStamp,
  LoyaltyRedemption,
  LoyaltyCardData,
  DEFAULT_LOYALTY_CONFIG,
} from "@/lib/types/loyalty.types";

// ============ PATHS ============
const getLoyaltyConfigPath = (shopId: string) =>
  `shops/${shopId}/settings/loyalty`;

const getCustomerLoyaltyPath = (shopId: string, phone: string) =>
  `shops/${shopId}/customerLoyalty/${phone}`;

// ============ CONFIG FUNCTIONS ============

export async function getLoyaltyConfig(
  shopId: string
): Promise<LoyaltyConfig | null> {
  try {
    const docRef = doc(db, getLoyaltyConfigPath(shopId));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as LoyaltyConfig;
    }
    return null;
  } catch (error) {
    console.error("Error getting loyalty config:", error);
    return null;
  }
}

export async function saveLoyaltyConfig(
  shopId: string,
  config: Partial<LoyaltyConfig>
): Promise<boolean> {
  try {
    const docRef = doc(db, getLoyaltyConfigPath(shopId));
    const existing = await getDoc(docRef);

    if (existing.exists()) {
      await updateDoc(docRef, {
        ...config,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await setDoc(docRef, {
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
    return true;
  } catch (error) {
    console.error("Error saving loyalty config:", error);
    return false;
  }
}

// ============ CUSTOMER LOYALTY FUNCTIONS ============

export async function getCustomerLoyalty(
  shopId: string,
  phone: string
): Promise<CustomerLoyalty | null> {
  try {
    const normalizedPhone = normalizePhone(phone);
    const docRef = doc(db, getCustomerLoyaltyPath(shopId, normalizedPhone));
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as CustomerLoyalty;
    }
    return null;
  } catch (error) {
    console.error("Error getting customer loyalty:", error);
    return null;
  }
}

export async function initializeCustomerLoyalty(
  shopId: string,
  phone: string
): Promise<CustomerLoyalty> {
  const normalizedPhone = normalizePhone(phone);
  const config = await getLoyaltyConfig(shopId);

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

  const docRef = doc(db, getCustomerLoyaltyPath(shopId, normalizedPhone));
  await setDoc(docRef, newLoyalty);

  return newLoyalty;
}

export async function addStamps(
  shopId: string,
  phone: string,
  orderId: string,
  orderNumber: string,
  orderAmount: number,
  stampsToAdd: number = 1
): Promise<CustomerLoyalty | null> {
  try {
    const normalizedPhone = normalizePhone(phone);
    let loyalty = await getCustomerLoyalty(shopId, normalizedPhone);

    if (!loyalty) {
      loyalty = await initializeCustomerLoyalty(shopId, normalizedPhone);
    }

    const config = await getLoyaltyConfig(shopId);
    if (!config?.enabled) {
      return loyalty;
    }

    // Check minimum order amount
    if (config.minimumOrderAmount && orderAmount < config.minimumOrderAmount) {
      return loyalty;
    }

    // Calculate stamps to add
    let stamps = stampsToAdd;
    if (config.stampsPerAmount && config.stampsPerAmount > 0) {
      stamps = Math.floor(orderAmount / config.stampsPerAmount);
    } else {
      stamps = config.stampsPerOrder || 1;
    }

    if (stamps <= 0) return loyalty;

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

    const updatedLoyalty: Partial<CustomerLoyalty> = {
      currentStamps: newCurrentStamps,
      totalStampsEarned: loyalty.totalStampsEarned + stamps,
      stampHistory: [...loyalty.stampHistory, newStamp],
      lastStampDate: new Date().toISOString(),
      nextRewardAt: newCurrentStamps >= config.stampsRequired ? 0 : nextRewardAt,
      updatedAt: new Date().toISOString(),
    };

    const docRef = doc(db, getCustomerLoyaltyPath(shopId, normalizedPhone));
    await updateDoc(docRef, updatedLoyalty);

    return { ...loyalty, ...updatedLoyalty } as CustomerLoyalty;
  } catch (error) {
    console.error("Error adding stamps:", error);
    return null;
  }
}

export async function redeemReward(
  shopId: string,
  phone: string,
  orderId?: string
): Promise<{ success: boolean; message: string; redemption?: LoyaltyRedemption }> {
  try {
    const normalizedPhone = normalizePhone(phone);
    const loyalty = await getCustomerLoyalty(shopId, normalizedPhone);

    if (!loyalty) {
      return { success: false, message: "Cliente no encontrado en programa de lealtad" };
    }

    const config = await getLoyaltyConfig(shopId);
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

    const docRef = doc(db, getCustomerLoyaltyPath(shopId, normalizedPhone));
    await updateDoc(docRef, {
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

// ============ UTILITY FUNCTIONS ============

export async function getLoyaltyCardData(
  shopId: string,
  phone: string,
  shopName: string
): Promise<LoyaltyCardData | null> {
  try {
    const [config, loyalty] = await Promise.all([
      getLoyaltyConfig(shopId),
      getCustomerLoyalty(shopId, phone),
    ]);

    if (!config?.enabled) {
      return null;
    }

    const currentStamps = loyalty?.currentStamps || 0;
    const stampsRequired = config.stampsRequired;

    return {
      customerPhone: phone,
      shopName,
      currentStamps,
      stampsRequired,
      reward: config.reward,
      canRedeem: currentStamps >= stampsRequired,
      nextRewardAt: Math.max(0, stampsRequired - currentStamps),
    };
  } catch (error) {
    console.error("Error getting loyalty card data:", error);
    return null;
  }
}

function normalizePhone(phone: string): string {
  // Remove all non-numeric characters
  return phone.replace(/\D/g, "");
}

// ============ ADMIN FUNCTIONS ============

export async function getAllCustomersWithLoyalty(
  shopId: string
): Promise<CustomerLoyalty[]> {
  try {
    const collectionRef = collection(db, `shops/${shopId}/customerLoyalty`);
    const q = query(collectionRef, orderBy("currentStamps", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data() as CustomerLoyalty);
  } catch (error) {
    console.error("Error getting all customers with loyalty:", error);
    return [];
  }
}

export async function getCustomersReadyToRedeem(
  shopId: string
): Promise<CustomerLoyalty[]> {
  try {
    const config = await getLoyaltyConfig(shopId);
    if (!config) return [];

    const collectionRef = collection(db, `shops/${shopId}/customerLoyalty`);
    const q = query(
      collectionRef,
      where("currentStamps", ">=", config.stampsRequired)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data() as CustomerLoyalty);
  } catch (error) {
    console.error("Error getting customers ready to redeem:", error);
    return [];
  }
}
