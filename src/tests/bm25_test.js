/**
 * @file bm25_test.js
 * @description Suite de la recuperación léxica BM25.
 *
 * Lo que se prueba es que encuentra lo que importa y no lo que solo comparte
 * palabras vacías, que es exactamente donde fallaba el Jaccard anterior.
 */

import { BM25Index, buscarEnMemorias, tokenizar } from '../services/memory/BM25.js';
import { expandirLocal } from '../services/memory/expansionConsulta.js';

let passed = 0;
let failed = 0;
function assert(condition, name, detail = '') {
  if (condition) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ''}`); }
}

// Recuerdos con el aire de los de verdad: frases del paciente, no fichas.
const memorias = [
  { id: 'm1', content: 'Llevo semanas sin dormir bien, me despierto a las cuatro y ya no vuelvo a coger el sueño' },
  { id: 'm2', content: 'Discutí con mi hermana por lo de la herencia y llevamos un mes sin hablarnos' },
  { id: 'm3', content: 'En el trabajo me han cambiado de equipo y no sé si voy a poder con el ritmo' },
  { id: 'm4', content: 'Cuando salgo a andar por las tardes se me despeja la cabeza y duermo algo mejor' },
  { id: 'm5', content: 'Mi hermana me llamó ayer y estuvimos hablando dos horas, me quedé mucho más tranquilo' },
  { id: 'm6', content: 'Hoy he ido a comprar y no ha pasado nada especial' }
];

// ---------------------------------------------------------------------------
console.log('\n── Troceado y normalización ────────────────────────────');

assert(!tokenizar('el que de la para con').length, 'Las palabras vacías no entran en el índice');
assert(
  tokenizar('ansiedad').join() === tokenizar('ansiédad').join(),
  'Con y sin tilde son la misma palabra: en un chat se escribe de las dos formas'
);
assert(
  tokenizar('pesadillas')[0] === tokenizar('pesadilla')[0],
  `Singular y plural se juntan (${tokenizar('pesadillas')[0]} / ${tokenizar('pesadilla')[0]})`
);
assert(tokenizar('')[0] === undefined, 'Texto vacío no rompe nada');

// ---------------------------------------------------------------------------
console.log('\n── Búsqueda ────────────────────────────────────────────');

const porSueno = buscarEnMemorias(memorias, 'no consigo dormir por las noches');
assert(porSueno.length > 0, 'Encuentra algo');
assert(porSueno[0].doc.id === 'm1', `El recuerdo del insomnio va primero (salió ${porSueno[0].doc.id})`);
// LÍMITE CONOCIDO, comprobado aquí para que no se olvide: el recorte de
// sufijos no junta «dormir» con «duermo», porque es un verbo irregular
// (o → ue) y para eso haría falta un lematizador con diccionario. El recuerdo
// de m4 («duermo algo mejor») no sale con esta consulta. Es exactamente el
// hueco que cierra la expansión de consulta con Claude, que es el siguiente
// paso de G3: se pide al modelo las variantes y se buscan todas.
assert(
  !porSueno.some(r => r.doc.id === 'm4'),
  'Sabido: «dormir» no encuentra «duermo» sin expansión de consulta'
);

const porHermana = buscarEnMemorias(memorias, 'qué tal con tu hermana');
assert(['m2', 'm5'].includes(porHermana[0].doc.id), 'Encuentra los recuerdos de la hermana');
assert(
  porHermana.filter(r => ['m2', 'm5'].includes(r.doc.id)).length === 2,
  'Los dos, no solo uno'
);

const sinRelacion = buscarEnMemorias(memorias, 'hipoteca del piso');
assert(sinRelacion.length === 0, 'Lo que no está, no se inventa: cero resultados');

// ---------------------------------------------------------------------------
console.log('\n── Lo que Jaccard hacía mal ────────────────────────────');

// «Hoy he ido a comprar y no ha pasado nada especial» comparte palabras vacías
// con casi cualquier consulta. Con Jaccard puntuaba; con IDF, no.
const trivial = buscarEnMemorias(memorias, 'hoy no he podido con el trabajo');
assert(
  trivial.length === 0 || trivial[0].doc.id !== 'm6',
  'El recuerdo sin contenido no gana por compartir palabras corrientes'
);
assert(
  trivial.length === 0 || trivial[0].doc.id === 'm3',
  `Gana el del trabajo, que es de lo que se habla (${trivial[0]?.doc.id})`
);

const indice = new BM25Index(memorias, d => d.content);
// «herencia» sale en un recuerdo; «hermana», en dos. La que menos se repite
// es la que más distingue, y eso es justo lo que Jaccard no sabía hacer.
assert(
  indice.idf('herencia') > indice.idf('hermana'),
  `Lo que aparece en menos recuerdos pesa más (${indice.idf('herencia').toFixed(2)} vs ${indice.idf('hermana').toFixed(2)})`
);
assert(indice.idf('inexistente') > 0, 'El IDF nunca es negativo: acertar no puede restar');

// La saturación: repetir una palabra no multiplica la relevancia.
const repetido = new BM25Index(
  [
    { content: 'ansiedad' },
    { content: 'ansiedad ansiedad ansiedad ansiedad ansiedad ansiedad ansiedad ansiedad' }
  ],
  d => d.content
);
const unaVez = repetido.puntuar(0, ['ansiedad']);
const ochoVeces = repetido.puntuar(1, ['ansiedad']);
assert(
  ochoVeces < unaVez * 4,
  `Ocho menciones no valen ocho veces más que una (${unaVez.toFixed(2)} vs ${ochoVeces.toFixed(2)})`
);

// ---------------------------------------------------------------------------
console.log('\n── Casos límite y expansión ────────────────────────────');

assert(buscarEnMemorias([], 'lo que sea').length === 0, 'Sin memorias, sin resultados');
assert(buscarEnMemorias(memorias, '').length === 0, 'Consulta vacía no devuelve todo');
assert(
  buscarEnMemorias(memorias, 'dormir', { limite: 2 }).length <= 2,
  'Se respeta el límite'
);

const expandida = buscarEnMemorias(memorias, 'descanso', { expansiones: ['dormir', 'sueño', 'noches'] });
assert(
  expandida.length > 0 && expandida[0].doc.id === 'm1',
  'La expansión de consulta encuentra lo que la palabra sola no encontraba'
);

const sinExpandir = buscarEnMemorias(memorias, 'descanso');
assert(
  sinExpandir.length === 0,
  '«Descanso» a secas no aparece en ningún recuerdo: por eso hace falta expandir'
);

assert(
  buscarEnMemorias(memorias, 'dormir')[0].similitud === 1,
  'La puntuación se normaliza: el mejor resultado vale 1'
);

// ---------------------------------------------------------------------------
console.log('\n── Expansión de consulta ───────────────────────────────');

const conExpansion = buscarEnMemorias(memorias, 'no consigo dormir por las noches', {
  expansiones: expandirLocal('no consigo dormir por las noches')
});
assert(
  conExpansion.some(r => r.doc.id === 'm4'),
  'CON expansión sí aparece «duermo algo mejor», que sin ella se perdía'
);
assert(conExpansion[0].doc.id === 'm1', 'Y el más relevante sigue siendo el primero');

assert(expandirLocal('me cuesta dormir').includes('duermo'), 'Cubre las formas irregulares del verbo');
assert(expandirLocal('lo del trabajo').includes('jefe'), 'Y el vocabulario del mismo tema');
assert(expandirLocal('hoy hace sol').length === 0, 'Lo que no toca ningún tema no se expande');
assert(expandirLocal('').length === 0, 'Consulta vacía no expande nada');

// ---------------------------------------------------------------------------
console.log('\n══════════════════════════════════════════════════════');
console.log(`BM25: ${passed} PASADAS, ${failed} FALLIDAS`);
console.log('══════════════════════════════════════════════════════\n');

if (failed > 0) process.exit(1);
