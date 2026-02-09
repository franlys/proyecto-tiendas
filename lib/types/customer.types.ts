/**
 * Customer Types
 * Manages customer information for personalized interactions
 */

export interface Customer {
    id: string;
    phone: string; // WhatsApp number (without country code prefix like +)
    name: string;
    email?: string;

    // Stats
    totalOrders: number;
    totalSpent: number;
    lastOrderAt?: string;

    // Delivery info
    defaultAddress?: CustomerAddress;
    savedAddresses?: CustomerAddress[];

    // Preferences
    preferredContactMethod?: "whatsapp" | "email" | "both";
    notes?: string;
    tags?: string[]; // e.g., "vip", "frequent", "wholesale"

    // Metadata
    source: "whatsapp" | "web" | "manual";
    registrationState?: "completed" | "pending_name";
    createdAt: string;
    updatedAt: string;
}

export interface CustomerAddress {
    id: string;
    label?: string; // "Casa", "Trabajo", etc.
    street: string;
    city?: string;
    sector?: string;
    reference?: string; // "Frente al colmado", etc.
    coordinates?: {
        lat: number;
        lng: number;
    };
    isDefault?: boolean;
}

export interface CustomerConversationState {
    phone: string;
    state: "idle" | "awaiting_name" | "awaiting_address" | "awaiting_delivery_confirmation";
    pendingData?: {
        orderId?: string;
        orderNumber?: string;
        deliveryFee?: number;
    };
    stateExpiresAt: string;
    updatedAt: string;
}

// Order status flow
export type OrderStatus =
    | "pending"      // Recién recibido
    | "confirmed"    // Confirmado por el negocio
    | "preparing"    // En preparación
    | "ready"        // Listo para recoger/entregar
    | "out_for_delivery" // En camino (si es delivery)
    | "delivered"    // Entregado
    | "picked_up"    // Recogido en tienda
    | "cancelled";   // Cancelado

export interface OrderStatusUpdate {
    status: OrderStatus;
    timestamp: string;
    updatedBy?: string; // staff id or "system"
    note?: string;
}

export interface DeliveryInfo {
    type: "pickup" | "delivery";
    address?: CustomerAddress;
    fee?: number;
    estimatedTime?: string;
    driverName?: string;
    driverPhone?: string;
}
