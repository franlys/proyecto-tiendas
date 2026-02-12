/**
 * Configuración de WhatsApp para cada tienda
 * Almacenado en: shops/{shopId}/whatsapp_bot/config
 */

// Teléfono de staff para notificaciones
export interface StaffNotificationPhone {
    id: string;          // ID único
    phone: string;       // Número de teléfono
    name: string;        // Nombre del empleado
    enabled: boolean;    // Si está activo
    role?: string;       // Rol opcional (dueño, vendedor, etc.)
}

export interface WhatsAppAutoReplyConfig {
    // Estado general
    enabled: boolean;

    // Mensaje de bienvenida personalizado
    welcomeMessage: string;

    // Mensaje cuando el negocio está cerrado
    offlineMessage?: string;

    // Opciones del menú principal (el dueño puede personalizar cuáles mostrar)
    showCatalogOption: boolean;
    showBookingOption: boolean;  // Solo para negocios de servicios
    showQuestionOption: boolean;

    // Textos personalizables para cada opción
    catalogOptionText: string;
    bookingOptionText: string;
    questionOptionText: string;

    // Horario de atención (opcional)
    businessHoursEnabled: boolean;
    businessHoursStart: string;  // "09:00"
    businessHoursEnd: string;    // "18:00"
    timezone: string;            // "America/Santo_Domingo"

    // Cooldown entre mensajes automáticos (minutos)
    // 0 = sin cooldown (responder siempre)
    cooldownMinutes: number;

    // Notificaciones de pedidos
    ownerNotificationPhone?: string;  // Teléfono personal del dueño para notificaciones
    notifyOwnerOnOrder?: boolean;     // Enviar notificación WhatsApp al dueño

    // Múltiples teléfonos de staff para notificaciones
    staffNotificationPhones?: StaffNotificationPhone[];

    // Metadata
    updatedAt?: string;
    updatedBy?: string;
}

// Configuración por defecto según tipo de negocio
export function getDefaultWhatsAppConfig(businessType: string): WhatsAppAutoReplyConfig {
    const isServiceBusiness = ["beauty", "repair", "health", "education"].includes(businessType);

    return {
        enabled: true,
        welcomeMessage: "¡Hola! 👋 Gracias por contactarnos.\n\n¿En qué podemos ayudarte?",
        offlineMessage: "Gracias por tu mensaje. En este momento estamos fuera de horario, te responderemos pronto.",

        showCatalogOption: true,
        showBookingOption: isServiceBusiness,
        showQuestionOption: true,

        catalogOptionText: "📋 *CATÁLOGO* - Ver productos",
        bookingOptionText: "📅 *CITA* - Agendar una cita",
        questionOptionText: "❓ *PREGUNTA* - Escribe tu consulta",

        businessHoursEnabled: false,
        businessHoursStart: "09:00",
        businessHoursEnd: "18:00",
        timezone: "America/Santo_Domingo",

        cooldownMinutes: 60,
    };
}

// Interfaz para la información básica de la tienda
import { ShopBankAccount } from "@/lib/constants";

export interface ShopBasicInfo {
    id: string;
    name: string;
    slug: string;
    phone: string;
    logoUrl?: string;
    businessType?: string;
    ownerNotificationPhone?: string;
    bankAccounts?: ShopBankAccount[];
    // Extended for NLP/Bot
    website?: string;
    contact?: {
        phone?: string;
        address?: string; // For "Ubicacion"
        city?: string;
        googleMapsUrl?: string;
    };
}
