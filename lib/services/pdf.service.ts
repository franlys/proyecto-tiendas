import { renderToBuffer } from "@react-pdf/renderer";
import { PDFInvoice } from "../components/pdf-invoice";
import React from "react";

/**
 * Genera el Buffer de un PDF para una orden específica
 */
export async function generateOrderInvoiceBuffer(order: any, shop: any): Promise<Buffer> {
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

        // Render to Buffer (compatible with nodemailer and Firebase upload)
        // Note: we're casting PDFInvoice to any because of React 19 vs @react-pdf/renderer type conflicts sometimes
        const buffer = await renderToBuffer(
            React.createElement(PDFInvoice as any, { order: orderForPdf, shop: shopForPdf } as any)
        );

        return Buffer.from(buffer);
    } catch (error) {
        console.error("Error generating PDF buffer:", error);
        throw error;
    }
}
