import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  errorResponse,
  successResponse,
} from "@/lib/middleware/admin-auth";
import {
  getUserById,
  updateUser,
  deleteUser,
  toggleUserActive,
} from "@/lib/services/users.service";
import type { UpdateUserInput } from "@/types";

interface RouteParams {
  params: Promise<{ userId: string }>;
}

// GET /api/admin/users/[userId] - Obtener un usuario
export async function GET(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireSuperAdmin(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { userId } = await params;
    const user = await getUserById(userId);

    if (!user) {
      return errorResponse("Usuario no encontrado", 404);
    }

    return successResponse({ user });
  } catch (error) {
    console.error("Error getting user:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al obtener usuario",
      500
    );
  }
}

// PUT /api/admin/users/[userId] - Actualizar un usuario
export async function PUT(req: NextRequest, { params }: RouteParams) {
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

    // Validar staffRole si se proporciona
    if (body.staffRole) {
      const validStaffRoles = ["owner", "manager", "sales", "warehouse"];
      if (!validStaffRoles.includes(body.staffRole)) {
        return errorResponse(
          `staffRole inválido. Opciones: ${validStaffRoles.join(", ")}`
        );
      }
    }

    const input: UpdateUserInput = {};
    if (body.name !== undefined) input.name = body.name;
    if (body.phone !== undefined) input.phone = body.phone;
    if (body.avatar !== undefined) input.avatar = body.avatar;
    if (body.staffRole !== undefined) input.staffRole = body.staffRole;
    if (body.isActive !== undefined) input.isActive = body.isActive;

    const user = await updateUser(userId, input);

    return successResponse({ user });
  } catch (error) {
    console.error("Error updating user:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al actualizar usuario",
      500
    );
  }
}

// DELETE /api/admin/users/[userId] - Eliminar un usuario
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireSuperAdmin(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { userId } = await params;

    // Verificar que el usuario existe
    const existing = await getUserById(userId);
    if (!existing) {
      return errorResponse("Usuario no encontrado", 404);
    }

    // No permitir eliminar super admins
    if (existing.role === "SUPER_ADMIN") {
      return errorResponse("No se puede eliminar un Super Admin", 403);
    }

    await deleteUser(userId);

    return successResponse({ message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al eliminar usuario",
      500
    );
  }
}

// PATCH /api/admin/users/[userId] - Toggle estado activo
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireSuperAdmin(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { userId } = await params;

    // Verificar que el usuario existe
    const existing = await getUserById(userId);
    if (!existing) {
      return errorResponse("Usuario no encontrado", 404);
    }

    // No permitir desactivar super admins
    if (existing.role === "SUPER_ADMIN" && existing.isActive) {
      return errorResponse("No se puede desactivar un Super Admin", 403);
    }

    const user = await toggleUserActive(userId);

    return successResponse({
      user,
      message: user.isActive
        ? "Usuario activado correctamente"
        : "Usuario desactivado correctamente",
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al cambiar estado",
      500
    );
  }
}
