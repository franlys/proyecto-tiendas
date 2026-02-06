import { NextRequest, NextResponse } from "next/server";
import {
  getAssignmentConfig,
  updateAssignmentConfig,
} from "@/lib/services/order-assignment.service";

/**
 * GET /api/automation/orders/config?shopId=xxx
 * Obtener configuración de asignación rotativa
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const shopId = searchParams.get("shopId");

  if (!shopId) {
    return NextResponse.json({ error: "shopId is required" }, { status: 400 });
  }

  try {
    const config = await getAssignmentConfig(shopId);
    return NextResponse.json({ config });
  } catch (error) {
    console.error("Error fetching assignment config:", error);
    return NextResponse.json(
      { error: "Failed to fetch config" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/automation/orders/config
 * Actualizar configuración de asignación rotativa
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { shopId, ...configData } = body;

    if (!shopId) {
      return NextResponse.json({ error: "shopId is required" }, { status: 400 });
    }

    await updateAssignmentConfig(shopId, configData);

    const updatedConfig = await getAssignmentConfig(shopId);

    return NextResponse.json({ config: updatedConfig });
  } catch (error) {
    console.error("Error updating assignment config:", error);
    return NextResponse.json(
      { error: "Failed to update config" },
      { status: 500 }
    );
  }
}
