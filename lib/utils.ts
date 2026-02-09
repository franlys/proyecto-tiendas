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
  let cleanPhone = phone.replace(/\D/g, "");

  // Dominican Republic area codes: 809, 829, 849
  // If 10 digits starting with these, add country code "1"
  if (cleanPhone.length === 10 && /^(809|829|849)/.test(cleanPhone)) {
    cleanPhone = "1" + cleanPhone;
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
