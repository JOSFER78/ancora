# 03. Núcleo Cognitivo y Contratos de Dominio — Áncora Cognitive Memory Engine

**Módulo:** Áncora Memory Engine Core & Domain Layer  
**Tecnología:** TypeScript estricto, Máquina de Estados Finita, Bi-temporalidad, Criptografía SHA-256 para auditoría.

---

## 1. Fundamentos Arquitectónicos del Motor

El **Áncora Cognitive Memory Engine** implementa una arquitectura de memoria cognitiva **bi-temporal y basada en grafos clínicos** para la atención psicológica y el blindaje conductual.

```text
                 ÁNCORA MEMORY ENGINE
                         │
       ┌─────────────────┼──────────────────┐
       │                 │                  │
     RECORD            READ              LEARN
   (Capture)        (Retrieve)       (Consolidate)
       │                 │                  │
       ▼                 ▼                  ▼
   Episodios        Recuperación       Consolidación
       │              Ponderada          Semántica
       └─────────────────┼──────────────────┘
                         │
                   Patient State
             (Bi-Temporal Evolution)
                         │
             ┌───────────┼───────────┐
             │           │           │
          Persona        IA       Psicólogo
          (Nivel 3)   (Nivel 4)   (Nivel 1)
```

---

## 2. Contratos e Interfaces TypeScript (`contracts.ts`)

```typescript
export type AuthorityLevel = 1 | 2 | 3 | 4;

export type MemoryState = 
  | 'candidate'   // Propuesta extraída pendiente de validación/activación
  | 'active'      // Memoria activa y vigente en el contexto actual
  | 'superseded'  // Reemplazada por evolución clínica temporal (A -> B)
  | 'disputed'    // En conflicto con otra evidencia; requiere arbitraje
  | 'archived';   // Archivada históricamente

export type MemoryType = 
  | 'episodic'      // Hechos concretos con anclaje espaciotemporal
  | 'semantic'      // Creencias nucleares, esquemas cognitivos
  | 'procedural'    // Protocolos terapéuticos y afrontamientos aprendidos
  | 'relational'    // Vínculos afectivos y redes de apoyo
  | 'risk_rule';    // Reglas de seguridad y límites operativos

export interface BiTemporalRange {
  validFrom: string;    // ISO 8601 (Cuándo ocurrió en la vida real)
  validTo?: string;     // ISO 8601 (Cuándo dejó de ser vigente)
  recordedAt: string;   // Transaction Time (Cuándo se guardó en sistema)
  supersededAt?: string;// Transaction Time (Cuándo fue reemplazado)
}

export interface Episode {
  id: string;
  patientId: string;
  sessionId?: string;
  occurredAt: string;
  recordedAt: string;
  category: 'vital_event' | 'symptom_spike' | 'crisis_trigger' | 'behavioral_pattern' | 'medication_change';
  narrative: string;
  verbatimQuotes: string[]; // Cita textual obligatoria
  emotionalValence: number; // -1.0 a +1.0
  emotionalIntensity: number; // 1 a 10
  cognitiveDistortions: string[];
  somaticSymptoms: string[];
  copingMechanismsUsed: string[];
  authorityLevel: AuthorityLevel;
  state: MemoryState;
}

export interface Memory {
  id: string;
  patientId: string;
  type: MemoryType;
  state: MemoryState;
  topic: string;
  content: string;
  verbatimQuotes: string[];
  authorityLevel: AuthorityLevel;
  confidence: number; // 0.00 a 1.00
  importance: number; // 1 a 10
  validTime: { validFrom: string; validTo?: string; };
  transactionTime: { createdAt: string; supersededAt?: string; lastAccessedAt: string; };
  version: number;
  previousVersionId?: string;
  supersededById?: string;
  evolutionData?: {
    previousMemoryId: string;
    evolutionReason: 'possible_change_over_time' | 'therapeutic_breakthrough' | 'symptom_progression';
    transitionDate: string;
    clinicalNote?: string;
  };
  conflictId?: string;
  tags: string[];
}

export interface SemanticProfile {
  id: string;
  patientId: string;
  traits: Record<string, { score: number; evidenceQuotes: string[]; lastUpdated: string; }>;
  coreBeliefs: Array<{ id: string; belief: string; schemaType: string; strength: number; state: MemoryState; }>;
  triggers: Array<{ id: string; stimulus: string; typicalReaction: string; severity: number; recommendedProtocol: string; }>;
  protectiveFactors: string[];
  riskTrajectory: { currentRisk: 'low' | 'moderate' | 'high' | 'critical'; crisesInLast30Days: number; };
  lastConsolidatedAt: string;
  version: number;
}

export interface WorkingMemoryBuffer {
  patientId: string;
  sessionId: string;
  unconsolidatedEpisodes: Episode[];
  candidateMemories: Memory[];
  activeAffectiveState: { predominantEmotion: string; intensity: number; lastUpdated: string; };
  estimatedTokens: number;
  maxTokenBudget: number;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  patientId: string;
  actor: { id: string; role: 'patient' | 'psychologist' | 'supervisor' | 'system_engine' | 'ai_assistant'; };
  action: 'MEMORY_CAPTURED' | 'MEMORY_RETRIEVED' | 'MEMORY_CONSOLIDATED' | 'MEMORY_MUTATED' | 'STATE_TRANSITION' | 'CONFLICT_DETECTED';
  targetResourceId: string;
  targetResourceType: 'Memory' | 'Episode' | 'Session' | 'SemanticProfile' | 'ClinicalDirective';
  payload: Record<string, unknown>;
  signature: string; // SHA-256
}
```

---

## 3. Máquina de Estados de Memoria

```text
         ┌─────────────┐
         │  candidate  │
         └──────┬──────┘
                │ Validación / Auto-promoción
                ▼
         ┌─────────────┐  Evolución temporal  ┌──────────────┐
         │   active    │─────────────────────►│  superseded  │
         └──────┬──────┘ (possible_change)    └──────┬───────┘
                │                                    │
                │ Conflicto no resuelto              │ Archivo
                ▼                                    ▼
         ┌─────────────┐                      ┌──────────────┐
         │  disputed   │─────────────────────►│   archived   │
         └─────────────┘ Descarte / Arbitraje └──────────────┘
```

Reglas estrictas de transición:
1. Una memoria validada por psicólogo (Nivel 1) solo puede ser archivada por un profesional (`psychologist` o `supervisor`).
2. Una inferencia de IA (Nivel 4) no puede auto-activarse a `active` sin pasar por el proceso de consolidación o validación clínica.
3. Toda transición de estado requiere un motivo clínico registrado en auditoría.

---

## 4. Manejo de Contradicciones y Evolución Temporal (`TemporalConflictEngine`)

Cuando el paciente afirma algo que parece contradecir una memoria previa:
- **Ejemplo en Enero:** Memoria A: *"Sufro pánico incontrolable ante pérdidas en el mercado"*.
- **Ejemplo en Agosto:** Memoria B: *"Afronté la pérdida de 200€ con serenidad usando el Protocolo de Congelación"*.
- **Resolución:**
  1. El sistema detecta que la Memoria B es cronológicamente posterior ($T_{valid\_from}(B) > T_{valid\_from}(A)$).
  2. En lugar de borrar A, se genera un enlace `possible_change_over_time`.
  3. Se actualiza la Memoria A marcando $T_{valid\_to} = T_{valid\_from}(B)$ y `state = 'superseded'`.
  4. La Memoria B se activa como vigente con `evolutionData.previousMemoryId = A.id`.
  5. Esto permite a Áncora entender y celebrar la **evolución y progreso terapéutico** del paciente en lugar de tener amnesia histórica.

---

## 5. Los 5 Métodos Core de `MemoryEngine`

1. **`capture(sessionData)`:** Extrae episodios con citas textuales (*verbatim*), genera memorias candidatas y actualiza el *WorkingMemoryBuffer*.
2. **`retrieve(patientId, queryContext)`:** Calcula el score ponderado ($S_{rel} + S_{rec} + S_{auth} + S_{clin}$) para inyectar el contexto de mayor relevancia clínica sin saturar tokens.
3. **`consolidate(patientId, options)`:** Evalúa candidatos contra memorias activas, resuelve evoluciones temporales, actualiza el `SemanticProfile` y vacía el buffer volátil.
4. **`update(patientId, memoryId, updates, actor)`:** Ejecuta mutaciones controladas mediante *Copy-on-Write* inmutable incrementando la versión del documento.
5. **`audit(event)`:** Registra cada operación con hash criptográfico SHA-256 para estricto cumplimiento RGPD y trazabilidad médica.
