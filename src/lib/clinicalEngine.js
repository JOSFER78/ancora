import { supabase } from '../supabaseClient';

/**
 * JerarquÃ­a de Niveles de Autoridad ClÃ­nica
 */
export const AuthorityLevels = {
  VALIDATED: 1, // Validado por psicÃ³logo
  DOCUMENTED: 2, // Documentado (informes, PDFs)
  DECLARED: 3,   // Declarado por paciente
  INFERRED: 4    // Inferencia de IA
};

export const AuthorityLabels = {
  1: 'Validado por PsicÃ³logo',
  2: 'Documentado en Informe',
  3: 'Declarado por Paciente',
  4: 'Inferencia IA Ãncora'
};

/**
 * Helper para detectar si un error de Supabase indica que la tabla no existe.
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase.functions.invoke('clinical-synthesize', {
    body: {
      action: 'build_patient_snapshot',
      patient_id: patientId
    }
  });
  if (error) throw new Error(error.message || 'Error al sintetizar memoria clÃ­nica.');
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function getPatientContextSnapshot(patientId) {
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase
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
  const { data, error } = await supabase.functions.invoke('clinical-synthesize', {
    body: {
      action: 'process_conversation_turn',
      conversation_id: conversationId,
      ...(messageId ? { message_id: messageId } : {})
    }
  });
  if (error) throw new Error(error.message || 'Error al actualizar memoria conversacional.');
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function uploadClinicalDocument(file, patientId) {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData?.user?.id;
  if (!userId) throw new Error('SesiÃ³n no disponible.');

  const documentId = crypto.randomUUID();
  const cleanName = safeFileName(file.name || `documento-${documentId}.txt`);
  const storagePath = `${patientId}/${documentId}/${cleanName}`;
  const mimeType = file.type || 'application/octet-stream';

  const { error: uploadError } = await supabase.storage
    .from('clinical-documents')
    .upload(storagePath, file, {
      contentType: mimeType,
      upsert: false
    });
  if (uploadError) throw uploadError;

  const { data: doc, error: docError } = await supabase
    .from('clinical_documents')
    .insert({
      id: documentId,
      patient_id: patientId,
      uploaded_by: userId,
      storage_path: storagePath,
      file_name: file.name || cleanName,
      mime_type: mimeType,
      file_size: file.size || 0,
      source_kind: 'upload',
      extraction_status: 'pending'
    })
    .select()
    .single();
  if (docError) throw docError;

  const { data: ingestData, error: ingestError } = await supabase.functions.invoke('clinical-ingest', {
    body: {
      action: 'process_document',
      document_id: documentId
    }
  });

  if (ingestError) {
    throw new Error(ingestError.message || 'Error al procesar el documento en clinical-ingest.');
  }
  if (ingestData?.error) {
    throw new Error(ingestData.error);
  }

  try {
    await buildPatientSnapshot(patientId);
  } catch (snapshotError) {
    console.warn('Documento procesado, pero no se pudo regenerar el snapshot clÃ­nico:', snapshotError);
  }

  return { document: doc, ingest: ingestData };
}

export async function processChatSessionClinically(conversationId) {
  const { data: conversation } = await supabase
    .from('conversations')
    .select('user_id')
    .eq('id', conversationId)
    .maybeSingle();

  const { data, error } = await supabase.functions.invoke('clinical-ingest', {
    body: {
      action: 'process_chat_session',
      conversation_id: conversationId
    }
  });
  if (error) throw new Error(error.message || 'Error al procesar la sesion de chat.');
  if (data?.error) throw new Error(data.error);

  if (conversation?.user_id) {
    try {
      await buildPatientSnapshot(conversation.user_id);
    } catch (snapshotError) {
      console.warn('Sesion procesada, pero no se pudo regenerar el snapshot clinico:', snapshotError);
    }
  }

  return data;
}

/**
 * Obtener propuestas pendientes de la IA para un paciente.
 */
export async function getPendingProposals(patientId) {
  try {
    const { data, error } = await supabase
      .from('clinical_proposals')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      if (isTableMissingError(error)) {
        console.warn("Tabla 'clinical_proposals' no existe en Supabase. Usando fallback de localStorage.");
        return getLocalProposals(patientId);
      }
      throw error;
    }
    return (data || []).map(normalizeClinicalProposal);
  } catch (err) {
    console.error("Error al obtener propuestas de Supabase, usando fallback:", err);
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
      const { data: authData } = await supabase.auth.getUser();
      const reviewerId = authData?.user?.id || null;

      const { error: proposalErr } = await supabase
        .from('clinical_proposals')
        .update({
          status: 'accepted',
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', proposal.id);
      if (proposalErr) throw proposalErr;

      const factClaim = finalData.claim || finalData.event || finalData.name || finalData.question || 'Dato clÃ­nico aceptado';
      await supabase.from('clinical_facts').insert({
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
        const { error: medErr } = await supabase
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
        const { error: eventErr } = await supabase
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
        const { error: riskErr } = await supabase
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
        const { data: existing } = await supabase
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
        const { error: profileErr } = await supabase
          .from('clinical_profiles')
          .upsert(merged, { onConflict: 'patient_id' });
        if (profileErr) throw profileErr;
      }

      return { success: true };
    } catch (err) {
      console.error("Error al aceptar propuesta clÃ­nica:", err);
      throw err;
    }
  }

  try {
    // 1. Actualizar estado de la propuesta
    const { error: proposalErr } = await supabase
      .from('pending_proposals')
      .update({ status: 'accepted' })
      .eq('id', proposal.id);

    if (proposalErr && !isTableMissingError(proposalErr)) throw proposalErr;

    // 2. Insertar el dato real segÃºn el tipo
    if (proposal.proposal_type === 'medication') {
      const { error: medErr } = await supabase
        .from('medications')
        .insert({
          patient_id: patientId,
          name: finalData.name,
          dose: finalData.dose,
          frequency: finalData.frequency,
          prescriber: finalData.prescriber || 'IA Ãncora (Propuesta)',
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
      const { error: eventErr } = await supabase
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

    // Si fallÃ³ por falta de tablas, ejecutar lÃ³gica local
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
    const { data: authData } = await supabase.auth.getUser();
    const reviewerId = authData?.user?.id || null;

    const { error } = await supabase
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
    const { data, error } = await supabase
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
 * Guardar medicaciÃ³n declarada directamente.
 */
export async function addMedication(patientId, med, level = AuthorityLevels.DECLARED) {
  try {
    const { data, error } = await supabase
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
    console.error("Error al agregar medicaciÃ³n, usando local:", err);
    return addLocalMedication(patientId, med, level);
  }
}

/**
 * Obtener el Timeline ClÃ­nico del paciente.
 */
export async function getTimelineEvents(patientId) {
  try {
    const { data, error } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('patient_id', patientId);

    if (error) {
      if (isTableMissingError(error)) return getLocalTimelineEvents(patientId);
      throw error;
    }
    // Ordenar cronolÃ³gicamente
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
    const { data, error } = await supabase
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
 * SimulaciÃ³n heredada de pipeline IA tras subida de documentos.
 */
/**
 * Analiza un texto en busca de informaciÃ³n clÃ­nica (Medicaciones, Eventos, Emociones).
 */
function analyzeTextClinicallyLegacy(text, sourceName) {
  const proposals = [];
  const timestamp = Date.now();
  const lowerText = text.toLowerCase();

  // 1. Diccionario de medicamentos conocidos (para verificaciÃ³n rÃ¡pida)
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
    { text: '1 comprimido diario en el desayuno', regex: /(diario|cada maÃ±ana|en el desayuno|maÃ±anas|maÃ±ana|ayunas|desayuno)/i },
    { text: '1 comprimido antes de dormir', regex: /(por la noche|noches|antes de dormir|noche|noche)/i },
    { text: 'Cada 24 horas', regex: /(cada 24h|cada 24 horas|1 al dÃ­a)/i },
    { text: 'Cada 12 horas', regex: /(cada 12h|cada 12 horas|2 al dÃ­a)/i },
    { text: 'Cada 8 horas', regex: /(cada 8h|cada 8 horas|3 al dÃ­a)/i }
  ];
  const prescriberRegex = /(?:dra?\.|mÃ©dico|psiquiatra|endocrino|cardiÃ³logo|doctora?)\s+([a-zÃ¡Ã©Ã­Ã³ÃºÃ¼Ã±\s]{3,20})/gi;

  // ExtracciÃ³n A: Medicamentos conocidos del diccionario
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

      let frequency = 'SegÃºn pauta mÃ©dica';
      for (const freq of freqPatterns) {
        if (freq.regex.test(lowerText)) {
          frequency = freq.text;
          break;
        }
      }

      let prescriber = 'IA Ãncora (Deducido)';
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
          section: 'ExtracciÃ³n de MedicaciÃ³n', 
          textMessage: `MenciÃ³n de ${med.name} encontrada en el texto.`
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

  // ExtracciÃ³n B: DetecciÃ³n libre de cualquier fÃ¡rmaco con dosis (ej. "Lortac 20mg")
  const genericMedRegex = /\b([a-zA-ZÃ¡Ã©Ã­Ã³ÃºÃ¼Ã±]{3,20})\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|miligramos|microgramos)/gi;
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
      let frequency = 'SegÃºn pauta mÃ©dica';
      for (const freq of freqPatterns) {
        if (freq.regex.test(lowerText)) {
          frequency = freq.text;
          break;
        }
      }

      let prescriber = 'IA Ãncora (Deducido)';
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
          section: 'ExtracciÃ³n NLP Libre', 
          textMessage: `Se detectÃ³ pauta farmacolÃ³gica: "${genericMatch[0]}"`
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

  // ExtracciÃ³n C: MÃºltiples eventos del timeline analizando frase a frase
  const sentences = text.split(/[.\n;]/).map(s => s.trim()).filter(s => s.length > 15);
  
  const eventKeywords = [
    { type: 'crisis', keywords: [/crisis/i, /ataque/i, /pÃ¡nico/i, /desbordado/i, /llorÃ©/i, /llanto/i, /ansiedad/i, /angustia/i, /rumiaciÃ³n/i, /insomnio/i] },
    { type: 'vital_event', keywords: [/muriÃ³/i, /falleciÃ³/i, /duelo/i, /ruptura/i, /separaciÃ³n/i, /mudanza/i, /despido/i, /diagnÃ³stico/i, /fallecimiento/i, /muerte/i, /ingreso/i, /accidente/i] },
    { type: 'symptom_start', keywords: [/empecÃ©/i, /inicio/i, /comenzÃ³/i, /insomnio/i, /cansancio/i, /fatiga/i, /presiÃ³n/i, /dolor/i] },
    { type: 'therapy_session', keywords: [/terapia/i, /sesiÃ³n/i, /psicÃ³logo/i, /consulta/i, /mÃ©dico/i, /tratamiento/i] }
  ];

  const emotions = [
    { name: 'Tristeza', patterns: [/triste/i, /llorar/i, /pena/i, /duelo/i, /vacÃ­o/i, /desolado/i, /dolor/i] },
    { name: 'Ansiedad', patterns: [/ansiedad/i, /nervios/i, /pÃ¡nico/i, /ahogo/i, /presiÃ³n/i, /angustia/i] },
    { name: 'Miedo', patterns: [/miedo/i, /temor/i, /asustado/i, /fobia/i] },
    { name: 'Agobio', patterns: [/agobiado/i, /desbordado/i, /estrÃ©s/i, /agotado/i, /presiÃ³n/i] },
    { name: 'Culpa', patterns: [/culpa/i, /culpable/i, /remordimiento/i] },
    { name: 'FrustraciÃ³n', patterns: [/frustrado/i, /rabia/i, /enojo/i, /impotencia/i] },
    { name: 'Alivio', patterns: [/alivio/i, /tranquilidad/i, /paz/i, /calma/i] }
  ];

  const dateRegex = /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/;
  const monthYearRegex = /(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)[a-z]*\s*(?:de)?\s*(20\d{2})/i;
  const yearRegex = /\b(20\d{2})\b/;

  sentences.forEach((sentence, idx) => {
    const lowerSentence = sentence.toLowerCase();
    
    // Buscar si la frase contiene alguna palabra de evento o emociÃ³n
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
      // Extraer fecha para esta frase especÃ­fica
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
          section: 'AnÃ¡lisis NLP DinÃ¡mico por Oraciones', 
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

  // Si no se extrajo absolutamente nada especÃ­fico, generar una propuesta de hito general basada en el texto real
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
 * Analiza semÃ¡nticamente el nombre de un archivo binario para extraer entidades.
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
      const prescriber = med.name === 'Eutirox' ? 'Dr. Alejandro Soto (Endocrino)' : 'Dra. Isabel BenÃ­tez (Psiquiatra)';

      return [
        {
          id: `prop-${timestamp}-bin-med`,
          patient_id: null,
          proposal_type: 'medication',
          source_type: 'document',
          source_metadata: { 
            fileName, 
            section: 'OCR de VisiÃ³n / OCR Nombre', 
            textMessage: `Se ha detectado medicaciÃ³n en el nombre del archivo: ${fileName}.` 
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
        source_metadata: { fileName, section: 'OCR / TranscripciÃ³n SemÃ¡ntica' },
        proposal_data: {
          date: '2025-06-01',
          event_type: 'vital_event',
          event: 'Proceso de duelo familiar significativo (detectado semÃ¡nticamente en el nombre del archivo).',
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
        source_metadata: { fileName, section: 'OCR / TranscripciÃ³n SemÃ¡ntica' },
        proposal_data: {
          date: new Date().toISOString().substring(0, 10),
          event_type: 'crisis',
          event: `Episodio agudo de malestar/ansiedad registrado en: ${fileName}`,
          associated_emotion: 'Ansiedad / PÃ¡nico',
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
        source_metadata: { fileName, section: 'EstructuraciÃ³n de Informe' },
        proposal_data: {
          date: '2024-09-15',
          event_type: 'therapy_session',
          event: 'MenciÃ³n de proceso terapÃ©utico o informe clÃ­nico previo.',
          associated_emotion: 'PreocupaciÃ³n',
          intensity: 6
        },
        confidence: 0.84,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ];
  }

  const fileTypeLabel = lowerName.endsWith('.wav') || lowerName.endsWith('.mp3') ? 'Audio ClÃ­nico' : (lowerName.endsWith('.pdf') ? 'Documento PDF' : 'Imagen/OCR');
  const actionLabel = fileTypeLabel === 'Audio ClÃ­nico' ? 'TranscripciÃ³n de voz' : 'OCR y visiÃ³n multimodal';

  return [
    {
      id: `prop-${timestamp}-bin-gen`,
      patient_id: null,
      proposal_type: 'timeline_event',
      source_type: 'document',
      source_metadata: { 
        fileName, 
        section: `AnÃ¡lisis de ${fileTypeLabel}` 
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

async function legacyDocumentIngestionDisabled(patientId, fileName, fileSizeStr = '1.2 MB', fileContent = null) {
  throw new Error('La ingesta simulada esta desactivada. Usa uploadClinicalDocument y clinical-ingest.');

  const key = `proposals_${patientId}`;
  const local = localStorage.getItem(key);
  const currentProposals = local ? JSON.parse(local) : [];

  let newProposals = [];

  if (fileContent && fileContent.trim().length > 0) {
    newProposals = analyzeTextClinicallyLegacy(fileContent, fileName);
  } else {
    newProposals = analyzeFileNameClinicallyLegacy(fileName, fileSizeStr);
  }

  // Asignar patientId a todas las propuestas y marcar como accepted
  newProposals = newProposals.map(p => ({ ...p, patient_id: patientId, status: 'accepted' }));

  // Guardar en Supabase o local
  try {
    const { error: propErr } = await supabase
      .from('pending_proposals')
      .insert(newProposals.map(p => ({
        patient_id: p.patient_id,
        proposal_type: p.proposal_type,
        source_type: p.source_type,
        source_metadata: p.source_metadata,
        proposal_data: p.proposal_data,
        confidence: p.confidence,
        status: 'accepted'
      })));

    if (propErr && !isTableMissingError(propErr)) throw propErr;

    if (propErr && isTableMissingError(propErr)) {
      const updated = [...currentProposals, ...newProposals];
      localStorage.setItem(key, JSON.stringify(updated));
      
      for (const p of newProposals) {
        acceptLocalProposal(p, p.proposal_data, AuthorityLevels.DOCUMENTED);
      }
      return;
    }

    // Guardar los datos oficiales
    for (const p of newProposals) {
      if (p.proposal_type === 'medication') {
        const { error: medErr } = await supabase
          .from('medications')
          .insert({
            patient_id: patientId,
            name: p.proposal_data.name,
            dose: p.proposal_data.dose,
            frequency: p.proposal_data.frequency,
            prescriber: p.proposal_data.prescriber || 'IA Ãncora (ExtraÃ­do)',
            status: 'active',
            authority_level: AuthorityLevels.DOCUMENTED,
            source_info: {
              source_type: p.source_type,
              source_metadata: p.source_metadata,
              proposal_id: p.id
            }
          });
        if (medErr) throw medErr;

      } else if (p.proposal_type === 'timeline_event') {
        const { error: eventErr } = await supabase
          .from('timeline_events')
          .insert({
            patient_id: patientId,
            event_date: p.proposal_data.date,
            event_type: p.proposal_data.event_type || 'other',
            description: p.proposal_data.event,
            associated_emotion: p.proposal_data.associated_emotion || null,
            intensity: p.proposal_data.intensity || null,
            authority_level: AuthorityLevels.DOCUMENTED,
            source_info: {
              source_type: p.source_type,
              source_metadata: p.source_metadata,
              proposal_id: p.id
            }
          });
        if (eventErr) throw eventErr;
      }
    }
  } catch (err) {
    console.error("Error al auto-consolidar propuestas en Supabase, guardando local:", err);
    const updated = [...currentProposals, ...newProposals];
    localStorage.setItem(key, JSON.stringify(updated));
    
    for (const p of newProposals) {
      acceptLocalProposal(p, p.proposal_data, AuthorityLevels.DOCUMENTED);
    }
  }
}

/* =======================================================
   FALLBACKS DE LOCAL STORAGE
   ======================================================= */

function getLocalProposals(patientId) {
  const key = `proposals_${patientId}`;
  const local = localStorage.getItem(key);
  if (local) return JSON.parse(local).filter(p => p.status === 'pending');

  // Si no hay datos, inicializamos con propuestas mockeadas por defecto para MarÃ­a Fernanda (p-1)
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
          frequency: '1-0-0 (MaÃ±anas)',
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
        source_metadata: { textMessage: 'LlorÃ© en el baÃ±o porque sentÃ­ que nunca voy a ser suficiente' },
        proposal_data: {
          date: new Date(Date.now() - 86400000).toISOString().substring(0, 10),
          event_type: 'crisis',
          event: 'Episodio de llanto e ideaciÃ³n de insuficiencia severa en el trabajo.',
          associated_emotion: 'Tristeza / FrustraciÃ³n',
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
      prescriber: finalData.prescriber || 'IA Ãncora (Propuesta Aceptada)'
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
      { id: 'm-1', patient_id: patientId, name: 'Atomoxetina', dose: '40mg', frequency: '1-0-0 (MaÃ±anas)', prescriber: 'Dr. Manuel Castro', status: 'active', authority_level: AuthorityLevels.VALIDATED },
      { id: 'm-2', patient_id: patientId, name: 'Melatonina', dose: '1.9mg', frequency: '0-0-1 (Noches)', prescriber: 'RecomendaciÃ³n FarmacÃ©utica', status: 'active', authority_level: AuthorityLevels.DECLARED }
    ];
  } else if (patientId === 'p-2') {
    defaultMeds = [
      { id: 'm-3', patient_id: patientId, name: 'Propranolol', dose: '10mg', frequency: '1-0-0 (MaÃ±anas)', prescriber: 'CardiÃ³logo', status: 'active', authority_level: AuthorityLevels.VALIDATED }
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
      { id: 'ev-1', patient_id: patientId, event_date: '2021-04-12', event_type: 'vital_event', description: 'DiagnÃ³stico de hipotiroidismo primario subclÃ­nico.', associated_emotion: 'PreocupaciÃ³n', intensity: 5, authority_level: AuthorityLevels.DOCUMENTED },
      { id: 'ev-2', patient_id: patientId, event_date: '2024-09-15', event_type: 'symptom_start', description: 'Inicio de primer periodo de terapia cognitivo-conductual por estrÃ©s laboral.', associated_emotion: 'Agobio', intensity: 8, authority_level: AuthorityLevels.DOCUMENTED },
      { id: 'ev-3', patient_id: patientId, event_date: '2026-05-30', event_type: 'therapy_session', description: 'SesiÃ³n de encuadre clÃ­nico y consentimiento firmado.', associated_emotion: 'Alivio', intensity: 3, authority_level: AuthorityLevels.VALIDATED }
    ];
  } else if (patientId === 'p-2') {
    defaultEvents = [
      { id: 'ev-4', patient_id: patientId, event_date: '2026-05-28', event_type: 'therapy_session', description: 'SesiÃ³n de encuadre clÃ­nico inicial completada.', associated_emotion: 'ConfusiÃ³n', intensity: 6, authority_level: AuthorityLevels.VALIDATED }
    ];
  } else if (patientId === 'p-4') {
    defaultEvents = [
      { id: 'ev-5', patient_id: patientId, event_date: '2026-06-05', event_type: 'therapy_session', description: 'SesiÃ³n de encuadre. Se detecta alta rumiaciÃ³n financiera.', associated_emotion: 'EstrÃ©s', intensity: 8, authority_level: AuthorityLevels.VALIDATED }
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
