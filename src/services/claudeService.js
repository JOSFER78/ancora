/**
 * @file claudeService.js
 * @description Cliente de IA clínica de Áncora ⚓ contra el router OmniRoute.
 *
 * Todas las llamadas de análisis clínico de la plataforma pasan por aquí.
 * El proveedor concreto (Claude vía OAuth de Claude Code, o una API key de
 * Anthropic) se resuelve dentro de OmniRoute: Áncora solo habla el dialecto
 * OpenAI-compatible, de modo que cambiar de backend no toca este archivo.
 *
 * Configuración por entorno (ver .env.example):
 *   VITE_OMNIROUTE_URL      Base del endpoint OpenAI-compatible
 *   VITE_OMNIROUTE_API_KEY  Clave de protección del endpoint
 *   VITE_AI_MODEL_DEEP      Modelo de extracción estructurada
 *   VITE_AI_MODEL_REPORT    Modelo de síntesis e informes
 *   VITE_AI_MODEL_CHAT      Modelo de acompañamiento de baja latencia
 *   VITE_AI_MODEL_STT       Modelo de transcripción de voz a texto
 */

function readEnv(key, fallback = '') {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
}

export const AI_BASE_URL = readEnv(
  'VITE_OMNIROUTE_URL',
  'https://143-47-35-167.sslip.io/pro/omniroute/v1'
).replace(/\/+$/, '');

export const AI_API_KEY = readEnv('VITE_OMNIROUTE_API_KEY', '');

/**
 * Modelos por tarea clínica. Se resuelven en OmniRoute.
 */
export const CLINICAL_MODELS = {
  /** Extracción estructurada de documentos y transcripciones. Máxima fidelidad. */
  DEEP: readEnv('VITE_AI_MODEL_DEEP', 'claude/claude-opus-5'),
  /** Informes periódicos, notas SOAP y síntesis para el psicólogo. */
  REPORT: readEnv('VITE_AI_MODEL_REPORT', 'claude/claude-sonnet-5'),
  /** Acompañamiento conversacional con el paciente. Baja latencia. */
  CHAT: readEnv('VITE_AI_MODEL_CHAT', 'claude/claude-haiku-4-5-20251001'),
  /**
   * Transcripción de audio. Comparado sobre el mismo audio en castellano: turbo transcribio la frase
   * intacta, mientras que whisper-large-v3 se comio la apertura ("Y hubo
   * senanas" en vez de "Llevo semanas"). Ademas es mas rapido.
   */
  STT: readEnv('VITE_AI_MODEL_STT', 'groq/whisper-large-v3-turbo')
};

/** Cadena de reserva si el modelo preferente falla o está saturado. */
const FALLBACK_CHAIN = {
  [CLINICAL_MODELS.DEEP]: [CLINICAL_MODELS.REPORT, 'claude/claude-opus-4-6'],
  [CLINICAL_MODELS.REPORT]: ['claude/claude-sonnet-4-6', CLINICAL_MODELS.CHAT],
  [CLINICAL_MODELS.CHAT]: ['claude/claude-sonnet-4-6']
};

export class ClinicalAIError extends Error {
  constructor(message, { status = 0, model = '', code = '', cause = null } = {}) {
    super(message);
    this.name = 'ClinicalAIError';
    this.status = status;
    this.model = model;
    /** 'truncated' | 'empty' | 'http' | '' — permite decidir si reintentar. */
    this.code = code;
    this.cause = cause;
  }
}

function authHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (AI_API_KEY) {
    headers.Authorization = `Bearer ${AI_API_KEY}`;
  }
  return headers;
}

/**
 * Combina la señal externa con un temporizador propio para que ninguna
 * petición clínica quede colgada indefinidamente en el navegador.
 */
function withTimeout(signal, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return { signal: controller.signal, done: () => clearTimeout(timer) };
}

/**
 * Todas las llamadas van en streaming.
 *
 * No es una preferencia de UX: delante de OmniRoute hay una pasarela con un
 * tope de ~120 s por petición. Una generación clínica larga en modo bloqueante
 * devuelve 504 sin producir nada. En streaming el primer byte llega en menos
 * de un segundo y la conexión se mantiene viva mientras el modelo escribe.
 */
async function postCompletion(model, body, { signal, timeoutMs, onToken }) {
  const { signal: reqSignal, done } = withTimeout(signal, timeoutMs);
  try {
    const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ ...body, model, stream: true }),
      signal: reqSignal
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new ClinicalAIError(
        `OmniRoute respondió ${response.status} para el modelo ${model}: ${detail.slice(0, 300)}`,
        { status: response.status, model }
      );
    }
    if (!response.body) {
      throw new ClinicalAIError(`Respuesta sin cuerpo del modelo ${model}.`, { model });
    }

    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let buffer = '';
    let content = '';
    let usage = null;
    let finishReason = null;
    let resolvedModel = model;

    for (;;) {
      const { done: finished, value } = await reader.read();
      if (finished) break;
      buffer += decoder.decode(value, { stream: true });

      // Los eventos SSE se separan por salto de línea; el último trozo del
      // buffer puede estar incompleto, así que se conserva para la vuelta siguiente.
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const data = trimmed.slice(5).trim();
        if (data === '' || data === '[DONE]') continue;

        let event;
        try {
          event = JSON.parse(data);
        } catch {
          continue; // fragmento no parseable: se ignora sin abortar el flujo
        }

        const choice = event?.choices?.[0];
        const delta = choice?.delta?.content;
        if (typeof delta === 'string' && delta !== '') {
          content += delta;
          if (onToken) {
            try { onToken(delta); } catch { /* un fallo de UI no debe cortar la ingesta */ }
          }
        }
        if (choice?.finish_reason) finishReason = choice.finish_reason;
        if (event?.usage) usage = event.usage;
        if (event?.model) resolvedModel = event.model;
      }
    }

    if (content.trim() === '') {
      throw new ClinicalAIError(`Respuesta vacía del modelo ${model}.`, { model });
    }

    // Un corte por límite de tokens deja JSON incompleto: hay que saberlo
    // arriba para poder trocear la tarea, no descubrirlo al parsear.
    if (finishReason === 'length') {
      throw new ClinicalAIError(
        `El modelo ${model} agotó max_tokens antes de terminar. Reduce el tamaño de la tarea o sube max_tokens.`,
        { model, code: 'truncated' }
      );
    }

    return { content, model: resolvedModel, usage, finishReason };
  } finally {
    done();
  }
}

/**
 * Llamada base al motor clínico, con reintento y cadena de reserva.
 *
 * @param {Object}   opts
 * @param {string}   opts.system        Prompt de sistema (rol clínico).
 * @param {Array}    opts.messages      Mensajes en formato OpenAI.
 * @param {string}   opts.model         Modelo preferente.
 * @param {number}   opts.temperature
 * @param {number}   opts.maxTokens
 * @param {AbortSignal} opts.signal
 * @param {number}   opts.timeoutMs
 * @returns {Promise<{content: string, model: string, usage: Object|null}>}
 */
export async function askClinicalAI({
  system = '',
  messages = [],
  model = CLINICAL_MODELS.REPORT,
  temperature = 0.3,
  maxTokens = 4096,
  signal = null,
  timeoutMs = 300000,
  onToken = null
} = {}) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new ClinicalAIError('askClinicalAI requiere al menos un mensaje.');
  }

  const payload = {
    messages: system ? [{ role: 'system', content: system }, ...messages] : messages,
    temperature,
    max_tokens: maxTokens
  };

  const chain = [model, ...(FALLBACK_CHAIN[model] || [])];
  let lastError = null;

  for (const candidate of chain) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await postCompletion(candidate, payload, { signal, timeoutMs, onToken });
      } catch (err) {
        lastError = err;
        // Un abort deliberado del usuario no debe degradar a otro modelo.
        if (err?.name === 'AbortError' && signal?.aborted) throw err;
        // Truncado por max_tokens: reintentar daría el mismo resultado.
        // Debe subir a quien orquesta para que trocee la tarea.
        if (err instanceof ClinicalAIError && err.code === 'truncated') throw err;
        // 4xx distinto de 429 es un error de petición: cambiar de modelo no ayuda.
        if (err instanceof ClinicalAIError && err.status >= 400 && err.status < 500 && err.status !== 429) {
          break;
        }
        if (attempt === 0) {
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }
    }
  }

  throw new ClinicalAIError(
    `No se pudo completar la petición clínica tras probar ${chain.length} modelo(s). Último error: ${lastError?.message || 'desconocido'}`,
    { model, cause: lastError }
  );
}

/**
 * Extrae el primer objeto o array JSON de una respuesta del modelo.
 * Tolera vallas markdown y texto de cortesía alrededor del JSON.
 *
 * @param {string} raw
 * @returns {Object|Array}
 */
export function parseModelJSON(raw) {
  if (typeof raw !== 'string') {
    throw new ClinicalAIError('parseModelJSON esperaba una cadena.');
  }

  let text = raw.trim();

  // Vallas markdown: ```json ... ``` o ``` ... ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) text = fenced[1].trim();

  try {
    return JSON.parse(text);
  } catch {
    // Reintento: recortar al primer bloque equilibrado { } o [ ]
    const start = text.search(/[{[]/);
    if (start !== -1) {
      const open = text[start];
      const close = open === '{' ? '}' : ']';
      let depth = 0;
      let inString = false;
      let escaped = false;

      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { escaped = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === open) depth++;
        else if (ch === close) {
          depth--;
          if (depth === 0) {
            try {
              return JSON.parse(text.slice(start, i + 1));
            } catch (err) {
              throw new ClinicalAIError(
                `El modelo devolvió un JSON no parseable: ${String(err.message).slice(0, 200)}`,
                { cause: err }
              );
            }
          }
        }
      }
    }
    throw new ClinicalAIError(
      `La respuesta del modelo no contiene JSON válido. Recibido: ${text.slice(0, 200)}`
    );
  }
}

/**
 * Llamada que exige salida JSON estricta.
 *
 * @param {Object} opts  Igual que askClinicalAI, más:
 * @param {string} opts.schemaHint  Descripción del esquema esperado.
 * @returns {Promise<{data: Object|Array, model: string, usage: Object|null}>}
 */
export async function askClinicalJSON({ system = '', schemaHint = '', ...opts } = {}) {
  const strictSystem = [
    system,
    'FORMATO DE SALIDA OBLIGATORIO: responde EXCLUSIVAMENTE con un único objeto JSON válido.',
    'No añadas explicaciones, comentarios, texto introductorio ni vallas de código markdown.',
    schemaHint ? `Esquema exigido:\n${schemaHint}` : ''
  ].filter(Boolean).join('\n\n');

  const result = await askClinicalAI({
    ...opts,
    system: strictSystem,
    temperature: opts.temperature ?? 0.1
  });

  return {
    data: parseModelJSON(result.content),
    model: result.model,
    usage: result.usage
  };
}

/**
 * Comprueba que el endpoint responde y que la clave configurada es válida.
 * Pensado para un botón de diagnóstico en Ajustes, no para el arranque.
 *
 * @returns {Promise<{ok: boolean, model?: string, latencyMs?: number, error?: string}>}
 */
export async function checkAIEndpoint({ signal = null } = {}) {
  const startedAt = Date.now();
  try {
    const result = await askClinicalAI({
      messages: [{ role: 'user', content: 'Responde únicamente con la palabra PONG.' }],
      model: CLINICAL_MODELS.CHAT,
      maxTokens: 16,
      timeoutMs: 30000,
      signal
    });
    return { ok: true, model: result.model, latencyMs: Date.now() - startedAt };
  } catch (err) {
    return { ok: false, error: err.message, latencyMs: Date.now() - startedAt };
  }
}
