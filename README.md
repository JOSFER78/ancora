# ÁNCORA ⚓ (Plataforma Híbrida de Telepsicología con IA Supervisada)

Áncora es una solución tecnológica avanzada y un ecosistema clínico diseñado para optimizar el seguimiento terapéutico en España. Su modelo se basa en un enfoque **Human-in-the-Loop (Copiloto Clínico)**, donde la Inteligencia Artificial asiste en tareas administrativas y de seguimiento diario, mientras que el diagnóstico, la validación y el criterio final recaen exclusivamente en psicólogos colegiados habilitados sanitariamente.

---

## 🚀 Propuesta de Valor y Características Clave

### 1. Privacidad Extrema y Soberanía de Datos
La inferencia de modelos de lenguaje se procesa de forma local en servidores dedicados bajo control directo de la plataforma. Esto garantiza el estricto cumplimiento del RGPD europeo y el secreto profesional médico, impidiendo que los datos sensibles de los pacientes alimenten APIs comerciales extranjeras.

### 2. Triaje y Onboarding Inteligente
Flujo conversacional empático asistido por IA que integra de forma contextual los cuestionarios estandarizados **PHQ-9** (Cribado de Depresión) y **GAD-7** (Cribado de Ansiedad). Clasifica los niveles de riesgo del paciente (Leve, Moderado, Grave) y determina si es apto para el seguimiento asíncrono o requiere derivación obligatoria síncrona.

### 3. Panel Clínico "Raw-First" (Evitación del Sesgo)
Para prevenir el sesgo de automatización y el efecto anclaje de los terapeutas, el panel de control del psicólogo implementa una interfaz de 3 niveles:
*   **Datos Crudos (Nivel 1)**: Visualización neutra de variables cuantitativas, wearables (sueño, pasos, HRV) y citas textuales (*verbatim*) críticas del chat diario.
*   **Análisis Interpretativo de IA (Nivel 2)**: Oculto bajo un filtro difuminado *glassmorphism* que solo se desbloquea cuando el terapeuta ha revisado los datos objetivos. Ofrece análisis conductuales configurables (TCC, ACT).
*   **Disonancia de Datos (Nivel 3)**: Mapeo de contradicciones entre el diario declarado por el paciente y sus métricas objetivas (ej. insomnio real vs. reporte emocional positivo).

### 4. Smart SOAP & Productividad
Reducción de tareas administrativas del terapeuta mediante la generación asistida por IA local de **Notas SOAP** e informes evolutivos a partir de las transcripciones y resúmenes diarios del chat del paciente, ahorrando hasta un 40% de tiempo de gestión clínica.

### 5. Retorno Asíncrono de Alta Rentabilidad
El terapeuta realiza devoluciones clínicas estructuradas de 15 minutos a través de **Video-Briefings** rápidos con soporte de teleprompter inteligente integrado, firmados con un código PIN de 4 dígitos, lo que incrementa su rentabilidad horaria asíncrona a una tasa equivalente de **60 €/hora**.

---

## 💳 Modelo de Suscripción y Stripe Connect Split Payments

Para garantizar la viabilidad fiscal y laboral en España, los flujos económicos se dividen en origen mediante **Stripe Connect**:
*   **Onboarding y Diagnóstico**: 99,00 € (promocionado a 49,00 € con cupón de bienvenida).
*   **Planes de Suscripción Individual**:
    - **Plan Esencial**: 69 €/mes.
    - **Plan Intermedio**: 99 €/mes.
    - **Plan Intensivo**: 159 €/mes.
*   **Planes Grupales**: Duo (240 €/mes) y Familiar (380 €/mes).
*   **Facturación Split**: El psicólogo factura directamente la parte clínica exenta de IVA al paciente, y la plataforma factura la tarifa informática de software sujeta al 21% de IVA.

---

## 🛠️ Stack Tecnológico

*   **Frontend**: React 19 + Vite (JavaScript ES Modules).
*   **Diseño Visual**: Vanilla CSS con la especificación "Mente Sana UI" (colores pastel relajantes, tipografías sin serifa espaciadas, glassmorphism e iluminación reactiva).
*   **Base de Datos**: Supabase PostgreSQL con Row Level Security (RLS) activo para aislamiento de roles de pacientes, psicólogos y supervisores.
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
