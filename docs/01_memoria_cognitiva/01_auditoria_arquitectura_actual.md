# 01. Auditoría de Arquitectura y Codebase Legacy — Repositorio Áncora

**Entorno Auditado:** React 19.2.6, Vite 8.0.12, Supabase JS 2.106.2, Capacitor 8.3.4, Firebase Hosting (`ancora-portal`).  
**Objetivo:** Identificar acoplamientos, riesgos de rotura, gestión de contexto y sentar las bases para la arquitectura por contratos.

---

## 1. Puntos Exactos de Acoplamiento Directo UI ↔ Backend

En la arquitectura actual del repositorio `ancora_repo`, las vistas de la interfaz (`.jsx`) interactúan de forma directa y monolítica con la base de datos de Supabase, el almacenamiento (Storage) y las Edge Functions, sin pasar por una capa de abstracción de servicios o repositorios.

### A. Inicialización y Credenciales Hardcodeadas en Cliente
- **Archivo:** `src/supabaseClient.js` (Líneas 3-6)
  - La URL de Supabase (`https://ysnorelkaccaikvuqgnv.supabase.co`) y la clave anónima JWT están hardcodeadas directamente en el código fuente en lugar de ser leídas desde variables de entorno seguras (`import.meta.env.VITE_SUPABASE_URL`, `import.meta.env.VITE_SUPABASE_ANON_KEY`).
  - **Impacto:** Cualquier cambio de entorno o migración de persistencia hacia Firestore requiere editar archivos estáticos de código fuente.

### B. Consultas SQL / REST Directas desde Vistas de UI
- **`src/App.jsx` (Líneas 263-332, 852-875):**
  - Líneas 263-286 (`fetchUserProfile`): `supabase.from('profiles').select(...).eq('id', currentUser.id).single()` acoplado al hook `useEffect` principal.
  - Líneas 298-304 (`fetchTodayMood`): Consulta directa a la tabla `daily_moods` con filtrado por fecha `toISOString().split('T')[0]`.
  - Líneas 316-327 (`fetchTotalDebts`): Consulta directa a `debts` y agregación manual en memoria.
  - Líneas 852-875 (`onAssignPsychologist`): `supabase.from('profiles').update({ contexto_terapeutico: ... })` y `supabase.from('appointments').insert(...)` ejecutados en callbacks inline del render.

- **`src/views/paciente/PacienteChatView.jsx` (Líneas 235-442):**
  - Líneas 235-260 (`loadConversations`): `supabase.from('conversations').select('*').eq('user_id', user.id).neq('status', 'archived')` y fallback directo de inserción de nueva sesión.
  - Líneas 273-280 (`loadMessages`): `supabase.from('messages').select('*').eq('conversation_id', convId)`.
  - Líneas 378-383 (`checkCredits`): `supabase.from('patient_credits').select('*').eq('patient_id', profile.id)`.
  - Líneas 424-434 (`handleSend`): Inserción directa de mensaje `role: 'user'` en tabla `messages`.
  - Líneas 540-546 (`handleRenameConversation`) y 566-571 (`handleDeleteConversation`): Operaciones CRUD directas sobre `conversations`.

- **`src/views/PsicologoDashboardView.jsx` (Líneas 83-113, 157-185, 744-760):**
  - Líneas 83-104 (`fetchDbAppointments`): Join en memoria de `appointments` con `profiles` usando filtros JSONB: `.in('role', ['paciente', 'emilio'])`.
  - Líneas 157-185 y 279-285 (`loadPsychologistAvailability`, `handleToggleSlot`): Lectura y actualización directa de la columna `availability` (formato JSON serializado en string) en `psychologist_profiles`.
  - Líneas 744-760 (`fetchDBUsers`): Consulta directa a `profiles` con selector de clave anidada JSONB `contexto_terapeutico->>assigned_psychologist_id`.
  - Líneas 753-760: Consulta directa a la tabla `consents`.

- **`src/views/MenteView.jsx` (Líneas 403-440, 520-573, 797-802):**
  - Líneas 403-440: Polling directo con `setInterval` cada 1.5s sobre `agent_tasks` y mutación subsiguiente de `profiles.contexto_terapeutico`.
  - Líneas 520-526 (`fetchSources`): `supabase.from('mente_sources').select('*')`.
  - Líneas 538-545 (`fetchCompletedConversations`): `supabase.from('conversations').select('*').eq('status', 'completed')`.
  - Líneas 557-573 (`handleAddNote`): Inserción directa de documentos/notas en `mente_sources`.
  - Líneas 797-802 (`handleSaveMente`): Mutación directa del blob `contexto_terapeutico` en `profiles`.

- **`src/views/AgentesView.jsx` (Líneas 1210-1238):**
  - Polling recurrente (cada 10 segundos) consultando en paralelo `agent_tasks`, `agent_debates` y `agent_debate_messages`.

---

## 2. Gestión de Mensajes, Contexto, Snapshots y LLM

```text
PACIENTE (UI)
   │
   ▼ (1. Guarda mensaje en DB)
TABLA messages (role: 'user')
   │
   ▼ (2. Invoca Edge Function)
chat-terapeuta (Edge Function Deno)
   │
   ├─► (3. Lee 9 fuentes clínicas: patient_context_snapshots, clinical_profiles, life_tree, timeline_index...)
   ├─► (4. Inferencia con LLM: Prompt Sistema + Context Snapshot + Historial)
   ├─► (5. Extrae tags: <update_context>, <update_title>, <execute_action>)
   │
   ├─► (6. PATCH profiles.contexto_terapeutico)
   ├─► (7. INSERT INTO messages role: 'assistant' + telemetría de tokens)
   └─► (8. PATCH patient_credits)
   │
   ▼ (9. Respuesta a UI)
PacienteChatView.jsx (Regex strip de tags + render)
   │
   ▼ (10. Asíncrono)
clinicalEngine.js -> processConversationTurn() -> buildPatientSnapshot()
```

### A. Flujo de Mensajería
1. **Persistencia previa en cliente:** En `PacienteChatView.jsx:424-434`, el mensaje del usuario se inserta primero en la tabla `messages`.
2. **Invocación a Edge Function:** Se llama a `invokeChatTerapeuta()` pasando el ID de conversación y los últimos mensajes.
3. **Procesamiento en Edge Function:** En `chat-terapeuta/index.ts:1970-2007`, la Edge Function formatea la llamada a OpenRouter (`nvidia/nemotron-3-super-120b-a12b:free`).
4. **Persistencia del asistente y metadatos:** La Edge Function guarda la respuesta en `messages` adjuntando metadatos en texto plano: `[model:...][usage:prompt|completion|cache%]`.
5. **Decodificación en UI:** `PacienteChatView.jsx:284-325` realiza un parseo mediante regex para extraer la telemetría de tokens y limpiar el texto que ve el paciente.

### B. Gestión del Contexto del Paciente (`contexto_terapeutico`)
Es un objeto JSONB almacenado en `profiles.contexto_terapeutico`. Si el LLM detecta un nuevo compromiso o pauta, emite `<update_context>{...}</update_context>`. La Edge Function extrae el bloque, realiza un merge de arrays únicos y actualiza `profiles`.

### C. Snapshots Clínicos y Memoria Multi-Nivel
Implementado en `src/lib/clinicalEngine.js` y `chat-terapeuta/index.ts:224-343` (`fetchClinicalMemory`). Combina 9 colecciones: `patient_context_snapshots`, `clinical_profiles`, `clinical_life_tree`, `clinical_timeline_index`, `clinical_proposals`, `clinical_facts`, `risk_events`, `appointments` y `conversations`.

---

## 3. Riesgos de Rotura Identificados

1. **Fallback Silencioso a `localStorage` en `clinicalEngine.js` (Líneas 251-262, 437-446, 1113-1285):**
   Funciones como `getPendingProposals`, `acceptProposal`, `getMedications`, `getTimelineEvents` capturan errores de base de datos (`isTableMissingError` o excepciones generales) y recurren a `localStorage` con datos mockeados. Si una tabla de base de datos falla por permisos RLS o migraciones, la UI aparenta funcionar pero guarda los datos exclusivamente en el navegador local del usuario.
2. **Parseo Frágil de Tags en Cadenas de Texto (`PacienteChatView.jsx:284-325`, `chat-terapeuta/index.ts:2039-2096`):**
   La comunicación de metadatos (modelo, tokens consumidos, sugerencias de títulos `<update_title>`, contextos `<update_context>`) se realiza mediante incrustación de tags en el texto devuelto por el LLM. Si el LLM altera la sintaxis de los corchetes, el regex falla y el texto crudo de control queda visible para el paciente.
3. **Condición de Carrera en `profiles.contexto_terapeutico` (`App.jsx:852`, `MenteView.jsx:797`, `chat-terapeuta/index.ts:1303`):**
   No existen bloqueos optimistas ni campos atómicos. Toda la información del paciente se sobreescribe como un objeto JSON completo (`PATCH profiles`). Si una sesión de chat actualiza un compromiso al mismo tiempo que el psicólogo edita una nota, una escritura sobreescribe y destruye los cambios de la otra.
4. **Incoherencia Dual de Vistas:**
   Existen implementaciones duplicadas (`ChatView.jsx` vs `PacienteChatView.jsx`, `DashboardView.jsx` vs `PacienteHoyView.jsx`).
5. **Doble Configuración de Despliegue (Firebase Hosting vs Supabase Backend):**
   `firebase.json` está configurado para hospedar el SPA en Firebase Hosting (`ancora-portal`), pero los servicios backend residen en Supabase. No hay sincronización de reglas de seguridad ni adaptadores formales para Firestore.

---

## 4. Diagnóstico y Arquitectura por Contratos (Hexagonal)

Para resolver estos problemas y blindar Áncora contra roturas futuras, se establece la separación estricta en 4 capas:

```text
src/
├── domain/                      # 1. MODELOS Y CONTRATOS (Tipos puros e Interfaces)
│   ├── models/
│   └── repositories/ (IChatRepository, IClinicalMemoryRepository, IPatientRepository)
│
├── infrastructure/              # 2. ADAPTADORES DE INFRAESTRUCTURA
│   ├── firebase/ (FirestoreChatAdapter, FirestoreClinicalAdapter)
│   ├── supabase/ (SupabaseChatAdapter, SupabaseClinicalAdapter)
│   └── config/env.js (Variables de entorno seguras)
│
├── application/                 # 3. CASOS DE USO Y SERVICIOS
│   ├── chat/ (SendMessageUseCase, CloseSessionUseCase)
│   └── clinical/ (SyncMenteMemoryUseCase, ReviewProposalUseCase)
│
└── presentation/                # 4. HOOKS Y COMPONENTES
    ├── hooks/ (usePatientChat, useClinicalMemory, usePsychologistDashboard)
    └── views/ (Vistas UI puras sin llamadas directas a SDKs de base de datos)
```
