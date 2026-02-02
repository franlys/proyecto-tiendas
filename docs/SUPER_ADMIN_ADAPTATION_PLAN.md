# Plan de Adaptación: SUPER_ADMIN para Linko

## Resumen Ejecutivo

Adaptar las funcionalidades del super admin del proyecto de referencia a NEXO, migrando de localStorage a Firestore y añadiendo las capacidades que faltan.

---

## Estado Actual de NEXO

### ✅ Lo que ya existe:
| Funcionalidad | Ubicación | Estado |
|---------------|-----------|--------|
| Roles (SUPER_ADMIN, SHOP_OWNER, SHOP_STAFF) | `auth-context.tsx` | Hardcodeado |
| CRUD de shops | `shops-context.tsx` | localStorage |
| Toggle activo/inactivo | `shops-context.tsx` | ✅ |
| Gestión de suscripciones | `shops-context.tsx` | Básico |
| Panel de agencia | `/agency` | ✅ |
| White-label | `agency-context.tsx` | localStorage |
| Firebase SDK | `lib/firebase.ts` | Configurado |

### ❌ Lo que falta:
- Persistencia en Firestore (todo está en localStorage)
- API routes para operaciones CRUD
- Sistema de planes y features por plan
- Reset de contraseña real
- Autenticación con Firebase Auth
- Auditoría de acciones

---

## Arquitectura Propuesta

### 1. Colecciones de Firestore

```
firestore/
├── shops/                    # Tiendas/Empresas
│   └── {shopId}/
│       ├── name: string
│       ├── slug: string
│       ├── category: string
│       ├── isActive: boolean
│       ├── planId: string
│       ├── customFeatures: string[]    # Features extra
│       ├── disabledFeatures: string[]  # Features removidos
│       ├── subscription: {...}
│       └── createdAt: timestamp
│
├── users/                    # Usuarios del sistema
│   └── {userId}/
│       ├── email: string
│       ├── name: string
│       ├── role: "SUPER_ADMIN" | "SHOP_OWNER" | "SHOP_STAFF"
│       ├── shopId?: string
│       ├── staffRole?: string
│       └── isActive: boolean
│
├── plans/                    # Planes de suscripción
│   └── {planId}/
│       ├── name: string
│       ├── price: number
│       ├── features: string[]
│       ├── limits: {...}
│       └── isActive: boolean
│
└── audit_logs/               # Registro de acciones
    └── {logId}/
        ├── action: string
        ├── userId: string
        ├── targetId: string
        ├── timestamp: timestamp
        └── details: {...}
```

### 2. Features del Sistema

```typescript
// Definición de features disponibles
const SYSTEM_FEATURES = {
  // Inventario
  inventory: "Gestión de inventario",
  variants: "Variantes de productos",
  lowStockAlerts: "Alertas de bajo stock",

  // Ventas
  orders: "Gestión de pedidos",
  kanban: "Tablero Kanban",
  whatsappIntegration: "Integración WhatsApp",

  // Clientes
  crm: "CRM de clientes",
  clientHistory: "Historial de clientes",
  loyalty: "Programa de lealtad",

  // Marketing
  campaigns: "Campañas de marketing",
  promoGenerator: "Generador de promociones",
  emailMarketing: "Email marketing",

  // Staff
  staffManagement: "Gestión de empleados",
  staffCommissions: "Comisiones de empleados",

  // Avanzado
  analytics: "Analíticas avanzadas",
  multiLocation: "Múltiples ubicaciones",
  api: "Acceso a API",
} as const;
```

### 3. Planes Predefinidos

| Plan | Precio | Features |
|------|--------|----------|
| **Básico** | $299/mes | inventory, orders, crm |
| **Pro** | $499/mes | + variants, kanban, campaigns, staffManagement |
| **Enterprise** | $999/mes | + analytics, multiLocation, api, promoGenerator |

---

## Archivos a Crear

### API Routes

```
app/api/
├── admin/
│   ├── shops/
│   │   ├── route.ts              # GET (list), POST (create)
│   │   └── [shopId]/
│   │       ├── route.ts          # GET, PUT, DELETE
│   │       ├── toggle/route.ts   # POST (toggle active)
│   │       └── features/route.ts # GET, PUT (manage features)
│   │
│   ├── users/
│   │   ├── route.ts              # GET (list), POST (create)
│   │   └── [userId]/
│   │       ├── route.ts          # GET, PUT, DELETE
│   │       └── reset-password/route.ts
│   │
│   └── plans/
│       ├── route.ts              # GET (list), POST (create)
│       └── [planId]/route.ts     # GET, PUT, DELETE
│
└── auth/
    └── verify/route.ts           # Verificar token de admin
```

### Servicios de Firestore

```
lib/
├── services/
│   ├── shops.service.ts      # CRUD de shops
│   ├── users.service.ts      # CRUD de usuarios
│   ├── plans.service.ts      # CRUD de planes
│   ├── features.service.ts   # Gestión de features
│   └── audit.service.ts      # Logging de acciones
│
└── middleware/
    └── admin-auth.ts         # Middleware de autenticación
```

### Tipos TypeScript

```
types/
├── shop.types.ts
├── user.types.ts
├── plan.types.ts
└── feature.types.ts
```

---

## Archivos a Modificar

1. **`components/shared/shops-context.tsx`**
   - Migrar de localStorage a Firestore
   - Usar API routes en lugar de operaciones locales

2. **`components/shared/auth-context.tsx`**
   - Integrar con Firebase Auth
   - Eliminar usuarios hardcodeados
   - Verificar permisos desde Firestore

3. **`app/agency/page.tsx`**
   - Actualizar para usar nuevos endpoints
   - Agregar gestión de features por shop

4. **`app/agency/shop/[slug]/page.tsx`**
   - Agregar tab de Features
   - Implementar reset de contraseña real

---

## Fases de Implementación

### Fase 1: Infraestructura (Prioridad Alta)
1. ✅ Crear tipos TypeScript
2. ✅ Crear servicios de Firestore
3. ✅ Crear API routes básicas
4. ✅ Crear middleware de autenticación

### Fase 2: Migración de Shops (Prioridad Alta)
1. Migrar shops-context a Firestore
2. Actualizar panel de agencia
3. Probar CRUD completo

### Fase 3: Sistema de Planes y Features (Prioridad Media)
1. Crear colección de planes
2. Implementar asignación de features
3. UI para gestionar features por shop

### Fase 4: Gestión de Usuarios (Prioridad Media)
1. Migrar auth-context a Firebase Auth
2. Implementar reset de contraseña
3. Gestión de staff desde super admin

### Fase 5: Auditoría y Seguridad (Prioridad Baja)
1. Implementar logging de acciones
2. Agregar rate limiting
3. Mejorar validaciones

---

## Ejemplo de Implementación

### API Route: Crear Shop

```typescript
// app/api/admin/shops/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/middleware/admin-auth";
import { createShop, listShops } from "@/lib/services/shops.service";

export async function GET(req: NextRequest) {
  const admin = await verifyAdminToken(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shops = await listShops();
  return NextResponse.json({ shops });
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdminToken(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const shop = await createShop(data);

  return NextResponse.json({ shop }, { status: 201 });
}
```

### Servicio de Firestore: Shops

```typescript
// lib/services/shops.service.ts
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";

const COLLECTION = "shops";

export async function createShop(data: CreateShopInput) {
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...data,
    isActive: true,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, ...data };
}

export async function listShops() {
  const snapshot = await getDocs(collection(db, COLLECTION));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function toggleShopActive(shopId: string) {
  const shopRef = doc(db, COLLECTION, shopId);
  const shop = await getDoc(shopRef);

  if (!shop.exists()) throw new Error("Shop not found");

  await updateDoc(shopRef, {
    isActive: !shop.data().isActive,
  });
}
```

---

## Notas Importantes

1. **Hardware Management**: El proyecto de referencia tiene gestión de hardware (terminales, tablets). Esto NO es necesario para NEXO ya que es un SaaS web-only.

2. **Compatibilidad hacia atrás**: Durante la migración, mantener soporte para localStorage como fallback.

3. **Variables de entorno**: Asegurar que las credenciales de Firebase Admin estén configuradas.

4. **Testing**: Crear datos de prueba en Firestore antes de eliminar los mocks.

---

## Checklist de Verificación

- [ ] Colecciones de Firestore creadas
- [ ] API routes funcionando
- [ ] Panel de agencia actualizado
- [ ] Gestión de features implementada
- [ ] Reset de contraseña funcional
- [ ] Logs de auditoría activos
- [ ] Tests pasando
- [ ] Datos migrados de localStorage a Firestore
