# ⚓ Estudio Independiente: Viabilidad Legal, Marco Regulatorio y Riesgos de la IA en Psicología

**Ubicación:** `docs/06_estudio_viabilidad_legal_y_riesgos_ia/RESUMEN_VIABILIDAD_Y_RIESGOS_CLINICOS.md`  
**Estado:** Estudio de Análisis e Investigación Independiente.  
**Fuentes analizadas:** `analisis_viabilidad_completo.md`, `informe_viabilidad_app_psicologica.html`, `informe_uso_ia_como_psicologo.md`, `mas info_ IA como Terapeuta_ Peligros y Ancora.md` y directrices del Consejo General de la Psicología de España.

---

## 1. Resumen Ejecutivo: ¿Qué es Viable y Qué es Peligroso?

El análisis exhaustivo de los documentos extraídos de `docs/analizar` arroja una conclusión categórica para el desarrollo actual de Áncora:

> **La IA NO puede ni debe actuar como "terapeuta independiente".**  
> Intentar sustituir al psicólogo colegiado con un modelo de lenguaje conlleva **riesgos legales severos (intrusismo profesional, responsabilidad penal por suicidio o mala praxis)** y una alta ineficacia terapéutica.
> 
> **La ÚNICA vía viable y legalmente protegida es Áncora como Sistema de Memoria y Soporte Continuo (Copiloto):**
> 1. El psicólogo colegiado ostenta la titularidad, el diagnóstico y la dirección del tratamiento.
> 2. La IA actúa estrictamente como herramienta de memoria viva, registro diario y aplicación de técnicas de contención somática autorizadas previamente por el profesional.

---

## 2. Los 4 Grandes Riesgos Clínicos y Deontológicos Detectados

### Riesgo 1: Complacencia y Validación de Delirios / Distorsiones
- **El Peligro:** Los LLMs convencionales tienden a ser complacientes (*sycophancy*) y dan la razón al usuario para sonar amables, lo que en trastornos obsesivos o paranoicos puede reforzar la patología.
- **La Solución en Áncora:** Directiva de Cero Complacencia en el System Prompt y neutralidad fenomenológica (registrar *"el paciente expresa..."*, nunca *"es verdad que todos te odian"*).

### Riesgo 2: Detección Tardía de Ideación Autolítica (Riesgo de Suicidio)
- **El Peligro:** Un chatbot plano que responde con metáforas poéticas ante una crisis suicida genera responsabilidad legal directa.
- **La Solución en Áncora:** Módulo de Interbloqueo de Seguridad (*Circuit Breaker de Riesgo*) que suspende el diálogo estándar y muestra los teléfonos de emergencia oficiales (024 en España) notificando de inmediato al psicólogo responsable.

### Riesgo 3: Intrusismo Profesional y Regulación Sanitaria Europea (MDR / AI Act)
- **El Peligro:** Calificar la aplicación como "dispositivo médico de diagnóstico" sin certificación CE según el Reglamento de Productos Sanitarios (MDR) o la Ley Europea de IA (AI Act - Categoría de Alto Riesgo).
- **La Solución en Áncora:** Definición jurídica como **"Software de Gestión de Memoria y Seguimiento Asistido para Profesionales Sanitarios"**, donde la decisión clínica siempre recae en el psicólogo colegiado.

### Riesgo 4: Fuga de Datos de Salud y Vulneración del RGPD (Art. 9)
- **El Peligro:** Los datos de salud mental son datos de categoría especial (Art. 9 RGPD). Su uso para reentrenar modelos comerciales (como OpenAI o Anthropic sin BAA) es ilegal en la UE.
- **La Solución en Áncora:** Cifrado en reposo y tránsito, aislamiento multitenant y ejecución de modelos en servidores europeos o con acuerdos de confidencialidad médica BAA/DPA.

---

## 3. Matriz de Decisiones para la App Actual

| Funcionalidad | ¿Viable Legalmente? | Requisito Técnico Obligatorio |
| :--- | :--- | :--- |
| **Chat diario de desahogo y contención** | ✅ **SÍ** | La IA no emite diagnósticos; aplica ejercicios de respiración pautados. |
| **Generación de notas SOAP automáticas** | ✅ **SÍ** | Siempre en borrador (*Draft*); el psicólogo debe revisar y firmar. |
| **Árbol Vital (Life Tree)** | ✅ **SÍ** | Consentimiento explícito del paciente para estructuración biográfica. |
| **Diagnóstico automatizado por IA** | ❌ **NO (Prohibido)** | Exclusivo del psicólogo con número de colegiado. |
| **Modificación de pautas farmacológicas** | ❌ **NO (Prohibido)** | Exclusivo del médico psiquiatra. |
