export interface Wholesaler {
  id: string;
  shopId: string;
  name: string;
  email?: string;
  phone?: string;
  code: string; // Unique access code
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWholesalerInput {
  name: string;
  email?: string;
  phone?: string;
  code: string;
  notes?: string;
}
