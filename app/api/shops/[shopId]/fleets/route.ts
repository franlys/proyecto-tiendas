import { NextRequest, NextResponse } from "next/server";
import {
    createFleet,
    getFleets,
} from "@/lib/services/fleet-admin.service";
import type { CreateFleetInput } from "@/lib/types/fleet.types";

/**
 * GET /api/shops/{shopId}/fleets
 * Obtener todas las flotas de una tienda
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string }> }
) {
    const { shopId } = await params;

    try {
        const fleets = await getFleets(shopId);
        return NextResponse.json({ fleets });
    } catch (error) {
        console.error("Error fetching fleets:", error);
        return NextResponse.json(
            { error: "Failed to fetch fleets" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/shops/{shopId}/fleets
 * Crear una nueva flota
 *
 * Body: { name, phone, email?, role, priority? }
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ shopId: string }> }
) {
    const { shopId } = await params;

    try {
        const body = await request.json();
        const { name, phone, email, role, priority } = body;

        if (!name || !phone || !role) {
            return NextResponse.json(
                { error: "name, phone, and role are required" },
                { status: 400 }
            );
        }

        const input: CreateFleetInput = {
            shopId,
            name,
            phone,
            email,
            role,
            priority,
        };

        const fleet = await createFleet(input);

        if (!fleet) {
            return NextResponse.json(
                { error: "Failed to create fleet" },
                { status: 500 }
            );
        }

        return NextResponse.json({ fleet }, { status: 201 });
    } catch (error) {
        console.error("Error creating fleet:", error);
        return NextResponse.json(
            { error: "Failed to create fleet" },
            { status: 500 }
        );
    }
}
