/**
 * @file continuousRecorderService.js
 * @description Grabadora de voz continua de Áncora ⚓.
 *
 * Acceso directo para que el paciente vuelque lo que le venga a la cabeza sin
 * pensar en la herramienta: graba, para cuando se queda en blanco, y sigue
 * cuando se acuerda de algo más. Todo eso es UNA sesión, no cinco audios sueltos.
 *
 * DECISIÓN CENTRAL: se conservan DOS textos, no uno.
 *
 *   1. `verbatim` — la transcripción literal, con sus titubeos y repeticiones.
 *   2. `nota` — la versión organizada por IA, que es la que se lee.
 *
 * Esto no es redundancia. El pipeline clínico solo admite hallazgos cuya cita
 * literal aparece en la fuente (ver `clinicalIngestionService.js`): si se
 * guardara únicamente el texto reescrito, la verificación de evidencia
 * quedaría comprobando citas contra una paráfrasis de la IA, y el control
 * antialucinación dejaría de valer. La extracción clínica corre SIEMPRE contra
 * el verbatim; la nota organizada es para el ojo humano.
 */

import { transcribeAudio } from './transcriptionService.js';
import { askClinicalJSON, CLINICAL_MODELS, ClinicalAIError } from './claudeService.js';

export const RECORDER_STATES = {
  IDLE: 'idle',
  RECORDING: 'grabando',
  PAUSED: 'en_pausa',
  STOPPED: 'detenida'
};

function pickMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return '';
}

/**
 * Grabadora continua con pausa y reanudación.
 *
 * Cada tramo entre pausas es un segmento independiente. Se mantienen separados
 * a propósito: permiten reconstruir cuándo se dijo cada cosa y reintentar la
 * transcripción de un tramo suelto sin repetir toda la sesión.
 *
 * @param {Object} opts
 * @param {Function} opts.onStateChange  Cambio de estado de la grabadora.
 * @param {Function} opts.onLevel        Nivel de señal (0-1) para el medidor visual.
 * @param {Function} opts.onTick         Segundos grabados, sin contar las pausas.
 * @param {number}   opts.maxTotalMs     Tope de seguridad de la sesión.
 */
export function createContinuousRecorder({
  onStateChange = null,
  onLevel = null,
  onTick = null,
  maxTotalMs = 90 * 60 * 1000
} = {}) {
  let stream = null;
  let recorder = null;
  let audioCtx = null;
  let rafId = null;
  let tickTimer = null;

  let state = RECORDER_STATES.IDLE;
  const segments = [];
  let currentChunks = [];
  let segmentStartedAt = null;
  let accumulatedMs = 0;

  function setState(next) {
    state = next;
    if (onStateChange) { try { onStateChange(next); } catch { /* la UI no corta la grabación */ } }
  }

  function elapsedMs() {
    const running = (state === RECORDER_STATES.RECORDING && segmentStartedAt)
      ? Date.now() - segmentStartedAt
      : 0;
    return accumulatedMs + running;
  }

  async function ensureStream() {
    if (stream) return;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new ClinicalAIError('Este navegador no permite grabar audio.');
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch (err) {
      throw new ClinicalAIError(
        err?.name === 'NotAllowedError'
          ? 'Permiso de micrófono denegado. Actívalo en el navegador para poder grabar.'
          : `No se pudo abrir el micrófono: ${err.message}`,
        { cause: err }
      );
    }
    startLevelMeter();
  }

  function startLevelMeter() {
    if (!onLevel || audioCtx) return;
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      audioCtx = new AudioCtor();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Float32Array(analyser.fftSize);

      const tick = () => {
        if (state === RECORDER_STATES.STOPPED) return;
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        // En pausa el medidor se queda a cero: la persona debe VER que no se graba.
        const rms = state === RECORDER_STATES.RECORDING ? Math.sqrt(sum / buf.length) : 0;
        try { onLevel(Math.min(1, rms * 8)); } catch { /* ignorar */ }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    } catch {
      // Sin medidor la grabación sigue siendo válida.
    }
  }

  function openSegment() {
    const mimeType = pickMimeType();
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    currentChunks = [];
    recorder.ondataavailable = e => { if (e.data?.size > 0) currentChunks.push(e.data); };
    recorder.start(500);
    segmentStartedAt = Date.now();
  }

  function closeSegment() {
    return new Promise(resolve => {
      if (!recorder || recorder.state === 'inactive') return resolve(null);
      recorder.onstop = () => {
        const durationMs = Date.now() - segmentStartedAt;
        accumulatedMs += durationMs;
        const blob = currentChunks.length
          ? new Blob(currentChunks, { type: recorder.mimeType || 'audio/webm' })
          : null;
        if (blob) {
          segments.push({
            index: segments.length,
            blob,
            durationMs,
            startedAt: new Date(segmentStartedAt).toISOString()
          });
        }
        currentChunks = [];
        segmentStartedAt = null;
        resolve(blob);
      };
      recorder.stop();
    });
  }

  function startTicker() {
    if (tickTimer || !onTick) return;
    tickTimer = setInterval(() => {
      try { onTick(Math.floor(elapsedMs() / 1000)); } catch { /* ignorar */ }
      if (elapsedMs() >= maxTotalMs && state === RECORDER_STATES.RECORDING) stop();
    }, 500);
  }

  async function start() {
    if (state === RECORDER_STATES.RECORDING) return;
    await ensureStream();
    openSegment();
    setState(RECORDER_STATES.RECORDING);
    startTicker();
  }

  /** Corta el tramo actual y deja el micrófono abierto para reanudar al instante. */
  async function pause() {
    if (state !== RECORDER_STATES.RECORDING) return;
    await closeSegment();
    setState(RECORDER_STATES.PAUSED);
  }

  async function resume() {
    if (state !== RECORDER_STATES.PAUSED) return;
    await ensureStream();
    openSegment();
    setState(RECORDER_STATES.RECORDING);
  }

  /** Cierra la sesión y devuelve todos los segmentos grabados. */
  async function stop() {
    if (state === RECORDER_STATES.STOPPED || state === RECORDER_STATES.IDLE) {
      return { segments: [...segments], totalMs: accumulatedMs };
    }
    if (state === RECORDER_STATES.RECORDING) await closeSegment();
    releaseHardware();
    setState(RECORDER_STATES.STOPPED);
    return { segments: [...segments], totalMs: accumulatedMs };
  }

  /** Descarta la sesión entera sin devolver nada. */
  function cancel() {
    releaseHardware();
    segments.length = 0;
    currentChunks = [];
    accumulatedMs = 0;
    setState(RECORDER_STATES.IDLE);
  }

  function releaseHardware() {
    clearInterval(tickTimer);
    tickTimer = null;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    audioCtx?.close?.().catch(() => {});
    audioCtx = null;
    if (recorder && recorder.state !== 'inactive') {
      try { recorder.stop(); } catch { /* ya detenido */ }
    }
    stream?.getTracks?.().forEach(t => t.stop());
    stream = null;
  }

  return {
    start,
    pause,
    resume,
    stop,
    cancel,
    get state() { return state; },
    get segmentCount() { return segments.length; },
    get elapsedSeconds() { return Math.floor(elapsedMs() / 1000); },
    get hasContent() { return segments.length > 0 || currentChunks.length > 0; }
  };
}

/**
 * Transcribe todos los segmentos de una sesión y los une.
 *
 * Los tramos van por separado a la transcripción: son más cortos, fallan menos
 * y un error en uno no tumba la sesión entera.
 *
 * @returns {Promise<{verbatim: string, porSegmento: Array, fallos: Array}>}
 */
export async function transcribeSession(segments = [], { signal = null, onProgress = null } = {}) {
  if (!segments.length) {
    throw new ClinicalAIError('No hay nada grabado que transcribir.');
  }

  const porSegmento = [];
  const fallos = [];

  for (let i = 0; i < segments.length; i++) {
    if (onProgress) { try { onProgress(i, segments.length); } catch { /* ignorar */ } }
    try {
      const { text } = await transcribeAudio({
        file: segments[i].blob,
        fileName: `tramo-${i + 1}.webm`,
        language: 'es',
        prompt: 'Grabación personal de un paciente en acompañamiento psicológico, en español.',
        signal
      });
      porSegmento.push({ index: i, text, startedAt: segments[i].startedAt, durationMs: segments[i].durationMs });
    } catch (err) {
      // Un tramo perdido no invalida el resto: se registra y se sigue.
      fallos.push({ index: i, error: String(err.message).slice(0, 200) });
    }
  }

  if (!porSegmento.length) {
    throw new ClinicalAIError(
      `No se pudo transcribir ningún tramo. Detalle: ${JSON.stringify(fallos).slice(0, 300)}`
    );
  }

  return {
    verbatim: porSegmento.map(s => s.text.trim()).filter(Boolean).join('\n\n'),
    porSegmento,
    fallos
  };
}

const NOTE_SYSTEM = `Ordenas grabaciones de voz de pacientes en acompañamiento psicológico.

Una persona ha hablado sola, sin guion, quizá en varias tandas separadas por pausas. El resultado es desordenado: frases a medias, repeticiones, "eh", rectificaciones, saltos de tema y vueltas atrás. Tu trabajo es convertirlo en algo legible SIN convertirlo en otra cosa.

QUÉ HACES:
- Quitas muletillas, titubeos, falsos comienzos y repeticiones que no aportan.
- Agrupas por temas lo que la persona contó de forma dispersa, aunque volviera al mismo asunto tres veces.
- Respetas el orden en que la persona lo vivió cuando ese orden importa.
- Conservas SUS palabras. Si dice "me hundo", no escribes "presenta ánimo bajo".

QUÉ NO HACES NUNCA:
- No añades nada que la persona no haya dicho. Ni un dato, ni un matiz, ni una conclusión.
- No interpretas ni explicas por qué le pasa lo que le pasa.
- No diagnosticas ni usas etiquetas clínicas. Nada de trastornos, ni como sospecha.
- No suavizas ni dramatizas. Si suena crudo, se queda crudo.
- No rellenas los huecos. Si algo queda a medias, se queda a medias y lo señalas.

Las citas literales que extraigas deben ser EXACTAS, copiadas carácter a carácter de la transcripción.`;

const NOTE_SCHEMA = `{
  "titulo": "string. Máximo 8 palabras, con las palabras de la persona si es posible.",
  "resumen": "string. 2-4 frases. De qué habló.",
  "texto_organizado": "string. La grabación reordenada y limpia, en párrafos, en primera persona y con el vocabulario de quien habla. Es lo que se lee.",
  "temas": [{ "tema": "string", "detalle": "string" }],
  "citas_literales": [{ "cita": "cita EXACTA de la transcripción", "por_que_importa": "string" }],
  "cabos_sueltos": ["string. Algo que la persona empezó a contar y dejó a medias, o que menciona sin desarrollar."],
  "estado_emocional_expresado": "string. Solo lo que la persona verbaliza sobre cómo se siente, con sus palabras. Vacío si no lo dice."
}`;

/**
 * Convierte la transcripción literal en una nota organizada y legible.
 *
 * El `verbatim` se devuelve intacto junto a la nota: es la fuente contra la que
 * el pipeline clínico verifica las citas, y sin él la extracción posterior no
 * podría distinguir lo que dijo el paciente de lo que redactó la IA.
 *
 * @param {Object} opts
 * @param {string} opts.verbatim         Transcripción literal de la sesión.
 * @param {Array}  opts.porSegmento      Tramos, para reflejar las pausas.
 * @param {Object} opts.patientContext   Solo para desambiguar referencias.
 * @returns {Promise<Object>} Nota organizada más el verbatim y su trazabilidad.
 */
export async function buildIntelligentNote({
  verbatim,
  porSegmento = [],
  patientContext = {},
  signal = null
} = {}) {
  const texto = String(verbatim || '').trim();
  if (!texto) {
    throw new ClinicalAIError('buildIntelligentNote requiere una transcripción.');
  }

  const ctx = patientContext?.contexto_terapeutico || patientContext || {};
  const nombre = ctx.displayName || ctx.name || '';

  const estructura = porSegmento.length > 1
    ? `La persona grabó en ${porSegmento.length} tandas separadas por pausas. Los tramos van separados por líneas en blanco: puede haber saltos de tema entre ellos, y también puede retomar algo de un tramo anterior.\n\n`
    : '';

  const { data, model, usage } = await askClinicalJSON({
    system: NOTE_SYSTEM,
    schemaHint: NOTE_SCHEMA,
    messages: [{
      role: 'user',
      content: `${nombre ? `Grabación de ${nombre}.\n` : ''}${estructura}--- TRANSCRIPCIÓN LITERAL ---\n${texto}\n--- FIN ---\n\nOrdénala siguiendo el esquema. Recuerda: las citas deben ser exactas y no puedes añadir nada que no esté arriba.`
    }],
    model: CLINICAL_MODELS.REPORT,
    maxTokens: 16384,
    signal
  });

  // Las citas se comprueban contra la transcripción real: si la IA "recuerda"
  // una frase que nadie dijo, se cae aquí y no llega al expediente.
  const normaliza = t => String(t || '').replace(/\s+/g, ' ').toLowerCase().trim();
  const fuente = normaliza(texto);
  const citas = Array.isArray(data?.citas_literales) ? data.citas_literales : [];
  const citasVerificadas = citas.filter(c => {
    const q = normaliza(c?.cita);
    if (q.length < 10) return false;
    if (fuente.includes(q)) return true;
    const palabras = q.split(' ').filter(w => w.length > 3);
    if (palabras.length < 4) return false;
    return palabras.filter(w => fuente.includes(w)).length / palabras.length >= 0.85;
  });

  return {
    nota: { ...data, citas_literales: citasVerificadas },
    // Fuente de verdad para la extracción clínica posterior.
    verbatim: texto,
    trazabilidad: {
      tramos: porSegmento.length,
      caracteres_verbatim: texto.length,
      citas_propuestas: citas.length,
      citas_descartadas_sin_respaldo: citas.length - citasVerificadas.length,
      modelo: model,
      uso_tokens: usage,
      generado_en: new Date().toISOString()
    }
  };
}

/**
 * Flujo completo: de los segmentos grabados a la nota lista para el chat.
 *
 * @returns {Promise<{nota: Object, verbatim: string, trazabilidad: Object, fallos: Array}>}
 */
export async function processRecordingSession({
  segments,
  patientContext = {},
  signal = null,
  onProgress = null
} = {}) {
  const { verbatim, porSegmento, fallos } = await transcribeSession(segments, { signal, onProgress });
  const resultado = await buildIntelligentNote({ verbatim, porSegmento, patientContext, signal });
  return { ...resultado, fallos, porSegmento };
}
