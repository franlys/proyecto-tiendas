import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  errorResponse,
  successResponse,
} from "@/lib/middleware/admin-auth";
import { getUserById, resetPassword } from "@/lib/services/users.service";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// POST /api/admin/users/[userId]/reset-password - Reset de contraseña
export async function POST(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireSuperAdmin(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { userId } = await params;
    const body = await req.json();

    // Verificar que el usuario existe
    const existing = await getUserById(userId);
    if (!existing) {
      return errorResponse("Usuario no encontrado", 404);
    }

    // Validar nueva contraseña si se proporciona
    if (body.newPassword && body.newPassword.length < 6) {
      return errorResponse("La contraseña debe tener al menos 6 caracteres");
    }

    const result = await resetPassword(
      userId,
      body.newPassword,
      body.sendEmail ?? false
    );

    return successResponse(result);
  } catch (error) {
    console.error("Error resetting password:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al resetear contraseña",
      500
    );
  }
}
