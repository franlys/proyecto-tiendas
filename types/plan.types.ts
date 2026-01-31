// Límites de uso (opcional, para control futuro)
export interface ShopLimits {
  maxProducts: number;       // -1 = ilimitado
  maxStaff: number;          // -1 = ilimitado
  maxOrders: number;         // -1 = ilimitado (por mes)
  maxStorage: number;        // MB de almacenamiento
  maxCampaigns: number;      // -1 = ilimitado (por mes)
}

// Límites por defecto (ilimitados)
export const DEFAULT_LIMITS: ShopLimits = {
  maxProducts: -1,
  maxStaff: -1,
  maxOrders: -1,
  maxStorage: 5000,
  maxCampaigns: -1,
};
