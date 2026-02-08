import { NextRequest, NextResponse } from "next/server";
import {
    getShopWhatsAppConfig,
    createOrUpdateWhatsAppConfig,
    updateMainInstanceConnection,
} from "@/lib/services/fleet-admin.service";
import {
    createInstance,
    fetchQRCode,
    getConnectionState,
    logoutInstance,
    setWebhook,
    isEvolutionConfigured,
} from "@/lib/evolution";

const WEBHOOK_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://proyecto-tiendas.vercel.app";

/**
 * GET /api/shops/{shopId}/whatsapp/connect
 * Obtener QR code para conectar el WhatsApp PRINCIPAL de la tienda
 * (Usado por Super Admin)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string }> }
) {
    const { shopId } = await params;

    if (!isEvolutionConfigured()) {
        return NextResponse.json(
            { error: "Evolution API not configured" },
            { status: 503 }
        );
    }

    try {
        // Obtener o crear configuración
        let config = await getShopWhatsAppConfig(shopId);

        if (!config) {
            // Crear configuración por defecto
            config = await createOrUpdateWhatsAppConfig(shopId, {});
        }

        if (!config) {
            return NextResponse.json(
                { error: "Failed to get/create WhatsApp config" },
                { status: 500 }
            );
        }

        const instanceName = config.mainInstanceName;

        // Verificar estado de conexión
        try {
            const state = await getConnectionState(instanceName);

            if (state.state === "open") {
                // Ya está conectado
                await updateMainInstanceConnection(shopId, true);
                return NextResponse.json({
                    connected: true,
                    state: "open",
                    instanceName,
                    message: "WhatsApp already connected",
                });
            }
        } catch (error) {
            // La instancia probablemente no existe, la crearemos
            console.log(`Instance ${instanceName} does not exist, creating...`);
        }

        // Crear instancia si no existe
        try {
            await createInstance(instanceName);
            console.log(`Created main instance ${instanceName}`);
        } catch (error: any) {
            if (!error.message?.includes("already exists")) {
                console.log(`Instance might already exist: ${error.message}`);
            }
        }

        // Configurar webhook
        try {
            await setWebhook(
                instanceName,
                `${WEBHOOK_BASE_URL}/api/whatsapp/webhook`
            );

            await createOrUpdateWhatsAppConfig(shopId, {
                webhookUrl: `${WEBHOOK_BASE_URL}/api/whatsapp/webhook`,
                webhookConfigured: true,
            });
        } catch (error) {
            console.error("Error setting webhook:", error);
        }

        // Obtener QR code
        const qrData = await fetchQRCode(instanceName);

        return NextResponse.json({
            connected: false,
            state: "disconnected",
            qrcode: qrData.base64,
            pairingCode: qrData.pairingCode,
            instanceName,
        });
    } catch (error: any) {
        console.error("Error connecting main WhatsApp:", error);
        return NextResponse.json(
            { error: error.message || "Failed to connect WhatsApp" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/shops/{shopId}/whatsapp/connect
 * Desconectar el WhatsApp PRINCIPAL de la tienda
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string }> }
) {
    const { shopId } = await params;

    if (!isEvolutionConfigured()) {
        return NextResponse.json(
            { error: "Evolution API not configured" },
            { status: 503 }
        );
    }

    try {
        const config = await getShopWhatsAppConfig(shopId);

        if (!config) {
            return NextResponse.json(
                { error: "WhatsApp config not found" },
                { status: 404 }
            );
        }

        // Desconectar de Evolution API
        try {
            await logoutInstance(config.mainInstanceName);
        } catch (error) {
            console.error("Error logging out instance:", error);
        }

        // Actualizar estado en DB
        await updateMainInstanceConnection(shopId, false);

        return NextResponse.json({
            success: true,
            message: "Main WhatsApp disconnected",
        });
    } catch (error: any) {
        console.error("Error disconnecting main WhatsApp:", error);
        return NextResponse.json(
            { error: error.message || "Failed to disconnect WhatsApp" },
            { status: 500 }
        );
    }
}
