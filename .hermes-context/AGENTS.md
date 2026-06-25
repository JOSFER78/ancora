# Contexto del Agente: Áncora (Terapia y Seguimiento Clínico)

Este archivo define las directrices del proyecto y el contexto operativo para que el agente **Hermes** se focalice al 100% en las tareas de desarrollo clínico del ecosistema Áncora.

---

## 🎯 Metas del Proyecto
Áncora es una plataforma web premium de seguimiento terapéutico para psicólogos y pacientes. Sus funcionalidades clave son:
1. **Agenda Interactiva Avanzada:** Interfaz de calendario en tiempo real (vistas mensual, semanal, diaria) inspirada en la usabilidad y estética de Google Calendar.
2. **Historial Clínico (Paciente 360):** Ficha clínica detallada con antecedentes, sesiones previas y metas terapéuticas.
3. **Notas SOAP Inteligentes:** Generación y edición semi-automatizada asistida por IA de notas SOAP (Subjetivo, Objetivo, Análisis, Plan) tras cada consulta.
4. **Sala de Briefing/Videollamada:** Preparación rápida de la sesión e integración de herramientas de teleterapia.

---

## 💻 Stack Tecnológico
- **Frontend:** React + Vite, TailwindCSS, Icons (Lucide-react), componentes interactivos modulares.
- **Backend / Base de Datos:** Supabase (PostgreSQL) con políticas de seguridad Row Level Security (RLS) estrictas para proteger la confidencialidad de los datos médicos.
  - Tablas clave: `appointments` (citas), `patients` (perfiles de pacientes), `soap_notes` (registros SOAP), `psychologists` (profesionales).

---

## ⚠️ Reglas de Desarrollo y Buenas Prácticas
1. **Seguridad y Privacidad (HIPAA / RGPD):** No exponer datos personales de pacientes (PII) en logs ni prompts. Las consultas a Supabase deben estar siempre filtradas por el ID del psicólogo autenticado.
2. **Aislamiento de Lógica:** La comunicación con la base de datos Supabase debe encapsularse en servicios aislados (ej. `src/services/supabase.js`) y no inyectarse directamente en los componentes de vista.
3. **Estética Visual Premium:** Mantener el sistema de diseño premium, bordes redondeados suaves, colores translúcidos, tipografías Inter/Outfit y micro-animaciones en los botones de la agenda y modales.
4. **Manejo de Errores de API:** Todas las llamadas asíncronas deben incluir bloques `try/catch` detallados con toasts visuales de error para que el psicólogo conozca el estado de la operación.
