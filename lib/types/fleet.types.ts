/**
 * Tipos para el sistema de Flotas (empleados con WhatsApp)
 */

export interface Fleet {
    id: string;
    shopId: string;

    // Información del empleado
    name: string;
    phone: string;  // Número de WhatsApp de la flota
    email?: string;
    role: "sales" | "manager" | "support" | "owner";

    // Configuración de WhatsApp
    instanceName: string;  // Nombre de instancia en Evolution API
    isConnected: boolean;  // Si el WhatsApp está conectado
    connectedAt?: string;

    // Estado
    isActive: boolean;     // Si la flota está activa
    isAvailable: boolean;  // Si está disponible para recibir asignaciones
    priority: number;      // Orden en la rotación (1 = primero)

    // Estadísticas
    totalAssignments: number;
    acceptedAssignments: number;
    rejectedAssignments: number;
    averageResponseTime?: number; // En segundos

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

export interface ShopWhatsAppConfig {
    // Instancia principal (a la que escriben los clientes)
    mainInstanceName: string;
    mainPhone: string;
    isMainConnected: boolean;
    mainConnectedAt?: string;

    // Configuración del webhook
    webhookUrl: string;
    webhookConfigured: boolean;

    // Configuración de auto-respuesta
    autoReplyEnabled: boolean;
    welcomeMessage: string;
    businessHoursOnly: boolean;
    businessHoursStart: string;
    businessHoursEnd: string;

    // Configuración de rotación a flotas
    fleetRotationEnabled: boolean;
    notifyAllFleetsOnAssignment: boolean;  // Notificar a todas cuando alguien acepta

    createdAt: string;
    updatedAt: string;
}

export interface FleetNotification {
    id: string;
    shopId: string;
    fleetId: string;

    // Tipo de notificación
    type: "new_order" | "order_taken" | "order_expired" | "new_booking" | "custom";

    // Contenido
    title: string;
    message: string;

    // Referencia
    orderId?: string;
    bookingId?: string;
    customerId?: string;
    customerPhone?: string;

    // Estado
    sentAt: string;
    deliveredAt?: string;
    readAt?: string;
    respondedAt?: string;
    response?: string;

    // Resultado
    status: "pending" | "sent" | "delivered" | "read" | "responded" | "expired";
}

export interface CreateFleetInput {
    shopId: string;
    name: string;
    phone: string;
    email?: string;
    role: Fleet["role"];
    priority?: number;
}

export interface UpdateFleetInput {
    name?: string;
    phone?: string;
    email?: string;
    role?: Fleet["role"];
    isActive?: boolean;
    isAvailable?: boolean;
    priority?: number;
}
