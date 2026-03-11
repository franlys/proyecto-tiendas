"use client";

import { useState, useEffect, useMemo } from "react";
import { X, ChefHat, Plus, Minus, MapPin, Truck, Check, MessageCircle, CheckCircle2, Lock, Clock } from "lucide-react";
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
    MEAL_PREP_PRICES,
    TRAINING_PLANS,
    TrainingPlanConfig,
    MealPrepShopConfig,
    MealPrepSchedule
} from "@/lib/types/meal-prep.types";
import { geocodeAddress, getCurrentLocation, calculateDistance, Coordinates, reverseGeocode } from "@/lib/utils/distance";
import { Loader2, Navigation } from "lucide-react";
import { ExtrasSelector } from "./extras-selector";
import { SelectedExtra } from "@/lib/types/product-extra.types";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Copy, FileText, Image as ImageIcon, Store } from "lucide-react";
import type { ShopManualPaymentConfig, ManualPaymentMethod } from "@/lib/types/payment.types";
import { MANUAL_PAYMENT_METHOD_LABELS } from "@/lib/types/payment.types";

interface MealPrepModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (plates: MealPlate[], totalPrice: number, distance?: number) => void;
    shopName?: string;
    whatsappNumber?: string;
    catalog?: any[];
    hidePriceIfZero?: boolean;
    businessCoordinates?: Coordinates;
    businessAddress?: string;
    shopId?: string;
    trainingPackages?: any[];
    mealPrepConfig?: MealPrepShopConfig;
    manualPaymentConfig?: ShopManualPaymentConfig;
}

export function MealPrepModal({
    isOpen,
    onClose,
    onConfirm,
    shopName = "Meal Prep",
    whatsappNumber,
    catalog = [],
    hidePriceIfZero,
    businessCoordinates,
    businessAddress,
    shopId,
    trainingPackages = [],
    mealPrepConfig,
    manualPaymentConfig
}: MealPrepModalProps) {
    const displayTrainingPlans = useMemo(() => {
        if (trainingPackages && trainingPackages.length > 0) {
            return trainingPackages.map(pkg => ({
                type: pkg.id,
                label: pkg.name,
                monthlyPrice: pkg.price,
                daysPerWeek: 0, // No metadata for this yet
                ...pkg
            }));
        }
        return TRAINING_PLANS;
    }, [trainingPackages]);

    const [step, setStep] = useState<"package" | "plates" | "training" | "delivery" | "info" | "summary">("package");
    const [selectedPackage, setSelectedPackage] = useState<number>(3);
    const [plates, setPlates] = useState<MealPlate[]>([]);
    const [currentPlateIndex, setCurrentPlateIndex] = useState(0);
    const [distance, setDistance] = useState<number | undefined>();
    const [distanceInput, setDistanceInput] = useState("");
    const [selectedTrainingPlan, setSelectedTrainingPlan] = useState<TrainingPlanConfig | undefined>();
    const [customerNotes, setCustomerNotes] = useState("");
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isLocating, setIsLocating] = useState(false);
    const [confirmedAddressText, setConfirmedAddressText] = useState<string | null>(null);
    const [address, setAddress] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccess, setOrderSuccess] = useState<{ id: string, number: string } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
    const [deliveryType, setDeliveryType] = useState<"entrega" | "recogida">("entrega");
    const [addressDetails, setAddressDetails] = useState("");

    // Payment State
    const [paymentTiming, setPaymentTiming] = useState<"pay_now" | "pay_later">("pay_now");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<ManualPaymentMethod | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
    const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Schedule State
    const [deliveryDate, setDeliveryDate] = useState<string>("");
    const [deliveryTime, setDeliveryTime] = useState<string>("");

    const activePaymentMethods = manualPaymentConfig?.paymentMethods?.filter(m => m.isActive) || [];

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep("package");
            setSelectedPackage(3);
            setPlates([]);
            setCurrentPlateIndex(0);
            setDistance(undefined);
            setDistanceInput("");
            setSelectedTrainingPlan(undefined);
            setCustomerNotes("");
            setDeliveryType("entrega");
            setAddressDetails("");
            setCustomerName("");
            setCustomerPhone("");
            setCustomerEmail("");
            setOrderSuccess(null);
            setError(null);
            setDeliveryDate("");
            setDeliveryTime("");
        }
    }, [isOpen]);

    // Initialize plates when package is selected
    useEffect(() => {
        if (isOpen && step === "plates" && plates.length === 0) {
            setPlates(createEmptyPlates(selectedPackage));
            setCurrentPlateIndex(0);
        }
    }, [step, selectedPackage, plates.length, isOpen]);

    // Extract categories and products from catalog
    const { ingredientCategories, productsByCategory } = useMemo(() => {
        const ingredients = (catalog || []).filter(p => !p || p.category !== "meal_prep_package");
        const grouped: Record<string, any[]> = {};
        const cats: any[] = [];
        const nameToCatId: Record<string, string> = {};

        // Helper string normalizer to prevent "Proteínas" vs "proteinas" divergence
        const normalizeCatName = (name: string) =>
            name.toLowerCase()
                .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                .trim();

        // 1. Process Admin Configured Categories First (preserves order and settings)
        if (mealPrepConfig?.categories) {
            mealPrepConfig.categories.forEach(rule => {
                const normName = normalizeCatName(rule.name);
                cats.push({ ...rule });
                nameToCatId[normName] = rule.id;
                grouped[rule.id] = [];
            });
        }

        // 2. Map Catalog Products to Categories (Initial Pass)
        ingredients.forEach(p => {
            if (!p || !p.category) return;
            const originalCatName = p.category;
            const catNameLower = normalizeCatName(originalCatName);
            let catId = nameToCatId[catNameLower];

            if (!catId) {
                // Product belongs to a category not configured in Admin Settings.
                // We add it to the Meal Prep dynamically so it's still available.
                catId = `cat-${catNameLower}-${Date.now()}`;
                nameToCatId[catNameLower] = catId;

                const label = originalCatName
                    .split('-')
                    .map((w: string) => w ? w.charAt(0).toUpperCase() + w.slice(1) : "")
                    .join(' ');

                cats.push({ id: catId, name: label, isPremium: false });
                grouped[catId] = [];
            }

            // Ensure the nested array exists (safety check)
            if (!grouped[catId]) {
                grouped[catId] = [];
            }

            // We temporary store the generic category it belongs to so we can remove it later if it's explicitly premium
            grouped[catId].push({ ...p, _originalCatId: catId });
        });

        // 3. Inject explicit admin "Ingredientes / Extras" into their respective categories
        // Because the admin might have added explicit items with surcharges via the settings panel.
        if (mealPrepConfig?.extras) {
            mealPrepConfig.extras.forEach(extra => {
                if (!extra.isActive) return;

                if (!grouped[extra.categoryId]) {
                    grouped[extra.categoryId] = [];
                }

                // Check if it already exists ANYWHERE in the grouped dictionary to prevent duplication
                // If it exists in a "normal" category but the owner added it to "Premium", we move it to Premium.
                let foundPreviousInfo: any = null;
                let previousCatId: string | null = null;

                Object.keys(grouped).forEach(k => {
                    const idx = grouped[k].findIndex(p => p.name.toLowerCase() === extra.name.toLowerCase());
                    if (idx >= 0) {
                        foundPreviousInfo = grouped[k][idx];
                        previousCatId = k;
                        // Remove from the old category so it doesn't show up twice
                        grouped[k].splice(idx, 1);
                    }
                });

                if (foundPreviousInfo) {
                    // Update the catalog product with the explicitly defined surcharge price and move it to the admin's chosen category
                    grouped[extra.categoryId].push({
                        ...foundPreviousInfo,
                        mealPrepSurcharge: extra.price
                    });
                } else {
                    // It's purely an extra defined in the admin, inject it as a pseudo-product
                    // SKIP if the name is just a price or empty, as it's redundant with the category extra button
                    const cleanName = extra.name.trim();
                    const isJustPrice = /^(\+|-)?\$?\s*\d+(\.\d+)?$/.test(cleanName);

                    if (cleanName && !isJustPrice) {
                        grouped[extra.categoryId].push({
                            id: extra.id,
                            name: extra.name,
                            category: cats.find(c => c.id === extra.categoryId)?.name || "Extra",
                            mealPrepSurcharge: extra.price,
                            isConfigExtra: true
                        });
                    }
                }
            });
        }

        return { ingredientCategories: cats, productsByCategory: grouped };
    }, [catalog, mealPrepConfig]);

    const availableDates = useMemo(() => {
        if (!mealPrepConfig?.schedule) return [];
        const days = [];
        const today = new Date();
        const dayNames: Array<keyof MealPrepSchedule> = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

        // Mostramos los próximos 14 días para elegir
        for (let i = 1; i <= 14; i++) {
            const date = new Date();
            date.setDate(today.getDate() + i);
            const dayOfWeek = dayNames[date.getDay()] as keyof MealPrepSchedule;
            const config = mealPrepConfig.schedule[dayOfWeek];

            if (config && !config.closed) {
                days.push({
                    date: date.toISOString().split('T')[0],
                    label: date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
                    window: `${config.open} - ${config.close}`
                });
            }
        }
        return days;
    }, [mealPrepConfig?.schedule]);

    // Calculate pricing summary
    const pricing = useMemo(() => {
        const calculatedDistance = deliveryType === "recogida" ? 0 : distance;
        return calculateMealPrepTotal(plates, selectedTrainingPlan, calculatedDistance, mealPrepConfig);
    }, [plates, selectedTrainingPlan, distance, deliveryType, mealPrepConfig]);

    if (!isOpen) return null;

    const currentPlate = plates[currentPlateIndex];
    const packageConfig = MEAL_PREP_PACKAGES.find(p => p.plateCount === selectedPackage);

    const updatePlateComponent = (field: string, value: string, surcharge: number = 0) => {
        const newPlates = [...plates];
        const currentPlate = newPlates[currentPlateIndex];

        const newComponents = {
            ...currentPlate.components,
            [field]: value,
        };

        const newSurcharges = { ...(currentPlate.componentSurcharges || {}) };
        if (surcharge > 0) {
            newSurcharges[field] = surcharge;
        } else {
            delete newSurcharges[field];
        }

        // Auto-clear excluded categories (unless unlocked)
        const rulesFromThisChoice = (mealPrepConfig?.rules || []).filter(r => r.type === "exclude" && r.sourceCategoryId === field);
        rulesFromThisChoice.forEach(rule => {
            if (newComponents[rule.targetCategoryId] && !currentPlate.extraCategories?.[rule.targetCategoryId]) {
                delete newComponents[rule.targetCategoryId];
                delete newSurcharges[rule.targetCategoryId];
                // Also clear extras for that category if any
                if (currentPlate.componentExtras && currentPlate.componentExtras[rule.targetCategoryId]) {
                    const newExtras = { ...currentPlate.componentExtras };
                    delete newExtras[rule.targetCategoryId];
                    currentPlate.componentExtras = newExtras;
                }
            }
        });

        newPlates[currentPlateIndex] = {
            ...currentPlate,
            components: newComponents,
            componentSurcharges: newSurcharges,
            isCustom: false, // Selección del menú desactiva el modo custom
        };
        setPlates(newPlates);
    };

    const updatePlateExtras = (catId: string, extras: SelectedExtra[]) => {
        const newPlates = [...plates];
        const currentPlate = newPlates[currentPlateIndex];
        const newComponentExtras = {
            ...(currentPlate.componentExtras || {}),
            [catId]: extras
        };
        newPlates[currentPlateIndex] = {
            ...currentPlate,
            componentExtras: newComponentExtras
        };
        setPlates(newPlates);
    };

    const toggleExtraCategory = (catId: string) => {
        const newPlates = [...plates];
        const currentPlate = newPlates[currentPlateIndex];
        const newExtraCategories = {
            ...(currentPlate.extraCategories || {})
        };

        newExtraCategories[catId] = !newExtraCategories[catId];

        newPlates[currentPlateIndex] = {
            ...currentPlate,
            extraCategories: newExtraCategories
        };
        setPlates(newPlates);
    };

    const updatePlateNote = (note: string) => {
        const newPlates = [...plates];
        newPlates[currentPlateIndex] = {
            ...newPlates[currentPlateIndex],
            notes: note,
            isCustom: note.trim().length > 0 && Object.keys(newPlates[currentPlateIndex].components).length === 0
        };
        setPlates(newPlates);
    };

    const setPremiumProtein = (protein: PremiumProtein | null) => {
        const newPlates = [...plates];
        newPlates[currentPlateIndex] = {
            ...newPlates[currentPlateIndex],
            isPremiumProtein: protein !== null,
            premiumSurcharge: protein?.surcharge || 0,
            isCustom: false, // Selección del menú desactiva el modo custom
        };
        // Also update the protein name if selecting premium
        if (protein) {
            // Find which category looks like "proteina"
            const proteinCatId = ingredientCategories.find(c => c.id.toLowerCase().includes("protein"))?.id || "proteina";
            newPlates[currentPlateIndex].components = {
                ...newPlates[currentPlateIndex].components,
                [proteinCatId]: protein.name,
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
        // Enforce required categories
        const missingRequired = ingredientCategories
            .filter(cat => cat.isRequired)
            .filter(cat => {
                // Si la categoría está excluida y no se ha desbloqueado como extra, no cuenta como faltante
                const exclusionRules = (mealPrepConfig?.rules || []).filter(r => r.type === "exclude" && r.targetCategoryId === cat.id);
                const isExcluded = exclusionRules.some(rule =>
                    currentPlate.components[rule.sourceCategoryId] && !currentPlate.extraCategories?.[cat.id]
                );

                if (isExcluded) return false;
                return !currentPlate.components[cat.id];
            });

        if (missingRequired.length > 0) {
            alert(`Por favor selecciona las opciones obligatorias: ${missingRequired.map(c => c.name).join(", ")}`);
            return;
        }

        if (currentPlateIndex < plates.length - 1) {
            setCurrentPlateIndex(currentPlateIndex + 1);
        } else {
            setStep("training");
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

    // Copy to clipboard helper
    const copyToClipboard = async (text: string, fieldName: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(fieldName);
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            console.error("Error copying to clipboard:", err);
        }
    };

    const handleConfirm = async () => {
        if (!customerName || !customerPhone || !customerEmail) {
            setError("Por favor completa todos los campos de contacto");
            setStep("info");
            return;
        }

        if (!shopId) {
            setError("Error: No se pudo identificar la tienda. Contacta soporte.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            let finalReceiptUrl = null;
            let receiptFileName = null;

            // Upload receipt if required and payment is pay_now
            if (paymentTiming === 'pay_now' && manualPaymentConfig?.requiresReceipt && receiptFile) {
                setIsUploadingReceipt(true);
                const fileExtension = receiptFile.name.split('.').pop();
                const fileName = `receipts/${shopId}/${Date.now()}.${fileExtension}`;
                const storageRef = ref(storage, fileName);

                await uploadBytes(storageRef, receiptFile);
                finalReceiptUrl = await getDownloadURL(storageRef);
                receiptFileName = fileName;
                setIsUploadingReceipt(false);
            }

            const items = plates.map((plate, index) => {
                const selectedExtrasList: string[] = [];
                let plateExtrasSum = 0;

                if (plate.componentExtras) {
                    Object.entries(plate.componentExtras).forEach(([catId, extras]) => {
                        extras.forEach(extra => {
                            plateExtrasSum += (extra.price * extra.quantity);
                            selectedExtrasList.push(`${extra.name}${extra.quantity > 1 ? ` (x${extra.quantity})` : ''}`);
                        });
                    });
                }

                const extrasText = selectedExtrasList.length > 0
                    ? `Extras: ${selectedExtrasList.join(", ")}`
                    : "";

                return {
                    id: `plate-${index}`,
                    name: `Plato ${index + 1}: ${formatPlateDescription(plate)}`,
                    quantity: 1,
                    price: (plate.isCustom ? MEAL_PREP_PRICES.CUSTOM_PLATE : MEAL_PREP_PRICES.STANDARD_PLATE) +
                        (plate.premiumSurcharge || 0) +
                        plateExtrasSum,
                    notes: [plate.notes, extrasText].filter(Boolean).join(" | ")
                };
            });

            if (selectedTrainingPlan) {
                items.push({
                    id: `training-${selectedTrainingPlan.type}`,
                    name: `Entrenamiento: ${selectedTrainingPlan.label}`,
                    quantity: 1,
                    price: selectedTrainingPlan.monthlyPrice,
                    notes: ""
                });
            }

            const response = await fetch("/api/orders/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shopId,
                    customerName,
                    customerPhone,
                    customerEmail,
                    customerAddress: deliveryType === "recogida" ? businessAddress || "Recogida en local" : `${address}${addressDetails ? `, ${addressDetails}` : ""}`,
                    deliveryType,
                    paymentInfo: paymentTiming === 'pay_now' ? {
                        paymentTiming: 'pay_now',
                        paymentMethodId: selectedPaymentMethod?.id,
                        paymentMethodName: selectedPaymentMethod?.name,
                        paymentMethodType: selectedPaymentMethod?.type,
                        receiptUrl: finalReceiptUrl || undefined,
                        status: 'pending_verification'
                    } : {
                        paymentTiming: 'pay_on_delivery',
                        status: 'pending'
                    },
                    deliveryDate,
                    deliveryTime,
                    items,
                    total: pricing.total,
                    notes: customerNotes
                })
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "Error al procesar el pedido");

            setOrderSuccess({ id: result.orderId, number: result.orderNumber });
            setStep("summary");

        } catch (err: any) {
            console.error("Error order:", err);
            setError(err.message || "Error al procesar el pedido");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSelectTraining = (plan: TrainingPlanConfig | undefined) => {
        setSelectedTrainingPlan(plan);
    };

    const generateWhatsAppMessage = (): string => {
        let message = `Hola! Quiero ordenar un paquete de ${selectedPackage} platos personalizado:\n\n`;

        plates.forEach((plate, index) => {
            const platePrice = plate.isCustom ? MEAL_PREP_PRICES.CUSTOM_PLATE : MEAL_PREP_PRICES.STANDARD_PLATE;
            message += `*Plato ${index + 1} (${plate.isCustom ? 'Personalizado' : 'Estándar'} - $${platePrice}):*\n`;

            ingredientCategories.forEach((cat: { id: string, name: string }) => {
                if (plate.components[cat.id]) {
                    message += `  - ${cat.name}: ${plate.components[cat.id]}\n`;
                    const extras = plate.componentExtras?.[cat.id];
                    if (extras && extras.length > 0) {
                        const extrasStr = extras.map(e => e.quantity > 1 ? `${e.name} x${e.quantity}` : e.name).join(", ");
                        message += `    (Extras: ${extrasStr})\n`;
                    }
                }
            });

            if (plate.componentSurcharges) {
                Object.entries(plate.componentSurcharges).forEach(([catId, surcharge]) => {
                    const catName = ingredientCategories.find((c: any) => c.id === catId)?.name || "Extra";
                    message += `  - (${catName} premium +$${surcharge})\n`;
                });
            }
            if (plate.notes) {
                message += `  - Nota/Especificaciones: ${plate.notes}\n`;
            }
            message += "\n";
        });

        if (selectedTrainingPlan) {
            message += `*Añadir Paquete de Entrenamiento:*\n - ${selectedTrainingPlan.label} ($${selectedTrainingPlan.monthlyPrice}/mes)\n\n`;
        }

        if (customerNotes) {
            message += `*Notas Generales:*\n${customerNotes}\n\n`;
        }

        message += `---\n`;
        message += `Subtotal Platos: $${pricing.basePrice}\n`;
        if (pricing.premiumTotal > 0) {
            message += `Proteinas Premium: +$${pricing.premiumTotal}\n`;
        }
        if (selectedTrainingPlan) {
            message += `Entrenamiento: +$${pricing.trainingTotal}\n`;
        }
        if (pricing.deliverySurcharge > 0) {
            message += `Distancia: +$${pricing.deliverySurcharge}\n`;
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
                    {["package", "plates", "training", "delivery", "info", "summary"].map((s, i) => (
                        <div
                            key={s}
                            className={cn(
                                "flex-1 h-1 rounded-full transition-colors",
                                ["package", "plates", "training", "delivery", "info", "summary"].indexOf(step) >= i
                                    ? "bg-green-500"
                                    : "bg-white/10"
                            )}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {!currentPlate && step === "plates" && (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <p className="text-slate-400">Preparando configuración...</p>
                            <Button
                                variant="outline"
                                onClick={() => setStep("package")}
                                className="mt-4"
                            >
                                Volver al inicio
                            </Button>
                        </div>
                    )}
                    {/* Step 1: Package Selection */}
                    {step === "package" && (
                        <div className="space-y-4">
                            <p className="text-slate-300 text-sm">
                                Minimo 3 platos por pedido. $13 por plato base.
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                {MEAL_PREP_PACKAGES.filter(p => p.plateCount >= 3).map((pkg) => (
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
                                            ${pkg.plateCount * MEAL_PREP_PRICES.STANDARD_PLATE}
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

                            {/* Dynamic Category Selection */}
                            <div className="space-y-6">
                                {ingredientCategories
                                    .filter(cat => productsByCategory[cat.id] && productsByCategory[cat.id].length > 0)
                                    .sort((a, b) => (a.isPremium === b.isPremium ? 0 : a.isPremium ? 1 : -1))
                                    .map((cat: any) => (
                                        <div key={cat.id} className={cn("space-y-3 transition-opacity", currentPlate.isCustom ? "opacity-30 pointer-events-none" : "opacity-100")}>
                                            <div className="flex items-center justify-between">
                                                <label className={cn("block text-sm font-semibold flex items-center gap-2", cat.isPremium ? "text-amber-400" : "text-white/90")}>
                                                    {cat.name}
                                                    {cat.isPremium && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-[10px] uppercase font-bold tracking-wider border border-amber-500/20">Premium</span>}
                                                    {currentPlate.extraCategories?.[cat.id] && <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] uppercase font-bold tracking-wider border border-green-500/20">Extra +${cat.extraPrice}</span>}
                                                </label>

                                                {/* Add Extra Button */}
                                                {(cat.extraPrice && cat.extraPrice > 0) && (
                                                    <button
                                                        onClick={() => toggleExtraCategory(cat.id)}
                                                        className={cn(
                                                            "px-2 py-1 rounded-lg text-[10px] font-bold transition-all border",
                                                            currentPlate.extraCategories?.[cat.id]
                                                                ? "bg-green-600 text-white border-green-500"
                                                                : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                                                        )}
                                                    >
                                                        {currentPlate.extraCategories?.[cat.id] ? "Remover Extra" : `¿Agregar Extra? (+$${cat.extraPrice})`}
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                {productsByCategory[cat.id]?.map((prod: any) => {
                                                    const hasVariants = prod.variants && prod.variants.length > 0;
                                                    const isExpanded = expandedProductId === prod.id;
                                                    const isSelected = currentPlate.components[cat.id]?.startsWith(prod.name);

                                                    // Determine if this product is excluded based on other selections in the current plate
                                                    let isExcluded = false;
                                                    let excludesReason = "";

                                                    if (cat.excludesCategories && cat.excludesCategories.length > 0) {
                                                        // This category explicitly excludes others. Conversely, if others were selected first, is this one blocked?
                                                        // Realistically, we check if the plate HAS any of the categories that BLOCKS this one.
                                                    }

                                                    // 2. Logic for exclusion rules from mealPrepConfig
                                                    const exclusionRules = (mealPrepConfig?.rules || []).filter(r => r.type === "exclude" && r.targetCategoryId === cat.id);

                                                    const activeRules = exclusionRules.filter(rule =>
                                                        currentPlate.components[rule.sourceCategoryId] && !currentPlate.extraCategories?.[cat.id]
                                                    );

                                                    if (activeRules.length > 0) {
                                                        isExcluded = true;
                                                        const sourceCatNames = activeRules.map(r => ingredientCategories.find(c => c.id === r.sourceCategoryId)?.name || "otra categoría");
                                                        excludesReason = `No disponible junto con ${sourceCatNames.join(", ")}`;
                                                    }

                                                    return (
                                                        <div key={prod.id} className={cn("contents", isExpanded && "col-span-full")}>
                                                            <button
                                                                onClick={() => {
                                                                    if (isExcluded) return; // Prevent selection if excluded
                                                                    const hasExtras = prod.extras && prod.extras.length > 0;
                                                                    if (hasVariants || hasExtras) {
                                                                        setExpandedProductId(isExpanded ? null : prod.id);
                                                                    } else {
                                                                        updatePlateComponent(cat.id, prod.name, prod.mealPrepSurcharge || 0);
                                                                        setExpandedProductId(null);
                                                                    }
                                                                }}
                                                                disabled={isExcluded}
                                                                className={cn(
                                                                    "px-3 py-2 rounded-xl text-xs font-medium border transition-all text-center h-full flex flex-col items-center justify-center gap-1 min-h-[60px] relative overflow-hidden",
                                                                    isExcluded
                                                                        ? "bg-slate-900/50 border-white/5 opacity-40 cursor-not-allowed grayscale"
                                                                        : isSelected
                                                                            ? cat.isPremium
                                                                                ? "bg-gradient-to-br from-amber-400 to-amber-600 border-amber-400 text-amber-950 shadow-lg shadow-amber-500/20"
                                                                                : "bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/20"
                                                                            : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:bg-white/10",
                                                                    isExpanded && (cat.isPremium ? "border-amber-500 ring-1 ring-amber-500/50" : "border-green-500 ring-1 ring-green-500/50")
                                                                )}
                                                            >
                                                                {isExcluded && <Lock className="absolute top-1 right-1 w-3 h-3 opacity-50 text-rose-400" />}
                                                                <span className="font-bold flex flex-wrap items-center justify-center gap-1">
                                                                    {prod.name}
                                                                    {prod.mealPrepSurcharge > 0 && (
                                                                        <span className={cn("text-[10px]", isSelected ? "text-amber-950/70" : "text-amber-500 font-normal")}>
                                                                            +${prod.mealPrepSurcharge}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                {(hasVariants || (prod.extras && prod.extras.length > 0)) && !isExcluded && (
                                                                    <span className="text-[10px] opacity-70">
                                                                        {isExpanded ? "Cerrar" : (prod.extras && prod.extras.length > 0 ? "Personalizar" : "Ver opciones")}
                                                                    </span>
                                                                )}
                                                                {isExcluded && (
                                                                    <span className="text-[9px] text-rose-400/80 leading-tight mt-1 px-1">
                                                                        {excludesReason}
                                                                    </span>
                                                                )}
                                                            </button>

                                                            {/* Expanded section for variants and extras */}
                                                            {isExpanded && (hasVariants || (prod.extras && prod.extras.length > 0)) && (
                                                                <div className="col-span-full space-y-4 p-4 bg-black/40 rounded-xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200 mt-1">
                                                                    {hasVariants && (
                                                                        <div className="space-y-2">
                                                                            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Opciones / Tamaños</p>
                                                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                                                {prod.variants.map((v: any) => (
                                                                                    <button
                                                                                        key={v.id}
                                                                                        onClick={() => {
                                                                                            updatePlateComponent(cat.id, `${prod.name} (${v.name})`, prod.mealPrepSurcharge || 0);
                                                                                            // No cerramos automáticamente si hay extras, para dejar que el usuario configure más
                                                                                            if (!(prod.extras && prod.extras.length > 0)) {
                                                                                                setExpandedProductId(null);
                                                                                            }
                                                                                        }}
                                                                                        className={cn(
                                                                                            "px-3 py-2 rounded-lg text-xs font-medium border transition-all text-center",
                                                                                            currentPlate.components[cat.id] === `${prod.name} (${v.name})`
                                                                                                ? "bg-green-500 border-green-400 text-white"
                                                                                                : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                                                                                        )}
                                                                                    >
                                                                                        {v.name}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {prod.extras && prod.extras.length > 0 && (
                                                                        <div className="space-y-2">
                                                                            <ExtrasSelector
                                                                                extras={prod.extras}
                                                                                selectedExtras={currentPlate.componentExtras?.[cat.id] || []}
                                                                                onExtrasChange={(extras) => updatePlateExtras(cat.id, extras)}
                                                                                className="bg-transparent border-0 p-0"
                                                                            />
                                                                        </div>
                                                                    )}

                                                                    <Button
                                                                        onClick={() => {
                                                                            // Si no seleccionó variante pero la tiene, obligar o usar base
                                                                            if (!currentPlate.components[cat.id]) {
                                                                                updatePlateComponent(cat.id, prod.name, prod.mealPrepSurcharge || 0);
                                                                            }
                                                                            setExpandedProductId(null);
                                                                        }}
                                                                        className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/10 text-xs py-2 h-auto"
                                                                    >
                                                                        Confirmar y Continuar
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                {/* Custom Selection Toggle */}
                                {mealPrepConfig?.customInstructionsEnabled !== false && (
                                    <div className="p-4 rounded-xl border-2 transition-all border-dashed border-white/10 hover:border-indigo-500/30 bg-white/5">
                                        <div className="flex items-center justify-between gap-4 mb-4">
                                            <div className="flex-1">
                                                <h4 className="font-bold text-white text-sm">¿Deseas personalizar este plato totalmente?</h4>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    Si no encuentras lo que buscas en el menú, escribe exactamente lo que deseas.
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newPlates = [...plates];
                                                    newPlates[currentPlateIndex].isCustom = !newPlates[currentPlateIndex].isCustom;
                                                    if (newPlates[currentPlateIndex].isCustom) {
                                                        newPlates[currentPlateIndex].components = {};
                                                    }
                                                    setPlates(newPlates);
                                                }}
                                                className={cn(
                                                    "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                                                    currentPlate.isCustom
                                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                                                        : "bg-white/10 text-slate-300 hover:bg-white/20"
                                                )}
                                            >
                                                {currentPlate.isCustom ? "Plato Personalizado ACTIVO" : "Personalizar Plato (+$2)"}
                                            </button>
                                        </div>

                                        {(currentPlate.isCustom || currentPlate.notes) && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                                                <label className="block text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                                                    Especificaciones Detalladas ($15)
                                                </label>
                                                <textarea
                                                    value={currentPlate.notes || ""}
                                                    onChange={(e) => updatePlateNote(e.target.value)}
                                                    placeholder="Ej: Plato con carne asada, papas al horno con romero y espárragos frescos. Sin sal."
                                                    rows={3}
                                                    className="w-full px-4 py-3 rounded-xl bg-black/40 border border-indigo-500/30 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Premium protein shortcuts removed to favor dynamic catalog loaded ones */}

                            </div>

                            {/* Navigation */}
                            <div className="flex gap-3 pt-4 border-t border-white/10">
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
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/20"
                                    disabled={Object.keys(currentPlate.components).length === 0 && !currentPlate.notes}
                                >
                                    {currentPlateIndex < plates.length - 1 ? (
                                        <>
                                            Siguiente
                                            <Plus className="w-4 h-4 ml-2" />
                                        </>
                                    ) : (
                                        "Añadir Entrenamiento"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2.5: Training Selection (Optional) */}
                    {step === "training" && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-white mb-2">¿Deseas añadir un Plan de Entrenamiento?</h3>
                            <p className="text-sm text-slate-400">Potencia tus resultados con un plan de entrenamiento personalizado.</p>

                            <div className="space-y-3">
                                {displayTrainingPlans.map((plan) => (
                                    <button
                                        key={plan.type}
                                        onClick={() => handleSelectTraining(plan)}
                                        className={cn(
                                            "w-full p-4 rounded-xl border-2 transition-all text-left flex justify-between items-center",
                                            selectedTrainingPlan?.type === plan.type
                                                ? "border-green-500 bg-green-500/20"
                                                : "border-white/10 bg-white/5 hover:border-white/20"
                                        )}
                                    >
                                        <div>
                                            <div className="font-bold text-white">{plan.label}</div>
                                            <div className="text-xs text-slate-400">Entrenamiento personalizado</div>
                                        </div>
                                        <div className="text-xl font-bold text-green-400">
                                            ${plan.monthlyPrice}
                                        </div>
                                    </button>
                                ))}

                                <button
                                    onClick={() => handleSelectTraining(undefined)}
                                    className={cn(
                                        "w-full p-3 rounded-xl border-2 transition-all text-sm font-medium",
                                        !selectedTrainingPlan
                                            ? "border-white/40 bg-white/10 text-white"
                                            : "border-white/10 text-slate-400 hover:border-white/20"
                                    )}
                                >
                                    No, gracias. Solo las comidas.
                                </button>
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-white/10">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep("plates")}
                                    className="flex-1 border-white/20 text-slate-300"
                                >
                                    Volver
                                </Button>
                                <Button
                                    onClick={() => setStep("delivery")}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                >
                                    Continuar a Entrega
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Delivery */}
                    {step === "delivery" && (
                        <div className="space-y-6">
                            {/* Delivery Type Selector */}
                            <div className="flex p-1 rounded-2xl bg-white/5 border border-white/10">
                                <button
                                    onClick={() => setDeliveryType("entrega")}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm",
                                        deliveryType === "entrega" ? "bg-green-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <Truck className="w-4 h-4" />
                                    A Domicilio
                                </button>
                                <button
                                    onClick={() => {
                                        setDeliveryType("recogida");
                                        setDistance(0);
                                        setError(null);
                                    }}
                                    className={cn(
                                        "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-bold text-sm",
                                        deliveryType === "recogida" ? "bg-green-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <ChefHat className="w-4 h-4" />
                                    Pasar a Recoger
                                </button>
                            </div>

                            {deliveryType === "entrega" ? (
                                <div className="space-y-4 animate-in slide-in-from-left-4">
                                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                                        <MapPin className="w-6 h-6 text-green-400" />
                                        <div>
                                            <p className="text-white font-medium">Distancia de entrega</p>
                                            <p className="text-sm text-slate-400">
                                                {mealPrepConfig?.delivery?.feeScaling ? (
                                                    `Cargo de $${mealPrepConfig.delivery.feeScaling.amount} por cada ${mealPrepConfig.delivery.feeScaling.perMiles} mi.`
                                                ) : (
                                                    `Gratis hasta ${mealPrepConfig?.delivery?.freeDistanceMiles || DEFAULT_DELIVERY_CONFIG.freeDistanceMiles} mi. Cargo de $${mealPrepConfig?.delivery?.surchargeAmount || DEFAULT_DELIVERY_CONFIG.surchargeAmount} para mayores.`
                                                )}
                                            </p>
                                            {mealPrepConfig?.delivery?.allowedAreas && mealPrepConfig.delivery.allowedAreas.length > 0 && (
                                                <p className="text-xs text-primary-400 font-medium mt-1">
                                                    Solo entregamos en: {mealPrepConfig.delivery.allowedAreas.join(", ")}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                                                Dirección Principal (Calle, Ciudad)
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={address}
                                                    onChange={(e) => setAddress(e.target.value)}
                                                    placeholder="Ej: Calle 10, Santo Domingo..."
                                                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
                                                />
                                                <Button
                                                    onClick={async () => {
                                                        if (!address.trim()) return;
                                                        setIsGeocoding(true);
                                                        setError(null);
                                                        const coords = await geocodeAddress(address);

                                                        // Fallback: If DB coordinates are missing but we have an address, geocode the business address
                                                        let originCoords = businessCoordinates;
                                                        if (!originCoords && businessAddress) {
                                                            const fallbackCoords = await geocodeAddress(businessAddress);
                                                            if (fallbackCoords) {
                                                                originCoords = fallbackCoords;
                                                            }
                                                        }

                                                        if (coords && originCoords) {
                                                            const dist = calculateDistance(originCoords, coords);

                                                            // AREA VALIDATION
                                                            const allowedAreas = mealPrepConfig?.delivery?.allowedAreas;
                                                            if (allowedAreas && allowedAreas.length > 0 && coords.displayName) {
                                                                const normalizedAddress = coords.displayName.toLowerCase();
                                                                const isAllowed = allowedAreas.some(area =>
                                                                    normalizedAddress.includes(area.toLowerCase().trim())
                                                                );

                                                                if (!isAllowed) {
                                                                    setError(`Lo sentimos, no realizamos entregas en esta zona. Áreas permitidas: ${allowedAreas.join(", ")}`);
                                                                    setConfirmedAddressText(null);
                                                                    setIsGeocoding(false);
                                                                    return;
                                                                }
                                                            }

                                                            setDistance(dist);
                                                            setDistanceInput(dist.toString());
                                                            // Use the formatted display name if available for better verification
                                                            setConfirmedAddressText(coords.displayName || address);
                                                        } else if (!originCoords) {
                                                            setError("Error: Ubicación del negocio no configurada.");
                                                            setConfirmedAddressText(null);
                                                        } else {
                                                            setError("No se pudo encontrar la dirección.");
                                                            setConfirmedAddressText(null);
                                                        }
                                                        setIsGeocoding(false);
                                                    }}
                                                    disabled={isGeocoding || !address.trim()}
                                                    className="bg-green-600 hover:bg-green-700"
                                                >
                                                    {isGeocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                                                Detalles Adicionales (Apto, Piso, Oficina)
                                            </label>
                                            <input
                                                type="text"
                                                value={addressDetails}
                                                onChange={(e) => setAddressDetails(e.target.value)}
                                                placeholder="Ej: Apto 4B, 2do Piso, Res. Las Palmas"
                                                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-green-500/50"
                                            />
                                        </div>

                                        <Button
                                            variant="outline"
                                            onClick={async () => {
                                                setIsLocating(true);
                                                setError(null);
                                                try {
                                                    let originCoords = businessCoordinates;
                                                    if (!originCoords && businessAddress) {
                                                        const fallbackCoords = await geocodeAddress(businessAddress);
                                                        if (fallbackCoords) {
                                                            originCoords = fallbackCoords;
                                                        }
                                                    }

                                                    if (!originCoords) {
                                                        throw new Error("La ubicación del negocio no está configurada.");
                                                    }
                                                    const coords = await getCurrentLocation();
                                                    const dist = calculateDistance(originCoords, coords);

                                                    // REVERSE GEOCODE FOR AREA VALIDATION
                                                    const addressName = await reverseGeocode(coords);
                                                    const allowedAreas = mealPrepConfig?.delivery?.allowedAreas;

                                                    if (allowedAreas && allowedAreas.length > 0 && addressName) {
                                                        const normalizedAddress = addressName.toLowerCase();
                                                        const isAllowed = allowedAreas.some(area =>
                                                            normalizedAddress.includes(area.toLowerCase().trim())
                                                        );

                                                        if (!isAllowed) {
                                                            setError(`Lo sentimos, no realizamos entregas en esta zona. Áreas permitidas: ${allowedAreas.join(", ")}`);
                                                            setConfirmedAddressText(null);
                                                            setIsLocating(false);
                                                            return;
                                                        }
                                                    }

                                                    setDistance(dist);
                                                    setDistanceInput(dist.toString());
                                                    setConfirmedAddressText(addressName || "Ubicación actual detectada");
                                                } catch (err: any) {
                                                    setError(err.message || "Error al obtener ubicación");
                                                    setConfirmedAddressText(null);
                                                } finally {
                                                    setIsLocating(false);
                                                }
                                            }}
                                            disabled={isLocating}
                                            className="w-full border-white/10 text-slate-300 bg-white/5 hover:bg-white/10 h-11"
                                        >
                                            {isLocating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Navigation className="w-4 h-4 mr-2 text-green-500" />}
                                            Usar mi ubicación actual
                                        </Button>

                                        {confirmedAddressText && (
                                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-2 animate-in slide-in-from-top-2">
                                                <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-tight">Ubicación Confirmada</p>
                                                    <p className="text-sm text-white line-clamp-2">{confirmedAddressText}</p>
                                                </div>
                                            </div>
                                        )}

                                        {distance !== undefined && (
                                            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center animate-in zoom-in-95">
                                                <p className="text-green-400 font-bold">
                                                    Distancia: {distance} millas
                                                </p>
                                                {(() => {
                                                    const deliveryConfig = mealPrepConfig?.delivery || DEFAULT_DELIVERY_CONFIG;
                                                    let fee = 0;
                                                    if (deliveryConfig.feeScaling) {
                                                        fee = Math.floor(distance / deliveryConfig.feeScaling.perMiles) * deliveryConfig.feeScaling.amount;
                                                    } else {
                                                        fee = distance > deliveryConfig.freeDistanceMiles ? deliveryConfig.surchargeAmount : 0;
                                                    }

                                                    if (fee > 0) {
                                                        return (
                                                            <p className="text-xs text-amber-300 mt-1">
                                                                Cargo de ${fee} aplicado.
                                                            </p>
                                                        );
                                                    }
                                                    return (
                                                        <p className="text-xs text-green-300 mt-1">
                                                            ¡Entrega GRATIS!
                                                        </p>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in slide-in-from-right-4">
                                    <div className="p-6 rounded-2xl bg-green-500/5 border border-green-500/20 text-center space-y-4">
                                        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto border-2 border-green-500/30">
                                            <ChefHat className="w-8 h-8 text-green-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-lg">Recogida en Local</h4>
                                            <p className="text-sm text-slate-400 mt-2">
                                                Podrás pasar por tu pedido una vez esté listo. ¡Sin cargos de envío!
                                            </p>
                                        </div>

                                        {businessAddress && (
                                            <div className="pt-4 border-t border-white/10">
                                                <p className="text-xs font-bold text-green-500 uppercase tracking-widest mb-1">Nuestra Dirección</p>
                                                <p className="text-sm text-white font-medium">{businessAddress}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Schedule Selection */}
                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="w-5 h-5 text-green-400" />
                                    <h4 className="text-white font-bold text-sm">Programar Entrega / Recogida</h4>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Días disponibles próximos
                                    </label>
                                    <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                        {availableDates.length > 0 ? (
                                            availableDates.map((d) => (
                                                <button
                                                    key={d.date}
                                                    type="button"
                                                    onClick={() => {
                                                        setDeliveryDate(d.date);
                                                        setDeliveryTime(d.window);
                                                    }}
                                                    className={cn(
                                                        "p-3 rounded-xl border-2 transition-all text-left flex justify-between items-center group",
                                                        deliveryDate === d.date
                                                            ? "border-green-500 bg-green-500/20"
                                                            : "border-white/10 bg-white/5 hover:border-white/20"
                                                    )}
                                                >
                                                    <div>
                                                        <div className="font-bold text-white text-sm capitalize">{d.label}</div>
                                                        <div className="text-[10px] text-slate-400">Haz clic para seleccionar</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs font-bold text-green-400">{d.window}</div>
                                                        {deliveryDate === d.date && <Check className="w-4 h-4 text-green-400 inline ml-1" />}
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                                                <p className="text-xs text-amber-300">No hay horarios de entrega configurados actualmente.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <p className="text-xs text-red-400 p-3 bg-red-400/10 rounded-xl border border-red-400/20">
                                    {error}
                                </p>
                            )}

                            <div className="flex gap-3 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep("training")}
                                    className="flex-1 border-white/20 text-slate-300"
                                >
                                    Volver
                                </Button>
                                <Button
                                    onClick={() => setStep("info")}
                                    disabled={(deliveryType === "entrega" && (distance === undefined || !deliveryDate)) || (deliveryType === "recogida" && !deliveryDate)}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold h-12"
                                >
                                    Continuar
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step INFO: Customer Info */}
                    {step === "info" && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                            <h3 className="text-lg font-bold text-white mb-2">Tus Datos de Contacto</h3>
                            <p className="text-sm text-slate-400">Necesitamos estos datos para procesar tu pedido y contactarte.</p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Nombre Completo</label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Ej: Juan Pérez"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">Correo Electrónico</label>
                                    <input
                                        type="email"
                                        value={customerEmail}
                                        onChange={(e) => setCustomerEmail(e.target.value)}
                                        placeholder="Ej: correo@ejemplo.com"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300">WhatsApp (10 dígitos)</label>
                                    <input
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="Ej: 8097654321"
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-green-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-white/10">
                                <Button
                                    variant="outline"
                                    onClick={() => setStep("delivery")}
                                    className="flex-1 border-white/20 text-slate-300"
                                >
                                    Volver
                                </Button>
                                <Button
                                    onClick={() => setStep("summary")}
                                    disabled={!customerName || !customerEmail || customerPhone.length < 10}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                >
                                    Ver Resumen
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Summary */}
                    {step === "summary" && (
                        <div className="space-y-4">
                            {/* Plates summary */}
                            <div className="space-y-2">
                                {plates.map((plate, index) => {
                                    const platePrice = plate.isCustom ? MEAL_PREP_PRICES.CUSTOM_PLATE : MEAL_PREP_PRICES.STANDARD_PLATE;
                                    return (
                                        <div
                                            key={index}
                                            className="p-3 rounded-lg bg-white/5 border border-white/10"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-white font-medium flex items-center gap-2">
                                                        Plato {index + 1}
                                                        {plate.isCustom && <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 uppercase">Personalizado</span>}
                                                    </p>
                                                    <p className="text-sm text-slate-400">
                                                        {formatPlateDescription(plate)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-green-400 font-medium">${platePrice}</p>
                                                    {plate.premiumSurcharge ? (
                                                        <p className="text-xs text-amber-400">+${plate.premiumSurcharge}</p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pricing breakdown */}
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 space-y-2">
                                <div className="flex justify-between text-slate-300 text-sm">
                                    <span>Subtotal Platos</span>
                                    <span>${pricing.basePrice}</span>
                                </div>
                                {pricing.premiumTotal > 0 && (
                                    <div className="flex justify-between text-amber-400 text-sm">
                                        <span>Proteinas Premium</span>
                                        <span>+${pricing.premiumTotal}</span>
                                    </div>
                                )}
                                {pricing.extrasTotal > 0 && (
                                    <div className="flex justify-between text-blue-400 text-sm">
                                        <span>Extras / Adicionales</span>
                                        <span>+${pricing.extrasTotal}</span>
                                    </div>
                                )}
                                {selectedTrainingPlan && (
                                    <div className="flex justify-between text-green-400 text-sm">
                                        <span>Plan: {selectedTrainingPlan.label}</span>
                                        <span>+${pricing.trainingTotal}</span>
                                    </div>
                                )}
                                {pricing.deliverySurcharge > 0 && (
                                    <div className="flex justify-between text-amber-400 text-sm">
                                        <span>Cargo por distancia</span>
                                        <span>+${pricing.deliverySurcharge}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold text-white pt-2 border-t border-white/10">
                                    <span>Total Final</span>
                                    <span className="text-green-400">${pricing.total}</span>
                                </div>
                                {manualPaymentConfig?.requireUpfrontPayment && paymentTiming === "pay_later" && (
                                    <div className="mt-2 pt-2 border-t border-amber-500/20 space-y-1">
                                        <div className="flex justify-between text-sm text-amber-400 font-medium">
                                            <span>Monto a pagar hoy ({manualPaymentConfig.upfrontPaymentPercentage ?? 50}%)</span>
                                            <span>${((pricing.total * (manualPaymentConfig.upfrontPaymentPercentage ?? 50)) / 100).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm text-slate-400">
                                            <span>Restante al recibir</span>
                                            <span>${(pricing.total - (pricing.total * (manualPaymentConfig.upfrontPaymentPercentage ?? 50)) / 100).toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Delivery Summary */}
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                                <div className="flex items-center gap-2 text-white font-bold text-sm">
                                    {deliveryType === "entrega" ? <Truck className="w-4 h-4 text-green-400" /> : <ChefHat className="w-4 h-4 text-green-400" />}
                                    {deliveryType === "entrega" ? "Entrega a Domicilio" : "Recogida en Local"}
                                </div>
                                <p className="text-sm text-slate-400">
                                    {deliveryType === "entrega" ? `${address}${addressDetails ? ` (${addressDetails})` : ""}` : businessAddress || "Dirección del local"}
                                </p>
                            </div>

                            {/* Payment Method Selection */}
                            <div className="space-y-4">
                                <h3 className="font-medium text-white">Método de Pago</h3>

                                {activePaymentMethods.length > 0 ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => setPaymentTiming("pay_later")}
                                                className={cn(
                                                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-sm",
                                                    paymentTiming === "pay_later"
                                                        ? "bg-slate-800 border-slate-700 text-white"
                                                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                                                )}
                                            >
                                                <Store className="w-5 h-5" />
                                                <span>Pago en local</span>
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setPaymentTiming("pay_now");
                                                    if (!selectedPaymentMethod && activePaymentMethods.length > 0) {
                                                        setSelectedPaymentMethod(activePaymentMethods[0]);
                                                    }
                                                }}
                                                className={cn(
                                                    "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-sm",
                                                    paymentTiming === "pay_now"
                                                        ? "bg-green-500/20 border-green-500 text-white"
                                                        : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                                                )}
                                            >
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                <span>Pagar ahora</span>
                                            </button>
                                        </div>

                                        {paymentTiming === "pay_now" && (
                                            <div className="space-y-4 bg-black/20 p-4 rounded-xl border border-white/5">
                                                <div className="grid grid-cols-2 gap-2">
                                                    {activePaymentMethods.map((method) => (
                                                        <button
                                                            key={method.id}
                                                            onClick={() => setSelectedPaymentMethod(method)}
                                                            className={cn(
                                                                "p-3 rounded-xl border text-left cursor-pointer transition-all",
                                                                selectedPaymentMethod?.id === method.id
                                                                    ? "border-green-500 bg-green-500/10 text-white"
                                                                    : "border-white/10 hover:bg-white/5 text-slate-300"
                                                            )}
                                                        >
                                                            <div className="font-medium text-sm">{method.name}</div>
                                                            <div className="text-xs text-slate-500">{MANUAL_PAYMENT_METHOD_LABELS[method.type] || method.type}</div>
                                                        </button>
                                                    ))}
                                                </div>

                                                {selectedPaymentMethod && (
                                                    <div className="bg-white/5 rounded-xl p-4 space-y-3">
                                                        {selectedPaymentMethod.email && (
                                                            <div className="flex justify-between items-center group">
                                                                <div>
                                                                    <div className="text-xs text-slate-400">
                                                                        {selectedPaymentMethod.type === 'zelle' ? 'Correo de Zelle' :
                                                                            selectedPaymentMethod.type === 'paypal_manual' ? 'Correo de PayPal' :
                                                                                selectedPaymentMethod.type === 'apple_pay' ? 'ID de Apple Pay' :
                                                                                    selectedPaymentMethod.type === 'google_pay' ? 'ID de Google Pay' : 'Correo Electrónico'}
                                                                    </div>
                                                                    <div className="text-sm text-white font-medium">{selectedPaymentMethod.email}</div>
                                                                </div>
                                                                <button onClick={() => copyToClipboard(selectedPaymentMethod.email!, 'email')} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg">
                                                                    {copiedField === 'email' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        )}
                                                        {selectedPaymentMethod.accountHolder && (
                                                            <div className="flex justify-between items-center group">
                                                                <div>
                                                                    <div className="text-xs text-slate-400">Titular de la cuenta</div>
                                                                    <div className="text-sm text-white font-medium">{selectedPaymentMethod.accountHolder}</div>
                                                                </div>
                                                                <button onClick={() => copyToClipboard(selectedPaymentMethod.accountHolder!, 'accountHolder')} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg">
                                                                    {copiedField === 'accountHolder' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        )}
                                                        {selectedPaymentMethod.phoneNumber && (
                                                            <div className="flex justify-between items-center group">
                                                                <div>
                                                                    <div className="text-xs text-slate-400">
                                                                        {selectedPaymentMethod.type === 'mobile_payment' ? 'Teléfono (Pago Móvil)' :
                                                                            selectedPaymentMethod.type === 'zelle' ? 'Teléfono (Zelle)' : 'Teléfono / WhatsApp'}
                                                                    </div>
                                                                    <div className="text-sm text-white font-medium">{selectedPaymentMethod.phoneNumber}</div>
                                                                </div>
                                                                <button onClick={() => copyToClipboard(selectedPaymentMethod.phoneNumber!, 'phoneNumber')} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg">
                                                                    {copiedField === 'phoneNumber' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        )}
                                                        {selectedPaymentMethod.accountNumber && (
                                                            <div className="flex justify-between items-center group">
                                                                <div>
                                                                    <div className="text-xs text-slate-400">
                                                                        {selectedPaymentMethod.type === 'mobile_payment' ? 'Teléfono (Pago Móvil)' :
                                                                            selectedPaymentMethod.type === 'bank_transfer' ? 'Número de Cuenta' : 'Número / Teléfono'}
                                                                    </div>
                                                                    <div className="text-sm text-white font-medium">
                                                                        {selectedPaymentMethod.accountNumber}
                                                                        {selectedPaymentMethod.accountType && <span className="ml-2 text-[10px] uppercase opacity-70">({selectedPaymentMethod.accountType})</span>}
                                                                    </div>
                                                                </div>
                                                                <button onClick={() => copyToClipboard(selectedPaymentMethod.accountNumber!, 'accountNumber')} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg">
                                                                    {copiedField === 'accountNumber' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        )}
                                                        {selectedPaymentMethod.bankName && (
                                                            <div className="flex justify-between items-center group">
                                                                <div>
                                                                    <div className="text-xs text-slate-400">Banco / Entidad</div>
                                                                    <div className="text-sm text-white font-medium">{selectedPaymentMethod.bankName}</div>
                                                                </div>
                                                                <button onClick={() => copyToClipboard(selectedPaymentMethod.bankName!, 'bank')} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg">
                                                                    {copiedField === 'bank' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        )}
                                                        {selectedPaymentMethod.identificationNumber && (
                                                            <div className="flex justify-between items-center group">
                                                                <div>
                                                                    <div className="text-xs text-slate-400">Cédula / RIF / ID</div>
                                                                    <div className="text-sm text-white font-medium">{selectedPaymentMethod.identificationNumber}</div>
                                                                </div>
                                                                <button onClick={() => copyToClipboard(selectedPaymentMethod.identificationNumber!, 'id')} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-lg">
                                                                    {copiedField === 'id' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        )}
                                                        {selectedPaymentMethod.instructions && (
                                                            <div className="pt-2 border-t border-white/5 mt-2">
                                                                <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Instrucciones Adicionales</div>
                                                                <div className="text-xs text-slate-300 italic whitespace-pre-wrap">{selectedPaymentMethod.instructions}</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {manualPaymentConfig?.requiresReceipt && (
                                                    <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                                                        <label className="block text-sm font-medium text-slate-300">
                                                            Sube tu comprobante de pago
                                                        </label>
                                                        <div className="border-2 border-dashed border-white/20 rounded-xl p-6 hover:bg-white/5 transition-colors group cursor-pointer relative text-center">
                                                            <input
                                                                type="file"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        setReceiptFile(file);
                                                                        if (file.type.startsWith("image/")) {
                                                                            const reader = new FileReader();
                                                                            reader.onload = (e) => setReceiptPreview(e.target?.result as string);
                                                                            reader.readAsDataURL(file);
                                                                        } else {
                                                                            setReceiptPreview(null);
                                                                        }
                                                                    }
                                                                }}
                                                                accept="image/*,.pdf"
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            />
                                                            {receiptPreview ? (
                                                                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/50">
                                                                    <img src={receiptPreview} alt="Comprobante" className="w-full h-full object-contain" />
                                                                </div>
                                                            ) : receiptFile ? (
                                                                <div className="flex items-center justify-center gap-3 text-white">
                                                                    <FileText className="w-8 h-8 text-primary" />
                                                                    <div className="text-left">
                                                                        <div className="text-sm font-medium">{receiptFile.name}</div>
                                                                        <div className="text-xs text-slate-400">Subido</div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col items-center gap-2">
                                                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                                        <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm text-white font-medium">Haz clic para subir comprobante</p>
                                                                        <p className="text-xs text-slate-400">PNG, JPG o PDF</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                                        <p className="text-sm text-slate-400 text-center">
                                            El pago se realizará al momento de entregarte el pedido.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Action buttons */}
                            {orderSuccess ? (
                                <div className="text-center py-4 space-y-4 animate-in zoom-in-95">
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto border-2 border-green-500/50">
                                        <Check className="w-8 h-8 text-green-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">¡Pedido Confirmado!</h3>
                                        <p className="text-slate-400 text-sm mt-1">Registrado como: <span className="text-primary font-bold">{orderSuccess.number}</span></p>
                                    </div>
                                    <p className="text-xs text-slate-400">Te contactaremos vía WhatsApp para confirmar los detalles.</p>
                                    <Button
                                        onClick={() => {
                                            onClose();
                                        }}
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl"
                                    >
                                        Cerrar
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {manualPaymentConfig?.requireUpfrontPayment && paymentTiming === "pay_later" && (
                                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
                                            <p className="text-amber-400 text-sm font-bold">
                                                Pagas ${((pricing.total * (manualPaymentConfig.upfrontPaymentPercentage ?? 50)) / 100).toFixed(2)} ahora ({manualPaymentConfig.upfrontPaymentPercentage ?? 50}%)
                                            </p>
                                            <p className="text-slate-400 text-xs mt-0.5">
                                                + ${(pricing.total - (pricing.total * (manualPaymentConfig.upfrontPaymentPercentage ?? 50)) / 100).toFixed(2)} al recibir tu pedido
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setStep("delivery")}
                                            className="flex-1 border-white/20 text-slate-300"
                                        >
                                            Volver
                                        </Button>
                                        <Button
                                            onClick={() => handleConfirm()}
                                            disabled={isSubmitting}
                                            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold h-12"
                                        >
                                            {isSubmitting ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Truck className="w-4 h-4 mr-2" />
                                                    Confirmar Pedido
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                    {whatsappNumber && (
                                        <p className="text-[10px] text-center text-slate-400">
                                            Al confirmar, recibirás un mensaje automático por WhatsApp con los detalles.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
