import { NextRequest, NextResponse } from "next/server";
import { initializeShopConfigsAction } from "@/lib/actions/shop-actions";

/**
 * POST /api/shops/{shopId}/init-configs
 * Inicializa las configuraciones por defecto para una tienda existente
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string }> }
) {
    const { shopId } = await params;

    if (!shopId) {
        return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    try {
        const result = await initializeShopConfigsAction(shopId);

        if (result.success) {
            return NextResponse.json({
                success: true,
                message: `Configurations initialized for shop ${shopId}`,
            });
        } else {
            return NextResponse.json(
                { error: result.error },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error("Error initializing shop configs:", error);
        return NextResponse.json(
            { error: "Failed to initialize configs" },
            { status: 500 }
        );
    }
}
