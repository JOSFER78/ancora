/**
 * @file voiceChatService.js
 * @description Conversación por voz para el chat de acompañamiento de Áncora ⚓.
 *
 * Bucle: micrófono -> Whisper (STT) -> Claude -> Deepgram Aura-2 en castellano.
 *
 * DECISIONES TOMADAS CONTRA MEDICIONES REALES, no por catálogo:
 *
 * 1. TTS. Deepgram tiene 17 voces en español, seis de ellas peninsulares. El
 *    router no las lista en /v1/models, pero las sirve si se pasa el
 *    identificador. Verificado con ida y vuelta: se sintetizó "Hola, soy
 *    Áncora. ¿Cómo te encuentras hoy?" con aura-2-silvia-es y Whisper lo
 *    transcribió de vuelta idéntico, tilde incluida. Con la voz inglesa el
 *    mismo texto volvía como "Sanusoi Ankora, Kamo T&Q Interest High".
 *
 * 2. Troceado por frases. Sintetizar un párrafo entero cuesta ~3,7 s de
 *    silencio antes de la primera palabra, que rompe la conversación. Por
 *    frases: 1,4 s hasta empezar a hablar y 3,1 s de audio, tiempo de sobra
 *    para preparar la siguiente sin cortes.
 *
 * 3. STT. Se usa groq/whisper-large-v3-turbo. Nota rectificada: el
 *    {"noSpeechDetected":true} que devolvia deepgram/nova-3 era un problema
 *    del formato del audio de prueba, no del modelo; reencodeado a 16 kHz
 *    mono transcribe bien, y en castellano acierta el contenido entero.
 *    Turbo gana por precision en la apertura de frase y por velocidad, pero
 *    nova-3 sigue siendo la via para transcripcion en directo, que es lo
 *    unico que Whisper por lotes no puede dar.
 *
 * 4. El sintetizador del navegador queda solo como reserva si falla la red.
 */

import { transcribeAudio } from './transcriptionService.js';
import { askClinicalAI, CLINICAL_MODELS, ClinicalAIError, AI_BASE_URL, AI_API_KEY } from './claudeService.js';

/**
 * Capacidades de voz del navegador actual.
 * La sintesis principal es de red, asi que solo el microfono es imprescindible;
 * `hasLocalTTS` indica si existe la reserva local.
 */
export function getVoiceCapabilities() {
  const hasMic = typeof navigator !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia
    && typeof MediaRecorder !== 'undefined';
  const hasLocalTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
  return { hasMic, hasLocalTTS, full: hasMic };
}

/** Formato de grabación soportado por el navegador actual. */
function pickMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
  for (const type of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported?.(type)) return type;
  }
  return '';
}

/**
 * Grabadora de nota de voz con detección de silencio.
 *
 * Corta sola tras `silenceMs` de silencio para que el paciente no tenga que
 * pulsar nada al terminar de hablar, que es lo que rompe la sensación de
 * conversación.
 */
export function createVoiceRecorder({
  silenceMs = 1800,
  silenceThreshold = 0.012,
  maxDurationMs = 120000,
  onLevel = null,
  onSilenceStop = null
} = {}) {
  let stream = null;
  let recorder = null;
  let chunks = [];
  let audioCtx = null;
  let rafId = null;
  let silenceSince = null;
  let maxTimer = null;
  let stopped = false;

  async function start() {
    const caps = getVoiceCapabilities();
    if (!caps.hasMic) {
      throw new ClinicalAIError('Este navegador no permite grabar audio (falta getUserMedia o MediaRecorder).');
    }

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch (err) {
      throw new ClinicalAIError(
        err?.name === 'NotAllowedError'
          ? 'Permiso de micrófono denegado. Actívalo en el navegador para usar el chat de voz.'
          : `No se pudo abrir el micrófono: ${err.message}`,
        { cause: err }
      );
    }

    const mimeType = pickMimeType();
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunks = [];
    recorder.ondataavailable = e => { if (e.data?.size > 0) chunks.push(e.data); };
    recorder.start(250);

    maxTimer = setTimeout(() => { if (!stopped) stop(); }, maxDurationMs);
    monitorLevel();
  }

  function monitorLevel() {
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return;
      audioCtx = new AudioCtor();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      audioCtx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Float32Array(analyser.fftSize);

      const tick = () => {
        if (stopped) return;
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        if (onLevel) { try { onLevel(rms); } catch { /* la UI no corta la grabación */ } }

        const now = Date.now();
        if (rms < silenceThreshold) {
          if (silenceSince === null) silenceSince = now;
          else if (now - silenceSince > silenceMs && chunks.length > 2) {
            if (onSilenceStop) { try { onSilenceStop(); } catch { /* ignorar */ } }
            stop();
            return;
          }
        } else {
          silenceSince = null;
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    } catch {
      // Sin medidor de nivel la grabación sigue siendo válida: solo se pierde
      // el corte automático por silencio.
    }
  }

  /** Detiene y devuelve el audio grabado. */
  function stop() {
    return new Promise(resolve => {
      if (stopped) return resolve(null);
      stopped = true;
      clearTimeout(maxTimer);
      if (rafId) cancelAnimationFrame(rafId);
      audioCtx?.close?.().catch(() => {});

      const finish = () => {
        stream?.getTracks?.().forEach(t => t.stop());
        const type = recorder?.mimeType || 'audio/webm';
        resolve(chunks.length ? new Blob(chunks, { type }) : null);
      };

      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = finish;
        recorder.stop();
      } else {
        finish();
      }
    });
  }

  function cancel() {
    stopped = true;
    clearTimeout(maxTimer);
    if (rafId) cancelAnimationFrame(rafId);
    audioCtx?.close?.().catch(() => {});
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    stream?.getTracks?.().forEach(t => t.stop());
    chunks = [];
  }

  return { start, stop, cancel, get isRecording() { return !stopped; } };
}

/**
 * Voces castellanas de Deepgram Aura-2, servidas a traves del router.
 *
 * El router no las lista en /v1/models, pero las sirve igualmente: se paso
 * el identificador y devolvio audio correcto. Verificado con ida y vuelta:
 * se sintetizo "Hola, soy Ancora. Como te encuentras hoy?" y Whisper lo
 * transcribio de vuelta palabra por palabra, tilde incluida. La voz inglesa
 * devolvia "Sanusoi Ankora, Kamo T&Q Interest High".
 */
export const SPANISH_VOICES = {
  silvia:   { model: 'deepgram/aura-2-silvia-es',   label: 'Silvia — calida y natural' },
  alvaro:   { model: 'deepgram/aura-2-alvaro-es',   label: 'Alvaro — calmado y cercano' },
  nestor:   { model: 'deepgram/aura-2-nestor-es',   label: 'Nestor — sereno y profesional' },
  diana:    { model: 'deepgram/aura-2-diana-es',    label: 'Diana — expresiva y clara' },
  agustina: { model: 'deepgram/aura-2-agustina-es', label: 'Agustina — clara y expresiva' },
  carina:   { model: 'deepgram/aura-2-carina-es',   label: 'Carina — energica' }
};

/** Voz por defecto: la que mejor encaja con un acompanamiento terapeutico. */
export const DEFAULT_VOICE = 'silvia';

/**
 * Limpia el texto antes de leerlo en alto.
 *
 * Sin esto la voz pronuncia "asterisco asterisco" en mitad de una frase y lee
 * URLs enteras. Es imprescindible, no cosmetico.
 */
export function cleanTextForSpeech(input) {
  if (!input) return '';
  let text = String(input);

  // Emojis y simbolos graficos. Los selectores de variacion van aparte: si se
  // meten en la misma clase junto a los emoji, forman caracteres combinados y
  // la clase deja de significar lo que parece.
  text = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '');
  text = text.replace(/\u{FE0F}|\u{FE0E}|\u{20E3}/gu, '');

  // Bloques de codigo: se anuncian, no se leen
  text = text.replace(/```[a-zA-Z0-9_+-]*\n([\s\S]*?)```/g,
    (_, c) => `, bloque de codigo de ${c.trim().split('\n').length} lineas, `);
  text = text.replace(/`([^`]+)`/g, '$1');
  // Enlaces: se lee el texto, no la direccion. Va ANTES que los emoticonos
  // porque el patron de emoticonos incluye ':' seguido de '/' y destrozaria
  // el '://' de cualquier URL.
  text = text.replace(/\[([^\]]+)\]\((?:https?:\/\/)[^\s)]+\)/g, '$1');
  text = text.replace(/https?:\/\/\S+/gi, 'un enlace');
  text = text.replace(/\b[\w.-]+\.(?:com|es|org|net|io)\/\S*/gi, 'un enlace');

  // Emoticonos ASCII, ya sin riesgo para las URLs
  text = text.replace(/[:;]-?[)(pPdDoO\\|]|xD|XD|\^\^|<3/g, '');
  // Marcas de markdown
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/[*_~]{1,3}([^*_~]+)[*_~]{1,3}/g, '$1');
  text = text.replace(/^>\s?/gm, '');
  text = text.replace(/^[-*_]{3,}\s*$/gm, '. ');
  // Simbolos que la voz leeria mal
  text = text.replace(/(\d+)\s*%/g, '$1 por ciento');
  text = text.replace(/(\d+)\s*€/g, '$1 euros').replace(/€\s*(\d+)/g, '$1 euros');

  // Al quitar emojis y marcas quedan espacios sueltos delante de la puntuacion
  return text
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?…])/g, '$1')
    .trim();
}

/**
 * Trocea en frases para poder empezar a hablar antes.
 *
 * Medido contra el endpoint real: una frase de 38 caracteres tarda 1,4 s en
 * sintetizarse y produce 3,1 s de audio. Mientras suena da tiempo de sobra a
 * preparar la siguiente, asi que la reproduccion sale continua. Sintetizar el
 * parrafo entero de golpe costaba 3,7 s de silencio inicial.
 */
export function splitIntoSentences(text, maxChars = 220, firstChunkChars = 90) {
  const parts = [];
  const raw = text.split(/(?<=[.!?…])\s+|(?<=\n)/).filter(Boolean);
  let buffer = '';
  for (const piece of raw) {
    // El primer fragmento se corta antes a proposito: lo que importa es cuanto
    // tarda en sonar la primera palabra. Medido: 38 caracteres tardan 1,4 s y
    // 220 se van a 2,5 s. Los siguientes se agrupan porque ya suena audio
    // mientras se preparan.
    const limite = parts.length === 0 ? firstChunkChars : maxChars;
    if ((buffer + piece).length > limite && buffer) {
      parts.push(buffer.trim());
      buffer = piece;
    } else {
      // El separador se consume al partir: hay que reponerlo o las frases
      // se pegan ("duro .Mira esto").
      buffer = buffer ? `${buffer.trimEnd()} ${piece}` : piece;
    }
  }
  if (buffer.trim()) parts.push(buffer.trim());
  return parts.filter(p => p.length > 0);
}

/** Sintetiza un fragmento y devuelve el audio. */
async function synthesizeChunk(text, voiceKey, signal) {
  const voice = SPANISH_VOICES[voiceKey] || SPANISH_VOICES[DEFAULT_VOICE];
  const headers = { 'Content-Type': 'application/json' };
  if (AI_API_KEY) headers.Authorization = `Bearer ${AI_API_KEY}`;

  const response = await fetch(`${AI_BASE_URL}/audio/speech`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: voice.model,
      input: text,
      voice: voice.model.replace('deepgram/aura-2-', '').replace('-es', '')
    }),
    signal
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new ClinicalAIError(
      `Sintesis de voz fallida (${response.status}): ${detail.slice(0, 200)}`,
      { status: response.status, model: voice.model }
    );
  }
  return response.blob();
}

let activeAudio = null;

/**
 * Lee un texto en voz alta con voz castellana.
 *
 * Sintetiza y reproduce por frases con una de adelanto, de modo que la
 * siguiente esta lista antes de que termine la anterior.
 *
 * @returns {Promise<void>} Se resuelve cuando termina de hablar.
 */
export async function speak(text, { voiceName = DEFAULT_VOICE, signal = null, onChunk = null } = {}) {
  const clean = cleanTextForSpeech(text);
  if (!clean) return;

  const chunks = splitIntoSentences(clean);
  if (!chunks.length) return;

  stopSpeaking();
  let aborted = false;
  const onAbort = () => { aborted = true; stopSpeaking(); };
  if (signal) {
    if (signal.aborted) return;
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    // Se lanza la primera y se va pidiendo la siguiente mientras suena la actual.
    let pending = synthesizeChunk(chunks[0], voiceName, signal);

    for (let i = 0; i < chunks.length; i++) {
      if (aborted) return;
      let blob;
      try {
        blob = await pending;
      } catch (err) {
        // Si falla la voz de red, el texto ya esta en pantalla: se degrada al
        // sintetizador del navegador en vez de dejar al paciente sin respuesta.
        speakWithBrowser(chunks.slice(i).join(' '));
        throw err;
      }

      if (i + 1 < chunks.length && !aborted) {
        pending = synthesizeChunk(chunks[i + 1], voiceName, signal);
      }

      if (aborted) return;
      if (onChunk) { try { onChunk(chunks[i], i, chunks.length); } catch { /* la UI no corta la voz */ } }
      await playBlob(blob);
    }
  } finally {
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

function playBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    activeAudio = audio;
    const cleanup = () => { URL.revokeObjectURL(url); if (activeAudio === audio) activeAudio = null; };
    audio.onended = () => { cleanup(); resolve(); };
    audio.onerror = () => { cleanup(); reject(new ClinicalAIError('No se pudo reproducir el audio.')); };
    audio.play().catch(err => {
      cleanup();
      // Los navegadores bloquean la reproduccion sin interaccion previa del
      // usuario: no es un fallo del servicio y no debe romper el turno.
      if (err?.name === 'NotAllowedError') resolve();
      else reject(err);
    });
  });
}

/** Reserva local: sintetizador del navegador, por si falla la voz de red. */
function speakWithBrowser(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    utter.voice = voices.find(v => v.lang === 'es-ES') || voices.find(v => v.lang?.startsWith('es')) || null;
    utter.lang = utter.voice?.lang || 'es-ES';
    window.speechSynthesis.speak(utter);
  } catch { /* si tampoco hay voz local, queda el texto en pantalla */ }
}

export function stopSpeaking() {
  if (activeAudio) {
    try { activeAudio.pause(); } catch { /* ya detenido */ }
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}


/**
 * Un turno completo de conversación por voz.
 *
 * audio del paciente -> transcripción -> respuesta de Claude -> voz.
 *
 * @param {Object} opts
 * @param {Blob}   opts.audioBlob      Audio grabado con createVoiceRecorder.
 * @param {Array}  opts.history        Historial [{role, content}] de la conversación.
 * @param {string} opts.systemPrompt   Encuadre terapéutico del acompañamiento.
 * @param {boolean} opts.autoSpeak     Reproducir la respuesta al terminar.
 * @param {Function} opts.onTranscript Se llama con la transcripción del paciente.
 * @param {Function} opts.onToken      Streaming de la respuesta para la UI.
 * @returns {Promise<{transcript: string, reply: string, model: string, timings: Object}>}
 */
export async function runVoiceTurn({
  audioBlob,
  history = [],
  systemPrompt = '',
  autoSpeak = true,
  voiceName = DEFAULT_VOICE,
  onTranscript = null,
  onToken = null,
  signal = null
} = {}) {
  if (!audioBlob || audioBlob.size === 0) {
    throw new ClinicalAIError('No se ha grabado audio. Mantén pulsado para hablar.');
  }

  const t0 = Date.now();
  const { text: transcript } = await transcribeAudio({
    file: audioBlob,
    fileName: 'nota-voz.webm',
    language: 'es',
    prompt: 'Conversación de acompañamiento psicológico en español.',
    signal
  });
  const tSTT = Date.now() - t0;
  if (onTranscript) { try { onTranscript(transcript); } catch { /* ignorar */ } }

  const t1 = Date.now();
  const { content: reply, model } = await askClinicalAI({
    system: systemPrompt,
    messages: [...history, { role: 'user', content: transcript }],
    // El chat de voz prioriza latencia: una pausa larga rompe la conversación.
    model: CLINICAL_MODELS.CHAT,
    temperature: 0.7,
    // Respuestas breves: en voz, un párrafo largo se hace insoportable.
    maxTokens: 700,
    onToken,
    signal
  });
  const tLLM = Date.now() - t1;

  let tTTS = 0;
  if (autoSpeak) {
    const t2 = Date.now();
    try {
      await speak(reply, { voiceName, signal });
    } catch {
      // Si la voz falla, el texto ya está en pantalla: no se pierde el turno.
    }
    tTTS = Date.now() - t2;
  }

  return {
    transcript,
    reply,
    model,
    timings: { sttMs: tSTT, llmMs: tLLM, ttsMs: tTTS, totalMs: Date.now() - t0 }
  };
}
