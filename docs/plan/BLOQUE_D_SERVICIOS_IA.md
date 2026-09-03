# Bloque D — Servicios de IA

> El motor. Construido y validado contra el endpoint real; falta enchufarlo a la
> interfaz y jubilar el motor antiguo.
> **Criterio de cierre:** un solo motor de IA en toda la app; ningún camino usa
> el gateway antiguo; el protocolo de riesgo da el recurso correcto en cada caso.

**Estado del bloque:** 🟢 8 de 9 tareas cerradas (solo queda D7, bloqueada por A9)
**Depende de:** A (credenciales), B (colecciones destino)
**Bloquea a:** E, F, G

---

## Tareas

| ID | Servicio / tarea | Estado | Validación real |
|---|---|---|---|
| D1 | `claudeService.js` — cliente streaming, modelos por tarea, reintentos | ✅ | `checkAIEndpoint` ok; 504 del gateway resuelto con streaming (D-05) |
| D2 | `transcriptionService.js` — voz a texto **y lectura de imágenes** | ✅ | Audio real 13 s transcrito; foto de informe transcrita literal con visión (D-21) |
| D3 | `clinicalIngestionService.js` — ingesta con verificación de citas | ✅ | 2 documentos del dataset: 79 y 71 elementos, **0 sin evidencia** |
| D4 | `clinicalReportService.js` — informes periódicos | ✅ | Informe real desde Firestore; detectó solo la incoherencia del dataset (D-14) |
| D5 | `voiceChatService.js` — voz castellana Aura-2 | ✅ | Ida y vuelta idéntica con `silvia`; 1,4 s a primera palabra |
| D6 | `continuousRecorderService.js` — grabadora continua | ✅ | 3 tandas reales; 4/4 citas verificadas; cabos sueltos útiles |
| D7 | Voz a voz agéntica en tiempo real | ⬜ | Bloqueada por A9 (token efímero) |
| D8 | Migrar chat y vistas del motor antiguo a Claude | ✅ | `grep aiService src` → solo los ayudantes de configuración del panel admin |
| D9 | **Protocolo de riesgo como código** | ✅ | 70 pruebas; el 016 solo con indicio, el 112 siempre |

---

## Detalle de las pendientes

### D7 · Voz a voz agéntica

Objetivo: hablar con la IA en directo, con consulta del expediente en medio de la
conversación y posibilidad de interrumpirla. Arquitectura elegida:
`micrófono → Deepgram streaming (nova-3, es) → Claude con retrieve() del
CognitiveMemoryEngine → Aura-2 troceada`. Falta solo el token efímero (A9).
Mientras tanto el bucle por lotes ya da 2,6 s por turno.

### D8 · Migración del motor antiguo · ✅ HECHA

Migrados: `chatTerapeuta.js` (con streaming, anamnesis y riesgo), `clinicalEngine`
(3 llamadas), `usePatientChat` (ahora pasa por el chat clínico completo, así que
ese camino también lleva protocolo de riesgo), `PacienteChatView` (2 llamadas),
`PacienteHistoriaView` (F3) y el ping del panel de administración, que antes
comprobaba un gateway distinto del que usa la plataforma.

`aiService.js` queda marcado como obsoleto. Solo sobreviven sus ayudantes de
configuración (`getAiApiKey` y compañía), que se van con G9.

**Traducción de modelos:** `resolverModelo()` ignora los nombres antiguos
(`'auto'`, `'gemini-3.5-flash-lite'`) que las vistas siguen pasando y usa el
modelo de conversación. Sin eso, cada llamada heredada daría 404 (D-20).

### D9 · El 016 (urgente y pequeño)

En `docs/plan/../..//tmp scratchpad/guion_clinico.md` §6.2, el mensaje de nivel 3
por violencia ofrece el 016 de forma genérica. El 016 atiende **violencia contra
las mujeres**. Corrección: 112 siempre; 016 solo cuando el contexto lo indique.
Aplicarlo al guion antes de codificarlo en G2.

---

## Registro del bloque

| Fecha | Cambio |
|---|---|
| 2026-08-31 | **D9 cerrada como código**, no como texto: `src/lib/riskProtocol.js` con 3 niveles, 5 categorías, filtro de modismos y recursos por caso. Los teléfonos los añade el código tras la respuesta del modelo (L19, D-22). **D8 a medias**: `chatTerapeuta` ya va por Claude con streaming; faltan 4 vistas. Descubierto que el router hace visión (D-21): las fotos de informes entran por la ingesta normal. |
| 2026-08-31 | D1-D6 construidos y validados contra el endpoint público con audio y datos reales. STT por defecto cambiado a `whisper-large-v3-turbo` tras medir (R-5). |

> **NOTA EMILIO:**
>
>
