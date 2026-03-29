"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag, FileText, User, Mail, Phone, Send, CheckCircle, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  categories: string[];
}

type ContactPreference = "email" | "whatsapp";
type Step = "form" | "success";

export function QuoteRequestModal({ isOpen, onClose, shopId, categories }: QuoteRequestModalProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [customerName, setCustomerName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [contactPreference, setContactPreference] = useState<ContactPreference>("whatsapp");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => { setMounted(true); }, []);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("form");
        setCustomerName("");
        setCategory("");
        setDescription("");
        setEmail("");
        setPhone("");
        setError("");
      }, 300);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!customerName.trim()) { setError("Por favor ingresa tu nombre"); return; }
    if (!category) { setError("Selecciona una categoría"); return; }
    if (!description.trim()) { setError("Describe el producto que buscas"); return; }
    if (contactPreference === "email" && !email.trim()) { setError("Ingresa tu correo electrónico"); return; }
    if (contactPreference === "whatsapp" && !phone.trim()) { setError("Ingresa tu número de WhatsApp"); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quote-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          customerName: customerName.trim(),
          category,
          description: description.trim(),
          contactPreference,
          email: contactPreference === "email" ? email.trim() : undefined,
          phone: contactPreference === "whatsapp" ? phone.trim() : undefined,
        }),
      });

      if (!res.ok) throw new Error("Error al enviar");
      setStep("success");
    } catch {
      setError("No se pudo enviar la solicitud. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayCategories = categories.filter(c => c !== "todos");

  return createPortal(
    <AnimatePresence>
    {isOpen && (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 6 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/8">
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-wider">
              Solicitar Cotización
            </h2>
            <p className="text-xs text-white/35 mt-0.5">
              Te contactamos con el precio exacto
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/30 hover:text-white hover:bg-white/8 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === "success" ? (
          <div className="px-6 py-10 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white mb-1">¡Solicitud Enviada!</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Recibimos tu solicitud. Te contactaremos pronto con la cotización por{" "}
                {contactPreference === "email" ? "correo electrónico" : "WhatsApp"}.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-white text-black rounded-xl font-bold text-sm hover:bg-white/90 transition-colors"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-white/35 uppercase tracking-widest flex items-center gap-1.5">
                <User className="w-3 h-3" /> Tu Nombre
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="¿Cómo te llamamos?"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
              />
            </div>

            {/* Categoría */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-white/35 uppercase tracking-widest flex items-center gap-1.5">
                <Tag className="w-3 h-3" /> Tipo de Producto
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white focus:outline-none focus:border-white/25 transition-colors appearance-none cursor-pointer"
                >
                  <option value="" className="bg-zinc-900">Selecciona una categoría</option>
                  {displayCategories.map(cat => (
                    <option key={cat} value={cat} className="bg-zinc-900 capitalize">{cat}</option>
                  ))}
                  <option value="Otro" className="bg-zinc-900">Otro</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-white/35 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> ¿Qué Buscas Exactamente?
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ej: iPhone 15 Pro Max 256GB color titanio natural, o cualquier detalle que nos ayude a encontrarlo..."
                rows={3}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors resize-none"
              />
            </div>

            {/* Preferencia de contacto */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-white/35 uppercase tracking-widest">
                ¿Cómo te enviamos la cotización?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["whatsapp", "email"] as ContactPreference[]).map(pref => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => setContactPreference(pref)}
                    className={cn(
                      "py-2.5 px-3 rounded-xl border text-xs font-bold uppercase tracking-wide transition-all",
                      contactPreference === pref
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/8 bg-white/3 text-white/35 hover:text-white/60"
                    )}
                  >
                    {pref === "whatsapp" ? "WhatsApp" : "Correo"}
                  </button>
                ))}
              </div>
            </div>

            {/* Campo de contacto */}
            {contactPreference === "email" ? (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/35 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-3 h-3" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-white/35 uppercase tracking-widest flex items-center gap-1.5">
                  <Phone className="w-3 h-3" /> Número de WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+52 555 000 0000"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/25 transition-colors"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-white text-black rounded-xl font-black text-sm uppercase tracking-widest hover:bg-white/90 active:scale-[0.97] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
              ) : (
                <><Send className="w-4 h-4" /> Solicitar Cotización</>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
    )}
    </AnimatePresence>,
    document.body
  );
}
