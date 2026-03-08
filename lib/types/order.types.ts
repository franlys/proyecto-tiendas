
export type OrderStatus = "pending" | "confirmed" | "preparing" | "dispatched" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "refunded";

export interface SalesOrderItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    notes?: string; // Item-specific customization notes (e.g., "sin cebolla", "extra proteína")
}

export interface SalesOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerAddress?: string;
    items: SalesOrderItem[];
    subtotal: number;
    tax: number;
    total: number;
    status: OrderStatus;
    paymentStatus: PaymentStatus;
    paymentMethod?: string;
    notes?: string; // General order notes
    isWholesale: boolean;
    createdAt: string;
    updatedAt: string;
    confirmedAt?: string;
    dispatchedAt?: string;
    deliveredAt?: string;
    tableId?: string;
    source?: string;
    // Delivery & Scheduling (for meal prep, catering, etc.)
    deliveryType?: "pickup" | "delivery" | "entrega" | "recogida";
    scheduledDate?: string; // YYYY-MM-DD
    scheduledTime?: string; // HH:MM (delivery/pickup time slot)
    deliveryDistance?: number; // Distance in miles
    deliveryFee?: number; // Extra fee for distance
    deliveryCoordinates?: { lat: number; lng: number }; // Customer location
    paymentInfo?: {
        paymentTiming: "pay_now" | "pay_on_delivery";
        paymentMethodId?: string;
        paymentMethodName?: string;
        paymentMethodType?: string;
        receiptUrl?: string;
        status: "pending" | "pending_verification" | "verified" | "rejected";
    };
}
