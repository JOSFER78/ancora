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

Áncora no prohíbe el uso de la IA (reconociendo su conveniencia y disponibilidad de 24 horas todos los días), sino que la canaliza de manera segura y controlada dentro de un marco clínico profesional:

1.  **Acompañamiento Diario Estructurado**: El paciente dispone de un diario emocional y chat terapéutico asistido por IA para desahogarse, estructurar hábitos y registrar sus sensaciones clínicas diariamente (un servicio económico y accesible en cualquier momento).
2.  **Acceso Democrático a Soporte Humano Real**: En lugar de pagar sesiones semanales completas de 50 minutos que son costosas, la IA consolida y estructura la información diaria del paciente. Esto permite a un **psicólogo real de nuestra red** realizar una revisión clínica exhaustiva del estado del paciente en **revisiones semanales rápidas de 15 minutos** por una fracción del precio tradicional, haciendo viable el acceso a soporte humano profesional constante por poco dinero.
3.  **Prevención del Sesgo Clínico (Raw-First)**: El portal del profesional implementa un bloqueo visual *glassmorphism* que le obliga a leer los datos objetivos del paciente (horas de sueño, wearables, citas textuales críticas del chat) antes de revelar las interpretaciones del modelo de IA, previniendo el efecto anclaje y el sesgo de automatización diagnóstica.

---

## 🚀 Módulos Clave de la Plataforma

*   **Triaje Inicial Contextual**: Incorporación camuflada y empática de cuestionarios psicométricos estandarizados (**PHQ-9** y **GAD-7**).
*   **Smart SOAP**: Transcripción y redacción automatizada asistida por IA local de informes SOAP y evolución para ahorrar hasta un 40% de tiempo administrativo al psicólogo.
*   **Video-Briefing con Teleprompter**: Permite al psicólogo grabar su evolución clínica en vídeo de forma ágil apoyado en un teleprompter inteligente con los hitos de la semana del paciente.
*   **Disonancia de Datos**: Panel de control de alertas automáticas cuando la IA detecta contradicciones entre la narrativa del diario declarado del paciente y sus métricas objetivas (ej. reporta sentirse bien pero registra insomnio real severo).

---

## 💳 Modelo de Negocio e Integración con Stripe Connect Split Payments

Para asegurar la exención del IVA clínica en España y evitar contingencias laborales (evitando falsos autónomos), los cobros se dividen automáticamente en origen mediante **Stripe Connect**:
*   **Onboarding y Diagnóstico Inicial**: 99,00 € (promocionado a 49,00 € con cupón de bienvenida).
*   **Planes de Suscripción Individual**:
    - **Plan Esencial (Mínimo de Seguridad)**: 69 €/mes. Es el plan de entrada obligatorio para garantizar el uso de la plataforma y **dos supervisiones de 15 minutos con un psicólogo colegiado**. Es el estándar mínimo de protección clínica necesario para que los usuarios estén protegidos con diagnósticos, validación y supervisión humana del contenido y progreso de lo que interactúan y hablan con la IA, mitigando los riesgos del autotratamiento autónomo.
    - **Plan Intermedio**: 99 €/mes.
    - **Plan Intensivo**: 159 €/mes.
*   **Planes Grupales**: Duo (240 €/mes) y Familiar (380 €/mes).
*   **Facturación Split**: El psicólogo factura directamente al paciente el servicio clínico (exento de IVA) y la plataforma factura la tarifa informática de software (sujeta al 21% de IVA).

---

## 🧠 Arquitectura de IA Local y Servidores Propios

Para garantizar una confidencialidad médica absoluta y cumplir con el RGPD europeo y el Esquema Nacional de Seguridad (ENS), Áncora no utiliza APIs comerciales extranjeras que puedan comprometer la intimidad de los pacientes. La inferencia se realiza localmente en servidores de hardware propio dedicados.

### 🖥️ Infraestructura GPU Proporcional ("Pepino GPU")
*   **Servidor de Inferencia Física**: Estación de trabajo equipada con **2x GPUs NVIDIA GeForce RTX 4090 (48GB VRAM total)**, procesador AMD Ryzen 9 9950X (16 núcleos) y 128GB de memoria RAM DDR5.
*   **Paralelización de Inferencia (vLLM)**: Se utiliza el motor **vLLM** configurado con **Tensor Parallelism (TP=2)** y *PagedAttention* para dividir y ejecutar los LLMs de manera síncrona en ambas GPUs a través de memoria compartida local (`FI_PROVIDER="shm"`), minimizando la latencia a <1.5 segundos.
*   **Indexación Semántica y RAG**: La base de datos vectorial **Qdrant** se ejecuta en local sobre la CPU y memoria RAM (ocupando ~2GB de RAM), reservando la preciada VRAM de las GPUs exclusivamente para la inferencia de modelos masivos (modelos de 70B/72B parámetros y transcripción local con Whisper).

### ⚙️ Gestión de Carga y Optimización del Ancho de Banda
*   **Reserva de Franjas Horarias**: Para evitar la saturación de los servidores locales, los usuarios reservan bloques de chat de 15 minutos diarios acumulables en la app. El sistema soporta un límite seguro de **10 usuarios simultáneos por bloque de 15 minutos por servidor (PC)**.
*   **Colas de Prioridad Asíncronas**: Los mensajes no planificados o adquiridos con créditos gratuitos se gestionan mediante colas de prioridad baja en **Redis y BullMQ**. Si el servidor físico está lleno, el mensaje espera en cola y la UI notifica de forma transparente: *"Servidores a alta capacidad. Procesando en cola de espera..."*.
*   **Escalabilidad a Data Center (1.000+ DAU)**: Al superar los 1.000 usuarios activos diarios (generando ingresos de ~40.000 €/mes), la granja de servidores locales se migrará a **servidores dedicados Bare Metal GPU** en un centro de datos especializado en España (como OVHcloud Madrid o hosting nacional), eliminando la complejidad eléctrica de casa y asegurando la soberanía de los datos a nivel nacional.

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

