"use client";

import { useState } from "react";
import Image from "next/image";
import { ChefHat, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { MealPrepModal } from "./meal-prep-modal";
import type { MealPlate } from "@/lib/types/meal-prep.types";

interface MealPrepPackageProduct {
    id: string;
    name: string;
    description: string;
    image?: string;
    plateCount: number;
    pricePerPlate: number;
    featured?: boolean;
}

interface MealPrepProductCardProps {
    product: MealPrepPackageProduct;
    shopName?: string;
    whatsappNumber?: string;
    onOrder?: (plates: MealPlate[], totalPrice: number, distance?: number) => void;
}

export function MealPrepProductCard({
    product,
    shopName,
    whatsappNumber,
    onOrder,
}: MealPrepProductCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const basePrice = product.plateCount * product.pricePerPlate;

    const handleConfirm = (plates: MealPlate[], totalPrice: number, distance?: number) => {
        onOrder?.(plates, totalPrice, distance);
        setIsModalOpen(false);
    };

    return (
        <>
            <div className="group relative">
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
                    {product.image ? (
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-600 to-emerald-700">
                            <UtensilsCrossed className="w-16 h-16 text-white/50" />
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    {/* Featured Badge */}
                    {product.featured && (
                        <div className="absolute top-3 right-3 z-10">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500 text-white text-xs font-bold">
                                <ChefHat className="w-3 h-3" />
                                POPULAR
                            </span>
                        </div>
                    )}

                    {/* Plate Count Badge */}
                    <div className="absolute top-3 left-3 z-10">
                        <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-bold">
                            {product.plateCount} platos
                        </span>
                    </div>

                    {/* Order Button */}
                    <div className="absolute bottom-3 right-3 z-10">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-xs font-bold uppercase tracking-wide shadow-lg transition-all active:scale-95"
                        >
                            Personalizar
                        </button>
                    </div>

                    {/* Price Badge */}
                    <div className="absolute bottom-3 left-3 z-10">
                        <div className="flex flex-col items-start">
                            <span className="px-3 py-1 rounded-full bg-green-500/80 backdrop-blur-sm text-white text-sm font-bold">
                                Desde ${basePrice}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Info */}
                <div className="mt-3 px-1">
                    <h3 className="font-display text-lg font-semibold text-white truncate">
                        {product.name}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-2">
                        {product.description}
                    </p>
                    <p className="text-xs text-green-400 mt-1">
                        ${product.pricePerPlate} por plato
                    </p>
                </div>
            </div>

            {/* Meal Prep Configuration Modal */}
            <MealPrepModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirm}
                shopName={shopName}
                whatsappNumber={whatsappNumber}
            />
        </>
    );
}
