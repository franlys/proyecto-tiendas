/**
 * Tipos para el sistema de Rent-a-Car
 *
 * Este sistema maneja:
 * - Vehículos (inventario de carros disponibles)
 * - Rentas (reservaciones con rango de fechas)
 * - Disponibilidad (calendario por vehículo)
 * - Extras opcionales (seguro, GPS, silla de bebé)
 */

import { Timestamp } from "firebase/firestore";

// ============================================
// VEHÍCULOS
// ============================================

export type VehicleCategory =
  | "sedan"
  | "suv"
  | "pickup"
  | "van"
  | "luxury"
  | "economy"
  | "compact";

export type VehicleStatus =
  | "available"      // Listo para rentar
  | "rented"         // Actualmente rentado
  | "maintenance"    // En mantenimiento
  | "reserved"       // Reservado (próxima entrega)
  | "inactive";      // Desactivado temporalmente

export type TransmissionType = "automatic" | "manual";
export type FuelType = "gasoline" | "diesel" | "electric" | "hybrid";

export interface Vehicle {
  id: string;
  shopId: string;

  // Información básica
  name: string;                    // "Toyota Corolla 2024"
  brand: string;                   // "Toyota"
  model: string;                   // "Corolla"
  year: number;                    // 2024
  plate: string;                   // "ABC-1234" (único por shop)
  color: string;                   // "Blanco"
  category: VehicleCategory;

  // Especificaciones
  transmission: TransmissionType;
  fuelType: FuelType;
  seats: number;                   // 5
  doors: number;                   // 4
  airConditioning: boolean;
  bluetooth: boolean;

  // Precios
  dailyRate: number;               // Precio por día base
  weeklyRate?: number;             // Precio semanal (descuento)
  monthlyRate?: number;            // Precio mensual (descuento)
  depositAmount: number;           // Depósito de garantía

  // Estado
  status: VehicleStatus;
  currentRentalId?: string;        // Si está rentado, ID de la renta actual
  currentMileage: number;          // Kilometraje actual
  lastMaintenanceDate?: string;    // "2026-01-15"
  nextMaintenanceDate?: string;    // "2026-03-15"

  // Imágenes
  images: string[];                // URLs de imágenes
  thumbnail: string;               // Imagen principal

  // Metadata
  notes?: string;                  // Notas internas
  featured: boolean;               // Destacar en catálogo
  isActive: boolean;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============================================
// EXTRAS OPCIONALES
// ============================================

export interface RentalExtra {
  id: string;
  name: string;                    // "Seguro Premium"
  description: string;             // "Cobertura total sin deducible"
  dailyRate: number;               // Costo adicional por día
  flatRate?: number;               // O costo fijo por renta
  isRequired: boolean;             // ¿Obligatorio? (ej: seguro básico)
  category: "insurance" | "accessory" | "service";
}

// ============================================
// RENTAS (RESERVACIONES)
// ============================================

export type RentalStatus =
  | "pending"         // Reserva creada, esperando confirmación
  | "confirmed"       // Cliente confirmó (pago/depósito recibido)
  | "active"          // Vehículo entregado, renta en curso
  | "completed"       // Vehículo devuelto correctamente
  | "cancelled"       // Cancelada antes de entrega
  | "no_show";        // Cliente no se presentó

export interface Rental {
  id: string;
  shopId: string;
  vehicleId: string;
  rentalNumber: string;            // "R-2026-0001"

  // Información del vehículo (snapshot)
  vehicleSnapshot: {
    name: string;
    plate: string;
    category: VehicleCategory;
    thumbnail: string;
  };

  // Cliente
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerIdNumber?: string;       // Número de identificación
  customerLicenseNumber?: string;  // Número de licencia de conducir

  // Fechas y horarios
  pickupDate: string;              // "2026-02-15"
  pickupTime: string;              // "10:00"
  returnDate: string;              // "2026-02-18"
  returnTime: string;              // "10:00"
  actualPickupAt?: Timestamp;      // Hora real de entrega
  actualReturnAt?: Timestamp;      // Hora real de devolución

  // Ubicaciones
  pickupLocation: string;          // "Oficina Central" o "Aeropuerto"
  returnLocation: string;          // Puede ser diferente

  // Precios y cargos
  dailyRate: number;               // Tarifa diaria aplicada
  totalDays: number;               // Días totales
  subtotal: number;                // dailyRate * totalDays
  extras: SelectedExtra[];         // Extras seleccionados
  extrasTotal: number;             // Total de extras
  depositAmount: number;           // Depósito cobrado
  depositStatus: "pending" | "collected" | "returned" | "partial_returned";
  total: number;                   // subtotal + extrasTotal
  discountAmount?: number;         // Descuento aplicado
  discountReason?: string;

  // Kilometraje
  mileageAtPickup?: number;
  mileageAtReturn?: number;
  mileageLimit?: number;           // Límite de km incluidos
  extraMileageRate?: number;       // Costo por km extra

  // Estado y tracking
  status: RentalStatus;
  paymentStatus: "pending" | "partial" | "paid" | "refunded";

  // Condición del vehículo
  pickupConditionNotes?: string;   // Estado al entregar
  pickupConditionPhotos?: string[];
  returnConditionNotes?: string;   // Estado al devolver
  returnConditionPhotos?: string[];
  damageReported?: boolean;
  damageDescription?: string;
  damageCost?: number;

  // Confirmación WhatsApp
  reminderSentAt?: Timestamp;
  customerConfirmedAt?: Timestamp;
  customerResponse?: "confirmed" | "cancelled" | "rescheduled";

  // Staff
  assignedStaffId?: string;
  assignedStaffName?: string;
  pickedUpByStaffId?: string;
  returnedToStaffId?: string;

  // Notas
  customerNotes?: string;          // Notas del cliente
  internalNotes?: string;          // Notas internas

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SelectedExtra {
  extraId: string;
  name: string;
  dailyRate: number;
  flatRate?: number;
  totalCost: number;               // Calculado según días o flat
}

// ============================================
// DISPONIBILIDAD POR VEHÍCULO
// ============================================

export type DayStatus =
  | "available"       // Disponible para rentar
  | "reserved"        // Reservado (tiene renta confirmada)
  | "rented"          // Actualmente en renta
  | "blocked"         // Bloqueado manualmente
  | "maintenance";    // En mantenimiento

export interface VehicleDayAvailability {
  date: string;                    // "2026-02-15"
  status: DayStatus;
  rentalId?: string;               // Si está reservado/rentado
  blockedReason?: string;          // Si está bloqueado manualmente
}

// Documento de disponibilidad por mes (más eficiente)
export interface VehicleMonthAvailability {
  vehicleId: string;
  shopId: string;
  month: string;                   // "2026-02"
  days: Record<string, VehicleDayAvailability>; // { "01": {...}, "15": {...} }
  updatedAt: Timestamp;
}

// ============================================
// CONFIGURACIÓN DEL NEGOCIO
// ============================================

export interface RentalConfig {
  enabled: boolean;
  shopId: string;

  // Ubicaciones de entrega/devolución
  locations: RentalLocation[];

  // Horarios de operación
  openTime: string;                // "08:00"
  closeTime: string;               // "20:00"
  closedDays: number[];            // [0] = domingo cerrado

  // Políticas
  minRentalDays: number;           // Mínimo 1 día
  maxRentalDays: number;           // Máximo 30 días
  advanceBookingDays: number;      // Reservar hasta 90 días adelante
  minAdvanceHours: number;         // Mínimo 4 horas antes

  // Depósito
  requireDeposit: boolean;
  depositPercentage: number;       // 30% del total o monto fijo
  depositFixedAmount?: number;

  // Cancelación
  freeCancellationHours: number;   // Cancelación gratis hasta X horas antes
  cancellationFeePercentage: number;

  // Extras disponibles
  availableExtras: RentalExtra[];

  // Turnover (tiempo entre devolución y nueva entrega)
  turnoverHours: number;           // 2-4 horas para limpieza/inspección

  // WhatsApp
  reminderEnabled: boolean;
  reminderHoursBefore: number;     // 24 horas antes
  confirmKeywords: string[];       // ["SI", "CONFIRMO"]
  cancelKeywords: string[];        // ["CANCELAR"]

  // Notificaciones al negocio
  notifyOnNewRental: boolean;
  notifyOnPickup: boolean;
  notifyOnReturn: boolean;
  notifyOnCancellation: boolean;
  notificationPhone: string;

  updatedAt: Timestamp;
}

export interface RentalLocation {
  id: string;
  name: string;                    // "Oficina Central"
  address: string;
  isDefault: boolean;
  extraFee?: number;               // Cargo extra por esta ubicación
}

// ============================================
// CONVERSACIÓN WHATSAPP
// ============================================

export type RentalConversationState =
  | "idle"
  | "awaiting_confirmation"
  | "awaiting_pickup_confirmation"
  | "awaiting_return_confirmation"
  | "awaiting_new_dates";

export interface RentalConversation {
  phone: string;
  shopId: string;
  currentRentalId: string | null;
  state: RentalConversationState;
  stateData: Record<string, unknown>;
  stateExpiresAt: Timestamp;
  lastMessageAt: Timestamp;
}

// ============================================
// INPUTS PARA CREAR/ACTUALIZAR
// ============================================

export interface CreateRentalInput {
  vehicleId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerIdNumber?: string;
  customerLicenseNumber?: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  pickupLocation: string;
  returnLocation: string;
  extras?: string[];               // IDs de extras seleccionados
  customerNotes?: string;
}

export interface RescheduleRentalInput {
  newPickupDate?: string;
  newPickupTime?: string;
  newReturnDate?: string;
  newReturnTime?: string;
}

// ============================================
// HELPERS
// ============================================

/**
 * Calcula el número de días entre dos fechas
 */
export function calculateRentalDays(pickupDate: string, returnDate: string): number {
  const pickup = new Date(pickupDate);
  const returnD = new Date(returnDate);
  const diffTime = returnD.getTime() - pickup.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays); // Mínimo 1 día
}

/**
 * Calcula el mejor precio según duración
 */
export function calculateBestRate(
  vehicle: Vehicle,
  totalDays: number
): { dailyRate: number; rateType: "daily" | "weekly" | "monthly" } {
  if (totalDays >= 30 && vehicle.monthlyRate) {
    return { dailyRate: vehicle.monthlyRate / 30, rateType: "monthly" };
  }
  if (totalDays >= 7 && vehicle.weeklyRate) {
    return { dailyRate: vehicle.weeklyRate / 7, rateType: "weekly" };
  }
  return { dailyRate: vehicle.dailyRate, rateType: "daily" };
}

/**
 * Genera número de renta secuencial
 */
export function generateRentalNumber(year: number, sequence: number): string {
  return `R-${year}-${sequence.toString().padStart(4, "0")}`;
}

/**
 * Formatea fechas para mensajes
 */
export function formatRentalDates(
  pickupDate: string,
  returnDate: string,
  locale: string = "es-MX"
): string {
  const pickup = new Date(pickupDate + "T12:00:00");
  const returnD = new Date(returnDate + "T12:00:00");

  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
  };

  return `${pickup.toLocaleDateString(locale, options)} → ${returnD.toLocaleDateString(locale, options)}`;
}
