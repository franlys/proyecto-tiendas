"use client";

import { useState } from "react";
import { Check, HelpCircle } from "lucide-react";
import { SKIN_TONES, UNDERTONES, type SkinTone, type Undertone } from "@/lib/types/beauty-consultation.types";

interface SkinToneSelectorProps {
    selectedTone?: SkinTone;
    selectedUndertone?: Undertone;
    onToneChange: (tone: SkinTone) => void;
    onUndertoneChange: (undertone: Undertone) => void;
    showUndertone?: boolean;
}

export function SkinToneSelector({
    selectedTone,
    selectedUndertone,
    onToneChange,
    onUndertoneChange,
    showUndertone = true,
}: SkinToneSelectorProps) {
    const [showHelp, setShowHelp] = useState(false);

    return (
        <div className="space-y-6">
            {/* Skin Tone Selection */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-white">
                        ¿Cuál es tu tono de piel?
                    </label>
                    <button
                        type="button"
                        onClick={() => setShowHelp(!showHelp)}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>
                </div>

                {showHelp && (
                    <div className="mb-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-sm text-purple-200">
                        <p className="font-medium mb-2">¿Cómo identificar tu tono?</p>
                        <ul className="list-disc list-inside space-y-1 text-purple-300">
                            <li>Mira tu muñeca bajo luz natural</li>
                            <li>Compara con las opciones sin maquillaje</li>
                            <li>Si no estás segura, elige el más cercano</li>
                        </ul>
                    </div>
                )}

                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {SKIN_TONES.map((tone) => (
                        <button
                            key={tone.id}
                            type="button"
                            onClick={() => onToneChange(tone.id)}
                            className={`
                                relative group flex flex-col items-center p-2 rounded-xl transition-all
                                ${selectedTone === tone.id
                                    ? "ring-2 ring-purple-500 bg-purple-500/20"
                                    : "hover:bg-white/5"
                                }
                            `}
                        >
                            {/* Color Circle */}
                            <div
                                className={`
                                    w-12 h-12 rounded-full border-2 transition-all
                                    ${selectedTone === tone.id
                                        ? "border-purple-500 scale-110"
                                        : "border-white/20 group-hover:border-white/40"
                                    }
                                `}
                                style={{ backgroundColor: tone.colorHex }}
                            >
                                {selectedTone === tone.id && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Check className="w-5 h-5 text-white drop-shadow-lg" />
                                    </div>
                                )}
                            </div>

                            {/* Label */}
                            <span className={`
                                mt-2 text-xs text-center leading-tight
                                ${selectedTone === tone.id ? "text-purple-400 font-medium" : "text-slate-400"}
                            `}>
                                {tone.label}
                            </span>

                            {/* Tooltip on Hover */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-slate-800 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                {tone.description}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Undertone Selection */}
            {showUndertone && selectedTone && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-medium text-white mb-3">
                        ¿Cuál es tu subtono?
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {UNDERTONES.map((undertone) => (
                            <button
                                key={undertone.id}
                                type="button"
                                onClick={() => onUndertoneChange(undertone.id)}
                                className={`
                                    relative p-4 rounded-xl border transition-all text-left
                                    ${selectedUndertone === undertone.id
                                        ? "border-purple-500 bg-purple-500/20"
                                        : "border-white/10 hover:border-white/30 hover:bg-white/5"
                                    }
                                `}
                            >
                                {/* Header */}
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`
                                        w-6 h-6 rounded-full flex items-center justify-center
                                        ${undertone.id === "warm" ? "bg-orange-500/30" :
                                            undertone.id === "cool" ? "bg-blue-500/30" :
                                                "bg-purple-500/30"
                                        }
                                    `}>
                                        {undertone.id === "warm" && <span>🌞</span>}
                                        {undertone.id === "cool" && <span>❄️</span>}
                                        {undertone.id === "neutral" && <span>⚖️</span>}
                                    </div>
                                    <span className={`font-medium ${selectedUndertone === undertone.id ? "text-purple-400" : "text-white"}`}>
                                        {undertone.label}
                                    </span>
                                    {selectedUndertone === undertone.id && (
                                        <Check className="w-4 h-4 text-purple-400 ml-auto" />
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-xs text-slate-400 mb-2">{undertone.description}</p>

                                {/* Indicators */}
                                <div className="space-y-1">
                                    {undertone.indicators.map((indicator, idx) => (
                                        <p key={idx} className="text-xs text-slate-500 flex items-center gap-1">
                                            <span className="w-1 h-1 rounded-full bg-slate-500" />
                                            {indicator}
                                        </p>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
