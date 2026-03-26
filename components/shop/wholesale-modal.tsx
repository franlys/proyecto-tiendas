"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X, Lock, Unlock, Sparkles, AlertCircle, Loader2,
  UserPlus, CheckCircle, Phone, User, Building2, Hash,
  MessageSquare, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useWholesale } from "@/components/shared";
import { cn } from "@/lib/utils";

interface WholesaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
}

// ─── TAB: CODE LOGIN ────────────────────────────────────────────────────────

function CodeLoginTab({ shopId, onClose }: { shopId: string; onClose: () => void }) {
  const { activateWholesale } = useWholesale();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim()) { setError("Ingresa el código de distribuidor"); return; }
    setIsValidating(true);
    const isValid = await activateWholesale(code, shopId);
    setIsValidating(false);
    if (isValid) {
      setSuccess(true);
      setTimeout(() => { onClose(); setCode(""); setSuccess(false); }, 1500);
    } else {
      setError("Código inválido. Verifica e intenta de nuevo.");
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">¡Código Válido!</h3>
        <p className="text-slate-400 text-sm">Activando precios mayoristas...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Código de distribuidor
        </label>
        <input
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value); setError(""); }}
          placeholder="Código o teléfono registrado"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 tracking-wider text-center text-lg font-mono transition-colors"
          autoFocus
          disabled={isValidating}
          maxLength={20}
        />
        {error && (
          <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>
      <Button
        type="submit"
        disabled={isValidating}
        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold"
      >
        {isValidating
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando...</>
          : <><Unlock className="w-4 h-4 mr-2" /> Activar Precios Mayoristas</>
        }
      </Button>
    </form>
  );
}

// ─── TAB: REGISTER REQUEST ──────────────────────────────────────────────────

function RegisterTab({ shopId, onClose }: { shopId: string; onClose: () => void }) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [rnc, setRnc] = useState("");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      setError("Nombre y teléfono son requeridos");
      return;
    }
    setError("");
    setIsSending(true);
    try {
      const res = await fetch("/api/wholesale-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, fullName, phone, businessName, rnc, message }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        setError("Hubo un error. Intenta de nuevo.");
      }
    } catch {
      setError("Hubo un error. Intenta de nuevo.");
    } finally {
      setIsSending(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-1">¡Solicitud enviada!</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Revisaremos tu solicitud y te contactaremos al número indicado para coordinar los detalles y tu primera compra.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-white/8 border border-white/10 text-white/60 text-sm font-medium hover:bg-white/12 transition-colors"
        >
          Cerrar
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Min purchase notice */}
      <div className="p-3.5 rounded-xl bg-amber-500/8 border border-amber-500/20">
        <p className="text-xs text-amber-300/80 leading-relaxed">
          <span className="font-bold text-amber-300">Requisito de ingreso:</span> Se requiere una compra mínima inicial para activar tu cuenta mayorista. Te informaremos el monto al contactarte.
        </p>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3 h-3" /> Nombre completo *
          </label>
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Tu nombre"
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white/25 transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Phone className="w-3 h-3" /> Teléfono *
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="809-000-0000"
            required
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white/25 transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3 h-3" /> Negocio
            </label>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Nombre del negocio"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white/25 transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3 h-3" /> RNC
            </label>
            <input
              type="text"
              value={rnc}
              onChange={e => setRnc(e.target.value)}
              placeholder="Opcional"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white/25 transition-colors"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" /> Mensaje adicional
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="¿Qué productos te interesan? ¿Volumen estimado de compra?"
            rows={2}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-white/25 transition-colors resize-none"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSending}
        className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
          : <><ChevronRight className="w-4 h-4" /> Enviar Solicitud</>
        }
      </button>
    </form>
  );
}

// ─── MAIN MODAL ─────────────────────────────────────────────────────────────

export function WholesaleModal({ isOpen, onClose, shopId }: WholesaleModalProps) {
  const { isWholesaleMode, wholesalerName, deactivateWholesale } = useWholesale();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!isOpen || !mounted) return null;

  const handleDeactivate = () => { deactivateWholesale(); onClose(); };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border border-amber-500/20 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center",
            isWholesaleMode
              ? "bg-gradient-to-br from-amber-400 to-amber-600"
              : "bg-white/8"
          )}>
            {isWholesaleMode
              ? <Unlock className="w-5 h-5 text-black" />
              : <Lock className="w-5 h-5 text-white/60" />
            }
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              {isWholesaleMode ? "Modo Mayorista Activo" : "Distribuidores"}
            </h2>
            <p className="text-xs text-slate-400">
              {isWholesaleMode
                ? wholesalerName ? `Bienvenido, ${wholesalerName}` : "Precios especiales aplicados"
                : "Acceso exclusivo para distribuidores"}
            </p>
          </div>
        </div>

        {/* Active wholesale state */}
        {isWholesaleMode ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold text-sm">Precios Mayorista Activos</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Estás viendo los precios especiales para distribuidores en todos los productos.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleDeactivate}
              className="w-full border-slate-500/30 text-slate-300 hover:bg-slate-500/10"
            >
              <Lock className="w-4 h-4 mr-2" />
              Volver a Precios Normales
            </Button>
          </div>
        ) : (
          <>
            {/* Tab switcher */}
            <div className="flex p-1 bg-white/[0.04] rounded-xl border border-white/[0.07] mb-5">
              <button
                type="button"
                onClick={() => setTab("login")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
                  tab === "login"
                    ? "bg-white text-black"
                    : "text-white/35 hover:text-white/60"
                )}
              >
                <Unlock className="w-3.5 h-3.5" />
                Ya tengo acceso
              </button>
              <button
                type="button"
                onClick={() => setTab("register")}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5",
                  tab === "register"
                    ? "bg-white text-black"
                    : "text-white/35 hover:text-white/60"
                )}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Quiero ser mayorista
              </button>
            </div>

            {tab === "login"
              ? <CodeLoginTab shopId={shopId} onClose={onClose} />
              : <RegisterTab shopId={shopId} onClose={onClose} />
            }
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
