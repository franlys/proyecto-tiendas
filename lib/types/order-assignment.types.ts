import { Timestamp } from "firebase/firestore";

// Estados de asignación de pedido
export type OrderAssignmentStatus =
  | "pending"      // Esperando asignación
  | "notifying"    // Notificando a un vendedor
  | "assigned"     // Asignado a un vendedor
  | "expired";     // Expiró sin asignación

// Documento de asignación de pedido
export interface OrderAssignment {
  id: string;
  orderId: string;
  orderNumber: string;
  shopId: string;
  status: OrderAssignmentStatus;

  // Tracking de rotación
  currentStaffIndex: number;
  rotationCount: number;
  notifiedStaffIds: string[];

  // Asignación
  assignedToStaffId: string | null;
  assignedToStaffName: string | null;
  assignedToPhone: string | null;
  assignedAt: Timestamp | null;

  // Notificaciones
  lastNotificationSentAt: Timestamp | null;
  lastNotificationMessageId: string | null;
  nextEscalationAt: Timestamp | null;

  // Datos del pedido (snapshot para notificación)
  orderSummary: {
    customerName: string;
    total: number;
    itemCount: number;
  };

  // Lifecycle
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt: Timestamp;
}

// Configuración de asignación rotativa
export interface OrderAssignmentConfig {
  enabled: boolean;
  initialTimeoutMinutes: number;      // Default: 5
  rotationTimeoutMinutes: number;     // Default: 8 (cuando hay pocos vendedores)
  maxRotations: number;               // Default: 3
  eligibleRoles: string[];            // ["sales", "manager"]
  notifyOwnerOnExpiry: boolean;       // Notificar al dueño si nadie acepta
  acceptKeywords: string[];           // ["SI", "SÍ", "ACEPTO", "ACEPTAR", "1"]
  rejectKeywords: string[];           // ["NO", "RECHAZAR", "PASO", "2"]
  businessHoursOnly: boolean;         // Solo durante horario laboral
  businessHoursStart: string;         // "09:00"
  businessHoursEnd: string;           // "18:00"
}

// Log de notificación enviada
export interface AssignmentNotification {
  id: string;
  assignmentId: string;
  staffId: string;
  staffName: string;
  staffPhone: string;
  messageSentAt: Timestamp;
  messageId: string | null;
  responseReceived: boolean;
  responseText: string | null;
  responseType: "accept" | "reject" | "unknown" | null;
  respondedAt: Timestamp | null;
}

// Input para crear asignación
export interface CreateAssignmentInput {
  orderId: string;
  orderNumber: string;
  shopId: string;
  orderSummary: {
    customerName: string;
    total: number;
    itemCount: number;
  };
}

// Staff elegible para asignación
export interface EligibleStaff {
  id: string;
  name: string;
  phone: string;
  role: string;
  isAvailable: boolean;
}

// Resultado de procesamiento de respuesta
export interface AssignmentResponseResult {
  handled: boolean;
  action?: "accept" | "reject" | "unknown";
  assignmentId?: string;
  message?: string;
}

// Valores por defecto
export const DEFAULT_ASSIGNMENT_CONFIG: OrderAssignmentConfig = {
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
