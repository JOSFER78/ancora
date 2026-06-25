# ÁNCORA ⚓ (Plataforma Híbrida de Telepsicología con IA Supervisada)

Áncora es un ecosistema clínico diseñado para optimizar el seguimiento terapéutico. Nace como respuesta directa a los peligros emergentes del uso descontrolado de Inteligencia Artificial en salud mental, proponiendo una arquitectura híbrida **Human-in-the-Loop (Copiloto Clínico)**: la IA actúa como soporte de contención diario y procesador de datos, mientras que el diagnóstico, la validación y el criterio final recaen exclusivamente en psicólogos humanos colegiados.

---

## 🚨 El Problema: Los Riesgos de la IA Terapéutica Autónoma

En la actualidad, millones de personas utilizan modelos de lenguaje de propósito general (como ChatGPT o bots de rol) como sustituto de terapia debido al coste prohibitivo y la falta de acceso a la salud mental. Sin embargo, la psicología clínica advierte de graves riesgos asociados a esta práctica autónoma sin supervisión profesional:

*   **Complacencia y Refuerzo del Síntoma (Cámara de Eco)**: A diferencia de un terapeuta humano que confronta los pensamientos disfuncionales, las IAs están programadas para ser complacientes y agradables (*agreeable*), lo que suele validar y reforzar distorsiones cognitivas, conductas de evitación y sesgos perjudiciales del paciente.
*   **Incapacidad ante Crisis Clínicas Graves**: La IA carece de empatía afectiva y no puede percibir el lenguaje no verbal ni la entonación. En casos críticos de ideación autolesiva o crisis severas, los chatbots de IA pueden emitir respuestas erráticas, inapropiadas o potencialmente peligrosas.
*   **Vulneración Absoluta de la Privacidad (RGPD)**: Las conversaciones íntimas mantenidas con IAs comerciales quedan almacenadas en servidores de corporaciones extranjeras para alimentar modelos de entrenamiento, violando el secreto profesional médico y la ley europea de protección de datos de salud.
*   **Relaciones Parasociales y Aislamiento**: Los usuarios pueden desarrollar dependencias emocionales artificiales con los chatbots, lo que retrasa o reemplaza por completo la búsqueda de terapia humana real y la reconexión social.

---

## ⚓ La Solución de Áncora: El Copiloto Clínico Híbrido

Áncora no prohíbe el uso de la IA (reconociendo su conveniencia y disponibilidad de 24 horas todos los días), sino que la canaliza de manera segura y controlada dentro de un marco clínico profesional que ofrece ventajas determinantes para ambas partes:

### 👥 Ventajas Clínicas para el Paciente
*   **Continuidad Asistencial (Acompañamiento 24/7)**: Elimina la desasistencia emocional entre las sesiones presenciales semanales. El paciente dispone de un diario interactivo asistido por IA para el manejo cognitivo-conductual (TCC) en tiempo real ante picos de ansiedad.
*   **Sin el Desgaste de "Repetir la Historia"**: La IA consolida y estructura de forma asíncrona sus hitos emocionales e interacciones diarias en un **Árbol de Vida Clínica (Clinical Life Tree)** y una línea de tiempo unificada. De este modo, el terapeuta conoce a fondo la evolución del paciente antes de la sesión, evitando que el usuario tenga que desgastarse repitiendo su historia clínica constantemente.
*   **Privacidad Extrema Zero-Knowledge**: La inferencia se ejecuta localmente en servidores de hardware propio dedicados, lo que impide que las conversaciones íntimas del paciente alimenten APIs comerciales extranjeras. Todo el historial se protege bajo llaves derivadas del cliente (Argon2id).
*   **Acceso Democrático a Profesionales**: Facilita la supervisión periódica de un psicólogo humano real colegiado (a través de revisiones rápidas asíncronas) desde planes sumamente accesibles, reduciendo la vulnerabilidad al autotratamiento desatendido de los chatbots de IA.

### 🩺 Ventajas Operativas para el Psicólogo
*   **Eficiencia de Tiempo Extrema (Smart SOAP)**: El sistema autogenera borradores de **Notas SOAP** e informes de progreso a partir de la síntesis del chat del paciente, reduciendo las tareas burocráticas administrativas en un 40%.
*   **Preclusión del Anclaje y Sesgo Diagnóstico**: El panel del terapeuta implementa un bloqueo visual *glassmorphic* (*Raw-First*) que le obliga a leer los datos cuantitativos reales y citas textuales (*verbatim*) antes de revelar los análisis y sugerencias semánticas del LLM, garantizando un juicio profesional libre de sesgos tecnológicos.
*   **Devolución Ágil asistida por Teleprompter**: El psicólogo graba un Video-Briefing de evolución de 5-10 minutos directamente desde la app, asistido por un teleprompter inteligente que le muestra de forma superpuesta las citas y métricas clave de la semana del paciente.
*   **Burocracia Cero y Split de Stripe**: Gestión automatizada de cobros y facturación exenta de IVA mediante Stripe Connect, eliminando costes administrativos de micro-cobros individuales.

---

## 💳 Modelo de Negocio y Estructura de Planes Clínicos

Para asegurar la exención del IVA clínica en España y cumplir con el régimen de Stripe Connect Split Payments, los cobros se estructuran en base al tipo de servicio prestado y supervisión requerida:

*   **Fase de Onboarding y Diagnóstico Inicial**: Sesión clínica de triaje y cribado que evalúa y clasifica al usuario en niveles de riesgo para asignarle el plan terapéutico adecuado.
*   **Planes de Suscripción Individual**:
    - **Plan Esencial (Mínimo de Seguridad)**: Garantiza el uso completo del diario interactivo y chat clínico con IA, respaldado por **dos supervisiones de 15 minutos mensuales con un psicólogo colegiado**. Es el estándar mínimo de protección clínica obligatorio para asegurar que el contenido que el paciente comparte con la IA sea auditado, corregido y validado bajo criterio clínico humano.
    - **Plan Intermedio**: Ofrece un mayor número de revisiones mensuales y un acompañamiento clínico de mayor frecuencia para perfiles de riesgo moderado.
    - **Plan Intensivo**: Diseñado para perfiles de alta demanda clínica, con revisiones prioritarias asíncronas constantes y feedback continuo.
*   **Planes Grupales (Duo / Familiar)**: Extienden la contención diaria con IA y las supervisiones periódicas del psicólogo a varios miembros de la unidad familiar.
*   **Facturación Split**: El flujo económico se divide en origen; el psicólogo factura directamente al paciente los servicios clínicos exentos de IVA, y la plataforma factura la tarifa informática por el soporte y uso del software.

---

## 🧠 Arquitectura de IA Local y Servidores Propios

Para garantizar una confidencialidad médica absoluta y cumplir con el RGPD europeo y el Esquema Nacional de Seguridad (ENS), Áncora no utiliza APIs comerciales extranjeras que puedan comprometer la intimidad de los pacientes. La inferencia se realiza localmente en servidores de hardware propio dedicados.

### 🖥️ Infraestructura de Servidores de IA (NVIDIA DGX Spark 128GB)
*   **Nodos de Inferencia**: Configuración de **4x Servidores IA NVIDIA DGX Spark (128GB de memoria unificada coherente - Grace Blackwell Superchip)**. El formato profesional de alto rendimiento y bajo consumo energético minimiza costes operativos sin comprometer la capacidad de procesamiento en local.
*   **Distribución por Zonas Horarias**:
    - **2x Servidores IA dedicados al horario de Europa**.
    - **2x Servidores IA dedicados al horario de Latinoamérica**.
*   **Distribución del Procesamiento (Modelos Día/Noche)**:
    - **Horario de Día (Chat Interactivo)**: Carga de **modelos ligeros y rápidos** optimizados para interacciones fluidas de baja latencia con el paciente en el diario y chat clínico.
    - **Horario de Noche (Procesamiento Asíncrono)**: Carga de **modelos pesados de razonamiento clínico** para realizar las tareas de síntesis del diario, extracción de hechos, briefings y redacción de informes SOAP para el terapeuta.

### ⚙️ Gestión de Carga y Optimización del Ancho de Banda
*   **Reserva de Franjas Horarias**: Para evitar la saturación de los servidores locales, los usuarios reservan bloques de chat de 15 minutos diarios acumulables en la app. El sistema soporta un límite seguro de **10 usuarios simultáneos por bloque de 15 minutos por nodo**.
*   **Colas de Prioridad Asíncronas**: Los mensajes no planificados o adquiridos con créditos gratuitos se gestionan mediante colas de prioridad baja en **Redis y BullMQ**. Si el servidor físico está lleno, el mensaje espera en cola y la UI notifica de forma transparente: *"Servidores a alta capacidad. Procesando en cola de espera..."*.
*   **Escalabilidad a Data Center (1.000+ DAU)**: Al superar los 1.000 usuarios activos diarios (generando ingresos de ~40.000 €/mes), la granja de servidores locales se migrará a **servidores dedicados Bare Metal GPU** en un centro de datos especializado en España (como OVHcloud Madrid o hosting nacional), eliminando la complejidad de refrigeración casera y asegurando la soberanía de los datos a nivel nacional.

---

## 🛠️ Stack Tecnológico

*   **Frontend**: React 19 + Vite (JavaScript ES Modules).
*   **Diseño Visual**: Vanilla CSS con la especificación "Mente Sana UI" (colores pastel relajantes, tipografías sin serifa espaciadas, glassmorphism e iluminación reactiva).
*   **Base de Datos**: Supabase PostgreSQL con Row Level Security (RLS) activo para aislamiento estricto de roles.
*   **Servicios Cloud & Edge**: Supabase Edge Functions (Deno) para integraciones de APIs clínicas, cifrado HMAC y orquestación de LLMs locales vía OpenRouter.

---

## 💻 Ejecución del Proyecto en Local

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar el servidor local:
   ```bash
   npm run dev
   ```
3. Abrir la URL en el navegador: [http://localhost:5180](http://localhost:5180)

---

## 📚 Referencias Científicas y Datos de Mercado

El diseño y filosofía clínica de Áncora están respaldados por investigaciones internacionales y dictámenes sobre el impacto de la Inteligencia Artificial en la salud mental:

*   **Estudio sobre Adopción y Demanda Emocional (APA)**: Análisis de la prevalencia del uso de chatbots comerciales para soporte afectivo. El 77% de los profesionales de la salud mental informan que sus pacientes recurren a herramientas de IA. Fuente: [APA Monitor: AI & Emotional Support](https://www.apa.org/monitor/2024/04/artificial-intelligence-emotional-support).
*   **Dictamen sobre Complacencia y el Efecto Eco (Stanford Medicine)**: Investigación sobre cómo la programación afirmativa de las IAs comerciales valida y cronifica las distorsiones cognitivas y conductas de evitación de los usuarios. Fuente: [Stanford University: Risks of AI Chatbots in Mental Health](https://med.stanford.edu/news/all-news/2023/06/ai-chatbots-mental-health.html).
*   **Auditoría de Ética, Privacidad y Límites de la IA (Columbia & NIH)**: Evaluación de la vulneración del secreto profesional médico y de las brechas del RGPD al alimentar APIs de terceros con diálogos íntimos. Fuente: [National Institutes of Health (NIH): Ethics of AI Chatbots in Mental Health](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10153835/).
*   **Análisis sobre Relaciones Parasociales y Aislamiento (The Guardian)**: Reporte sobre la dependencia artificial y cómo interactuar únicamente con bots de rol terapéuticos retrasa la búsqueda de ayuda profesional humana real. Fuente: [The Guardian: Chatbots as Therapists and Patient Risks](https://www.theguardian.com/technology/2023/mar/03/chatbots-mental-health-therapy-ai).

