# Sistema EN-78: Centro de Control y Blindaje Conductual

Este documento proporciona el contexto completo, la arquitectura técnica, las configuraciones del sistema y las decisiones de diseño del **Sistema EN-78** (también conocido como *Portal de Supervivencia de Emilio*). Está diseñado para transferir el conocimiento del proyecto al agente **Codex** y permitirle continuar con su desarrollo sin fricciones.

---

## 1. Misión y Propósito Clínico

El **Sistema EN-78** es un panel conductual y de control financiero de grado clínico desarrollado para **Emilio**. Emilio experimenta disregulación emocional grave y autosabotaje financiero a través del trading de futuros, lo que ha resultado en acumulación de deudas y parálisis conductual.

El sistema actúa como un **escudo protector** mediante las siguientes misiones:
*   **Blindaje Operativo (Trading)**: Monitorear sus cuentas reales en BingX, limitar su riesgo y obligarle a llevar una lista de seguridad diaria.
*   **Terapeuta Virtual ("Walter")**: Un bot clínico ("Walter") que guía a Emilio durante episodios de ansiedad o parálisis (ej. aplicando el *Protocolo de Congelación Inversa* con agua helada). Al cerrar una sesión, Walter genera un reporte de conclusiones clínicas y pautas utilizando **DeepSeek V4 Pro** y las consolida en su ficha del panel derecho.
*   **Planificación Financiera (Deudas)**: Un calendario interactivo y dinámico que simula flujos de caja y organiza el pago de deudas por prioridades utilizando sus ingresos reales de EFE y de trading.
*   **Hoja de Ruta Legal (INSS)**: Seguimiento en fases de sus gestiones legales para la incapacidad permanente.

---

## 2. Arquitectura Tecnológica

La aplicación se compone de tres capas principales:

### Frontend
*   **Core**: React 19 (Vite) + Javascript (ES Modules con `"type": "module"` en `package.json`).
*   **Estilos**: Vanilla CSS con variables globales de diseño premium oscuras, efectos de cristal (glassmorphism), y luces de color cian/esmeralda.
*   **Librerías**: `lucide-react` para iconos y `supabase-js` para base de datos.
*   **Despliegue**: **Firebase Hosting** (`ayuda-emilio-83261.web.app`).

### Backend (Supabase Edge Functions)
*   **Tecnología**: Deno (Typescript) alojado en Supabase Edge Functions.
*   **Función Clave (`chat-terapeuta`)**: 
    - Realiza llamadas firmadas con HMAC SHA-256 a la API de futuros perpetuos de **BingX** para obtener balances, márgenes y cerrar posiciones en caso de emergencia.
    - Se comunica con la API de **OpenRouter** para el chat terapéutico.
    - Implementa fallbacks asíncronos en cascada de proveedores para mitigar caídas en modelos de DeepSeek (`DeepInfra` ➔ `DeepSeek` ➔ `NovitaAI`).
    - Integra el cierre clínico (`prepare_close_conversation`) mediante el modelo `"deepseek/deepseek-v4-pro"` con un timeout extendido a 80 segundos.
    - Utiliza `"google/gemini-2.5-pro"` (mapeado desde el selector `'3.5'`) para el chat regular de baja latencia.

### Base de Datos (Supabase PostgreSQL)
*   **Row Level Security (RLS)**: Activado estrictamente en todas las tablas para separar los perfiles de `emilio` y `supervisor`.
*   **Triggers**: Cuenta con el trigger `on_auth_user_created` que ejecuta la función `handle_new_user()` al registrarse un usuario en `auth.users`, autogenerando su fila correspondiente en `public.profiles`.

---

## 3. Estructura de la Base de Datos

Las tablas y esquemas relacionales clave en PostgreSQL son:

### `public.profiles`
Guarda la configuración e información sensible del perfil de usuario.
*   `id`: `UUID PRIMARY KEY REFERENCES auth.users`
*   `role`: `TEXT CHECK (role IN ('emilio', 'supervisor'))` (Por defecto es `'emilio'`).
*   `bingx_api_key` / `bingx_api_secret`: Claves cifradas de la API de futuros de Emilio.

### `public.debts`
Historial de deudas activas.
*   `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
*   `user_id`: `UUID REFERENCES auth.users`
*   `creditor`: `TEXT` (Nombre del acreedor, ej. "Jesús", "Susana", "Elena", "Mamá").
*   `amount`: `NUMERIC(12, 2)` (Monto total).
*   `paid_amount`: `NUMERIC(12, 2)` (Monto amortizado).
*   `priority`: `INTEGER` (Prioridad de amortización, 1 es la más alta).

### `public.daily_moods`
Diario de sensaciones para evaluar el estado emocional antes y después de operar.
*   `anxiety_level` / `impulsivity_level`: Niveles del 1 al 10.
*   `atomoxetina_taken`: Flag booleano de medicación diaria para el TDAH.
*   `trading_today`: Si operó en el día.
*   `notes`: Detalles qualitativos del estado del paciente.

### `public.legal_roadmap`
Seguimiento de fases del INSS.
*   `phase_number`: Del 1 al 5.
*   `status`: `'pending' | 'in_progress' | 'completed'`.
*   `tasks`: Campo `JSONB` que contiene una lista de sub-tareas individuales.

### `public.journal_days`
Diario operativo de trading diario.
*   `pnl`: Ganancia/Pérdida en USD de la jornada.
*   `trades`: Número de operaciones ejecutadas.
*   `risk`: Límite de pérdida máximo asignado de forma manual (si está vacío, el frontend calcula el 1.5% de su equity).

---

## 4. Flujo de Autenticación y Acceso Simplificado

Se ha refinado y simplificado el flujo de autenticación del portal en [LoginView.jsx](file:///c:/Users/yo/Pictures/Descargaspc/0a/webayudatra/src/views/LoginView.jsx):

1.  **Sin Selector de Roles**: Se eliminó la selección manual de roles al registrarse. Todo usuario que se registra obtiene de forma automática y transparente el rol `'emilio'` gracias al trigger `coalesce` de base de datos.
2.  **Autenticación con Google**: Se ha añadido un botón premium "Continuar con Google" integrado con Supabase OAuth (`supabase.auth.signInWithOAuth`).

### Configuración del OAuth de Google requerida en consolas web:
*   **Google Cloud Console (`ayuda-497509`)**:
    - ID de cliente OAuth 2.0 de tipo Aplicación Web.
    - **Orígenes autorizados**: `http://localhost:5180` y `https://ayuda-emilio-83261.web.app`.
    - **Redirección autorizada**: `https://ysnorelkaccaikvuqgnv.supabase.co/auth/v1/callback`.
*   **Supabase Console (`ysnorelkaccaikvuqgnv`)**:
    - Proveedor Google habilitado en *Authentication > Providers > Google* con el *Client ID* y *Client Secret* de Google Cloud.

---

## 5. Módulos y Widgets del Frontend (`src/components/trading/`)

*   [ViabilityWidget.jsx](file:///c:/Users/yo/Pictures/Descargaspc/0a/webayudatra/src/components/trading/ViabilityWidget.jsx): Módulo central de finanzas. Contiene:
    - **Calendario Tradezilla & Viabilidad**: Mapea ingresos, gastos, PnL diario y equity acumulada día a día.
    - **Previsión de Deudas (Forecast)**: Un simulador de bola de cristal interactivo que proyecta el mes exacto de "Deuda Cero" distribuyendo la caja de salarios de EFE (incluyendo pagas extra en junio/diciembre) y rendimiento medio de trading a las deudas pendientes por orden de prioridad.
*   [PanicSimulatorWidget.jsx](file:///c:/Users/yo/Pictures/Descargaspc/0a/webayudatra/src/components/trading/PanicSimulatorWidget.jsx): Asistente de parálisis. Pide al usuario calificar su ansiedad en una crisis, bloquea la vista con un protocolo de respiración guiada y ofrece ejercicios de choque autonómico para desactivar la amígdala.
*   [GriefWidget.jsx](file:///c:/Users/yo/Pictures/Descargaspc/0a/webayudatra/src/components/trading/GriefWidget.jsx): Procesador de duelos. Permite escribir sobre pérdidas operativas y estimula la aceptación radical del mercado para evitar el "revenge trading" (operar por venganza).
*   [SecurityChecklistWidget.jsx](file:///c:/Users/yo/Pictures/Descargaspc/0a/webayudatra/src/components/trading/SecurityChecklistWidget.jsx): Checklist pre-market que Emilio debe completar antes de activar la operativa en el broker.
*   [BingXWidget.jsx](file:///c:/Users/yo/Pictures/Descargaspc/0a/webayudatra/src/components/trading/BingXWidget.jsx): Visualizador en tiempo real de su capital de trading conectado a la Edge Function de Supabase.

---

## 6. Estado Actual de la Estabilización (Hotfixes de la Versión)

El portal se encuentra completamente estable y testeado con las siguientes mejoras críticas de fiabilidad aplicadas:
1.  **Protección de Ámbito (Scope Fix)**: Se corrigió un `ReferenceError` causado por variables de renderizado y funciones de navegación mensual (`generateYearData`, `handlePrevMonth`, `handleNextMonth`) acotadas erróneamente dentro de bloques locales de `try-catch`. Ahora están correctamente declaradas a nivel de componente.
2.  **Desestructuración de Calendario**: Corregido un `ReferenceError: efeIncome is not defined` mediante la correcta desestructuración de las propiedades del objeto `dayObj` (`efeIncome`, `fixedExpense`, `pnlEur`) en el mapeado de celdas del calendario.
3.  **Aislamiento de Errores de Render**: Todo el return JSX de `ViabilityWidget` y sus cálculos matemáticos se encuentran envueltos en un try-catch de renderizado robusto. Si hay inconsistencias en la base de datos o listas vacías de deudas, en lugar de crasear la pestaña Deudas en negro, la aplicación captura el error e informa amigablemente en pantalla el stack trace del fallo.

---

## 7. Directivas de Desarrollo Críticas (Antigravity Core Rules)

*   **PROHIBICIÓN ABSOLUTA DE SIMULACIONES O RETARDOS FICTICIOS**: Ningún pipeline de procesamiento de datos, OCR, transcripción o inferencia clínica de IA debe contener retardos artificiales simulados (`setTimeout` para simular esperas) ni respuestas prefijadas cableadas en código (mocks fijos).
*   **PROCESAMIENTO REAL E INSTANTÁNEO**: El análisis de archivos debe realizarse de forma inmediata. Si es un archivo de texto, se leerá su contenido real con `FileReader` y se parseará dinámicamente usando expresiones regulares y NLP para extraer medicamentos y eventos reales del paciente. Si es binario (imagen, PDF, audio), el motor extraerá los datos de sus metadatos reales (como el nombre del archivo, su tamaño y tipo) sin simular información ficticia que confunda.
*   **VISIBILIDAD Y CONSOLIDACIÓN REACTIVA**: Para evitar que el historial clínico del paciente se vea vacío tras subir información, las propuestas de la IA deben mostrarse directamente tanto al terapeuta en su dashboard como al paciente en su portal, permitiendo la consolidación inmediata de propuestas en caliente desde el propio portal del paciente.
