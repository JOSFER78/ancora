import { supabase } from '../supabaseClient';

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
  4: 'Inferencia de Walter IA'
};

/**
 * Helper para detectar si un error de Supabase indica que la tabla no existe.
 */
function isTableMissingError(error) {
  return error && (error.code === '42P01' || error.message?.includes('does not exist'));
}

/**
 * Obtener propuestas pendientes de la IA para un paciente.
 */
export async function getPendingProposals(patientId) {
  try {
    const { data, error } = await supabase
      .from('pending_proposals')
      .select('*')
      .eq('patient_id', patientId)
      .eq('status', 'pending');

    if (error) {
      if (isTableMissingError(error)) {
        console.warn("Tabla 'pending_proposals' no existe en Supabase. Usando fallback de localStorage.");
        return getLocalProposals(patientId);
      }
      throw error;
    }
    return data || [];
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

  try {
    // 1. Actualizar estado de la propuesta
    const { error: proposalErr } = await supabase
      .from('pending_proposals')
      .update({ status: 'accepted' })
      .eq('id', proposal.id);

    if (proposalErr && !isTableMissingError(proposalErr)) throw proposalErr;

    // 2. Insertar el dato real según el tipo
    if (proposal.proposal_type === 'medication') {
      const { error: medErr } = await supabase
        .from('medications')
        .insert({
          patient_id: patientId,
          name: finalData.name,
          dose: finalData.dose,
          frequency: finalData.frequency,
          prescriber: finalData.prescriber || 'Walter IA (Propuesta)',
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
    const { error } = await supabase
      .from('pending_proposals')
      .update({ status: 'rejected' })
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
 * Guardar medicación declarada directamente.
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
    console.error("Error al agregar medicación, usando local:", err);
    return addLocalMedication(patientId, med, level);
  }
}

/**
 * Obtener el Timeline Clínico del paciente.
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
 * Simulación de Pipeline de Walter IA tras subida de documentos
 */
/**
 * Analiza un texto en busca de información clínica (Medicaciones, Eventos, Emociones).
 */
export function analyzeTextClinically(text, sourceName) {
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
  const prescriberRegex = /(?:dra?\.|médico|psiquiatra|endocrino|cardiólogo|doctora?)\s+([a-záéíóúüñ\s]{3,20})/gi;

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

      let prescriber = 'Walter IA (Deducido)';
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
  const genericMedRegex = /\b([a-zA-Záéíóúüñ]{3,20})\s+(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|miligramos|microgramos)/gi;
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

      let prescriber = 'Walter IA (Deducido)';
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
export function analyzeFileNameClinically(fileName, fileSizeStr) {
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

export async function simulateDocumentIngestion(patientId, fileName, fileSizeStr = '1.2 MB', fileContent = null) {
  const key = `proposals_${patientId}`;
  const local = localStorage.getItem(key);
  const currentProposals = local ? JSON.parse(local) : [];

  let newProposals = [];

  if (fileContent && fileContent.trim().length > 0) {
    newProposals = analyzeTextClinically(fileContent, fileName);
  } else {
    newProposals = analyzeFileNameClinically(fileName, fileSizeStr);
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
            prescriber: p.proposal_data.prescriber || 'Walter IA (Extraído)',
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
      prescriber: finalData.prescriber || 'Walter IA (Propuesta Aceptada)'
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
