"use client";

import { useState } from "react";
import { useAuth } from "@/components/shared";
import { Button } from "@/components/ui";
import { QrCode, Printer, Plus, Trash2 } from "lucide-react";

// Simple QR code display component
function QRCodeDisplay({ url, label }: { url: string; label: string }) {
    // We use a simple external API for QR generation to keep it lightweight for now, 
    // or we could use a library. For this demo, let's use a reliable placeholder or simple div structure
    // In a real app we'd use 'react-qr-code' package.
    // For now, let's simulate the visual.

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(url)}`;

    return (
        <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-2 print:border-black">
            <h3 className="text-lg font-bold text-black mb-2">{label}</h3>
            <img src={qrUrl} alt={`QR for ${label}`} className="w-32 h-32 mb-2" />
            <p className="text-xs text-slate-500 font-mono">{url}</p>
        </div>
    );
}

export default function TablesPage() {
    const { user } = useAuth();
    const [tableCount, setTableCount] = useState(10);

    const tables = Array.from({ length: tableCount }, (_, i) => i + 1);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://nexo.app";

    return (
        <div className="space-y-8 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Mesas & QRs</h1>
                    <p className="text-slate-400">Genera códigos QR para tus mesas</p>
                </div>
                <Button
                    onClick={() => window.print()}
                    className="bg-white/10 hover:bg-white/20 text-white"
                >
                    <Printer className="w-4 h-4 mr-2" />
                    Imprimir QRs
                </Button>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-white/10">
                <div className="flex items-end gap-4 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Cantidad de Mesas</label>
                        <input
                            type="number"
                            value={tableCount}
                            onChange={(e) => setTableCount(Number(e.target.value))}
                            className="px-4 py-2 rounded-xl bg-black/20 border border-white/10 text-white w-32"
                        />
                    </div>
                    <p className="text-sm text-slate-500 pb-3">
                        Se generarán códigos para mesas del 1 al {tableCount}
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 print:grid-cols-3">
                    {tables.map(num => (
                        <QRCodeDisplay
                            key={num}
                            label={`Mesa ${num}`}
                            url={`${baseUrl}/${user?.shopId || "demo"}?table=${num}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
