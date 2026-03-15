"use client";

import { useState, useEffect } from "react";
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
  Ticket,
  Settings,
  Pencil,
  Trash2,
  Loader2,
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
import type { BookingService } from "@/lib/types/booking.types";

// ─── Service Form Modal ───────────────────────────────────────────────────────

interface ServiceFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  isActive: boolean;
}

const emptyForm: ServiceFormData = { name: "", description: "", price: "", category: "Smartphone", isActive: true };

function ServiceFormModal({
  isOpen,
  onClose,
  onSave,
  initial,
  isSaving,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ServiceFormData) => void;
  initial?: BookingService;
  isSaving?: boolean;
}) {
  const [form, setForm] = useState<ServiceFormData>(emptyForm);

  useEffect(() => {
    if (isOpen) {
      setForm(initial
        ? { name: initial.name, description: initial.description || "", price: initial.price.toString(), category: initial.category || "Smartphone", isActive: initial.isActive }
        : emptyForm
      );
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const inputClass = "w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border border-white/10">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">{initial ? "Editar Servicio" : "Nuevo Servicio"}</h2>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nombre *</label>
            <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Cambio de pantalla" className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Descripción</label>
            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej: Pantalla original con garantía" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Dispositivo</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                <option value="Smartphone" className="bg-zinc-900 text-white">Smartphone</option>
                <option value="Laptop" className="bg-zinc-900 text-white">Laptop</option>
                <option value="Tablet" className="bg-zinc-900 text-white">Tablet</option>
                <option value="Smartwatch" className="bg-zinc-900 text-white">Smartwatch</option>
                <option value="Consola" className="bg-zinc-900 text-white">Consola</option>
                <option value="General" className="bg-zinc-900 text-white">General</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Precio ($)</label>
              <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" className={inputClass} />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {initial ? "Guardar Cambios" : "Agregar Servicio"}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ─── New Ticket Modal ─────────────────────────────────────────────────────────

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

  const inputClass = "w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Nombre del Cliente *</label>
              <input
                type="text"
                required
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className={inputClass}
                placeholder="Juan Pérez"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Teléfono *</label>
              <input
                type="tel"
                required
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className={inputClass}
                placeholder="555-123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Dispositivo</label>
              <select
                value={formData.deviceType}
                onChange={(e) => setFormData({ ...formData, deviceType: e.target.value })}
                className={inputClass}
              >
                <option value="Smartphone" className="bg-zinc-900 text-white">Smartphone</option>
                <option value="Laptop" className="bg-zinc-900 text-white">Laptop</option>
                <option value="Tablet" className="bg-zinc-900 text-white">Tablet</option>
                <option value="Smartwatch" className="bg-zinc-900 text-white">Smartwatch</option>
                <option value="Consola" className="bg-zinc-900 text-white">Consola</option>
                <option value="Otro" className="bg-zinc-900 text-white">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Modelo *</label>
              <input
                type="text"
                required
                value={formData.deviceModel}
                onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                className={inputClass}
                placeholder="iPhone 14 Pro"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Descripción del Problema *</label>
            <textarea
              required
              rows={3}
              value={formData.issueDescription}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
              className={`${inputClass} resize-none`}
              placeholder="Describe el problema del dispositivo..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Costo Estimado (opcional)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                value={formData.estimatedCost}
                onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                className={`${inputClass} pl-8`}
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

// ─── Ticket Detail Modal ──────────────────────────────────────────────────────

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

  const sendQuote = () => {
    const cost = finalCost || ticket.estimatedCost;
    if (!cost) { alert("Ingresa un costo estimado primero"); return; }
    const message = encodeURIComponent(
      `Hola ${ticket.customerName || ""}! 📱\n\nHemos revisado tu ${ticket.deviceType}${ticket.deviceModel ? ` (${ticket.deviceModel})` : ""}.\n\n` +
      `📋 *Diagnóstico:* ${ticket.issueDescription}\n\n` +
      `💰 *Cotización:* $${parseFloat(cost.toString()).toLocaleString("es-MX")}\n\n` +
      `${notes ? `📝 ${notes}\n\n` : ""}` +
      `Folio: ${ticket.folio}\n\n` +
      `¿Autorizas la reparación? Responde SI o NO.`
    );
    // Save the quote
    updateTicket(ticket.id, { estimatedCost: parseFloat(cost.toString()), quoteSentAt: new Date().toISOString() });
    window.open(`https://wa.me/${ticket.customerPhone.replace(/\D/g, "")}?text=${message}`, "_blank");
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 border border-white/10 max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>

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

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Notas / Actualización</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`${inputClass} resize-none text-sm`}
              placeholder="Agregar notas sobre el progreso..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Cotización / Costo
              {ticket.quoteSentAt && (
                <span className="ml-2 text-xs text-green-400 font-normal">
                  ✓ Enviada {new Date(ticket.quoteSentAt).toLocaleDateString("es-MX")}
                </span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input
                type="number"
                value={finalCost}
                onChange={(e) => setFinalCost(e.target.value)}
                className={`${inputClass} pl-8`}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Send Quote button — most important action */}
          <Button
            onClick={sendQuote}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Enviar Cotización por WhatsApp
          </Button>

          {ticket.status !== "delivered" && (
            <Button onClick={handleNextStatus} variant="outline" className="w-full">
              <ChevronRight className="w-4 h-4 mr-2" />
              Avanzar a: {REPAIR_STATUS_CONFIG[statusOrder[currentIndex + 1]]?.label || "Completado"}
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={handleSaveNotes}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Guardar notas
            </Button>
            <Button variant="outline" onClick={sendWhatsApp} className="text-blue-400 border-blue-500/30 hover:bg-blue-500/10">
              <MessageCircle className="w-4 h-4 mr-2" />
              Estado WA
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Servicios del Taller Tab ─────────────────────────────────────────────────

function ServicesTab({ shopId }: { shopId: string }) {
  const [services, setServices] = useState<BookingService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BookingService | undefined>(undefined);
  const [filterDevice, setFilterDevice] = useState("all");

  // Cargar servicios desde Firestore
  useEffect(() => {
    if (!shopId) return;
    setIsLoading(true);
    fetch(`/api/bookings/services?shopId=${shopId}`)
      .then((r) => r.json())
      .then((d) => setServices(d.services || []))
      .catch(() => setError("Error al cargar los servicios"))
      .finally(() => setIsLoading(false));
  }, [shopId]);

  const handleSave = async (form: ServiceFormData) => {
    setIsSaving(true);
    setError(null);
    try {
      if (editing) {
        const res = await fetch(`/api/bookings/services/${editing.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId, name: form.name, description: form.description, price: parseFloat(form.price) || 0, category: form.category, isActive: form.isActive, duration: 0 }),
        });
        if (!res.ok) throw new Error();
        const { service } = await res.json();
        setServices((prev) => prev.map((s) => s.id === editing.id ? service : s));
      } else {
        const res = await fetch("/api/bookings/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shopId, name: form.name, description: form.description, price: parseFloat(form.price) || 0, category: form.category, isActive: true, duration: 0 }),
        });
        if (!res.ok) throw new Error();
        const { service } = await res.json();
        setServices((prev) => [...prev, service]);
      }
      setShowForm(false);
      setEditing(undefined);
    } catch {
      setError("Error al guardar el servicio");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm("¿Eliminar este servicio del catálogo?")) return;
    try {
      await fetch(`/api/bookings/services/${serviceId}?shopId=${shopId}`, { method: "DELETE" });
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
    } catch {
      setError("Error al eliminar el servicio");
    }
  };

  const handleToggleActive = async (service: BookingService) => {
    try {
      const res = await fetch(`/api/bookings/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, isActive: !service.isActive }),
      });
      if (!res.ok) throw new Error();
      const { service: updated } = await res.json();
      setServices((prev) => prev.map((s) => s.id === service.id ? updated : s));
    } catch {
      setError("Error al actualizar el servicio");
    }
  };

  const deviceTypes = ["all", "Smartphone", "Laptop", "Tablet", "Smartwatch", "Consola", "General"];
  const filtered = filterDevice === "all" ? services : services.filter((s) => s.category === filterDevice);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Catálogo de Servicios</h2>
          <p className="text-slate-400 text-sm mt-1">Los servicios que aparecen en tu página pública para que los clientes los soliciten</p>
        </div>
        <Button onClick={() => { setEditing(undefined); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Servicio
        </Button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap mb-6">
        {deviceTypes.map((dt) => (
          <button
            key={dt}
            onClick={() => setFilterDevice(dt)}
            className={cn(
              "px-3 py-1.5 rounded-full text-sm transition-colors",
              filterDevice === dt
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
            )}
          >
            {dt === "all" ? "Todos" : dt}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-white/10 py-16 text-center">
          <Wrench className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">No hay servicios en el catálogo</p>
          <p className="text-slate-500 text-sm">Agrega los servicios que ofrece tu taller para que los clientes los vean</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((service) => (
            <div key={service.id} className="glass-panel rounded-xl border border-white/10 p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium leading-tight">{service.name}</p>
                  {service.category && <p className="text-slate-500 text-xs mt-1">{service.category}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setEditing(service); setShowForm(true); }} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(service.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {service.description && <p className="text-slate-400 text-sm leading-snug">{service.description}</p>}

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
                <span className="text-green-400 font-semibold text-lg">${service.price.toLocaleString()}</span>
                <button
                  onClick={() => handleToggleActive(service)}
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs transition-colors",
                    service.isActive
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                  )}
                >
                  {service.isActive ? "Activo" : "Inactivo"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ServiceFormModal
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditing(undefined); }}
        onSave={handleSave}
        initial={editing}
        isSaving={isSaving}
      />
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function RepairAdminContent({ shopId }: { shopId: string }) {
  const { tickets, getActiveTickets } = useRepair();
  const [tab, setTab] = useState<"tickets" | "services">("tickets");
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
            {tab === "tickets" && (
              <Button onClick={() => setShowNewTicket(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Ticket
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 w-fit mb-8">
          <button
            onClick={() => setTab("tickets")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === "tickets"
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Ticket className="w-4 h-4" />
            Tickets
          </button>
          <button
            onClick={() => setTab("services")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              tab === "services"
                ? "bg-white/10 text-white"
                : "text-slate-400 hover:text-white"
            )}
          >
            <Settings className="w-4 h-4" />
            Servicios del Taller
          </button>
        </div>

        {tab === "services" ? (
          <ServicesTab shopId={shopId} />
        ) : (
          <>
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as RepairStatus | "all")}
                className="px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="all" className="bg-zinc-900 text-white">Todos los estados</option>
                <option value="received" className="bg-zinc-900 text-white">Recibido</option>
                <option value="diagnosing" className="bg-zinc-900 text-white">Diagnóstico</option>
                <option value="repairing" className="bg-zinc-900 text-white">Reparando</option>
                <option value="ready" className="bg-zinc-900 text-white">Listo</option>
                <option value="delivered" className="bg-zinc-900 text-white">Entregado</option>
              </select>
            </div>

            {/* Tickets Table */}
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
          </>
        )}
      </main>

      <NewTicketModal isOpen={showNewTicket} onClose={() => setShowNewTicket(false)} />
      <TicketDetailModal ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </div>
  );
}

// ─── Wrappers ─────────────────────────────────────────────────────────────────

function RepairAdminWithShop() {
  const { user } = useAuth();
  const { getShop } = useShops();
  const shop = user?.shopId ? getShop(user.shopId) : null;
  const shopId = shop?.slug || shop?.id || "default";

  return (
    <RepairProvider shopId={shopId}>
      <RepairAdminContent shopId={shopId} />
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
