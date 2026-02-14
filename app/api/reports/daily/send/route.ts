import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendTextMessage, getInstanceName, isEvolutionConfigured } from "@/lib/evolution";

/**
 * POST /api/reports/daily/send
 * Sends a daily report to the shop owner via WhatsApp bot
 */
export async function POST(request: NextRequest) {
    if (!isEvolutionConfigured()) {
        return NextResponse.json(
            { error: "WhatsApp bot not configured" },
            { status: 503 }
        );
    }

    try {
        const body = await request.json();
        const { shopId, ownerPhone, reportData } = body;

        if (!shopId || !ownerPhone) {
            return NextResponse.json(
                { error: "shopId and ownerPhone are required" },
                { status: 400 }
            );
        }

        const db = adminDb();
        if (!db) {
            return NextResponse.json(
                { error: "Database unavailable" },
                { status: 503 }
            );
        }

        // Get shop data
        const shopDoc = await db.collection("shops").doc(shopId).get();
        const shopData = shopDoc.exists ? shopDoc.data() : null;
        const shopName = shopData?.name || shopId;

        // Get low stock products
        const productsSnap = await db.collection("shops").doc(shopId).collection("products").get();
        const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const lowStockProducts = products.filter((p: any) => {
            const threshold = p.lowStockThreshold || 5;
            return p.stock !== undefined && p.stock <= threshold;
        });

        // Build the report message
        const today = new Date();
        const formattedDate = today.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

        let message = `📊 *REPORTE DIARIO - ${shopName}*\n`;
        message += `📅 ${formattedDate}\n\n`;

        // Sales summary
        message += `💰 *RESUMEN DE VENTAS*\n`;
        message += `━━━━━━━━━━━━━━━\n`;
        message += `✅ Total Vendido: $${(reportData.totalSales || 0).toLocaleString()}\n`;
        message += `📦 Pedidos: ${reportData.totalOrders || 0}\n`;

        if (reportData.totalOrders > 0) {
            const avgTicket = Math.round(reportData.totalSales / reportData.totalOrders);
            message += `💵 Ticket Promedio: $${avgTicket.toLocaleString()}\n`;
        }

        if (reportData.topService) {
            message += `⭐ Top Producto: ${reportData.topService}\n`;
        }

        // Products sold today
        if (reportData.soldProducts && reportData.soldProducts.length > 0) {
            message += `\n📋 *PRODUCTOS VENDIDOS HOY*\n`;
            message += `━━━━━━━━━━━━━━━\n`;
            reportData.soldProducts.slice(0, 10).forEach((item: { name: string; quantity: number; total: number }) => {
                message += `• ${item.name} x${item.quantity} = $${item.total.toLocaleString()}\n`;
            });
            if (reportData.soldProducts.length > 10) {
                message += `... y ${reportData.soldProducts.length - 10} más\n`;
            }
        }

        // Inventory status
        message += `\n📦 *ESTADO DEL INVENTARIO*\n`;
        message += `━━━━━━━━━━━━━━━\n`;
        message += `Total productos: ${products.length}\n`;

        // Low stock alerts
        if (lowStockProducts.length > 0) {
            message += `\n⚠️ *ALERTAS DE STOCK BAJO*\n`;
            message += `━━━━━━━━━━━━━━━\n`;
            lowStockProducts.slice(0, 8).forEach((p: any) => {
                const stockEmoji = p.stock === 0 ? "🔴" : "🟡";
                message += `${stockEmoji} ${p.name}: ${p.stock} unidades\n`;
            });
            if (lowStockProducts.length > 8) {
                message += `... y ${lowStockProducts.length - 8} productos más con stock bajo\n`;
            }
        } else {
            message += `✅ Sin alertas de stock bajo\n`;
        }

        message += `\n━━━━━━━━━━━━━━━\n`;
        message += `¡Buen trabajo hoy! 🎉`;

        // Send via WhatsApp bot
        const instanceName = getInstanceName(shopId);
        await sendTextMessage(instanceName, ownerPhone, message);

        return NextResponse.json({
            success: true,
            message: "Daily report sent successfully",
            lowStockCount: lowStockProducts.length,
        });

    } catch (error: any) {
        console.error("Error sending daily report:", error);
        return NextResponse.json(
            { error: error.message || "Failed to send report" },
            { status: 500 }
        );
    }
}
