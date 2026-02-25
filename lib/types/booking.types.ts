import { Timestamp } from "firebase/firestore";

// Estados de reservación
export type BookingStatus =
  | "pending"       // Pendiente de confirmación
  | "confirmed"     // Confirmada por el cliente
  | "rescheduled"   // Reagendada
  | "cancelled"     // Cancelada
  | "completed"     // Completada (cita realizada)
  | "no_show";      // Cliente no se presentó

// Respuesta del cliente a confirmación
export type CustomerResponse =
  | "confirmed"
  | "reschedule"
  | "cancel"
  | null;

// Documento de reservación
export interface Booking {
  id: string;
  shopId: string;
  orderNumber?: string;

  // Info del cliente
  customerName: string;
  customerPhone: string;
  customerEmail?: string;

  // Detalles del servicio
  serviceId: string;
  serviceName: string;
  serviceDuration: number;  // minutos
  servicePrice: number;

  // Slot de tiempo
  date: string;             // "2026-02-15"
  time: string;             // "14:30"
  endTime: string;          // Calculado: "15:30"

  // Estado
  status: BookingStatus;

  // Tracking de confirmación
  reminderSentAt: Timestamp | null;
  reminderMessageId: string | null;
  customerResponse: CustomerResponse;
  customerRespondedAt: Timestamp | null;

  // Si fue reagendada, de dónde viene
  rescheduledFrom?: {
    date: string;
    time: string;
    bookingId: string;
  };

  // Staff asignado (opcional)
  assignedStaffId?: string;
  assignedStaffName?: string;

  // Notas
  notes?: string;
  internalNotes?: string;

  // Lifecycle
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Slot individual en un día
export interface TimeSlot {
  time: string;           // "09:00"
  available: boolean;
  bookingId: string | null;
}

// Documento de slots de un día
export interface DaySlots {
  date: string;
  shopId: string;
  slots: Record<string, TimeSlot>;  // { "09:00": {...}, "09:30": {...} }
  updatedAt: Timestamp;
}

// Configuración de reservaciones
export interface DaySchedule {
  open: string;
  close: string;
  closed: boolean;
}

export interface BookingConfig {
  enabled: boolean;

  // Schedule (Advanced)
  schedule?: {
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };

  // Recordatorios
  reminderEnabled: boolean;
  reminderHoursBefore: number;     // Default: 24

  // Horario del negocio
  openTime: string;                // "09:00"
  closeTime: string;               // "18:00"
  slotDurationMinutes: number;     // Default: 30
  bufferMinutes: number;           // Buffer entre citas (default: 0)

  // Horario de descanso (almuerzo, etc.)
  breakEnabled: boolean;           // Si hay break habilitado
  breakStartTime: string;          // "12:00"
  breakEndTime: string;            // "14:00"

  // Días cerrados (0 = Domingo, 6 = Sábado)
  closedDays: number[];

  // Fechas cerradas específicas (cierres puntuales)
  // Formato: ["2026-02-20", "2026-03-15"]
  closedDates?: string[];

  // Keywords de respuesta
  confirmKeywords: string[];       // ["SI", "SÍ", "CONFIRMO", "1"]
  rescheduleKeywords: string[];    // ["CAMBIAR", "REAGENDAR", "MOVER", "2"]
  cancelKeywords: string[];        // ["CANCELAR", "NO PUEDO", "3"]

  // Notificaciones al negocio
  notifyBusinessOnConfirm: boolean;
  notifyBusinessOnCancel: boolean;
  notifyBusinessOnReschedule: boolean;
  businessNotificationPhone: string;

  // Configuración de conversación
  rescheduleTimeoutMinutes: number;  // Timeout para reagendar (default: 30)

  // Límites
  maxAdvanceBookingDays: number;     // Máx días anticipación (default: 30)
  minAdvanceBookingHours: number;    // Mín horas anticipación (default: 2)
}

// Estado de conversación con cliente
export type ConversationState =
  | "idle"
  | "awaiting_confirmation"
  | "awaiting_new_date"
  | "awaiting_new_time";

// Documento de conversación activa
export interface BookingConversation {
  phone: string;
  shopId: string;
  currentBookingId: string | null;
  state: ConversationState;
  stateData: Record<string, unknown>;  // Datos del contexto actual
  stateExpiresAt: Timestamp;
  lastMessageAt: Timestamp;
}

// Servicio con duración individual
export interface BookingService {
  id: string;
  shopId: string;
  name: string;              // "Manicura Simple"
  description?: string;      // "Incluye limado y esmaltado"
  duration: number;          // Duración en minutos (20)
  price: number;             // Precio (150)
  category?: string;         // Categoría opcional ("Uñas")
  isActive: boolean;         // Si está disponible
  order: number;             // Orden de visualización
  image?: string;            // URL de imagen del servicio
  createdAt: string;
  updatedAt: string;
}

// Input para crear/actualizar servicio
export interface CreateServiceInput {
  name: string;
  description?: string;
  duration: number;
  price: number;
  category?: string;
  isActive?: boolean;
  order?: number;
  image?: string;
}

// Input para crear reservación
export interface CreateBookingInput {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  // Soporte para un servicio (backwards compatible)
  serviceId: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: number;
  // Soporte para múltiples servicios (nuevo)
  services?: {
    id: string;
    name: string;
    duration: number;
    price: number;
  }[];
  date: string;
  time: string;
  notes?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  orderNumber?: string;
}

// Input para reagendar
export interface RescheduleBookingInput {
  newDate: string;
  newTime: string;
  reason?: string;
}

// Resultado de procesamiento de respuesta de booking
export interface BookingResponseResult {
  handled: boolean;
  responseMessage?: string;
  action?: "confirm" | "reschedule" | "cancel" | "provide_date" | "provide_time" | "unknown";
}

// Slot disponible para mostrar al cliente
export interface AvailableSlot {
  time: string;
  endTime: string;
  available: boolean;
}

// Valores por defecto
export const DEFAULT_BOOKING_CONFIG: BookingConfig = {
  enabled: false,
  reminderEnabled: true,
  reminderHoursBefore: 24,
  openTime: "09:00",
  closeTime: "18:00",
  slotDurationMinutes: 30,
  bufferMinutes: 0,
  breakEnabled: false,
  breakStartTime: "12:00",
  breakEndTime: "14:00",
  closedDays: [0],  // Domingo cerrado
  closedDates: [],  // Fechas cerradas específicas
  confirmKeywords: ["SI", "SÍ", "CONFIRMO", "OK", "LISTO", "1"],
  rescheduleKeywords: ["CAMBIAR", "REAGENDAR", "MOVER", "OTRA", "2"],
  cancelKeywords: ["CANCELAR", "NO PUEDO", "NO VOY", "3"],
  notifyBusinessOnConfirm: true,
  notifyBusinessOnCancel: true,
  notifyBusinessOnReschedule: true,
  businessNotificationPhone: "",
  rescheduleTimeoutMinutes: 30,
  maxAdvanceBookingDays: 30,
  minAdvanceBookingHours: 2,
};

// Helper para calcular endTime
export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(":").map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
}

// Helper para formatear fecha para mensajes
export function formatBookingDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  return date.toLocaleDateString("es-MX", options);
}
