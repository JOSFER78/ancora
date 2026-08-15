# ⚓ 04 · Contratos de Interfaz y Esquemas de Dominio (TypeScript & Zod) — Áncora Clinical Engine

**Ubicación:** `docs/architecture/04_contracts.md`  
**Estado:** Activo / Producción  
**Estándar:** TypeScript 5.x Strict + Zod 3.x + SHA-256 Audit Trail + Bi-temporalidad  
**Niveles de Autoridad:** N1 (Psicólogo Colegiado) | N2 (Documentado) | N3 (Declarado) | N4 (Inferencia IA)

---

## 1. Primitivas y Tipos Base Compartidos

```typescript
import { z } from 'zod';

// ==========================================
// 1.1 Primitivas Clínicas y Criptográficas
// ==========================================

export const UUIDSchema = z.string().uuid({ message: 'Identificador UUID v4 inválido' });
export type UUID = z.infer<typeof UUIDSchema>;

export const ISODateTimeSchema = z.string().datetime({ message: 'Formato de fecha/hora ISO 8601 inválido' });
export type ISODateTime = z.infer<typeof ISODateTimeSchema>;

export const SHA256HashSchema = z.string().regex(/^[a-f0-9]{64}$/i, { message: 'Hash SHA-256 inválido (debe tener 64 caracteres hexadecimales)' });
export type SHA256Hash = z.infer<typeof SHA256HashSchema>;

/**
 * Jerarquía de Autoridad Clínica Estricta:
 * - 1 (N1): Validado por Psicólogo Colegiado (100% de confianza, máxima precedencia).
 * - 2 (N2): Documentado en informes médicos oficiales (90-95% confianza, hash de documento obligatorio).
 * - 3 (N3): Declarado por el paciente (50-70% confianza, expresión fenoménica, nunca hecho médico probado).
 * - 4 (N4): Inferencia IA / Cuarentena (0-85% confianza, borrador exploratorio, nunca diagnóstico formal directo).
 */
export const AuthorityLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4)
], {
  description: 'Nivel de Autoridad Clínica (1=Psicólogo Colegiado, 2=Documentado, 3=Declarado, 4=Inferencia IA)'
});
export type AuthorityLevel = z.infer<typeof AuthorityLevelSchema>;

export const MemoryStateSchema = z.enum([
  'candidate',   // Propuesta extraída pendiente de validación o activación
  'active',      // Memoria activa y vigente en el contexto clínico actual
  'superseded',  // Reemplazada por evolución clínica temporal (A -> B)
  'disputed',    // En conflicto con otra evidencia; requiere arbitraje HITL
  'archived'     // Archivada históricamente
]);
export type MemoryState = z.infer<typeof MemoryStateSchema>;

export const SeverityLevelSchema = z.enum(['low', 'moderate', 'high', 'critical']);
export type SeverityLevel = z.infer<typeof SeverityLevelSchema>;

export const BiTemporalRangeSchema = z.object({
  validFrom: ISODateTimeSchema,
  validTo: ISODateTimeSchema.optional(),
  recordedAt: ISODateTimeSchema,
  supersededAt: ISODateTimeSchema.optional()
});
export type BiTemporalRange = z.infer<typeof BiTemporalRangeSchema>;

export const VerbatimQuoteSchema = z.object({
  quoteId: UUIDSchema,
  text: z.string().min(1, 'La cita textual no puede estar vacía'),
  sourceType: z.enum(['chat_message', 'document', 'session_transcription', 'diary_entry']),
  sourceId: UUIDSchema,
  dateObserved: ISODateTimeSchema,
  characterOffset: z.object({
    start: z.number().int().nonnegative(),
    end: z.number().int().positive()
  }).optional()
});
export type VerbatimQuote = z.infer<typeof VerbatimQuoteSchema>;
```

---

## 2. Capa 1: Ingesta y Contexto (Paciente - IA)

```typescript
// ==========================================
// 2.1 Interacción Conversacional Paciente-IA
// ==========================================

export const UserRoleSchema = z.enum([
  'patient',
  'psychologist',
  'supervisor',
  'system_engine',
  'ai_assistant'
]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const ChatMessageSchema = z.object({
  id: UUIDSchema,
  patientId: UUIDSchema,
  sessionId: UUIDSchema,
  sender: z.enum(['patient', 'ai_assistant']),
  content: z.string().min(1, 'El mensaje no puede ser emitido vacío'),
  timestamp: ISODateTimeSchema,
  emotionalValence: z.number().min(-1.0).max(1.0).default(0.0),
  emotionalIntensity: z.number().int().min(1).max(10).default(5),
  detectedTopics: z.array(z.string()).default([]),
  riskScore: z.number().min(0.0).max(1.0).default(0.0),
  tokensUsed: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).default({})
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatSessionStateSchema = z.object({
  sessionId: UUIDSchema,
  patientId: UUIDSchema,
  startedAt: ISODateTimeSchema,
  endedAt: ISODateTimeSchema.optional(),
  status: z.enum(['active', 'paused', 'closed', 'escalated_to_crisis']),
  messageCount: z.number().int().nonnegative().default(0),
  dominantEmotion: z.string().default('neutral'),
  maxIntensityObserved: z.number().int().min(1).max(10).default(1),
  safetyModeActive: z.boolean().default(false)
});
export type ChatSessionState = z.infer<typeof ChatSessionStateSchema>;

// ==========================================
// 2.2 Working Memory Buffer (Memoria de Trabajo)
// ==========================================

export const WorkingMemoryBufferSchema = z.object({
  bufferId: UUIDSchema,
  patientId: UUIDSchema,
  sessionId: UUIDSchema,
  unconsolidatedEpisodes: z.array(z.object({
    episodeId: UUIDSchema,
    occurredAt: ISODateTimeSchema,
    narrative: z.string().min(5),
    verbatimQuotes: z.array(VerbatimQuoteSchema).min(1, 'Todo episodio requiere al menos una cita verbatim'),
    emotionalValence: z.number().min(-1.0).max(1.0),
    emotionalIntensity: z.number().int().min(1).max(10),
    cognitiveDistortions: z.array(z.string()).default([]),
    somaticSymptoms: z.array(z.string()).default([]),
    copingMechanismsUsed: z.array(z.string()).default([]),
    authorityLevel: AuthorityLevelSchema.default(3),
    state: MemoryStateSchema.default('candidate')
  })),
  candidateMemories: z.array(z.object({
    candidateId: UUIDSchema,
    topic: z.string().min(2),
    claim: z.string().min(5),
    verbatimQuotes: z.array(VerbatimQuoteSchema).min(1),
    confidence: z.number().min(0.0).max(1.0),
    suggestedAuthorityLevel: AuthorityLevelSchema.default(4),
    detectedAt: ISODateTimeSchema
  })),
  activeAffectiveState: z.object({
    predominantEmotion: z.string(),
    intensity: z.number().int().min(1).max(10),
    valence: z.number().min(-1.0).max(1.0),
    lastUpdated: ISODateTimeSchema
  }),
  tokenBudget: z.object({
    allocatedBudget: z.number().int().positive().default(1500),
    currentEstimatedTokens: z.number().int().nonnegative(),
    breakdown: z.object({
      crisisDirectivesTokens: z.number().int().default(200),
      activeDirectivesTokens: z.number().int().default(300),
      patientCoreSnapshotTokens: z.number().int().default(250),
      verbatimQuotesTokens: z.number().int().default(250),
      immediateHistoryTokens: z.number().int().default(500)
    })
  }),
  lastFlushedAt: ISODateTimeSchema.optional()
});
export type WorkingMemoryBuffer = z.infer<typeof WorkingMemoryBufferSchema>;

// ==========================================
// 2.3 Extracciones Preliminares de Ingesta
// ==========================================

export const PreliminaryExtractionSchema = z.object({
  extractionId: UUIDSchema,
  patientId: UUIDSchema,
  sourceType: z.enum(['chat_stream', 'document_upload', 'audio_voice_note', 'daily_checkin']),
  sourceReferenceId: UUIDSchema,
  extractedAt: ISODateTimeSchema,
  extractorModelVersion: z.string().default('hermes-clinical-v5'),
  facts: z.array(z.object({
    factId: UUIDSchema,
    category: z.enum([
      'symptom',
      'medication_intake',
      'life_event',
      'core_belief',
      'relational_dynamic',
      'somatic_response',
      'therapeutic_barrier'
    ]),
    statement: z.string().min(3),
    verbatimEvidence: VerbatimQuoteSchema,
    confidence: z.number().min(0.0).max(1.0),
    authorityLevel: AuthorityLevelSchema.default(4)
  })),
  potentialContradictions: z.array(z.object({
    contradictionId: UUIDSchema,
    existingMemoryId: UUIDSchema,
    conflictingStatement: z.string(),
    reason: z.string()
  })).default([]),
  needsImmediateHumanReview: z.boolean().default(false)
});
export type PreliminaryExtraction = z.infer<typeof PreliminaryExtractionSchema>;
```

---

## 3. Capa 2: Sincronización de Archivos (File-based Context)

```typescript
// ==========================================
// 3.1 Encabezado Frontmatter y Contexto de Archivo
// ==========================================

export const PatientFileFrontmatterSchema = z.object({
  patientId: UUIDSchema,
  schemaVersion: z.literal('5.0.0'),
  documentType: z.enum([
    'patient_master_record',
    'clinical_timeline_log',
    'semantic_profile_store',
    'medication_history_index',
    'risk_and_safety_ledger'
  ]),
  lastUpdated: ISODateTimeSchema,
  authorId: UUIDSchema,
  authorRole: UserRoleSchema,
  contentSha256: SHA256HashSchema,
  previousContentSha256: SHA256HashSchema.nullable(),
  encryption: z.object({
    algorithm: z.literal('AES-GCM-256'),
    keyFingerprint: z.string().min(8),
    encryptedPayload: z.boolean().default(true)
  }),
  gdprCompliance: z.object({
    consentScope: z.enum(['treatment_only', 'treatment_and_ai_supervision', 'restricted_audit']),
    anonymizedForSecondaryReview: z.boolean().default(false),
    retentionLimitDate: ISODateTimeSchema.optional()
  })
});
export type PatientFileFrontmatter = z.infer<typeof PatientFileFrontmatterSchema>;

// ==========================================
// 3.2 Estructura JSON del Perfil Cognitivo Completo
// ==========================================

export const PatientStructuredFilePayloadSchema = z.object({
  header: PatientFileFrontmatterSchema,
  coreProfile: z.object({
    displayName: z.string(),
    birthYear: z.number().int().min(1900).max(2026).optional(),
    assignedPsychologistId: UUIDSchema,
    psychologistLicenseNumber: z.string().min(4),
    primaryDiagnosisCode: z.string().optional(),
    riskTier: SeverityLevelSchema.default('low')
  }),
  clinicalTimeline: z.array(z.object({
    eventId: UUIDSchema,
    eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha YYYY-MM-DD requerido'),
    category: z.enum(['vital_event', 'symptom_spike', 'crisis_trigger', 'behavioral_pattern', 'medication_change']),
    description: z.string(),
    verbatimQuotes: z.array(VerbatimQuoteSchema),
    authorityLevel: AuthorityLevelSchema,
    validatedByPsychologistId: UUIDSchema.optional(),
    biTemporal: BiTemporalRangeSchema
  })),
  semanticProfile: z.object({
    traits: z.record(z.object({
      score: z.number().min(0).max(100),
      evidenceQuotes: z.array(VerbatimQuoteSchema),
      lastUpdated: ISODateTimeSchema
    })),
    coreBeliefs: z.array(z.object({
      beliefId: UUIDSchema,
      belief: z.string(),
      schemaType: z.string(),
      strength: z.number().min(1).max(10),
      authorityLevel: AuthorityLevelSchema,
      state: MemoryStateSchema
    })),
    protectiveFactors: z.array(z.string()),
    knownTriggers: z.array(z.object({
      stimulus: z.string(),
      typicalReaction: z.string(),
      severity: z.number().int().min(1).max(10),
      copingProtocol: z.string()
    }))
  }),
  activeMedications: z.array(z.object({
    medicationId: UUIDSchema,
    commercialName: z.string(),
    activePrinciple: z.string(),
    dosage: z.string(),
    posologyFrequency: z.string(),
    prescribedBy: z.string().optional(),
    sourceDocumentSha256: SHA256HashSchema.optional(),
    authorityLevel: AuthorityLevelSchema,
    status: z.enum(['active', 'paused', 'discontinued'])
  })),
  tamperProofAuditTrail: z.array(z.object({
    auditId: UUIDSchema,
    timestamp: ISODateTimeSchema,
    actorId: UUIDSchema,
    actorRole: UserRoleSchema,
    action: z.enum([
      'FILE_INITIALIZED',
      'DELTA_APPLIED',
      'HITL_PROMOTION_N4_TO_N1',
      'DIRECTIVE_MUTATION',
      'RECORD_ARCHIVED'
    ]),
    targetSection: z.string(),
    deltaSha256: SHA256HashSchema,
    signature: z.string().min(16)
  }))
});
export type PatientStructuredFilePayload = z.infer<typeof PatientStructuredFilePayloadSchema>;
```

---

## 4. Capa 3: Interfaz Terapéutica

```typescript
// ==========================================
// 4.1 Smart SOAP Drafts
// ==========================================

export const SmartSoapDraftSchema = z.object({
  soapId: UUIDSchema,
  patientId: UUIDSchema,
  psychologistId: UUIDSchema,
  weekRange: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  generatedAt: ISODateTimeSchema,
  status: z.enum(['ai_draft_n4', 'in_review', 'validated_n1', 'amended']),
  
  // S: Subjetivo (Síntesis de mensajes y vivencias del paciente)
  subjective: z.object({
    narrativeSummary: z.string().min(10),
    reportedSymptoms: z.array(z.string()),
    primaryStressors: z.array(z.string()),
    verbatimQuotes: z.array(VerbatimQuoteSchema).min(1, 'El apartado Subjetivo exige citas verbatim justificativas')
  }),
  
  // O: Objetivo (Métricas cuantitativas y adherencia)
  objective: z.object({
    diaryCompletionRatePercentage: z.number().min(0).max(100),
    averageSleepHours: z.number().min(0).max(24),
    anxietyScoresDaily: z.array(z.object({
      date: z.string(),
      score: z.number().int().min(1).max(10)
    })),
    impulsivityScoresDaily: z.array(z.object({
      date: z.string(),
      score: z.number().int().min(1).max(10)
    })),
    medicationAdherenceReported: z.enum(['full', 'partial', 'none', 'not_applicable']),
    chatInteractionsTotal: z.number().int().nonnegative()
  }),
  
  // A: Evaluación / Assessment (Hipótesis IA en Cuarentena N4)
  assessment: z.object({
    aiClinicalHypothesis: z.string().min(10),
    authorityLevel: z.literal(4),
    confidenceScore: z.number().min(0.0).max(1.0),
    detectedCognitivePatterns: z.array(z.string()),
    evolutionVsPreviousWeek: z.enum(['significant_improvement', 'mild_improvement', 'stable', 'mild_deterioration', 'critical_decompensation']),
    clinicalJustification: z.string()
  }),
  
  // P: Plan (Propuesta de tareas e intervención)
  plan: z.object({
    proposedInterventions: z.array(z.string()).min(1),
    recommendedBriefingFocus: z.string().min(10),
    prescribedTasksForPatient: z.array(z.object({
      taskId: UUIDSchema,
      title: z.string(),
      category: z.enum(['behavioral_activation', 'cognitive_journal', 'somatic_grounding', 'exposure_exercise']),
      frequency: z.string()
    })),
    recommendedNextReviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  }),
  
  clinicalValidation: z.object({
    validatedByColegiadoNumber: z.string().optional(),
    validatedAt: ISODateTimeSchema.optional(),
    psychologistAmendmentsNote: z.string().optional(),
    approvedAuthorityLevel: z.literal(1).optional()
  }).optional()
});
export type SmartSoapDraft = z.infer<typeof SmartSoapDraftSchema>;

// ==========================================
// 4.2 Alertas y Eventos de Riesgo Clínico
// ==========================================

export const RiskEventSchema = z.object({
  riskId: UUIDSchema,
  patientId: UUIDSchema,
  detectedAt: ISODateTimeSchema,
  severity: SeverityLevelSchema,
  riskCategory: z.enum([
    'autolisis_directa',
    'autolisis_indirecta',
    'autolesion',
    'abuso_sustancias_agudo',
    'descompensacion_psicotica',
    'agresion_violencia',
    'abandono_tratamiento_critico'
  ]),
  evidence: z.object({
    sourceType: z.enum(['chat_message', 'diary_entry', 'voice_tone_analysis', 'task_omission']),
    sourceId: UUIDSchema,
    verbatimQuote: z.string().min(1),
    contextualDialogueWindow: z.array(z.string()).default([])
  }),
  escalationProtocol: z.object({
    immediateSafeResponseGiven: z.string(),
    emergencyLinesProvided: z.array(z.string()).default(['024 (Línea Prevención Suicidio)', '112 (Emergencias Generales)']),
    supervisorNotificationSent: z.boolean(),
    assignedPsychologistAlerted: z.boolean(),
    acknowledgedBySupervisorId: UUIDSchema.optional(),
    resolvedAt: ISODateTimeSchema.optional()
  })
});
export type RiskEvent = z.infer<typeof RiskEventSchema>;

// ==========================================
// 4.3 Teleprompter Inteligente del Psicólogo
// ==========================================

export const TeleprompterCueSchema = z.object({
  cueId: UUIDSchema,
  timeOffsetSeconds: z.number().int().nonnegative(),
  durationSeconds: z.number().int().positive(),
  cueType: z.enum(['verbatim_quote_highlight', 'metric_callout', 'clinical_prompt', 'empathy_anchor']),
  headline: z.string().max(80),
  bodyText: z.string().max(300),
  linkedQuote: VerbatimQuoteSchema.optional(),
  highlightMetric: z.object({
    label: z.string(),
    value: z.string(),
    trend: z.enum(['up', 'down', 'stable'])
  }).optional()
});
export type TeleprompterCue = z.infer<typeof TeleprompterCueSchema>;

export const TeleprompterSessionScriptSchema = z.object({
  scriptId: UUIDSchema,
  patientId: UUIDSchema,
  psychologistId: UUIDSchema,
  targetVideoDurationMinutes: z.number().int().min(3).max(15).default(5),
  generatedAt: ISODateTimeSchema,
  cues: z.array(TeleprompterCueSchema).min(1),
  recordingStatus: z.enum(['draft', 'ready_to_record', 'recorded', 'published_to_patient']),
  publishedVideoUrl: z.string().url().optional()
});
export type TeleprompterSessionScript = z.infer<typeof TeleprompterSessionScriptSchema>;
```

---

## 5. Capa 4: Supervisión Humana HITL (Human-in-the-Loop)

```typescript
// ==========================================
// 5.1 Directivas Clínicas Vinculantes (Psicólogo -> IA)
// ==========================================

export const ClinicalDirectiveScopeSchema = z.enum([
  'crisis_intervention',
  'trauma_boundary',
  'cognitive_reframing',
  'medication_monitoring',
  'behavioral_activation'
]);
export type ClinicalDirectiveScope = z.infer<typeof ClinicalDirectiveScopeSchema>;

export const ClinicalDirectiveActionTypeSchema = z.enum([
  'focus_on',
  'avoid_topic',
  'reinforce_technique',
  'monitor_pattern',
  'escalate_if'
]);
export type ClinicalDirectiveActionType = z.infer<typeof ClinicalDirectiveActionTypeSchema>;

export const ClinicalDirectiveSchema = z.object({
  id: UUIDSchema,
  patientId: UUIDSchema,
  psychologistId: UUIDSchema,
  colegiadoNumber: z.string().min(3, 'N.º de colegiado oficial obligatorio'),
  priority: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5)
  ], { description: '1=Crítica/Inviolable, 5=Guía leve' }),
  scope: ClinicalDirectiveScopeSchema,
  actionType: ClinicalDirectiveActionTypeSchema,
  instruction: z.string().min(10, 'La instrucción clínica debe ser explícita y precisa'),
  clinicalRationale: z.string().min(5),
  validFrom: ISODateTimeSchema,
  validUntil: ISODateTimeSchema.nullable(),
  authorityLevel: z.literal(1),
  status: z.enum(['active', 'expired', 'superseded', 'revoked']),
  tokenCostEstimate: z.number().int().positive().default(60)
});
export type ClinicalDirective = z.infer<typeof ClinicalDirectiveSchema>;

// ==========================================
// 5.2 Propuestas Clínicas y Arbitraje HITL
// ==========================================

export const ClinicalProposalTypeSchema = z.enum([
  'create_timeline_event',
  'create_or_update_medication',
  'update_core_belief',
  'register_risk_event',
  'formulate_therapeutic_goal',
  'ask_patient_clarification',
  'ask_psychologist_review'
]);
export type ClinicalProposalType = z.infer<typeof ClinicalProposalTypeSchema>;

export const ClinicalProposalSchema = z.object({
  proposalId: UUIDSchema,
  patientId: UUIDSchema,
  proposalType: ClinicalProposalTypeSchema,
  title: z.string().min(3),
  proposedPayload: z.record(z.unknown()),
  evidenceQuotes: z.array(VerbatimQuoteSchema).min(1, 'Ninguna propuesta puede emitirse sin evidencia verbatim'),
  sourceType: z.enum(['chat', 'document', 'session', 'weekly_review']),
  aiConfidence: z.number().min(0.0).max(1.0),
  initialAuthorityLevel: z.literal(4),
  severity: z.enum(['info', 'attention', 'urgent']).default('info'),
  status: z.enum(['pending', 'accepted', 'edited_and_accepted', 'rejected']),
  reviewerRole: z.enum(['psychologist', 'supervisor']).optional(),
  reviewedBy: UUIDSchema.optional(),
  reviewedAt: ISODateTimeSchema.optional(),
  rejectionReason: z.string().optional()
});
export type ClinicalProposal = z.infer<typeof ClinicalProposalSchema>;

// ==========================================
// 5.3 Resolución y Elevación de Autoridad (HITL Validation)
// ==========================================

export const ProposalResolutionPayloadSchema = z.object({
  proposalId: UUIDSchema,
  action: z.enum(['ACCEPT', 'EDIT_AND_ACCEPT', 'REJECT']),
  psychologistId: UUIDSchema,
  colegiadoNumber: z.string().min(3),
  editedPayload: z.record(z.unknown()).optional(),
  clinicalComment: z.string().min(5, 'Toda decisión clínica debe registrar una justificación'),
  resultingAuthorityLevel: z.literal(1),
  timestamp: ISODateTimeSchema,
  cryptographicSignature: SHA256HashSchema
});
export type ProposalResolutionPayload = z.infer<typeof ProposalResolutionPayloadSchema>;

// ==========================================
// 5.4 Registro de Auditoría Médica Inmutable
// ==========================================

export const ClinicalAuditLogEventSchema = z.object({
  auditEventId: UUIDSchema,
  timestamp: ISODateTimeSchema,
  patientId: UUIDSchema,
  actor: z.object({
    id: UUIDSchema,
    role: UserRoleSchema,
    ipAddress: z.string().ip().optional(),
    sessionTokenFingerprint: z.string().optional()
  }),
  action: z.enum([
    'MEMORY_CAPTURED',
    'MEMORY_RETRIEVED',
    'MEMORY_CONSOLIDATED',
    'MEMORY_MUTATED',
    'PROPOSAL_CREATED',
    'PROPOSAL_RESOLVED_HITL',
    'AUTHORITY_PROMOTED_N4_TO_N1',
    'CRITICAL_RISK_ESCALATED',
    'DIRECTIVE_INJECTED',
    'SOAP_VALIDATED_N1'
  ]),
  targetResourceId: UUIDSchema,
  targetResourceType: z.enum([
    'Memory',
    'Episode',
    'ClinicalProposal',
    'ClinicalDirective',
    'SmartSoapDraft',
    'RiskEvent',
    'StructuredContextFile'
  ]),
  payloadDelta: z.record(z.unknown()),
  previousStateHash: SHA256HashSchema.nullable(),
  newStateHash: SHA256HashSchema,
  signatureSha256: SHA256HashSchema
});
export type ClinicalAuditLogEvent = z.infer<typeof ClinicalAuditLogEventSchema>;
```
