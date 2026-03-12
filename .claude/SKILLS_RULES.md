# Reglas de Uso de Skills — proyecto-tiendas

Este archivo define **cuándo y cómo** usar cada skill instalada globalmente.
Las skills están en `~/.agents/skills/`. Lee su `AGENTS.md` para las reglas completas.

---

## Skills Instaladas

| Skill | Ruta | Prioridad |
|-------|------|-----------|
| `web-design-guidelines` | `~/.agents/skills/web-design-guidelines/` | Alta |
| `vercel-react-best-practices` | `~/.agents/skills/vercel-react-best-practices/` | Alta |
| `vercel-composition-patterns` | `~/.agents/skills/vercel-composition-patterns/` | Media |
| `deploy-to-vercel` | `~/.agents/skills/deploy-to-vercel/` | Según demanda |
| `vercel-react-native-skills` | `~/.agents/skills/vercel-react-native-skills/` | Solo mobile |

---

## 1. `web-design-guidelines` — Auditoría UI/UX

**Cuándo usarla:**
- El usuario dice: "revisa el diseño", "audita la UI", "revisa accesibilidad", "aplica UX"
- Antes de hacer un commit de componentes visuales nuevos o modificados
- Cuando se crea una página nueva o un modal nuevo
- Cuando el usuario reporta que algo "se ve mal" o "no funciona bien en móvil"

**Cómo usarla:**
```
/web-design-guidelines <archivo o patrón>
```
Ejemplos de uso real:
```
/web-design-guidelines components/shop/checkout-drawer.tsx
/web-design-guidelines components/shop/*.tsx
/web-design-guidelines app/admin/**/*.tsx
```

**Qué revisa:** Accesibilidad (aria-labels, htmlFor, roles), focus-visible, tipos de input,
contraste de colores, touch targets mínimos (44px), scroll lock en modales,
imágenes con alt/width/height, outline-none sin reemplazo.

**Archivos más relevantes de este proyecto:**
- `components/shop/` — todos los componentes de tienda
- `components/shared/` — componentes reutilizables
- `app/admin/` — panel de administración

---

## 2. `vercel-react-best-practices` — Performance Next.js/React

**Cuándo usarla:**
- El usuario reporta que la página carga lenta o hay lag
- Al crear componentes nuevos con data fetching
- Cuando se detectan múltiples `await` secuenciales que podrían ser paralelos
- Al revisar imports de librerías pesadas (framer-motion, gsap, etc.)
- Cuando el bundle size parece grande o hay muchos re-renders

**Cómo usarla:**
Lee `~/.agents/skills/vercel-react-best-practices/AGENTS.md` y aplica las reglas
del archivo al componente o página que estés trabajando.

**Reglas más críticas para este proyecto:**
- `async-parallel` — usar `Promise.all()` para cargas independientes (shops, config, products)
- `bundle-dynamic-imports` — `next/dynamic` para modales pesados (MealPrepModal, CheckoutDrawer)
- `bundle-barrel-imports` — importar directamente, no desde index
- `rerender-memo` — memoizar componentes de lista de productos
- `rerender-no-inline-components` — no definir componentes dentro de render
- `server-cache-react` — usar `React.cache()` en server components de admin
- `rendering-conditional-render` — usar ternario, nunca `&&` con valores falsy

**Archivos prioritarios de este proyecto:**
- `app/[slug]/page.tsx` — página principal de tienda (server component, data fetching)
- `app/admin/*/page.tsx` — páginas del admin
- `components/shop/product-card.tsx` — se renderiza N veces, optimizar re-renders
- `lib/services/*.service.ts` — servicios con múltiples fetches a Firestore

---

## 3. `vercel-composition-patterns` — Arquitectura de Componentes

**Cuándo usarla:**
- Un componente tiene más de 3 props booleanas (`isOpen`, `isLoading`, `isAdmin`, `isPremium`...)
- Se necesita crear un componente reutilizable que otros van a usar de formas distintas
- Cuando hay lógica de estado duplicada en componentes hermanos
- Al diseñar nuevas secciones del admin o nuevas vistas de tienda

**Cómo usarla:**
Lee `~/.agents/skills/vercel-composition-patterns/AGENTS.md` antes de diseñar
la arquitectura del componente.

**Reglas más relevantes para este proyecto:**
- `architecture-avoid-boolean-props` — en lugar de `<Card isPremium isHidden isAdmin>`,
  crear variantes o usar composition
- `architecture-compound-components` — para componentes como el carrito, modales, formularios
- `state-lift-state` — mover estado compartido al provider correcto
- `patterns-explicit-variants` — crear `<PremiumCard>` y `<StandardCard>` en lugar de `<Card premium>`

---

## 4. `deploy-to-vercel` — Despliegue

**Cuándo usarla:**
- El usuario dice: "despliega", "sube a producción", "crea un preview", "push esto live"
- Nunca desplegar a producción sin confirmación explícita del usuario
- Por defecto siempre crear **preview deployment**, no producción

**Cómo usarla:**
Este proyecto ya tiene git remote y está linkeado a Vercel. El flujo es:
1. Hacer commit con los cambios
2. `git push` — Vercel detecta el push y despliega automáticamente
3. Verificar URL en el dashboard de Vercel o con `vercel ls`

**IMPORTANTE:** Este proyecto usa la rama `main` como producción. No hacer
`git push --force` ni `vercel deploy --prod` sin confirmación del usuario.

---

## 5. `vercel-react-native-skills` — Mobile (Expo/RN)

**Cuándo usarla:**
- SOLO si en el futuro se crea una app móvil con React Native o Expo
- **No aplica** al proyecto web actual (Next.js)

---

## Cuándo Combinar Skills

### Nuevo componente visual complejo
1. Diseñar arquitectura con `vercel-composition-patterns`
2. Implementar con `vercel-react-best-practices` (evitar waterfalls, bundle size)
3. Auditar el resultado con `web-design-guidelines`

### Refactor de página existente
1. Auditar primero con `web-design-guidelines` para ver problemas actuales
2. Aplicar `vercel-react-best-practices` para performance
3. Si hay props booleanas proliferadas, aplicar `vercel-composition-patterns`

### Preparar release / deploy
1. Correr auditoría final con `web-design-guidelines` en componentes modificados
2. Verificar no hay imports barrel ni awaits secuenciales innecesarios
3. Usar `deploy-to-vercel` para el push

---

## Disparadores Automáticos

Estos patrones en la conversación DEBEN activar la skill correspondiente
sin que el usuario lo pida explícitamente:

| El usuario dice o hace... | Skill a activar |
|---------------------------|-----------------|
| Crea o modifica un componente visual | `web-design-guidelines` al terminar |
| "está lento", "tarda mucho", "lag" | `vercel-react-best-practices` |
| Múltiples props booleanas en un componente | `vercel-composition-patterns` |
| "sube esto", "despliega", "push" | `deploy-to-vercel` |
| Componente con `await` secuencial | `vercel-react-best-practices` → `async-parallel` |
| Import desde barrel file (`@/components/shared`) | `vercel-react-best-practices` → `bundle-barrel-imports` |
