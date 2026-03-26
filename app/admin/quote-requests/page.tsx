"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/shared";
import { MessageSquarePlus, Clock, Loader2, CheckCircle, XCircle, RefreshCw, Mail, Phone, Tag, FileText, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuoteRequest, QuoteRequestStatus } from "@/lib/types/quote-request.types";

const STATUS_LABELS: Record<QuoteRequestStatus, string> = {
  pending: "Pendiente",
  in_progress: "En Proceso",
  responded: "Respondida",
  closed: "Cerrada",
};

const STATUS_COLORS: Record<QuoteRequestStatus, string> = {
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  in_progress: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  responded: "text-green-400 bg-green-400/10 border-green-400/20",
  closed: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

function StatusBadge({ status }: { status: QuoteRequestStatus }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function QuoteCard({ quote, shopId, onUpdated }: { quote: QuoteRequest; shopId: string; onUpdated: () => void }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState(quote.adminNotes || "");
  const [savingNotes, setSavingNotes] = useState(false);

  const updateStatus = async (status: QuoteRequestStatus) => {
    setIsUpdating(true);
    try {
      await fetch(`/api/quote-requests/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, status }),
      });
      onUpdated();
    } finally {
      setIsUpdating(false);
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await fetch(`/api/quote-requests/${quote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, adminNotes: notes }),
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const createdAt = quote.createdAt
    ? new Date(quote.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden hover:border-white/12 transition-colors">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(v => !v)}
        className="w-full px-5 py-4 flex items-start gap-4 text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
          <MessageSquarePlus className="w-5 h-5 text-white/40" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-black text-white text-sm">{quote.customerName}</span>
            <StatusBadge status={quote.status} />
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/35">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />{quote.category}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />{createdAt}
            </span>
          </div>
          <p className="text-xs text-white/50 mt-1.5 line-clamp-1">{quote.description}</p>
        </div>

        <ChevronDown className={cn("w-4 h-4 text-white/30 flex-shrink-0 mt-1 transition-transform", isExpanded && "rotate-180")} />
      </button>

      {/* Expanded */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
          {/* Description */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-white/25 uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-3 h-3" /> Descripción
            </p>
            <p className="text-sm text-white/70 leading-relaxed bg-white/3 rounded-xl px-4 py-3">
              {quote.description}
            </p>
          </div>

          {/* Contact info */}
          <div className="space-y-1">
            <p className="text-[10px] font-black text-white/25 uppercase tracking-widest">Contacto</p>
            <div className="flex items-center gap-2 text-sm text-white/60">
              {quote.contactPreference === "email" ? (
                <><Mail className="w-3.5 h-3.5 text-white/30" />{quote.email}</>
              ) : (
                <><Phone className="w-3.5 h-3.5 text-white/30" />{quote.phone}</>
              )}
              <span className="text-[10px] text-white/25 uppercase">
                ({quote.contactPreference === "email" ? "correo" : "WhatsApp"})
              </span>
            </div>
          </div>

          {/* Admin notes */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-white/25 uppercase tracking-widest">Notas Internas</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Agrega notas sobre esta solicitud..."
              rows={2}
              className="w-full px-3 py-2 bg-white/5 border border-white/8 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/20 resize-none"
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="text-[10px] font-bold text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
            >
              {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Guardar notas
            </button>
          </div>

          {/* Status actions */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {(["pending", "in_progress", "responded", "closed"] as QuoteRequestStatus[])
              .filter(s => s !== quote.status)
              .map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={isUpdating}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all",
                    STATUS_COLORS[s],
                    "hover:opacity-80 disabled:opacity-40"
                  )}
                >
                  {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : STATUS_LABELS[s]}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuoteRequestsPage() {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<QuoteRequestStatus | "all">("all");

  const shopId = user?.shopId;

  const loadQuotes = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/quote-requests?shopId=${shopId}`);
      const data = await res.json();
      setQuotes(data.requests || []);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => { loadQuotes(); }, [loadQuotes]);

  const filtered = filter === "all" ? quotes : quotes.filter(q => q.status === filter);
  const pendingCount = quotes.filter(q => q.status === "pending").length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <MessageSquarePlus className="w-6 h-6 text-white/50" />
            <h1 className="text-2xl font-black tracking-tight">Solicitudes de Cotización</h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs font-black rounded-full">
                {pendingCount} nueva{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-white/35">Clientes que buscan productos o precios especiales</p>
        </div>
        <button
          onClick={loadQuotes}
          disabled={loading}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {(["all", "pending", "in_progress", "responded", "closed"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
              filter === f
                ? "bg-white/10 border-white/20 text-white"
                : "bg-transparent border-white/5 text-white/30 hover:text-white/60"
            )}
          >
            {f === "all" ? `Todas (${quotes.length})` : `${STATUS_LABELS[f]} (${quotes.filter(q => q.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-white/30" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center space-y-3">
          <XCircle className="w-10 h-10 text-white/10 mx-auto" />
          <p className="text-white/25 text-sm uppercase tracking-widest font-mono">
            {filter === "all" ? "Sin solicitudes aún" : `Sin solicitudes ${STATUS_LABELS[filter as QuoteRequestStatus].toLowerCase()}s`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(quote => (
            <QuoteCard
              key={quote.id}
              quote={quote}
              shopId={shopId!}
              onUpdated={loadQuotes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
