/**
 * @file anamnesis_test.js
 * @description Suite de la brújula de anamnesis de Áncora ⚓.
 *
 * Comprueba que el estado de madurez se calcula sobre datos con evidencia,
 * que el vínculo no se abre a los temas sensibles solo por contar mensajes, y
 * que la directiva que recibe el modelo lleva lo que ya sabemos para que no lo
 * vuelva a preguntar.
 */

import {
  computeAnamnesisState,
  computeDimensionMaturity,
  selectNextDimension,
  selectNextAxis,
  MaturityState,
  BondLevel
} from '../lib/anamnesisState.js';
import {
  buildAnamnesisDirective,
  subbloquesDe,
  subbloquesApertura,
  REGLAS_CONVERSACION
} from '../lib/anamnesisGuide.js';
import { BANCO_PREGUNTAS } from '../lib/anamnesisBank.generated.js';

let passed = 0;
let failed = 0;
function assert(condition, name, detail = '') {
  if (condition) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ''}`); }
}

const cita = 'no he vuelto a dormir bien desde que murió mi padre';

/** Expediente de un paciente que lleva ya unas cuantas conversaciones. */
const expediente = {
  arbol_vital: [
    { categoria: 'salud_fisica', hallazgo: 'Despertares a las 4 de la madrugada', valencia: 'dificultad', evidencia: cita },
    { categoria: 'salud_fisica', hallazgo: 'Camina una hora cada tarde', valencia: 'recurso', evidencia: 'salgo a andar una hora todas las tardes' },
    { categoria: 'salud_fisica', hallazgo: 'Operado de rodilla en 2019', valencia: 'neutro', evidencia: 'me operaron de la rodilla en 2019' },
    { categoria: 'salud_emocional', hallazgo: 'Ansiedad al entrar en la oficina', valencia: 'dificultad', evidencia: 'me entra la ansiedad nada más entrar en la oficina' },
    { categoria: 'familia_y_vinculos', hallazgo: 'Inventado sin cita', valencia: 'dificultad' }
  ],
  anclajes_protectores: [
    { categoria: 'salud_emocional', ancla: 'Hablar con su hermana', evidencia: 'cuando hablo con mi hermana me quedo mejor' }
  ],
  eventos_timeline: [
    { categoria: 'salud_emocional', evento: 'Muerte del padre en marzo', evidencia: cita }
  ]
};

// ---------------------------------------------------------------------------
console.log('\n── Banco compilado desde el guion ──────────────────────');

assert(BANCO_PREGUNTAS.length === 26, `26 subbloques (2 de apertura + 24 de la rejilla): ${BANCO_PREGUNTAS.length}`);
assert(subbloquesApertura().length === 2, 'Los dos subbloques de apertura');
assert(subbloquesDe('salud_fisica').length === 4, 'Cuatro subbloques por dimensión');
assert(subbloquesDe('salud_fisica', 'protectores').length === 1, 'Un subbloque por eje y dimensión');
assert(
  BANCO_PREGUNTAS.every(s => s.preguntas.length >= 4),
  'Todos los subbloques traen al menos 4 preguntas'
);
assert(
  BANCO_PREGUNTAS.every(s => s.preguntas.every(p => p.texto.includes('?'))),
  'Todas las preguntas son preguntas'
);

// ---------------------------------------------------------------------------
console.log('\n── Madurez por dimensión ───────────────────────────────');

const fisica = computeDimensionMaturity(expediente, 'salud_fisica');
assert(fisica.hallazgos === 3, `Cuenta los 3 hallazgos con evidencia (${fisica.hallazgos})`);
assert(fisica.valenciaBalanceada === true, 'Tiene recurso y dificultad: valencia balanceada');
assert(fisica.ejesCubiertos === 3, `Tres ángulos cubiertos (${fisica.ejes.join(', ')})`);
assert(fisica.estado === MaturityState.EXPLORADA, 'Con 3 datos, 3 ángulos y balance → EXPLORADA');
assert(fisica.validadoPorPsicologo === false, 'Sin sello del psicólogo, no llega a CONSOLIDADA');

const familia = computeDimensionMaturity(expediente, 'familia_y_vinculos');
assert(familia.hallazgos === 0, 'El hallazgo SIN CITA no cuenta para nada');
assert(familia.estado === MaturityState.PENDIENTE, 'Dimensión sin datos verificados → PENDIENTE');

const emocional = computeDimensionMaturity(expediente, 'salud_emocional');
assert(emocional.hallazgos === 3, 'Suma árbol vital, anclajes y timeline de la misma dimensión');
assert(emocional.estado === MaturityState.EN_EXPLORACION, 'Sin las dos valencias no pasa de EN_EXPLORACION');

const conSello = computeDimensionMaturity(
  {
    arbol_vital: expediente.arbol_vital.map(h =>
      h.categoria === 'salud_fisica' ? { ...h, authority_level: 1, created_at: new Date().toISOString() } : h
    )
  },
  'salud_fisica'
);
assert(conSello.estado === MaturityState.CONSOLIDADA, 'Con validación del psicólogo y datos frescos → CONSOLIDADA');

const rancio = computeDimensionMaturity(
  {
    arbol_vital: expediente.arbol_vital.map(h =>
      h.categoria === 'salud_fisica'
        ? { ...h, authority_level: 1, created_at: '2024-01-01T00:00:00.000Z' }
        : h
    )
  },
  'salud_fisica'
);
assert(rancio.estado === MaturityState.EXPLORADA, 'Validado pero de hace años: vuelve a EXPLORADA, no CONSOLIDADA');

// ---------------------------------------------------------------------------
console.log('\n── Estado global y brújula ─────────────────────────────');

const estado = computeAnamnesisState(expediente, { conversaciones: 3, turnosPaciente: 30 });
assert(estado.dimensiones.length === 6, 'Las 6 dimensiones del árbol vital');
assert(estado.totalHallazgos === 6, `6 hallazgos con evidencia en total (${estado.totalHallazgos})`);
assert(estado.madurezGlobal > 0 && estado.madurezGlobal < 100, `Madurez global intermedia: ${estado.madurezGlobal}%`);
assert(estado.cobertura === 33, `2 de 6 dimensiones tocadas → 33% (${estado.cobertura}%)`);

const siguiente = selectNextDimension(estado);
assert(siguiente.estado === MaturityState.PENDIENTE, 'La brújula apunta a una dimensión sin tocar');
assert(
  siguiente.dimension === 'familia_y_vinculos',
  `Va a por la primera pendiente en orden del árbol (${siguiente.dimension})`
);
assert(selectNextAxis(siguiente) === 'protectores', 'Y empieza por lo que menos expone: los protectores');
assert(
  selectNextAxis(fisica) === 'precipitantes',
  `En una dimensión ya trabajada busca el ángulo que falta (${selectNextAxis(fisica)})`
);

// ---------------------------------------------------------------------------
console.log('\n── Nivel de vínculo ────────────────────────────────────');

const recien = computeAnamnesisState(expediente, { conversaciones: 1, turnosPaciente: 4 });
assert(recien.vinculo.nivel === BondLevel.INICIAL, 'Una conversación: vínculo inicial');

const nivelA = computeAnamnesisState(expediente, { conversaciones: 2, turnosPaciente: 20 });
assert(nivelA.vinculo.nivel === BondLevel.A, '2 conversaciones y 5+ datos en 2 dimensiones → nivel A');

const muchasVacias = computeAnamnesisState(expediente, { conversaciones: 5, turnosPaciente: 10 });
assert(
  muchasVacias.vinculo.nivel === BondLevel.A,
  'Cinco conversaciones de dos líneas NO dan nivel B: la densidad cuenta'
);

const conPermiso = computeAnamnesisState(
  { ...expediente, senal_apertura_espontanea: true },
  { conversaciones: 6, turnosPaciente: 60 }
);
assert(
  conPermiso.vinculo.umbralesBCumplidos === false,
  'Con solo 2 dimensiones tocadas no se llega al umbral B aunque haya permiso'
);

const expedienteAmplio = {
  arbol_vital: ['salud_fisica', 'salud_emocional', 'familia_y_vinculos', 'trabajo_y_proposito', 'identidad_y_valores']
    .map(c => ({
      categoria: c, hallazgo: `algo de ${c}`, valencia: 'dificultad', evidencia: `esto lo dijo sobre ${c} tal cual`
    })),
  senal_apertura_espontanea: true
};
const listoParaB = computeAnamnesisState(expedienteAmplio, { conversaciones: 4, turnosPaciente: 40 });
assert(listoParaB.vinculo.nivel === BondLevel.B, 'Cobertura + conversaciones + señal espontánea → nivel B');

const sinSeñal = computeAnamnesisState(
  { ...expedienteAmplio, senal_apertura_espontanea: false },
  { conversaciones: 4, turnosPaciente: 40 }
);
assert(sinSeñal.vinculo.nivel === BondLevel.A, 'Los números solos NO abren los temas sensibles');
assert(sinSeñal.vinculo.umbralesBCumplidos === true, 'Pero se informa de que lo que falta es el permiso, no el trato');

// ---------------------------------------------------------------------------
console.log('\n── Directiva para el modelo ────────────────────────────');

const nueva = buildAnamnesisDirective({ expediente: {}, conversaciones: 0, primeraConversacion: true });
assert(nueva.objetivo.fase === 'apertura', 'Paciente nuevo: fase de apertura');
assert(nueva.directiva.includes('qué le trae ahora'), 'La apertura busca el motivo de consulta');
assert(nueva.directiva.includes(REGLAS_CONVERSACION), 'Las 10 reglas van íntegras en la directiva');

const enCurso = buildAnamnesisDirective({ expediente, conversaciones: 3, turnosPaciente: 30 });
assert(enCurso.objetivo.fase === 'exploracion', 'Con datos ya en el expediente: fase de exploración');
assert(
  enCurso.directiva.includes('Despertares a las 4 de la madrugada'),
  'La directiva lleva lo ya sabido para que NO lo repregunte (regla 3)'
);
assert(
  !enCurso.directiva.includes('Inventado sin cita'),
  'Lo que no tiene cita no se le cuenta al modelo como sabido'
);
assert(enCurso.directiva.includes('NUNCA menciones'), 'Se le recuerda que el mapa es invisible para el paciente');
assert(enCurso.objetivo.subbloques.length > 0, 'Apunta a subbloques concretos del banco');

const sensible = buildAnamnesisDirective({
  expediente: {
    arbol_vital: [
      { categoria: 'familia_y_vinculos', hallazgo: 'Vive con su madre', valencia: 'neutro', evidencia: 'ahora mismo vivo con mi madre' }
    ]
  },
  conversaciones: 1,
  turnosPaciente: 5
});
assert(
  sensible.directiva.includes('vínculo todavía no da') || sensible.objetivo.eje !== 'predisponentes',
  'Sin vínculo, no propone él los terrenos de historia personal'
);

// ---------------------------------------------------------------------------
console.log('\n══════════════════════════════════════════════════════');
console.log(`ANAMNESIS: ${passed} PASADAS, ${failed} FALLIDAS`);
console.log('══════════════════════════════════════════════════════\n');

if (failed > 0) process.exit(1);
