# 27 · Matriz de archivos del repo y acciones recomendadas

## Dictamen

El repo contiene partes rescatables, pero no debe seguir creciendo tal como está. La acción correcta es **reconstruir sobre una estructura limpia**, reutilizando componentes visuales y parte del motor clínico inicial.

---

## Archivos grandes detectados

| Archivo | Líneas aprox. | Acción |
|---|---:|---|
| `src/views/AgentesView.jsx` | 5033 | Archivar o dividir; no pertenece al MVP clínico general |
| `src/views/PsicologoDashboardView.jsx` | 4359 | Reescribir en `features/patient360`, `features/pro-dashboard`, `features/soap` |
| `src/views/MenteView.jsx` | 4187 | Extraer partes útiles a historia/diario; eliminar partes personales |
| `firebase/functions/chat-terapeuta/index.ts` | 2140 | Dividir en chat, memoria, riesgo, provider adapter |
| `src/index.css` | 2081 | Convertir en tokens + componentes; eliminar estilos no usados |
| `src/views/LandingView.jsx` | 1810 | Reescribir por secciones reutilizables |
| `src/views/ChatView.jsx` | 1810 | Reescribir como feature de chat con session lifecycle |
| `src/lib/clinicalEngine.js` | 1284 | Dividir en API clients por dominio |
| `src/App.jsx` | 1247 | Reducir a shell/router/providers |
| `src/App.css` | 1145 | Limpiar estilos legacy |

---

## Matriz de acciones

### `src/App.jsx`

**Problema:** mezcla auth, roles, navegación, mocks, módulos personales, demo y lógica clínica.

**Acción:** reescribir.

**Destino:**

```text
src/app/AppShell.jsx
src/app/AppRouter.jsx
src/app/auth/AuthProvider.jsx
src/app/permissions/PermissionProvider.jsx
```

---

### `src/appConfig.js`

**Problema:** roles y navegación mezclan producto clínico con módulos personales.

**Acción:** reescribir.

**Destino:**

```text
src/app/navigation/patientNav.js
src/app/navigation/psychologistNav.js
src/app/navigation/adminNav.js
src/app/permissions/roles.js
```

---

### `src/views/LandingView.jsx`

**Problema:** landing larga y probablemente difícil de mantener.

**Acción:** dividir por secciones.

**Destino:**

```text
src/features/public-site/LandingPage.jsx
src/features/public-site/sections/HeroSection.jsx
src/features/public-site/sections/ProblemSection.jsx
src/features/public-site/sections/PatientValueSection.jsx
src/features/public-site/sections/PsychologistValueSection.jsx
src/features/public-site/sections/SecuritySection.jsx
src/features/public-site/sections/PricingSection.jsx
src/features/public-site/sections/FaqSection.jsx
```

---

### `src/views/PsicologoDashboardView.jsx`

**Problema:** demasiado grande y mezcla dashboard, paciente, SOAP, briefing y gestión.

**Acción:** extraer features.

**Destino:**

```text
src/features/pro-dashboard/ProDashboardPage.jsx
src/features/patients/PatientsListPage.jsx
src/features/patient360/Patient360Page.jsx
src/features/soap/SoapWorkspace.jsx
src/features/briefings/BriefingWorkspace.jsx
src/features/agenda/AgendaPage.jsx
```

---

### `src/views/ChatView.jsx`

**Problema:** el chat debe ser un flujo clínico con sesión, cierre, extracción y riesgo.

**Acción:** reescribir con lifecycle.

**Destino:**

```text
src/features/chat/ChatPage.jsx
src/features/chat/components/ChatSessionTimer.jsx
src/features/chat/components/ClinicalBoundaryNotice.jsx
src/features/chat/components/RiskEscalationModal.jsx
src/features/chat/api/chatApi.js
```

---

### `src/lib/clinicalEngine.js`

**Problema:** concentra demasiadas operaciones y tiene fallback localStorage para datos clínicos.

**Acción:** dividir y eliminar fallback clínico productivo.

**Destino:**

```text
src/features/clinical/api/documentsApi.js
src/features/clinical/api/proposalsApi.js
src/features/clinical/api/factsApi.js
src/features/clinical/api/patientSnapshotApi.js
src/features/clinical/api/medicationsApi.js
src/features/clinical/api/timelineApi.js
```

---

### `firebase/functions/chat-terapeuta/index.ts`

**Problema:** función gigante; combina chat, proveedor, contexto, extracción y acciones.

**Acción:** dividir.

**Destino:**

```text
firebase/functions/chat-message/index.ts
firebase/functions/chat-close-session/index.ts
firebase/functions/ai-context-harness/index.ts
firebase/functions/clinical-risk-detect/index.ts
firebase/functions/model-provider/index.ts
```

---

### `firebase/functions/clinical-ingest/index.ts`

**Problema:** es una buena base, pero debe convertirse en pipeline con estados y errores.

**Acción:** mantener y endurecer.

**Añadir:**

- `document_processing_jobs`,
- estados `queued/running/extracted/proposals_created/failed`,
- hash de archivo,
- citas/evidencias,
- schema version.

---

### `firebase/functions/clinical-synthesize/index.ts`

**Problema:** síntesis útil, pero debe versionar snapshot y separar tareas.

**Acción:** dividir o modularizar.

**Tareas:**

- `build_patient_360_snapshot`,
- `build_weekly_summary`,
- `generate_soap_draft`,
- `update_clinical_life_tree`.

---

### `firebase/migrations/*clinical*`

**Problema:** hay buena intención, pero necesita normalización y RLS auditada.

**Acción:** crear nueva migración consolidada v2.

**Tablas obligatorias:**

- `patients`,
- `psychologists`,
- `patient_psychologist_assignments`,
- `clinical_documents`,
- `clinical_evidence`,
- `clinical_facts`,
- `clinical_proposals`,
- `timeline_events`,
- `risk_events`,
- `patient_360_snapshots`,
- `soap_notes`,
- `audit_logs`,
- `consents`.

---

## Qué rescatar

- Dirección visual de la landing.
- Idea del motor clínico y propuestas.
- Edge Functions `clinical-ingest` y `clinical-synthesize` como prototipo conceptual.
- Migrations clínicas como referencia.
- Patient 360 como intención de producto.
- README como narrativa, pero con claims ajustados a la realidad técnica.

---

## Qué no rescatar en producto clínico

- Módulos de trading.
- Módulos personales.
- Correos hardcodeados.
- Datos reales/personales.
- localStorage clínico.
- Funciones gigantes sin separación.
- Claims de privacidad que contradigan proveedores usados.

---

## Nueva estructura objetivo

```text
src/
  app/
  layouts/
  routes/
  features/
    public-site/
    onboarding/
    chat/
    diary/
    documents/
    timeline/
    patient360/
    pro-dashboard/
    soap/
    agenda/
    billing/
    privacy/
    admin/
    clinical/
  shared/
    components/
    hooks/
    api/
    utils/
    styles/
  demo/

firebase/
  functions/
    chat-message/
    chat-close-session/
    clinical-ingest/
    clinical-synthesize/
    ai-context-harness/
    clinical-risk-detect/
  migrations/
  tests/

docs/
  product/
  technical/
  clinical/
  security/
```
