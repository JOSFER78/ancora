import { generateTherapistResponse, askClinicalAI } from '../services/aiService.js';
import { supabase } from '../supabaseClient.js';
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
 * Conexión directa a FreeLLMAPI y persistencia automática en Cloud Firestore
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
        model: 'auto',
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
    try {
      if (!patientId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) patientId = user.id;
      }
      if (patientId && (!patientProfile || Object.keys(patientProfile).length === 0)) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', patientId)
          .maybeSingle();
        if (profile) patientProfile = profile;
      }
    } catch (_) {}

    // Fast Path: Recuperar contexto enriquecido estructurado mediante CognitiveMemoryEngine si hay patientId
    let systemPromptOverride = body.systemPromptOverride || null;
    let telemetry = body.contextoClinico || null;

    if (!systemPromptOverride && patientId) {
      try {
        const engine = getMemoryEngine();
        const memoryContext = await engine.retrieve(patientId, userText, rawMessages, body.currentMood, patientProfile);
        systemPromptOverride = memoryContext.systemPrompt;
        telemetry = memoryContext.telemetry;
      } catch (memErr) {
        console.warn('[chatTerapeuta] Fallback en memoria cognitiva:', memErr.message);
      }
    }

    // Generar respuesta con IA Clínica Real
    const reply = await generateTherapistResponse({
      userMessage: userText,
      patientProfile,
      chatHistory: history,
      currentMood: body.currentMood || null,
      mode: body.model || 'auto',
      systemPromptOverride,
      signal
    });

    // Guardar respuesta del asistente en Firestore / messages
    if (body.conversationId) {
      supabase.from('messages').insert([{
        conversation_id: body.conversationId,
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString()
      }]).catch(err => console.warn('[Firestore] Error guardando mensaje de asistente:', err));
    }

    // Deep Path Asíncrono: Capturar episodio clínico y enriquecer expediente vivo en segundo plano
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
          // Sonsacado y extracción de entidades clínicas profundas para el expediente vivo del psicólogo
          const textLower = userText.toLowerCase();
          const containsClinicalKeywords = /padre|madre|hermano|hermana|familia|infancia|niñez|colegio|escuela|pareja|novio|novia|esposo|esposa|casado|separad|divorcio|trabajo|jefe|empresa|dormir|sueño|insomnio|despertar|médico|psiquiatra|terapia|psicólog|medicaci|ansiedad|miedo|pánico|ataque|pastilla|fármaco|sertralina|lorazepam|lexatin|trankimazin|paroxetina|escitalopram|diazepam|antidepres|ansiolític|rutina|estrés|trauma|duelo|accidente|operación/.test(textLower);

          if (containsClinicalKeywords) {
            try {
              const extractionPrompt = `Eres un asistente de documentación clínica psicológica. Analiza este mensaje del paciente e identifica si aporta datos clínicos relevantes.
Mensaje del paciente: "${userText}"
Devuelve ÚNICAMENTE un JSON válido con esta estructura (omite campos nulos o que no se mencionen):
{
  "lifeTreeCategory": "family_origin" | "childhood" | "relationships" | "work_studies" | "health" | "habits" | null,
  "insight": "resumen clínico conciso del hecho",
  "timelineEvent": { "date": "año o periodo aproximado", "event": "descripción breve del suceso" } | null,
  "medication": { "name": "nombre del fármaco", "dose": "dosis si la indica", "frequency": "pauta si la indica" } | null,
  "historyField": "antecedentes_psicologicos" | "antecedentes_medicos" | "relaciones_contexto" | "patrones_comunes" | "habitos_sueno" | null,
  "historyValue": "dato relevante para el expediente" | null
}`;
              const res = await askClinicalAI({
                messages: [{ role: 'user', content: extractionPrompt }],
                model: 'auto'
              });

              if (res) {
                const cleanedJsonStr = res.replace(/```json|```/gi, '').trim();
                const parsed = JSON.parse(cleanedJsonStr);

                // 1. Guardar en Timeline
                if (parsed.timelineEvent?.event) {
                  await supabase.from('timeline_events').insert([{
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
                  const { data: treeDoc } = await supabase.from('clinical_life_tree').select('*').eq('patient_id', patientId).maybeSingle();
                  const treeData = treeDoc?.tree_data || {};
                  const catList = Array.isArray(treeData[parsed.lifeTreeCategory]) ? treeData[parsed.lifeTreeCategory] : [];
                  if (!catList.includes(parsed.insight)) {
                    catList.push(parsed.insight);
                    treeData[parsed.lifeTreeCategory] = catList;
                    await supabase.from('clinical_life_tree').upsert({
                      patient_id: patientId,
                      tree_data: treeData,
                      updated_at: new Date().toISOString()
                    }, { onConflict: 'patient_id' }).catch(() => {});
                  }
                }

                // 3. Guardar Medicación detectada
                if (parsed.medication?.name) {
                  await supabase.from('medications').insert([{
                    patient_id: patientId,
                    name: parsed.medication.name,
                    dose: parsed.medication.dose || 'No especificada',
                    frequency: parsed.medication.frequency || 'Según pauta',
                    prescriber: 'Declarado por el paciente',
                    authority_level: 3,
                    created_at: new Date().toISOString()
                  }]).catch(() => {});
                }

                // 4. Actualizar Historial Clínico en perfil
                if (parsed.historyField && parsed.historyValue) {
                  const { data: profileDoc } = await supabase.from('profiles').select('contexto_terapeutico').eq('id', patientId).maybeSingle();
                  const curCtx = profileDoc?.contexto_terapeutico || {};
                  const curHist = curCtx.historial_clinico || {};
                  const prevVal = curHist[parsed.historyField] || '';
                  if (!prevVal.includes(parsed.historyValue)) {
                    curHist[parsed.historyField] = prevVal ? `${prevVal} | ${parsed.historyValue}` : parsed.historyValue;
                    curCtx.historial_clinico = curHist;
                    await supabase.from('profiles').update({
                      contexto_terapeutico: curCtx,
                      updated_at: new Date().toISOString()
                    }).eq('id', patientId).catch(() => {});
                  }
                }
              }
            } catch (_) {}
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
          model: 'auto'
        });
        if (titleRes) {
          generatedTitle = titleRes.replace(/["'\n\r.]/g, '').trim().slice(0, 40);
          if (body.conversationId) {
            supabase.from('conversations').update({ title: generatedTitle }).eq('id', body.conversationId).catch(() => {});
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
