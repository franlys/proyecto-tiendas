"use client";

import { useState, useEffect } from "react";
import { MapPin, Loader2, Navigation, Store, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Branch } from "@/lib/types/branch.types";

// ─── Haversine distance ───────────────────────────────────────────────────────
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

interface BranchSelectorProps {
  shopId: string;
  value: Branch | null;
  onChange: (branch: Branch) => void;
  className?: string;
}

export function BranchSelector({ shopId, value, onChange, className }: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [detected, setDetected] = useState(false);

  // Load active branches
  useEffect(() => {
    if (!shopId) return;
    fetch(`/api/branches?shopId=${shopId}&active=true`)
      .then((r) => r.json())
      .then((d) => {
        const list: Branch[] = d.branches || [];
        setBranches(list);

        // Auto-select main branch if no selection yet
        if (!value && list.length > 0) {
          const main = list.find((b) => b.isMain) || list[0];
          onChange(main);
        }
      })
      .finally(() => setIsLoading(false));
  }, [shopId]);

  // Auto-detect nearest on mount
  useEffect(() => {
    if (branches.length === 0 || detected) return;
    if (!navigator.geolocation) return;

    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        selectNearest(coords, branches);
        setDetected(true);
        setIsDetecting(false);
      },
      () => setIsDetecting(false),
      { timeout: 5000 }
    );
  }, [branches]);

  const selectNearest = (coords: { lat: number; lng: number }, list: Branch[]) => {
    const withCoords = list.filter((b) => b.coordinates);
    if (withCoords.length === 0) return;

    const sorted = [...withCoords].sort(
      (a, b) =>
        distanceKm(coords, a.coordinates!) - distanceKm(coords, b.coordinates!)
    );
    onChange(sorted[0]);
  };

  const handleDetect = () => {
    if (!navigator.geolocation) return;
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        selectNearest(coords, branches);
        setIsDetecting(false);
      },
      () => setIsDetecting(false),
      { timeout: 8000 }
    );
  };

  // Don't render if only one branch
  if (!isLoading && branches.length <= 1) return null;

  const sortedBranches = userCoords
    ? [...branches].sort((a, b) => {
        if (!a.coordinates) return 1;
        if (!b.coordinates) return -1;
        return distanceKm(userCoords, a.coordinates) - distanceKm(userCoords, b.coordinates);
      })
    : [...branches].sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0));

  return (
    <div className={cn("relative", className)}>
      <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
        <Store className="w-4 h-4" />
        Sucursal
        {isDetecting && <Loader2 className="w-3 h-3 animate-spin text-slate-400" />}
      </label>

      {/* Selector button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:border-white/20 transition-colors text-sm"
      >
        {isLoading ? (
          <span className="text-slate-400 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando sucursales...
          </span>
        ) : value ? (
          <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Store className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{value.name}</p>
              <p className="text-xs text-slate-400 truncate">{value.address}</p>
            </div>
            {userCoords && value.coordinates && (
              <span className="text-xs text-slate-500 shrink-0">
                {formatDistance(distanceKm(userCoords, value.coordinates))}
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400">Selecciona una sucursal</span>
        )}
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform shrink-0", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 glass-panel rounded-xl border border-white/10 overflow-hidden shadow-2xl">
          {/* Detect location button */}
          <button
            type="button"
            onClick={() => { handleDetect(); setIsOpen(false); }}
            disabled={isDetecting}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-primary hover:bg-primary/10 transition-colors border-b border-white/10"
          >
            {isDetecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            Detectar la más cercana
          </button>

          {sortedBranches.map((branch) => {
            const dist = userCoords && branch.coordinates
              ? distanceKm(userCoords, branch.coordinates)
              : null;
            const isSelected = value?.id === branch.id;

            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => { onChange(branch); setIsOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                  isSelected ? "bg-primary/10" : "hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  isSelected ? "bg-primary/20" : "bg-white/5"
                )}>
                  <Store className={cn("w-4 h-4", isSelected ? "text-primary" : "text-slate-400")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-white")}>{branch.name}</p>
                  <p className="text-xs text-slate-400 truncate">{branch.address}</p>
                </div>
                {dist !== null && (
                  <span className="text-xs text-slate-500 shrink-0">{formatDistance(dist)}</span>
                )}
                {branch.isMain && !userCoords && (
                  <span className="text-xs text-slate-500 shrink-0">Principal</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
