"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Sparkles, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";
import { SkinToneSelector } from "./skin-tone-selector";
import { EventTypeSelector } from "./event-type-selector";
import { MakeupStyleSelector, MakeupStyleCharacteristics } from "./makeup-style-selector";
import { DetailsSection } from "./detail-selector";
import { InspirationUpload, SocialLinksInput } from "./inspiration-upload";
import {
    type BeautyConsultation,
    type SkinTone,
    type Undertone,
    type EventType,
    type MakeupStyle,
    type EyeDetail,
    type LipDetail,
    type SkinDetail,
    DEFAULT_CONSULTATION,
    getEventTypeOption,
    getMakeupStyleOption,
} from "@/lib/types/beauty-consultation.types";

interface BeautyConsultationFormProps {
    shopId: string;
    bookingId: string;
    customerName: string;
    customerPhone: string;
    serviceName: string;
    onComplete: (consultation: Partial<BeautyConsultation>) => void;
    onSkip?: () => void;
}

type Step = "event" | "skin" | "style" | "details" | "inspiration" | "health" | "review";

const STEPS: Step[] = ["event", "skin", "style", "details", "inspiration", "health", "review"];

export function BeautyConsultationForm({
    shopId,
    bookingId,
    customerName,
    customerPhone,
    serviceName,
    onComplete,
    onSkip,
}: BeautyConsultationFormProps) {
    const [currentStep, setCurrentStep] = useState<Step>("event");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [eventType, setEventType] = useState<EventType | undefined>();
    const [eventDescription, setEventDescription] = useState("");
    const [skinTone, setSkinTone] = useState<SkinTone | undefined>();
    const [undertone, setUndertone] = useState<Undertone | undefined>();
    const [preferredStyle, setPreferredStyle] = useState<MakeupStyle | undefined>();
    const [eyeDetails, setEyeDetails] = useState<EyeDetail[]>([]);
    const [lipDetails, setLipDetails] = useState<LipDetail[]>([]);
    const [skinDetails, setSkinDetails] = useState<SkinDetail[]>([]);
    const [inspirationImages, setInspirationImages] = useState<string[]>([]);
    const [pinterestLinks, setPinterestLinks] = useState<string[]>([]);
    const [instagramLinks, setInstagramLinks] = useState<string[]>([]);
    const [notes, setNotes] = useState("");

    // Health info
    const [wearContactLenses, setWearContactLenses] = useState(false);
    const [hadReactionBefore, setHadReactionBefore] = useState(false);
    const [reactionDetails, setReactionDetails] = useState("");
    const [preferVegan, setPreferVegan] = useState(false);
    const [preferCrueltyFree, setPreferCrueltyFree] = useState(false);
    const [preferFragranceFree, setPreferFragranceFree] = useState(false);

    const currentStepIndex = STEPS.indexOf(currentStep);
    const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

    const canProceed = () => {
        switch (currentStep) {
            case "event":
                return !!eventType;
            case "skin":
                return true; // Optional
            case "style":
                return !!preferredStyle;
            case "details":
                return true; // Optional
            case "inspiration":
                return true; // Optional
            case "health":
                return true; // Optional
            case "review":
                return true;
            default:
                return false;
        }
    };

    const goNext = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < STEPS.length) {
            setCurrentStep(STEPS[nextIndex]);
        }
    };

    const goBack = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(STEPS[prevIndex]);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const consultation: Partial<BeautyConsultation> = {
                ...DEFAULT_CONSULTATION,
                shopId,
                bookingId,
                customerName,
                customerPhone,
                eventType: eventType!,
                eventDescription,
                skinTone,
                undertone,
                preferredStyle: preferredStyle!,
                eyeDetails,
                lipDetails,
                skinDetails,
                inspirationImages,
                pinterestLinks,
                instagramLinks,
                notes,
                wearContactLenses,
                hadReactionBefore,
                reactionDetails: hadReactionBefore ? reactionDetails : undefined,
                preferVegan,
                preferCrueltyFree,
                preferFragranceFree,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            await onComplete(consultation);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case "event":
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Cuéntanos sobre tu evento
                            </h2>
                            <p className="text-slate-400">
                                Esto nos ayuda a preparar el look perfecto para ti
                            </p>
                        </div>

                        <EventTypeSelector
                            selected={eventType}
                            onChange={setEventType}
                        />

                        {eventType && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <label className="block text-sm font-medium text-white mb-2">
                                    ¿Algo más sobre el evento? (opcional)
                                </label>
                                <textarea
                                    value={eventDescription}
                                    onChange={(e) => setEventDescription(e.target.value)}
                                    placeholder="Ej: Es una boda en la playa al atardecer, el dress code es elegante casual..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-primary"
                                />
                            </div>
                        )}
                    </div>
                );

            case "skin":
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Tu tono de piel
                            </h2>
                            <p className="text-slate-400">
                                Esto nos ayuda a elegir los productos ideales para ti
                            </p>
                        </div>

                        <SkinToneSelector
                            selectedTone={skinTone}
                            selectedUndertone={undertone}
                            onToneChange={setSkinTone}
                            onUndertoneChange={setUndertone}
                        />

                        <p className="text-xs text-center text-slate-500">
                            No te preocupes si no estás segura, la maquillista lo confirmará contigo
                        </p>
                    </div>
                );

            case "style":
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Elige tu estilo
                            </h2>
                            <p className="text-slate-400">
                                ¿Qué tipo de maquillaje tienes en mente?
                            </p>
                        </div>

                        <MakeupStyleSelector
                            selected={preferredStyle}
                            onChange={setPreferredStyle}
                            eventType={eventType}
                        />

                        {preferredStyle && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <MakeupStyleCharacteristics styleId={preferredStyle} />
                            </div>
                        )}
                    </div>
                );

            case "details":
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Personaliza tu look
                            </h2>
                            <p className="text-slate-400">
                                Selecciona los detalles específicos que te gustarían
                            </p>
                        </div>

                        <DetailsSection
                            eyeDetails={eyeDetails}
                            lipDetails={lipDetails}
                            skinDetails={skinDetails}
                            onEyeChange={setEyeDetails}
                            onLipChange={setLipDetails}
                            onSkinChange={setSkinDetails}
                        />
                    </div>
                );

            case "inspiration":
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Inspiración
                            </h2>
                            <p className="text-slate-400">
                                Comparte fotos de looks que te gusten
                            </p>
                        </div>

                        <InspirationUpload
                            images={inspirationImages}
                            onImagesChange={setInspirationImages}
                            shopId={shopId}
                        />

                        <SocialLinksInput
                            pinterestLinks={pinterestLinks}
                            instagramLinks={instagramLinks}
                            onPinterestChange={setPinterestLinks}
                            onInstagramChange={setInstagramLinks}
                        />

                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Notas adicionales (opcional)
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Cualquier cosa que quieras que la maquillista sepa..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>
                );

            case "health":
                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                Información importante
                            </h2>
                            <p className="text-slate-400">
                                Para asegurar tu comodidad y seguridad
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Contact Lenses */}
                            <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={wearContactLenses}
                                    onChange={(e) => setWearContactLenses(e.target.checked)}
                                    className="w-5 h-5 rounded border-white/20 bg-black/20 text-primary focus:ring-primary"
                                />
                                <div>
                                    <p className="text-white font-medium">Uso lentes de contacto</p>
                                    <p className="text-xs text-slate-400">Para tener cuidado extra al maquillarte</p>
                                </div>
                            </label>

                            {/* Previous Reactions */}
                            <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={hadReactionBefore}
                                    onChange={(e) => setHadReactionBefore(e.target.checked)}
                                    className="w-5 h-5 rounded border-white/20 bg-black/20 text-primary focus:ring-primary"
                                />
                                <div>
                                    <p className="text-white font-medium">He tenido reacciones a productos de maquillaje</p>
                                    <p className="text-xs text-slate-400">Alergias o sensibilidad a ciertos ingredientes</p>
                                </div>
                            </label>

                            {hadReactionBefore && (
                                <div className="ml-8 animate-in fade-in slide-in-from-top-2 duration-200">
                                    <textarea
                                        value={reactionDetails}
                                        onChange={(e) => setReactionDetails(e.target.value)}
                                        placeholder="Describe qué productos o ingredientes te causaron reacción..."
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-xl bg-black/20 border border-amber-500/30 text-white placeholder-slate-500 resize-none focus:outline-none focus:border-amber-500"
                                    />
                                </div>
                            )}

                            {/* Preferences */}
                            <div className="pt-4">
                                <p className="text-sm font-medium text-white mb-3">
                                    Preferencias de productos (opcional)
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPreferVegan(!preferVegan)}
                                        className={`px-4 py-2 rounded-full border text-sm transition-all ${preferVegan
                                            ? "border-green-500 bg-green-500/20 text-green-400"
                                            : "border-white/10 text-slate-300 hover:border-white/30"
                                            }`}
                                    >
                                        🌱 Vegano
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreferCrueltyFree(!preferCrueltyFree)}
                                        className={`px-4 py-2 rounded-full border text-sm transition-all ${preferCrueltyFree
                                            ? "border-primary bg-primary/20 text-primary"
                                            : "border-white/10 text-slate-300 hover:border-white/30"
                                            }`}
                                    >
                                        🐰 Cruelty-Free
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPreferFragranceFree(!preferFragranceFree)}
                                        className={`px-4 py-2 rounded-full border text-sm transition-all ${preferFragranceFree
                                            ? "border-purple-500 bg-purple-500/20 text-purple-400"
                                            : "border-white/10 text-slate-300 hover:border-white/30"
                                            }`}
                                    >
                                        🚫 Sin fragancia
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case "review":
                const eventInfo = eventType ? getEventTypeOption(eventType) : null;
                const styleInfo = preferredStyle ? getMakeupStyleOption(preferredStyle) : null;

                return (
                    <div className="space-y-6">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary to-orange-500 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">
                                ¡Perfecto, {customerName.split(" ")[0]}!
                            </h2>
                            <p className="text-slate-400">
                                Aquí está el resumen de tu look
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Event */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xs text-slate-500 mb-1">Evento</p>
                                <p className="text-white font-medium">
                                    {eventInfo?.icon} {eventInfo?.label}
                                </p>
                                {eventDescription && (
                                    <p className="text-sm text-slate-400 mt-1">{eventDescription}</p>
                                )}
                            </div>

                            {/* Style */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <p className="text-xs text-slate-500 mb-1">Estilo</p>
                                <p className="text-white font-medium">
                                    {styleInfo?.icon} {styleInfo?.label}
                                </p>
                                <p className="text-sm text-slate-400 mt-1">{styleInfo?.description}</p>
                            </div>

                            {/* Details */}
                            {(eyeDetails.length > 0 || lipDetails.length > 0 || skinDetails.length > 0) && (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-xs text-slate-500 mb-2">Detalles seleccionados</p>
                                    <div className="flex flex-wrap gap-1">
                                        {eyeDetails.length > 0 && (
                                            <span className="text-xs text-purple-300">
                                                Ojos: {eyeDetails.length} opciones
                                            </span>
                                        )}
                                        {lipDetails.length > 0 && (
                                            <span className="text-xs text-red-300 ml-2">
                                                Labios: {lipDetails.length} opciones
                                            </span>
                                        )}
                                        {skinDetails.length > 0 && (
                                            <span className="text-xs text-amber-300 ml-2">
                                                Piel: {skinDetails.length} opciones
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Inspiration */}
                            {inspirationImages.length > 0 && (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <p className="text-xs text-slate-500 mb-2">Fotos de inspiración</p>
                                    <div className="flex gap-2">
                                        {inspirationImages.slice(0, 4).map((url, i) => (
                                            <img
                                                key={i}
                                                src={url}
                                                alt=""
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        ))}
                                        {inspirationImages.length > 4 && (
                                            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-xs text-slate-400">
                                                +{inspirationImages.length - 4}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Health Notes */}
                            {(hadReactionBefore || wearContactLenses) && (
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                                        <p className="text-xs text-amber-400">Notas de salud</p>
                                    </div>
                                    {wearContactLenses && (
                                        <p className="text-sm text-amber-200">• Usa lentes de contacto</p>
                                    )}
                                    {hadReactionBefore && (
                                        <p className="text-sm text-amber-200">• Ha tenido reacciones previas</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-center text-slate-500">
                            La maquillista revisará esta información antes de tu cita
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <p className="text-sm text-primary mb-1">Pre-consulta para</p>
                    <h1 className="text-xl font-bold text-white">{serviceName}</h1>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                        <span>Paso {currentStepIndex + 1} de {STEPS.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-orange-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Step Content */}
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                    {renderStep()}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6">
                    <Button
                        variant="ghost"
                        onClick={goBack}
                        disabled={currentStepIndex === 0}
                        className="text-slate-400"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Atrás
                    </Button>

                    <div className="flex gap-2">
                        {onSkip && currentStep !== "review" && (
                            <Button
                                variant="ghost"
                                onClick={onSkip}
                                className="text-slate-500"
                            >
                                Omitir
                            </Button>
                        )}

                        {currentStep === "review" ? (
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-primary to-orange-500 text-white px-8"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Confirmar
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={goNext}
                                disabled={!canProceed()}
                                className="bg-gradient-to-r from-primary to-orange-500 text-white"
                            >
                                Siguiente
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
