/**
 * @file anamnesisState.js
 * @description La brújula de la anamnesis: cuánto sabemos de cada dimensión,
 * cuánto vínculo hay, y qué toca explorar a continuación.
 *
 * Todo lo de aquí es aritmética sobre el expediente real. Ninguna función
 * llama a la IA ni a la red: el modelo recibe la conclusión ya calculada, de
 * modo que "qué explorar ahora" no dependa de su estado de ánimo.
 *
 * QUÉ CUENTA COMO SABER ALGO
 * --------------------------
 * Un hallazgo solo cuenta si lleva evidencia: una cita literal del paciente
 * que existe en la fuente. Sin ese requisito, una dimensión podría marcarse
 * como explorada a base de inferencias del modelo, que es exactamente lo que
 * este sistema no puede permitirse (ley L1 de la Biblia).
 *
 * LOS EJES 5P NO SE PREGUNTAN, SE DEDUCEN
 * ---------------------------------------
 * El pipeline de ingesta no etiqueta cada hallazgo con su eje de las 5 P, así
 * que se deduce de dónde aterrizó el dato, siguiendo el mapa del guion (§1.1):
 * un recurso es un Protector, una dificultad es un Mantenedor, el contexto de
 * fondo es un Predisponente y un desencadenante es un Precipitante. Si algún
 * día la extracción etiqueta el eje explícitamente, ese valor manda.
 */

import { LIFE_TREE_CATEGORIES } from '../services/clinicalIngestionService.js';

/** Estados de madurez de una dimensión, de menos a más. */
export const MaturityState = {
  PENDIENTE: 'PENDIENTE',
  EN_EXPLORACION: 'EN_EXPLORACION',
  EXPLORADA: 'EXPLORADA',
  CONSOLIDADA: 'CONSOLIDADA'
};

/** Puntuación de cada estado para la madurez global (0-100). */
const PUNTUACION = {
  [MaturityState.PENDIENTE]: 0,
  [MaturityState.EN_EXPLORACION]: 50,
  [MaturityState.EXPLORADA]: 90,
  [MaturityState.CONSOLIDADA]: 100
};

/** Niveles de vínculo que habilitan qué se puede proponer. */
export const BondLevel = {
  INICIAL: 'INICIAL',
  A: 'A',
  B: 'B'
};

/** Un hallazgo caduca a los 6 meses sin nada nuevo en su dimensión. */
const MESES_FRESCURA = 6;

/** Autoridad N1: revisado y confirmado por el psicólogo. */
const AUTORIDAD_VALIDADA = 1;

/**
 * ¿Este elemento del expediente lleva cita literal?
 *
 * Es el filtro que separa lo que el paciente dijo de lo que el modelo creyó
 * entender. Se usa igual al contar madurez y al resumirle al modelo lo que ya
 * sabemos: si un hallazgo no cuenta para la madurez, tampoco puede aparecer
 * como sabido en el prompt.
 */
export function tieneEvidencia(item) {
  const ev = item?.evidencia ?? item?.evidence ?? item?.verbatim ?? '';
  return typeof ev === 'string' && ev.trim().length >= 10;
}

function normalizarDimension(valor) {
  const v = String(valor || '').trim();
  return LIFE_TREE_CATEGORIES.includes(v) ? v : null;
}

/** Deduce el eje 5P de un hallazgo del árbol vital. */
function ejeDeHallazgo(item) {
  if (item?.eje) return String(item.eje);
  const valencia = String(item?.valencia || '').toLowerCase();
  if (valencia === 'recurso') return 'protectores';
  if (valencia === 'dificultad') return 'mantenedores';
  return 'predisponentes';
}

function fechaDe(item) {
  const bruto = item?.created_at || item?.fecha || item?.updated_at || null;
  const fecha = bruto ? new Date(bruto) : null;
  return fecha && !Number.isNaN(fecha.getTime()) ? fecha : null;
}

/**
 * Reúne los hallazgos de una dimensión desde todas las colecciones.
 *
 * @param {Object} expediente
 * @param {Array}  [expediente.arbol_vital]
 * @param {Array}  [expediente.desencadenantes]
 * @param {Array}  [expediente.anclajes_protectores]
 * @param {Array}  [expediente.eventos_timeline]
 * @param {string} dimension
 */
function hallazgosDeDimension(expediente, dimension) {
  const salida = [];

  for (const item of expediente?.arbol_vital || []) {
    if (normalizarDimension(item?.categoria ?? item?.dimension) !== dimension) continue;
    if (!tieneEvidencia(item)) continue;
    salida.push({ ...item, _eje: ejeDeHallazgo(item), _texto: item.hallazgo || '' });
  }

  // Desencadenantes y anclajes no llevan dimensión en el esquema actual: solo
  // se cuentan cuando alguien (la extracción o el psicólogo) se la ha puesto.
  for (const item of expediente?.desencadenantes || []) {
    if (normalizarDimension(item?.categoria ?? item?.dimension) !== dimension) continue;
    if (!tieneEvidencia(item)) continue;
    salida.push({ ...item, _eje: 'precipitantes', _texto: item.desencadenante || '' });
  }

  for (const item of expediente?.anclajes_protectores || []) {
    if (normalizarDimension(item?.categoria ?? item?.dimension) !== dimension) continue;
    if (!tieneEvidencia(item)) continue;
    salida.push({ ...item, _eje: 'protectores', _texto: item.ancla || item.anclaje || '' });
  }

  for (const item of expediente?.eventos_timeline || []) {
    if (normalizarDimension(item?.categoria ?? item?.dimension) !== dimension) continue;
    if (!tieneEvidencia(item)) continue;
    salida.push({ ...item, _eje: 'predisponentes', _texto: item.evento || item.event || '' });
  }

  // Un mismo hecho contado dos veces no es saber más: se deduplica por texto.
  const vistos = new Set();
  return salida.filter(h => {
    const clave = String(h._texto).toLowerCase().replace(/\s+/g, ' ').trim();
    if (!clave || vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
}

/**
 * Calcula el estado de madurez de una dimensión.
 *
 * @returns {{
 *   dimension: string, estado: string, hallazgos: number,
 *   ejes: string[], ejesCubiertos: number, valenciaBalanceada: boolean,
 *   validadoPorPsicologo: boolean, actualizadoHace: number|null
 * }}
 */
export function computeDimensionMaturity(expediente, dimension) {
  const hallazgos = hallazgosDeDimension(expediente, dimension);
  const ejes = [...new Set(hallazgos.map(h => h._eje))];

  const valencias = new Set(hallazgos.map(h => String(h.valencia || '').toLowerCase()));
  const valenciaBalanceada = valencias.has('recurso') && valencias.has('dificultad');

  const validadoPorPsicologo = hallazgos.some(
    h => Number(h.authority_level ?? h.nivel_autoridad ?? 99) <= AUTORIDAD_VALIDADA
  );

  const fechas = hallazgos.map(fechaDe).filter(Boolean);
  const masReciente = fechas.length ? new Date(Math.max(...fechas.map(f => f.getTime()))) : null;
  const actualizadoHace = masReciente
    ? Math.floor((Date.now() - masReciente.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null;

  let estado;
  if (hallazgos.length === 0) {
    estado = MaturityState.PENDIENTE;
  } else if (hallazgos.length >= 3 && ejes.length >= 3 && valenciaBalanceada) {
    // CONSOLIDADA pide además sello del psicólogo y que no esté rancio.
    const fresco = actualizadoHace === null || actualizadoHace <= MESES_FRESCURA;
    estado = validadoPorPsicologo && fresco ? MaturityState.CONSOLIDADA : MaturityState.EXPLORADA;
  } else {
    estado = MaturityState.EN_EXPLORACION;
  }

  return {
    dimension,
    estado,
    hallazgos: hallazgos.length,
    ejes,
    ejesCubiertos: ejes.length,
    valenciaBalanceada,
    validadoPorPsicologo,
    actualizadoHace
  };
}

/**
 * Estado completo de la anamnesis: las 6 dimensiones más la madurez global.
 *
 * @param {Object} expediente
 * @param {Object} [meta]
 * @param {number} [meta.conversaciones]  Nº de conversaciones clínicas registradas.
 * @param {number} [meta.turnosPaciente]  Turnos totales del paciente (densidad).
 */
export function computeAnamnesisState(expediente = {}, meta = {}) {
  const dimensiones = LIFE_TREE_CATEGORIES.map(d => computeDimensionMaturity(expediente, d));

  const madurezGlobal = Math.round(
    dimensiones.reduce((suma, d) => suma + PUNTUACION[d.estado], 0) / dimensiones.length
  );

  const exploradas = dimensiones.filter(
    d => d.estado !== MaturityState.PENDIENTE
  ).length;

  return {
    dimensiones,
    madurezGlobal,
    dimensionesTocadas: exploradas,
    cobertura: Math.round((exploradas / dimensiones.length) * 100),
    totalHallazgos: dimensiones.reduce((n, d) => n + d.hallazgos, 0),
    vinculo: computeBondLevel(expediente, dimensiones, meta)
  };
}

/**
 * Nivel de vínculo: qué se puede *proponer*, nunca qué se puede forzar.
 *
 * Los umbrales numéricos son condición necesaria y no suficiente. El nivel B
 * —la puerta a los temas sensibles— exige además una señal del propio paciente
 * o una autorización expresa del psicólogo: los números solos no bastan para
 * preguntarle a alguien por un trauma.
 */
export function computeBondLevel(expediente = {}, dimensiones = null, meta = {}) {
  const dims = dimensiones || LIFE_TREE_CATEGORIES.map(d => computeDimensionMaturity(expediente, d));
  const conversaciones = Number(meta.conversaciones || 0);
  const turnos = Number(meta.turnosPaciente || 0);

  const hallazgosConEvidencia = dims.reduce((n, d) => n + d.hallazgos, 0);
  const dimensionesConDatos = dims.filter(d => d.hallazgos > 0).length;
  const dimensionesEnExploracion = dims.filter(
    d => d.estado !== MaturityState.PENDIENTE
  ).length;

  const cumpleA = conversaciones >= 2 && hallazgosConEvidencia >= 5 && dimensionesConDatos >= 2;

  // Densidad: 4 conversaciones bastan si tienen sustancia; si son de 2 líneas,
  // hacen falta 6. Hablar cuatro veces del tiempo no construye un vínculo.
  const densidadBaja = conversaciones > 0 && turnos / conversaciones < 6;
  const conversacionesSuficientes = densidadBaja ? conversaciones >= 6 : conversaciones >= 4;

  const señalEspontanea = Boolean(
    expediente?.senal_apertura_espontanea || meta.senalEspontanea
  );
  const autorizacionPsicologo = Boolean(
    expediente?.autorizacion_temas_sensibles || meta.autorizacionPsicologo
  );

  const cumpleUmbralesB =
    conversacionesSuficientes && dimensionesEnExploracion >= 3;
  // El nivel B incluye al A: no se entra en un trauma con menos trato del que
  // hace falta para preguntar por la infancia.
  const cumpleB = cumpleA && cumpleUmbralesB && (señalEspontanea || autorizacionPsicologo);

  return {
    nivel: cumpleB ? BondLevel.B : cumpleA ? BondLevel.A : BondLevel.INICIAL,
    conversaciones,
    hallazgosConEvidencia,
    dimensionesConDatos,
    // Se informa por separado para que el psicólogo vea POR QUÉ no está en B:
    // si es por falta de conversación o por falta de permiso.
    umbralesBCumplidos: cumpleUmbralesB,
    permisoParaSensibles: señalEspontanea || autorizacionPsicologo
  };
}

/**
 * Elige la dimensión que toca explorar: la menos cubierta.
 *
 * Empata a favor de la que tenga menos hallazgos, y en caso de igualdad
 * respeta el orden del árbol vital, que empieza por lo menos íntimo (salud
 * física) y termina por lo más (identidad y valores).
 */
export function selectNextDimension(estado) {
  const orden = { [MaturityState.PENDIENTE]: 0, [MaturityState.EN_EXPLORACION]: 1, [MaturityState.EXPLORADA]: 2, [MaturityState.CONSOLIDADA]: 3 };
  const candidatas = [...(estado?.dimensiones || [])].sort((a, b) => {
    if (orden[a.estado] !== orden[b.estado]) return orden[a.estado] - orden[b.estado];
    if (a.hallazgos !== b.hallazgos) return a.hallazgos - b.hallazgos;
    return LIFE_TREE_CATEGORIES.indexOf(a.dimension) - LIFE_TREE_CATEGORIES.indexOf(b.dimension);
  });
  return candidatas[0] || null;
}

/**
 * Dentro de una dimensión, qué eje 5P falta por tocar.
 * Se pide primero por Protectores: es el eje más fácil de responder y el que
 * menos expone, así que abre la puerta en vez de forzarla.
 */
export function selectNextAxis(dimensionState) {
  const preferencia = ['protectores', 'mantenedores', 'precipitantes', 'predisponentes'];
  const cubiertos = new Set(dimensionState?.ejes || []);
  return preferencia.find(e => !cubiertos.has(e)) || preferencia[0];
}
