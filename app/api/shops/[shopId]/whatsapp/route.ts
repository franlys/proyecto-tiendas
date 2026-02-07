import { NextRequest, NextResponse } from "next/server";
import {
    getShopWhatsAppConfig,
    createOrUpdateWhatsAppConfig,
} from "@/lib/services/fleet-admin.service";

/**
 * GET /api/shops/{shopId}/whatsapp
 * Obtener configuración de WhatsApp de la tienda
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string }> }
) {
    const { shopId } = await params;

    try {
        const config = await getShopWhatsAppConfig(shopId);

        if (!config) {
            return NextResponse.json({
                configured: false,
                message: "WhatsApp not configured for this shop",
            });
        }

        return NextResponse.json({ config });
    } catch (error) {
        console.error("Error fetching WhatsApp config:", error);
        return NextResponse.json(
            { error: "Failed to fetch WhatsApp config" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/shops/{shopId}/whatsapp
 * Actualizar configuración de WhatsApp de la tienda
 *
 * Body: Partial<ShopWhatsAppConfig>
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string }> }
) {
    const { shopId } = await params;

    try {
        const body = await request.json();

        const config = await createOrUpdateWhatsAppConfig(shopId, body);

        if (!config) {
            return NextResponse.json(
                { error: "Failed to update WhatsApp config" },
                { status: 500 }
            );
        }

        return NextResponse.json({ config });
    } catch (error) {
        console.error("Error updating WhatsApp config:", error);
        return NextResponse.json(
            { error: "Failed to update WhatsApp config" },
            { status: 500 }
        );
    }
}
