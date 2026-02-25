import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    getDoc,
    setDoc,
    runTransaction,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";

export interface OrderItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
    variant?: string;
}

export interface Order {
    id: string;
    shopId: string;
    orderNumber: string; // Formato: MN-1001
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    customerEmail?: string;
    items: OrderItem[];
    total: number;
    status: "pending" | "confirmed" | "preparing" | "dispatched" | "delivered" | "cancelled";
    paymentStatus: "pending" | "paid" | "failed";
    paymentMethod?: string;
    notes?: string;
    deliveryType?: "entrega" | "recogida";
    createdAt: string;
    updatedAt: string;
}

/**
 * Genera el siguiente número de pedido para una tienda usando una transacción
 */
export async function generateOrderNumber(shopId: string, shopSlug: string): Promise<string> {
    const shopRef = doc(db, "shops", shopId);

    return await runTransaction(db, async (transaction) => {
        const shopDoc = await transaction.get(shopRef);
        if (!shopDoc.exists()) {
            throw new Error("La tienda no existe");
        }

        const data = shopDoc.data();
        // Iniciar en 1000 por defecto
        const currentNumber = data.lastOrderNumber || 1000;
        const nextNumber = currentNumber + 1;

        // Actualizar el contador en la tienda
        transaction.update(shopRef, { lastOrderNumber: nextNumber });

        // Generar prefijo basado en slug (primeras 2-3 letras de palabras separadas por -)
        const prefix = shopSlug
            .split("-")
            .map(word => word[0])
            .join("")
            .toUpperCase();

        return `${prefix}-${nextNumber}`;
    });
}

/**
 * Crea un nuevo pedido en Firestore
 */
export async function createOrder(shopId: string, shopSlug: string, orderData: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">): Promise<Order> {
    const orderNumber = await generateOrderNumber(shopId, shopSlug);

    const orderRef = doc(collection(db, "shops", shopId, "orders"));
    const newOrderData = {
        ...orderData,
        orderNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(orderRef, newOrderData);

    return {
        id: orderRef.id,
        ...orderData,
        orderNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as Order;
}
