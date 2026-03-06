import { renderToBuffer } from "@react-pdf/renderer";
import { PDFInvoice } from "../components/pdf-invoice";
import React from "react";

/**
 * Genera el Buffer de un PDF para una orden específica
 */
export async function generateOrderInvoiceBuffer(order: any, shop: any): Promise<Buffer> {
    console.log(`[PDF Service] Starting generation for order #${order.orderNumber || 'unknown'}`);
    try {
        const orderForPdf = {
            orderNumber: order.orderNumber || "0000",
            customerName: order.customerName || "Cliente",
            customerPhone: order.customerPhone || "",
            customerEmail: order.customerEmail || "",
            customerAddress: order.customerAddress || "",
            items: order.items || [],
            total: order.total || order.subtotal || 0,
            createdAt: order.createdAt || new Date().toISOString(),
            deliveryType: order.deliveryType || "entrega",
            paymentMethod: order.paymentInfo?.paymentMethodName || (order.paymentMethodId ? "Transferencia" : "Por definir")
        };

        const shopForPdf = {
            name: shop.name || "Tu Tienda",
            logo: shop.logo || "",
            primaryColor: shop.theme?.primaryColor || "#06b6d4",
            ownerNotificationEmail: shop.ownerNotificationEmail || shop.contact?.email || ""
        };

        console.log(`[PDF Service] Data mapped. Shop: ${shopForPdf.name}, Customer: ${orderForPdf.customerName}`);
        console.log(`[PDF Service] Items count: ${orderForPdf.items.length}, Total: $${orderForPdf.total}`);

        // Render to Buffer (compatible with nodemailer and Firebase upload)
        // Note: we're casting PDFInvoice to any because of React 19 vs @react-pdf/renderer type conflicts sometimes
        console.log(`[PDF Service] Calling renderToBuffer...`);
        let buffer;
        try {
            buffer = await renderToBuffer(
                React.createElement(PDFInvoice as any, { order: orderForPdf, shop: shopForPdf } as any)
            );
        } catch (renderError: any) {
            console.error("❌ [PDF Service] renderToBuffer FAILED:", renderError.message);
            throw renderError;
        }

        if (!buffer || buffer.length === 0) {
            throw new Error("renderToBuffer returned empty result or zero-length buffer");
        }

        console.log(`[PDF Service] PDF generated successfully. Buffer size: ${buffer.length} bytes`);
        return Buffer.from(buffer);
    } catch (error: any) {
        console.error("❌ [PDF Service] Global error in PDF service:", error.message);
        throw error;
    }
}
