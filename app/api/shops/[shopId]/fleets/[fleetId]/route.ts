import { NextRequest, NextResponse } from "next/server";
import {
    getFleet,
    updateFleet,
    deleteFleet,
} from "@/lib/services/fleet-admin.service";
import type { UpdateFleetInput } from "@/lib/types/fleet.types";

/**
 * GET /api/shops/{shopId}/fleets/{fleetId}
 * Obtener una flota específica
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string; fleetId: string }> }
) {
    const { shopId, fleetId } = await params;

    try {
        const fleet = await getFleet(shopId, fleetId);

        if (!fleet) {
            return NextResponse.json(
                { error: "Fleet not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ fleet });
    } catch (error) {
        console.error("Error fetching fleet:", error);
        return NextResponse.json(
            { error: "Failed to fetch fleet" },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/shops/{shopId}/fleets/{fleetId}
 * Actualizar una flota
 *
 * Body: { name?, phone?, email?, role?, isActive?, isAvailable?, priority? }
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string; fleetId: string }> }
) {
    const { shopId, fleetId } = await params;

    try {
        const body: UpdateFleetInput = await request.json();

        const fleet = await updateFleet(shopId, fleetId, body);

        if (!fleet) {
            return NextResponse.json(
                { error: "Fleet not found or update failed" },
                { status: 404 }
            );
        }

        return NextResponse.json({ fleet });
    } catch (error) {
        console.error("Error updating fleet:", error);
        return NextResponse.json(
            { error: "Failed to update fleet" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/shops/{shopId}/fleets/{fleetId}
 * Eliminar una flota
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string; fleetId: string }> }
) {
    const { shopId, fleetId } = await params;

    try {
        const success = await deleteFleet(shopId, fleetId);

        if (!success) {
            return NextResponse.json(
                { error: "Fleet not found or delete failed" },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting fleet:", error);
        return NextResponse.json(
            { error: "Failed to delete fleet" },
            { status: 500 }
        );
    }
}
