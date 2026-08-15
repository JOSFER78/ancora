# 24 · Sistema IA clínico para desarrollo

## Objetivo

Traducir la idea “Hermes clínico” a módulos que un equipo pueda implementar.

Áncora no necesita muchos agentes hablando entre sí sin control. Necesita un **orquestador clínico mantenible** con herramientas especializadas, memoria, RAG, políticas de seguridad y validación humana.

---

## Arquitectura recomendada

```text
Frontend
  ↓
API Gateway / Backend negocio
  ↓
Clinical Orchestrator
  ├─ Consent & Permission Guard
  ├─ Context Harness
  ├─ Prompt Registry
  ├─ RAG Retriever
  ├─ Clinical Extractor
  ├─ Proposal Engine
  ├─ Risk Detector
  ├─ Memory Manager
  ├─ SOAP Generator
  └─ Audit Logger
  ↓
Model Provider Adapter
  ├─ local vLLM / FastAPI
  ├─ cloud privada UE
  └─ proveedor temporal controlado
```

---

## Módulos

### 1. Consent & Permission Guard

Comprueba si la operación puede hacerse.

Entradas:

- usuario,
- rol,
- paciente,
- relación terapéutica,
- consentimiento,
- finalidad,
- tipo de dato.

Salidas:

- allow/deny,
- motivo,
- restricciones de datos,
- necesidad de break-glass.

---

### 2. Context Harness

Construye el contexto que recibe el modelo.

Capas:

1. política clínica,
2. tarea concreta,
3. rol del usuario,
4. estado de consentimiento,
5. memoria caliente,
6. riesgos activos,
7. objetivos actuales,
8. últimos eventos,
9. RAG filtrado,
10. formato de salida.

Regla: el frontend nunca construye prompts clínicos completos.

---

### 3. Prompt Registry

Versiona prompts por tarea:

- chat diario,
- extracción documental,
- extracción post-chat,
- riesgo,
- resumen diario,
- resumen semanal,
- Patient 360,
- SOAP,
- briefing,
- preguntas sugeridas.

Cada llamada IA debe registrar:

- `prompt_version`,
- `task_type`,
- `model`,
- `policy_version`,
- `schema_version`,
- `input_hash`, no contenido clínico,
- `output_hash`, no contenido clínico.

---

### 4. RAG Retriever

Recupera memoria profunda.

Filtros obligatorios:

- `patient_id`,
- permisos,
- tipo de contenido,
- fecha,
- estado de validación,
- autoridad,
- riesgo.

Orden recomendado:

1. datos validados por psicólogo,
2. datos documentados,
3. datos declarados por paciente,
4. inferencias IA.

---

### 5. Clinical Extractor

Convierte texto en datos estructurados.

Debe devolver JSON estricto:

```json
{
  "facts": [],
  "timeline_events": [],
  "medications": [],
  "risks": [],
  "quotes": [],
  "contradictions": [],
  "questions_for_patient": [],
  "questions_for_psychologist": []
}
```

Regla: no diagnosticar. Si aparece un diagnóstico, guardarlo como `diagnosis_documented_in_source`, no como diagnóstico de Áncora.

---

### 6. Proposal Engine

Crea propuestas revisables.

Tipos:

- añadir antecedente,
- añadir medicación,
- añadir evento vital,
- añadir riesgo,
- actualizar objetivo,
- preguntar aclaración,
- destacar contradicción,
- sugerir foco de sesión.

---

### 7. Risk Detector

No debe depender solo del LLM.

Capas:

1. reglas explícitas conservadoras,
2. clasificador IA,
3. revisión humana según nivel,
4. protocolo de crisis.

Niveles:

- verde,
- ámbar,
- rojo,
- crítico.

En crítico, no se continúa como chat normal.

---

### 8. Memory Manager

Mantiene tres niveles:

- memoria caliente,
- memoria episódica,
- memoria profunda.

También mantiene snapshots:

- `patient_360_snapshot`,
- `clinical_life_tree`,
- `risk_profile`,
- `therapy_goals`,
- `weekly_review_summary`.

---

### 9. SOAP Generator

Genera borradores, no notas finales.

Debe separar:

- Subjetivo: citas y declaración del paciente.
- Objetivo: observables y métricas.
- Evaluación: hipótesis, no diagnóstico autónomo.
- Plan: sugerencias revisables.

Cada punto debe tener evidencia o quedar marcado como inferencia.

---

## Tareas asíncronas

```text
on document.uploaded:
  process_document
  extract_clinical_json
  create_proposals
  rebuild_patient_snapshot

on chat.session.closed:
  extract_session_facts
  create_daily_summary
  create_proposals
  detect_risk
  enqueue_embeddings
  rebuild_patient_snapshot

nightly:
  process_pending_embeddings
  consolidate_weekly_summaries
  detect_patterns
  update_gaps
  prepare_psychologist_briefings
```

---

## Adaptadores de modelo

No acoplar el producto a OpenRouter, vLLM o cualquier proveedor.

Interfaz:

```ts
type ModelRequest = {
  task: string;
  model_class: 'fast_chat' | 'extractor' | 'reasoning' | 'embedding' | 'reranker';
  system: string;
  messages?: Array<{ role: string; content: string }>;
  input_json?: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
  safety_policy: string;
};

type ModelResponse = {
  text?: string;
  json?: Record<string, unknown>;
  model: string;
  provider: string;
  latency_ms: number;
  prompt_version: string;
};
```

---

## Errores a evitar

- meter todo el historial en el prompt,
- guardar respuestas IA como verdad clínica,
- permitir que el frontend llame directamente al modelo,
- usar localStorage para datos clínicos,
- prometer IA local si en producción se manda a proveedor externo,
- generar SOAP sin evidencia,
- no registrar quién validó cada dato.
