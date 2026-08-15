/**
 * Servicio Oficial de Inteligencia Artificial Clínica Áncora ⚓
 * Motor: Gateway Unificado FreeLLMAPI con soporte CORS completo
 * Modelos: 'auto' (Selección Rápida) / 'fusion' (Razonamiento Clínico Profundo)
 */

const AI_PROXY_URL = (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  ? '/v1'
  : 'https://143-47-35-167.sslip.io/v1';

export const DEFAULT_AI_KEY = 'freellmapi-bc5d56dc6a1548c6c11a0d409008b1ed0273e4105cd64784';

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
    return localStorage.getItem('ancora_ai_model') || 'auto';
  }
  return 'auto';
}

export function setAiModelPreference(model) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('ancora_ai_model', model);
  }
}

export function resolveAiModel(model) {
  if (!model) return 'auto';
  const m = String(model).toLowerCase().trim();
  if (m === 'pro' || m === 'fusion' || m === 'modo fusion' || m === 'fusión' || m === '5.5-high') {
    return 'fusion';
  }
  return 'auto';
}

/**
 * Petición base al endpoint /v1/chat/completions
 */
export async function askClinicalAI({ messages, model, temperature = 0.7, signal }) {
  const selectedModel = resolveAiModel(model || getAiModelPreference());
  const apiKey = getAiApiKey();

  const controller = signal ? null : new AbortController();
  const timeoutId = controller ? setTimeout(() => controller.abort(), 60000) : null;

  try {
    const response = await fetch(`${AI_PROXY_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature
      }),
      signal: signal || controller?.signal
    });

    if (timeoutId) clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`FreeLLMAPI Error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('La respuesta de la IA no contiene texto válido.');
    }

    return content;
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId);
    console.error('Error en llamada a FreeLLMAPI:', error);
    throw error;
  }
}

/**
 * Generador de respuesta terapéutica inteligente y empática para el paciente
 */
export async function generateTherapistResponse({ 
  userMessage, 
  patientProfile = {}, 
  chatHistory = [], 
  therapistName = 'Equipo Clínico Áncora',
  currentMood = null,
  mode = 'auto',
  systemPromptOverride = null,
  signal = null
}) {
  const patientName = patientProfile.display_name || patientProfile.fullName || patientProfile.nombre || 'el paciente';
  const currentDateStr = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let systemPrompt = systemPromptOverride;

  if (!systemPrompt) {
    let moodContext = '';
    if (currentMood) {
      moodContext = `\n--- REGISTRO EMOCIONAL DE HOY ---\n- Nivel de Ansiedad: ${currentMood.anxiety_level ?? currentMood.anxiety ?? 'N/A'}/10\n- Nivel de Impulsividad/Ánimo: ${currentMood.impulsivity_level ?? currentMood.impulsivity ?? 'N/A'}/10\n- Notas del paciente: "${currentMood.notes ?? 'Sin notas adicionales'}"`;
    }

    let therapeuticContext = '';
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
    }

    systemPrompt = `Eres IA Áncora ⚓, asistente clínico conversacional experto y empático de apoyo psicológico para ${patientName}.
Actúas como un psicólogo asistente clínico cálido, asertivo y estructurado: escuchas activamente, regulas el estado emocional, ordenas la información y acompañas con calidez.

FECHA DE HOY: ${currentDateStr}${moodContext}${therapeuticContext}

DIRECTIVAS CLÍNICAS Y FORMATO (MANDATORIAS):
1. **Trato Cálido, Empatía Real y Transparencia Absoluta**:
   - Valida la emoción del paciente de forma sincera al inicio (1-2 frases empáticas). Nunca suenes como un robot genérico ni des sermones impersonales.
   - Si el paciente te pregunta qué sabes de él/ella o qué información tienes, indícale con total transparencia y afecto los datos que constan en su expediente de triaje: su nombre (${patientName}), el motivo por el que vino ("${patientProfile.contexto_terapeutico?.motivo || 'acompañamiento terapéutico'}"), sus niveles basales de ansiedad y ánimo en su triaje (GAD-7: ${patientProfile.contexto_terapeutico?.triaje?.gad7 ?? 'N/A'}/21, PHQ-9: ${patientProfile.contexto_terapeutico?.triaje?.phq9 ?? 'N/A'}/27) y sus focos de consulta.
2. **Exploración Proactiva y Construcción del Expediente Vivo**:
   - Tu objetivo continuo es ir profundizando amablemente en su historia clínica (árbol vital, relaciones, antecedentes, hábitos de sueño, rutinas) a través de preguntas abiertas en el chat o animándole a enviarte notas de voz ('si te resulta más cómodo, puedes grabarme un audio contándome...').
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
    model: mode,
    temperature: 0.65,
    signal
  });

  // Limpiar etiquetas técnicas internas de forma robusta
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
    model: 'fusion',
    temperature: 0.3
  });
}

/**
 * Análisis de visión multimodal clínica (Informes médicos, fotos de recetas, analíticas, diarios manuscritos)
 */
export async function analyzeClinicalImage({ imageBase64, prompt, patientProfile = {} }) {
  const systemPrompt = `Eres un sistema experto de Visión Clínica y Extracción Documental de Áncora.
Tu tarea es leer minuciosamente la imagen proporcionada (informe médico, analítica, receta, caja de medicación, o notas manuscritas de salud mental) y extraer la información estructurada de forma clínica.

Devuelve un JSON estrictamente válido con la siguiente estructura:
{
  "transcription": "Texto completo o resumen fiel legible de la imagen",
  "diagnoses": ["Diagnóstico o condición detectada"],
  "medications": [
    { "name": "Nombre fármaco", "dose": "Dosis", "frequency": "Frecuencia", "prescriber": "Médico/Especialidad" }
  ],
  "timeline_events": [
    { "date": "Fecha o periodo", "event": "Acontecimiento o hito clínico" }
  ],
  "clinical_summary": "Síntesis interpretativa para el psicólogo colegiado"
}`;

  const userContent = [
    {
      type: 'text',
      text: prompt || 'Analiza esta imagen clínica/médica y extrae todos los datos relevantes de diagnósticos, medicación, fechas e hitos.'
    },
    {
      type: 'image_url',
      image_url: {
        url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
      }
    }
  ];

  const raw = await askClinicalAI({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    model: 'fusion',
    temperature: 0.2
  });

  try {
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) || raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    return { transcription: raw, clinical_summary: raw, medications: [], timeline_events: [], diagnoses: [] };
  } catch (e) {
    return { transcription: raw, clinical_summary: raw, medications: [], timeline_events: [], diagnoses: [] };
  }
}

/**
 * Extracción clínica de documentos textuales (PDF, DOCX, TXT, MD)
 */
export async function extractClinicalDataFromDocument({ textContent, fileName = '', patientProfile = {} }) {
  const systemPrompt = `Eres un sintetizador clínico y documentador experto en psicología y psiquiatría.
Analiza el documento aportado (${fileName}) y extrae los datos clínicos relevantes para organizar el expediente del paciente.

Devuelve un JSON estrictamente estructurado:
{
  "resumen_vital": "Resumen de la situación vital y motivo de consulta",
  "antecedentes_psicologicos": "Terapias previas, diagnósticos o antecedentes",
  "antecedentes_medicos": "Condiciones médicas, pruebas o somatizaciones",
  "patrones_comunes": "Desencadenantes de ansiedad, estrés, rumiación o bloqueos",
  "medications": [
    { "name": "Nombre", "dose": "Dosis", "frequency": "Frecuencia", "prescriber": "Prescriptor" }
  ],
  "timeline_events": [
    { "date": "Año o Fecha", "event": "Descripción del hito vital o crisis" }
  ],
  "pautas_sugeridas": [
    "Recomendación para el terapeuta o paciente"
  ]
}`;

  const raw = await askClinicalAI({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `DOCUMENTO: "${fileName}"\n\nCONTENIDO:\n${textContent.slice(0, 15000)}` }
    ],
    model: 'fusion',
    temperature: 0.2
  });

  try {
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) || raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    }
    return { resumen_vital: raw, medications: [], timeline_events: [], pautas_sugeridas: [] };
  } catch (e) {
    return { resumen_vital: raw, medications: [], timeline_events: [], pautas_sugeridas: [] };
  }
}
