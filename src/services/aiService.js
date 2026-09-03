/**
 * @file aiService.js
 * @deprecated MOTOR ANTIGUO — no usar para nada nuevo.
 *
 * Apuntaba al gateway FreeLLMAPI con modelos (`gemini-3.5-flash-lite`,
 * `compound-mini`, `auto`…) que **no existen en el router actual**: llamarlo
 * hoy devuelve 404. Todas las llamadas de IA de la plataforma se migraron a
 * `claudeService.js`, que va por OmniRoute con streaming.
 *
 * De este archivo solo siguen en uso los ayudantes de configuración que lee el
 * panel de superadministración (`getAiApiKey`, `setAiApiKey`,
 * `getAiModelPreference`, `setAiModelPreference`). El resto se conserva a la
 * espera de G9, cuando la configuración de modelos pase a Firestore; entonces
 * este archivo se borra entero.
 *
 * No añadas llamadas aquí. Si necesitas IA: `claudeService.js`.
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

const AI_PROXY_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? '/v1'
  : readEnv('VITE_AI_PROXY_URL', 'https://143-47-35-167.sslip.io/pro/freellmapi/v1');

// La clave ya no viaja incrustada en el codigo: se toma del entorno.
// La anterior quedo expuesta en el bundle publico y en el historial de git,
// asi que debe considerarse comprometida y rotarse.
export const DEFAULT_AI_KEY = readEnv('VITE_AI_API_KEY', '');

export const AI_MODELS = {
  CHAT: 'gemini-3.5-flash-lite',       // 0.6s respuesta ultra-rápida y empática
  EXTRACT: 'gemini-3.5-flash-lite',    // Extracción estructurada y JSON estricto
  SYNTH_SOAP: 'compound-mini',         // Formulación clínica y supervisión rápida
  VISION: 'auto'                       // Visión multimodal
};

const FAST_MODEL_CANDIDATES = [
  'gemini-3.5-flash-lite',
  'compound-mini',
  'stepfun-step-3.7-flash',
  'free-router',
  'auto'
];

export function getAiApiKey() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('ancora_ai_api_key') || DEFAULT_AI_KEY;
  }
  return DEFAULT_AI_KEY;
}

export function setAiApiKey(key) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ancora_ai_api_key', key.trim());
  }
}

export function getAiModelPreference() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('ancora_ai_model') || 'gemini-3.5-flash-lite';
  }
  return 'gemini-3.5-flash-lite';
}

export function setAiModelPreference(model) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ancora_ai_model', model);
  }
}

export function resolveAiModel(model) {
  if (!model) return AI_MODELS.CHAT;
  const m = String(model).toLowerCase().trim();
  if (m === 'pro' || m === 'fusion' || m === 'modo fusion' || m === 'fusión' || m === '5.5-high') {
    return 'compound-mini';
  }
  if (m === 'auto' || m === 'fast') {
    return 'gemini-3.5-flash-lite';
  }
  return m;
}

/**
 * Petición base al endpoint /v1/chat/completions con reintentos ultra-rápidos y tolerancia a fallos
 */
export async function askClinicalAI({ messages, model, temperature = 0.7, signal }) {
  const preferredModel = resolveAiModel(model || getAiModelPreference());
  const apiKey = getAiApiKey();

  const modelsToTry = [
    preferredModel,
    ...FAST_MODEL_CANDIDATES.filter(m => m !== preferredModel)
  ];

  const endpointsToTry = [
    AI_PROXY_URL,
    'https://143-47-35-167.sslip.io/pro/freellmapi/v1'
  ];

  let lastError = null;

  for (const endpoint of endpointsToTry) {
    for (const currentModel of modelsToTry) {
      try {
        const response = await fetch(`${endpoint}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: currentModel,
            messages,
            temperature
          }),
          signal: signal || undefined
        });

        if (!response.ok) {
          const errText = await response.text();
          console.warn(`[aiService] Error (${response.status}) con modelo ${currentModel} en ${endpoint}:`, errText);
          continue;
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content;

        if (!content && data.choices?.[0]?.message?.reasoning_content) {
          content = data.choices[0].message.reasoning_content;
        }

        if (content) {
          return String(content)
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .trim();
        }
      } catch (error) {
        lastError = error;
        console.warn(`[aiService] Fallo con ${currentModel} en ${endpoint}:`, error.message);
      }
    }
  }

  throw lastError || new Error('No se pudo obtener respuesta del gateway de IA.');
}

/**
 * Detector de Huecos Clínicos y Lagunas Temporales en la Historia de Vida
 * Identifica qué periodos de años o qué dimensiones vitales faltan por sonsacar.
 */
export function analyzeClinicalGaps(patientProfile = {}, timelineEvents = [], lifeTree = {}) {
  const gaps = [];
  const currentYear = new Date().getFullYear();
  const birthYear = patientProfile.birth_year || (patientProfile.age ? currentYear - patientProfile.age : null);

  // 1. Detección de Lagunas Temáticas (Árbol Vital)
  const tree = lifeTree?.tree_data || lifeTree || {};
  const categories = [
    { key: 'family_origin', label: 'Familia de Origen y Dinámica Familiar', prompt: 'la relación con tus padres, hermanos o figuras de crianza' },
    { key: 'childhood', label: 'Infancia y Adolescencia Temprana', prompt: 'cómo fue tu etapa escolar y vivencias significativas de la infancia' },
    { key: 'relationships', label: 'Vínculos Afectivos y Relaciones de Pareja', prompt: 'tus relaciones afectivas significativas o cómo vives los vínculos cercanos' },
    { key: 'work_studies', label: 'Ámbito Laboral, Académico y Proyectos', prompt: 'tu situación profesional actual o tu trayectoria en el trabajo' },
    { key: 'health', label: 'Salud Física, Médica y Psiquiátrica', prompt: 'antecedentes médicos relevantes o si tomas alguna medicación' },
    { key: 'habits', label: 'Hábitos de Vida, Descanso y Rutinas', prompt: 'cómo es la calidad de tu sueño, rutinas diarias y momentos de desconexión' }
  ];

  categories.forEach(cat => {
    const items = Array.isArray(tree[cat.key]) ? tree[cat.key] : [];
    if (items.length === 0) {
      gaps.push({
        type: 'thematic',
        category: cat.key,
        title: cat.label,
        suggestedInquiry: cat.prompt
      });
    }
  });

  // 2. Detección de Lagunas Cronológicas / Temporales
  if (birthYear && timelineEvents.length > 0) {
    const recordedYears = timelineEvents
      .map(e => parseInt(e.date, 10))
      .filter(y => !isNaN(y) && y >= birthYear && y <= currentYear)
      .sort((a, b) => a - b);

    if (recordedYears.length > 0) {
      let prevYear = birthYear;
      for (const y of recordedYears) {
        if (y - prevYear >= 6) {
          gaps.push({
            type: 'chronological',
            period: `${prevYear}-${y}`,
            title: `Periodo sin registros (${prevYear} a ${y})`,
            suggestedInquiry: `lo que viviste o cómo era tu día a día entre ${prevYear} y ${y}`
          });
        }
        prevYear = y;
      }
      if (currentYear - prevYear >= 4) {
        gaps.push({
          type: 'chronological',
          period: `${prevYear}-${currentYear}`,
          title: `Etapa reciente (${prevYear} a ${currentYear})`,
          suggestedInquiry: `cómo ha sido tu evolución en estos últimos años (${prevYear}-${currentYear})`
        });
      }
    }
  }

  return gaps;
}

/**
 * Clasificador Dinámico de Intención y Estrategia de Inferencia Clínica
 * Discrimina con precisión cuándo responder ULTRA RÁPIDO (<1.5s, Fast/Empático)
 * y cuándo activar RAZONAMIENTO CLÍNICO PROFUNDO (Thinking / Socrático / Reestructuración).
 */
export function determineInferenceStrategy(userMessage = '', chatHistory = [], patientProfile = {}) {
  const text = (userMessage || '').trim().toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Detección de Saludos / Check-in Breve / Respuestas Cortas
  const isShortGreetingOrCheckin = 
    wordCount <= 4 && 
    /^(hola|buenas|buenos d[ií]as|buenas tardes|buenas noches|qu[eé] tal|c[oó]mo est[aá]s|hey|saludos|inicio|empezar|estoy bien|regular|mal|cansad[oa]|triste|tranquil[oa]|ok|gracias)/i.test(text);

  // 2. Detección de Crisis Emocional o Conflicto Operativo/Vivencial Complejo
  const isComplexCrisisOrConflict = 
    /stop-loss|p[eé]rdida|perd[ií]|arruin|fracas|no valgo|culpa|autoboicot|ansiedad|p[aá]nico|desesperad|separar|divorcio|trauma|herida|infancia|pelea|conflicto|suicid|no puedo m[aá]s|urgente/i.test(text) ||
    wordCount > 35 ||
    text.length > 200;

  // 3. Detección de Pregunta Reflexiva o Búsqueda de Análisis
  const isReflectiveQuestion = 
    /\?/.test(text) && 
    /(por qu[eé]|c[oó]mo puedo|qu[eé] significa|qu[eé] hago|c[oó]mo salgo|qu[eé] opinas|por qu[eé] siempre|qu[eé] me pasa)/i.test(text);

  if (isShortGreetingOrCheckin && !isComplexCrisisOrConflict) {
    return {
      type: 'FAST_EMPATHIC',
      model: 'gemini-3.5-flash-lite',
      temperature: 0.7,
      thinking: false,
      directive: 'Responde de forma ultra-rápida, cálida y humana. Conecta con 1 anclaje de su contexto y abre con 1 pauta somática o pregunta suave.'
    };
  }

  if (isComplexCrisisOrConflict || isReflectiveQuestion) {
    return {
      type: 'DEEP_REASONING',
      model: 'gemini-3.5-flash-lite',
      temperature: 0.5,
      thinking: true,
      directive: 'Analiza a fondo la carga emocional y distorsiones cognitivas. Valida profundamente, ofrece reestructuración cognitiva y cierra con una intervención socrática paso a paso.'
    };
  }

  return {
    type: 'STANDARD_SOCRATIC',
    model: 'gemini-3.5-flash-lite',
    temperature: 0.65,
    thinking: false,
    directive: 'Acompaña con escucha activa, ordenando las ideas del paciente y avanzando en el sonsacado socrático.'
  };
}

/**
 * Generador de respuesta terapéutica inteligente con Sonsacado Activo, Empatía y Routing Dinámico
 */
export async function generateTherapistResponse({ 
  userMessage, 
  patientProfile = {}, 
  chatHistory = [], 
  therapistName = 'Equipo Clínico Áncora',
  currentMood = null,
  timelineEvents = [],
  lifeTree = {},
  conversationTitle = null,
  topicFolder = null,
  recentCycleSummaries = [],
  mode = null,
  systemPromptOverride = null,
  signal = null
}) {
  const patientName = patientProfile.display_name || patientProfile.fullName || patientProfile.nombre || 'el paciente';
  const currentDateStr = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const strategy = determineInferenceStrategy(userMessage, chatHistory, patientProfile);
  const effectiveModel = mode || strategy.model;

  let systemPrompt = systemPromptOverride;

  if (!systemPrompt) {
    let moodContext = '';
    if (currentMood) {
      moodContext = `\n--- REGISTRO EMOCIONAL DE HOY ---\n- Nivel de Ansiedad: ${currentMood.anxiety_level ?? currentMood.anxiety ?? 'N/A'}/10\n- Nivel de Impulsividad/Ánimo: ${currentMood.impulsivity_level ?? currentMood.impulsivity ?? 'N/A'}/10\n- Notas del paciente: "${currentMood.notes ?? 'Sin notas adicionales'}"`;
    }

    let therapeuticContext = '';

    // Inyección de Foco Temático del Chat Actual (Estilo ChatGPT / Claude Code)
    if (conversationTitle || topicFolder || (recentCycleSummaries && recentCycleSummaries.length > 0)) {
      therapeuticContext += `\n--- FOCO DE LA CONVERSACIÓN ACTUAL Y CONTINUIDAD ENTRE SESIONES ---`;
      if (conversationTitle) {
        therapeuticContext += `\n• Título/Foco del chat activo: "${conversationTitle}"`;
      }
      if (topicFolder && topicFolder !== 'General') {
        therapeuticContext += `\n• Carpeta temática asignada: "${topicFolder}"`;
      }
      if (recentCycleSummaries && recentCycleSummaries.length > 0) {
        therapeuticContext += `\n• Otras sesiones recientes de este ciclo terapéutico:`;
        recentCycleSummaries.forEach(s => {
          therapeuticContext += `\n  * "${s.title}": ${s.summary}`;
        });
      }
      therapeuticContext += `\nTen presente este hilo temático para orientar tus intervenciones y mantener la continuidad clínica.`;
    }

    if (patientProfile.contexto_terapeutico) {
      const ctx = patientProfile.contexto_terapeutico;
      if (ctx.motivo) therapeuticContext += `\n- Motivo de consulta inicial declarado: "${ctx.motivo}"`;
      if (ctx.triaje) {
        therapeuticContext += `\n- Triaje Basal de Admisión: PHQ-9 (Depresión/Ánimo) = ${ctx.triaje.phq9 ?? 'N/A'}/27 | GAD-7 (Ansiedad/Estrés) = ${ctx.triaje.gad7 ?? 'N/A'}/21`;
      }
      if (ctx.tags && Array.isArray(ctx.tags) && ctx.tags.length > 0) {
        therapeuticContext += `\n- Focos y etiquetas de malestar: ${ctx.tags.join(', ')}`;
      }
      if (ctx.foto_persona) therapeuticContext += `\n- Perfil actual: ${ctx.foto_persona}`;
      if (ctx.conclusiones && Array.isArray(ctx.conclusiones)) {
        therapeuticContext += `\n- Conclusiones de sesiones previas: ${ctx.conclusiones.slice(0, 5).join('; ')}`;
      }
      if (ctx.temas && Array.isArray(ctx.temas)) {
        const activeTopics = ctx.temas.filter(t => t.status === 'active' || t.status === 'emerging');
        if (activeTopics.length > 0) {
          therapeuticContext += `\n- Temas abiertos en terapia: ${activeTopics.map(t => t.title).join(', ')}`;
        }
      }
      if (ctx.historial_clinico?.recuerdos_aportados && Array.isArray(ctx.historial_clinico.recuerdos_aportados)) {
        const recs = ctx.historial_clinico.recuerdos_aportados.slice(-5);
        if (recs.length > 0) {
          therapeuticContext += `\n- Recuerdos y vivencias aportados recientemente por el paciente:\n${recs.map(r => `  * [${r.area}]: "${r.texto}"`).join('\n')}`;
        }
      }
      if (ctx.areas_completadas && typeof ctx.areas_completadas === 'object') {
        const closed = Object.keys(ctx.areas_completadas).filter(k => ctx.areas_completadas[k]);
        if (closed.length > 0) {
          therapeuticContext += `\n- Áreas vitales declaradas como completas/cerradas por el paciente: ${closed.join(', ')}`;
        }
      }
    }

    // Incluir Árbol Vital si existe
    const tree = lifeTree?.tree_data || lifeTree || {};
    const treeKeys = Object.keys(tree).filter(k => Array.isArray(tree[k]) && tree[k].length > 0);
    if (treeKeys.length > 0) {
      therapeuticContext += `\n--- ÁRBOL VITAL Y ANTECEDENTES CONOCIDOS ---\n` + treeKeys.map(k => `- ${k}: ${tree[k].slice(0, 3).join('; ')}`).join('\n');
    }

    // Calcular gaps clínicos para sonsacado activo gradual
    const detectedGaps = analyzeClinicalGaps(patientProfile, timelineEvents, lifeTree);
    let gapInquiryGuidance = '';
    if (detectedGaps.length > 0) {
      const topGap = detectedGaps[0];
      gapInquiryGuidance = `\n--- OBJETIVO CLÍNICO DE ANAMNESIS PROGRESIVA (SONSACADO CÁLIDO) ---
- Área o periodo pendiente de explorar: "${topGap.title}".
- Directiva de exploración: Si la conversación fluye de forma tranquila y el paciente no está en crisis aguda, introduce con suavidad y de manera natural una pregunta al final de tu intervención para invitarle a profundizar sobre ${topGap.suggestedInquiry}.`;
    }

    // Dudas clínicas detectadas por informes subidos
    const dudasDoc = patientProfile.contexto_terapeutico?.dudas_clinicas_sonsacado || [];
    let dudasGuidance = '';
    if (Array.isArray(dudasDoc) && dudasDoc.length > 0) {
      dudasGuidance = `\n--- FOCOS DE ANAMNESIS ABIERTOS POR INFORMES MÉDICOS (SONSACADO PRIORITARIO) ---\n` +
        dudasDoc.slice(0, 3).map(d => `- Pregunta pendiente de aclarar con calidez: "${d}"`).join('\n') +
        `\nSi la conversación lo permite, integra una de estas dudas con delicadeza al final de tu intervención.`;
    }

    systemPrompt = `Eres IA Áncora ⚓, asistente clínico conversacional experto y empático de apoyo psicológico para ${patientName}.
Actúas como un psicólogo asistente clínico cálido, asertivo y estructurado: escuchas activamente, regulas el estado emocional, ordenas la información y recopilas la anamnesis completa con calidez.

FECHA DE HOY: ${currentDateStr}${moodContext}${therapeuticContext}${gapInquiryGuidance}${dudasGuidance}

DIRECTIVAS CLÍNICAS Y FORMATO (MANDATORIAS):
1. **Trato Cálido, Empatía Real y Transparencia Absoluta**:
   - Valida la emoción del paciente de forma sincera al inicio (1-2 frases empáticas). Nunca suenes como un robot genérico ni des sermones impersonales.
   - Si el paciente te pregunta qué sabes de él/ella o qué información tienes, indícale con total transparencia y afecto los datos que constan en su expediente de triaje.
2. **Sonsacado Activo y Construcción del Expediente Vivo al Ritmo del Paciente**:
   - Tu labor clínica como terapeuta es ir completando poco a poco el mapa vital del paciente (árbol familiar, relaciones, historia médica, etapas de vida y años sin explorar) de manera orgánica y socrática.
   - Si el paciente prefiere expresarse por voz, anímale con calidez ('si te resulta más cómodo, puedes grabarme un audio contándome...').
3. **Formato Ultra-Visual y Muy Legible**:
   - Párrafos cortos y aireados (máximo 2-3 líneas).
   - Usa **negritas** para destacar conceptos clave.
   - Usa viñetas limpias para pautas o reflexiones.
   - Usa bloques de cita ('>') para validaciones emocionales profundas.
   - Usa emojis sobrios de forma elegante (🧠, 💡, 🛡️, 🌿, ✨).
4. **Indagar Antes de Concluir (Método Socrático Paso a Paso)**:
   - No intentes resolver toda la vida del paciente en una sola respuesta.
   - Cierra siempre tu intervención con 1 o 2 preguntas abiertas, reflexivas y amables que inviten al paciente a profundizar con calma.
5. **Regulación Emocional y Reset en Momentos de Crisis**:
   - Si el paciente expresa agobio, bloqueo, ansiedad alta o estrés, ofrece una pauta inmediata de aterrizaje (respiración diafragmática 4-7-8, orientación sensorial 5-4-3-2-1 o reset de activación).
6. **Triaje y Detección Progresiva**:
   - Integra de forma natural preguntas sobre descanso, energía y preocupaciones sin que parezca un cuestionario frío.
   - Si detectas riesgo inminente o ideación suicida, ofrece contención inmediata y recuerda con calidez los teléfonos de asistencia de urgencia (024 o 112 en España).`;
  }

  // Sanitizar y estructurar el historial
  const cleanedHistory = [];
  for (const msg of chatHistory.slice(-12)) {
    const content = (msg.content || msg.text || '').trim();
    if (!content) continue;
    cleanedHistory.push({
      role: (msg.role === 'user' || msg.sender === 'user' || msg.isUser) ? 'user' : 'assistant',
      content
    });
  }

  const messagesToSend = [
    { role: 'system', content: systemPrompt },
    ...cleanedHistory
  ];

  if (userMessage && userMessage.trim()) {
    const lastMsg = messagesToSend[messagesToSend.length - 1];
    if (!lastMsg || lastMsg.role !== 'user' || lastMsg.content !== userMessage.trim()) {
      messagesToSend.push({ role: 'user', content: userMessage.trim() });
    }
  }

  const rawResponse = await askClinicalAI({
    messages: messagesToSend,
    model: effectiveModel,
    temperature: strategy.temperature || 0.65,
    signal
  });

  return String(rawResponse || '')
    .replace(/<update_context>[\s\S]*?<\/update_context>/gi, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();
}

/**
 * Síntesis clínica para psicólogos (Notas SOAP y Resumen de Sesión)
 */
export async function generateClinicalSOAPNotes({ sessionTranscript, patientContext = {} }) {
  const prompt = `Analiza la siguiente transcripción/notas de sesión y genera un resumen estructurado en formato SOAP (Subjetivo, Objetivo, Análisis, Plan) para el expediente clínico de Áncora.

EXPEDIENTE PACIENTE:
${JSON.stringify(patientContext, null, 2)}

TRANSCRIPCIÓN DE LA SESIÓN:
${sessionTranscript}

Devuelve un informe clínico profesional, estructurado, riguroso y conciso en español.`;

  return await askClinicalAI({
    messages: [
      { role: 'system', content: 'Eres un supervisor clínico y documentador experto en psicoterapia basada en evidencia.' },
      { role: 'user', content: prompt }
    ],
    model: AI_MODELS.SYNTH_SOAP,
    temperature: 0.3
  });
}

/**
 * Análisis Clínico Profundo de Documentos, Informes Médicos e Imágenes
 * Realiza una extracción exhaustiva como psicólogo clínico colegiado,
 * estructura cada dato en su área del expediente y genera dudas para el sonsacado en el chat.
 */
export async function deepAnalyzeClinicalDocument({ 
  fileContent, 
  fileName = '', 
  mimeType = 'text/plain', 
  imageBase64 = null,
  patientProfile = {} 
}) {
  const isImage = !!imageBase64 || mimeType.startsWith('image/');
  const isAudio = mimeType.startsWith('audio/');

  const systemPrompt = `Eres un Psicólogo Clínico Colegiado y Experto en Anamnesis y Formulación Clínica de Áncora.
Tu labor es analizar minuciosamente este archivo/informe aportado por el paciente (${fileName}) con el máximo rigor clínico.

Debes:
1. Extraer con precisión diagnósticos, antecedentes médicos/psiquiátricos, somatizaciones y tratamientos farmacológicos actuales o pasados.
2. Identificar hitos vitales con fechas o años para la línea temporal de vida.
3. Clasificar cada vivencia en las 6 dimensiones del Árbol Vital (familia y origen, infancia, relaciones/apego, trabajo/estudios, salud, descanso y hábitos).
4. Detectar EPISODIOS CLÍNICOS significativos (crisis, rupturas, duelos, etapas de sobrecarga).
5. **GENERAR DUDAS CLÍNICAS Y FOCOS DE SONSACADO**: Identifica qué preguntas, vacíos o aspectos complementarios quedan sin responder en este documento, formuladas de manera cálida para que la IA se las pregunte progresivamente al paciente en el chat diario.

Devuelve un JSON estrictamente válido con la siguiente estructura exacta:
{
  "resumen_ejecutivo": "Síntesis clínica de 2-4 líneas sobre lo que aporta este documento al expediente...",
  "antecedentes_psicologicos": "Terapias previas, diagnósticos o antecedentes de salud mental",
  "antecedentes_medicos": "Condiciones médicas, pruebas, somatizaciones o historial médico",
  "patrones_comunes": "Desencadenantes, mecanismos de afrontamiento y sintomatología",
  "medications": [
    { "name": "Nombre fármaco", "dose": "Dosis", "frequency": "Frecuencia", "prescriber": "Especialista/Centro", "active": true }
  ],
  "timeline_events": [
    { "year": "2018", "date": "2018", "event": "Descripción del acontecimiento relevante", "category": "medical|work|family|personal" }
  ],
  "life_tree": {
    "family_origin": ["Dinámica o dato familiar extraído..."],
    "childhood": ["Vivencia o hito de etapa temprana..."],
    "relationships": ["Dato sobre vínculos, pareja o apego..."],
    "work_studies": ["Trayectoria laboral, académica o estrés laboral..."],
    "health": ["Dato médico relevante..."],
    "habits": ["Patrón de descanso o rutina..."]
  },
  "clinical_episodes": [
    { "title": "Título del episodio", "description": "Descripción clínica", "category": "medical|anxiety|mood|trauma", "severity": "mild|moderate|severe" }
  ],
  "dudas_sonsacado": [
    "Pregunta amable y abierta sobre un vacío o periodo que este documento no aclara para indagar en el chat...",
    "Otra pregunta cálida sobre cómo vivió el paciente dicho evento..."
  ],
  "pautas_sugeridas": [
    "Pauta o recomendación constructiva para el terapeuta y el paciente"
  ]
}`;

  let messages = [];

  if (isImage && imageBase64) {
    messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: `Analiza minuciosamente esta imagen/informe médico (${fileName}) y extrae toda la ficha clínica:` },
          {
            type: 'image_url',
            image_url: {
              url: imageBase64.startsWith('data:') ? imageBase64 : `data:${mimeType};base64,${imageBase64}`
            }
          }
        ]
      }
    ];
  } else {
    messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `DOCUMENTO: "${fileName}" (Tipo: ${mimeType})\n\nCONTENIDO:\n${String(fileContent || '').slice(0, 20000)}` }
    ];
  }

  const raw = await askClinicalAI({
    messages,
    model: AI_MODELS.EXTRACT,
    temperature: 0.2
  });

  try {
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) || raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return {
        resumen_ejecutivo: parsed.resumen_ejecutivo || parsed.resumen_vital || 'Documento analizado e incorporado al expediente.',
        antecedentes_psicologicos: parsed.antecedentes_psicologicos || '',
        antecedentes_medicos: parsed.antecedentes_medicos || '',
        patrones_comunes: parsed.patrones_comunes || '',
        medications: Array.isArray(parsed.medications) ? parsed.medications : [],
        timeline_events: Array.isArray(parsed.timeline_events) ? parsed.timeline_events : [],
        life_tree: parsed.life_tree || {},
        clinical_episodes: Array.isArray(parsed.clinical_episodes) ? parsed.clinical_episodes : [],
        dudas_sonsacado: Array.isArray(parsed.dudas_sonsacado) ? parsed.dudas_sonsacado : [],
        pautas_sugeridas: Array.isArray(parsed.pautas_sugeridas) ? parsed.pautas_sugeridas : []
      };
    }
  } catch (e) {
    console.warn("Error parsing clinical JSON response:", e);
  }

  return {
    resumen_ejecutivo: raw.slice(0, 300),
    medications: [],
    timeline_events: [],
    life_tree: {},
    clinical_episodes: [],
    dudas_sonsacado: [],
    pautas_sugeridas: []
  };
}

/**
 * Extracción clínica compatible retroactiva de documentos textuales
 */
export async function extractClinicalDataFromDocument({ textContent, fileName = '', patientProfile = {} }) {
  return await deepAnalyzeClinicalDocument({
    fileContent: textContent,
    fileName,
    mimeType: 'text/plain',
    patientProfile
  });
}

/**
 * Análisis de visión multimodal clínica retroactiva
 */
export async function analyzeClinicalImage({ imageBase64, prompt, patientProfile = {} }) {
  return await deepAnalyzeClinicalDocument({
    imageBase64,
    fileName: 'Imagen Médica',
    mimeType: 'image/jpeg',
    patientProfile
  });
}

/**
 * Sintetizador Clínico 360° Integral de Expediente de Vida
 * Revisa todos los documentos, notas de voz, contexto de triaje y recuerdos
 * para poblar exhaustivamente las 6 dimensiones vitales y generar las dudas de sonsacado.
 */
export async function synthesizeCompletePatientHistory({
  patientProfile = {},
  documents = [],
  timelineEvents = [],
  medications = [],
  lifeTree = {},
  chatMessages = []
}) {
  const patientName = patientProfile.display_name || patientProfile.fullName || 'Paciente';
  const ctx = patientProfile.contexto_terapeutico || {};

  // Compilar todo el corpus textual disponible
  const docsText = documents.map(d => `--- DOCUMENTO: "${d.file_name || 'Informe'}" ---\nResumen/Contenido: ${d.summary || d.extracted_text || d.file_name || 'Sin texto'}`).join('\n\n');
  const chatSummary = chatMessages.slice(-15).map(m => `${m.sender || m.role}: ${m.content}`).join('\n');
  const existingEvents = timelineEvents.map(e => `- [${e.date || 'Hito'}]: ${e.event} (${e.event_type || 'general'})`).join('\n');
  const existingMeds = medications.map(m => `- ${m.name} (${m.dose || 'Pautada'} - ${m.frequency || 'Diaria'})`).join('\n');

  const systemPrompt = `Eres el Supervisor Clínico y Director de Formulación de Casos de Áncora ⚓.
Tu misión es estructurar y completar de forma inteligente, exhaustiva, empática y no patologizante el Expediente de Vida del paciente "${patientName}".

Debes analizar todo el material aportado (documentos, triaje, notas, hitos y conversaciones) y construir una síntesis clínica completa:
1. **LAS 6 DIMENSIONES VITALES DEL ÁRBOL VITAL**:
   - \`family_origin\`: Familia y Origen (padres, hermanos, estilo de crianza, dinámicas familiares tempranas y actuales).
   - \`childhood\`: Infancia y Desarrollo (etapa escolar, experiencias fundacionales, heridas tempranas, creencias nucleares).
   - \`relationships\`: Vínculos Afectivos (pareja, personas de apoyo como Susana o figuras clave, estilo de apego).
   - \`work_studies\`: Ámbito Profesional y Proyectos (trabajo, trading, finanzas, rendimiento, vocación, estrés).
   - \`health\`: Salud y Bienestar Físico (síntomas somáticos, pulso/taquicardias, pruebas médicas, diagnósticos, medicación).
   - \`habits\`: Hábitos y Calidad del Sueño (patrones de sueño, rutinas, técnicas de respiración 4-7-8, regulación de impulsos).

Para cada una de las 6 dimensiones, proporciona entre 2 y 4 observaciones clínicas concretas extraídas de la evidencia real. Si una dimensión tiene poca evidencia documental, incluye lo que se sabe y aclara la laguna de forma respetuosa.

2. **FARMACOLOGÍA & TRATAMIENTOS**: Lista exhaustiva de fármacos, complementos o pautas médicas detectadas.
3. **LÍNEA TEMPORAL DE HITOS (TIMELINE)**: Hitos vitales ordenados con año/fecha estimada y descripción.
4. **FOCOS & DUDAS DE SONSACADO (LO QUE QUEDA PENDIENTE POR COMPLETAR)**: Las 3-5 preguntas más importantes, abiertas y cálidas que la IA debe sonsacarle con delicadeza en el chat para completar las lagunas de su historia vital.

Devuelve EXCLUSIVAMENTE un JSON con esta estructura exacta:
{
  "resumen_vital": "Síntesis narrativa global de la persona y su momento vital (3-5 líneas)...",
  "antecedentes_psicologicos": "Antecedentes psicológicos y patrones de salud mental consolidados...",
  "antecedentes_medicos": "Antecedentes médicos, fisiológicos y somatizaciones...",
  "patrones_comunes": "Desencadenantes, mecanismos de afrontamiento y sintomatología...",
  "life_tree": {
    "family_origin": ["Punto clínico 1...", "Punto clínico 2..."],
    "childhood": ["Punto clínico 1...", "Punto clínico 2..."],
    "relationships": ["Punto clínico 1...", "Punto clínico 2..."],
    "work_studies": ["Punto clínico 1...", "Punto clínico 2..."],
    "health": ["Punto clínico 1...", "Punto clínico 2..."],
    "habits": ["Punto clínico 1...", "Punto clínico 2..."]
  },
  "medications": [
    { "name": "Nombre", "dose": "Dosis", "frequency": "Frecuencia", "prescriber": "Origen" }
  ],
  "timeline_events": [
    { "date": "2020", "year": "2020", "event": "Descripción del hito vital", "event_type": "personal|medical|work|family" }
  ],
  "dudas_sonsacado": [
    "Pregunta de exploración socrática y cálida para el chat sobre un área pendiente...",
    "Segunda pregunta..."
  ],
  "pautas_accion": [
    "Pauta o estrategia acordada..."
  ]
}`;

  const userPrompt = `DATOS DEL PACIENTE:
- Nombre: ${patientName}
- Motivo inicial: ${ctx.motivo || 'Acompañamiento y bienestar'}
- Focos/Tags: ${(ctx.tags || []).join(', ') || 'General'}
- Foto de la persona: ${ctx.foto_persona || 'No disponible'}
- Síntesis actual: ${ctx.sintesis_ia || 'Sin síntesis'}

DOCUMENTOS ANALIZADOS:
${docsText || 'Sin documentos adicionales subidos.'}

HITOS PREVIOS:
${existingEvents || 'Sin hitos previos.'}

MEDICACIÓN PREVIA:
${existingMeds || 'Sin medicación previa.'}

CONVERSACIONES RECIENTES:
${chatSummary || 'Sin mensajes recientes.'}

Genera la Formulación Clínica 360° completa en JSON ahora:`;

  try {
    const raw = await askClinicalAI({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'auto',
      temperature: 0.3
    });

    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) || raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return {
        success: true,
        resumen_vital: parsed.resumen_vital || 'Expediente sintetizado con IA.',
        antecedentes_psicologicos: parsed.antecedentes_psicologicos || '',
        antecedentes_medicos: parsed.antecedentes_medicos || '',
        patrones_comunes: parsed.patrones_comunes || '',
        life_tree: parsed.life_tree || {},
        medications: Array.isArray(parsed.medications) ? parsed.medications : [],
        timeline_events: Array.isArray(parsed.timeline_events) ? parsed.timeline_events : [],
        dudas_sonsacado: Array.isArray(parsed.dudas_sonsacado) ? parsed.dudas_sonsacado : [],
        pautas_accion: Array.isArray(parsed.pautas_accion) ? parsed.pautas_accion : []
      };
    }
  } catch (err) {
    console.error('[aiService] Error en síntesis integral de expediente:', err);
  }

  return {
    success: false,
    resumen_vital: 'No se pudo completar la síntesis automática.',
    life_tree: {},
    medications: [],
    timeline_events: [],
    dudas_sonsacado: [],
    pautas_accion: []
  };
}
