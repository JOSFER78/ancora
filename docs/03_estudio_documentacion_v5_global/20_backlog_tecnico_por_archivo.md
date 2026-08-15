# 20 · Backlog técnico por archivo/carpeta del repo actual

## 1. `src/supabaseClient.js`

### Problema

URL y anon key hardcodeadas.

### Acción

Crear:

```ts
src/integrations/supabase/client.ts
```

Usar `import.meta.env.VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

### Prioridad

P0.

## 2. `src/App.jsx`

### Problema

Demasiadas responsabilidades: auth, roles, layout, navegación, demo, estado global, routing manual.

### Acción

Dividir en:

```text
src/app/App.tsx
src/app/AppProviders.tsx
src/app/AppRouter.tsx
src/app/shells/PublicShell.tsx
src/app/shells/PatientShell.tsx
src/app/shells/PsychologistShell.tsx
src/app/shells/AdminShell.tsx
src/domain/auth/useAuthSession.ts
src/domain/roles/useCurrentRole.ts
```

### Prioridad

P1.

## 3. `src/appConfig.js`

### Problema

Roles y navegación acoplados a labels. Usa español visible y lógica interna mezclada.

### Acción

Separar:

- roles canónicos;
- permisos;
- menús por rol;
- labels i18n.

### Prioridad

P1.

## 4. `src/views/LandingView.jsx`

### Problema

Buen concepto visual, pero componente gigante y marketplace acoplado.

### Acción

Dividir:

```text
features/public-web/
  LandingPage.tsx
  sections/HeroSection.tsx
  sections/TrustStrip.tsx
  sections/ForPatients.tsx
  sections/ForPsychologists.tsx
  sections/HowItWorks.tsx
  sections/PricingSection.tsx
  sections/SecuritySection.tsx
  marketplace/PsychologistDirectoryPreview.tsx
```

### Cambios de producto

- Hero: “Terapia con memoria entre sesiones”.
- Mostrar claramente “IA supervisada, no psicólogo IA”.
- CTA paciente y psicólogo.
- Marketplace como preview real, no elemento decorativo.

### Prioridad

P1.

## 5. `src/views/LoginView.jsx`

### Problema

Login y registro por rol pueden mezclarse con onboarding.

### Acción

Separar:

- Login.
- Registro paciente.
- Registro psicólogo.
- Consentimientos.
- Triaje.
- Verificación psicólogo.

### Prioridad

P1.

## 6. `src/views/paciente/PacienteHoyView.jsx`

### Objetivo final

Debe ser el “centro de continuidad” del paciente.

### Añadir

- próxima sesión;
- tarea principal;
- check-in rápido;
- documentos pendientes de revisar;
- propuestas pendientes;
- aviso de privacidad y límites IA;
- resumen de última interacción.

### Prioridad

P1.

## 7. `src/views/paciente/PacienteChatView.jsx`

### Problema

Tiene muchas funciones: conversaciones, voz, archivos, créditos, UI móvil, carpetas, crisis.

### Acción

Dividir en módulos y conectar siempre con `ContextHarness`.

### Requisito clínico

Cada conversación debe generar:

- `chat_session`;
- `messages`;
- extracción post-sesión;
- propuestas si hay hechos nuevos;
- resumen diario;
- alertas si hay riesgo.

### Prioridad

P0/P1.

## 8. `src/views/paciente/PacienteHistoriaView.jsx`

### Problema

Es el lugar correcto para documentos, timeline y medicación, pero debe convertirse en “Mi historia revisable”.

### Acción

Crear tabs:

- Timeline.
- Documentos.
- Propuestas pendientes.
- Medicación.
- Antecedentes.
- Consentimientos.

### Prioridad

P1.

## 9. `src/views/PsicologoDashboardView.jsx`

### Problema

Es el archivo más importante de producto clínico, pero está sobredimensionado y mezcla mocks, dashboard, Patient 360, SOAP, agenda, facturación y videollamada.

### Acción

Convertir en carpeta `features/psychologist-panel`.

### Subcomponentes obligatorios

- `PatientList`.
- `Patient360Page`.
- `QuickBrief`.
- `ProposalInbox`.
- `EvidenceFeed`.
- `RawDataPanel`.
- `ClinicalTimeline`.
- `RiskPanel`.
- `MedicationPanel`.
- `SoapWorkspace`.
- `SessionPrep`.
- `Agenda`.

### Prioridad

P0 porque aquí está el diferencial para el psicólogo.

## 10. `src/lib/clinicalEngine.js`

### Valor

Es una buena semilla. Debe convertirse en SDK clínico typed.

### Acción

Separar en:

```text
domain/clinical/clinicalDocumentsApi.ts
domain/clinical/clinicalProposalsApi.ts
domain/clinical/clinicalTimelineApi.ts
domain/clinical/clinicalMedicationsApi.ts
domain/clinical/patientSnapshotApi.ts
domain/clinical/types.ts
```

### Añadir

- tipos TS;
- manejo de errores estándar;
- sin fallback localStorage para producción;
- auditoría visible.

### Prioridad

P0.

## 11. `supabase/functions/clinical-ingest/index.ts`

### Valor

Muy importante. Ya contiene la idea correcta de extracción clínica con JSON.

### Problemas

- archivo demasiado grande;
- OpenRouter directo;
- extracción multimodal sin capa provider;
- sin cola asíncrona real;
- persistencia de `extracted_text` raw en texto;
- duplicaciones pequeñas;
- control de créditos mezclado con ingesta.

### Acción

Dividir:

```text
functions/_shared/auth.ts
functions/_shared/rest.ts
functions/_shared/modelGateway.ts
functions/_shared/documentTextExtractor.ts
functions/_shared/clinicalExtractor.ts
functions/_shared/proposalMapper.ts
functions/_shared/riskMapper.ts
functions/clinical-ingest/index.ts
```

### Prioridad

P0.

## 12. `supabase/functions/clinical-synthesize/index.ts`

### Valor

Semilla de memoria Hermes.

### Problema

Sintetiza mucho, pero aún no tiene versionado fuerte de memoria, criterios de invalidación, ni separación de snapshots por uso.

### Acción

Crear snapshots:

- `patient_hot_context`;
- `psychologist_quick_brief`;
- `weekly_review_context`;
- `chat_context`;
- `risk_context`.

### Prioridad

P0/P1.

## 13. `supabase/functions/chat-terapeuta/index.ts`

### Problema

Es muy grande y mezcla chat, memoria clínica, extracción de fuentes, créditos, OpenRouter, guardado de mensajes y lógica específica personal.

### Acción

No seguir creciendo este archivo. Crear:

```text
chat-orchestrator/
  index.ts
  contextHarness.ts
  safety.ts
  memoryRetrieval.ts
  responsePolicy.ts
  postTurnExtraction.ts
```

### Prioridad

P0.

## 14. `supabase/migrations/*`

### Problema

Hay buenas tablas clínicas, pero también arrastre de modelos anteriores.

### Acción

Crear migración limpia `0001_core_schema.sql` para una nueva base staging.

### Prioridad

P0.

## 15. `src/views/MenteView.jsx`, `src/views/AgentesView.jsx`, `src/components/trading/*`

### Problema

Tienen valor experimental, pero no pertenecen al producto sanitario general.

### Acción

Mover fuera o archivar.

```text
_archive/personal_experiments/
```

### Prioridad

P0 para limpieza de producto.

## 16. `datos/`

### Problema

Contiene documentos, informes y material que no debe estar mezclado con código de producto.

### Acción

Mover a repositorio privado de documentación o storage cifrado. Mantener solo fixtures sintéticos anonimizados.

### Prioridad

P0.
