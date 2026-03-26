export type FinancingStatus = "submitted" | "bank_confirmed" | "client_contacted" | "approved" | "rejected";

export interface FinancingApplication {
  id: string;
  shopId: string;
  // Form fields
  requestDate: string;        // ISO date string
  fullName: string;
  cedula: string;
  address: string;
  referencia: string;
  phone: string;
  celular: string;
  workplace: string;
  articleDescription: string;
  totalAmount: number;
  // Meta
  status: FinancingStatus;
  createdAt: any;
  updatedAt?: any;
  adminNotes?: string;
}

export interface FinancingConfig {
  bankEmail: string;
  bankName: string;           // e.g. "BANFONDESA"
  enabled: boolean;
}
