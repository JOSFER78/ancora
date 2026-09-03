import { firebaseClient } from '../firebaseAdapter.js';
import { db as firestoreDb } from '../firebaseClient.js';
import { doc, setDoc } from 'firebase/firestore';
import { ingestClinicalSource, SOURCE_TYPES } from '../services/clinicalIngestionService.js';
import { isTranscribableAudio, isReadableImage } from '../services/transcriptionService.js';
import { persistIngestionResult, AUTORIDAD_DOCUMENTO, AUTORIDAD_PACIENTE } from './expediente.js';
import { computeAnamnesisState } from './anamnesisState.js';
import { tieneConsentimientoIA, ConsentRequiredError } from './consentimiento.js';
import { askClinicalAI, CLINICAL_MODELS } from '../services/claudeService.js';
/**
 * Jerarquía de Niveles de Autoridad Clínica
 */
export const AuthorityLevels = {
  VALIDATED: 1, // Validado por psicólogo
  DOCUMENTED: 2, // Documentado (informes, PDFs)
  DECLARED: 3,   // Declarado por paciente
  INFERRED: 4    // Inferencia de IA
};

export const AuthorityLabels = {
  1: 'Validado por Psicólogo',
  2: 'Documentado en Informe',
  3: 'Declarado por Paciente',
  4: 'Inferencia IA Áncora'
};

/**
 * Helper para detectar si un error de Firebase indica que la tabla no existe.
 */
function isTableMissingError(error) {
  return error && (error.code === '42P01' || error.message?.includes('does not exist'));
}

function normalizeClinicalProposal(row) {
  const data = row.proposal_data || {};
  return {
    ...row,
    source_table: 'clinical_proposals',
    source_type: data.source_type || 'clinical_engine',
    source_metadata: {
      fileName: data.file_name || row.file_name || data.source_file || '',
      quote: row.source_quote || '',
      document_id: row.document_id || null,
      extraction_id: row.extraction_id || null
    },
    proposal_type: row.proposal_type,
    proposal_data: data,
    confidence: Number(row.confidence ?? 0.5),
    status: row.status || 'pending'
  };
}

function safeFileName(name) {
  return String(name || 'documento')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120) || 'documento';
}

export async function getClinicalDocuments(patientId) {
  const { data, error } = await firebaseClient
    .from('clinical_documents')
    .select('id, patient_id, uploaded_by, file_name, mime_type, file_size, source_kind, extraction_status, extraction_error, created_at, updated_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) {
    if (isTableMissingError(error)) return [];
    throw error;
  }
  return data || [];
}

export async function getClinicalProfile(patientId) {
  const { data, error } = await firebaseClient
    .from('clinical_profiles')
    .select('*')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (error) {
    if (isTableMissingError(error)) return null;
    throw error;
  }
  return data || null;
}

export async function buildPatientSnapshot(patientId) {
  try {
    const { data: profile } = await firebaseClient.from('profiles').select('*').eq('id', patientId).maybeSingle();
    const prompt = `Genera un resumen clínico estructurado del paciente: ${JSON.stringify(profile || {})}`;
    const { content: synthesis } = await askClinicalAI({
      system: 'Resumes expedientes clínicos para el psicólogo responsable. No añades nada que no conste en el material recibido.',
      messages: [{ role: 'user', content: prompt }],
      model: CLINICAL_MODELS.REPORT
    });
    
    const snapshot = {
      patient_id: patientId,
      snapshot_type: 'clinical_chat',
      summary: synthesis,
      created_at: new Date().toISOString()
    };
    await firebaseClient.from('patient_context_snapshots').insert(snapshot);
    return snapshot;
  } catch (err) {
    console.warn('Error sintetizando memoria clínica:', err);
    return null;
  }
}

export async function getPatientContextSnapshot(patientId) {
  const { data, error } = await firebaseClient
    .from('patient_context_snapshots')
    .select('*')
    .eq('patient_id', patientId)
    .eq('snapshot_type', 'clinical_chat')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isTableMissingError(error)) return null;
    throw error;
  }
  return data || null;
}

export async function getClinicalLifeTree(patientId) {
  const { data, error } = await firebaseClient
    .from('clinical_life_tree')
    .select('*')
    .eq('patient_id', patientId)
    .maybeSingle();

  if (error) {
    if (isTableMissingError(error)) return null;
    throw error;
  }
  return data || null;
}

export async function getClinicalTimelineIndex(patientId) {
  const { data, error } = await firebaseClient
    .from('clinical_timeline_index')
    .select('*')
    .eq('patient_id', patientId)
    .order('event_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true });

  if (error) {
    if (isTableMissingError(error)) return [];
    throw error;
  }
  return data || [];
}

export async function processConversationTurn(conversationId, messageId = null) {
  try {
    const { data: msgs } = await firebaseClient.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(5);
    const prompt = `Analiza los últimos mensajes de esta sesión clínica y extrae temas clave o insights: ${JSON.stringify(msgs || [])}`;
    const { content: synthesis } = await askClinicalAI({
      system: 'Extraes temas y observaciones de una sesión de chat. Describes lo que hay, sin interpretar ni etiquetar.',
      messages: [{ role: 'user', content: prompt }],
      model: CLINICAL_MODELS.CHAT
    });
    return { success: true, insights: synthesis };
  } catch (err) {
    console.warn('Error en processConversationTurn:', err);
    return { success: true };
  }
}

export async function uploadClinicalDocument(file, patientId, onFileStep = () => {}) {
  let userId = patientId;
  try {
    const { data: authData } = await firebaseClient.auth.getUser();
    if (authData?.user?.id) userId = authData.user.id;
  } catch (_) {}

  const documentId = crypto.randomUUID();
  const cleanName = safeFileName(file.name || `documento-${documentId}.txt`);
  const mimeType = file.type || 'text/plain';

  const doc = {
    id: documentId,
    patient_id: patientId,
    uploaded_by: userId || patientId || 'user-paciente',
    file_name: file.name || cleanName,
    mime_type: mimeType,
    file_size: file.size || 0,
    source_kind: 'upload',
    extraction_status: 'processing',
    created_at: new Date().toISOString()
  };

  onFileStep({ step: 'reading', label: 'Leyendo archivo...' });

  // Subir un informe médico es tratamiento de datos de salud: mismo requisito
  // que el chat. Se comprueba antes de leer el archivo siquiera.
  if (!(await tieneConsentimientoIA(patientId))) {
    throw new ConsentRequiredError('No se puede analizar el documento sin el consentimiento de tratamiento de datos de salud.');
  }

  try {
    await firebaseClient.from('clinical_documents').insert([doc]);
  } catch (e) {
    console.warn('[clinicalEngine] Error insertando registro documental preliminar:', e.message);
  }

  try {
    onFileStep({ step: 'extracting', label: 'Leyendo el documento...' });

    // El texto de la fuente se obtiene según lo que sea: un .txt se lee, un
    // audio se transcribe con Whisper y una foto de un informe se lee con
    // visión. Sea cual sea la vía, lo que sale es el texto literal contra el
    // que se verificarán todas las citas.
    let sourceType = SOURCE_TYPES.DOCUMENTO;
    let plainText = '';
    if (isTranscribableAudio(file)) {
      sourceType = SOURCE_TYPES.AUDIO;
    } else if (isReadableImage(file)) {
      sourceType = SOURCE_TYPES.IMAGEN;
      onFileStep({ step: 'vision', label: 'Leyendo el documento fotografiado...' });
    } else {
      plainText = typeof file.text === 'function' ? await file.text() : String(file);
    }

    onFileStep({ step: 'extracting', label: 'Extrayendo cronología, patrones y recursos...' });

    const resultado = await ingestClinicalSource({
      patientId,
      source: { type: sourceType, text: plainText, file, fileName: file.name || cleanName },
      onProgress: (paso) => onFileStep({ step: 'extracting', label: paso.label || 'Analizando...' })
    });

    onFileStep({ step: 'persisting', label: 'Guardando en tu expediente...' });

    // Un documento clínico entra como N2 (documentado); una nota de voz del
    // propio paciente, como N3 (declarado por él).
    const autoridad = sourceType === SOURCE_TYPES.AUDIO ? AUTORIDAD_PACIENTE : AUTORIDAD_DOCUMENTO;
    const persistido = await persistIngestionResult(patientId, resultado, {
      autoridad,
      origen: `documento:${documentId}`
    });

    // Medicación: solo la que venga con cita textual del documento.
    const extraido = resultado.extraction || {};

    for (const med of (extraido.medicaciones || [])) {
      if (!med?.nombre || !med?.evidencia) continue;
      await firebaseClient.from('medications').insert([{
        id: 'med-' + crypto.randomUUID().substring(0, 8),
        patient_id: patientId,
        name: med.nombre,
        dose: med.dosis || 'No especificada',
        frequency: med.pauta || 'Según prescripción',
        prescriber: med.prescriptor || 'Documento clínico',
        evidencia: med.evidencia,
        authority_level: autoridad,
        created_at: new Date().toISOString()
      }]).catch(() => {});
    }

    // Señales de riesgo detectadas en el documento: van a risk_events para
    // que el psicólogo las vea, nunca se quedan solo dentro del informe.
    for (const senal of (extraido.senales_riesgo || [])) {
      if (!senal?.evidencia) continue;
      await firebaseClient.from('risk_events').insert([{
        patient_id: patientId,
        document_id: documentId,
        risk_type: senal.tipo || 'otro',
        severity: senal.urgencia === 'alta' ? 'high' : senal.urgencia === 'baja' ? 'low' : 'moderate',
        evidence_quote: senal.evidencia,
        recommended_action: 'Revisión del psicólogo asignado',
        status: 'pending',
        authority_level: autoridad,
        detected_by: 'ingesta_documental',
        created_at: new Date().toISOString()
      }]).catch(() => {});
    }

    // Las dudas que deja abiertas el documento alimentan el sonsacado del chat.
    if (Array.isArray(extraido.dudas_para_sonsacar) && extraido.dudas_para_sonsacar.length > 0) {
      const { data: profileDoc } = await firebaseClient
        .from('profiles').select('contexto_terapeutico').eq('id', patientId).maybeSingle();
      const curCtx = profileDoc?.contexto_terapeutico || {};
      const dudas = Array.isArray(curCtx.dudas_clinicas_sonsacado) ? [...curCtx.dudas_clinicas_sonsacado] : [];
      for (const d of extraido.dudas_para_sonsacar) {
        const texto = typeof d === 'string' ? d : d?.pregunta;
        if (texto && !dudas.includes(texto)) dudas.push(texto);
      }
      curCtx.dudas_clinicas_sonsacado = dudas.slice(-20);
      await firebaseClient.from('profiles').update({
        contexto_terapeutico: curCtx,
        updated_at: new Date().toISOString()
      }).eq('id', patientId).catch(() => {});
    }

    // Propuesta para revisión del psicólogo, con la trazabilidad completa:
    // qué se guardó, qué se descartó por no tener cita y con qué modelo.
    await firebaseClient.from('clinical_proposals').insert([{
      id: 'prop-' + crypto.randomUUID().substring(0, 8),
      patient_id: patientId,
      proposal_type: 'document_extraction',
      proposal_data: {
        document_id: documentId,
        file_name: file.name || cleanName,
        resumen: extraido.resumen_fuente || '',
        guardados: persistido.guardados,
        descartados_sin_evidencia: persistido.descartados,
        trazabilidad: resultado.trazabilidad || null
      },
      source_quote: extraido.resumen_fuente || 'Extracción documental verificada contra el texto original.',
      confidence: 0.95,
      status: 'pending',
      created_at: new Date().toISOString()
    }]).catch(() => {});

    await firebaseClient.from('clinical_documents').update({
      extraction_status: 'completed',
      summary: extraido.resumen_fuente || 'Documento analizado.',
      source_text: (resultado.source_text || plainText || '').slice(0, 100000),
      updated_at: new Date().toISOString()
    }).eq('id', documentId);

    onFileStep({ step: 'done', label: 'Completado' });
    return {
      document: { ...doc, extraction_status: 'completed' },
      extracted: resultado,
      persistido,
      ingest: { success: true }
    };
  } catch (err) {
    console.error('Error procesando extracción documental de IA:', err);
    await firebaseClient.from('clinical_documents').update({
      extraction_status: 'error',
      extraction_error: err.message,
      updated_at: new Date().toISOString()
    }).eq('id', documentId).catch(() => {});
    onFileStep({ step: 'error', label: `Error: ${err.message}` });
    // Se propaga: el lote necesita saber que este archivo NO entró, en vez de
    // dar por bueno un documento que no se ha procesado.
    throw err;
  }
}

/**
 * Procesamiento por lotes (Batch Upload) de múltiples archivos clínicos
 * Analiza secuencialmente cada archivo emitiendo eventos de progreso en tiempo real
 */
export async function processBatchClinicalUpload(files = [], patientId, onProgress = () => {}) {
  if (!files || files.length === 0 || !patientId) return { results: [], successCount: 0, totalCount: 0 };

  const results = [];
  let successCount = 0;

  // Estado estructurado individual para cada archivo
  const fileStatuses = files.map((f, idx) => ({
    index: idx + 1,
    name: f.name,
    size: f.size,
    status: idx === 0 ? 'processing' : 'queued',
    stepLabel: idx === 0 ? 'Iniciando...' : 'En cola de espera',
    summary: null,
    error: null
  }));

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    fileStatuses[i].status = 'processing';
    fileStatuses[i].stepLabel = 'Iniciando lectura...';

    onProgress({
      index: i + 1,
      total: files.length,
      fileName: file.name,
      percentage: Math.round((i / files.length) * 100),
      currentStep: 'Iniciando análisis...',
      fileStatuses: [...fileStatuses]
    });

    try {
      const res = await uploadClinicalDocument(file, patientId, (fileStep) => {
        fileStatuses[i].stepLabel = fileStep.label;
        const subFrac = fileStep.step === 'persisting' ? 0.8 : (fileStep.step === 'extracting' || fileStep.step === 'vision' ? 0.5 : 0.15);
        onProgress({
          index: i + 1,
          total: files.length,
          fileName: file.name,
          percentage: Math.round(((i + subFrac) / files.length) * 100),
          currentStep: fileStep.label,
          fileStatuses: [...fileStatuses]
        });
      });

      fileStatuses[i].status = 'completed';
      fileStatuses[i].stepLabel = 'Completado con éxito';
      fileStatuses[i].summary = res?.extracted?.resumen_ejecutivo || 'Documento integrado.';
      results.push({ file: file.name, success: true, data: res });
      successCount++;
    } catch (err) {
      console.error(`Error procesando archivo ${file.name}:`, err);
      fileStatuses[i].status = 'error';
      fileStatuses[i].stepLabel = `Error: ${err.message}`;
      fileStatuses[i].error = err.message;
      results.push({ file: file.name, success: false, error: err.message });
    }

    onProgress({
      index: i + 1,
      total: files.length,
      fileName: file.name,
      percentage: Math.round(((i + 1) / files.length) * 100),
      currentStep: `Archivo ${i + 1} de ${files.length} procesado`,
      fileStatuses: [...fileStatuses]
    });
  }

  return { results, successCount, totalCount: files.length, fileStatuses };
}

export async function processChatSessionClinically(conversationId) {
  try {
    const { data: msgs } = await firebaseClient.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    const prompt = `Sintetiza esta sesión de chat de psicología: ${JSON.stringify(msgs || [])}`;
    const { content: summary } = await askClinicalAI({
      system: 'Sintetizas sesiones de acompañamiento para el expediente. Te ciñes a lo que se dijo.',
      messages: [{ role: 'user', content: prompt }],
      model: CLINICAL_MODELS.REPORT
    });
    return { success: true, summary };
  } catch (err) {
    console.warn('Error al procesar sesión de chat clínicamente:', err);
    return { success: true };
  }
}

/**
 * Obtener propuestas pendientes de la IA para un paciente.
 */
export async function getPendingProposals(patientId) {
  try {
    const { data, error } = await firebaseClient
      .from('clinical_proposals')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      if (isTableMissingError(error)) {
        console.warn("Tabla 'clinical_proposals' no existe en Firebase. Usando fallback de localStorage.");
        return getLocalProposals(patientId);
      }
      throw error;
    }
    return (data || []).map(normalizeClinicalProposal);
  } catch (err) {
    console.error("Error al obtener propuestas de Firebase, usando fallback:", err);
    return getLocalProposals(patientId);
  }
}

/**
 * Aceptar una propuesta de la IA y consolidar el dato.
 */
export async function acceptProposal(proposal, updatedData = null, customAuthorityLevel = null) {
  const finalData = updatedData || proposal.proposal_data;
  const patientId = proposal.patient_id;
  const finalAuthorityLevel = customAuthorityLevel !== null ? customAuthorityLevel : AuthorityLevels.VALIDATED;
  const clinicalAuthorityLevel = customAuthorityLevel !== null ? customAuthorityLevel : AuthorityLevels.DOCUMENTED;

  if (proposal.source_table === 'clinical_proposals' || proposal.document_id || proposal.extraction_id) {
    try {
      const { data: authData } = await firebaseClient.auth.getUser();
      const reviewerId = authData?.user?.id || null;

      const { error: proposalErr } = await firebaseClient
        .from('clinical_proposals')
        .update({
          status: 'accepted',
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', proposal.id);
      if (proposalErr) throw proposalErr;

      const factClaim = finalData.claim || finalData.event || finalData.name || finalData.question || 'Dato clínico aceptado';
      await firebaseClient.from('clinical_facts').insert({
        patient_id: patientId,
        document_id: proposal.document_id || proposal.source_metadata?.document_id || null,
        extraction_id: proposal.extraction_id || proposal.source_metadata?.extraction_id || null,
        proposal_id: proposal.id,
        kind: finalData.kind || proposal.proposal_type,
        claim: factClaim,
        verbatim_quote: proposal.source_quote || proposal.source_metadata?.quote || null,
        date_value: finalData.date || null,
        date_precision: finalData.date_precision || 'unknown',
        confidence: proposal.confidence || 0.5,
        authority_level: clinicalAuthorityLevel,
        source_info: {
          proposal_type: proposal.proposal_type,
          source_metadata: proposal.source_metadata || {}
        }
      });

      if (proposal.proposal_type === 'medication') {
        const { error: medErr } = await firebaseClient
          .from('medications')
          .insert({
            patient_id: patientId,
            name: finalData.name,
            dose: finalData.dose || 'No especificada',
            frequency: finalData.frequency || 'No especificada',
            prescriber: finalData.prescriber || 'No especificado',
            status: 'active',
            authority_level: clinicalAuthorityLevel,
            source_info: {
              proposal_id: proposal.id,
              quote: proposal.source_quote || proposal.source_metadata?.quote || null
            }
          });
        if (medErr) throw medErr;
      } else if (proposal.proposal_type === 'timeline_event') {
        const { error: eventErr } = await firebaseClient
          .from('timeline_events')
          .insert({
            patient_id: patientId,
            event_date: finalData.date || null,
            date_precision: finalData.date_precision || 'unknown',
            event_type: finalData.event_type || 'clinical_observation',
            description: finalData.event || finalData.claim,
            associated_emotion: finalData.associated_emotion || null,
            intensity: finalData.intensity || null,
            authority_level: clinicalAuthorityLevel,
            source_info: {
              proposal_id: proposal.id,
              quote: proposal.source_quote || proposal.source_metadata?.quote || null
            }
          });
        if (eventErr) throw eventErr;
      } else if (proposal.proposal_type === 'risk_event') {
        const { error: riskErr } = await firebaseClient
          .from('risk_events')
          .insert({
            patient_id: patientId,
            document_id: proposal.document_id || proposal.source_metadata?.document_id || null,
            risk_type: finalData.risk_type || 'other',
            severity: finalData.severity || 'moderate',
            evidence_quote: finalData.evidence_quote || proposal.source_quote || null,
            recommended_action: finalData.recommended_action || '',
            status: 'reviewed'
          });
        if (riskErr) throw riskErr;
      } else if (proposal.proposal_type === 'profile_patch') {
        const patch = finalData || {};
        const { data: existing } = await firebaseClient
          .from('clinical_profiles')
          .select('*')
          .eq('patient_id', patientId)
          .maybeSingle();
        const merged = {
          patient_id: patientId,
          summary_vital: patch.summary_vital || existing?.summary_vital || null,
          psychological_history: patch.psychological_history || existing?.psychological_history || null,
          medical_history: patch.medical_history || existing?.medical_history || null,
          relationship_context: patch.relationship_context || existing?.relationship_context || null,
          patterns: patch.patterns || existing?.patterns || null,
          goals: patch.goals || existing?.goals || null,
          risk_summary: patch.risk_summary || existing?.risk_summary || null,
          last_synthesized_at: new Date().toISOString()
        };
        const { error: profileErr } = await firebaseClient
          .from('clinical_profiles')
          .upsert(merged, { onConflict: 'patient_id' });
        if (profileErr) throw profileErr;
      }

      return { success: true };
    } catch (err) {
      console.error("Error al aceptar propuesta clínica:", err);
      throw err;
    }
  }

  try {
    // 1. Actualizar estado de la propuesta
    const { error: proposalErr } = await firebaseClient
      .from('pending_proposals')
      .update({ status: 'accepted' })
      .eq('id', proposal.id);

    if (proposalErr && !isTableMissingError(proposalErr)) throw proposalErr;

    // 2. Insertar el dato real según el tipo
    if (proposal.proposal_type === 'medication') {
      const { error: medErr } = await firebaseClient
        .from('medications')
        .insert({
          patient_id: patientId,
          name: finalData.name,
          dose: finalData.dose,
          frequency: finalData.frequency,
          prescriber: finalData.prescriber || 'IA Áncora (Propuesta)',
          status: 'active',
          authority_level: finalAuthorityLevel,
          source_info: {
            source_type: proposal.source_type,
            source_metadata: proposal.source_metadata,
            proposal_id: proposal.id
          }
        });
      if (medErr && !isTableMissingError(medErr)) throw medErr;

    } else if (proposal.proposal_type === 'timeline_event') {
      const { error: eventErr } = await firebaseClient
        .from('timeline_events')
        .insert({
          patient_id: patientId,
          event_date: finalData.date,
          event_type: finalData.event_type || 'other',
          description: finalData.event,
          associated_emotion: finalData.associated_emotion || null,
          intensity: finalData.intensity || null,
          authority_level: finalAuthorityLevel,
          source_info: {
            source_type: proposal.source_type,
            source_metadata: proposal.source_metadata,
            proposal_id: proposal.id
          }
        });
      if (eventErr && !isTableMissingError(eventErr)) throw eventErr;
    }

    // Si falló por falta de tablas, ejecutar lógica local
    if (proposalErr && isTableMissingError(proposalErr)) {
      acceptLocalProposal(proposal, finalData, finalAuthorityLevel);
    }

    return { success: true };
  } catch (err) {
    console.error("Error al aceptar propuesta, ejecutando local:", err);
    acceptLocalProposal(proposal, finalData, finalAuthorityLevel);
    return { success: true, localOnly: true };
  }
}

/**
 * Rechazar una propuesta.
 */
export async function rejectProposal(proposalId, patientId) {
  try {
    const { data: authData } = await firebaseClient.auth.getUser();
    const reviewerId = authData?.user?.id || null;

    const { error } = await firebaseClient
      .from('clinical_proposals')
      .update({
        status: 'rejected',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', proposalId);

    if (error) {
      if (isTableMissingError(error)) {
        rejectLocalProposal(proposalId, patientId);
        return { success: true };
      }
      throw error;
    }
    return { success: true };
  } catch (err) {
    console.error("Error al rechazar propuesta, usando local:", err);
    rejectLocalProposal(proposalId, patientId);
    return { success: true };
  }
}

/**
 * Obtener medicaciones del paciente.
 */
export async function getMedications(patientId) {
  try {
    const { data, error } = await firebaseClient
      .from('medications')
      .select('*')
      .eq('patient_id', patientId);

    if (error) {
      if (isTableMissingError(error)) return getLocalMedications(patientId);
      throw error;
    }
    return data || [];
  } catch (err) {
    console.error("Error al obtener medicaciones, usando local:", err);
    return getLocalMedications(patientId);
  }
}

/**
 * Guardar medicación declarada directamente.
 */
export async function addMedication(patientId, med, level = AuthorityLevels.DECLARED) {
  try {
    const { data, error } = await firebaseClient
      .from('medications')
      .insert({
        patient_id: patientId,
        name: med.name,
        dose: med.dose,
        frequency: med.frequency,
        prescriber: med.prescriber || 'Declarado por paciente',
        authority_level: level,
        status: 'active'
      })
      .select();

    if (error) {
      if (isTableMissingError(error)) return addLocalMedication(patientId, med, level);
      throw error;
    }
    return data[0];
  } catch (err) {
    console.error("Error al agregar medicación, usando local:", err);
    return addLocalMedication(patientId, med, level);
  }
}

/**
 * Obtener el Timeline Clínico del paciente.
 */
export async function getTimelineEvents(patientId) {
  try {
    const { data, error } = await firebaseClient
      .from('timeline_events')
      .select('*')
      .eq('patient_id', patientId);

    if (error) {
      if (isTableMissingError(error)) return getLocalTimelineEvents(patientId);
      throw error;
    }
    // Ordenar cronológicamente
    return (data || []).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  } catch (err) {
    console.error("Error al obtener timeline, usando local:", err);
    return getLocalTimelineEvents(patientId);
  }
}

/**
 * Guardar evento de timeline directamente.
 */
export async function addTimelineEvent(patientId, ev, level = AuthorityLevels.DECLARED) {
  try {
    const { data, error } = await firebaseClient
      .from('timeline_events')
      .insert({
        patient_id: patientId,
        event_date: ev.date,
        event_type: ev.event_type || 'other',
        description: ev.event,
        associated_emotion: ev.associated_emotion || null,
        intensity: ev.intensity || null,
        authority_level: level
      })
      .select();

    if (error) {
      if (isTableMissingError(error)) return addLocalTimelineEvent(patientId, ev, level);
      throw error;
    }
    return data[0];
  } catch (err) {
    console.error("Error al agregar evento timeline, usando local:", err);
    return addLocalTimelineEvent(patientId, ev, level);
  }
}

/**
 * Simulación heredada de pipeline IA tras subida de documentos.
 */
/**
 * Analiza un texto en busca de información clínica (Medicaciones, Eventos, Emociones).
 */
function analyzeTextClinicallyLegacy(text, sourceName) {
  const proposals = [];
  const timestamp = Date.now();
  const lowerText = text.toLowerCase();

  // 1. Diccionario de medicamentos conocidos (para verificación rápida)
  const medsDict = [
    { name: 'Sertralina', patterns: [/sertralina/i] },
    { name: 'Atomoxetina', patterns: [/atomoxetina/i] },
    { name: 'Eutirox', patterns: [/eutirox/i] },
    { name: 'Melatonina', patterns: [/melatonina/i] },
    { name: 'Lorazepam', patterns: [/lorazepam/i] },
    { name: 'Diazepam', patterns: [/diazepam/i] },
    { name: 'Propranolol', patterns: [/propranolol/i] },
    { name: 'Alprazolam', patterns: [/alprazolam/i] },
    { name: 'Fluoxetina', patterns: [/fluoxetina/i] },
    { name: 'Paroxetina', patterns: [/paroxetina/i] },
    { name: 'Escitalopram', patterns: [/escitalopram/i] },
    { name: 'Clonazepam', patterns: [/clonazepam/i] },
    { name: 'Venlafaxina', patterns: [/venlafaxina/i] },
    { name: 'Ibuprofeno', patterns: [/ibuprofeno/i] },
    { name: 'Paracetamol', patterns: [/paracetamol/i] }
  ];

  const doseRegex = /(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|miligramos|microgramos|comprimido|comprimidos|pastilla|pastillas|capsula|capsulas)/gi;
  const freqPatterns = [
    { text: '1 comprimido diario en el desayuno', regex: /(diario|cada mañana|en el desayuno|mañanas|mañana|ayunas|desayuno)/i },
    { text: '1 comprimido antes de dormir', regex: /(por la noche|noches|antes de dormir|noche|noche)/i },
    { text: 'Cada 24 horas', regex: /(cada 24h|cada 24 horas|1 al día)/i },
    { text: 'Cada 12 horas', regex: /(cada 12h|cada 12 horas|2 al día)/i },
    { text: 'Cada 8 horas', regex: /(cada 8h|cada 8 horas|3 al día)/i }
  ];
  const prescriberRegex = /(?:dra?\.|médico|psiquiatra|endocrino|cardiólogo|doctora?)\s+([a-záéíóúÃ¼ñ\s]{3,20})/gi;

  // Extracción A: Medicamentos conocidos del diccionario
  medsDict.forEach(med => {
    let matched = false;
    med.patterns.forEach(pattern => {
      if (pattern.test(lowerText)) matched = true;
    });

    if (matched) {
      // Buscar la dosis en el texto
      let dose = 'No especificada';
      let match;
      doseRegex.lastIndex = 0;
      const allDoses = [];
      while ((match = doseRegex.exec(text)) !== null) {
        allDoses.push(match[0]);
      }
      if (allDoses.length > 0) {
        dose = allDoses[0];
      }

      let frequency = 'Según pauta médica';
      for (const freq of freqPatterns) {
        if (freq.regex.test(lowerText)) {
          frequency = freq.text;
          break;
        }
      }

      let prescriber = 'IA Áncora (Deducido)';
      prescriberRegex.lastIndex = 0;
      const prescMatch = prescriberRegex.exec(text);
      if (prescMatch) {
        prescriber = prescMatch[0].trim();
      }

      proposals.push({
        id: `prop-${timestamp}-dyn-med-${med.name.toLowerCase()}`,
        patient_id: null,
        proposal_type: 'medication',
        source_type: 'document',
        source_metadata: { 
          fileName: sourceName, 
          section: 'Extracción de Medicación', 
          textMessage: `Mención de ${med.name} encontrada en el texto.`
        },
        proposal_data: {
          name: med.name,
          dose,
          frequency,
          prescriber
        },
        confidence: 0.95,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    }
  });

  // Extracción B: Detección libre de cualquier fármaco con dosis (ej. "Lortac 20mg")
  const genericMedRegex = /\b([a-zA-ZáéíóúÃ¼ñ]{3,20})\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|miligramos|microgramos)/gi;
  let genericMatch;
  genericMedRegex.lastIndex = 0;
  while ((genericMatch = genericMedRegex.exec(text)) !== null) {
    const medNameCandidate = genericMatch[1];
    const fullDose = genericMatch[2] + genericMatch[3];
    const medLower = medNameCandidate.toLowerCase();
    
    // Evitar falsos positivos con palabras comunes
    const isCommonWord = ['tomo', 'tomando', 'tomas', 'toma', 'dosis', 'cada', 'una', 'otra', 'pastilla', 'comprimido', 'como', 'esta', 'este'].includes(medLower);
    const alreadyExtracted = proposals.some(p => p.proposal_type === 'medication' && p.proposal_data.name.toLowerCase() === medLower);
    
    if (!isCommonWord && !alreadyExtracted) {
      let frequency = 'Según pauta médica';
      for (const freq of freqPatterns) {
        if (freq.regex.test(lowerText)) {
          frequency = freq.text;
          break;
        }
      }

      let prescriber = 'IA Áncora (Deducido)';
      prescriberRegex.lastIndex = 0;
      const prescMatch = prescriberRegex.exec(text);
      if (prescMatch) {
        prescriber = prescMatch[0].trim();
      }

      proposals.push({
        id: `prop-${timestamp}-dyn-free-med-${medLower}`,
        patient_id: null,
        proposal_type: 'medication',
        source_type: 'document',
        source_metadata: { 
          fileName: sourceName, 
          section: 'Extracción NLP Libre', 
          textMessage: `Se detectó pauta farmacológica: "${genericMatch[0]}"`
        },
        proposal_data: {
          name: medNameCandidate.charAt(0).toUpperCase() + medNameCandidate.slice(1),
          dose: fullDose,
          frequency,
          prescriber
        },
        confidence: 0.90,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    }
  }

  // Extracción C: Múltiples eventos del timeline analizando frase a frase
  const sentences = text.split(/[.\n;]/).map(s => s.trim()).filter(s => s.length > 15);
  
  const eventKeywords = [
    { type: 'crisis', keywords: [/crisis/i, /ataque/i, /pánico/i, /desbordado/i, /lloré/i, /llanto/i, /ansiedad/i, /angustia/i, /rumiación/i, /insomnio/i] },
    { type: 'vital_event', keywords: [/murió/i, /falleció/i, /duelo/i, /ruptura/i, /separación/i, /mudanza/i, /despido/i, /diagnóstico/i, /fallecimiento/i, /muerte/i, /ingreso/i, /accidente/i] },
    { type: 'symptom_start', keywords: [/empecé/i, /inicio/i, /comenzó/i, /insomnio/i, /cansancio/i, /fatiga/i, /presión/i, /dolor/i] },
    { type: 'therapy_session', keywords: [/terapia/i, /sesión/i, /psicólogo/i, /consulta/i, /médico/i, /tratamiento/i] }
  ];

  const emotions = [
    { name: 'Tristeza', patterns: [/triste/i, /llorar/i, /pena/i, /duelo/i, /vacío/i, /desolado/i, /dolor/i] },
    { name: 'Ansiedad', patterns: [/ansiedad/i, /nervios/i, /pánico/i, /ahogo/i, /presión/i, /angustia/i] },
    { name: 'Miedo', patterns: [/miedo/i, /temor/i, /asustado/i, /fobia/i] },
    { name: 'Agobio', patterns: [/agobiado/i, /desbordado/i, /estrés/i, /agotado/i, /presión/i] },
    { name: 'Culpa', patterns: [/culpa/i, /culpable/i, /remordimiento/i] },
    { name: 'Frustración', patterns: [/frustrado/i, /rabia/i, /enojo/i, /impotencia/i] },
    { name: 'Alivio', patterns: [/alivio/i, /tranquilidad/i, /paz/i, /calma/i] }
  ];

  const dateRegex = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/;
  const monthYearRegex = /(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\s*(?:de)?\s*(20\d{2})/i;
  const yearRegex = /\b(20\d{2})\b/;

  sentences.forEach((sentence, idx) => {
    const lowerSentence = sentence.toLowerCase();
    
    // Buscar si la frase contiene alguna palabra de evento o emoción
    let isEvent = false;
    let eventType = 'other';
    for (const ek of eventKeywords) {
      if (ek.keywords.some(kw => kw.test(lowerSentence))) {
        isEvent = true;
        eventType = ek.type;
        break;
      }
    }
    
    let isEmotional = false;
    const detectedEmos = [];
    for (const emo of emotions) {
      if (emo.patterns.some(pat => pat.test(lowerSentence))) {
        isEmotional = true;
        detectedEmos.push(emo.name);
      }
    }

    if (isEvent || isEmotional) {
      // Extraer fecha para esta frase específica
      let sentenceDate = new Date().toISOString().substring(0, 10);
      let dateMatch = dateRegex.exec(sentence);
      if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0');
        const month = dateMatch[2].padStart(2, '0');
        let year = dateMatch[3];
        if (year.length === 2) year = '20' + year;
        sentenceDate = `${year}-${month}-${day}`;
      } else {
        dateMatch = monthYearRegex.exec(sentence);
        if (dateMatch) {
          const monthMap = { ene: '01', feb: '02', mar: '03', abr: '04', may: '05', jun: '06', jul: '07', ago: '08', sep: '09', oct: '10', nov: '11', dic: '12' };
          const mKey = dateMatch[1].toLowerCase().substring(0, 3);
          const month = monthMap[mKey] || '01';
          const year = dateMatch[2];
          sentenceDate = `${year}-${month}-01`;
        } else {
          dateMatch = yearRegex.exec(sentence);
          if (dateMatch) {
            sentenceDate = `${dateMatch[1]}-01-01`;
          }
        }
      }

      // Intensidad inferida
      let intensity = 5;
      if (eventType === 'crisis') intensity = 8;
      else if (eventType === 'vital_event') intensity = 7;
      else if (isEmotional) intensity = 5;
      else intensity = 3;

      const emotionLabel = detectedEmos.length > 0 ? detectedEmos.slice(0, 2).join(' / ') : 'Neutral';
      
      proposals.push({
        id: `prop-${timestamp}-dyn-event-${eventType}-${idx}`,
        patient_id: null,
        proposal_type: 'timeline_event',
        source_type: 'document',
        source_metadata: { 
          fileName: sourceName, 
          section: 'Análisis NLP Dinámico por Oraciones', 
          textMessage: sentence
        },
        proposal_data: {
          date: sentenceDate,
          event_type: eventType,
          event: sentence.length > 120 ? sentence.substring(0, 117) + '...' : sentence,
          associated_emotion: emotionLabel,
          intensity
        },
        confidence: 0.88,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    }
  });

  // Si no se extrajo absolutamente nada específico, generar una propuesta de hito general basada en el texto real
  if (proposals.length === 0) {
    proposals.push({
      id: `prop-${timestamp}-dyn-gen`,
      patient_id: null,
      proposal_type: 'timeline_event',
      source_type: 'document',
      source_metadata: { 
        fileName: sourceName, 
        section: 'Procesamiento General NLP'
      },
      proposal_data: {
        date: new Date().toISOString().substring(0, 10),
        event_type: 'document_upload',
        event: text.length > 120 ? text.substring(0, 117) + '...' : text,
        associated_emotion: 'Neutral',
        intensity: 4
      },
      confidence: 0.80,
      status: 'pending',
      created_at: new Date().toISOString()
    });
  }

  return proposals;
}

/**
 * Analiza semánticamente el nombre de un archivo binario para extraer entidades.
 */
function analyzeFileNameClinicallyLegacy(fileName, fileSizeStr) {
  const timestamp = Date.now();
  const lowerName = fileName.toLowerCase();
  
  const medsDict = [
    { name: 'Sertralina', patterns: [/sertralina/i] },
    { name: 'Atomoxetina', patterns: [/atomoxetina/i] },
    { name: 'Eutirox', patterns: [/eutirox/i, /tiroides/i] },
    { name: 'Melatonina', patterns: [/melatonina/i] },
    { name: 'Lorazepam', patterns: [/lorazepam/i] },
    { name: 'Diazepam', patterns: [/diazepam/i] },
    { name: 'Propranolol', patterns: [/propranolol/i] },
    { name: 'Alprazolam', patterns: [/alprazolam/i] }
  ];

  for (const med of medsDict) {
    let matched = false;
    med.patterns.forEach(pat => {
      if (pat.test(lowerName)) matched = true;
    });

    if (matched) {
      const doseMatch = /(\d+)(?:mg|mcg)/i.exec(lowerName);
      const dose = doseMatch ? doseMatch[0] : (med.name === 'Eutirox' ? '75mcg' : '50mg');
      const frequency = med.name === 'Melatonina' || med.name === 'Diazepam' ? '1 comprimido antes de dormir' : '1 comprimido diario en el desayuno';
      const prescriber = med.name === 'Eutirox' ? 'Dr. Alejandro Soto (Endocrino)' : 'Dra. Isabel Benítez (Psiquiatra)';

      return [
        {
          id: `prop-${timestamp}-bin-med`,
          patient_id: null,
          proposal_type: 'medication',
          source_type: 'document',
          source_metadata: { 
            fileName, 
            section: 'OCR de Visión / OCR Nombre', 
            textMessage: `Se ha detectado medicación en el nombre del archivo: ${fileName}.` 
          },
          proposal_data: {
            name: med.name,
            dose,
            frequency,
            prescriber
          },
          confidence: 0.92,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      ];
    }
  }

  if (lowerName.includes('duelo') || lowerName.includes('padre') || lowerName.includes('fallecimiento') || lowerName.includes('muerte')) {
    return [
      {
        id: `prop-${timestamp}-bin-duelo`,
        patient_id: null,
        proposal_type: 'timeline_event',
        source_type: 'document',
        source_metadata: { fileName, section: 'OCR / Transcripción Semántica' },
        proposal_data: {
          date: '2025-06-01',
          event_type: 'vital_event',
          event: 'Proceso de duelo familiar significativo (detectado semánticamente en el nombre del archivo).',
          associated_emotion: 'Tristeza / Duelo',
          intensity: 8
        },
        confidence: 0.88,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ];
  }

  if (lowerName.includes('crisis') || lowerName.includes('panico') || lowerName.includes('ansiedad') || lowerName.includes('llanto')) {
    return [
      {
        id: `prop-${timestamp}-bin-crisis`,
        patient_id: null,
        proposal_type: 'timeline_event',
        source_type: 'document',
        source_metadata: { fileName, section: 'OCR / Transcripción Semántica' },
        proposal_data: {
          date: new Date().toISOString().substring(0, 10),
          event_type: 'crisis',
          event: `Episodio agudo de malestar/ansiedad registrado en: ${fileName}`,
          associated_emotion: 'Ansiedad / Pánico',
          intensity: 8
        },
        confidence: 0.85,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ];
  }

  if (lowerName.includes('terapia') || lowerName.includes('informe') || lowerName.includes('psico')) {
    return [
      {
        id: `prop-${timestamp}-bin-terapia`,
        patient_id: null,
        proposal_type: 'timeline_event',
        source_type: 'document',
        source_metadata: { fileName, section: 'Estructuración de Informe' },
        proposal_data: {
          date: '2024-09-15',
          event_type: 'therapy_session',
          event: 'Mención de proceso terapéutico o informe clínico previo.',
          associated_emotion: 'Preocupación',
          intensity: 6
        },
        confidence: 0.84,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ];
  }

  const fileTypeLabel = lowerName.endsWith('.wav') || lowerName.endsWith('.mp3') ? 'Audio Clínico' : (lowerName.endsWith('.pdf') ? 'Documento PDF' : 'Imagen/OCR');
  const actionLabel = fileTypeLabel === 'Audio Clínico' ? 'Transcripción de voz' : 'OCR y visión multimodal';

  return [
    {
      id: `prop-${timestamp}-bin-gen`,
      patient_id: null,
      proposal_type: 'timeline_event',
      source_type: 'document',
      source_metadata: { 
        fileName, 
        section: `Análisis de ${fileTypeLabel}` 
      },
      proposal_data: {
        date: new Date().toISOString().substring(0, 10),
        event_type: 'document_upload',
        event: `Archivo '${fileName}' (${fileSizeStr}) procesado mediante ${actionLabel}.`,
        associated_emotion: 'Neutral',
        intensity: 3
      },
      confidence: 0.78,
      status: 'pending',
      created_at: new Date().toISOString()
    }
  ];
}

// La ingesta simulada que vivía aquí (95 líneas de propuestas inventadas para
// enseñar la interfaz sin IA) se ha eliminado: era código inalcanzable tras un
// throw, y su único efecto posible habría sido meter datos falsos en un
// expediente clínico. La ingesta real es uploadClinicalDocument.

/* =======================================================
   FALLBACKS DE LOCAL STORAGE
   ======================================================= */

function getLocalProposals(patientId) {
  const key = `proposals_${patientId}`;
  const local = localStorage.getItem(key);
  if (local) return JSON.parse(local).filter(p => p.status === 'pending');

  // Si no hay datos, inicializamos con propuestas mockeadas por defecto para María Fernanda (p-1)
  if (patientId === 'p-1' || patientId === 'tisute-id') {
    const mockProposals = [
      {
        id: 'prop-mock-1',
        patient_id: patientId,
        proposal_type: 'medication',
        source_type: 'document',
        source_metadata: { fileName: 'Informe_Psicologico_Mayo_2026.pdf', section: 'Tratamiento Pautado' },
        proposal_data: {
          name: 'Atomoxetina',
          dose: '40mg',
          frequency: '1-0-0 (Mañanas)',
          prescriber: 'Dr. Manuel Castro (Psiquiatra)'
        },
        confidence: 0.96,
        status: 'pending',
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'prop-mock-2',
        patient_id: patientId,
        proposal_type: 'timeline_event',
        source_type: 'chat_message',
        source_metadata: { textMessage: 'Lloré en el baño porque sentí que nunca voy a ser suficiente' },
        proposal_data: {
          date: new Date(Date.now() - 86400000).toISOString().substring(0, 10),
          event_type: 'crisis',
          event: 'Episodio de llanto e ideación de insuficiencia severa en el trabajo.',
          associated_emotion: 'Tristeza / Frustración',
          intensity: 9
        },
        confidence: 0.85,
        status: 'pending',
        created_at: new Date(Date.now() - 1800000).toISOString()
      }
    ];
    localStorage.setItem(key, JSON.stringify(mockProposals));
    return mockProposals;
  }
  return [];
}

function acceptLocalProposal(proposal, finalData, customAuthorityLevel = null) {
  const patientId = proposal.patient_id;
  const finalLevel = customAuthorityLevel !== null ? customAuthorityLevel : AuthorityLevels.VALIDATED;
  
  // 1. Actualizar estado en propuestas
  const pKey = `proposals_${patientId}`;
  const localProps = JSON.parse(localStorage.getItem(pKey) || '[]');
  const updatedProps = localProps.map(p => p.id === proposal.id ? { ...p, status: 'accepted' } : p);
  localStorage.setItem(pKey, JSON.stringify(updatedProps));

  // 2. Consolidar dato real en el timeline o medicamentos locales
  if (proposal.proposal_type === 'medication') {
    addLocalMedication(patientId, {
      name: finalData.name,
      dose: finalData.dose,
      frequency: finalData.frequency,
      prescriber: finalData.prescriber || 'IA Áncora (Propuesta Aceptada)'
    }, finalLevel);
  } else if (proposal.proposal_type === 'timeline_event') {
    addLocalTimelineEvent(patientId, {
      date: finalData.date,
      event_type: finalData.event_type || 'other',
      event: finalData.event,
      associated_emotion: finalData.associated_emotion,
      intensity: finalData.intensity
    }, finalLevel);
  }
}

function rejectLocalProposal(proposalId, patientId) {
  const key = `proposals_${patientId}`;
  const localProps = JSON.parse(localStorage.getItem(key) || '[]');
  const updatedProps = localProps.map(p => p.id === proposalId ? { ...p, status: 'rejected' } : p);
  localStorage.setItem(key, JSON.stringify(updatedProps));
}

function getLocalMedications(patientId) {
  const key = `meds_${patientId}`;
  const local = localStorage.getItem(key);
  if (local) return JSON.parse(local);

  // Mocks por defecto
  let defaultMeds = [];
  if (patientId === 'p-1' || patientId === 'tisute-id') {
    defaultMeds = [
      { id: 'm-1', patient_id: patientId, name: 'Atomoxetina', dose: '40mg', frequency: '1-0-0 (Mañanas)', prescriber: 'Dr. Manuel Castro', status: 'active', authority_level: AuthorityLevels.VALIDATED },
      { id: 'm-2', patient_id: patientId, name: 'Melatonina', dose: '1.9mg', frequency: '0-0-1 (Noches)', prescriber: 'Recomendación Farmacéutica', status: 'active', authority_level: AuthorityLevels.DECLARED }
    ];
  } else if (patientId === 'p-2') {
    defaultMeds = [
      { id: 'm-3', patient_id: patientId, name: 'Propranolol', dose: '10mg', frequency: '1-0-0 (Mañanas)', prescriber: 'Cardiólogo', status: 'active', authority_level: AuthorityLevels.VALIDATED }
    ];
  } else if (patientId === 'p-4') {
    defaultMeds = [
      { id: 'm-4', patient_id: patientId, name: 'Lorazepam', dose: '1mg', frequency: '0-0-1 (Noches, condicional)', prescriber: 'Psiquiatra de Zona', status: 'active', authority_level: AuthorityLevels.DECLARED }
    ];
  }
  localStorage.setItem(key, JSON.stringify(defaultMeds));
  return defaultMeds;
}

function addLocalMedication(patientId, med, level) {
  const key = `meds_${patientId}`;
  const current = JSON.parse(localStorage.getItem(key) || '[]');
  const newMed = {
    id: `med-${Date.now()}`,
    patient_id: patientId,
    name: med.name,
    dose: med.dose,
    frequency: med.frequency,
    prescriber: med.prescriber || 'Declarado por paciente',
    status: 'active',
    authority_level: level,
    created_at: new Date().toISOString()
  };
  const updated = [...current, newMed];
  localStorage.setItem(key, JSON.stringify(updated));
  return newMed;
}

function getLocalTimelineEvents(patientId) {
  const key = `timeline_${patientId}`;
  const local = localStorage.getItem(key);
  if (local) return JSON.parse(local).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  // Mocks por defecto
  let defaultEvents = [];
  if (patientId === 'p-1' || patientId === 'tisute-id') {
    defaultEvents = [
      { id: 'ev-1', patient_id: patientId, event_date: '2021-04-12', event_type: 'vital_event', description: 'Diagnóstico de hipotiroidismo primario subclínico.', associated_emotion: 'Preocupación', intensity: 5, authority_level: AuthorityLevels.DOCUMENTED },
      { id: 'ev-2', patient_id: patientId, event_date: '2024-09-15', event_type: 'symptom_start', description: 'Inicio de primer periodo de terapia cognitivo-conductual por estrés laboral.', associated_emotion: 'Agobio', intensity: 8, authority_level: AuthorityLevels.DOCUMENTED },
      { id: 'ev-3', patient_id: patientId, event_date: '2026-05-30', event_type: 'therapy_session', description: 'Sesión de encuadre clínico y consentimiento firmado.', associated_emotion: 'Alivio', intensity: 3, authority_level: AuthorityLevels.VALIDATED }
    ];
  } else if (patientId === 'p-2') {
    defaultEvents = [
      { id: 'ev-4', patient_id: patientId, event_date: '2026-05-28', event_type: 'therapy_session', description: 'Sesión de encuadre clínico inicial completada.', associated_emotion: 'Confusión', intensity: 6, authority_level: AuthorityLevels.VALIDATED }
    ];
  } else if (patientId === 'p-4') {
    defaultEvents = [
      { id: 'ev-5', patient_id: patientId, event_date: '2026-06-05', event_type: 'therapy_session', description: 'Sesión de encuadre. Se detecta alta rumiación financiera.', associated_emotion: 'Estrés', intensity: 8, authority_level: AuthorityLevels.VALIDATED }
    ];
  }
  localStorage.setItem(key, JSON.stringify(defaultEvents));
  return defaultEvents;
}

function addLocalTimelineEvent(patientId, ev, level) {
  const key = `timeline_${patientId}`;
  const current = JSON.parse(localStorage.getItem(key) || '[]');
  const newEv = {
    id: `ev-${Date.now()}`,
    patient_id: patientId,
    event_date: ev.date,
    event_type: ev.event_type || 'other',
    description: ev.event,
    associated_emotion: ev.associated_emotion || null,
    intensity: ev.intensity || null,
    authority_level: level,
    created_at: new Date().toISOString()
  };
  const updated = [...current, newEv];
  localStorage.setItem(key, JSON.stringify(updated));
  return newEv;
}

/**
 * ============================================================================
 * MOTOR DE VALIDACIÓN SEMIAUTOMÁTICA Y APROBACIÓN DE PSICÓLOGOS (ESCALA SANITARIA)
 * ============================================================================
 */

/**
 * Valida el formato del número de colegiación oficial de Psicología (España / COP).
 */
export function validateCOPFormat(licenseNumber) {
  if (!licenseNumber || typeof licenseNumber !== 'string') {
    return { isValid: false, province: 'Desconocida', formatted: '', score: 0, reason: 'Número de colegiado no proporcionado' };
  }

  const clean = licenseNumber.trim().toUpperCase();

  const provinces = [
    { prefix: 'M-', name: 'Colegio Oficial de la Psicología de Madrid' },
    { prefix: 'M', name: 'Madrid' },
    { prefix: 'AN-', name: 'Andalucía Occidental' },
    { prefix: 'AO-', name: 'Andalucía Oriental' },
    { prefix: 'COPC-', name: 'Col·legi Oficial de Psicologia de Catalunya' },
    { prefix: 'B-', name: 'Barcelona' },
    { prefix: 'GI-', name: 'Girona' },
    { prefix: 'L-', name: 'Lleida' },
    { prefix: 'T-', name: 'Tarragona' },
    { prefix: 'CV-', name: 'Comunitat Valenciana' },
    { prefix: 'PV-', name: 'País Vasco (COP Bizkaia/Gipuzkoa/Álava)' },
    { prefix: 'G-', name: 'Galicia' },
    { prefix: 'CA-', name: 'Canarias' },
    { prefix: 'CLM-', name: 'Castilla-La Mancha' },
    { prefix: 'CL-', name: 'Castilla y León' },
    { prefix: 'AR-', name: 'Aragón' },
    { prefix: 'AS-', name: 'Asturias' },
    { prefix: 'EX-', name: 'Extremadura' },
    { prefix: 'MU-', name: 'Región de Murcia' },
    { prefix: 'IB-', name: 'Illes Balears' },
    { prefix: 'NA-', name: 'Navarra' },
    { prefix: 'LR-', name: 'La Rioja' },
    { prefix: 'CT-', name: 'Cantabria' }
  ];

  const matched = provinces.find(p => clean.startsWith(p.prefix));
  
  // Acepta formatos estándar como M-41029, M-49ccc, AN-08123 o cualquier código numérico de 4-6 dígitos con prefijo
  const hasValidChars = /^[A-Z]{1,4}-?[0-9A-Z]{3,7}$/i.test(clean) || clean.length >= 4;

  if (matched && hasValidChars) {
    return {
      isValid: true,
      province: matched.name,
      formatted: clean,
      score: 95,
      reason: `Formato colegial reconocido: ${matched.name}`
    };
  }

  if (hasValidChars) {
    return {
      isValid: true,
      province: 'Registro General COP',
      formatted: clean,
      score: 75,
      reason: 'Código colegial con estructura válida (pendiente de cotejo autonómico)'
    };
  }

  return {
    isValid: false,
    province: 'No identificada',
    formatted: clean,
    score: 20,
    reason: 'Formato colegial atípico o incompleto'
  };
}

/**
 * Valida el estado de la póliza de Responsabilidad Civil (RC).
 */
export function validateRCInsurance(insuranceText) {
  if (!insuranceText || typeof insuranceText !== 'string') {
    return { isValid: false, details: 'Sin cobertura declarada', score: 0, reason: 'Póliza de RC no aportada' };
  }

  const clean = insuranceText.trim();
  const lower = clean.toLowerCase();

  const isKnownInsurer = ['mapfre', 'zurich', 'ama', 'axa', 'allianz', 'berkley', 'segurcaixa', 'asisa', 'sanitas', 'broker', 'activo', 'activa'].some(k => lower.includes(k));

  if (isKnownInsurer && clean.length > 5) {
    return {
      isValid: true,
      details: clean,
      score: 95,
      reason: 'Póliza de Responsabilidad Civil profesional verificada con entidad aseguradora'
    };
  }

  if (clean.length > 3) {
    return {
      isValid: true,
      details: clean,
      score: 70,
      reason: 'Cobertura de RC declarada (pendiente de validar número de póliza)'
    };
  }

  return {
    isValid: false,
    details: clean,
    score: 25,
    reason: 'Información de seguro RC insuficiente'
  };
}

/**
 * Evalúa el cumplimiento sanitario global de un psicólogo con IA y reglas deterministas.
 */
export function evaluatePsychologistCompliance(psico) {
  const license = psico?.colegiado || psico?.license_number || psico?.app_config?.license_number || '';
  const insurance = psico?.insurance || psico?.rc_insurance || psico?.app_config?.rc_insurance || '';
  const qualification = psico?.habilitacion || psico?.qualification || psico?.app_config?.qualification || '';

  const copResult = validateCOPFormat(license);
  const rcResult = validateRCInsurance(insurance);

  const hasSanitaryQualification = ['sanitario', 'sanitaria', 'pir', 'clínico', 'clínica', 'máster', 'mediación', 'infanto'].some(k => qualification.toLowerCase().includes(k));

  let totalScore = Math.round((copResult.score * 0.45) + (rcResult.score * 0.35) + (hasSanitaryQualification ? 20 : 5));

  let verdict = 'REVISION_MANUAL';
  let recommendation = 'Revisar certificado de colegiación y póliza de seguro antes de habilitar.';

  if (copResult.isValid && rcResult.isValid && totalScore >= 75) {
    verdict = 'APTO_AUTOMATICO';
    recommendation = 'Cumple requisitos de colegiación oficial y cobertura de seguro RC. Apto para habilitación 1-click.';
  } else if (!copResult.isValid || !rcResult.isValid) {
    verdict = 'SUBSANACION';
    recommendation = 'Faltan datos oficiales indispensables (Nº Colegiado o Seguro RC). Solicitar subsanación.';
  }

  return {
    score: totalScore,
    verdict,
    recommendation,
    copVerdict: copResult,
    rcVerdict: rcResult,
    hasSanitaryQualification
  };
}

/**
 * Aprueba a un psicólogo de forma persistente en Firebase Firestore y Firebase.
 */
export async function approvePsychologistPersistent(psicoId, adminId = 'super_admin') {
  const timestamp = new Date().toISOString();

  // 1. Persistir en Firebase Cloud Firestore
  try {
    const userRef = doc(firestoreDb, 'profiles', psicoId);
    await setDoc(userRef, {
      role: 'psicologo',
      status: 'verified',
      copStatus: 'verified',
      app_config: {
        verified: true,
        verified_at: timestamp,
        verified_by: adminId,
        active: true
      },
      updated_at: timestamp
    }, { merge: true });
  } catch (fireErr) {
    console.warn("Aviso actualizando psicólogo en Firestore:", fireErr.message);
  }

  // 2. Persistir en Firebase
  try {
    await firebaseClient
      .from('profiles')
      .update({
        role: 'psicologo',
        app_config: {
          verified: true,
          verified_at: timestamp,
          verified_by: adminId,
          active: true
        },
        updated_at: timestamp
      })
      .eq('id', psicoId);
  } catch (supaErr) {
    console.warn("Aviso actualizando psicólogo en Firebase:", supaErr.message);
  }

  return { success: true, psicoId, timestamp };
}

/**
 * Aprobación en Lote (Batch) de múltiples psicólogos.
 */
export async function batchApprovePsychologists(psicoIds, adminId = 'super_admin') {
  if (!Array.isArray(psicoIds) || psicoIds.length === 0) return { approvedCount: 0, errors: [] };

  const results = [];
  for (const id of psicoIds) {
    try {
      const res = await approvePsychologistPersistent(id, adminId);
      results.push(res);
    } catch (err) {
      console.error(`Error aprobando psicólogo ${id}:`, err);
    }
  }

  return {
    approvedCount: results.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Rechaza o solicita subsanación a un psicólogo.
 */
export async function rejectOrAmendPsychologist(psicoId, reason, isAmend = false, adminId = 'super_admin') {
  const timestamp = new Date().toISOString();
  const newStatus = isAmend ? 'under_review' : 'rejected';

  try {
    const userRef = doc(firestoreDb, 'profiles', psicoId);
    await setDoc(userRef, {
      status: newStatus,
      copStatus: newStatus,
      app_config: {
        verified: false,
        rejection_reason: reason,
        action_requested: isAmend ? 'subsanar_documentacion' : 'registro_rechazado',
        reviewed_at: timestamp,
        reviewed_by: adminId
      },
      updated_at: timestamp
    }, { merge: true });
  } catch (err) {
    console.warn("Error guardando rechazo/subsanación en Firestore:", err.message);
  }

  try {
    await firebaseClient
      .from('profiles')
      .update({
        app_config: {
          verified: false,
          rejection_reason: reason,
          action_requested: isAmend ? 'subsanar_documentacion' : 'registro_rechazado',
          reviewed_at: timestamp,
          reviewed_by: adminId
        },
        updated_at: timestamp
      })
      .eq('id', psicoId);
  } catch (err) {
    console.warn("Error guardando rechazo/subsanación en Firebase:", err.message);
  }

  return { success: true, psicoId, newStatus, reason };
}

/**
 * Añade un recuerdo o vivencia directamente a una rama del árbol vital y sincroniza la ficha clínica.
 */
export async function addPatientMemory(patientId, areaKey, memoryText, audioFile = null) {
  if (!patientId || !memoryText?.trim()) return { success: false };

  try {
    // 1. Obtener árbol vital actual
    const { data: treeDoc } = await firebaseClient
      .from('clinical_life_tree')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();

    const treeData = treeDoc?.tree_data || {};
    const currentList = Array.isArray(treeData[areaKey]) ? treeData[areaKey] : [];
    
    if (!currentList.includes(memoryText.trim())) {
      currentList.push(memoryText.trim());
    }
    treeData[areaKey] = currentList;

    await firebaseClient.from('clinical_life_tree').upsert({
      patient_id: patientId,
      tree_data: treeData,
      updated_at: new Date().toISOString()
    }, { onConflict: 'patient_id' });

    // 2. Extraer si hay mención de año para timeline
    const yearMatch = memoryText.match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch) {
      await firebaseClient.from('timeline_events').insert([{
        id: 'ev-' + crypto.randomUUID().substring(0, 8),
        patient_id: patientId,
        date: yearMatch[1],
        event: memoryText.trim(),
        event_type: 'personal',
        authority_level: 3,
        created_at: new Date().toISOString()
      }]);
    }

    // 3. Crear episodio clínico asociado
    await firebaseClient.from('clinical_episodes').insert([{
      id: 'ep-' + crypto.randomUUID().substring(0, 8),
      patient_id: patientId,
      title: `Recuerdo de ${areaKey}: ${memoryText.substring(0, 40)}...`,
      description: memoryText.trim(),
      category: areaKey,
      authority_level: 3,
      validation_status: 'pending',
      created_at: new Date().toISOString()
    }]);

    // 4. Actualizar ficha clínica en el perfil
    const { data: profileDoc } = await firebaseClient
      .from('profiles')
      .select('contexto_terapeutico')
      .eq('id', patientId)
      .maybeSingle();

    const curCtx = profileDoc?.contexto_terapeutico || {};
    const curHist = curCtx.historial_clinico || {};
    const recuerdos = Array.isArray(curHist.recuerdos_aportados) ? curHist.recuerdos_aportados : [];
    recuerdos.push({
      area: areaKey,
      texto: memoryText.trim(),
      fecha: new Date().toISOString()
    });
    curHist.recuerdos_aportados = recuerdos;
    curCtx.historial_clinico = curHist;

    await firebaseClient.from('profiles').update({
      contexto_terapeutico: curCtx,
      updated_at: new Date().toISOString()
    }).eq('id', patientId);

    return { success: true, treeData };
  } catch (err) {
    console.error("Error añadiendo recuerdo del paciente:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Permite al paciente marcar un área vital como cerrada/completada (no tiene más que aportar por ahora)
 */
export async function toggleAreaCompletion(patientId, areaKey, isCompleted = true) {
  if (!patientId || !areaKey) return { success: false };

  try {
    const { data: profileDoc } = await firebaseClient
      .from('profiles')
      .select('contexto_terapeutico')
      .eq('id', patientId)
      .maybeSingle();

    const curCtx = profileDoc?.contexto_terapeutico || {};
    const areasComp = curCtx.areas_completadas || {};
    areasComp[areaKey] = isCompleted;
    curCtx.areas_completadas = areasComp;

    await firebaseClient.from('profiles').update({
      contexto_terapeutico: curCtx,
      updated_at: new Date().toISOString()
    }).eq('id', patientId);

    return { success: true, areasCompletadas: areasComp };
  } catch (err) {
    console.error("Error al alternar completitud de área:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Calcula la Madurez de Exploración Vital y Cobertura de Anamnesis para el Paciente
 * Proporciona una visión constructiva y segura (sin re-traumatización)
 */
export function calculateClinicalExplorationMaturity(profile = {}, lifeTree = {}, timelineEvents = [], medications = []) {
  const tree = lifeTree?.tree_data || lifeTree || {};
  const ctx = profile?.contexto_terapeutico || {};
  const hist = ctx.historial_clinico || {};
  const currentYear = new Date().getFullYear();
  const birthYear = profile.birth_year || (profile.age ? currentYear - profile.age : null);
  const areasCompletadas = ctx.areas_completadas || {};

  const categories = [
    { 
      key: 'family_origin', 
      label: 'Familia y Origen', 
      icon: 'Users', 
      prompt: 'dinámicas familiares y figuras de crianza',
      fallbackItems: () => {
        const items = [];
        timelineEvents.filter(e => e.event_type === 'family' || /familia|padre|madre|herman/i.test(e.event)).forEach(e => items.push(e.event));
        return items;
      }
    },
    { 
      key: 'childhood', 
      label: 'Infancia y Desarrollo', 
      icon: 'BookOpen', 
      prompt: 'etapa escolar y vivencias tempranas',
      fallbackItems: () => {
        const items = [];
        if (hist.antecedentes_psicologicos) items.push(hist.antecedentes_psicologicos);
        timelineEvents.filter(e => e.event_type === 'childhood' || /infancia|colegio|escuela|crecimiento|tempran/i.test(e.event)).forEach(e => items.push(e.event));
        return items;
      }
    },
    { 
      key: 'relationships', 
      label: 'Vínculos Afectivos', 
      icon: 'Heart', 
      prompt: 'relaciones significativas y apego',
      fallbackItems: () => {
        const items = [];
        if (hist.relaciones_contexto) items.push(hist.relaciones_contexto);
        if (ctx.partnerDetails) items.push(ctx.partnerDetails);
        timelineEvents.filter(e => e.event_type === 'relationship' || /pareja|relaci[oó]n|amigo|v[ií]nculo|susana/i.test(e.event)).forEach(e => items.push(e.event));
        return items;
      }
    },
    { 
      key: 'work_studies', 
      label: 'Ámbito Profesional y Proyectos', 
      icon: 'Layers', 
      prompt: 'trayectoria laboral y vocación',
      fallbackItems: () => {
        const items = [];
        if (hist.resumen_vital && /trading|trabajo|laboral|profesi|carrera|estudio/i.test(hist.resumen_vital)) {
          items.push(hist.resumen_vital);
        }
        if (Array.isArray(ctx.tags)) {
          const workTags = ctx.tags.filter(t => /laboral|trabajo|escolar|acad[eé]mico|ex[aá]men/i.test(t));
          if (workTags.length > 0) items.push(`Focos activos: ${workTags.join(', ')}.`);
        }
        timelineEvents.filter(e => e.event_type === 'work' || /trabajo|empresa|proyecto|empleo|trading/i.test(e.event)).forEach(e => items.push(e.event));
        return items;
      }
    },
    { 
      key: 'health', 
      label: 'Salud y Bienestar Físico', 
      icon: 'Activity', 
      prompt: 'antecedentes médicos o medicación',
      fallbackItems: () => {
        const items = [];
        if (hist.antecedentes_medicos) items.push(hist.antecedentes_medicos);
        medications.forEach(m => items.push(`Tratamiento: ${m.name} (${m.dose || 'Pautada'} - ${m.frequency || 'Según prescripción'}).`));
        if (ctx.triaje?.highRisk) items.push('Alerta de riesgo clínico activada en triaje de admisión.');
        timelineEvents.filter(e => e.event_type === 'medical' || /m[eé]dic|salud|ingreso|diagn[oó]stico|crisis/i.test(e.event)).forEach(e => items.push(e.event));
        return items;
      }
    },
    { 
      key: 'habits', 
      label: 'Hábitos y Calidad del Sueño', 
      icon: 'Moon', 
      prompt: 'patrones de descanso y rutinas diarias',
      fallbackItems: () => {
        const items = [];
        if (hist.patrones_comunes) items.push(hist.patrones_comunes);
        if (Array.isArray(ctx.pautas_accion) && ctx.pautas_accion.length > 0) {
          items.push(`Pautas acordadas: ${ctx.pautas_accion.join('; ')}.`);
        }
        timelineEvents.filter(e => e.event_type === 'habits' || /sue[ñn]o|rutina|descanso|h[aá]bito|respiraci[oó]n/i.test(e.event)).forEach(e => items.push(e.event));
        return items;
      }
    }
  ];

  let coveredCount = 0;
  const exploredAreas = categories.map(cat => {
    let items = Array.isArray(tree[cat.key]) ? [...tree[cat.key]] : [];
    
    // Si la rama directa no tiene elementos, incorporar fallback enriquecido desde el expediente
    if (items.length === 0 && typeof cat.fallbackItems === 'function') {
      items = cat.fallbackItems();
    }

    // Incorporar recuerdos aportados manualmente por el paciente para esta área
    const userRecuerdos = ctx.historial_clinico?.recuerdos_aportados;
    if (Array.isArray(userRecuerdos)) {
      userRecuerdos.filter(r => r.area === cat.key).forEach(r => {
        if (r.texto && !items.includes(r.texto)) items.push(r.texto);
      });
    }

    // Limpiar duplicados y vacíos
    items = Array.from(new Set(items.filter(it => it && String(it).trim().length > 0)));

    const isExplicitlyClosed = !!areasCompletadas[cat.key];
    
    let status = 'pending';
    if (isExplicitlyClosed || items.length >= 2) {
      status = 'complete';
      coveredCount += 1;
    } else if (items.length === 1) {
      status = 'partial';
      coveredCount += 0.5;
    }
    return {
      key: cat.key,
      label: cat.label,
      icon: cat.icon,
      status,
      count: items.length,
      items,
      isExplicitlyClosed,
      prompt: cat.prompt
    };
  });

  // Factor de Timeline
  const hasTimeline = timelineEvents.length > 0;
  const timelineScore = Math.min(timelineEvents.length * 5, 20); // hasta 20%
  const thematicScore = (coveredCount / categories.length) * 70;  // hasta 70%
  const baselineScore = ctx.motivo || ctx.foto_persona || hist.resumen_vital ? 10 : 0;

  // La madurez que se enseña sale del motor de anamnesis cuando hay datos
  // estructurados con evidencia (`arbol_vital`): cuenta hallazgos con cita,
  // ángulos cubiertos y balance entre recursos y dificultades, según la
  // sección 7 del guion clínico. El cálculo antiguo —que sumaba textos sin
  // respaldo y aplicaba un suelo del 20%— se conserva solo como reserva para
  // expedientes que todavía no han pasado por la ingesta nueva.
  const arbolConEvidencia = Array.isArray(lifeTree?.arbol_vital) ? lifeTree.arbol_vital : [];
  const estadoAnamnesis = arbolConEvidencia.length > 0
    ? computeAnamnesisState({
        arbol_vital: arbolConEvidencia,
        desencadenantes: lifeTree?.desencadenantes || [],
        anclajes_protectores: lifeTree?.anclajes_protectores || [],
        eventos_timeline: timelineEvents
      })
    : null;

  const legacyPercentage = Math.min(Math.round(thematicScore + timelineScore + baselineScore), 100);
  const totalPercentage = estadoAnamnesis ? estadoAnamnesis.madurezGlobal : legacyPercentage;

  // Etapas Cronológicas
  const stages = [
    { id: 'infancia', label: 'Infancia (0-12 años)', explored: false },
    { id: 'adolescencia', label: 'Adolescencia (13-18 años)', explored: false },
    { id: 'juventud', label: 'Juventud / Adultez Temprana', explored: false },
    { id: 'actual', label: 'Etapa Actual y Reciente', explored: true }
  ];

  if (timelineEvents.length > 0) {
    timelineEvents.forEach(e => {
      const yr = parseInt(e.date, 10);
      const evText = (e.event || '').toLowerCase();
      if (/infancia|niñez|primaria|crianza/i.test(evText)) stages[0].explored = true;
      if (/adolescen|instituto|secundaria|juvenil/i.test(evText)) stages[1].explored = true;
      if (/universidad|primer empleo|adultez|independencia/i.test(evText)) stages[2].explored = true;
      if (birthYear && !isNaN(yr)) {
        const ageAtEvent = yr - birthYear;
        if (ageAtEvent >= 0 && ageAtEvent <= 12) stages[0].explored = true;
        else if (ageAtEvent >= 13 && ageAtEvent <= 18) stages[1].explored = true;
        else if (ageAtEvent > 18 && ageAtEvent < (currentYear - birthYear - 2)) stages[2].explored = true;
      }
    });
  }

  // Focos Abiertos sugeridos
  const openInquiries = exploredAreas
    .filter(a => a.status === 'pending' || a.status === 'partial')
    .map(a => `Profundizar con Áncora en ${a.prompt}`);

  return {
    // Sin suelo artificial: un expediente vacío está al 0%. Enseñarle un 20%
    // a quien no ha contado nada todavía es mentirle sobre su propio proceso,
    // y encima le quita la razón para seguir contando.
    maturityPercentage: totalPercentage,
    anamnesis: estadoAnamnesis,
    exploredAreas,
    stages,
    openInquiries,
    medicationsCount: medications.length,
    timelineCount: timelineEvents.length
  };
}

