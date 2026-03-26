"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/shared";
import {
  CreditCard, Clock, Loader2, CheckCircle, XCircle,
  RefreshCw, ChevronDown, User, Hash, MapPin, Phone,
  Briefcase, FileText, DollarSign, Settings, Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { FinancingApplication, FinancingStatus } from "@/lib/types/financing.types";

const STATUS_LABELS: Record<FinancingStatus, string> = {
  submitted: "Enviada",
  bank_confirmed: "Banco Confirmó",
  client_contacted: "Cliente Contactado",
  approved: "Aprobada",
  rejected: "Rechazada",
};

const STATUS_COLORS: Record<FinancingStatus, string> = {
  submitted: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  bank_confirmed: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  client_contacted: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  approved: "text-green-400 bg-green-400/10 border-green-400/20",
  rejected: "text-red-400 bg-red-400/10 border-red-400/20",
};

function StatusBadge({ status }: { status: FinancingStatus }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", STATUS_COLORS[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── SETTINGS PANEL ───────────────────────────────────────────────────────────
function SettingsPanel({ shopId, onClose }: { shopId: string; onClose: () => void }) {
  const [bankEmail, setBankEmail] = useState("");
  const [bankName, setBankName] = useState("BANFONDESA");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "shops", shopId, "settings", "financing"));
        if (snap.exists()) {
          const data = snap.data();
          setBankEmail(data.bankEmail || "");
          setBankName(data.bankName || "BANFONDESA");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shopId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, "shops", shopId, "settings", "financing"), {
        bankEmail,
        bankName,
        enabled: true,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 1200);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/3 border border-white/10 rounded-2xl p-6 space-y-5 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <Settings className="w-4 h-4 text-white/40" /> Configuración del Banco
        </h3>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 text-xs">Cancelar</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-white/30" /></div>
      ) : (
        <>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-white/35 uppercase tracking-widest">Nombre del Banco</label>
            <input
              type="text"
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              placeholder="BANFONDESA"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-white/35 uppercase tracking-widest">
              Correo del Banco
            </label>
            <input
              type="email"
              value={bankEmail}
              onChange={e => setBankEmail(e.target.value)}
              placeholder="solicitudes@banfondesa.com.do"
              className="w-full px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25"
            />
            <p className="text-[10px] text-white/20">Las solicitudes se enviarán automáticamente a este correo.</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-white text-black rounded-xl font-black text-sm hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? "¡Guardado!" : "Guardar"}
          </button>
        </>
      )}
    </div>
  );
}

// ─── APPLICATION CARD ─────────────────────────────────────────────────────────
function ApplicationCard({ app, shopId, onUpdated }: { app: FinancingApplication; shopId: string; onUpdated: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notes, setNotes] = useState(app.adminNotes || "");
  const [savingNotes, setSavingNotes] = useState(false);

  const updateStatus = async (status: FinancingStatus) => {
    setIsUpdating(true);
    try {
      await fetch(`/api/financing/${app.id}`, {
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
      await fetch(`/api/financing/${app.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, adminNotes: notes }),
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const createdAt = app.createdAt
    ? new Date(app.createdAt).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })
    : app.requestDate || "—";

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden hover:border-white/12 transition-colors">
      <button
        type="button"
        onClick={() => setIsExpanded(v => !v)}
        className="w-full px-5 py-4 flex items-start gap-4 text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <CreditCard className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-black text-white text-sm">{app.fullName}</span>
            <StatusBadge status={app.status} />
          </div>
          <div className="flex items-center gap-3 text-[11px] text-white/35">
            <span className="flex items-center gap-1"><Hash className="w-3 h-3" />{app.cedula}</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{createdAt}</span>
          </div>
          <p className="text-sm font-black text-white/60 mt-1.5">
            RD$ {Number(app.totalAmount).toLocaleString("es-DO")}
          </p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-white/30 flex-shrink-0 mt-1 transition-transform", isExpanded && "rotate-180")} />
      </button>

      {isExpanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { icon: <User className="w-3 h-3" />, label: "Nombre", value: app.fullName },
              { icon: <Hash className="w-3 h-3" />, label: "Cédula", value: app.cedula },
              { icon: <MapPin className="w-3 h-3" />, label: "Dirección", value: app.address },
              { icon: <MapPin className="w-3 h-3" />, label: "Referencia", value: app.referencia },
              { icon: <Phone className="w-3 h-3" />, label: "Teléfono", value: app.phone },
              { icon: <Phone className="w-3 h-3" />, label: "Celular", value: app.celular },
              { icon: <Briefcase className="w-3 h-3" />, label: "Trabajo", value: app.workplace },
              { icon: <DollarSign className="w-3 h-3" />, label: "Monto", value: `RD$ ${Number(app.totalAmount).toLocaleString("es-DO")}` },
            ].map(({ icon, label, value }) => value ? (
              <div key={label} className="space-y-0.5">
                <p className="text-[10px] font-black text-white/25 uppercase tracking-widest flex items-center gap-1">{icon}{label}</p>
                <p className="text-white/70 text-xs">{value}</p>
              </div>
            ) : null)}
          </div>

          {app.articleDescription && (
            <div className="space-y-1">
              <p className="text-[10px] font-black text-white/25 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Artículo
              </p>
              <p className="text-sm text-white/70 bg-white/3 rounded-xl px-4 py-3 leading-relaxed whitespace-pre-line">
                {app.articleDescription}
              </p>
            </div>
          )}

          {/* Admin notes */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-black text-white/25 uppercase tracking-widest">Notas Internas</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Resultado del banco, seguimiento..."
              rows={2}
              className="w-full px-3 py-2 bg-white/5 border border-white/8 rounded-xl text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/20 resize-none"
            />
            <button onClick={saveNotes} disabled={savingNotes} className="text-[10px] font-bold text-white/40 hover:text-white/70 flex items-center gap-1">
              {savingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />} Guardar
            </button>
          </div>

          {/* Status buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {(Object.keys(STATUS_LABELS) as FinancingStatus[])
              .filter(s => s !== app.status)
              .map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={isUpdating}
                  className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all hover:opacity-80 disabled:opacity-40", STATUS_COLORS[s])}
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

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function FinancingPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<FinancingApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FinancingStatus | "all">("all");
  const [showSettings, setShowSettings] = useState(false);

  const shopId = user?.shopId;

  const loadApplications = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/financing?shopId=${shopId}`);
      const data = await res.json();
      setApplications(data.applications || []);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  const filtered = filter === "all" ? applications : applications.filter(a => a.status === filter);
  const pendingCount = applications.filter(a => a.status === "submitted").length;

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <CreditCard className="w-6 h-6 text-white/50" />
            <h1 className="text-2xl font-black tracking-tight">Financiamiento</h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 bg-amber-400/15 border border-amber-400/30 text-amber-400 text-xs font-black rounded-full">
                {pendingCount} nueva{pendingCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <p className="text-sm text-white/35">Solicitudes de financiamiento bancario</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(v => !v)}
            className={cn("p-2 rounded-lg border text-white/40 hover:text-white transition-colors", showSettings ? "bg-white/10 border-white/20" : "bg-white/5 border-white/10")}
          >
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={loadApplications} disabled={loading} className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && shopId && (
        <SettingsPanel shopId={shopId} onClose={() => setShowSettings(false)} />
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {(["all", ...Object.keys(STATUS_LABELS)] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as FinancingStatus | "all")}
            className={cn(
              "px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
              filter === f
                ? "bg-white/10 border-white/20 text-white"
                : "bg-transparent border-white/5 text-white/30 hover:text-white/60"
            )}
          >
            {f === "all"
              ? `Todas (${applications.length})`
              : `${STATUS_LABELS[f as FinancingStatus]} (${applications.filter(a => a.status === f).length})`}
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
          {filtered.map(app => (
            <ApplicationCard key={app.id} app={app} shopId={shopId!} onUpdated={loadApplications} />
          ))}
        </div>
      )}
    </div>
  );
}
