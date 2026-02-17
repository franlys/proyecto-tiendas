"use client";

import { Check, Sparkles } from "lucide-react";
import {
    MAKEUP_STYLES,
    type MakeupStyle,
    type EventType,
    getSuggestedStylesForEvent,
} from "@/lib/types/beauty-consultation.types";

interface MakeupStyleSelectorProps {
    selected?: MakeupStyle;
    onChange: (style: MakeupStyle) => void;
    eventType?: EventType;
    showSuggestions?: boolean;
}

export function MakeupStyleSelector({
    selected,
    onChange,
    eventType,
    showSuggestions = true,
}: MakeupStyleSelectorProps) {
    const suggestedStyles = eventType ? getSuggestedStylesForEvent(eventType) : [];
    const suggestedIds = suggestedStyles.map(s => s.id);

    // Intensity indicator
    const IntensityBar = ({ level }: { level: number }) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${i <= level
                        ? level <= 2 ? "bg-green-400" :
                            level <= 3 ? "bg-yellow-400" :
                                "bg-orange-400"
                        : "bg-white/20"
                        }`}
                />
            ))}
        </div>
    );

    return (
        <div>
            <label className="block text-sm font-medium text-white mb-3">
                ¿Qué estilo de maquillaje prefieres?
            </label>

            {/* Suggestions */}
            {showSuggestions && suggestedStyles.length > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-pink-500/10 border border-pink-500/20">
                    <p className="text-xs text-pink-300 flex items-center gap-1 mb-2">
                        <Sparkles className="w-3 h-3" />
                        Sugeridos para tu evento:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {suggestedStyles.map((style) => (
                            <button
                                key={style.id}
                                type="button"
                                onClick={() => onChange(style.id)}
                                className={`
                                    px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-all
                                    ${selected === style.id
                                        ? "bg-pink-500 text-white"
                                        : "bg-pink-500/20 text-pink-300 hover:bg-pink-500/30"
                                    }
                                `}
                            >
                                <span>{style.icon}</span>
                                <span>{style.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* All Styles Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {MAKEUP_STYLES.map((style) => {
                    const isSuggested = suggestedIds.includes(style.id);

                    return (
                        <button
                            key={style.id}
                            type="button"
                            onClick={() => onChange(style.id)}
                            className={`
                                relative p-4 rounded-xl border transition-all text-left
                                ${selected === style.id
                                    ? "border-pink-500 bg-pink-500/20"
                                    : isSuggested
                                        ? "border-pink-500/30 hover:border-pink-500/50 hover:bg-pink-500/10"
                                        : "border-white/10 hover:border-white/30 hover:bg-white/5"
                                }
                            `}
                        >
                            {/* Suggested Badge */}
                            {isSuggested && selected !== style.id && (
                                <div className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-pink-500 text-[10px] text-white font-medium">
                                    <Sparkles className="w-2.5 h-2.5 inline" />
                                </div>
                            )}

                            {/* Icon & Check */}
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-2xl">{style.icon}</span>
                                {selected === style.id && (
                                    <Check className="w-4 h-4 text-pink-400" />
                                )}
                            </div>

                            {/* Label */}
                            <p className={`font-medium text-sm ${selected === style.id ? "text-pink-400" : "text-white"}`}>
                                {style.label}
                            </p>

                            {/* Description */}
                            <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                {style.description}
                            </p>

                            {/* Intensity */}
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-[10px] text-slate-500">Intensidad:</span>
                                <IntensityBar level={style.intensity} />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

// Characteristics display for selected style
export function MakeupStyleCharacteristics({ styleId }: { styleId: MakeupStyle }) {
    const style = MAKEUP_STYLES.find(s => s.id === styleId);
    if (!style) return null;

    return (
        <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">{style.icon}</span>
                <span className="font-medium text-white">{style.label}</span>
            </div>
            <p className="text-sm text-slate-300 mb-3">{style.description}</p>
            <div className="flex flex-wrap gap-2">
                {style.characteristics.map((char, idx) => (
                    <span
                        key={idx}
                        className="px-2 py-1 rounded-full bg-pink-500/20 text-pink-300 text-xs"
                    >
                        {char}
                    </span>
                ))}
            </div>
        </div>
    );
}
