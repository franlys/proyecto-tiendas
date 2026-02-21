/**
 * Tipos para Gestión de Empleados (Staff)
 *
 * Sistema de múltiples empleados para negocios de servicios
 * (salones de belleza, spas, clínicas, etc.)
 */

// ============================================
// ROLES DE EMPLEADOS
// ============================================

/**
 * Roles específicos para negocios de belleza/servicios
 */
export type BeautyStaffRole =
  | "owner"             // 👑 Dueño(a)
  | "manager"           // 🟣 Gerente
  | "stylist"           // ✂️ Estilista
  | "colorist"          // 🎨 Colorista
  | "nail_tech"         // 💅 Manicurista/Pedicurista
  | "esthetician"       // 🌸 Esteticista/Facialista
  | "massage_therapist" // 💆 Masajista
  | "makeup_artist"     // 💄 Maquillista
  | "barber"            // 💈 Barbero
  | "receptionist";     // 📋 Recepcionista

/**
 * Configuración visual de cada rol
 */
export const BEAUTY_STAFF_ROLES: Record<BeautyStaffRole, {
  label: string;
  labelPlural: string;
  icon: string;
  color: string;
  description: string;
}> = {
  owner: {
    label: "Dueño(a)",
    labelPlural: "Dueños",
    icon: "👑",
    color: "#FFD700",
    description: "Propietario del negocio con acceso total",
  },
  manager: {
    label: "Gerente",
    labelPlural: "Gerentes",
    icon: "🟣",
    color: "#9333EA",
    description: "Administración y supervisión del negocio",
  },
  stylist: {
    label: "Estilista",
    labelPlural: "Estilistas",
    icon: "✂️",
    color: "#EC4899",
    description: "Cortes, peinados y tratamientos capilares",
  },
  colorist: {
    label: "Colorista",
    labelPlural: "Coloristas",
    icon: "🎨",
    color: "#F59E0B",
    description: "Especialista en tintes y coloración",
  },
  nail_tech: {
    label: "Manicurista",
    labelPlural: "Manicuristas",
    icon: "💅",
    color: "#EF4444",
    description: "Manicure, pedicure y nail art",
  },
  esthetician: {
    label: "Esteticista",
    labelPlural: "Esteticistas",
    icon: "🌸",
    color: "#10B981",
    description: "Faciales, tratamientos de piel y depilación",
  },
  massage_therapist: {
    label: "Masajista",
    labelPlural: "Masajistas",
    icon: "💆",
    color: "#6366F1",
    description: "Masajes terapéuticos y relajantes",
  },
  makeup_artist: {
    label: "Maquillista",
    labelPlural: "Maquillistas",
    icon: "💄",
    color: "#F43F5E",
    description: "Maquillaje profesional y artístico",
  },
  barber: {
    label: "Barbero",
    labelPlural: "Barberos",
    icon: "💈",
    color: "#3B82F6",
    description: "Cortes de caballero, barba y afeitado",
  },
  receptionist: {
    label: "Recepcionista",
    labelPlural: "Recepcionistas",
    icon: "📋",
    color: "#64748B",
    description: "Atención al cliente y gestión de citas",
  },
};

// ============================================
// HORARIOS DE EMPLEADOS
// ============================================

/**
 * Horario de un día específico
 */
export interface DaySchedule {
  isWorking: boolean;
  open?: string;      // "09:00"
  close?: string;     // "18:00"
}

/**
 * Horario semanal completo de un empleado
 */
export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
  // Descanso/comida
  breakEnabled: boolean;
  breakStartTime?: string;  // "13:00"
  breakEndTime?: string;    // "14:00"
}

/**
 * Tipos de ausencia
 */
export type TimeOffType =
  | "vacation"    // 🏖️ Vacaciones programadas
  | "sick"        // 🤒 Incapacidad/enfermedad
  | "personal"    // 👤 Asunto personal
  | "holiday"     // 🎉 Día festivo
  | "training";   // 📚 Capacitación

/**
 * Configuración visual de tipos de ausencia
 */
export const TIME_OFF_TYPES: Record<TimeOffType, {
  label: string;
  icon: string;
  color: string;
}> = {
  vacation: {
    label: "Vacaciones",
    icon: "🏖️",
    color: "#3B82F6",
  },
  sick: {
    label: "Incapacidad",
    icon: "🤒",
    color: "#EF4444",
  },
  personal: {
    label: "Asunto personal",
    icon: "👤",
    color: "#8B5CF6",
  },
  holiday: {
    label: "Día festivo",
    icon: "🎉",
    color: "#F59E0B",
  },
  training: {
    label: "Capacitación",
    icon: "📚",
    color: "#10B981",
  },
};

/**
 * Período de ausencia (vacaciones, incapacidad, etc.)
 */
export interface TimeOff {
  id: string;
  type: TimeOffType;
  startDate: string;      // "2026-03-01"
  endDate: string;        // "2026-03-07"
  reason?: string;
  approved: boolean;
  approvedBy?: string;    // staffId del gerente/dueño
  approvedAt?: string;
  createdAt: string;
}

/**
 * Día libre recurrente (ej: siempre libra los miércoles)
 */
export interface RecurringDayOff {
  dayOfWeek: number;    // 0=domingo, 1=lunes, etc.
  reason?: string;
}

// ============================================
// EMPLEADO (STAFF MEMBER)
// ============================================

/**
 * Empleado de negocio de belleza/servicios
 */
export interface BeautyStaff {
  id: string;
  shopId: string;

  // Información personal
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;

  // Rol y permisos
  role: BeautyStaffRole;
  isActive: boolean;

  // Servicios que puede realizar (IDs de BookingService)
  services: string[];

  // Horarios
  schedule: WeeklySchedule;
  timeOff: TimeOff[];
  recurringOff: RecurringDayOff[];

  // Métricas (opcional)
  commissionRate?: number;  // Porcentaje de comisión
  totalBookings: number;
  rating?: number;          // Calificación promedio (1-5)
  reviewCount?: number;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

/**
 * Input para crear un nuevo empleado
 */
export interface CreateStaffInput {
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: BeautyStaffRole;
  services: string[];
  schedule?: Partial<WeeklySchedule>;
  commissionRate?: number;
}

/**
 * Input para actualizar un empleado
 */
export interface UpdateStaffInput {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: BeautyStaffRole;
  isActive?: boolean;
  services?: string[];
  schedule?: Partial<WeeklySchedule>;
  commissionRate?: number;
}

// ============================================
// SLOTS POR EMPLEADO
// ============================================

/**
 * Slot de tiempo para un empleado
 */
export interface StaffTimeSlot {
  time: string;           // "09:00"
  available: boolean;
  bookingId: string | null;
}

/**
 * Slots de un día para un empleado específico
 */
export interface StaffDaySlots {
  staffId: string;
  staffName: string;
  date: string;           // "2026-02-25"
  slots: Record<string, StaffTimeSlot>;
  updatedAt: string;
}

/**
 * Empleado disponible para un servicio/fecha
 */
export interface AvailableStaff {
  id: string;
  name: string;
  role: BeautyStaffRole;
  avatar?: string;
  rating?: number;
  availableSlots: string[];   // ["09:00", "09:30", "10:00"]
}

// ============================================
// FUNCIONES HELPER
// ============================================

/**
 * Horario semanal por defecto (L-V 9-18, S 10-15)
 */
export const DEFAULT_WEEKLY_SCHEDULE: WeeklySchedule = {
  monday: { isWorking: true, open: "09:00", close: "18:00" },
  tuesday: { isWorking: true, open: "09:00", close: "18:00" },
  wednesday: { isWorking: true, open: "09:00", close: "18:00" },
  thursday: { isWorking: true, open: "09:00", close: "18:00" },
  friday: { isWorking: true, open: "09:00", close: "18:00" },
  saturday: { isWorking: true, open: "10:00", close: "15:00" },
  sunday: { isWorking: false },
  breakEnabled: true,
  breakStartTime: "13:00",
  breakEndTime: "14:00",
};

/**
 * Verifica si un empleado trabaja en un día específico
 */
export function isStaffWorkingOnDate(
  staff: BeautyStaff,
  date: string
): boolean {
  const dateObj = new Date(date + "T12:00:00");
  const dayOfWeek = dateObj.getDay();

  // Verificar días libres recurrentes
  if (staff.recurringOff.some(r => r.dayOfWeek === dayOfWeek)) {
    return false;
  }

  // Verificar ausencias (vacaciones, incapacidad, etc.)
  const isOnTimeOff = staff.timeOff.some(t => {
    if (!t.approved) return false;
    return date >= t.startDate && date <= t.endDate;
  });
  if (isOnTimeOff) {
    return false;
  }

  // Verificar horario semanal
  const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const dayKey = dayKeys[dayOfWeek];
  const daySchedule = staff.schedule[dayKey];

  return daySchedule.isWorking;
}

/**
 * Obtiene el horario de trabajo de un empleado para un día
 */
export function getStaffScheduleForDate(
  staff: BeautyStaff,
  date: string
): { open: string; close: string } | null {
  if (!isStaffWorkingOnDate(staff, date)) {
    return null;
  }

  const dateObj = new Date(date + "T12:00:00");
  const dayOfWeek = dateObj.getDay();
  const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const dayKey = dayKeys[dayOfWeek];
  const daySchedule = staff.schedule[dayKey];

  if (!daySchedule.isWorking || !daySchedule.open || !daySchedule.close) {
    return null;
  }

  return {
    open: daySchedule.open,
    close: daySchedule.close,
  };
}

/**
 * Obtiene el rol de staff en español
 */
export function getStaffRoleLabel(role: BeautyStaffRole): string {
  return BEAUTY_STAFF_ROLES[role]?.label || role;
}

/**
 * Obtiene el color del rol
 */
export function getStaffRoleColor(role: BeautyStaffRole): string {
  return BEAUTY_STAFF_ROLES[role]?.color || "#64748B";
}

/**
 * Obtiene el icono del rol
 */
export function getStaffRoleIcon(role: BeautyStaffRole): string {
  return BEAUTY_STAFF_ROLES[role]?.icon || "👤";
}
