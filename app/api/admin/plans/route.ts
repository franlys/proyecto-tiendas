import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  errorResponse,
  successResponse,
} from "@/lib/middleware/admin-auth";
import { DEFAULT_PLANS } from "@/types/plan.types";
import { SYSTEM_FEATURES } from "@/types/feature.types";

// GET /api/admin/plans - Listar todos los planes
export async function GET(req: NextRequest) {
  const authResult = await requireSuperAdmin(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // Convertir DEFAULT_PLANS a array y añadir timestamps
    const plans = Object.values(DEFAULT_PLANS).map((plan) => ({
      ...plan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    // También devolver la lista de features disponibles
    const features = Object.values(SYSTEM_FEATURES);

    return successResponse({
      plans,
      features,
      total: plans.length,
    });
  } catch (error) {
    console.error("Error listing plans:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al listar planes",
      500
    );
  }
}
