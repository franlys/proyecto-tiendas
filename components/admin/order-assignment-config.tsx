"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import {
  Users,
  Clock,
  RefreshCw,
  Save,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Bell,
} from "lucide-react";
import type { OrderAssignmentConfig } from "@/lib/types/order-assignment.types";
import { DEFAULT_ASSIGNMENT_CONFIG } from "@/lib/types/order-assignment.types";

interface OrderAssignmentConfigPanelProps {
  shopId: string;
}

export function OrderAssignmentConfigPanel({ shopId }: OrderAssignmentConfigPanelProps) {
  const [config, setConfig] = useState<OrderAssignmentConfig>(DEFAULT_ASSIGNMENT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, [shopId]);

  const fetchConfig = async () => {
    try {
      const res = await fetch(`/api/automation/orders/config?shopId=${shopId}`);
      const data = await res.json();
      if (data.config) {
        setConfig({ ...DEFAULT_ASSIGNMENT_CONFIG, ...data.config });
      }
    } catch (error) {
      console.error("Error fetching config:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/automation/orders/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, ...config }),
      });

      if (res.ok) {
        alert("Configuracion guardada");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-panel rounded-2xl p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              Asignacion Rotativa de Pedidos
            </h3>
            <p className="text-slate-400 text-sm">
              Notifica vendedores automaticamente cuando hay nuevos pedidos
            </p>
          </div>
        </div>

        <button
          onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
          className="flex items-center gap-2"
        >
          {config.enabled ? (
            <ToggleRight className="w-10 h-10 text-green-400" />
          ) : (
            <ToggleLeft className="w-10 h-10 text-slate-500" />
          )}
        </button>
      </div>

      {config.enabled && (
        <div className="space-y-6">
          {/* Timeouts */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Timeout Inicial (minutos)
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={config.initialTimeoutMinutes}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    initialTimeoutMinutes: parseInt(e.target.value) || 5,
                  }))
                }
                className="w-full px-4 py-2 bg-surface rounded-lg border border-white/10 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">
                Tiempo de espera para respuesta del primer vendedor
              </p>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Timeout Rotacion (minutos)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={config.rotationTimeoutMinutes}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    rotationTimeoutMinutes: parseInt(e.target.value) || 8,
                  }))
                }
                className="w-full px-4 py-2 bg-surface rounded-lg border border-white/10 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">
                Tiempo entre rotaciones si pocos vendedores
              </p>
            </div>
          </div>

          {/* Max Rotations */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Rotaciones Maximas
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={config.maxRotations}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  maxRotations: parseInt(e.target.value) || 3,
                }))
              }
              className="w-full sm:w-48 px-4 py-2 bg-surface rounded-lg border border-white/10 text-white"
            />
            <p className="text-xs text-slate-500 mt-1">
              Cuantas vueltas dar antes de marcar como expirado
            </p>
          </div>

          {/* Notify Owner on Expiry */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-surface/50 border border-white/10">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-white font-medium">Notificar al Dueno</p>
                <p className="text-sm text-slate-400">
                  Si nadie acepta el pedido
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  notifyOwnerOnExpiry: !prev.notifyOwnerOnExpiry,
                }))
              }
            >
              {config.notifyOwnerOnExpiry ? (
                <ToggleRight className="w-8 h-8 text-green-400" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-500" />
              )}
            </button>
          </div>

          {/* Keywords */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Palabras para Aceptar
              </label>
              <input
                type="text"
                value={config.acceptKeywords.join(", ")}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    acceptKeywords: e.target.value.split(",").map((s) => s.trim()),
                  }))
                }
                className="w-full px-4 py-2 bg-surface rounded-lg border border-white/10 text-white"
                placeholder="SI, ACEPTO, OK"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Palabras para Rechazar
              </label>
              <input
                type="text"
                value={config.rejectKeywords.join(", ")}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    rejectKeywords: e.target.value.split(",").map((s) => s.trim()),
                  }))
                }
                className="w-full px-4 py-2 bg-surface rounded-lg border border-white/10 text-white"
                placeholder="NO, PASO, OCUPADO"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button onClick={saveConfig} disabled={saving} className="w-full sm:w-auto">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuracion
              </>
            )}
          </Button>
        </div>
      )}

      {!config.enabled && (
        <p className="text-slate-500 text-sm">
          Activa esta funcion para que los pedidos se asignen automaticamente a tus vendedores via WhatsApp.
        </p>
      )}
    </div>
  );
}
