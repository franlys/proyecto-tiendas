import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  errorResponse,
  successResponse,
} from "@/lib/middleware/admin-auth";
import { getShopById, toggleShopActive } from "@/lib/services/shops.service";

interface RouteParams {
  params: Promise<{ shopId: string }>;
}

// POST /api/admin/shops/[shopId]/toggle - Toggle estado activo/inactivo
export async function POST(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireSuperAdmin(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { shopId } = await params;

    // Verificar que la shop existe
    const existing = await getShopById(shopId);
    if (!existing) {
      return errorResponse("Tienda no encontrada", 404);
    }

    const shop = await toggleShopActive(shopId);

    return successResponse({
      shop,
      message: shop.isActive
        ? "Tienda activada correctamente"
        : "Tienda desactivada correctamente",
    });
  } catch (error) {
    console.error("Error toggling shop status:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al cambiar estado",
      500
    );
  }
}
