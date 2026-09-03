/**
 * @file expansionConsulta.js
 * @description Expansión de consulta: buscar también por lo que el paciente
 * NO ha escrito pero quiere decir.
 *
 * EL PROBLEMA QUE RESUELVE
 * ------------------------
 * BM25 encuentra palabras, no significados. Si el paciente escribe «no
 * descanso» y en su expediente pone «me despierto a las cuatro», no hay una
 * sola palabra en común: el recuerdo existe, es exactamente el que hacía falta,
 * y no aparece. Está comprobado en la suite: «dormir» tampoco encuentra
 * «duermo», porque es un verbo irregular y el recorte de sufijos no llega ahí.
 *
 * La solución sin vectores es ampliar la consulta antes de buscar: se le piden
 * al modelo las formas en que esa misma idea puede estar escrita en el
 * expediente, y se busca por todas. Es la vía documentada en la literatura
 * (GenQREnsemble: +18% nDCG@10 sobre BM25 solo) y no exige mandar el expediente
 * a ningún proveedor de embeddings, que era el problema del RGPD (D-07).
 *
 * DOS CAUTELAS QUE NO SON OPCIONALES
 * ----------------------------------
 * 1. **Las expansiones NO son hechos.** Amplían la búsqueda, nunca el
 *    contenido. Lo que se recupera sigue siendo lo que el paciente dijo, con su
 *    cita; el modelo solo ayuda a encontrarlo.
 * 2. **Si falla, se busca sin expandir.** Una consulta ampliada es mejor, pero
 *    una consulta sin ampliar funciona. Que se caiga el router no puede dejar
 *    al paciente sin memoria.
 */

import { askClinicalJSON, CLINICAL_MODELS } from '../claudeService.js';

const SISTEMA = `Ayudas a buscar en el expediente de un paciente de psicología.

Te dan lo que acaba de escribir. Devuelves las palabras con las que ESA MISMA IDEA podría estar escrita en sus notas anteriores, que las escribió él, en lenguaje corriente y no clínico.

Reglas:
- Solo palabras y expresiones cortas, nada de frases.
- Incluye las formas verbales que cambian de raíz: si dice "dormir", pon también "duermo", "duerme".
- Incluye cómo lo diría una persona normal: para "insomnio", cosas como "no pego ojo", "me despierto", "dando vueltas".
- NO inventes síntomas, diagnósticos ni datos que no estén implícitos en lo que ha escrito.
- NO uses jerga clínica salvo que la haya usado él.
- Entre 4 y 10 términos. Si lo que escribe no da para más, devuelve menos.`;

const ESQUEMA = `{ "terminos": ["string", "..."] }`;

/** Expansiones fijas para lo que sale una y otra vez en un expediente. */
const ATAJOS = {
  dormir: ['duermo', 'duerme', 'sueño', 'despierto', 'noches', 'descansar'],
  ansiedad: ['ansioso', 'nervios', 'agobio', 'angustia', 'pecho'],
  triste: ['tristeza', 'bajón', 'hundido', 'llorar', 'apagado'],
  trabajo: ['curro', 'oficina', 'jefe', 'laboral', 'empleo'],
  pareja: ['novio', 'novia', 'marido', 'mujer', 'relación'],
  familia: ['padre', 'madre', 'hermano', 'hermana', 'casa'],
  dinero: ['deuda', 'economía', 'pagar', 'sueldo', 'gastos']
};

/**
 * Expansión inmediata, sin red.
 *
 * Cubre los temas más repetidos de un expediente de psicología y no cuesta
 * nada. Se usa siempre; la del modelo se suma cuando hay tiempo y conexión.
 */
export function expandirLocal(consulta) {
  const texto = String(consulta || '').toLowerCase();
  const terminos = new Set();
  for (const [clave, expansiones] of Object.entries(ATAJOS)) {
    if (texto.includes(clave)) expansiones.forEach(e => terminos.add(e));
  }
  return [...terminos];
}

/**
 * Expansión con el modelo. Devuelve SOLO términos, nunca contenido.
 *
 * @param {string} consulta
 * @param {Object} [opciones]
 * @param {number} [opciones.maximo]
 * @param {AbortSignal} [opciones.signal]
 * @returns {Promise<string[]>}
 */
export async function expandirConModelo(consulta, { maximo = 10, signal = null } = {}) {
  const limpia = String(consulta || '').trim();
  if (limpia.length < 4) return [];

  try {
    const { data } = await askClinicalJSON({
      system: SISTEMA,
      schemaHint: ESQUEMA,
      messages: [{ role: 'user', content: `Lo que ha escrito:\n"""${limpia.slice(0, 500)}"""` }],
      model: CLINICAL_MODELS.CHAT,
      temperature: 0.3,
      maxTokens: 300,
      signal
    });

    const terminos = Array.isArray(data?.terminos) ? data.terminos : [];
    return terminos
      .filter(t => typeof t === 'string' && t.trim().length > 2 && t.length < 40)
      .map(t => t.trim().toLowerCase())
      .slice(0, maximo);
  } catch (err) {
    // Sin expansión se busca peor, pero se busca. Lo que no puede pasar es que
    // un fallo del router deje al paciente sin su propia memoria.
    console.warn('[expansionConsulta] Se busca sin expandir:', err?.message);
    return [];
  }
}

/**
 * Expansión completa: la local siempre, la del modelo si se pide.
 *
 * @param {string} consulta
 * @param {Object} [opciones]
 * @param {boolean} [opciones.usarModelo]  Por defecto no: la búsqueda del chat
 *   va en el camino rápido y no puede esperar a otra llamada de red.
 */
export async function expandirConsulta(consulta, { usarModelo = false, signal = null } = {}) {
  const locales = expandirLocal(consulta);
  if (!usarModelo) return locales;

  const delModelo = await expandirConModelo(consulta, { signal });
  return [...new Set([...locales, ...delModelo])];
}
