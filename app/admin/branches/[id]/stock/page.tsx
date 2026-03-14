"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Loader2, Save, Search } from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth, useShops } from "@/components/shared";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import type { Branch, BranchStockEntry } from "@/lib/types/branch.types";

interface Product {
  id: string;
  name: string;
  price: number;
  image?: string;
  category?: string;
  stock?: number;
}

export default function BranchStockPage() {
  const params = useParams();
  const branchId = params.id as string;
  const { user } = useAuth();
  const { getShop } = useShops();
  const shopId = user?.shopId || "";
  const shop = shopId ? getShop(shopId) : null;

  const [branch, setBranch] = useState<Branch | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [pendingChanges, setPendingChanges] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!shopId || !branchId) return;

    async function load() {
      setIsLoading(true);
      try {
        // Load branch info
        const branchRes = await fetch(`/api/branches/${branchId}?shopId=${shopId}`);
        if (branchRes.ok) {
          const { branch: b } = await branchRes.json();
          setBranch(b);
        }

        // Load products from Firestore (catalog)
        const paths = [shop?.id, shop?.slug].filter(Boolean) as string[];
        let prods: Product[] = [];
        for (const path of paths) {
          const snap = await getDocs(collection(db, "shops", path, "products"));
          prods = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
          if (prods.length > 0) break;
        }
        setProducts(prods);

        // Load branch stock
        const stockRes = await fetch(`/api/branches/${branchId}/stock?shopId=${shopId}`);
        if (stockRes.ok) {
          const { stock } = await stockRes.json();
          const map: Record<string, number> = {};
          (stock as BranchStockEntry[]).forEach((s) => { map[s.productId] = s.quantity; });
          setStockMap(map);
        }
      } catch {
        setError("Error al cargar datos");
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [shopId, branchId, shop?.id, shop?.slug]);

  const getStock = (productId: string) =>
    pendingChanges[productId] ?? stockMap[productId] ?? 0;

  const handleChange = (productId: string, value: number) => {
    setPendingChanges((prev) => ({ ...prev, [productId]: Math.max(0, value) }));
  };

  const handleSaveAll = async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    setIsSaving(true);
    setError(null);
    try {
      await Promise.all(
        Object.entries(pendingChanges).map(([productId, quantity]) =>
          fetch(`/api/branches/${branchId}/stock`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ shopId, productId, quantity }),
          })
        )
      );
      setStockMap((prev) => ({ ...prev, ...pendingChanges }));
      setPendingChanges({});
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Error al guardar los cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const hasChanges = Object.keys(pendingChanges).length > 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-white/10 py-6 sticky top-0 z-10 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/branches">
                <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /></Button>
              </Link>
              <div>
                <h1 className="font-bold text-white text-lg">{branch?.name || "Sucursal"} — Inventario</h1>
                <p className="text-slate-400 text-sm">{branch?.address || "Cargando..."}</p>
              </div>
            </div>
            <Button onClick={handleSaveAll} disabled={!hasChanges || isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {saved ? "¡Guardado!" : "Guardar Cambios"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 text-sm text-slate-300">
          Ajusta el stock disponible en <span className="text-white font-medium">{branch?.name}</span>. Los precios y descripciones son del catálogo compartido y no cambian por sucursal.
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 text-sm"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-slate-500 animate-spin" /></div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay productos en el catálogo</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredProducts.map((product) => {
              const qty = getStock(product.id);
              const hasChange = pendingChanges[product.id] !== undefined;

              return (
                <div
                  key={product.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                    hasChange ? "bg-primary/5 border-primary/20" : "bg-white/5 border-white/10"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{product.name}</p>
                    <p className="text-slate-500 text-xs">${product.price?.toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleChange(product.id, qty - 1)}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors font-bold"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={qty}
                      onChange={(e) => handleChange(product.id, parseInt(e.target.value) || 0)}
                      className="w-16 text-center px-2 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50"
                    />
                    <button
                      onClick={() => handleChange(product.id, qty + 1)}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
