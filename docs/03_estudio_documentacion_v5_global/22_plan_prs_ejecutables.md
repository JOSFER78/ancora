# 22 · Plan de PRs ejecutables para convertir el repo en producto real

## Objetivo

Este documento convierte la auditoría del repo en una secuencia de Pull Requests pequeños, revisables y ejecutables.
La idea no es “arreglarlo todo a la vez”, sino transformar el borrador actual en una plataforma clínica mantenible.

El repo actual tiene una base útil de frontend, Supabase, Edge Functions, motor clínico inicial, landing y pantallas, pero todavía mezcla:

- producto sanitario real,
- demo comercial,
- módulos personales,
- trading/deudas/INSS,
- mocks,
- datos locales,
- Supabase real,
- OpenRouter,
- promesas de IA local,
- componentes demasiado grandes.

La prioridad es crear una base limpia donde la intención de Áncora quede clara: **terapia accesible, guiada, con memoria persistente y supervisión humana**.

---

## Orden recomendado de PRs

### PR 0 — Congelar el borrador y crear rama de reconstrucción

**Objetivo:** conservar el prototipo actual como referencia, pero no seguir construyendo encima sin limpieza.

**Acciones:**

- Crear rama `legacy/prototipo-actual`.
- Crear rama `main-rebuild` o `rebuild/product-core`.
- Etiquetar el estado actual como `prototype-2026-06`.
- Añadir `docs/legacy-notes.md` explicando qué partes se rescatan y qué partes se eliminan.

**Definition of Done:**

- El prototipo queda disponible para consulta.
- La rama de reconstrucción parte con una hoja de ruta clara.
- Nadie añade nuevas features clínicas al prototipo sin pasar por la nueva estructura.

---

### PR 1 — Limpieza de identidad, estructura y módulos ajenos al producto clínico

**Objetivo:** separar Áncora de módulos que no pertenecen al producto sanitario.

**Eliminar o mover fuera de producción:**

- `src/views/TradingView.jsx`
- `src/components/trading/*`
- `tradingview-mcp/*`
- scripts de BingX, TradingView y Telegram que no sean necesarios para Áncora.
- tablas, queries y UI de `debts`, `debt_payments`, trading, INSS y módulos personales.
- lógica especial hardcodeada para usuarios concretos.

**Mover a carpeta no productiva si se quiere conservar:**

```text
_archive/personal-tools/
_archive/trading-experiments/
_archive/legacy-demo/
```

**Cambios concretos:**

- `src/appConfig.js`: eliminar `PERSONAL_NAV_ITEMS` del producto clínico.
- `src/App.jsx`: eliminar `showPersonalModules`, `fetchTotalDebts`, `replaceMonetaryValues`, estados de deudas y módulos personales.
- `src/App.css` / `src/index.css`: limpiar clases relacionadas con trading/deudas si ya no se usan.

**Definition of Done:**

- La navegación solo muestra rutas de Áncora clínica.
- Ningún usuario nuevo ve módulos de trading, deudas, INSS o herramientas personales.
- El proyecto se puede presentar a un psicólogo o desarrollador sin confusión de propósito.

---

### PR 2 — Rehacer routing y layout base

**Objetivo:** dejar de usar `activeTab` como router principal y crear rutas explícitas.

**Recomendado:** instalar `react-router-dom` o definir un router propio sencillo.

**Rutas públicas:**

```text
/
/pacientes
/psicologos
/psicologos/:slug
/precios
/seguridad
/faq
/login
/registro
```

**Rutas paciente:**

```text
/app/hoy
/app/chat
/app/diario
/app/timeline
/app/historia
/app/documentos
/app/sesiones
/app/plan
/app/privacidad
```

**Rutas psicólogo:**

```text
/pro/dashboard
/pro/pacientes
/pro/pacientes/:patientId
/pro/pacientes/:patientId/raw
/pro/pacientes/:patientId/analisis
/pro/pacientes/:patientId/documentos
/pro/pacientes/:patientId/timeline
/pro/pacientes/:patientId/soap
/pro/agenda
/pro/pagos
/pro/perfil
```

**Rutas admin:**

```text
/admin/dashboard
/admin/psicologos
/admin/usuarios
/admin/auditoria
/admin/soporte
/admin/ia
```

**Archivos nuevos sugeridos:**

```text
src/routes/PublicRoutes.jsx
src/routes/PatientRoutes.jsx
src/routes/PsychologistRoutes.jsx
src/routes/AdminRoutes.jsx
src/layouts/PublicLayout.jsx
src/layouts/AppLayout.jsx
src/layouts/ClinicalLayout.jsx
```

**Definition of Done:**

- Las rutas son copiables/compartibles.
- El botón atrás funciona en web y móvil.
- Los permisos se resuelven antes de renderizar vistas clínicas.

---

### PR 3 — Modelo de roles y permisos real

**Objetivo:** sustituir mocks y reglas hardcodeadas por un sistema RBAC/ABAC simple y seguro.

**Roles base:**

- `patient`
- `psychologist`
- `clinic_admin`
- `support`
- `compliance`
- `superadmin`

**Relaciones ABAC obligatorias:**

- Un psicólogo solo ve pacientes asignados.
- Un paciente solo ve sus datos.
- Un admin de soporte no ve contenido clínico por defecto.
- Un acceso break-glass exige motivo, caducidad y auditoría.

**Acciones:**

- Normalizar `profiles.role`.
- Crear `patient_psychologist_assignments`.
- Crear `clinics`, `clinic_members` si se quiere B2B.
- Eliminar `MOCK_PROFILES` del flujo productivo; mantenerlo solo en `demoFixtures`.

**Definition of Done:**

- No hay correos hardcodeados como fuente de permisos productivos.
- RLS impide leer datos de otro paciente aunque se manipule el frontend.
- Los permisos están testeados con usuarios paciente/psicólogo/admin.

---

### PR 4 — Landing y narrativa web final

**Objetivo:** que la web explique claramente qué hace Áncora antes de pedir registro.

**Mensaje principal:**

> Áncora hace que la terapia tenga memoria: seguimiento diario para pacientes, contexto organizado para psicólogos y criterio clínico siempre humano.

**Secciones:**

1. Hero: terapia con continuidad real.
2. Problema: la terapia se rompe entre sesiones; la IA autónoma es peligrosa.
3. Solución: IA supervisada + psicólogo humano + memoria persistente.
4. Para pacientes.
5. Para psicólogos.
6. Cómo funciona.
7. Marketplace/perfiles verificados.
8. Seguridad y privacidad.
9. Planes.
10. FAQ.
11. CTA final.

**Archivos afectados:**

- `src/views/LandingView.jsx`
- nuevos componentes en `src/features/public-site/components/*`
- `src/content/publicCopy.js`

**Definition of Done:**

- En 10 segundos se entiende qué es Áncora.
- No se vende “IA terapeuta”.
- Hay rutas separadas para paciente y psicólogo.
- Claims sanitarios quedan moderados y prudentes.

---

### PR 5 — Onboarding paciente completo

**Objetivo:** crear el flujo que convierte a un visitante en paciente con contexto clínico inicial.

**Pasos:**

1. Cuenta.
2. Consentimientos.
3. Motivo de consulta.
4. Triaje PHQ-9/GAD-7 si legalmente validado.
5. Riesgo y protocolo.
6. Selección de psicólogo o invitación.
7. Plan/pago.
8. Primera historia inicial.

**Archivos nuevos:**

```text
src/features/onboarding/PatientOnboardingFlow.jsx
src/features/onboarding/steps/ConsentStep.jsx
src/features/onboarding/steps/ReasonStep.jsx
src/features/onboarding/steps/TriageStep.jsx
src/features/onboarding/steps/RiskGateStep.jsx
src/features/onboarding/steps/PsychologistChoiceStep.jsx
src/features/onboarding/steps/PlanStep.jsx
```

**Definition of Done:**

- El usuario no entra al chat sin consentimientos mínimos.
- Si hay riesgo crítico, no se presenta la IA como solución autónoma.
- El psicólogo recibe un primer briefing antes de la primera sesión.

---

### PR 6 — Patient 360 v1 real

**Objetivo:** construir el núcleo diferencial del producto para el psicólogo.

**Capas:**

- 30 segundos: estado actual, riesgo, últimos cambios, próxima sesión, tareas.
- 5 minutos: timeline, citas, documentos relevantes, últimos resúmenes.
- Profundo: datos crudos, extracción, propuestas, SOAP, historia longitudinal.

**Componentes:**

```text
src/features/patient360/Patient360Page.jsx
src/features/patient360/components/QuickBriefCard.jsx
src/features/patient360/components/EvidenceCard.jsx
src/features/patient360/components/TimelinePanel.jsx
src/features/patient360/components/RiskPanel.jsx
src/features/patient360/components/ObjectivesPanel.jsx
src/features/patient360/components/ProposalsInbox.jsx
src/features/patient360/components/DocumentEvidencePanel.jsx
src/features/patient360/components/SessionPrepPanel.jsx
```

**Regla UX:**

El análisis IA puede aparecer, pero siempre con evidencia: cita literal, fuente, fecha, confianza, estado de validación y quién lo validó.

**Definition of Done:**

- Un psicólogo puede entender “qué mirar hoy” en 2 minutos.
- Cada insight tiene evidencia trazable.
- Las inferencias IA no sobrescriben datos validados.

---

### PR 7 — Pipeline de documentos y extracción clínica

**Objetivo:** que subir un archivo no sea “guardar un PDF”, sino actualizar la historia clínica viva.

**Flujo mínimo:**

1. Subida segura.
2. Registro `clinical_documents`.
3. Extracción de texto.
4. Clasificación documental.
5. Extracción JSON clínica.
6. Creación de propuestas.
7. Validación paciente/psicólogo.
8. Consolidación en memoria.

**Mejorar:**

- `src/lib/clinicalEngine.js`
- `supabase/functions/clinical-ingest/index.ts`
- migraciones de `clinical_documents`, `clinical_extractions`, `clinical_proposals`, `clinical_facts`.

**Definition of Done:**

- Un PDF/Word de prueba genera propuestas visibles.
- Las propuestas se pueden aceptar, editar o rechazar.
- Toda propuesta conserva fuente y cita literal.
- No se consolida una inferencia clínica sin estado de validación.

---

### PR 8 — Chat diario con memoria y cierre de sesión

**Objetivo:** que el chat actualice memoria, no solo responda mensajes.

**Flujo:**

1. Crear sesión de chat.
2. Validar plan/cuota/consentimiento.
3. Construir contexto con harness.
4. Responder con límites clínicos.
5. Guardar mensaje cifrado.
6. Al cerrar: extracción post-sesión.
7. Crear resumen diario.
8. Crear propuestas si hay hechos nuevos.
9. Activar riesgo si procede.

**Archivos afectados:**

- `src/views/ChatView.jsx` o nuevo `src/features/chat/*`
- `src/lib/chatTerapeuta.js`
- `supabase/functions/chat-terapeuta/index.ts`
- `supabase/functions/clinical-synthesize/index.ts`

**Definition of Done:**

- Una conversación produce resumen diario.
- El Patient 360 refleja cambios del chat.
- El psicólogo puede ver citas literales relevantes.
- Crisis no se responde como charla normal.

---

### PR 9 — Context Harness y RAG v1

**Objetivo:** crear la capa que decide qué contexto ve el modelo en cada llamada.

**Servicios:**

```text
src/server/ai/contextHarness.ts
src/server/ai/retriever.ts
src/server/ai/promptRegistry.ts
src/server/ai/policyGuard.ts
```

Si se mantiene Supabase Edge Functions, crear funciones separadas:

```text
supabase/functions/ai-context-harness/index.ts
supabase/functions/ai-retrieve/index.ts
supabase/functions/ai-policy-guard/index.ts
```

**Entradas del harness:**

- tarea,
- paciente,
- rol del solicitante,
- riesgo activo,
- consentimiento,
- memoria caliente,
- últimos resúmenes,
- chunks RAG,
- documentos relevantes,
- formato de salida.

**Definition of Done:**

- El frontend nunca llama directamente al modelo.
- Cada llamada IA queda registrada con versión de prompt, tarea y política aplicada, sin guardar contenido clínico en logs técnicos.
- El contexto se ajusta por token budget y permisos.

---

### PR 10 — Seguridad clínica, privacidad y auditoría

**Objetivo:** alinear el producto con su promesa de privacidad fuerte.

**Acciones:**

- Eliminar contenido clínico de logs.
- Activar RLS completo.
- Crear `audit_logs` append-only.
- Crear `consents` versionados.
- Crear `data_exports` y `delete_requests`.
- Documentar qué datos salen a proveedores IA si OpenRouter sigue activo temporalmente.
- Añadir “modo local futuro” sin mentir en producción.

**Definition of Done:**

- La promesa comercial coincide con la arquitectura real.
- Soporte no puede leer contenido clínico por defecto.
- Hay trazabilidad de accesos a datos sensibles.

---

### PR 11 — Dashboard del psicólogo y agenda

**Objetivo:** convertir el panel en herramienta de trabajo diaria.

**Widgets:**

- pacientes con revisión pendiente,
- alertas de riesgo,
- próxima sesión,
- cambios desde última sesión,
- tareas SOAP pendientes,
- agenda,
- ingresos/facturación,
- pacientes sin actividad.

**Definition of Done:**

- El psicólogo sabe qué hacer al abrir la app.
- Puede abrir Patient 360 en un clic.
- Puede preparar sesión y validar SOAP sin perderse.

---

### PR 12 — Smart SOAP y briefing de sesión

**Objetivo:** entregar el ahorro de tiempo que diferencia Áncora.

**Flujo:**

1. Recoger última sesión, chats recientes, documentos y objetivos.
2. Generar borrador SOAP.
3. Mostrar evidencia usada.
4. Psicólogo edita y valida.
5. Se guarda versión validada.
6. Se actualiza memoria longitudinal.

**Definition of Done:**

- El SOAP no se marca como clínico hasta validación.
- El borrador distingue subjetivo, objetivo, evaluación tentativa y plan.
- El psicólogo puede aceptar/editar/rechazar secciones.

---

### PR 13 — Tests, fixtures y datos demo seguros

**Objetivo:** poder probar sin datos personales reales.

**Acciones:**

- Crear `src/demo/fixtures/*` con pacientes ficticios.
- Eliminar datos personales reales del repo.
- Crear tests de RLS.
- Crear tests de crisis.
- Crear tests de extracción JSON.
- Crear tests de permisos paciente/psicólogo.

**Definition of Done:**

- El repo puede compartirse con desarrolladores sin datos sensibles.
- CI falla si se rompen permisos o políticas clínicas básicas.

---

## Priorización resumida

| Prioridad | PR | Motivo |
|---|---:|---|
| Crítica | 1 | Eliminar confusión y deuda no clínica |
| Crítica | 2 | Rutas y arquitectura frontend mantenible |
| Crítica | 3 | Seguridad por roles antes de crecer |
| Alta | 4 | Claridad comercial de la web |
| Alta | 6 | Diferenciador real: Patient 360 |
| Alta | 7 | Extracción clínica desde archivos |
| Alta | 8 | Chat que alimenta memoria |
| Alta | 9 | Context harness/RAG |
| Alta | 10 | Privacidad coherente con promesa |
| Media | 11 | Productividad del psicólogo |
| Media | 12 | Smart SOAP validable |
| Media | 13 | QA y demo segura |

---

## Regla de oro

No aceptar una feature nueva si no responde a esta cadena:

```text
Paciente aporta información
→ sistema extrae datos y evidencias
→ paciente puede corregir
→ psicólogo valida
→ memoria se actualiza
→ Patient 360 mejora
→ próxima sesión empieza con más contexto
```
