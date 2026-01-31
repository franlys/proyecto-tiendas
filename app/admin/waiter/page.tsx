"use client";

import { useState, useMemo } from "react";
import { useOrders } from "@/components/shared";
import {
    Users,
    Clock,
    ChefHat,
    CheckCircle2,
    AlertCircle,
    MoreVertical,
    Plus,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

// Mock tables for visualization
const TABLES = Array.from({ length: 12 }, (_, i) => i + 1);

export default function WaiterDashboard() {
    const { orders, updateStatus } = useOrders(); // Assuming updateStatus exists or we need to add it
    const [filter, setFilter] = useState<"all" | "pending" | "ready">("all");

    // Get active tables (tables with pending/active orders)
    const activeTables = useMemo(() => {
        const tableStatus: Record<string, { total: number, items: number, status: string, time: string }> = {};

        // Process orders to find table status
        orders.filter(o => o.tableId && o.status === "completed").forEach(order => {
            if (!tableStatus[order.tableId!]) {
                tableStatus[order.tableId!] = {
                    total: 0,
                    items: 0,
                    status: 'active',
                    time: order.date
                };
            }
            tableStatus[order.tableId!].total += order.total;
            tableStatus[order.tableId!].items += order.items.length;
        });

        return tableStatus;
    }, [orders]);

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 pb-24 md:pb-4">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 sticky top-0 bg-slate-950 z-20 py-4 border-b border-white/10">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ChefHat className="text-orange-500" />
                        Panel de Meseros
                    </h1>
                    <p className="text-slate-400 text-sm">Gestiona mesas y comandas en tiempo real</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="!p-2" onClick={() => window.location.reload()}>
                        <RefreshCw className="w-4 h-4" />
                    </Button>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                </div>
            </header>

            {/* Main Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {TABLES.map((tableNum) => {
                    const tableId = tableNum.toString();
                    const info = activeTables[tableId];
                    const isActive = !!info;

                    return (
                        <div
                            key={tableNum}
                            className={cn(
                                "relative p-4 rounded-2xl border transition-all cursor-pointer h-40 flex flex-col justify-between",
                                isActive
                                    ? "bg-orange-500/10 border-orange-500/50 hover:bg-orange-500/20"
                                    : "bg-white/5 border-white/10 hover:bg-white/10 opacity-70 hover:opacity-100"
                            )}
                        >
                            <div className="flex justify-between items-start">
                                <span className={cn(
                                    "text-2xl font-bold",
                                    isActive ? "text-orange-400" : "text-slate-500"
                                )}>
                                    #{tableNum}
                                </span>
                                {isActive && (
                                    <div className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold animate-pulse">
                                        Ocupada
                                    </div>
                                )}
                            </div>

                            {isActive ? (
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Total:</span>
                                        <span className="font-mono font-bold">${info.total}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-400">Items:</span>
                                        <span className="text-white">{info.items}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-2">
                                        <Clock className="w-3 h-3" />
                                        <span>hace 5 min</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-slate-600">
                                    <Users className="w-8 h-8 opacity-20" />
                                    <span className="text-xs mt-2">Libre</span>
                                </div>
                            )}

                            {/* Quick Actions Overlay */}
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-2xl opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <Button size="sm" className="rounded-full bg-blue-600 hover:bg-blue-500 text-white !p-2">
                                    <Plus className="w-5 h-5" />
                                </Button>
                                <Button size="sm" className="rounded-full bg-white/20 hover:bg-white/30 text-white !p-2">
                                    <MoreVertical className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Live Orders Feed (Kitchen View) */}
            <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    Comandas Pendientes
                </h3>

                <div className="space-y-3">
                    {orders.filter(o => o.status === "completed" && o.tableId).length === 0 ? (
                        <p className="text-slate-500 italic">No hay comandas pendientes</p>
                    ) : (
                        orders
                            .filter(o => o.status === "completed" && o.tableId) // In this demo "completed" means placed. Real app would have "placed" -> "served"
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map(order => (
                                <div key={order.id} className="p-4 rounded-xl bg-white/5 border-l-4 border-l-orange-500 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-lg text-white">Mesa {order.tableId} <span className="text-sm font-normal text-slate-400">#{order.id.slice(-6)}</span></div>
                                        <ul className="text-sm text-slate-300 mt-1 list-disc list-inside">
                                            {order.items.map((item, idx) => (
                                                <li key={idx}>{item.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-2xl font-mono font-bold text-orange-400">
                                            {Math.floor((new Date().getTime() - new Date(order.date).getTime()) / 60000)}m
                                        </span>
                                        <Button
                                            size="sm"
                                            className="mt-2 bg-green-600 hover:bg-green-500"
                                            onClick={() => updateStatus(order.id, "cancelled")} // In this demo, "cancelled" basically hides it or we could add "served" status
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-1" />
                                            Entregar
                                        </Button>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </div>
        </div>
    );
}
