"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import {
    BUSINESS_TYPES,
    CATEGORY_INFO,
    searchBusinessTypes,
    getCategoriesWithTypes,
    type BusinessTypeConfig,
    type BusinessCategory,
} from "@/lib/types/business-types-v2";

interface BusinessTypeSelectorProps {
    value: string;
    onChange: (typeId: string) => void;
    disabled?: boolean;
}

export function BusinessTypeSelector({ value, onChange, disabled }: BusinessTypeSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [expandedCategory, setExpandedCategory] = useState<BusinessCategory | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get current type
    const currentType = useMemo(() =>
        BUSINESS_TYPES.find(t => t.id === value),
        [value]
    );

    // Search results
    const filteredTypes = useMemo(() => {
        if (!search.trim()) return null;
        return searchBusinessTypes(search);
    }, [search]);

    // Categories with types
    const categoriesWithTypes = useMemo(() => getCategoriesWithTypes(), []);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSelect = (typeId: string) => {
        onChange(typeId);
        setIsOpen(false);
        setSearch("");
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-left transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10"
                    }`}
            >
                <div className="flex items-center gap-3">
                    <span className="text-2xl">{currentType?.icon || "🏬"}</span>
                    <div>
                        <p className="text-white font-medium">
                            {currentType?.label || "Seleccionar tipo de negocio"}
                        </p>
                        {currentType && (
                            <p className="text-xs text-slate-400">
                                {CATEGORY_INFO[currentType.category].label}
                            </p>
                        )}
                    </div>
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-white/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar tipo de negocio..."
                                className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Results */}
                    <div className="max-h-80 overflow-y-auto">
                        {filteredTypes ? (
                            // Search Results
                            <div className="p-2">
                                {filteredTypes.length === 0 ? (
                                    <p className="text-center text-slate-400 py-4">
                                        No se encontraron resultados
                                    </p>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredTypes.map((type) => (
                                            <TypeItem
                                                key={type.id}
                                                type={type}
                                                isSelected={value === type.id}
                                                onSelect={handleSelect}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Categories List
                            <div>
                                {categoriesWithTypes.map(({ category, info, types }) => (
                                    <div key={category} className="border-b border-white/5 last:border-b-0">
                                        <button
                                            onClick={() => setExpandedCategory(
                                                expandedCategory === category ? null : category
                                            )}
                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{info.icon}</span>
                                                <div className="text-left">
                                                    <p className="text-white font-medium">{info.label}</p>
                                                    <p className="text-xs text-slate-400">{types.length} tipos</p>
                                                </div>
                                            </div>
                                            <ChevronDown
                                                className={`w-4 h-4 text-slate-400 transition-transform ${expandedCategory === category ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </button>

                                        {expandedCategory === category && (
                                            <div className="bg-slate-900/50 px-2 py-2">
                                                {types.map((type) => (
                                                    <TypeItem
                                                        key={type.id}
                                                        type={type}
                                                        isSelected={value === type.id}
                                                        onSelect={handleSelect}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function TypeItem({
    type,
    isSelected,
    onSelect,
}: {
    type: BusinessTypeConfig;
    isSelected: boolean;
    onSelect: (id: string) => void;
}) {
    return (
        <button
            onClick={() => onSelect(type.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${isSelected
                ? "bg-cyan-500/20 border border-cyan-500"
                : "hover:bg-white/10 border border-transparent"
                }`}
        >
            <span className="text-lg">{type.icon}</span>
            <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${isSelected ? "text-cyan-400 font-medium" : "text-white"}`}>
                    {type.label}
                </p>
            </div>
            {isSelected && <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />}
        </button>
    );
}

// ============================================
// MULTI-SELECT VERSION
// ============================================

interface BusinessTypeMultiSelectorProps {
    value: string[]; // Array of type IDs
    onChange: (typeIds: string[]) => void;
    disabled?: boolean;
    maxSelections?: number; // Optional limit
}

export function BusinessTypeMultiSelector({
    value = [],
    onChange,
    disabled,
    maxSelections = 5
}: BusinessTypeMultiSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [expandedCategory, setExpandedCategory] = useState<BusinessCategory | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get selected types
    const selectedTypes = useMemo(() =>
        value.map(id => BUSINESS_TYPES.find(t => t.id === id)).filter(Boolean) as BusinessTypeConfig[],
        [value]
    );

    // Primary type (first selected)
    const primaryType = selectedTypes[0];

    // Search results
    const filteredTypes = useMemo(() => {
        if (!search.trim()) return null;
        return searchBusinessTypes(search);
    }, [search]);

    // Categories with types
    const categoriesWithTypes = useMemo(() => getCategoriesWithTypes(), []);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleToggle = (typeId: string) => {
        if (value.includes(typeId)) {
            // Remove
            onChange(value.filter(id => id !== typeId));
        } else if (value.length < maxSelections) {
            // Add
            onChange([...value, typeId]);
        }
    };

    const handleRemove = (typeId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(value.filter(id => id !== typeId));
    };

    return (
        <div ref={containerRef} className="relative">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full flex items-center justify-between gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-left transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10"
                    }`}
            >
                <div className="flex-1 min-w-0">
                    {selectedTypes.length === 0 ? (
                        <p className="text-slate-400">Seleccionar tipos de negocio...</p>
                    ) : (
                        <div className="flex flex-wrap gap-1.5">
                            {selectedTypes.map((type, index) => (
                                <span
                                    key={type.id}
                                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm ${
                                        index === 0
                                            ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                            : "bg-white/10 text-white border border-white/10"
                                    }`}
                                >
                                    <span>{type.icon}</span>
                                    <span className="truncate max-w-[100px]">{type.label}</span>
                                    <button
                                        onClick={(e) => handleRemove(type.id, e)}
                                        className="hover:text-red-400 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Helper text */}
            {selectedTypes.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                    {selectedTypes.length === 1
                        ? "El tipo principal define las características"
                        : `${selectedTypes.length} tipos seleccionados · El primero es el principal`}
                </p>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-white/10">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar tipo de negocio..."
                                className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                            />
                            {search && (
                                <button
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Selecciona hasta {maxSelections} tipos · {value.length}/{maxSelections}
                        </p>
                    </div>

                    {/* Results */}
                    <div className="max-h-80 overflow-y-auto">
                        {filteredTypes ? (
                            // Search Results
                            <div className="p-2">
                                {filteredTypes.length === 0 ? (
                                    <p className="text-center text-slate-400 py-4">
                                        No se encontraron resultados
                                    </p>
                                ) : (
                                    <div className="space-y-1">
                                        {filteredTypes.map((type) => (
                                            <MultiTypeItem
                                                key={type.id}
                                                type={type}
                                                isSelected={value.includes(type.id)}
                                                isPrimary={value[0] === type.id}
                                                onToggle={handleToggle}
                                                disabled={!value.includes(type.id) && value.length >= maxSelections}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Categories List
                            <div>
                                {categoriesWithTypes.map(({ category, info, types }) => (
                                    <div key={category} className="border-b border-white/5 last:border-b-0">
                                        <button
                                            onClick={() => setExpandedCategory(
                                                expandedCategory === category ? null : category
                                            )}
                                            className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{info.icon}</span>
                                                <div className="text-left">
                                                    <p className="text-white font-medium">{info.label}</p>
                                                    <p className="text-xs text-slate-400">{types.length} tipos</p>
                                                </div>
                                            </div>
                                            <ChevronDown
                                                className={`w-4 h-4 text-slate-400 transition-transform ${expandedCategory === category ? "rotate-180" : ""
                                                    }`}
                                            />
                                        </button>

                                        {expandedCategory === category && (
                                            <div className="bg-slate-900/50 px-2 py-2">
                                                {types.map((type) => (
                                                    <MultiTypeItem
                                                        key={type.id}
                                                        type={type}
                                                        isSelected={value.includes(type.id)}
                                                        isPrimary={value[0] === type.id}
                                                        onToggle={handleToggle}
                                                        disabled={!value.includes(type.id) && value.length >= maxSelections}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function MultiTypeItem({
    type,
    isSelected,
    isPrimary,
    onToggle,
    disabled,
}: {
    type: BusinessTypeConfig;
    isSelected: boolean;
    isPrimary: boolean;
    onToggle: (id: string) => void;
    disabled: boolean;
}) {
    return (
        <button
            onClick={() => !disabled && onToggle(type.id)}
            disabled={disabled}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                isSelected
                    ? isPrimary
                        ? "bg-cyan-500/20 border border-cyan-500"
                        : "bg-white/10 border border-white/20"
                    : disabled
                        ? "opacity-40 cursor-not-allowed border border-transparent"
                        : "hover:bg-white/10 border border-transparent"
            }`}
        >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                isSelected
                    ? isPrimary ? "border-cyan-500 bg-cyan-500" : "border-white/50 bg-white/20"
                    : "border-white/30"
            }`}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className="text-lg">{type.icon}</span>
            <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${isSelected ? isPrimary ? "text-cyan-400 font-medium" : "text-white" : "text-white"}`}>
                    {type.label}
                </p>
            </div>
            {isPrimary && (
                <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/30 text-cyan-400 rounded uppercase">
                    Principal
                </span>
            )}
        </button>
    );
}

// Feature badges for preview
export function FeatureBadges({ typeId }: { typeId: string }) {
    const type = BUSINESS_TYPES.find(t => t.id === typeId);
    if (!type) return null;

    const features = type.features;
    const enabledFeatures = Object.entries(features)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key);

    const featureLabels: Record<string, string> = {
        catalog: "Catálogo",
        services: "Servicios",
        bookings: "Citas",
        orders: "Pedidos",
        inventory: "Inventario",
        wholesale: "Mayoreo",
        repairs: "Reparaciones",
        rentals: "Rentas",
        tables: "Mesas",
        delivery: "Delivery",
    };

    return (
        <div className="flex flex-wrap gap-1">
            {enabledFeatures.map((feature) => (
                <span
                    key={feature}
                    className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded"
                >
                    {featureLabels[feature] || feature}
                </span>
            ))}
        </div>
    );
}
