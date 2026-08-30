# Áncora ⚓ - Plataforma Clínica y Acompañamiento Psicológico Inteligente

Este documento describe la arquitectura oficial, los componentes del sistema y las integraciones de **Áncora**.

---

## 1. Misión y Propósito Clínico
Áncora es un ecosistema integral de salud mental y acompañamiento terapéutico que conecta a pacientes con psicólogos clínicos colegiados, potenciado por un motor de Inteligencia Artificial para la anamnesis progresiva, la estructuración de expedientes 360° y la asistencia continuada sin etiquetas patologizantes.

---

## 2. Arquitectura Tecnológica Oficial

### Frontend
- **Framework**: React 19 (Vite) + ES Modules.
- **Estilos**: Vanilla CSS con variables de diseño Dark Glassmorphic, transparencias profundas (`#051A2C`), tipografía limpia y acentos cian (`var(--color-cyan)`) y esmeralda (`var(--color-emerald)`).
- **Iconografía**: `lucide-react`.
- **Despliegue**: **Firebase Hosting** / Multiplataforma Web + Android (Capacitor).

### Base de Datos y Autenticación
- **Google Cloud Firestore**:
  - `profiles`: Expediente de usuario, roles (`paciente`, `psicologo`, `supervisor`), contexto terapéutico y ficha clínica.
  - `clinical_documents`: Historial de documentos médicos, analíticas y recetas analizados.
  - `clinical_life_tree`: Árbol vital organizado en 6 dimensiones.
  - `timeline_events`: Línea cronológica de hitos vitales y episodios.
  - `medications`: Registro farmacológico activo y pautas.
  - `clinical_episodes`: Episodios y hallazgos con validación clínica.
  - `chat_conversations` / `messages`: Mensajería terapéutica cifrada.
  - `appointments`: Agenda y reservas de citas con psicólogos colegiados.
  - `daily_moods`: Registro diario de estado de ánimo y regulación.
- **Firebase Auth**:
  - Autenticación con email/contraseña y Google OAuth vía SDK oficial de Firebase.

### Motor de Inteligencia Artificial
- **Gateway**: **FreeLLMAPI** (`https://143-47-35-167.sslip.io/pro/freellmapi/v1`).
- **Capacidades**:
  - Chat Terapéutico Socrático y Empático (`chatTerapeuta.js`).
  - Extracción Documental y Formulación Clínica Multimodal (`aiService.js`).
  - Detección de Dudas y Sonsacado Progresivo para complementar la historia de vida del paciente.
