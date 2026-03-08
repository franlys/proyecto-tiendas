import { db } from "@/lib/firebase";
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    runTransaction,
    serverTimestamp,
    Timestamp,
    increment,
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
    deliveryType?: "entrega" | "recogida" | "pickup" | "delivery";
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
 * Decrementa el stock de los productos de un pedido
 * @param shopId - ID de la tienda
 * @param items - Array de items con productId y quantity
 */
export async function decrementStockForOrder(
    shopId: string,
    items: Array<{ productId: string; quantity: number; variantId?: string }>
): Promise<void> {
    for (const item of items) {
        // Skip if productId is "manual" (productos agregados manualmente)
        if (!item.productId || item.productId === "manual") continue;

        try {
            const productRef = doc(db, "shops", shopId, "products", item.productId);
            const productSnap = await getDoc(productRef);

            if (!productSnap.exists()) {
                console.warn(`[Stock] Product ${item.productId} not found for shop ${shopId}`);
                continue;
            }

            const productData = productSnap.data();

            // Skip if product has infinite stock
            if (productData.infiniteStock === true) {
                console.log(`[Stock] Product ${item.productId} has infinite stock, skipping decrement`);
                continue;
            }

            // If variant is specified, update variant stock
            if (item.variantId && productData.variants) {
                const variants = productData.variants as Array<{ id: string; stock?: number }>;
                const variantIndex = variants.findIndex(v => v.id === item.variantId);

                if (variantIndex !== -1 && typeof variants[variantIndex].stock === 'number') {
                    const newVariantStock = Math.max(0, (variants[variantIndex].stock || 0) - item.quantity);
                    variants[variantIndex].stock = newVariantStock;

                    await updateDoc(productRef, {
                        variants,
                        updatedAt: serverTimestamp()
                    });

                    console.log(`[Stock] Decremented variant ${item.variantId} stock by ${item.quantity}, new stock: ${newVariantStock}`);
                }
            } else if (typeof productData.stock === 'number') {
                // Update main product stock
                const newStock = Math.max(0, productData.stock - item.quantity);

                await updateDoc(productRef, {
                    stock: newStock,
                    updatedAt: serverTimestamp()
                });

                console.log(`[Stock] Decremented product ${item.productId} stock by ${item.quantity}, new stock: ${newStock}`);
            }
        } catch (err) {
            console.error(`[Stock] Error decrementing stock for product ${item.productId}:`, err);
            // Don't throw - we don't want to fail the order because of stock update failure
        }
    }
}

/**
 * Recursively removes undefined values from an object (Firestore doesn't accept undefined)
 */
function removeUndefined<T extends Record<string, any>>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
        return obj.map(item => removeUndefined(item)) as unknown as T;
    }
    return Object.fromEntries(
        Object.entries(obj)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, typeof value === 'object' ? removeUndefined(value) : value])
    ) as T;
}

/**
 * Crea un nuevo pedido en Firestore
 */
export async function createOrder(shopId: string, shopSlug: string, orderData: Omit<Order, "id" | "orderNumber" | "createdAt" | "updatedAt">): Promise<Order> {
    const orderNumber = await generateOrderNumber(shopId, shopSlug);

    const orderRef = doc(collection(db, "shops", shopId, "orders"));

    // Clean orderData to remove any undefined values (Firestore doesn't accept undefined)
    const cleanedOrderData = removeUndefined(orderData);

    const newOrderData = {
        ...cleanedOrderData,
        orderNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    await setDoc(orderRef, newOrderData);

    // Decrement stock for each item in the order
    if (orderData.items && orderData.items.length > 0) {
        const stockItems = orderData.items.map((item: any) => ({
            productId: item.productId || item.id,
            quantity: item.quantity || 1,
            variantId: item.variantId
        }));

        await decrementStockForOrder(shopId, stockItems);
    }

    return {
        id: orderRef.id,
        ...orderData,
        orderNumber,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    } as Order;
}
