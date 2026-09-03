/**
 * @file generarBancoPreguntas.mjs
 * @description Compila el banco de preguntas del guion clínico a código.
 *
 *   docs/clinico/GUION_ANAMNESIS.md  →  src/lib/anamnesisBank.generated.js
 *
 * POR QUÉ UN COMPILADOR Y NO COPIAR EL CONTENIDO A MANO
 * ----------------------------------------------------
 * El banco de preguntas es contenido clínico: se revisa, se discute y se
 * corrige leyéndolo, no leyendo un array de JavaScript. Manteniendo el
 * markdown como fuente de verdad, quien edita las preguntas trabaja sobre un
 * texto legible y el código se regenera solo. Copiarlo a mano garantizaría que
 * ambos se separasen a la primera corrección.
 *
 * Uso:  npm run guion         (y `npm run guion -- --check` en CI)
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGEN = join(raiz, 'docs/clinico/GUION_ANAMNESIS.md');
const DESTINO = join(raiz, 'src/lib/anamnesisBank.generated.js');

/** Normaliza el nombre del eje 5P a la clave que usa el código. */
const EJES = {
  'problema': 'problema',
  'predisponentes': 'predisponentes',
  'precipitantes': 'precipitantes',
  'mantenedores': 'mantenedores',
  'protectores': 'protectores'
};

function parsearBanco(markdown) {
  const lineas = markdown.split('\n');

  // La sección 2 es la única que se compila. Fuera de ella hay tablas y prosa
  // con el mismo aspecto que confundirían al parser.
  const inicio = lineas.findIndex(l => /^##\s+2\.\s+Banco de preguntas/.test(l));
  const fin = lineas.findIndex((l, i) => i > inicio && /^##\s+3\./.test(l));
  if (inicio === -1 || fin === -1) {
    throw new Error('No se localiza la sección "2. Banco de preguntas" en el guion.');
  }

  const cuerpo = lineas.slice(inicio, fin);
  const subbloques = [];
  let dimension = null;
  let actual = null;
  let pregunta = null;

  const cerrarPregunta = () => {
    if (pregunta && actual) actual.preguntas.push(pregunta);
    pregunta = null;
  };
  const cerrarSubbloque = () => {
    cerrarPregunta();
    if (actual) subbloques.push(actual);
    actual = null;
  };

  for (const linea of cuerpo) {
    // ### Bloque 0 — Apertura   |   ### 1. `salud_fisica`
    const cabeceraDim = linea.match(/^###\s+(?:\d+\.\s+`([a-z_]+)`|Bloque 0)/);
    if (cabeceraDim) {
      cerrarSubbloque();
      dimension = cabeceraDim[1] || 'apertura';
      continue;
    }

    // **1.2 Sueño, alimentación y activación corporal — Mantenedores**
    const cabeceraSub = linea.match(/^\*\*(\d+\.\d+)\s+(.+?)(?:\s+[—-]\s+(\w+))?\*\*\s*$/);
    if (cabeceraSub) {
      cerrarSubbloque();
      const [, id, titulo, ejeCrudo] = cabeceraSub;
      const eje = EJES[String(ejeCrudo || '').toLowerCase()] || 'problema';
      actual = { id, dimension, titulo: titulo.trim(), eje, datos: '', preguntas: [] };
      continue;
    }

    if (!actual) continue;

    if (/^Datos a recoger:/.test(linea)) {
      actual.datos = linea.replace(/^Datos a recoger:\s*/, '').trim();
      continue;
    }

    // 1. ¿Qué te trae por aquí ahora mismo?
    const nuevaPregunta = linea.match(/^\d+\.\s+(.*\S)\s*$/);
    if (nuevaPregunta) {
      cerrarPregunta();
      pregunta = { texto: nuevaPregunta[1].trim(), seguimiento: [] };
      continue;
    }

    //    - ¿Desde cuándo dirías que…?
    const seguimiento = linea.match(/^\s+-\s+(.*\S)\s*$/);
    if (seguimiento && pregunta) {
      pregunta.seguimiento.push(seguimiento[1].trim());
    }
  }
  cerrarSubbloque();

  return subbloques;
}

function validar(subbloques) {
  const errores = [];
  if (subbloques.length < 20) {
    errores.push(`Se esperaban al menos 20 subbloques y se han leído ${subbloques.length}.`);
  }
  for (const s of subbloques) {
    if (!s.dimension) errores.push(`Subbloque ${s.id} sin dimensión.`);
    if (s.preguntas.length === 0) errores.push(`Subbloque ${s.id} (${s.titulo}) sin preguntas.`);
    for (const p of s.preguntas) {
      if (p.texto.length < 8) errores.push(`Pregunta sospechosamente corta en ${s.id}: "${p.texto}"`);
    }
  }
  if (errores.length) {
    throw new Error(`El guion no cumple el formato esperado:\n  - ${errores.join('\n  - ')}`);
  }
}

function serializar(subbloques) {
  const total = subbloques.reduce((n, s) => n + s.preguntas.length, 0);
  const dims = [...new Set(subbloques.map(s => s.dimension))];

  return `/**
 * @file anamnesisBank.generated.js
 * @description ARCHIVO GENERADO — no editar a mano.
 *
 * Compilado desde \`docs/clinico/GUION_ANAMNESIS.md\` (sección 2) con
 * \`npm run guion\`. Para cambiar una pregunta se edita el guion y se
 * recompila: cualquier cambio hecho aquí se pierde en la siguiente
 * regeneración.
 *
 * Contenido: ${subbloques.length} subbloques · ${total} preguntas · ${dims.length} dimensiones.
 */

/**
 * @typedef {Object} Pregunta
 * @property {string} texto            Pregunta abierta, tal cual se le hace al paciente.
 * @property {string[]} seguimiento    Repreguntas, válidas SOLO tras una respuesta.
 *
 * @typedef {Object} Subbloque
 * @property {string} id               "1.2"
 * @property {string} dimension        Dimensión del árbol vital ("apertura" en el bloque 0).
 * @property {string} titulo
 * @property {string} eje              Eje de las 5 P.
 * @property {string} datos            Qué se busca recoger aquí.
 * @property {Pregunta[]} preguntas
 */

/** @type {Subbloque[]} */
export const BANCO_PREGUNTAS = ${JSON.stringify(subbloques, null, 2)};

export default BANCO_PREGUNTAS;
`;
}

const markdown = readFileSync(ORIGEN, 'utf8');
const subbloques = parsearBanco(markdown);
validar(subbloques);
const salida = serializar(subbloques);

if (process.argv.includes('--check')) {
  const actual = (() => { try { return readFileSync(DESTINO, 'utf8'); } catch { return ''; } })();
  if (actual !== salida) {
    console.error('✗ El banco generado no coincide con el guion. Ejecuta: npm run guion');
    process.exit(1);
  }
  console.log('✓ El banco generado está al día con el guion.');
} else {
  writeFileSync(DESTINO, salida, 'utf8');
  const preguntas = subbloques.reduce((n, s) => n + s.preguntas.length, 0);
  const seguimientos = subbloques.reduce((n, s) => n + s.preguntas.reduce((m, p) => m + p.seguimiento.length, 0), 0);
  console.log(`✓ Banco compilado: ${subbloques.length} subbloques, ${preguntas} preguntas, ${seguimientos} repreguntas.`);
  for (const dim of [...new Set(subbloques.map(s => s.dimension))]) {
    const enDim = subbloques.filter(s => s.dimension === dim);
    console.log(`    ${dim.padEnd(22)} ${enDim.length} subbloques · ${enDim.reduce((n, s) => n + s.preguntas.length, 0)} preguntas`);
  }
}
