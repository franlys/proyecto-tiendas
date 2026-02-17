"use client";

import { Check, Eye, Smile, Sparkles } from "lucide-react";
import {
    EYE_DETAILS,
    LIP_DETAILS,
    SKIN_DETAILS,
    type EyeDetail,
    type LipDetail,
    type SkinDetail,
    type DetailOption,
} from "@/lib/types/beauty-consultation.types";

interface MultiSelectProps<T extends string> {
    options: DetailOption[];
    selected: T[];
    onChange: (selected: T[]) => void;
    maxSelections?: number;
}

function MultiSelectGrid<T extends string>({
    options,
    selected,
    onChange,
    maxSelections = 3,
}: MultiSelectProps<T>) {
    const handleToggle = (id: T) => {
        if (selected.includes(id)) {
            onChange(selected.filter(s => s !== id));
        } else if (selected.length < maxSelections) {
            onChange([...selected, id]);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => {
                const isSelected = selected.includes(option.id as T);
                const isDisabled = !isSelected && selected.length >= maxSelections;

                return (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => handleToggle(option.id as T)}
                        disabled={isDisabled}
                        className={`
                            px-3 py-2 rounded-xl border transition-all flex items-center gap-2
                            ${isSelected
                                ? "border-pink-500 bg-pink-500/20 text-pink-300"
                                : isDisabled
                                    ? "border-white/5 bg-white/5 text-slate-600 cursor-not-allowed"
                                    : "border-white/10 text-slate-300 hover:border-white/30 hover:bg-white/5"
                            }
                        `}
                    >
                        <span>{option.icon}</span>
                        <span className="text-sm">{option.label}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                    </button>
                );
            })}
        </div>
    );
}

// Eye Details Selector
interface EyeDetailsSelectorProps {
    selected: EyeDetail[];
    onChange: (selected: EyeDetail[]) => void;
}

export function EyeDetailsSelector({ selected, onChange }: EyeDetailsSelectorProps) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-purple-400" />
                <label className="text-sm font-medium text-white">
                    Detalles para los ojos
                </label>
                <span className="text-xs text-slate-500">(máx. 3)</span>
            </div>
            <MultiSelectGrid<EyeDetail>
                options={EYE_DETAILS}
                selected={selected}
                onChange={onChange}
                maxSelections={3}
            />
        </div>
    );
}

// Lip Details Selector
interface LipDetailsSelectorProps {
    selected: LipDetail[];
    onChange: (selected: LipDetail[]) => void;
}

export function LipDetailsSelector({ selected, onChange }: LipDetailsSelectorProps) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <Smile className="w-4 h-4 text-red-400" />
                <label className="text-sm font-medium text-white">
                    Preferencia de labios
                </label>
                <span className="text-xs text-slate-500">(máx. 2)</span>
            </div>
            <MultiSelectGrid<LipDetail>
                options={LIP_DETAILS}
                selected={selected}
                onChange={onChange}
                maxSelections={2}
            />
        </div>
    );
}

// Skin Details Selector
interface SkinDetailsSelectorProps {
    selected: SkinDetail[];
    onChange: (selected: SkinDetail[]) => void;
}

export function SkinDetailsSelector({ selected, onChange }: SkinDetailsSelectorProps) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <label className="text-sm font-medium text-white">
                    Acabado de piel
                </label>
                <span className="text-xs text-slate-500">(máx. 2)</span>
            </div>
            <MultiSelectGrid<SkinDetail>
                options={SKIN_DETAILS}
                selected={selected}
                onChange={onChange}
                maxSelections={2}
            />
        </div>
    );
}

// Combined Details Section
interface DetailsSectionProps {
    eyeDetails: EyeDetail[];
    lipDetails: LipDetail[];
    skinDetails: SkinDetail[];
    onEyeChange: (selected: EyeDetail[]) => void;
    onLipChange: (selected: LipDetail[]) => void;
    onSkinChange: (selected: SkinDetail[]) => void;
}

export function DetailsSection({
    eyeDetails,
    lipDetails,
    skinDetails,
    onEyeChange,
    onLipChange,
    onSkinChange,
}: DetailsSectionProps) {
    return (
        <div className="space-y-6">
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-1">
                    Personaliza tu look
                </h3>
                <p className="text-sm text-slate-400">
                    Selecciona los detalles específicos que te gustaría incluir
                </p>
            </div>

            <div className="space-y-6">
                <EyeDetailsSelector selected={eyeDetails} onChange={onEyeChange} />
                <LipDetailsSelector selected={lipDetails} onChange={onLipChange} />
                <SkinDetailsSelector selected={skinDetails} onChange={onSkinChange} />
            </div>

            {/* Summary */}
            {(eyeDetails.length > 0 || lipDetails.length > 0 || skinDetails.length > 0) && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
                    <p className="text-sm text-pink-300 mb-2">Tu selección:</p>
                    <div className="flex flex-wrap gap-1">
                        {eyeDetails.map(id => {
                            const opt = EYE_DETAILS.find(d => d.id === id);
                            return opt && (
                                <span key={id} className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-xs">
                                    {opt.icon} {opt.label}
                                </span>
                            );
                        })}
                        {lipDetails.map(id => {
                            const opt = LIP_DETAILS.find(d => d.id === id);
                            return opt && (
                                <span key={id} className="px-2 py-0.5 rounded-full bg-red-500/30 text-red-200 text-xs">
                                    {opt.icon} {opt.label}
                                </span>
                            );
                        })}
                        {skinDetails.map(id => {
                            const opt = SKIN_DETAILS.find(d => d.id === id);
                            return opt && (
                                <span key={id} className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 text-xs">
                                    {opt.icon} {opt.label}
                                </span>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
