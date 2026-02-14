"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, AuthProvider } from "@/components/shared";
import { useRouter } from "next/navigation";
import {
    RefreshCw,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Activity,
    Database,
    MessageSquare,
    HardDrive,
    Store,
    ShoppingCart,
    Clock,
    Settings,
    ArrowLeft,
    Loader2,
    Zap,
    Wifi,
    WifiOff,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HealthCheck {
    name: string;
    status: "ok" | "warning" | "error";
    message: string;
    details?: any;
    latency?: number;
}

interface SystemHealth {
    timestamp: string;
    overall: "healthy" | "degraded" | "critical";
    checks: HealthCheck[];
    summary: {
        total: number;
        ok: number;
        warnings: number;
        errors: number;
    };
}

const STATUS_ICONS = {
    ok: CheckCircle2,
    warning: AlertTriangle,
    error: XCircle,
};

const STATUS_COLORS = {
    ok: "text-emerald-400",
    warning: "text-amber-400",
    error: "text-red-400",
};

const STATUS_BG = {
    ok: "bg-emerald-500/10 border-emerald-500/30",
    warning: "bg-amber-500/10 border-amber-500/30",
    error: "bg-red-500/10 border-red-500/30",
};

const OVERALL_COLORS = {
    healthy: { bg: "bg-emerald-500", text: "text-emerald-400", label: "Saludable" },
    degraded: { bg: "bg-amber-500", text: "text-amber-400", label: "Degradado" },
    critical: { bg: "bg-red-500", text: "text-red-400", label: "Crítico" },
};

const CHECK_ICONS: Record<string, any> = {
    "Environment Variables": Settings,
    "Firestore Database": Database,
    "Evolution API (WhatsApp)": MessageSquare,
    "Firebase Storage": HardDrive,
    "Shop Statistics": Store,
    "Orders Activity": ShoppingCart,
    "Cron Jobs": Clock,
};

function SystemHealthContent() {
    const { user, isSuperAdmin, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [autoRefresh, setAutoRefresh] = useState(false);

    const fetchHealth = useCallback(async (showRefreshing = true) => {
        if (showRefreshing) setIsRefreshing(true);

        try {
            const response = await fetch("/api/admin/system-health");
            if (response.ok) {
                const data = await response.json();
                setHealth(data);
                setLastRefresh(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch system health:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && !isSuperAdmin) {
            router.push("/admin");
            return;
        }

        if (isSuperAdmin) {
            fetchHealth();
        }
    }, [authLoading, isSuperAdmin, router, fetchHealth]);

    // Auto-refresh every 30 seconds if enabled
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchHealth(false);
        }, 30000);

        return () => clearInterval(interval);
    }, [autoRefresh, fetchHealth]);

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
        );
    }

    if (!isSuperAdmin) {
        return null;
    }

    const overallStatus = health?.overall || "healthy";
    const overallConfig = OVERALL_COLORS[overallStatus];

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/agency"
                            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                <Activity className="w-7 h-7 text-cyan-400" />
                                Estado del Sistema
                            </h1>
                            <p className="text-zinc-400 text-sm mt-1">
                                Diagnóstico en tiempo real de todos los servicios
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Auto-refresh toggle */}
                        <button
                            onClick={() => setAutoRefresh(!autoRefresh)}
                            className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm",
                                autoRefresh
                                    ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                                    : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
                            )}
                        >
                            {autoRefresh ? (
                                <Wifi className="w-4 h-4" />
                            ) : (
                                <WifiOff className="w-4 h-4" />
                            )}
                            Auto
                        </button>

                        {/* Refresh button */}
                        <button
                            onClick={() => fetchHealth()}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                            Actualizar
                        </button>
                    </div>
                </div>

                {/* Overall Status Card */}
                {health && (
                    <div className={cn(
                        "p-6 rounded-2xl border-2 transition-all",
                        overallStatus === "healthy" && "bg-emerald-500/5 border-emerald-500/30",
                        overallStatus === "degraded" && "bg-amber-500/5 border-amber-500/30",
                        overallStatus === "critical" && "bg-red-500/5 border-red-500/30",
                    )}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-16 h-16 rounded-full flex items-center justify-center",
                                    overallStatus === "healthy" && "bg-emerald-500/20",
                                    overallStatus === "degraded" && "bg-amber-500/20",
                                    overallStatus === "critical" && "bg-red-500/20",
                                )}>
                                    {overallStatus === "healthy" && <CheckCircle2 className="w-8 h-8 text-emerald-400" />}
                                    {overallStatus === "degraded" && <AlertTriangle className="w-8 h-8 text-amber-400" />}
                                    {overallStatus === "critical" && <XCircle className="w-8 h-8 text-red-400" />}
                                </div>
                                <div>
                                    <h2 className={cn("text-2xl font-bold", overallConfig.text)}>
                                        Sistema {overallConfig.label}
                                    </h2>
                                    <p className="text-zinc-400 text-sm">
                                        {lastRefresh
                                            ? `Última verificación: ${lastRefresh.toLocaleTimeString()}`
                                            : "Verificando..."
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Summary Pills */}
                            <div className="flex items-center gap-3">
                                <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                                    <span className="text-emerald-400 font-bold text-xl">{health.summary.ok}</span>
                                    <span className="text-emerald-400/70 text-sm ml-1">OK</span>
                                </div>
                                {health.summary.warnings > 0 && (
                                    <div className="px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                        <span className="text-amber-400 font-bold text-xl">{health.summary.warnings}</span>
                                        <span className="text-amber-400/70 text-sm ml-1">Alertas</span>
                                    </div>
                                )}
                                {health.summary.errors > 0 && (
                                    <div className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                                        <span className="text-red-400 font-bold text-xl">{health.summary.errors}</span>
                                        <span className="text-red-400/70 text-sm ml-1">Errores</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Health Checks Grid */}
                {health && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {health.checks.map((check, index) => {
                            const StatusIcon = STATUS_ICONS[check.status];
                            const CheckIcon = CHECK_ICONS[check.name] || Activity;

                            return (
                                <div
                                    key={index}
                                    className={cn(
                                        "p-5 rounded-xl border transition-all",
                                        STATUS_BG[check.status]
                                    )}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                                check.status === "ok" && "bg-emerald-500/20",
                                                check.status === "warning" && "bg-amber-500/20",
                                                check.status === "error" && "bg-red-500/20",
                                            )}>
                                                <CheckIcon className={cn("w-5 h-5", STATUS_COLORS[check.status])} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-white">{check.name}</h3>
                                                <p className={cn("text-sm", STATUS_COLORS[check.status])}>
                                                    {check.message}
                                                </p>
                                            </div>
                                        </div>
                                        <StatusIcon className={cn("w-5 h-5", STATUS_COLORS[check.status])} />
                                    </div>

                                    {/* Details */}
                                    {check.details && (
                                        <div className="mt-4 pt-3 border-t border-white/10">
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(check.details).map(([key, value]) => {
                                                    // Skip arrays for now
                                                    if (Array.isArray(value)) {
                                                        if (value.length === 0) return null;
                                                        return (
                                                            <span key={key} className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                                                                {key}: {value.join(", ")}
                                                            </span>
                                                        );
                                                    }
                                                    return (
                                                        <span key={key} className="text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                                                            {key}: <span className="text-zinc-300">{String(value)}</span>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Latency indicator */}
                                    {check.latency !== undefined && (
                                        <div className="mt-3 flex items-center gap-2">
                                            <Zap className="w-3 h-3 text-zinc-500" />
                                            <span className={cn(
                                                "text-xs",
                                                check.latency < 500 ? "text-emerald-400" :
                                                check.latency < 1000 ? "text-amber-400" : "text-red-400"
                                            )}>
                                                {check.latency}ms
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Quick Actions */}
                <div className="p-6 rounded-xl bg-zinc-900/50 border border-zinc-800">
                    <h3 className="text-lg font-semibold text-white mb-4">Acciones Rápidas</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Link
                            href="/api/debug/firestore"
                            target="_blank"
                            className="p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-center transition-all"
                        >
                            <Database className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                            <span className="text-sm text-zinc-300">Debug Firestore</span>
                        </Link>
                        <Link
                            href="/agency/shops"
                            className="p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-center transition-all"
                        >
                            <Store className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                            <span className="text-sm text-zinc-300">Ver Tiendas</span>
                        </Link>
                        <Link
                            href="/admin/orders"
                            className="p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-center transition-all"
                        >
                            <ShoppingCart className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                            <span className="text-sm text-zinc-300">Ver Pedidos</span>
                        </Link>
                        <Link
                            href="/agency/evolution"
                            className="p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-center transition-all"
                        >
                            <MessageSquare className="w-6 h-6 text-green-400 mx-auto mb-2" />
                            <span className="text-sm text-zinc-300">WhatsApp Bot</span>
                        </Link>
                    </div>
                </div>

                {/* Raw JSON (collapsible) */}
                {health && (
                    <details className="group">
                        <summary className="cursor-pointer text-zinc-500 hover:text-zinc-300 text-sm flex items-center gap-2">
                            <span className="group-open:rotate-90 transition-transform">▶</span>
                            Ver datos JSON
                        </summary>
                        <pre className="mt-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 overflow-x-auto">
                            {JSON.stringify(health, null, 2)}
                        </pre>
                    </details>
                )}
            </div>
        </div>
    );
}

export default function SystemHealthPage() {
    return (
        <AuthProvider>
            <SystemHealthContent />
        </AuthProvider>
    );
}
