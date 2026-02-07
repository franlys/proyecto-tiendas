/**
 * Tipos de Negocio y Configuración de Features
 *
 * Este archivo define TODOS los tipos de negocios soportados
 * y qué características necesita cada uno.
 */

// ============================================
// TIPOS DE NEGOCIO
// ============================================

export type BusinessType =
    // ============================================
    // TIPOS LEGACY (para compatibilidad con código existente)
    // ============================================
    | "beauty"             // Legacy: Belleza (mapea a salon_belleza)
    | "retail"             // Legacy: Retail (mapea a tienda_general)
    | "repair"             // Legacy: Reparación (mapea a celulares)
    | "restaurant"         // Legacy: Restaurante (mapea a restaurante)
    | "rentcar"            // Legacy: Rent-a-Car (mapea a rent_a_car)
    | "technology"         // Legacy: Tecnología (mapea a celulares)
    // ============================================
    // TIPOS NUEVOS (más específicos)
    // ============================================
    // Servicios de Belleza
    | "salon_belleza"      // Salón de belleza (cortes, tintes, etc.)
    | "barberia"           // Barbería
    | "spa"                // Spa y masajes
    | "nail_salon"         // Salón de uñas
    | "estetica_facial"    // Estética facial
    // Salud
    | "clinica_dental"     // Clínica dental
    | "consultorio_medico" // Consultorio médico
    | "veterinaria"        // Veterinaria
    | "optica"             // Óptica
    | "laboratorio"        // Laboratorio clínico
    // Comercio
    | "tienda_ropa"        // Tienda de ropa/boutique
    | "zapateria"          // Zapatería
    | "perfumeria"         // Perfumería
    | "joyeria"            // Joyería/bisutería
    | "tienda_general"     // Tienda general/abarrotes
    | "farmacia"           // Farmacia
    | "papeleria"          // Papelería
    | "floreria"           // Florería
    // Tecnología
    | "celulares"          // Venta/reparación de celulares
    | "computadoras"       // Venta/reparación de computadoras
    | "electronica"        // Electrónica general
    // Automotriz
    | "taller_mecanico"    // Taller mecánico
    | "autolavado"         // Autolavado
    | "rent_a_car"         // Renta de autos
    | "refaccionaria"      // Refaccionaria
    // Alimentos
    | "restaurante"        // Restaurante
    | "cafeteria"          // Cafetería
    | "bar"                // Bar
    | "pasteleria"         // Pastelería/panadería
    | "food_truck"         // Food truck
    // Hogar
    | "muebleria"          // Mueblería
    | "ferreteria"         // Ferretería
    | "decoracion"         // Decoración/hogar
    | "electrodomesticos"  // Electrodomésticos
    // Servicios Profesionales
    | "consultoria"        // Consultoría
    | "despacho_contable"  // Despacho contable
    | "inmobiliaria"       // Inmobiliaria
    | "seguros"            // Agencia de seguros
    // Entretenimiento
    | "gimnasio"           // Gimnasio
    | "estudio_yoga"       // Estudio de yoga/pilates
    | "salon_eventos"      // Salón de eventos
    | "fotografia"         // Estudio fotográfico
    // Educación
    | "escuela_idiomas"    // Escuela de idiomas
    | "tutoria"            // Clases particulares
    | "academia"           // Academia/cursos
    // Otros
    | "otro";              // Otro tipo de negocio

// ============================================
// CONFIGURACIÓN POR TIPO DE NEGOCIO
// ============================================

export interface BusinessTypeConfig {
    // Información básica
    id: BusinessType;
    label: string;
    labelPlural: string;
    icon: string;
    description: string;
    category: BusinessCategory;

    // Features principales
    features: {
        catalog: boolean;           // ¿Muestra catálogo de productos?
        services: boolean;          // ¿Ofrece servicios?
        bookings: boolean;          // ¿Necesita sistema de citas?
        orders: boolean;            // ¿Procesa pedidos?
        inventory: boolean;         // ¿Maneja inventario?
        wholesale: boolean;         // ¿Puede tener precios de mayoreo?
        repairs: boolean;           // ¿Ofrece reparaciones?
        rentals: boolean;           // ¿Ofrece rentas?
        tables: boolean;            // ¿Maneja mesas? (restaurantes)
        delivery: boolean;          // ¿Ofrece delivery?
    };

    // Textos personalizados
    labels: {
        cta: string;               // Texto del botón principal
        products: string;          // Cómo llamar a los productos
        services: string;          // Cómo llamar a los servicios
        booking: string;           // Cómo llamar a las citas
        order: string;             // Cómo llamar a los pedidos
    };

    // Categorías de productos recomendadas
    productCategories: ProductCategoryType[];

    // Categorías de servicios recomendadas
    serviceCategories: ServiceCategoryType[];
}

// Categorías de negocio (para agrupar en UI)
export type BusinessCategory =
    | "beauty"        // Belleza y estética
    | "health"        // Salud
    | "retail"        // Comercio/retail
    | "technology"    // Tecnología
    | "automotive"    // Automotriz
    | "food"          // Alimentos y bebidas
    | "home"          // Hogar
    | "professional"  // Servicios profesionales
    | "entertainment" // Entretenimiento
    | "education"     // Educación
    | "other";        // Otros

// ============================================
// CATEGORÍAS DE PRODUCTOS
// ============================================

export type ProductCategoryType =
    // Belleza
    | "cabello" | "skincare" | "maquillaje" | "unas" | "corporal"
    // Tecnología
    | "celulares" | "accesorios_tech" | "computadoras" | "audio" | "gaming"
    // Ropa
    | "ropa_mujer" | "ropa_hombre" | "ropa_ninos" | "calzado" | "accesorios_moda"
    // Alimentos
    | "comida" | "bebidas" | "postres" | "snacks"
    // Salud
    | "medicamentos" | "suplementos" | "equipo_medico"
    // Hogar
    | "muebles" | "decoracion" | "electrodomesticos" | "jardin"
    // Automotriz
    | "refacciones" | "accesorios_auto" | "llantas" | "lubricantes"
    // General
    | "perfumes" | "joyeria" | "papeleria" | "mascotas" | "deportes"
    | "otros";

// ============================================
// CATEGORÍAS DE SERVICIOS
// ============================================

export type ServiceCategoryType =
    // Belleza
    | "corte" | "color_cabello" | "tratamiento_cabello" | "peinado"
    | "manicure" | "pedicure" | "unas_gel" | "unas_acrilico"
    | "facial" | "corporal" | "depilacion" | "maquillaje_servicio"
    | "masaje" | "spa_servicio"
    // Barbería
    | "corte_barba" | "afeitado" | "diseno_barba"
    // Salud
    | "consulta_medica" | "consulta_dental" | "limpieza_dental"
    | "ortodoncia" | "vacunacion" | "laboratorio_servicio"
    // Tecnología
    | "reparacion_pantalla" | "reparacion_bateria" | "reparacion_software"
    | "mantenimiento_pc" | "instalacion"
    // Automotriz
    | "cambio_aceite" | "afinacion" | "frenos" | "suspension"
    | "lavado_auto" | "encerado" | "detallado"
    // Profesional
    | "asesoria" | "consultoria_servicio" | "capacitacion"
    // Fitness
    | "clase_yoga" | "clase_pilates" | "entrenamiento_personal"
    // General
    | "evento" | "fotografia_servicio" | "clase_particular"
    | "otro_servicio";

// ============================================
// LABELS PARA UI
// ============================================

export const BUSINESS_CATEGORY_LABELS: Record<BusinessCategory, string> = {
    beauty: "Belleza y Estética",
    health: "Salud",
    retail: "Comercio",
    technology: "Tecnología",
    automotive: "Automotriz",
    food: "Alimentos y Bebidas",
    home: "Hogar",
    professional: "Servicios Profesionales",
    entertainment: "Entretenimiento",
    education: "Educación",
    other: "Otros",
};

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategoryType, string> = {
    // Belleza
    cabello: "Cabello",
    skincare: "Skincare",
    maquillaje: "Maquillaje",
    unas: "Uñas",
    corporal: "Corporal",
    // Tecnología
    celulares: "Celulares",
    accesorios_tech: "Accesorios Tech",
    computadoras: "Computadoras",
    audio: "Audio",
    gaming: "Gaming",
    // Ropa
    ropa_mujer: "Ropa Mujer",
    ropa_hombre: "Ropa Hombre",
    ropa_ninos: "Ropa Niños",
    calzado: "Calzado",
    accesorios_moda: "Accesorios",
    // Alimentos
    comida: "Comida",
    bebidas: "Bebidas",
    postres: "Postres",
    snacks: "Snacks",
    // Salud
    medicamentos: "Medicamentos",
    suplementos: "Suplementos",
    equipo_medico: "Equipo Médico",
    // Hogar
    muebles: "Muebles",
    decoracion: "Decoración",
    electrodomesticos: "Electrodomésticos",
    jardin: "Jardín",
    // Automotriz
    refacciones: "Refacciones",
    accesorios_auto: "Accesorios Auto",
    llantas: "Llantas",
    lubricantes: "Lubricantes",
    // General
    perfumes: "Perfumes",
    joyeria: "Joyería",
    papeleria: "Papelería",
    mascotas: "Mascotas",
    deportes: "Deportes",
    otros: "Otros",
};

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategoryType, string> = {
    // Belleza
    corte: "Corte de Cabello",
    color_cabello: "Color y Tintes",
    tratamiento_cabello: "Tratamientos Capilares",
    peinado: "Peinados",
    manicure: "Manicure",
    pedicure: "Pedicure",
    unas_gel: "Uñas de Gel",
    unas_acrilico: "Uñas Acrílicas",
    facial: "Tratamientos Faciales",
    corporal: "Tratamientos Corporales",
    depilacion: "Depilación",
    maquillaje_servicio: "Maquillaje",
    masaje: "Masajes",
    spa_servicio: "Spa",
    // Barbería
    corte_barba: "Corte y Barba",
    afeitado: "Afeitado",
    diseno_barba: "Diseño de Barba",
    // Salud
    consulta_medica: "Consulta Médica",
    consulta_dental: "Consulta Dental",
    limpieza_dental: "Limpieza Dental",
    ortodoncia: "Ortodoncia",
    vacunacion: "Vacunación",
    laboratorio_servicio: "Estudios de Laboratorio",
    // Tecnología
    reparacion_pantalla: "Reparación de Pantalla",
    reparacion_bateria: "Cambio de Batería",
    reparacion_software: "Reparación de Software",
    mantenimiento_pc: "Mantenimiento PC",
    instalacion: "Instalación",
    // Automotriz
    cambio_aceite: "Cambio de Aceite",
    afinacion: "Afinación",
    frenos: "Frenos",
    suspension: "Suspensión",
    lavado_auto: "Lavado",
    encerado: "Encerado",
    detallado: "Detallado",
    // Profesional
    asesoria: "Asesoría",
    consultoria_servicio: "Consultoría",
    capacitacion: "Capacitación",
    // Fitness
    clase_yoga: "Clase de Yoga",
    clase_pilates: "Clase de Pilates",
    entrenamiento_personal: "Entrenamiento Personal",
    // General
    evento: "Evento",
    fotografia_servicio: "Sesión Fotográfica",
    clase_particular: "Clase Particular",
    otro_servicio: "Otro Servicio",
};

// ============================================
// CONFIGURACIÓN COMPLETA POR TIPO DE NEGOCIO
// ============================================

export const BUSINESS_TYPE_CONFIG: Record<BusinessType, BusinessTypeConfig> = {
    // ============================================
    // TIPOS LEGACY (para compatibilidad)
    // ============================================
    beauty: {
        id: "beauty",
        label: "Belleza",
        labelPlural: "Negocios de Belleza",
        icon: "✂️",
        description: "Salón de belleza y estética",
        category: "beauty",
        features: {
            catalog: true,
            services: true,
            bookings: true,
            orders: false,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Reservar Cita",
            products: "Productos",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["cabello", "skincare", "maquillaje"],
        serviceCategories: ["corte", "color_cabello", "tratamiento_cabello", "peinado"],
    },

    retail: {
        id: "retail",
        label: "Retail",
        labelPlural: "Tiendas",
        icon: "🏪",
        description: "Tienda de venta al público",
        category: "retail",
        features: {
            catalog: true,
            services: false,
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Productos",
            products: "Productos",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["otros"],
        serviceCategories: [],
    },

    repair: {
        id: "repair",
        label: "Reparación",
        labelPlural: "Talleres de Reparación",
        icon: "🔧",
        description: "Servicio de reparación",
        category: "technology",
        features: {
            catalog: true,
            services: true,
            bookings: true,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: true,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Servicios",
            products: "Productos",
            services: "Reparaciones",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["celulares", "accesorios_tech"],
        serviceCategories: ["reparacion_pantalla", "reparacion_bateria", "reparacion_software"],
    },

    restaurant: {
        id: "restaurant",
        label: "Restaurante",
        labelPlural: "Restaurantes",
        icon: "🍽️",
        description: "Comida y bebidas",
        category: "food",
        features: {
            catalog: true,
            services: false,
            bookings: true,
            orders: true,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: true,
            delivery: true,
        },
        labels: {
            cta: "Ver Menú",
            products: "Platillos",
            services: "Servicios",
            booking: "Reservación",
            order: "Orden",
        },
        productCategories: ["comida", "bebidas", "postres"],
        serviceCategories: [],
    },

    rentcar: {
        id: "rentcar",
        label: "Rent-a-Car",
        labelPlural: "Rentas de Autos",
        icon: "🚙",
        description: "Alquiler de vehículos",
        category: "automotive",
        features: {
            catalog: true,
            services: false,
            bookings: true,
            orders: false,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: true,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Reservar Auto",
            products: "Vehículos",
            services: "Servicios",
            booking: "Reservación",
            order: "Renta",
        },
        productCategories: [],
        serviceCategories: [],
    },

    technology: {
        id: "technology",
        label: "Tecnología",
        labelPlural: "Tiendas de Tecnología",
        icon: "📱",
        description: "Venta y reparación de tecnología",
        category: "technology",
        features: {
            catalog: true,
            services: true,
            bookings: true,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: true,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Catálogo",
            products: "Productos",
            services: "Reparaciones",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["celulares", "accesorios_tech", "computadoras"],
        serviceCategories: ["reparacion_pantalla", "reparacion_bateria", "reparacion_software"],
    },

    // ========== BELLEZA ==========
    salon_belleza: {
        id: "salon_belleza",
        label: "Salón de Belleza",
        labelPlural: "Salones de Belleza",
        icon: "✂️",
        description: "Cortes, tintes, peinados y tratamientos capilares",
        category: "beauty",
        features: {
            catalog: true,      // Productos de belleza
            services: true,     // Servicios de corte, tinte, etc.
            bookings: true,     // Sistema de citas
            orders: false,
            inventory: true,    // Stock de productos
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Reservar Cita",
            products: "Productos",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["cabello", "skincare", "maquillaje"],
        serviceCategories: ["corte", "color_cabello", "tratamiento_cabello", "peinado"],
    },

    barberia: {
        id: "barberia",
        label: "Barbería",
        labelPlural: "Barberías",
        icon: "💈",
        description: "Cortes de cabello y barba para hombres",
        category: "beauty",
        features: {
            catalog: true,
            services: true,
            bookings: true,
            orders: false,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Reservar Turno",
            products: "Productos",
            services: "Servicios",
            booking: "Turno",
            order: "Pedido",
        },
        productCategories: ["cabello", "corporal"],
        serviceCategories: ["corte", "corte_barba", "afeitado", "diseno_barba"],
    },

    spa: {
        id: "spa",
        label: "Spa",
        labelPlural: "Spas",
        icon: "🧖",
        description: "Masajes, tratamientos corporales y relajación",
        category: "beauty",
        features: {
            catalog: true,
            services: true,
            bookings: true,
            orders: false,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Reservar Sesión",
            products: "Productos",
            services: "Tratamientos",
            booking: "Sesión",
            order: "Pedido",
        },
        productCategories: ["skincare", "corporal"],
        serviceCategories: ["masaje", "spa_servicio", "facial", "corporal"],
    },

    nail_salon: {
        id: "nail_salon",
        label: "Salón de Uñas",
        labelPlural: "Salones de Uñas",
        icon: "💅",
        description: "Manicure, pedicure y diseño de uñas",
        category: "beauty",
        features: {
            catalog: true,
            services: true,
            bookings: true,
            orders: false,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Reservar Cita",
            products: "Productos",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["unas"],
        serviceCategories: ["manicure", "pedicure", "unas_gel", "unas_acrilico"],
    },

    estetica_facial: {
        id: "estetica_facial",
        label: "Estética Facial",
        labelPlural: "Estéticas Faciales",
        icon: "🧴",
        description: "Tratamientos faciales, limpieza y rejuvenecimiento",
        category: "beauty",
        features: {
            catalog: true,
            services: true,
            bookings: true,
            orders: false,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Reservar Tratamiento",
            products: "Productos",
            services: "Tratamientos",
            booking: "Tratamiento",
            order: "Pedido",
        },
        productCategories: ["skincare", "maquillaje"],
        serviceCategories: ["facial", "depilacion", "maquillaje_servicio"],
    },

    // ========== SALUD ==========
    clinica_dental: {
        id: "clinica_dental",
        label: "Clínica Dental",
        labelPlural: "Clínicas Dentales",
        icon: "🦷",
        description: "Servicios odontológicos y ortodoncia",
        category: "health",
        features: {
            catalog: false,
            services: true,
            bookings: true,
            orders: false,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Agendar Cita",
            products: "Productos",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: [],
        serviceCategories: ["consulta_dental", "limpieza_dental", "ortodoncia"],
    },

    consultorio_medico: {
        id: "consultorio_medico",
        label: "Consultorio Médico",
        labelPlural: "Consultorios Médicos",
        icon: "🏥",
        description: "Consultas médicas y atención primaria",
        category: "health",
        features: {
            catalog: false,
            services: true,
            bookings: true,
            orders: false,
            inventory: false,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Agendar Consulta",
            products: "Productos",
            services: "Servicios",
            booking: "Consulta",
            order: "Pedido",
        },
        productCategories: [],
        serviceCategories: ["consulta_medica", "vacunacion"],
    },

    veterinaria: {
        id: "veterinaria",
        label: "Veterinaria",
        labelPlural: "Veterinarias",
        icon: "🐾",
        description: "Atención médica para mascotas",
        category: "health",
        features: {
            catalog: true,      // Productos para mascotas
            services: true,
            bookings: true,
            orders: true,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Agendar Cita",
            products: "Productos",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["mascotas", "medicamentos"],
        serviceCategories: ["consulta_medica", "vacunacion"],
    },

    optica: {
        id: "optica",
        label: "Óptica",
        labelPlural: "Ópticas",
        icon: "👓",
        description: "Lentes, exámenes de la vista y accesorios",
        category: "health",
        features: {
            catalog: true,
            services: true,
            bookings: true,
            orders: true,
            inventory: true,
            wholesale: false,
            repairs: true,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Agendar Examen",
            products: "Productos",
            services: "Servicios",
            booking: "Examen",
            order: "Pedido",
        },
        productCategories: ["accesorios_moda"],
        serviceCategories: ["consulta_medica"],
    },

    laboratorio: {
        id: "laboratorio",
        label: "Laboratorio Clínico",
        labelPlural: "Laboratorios",
        icon: "🔬",
        description: "Análisis clínicos y estudios de laboratorio",
        category: "health",
        features: {
            catalog: false,
            services: true,
            bookings: true,
            orders: false,
            inventory: false,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Agendar Estudio",
            products: "Estudios",
            services: "Estudios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: [],
        serviceCategories: ["laboratorio_servicio"],
    },

    // ========== COMERCIO ==========
    tienda_ropa: {
        id: "tienda_ropa",
        label: "Tienda de Ropa",
        labelPlural: "Tiendas de Ropa",
        icon: "👗",
        description: "Ropa, moda y accesorios",
        category: "retail",
        features: {
            catalog: true,
            services: false,
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Catálogo",
            products: "Prendas",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["ropa_mujer", "ropa_hombre", "ropa_ninos", "accesorios_moda"],
        serviceCategories: [],
    },

    zapateria: {
        id: "zapateria",
        label: "Zapatería",
        labelPlural: "Zapaterías",
        icon: "👟",
        description: "Calzado para toda la familia",
        category: "retail",
        features: {
            catalog: true,
            services: false,
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: true,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Catálogo",
            products: "Calzado",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["calzado", "accesorios_moda"],
        serviceCategories: [],
    },

    perfumeria: {
        id: "perfumeria",
        label: "Perfumería",
        labelPlural: "Perfumerías",
        icon: "🧴",
        description: "Perfumes y fragancias",
        category: "retail",
        features: {
            catalog: true,
            services: false,
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Catálogo",
            products: "Fragancias",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["perfumes", "skincare", "maquillaje"],
        serviceCategories: [],
    },

    joyeria: {
        id: "joyeria",
        label: "Joyería",
        labelPlural: "Joyerías",
        icon: "💍",
        description: "Joyería, bisutería y accesorios",
        category: "retail",
        features: {
            catalog: true,
            services: true,     // Grabado, reparaciones
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: true,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Colección",
            products: "Joyería",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["joyeria", "accesorios_moda"],
        serviceCategories: [],
    },

    tienda_general: {
        id: "tienda_general",
        label: "Tienda General",
        labelPlural: "Tiendas",
        icon: "🏪",
        description: "Abarrotes y productos generales",
        category: "retail",
        features: {
            catalog: true,
            services: false,
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Productos",
            products: "Productos",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["comida", "bebidas", "snacks", "otros"],
        serviceCategories: [],
    },

    farmacia: {
        id: "farmacia",
        label: "Farmacia",
        labelPlural: "Farmacias",
        icon: "💊",
        description: "Medicamentos y productos de salud",
        category: "retail",
        features: {
            catalog: true,
            services: true,     // Inyecciones, toma de presión
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Productos",
            products: "Productos",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["medicamentos", "suplementos", "skincare"],
        serviceCategories: [],
    },

    papeleria: {
        id: "papeleria",
        label: "Papelería",
        labelPlural: "Papelerías",
        icon: "📚",
        description: "Artículos escolares y de oficina",
        category: "retail",
        features: {
            catalog: true,
            services: true,     // Impresiones, copias
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Productos",
            products: "Productos",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["papeleria"],
        serviceCategories: [],
    },

    floreria: {
        id: "floreria",
        label: "Florería",
        labelPlural: "Florerías",
        icon: "💐",
        description: "Arreglos florales y plantas",
        category: "retail",
        features: {
            catalog: true,
            services: true,     // Arreglos personalizados
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Arreglos",
            products: "Arreglos",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["decoracion", "otros"],
        serviceCategories: [],
    },

    // ========== TECNOLOGÍA ==========
    celulares: {
        id: "celulares",
        label: "Tienda de Celulares",
        labelPlural: "Tiendas de Celulares",
        icon: "📱",
        description: "Venta y reparación de celulares",
        category: "technology",
        features: {
            catalog: true,
            services: true,
            bookings: true,     // Para reparaciones
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: true,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Catálogo",
            products: "Productos",
            services: "Reparaciones",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["celulares", "accesorios_tech"],
        serviceCategories: ["reparacion_pantalla", "reparacion_bateria", "reparacion_software"],
    },

    computadoras: {
        id: "computadoras",
        label: "Tienda de Computadoras",
        labelPlural: "Tiendas de Computadoras",
        icon: "💻",
        description: "Venta y reparación de computadoras",
        category: "technology",
        features: {
            catalog: true,
            services: true,
            bookings: true,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: true,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Catálogo",
            products: "Productos",
            services: "Reparaciones",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["computadoras", "accesorios_tech", "gaming"],
        serviceCategories: ["mantenimiento_pc", "reparacion_software", "instalacion"],
    },

    electronica: {
        id: "electronica",
        label: "Electrónica",
        labelPlural: "Tiendas de Electrónica",
        icon: "🔌",
        description: "Electrónica y gadgets",
        category: "technology",
        features: {
            catalog: true,
            services: true,
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: true,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Catálogo",
            products: "Productos",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["celulares", "computadoras", "audio", "gaming", "accesorios_tech"],
        serviceCategories: ["instalacion"],
    },

    // ========== AUTOMOTRIZ ==========
    taller_mecanico: {
        id: "taller_mecanico",
        label: "Taller Mecánico",
        labelPlural: "Talleres Mecánicos",
        icon: "🔧",
        description: "Reparación y mantenimiento automotriz",
        category: "automotive",
        features: {
            catalog: true,      // Refacciones
            services: true,
            bookings: true,
            orders: true,
            inventory: true,
            wholesale: false,
            repairs: true,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Agendar Servicio",
            products: "Refacciones",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["refacciones", "lubricantes", "accesorios_auto"],
        serviceCategories: ["cambio_aceite", "afinacion", "frenos", "suspension"],
    },

    autolavado: {
        id: "autolavado",
        label: "Autolavado",
        labelPlural: "Autolavados",
        icon: "🚗",
        description: "Lavado y detallado de vehículos",
        category: "automotive",
        features: {
            catalog: true,
            services: true,
            bookings: true,
            orders: false,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Agendar Lavado",
            products: "Productos",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["accesorios_auto"],
        serviceCategories: ["lavado_auto", "encerado", "detallado"],
    },

    rent_a_car: {
        id: "rent_a_car",
        label: "Renta de Autos",
        labelPlural: "Rentas de Autos",
        icon: "🚙",
        description: "Alquiler de vehículos",
        category: "automotive",
        features: {
            catalog: true,      // Mostrar flota de autos
            services: false,
            bookings: true,
            orders: false,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: true,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Reservar Auto",
            products: "Vehículos",
            services: "Servicios",
            booking: "Reservación",
            order: "Renta",
        },
        productCategories: [],
        serviceCategories: [],
    },

    refaccionaria: {
        id: "refaccionaria",
        label: "Refaccionaria",
        labelPlural: "Refaccionarias",
        icon: "⚙️",
        description: "Refacciones y autopartes",
        category: "automotive",
        features: {
            catalog: true,
            services: false,
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Catálogo",
            products: "Refacciones",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["refacciones", "lubricantes", "llantas", "accesorios_auto"],
        serviceCategories: [],
    },

    // ========== ALIMENTOS ==========
    restaurante: {
        id: "restaurante",
        label: "Restaurante",
        labelPlural: "Restaurantes",
        icon: "🍽️",
        description: "Comida y bebidas",
        category: "food",
        features: {
            catalog: true,      // Menú
            services: false,
            bookings: true,     // Reservaciones de mesa
            orders: true,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: true,
            delivery: true,
        },
        labels: {
            cta: "Ver Menú",
            products: "Platillos",
            services: "Servicios",
            booking: "Reservación",
            order: "Orden",
        },
        productCategories: ["comida", "bebidas", "postres"],
        serviceCategories: [],
    },

    cafeteria: {
        id: "cafeteria",
        label: "Cafetería",
        labelPlural: "Cafeterías",
        icon: "☕",
        description: "Café y snacks",
        category: "food",
        features: {
            catalog: true,
            services: false,
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: true,
            delivery: true,
        },
        labels: {
            cta: "Ver Menú",
            products: "Productos",
            services: "Servicios",
            booking: "Reservación",
            order: "Orden",
        },
        productCategories: ["bebidas", "postres", "snacks"],
        serviceCategories: [],
    },

    bar: {
        id: "bar",
        label: "Bar",
        labelPlural: "Bares",
        icon: "🍸",
        description: "Bebidas y entretenimiento",
        category: "food",
        features: {
            catalog: true,
            services: false,
            bookings: true,     // Reservar mesa/VIP
            orders: true,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: true,
            delivery: false,
        },
        labels: {
            cta: "Ver Menú",
            products: "Bebidas",
            services: "Servicios",
            booking: "Reservación",
            order: "Orden",
        },
        productCategories: ["bebidas", "snacks"],
        serviceCategories: [],
    },

    pasteleria: {
        id: "pasteleria",
        label: "Pastelería",
        labelPlural: "Pastelerías",
        icon: "🎂",
        description: "Pasteles, pan y postres",
        category: "food",
        features: {
            catalog: true,
            services: true,     // Pasteles personalizados
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Catálogo",
            products: "Productos",
            services: "Servicios",
            booking: "Pedido",
            order: "Pedido",
        },
        productCategories: ["postres", "bebidas"],
        serviceCategories: [],
    },

    food_truck: {
        id: "food_truck",
        label: "Food Truck",
        labelPlural: "Food Trucks",
        icon: "🚚",
        description: "Comida rápida móvil",
        category: "food",
        features: {
            catalog: true,
            services: false,
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Ver Menú",
            products: "Platillos",
            services: "Servicios",
            booking: "Orden",
            order: "Orden",
        },
        productCategories: ["comida", "bebidas", "snacks"],
        serviceCategories: [],
    },

    // ========== HOGAR ==========
    muebleria: {
        id: "muebleria",
        label: "Mueblería",
        labelPlural: "Mueblerías",
        icon: "🛋️",
        description: "Muebles y decoración",
        category: "home",
        features: {
            catalog: true,
            services: true,     // Armado, entrega
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: true,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Catálogo",
            products: "Muebles",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["muebles", "decoracion"],
        serviceCategories: ["instalacion"],
    },

    ferreteria: {
        id: "ferreteria",
        label: "Ferretería",
        labelPlural: "Ferreterías",
        icon: "🔨",
        description: "Herramientas y materiales de construcción",
        category: "home",
        features: {
            catalog: true,
            services: true,     // Cortes, duplicados de llaves
            bookings: false,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: false,
            rentals: true,      // Renta de herramientas
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Catálogo",
            products: "Productos",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["jardin", "otros"],
        serviceCategories: [],
    },

    decoracion: {
        id: "decoracion",
        label: "Decoración",
        labelPlural: "Tiendas de Decoración",
        icon: "🏠",
        description: "Artículos decorativos para el hogar",
        category: "home",
        features: {
            catalog: true,
            services: true,     // Asesoría de decoración
            bookings: true,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Catálogo",
            products: "Productos",
            services: "Servicios",
            booking: "Asesoría",
            order: "Pedido",
        },
        productCategories: ["decoracion", "muebles"],
        serviceCategories: ["asesoria"],
    },

    electrodomesticos: {
        id: "electrodomesticos",
        label: "Electrodomésticos",
        labelPlural: "Tiendas de Electrodomésticos",
        icon: "🧊",
        description: "Electrodomésticos y línea blanca",
        category: "home",
        features: {
            catalog: true,
            services: true,     // Instalación, reparación
            bookings: true,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: true,
            rentals: false,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Catálogo",
            products: "Productos",
            services: "Servicios",
            booking: "Servicio",
            order: "Pedido",
        },
        productCategories: ["electrodomesticos"],
        serviceCategories: ["instalacion"],
    },

    // ========== SERVICIOS PROFESIONALES ==========
    consultoria: {
        id: "consultoria",
        label: "Consultoría",
        labelPlural: "Consultorías",
        icon: "📊",
        description: "Consultoría empresarial y profesional",
        category: "professional",
        features: {
            catalog: false,
            services: true,
            bookings: true,
            orders: false,
            inventory: false,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Agendar Consulta",
            products: "Servicios",
            services: "Servicios",
            booking: "Consulta",
            order: "Proyecto",
        },
        productCategories: [],
        serviceCategories: ["asesoria", "consultoria_servicio", "capacitacion"],
    },

    despacho_contable: {
        id: "despacho_contable",
        label: "Despacho Contable",
        labelPlural: "Despachos Contables",
        icon: "📋",
        description: "Servicios contables y fiscales",
        category: "professional",
        features: {
            catalog: false,
            services: true,
            bookings: true,
            orders: false,
            inventory: false,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Agendar Cita",
            products: "Servicios",
            services: "Servicios",
            booking: "Cita",
            order: "Proyecto",
        },
        productCategories: [],
        serviceCategories: ["asesoria", "consultoria_servicio"],
    },

    inmobiliaria: {
        id: "inmobiliaria",
        label: "Inmobiliaria",
        labelPlural: "Inmobiliarias",
        icon: "🏢",
        description: "Compra, venta y renta de inmuebles",
        category: "professional",
        features: {
            catalog: true,      // Listado de propiedades
            services: true,
            bookings: true,     // Citas para ver propiedades
            orders: false,
            inventory: false,
            wholesale: false,
            repairs: false,
            rentals: true,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Ver Propiedades",
            products: "Propiedades",
            services: "Servicios",
            booking: "Visita",
            order: "Solicitud",
        },
        productCategories: [],
        serviceCategories: ["asesoria"],
    },

    seguros: {
        id: "seguros",
        label: "Agencia de Seguros",
        labelPlural: "Agencias de Seguros",
        icon: "🛡️",
        description: "Seguros de vida, auto, hogar",
        category: "professional",
        features: {
            catalog: true,      // Tipos de seguros
            services: true,
            bookings: true,
            orders: false,
            inventory: false,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Cotizar Seguro",
            products: "Seguros",
            services: "Servicios",
            booking: "Cita",
            order: "Solicitud",
        },
        productCategories: [],
        serviceCategories: ["asesoria", "consultoria_servicio"],
    },

    // ========== ENTRETENIMIENTO ==========
    gimnasio: {
        id: "gimnasio",
        label: "Gimnasio",
        labelPlural: "Gimnasios",
        icon: "💪",
        description: "Gimnasio y fitness",
        category: "entertainment",
        features: {
            catalog: true,      // Membresías, productos
            services: true,
            bookings: true,     // Clases
            orders: true,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Ver Membresías",
            products: "Productos",
            services: "Clases",
            booking: "Clase",
            order: "Pedido",
        },
        productCategories: ["deportes", "suplementos"],
        serviceCategories: ["entrenamiento_personal"],
    },

    estudio_yoga: {
        id: "estudio_yoga",
        label: "Estudio de Yoga",
        labelPlural: "Estudios de Yoga",
        icon: "🧘",
        description: "Yoga, pilates y meditación",
        category: "entertainment",
        features: {
            catalog: true,
            services: true,
            bookings: true,
            orders: true,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Reservar Clase",
            products: "Productos",
            services: "Clases",
            booking: "Clase",
            order: "Pedido",
        },
        productCategories: ["deportes"],
        serviceCategories: ["clase_yoga", "clase_pilates"],
    },

    salon_eventos: {
        id: "salon_eventos",
        label: "Salón de Eventos",
        labelPlural: "Salones de Eventos",
        icon: "🎉",
        description: "Salón para fiestas y eventos",
        category: "entertainment",
        features: {
            catalog: true,      // Paquetes
            services: true,
            bookings: true,
            orders: false,
            inventory: false,
            wholesale: false,
            repairs: false,
            rentals: true,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Cotizar Evento",
            products: "Paquetes",
            services: "Servicios",
            booking: "Reservación",
            order: "Evento",
        },
        productCategories: [],
        serviceCategories: ["evento"],
    },

    fotografia: {
        id: "fotografia",
        label: "Estudio Fotográfico",
        labelPlural: "Estudios Fotográficos",
        icon: "📷",
        description: "Fotografía profesional y video",
        category: "entertainment",
        features: {
            catalog: true,      // Paquetes
            services: true,
            bookings: true,
            orders: true,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: true,      // Renta de equipo
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Ver Paquetes",
            products: "Productos",
            services: "Servicios",
            booking: "Sesión",
            order: "Pedido",
        },
        productCategories: ["otros"],
        serviceCategories: ["fotografia_servicio", "evento"],
    },

    // ========== EDUCACIÓN ==========
    escuela_idiomas: {
        id: "escuela_idiomas",
        label: "Escuela de Idiomas",
        labelPlural: "Escuelas de Idiomas",
        icon: "🌍",
        description: "Clases de idiomas",
        category: "education",
        features: {
            catalog: true,      // Cursos
            services: true,
            bookings: true,
            orders: false,
            inventory: false,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Ver Cursos",
            products: "Cursos",
            services: "Clases",
            booking: "Clase",
            order: "Inscripción",
        },
        productCategories: [],
        serviceCategories: ["clase_particular", "capacitacion"],
    },

    tutoria: {
        id: "tutoria",
        label: "Tutoría",
        labelPlural: "Tutorías",
        icon: "📖",
        description: "Clases particulares y regularización",
        category: "education",
        features: {
            catalog: false,
            services: true,
            bookings: true,
            orders: false,
            inventory: false,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Agendar Clase",
            products: "Servicios",
            services: "Clases",
            booking: "Clase",
            order: "Paquete",
        },
        productCategories: [],
        serviceCategories: ["clase_particular"],
    },

    academia: {
        id: "academia",
        label: "Academia",
        labelPlural: "Academias",
        icon: "🎓",
        description: "Cursos y capacitación",
        category: "education",
        features: {
            catalog: true,
            services: true,
            bookings: true,
            orders: true,
            inventory: true,
            wholesale: false,
            repairs: false,
            rentals: false,
            tables: false,
            delivery: false,
        },
        labels: {
            cta: "Ver Cursos",
            products: "Materiales",
            services: "Cursos",
            booking: "Clase",
            order: "Inscripción",
        },
        productCategories: ["papeleria"],
        serviceCategories: ["capacitacion", "clase_particular"],
    },

    // ========== OTRO ==========
    otro: {
        id: "otro",
        label: "Otro Negocio",
        labelPlural: "Negocios",
        icon: "🏬",
        description: "Otro tipo de negocio",
        category: "other",
        features: {
            catalog: true,
            services: true,
            bookings: true,
            orders: true,
            inventory: true,
            wholesale: true,
            repairs: true,
            rentals: true,
            tables: false,
            delivery: true,
        },
        labels: {
            cta: "Contactar",
            products: "Productos",
            services: "Servicios",
            booking: "Cita",
            order: "Pedido",
        },
        productCategories: ["otros"],
        serviceCategories: ["otro_servicio"],
    },
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Obtiene la configuración de un tipo de negocio
 */
export function getBusinessTypeConfig(type: BusinessType): BusinessTypeConfig {
    return BUSINESS_TYPE_CONFIG[type] || BUSINESS_TYPE_CONFIG.otro;
}

/**
 * Obtiene todos los tipos de negocio agrupados por categoría
 */
export function getBusinessTypesByCategory(): Record<BusinessCategory, BusinessTypeConfig[]> {
    const grouped: Record<BusinessCategory, BusinessTypeConfig[]> = {
        beauty: [],
        health: [],
        retail: [],
        technology: [],
        automotive: [],
        food: [],
        home: [],
        professional: [],
        entertainment: [],
        education: [],
        other: [],
    };

    Object.values(BUSINESS_TYPE_CONFIG).forEach((config) => {
        grouped[config.category].push(config);
    });

    return grouped;
}

/**
 * Verifica si un tipo de negocio necesita el sistema de citas
 */
export function businessNeedsBookings(type: BusinessType): boolean {
    return BUSINESS_TYPE_CONFIG[type]?.features.bookings ?? false;
}

/**
 * Verifica si un tipo de negocio necesita catálogo de productos
 */
export function businessNeedsCatalog(type: BusinessType): boolean {
    return BUSINESS_TYPE_CONFIG[type]?.features.catalog ?? false;
}

/**
 * Obtiene los labels personalizados para un tipo de negocio
 */
export function getBusinessLabels(type: BusinessType): BusinessTypeConfig["labels"] {
    return BUSINESS_TYPE_CONFIG[type]?.labels ?? BUSINESS_TYPE_CONFIG.otro.labels;
}

/**
 * Obtiene las categorías de productos recomendadas para un tipo de negocio
 */
export function getRecommendedProductCategories(type: BusinessType): ProductCategoryType[] {
    return BUSINESS_TYPE_CONFIG[type]?.productCategories ?? [];
}

/**
 * Obtiene las categorías de servicios recomendadas para un tipo de negocio
 */
export function getRecommendedServiceCategories(type: BusinessType): ServiceCategoryType[] {
    return BUSINESS_TYPE_CONFIG[type]?.serviceCategories ?? [];
}
