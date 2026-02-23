/**
 * Sistema completo de tipos de negocio v2
 * Con categorías, subcategorías y features
 */

import { BusinessCategory, BusinessSubcategory, CATEGORY_INFO, SUBCATEGORY_INFO } from "./business-categories.types";

// ============================================
// TIPO DE NEGOCIO
// ============================================

export interface BusinessTypeConfig {
    id: string;
    label: string;
    icon: string;
    category: BusinessCategory;
    subcategory: BusinessSubcategory;
    keywords: string[]; // Para búsqueda
    features: {
        catalog: boolean;
        services: boolean;
        bookings: boolean;
        orders: boolean;
        inventory: boolean;
        wholesale: boolean;
        repairs: boolean;
        rentals: boolean;
        tables: boolean;
        delivery: boolean;
    };
    labels: {
        cta: string;
        products: string;
        services: string;
    };
}

// Features presets para reutilizar
const F = {
    // Solo catálogo y pedidos (retail básico)
    retail: { catalog: true, services: false, bookings: false, orders: true, inventory: true, wholesale: true, repairs: false, rentals: false, tables: false, delivery: true },
    // Servicios con citas (belleza, salud)
    service: { catalog: true, services: true, bookings: true, orders: false, inventory: true, wholesale: false, repairs: false, rentals: false, tables: false, delivery: false },
    // Restaurante con mesas
    restaurant: { catalog: true, services: false, bookings: true, orders: true, inventory: true, wholesale: false, repairs: false, rentals: false, tables: true, delivery: true },
    // Comida sin mesas
    food: { catalog: true, services: false, bookings: false, orders: true, inventory: true, wholesale: false, repairs: false, rentals: false, tables: false, delivery: true },
    // Reparación
    repair: { catalog: true, services: true, bookings: true, orders: true, inventory: true, wholesale: true, repairs: true, rentals: false, tables: false, delivery: true },
    // Renta
    rental: { catalog: true, services: false, bookings: true, orders: false, inventory: true, wholesale: false, repairs: false, rentals: true, tables: false, delivery: true },
    // Solo servicios (consultorías)
    consultancy: { catalog: false, services: true, bookings: true, orders: false, inventory: false, wholesale: false, repairs: false, rentals: false, tables: false, delivery: false },
    // Todo habilitado
    all: { catalog: true, services: true, bookings: true, orders: true, inventory: true, wholesale: true, repairs: true, rentals: true, tables: false, delivery: true },
};

// ============================================
// TODOS LOS TIPOS DE NEGOCIO
// ============================================

export const BUSINESS_TYPES: BusinessTypeConfig[] = [
    // ========== FOOD - RESTAURANTS ==========
    { id: "restaurante", label: "Restaurante", icon: "🍽️", category: "food", subcategory: "restaurants", keywords: ["comida", "restaurant", "cocina"], features: F.restaurant, labels: { cta: "Ver Menú", products: "Platillos", services: "Servicios" } },
    { id: "restaurante_gourmet", label: "Restaurante Gourmet", icon: "🍷", category: "food", subcategory: "restaurants", keywords: ["fine dining", "gourmet", "elegante"], features: F.restaurant, labels: { cta: "Reservar Mesa", products: "Menú", services: "Servicios" } },
    { id: "comida_rapida", label: "Comida Rápida", icon: "🍔", category: "food", subcategory: "restaurants", keywords: ["fast food", "hamburguesas", "rapido"], features: F.food, labels: { cta: "Ordenar", products: "Menú", services: "Servicios" } },
    { id: "food_truck", label: "Food Truck", icon: "🚚", category: "food", subcategory: "restaurants", keywords: ["camion", "movil", "street food"], features: F.food, labels: { cta: "Ver Menú", products: "Platillos", services: "Servicios" } },
    { id: "cafeteria", label: "Cafetería", icon: "☕", category: "food", subcategory: "restaurants", keywords: ["cafe", "coffee", "desayuno"], features: { ...F.restaurant, tables: true }, labels: { cta: "Ver Menú", products: "Productos", services: "Servicios" } },
    { id: "panaderia", label: "Panadería", icon: "🥖", category: "food", subcategory: "restaurants", keywords: ["pan", "bakery", "bolillo"], features: F.food, labels: { cta: "Ver Productos", products: "Pan", services: "Servicios" } },
    { id: "pasteleria", label: "Pastelería", icon: "🎂", category: "food", subcategory: "restaurants", keywords: ["pasteles", "postres", "tortas", "cake"], features: { ...F.food, services: true }, labels: { cta: "Ver Catálogo", products: "Pasteles", services: "Servicios" } },
    { id: "heladeria", label: "Heladería", icon: "🍦", category: "food", subcategory: "restaurants", keywords: ["helados", "ice cream", "nieve"], features: F.food, labels: { cta: "Ver Sabores", products: "Helados", services: "Servicios" } },
    { id: "pizzeria", label: "Pizzería", icon: "🍕", category: "food", subcategory: "restaurants", keywords: ["pizza", "italiana"], features: F.restaurant, labels: { cta: "Ordenar Pizza", products: "Pizzas", services: "Servicios" } },
    { id: "taqueria", label: "Taquería", icon: "🌮", category: "food", subcategory: "restaurants", keywords: ["tacos", "mexicana", "antojitos"], features: F.food, labels: { cta: "Ver Menú", products: "Tacos", services: "Servicios" } },
    { id: "marisqueria", label: "Marisquería", icon: "🦐", category: "food", subcategory: "restaurants", keywords: ["mariscos", "pescado", "seafood"], features: F.restaurant, labels: { cta: "Ver Menú", products: "Mariscos", services: "Servicios" } },
    { id: "sushi", label: "Sushi Bar", icon: "🍣", category: "food", subcategory: "restaurants", keywords: ["sushi", "japones", "rolls"], features: F.restaurant, labels: { cta: "Ver Menú", products: "Rolls", services: "Servicios" } },
    { id: "buffet", label: "Buffet", icon: "🍱", category: "food", subcategory: "restaurants", keywords: ["buffet", "todo incluido"], features: F.restaurant, labels: { cta: "Ver Opciones", products: "Menú", services: "Servicios" } },
    { id: "comida_vegana", label: "Comida Vegana/Vegetariana", icon: "🥗", category: "food", subcategory: "restaurants", keywords: ["vegano", "vegetariano", "plant based", "saludable"], features: F.restaurant, labels: { cta: "Ver Menú", products: "Platillos", services: "Servicios" } },

    // ========== FOOD - BEVERAGES ==========
    { id: "bar", label: "Bar", icon: "🍸", category: "food", subcategory: "beverages", keywords: ["bar", "cocktails", "bebidas"], features: { ...F.restaurant, delivery: false }, labels: { cta: "Ver Carta", products: "Bebidas", services: "Servicios" } },
    { id: "cantina", label: "Cantina", icon: "🍺", category: "food", subcategory: "beverages", keywords: ["cantina", "cerveza", "botanas"], features: { ...F.restaurant, delivery: false }, labels: { cta: "Ver Carta", products: "Bebidas", services: "Servicios" } },
    { id: "cerveceria", label: "Cervecería Artesanal", icon: "🍻", category: "food", subcategory: "beverages", keywords: ["cerveza artesanal", "craft beer", "brewery"], features: F.restaurant, labels: { cta: "Ver Cervezas", products: "Cervezas", services: "Servicios" } },
    { id: "wine_bar", label: "Wine Bar", icon: "🍷", category: "food", subcategory: "beverages", keywords: ["vino", "wine", "cata"], features: F.restaurant, labels: { cta: "Ver Carta", products: "Vinos", services: "Servicios" } },
    { id: "jugueria", label: "Jugería", icon: "🧃", category: "food", subcategory: "beverages", keywords: ["jugos", "juice", "smoothie"], features: F.food, labels: { cta: "Ver Menú", products: "Jugos", services: "Servicios" } },
    { id: "boba_tea", label: "Boba Tea / Bubble Tea", icon: "🧋", category: "food", subcategory: "beverages", keywords: ["boba", "bubble tea", "te de perlas"], features: F.food, labels: { cta: "Ordenar", products: "Bebidas", services: "Servicios" } },

    // ========== FOOD - MEAL PREP ==========
    { id: "meal_prep", label: "Meal Prep", icon: "🥗", category: "food", subcategory: "meal_prep_catering", keywords: ["meal prep", "comida fitness", "preparacion"], features: { ...F.food, services: true, bookings: true, inventory: false }, labels: { cta: "Ver Paquetes", products: "Paquetes", services: "Planes" } },
    { id: "cloud_kitchen", label: "Cloud Kitchen / Dark Kitchen", icon: "👨‍🍳", category: "food", subcategory: "meal_prep_catering", keywords: ["cloud kitchen", "dark kitchen", "cocina fantasma"], features: F.food, labels: { cta: "Ordenar", products: "Menú", services: "Servicios" } },
    { id: "catering", label: "Catering", icon: "🍴", category: "food", subcategory: "meal_prep_catering", keywords: ["catering", "banquetes", "eventos"], features: { ...F.food, services: true, bookings: true }, labels: { cta: "Cotizar", products: "Menús", services: "Servicios" } },
    { id: "chef_privado", label: "Chef Privado", icon: "👨‍🍳", category: "food", subcategory: "meal_prep_catering", keywords: ["chef", "privado", "domicilio"], features: F.consultancy, labels: { cta: "Reservar", products: "Menús", services: "Servicios" } },
    { id: "loncheras", label: "Loncheras / Box Lunch", icon: "🍱", category: "food", subcategory: "meal_prep_catering", keywords: ["lonchera", "lunch", "oficina", "empresarial"], features: F.food, labels: { cta: "Ordenar", products: "Loncheras", services: "Servicios" } },

    // ========== FOOD - RETAIL ==========
    { id: "carniceria", label: "Carnicería", icon: "🥩", category: "food", subcategory: "food_retail", keywords: ["carne", "res", "carnes"], features: F.retail, labels: { cta: "Ver Productos", products: "Carnes", services: "Servicios" } },
    { id: "pescaderia", label: "Pescadería", icon: "🐟", category: "food", subcategory: "food_retail", keywords: ["pescado", "mariscos", "fresco"], features: F.retail, labels: { cta: "Ver Productos", products: "Pescados", services: "Servicios" } },
    { id: "verduleria", label: "Verdulería / Frutería", icon: "🥬", category: "food", subcategory: "food_retail", keywords: ["verduras", "frutas", "vegetales"], features: F.retail, labels: { cta: "Ver Productos", products: "Productos", services: "Servicios" } },
    { id: "tortilleria", label: "Tortillería", icon: "🫓", category: "food", subcategory: "food_retail", keywords: ["tortillas", "maiz", "harina"], features: F.retail, labels: { cta: "Ver Productos", products: "Productos", services: "Servicios" } },
    { id: "abarrotes", label: "Abarrotes / Mini Super", icon: "🏪", category: "food", subcategory: "food_retail", keywords: ["abarrotes", "tienda", "minisuper"], features: F.retail, labels: { cta: "Ver Productos", products: "Productos", services: "Servicios" } },
    { id: "licoreria", label: "Licorería / Vinatería", icon: "🍾", category: "food", subcategory: "food_retail", keywords: ["licor", "vinos", "bebidas"], features: F.retail, labels: { cta: "Ver Catálogo", products: "Bebidas", services: "Servicios" } },
    { id: "dulceria", label: "Dulcería", icon: "🍬", category: "food", subcategory: "food_retail", keywords: ["dulces", "candy", "golosinas"], features: F.retail, labels: { cta: "Ver Productos", products: "Dulces", services: "Servicios" } },
    { id: "tienda_organica", label: "Tienda Orgánica", icon: "🌿", category: "food", subcategory: "food_retail", keywords: ["organico", "natural", "saludable"], features: F.retail, labels: { cta: "Ver Productos", products: "Productos", services: "Servicios" } },

    // ========== BEAUTY - HAIR ==========
    { id: "salon_belleza", label: "Salón de Belleza", icon: "💇‍♀️", category: "beauty", subcategory: "hair", keywords: ["salon", "belleza", "cabello", "corte"], features: F.service, labels: { cta: "Reservar Cita", products: "Productos", services: "Servicios" } },
    { id: "barberia", label: "Barbería", icon: "💈", category: "beauty", subcategory: "hair", keywords: ["barber", "barberia", "corte hombre"], features: F.service, labels: { cta: "Reservar Turno", products: "Productos", services: "Servicios" } },
    { id: "estilista", label: "Estilista Independiente", icon: "✂️", category: "beauty", subcategory: "hair", keywords: ["estilista", "freelance", "domicilio"], features: F.service, labels: { cta: "Reservar", products: "Productos", services: "Servicios" } },
    { id: "colorista", label: "Colorista / Colorimetría", icon: "🎨", category: "beauty", subcategory: "hair", keywords: ["color", "tinte", "colorimetria"], features: F.service, labels: { cta: "Reservar", products: "Productos", services: "Servicios" } },

    // ========== BEAUTY - NAILS ==========
    { id: "nail_salon", label: "Salón de Uñas", icon: "💅", category: "beauty", subcategory: "nails", keywords: ["uñas", "nails", "manicure"], features: F.service, labels: { cta: "Reservar Cita", products: "Productos", services: "Servicios" } },
    { id: "unas_acrilicas", label: "Uñas Acrílicas", icon: "💅", category: "beauty", subcategory: "nails", keywords: ["acrilicas", "esculpidas"], features: F.service, labels: { cta: "Reservar", products: "Productos", services: "Servicios" } },
    { id: "nail_art", label: "Nail Art", icon: "🎨", category: "beauty", subcategory: "nails", keywords: ["nail art", "diseño uñas"], features: F.service, labels: { cta: "Reservar", products: "Productos", services: "Diseños" } },

    // ========== BEAUTY - SPA ==========
    { id: "spa", label: "Spa", icon: "🧖", category: "beauty", subcategory: "body_spa", keywords: ["spa", "relajacion", "masaje"], features: F.service, labels: { cta: "Reservar Sesión", products: "Productos", services: "Tratamientos" } },
    { id: "masajes", label: "Centro de Masajes", icon: "💆", category: "beauty", subcategory: "body_spa", keywords: ["masaje", "relajante", "terapeutico"], features: F.service, labels: { cta: "Reservar", products: "Productos", services: "Masajes" } },
    { id: "depilacion", label: "Centro de Depilación", icon: "✨", category: "beauty", subcategory: "body_spa", keywords: ["depilacion", "laser", "cera"], features: F.service, labels: { cta: "Reservar", products: "Productos", services: "Servicios" } },
    { id: "bronceado", label: "Centro de Bronceado", icon: "☀️", category: "beauty", subcategory: "body_spa", keywords: ["bronceado", "tanning", "spray tan"], features: F.service, labels: { cta: "Reservar", products: "Productos", services: "Servicios" } },

    // ========== BEAUTY - FACIAL ==========
    { id: "estetica_facial", label: "Estética Facial", icon: "🧴", category: "beauty", subcategory: "facial", keywords: ["facial", "limpieza", "skincare"], features: F.service, labels: { cta: "Reservar", products: "Productos", services: "Tratamientos" } },
    { id: "microblading", label: "Microblading", icon: "✏️", category: "beauty", subcategory: "facial", keywords: ["microblading", "cejas", "permanente"], features: F.service, labels: { cta: "Reservar", products: "Productos", services: "Servicios" } },
    { id: "extensiones_pestanas", label: "Extensiones de Pestañas", icon: "👁️", category: "beauty", subcategory: "facial", keywords: ["pestañas", "extensiones", "lashes"], features: F.service, labels: { cta: "Reservar", products: "Productos", services: "Servicios" } },

    // ========== BEAUTY - MAKEUP ==========
    { id: "maquillista", label: "Maquillista Profesional", icon: "💄", category: "beauty", subcategory: "makeup", keywords: ["maquillaje", "makeup", "novia"], features: F.service, labels: { cta: "Reservar", products: "Productos", services: "Servicios" } },

    // ========== HEALTH - GENERAL ==========
    { id: "consultorio_medico", label: "Consultorio Médico", icon: "🏥", category: "health", subcategory: "general_medicine", keywords: ["medico", "doctor", "consulta"], features: F.consultancy, labels: { cta: "Agendar Cita", products: "Servicios", services: "Consultas" } },
    { id: "clinica", label: "Clínica General", icon: "🏥", category: "health", subcategory: "general_medicine", keywords: ["clinica", "salud", "medico"], features: F.consultancy, labels: { cta: "Agendar Cita", products: "Servicios", services: "Consultas" } },
    { id: "telemedicina", label: "Telemedicina", icon: "💻", category: "health", subcategory: "general_medicine", keywords: ["telemedicina", "online", "virtual"], features: F.consultancy, labels: { cta: "Agendar Consulta", products: "Servicios", services: "Consultas" } },

    // ========== HEALTH - DENTAL ==========
    { id: "clinica_dental", label: "Clínica Dental", icon: "🦷", category: "health", subcategory: "dental", keywords: ["dental", "dentista", "odontologia"], features: F.consultancy, labels: { cta: "Agendar Cita", products: "Servicios", services: "Tratamientos" } },
    { id: "ortodoncia", label: "Ortodoncia", icon: "😁", category: "health", subcategory: "dental", keywords: ["brackets", "ortodoncia", "alineadores"], features: F.consultancy, labels: { cta: "Agendar Cita", products: "Servicios", services: "Tratamientos" } },

    // ========== HEALTH - VISION ==========
    { id: "optica", label: "Óptica", icon: "👓", category: "health", subcategory: "vision", keywords: ["lentes", "optica", "vision"], features: { ...F.retail, services: true, bookings: true }, labels: { cta: "Ver Catálogo", products: "Lentes", services: "Servicios" } },

    // ========== HEALTH - MENTAL ==========
    { id: "psicologia", label: "Psicología", icon: "🧠", category: "health", subcategory: "mental", keywords: ["psicologo", "terapia", "mental"], features: F.consultancy, labels: { cta: "Agendar Sesión", products: "Servicios", services: "Terapias" } },
    { id: "coaching", label: "Coaching de Vida", icon: "🎯", category: "health", subcategory: "mental", keywords: ["coach", "vida", "metas"], features: F.consultancy, labels: { cta: "Agendar Sesión", products: "Servicios", services: "Sesiones" } },

    // ========== HEALTH - PHARMACY ==========
    { id: "farmacia", label: "Farmacia", icon: "💊", category: "health", subcategory: "pharmacy", keywords: ["farmacia", "medicamentos", "drogueria"], features: F.retail, labels: { cta: "Ver Productos", products: "Medicamentos", services: "Servicios" } },

    // ========== HEALTH - REHAB ==========
    { id: "fisioterapia", label: "Fisioterapia", icon: "🏃", category: "health", subcategory: "rehab", keywords: ["fisio", "rehabilitacion", "terapia fisica"], features: F.service, labels: { cta: "Agendar Cita", products: "Productos", services: "Terapias" } },

    // ========== HEALTH - LAB ==========
    { id: "laboratorio", label: "Laboratorio Clínico", icon: "🔬", category: "health", subcategory: "lab", keywords: ["laboratorio", "analisis", "sangre"], features: F.consultancy, labels: { cta: "Agendar Cita", products: "Estudios", services: "Análisis" } },

    // ========== HEALTH - ALTERNATIVE ==========
    { id: "acupuntura", label: "Acupuntura", icon: "📍", category: "health", subcategory: "alternative", keywords: ["acupuntura", "alternativa", "china"], features: F.service, labels: { cta: "Agendar Cita", products: "Productos", services: "Tratamientos" } },
    { id: "quiropractico", label: "Quiropráctico", icon: "🦴", category: "health", subcategory: "alternative", keywords: ["quiropractico", "espalda", "columna"], features: F.service, labels: { cta: "Agendar Cita", products: "Productos", services: "Tratamientos" } },

    // ========== FITNESS - GYMS ==========
    { id: "gimnasio", label: "Gimnasio", icon: "💪", category: "fitness", subcategory: "gyms", keywords: ["gimnasio", "gym", "pesas"], features: { ...F.service, orders: true }, labels: { cta: "Ver Membresías", products: "Productos", services: "Clases" } },
    { id: "crossfit", label: "CrossFit Box", icon: "🏋️", category: "fitness", subcategory: "gyms", keywords: ["crossfit", "box", "funcional"], features: F.service, labels: { cta: "Ver Clases", products: "Productos", services: "WODs" } },

    // ========== FITNESS - TRAINING ==========
    { id: "entrenador_personal", label: "Entrenador Personal", icon: "🏃", category: "fitness", subcategory: "training", keywords: ["personal trainer", "entrenador", "fitness"], features: F.consultancy, labels: { cta: "Contratar", products: "Planes", services: "Entrenamientos" } },

    // ========== FITNESS - MIND BODY ==========
    { id: "yoga", label: "Estudio de Yoga", icon: "🧘", category: "fitness", subcategory: "mind_body", keywords: ["yoga", "meditacion", "zen"], features: F.service, labels: { cta: "Ver Clases", products: "Productos", services: "Clases" } },
    { id: "pilates", label: "Estudio de Pilates", icon: "🤸", category: "fitness", subcategory: "mind_body", keywords: ["pilates", "reformer", "mat"], features: F.service, labels: { cta: "Ver Clases", products: "Productos", services: "Clases" } },

    // ========== FITNESS - MARTIAL ARTS ==========
    { id: "artes_marciales", label: "Academia de Artes Marciales", icon: "🥋", category: "fitness", subcategory: "martial_arts", keywords: ["karate", "taekwondo", "judo"], features: F.service, labels: { cta: "Inscribirse", products: "Equipo", services: "Clases" } },
    { id: "boxeo", label: "Box / Kickboxing", icon: "🥊", category: "fitness", subcategory: "martial_arts", keywords: ["box", "boxeo", "kickboxing"], features: F.service, labels: { cta: "Ver Clases", products: "Equipo", services: "Clases" } },

    // ========== PETS ==========
    { id: "veterinaria", label: "Veterinaria", icon: "🐾", category: "pets", subcategory: "pet_health", keywords: ["veterinario", "mascotas", "animales"], features: { ...F.service, orders: true, delivery: true }, labels: { cta: "Agendar Cita", products: "Productos", services: "Servicios" } },
    { id: "grooming", label: "Grooming / Peluquería Canina", icon: "🐕", category: "pets", subcategory: "pet_grooming", keywords: ["grooming", "peluqueria canina", "baño"], features: F.service, labels: { cta: "Reservar", products: "Productos", services: "Servicios" } },
    { id: "pet_shop", label: "Pet Shop", icon: "🦴", category: "pets", subcategory: "pet_shops", keywords: ["mascotas", "pet shop", "accesorios"], features: F.retail, labels: { cta: "Ver Productos", products: "Productos", services: "Servicios" } },
    { id: "guarderia_mascotas", label: "Guardería de Mascotas", icon: "🏠", category: "pets", subcategory: "pet_services", keywords: ["guarderia", "hotel mascotas", "cuidado"], features: { ...F.service, rentals: true }, labels: { cta: "Reservar", products: "Servicios", services: "Hospedaje" } },
    { id: "entrenamiento_canino", label: "Entrenamiento Canino", icon: "🐕‍🦺", category: "pets", subcategory: "pet_services", keywords: ["entrenamiento", "adiestramiento", "perros"], features: F.service, labels: { cta: "Contratar", products: "Paquetes", services: "Entrenamientos" } },

    // ========== FASHION ==========
    { id: "boutique", label: "Boutique", icon: "👗", category: "fashion", subcategory: "clothing", keywords: ["ropa", "boutique", "moda"], features: F.retail, labels: { cta: "Ver Catálogo", products: "Prendas", services: "Servicios" } },
    { id: "tienda_ropa", label: "Tienda de Ropa", icon: "👕", category: "fashion", subcategory: "clothing", keywords: ["ropa", "tienda", "moda"], features: F.retail, labels: { cta: "Ver Catálogo", products: "Ropa", services: "Servicios" } },
    { id: "ropa_deportiva", label: "Ropa Deportiva", icon: "🏃", category: "fashion", subcategory: "clothing", keywords: ["deportiva", "athletic", "sport"], features: F.retail, labels: { cta: "Ver Catálogo", products: "Ropa", services: "Servicios" } },
    { id: "zapateria", label: "Zapatería", icon: "👟", category: "fashion", subcategory: "footwear", keywords: ["zapatos", "calzado", "tennis"], features: F.retail, labels: { cta: "Ver Catálogo", products: "Calzado", services: "Servicios" } },
    { id: "joyeria", label: "Joyería", icon: "💍", category: "fashion", subcategory: "accessories", keywords: ["joyas", "oro", "plata"], features: { ...F.retail, repairs: true }, labels: { cta: "Ver Colección", products: "Joyas", services: "Servicios" } },
    { id: "relojeria", label: "Relojería", icon: "⌚", category: "fashion", subcategory: "accessories", keywords: ["relojes", "watch", "tiempo"], features: { ...F.retail, repairs: true }, labels: { cta: "Ver Catálogo", products: "Relojes", services: "Servicios" } },
    { id: "sastreria", label: "Sastrería", icon: "🧵", category: "fashion", subcategory: "fashion_services", keywords: ["sastre", "trajes", "arreglos"], features: F.service, labels: { cta: "Agendar Cita", products: "Servicios", services: "Arreglos" } },

    // ========== TECHNOLOGY ==========
    { id: "celulares", label: "Tienda de Celulares", icon: "📱", category: "technology", subcategory: "tech_sales", keywords: ["celulares", "telefonos", "moviles"], features: F.repair, labels: { cta: "Ver Catálogo", products: "Celulares", services: "Reparaciones" } },
    { id: "computadoras", label: "Tienda de Computadoras", icon: "💻", category: "technology", subcategory: "tech_sales", keywords: ["computadoras", "laptops", "pc"], features: F.repair, labels: { cta: "Ver Catálogo", products: "Equipos", services: "Servicios" } },
    { id: "gaming", label: "Tienda Gaming", icon: "🎮", category: "technology", subcategory: "tech_sales", keywords: ["gaming", "videojuegos", "consolas"], features: F.retail, labels: { cta: "Ver Catálogo", products: "Productos", services: "Servicios" } },
    { id: "reparacion_celulares", label: "Reparación de Celulares", icon: "🔧", category: "technology", subcategory: "tech_repair", keywords: ["reparacion", "pantalla", "celular"], features: F.repair, labels: { cta: "Ver Servicios", products: "Refacciones", services: "Reparaciones" } },
    { id: "soporte_it", label: "Soporte Técnico / IT", icon: "🖥️", category: "technology", subcategory: "tech_services", keywords: ["soporte", "it", "tecnico"], features: F.consultancy, labels: { cta: "Contratar", products: "Servicios", services: "Soporte" } },

    // ========== AUTOMOTIVE ==========
    { id: "taller_mecanico", label: "Taller Mecánico", icon: "🔧", category: "automotive", subcategory: "vehicle_repair", keywords: ["mecanico", "taller", "auto"], features: { ...F.repair, bookings: true }, labels: { cta: "Agendar Servicio", products: "Refacciones", services: "Servicios" } },
    { id: "autolavado", label: "Autolavado", icon: "🚗", category: "automotive", subcategory: "car_wash", keywords: ["lavado", "auto", "detailing"], features: F.service, labels: { cta: "Ver Servicios", products: "Productos", services: "Lavados" } },
    { id: "refaccionaria", label: "Refaccionaria", icon: "⚙️", category: "automotive", subcategory: "auto_parts", keywords: ["refacciones", "autopartes", "piezas"], features: F.retail, labels: { cta: "Ver Catálogo", products: "Refacciones", services: "Servicios" } },
    { id: "llantera", label: "Llantera", icon: "🛞", category: "automotive", subcategory: "auto_parts", keywords: ["llantas", "neumaticos", "rines"], features: { ...F.retail, services: true }, labels: { cta: "Ver Catálogo", products: "Llantas", services: "Servicios" } },
    { id: "rent_a_car", label: "Renta de Autos", icon: "🚙", category: "automotive", subcategory: "mobility", keywords: ["renta", "alquiler", "auto"], features: F.rental, labels: { cta: "Reservar", products: "Vehículos", services: "Servicios" } },

    // ========== HOME ==========
    { id: "muebleria", label: "Mueblería", icon: "🛋️", category: "home", subcategory: "furniture", keywords: ["muebles", "sala", "recamara"], features: { ...F.retail, services: true }, labels: { cta: "Ver Catálogo", products: "Muebles", services: "Servicios" } },
    { id: "decoracion", label: "Tienda de Decoración", icon: "🏠", category: "home", subcategory: "furniture", keywords: ["decoracion", "hogar", "interiores"], features: F.retail, labels: { cta: "Ver Catálogo", products: "Artículos", services: "Servicios" } },
    { id: "ferreteria", label: "Ferretería", icon: "🔨", category: "home", subcategory: "hardware", keywords: ["ferreteria", "herramientas", "construccion"], features: { ...F.retail, rentals: true }, labels: { cta: "Ver Catálogo", products: "Productos", services: "Servicios" } },
    { id: "electrodomesticos", label: "Electrodomésticos", icon: "🧊", category: "home", subcategory: "appliances", keywords: ["electrodomesticos", "linea blanca", "refrigerador"], features: { ...F.retail, repairs: true, services: true }, labels: { cta: "Ver Catálogo", products: "Productos", services: "Servicios" } },
    { id: "plomero", label: "Plomero", icon: "🔧", category: "home", subcategory: "home_services", keywords: ["plomero", "tuberia", "agua"], features: F.consultancy, labels: { cta: "Solicitar Servicio", products: "Servicios", services: "Trabajos" } },
    { id: "electricista", label: "Electricista", icon: "⚡", category: "home", subcategory: "home_services", keywords: ["electricista", "luz", "instalacion"], features: F.consultancy, labels: { cta: "Solicitar Servicio", products: "Servicios", services: "Trabajos" } },
    { id: "cerrajero", label: "Cerrajero", icon: "🔑", category: "home", subcategory: "home_services", keywords: ["cerrajero", "llaves", "cerraduras"], features: F.consultancy, labels: { cta: "Solicitar Servicio", products: "Servicios", services: "Trabajos" } },
    { id: "diseno_interiores", label: "Diseño de Interiores", icon: "🎨", category: "home", subcategory: "design", keywords: ["interiores", "diseño", "decoracion"], features: F.consultancy, labels: { cta: "Agendar Consulta", products: "Proyectos", services: "Diseño" } },

    // ========== EDUCATION ==========
    { id: "escuela_idiomas", label: "Escuela de Idiomas", icon: "🌍", category: "education", subcategory: "languages", keywords: ["ingles", "idiomas", "clases"], features: F.service, labels: { cta: "Inscribirse", products: "Cursos", services: "Clases" } },
    { id: "tutoria", label: "Tutoría / Clases Particulares", icon: "📖", category: "education", subcategory: "academic", keywords: ["tutoria", "clases", "regularizacion"], features: F.consultancy, labels: { cta: "Agendar Clase", products: "Materias", services: "Clases" } },
    { id: "escuela_musica", label: "Escuela de Música", icon: "🎵", category: "education", subcategory: "arts", keywords: ["musica", "piano", "guitarra"], features: F.service, labels: { cta: "Inscribirse", products: "Instrumentos", services: "Clases" } },
    { id: "escuela_baile", label: "Escuela de Baile", icon: "💃", category: "education", subcategory: "arts", keywords: ["baile", "danza", "salsa"], features: F.service, labels: { cta: "Inscribirse", products: "Clases", services: "Estilos" } },
    { id: "guarderia", label: "Guardería", icon: "👶", category: "education", subcategory: "childcare", keywords: ["guarderia", "niños", "cuidado"], features: F.service, labels: { cta: "Inscribir", products: "Servicios", services: "Programas" } },
    { id: "cursos_online", label: "Cursos Online", icon: "💻", category: "education", subcategory: "tech_courses", keywords: ["online", "cursos", "digital"], features: { ...F.consultancy, catalog: true, orders: true }, labels: { cta: "Ver Cursos", products: "Cursos", services: "Clases" } },

    // ========== ENTERTAINMENT ==========
    { id: "salon_eventos", label: "Salón de Eventos", icon: "🎉", category: "entertainment", subcategory: "events", keywords: ["eventos", "fiestas", "salon"], features: { ...F.rental, services: true }, labels: { cta: "Cotizar", products: "Paquetes", services: "Servicios" } },
    { id: "organizador_eventos", label: "Organizador de Eventos", icon: "📋", category: "entertainment", subcategory: "events", keywords: ["organizador", "wedding planner", "eventos"], features: F.consultancy, labels: { cta: "Cotizar", products: "Paquetes", services: "Servicios" } },
    { id: "dj", label: "DJ / Sonido", icon: "🎧", category: "entertainment", subcategory: "events", keywords: ["dj", "musica", "sonido"], features: F.consultancy, labels: { cta: "Contratar", products: "Paquetes", services: "Servicios" } },
    { id: "escape_room", label: "Escape Room", icon: "🔐", category: "entertainment", subcategory: "recreation", keywords: ["escape", "juegos", "misterio"], features: F.service, labels: { cta: "Reservar", products: "Salas", services: "Experiencias" } },
    { id: "discoteca", label: "Discoteca / Antro", icon: "🪩", category: "entertainment", subcategory: "nightlife", keywords: ["disco", "antro", "club"], features: { ...F.restaurant, tables: true }, labels: { cta: "Reservar Mesa", products: "Bebidas", services: "Servicios" } },

    // ========== MEDIA ==========
    { id: "estudio_foto", label: "Estudio Fotográfico", icon: "📷", category: "media", subcategory: "photography", keywords: ["foto", "estudio", "sesion"], features: { ...F.service, rentals: true, orders: true }, labels: { cta: "Reservar Sesión", products: "Paquetes", services: "Sesiones" } },
    { id: "videografo", label: "Videografía", icon: "🎬", category: "media", subcategory: "video", keywords: ["video", "produccion", "bodas"], features: F.consultancy, labels: { cta: "Cotizar", products: "Paquetes", services: "Servicios" } },
    { id: "diseno_grafico", label: "Diseño Gráfico", icon: "🎨", category: "media", subcategory: "design_services", keywords: ["diseño", "logo", "branding"], features: F.consultancy, labels: { cta: "Cotizar", products: "Servicios", services: "Diseños" } },
    { id: "imprenta", label: "Imprenta", icon: "🖨️", category: "media", subcategory: "design_services", keywords: ["imprenta", "impresion", "tarjetas"], features: { ...F.retail, services: true }, labels: { cta: "Cotizar", products: "Productos", services: "Servicios" } },
    { id: "agencia_marketing", label: "Agencia de Marketing", icon: "📈", category: "media", subcategory: "marketing", keywords: ["marketing", "publicidad", "digital"], features: F.consultancy, labels: { cta: "Cotizar", products: "Servicios", services: "Campañas" } },

    // ========== PROFESSIONAL ==========
    { id: "abogado", label: "Despacho de Abogados", icon: "⚖️", category: "professional", subcategory: "legal", keywords: ["abogado", "legal", "juridico"], features: F.consultancy, labels: { cta: "Agendar Consulta", products: "Servicios", services: "Asesoría" } },
    { id: "notaria", label: "Notaría", icon: "📜", category: "professional", subcategory: "legal", keywords: ["notario", "escrituras", "legal"], features: F.consultancy, labels: { cta: "Agendar Cita", products: "Servicios", services: "Trámites" } },
    { id: "contador", label: "Despacho Contable", icon: "📊", category: "professional", subcategory: "accounting", keywords: ["contador", "fiscal", "impuestos"], features: F.consultancy, labels: { cta: "Agendar Cita", products: "Servicios", services: "Asesoría" } },
    { id: "seguros", label: "Agencia de Seguros", icon: "🛡️", category: "professional", subcategory: "insurance_finance", keywords: ["seguros", "poliza", "aseguradora"], features: { ...F.consultancy, catalog: true }, labels: { cta: "Cotizar", products: "Seguros", services: "Asesoría" } },
    { id: "inmobiliaria", label: "Inmobiliaria", icon: "🏢", category: "professional", subcategory: "real_estate", keywords: ["inmobiliaria", "casas", "propiedades"], features: { ...F.consultancy, catalog: true, rentals: true }, labels: { cta: "Ver Propiedades", products: "Propiedades", services: "Servicios" } },
    { id: "consultoria", label: "Consultoría Empresarial", icon: "💼", category: "professional", subcategory: "consulting", keywords: ["consultoria", "negocios", "asesoria"], features: F.consultancy, labels: { cta: "Agendar Consulta", products: "Servicios", services: "Asesoría" } },

    // ========== TRAVEL ==========
    { id: "agencia_viajes", label: "Agencia de Viajes", icon: "✈️", category: "travel", subcategory: "travel_agencies", keywords: ["viajes", "tours", "vacaciones"], features: { ...F.consultancy, catalog: true, orders: true }, labels: { cta: "Ver Destinos", products: "Paquetes", services: "Tours" } },
    { id: "hotel", label: "Hotel", icon: "🏨", category: "travel", subcategory: "lodging", keywords: ["hotel", "hospedaje", "habitaciones"], features: { ...F.rental, services: true }, labels: { cta: "Reservar", products: "Habitaciones", services: "Servicios" } },
    { id: "airbnb", label: "Renta Vacacional / Airbnb", icon: "🏠", category: "travel", subcategory: "lodging", keywords: ["airbnb", "renta", "vacacional"], features: F.rental, labels: { cta: "Reservar", products: "Propiedades", services: "Servicios" } },

    // ========== GIFTS ==========
    { id: "floreria", label: "Florería", icon: "💐", category: "gifts", subcategory: "other_sub", keywords: ["flores", "arreglos", "ramos"], features: { ...F.retail, services: true }, labels: { cta: "Ver Arreglos", products: "Arreglos", services: "Servicios" } },
    { id: "tienda_regalos", label: "Tienda de Regalos", icon: "🎁", category: "gifts", subcategory: "other_sub", keywords: ["regalos", "gifts", "detalles"], features: F.retail, labels: { cta: "Ver Catálogo", products: "Regalos", services: "Servicios" } },
    { id: "globos", label: "Globos y Decoración", icon: "🎈", category: "gifts", subcategory: "other_sub", keywords: ["globos", "decoracion", "fiestas"], features: { ...F.retail, services: true }, labels: { cta: "Ver Catálogo", products: "Productos", services: "Decoración" } },
    { id: "personalizados", label: "Artículos Personalizados", icon: "✨", category: "gifts", subcategory: "other_sub", keywords: ["personalizado", "grabado", "custom"], features: { ...F.retail, services: true }, labels: { cta: "Ver Catálogo", products: "Productos", services: "Personalización" } },

    // ========== OTHER ==========
    { id: "otro", label: "Otro Negocio", icon: "🏬", category: "other", subcategory: "other_sub", keywords: ["otro", "general"], features: F.all, labels: { cta: "Contactar", products: "Productos", services: "Servicios" } },
];

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/** Obtener tipo por ID */
export function getBusinessType(id: string): BusinessTypeConfig | undefined {
    return BUSINESS_TYPES.find(t => t.id === id);
}

/** Obtener tipos por categoría */
export function getTypesByCategory(category: BusinessCategory): BusinessTypeConfig[] {
    return BUSINESS_TYPES.filter(t => t.category === category);
}

/** Obtener tipos por subcategoría */
export function getTypesBySubcategory(subcategory: BusinessSubcategory): BusinessTypeConfig[] {
    return BUSINESS_TYPES.filter(t => t.subcategory === subcategory);
}

/** Buscar tipos por keyword */
export function searchBusinessTypes(query: string): BusinessTypeConfig[] {
    const q = query.toLowerCase().trim();
    if (!q) return BUSINESS_TYPES;

    return BUSINESS_TYPES.filter(t =>
        t.label.toLowerCase().includes(q) ||
        t.keywords.some(k => k.includes(q)) ||
        CATEGORY_INFO[t.category].label.toLowerCase().includes(q)
    );
}

/** Obtener todas las categorías con sus tipos */
export function getCategoriesWithTypes(): Array<{
    category: BusinessCategory;
    info: typeof CATEGORY_INFO[BusinessCategory];
    types: BusinessTypeConfig[];
}> {
    const categories = Object.keys(CATEGORY_INFO) as BusinessCategory[];
    return categories.map(cat => ({
        category: cat,
        info: CATEGORY_INFO[cat],
        types: getTypesByCategory(cat),
    })).filter(c => c.types.length > 0);
}

// Re-export for compatibility
export { CATEGORY_INFO, SUBCATEGORY_INFO, type BusinessCategory, type BusinessSubcategory } from "./business-categories.types";
