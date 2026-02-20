/**
 * Product Creation via WhatsApp Handler
 * Allows shop owners to add products through a conversational flow
 */

import { adminDb } from "@/lib/firebase-admin";
import { sendTextMessage } from "@/lib/evolution";
import { FieldValue } from "firebase-admin/firestore";

// Conversation states for product creation
export type ProductCreationState =
    | "idle"
    | "awaiting_name"
    | "awaiting_price"
    | "awaiting_stock"
    | "awaiting_category"
    | "awaiting_photo"
    | "awaiting_confirmation";

export interface ProductCreationData {
    state: ProductCreationState;
    name?: string;
    price?: number;
    stock?: number;
    category?: string;
    imageUrl?: string;
    expiresAt: string;
    createdAt: string;
}

interface CommandResult {
    handled: boolean;
    message?: string;
    awaitingImage?: boolean;
}

// Available categories (simplified)
const PRODUCT_CATEGORIES = [
    "cabello", "skincare", "unas", "accesorios", "barberia",
    "comida", "bebidas", "perfumes", "electronica", "otros"
];

/**
 * Check if there's an active product creation session
 */
export async function getProductCreationSession(
    shopId: string,
    phone: string
): Promise<ProductCreationData | null> {
    const db = adminDb();
    if (!db) return null;

    const cleanPhone = phone.replace(/\D/g, "");
    const docRef = db.collection("shops").doc(shopId)
        .collection("productCreationSessions").doc(cleanPhone);

    const doc = await docRef.get();
    if (!doc.exists) return null;

    const data = doc.data() as ProductCreationData;

    // Check if session expired (30 min timeout)
    if (new Date(data.expiresAt) < new Date()) {
        await docRef.delete();
        return null;
    }

    return data;
}

/**
 * Update or create a product creation session
 */
async function updateProductSession(
    shopId: string,
    phone: string,
    data: Partial<ProductCreationData>
): Promise<void> {
    const db = adminDb();
    if (!db) return;

    const cleanPhone = phone.replace(/\D/g, "");
    const docRef = db.collection("shops").doc(shopId)
        .collection("productCreationSessions").doc(cleanPhone);

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await docRef.set({
        ...data,
        expiresAt,
        updatedAt: new Date().toISOString()
    }, { merge: true });
}

/**
 * Clear the product creation session
 */
async function clearProductSession(shopId: string, phone: string): Promise<void> {
    const db = adminDb();
    if (!db) return;

    const cleanPhone = phone.replace(/\D/g, "");
    await db.collection("shops").doc(shopId)
        .collection("productCreationSessions").doc(cleanPhone).delete();
}

/**
 * Handle product creation commands and conversation flow
 */
export async function handleProductCreation(
    instanceName: string,
    shopId: string,
    phone: string,
    text: string,
    imageUrl?: string
): Promise<CommandResult> {
    const db = adminDb();
    if (!db) return { handled: false };

    const command = text.trim().toLowerCase();
    const session = await getProductCreationSession(shopId, phone);

    // ------------------------------------------------------------
    // START: "Agregar producto" or "Nuevo producto"
    // ------------------------------------------------------------
    if (command === "agregar producto" || command === "nuevo producto" ||
        command === "crear producto" || command === "add product") {

        await updateProductSession(shopId, phone, {
            state: "awaiting_name",
            createdAt: new Date().toISOString()
        });

        const msg = `📦 *AGREGAR NUEVO PRODUCTO*\n\n` +
            `Vamos a crear un producto paso a paso.\n\n` +
            `Primero, escribe el *nombre del producto*:\n\n` +
            `_Ejemplo: Shampoo Hidratante 300ml_\n\n` +
            `⚠️ Escribe "cancelar" en cualquier momento para abortar.`;

        await sendTextMessage(instanceName, phone, msg);
        return { handled: true };
    }

    // ------------------------------------------------------------
    // CANCEL: User wants to abort
    // ------------------------------------------------------------
    if (session && (command === "cancelar" || command === "cancel" || command === "salir")) {
        await clearProductSession(shopId, phone);
        await sendTextMessage(instanceName, phone, "❌ Creación de producto cancelada.");
        return { handled: true };
    }

    // ------------------------------------------------------------
    // QUICK ADD: "Agregar producto [nombre] [precio] [stock]"
    // ------------------------------------------------------------
    const quickAddMatch = text.match(/^(?:agregar|nuevo|crear)\s+producto\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+)$/i);
    if (quickAddMatch) {
        const [, name, priceStr, stockStr] = quickAddMatch;
        const price = parseFloat(priceStr);
        const stock = parseInt(stockStr);

        // Create product directly
        const productId = `prod_${Date.now()}`;
        await db.collection("shops").doc(shopId).collection("products").doc(productId).set({
            id: productId,
            name: name.trim(),
            description: "",
            price,
            stock,
            lowStockThreshold: 5,
            category: "otros",
            image: "",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdVia: "whatsapp"
        });

        const msg = `✅ *PRODUCTO CREADO*\n\n` +
            `📦 *${name.trim()}*\n` +
            `💰 Precio: $${price.toLocaleString()}\n` +
            `📊 Stock: ${stock} unidades\n\n` +
            `_¿Quieres agregar una foto? Envía una imagen ahora o escribe "listo"._`;

        // Set session to await optional photo
        await updateProductSession(shopId, phone, {
            state: "awaiting_photo",
            name: name.trim(),
            price,
            stock,
            category: "otros"
        });

        await sendTextMessage(instanceName, phone, msg);
        return { handled: true, awaitingImage: true };
    }

    // If no active session, don't handle
    if (!session) return { handled: false };

    // ------------------------------------------------------------
    // STATE MACHINE: Handle conversation flow
    // ------------------------------------------------------------
    switch (session.state) {
        case "awaiting_name":
            return handleNameInput(instanceName, shopId, phone, text);

        case "awaiting_price":
            return handlePriceInput(instanceName, shopId, phone, text, session);

        case "awaiting_stock":
            return handleStockInput(instanceName, shopId, phone, text, session);

        case "awaiting_category":
            return handleCategoryInput(instanceName, shopId, phone, text, session);

        case "awaiting_photo":
            return handlePhotoInput(instanceName, shopId, phone, text, imageUrl, session);

        case "awaiting_confirmation":
            return handleConfirmation(instanceName, shopId, phone, text, session);

        default:
            return { handled: false };
    }
}

async function handleNameInput(
    instanceName: string,
    shopId: string,
    phone: string,
    text: string
): Promise<CommandResult> {
    const name = text.trim();

    if (name.length < 2) {
        await sendTextMessage(instanceName, phone,
            "❌ El nombre debe tener al menos 2 caracteres. Inténtalo de nuevo.");
        return { handled: true };
    }

    if (name.length > 100) {
        await sendTextMessage(instanceName, phone,
            "❌ El nombre es muy largo. Máximo 100 caracteres.");
        return { handled: true };
    }

    await updateProductSession(shopId, phone, {
        state: "awaiting_price",
        name
    });

    await sendTextMessage(instanceName, phone,
        `✅ Nombre: *${name}*\n\n` +
        `Ahora escribe el *precio* (solo números):\n\n` +
        `_Ejemplo: 250 o 1500.50_`);

    return { handled: true };
}

async function handlePriceInput(
    instanceName: string,
    shopId: string,
    phone: string,
    text: string,
    session: ProductCreationData
): Promise<CommandResult> {
    // Clean price input
    const priceStr = text.replace(/[,$\s]/g, "").replace(",", ".");
    const price = parseFloat(priceStr);

    if (isNaN(price) || price <= 0) {
        await sendTextMessage(instanceName, phone,
            "❌ Precio inválido. Escribe solo números.\n_Ejemplo: 250 o 1500.50_");
        return { handled: true };
    }

    if (price > 999999999) {
        await sendTextMessage(instanceName, phone,
            "❌ El precio es demasiado alto. Verifica e inténtalo de nuevo.");
        return { handled: true };
    }

    await updateProductSession(shopId, phone, {
        state: "awaiting_stock",
        price
    });

    await sendTextMessage(instanceName, phone,
        `✅ Precio: *$${price.toLocaleString()}*\n\n` +
        `Ahora escribe la *cantidad en stock* (solo números):\n\n` +
        `_Ejemplo: 10_`);

    return { handled: true };
}

async function handleStockInput(
    instanceName: string,
    shopId: string,
    phone: string,
    text: string,
    session: ProductCreationData
): Promise<CommandResult> {
    const stock = parseInt(text.replace(/\D/g, ""));

    if (isNaN(stock) || stock < 0) {
        await sendTextMessage(instanceName, phone,
            "❌ Stock inválido. Escribe solo números.\n_Ejemplo: 10_");
        return { handled: true };
    }

    await updateProductSession(shopId, phone, {
        state: "awaiting_category",
        stock
    });

    // Build category options
    const categoryList = PRODUCT_CATEGORIES.map((c, i) => `${i + 1}. ${c}`).join("\n");

    await sendTextMessage(instanceName, phone,
        `✅ Stock: *${stock} unidades*\n\n` +
        `Selecciona una *categoría* (número o nombre):\n\n` +
        `${categoryList}\n\n` +
        `_O escribe "otro" para categoría general._`);

    return { handled: true };
}

async function handleCategoryInput(
    instanceName: string,
    shopId: string,
    phone: string,
    text: string,
    session: ProductCreationData
): Promise<CommandResult> {
    let category = "otros";
    const input = text.trim().toLowerCase();

    // Check if it's a number
    const num = parseInt(input);
    if (!isNaN(num) && num >= 1 && num <= PRODUCT_CATEGORIES.length) {
        category = PRODUCT_CATEGORIES[num - 1];
    } else if (PRODUCT_CATEGORIES.includes(input)) {
        category = input;
    }

    await updateProductSession(shopId, phone, {
        state: "awaiting_photo",
        category
    });

    await sendTextMessage(instanceName, phone,
        `✅ Categoría: *${category}*\n\n` +
        `📸 *¿Quieres agregar una foto?*\n\n` +
        `• Envía una *imagen* del producto\n` +
        `• O escribe *"sin foto"* para continuar sin imagen\n` +
        `• O escribe *"listo"* para guardar así`);

    return { handled: true, awaitingImage: true };
}

async function handlePhotoInput(
    instanceName: string,
    shopId: string,
    phone: string,
    text: string,
    imageUrl: string | undefined,
    session: ProductCreationData
): Promise<CommandResult> {
    const db = adminDb();
    if (!db) return { handled: false };

    const command = text.toLowerCase().trim();

    // If user wants to skip photo
    if (command === "sin foto" || command === "listo" || command === "no" || command === "skip") {
        // Create the product without image
        return createProduct(instanceName, shopId, phone, session, "");
    }

    // If an image was received
    if (imageUrl) {
        // Create the product with the image URL
        return createProduct(instanceName, shopId, phone, session, imageUrl);
    }

    // If text but no image, remind them
    await sendTextMessage(instanceName, phone,
        `📸 Envía una *imagen* del producto o escribe *"sin foto"* para continuar.`);

    return { handled: true, awaitingImage: true };
}

async function handleConfirmation(
    instanceName: string,
    shopId: string,
    phone: string,
    text: string,
    session: ProductCreationData
): Promise<CommandResult> {
    // This state is for future use if we want to add a confirmation step
    return { handled: false };
}

async function createProduct(
    instanceName: string,
    shopId: string,
    phone: string,
    session: ProductCreationData,
    imageUrl: string
): Promise<CommandResult> {
    const db = adminDb();
    if (!db) return { handled: false };

    try {
        const productId = `prod_${Date.now()}`;

        await db.collection("shops").doc(shopId).collection("products").doc(productId).set({
            id: productId,
            name: session.name || "Producto sin nombre",
            description: "",
            price: session.price || 0,
            stock: session.stock || 0,
            lowStockThreshold: 5,
            category: session.category || "otros",
            image: imageUrl,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdVia: "whatsapp",
            createdBy: phone
        });

        await clearProductSession(shopId, phone);

        const imageStatus = imageUrl ? "✅ Con foto" : "📷 Sin foto";

        const msg = `🎉 *¡PRODUCTO CREADO!*\n\n` +
            `📦 *${session.name}*\n` +
            `💰 Precio: $${(session.price || 0).toLocaleString()}\n` +
            `📊 Stock: ${session.stock} unidades\n` +
            `🏷️ Categoría: ${session.category}\n` +
            `${imageStatus}\n\n` +
            `El producto ya está disponible en tu tienda.\n\n` +
            `_Para agregar otro: "Agregar producto"_`;

        await sendTextMessage(instanceName, phone, msg);

        return { handled: true };
    } catch (error) {
        console.error("Error creating product:", error);
        await sendTextMessage(instanceName, phone,
            "❌ Error al crear el producto. Por favor intenta de nuevo.");
        await clearProductSession(shopId, phone);
        return { handled: true };
    }
}

/**
 * Handle image messages for product creation
 * Called from the webhook when an image is received
 */
export async function handleProductImage(
    instanceName: string,
    shopId: string,
    phone: string,
    imageUrl: string
): Promise<CommandResult> {
    const session = await getProductCreationSession(shopId, phone);

    if (!session || session.state !== "awaiting_photo") {
        return { handled: false };
    }

    return createProduct(instanceName, shopId, phone, session, imageUrl);
}
