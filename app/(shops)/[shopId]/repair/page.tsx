"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  ArrowLeft,
  Package,
  Clock,
  Phone,
  CheckCircle,
  AlertCircle,
  Smartphone,
  Laptop,
  Tablet,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui";
import { RepairProvider, useRepair, REPAIR_STATUS_CONFIG, type RepairStatus } from "@/components/shared";
import { cn } from "@/lib/utils";

function RepairTrackingContent() {
  const params = useParams();
  const shopId = params.shopId as string;
  const { getTicketByFolio } = useRepair();
  const [folio, setFolio] = useState("");
  const [searchedFolio, setSearchedFolio] = useState("");
  const [error, setError] = useState("");

  const ticket = searchedFolio ? getTicketByFolio(searchedFolio) : null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!folio.trim()) {
      setError("Ingresa tu número de folio");
      return;
    }

    setSearchedFolio(folio.trim());
  };

  const getDeviceIcon = (deviceType: string) => {
    const type = deviceType.toLowerCase();
    if (type.includes("laptop") || type.includes("mac")) return Laptop;
    if (type.includes("tablet") || type.includes("ipad")) return Tablet;
    return Smartphone;
  };

  const statusOrder: RepairStatus[] = ["received", "diagnosing", "repairing", "ready", "delivered"];

  const getStatusIndex = (status: RepairStatus) => statusOrder.indexOf(status);

  return (
    <div className="min-h-screen bg-background">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Link href={`/${shopId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Wrench className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  Rastreo de Reparación
                </h1>
                <p className="text-slate-400 text-sm">
                  Consulta el estado de tu dispositivo
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 py-12 max-w-2xl">
        {/* Search Form */}
        <div className="glass-panel rounded-2xl p-6 mb-8 border border-white/10">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Número de Folio
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={folio}
                  onChange={(e) => {
                    setFolio(e.target.value.toUpperCase());
                    setError("");
                  }}
                  placeholder="Ej: REP-001ABC"
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 uppercase tracking-wider"
                />
                <Button type="submit">
                  <Search className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>
              {error && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Results */}
        {searchedFolio && !ticket && (
          <div className="glass-panel rounded-2xl p-8 border border-red-500/20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Folio no encontrado
            </h3>
            <p className="text-slate-400 mb-4">
              No encontramos ninguna reparación con el folio "{searchedFolio}".
              Verifica que esté escrito correctamente.
            </p>
            <Button variant="outline" onClick={() => setSearchedFolio("")}>
              Intentar de nuevo
            </Button>
          </div>
        )}

        {ticket && (
          <div className="space-y-6">
            {/* Ticket Info */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  {(() => {
                    const DeviceIcon = getDeviceIcon(ticket.deviceType);
                    return <DeviceIcon className="w-7 h-7 text-white" />;
                  })()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-slate-400">Folio:</span>
                    <code className="px-2 py-0.5 rounded bg-white/10 text-sm text-white font-mono">
                      {ticket.folio}
                    </code>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    {ticket.deviceModel}
                  </h2>
                  <p className="text-slate-400 text-sm">{ticket.deviceType}</p>
                </div>
              </div>

              {/* Issue */}
              <div className="p-4 rounded-xl bg-white/5 mb-6">
                <p className="text-sm text-slate-400 mb-1">Problema reportado:</p>
                <p className="text-white">{ticket.issueDescription}</p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Estado actual:</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
                      REPAIR_STATUS_CONFIG[ticket.status].color === "blue" && "bg-blue-500/20 text-blue-400",
                      REPAIR_STATUS_CONFIG[ticket.status].color === "purple" && "bg-purple-500/20 text-purple-400",
                      REPAIR_STATUS_CONFIG[ticket.status].color === "amber" && "bg-amber-500/20 text-amber-400",
                      REPAIR_STATUS_CONFIG[ticket.status].color === "green" && "bg-green-500/20 text-green-400",
                      REPAIR_STATUS_CONFIG[ticket.status].color === "slate" && "bg-slate-500/20 text-slate-400"
                    )}
                  >
                    <span>{REPAIR_STATUS_CONFIG[ticket.status].icon}</span>
                    {REPAIR_STATUS_CONFIG[ticket.status].label}
                  </span>
                </div>
                {ticket.estimatedCost && (
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Costo estimado</p>
                    <p className="text-lg font-bold text-white">${ticket.finalCost || ticket.estimatedCost}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="glass-panel rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-6">
                Progreso de Reparación
              </h3>

              <div className="relative">
                {/* Progress line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-white/10" />
                <div
                  className="absolute left-6 top-0 w-0.5 bg-gradient-to-b from-green-500 to-green-500 transition-all duration-500"
                  style={{
                    height: `${(getStatusIndex(ticket.status) / (statusOrder.length - 1)) * 100}%`,
                  }}
                />

                {/* Steps */}
                <div className="space-y-6">
                  {statusOrder.map((status, index) => {
                    const config = REPAIR_STATUS_CONFIG[status];
                    const isCompleted = getStatusIndex(ticket.status) >= index;
                    const isCurrent = ticket.status === status;

                    return (
                      <div key={status} className="relative flex items-start gap-4">
                        {/* Circle */}
                        <div
                          className={cn(
                            "relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-all",
                            isCompleted
                              ? "bg-green-500/20 border-2 border-green-500"
                              : "bg-white/5 border-2 border-white/20"
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-6 h-6 text-green-400" />
                          ) : (
                            <span className="opacity-50">{config.icon}</span>
                          )}
                        </div>

                        {/* Content */}
                        <div className={cn("flex-1 pt-2", !isCompleted && "opacity-50")}>
                          <p className={cn(
                            "font-medium",
                            isCurrent ? "text-green-400" : isCompleted ? "text-white" : "text-slate-400"
                          )}>
                            {config.label}
                          </p>
                          <p className="text-sm text-slate-500">{config.description}</p>
                          {isCurrent && ticket.notes && (
                            <p className="mt-2 text-sm text-slate-300 p-2 rounded-lg bg-white/5">
                              💬 {ticket.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Contact */}
            {ticket.status === "ready" && (
              <div className="glass-panel rounded-2xl p-6 border border-green-500/20 bg-green-500/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-green-400 font-medium">¡Listo para recoger!</p>
                    <p className="text-sm text-slate-400">
                      Tu dispositivo está esperándote
                    </p>
                  </div>
                </div>
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                  <Phone className="w-4 h-4 mr-2" />
                  Contactar para Recoger
                </Button>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Recibido: {new Date(ticket.createdAt).toLocaleDateString("es-MX")}</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                <span>Actualizado: {new Date(ticket.updatedAt).toLocaleDateString("es-MX")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!searchedFolio && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
              <Search className="w-12 h-12 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Rastrea tu Reparación
            </h3>
            <p className="text-slate-400 max-w-md mx-auto">
              Ingresa el número de folio que te dieron cuando dejaste tu dispositivo
              para ver el estado actual de la reparación.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default function RepairTrackingPage() {
  const params = useParams();
  const shopId = params.shopId as string;

  return (
    <RepairProvider shopId={shopId}>
      <RepairTrackingContent />
    </RepairProvider>
  );
}
