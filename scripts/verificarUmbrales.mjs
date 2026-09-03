/**
 * @file verificarUmbrales.mjs
 * @description Guardia de calidad: que lo saneado no se vuelva a ensuciar.
 *
 * Comprueba dos cosas y falla si alguna empeora:
 *   1. El número de avisos del lint no sube.
 *   2. El bundle no engorda más de lo tolerado.
 *
 * POR QUÉ UN UMBRAL Y NO CERO
 * ---------------------------
 * Quedan ~400 avisos de lint, casi todos ruido heredado (variables sin usar).
 * Exigir cero hoy significaría o bien no usar el guardia, o bien silenciar
 * reglas para que pase, que es peor. El umbral solo puede bajar: cada vez que
 * se limpia un lote, se baja el número y ya no se puede volver atrás.
 *
 * Uso:  npm run verificar        (y en CI, antes de fusionar)
 *       npm run verificar -- --actualizar   para bajar el umbral tras limpiar
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const FICHERO_UMBRALES = join(raiz, 'scripts/umbrales.json');

const umbrales = JSON.parse(readFileSync(FICHERO_UMBRALES, 'utf8'));
const actualizar = process.argv.includes('--actualizar');
const fallos = [];
const medido = {};

// --- 1. Lint ---------------------------------------------------------------
function contarProblemasLint() {
  try {
    const salida = execSync('npx eslint . --format=json', {
      cwd: raiz,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore']
    });
    const informe = JSON.parse(salida);
    return informe.reduce((n, f) => n + f.errorCount + f.warningCount, 0);
  } catch (err) {
    // ESLint sale con código 1 cuando hay errores: la salida sigue siendo válida.
    if (err.stdout) {
      const informe = JSON.parse(err.stdout);
      return informe.reduce((n, f) => n + f.errorCount + f.warningCount, 0);
    }
    throw err;
  }
}

const problemas = contarProblemasLint();
medido.lint = problemas;
if (problemas > umbrales.lint) {
  fallos.push(`Lint: ${problemas} problemas, y el umbral está en ${umbrales.lint}. Han entrado ${problemas - umbrales.lint} nuevos.`);
}

// --- 2. Bundle -------------------------------------------------------------
function tamanoBundleKB() {
  const dir = join(raiz, 'dist/assets');
  let total = 0;
  try {
    for (const f of readdirSync(dir)) {
      if (f.startsWith('index-') && f.endsWith('.js')) {
        total += statSync(join(dir, f)).size;
      }
    }
  } catch {
    return null;
  }
  return total ? Math.round(total / 1024) : null;
}

const bundleKB = tamanoBundleKB();
medido.bundleKB = bundleKB;
if (bundleKB === null) {
  console.log('· Bundle: no hay build en dist/, se omite la comprobación (ejecuta `npm run build`).');
} else if (bundleKB > umbrales.bundleKB) {
  fallos.push(`Bundle: ${bundleKB} KB, y el umbral está en ${umbrales.bundleKB} KB. Ha crecido ${bundleKB - umbrales.bundleKB} KB.`);
}

// --- 3. Datos personales en el bundle --------------------------------------
// Esto no es un umbral, es un cero absoluto: correos y nombres de personas
// reales no vuelven al bundle público (ver E8 y D-28).
function pIIEnBundle() {
  const dir = join(raiz, 'dist/assets');
  const patrones = [/[a-z0-9._%-]+@gmail\.com/i, /Emilio\s+Naranjo/];
  const encontrados = [];
  try {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.js')) continue;
      const contenido = readFileSync(join(dir, f), 'utf8');
      for (const re of patrones) {
        const m = contenido.match(re);
        if (m) encontrados.push(`${f}: ${m[0]}`);
      }
    }
  } catch {
    return [];
  }
  return encontrados;
}

const pii = pIIEnBundle();
medido.pii = pii.length;
if (pii.length > 0) {
  fallos.push(`Datos personales en el bundle público: ${pii.join(', ')}. Esto no tiene umbral: es cero.`);
}

// --- Resultado -------------------------------------------------------------
if (actualizar) {
  const nuevos = {
    ...umbrales,
    lint: Math.min(umbrales.lint, problemas),
    bundleKB: bundleKB !== null ? Math.min(umbrales.bundleKB, bundleKB) : umbrales.bundleKB,
    actualizado: new Date().toISOString().slice(0, 10)
  };
  writeFileSync(FICHERO_UMBRALES, `${JSON.stringify(nuevos, null, 2)}\n`, 'utf8');
  console.log(`✓ Umbrales actualizados: lint ${umbrales.lint} → ${nuevos.lint}, bundle ${umbrales.bundleKB} → ${nuevos.bundleKB} KB.`);
  process.exit(0);
}

console.log(`· Lint: ${problemas} problemas (umbral ${umbrales.lint})`);
if (bundleKB !== null) console.log(`· Bundle: ${bundleKB} KB (umbral ${umbrales.bundleKB} KB)`);
console.log(`· Datos personales en el bundle: ${pii.length} (debe ser 0)`);

if (fallos.length > 0) {
  console.error('\n✗ La calidad ha empeorado:');
  for (const f of fallos) console.error(`   - ${f}`);
  console.error('\nSi el aumento es intencionado, sube el umbral en scripts/umbrales.json explicándolo en el commit.');
  process.exit(1);
}

console.log('\n✓ Todo dentro de los umbrales.');
