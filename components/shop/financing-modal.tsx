"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X, CreditCard, User, Hash, MapPin, Phone, Briefcase,
  FileText, DollarSign, Send, Loader2, CheckCircle, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FinancingModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  bankName?: string;
}

type Step = "form" | "success";

const today = () =>
  new Date().toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" });

export function FinancingModal({ isOpen, onClose, shopId, bankName = "BANFONDESA" }: FinancingModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [cedula, setCedula] = useState("");
  const [address, setAddress] = useState("");
  const [referencia, setReferencia] = useState("");
  const [phone, setPhone] = useState("");
  const [celular, setCelular] = useState("");
  const [workplace, setWorkplace] = useState("");
  const [articleDescription, setArticleDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("form");
        setFullName(""); setCedula(""); setAddress(""); setReferencia("");
        setPhone(""); setCelular(""); setWorkplace("");
        setArticleDescription(""); setTotalAmount(""); setError("");
      }, 300);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) { setError("Ingresa el nombre completo"); return; }
    if (!cedula.trim()) { setError("Ingresa la cédula del cliente"); return; }
    if (!celular.trim()) { setError("Ingresa el número de celular"); return; }
    if (!articleDescription.trim()) { setError("Describe el artículo a financiar"); return; }
    if (!totalAmount || Number(totalAmount) <= 0) { setError("Ingresa el monto total solicitado"); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/financing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          fullName: fullName.trim(),
          cedula: cedula.trim(),
          address: address.trim(),
          referencia: referencia.trim(),
          phone: phone.trim(),
          celular: celular.trim(),
          workplace: workplace.trim(),
          articleDescription: articleDescription.trim(),
          totalAmount: Number(totalAmount),
        }),
      });
      if (!res.ok) throw new Error();
      setStep("success");
    } catch {
      setError("No se pudo enviar la solicitud. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider">
                Solicitar Financiamiento
              </h2>
              <p className="text-[11px] text-white/35">{bankName} — Banco de Ahorro y Crédito</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === "success" ? (
          <div className="px-6 py-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white mb-2">¡Solicitud Enviada!</h3>
              <p className="text-sm text-white/40 leading-relaxed max-w-sm mx-auto">
                Tu solicitud fue enviada a {bankName}. Te contactaremos una vez que el banco nos confirme tu aprobación.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-white text-black rounded-xl font-black text-sm hover:bg-white/90 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
            <div className="px-6 py-5 space-y-4">

              {/* Fecha — readonly */}
              <div className="flex items-center gap-3 px-4 py-3 bg-white/3 border border-white/8 rounded-xl">
                <div className="text-[10px] font-black text-white/25 uppercase tracking-widest w-28 flex-shrink-0">Fecha</div>
                <p className="text-sm text-white/60">{today()}</p>
              </div>

              {/* Nombre completo */}
              <Field icon={<User className="w-3.5 h-3.5" />} label="Nombre Completo *">
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Nombre y apellidos" className={inputCls} />
              </Field>

              {/* Cédula */}
              <Field icon={<Hash className="w-3.5 h-3.5" />} label="Cédula del Cliente *">
                <input type="text" value={cedula} onChange={e => setCedula(e.target.value)}
                  placeholder="000-0000000-0" className={inputCls} />
              </Field>

              {/* Dirección */}
              <Field icon={<MapPin className="w-3.5 h-3.5" />} label="Dirección">
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  placeholder="Calle, sector, ciudad" className={inputCls} />
              </Field>

              {/* Referencia */}
              <Field icon={<MapPin className="w-3.5 h-3.5" />} label="Referencia de Donde Vive">
                <input type="text" value={referencia} onChange={e => setReferencia(e.target.value)}
                  placeholder="Cerca de... / Al lado de..." className={inputCls} />
              </Field>

              {/* Teléfono + Celular */}
              <div className="grid grid-cols-2 gap-3">
                <Field icon={<Phone className="w-3.5 h-3.5" />} label="Teléfono">
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    placeholder="809-000-0000" className={inputCls} />
                </Field>
                <Field icon={<Phone className="w-3.5 h-3.5" />} label="Celular *">
                  <input type="tel" value={celular} onChange={e => setCelular(e.target.value)}
                    placeholder="849-000-0000" className={inputCls} />
                </Field>
              </div>

              {/* Lugar de trabajo */}
              <Field icon={<Briefcase className="w-3.5 h-3.5" />} label="Lugar de Trabajo">
                <input type="text" value={workplace} onChange={e => setWorkplace(e.target.value)}
                  placeholder="Empresa o negocio donde trabajas" className={inputCls} />
              </Field>

              {/* Descripción artículo */}
              <Field icon={<FileText className="w-3.5 h-3.5" />} label="Descripción del Artículo *">
                <textarea value={articleDescription} onChange={e => setArticleDescription(e.target.value)}
                  placeholder="Marca, modelo, especificaciones del producto que deseas financiar..."
                  rows={3} className={cn(inputCls, "resize-none")} />
              </Field>

              {/* Monto */}
              <Field icon={<DollarSign className="w-3.5 h-3.5" />} label="Monto Total Solicitado (RD$) *">
                <div className="flex items-center gap-2 w-full px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl focus-within:border-white/25 transition-colors">
                  <span className="text-sm font-black text-white/40">RD$</span>
                  <input
                    type="number"
                    min="0"
                    value={totalAmount}
                    onChange={e => setTotalAmount(e.target.value)}
                    placeholder="0"
                    className="bg-transparent text-sm text-white placeholder-white/20 outline-none flex-1 font-bold"
                  />
                </div>
              </Field>

              {/* Error */}
              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {/* Disclaimer */}
              <p className="text-[10px] text-white/20 leading-relaxed">
                Al enviar esta solicitud, {bankName} evaluará tu perfil crediticio. La tienda te contactará una vez que el banco confirme el resultado.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-2 flex-shrink-0">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="w-4 h-4" /> Enviar Solicitud</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

const inputCls = "w-full bg-transparent text-sm text-white placeholder-white/20 outline-none";

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-black text-white/35 uppercase tracking-widest flex items-center gap-1.5">
        {icon} {label}
      </label>
      <div className="px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl focus-within:border-white/25 transition-colors">
        {children}
      </div>
    </div>
  );
}
