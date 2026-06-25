# ÁNCORA ⚓ (Sistema EN-78: Centro de Control y Blindaje Conductual)

Áncora es un panel de control financiero y conductual de grado clínico desarrollado para dar soporte terapéutico, monitorear la operativa en futuros y gestionar deudas, actuando como un escudo protector interactivo.

---

## 1. Misión y Propósito Clínico

El sistema está diseñado para ofrecer soporte integral en disregulación emocional y control conductual mediante:
*   **Blindaje Operativo (Trading)**: Monitoreo de cuentas reales en BingX, límites de riesgo y lista de seguridad pre-market obligatoria.
*   **Terapeuta Virtual ("Walter")**: Asistente clínico automatizado para mitigar la ansiedad y parálisis conductual. Al finalizar cada sesión, genera un reporte clínico estructurado utilizando modelos avanzados de IA (DeepSeek V4 Pro) consolidados en la ficha del paciente.
*   **Planificación Financiera (Deudas)**: Un calendario interactivo y dinámico que simula flujos de caja y organiza el pago de deudas por prioridades basándose en salarios y rendimiento real.
*   **Hoja de Ruta Legal (INSS)**: Seguimiento en fases de gestiones legales de incapacidad.

---

## 2. Arquitectura Tecnológica

### Frontend
*   **Core**: React 19 (Vite) + Javascript (ES Modules).
*   **Estilos**: Vanilla CSS con diseño premium oscuro, efectos de cristal (glassmorphism), variables globales fluidas e iluminación cian/esmeralda.
*   **Librerías**: `lucide-react` para iconos y `@supabase/supabase-js` para la integración de datos en tiempo real.
*   **Despliegue**: Firebase Hosting (`ancora-portal.web.app`).

### Backend & Base de Datos
*   **Base de Datos**: Supabase PostgreSQL con Row Level Security (RLS) activo en todas las tablas para separar los roles de `emilio` y `supervisor`.
*   **Backend (Supabase Edge Functions)**:
    - `chat-terapeuta`: Edge Function en Deno que maneja el chat clínico y llamadas HMAC SHA-256 a la API de futuros de BingX para gestión de balances y cierres de emergencia.
    - Integración con APIs de OpenRouter/DeepSeek para procesamiento cognitivo y generación de conclusiones.

---

## 3. Instalación y Ejecución Local

Para levantar el servidor de desarrollo local de Vite:

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Ejecuta el servidor en modo de desarrollo:
   ```bash
   npm run dev
   ```
3. Accede desde tu navegador en la dirección local configurada (usualmente [http://localhost:5180/](http://localhost:5180/)).

---

## 4. Estructura de Módulos Clave (`src/components/trading/`)

*   **`ViabilityWidget`**: Simulador financiero interconectado con deudas y calendario de previsión.
*   **`PanicSimulatorWidget`**: Asistente de amígdala con ejercicios de choque autonómico y respiración guiada.
*   **`GriefWidget`**: Aceptación radical de pérdidas operativas en el trading.
*   **`SecurityChecklistWidget`**: Check pre-market mandatorio para habilitar operativas.
