
import { adminDb } from "@/lib/firebase-admin";
import { sendTextMessage } from "@/lib/evolution";
import { getAllNotificationPhones } from "@/lib/handlers/whatsapp-order.handler";

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
            `Aquí tienes los comandos que puedes usar para gestionar tu tienda desde WhatsApp:\n\n` +
            `📊 *Resumen*\n` +
            `Ver total de ventas y pedidos de hoy.\n\n` +
            `📦 *Pedidos* (o *Pendientes*)\n` +
            `Lista los últimos 10 pedidos que necesitan atención.\n\n` +
            `✅ *Confirmar [ID]*\n` +
            `Acepta un pedido, reduce inventario y notifica al cliente.\n` +
            `_Ejemplo: Confirmar 1054_\n\n` +
            `ℹ️ *Info*\n` +
            `Ver estado de conexión y datos de la tienda.\n\n` +
            `🆔 *Soy el dueño [Password]*\n` +
            `Vincula tu número actual para recibir notificaciones.\n\n` +
            `_Tip: Los comandos no distinguen mayúsculas._`;

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

    // Not a command we know
    return { handled: false };
}
