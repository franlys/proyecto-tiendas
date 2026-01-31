import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  errorResponse,
  successResponse,
} from "@/lib/middleware/admin-auth";
import { listShops, createShop, slugExists } from "@/lib/services/shops.service";
import type { CreateShopInput } from "@/types";

// GET /api/admin/shops - Listar todas las shops
export async function GET(req: NextRequest) {
  const authResult = await requireSuperAdmin(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const shops = await listShops();
    return successResponse({
      shops,
      total: shops.length,
    });
  } catch (error) {
    console.error("Error listing shops:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al listar tiendas",
      500
    );
  }
}

// POST /api/admin/shops - Crear nueva shop
export async function POST(req: NextRequest) {
  const authResult = await requireSuperAdmin(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await req.json();

    // Validar campos requeridos
    const requiredFields = ["name", "slug", "category", "phone"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return errorResponse(`Campo requerido: ${field}`);
      }
    }

    // Validar slug
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(body.slug)) {
      return errorResponse(
        "El slug solo puede contener letras minúsculas, números y guiones"
      );
    }

    // Verificar si el slug ya existe
    if (await slugExists(body.slug)) {
      return errorResponse("El slug ya está en uso");
    }

    // Validar categoría
    const validCategories = ["beauty", "retail", "repair", "restaurant", "technology"];
    if (!validCategories.includes(body.category)) {
      return errorResponse(
        `Categoría inválida. Opciones: ${validCategories.join(", ")}`
      );
    }

    const input: CreateShopInput = {
      name: body.name,
      slug: body.slug,
      category: body.category,
      description: body.description,
      phone: body.phone,
      wholesaleEnabled: body.wholesaleEnabled || false,
      planId: body.planId || "basic",
    };

    const shop = await createShop(input);

    return successResponse({ shop }, 201);
  } catch (error) {
    console.error("Error creating shop:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al crear tienda",
      500
    );
  }
}
