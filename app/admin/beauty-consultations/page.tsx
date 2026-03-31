"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/shared";
import {
    Calendar,
    Clock,
    User,
    Phone,
    Sparkles,
    Eye,
    Heart,
    Palette,
    AlertTriangle,
    Check,
    ChevronRight,
    X,
    Image as ImageIcon,
    ExternalLink,
    MessageCircle,
    Loader2,
} from "lucide-react";
import { Button } from "@/components/ui";
import type {
    BeautyConsultation,
    SkinTone,
    MakeupStyle,
    EventType,
} from "@/lib/types/beauty-consultation.types";
import {
    SKIN_TONES,
    MAKEUP_STYLES,
    EVENT_TYPES,
} from "@/lib/types/beauty-consultation.types";

export default function BeautyConsultationsPage() {
    const { user } = useAuth();
    const [consultations, setConsultations] = useState<BeautyConsultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedConsultation, setSelectedConsultation] = useState<BeautyConsultation | null>(null);
    const [filter, setFilter] = useState<"all" | "pending" | "reviewed">("all");

    useEffect(() => {
        if (user?.shopId) {
            fetchConsultations();
        }
    }, [user?.shopId]);

    const fetchConsultations = async () => {
        if (!user?.shopId) return;

        try {
            const response = await fetch(`/api/beauty-consultations?shopId=${user.shopId}`);
            const data = await response.json();
            if (data.consultations) {
                setConsultations(data.consultations);
            }
        } catch (error) {
            console.error("Error fetching consultations:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsReviewed = async (consultationId: string) => {
        if (!user?.shopId) return;

        try {
            await fetch(`/api/beauty-consultations/${consultationId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shopId: user.shopId,
                    reviewedAt: new Date().toISOString(),
                    reviewedBy: user.id,
                }),
            });

            // Update local state
            setConsultations(prev =>
                prev.map(c =>
                    c.id === consultationId
                        ? { ...c, reviewedAt: new Date().toISOString(), reviewedBy: user.id }
                        : c
                )
            );

            if (selectedConsultation?.id === consultationId) {
                setSelectedConsultation(prev =>
                    prev ? { ...prev, reviewedAt: new Date().toISOString(), reviewedBy: user.id } : null
                );
            }
        } catch (error) {
            console.error("Error marking as reviewed:", error);
        }
    };

    const filteredConsultations = consultations.filter(c => {
        if (filter === "pending") return !c.reviewedAt;
        if (filter === "reviewed") return !!c.reviewedAt;
        return true;
    });

    const getEventInfo = (eventType: EventType) => {
        return EVENT_TYPES.find(e => e.id === eventType);
    };

    const getStyleInfo = (style: MakeupStyle) => {
        return MAKEUP_STYLES.find(s => s.id === style);
    };

    const getSkinToneInfo = (tone: SkinTone) => {
        return SKIN_TONES.find(t => t.id === tone);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-pink-500" />
                        Pre-Consultas de Belleza
                    </h1>
                    <p className="text-white/50 mt-1">
                        Revisa las preferencias de tus clientas antes de cada cita
                    </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {[
                        { id: "all", label: "Todas" },
                        { id: "pending", label: "Pendientes" },
                        { id: "reviewed", label: "Revisadas" },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id as typeof filter)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                filter === tab.id
                                    ? "bg-pink-500 text-white"
                                    : "bg-white/10 text-white/70 hover:bg-white/20"
                            }`}
                        >
                            {tab.label}
                            {tab.id === "pending" && (
                                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                                    {consultations.filter(c => !c.reviewedAt).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {filteredConsultations.length === 0 ? (
                <div className="text-center py-16">
                    <Sparkles className="w-16 h-16 text-white/50 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">
                        No hay pre-consultas
                    </h3>
                    <p className="text-white/50">
                        {filter === "pending"
                            ? "No tienes pre-consultas pendientes de revisar"
                            : filter === "reviewed"
                            ? "No has revisado ninguna pre-consulta aún"
                            : "Cuando tus clientas completen pre-consultas, aparecerán aquí"
                        }
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Consultations List */}
                    <div className="space-y-3">
                        {filteredConsultations.map(consultation => {
                            const eventInfo = getEventInfo(consultation.eventType);
                            const styleInfo = getStyleInfo(consultation.preferredStyle);
                            const isSelected = selectedConsultation?.id === consultation.id;

                            return (
                                <button
                                    key={consultation.id}
                                    onClick={() => setSelectedConsultation(consultation)}
                                    className={`w-full p-4 rounded-xl text-left transition-all ${
                                        isSelected
                                            ? "bg-pink-500/20 border-2 border-pink-500"
                                            : "bg-white/5 border border-white/10 hover:bg-white/10"
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold text-white">
                                                {consultation.customerName}
                                            </h3>
                                            <p className="text-sm text-white/50 flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {consultation.customerPhone}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {consultation.reviewedAt ? (
                                                <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs flex items-center gap-1">
                                                    <Check className="w-3 h-3" />
                                                    Revisada
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs">
                                                    Pendiente
                                                </span>
                                            )}
                                            <ChevronRight className={`w-4 h-4 text-white/50 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {eventInfo && (
                                            <span className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs flex items-center gap-1">
                                                <span>{eventInfo.icon}</span>
                                                {eventInfo.label}
                                            </span>
                                        )}
                                        {styleInfo && (
                                            <span className="px-2 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs flex items-center gap-1">
                                                <span>{styleInfo.icon}</span>
                                                {styleInfo.label}
                                            </span>
                                        )}
                                        {consultation.inspirationImages?.length > 0 && (
                                            <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs flex items-center gap-1">
                                                <ImageIcon className="w-3 h-3" />
                                                {consultation.inspirationImages.length} fotos
                                            </span>
                                        )}
                                        {(consultation.hadReactionBefore || consultation.wearContactLenses) && (
                                            <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Notas
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Consultation Detail */}
                    {selectedConsultation ? (
                        <ConsultationDetail
                            consultation={selectedConsultation}
                            onMarkReviewed={() => markAsReviewed(selectedConsultation.id)}
                            onClose={() => setSelectedConsultation(null)}
                        />
                    ) : (
                        <div className="hidden lg:flex items-center justify-center bg-white/5 rounded-xl border border-white/10 min-h-[400px]">
                            <div className="text-center">
                                <Eye className="w-12 h-12 text-white/50 mx-auto mb-3" />
                                <p className="text-white/50">
                                    Selecciona una pre-consulta para ver los detalles
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Consultation Detail Component
function ConsultationDetail({
    consultation,
    onMarkReviewed,
    onClose,
}: {
    consultation: BeautyConsultation;
    onMarkReviewed: () => void;
    onClose: () => void;
}) {
    const eventInfo = EVENT_TYPES.find(e => e.id === consultation.eventType);
    const styleInfo = MAKEUP_STYLES.find(s => s.id === consultation.preferredStyle);
    const skinToneInfo = consultation.skinTone
        ? SKIN_TONES.find(t => t.id === consultation.skinTone)
        : null;

    return (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold text-white text-lg">
                        {consultation.customerName}
                    </h3>
                    <p className="text-sm text-white/50">{consultation.customerPhone}</p>
                </div>
                <div className="flex items-center gap-2">
                    {!consultation.reviewedAt && (
                        <Button
                            onClick={onMarkReviewed}
                            size="sm"
                            className="bg-green-500 hover:bg-green-600"
                        >
                            <Check className="w-4 h-4 mr-1" />
                            Marcar revisada
                        </Button>
                    )}
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-lg hover:bg-white/10"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
                {/* Event & Style */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <p className="text-xs text-purple-400 mb-1">Evento</p>
                        <p className="text-white font-medium flex items-center gap-2">
                            <span className="text-xl">{eventInfo?.icon}</span>
                            {eventInfo?.label}
                        </p>
                        {consultation.eventDescription && (
                            <p className="text-sm text-white/50 mt-2">
                                {consultation.eventDescription}
                            </p>
                        )}
                    </div>

                    <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20">
                        <p className="text-xs text-pink-400 mb-1">Estilo</p>
                        <p className="text-white font-medium flex items-center gap-2">
                            <span className="text-xl">{styleInfo?.icon}</span>
                            {styleInfo?.label}
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                            Intensidad: {styleInfo?.intensity}/5
                        </p>
                    </div>
                </div>

                {/* Skin Tone */}
                {skinToneInfo && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-xs text-white/50 mb-2">Tono de piel</p>
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-full border-2 border-white/20"
                                style={{ backgroundColor: skinToneInfo.colorHex }}
                            />
                            <div>
                                <p className="text-white font-medium">{skinToneInfo.label}</p>
                                <p className="text-xs text-white/50">
                                    {consultation.undertone === "warm" && "Subtono cálido"}
                                    {consultation.undertone === "cool" && "Subtono frío"}
                                    {consultation.undertone === "neutral" && "Subtono neutro"}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Details */}
                {(consultation.eyeDetails?.length > 0 ||
                    consultation.lipDetails?.length > 0 ||
                    consultation.skinDetails?.length > 0) && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-xs text-white/50 mb-2">Preferencias de look</p>
                        <div className="space-y-2">
                            {consultation.eyeDetails?.length > 0 && (
                                <div>
                                    <span className="text-xs text-purple-400">Ojos:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {consultation.eyeDetails.map(detail => (
                                            <span
                                                key={detail}
                                                className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs"
                                            >
                                                {detail.replace(/_/g, " ")}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {consultation.lipDetails?.length > 0 && (
                                <div>
                                    <span className="text-xs text-red-400">Labios:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {consultation.lipDetails.map(detail => (
                                            <span
                                                key={detail}
                                                className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-xs"
                                            >
                                                {detail.replace(/_/g, " ")}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {consultation.skinDetails?.length > 0 && (
                                <div>
                                    <span className="text-xs text-amber-400">Piel:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {consultation.skinDetails.map(detail => (
                                            <span
                                                key={detail}
                                                className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs"
                                            >
                                                {detail.replace(/_/g, " ")}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Inspiration Images */}
                {consultation.inspirationImages?.length > 0 && (
                    <div>
                        <p className="text-xs text-white/50 mb-2">Fotos de inspiración</p>
                        <div className="grid grid-cols-3 gap-2">
                            {consultation.inspirationImages.map((url, i) => (
                                <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-pink-500 transition-all"
                                >
                                    <img
                                        src={url}
                                        alt={`Inspiración ${i + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Social Links */}
                {((consultation.pinterestLinks?.length ?? 0) > 0 || (consultation.instagramLinks?.length ?? 0) > 0) && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-xs text-white/50 mb-2">Links de inspiración</p>
                        <div className="space-y-2">
                            {consultation.pinterestLinks?.map((link, i) => (
                                <a
                                    key={`pinterest-${i}`}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Pinterest {i + 1}
                                </a>
                            ))}
                            {consultation.instagramLinks?.map((link, i) => (
                                <a
                                    key={`instagram-${i}`}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-pink-400 hover:text-pink-300"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Instagram {i + 1}
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* Health Info */}
                {(consultation.hadReactionBefore ||
                    consultation.wearContactLenses ||
                    consultation.preferVegan ||
                    consultation.preferCrueltyFree ||
                    consultation.preferFragranceFree) && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-400 mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Información importante
                        </p>
                        <div className="space-y-2 text-sm">
                            {consultation.wearContactLenses && (
                                <p className="text-amber-200">
                                    • Usa lentes de contacto
                                </p>
                            )}
                            {consultation.hadReactionBefore && (
                                <div>
                                    <p className="text-amber-200">• Ha tenido reacciones previas</p>
                                    {consultation.reactionDetails && (
                                        <p className="text-amber-300/70 ml-4 text-xs">
                                            {consultation.reactionDetails}
                                        </p>
                                    )}
                                </div>
                            )}
                            {consultation.preferVegan && (
                                <p className="text-green-300">• Prefiere productos veganos</p>
                            )}
                            {consultation.preferCrueltyFree && (
                                <p className="text-pink-300">• Prefiere productos cruelty-free</p>
                            )}
                            {consultation.preferFragranceFree && (
                                <p className="text-purple-300">• Prefiere productos sin fragancia</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {consultation.notes && (
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <p className="text-xs text-white/50 mb-1">Notas adicionales</p>
                        <p className="text-white text-sm">{consultation.notes}</p>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="flex gap-2">
                    <a
                        href={`https://wa.me/${consultation.customerPhone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                    >
                        <Button variant="outline" className="w-full">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Enviar WhatsApp
                        </Button>
                    </a>
                </div>
            </div>
        </div>
    );
}
