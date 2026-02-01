import {
  findConversationByPhone,
  getConversation,
  getBooking,
  getBookingConfig,
  confirmBooking,
  cancelBooking,
  rescheduleBooking,
  updateConversationState,
  clearConversation,
  getAvailableSlots,
  isSlotAvailable,
} from "@/lib/services/booking.service";
import type { BookingResponseResult } from "@/lib/types/booking.types";

/**
 * Procesa una respuesta de WhatsApp para ver si es una respuesta
 * relacionada con confirmación/modificación de cita.
 */
export async function checkBookingConfirmationResponse(
  instanceName: string,
  phone: string,
  message: string
): Promise<BookingResponseResult> {
  // Buscar conversación activa para este teléfono
  const result = await findConversationByPhone(phone);

  if (!result) {
    return { handled: false };
  }

  const { shopId, conversation } = result;
  const config = await getBookingConfig(shopId);

  // Procesar según el estado de la conversación
  switch (conversation.state) {
    case "awaiting_confirmation":
      return handleConfirmationResponse(shopId, phone, message, config);

    case "awaiting_new_date":
      return handleNewDateResponse(shopId, phone, message, conversation.currentBookingId!);

    case "awaiting_new_time":
      return handleNewTimeResponse(
        shopId,
        phone,
        message,
        conversation.currentBookingId!,
        conversation.stateData as { selectedDate: string }
      );

    default:
      return { handled: false };
  }
}

/**
 * Maneja respuesta a mensaje de confirmación de cita
 */
async function handleConfirmationResponse(
  shopId: string,
  phone: string,
  message: string,
  config: Awaited<ReturnType<typeof getBookingConfig>>
): Promise<BookingResponseResult> {
  const normalizedMessage = message.toUpperCase().trim();
  const conversation = await getConversation(shopId, phone);

  if (!conversation || !conversation.currentBookingId) {
    await clearConversation(shopId, phone);
    return { handled: false };
  }

  const bookingId = conversation.currentBookingId;

  // Verificar confirmación
  const isConfirm = config.confirmKeywords.some((k) =>
    normalizedMessage.includes(k.toUpperCase())
  );

  if (isConfirm) {
    await confirmBooking(shopId, bookingId);
    await clearConversation(shopId, phone);

    return {
      handled: true,
      action: "confirm",
      responseMessage: "¡Cita confirmada! Te esperamos. 😊",
    };
  }

  // Verificar solicitud de reagendar
  const isReschedule = config.rescheduleKeywords.some((k) =>
    normalizedMessage.includes(k.toUpperCase())
  );

  if (isReschedule) {
    await updateConversationState(shopId, phone, "awaiting_new_date", {
      bookingId,
    });

    return {
      handled: true,
      action: "reschedule",
      responseMessage: `Entendido. ¿Para qué fecha te gustaría cambiar tu cita?

Por favor escribe la fecha en formato:
📅 *día mes* (ejemplo: 15 febrero)`,
    };
  }

  // Verificar cancelación
  const isCancel = config.cancelKeywords.some((k) =>
    normalizedMessage.includes(k.toUpperCase())
  );

  if (isCancel) {
    await cancelBooking(shopId, bookingId, "Cancelada por WhatsApp");
    await clearConversation(shopId, phone);

    return {
      handled: true,
      action: "cancel",
      responseMessage: "Tu cita ha sido cancelada. Esperamos verte pronto. 👋",
    };
  }

  // No reconocido
  return {
    handled: true,
    action: "unknown",
    responseMessage: `No entendí tu respuesta. Por favor responde:

✅ *SÍ* - Confirmar asistencia
📅 *CAMBIAR* - Reagendar cita
❌ *CANCELAR* - Cancelar cita`,
  };
}

/**
 * Maneja respuesta con nueva fecha para reagendar
 */
async function handleNewDateResponse(
  shopId: string,
  phone: string,
  message: string,
  bookingId: string
): Promise<BookingResponseResult> {
  // Intentar parsear la fecha del mensaje
  const parsedDate = parseSpanishDate(message);

  if (!parsedDate) {
    return {
      handled: true,
      action: "provide_date",
      responseMessage: `No entendí la fecha. Por favor escríbela así:

📅 *día mes* (ejemplo: 15 febrero, 20 marzo)

O escribe *CANCELAR* para dejar tu cita como está.`,
    };
  }

  // Verificar que la fecha no sea en el pasado
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (parsedDate < today) {
    return {
      handled: true,
      action: "provide_date",
      responseMessage: "Esa fecha ya pasó. Por favor elige una fecha futura.",
    };
  }

  const dateStr = parsedDate.toISOString().split("T")[0];

  // Obtener slots disponibles para esa fecha
  const availableSlots = await getAvailableSlots(shopId, dateStr);

  if (availableSlots.length === 0) {
    return {
      handled: true,
      action: "provide_date",
      responseMessage: `Lo siento, no hay horarios disponibles para el ${formatDateForMessage(parsedDate)}.

Por favor elige otra fecha.`,
    };
  }

  // Guardar la fecha y pedir hora
  await updateConversationState(shopId, phone, "awaiting_new_time", {
    bookingId,
    selectedDate: dateStr,
  });

  const slotsText = availableSlots
    .slice(0, 8) // Mostrar máximo 8 opciones
    .map((s) => `⏰ ${s.time}`)
    .join("\n");

  return {
    handled: true,
    action: "provide_time",
    responseMessage: `Horarios disponibles para el ${formatDateForMessage(parsedDate)}:

${slotsText}

Por favor escribe la hora que prefieres (ejemplo: *14:30*)`,
  };
}

/**
 * Maneja respuesta con nueva hora para reagendar
 */
async function handleNewTimeResponse(
  shopId: string,
  phone: string,
  message: string,
  bookingId: string,
  stateData: { selectedDate: string }
): Promise<BookingResponseResult> {
  // Parsear hora del mensaje
  const timeMatch = message.match(/(\d{1,2}):?(\d{2})?/);

  if (!timeMatch) {
    return {
      handled: true,
      action: "provide_time",
      responseMessage: `No entendí la hora. Por favor escríbela así:

⏰ *14:30* o *2:30*

O escribe *CANCELAR* para dejar tu cita como está.`,
    };
  }

  const hours = parseInt(timeMatch[1]);
  const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
  const time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

  // Verificar disponibilidad
  const isAvailable = await isSlotAvailable(shopId, stateData.selectedDate, time);

  if (!isAvailable) {
    const availableSlots = await getAvailableSlots(shopId, stateData.selectedDate);
    const slotsText = availableSlots
      .slice(0, 5)
      .map((s) => `⏰ ${s.time}`)
      .join("\n");

    return {
      handled: true,
      action: "provide_time",
      responseMessage: `Ese horario no está disponible. Opciones:

${slotsText}

Por favor elige otro horario.`,
    };
  }

  // Realizar el reagendamiento
  const updatedBooking = await rescheduleBooking(shopId, bookingId, {
    newDate: stateData.selectedDate,
    newTime: time,
  });

  await clearConversation(shopId, phone);

  if (updatedBooking) {
    const dateObj = new Date(stateData.selectedDate + "T12:00:00");

    return {
      handled: true,
      action: "reschedule",
      responseMessage: `¡Listo! Tu cita ha sido reagendada:

📅 ${formatDateForMessage(dateObj)}
⏰ ${time}

Te esperamos! 😊`,
    };
  }

  return {
    handled: true,
    action: "unknown",
    responseMessage: "Hubo un error al reagendar. Por favor intenta de nuevo o contacta al negocio directamente.",
  };
}

// ==================== HELPERS ====================

/**
 * Parsea fecha en español (ej: "15 febrero", "20 de marzo")
 */
function parseSpanishDate(text: string): Date | null {
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
  };

  const normalized = text.toLowerCase().replace(/de /g, "");

  // Buscar patrón "día mes"
  const match = normalized.match(/(\d{1,2})\s*(\w+)/);

  if (!match) return null;

  const day = parseInt(match[1]);
  const monthName = match[2];

  let month = months[monthName];

  // Intentar match parcial
  if (month === undefined) {
    for (const [name, idx] of Object.entries(months)) {
      if (name.startsWith(monthName) || monthName.startsWith(name.substring(0, 3))) {
        month = idx;
        break;
      }
    }
  }

  if (month === undefined) return null;

  const year = new Date().getFullYear();
  const date = new Date(year, month, day);

  // Si la fecha ya pasó este año, asumir el próximo año
  if (date < new Date()) {
    date.setFullYear(year + 1);
  }

  return date;
}

/**
 * Formatea fecha para mensaje amigable
 */
function formatDateForMessage(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  return date.toLocaleDateString("es-MX", options);
}
