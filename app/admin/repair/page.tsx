"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Wrench,
  Plus,
  Search,
  Phone,
  Smartphone,
  Laptop,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  ChevronRight,
  DollarSign,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  RepairProvider,
  useRepair,
  REPAIR_STATUS_CONFIG,
  type RepairTicket,
  type RepairStatus,
  useAuth,
  useShops,
  ShopsProvider,
} from "@/components/shared";
import { cn } from "@/lib/utils";

// New Ticket Modal
function NewTicketModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { createTicket } = useRepair();
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    deviceType: "Smartphone",
    deviceModel: "",
    issueDescription: "",
    estimatedCost: "",
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newTicket = createTicket({
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      deviceType: formData.deviceType,
      deviceModel: formData.deviceModel,
      issueDescription: formData.issueDescription,
      estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
      status: "received",
    });

    // Show folio to user
    alert(`✅ Ticket creado!\n\nFolio: ${newTicket.folio}\n\nComparte este folio con el cliente para que pueda rastrear su reparación.`);

    setFormData({
      customerName: "",
      customerPhone: "",
      deviceType: "Smartphone",
      deviceModel: "",
      issueDescription: "",
      estimatedCost: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Plus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Nuevo Ticket</h2>
            <p className="text-sm text-slate-400">Registrar dispositivo para reparación</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre del Cliente *
              </label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                required
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                placeholder="555-123-4567"
              />
            </div>
          </div>

          {/* Device Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tipo de Dispositivo
              </label>
              <select
                value={formData.deviceType}
                onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="Smartphone">📱 Smartphone</option>
                <option value="Laptop">💻 Laptop</option>
                <option value="Tablet">📲 Tablet</option>
                <option value="Smartwatch">⌚ Smartwatch</option>
                <option value="Consola">🎮 Consola</option>
                <option value="Otro">🔧 Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Modelo *
              </label>
              <input
                type="text"
                required
                value={formData.deviceModel}
                onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                placeholder="iPhone 14 Pro"
              />
            </div>
          </div>

          {/* Issue */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Descripción del Problema *
            </label>
            <textarea
              required
              rows={3}
              value={formData.issueDescription}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
              placeholder="Describe el problema del dispositivo..."
            />
          </div>

          {/* Estimated Cost */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Costo Estimado (opcional)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                placeholder="0.00"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Crear Ticket de Reparación
          </Button>
        </form>
      </div>
    </div>
  );
}

// Ticket Detail Modal
function TicketDetailModal({
  ticket,
  onClose,
}: {
  ticket: RepairTicket | null;
  onClose: () => void;
}) {
  const { updateTicketStatus, updateTicket } = useRepair();
  const [notes, setNotes] = useState(ticket?.notes || "");
  const [finalCost, setFinalCost] = useState(ticket?.finalCost?.toString() || ticket?.estimatedCost?.toString() || "");

  if (!ticket) return null;

  const statusOrder: RepairStatus[] = ["received", "diagnosing", "repairing", "ready", "delivered"];
  const currentIndex = statusOrder.indexOf(ticket.status);

  const handleNextStatus = () => {
    if (currentIndex < statusOrder.length - 1) {
      const nextStatus = statusOrder[currentIndex + 1];
      if (nextStatus === "delivered" && finalCost) {
        updateTicket(ticket.id, { finalCost: parseFloat(finalCost) });
      }
      updateTicketStatus(ticket.id, nextStatus, notes || undefined);
    }
  };

  const handleSaveNotes = () => {
    updateTicket(ticket.id, { notes, finalCost: finalCost ? parseFloat(finalCost) : undefined });
  };

  const sendWhatsApp = () => {
    const status = REPAIR_STATUS_CONFIG[ticket.status];
    const message = encodeURIComponent(
      `Hola ${ticket.customerName}! 📱\n\nTu ${ticket.deviceModel} está: ${status.icon} ${status.label}\n\nFolio: ${ticket.folio}\n${ticket.notes ? `\nNota: ${ticket.notes}` : ""}`
    );
    window.open(`https://wa.me/${ticket.customerPhone.replace(/\D/g, "")}?text=${message}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            {ticket.deviceType.toLowerCase().includes("laptop") ? (
              <Laptop className="w-7 h-7 text-white" />
            ) : (
              <Smartphone className="w-7 h-7 text-white" />
            )}
          </div>
          <div className="flex-1">
            <code className="px-2 py-0.5 rounded bg-white/10 text-xs text-slate-300 font-mono">
              {ticket.folio}
            </code>
            <h2 className="text-xl font-bold text-white mt-1">{ticket.deviceModel}</h2>
            <p className="text-slate-400 text-sm">{ticket.customerName} • {ticket.customerPhone}</p>
          </div>
        </div>

        {/* Current Status */}
        <div className="p-4 rounded-xl bg-white/5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm">Estado actual</span>
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
          <p className="text-white text-sm">{ticket.issueDescription}</p>
        </div>

        {/* Notes & Cost */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notas / Actualización
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none text-sm"
              placeholder="Agregar notas sobre el progreso..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Costo Final
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                value={finalCost}
                onChange={(e) => setFinalCost(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                placeholder={ticket.estimatedCost?.toString() || "0.00"}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {ticket.status !== "delivered" && (
            <Button onClick={handleNextStatus} className="w-full">
              <ChevronRight className="w-4 h-4 mr-2" />
              Avanzar a: {REPAIR_STATUS_CONFIG[statusOrder[currentIndex + 1]]?.label || "Completado"}
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleSaveNotes}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Guardar
            </Button>
            <Button variant="outline" onClick={sendWhatsApp} className="text-green-400 border-green-500/30 hover:bg-green-500/10">
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RepairAdminContent() {
  const { tickets, getActiveTickets } = useRepair();
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<RepairStatus | "all">("all");

  const activeTickets = getActiveTickets();

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.folio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.deviceModel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: tickets.length,
    active: activeTickets.length,
    ready: tickets.filter((t) => t.status === "ready").length,
    repairing: tickets.filter((t) => t.status === "repairing").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">Taller</h1>
                  <p className="text-slate-400 text-sm">Gestión de reparaciones</p>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowNewTicket(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Ticket
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-slate-400">Total Tickets</p>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-blue-500/20">
            <p className="text-2xl font-bold text-blue-400">{stats.active}</p>
            <p className="text-xs text-slate-400">En Proceso</p>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-amber-500/20">
            <p className="text-2xl font-bold text-amber-400">{stats.repairing}</p>
            <p className="text-xs text-slate-400">Reparando</p>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-green-500/20">
            <p className="text-2xl font-bold text-green-400">{stats.ready}</p>
            <p className="text-xs text-slate-400">Listos</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por folio, cliente o modelo..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as RepairStatus | "all")}
            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">Todos los estados</option>
            <option value="received">📥 Recibido</option>
            <option value="diagnosing">🔍 Diagnóstico</option>
            <option value="repairing">🔧 Reparando</option>
            <option value="ready">✅ Listo</option>
            <option value="delivered">🎉 Entregado</option>
          </select>
        </div>

        {/* Tickets List */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">Folio</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">Dispositivo</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">Cliente</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">Estado</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">Costo</th>
                  <th className="px-6 py-4 text-sm font-medium text-slate-400">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 rounded bg-white/10 text-sm text-white font-mono">
                        {ticket.folio}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {ticket.deviceType.toLowerCase().includes("laptop") ? (
                          <Laptop className="w-4 h-4 text-slate-400" />
                        ) : (
                          <Smartphone className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-white">{ticket.deviceModel}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-white text-sm">{ticket.customerName}</p>
                        <p className="text-xs text-slate-500">{ticket.customerPhone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                          REPAIR_STATUS_CONFIG[ticket.status].color === "blue" && "bg-blue-500/20 text-blue-400",
                          REPAIR_STATUS_CONFIG[ticket.status].color === "purple" && "bg-purple-500/20 text-purple-400",
                          REPAIR_STATUS_CONFIG[ticket.status].color === "amber" && "bg-amber-500/20 text-amber-400",
                          REPAIR_STATUS_CONFIG[ticket.status].color === "green" && "bg-green-500/20 text-green-400",
                          REPAIR_STATUS_CONFIG[ticket.status].color === "slate" && "bg-slate-500/20 text-slate-400"
                        )}
                      >
                        {REPAIR_STATUS_CONFIG[ticket.status].icon} {REPAIR_STATUS_CONFIG[ticket.status].label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white">
                      ${ticket.finalCost || ticket.estimatedCost || "-"}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {new Date(ticket.createdAt).toLocaleDateString("es-MX")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
              <Wrench className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No hay tickets que coincidan</p>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <NewTicketModal isOpen={showNewTicket} onClose={() => setShowNewTicket(false)} />
      <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}

function RepairAdminWithShop() {
  const { user } = useAuth();
  const { getShop } = useShops();
  const shop = user?.shopId ? getShop(user.shopId) : null;

  return (
    <RepairProvider shopId={shop?.slug || shop?.id || "default"}>
      <RepairAdminContent />
    </RepairProvider>
  );
}

export default function RepairAdminPage() {
  return (
    <ShopsProvider>
      <RepairAdminWithShop />
    </ShopsProvider>
  );
}
