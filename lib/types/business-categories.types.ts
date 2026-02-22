/**
 * Sistema de Categorías y Subcategorías de Negocios
 * Estructura jerárquica completa
 */

// ============================================
// CATEGORÍAS PRINCIPALES
// ============================================

export type BusinessCategory =
    | "food"           // Alimentos y Bebidas
    | "beauty"         // Belleza y Cuidado Personal
    | "health"         // Salud y Bienestar
    | "fitness"        // Fitness y Deportes
    | "pets"           // Mascotas
    | "fashion"        // Moda y Accesorios
    | "technology"     // Tecnología
    | "automotive"     // Automotriz
    | "home"           // Hogar y Construcción
    | "education"      // Educación
    | "entertainment"  // Entretenimiento
    | "media"          // Medios y Creativos
    | "professional"   // Servicios Profesionales
    | "travel"         // Viajes y Turismo
    | "eco"            // Ecológico
    | "gifts"          // Regalos y Especialidades
    | "industrial"     // Industrial/B2B
    | "ecommerce"      // E-commerce/Digital
    | "other";         // Otros

export const CATEGORY_INFO: Record<BusinessCategory, {
    label: string;
    icon: string;
    description: string;
}> = {
    food: { label: "Alimentos y Bebidas", icon: "🍽️", description: "Restaurantes, cafeterías, meal prep, catering" },
    beauty: { label: "Belleza y Cuidado Personal", icon: "💇", description: "Salones, spa, estética, maquillaje" },
    health: { label: "Salud y Bienestar", icon: "🏥", description: "Clínicas, consultorios, terapias, farmacias" },
    fitness: { label: "Fitness y Deportes", icon: "🏋️", description: "Gimnasios, yoga, artes marciales, nutrición" },
    pets: { label: "Mascotas", icon: "🐾", description: "Veterinarias, grooming, pet shops" },
    fashion: { label: "Moda y Accesorios", icon: "👗", description: "Ropa, calzado, joyería, sastrería" },
    technology: { label: "Tecnología", icon: "📱", description: "Celulares, computadoras, reparación, IT" },
    automotive: { label: "Automotriz", icon: "🚗", description: "Talleres, refaccionarias, autolavados, renta" },
    home: { label: "Hogar y Construcción", icon: "🏠", description: "Muebles, ferretería, servicios del hogar" },
    education: { label: "Educación", icon: "📚", description: "Escuelas, tutorías, cursos, guarderías" },
    entertainment: { label: "Entretenimiento", icon: "🎉", description: "Eventos, fiestas, vida nocturna" },
    media: { label: "Medios y Creativos", icon: "📷", description: "Fotografía, video, diseño, marketing" },
    professional: { label: "Servicios Profesionales", icon: "💼", description: "Legal, contable, inmobiliario, consultoría" },
    travel: { label: "Viajes y Turismo", icon: "✈️", description: "Agencias, hoteles, tours, transporte" },
    eco: { label: "Ecológico y Sustentable", icon: "🌱", description: "Productos orgánicos, energía solar" },
    gifts: { label: "Regalos y Especialidades", icon: "🎁", description: "Florerías, tiendas de regalos" },
    industrial: { label: "Industrial y B2B", icon: "🏭", description: "Manufactura, distribución, mayoreo" },
    ecommerce: { label: "E-commerce y Digital", icon: "📦", description: "Tiendas online, dropshipping, SaaS" },
    other: { label: "Otros", icon: "🏬", description: "Otros tipos de negocio" },
};

// ============================================
// SUBCATEGORÍAS
// ============================================

export type BusinessSubcategory =
    // Food
    | "restaurants" | "beverages" | "meal_prep_catering" | "food_retail"
    // Beauty
    | "hair" | "nails" | "body_spa" | "facial" | "makeup"
    // Health
    | "general_medicine" | "specialties" | "dental" | "vision" | "mental" | "alternative" | "rehab" | "lab" | "pharmacy"
    // Fitness
    | "gyms" | "training" | "martial_arts" | "mind_body" | "sports" | "sports_nutrition"
    // Pets
    | "pet_health" | "pet_grooming" | "pet_services" | "pet_shops"
    // Fashion
    | "clothing" | "footwear" | "accessories" | "fashion_services"
    // Technology
    | "tech_sales" | "tech_repair" | "tech_services"
    // Automotive
    | "vehicle_sales" | "vehicle_repair" | "auto_parts" | "car_wash" | "mobility"
    // Home
    | "furniture" | "hardware" | "appliances" | "home_services" | "design"
    // Education
    | "languages" | "academic" | "arts" | "tech_courses" | "trades" | "personal_dev" | "childcare"
    // Entertainment
    | "events" | "recreation" | "nightlife"
    // Media
    | "photography" | "video" | "design_services" | "marketing"
    // Professional
    | "legal" | "accounting" | "insurance_finance" | "real_estate" | "consulting"
    // Travel
    | "travel_agencies" | "lodging" | "transport" | "experiences"
    // Other
    | "other_sub";

export const SUBCATEGORY_INFO: Record<BusinessSubcategory, {
    label: string;
    category: BusinessCategory;
}> = {
    // Food
    restaurants: { label: "Restaurantes y Comida", category: "food" },
    beverages: { label: "Bebidas", category: "food" },
    meal_prep_catering: { label: "Meal Prep y Catering", category: "food" },
    food_retail: { label: "Venta de Alimentos", category: "food" },
    // Beauty
    hair: { label: "Cabello", category: "beauty" },
    nails: { label: "Uñas", category: "beauty" },
    body_spa: { label: "Cuerpo y Spa", category: "beauty" },
    facial: { label: "Estética Facial", category: "beauty" },
    makeup: { label: "Maquillaje", category: "beauty" },
    // Health
    general_medicine: { label: "Medicina General", category: "health" },
    specialties: { label: "Especialidades Médicas", category: "health" },
    dental: { label: "Salud Dental", category: "health" },
    vision: { label: "Salud Visual", category: "health" },
    mental: { label: "Salud Mental", category: "health" },
    alternative: { label: "Terapias Alternativas", category: "health" },
    rehab: { label: "Rehabilitación", category: "health" },
    lab: { label: "Laboratorio", category: "health" },
    pharmacy: { label: "Farmacia", category: "health" },
    // Fitness
    gyms: { label: "Gimnasios", category: "fitness" },
    training: { label: "Entrenamiento", category: "fitness" },
    martial_arts: { label: "Artes Marciales", category: "fitness" },
    mind_body: { label: "Mente y Cuerpo", category: "fitness" },
    sports: { label: "Deportes", category: "fitness" },
    sports_nutrition: { label: "Nutrición Deportiva", category: "fitness" },
    // Pets
    pet_health: { label: "Salud Animal", category: "pets" },
    pet_grooming: { label: "Estética", category: "pets" },
    pet_services: { label: "Servicios", category: "pets" },
    pet_shops: { label: "Tiendas", category: "pets" },
    // Fashion
    clothing: { label: "Ropa", category: "fashion" },
    footwear: { label: "Calzado", category: "fashion" },
    accessories: { label: "Accesorios", category: "fashion" },
    fashion_services: { label: "Servicios de Moda", category: "fashion" },
    // Technology
    tech_sales: { label: "Venta de Dispositivos", category: "technology" },
    tech_repair: { label: "Reparación", category: "technology" },
    tech_services: { label: "Servicios IT", category: "technology" },
    // Automotive
    vehicle_sales: { label: "Venta de Vehículos", category: "automotive" },
    vehicle_repair: { label: "Reparación", category: "automotive" },
    auto_parts: { label: "Refacciones", category: "automotive" },
    car_wash: { label: "Lavado y Estética", category: "automotive" },
    mobility: { label: "Movilidad", category: "automotive" },
    // Home
    furniture: { label: "Muebles y Decoración", category: "home" },
    hardware: { label: "Ferretería", category: "home" },
    appliances: { label: "Electrodomésticos", category: "home" },
    home_services: { label: "Servicios del Hogar", category: "home" },
    design: { label: "Diseño y Remodelación", category: "home" },
    // Education
    languages: { label: "Idiomas", category: "education" },
    academic: { label: "Académico", category: "education" },
    arts: { label: "Artes", category: "education" },
    tech_courses: { label: "Tecnología", category: "education" },
    trades: { label: "Oficios", category: "education" },
    personal_dev: { label: "Desarrollo Personal", category: "education" },
    childcare: { label: "Cuidado Infantil", category: "education" },
    // Entertainment
    events: { label: "Eventos", category: "entertainment" },
    recreation: { label: "Recreación", category: "entertainment" },
    nightlife: { label: "Vida Nocturna", category: "entertainment" },
    // Media
    photography: { label: "Fotografía", category: "media" },
    video: { label: "Video", category: "media" },
    design_services: { label: "Diseño", category: "media" },
    marketing: { label: "Marketing", category: "media" },
    // Professional
    legal: { label: "Legal", category: "professional" },
    accounting: { label: "Contabilidad", category: "professional" },
    insurance_finance: { label: "Seguros y Finanzas", category: "professional" },
    real_estate: { label: "Inmobiliario", category: "professional" },
    consulting: { label: "Consultoría", category: "professional" },
    // Travel
    travel_agencies: { label: "Agencias", category: "travel" },
    lodging: { label: "Hospedaje", category: "travel" },
    transport: { label: "Transporte", category: "travel" },
    experiences: { label: "Experiencias", category: "travel" },
    // Other
    other_sub: { label: "Otros", category: "other" },
};
