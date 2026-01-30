"use client";

import Image from "next/image";
import { Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/shared";
import type { Service } from "@/lib/constants";

interface ServiceCardProps {
  service: Service;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const { addService, removeItem, isInCart } = useCart();
  const inCart = isInCart(service.id);

  const handleToggle = () => {
    if (inCart) {
      removeItem(service.id);
    } else {
      addService(service);
    }
  };

  return (
    <div className="group relative">
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-surface">
        <Image
          src={service.image}
          alt={service.name}
          fill
          className={cn(
            "object-cover transition-transform duration-500",
            "group-hover:scale-110"
          )}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Add/Remove Button */}
        <button
          onClick={handleToggle}
          className={cn(
            "absolute bottom-3 right-3 z-10",
            "w-10 h-10 rounded-full",
            "flex items-center justify-center",
            "transition-all duration-300",
            "shadow-lg",
            inCart
              ? "bg-primary text-white"
              : "bg-white/90 text-background hover:bg-white hover:scale-110"
          )}
          aria-label={inCart ? "Quitar del carrito" : "Añadir al carrito"}
        >
          {inCart ? (
            <Check className="w-5 h-5" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>

        {/* Price Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-sm font-medium">
            ${service.price.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-3 px-1">
        <h3 className="font-display text-lg font-semibold text-white truncate">
          {service.name}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-1">
          {service.description}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {service.duration} min
        </p>
      </div>
    </div>
  );
}
