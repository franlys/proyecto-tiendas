"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/shared";
import {
  Users, Clock, Loader2, CheckCircle, XCircle, RefreshCw,
  ChevronDown, Phone, Building2, Hash, User, MessageSquare,
  Copy, Check, Unlock, ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { WholesaleRequest, WholesaleRequestStatus } from "@/lib/types/wholesale-request.types";

const STATUS_LABELS: Record<WholesaleRequestStatus, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const STATUS_COLORS: Record<WholesaleRequestStatus, string> = {
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  approved: "text-green-400 bg-green-400/10 border-green-400/20",
  rejected: "text-red-400 bg-red-400/10 border-red-400/20",
};

function StatusBadge({ status }: { status: WholesaleRequestStatus }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── REQUEST CARD ───────────────────────────────────────────────────────────

function RequestCard({ req, shopId, onUpdated }: {
  req: WholesaleRequest;
  shopId: string;
  onUpdated: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState(req.adminNotes || "");
  const [code, setCode] = useState(req.wholesaleCode || "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  const updateStatus = async (status: WholesaleRequestStatus) => {
    setIsUpdating(true);
    try {
      await fetch(`/api/wholesale-requests/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, status }),
      });
      onUpdated();
    } finally {
      setIsUpdating(false);
    }
  };

  const saveNotesAndCode = async () => {
    setSavingNotes(true);
    try {
      await fetch(`/api/wholesale-requests/${req.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, adminNotes: notes, wholesaleCode: code }),
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const generateCode = () => {
    // 4-digit random code
    setCode(String(Math.floor(1000 + Math.random() * 9000)));
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  };

  const createdAt = req.createdAt
    ? new Date(req.createdAt).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden hover:border-white/12 transition-colors">
      <button
        type="button"
        onClick={() => setIsExpanded(v => !v)}
        className="w-full px-5 py-4 flex items-start gap-4 text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Users className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-black text-white text-sm">{req.fullName}</span>
            <StatusBadge status={req.status} />
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/35 flex-wrap">
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{req.phone}</span>
            {req.businessName && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{req.businessName}</span>}
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{createdAt}</span>
          </div>
          {req.wholesaleCode && (
            <p className="text-[11px] text-amber-400 font-mono mt-1">Código: {req.wholesaleCode}</p>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-white/30 flex-shrink-0 mt-1 transition-transform", isExpanded && "rotate-180")} />
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { icon: <User className="w-3 h-3" />, label: "Nombre", value: req.fullName },
              { icon: <Phone className="w-3 h-3" />, label: "Teléfono", value: req.phone },
              req.businessName ? { icon: <Building2 className="w-3 h-3" />, label: "Negocio", value: req.businessName } : null,
              req.rnc ? { icon: <Hash className="w-3 h-3" />, label: "RNC", value: req.rnc } : null,
            ].filter(Boolean).map(item => item && (
              <div key={item.label} className="space-y-0.5">
                <p className="text-[10px] font-black text-white/25 uppercase tracking-widest flex items-center gap-1">{item.icon}{item.label}</p>
                <p className="text-white/70 text-xs">{item.value}</p>
              </div>
            ))}
          </div>

          {req.message && (
            <div className="space-y-1">
              <p className="text-[10px] font-black text-white/25 uppercase tracking-widest flex items-center gap-1.5">
                <MessageSquare className="w-3 h-3" /> Mensaje
              </p>
              <p className="text-sm text-white/60 bg-white/3 rounded-xl px-4 py-3 leading-relaxed">{req.message}</p>
            </div>
          )}

          {/* Code assignment */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-white/25 uppercase tracking-widest flex items-center gap-1.5">
              <Unlock className="w-3 h-3" /> Código de acceso mayorista
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Ej: 4821 o número de teléfono"
                className="flex-1 px-3 py-2 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/20 font-mono"
              />
              <button
                type="button"
                onClick={generateCode}
                className="px-3 py-2 bg-white/8 border border-white/10 rounded-xl text-xs font-bold text-white/50 hover:text-white transition-colors whitespace-nowrap"
              >
                Auto
              </button>
              {code && (
                <button
                  type="button"
                  onClick={copyCode}
                  className="px-3 py-2 bg-white/8 border border-white/10 rounded-xl text-white/50 hover:text-white transition-colors"
                >
                  {codeCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              )}
            </div>
            <p className="text-[10px] text-white/20">Este código se usa para que el cliente active precios mayoristas en el catálogo.</p>
          </div>

          {/* Admin notes */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-white/25 uppercase tracking-widest">Notas internas</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Primera compra realizada, monto, fecha de aprobación..."
              rows={2}
              className="w-full px-3 py-2 bg-white/5 border border-white/8 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/20 resize-none"
            />
            <button
              onClick={saveNotesAndCode}
              disabled={savingNotes}
              className="text-[10px] font-bold text-white/40 hover:text-white/70 flex items-center gap-1 transition-colors"
            >
              {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
              Guardar código y notas
            </button>
          </div>

          {/* Status actions */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {req.status !== "approved" && (
              <button
                onClick={() => updateStatus("approved")}
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all hover:opacity-80 disabled:opacity-40 text-green-400 bg-green-400/10 border-green-400/20"
              >
                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Aprobar"}
              </button>
            )}
            {req.status !== "rejected" && (
              <button
                onClick={() => updateStatus("rejected")}
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all hover:opacity-80 disabled:opacity-40 text-red-400 bg-red-400/10 border-red-400/20"
              >
                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Rechazar"}
              </button>
            )}
            {req.status !== "pending" && (
              <button
                onClick={() => updateStatus("pending")}
                disabled={isUpdating}
                className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all hover:opacity-80 disabled:opacity-40 text-amber-400 bg-amber-400/10 border-amber-400/20"
              >
                {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Pendiente"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ──────────────────────────────────────────────────────────────

export default function WholesaleRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<WholesaleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<WholesaleRequestStatus | "all">("all");

  const shopId = user?.shopId;

  const loadRequests = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/wholesale-requests?shopId=${shopId}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/admin" className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Users className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black tracking-tight">Solicitudes Mayoristas</h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs font-black rounded-full">
                {pendingCount} nueva{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-white/35 ml-11">Clientes que solicitan precios de distribuidor</p>
        </div>
        <button
          onClick={loadRequests}
          disabled={loading}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {(["all", "pending", "approved", "rejected"] as const).map(f => (
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
            {f === "all"
              ? `Todas (${requests.length})`
              : `${STATUS_LABELS[f]} (${requests.filter(r => r.status === f).length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-white/30" /></div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center space-y-3">
          <XCircle className="w-10 h-10 text-white/10 mx-auto" />
          <p className="text-white/25 text-sm uppercase tracking-widest font-mono">
            {filter === "all" ? "Sin solicitudes aún" : "Sin solicitudes en este estado"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(req => (
            <RequestCard key={req.id} req={req} shopId={shopId!} onUpdated={loadRequests} />
          ))}
        </div>
      )}
    </div>
  );
}
