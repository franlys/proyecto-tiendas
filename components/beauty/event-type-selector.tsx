"use client";

import { Check } from "lucide-react";
import { EVENT_TYPES, type EventType } from "@/lib/types/beauty-consultation.types";

interface EventTypeSelectorProps {
    selected?: EventType;
    onChange: (eventType: EventType) => void;
    columns?: 2 | 3 | 4;
}

export function EventTypeSelector({
    selected,
    onChange,
    columns = 4,
}: EventTypeSelectorProps) {
    const gridCols = {
        2: "grid-cols-2",
        3: "grid-cols-2 sm:grid-cols-3",
        4: "grid-cols-2 sm:grid-cols-4",
    };

    return (
        <div>
            <label className="block text-sm font-medium text-white mb-3">
                ¿Para qué tipo de evento es?
            </label>

            <div className={`grid ${gridCols[columns]} gap-3`}>
                {EVENT_TYPES.map((event) => (
                    <button
                        key={event.id}
                        type="button"
                        onClick={() => onChange(event.id)}
                        className={`
                            relative p-4 rounded-xl border transition-all text-left
                            ${selected === event.id
                                ? "border-pink-500 bg-pink-500/20"
                                : "border-white/10 hover:border-white/30 hover:bg-white/5"
                            }
                        `}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">{event.icon}</span>
                            <span className={`
                                font-medium
                                ${selected === event.id ? "text-pink-400" : "text-white"}
                            `}>
                                {event.label}
                            </span>
                            {selected === event.id && (
                                <Check className="w-4 h-4 text-pink-400 ml-auto" />
                            )}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}

// Compact version for mobile or small spaces
export function EventTypeSelectorCompact({
    selected,
    onChange,
}: EventTypeSelectorProps) {
    return (
        <div>
            <label className="block text-sm font-medium text-white mb-3">
                Tipo de evento
            </label>

            <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map((event) => (
                    <button
                        key={event.id}
                        type="button"
                        onClick={() => onChange(event.id)}
                        className={`
                            px-3 py-2 rounded-full border transition-all flex items-center gap-2
                            ${selected === event.id
                                ? "border-pink-500 bg-pink-500/20 text-pink-400"
                                : "border-white/10 text-slate-300 hover:border-white/30 hover:bg-white/5"
                            }
                        `}
                    >
                        <span>{event.icon}</span>
                        <span className="text-sm font-medium">{event.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
