/**
 * @file expediente.js
 * @description Lectura y escritura del expediente clínico estructurado.
 *
 * Un único sitio por el que pasan el chat (que lee para saber qué preguntar),
 * la ingesta de documentos y la grabadora de voz (que escriben lo extraído).
 * Sin este módulo, cada vía inventaría su propio formato y la brújula de
 * anamnesis leería una cosa distinta según quién hubiera escrito el dato.
 *
 * DÓNDE VIVE CADA COSA
 * --------------------
 *   clinical_life_tree/{patient_id}
 *     · tree_data            — formato antiguo: { categoria: [textos] }, sin cita.
 *     · arbol_vital          — hallazgos con categoría, valencia y EVIDENCIA.
 *     · desencadenantes      — disparador + respuesta observada + evidencia.
 *     · anclajes_protectores — recursos del paciente + evidencia.
 *   timeline_events/*        — hitos con fecha.
 *   risk_events/*            — señales del protocolo de riesgo.
 *
 * El formato antiguo se conserva y se sigue alimentando: hay vistas que lo
 * pintan. Lo que no se hace es contarlo como conocimiento verificado, porque
 * no lleva cita (ley L1).
 *
 * TODO LO QUE SE ESCRIBE AQUÍ NACE EN N3 (declarado por el paciente).
 * Solo el psicólogo puede promoverlo a N1 desde su portal.
 */

import { firebaseClient as db } from '../firebaseAdapter.js';
import { tieneEvidencia } from './anamnesisState.js';

/** Autoridad por defecto de lo que aporta el propio paciente. */
export const AUTORIDAD_PACIENTE = 3;
/** Autoridad de lo que viene en un documento clínico (informe, alta…). */
export const AUTORIDAD_DOCUMENTO = 2;

function listaSegura(valor) {
  return Array.isArray(valor) ? valor : [];
}

/**
 * Carga el expediente estructurado de un paciente.
 *
 * Nunca lanza: si falla una consulta devuelve esa parte vacía. El chat tiene
 * que poder responder aunque Firestore falle; lo que no puede es inventarse
 * el contexto.
 *
 * @param {string} patientId
 * @returns {Promise<Object>} Expediente listo para `computeAnamnesisState`.
 */
export async function loadExpediente(patientId) {
  const vacio = {
    arbol_vital: [],
    desencadenantes: [],
    anclajes_protectores: [],
    eventos_timeline: [],
    tree_data: {},
    senal_apertura_espontanea: false,
    autorizacion_temas_sensibles: false
  };
  if (!patientId) return vacio;

  const [arbol, eventos] = await Promise.all([
    db.from('clinical_life_tree').select('*').eq('patient_id', patientId).maybeSingle()
      .catch(() => ({ data: null })),
    db.from('timeline_events').select('*').eq('patient_id', patientId)
      .catch(() => ({ data: [] }))
  ]);

  const doc = arbol?.data || {};
  return {
    ...vacio,
    arbol_vital: listaSegura(doc.arbol_vital),
    desencadenantes: listaSegura(doc.desencadenantes),
    anclajes_protectores: listaSegura(doc.anclajes_protectores),
    eventos_timeline: listaSegura(eventos?.data),
    tree_data: doc.tree_data || {},
    senal_apertura_espontanea: Boolean(doc.senal_apertura_espontanea),
    autorizacion_temas_sensibles: Boolean(doc.autorizacion_temas_sensibles)
  };
}

/**
 * Cuenta conversaciones y turnos del paciente, que es lo que mide el vínculo.
 *
 * La densidad importa: cuatro conversaciones de dos líneas no son lo mismo que
 * cuatro conversaciones de verdad, y el umbral del nivel B lo tiene en cuenta.
 */
export async function loadConversationStats(patientId) {
  const vacio = { conversaciones: 0, turnosPaciente: 0 };
  if (!patientId) return vacio;

  try {
    const { data } = await db.from('conversations').select('*').eq('user_id', patientId);
    const conversaciones = listaSegura(data).filter(c => c.status !== 'archived');
    if (conversaciones.length === 0) return vacio;

    // El recuento de turnos se hace sobre las conversaciones más recientes:
    // no hace falta traerse el historial entero para saber si hay trato.
    const recientes = conversaciones.slice(0, 10);
    const mensajes = await Promise.all(
      recientes.map(c =>
        db.from('messages').select('*').eq('conversation_id', c.id)
          .then(r => listaSegura(r?.data).filter(m => m.role === 'user').length)
          .catch(() => 0)
      )
    );

    return {
      conversaciones: conversaciones.length,
      turnosPaciente: mensajes.reduce((a, b) => a + b, 0)
    };
  } catch {
    return vacio;
  }
}

/**
 * Guarda en el expediente los bloques extraídos por la ingesta.
 *
 * Solo entra lo que trae cita literal: el pipeline ya filtra, pero esto es la
 * última puerta antes de la base de datos y no se fía de nadie. Deduplica por
 * texto para que subir dos veces el mismo informe no duplique la historia.
 *
 * @param {string} patientId
 * @param {Object} bloques              Salida de `ingestClinicalSource`.
 * @param {Object} [opciones]
 * @param {number} [opciones.autoridad] Nivel de autoridad de la fuente.
 * @param {string} [opciones.origen]    Identificador de la fuente, para trazar.
 * @returns {Promise<{guardados: Object, descartados: number}>}
 */
export async function persistIngestionResult(patientId, entrada = {}, { autoridad = AUTORIDAD_PACIENTE, origen = null } = {}) {
  if (!patientId) throw new Error('persistIngestionResult necesita el id del paciente.');

  // `ingestClinicalSource` devuelve los hallazgos dentro de `extraction`, junto
  // a la trazabilidad. Se aceptan las dos formas —el resultado entero o solo
  // los bloques— porque pasar el objeto completo es el error natural, y
  // silenciosamente no habría guardado nada.
  const bloques = entrada?.extraction && typeof entrada.extraction === 'object'
    ? entrada.extraction
    : entrada;

  const sello = { authority_level: autoridad, origen, created_at: new Date().toISOString() };
  const conEvidencia = lista => listaSegura(lista).filter(tieneEvidencia).map(i => ({ ...i, ...sello }));

  const nuevos = {
    arbol_vital: conEvidencia(bloques.arbol_vital),
    desencadenantes: conEvidencia(bloques.desencadenantes),
    anclajes_protectores: conEvidencia(bloques.anclajes_protectores)
  };
  const descartados =
    (listaSegura(bloques.arbol_vital).length - nuevos.arbol_vital.length) +
    (listaSegura(bloques.desencadenantes).length - nuevos.desencadenantes.length) +
    (listaSegura(bloques.anclajes_protectores).length - nuevos.anclajes_protectores.length);

  const actual = await loadExpediente(patientId);

  const fundir = (previos, entrantes, clave) => {
    const vistos = new Set(previos.map(p => String(p[clave] || '').toLowerCase().trim()));
    const añadidos = entrantes.filter(e => {
      const k = String(e[clave] || '').toLowerCase().trim();
      if (!k || vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
    return [...previos, ...añadidos];
  };

  const arbolVital = fundir(actual.arbol_vital, nuevos.arbol_vital, 'hallazgo');

  // El formato antiguo se sigue alimentando para las vistas que lo pintan.
  const treeData = { ...actual.tree_data };
  for (const h of nuevos.arbol_vital) {
    const cat = h.categoria || h.dimension;
    if (!cat || !h.hallazgo) continue;
    const lista = Array.isArray(treeData[cat]) ? treeData[cat] : [];
    if (!lista.includes(h.hallazgo)) lista.push(h.hallazgo);
    treeData[cat] = lista;
  }

  await db.from('clinical_life_tree').upsert({
    patient_id: patientId,
    tree_data: treeData,
    arbol_vital: arbolVital,
    desencadenantes: fundir(actual.desencadenantes, nuevos.desencadenantes, 'desencadenante'),
    anclajes_protectores: fundir(actual.anclajes_protectores, nuevos.anclajes_protectores, 'ancla'),
    updated_at: new Date().toISOString()
  }, { onConflict: 'patient_id' });

  // Los hitos con fecha van a su propia colección, que es la que pinta la
  // línea de vida del portal del psicólogo.
  const eventos = conEvidencia(bloques.eventos_timeline);
  const yaExisten = new Set(actual.eventos_timeline.map(e => String(e.event || e.evento || '').toLowerCase().trim()));
  for (const ev of eventos) {
    const texto = ev.evento || ev.event || ev.hito || '';
    if (!texto || yaExisten.has(texto.toLowerCase().trim())) continue;
    await db.from('timeline_events').insert([{
      patient_id: patientId,
      date: ev.fecha || ev.date || String(new Date().getFullYear()),
      event: texto,
      event_type: ev.tipo || ev.event_type || 'vital_event',
      categoria: ev.categoria || ev.dimension || null,
      evidencia: ev.evidencia,
      ...sello
    }]).catch(() => {});
  }

  return {
    guardados: {
      arbol_vital: nuevos.arbol_vital.length,
      desencadenantes: nuevos.desencadenantes.length,
      anclajes_protectores: nuevos.anclajes_protectores.length,
      eventos_timeline: eventos.length
    },
    descartados
  };
}

/**
 * Registra una señal de riesgo. Nunca interrumpe el flujo del chat: si la
 * escritura falla se avisa por consola, porque dejar al paciente sin respuesta
 * por un fallo de base de datos sería peor que perder el registro (que además
 * queda en la conversación, y esa sí se guarda).
 */
export async function persistRiskEvent(registro) {
  if (!registro) return false;
  try {
    await db.from('risk_events').insert([registro]);
    return true;
  } catch (err) {
    console.error('[expediente] No se pudo registrar la señal de riesgo:', err?.message);
    return false;
  }
}

/**
 * Guarda una nota de voz: la organizada Y la transcripción literal.
 *
 * Las dos, siempre (ley L2). La nota organizada es la que se lee; el verbatim
 * es la fuente de verdad contra la que se comprueba cualquier cita y lo que el
 * psicólogo puede consultar si algo le chirría. Guardar solo la versión bonita
 * sería quedarse con la interpretación y tirar el original.
 *
 * @param {string} patientId
 * @param {Object} sesion  Salida de `processRecordingSession`.
 * @returns {Promise<{documentId: string, guardados: Object}>}
 */
export async function guardarNotaDeVoz(patientId, sesion = {}) {
  if (!patientId) throw new Error('guardarNotaDeVoz necesita el id del paciente.');
  const { nota = {}, verbatim = '', trazabilidad = null } = sesion;

  const documentId = (globalThis.crypto?.randomUUID?.() || `nota-${Date.now()}`);
  const ahora = new Date().toISOString();

  await db.from('clinical_documents').insert([{
    id: documentId,
    patient_id: patientId,
    uploaded_by: patientId,
    file_name: nota.titulo || 'Nota de voz',
    mime_type: 'text/plain',
    source_kind: 'nota_voz',
    extraction_status: 'completed',
    summary: nota.resumen || '',
    // El original entero, sin recortar por debajo del límite de Firestore.
    source_text: String(verbatim).slice(0, 900000),
    nota_organizada: nota.texto_organizado || '',
    citas_literales: nota.citas_literales || [],
    cabos_sueltos: nota.cabos_sueltos || [],
    estado_emocional: nota.estado_emocional_expresado || '',
    trazabilidad,
    authority_level: AUTORIDAD_PACIENTE,
    created_at: ahora
  }]);

  // Los temas de la nota entran en el árbol vital con su cita, igual que
  // cualquier otra fuente: una nota de voz no tiene un carril propio.
  const hallazgos = (nota.temas || [])
    .map((t, i) => ({
      categoria: t.categoria || null,
      hallazgo: t.detalle || t.tema,
      valencia: 'neutro',
      evidencia: nota.citas_literales?.[i]?.cita || ''
    }))
    .filter(h => h.categoria && tieneEvidencia(h));

  const guardados = hallazgos.length
    ? (await persistIngestionResult(patientId, { arbol_vital: hallazgos }, {
        autoridad: AUTORIDAD_PACIENTE,
        origen: `nota_voz:${documentId}`
      })).guardados
    : { arbol_vital: 0 };

  return { documentId, guardados };
}

/**
 * Deja constancia de que el paciente abrió un tema sensible por su cuenta.
 * Es la señal cualitativa que, junto a los umbrales, habilita el nivel B.
 */
export async function marcarSenalEspontanea(patientId) {
  if (!patientId) return;
  try {
    await db.from('clinical_life_tree').upsert({
      patient_id: patientId,
      senal_apertura_espontanea: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'patient_id' });
  } catch (err) {
    console.warn('[expediente] No se pudo marcar la señal espontánea:', err?.message);
  }
}
