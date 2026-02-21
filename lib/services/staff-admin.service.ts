"use server";

/**
 * Staff Admin Service
 * Gestión de empleados usando Firebase Admin SDK (server-side)
 */

import { adminDb } from "@/lib/firebase-admin";
import type {
  BeautyStaff,
  CreateStaffInput,
  UpdateStaffInput,
  TimeOff,
  WeeklySchedule,
  DEFAULT_WEEKLY_SCHEDULE,
} from "@/lib/types/staff.types";

// Colección de staff
const getStaffCollection = (shopId: string) => `shops/${shopId}/staff`;

// ============================================
// CRUD DE EMPLEADOS
// ============================================

/**
 * Obtener todos los empleados de una tienda
 */
export async function getStaffAdmin(shopId: string): Promise<BeautyStaff[]> {
  const db = adminDb();
  if (!db) {
    console.error("Admin DB not initialized");
    return [];
  }

  try {
    const snapshot = await db
      .collection(getStaffCollection(shopId))
      .orderBy("name", "asc")
      .get();

    const staff: BeautyStaff[] = [];
    snapshot.forEach((doc) => {
      staff.push({
        id: doc.id,
        ...doc.data(),
      } as BeautyStaff);
    });

    return staff;
  } catch (error) {
    console.error("Error getting staff:", error);
    return [];
  }
}

/**
 * Obtener empleados activos
 */
export async function getActiveStaffAdmin(shopId: string): Promise<BeautyStaff[]> {
  const db = adminDb();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection(getStaffCollection(shopId))
      .where("isActive", "==", true)
      .orderBy("name", "asc")
      .get();

    const staff: BeautyStaff[] = [];
    snapshot.forEach((doc) => {
      staff.push({
        id: doc.id,
        ...doc.data(),
      } as BeautyStaff);
    });

    return staff;
  } catch (error) {
    console.error("Error getting active staff:", error);
    return [];
  }
}

/**
 * Obtener un empleado por ID
 */
export async function getStaffByIdAdmin(
  shopId: string,
  staffId: string
): Promise<BeautyStaff | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const docSnap = await db.collection(getStaffCollection(shopId)).doc(staffId).get();
    if (!docSnap.exists) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as BeautyStaff;
  } catch (error) {
    console.error("Error getting staff by ID:", error);
    return null;
  }
}

/**
 * Obtener empleados que pueden hacer un servicio específico
 */
export async function getStaffByServiceAdmin(
  shopId: string,
  serviceId: string
): Promise<BeautyStaff[]> {
  const db = adminDb();
  if (!db) return [];

  try {
    const snapshot = await db
      .collection(getStaffCollection(shopId))
      .where("isActive", "==", true)
      .where("services", "array-contains", serviceId)
      .get();

    const staff: BeautyStaff[] = [];
    snapshot.forEach((doc) => {
      staff.push({
        id: doc.id,
        ...doc.data(),
      } as BeautyStaff);
    });

    return staff;
  } catch (error) {
    console.error("Error getting staff by service:", error);
    return [];
  }
}

/**
 * Obtener empleados que pueden hacer TODOS los servicios especificados
 */
export async function getStaffByServicesAdmin(
  shopId: string,
  serviceIds: string[]
): Promise<BeautyStaff[]> {
  if (serviceIds.length === 0) {
    return getActiveStaffAdmin(shopId);
  }

  // Firestore no soporta múltiples array-contains, así que filtramos en memoria
  const allStaff = await getActiveStaffAdmin(shopId);

  return allStaff.filter((staff) =>
    serviceIds.every((serviceId) => staff.services.includes(serviceId))
  );
}

/**
 * Crear un nuevo empleado
 */
export async function createStaffAdmin(
  shopId: string,
  input: CreateStaffInput
): Promise<BeautyStaff> {
  const db = adminDb();
  if (!db) {
    throw new Error("Admin DB not initialized");
  }

  const now = new Date().toISOString();

  // Importar el default schedule dinámicamente para evitar problemas de import
  const defaultSchedule: WeeklySchedule = {
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

  const staffData: Omit<BeautyStaff, "id"> = {
    shopId,
    name: input.name,
    email: input.email || null,
    phone: input.phone || null,
    avatar: input.avatar || null,
    role: input.role,
    isActive: true,
    services: input.services || [],
    schedule: input.schedule
      ? { ...defaultSchedule, ...input.schedule }
      : defaultSchedule,
    timeOff: [],
    recurringOff: [],
    commissionRate: input.commissionRate || null,
    totalBookings: 0,
    rating: undefined,
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  } as Omit<BeautyStaff, "id">;

  const docRef = await db.collection(getStaffCollection(shopId)).add(staffData);

  return {
    id: docRef.id,
    ...staffData,
  } as BeautyStaff;
}

/**
 * Actualizar un empleado
 */
export async function updateStaffAdmin(
  shopId: string,
  staffId: string,
  updates: UpdateStaffInput
): Promise<BeautyStaff | null> {
  const db = adminDb();
  if (!db) {
    throw new Error("Admin DB not initialized");
  }

  const docRef = db.collection(getStaffCollection(shopId)).doc(staffId);
  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    return null;
  }

  const currentData = docSnap.data() as BeautyStaff;

  // Merge schedule if partial update
  let scheduleUpdate = updates.schedule;
  if (scheduleUpdate) {
    scheduleUpdate = { ...currentData.schedule, ...scheduleUpdate };
  }

  const updateData = {
    ...updates,
    ...(scheduleUpdate && { schedule: scheduleUpdate }),
    updatedAt: new Date().toISOString(),
  };

  await docRef.update(updateData);

  const updated = await docRef.get();
  return {
    id: updated.id,
    ...updated.data(),
  } as BeautyStaff;
}

/**
 * Eliminar un empleado
 */
export async function deleteStaffAdmin(
  shopId: string,
  staffId: string
): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;

  try {
    await db.collection(getStaffCollection(shopId)).doc(staffId).delete();
    return true;
  } catch (error) {
    console.error("Error deleting staff:", error);
    return false;
  }
}

/**
 * Activar/desactivar un empleado
 */
export async function toggleStaffActiveAdmin(
  shopId: string,
  staffId: string,
  isActive: boolean
): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;

  try {
    await db.collection(getStaffCollection(shopId)).doc(staffId).update({
      isActive,
      updatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("Error toggling staff active:", error);
    return false;
  }
}

// ============================================
// GESTIÓN DE HORARIOS
// ============================================

/**
 * Actualizar horario semanal de un empleado
 */
export async function updateStaffScheduleAdmin(
  shopId: string,
  staffId: string,
  schedule: Partial<WeeklySchedule>
): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;

  try {
    const docRef = db.collection(getStaffCollection(shopId)).doc(staffId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return false;

    const currentData = docSnap.data() as BeautyStaff;
    const newSchedule = { ...currentData.schedule, ...schedule };

    await docRef.update({
      schedule: newSchedule,
      updatedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Error updating staff schedule:", error);
    return false;
  }
}

// ============================================
// GESTIÓN DE AUSENCIAS (TIME OFF)
// ============================================

/**
 * Agregar período de ausencia a un empleado
 */
export async function addTimeOffAdmin(
  shopId: string,
  staffId: string,
  timeOff: Omit<TimeOff, "id" | "createdAt">
): Promise<TimeOff | null> {
  const db = adminDb();
  if (!db) return null;

  try {
    const docRef = db.collection(getStaffCollection(shopId)).doc(staffId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return null;

    const currentData = docSnap.data() as BeautyStaff;
    const now = new Date().toISOString();

    const newTimeOff: TimeOff = {
      ...timeOff,
      id: `to_${Date.now()}`,
      createdAt: now,
    };

    const updatedTimeOff = [...(currentData.timeOff || []), newTimeOff];

    await docRef.update({
      timeOff: updatedTimeOff,
      updatedAt: now,
    });

    return newTimeOff;
  } catch (error) {
    console.error("Error adding time off:", error);
    return null;
  }
}

/**
 * Eliminar período de ausencia
 */
export async function removeTimeOffAdmin(
  shopId: string,
  staffId: string,
  timeOffId: string
): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;

  try {
    const docRef = db.collection(getStaffCollection(shopId)).doc(staffId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return false;

    const currentData = docSnap.data() as BeautyStaff;
    const updatedTimeOff = (currentData.timeOff || []).filter(
      (t) => t.id !== timeOffId
    );

    await docRef.update({
      timeOff: updatedTimeOff,
      updatedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Error removing time off:", error);
    return false;
  }
}

/**
 * Aprobar/rechazar período de ausencia
 */
export async function approveTimeOffAdmin(
  shopId: string,
  staffId: string,
  timeOffId: string,
  approved: boolean,
  approvedBy: string
): Promise<boolean> {
  const db = adminDb();
  if (!db) return false;

  try {
    const docRef = db.collection(getStaffCollection(shopId)).doc(staffId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return false;

    const currentData = docSnap.data() as BeautyStaff;
    const updatedTimeOff = (currentData.timeOff || []).map((t) => {
      if (t.id === timeOffId) {
        return {
          ...t,
          approved,
          approvedBy,
          approvedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    await docRef.update({
      timeOff: updatedTimeOff,
      updatedAt: new Date().toISOString(),
    });

    return true;
  } catch (error) {
    console.error("Error approving time off:", error);
    return false;
  }
}

// ============================================
// VERIFICACIÓN DE DISPONIBILIDAD
// ============================================

/**
 * Verificar si un empleado trabaja en una fecha específica
 */
export async function isStaffWorkingOnDateAdmin(
  shopId: string,
  staffId: string,
  date: string
): Promise<{ working: boolean; reason?: string }> {
  const staff = await getStaffByIdAdmin(shopId, staffId);
  if (!staff) {
    return { working: false, reason: "Empleado no encontrado" };
  }

  if (!staff.isActive) {
    return { working: false, reason: "Empleado inactivo" };
  }

  const dateObj = new Date(date + "T12:00:00");
  const dayOfWeek = dateObj.getDay();

  // Verificar días libres recurrentes
  const recurringOff = staff.recurringOff.find((r) => r.dayOfWeek === dayOfWeek);
  if (recurringOff) {
    return {
      working: false,
      reason: recurringOff.reason || "Día libre fijo",
    };
  }

  // Verificar ausencias (vacaciones, incapacidad, etc.)
  const timeOff = staff.timeOff.find((t) => {
    if (!t.approved) return false;
    return date >= t.startDate && date <= t.endDate;
  });
  if (timeOff) {
    return {
      working: false,
      reason: timeOff.reason || `Ausencia (${timeOff.type})`,
    };
  }

  // Verificar horario semanal
  const dayKeys = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ] as const;
  const dayKey = dayKeys[dayOfWeek];
  const daySchedule = staff.schedule[dayKey];

  if (!daySchedule.isWorking) {
    return { working: false, reason: "No trabaja este día" };
  }

  return { working: true };
}

/**
 * Obtener empleados disponibles para una fecha y servicios específicos
 */
export async function getAvailableStaffForDateAdmin(
  shopId: string,
  date: string,
  serviceIds: string[]
): Promise<BeautyStaff[]> {
  // Obtener empleados que pueden hacer los servicios
  const staffList = await getStaffByServicesAdmin(shopId, serviceIds);

  // Filtrar los que trabajan ese día
  const availableStaff: BeautyStaff[] = [];

  for (const staff of staffList) {
    const { working } = await isStaffWorkingOnDateAdmin(shopId, staff.id, date);
    if (working) {
      availableStaff.push(staff);
    }
  }

  return availableStaff;
}
