import { NextRequest, NextResponse } from "next/server";
import { getShopById } from "@/lib/services/shops.service";
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

        // 2. Obtener información de la tienda
        const shop = await getShopById(shopId);
        if (!shop) {
            return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
        }

        // 3. Crear el pedido internamente (genera ID secuencial)
        const order = await createOrder(shopId, shop.slug, {
            shopId,
            customerName,
            customerPhone,
            customerAddress,
            customerEmail,
            items,
            total,
            status: "pending",
            paymentStatus: "pending",
            notes,
            deliveryType,
        });

        // 4. Notificar al Cliente vía WhatsApp (Evolution API)
        if (isEvolutionConfigured()) {
            const instanceName = getInstanceName(shop.slug);
            const cleanPhone = formatPhoneForWhatsApp(customerPhone);

            let clientMsg = `¡Hola ${customerName}! 👋\n\n`;
            clientMsg += `Hemos recibido tu pedido *#${order.orderNumber}* en *${shop.name}*.\n\n`;
            clientMsg += `📦 Modo: *${deliveryType === "recogida" ? "Pasar a recoger" : "Entrega a domicilio"}*\n`;
            if (deliveryType === "entrega" && customerAddress) {
                clientMsg += `📍 Dirección: ${customerAddress}\n`;
            }
            clientMsg += `💰 Total: $${total.toLocaleString()}\n`;
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
            ownerMsg += `Teléfono: ${customerPhone}\n`;
            ownerMsg += `Tipo: *${deliveryType === "recogida" ? "Para Recoger" : "Dírecto a Domicilio"}*\n`;
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
