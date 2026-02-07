import {
  findPendingAssignmentByPhone,
  acceptAssignment,
  rejectAssignment,
  getAssignmentConfig,
} from "@/lib/services/order-assignment.service";
import {
  getFleetByPhone,
  getConnectedFleets,
  incrementFleetStats,
} from "@/lib/services/fleet-admin.service";
import { sendTextMessage } from "@/lib/evolution";
import type { AssignmentResponseResult } from "@/lib/types/order-assignment.types";

/**
 * Procesa una respuesta de WhatsApp para ver si es una respuesta
 * a una notificación de asignación de pedido.
 *
 * Este handler se activa cuando un empleado (flota) responde
 * a la notificación de un nuevo pedido.
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

  // Buscar la flota que responde
  const fleet = await getFleetByPhone(shopId, phone);
  const fleetName = fleet?.name || "Vendedor";
  const fleetId = fleet?.id || `staff-${phone}`;

  // Normalizar mensaje para comparación
  const normalizedMessage = message.toUpperCase().trim();

  // Verificar si es aceptación
  const isAccept = config.acceptKeywords.some((keyword) =>
    normalizedMessage.includes(keyword.toUpperCase())
  );

  if (isAccept) {
    const success = await acceptAssignment(
      shopId,
      assignment.id,
      fleetId,
      fleetName,
      phone
    );

    if (success) {
      // Actualizar estadísticas de la flota
      if (fleet) {
        await incrementFleetStats(shopId, fleetId, true);
      }

      // Notificar a las demás flotas que el pedido fue tomado
      await notifyOtherFleetsOrderTaken(shopId, fleetId, fleetName, assignment.orderNumber);

      return {
        handled: true,
        action: "accept",
        assignmentId: assignment.id,
        message: `✅ Pedido #${assignment.orderNumber} asignado a ti.

Cliente: ${assignment.orderSummary.customerName}
Total: $${assignment.orderSummary.total.toLocaleString()}

¡Gracias por aceptarlo!`,
      };
    }
  }

  // Verificar si es rechazo
  const isReject = config.rejectKeywords.some((keyword) =>
    normalizedMessage.includes(keyword.toUpperCase())
  );

  if (isReject) {
    await rejectAssignment(shopId, assignment.id, fleetId);

    // Actualizar estadísticas de la flota
    if (fleet) {
      await incrementFleetStats(shopId, fleetId, false);
    }

    return {
      handled: true,
      action: "reject",
      assignmentId: assignment.id,
      message: "👍 Entendido. El pedido se pasará al siguiente vendedor disponible.",
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
 * Notifica a las demás flotas que un pedido fue tomado
 */
async function notifyOtherFleetsOrderTaken(
  shopId: string,
  acceptingFleetId: string,
  acceptingFleetName: string,
  orderNumber: string
): Promise<void> {
  try {
    const connectedFleets = await getConnectedFleets(shopId);

    for (const fleet of connectedFleets) {
      // No notificar a la flota que aceptó
      if (fleet.id === acceptingFleetId) continue;

      try {
        await sendTextMessage(
          fleet.instanceName,
          fleet.phone,
          `📋 Pedido #${orderNumber} fue tomado por *${acceptingFleetName}*`
        );
      } catch (error) {
        console.error(`Error notifying fleet ${fleet.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Error notifying other fleets:", error);
  }
}

/**
 * Obtener el shopId desde el nombre de la instancia de WhatsApp.
 * Formato esperado: shop_{shopSlug} -> convertir a shopId
 */
export function extractShopIdFromInstance(instanceName: string): string | null {
  if (instanceName.startsWith("shop_")) {
    return instanceName.replace("shop_", "").replace(/_/g, "-");
  }
  if (instanceName.startsWith("fleet_")) {
    // fleet_shopid_phone -> shopid
    const parts = instanceName.replace("fleet_", "").split("_");
    if (parts.length >= 1) {
      return parts[0].replace(/_/g, "-");
    }
  }
  return null;
}
