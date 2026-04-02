# Reglas de Código y Estilo Frontend

- **Framework:** Next.js 14+ (App Router). 
- **React Server vs Client:** Uso estricto de Server Components. El pragma `"use client"` va únicamente en componentes web donde existan interacciones manejables (ej. un manejador `onClick`) o hooks de estado (React).
- **Estilos:** Tailwind CSS y utilidades base como `shadcn/ui` o `lucide-react`.
- **Calidad Visual:** NUNCA utilices un estilo visual genérico de plantilla ("AI slop"). Inspírate en diseños modernos, elegantes y premium (vibrantes, glassmorphism, etc.).
- **Animaciones:** Utiliza Framer Motion, GSAP o transiciones puras optimizadas por hardware para animaciones ricas, siempre basándote en un contexto que mejore la experiencia del usuario sin sobrecargar.
