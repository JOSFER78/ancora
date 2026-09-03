/**
 * @file clinicalReportService.js
 * @description Informes clínicos periódicos de Áncora ⚓ para el psicólogo colegiado.
 *
 * Genera la síntesis semanal, quincenal o mensual del expediente de un paciente.
 * El informe NO diagnostica: recopila, ordena, detecta patrones y prepara la
 * sesión. El criterio clínico y el diagnóstico formal son del profesional.
 *
 * Control de acceso: el informe completo es material del psicólogo. La función
 * buildPatientSafeSummary produce la versión reducida que puede mostrarse al
 * paciente si lo solicita, sin volcarle el historial crudo.
 */

import { askClinicalJSON, askClinicalAI, CLINICAL_MODELS, ClinicalAIError } from './claudeService.js';
import { AuthorityLevel } from '../domain/memory/MemoryTypes.js';

export const REPORT_PERIODS = {
  semanal: { label: 'Semanal', days: 7 },
  quincenal: { label: 'Quincenal', days: 15 },
  mensual: { label: 'Mensual', days: 30 }
};

const REPORT_SYSTEM = `Eres el asistente clínico de Áncora. Trabajas PARA un psicólogo colegiado, preparando el material de sus revisiones periódicas.

Tu perfil es el de un psicólogo con formación sólida y criterio afinado, pero tu rol es de SOPORTE. El terapeuta titular es quien diagnostica y decide. Tú recopilas, ordenas, detectas patrones y le ahorras el trabajo de síntesis.

LÍMITES INNEGOCIABLES:
1. NO DIAGNOSTICAS. Nunca nombres trastornos, categorías del DSM/CIE ni etiquetas patologizantes, tampoco como sospecha o hipótesis. Describes conductas, emociones, patrones, frecuencias y desencadenantes observados.
2. NO INVENTAS. Todo lo que afirmes debe proceder del material aportado. Si el periodo tiene poca información, dilo explícitamente en vez de rellenar.
3. DISTINGUES LA FUENTE DE CADA AFIRMACIÓN, siempre:
   - N1 VALIDADO: lo ha establecido el psicólogo colegiado. Es la autoridad máxima y prevalece sobre cualquier inferencia tuya.
   - N2 DOCUMENTADO: consta en informes o documentos aportados.
   - N3 DECLARADO: lo cuenta el paciente. Es su vivencia, no un hecho verificado.
   - N4 INFERENCIA: lo deduces tú. Va siempre marcado y en calidad de propuesta a validar.
   Nunca presentes una inferencia tuya (N4) como si fuera un hecho establecido (N1/N2).
4. CITAS LITERALES. Cuando el paciente diga algo revelador, reprodúcelo entre comillas, con sus palabras exactas. Las citas son lo que más valor aporta al terapeuta.
5. RIESGO PRIMERO. Si detectas indicios de riesgo, van destacados y al principio, con su cita literal y sin dramatizar ni minimizar.
6. UTILIDAD. Escribe para un profesional con poco tiempo: concreto, sin relleno, sin repetir lo que ya sabe.`;

const REPORT_SCHEMA = `{
  "resumen_ejecutivo": "string. 4-8 frases. Lo que el psicólogo necesita saber antes de la sesión si solo lee un párrafo.",
  "actividad_del_periodo": {
    "conversaciones": "número",
    "registros_animo": "número",
    "eventos_nuevos": "número",
    "documentos_aportados": "número",
    "valoracion_participacion": "string. Descripción de la implicación observada en el periodo."
  },
  "temas_dominantes": [{
    "tema": "string",
    "frecuencia": "recurrente|puntual",
    "evolucion": "mejora|estable|empeora|sin_datos",
    "citas": ["cita literal del paciente, entre comillas en el texto"],
    "nivel_autoridad": "N1|N2|N3|N4"
  }],
  "citas_textuales_destacadas": [{
    "cita": "cita literal exacta del paciente",
    "contexto": "string. Cuándo y a propósito de qué lo dijo.",
    "relevancia_clinica": "string. Por qué merece la atención del terapeuta."
  }],
  "patrones_detectados": [{
    "patron": "string. Descripción conductual, sin etiquetas diagnósticas.",
    "desencadenante": "string o null",
    "evidencia": "string. En qué material se apoya.",
    "nivel_autoridad": "N4",
    "requiere_validacion": true
  }],
  "evolucion_respecto_al_periodo_anterior": "string. Qué ha cambiado. Si no hay informe previo, indícalo explícitamente.",
  "adherencia_al_plan": {
    "directivas_del_psicologo": [{ "directiva": "string", "seguimiento_observado": "string", "nivel_autoridad": "N1" }],
    "valoracion": "string"
  },
  "senales_alerta": [{
    "senal": "string",
    "urgencia": "alta|media|baja",
    "cita": "cita literal que la sustenta",
    "accion_sugerida": "string. Qué convendría explorar. Nunca una indicación terapéutica cerrada."
  }],
  "lagunas_por_explorar": [{
    "laguna": "string. Qué falta en el expediente.",
    "pregunta_sugerida": "string. Cómo podría abordarlo el terapeuta en sesión."
  }],
  "preparacion_proxima_sesion": {
    "focos_propuestos": ["string"],
    "material_a_revisar": ["string"],
    "duracion_recomendada": "revision_15min|sesion_50min",
    "justificacion_duracion": "string"
  },
  "limitaciones_del_informe": "string. Qué no cubre este informe y por qué. Sé honesto sobre la escasez de datos si la hay."
}`;

/** Etiqueta legible del nivel de autoridad clínica. */
function authorityTag(level) {
  switch (Number(level)) {
    case AuthorityLevel.LEVEL_1_PSYCHOLOGIST: return 'N1 VALIDADO POR EL PSICÓLOGO';
    case AuthorityLevel.LEVEL_2_DOCUMENTED: return 'N2 DOCUMENTADO';
    case AuthorityLevel.LEVEL_3_DECLARED: return 'N3 DECLARADO POR EL PACIENTE';
    default: return 'N4 INFERENCIA IA (sin validar)';
  }
}

function withinPeriod(dateValue, since) {
  if (!dateValue) return false;
  const t = new Date(dateValue).getTime();
  return Number.isFinite(t) && t >= since.getTime();
}

/**
 * Compone el contexto depurado que se envía al modelo.
 *
 * No se vuelca el expediente entero: se separa lo estable (antecedentes) de
 * lo ocurrido en la ventana temporal, y cada bloque va etiquetado con su nivel
 * de autoridad para que el modelo no confunda lo que dijo el paciente con lo
 * que validó el terapeuta.
 */
export function buildReportContext({
  profile = {},
  period = 'semanal',
  timelineEvents = [],
  lifeTree = [],
  episodes = [],
  conversations = [],
  messages = [],
  moods = [],
  documents = [],
  directives = [],
  previousReport = null
} = {}) {
  const cfg = REPORT_PERIODS[period] || REPORT_PERIODS.semanal;
  const since = new Date(Date.now() - cfg.days * 24 * 60 * 60 * 1000);

  const ctx = profile?.contexto_terapeutico || {};
  const sections = [];

  sections.push(
    `PERIODO DEL INFORME: ${cfg.label} (${cfg.days} días, desde ${since.toISOString().slice(0, 10)} hasta ${new Date().toISOString().slice(0, 10)}).`
  );

  // --- Identidad y encuadre ---
  const identity = [
    ctx.displayName || ctx.name ? `Nombre de trabajo: ${ctx.displayName || ctx.name}` : null,
    ctx.consultationType ? `Modalidad: ${ctx.consultationType}` : null,
    ctx.preferredModality ? `Formato: ${ctx.preferredModality}` : null,
    Array.isArray(ctx.temas) && ctx.temas.length
      ? `Temas abiertos en el expediente: ${ctx.temas.map(t => t.title || t).join(', ')}`
      : null
  ].filter(Boolean);
  if (identity.length) sections.push(`ENCUADRE DEL CASO:\n${identity.join('\n')}`);

  // --- N1: lo que ha establecido el psicólogo. Va primero y manda. ---
  if (directives.length) {
    sections.push(
      `DIRECTIVAS DEL PSICÓLOGO COLEGIADO [${authorityTag(AuthorityLevel.LEVEL_1_PSYCHOLOGIST)}]\n` +
      'Prevalecen sobre cualquier inferencia. Si algo las contradice, gana la directiva.\n' +
      directives.map(d => `- ${d.content || d.directive || d.text}`).join('\n')
    );
  }

  // --- Antecedentes estables ---
  const hist = ctx.historial_clinico || {};
  const background = Object.entries(hist)
    .filter(([, v]) => typeof v === 'string' && v.trim())
    .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`);
  if (background.length) {
    sections.push(`ANTECEDENTES DEL EXPEDIENTE [${authorityTag(AuthorityLevel.LEVEL_3_DECLARED)}]\n${background.join('\n')}`);
  }

  // --- Árbol vital ---
  if (lifeTree.length) {
    sections.push(
      'ÁRBOL VITAL (estado consolidado):\n' +
      lifeTree.slice(0, 60).map(n =>
        `- [${n.category || n.categoria}] ${n.content || n.hallazgo || n.description} [${authorityTag(n.authority_level)}]`
      ).join('\n')
    );
  }

  // --- Cronología: se separa lo del periodo de lo anterior ---
  const eventsInPeriod = timelineEvents.filter(e => withinPeriod(e.created_at || e.event_date, since));
  const eventsBefore = timelineEvents.filter(e => !withinPeriod(e.created_at || e.event_date, since));

  if (eventsInPeriod.length) {
    sections.push(
      `EVENTOS REGISTRADOS EN ESTE PERIODO (${eventsInPeriod.length}):\n` +
      eventsInPeriod.map(e =>
        `- [${e.event_date || e.date}] ${e.description || e.event} [${authorityTag(e.authority_level)}]`
      ).join('\n')
    );
  } else {
    sections.push('EVENTOS REGISTRADOS EN ESTE PERIODO: ninguno.');
  }

  if (eventsBefore.length) {
    sections.push(
      `CRONOLOGÍA ANTERIOR (contexto, ${Math.min(eventsBefore.length, 40)} de ${eventsBefore.length}):\n` +
      eventsBefore.slice(0, 40).map(e =>
        `- [${e.event_date || e.date}] ${e.description || e.event}`
      ).join('\n')
    );
  }

  // --- Episodios clínicos del periodo ---
  const episodesInPeriod = episodes.filter(e => withinPeriod(e.created_at || e.occurred_at, since));
  if (episodesInPeriod.length) {
    sections.push(
      `EPISODIOS DEL PERIODO (${episodesInPeriod.length}):\n` +
      episodesInPeriod.map(e =>
        `- ${e.summary || e.description || e.content} [${authorityTag(e.authority_level)}]`
      ).join('\n')
    );
  }

  // --- Estado de ánimo ---
  const moodsInPeriod = moods.filter(m => withinPeriod(m.date || m.created_at, since));
  if (moodsInPeriod.length) {
    sections.push(
      `REGISTROS DE ÁNIMO DEL PERIODO (${moodsInPeriod.length}):\n` +
      moodsInPeriod.map(m => `- ${m.date}: ${m.mood ?? m.score ?? '?'}${m.note ? ` — "${m.note}"` : ''}`).join('\n')
    );
  } else {
    sections.push('REGISTROS DE ÁNIMO DEL PERIODO: ninguno.');
  }

  // --- Conversaciones: literales, porque de aquí salen las citas ---
  const msgsInPeriod = messages.filter(m => withinPeriod(m.created_at, since));
  if (msgsInPeriod.length) {
    const transcript = msgsInPeriod
      .map(m => `${m.role === 'assistant' ? 'ÁNCORA' : 'PACIENTE'} [${String(m.created_at).slice(0, 16).replace('T', ' ')}]: ${m.content}`)
      .join('\n');
    sections.push(
      `TRANSCRIPCIÓN DE CONVERSACIONES DEL PERIODO [${authorityTag(AuthorityLevel.LEVEL_3_DECLARED)}]\n` +
      `(${conversations.length} conversación/es, ${msgsInPeriod.length} mensajes. Extrae de aquí las citas literales.)\n` +
      truncateTranscript(transcript)
    );
  } else {
    sections.push('TRANSCRIPCIÓN DE CONVERSACIONES DEL PERIODO: no hay mensajes en la ventana temporal.');
  }

  // --- Documentos aportados ---
  const docsInPeriod = documents.filter(d => withinPeriod(d.created_at, since));
  if (docsInPeriod.length) {
    sections.push(
      `DOCUMENTOS APORTADOS EN EL PERIODO (${docsInPeriod.length}) [${authorityTag(AuthorityLevel.LEVEL_2_DOCUMENTED)}]\n` +
      docsInPeriod.map(d => `- ${d.file_name || d.name}: ${(d.summary || d.extracted_summary || '').slice(0, 500)}`).join('\n')
    );
  }

  // --- Informe anterior, para poder hablar de evolución ---
  if (previousReport) {
    sections.push(
      `INFORME ANTERIOR (${previousReport.period || ''}, ${String(previousReport.created_at || '').slice(0, 10)}):\n` +
      `${(previousReport.resumen_ejecutivo || previousReport.summary || '').slice(0, 2000)}`
    );
  } else {
    sections.push('INFORME ANTERIOR: no existe. Este es el primer informe del paciente.');
  }

  return {
    text: sections.join('\n\n'),
    stats: {
      conversaciones: conversations.length,
      mensajes: msgsInPeriod.length,
      registros_animo: moodsInPeriod.length,
      eventos_nuevos: eventsInPeriod.length,
      episodios: episodesInPeriod.length,
      documentos: docsInPeriod.length,
      directivas_n1: directives.length
    },
    since: since.toISOString(),
    periodConfig: cfg
  };
}

/** Recorta la transcripción conservando el principio y el final del periodo. */
function truncateTranscript(transcript, maxChars = 90000) {
  if (transcript.length <= maxChars) return transcript;
  const head = transcript.slice(0, Math.floor(maxChars * 0.4));
  const tail = transcript.slice(-Math.floor(maxChars * 0.6));
  return `${head}\n\n[... tramo intermedio omitido por longitud ...]\n\n${tail}`;
}

/**
 * ¿Hay material suficiente para que el informe valga algo?
 * Evita generar páginas de relleno sobre un periodo vacío.
 */
export function hasEnoughMaterial(stats) {
  const señales = [stats.mensajes, stats.registros_animo, stats.eventos_nuevos, stats.episodios, stats.documentos];
  return señales.reduce((a, b) => a + b, 0) >= 3;
}

/**
 * Genera el informe periódico para el psicólogo.
 *
 * @param {Object} opts
 * @param {string} opts.patientId
 * @param {string} opts.period            'semanal' | 'quincenal' | 'mensual'
 * @param {Object} opts.data              Material del expediente (ver buildReportContext).
 * @param {string} opts.psychologistId    Autor destinatario del informe.
 * @param {Function} opts.onToken         Callback de streaming para la UI.
 * @param {AbortSignal} opts.signal
 * @returns {Promise<Object>} Informe estructurado listo para persistir.
 */
export async function generateClinicalReport({
  patientId,
  period = 'semanal',
  data = {},
  psychologistId = null,
  onToken = null,
  signal = null
} = {}) {
  if (!patientId) throw new ClinicalAIError('generateClinicalReport requiere patientId.');
  if (!REPORT_PERIODS[period]) {
    throw new ClinicalAIError(`Periodo no válido: "${period}". Usa semanal, quincenal o mensual.`);
  }

  const startedAt = Date.now();
  const context = buildReportContext({ ...data, period });

  if (!hasEnoughMaterial(context.stats)) {
    return {
      patient_id: patientId,
      psychologist_id: psychologistId,
      period,
      estado: 'sin_material_suficiente',
      informe: null,
      trazabilidad: {
        ...context.stats,
        motivo: 'El periodo no contiene actividad suficiente para un informe con valor clínico.',
        ventana_desde: context.since,
        generado_en: new Date().toISOString()
      }
    };
  }

  const { data: informe, model, usage } = await askClinicalJSON({
    system: REPORT_SYSTEM,
    schemaHint: REPORT_SCHEMA,
    messages: [{
      role: 'user',
      content: `Genera el informe ${context.periodConfig.label.toLowerCase()} para el psicólogo colegiado a partir del siguiente material del expediente.\n\n${context.text}\n\nRecuerda: marca el nivel de autoridad de cada afirmación, reproduce citas literales del paciente entre comillas, y no emitas diagnósticos.`
    }],
    model: CLINICAL_MODELS.REPORT,
    maxTokens: 16384,
    onToken,
    signal
  });

  return {
    patient_id: patientId,
    psychologist_id: psychologistId,
    period,
    estado: 'generado',
    // Material del psicólogo. No exponer al paciente sin filtrar.
    visibilidad: 'psicologo',
    informe,
    trazabilidad: {
      ...context.stats,
      ventana_desde: context.since,
      caracteres_contexto: context.text.length,
      modelo: model,
      uso_tokens: usage,
      duracion_ms: Date.now() - startedAt,
      generado_en: new Date().toISOString()
    }
  };
}

/**
 * Versión reducida y contenida del informe para el paciente que solicita
 * acceso. Evita volcarle el historial crudo: sin patrones sin validar, sin
 * señales de alerta en bruto y sin material que pueda resultar iatrogénico.
 *
 * El diagnóstico y la devolución clínica siguen siendo del profesional.
 */
export async function buildPatientSafeSummary({ report, signal = null } = {}) {
  const informe = report?.informe;
  if (!informe) {
    throw new ClinicalAIError('buildPatientSafeSummary requiere un informe generado.');
  }

  const { content, model } = await askClinicalAI({
    system: `Reescribes un informe clínico para devolvérselo al PACIENTE que ha pedido verlo.

El informe original está escrito para su psicólogo. Tu versión debe:
- Ser cálida, clara y en segunda persona.
- Recoger avances, esfuerzos y recursos propios que el paciente ha mostrado.
- Nombrar las dificultades sin crudeza y sin lenguaje alarmante.
- OMITIR por completo: patrones inferidos sin validar, señales de alerta en bruto, hipótesis del terapeuta y cualquier material que leído a solas pueda resultar dañino.
- Cerrar recordando que la lectura completa corresponde a su psicólogo en sesión.
- No diagnosticar ni etiquetar en ningún caso.

Devuelve texto plano, entre 150 y 300 palabras.`,
    messages: [{ role: 'user', content: JSON.stringify(informe).slice(0, 60000) }],
    model: CLINICAL_MODELS.REPORT,
    temperature: 0.4,
    maxTokens: 2048,
    signal
  });

  return {
    patient_id: report.patient_id,
    period: report.period,
    visibilidad: 'paciente',
    // La app debe exigir aceptación explícita antes de mostrarlo.
    requiere_aceptacion_riesgos: true,
    texto: content.trim(),
    generado_desde: report.trazabilidad?.generado_en || null,
    modelo: model
  };
}
