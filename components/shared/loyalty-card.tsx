"use client";

import { useState, useEffect } from "react";
import { Heart, Sparkles, Gift, Loader2, Phone, CheckCircle, History, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "./theme-context";
import {
  getLoyaltyConfig,
  getCustomerLoyalty,
  redeemReward,
} from "@/lib/services/loyalty.service";
import type { LoyaltyConfig, CustomerLoyalty } from "@/lib/types/loyalty.types";
import { SectionObserver, ScrollReveal } from "./index";

interface LoyaltyCardProps {
  customerPhone?: string;
  demoMode?: boolean;
  standalone?: boolean;
}

export function LoyaltyCard({
  customerPhone,
  demoMode = false,
  standalone = false,
}: LoyaltyCardProps) {
  const shop = useShop();
  const [phone, setPhone] = useState(customerPhone || "");
  const [showPhoneInput, setShowPhoneInput] = useState(!customerPhone);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<LoyaltyConfig | null>(null);
  const [loyalty, setLoyalty] = useState<CustomerLoyalty | null>(null);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  // Demo mode state
  const [demoStamps, setDemoStamps] = useState(3);
  const [lastAdded, setLastAdded] = useState<number | null>(null);

  const totalStamps = config?.stampsRequired || 10;
  const currentStamps = demoMode ? demoStamps : (loyalty?.currentStamps || 0);
  const reward = config?.reward || "Servicio Gratis";
  const isComplete = currentStamps >= totalStamps;
  const canRedeem = !demoMode && isComplete && loyalty;

  useEffect(() => {
    if (shop?.slug) {
      loadConfig();
    }
  }, [shop?.slug]);

  useEffect(() => {
    if (customerPhone && shop?.slug) {
      loadCustomerData(customerPhone);
    }
  }, [customerPhone, shop?.slug]);

  const loadConfig = async () => {
    if (!shop?.slug) return;
    const cfg = await getLoyaltyConfig(shop.slug);
    // Only set config if enabled, otherwise keep null
    if (cfg && cfg.enabled !== false) {
      setConfig(cfg);
    } else {
      setConfig(null);
    }
  };

  const loadCustomerData = async (phoneNumber: string) => {
    if (!shop?.slug || !phoneNumber) return;

    setLoading(true);
    setError("");

    try {
      const data = await getCustomerLoyalty(shop.slug, phoneNumber);
      setLoyalty(data);
      setShowPhoneInput(false);
    } catch {
      setError("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Ingresa un número válido");
      return;
    }
    await loadCustomerData(phone);
  };

  const handleRedeem = async () => {
    if (!shop?.slug || !loyalty?.phone) return;

    setRedeeming(true);
    try {
      const result = await redeemReward(shop.slug, loyalty.phone);
      if (result.success) {
        setRedeemSuccess(true);
        await loadCustomerData(loyalty.phone);
        setTimeout(() => setRedeemSuccess(false), 3000);
      } else {
        setError(result.message);
      }
    } catch {
      setError("Error al canjear recompensa");
    } finally {
      setRedeeming(false);
    }
  };

  const handleDemoClick = () => {
    if (!demoMode) return;
    if (demoStamps < totalStamps) {
      const newStampIndex = demoStamps;
      setDemoStamps((prev) => prev + 1);
      setLastAdded(newStampIndex);
      setTimeout(() => setLastAdded(null), 600);
    }
  };

  // Don't render if config is not loaded or disabled (unless in demo mode)
  if (!demoMode && !config) {
    return null;
  }

  const renderContent = () => {
    // Phone input view
    if (showPhoneInput && !demoMode) {
      return (
        <div className="w-full max-w-md mx-auto">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-white font-display text-xl font-bold">
                Tarjeta de Fidelidad
              </h3>
              <p className="text-slate-400 text-sm mt-2">
                Ingresa tu número para ver tus sellos
              </p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                  placeholder="809 123 4567"
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full py-3 bg-primary hover:bg-primary/90 disabled:bg-slate-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Ver mis sellos
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full max-w-md mx-auto">
        {/* History Modal */}
        {showHistory && loyalty && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Historial
                </h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-slate-400 text-sm mb-2">Sellos Ganados</h4>
                  {loyalty.stampHistory.length === 0 ? (
                    <p className="text-slate-500 text-sm">Sin sellos aún</p>
                  ) : (
                    <div className="space-y-2">
                      {loyalty.stampHistory.slice(-10).reverse().map((stamp) => (
                        <div
                          key={stamp.id}
                          className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                        >
                          <div>
                            <p className="text-white text-sm">
                              Pedido #{stamp.orderNumber}
                            </p>
                            <p className="text-slate-400 text-xs">
                              {(() => {
                                try {
                                  const d = new Date(stamp.date);
                                  return isNaN(d.getTime()) ? "Fecha no disponible" : d.toLocaleDateString();
                                } catch (e) {
                                  return "Fecha no disponible";
                                }
                              })()}
                            </p>
                          </div>
                          <span className="text-primary font-bold">
                            +{stamp.stampsEarned}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-slate-400 text-sm mb-2">Recompensas Canjeadas</h4>
                  {loyalty.redemptionHistory.length === 0 ? (
                    <p className="text-slate-500 text-sm">Sin canjes aún</p>
                  ) : (
                    <div className="space-y-2">
                      {loyalty.redemptionHistory.slice(-10).reverse().map((redemption) => (
                        <div
                          key={redemption.id}
                          className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg"
                        >
                          <div>
                            <p className="text-white text-sm">{redemption.reward}</p>
                            <p className="text-slate-400 text-xs">
                              {(() => {
                                try {
                                  const d = new Date(redemption.date);
                                  return isNaN(d.getTime()) ? "Fecha no disponible" : d.toLocaleDateString();
                                } catch (e) {
                                  return "Fecha no disponible";
                                }
                              })()}
                            </p>
                          </div>
                          <Gift className="w-5 h-5 text-gold" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div
          onClick={demoMode ? handleDemoClick : undefined}
          className={cn(
            "relative overflow-hidden rounded-2xl p-6",
            "bg-gradient-to-br from-primary via-rose-600 to-orange-500",
            "shadow-2xl shadow-primary/30",
            "transition-transform duration-300",
            demoMode && "cursor-pointer hover:scale-[1.02]",
            isComplete && "from-gold via-gold-light to-amber-400"
          )}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,white_1px,transparent_1px)] bg-[length:20px_20px]" />
          </div>

          {/* Redeem Success Overlay */}
          {redeemSuccess && (
            <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center z-10 rounded-2xl animate-in fade-in duration-300">
              <div className="text-center text-white">
                <CheckCircle className="w-16 h-16 mx-auto mb-2" />
                <p className="font-bold text-lg">Recompensa Canjeada</p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="relative flex items-center justify-between mb-6">
            <div>
              <h3 className="text-white font-display text-xl font-bold">
                {shop?.name || "Mi Tienda"}
              </h3>
              <p className="text-white/80 text-sm">Tarjeta de Fidelidad</p>
            </div>
            <div className="flex items-center gap-2">
              {loyalty && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowHistory(true);
                  }}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <History className="w-5 h-5 text-white" />
                </button>
              )}
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {isComplete ? (
                  <Gift className="w-6 h-6 text-white" />
                ) : (
                  <Heart className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
          </div>

          {/* Stamps Grid */}
          <div className="relative grid grid-cols-5 gap-3 mb-6">
            {Array.from({ length: totalStamps }).map((_, index) => {
              const isFilled = index < currentStamps;
              const isAnimating = index === lastAdded;

              return (
                <div
                  key={index}
                  className={cn(
                    "aspect-square rounded-xl flex items-center justify-center",
                    "transition-all duration-300",
                    isFilled
                      ? "bg-white shadow-lg"
                      : "bg-white/20 border-2 border-dashed border-white/40"
                  )}
                >
                  {isFilled && (
                    <div
                      className={cn(
                        "text-primary",
                        isAnimating && "animate-bounce"
                      )}
                    >
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Text */}
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">
                {isComplete ? "Recompensa disponible" : "Progreso"}
              </p>
              <p className="text-white font-bold text-lg">
                {isComplete ? reward : `${currentStamps} / ${totalStamps} sellos`}
              </p>
            </div>

            {demoMode && !isComplete && (
              <div className="text-right">
                <p className="text-white/60 text-xs">Toca para probar</p>
                <p className="text-white/80 text-sm">+1 sello demo</p>
              </div>
            )}

            {canRedeem && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRedeem();
                }}
                disabled={redeeming}
                className="px-4 py-2 bg-white text-primary font-bold rounded-lg shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 flex items-center gap-2"
              >
                {redeeming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Gift className="w-4 h-4" />
                )}
                Canjear
              </button>
            )}
          </div>

          {/* Stats */}
          {loyalty && (
            <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-white/60 text-xs">
              <span>Total ganados: {loyalty.totalStampsEarned}</span>
              <span>Canjeados: {loyalty.totalRewardsRedeemed}</span>
            </div>
          )}

          {/* Card Number */}
          {loyalty && (
            <div className="absolute bottom-4 right-6 text-white/30 text-xs font-mono">
              **** {loyalty.phone.slice(-4)}
            </div>
          )}
        </div>

        {/* Instructions */}
        {demoMode && !isComplete && (
          <p className="text-center text-slate-500 text-sm mt-3">
            Toca la tarjeta para simular un sello
          </p>
        )}

        {!demoMode && loyalty && (
          <p className="text-center text-slate-500 text-sm mt-3">
            Ganas sellos con cada compra
          </p>
        )}
      </div>
    );
  };

  if (standalone) {
    return (
      <SectionObserver id="loyalty" threshold={0.3} className="py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <ScrollReveal>
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-2">
                Tu Tarjeta de <span className="text-gradient-gold">Fidelidad</span>
              </h2>
              <p className="text-slate-400">
                Acumula sellos y obtén recompensas exclusivas
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            {renderContent()}
          </ScrollReveal>
        </div>
      </SectionObserver>
    );
  }

  return renderContent();
}
