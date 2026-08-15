# 21 · README recomendado para el repo reconstruido

> Este documento es una propuesta de README para sustituir el actual cuando el repo esté limpio y alineado con la arquitectura final.

# Áncora ⚓

Áncora es una plataforma de continuidad terapéutica con IA supervisada por profesionales. Su objetivo es convertir conversaciones, documentos, diarios emocionales, sesiones y revisiones en una memoria clínica viva, estructurada y útil para paciente y psicólogo.

La IA de Áncora no diagnostica, no prescribe y no sustituye al psicólogo. Organiza, resume, detecta señales, prepara contexto y genera propuestas revisables. El criterio clínico final pertenece siempre al profesional humano.

## Producto

Áncora ayuda a que la terapia tenga memoria entre sesiones:

- el paciente registra lo que le ocurre;
- sube informes, documentos, notas o audios;
- la IA extrae información estructurada con evidencia;
- el paciente puede confirmar o rectificar datos declarados;
- el psicólogo valida lo clínicamente relevante;
- Patient 360 muestra al profesional el contexto completo en capas;
- el sistema genera briefings y borradores SOAP revisables;
- la memoria mejora con cada interacción.

## Principios clínicos

- Human-in-the-loop.
- IA como asistente, no terapeuta autónomo.
- Evidencia antes que interpretación.
- Separación entre hechos, citas, inferencias y decisiones clínicas.
- Jerarquía de autoridad: psicólogo validado > documento > paciente declarado > IA inferido.
- Privacidad por diseño.
- Protocolos de crisis conservadores.

## Roles

- Paciente.
- Psicólogo.
- Admin clínica/plataforma.
- DPO/compliance.
- Soporte técnico con acceso limitado.

## Arquitectura

```text
Frontend React/PWA
  ↓
API / Supabase Edge Functions
  ↓
Clinical Engine
  ↓
PostgreSQL + Storage + Vector index
  ↓
Model Gateway
  ↓
LLM local / cloud privada / proveedor dev
```

## Módulos principales

```text
src/
  app/
  shared/
  domain/
    clinical/
    memory/
    risk/
    appointments/
    billing/
  features/
    public-web/
    onboarding/
    patient-app/
    psychologist-panel/
    admin-console/
  integrations/
    supabase/
    model-gateway/
supabase/
  migrations/
  functions/
```

## Flujos críticos

### Documento → memoria

1. Upload seguro.
2. Extracción de texto.
3. Clasificación documental.
4. Extracción clínica JSON.
5. Evidencias y citas literales.
6. Propuestas IA.
7. Validación paciente/psicólogo.
8. Consolidación en memoria.
9. Reindexación y snapshot.

### Chat → memoria

1. Safety pre-check.
2. Context harness.
3. Respuesta limitada.
4. Guardado seguro.
5. Extracción post-turn/post-session.
6. Daily summary.
7. Propuestas y alertas.
8. Patient 360.

## Desarrollo local

```bash
npm install
npm run dev
```

Variables necesarias:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MODEL_PROVIDER=openrouter_dev|local_vllm|private_eu_cloud
OPENROUTER_API_KEY=
```

No subir `.env.local`, datos clínicos, documentos reales, logs ni claves privadas.

## Seguridad

- RLS obligatorio.
- Cifrado en tránsito y reposo.
- Logs sin contenido clínico.
- Auditoría de accesos.
- Consentimientos versionados.
- Break-glass auditado.
- Entornos separados: demo, staging, producción.

## Estado del proyecto

Este repositorio debe considerarse producto sanitario en construcción. No usar en producción con pacientes reales hasta completar:

- limpieza de datos sensibles;
- migraciones alineadas;
- RLS validada;
- contratos clínicos;
- tests con fixtures sintéticos;
- revisión legal/DPO;
- revisión clínica de prompts y riesgos.
