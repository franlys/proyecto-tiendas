# Reglas de Arquitectura y Estado

- **Base de Datos / Backend:** Firebase Authentication, Storage, Evolution API y Firestore Cloud.
- **Gestión del Estado:** React Context API (`AuthContext`, `ShopsContext`, `InventoryContext`).
- **TypeScript:** Altamente tipado. Evita y prohíbe el uso de `any`. Si la data de nube es incierta, usa `unknown` y constrúyelo escalonadamente, o extrae la interfaz del modelo real en `lib/constants.ts` (o en `lib/types/`).
- **Arquitectura Global:** Consulta preferiblemente `docs/architecture.md` antes de decidir crear nuevas tablas pesadas en Firebase, modificar reglas en Firestore o alterar drásticamente la lógica multicomercial.
- **Roles:** Siempre ten en mente el entorno multi-tenant de Linko App. Maneja cuidadosamente la asignación y limitación de las transacciones vitales de los usuarios (`SUPER_ADMIN`, `SHOP_OWNER`, `SHOP_STAFF`).
