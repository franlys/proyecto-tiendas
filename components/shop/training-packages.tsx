"use client";

import { useState, useEffect } from "react";
import {
    Calendar,
    Clock,
    MapPin,
    Check,
    Dumbbell,
    Video,
    ChevronDown,
    ChevronUp,
    MessageCircle,
    Loader2,
    AlertCircle,
} from "lucide-react";
import { cn, formatPhoneForWhatsApp } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useShop } from "@/components/shared";
import { Button } from "@/components/ui";
import {
    type TrainingPackage,
    type DayOfWeek,
    DAY_LABELS,
    FREQUENCY_LABELS,
    DURATION_LABELS,
    BILLING_CYCLE_LABELS,
} from "@/lib/types/training-package.types";

interface TrainingPackagesProps {
    shopId: string;
}

export function TrainingPackages({ shopId }: TrainingPackagesProps) {
    const shop = useShop();
    const [packages, setPackages] = useState<TrainingPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPackage, setSelectedPackage] = useState<TrainingPackage | null>(null);

    // Enrollment form state
    const [isEnrollmentOpen, setIsEnrollmentOpen] = useState(false);
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [preferredDays, setPreferredDays] = useState<DayOfWeek[]>([]);
    const [preferredTime, setPreferredTime] = useState<"morning" | "afternoon" | "evening">("morning");
    const [fitnessGoals, setFitnessGoals] = useState("");
    const [notes, setNotes] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [distanceWarning, setDistanceWarning] = useState(false);

    // Load packages
    useEffect(() => {
        async function loadPackages() {
            try {
                const packagesRef = collection(db, "shops", shopId, "trainingPackages");
                const snapshot = await getDocs(packagesRef);
                const loadedPackages: TrainingPackage[] = [];

                snapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.isActive) {
                        loadedPackages.push({
                            id: doc.id,
                            ...data,
                        } as TrainingPackage);
                    }
                });

                // Sort by sortOrder
                loadedPackages.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
                setPackages(loadedPackages);
            } catch (error) {
                console.error("Error loading training packages:", error);
            } finally {
                setLoading(false);
            }
        }

        if (shopId) {
            loadPackages();
        }
    }, [shopId]);

    const handleSelectPackage = (pkg: TrainingPackage) => {
        setSelectedPackage(pkg);
        setIsEnrollmentOpen(true);
        // Pre-select days based on sessions per week
        const defaultDays: DayOfWeek[] = [];
        const allDays: DayOfWeek[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
        for (let i = 0; i < pkg.sessionsPerWeek && i < allDays.length; i++) {
            // Spread sessions across the week
            const dayIndex = Math.floor((i * 7) / pkg.sessionsPerWeek);
            if (!defaultDays.includes(allDays[dayIndex])) {
                defaultDays.push(allDays[dayIndex]);
            } else {
                defaultDays.push(allDays[dayIndex + 1] || allDays[0]);
            }
        }
        setPreferredDays(defaultDays.slice(0, pkg.sessionsPerWeek));
    };

    const toggleDay = (day: DayOfWeek) => {
        if (!selectedPackage) return;

        if (preferredDays.includes(day)) {
            setPreferredDays(prev => prev.filter(d => d !== day));
        } else if (preferredDays.length < selectedPackage.sessionsPerWeek) {
            setPreferredDays(prev => [...prev, day]);
        }
    };

    const handleSubmit = async () => {
        if (!selectedPackage || !shop?.contact.phone) return;
        if (!customerName || !customerPhone) {
            alert("Por favor ingresa tu nombre y teléfono");
            return;
        }
        if (preferredDays.length < selectedPackage.sessionsPerWeek) {
            alert(`Selecciona ${selectedPackage.sessionsPerWeek} días para tus sesiones`);
            return;
        }

        setIsSubmitting(true);

        try {
            // Create subscription request
            const subscriptionData = {
                packageId: selectedPackage.id,
                packageName: selectedPackage.name,
                customerName,
                customerPhone,
                customerAddress,
                sessionsPerWeek: selectedPackage.sessionsPerWeek,
                sessionDuration: selectedPackage.sessionDuration,
                billingCycle: selectedPackage.billingCycle,
                price: selectedPackage.price,
                preferredDays,
                preferredTimeSlot: preferredTime,
                fitnessGoals,
                notes,
                status: "pending",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Save to Firestore
            const docRef = await addDoc(
                collection(db, "shops", shopId, "trainingSubscriptions"),
                subscriptionData
            );

            // Build WhatsApp message
            let message = `Hola, soy *${customerName}*\n`;
            message += `Quiero inscribirme en:\n\n`;
            message += `💪 *${selectedPackage.name}*\n`;
            message += `📅 ${FREQUENCY_LABELS[selectedPackage.sessionsPerWeek]}\n`;
            message += `⏱️ ${DURATION_LABELS[selectedPackage.sessionDuration]} por sesión\n`;
            message += `💰 $${selectedPackage.price.toLocaleString()} / ${BILLING_CYCLE_LABELS[selectedPackage.billingCycle].toLowerCase()}\n\n`;

            message += `*Días preferidos:*\n`;
            preferredDays.forEach(day => {
                message += `• ${DAY_LABELS[day]}\n`;
            });

            const timeLabels = {
                morning: "Mañana (6am - 12pm)",
                afternoon: "Tarde (12pm - 6pm)",
                evening: "Noche (6pm - 9pm)",
            };
            message += `\n⏰ Horario: ${timeLabels[preferredTime]}\n`;

            if (customerAddress) {
                message += `📍 Ubicación: ${customerAddress}\n`;
            }

            if (fitnessGoals) {
                message += `\n🎯 *Objetivos:* ${fitnessGoals}\n`;
            }

            if (notes) {
                message += `\n📝 *Notas:* ${notes}\n`;
            }

            message += `\n📱 Mi teléfono: ${customerPhone}`;
            message += `\n\n_Solicitud ID: ${docRef.id}_`;

            // Open WhatsApp
            const cleanPhone = formatPhoneForWhatsApp(shop.contact.phone);
            const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
            window.location.href = url;

            // Reset form
            setIsEnrollmentOpen(false);
            setSelectedPackage(null);
            setCustomerName("");
            setCustomerPhone("");
            setCustomerAddress("");
            setPreferredDays([]);
            setFitnessGoals("");
            setNotes("");

        } catch (error) {
            console.error("Error creating subscription:", error);
            alert("Error al procesar la solicitud. Intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (packages.length === 0) {
        return null; // Don't show section if no packages
    }

    return (
        <div className="space-y-6">
            {/* Packages Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {packages.map((pkg) => (
                    <div
                        key={pkg.id}
                        className={cn(
                            "relative rounded-2xl overflow-hidden",
                            "bg-white/5 border border-white/10",
                            "hover:border-primary/50 transition-all duration-300",
                            selectedPackage?.id === pkg.id && "border-primary ring-2 ring-primary/20"
                        )}
                    >
                        {/* Popular badge */}
                        {pkg.sortOrder === 2 && (
                            <div className="absolute top-4 right-4 px-3 py-1 bg-primary rounded-full text-xs font-bold text-white">
                                Popular
                            </div>
                        )}

                        <div className="p-6">
                            {/* Header */}
                            <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                            {pkg.description && (
                                <p className="text-slate-400 text-sm mb-4">{pkg.description}</p>
                            )}

                            {/* Price */}
                            <div className="mb-6">
                                <span className="text-3xl font-bold text-white">
                                    ${pkg.price.toLocaleString()}
                                </span>
                                <span className="text-slate-400 text-sm ml-1">
                                    / {BILLING_CYCLE_LABELS[pkg.billingCycle].toLowerCase()}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-slate-300">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    <span>{FREQUENCY_LABELS[pkg.sessionsPerWeek]}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-300">
                                    <Clock className="w-5 h-5 text-primary" />
                                    <span>{DURATION_LABELS[pkg.sessionDuration]} por sesión</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-300">
                                    {pkg.locationType === "online" ? (
                                        <Video className="w-5 h-5 text-primary" />
                                    ) : pkg.locationType === "in_person" ? (
                                        <MapPin className="w-5 h-5 text-primary" />
                                    ) : (
                                        <Dumbbell className="w-5 h-5 text-primary" />
                                    )}
                                    <span>
                                        {pkg.locationType === "online"
                                            ? "En línea"
                                            : pkg.locationType === "in_person"
                                                ? "Presencial"
                                                : "Presencial u online"}
                                    </span>
                                </div>
                            </div>

                            {/* Includes */}
                            {pkg.includes && pkg.includes.length > 0 && (
                                <div className="space-y-2 mb-6">
                                    {pkg.includes.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-sm text-slate-400">
                                            <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Distance info */}
                            {pkg.locationType !== "online" && pkg.maxDistanceMiles && (
                                <p className="text-xs text-slate-500 mb-4">
                                    Incluye hasta {pkg.maxDistanceMiles} millas
                                    {pkg.extraMileFee && ` · $${pkg.extraMileFee}/milla extra`}
                                </p>
                            )}

                            {/* CTA */}
                            <Button
                                onClick={() => handleSelectPackage(pkg)}
                                className="w-full"
                                variant={pkg.sortOrder === 2 ? "default" : "outline"}
                            >
                                Inscribirme
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Enrollment Modal */}
            {isEnrollmentOpen && selectedPackage && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsEnrollmentOpen(false)}
                    />

                    <div className={cn(
                        "relative w-full sm:max-w-lg max-h-[90vh] overflow-hidden",
                        "bg-slate-900 border border-white/10",
                        "rounded-t-3xl sm:rounded-2xl",
                        "animate-in slide-in-from-bottom duration-300"
                    )}>
                        {/* Header */}
                        <div className="sticky top-0 z-10 bg-slate-900 border-b border-white/10 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">
                                        Inscripción
                                    </h2>
                                    <p className="text-sm text-primary">{selectedPackage.name}</p>
                                </div>
                                <button
                                    onClick={() => setIsEnrollmentOpen(false)}
                                    className="p-2 rounded-lg hover:bg-white/10 text-slate-400"
                                >
                                    <ChevronDown className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto max-h-[calc(90vh-160px)] p-4 space-y-6">
                            {/* Customer Info */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-slate-400">Tus datos</h3>
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Tu nombre completo"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                />
                                <input
                                    type="tel"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="Tu teléfono (WhatsApp)"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                />
                                {selectedPackage.locationType !== "online" && (
                                    <div>
                                        <input
                                            type="text"
                                            value={customerAddress}
                                            onChange={(e) => setCustomerAddress(e.target.value)}
                                            placeholder="Tu dirección (para sesiones presenciales)"
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                        />
                                        {selectedPackage.maxDistanceMiles && (
                                            <p className="text-xs text-slate-500 mt-1">
                                                Hasta {selectedPackage.maxDistanceMiles} millas incluidas · ${selectedPackage.extraMileFee}/milla extra
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Day Selection */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-slate-400">
                                    Selecciona {selectedPackage.sessionsPerWeek} días
                                    <span className="text-primary ml-1">
                                        ({preferredDays.length}/{selectedPackage.sessionsPerWeek})
                                    </span>
                                </h3>
                                <div className="grid grid-cols-7 gap-2">
                                    {(Object.keys(DAY_LABELS) as DayOfWeek[]).map((day) => {
                                        const isSelected = preferredDays.includes(day);
                                        const canSelect = preferredDays.length < selectedPackage.sessionsPerWeek || isSelected;

                                        return (
                                            <button
                                                key={day}
                                                onClick={() => toggleDay(day)}
                                                disabled={!canSelect}
                                                className={cn(
                                                    "p-2 rounded-lg text-center transition-all",
                                                    isSelected
                                                        ? "bg-primary text-white"
                                                        : canSelect
                                                            ? "bg-white/5 text-slate-400 hover:bg-white/10"
                                                            : "bg-white/5 text-slate-600 opacity-50 cursor-not-allowed"
                                                )}
                                            >
                                                <span className="text-xs font-medium">
                                                    {DAY_LABELS[day].slice(0, 3)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Time Preference */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-slate-400">Horario preferido</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {([
                                        { value: "morning", label: "Mañana", time: "6am - 12pm" },
                                        { value: "afternoon", label: "Tarde", time: "12pm - 6pm" },
                                        { value: "evening", label: "Noche", time: "6pm - 9pm" },
                                    ] as const).map((slot) => (
                                        <button
                                            key={slot.value}
                                            onClick={() => setPreferredTime(slot.value)}
                                            className={cn(
                                                "p-3 rounded-xl border text-center transition-all",
                                                preferredTime === slot.value
                                                    ? "bg-primary/20 border-primary text-white"
                                                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                                            )}
                                        >
                                            <p className="font-medium text-sm">{slot.label}</p>
                                            <p className="text-xs opacity-70">{slot.time}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Fitness Goals */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-slate-400">
                                    Objetivos (opcional)
                                </h3>
                                <textarea
                                    value={fitnessGoals}
                                    onChange={(e) => setFitnessGoals(e.target.value)}
                                    placeholder="Ej: Bajar de peso, ganar masa muscular, mejorar condición física..."
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm resize-none focus:outline-none focus:border-primary/50"
                                    rows={2}
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-slate-400">
                                    Notas adicionales (opcional)
                                </h3>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Condiciones de salud, lesiones, preferencias de ejercicio..."
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 text-sm resize-none focus:outline-none focus:border-primary/50"
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-slate-900 border-t border-white/10 p-4">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-slate-400">Total {BILLING_CYCLE_LABELS[selectedPackage.billingCycle].toLowerCase()}</span>
                                <span className="text-2xl font-bold text-white">
                                    ${selectedPackage.price.toLocaleString()}
                                </span>
                            </div>
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || preferredDays.length < selectedPackage.sessionsPerWeek}
                                className="w-full py-4 text-lg bg-gradient-to-r from-green-500 to-green-600"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <MessageCircle className="w-5 h-5 mr-2" />
                                        Enviar Solicitud
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
