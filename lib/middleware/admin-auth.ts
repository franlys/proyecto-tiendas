import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/firebase";
import { getUserByEmail } from "@/lib/services/users.service";

// Lista de emails de super admins (configurar en env en producción)
const SUPER_ADMIN_EMAILS = [
  "franlysgonzaleztejeda@gmail.com",
];

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "SHOP_OWNER" | "SHOP_STAFF";
  shopId?: string;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error?: string;
}

// Verificar token de autorización
export async function verifyAdminToken(
  req: NextRequest
): Promise<AuthResult> {
  try {
    // Obtener token del header
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        user: null,
        error: "Token de autorización requerido",
      };
    }

    const token = authHeader.split(" ")[1];

    // Aceptar tokens simples para super admins autorizados
    // TODO: Migrar a Firebase Auth tokens en el futuro
    // Token de super admin: "dev-admin-{email}"
    if (token.startsWith("dev-admin-")) {
      const email = token.replace("dev-admin-", "");
      if (SUPER_ADMIN_EMAILS.includes(email)) {
        return {
          user: {
            id: "super-admin",
            email,
            name: "Super Admin",
            role: "SUPER_ADMIN",
          },
        };
      }
    }

    // Token de shop owner: "dev-owner-{shopId}"
    if (token.startsWith("dev-owner-")) {
      const shopId = token.replace("dev-owner-", "");
      return {
        user: {
          id: `owner-${shopId}`,
          email: `owner@${shopId}.nexo`,
          name: "Shop Owner",
          role: "SHOP_OWNER",
          shopId,
        },
      };
    }

    // Token no reconocido
    return {
      user: null,
      error: "Token inválido",
    };
  } catch (error) {
    console.error("Error verifying token:", error);
    return {
      user: null,
      error: "Error al verificar token",
    };
  }
}

// Middleware helper para rutas de super admin
export async function requireSuperAdmin(
  req: NextRequest
): Promise<NextResponse | AuthenticatedUser> {
  const { user, error } = await verifyAdminToken(req);

  if (!user) {
    return NextResponse.json(
      { error: error || "No autorizado" },
      { status: 401 }
    );
  }

  if (user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Acceso denegado. Se requiere rol de Super Admin." },
      { status: 403 }
    );
  }

  return user;
}

// Middleware helper para rutas de shop owner (o super admin)
export async function requireShopAccess(
  req: NextRequest,
  shopId: string
): Promise<NextResponse | AuthenticatedUser> {
  const { user, error } = await verifyAdminToken(req);

  if (!user) {
    return NextResponse.json(
      { error: error || "No autorizado" },
      { status: 401 }
    );
  }

  // Super admin tiene acceso a todo
  if (user.role === "SUPER_ADMIN") {
    return user;
  }

  // Shop owner solo a su tienda
  if (user.role === "SHOP_OWNER" && user.shopId === shopId) {
    return user;
  }

  return NextResponse.json(
    { error: "No tienes acceso a esta tienda" },
    { status: 403 }
  );
}

// Helper para crear respuestas de error
export function errorResponse(
  message: string,
  status: number = 400
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

// Helper para crear respuestas de éxito
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
