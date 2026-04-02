---
description: Auditoría básica de consistencia y seguridad al añadir features nuevos en Firebase.
---
# Workflow: Auditoría de Firebase Authentication y Security Rules

Cada vez que el humano decida añadir una nueva colección secreta, un rol nuevo (como la futura distinción "Driver Staff") o un tipo de login nuevo, el sistema (IA) debe invocar instintivamente este playbook.

## Pasos de Verificación

1. Revisar si la estructura global propuesta viola el Scope de un shop ("Multi-tenant protection"):
   - Piénsalo profundamente: ¿Este nuevo query u operación va accidentalmente a traer items que corresponden de la "Tienda A" hacia la "Tienda B" de un tercero por error de mal anidamiento?
   - Solución obligatoria arquitectónica: Asegura siempre que la consulta en el cliente (query) y tu nueva Regla posea explícitamente el resguardo contextualizado comparativo con el id transaccional. (Ej: `where("shopId", "==", user.shopId)`).

2. Auditar Reglas Transaccionales de Firestore:
   - Ve a revisar en caliente el contenido del archivo principal subyacente de reglas `firestore.rules` ubicado en la raíz.
   - Si creaste subcolecciones nuevas: asegúrate inmediatamente de haber agregado la capa al árbol: `match /shops/{shopId}/tuNuevaSubColeccion/{docId}`.
   - Restringe rigurosamente lecturas o escrituras validando siempre si `request.auth.uid` está presente o tiene el rol adecuado. Nunca dejes ni un agujero ni escribas: `allow read, write: if true;` salvo si se justifica estricta y puramente bajo las landing temporales de visualización pública anónima en catálogos del UI de usuarios ajenos.

3. Sanitización de Logs Visuales de Desarrollo (`debug_*.txt` preventivos):
   - Nunca inyectar por ningún concepto funciones primitivas perjudiciales como el pop nativo de `alert()` o `console.log()` masivos destructivos con data pesada dentro del código cliente de Firebase para la aplicación lista de producción.
   - Sustituye todos los reportes de captura "catch firestore" usando el componente prehecho unificado del Context de notificaciones preventivas y los toasts integrados, evitando totalmente exponer o escupir información o stack-traces delicados o pesados sin procesar frente a clientes del lado del browser (front-end).
