import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rutas estáticas que no deben ser capturadas por [shopId]
const STATIC_ROUTES = [
  "/admin",
  "/agency",
  "/login",
  "/profile",
  "/staff",
  "/legal",
  "/api",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forzar que /agency/shop/* se resuelva correctamente
  if (pathname.startsWith("/agency/shop/")) {
    // Rewrite explícito para asegurar que la ruta se resuelva
    return NextResponse.rewrite(new URL(pathname, request.url));
  }

  // Si la ruta comienza con una ruta estática, dejar pasar sin modificar
  for (const route of STATIC_ROUTES) {
    if (pathname.startsWith(route)) {
      return NextResponse.next();
    }
  }

  // Para todas las demás rutas, dejar pasar normalmente
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
