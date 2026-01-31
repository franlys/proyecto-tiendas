import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  errorResponse,
  successResponse,
} from "@/lib/middleware/admin-auth";
import { SYSTEM_FEATURES, getFeaturesByCategory } from "@/types/feature.types";

// GET /api/admin/features - Listar todos los features disponibles
// (mantenemos la ruta /plans por compatibilidad pero ahora solo devuelve features)
export async function GET(req: NextRequest) {
  const authResult = await requireSuperAdmin(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Devolver la lista de features disponibles organizada por categoría
    const features = Object.values(SYSTEM_FEATURES);

    const featuresByCategory = {
      inventory: getFeaturesByCategory("inventory"),
      sales: getFeaturesByCategory("sales"),
      clients: getFeaturesByCategory("clients"),
      marketing: getFeaturesByCategory("marketing"),
      staff: getFeaturesByCategory("staff"),
      advanced: getFeaturesByCategory("advanced"),
    };

    return successResponse({
      features,
      featuresByCategory,
      total: features.length,
    });
  } catch (error) {
    console.error("Error listing features:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al listar features",
      500
    );
  }
}
