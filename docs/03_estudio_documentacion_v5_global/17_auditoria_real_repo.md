# 17 · Auditoría real del repositorio `ancora-main`

## 1. Dictamen ejecutivo

El repositorio actual es un **borrador avanzado de demo**, no una base limpia de producción clínica. Tiene valor porque ya contiene una primera web, login, roles, landing, marketplace, módulos de paciente, dashboard de psicólogo, Supabase, Edge Functions y un primer motor clínico. Pero no analiza bien los datos todavía porque la arquitectura está mezclada y el flujo de datos clínicos no está cerrado de extremo a extremo.

La decisión recomendada no es “tirarlo todo”, sino hacer una **reconstrucción controlada**:

1. conservar UI y conceptos útiles;
2. extraer el motor clínico a módulos claros;
3. eliminar contaminación personal/trading;
4. estabilizar modelo de datos;
5. convertir Patient 360 en la pantalla central;
6. alinear privacidad real con la promesa comercial;
7. sustituir mocks por contratos API.

## 2. Inventario del repo revisado

### Stack detectado

- React 19 + Vite.
- Capacitor para Android/iOS.
- Supabase Auth, Database, Storage y Edge Functions.
- Supabase migrations.
- Edge Functions Deno/TypeScript.
- OpenRouter para modelos LLM en funciones `chat-terapeuta`, `clinical-ingest` y `clinical-synthesize`.
- Vanilla CSS grande (`App.css`, `index.css`).
- Mucho estado local, mocks y `localStorage`.

### Estructura clave

```text
src/
  App.jsx
  appConfig.js
  supabaseClient.js
  lib/
    chatTerapeuta.js
    clinicalEngine.js
  views/
    LandingView.jsx
    LoginView.jsx
    AdminDashboardView.jsx
    PsicologoDashboardView.jsx
    PsicologoPerfilView.jsx
    ChatView.jsx
    MenteView.jsx
    paciente/
      PacienteHoyView.jsx
      PacienteChatView.jsx
      PacienteDiarioView.jsx
      PacienteTimelineView.jsx
      PacienteSesionesView.jsx
      PacienteHistoriaView.jsx
      PacientePrivacidadView.jsx
      PacientePerfilView.jsx
      PacientePlanView.jsx
supabase/
  functions/
    chat-terapeuta/
    clinical-ingest/
    clinical-synthesize/
  migrations/
```

## 3. Lo que el repo ya tiene bien orientado

### 3.1 Landing y narrativa

`LandingView.jsx` ya intenta construir una web premium con:

- hero;
- rutas paciente/psicólogo;
- marketplace de psicólogos;
- planes;
- acceso/login;
- selección de rol;
- fichas de profesionales.

El problema no es que falten ideas; el problema es que están demasiado integradas en un único componente enorme y no están conectadas a un recorrido clínico real.

### 3.2 Roles iniciales

`App.jsx` distingue paciente, psicólogo y supervisor. Esto es correcto conceptualmente.

Problema: los roles se resuelven con combinaciones de `profile.role`, email hardcodeado, `adminViewRole`, perfiles mock y migraciones inconsistentes.

### 3.3 Primer motor clínico frontend

`src/lib/clinicalEngine.js` ya contiene funciones útiles:

- `uploadClinicalDocument`;
- `processChatSessionClinically`;
- `getPendingProposals`;
- `acceptProposal`;
- `rejectProposal`;
- `getMedications`;
- `getTimelineEvents`;
- `buildPatientSnapshot`.

Esto es la semilla del SDK clínico del frontend. Debe mantenerse, pero separarse por servicios y tipos.

### 3.4 Primer pipeline de ingesta

`supabase/functions/clinical-ingest/index.ts` ya realiza:

- descarga de documentos de Storage;
- extracción directa de texto;
- extracción DOCX;
- extracción multimodal vía modelo externo;
- prompt clínico JSON;
- propuestas;
- riesgos;
- créditos de documento.

La idea está bien, pero debe modularizarse y endurecerse.

### 3.5 Primer motor Hermes

`supabase/functions/clinical-synthesize/index.ts` ya intenta sintetizar:

- perfil clínico;
- hechos;
- timeline;
- propuestas;
- riesgos;
- conversaciones;
- snapshots compactos.

Esto encaja con la intención de memoria persistente.

## 4. Problemas estructurales detectados

## 4.1 Mezcla de producto sanitario con laboratorio personal

El repo contiene módulos de trading, BingX, INSS, deudas, agentes personales, “Emilio” y “Walter” como identidad del bot. Esto contamina la arquitectura de Áncora como plataforma sanitaria general.

### Decisión

- `Walter` puede quedar como nombre interno provisional, pero no debe ser marca clínica del asistente en producción.
- Todo contenido de trading/deudas debe moverse fuera del producto o a un entorno de demo sintético.
- No incluir datos personales reales en repo.

## 4.2 Privacidad prometida vs implementación real

El README promete IA local/servidores propios y Zero-Knowledge. El código actual usa OpenRouter en Edge Functions.

### Decisión

Crear `ModelGateway` con modo:

```ts
type ModelProvider = 'local_vllm' | 'private_eu_cloud' | 'openrouter_dev';
```

Y bloquear claims comerciales según proveedor activo.

## 4.3 `App.jsx` demasiado grande

`App.jsx` tiene más de mil líneas y concentra:

- sesión;
- auth;
- roles;
- layout;
- navegación;
- demos;
- perfil;
- lógica de móvil;
- routing manual;
- vistas.

### Decisión

Sustituir por:

```text
src/app/
  AppProviders.tsx
  Router.tsx
  Shell.tsx
  auth/
  navigation/
  roles/
```

## 4.4 Componentes enormes

Archivos con miles de líneas:

- `AgentesView.jsx` ~5000 líneas.
- `PsicologoDashboardView.jsx` ~4350 líneas.
- `MenteView.jsx` ~4180 líneas.
- `PacienteHistoriaView.jsx` ~1970 líneas.
- `PacienteChatView.jsx` ~1930 líneas.
- `LandingView.jsx` ~1810 líneas.
- `ChatView.jsx` ~1810 líneas.

### Decisión

Ningún componente sanitario debe superar 300-500 líneas. Dividir por dominios y secciones.

## 4.5 Supabase cliente hardcodeado

`src/supabaseClient.js` contiene URL y anon key hardcodeadas. Aunque la anon key no es un secreto absoluto, debe ir por variables Vite y proyecto separado por entorno.

Target:

```ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

## 4.6 Roles y migraciones desalineadas

La primera migración define roles `emilio` y `supervisor`, pero la app usa `paciente`, `psicologo`, `admin`, `supervisor`. Esto debe corregirse antes de crecer.

Target:

```sql
create type app_role as enum (
  'patient',
  'psychologist',
  'clinic_admin',
  'platform_admin',
  'dpo',
  'support',
  'superadmin'
);
```

## 4.7 RLS incompleta y demasiado permisiva en zonas clínicas

Hay buen inicio con `can_access_patient`, pero aún debe cerrarse:

- pacientes solo ven su contenido;
- psicólogos solo pacientes vinculados y con consentimiento;
- soporte no ve contenido clínico;
- admin solo break-glass auditado;
- DPO accede a auditoría y solicitudes, no al contenido salvo base legal.

## 4.8 CORS demasiado abierto

Las Edge Functions usan `Access-Control-Allow-Origin: *`. Para producción clínica debe restringirse por entorno.

## 4.9 Datos clínicos sin cifrado aplicativo

El modelo habla de Argon2id y Zero-Knowledge, pero en las tablas aparecen campos `text` normales (`extracted_text`, `content`, `summary_vital`, mensajes). Supabase cifra en reposo a nivel infraestructura, pero eso no es Zero-Knowledge.

Decisión:

- MVP: cifrado en reposo + RLS + mínimo contenido en logs.
- Target: cifrado aplicativo por campo para mensajes, documentos, SOAP, snapshots y perfiles.
- No prometer Zero-Knowledge pleno hasta implementarlo.

## 4.10 Falta un contrato clínico común

`clinical-ingest`, `clinical-synthesize`, `chat-terapeuta` y `clinicalEngine.js` no comparten tipos canónicos. Hay que crear un paquete compartido:

```text
src/clinical-contracts/
  ClinicalFact.ts
  Evidence.ts
  ClinicalProposal.ts
  PatientSnapshot.ts
  RiskEvent.ts
  AuthorityLevel.ts
```

## 5. Problemas de producto detectados

### 5.1 La web no debe vender “muchas funciones”, sino continuidad

El mensaje central debe ser:

> Áncora hace que la terapia tenga memoria entre sesiones.

### 5.2 El paciente debe entender tres cosas

1. No estás hablando con un psicólogo IA.
2. Lo que cuentes se ordena para ayudarte a preparar mejor tu terapia.
3. Tú y tu psicólogo controláis qué se consolida.

### 5.3 El psicólogo debe entender tres cosas

1. No perderás tiempo buscando entre chats y documentos.
2. Antes de cada sesión verás cambios, riesgos, citas y tareas en dos minutos.
3. Nada clínico se consolida sin validación humana o estado de evidencia claro.

## 6. Prioridad técnica inmediata

Orden real de reconstrucción:

1. Congelar repo actual como `prototype`.
2. Crear rama `product-core`.
3. Eliminar/aislar módulos personales y trading.
4. Rehacer env vars y seguridad básica.
5. Corregir roles y migraciones.
6. Dividir `App.jsx` y dashboards enormes.
7. Estabilizar `clinicalEngine` + Edge Functions.
8. Crear flujo real documento → propuesta → validación → Patient 360.
9. Crear flujo chat → extracción post-sesión → snapshot → briefing.
10. Crear tests con pacientes sintéticos.

## 7. Dictamen final

El repo tiene suficiente material para no empezar de cero, pero no debe seguir creciendo en su forma actual. La mejora correcta es una reconstrucción de arquitectura, no un parche visual.
