import {
  findPendingAssignmentByPhone,
  acceptAssignment,
  rejectAssignment,
  getAssignmentConfig,
} from "@/lib/services/order-assignment.service";
import type { AssignmentResponseResult } from "@/lib/types/order-assignment.types";

/**
 * Procesa una respuesta de WhatsApp para ver si es una respuesta
 * a una notificación de asignación de pedido.
 */
export async function checkOrderAssignmentResponse(
  instanceName: string,
  phone: string,
  message: string
): Promise<AssignmentResponseResult> {
  // Buscar si hay una asignación pendiente para este teléfono
  const result = await findPendingAssignmentByPhone(phone);

  if (!result) {
    return { handled: false };
  }

  const { shopId, assignment } = result;
  const config = await getAssignmentConfig(shopId);

  // Normalizar mensaje para comparación
  const normalizedMessage = message.toUpperCase().trim();

  // Verificar si es aceptación
  const isAccept = config.acceptKeywords.some((keyword) =>
    normalizedMessage.includes(keyword.toUpperCase())
  );

  if (isAccept) {
    // Buscar datos del staff en la notificación
    // Por ahora usamos el teléfono como identificador
    const staffId = `staff-${phone}`;
    const staffName = "Vendedor"; // TODO: Obtener nombre real del staff

    const success = await acceptAssignment(
      shopId,
      assignment.id,
      staffId,
      staffName,
      phone
    );

    if (success) {
      return {
        handled: true,
        action: "accept",
        assignmentId: assignment.id,
        message: `Pedido #${assignment.orderNumber} asignado a ti. ¡Gracias!`,
      };
    }
  }

  // Verificar si es rechazo
  const isReject = config.rejectKeywords.some((keyword) =>
    normalizedMessage.includes(keyword.toUpperCase())
  );

  if (isReject) {
    await rejectAssignment(shopId, assignment.id, `staff-${phone}`);

    return {
      handled: true,
      action: "reject",
      assignmentId: assignment.id,
      message: "Entendido. El pedido se pasará al siguiente vendedor disponible.",
    };
  }

  // Mensaje no reconocido pero relacionado con asignación
  return {
    handled: true,
    action: "unknown",
    assignmentId: assignment.id,
    message: `No entendí tu respuesta para el pedido #${assignment.orderNumber}.

Responde:
*SÍ* o *ACEPTO* - Para aceptar el pedido
*NO* o *PASO* - Para pasarlo a otro vendedor`,
  };
}

/**
 * Obtener el shopId desde el nombre de la instancia de WhatsApp.
 * Formato esperado: shop_{shopSlug} -> convertir a shopId
 */
export function extractShopIdFromInstance(instanceName: string): string | null {
  if (instanceName.startsWith("shop_")) {
    return instanceName.replace("shop_", "").replace(/_/g, "-");
  }
  return null;
}
