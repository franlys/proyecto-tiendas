import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  errorResponse,
  successResponse,
} from "@/lib/middleware/admin-auth";
import {
  getShopById,
  updateShop,
  deleteShop,
} from "@/lib/services/shops.service";
import type { UpdateShopInput } from "@/types";

interface RouteParams {
  params: Promise<{ shopId: string }>;
}

// GET /api/admin/shops/[shopId] - Obtener una shop
export async function GET(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireSuperAdmin(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { shopId } = await params;
    const shop = await getShopById(shopId);

    if (!shop) {
      return errorResponse("Tienda no encontrada", 404);
    }

    return successResponse({ shop });
  } catch (error) {
    console.error("Error getting shop:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al obtener tienda",
      500
    );
  }
}

// PUT /api/admin/shops/[shopId] - Actualizar una shop
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireSuperAdmin(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { shopId } = await params;
    const body = await req.json();

    // Verificar que la shop existe
    const existing = await getShopById(shopId);
    if (!existing) {
      return errorResponse("Tienda no encontrada", 404);
    }

    // Validar categoría si se proporciona
    if (body.category) {
      const validCategories = ["beauty", "retail", "repair", "restaurant", "technology"];
      if (!validCategories.includes(body.category)) {
        return errorResponse(
          `Categoría inválida. Opciones: ${validCategories.join(", ")}`
        );
      }
    }

    // Validar businessType si se proporciona
    if (body.businessType) {
      const { BUSINESS_TYPE_CONFIG } = await import("@/lib/types/business.types");
      if (!BUSINESS_TYPE_CONFIG[body.businessType as keyof typeof BUSINESS_TYPE_CONFIG]) {
        return errorResponse(
          `Tipo de negocio inválido: ${body.businessType}`
        );
      }
    }

    const input: UpdateShopInput = {};
    if (body.name !== undefined) input.name = body.name;
    if (body.description !== undefined) input.description = body.description;
    if (body.category !== undefined) input.category = body.category;
    if (body.businessType !== undefined) input.businessType = body.businessType;
    if (body.phone !== undefined) input.phone = body.phone;
    if (body.email !== undefined) input.email = body.email;
    if (body.address !== undefined) input.address = body.address;
    if (body.wholesaleEnabled !== undefined) input.wholesaleEnabled = body.wholesaleEnabled;
    if (body.theme !== undefined) input.theme = body.theme;

    const shop = await updateShop(shopId, input);

    return successResponse({ shop });
  } catch (error) {
    console.error("Error updating shop:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al actualizar tienda",
      500
    );
  }
}

// DELETE /api/admin/shops/[shopId] - Eliminar una shop
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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

    await deleteShop(shopId);

    return successResponse({ message: "Tienda eliminada correctamente" });
  } catch (error) {
    console.error("Error deleting shop:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al eliminar tienda",
      500
    );
  }
}
