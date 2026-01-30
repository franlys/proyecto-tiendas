"use client";

import { useState } from "react";
import {
  Star,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  X,
  Clock,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui";
import type { Client } from "@/components/shared/clients-context";
import { cn } from "@/lib/utils";

interface ClientDetailProps {
  client: Client;
  onClose: () => void;
  onAddNote: (clientId: string, note: string) => void;
  onDeleteNote: (clientId: string, noteId: string) => void;
  onToggleVIP: (clientId: string) => void;
}

export function ClientDetail({
  client,
  onClose,
  onAddNote,
  onDeleteNote,
  onToggleVIP,
}: ClientDetailProps) {
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(client.id, newNote.trim());
      setNewNote("");
      setIsAddingNote(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="relative p-6 border-b border-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
              <span className="text-white font-bold text-2xl">
                {client.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {client.isVIP && (
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                <Star className="w-4 h-4 text-background" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white mb-1">{client.name}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1">
                <Phone className="w-4 h-4" />
                {client.phone}
              </span>
              {client.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {client.email}
                </span>
              )}
            </div>
          </div>

          {/* VIP Toggle */}
          <button
            onClick={() => onToggleVIP(client.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl transition-all",
              client.isVIP
                ? "bg-gold/20 text-gold border border-gold/30"
                : "bg-white/5 text-slate-400 border border-white/10 hover:border-gold/30 hover:text-gold"
            )}
          >
            <Star className={cn("w-4 h-4", client.isVIP && "fill-current")} />
            <span className="text-sm font-medium">VIP</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-white">{client.totalVisits}</p>
            <p className="text-xs text-slate-400">Visitas</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-gold">
              ${client.totalSpent.toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">Total Gastado</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5">
            <p className="text-2xl font-bold text-white">
              ${Math.round(client.totalSpent / client.totalVisits).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400">Ticket Promedio</p>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-gold" />
            Notas Privadas
          </h3>
          {!isAddingNote && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAddingNote(true)}
            >
              <Plus className="w-4 h-4" />
              Agregar
            </Button>
          )}
        </div>

        {/* Add Note Form */}
        {isAddingNote && (
          <div className="mb-4">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Escribe una nota privada sobre este cliente... (ej: 'Le gusta el café sin azúcar', 'Alérgica al látex')"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-gold/50 transition-colors resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                Guardar Nota
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewNote("");
                  setIsAddingNote(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Notes List */}
        {client.notes.length > 0 ? (
          <div className="space-y-3">
            {client.notes.map((note) => (
              <div
                key={note.id}
                className="group relative p-4 rounded-xl bg-gold/5 border border-gold/10"
              >
                <p className="text-white text-sm pr-8">{note.text}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {formatDate(note.createdAt)} · {formatTime(note.createdAt)}
                </p>
                <button
                  onClick={() => onDeleteNote(client.id, note.id)}
                  className="absolute top-3 right-3 p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-500 text-sm">
            <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Sin notas aún</p>
            <p className="text-xs">
              Agrega notas para recordar preferencias del cliente
            </p>
          </div>
        )}
      </div>

      {/* Order History */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Historial de Visitas
        </h3>

        {client.orders.length > 0 ? (
          <div className="space-y-3">
            {client.orders
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-white">
                        {formatDate(order.date)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatTime(order.date)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gold">
                      ${order.total.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {order.items.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded-md bg-white/5 text-xs text-slate-300"
                      >
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-center text-slate-500 text-sm py-6">
            Sin historial de visitas
          </p>
        )}
      </div>
    </div>
  );
}
