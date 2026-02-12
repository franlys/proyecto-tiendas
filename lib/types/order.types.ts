
export type OrderStatus = "pending" | "confirmed" | "preparing" | "dispatched" | "delivered" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "refunded";

export interface SalesOrderItem {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
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
    notes?: string;
    isWholesale: boolean;
    createdAt: string;
    updatedAt: string;
    confirmedAt?: string;
    dispatchedAt?: string;
    deliveredAt?: string;
    tableId?: string;
    source?: string;
}
