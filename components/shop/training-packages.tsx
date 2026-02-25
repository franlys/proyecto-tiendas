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
    ChefHat,
    ShoppingBag,
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
import { MEAL_PREP_PACKAGES, MEAL_PREP_PRICES } from "@/lib/types/meal-prep.types";

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
    const [enrollmentStep, setEnrollmentStep] = useState<"info" | "preferences" | "upsell" | "summary">("info");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [preferredDays, setPreferredDays] = useState<DayOfWeek[]>([]);
    const [preferredTime, setPreferredTime] = useState<"morning" | "afternoon" | "evening">("morning");
    const [fitnessGoals, setFitnessGoals] = useState("");
    const [notes, setNotes] = useState("");
    const [selectedMealPackage, setSelectedMealPackage] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<{ id: string, number: string } | null>(null);
    const [distanceWarning, setDistanceWarning] = useState(false);

    // Load packages
    useEffect(() => {
        async function loadPackages() {
            try {
                // Fixed collection name: training-packages
                const packagesRef = collection(db, "shops", shopId, "training-packages");
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
        setEnrollmentStep("info");
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
        if (!selectedPackage || !shopId) return;

        setIsSubmitting(true);

        try {
            // Precio del paquete de comida si se seleccionó
            const mealPrice = selectedMealPackage ? selectedMealPackage * MEAL_PREP_PRICES.STANDARD_PLATE : 0;
            const totalPrice = selectedPackage.price + mealPrice;

            // Prepare items for unified order
            const items = [
                {
                    id: selectedPackage.id,
                    name: selectedPackage.name,
                    price: selectedPackage.price,
                    type: "training"
                }
            ];

            if (selectedMealPackage) {
                items.push({
                    id: `meal-${selectedMealPackage}`,
                    name: `Plan Nutricional (${selectedMealPackage} platos)`,
                    price: mealPrice,
                    type: "meal_prep"
                });
            }

            // Call internal API
            const response = await fetch("/api/orders/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shopId,
                    customerName,
                    customerPhone,
                    customerAddress,
                    items,
                    total: totalPrice,
                    notes: JSON.stringify({
                        preferredDays,
                        preferredTime,
                        fitnessGoals,
                        notes
                    })
                })
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.error || "Error al procesar el pedido");

            // Set success state
            setOrderSuccess({ id: result.orderId, number: result.orderNumber });
            setEnrollmentStep("summary"); // Stay in summary but show success state

            // Optional: Still open WhatsApp but as a secondary action or auto-redirect
            // For now, the user requested we send the confirmation ourselves.

        } catch (error: any) {
            console.error("Error creating subscription:", error);
            alert(error.message || "Error al procesar la solicitud. Intenta de nuevo.");
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
                                {pkg.image && (
                                    <div className="relative aspect-video rounded-xl overflow-hidden mb-4 border border-white/10 group-hover:border-primary/30 transition-colors">
                                        <img
                                            src={pkg.image}
                                            alt={pkg.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                )}
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
                        <div className="overflow-y-auto max-h-[calc(90vh-160px)] p-4">
                            {enrollmentStep === "info" && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-3">
                                        <h3 className="text-sm font-medium text-slate-400">Tus datos personales</h3>
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
                                    </div>

                                    <Button
                                        onClick={() => setEnrollmentStep("preferences")}
                                        disabled={!customerName || !customerPhone}
                                        className="w-full"
                                    >
                                        Siguiente
                                    </Button>
                                </div>
                            )}

                            {enrollmentStep === "preferences" && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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

                                    {/* Address */}
                                    {selectedPackage.locationType !== "online" && (
                                        <div className="space-y-3">
                                            <h3 className="text-sm font-medium text-slate-400">Tu dirección</h3>
                                            <input
                                                type="text"
                                                value={customerAddress}
                                                onChange={(e) => setCustomerAddress(e.target.value)}
                                                placeholder="Calle, Ciudad, Código Postal..."
                                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={() => setEnrollmentStep("info")} className="flex-1">
                                            Atrás
                                        </Button>
                                        <Button
                                            onClick={() => setEnrollmentStep("upsell")}
                                            className="flex-1"
                                            disabled={preferredDays.length < selectedPackage.sessionsPerWeek}
                                        >
                                            Siguiente
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {enrollmentStep === "upsell" && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                                                <ChefHat className="w-5 h-5 text-white" />
                                            </div>
                                            <h3 className="text-lg font-bold text-white">Potencia tus resultados</h3>
                                        </div>
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            El <strong>70% del éxito</strong> en tu transformación depende de la nutrición.
                                            Añade un plan de <strong>Meal Prep</strong> y asegura que cada entrenamiento cuente.
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-sm font-medium text-slate-400">Selecciona un paquete de platos:</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {MEAL_PREP_PACKAGES.map((pkg) => (
                                                <button
                                                    key={pkg.plateCount}
                                                    onClick={() => setSelectedMealPackage(selectedMealPackage === pkg.plateCount ? null : pkg.plateCount)}
                                                    className={cn(
                                                        "p-4 rounded-xl border-2 transition-all text-left",
                                                        selectedMealPackage === pkg.plateCount
                                                            ? "border-green-500 bg-green-500/20"
                                                            : "border-white/10 bg-white/5 hover:border-white/20"
                                                    )}
                                                >
                                                    <div className="text-lg font-bold text-white">{pkg.plateCount} Platos</div>
                                                    <div className="text-sm text-green-400 font-semibold mt-1">
                                                        +${(pkg.plateCount * MEAL_PREP_PRICES.STANDARD_PLATE).toLocaleString()}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setSelectedMealPackage(null)}
                                            className={cn(
                                                "w-full p-3 rounded-xl border border-white/10 text-sm transition-all",
                                                selectedMealPackage === null ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-400"
                                            )}
                                        >
                                            Prefiero solo el entrenamiento por ahora
                                        </button>
                                    </div>

                                    <div className="flex gap-3">
                                        <Button variant="outline" onClick={() => setEnrollmentStep("preferences")} className="flex-1">
                                            Atrás
                                        </Button>
                                        <Button onClick={() => setEnrollmentStep("summary")} className="flex-1 bg-green-600 hover:bg-green-700">
                                            Ir al Resumen
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {enrollmentStep === "summary" && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    {orderSuccess ? (
                                        <div className="text-center py-8 space-y-4 animate-in zoom-in-95">
                                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/50">
                                                <Check className="w-10 h-10 text-green-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-bold text-white">¡Pedido Confirmado!</h3>
                                                <p className="text-slate-400 mt-2">Hemos recibido tu solicitud correctamente.</p>
                                            </div>
                                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl inline-block">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider">Tu ID de Pedido</p>
                                                <p className="text-2xl font-mono font-bold text-primary">{orderSuccess.number}</p>
                                            </div>
                                            <p className="text-sm text-slate-400">Te contactaremos vía WhatsApp para los detalles de pago y acceso.</p>
                                            <Button
                                                onClick={() => {
                                                    setIsEnrollmentOpen(false);
                                                    setOrderSuccess(null);
                                                    setEnrollmentStep("info");
                                                }}
                                                className="w-full bg-primary hover:bg-primary/90 text-white"
                                            >
                                                Cerrar
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <h4 className="font-bold text-white">{selectedPackage.name}</h4>
                                                        <p className="text-xs text-slate-400">Entrenamiento Personalizado</p>
                                                    </div>
                                                    <span className="text-white font-bold">${selectedPackage.price.toLocaleString()}</span>
                                                </div>

                                                {selectedMealPackage && (
                                                    <div className="flex justify-between items-start pt-3 border-t border-white/10">
                                                        <div>
                                                            <h4 className="font-bold text-green-400">Meal Prep ({selectedMealPackage} platos)</h4>
                                                            <p className="text-xs text-slate-400">Nutrición Complementaria</p>
                                                        </div>
                                                        <span className="text-green-400 font-bold">+${(selectedMealPackage * MEAL_PREP_PRICES.STANDARD_PLATE).toLocaleString()}</span>
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-center pt-4 border-t border-white/10">
                                                    <span className="text-lg font-bold text-white">Total</span>
                                                    <span className="text-2xl font-bold text-primary">
                                                        ${(selectedPackage.price + (selectedMealPackage ? selectedMealPackage * MEAL_PREP_PRICES.STANDARD_PLATE : 0)).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                                    <Calendar className="w-4 h-4 text-primary" />
                                                    <span>{preferredDays.map(d => DAY_LABELS[d]).join(", ")}</span>
                                                </div>
                                                {customerAddress && (
                                                    <div className="flex items-center gap-2 text-sm text-slate-300">
                                                        <MapPin className="w-4 h-4 text-primary" />
                                                        <span className="truncate">{customerAddress}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex gap-3">
                                                <Button variant="outline" onClick={() => setEnrollmentStep("upsell")} className="flex-1">
                                                    Atrás
                                                </Button>
                                                <Button
                                                    onClick={handleSubmit}
                                                    disabled={isSubmitting}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 h-12 text-lg"
                                                >
                                                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirmar e Iniciar"}
                                                </Button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer (Simplified as buttons are now inside content for better flow) */}
                    </div>
                </div>
            )}
        </div>
    );
}
