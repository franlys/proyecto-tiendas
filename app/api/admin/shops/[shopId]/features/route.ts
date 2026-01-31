import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  errorResponse,
  successResponse,
} from "@/lib/middleware/admin-auth";
import { getShopById } from "@/lib/services/shops.service";
import {
  getShopFeatures,
  updateShopFeatures,
  addCustomFeature,
  removeCustomFeature,
  disableFeature,
  enableFeature,
} from "@/lib/services/features.service";
import { SYSTEM_FEATURES, type FeatureId } from "@/types/feature.types";

interface RouteParams {
  params: Promise<{ shopId: string }>;
}

// GET /api/admin/shops/[shopId]/features - Obtener features de una shop
export async function GET(req: NextRequest, { params }: RouteParams) {
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

    const features = await getShopFeatures(shopId);

    return successResponse(features);
  } catch (error) {
    console.error("Error getting shop features:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al obtener features",
      500
    );
  }
}

// PUT /api/admin/shops/[shopId]/features - Actualizar features de una shop
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

    // Validar features
    const validFeatureIds = Object.keys(SYSTEM_FEATURES);

    if (body.customFeatures) {
      for (const featureId of body.customFeatures) {
        if (!validFeatureIds.includes(featureId)) {
          return errorResponse(`Feature inválido: ${featureId}`);
        }
      }
    }

    if (body.disabledFeatures) {
      for (const featureId of body.disabledFeatures) {
        if (!validFeatureIds.includes(featureId)) {
          return errorResponse(`Feature inválido: ${featureId}`);
        }
      }
    }

    const shop = await updateShopFeatures(shopId, {
      customFeatures: body.customFeatures,
      disabledFeatures: body.disabledFeatures,
    });

    const features = await getShopFeatures(shopId);

    return successResponse({
      shop,
      features,
      message: "Features actualizados correctamente",
    });
  } catch (error) {
    console.error("Error updating shop features:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al actualizar features",
      500
    );
  }
}

// POST /api/admin/shops/[shopId]/features - Acciones específicas sobre features
export async function POST(req: NextRequest, { params }: RouteParams) {
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

    // Validar action y featureId
    const validActions = ["add", "remove", "disable", "enable"];
    if (!body.action || !validActions.includes(body.action)) {
      return errorResponse(
        `Acción requerida. Opciones: ${validActions.join(", ")}`
      );
    }

    if (!body.featureId) {
      return errorResponse("featureId requerido");
    }

    const validFeatureIds = Object.keys(SYSTEM_FEATURES);
    if (!validFeatureIds.includes(body.featureId)) {
      return errorResponse(`Feature inválido: ${body.featureId}`);
    }

    const featureId = body.featureId as FeatureId;
    let shop;
    let message;

    switch (body.action) {
      case "add":
        shop = await addCustomFeature(shopId, featureId);
        message = `Feature "${SYSTEM_FEATURES[featureId].name}" añadido`;
        break;
      case "remove":
        shop = await removeCustomFeature(shopId, featureId);
        message = `Feature "${SYSTEM_FEATURES[featureId].name}" removido`;
        break;
      case "disable":
        shop = await disableFeature(shopId, featureId);
        message = `Feature "${SYSTEM_FEATURES[featureId].name}" deshabilitado`;
        break;
      case "enable":
        shop = await enableFeature(shopId, featureId);
        message = `Feature "${SYSTEM_FEATURES[featureId].name}" habilitado`;
        break;
    }

    const features = await getShopFeatures(shopId);

    return successResponse({
      shop,
      features,
      message,
    });
  } catch (error) {
    console.error("Error managing shop feature:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al gestionar feature",
      500
    );
  }
}
