import { NextRequest, NextResponse } from "next/server";
import {
  getBookingConfigAdmin,
  updateBookingConfigAdmin,
} from "@/lib/services/booking-admin.service";

/**
 * GET /api/bookings/config?shopId=xxx
 * Obtener configuración de reservas (usando Admin SDK)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");

  if (!shopId) {
    return NextResponse.json({ error: "shopId is required" }, { status: 400 });
  }

  try {
    const config = await getBookingConfigAdmin(shopId);
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error fetching booking config:", error);
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/bookings/config
 * Actualizar configuración de reservas (usando Admin SDK)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, ...configData } = body;

    if (!shopId) {
      return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    await updateBookingConfigAdmin(shopId, configData);

    const updatedConfig = await getBookingConfigAdmin(shopId);

    return NextResponse.json({ config: updatedConfig });
  } catch (error) {
    console.error("Error updating booking config:", error);
    return NextResponse.json(
      { error: "Failed to update config" },
      { status: 500 }
    );
  }
}
