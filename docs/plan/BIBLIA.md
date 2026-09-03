# La Biblia de Áncora ⚓

> Las leyes del proyecto y todo lo que vamos descubriendo. **Este archivo no se
> poda**: los descubrimientos y rectificaciones se acumulan, no se borran.
> Cuando descubras algo, añádelo con el siguiente número libre.

**Última revisión:** 31 de agosto de 2026

---

## 1. Leyes innegociables

Si una tarea contradice una ley, la tarea está mal planteada.

### Datos clínicos

- **L1 · Evidencia o nada.** Ningún hallazgo entra en el expediente sin cita
  literal verificada contra la fuente por código, no por promesa del prompt.
- **L2 · El original se conserva siempre.** Aunque se guarde una versión
  reescrita (nota inteligente), el verbatim es la fuente de verdad. Verificar
  citas contra una paráfrasis de la IA invalida todo el control.
- **L3 · Todo dato lleva nivel de autoridad.** N1 validado por psicólogo >
  N2 documentado > N3 declarado por paciente > N4 inferencia IA.
- **L4 · N1 manda.** Si una inferencia contradice al psicólogo, gana el psicólogo.
- **L5 · `audit_logs` y `consents` son inmutables.** Sin update ni delete, nunca.

### IA

- **L6 · La IA no diagnostica.** Ni nombra trastornos, ni como hipótesis.
  Describe conductas, emociones, patrones y desencadenantes.
- **L7 · La IA no inventa.** Si un dato no está en la fuente, se omite.
- **L8 · Las palabras del paciente se conservan.** «Me hundo» no se traduce a
  «presenta ánimo bajo».
- **L9 · Streaming siempre.** Hay una pasarela con tope de ~120 s delante del
  router; en modo bloqueante devuelve 504 sin producir nada (ver D-05).
- **L10 · El riesgo nunca espera.** El protocolo se activa desde la primera
  conversación, sin umbrales de vínculo.

### Acceso

- **L11 · Denegar por defecto.** Paciente ve lo suyo; psicólogo, sus asignados;
  supervisor, todo.
- **L12 · Nadie se auto-promociona de rol.**
- **L13 · El informe completo es del psicólogo.** Al paciente, versión resumida
  y contenida, con aceptación previa.

### Método de trabajo

- **L14 · Verificar, no suponer.** Toda afirmación técnica se comprueba ejecutando.
- **L15 · Tres fallos iguales: parar** y analizar la causa raíz.
- **L16 · Nunca `commit` ni `push` automáticos.**
- **L17 · Sin ejecución local de modelos** (ni Ollama ni modelos en el navegador).
  Decisión de producto.
- **L18 · Proveedores permitidos:** Anthropic (Claude), Groq y Deepgram, vía el
  router. OpenRouter, DeepInfra y NVIDIA quedan descartados.
- **L19 · La seguridad no se le pide al modelo, se le impone.** Los teléfonos de
  ayuda, los niveles de riesgo y el escalado al psicólogo salen de
  `riskProtocol.js`, no de una instrucción del prompt. Comprobado en ejecución
  real: el modelo puede hacer la pregunta correcta y dejarse el 024 fuera
  (D-22). Una instrucción es una petición; esto tiene que ser una garantía.
- **L20 · Contenido clínico en markdown, no en código.** El banco de preguntas
  vive en `docs/clinico/GUION_ANAMNESIS.md` y se compila con `npm run guion`.
  Se revisa leyéndolo, no leyendo un array. Editar el archivo generado no vale:
  se pierde en la siguiente compilación.

---

## 2. Registro de descubrimientos

Por importancia. Formato: qué se encontró, qué consecuencia tiene, estado.

| # | Descubrimiento | Consecuencia | Estado |
|---|---|---|---|
| D-01 | `clinicalEngine.js` usaba `db` sin declararlo en 25 sitios: **8 funciones muertas**, incluida toda la subida de documentos (13 llamadas) | La ingesta se ofrecía en pantalla pero nunca se ejecutó. Explica el «está pero no va» | ✅ Corregido |
| D-02 | **50 referencias indefinidas** en total (además de `db`: estados borrados en `PacienteChatView`, closure en `AgentesView`, import en `DashboardView`) | Crear carpeta de chat o pulsar privacidad reventaba | ✅ Corregidas (0 restantes) |
| D-03 | Reglas de Firestore en `allow read, write: if true` sobre datos de salud | Cualquiera con el projectId leía/escribía todo por REST | ✅ Corregido y verificado (8/8 accesos anónimos denegados) |
| D-04 | Repo con **0 índices declarados** y proyecto con 9 creados a mano; 5 huérfanos con campos en camelCase | Un deploy a ciegas podía destruirlos | ✅ 24 declarados y desplegados · ⬜ huérfanos por borrar |
| D-05 | **Pasarela con tope de ~120 s** delante del router | Generación larga bloqueante = 504 sin producir nada | ✅ Todo en streaming (L9) |
| D-06 | El esquema completo de extracción agota 8192 tokens y trunca el JSON | Extracción en 3 pasadas enfocadas en paralelo | ✅ Aplicado |
| D-07 | **Embeddings imposibles**: los 20 modelos del router caídos; Cohere/Voyage prohíben navegador; Gemini gratis usa el contenido y admite revisión humana (descalificante RGPD art. 9) | Vía elegida: doc2query + BM25 + expansión de consulta con Claude | ⬜ Por implementar |
| D-08 | El chat en producción (`usePatientChat` → `aiService`) llama **sin streaming** | Expuesto al 504 de D-05; no ampliar contexto antes de migrarlo | ⬜ Migración pendiente |
| D-09 | Deepgram tiene **17 voces en español** (6 peninsulares); el router no las lista pero **las sirve** | TTS castellano resuelto con `aura-2-silvia-es` | ✅ En el código |
| D-10 | Sintetizar el párrafo entero = 3,7 s de silencio; primera frase corta = **1,4 s** | Troceado por frases con cola de reproducción | ✅ En el código |
| D-11 | videopro comparte el proyecto Firebase pero entra con credenciales privilegiadas del CLI | **Se salta las reglas**: sin colisión | ✅ Verificado |
| D-12 | Colección huérfana `patient_context_snapshots` pensada para compactación | Reaprovechable, no crear otra | ⬜ Para Fase 2 |
| D-13 | `RelevanceScorer` tenía el hueco `embeddingSimilarity` sin poblar y usaba Jaccard (sin IDF ni saturación) | BM25 en cliente, sin dependencias, con índice sobre el corpus del propio paciente | ✅ Hecho (21 pruebas) |
| D-14 | Ficha del paciente de prueba con residuo de menor de 14 años. **El motor de informes detectó solo la incoherencia** y la marcó como alerta alta | Dato corregido con copia previa | ✅ Corregido |
| D-15 | La clave de FreeLLMAPI viajaba **incrustada en cada build** y sigue en 2 commits del historial | Sacada del código y del bundle (verificado: 0 ocurrencias) | ⬜ **Rotar la clave** |
| D-16 | El SDK «de una línea» `omni-ai-hub.js` devuelve **404** | No usar ese snippet | ✅ Anotado |
| D-17 | El sitio de hosting por defecto **no se puede borrar** (`Cannot delete default Hosting Site`) | Se queda; es inofensivo (404) | ✅ Cerrado |
| D-18 | `tevaatocarllorarotravez` servía una web real ajena (directorio escolar de Alcobendas) | Borrada por orden expresa; permanente | ✅ Cerrado |
| D-19 | El error de transcripción **se propaga a la nota inteligente** («tandeado» por «cambiado») y es el comportamiento correcto: la nota no inventa | Por eso existe L2: el verbatim permite comprobar | ✅ Anotado |
| D-20 | Los modelos antiguos del motor FreeLLMAPI **no existen en el router** (solo 2 de 5, con otros IDs) | No hacer cambiazo a ciegas: migrar a Claude (D-08) | ✅ Resuelto en D8 con `resolverModelo()` |
| D-21 | **El router acepta visión.** `claude/claude-opus-5` con `image_url` en data URI transcribió literalmente una foto de un informe. No está documentado, pero funciona | Las fotos de informes y recetas entran por la misma ingesta que el texto (`transcribeImage`) | ✅ En uso |
| D-22 | **El modelo se deja los recursos de ayuda.** Ante «a veces pienso que sería mejor no estar» hizo la pregunta directa correcta pero omitió el 024, pese a tenerlo en la directiva | Los teléfonos los añade el código (`composeRiskReply`), no el modelo → ley L19 | ✅ Corregido |
| D-23 | **La directiva de riesgo se desbordaba de categoría.** Ante «mi hermano me pega» el modelo preguntó por ideación suicida, porque la instrucción de preguntar era común a todo el nivel 2 | La instrucción central del protocolo se elige por categoría: ideación solo en riesgo autolítico, seguridad en violencia | ✅ Corregido |
| D-24 | **La verificación de citas descartaba hallazgos válidos.** Si el modelo entrecomillaba la evidencia («"me despierto a las cuatro"»), las comillas no estaban en la fuente y el hallazgo se perdía en silencio | `stripQuoteWrapper()` recorta el envoltorio antes de comparar; el contenido queda intacto | ✅ Corregido |
| D-25 | **El prompt antiguo del chat contradecía el guion clínico:** exigía cerrar «siempre con 1 o 2 preguntas abiertas», negritas, viñetas y emojis, contra las reglas de una pregunta por turno y turnos de 2-4 frases | La identidad nueva del chat pide conversación, no informe. Medido: turnos de 49-98 caracteres, una pregunta | ✅ Corregido en D8 |
| D-27 | **El cliente asignaba roles privilegiados.** `firebaseAdapter` ponía `role: 'supervisor'` según una lista de correos, algo que las reglas de Firestore rechazan al crear un perfil. Funcionaba solo porque esos perfiles ya existían, creados desde la línea de comandos | El rol sale del perfil almacenado; un alta nueva nace como paciente o psicólogo, y la promoción se hace fuera de la aplicación | ✅ Corregido |
| D-28 | **PII repartida por el bundle público:** 52 apariciones de correos personales, además de UID, fotos de Google, números de colegiado y el nombre del paciente usado como valor por defecto en el panel del psicólogo y en plantillas de escritos al INSS | Perfiles de demostración inventados, filtros por rol, `DEFAULT_PSICOLOGO_ID` único. Quedan a propósito los datos que el RGPD obliga a publicar | ✅ Corregido |
| D-29 | **Una directiva demasiado prudente equivale a no tener la función.** El recuerdo espontáneo, redactado con cautelas («en la duda, cállatelo»), no salía NUNCA en la prueba real, tampoco en la conversación tranquila para la que se hizo | Instrucción imperativa cuando la fecha cae hoy, más un ejemplo del tono. Las excepciones (riesgo, urgencia) se mantienen y siguen funcionando | ✅ Corregido |
| D-26 | Quedaban **95 líneas de ingesta simulada** en `clinicalEngine.js`, inalcanzables tras un `throw`, que inventaban propuestas clínicas | Eliminadas. Nada que pueda escribir datos falsos en un expediente se queda «por si acaso» | ✅ Eliminado |

---

## 3. Registro de rectificaciones

Cosas afirmadas que resultaron estar mal. Se dejan escritas a propósito.

| # | Afirmé | Realidad | Lección |
|---|---|---|---|
| R-1 | «Las voces `aura-2-*-es` no existen» | Existen en Deepgram; el router no las lista pero las sirve | «No está en el catálogo» ≠ «no existe» |
| R-2 | «`nova-3` no transcribe» | Mi prueba pasaba `language=es` sobre audio **en inglés** | El fallo estaba en el test, no en el modelo |
| R-3 | «30 consultas necesitan índices que no existen» | Existían 9 a mano; el repo no los declaraba | Mirar el estado real, no deducirlo del repo |
| R-4 | «El chat de voz debe usar el sintetizador del navegador» | Solo como reserva; Aura-2 es muy superior | — |
| R-5 | «La métrica de diferencia de palabras mide precisión» | Penalizaba «4» vs «cuatro»; daba peor nota al modelo que acertaba | Leer las salidas, no solo la métrica |

---

## 4. Catálogo de IA verificado

Endpoint: `https://143-47-35-167.sslip.io/pro/omniroute/v1` · Clave en `.env.local`

| Tarea | Modelo | Estado |
|---|---|---|
| Extracción clínica profunda | `claude/claude-opus-5` | ✅ Probado |
| Informes y síntesis | `claude/claude-sonnet-5` | ✅ Probado |
| Chat de acompañamiento | `claude/claude-haiku-4-5-20251001` | ✅ Probado |
| Transcripción por lotes | `groq/whisper-large-v3-turbo` | ✅ El más preciso en castellano |
| Transcripción en directo | `deepgram/nova-3` | ✅ Funciona; streaming pendiente de token efímero |
| Voz castellana | `deepgram/aura-2-silvia-es` (+5 más) | ✅ En el código |
| Contexto masivo | `antigravity/gemini-3.1-pro-high` | Existe, sin probar |
| Visión / OCR | `antigravity/gemini-3-flash` | Existe, sin probar |
| Clasificación rápida | `groq/llama-3.3-70b-versatile` | Existe, sin probar |
| Embeddings | — | ❌ Sin vía (ver D-07) |

**IDs que NO existen** (no usar): `claude/claude-opus-5-ultra`, `cerebras/llama-3.3-70b`,
`antigravity/gemini-3.1-pro-2m`, `antigravity/gemini-3.7-flash`.

---

## 5. Mapa de datos

**Proyecto:** `ayuda-emilio-83261` · **Sitio:** `ancora-portal.web.app` ·
**Usuarios reales:** 3 (paciente `tisute`, psicólogo `usajosefernan`, supervisor `josferestudio`)

| Propiedad | Colecciones |
|---|---|
| `patient_id` | `clinical_profiles`, `clinical_documents`, `clinical_life_tree`, `clinical_episodes`, `clinical_timeline_index`, `clinical_facts`, `timeline_events`, `medications`, `episodes`, `patient_context_snapshots`, `chat_messages`, `clinical_reports`, `audit_logs`, `clinical_directives`, `clinical_proposals`, `patient_credits` |
| `user_id` | `conversations`, `daily_moods`, `daily_checkins`, `diario_entries`, `consents`, `debts`, `expenses`, `legal_roadmap`, `mente_sources`, `agent_tasks`, `agent_debates`, `risk_events` |
| `id` = uid | `profiles`, `psychologist_profiles` |
| Indirecta | `messages` (vía `conversation_id`), `agent_debate_messages` (vía `debate_id`) |
| Mixta | `appointments` (`patient_id`+`psychologist_id`), `settlements` (`psychologist_id`) |

**Ajenas** (videopro, mismo Firestore): `videopro_*` (11), `workflows`, `projects`, `learning_memory`.

> **NOTA EMILIO:**
>
>
