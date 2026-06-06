# T2: Chatbot con Memoria y Evolucion Clinica — Diseno de Sistema para Ancora

---

## Indice

1. [Arquitectura de Memoria (3 Niveles)](#1-arquitectura-de-memoria-3-niveles)
2. [Evolucion Clinica](#2-evolucion-clinica)
3. [Pipeline RAG](#3-pipeline-rag)
4. [Memoria Tipo Hermes](#4-memoria-tipo-hermes)
5. [Ciclo Diario de 15 Min](#5-ciclo-diario-de-15-min)
6. [Deteccion de Crisis](#6-deteccion-de-crisis)
7. [Estratificacion de Modelos](#7-estratificacion-de-modelos)

---

## 1. ARQUITECTURA DE MEMORIA (3 NIVELES)

El sistema de memoria de Ancora sigue una arquitectura jerarquica de tres niveles que emula la estructura de la memoria humana: una ventana atencional inmediata (corto plazo), consolidacion episodica diaria (medio plazo) e historia clinica completa indexada (largo plazo).

```
+------------------------------------------------------------------+
|                    SISTEMA DE MEMORIA ANCORA                      |
+------------------------------------------------------------------+
|                                                                   |
|  CORTO PLAZO (Working Memory)                                     |
|  +------------------------------------------------------------+  |
|  | Ventana de contexto: 4K-8K tokens                           |  |
|  | Almacen: KV Cache en VRAM (vLLM PagedAttention)            |  |
|  | Persistencia: duracion de la sesion de 15 min              |  |
|  | Limpieza: al cerrar sesion se extraen "hechos del dia"     |  |
|  +------------------------------------------------------------+  |
|                               |                                   |
|                               v                                   |
|  MEDIO PLAZO (Episodic Memory)                                    |
|  +------------------------------------------------------------+  |
|  | Resumen diario: compresion de la sesion del dia             |  |
|  | Resumen semanal: consolidacion de 7 resumenes diarios       |  |
|  | Almacen: PostgreSQL (tabla `daily_summaries`)               |  |
|  | Trigger: fin de sesion (diario) / sabado noche (semanal)    |  |
|  +------------------------------------------------------------+  |
|                               |                                   |
|                               v                                   |
|  LARGO PLAZO (Semantic Memory)                                    |
|  +------------------------------------------------------------+  |
|  | Vector DB (pgvector / Qdrant)                               |  |
|  | Chunks: conversaciones, diarios, informes SOAP              |  |
|  | Metadatos: timestamp, tipo, emocion asociada, temas         |  |
|  | Indexacion: nightly batch (20:00-08:00)                     |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

### 1.1 Memoria a Corto Plazo (Working Memory)

Gestionada directamente por vLLM mediante PagedAttention con KV Cache cuantizada.

- **Ventana maxima:** 8,192 tokens por sesion de 15 minutos
- **Tamaño efectivo:** ~4,000 tokens para dejar margen para RAG y system prompt
- **Ubicacion fisica:** VRAM de las GPUs (~1.31 GB por usuario a 8K contexto con KV Cache 8-bit)
- **Mecanismo de extraccion:** Al cerrar la sesion, el sistema ejecuta un prompt de extraccion para obtener hechos clave, estado emocional y temas pendientes

```
PROMPT DE EXTRACCION POST-SESION (ejecutado en el modelo 8B-14B):

Sistema: Extrae los siguientes campos de la conversacion reciente.
         Devuelve SOLO JSON valido.

Campos:
- hechos_del_dia: array de strings con hechos literales
- estado_emocional_predominante: {emocion: string, intensidad: 1-10}
- temas_pendientes: array de strings
- distorsiones_cognitivas_detectadas: array de strings
- nivel_riesgo: "bajo" | "medio" | "alto"
- citas_literales_relevantes: array de {texto: string, contexto: string}
```

### 1.2 Memoria a Medio Plazo (Episodic Memory)

Almacenada en PostgreSQL, tabla `daily_summaries`. Cada resumen usa ~500-800 tokens comprimidos.

```
Tabla: daily_summaries
+------------------+------------------+-------------------------------------------+
| Columna          | Tipo             | Descripcion                               |
+------------------+------------------+-------------------------------------------+
| id               | UUID PRIMARY KEY |                                            |
| patient_id       | UUID FK          | Referencia al paciente                     |
| session_date     | DATE             | Fecha de la sesion                         |
| summary_text     | TEXT             | Resumen comprimido (~500 tokens max)       |
| embedding_id     | UUID             | Referencia al chunk en vector DB           |
| dominant_emotion | VARCHAR(50)      | Emocion predominante del dia               |
| emotion_score    | FLOAT            | 1.0 - 10.0                                 |
| topics           | TEXT[]           | Array de temas tocados                     |
| risk_flag        | BOOLEAN          | Si se detecto algo relevante               |
| session_count    | INTEGER          | Numero de interacciones en el dia           |
| created_at       | TIMESTAMPTZ      |                                            |
+------------------+------------------+-------------------------------------------+

Tabla: weekly_summaries
+------------------+------------------+-------------------------------------------+
| Columna          | Tipo             | Descripcion                               |
+------------------+------------------+-------------------------------------------+
| id               | UUID PRIMARY KEY |                                            |
| patient_id       | UUID FK          |                                            |
| week_start       | DATE             | Lunes de la semana                         |
| week_end         | DATE             | Domingo                                    |
| consolidated_text| TEXT             | ~1000 tokens, fusion de 7 resumenes        |
| embedding_id      | UUID             |                                            |
| trend            | VARCHAR(20)      | 'mejoria' | 'estancamiento' | 'retroceso' |
| patterns         | JSONB            | Patrones emocionales detectados            |
| created_at       | TIMESTAMPTZ      |                                            |
+------------------+------------------+-------------------------------------------+
```

**Estrategia de consolidacion:**

```
DIARIO (fin de sesion de 15 min):
  1. Ejecutar prompt de extraccion post-sesion (modelo 8-14B)
  2. Generar resumen comprimido de ~500 tokens
  3. Almacenar en daily_summaries
  4. Marcar para embedding nocturno

SEMANAL (domingo 22:00 - batch nocturno):
  1. Recuperar los 7 resumenes diarios de la semana
  2. Prompt al modelo 14-32B: "Consolida estos 7 resumenes en uno solo
     de ~1000 tokens. Identifica patrones, progreso y temas recurrentes."
  3. Almacenar en weekly_summaries
  4. Actualizar perfil psicologico del paciente
  5. Generar embedding del resumen semanal consolidado

NOCTURNO (20:00-08:00, nightly batch):
  1. Recorrer todos los daily_summaries del dia sin embedding
  2. Generar embeddings con modelo ligero (all-MiniLM-L6-v2 o similar)
  3. Insertar en pgvector/Qdrant con metadatos
  4. Actualizar indices de patrones emocionales
  5. Generar briefings SOAP pendientes
  6. Ejecutar deteccion de tendencias (modelo 14-32B)
```

### 1.3 Memoria a Largo Plazo (Semantic Memory)

Indexada en base de datos vectorial. Diferentes tipos de contenido se almacenan con metadatos para retrieval segmentado.

```
Chunks en Vector DB (pgvector / Qdrant):
+------------------+------------------------------------------------------+
| Campo            | Descripcion                                          |
+------------------+------------------------------------------------------+
| id               | UUID                                                 |
| patient_id       | Para aislamiento por paciente                        |
| content          | Texto del chunk                                      |
| embedding         | Vector de 384-768 dimensiones                        |
| metadata         | JSONB: tipo, timestamp, emocion, temas, session_id   |
| content_type     | 'conversacion' | 'diario' | 'soap' | 'resumen'         |
| created_at       | TIMESTAMPTZ                                          |
| source           | Origen: 'chat' | 'whisper_transcript' | 'soap'       |
+------------------+------------------------------------------------------+
```

**Flujo de insercion nocturna (codigo Python conceptual):**

```python
# nightly_batch.py — Ejecutado via cron a las 20:00
import asyncio
from pgvector.psycopg2 import register_vector
from sentence_transformers import SentenceTransformer
import psycopg2
import json

# Modelo de embeddings ligero (~80MB, CPU)
embedder = SentenceTransformer('all-MiniLM-L6-v2')

async def nightly_batch():
    conn = psycopg2.connect(dsn="dbname=ancora user=ancora")
    register_vector(conn)
    cur = conn.cursor()

    # 1. Obtener daily_summaries sin embedding del dia
    cur.execute("""
        SELECT id, summary_text, patient_id, dominant_emotion, topics
        FROM daily_summaries
        WHERE embedding_id IS NULL
          AND created_at::date = CURRENT_DATE
    """)

    rows = cur.fetchall()
    for row in rows:
        summary_id, text, patient_id, emotion, topics = row

        # Generar embedding
        vector = embedder.encode(text).tolist()

        # Insertar en vector DB
        cur.execute("""
            INSERT INTO vector_chunks
                (patient_id, content, embedding, metadata, content_type)
            VALUES (%s, %s, %s, %s, 'resumen')
            RETURNING id
        """, (patient_id, text, vector, json.dumps({
            'emotion': emotion,
            'topics': topics,
            'date': str(date.today()),
            'summary_id': str(summary_id)
        })))

        embedding_id = cur.fetchone()[0]

        # Actualizar referencia en daily_summaries
        cur.execute("""
            UPDATE daily_summaries
            SET embedding_id = %s
            WHERE id = %s
        """, (embedding_id, summary_id))

    # 2. Actualizar patrones emocionales
    await detect_emotional_patterns(cur, conn)

    # 3. Generar briefings SOAP pendientes
    await generate_pending_soap(cur, conn)

    conn.commit()
    cur.close()
    conn.close()
```

---

## 2. EVOLUCION CLINICA

### 2.1 Deteccion de Patrones Emocionales

El sistema analiza tres dimensiones principales en cada interaccion:

```
Dimensiones de Analisis:
+-------------------+------------------------------------------------------+
| Dimension         | Metrica                                              |
+-------------------+------------------------------------------------------+
| Emocional         | Clasificador de emociones (6 basicas + 3 clinicas)    |
|                   | - Alegria, Tristeza, Ira, Miedo, Asco, Sorpresa       |
|                   | - Ansiedad, Verguenza, Culpa (clinicas)                |
|                   | Intensidad: 1-10                                      |
+-------------------+------------------------------------------------------+
| Tono del Lenguaje | Analisis linguistico:                                 |
|                   | - Proporcion pronombres 1ra/2da persona               |
|                   | - Densidad de palabras negativas vs positivas         |
|                   | - Longitud media de frase (indica energia)            |
|                   | - Uso de absolutistas ("siempre", "nunca", "todo")    |
+-------------------+------------------------------------------------------+
| Tematico          | Clasificacion de topicos:                             |
|                   | - Trabajo, Relaciones, Autoestima, Salud, Familia...  |
|                   | - Recurrencia: cuantas veces aparece un tema en N dias|
|                   | - Co-ocurrencia: temas que aparecen juntos            |
+-------------------+------------------------------------------------------+
```

**Algoritmo de deteccion de patrones (ejecutado cada noche):**

```python
def detect_emotional_patterns(patient_id, days=14):
    """
    Analiza los ultimos N dias de resumenes para detectar:
    - Patrones emocionales dominantes
    - Ciclos (ej. ansiedad los domingos por la noche)
    - Correlaciones entre eventos y estados
    """
    resumenes = get_daily_summaries(patient_id, last_n_days=days)

    # Vector de emociones diarias
    emotion_series = [r.dominant_emotion for r in resumenes]
    intensity_series = [r.emotion_score for r in resumenes]

    # Patron 1: Frecuencia relativa de cada emocion
    from collections import Counter
    freq = Counter(emotion_series)
    dominant = freq.most_common(3)

    # Patron 2: Volatilidad emocional (cambios bruscos)
    volatility = sum(
        abs(intensity_series[i] - intensity_series[i-1])
        for i in range(1, len(intensity_series))
    ) / len(intensity_series)

    # Patron 3: Estancamiento (misma emocion dominante >5 dias seguidos)
    stagnation = max(
        len(list(g))
        for _, g in groupby(emotion_series)
    )

    return {
        'emociones_dominantes': dominant,
        'volatilidad': round(volatility, 2),
        'dias_estancamiento': stagnation,
        'tendencia': classify_trend(resumenes)
    }
```

### 2.2 Identificacion de Progreso vs Estancamiento vs Retroceso

Cada resumen semanal recibe una clasificacion de tendencia basada en criterios compuestos:

```
CRITERIOS DE CLASIFICACION:

PROGRESO (mejoria):
- disminucion de intensidad de emociones negativas (>20% vs semana anterior)
- aumento de variedad emocional
- disminucion de absolutistas en el lenguaje (>30%)
- mencion de estrategias de afrontamiento aplicadas
- reduccion de temas de crisis recurrente

ESTANCAMIENTO:
- misma emocion dominante durante >=7 sesiones
- intensidad estable +/- 1 punto
- mismo conjunto de temas recurrentes sin variacion
- lenguaje sin cambios en densidad negativa/positiva

RETROCESO:
- aumento de intensidad de emociones negativas (>20%)
- reaparicion de temas que se consideraban resueltos
- aumento de lenguaje absolutista
- disminucion de mencion de estrategias
- indicadores de evitacion (cambio brusco de tema, silencios)
```

### 2.3 Actualizacion del Perfil Psicologico

El perfil psicologico del paciente es un documento JSON que se actualiza con cada interaccion significativa (nudge tras N interacciones, donde N se determina por la significancia del cambio detectado).

Ver seccion [4. Memoria Tipo Hermes](#4-memoria-tipo-hermes) para la estructura completa del perfil.

### 2.4 Alertas Automaticas al Psicologo

Sistema de alertas escalonadas:

```
NIVELES DE ALERTA:

🟢 NIVEL VERDE (Informativo):
   - "Patron detectado: tu paciente muestra aumento de ansiedad
      los fines de semana"
   - "Tema emergente: ha mencionado conflictos laborales 3 veces
      esta semana"
   - Canal: notificacion push en el dashboard

🟡 NIVEL AMBAR (Requiere atencion):
   - "Estancamiento detectado: 10 dias consecutivos con ansiedad
      como emocion dominante"
   - "Retroceso: aumento del 40% en lenguaje absolutista esta semana"
   - Canal: email + notificacion dashboard

🔴 NIVEL ROJO (Urgente):
   - "Posible crisis detectada: ideacion suicida en la sesion de hoy"
   - "Alerta de autolesion: patron de lenguaje compatible"
   - Canal: email + SMS + notificacion app + llamada si configurado
```

```javascript
// sistema_alertas.js — Logica de alertas en backend Node.js
const nodemailer = require('nodemailer');
const twilio = require('twilio');

async function evaluarYNotificar(patientId, sessionData) {
  const alertas = [];

  // 1. Evaluar riesgo inmediato (ver seccion 6)
  if (sessionData.nivel_riesgo === 'alto') {
    alertas.push({
      nivel: 'rojo',
      tipo: 'crisis',
      mensaje: 'ALERTA DE CRISIS: Se ha detectado ideacion suicida/autolesion',
      canales: ['email', 'sms', 'push']
    });
  }

  // 2. Evaluar estancamiento
  const patrones = await detectarPatrones(patientId, 14);
  if (patrones.dias_estancamiento >= 7) {
    alertas.push({
      nivel: 'ambar',
      tipo: 'estancamiento',
      mensaje: `Estancamiento detectado: ${patrones.dias_estancamiento} dias
                con misma emocion dominante`,
      canales: ['email', 'push']
    });
  }

  // 3. Evaluar retroceso
  if (patrones.tendencia === 'retroceso') {
    alertas.push({
      nivel: 'ambar',
      tipo: 'retroceso',
      mensaje: 'Retroceso detectado en tendencia semanal',
      canales: ['email', 'push']
    });
  }

  // Enviar alertas
  for (const alerta of alertas) {
    await enviarAlerta(patientId, alerta);
  }

  return alertas;
}
```

### 2.5 Metricas Detalladas

```
METRICAS POR PACIENTE (calculadas en nightly batch):

| Metrica                              | Formula / Origen                           |
|--------------------------------------|--------------------------------------------|
| Frecuencia de emociones              | Conteo de emociones dominantes / total dias|
| Tono del lenguaje (ratio neg/pos)    | Analisis lexico con diccionario NRC        |
| Temas recurrentes                    | Clasificador de topicos sobre N chunks     |
| Volatilidad emocional                | Desviacion estandar de intensidad diaria   |
| Progresion de intensidad             | Pendiente de regresion lineal (14 dias)    |
| Densidad de absolutistas             | Frecuencia de "siempre/nunca/todo" / total |
| Ratio de adherencia                  | Sesiones realizadas / sesiones esperadas   |
| Tiempo hasta primera respuesta       | Latencia del paciente en contestar         |
| Longitud media de intervencion       | Tokens promedio por mensaje del paciente   |
| Exploracion de nuevos temas          | Proporcion de topicos nuevos vs repetidos  |
```

---

## 3. PIPELINE RAG

### 3.1 Base de Datos Vectorial

Para Ancora se recomienda **pgvector** (extension nativa de PostgreSQL) sobre Qdrant por:

1. Menos servicios que mantener (una unica base de datos)
2. Transacciones ACID con el resto de datos clinicos
3. Backup unificado
4. Suficiente rendimiento para 1,000 DAU con ~100K chunks

```
CONFIGURACION PGVECTOR:

-- Activar extension
CREATE EXTENSION vector;

-- Tabla de chunks
CREATE TABLE vector_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    content TEXT NOT NULL,
    embedding vector(384),  -- all-MiniLM-L6-v2
    metadata JSONB DEFAULT '{}',
    content_type VARCHAR(50) NOT NULL,
    source VARCHAR(50) DEFAULT 'chat',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_chunks_patient ON vector_chunks(patient_id);

-- Indice vectorial (IVFFlat para balance velocidad/calidad)
CREATE INDEX idx_chunks_embedding ON vector_chunks
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- O, para mayor precision (HNSW, mas lento en insercion):
CREATE INDEX idx_chunks_embedding_hnsw ON vector_chunks
    USING hnsw (embedding vector_cosine_ops);
```

### 3.2 Embeddings

**Modelo recomendado:** `sentence-transformers/all-MiniLM-L6-v2`

- Dimensiones: 384
- Velocidad en CPU: ~10K docs/segundo
- Tamaño: ~80MB
- Calidad: suficiente para matching semantico clinico

**Tipos de contenido embedido:**

```
1. CONVERSACIONES (del chat diario)
   Chunk size: 256 tokens
   Overlap: 32 tokens
   Metadata: {type: "conversacion", date, emotion, topics, session_id}

2. DIARIOS (resumenes diarios)
   Chunk size: 512 tokens (el resumen completo como 1 chunk)
   Metadata: {type: "diario", date, dominant_emotion, score}

3. INFORMES SOAP (generados por el modelo 70B)
   Chunk size: 512 tokens
   Metadata: {type: "soap", date, validated_by_therapist, sections}

4. NOTAS DEL PSICOLOGO
   Chunk size: 512 tokens
   Metadata: {type: "nota_psicologo", date, therapist_id}
```

### 3.3 Retrieval Semantico

El retrieval usa consultas del modelo 8-14B como embedding query, no el texto crudo del usuario. Esto mejora significativamente la relevancia.

```
FLUJO DE RETRIEVAL:

Mensaje del usuario:
  "Hoy me siento muy ansioso por la reunion de trabajo"

Paso 1: Expandir query con el modelo pequeno (8B):
  Query expandida: "ansiedad laboral, sintomas de ansiedad,
  estres por reuniones, anticipacion negativa, rendimiento
  laboral bajo presion"

Paso 2: Embedding de la query expandida (all-MiniLM-L6-v2)

Paso 3: Busqueda coseno en pgvector:
  SELECT content, metadata, 1 - (embedding <=> :query_vec) AS sim
  FROM vector_chunks
  WHERE patient_id = :patient_id
    AND 1 - (embedding <=> :query_vec) > 0.7
  ORDER BY sim DESC
  LIMIT 15;

Paso 4: Reranking (ver 3.4)

Paso 5: Seleccion top-K que quepan en ventana de 4K tokens
```

### 3.4 Reranking

El reranker filtra los resultados del retrieval inicial para eliminar falsos positivos.

```python
from sentence_transformers import CrossEncoder

# Modelo reranker (~50MB, CPU)
reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

def rerank(query, candidates, top_k=5):
    """
    Toma los candidatos del retrieval vectorial y los reordena
    segun relevancia real respecto a la query.
    """
    pairs = [[query, c['content']] for c in candidates]
    scores = reranker.predict(pairs)

    scored = list(zip(candidates, scores))
    scored.sort(key=lambda x: x[1], reverse=True)

    # Umbral de relevancia: descartar < 0.3
    filtered = [c for c, s in scored if s > 0.3]

    return filtered[:top_k]
```

### 3.5 Ventana de Contexto Dinamica

El prompt final se construye con un presupuesto maximo de 4,096 tokens para la seccion de contexto RAG.

```
ESTRUCTURA DEL PROMPT FINAL (max 8,192 tokens total):

+------------------------------------------------------------------+
| System Prompt (fijo, ~600 tokens)                                |
| - Instrucciones de rol (IA clinica de soporte)                    |
| - Reglas de seguridad (no diagnosticar, no prescribir)            |
| - Formato de respuesta (empatico, socratico)                      |
+------------------------------------------------------------------+
| Contexto Psicologico del Paciente (~400 tokens)                  |
| - Perfil comprimido extraido de memoria Hermes                   |
| - Estado emocional actual                                        |
| - Temas pendientes                                                |
+------------------------------------------------------------------+
| Contexto RAG (variable, max 4,096 tokens)                        |
| - Resumen del dia anterior (si existe)                           |
| - Chunks relevantes recuperados + rerankeados                    |
| - Notas SOAP recientes                                           |
+------------------------------------------------------------------+
| Conversacion Actual (~2,000 tokens)                              |
| - Ultimos N intercambios (hasta llenar ventana)                  |
+------------------------------------------------------------------+
| Prompt de salida (~100 tokens)                                   |
| - Instruccion de formato de respuesta                            |
+------------------------------------------------------------------+

AJUSTE DINAMICO:
  1. Medir tokens del System Prompt (fijo, conocido)
  2. Medir tokens del Contexto Psicologico
  3. Calcular tokens disponibles para RAG = 4096 - usado
  4. Iterar chunks rerankeados y agregar mientras quepan
  5. Si no cabe todo, truncar chunks individuales (perder final)
```

---

## 4. MEMORIA TIPO HERMES

Inspirado en el sistema de memoria persistente de Hermes, Ancora implementa una estructura de "hechos persistentes" que evoluciona con cada interaccion.

### 4.1 Estructura Completa en JSON

```json
{
  "patient_id": "uuid-del-paciente",
  "version": 7,
  "ultima_actualizacion": "2026-05-31T02:00:00Z",

  "datos_demograficos": {
    "edad": 34,
    "genero": "femenino",
    "ocupacion": "desarrolladora de software",
    "ubicacion": "Madrid"
  },

  "hechos_persistentes": {
    "creencias_fundamentales": [
      "Cree que no es lo suficientemente buena en su trabajo",
      "Cree que los demas la juzgan constantemente",
      "Cree que debe complacer a todos para ser aceptada"
    ],
    "relaciones_significativas": [
      {
        "persona": "madre",
        "tipo": "familiar",
        "calidad": "conflictiva",
        "patron": "critica constante, busca aprobacion",
        "eventos_recientes": ["discusion por telefono el 2026-05-28"]
      },
      {
        "persona": "pareja",
        "tipo": "romantica",
        "calidad": "estable",
        "patron": "apoyo, pero dificultad para expresar necesidades",
        "eventos_recientes": []
      }
    ],
    "eventos_vitales": [
      {
        "fecha": "2025-11-15",
        "tipo": "laboral",
        "descripcion": "ascenso a lider de equipo",
        "impacto_emocional": "estres positivo inicial, luego ansiedad"
      },
      {
        "fecha": "2025-03-10",
        "tipo": "perdida",
        "descripcion": "fallecimiento del padre",
        "impacto_emocional": "duelo no procesado, evita hablar del tema"
      }
    ]
  },

  "perfil_psicologico": {
    "diagnostico_trabajado": "Trastorno de Ansiedad Generalizada (TAG)",
    "enfoque_terapeutico": "TCC con elementos de ACT",
    "distorsiones_cognitivas_frecuentes": [
      "lectura de mente",
      "catastrofismo",
      "polarizacion (blanco o negro)",
      "personalizacion"
    ],
    "patrones_emocionales": {
      "ansiedad": {
        "frecuencia": "alta (70% de los dias)",
        "intensidad_media": 7.2,
        "desencadenantes_comunes": ["reuniones laborales", "criticas", "incertidumbre"],
        "sintomas_expresados": ["taquicardia", "nudo en el estomago", "insomnio"],
        "tendencia_14d": "estable_alta"
      },
      "tristeza": {
        "frecuencia": "media (30% de los dias)",
        "intensidad_media": 5.8,
        "desencadenantes_comunes": ["recuerdos del padre", "sentirse sola"],
        "tendencia_14d": "descendente"
      },
      "ira": {
        "frecuencia": "baja (10% de los dias)",
        "intensidad_media": 4.0,
        "desencadenantes_comunes": ["injusticia percibida", "no ser escuchada"],
        "tendencia_14d": "estable_baja"
      }
    },
    "progreso_medido": {
      "estado_actual": "progreso_lento",
      "mejoras_detectadas": [
        "menos absolutistas en el lenguaje (-25% vs mes anterior)",
        "identifica sus distorsiones con mayor rapidez",
        "ha aplicado 3 ejercicios de exposicion"
      ],
      "areas_estancadas": [
        "autoestima laboral",
        "duelo del padre (evitacion)"
      ],
      "objetivos_terapeuticos": [
        "reducir ansiedad ante reuniones",
        "procesar duelo del padre",
        "establecer limites interpersonales"
      ]
    }
  },

  "gaps": {
    "temas_no_explorados": [
      {
        "tema": "relacion con el padre fallecido",
        "prioridad": "alta",
        "motivo": "evitacion sistematica del tema",
        "intentos_previos_preguntar": 2,
        "respuesta_del_paciente": "cambio de tema / respuesta evasiva",
        "estrategia_sugerida": "abordar de forma indirecta, preguntar por recuerdos neutros"
      },
      {
        "tema": "historial de terapia previa",
        "prioridad": "media",
        "motivo": "no ha mencionado si tuvo terapia antes",
        "intentos_previos_preguntar": 1,
        "ultimo_intento": "2026-05-20",
        "estrategia_sugerida": "preguntar en contexto de 'estrategias que ya has probado'"
      }
    ],
    "ejercicios_pendientes": [
      "registro de pensamientos automaticos (3 registros pendientes)",
      "ejercicio de exposicion a reuniones (no realizado)"
    ]
  },

  "metricas_del_lenguaje": {
    "promedio_palabras_por_mensaje": 45.3,
    "ratio_pronombres_1ra_vs_2da": 3.2,
    "frecuencia_absolutistas_ultima_semana": 12,
    "vocabulario_emocional_detectado": ["ansiedad", "miedo", "frustracion", "soledad", "esperanza"],
    "temas_recurrentes_ultimos_30dias": [
      {"tema": "trabajo", "menciones": 23},
      {"tema": "familia", "menciones": 15},
      {"tema": "autoestima", "menciones": 14},
      {"tema": "relacion_pareja", "menciones": 8}
    ]
  },

  "resumenes_recientes": {
    "ultimo_dia": {
      "fecha": "2026-05-30",
      "emocion_dominante": "ansiedad",
      "intensidad": 8,
      "tema_principal": "reunion importante manana",
      "cita_literal": "No voy a dormir en toda la noche, voy a hacer el ridiculo"
    },
    "ultima_semana": {
      "fecha_inicio": "2026-05-24",
      "fecha_fin": "2026-05-30",
      "tendencia": "estancamiento_leve",
      "patron_detectado": "la ansiedad se intensifica los domingos por la noche",
      "tema_mas_recurrente": "anticipacion negativa de eventos laborales"
    }
  }
}
```

### 4.2 Mecanismo de Actualizacion (Nudge)

El perfil no se reescribe en cada interaccion. Se actualiza mediante un sistema de "nudge" que evalua si la nueva informacion es suficientemente significativa para justificar la reescritura.

```python
class MemoryNudgeSystem:
    """Sistema de actualizacion perezosa de memoria tipo Hermes."""

    def __init__(self, patient_id):
        self.patient_id = patient_id
        self.umbral_significancia = 0.5  # 0-1

    async def evaluate_nudge(self, session_data):
        """
        Evalua si la sesion reciente merece actualizar el perfil.
        Retorna True si el cambio es significativo.
        """
        cambios = []

        # 1. Cambio emocional significativo
        if abs(session_data.intensidad - self.profile.patron_base) > 2:
            cambios.append(('intensidad_emocional', 0.7))

        # 2. Nuevo tema emergente
        temas_nuevos = set(session_data.temas) - set(self.profile.temas_recurrentes)
        if temas_nuevos:
            cambios.append(('nuevos_temas', 0.6 * len(temas_nuevos)))

        # 3. Detectada nueva distorsion cognitiva
        nuevas_distorsiones = (
            set(session_data.distorsiones) -
            set(self.profile.distorsiones_frecuentes)
        )
        if nuevas_distorsiones:
            cambios.append(('nuevas_distorsiones', 0.8))

        # 4. Menciona relacion no registrada
        for mencion in session_data.relaciones_mencionadas:
            if mencion not in [r.persona for r in self.profile.hechos_persistentes.relaciones]:
                cambios.append(('nueva_relacion', 0.9))
                break

        # 5. Evento vital significativo
        if session_data.tiene_evento_vital:
            cambios.append(('evento_vital', 1.0))

        # Calcular puntuacion total
        puntuacion = sum(peso for _, peso in cambios) / max(len(cambios), 1)

        return puntuacion >= self.umbral_significancia
```

### 4.3 Campo de Gaps

El campo `gaps` es fundamental: registra temas que el sistema sabe que debe explorar pero que no han sido abordados o han sido evadidos.

**Logica de autogestion de gaps:**

```
CADA NOCHE, en el batch:
  1. Revisar gaps con 'prioridad: alta' que no se han preguntado en 3+ dias
  2. Si un gap tiene 'intentos >= 3' sin exito, escalar al psicologo
     con: "Tema X ha sido evadido 3 veces, posible resistencia"
  3. Si un gap se resuelve (paciente habla del tema), mover a
     'temas_explorados' y actualizar el perfil

EJEMPLO DE HEURISTICA DE ABORDAJE:

funcion sugerir_abordaje(gap, estado_actual):
    si gap.intentos == 0:
        # Primer intento: pregunta directa pero suave
        return "He notado que no hemos hablado mucho de [tema].
                ?Te gustaria compartir algo sobre ello?"

    si gap.intentos == 1:
        # Segundo intento: indirecto, en contexto
        return "A veces cuando pasa [evento_actual], la gente
                nota conexiones con [tema]. ?Te resuena algo?"

    si gap.intentos == 2:
        # Tercer intento: normalizar, reducir presion
        return "No hace falta que hables de [tema] si no te sientes
                preparada. Solo quiero que sepas que cuando quieras,
                podemos abordarlo juntas."

    si gap.intentos >= 3:
        # Escalar al psicologo, no insistir mas
        return None  # No preguntar, dejar al humano
```

---

## 5. CICLO DIARIO DE 15 MIN

### 5.1 Flujo Completo

```
CICLO DIARIO DE 15 MINUTOS
============================

FASE 0: PRE-SESION (back-end, < 1s)
+----+ Inicia cuando el paciente abre el chat
|    |
|    +--> 1. Cargar perfil psicologico comprimido
|    +--> 2. Recuperar resumen del dia anterior
|    +--> 3. Recuperar chunks RAG relevantes
|         (ultima semana, gaps, temas pendientes)
|    +--> 4. Construir prompt inicial con contexto
|    +--> 5. Cargar modelo 8-14B en VRAM (si no esta caliente)
|
+----> [PACIENTE VE INTERFAZ: "Hola [nombre], ?como estas hoy?"]

FASE 1: CHECK-IN EMOCIONAL (~2 min)
+----+ La IA guia un check-in estructurado
|    |
|    +--> ?Como te sientes hoy? (escala 1-10)
|    +--> ?Que ha pasado desde nuestra ultima charla?
|    +--> ?Hay algo especifico que quieras trabajar hoy?
|
|    [Clasificador NLP evalua riesgo en tiempo real]
|    Si riesgo "alto" ---> ACTIVAR PROTOCOLO DE CRISIS
|    Si riesgo "medio" --> marcar para alerta al psicologo
|
+----> [REGISTRO: estado_emocional_inicial, temas_del_dia]

FASE 2: TRABAJO TERAPEUTICO GUIADO (~10 min)
+----+ La IA aplica tecnicas segun el enfoque y contexto
|    |
|    ENFOQUE TCC:
|    +--> Identificar pensamiento automatico
|    +--> ?Que evidencia apoyo/refuta ese pensamiento?
|    +--> ?Que le dirias a un amigo en tu situacion?
|    +--> Reestructuracion cognitiva guiada
|
|    ENFOQUE ACT:
|    +--> ?Que estas evitando en este momento?
|    +--> Ejercicio de defusion (nombrar el pensamiento)
|    +--> ?Que valores guian tus acciones esta semana?
|
|    INTERVENCIONES MIXTAS:
|    +--> Psicoeducacion breve (si aplica)
|    +--> Ejercicio practico (respiración, grounding)
|    +--> Exploracion de gaps pendientes (max 1 intento por sesion)
|
+----> [REGISTRO: intervencion_realizada, respuesta_paciente]

FASE 3: CIERRE Y PLAN (~3 min)
+----+ La IA cierra la sesion estructuradamente
|    |
|    +--> Resumir lo trabajado hoy (1-2 frases)
|    +--> ?Que te llevas de esta conversacion?
|    +--> Tarea sugerida para la semana
|    +--> ?Algo mas que quieras compartir?
|    +--> Recordatorio de la proxima sesion con psicologo
|
|    [CIERRE AUTOMATICO: registrar fin de sesion]
|
+----> [PACIENTE VE: "Gracias por compartir. Nos vemos manana."]

FASE 4: POST-SESION (back-end, ~2s)
+----+ Ejecutar pipeline de cierre inmediato
|    |
|    +--> 1. Extraer hechos del dia (prompt de extraccion)
|    +--> 2. Generar resumen diario (~500 tokens)
|    +--> 3. Detectar distorsiones cognitivas
|    +--> 4. Evaluar necesidad de nudge (ver 4.2)
|    +--> 5. Almacenar en daily_summaries
|    +--> 6. Marcar para embedding nocturno
|    +--> 7. Evaluar alertas para el psicologo
|    +--> 8. Cerrar sesion, liberar KV Cache
|
+----> [DATOS LISTOS PARA EL BATCH NOCTURNO]

=== FIN DEL CICLO DIARIO ===
```

### 5.2 Resumen Automatico (Post-Sesion)

El prompt de resumen post-sesion se ejecuta en el modelo 8-14B (el mismo del chat diario) para no consumir recursos del modelo grande:

```
PROMPT DE RESUMEN AUTOMATICO:

Sistema: Eres un asistente clinico que resume sesiones de terapia.
Genera un resumen estructurado en JSON de la conversacion reciente.

Debes extraer:
1. "resumen": 2-3 frases del contenido principal
2. "emocion_dominante": una emocion principal
3. "intensidad_emocional": 1-10
4. "distorsiones_cognitivas": array (vacio si no hay)
5. "temas_mencionados": array
6. "intervencion_realizada": tipo de intervencion
7. "respuesta_a_intervencion": "receptivo"|"neutral"|"resistente"
8. "temas_pendientes": array de temas no cerrados
9. "citas_literales": array de frases textuales relevantes
10. "nivel_riesgo": "bajo"|"medio"|"alto"

Devuelve SOLO el JSON, sin texto adicional.
```

### 5.3 Batch Nocturno (20:00 - 08:00)

```
NOCTURNO: PROCESAMIENTO EN BACKGROUND
========================================

PIPELINE NOCTURNO (orquestado por cron + BullMQ):

20:00 ─── 1. Activar workers nocturnos
          2. Pausar workers de chat diurno
          3. Iniciar pipeline

20:00-20:15 ─── A. EMBEDDINGS DEL DIA
   +----> Recorrer daily_summaries del dia sin embedding
   +----> all-MiniLM-L6-v2 en CPU
   +----> Insertar en pgvector

20:15-20:30 ─── B. DETECCION DE PATRONES
   +----> Leer ultimos 14-30 resumenes del paciente
   +----> Modelo 14-32B: detectar tendencias, patrones
   +----> Actualizar perfil psicologico (si nudge > umbral)
   +----> Actualizar campo trends en weekly_summary

20:30-21:00 ─── C. BRIEFING SOAP (si es domingo o fin de mes)
   +----> Modelo 70B: generar o refrescar informe SOAP
   +----> Almacenar en tabla soap_reports
   +----> Embedding del SOAP generado

21:00-21:15 ─── D. GAPS Y ALERTAS
   +----> Revisar gaps con prioridad alta no preguntados en 3+ dias
   +----> Evaluar alertas para psicologo
   +----> Notificaciones push programadas

21:15-23:00 ─── E. TRANSCRIPCIONES WHISPER (pendientes del dia)
   +----> Procesar cola de audios en GPU secundaria (RTX 3060/4060)
   +----> Faster-Whisper-Large-v3 en INT8

23:00-06:00 ─── F. PROCESAMIENTO DIFERIDO
   +----> Limpieza de KV Cache
   +----> Compactacion de tablas
   +----> Backups

06:00-08:00 ─── G. PREPARACION DIURNA
   +----> Preparar resumenes del dia para cada paciente
   +----> Precargar contextos de pacientes con sesion temprano
   +----> Ready para el dia

08:00 ─── 1. Activar workers diurnos
          2. Pausar workers nocturnos
```

---

## 6. DETECCION DE CRISIS

### 6.1 Clasificador NLP en Tiempo Real

Arquitectura de dos capas: reglas + modelo pequeno.

```
CAPA 1: REGLAS (siempre activas, <1ms)
+----> Lista negra de palabras clave con contexto
       - Terminos explicitos: "suicid", "matarme", "autolesion",
         "cortarme", "pastillas", "desaparecer"
       - Se evalua en el mensaje TEXTO PLANO del usuario
         (antes de cualquier procesamiento LLM)
       - Si se detecta: pasar a evaluacion semantica

CAPA 2: CLASIFICADOR SEMANTICO (modelo pequeno, <80ms)
+----> Modelo: BERTiny o DistilBERT fine-tuned en espanol
       (o Qwen-2.5-7B-Instruct con prompt de clasificacion binaria)
+----> Entrada: el mensaje del usuario
+----> Salida: {crisis: bool, tipo: string, confianza: 0-1}
+----> Clases:
       - ideacion_suicida: pensamientos o planes de suicidio
       - autolesion: deseo o acto de autolesionarse
       - brote_psicotico: desconexion de realidad, delirios
       - violencia: deseo de hacer dano a otros
       - panico: ataque de panico en curso
       - abuso: revelacion de abuso en curso
       - ninguna: sin riesgo detectado
```

```python
# crisis_detector.py — Clasificador ligero en tiempo real
from transformers import pipeline
import re

class CrisisDetector:
    def __init__(self):
        # Modelo pequeno para clasificacion (~50MB)
        self.classifier = pipeline(
            "text-classification",
            model="ancora/crisis-detector-es-v1",  # fine-tuned DistilBERT
            return_all_scores=True
        )
        # Palabras clave de alta prioridad (kill-switch inmediato)
        self.kill_words = {
            "suicidio", "suicidarme", "suicida", "matarme",
            "quitarme la vida", "autolesion", "cortarme",
            "lastimarme", "no quiero vivir", "acabar con todo",
            "voy a hacerlo", "ya no aguanto mas"
        }

    async def evaluate(self, message: str, session_context: dict) -> dict:
        """
        Evalua un mensaje en tiempo real.
        Retorna dict con nivel de alerta y accion a tomar.
        """
        message_lower = message.lower()

        # CAPA 1: Kill words (ejecutar inmediato)
        for kw in self.kill_words:
            if kw in message_lower:
                return {
                    "alerta": "ROJA",
                    "tipo": "ideacion_suicida",
                    "confianza": 1.0,
                    "accion": "kill_switch"
                }

        # CAPA 2: Clasificador semantico
        result = self.classifier(message)
        top = max(result[0], key=lambda x: x['score'])

        if top['label'] != 'ninguna' and top['score'] > 0.7:
            return {
                "alerta": "ROJA" if top['score'] > 0.9 else "AMARILLA",
                "tipo": top['label'],
                "confianza": top['score'],
                "accion": "kill_switch" if top['score'] > 0.9 else "alerta_psicologo"
            }

        # CAPA 3: Evaluacion de tendencia (depresion sostenida)
        if await self._evaluate_depression_trend(session_context):
            return {
                "alerta": "AMARILLA",
                "tipo": "depresion_sostenida",
                "confianza": 0.7,
                "accion": "alerta_psicologo"
            }

        return {
            "alerta": "VERDE",
            "tipo": "ninguna",
            "confianza": 1.0,
            "accion": "ninguna"
        }

    async def _evaluate_depression_trend(self, context):
        """Evalua si hay patron de depresion sostenida."""
        # Logica: si en los ultimos 7 dias la emocion dominante
        # es tristeza con intensidad > 7 y el paciente muestra
        # lenguaje de desesperanza
        return False  # Implementar con datos reales
```

### 6.2 Kill-Switch

```javascript
// kill_switch.js — Protocolo de emergencia
async function activarKillSwitch(patientId, message, detection) {
  // 1. CONGELAR CHAT INMEDIATAMENTE
  await redis.set(`chat:frozen:${patientId}`, 'true', 'EX', 3600);
  // Bloquear envio de nuevos mensajes
  // Marcar sesion como "en crisis"

  // 2. MOSTRAR INTERFAZ DE EMERGENCIA
  // El frontend detecta el flag frozen=true y renderiza:
  //   - Overlay rojo con mensaje de contencion
  //   - Numeros de emergencia: 024 (suicidio), 112
  //   - Boton "Hablar con alguien ahora" -> conecta con psicologo
  //   - Boton de respiracion guiada (contencion inmediata)
  await sendToClient(patientId, {
    type: 'CRISIS_MODE',
    data: {
      mensaje: "Estamos aqui para ayudarte. Estos recursos pueden apoyarte ahora mismo.",
      emergencias: [
        { nombre: "Linea 024 (Suicidio)", numero: "024", descripcion: "Linea de prevencion del suicidio" },
        { nombre: "Emergencias", numero: "112", descripcion: "Emergencias nacionales" },
        { nombre: "Telefono de la Esperanza", numero: "717 003 717", descripcion: "Atencion 24h" }
      ],
      grounding_ejercicio: {
        instruccion: "Respira profundamente 5 segundos...",
        pasos: ["Inhala 4s", "Manten 4s", "Exhala 6s"]
      }
    }
  });

  // 3. ALERTA PRIORITARIA AL PSICOLOGO
  const psicologo = await db.getAssignedTherapist(patientId);
  await Promise.all([
    sendEmail(psicologo.email, {
      subject: `[URGENTE] Alerta de crisis - Paciente ${patientId}`,
      body: `Se ha detectado ${detection.tipo} (confianza: ${detection.confianza})
             Mensaje: "${message}"
             Accion inmediata requerida.`
    }),
    sendSMS(psicologo.telefono, `ANCORA ALERTA: Paciente en crisis.
             ${detection.tipo}. Acceda al panel.`),
    sendPushNotification(psicologo.id, {
      title: 'ALERTA DE CRISIS',
      body: `${detection.tipo} detectado en paciente. Acceda ahora.`,
      priority: 'high',
      data: { patientId, crisisType: detection.tipo }
    })
  ]);

  // 4. REGISTRO EN LOG DE AUDITORIA INMUTABLE
  // Usar append-only log (hash chain o blockchain ligero)
  const logEntry = {
    timestamp: new Date().toISOString(),
    patientId,
    tipo: detection.tipo,
    confianza: detection.confianza,
    mensaje_resumen: message.substring(0, 200),
    acciones_tomadas: ['kill_switch', 'email_psicologo', 'sms_psicologo',
                        'push_notification', 'emergency_ui'],
    hash_anterior: await auditLog.getLastHash(),
    hash_actual: null  // Se computa al insertar
  };
  logEntry.hash = crypto.createHash('sha256')
    .update(JSON.stringify(logEntry))
    .digest('hex');
  await auditLog.append(logEntry);
}
```

### 6.3 Log de Auditoria Inmutable

Estructura de hash chain para garantizar inmutabilidad:

```
Tabla: audit_log
+------------------+------------------+-----------------------------------+
| Columna          | Tipo             | Descripcion                       |
+------------------+------------------+-----------------------------------+
| id               | BIGSERIAL        |                                    |
| timestamp        | TIMESTAMPTZ      |                                    |
| patient_id       | UUID             |                                    |
| event_type       | VARCHAR(50)      | 'crisis' | 'access' | 'soap_gen' |
| severity         | VARCHAR(10)      | 'rojo' | 'ambar' | 'verde'         |
| payload          | JSONB            | Datos del evento                  |
| actor_type       | VARCHAR(20)      | 'system' | 'therapist' | 'patient' |
| actor_id         | UUID             |                                    |
| hash_prev        | VARCHAR(64)      | SHA256 del registro anterior      |
| hash_curr         | VARCHAR(64)      | SHA256 de este registro            |
+------------------+------------------+-----------------------------------+

Verificacion de integridad:
  SELECT hash_curr FROM audit_log ORDER BY id DESC LIMIT 1;
  -> Debe coincidir con SHA256(prev_hash_chain + payload)
  Si no coincide -> ALERTA DE SEGURIDAD: log manipulado
```

---

## 7. ESTRATIFICACION DE MODELOS

### 7.1 Distribucion por Capa

```
ESTRATIFICACION DE MODELOS SEGUN CAPA DE PROCESAMIENTO
========================================================

CAPA 0: CLASIFICADOR + REGLAS (siempre local, CPU)
┌──────────────────────────────────────────────────────────────┐
│ Modelo: DistilBERT / BERTiny (fine-tuned crisis detection)   │
│ Parametros: ~67M                                              │
│ Cuantizacion: INT8                                           │
│ VRAM: ~50MB (CPU: 0MB, RAM: ~150MB)                         │
│ Velocidad: <5ms por clasificacion                            │
│ Tarea: deteccion de crisis en tiempo real                    │
│ Consumo: despreciable                                        │
└──────────────────────────────────────────────────────────────┘

CAPA 1: CHAT DIARIO INTERACTIVO (GPU, ~110 t/s)
┌──────────────────────────────────────────────────────────────┐
│ Modelo: GLM-4-9B / Qwen-2.5-7B-Instruct                     │
│ Parametros: 7B-14B                                           │
│ Cuantizacion: FP16 (nativa) o AWQ 4-bit                      │
│ VRAM: ~9-12 GB                                               │
│ Velocidad: 80-110 t/s                                        │
│ Tarea: conversacion diaria guiada, check-ins, extraccion     │
│ Nota: PEQUEÑO Y RAPIDO para el 85% de interacciones          │
│       El paciente NO necesita CoT de 70B para el dia a dia   │
└──────────────────────────────────────────────────────────────┘

CAPA 2: RESUMENES SEMANALES (GPU, ~45 t/s)
┌──────────────────────────────────────────────────────────────┐
│ Modelo: Gemma-2-27B / Llama-3-8B-Instruct (para resumenes)  │
│ Parametros: 8B-32B                                           │
│ Cuantizacion: FP8 o AWQ 4-bit                                │
│ VRAM: ~15-28 GB                                              │
│ Velocidad: 30-70 t/s                                         │
│ Tarea: consolidacion de resumenes semanales, deteccion de    │
│        patrones, actualizacion de perfil psicologico         │
│ Nota: se ejecuta en BATCH NOCTURNO, no en tiempo real        │
└──────────────────────────────────────────────────────────────┘

CAPA 3: BRIEFINGS CLINICOS SOAP (GPU, ~25 t/s)
┌──────────────────────────────────────────────────────────────┐
│ Modelo: DeepSeek-R1-Distill-Llama-70B / Qwen-72B            │
│ Parametros: 70B                                              │
│ Cuantizacion: AWQ 4-bit / EXL2 4.0 bpw                      │
│ VRAM: ~35 GB (+ KV Cache ~2 GB)                             │
│ Velocidad: 25-60 t/s                                        │
│ Tarea: generacion de informes SOAP estructurados,           │
│        analisis clinico profundo, deteccion de patrones       │
│        complejos, briefings para el psicologo               │
│ Nota: SOLO para el briefing semanal/mensual. NO para chat   │
└──────────────────────────────────────────────────────────────┘

CAPA 4: EMBEDDINGS (CPU, batch nocturno)
┌──────────────────────────────────────────────────────────────┐
│ Modelo: all-MiniLM-L6-v2 / paraphrase-multilingual-MiniLM   │
│ Parametros: ~22M                                             │
│ Dimension: 384                                                │
│ VRAM: 0MB (se ejecuta en CPU)                                │
│ Velocidad: ~10K docs/segundo en CPU (20 nucleos)             │
│ Tarea: embedding de chunks para RAG                          │
│ Consumo: ~500MB RAM                                          │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Logica de Enrutamiento

```python
# model_router.py — Enrutamiento inteligente de requests a modelos
from enum import Enum

class ModelTier(Enum):
    CRISIS = "crisis"       # Clasificador, siempre disponible
    CHAT = "chat"           # 8-14B, chat diario
    ANALYSIS = "analysis"   # 14-32B, analisis nocturno
    CLINICAL = "clinical"   # 70B, briefings SOAP

class ModelRouter:
    def __init__(self):
        self.tiers = {
            ModelTier.CRISIS: {"model": "crisis-detector", "max_concurrent": 100},
            ModelTier.CHAT: {"model": "glm-4-9b", "max_concurrent": 270},
            ModelTier.ANALYSIS: {"model": "gemma-2-27b", "max_concurrent": 8},
            ModelTier.CLINICAL: {"model": "deepseek-r1-70b", "max_concurrent": 4},
        }

    def determine_tier(self, request_type: str, is_night: bool) -> ModelTier:
        """
        Determina que modelo debe procesar una request segun:
        - Tipo de tarea
        - Hora del dia (night batch vs real-time)
        """
        # Mapa de tareas a tier
        task_map = {
            "chat_message": ModelTier.CHAT,
            "crisis_eval": ModelTier.CRISIS,
            "daily_summary": ModelTier.CHAT,
            "weekly_summary": ModelTier.ANALYSIS,
            "soap_generation": ModelTier.CLINICAL,
            "pattern_detection": ModelTier.ANALYSIS,
            "memory_nudge": ModelTier.ANALYSIS,
            "embedding": ModelTier.CRISIS,  # Se ejecuta en CPU, no GPU
        }

        tier = task_map.get(request_type, ModelTier.CHAT)

        # Validar disponibilidad segun hora
        if not is_night and tier in [ModelTier.ANALYSIS, ModelTier.CLINICAL]:
            # Durante el dia, reenviar tareas pesadas a la cola nocturna
            return None  # Marcar para cola nocturna

        return tier
```

### 7.3 Matriz de Decision

```
CUANDO USAR CADA MODELO
========================

| Escenario                      | Modelo        | Tiempo     | Por que no mas grande |
|--------------------------------|---------------|------------|-----------------------|
| "Hola, ?como estas hoy?"      | 8-14B         | < 1s       | 70B no aporta valor   |
|                                 |               |            | extra para saludo     |
| "Hoy tuve un dia horrible..."  | 8-14B         | < 2s       | La empatia no         |
|                                 |               |            | requiere 70B          |
| Detectar ideacion suicida      | Clasificador  | < 5ms      | Latencia critica,     |
|                                 | + reglas      |            | modelo grande es lento|
| Resumir la sesion de hoy       | 8-14B         | < 1s       | Suficiente para       |
|                                 |               |            | ~500 tokens de resumen|
| Consolidar 7 resumenes         | 14-32B        | batch      | Necesita razonar      |
| de la semana                   |               | nocturno   | sobre patrones        |
| Generar informe SOAP           | 70B           | batch      | Maxima calidad para   |
| para el psicologo              |               | nocturno   | el clinico humano     |
| Actualizar perfil psicologico  | 14-32B        | batch      | Requiere analisis     |
|                                 |               | nocturno   | multidimensional      |
| Embedding diario para RAG      | MiniLM (CPU)  | batch      | CPU suficiente,       |
|                                 |               | nocturno   | no desperdiciar VRAM  |
| Reranking de retrieval         | Cross-Encoder | < 50ms     | CPU, modelo pequeno   |
|                                 | (CPU)         |            |                       |

COSTE ESTIMADO POR TAREA (en funcion de tokens generados):

| Tarea             | Tokens In  | Tokens Out | Modelo      | Coste GPU*  |
|-------------------|------------|------------|-------------|-------------|
| Chat mensaje      | ~2,000     | ~200       | 8-14B       | 0.0003 €    |
| Resumen diario    | ~3,000     | ~500       | 8-14B       | 0.0005 €    |
| Resumen semanal   | ~4,000     | ~1,000     | 14-32B      | 0.002 €     |
| Briefing SOAP     | ~6,000     | ~2,000     | 70B         | 0.015 €     |
| Embedding chunk   | 512        | 384-dim    | MiniLM (CPU)| 0.00001 €   |
| Clasificacion     | ~200       | binaria    | DistilBERT  | < 0.00001 € |

* Coste redondeado incluyendo electricidad + amortizacion de hardware
  a 3 anos. CLARAMENTE RENTABLE con planes desde 30-40 €/mes.
```

### 7.4 Ejemplo de Flujo Completo con Enrutamiento

```
EJEMPLO: UN DIA EN LA VIDA DEL SISTEMA
=========================================

09:00 - PACIENTE abre el chat
  └─> Frontend envia request POST /api/chat
  └─> Backend: model_router.determine_tier("chat_message")
      └─> Es de dia -> ModelTier.CHAT -> GLM-4-9B
  └─> Se construye prompt con:
      - System prompt (600t)
      - Perfil comprimido (400t)
      - Resumen de ayer (300t)
      - Top 5 chunks RAG (1,200t)
      - Conversacion actual (1,500t)
      Total: ~4,000 tokens
  └─> GLM-4-9B genera respuesta empatica (~200 tokens, ~2ms)

09:00 (paralelo) - CLASIFICADOR DE RIESGO
  └─> El mensaje del paciente se pasa por CrisisDetector
  └─> Salida: {alerta: "VERDE", tipo: "ninguna"}
  └─> No se toma accion adicional

09:02 - Fin de sesion (15 min)
  └─> BACKEND ejecuta prompt de resumen en GLM-4-9B
  └─> Almacena daily_summary en PostgreSQL
  └─> Marca para embedding nocturno

--- MAS TARDE ---

20:00 - INICIO BATCH NOCTURNO
  └─> 1. Embeddings: all-MiniLM-L6-v2 en CPU
      Procesa todos los daily_summaries del dia
      500 pacientes * 1 chunk = 500 docs -> ~50ms
  └─> 2. Deteccion de patrones: Gemma-2-27B
      Este paciente: ultimos 14 dias
      Detecta: "ansiedad alta los domingos por la noche"
      Actualiza perfil psicologico
  └─> 3. Briefing SOAP: solo si toca esta semana
      Para este paciente no toca -> skip
  └─> 4. Gaps: revisar gaps del perfil
      Gap "relacion con padre" -> 3 dias sin preguntar
      Prioridad alta -> marcar para preguntar manana
  └─> 5. Notificaciones: agenda alertas para manana

--- FIN DEL CICLO ---
```

---

## RESUMEN DE ARQUITECTURA

```
     +-----------+
     | PACIENTE  |
     +-----+-----+
           |
     +-----v-----+       +------------------+
     |  FRONTEND  |       |  PSICOLOGO DASH  |
     | (React/PWA)|       |  (React/PWA)     |
     +-----+------+       +--------+---------+
           |                       |
     +-----v-----------------------v---------+
     |         API GATEWAY (Nginx + Node)    |
     +-----+-----------------------+---------+
           |                       |
     +-----v-----+          +------v--------+
     |  REDIS    |          |  PostgreSQL    |
     | (colas)   |          | + pgvector     |
     +-----------+          +-------+--------+
           |                        |
     +-----v------------------------v--------+
     |         vLLM (GPU Cluster)            |
     |  +--------+ +--------+ +--------+    |
     |  |  Crisis | |  8-14B | |  70B   |   |
     |  | Detector| | (Chat) | | (SOAP) |   |
     |  | (CPU)   | | (GPU)  | | (GPU)  |   |
     |  +--------+ +--------+ +--------+    |
     |                                       |
     |   +--------+   +-----------+          |
     |   | 14-32B |   | Whisper   |          |
     |   |(Analisis|   | (GPU sec) |          |
     |   | Nocturno|   |(Audio)    |          |
     |   +--------+   +-----------+          |
     +---------------------------------------+
           |
     +-----v-----+
     |  MiniLM    |
     | (embeddings|
     |  CPU)      |
     +-----------+
```

---

*Documento generado como parte de la investigacion tecnica de Ancora (ancora.clinic). Arquitectura para chatbot con memoria persistente, evolucion clinica y estratificacion de modelos locales en servidor privado.*
