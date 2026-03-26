export type QuoteRequestStatus = "pending" | "in_progress" | "responded" | "closed";
export type ContactPreference = "email" | "whatsapp";

export interface QuoteRequest {
  id: string;
  shopId: string;
  customerName: string;
  contactPreference: ContactPreference;
  email?: string;
  phone?: string;
  category: string;
  description: string;
  status: QuoteRequestStatus;
  createdAt: any;
  updatedAt?: any;
  adminNotes?: string;
}
