/**
 * @file pure_functions_test.js
 * @description Suite de las piezas puras de los servicios de IA de Áncora ⚓.
 *
 * No toca la red ni Firebase: comprueba con casos fijos las funciones de las
 * que dependen la voz, la verificación de citas y el parseo de respuestas del
 * modelo. Cuatro de estos casos nacieron de bugs reales encontrados probando
 * con audio y documentos de verdad; están aquí para que no vuelvan.
 */

import { cleanTextForSpeech, splitIntoSentences } from '../services/voiceChatService.js';
import { evidenceIsGrounded, filterGrounded } from '../services/clinicalIngestionService.js';
import { parseModelJSON } from '../services/claudeService.js';

let passed = 0;
let failed = 0;

function assert(condition, name, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ''}`);
  }
}

function equal(actual, expected, name) {
  assert(actual === expected, name, `esperado: ${JSON.stringify(expected)}\n      obtenido: ${JSON.stringify(actual)}`);
}

// ---------------------------------------------------------------------------
console.log('\n── cleanTextForSpeech ──────────────────────────────────');

equal(
  cleanTextForSpeech('Mira esto: https://ancora.app/historia y dime'),
  'Mira esto: un enlace y dime',
  'URL sustituida por "un enlace" (el patrón de emoticonos se comía el ://)'
);

equal(
  cleanTextForSpeech('Consulta [tu historia](https://ancora.app/h) cuando quieras'),
  'Consulta tu historia cuando quieras',
  'Enlace markdown: se lee el texto, no la dirección'
);

equal(
  cleanTextForSpeech('Ha sido duro 😔 . Mira esto'),
  'Ha sido duro. Mira esto',
  'Emoji fuera sin dejar espacio huérfano delante del punto'
);

equal(
  cleanTextForSpeech('Es **importante** que lo sepas'),
  'Es importante que lo sepas',
  'Negrita markdown sin leer los asteriscos'
);

equal(
  cleanTextForSpeech('Subió un 30% y costó 50€'),
  'Subió un 30 por ciento y costó 50 euros',
  'Porcentaje y euros dichos con palabras'
);

equal(cleanTextForSpeech(''), '', 'Cadena vacía');
equal(cleanTextForSpeech(null), '', 'Entrada nula sin reventar');

// ---------------------------------------------------------------------------
console.log('\n── splitIntoSentences ──────────────────────────────────');

const trozos = splitIntoSentences(
  'Entiendo. Debió de ser muy duro para ti pasar por eso solo durante tanto tiempo. ¿Quieres contarme cómo lo llevas ahora?'
);
assert(trozos.length >= 2, 'Trocea un párrafo en varias frases');
assert(trozos[0].length <= 90, `Primer fragmento corto para hablar antes (${trozos[0].length} caracteres)`);
assert(
  trozos.join(' ').includes('duro para ti'),
  'No se pierde el separador entre frases («duro .Mira» era el bug)'
);
assert(
  trozos.every(t => t === t.trim() && t.length > 0),
  'Ningún fragmento vacío ni con espacios sobrantes'
);

const unaSola = splitIntoSentences('Hola.');
equal(unaSola.length, 1, 'Una frase corta produce un solo fragmento');

// ---------------------------------------------------------------------------
console.log('\n── evidenceIsGrounded ──────────────────────────────────');

const fuente = 'Desde que murió mi padre en marzo no he vuelto a dormir bien. ' +
  'Me despierto a las cuatro y ya no puedo volver a dormirme.';

assert(
  evidenceIsGrounded('no he vuelto a dormir bien', fuente),
  'Cita literal encontrada'
);
assert(
  evidenceIsGrounded('Desde que murió mi padre en Marzo', fuente),
  'Cita con mayúsculas distintas (normalización)'
);
assert(
  evidenceIsGrounded('“me despierto a las cuatro”', fuente),
  'Cita con comillas tipográficas'
);
assert(
  !evidenceIsGrounded('el paciente presenta insomnio de mantenimiento', fuente),
  'Paráfrasis clínica RECHAZADA (esto es lo que evita las invenciones)'
);
assert(
  !evidenceIsGrounded('dormir', fuente),
  'Cita demasiado corta rechazada'
);
assert(!evidenceIsGrounded('', fuente), 'Cita vacía rechazada');
assert(!evidenceIsGrounded('no he vuelto a dormir bien', ''), 'Fuente vacía rechaza todo');

const { kept, dropped } = filterGrounded(
  [
    { titulo: 'Insomnio', evidencia: 'Me despierto a las cuatro' },
    { titulo: 'Duelo', evidencia: 'Desde que murió mi padre en marzo' },
    { titulo: 'Inventado', evidencia: 'lleva años en tratamiento psiquiátrico' }
  ],
  fuente
);
equal(kept.length, 2, 'filterGrounded conserva los hallazgos con cita real');
equal(dropped.length, 1, 'filterGrounded descarta el hallazgo inventado');
equal(dropped[0].titulo, 'Inventado', 'El descartado es el correcto');

// ---------------------------------------------------------------------------
console.log('\n── parseModelJSON ──────────────────────────────────────');

equal(
  parseModelJSON('{"a":1}').a,
  1,
  'JSON pelado'
);
equal(
  parseModelJSON('```json\n{"a":2}\n```').a,
  2,
  'JSON entre vallas markdown'
);
equal(
  parseModelJSON('Aquí tienes el resultado:\n{"a":3}\nEspero que sirva.').a,
  3,
  'JSON con cháchara del modelo alrededor'
);
equal(
  parseModelJSON('[{"a":4}]')[0].a,
  4,
  'Array en la raíz'
);
assert(
  parseModelJSON('{"cita":"dijo \\"basta\\" y {se fue}"}').cita === 'dijo "basta" y {se fue}',
  'Llaves y comillas dentro de una cadena no rompen el recorte'
);

let lanzo = false;
try { parseModelJSON('{"a":1'); } catch { lanzo = true; }
assert(lanzo, 'JSON truncado falla limpio en vez de devolver basura');

lanzo = false;
try { parseModelJSON('lo siento, no puedo ayudarte con eso'); } catch { lanzo = true; }
assert(lanzo, 'Respuesta sin JSON falla limpio');

lanzo = false;
try { parseModelJSON(null); } catch { lanzo = true; }
assert(lanzo, 'Entrada no textual falla limpio');

// ---------------------------------------------------------------------------
console.log('\n══════════════════════════════════════════════════════');
console.log(`FUNCIONES PURAS: ${passed} PASADAS, ${failed} FALLIDAS`);
console.log('══════════════════════════════════════════════════════\n');

if (failed > 0) process.exit(1);
