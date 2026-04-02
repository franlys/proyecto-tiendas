# Estándares de Trabajo y Despliegue

- **Automatización**: La automatización y scripts confiables de este repositorio se basan en Comandos / Workflows que viven en la carpeta `.claude/commands/`.
- **Despliegues (`/deploy`)**: Cuando se ordene "Súbelo a producción", invoca de manera sistemática los comandos escritos. Lee `.claude/commands/deploy.md` antes de correr comandos en consola. 
- **Validación de Datos (`/review_firebase`)**: Antes de alterar bases de datos en Firestore o implementar lógicas nuevas de nube, lee y obedece las reglas delineadas en comandos como `.claude/commands/review_firebase.md`. No confíes a ciegas.
