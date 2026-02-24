"use client";

import { useState, useEffect } from "react";
import { X, ChefHat, Plus, Minus, MapPin, Truck, Check } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
    MealPlate,
    MealPlateComponents,
    MEAL_PREP_PACKAGES,
    PREMIUM_PROTEINS,
    PremiumProtein,
    DEFAULT_DELIVERY_CONFIG,
    createEmptyPlates,
    calculateMealPrepTotal,
    isMealPackageComplete,
    formatPlateDescription,
} from "@/lib/types/meal-prep.types";

interface MealPrepModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (plates: MealPlate[], totalPrice: number, distance?: number) => void;
    shopName?: string;
    whatsappNumber?: string;
}

export function MealPrepModal({
    isOpen,
    onClose,
    onConfirm,
    shopName = "Meal Prep",
    whatsappNumber,
}: MealPrepModalProps) {
    const [step, setStep] = useState<"package" | "plates" | "delivery" | "summary">("package");
    const [selectedPackage, setSelectedPackage] = useState<number>(3);
    const [plates, setPlates] = useState<MealPlate[]>([]);
    const [currentPlateIndex, setCurrentPlateIndex] = useState(0);
    const [distance, setDistance] = useState<number | undefined>();
    const [distanceInput, setDistanceInput] = useState("");
    const [customerNotes, setCustomerNotes] = useState("");

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep("package");
            setSelectedPackage(3);
            setPlates([]);
            setCurrentPlateIndex(0);
            setDistance(undefined);
            setDistanceInput("");
            setCustomerNotes("");
        }
    }, [isOpen]);

    // Initialize plates when package is selected
    useEffect(() => {
        if (step === "plates" && plates.length !== selectedPackage) {
            setPlates(createEmptyPlates(selectedPackage));
            setCurrentPlateIndex(0);
        }
    }, [step, selectedPackage, plates.length]);

    if (!isOpen) return null;

    const currentPlate = plates[currentPlateIndex];
    const pricing = calculateMealPrepTotal(plates, 13, distance);
    const packageConfig = MEAL_PREP_PACKAGES.find(p => p.plateCount === selectedPackage);

    const updatePlateComponent = (field: keyof MealPlateComponents, value: string) => {
        const newPlates = [...plates];
        newPlates[currentPlateIndex] = {
            ...newPlates[currentPlateIndex],
            components: {
                ...newPlates[currentPlateIndex].components,
                [field]: value,
            },
        };
        setPlates(newPlates);
    };

    const setPremiumProtein = (protein: PremiumProtein | null) => {
        const newPlates = [...plates];
        newPlates[currentPlateIndex] = {
            ...newPlates[currentPlateIndex],
            isPremiumProtein: protein !== null,
            premiumSurcharge: protein?.surcharge || 0,
        };
        // Also update the protein name if selecting premium
        if (protein) {
            newPlates[currentPlateIndex].components = {
                ...newPlates[currentPlateIndex].components,
                proteina: protein.name,
            };
        }
        setPlates(newPlates);
    };

    const handlePackageSelect = (count: number) => {
        setSelectedPackage(count);
    };

    const handleContinueToPlates = () => {
        setStep("plates");
    };

    const handleNextPlate = () => {
        if (currentPlateIndex < plates.length - 1) {
            setCurrentPlateIndex(currentPlateIndex + 1);
        } else {
            setStep("delivery");
        }
    };

    const handlePrevPlate = () => {
        if (currentPlateIndex > 0) {
            setCurrentPlateIndex(currentPlateIndex - 1);
        } else {
            setStep("package");
        }
    };

    const handleDistanceContinue = () => {
        const miles = parseFloat(distanceInput);
        if (!isNaN(miles) && miles >= 0) {
            setDistance(miles);
        }
        setStep("summary");
    };

    const handleConfirm = () => {
        onConfirm(plates, pricing.total, distance);
    };

    const generateWhatsAppMessage = (): string => {
        let message = `Hola! Quiero ordenar un paquete de ${selectedPackage} platos:\n\n`;

        plates.forEach((plate, index) => {
            message += `*Plato ${index + 1}:*\n`;
            message += `  - Proteina: ${plate.components.proteina}\n`;
            message += `  - Carbohidrato: ${plate.components.carbohidrato}\n`;
            message += `  - Vegetales: ${plate.components.vegetales}\n`;
            message += `  - Frutas: ${plate.components.frutas || "No especificado"}\n`;
            if (plate.isPremiumProtein && plate.premiumSurcharge) {
                message += `  - (Proteina Premium +$${plate.premiumSurcharge})\n`;
            }
            message += "\n";
        });

        if (customerNotes) {
            message += `*Notas/Indicaciones especiales:*\n${customerNotes}\n\n`;
        }

        message += `---\n`;
        message += `Subtotal: $${pricing.basePrice}\n`;
        if (pricing.premiumTotal > 0) {
            message += `Proteinas Premium: +$${pricing.premiumTotal}\n`;
        }
        if (pricing.deliverySurcharge > 0) {
            message += `Cargo por distancia (>${DEFAULT_DELIVERY_CONFIG.freeDistanceMiles} millas): +$${pricing.deliverySurcharge}\n`;
        }
        message += `*Total: $${pricing.total}*\n`;

        return encodeURIComponent(message);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg glass-panel rounded-2xl border border-green-500/30 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                            <ChefHat className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{shopName}</h2>
                            <p className="text-sm text-slate-400">
                                {step === "package" && "Selecciona tu paquete"}
                                {step === "plates" && `Plato ${currentPlateIndex + 1} de ${selectedPackage}`}
                                {step === "delivery" && "Entrega"}
                                {step === "summary" && "Resumen de tu pedido"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress */}
                <div className="flex gap-1 px-4 py-2 bg-black/20">
                    {["package", "plates", "delivery", "summary"].map((s, i) => (
                        <div
                            key={s}
                            className={cn(
                                "flex-1 h-1 rounded-full transition-colors",
                                ["package", "plates", "delivery", "summary"].indexOf(step) >= i
                                    ? "bg-green-500"
                                    : "bg-white/10"
                            )}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Step 1: Package Selection */}
                    {step === "package" && (
                        <div className="space-y-4">
                            <p className="text-slate-300 text-sm">
                                Minimo 3 platos por pedido. $13 por plato base.
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                {MEAL_PREP_PACKAGES.map((pkg) => (
                                    <button
                                        key={pkg.type}
                                        onClick={() => handlePackageSelect(pkg.plateCount)}
                                        className={cn(
                                            "p-4 rounded-xl border-2 transition-all text-left",
                                            selectedPackage === pkg.plateCount
                                                ? "border-green-500 bg-green-500/20"
                                                : "border-white/10 bg-white/5 hover:border-white/20"
                                        )}
                                    >
                                        <div className="text-2xl font-bold text-white">
                                            {pkg.plateCount}
                                        </div>
                                        <div className="text-sm text-slate-400">platos</div>
                                        <div className="text-lg font-semibold text-green-400 mt-2">
                                            ${pkg.plateCount * pkg.pricePerPlate}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                <p className="text-sm text-amber-300">
                                    Las proteinas premium tienen cargo extra: Res +$1, Camarones +$5, Salmon +$7
                                </p>
                            </div>

                            <Button
                                onClick={handleContinueToPlates}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                            >
                                Continuar - Configurar Platos
                            </Button>
                        </div>
                    )}

                    {/* Step 2: Plate Configuration */}
                    {step === "plates" && currentPlate && (
                        <div className="space-y-4">
                            {/* Plate tabs */}
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {plates.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentPlateIndex(index)}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                                            currentPlateIndex === index
                                                ? "bg-green-500 text-white"
                                                : plates[index].components.proteina
                                                    ? "bg-green-500/20 text-green-400"
                                                    : "bg-white/10 text-slate-400"
                                        )}
                                    >
                                        Plato {index + 1}
                                        {plates[index].components.proteina && (
                                            <Check className="w-3 h-3 inline ml-1" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Protein input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Proteina
                                </label>
                                <input
                                    type="text"
                                    value={currentPlate.components.proteina}
                                    onChange={(e) => updatePlateComponent("proteina", e.target.value)}
                                    placeholder="Ej: Pollo, Res, Pescado..."
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
                                />

                                {/* Premium protein shortcuts */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {PREMIUM_PROTEINS.map((protein) => (
                                        <button
                                            key={protein.id}
                                            onClick={() => setPremiumProtein(protein)}
                                            className={cn(
                                                "px-2 py-1 rounded-lg text-xs transition-colors",
                                                currentPlate.components.proteina === protein.name
                                                    ? "bg-amber-500 text-black"
                                                    : "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                                            )}
                                        >
                                            {protein.name} (+${protein.surcharge})
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Carbohydrate input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Carbohidrato
                                </label>
                                <input
                                    type="text"
                                    value={currentPlate.components.carbohidrato}
                                    onChange={(e) => updatePlateComponent("carbohidrato", e.target.value)}
                                    placeholder="Ej: Arroz, Papa, Quinoa..."
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
                                />
                            </div>

                            {/* Vegetables input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Vegetales
                                </label>
                                <input
                                    type="text"
                                    value={currentPlate.components.vegetales}
                                    onChange={(e) => updatePlateComponent("vegetales", e.target.value)}
                                    placeholder="Ej: Brocoli y zanahoria, Ensalada mixta..."
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
                                />
                            </div>

                            {/* Fruits input */}
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Frutas
                                </label>
                                <input
                                    type="text"
                                    value={currentPlate.components.frutas}
                                    onChange={(e) => updatePlateComponent("frutas", e.target.value)}
                                    placeholder="Ej: Manzana, Plátano, Frutos rojos..."
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
                                />
                            </div>

                            {/* Navigation */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handlePrevPlate}
                                    className="flex-1 border-white/20 text-slate-300"
                                >
                                    <Minus className="w-4 h-4 mr-2" />
                                    Anterior
                                </Button>
                                <Button
                                    onClick={handleNextPlate}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                    // Relaxed validation: only protein is strictly required if they want to use notes later
                                    disabled={!currentPlate.components.proteina}
                                >
                                    {currentPlateIndex < plates.length - 1 ? (
                                        <>
                                            Siguiente
                                            <Plus className="w-4 h-4 ml-2" />
                                        </>
                                    ) : (
                                        "Continuar"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Delivery */}
                    {step === "delivery" && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                <MapPin className="w-6 h-6 text-green-400" />
                                <div>
                                    <p className="text-white font-medium">Distancia de entrega</p>
                                    <p className="text-sm text-slate-400">
                                        Gratis hasta {DEFAULT_DELIVERY_CONFIG.freeDistanceMiles} millas.
                                        Cargo de ${DEFAULT_DELIVERY_CONFIG.surchargeAmount} para distancias mayores.
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Distancia aproximada (millas)
                                </label>
                                <input
                                    type="number"
                                    value={distanceInput}
                                    onChange={(e) => setDistanceInput(e.target.value)}
                                    placeholder="Ej: 5"
                                    min="0"
                                    step="0.1"
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
                                />
                            </div>

                            {parseFloat(distanceInput) > DEFAULT_DELIVERY_CONFIG.freeDistanceMiles && (
                                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                    <p className="text-sm text-amber-300">
                                        Se aplicara un cargo de ${DEFAULT_DELIVERY_CONFIG.surchargeAmount} por la distancia.
                                    </p>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep("plates")}
                                    className="flex-1 border-white/20 text-slate-300"
                                >
                                    Volver
                                </Button>
                                <Button
                                    onClick={handleDistanceContinue}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                >
                                    Continuar
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Summary */}
                    {step === "summary" && (
                        <div className="space-y-4">
                            {/* Plates summary */}
                            <div className="space-y-2">
                                {plates.map((plate, index) => (
                                    <div
                                        key={index}
                                        className="p-3 rounded-lg bg-white/5 border border-white/10"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-white font-medium">Plato {index + 1}</p>
                                                <p className="text-sm text-slate-400">
                                                    {formatPlateDescription(plate)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-green-400 font-medium">$13</p>
                                                {plate.premiumSurcharge ? (
                                                    <p className="text-xs text-amber-400">+${plate.premiumSurcharge}</p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pricing breakdown */}
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-2">
                                <div className="flex justify-between text-slate-300">
                                    <span>Subtotal ({selectedPackage} platos x $13)</span>
                                    <span>${pricing.basePrice}</span>
                                </div>
                                {pricing.premiumTotal > 0 && (
                                    <div className="flex justify-between text-amber-400">
                                        <span>Proteinas Premium</span>
                                        <span>+${pricing.premiumTotal}</span>
                                    </div>
                                )}
                                {pricing.deliverySurcharge > 0 && (
                                    <div className="flex justify-between text-amber-400">
                                        <span>Cargo por distancia</span>
                                        <span>+${pricing.deliverySurcharge}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
                                    <span>Total</span>
                                    <span className="text-green-400">${pricing.total}</span>
                                </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep("delivery")}
                                    className="flex-1 border-white/20 text-slate-300"
                                >
                                    Volver
                                </Button>
                                {whatsappNumber ? (
                                    <a
                                        href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${generateWhatsAppMessage()}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1"
                                    >
                                        <Button
                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                        >
                                            <Truck className="w-4 h-4 mr-2" />
                                            Ordenar por WhatsApp
                                        </Button>
                                    </a>
                                ) : (
                                    <Button
                                        onClick={handleConfirm}
                                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                    >
                                        <Truck className="w-4 h-4 mr-2" />
                                        Confirmar Pedido
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
