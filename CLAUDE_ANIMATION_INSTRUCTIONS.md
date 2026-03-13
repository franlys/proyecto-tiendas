# Instrucciones para Claude: Animación "Tech Premium v2"

Hola Claude. Tu objetivo es implementar una animación de logo estilo Apple (multipaso) en el hero de la plantilla **Tech Premium v2** para el cliente "Gonzalez Smartphone".

El IA de diseño (Antigravity) ya ha generado los **4 assets clave** con fondo **negro puro (#000000)** y estética minimalista para que encajen perfectamente en esta plantilla. Tu trabajo es codificar la transición.

## 1. Copiar los Assets a Public

Primero, copia los 4 frames maestros desde el `brain` de Antigravity a la carpeta `public` del proyecto. Ejecuta estos comandos (puedes ajustarlos si usas node.js fs):

```bash
mkdir -p public/assets/tech-premium-animation
cp "C:\Users\elmae\.gemini\antigravity\brain\41c717f1-f69f-49d0-a3cf-21fd3a92a271\tech_premium_frame1_start_1773421821512.png" "public/assets/tech-premium-animation/frame1.png"
cp "C:\Users\elmae\.gemini\antigravity\brain\41c717f1-f69f-49d0-a3cf-21fd3a92a271\tech_premium_frame2_mid_1773421838435.png" "public/assets/tech-premium-animation/frame2.png"
cp "C:\Users\elmae\.gemini\antigravity\brain\41c717f1-f69f-49d0-a3cf-21fd3a92a271\tech_premium_frame3_preimpact_1773421853827.png" "public/assets/tech-premium-animation/frame3.png"
cp "C:\Users\elmae\.gemini\antigravity\brain\41c717f1-f69f-49d0-a3cf-21fd3a92a271\tech_premium_frame4_final_1773421803985.png" "public/assets/tech-premium-animation/frame4.png"
```

*Nota: Si prefieres no usar cp, asegúrate de indicarle al usuario que mueva estos archivos manualmente.*

## 2. Crear Componente de Animación
Crea `components/shop/templates/custom/tech-premium-logo-animation.tsx` utilizando `framer-motion`. 

**Lógica requerida:**
- Usa `useState` y `useEffect` para secuenciar el cambio de imágenes (Frame 1 -> 2 -> 3 -> 4).
- El fondo del contenedor debe ser transparente o `#000000` puro.
- La transición entre frames debe ser instantánea (cambio directo de origen de imagen) PERO el contenedor global puede tener un sutil efecto de escala (ej. `scale: 1.0` a `scale: 1.05` durante 4 segundos).
- En el Frame 3 (pre-impacto), añade un sutil `drop-shadow` de CSS en azul eléctrico para realzar el efecto de chispa.

## 3. Integración en Tech Premium v2
Localiza el archivo principal de la plantilla **Tech Premium v2** (probablemente `components/shop/templates/custom/tech-premium-v2-layout.tsx` según el template registry).

- Sustituye cualquier título estático de Hero o imagen plana por el componente `<TechPremiumLogoAnimation />`.
- Recordatorio de la filosofía de esta plantilla: **Menos es más**. No añadas textos adicionales alrededor del logo animado. Deja que el logo "respire" con mucho espacio negativo (padding masivo) sobre el fondo negro absoluto.
