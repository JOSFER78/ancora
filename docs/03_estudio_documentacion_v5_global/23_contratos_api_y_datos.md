# 23 · Contratos API y modelo de datos para desarrollo

## Objetivo

Definir contratos mínimos para que el frontend, el backend y la IA trabajen con datos reales y no con mocks.

El sistema debe evitar que cada pantalla invente su propio formato. Todo módulo clínico debe hablar con estructuras consistentes.

---

## Entidades nucleares

### User

Identidad básica. No debe contener información clínica.

```ts
type User = {
  id: string;
  email: string;
  role: 'patient' | 'psychologist' | 'clinic_admin' | 'support' | 'compliance' | 'superadmin';
  status: 'active' | 'pending' | 'suspended' | 'deleted';
  created_at: string;
};
```

### Patient

```ts
type Patient = {
  id: string;
  user_id: string;
  display_name: string;
  birth_year?: number;
  risk_level: 'unknown' | 'low' | 'moderate' | 'high' | 'critical';
  assigned_psychologist_id?: string;
  created_at: string;
};
```

### Psychologist

```ts
type Psychologist = {
  id: string;
  user_id: string;
  public_slug: string;
  full_name: string;
  license_number: string;
  qualification: 'MPGS' | 'PIR' | 'other_verified';
  verification_status: 'draft' | 'pending' | 'verified' | 'rejected' | 'suspended';
  specialties: string[];
  session_price?: number;
  accepts_new_patients: boolean;
};
```

---

## Clinical Evidence

La unidad más importante del sistema no es el resumen: es la evidencia.

```ts
type ClinicalEvidence = {
  id: string;
  patient_id: string;
  source_type: 'chat' | 'document' | 'session' | 'weekly_review' | 'psychologist_note' | 'triage';
  source_id: string;
  source_label: string;
  quote?: string;
  extracted_text_ref?: string;
  date_observed?: string;
  created_at: string;
};
```

---

## Clinical Fact

Un hecho clínico consolidable. Puede ser declarado, documentado, validado o inferido.

```ts
type AuthorityLevel = 'psychologist_validated' | 'documented' | 'patient_declared' | 'ai_inferred';

type ValidationStatus = 'pending_patient' | 'pending_psychologist' | 'accepted' | 'edited' | 'rejected' | 'archived';

type ClinicalFact = {
  id: string;
  patient_id: string;
  kind:
    | 'symptom'
    | 'medication'
    | 'medical_history'
    | 'psychological_history'
    | 'life_event'
    | 'risk'
    | 'therapy_goal'
    | 'task'
    | 'relationship_context'
    | 'pattern'
    | 'preference'
    | 'other';
  claim: string;
  normalized_value?: Record<string, unknown>;
  evidence_ids: string[];
  authority_level: AuthorityLevel;
  validation_status: ValidationStatus;
  confidence: number;
  created_by: 'patient' | 'psychologist' | 'ai' | 'system';
  validated_by?: string;
  validated_at?: string;
  created_at: string;
  updated_at: string;
};
```

---

## Clinical Proposal

La IA no debe escribir directamente en la ficha definitiva. Debe proponer.

```ts
type ClinicalProposal = {
  id: string;
  patient_id: string;
  proposal_type:
    | 'create_fact'
    | 'update_fact'
    | 'create_timeline_event'
    | 'create_medication'
    | 'create_risk_event'
    | 'create_goal'
    | 'ask_patient_clarification'
    | 'ask_psychologist_review';
  title: string;
  proposed_payload: Record<string, unknown>;
  evidence_ids: string[];
  source_type: 'chat' | 'document' | 'session' | 'weekly_review';
  confidence: number;
  severity?: 'info' | 'attention' | 'urgent';
  status: 'pending' | 'accepted' | 'edited' | 'rejected';
  reviewer_role?: 'patient' | 'psychologist' | 'admin';
  reviewed_by?: string;
  reviewed_at?: string;
};
```

---

## Patient 360 Snapshot

Vista materializada para que el psicólogo no espere a que todo se calcule en tiempo real.

```ts
type Patient360Snapshot = {
  patient_id: string;
  snapshot_version: string;
  generated_at: string;
  hot_summary: {
    one_line: string;
    current_state: string;
    risk_level: string;
    main_focus: string[];
    next_session_focus: string[];
  };
  last_session: {
    date?: string;
    summary?: string;
    pending_tasks?: string[];
    validated_by?: string;
  };
  changes_since_last_session: Array<{
    title: string;
    description: string;
    evidence_ids: string[];
    importance: 'low' | 'medium' | 'high';
  }>;
  risks: Array<{
    type: string;
    severity: string;
    status: string;
    evidence_ids: string[];
  }>;
  goals: Array<{
    goal: string;
    status: string;
    progress?: string;
  }>;
  open_loops: Array<{
    title: string;
    owner: 'patient' | 'psychologist' | 'system';
    due_at?: string;
  }>;
};
```

---

## Endpoints mínimos

### Auth y perfil

```http
GET /api/me
PATCH /api/me/profile
```

### Consentimientos

```http
GET /api/consents/current
POST /api/consents/accept
GET /api/consents/history
```

### Directorio psicólogos

```http
GET /api/public/psychologists
GET /api/public/psychologists/:slug
POST /api/psychologists/apply
PATCH /api/admin/psychologists/:id/verify
```

### Paciente

```http
GET /api/patient/dashboard
GET /api/patient/timeline
GET /api/patient/documents
POST /api/patient/documents
GET /api/patient/history
POST /api/patient/data-export
POST /api/patient/delete-request
```

### Chat

```http
POST /api/chat/sessions
POST /api/chat/sessions/:id/messages
POST /api/chat/sessions/:id/close
GET /api/chat/sessions/:id/messages
```

### Motor clínico

```http
POST /api/clinical/documents/:id/process
POST /api/clinical/chat-sessions/:id/process
GET /api/clinical/patients/:id/proposals
PATCH /api/clinical/proposals/:id/accept
PATCH /api/clinical/proposals/:id/reject
PATCH /api/clinical/proposals/:id/edit-and-accept
GET /api/clinical/patients/:id/snapshot
POST /api/clinical/patients/:id/rebuild-snapshot
```

### Psicólogo

```http
GET /api/pro/dashboard
GET /api/pro/patients
GET /api/pro/patients/:id/360
GET /api/pro/patients/:id/evidence
GET /api/pro/patients/:id/raw
GET /api/pro/patients/:id/ai-analysis
POST /api/pro/patients/:id/soap/generate
PATCH /api/pro/soap/:id/validate
POST /api/pro/patients/:id/briefings
```

---

## Eventos internos

La app debe ser event-driven para alimentar memoria.

```ts
type ClinicalEvent =
  | { type: 'document.uploaded'; patient_id: string; document_id: string }
  | { type: 'document.extracted'; patient_id: string; document_id: string; extraction_id: string }
  | { type: 'chat.message.created'; patient_id: string; session_id: string; message_id: string }
  | { type: 'chat.session.closed'; patient_id: string; session_id: string }
  | { type: 'proposal.created'; patient_id: string; proposal_id: string }
  | { type: 'proposal.accepted'; patient_id: string; proposal_id: string }
  | { type: 'risk.detected'; patient_id: string; risk_event_id: string; severity: string }
  | { type: 'soap.validated'; patient_id: string; soap_id: string }
  | { type: 'snapshot.rebuilt'; patient_id: string; snapshot_id: string };
```

---

## Estados obligatorios por UI

Cada pantalla que consuma datos clínicos debe tener:

- loading,
- empty,
- error,
- no_permission,
- needs_consent,
- degraded_mode,
- success.

---

## Regla para el frontend

El frontend no decide autoridad clínica. Solo muestra estados y envía acciones.

La autoridad se decide en backend según:

1. fuente,
2. rol del revisor,
3. estado de validación,
4. evidencia disponible,
5. política clínica.
