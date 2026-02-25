"use client";

import { useState, useEffect } from "react";
import { useAuth, ShopsProvider, useShops } from "@/components/shared";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, getDocs, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import {
    TrainingPackage,
    SessionFrequency,
    SessionDuration,
    PackageBillingCycle,
    FREQUENCY_LABELS,
    DURATION_LABELS,
    BILLING_CYCLE_LABELS,
    DEFAULT_TRAINING_PACKAGES,
} from "@/lib/types/training-package.types";
import { Coordinates, geocodeAddress, getCurrentLocation } from "@/lib/utils/distance";
import {
    ArrowLeft,
    Plus,
    Trash2,
    Edit3,
    Check,
    Loader2,
    Store,
    ChevronDown,
    MapPin,
    Navigation,
    Dumbbell,
    Clock,
    DollarSign,
    Calendar,
    Users,
    AlertCircle,
    X,
    Package,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ============================================
// SHOP COORDINATES CONFIG
// ============================================
interface ShopCoordinatesProps {
    shopId: string;
}

function ShopCoordinatesConfig({ shopId: inputId }: ShopCoordinatesProps) {
    const { resolveShopId } = useShops();
    const shopId = resolveShopId(inputId);

    const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
    const [address, setAddress] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (shopId) loadCoordinates();
    }, [shopId]);

    async function loadCoordinates() {
        setIsLoading(true);
        try {
            const docRef = doc(db, "shops", shopId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.coordinates) {
                    setCoordinates(data.coordinates);
                }
                if (data.businessAddress) {
                    setAddress(data.businessAddress);
                }
            }
        } catch (err) {
            console.error("Error loading coordinates:", err);
        } finally {
            setIsLoading(false);
        }
    }

    async function saveCoordinates(coords: Coordinates, addr?: string) {
        setIsSaving(true);
        setError(null);
        try {
            const docRef = doc(db, "shops", shopId);
            // Replaced updateDoc with setDoc(..., { merge: true }) for robustness
            await setDoc(docRef, {
                coordinates: coords,
                ...(addr && { businessAddress: addr }),
                updatedAt: new Date().toISOString()
            }, { merge: true });

            setCoordinates(coords);
            if (addr) setAddress(addr);
            alert("¡Ubicación guardada correctamente!");
        } catch (err) {
            console.error("Error saving coordinates:", err);
            setError("Error al guardar las coordenadas");
        } finally {
            setIsSaving(false);
        }
    }

    const handleGeocodeAddress = async () => {
        if (!address.trim()) return;
        setIsGeocoding(true);
        setError(null);
        try {
            const coords = await geocodeAddress(address);
            if (coords) {
                await saveCoordinates(coords, address);
            } else {
                setError("No se pudo encontrar la dirección");
            }
        } catch (err) {
            setError("Error al buscar la dirección");
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleUseCurrentLocation = async () => {
        setIsGettingLocation(true);
        setError(null);
        try {
            const coords = await getCurrentLocation();
            await saveCoordinates(coords);
        } catch (err: any) {
            setError(err.message || "Error al obtener ubicación");
        } finally {
            setIsGettingLocation(false);
        }
    };

    if (isLoading) {
        return (
            <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
                <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
            </div>
        );
    }

    return (
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl space-y-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-white font-medium">Ubicación del Negocio</h3>
                    <p className="text-sm text-zinc-400">
                        Necesario para calcular distancias de entrega
                    </p>
                </div>
            </div>

            {/* Current coordinates display */}
            {coordinates && (
                <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-emerald-400">
                        Coordenadas: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                    </span>
                </div>
            )}

            {/* Address input */}
            <div className="space-y-2">
                <label className="text-sm text-zinc-400">Dirección del negocio</label>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ej: Av. Principal #123, Colonia Centro, Ciudad"
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
                    />
                    <button
                        onClick={handleGeocodeAddress}
                        disabled={isGeocoding || !address.trim()}
                        className="px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                        {isGeocoding ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <MapPin className="w-4 h-4" />
                        )}
                        Buscar
                    </button>
                </div>
            </div>

            {/* Use current location */}
            <button
                onClick={handleUseCurrentLocation}
                disabled={isGettingLocation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 transition-colors"
            >
                {isGettingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Navigation className="w-4 h-4" />
                )}
                Usar mi ubicación actual
            </button>

            {/* Manual coordinates input */}
            <div className="pt-4 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 mb-2">O ingresa las coordenadas manualmente:</p>
                <div className="flex gap-2">
                    <input
                        type="number"
                        step="0.000001"
                        placeholder="Latitud"
                        value={coordinates?.lat || ""}
                        onChange={(e) =>
                            setCoordinates((prev) => ({
                                lat: parseFloat(e.target.value) || 0,
                                lng: prev?.lng || 0,
                            }))
                        }
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                    <input
                        type="number"
                        step="0.000001"
                        placeholder="Longitud"
                        value={coordinates?.lng || ""}
                        onChange={(e) =>
                            setCoordinates((prev) => ({
                                lat: prev?.lat || 0,
                                lng: parseFloat(e.target.value) || 0,
                            }))
                        }
                        className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                    <button
                        onClick={() => coordinates && saveCoordinates(coordinates)}
                        disabled={!coordinates?.lat || !coordinates?.lng || isSaving}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar"}
                    </button>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}
        </div>
    );
}

// ============================================
// PACKAGE EDITOR MODAL
// ============================================
interface PackageEditorProps {
    package_?: TrainingPackage;
    onSave: (pkg: Omit<TrainingPackage, "id" | "createdAt" | "updatedAt">) => void;
    onClose: () => void;
    isSaving?: boolean;
}

function PackageEditor({ package_, onSave, onClose, isSaving = false }: PackageEditorProps) {
    const [name, setName] = useState(package_?.name || "");
    const [description, setDescription] = useState(package_?.description || "");
    const [sessionsPerWeek, setSessionsPerWeek] = useState<SessionFrequency>(package_?.sessionsPerWeek || 2);
    const [sessionDuration, setSessionDuration] = useState<SessionDuration>(package_?.sessionDuration || 60);
    const [price, setPrice] = useState(package_?.price || 2500);
    const [billingCycle, setBillingCycle] = useState<PackageBillingCycle>(package_?.billingCycle || "monthly");
    const [includes, setIncludes] = useState<string[]>(package_?.includes || [""]);
    const [locationType, setLocationType] = useState<"in_person" | "online" | "both">(package_?.locationType || "both");
    const [maxDistanceMiles, setMaxDistanceMiles] = useState(package_?.maxDistanceMiles || 10);
    const [extraMileFee, setExtraMileFee] = useState(package_?.extraMileFee || 50);
    const [isActive, setIsActive] = useState(package_?.isActive ?? true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            description,
            sessionsPerWeek,
            sessionDuration,
            price,
            billingCycle,
            includes: includes.filter((i) => i.trim()),
            locationType,
            maxDistanceMiles: locationType !== "online" ? maxDistanceMiles : undefined,
            extraMileFee: locationType !== "online" ? extraMileFee : undefined,
            isActive,
            sortOrder: package_?.sortOrder || 0,
        });
    };

    const addIncludeItem = () => setIncludes([...includes, ""]);
    const removeIncludeItem = (index: number) => setIncludes(includes.filter((_, i) => i !== index));
    const updateIncludeItem = (index: number, value: string) => {
        const updated = [...includes];
        updated[index] = value;
        setIncludes(updated);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-zinc-900 rounded-2xl border border-zinc-800"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                        <h2 className="text-xl font-bold text-white">
                            {package_ ? "Editar Paquete" : "Nuevo Paquete"}
                        </h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form Content */}
                    <div className="p-6 space-y-6">
                        {/* Basic Info */}
                        <div className="grid gap-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Nombre del paquete</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="Ej: Plan Premium"
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Descripción</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Breve descripción del paquete"
                                    rows={2}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary outline-none resize-none"
                                />
                            </div>
                        </div>

                        {/* Sessions Config */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Sesiones por semana</label>
                                <select
                                    value={sessionsPerWeek}
                                    onChange={(e) => setSessionsPerWeek(parseInt(e.target.value) as SessionFrequency)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
                                >
                                    {([1, 2, 3, 4, 5, 6, 7] as SessionFrequency[]).map((freq) => (
                                        <option key={freq} value={freq}>
                                            {FREQUENCY_LABELS[freq]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Duración por sesión</label>
                                <select
                                    value={sessionDuration}
                                    onChange={(e) => setSessionDuration(parseInt(e.target.value) as SessionDuration)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
                                >
                                    {([30, 45, 60, 90, 120] as SessionDuration[]).map((dur) => (
                                        <option key={dur} value={dur}>
                                            {DURATION_LABELS[dur]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Precio</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                                        required
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm text-zinc-400 mb-1">Ciclo de facturación</label>
                                <select
                                    value={billingCycle}
                                    onChange={(e) => setBillingCycle(e.target.value as PackageBillingCycle)}
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
                                >
                                    {(Object.entries(BILLING_CYCLE_LABELS) as [PackageBillingCycle, string][]).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>
                        </div>

                        {/* Location Type */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">Tipo de sesión</label>
                            <div className="flex gap-2">
                                {[
                                    { value: "in_person", label: "Presencial" },
                                    { value: "online", label: "En línea" },
                                    { value: "both", label: "Ambos" },
                                ].map(({ value, label }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setLocationType(value as typeof locationType)}
                                        className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${locationType === value
                                            ? "bg-primary/20 border-primary text-primary"
                                            : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Distance Config (only for in-person) */}
                        {locationType !== "online" && (
                            <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">
                                        Millas incluidas
                                    </label>
                                    <input
                                        type="number"
                                        value={maxDistanceMiles}
                                        onChange={(e) => setMaxDistanceMiles(parseFloat(e.target.value) || 0)}
                                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-zinc-400 mb-1">
                                        Cargo por milla extra
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                        <input
                                            type="number"
                                            value={extraMileFee}
                                            onChange={(e) => setExtraMileFee(parseFloat(e.target.value) || 0)}
                                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-primary outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Includes */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">
                                ¿Qué incluye este paquete?
                            </label>
                            <div className="space-y-2">
                                {includes.map((item, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={item}
                                            onChange={(e) => updateIncludeItem(index, e.target.value)}
                                            placeholder="Ej: Rutina personalizada"
                                            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary outline-none"
                                        />
                                        {includes.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeIncludeItem(index)}
                                                className="p-2 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addIncludeItem}
                                    className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Agregar otro
                                </button>
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg">
                            <div>
                                <p className="text-white font-medium">Paquete activo</p>
                                <p className="text-sm text-zinc-400">
                                    Los clientes pueden ver y contratar este paquete
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsActive(!isActive)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${isActive ? "bg-emerald-500" : "bg-zinc-700"
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${isActive ? "left-7" : "left-1"
                                        }`}
                                />
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 p-6 border-t border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isSaving}
                            className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 disabled:bg-zinc-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSaving ? "Guardando..." : (package_ ? "Guardar Cambios" : "Crear Paquete")}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// ============================================
// PACKAGE CARD
// ============================================
interface PackageCardProps {
    package_: TrainingPackage;
    onEdit: () => void;
    onDelete: () => void;
    onToggleActive: () => void;
}

function PackageCard({ package_, onEdit, onDelete, onToggleActive }: PackageCardProps) {
    return (
        <motion.div
            layout
            className={`bg-zinc-900 border rounded-xl overflow-hidden ${package_.isActive ? "border-zinc-800" : "border-zinc-800/50 opacity-60"
                }`}
        >
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white">{package_.name}</h3>
                            {!package_.isActive && (
                                <span className="px-2 py-0.5 bg-zinc-700 text-zinc-400 text-xs rounded-full">
                                    Inactivo
                                </span>
                            )}
                        </div>
                        {package_.description && (
                            <p className="text-sm text-zinc-400">{package_.description}</p>
                        )}
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                            ${package_.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-zinc-500">
                            {BILLING_CYCLE_LABELS[package_.billingCycle]}
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        <span>{FREQUENCY_LABELS[package_.sessionsPerWeek]}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>{DURATION_LABELS[package_.sessionDuration]}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                        <span>
                            {package_.locationType === "both"
                                ? "Ambos"
                                : package_.locationType === "online"
                                    ? "En línea"
                                    : "Presencial"}
                        </span>
                    </div>
                </div>

                {/* Includes */}
                {package_.includes.length > 0 && (
                    <div className="space-y-1 mb-4">
                        {package_.includes.slice(0, 3).map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span className="text-zinc-300">{item}</span>
                            </div>
                        ))}
                        {package_.includes.length > 3 && (
                            <p className="text-xs text-zinc-500 pl-6">
                                +{package_.includes.length - 3} más
                            </p>
                        )}
                    </div>
                )}

                {/* Distance info */}
                {package_.locationType !== "online" && package_.maxDistanceMiles && (
                    <div className="text-xs text-zinc-500 mb-4 p-2 bg-zinc-800/50 rounded-lg">
                        {package_.maxDistanceMiles} millas incluidas
                        {package_.extraMileFee ? ` · $${package_.extraMileFee}/milla extra` : ""}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-zinc-800">
                    <button
                        onClick={onToggleActive}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${package_.isActive
                            ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            }`}
                    >
                        {package_.isActive ? "Desactivar" : "Activar"}
                    </button>
                    <div className="flex-1" />
                    <button
                        onClick={onEdit}
                        className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                        <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================
// MAIN CONTENT
// ============================================
function TrainingPackagesContent({ shopId: inputId }: { shopId: string }) {
    const { resolveShopId } = useShops();
    const shopId = resolveShopId(inputId);

    const [packages, setPackages] = useState<TrainingPackage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingPackage, setEditingPackage] = useState<TrainingPackage | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (shopId) loadPackages();
    }, [shopId]);

    async function loadPackages() {
        setIsLoading(true);
        try {
            const colRef = collection(db, "shops", shopId, "training-packages");
            const snapshot = await getDocs(colRef);
            const pkgs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as TrainingPackage[];
            pkgs.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            setPackages(pkgs);
        } catch (err) {
            console.error("Error loading packages:", err);
        } finally {
            setIsLoading(false);
        }
    }

    async function handleSavePackage(pkgData: Omit<TrainingPackage, "id" | "createdAt" | "updatedAt">) {
        setIsSaving(true);
        try {
            const now = new Date().toISOString();

            // Clean undefined values for Firestore
            const cleanData = Object.entries(pkgData).reduce((acc, [key, value]) => {
                if (value !== undefined) acc[key] = value;
                return acc;
            }, {} as any);

            if (editingPackage) {
                // Update existing
                const docRef = doc(db, "shops", shopId, "training-packages", editingPackage.id);
                await updateDoc(docRef, {
                    ...cleanData,
                    updatedAt: now,
                });
            } else {
                // Create new
                const colRef = collection(db, "shops", shopId, "training-packages");
                await addDoc(colRef, {
                    ...cleanData,
                    createdAt: now,
                    updatedAt: now,
                });
            }

            await loadPackages();
            setEditingPackage(null);
            setIsCreating(false);
            alert("¡Paquete guardado correctamente!");
        } catch (err) {
            console.error("Error saving package:", err);
            alert("Error al guardar el paquete. Por favor, intenta de nuevo.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeletePackage(pkgId: string) {
        if (!confirm("¿Eliminar este paquete? Esta acción no se puede deshacer.")) return;

        try {
            const docRef = doc(db, "shops", shopId, "training-packages", pkgId);
            await deleteDoc(docRef);
            await loadPackages();
        } catch (err) {
            console.error("Error deleting package:", err);
        }
    }

    async function handleToggleActive(pkg: TrainingPackage) {
        try {
            const docRef = doc(db, "shops", shopId, "training-packages", pkg.id);
            await updateDoc(docRef, {
                isActive: !pkg.isActive,
                updatedAt: new Date().toISOString(),
            });
            await loadPackages();
        } catch (err) {
            console.error("Error toggling package:", err);
        }
    }

    async function handleLoadDefaults() {
        if (!confirm("¿Cargar los paquetes predeterminados? Esto agregará 3 paquetes de ejemplo.")) return;

        try {
            const now = new Date().toISOString();
            const colRef = collection(db, "shops", shopId, "training-packages");

            for (const pkg of DEFAULT_TRAINING_PACKAGES) {
                // Clean undefined values
                const cleanPkg = Object.entries(pkg).reduce((acc, [key, value]) => {
                    if (value !== undefined) acc[key] = value;
                    return acc;
                }, {} as any);

                await addDoc(colRef, {
                    ...cleanPkg,
                    createdAt: now,
                    updatedAt: now,
                });
            }

            await loadPackages();
        } catch (err) {
            console.error("Error loading defaults:", err);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin"
                    className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">Paquetes de Entrenamiento</h1>
                    <p className="text-zinc-400 text-sm">
                        Configura los planes y precios para tus clientes
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Paquete
                </button>
            </div>

            {/* Shop Coordinates */}
            <div className="mb-8">
                <ShopCoordinatesConfig shopId={shopId} />
            </div>

            {/* Packages Grid */}
            {packages.length === 0 ? (
                <div className="text-center py-16 bg-zinc-900 rounded-xl border border-zinc-800">
                    <Dumbbell className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-white mb-2">Sin paquetes</h2>
                    <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                        Aún no tienes paquetes de entrenamiento. Crea uno nuevo o carga los paquetes predeterminados.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={handleLoadDefaults}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                        >
                            <Zap className="w-4 h-4" />
                            Cargar Predeterminados
                        </button>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Crear Paquete
                        </button>
                    </div>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {packages.map((pkg) => (
                        <PackageCard
                            key={pkg.id}
                            package_={pkg}
                            onEdit={() => setEditingPackage(pkg)}
                            onDelete={() => handleDeletePackage(pkg.id)}
                            onToggleActive={() => handleToggleActive(pkg)}
                        />
                    ))}
                </div>
            )}

            {/* Editor Modal */}
            <AnimatePresence>
                {isCreating && (
                    <PackageEditor
                        onSave={handleSavePackage}
                        onClose={() => setIsCreating(false)}
                        isSaving={isSaving}
                    />
                )}

                {editingPackage && (
                    <PackageEditor
                        package_={editingPackage}
                        onSave={handleSavePackage}
                        onClose={() => setEditingPackage(null)}
                        isSaving={isSaving}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ============================================
// SHOP SELECTOR
// ============================================
function ShopSelector({ onSelect }: { onSelect: (shopId: string) => void }) {
    const { shops, isLoading } = useShops();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        );
    }

    if (shops.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Store className="w-16 h-16 text-zinc-500" />
                <h2 className="text-xl font-bold text-white">No hay tiendas</h2>
                <p className="text-zinc-400 text-center max-w-md">
                    No hay tiendas disponibles.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="text-center">
                <Dumbbell className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Selecciona una Tienda</h2>
                <p className="text-zinc-400 max-w-md">
                    Elige la tienda para gestionar sus paquetes de entrenamiento.
                </p>
            </div>

            <div className="grid gap-3 w-full max-w-lg">
                {shops.map((shop) => (
                    <button
                        key={shop.id}
                        onClick={() => onSelect(shop.slug)}
                        className="flex items-center gap-4 p-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-primary/50 rounded-xl transition-all text-left group"
                    >
                        {shop.logo ? (
                            <img src={shop.logo} alt={shop.name} className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-lg">{shop.name.charAt(0)}</span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium truncate">{shop.name}</h3>
                            <p className="text-sm text-zinc-500 truncate">/{shop.slug}</p>
                        </div>
                        <ChevronDown className="w-5 h-5 text-zinc-500 group-hover:text-primary -rotate-90 transition-all" />
                    </button>
                ))}
            </div>

            <Link
                href="/admin"
                className="text-sm text-zinc-500 hover:text-white flex items-center gap-2 mt-4"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver al Panel
            </Link>
        </div>
    );
}

// ============================================
// PAGE WRAPPER
// ============================================
function TrainingPackagesPageInner() {
    const { user, isSuperAdmin } = useAuth();
    const [selectedShopId, setSelectedShopId] = useState<string | null>(null);

    const shopId = isSuperAdmin ? selectedShopId : user?.shopId || null;

    if (!shopId) {
        if (isSuperAdmin) {
            return (
                <div className="min-h-screen bg-background p-6">
                    <ShopSelector onSelect={setSelectedShopId} />
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Package className="w-16 h-16 text-zinc-500" />
                <h2 className="text-xl font-bold text-white">Error de Configuración</h2>
                <p className="text-zinc-400 text-center max-w-md">
                    Tu cuenta no tiene una tienda asociada. Contacta al administrador.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {isSuperAdmin && selectedShopId && (
                <div className="border-b border-zinc-800 px-6 py-3">
                    <button
                        onClick={() => setSelectedShopId(null)}
                        className="text-sm text-zinc-400 hover:text-white flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Cambiar tienda
                    </button>
                </div>
            )}
            <TrainingPackagesContent shopId={shopId} />
        </div>
    );
}

export default function TrainingPackagesPage() {
    return (
        <ShopsProvider>
            <TrainingPackagesPageInner />
        </ShopsProvider>
    );
}
