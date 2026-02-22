
import { adminDb } from "@/lib/firebase-admin";
import { sendTextMessage } from "@/lib/evolution";
import { getAllNotificationPhones } from "@/lib/handlers/whatsapp-order.handler";
import {
    cancelAllBookingsForDateAdmin,
    getBookingsForDateAdmin,
    addClosedDateAdmin,
    removeClosedDateAdmin,
    getClosedDatesAdmin,
    getBookingConfigAdmin,
    updateBookingConfigAdmin
} from "@/lib/services/booking-admin.service";
import {
    handleProductCreation,
    getProductCreationSession
} from "@/lib/handlers/product-creation.handler";

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
            // Normalize phone for storage (remove @s.whatsapp.net and non-digits)
            const normalizedPhone = phone.replace(/@.*$/, "").replace(/\D/g, "");

            // Success! Update ownerNotificationPhone in both locations
            const updateData = {
                ownerNotificationPhone: normalizedPhone,
                updatedAt: new Date().toISOString()
            };

            // Update shop document
            await db.collection("shops").doc(shopId).update(updateData);

            // Also update whatsapp_bot config if it exists
            const configRef = db.collection("shops").doc(shopId).collection("whatsapp_bot").doc("config");
            const configDoc = await configRef.get();
            if (configDoc.exists) {
                await configRef.update({ ownerNotificationPhone: normalizedPhone });
            }

            console.log(`[OwnerCmd] ✅ Owner registered: ${normalizedPhone} for shop ${shopId}`);

            return {
                handled: true,
                message: `✅ *¡Bienvenido, Dueño!*\n\n` +
                    `Tu número ha sido registrado exitosamente para *${shopData?.name}*.\n\n` +
                    `📱 *Número registrado:* ${normalizedPhone}\n\n` +
                    `Ahora recibirás notificaciones de pedidos aquí.\n\n` +
                    `📱 *Escribe "Ayuda"* para ver todos los comandos disponibles:\n` +
                    `• Reportes de ventas\n` +
                    `• Gestión de citas\n` +
                    `• Inventario\n` +
                    `• Y mucho más...`
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
    // Clean the incoming phone (remove all non-digits)
    const cleanIncoming = phone.replace(/\D/g, "");
    // Remove common prefixes for comparison (country codes can vary)
    const lastDigitsIncoming = cleanIncoming.slice(-10); // Last 10 digits

    const isOwnerOrStaff = notificationPhones.some(p => {
        const cleanStored = p.phone?.replace(/\D/g, "") || "";
        const lastDigitsStored = cleanStored.slice(-10); // Last 10 digits

        // Match if either contains the other OR last 10 digits match
        const match = phone.includes(cleanStored) ||
            cleanStored.includes(cleanIncoming) ||
            lastDigitsIncoming === lastDigitsStored;

        if (match) console.log(`[OwnerCmd] Match found: incoming=${cleanIncoming} stored=${cleanStored}`);
        return p.phone && match;
    });

    if (!isOwnerOrStaff) {
        console.log(`[OwnerCmd] Authorization failed for ${phone} (clean: ${cleanIncoming})`);
        console.log(`[OwnerCmd] Registered phones: ${notificationPhones.map(p => p.phone?.replace(/\D/g, "")).join(", ")}`);
        return { handled: false };
    }

    // ------------------------------------------------------------
    // 2.5. CHECK PRODUCT CREATION SESSION
    // ------------------------------------------------------------
    // Check if there's an active product creation session
    const productSession = await getProductCreationSession(shopId, phone);
    if (productSession || command.includes("agregar producto") || command.includes("nuevo producto") || command.includes("crear producto")) {
        const productResult = await handleProductCreation(instanceName, shopId, phone, text);
        if (productResult.handled) {
            if (productResult.message) {
                await sendTextMessage(instanceName, phone, productResult.message);
            }
            return { handled: true };
        }
    }

    // ------------------------------------------------------------
    // 3. COMMAND: "Ayuda" or "Comandos"
    // ------------------------------------------------------------
    if (command === "ayuda" || command === "comandos" || command === "menu" || command === "help") {
        const helpMsg = `🤖 *PANEL DE CONTROL (Dueño)*\n\n` +
            `*📊 VENTAS Y PEDIDOS*\n` +
            `• *Resumen* - Ventas de hoy\n` +
            `• *Semana* - Reporte semanal\n` +
            `• *Mes* - Reporte mensual\n` +
            `• *Pedidos* - Pendientes por procesar\n` +
            `• *Confirmar [ID]* - Aceptar pedido\n\n` +
            `*📅 CITAS Y AGENDA*\n` +
            `• *Citas* - Citas de hoy\n` +
            `• *Próximas* - Citas de la semana\n` +
            `• *Buscar cita [nombre/tel]* - Encontrar cita\n` +
            `• *Cerrar [fecha]* - Cerrar un día\n` +
            `• *Abrir [fecha]* - Reabrir día\n` +
            `• *Días cerrados* - Ver cierres\n` +
            `• *Cancelar citas de hoy [motivo]*\n\n` +
            `*📦 INVENTARIO*\n` +
            `• *Inventario* - Productos bajo stock\n` +
            `• *Producto [nombre]* - Buscar producto\n` +
            `• *Agregar producto* - Crear nuevo producto\n` +
            `• *Agregar producto [nombre] [precio] [stock]*\n\n` +
            `*👥 CLIENTES*\n` +
            `• *Clientes* - Top clientes del mes\n` +
            `• *Cliente [nombre/tel]* - Buscar cliente\n\n` +
            `*⚙️ CONFIGURACIÓN*\n` +
            `• *Horario* - Ver horario actual\n` +
            `• *Horario 9:00 a 18:00* - Cambiar horario\n` +
            `• *Cerrar los domingos* - Cerrar un día fijo\n` +
            `• *Abrir los domingos* - Reabrir día fijo\n` +
            `• *Descanso 13:00 a 14:00* - Hora de comida\n` +
            `• *Sin descanso* - Quitar descanso\n` +
            `• *Info* - Estado del bot\n` +
            `• *Soy el dueño [pass]* - Vincular número\n\n` +
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
    // 4.5. COMMAND: "Semana" (Weekly Report)
    // ------------------------------------------------------------
    if (command === "semana" || command === "semanal" || command === "esta semana") {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Domingo
        startOfWeek.setHours(0, 0, 0, 0);

        const ordersQuery = await db.collection("shops").doc(shopId).collection("orders")
            .where("createdAt", ">=", startOfWeek.toISOString())
            .get();

        let totalSales = 0;
        let count = 0;
        let pending = 0;
        let confirmed = 0;
        let delivered = 0;

        ordersQuery.forEach(doc => {
            const data = doc.data();
            if (data.status !== "cancelled" && data.status !== "draft") {
                totalSales += (data.total || 0);
                count++;
            }
            if (data.status === "pending") pending++;
            if (data.status === "confirmed") confirmed++;
            if (data.status === "delivered") delivered++;
        });

        const avgTicket = count > 0 ? Math.round(totalSales / count) : 0;

        const weekMsg = `📊 *REPORTE SEMANAL*\n` +
            `(${startOfWeek.toLocaleDateString("es-MX", { day: "numeric", month: "short" })} - Hoy)\n\n` +
            `💰 *Total Ventas:* $${totalSales.toLocaleString()}\n` +
            `📦 *Pedidos:* ${count}\n` +
            `🎫 *Ticket Promedio:* $${avgTicket.toLocaleString()}\n\n` +
            `📈 *Por Estado:*\n` +
            `⏳ Pendientes: ${pending}\n` +
            `✅ Confirmados: ${confirmed}\n` +
            `📬 Entregados: ${delivered}\n\n` +
            `_Actualizado: ${new Date().toLocaleTimeString()}_`;

        await sendTextMessage(instanceName, phone, weekMsg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 4.6. COMMAND: "Mes" (Monthly Report)
    // ------------------------------------------------------------
    if (command === "mes" || command === "mensual" || command === "este mes") {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const ordersQuery = await db.collection("shops").doc(shopId).collection("orders")
            .where("createdAt", ">=", startOfMonth.toISOString())
            .get();

        let totalSales = 0;
        let count = 0;
        const dailySales: Record<string, number> = {};

        ordersQuery.forEach(doc => {
            const data = doc.data();
            if (data.status !== "cancelled" && data.status !== "draft") {
                totalSales += (data.total || 0);
                count++;

                // Track daily for best day
                const dayKey = data.createdAt.split("T")[0];
                dailySales[dayKey] = (dailySales[dayKey] || 0) + (data.total || 0);
            }
        });

        // Find best day
        let bestDay = "";
        let bestDaySales = 0;
        for (const [day, sales] of Object.entries(dailySales)) {
            if (sales > bestDaySales) {
                bestDaySales = sales;
                bestDay = day;
            }
        }

        const avgTicket = count > 0 ? Math.round(totalSales / count) : 0;
        const avgDaily = Object.keys(dailySales).length > 0
            ? Math.round(totalSales / Object.keys(dailySales).length)
            : 0;

        const monthName = now.toLocaleDateString("es-MX", { month: "long" });
        const bestDayFormatted = bestDay
            ? new Date(bestDay + "T12:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "numeric" })
            : "N/A";

        const monthMsg = `📊 *REPORTE DE ${monthName.toUpperCase()}*\n\n` +
            `💰 *Total Ventas:* $${totalSales.toLocaleString()}\n` +
            `📦 *Pedidos:* ${count}\n` +
            `🎫 *Ticket Promedio:* $${avgTicket.toLocaleString()}\n` +
            `📅 *Promedio Diario:* $${avgDaily.toLocaleString()}\n\n` +
            `🏆 *Mejor Día:* ${bestDayFormatted}\n` +
            `   $${bestDaySales.toLocaleString()}\n\n` +
            `_Actualizado: ${new Date().toLocaleTimeString()}_`;

        await sendTextMessage(instanceName, phone, monthMsg);
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
    // 5.3. COMMAND: "Confirmar [ID]" (Confirm an Order)
    // ------------------------------------------------------------
    if (command.startsWith("confirmar ") || command.startsWith("aceptar ")) {
        const orderIdOrNumber = command.replace("confirmar ", "").replace("aceptar ", "").trim();

        if (!orderIdOrNumber) {
            await sendTextMessage(instanceName, phone, "❌ Especifica el número de pedido.\n_Ejemplo: Confirmar 1054_");
            return { handled: true };
        }

        // Search by orderNumber or ID
        let orderDoc = null;
        let orderId = "";

        // First try by orderNumber
        const byNumberQuery = await db.collection("shops").doc(shopId).collection("orders")
            .where("orderNumber", "==", orderIdOrNumber)
            .limit(1)
            .get();

        if (!byNumberQuery.empty) {
            orderDoc = byNumberQuery.docs[0];
            orderId = orderDoc.id;
        } else {
            // Try by document ID
            const byIdRef = db.collection("shops").doc(shopId).collection("orders").doc(orderIdOrNumber);
            const byIdDoc = await byIdRef.get();
            if (byIdDoc.exists) {
                orderDoc = byIdDoc;
                orderId = orderIdOrNumber;
            }
        }

        if (!orderDoc || !orderDoc.exists) {
            await sendTextMessage(instanceName, phone, `❌ No encontré el pedido "${orderIdOrNumber}".`);
            return { handled: true };
        }

        const orderData = orderDoc.data();

        if (orderData?.status === "confirmed") {
            await sendTextMessage(instanceName, phone, `ℹ️ El pedido *#${orderData.orderNumber}* ya estaba confirmado.`);
            return { handled: true };
        }

        if (orderData?.status === "cancelled") {
            await sendTextMessage(instanceName, phone, `❌ El pedido *#${orderData.orderNumber}* está cancelado.`);
            return { handled: true };
        }

        // Update status to confirmed
        await db.collection("shops").doc(shopId).collection("orders").doc(orderId).update({
            status: "confirmed",
            confirmedAt: new Date().toISOString(),
            confirmedBy: phone,
            updatedAt: new Date().toISOString()
        });

        // Notify customer if we have their phone
        if (orderData?.customerPhone) {
            const customerMsg = `✅ *¡Pedido Confirmado!*\n\n` +
                `Tu pedido *#${orderData.orderNumber}* ha sido confirmado.\n` +
                `Total: $${orderData.total?.toLocaleString() || 0}\n\n` +
                `Te notificaremos cuando esté listo. ¡Gracias! 🙏`;

            try {
                await sendTextMessage(instanceName, orderData.customerPhone, customerMsg);
            } catch (e) {
                console.error("Failed to notify customer:", e);
            }
        }

        const successMsg = `✅ *PEDIDO CONFIRMADO*\n\n` +
            `📦 *#${orderData?.orderNumber}*\n` +
            `👤 ${orderData?.customerName}\n` +
            `💰 $${orderData?.total?.toLocaleString() || 0}\n\n` +
            `_El cliente ha sido notificado._`;

        await sendTextMessage(instanceName, phone, successMsg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 5.5. COMMAND: "Inventario" (Low Stock Products)
    // ------------------------------------------------------------
    if (command === "inventario" || command === "stock" || command === "bajo stock") {
        const productsQuery = await db.collection("shops").doc(shopId).collection("products")
            .get();

        const lowStockProducts: { name: string; stock: number; threshold: number }[] = [];

        productsQuery.forEach(doc => {
            const data = doc.data();
            const stock = data.stock ?? 0;
            const threshold = data.lowStockThreshold ?? 5;

            if (stock <= threshold && data.isActive !== false) {
                lowStockProducts.push({
                    name: data.name,
                    stock,
                    threshold
                });
            }
        });

        if (lowStockProducts.length === 0) {
            await sendTextMessage(instanceName, phone, "✅ *INVENTARIO OK*\n\nNo hay productos con bajo stock. ¡Todo bien!");
            return { handled: true };
        }

        // Sort by stock (lowest first)
        lowStockProducts.sort((a, b) => a.stock - b.stock);

        let msg = `⚠️ *PRODUCTOS CON BAJO STOCK*\n\n`;
        lowStockProducts.slice(0, 10).forEach(p => {
            const emoji = p.stock === 0 ? "🔴" : "🟡";
            msg += `${emoji} *${p.name}*\n   Stock: ${p.stock} (mín: ${p.threshold})\n\n`;
        });

        if (lowStockProducts.length > 10) {
            msg += `_...y ${lowStockProducts.length - 10} más_\n`;
        }

        msg += `\n📦 Total: ${lowStockProducts.length} productos necesitan restock.`;

        await sendTextMessage(instanceName, phone, msg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 5.6. COMMAND: "Producto [nombre]" (Search Product)
    // ------------------------------------------------------------
    if (command.startsWith("producto ") || command.startsWith("buscar producto ")) {
        const searchTerm = command.replace("buscar producto ", "").replace("producto ", "").trim().toLowerCase();

        if (searchTerm.length < 2) {
            await sendTextMessage(instanceName, phone, "❌ Escribe al menos 2 letras para buscar.\n_Ejemplo: Producto shampoo_");
            return { handled: true };
        }

        const productsQuery = await db.collection("shops").doc(shopId).collection("products")
            .limit(100)
            .get();

        const matches: { name: string; price: number; stock: number; id: string }[] = [];

        productsQuery.forEach(doc => {
            const data = doc.data();
            if (data.name?.toLowerCase().includes(searchTerm)) {
                matches.push({
                    id: doc.id,
                    name: data.name,
                    price: data.price || 0,
                    stock: data.stock ?? 0
                });
            }
        });

        if (matches.length === 0) {
            await sendTextMessage(instanceName, phone, `🔍 No encontré productos con "${searchTerm}".`);
            return { handled: true };
        }

        let msg = `🔍 *RESULTADOS: "${searchTerm}"*\n\n`;
        matches.slice(0, 8).forEach(p => {
            const stockEmoji = p.stock === 0 ? "🔴" : p.stock < 5 ? "🟡" : "🟢";
            msg += `📦 *${p.name}*\n`;
            msg += `   💰 $${p.price.toLocaleString()} | ${stockEmoji} Stock: ${p.stock}\n\n`;
        });

        if (matches.length > 8) {
            msg += `_...y ${matches.length - 8} más_`;
        }

        await sendTextMessage(instanceName, phone, msg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 5.7. COMMAND: "Clientes" (Top Customers This Month)
    // ------------------------------------------------------------
    if (command === "clientes" || command === "top clientes") {
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const ordersQuery = await db.collection("shops").doc(shopId).collection("orders")
            .where("createdAt", ">=", startOfMonth.toISOString())
            .get();

        const customerStats: Record<string, { name: string; phone: string; total: number; orders: number }> = {};

        ordersQuery.forEach(doc => {
            const data = doc.data();
            if (data.status !== "cancelled" && data.status !== "draft" && data.customerPhone) {
                const key = data.customerPhone;
                if (!customerStats[key]) {
                    customerStats[key] = {
                        name: data.customerName || "Sin nombre",
                        phone: data.customerPhone,
                        total: 0,
                        orders: 0
                    };
                }
                customerStats[key].total += (data.total || 0);
                customerStats[key].orders++;
            }
        });

        const topCustomers = Object.values(customerStats)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);

        if (topCustomers.length === 0) {
            await sendTextMessage(instanceName, phone, "📊 No hay clientes registrados este mes aún.");
            return { handled: true };
        }

        let msg = `👥 *TOP CLIENTES DEL MES*\n\n`;
        topCustomers.forEach((c, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
            msg += `${medal} *${c.name}*\n`;
            msg += `   💰 $${c.total.toLocaleString()} (${c.orders} pedidos)\n\n`;
        });

        msg += `_Total: ${Object.keys(customerStats).length} clientes activos_`;

        await sendTextMessage(instanceName, phone, msg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 5.8. COMMAND: "Cliente [nombre/tel]" (Search Customer)
    // ------------------------------------------------------------
    if (command.startsWith("cliente ") || command.startsWith("buscar cliente ")) {
        const searchTerm = command.replace("buscar cliente ", "").replace("cliente ", "").trim().toLowerCase();

        if (searchTerm.length < 3) {
            await sendTextMessage(instanceName, phone, "❌ Escribe al menos 3 caracteres para buscar.\n_Ejemplo: Cliente María_");
            return { handled: true };
        }

        // Search in customers collection
        const customersQuery = await db.collection("shops").doc(shopId).collection("customers")
            .limit(50)
            .get();

        const matches: { name: string; phone: string; totalSpent: number; orderCount: number }[] = [];

        customersQuery.forEach(doc => {
            const data = doc.data();
            const nameMatch = data.name?.toLowerCase().includes(searchTerm);
            const phoneMatch = data.phone?.includes(searchTerm);

            if (nameMatch || phoneMatch) {
                matches.push({
                    name: data.name || "Sin nombre",
                    phone: data.phone || "Sin teléfono",
                    totalSpent: data.totalSpent || 0,
                    orderCount: data.orderCount || 0
                });
            }
        });

        if (matches.length === 0) {
            await sendTextMessage(instanceName, phone, `🔍 No encontré clientes con "${searchTerm}".`);
            return { handled: true };
        }

        let msg = `👤 *CLIENTES ENCONTRADOS*\n\n`;
        matches.slice(0, 5).forEach(c => {
            msg += `👤 *${c.name}*\n`;
            msg += `   📱 ${c.phone}\n`;
            msg += `   💰 Total: $${c.totalSpent.toLocaleString()} (${c.orderCount} pedidos)\n\n`;
        });

        if (matches.length > 5) {
            msg += `_...y ${matches.length - 5} más_`;
        }

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
    // 6.5. COMMAND: "Próximas" (Upcoming Bookings)
    // ------------------------------------------------------------
    if (command === "próximas" || command === "proximas" || command === "próximas citas" || command === "semana citas") {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const todayStr = today.toISOString().split("T")[0];
        const nextWeekStr = nextWeek.toISOString().split("T")[0];

        const bookingsQuery = await db.collection("shops").doc(shopId).collection("bookings")
            .where("date", ">=", todayStr)
            .where("date", "<=", nextWeekStr)
            .orderBy("date")
            .orderBy("time")
            .limit(20)
            .get();

        if (bookingsQuery.empty) {
            await sendTextMessage(instanceName, phone, "📅 No hay citas agendadas para los próximos 7 días.");
            return { handled: true };
        }

        // Group by date
        const byDate: Record<string, typeof bookingsQuery.docs> = {};
        bookingsQuery.forEach(doc => {
            const data = doc.data();
            if (data.status !== "cancelled") {
                if (!byDate[data.date]) byDate[data.date] = [];
                byDate[data.date].push(doc);
            }
        });

        let msg = `📅 *CITAS PRÓXIMOS 7 DÍAS*\n\n`;

        for (const [date, docs] of Object.entries(byDate)) {
            const dateObj = new Date(date + "T12:00:00");
            const dateStr = dateObj.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
            msg += `*${dateStr}* (${docs.length})\n`;

            docs.forEach(doc => {
                const data = doc.data();
                const statusEmoji = data.status === "confirmed" ? "✅" : "⏳";
                msg += `  ${statusEmoji} ${data.time} - ${data.customerName}\n`;
            });
            msg += `\n`;
        }

        const totalCount = Object.values(byDate).reduce((sum, arr) => sum + arr.length, 0);
        msg += `_Total: ${totalCount} citas_`;

        await sendTextMessage(instanceName, phone, msg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 6.6. COMMAND: "Buscar cita [nombre/tel]"
    // ------------------------------------------------------------
    if (command.startsWith("buscar cita ") || command.startsWith("cita de ")) {
        const searchTerm = command.replace("buscar cita ", "").replace("cita de ", "").trim().toLowerCase();

        if (searchTerm.length < 3) {
            await sendTextMessage(instanceName, phone, "❌ Escribe al menos 3 caracteres.\n_Ejemplo: Buscar cita María_");
            return { handled: true };
        }

        const today = new Date().toISOString().split("T")[0];

        // Search future bookings
        const bookingsQuery = await db.collection("shops").doc(shopId).collection("bookings")
            .where("date", ">=", today)
            .limit(50)
            .get();

        const matches: { date: string; time: string; name: string; phone: string; service: string; status: string }[] = [];

        bookingsQuery.forEach(doc => {
            const data = doc.data();
            const nameMatch = data.customerName?.toLowerCase().includes(searchTerm);
            const phoneMatch = data.customerPhone?.includes(searchTerm);

            if ((nameMatch || phoneMatch) && data.status !== "cancelled") {
                matches.push({
                    date: data.date,
                    time: data.time,
                    name: data.customerName,
                    phone: data.customerPhone,
                    service: data.serviceName,
                    status: data.status
                });
            }
        });

        if (matches.length === 0) {
            await sendTextMessage(instanceName, phone, `🔍 No encontré citas futuras para "${searchTerm}".`);
            return { handled: true };
        }

        // Sort by date
        matches.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

        let msg = `🔍 *CITAS ENCONTRADAS*\n\n`;
        matches.slice(0, 5).forEach(c => {
            const dateObj = new Date(c.date + "T12:00:00");
            const dateStr = dateObj.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" });
            const statusEmoji = c.status === "confirmed" ? "✅" : "⏳";

            msg += `${statusEmoji} *${dateStr}* a las *${c.time}*\n`;
            msg += `   👤 ${c.name}\n`;
            msg += `   📱 ${c.phone}\n`;
            msg += `   ✂️ ${c.service}\n\n`;
        });

        if (matches.length > 5) {
            msg += `_...y ${matches.length - 5} más_`;
        }

        await sendTextMessage(instanceName, phone, msg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 6.7. COMMAND: "Horario" (Business Hours)
    // ------------------------------------------------------------
    if (command === "horario" || command === "horarios" || command === "horas") {
        const shopDoc = await db.collection("shops").doc(shopId).get();
        const shopData = shopDoc.data();

        // Try to get booking config for business hours
        const bookingConfigDoc = await db.collection("shops").doc(shopId)
            .collection("bookingConfig").doc("config").get();
        const bookingConfig = bookingConfigDoc.data();

        let msg = `🕒 *HORARIO DEL NEGOCIO*\n\n`;

        if (bookingConfig?.schedule) {
            const days: Record<string, string> = {
                monday: "Lunes",
                tuesday: "Martes",
                wednesday: "Miércoles",
                thursday: "Jueves",
                friday: "Viernes",
                saturday: "Sábado",
                sunday: "Domingo"
            };

            for (const [day, label] of Object.entries(days)) {
                const schedule = bookingConfig.schedule[day];
                if (schedule?.closed) {
                    msg += `🔴 ${label}: Cerrado\n`;
                } else if (schedule) {
                    msg += `🟢 ${label}: ${schedule.open} - ${schedule.close}\n`;
                }
            }
        } else if (bookingConfig?.openTime && bookingConfig?.closeTime) {
            msg += `🟢 Abierto: ${bookingConfig.openTime} - ${bookingConfig.closeTime}\n\n`;

            if (bookingConfig.closedDays?.length > 0) {
                const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
                const closedNames = bookingConfig.closedDays.map((d: number) => dayNames[d]).join(", ");
                msg += `🔴 Cerrado: ${closedNames}`;
            }
        } else {
            msg += `No hay horario configurado.\n\nConfigúralo desde:\n/admin/bookings/settings`;
        }

        if (bookingConfig?.breakEnabled) {
            msg += `\n\n☕ *Descanso:* ${bookingConfig.breakStartTime} - ${bookingConfig.breakEndTime}`;
        }

        msg += `\n\n_Para cambiar, escribe:_\n`;
        msg += `• "Horario 9:00 a 18:00"\n`;
        msg += `• "Cerrar los domingos"\n`;
        msg += `• "Descanso 13:00 a 14:00"`;

        await sendTextMessage(instanceName, phone, msg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 6.8. COMMAND: "Horario [open] a [close]" (Set Business Hours)
    // Patterns:
    //   - "horario 9:00 a 18:00"
    //   - "horario de 10:00 a 20:00"
    //   - "abrir de 8 a 6"
    // ------------------------------------------------------------
    const scheduleMatch = command.match(/horario\s*(?:de\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:a|hasta|-)\s*(\d{1,2})(?::(\d{2}))?/i);
    if (scheduleMatch) {
        const openHour = parseInt(scheduleMatch[1]);
        const openMin = scheduleMatch[2] ? parseInt(scheduleMatch[2]) : 0;
        let closeHour = parseInt(scheduleMatch[3]);
        const closeMin = scheduleMatch[4] ? parseInt(scheduleMatch[4]) : 0;

        // Handle PM times (if hour < 12 and seems like afternoon)
        if (closeHour < openHour && closeHour < 12) {
            closeHour += 12; // e.g., "9 a 6" means 9:00 to 18:00
        }

        // Validate
        if (openHour < 0 || openHour > 23 || closeHour < 0 || closeHour > 23) {
            await sendTextMessage(instanceName, phone, "❌ Hora inválida. Usa formato 24h (0-23).\n_Ejemplo: Horario 9:00 a 18:00_");
            return { handled: true };
        }

        if (openHour > closeHour || (openHour === closeHour && openMin >= closeMin)) {
            await sendTextMessage(instanceName, phone, "❌ La hora de apertura debe ser antes del cierre.\n_Ejemplo: Horario 9:00 a 18:00_");
            return { handled: true };
        }

        const openTime = `${String(openHour).padStart(2, "0")}:${String(openMin).padStart(2, "0")}`;
        const closeTime = `${String(closeHour).padStart(2, "0")}:${String(closeMin).padStart(2, "0")}`;

        // Update config
        await updateBookingConfigAdmin(shopId, { openTime, closeTime });

        const successMsg = `✅ *HORARIO ACTUALIZADO*\n\n` +
            `🕐 *Apertura:* ${openTime}\n` +
            `🕕 *Cierre:* ${closeTime}\n\n` +
            `_Los cambios aplican inmediatamente._`;

        await sendTextMessage(instanceName, phone, successMsg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 6.9. COMMAND: "Cerrar los [día]" (Set Weekly Closed Day)
    // Patterns:
    //   - "cerrar los domingos"
    //   - "cerrar los lunes"
    //   - "cerrar domingos"
    // ------------------------------------------------------------
    const closeWeekdayMatch = command.match(/cerrar\s*(?:los\s+)?(?:dias?\s+)?(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|sábados|sabados|domingo|domingos)/i);
    if (closeWeekdayMatch) {
        const dayStr = closeWeekdayMatch[1].toLowerCase();
        const dayMap: Record<string, number> = {
            "domingo": 0, "domingos": 0,
            "lunes": 1,
            "martes": 2,
            "miércoles": 3, "miercoles": 3,
            "jueves": 4,
            "viernes": 5,
            "sábado": 6, "sabado": 6, "sábados": 6, "sabados": 6
        };
        const dayNum = dayMap[dayStr];
        const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

        // Get current config
        const config = await getBookingConfigAdmin(shopId);
        const closedDays = config.closedDays || [];

        // Check if already closed
        if (closedDays.includes(dayNum)) {
            await sendTextMessage(instanceName, phone, `ℹ️ Los *${dayNames[dayNum]}* ya están marcados como cerrados.`);
            return { handled: true };
        }

        // Add the day
        closedDays.push(dayNum);
        closedDays.sort((a, b) => a - b);

        await updateBookingConfigAdmin(shopId, { closedDays });

        const closedDayNames = closedDays.map(d => dayNames[d]).join(", ");

        const successMsg = `✅ *DÍA CERRADO*\n\n` +
            `Los *${dayNames[dayNum]}* ahora están marcados como cerrados.\n\n` +
            `📅 *Días de cierre semanal:*\n${closedDayNames}\n\n` +
            `_Para reabrir, escribe: "Abrir los ${dayNames[dayNum].toLowerCase()}"_`;

        await sendTextMessage(instanceName, phone, successMsg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 6.10. COMMAND: "Abrir los [día]" (Remove Weekly Closed Day)
    // Patterns:
    //   - "abrir los domingos"
    //   - "abrir los lunes"
    // ------------------------------------------------------------
    const openWeekdayMatch = command.match(/abrir\s*(?:los\s+)?(?:dias?\s+)?(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|sábados|sabados|domingo|domingos)/i);
    if (openWeekdayMatch) {
        const dayStr = openWeekdayMatch[1].toLowerCase();
        const dayMap: Record<string, number> = {
            "domingo": 0, "domingos": 0,
            "lunes": 1,
            "martes": 2,
            "miércoles": 3, "miercoles": 3,
            "jueves": 4,
            "viernes": 5,
            "sábado": 6, "sabado": 6, "sábados": 6, "sabados": 6
        };
        const dayNum = dayMap[dayStr];
        const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

        // Get current config
        const config = await getBookingConfigAdmin(shopId);
        const closedDays = config.closedDays || [];

        // Check if not closed
        if (!closedDays.includes(dayNum)) {
            await sendTextMessage(instanceName, phone, `ℹ️ Los *${dayNames[dayNum]}* ya están abiertos.`);
            return { handled: true };
        }

        // Remove the day
        const newClosedDays = closedDays.filter(d => d !== dayNum);

        await updateBookingConfigAdmin(shopId, { closedDays: newClosedDays });

        let successMsg = `✅ *DÍA ABIERTO*\n\n` +
            `Los *${dayNames[dayNum]}* ahora están abiertos para citas.`;

        if (newClosedDays.length > 0) {
            const closedDayNames = newClosedDays.map(d => dayNames[d]).join(", ");
            successMsg += `\n\n📅 *Días de cierre semanal:*\n${closedDayNames}`;
        } else {
            successMsg += `\n\n📅 Ahora atiendes todos los días de la semana.`;
        }

        await sendTextMessage(instanceName, phone, successMsg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 6.11. COMMAND: "Descanso [start] a [end]" (Set Break Time)
    // Patterns:
    //   - "descanso 13:00 a 14:00"
    //   - "descanso de 1 a 2"
    //   - "hora de comida 12:30 a 13:30"
    // ------------------------------------------------------------
    const breakMatch = command.match(/(?:descanso|comida|break)\s*(?:de\s+)?(\d{1,2})(?::(\d{2}))?\s*(?:a|hasta|-)\s*(\d{1,2})(?::(\d{2}))?/i);
    if (breakMatch) {
        let startHour = parseInt(breakMatch[1]);
        const startMin = breakMatch[2] ? parseInt(breakMatch[2]) : 0;
        let endHour = parseInt(breakMatch[3]);
        const endMin = breakMatch[4] ? parseInt(breakMatch[4]) : 0;

        // Handle times that seem like noon (12-14 range is typical lunch)
        if (startHour < 10) startHour += 12; // "1 a 2" means 13:00 to 14:00
        if (endHour < startHour && endHour < 10) endHour += 12;

        // Validate
        if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
            await sendTextMessage(instanceName, phone, "❌ Hora inválida. Usa formato 24h (0-23).\n_Ejemplo: Descanso 13:00 a 14:00_");
            return { handled: true };
        }

        if (startHour > endHour || (startHour === endHour && startMin >= endMin)) {
            await sendTextMessage(instanceName, phone, "❌ La hora de inicio debe ser antes del fin.\n_Ejemplo: Descanso 13:00 a 14:00_");
            return { handled: true };
        }

        const breakStartTime = `${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}`;
        const breakEndTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;

        // Update config
        await updateBookingConfigAdmin(shopId, {
            breakEnabled: true,
            breakStartTime,
            breakEndTime
        });

        const successMsg = `✅ *DESCANSO CONFIGURADO*\n\n` +
            `☕ *Inicio:* ${breakStartTime}\n` +
            `☕ *Fin:* ${breakEndTime}\n\n` +
            `Durante este horario no se podrán agendar citas.\n\n` +
            `_Para quitar el descanso, escribe: "Sin descanso"_`;

        await sendTextMessage(instanceName, phone, successMsg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // 6.12. COMMAND: "Sin descanso" (Disable Break)
    // ------------------------------------------------------------
    if (command === "sin descanso" || command === "quitar descanso" || command === "sin break") {
        await updateBookingConfigAdmin(shopId, { breakEnabled: false });

        const successMsg = `✅ *DESCANSO ELIMINADO*\n\n` +
            `Se ha desactivado el horario de descanso.\n` +
            `Ahora se pueden agendar citas en horario continuo.\n\n` +
            `_Para configurar un descanso, escribe:_\n"Descanso 13:00 a 14:00"`;

        await sendTextMessage(instanceName, phone, successMsg);
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
