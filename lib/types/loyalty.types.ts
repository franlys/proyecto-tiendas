// Loyalty System Types

export interface LoyaltyConfig {
  enabled: boolean;
  stampsRequired: number; // Cuántos sellos para una recompensa (default 10)
  reward: string; // Descripción de la recompensa ("Servicio Gratis", "20% Descuento")
  rewardType: "discount" | "freeService" | "freeProduct" | "custom";
  rewardValue: number; // Porcentaje de descuento o valor fijo
  stampsPerOrder: number; // Cuántos sellos por pedido (default 1)
  stampsPerAmount?: number; // Opcional: 1 sello por cada X pesos gastados
  minimumOrderAmount?: number; // Monto mínimo de pedido para ganar sellos
  expirationDays?: number; // Días para que expiren los sellos (0 = nunca)
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyStamp {
  id: string;
  date: string;
  orderId: string;
  orderNumber: string;
  amount: number; // Monto del pedido
  stampsEarned: number;
}

export interface LoyaltyRedemption {
  id: string;
  date: string;
  reward: string;
  rewardType: LoyaltyConfig["rewardType"];
  rewardValue: number;
  orderId?: string; // Pedido donde se aplicó el descuento
}

export interface CustomerLoyalty {
  phone: string;
  shopId: string;
  currentStamps: number;
  totalStampsEarned: number;
  totalRewardsRedeemed: number;
  stampHistory: LoyaltyStamp[];
  redemptionHistory: LoyaltyRedemption[];
  lastStampDate?: string;
  nextRewardAt: number; // Cuántos sellos faltan para la próxima recompensa
  createdAt: string;
  updatedAt: string;
}

// Default config para nuevas tiendas
export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  enabled: false,
  stampsRequired: 10,
  reward: "Servicio Gratis",
  rewardType: "freeService",
  rewardValue: 100, // 100% = gratis
  stampsPerOrder: 1,
  minimumOrderAmount: 0,
  expirationDays: 0, // Nunca expiran
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Para mostrar en UI
export interface LoyaltyCardData {
  customerPhone: string;
  customerName?: string;
  shopName: string;
  currentStamps: number;
  stampsRequired: number;
  reward: string;
  canRedeem: boolean;
  nextRewardAt: number;
}
