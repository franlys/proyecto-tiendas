"use client";

import { Button } from "@/components/ui";
import { useShop } from "@/components/shared";
import { Calendar, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function BookingPage() {
  const shop = useShop();
  const params = useParams();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link
          href={`/${params.shopId}`}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a {shop?.name}
        </Link>

        {/* Booking Header */}
        <div className="glass-panel rounded-2xl p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-8 h-8 text-white" />
          </div>

          <h1 className="font-display text-3xl font-bold text-white mb-4">
            Reserva tu Cita
          </h1>

          <p className="text-slate-400 mb-8">
            Selecciona el servicio, fecha y hora que mejor te convenga.
          </p>

          {/* Placeholder for booking flow */}
          <div className="bg-surface/50 rounded-xl p-8 border border-dashed border-white/20 mb-8">
            <p className="text-slate-500">
              El flujo de reservas se implementará en la Fase 2
            </p>
          </div>

          <Button size="lg" disabled>
            Continuar
          </Button>
        </div>
      </div>
    </div>
  );
}
