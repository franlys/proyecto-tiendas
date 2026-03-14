"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

interface AddressInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

/**
 * Address input with a "Detectar" button.
 * Uses browser Geolocation + Nominatim (OpenStreetMap, no API key) to
 * reverse-geocode the user's current position into a readable street address.
 */
export function AddressInput({ value, onChange, placeholder = "Calle Principal #123, Ciudad", className }: AddressInputProps) {
    const [detecting, setDetecting] = useState(false);
    const [error, setError] = useState("");

    const detect = () => {
        setError("");
        if (!navigator.geolocation) {
            setError("Tu navegador no soporta geolocalización.");
            return;
        }
        setDetecting(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const { latitude: lat, longitude: lon } = pos.coords;
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
                        { headers: { "Accept-Language": "es" } }
                    );
                    const data = await res.json();
                    const a = data.address || {};
                    const parts = [
                        [a.road, a.house_number].filter(Boolean).join(" "),
                        a.suburb || a.neighbourhood,
                        a.city || a.town || a.village || a.county,
                        a.state,
                    ].filter(Boolean);
                    onChange(parts.join(", "));
                } catch {
                    setError("No se pudo obtener la dirección. Escríbela manualmente.");
                } finally {
                    setDetecting(false);
                }
            },
            () => {
                setError("Permiso denegado. Escríbela manualmente.");
                setDetecting(false);
            }
        );
    };

    return (
        <div>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => { onChange(e.target.value); setError(""); }}
                    placeholder={placeholder}
                    className={className ?? "flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors"}
                />
                <button
                    type="button"
                    onClick={detect}
                    disabled={detecting}
                    title="Detectar mi ubicación actual"
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50"
                >
                    {detecting
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <MapPin className="w-4 h-4" />
                    }
                    {detecting ? "Detectando..." : "Detectar"}
                </button>
            </div>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>
    );
}
