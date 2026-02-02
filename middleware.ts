import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
    const url = req.nextUrl;
    const hostname = req.headers.get("host") || "";

    // 1. Ignorar dominios locales o de Vercel por defecto (si se desea)
    // Pero permitimos subdominios para pruebas si es necesario.
    // Dominio principal del proyecto (ajustar según tu despliegue real)
    const isMainDomain = hostname.includes("vercel.app") || hostname.includes("localhost");

    // Si es el dominio principal, no hacemos reescritura de dominio -> ruta
    // (A menos que uses subdominios como tienda1.tuapp.com)
    if (isMainDomain) {
        // Aquí podrías manejar subdominios si quisieras (ej: messi.vercel.app -> /messi)
        return NextResponse.next();
    }

    // ==== LÓGICA DE DOMINIO PERSONALIZADO ====
    // Si llegamos aquí, es un dominio externo, ej: "pizzeria-luigi.com"

    // 2. Leer las tiendas desde la cookie 'nexo-managed-shops'
    // Nota: En un entorno de producción real, esto podría hacerse consultando una API rápida (Edge Config / Redis)
    // o confiando en que la cookie está presente si el usuario visitó el admin antes (lo cual no siempre es cierto para visitantes anónimos).
    // PARA PRODUCCIÓN: Lo ideal es usar Vercel Edge Config o una llamada ligera a BD.
    // PARA ESTE PROTOTIPO: Usaremos la cookie si existe, o un mapeo hardcodeado de ejemplo.

    const shopsCookie = req.cookies.get("linko-managed-shops");
    let foundShopSlug = null;

    if (shopsCookie?.value) {
        try {
            const shops = JSON.parse(decodeURIComponent(shopsCookie.value));
            const shop = shops.find((s: any) => s.customDomain === hostname);
            if (shop) {
                foundShopSlug = shop.slug;
            }
        } catch (e) {
            console.error("Middleware: Error parsing shops cookie", e);
        }
    }

    // 3. Reescribir la URL
    if (foundShopSlug) {
        // Reescribimos: pizzeria-luigi.com/book -> /estetica-lola/book
        // Mantenemos el path original y query params
        url.pathname = `/${foundShopSlug}${url.pathname}`;
        return NextResponse.rewrite(url);
    }

    // Si no encontramos tienda para este dominio...
    // Podríamos mostrar una 404 personalizada o dejar pasar (seguramente dará 404 del app)
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
