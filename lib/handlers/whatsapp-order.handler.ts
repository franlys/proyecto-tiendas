/**
 * Handler para detectar y procesar pedidos recibidos via WhatsApp
 *
 * Detecta mensajes con formato de pedido del carrito y los procesa
 */

import { adminDb } from "@/lib/firebase-admin";
import { sendTextMessage } from "@/lib/evolution";
import { FieldValue } from "firebase-admin/firestore";
import { sendOrderPushNotification } from "@/lib/services/push-notification.service";

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

interface NotificationPhone {
  phone: string;
  name: string;
  role?: string;
}

/**
 * Obtiene todos los teléfonos para notificaciones (dueño + staff)
 */
export async function getAllNotificationPhones(shopId: string): Promise<NotificationPhone[]> {
  const db = adminDb();
  if (!db) {
    console.error("[WhatsApp Order] No database connection");
    return [];
  }

  const phones: NotificationPhone[] = [];
  const addedPhones = new Set<string>(); // Track added phones to avoid duplicates

  // Import formatPhoneForWhatsApp
  const { formatPhoneForWhatsApp } = await import("@/lib/utils");

  const addPhone = (phone: string, name: string, role: string) => {
    if (!phone) return;

    // Normalize phone number using strict detailed formatting
    const normalizedPhone = formatPhoneForWhatsApp(phone);

    if (normalizedPhone && !addedPhones.has(normalizedPhone)) {
      addedPhones.add(normalizedPhone);
      phones.push({ phone: normalizedPhone, name, role });
      console.log(`[WhatsApp Order] Added notification phone: ${name} (${role}): ${normalizedPhone}`);
    }
  };

  try {
    // 1. Obtener configuración de WhatsApp Bot
    const configDoc = await db
      .collection("shops")
      .doc(shopId)
      .collection("whatsapp_bot")
      .doc("config")
      .get();

    if (configDoc.exists) {
      const data = configDoc.data();
      console.log(`[WhatsApp Order] Found whatsapp_bot config for ${shopId}`);

      // Agregar teléfono del dueño si existe
      if (data?.ownerNotificationPhone) {
        addPhone(data.ownerNotificationPhone, "Dueño", "owner");
      }

      // Agregar teléfonos de staff habilitados
      if (data?.staffNotificationPhones && Array.isArray(data.staffNotificationPhones)) {
        for (const staff of data.staffNotificationPhones) {
          if (staff.enabled && staff.phone) {
            addPhone(staff.phone, staff.name || "Staff", staff.role || "staff");
          }
        }
      }
    } else {
      console.log(`[WhatsApp Order] No whatsapp_bot config found for ${shopId}`);
    }

    // 2. Si no se encontró teléfono del dueño, buscar en el documento de la tienda
    if (!phones.some(p => p.role === "owner")) {
      console.log(`[WhatsApp Order] No owner phone from config, checking shop document...`);

      const shopDoc = await db.collection("shops").doc(shopId).get();
      if (shopDoc.exists) {
        const data = shopDoc.data();

        // Buscar en múltiples campos posibles
        const ownerPhone =
          data?.ownerNotificationPhone ||
          data?.ownerPhone ||
          data?.contact?.ownerPhone ||
          data?.contact?.phone;

        if (ownerPhone) {
          addPhone(ownerPhone, data?.name || "Dueño", "owner");
        } else {
          console.warn(`[WhatsApp Order] No owner phone found in shop document for ${shopId}`);
          console.log(`[WhatsApp Order] Shop data keys: ${Object.keys(data || {}).join(", ")}`);
        }
      } else {
        console.error(`[WhatsApp Order] Shop document not found: ${shopId}`);
      }
    }

    console.log(`[WhatsApp Order] Total notification phones for ${shopId}: ${phones.length}`);
    return phones;
  } catch (error) {
    console.error("[WhatsApp Order] Error getting notification phones:", error);
    return [];
  }
}

/**
 * Obtiene el teléfono personal del dueño de la tienda (legacy - mantener compatibilidad)
 */
export async function getOwnerPhone(shopId: string): Promise<string | null> {
  const phones = await getAllNotificationPhones(shopId);
  const owner = phones.find(p => p.role === "owner");
  return owner?.phone || phones[0]?.phone || null;
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
 * Obtiene el nombre del cliente desde Firestore (si está registrado)
 */
async function getRegisteredCustomerName(shopId: string, phone: string): Promise<string | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const snapshot = await db
      .collection("shops")
      .doc(shopId)
      .collection("customers")
      .where("phone", "==", phone)
      .where("registrationState", "==", "completed")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const customer = snapshot.docs[0].data();
      return customer.name || null;
    }
  } catch (error) {
    console.error("[WhatsApp Order] Error getting customer name:", error);
  }

  return null;
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

  // Obtener nombre registrado del cliente (si existe)
  const registeredName = await getRegisteredCustomerName(shopId, customerPhone);
  const finalCustomerName = registeredName || customerName || "Cliente WhatsApp";

  console.log(`[WhatsApp Order] Detected order from ${customerPhone} (${finalCustomerName}):`, {
    items: order.items.length,
    total: order.total,
  });

  // 2. Guardar en Firestore
  const savedOrder = await saveWhatsAppOrder(shopId, order, customerPhone, finalCustomerName);

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

  // 4. Notificar a TODOS los teléfonos configurados (dueño + staff)
  try {
    const notificationPhones = await getAllNotificationPhones(shopId);

    if (notificationPhones.length > 0) {
      const staffMessage = generateOwnerNotification(
        savedOrder.orderNumber,
        order,
        customerPhone,
        finalCustomerName
      );

      // Enviar a todos en paralelo
      const notificationPromises = notificationPhones.map(async (staff) => {
        try {
          await sendTextMessage(instanceName, staff.phone, staffMessage);
          console.log(`[WhatsApp Order] Sent notification to ${staff.name} (${staff.role}): ${staff.phone}`);
          return { success: true, phone: staff.phone };
        } catch (error) {
          console.error(`[WhatsApp Order] Failed to notify ${staff.phone}:`, error);
          return { success: false, phone: staff.phone, error };
        }
      });

      const results = await Promise.all(notificationPromises);
      const successCount = results.filter(r => r.success).length;
      console.log(`[WhatsApp Order] Notified ${successCount}/${notificationPhones.length} staff members`);
    } else {
      console.log(`[WhatsApp Order] No notification phones configured for shop ${shopId}`);
    }
  } catch (error) {
    console.error("[WhatsApp Order] Error notifying staff:", error);
  }

  // 5. Crear notificación en el panel admin
  await createAdminNotification(shopId, savedOrder.orderNumber, order, customerPhone, finalCustomerName);

  // 6. Enviar push notification a dispositivos suscritos
  try {
    const pushResult = await sendOrderPushNotification(
      shopId,
      savedOrder.orderNumber,
      finalCustomerName,
      order.total
    );
    if (pushResult.sent > 0) {
      console.log(`[WhatsApp Order] Push notification sent to ${pushResult.sent} devices`);
    }
  } catch (error) {
    console.error("[WhatsApp Order] Error sending push notification:", error);
  }

  return {
    isOrder: true,
    order,
    savedOrderId: savedOrder.orderId,
    orderNumber: savedOrder.orderNumber,
  };
}
