# Memoria Activa (Tracking de IA) - Proyecto Tiendas (Linko App)
Este archivo es mantenido automáticamente por la Inteligencia Artificial al servicio de este repositorio.

## Fases Completadas (Legacy Log)
- [x] Fase 1: Implementación de Template "Street Drop" (Gingxer Studio).
- [x] Fase 2: Panel Administrativo y Checkout Tematizado (Street Drop). Bugfixes de UI.
- [x] Fase 3: Reglas de Meal Prep. Deduplicación de Extras y Precios (Premium). Pagos arreglados. Add-ons Globales de Meal Prep agregados y finalizados exitosamente. 
- [x] Fase 4: Mejoras de White-label y Agencia (Logo Personalizado en settings y modales comerciales). Se estabilizó la jerarquía del Super Admin.

## Fase Actual: Fase 5 (Nuevos Requerimientos)
- [x] **Sistema de Cuadres Semanales** — Registro de actividad y cuadre de caja por empleado y sucursal.
- [x] **Dashboard Financiero por Sucursal** — Resumen consolidado de ingresos, gastos y neto con barras de progreso comparativas.
- [x] **Live Chat en tiempo real** — Widget cliente + panel admin con notificaciones globales, sonido Web Audio API y fix del race condition de cleanup.
- [x] **Catálogo de categorías tech** — Imágenes subidas a Firebase Storage, hover con reveal de color natural y animación Apex-style en tarjetas.
- [x] **Notificaciones push globales** — GlobalChatNotifier en admin layout, toast con acceso directo al chat desde cualquier página.
- [x] **Firestore rules para chatSessions** — Reglas de seguridad para lectura/escritura del chat en tiempo real.
- [ ] Catálogo unificado multi-sucursal (productos de todas las sucursales en una sola vista con deduplicación por SKU).
- [ ] Explorar mejoras posibles de IA (background removal automático, sugerencias de precio, etc.).

### Detalles Técnicos — Sistema de Cuadres (2026-03-30)
**Archivos creados:**
- `lib/types/cuadre.types.ts` — Tipos completos: Cuadre, CuadreEntry, CuadreExpense + helpers calcCuadreTotals, getCurrentWeekRange
- `app/api/cuadres/route.ts` — GET (filtros por branchId, employeeId, status) + POST
- `app/api/cuadres/[id]/route.ts` — GET, PATCH (edit/submit/approve/reject), DELETE (solo borradores)
- `app/admin/mi-cuadre/page.tsx` — Vista empleado: agregar registros, gastos, enviar para aprobación
- `app/admin/cuadres/page.tsx` — Vista dueño: listado con filtros y KPIs
- `app/admin/cuadres/[id]/page.tsx` — Detalle con Aprobar/Rechazar
- `app/admin/finanzas/page.tsx` — Dashboard financiero con barras CSS comparativas por sucursal

**Flujo:**
1. Empleado → Mi Cuadre → registra ventas/reparaciones/servicios/gastos → envía
2. Dueño → Cuadres → revisa → Aprueba o Rechaza con motivo
3. Dueño → Finanzas → ve resumen consolidado de cuadres aprobados por período y sucursal

**Campo branchId añadido a User** (`components/shared/auth-context.tsx`) para asociar empleados a su sucursal.

## Notas Estratégicas y Log Táctico Actualizado
- Actualmente se usa el Websocket standard en Firestore en inicio de arranque en paralelo y, como modo de contingencia (fallback blockcatch), "Long Polling" en Firebase para evitar bloqueos del SDK y resolver retardos severos observados. Si hay timeouts en las sesiones de `app/admin/layout.tsx`, el `AuthContext` ahora está explícitamente sincronizado con `useShops()` para no renderizar contenido nulo prematuro en refesh.
- La configuración de base de datos es multi-tenant estricto. Cada tienda vive dentro de la raíz bajo `shops/{shopId}` (sus menús, categories e información de dueños están como campos u objetos anidados adjuntos usualmente).
