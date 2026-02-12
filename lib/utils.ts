import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format phone number for WhatsApp API
 * - Removes all non-digit characters
 * - Adds country code if missing (Dominican Republic: +1)
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // If it's a JID (contains @), don't format it
  if (phone.includes("@")) return phone;

  let cleanPhone = phone.replace(/\D/g, "");

  // Dominican Republic area codes: 809, 829, 849
  // If 10 digits starting with these, add country code "1"
  if (cleanPhone.length === 10) {
    if (/^(809|829|849)/.test(cleanPhone)) {
      cleanPhone = "1" + cleanPhone;
    } else {
      // Assume US/Global standard if not explicitly another country code
      // For now, we'll keep it simple: if 10 digits, add 1 (common for US/DR)
      cleanPhone = "1" + cleanPhone;
    }
  }

  return cleanPhone;
}

/**
 * Open WhatsApp with a pre-filled message
 */
export function openWhatsApp(phone: string, message: string): void {
  const cleanPhone = formatPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, "_blank");
}

/**
 * Deep clean an object for Firestore
 * Removes all undefined values recursively (Firestore doesn't accept undefined)
 * Keeps null, empty strings, empty arrays, and 0 values
 */
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return null as T;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item)) as T;
  }
  if (typeof obj === 'object' && obj !== null) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanForFirestore(v)])
    ) as T;
  }
  return obj;
}
