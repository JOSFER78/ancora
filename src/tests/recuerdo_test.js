/**
 * @file recuerdo_test.js
 * @description Suite del recuerdo espontáneo.
 *
 * Lo que se comprueba sobre todo es cuándo NO se acuerda: un recuerdo traído a
 * destiempo, o inventado por un cálculo de fechas mal hecho, hace más daño que
 * no acordarse de nada.
 */

import {
  buscarAniversarios,
  buscarCabosSueltos,
  buscarRecursosDormidos,
  buscarRecuerdos,
  buildRecallDirective
} from '../lib/recuerdoEspontaneo.js';

let passed = 0;
let failed = 0;
function assert(condition, name, detail = '') {
  if (condition) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ''}`); }
}

const hoy = new Date();
const haceDias = n => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
/** Misma fecha del calendario, hace `anos` años. */
const mismoDiaHaceAnos = anos =>
  new Date(hoy.getFullYear() - anos, hoy.getMonth(), hoy.getDate()).toISOString();

// ---------------------------------------------------------------------------
console.log('\n── Aniversarios ────────────────────────────────────────');

const conAniversario = {
  eventos_timeline: [
    { evento: 'Murió su padre', fecha: mismoDiaHaceAnos(2), evidencia: 'mi padre murió en marzo de hace dos años' }
  ]
};
const anivs = buscarAniversarios(conAniversario);
assert(anivs.length === 1, 'Detecta el aniversario que cae hoy');
assert(anivs[0].detalle.includes('2 años'), `Cuenta bien los años: "${anivs[0]?.detalle}"`);
assert(anivs[0].evidencia.includes('mi padre murió'), 'Viaja con la cita literal');

const lejano = buscarAniversarios({
  eventos_timeline: [
    { evento: 'Cambió de trabajo', fecha: new Date(hoy.getFullYear() - 3, (hoy.getMonth() + 5) % 12, 14).toISOString(), evidencia: 'cambié de trabajo aquel verano y fue un alivio' }
  ]
});
assert(lejano.length === 0, 'Una fecha a meses vista NO es un aniversario de hoy');

const sinCita = buscarAniversarios({
  eventos_timeline: [{ evento: 'Algo sin respaldo', fecha: mismoDiaHaceAnos(1) }]
});
assert(sinCita.length === 0, 'Sin cita literal no se recuerda nada');

const esteAno = buscarAniversarios({
  eventos_timeline: [{ evento: 'Empezó terapia', fecha: haceDias(20), evidencia: 'empecé terapia hace tres semanas más o menos' }]
});
assert(esteAno.length === 0, 'Algo de hace 20 días no cumple años');

// ---------------------------------------------------------------------------
console.log('\n── Cabos sueltos ───────────────────────────────────────');

const episodios = [
  { content: 'Voy a llamar a mi hermana este fin de semana', createdAt: haceDias(12) },
  { content: 'Hoy he desayunado fatal', createdAt: haceDias(10) },
  { content: 'Tengo que pedir cita con el médico de cabecera', createdAt: haceDias(9) }
];
const cabos = buscarCabosSueltos({ arbol_vital: [] }, episodios);
assert(cabos.length === 2, `Detecta los dos compromisos, no el desayuno (${cabos.length})`);
assert(cabos.every(c => /llamar a mi hermana|pedir cita/.test(c.texto)), 'Los correctos');

const recienDicho = buscarCabosSueltos({ arbol_vital: [] }, [
  { content: 'Voy a llamar a mi hermana', createdAt: haceDias(1) }
]);
assert(recienDicho.length === 0, 'Lo dicho ayer NO es un cabo suelto: hay que dar tiempo');

const yaRetomado = buscarCabosSueltos(
  {
    arbol_vital: [
      { hallazgo: 'Habló con su hermana y se quedó mejor', evidencia: 'al final llamé a mi hermana', created_at: haceDias(2) }
    ]
  },
  [{ content: 'Voy a llamar a mi hermana este fin de semana', createdAt: haceDias(12) }]
);
assert(yaRetomado.length === 0, 'Si el tema ya volvió a salir, deja de ser un cabo suelto');

const antiguo = buscarCabosSueltos({ arbol_vital: [] }, [
  { content: 'Voy a apuntarme al gimnasio', createdAt: haceDias(200) }
]);
assert(antiguo.length === 0, 'Lo de hace siete meses ya no se saca: sonaría a reproche');

// ---------------------------------------------------------------------------
console.log('\n── Recursos dormidos ───────────────────────────────────');

const dormidos = buscarRecursosDormidos({
  anclajes_protectores: [
    { ancla: 'Salir a andar por las tardes', evidencia: 'salgo a andar una hora y me despeja', created_at: haceDias(40) }
  ],
  arbol_vital: [
    { hallazgo: 'Tocar la guitarra', valencia: 'recurso', evidencia: 'cuando toco la guitarra se me pasa', created_at: haceDias(2) }
  ]
});
assert(dormidos.length === 1, 'Solo el que lleva semanas sin aparecer');
assert(dormidos[0].texto.includes('andar'), 'El correcto');

// ---------------------------------------------------------------------------
console.log('\n── Selección y directiva ───────────────────────────────');

const todos = buscarRecuerdos(
  {
    ...conAniversario,
    anclajes_protectores: [
      { ancla: 'Salir a andar', evidencia: 'salgo a andar una hora y me despeja', created_at: haceDias(40) }
    ]
  },
  episodios
);
assert(todos.length <= 2, `Nunca más de dos recuerdos por turno (${todos.length})`);
assert(new Set(todos.map(r => r.tipo)).size === todos.length, 'Nunca dos del mismo tipo');
assert(todos[0].tipo === 'aniversario', 'El aniversario pesa más que el resto');

assert(buscarRecuerdos({}, []).length === 0, 'Sin material, no se inventa nada que recordar');
assert(buildRecallDirective([]) === '', 'Sin recuerdos, no se añade nada al prompt');

const directiva = buildRecallDirective(todos);
// Esto nació de una prueba real: con la redacción anterior, llena de cautelas,
// el modelo se abstenía SIEMPRE, también en la conversación tranquila que era
// justo el momento. Un recuerdo que nunca sale no es prudencia: es una función
// que no existe.
assert(directiva.includes('EN ESTE MISMO TURNO'), 'Una fecha que cae HOY se menciona hoy, no «cuando encaje»');
assert(directiva.includes('El tono, más o menos así'), 'Lleva un ejemplo del tono: sin él, el modelo no lo sacaba');
assert(directiva.includes('con SUS datos, no con estos'), 'Y avisa de que el ejemplo no se copia');

const soloCabo = buildRecallDirective([
  { tipo: 'cabo_suelto', texto: 'Voy a apuntarme a natación', evidencia: 'voy a apuntarme a natación', detalle: 'Lo dijo hace 9 días' }
]);
assert(!soloCabo.includes('EN ESTE MISMO TURNO'), 'Sin fecha señalada, la instrucción es opcional, no imperativa');
assert(soloCabo.includes('Saca UNA si encaja'), 'Un cabo suelto se ofrece, no se impone');
assert(directiva.includes('«'), 'La directiva lleva la cita literal');
assert(directiva.includes('señal de riesgo'), 'Prohíbe sacarlo si hay riesgo');
assert(directiva.includes('Ahí lo suyo manda y esto espera'), 'Si trae algo urgente, lo suyo manda');
assert(directiva.includes('Nunca digas que lo tienes anotado'), 'No revela que lo lleva apuntado');
assert(directiva.includes('como un dato de expediente'), 'Ni recita la fecha como un dato de expediente');

// ---------------------------------------------------------------------------
console.log('\n══════════════════════════════════════════════════════');
console.log(`RECUERDO ESPONTÁNEO: ${passed} PASADAS, ${failed} FALLIDAS`);
console.log('══════════════════════════════════════════════════════\n');

if (failed > 0) process.exit(1);
