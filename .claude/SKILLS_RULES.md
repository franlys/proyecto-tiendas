# Reglas de Uso de Skills — proyecto-tiendas
# Actualizado: 2026-03-29

Skills instaladas en `~/.claude/skills/`. Este archivo define cuándo y cómo usar cada una.

---

## Inventario completo

| Skill | Fuente | Propósito principal |
|---|---|---|
| `frontend-design` | Anthropic oficial | Generar UI de alta calidad, no genérica |
| `ui-ux-pro-max` | nextlevelbuilder | Base de datos de estilos, paletas, tipografías, guías UX |
| `emilkowalski-design` | emilkowalski | Animaciones correctas, microinteracciones, polish |
| `vercel-react-best-practices` | Vercel | Performance React/Next.js, bundle, data fetching |
| `vercel-composition-patterns` | Vercel | Arquitectura de componentes, evitar boolean prop hell |
| `deploy-to-vercel` | Vercel | Despliegues a Vercel |
| `vercel-react-native-skills` | Vercel | Solo si hay app mobile (futuro) |

---

## 1. `frontend-design` — UI Production-Grade

**Se activa AUTOMÁTICAMENTE cuando:**
- Se pide construir un componente nuevo, página, modal, card, layout
- Se pide mejorar el diseño visual de algo existente
- El resultado actual "se ve genérico" o "se parece a todos los demás"
- Se trabaja en la plantilla `tech-premium-v2` o cualquier template

**Cómo influye:**
- Antes de escribir código, define una dirección estética clara (no neutral)
- Elige tipografía, espaciado, color y jerarquía con intención
- Evita el look "AI slop" — sin cards genéricas, sin grises aburridos, sin layouts de plantilla
- Prioriza lo memorable sobre lo seguro

**Ejemplos de trigger:**
```
"construye la tarjeta de producto"
"rediseña la página de inicio"
"crea el modal de financiamiento"
"mejora el diseño del admin"
```

**Para este proyecto — áreas prioritarias:**
- `tech-premium-v2-home.tsx` — homepage con feature cards
- `tech-premium-v2-layout.tsx` — catálogo y navbar
- `app/admin/**` — paneles de administración
- Cualquier modal nuevo (QuoteRequest, Financing, Wholesale)

---

## 2. `ui-ux-pro-max` — Inteligencia de Diseño

**Se activa cuando:**
- Se necesita elegir una paleta de colores para un nuevo componente o plantilla
- Se pregunta sobre tipografía: "qué fuente va bien con X"
- Se quiere explorar un estilo: glassmorphism, bento grid, claymorphism, dark mode
- Se revisa si un diseño cumple guías UX (jerarquía, spacing, estados de interacción)
- Se crean gráficos/charts en el admin
- Se trabaja en una nueva plantilla de tienda desde cero

**Dominios disponibles:** `product`, `style`, `typography`, `color`, `landing`, `chart`, `ux`

**Stacks soportados:** React, Next.js, Vue, Svelte, Tailwind, shadcn/ui, HTML/CSS

**Ejemplos de trigger:**
```
"sugiere una paleta de colores para una tienda tech"
"qué tipografía combina con el estilo oscuro de González"
"diseña esto con estilo bento grid"
"revisa si este formulario tiene buena UX"
"qué chart usar para mostrar ventas por mes"
```

**Para este proyecto — usar cuando:**
- Se crea o mejora cualquier template (`tech-drop-v1`, `premium-drop-v1`, etc.)
- Se diseña el homepage de `tech-premium-v2` con Spline
- Se añaden nuevas secciones al admin dashboard
- Se revisa la consistencia visual de componentes shared

---

## 3. `emilkowalski-design` — Animaciones y Polish

**Se activa cuando:**
- Cualquier pregunta sobre animaciones: duración, easing, cuándo animar o no
- Se integra Spline, Framer Motion, GSAP o CSS transitions
- Se revisan microinteracciones: hover, active, focus, drag
- Un componente "se siente torpe" o "le falta algo" visualmente
- Se trabaja en el Hero de la homepage o en las feature cards
- Se diseña la entrada de un modal, tooltip, dropdown o popover

**Filosofía clave que aplica:**
- No todo debe animarse — frecuencia y contexto mandan
- Botones: `transform: scale(0.97)` en `:active`, 100-160ms
- Dropdowns: escalan desde el trigger, no desde el centro
- Modales: 200-500ms, ease-out en entrada, ease-in en salida
- Solo animar `transform` y `opacity` (GPU-accelerated)
- Respetar `prefers-reduced-motion`
- Cubic-bezier personalizados > defaults de CSS

**Ejemplos de trigger:**
```
"cómo debería entrar la escena Spline en el hero"
"el modal se siente brusco"
"qué easing usar para las feature cards"
"agrega microanimaciones al hover de las tarjetas"
"cómo hacer que el tooltip aparezca bien"
```

**Para este proyecto — uso crítico en:**
- Integración Spline (`tech-premium-v2-home.tsx`) — entrada/salida de la escena 3D
- Feature cards del homepage — hover, stagger, scroll trigger
- Todos los modales — QuoteRequest, Financing, Wholesale, LiveChat
- Navbar transitions y active states

---

## 4. `vercel-react-best-practices` — Performance

**Se activa cuando:**
- La página carga lenta o hay lag reportado
- Se crean componentes con data fetching (useEffect + fetch/getDocs)
- Se ve un `await` seguido de otro `await` independiente
- Se importa desde barrel files (`@/components/shared`, `@/lib/constants`)
- Se usan librerías pesadas (gsap, framer-motion, @splinetool/react-spline)
- Se revisa bundle size antes de un deploy importante

**Reglas más críticas para este proyecto:**

| Regla | Aplica a |
|---|---|
| `async-parallel` — `Promise.all()` para cargas independientes | `page.tsx`, services |
| `bundle-dynamic-imports` — `next/dynamic` para librerías pesadas | Spline, modales complejos |
| `bundle-barrel-imports` — importar directo, no desde index | Todo el proyecto |
| `rerender-memo` — memoizar listas de productos | `ProductCard`, grids |
| `rendering-conditional-render` — ternario, nunca `&&` con falsy | Todos los componentes |

**Para este proyecto — áreas prioritarias:**
- `app/(shops)/[shopId]/tienda/page.tsx` — carga de productos/servicios
- Componente Spline — cargar con `next/dynamic({ ssr: false })`
- `components/shop/templates/tech-premium-v2-*.tsx` — librerías GSAP/Framer

---

## 5. `vercel-composition-patterns` — Arquitectura

**Se activa cuando:**
- Un componente acumula más de 3 props booleanas
- Se va a crear un componente que otros van a reutilizar de formas distintas
- Hay lógica de estado duplicada en dos componentes hermanos
- Se diseña una nueva sección del admin o un flujo multi-paso

**Reglas clave:**
- `avoid-boolean-props` — en lugar de `<Card isWholesale isAdmin isPremium>`, usar variantes
- `compound-components` — para carrito, modales con múltiples partes, formularios complejos
- `explicit-variants` — `<WholesaleCard>` mejor que `<Card mode="wholesale">`

**Para este proyecto — revisar cuando:**
- Se crea un nuevo modal (ya tenemos 4 — revisar si comparten lógica)
- Se añaden features a `TechPremiumV2Layout` (ya tiene muchas responsabilidades)
- Se refactoriza el sistema de plantillas

---

## 6. `deploy-to-vercel` — Despliegues

**Se activa cuando el usuario dice:**
`"sube"`, `"despliega"`, `"deploy"`, `"push"`, `"lanza esto"`, `"sube todo"`

**Reglas de este proyecto:**
- Rama `main` = producción — confirmar siempre antes de push a main
- El proyecto tiene git remote → el flujo es `git commit + git push`
- Vercel detecta el push y despliega automáticamente
- Nunca `--force push` a main sin confirmación explícita
- TypeScript limpio (`npx tsc --noEmit`) antes de cada deploy

---

## 7. `vercel-react-native-skills` — Mobile

**NO aplica actualmente.** Solo activar si en el futuro se crea una app móvil con React Native/Expo.

---

## Combinaciones por tarea

### Nuevo componente visual
1. `ui-ux-pro-max` → decisiones de estilo, color, tipografía
2. `frontend-design` → ejecutar con dirección estética clara
3. `emilkowalski-design` → animaciones y estados interactivos
4. `vercel-react-best-practices` → imports, memoización, bundle

### Integración Spline / 3D
1. `emilkowalski-design` → cómo entra/sale la escena, parallax, timing
2. `vercel-react-best-practices` → `next/dynamic({ ssr: false })`, lazy load
3. `frontend-design` → cómo integra visualmente con el hero

### Nueva plantilla de tienda
1. `ui-ux-pro-max` → definir estilo, paleta, tipografía del concepto
2. `frontend-design` → ejecutar el diseño con carácter visual propio
3. `vercel-composition-patterns` → arquitectura del layout
4. `emilkowalski-design` → animaciones de scroll, transiciones entre vistas
5. `vercel-react-best-practices` → performance desde el inicio

### Refactor de página existente
1. `vercel-composition-patterns` → detectar boolean prop hell y duplicación
2. `vercel-react-best-practices` → waterfalls, bundle, imports
3. `frontend-design` → si el rediseño visual es parte del refactor

### Preparar deploy
1. `npx tsc --noEmit` — TypeScript limpio obligatorio
2. `vercel-react-best-practices` — revisar imports barrel y awaits secuenciales
3. `deploy-to-vercel` — commit descriptivo + push

---

## Disparadores automáticos

Sin que el usuario lo pida explícitamente, activar:

| Situación | Skill a aplicar |
|---|---|
| Se crea o modifica cualquier componente visual | `frontend-design` |
| Se pregunta sobre animación, easing, timing | `emilkowalski-design` |
| Se trabaja con Spline o cualquier elemento 3D | `emilkowalski-design` + `vercel-react-best-practices` |
| Se piden sugerencias de color o tipografía | `ui-ux-pro-max` |
| Se ve `await` seguido de otro `await` independiente | `vercel-react-best-practices` → `async-parallel` |
| Import desde barrel file en componente nuevo | `vercel-react-best-practices` → `bundle-barrel-imports` |
| Componente con 3+ props booleanas | `vercel-composition-patterns` |
| Usuario dice "sube", "despliega", "push" | `deploy-to-vercel` |
| Un componente "se siente torpe" o "le falta algo" | `emilkowalski-design` |
| Se diseña desde cero un template o landing | `ui-ux-pro-max` + `frontend-design` |
