# ⚓ Plan de Implementación Maestro: Memoria Cognitiva Viva de Áncora

**Estado:** Documento de Planificación e Investigación Pura (Sin Modificación de Código).  
**Alcance:** Exclusivamente el Núcleo de Memoria Cognitiva (Cognitive Memory Engine).  
**Principio:** Aislamiento total de otros subsistemas (sin mezclar landings, facturación ni Firebase/Firebase de forma desordenada).

---

## 1. Diagnóstico de la Situación Actual del Repositorio

Tras la auditoría del código actual en `ancora_repo`:

1. **Acoplamiento Directo UI-DB:** Las vistas de React (`PacienteChatView.jsx`, `MenteView.jsx`) realizan peticiones directas y dispersas a tablas de base de datos (`contexto_terapeutico`, `chat_sessions`).
2. **Fallbacks Silenciosos a LocalStorage:** En `clinicalEngine.js` existen capturas de error que devuelven arrays simulados/inventados en `localStorage`, ocultando el estado real del sistema.
3. **Memoria Plana sin Estructura:** No existe distinción formal entre hechos objetivos, expresiones fenoménicas subjetivas y directivas clínicas del psicólogo.
4. **Falta de Capa de Abstracción:** El sistema no puede cambiar de persistencia ni testearse de forma aislada sin levantar la aplicación completa.

---

## 2. Arquitectura Objetivo del Motor de Memoria (100% Desacoplado)

El Cognitive Memory Engine se diseñará como un **paquete de software autónomo y modular**:

```
┌─────────────────────────────────────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                     │
│  (Solo consume hooks limpios, sin importar bases de datos)  │
│  • usePatientChat()             • useClinicalMemory()       │
│  • useLifeTree()                • usePatient360()           │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             NÚCLEO DE MEMORIA VIVA (MOTOR PURO)             │
│  • CognitiveMemoryEngine.js  (capture, retrieve, consolidate)│
│  • RelevanceScorer.js        (Scoring no destructivo α=0.25)│
│  • ContextBuilder.js         (Ensamblado Cero Alucinaciones)│
│  • TokenBudgetManager.js     (Presupuesto dinámico tokens)  │
│  • MemoryStateMachine.js     (Evolución temporal bi-temporal)│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          CAPA DE ABSTRACCIÓN DE PERSISTENCIA (SAL)          │
│  • IMemoryRepository (Contrato universal)                   │
│  • FirestoreMemoryAdapter (Multitenant subcolecciones)      │
│  • FirebaseMemoryAdapter (Puente PostgreSQL)                │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Especificación de los 5 Métodos Core

| Método | Operación | SLA / Modo | Descripción Técnica |
| :--- | :--- | :--- | :--- |
| **`capture()`** | Extracción episódica | Asíncrono (Deep Path) | Extrae hechos y síntomas a partir del diálogo, guardando la cita literal (*verbatim*) y asignando Nivel de Autoridad N1 a N4. |
| **`retrieve()`** | Recuperación ponderada | Síncrono ($\le 100\text{ms}$) | Calcula el Retrieval Score multifactorial con suelo $\alpha=0.25$ y ensambla el prompt de tokens exactos para el Fast Path. |
| **`consolidate()`** | Síntesis semántica | Programado / Batch | Concilia candidatos, resuelve contradicciones mediante `possible_change_over_time` y actualiza el resumen del paciente. |
| **`update()`** | Mutación controlada | *Copy-on-Write* | Modifica un nodo del Árbol Vital o directiva manteniendo el histórico inmutable con incremento de versión. |
| **`audit()`** | Trazabilidad forense | Inmutable | Emite log con timestamp y actor para estricto cumplimiento RGPD / HIPAA. |

---

## 4. Fases del Plan de Implementación (Cuando se dé Luz Verde)

```
[FASE 1: Contratos & Máquina de Estados]
   └─ Crear enums de autoridad (N1 a N4), tipos de memoria y máquina bi-temporal.
   
[FASE 2: Capa SAL de Persistencia]
   └─ Definir IMemoryRepository y crear adaptadores aislados sin fallbacks ficticios.
   
[FASE 3: Algoritmos de Scoring & Context Builder]
   └─ Implementar fórmula con suelo asintótico α=0.25 y Token Budgeting elástico.
   
[FASE 4: Motor Unificado CognitiveMemoryEngine]
   └─ Ensamblar los 5 métodos core y verificar con test suite 100% real.
   
[FASE 5: Custom Hooks de React]
   └─ Crear useClinicalMemory, usePatientChat y useLifeTree para consumo de UI.
   
[FASE 6: Validación con el Dataset de Pruebas Real (Emilio)]
   └─ Ejecutar pruebas de ingesta y recuperación con los casos clínicos reales de docs/04_dataset_pruebas_emilio/.
```

---

## 5. Criterios de Aceptación y Calidad (Quality Gates)

1. **Cero Mocks:** Ninguna función ni adaptador podrá recurrir a datos estáticos ficticios o `localStorage` simulado.
2. **Latencia Fast Path:** El método `retrieve()` debe responder en $< 100\,\text{ms}$ para asegurar un tiempo total de respuesta de chat $< 2.0\,\text{s}$.
3. **No Destrucción de Datos:** Recuerdos con más de 1.000 días deben mantener siempre una recencia base $R \ge 0.25$.
4. **Preservación de Trayectoria:** Toda contradicción con intervalo $> 14$ días debe marcar el estado anterior como `SUPERSEDED` con `possible_change_over_time: true`.
5. **Desacoplamiento Estricto:** La UI React no importará directamente clientes de base de datos; todo se consumirá a través de los Custom Hooks del motor.
