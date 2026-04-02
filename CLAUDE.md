# Documento Maestro de IA - proyecto-tiendas

Este es el archivo principal de instrucciones globales para cualquier IA (Claude, Antigravity, Cursor, etc.) que asista en este proyecto.

## 1. Identidad y Misión del Proyecto
- **Proyecto**: "Linko App" / "proyecto-tiendas".
- **Naturaleza**: Plataforma SaaS B2B multitienda, e-commerce, con sistema de roles (`SUPER_ADMIN`, `SHOP_OWNER`, `SHOP_STAFF`).
- **Prioridad**: Alta calidad visual, rendimiento impecable, animaciones ricas, patrones de composición modernos y buenas prácticas de seguridad. 
- **Filosofía**: Evitar el diseño genérico ("AI slop"). Siempre entregar interfaces premium modernas.

## 2. Gestión de Tareas y Memoria
- Tu "memoria" como agente se encuentra en la raíz del repositorio, en `task.md` (o en la memoria persistente del agente local).
- Al iniciar el día o recibir instrucciones ambiguas, **debes consultar `task.md` o el contexto actual** para saber en qué fase estamos enfocados.
- Al completar un hito importante, actualiza explícitamente `task.md` (cambiando el pendinte a `[x]`). El repositorio local manda y es la fuente de verdad estricta.

## 3. Estructura Modular de Trabajo
Las reglas ahora están divididas para que la IA cargue solo lo que necesita (reduciendo confusión).
- **Reglas Técnicas**: Lócalizadas en `.claude/rules/` (ej. `code-style.md`, `architecture-state.md`).
- **Habilidades (Skills) Avanzadas**: Lee `.claude/skills/SKILLS_MASTER.md` para entender cómo se aplica el diseño premium a cada componente.
- **Flujos (Commands)**: Los procesos como `/deploy` viven en `.claude/commands/`.
