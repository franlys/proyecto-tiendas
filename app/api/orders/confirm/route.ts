import { NextRequest, NextResponse } from "next/server";
import { getShopById, getShopBySlug } from "@/lib/services/shops.service";
import { createOrder, Order } from "@/lib/services/orders.service";
import { sendTextMessage, sendDocument, isEvolutionConfigured, getInstanceName } from "@/lib/evolution";
import { sendEmail, emailTemplates } from "@/lib/email";
import { formatPhoneForWhatsApp } from "@/lib/utils";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { generateOrderInvoiceBuffer } from "@/lib/services/pdf.service";
import { getDownloadURL } from "firebase-admin/storage";
import { ref, uploadBytes } from "firebase/storage";

interface PaymentInfo {
    paymentTiming: "pay_now" | "pay_on_delivery";
    paymentMethodId?: string;
    paymentMethodName?: string;
    paymentMethodType?: string;
    receiptUrl?: string;
    status: "pending" | "pending_verification" | "verified" | "rejected";
}

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
    deliveryType?: "entrega" | "recogida" | "pickup" | "delivery";
    deliveryDate?: string;
    deliveryTime?: string;
    paymentInfo?: PaymentInfo;
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
            deliveryType = "entrega",
            deliveryDate,
            deliveryTime,
            paymentInfo
        } = body;

        // 1. Validaciones básicas
        if (!shopId || !customerName || !customerPhone || !customerEmail) {
            return NextResponse.json(
                { error: "Faltan campos obligatorios: shopId, customerName, customerPhone, customerEmail" },
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
        // Note: Only include fields that have values to avoid Firestore undefined errors
        const mappedItems = items.map((item: any) => {
            const mappedItem: Record<string, any> = {
                productId: item.id || "manual",
                productName: item.name || "Producto",
                quantity: item.quantity || 1,
                unitPrice: item.price || 0,
                total: (item.price || 0) * (item.quantity || 1),
                notes: item.notes || ""
            };
            // Only add variantId if it exists (Firestore doesn't accept undefined)
            if (item.variantId) {
                mappedItem.variantId = item.variantId;
            }
            return mappedItem;
        });

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
            deliveryDate,
            deliveryTime,
            source: "web"
        };

        const deliveryTypeLabel = (deliveryType === "recogida" || deliveryType === "pickup") ? "Recoger en tienda" : "Entrega a domicilio";
        const ownerDeliveryLabel = (deliveryType === "recogida" || deliveryType === "pickup") ? "Para Recoger" : "Directo a Domicilio";

        if (customerAddress) orderData.customerAddress = customerAddress;
        if (customerEmail) orderData.customerEmail = customerEmail;
        if (notes) orderData.notes = notes;
        if (paymentInfo) orderData.paymentInfo = paymentInfo;

        const order = await createOrder(shop.id, shop.slug, orderData);

        // 3.5 Create in-app notification for admin panel
        try {
            const db = adminDb();
            if (db) {
                await db.collection("shops").doc(shop.id).collection("notifications").add({
                    type: "new_order",
                    title: "Nuevo Pedido Web",
                    message: `Pedido #${order.orderNumber} de ${customerName} - $${total.toLocaleString()}`,
                    read: false,
                    createdAt: new Date().toISOString(),
                    data: {
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        customerName,
                        customerPhone,
                        total,
                        deliveryType,
                        source: "web"
                    }
                });
                console.log(`[Orders] In-app notification created for order #${order.orderNumber}`);
            }
        } catch (notifError) {
            console.error("Error creating in-app notification:", notifError);
            // Don't fail the order if notification creation fails
        }

        // 3.6 Generate PDF Invoice and Upload to Storage
        let pdfDownloadUrl = null;
        let pdfBuffer = null;
        try {
            console.log(`[Orders] Generating PDF Invoice for order #${order.orderNumber}...`);
            pdfBuffer = await generateOrderInvoiceBuffer(order, shop);

            if (pdfBuffer) {
                console.log(`[Orders] PDF Invoice generated successfully. Size: ${pdfBuffer.length} bytes`);
            } else {
                console.error(`[Orders] PDF Invoice generation returned null/undefined`);
            }
            const storage = adminStorage();
            if (storage && pdfBuffer) {
                const bucket = storage.bucket();
                const fileName = `invoices/${shop.id}/${order.id}_invoice.pdf`;
                const file = bucket.file(fileName);

                await file.save(pdfBuffer, {
                    metadata: {
                        contentType: "application/pdf",
                    },
                });
                console.log(`[Orders] PDF Invoice saved to storage: ${fileName}`);

                // Generate signed URL (valid for 1 year)
                const [signedUrl] = await file.getSignedUrl({
                    action: 'read',
                    expires: '03-01-2027', // Adjust to a reasonable future date
                });
                pdfDownloadUrl = signedUrl;
                console.log(`[Orders] Generated signed URL for PDF: ${pdfDownloadUrl.substring(0, 50)}...`);

                // Update order with invoice URL
                const db = adminDb();
                if (db) {
                    await db.collection("shops").doc(shop.id).collection("orders").doc(order.id).update({
                        invoiceUrl: pdfDownloadUrl
                    });
                }
            } else {
                console.error(`[Orders] Storage or PDF buffer missing: storage=${!!storage}, buffer=${!!pdfBuffer}`);
            }
        } catch (pdfError) {
            console.error("Error generating/uploading PDF invoice:", pdfError);
            // Don't fail the order if PDF fails
        }

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
            if (deliveryType === "entrega" && customerAddress) {
                clientMsg += `📍 Dirección: ${customerAddress}\n`;
            }
            if (deliveryDate) {
                clientMsg += `📅 Fecha: *${deliveryDate}*\n`;
                if (deliveryTime) clientMsg += `⏰ Horario: *${deliveryTime}*\n`;
            }
            clientMsg += `💰 Total: *$${total.toLocaleString()}*\n`;

            if (paymentInfo?.paymentTiming === "pay_now") {
                clientMsg += `💳 Pago: *Transferencia enviada*\n`;
                clientMsg += `📝 Estado: *Verificando comprobante*\n\n`;
                clientMsg += `Estamos revisando tu comprobante de pago. Te confirmaremos pronto.`;
            } else {
                clientMsg += `💵 Pago: *Al momento de la entrega*\n`;
                clientMsg += `📝 Estado: *Pendiente de revisión*\n\n`;
                clientMsg += `Te notificaremos pronto sobre los siguientes pasos. ¡Gracias por tu confianza!`;
            }

            if (pdfDownloadUrl) {
                clientMsg += `\n\n📄 *Factura Digital:*\n${pdfDownloadUrl}`;
            }

            try {
                await sendTextMessage(instanceName, cleanPhone, clientMsg);
                console.log(`[Orders] WhatsApp message sent to client: ${cleanPhone}`);

                // Send PDF Invoice if generated
                if (pdfDownloadUrl) {
                    console.log(`[Orders] Attempting to send PDF file to client via WhatsApp...`);
                    try {
                        await sendDocument(
                            instanceName,
                            cleanPhone,
                            pdfDownloadUrl,
                            `Factura_${order.orderNumber}.pdf`,
                            `Aquí tienes tu factura para el pedido #${order.orderNumber}`
                        );
                        console.log(`[Orders] WhatsApp PDF Invoice file sent to client successfully`);
                    } catch (documentError) {
                        console.error(`[Orders] Failed to send PDF file via WhatsApp (fallback text link should still work):`, documentError);
                    }
                }
            } catch (waError) {
                console.error("Error enviando WhatsApp al cliente:", waError);
            }
        }

        // 5. Notificar al Dueño vía Email
        const emailsToNotify = Array.from(new Set([shop.ownerNotificationEmail, shop.contact?.email].filter(Boolean)));

        if (emailsToNotify.length > 0) {
            try {
                const emailContent = emailTemplates.orderConfirmation({
                    clientName: customerName,
                    orderNumber: order.orderNumber,
                    items: items.map(i => ({ name: i.name, quantity: i.quantity || 1, price: i.price, notes: i.notes })),
                    total: total,
                    shopName: shop.name,
                    shopLogo: shop.logo,
                    shopPrimaryColor: shop.theme?.primaryColor,
                    shopBackgroundImage: shop.banner || shop.background?.image || shop.hero,
                    deliveryType: deliveryTypeLabel,
                    paymentStatus: paymentInfo?.paymentTiming === "pay_now" ? "Comprobante enviado" : "Pendiente"
                });

                for (const email of emailsToNotify) {
                    await sendEmail({
                        to: email as string,
                        subject: `Nuevo pedido recibido: #${order.orderNumber}`,
                        html: emailContent,
                        from: `${shop.name} <Prologixcompany@gmail.com>`
                    });
                }
            } catch (emailError) {
                console.error("Error enviando email al dueño:", emailError);
            }
        }

        // 5.5. If payment receipt uploaded, send payment notification email to owner
        if (paymentInfo?.paymentTiming === "pay_now" && paymentInfo.receiptUrl && emailsToNotify.length > 0) {
            try {
                const paymentEmailContent = emailTemplates.paymentReceiptNotification({
                    shopName: shop.name,
                    shopLogo: shop.logo,
                    shopPrimaryColor: shop.theme?.primaryColor,
                    shopBackgroundImage: shop.banner || shop.background?.image || shop.hero,
                    customerName,
                    customerPhone,
                    customerEmail,
                    amount: total,
                    currency: "MXN",
                    paymentMethod: paymentInfo.paymentMethodName || "Transferencia",
                    receiptUrl: paymentInfo.receiptUrl,
                    orderId: order.id,
                    orderNumber: order.orderNumber
                });

                for (const email of emailsToNotify) {
                    await sendEmail({
                        to: email as string,
                        subject: `🔔 Nuevo comprobante de pago - Pedido #${order.orderNumber}`,
                        html: paymentEmailContent
                    });
                }
            } catch (paymentEmailError) {
                console.error("Error enviando email de comprobante de pago:", paymentEmailError);
            }
        }

        // 5.6. Notificar al Cliente vía Email
        if (customerEmail) {
            try {
                const customerEmailContent = emailTemplates.orderConfirmation({
                    clientName: customerName,
                    orderNumber: order.orderNumber,
                    items: items.map(i => ({ name: i.name, quantity: i.quantity || 1, price: i.price, notes: i.notes })),
                    total: total,
                    shopName: shop.name,
                    shopLogo: shop.logo,
                    shopPrimaryColor: shop.theme?.primaryColor,
                    shopBackgroundImage: shop.banner || shop.background?.image || shop.hero,
                    deliveryType: deliveryTypeLabel,
                    paymentStatus: paymentInfo?.paymentTiming === "pay_now" ? "Comprobante enviado" : "Pendiente"
                });

                console.log(`[Orders] Sending confirmation email to customer: ${customerEmail}`);
                const customerEmailResult = await sendEmail({
                    to: customerEmail,
                    subject: `Confirmación de pedido #${order.orderNumber} en ${shop.name}`,
                    html: customerEmailContent,
                    from: `${shop.name} <Prologixcompany@gmail.com>`,
                    attachments: pdfBuffer ? [{
                        filename: `Factura_${order.orderNumber}.pdf`,
                        content: pdfBuffer
                    }] : undefined
                });
                console.log(`[Orders] Customer email result: ${customerEmailResult.success ? '✅ Success' : '❌ Failed: ' + customerEmailResult.error}`);
            } catch (customerEmailError) {
                console.error("Error enviando email al cliente:", customerEmailError);
            }
        }

        // 6. Notificar al Dueño vía WhatsApp (Opcional pero recomendado)
        if (isEvolutionConfigured()) {
            const instanceName = getInstanceName(shop.slug);
            const { getAllNotificationPhones } = await import("@/lib/handlers/whatsapp-order.handler");

            // Re-use logic to get all configured phones (owner + staff)
            const notificationPhones = await getAllNotificationPhones(shop.id);

            if (notificationPhones.length > 0) {
                let ownerMsg = `🔔 *¡NUEVO PEDIDO WEB RECIBIDO!* 🔥\n\n`;
                ownerMsg += `Número: *#${order.orderNumber}*\n`;
                ownerMsg += `Cliente: ${customerName}\n`;
                ownerMsg += `Teléfono: ${customerPhone}\n\n`;
                ownerMsg += `📝 *Pedido:*\n`;
                items.forEach(item => {
                    ownerMsg += `• ${item.name} ($${item.price.toLocaleString()})\n`;
                    if (item.notes) ownerMsg += `  _${item.notes}_\n`;
                });
                ownerMsg += `\nTipo: *${ownerDeliveryLabel}*\n`;
                if (customerAddress) {
                    ownerMsg += `📍 Direcc: ${customerAddress}\n`;
                }
                if (deliveryDate) {
                    ownerMsg += `📅 Fecha: *${deliveryDate}*\n`;
                    if (deliveryTime) ownerMsg += `⏰ Horario: *${deliveryTime}*\n`;
                }
                ownerMsg += `Total: *$${total.toLocaleString()}*\n\n`;

                // Add payment info
                if (paymentInfo) {
                    if (paymentInfo.paymentTiming === "pay_now") {
                        ownerMsg += `💳 *PAGO ANTICIPADO*\n`;
                        ownerMsg += `Método: ${paymentInfo.paymentMethodName || "Transferencia"}\n`;
                        if (paymentInfo.receiptUrl) {
                            ownerMsg += `📎 *Comprobante adjunto* - Ver en panel admin\n`;
                        }
                        ownerMsg += `Estado: ⏳ Pendiente de verificación\n\n`;
                    } else {
                        ownerMsg += `💵 Pago: *Al entregar*\n\n`;
                    }
                }

                ownerMsg += `Revisa los detalles en tu panel de administración.`;

                // Broadcast to all configured notification phones
                for (const staff of notificationPhones) {
                    try {
                        await sendTextMessage(instanceName, staff.phone, ownerMsg);
                    } catch (waError) {
                        console.error(`Error enviando WhatsApp de nuevo pedido web a ${staff.phone}:`, waError);
                    }
                }
            } else {
                console.log(`[Web Order] No notification phones configured for shop ${shop.id}`);
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
