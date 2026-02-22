/**
 * Handler para respuestas de WhatsApp relacionadas con rentas de vehículos
 *
 * Procesa respuestas de clientes a:
 * - Confirmación de recogida
 * - Reagendamiento
 * - Cancelación
 */

// Use Admin SDK versions for server-side webhook handlers
import {
  findRentalConversationByPhoneAdmin as findRentalConversationByPhone,
  getRentalConversationAdmin as getRentalConversation,
  getRentalAdmin as getRental,
  getRentalConfigAdmin as getRentalConfig,
  confirmRentalAdmin as confirmRental,
  cancelRentalAdmin as cancelRental,
  rescheduleRentalAdmin as rescheduleRental,
  clearRentalConversationAdmin as clearRentalConversation,
  isVehicleAvailableAdmin as isVehicleAvailable,
} from "@/lib/services/rental-admin.service";
import type { RentalConversation } from "@/lib/types/rental.types";

export interface RentalResponseResult {
  handled: boolean;
  action?: "confirm" | "cancel" | "reschedule" | "provide_dates" | "unknown";
  responseMessage?: string;
}

/**
 * Procesa una respuesta de WhatsApp para ver si es una respuesta
 * relacionada con confirmación/modificación de renta de vehículo
 */
export async function checkRentalConfirmationResponse(
  instanceName: string,
  phone: string,
  message: string
): Promise<RentalResponseResult> {
  // Buscar conversación activa para este teléfono
  const result = await findRentalConversationByPhone(phone);

  if (!result) {
    return { handled: false };
  }

  const { shopId, conversation } = result;
  const config = await getRentalConfig(shopId);

  if (!config) {
    return { handled: false };
  }

  // Procesar según el estado de la conversación
  switch (conversation.state) {
    case "awaiting_confirmation":
      return handleConfirmationResponse(shopId, phone, message, config);

    case "awaiting_new_dates":
      return handleNewDatesResponse(
        shopId,
        phone,
        message,
        conversation.currentRentalId!
      );

    case "awaiting_pickup_confirmation":
      return handlePickupConfirmation(shopId, phone, message);

    case "awaiting_return_confirmation":
      return handleReturnConfirmation(shopId, phone, message);

    default:
      return { handled: false };
  }
}

/**
 * Maneja respuesta a mensaje de confirmación de recogida
 */
async function handleConfirmationResponse(
  shopId: string,
  phone: string,
  message: string,
  config: Awaited<ReturnType<typeof getRentalConfig>>
): Promise<RentalResponseResult> {
  if (!config) return { handled: false };

  const normalizedMessage = message.toUpperCase().trim();
  const conversation = await getRentalConversation(shopId, phone);

  if (!conversation || !conversation.currentRentalId) {
    await clearRentalConversation(shopId, phone);
    return { handled: false };
  }

  const rentalId = conversation.currentRentalId;
  const rental = await getRental(shopId, rentalId);

  if (!rental) {
    await clearRentalConversation(shopId, phone);
    return { handled: false };
  }

  // Verificar confirmación
  const isConfirm = config.confirmKeywords.some((k) =>
    normalizedMessage.includes(k.toUpperCase())
  );

  if (isConfirm) {
    await confirmRental(shopId, rentalId);
    await clearRentalConversation(shopId, phone);

    return {
      handled: true,
      action: "confirm",
      responseMessage: `✅ *¡Recogida confirmada!*

Tu reserva ${rental.rentalNumber} está confirmada.

📅 Fecha: ${formatDate(rental.pickupDate)}
⏰ Hora: ${rental.pickupTime}
📍 Lugar: ${rental.pickupLocation}

🚙 Vehículo: ${rental.vehicleSnapshot.name}

Recuerda traer:
• Identificación oficial
• Licencia de conducir vigente
• Tarjeta de crédito para el depósito

¡Te esperamos! 🚗`,
    };
  }

  // Verificar solicitud de reagendar
  const isReschedule =
    normalizedMessage.includes("CAMBIAR") ||
    normalizedMessage.includes("REAGENDAR") ||
    normalizedMessage.includes("MODIFICAR");

  if (isReschedule) {
    // Actualizar estado a esperando nuevas fechas usando Admin SDK
    const { updateRentalConversationStateAdmin } = await import("@/lib/services/rental-admin.service");
    await updateRentalConversationStateAdmin(shopId, phone, "awaiting_new_dates", { rentalId });

    return {
      handled: true,
      action: "reschedule",
      responseMessage: `📅 *Reagendar reserva*

¿Para qué fechas te gustaría cambiar tu reserva?

Por favor escribe las nuevas fechas en formato:
*Recogida: día/mes - Devolución: día/mes*

Ejemplo: *15/02 - 18/02*

O escribe *CANCELAR* para cancelar la reserva.`,
    };
  }

  // Verificar cancelación
  const isCancel = config.cancelKeywords.some((k) =>
    normalizedMessage.includes(k.toUpperCase())
  );

  if (isCancel) {
    await cancelRental(shopId, rentalId, "Cancelada por WhatsApp");
    await clearRentalConversation(shopId, phone);

    return {
      handled: true,
      action: "cancel",
      responseMessage: `❌ *Reserva cancelada*

Tu reserva ${rental.rentalNumber} ha sido cancelada.

${rental.depositStatus === "collected" ? "Te contactaremos para procesar el reembolso del depósito según nuestra política de cancelación." : ""}

Esperamos verte pronto. 👋`,
    };
  }

  // No reconocido
  return {
    handled: true,
    action: "unknown",
    responseMessage: `No entendí tu respuesta. Por favor responde:

✅ *SÍ* - Confirmar recogida
📅 *CAMBIAR* - Modificar fechas
❌ *CANCELAR* - Cancelar reserva`,
  };
}

/**
 * Maneja respuesta con nuevas fechas para reagendar
 */
async function handleNewDatesResponse(
  shopId: string,
  phone: string,
  message: string,
  rentalId: string
): Promise<RentalResponseResult> {
  const normalizedMessage = message.toUpperCase().trim();

  // Verificar si quiere cancelar el proceso
  if (
    normalizedMessage.includes("CANCELAR") ||
    normalizedMessage.includes("NO")
  ) {
    await clearRentalConversation(shopId, phone);
    return {
      handled: true,
      action: "cancel",
      responseMessage: `Entendido, tu reserva queda sin cambios. 👍`,
    };
  }

  // Intentar parsear las fechas
  const dates = parseSpanishDates(message);

  if (!dates) {
    return {
      handled: true,
      action: "provide_dates",
      responseMessage: `No entendí las fechas. Por favor escríbelas así:

📅 *Recogida: día/mes - Devolución: día/mes*

Ejemplo: *15/02 - 18/02*

O escribe *CANCELAR* para dejar tu reserva como está.`,
    };
  }

  const { startDate, endDate } = dates;

  // Verificar que las fechas no sean en el pasado
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate < today) {
    return {
      handled: true,
      action: "provide_dates",
      responseMessage: `La fecha de recogida ya pasó. Por favor elige una fecha futura.`,
    };
  }

  if (endDate <= startDate) {
    return {
      handled: true,
      action: "provide_dates",
      responseMessage: `La fecha de devolución debe ser después de la recogida.`,
    };
  }

  const rental = await getRental(shopId, rentalId);
  if (!rental) {
    await clearRentalConversation(shopId, phone);
    return {
      handled: false,
    };
  }

  const startDateStr = formatDateISO(startDate);
  const endDateStr = formatDateISO(endDate);

  // Verificar disponibilidad
  const isAvailable = await isVehicleAvailable(
    shopId,
    rental.vehicleId,
    startDateStr,
    endDateStr
  );

  if (!isAvailable) {
    return {
      handled: true,
      action: "provide_dates",
      responseMessage: `Lo siento, el vehículo no está disponible para esas fechas.

Por favor elige otras fechas o contacta al negocio para ver opciones de vehículos similares.`,
    };
  }

  // Realizar el reagendamiento
  try {
    const updatedRental = await rescheduleRental(shopId, rentalId, {
      newPickupDate: startDateStr,
      newReturnDate: endDateStr,
    });

    await clearRentalConversation(shopId, phone);

    if (updatedRental) {
      return {
        handled: true,
        action: "reschedule",
        responseMessage: `✅ *¡Reserva reagendada!*

Tu reserva ${rental.rentalNumber} ha sido actualizada:

🚙 Vehículo: ${rental.vehicleSnapshot.name}
📅 Recogida: ${formatDate(startDateStr)} a las ${rental.pickupTime}
📅 Devolución: ${formatDate(endDateStr)} a las ${rental.returnTime}
📍 Lugar: ${rental.pickupLocation}

💰 Nuevo total: $${updatedRental.total.toLocaleString()}

¡Te esperamos! 🚗`,
      };
    }
  } catch (error) {
    return {
      handled: true,
      action: "unknown",
      responseMessage: `Hubo un error al reagendar. Por favor contacta al negocio directamente.`,
    };
  }

  return {
    handled: true,
    action: "unknown",
    responseMessage: `Hubo un error al reagendar. Por favor intenta de nuevo.`,
  };
}

/**
 * Maneja confirmación de que el cliente llegó a recoger
 */
async function handlePickupConfirmation(
  shopId: string,
  phone: string,
  message: string
): Promise<RentalResponseResult> {
  const normalizedMessage = message.toUpperCase().trim();
  const conversation = await getRentalConversation(shopId, phone);

  if (!conversation?.currentRentalId) {
    await clearRentalConversation(shopId, phone);
    return { handled: false };
  }

  if (normalizedMessage.includes("LLEGUÉ") || normalizedMessage.includes("AQUÍ")) {
    await clearRentalConversation(shopId, phone);

    return {
      handled: true,
      action: "confirm",
      responseMessage: `¡Perfecto! Un momento, nuestro personal te atenderá enseguida. 🚗`,
    };
  }

  return {
    handled: true,
    action: "unknown",
    responseMessage: `Cuando llegues a recoger tu vehículo, escribe *LLEGUÉ* para avisar a nuestro equipo.`,
  };
}

/**
 * Maneja confirmación de devolución
 */
async function handleReturnConfirmation(
  shopId: string,
  phone: string,
  message: string
): Promise<RentalResponseResult> {
  const normalizedMessage = message.toUpperCase().trim();
  const conversation = await getRentalConversation(shopId, phone);

  if (!conversation?.currentRentalId) {
    await clearRentalConversation(shopId, phone);
    return { handled: false };
  }

  if (
    normalizedMessage.includes("DEVUELVO") ||
    normalizedMessage.includes("ENTREGO") ||
    normalizedMessage.includes("LLEGUÉ")
  ) {
    await clearRentalConversation(shopId, phone);

    return {
      handled: true,
      action: "confirm",
      responseMessage: `¡Gracias! Te esperamos para recibir el vehículo. Un miembro de nuestro equipo te atenderá para la inspección. 🚗✅`,
    };
  }

  return {
    handled: true,
    action: "unknown",
    responseMessage: `Cuando llegues a devolver el vehículo, escribe *LLEGUÉ* para avisar a nuestro equipo.`,
  };
}

// ==================== HELPERS ====================

/**
 * Parsea fechas en formato "15/02 - 18/02" o "15 febrero - 18 febrero"
 */
function parseSpanishDates(
  text: string
): { startDate: Date; endDate: Date } | null {
  const months: Record<string, number> = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11,
    ene: 0,
    feb: 1,
    mar: 2,
    abr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    ago: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dic: 11,
  };

  const normalized = text.toLowerCase().replace(/de /g, "").trim();

  // Intentar formato "15/02 - 18/02"
  const slashMatch = normalized.match(
    /(\d{1,2})\/(\d{1,2})\s*[-–]\s*(\d{1,2})\/(\d{1,2})/
  );
  if (slashMatch) {
    const year = new Date().getFullYear();
    const startDate = new Date(
      year,
      parseInt(slashMatch[2]) - 1,
      parseInt(slashMatch[1])
    );
    const endDate = new Date(
      year,
      parseInt(slashMatch[4]) - 1,
      parseInt(slashMatch[3])
    );

    // Si las fechas ya pasaron, asumir próximo año
    if (startDate < new Date()) {
      startDate.setFullYear(year + 1);
      endDate.setFullYear(year + 1);
    }

    return { startDate, endDate };
  }

  // Intentar formato "15 febrero - 18 febrero"
  const textMatch = normalized.match(
    /(\d{1,2})\s*(\w+)\s*[-–]\s*(\d{1,2})\s*(\w+)/
  );
  if (textMatch) {
    const startMonth = months[textMatch[2]];
    const endMonth = months[textMatch[4]];

    if (startMonth !== undefined && endMonth !== undefined) {
      const year = new Date().getFullYear();
      const startDate = new Date(year, startMonth, parseInt(textMatch[1]));
      const endDate = new Date(year, endMonth, parseInt(textMatch[3]));

      if (startDate < new Date()) {
        startDate.setFullYear(year + 1);
        endDate.setFullYear(year + 1);
      }

      return { startDate, endDate };
    }
  }

  return null;
}

/**
 * Formatea fecha para mensaje amigable
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  return date.toLocaleDateString("es-MX", options);
}

/**
 * Formatea fecha a ISO string (YYYY-MM-DD)
 */
function formatDateISO(date: Date): string {
  return date.toISOString().split("T")[0];
}
