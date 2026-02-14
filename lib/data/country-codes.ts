/**
 * Country codes data for phone input
 * Includes flag emoji, country name, dial code, and format
 */

export interface CountryCode {
  code: string;      // ISO 3166-1 alpha-2 (e.g., "US")
  name: string;      // Country name in Spanish
  nameEn: string;    // Country name in English
  dialCode: string;  // Dial code (e.g., "+1")
  flag: string;      // Flag emoji
  format?: string;   // Phone format placeholder (optional)
  priority?: number; // For sorting common countries first
}

// Most common countries first, then alphabetical
export const COUNTRY_CODES: CountryCode[] = [
  // Priority countries (Latin America & US)
  { code: "MX", name: "México", nameEn: "Mexico", dialCode: "+52", flag: "🇲🇽", format: "55 1234 5678", priority: 1 },
  { code: "US", name: "Estados Unidos", nameEn: "United States", dialCode: "+1", flag: "🇺🇸", format: "555 123 4567", priority: 2 },
  { code: "DO", name: "República Dominicana", nameEn: "Dominican Republic", dialCode: "+1", flag: "🇩🇴", format: "809 123 4567", priority: 3 },
  { code: "GT", name: "Guatemala", nameEn: "Guatemala", dialCode: "+502", flag: "🇬🇹", format: "5123 4567", priority: 4 },
  { code: "SV", name: "El Salvador", nameEn: "El Salvador", dialCode: "+503", flag: "🇸🇻", format: "7123 4567", priority: 5 },
  { code: "HN", name: "Honduras", nameEn: "Honduras", dialCode: "+504", flag: "🇭🇳", format: "9123 4567", priority: 6 },
  { code: "NI", name: "Nicaragua", nameEn: "Nicaragua", dialCode: "+505", flag: "🇳🇮", format: "8123 4567", priority: 7 },
  { code: "CR", name: "Costa Rica", nameEn: "Costa Rica", dialCode: "+506", flag: "🇨🇷", format: "8123 4567", priority: 8 },
  { code: "PA", name: "Panamá", nameEn: "Panama", dialCode: "+507", flag: "🇵🇦", format: "6123 4567", priority: 9 },
  { code: "CO", name: "Colombia", nameEn: "Colombia", dialCode: "+57", flag: "🇨🇴", format: "312 123 4567", priority: 10 },
  { code: "VE", name: "Venezuela", nameEn: "Venezuela", dialCode: "+58", flag: "🇻🇪", format: "412 123 4567", priority: 11 },
  { code: "EC", name: "Ecuador", nameEn: "Ecuador", dialCode: "+593", flag: "🇪🇨", format: "99 123 4567", priority: 12 },
  { code: "PE", name: "Perú", nameEn: "Peru", dialCode: "+51", flag: "🇵🇪", format: "912 345 678", priority: 13 },
  { code: "BO", name: "Bolivia", nameEn: "Bolivia", dialCode: "+591", flag: "🇧🇴", format: "7123 4567", priority: 14 },
  { code: "PY", name: "Paraguay", nameEn: "Paraguay", dialCode: "+595", flag: "🇵🇾", format: "981 123 456", priority: 15 },
  { code: "UY", name: "Uruguay", nameEn: "Uruguay", dialCode: "+598", flag: "🇺🇾", format: "94 123 456", priority: 16 },
  { code: "AR", name: "Argentina", nameEn: "Argentina", dialCode: "+54", flag: "🇦🇷", format: "11 1234 5678", priority: 17 },
  { code: "CL", name: "Chile", nameEn: "Chile", dialCode: "+56", flag: "🇨🇱", format: "9 1234 5678", priority: 18 },
  { code: "BR", name: "Brasil", nameEn: "Brazil", dialCode: "+55", flag: "🇧🇷", format: "11 91234 5678", priority: 19 },
  { code: "CU", name: "Cuba", nameEn: "Cuba", dialCode: "+53", flag: "🇨🇺", format: "5 123 4567", priority: 20 },
  { code: "PR", name: "Puerto Rico", nameEn: "Puerto Rico", dialCode: "+1", flag: "🇵🇷", format: "787 123 4567", priority: 21 },

  // Europe
  { code: "ES", name: "España", nameEn: "Spain", dialCode: "+34", flag: "🇪🇸", format: "612 345 678", priority: 22 },
  { code: "FR", name: "Francia", nameEn: "France", dialCode: "+33", flag: "🇫🇷", format: "6 12 34 56 78" },
  { code: "DE", name: "Alemania", nameEn: "Germany", dialCode: "+49", flag: "🇩🇪", format: "151 1234 5678" },
  { code: "IT", name: "Italia", nameEn: "Italy", dialCode: "+39", flag: "🇮🇹", format: "312 345 6789" },
  { code: "GB", name: "Reino Unido", nameEn: "United Kingdom", dialCode: "+44", flag: "🇬🇧", format: "7911 123456" },
  { code: "PT", name: "Portugal", nameEn: "Portugal", dialCode: "+351", flag: "🇵🇹", format: "912 345 678" },
  { code: "NL", name: "Países Bajos", nameEn: "Netherlands", dialCode: "+31", flag: "🇳🇱", format: "6 12345678" },
  { code: "BE", name: "Bélgica", nameEn: "Belgium", dialCode: "+32", flag: "🇧🇪", format: "470 12 34 56" },
  { code: "CH", name: "Suiza", nameEn: "Switzerland", dialCode: "+41", flag: "🇨🇭", format: "78 123 45 67" },
  { code: "AT", name: "Austria", nameEn: "Austria", dialCode: "+43", flag: "🇦🇹", format: "664 123456" },
  { code: "PL", name: "Polonia", nameEn: "Poland", dialCode: "+48", flag: "🇵🇱", format: "512 345 678" },
  { code: "SE", name: "Suecia", nameEn: "Sweden", dialCode: "+46", flag: "🇸🇪", format: "70 123 45 67" },
  { code: "NO", name: "Noruega", nameEn: "Norway", dialCode: "+47", flag: "🇳🇴", format: "412 34 567" },
  { code: "DK", name: "Dinamarca", nameEn: "Denmark", dialCode: "+45", flag: "🇩🇰", format: "20 12 34 56" },
  { code: "FI", name: "Finlandia", nameEn: "Finland", dialCode: "+358", flag: "🇫🇮", format: "41 2345678" },
  { code: "IE", name: "Irlanda", nameEn: "Ireland", dialCode: "+353", flag: "🇮🇪", format: "85 123 4567" },
  { code: "GR", name: "Grecia", nameEn: "Greece", dialCode: "+30", flag: "🇬🇷", format: "691 234 5678" },
  { code: "RU", name: "Rusia", nameEn: "Russia", dialCode: "+7", flag: "🇷🇺", format: "912 345-67-89" },
  { code: "UA", name: "Ucrania", nameEn: "Ukraine", dialCode: "+380", flag: "🇺🇦", format: "50 123 4567" },
  { code: "RO", name: "Rumanía", nameEn: "Romania", dialCode: "+40", flag: "🇷🇴", format: "712 345 678" },
  { code: "CZ", name: "República Checa", nameEn: "Czech Republic", dialCode: "+420", flag: "🇨🇿", format: "601 123 456" },
  { code: "HU", name: "Hungría", nameEn: "Hungary", dialCode: "+36", flag: "🇭🇺", format: "20 123 4567" },

  // Asia & Middle East
  { code: "CN", name: "China", nameEn: "China", dialCode: "+86", flag: "🇨🇳", format: "131 2345 6789" },
  { code: "JP", name: "Japón", nameEn: "Japan", dialCode: "+81", flag: "🇯🇵", format: "90 1234 5678" },
  { code: "KR", name: "Corea del Sur", nameEn: "South Korea", dialCode: "+82", flag: "🇰🇷", format: "10 1234 5678" },
  { code: "IN", name: "India", nameEn: "India", dialCode: "+91", flag: "🇮🇳", format: "98765 43210" },
  { code: "PH", name: "Filipinas", nameEn: "Philippines", dialCode: "+63", flag: "🇵🇭", format: "917 123 4567" },
  { code: "TH", name: "Tailandia", nameEn: "Thailand", dialCode: "+66", flag: "🇹🇭", format: "81 234 5678" },
  { code: "VN", name: "Vietnam", nameEn: "Vietnam", dialCode: "+84", flag: "🇻🇳", format: "91 234 56 78" },
  { code: "ID", name: "Indonesia", nameEn: "Indonesia", dialCode: "+62", flag: "🇮🇩", format: "812 345 678" },
  { code: "MY", name: "Malasia", nameEn: "Malaysia", dialCode: "+60", flag: "🇲🇾", format: "12 345 6789" },
  { code: "SG", name: "Singapur", nameEn: "Singapore", dialCode: "+65", flag: "🇸🇬", format: "9123 4567" },
  { code: "AE", name: "Emiratos Árabes", nameEn: "UAE", dialCode: "+971", flag: "🇦🇪", format: "50 123 4567" },
  { code: "SA", name: "Arabia Saudita", nameEn: "Saudi Arabia", dialCode: "+966", flag: "🇸🇦", format: "50 123 4567" },
  { code: "IL", name: "Israel", nameEn: "Israel", dialCode: "+972", flag: "🇮🇱", format: "50 123 4567" },
  { code: "TR", name: "Turquía", nameEn: "Turkey", dialCode: "+90", flag: "🇹🇷", format: "532 123 45 67" },
  { code: "PK", name: "Pakistán", nameEn: "Pakistan", dialCode: "+92", flag: "🇵🇰", format: "300 1234567" },
  { code: "BD", name: "Bangladesh", nameEn: "Bangladesh", dialCode: "+880", flag: "🇧🇩", format: "1812 345678" },

  // Africa
  { code: "ZA", name: "Sudáfrica", nameEn: "South Africa", dialCode: "+27", flag: "🇿🇦", format: "71 123 4567" },
  { code: "EG", name: "Egipto", nameEn: "Egypt", dialCode: "+20", flag: "🇪🇬", format: "100 123 4567" },
  { code: "NG", name: "Nigeria", nameEn: "Nigeria", dialCode: "+234", flag: "🇳🇬", format: "802 123 4567" },
  { code: "KE", name: "Kenia", nameEn: "Kenya", dialCode: "+254", flag: "🇰🇪", format: "712 345678" },
  { code: "MA", name: "Marruecos", nameEn: "Morocco", dialCode: "+212", flag: "🇲🇦", format: "6 12 34 56 78" },
  { code: "GH", name: "Ghana", nameEn: "Ghana", dialCode: "+233", flag: "🇬🇭", format: "23 123 4567" },

  // Oceania
  { code: "AU", name: "Australia", nameEn: "Australia", dialCode: "+61", flag: "🇦🇺", format: "412 345 678" },
  { code: "NZ", name: "Nueva Zelanda", nameEn: "New Zealand", dialCode: "+64", flag: "🇳🇿", format: "21 123 4567" },

  // Caribbean
  { code: "JM", name: "Jamaica", nameEn: "Jamaica", dialCode: "+1", flag: "🇯🇲", format: "876 123 4567" },
  { code: "TT", name: "Trinidad y Tobago", nameEn: "Trinidad and Tobago", dialCode: "+1", flag: "🇹🇹", format: "868 123 4567" },
  { code: "HT", name: "Haití", nameEn: "Haiti", dialCode: "+509", flag: "🇭🇹", format: "34 12 3456" },
  { code: "BS", name: "Bahamas", nameEn: "Bahamas", dialCode: "+1", flag: "🇧🇸", format: "242 123 4567" },
  { code: "BB", name: "Barbados", nameEn: "Barbados", dialCode: "+1", flag: "🇧🇧", format: "246 123 4567" },

  // Canada
  { code: "CA", name: "Canadá", nameEn: "Canada", dialCode: "+1", flag: "🇨🇦", format: "416 123 4567" },

  // Belize
  { code: "BZ", name: "Belice", nameEn: "Belize", dialCode: "+501", flag: "🇧🇿", format: "622 1234" },
];

// Default country (Mexico)
export const DEFAULT_COUNTRY_CODE = "MX";

// Get country by code
export function getCountryByCode(code: string): CountryCode | undefined {
  return COUNTRY_CODES.find(c => c.code === code);
}

// Get country by dial code (returns first match)
export function getCountryByDialCode(dialCode: string): CountryCode | undefined {
  return COUNTRY_CODES.find(c => c.dialCode === dialCode);
}

// Get sorted countries (priority first, then alphabetical)
export function getSortedCountries(): CountryCode[] {
  return [...COUNTRY_CODES].sort((a, b) => {
    // Priority countries first
    if (a.priority && b.priority) return a.priority - b.priority;
    if (a.priority) return -1;
    if (b.priority) return 1;
    // Then alphabetical by Spanish name
    return a.name.localeCompare(b.name, 'es');
  });
}

// Search countries
export function searchCountries(query: string): CountryCode[] {
  const q = query.toLowerCase().trim();
  if (!q) return getSortedCountries();

  return getSortedCountries().filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.nameEn.toLowerCase().includes(q) ||
    c.dialCode.includes(q) ||
    c.code.toLowerCase().includes(q)
  );
}

// Format full phone number with country code
export function formatFullPhone(countryCode: string, phone: string): string {
  const country = getCountryByCode(countryCode);
  if (!country) return phone;

  // Remove any existing country code prefix
  let cleanPhone = phone.replace(/^\+\d+\s*/, '').replace(/\D/g, '');

  return `${country.dialCode}${cleanPhone}`;
}

// Parse phone number to extract country and number
export function parsePhoneNumber(fullPhone: string): { countryCode: string; phone: string } | null {
  if (!fullPhone) return null;

  const cleanPhone = fullPhone.replace(/\s/g, '');

  // Try to match with known country codes (longest first)
  const sortedByDialCodeLength = [...COUNTRY_CODES].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  );

  for (const country of sortedByDialCodeLength) {
    if (cleanPhone.startsWith(country.dialCode)) {
      return {
        countryCode: country.code,
        phone: cleanPhone.slice(country.dialCode.length)
      };
    }
    // Also check without + prefix
    const dialWithoutPlus = country.dialCode.replace('+', '');
    if (cleanPhone.startsWith(dialWithoutPlus)) {
      return {
        countryCode: country.code,
        phone: cleanPhone.slice(dialWithoutPlus.length)
      };
    }
  }

  // Default to Mexico if no match
  return { countryCode: "MX", phone: cleanPhone };
}
