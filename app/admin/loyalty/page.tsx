"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Gift,
  Settings,
  Users,
  Loader2,
  Save,
  Check,
  Sparkles,
  TrendingUp,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui";
import { useAuth, useShops } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { LoyaltyConfig, CustomerLoyalty } from "@/lib/types/loyalty.types";

export default function LoyaltyAdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { getShop } = useShops();
  const [activeTab, setActiveTab] = useState<"config" | "customers">("config");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState<LoyaltyConfig>({
    enabled: false,
    stampsRequired: 10,
    reward: "Servicio Gratis",
    rewardType: "freeService",
    rewardValue: 100,
    stampsPerOrder: 1,
    minimumOrderAmount: 0,
    expirationDays: 0,
    createdAt: "",
    updatedAt: "",
  });
  const [customers, setCustomers] = useState<CustomerLoyalty[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const shop = user?.shopId ? getShop(user.shopId) : null;

  useEffect(() => {
    if (user?.shopId) {
      loadConfig();
    }
  }, [user?.shopId]);

  const loadConfig = async () => {
    if (!user?.shopId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/loyalty/config?shopId=${user.shopId}`);
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error("Error loading config:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    if (!user?.shopId) return;
    setLoadingCustomers(true);
    try {
      const res = await fetch(`/api/loyalty/customers?shopId=${user.shopId}`);
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleSave = async () => {
    if (!user?.shopId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/loyalty/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: user.shopId, config }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error("Error saving config:", error);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (updates: Partial<LoyaltyConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
    setSaved(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const REWARD_TYPES = [
    { id: "freeService", label: "Servicio Gratis", icon: Gift },
    { id: "discount", label: "Descuento %", icon: TrendingUp },
    { id: "freeProduct", label: "Producto Gratis", icon: Award },
    { id: "custom", label: "Personalizado", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-rose-500 to-orange-400 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-white">
                  Programa de Lealtad
                </h1>
                <p className="text-slate-400 text-sm">
                  {shop?.name || "Mi Tienda"} - Tarjeta de fidelidad
                </p>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saved || saving}>
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  Guardado
                </>
              ) : (
                <>
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Guardando..." : "Guardar"}
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("config")}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                activeTab === "config"
                  ? "text-white border-primary"
                  : "text-slate-400 border-transparent hover:text-white"
              )}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Configuración
            </button>
            <button
              onClick={() => {
                setActiveTab("customers");
                if (customers.length === 0) loadCustomers();
              }}
              className={cn(
                "px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px",
                activeTab === "customers"
                  ? "text-white border-primary"
                  : "text-slate-400 border-transparent hover:text-white"
              )}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Clientes ({customers.length})
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {activeTab === "config" && (
          <div className="max-w-2xl space-y-6">
            {/* Enable Toggle */}
            <div className="glass-panel rounded-2xl p-6">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => updateConfig({ enabled: !config.enabled })}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      config.enabled ? "bg-primary/20" : "bg-white/10"
                    )}
                  >
                    <Heart
                      className={cn(
                        "w-6 h-6",
                        config.enabled ? "text-primary" : "text-slate-400"
                      )}
                    />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      Activar Programa de Lealtad
                    </h3>
                    <p className="text-slate-400 text-sm">
                      Los clientes ganarán sellos con cada compra
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    "relative w-14 h-7 rounded-full transition-colors",
                    config.enabled ? "bg-primary" : "bg-white/20"
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-1 w-5 h-5 rounded-full bg-white transition-transform shadow-lg",
                      config.enabled ? "translate-x-8" : "translate-x-1"
                    )}
                  />
                </div>
              </div>
            </div>

            {config.enabled && (
              <>
                {/* Stamps Configuration */}
                <div className="glass-panel rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    Configuración de Sellos
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Sellos para recompensa
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={config.stampsRequired}
                        onChange={(e) =>
                          updateConfig({ stampsRequired: parseInt(e.target.value) || 10 })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Cuántos sellos necesita para canjear
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Sellos por compra
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={config.stampsPerOrder}
                        onChange={(e) =>
                          updateConfig({ stampsPerOrder: parseInt(e.target.value) || 1 })
                        }
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50"
                      />
                      <p className="text-xs text-slate-500 mt-1">
                        Sellos que gana por cada compra
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm text-slate-400 mb-2">
                      Monto mínimo de compra (opcional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={config.minimumOrderAmount || 0}
                        onChange={(e) =>
                          updateConfig({ minimumOrderAmount: parseInt(e.target.value) || 0 })
                        }
                        className="w-full pl-8 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50"
                        placeholder="0"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Deja en 0 para dar sellos en cualquier compra
                    </p>
                  </div>
                </div>

                {/* Reward Configuration */}
                <div className="glass-panel rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-gold" />
                    Recompensa
                  </h3>

                  <div className="mb-4">
                    <label className="block text-sm text-slate-400 mb-3">
                      Tipo de recompensa
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {REWARD_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = config.rewardType === type.id;
                        return (
                          <button
                            key={type.id}
                            onClick={() =>
                              updateConfig({
                                rewardType: type.id as LoyaltyConfig["rewardType"],
                              })
                            }
                            className={cn(
                              "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                              isSelected
                                ? "border-primary bg-primary/10"
                                : "border-white/10 bg-white/5 hover:border-white/20"
                            )}
                          >
                            <Icon
                              className={cn(
                                "w-5 h-5",
                                isSelected ? "text-primary" : "text-slate-400"
                              )}
                            />
                            <span
                              className={cn(
                                "text-sm font-medium",
                                isSelected ? "text-white" : "text-slate-300"
                              )}
                            >
                              {type.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">
                        Descripción de la recompensa
                      </label>
                      <input
                        type="text"
                        value={config.reward}
                        onChange={(e) => updateConfig({ reward: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50"
                        placeholder="Ej: Corte de cabello gratis"
                      />
                    </div>

                    {config.rewardType === "discount" && (
                      <div>
                        <label className="block text-sm text-slate-400 mb-2">
                          Porcentaje de descuento
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={config.rewardValue}
                            onChange={(e) =>
                              updateConfig({ rewardValue: parseInt(e.target.value) || 10 })
                            }
                            className="w-full pr-8 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-primary/50"
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                            %
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div className="glass-panel rounded-2xl p-6">
                  <h3 className="text-white font-semibold mb-4">
                    Así se verá la tarjeta
                  </h3>
                  <div className="bg-gradient-to-br from-primary via-rose-600 to-orange-500 rounded-2xl p-6 max-w-sm mx-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-white font-bold">{shop?.name || "Mi Tienda"}</p>
                        <p className="text-white/70 text-sm">Tarjeta de Fidelidad</p>
                      </div>
                      <Heart className="w-8 h-8 text-white" />
                    </div>
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {Array.from({ length: config.stampsRequired }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "aspect-square rounded-lg flex items-center justify-center",
                            i < 3 ? "bg-white" : "bg-white/20 border border-dashed border-white/40"
                          )}
                        >
                          {i < 3 && <Sparkles className="w-4 h-4 text-primary" />}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/70 text-sm">Premio</p>
                        <p className="text-white font-bold">{config.reward}</p>
                      </div>
                      <p className="text-white/60 text-sm">
                        3/{config.stampsRequired} sellos
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "customers" && (
          <div className="max-w-4xl">
            {loadingCustomers ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">
                  Sin clientes aún
                </h3>
                <p className="text-slate-400">
                  Los clientes aparecerán aquí cuando hagan compras
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {customers.map((customer) => (
                  <div
                    key={customer.phone}
                    className="glass-panel rounded-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <Heart className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {customer.phone}
                        </p>
                        <p className="text-slate-400 text-sm">
                          {customer.totalStampsEarned} sellos totales •{" "}
                          {customer.totalRewardsRedeemed} canjes
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">
                        {customer.currentStamps}
                      </p>
                      <p className="text-slate-400 text-xs">sellos actuales</p>
                      {customer.currentStamps >= config.stampsRequired && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gold/20 text-gold text-xs rounded-full">
                          Listo para canjear
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
