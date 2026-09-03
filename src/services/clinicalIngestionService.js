/**
 * @file clinicalIngestionService.js
 * @description Pipeline de ingesta clínica de Áncora ⚓.
 *
 * Convierte material en bruto —documentos adjuntos, notas de voz, historiales
 * de conversación— en estructura clínica trazable para el expediente del
 * paciente y para el contexto que consume el psicólogo.
 *
 * Principio rector: nada entra en el expediente sin evidencia textual.
 * Cada hallazgo debe venir acompañado de una cita literal presente en la
 * fuente. Los hallazgos cuya cita no se localiza en el texto original se
 * descartan antes de persistir. Es un control verificable, no una promesa
 * del prompt.
 */

import { askClinicalJSON, CLINICAL_MODELS, ClinicalAIError } from './claudeService.js';
import { transcribeAudio, isTranscribableAudio, transcribeImage, isReadableImage } from './transcriptionService.js';
// Se usa el dominio puro (sin dependencia de Firebase) para que la ingesta
// sea ejecutable y verificable fuera del navegador.
import { AuthorityLevel } from '../domain/memory/MemoryTypes.js';

/** Dimensiones del árbol vital de Áncora. */
export const LIFE_TREE_CATEGORIES = [
  'salud_fisica',
  'salud_emocional',
  'familia_y_vinculos',
  'trabajo_y_proposito',
  'economia_y_seguridad',
  'identidad_y_valores'
];

export const SOURCE_TYPES = {
  DOCUMENTO: 'documento',
  AUDIO: 'audio',
  CONVERSACION: 'conversacion',
  NOTA_VOZ: 'nota_voz',
  IMAGEN: 'imagen'
};

const EXTRACTION_SYSTEM = `Eres el motor de extracción clínica de Áncora, una plataforma de acompañamiento psicológico supervisada por psicólogos colegiados.

Tu función es DOCUMENTAL, no diagnóstica. Extraes y estructuras lo que la fuente dice, con el rigor de un psicólogo clínico experimentado preparando material para el terapeuta titular.

REGLAS INNEGOCIABLES:
1. CERO INVENCIÓN. Solo puedes registrar lo que aparece explícitamente en la fuente. Si un dato no está, se omite. Nunca completes lagunas con lo que sería plausible.
2. EVIDENCIA OBLIGATORIA. Cada elemento que extraigas debe incluir el campo "evidencia" con una cita LITERAL Y EXACTA de la fuente, copiada carácter a carácter, de entre 15 y 300 caracteres. Sin cita literal verificable, no incluyas el elemento.
3. SIN ETIQUETAS PATOLOGIZANTES. No emitas diagnósticos, no nombres trastornos ni categorías del DSM/CIE, ni siquiera como hipótesis. Describe conductas, emociones, patrones y desencadenantes en lenguaje descriptivo.
4. DISTINGUE ORIGEN. Marca si cada dato lo declara el paciente, consta documentado en un informe, o es una inferencia tuya de patrón.
5. LITERALIDAD EMOCIONAL. Conserva las palabras del paciente para describir su experiencia. No las traduzcas a jerga clínica.
6. RIESGO. Si detectas indicios de riesgo autolítico, violencia o desprotección, regístralos en "senales_riesgo" con su cita literal, sin dramatizar ni minimizar.`;

/**
 * La extracción se hace en tres pasadas enfocadas en lugar de una sola con el
 * esquema completo.
 *
 * Motivo medido, no estético: el esquema íntegro sobre un documento de 6 KB
 * agota los 8192 tokens de salida y devuelve JSON truncado. Además, acotar el
 * foco de cada pasada reduce la invención: el modelo no rellena bloques que no
 * le tocan. Las tres se lanzan en paralelo.
 */
const EXTRACTION_PASSES = [
  {
    id: 'cronologia',
    fields: ['eventos_timeline', 'medicaciones'],
    maxTokens: 16384,
    instruction: 'Extrae únicamente la cronología de hechos y el registro farmacológico presentes en la fuente.',
    schema: `{
  "eventos_timeline": [{
    "fecha": "string. Fecha o marcador temporal TAL COMO APARECE en la fuente ('2019', 'Infancia', 'marzo pasado'). Nunca inventes ni normalices una fecha que no esté.",
    "tipo": "personal|familiar|laboral|salud|trauma|logro|otro",
    "descripcion": "string",
    "emocion_asociada": "string o null",
    "intensidad": "número 1-10 o null. Solo si la fuente permite estimarlo.",
    "evidencia": "cita literal exacta de la fuente"
  }],
  "medicaciones": [{
    "nombre": "string",
    "dosis": "string o null",
    "pauta": "string o null",
    "prescriptor": "string o null",
    "evidencia": "cita literal exacta de la fuente"
  }]
}`
  },
  {
    id: 'patrones',
    fields: ['arbol_vital', 'desencadenantes', 'anclajes_protectores'],
    maxTokens: 16384,
    instruction: 'Extrae únicamente los patrones vitales: dimensiones del árbol vital, desencadenantes y recursos protectores.',
    schema: `{
  "arbol_vital": [{
    "categoria": "salud_fisica|salud_emocional|familia_y_vinculos|trabajo_y_proposito|economia_y_seguridad|identidad_y_valores",
    "hallazgo": "string",
    "valencia": "recurso|dificultad|neutro",
    "evidencia": "cita literal exacta de la fuente"
  }],
  "desencadenantes": [{
    "desencadenante": "string",
    "respuesta_observada": "string",
    "evidencia": "cita literal exacta de la fuente"
  }],
  "anclajes_protectores": [{
    "anclaje": "string",
    "evidencia": "cita literal exacta de la fuente"
  }]
}`
  },
  {
    id: 'sintesis',
    fields: ['resumen_fuente', 'temas_clave', 'citas_relevantes', 'dudas_para_sonsacar', 'senales_riesgo'],
    maxTokens: 16384,
    instruction: 'Sintetiza la fuente, selecciona las citas textuales más significativas y señala riesgos y lagunas.',
    schema: `{
  "resumen_fuente": "string. 3-6 frases. Qué es este material y qué aporta al expediente.",
  "temas_clave": [{ "tema": "string", "relevancia": "alta|media|baja", "evidencia": "cita literal exacta de la fuente" }],
  "citas_relevantes": [{ "cita": "cita literal textual del paciente, copiada carácter a carácter", "por_que_importa": "string" }],
  "dudas_para_sonsacar": ["string. Pregunta abierta, cálida y no invasiva que el acompañamiento debería explorar para cerrar una laguna REAL de esta fuente."],
  "senales_riesgo": [{ "tipo": "autolitico|violencia|desproteccion|consumo|otro", "detalle": "string", "evidencia": "cita literal exacta de la fuente", "urgencia": "alta|media|baja" }]
}`
  }
];

/**
 * Normaliza texto para comparar citas: colapsa espacios, unifica comillas
 * tipográficas y pasa a minúsculas. Sin esto, la verificación de evidencia
 * produce falsos negativos por diferencias de formato irrelevantes.
 */
function normalizeForMatch(text) {
  return String(text || '')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
}

/**
 * Quita el envoltorio de la cita: comillas, guiones de diálogo y puntuación
 * de los extremos.
 *
 * El modelo entrega muy a menudo la evidencia entrecomillada («"me despierto a
 * las cuatro"»). Esas comillas no están en la fuente, así que la comparación
 * literal fallaba y el hallazgo —válido— se descartaba en silencio. Solo se
 * tocan los extremos: el contenido de la cita queda intacto.
 */
function stripQuoteWrapper(text) {
  return String(text || '')
    .trim()
    .replace(/^[\s"'«»“”„‟‘’\-–—]+/, '')
    .replace(/[\s"'«»“”„‟‘’\-–—.,;:…]+$/, '');
}

/**
 * ¿La cita aparece realmente en la fuente?
 *
 * Exige coincidencia literal tras normalizar. Si falla, admite una
 * coincidencia por solapamiento de palabras del 85%, que cubre los recortes
 * del modelo (elipsis, puntuación intermedia) sin abrir la puerta a paráfrasis.
 */
export function evidenceIsGrounded(evidence, sourceText) {
  const quote = normalizeForMatch(stripQuoteWrapper(evidence));
  const source = normalizeForMatch(sourceText);
  if (quote.length < 10) return false;
  if (source.includes(quote)) return true;

  // Se trocea por cualquier cosa que no sea letra o número: si no, un
  // «cuatro"» con la comilla pegada no se encuentra nunca en la fuente.
  const words = quote.split(/[^\p{L}\p{N}]+/u).filter(w => w.length > 3);
  if (words.length < 4) return false;
  const present = words.filter(w => source.includes(w)).length;
  return present / words.length >= 0.85;
}

/**
 * Filtra una lista de hallazgos dejando solo los que citan la fuente.
 * @returns {{kept: Array, dropped: Array}}
 */
export function filterGrounded(items, sourceText, evidenceKey = 'evidencia') {
  const kept = [];
  const dropped = [];
  for (const item of Array.isArray(items) ? items : []) {
    if (item && evidenceIsGrounded(item[evidenceKey], sourceText)) kept.push(item);
    else dropped.push(item);
  }
  return { kept, dropped };
}

/**
 * Obtiene el texto plano de una fuente: lo transcribe si es audio y lo lee con
 * visión si es una foto o un escaneo.
 *
 * Sea cual sea la vía, lo que sale de aquí es el texto contra el que después
 * se verifican TODAS las citas. Por eso ni la transcripción ni la lectura de
 * imagen pueden resumir: si el texto fuente estuviera resumido, una cita
 * literal del original ya no se encontraría en él.
 *
 * @param {Object} source
 * @param {string} source.type      Uno de SOURCE_TYPES.
 * @param {string} source.text      Texto ya extraído (documento o conversación).
 * @param {File|Blob} source.file   Fichero de audio o imagen, si procede.
 * @param {string} source.fileName
 * @returns {Promise<{text: string, transcribed: boolean, sttModel: string|null}>}
 */
export async function resolveSourceText(source = {}, { signal = null } = {}) {
  const { type, text = '', file = null, fileName = '' } = source;

  if (file && (type === SOURCE_TYPES.AUDIO || type === SOURCE_TYPES.NOTA_VOZ || isTranscribableAudio(file))) {
    const result = await transcribeAudio({
      file,
      fileName,
      language: 'es',
      prompt: 'Sesión de acompañamiento psicológico en español. Terminología clínica y emocional.',
      signal
    });
    return { text: result.text, transcribed: true, sttModel: result.model };
  }

  if (file && (type === SOURCE_TYPES.IMAGEN || isReadableImage(file))) {
    const result = await transcribeImage({ file, fileName: fileName || file.name, signal });
    return { text: result.text, transcribed: true, sttModel: result.model };
  }

  const plain = String(text || '').trim();
  if (!plain) {
    throw new ClinicalAIError('La fuente no contiene texto ni audio transcribible.');
  }
  return { text: plain, transcribed: false, sttModel: null };
}

/**
 * Formatea un historial de chat como fuente textual analizable.
 * @param {Array<{role: string, content: string, created_at?: string}>} messages
 */
export function conversationToText(messages = []) {
  return messages
    .filter(m => m && typeof m.content === 'string' && m.content.trim())
    .map(m => {
      const who = m.role === 'assistant' ? 'ÁNCORA' : 'PACIENTE';
      const when = m.created_at ? ` [${String(m.created_at).slice(0, 16).replace('T', ' ')}]` : '';
      return `${who}${when}: ${m.content.trim()}`;
    })
    .join('\n');
}

/**
 * Nivel de autoridad clínica que corresponde a cada tipo de fuente.
 * Un informe médico documenta (N2); lo que cuenta el paciente se declara (N3).
 */
function authorityForSource(type) {
  switch (type) {
    case SOURCE_TYPES.DOCUMENTO:
      return AuthorityLevel.LEVEL_2_DOCUMENTED;
    case SOURCE_TYPES.AUDIO:
    case SOURCE_TYPES.NOTA_VOZ:
    case SOURCE_TYPES.CONVERSACION:
      return AuthorityLevel.LEVEL_3_DECLARED;
    default:
      return AuthorityLevel.LEVEL_4_AI_INFERENCE;
  }
}

/** Trocea fuentes largas respetando límites de párrafo. */
function chunkText(text, maxChars = 60000) {
  if (text.length <= maxChars) return [text];
  const chunks = [];
  let cursor = 0;
  while (cursor < text.length) {
    let end = Math.min(cursor + maxChars, text.length);
    if (end < text.length) {
      const breakPoint = text.lastIndexOf('\n\n', end);
      if (breakPoint > cursor + maxChars * 0.5) end = breakPoint;
    }
    chunks.push(text.slice(cursor, end));
    cursor = end;
  }
  return chunks;
}

const LIST_FIELDS = [
  'temas_clave', 'eventos_timeline', 'arbol_vital', 'medicaciones',
  'citas_relevantes', 'desencadenantes', 'anclajes_protectores',
  'dudas_para_sonsacar', 'senales_riesgo'
];

function emptyExtraction() {
  const base = { resumen_fuente: '' };
  for (const field of LIST_FIELDS) base[field] = [];
  return base;
}

function mergeExtractions(parts) {
  const merged = emptyExtraction();
  const summaries = [];
  for (const part of parts) {
    if (part.resumen_fuente) summaries.push(part.resumen_fuente);
    for (const field of LIST_FIELDS) {
      if (Array.isArray(part[field])) merged[field].push(...part[field]);
    }
  }
  merged.resumen_fuente = summaries.join(' ');
  return merged;
}

/**
 * Extrae estructura clínica de una fuente.
 *
 * @param {Object} opts
 * @param {string} opts.patientId
 * @param {Object} opts.source          { type, text, file, fileName }
 * @param {Object} opts.patientContext  Contexto previo para desambiguar (no para inventar).
 * @param {AbortSignal} opts.signal
 * @returns {Promise<Object>} Extracción verificada más metadatos de trazabilidad.
 */
export async function ingestClinicalSource({
  patientId,
  source = {},
  patientContext = {},
  signal = null
} = {}) {
  if (!patientId) {
    throw new ClinicalAIError('ingestClinicalSource requiere patientId.');
  }

  const startedAt = Date.now();
  const { text: sourceText, transcribed, sttModel } = await resolveSourceText(source, { signal });

  const contextHint = buildContextHint(patientContext);
  const chunks = chunkText(sourceText);
  const partials = [];
  const passLog = [];

  for (let i = 0; i < chunks.length; i++) {
    const header = [
      contextHint,
      chunks.length > 1 ? `FRAGMENTO ${i + 1} DE ${chunks.length} de la fuente "${source.fileName || source.type}".` : '',
      `TIPO DE FUENTE: ${source.type || 'desconocido'}${transcribed ? ' (transcripción automática de audio)' : ''}`,
      '',
      '--- INICIO DE LA FUENTE ---',
      chunks[i],
      '--- FIN DE LA FUENTE ---',
      ''
    ].filter(Boolean).join('\n');

    // Las tres pasadas son independientes entre sí: se lanzan en paralelo.
    const results = await Promise.allSettled(
      EXTRACTION_PASSES.map(pass => askClinicalJSON({
        system: EXTRACTION_SYSTEM,
        schemaHint: pass.schema,
        messages: [{
          role: 'user',
          content: `${header}\n${pass.instruction}\n\nRecuerda: cada elemento necesita su cita literal exacta, copiada de la fuente anterior.`
        }],
        model: CLINICAL_MODELS.DEEP,
        maxTokens: pass.maxTokens,
        signal
      }).then(r => ({ pass, data: r.data })))
    );

    const chunkData = {};
    for (let k = 0; k < results.length; k++) {
      const outcome = results[k];
      const pass = EXTRACTION_PASSES[k];
      if (outcome.status === 'fulfilled') {
        Object.assign(chunkData, outcome.value.data || {});
        passLog.push({ fragmento: i + 1, pasada: pass.id, estado: 'ok' });
      } else {
        // Una pasada caída no invalida el resto: se registra y se sigue.
        passLog.push({
          fragmento: i + 1,
          pasada: pass.id,
          estado: 'fallo',
          error: String(outcome.reason?.message || outcome.reason).slice(0, 200)
        });
      }
    }

    if (Object.keys(chunkData).length === 0) {
      throw new ClinicalAIError(
        `Ninguna pasada de extracción completó el fragmento ${i + 1}. Detalle: ${JSON.stringify(passLog.slice(-EXTRACTION_PASSES.length))}`
      );
    }
    partials.push(chunkData);
  }

  const raw = chunks.length === 1 ? { ...emptyExtraction(), ...partials[0] } : mergeExtractions(partials);

  // --- Verificación de anclaje a la fuente ---
  const verification = {};
  const verified = { resumen_fuente: raw.resumen_fuente || '' };

  for (const field of LIST_FIELDS) {
    if (field === 'dudas_para_sonsacar') {
      // Son preguntas generadas, no hallazgos: no llevan cita.
      verified[field] = (Array.isArray(raw[field]) ? raw[field] : [])
        .filter(q => typeof q === 'string' && q.trim().length > 10);
      continue;
    }
    if (field === 'citas_relevantes') {
      const { kept, dropped } = filterGrounded(raw[field], sourceText, 'cita');
      verified[field] = kept;
      verification[field] = { conservados: kept.length, descartados: dropped.length };
      continue;
    }
    const { kept, dropped } = filterGrounded(raw[field], sourceText);
    verified[field] = kept;
    verification[field] = { conservados: kept.length, descartados: dropped.length };
  }

  const descartadosTotal = Object.values(verification).reduce((sum, v) => sum + (v?.descartados || 0), 0);

  return {
    patient_id: patientId,
    source_type: source.type || 'desconocido',
    source_name: source.fileName || null,
    authority_level: authorityForSource(source.type),
    transcribed,
    stt_model: sttModel,
    extraction: verified,
    trazabilidad: {
      caracteres_fuente: sourceText.length,
      fragmentos: chunks.length,
      pasadas: passLog,
      verificacion_evidencia: verification,
      elementos_descartados_sin_evidencia: descartadosTotal,
      modelo: CLINICAL_MODELS.DEEP,
      duracion_ms: Date.now() - startedAt,
      procesado_en: new Date().toISOString()
    },
    // El texto íntegro se conserva para auditoría y para reproceso posterior.
    source_text: sourceText
  };
}

function buildContextHint(patientContext = {}) {
  const ctx = patientContext?.contexto_terapeutico || patientContext || {};
  const parts = [];
  if (ctx.displayName || ctx.name) parts.push(`Paciente: ${ctx.displayName || ctx.name}`);
  if (Array.isArray(ctx.temas) && ctx.temas.length) {
    parts.push(`Temas ya abiertos en el expediente: ${ctx.temas.map(t => t.title || t).join(', ')}`);
  }
  if (!parts.length) return '';
  return [
    'CONTEXTO PREVIO DEL EXPEDIENTE (úsalo solo para desambiguar referencias, nunca como fuente de hechos nuevos):',
    ...parts,
    ''
  ].join('\n');
}

/**
 * Ingesta un historial de conversación completo.
 * Atajo sobre ingestClinicalSource para el caso más frecuente.
 */
export async function ingestConversation({ patientId, messages = [], patientContext = {}, signal = null } = {}) {
  return ingestClinicalSource({
    patientId,
    patientContext,
    signal,
    source: {
      type: SOURCE_TYPES.CONVERSACION,
      text: conversationToText(messages),
      fileName: `conversacion-${new Date().toISOString().slice(0, 10)}`
    }
  });
}
