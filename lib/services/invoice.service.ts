import { SalesOrder, SalesOrderItem } from "@/lib/types/order.types";
import { sendTextMessage } from "@/lib/evolution";

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
        style: "currency",
        currency: "DOP",
    }).format(amount);
};

/**
 * Sends a text-based invoice/receipt to the customer via WhatsApp.
 */
export async function sendInvoiceWhatsApp(shopId: string, order: SalesOrder, instanceName?: string) {
    // If instance not provided, we might need to look it up or pass it.
    // Ideally, this service is called from a context where we know the instance.
    // OR we look it up by shopId.

    // For now, let's assume we can derive instance from shopId or pass it.
    // Actually, better to pass instanceName if possible, or lookup.
    // Lookup logic: shopId -> slug -> shop_[slug]_v2

    import { getInstanceName } from "@/lib/evolution";

    // ... existing code ...

    let targetInstance = instanceName;
    if (!targetInstance) {
        const { getShopBasicInfo } = await import("@/lib/services/whatsapp-config.service");
        const shop = await getShopBasicInfo(shopId);
        if (shop) {
            // VERSION 3 UPDATE: Use centralized helper
            targetInstance = getInstanceName(shop.slug);
        }
    }

    if (!targetInstance) {
        console.error("[Invoice] Could not determine instance for shop", shopId);
        return;
    }

    const customerPhone = order.customerPhone;
    if (!customerPhone) return;

    const itemsList = order.items.map(item =>
        `• ${item.quantity}x ${item.productName} - $${item.total}`
    ).join("\n");

    const message = `
🧾 *RECIBO DE PAGO* 
*Orden #${order.orderNumber}*

Hola *${order.customerName}*, hemos recibido tu pago correctamente. ✅

*Detalle:*
${itemsList}

*Subtotal:* $${order.subtotal}
*Envío:* $0 (Confirmar si aplica)
*Total:* $${order.total}

Fecha: ${new Date().toLocaleDateString("es-ES")}

¡Gracias por tu compra! ❤️
`;

    await sendTextMessage(targetInstance, customerPhone, message);
}
