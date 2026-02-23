"use client";

import { useState, useEffect } from "react";
import {
    MapPin,
    Navigation,
    Loader2,
    AlertCircle,
    Check,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    calculateDistance,
    calculateDeliveryFee,
    getCurrentLocation,
    geocodeAddress,
    formatDistance,
    type Coordinates,
    type DistanceConfig,
} from "@/lib/utils/distance";

interface DeliveryCalculatorProps {
    businessCoordinates?: Coordinates;
    config: DistanceConfig;
    onDistanceCalculated: (result: {
        distance: number;
        fee: number;
        isWithinServiceArea: boolean;
        customerCoordinates?: Coordinates;
    }) => void;
    className?: string;
}

export function DeliveryCalculator({
    businessCoordinates,
    config,
    onDistanceCalculated,
    className,
}: DeliveryCalculatorProps) {
    const [address, setAddress] = useState("");
    const [isCalculating, setIsCalculating] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [result, setResult] = useState<{
        distance: number;
        fee: number;
        isWithinServiceArea: boolean;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Calculate distance when address changes (with debounce)
    useEffect(() => {
        if (!address || address.length < 5 || !businessCoordinates) return;

        const timer = setTimeout(async () => {
            await calculateFromAddress(address);
        }, 1000); // 1 second debounce

        return () => clearTimeout(timer);
    }, [address]);

    const calculateFromAddress = async (addr: string) => {
        if (!businessCoordinates) {
            setError("La ubicación del negocio no está configurada");
            return;
        }

        setIsCalculating(true);
        setError(null);

        try {
            const customerCoords = await geocodeAddress(addr);

            if (!customerCoords) {
                setError("No se pudo encontrar la dirección. Intenta ser más específico.");
                setResult(null);
                return;
            }

            const distance = calculateDistance(businessCoordinates, customerCoords);
            const feeResult = calculateDeliveryFee(distance, config);

            const newResult = {
                distance,
                fee: feeResult.fee,
                isWithinServiceArea: feeResult.isWithinServiceArea,
            };

            setResult(newResult);
            onDistanceCalculated({
                ...newResult,
                customerCoordinates: customerCoords,
            });

        } catch (err) {
            console.error("Error calculating distance:", err);
            setError("Error al calcular la distancia");
            setResult(null);
        } finally {
            setIsCalculating(false);
        }
    };

    const handleUseCurrentLocation = async () => {
        if (!businessCoordinates) {
            setError("La ubicación del negocio no está configurada");
            return;
        }

        setIsGettingLocation(true);
        setError(null);

        try {
            const customerCoords = await getCurrentLocation();
            const distance = calculateDistance(businessCoordinates, customerCoords);
            const feeResult = calculateDeliveryFee(distance, config);

            const newResult = {
                distance,
                fee: feeResult.fee,
                isWithinServiceArea: feeResult.isWithinServiceArea,
            };

            setResult(newResult);
            setAddress("📍 Ubicación actual");
            onDistanceCalculated({
                ...newResult,
                customerCoordinates: customerCoords,
            });

        } catch (err: any) {
            console.error("Error getting location:", err);
            setError(err.message || "Error al obtener tu ubicación");
            setResult(null);
        } finally {
            setIsGettingLocation(false);
        }
    };

    return (
        <div className={cn("space-y-3", className)}>
            {/* Address Input */}
            <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ingresa tu dirección"
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50"
                />
                {isCalculating && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
                )}
            </div>

            {/* Use Current Location Button */}
            <button
                onClick={handleUseCurrentLocation}
                disabled={isGettingLocation}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            >
                {isGettingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Navigation className="w-4 h-4" />
                )}
                <span>Usar mi ubicación actual</span>
            </button>

            {/* Error Message */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {/* Distance Result */}
            {result && (
                <div className={cn(
                    "p-4 rounded-xl border",
                    result.isWithinServiceArea
                        ? "bg-green-500/10 border-green-500/20"
                        : "bg-red-500/10 border-red-500/20"
                )}>
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {result.isWithinServiceArea ? (
                                    <Check className="w-5 h-5 text-green-400" />
                                ) : (
                                    <X className="w-5 h-5 text-red-400" />
                                )}
                                <span className={cn(
                                    "font-medium",
                                    result.isWithinServiceArea ? "text-green-400" : "text-red-400"
                                )}>
                                    {result.isWithinServiceArea
                                        ? "¡Hacemos entregas a tu zona!"
                                        : "Fuera de zona de servicio"}
                                </span>
                            </div>
                            <p className="text-sm text-slate-400">
                                Distancia: {formatDistance(result.distance)}
                            </p>
                        </div>

                        {result.isWithinServiceArea && (
                            <div className="text-right">
                                {result.fee > 0 ? (
                                    <>
                                        <p className="text-lg font-bold text-white">
                                            +${result.fee.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Cargo por distancia
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-lg font-bold text-green-400">
                                            Gratis
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            Entrega incluida
                                        </p>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Distance breakdown */}
                    {result.isWithinServiceArea && result.distance > config.baseDistanceMiles && (
                        <div className="mt-3 pt-3 border-t border-white/10 text-xs text-slate-400">
                            <p>
                                Primeras {config.baseDistanceMiles} millas incluidas ·{" "}
                                {formatDistance(result.distance - config.baseDistanceMiles)} extra a ${config.extraMileFee}/milla
                            </p>
                        </div>
                    )}

                    {!result.isWithinServiceArea && config.maxDistanceMiles && (
                        <p className="mt-2 text-sm text-slate-400">
                            Área de servicio máxima: {config.maxDistanceMiles} millas
                        </p>
                    )}
                </div>
            )}

            {/* Info text */}
            {!result && !error && (
                <p className="text-xs text-slate-500 text-center">
                    Primeras {config.baseDistanceMiles} millas incluidas ·{" "}
                    ${config.extraMileFee}/milla adicional
                    {config.maxDistanceMiles && ` · Máximo ${config.maxDistanceMiles} millas`}
                </p>
            )}
        </div>
    );
}
