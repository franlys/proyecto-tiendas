export type WholesaleRequestStatus = "pending" | "approved" | "rejected";

export interface WholesaleRequest {
  id: string;
  shopId: string;
  fullName: string;
  phone: string;
  businessName?: string;
  rnc?: string;
  message?: string;
  status: WholesaleRequestStatus;
  createdAt: any;
  updatedAt?: any;
  adminNotes?: string;
  wholesaleCode?: string; // assigned by admin on approval
}
