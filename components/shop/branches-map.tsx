"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, ExternalLink } from "lucide-react";

interface BranchMapEntry {
  id: string;
  name: string;
  address: string;
  reference?: string;
  phone?: string;
  whatsapp?: string;
  isMain?: boolean;
}

interface BranchesMapProps {
  shopId: string;
  shopName?: string;
  fallbackAddress?: string;
}

// Geocode an address using Nominatim (free, no API key)
async function geocode(address: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "es" } });
    const data = await res.json();
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  } catch { /* silent */ }
  return null;
}

// Load Leaflet from CDN (no npm install needed)
let leafletLoaded = false;
let leafletLoading = false;
const leafletCallbacks: (() => void)[] = [];

function loadLeaflet(cb: () => void) {
  if (leafletLoaded) { cb(); return; }
  leafletCallbacks.push(cb);
  if (leafletLoading) return;
  leafletLoading = true;

  const css = document.createElement("link");
  css.rel = "stylesheet";
  css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
  document.head.appendChild(css);

  const script = document.createElement("script");
  script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
  script.onload = () => {
    leafletLoaded = true;
    leafletCallbacks.forEach(fn => fn());
    leafletCallbacks.length = 0;
  };
  document.head.appendChild(script);
}

export function BranchesMap({ shopId, shopName, fallbackAddress }: BranchesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [branches, setBranches] = useState<BranchMapEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<BranchMapEntry | null>(null);

  // Fetch branches
  useEffect(() => {
    if (!shopId) return;
    fetch(`/api/branches?shopId=${shopId}&active=true`)
      .then(r => r.json())
      .then(d => setBranches(d.branches || []))
      .catch(() => setBranches([]))
      .finally(() => setIsLoading(false));
  }, [shopId]);

  // Init map after branches loaded
  useEffect(() => {
    if (isLoading || !mapRef.current) return;

    const entries = branches.length > 0
      ? branches
      : fallbackAddress
        ? [{ id: "main", name: shopName || "Ubicación", address: fallbackAddress, isMain: true }]
        : [];

    if (entries.length === 0) return;

    loadLeaflet(async () => {
      const L = (window as any).L;
      if (!L || !mapRef.current) return;

      // Destroy existing instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Geocode all branches
      const coords = await Promise.all(entries.map(b => geocode(b.address)));

      // Filter valid
      const points = entries
        .map((b, i) => ({ branch: b, pos: coords[i] }))
        .filter(x => x.pos !== null) as { branch: BranchMapEntry; pos: { lat: number; lon: number } }[];

      if (points.length === 0) return;

      const center = points[0].pos;
      const map = L.map(mapRef.current, {
        center: [center.lat, center.lon],
        zoom: points.length === 1 ? 16 : 13,
        zoomControl: true,
        scrollWheelZoom: false,
      });
      mapInstanceRef.current = map;

      // Dark tiles (CartoDB Dark Matter — free, no API key)
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      // Custom pin icon
      const makeIcon = (isMain: boolean) => L.divIcon({
        className: "",
        html: `
          <div style="
            width:${isMain ? 44 : 36}px;
            height:${isMain ? 44 : 36}px;
            background:${isMain ? "#fff" : "rgba(255,255,255,0.15)"};
            border:2px solid ${isMain ? "#fff" : "rgba(255,255,255,0.4)"};
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            box-shadow:0 0 0 6px ${isMain ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"};
            cursor:pointer;
            transition:transform 0.2s;
          ">
            <svg width="${isMain ? 20 : 16}" height="${isMain ? 20 : 16}" viewBox="0 0 24 24" fill="${isMain ? "#000" : "#fff"}" stroke="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>`,
        iconSize: [isMain ? 44 : 36, isMain ? 44 : 36],
        iconAnchor: [isMain ? 22 : 18, isMain ? 44 : 36],
        popupAnchor: [0, -(isMain ? 48 : 40)],
      });

      points.forEach(({ branch, pos }) => {
        const marker = L.marker([pos.lat, pos.lon], { icon: makeIcon(!!branch.isMain) });
        marker.addTo(map);
        marker.on("click", () => setSelectedBranch(branch));
      });

      // Fit all points
      if (points.length > 1) {
        const group = L.featureGroup(
          points.map(({ pos }) => L.marker([pos.lat, pos.lon]))
        );
        map.fitBounds(group.getBounds().pad(0.3));
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isLoading, branches, fallbackAddress, shopName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 rounded-2xl bg-white/3 border border-white/8">
        <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10" style={{ height: 320 }}>
        <div ref={mapRef} className="w-full h-full" />
        {/* Overlay gradient edges */}
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
      </div>

      {/* Branch cards */}
      {(branches.length > 0 ? branches : fallbackAddress ? [{ id: "main", name: shopName || "", address: fallbackAddress, isMain: true }] : []).map((b, i) => (
        <button
          key={b.id}
          onClick={() => setSelectedBranch(selectedBranch?.id === b.id ? null : b)}
          className="branch-btn w-full text-left p-4 bg-white/3 border border-white/8 rounded-2xl group outline-none"
          style={{
            animation: "fadeUp 280ms cubic-bezier(0.23,1,0.32,1) both",
            animationDelay: `${i * 60}ms`,
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-white/50" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white">{b.name}</p>
                {b.isMain && (
                  <span className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] font-bold text-white/50 uppercase tracking-wider">Principal</span>
                )}
              </div>
              <p className="text-[11px] text-white/40 mt-0.5 truncate">{b.address}</p>
              {b.reference && (
                <p className="text-[11px] text-white/30 mt-0.5 truncate">{b.reference}</p>
              )}
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="map-ext-link flex-shrink-0 p-1.5 rounded-lg text-white/20 outline-none"
              style={{ transition: "color 150ms ease, background 150ms ease" }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Expanded info — animates in */}
          {selectedBranch?.id === b.id && b.whatsapp && (
            <div
              className="mt-3 pt-3 border-t border-white/8 flex gap-2"
              style={{ animation: "expandIn 200ms cubic-bezier(0.23,1,0.32,1) both" }}
            >
              <a
                href={`https://wa.me/${b.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="wa-btn flex-1 py-2 text-center text-xs font-bold bg-green-500/15 border border-green-500/25 text-green-400 rounded-xl outline-none"
                style={{ transition: "background 150ms ease, transform 120ms cubic-bezier(0.23,1,0.32,1)" }}
              >
                WhatsApp
              </a>
            </div>
          )}
        </button>
      ))}

      <style>{`
        /* Entrance: scale(0.97) not scale(0) — nothing appears from nothing */
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(8px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }

        /* WhatsApp expand — scale + opacity, no layout shift */
        @keyframes expandIn {
          from { opacity:0; transform:scaleY(0.92); transform-origin:top; }
          to   { opacity:1; transform:scaleY(1);    transform-origin:top; }
        }

        /* Card: only background + border transitions, not 'all' */
        .branch-btn {
          transition:
            background 150ms ease,
            border-color 150ms ease,
            transform 120ms cubic-bezier(0.23,1,0.32,1);
        }

        /* Press feedback — 120ms, scale(0.98), subtle */
        .branch-btn:active {
          transform: scale(0.98) !important;
          transition: transform 120ms cubic-bezier(0.23,1,0.32,1) !important;
        }

        /* Hover gated behind pointer: fine — avoid touch false positives */
        @media (hover: hover) and (pointer: fine) {
          .branch-btn:hover {
            background: rgba(255,255,255,0.05);
            border-color: rgba(255,255,255,0.12);
          }
          .map-ext-link:hover {
            color: rgba(255,255,255,0.8);
            background: rgba(255,255,255,0.08);
          }
          .wa-btn:hover {
            background: rgba(34,197,94,0.22);
          }
        }

        /* WhatsApp press */
        .wa-btn:active {
          transform: scale(0.96) !important;
        }

        /* Reduced motion — opacity only, no movement */
        @media (prefers-reduced-motion: reduce) {
          .branch-btn, .wa-btn { animation: none !important; }
          .branch-btn { transition: background 150ms ease !important; }
        }

        /* Leaflet dark theme */
        .leaflet-container { background: #0a0a0a; }
        .leaflet-control-attribution {
          background: rgba(0,0,0,0.6) !important;
          color: rgba(255,255,255,0.3) !important;
          font-size: 9px !important;
        }
        .leaflet-control-attribution a { color: rgba(255,255,255,0.4) !important; }
        .leaflet-control-zoom a {
          background: rgba(15,15,15,0.9) !important;
          border-color: rgba(255,255,255,0.1) !important;
          color: rgba(255,255,255,0.6) !important;
          transition: background 150ms ease, color 150ms ease !important;
        }
        @media (hover: hover) and (pointer: fine) {
          .leaflet-control-zoom a:hover {
            background: rgba(30,30,30,0.95) !important;
            color: #fff !important;
          }
        }
      `}</style>
    </div>
  );
}
