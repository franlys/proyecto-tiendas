# Guía de Servicios y Productos por Tipo de Negocio

## Resumen

El sistema maneja **dos tipos principales de contenido** que una tienda puede ofrecer:

1. **Productos**: Artículos físicos o digitales que se venden (catálogo con inventario)
2. **Servicios**: Acciones que se realizan para el cliente (citas, tratamientos, consultas)

---

## Arquitectura de Almacenamiento

### Productos
```
shops/{shopId}/products/{productId}
```
- Gestionados desde: **Admin > Inventario** (vista de Productos)
- Se usa el `InventoryContext` para CRUD
- Campos principales: `name`, `price`, `stock`, `category`, `image`, `variants`

### Servicios (para citas)
```
shops/{shopId}/bookingServices/{serviceId}
```
- Gestionados desde: **Admin > Inventario** (vista de Servicios)
- Se usa la API `/api/bookings/services`
- Campos principales: `name`, `price`, `duration`, `category`, `image`, `isActive`

### Servicios Legacy (para compatibilidad)
```
shops/{shopId}/services/{serviceId}
```
- Colección anterior, el sistema lee de ambas ubicaciones
- Migrar a `bookingServices` cuando sea posible

---

## Tipos de Negocios y sus Características

### Negocios Centrados en SERVICIOS (solo citas)
Estos negocios **solo** ofrecen servicios, no venden productos:

| Tipo | Ejemplo | Features |
|------|---------|----------|
| `clinica_dental` | Dentista | Solo servicios + citas |
| `consultorio_medico` | Doctor | Solo servicios + citas |
| `laboratorio` | Lab clínico | Solo servicios + citas |
| `consultoria` | Consultoría | Solo servicios + citas |
| `despacho_contable` | Contador | Solo servicios + citas |
| `tutoria` | Clases particulares | Solo servicios + citas |

**En el panel de admin**: Solo verán la vista de "Servicios"

### Negocios Centrados en PRODUCTOS (solo catálogo)
Estos negocios **solo** venden productos, no ofrecen servicios con citas:

| Tipo | Ejemplo | Features |
|------|---------|----------|
| `tienda_ropa` | Boutique | Solo productos + pedidos |
| `zapateria` | Zapatos | Solo productos + pedidos |
| `perfumeria` | Perfumes | Solo productos + pedidos |
| `tienda_general` | Abarrotes | Solo productos + pedidos |
| `refaccionaria` | Autopartes | Solo productos + pedidos |
| `cafeteria` | Café | Solo productos (menú) + pedidos |
| `food_truck` | Comida móvil | Solo productos (menú) + pedidos |

**En el panel de admin**: Solo verán la vista de "Productos"

### Negocios HÍBRIDOS (productos + servicios)
Estos negocios ofrecen **AMBOS**: productos Y servicios con citas:

| Tipo | Ejemplo | Productos | Servicios |
|------|---------|-----------|-----------|
| `beauty` / `salon_belleza` | Estética | Shampoos, cremas | Corte, tinte, tratamiento |
| `barberia` | Barbería | Ceras, aceites | Corte, afeitado |
| `spa` | Spa | Cremas, aceites | Masajes, tratamientos |
| `nail_salon` | Uñas | Esmaltes | Manicure, pedicure |
| `veterinaria` | Veterinaria | Comida, medicinas | Consultas, vacunas |
| `optica` | Óptica | Lentes, armazones | Examen de vista |
| `farmacia` | Farmacia | Medicamentos | Inyecciones, presión |
| `celulares` | Celulares | Equipos, accesorios | Reparaciones |
| `taller_mecanico` | Mecánico | Refacciones | Afinación, frenos |
| `gimnasio` | Gym | Suplementos | Clases, entrenamiento |
| `pasteleria` | Pastelería | Pasteles, pan | Pasteles personalizados |
| `floreria` | Florería | Flores, plantas | Arreglos personalizados |
| `decoracion` | Decoración | Artículos | Asesoría de decoración |
| `electrodomesticos` | Electrodom. | Equipos | Instalación, reparación |
| `muebleria` | Mueblería | Muebles | Armado, entrega |
| `fotografia` | Fotografía | Paquetes impresos | Sesiones fotográficas |
| `salon_eventos` | Eventos | Paquetes | Reservación de salón |

**En el panel de admin**: Verán un toggle para cambiar entre "Productos" y "Servicios"

---

## Cómo Funciona la Visibilidad de Tabs en la Tienda

El archivo `standard-shop-layout.tsx` determina qué tabs mostrar basándose en:

```typescript
// Determinar si mostrar tabs
const showProductsTab = combinedFeatures.hasCatalog && hasProducts;
const showServicesTab = combinedFeatures.hasServices && hasServices;

// Configuración de tabs
const tabs = [];
if (showServicesTab) tabs.push({ id: "servicios", label: "Servicios" });
if (showProductsTab) tabs.push({ id: "productos", label: "Productos" });
```

**Reglas**:
1. Un tab solo aparece si:
   - El tipo de negocio tiene esa característica habilitada (`hasCatalog`, `hasServices`)
   - Y HAY contenido de ese tipo (`hasProducts`, `hasServices`)
2. Si una tienda de belleza no tiene productos cargados, solo verá el tab de servicios
3. Si tiene ambos, verá ambos tabs

---

## Cómo Agregar Contenido

### Para agregar PRODUCTOS:
1. Ir a **Admin > Inventario**
2. Si ves tabs, selecciona "Productos"
3. Click en "Nuevo Producto"
4. Llenar: nombre, precio, stock, categoría, imagen
5. Guardar

**Los productos se guardan en**: `shops/{shopId}/products/{productId}`

### Para agregar SERVICIOS:
1. Ir a **Admin > Inventario**
2. Si ves tabs, selecciona "Servicios"
3. Click en "Nuevo Servicio"
4. Llenar: nombre, duración, precio, categoría, imagen
5. Guardar

**Los servicios se guardan en**: `shops/{shopId}/bookingServices/{serviceId}`

---

## Flujo de Citas (Bookings)

Solo los negocios con `features.bookings: true` tienen sistema de citas.

1. El cliente ve los servicios disponibles
2. Selecciona uno o más servicios
3. Elige fecha y hora disponible
4. Proporciona sus datos (nombre, teléfono, email)
5. Se crea la cita en `shops/{shopId}/bookings/{bookingId}`
6. El cliente recibe confirmación
7. El negocio recibe notificación

**Colección de citas**: `shops/{shopId}/bookings/`

---

## Flujo de Pedidos (Orders)

Solo los negocios con `features.orders: true` tienen sistema de pedidos.

1. El cliente ve los productos disponibles
2. Agrega productos al carrito
3. Procede al checkout
4. Proporciona datos y dirección de entrega
5. Confirma el pedido
6. Se crea el pedido en `shops/{shopId}/orders/{orderId}`

**Colección de pedidos**: `shops/{shopId}/orders/`

---

## Configuración por Tipo de Negocio

La configuración completa está en `lib/types/business.types.ts` bajo `BUSINESS_TYPE_CONFIG`.

Cada tipo tiene:
```typescript
{
    features: {
        catalog: boolean,      // ¿Muestra catálogo de productos?
        services: boolean,     // ¿Ofrece servicios?
        bookings: boolean,     // ¿Necesita sistema de citas?
        orders: boolean,       // ¿Procesa pedidos?
        inventory: boolean,    // ¿Maneja inventario/stock?
        wholesale: boolean,    // ¿Precios de mayoreo?
        repairs: boolean,      // ¿Ofrece reparaciones?
        rentals: boolean,      // ¿Ofrece rentas?
        tables: boolean,       // ¿Maneja mesas? (restaurantes)
        delivery: boolean,     // ¿Ofrece delivery?
    },
    labels: {
        cta: string,           // Botón principal ("Reservar Cita", "Ver Menú")
        products: string,      // Nombre de productos ("Platillos", "Prendas")
        services: string,      // Nombre de servicios ("Tratamientos", "Clases")
        booking: string,       // Nombre de cita ("Turno", "Sesión")
        order: string,         // Nombre de pedido ("Orden", "Renta")
    }
}
```

---

## Migración de Datos (Problema Común)

### El Problema del ID vs Slug

Las tiendas tienen:
- `id`: ID del documento en Firestore (ej: `shop-1709234567890`)
- `slug`: Slug legible (ej: `estetica-lola`)

Si los productos se guardaron usando el `slug` como ruta pero el sistema ahora lee usando el `id`, los productos no aparecerán.

### Diagnóstico

Usa el endpoint:
```
GET /api/debug/migrate-products
```

Esto mostrará:
- Cuántos productos hay en cada ruta (slug vs id)
- Qué tiendas necesitan migración

### Migración

Para migrar productos de la ruta slug a la ruta id:

```bash
# 1. Primero, hacer dry run (no hace cambios)
POST /api/debug/migrate-products
Body: { "dryRun": true }

# 2. Si los resultados son correctos, ejecutar migración
POST /api/debug/migrate-products
Body: { "dryRun": false }
```

---

## Resumen Visual

```
┌────────────────────────────────────────────────────────────┐
│                    TIPO DE NEGOCIO                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Solo SERVICIOS          HÍBRIDO           Solo PRODUCTOS  │
│  (clinica_dental,     (beauty, spa,      (tienda_ropa,     │
│   consultoria,         veterinaria,       cafeteria,       │
│   tutoria...)          celulares...)      food_truck...)   │
│                                                             │
│  ┌─────────────┐    ┌─────────────────┐   ┌─────────────┐  │
│  │  Servicios  │    │ Servicios │ Pro │   │  Productos  │  │
│  │   (citas)   │    │  (citas)  │ duc │   │  (pedidos)  │  │
│  │             │    │           │ tos │   │             │  │
│  └─────────────┘    └─────────────────┘   └─────────────┘  │
│                                                             │
│  Colección:          Colecciones:         Colección:       │
│  bookingServices     bookingServices +    products         │
│                      products                              │
│                                                             │
│  Genera:             Genera:              Genera:          │
│  Bookings            Bookings + Orders    Orders           │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## FAQ

### ¿Por qué mi tienda muestra dos tabs pero solo quiero uno?
Si tu tipo de negocio es "híbrido" (ej: beauty, veterinaria), el sistema asume que ofrecerás ambos. Solo aparecerán los tabs de contenido que tengas cargado.

### ¿Por qué no aparecen mis productos?
1. Verifica que el `isActive` del producto sea `true`
2. Verifica que los productos estén en la ruta correcta (`shops/{id}/products`, no `shops/{slug}/products`)
3. Usa `/api/debug/migrate-products` para diagnosticar

### ¿Puedo cambiar el tipo de negocio?
Sí, desde el panel de agencia. Esto cambiará las características disponibles pero no afecta los datos existentes.

### ¿Cómo combino tipos de negocio?
Usa el array `businessTypes` para combinar. Por ejemplo:
```javascript
businessTypes: ["meal_prep", "gimnasio"]
```
Esto habilitará las características de ambos tipos (meal prep + entrenamiento personal).
