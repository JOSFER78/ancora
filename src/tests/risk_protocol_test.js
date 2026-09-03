/**
 * @file risk_protocol_test.js
 * @description Suite del protocolo de riesgo de Áncora ⚓.
 *
 * Es el código más delicado del proyecto: un falso negativo deja sola a una
 * persona en peligro y un falso positivo enseña al paciente a no contar las
 * cosas. Se prueban las dos direcciones, y se comprueba explícitamente que
 * cada mensaje lleva el teléfono correcto y NO lleva el que no toca.
 */

import {
  detectRisk,
  buildContainmentMessage,
  buildRiskDirective,
  buildRiskRecord,
  composeRiskReply,
  recursosRequeridos,
  aplica016,
  RiskLevel,
  RiskCategory
} from '../lib/riskProtocol.js';

let passed = 0;
let failed = 0;

function assert(condition, name, detail = '') {
  if (condition) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${detail ? `\n      ${detail}` : ''}`); }
}

function nivelDe(texto, perfil = {}) {
  return detectRisk(texto, { perfil }).nivel;
}

// ---------------------------------------------------------------------------
console.log('\n── Modismos: NO son señales de riesgo ──────────────────');

const modismos = [
  'me muero de risa con lo que me contó',
  'estoy muerto de sueño, no dormí nada',
  'esta reunión me mata, es eterna',
  'me muero de ganas de que llegue el viernes',
  'estábamos matando el tiempo en la sala de espera',
  'la comida estaba de muerte'
];
for (const m of modismos) {
  assert(nivelDe(m) === RiskLevel.NINGUNO, `«${m.slice(0, 42)}…» → sin riesgo`);
}

// ---------------------------------------------------------------------------
console.log('\n── Conversación normal ─────────────────────────────────');

const normales = [
  'Hola, ¿qué tal? Hoy he tenido un día tranquilo',
  'Mi padre murió hace dos años y todavía lo echo de menos',
  'Discutí con mi jefe y me fui bastante enfadado',
  'Duermo regular pero he empezado a hacer deporte'
];
for (const n of normales) {
  assert(nivelDe(n) === RiskLevel.NINGUNO, `«${n.slice(0, 42)}…» → sin riesgo`);
}

// ---------------------------------------------------------------------------
console.log('\n── Nivel 1 · malestar sin ideación ─────────────────────');

assert(nivelDe('la verdad es que no le veo salida a esto') === RiskLevel.MALESTAR, 'Desesperanza («no le veo salida»)');
assert(nivelDe('ya no aguanto más, de verdad') === RiskLevel.MALESTAR, 'Agotamiento («no aguanto más»)');
assert(nivelDe('siento que soy una carga para mi familia') === RiskLevel.MALESTAR, 'Sensación de carga');

const r1 = detectRisk('no puedo más con todo esto');
assert(buildContainmentMessage(r1) === null, 'Nivel 1 NO interrumpe con teléfonos');
assert(buildRiskDirective(r1).includes('NO interrumpas'), 'Nivel 1 instruye validar, no derivar');
assert(r1.escalado.notifica === false && r1.escalado.urgencia === 'media', 'Nivel 1 marca el expediente sin notificar');

// ---------------------------------------------------------------------------
console.log('\n── Nivel 2 · ideación ──────────────────────────────────');

const ideacion = [
  'a veces pienso que sería mejor no estar',
  'no quiero seguir viviendo así',
  'tengo ganas de desaparecer',
  'últimamente me hago cortes en el brazo'
];
for (const i of ideacion) {
  assert(nivelDe(i) === RiskLevel.IDEACION, `«${i.slice(0, 42)}…» → nivel 2`);
}

const r2 = detectRisk('a veces pienso en quitarme la vida');
assert(r2.categoria === RiskCategory.AUTOLITICO, 'Categoría autolítica');
const m2 = buildContainmentMessage(r2);
assert(m2.includes('024'), 'Nivel 2 autolítico ofrece el 024');
assert(!m2.includes('016'), 'Nivel 2 autolítico NO ofrece el 016');
assert(r2.escalado.notifica === true && r2.escalado.plazo === 'menos de 24 h', 'Nivel 2 escala en menos de 24 h');
assert(buildRiskDirective(r2).includes('directa y sin rodeos'), 'Nivel 2 manda preguntar directamente (Dazzi et al.)');

// ---------------------------------------------------------------------------
console.log('\n── Nivel 3 · riesgo inminente ──────────────────────────');

const inminente = [
  'ya sé cómo lo haría, lo tengo pensado',
  'lo voy a hacer esta noche',
  'me he tomado todas las pastillas'
];
for (const i of inminente) {
  assert(nivelDe(i) === RiskLevel.INMINENTE, `«${i.slice(0, 42)}…» → nivel 3`);
}

const r3 = detectRisk('ya sé cómo lo haría');
const m3 = buildContainmentMessage(r3);
assert(m3.includes('112'), 'Nivel 3 ofrece el 112 SIEMPRE');
assert(m3.includes('024'), 'Nivel 3 autolítico ofrece también el 024');
assert(r3.escalado.bloqueante === true, 'Nivel 3 genera alerta bloqueante');
assert(buildRiskDirective(r3).includes('deja el mapa de anamnesis'), 'Nivel 3 interrumpe la anamnesis');

// ---------------------------------------------------------------------------
console.log('\n── EL 016: solo a quien le corresponde (D9) ────────────');

const mujerPareja = detectRisk('mi marido me pega cuando bebe');
assert(mujerPareja.nivel === RiskLevel.IDEACION, 'Violencia de pareja detectada como nivel 2');
assert(mujerPareja.categoria === RiskCategory.VIOLENCIA, 'Categoría violencia');
assert(mujerPareja.requiere016 === true, 'Violencia de pareja hacia mujer → 016 aplicable');
assert(buildContainmentMessage(mujerPareja).includes('016'), 'El mensaje ofrece el 016');

const hermano = detectRisk('mi hermano me pega desde que éramos críos');
assert(hermano.nivel === RiskLevel.IDEACION, 'Violencia de un hermano también es nivel 2');
assert(hermano.requiere016 === false, 'Agresión de un hermano → el 016 NO aplica');
const mHermano = buildContainmentMessage(hermano);
assert(!mHermano.includes('016'), 'EL BUG ARREGLADO: no se ofrece el 016 a quien no le corresponde');
assert(mHermano.includes('112'), 'Pero sí el 112, que vale para cualquiera');

const hombreVecino = detectRisk('me está pegando el vecino, ha entrado en casa');
assert(hombreVecino.nivel === RiskLevel.INMINENTE, 'Agresión en curso → nivel 3');
const mVecino = buildContainmentMessage(hombreVecino);
assert(!mVecino.includes('016'), 'Nivel 3 sin indicio de violencia machista: sin 016');
assert(mVecino.includes('091') || mVecino.includes('062'), 'Se ofrece la vía de denuncia (091/062)');

assert(aplica016('esto es violencia de género en toda regla'), 'Nombrarlo explícitamente basta');
assert(aplica016('mi novio me controla el móvil'), 'Control coercitivo de la pareja');
assert(!aplica016('discutí con mi pareja y nos gritamos'), 'Una discusión no es violencia machista');
assert(
  aplica016('mi pareja me amenaza otra vez', { genero: 'mujer' }),
  'Con el género en el expediente, la pareja agresora basta'
);
assert(
  !aplica016('mi pareja me amenaza otra vez', { genero: 'hombre' }),
  'Mismo texto, paciente hombre: no se ofrece el 016'
);

// ---------------------------------------------------------------------------
console.log('\n── Los recursos los pone el código, no el modelo ────────');

// Esto nació de una prueba real contra el endpoint: ante "a veces pienso que
// sería mejor no estar", el modelo preguntó bien pero se dejó el 024 fuera.
const respuestaSinTelefono = 'Entiendo que digas eso. ¿Tienes pensamientos de hacerte daño?';
const compuesta = composeRiskReply(respuestaSinTelefono, r2);
assert(compuesta.startsWith(respuestaSinTelefono), 'Se respeta lo que escribió el modelo');
assert(compuesta.includes('024'), 'Y se le añade el 024 que se había dejado');
assert(!compuesta.includes('016'), 'Sin colar recursos que no tocan');

const respuestaCompleta = 'Te escucho. Si esto aprieta, llama al 024, que atiende 24 horas.';
assert(
  composeRiskReply(respuestaCompleta, r2) === respuestaCompleta,
  'Si el modelo ya dio el teléfono correcto, no se duplica'
);

assert(
  composeRiskReply('Hoy hace buen día', detectRisk('hola')) === 'Hoy hace buen día',
  'Sin riesgo no se toca la respuesta'
);
assert(composeRiskReply('', r3).includes('112'), 'Si el modelo no devuelve nada, sale la contención entera');

assert(recursosRequeridos(r2).join() === '024', 'Ideación autolítica requiere el 024');
assert(recursosRequeridos(r3).sort().join() === '024,112', 'Riesgo inminente requiere 112 y 024');
assert(recursosRequeridos(hermano).join() === '112', 'Violencia sin 016 aplicable requiere solo el 112');
assert(recursosRequeridos(mujerPareja).sort().join() === '016,112', 'Violencia machista requiere 112 y 016');
assert(recursosRequeridos(r1).length === 0, 'El nivel 1 no requiere ningún teléfono');

// ---------------------------------------------------------------------------
console.log('\n── La directiva no se pasa de la raya ──────────────────');

const dirViolencia = buildRiskDirective(hermano);
assert(
  !dirViolencia.includes('quitarse la vida') || dirViolencia.includes('No le preguntes por pensamientos suicidas'),
  'Ante violencia NO se manda preguntar por ideación suicida (fallo visto en prueba real)'
);
assert(dirViolencia.includes('seguridad'), 'Ante violencia se pregunta por su seguridad');
assert(
  buildRiskDirective(r2).includes('directa y sin rodeos'),
  'Ante ideación sí se pregunta directamente'
);
assert(
  buildRiskDirective(r3).includes('NO escribas números de teléfono'),
  'Se le pide al modelo que NO escriba los teléfonos: los pone el código'
);

// ---------------------------------------------------------------------------
console.log('\n── Registro para el expediente ─────────────────────────');

const registro = buildRiskRecord(r2, { patientId: 'p-1', textoOriginal: 'a veces pienso en quitarme la vida' });
assert(registro.risk_type === RiskCategory.AUTOLITICO, 'El registro guarda la categoría');
assert(registro.nivel === 2 && registro.urgencia === 'alta', 'Nivel y urgencia coherentes');
assert(registro.severity === 'high', 'Severidad traducida al vocabulario de risk_events');
assert(registro.status === 'pending', 'Nace pendiente de revisión del psicólogo');
assert(registro.evidence_quote === 'a veces pienso en quitarme la vida', 'La evidencia va literal, sin retocar');
assert(registro.authority_level === 3, 'Autoridad N3: lo declara el paciente');
assert(buildRiskRecord(detectRisk('hola qué tal')) === null, 'Sin riesgo no se registra nada');

// ---------------------------------------------------------------------------
console.log('\n══════════════════════════════════════════════════════');
console.log(`PROTOCOLO DE RIESGO: ${passed} PASADAS, ${failed} FALLIDAS`);
console.log('══════════════════════════════════════════════════════\n');

if (failed > 0) process.exit(1);
