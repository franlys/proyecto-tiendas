import { NextRequest, NextResponse } from "next/server";
import { MOCK_SHOPS } from "@/lib/constants";
import { cookies } from "next/headers";

// GET /api/shops/[shopId] - Obtener datos de una tienda
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shopId: string }> }
) {
  const { shopId } = await params;

  // 1. Primero buscar en MOCK_SHOPS (tiendas demo)
  const mockShop = MOCK_SHOPS[shopId];
  if (mockShop) {
    return NextResponse.json({ shop: mockShop, source: "mock" });
  }

  // 2. Buscar en cookies (sincronizado desde localStorage del cliente)
  const cookieStore = await cookies();
  const managedShopsCookie = cookieStore.get("nexo-managed-shops");

  if (managedShopsCookie?.value) {
    try {
      const managedShops = JSON.parse(managedShopsCookie.value);
      const shop = managedShops.find((s: { slug: string }) => s.slug === shopId);

      if (shop) {
        // Convertir ManagedShop a ShopConfig
        const shopConfig = {
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          description: shop.description || "",
          theme: shop.theme,
          contact: shop.contact,
          businessType: shop.businessType || (shop.category === "beauty" ? "beauty" : shop.category === "repair" ? "repair" : "retail"),
          wholesaleEnabled: shop.wholesaleEnabled || false,
        };

        return NextResponse.json({ shop: shopConfig, source: "managed" });
      }
    } catch (error) {
      console.error("Error parsing managed shops cookie:", error);
    }
  }

  // 3. No encontrada
  return NextResponse.json(
    { error: "Shop not found", shopId },
    { status: 404 }
  );
}
