"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("Global Error Boundary caught:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
            <div className="max-w-md w-full glass-panel rounded-2xl p-8 border border-white/10 text-center">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                </div>

                <h1 className="font-display text-2xl font-bold text-white mb-4">
                    Algo salió mal
                </h1>

                <p className="text-slate-400 mb-8">
                    Ha ocurrido un error inesperado al cargar la aplicación. Por favor, intenta recargar la página.
                </p>

                <div className="flex flex-col gap-3">
                    <Button
                        onClick={() => reset()}
                        className="w-full bg-primary hover:bg-primary/90 text-white gap-2"
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Reintentar
                    </Button>

                    <Link href="/" className="w-full">
                        <Button
                            variant="outline"
                            className="w-full border-white/10 text-slate-300 hover:bg-white/5 gap-2"
                        >
                            <Home className="w-4 h-4" />
                            Volver al inicio
                        </Button>
                    </Link>
                </div>

                {/* Debug info - Show even in production for now to troubleshoot iPad error */}
                <div className="mt-8 pt-8 border-t border-white/5 text-left overflow-auto">
                    <p className="text-[10px] font-mono text-slate-500 mb-2">Error ID: {error.digest || "N/A"}</p>
                    <p className="text-xs font-mono text-red-400/70 whitespace-pre-wrap">
                        {error.message || "Unknown Error"}
                    </p>
                </div>
            </div>
        </div>
    );
}
