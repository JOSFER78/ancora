# Áncora Cognitive Memory Engine — 07. Árbol Vital (Life Tree) y Patient 360

## 1. El Concepto de Árbol Vital (*Life Tree*)

El **Árbol Vital** es la estructura troncal donde Áncora organiza la biografía, el mapa relacional y los anclajes emocionales del paciente. A diferencia de una lista cronológica plana o un chatbot sin memoria episódica estructurada, el Árbol Vital modela la vida del paciente como un grafo jerárquico de nodos con peso clínico y resonancia afectiva.

```
                         [ PACIENTE: RAÍZ ]
                                 │
      ┌──────────────┬───────────┴───────────┬──────────────┐
      ▼              ▼                       ▼              ▼
[ INFANCIA &     [ FAMILIA &            [ TRABAJO &     [ SALUD &
 DESARROLLO ]     RELACIONES ]           ECONOMÍA ]      TRAUMAS ]
      │              │                       │              │
      ├─ Vínculo     ├─ Pareja actual        ├─ Crisis 2022 ├─ Ataques Pánico
      └─ Colegio     └─ Conflictos paternos  └─ Deudas      └─ Insomnio 23h
```

---

## 2. Esquema de Firestore: `/patients/{patientId}/lifeTree/{nodeId}`

Cada nodo del Árbol Vital reside en una subcolección indexada:

```typescript
export interface LifeTreeNode {
  id: string;                         // UUID v4
  patientId: string;                  // ID del paciente
  category: 'INFANCY' | 'FAMILY' | 'RELATIONSHIPS' | 'CAREER_FINANCE' | 'HEALTH_SOMATIC' | 'TRAUMA_CRISIS' | 'PROTECTIVE_ANCHORS';
  title: string;                      // Ej: "Quiebra financiera 2022"
  description: string;                // Resumen narrativo verificado
  temporalSpan: {
    startYear?: number;
    startMonth?: number;
    endYear?: number;
    isOngoing: boolean;
  };
  authorityLevel: 1 | 2 | 3 | 4;      // Jerarquía epistemológica
  emotionalValence: number;           // -1.0 (Muy traumático) a +1.0 (Muy protector)
  salienceWeight: number;             // 0.0 a 1.0 (Peso en el contexto)
  linkedEpisodes: string[];           // IDs de /episodes asociados
  verbatimQuotes: string[];           // Citas textuales que respaldan el nodo
  psychologistNotes?: string;         // Anotaciones clínicas privadas
  status: 'ACTIVE' | 'SUPERSEDED' | 'DISPUTED';
  createdAt: string;
  updatedAt: string;
}
```

---

## 3. Patient 360 Dashboard: La Vista del Psicólogo

El panel **Patient 360** condensa en una sola pantalla interactiva todo lo que el psicólogo necesita para preparar la sesión en menos de 3 minutos:

```
┌────────────────────────────────────────────────────────────────────────┐
│  PATIENT 360: Emilio R. (41 años)           [🔴 Riesgo Basal: Moderado]│
├────────────────────────────────┬───────────────────────────────────────┤
│  ÁRBOL VITAL (Life Tree)       │  LÍNEA TEMPORAL RECIENTE (Últimos 14d)│
│  • Infancia: Exigencia paterna │  • 12 Ago: Pánico al abrir correo     │
│  • Economía: Deuda 45k€ (Act)  │  • 10 Ago: Discusión familiar         │
│  • Anclaje: Natación matinal   │  • 08 Ago: Crisis de insomnio 02:30h  │
├────────────────────────────────┴───────────────────────────────────────┤
│  SMART SOAP DRAFT (Autogenerado para validación profesional)           │
│  [S] "Siento que me falta el aire cuando veo las notificaciones."     │
│  [O] 4 registros de taquicardia nocturna. Adherencia a tareas: 65%.    │
│  [A] Ansiedad anticipatoria ligada a estresor económico activo.        │
│  [P] Pautar desconexión de pantallas a las 20h y anclaje somático.     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Reglas de Inyección en el Context Builder

Cuando el paciente inicia una conversación en el Fast Path, el Árbol Vital no se inyecta completo (para evitar saturar tokens). El Context Builder selecciona únicamente los nodos del Life Tree cuya **similitud semántica** y **peso de relevancia** superen el umbral:

$$\text{LifeTreeSelect}(q) = \{ n \in \text{LifeTree} \mid \text{CosineSim}(q, \vec{n}) \ge 0.72 \land n.\text{status} = \text{'ACTIVE'} \}$$

De este modo, si el paciente habla de dinero o trabajo, se inyecta el nodo de *Economía/Deudas* y sus anclajes protectores asociados, manteniendo el consumo en menos de 400 tokens.
