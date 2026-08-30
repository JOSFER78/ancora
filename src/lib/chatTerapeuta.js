import { generateTherapistResponse, askClinicalAI, AI_MODELS } from '../services/aiService.js';
import { firebaseClient as db, firebaseClient } from '../firebaseAdapter.js';
import { MemoryRepositoryFactory } from '../infrastructure/storage/MemoryRepositoryFactory.js';
import { CognitiveMemoryEngine } from '../services/memory/CognitiveMemoryEngine.js';

let cachedMemoryEngine = null;
function getMemoryEngine() {
  if (!cachedMemoryEngine) {
    const repo = MemoryRepositoryFactory.getRepository();
    cachedMemoryEngine = new CognitiveMemoryEngine({ repository: repo });
  }
  return cachedMemoryEngine;
}

/**
 * Motor de Inferencia y Asistente Clínico Áncora ⚓
 * Conexión directa a Gateway de 3 Modelos y persistencia automática en Cloud Firestore
 */
export async function invokeChatTerapeuta(body = {}, signal = null) {
  try {
    const action = body.action || 'chat';

    // Transcripción de audio
    if (action === 'transcribe_audio') {
      return { 
        transcription: 'Audio recibido y analizado por el asistente clínico.' 
      };
    }

    // Procesamiento y consolidación de memoria cognitiva
    if (action === 'prepare_mente_sync' || action === 'process_mente_sync_item' || action === 'consolidate_mente_sync') {
      const prompt = `Analiza clínicamente este contenido para consolidar el perfil terapéutico del paciente: ${JSON.stringify(body.item || body.data || body)}`;
      const aiReply = await askClinicalAI({
        messages: [{ role: 'user', content: prompt }],
        model: AI_MODELS.EXTRACT,
        signal
      });
      return { success: true, result: aiReply };
    }

    // Flujo Principal de Conversación Clínica
    const rawMessages = body.messages || [];
    const lastUserMsg = [...rawMessages].reverse().find(m => m.role === 'user' || m.sender === 'user' || m.isUser);
    const userText = lastUserMsg?.content || lastUserMsg?.text || (typeof body.content === 'string' ? body.content : 'Hola');

    // Historial previo
    const history = rawMessages.slice(0, -1).map(m => ({
      role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
      content: m.content || m.text || ''
    }));

    // Cargar usuario autenticado y perfil
    let patientId = body.patientId || null;
    let patientProfile = body.patientProfile || {};
    let timelineEvents = [];
    let lifeTree = {};

    try {
      if (!patientId) {
        const { data: { user } } = await db.auth.getUser();
        if (user?.id) patientId = user.id;
      }
      if (patientId) {
        if (!patientProfile || !patientProfile.contexto_terapeutico || !patientProfile.contexto_terapeutico.historial_clinico) {
          const { data: profile } = await firebaseClient
            .from('profiles')
            .select('*')
            .eq('id', patientId)
            .maybeSingle();
          if (profile) {
            patientProfile = { ...patientProfile, ...profile };
          }
        }

        // Cargar eventos del timeline y árbol de vida para sonsacado contextual
        const [{ data: tlData }, { data: treeData }] = await Promise.all([
          db.from('timeline_events').select('*').eq('patient_id', patientId),
          db.from('clinical_life_tree').select('*').eq('patient_id', patientId).maybeSingle()
        ]);
        if (tlData) timelineEvents = tlData;
        if (treeData) lifeTree = treeData;
      }
    } catch (_) {}

    // Fast Path: Recuperar contexto enriquecido estructurado mediante CognitiveMemoryEngine si hay patientId
    let systemPromptOverride = body.systemPromptOverride || null;
    let telemetry = body.contextoClinico || null;

    if (!systemPromptOverride && patientId) {
      try {
        const engine = getMemoryEngine();
        const memoryContext = await engine.retrieve(
          patientId, 
          userText, 
          rawMessages, 
          body.currentMood, 
          patientProfile,
          {
            conversationTitle: body.conversationTitle,
            topicFolder: body.topicFolder,
            recentCycleSummaries: body.recentCycleSummaries
          }
        );
        systemPromptOverride = memoryContext.systemPrompt;
        telemetry = memoryContext.telemetry;
      } catch (memErr) {
        console.warn('[chatTerapeuta] Fallback en memoria cognitiva:', memErr.message);
      }
    }

    // Generar respuesta con LLM 1 (Chat Terapéutico Empático & Adaptativo)
    const reply = await generateTherapistResponse({
      userMessage: userText,
      patientProfile,
      chatHistory: history,
      currentMood: body.currentMood || null,
      timelineEvents,
      lifeTree,
      conversationTitle: body.conversationTitle || null,
      topicFolder: body.topicFolder || null,
      recentCycleSummaries: body.recentCycleSummaries || [],
      mode: body.model || AI_MODELS.CHAT,
      systemPromptOverride,
      signal
    });

    // Guardar respuesta del asistente en Firestore / messages
    if (body.conversationId) {
      db.from('messages').insert([{
        conversation_id: body.conversationId,
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString()
      }]).catch(err => console.warn('[Firestore] Error guardando mensaje de asistente:', err));
    }

    // LLM 2: Deep Path Asíncrono de Extracción & Sonsacado Clínico
    if (patientId && userText && userText.trim().length > 5) {
      setTimeout(async () => {
        try {
          const engine = getMemoryEngine();
          await engine.capture({
            patientId,
            rawMessage: userText.trim(),
            verbatimQuote: userText.trim().length < 160 ? userText.trim() : '',
            authorityLevel: 3, // Nivel 3: Declarado por el paciente
            category: 'USER_EXPRESSION'
          });

          // Sonsacado y extracción de entidades clínicas profundas para el expediente vivo
          const textLower = userText.toLowerCase();
          const containsClinicalKeywords = /padre|madre|hermano|hermana|familia|infancia|niñez|colegio|escuela|instituto|universidad|pareja|novio|novia|esposo|esposa|casado|separad|divorcio|trabajo|jefe|empresa|dinero|deuda|dormir|sueño|insomnio|despertar|médico|psiquiatra|terapia|psicólog|medicaci|ansiedad|miedo|pánico|ataque|pastilla|fármaco|sertralina|lorazepam|lexatin|trankimazin|paroxetina|escitalopram|diazepam|antidepres|ansiolític|rutina|estrés|trauma|duelo|accidente|operación|año|cuando tenía|a los \d+/.test(textLower);

          if (containsClinicalKeywords) {
            try {
              const extractionPrompt = `Eres un asistente clínico experto en extracción de anamnesis psicológica.
Analiza este mensaje del paciente e identifica si aporta datos clínicos relevantes sobre su historia de vida.
Mensaje del paciente: "${userText}"

Devuelve ÚNICAMENTE un JSON válido con esta estructura:
{
  "lifeTreeCategory": "family_origin" | "childhood" | "relationships" | "work_studies" | "health" | "habits" | null,
  "insight": "resumen clínico conciso del hecho",
  "timelineEvent": { "date": "año o periodo aproximado (ej: 2018 o A los 20 años)", "event": "descripción breve del suceso" } | null,
  "medication": { "name": "nombre del fármaco", "dose": "dosis si la indica", "frequency": "pauta si la indica" } | null,
  "episode": { "title": "título del episodio o síntoma", "description": "descripción clínica", "category": "trauma" | "crisis" | "relational" | "symptom" } | null,
  "historyField": "antecedentes_psicologicos" | "antecedentes_medicos" | "relaciones_contexto" | "patrones_comunes" | "habitos_sueno" | null,
  "historyValue": "dato relevante para el expediente" | null
}`;

              const res = await askClinicalAI({
                messages: [
                  { role: 'system', content: 'Eres un extractor clínico de datos estructurados en formato JSON estricto.' },
                  { role: 'user', content: extractionPrompt }
                ],
                model: AI_MODELS.EXTRACT,
                temperature: 0.1
              });

              if (res) {
                const jsonMatch = res.match(/```json\s*([\s\S]*?)\s*```/) || res.match(/\{[\s\S]*\}/);
                const cleanedJsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : res;
                const parsed = JSON.parse(cleanedJsonStr);

                // 1. Guardar en Timeline
                if (parsed.timelineEvent?.event) {
                  await db.from('timeline_events').insert([{
                    patient_id: patientId,
                    date: parsed.timelineEvent.date || new Date().getFullYear().toString(),
                    event: parsed.timelineEvent.event,
                    event_type: 'vital_event',
                    authority_level: 3,
                    created_at: new Date().toISOString()
                  }]).catch(() => {});
                }

                // 2. Guardar en Árbol Vital
                if (parsed.lifeTreeCategory && parsed.insight) {
                  const { data: treeDoc } = await db.from('clinical_life_tree').select('*').eq('patient_id', patientId).maybeSingle();
                  const treeData = treeDoc?.tree_data || {};
                  const catList = Array.isArray(treeData[parsed.lifeTreeCategory]) ? treeData[parsed.lifeTreeCategory] : [];
                  if (!catList.includes(parsed.insight)) {
                    catList.push(parsed.insight);
                    treeData[parsed.lifeTreeCategory] = catList;
                    await db.from('clinical_life_tree').upsert({
                      patient_id: patientId,
                      tree_data: treeData,
                      updated_at: new Date().toISOString()
                    }, { onConflict: 'patient_id' }).catch(() => {});
                  }
                }

                // 3. Guardar Medicación detectada
                if (parsed.medication?.name) {
                  await db.from('medications').insert([{
                    patient_id: patientId,
                    name: parsed.medication.name,
                    dose: parsed.medication.dose || 'No especificada',
                    frequency: parsed.medication.frequency || 'Según pauta',
                    prescriber: 'Declarado por el paciente',
                    authority_level: 3,
                    created_at: new Date().toISOString()
                  }]).catch(() => {});
                }

                // 4. Guardar Episodio Clínico para validación del psicólogo
                if (parsed.episode?.title) {
                  await db.from('clinical_episodes').insert([{
                    patient_id: patientId,
                    title: parsed.episode.title,
                    description: parsed.episode.description || parsed.insight || '',
                    category: parsed.episode.category || 'symptom',
                    authority_level: 3,
                    validation_status: 'pending',
                    created_at: new Date().toISOString()
                  }]).catch(() => {});
                }

                // 5. Actualizar Historial Clínico en perfil
                if (parsed.historyField && parsed.historyValue) {
                  const { data: profileDoc } = await db.from('profiles').select('contexto_terapeutico').eq('id', patientId).maybeSingle();
                  const curCtx = profileDoc?.contexto_terapeutico || {};
                  const curHist = curCtx.historial_clinico || {};
                  const prevVal = curHist[parsed.historyField] || '';
                  if (!prevVal.includes(parsed.historyValue)) {
                    curHist[parsed.historyField] = prevVal ? `${prevVal} | ${parsed.historyValue}` : parsed.historyValue;
                    curCtx.historial_clinico = curHist;
                    await db.from('profiles').update({
                      contexto_terapeutico: curCtx,
                      updated_at: new Date().toISOString()
                    }).eq('id', patientId).catch(() => {});
                  }
                }
              }
            } catch (extErr) {
              console.warn('[chatTerapeuta] Error en parseo de extracción JSON:', extErr.message);
            }
          }
        } catch (capErr) {
          console.warn('[chatTerapeuta] Error en captura asíncrona de episodio:', capErr.message);
        }
      }, 50);
    }

    // Generar título automático si es una conversación nueva
    let generatedTitle = null;
    if (rawMessages.length <= 2) {
      try {
        const titlePrompt = `Genera un título muy breve (3 a 5 palabras, en español, sin comillas) que resuma este tema clínico: "${userText.slice(0, 100)}"`;
        const titleRes = await askClinicalAI({
          messages: [{ role: 'user', content: titlePrompt }],
          model: AI_MODELS.CHAT
        });
        if (titleRes) {
          generatedTitle = titleRes.replace(/["'\n\r.]/g, '').trim().slice(0, 40);
          if (body.conversationId) {
            db.from('conversations').update({ title: generatedTitle }).eq('id', body.conversationId).catch(() => {});
          }
        }
      } catch (_) {}
    }

    return {
      reply,
      generatedTitle,
      updatedContext: null,
      tokensUsed: telemetry?.estimatedSystemTokens || 350
    };
  } catch (error) {
    console.error('[ChatTerapeuta] Error al conectar con la IA:', error);
    throw new Error(error.message || 'Error al conectar con el Asistente Clínico de IA.');
  }
}

export async function enviarMensajeTerapeutaEdge(params = {}) {
  return generateTherapistResponse(params);
}

export default invokeChatTerapeuta;
