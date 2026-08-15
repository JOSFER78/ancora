# ÁNCORA — Plan y estado del Motor de IA Clínico Universal

> Documento vivo para que cualquier agente que retome el trabajo sepa **qué se está construyendo, qué está hecho y por dónde seguir**. Última actualización: 2026-06-29 (sección 3 y 4.1 actualizadas con re-extracción).

---

## 1. Objetivo (qué se está construyendo)

Un **motor de IA clínico universal, dinámico y neutral** para Áncora que:

- **Extrae** datos clínicos con criterio médico de **cualquier** fuente (documentos PDF/Word, chat, notas de voz transcritas, formulario de intake). Universal: no asume patología ni contexto concreto de ningún paciente.
- **No diagnostica**: extrae hechos con **citas literales obligatorias**, formula **hipótesis** como posibilidad (baja autoridad), y el **psicólogo valida**.
- **Define el mínimo clínico universal** (anamnesis mínima) y detecta **gaps**: qué falta tras leer los datos → genera **preguntas/formulario** para rellenar los huecos.
- **Construye un panel clínico con sentido** (línea de vida, episodios, relaciones, patrones, hipótesis vs validado, riesgo, gaps) visual e intuitivo.
- Permite **corrección en lenguaje natural** ("esto no es ludopatía, es autosabotaje por trauma") o **edición manual**.
- **Consolida** con nuevos chats/archivos **sin pisar lo validado**.

### Principio sagrado
La IA organiza, propone y detecta. El psicólogo valida. **Nada entra como hecho clínico definitivo sin firma humana.** La frontera "verificado vs posible" es el eje del producto.

---

## 2. Arquitectura del motor

```
Fuentes (doc/chat/voz/intake) → clinical-extract (extractor universal con criterio médico)
   → hechos con citas (authority 3 declarado / 4 inferido), episodios, relaciones,
     patrones, hipótesis (pending), riesgos, línea de vida
   → detect_gaps: cuadro mínimo universal → preguntas/formulario
   → clinical-correct: consolidación de intake + corrección en lenguaje natural
Panel psicólogo "Caso Clínico IA" (ClinicalCasePanel.jsx) consume todo lo anterior
```

**Modelo LLM**: `deepseek/deepseek-v4-flash` (configurado como secret `CLINICAL_EXTRACT_MODEL`/`CLINICAL_CORRECT_MODEL`/`CLINICAL_NIGHT_MODEL`). Antes era `nvidia/nemotron...:free` (lento y truncaba JSONs largos).

---

## 3. Estado actual — HECHO ✅

### Desplegado en Supabase (proyecto `ysnorelkaccaikvuqgnv`)

| Pieza | Estado | Archivo |
|---|---|---|
| Migración modelo de datos | ✅ aplicada en remoto | `supabase/migrations/20260629210000_clinical_case_model.sql` |
| Edge `clinical-extract` | ✅ desplegada (ACTIVE) | `supabase/functions/clinical-extract/index.ts` |
| Edge `clinical-correct` | ✅ desplegada (ACTIVE) | `supabase/functions/clinical-correct/index.ts` |
| Edge `clinical-nightly` | ✅ escrita, NO desplegada | `supabase/functions/clinical-nightly/index.ts` |
| Secrets modelo LLM | ✅ DeepSeek V4 Flash | (env del proyecto) |

### Tablas nuevas creadas (modelo de caso clínico)
`clinical_episodes`, `clinical_relationships`, `clinical_patterns`, `clinical_hypotheses`, `clinical_intake_gaps`, `clinical_intake_responses` — todas con `authority_level` (1 validado / 2 documentado / 3 declarado / 4 inferido), `validation_status` (pending→validated) y RLS reutilizando `can_access_patient`.

### Frontend
- `src/lib/clinicalEngine.js`: funciones universales (`getClinicalEpisodes`, `getClinicalRelationships`, `getClinicalPatterns`, `getClinicalHypotheses`, `getOpenIntakeGaps`, `validateClinicalEntity`, `applyNaturalLanguageCorrection`, `extractFromText`, `detectIntakeGaps`) + `MINIMUM_CLINICAL_BLOCKS` (cuadro mínimo universal neutral).
- `src/components/ClinicalCasePanel.jsx`: panel clínico universal con sentido (cobertura del mínimo %, huecos priorizados, episodios, línea de vida, relaciones, patrones, hipótesis vs validado, corrección NL + edición manual).
- Integrado como pestaña **"Caso Clínico IA"** en `PsicologoDashboardView.jsx`.

### Prueba del motor (datos reales de Emilio Naranjo)
- Caso de test en `datos/datos paciente test/` (5 archivos: 1 txt contexto + 4 docx).
- Script `scripts/extract_patient_test.mjs` extrae los 4 docx con el LLM y genera SQL de volcado.
- **Resultado de extracción** (con DeepSeek V4 Flash, re-extraído el 2026-06-29):
  - historia y terapia: 8 episodios, 14 hitos vida, 12 relaciones, 10 patrones, 8 hipótesis, 4 riesgos ✅
  - eje cronológico: 14 episodios, 21 hitos vida, 8 relaciones, 7 patrones, 8 hipótesis, 4 riesgos ✅
  - pensamiento negativo: 12 episodios, 4 hitos vida, 1 relación, 6 patrones, 5 hipótesis, 4 riesgos ✅
  - sensaciones ansiedad: ❌ falló parseo JSON (DeepSeek devolvió JSON inválido). Pendiente re-extraer.
- **SQL generado**: los 3 documentos exitosos están en `c:/tmp/emilio_clinical_inserts.sql`. **NO volcado a BD aún.**
- El extractor produce datos con **sentido clínico real**: episodios (abuso infantil, maltrato paterno, 4 depresiones, intento autolítico), relaciones (padre, madre, Cuca ex, Lola hija), patrones (autosabotaje financiero, ciclo ruptura-retorno), hipótesis como posibilidad (no diagnóstico).

### Servidor de desarrollo
`npm run dev` → **http://localhost:5180/**

---

## 4. Estado actual — PENDIENTE ❌ (por dónde seguir)

### 4.1 Volcar la extracción en la BD de Emilio (INMEDIATO)
- ✅ **3/4 documentos extraídos** con DeepSeek V4 Flash: historia y terapia (8ep), eje cronológico (14ep), pensamiento negativo (12ep).
- ❌ **sensaciones ansiedad** falló: DeepSeek devolvió JSON inválido (trailing commas). Re-intentar con prompt más estricto o reparación automática.
- ✅ **SQL generado**: `c:/tmp/emilio_clinical_inserts.sql` (3 documentos).
- ⏳ **Pendiente**: `npx supabase db query --linked -f c:/tmp/emilio_clinical_inserts.sql` (INSERTs en BD remota).
- ⏳ **Pendiente**: Verificar panel "Caso Clínico IA" en localhost:5180 con datos reales.

### 4.2 Limpiar mocks (lo que el usuario reporta: "datos mockeados en plan y diario")
El panel y el diario emocional tienen **datos de ejemplo inventados** que hay que reemplazar por datos reales del motor:
- `PsicologoDashboardView.jsx`: pestaña "Resumen Clínico" y otros con datos hardcoded (líneas ~401-561, `pastSOAPs`, `briefing` mock). El nuevo panel "Caso Clínico IA" ya es real, pero el resto sigue mock.
- `PacienteHistoriaView.jsx`: tiene `demoClinicalHistory` (mock de Mariana/Emilio) y fallbacks a localStorage.
- Diario emocional: revisar si tiene datos mock (probablemente en vistas de paciente).
- **Acción**: identificar todos los mocks (`grep -rn "mock\|demo\|hardcoded\|example\|ejemplo"`) y reemplazar por lectura del motor clínico real, con estados vacíos limpios cuando no haya datos.

### 4.3 Alinear el mínimo clínico con estándares reales (PENDIENTE INVESTIGACIÓN)
- Se lanzó un **deep-research** sobre: (1) anamnesis mínima universal en psicología clínica (SCID, MINI, DSM-5-TR, CIE-11, formulación de caso), (2) paneles clínicos reales (HCE en salud mental, Patient 360, UX clínico, evitar sesgo de anclaje).
- El `MINIMUM_CLINICAL_BLOCKS` actual (en `clinicalEngine.js` y en la edge `clinical-extract`) es **provisional**. Cuando llegue la investigación, ajustar bloques/campos a estándares verificados.
- **Acción**: aplicar hallazgos de la investigación al `MINIMUM_CLINICAL_BLOCKS` y a las secciones del `ClinicalCasePanel`.

### 4.4 Desplegar `clinical-nightly` (cron nocturno)
- La edge function `clinical-nightly` está escrita pero **no desplegada**. Hace la consolidación nocturna (extrae chat cerrado + regenera memoria Hermes) para todos los pacientes activos.
- Migración del cron: `supabase/migrations/20260629200000_clinical_nightly_cron.sql` (pg_cron) **no aplicada**.
- **Acción**: `npx supabase functions deploy clinical-nightly` + aplicar migración del cron.

### 4.5 Probar el flujo completo end-to-end
- Subir documentos de Emilio vía la app (upload) → `clinical-ingest` extrae texto → `clinical-extract` los procesa → panel se llena. Hoy la prueba es directa vía script + SQL; falta validar el flujo real desde la UI.

---

## 5. Notas operativas para el próximo agente

- **Supabase CLI** v2.105.0 instalado y linkeado a `ysnorelkaccaikvuqgnv`. Access token en entorno.
- Para aplicar SQL en remoto: `npx supabase db query --linked -f <archivo.sql>` o `npx supabase db query --linked "<sql>"`.
- **NO usar `supabase db push`**: el histórico de migraciones local y remoto está desincronizado (hay migraciones en remoto que no existen localmente). Usar `db query --linked -f` para aplicar migraciones nuevas.
- El paciente de test Emilio: `aeb78e97-5a44-4c24-9390-c32508dda09d` (rol `emilio`, nombre puesto en `contexto_terapeutico.nombre`).
- Las edge functions leen `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_URL` de los secrets del proyecto (ya configurados).
- **Modelo LLM**: DeepSeek V4 Flash (`deepseek/deepseek-v4-flash`). Más rápido y barato que el nemotron `:free`.
- Documentos de test extraídos (texto plano) en `datos/datos paciente test/_extracted_*.txt` (generados desde los .docx con PowerShell zipfile).

---

## 6. Principios no negociables del diseño

1. La IA **no diagnostica**. Solo hechos con citas + hipótesis como posibilidad.
2. Todo dato clínico tiene `authority_level` + `validation_status`. La frontera verificado/posible es visible.
3. La IA **no escribe en la ficha definitiva**: crea propuestas `pending` hasta validación humana.
4. Universal y neutral: el motor no asume ningún caso concreto. El contenido lo define el paciente.
5. Mínimo clínico universal: el sistema detecta qué falta y pregunta (no asume que sabe).
6. La corrección del psicólogo es autoridad: **nunca pisa lo validado**, lo contextualiza o crea versión nueva. Todo trazable.
