# ⚓ 05 · Hoja de Ruta Técnica y Plan de Implementación (Fases 0 a 13)

**Ubicación:** `docs/architecture/05_implementation_plan.md`  
**Estado:** Listo para Ejecución  
**Garantía:** Cero Mocks / Validación Empírica sobre Dataset Emilio (`docs/04_dataset_pruebas_emilio/`)

---

## 1. Matriz de Fases Secuenciales de Implementación

```mermaid
gantt
    title Plan de Implementación de Arquitectura Áncora
    dateFormat  YYYY-MM-DD
    section Fase 0 a 3: Cimientos & Persistencia
    Fase 0: Auditoría y Congelación de Contratos    :done, f0, 2026-08-15, 1d
    Fase 1: Capa de Dominio y Contratos Zod          :active, f1, 2026-08-16, 2d
    Fase 2: Adaptadores Firestore & Firestore Rules  :f2, after f1, 2d
    Fase 3: Working Memory Buffer & Scoring Asintótico:f3, after f2, 2d
    section Fase 4 a 8: Capas 1 a 4
    Fase 4: Context Builder y XML Sandwich           :f4, after f3, 2d
    Fase 5: Ingesta & Protocolo Cero Audio Crudo     :f5, after f4, 2d
    Fase 6: Smart SOAP Drafts & Teleprompter         :f6, after f5, 2d
    Fase 7: Directivas Clínicas HITL (N1 vs N4)      :f7, after f6, 2d
    Fase 8: Árbol Vital (Life Tree) y Patient 360    :f8, after f7, 2d
    section Fase 9 a 13: Despliegue & Validación
    Fase 9: Sincronización Capacitor SQLite Outbox   :f9, after f8, 2d
    Fase 10: Circuit Breaker 024 de Riesgo Autolítico:f10, after f9, 1d
    Fase 11: Ingesta Real del Dataset Emilio         :f11, after f10, 2d
    Fase 12: Desacoplamiento de UI y Hooks React     :f12, after f11, 2d
    Fase 13: Tests de Resistencia y Activación Prod  :f13, after f12, 1d
```

---

## 2. Detalle de Fases de Ejecución

### 🟢 Fase 0: Auditoría y Congelación de Contratos
- Congelar las interfaces TypeScript de `04_contracts.md`.
- Desplegar Feature Flags en `.env` para garantizar conmutación segura:
  ```env
  VITE_COGNITIVE_MEMORY_ENGINE=true
  VITE_FIREBASE_PERSISTENCE=true
  VITE_ZERO_RAW_AUDIO_ENFORCED=true
  VITE_CIRCUIT_BREAKER_024_ENABLED=true
  ```

### 🟢 Fase 1: Capa de Dominio y Tipos
- Implementar los tipos puros de dominio: `MemoryTypes.ts`, `MemoryStateMachine.ts`, `ClinicalDirective.ts`.
- Validar la máquina de estados finita (`candidate` $\to$ `active` $\to$ `superseded` con `possible_change_over_time`).

### 🟢 Fase 2: Adaptadores de Persistencia y Seguridad Firestore
- Implementar `IMemoryRepository.js` y el adaptador `FirestoreMemoryAdapter.js`.
- Desplegar las `firestore.rules` con denegación estricta de escritura a pacientes en directivas y diagnósticos.

### 🟢 Fase 3: Working Memory Buffer y Scoring No Destructivo
- Implementar `RelevanceScorer.js` con la fórmula matemática de suelo asintótico $\alpha=0.25$:
  $$\text{Rec}(m, \Delta t) = 0.25 + 0.75 \cdot \frac{1}{1 + \ln\left(1 + \frac{\Delta t}{30}\right)}$$
- Implementar `TokenBudgetManager.js` con el presupuesto elástico de 4.096 tokens.

### 🟢 Fase 4: Context Builder y Ensamblador de Prompts
- Implementar `ContextBuilder.js` con inyección "XML Sandwich":
  - Preamble de seguridad + Directivas del psicólogo N1 + Estado actual + Metas + Memoria episódica + Working Memory.

### 🟢 Fase 5: Ingesta y Protocolo de Cero Persistencia de Audio
- Ingesta de notas de voz en RAM efímera con cálculo de Hash SHA-256.
- Extracción de features fenomenológicas (WPM, pausas, valencia emocional) y purga binaria con ceros (*Zero-Fill*).

### 🟢 Fase 6: Smart SOAP Drafts y Teleprompter del Psicólogo
- Generación asíncrona de notas SOAP automáticas basadas en citas textuales obligatorias (`verbatimQuotes`).
- Conexión con el visor de Teleprompter para video-briefings asíncronos.

### 🟢 Fase 7: Directivas Clínicas y Flujos HITL
- Interfaz del psicólogo para inyectar directivas clínicas vinculantes (prioridad P0 a P5, ámbito y vigencia).
- Promoción criptográfica de propuestas IA ($N4 \to N1$) con firma y justificación médica.

### 🟢 Fase 8: Árbol Vital (*Life Tree*) y Patient 360
- Representación en grafo del historial vital del paciente por etapas (0-5, 5-10, 10-15, 15-20, 20-30, 30-40, 40-45+).
- Subcolección `patients/{patientId}/lifetree/nodes/` con prominencia y valencia.

### 🟢 Fase 9: Sincronización en Capacitor (SQLite Outbox Pattern)
- Integración de `@capacitor-community/sqlite` y streaming TUS para transferencias resumables en segundo plano.

### 🟢 Fase 10: Circuit Breaker 024 de Riesgo Autolítico
- Interceptor determinista (<25ms). Ante riesgo crítico, bloqueo de la IA y despliegue del modal de emergencia con llamada directa al **024 (Línea de Atención a la Conducta Suicida)** y **112**.

### 🟢 Fase 11: Ingesta del Dataset Real de Emilio (Validación Zero-Mocks)
- Procesar los archivos clínicos de `docs/04_dataset_pruebas_emilio/` para poblar el perfil cognitivo `patients/emilio_001/semanticProfile/current` y los 8 episodios vitales.

### 🟢 Fase 12: Desacoplamiento de la Interfaz React
- Refactorizar `PacienteChatView.jsx` y `PsicologoDashboardView.jsx` usando los hooks `useClinicalMemory`, `useLifeTree` y `usePatientChat`.

### 🟢 Fase 13: Tests de Resistencia y Activación en Producción
- Ejecutar la suite de tests de resistencia (concurrencia, reanudación tras corte de red y auditoría SHA-256).
