"use client";

import { useState, useEffect } from "react";
import {
    Heart,
    Star,
    X,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Sun,
    Moon,
    Crown,
    GraduationCap,
    Camera,
    Briefcase,
    PartyPopper,
    Gem
} from "lucide-react";
import {
    type EventType,
    type MakeupStyle,
    type SkinTone,
    SKIN_TONES,
} from "@/lib/types/beauty-consultation.types";

// Types for looks gallery
export interface LookItem {
    id: string;
    title: string;
    imageUrl: string;
    thumbnailUrl?: string;
    eventTypes: EventType[];
    styles: MakeupStyle[];
    skinTones: SkinTone[];
    description?: string;
    products?: string[];
    duration?: number; // in minutes
    featured?: boolean;
    likes?: number;
}

interface LooksGalleryProps {
    looks: LookItem[];
    selectedLooks: string[];
    onSelectLook: (lookId: string) => void;
    onDeselectLook: (lookId: string) => void;
    maxSelections?: number;
    filterByEvent?: EventType;
    filterByStyle?: MakeupStyle;
    filterBySkinTone?: SkinTone;
    showFilters?: boolean;
    compact?: boolean;
}

// Category configuration
const LOOK_CATEGORIES: Array<{
    id: string;
    name: string;
    icon: typeof Sparkles;
    eventType?: EventType;
}> = [
    { id: "all", name: "Todos", icon: Sparkles },
    { id: "wedding", name: "Novias", icon: Crown, eventType: "wedding_bride" },
    { id: "quinceanera", name: "XV Años", icon: Star, eventType: "quinceanera" },
    { id: "graduation", name: "Graduación", icon: GraduationCap, eventType: "graduation" },
    { id: "prom", name: "Prom/Baile", icon: PartyPopper, eventType: "prom" },
    { id: "photoshoot", name: "Fotos", icon: Camera, eventType: "photoshoot" },
    { id: "corporate", name: "Corporativo", icon: Briefcase, eventType: "work" },
    { id: "glam", name: "Glam", icon: Gem, eventType: "gala" },
    { id: "day", name: "Día", icon: Sun },
    { id: "night", name: "Noche", icon: Moon },
];

export function LooksGallery({
    looks,
    selectedLooks,
    onSelectLook,
    onDeselectLook,
    maxSelections = 3,
    filterByEvent,
    filterByStyle,
    filterBySkinTone,
    showFilters = true,
    compact = false,
}: LooksGalleryProps) {
    const [activeCategory, setActiveCategory] = useState("all");
    const [filteredLooks, setFilteredLooks] = useState<LookItem[]>(looks);
    const [expandedLook, setExpandedLook] = useState<LookItem | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    // Filter looks based on category and props
    useEffect(() => {
        let filtered = [...looks];

        // Apply category filter
        if (activeCategory !== "all") {
            const category = LOOK_CATEGORIES.find(c => c.id === activeCategory);
            if (category?.eventType) {
                filtered = filtered.filter(look =>
                    look.eventTypes.includes(category.eventType!)
                );
            } else if (activeCategory === "day") {
                const dayStyles: MakeupStyle[] = ["natural", "no_makeup", "soft_glam"];
                filtered = filtered.filter(look =>
                    look.styles.some(s => dayStyles.includes(s))
                );
            } else if (activeCategory === "night") {
                const nightStyles: MakeupStyle[] = ["glamour", "dramatic", "elegant"];
                filtered = filtered.filter(look =>
                    look.styles.some(s => nightStyles.includes(s))
                );
            }
        }

        // Apply prop filters
        if (filterByEvent) {
            filtered = filtered.filter(look => look.eventTypes.includes(filterByEvent));
        }
        if (filterByStyle) {
            filtered = filtered.filter(look => look.styles.includes(filterByStyle));
        }
        if (filterBySkinTone) {
            filtered = filtered.filter(look => look.skinTones.includes(filterBySkinTone));
        }

        // Sort: featured first, then by likes
        filtered.sort((a, b) => {
            if (a.featured && !b.featured) return -1;
            if (!a.featured && b.featured) return 1;
            return (b.likes || 0) - (a.likes || 0);
        });

        setFilteredLooks(filtered);
    }, [looks, activeCategory, filterByEvent, filterByStyle, filterBySkinTone]);

    const isSelected = (lookId: string) => selectedLooks.includes(lookId);
    const canSelect = selectedLooks.length < maxSelections;

    const handleLookClick = (look: LookItem) => {
        if (compact) {
            // In compact mode, toggle selection directly
            if (isSelected(look.id)) {
                onDeselectLook(look.id);
            } else if (canSelect) {
                onSelectLook(look.id);
            }
        } else {
            // In full mode, expand the look
            setExpandedLook(look);
        }
    };

    return (
        <div>
            {/* Category Filters */}
            {showFilters && (
                <div className="mb-4 overflow-x-auto pb-2">
                    <div className="flex gap-2 min-w-max">
                        {LOOK_CATEGORIES.map(category => {
                            const Icon = category.icon;
                            const isActive = activeCategory === category.id;
                            return (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`
                                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
                                        transition-all duration-200
                                        ${isActive
                                            ? "bg-pink-500 text-white"
                                            : "bg-white/10 text-slate-300 hover:bg-white/20"
                                        }
                                    `}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span>{category.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Selection Counter */}
            <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">
                    {filteredLooks.length} looks disponibles
                </p>
                <p className="text-sm text-pink-400">
                    {selectedLooks.length}/{maxSelections} seleccionados
                </p>
            </div>

            {/* Looks Grid */}
            {filteredLooks.length > 0 ? (
                <div className={`grid gap-3 ${compact ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-3"}`}>
                    {filteredLooks.map(look => (
                        <LookCard
                            key={look.id}
                            look={look}
                            isSelected={isSelected(look.id)}
                            canSelect={canSelect}
                            onClick={() => handleLookClick(look)}
                            onSelect={() => onSelectLook(look.id)}
                            onDeselect={() => onDeselectLook(look.id)}
                            compact={compact}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No hay looks en esta categoría</p>
                    <button
                        type="button"
                        onClick={() => setActiveCategory("all")}
                        className="mt-2 text-pink-400 text-sm hover:underline"
                    >
                        Ver todos los looks
                    </button>
                </div>
            )}

            {/* Expanded Look Modal */}
            {expandedLook && (
                <LookModal
                    look={expandedLook}
                    isSelected={isSelected(expandedLook.id)}
                    canSelect={canSelect}
                    onSelect={() => onSelectLook(expandedLook.id)}
                    onDeselect={() => onDeselectLook(expandedLook.id)}
                    onClose={() => setExpandedLook(null)}
                />
            )}
        </div>
    );
}

// Individual Look Card
interface LookCardProps {
    look: LookItem;
    isSelected: boolean;
    canSelect: boolean;
    onClick: () => void;
    onSelect: () => void;
    onDeselect: () => void;
    compact?: boolean;
}

function LookCard({
    look,
    isSelected,
    canSelect,
    onClick,
    onSelect,
    onDeselect,
    compact,
}: LookCardProps) {
    return (
        <div
            className={`
                relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer
                group transition-all duration-200
                ${isSelected
                    ? "ring-2 ring-pink-500 ring-offset-2 ring-offset-slate-900"
                    : "hover:scale-[1.02]"
                }
            `}
            onClick={onClick}
        >
            {/* Image */}
            <img
                src={look.thumbnailUrl || look.imageUrl}
                alt={look.title}
                className="w-full h-full object-cover"
            />

            {/* Featured Badge */}
            {look.featured && (
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-yellow-500/90 text-black text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    <span>Destacado</span>
                </div>
            )}

            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-white fill-white" />
                </div>
            )}

            {/* Hover Overlay */}
            <div className={`
                absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
                ${compact ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                transition-opacity duration-200
            `}>
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h4 className="text-white font-medium text-sm mb-1 line-clamp-1">
                        {look.title}
                    </h4>
                    {!compact && (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    isSelected ? onDeselect() : onSelect();
                                }}
                                disabled={!isSelected && !canSelect}
                                className={`
                                    flex items-center gap-1 px-2 py-1 rounded-full text-xs
                                    transition-colors
                                    ${isSelected
                                        ? "bg-pink-500 text-white"
                                        : canSelect
                                            ? "bg-white/20 text-white hover:bg-pink-500"
                                            : "bg-white/10 text-white/50 cursor-not-allowed"
                                    }
                                `}
                            >
                                <Heart className={`w-3 h-3 ${isSelected ? "fill-current" : ""}`} />
                                {isSelected ? "Seleccionado" : "Seleccionar"}
                            </button>
                            {look.likes && (
                                <span className="text-white/60 text-xs">
                                    {look.likes} likes
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Look Detail Modal
interface LookModalProps {
    look: LookItem;
    isSelected: boolean;
    canSelect: boolean;
    onSelect: () => void;
    onDeselect: () => void;
    onClose: () => void;
}

function LookModal({
    look,
    isSelected,
    canSelect,
    onSelect,
    onDeselect,
    onClose,
}: LookModalProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={onClose}
        >
            <div
                className="relative max-w-lg w-full bg-slate-900 rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Image */}
                <div className="aspect-[3/4] relative">
                    <img
                        src={look.imageUrl}
                        alt={look.title}
                        className="w-full h-full object-cover"
                    />
                    {look.featured && (
                        <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-yellow-500/90 text-black text-sm font-medium flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            <span>Look Destacado</span>
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="p-5">
                    <h3 className="text-xl font-semibold text-white mb-2">
                        {look.title}
                    </h3>

                    {look.description && (
                        <p className="text-slate-400 text-sm mb-4">
                            {look.description}
                        </p>
                    )}

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {look.eventTypes.slice(0, 3).map(event => (
                            <span
                                key={event}
                                className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs"
                            >
                                {event.replace(/_/g, " ")}
                            </span>
                        ))}
                        {look.styles.slice(0, 2).map(style => (
                            <span
                                key={style}
                                className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-xs"
                            >
                                {style.replace(/_/g, " ")}
                            </span>
                        ))}
                    </div>

                    {/* Skin Tones */}
                    {look.skinTones.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs text-slate-500 mb-2">Ideal para tonos de piel:</p>
                            <div className="flex gap-1">
                                {look.skinTones.map(tone => {
                                    const toneData = SKIN_TONES.find(t => t.id === tone);
                                    return (
                                        <div
                                            key={tone}
                                            className="w-6 h-6 rounded-full border border-white/20"
                                            style={{ backgroundColor: toneData?.colorHex }}
                                            title={toneData?.label}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Duration */}
                    {look.duration && (
                        <p className="text-sm text-slate-500 mb-4">
                            Duración estimada: {look.duration} minutos
                        </p>
                    )}

                    {/* Products */}
                    {look.products && look.products.length > 0 && (
                        <div className="mb-4">
                            <p className="text-xs text-slate-500 mb-2">Productos utilizados:</p>
                            <div className="flex flex-wrap gap-1">
                                {look.products.map((product, i) => (
                                    <span
                                        key={i}
                                        className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 text-xs"
                                    >
                                        {product}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <button
                        type="button"
                        onClick={() => {
                            isSelected ? onDeselect() : onSelect();
                            onClose();
                        }}
                        disabled={!isSelected && !canSelect}
                        className={`
                            w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2
                            transition-colors
                            ${isSelected
                                ? "bg-pink-500/20 text-pink-300 hover:bg-pink-500/30"
                                : canSelect
                                    ? "bg-pink-500 text-white hover:bg-pink-600"
                                    : "bg-slate-700 text-slate-400 cursor-not-allowed"
                            }
                        `}
                    >
                        <Heart className={`w-5 h-5 ${isSelected ? "fill-current" : ""}`} />
                        {isSelected
                            ? "Quitar de favoritos"
                            : canSelect
                                ? "Agregar a mis favoritos"
                                : "Límite de selección alcanzado"
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}

// Sample Looks Data (for demo purposes)
export const SAMPLE_LOOKS: LookItem[] = [
    {
        id: "look-1",
        title: "Novia Clásica Elegante",
        imageUrl: "/images/looks/bridal-classic.jpg",
        eventTypes: ["wedding_bride"],
        styles: ["elegant"],
        skinTones: ["very_light", "light", "medium"],
        description: "Look nupcial atemporal con acabado luminoso y elegante",
        duration: 90,
        featured: true,
        likes: 234,
    },
    {
        id: "look-2",
        title: "XV Años Romántica",
        imageUrl: "/images/looks/quince-romantic.jpg",
        eventTypes: ["quinceanera"],
        styles: ["romantic", "soft_glam"],
        skinTones: ["light", "medium", "medium_tan"],
        description: "Maquillaje dulce y femenino perfecto para quinceañera",
        duration: 75,
        likes: 189,
    },
    {
        id: "look-3",
        title: "Graduación Fresh",
        imageUrl: "/images/looks/graduation-fresh.jpg",
        eventTypes: ["graduation"],
        styles: ["natural"],
        skinTones: ["light", "medium", "medium_tan", "tan"],
        description: "Look fresco y juvenil para fotos de graduación",
        duration: 45,
        likes: 156,
    },
    {
        id: "look-4",
        title: "Glam de Noche",
        imageUrl: "/images/looks/night-glam.jpg",
        eventTypes: ["gala", "party", "date_night"],
        styles: ["glamour", "dramatic"],
        skinTones: ["medium", "medium_tan", "tan", "dark"],
        description: "Maquillaje glamuroso para eventos de noche",
        duration: 60,
        featured: true,
        likes: 278,
    },
    {
        id: "look-5",
        title: "Editorial Artístico",
        imageUrl: "/images/looks/editorial.jpg",
        eventTypes: ["photoshoot"],
        styles: ["artistic", "dramatic"],
        skinTones: ["very_light", "light", "medium", "dark", "very_dark"],
        description: "Look creativo para sesiones editoriales",
        duration: 90,
        likes: 145,
    },
    {
        id: "look-6",
        title: "Corporativo Profesional",
        imageUrl: "/images/looks/corporate.jpg",
        eventTypes: ["work"],
        styles: ["natural", "elegant"],
        skinTones: ["light", "medium", "medium_tan", "tan"],
        description: "Maquillaje pulido para entorno profesional",
        duration: 40,
        likes: 98,
    },
    {
        id: "look-7",
        title: "Smoky Eyes Intenso",
        imageUrl: "/images/looks/smoky.jpg",
        eventTypes: ["party", "date_night"],
        styles: ["dramatic"],
        skinTones: ["medium", "medium_tan", "tan", "dark"],
        description: "Ojos ahumados para un look impactante",
        duration: 60,
        likes: 203,
    },
    {
        id: "look-8",
        title: "Novia Boho",
        imageUrl: "/images/looks/bridal-boho.jpg",
        eventTypes: ["wedding_bride"],
        styles: ["natural", "romantic"],
        skinTones: ["very_light", "light", "medium"],
        description: "Look nupcial bohemio con acabado natural",
        duration: 75,
        likes: 167,
    },
];
