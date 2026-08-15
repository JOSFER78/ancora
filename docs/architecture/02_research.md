# ⚓ 02 · Investigación Técnica y Hallazgos Oficiales (Firebase, Capacitor & IA)

**Ubicación:** `docs/architecture/02_research.md`  
**Estado:** Activo / Aprobado  
**Fuentes Oficiales:** Google Cloud Firestore, Firebase Admin Node.js SDK, Capacitor v8 Docs, Cloud Functions v2, Vertex AI Embeddings, RGPD Art. 9.

---

## 1. Firestore Data Bundles: Carga Offline en Capacitor con Cero Lecturas de Red

### 1.1. Arquitectura y Mecánica Interna
Los **Firestore Data Bundles** permiten empaquetar en el servidor (usando el Firebase Admin SDK) los resultados de múltiples consultas y documentos de Firestore en una carga binaria serializada (formato protobuf/JSON optimizado).
- **Ventaja de Coste y Latencia:** El cliente móvil (Capacitor) descarga el bundle vía HTTP simple servido desde Google Cloud Storage o Firebase Hosting con cabeceras `Cache-Control`.
- **Cero Lecturas de Red en Firestore Client:** La función `loadBundle()` inyecta los documentos directamente en la caché local persistente de Firestore (`IndexedDB` en WebView). Al consultar con `namedQuery` y `getDocsFromCache`, se obtienen los documentos con **0 lecturas facturables en Firestore**.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVIDOR / BACKEND                             │
│  [Firestore DB] ──> [Cloud Functions v2 (Admin SDK)]                   │
│                            │                                            │
│                     db.bundle("bundleId")                               │
│                     .add("namedQuery", snapshot)                        │
│                     .build()                                            │
│                            │                                            │
│                            ▼                                            │
│               [Cloud Storage / CDN Endpoint]                            │
│               (Cache-Control: private, max-age=3600)                    │
└────────────────────────────┬────────────────────────────────────────────┘
                             │ HTTP GET (Buffer Binario)
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    CAPACITOR / CLIENTE MÓVIL                            │
│  1. fetch(bundleUrl)                                                    │
│  2. loadBundle(db, arrayBuffer) ──> [IndexedDB / Local Cache]           │
│  3. query = namedQuery(db, "activeClinicalProfile")                     │
│  4. snapshot = getDocsFromCache(query) ──> 0 Lecturas de Red Firestore │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2. Implementación en Servidor: Cloud Functions v2 (`generateClinicalBundle`)

```typescript
// functions/src/bundles/clinicalBundle.ts
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const db = getFirestore();
const storage = getStorage();

export const generatePatientClinicalBundle = onRequest(
  {
    region: "europe-west1",
    memory: "512MiB",
    timeoutSeconds: 60,
    cors: true,
  },
  async (req, res) => {
    try {
      const patientId = req.query.patientId as string;
      const authHeader = req.headers.authorization;

      if (!patientId || !authHeader) {
        res.status(400).json({ error: "Parámetros insuficientes o no autenticado" });
        return;
      }

      const bundleId = `clinical-profile-${patientId}-${Date.now()}`;
      const bundle = db.bundle(bundleId);

      const profileSnap = await db.doc(`patients/${patientId}/profile/current`).get();
      const semanticProfileSnap = await db.doc(`patients/${patientId}/semanticProfile/current`).get();

      const directivesSnap = await db
        .collection(`patients/${patientId}/directives`)
        .where("isActive", "==", true)
        .orderBy("priority", "asc")
        .get();

      const goalsSnap = await db
        .collection(`patients/${patientId}/goals`)
        .where("status", "==", "in_progress")
        .limit(10)
        .get();

      const lastSessionSnap = await db
        .collection(`patients/${patientId}/sessions`)
        .orderBy("startedAt", "desc")
        .limit(1)
        .get();

      const bundleBuffer = bundle
        .add(profileSnap)
        .add(semanticProfileSnap)
        .add("activeDirectives", directivesSnap)
        .add("activeGoals", goalsSnap)
        .add("lastSession", lastSessionSnap)
        .build();

      const bucket = storage.bucket();
      const file = bucket.file(`bundles/${patientId}/latest_clinical_bundle.bin`);
      
      await file.save(bundleBuffer, {
        metadata: {
          contentType: "application/octet-stream",
          cacheControl: "private, max-age=3600, stale-while-revalidate=86400",
        },
      });

      res.setHeader("Content-Type", "application/octet-stream");
      res.setHeader("Cache-Control", "private, max-age=3600");
      res.status(200).send(bundleBuffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);
```

---

## 2. Vector Search Nativo en Firestore (KNN `findNearest`)

Google Cloud Firestore soporta búsqueda de similitud vectorial (KNN) directamente en la base de datos:
- **Tipo de Dato:** `FieldValue.vector([...])` hasta 2048 dimensiones.
- **Métricas:** `COSINE`, `EUCLIDEAN`, `DOT_PRODUCT`.
- **Aislamiento Multi-tenant:** Pre-filtrado estricto por subcolección `patients/{patientId}/semantic_memories`.

```typescript
// functions/src/retrieval/vectorRetrieval.ts
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const db = getFirestore();

export async function searchClinicalMemories(
  patientId: string,
  queryVector: number[],
  topK: number = 5
) {
  const collectionRef = db.collection(`patients/${patientId}/semantic_memories`);
  
  const vectorQuery = collectionRef
    .where("authorityLevel", "<=", 3)
    .findNearest({
      vectorField: "embedding",
      queryVector: FieldValue.vector(queryVector),
      limit: topK,
      distanceMeasure: "COSINE",
      distanceResultField: "similarityScore",
    });

  const querySnapshot = await vectorQuery.get();
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    distance: doc.get("similarityScore"),
  }));
}
```

---

## 3. Optimización de Costes en Sesiones de Chat

1. **Patrón Message Bucketing:** Los últimos 20 mensajes residen en `sessions/{sessionId}` como un array, permitiendo cargar el chat con **1 sola lectura**.
2. **Consolidación Pre-calculada en `semanticProfile/current`:** El perfil semántico, directivas y variables clave se leen en **1 solo documento** en cada turno en vez de consultar 5 subcolecciones.
3. **Custom Claims en Firebase Auth:** Eliminación de llamadas `get()` dentro de `firestore.rules`. El rol y los pacientes asignados se validan en memoria mediante `request.auth.token.role`.

---

## 4. Referencias y Citas Oficiales

- **Firestore Bundles:** [https://firebase.google.com/docs/firestore/bundles](https://firebase.google.com/docs/firestore/bundles)
- **Firestore Vector Search:** [https://cloud.google.com/firestore/docs/vector-search](https://cloud.google.com/firestore/docs/vector-search)
- **Firestore Pricing & Aggregation:** [https://firebase.google.com/docs/firestore/pricing](https://firebase.google.com/docs/firestore/pricing)
- **Firebase Auth Custom Claims:** [https://firebase.google.com/docs/auth/admin/custom-claims](https://firebase.google.com/docs/auth/admin/custom-claims)
- **Capacitor Mobile Architecture:** [https://capacitorjs.com/docs/core-apis](https://capacitorjs.com/docs/core-apis)
