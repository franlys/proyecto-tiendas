"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Lock, Unlock, Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { useWholesale } from "@/components/shared";
import { cn } from "@/lib/utils";

interface WholesaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
}

export function WholesaleModal({ isOpen, onClose, shopId }: WholesaleModalProps) {
  const { activateWholesale, isWholesaleMode, wholesalerName, deactivateWholesale } = useWholesale();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!code.trim()) {
      setError("Ingresa el código de distribuidor");
      return;
    }

    setIsValidating(true);
    const isValid = await activateWholesale(code, shopId);
    setIsValidating(false);

    if (isValid) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setCode("");
        setSuccess(false);
      }, 1500);
    } else {
      setError("Código inválido. Contacta a tu proveedor.");
    }
  };

  const handleDeactivate = () => {
    deactivateWholesale();
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md glass-panel rounded-2xl p-6 border border-gold/30 animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isWholesaleMode
              ? "bg-gradient-to-br from-gold to-amber-500"
              : "bg-gradient-to-br from-slate-600 to-slate-700"
          )}>
            {isWholesaleMode ? (
              <Unlock className="w-6 h-6 text-white" />
            ) : (
              <Lock className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isWholesaleMode ? "Modo Mayorista Activo" : "Acceso Distribuidores"}
            </h2>
            <p className="text-sm text-slate-400">
              {isWholesaleMode
                ? wholesalerName ? `Bienvenido, ${wholesalerName}` : "Precios especiales aplicados"
                : "Ingresa tu código de socio"}
            </p>
          </div>
        </div>

        {isWholesaleMode ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gold/20 border border-gold/30">
              <div className="flex items-center gap-2 text-gold mb-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Precios Mayorista Activos</span>
              </div>
              <p className="text-sm text-slate-300">
                Estás viendo los precios especiales para distribuidores. Todos los productos muestran el precio de mayoreo.
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
        ) : success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">¡Código Válido!</h3>
            <p className="text-slate-400">Activando precios mayoristas...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Código de 4 dígitos o número de teléfono
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError("");
                }}
                placeholder="1234 o +52 555 000 0000"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-gold/50 tracking-wider text-center text-lg font-mono"
                autoFocus
                disabled={isValidating}
                maxLength={20}
              />
              {error && (
                <div className="flex items-center gap-2 mt-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={isValidating}
              className="w-full bg-gradient-to-r from-gold to-amber-500 hover:from-gold/90 hover:to-amber-500/90 text-black font-semibold"
            >
              {isValidating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verificando...</>
              ) : (
                <><Unlock className="w-4 h-4 mr-2" /> Activar Precios Mayoristas</>
              )}
            </Button>

            <p className="text-center text-xs text-slate-500">
              ¿No tienes acceso? Contacta a ventas para ser distribuidor.
            </p>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
