# Guía: Crear Plantillas Custom (Por Cliente)

Este documento explica el flujo completo para crear una plantilla personalizada
exclusiva para un cliente específico, sin romper el sistema existente.

---

## Estructura de Archivos

```
components/shop/templates/
├── standard-shop-layout.tsx      ← plantilla base
├── premium-drop-layout.tsx       ← built-in premium
├── street-drop-layout.tsx
├── cosmic-drop-layout.tsx
├── tech-drop-layout.tsx
├── tech-3d-layout.tsx
├── tech-premium-v2-layout.tsx
└── custom/                       ← 📁 AQUÍ van las plantillas custom
    └── mi-cliente-layout.tsx

lib/templates/
├── registry.ts                   ← metadata (nombre, descripción, estado)
└── component-registry.tsx        ← mapa ID → componente React
```

---

## Pasos para Agregar una Plantilla Custom

### 1. Crear el componente

Crea el archivo en `components/shop/templates/custom/`:

```tsx
// components/shop/templates/custom/belleza-rosa-layout.tsx
"use client";

import type { ShopLayoutProps } from "@/lib/templates/component-registry";

export function BellezaRosaLayout({ shop, products, services, loadingData }: ShopLayoutProps) {
  return (
    <div>
      {/* Tu diseño personalizado aquí */}
    </div>
  );
}
```

**Convención de nombres:**
- Archivo: `{slug-del-cliente}-layout.tsx`
- Función: `{NombreCliente}Layout`
- ID de plantilla: `{slug-del-cliente}-v1`

### 2. Registrar en component-registry.tsx

Abre [lib/templates/component-registry.tsx](../lib/templates/component-registry.tsx)
y agrega en la sección `--- Custom ---`:

```tsx
// Agrega el import al inicio del archivo:
import { BellezaRosaLayout } from "@/components/shop/templates/custom/belleza-rosa-layout";

// Agrega en TEMPLATE_REGISTRY:
"belleza-rosa-v1": BellezaRosaLayout,
```

### 3. Registrar en registry.ts (metadata)

Abre [lib/templates/registry.ts](../lib/templates/registry.ts)
y agrega en `BUILT_IN_TEMPLATES`:

```typescript
{
    id: "belleza-rosa-v1",
    name: "Belleza Rosa — Exclusivo",
    description: "Plantilla exclusiva para Belleza Rosa Spa. Paleta rosada y elegante.",
    category: "custom",
    status: "active",
    customFor: "belleza-rosa",          // slug o nombre del cliente
    notes: "Diseño entregado 2026-03-15. Cliente: María González.",
    createdAt: "2026-03-15",
},
```

### 4. Asignar al shop del cliente

Desde el panel de Super Admin → Plantillas, asignar `belleza-rosa-v1` al shop del cliente.

O directo en Firestore: `shops/{shopId}` → campo `templateType: "belleza-rosa-v1"`.

---

## Props disponibles en el componente

```typescript
interface ShopLayoutProps {
    shop: ManagedShop | null;   // datos del negocio (nombre, logo, colores, etc.)
    products: Product[];         // productos del catálogo
    services: Service[];         // servicios/citas
    loadingData: boolean;        // true mientras carga
}
```

Campos útiles de `shop`:
- `shop.name` — nombre del negocio
- `shop.logoUrl` — logo
- `shop.coverImageUrl` — imagen de portada
- `shop.primaryColor` — color principal personalizado
- `shop.description` — descripción del negocio
- `shop.whatsapp`, `shop.phone`, `shop.instagram` — contacto
- `shop.businessType` — tipo de negocio (beauty, tienda_ropa, etc.)

---

## Cosas a NO modificar al agregar una plantilla custom

- `app/(shops)/[shopId]/page.tsx` — ya NO necesita cambios
- `app/admin/templates/page.tsx` — ya funciona con cualquier plantilla registrada
- `app/admin/settings/page.tsx` — carga dinámicamente del registry

---

## Componentes reutilizables disponibles

Estos componentes de la tienda pueden usarse dentro de cualquier plantilla:

```tsx
import { ProductGrid, ServiceCard } from "@/components/shop";
import { CheckoutDrawer } from "@/components/shop/checkout-drawer";
import { FloatingCart } from "@/components/shop/floating-cart";
import { AppointmentModal } from "@/components/shop/appointment-modal";
import { useCart } from "@/components/shared";
```

---

## Flujo de trabajo recomendado

```
1. Diseñar en Figma / captura del cliente
      ↓
2. Crear componente en custom/ (solo CSS/estructura, sin lógica nueva)
      ↓
3. Registrar en component-registry.tsx y registry.ts (2 líneas cada uno)
      ↓
4. Probar localmente con un shop de prueba
      ↓
5. Asignar al shop del cliente desde el admin
      ↓
6. Deploy a producción
```

---

## Categorías de plantilla

| Categoría | Uso |
|-----------|-----|
| `standard` | Plantilla base del sistema |
| `premium` | Plantillas premium del catálogo general |
| `custom` | Exclusivas para un cliente específico (no se muestran en el catálogo general) |
