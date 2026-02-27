"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CountryCode,
  DEFAULT_COUNTRY_CODE,
  getCountryByCode,
  getSortedCountries,
  searchCountries,
  formatFullPhone,
  parsePhoneNumber,
} from "@/lib/data/country-codes";

export interface PhoneInputValue {
  countryCode: string;   // ISO code (e.g., "MX")
  dialCode: string;      // Dial code (e.g., "+52")
  phone: string;         // Local phone number
  fullPhone: string;     // Full phone with dial code
}

interface PhoneInputProps {
  value?: string;                          // Full phone number (e.g., "+521234567890")
  defaultCountry?: string;                 // Default country code (e.g., "MX")
  onChange?: (value: PhoneInputValue) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  label?: string;
  className?: string;
  inputClassName?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "dark" | "glass";
}

export function PhoneInput({
  value,
  defaultCountry = DEFAULT_COUNTRY_CODE,
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  required = false,
  error,
  label,
  className,
  inputClassName,
  size = "md",
  variant = "default",
}: PhoneInputProps) {
  // Parse initial value
  const parsed = value ? parsePhoneNumber(value) : null;

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    getCountryByCode(parsed?.countryCode || defaultCountry) || getCountryByCode(DEFAULT_COUNTRY_CODE)!
  );
  const [phone, setPhone] = useState(parsed?.phone || "");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Sync with external value changes (like async profile loading)
  useEffect(() => {
    const currentGeneratedFullPhone = formatFullPhone(selectedCountry.code, phone);
    if (value !== undefined && value !== currentGeneratedFullPhone) {
      const parsedValue = value ? parsePhoneNumber(value) : null;
      if (parsedValue) {
        setPhone(parsedValue.phone);
        const country = getCountryByCode(parsedValue.countryCode);
        if (country) {
          setSelectedCountry(country);
        }
      } else if (value === "") {
        setPhone("");
      }
    }
  }, [value, selectedCountry.code, phone]);

  // Filtered countries based on search
  const filteredCountries = searchQuery
    ? searchCountries(searchQuery)
    : getSortedCountries();

  // Emit change
  const emitChange = useCallback((country: CountryCode, phoneNum: string) => {
    if (onChange) {
      const cleanPhone = phoneNum.replace(/\D/g, "");
      onChange({
        countryCode: country.code,
        dialCode: country.dialCode,
        phone: cleanPhone,
        fullPhone: formatFullPhone(country.code, cleanPhone),
      });
    }
  }, [onChange]);

  // Handle phone change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    setPhone(newPhone);
    emitChange(selectedCountry, newPhone);
  };

  // Handle country select
  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setIsOpen(false);
    setSearchQuery("");
    emitChange(country, phone);
    // Focus phone input after selection
    setTimeout(() => phoneInputRef.current?.focus(), 100);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  // Size classes
  const sizeClasses = {
    sm: "h-9 text-sm",
    md: "h-11 text-base",
    lg: "h-12 text-lg",
  };

  // Variant classes
  const variantClasses = {
    default: "bg-white border-gray-300 text-gray-900 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary",
    dark: "bg-black/20 border-white/10 text-white placeholder-slate-500 focus-within:border-white/30",
    glass: "bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder-white/50 focus-within:border-white/30",
  };

  return (
    <div className={cn("w-full", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium mb-1.5 text-inherit">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={cn(
          "relative flex items-stretch rounded-xl border transition-all",
          sizeClasses[size],
          variantClasses[variant],
          disabled && "opacity-50 cursor-not-allowed",
          error && "border-red-500 focus-within:border-red-500 focus-within:ring-red-500"
        )}
      >
        {/* Country Selector Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            "flex items-center gap-1.5 px-3 border-r transition-colors",
            variant === "default" ? "border-gray-200 hover:bg-gray-50" : "border-white/10 hover:bg-white/5",
            "rounded-l-xl",
            disabled && "cursor-not-allowed"
          )}
        >
          <span className="text-xl leading-none">{selectedCountry.flag}</span>
          <span className={cn(
            "font-medium",
            size === "sm" ? "text-xs" : "text-sm"
          )}>
            {selectedCountry.dialCode}
          </span>
          <ChevronDown className={cn(
            "w-3.5 h-3.5 transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>

        {/* Phone Input */}
        <input
          ref={phoneInputRef}
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={handlePhoneChange}
          onBlur={onBlur}
          placeholder={placeholder || selectedCountry.format || "Número de teléfono"}
          disabled={disabled}
          required={required}
          className={cn(
            "flex-1 bg-transparent px-3 outline-none rounded-r-xl",
            "placeholder:text-current/40",
            inputClassName
          )}
        />
      </div>

      {/* Country Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          onKeyDown={handleKeyDown}
          className={cn(
            "absolute z-50 mt-1 w-full max-w-sm rounded-xl border shadow-xl overflow-hidden",
            variant === "default"
              ? "bg-white border-gray-200"
              : "bg-zinc-900 border-white/10"
          )}
          style={{
            maxHeight: "320px",
          }}
        >
          {/* Search */}
          <div className={cn(
            "sticky top-0 p-2 border-b",
            variant === "default" ? "bg-white border-gray-100" : "bg-zinc-900 border-white/10"
          )}>
            <div className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg",
              variant === "default" ? "bg-gray-100" : "bg-white/5"
            )}>
              <Search className="w-4 h-4 opacity-50" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar país..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-0.5 rounded hover:bg-black/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Country List */}
          <div className="overflow-y-auto" style={{ maxHeight: "260px" }}>
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-sm opacity-50">
                No se encontraron países
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={`${country.code}-${country.dialCode}`}
                  type="button"
                  onClick={() => handleCountrySelect(country)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    variant === "default"
                      ? "hover:bg-gray-50"
                      : "hover:bg-white/5",
                    selectedCountry.code === country.code && (
                      variant === "default" ? "bg-primary/5" : "bg-white/10"
                    )
                  )}
                >
                  <span className="text-xl">{country.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{country.name}</div>
                    <div className={cn(
                      "text-xs",
                      variant === "default" ? "text-gray-500" : "text-white/50"
                    )}>
                      {country.dialCode}
                    </div>
                  </div>
                  {selectedCountry.code === country.code && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default PhoneInput;
