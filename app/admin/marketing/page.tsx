"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Megaphone,
  Plus,
  Send,
  Image as ImageIcon,
  Video,
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Pause,
  Play,
  Trash2,
  Eye,
  X,
  Upload,
  Smartphone,
  Shield,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  MarketingProvider,
  useMarketing,
  AUDIENCE_SEGMENTS,
  CAMPAIGN_STATUS_CONFIG,
  type Campaign,
  type AudienceSegment,
  type MediaType,
} from "@/components/shared/marketing-context";
import { useAuth, ShopsProvider, useShops } from "@/components/shared";
import { cn } from "@/lib/utils";

// Phone Preview Component
function PhonePreview({ message, mediaType, mediaUrl }: {
  message: string;
  mediaType: MediaType;
  mediaUrl?: string;
}) {
  return (
    <div className="w-[280px] mx-auto">
      {/* Phone Frame */}
      <div className="relative bg-slate-800 rounded-[2.5rem] p-3 shadow-2xl">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-slate-800 rounded-b-2xl z-10" />

        {/* Screen */}
        <div className="bg-[#0B141A] rounded-[2rem] overflow-hidden">
          {/* WhatsApp Header */}
          <div className="bg-[#1F2C34] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center">
              <span className="text-white text-xs font-bold">T</span>
            </div>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">Tu Tienda</p>
              <p className="text-[10px] text-green-400">en línea</p>
            </div>
          </div>

          {/* Chat Area */}
          <div className="p-3 min-h-[300px] bg-[url('/whatsapp-bg.png')] bg-repeat">
            {/* Message Bubble */}
            <div className="max-w-[85%] ml-auto">
              {/* Media Preview */}
              {mediaType !== "none" && (
                <div className="bg-[#025144] rounded-t-lg overflow-hidden mb-0.5">
                  {mediaType === "image" && mediaUrl && (
                    <img src={mediaUrl} alt="Preview" className="w-full h-32 object-cover" />
                  )}
                  {mediaType === "video" && (
                    <div className="w-full h-32 bg-slate-700 flex items-center justify-center">
                      <Video className="w-12 h-12 text-white/50" />
                    </div>
                  )}
                  {mediaType === "document" && (
                    <div className="p-3 flex items-center gap-2">
                      <FileText className="w-8 h-8 text-red-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs truncate">documento.pdf</p>
                        <p className="text-[10px] text-slate-400">PDF • 2.3 MB</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text */}
              <div className={cn(
                "bg-[#025144] p-2 text-white text-xs whitespace-pre-wrap",
                mediaType !== "none" ? "rounded-b-lg" : "rounded-lg"
              )}>
                {message || "Tu mensaje aparecerá aquí..."}
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-slate-400">12:00</span>
                  <CheckCircle className="w-3 h-3 text-blue-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Campaign Wizard Modal
function CampaignWizard({ onClose, editCampaign, shopId }: {
  onClose: () => void;
  editCampaign?: Campaign;
  shopId: string;
}) {
  const { createCampaign, updateCampaign, getAudienceCount, startCampaign } = useMarketing();
  const [step, setStep] = useState(1);
  const [isStarting, setIsStarting] = useState(false);
  const [formData, setFormData] = useState({
    name: editCampaign?.name || "",
    message: editCampaign?.message || "",
    mediaType: (editCampaign?.mediaType || "none") as MediaType,
    mediaUrl: editCampaign?.mediaUrl || "",
    mediaName: editCampaign?.mediaName || "",
    segment: (editCampaign?.segment || "all") as AudienceSegment,
  });

  const audienceCount = getAudienceCount(formData.segment);

  const handleSaveDraft = () => {
    if (editCampaign) {
      updateCampaign(editCampaign.id, {
        ...formData,
        audienceCount,
        status: "draft",
      });
    } else {
      createCampaign({
        ...formData,
        audienceCount,
        status: "draft",
      });
    }
    onClose();
  };

  const handleStartCampaign = async () => {
    setIsStarting(true);

    try {
      // Fetch real phone numbers from API
      const response = await fetch(`/api/marketing/audience?shopId=${shopId}&segment=${formData.segment}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error fetching audience");
      }

      const phones: string[] = data.phones || [];

      if (phones.length === 0) {
        alert("No hay destinatarios en este segmento. Agrega clientes primero.");
        setIsStarting(false);
        return;
      }

      let campaignId = editCampaign?.id;
      if (!campaignId) {
        const campaign = createCampaign({
          ...formData,
          audienceCount: phones.length,
          status: "sending",
        });
        campaignId = campaign.id;
      } else {
        updateCampaign(campaignId, { ...formData, audienceCount: phones.length });
      }

      startCampaign(campaignId, phones);
      onClose();
    } catch (error: any) {
      console.error("Error starting campaign:", error);
      alert(error.message || "Error al iniciar campaña");
      setIsStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-4xl glass-panel rounded-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Megaphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {editCampaign ? "Editar Campaña" : "Nueva Campaña"}
              </h2>
              <p className="text-sm text-slate-400">
                Paso {step} de 3: {step === 1 ? "Contenido" : step === 2 ? "Audiencia" : "Confirmar"}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "flex-1 h-1 rounded-full transition-colors",
                  s <= step ? "bg-purple-500" : "bg-white/10"
                )}
              />
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Step 1: Content */}
          {step === 1 && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre de la Campaña
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                    placeholder="Ej: Promo Día del Padre"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Mensaje
                  </label>
                  <textarea
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 resize-none"
                    placeholder="Escribe tu mensaje aquí... Usa {shopUrl} para insertar el link de tu tienda"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Tip: Usa emojis 🎉 y {"{shopUrl}"} para el link de tu tienda
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Adjuntar Multimedia
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["none", "image", "video", "document"] as MediaType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setFormData({ ...formData, mediaType: type })}
                        className={cn(
                          "p-3 rounded-xl border transition-all text-center",
                          formData.mediaType === type
                            ? "border-purple-500 bg-purple-500/20 text-purple-400"
                            : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                        )}
                      >
                        {type === "none" && <X className="w-5 h-5 mx-auto mb-1" />}
                        {type === "image" && <ImageIcon className="w-5 h-5 mx-auto mb-1" />}
                        {type === "video" && <Video className="w-5 h-5 mx-auto mb-1" />}
                        {type === "document" && <FileText className="w-5 h-5 mx-auto mb-1" />}
                        <p className="text-xs capitalize">{type === "none" ? "Sin archivo" : type}</p>
                      </button>
                    ))}
                  </div>

                  {formData.mediaType !== "none" && (
                    <div className="mt-3 p-4 rounded-xl border-2 border-dashed border-white/20 text-center">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-400">
                        Arrastra o haz clic para subir {formData.mediaType === "image" ? "imagen" : formData.mediaType === "video" ? "video" : "documento"}
                      </p>
                      <input
                        type="text"
                        value={formData.mediaUrl}
                        onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                        className="mt-2 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none"
                        placeholder="O pega URL del archivo..."
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Vista Previa
                </label>
                <PhonePreview
                  message={formData.message}
                  mediaType={formData.mediaType}
                  mediaUrl={formData.mediaUrl}
                />
              </div>
            </div>
          )}

          {/* Step 2: Audience */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-amber-400 font-medium text-sm">Sistema Anti-Ban Activado</p>
                  <p className="text-amber-400/70 text-xs mt-1">
                    Los mensajes se enviarán con intervalos de 10-20 segundos entre cada uno para proteger tu número.
                  </p>
                </div>
              </div>

              <p className="text-slate-300">Selecciona a quién enviar esta campaña:</p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Object.entries(AUDIENCE_SEGMENTS) as [AudienceSegment, typeof AUDIENCE_SEGMENTS.all][]).map(
                  ([key, segment]) => {
                    const count = getAudienceCount(key);
                    return (
                      <button
                        key={key}
                        onClick={() => setFormData({ ...formData, segment: key })}
                        className={cn(
                          "p-4 rounded-xl border text-left transition-all",
                          formData.segment === key
                            ? "border-purple-500 bg-purple-500/20"
                            : "border-white/10 bg-white/5 hover:bg-white/10"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-2xl">{segment.icon}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-medium",
                            formData.segment === key ? "bg-purple-500/30 text-purple-300" : "bg-white/10 text-slate-400"
                          )}>
                            {count}
                          </span>
                        </div>
                        <p className="text-white font-medium mt-2">{segment.label}</p>
                        <p className="text-xs text-slate-400 mt-1">{segment.description}</p>
                      </button>
                    );
                  }
                )}
              </div>

              <div className="p-4 rounded-xl bg-white/5 text-center">
                <p className="text-slate-400 text-sm">Esta campaña se enviará a</p>
                <p className="text-3xl font-bold text-white mt-1">{audienceCount} personas</p>
                <p className="text-xs text-slate-500 mt-1">
                  Tiempo estimado: ~{Math.ceil(audienceCount * 15 / 60)} minutos
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Send className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">¿Todo listo?</h3>
                <p className="text-slate-400 mt-2">Revisa los detalles antes de enviar</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-xs text-slate-400 mb-1">Campaña</p>
                  <p className="text-white font-medium">{formData.name || "Sin nombre"}</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-xs text-slate-400 mb-1">Audiencia</p>
                  <p className="text-white font-medium">
                    {AUDIENCE_SEGMENTS[formData.segment].icon} {AUDIENCE_SEGMENTS[formData.segment].label}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-xs text-slate-400 mb-1">Destinatarios</p>
                  <p className="text-white font-medium">{audienceCount} personas</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-xs text-slate-400 mb-1">Multimedia</p>
                  <p className="text-white font-medium capitalize">
                    {formData.mediaType === "none" ? "Sin archivo" : formData.mediaType}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-2 text-amber-400 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">Importante</span>
                </div>
                <ul className="text-sm text-amber-400/80 space-y-1">
                  <li>• El envío tardará aproximadamente {Math.ceil(audienceCount * 15 / 60)} minutos</li>
                  <li>• No cierres esta pestaña durante el envío</li>
                  <li>• Puedes pausar y reanudar en cualquier momento</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Anterior
              </Button>
            )}
          </div>

          <div className="flex gap-3">
            {step < 3 ? (
              <>
                <Button variant="outline" onClick={handleSaveDraft}>
                  Guardar Borrador
                </Button>
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && !formData.message}
                >
                  Siguiente
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleSaveDraft} disabled={isStarting}>
                  Guardar Borrador
                </Button>
                <Button
                  onClick={handleStartCampaign}
                  disabled={isStarting || audienceCount === 0}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cargando audiencia...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Iniciar Envío
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Campaign Card
function CampaignCard({ campaign, onEdit }: { campaign: Campaign; onEdit: () => void }) {
  const { deleteCampaign, pauseCampaign, resumeCampaign, currentJob } = useMarketing();
  const statusConfig = CAMPAIGN_STATUS_CONFIG[campaign.status];
  const isCurrentlySending = currentJob?.campaignId === campaign.id;

  const progress = campaign.progress.total > 0
    ? Math.round((campaign.progress.sent / campaign.progress.total) * 100)
    : 0;

  return (
    <div className="glass-panel rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{AUDIENCE_SEGMENTS[campaign.segment].icon}</span>
          <div>
            <p className="text-white font-medium">{campaign.name}</p>
            <p className="text-xs text-slate-400">
              {campaign.audienceCount} destinatarios
            </p>
          </div>
        </div>
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          statusConfig.color === "slate" && "bg-slate-500/20 text-slate-400",
          statusConfig.color === "blue" && "bg-blue-500/20 text-blue-400",
          statusConfig.color === "amber" && "bg-amber-500/20 text-amber-400",
          statusConfig.color === "green" && "bg-green-500/20 text-green-400",
          statusConfig.color === "purple" && "bg-purple-500/20 text-purple-400",
          statusConfig.color === "red" && "bg-red-500/20 text-red-400"
        )}>
          {statusConfig.icon} {statusConfig.label}
        </span>
      </div>

      {/* Progress bar for sending campaigns */}
      {(campaign.status === "sending" || campaign.status === "paused") && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">Progreso</span>
            <span className="text-white">{campaign.progress.sent}/{campaign.progress.total}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                campaign.status === "sending" ? "bg-amber-500 animate-pulse" : "bg-purple-500"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          {campaign.progress.failed > 0 && (
            <p className="text-xs text-red-400 mt-1">
              {campaign.progress.failed} fallidos
            </p>
          )}
        </div>
      )}

      {/* Completed stats */}
      {campaign.status === "completed" && (
        <div className="flex gap-3 mb-3 text-xs">
          <span className="text-green-400">✓ {campaign.progress.sent} enviados</span>
          {campaign.progress.failed > 0 && (
            <span className="text-red-400">✗ {campaign.progress.failed} fallidos</span>
          )}
        </div>
      )}

      {/* Message preview */}
      <p className="text-sm text-slate-400 line-clamp-2 mb-3">{campaign.message}</p>

      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <span className="text-xs text-slate-500">
          {new Date(campaign.createdAt).toLocaleDateString("es-MX")}
        </span>

        <div className="flex gap-1">
          {campaign.status === "sending" && (
            <button
              onClick={() => pauseCampaign(campaign.id)}
              className="p-2 rounded-lg text-amber-400 hover:bg-amber-500/10"
              title="Pausar"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}
          {campaign.status === "paused" && (
            <button
              onClick={() => resumeCampaign(campaign.id)}
              className="p-2 rounded-lg text-green-400 hover:bg-green-500/10"
              title="Reanudar"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {campaign.status === "draft" && (
            <>
              <button
                onClick={onEdit}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                title="Editar"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteCampaign(campaign.id)}
                className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MarketingContent({ shopId }: { shopId: string }) {
  const { campaigns, currentJob } = useMarketing();
  const [showWizard, setShowWizard] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | undefined>();

  // Stats
  const totalSent = campaigns.reduce((sum, c) => sum + c.progress.sent, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "sending" || c.status === "scheduled").length;

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowWizard(true);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setEditingCampaign(undefined);
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
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-white">Marketing</h1>
                  <p className="text-slate-400 text-sm">Campañas y difusión masiva</p>
                </div>
              </div>
            </div>
            <Button onClick={() => setShowWizard(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Campaña
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel rounded-xl p-4 border border-white/10">
            <p className="text-2xl font-bold text-white">{campaigns.length}</p>
            <p className="text-xs text-slate-400">Total Campañas</p>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-purple-500/20">
            <p className="text-2xl font-bold text-purple-400">{activeCampaigns}</p>
            <p className="text-xs text-slate-400">Activas</p>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-green-500/20">
            <p className="text-2xl font-bold text-green-400">{totalSent}</p>
            <p className="text-xs text-slate-400">Mensajes Enviados</p>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-amber-500/20">
            <p className="text-2xl font-bold text-amber-400">
              {currentJob ? `${Math.round((currentJob.currentIndex / currentJob.phones.length) * 100)}%` : "0%"}
            </p>
            <p className="text-xs text-slate-400">Progreso Actual</p>
          </div>
        </div>

        {/* Active Sending Job */}
        {currentJob && (
          <div className="glass-panel rounded-2xl p-6 border border-amber-500/20 bg-amber-500/5 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center animate-pulse">
                <Send className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-amber-400 font-medium">Enviando campaña...</p>
                <p className="text-sm text-slate-400">
                  No cierres esta pestaña • {currentJob.currentIndex} de {currentJob.phones.length}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {Math.round((currentJob.currentIndex / currentJob.phones.length) * 100)}%
                </p>
                <p className="text-xs text-slate-400">
                  ~{Math.ceil((currentJob.phones.length - currentJob.currentIndex) * 15 / 60)} min restantes
                </p>
              </div>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${(currentJob.currentIndex / currentJob.phones.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Campaigns List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Campañas</h2>

          {campaigns.length === 0 ? (
            <div className="text-center py-12 glass-panel rounded-2xl border border-white/10">
              <Megaphone className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">Sin campañas todavía</p>
              <p className="text-slate-400 text-sm mb-4">
                Crea tu primera campaña para empezar a difundir
              </p>
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Campaña
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onEdit={() => handleEdit(campaign)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Campaign Wizard Modal */}
      {showWizard && (
        <CampaignWizard
          onClose={handleCloseWizard}
          editCampaign={editingCampaign}
          shopId={shopId}
        />
      )}
    </div>
  );
}

function MarketingWithAuth() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { getShop, isLoading: shopsLoading } = useShops();

  // Get shopId from user
  const shopId = user?.shopId || "";
  const shop = shopId ? getShop(shopId) : null;

  // Loading state
  if (authLoading || shopsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          <p>Cargando marketing...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user || !shopId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-panel rounded-2xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Acceso Requerido</h2>
          <p className="text-slate-400 mb-6">
            Necesitas iniciar sesión para acceder al módulo de marketing.
          </p>
          <Button onClick={() => router.push("/login")}>
            Iniciar Sesión
          </Button>
        </div>
      </div>
    );
  }

  const effectiveShopId = shop?.slug || shopId;

  return (
    <MarketingProvider shopId={effectiveShopId}>
      <MarketingContent shopId={effectiveShopId} />
    </MarketingProvider>
  );
}

export default function MarketingPage() {
  return (
    <ShopsProvider>
      <MarketingWithAuth />
    </ShopsProvider>
  );
}
