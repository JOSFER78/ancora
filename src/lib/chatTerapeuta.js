/**
 * @file chatTerapeuta.js
 * @description El chat clínico de Áncora ⚓: donde se juntan memoria, guion de
 * anamnesis y protocolo de riesgo para producir un turno de conversación.
 *
 * ORDEN DE MONTAJE DEL PROMPT (importa, y mucho)
 * ---------------------------------------------
 *   1. Identidad y límites — qué es y qué no es este asistente.
 *   2. Contexto de memoria — lo que el CognitiveMemoryEngine considera
 *      relevante para lo que acaba de decir el paciente.
 *   3. Mapa de anamnesis — hacia dónde mirar si la conversación deja sitio,
 *      y lo ya sabido para que no lo repregunte.
 *   4. Protocolo de riesgo — si hay señal, manda sobre todo lo anterior.
 *
 * El riesgo va al final a propósito: es lo último que lee el modelo antes de
 * responder, y lo último pesa.
 *
 * MOTOR: Claude vía OmniRoute con streaming (`claudeService`). El gateway
 * corta a los ~120 s, así que cualquier llamada sin streaming acaba en 504
 * cuando la respuesta se alarga (D-05 de la Biblia). No hay excepciones.
 */

import { askClinicalAI, askClinicalJSON, CLINICAL_MODELS, ClinicalAIError } from '../services/claudeService.js';
import { firebaseClient as db, firebaseClient } from '../firebaseAdapter.js';
import { MemoryRepositoryFactory } from '../infrastructure/storage/MemoryRepositoryFactory.js';
import { CognitiveMemoryEngine } from '../services/memory/CognitiveMemoryEngine.js';
import { buildAnamnesisDirective } from './anamnesisGuide.js';
import { detectRisk, buildRiskDirective, buildRiskRecord, composeRiskReply, RiskLevel } from './riskProtocol.js';
import { tieneConsentimientoIA, ConsentRequiredError } from './consentimiento.js';
import { buscarRecuerdos, buildRecallDirective } from './recuerdoEspontaneo.js';
import {
  loadExpediente,
  loadConversationStats,
  persistRiskEvent,
  persistIngestionResult,
  AUTORIDAD_PACIENTE
} from './expediente.js';

let cachedMemoryEngine = null;
function getMemoryEngine() {
  if (!cachedMemoryEngine) {
    const repo = MemoryRepositoryFactory.getRepository();
    cachedMemoryEngine = new CognitiveMemoryEngine({ repository: repo });
  }
  return cachedMemoryEngine;
}

/**
 * Identidad del asistente. Se usa cuando la memoria no aporta un prompt propio.
 *
 * Deliberadamente NO pide florituras de formato. La versión anterior exigía
 * negritas, viñetas, emojis y "cierra siempre con 1 o 2 preguntas abiertas",
 * lo que contradecía de frente las reglas del guion clínico —una sola pregunta
 * por turno, turnos de 2 a 4 frases, saber callar—. Un paciente que acaba de
 * contar algo duro no necesita un informe maquetado con dos preguntas al pie.
 */
const IDENTIDAD = `Eres Áncora ⚓, el acompañamiento entre sesiones de un paciente que está en terapia con un psicólogo colegiado.

QUÉ ERES: alguien con quien hablar entre sesión y sesión. Escuchas, acompañas, ayudas a ordenar lo que pasa, y vas conociendo su historia poco a poco para que su psicólogo/a llegue a la sesión sabiendo lo que ha pasado estas semanas.

QUÉ NO ERES: no diagnosticas, no nombras trastornos (ni como hipótesis, ni con rodeos del tipo "esto suena a…"), no indicas tratamientos ni técnicas de intervención, y no sustituyes a su psicólogo/a. Cuando algo pida criterio clínico, la respuesta es que eso lo verá con él o con ella.

CÓMO HABLAS: cercano, de tú, sin jerga y sin sonar a manual. Frases cortas. Sin sermones. Nada de listas ni de texto maquetado salvo que el paciente pida algo que de verdad se entienda mejor en una lista: esto es una conversación, no un informe.

UNA SOLA PREGUNTA POR TURNO. Nunca dos. Si te interesan dos cosas, elige la que más tenga que ver con lo que acaba de decir y guarda la otra para después. Dos preguntas seguidas convierten la conversación en un interrogatorio.

TRANSPARENCIA: si te pregunta qué sabes de él, se lo dices con naturalidad y sin rodeos. Su expediente es suyo.`;

/**
 * Traduce lo que pida quien llama a un modelo que exista de verdad.
 *
 * Las vistas antiguas piden `'auto'`, `'gemini-3.5-flash-lite'` y compañía:
 * nombres del gateway anterior que en el router no existen y devolverían un
 * 404 (D-20). Cualquier valor que no sea un modelo del catálogo se ignora y se
 * usa el de conversación.
 */
function resolverModelo(pedido) {
  const catalogo = Object.values(CLINICAL_MODELS);
  return catalogo.includes(pedido) ? pedido : CLINICAL_MODELS.CHAT;
}

/**
 * Compone el prompt de sistema completo del turno.
 * @returns {{system: string, estado: Object|null, riesgo: Object}}
 */
function componerPrompt({ memoriaPrompt, anamnesis, riesgo, recuerdos = [] }) {
  const partes = [memoriaPrompt || IDENTIDAD];
  if (anamnesis?.directiva) partes.push(anamnesis.directiva);

  // Los recuerdos espontáneos SOLO cuando no hay ninguna señal de riesgo.
  // Sacarle a alguien que acaba de decir que no puede más que hoy hace dos
  // años de la muerte de su padre sería exactamente lo contrario de acompañar.
  if (riesgo.nivel === RiskLevel.NINGUNO) {
    const directivaRecuerdo = buildRecallDirective(recuerdos);
    if (directivaRecuerdo) partes.push(directivaRecuerdo);
  }

  const directivaRiesgo = buildRiskDirective(riesgo);
  if (directivaRiesgo) partes.push(directivaRiesgo);
  return partes.join('\n');
}

/**
 * Motor conversacional clínico de Áncora.
 *
 * @param {Object} body
 * @param {Function} [body.onToken]  Recibe cada fragmento según llega.
 * @param {AbortSignal} [signal]
 *
 * ⚠️ Si se pinta en vivo con `onToken`, al terminar hay que sustituir lo
 * pintado por el `reply` devuelto: cuando hay señal de riesgo, el bloque de
 * recursos se añade DESPUÉS del streaming y no viaja por `onToken`.
 */
export async function invokeChatTerapeuta(body = {}, signal = null) {
  try {
    const action = body.action || 'chat';

    if (action === 'transcribe_audio') {
      // La transcripción real vive en transcriptionService (Whisper). Esta
      // rama se conserva por compatibilidad con llamadas antiguas.
      throw new ClinicalAIError(
        'La transcripción se hace con transcribeAudio() de transcriptionService.js, no por esta vía.'
      );
    }

    if (action === 'prepare_mente_sync' || action === 'process_mente_sync_item' || action === 'consolidate_mente_sync') {
      const { content } = await askClinicalAI({
        system: 'Eres un asistente clínico que consolida material del expediente. No inventas nada que no esté en el material recibido.',
        messages: [{ role: 'user', content: `Analiza clínicamente este contenido para consolidar el perfil terapéutico del paciente: ${JSON.stringify(body.item || body.data || body)}` }],
        model: CLINICAL_MODELS.REPORT,
        signal
      });
      return { success: true, result: content };
    }

    // ---- Conversación clínica -------------------------------------------
    const rawMessages = body.messages || [];
    const lastUserMsg = [...rawMessages].reverse().find(m => m.role === 'user' || m.sender === 'user' || m.isUser);
    const userText = lastUserMsg?.content || lastUserMsg?.text || (typeof body.content === 'string' ? body.content : 'Hola');

    const history = rawMessages.slice(0, -1).map(m => ({
      role: m.role || (m.sender === 'user' ? 'user' : 'assistant'),
      content: m.content || m.text || ''
    })).filter(m => m.content);

    let patientId = body.patientId || null;
    let patientProfile = body.patientProfile || {};

    try {
      if (!patientId) {
        const { data: { user } } = await db.auth.getUser();
        if (user?.id) patientId = user.id;
      }
      if (patientId && !patientProfile?.contexto_terapeutico) {
        const { data: profile } = await firebaseClient
          .from('profiles').select('*').eq('id', patientId).maybeSingle();
        if (profile) patientProfile = { ...patientProfile, ...profile };
      }
    } catch (err) {
      console.warn('[chatTerapeuta] No se pudo cargar el perfil:', err?.message);
    }

    // 0. CONSENTIMIENTO. Antes de tratar un solo dato de salud.
    //    No es un aviso que se pueda ignorar: si no consta, no se procesa.
    //    (El modo demostración no tiene paciente real ni toca Firestore.)
    if (patientId && !(await tieneConsentimientoIA(patientId))) {
      throw new ConsentRequiredError();
    }

    // 1. RIESGO — lo primero que se mira, antes que ningún otro contexto.
    //    No espera a tener expediente cargado ni a que haya vínculo: una señal
    //    en el primer mensaje de la primera conversación se atiende igual.
    const riesgo = detectRisk(userText, { perfil: patientProfile });
    if (riesgo.nivel >= RiskLevel.MALESTAR && patientId) {
      persistRiskEvent(buildRiskRecord(riesgo, {
        patientId,
        textoOriginal: userText,
        conversationId: body.conversationId || null
      }));
    }

    // 2. Expediente y estado de la anamnesis.
    let anamnesis = null;
    let expediente = null;
    let recuerdos = [];
    if (patientId) {
      try {
        const [exp, stats] = await Promise.all([
          loadExpediente(patientId),
          loadConversationStats(patientId)
        ]);
        expediente = exp;
        anamnesis = buildAnamnesisDirective({
          expediente: exp,
          conversaciones: stats.conversaciones,
          turnosPaciente: stats.turnosPaciente,
          primeraConversacion: stats.conversaciones <= 1 && rawMessages.length <= 2
        });
        // Lo que el sistema puede recordar hoy por su cuenta: aniversarios,
        // compromisos que quedaron en el aire, recursos que ha dejado de usar.
        const episodios = await getMemoryEngine()
          .repo.getEpisodes(patientId, { limit: 40 })
          .catch(() => []);
        recuerdos = buscarRecuerdos(exp, episodios);
      } catch (err) {
        console.warn('[chatTerapeuta] Sin mapa de anamnesis en este turno:', err?.message);
      }
    }

    // 3. Memoria cognitiva (camino rápido).
    let memoriaPrompt = body.systemPromptOverride || null;
    let telemetry = body.contextoClinico || null;
    if (!memoriaPrompt && patientId) {
      try {
        const memoryContext = await getMemoryEngine().retrieve(
          patientId, userText, rawMessages, body.currentMood, patientProfile,
          {
            conversationTitle: body.conversationTitle,
            topicFolder: body.topicFolder,
            recentCycleSummaries: body.recentCycleSummaries
          }
        );
        memoriaPrompt = memoryContext.systemPrompt;
        telemetry = memoryContext.telemetry;
      } catch (memErr) {
        console.warn('[chatTerapeuta] Fallback en memoria cognitiva:', memErr.message);
      }
    }

    const system = componerPrompt({ memoriaPrompt, anamnesis, riesgo, recuerdos });

    // 4. Turno de conversación, en streaming.
    const { content: textoModelo, model: modeloUsado } = await askClinicalAI({
      system,
      messages: [...history.slice(-12), { role: 'user', content: userText }],
      model: resolverModelo(body.model),
      temperature: 0.7,
      // Un turno son 2-4 frases. El tope alto es solo para los mensajes de
      // contención de riesgo, que sí son largos por necesidad.
      maxTokens: riesgo.nivel >= RiskLevel.IDEACION ? 1200 : 700,
      signal,
      onToken: typeof body.onToken === 'function' ? body.onToken : null
    });

    // Los recursos de ayuda los pone el código, no el modelo. Medido: ante
    // "a veces pienso que sería mejor no estar" el modelo hizo la pregunta
    // correcta pero se dejó el 024 fuera. Aquí ya no puede dejárselo.
    const reply = composeRiskReply(textoModelo, riesgo);

    if (body.conversationId) {
      db.from('messages').insert([{
        conversation_id: body.conversationId,
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString()
      }]).catch(err => console.warn('[Firestore] Error guardando mensaje de asistente:', err));
    }

    // 5. Camino lento: capturar y extraer sin hacer esperar al paciente.
    if (patientId && userText && userText.trim().length > 5) {
      capturaDiferida({ patientId, userText, expediente }).catch(err =>
        console.warn('[chatTerapeuta] Captura diferida fallida:', err?.message)
      );
    }

    let generatedTitle = null;
    if (rawMessages.length <= 2) {
      generatedTitle = await generarTitulo(userText, body.conversationId, signal);
    }

    return {
      reply,
      generatedTitle,
      updatedContext: null,
      modelo: modeloUsado,
      // La brújula viaja a la interfaz: es lo que pinta la barra de madurez.
      anamnesis: anamnesis?.estado || null,
      objetivoAnamnesis: anamnesis?.objetivo || null,
      riesgo: riesgo.nivel > 0 ? { nivel: riesgo.nivel, categoria: riesgo.categoria } : null,
      recuerdosOfrecidos: recuerdos.map(r => r.tipo),
      tokensUsed: telemetry?.estimatedSystemTokens || 350
    };
  } catch (error) {
    console.error('[ChatTerapeuta] Error al conectar con la IA:', error);
    throw new Error(
      error.message || 'Error al conectar con el Asistente Clínico de IA.',
      { cause: error }
    );
  }
}

/** Título breve para una conversación nueva. */
async function generarTitulo(userText, conversationId, signal) {
  try {
    const { content } = await askClinicalAI({
      system: 'Devuelves solo un título, sin comillas ni puntuación final.',
      messages: [{ role: 'user', content: `Genera un título de 3 a 5 palabras en español que resuma este tema: "${userText.slice(0, 200)}"` }],
      model: CLINICAL_MODELS.CHAT,
      maxTokens: 40,
      signal
    });
    const titulo = String(content || '').replace(/["'\n\r.]/g, '').trim().slice(0, 40);
    if (titulo && conversationId) {
      db.from('conversations').update({ title: titulo }).eq('id', conversationId).catch(() => {});
    }
    return titulo || null;
  } catch {
    return null;
  }
}

/** Palabras que hacen probable que el mensaje traiga material clínico. */
const PISTAS_CLINICAS = /padre|madre|hermano|hermana|familia|infancia|niñez|colegio|escuela|instituto|universidad|pareja|novi[oa]|esposo|esposa|casad|separad|divorcio|trabajo|jefe|empresa|dinero|deuda|dormir|sueño|insomnio|despertar|médico|psiquiatra|terapia|psicólog|medicaci|ansiedad|miedo|pánico|ataque|pastilla|fármaco|rutina|estrés|trauma|duelo|accidente|operación|cuando tenía|a los \d+/i;

/**
 * Captura del turno y extracción estructurada, en segundo plano.
 *
 * Todo lo que se extrae aquí nace con evidencia: la cita es el propio mensaje
 * del paciente, así que la verificación es trivialmente cierta, pero el campo
 * se rellena igual para que el dato tenga el mismo formato venga de donde venga.
 */
async function capturaDiferida({ patientId, userText, expediente }) {
  const texto = userText.trim();

  await getMemoryEngine().capture({
    patientId,
    rawMessage: texto,
    verbatimQuote: texto.length < 160 ? texto : texto.slice(0, 157) + '…',
    authorityLevel: AUTORIDAD_PACIENTE,
    category: 'USER_EXPRESSION'
  });

  if (!PISTAS_CLINICAS.test(texto)) return;

  const parsed = await askClinicalJSON({
    system: 'Extraes datos clínicos de un mensaje de un paciente. No infieres, no interpretas y no etiquetas: solo recoges lo que el paciente dice de forma explícita. Si el mensaje no aporta ningún dato de su historia, devuelves todos los campos a null.',
    schemaHint: `{
  "categoria": "salud_fisica|salud_emocional|familia_y_vinculos|trabajo_y_proposito|economia_y_seguridad|identidad_y_valores|null",
  "hallazgo": "el hecho, en una frase, sin interpretar" | null,
  "valencia": "recurso|dificultad|neutro",
  "evidencia": "fragmento LITERAL del mensaje que sostiene el hallazgo",
  "evento": { "fecha": "año o etapa", "descripcion": "qué pasó" } | null,
  "medicacion": { "nombre": "", "dosis": "", "pauta": "" } | null
}`,
    messages: [{ role: 'user', content: `Mensaje del paciente:\n"""${texto}"""` }],
    model: CLINICAL_MODELS.CHAT,
    temperature: 0.1,
    maxTokens: 600
  });

  if (!parsed?.hallazgo || !parsed?.categoria) return;

  // La cita tiene que estar en el mensaje. Si el modelo la ha reescrito, se
  // usa el mensaje entero antes que dar por bueno algo que no dijo.
  const evidencia = typeof parsed.evidencia === 'string' &&
    texto.toLowerCase().includes(parsed.evidencia.toLowerCase().trim())
    ? parsed.evidencia.trim()
    : texto.slice(0, 300);

  await persistIngestionResult(patientId, {
    arbol_vital: [{
      categoria: parsed.categoria,
      hallazgo: parsed.hallazgo,
      valencia: parsed.valencia || 'neutro',
      evidencia
    }],
    eventos_timeline: parsed.evento?.descripcion
      ? [{
          fecha: parsed.evento.fecha || String(new Date().getFullYear()),
          evento: parsed.evento.descripcion,
          categoria: parsed.categoria,
          evidencia
        }]
      : []
  }, { autoridad: AUTORIDAD_PACIENTE, origen: 'chat' });

  if (parsed.medicacion?.nombre) {
    const yaConsta = (expediente?.medicaciones || []).some(
      m => String(m.name || '').toLowerCase() === String(parsed.medicacion.nombre).toLowerCase()
    );
    if (!yaConsta) {
      await db.from('medications').insert([{
        patient_id: patientId,
        name: parsed.medicacion.nombre,
        dose: parsed.medicacion.dosis || 'No especificada',
        frequency: parsed.medicacion.pauta || 'Según pauta',
        prescriber: 'Declarado por el paciente',
        evidencia,
        authority_level: AUTORIDAD_PACIENTE,
        created_at: new Date().toISOString()
      }]).catch(() => {});
    }
  }
}

/** @deprecated Se conserva para las vistas que aún la llaman; usa invokeChatTerapeuta. */
export async function enviarMensajeTerapeutaEdge(params = {}) {
  const { reply } = await invokeChatTerapeuta({
    messages: [{ role: 'user', content: params.userMessage || params.content || '' }],
    patientProfile: params.patientProfile,
    patientId: params.patientId,
    systemPromptOverride: params.systemPromptOverride
  }, params.signal || null);
  return reply;
}

export default invokeChatTerapeuta;
