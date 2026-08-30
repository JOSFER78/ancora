# 06. Estrategia de Migración, Feature Flags y Plan de Fases (0-13)

**Sistema:** Áncora / EN-78 — Architecture Governance & Safe Rollout  
**Misión:** Garantizar evolución del sistema con **CERO roturas de UI, CERO pérdida de datos clínicos y 100% de reversibilidad**.

---

## 1. Architecture Contract (Leyes Inviolables Anti-Rotura)

1. **Aislamiento de Ámbito y Error Boundaries:**
   - Cada widget y vista (`ViabilityWidget`, `PacienteHistoriaView`, `MenteView`, `PanicSimulatorWidget`, `PsicologoDashboardView`) debe contar con un `ErrorBoundary` de captura de excepciones.
   - El fallo en una subcolección o función asíncrona nunca debe provocar pantalla en blanco ni bloquear la barra de navegación lateral.
2. **Contrato de Inmutabilidad de Tokens CSS:**
   - Prohibido importar librerías que inyecten estilos globales destructivos (resets agresivos de Tailwind) o sobreescribir las variables raíz (`--bg-primary: #07090e`, `--accent-cyan: #06b6d4`, `--accent-emerald: #10b981`, `--glass-bg: rgba(15, 23, 42, 0.75)`).
3. **Acceso Seguro a Propiedades (Null Safety):**
   - Prohibido el encadenamiento directo no protegido sobre JSONB o documentos asíncronos (`profile.contexto_terapeutico.historial_clinico.resumen_vital` ❌). Obligatorio el encadenamiento opcional con fallback (`profile?.contexto_terapeutico?.historial_clinico?.resumen_vital ?? ''` ✅).
4. **Esquema Estrictamente Aditivo (Sin Cambios Destructivos):**
   - En base de datos, prohibido borrar o renombrar colecciones/columnas activas. Se mantiene compatibilidad retroactiva durante al menos 2 versiones.

---

## 2. Matriz de Feature Flags

```typescript
export interface SystemFeatureFlags {
  MEMORY_ENGINE_ENABLED: boolean;         // Activa memoria jerárquica compacta (Life Tree + Timeline)
  SEMANTIC_CONSOLIDATION_ENABLED: boolean;// Activa consolidación semántica y deduplicación en background
  CLINICAL_DIRECTIVES_ENABLED: boolean;   // Aplica directivas éticas y de contención en tiempo real
  FIREBASE_PERSISTENCE_ENABLED: 'off' | 'shadow' | 'active' | 'exclusive'; // Backend activo
  VECTOR_RETRIEVAL_ENABLED: boolean;      // Habilita búsqueda vectorial densa híbrida
}
```

Valores por defecto en rollout:
```json
{
  "MEMORY_ENGINE_ENABLED": true,
  "SEMANTIC_CONSOLIDATION_ENABLED": true,
  "CLINICAL_DIRECTIVES_ENABLED": true,
  "FIREBASE_PERSISTENCE_ENABLED": "shadow",
  "VECTOR_RETRIEVAL_ENABLED": false
}
```

---

## 3. Pipeline ETL de Migración de Datos Legacy en 7 Pasos

```text
1. EXTRACCIÓN .DOCX & POSTGRESQL -> Lectura segura binaria con fflate/unzipSync de datos/ (*.docx) + volcado JSON.
2. NORMALIZACIÓN DE IDENTIDADES   -> Mapeo de UUIDs relacionales a IDs jerárquicos en Firestore.
3. HASH SHA-256 POR DOCUMENTO    -> Generación de source_hash para garantizar idempotencia y evitar duplicados.
4. CARGA POR LOTES (BATCHES)     -> Inserción atómica en Firestore en bloques de <= 500 operaciones por commit.
5. CONCILIACIÓN DE CHECKSUMS     -> Script de auditoría comparando sumas financieras de deudas y conteo de moods.
6. FASE SHADOW (DUAL-WRITE)      -> Escritura simultánea en PostgreSQL y Firestore con lectura desde Postgres.
7. CONMUTACIÓN DEFINITIVA        -> Activación FIREBASE_PERSISTENCE_ENABLED = 'active' con fallback reversible.
```

---

## 4. Plan de Implementación por Fases (Fase 0 a 13)

```text
FASE 0: AUDITORÍA & CONGELACIÓN (Snapshot de datos, hash de .docx, freeze de dependencias).
   ↓
FASE 1: FEATURE FLAGS FRAMEWORK (Resolvedor jerárquico Local -> User -> Global).
   ↓
FASE 2: STORAGE ABSTRACTION LAYER (SAL: Interfaces desacopladas IPatientRepo, IChatRepo, IClinicalMemoryRepo).
   ↓
FASE 3: FIRESTORE & REGLAS DE SEGURIDAD (Despliegue de colecciones y firestore.rules validadas).
   ↓
FASE 4: PARSER UNIVERSAL DE DOCUMENTOS (Extracción limpia de XML de los 7 .docx de Emilio en datos/).
   ↓
FASE 5: PIPELINE ETL Firebase -> FIRESTORE (Migración completa de perfiles, deudas, moods, mensajes).
   ↓
FASE 6: CONCILIACIÓN DE INTEGRIDAD (0.00% de discrepancia en checksums y registros).
   ↓
FASE 7: MOTOR CLÍNICO & 4 NIVELES DE AUTORIDAD (Validación estricta de N1 a N4 con citas verbatim).
   ↓
FASE 8: MEMORIA JERÁRQUICA HERMES (Life Tree, Timeline Index y Context Snapshots <1.200 tokens).
   ↓
FASE 9: DIRECTIVAS CLÍNICAS & FREEZE PROTOCOL (Interbloqueo de pánico y contención de riesgo).
   ↓
FASE 10: VECTOR RETRIEVAL HÍBRIDO (Búsqueda semántica densa + cronológica).
   ↓
FASE 11: ADAPTACIÓN DE VISTAS UI (Refactor de PacienteHistoriaView, MenteView, PsicologoDashboardView sin llamadas directas a SDK).
   ↓
FASE 12: SHADOW CANARY & CUTOVER (Rollout gradual 10% -> 50% -> 100% a Firestore).
   ↓
FASE 13: TEST DE RESISTENCIA & GOBERNANZA (Pruebas de carga de 100 usuarios, simulacro de disaster recovery).
```
