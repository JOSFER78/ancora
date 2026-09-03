/**
 * @file run_all.js
 * @description Lanzador de las suites de Áncora ⚓ (`npm test`).
 *
 * Solo entran aquí suites que NO tocan la red ni Firebase, para que puedan
 * correr en cualquier máquina y en CI sin credenciales. Las validaciones
 * contra el endpoint real de IA se hacen a mano y quedan registradas en
 * `docs/plan/BLOQUE_D_SERVICIOS_IA.md`.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

const SUITES = [
  ['Protocolo de riesgo', 'risk_protocol_test.js'],
  ['Brújula de anamnesis', 'anamnesis_test.js'],
  ['Recuerdo espontáneo', 'recuerdo_test.js'],
  ['Recuperación léxica BM25', 'bm25_test.js'],
  ['Funciones puras de los servicios de IA', 'pure_functions_test.js'],
  ['Motor de memoria cognitiva', 'cognitive_memory_test.js']
];

function run(file) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [join(here, file)], { stdio: 'inherit' });
    child.on('close', code => resolve(code));
    child.on('error', () => resolve(1));
  });
}

const fallidas = [];

for (const [nombre, file] of SUITES) {
  console.log(`\n╔══ ${nombre} ${'═'.repeat(Math.max(0, 50 - nombre.length))}`);
  const code = await run(file);
  if (code !== 0) fallidas.push(nombre);
}

console.log('\n════════════════════════════════════════════════════════');
if (fallidas.length === 0) {
  console.log(`TODAS LAS SUITES PASAN (${SUITES.length}/${SUITES.length})`);
  console.log('════════════════════════════════════════════════════════\n');
} else {
  console.log(`SUITES FALLIDAS: ${fallidas.join(', ')}`);
  console.log('════════════════════════════════════════════════════════\n');
  process.exit(1);
}
