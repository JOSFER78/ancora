# ⚓ ÁNCORA COGNITIVE MEMORY ENGINE — INFORME MAESTRO DE ARQUITECTURA
**Sistema de Memoria Clínica y Asistencial Asistida por IA con Supervisión Profesional Obligatoria**  
*Proyecto: Áncora / EN-78 | Entorno: React 19 + Vite + Google Cloud Firestore + Servidores Locales NVIDIA DGX Spark*  
*Fecha: Agosto 2026 | Estado: Especificación Técnica de Producción Definitiva*

---

## 🎯 Resumen Ejecutivo

El **Áncora Cognitive Memory Engine** resuelve el principal peligro de la inteligencia artificial aplicada a la salud mental: **el efecto eco y la complacencia artificial de los chatbots comerciales**, garantizando al mismo tiempo que la aplicación web sea **extremadamente resistente a fallos e inmune a roturas durante futuras modificaciones de código**.

Para lograrlo, la arquitectura se fundamenta en cinco pilares inquebrantables:
1. **Desacoplamiento Absoluto (Arquitectura Hexagonal):** La interfaz de usuario desconoce cómo se almacena o procesa la memoria; consume contratos limpios a través de un *Storage Abstraction Layer (SAL)*.
2. **Procesamiento Dual (Fast Path vs. Deep Path):** El chat interactivo responde en tiempo real ($<2\text{s}$) mediante *streaming* y circuitos de tolerancia a fallos. La consolidación semántica, extracción de episodios y análisis de riesgos se ejecutan de forma asíncrona fuera de banda. **Si la base de datos o el motor de memoria fallan, el chat sigue funcionando.**
3. **Jerarquía de Autoridad Clínica Estricta (Niveles 1 a 4):** Diferenciación epistemológica total entre lo *Validado por el Psicólogo* (N1), lo *Documentado en Informes* (N2), lo *Declarado por el Paciente* (N3) y las *Inferencias de IA* (N4). Las inferencias nunca se convierten automáticamente en diagnósticos oficiales.
4. **Scoring de Relevancia No Destructivo con Suelo Asintótico ($\alpha=0.25$):** Refutación del decaimiento destructivo de Ebbinghaus. **Los recuerdos clínicos nunca se borran ni degradan.** Lo que modula es su *retrieval score* en función de la relevancia temática, importancia intrínseca, resonancia emocional y nivel de autoridad.
5. **Modelado Bi-Temporal y Evolución de Contradicciones (`possible_change_over_time`):** Si un paciente supera un síntoma, el hecho anterior no se elimina: se archiva con fecha de fin de vigencia y se enlaza al nuevo estado, permitiendo entender la **evolución y progreso terapéutico** en el tiempo.

```text
                                     ÁNCORA COGNITIVE PLATFORM
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   │                                                           │
             PORTAL PACIENTE                                           PORTAL PSICÓLOGO
        (Diario, Chat, Moods)                                     (Smart SOAP, Directivas, Video)
                   │                                                           │
                   └─────────────────────────────┬─────────────────────────────┘
                                                 │
                                     APPLICATION DOMAIN & SAL
                                 (Contracts, Hooks, UseCases)
                                                 │
                   ┌─────────────────────────────┴─────────────────────────────┐
                   │                                                           │
          FAST PATH ENGINE (SLA < 2s)                                DEEP PATH MEMORY ENGINE
       (Working Memory, Token Budget,                             (Capture, Consolidate, Evolve,
        Zero-Hallucination Context)                                Multi-Tier Authority, Audit)
                   │                                                           │
                   └─────────────────────────────┬─────────────────────────────┘
                                                 │
                                     GOOGLE CLOUD FIRESTORE
                                 (Production Security Rules)
                                                 │
        ┌────────────────────────┬───────────────┴───────────────┬────────────────────────┐
        │                        │                               │                        │
  PATIENT DATA            CLINICAL DATA                    DIRECTIVES                 AUDIT TRAIL
(profile, sessions,     (episodes, memories,          (P0-P3 hard rules,          (SHA-256 inmutable,
 mood, debts, roadmap)   semanticProfile, RAG)          freeze, limits)              RGPD / HIPAA)
```

---

## 📑 Índice de Secciones
1. [Auditoría del Repositorio Actual (`ancora_repo`) y Puntos de Fricción](#1-auditoría-del-repositorio-actual-ancora_repo-y-puntos-de-fricción)
2. [Arquitectura de Persistencia Firestore & Reglas de Seguridad](#2-arquitectura-de-persistencia-firestore--reglas-de-seguridad)
3. [Contratos de Dominio TypeScript y los 5 Métodos Core](#3-contratos-de-dominio-typescript-y-los-5-métodos-core)
4. [Jerarquía de Autoridad Clínica y Protocolos Multi-Actor](#4-jerarquía-de-autoridad-clínica-y-protocolos-multi-actor)
5. [Working Memory Dinámica, Token Budgeting y Context Assembly](#5-working-memory-dinámica-token-budgeting-y-context-assembly)
6. [Tolerancia Absoluta a Fallos (Dual Processing)](#6-tolerancia-absoluta-a-fallos-dual-processing)
7. [Architecture Contract, Feature Flags y Plan de Fases (0 a 13)](#7-architecture-contract-feature-flags-y-plan-de-fases-0-a-13)

---

## 1. Auditoría del Repositorio Actual (`ancora_repo`) y Puntos de Fricción

El análisis exhaustivo del código fuente actual revela que el sistema cuenta con módulos clínicos y de contención muy potentes pero estructurados como un **"Smart View Monolith"**:
- **Acoplamiento Directo UI-DB:** Vistas como `PacienteChatView.jsx` (1.935 líneas), `PsicologoDashboardView.jsx` (4.360 líneas) y `MenteView.jsx` (4.188 líneas) ejecutan consultas directas a tablas de Firebase (`profiles`, `conversations`, `messages`, `daily_moods`, `agent_tasks`) en lugar de usar servicios aislados.
- **Condiciones de Carrera en JSONB:** `profiles.contexto_terapeutico` se sobreescribe como un blob JSON completo, con riesgo de que una actualización de chat destruya notas añadidas concurrentemente por el psicólogo.
- **Fallbacks Silenciosos a `localStorage`:** En `clinicalEngine.js`, cuando una tabla de base de datos no está disponible o falla por RLS, se recurre a mocks locales en `localStorage`, provocando que la UI aparente funcionar pero perdiendo datos al recargar.

### La Solución: Arquitectura Hexagonal Limpia
Se desacopla la aplicación en 4 capas estrictas:
```text
UI (React 19 Components) ──► Custom Hooks ──► Application Services ──► Storage Abstraction Layer (SAL) ──► Firestore / Firebase
```

---

## 2. Arquitectura de Persistencia Firestore & Reglas de Seguridad

### Jerarquía de Colecciones
```text
firestore
├── patients/{patientId}
│   ├── profile/current              -> Datos personales, diagnóstico CIE-11, fármacos, evaluación de riesgo
│   ├── sessions/{sessionId}         -> Sesiones de chat y terapia con métricas antes/después
│   │   └── messages/{messageId}     -> Turnos de diálogo individuales inmutables
│   ├── episodes/{episodeId}         -> Eventos vitales, crisis y patrones con citas verbatim
│   ├── memories/{memoryId}          -> Hechos estructurados con niveles de autoridad (1 a 4)
│   ├── goals/{goalId}               -> Metas conductuales, terapéuticas y de viabilidad
│   ├── semanticProfile/current      -> Snapshot consolidado del perfil cognitivo del paciente
│   ├── semantic_memories/{memoryId} -> Memorias vectorizadas para búsqueda semántica RAG
│   ├── directives/{directiveId}     -> Directivas clínicas del terapeuta para Walter IA
│   └── summaries/{summaryId}        -> Borradores y revisiones de Notas SOAP bisemanales
├── clinicalKnowledge/{id}           -> Base global de protocolos psicoterapéuticos (TCC, DBT, ACT)
├── protocols/{id}                   -> Protocolos clínicos estandarizados (Freeze, Desescalada)
└── auditLogs/{logId}                -> Registro de auditoría 100% inmutable con hash SHA-256
```

### Reglas de Seguridad Clave (`firestore.rules`)
- **Aislamiento del Paciente:** El paciente únicamente puede leer y crear mensajes dentro de su propia sesión activa (`request.resource.data.sender == 'patient'`).
- **Inmutabilidad del Historial:** Los mensajes y registros de auditoría tienen prohibida cualquier actualización o borrado (`allow update, delete: if false;`).
- **Blindaje Clínico:** El paciente tiene **estrictamente bloqueada la escritura** en `semanticProfile/current`, `directives/*`, `summaries/*` y en las propiedades de diagnóstico y riesgo médico de `profile/current`.
- **Acceso Exclusivo de Psicólogo Asignado:** Solo el psicólogo vinculado en `assignedPsychologistId` o supervisores con Custom Claims verificados pueden validar propuestas, emitir directivas o firmar Notas SOAP.

---

## 3. Contratos de Dominio TypeScript y los 5 Métodos Core

### Entidades y Máquina de Estados
Toda memoria clínica transita por una máquina de estados determinista:
- `candidate`: Extraída tras una sesión, pendiente de consolidación.
- `active`: Vigente y accesible para el Context Builder.
- `superseded`: Superada en el tiempo por progreso del paciente o corrección.
- `disputed`: En conflicto no resuelto, enviada a la bandeja del terapeuta.
- `archived`: Retirada formalmente.

### Los 5 Métodos Core de `MemoryEngine`
```typescript
export interface IMemoryEngine {
  /** 1. CAPTURE: Extrae episodios clínicos y citas verbatim a partir de transcripciones */
  capture(input: SessionCaptureInput): Promise<CaptureResult>;

  /** 2. RETRIEVE: Recupera y pondera el contexto óptimo para el LLM */
  retrieve(patientId: string, context: MemoryQueryContext): Promise<RetrievalResult>;

  /** 3. CONSOLIDATE: Sintetiza memorias candidatas, resuelve contradicciones y actualiza el perfil semántico */
  consolidate(patientId: string, options: ConsolidationOptions): Promise<ConsolidationResult>;

  /** 4. UPDATE: Modifica memorias de forma inmutable (Copy-on-Write) versionando el registro */
  update(patientId: string, memoryId: string, updates: MemoryUpdateInput, actor: AuditActor): Promise<Memory>;

  /** 5. AUDIT: Registra cada acción con firma criptográfica SHA-256 para compliance RGPD */
  audit(event: AuditEventInput): Promise<AuditEvent>;
}
```

---

## 4. Jerarquía de Autoridad Clínica y Protocolos Multi-Actor

Áncora clasifica cada dato clínico en 4 niveles inmutables:
- **Nivel 1 — Validado por Psicólogo:** Autoridad absoluta. Modifica el perfil oficial y sobreescribe cualquier inferencia de IA.
- **Nivel 2 — Documentado en Informes:** Respaldado por PDFs o peritajes médicos externos con hash de verificación.
- **Nivel 3 — Declarado por el Paciente:** Vivencia subjetiva y reporte emocional (1-10). La IA nunca lo confirma como diagnóstico probado.
- **Nivel 4 — Inferencia IA (Walter):** Hipótesis preliminar en estricta cuarentena clínica. Requiere validación profesional para integrarse.

### Canales de Interacción y Smart SOAP Teleprompter
1. **Paciente <-> IA:** Contención emocional diaria basada en TCC/ACT. Cero emisión diagnóstica autónoma.
2. **IA -> Psicólogo:** Autogeneración de borradores de **Notas SOAP** y alertas de riesgo con citas textuales (*verbatim*), reduciendo un 40% la carga burocrática.
3. **Psicólogo -> IA:** Inyección de **`ClinicalDirective`** estructuradas (ámbito, prioridad, vigencia) que modulan el comportamiento de Walter IA sin saturar el prompt.
4. **Psicólogo -> Paciente:** Grabación asíncrona de **Video-Briefings de 5 a 10 minutos** con **Teleprompter Inteligente** que proyecta las métricas y citas clave de la semana para mantener contacto visual continuo.

---

## 5. Working Memory Dinámica, Token Budgeting y Context Assembly

### Desmantelamiento de la Ventana Fija $W=10$
Se sustituye la regla fija de 10 mensajes por un **Presupuesto Elástico de Tokens** ($T_{max}$):
$$\text{Presupuesto Disponible} = T_{max} - \left( B_{out} + B_{margin} + B_{sys} + B_{dir} + B_{state} \right)$$
El espacio restante se reparte elásticamente entre la **Memoria Episódica Relevante** ($B_{episodic}$) y la **Working Memory de Diálogo** ($B_{wm}$).

### Fórmula de Scoring de Relevancia Clínica No Destructiva
$$S_{retrieval}(m, q, E_{state}) = 0.30 \cdot \text{Sim}(q, m) + 0.20 \cdot I(m) + 0.20 \cdot CR(m, E_{state}) + 0.10 \cdot \text{Rec}(m) + 0.10 \cdot \text{Reinf}(m) + 0.10 \cdot \text{Conf}(m)$$

Donde la recencia no-destructiva utiliza un **Suelo Asintótico $\alpha = 0.25$**:
$$\text{Rec}(m, \Delta t) = 0.25 + 0.75 \cdot \frac{1}{1 + \ln\left(1 + \frac{\Delta t}{30}\right)}$$
Garantizando que los antecedentes críticos y traumas pasados **nunca desaparezcan de la memoria**.

---

## 6. Tolerancia Absoluta a Fallos (Dual Processing)

Para garantizar un SLA $< 2\text{s}$ en momentos de crisis del paciente:
- **Fast Path (Tiempo Real):** El chat interactivo consulta la caché en memoria y ejecuta la llamada LLM vía *streaming SSE*. Dispone de un **Circuit Breaker con timeout de 350ms**: si la base de datos tarda en responder, conmuta instantáneamente al perfil de emergencia local y continúa la conversación.
- **Deep Path (Asíncrono en Background):** La extracción de hechos, indexación vectorial, detección de eventos de riesgo y consolidación semántica se encolan y procesan en segundo plano sin ralentizar ni bloquear la interfaz de usuario.

---

## 7. Architecture Contract, Feature Flags y Plan de Fases (0 a 13)

### Matriz de Feature Flags
- `MEMORY_ENGINE_ENABLED`: Activa memoria jerárquica compacta.
- `SEMANTIC_CONSOLIDATION_ENABLED`: Activa deduplicación y síntesis en background.
- `CLINICAL_DIRECTIVES_ENABLED`: Aplica límites y protocolos de congelación somática en tiempo real.
- `FIREBASE_PERSISTENCE_ENABLED`: Controla el backend (`'off'` | `'shadow'` | `'active'` | `'exclusive'`).
- `VECTOR_RETRIEVAL_ENABLED`: Habilita búsqueda semántica densa híbrida.

### Hoja de Ruta de Ejecución en 14 Fases
```text
FASE 0: Auditoría, snapshot de datos legacy y congelación de dependencias.
FASE 1: Implementación del resolvedor jerárquico de Feature Flags.
FASE 2: Capa de Abstracción de Persistencia (SAL) con contratos desacoplados.
FASE 3: Despliegue de colecciones Firestore, subcolecciones e índices $O(1)$.
FASE 4: Parser universal para extraer texto de los 7 documentos .docx de datos/.
FASE 5: Pipeline ETL automatizado para migrar datos de Firebase a Firestore.
FASE 6: Conciliación matemática de integridad (0.00% de discrepancia en checksums).
FASE 7: Activación del Motor Clínico con 4 niveles de autoridad y citas verbatim.
FASE 8: Motor de Memoria Jerárquica Hermes (Life Tree y Context Snapshots <1.200 tokens).
FASE 9: Directivas Clínicas dinámicas, Protocolo de Congelación y alertas de riesgo.
FASE 10: Integración de búsqueda vectorial híbrida (Semántica + Cronológica).
FASE 11: Adaptación de vistas UI (PacienteChatView, PsicologoDashboardView, MenteView).
FASE 12: Despliegue Shadow Canary y conmutación gradual de tráfico (10% -> 100%).
FASE 13: Pruebas de estrés de 100 usuarios concurrentes, simulacro de recuperación y congelación v3.0.
```

---
*Áncora Cognitive Memory Engine — Documentación Oficial y Arquitectura de Referencia*
