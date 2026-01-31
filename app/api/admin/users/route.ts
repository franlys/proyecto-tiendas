import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  errorResponse,
  successResponse,
} from "@/lib/middleware/admin-auth";
import {
  listUsers,
  listUsersByShop,
  createUser,
  getUserByEmail,
} from "@/lib/services/users.service";
import type { CreateUserInput } from "@/types";

// GET /api/admin/users - Listar usuarios
export async function GET(req: NextRequest) {
  const authResult = await requireSuperAdmin(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");

    let users;
    if (shopId) {
      users = await listUsersByShop(shopId);
    } else {
      users = await listUsers();
    }

    return successResponse({
      users,
      total: users.length,
    });
  } catch (error) {
    console.error("Error listing users:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al listar usuarios",
      500
    );
  }
}

// POST /api/admin/users - Crear usuario
export async function POST(req: NextRequest) {
  const authResult = await requireSuperAdmin(req);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await req.json();

    // Validar campos requeridos
    const requiredFields = ["email", "password", "name", "role"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return errorResponse(`Campo requerido: ${field}`);
      }
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return errorResponse("Email inválido");
    }

    // Verificar si el email ya existe
    const existing = await getUserByEmail(body.email);
    if (existing) {
      return errorResponse("El email ya está registrado");
    }

    // Validar rol
    const validRoles = ["SUPER_ADMIN", "SHOP_OWNER", "SHOP_STAFF"];
    if (!validRoles.includes(body.role)) {
      return errorResponse(`Rol inválido. Opciones: ${validRoles.join(", ")}`);
    }

    // Validar que SHOP_OWNER y SHOP_STAFF tengan shopId
    if (
      (body.role === "SHOP_OWNER" || body.role === "SHOP_STAFF") &&
      !body.shopId
    ) {
      return errorResponse("shopId es requerido para SHOP_OWNER y SHOP_STAFF");
    }

    // Validar staffRole si es SHOP_STAFF
    if (body.role === "SHOP_STAFF") {
      const validStaffRoles = ["owner", "manager", "sales", "warehouse"];
      if (body.staffRole && !validStaffRoles.includes(body.staffRole)) {
        return errorResponse(
          `staffRole inválido. Opciones: ${validStaffRoles.join(", ")}`
        );
      }
    }

    // Validar contraseña
    if (body.password.length < 6) {
      return errorResponse("La contraseña debe tener al menos 6 caracteres");
    }

    const input: CreateUserInput = {
      email: body.email.toLowerCase(),
      password: body.password,
      name: body.name,
      role: body.role,
      shopId: body.shopId,
      staffRole: body.staffRole,
      phone: body.phone,
    };

    const user = await createUser(input);

    return successResponse({ user }, 201);
  } catch (error) {
    console.error("Error creating user:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Error al crear usuario",
      500
    );
  }
}
