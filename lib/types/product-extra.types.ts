/**
 * Product Extras / Addons Types
 *
 * Used for products that can have optional additions with extra cost.
 * Examples:
 * - Dulcería: Oreo, Nutella, frutas en postres
 * - Pizzería: Queso extra, pepperoni
 * - Cafetería: Shot extra, leche de almendra
 * - Heladería: Toppings, salsas
 * - Restaurante: Guarniciones extra
 */

export interface ProductExtra {
    id: string;
    name: string;           // "Oreo", "Nutella", "Queso Extra"
    price: number;          // Precio adicional
    description?: string;   // Descripción opcional
    image?: string;         // Imagen del extra (opcional)
    available?: boolean;    // Si está disponible (default: true)
    maxQuantity?: number;   // Máximo que se puede agregar (default: 1)
    category?: string;      // Categoría del extra: "toppings", "salsas", "extras"
}

/**
 * Extra seleccionado en el carrito
 */
export interface SelectedExtra {
    extraId: string;
    name: string;
    price: number;
    quantity: number;
}

/**
 * Grupo de extras para organizar en UI
 * Ejemplo: "Toppings", "Salsas", "Extras"
 */
export interface ExtraGroup {
    id: string;
    name: string;           // "Toppings", "Salsas"
    description?: string;
    extras: ProductExtra[];
    maxSelections?: number; // Máximo de extras de este grupo (opcional)
    required?: boolean;     // Si es obligatorio seleccionar al menos uno
}

/**
 * Configuración de extras a nivel de tienda
 * Para extras globales que aplican a múltiples productos
 */
export interface ShopExtrasConfig {
    globalExtras?: ProductExtra[];      // Extras que aplican a todos los productos
    extraGroups?: ExtraGroup[];         // Grupos organizados de extras
    defaultMaxExtrasPerProduct?: number; // Máximo de extras por producto (default: sin límite)
}
