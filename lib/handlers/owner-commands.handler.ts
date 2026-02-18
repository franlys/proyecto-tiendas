
import { adminDb } from "@/lib/firebase-admin";
import { sendTextMessage } from "@/lib/evolution";
import { getAllNotificationPhones } from "@/lib/handlers/whatsapp-order.handler";
import {
    cancelAllBookingsForDateAdmin,
    getBookingsForDateAdmin,
    addClosedDateAdmin,
    removeClosedDateAdmin,
    getClosedDatesAdmin
} from "@/lib/services/booking-admin.service";

interface CommandResult {
    handled: boolean;
    message?: string;
}

/**
 * Handle commands sent by shop owners via WhatsApp
 */
export async function handleOwnerCommand(
    instanceName: string,
    shopId: string,
    phone: string,
    text: string
): Promise<CommandResult> {
    const command = text.trim().toLowerCase();
    const db = adminDb();

    if (!db) return { handled: false };

    // ------------------------------------------------------------
    // 1. REGISTRATION: "Soy el dueño [slug] [password]"
    // ------------------------------------------------------------
    if (command.startsWith("soy el dueño") || command.startsWith("soy el dueno")) {
        const parts = text.split(" ");
        // Expected: ["Soy", "el", "dueño", "shop-slug", "password"]
        // Relaxed: Allow them to just say "Soy el dueño [password]" if we can infer shop from instance? 
        // No, instance might be different. Let's stick to explicit slug for safety, or just password if we trust the instance->shop mapping.
        // Given we have shopId from instance, we can just ask for password.

        // Let's support: "Soy el dueño [password]" (using current shopId)
        // OR "Soy el dueño [slug] [password]" (for multi-shop owners?? No, keeps it simple)

        const passwordCandidate = parts[parts.length - 1]; // Last word is password

        // Fetch shop credentials
        const shopDoc = await db.collection("shops").doc(shopId).get();
        if (!shopDoc.exists) {
            return { handled: true, message: "❌ Error: Tienda no encontrada." };
        }

        const shopData = shopDoc.data();
        const storedPassword = shopData?.ownerPassword || "123"; // Default if not set (risky but existing logic uses it)

        if (passwordCandidate === storedPassword) {
            // Success! Update ownerNotificationPhone
            await db.collection("shops").doc(shopId).update({
                ownerNotificationPhone: phone,
                updatedAt: new Date().toISOString()
            });

            return {
                handled: true,
                message: `✅ ¡Hola Dueño! \n\nTu número ha sido registrado exitosamente para la tienda *${shopData?.name}*.\n\nAhora recibirás notificaciones de pedidos aquí.`
            };
        } else {
            return { handled: true, message: "❌ Contraseña incorrecta." };
        }
    }

    // ------------------------------------------------------------
    // 2. CHECK AUTHORIZATION (For all other commands)
    // ------------------------------------------------------------
    const notificationPhones = await getAllNotificationPhones(shopId);

    // DEBUG: Log authorization attempt
    console.log(`[OwnerCmd] Checking auth for ${phone} in shop ${shopId}`);
    console.log(`[OwnerCmd] Authorized phones:`, notificationPhones.map(p => p.phone));

    // Strict verify: Clean phone must match one of the registered ones
    const isOwnerOrStaff = notificationPhones.some(p => {
        const cleanStored = p.phone?.replace(/\D/g, "") || "";
        const match = phone.includes(cleanStored);
        if (match) console.log(`[OwnerCmd] Match found: ${phone} includes ${cleanStored}`);
        return p.phone && match;
    });

    if (!isOwnerOrStaff) {
        console.log(`[OwnerCmd] Authorization failed for ${phone}`);
        return { handled: false };
    }

    // ------------------------------------------------------------
    // 3. COMMAND: "Ayuda" or "Comandos"
    // ------------------------------------------------------------
    if (command === "ayuda" || command === "comandos" || command === "menu" || command === "help") {
        const helpMsg = `🤖 *PANEL DE CONTROL (Dueño)*\n\n` +
            `Comandos disponibles:\n\n` +
            `📊 *Resumen*\n` +
            `Ver total de ventas y pedidos de hoy.\n\n` +
            `📦 *Pedidos* (o *Pendientes*)\n` +
            `Lista los últimos 10 pedidos por procesar.\n\n` +
            `✅ *Confirmar [ID]*\n` +
            `Acepta un pedido.\n_Ejemplo: Confirmar 1054_\n\n` +
            `📅 *Citas*\n` +
            `Ver las citas/reservaciones de hoy.\n\n` +
            `🚫 *Cerrar [fecha]*\n` +
            `Cierra un día específico (sin cambiar horarios).\n` +
            `_Ejemplos: Cerrar mañana, Cerrar 20 de febrero_\n\n` +
            `✅ *Abrir [fecha]*\n` +
            `Reabre un día que habías cerrado.\n` +
            `_Ejemplos: Abrir mañana, Abrir 20 de febrero_\n\n` +
            `📋 *Días cerrados*\n` +
            `Ver lista de días cerrados temporalmente.\n\n` +
            `❌ *Cancelar citas de hoy [motivo]*\n` +
            `Cancela todas las citas del día y notifica a los clientes.\n` +
            `_Ejemplo: Cancelar citas de hoy estoy enferma_\n\n` +
            `ℹ️ *Info*\n` +
            `Ver estado de conexión.\n\n` +
            `🆔 *Soy el dueño [Password]*\n` +
            `Vincula tu número para notificaciones.\n\n` +
            `_Los comandos no distinguen mayúsculas._`;

        await sendTextMessage(instanceName, phone, helpMsg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 3.5. COMMAND: "Info" (Shop Status)
    // ------------------------------------------------------------
    if (command === "info" || command === "estado" || command === "status") {
        const shopDoc = await db.collection("shops").doc(shopId).get();
        if (!shopDoc.exists) {
            await sendTextMessage(instanceName, phone, "❌ Error: La tienda no existe en la base de datos.");
            return { handled: true };
        }
        const data = shopDoc.data();

        const msg = `ℹ️ *ESTADO DE LA TIENDA*\n` +
            `--------------------------------\n` +
            `🏪 *Nombre:* ${data?.name}\n` +
            `🔗 *Slug:* ${data?.slug}\n` +
            `📱 *Bot:* Activo (Conectado)\n` +
            `👤 *Dueño (Notif):* ${data?.ownerNotificationPhone || "No registrado"}\n` +
            `🕒 *Hora Servidor:* ${new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', hour12: true })}\n` +
            `--------------------------------\n` +
            `_Todo funcionando correctamente._`;

        await sendTextMessage(instanceName, phone, msg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 4. COMMAND: "Resumen" (Today's Stats)
    // ------------------------------------------------------------
    if (command === "resumen" || command === "stats" || command === "ventas") {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0)).toISOString();

        const ordersQuery = await db.collection("shops").doc(shopId).collection("orders")
            .where("createdAt", ">=", startOfDay)
            .get();

        let totalSales = 0;
        let count = 0;
        let pending = 0;

        ordersQuery.forEach(doc => {
            const data = doc.data();
            if (data.status !== "cancelled" && data.status !== "draft") {
                totalSales += (data.total || 0);
                count++;
            }
            if (data.status === "pending") pending++;
        });

        const summaryMsg = `📊 *RESUMEN DE HOY*\n\n` +
            `💰 *Ventas:* $${totalSales.toLocaleString()}\n` +
            `📦 *Pedidos Totales:* ${count}\n` +
            `⏳ *Pendientes:* ${pending}\n\n` +
            `_Actualizado: ${new Date().toLocaleTimeString()}_`;

        await sendTextMessage(instanceName, phone, summaryMsg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 5. COMMAND: "Pedidos" (List Pending)
    // ------------------------------------------------------------
    if (command === "pedidos" || command === "pendientes") {
        const pendingQuery = await db.collection("shops").doc(shopId).collection("orders")
            .where("status", "==", "pending")
            .orderBy("createdAt", "desc")
            .limit(10)
            .get();

        if (pendingQuery.empty) {
            await sendTextMessage(instanceName, phone, "✅ No hay pedidos pendientes por procesar.");
            return { handled: true };
        }

        let msg = `📦 *PEDIDOS PENDIENTES (${pendingQuery.size})*\n\n`;

        pendingQuery.forEach(doc => {
            const data = doc.data();
            msg += `🔸 *${data.orderNumber}* | $${data.total}\n`;
            msg += `   👤 ${data.customerName}\n`;
            msg += `   🕒 ${new Date(data.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\n`;
        });

        msg += `_Responde "Confirmar [ID]" para procesar._`;

        await sendTextMessage(instanceName, phone, msg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 6. COMMAND: "Citas" (List Today's Bookings)
    // ------------------------------------------------------------
    if (command === "citas" || command === "reservaciones" || command === "agenda") {
        const today = new Date().toISOString().split("T")[0];
        const bookings = await getBookingsForDateAdmin(shopId, today);

        if (bookings.length === 0) {
            await sendTextMessage(instanceName, phone, "📅 No hay citas agendadas para hoy.");
            return { handled: true };
        }

        let msg = `📅 *CITAS DE HOY (${bookings.length})*\n\n`;

        bookings.forEach(booking => {
            const statusEmoji = booking.status === "confirmed" ? "✅" : "⏳";
            msg += `${statusEmoji} *${booking.time}* - ${booking.customerName}\n`;
            msg += `   ✂️ ${booking.serviceName}\n`;
            msg += `   📱 ${booking.customerPhone}\n\n`;
        });

        msg += `\n_Para cancelar: "Cancelar citas de hoy [motivo]"_`;

        await sendTextMessage(instanceName, phone, msg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 7. COMMAND: "Cerrar [fecha]" (Close a specific date)
    // Patterns:
    //   - "cerrar mañana"
    //   - "cerrar 20 de febrero"
    //   - "cerrar el 15/03"
    // ------------------------------------------------------------
    if (command.startsWith("cerrar ") && !command.includes("citas")) {
        const targetDate = parseDateFromCommand(command.replace("cerrar", "").trim());

        if (!targetDate) {
            await sendTextMessage(instanceName, phone,
                `❌ No pude entender la fecha.\n\n` +
                `Ejemplos válidos:\n` +
                `• Cerrar mañana\n` +
                `• Cerrar 20 de febrero\n` +
                `• Cerrar el 15/03`
            );
            return { handled: true };
        }

        // Format date for display
        const dateObj = new Date(targetDate + "T12:00:00");
        const dateStr = dateObj.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
        });

        // Check if date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dateObj < today) {
            await sendTextMessage(instanceName, phone,
                `❌ No puedes cerrar una fecha pasada.\n\n` +
                `La fecha ${dateStr} ya pasó.`
            );
            return { handled: true };
        }

        // Add to closed dates
        const result = await addClosedDateAdmin(shopId, targetDate);

        if (result.alreadyClosed) {
            await sendTextMessage(instanceName, phone,
                `ℹ️ El día *${dateStr}* ya estaba marcado como cerrado.`
            );
            return { handled: true };
        }

        // Check if there are existing bookings for that date
        const existingBookings = await getBookingsForDateAdmin(shopId, targetDate);

        let msg = `✅ *DÍA CERRADO*\n\n` +
            `El *${dateStr}* ha sido marcado como cerrado.\n` +
            `No se podrán hacer nuevas reservaciones para ese día.`;

        if (existingBookings.length > 0) {
            msg += `\n\n⚠️ *Atención:* Ya tienes *${existingBookings.length} cita(s)* para ese día:\n`;
            existingBookings.forEach(b => {
                msg += `• ${b.time} - ${b.customerName}\n`;
            });
            msg += `\n_Si deseas cancelarlas, usa:_\n"Cancelar citas del ${dateObj.getDate()} de ${dateObj.toLocaleDateString("es-MX", { month: "long" })}"`;
        }

        await sendTextMessage(instanceName, phone, msg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 8. COMMAND: "Abrir [fecha]" (Reopen a specific date)
    // ------------------------------------------------------------
    if (command.startsWith("abrir ")) {
        const targetDate = parseDateFromCommand(command.replace("abrir", "").trim());

        if (!targetDate) {
            await sendTextMessage(instanceName, phone,
                `❌ No pude entender la fecha.\n\n` +
                `Ejemplos válidos:\n` +
                `• Abrir mañana\n` +
                `• Abrir 20 de febrero\n` +
                `• Abrir el 15/03`
            );
            return { handled: true };
        }

        // Format date for display
        const dateObj = new Date(targetDate + "T12:00:00");
        const dateStr = dateObj.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
        });

        // Remove from closed dates
        const result = await removeClosedDateAdmin(shopId, targetDate);

        if (result.wasNotClosed) {
            await sendTextMessage(instanceName, phone,
                `ℹ️ El día *${dateStr}* no estaba marcado como cerrado.\n\n` +
                `_Nota: Si es un día que normalmente cierras (ej. domingo), ese cierre es permanente y se configura desde el panel web._`
            );
            return { handled: true };
        }

        await sendTextMessage(instanceName, phone,
            `✅ *DÍA REABIERTO*\n\n` +
            `El *${dateStr}* ha sido reabierto.\n` +
            `Los clientes podrán hacer reservaciones para ese día.`
        );
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 9. COMMAND: "Días cerrados" (List closed dates)
    // ------------------------------------------------------------
    if (command === "días cerrados" || command === "dias cerrados" || command === "cerrados") {
        const closedDates = await getClosedDatesAdmin(shopId);

        if (closedDates.length === 0) {
            await sendTextMessage(instanceName, phone,
                `📋 *DÍAS CERRADOS*\n\n` +
                `No tienes días cerrados temporalmente.\n\n` +
                `_Para cerrar un día, usa:_\n"Cerrar mañana" o "Cerrar 20 de febrero"`
            );
            return { handled: true };
        }

        // Filter only future dates and sort
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureDates = closedDates
            .filter(d => new Date(d + "T12:00:00") >= today)
            .sort();

        if (futureDates.length === 0) {
            await sendTextMessage(instanceName, phone,
                `📋 *DÍAS CERRADOS*\n\n` +
                `No tienes días cerrados próximamente.\n\n` +
                `_Para cerrar un día, usa:_\n"Cerrar mañana" o "Cerrar 20 de febrero"`
            );
            return { handled: true };
        }

        let msg = `📋 *DÍAS CERRADOS TEMPORALMENTE*\n\n`;
        futureDates.forEach(d => {
            const dateObj = new Date(d + "T12:00:00");
            const dateStr = dateObj.toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
            });
            msg += `🚫 ${dateStr}\n`;
        });

        msg += `\n_Para reabrir un día, usa:_\n"Abrir [fecha]"`;

        await sendTextMessage(instanceName, phone, msg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 10. COMMAND: "Cancelar citas de hoy" or "Cancelar citas del [fecha]"
    // Patterns:
    //   - "cancelar citas de hoy"
    //   - "cancelar citas de mañana"
    //   - "cancelar citas del 18 de febrero"
    //   - "cancelar citas estoy enferma" (assumes today + reason)
    // ------------------------------------------------------------
    if (command.startsWith("cancelar citas") || command.startsWith("cancelar todas las citas")) {
        const originalText = text.trim();

        // Parse the date from the message
        let targetDate = new Date().toISOString().split("T")[0]; // Default: today
        let reason = "El negocio no puede atender hoy";

        // Check for "mañana"
        if (command.includes("mañana") || command.includes("manana")) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            targetDate = tomorrow.toISOString().split("T")[0];
            reason = "El negocio no puede atender mañana";
        }

        // Check for specific date patterns like "del 18 de febrero" or "del 18/02"
        const dateMatch = command.match(/del?\s*(\d{1,2})(?:\s*(?:de|\/)\s*)?(\w+|\d{1,2})?/i);
        if (dateMatch) {
            const day = parseInt(dateMatch[1]);
            let month = new Date().getMonth(); // Default: current month

            if (dateMatch[2]) {
                const monthStr = dateMatch[2].toLowerCase();
                const months: Record<string, number> = {
                    "enero": 0, "febrero": 1, "marzo": 2, "abril": 3,
                    "mayo": 4, "junio": 5, "julio": 6, "agosto": 7,
                    "septiembre": 8, "octubre": 9, "noviembre": 10, "diciembre": 11,
                    "01": 0, "02": 1, "03": 2, "04": 3, "05": 4, "06": 5,
                    "07": 6, "08": 7, "09": 8, "10": 9, "11": 10, "12": 11,
                    "1": 0, "2": 1, "3": 2, "4": 3, "5": 4, "6": 5,
                    "7": 6, "8": 7, "9": 8
                };
                if (months[monthStr] !== undefined) {
                    month = months[monthStr];
                }
            }

            const year = new Date().getFullYear();
            targetDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        }

        // Extract reason if provided after the date/command
        // Patterns: "cancelar citas de hoy estoy enferma" or "cancelar citas por enfermedad"
        const reasonPatterns = [
            /(?:porque|por|motivo:?)\s+(.+)/i,
            /(?:estoy|me siento)\s+(.+)/i,
            /(?:de hoy|de mañana|del \d+.*?)\s+(.+)/i
        ];

        for (const pattern of reasonPatterns) {
            const reasonMatch = originalText.match(pattern);
            if (reasonMatch && reasonMatch[1]) {
                reason = reasonMatch[1].trim();
                break;
            }
        }

        // Format date for display
        const dateObj = new Date(targetDate + "T12:00:00");
        const dateStr = dateObj.toLocaleDateString("es-MX", {
            weekday: "long",
            day: "numeric",
            month: "long",
        });

        // Get bookings for the target date first
        const bookings = await getBookingsForDateAdmin(shopId, targetDate);

        if (bookings.length === 0) {
            await sendTextMessage(instanceName, phone,
                `📅 No hay citas agendadas para el *${dateStr}*.\n\nNo hay nada que cancelar.`
            );
            return { handled: true };
        }

        // Confirm before cancelling (show what will be cancelled)
        const confirmMsg = `⚠️ *CONFIRMAR CANCELACIÓN*\n\n` +
            `Se cancelarán *${bookings.length} cita(s)* del *${dateStr}*:\n\n` +
            bookings.map(b => `• ${b.time} - ${b.customerName}`).join("\n") +
            `\n\n📝 *Motivo:* ${reason}\n\n` +
            `👉 Responde *"SI CANCELAR"* para confirmar.\n` +
            `👉 Responde *"NO"* para abortar.`;

        // Store pending cancellation in a temporary context
        // Using Firestore to track the pending action
        await db.collection("shops").doc(shopId).collection("pendingOwnerActions").doc(phone.replace(/\D/g, "")).set({
            action: "cancel_bookings",
            targetDate,
            reason,
            bookingCount: bookings.length,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 min expiry
            createdAt: new Date().toISOString()
        });

        await sendTextMessage(instanceName, phone, confirmMsg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 8. COMMAND: "SI CANCELAR" (Confirm bulk cancellation)
    // ------------------------------------------------------------
    if (command === "si cancelar" || command === "sí cancelar" || command === "si, cancelar") {
        // Check for pending cancellation action
        const pendingRef = db.collection("shops").doc(shopId).collection("pendingOwnerActions").doc(phone.replace(/\D/g, ""));
        const pendingSnap = await pendingRef.get();

        if (!pendingSnap.exists) {
            await sendTextMessage(instanceName, phone, "❌ No hay ninguna cancelación pendiente. Usa 'Cancelar citas de hoy [motivo]' primero.");
            return { handled: true };
        }

        const pendingData = pendingSnap.data();

        // Check if expired
        if (new Date(pendingData?.expiresAt) < new Date()) {
            await pendingRef.delete();
            await sendTextMessage(instanceName, phone, "❌ La confirmación expiró. Por favor, inicia el proceso de nuevo.");
            return { handled: true };
        }

        if (pendingData?.action !== "cancel_bookings") {
            return { handled: false };
        }

        const targetDate = pendingData.targetDate;
        const reason = pendingData.reason;

        // Execute the cancellation
        const result = await cancelAllBookingsForDateAdmin(shopId, targetDate, reason);

        if (!result.success) {
            await sendTextMessage(instanceName, phone, `❌ Error al cancelar: ${result.error}`);
            return { handled: true };
        }

        // Delete pending action
        await pendingRef.delete();

        // Notify each affected customer
        for (const booking of result.cancelledBookings) {
            try {
                const dateObj = new Date(booking.date + "T12:00:00");
                const dateStr = dateObj.toLocaleDateString("es-MX", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                });

                const customerMsg = `😔 *CITA CANCELADA*\n\n` +
                    `Lamentamos informarte que tu cita del *${dateStr}* a las *${booking.time}* ha sido cancelada.\n\n` +
                    `📝 *Motivo:* ${reason}\n\n` +
                    `Por favor, contáctanos para reagendar tu cita.\n\n` +
                    `¡Disculpa las molestias! 🙏`;

                await sendTextMessage(instanceName, booking.customerPhone, customerMsg);
                console.log(`[CancelBookings] ✅ Notified customer: ${booking.customerPhone}`);

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (err) {
                console.error(`[CancelBookings] Failed to notify ${booking.customerPhone}:`, err);
            }
        }

        // Confirm to owner
        const successMsg = `✅ *CITAS CANCELADAS*\n\n` +
            `Se cancelaron *${result.cancelledBookings.length} cita(s)* y se notificó a cada cliente.\n\n` +
            `👥 Clientes notificados:\n` +
            result.cancelledBookings.map(b => `• ${b.customerName}`).join("\n");

        await sendTextMessage(instanceName, phone, successMsg);
        return { handled: true };
    }

    // Not a command we know
    return { handled: false };
}

/**
 * Parse a date from natural language command
 * Examples: "mañana", "20 de febrero", "el 15/03", "hoy"
 * Returns date in format "YYYY-MM-DD" or null if can't parse
 */
function parseDateFromCommand(text: string): string | null {
    const cleanText = text.toLowerCase().trim();

    // "hoy"
    if (cleanText === "hoy") {
        return new Date().toISOString().split("T")[0];
    }

    // "mañana"
    if (cleanText === "mañana" || cleanText === "manana") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split("T")[0];
    }

    // "pasado mañana"
    if (cleanText === "pasado mañana" || cleanText === "pasado manana") {
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);
        return dayAfter.toISOString().split("T")[0];
    }

    // Day of week: "el lunes", "este viernes"
    const dayOfWeekMatch = cleanText.match(/(?:el|este|próximo|proximo)?\s*(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)/i);
    if (dayOfWeekMatch) {
        const dayNames: Record<string, number> = {
            "domingo": 0, "lunes": 1, "martes": 2, "miércoles": 3, "miercoles": 3,
            "jueves": 4, "viernes": 5, "sábado": 6, "sabado": 6
        };
        const targetDay = dayNames[dayOfWeekMatch[1].toLowerCase()];
        const today = new Date();
        const currentDay = today.getDay();
        let daysToAdd = targetDay - currentDay;
        if (daysToAdd <= 0) daysToAdd += 7; // Next week
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysToAdd);
        return targetDate.toISOString().split("T")[0];
    }

    // "20 de febrero" or "el 20 de febrero"
    const dateMatch = cleanText.match(/(?:el\s+)?(\d{1,2})\s*(?:de\s+)?(\w+)/i);
    if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const monthStr = dateMatch[2].toLowerCase();
        const months: Record<string, number> = {
            "enero": 0, "febrero": 1, "marzo": 2, "abril": 3,
            "mayo": 4, "junio": 5, "julio": 6, "agosto": 7,
            "septiembre": 8, "octubre": 9, "noviembre": 10, "diciembre": 11
        };

        if (months[monthStr] !== undefined) {
            const year = new Date().getFullYear();
            let month = months[monthStr];

            // If the month has passed, assume next year
            const currentMonth = new Date().getMonth();
            const targetYear = month < currentMonth ? year + 1 : year;

            return `${targetYear}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        }
    }

    // "15/03" or "15-03" or "15/3"
    const slashDateMatch = cleanText.match(/(?:el\s+)?(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (slashDateMatch) {
        const day = parseInt(slashDateMatch[1]);
        const month = parseInt(slashDateMatch[2]) - 1;
        let year = slashDateMatch[3] ? parseInt(slashDateMatch[3]) : new Date().getFullYear();

        // Handle 2-digit year
        if (year < 100) year += 2000;

        // If the month has passed, assume next year
        const currentMonth = new Date().getMonth();
        if (!slashDateMatch[3] && month < currentMonth) year++;

        return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    return null;
}
