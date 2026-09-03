/**
 * @file informes.js
 * @description Genera y guarda el informe periódico del psicólogo.
 *
 * Reúne el material del expediente, se lo pasa al motor de informes y persiste
 * el resultado en `clinical_reports`. Es el pegamento entre el servicio de IA
 * (que no sabe de Firebase) y el portal del psicólogo (que no debe saber de
 * prompts).
 *
 * A QUIÉN PERTENECE EL INFORME
 * ----------------------------
 * Al psicólogo. El informe completo lleva material sensible —hipótesis de
 * trabajo, señales de riesgo, contradicciones detectadas— que no se le entrega
 * al paciente sin más (ley L13). Para él existe una versión resumida y contenida,
 * que se genera aparte y solo cuando el profesional lo decide.
 *
 * LOS HALLAZGOS NACEN COMO N4
 * ---------------------------
 * Todo lo que produce la IA es inferencia hasta que un profesional la valida.
 * Por eso el informe se guarda con `authority_level: 4` y con los hallazgos
 * marcados como pendientes: cuando el psicólogo acepta uno, ese sube a N1 y
 * manda sobre cualquier inferencia posterior (ley L4).
 */

import { firebaseClient as db } from '../firebaseAdapter.js';
import {
  generateClinicalReport,
  buildPatientSafeSummary,
  REPORT_PERIODS
} from '../services/clinicalReportService.js';

/** Autoridad de lo que produce la IA: inferencia, hasta que alguien la valide. */
const AUTORIDAD_INFERENCIA = 4;

function lista(valor) {
  return Array.isArray(valor) ? valor : [];
}

/**
 * Reúne todo el material del periodo. Cada consulta va por separado y con su
 * red: que falte una colección no puede impedir el informe entero, pero sí
 * tiene que notarse, así que se devuelve qué se pudo leer.
 */
export async function reunirMaterial(patientId, { periodo = 'semanal' } = {}) {
  if (!patientId) throw new Error('reunirMaterial necesita el id del paciente.');

  const dias = (REPORT_PERIODS[periodo] || REPORT_PERIODS.semanal).days;
  const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString();

  const leer = async (coleccion, campo = 'patient_id') => {
    try {
      const { data } = await db.from(coleccion).select('*').eq(campo, patientId);
      return lista(data);
    } catch (err) {
      console.warn(`[informes] No se ha podido leer ${coleccion}:`, err?.message);
      return [];
    }
  };

  const [perfilRes, eventos, arbol, episodios, animo, documentos, directivas, conversaciones] =
    await Promise.all([
      db.from('profiles').select('*').eq('id', patientId).maybeSingle().catch(() => ({ data: null })),
      leer('timeline_events'),
      db.from('clinical_life_tree').select('*').eq('patient_id', patientId).maybeSingle().catch(() => ({ data: null })),
      leer('clinical_episodes'),
      leer('daily_moods', 'user_id'),
      leer('clinical_documents'),
      leer('clinical_directives'),
      leer('conversations', 'user_id')
    ]);

  // Los mensajes se traen solo de las conversaciones del periodo: el historial
  // entero no cabe, y lo viejo ya está resumido en informes anteriores.
  const recientes = conversaciones
    .filter(c => !c.created_at || c.created_at >= desde)
    .slice(0, 12);
  const mensajes = (await Promise.all(
    recientes.map(c =>
      db.from('messages').select('*').eq('conversation_id', c.id)
        .then(r => lista(r?.data))
        .catch(() => [])
    )
  )).flat();

  const previos = await leer('clinical_reports');
  const informeAnterior = previos
    .filter(r => r.period === periodo)
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))[0] || null;

  const doc = arbol?.data || {};
  return {
    profile: perfilRes?.data || {},
    period: periodo,
    timelineEvents: eventos,
    lifeTree: lista(doc.arbol_vital),
    episodes: episodios,
    conversations: recientes,
    messages: mensajes,
    moods: animo,
    documents: documentos,
    directives: directivas,
    previousReport: informeAnterior
  };
}

/**
 * Genera el informe y lo guarda.
 *
 * @param {Object} opts
 * @param {string} opts.patientId
 * @param {string} opts.psychologistId
 * @param {string} [opts.periodo]     'semanal' | 'quincenal' | 'mensual'
 * @param {Function} [opts.onToken]   Para pintar la generación en vivo.
 * @param {Function} [opts.onPaso]    Avisos de progreso legibles.
 * @returns {Promise<{informe: Object, id: string|null, guardado: boolean}>}
 */
export async function generarYGuardarInforme({
  patientId,
  psychologistId,
  periodo = 'semanal',
  onToken = null,
  onPaso = null,
  signal = null
} = {}) {
  if (!patientId) throw new Error('generarYGuardarInforme necesita el id del paciente.');

  onPaso?.('Reuniendo el material del periodo...');
  const material = await reunirMaterial(patientId, { periodo });

  onPaso?.('Redactando el informe...');
  const informe = await generateClinicalReport({
    patientId,
    period: periodo,
    data: material,
    psychologistId,
    onToken,
    signal
  });

  // El motor devuelve un informe "sin material suficiente" cuando el periodo
  // está vacío. Eso no se guarda: un expediente lleno de informes que dicen
  // que no hay nada que decir solo entorpece al profesional.
  if (informe?.sin_material) {
    onPaso?.('El periodo no tiene material suficiente para un informe.');
    return { informe, id: null, guardado: false };
  }

  onPaso?.('Guardando...');
  const id = `rep-${periodo}-${Date.now()}`;
  const registro = {
    id,
    patient_id: patientId,
    psychologist_id: psychologistId || null,
    period: periodo,
    content: informe,
    // Todo lo que sale de la IA es inferencia hasta que el profesional la
    // valida; solo entonces sube a N1 y manda sobre lo demás (L4).
    authority_level: AUTORIDAD_INFERENCIA,
    validation_status: 'pending',
    hallazgos_validados: [],
    hallazgos_descartados: [],
    compartido_con_paciente: false,
    created_at: new Date().toISOString()
  };

  try {
    await db.from('clinical_reports').insert([registro]);
    return { informe, id, guardado: true };
  } catch (err) {
    // Que falle el guardado no puede tirar el informe recién generado: se
    // devuelve igual para que el profesional lo lea y decida.
    console.error('[informes] No se ha podido guardar el informe:', err?.message);
    return { informe, id: null, guardado: false, error: err?.message };
  }
}

/**
 * El psicólogo acepta o descarta un hallazgo del informe.
 *
 * Aceptar es lo que convierte una inferencia (N4) en criterio clínico (N1).
 * A partir de ahí manda sobre cualquier cosa que infiera la IA después.
 */
export async function validarHallazgo(reportId, { hallazgo, aceptado, psychologistId }) {
  if (!reportId || !hallazgo) throw new Error('validarHallazgo necesita el informe y el hallazgo.');

  const { data: actual } = await db.from('clinical_reports').select('*').eq('id', reportId).maybeSingle();
  if (!actual) throw new Error('No se encuentra el informe.');

  const marca = {
    hallazgo,
    por: psychologistId || null,
    fecha: new Date().toISOString()
  };
  const validados = lista(actual.hallazgos_validados);
  const descartados = lista(actual.hallazgos_descartados);

  await db.from('clinical_reports').update({
    hallazgos_validados: aceptado ? [...validados, marca] : validados,
    hallazgos_descartados: aceptado ? descartados : [...descartados, marca],
    validation_status: 'reviewed',
    reviewed_at: new Date().toISOString()
  }).eq('id', reportId);

  return { aceptado, hallazgo };
}

/**
 * Versión para el paciente: resumida, contenida y solo si el profesional la
 * comparte a propósito (L13). No se genera sola al hacer el informe.
 */
export async function compartirConPaciente(reportId, { signal = null } = {}) {
  const { data: informe } = await db.from('clinical_reports').select('*').eq('id', reportId).maybeSingle();
  if (!informe) throw new Error('No se encuentra el informe.');

  const resumen = await buildPatientSafeSummary({ report: informe.content, signal });

  await db.from('clinical_reports').update({
    compartido_con_paciente: true,
    resumen_paciente: resumen,
    compartido_at: new Date().toISOString()
  }).eq('id', reportId);

  return resumen;
}
