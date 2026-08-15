# 02. Persistencia en Firebase & Reglas de Seguridad de Firestore

**Proyecto:** Áncora / EN-78 — Cognitive Memory Engine  
**Destino:** Google Cloud Firestore + Firebase Authentication (Custom Claims) + Firebase Hosting  

---

## 1. Esquema Completo de Colecciones y Subcolecciones en Firestore

```text
firestore
├── patients/{patientId}                                  [Documento raíz de paciente]
│   ├── profile/current                                  [Ficha sociodemográfica y médica]
│   ├── sessions/{sessionId}                             [Sesiones de chat interactivo y terapia]
│   │   └── messages/{messageId}                         [Turnos de diálogo individuales inmutables]
│   ├── episodes/{episodeId}                             [Eventos biográficos, crisis y episodios]
│   ├── memories/{memoryId}                              [Memorias factuales y episódicas extraídas]
│   ├── goals/{goalId}                                   [Objetivos terapéuticos y conductuales]
│   ├── semanticProfile/current                          [Snapshot cognitivo y esquemas sintetizados]
│   ├── semantic_memories/{memoryId}                     [Memorias semánticas vectorizadas / RAG]
│   ├── directives/{directiveId}                         [Reglas clínicas activas para Walter IA]
│   └── summaries/{summaryId}                            [Borradores e informes de Notas SOAP]
│
├── clinicalKnowledge/{knowledgeId}                      [Base global de conocimiento psicoterapéutico]
├── protocols/{protocolId}                               [Protocolos clínicos estandarizados]
└── auditLogs/{logId}                                    [Registro inmutable de auditoría y RGPD]
```

---

## 2. Tipos de Datos TypeScript (`firestore.types.ts`)

```typescript
import { Timestamp, VectorValue } from 'firebase/firestore';

export enum AuthorityLevel {
  VALIDATED = 1,   // Confirmado/validado explícitamente por el psicólogo colegiado
  DOCUMENTED = 2,  // Extraído de informes médicos/peritajes oficiales subidos
  DECLARED = 3,    // Afirmado directamente por el paciente durante el diálogo
  INFERRED = 4     // Inferencia generada por IA (Walter IA / Hermes Engine)
}

export interface PatientRootDocument {
  id: string;                                // patientId (UID Firebase Auth)
  authUid: string;
  assignedPsychologistId: string;           // UID del psicólogo responsable
  coSupervisorIds?: string[];               // UIDs de psicólogos supervisores
  status: 'active' | 'paused' | 'crisis' | 'discharged';
  tier: 'essential' | 'intermediate' | 'intensive';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastActivityAt: Timestamp;
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
    consentToContact: boolean;
  };
  consentSignedAt: Timestamp;
  encryptionKeyVersion: number;
}

export interface PatientProfileCurrent {
  personalInfo: {
    alias: string;
    preferredPronoun: string;
    timezone: string;
    language: string;
  };
  clinicalMetadata: {
    diagnosisICD11: string[];
    psychiatricTreatments: string[];
    allergyFlags: string[];
    primaryClinicalFocus: string;
  };
  riskAssessment: {
    baselineSuicideRisk: 'none' | 'low' | 'moderate' | 'high' | 'critical';
    selfHarmHistory: boolean;
    substanceAbuse: boolean;
    currentRiskLevel: 'none' | 'low' | 'moderate' | 'high' | 'critical';
    lastRiskEvaluationAt: Timestamp;
    lastEvaluatedBy: string;
  };
  updatedAt: Timestamp;
  updatedBy: string;
}

export interface SessionDocument {
  id: string;
  patientId: string;
  type: 'interactive_chat' | 'clinical_review' | 'crisis_intervention' | 'soap_briefing';
  status: 'active' | 'completed' | 'cancelled' | 'analyzing';
  startedAt: Timestamp;
  endedAt?: Timestamp;
  turnCount: number;
  moodBefore?: { anxiety: number; impulsivity: number; notes?: string; };
  moodAfter?: { anxiety: number; impulsivity: number; reliefScore?: number; };
  psychologistReviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  clinicianNotes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SessionMessageDocument {
  id: string;
  sessionId: string;
  sender: 'patient' | 'ai' | 'psychologist';
  senderUid: string;
  content: string;
  timestamp: Timestamp;
  tokens?: number;
  riskFlagDetected?: boolean;
}

export interface DirectiveDocument {
  id: string;
  patientId: string;
  type: 'hard_boundary' | 'mandatory_interlock' | 'forbidden_topic' | 'coping_protocol' | 'emergency_trigger';
  instruction: string;
  priority: 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';
  triggerConditions: string[];
  actionProtocol?: 'ice_water_freeze' | 'broker_lockout' | 'immediate_crisis_alert' | 'deflect_to_therapist';
  isActive: boolean;
  setBy: string; // UID del psicólogo responsable
  clinicalJustification: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 3. Reglas de Seguridad de Producción (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isUser(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }

    function getRole() {
      return request.auth.token.role;
    }

    function isAdmin() {
      return isAuthenticated() && getRole() == 'admin';
    }

    function isSystem() {
      return isAuthenticated() && getRole() == 'system';
    }

    function isPsychologist() {
      return isAuthenticated() && getRole() == 'psychologist';
    }

    function isPatientUser() {
      return isAuthenticated() && (getRole() == 'patient' || getRole() == 'emilio');
    }

    function isAssignedPsychologist(patientId) {
      return isPsychologist() && (
        (request.auth.token.assignedPatients is list && patientId in request.auth.token.assignedPatients) ||
        get(/databases/$(database)/documents/patients/$(patientId)).data.assignedPsychologistId == request.auth.uid ||
        (get(/databases/$(database)/documents/patients/$(patientId)).data.coSupervisorIds is list && 
         request.auth.uid in get(/databases/$(database)/documents/patients/$(patientId)).data.coSupervisorIds)
      );
    }

    function isPatientOwner(patientId) {
      return isUser(patientId) && isPatientUser();
    }

    function hasClinicalAccess(patientId) {
      return isAdmin() || isSystem() || isAssignedPsychologist(patientId);
    }

    // PACIENTES
    match /patients/{patientId} {
      allow read: if isPatientOwner(patientId) || hasClinicalAccess(patientId);
      allow create: if isAdmin() || isSystem();
      allow update: if hasClinicalAccess(patientId) || (
        isPatientOwner(patientId) &&
        !request.resource.data.diff(resource.data).affectedKeys().hasAny([
          'assignedPsychologistId', 'coSupervisorIds', 'status', 'tier', 'encryptionKeyVersion'
        ])
      );
      allow delete: if isAdmin();

      // Perfil
      match /profile/current {
        allow read: if isPatientOwner(patientId) || hasClinicalAccess(patientId);
        allow update: if hasClinicalAccess(patientId) || (
          isPatientOwner(patientId) &&
          !request.resource.data.diff(resource.data).affectedKeys().hasAny([
            'clinicalMetadata', 'riskAssessment', 'treatmentPlanId'
          ])
        );
        allow create: if hasClinicalAccess(patientId);
        allow delete: if isAdmin();
      }

      // Sesiones y Mensajes
      match /sessions/{sessionId} {
        allow read: if isPatientOwner(patientId) || hasClinicalAccess(patientId);
        allow create: if (isPatientOwner(patientId) && request.resource.data.patientId == patientId) || hasClinicalAccess(patientId);
        allow update: if hasClinicalAccess(patientId) || (
          isPatientOwner(patientId) &&
          !request.resource.data.diff(resource.data).affectedKeys().hasAny([
            'psychologistReviewed', 'reviewedBy', 'reviewedAt', 'clinicianNotes', 'soapDraftId'
          ])
        );
        allow delete: if isAdmin();

        match /messages/{messageId} {
          allow read: if isPatientOwner(patientId) || hasClinicalAccess(patientId);
          allow create: if (
            isPatientOwner(patientId) && 
            request.resource.data.sender == 'patient' &&
            request.resource.data.senderUid == request.auth.uid
          ) || hasClinicalAccess(patientId);
          // Inmutabilidad de turnos registrados
          allow update, delete: if false;
        }
      }

      // Episodios
      match /episodes/{episodeId} {
        allow read: if isPatientOwner(patientId) || hasClinicalAccess(patientId);
        allow create: if hasClinicalAccess(patientId) || (
          isPatientOwner(patientId) &&
          request.resource.data.authorityLevel == 3 &&
          request.resource.data.patientId == patientId
        );
        allow update: if hasClinicalAccess(patientId) || (
          isPatientOwner(patientId) &&
          resource.data.authorityLevel == 3 &&
          resource.data.validatedBy == null &&
          request.resource.data.authorityLevel == 3
        );
        allow delete: if hasClinicalAccess(patientId);
      }

      // Memorias
      match /memories/{memoryId} {
        allow read: if isPatientOwner(patientId) || hasClinicalAccess(patientId);
        allow create: if hasClinicalAccess(patientId) || (
          isPatientOwner(patientId) &&
          request.resource.data.authorityLevel == 3 &&
          request.resource.data.status == 'proposed'
        );
        allow update, delete: if hasClinicalAccess(patientId);
      }

      // Semantic Profile: PACIENTE BLOQUEADO
      match /semanticProfile/current {
        allow read: if isPatientOwner(patientId) || hasClinicalAccess(patientId);
        allow write: if hasClinicalAccess(patientId);
      }

      // Semantic Memories: PACIENTE BLOQUEADO
      match /semantic_memories/{memoryId} {
        allow read: if isPatientOwner(patientId) || hasClinicalAccess(patientId);
        allow write: if hasClinicalAccess(patientId);
      }

      // Directivas Clínicas: PACIENTE BLOQUEADO
      match /directives/{directiveId} {
        allow read: if isPatientOwner(patientId) || hasClinicalAccess(patientId);
        allow write: if hasClinicalAccess(patientId);
      }

      // Summaries / SOAP: PACIENTE BLOQUEADO
      match /summaries/{summaryId} {
        allow read: if isPatientOwner(patientId) || hasClinicalAccess(patientId);
        allow create, update: if hasClinicalAccess(patientId);
        allow delete: if isAdmin();
      }
    }

    // Colecciones Globales
    match /clinicalKnowledge/{knowledgeId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || (isPsychologist() && request.auth.token.role == 'clinical_director');
    }

    match /protocols/{protocolId} {
      allow read: if isAuthenticated();
      allow write: if isAdmin() || (isPsychologist() && request.auth.token.role == 'clinical_director');
    }

    match /auditLogs/{logId} {
      allow read: if isAdmin();
      allow create: if isAuthenticated() && request.resource.data.actorId == request.auth.uid;
      allow update, delete: if false; // Inmutable 100%
    }
  }
}
```

---

## 4. Índices Compuestos (`firestore.indexes.json`)

Se definen los índices necesarios para consultas compuestas $O(1)$:
- `sessions`: `patientId ASC`, `startedAt DESC`.
- `messages`: `sessionId ASC`, `timestamp ASC`.
- `episodes`: `patientId ASC`, `authorityLevel ASC`, `occurredAt DESC`.
- `memories`: `patientId ASC`, `category ASC`, `relevanceScore DESC`.
- `directives`: `patientId ASC`, `isActive ASC`, `priority ASC`.
- `auditLogs`: `patientId ASC`, `timestamp DESC`.
