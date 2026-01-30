"use client";

import { Star, Phone, Calendar, DollarSign, ChevronRight } from "lucide-react";
import type { Client } from "@/components/shared/clients-context";
import { cn } from "@/lib/utils";

interface ClientListProps {
  clients: Client[];
  onSelectClient: (client: Client) => void;
  selectedClientId?: string;
}

export function ClientList({
  clients,
  onSelectClient,
  selectedClientId,
}: ClientListProps) {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
    });
  };

  if (clients.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-slate-500" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Sin clientes aún
        </h3>
        <p className="text-slate-400 text-sm max-w-xs mx-auto">
          Los clientes aparecerán aquí cuando realicen su primera reserva.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-400 uppercase tracking-wider">
          <div className="col-span-4">Cliente</div>
          <div className="col-span-2 hidden md:block">Teléfono</div>
          <div className="col-span-2">Última Visita</div>
          <div className="col-span-2">Total</div>
          <div className="col-span-2 text-right">Visitas</div>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-white/5">
        {clients.map((client) => (
          <button
            key={client.id}
            onClick={() => onSelectClient(client)}
            className={cn(
              "w-full px-6 py-4 text-left transition-colors",
              "hover:bg-white/5",
              selectedClientId === client.id && "bg-white/10"
            )}
          >
            <div className="grid grid-cols-12 gap-4 items-center">
              {/* Name & VIP Badge */}
              <div className="col-span-4 flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {client.isVIP && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                      <Star className="w-3 h-3 text-background" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate flex items-center gap-2">
                    {client.name}
                  </p>
                  {client.notes.length > 0 && (
                    <p className="text-xs text-slate-500">
                      {client.notes.length} nota{client.notes.length !== 1 && "s"}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="col-span-2 hidden md:block">
                <p className="text-sm text-slate-400">{client.phone}</p>
              </div>

              {/* Last Visit */}
              <div className="col-span-2">
                <p className="text-sm text-slate-300">
                  {formatDate(client.lastVisit)}
                </p>
              </div>

              {/* Total Spent */}
              <div className="col-span-2">
                <p className="text-sm font-medium text-gold">
                  ${client.totalSpent.toLocaleString()}
                </p>
              </div>

              {/* Visits Count */}
              <div className="col-span-2 flex items-center justify-end gap-2">
                <span className="text-sm text-slate-300">
                  {client.totalVisits}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
