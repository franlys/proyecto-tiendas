import { NextRequest, NextResponse } from "next/server";
import { logoutInstance, isEvolutionConfigured } from "@/lib/evolution";

/**
 * DELETE /api/whatsapp/logout?instanceName=xxx
 * Desconectar una instancia de WhatsApp (cierra la sesión)
 * Después de esto, se requerirá escanear un nuevo QR
 */
export async function DELETE(request: NextRequest) {
    if (!isEvolutionConfigured()) {
        return NextResponse.json(
            { error: "Evolution API not configured" },
            { status: 503 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const instanceName = searchParams.get("instanceName");

        if (!instanceName) {
            return NextResponse.json(
                { error: "instanceName is required" },
                { status: 400 }
            );
        }

        await logoutInstance(instanceName);

        return NextResponse.json({
            success: true,
            message: `Instance ${instanceName} disconnected. Scan QR code to reconnect.`,
        });
    } catch (error: any) {
        console.error("Error logging out instance:", error.message);
        return NextResponse.json(
            { error: error.message || "Failed to logout" },
            { status: 500 }
        );
    }
}
