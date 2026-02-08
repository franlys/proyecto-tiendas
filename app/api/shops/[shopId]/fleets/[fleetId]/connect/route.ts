import { NextRequest, NextResponse } from "next/server";
import {
    getFleet,
    updateFleetConnection,
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
 * GET /api/shops/{shopId}/fleets/{fleetId}/connect
 * Obtener QR code para conectar el WhatsApp de una flota
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string; fleetId: string }> }
) {
    const { shopId, fleetId } = await params;

    if (!isEvolutionConfigured()) {
        return NextResponse.json(
            { error: "Evolution API not configured" },
            { status: 503 }
        );
    }

    try {
        const fleet = await getFleet(shopId, fleetId);

        if (!fleet) {
            return NextResponse.json(
                { error: "Fleet not found" },
                { status: 404 }
            );
        }

        // Verificar estado de conexión
        try {
            const state = await getConnectionState(fleet.instanceName);

            if (state.state === "open") {
                // Ya está conectado
                await updateFleetConnection(shopId, fleetId, true);
                return NextResponse.json({
                    connected: true,
                    state: "open",
                    fleet: {
                        id: fleet.id,
                        name: fleet.name,
                        phone: fleet.phone,
                    },
                });
            }
        } catch (error) {
            // La instancia probablemente no existe, la crearemos
            console.log(`Instance ${fleet.instanceName} does not exist, creating...`);
        }

        // Crear instancia si no existe
        try {
            await createInstance(fleet.instanceName);
            console.log(`Created instance ${fleet.instanceName}`);
        } catch (error: any) {
            // Si ya existe, continuar
            if (!error.message?.includes("already exists")) {
                console.log(`Instance might already exist: ${error.message}`);
            }
        }

        // Configurar webhook
        try {
            await setWebhook(
                fleet.instanceName,
                `${WEBHOOK_BASE_URL}/api/whatsapp/webhook`
            );
        } catch (error) {
            console.error("Error setting webhook:", error);
        }

        // Obtener QR code
        const qrData = await fetchQRCode(fleet.instanceName);

        return NextResponse.json({
            connected: false,
            state: "disconnected",
            qrcode: qrData.base64,
            pairingCode: qrData.pairingCode,
            fleet: {
                id: fleet.id,
                name: fleet.name,
                phone: fleet.phone,
                instanceName: fleet.instanceName,
            },
        });
    } catch (error: any) {
        console.error("Error connecting fleet:", error);
        return NextResponse.json(
            { error: error.message || "Failed to connect fleet" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/shops/{shopId}/fleets/{fleetId}/connect
 * Desconectar el WhatsApp de una flota
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string; fleetId: string }> }
) {
    const { shopId, fleetId } = await params;

    if (!isEvolutionConfigured()) {
        return NextResponse.json(
            { error: "Evolution API not configured" },
            { status: 503 }
        );
    }

    try {
        const fleet = await getFleet(shopId, fleetId);

        if (!fleet) {
            return NextResponse.json(
                { error: "Fleet not found" },
                { status: 404 }
            );
        }

        // Desconectar de Evolution API
        try {
            await logoutInstance(fleet.instanceName);
        } catch (error) {
            console.error("Error logging out instance:", error);
        }

        // Actualizar estado en DB
        await updateFleetConnection(shopId, fleetId, false);

        return NextResponse.json({
            success: true,
            message: `Fleet ${fleet.name} disconnected`,
        });
    } catch (error: any) {
        console.error("Error disconnecting fleet:", error);
        return NextResponse.json(
            { error: error.message || "Failed to disconnect fleet" },
            { status: 500 }
        );
    }
}
