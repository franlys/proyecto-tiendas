"use client";

import { useState, useCallback } from "react";
import { Plus, Minus, Check } from "lucide-react";
import { Button } from "@/components/ui";
import type { ProductExtra, SelectedExtra } from "@/lib/types/product-extra.types";
import { cn } from "@/lib/utils";

interface ExtrasSelectorProps {
    extras: ProductExtra[];
    selectedExtras: SelectedExtra[];
    onExtrasChange: (extras: SelectedExtra[]) => void;
    maxExtras?: number;
    required?: boolean;
    className?: string;
}

export function ExtrasSelector({
    extras,
    selectedExtras,
    onExtrasChange,
    maxExtras,
    required = false,
    className,
}: ExtrasSelectorProps) {
    // Get quantity for a specific extra
    const getExtraQuantity = (extraId: string) => {
        const selected = selectedExtras.find(e => e.extraId === extraId);
        return selected?.quantity || 0;
    };

    // Total selected extras count
    const totalSelected = selectedExtras.reduce((sum, e) => sum + e.quantity, 0);

    // Check if can add more
    const canAddMore = !maxExtras || totalSelected < maxExtras;

    // Toggle extra (add/remove)
    const toggleExtra = useCallback((extra: ProductExtra) => {
        const existing = selectedExtras.find(e => e.extraId === extra.id);

        if (existing) {
            // Remove if already selected
            onExtrasChange(selectedExtras.filter(e => e.extraId !== extra.id));
        } else if (canAddMore) {
            // Add new extra
            onExtrasChange([
                ...selectedExtras,
                {
                    extraId: extra.id,
                    name: extra.name,
                    price: extra.price,
                    quantity: 1,
                }
            ]);
        }
    }, [selectedExtras, onExtrasChange, canAddMore]);

    // Update quantity for an extra
    const updateQuantity = useCallback((extra: ProductExtra, delta: number) => {
        const existing = selectedExtras.find(e => e.extraId === extra.id);
        const maxQty = extra.maxQuantity || 5;

        if (!existing && delta > 0 && canAddMore) {
            // Add new
            onExtrasChange([
                ...selectedExtras,
                {
                    extraId: extra.id,
                    name: extra.name,
                    price: extra.price,
                    quantity: 1,
                }
            ]);
        } else if (existing) {
            const newQty = existing.quantity + delta;

            if (newQty <= 0) {
                // Remove
                onExtrasChange(selectedExtras.filter(e => e.extraId !== extra.id));
            } else if (newQty <= maxQty && (delta < 0 || canAddMore)) {
                // Update quantity
                onExtrasChange(
                    selectedExtras.map(e =>
                        e.extraId === extra.id
                            ? { ...e, quantity: newQty }
                            : e
                    )
                );
            }
        }
    }, [selectedExtras, onExtrasChange, canAddMore]);

    // Calculate total extras price
    const extrasTotal = selectedExtras.reduce((sum, e) => sum + (e.price * e.quantity), 0);

    if (!extras || extras.length === 0) return null;

    return (
        <div className={cn("space-y-3", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-white">
                    Extras {required && <span className="text-red-400">*</span>}
                </h4>
                {maxExtras && (
                    <span className="text-xs text-slate-400">
                        {totalSelected}/{maxExtras} seleccionados
                    </span>
                )}
            </div>

            {/* Extras Grid */}
            <div className="grid grid-cols-2 gap-2">
                {extras.filter(e => e.available !== false).map((extra) => {
                    const quantity = getExtraQuantity(extra.id);
                    const isSelected = quantity > 0;
                    const maxQty = extra.maxQuantity || 5;

                    return (
                        <div
                            key={extra.id}
                            className={cn(
                                "relative rounded-xl border p-3 transition-all cursor-pointer",
                                isSelected
                                    ? "border-primary bg-primary/10"
                                    : "border-white/10 bg-white/5 hover:border-white/20",
                                !canAddMore && !isSelected && "opacity-50 cursor-not-allowed"
                            )}
                            onClick={() => {
                                if (maxQty === 1) {
                                    toggleExtra(extra);
                                }
                            }}
                        >
                            {/* Selected indicator */}
                            {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}

                            {/* Extra info */}
                            <div className="flex items-center gap-2 mb-2">
                                {extra.image && (
                                    <img
                                        src={extra.image}
                                        alt={extra.name}
                                        className="w-8 h-8 rounded-lg object-cover"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">
                                        {extra.name}
                                    </p>
                                    <p className="text-xs text-primary font-semibold">
                                        +${extra.price.toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Quantity controls (if maxQty > 1) */}
                            {maxQty > 1 && isSelected && (
                                <div className="flex items-center justify-center gap-3 mt-2 pt-2 border-t border-white/10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateQuantity(extra, -1);
                                        }}
                                        className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="text-white font-bold min-w-[20px] text-center">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateQuantity(extra, 1);
                                        }}
                                        disabled={quantity >= maxQty || !canAddMore}
                                        className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 disabled:opacity-50"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Add button for multi-quantity items when not selected */}
                            {maxQty > 1 && !isSelected && canAddMore && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full mt-2 h-7 text-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateQuantity(extra, 1);
                                    }}
                                >
                                    <Plus className="w-3 h-3 mr-1" />
                                    Agregar
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Total extras price */}
            {extrasTotal > 0 && (
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <span className="text-sm text-slate-400">Extras:</span>
                    <span className="text-sm font-semibold text-primary">
                        +${extrasTotal.toLocaleString()}
                    </span>
                </div>
            )}

            {/* Required warning */}
            {required && selectedExtras.length === 0 && (
                <p className="text-xs text-amber-400">
                    * Debes seleccionar al menos un extra
                </p>
            )}
        </div>
    );
}
