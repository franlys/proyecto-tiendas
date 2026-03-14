// ─── Branch (Sucursal) Types ──────────────────────────────────────────────────

export interface Branch {
  id: string;
  shopId: string;
  name: string;            // "Sucursal Centro", "Gonzalez Smartphones Norte"
  address: string;
  phone?: string;
  whatsapp?: string;
  coordinates?: { lat: number; lng: number };
  isActive: boolean;
  isMain: boolean;         // Sucursal principal/matriz
  schedule?: BranchSchedule;
  createdAt: string;
  updatedAt: string;
}

export interface BranchSchedule {
  monday?:    { open: string; close: string; closed?: boolean };
  tuesday?:   { open: string; close: string; closed?: boolean };
  wednesday?: { open: string; close: string; closed?: boolean };
  thursday?:  { open: string; close: string; closed?: boolean };
  friday?:    { open: string; close: string; closed?: boolean };
  saturday?:  { open: string; close: string; closed?: boolean };
  sunday?:    { open: string; close: string; closed?: boolean };
}

// Stock de un producto en una sucursal específica
export interface BranchStockEntry {
  id: string;              // "{branchId}__{productId}"
  branchId: string;
  productId: string;
  quantity: number;
  updatedAt: string;
}

export interface CreateBranchInput {
  name: string;
  address: string;
  phone?: string;
  whatsapp?: string;
  coordinates?: { lat: number; lng: number };
  isMain?: boolean;
  schedule?: BranchSchedule;
}
