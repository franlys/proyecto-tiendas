import { NextRequest, NextResponse } from "next/server";
import { getShopById, getShopBySlug } from "@/lib/services/shops.service";
import { createOrder, Order } from "@/lib/services/orders.service";
import { sendTextMessage, isEvolutionConfigured, getInstanceName } from "@/lib/evolution";
import { sendEmail, emailTemplates } from "@/lib/email";
import { formatPhoneForWhatsApp } from "@/lib/utils";

interface ConfirmOrderRequest {
    shopId: string;
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    customerEmail?: string;
    items: any[];
    total: number;
    notes?: string;
    type?: "order" | "training";
    deliveryType?: "entrega" | "recogida";
}

export async function POST(request: NextRequest) {
    try {
        const body: ConfirmOrderRequest = await request.json();
        const {
            shopId,
            customerName,
            customerPhone,
            customerAddress,
            customerEmail,
            items,
            total,
            notes,
            type = "order",
            deliveryType = "entrega"
        } = body;

        // 1. Validaciones básicas
        if (!shopId || !customerName || !customerPhone) {
            return NextResponse.json(
                { error: "Faltan campos obligatorios: shopId, customerName, customerPhone" },
                { status: 400 }
            );
        }

        // 2. Obtener información de la tienda (ID Real de Firestore)
        let shop = await getShopById(shopId);
        if (!shop) {
            shop = await getShopBySlug(shopId);
        }

        if (!shop) {
            return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
        }

        // 3. Crear el pedido internamente (genera ID secuencial)
        // Mapear items al formato esperado por el dashboard administrativo (SalesOrderItem)
        const mappedItems = items.map((item: any) => ({
            productId: item.id || "manual",
            productName: item.name || "Producto",
            quantity: item.quantity || 1,
            unitPrice: item.price || 0,
            total: (item.price || 0) * (item.quantity || 1),
            notes: item.notes || ""
        }));

        const orderData: any = {
            shopId: shop.id, // Siempre usar el ID de Firestore, no el slug
            customerName,
            customerPhone,
            items: mappedItems,
            subtotal: total, // Si no se desglosa IVA, subtotal = total
            tax: 0,
            total,
            status: "pending",
            paymentStatus: "pending",
            deliveryType,
            source: "web"
        };

        if (customerAddress) orderData.customerAddress = customerAddress;
        if (customerEmail) orderData.customerEmail = customerEmail;
        if (notes) orderData.notes = notes;

        const order = await createOrder(shop.id, shop.slug, orderData);

        // 4. Notificar al Cliente vía WhatsApp (Evolution API)
        if (isEvolutionConfigured()) {
            const instanceName = getInstanceName(shop.slug);
            const cleanPhone = formatPhoneForWhatsApp(customerPhone);

            let clientMsg = `¡Hola ${customerName}! 👋\n\n`;
            clientMsg += `Hemos recibido tu pedido *#${order.orderNumber}* en *${shop.name}*.\n\n`;
            clientMsg += `📝 *Detalle del pedido:*\n`;
            items.forEach(item => {
                clientMsg += `• ${item.name} ($${item.price.toLocaleString()})\n`;
            });
            clientMsg += `\n📦 Modo: *${deliveryType === "recogida" ? "Pasar a recoger" : "Entrega a domicilio"}*\n`;
            if (deliveryType === "entrega" && customerAddress) {
                clientMsg += `📍 Dirección: ${customerAddress}\n`;
            }
            clientMsg += `💰 Total: *$${total.toLocaleString()}*\n`;
            clientMsg += `📝 Estado: *Pendiente de revisión*\n\n`;
            clientMsg += `Te notificaremos pronto sobre los siguientes pasos. ¡Gracias por tu confianza!`;

            try {
                await sendTextMessage(instanceName, cleanPhone, clientMsg);
            } catch (waError) {
                console.error("Error enviando WhatsApp al cliente:", waError);
            }
        }

        // 5. Notificar al Dueño vía Email
        if (shop.contact.email) {
            try {
                const emailContent = emailTemplates.orderConfirmation({
                    clientName: customerName,
                    orderNumber: order.orderNumber,
                    items: items.map(i => ({ name: i.name, quantity: i.quantity || 1, price: i.price })),
                    total: total,
                    shopName: shop.name
                });

                await sendEmail({
                    to: shop.contact.email,
                    subject: `Nuevo pedido recibido: #${order.orderNumber}`,
                    html: emailContent
                });
            } catch (emailError) {
                console.error("Error enviando email al dueño:", emailError);
            }
        }

        // 6. Notificar al Dueño vía WhatsApp (Opcional pero recomendado)
        if (isEvolutionConfigured() && shop.contact.phone) {
            const instanceName = getInstanceName(shop.slug);
            const ownerPhone = formatPhoneForWhatsApp(shop.contact.phone);

            let ownerMsg = `🔔 *¡NUEVO PEDIDO RECIBIDO!* 🔥\n\n`;
            ownerMsg += `Número: *#${order.orderNumber}*\n`;
            ownerMsg += `Cliente: ${customerName}\n`;
            ownerMsg += `Teléfono: ${customerPhone}\n\n`;
            ownerMsg += `📝 *Pedido:*\n`;
            items.forEach(item => {
                ownerMsg += `• ${item.name} ($${item.price.toLocaleString()})\n`;
            });
            ownerMsg += `\nTipo: *${deliveryType === "recogida" ? "Para Recoger" : "Dírecto a Domicilio"}*\n`;
            if (customerAddress) {
                ownerMsg += `📍 Direcc: ${customerAddress}\n`;
            }
            ownerMsg += `Total: *$${total.toLocaleString()}*\n\n`;
            ownerMsg += `Revisa los detalles en tu panel de administración.`;

            try {
                await sendTextMessage(instanceName, ownerPhone, ownerMsg);
            } catch (waError) {
                console.error("Error enviando WhatsApp al dueño:", waError);
            }
        }

        return NextResponse.json({
            success: true,
            orderId: order.id,
            orderNumber: order.orderNumber,
            message: "Pedido procesado y notificaciones enviadas"
        });

    } catch (error: any) {
        console.error("Error en API /orders/confirm:", error);
        return NextResponse.json(
            { error: error.message || "Error interno del servidor" },
            { status: 500 }
        );
    }
}
