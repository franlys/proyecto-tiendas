import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
} from "firebase/firestore";
import { sendTextMessage, getInstanceName } from "@/lib/evolution";
import type {
  OrderAssignment,
  OrderAssignmentConfig,
  AssignmentNotification,
  CreateAssignmentInput,
  EligibleStaff,
  DEFAULT_ASSIGNMENT_CONFIG,
} from "@/lib/types/order-assignment.types";

// Colecciones
const getAssignmentsCollection = (shopId: string) =>
  `shops/${shopId}/orderAssignments`;
const getConfigDoc = (shopId: string) =>
  `shops/${shopId}/orderAssignmentConfig/config`;
const getNotificationsCollection = (shopId: string) =>
  `shops/${shopId}/assignmentNotifications`;

// ==================== CONFIG ====================

export async function getAssignmentConfig(
  shopId: string
): Promise<OrderAssignmentConfig> {
  const docRef = doc(db, getConfigDoc(shopId));
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as OrderAssignmentConfig;
  }

  // Retornar config por defecto
  return {
    enabled: false,
    initialTimeoutMinutes: 5,
    rotationTimeoutMinutes: 8,
    maxRotations: 3,
    eligibleRoles: ["sales", "manager"],
    notifyOwnerOnExpiry: true,
    acceptKeywords: ["SI", "SÍ", "ACEPTO", "ACEPTAR", "OK", "1"],
    rejectKeywords: ["NO", "RECHAZAR", "PASO", "OCUPADO", "2"],
    businessHoursOnly: false,
    businessHoursStart: "09:00",
    businessHoursEnd: "18:00",
  };
}

export async function updateAssignmentConfig(
  shopId: string,
  config: Partial<OrderAssignmentConfig>
): Promise<void> {
  const docRef = doc(db, getConfigDoc(shopId));
  await updateDoc(docRef, {
    ...config,
    updatedAt: serverTimestamp(),
  });
}

// ==================== STAFF ====================

export async function getEligibleStaff(shopId: string): Promise<EligibleStaff[]> {
  const config = await getAssignmentConfig(shopId);

  // Obtener staff de la colección de la tienda
  const staffRef = collection(db, `shops/${shopId}/staff`);
  const q = query(
    staffRef,
    where("isActive", "==", true),
    where("role", "in", config.eligibleRoles)
  );

  const snapshot = await getDocs(q);
  const staff: EligibleStaff[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    if (data.phone) {
      staff.push({
        id: doc.id,
        name: data.name,
        phone: data.phone,
        role: data.role,
        isAvailable: true, // TODO: Verificar disponibilidad real
      });
    }
  });

  return staff;
}

// ==================== ASSIGNMENTS ====================

export async function createAssignment(
  input: CreateAssignmentInput
): Promise<OrderAssignment | null> {
  const config = await getAssignmentConfig(input.shopId);

  if (!config.enabled) {
    console.log("Assignment rotation is disabled for shop:", input.shopId);
    return null;
  }

  const eligibleStaff = await getEligibleStaff(input.shopId);

  if (eligibleStaff.length === 0) {
    console.log("No eligible staff found for shop:", input.shopId);
    return null;
  }

  const now = Timestamp.now();
  const timeoutMs = config.initialTimeoutMinutes * 60 * 1000;
  const expirationMs = config.maxRotations * eligibleStaff.length * timeoutMs * 2;

  const assignmentData = {
    orderId: input.orderId,
    orderNumber: input.orderNumber,
    shopId: input.shopId,
    status: "pending" as const,
    currentStaffIndex: 0,
    rotationCount: 0,
    notifiedStaffIds: [],
    assignedToStaffId: null,
    assignedToStaffName: null,
    assignedToPhone: null,
    assignedAt: null,
    lastNotificationSentAt: null,
    lastNotificationMessageId: null,
    nextEscalationAt: Timestamp.fromMillis(now.toMillis() + timeoutMs),
    orderSummary: input.orderSummary,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    expiresAt: Timestamp.fromMillis(now.toMillis() + expirationMs),
  };

  const docRef = await addDoc(
    collection(db, getAssignmentsCollection(input.shopId)),
    assignmentData
  );

  const assignment: OrderAssignment = {
    id: docRef.id,
    ...assignmentData,
    createdAt: now,
    updatedAt: now,
  } as OrderAssignment;

  // Notificar al primer vendedor
  await notifyStaff(assignment, eligibleStaff[0], input.shopId);

  return assignment;
}

export async function getAssignment(
  shopId: string,
  assignmentId: string
): Promise<OrderAssignment | null> {
  const docRef = doc(db, getAssignmentsCollection(shopId), assignmentId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as OrderAssignment;
}

export async function getPendingAssignments(
  shopId: string
): Promise<OrderAssignment[]> {
  const ref = collection(db, getAssignmentsCollection(shopId));
  const q = query(
    ref,
    where("status", "in", ["pending", "notifying"]),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);
  const assignments: OrderAssignment[] = [];

  snapshot.forEach((doc) => {
    assignments.push({
      id: doc.id,
      ...doc.data(),
    } as OrderAssignment);
  });

  return assignments;
}

// ==================== NOTIFICACIONES ====================

async function notifyStaff(
  assignment: OrderAssignment,
  staff: EligibleStaff,
  shopId: string
): Promise<void> {
  const instanceName = getInstanceName(shopId);

  const message = `*NUEVO PEDIDO #${assignment.orderNumber}*

Cliente: ${assignment.orderSummary.customerName}
Total: $${assignment.orderSummary.total.toLocaleString()}
Productos: ${assignment.orderSummary.itemCount}

Responde:
*SÍ* - Aceptar pedido
*NO* - Pasar a otro vendedor`;

  try {
    const result = await sendTextMessage(instanceName, staff.phone, message);

    // Actualizar asignación
    const docRef = doc(db, getAssignmentsCollection(shopId), assignment.id);
    const config = await getAssignmentConfig(shopId);
    const timeoutMs = config.initialTimeoutMinutes * 60 * 1000;

    await updateDoc(docRef, {
      status: "notifying",
      currentStaffIndex: assignment.currentStaffIndex,
      notifiedStaffIds: [...assignment.notifiedStaffIds, staff.id],
      lastNotificationSentAt: serverTimestamp(),
      lastNotificationMessageId: result?.key?.id || null,
      nextEscalationAt: Timestamp.fromMillis(Date.now() + timeoutMs),
      updatedAt: serverTimestamp(),
    });

    // Registrar notificación
    await addDoc(collection(db, getNotificationsCollection(shopId)), {
      assignmentId: assignment.id,
      staffId: staff.id,
      staffName: staff.name,
      staffPhone: staff.phone,
      messageSentAt: serverTimestamp(),
      messageId: result?.key?.id || null,
      responseReceived: false,
      responseText: null,
      responseType: null,
      respondedAt: null,
    });

    console.log(`Notified ${staff.name} for order ${assignment.orderNumber}`);
  } catch (error) {
    console.error("Error sending assignment notification:", error);
  }
}

// ==================== RESPUESTAS ====================

export async function acceptAssignment(
  shopId: string,
  assignmentId: string,
  staffId: string,
  staffName: string,
  staffPhone: string
): Promise<boolean> {
  const docRef = doc(db, getAssignmentsCollection(shopId), assignmentId);

  try {
    await updateDoc(docRef, {
      status: "assigned",
      assignedToStaffId: staffId,
      assignedToStaffName: staffName,
      assignedToPhone: staffPhone,
      assignedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Notificar a otros vendedores que ya fue tomado
    await notifyOthersOfAssignment(shopId, assignmentId, staffName);

    // Confirmar al vendedor que aceptó
    const instanceName = getInstanceName(shopId);
    await sendTextMessage(
      instanceName,
      staffPhone,
      `Pedido asignado a ti. ¡Gracias por aceptarlo!`
    );

    return true;
  } catch (error) {
    console.error("Error accepting assignment:", error);
    return false;
  }
}

export async function rejectAssignment(
  shopId: string,
  assignmentId: string,
  staffId: string
): Promise<void> {
  // Simplemente escalar al siguiente vendedor
  await escalateAssignment(shopId, assignmentId);
}

async function notifyOthersOfAssignment(
  shopId: string,
  assignmentId: string,
  assignedToName: string
): Promise<void> {
  // Obtener las notificaciones de este assignment
  const notificationsRef = collection(db, getNotificationsCollection(shopId));
  const q = query(notificationsRef, where("assignmentId", "==", assignmentId));
  const snapshot = await getDocs(q);

  const instanceName = getInstanceName(shopId);
  const assignment = await getAssignment(shopId, assignmentId);

  if (!assignment) return;

  for (const docSnap of snapshot.docs) {
    const notification = docSnap.data() as AssignmentNotification;

    // No notificar al que lo aceptó
    if (notification.staffPhone === assignment.assignedToPhone) continue;

    try {
      await sendTextMessage(
        instanceName,
        notification.staffPhone,
        `Pedido #${assignment.orderNumber} fue tomado por ${assignedToName}`
      );
    } catch (error) {
      console.error("Error notifying other staff:", error);
    }
  }
}

// ==================== ESCALACIÓN ====================

export async function escalateAssignment(
  shopId: string,
  assignmentId: string
): Promise<void> {
  const assignment = await getAssignment(shopId, assignmentId);

  if (!assignment || assignment.status === "assigned") {
    return;
  }

  const config = await getAssignmentConfig(shopId);
  const eligibleStaff = await getEligibleStaff(shopId);

  if (eligibleStaff.length === 0) {
    await markAssignmentExpired(shopId, assignmentId);
    return;
  }

  // Calcular siguiente índice
  let nextIndex = assignment.currentStaffIndex + 1;
  let rotationCount = assignment.rotationCount;

  // Si llegamos al final de la lista, comenzar nueva rotación
  if (nextIndex >= eligibleStaff.length) {
    nextIndex = 0;
    rotationCount++;

    // Verificar si excedimos el máximo de rotaciones
    if (rotationCount >= config.maxRotations) {
      await markAssignmentExpired(shopId, assignmentId);

      // Notificar al dueño si está configurado
      if (config.notifyOwnerOnExpiry) {
        await notifyOwnerOfExpiry(shopId, assignment);
      }
      return;
    }
  }

  // Actualizar y notificar al siguiente
  const docRef = doc(db, getAssignmentsCollection(shopId), assignmentId);
  await updateDoc(docRef, {
    currentStaffIndex: nextIndex,
    rotationCount,
    updatedAt: serverTimestamp(),
  });

  const nextStaff = eligibleStaff[nextIndex];
  await notifyStaff(
    { ...assignment, currentStaffIndex: nextIndex },
    nextStaff,
    shopId
  );
}

async function markAssignmentExpired(
  shopId: string,
  assignmentId: string
): Promise<void> {
  const docRef = doc(db, getAssignmentsCollection(shopId), assignmentId);
  await updateDoc(docRef, {
    status: "expired",
    updatedAt: serverTimestamp(),
  });
}

async function notifyOwnerOfExpiry(
  shopId: string,
  assignment: OrderAssignment
): Promise<void> {
  // Obtener teléfono del dueño desde la configuración de la tienda
  const shopDoc = await getDoc(doc(db, "shops", shopId));

  if (!shopDoc.exists()) return;

  const shopData = shopDoc.data();
  const ownerPhone = shopData.contact?.phone;

  if (!ownerPhone) return;

  const instanceName = getInstanceName(shopId);
  await sendTextMessage(
    instanceName,
    ownerPhone,
    `⚠️ *PEDIDO SIN ASIGNAR*

Pedido #${assignment.orderNumber} no fue aceptado por ningún vendedor.

Cliente: ${assignment.orderSummary.customerName}
Total: $${assignment.orderSummary.total.toLocaleString()}

Por favor asígnalo manualmente desde el panel de administración.`
  );
}

// ==================== CRON JOB ====================

export async function escalatePendingAssignments(): Promise<{
  escalated: number;
  expired: number;
}> {
  let escalated = 0;
  let expired = 0;

  // Obtener todas las tiendas con asignación activa
  const shopsRef = collection(db, "shops");
  const shopsSnapshot = await getDocs(shopsRef);

  for (const shopDoc of shopsSnapshot.docs) {
    const shopId = shopDoc.id;
    const config = await getAssignmentConfig(shopId);

    if (!config.enabled) continue;

    // Obtener asignaciones pendientes que necesitan escalación
    const assignmentsRef = collection(db, getAssignmentsCollection(shopId));
    const q = query(
      assignmentsRef,
      where("status", "in", ["pending", "notifying"]),
      where("nextEscalationAt", "<=", Timestamp.now())
    );

    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const assignment = {
        id: docSnap.id,
        ...docSnap.data(),
      } as OrderAssignment;

      // Verificar si expiró
      if (assignment.expiresAt.toMillis() <= Date.now()) {
        await markAssignmentExpired(shopId, assignment.id);

        if (config.notifyOwnerOnExpiry) {
          await notifyOwnerOfExpiry(shopId, assignment);
        }
        expired++;
      } else {
        // Escalar al siguiente
        await escalateAssignment(shopId, assignment.id);
        escalated++;
      }
    }
  }

  return { escalated, expired };
}

// ==================== BUSCAR POR TELÉFONO ====================

export async function findPendingAssignmentByPhone(
  phone: string
): Promise<{ shopId: string; assignment: OrderAssignment } | null> {
  // Buscar en todas las tiendas (optimizar en producción con índice)
  const shopsRef = collection(db, "shops");
  const shopsSnapshot = await getDocs(shopsRef);

  for (const shopDoc of shopsSnapshot.docs) {
    const shopId = shopDoc.id;

    // Buscar notificaciones recientes para este teléfono
    const notificationsRef = collection(db, getNotificationsCollection(shopId));
    const q = query(
      notificationsRef,
      where("staffPhone", "==", phone),
      where("responseReceived", "==", false),
      orderBy("messageSentAt", "desc"),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const notification = snapshot.docs[0].data() as AssignmentNotification;
      const assignment = await getAssignment(shopId, notification.assignmentId);

      if (assignment && ["pending", "notifying"].includes(assignment.status)) {
        return { shopId, assignment };
      }
    }
  }

  return null;
}
