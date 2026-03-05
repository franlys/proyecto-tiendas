"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MessageCircle,
  Save,
  RotateCcw,
  CheckCircle,
  Loader2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui";
import { AuthProvider, useAuth, AgencyProvider, useAgency } from "@/components/shared";
import { FirebaseImageUpload } from "@/components/shared/firebase-image-upload";
import { cn } from "@/lib/utils";

function AgencyProfileForm() {
  const router = useRouter();
  const { isSuperAdmin, isLoading: authLoading } = useAuth();
  const { config, updateConfig, resetToDefaults, isLoaded } = useAgency();

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    whatsapp: "",
    email: "",
    location: "",
    logoInitial: "",
    logoUrl: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load config into form when context is ready
  useEffect(() => {
    if (isLoaded) {
      setFormData({
        name: config.name,
        phone: config.phone,
        whatsapp: config.whatsapp,
        email: config.email,
        location: config.location || "",
        logoInitial: config.logoInitial,
        logoUrl: config.logoUrl || "",
      });
    }
  }, [isLoaded, config]);

  // Redirect non-super-admins
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.push("/admin");
    }
  }, [authLoading, isSuperAdmin, router]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Auto-update logoInitial when name changes
      if (field === "name" && value.length > 0) {
        updated.logoInitial = value.charAt(0).toUpperCase();
      }

      return updated;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);

    // Simulate a brief delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300));

    updateConfig(formData);

    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleReset = () => {
    resetToDefaults();
    setFormData({
      name: "Tu Agencia Digital",
      phone: "+52 55 1234 5678",
      whatsapp: "5215512345678",
      email: "soporte@tuagencia.com",
      location: "Ciudad de México, México",
      logoInitial: "T",
      logoUrl: "",
    });
  };

  if (authLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/agency">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">
                    Perfil de Agencia
                  </h1>
                  <p className="text-slate-400 text-sm">
                    Configura tu marca para clientes
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restablecer
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : showSuccess ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Guardado
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                Información de tu Agencia
              </h2>

              <div className="space-y-5">
                {/* Agency Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre de la Agencia
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="Ej: Soluciones Digitales MX"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Este nombre aparecerá en el widget de contacto de tus clientes
                  </p>
                </div>

                {/* Logo Image */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Logotipo de la Agencia
                  </label>
                  <FirebaseImageUpload
                    value={formData.logoUrl}
                    onChange={(url) => handleChange("logoUrl", url)}
                    folder="agency-assets"
                    shopId="superadmin"
                    label=""
                    aspectRatio="square"
                    maxSizeMB={5}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Recomendado: Imagen cuadrada (1:1), fondo transparente, formato PNG.
                  </p>
                </div>

                {/* Logo Initial */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Inicial del Logo (Fallo seguro)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={formData.logoInitial}
                      onChange={(e) =>
                        handleChange("logoInitial", e.target.value.charAt(0).toUpperCase())
                      }
                      maxLength={1}
                      className="w-16 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-center text-xl font-bold placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                    />
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden">
                      {formData.logoUrl ? (
                        <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white text-xl font-bold">
                          {formData.logoInitial || "A"}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 text-sm">Usado si no hay imagen</span>
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Teléfono de Contacto
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+52 55 1234 5678"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <MessageCircle className="w-4 h-4 inline mr-2 text-green-400" />
                    WhatsApp (Solo números)
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp}
                    onChange={(e) =>
                      handleChange("whatsapp", e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="5215512345678"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Formato: código de país + número sin espacios ni guiones
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email de Soporte
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="soporte@tuagencia.com"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Building2 className="w-4 h-4 inline mr-2" />
                    Ubicación (Sede)
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="Ciudad de México, México"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20">
              <h3 className="text-white font-medium mb-2">
                White-Label Activo
              </h3>
              <p className="text-slate-400 text-sm">
                Esta información aparecerá automáticamente en el widget de
                contacto que ven los dueños de tienda (Shop Owners) cuando
                acceden a su panel de administración.
              </p>
            </div>
          </div>

          {/* Preview Section */}
          <div>
            <div className="sticky top-24">
              <div className="flex items-center gap-2 mb-4 text-slate-400">
                <Eye className="w-4 h-4" />
                <span className="text-sm">Vista previa del widget</span>
              </div>

              {/* Preview Card */}
              <div className="glass-panel rounded-2xl p-6 border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden">
                    {formData.logoUrl ? (
                      <img src={formData.logoUrl} alt="Agency Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-xl font-bold">
                        {formData.logoInitial || "A"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-cyan-400 font-medium uppercase tracking-wider">
                      Tu Asesor Digital
                    </p>
                    <p className="text-white font-semibold">
                      {formData.name || "Tu Agencia Digital"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-400 text-sm mb-4">
                  Tu marca y diseño visual son gestionados por profesionales.
                  Contacta con tu asesor para cualquier cambio o mejora.
                </p>

                {/* Contact Info */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MessageCircle className="w-4 h-4 text-green-400" />
                    <span>WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Phone className="w-4 h-4" />
                    <span>{formData.phone || "+52 55 1234 5678"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Mail className="w-4 h-4" />
                    <span>{formData.email || "soporte@tuagencia.com"}</span>
                  </div>
                </div>
              </div>

              {/* Help Text */}
              <p className="text-xs text-slate-500 text-center mt-4">
                Los Shop Owners verán este widget en su panel de administración
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AgencyProfilePage() {
  return (
    <AuthProvider>
      <AgencyProvider>
        <AgencyProfileForm />
      </AgencyProvider>
    </AuthProvider>
  );
}
