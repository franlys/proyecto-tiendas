/**
 * Handler para detectar y procesar pedidos recibidos via WhatsApp
 *
 * Detecta mensajes con formato de pedido del carrito y los procesa
 */

import { adminDb } from "@/lib/firebase-admin";
import { sendTextMessage } from "@/lib/evolution";
import { FieldValue } from "firebase-admin/firestore";

// Patrones para detectar pedidos
const ORDER_PATTERNS = {
  // Patrón principal: "quiero hacer un pedido en *NombreTienda*"
  header: /(?:quiero\s+(?:hacer\s+)?(?:un\s+)?pedido|pedido\s+en)\s+\*?([^*\n:]+)\*?/i,
  // Productos: "- Producto (x2): $1,500"
  product: /^[-•]\s*(.+?)(?:\s*\(x(\d+)\))?:\s*\$?([\d,\.]+)/gm,
  // Total: "💰 *Total: $1,500*"
  total: /\*?total[:\s]*\$?([\d,\.]+)\*?/i,
  // Mesa: "📍 *Mesa 5*"
  table: /mesa\s*(\d+)/i,
};

export interface DetectedOrderItem {
  name: string;
  quantity: number;
  price: number;
}

export interface DetectedOrder {
  shopName: string;
  items: DetectedOrderItem[];
  total: number;
  tableId?: string;
  rawMessage: string;
}

export interface OrderHandlerResult {
  isOrder: boolean;
  order?: DetectedOrder;
  savedOrderId?: string;
  orderNumber?: string;
  error?: string;
}

/**
 * Detecta si un mensaje es un pedido del carrito
 */
export function detectOrder(message: string): DetectedOrder | null {
  // Verificar si tiene el patrón de encabezado de pedido
  const headerMatch = message.match(ORDER_PATTERNS.header);
  if (!headerMatch) return null;

  const shopName = headerMatch[1].trim();

  // Extraer productos
  const items: DetectedOrderItem[] = [];
  let productMatch;
  const productRegex = /^[-•]\s*(.+?)(?:\s*\[([^\]]+)\])?(?:\s*\(x(\d+)\))?:\s*\$?([\d,\.]+)/gm;

  while ((productMatch = productRegex.exec(message)) !== null) {
    const name = productMatch[1].trim();
    const variant = productMatch[2]; // Variante si existe
    const quantity = parseInt(productMatch[3] || "1");
    const price = parseFloat(productMatch[4].replace(/,/g, ""));

    items.push({
      name: variant ? `${name} (${variant})` : name,
      quantity,
      price,
    });
  }

  if (items.length === 0) return null;

  // Extraer total
  const totalMatch = message.match(ORDER_PATTERNS.total);
  const total = totalMatch
    ? parseFloat(totalMatch[1].replace(/,/g, ""))
    : items.reduce((sum, item) => sum + item.price, 0);

  // Extraer mesa si existe
  const tableMatch = message.match(ORDER_PATTERNS.table);
  const tableId = tableMatch ? tableMatch[1] : undefined;

  return {
    shopName,
    items,
    total,
    tableId,
    rawMessage: message,
  };
}

/**
 * Genera número de pedido único
 */
function generateOrderNumber(): string {
  const date = new Date();
  const datePart = date.toISOString().slice(2, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `WA-${datePart}-${random}`;
}

/**
 * Guarda el pedido en Firestore
 */
export async function saveWhatsAppOrder(
  shopId: string,
  order: DetectedOrder,
  customerPhone: string,
  customerName?: string
): Promise<{ orderId: string; orderNumber: string } | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const orderNumber = generateOrderNumber();
    const now = new Date().toISOString();

    const orderData = {
      orderNumber,
      source: "whatsapp",
      customerName: customerName || "Cliente WhatsApp",
      customerPhone,
      items: order.items.map(item => ({
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price / item.quantity,
        total: item.price,
      })),
      subtotal: order.total,
      tax: 0,
      total: order.total,
      status: "pending",
      paymentStatus: "pending",
      tableId: order.tableId || null,
      notes: order.tableId ? `Mesa ${order.tableId}` : null,
      rawMessage: order.rawMessage,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db
      .collection("shops")
      .doc(shopId)
      .collection("orders")
      .add(orderData);

    console.log(`[WhatsApp Order] Saved order ${orderNumber} for shop ${shopId}`);

    return {
      orderId: docRef.id,
      orderNumber,
    };
  } catch (error) {
    console.error("[WhatsApp Order] Error saving order:", error);
    return null;
  }
}

/**
 * Obtiene el teléfono personal del dueño de la tienda
 */
export async function getOwnerPhone(shopId: string): Promise<string | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    // Primero intentar desde whatsapp_bot/config
    const configDoc = await db
      .collection("shops")
      .doc(shopId)
      .collection("whatsapp_bot")
      .doc("config")
      .get();

    if (configDoc.exists) {
      const data = configDoc.data();
      if (data?.ownerNotificationPhone) {
        return data.ownerNotificationPhone;
      }
    }

    // Fallback: buscar en la tienda principal
    const shopDoc = await db.collection("shops").doc(shopId).get();
    if (shopDoc.exists) {
      const data = shopDoc.data();
      // Puede estar en contact.ownerPhone o en ownerPhone
      return data?.ownerPhone || data?.contact?.ownerPhone || null;
    }

    return null;
  } catch (error) {
    console.error("[WhatsApp Order] Error getting owner phone:", error);
    return null;
  }
}

/**
 * Genera mensaje de confirmación para el cliente
 */
export function generateCustomerConfirmation(
  orderNumber: string,
  order: DetectedOrder,
  shopName: string
): string {
  const itemsList = order.items
    .map(item => `  • ${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ""}`)
    .join("\n");

  return `✅ *¡Pedido Recibido!*

Tu pedido *#${orderNumber}* ha sido registrado en *${shopName}*.

📦 *Resumen:*
${itemsList}

💰 *Total:* $${order.total.toLocaleString()}
${order.tableId ? `📍 *Mesa:* ${order.tableId}` : ""}

Te contactaremos pronto para confirmar.
¡Gracias por tu compra! 🙏`;
}

/**
 * Genera mensaje de notificación para el dueño
 */
export function generateOwnerNotification(
  orderNumber: string,
  order: DetectedOrder,
  customerPhone: string,
  customerName?: string
): string {
  const itemsList = order.items
    .map(item => `  • ${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ""}: $${item.price.toLocaleString()}`)
    .join("\n");

  return `🔔 *NUEVO PEDIDO #${orderNumber}*

👤 *Cliente:* ${customerName || "No especificado"}
📱 *Teléfono:* ${customerPhone}
${order.tableId ? `📍 *Mesa:* ${order.tableId}` : ""}

📦 *Productos:*
${itemsList}

💰 *Total:* $${order.total.toLocaleString()}

⏰ ${new Date().toLocaleString("es-DO", { timeZone: "America/Santo_Domingo" })}

_Revisa el panel de administración para más detalles._`;
}

/**
 * Crea una notificación en Firestore para el panel admin
 */
export async function createAdminNotification(
  shopId: string,
  orderNumber: string,
  order: DetectedOrder,
  customerPhone: string,
  customerName?: string
): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;

  try {
    await db
      .collection("shops")
      .doc(shopId)
      .collection("notifications")
      .add({
        type: "new_order",
        title: `Nuevo Pedido #${orderNumber}`,
        message: `${customerName || "Cliente"} - $${order.total.toLocaleString()}`,
        data: {
          orderNumber,
          customerPhone,
          customerName,
          total: order.total,
          itemCount: order.items.length,
          tableId: order.tableId,
        },
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

    return true;
  } catch (error) {
    console.error("[WhatsApp Order] Error creating notification:", error);
    return false;
  }
}

/**
 * Procesa un pedido completo: detectar, guardar y notificar
 */
export async function processWhatsAppOrder(
  instanceName: string,
  shopId: string,
  message: string,
  customerPhone: string,
  customerName?: string
): Promise<OrderHandlerResult> {
  // 1. Detectar si es un pedido
  const order = detectOrder(message);

  if (!order) {
    return { isOrder: false };
  }

  console.log(`[WhatsApp Order] Detected order from ${customerPhone}:`, {
    items: order.items.length,
    total: order.total,
  });

  // 2. Guardar en Firestore
  const savedOrder = await saveWhatsAppOrder(shopId, order, customerPhone, customerName);

  if (!savedOrder) {
    return {
      isOrder: true,
      order,
      error: "Failed to save order",
    };
  }

  // 3. Enviar confirmación al cliente
  try {
    const customerMessage = generateCustomerConfirmation(
      savedOrder.orderNumber,
      order,
      order.shopName
    );
    await sendTextMessage(instanceName, customerPhone, customerMessage);
    console.log(`[WhatsApp Order] Sent confirmation to customer ${customerPhone}`);
  } catch (error) {
    console.error("[WhatsApp Order] Error sending customer confirmation:", error);
  }

  // 4. Notificar al dueño por WhatsApp
  try {
    const ownerPhone = await getOwnerPhone(shopId);

    if (ownerPhone) {
      const ownerMessage = generateOwnerNotification(
        savedOrder.orderNumber,
        order,
        customerPhone,
        customerName
      );
      await sendTextMessage(instanceName, ownerPhone, ownerMessage);
      console.log(`[WhatsApp Order] Sent notification to owner ${ownerPhone}`);
    } else {
      console.log(`[WhatsApp Order] No owner phone configured for shop ${shopId}`);
    }
  } catch (error) {
    console.error("[WhatsApp Order] Error notifying owner:", error);
  }

  // 5. Crear notificación en el panel admin
  await createAdminNotification(shopId, savedOrder.orderNumber, order, customerPhone, customerName);

  return {
    isOrder: true,
    order,
    savedOrderId: savedOrder.orderId,
    orderNumber: savedOrder.orderNumber,
  };
}
