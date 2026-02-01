import { Button } from "@/components/ui";
import { Store, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ShopNotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl glass-panel flex items-center justify-center mx-auto mb-8">
          <Store className="w-10 h-10 text-slate-500" />
        </div>

        <h1 className="font-display text-4xl font-bold text-white mb-4">
          Tienda no encontrada
        </h1>

        <p className="text-slate-400 mb-8 max-w-md">
          Lo sentimos, la tienda que buscas no existe o ha sido desactivada.
        </p>

        <Link href="/">
          <Button>
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}
