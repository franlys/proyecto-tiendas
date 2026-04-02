---
description: Pipeline lógico ordenado para subida de commits y despliegue a producción en Vercel.
---
# Workflow de Deploy Seguro 🚀

Este proceso normativo describe las reglas definitivas y los chequeos manuales estructurados paso a paso ejecutables por la IA para poder certificar la salida de ramas, código sin anomalías de TypeScript y lanzar cambios finales directo al servidor de host en Vercel sobre la rama (`main`). 

**ADVERTENCIA EXTREMA:**
No recurrir a usar comandos peligrosos como `git push --force` a la rama de `main` en este proyecto sin explícita justificación comunicada al ser humano y aprobada irrevocablemente bajo su criterio.

## Pasos del Ciclo Seguro

1. **Pre-flight TypeScript Check:**
   El código en este ecosistema posee dependencias rigurosas y chequeos constantes de tipos (strict-mode) de TypeScript y esto NO tolerará fallas y frenará en seco todo el despliegue automático de Vercel (CI).
   Comienza sin dudarlo validando toda la fase previa de código sucio bajo simulacro de compilación completa sin emitir bundles JS.
   - **Comando Ejecutable sugerido:**  
     `npx tsc --noEmit`

2. **Pre-flight Clean Linting:**
   - **Comando Sugerido Correctivo:**
     Para reparar espacios disonantes en bruto o sintaxis inconexa suelta tras grandes refactorings de IA ejecuta `npm run lint` o `npx prettier --write .`. 

3. **Intervención Inmediata o Autorización Humana de Avance (Visual Control):**
   Si la CLI escupió toneladas de marcadores rojos mortales y detectaste reportes de advertencias en `tsc` en los peldaños anteriores, ESTÁS OBLIGADO A REPORTARLOS ANTES. Desiste inmediatamente y abandona temporalmente la intentona del despliegue en general. 
   Desgaja el registro de la raíz de esas problemáticas o sintaxis mal aplicada y plantea el hot-fix lógico resolutoriano al desarrollador Humano; reescribe el código local antes de reestablecer este Workflow al inicio desde 0 de nuevo.

4. **Git Stage Commit Formal:**
   - Aplicar control puro evaluando los archivos vigentes: ejecuta `git status` y revisa las asimilaciones correctas. Agrupa inteligentemente para el índice: `git add .` (si solo hay archivos intencionalmente reparados y deseados).
   - Acoger el método de mensajería clara "Conventional Commits" semántico para perpetuar bien la trazabilidad: `git commit -m "feat/fix/chore: [descripcion concreta visual y resolutiva]"`.

5. **Lanzamiento / Git Push Final Transaccional:**
   Ejecutar fríamente `git push` a la ramificación `main` (si se está bajo esta) o remote origin correspondiente transaccional. A raíz de este impulso, los motores detectores automáticos ligados a la integración y despliegue continuo (CI/CD) de los paneles webhook de Vercel levantarán, destilarán internamente, y construirán el nuevo commit emitido empujando inmediatamente hacia la URl real en producción.
   Finaliza dando el reporte formal estético al usuario certificando que el "Push de los artefactos subidos al servidor remoto" ha sido enviado hacia la luz e incítale sutilmente a chequear en sus métricas o Vercel dashboard personal el estado orgánico de la compilación remota final de Next.js.
