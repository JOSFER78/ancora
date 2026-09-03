/**
 * @file transcriptionService.js
 * @description Transcripción de voz a texto (STT) para Áncora ⚓.
 *
 * Claude no transcribe audio de forma nativa, así que el audio pasa primero
 * por el endpoint /v1/audio/transcriptions de OmniRoute (Whisper por defecto)
 * y solo el texto resultante entra en el flujo de análisis clínico.
 *
 * Cubre las dos entradas de audio de la plataforma:
 *   1. Adjuntos subidos al expediente de historia clínica.
 *   2. Notas de voz enviadas en el chat.
 */

import { AI_BASE_URL, AI_API_KEY, CLINICAL_MODELS, ClinicalAIError, askClinicalAI } from './claudeService.js';

/** Tamaño máximo aceptado por el endpoint de transcripción. */
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export const SUPPORTED_AUDIO_TYPES = [
  'audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp3', 'audio/mp4',
  'audio/m4a', 'audio/x-m4a', 'audio/wav', 'audio/x-wav', 'audio/flac'
];

/**
 * ¿Este fichero es audio transcribible?
 * @param {File|Blob} file
 */
export function isTranscribableAudio(file) {
  if (!file) return false;
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('audio/')) return true;
  const name = (file.name || '').toLowerCase();
  return /\.(webm|ogg|opus|mp3|mp4|m4a|wav|flac)$/.test(name);
}

/**
 * Transcribe un fichero de audio a texto.
 *
 * @param {Object} opts
 * @param {File|Blob} opts.file       Audio a transcribir.
 * @param {string}    opts.fileName   Nombre con extensión (necesario para Blob de MediaRecorder).
 * @param {string}    opts.language   Código ISO-639-1. 'es' por defecto.
 * @param {string}    opts.prompt     Pista de contexto para mejorar términos clínicos.
 * @param {string}    opts.model      Modelo STT. Por defecto CLINICAL_MODELS.STT.
 * @param {AbortSignal} opts.signal
 * @param {number}    opts.timeoutMs
 * @returns {Promise<{text: string, model: string, durationMs: number}>}
 */
export async function transcribeAudio({
  file,
  fileName = '',
  language = 'es',
  prompt = '',
  model = CLINICAL_MODELS.STT,
  signal = null,
  timeoutMs = 300000
} = {}) {
  if (!file) {
    throw new ClinicalAIError('transcribeAudio requiere un fichero de audio.');
  }
  if (typeof file.size === 'number' && file.size > MAX_AUDIO_BYTES) {
    throw new ClinicalAIError(
      `El audio pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el límite es ${MAX_AUDIO_BYTES / 1024 / 1024} MB. Divide la grabación en tramos.`
    );
  }

  // MediaRecorder produce Blob sin nombre: el endpoint necesita una extensión
  // coherente para elegir el decodificador.
  const name = fileName || file.name || inferAudioName(file.type);

  const form = new FormData();
  form.append('file', file, name);
  form.append('model', model);
  if (language) form.append('language', language);
  if (prompt) form.append('prompt', prompt);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const startedAt = Date.now();
  try {
    const headers = {};
    if (AI_API_KEY) headers.Authorization = `Bearer ${AI_API_KEY}`;

    const response = await fetch(`${AI_BASE_URL}/audio/transcriptions`, {
      method: 'POST',
      headers, // sin Content-Type: el navegador fija el boundary del multipart
      body: form,
      signal: controller.signal
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new ClinicalAIError(
        `Transcripción fallida (${response.status}): ${detail.slice(0, 300)}`,
        { status: response.status, model }
      );
    }

    const payload = await response.json();
    const text = (payload?.text || '').trim();
    if (!text) {
      throw new ClinicalAIError('La transcripción devolvió texto vacío. Revisa que el audio tenga voz audible.', { model });
    }

    return { text, model, durationMs: Date.now() - startedAt };
  } finally {
    clearTimeout(timer);
  }
}

function inferAudioName(mimeType = '') {
  const map = {
    'audio/webm': 'nota-voz.webm',
    'audio/ogg': 'nota-voz.ogg',
    'audio/mpeg': 'nota-voz.mp3',
    'audio/mp4': 'nota-voz.mp4',
    'audio/m4a': 'nota-voz.m4a',
    'audio/x-m4a': 'nota-voz.m4a',
    'audio/wav': 'nota-voz.wav',
    'audio/x-wav': 'nota-voz.wav',
    'audio/flac': 'nota-voz.flac'
  };
  return map[(mimeType || '').toLowerCase()] || 'nota-voz.webm';
}

/** Formatos de imagen que el modelo de visión acepta. */
export const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

/** Una imagen grande en base64 dispara el límite de la petición. */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** ¿Este fichero es una imagen que se puede leer con visión? */
export function isReadableImage(file) {
  if (!file) return false;
  const type = (file.type || '').toLowerCase();
  if (SUPPORTED_IMAGE_TYPES.includes(type)) return true;
  return /\.(png|jpe?g|webp|gif)$/i.test(file.name || '');
}

/**
 * Lee el texto de una imagen (foto de un informe, receta, alta hospitalaria).
 *
 * Verificado contra el endpoint real: `claude/claude-opus-5` acepta mensajes
 * con `image_url` en formato data URI y devuelve la transcripción literal.
 * El router no lo documenta, pero lo sirve.
 *
 * Se pide transcripción LITERAL, no resumen: el texto resultante es la fuente
 * contra la que después se verifican las citas de la extracción clínica. Si
 * aquí se resumiera, la verificación de evidencia perdería su sentido.
 *
 * @param {Object} opts
 * @param {File|Blob} opts.file
 * @param {string} [opts.fileName]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{text: string, model: string, durationMs: number}>}
 */
export async function transcribeImage({ file, fileName = '', signal = null } = {}) {
  if (!file) throw new ClinicalAIError('transcribeImage necesita un fichero de imagen.');
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ClinicalAIError(
      `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB y el límite es ${MAX_IMAGE_BYTES / 1024 / 1024} MB.`
    );
  }

  const startedAt = Date.now();
  const buffer = await file.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
  const mime = SUPPORTED_IMAGE_TYPES.includes((file.type || '').toLowerCase())
    ? file.type.toLowerCase()
    : 'image/png';

  const { content, model } = await askClinicalAI({
    system: 'Transcribes documentos clínicos fotografiados o escaneados. Devuelves el texto tal cual aparece, respetando el orden y los datos numéricos. No resumes, no interpretas y no añades nada que no esté escrito. Si una parte es ilegible, escribes [ilegible] en su lugar.',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: `Transcribe literalmente todo el texto de este documento${fileName ? ` (${fileName})` : ''}.` },
        { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } }
      ]
    }],
    model: CLINICAL_MODELS.DEEP,
    temperature: 0,
    maxTokens: 4096,
    signal
  });

  const text = String(content || '').trim();
  if (!text) {
    throw new ClinicalAIError('No se ha podido leer texto en la imagen.', { model });
  }
  return { text, model, durationMs: Date.now() - startedAt };
}
