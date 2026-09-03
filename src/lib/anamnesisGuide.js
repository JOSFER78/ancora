/**
 * @file anamnesisGuide.js
 * @description El guion de anamnesis, convertido en instrucciones para el chat.
 *
 * Aquí se junta todo lo que gobierna una conversación clínica de Áncora ⚓:
 * el banco de preguntas compilado desde el guion, las reglas de conversación,
 * los temas que requieren permiso y la directiva que se le inyecta al modelo
 * en cada turno.
 *
 * LA IDEA DE FONDO
 * ----------------
 * El árbol de anamnesis es un mapa de lo que hay que cubrir a lo largo de
 * muchas conversaciones, NO un cuestionario que rellenar. Por eso al modelo no
 * se le entrega una pregunta que deba hacer, sino: qué dimensión anda más
 * floja, qué ya sabemos (para que no lo repregunte), y unas preguntas de
 * ejemplo del tono correcto. Quien decide si toca preguntar algo —y qué— es el
 * modelo leyendo la conversación; el guion le dice hacia dónde mirar cuando
 * haya sitio para mirar.
 *
 * Contenido clínico: `docs/clinico/GUION_ANAMNESIS.md` (fuente de verdad).
 * Riesgo: `riskProtocol.js`. Aritmética del estado: `anamnesisState.js`.
 */

import { BANCO_PREGUNTAS } from './anamnesisBank.generated.js';
import {
  computeAnamnesisState,
  selectNextDimension,
  selectNextAxis,
  tieneEvidencia,
  MaturityState,
  BondLevel
} from './anamnesisState.js';
import { LIFE_TREE_CATEGORIES } from '../services/clinicalIngestionService.js';

/** Nombre legible de cada dimensión, para hablar de ellas sin jerga. */
export const NOMBRE_DIMENSION = {
  salud_fisica: 'salud física y cuerpo',
  salud_emocional: 'vida emocional',
  familia_y_vinculos: 'familia y vínculos',
  trabajo_y_proposito: 'trabajo y propósito',
  economia_y_seguridad: 'economía y seguridad material',
  identidad_y_valores: 'identidad y valores'
};

/** Qué busca cada eje de las 5 P, dicho en una línea. */
export const DESCRIPCION_EJE = {
  problema: 'qué le trae hoy y cómo lo describe con sus palabras',
  predisponentes: 'la historia de fondo que le hizo vulnerable a esto',
  precipitantes: 'qué pasó cerca en el tiempo, el "por qué ahora"',
  mantenedores: 'qué sostiene el problema hoy, en el día a día',
  protectores: 'qué le sostiene a él: recursos, personas, cosas que sí funcionan'
};

/**
 * Las 10 reglas de conversación, redactadas para el prompt.
 *
 * Van íntegras en cada turno y no se resumen: son lo que separa una
 * conversación clínica de un cuestionario con buen tono. Las tres primeras son
 * las que más se incumplen si se aflojan.
 */
export const REGLAS_CONVERSACION = `REGLAS DE CONVERSACIÓN (obligatorias, por encima de cualquier otra directiva de estilo):
1. UNA SOLA PREGUNTA POR TURNO. Nunca dos. Si te interesan dos cosas, elige la más pegada a lo que acaba de contar y guarda la otra.
2. SIGUE EL HILO, NO EL GUION. Si está desarrollando un tema, no lo cortes para cambiar de área aunque el mapa diga que toca otra cosa. El mapa se cubre en semanas, no en una conversación.
3. PROHIBIDO REPREGUNTAR LO YA CONTADO. Revisa lo que ya consta más abajo. Si ya lo dijo, reconócelo ("la última vez me contabas que…") y pregunta lo que aún falta. Volver a preguntar lo mismo le dice al paciente que no le escuchas.
4. RECONDUCIR SIN CORTAR. Si se desvía, espera a que termine, valida en una frase y ofrece el puente como pregunta ("¿te importa si volvemos un momento a…?"), nunca como orden. Si prefiere seguir por donde iba, se le sigue.
5. SABER CALLAR. Tras una revelación intensa, no llenes el silencio con la siguiente pregunta: valida y para. Excepción: si está muy ansioso o desbordado, no dejes el espacio abierto, dale algo claro y breve a lo que agarrarse.
6. VALIDA ANTES DE INDAGAR. Cada respuesta merece un reconocimiento breve antes de la siguiente pregunta. Nunca encadenes preguntas.
7. NO INTERPRETES NI ETIQUETES. Nada de nombres de trastornos, ni como hipótesis ni "esto suena a…". Nada de explicaciones causales ("te pasa porque de pequeño…"). Refleja con sus palabras.
8. NO FUERCES CIERRES. Si un tema queda a medias, está bien: se retoma otro día. Nunca digas que necesitas completar una sección: el mapa es interno e invisible para el paciente.
9. SUS PALABRAS, NO LAS TUYAS. Cuando reflejes, usa las expresiones exactas que ha usado él. No las traduzcas a sinónimos más clínicos.
10. TURNOS BREVES. De 2 a 4 frases. Conversación, no exposición. La excepción es el protocolo de riesgo.`;

/** Temas que no se abren sin permiso explícito, con su guion de entrada. */
export const TEMAS_SENSIBLES = {
  trauma: {
    etiqueta: 'trauma o historia dolorosa',
    permiso: 'Hay algo que me gustaría preguntarte, pero solo si te parece bien: ¿cómo fue esa etapa para ti? No hace falta que entres en detalles que no te apetezca compartir, y si prefieres dejarlo para otro momento, no pasa nada en absoluto.'
  },
  consumo: {
    etiqueta: 'consumo de sustancias',
    permiso: 'Te quería preguntar por algo que a veces cuesta hablar: el alcohol, el tabaco u otras sustancias, cómo forman parte de tu día a día si es que forman parte. Te lo pregunto porque me ayuda a entender mejor cómo te cuidas, no para juzgar nada.'
  },
  sexualidad: {
    etiqueta: 'sexualidad',
    permiso: 'Si te parece bien, me gustaría entender un poco más sobre esa parte de tu vida también, porque a veces tiene que ver con cómo nos sentimos en general. No es obligatorio entrar ahí si no te apetece.'
  },
  violencia: {
    etiqueta: 'violencia vivida o ejercida',
    permiso: 'Quiero preguntarte algo con cuidado: ¿alguna vez alguien cercano a ti te ha hecho sentir en peligro, física o emocionalmente? Puedes responder solo lo que te parezca oportuno, y si no es un buen momento, lo dejamos aquí sin problema.'
  }
};

/** Cómo se sale cuando el paciente se cierra. Literal, sin insistir. */
export const SALIDA_TEMA_CERRADO =
  'Lo dejamos aquí, sin problema. Gracias por decírmelo con claridad. Cuando te apetezca retomarlo, si es que quieres, aquí estaré.';

/** Subbloques del bloque 0, que se recorren siempre al principio. */
export function subbloquesApertura() {
  return BANCO_PREGUNTAS.filter(s => s.dimension === 'apertura');
}

/** Subbloques de una dimensión, opcionalmente filtrados por eje 5P. */
export function subbloquesDe(dimension, eje = null) {
  return BANCO_PREGUNTAS.filter(
    s => s.dimension === dimension && (!eje || s.eje === eje)
  );
}

/**
 * Resumen de lo que ya consta, para que el modelo no lo repregunte (regla 3).
 *
 * Solo entra lo que lleva cita literal. Un hallazgo sin evidencia no cuenta
 * para la madurez, así que tampoco puede colarse aquí como "ya sabido": eso
 * convertiría una suposición del modelo en un hecho que da por hablado con el
 * paciente, y es justo la vía por la que se contaminaría el expediente.
 */
function resumirLoQueYaSabemos(expediente = {}, maxPorDimension = 4) {
  const lineas = [];
  for (const dim of LIFE_TREE_CATEGORIES) {
    const hallazgos = (expediente.arbol_vital || [])
      .filter(h => (h.categoria || h.dimension) === dim && h.hallazgo && tieneEvidencia(h))
      .slice(0, maxPorDimension)
      .map(h => h.hallazgo);
    if (hallazgos.length) {
      lineas.push(`• ${NOMBRE_DIMENSION[dim]}: ${hallazgos.join(' · ')}`);
    }
  }
  const anclajes = (expediente.anclajes_protectores || [])
    .filter(tieneEvidencia)
    .slice(0, 4)
    .map(a => a.ancla || a.anclaje)
    .filter(Boolean);
  if (anclajes.length) lineas.push(`• Le sostienen: ${anclajes.join(' · ')}`);

  return lineas;
}

/**
 * Construye la directiva de anamnesis que se inyecta en el prompt de sistema.
 *
 * @param {Object} opciones
 * @param {Object} opciones.expediente       Colecciones del paciente.
 * @param {number} [opciones.conversaciones] Conversaciones clínicas registradas.
 * @param {number} [opciones.turnosPaciente] Turnos del paciente acumulados.
 * @param {boolean} [opciones.primeraConversacion]
 * @returns {{directiva: string, estado: Object, objetivo: Object|null}}
 */
export function buildAnamnesisDirective({
  expediente = {},
  conversaciones = 0,
  turnosPaciente = 0,
  primeraConversacion = false
} = {}) {
  const estado = computeAnamnesisState(expediente, { conversaciones, turnosPaciente });

  // Apertura: mientras no sepamos por qué está aquí, no se explora nada más.
  const sinMotivo = estado.totalHallazgos === 0 || primeraConversacion;
  if (sinMotivo) {
    const apertura = subbloquesApertura();
    const ejemplos = apertura.flatMap(s => s.preguntas.slice(0, 2).map(p => p.texto));
    return {
      estado,
      objetivo: { fase: 'apertura', subbloques: apertura.map(s => s.id) },
      directiva: `\n--- MAPA DE ANAMNESIS: APERTURA ---
Todavía no consta por qué está aquí. Antes de explorar ninguna otra área, hay dos cosas que entender: qué le trae ahora (con sus palabras, sin resumírselas) y cómo le está afectando en el día a día.
Preguntas del tono correcto (adáptalas, no las recites):
${ejemplos.map(p => `  · ${p}`).join('\n')}
No pases de aquí hasta tener las dos. Y si él trae otra cosa, se le sigue: la apertura puede tardar varias conversaciones.

${REGLAS_CONVERSACION}\n`
    };
  }

  const objetivo = selectNextDimension(estado);
  const eje = selectNextAxis(objetivo);
  const subbloques = subbloquesDe(objetivo.dimension, eje);
  const ejemplos = subbloques.flatMap(s => s.preguntas.slice(0, 3).map(p => p.texto)).slice(0, 5);
  const yaSabemos = resumirLoQueYaSabemos(expediente);

  const esSensible =
    eje === 'predisponentes' &&
    ['familia_y_vinculos', 'identidad_y_valores', 'economia_y_seguridad'].includes(objetivo.dimension);
  const puedeEntrarSensible = estado.vinculo.nivel === BondLevel.B;

  let notaVinculo = '';
  if (esSensible && !puedeEntrarSensible) {
    notaVinculo = `\n⚠️ Este terreno toca historia personal de fondo y el vínculo todavía no da para que lo propongas tú (nivel actual: ${estado.vinculo.nivel}). Si lo saca él, se le sigue con normalidad. Si no, quédate en lo cotidiano y en lo que sí sostiene.`;
  } else if (estado.vinculo.nivel === BondLevel.B) {
    notaVinculo = `\nHay vínculo suficiente para proponer terrenos más delicados, SIEMPRE pidiendo permiso antes y aceptando un no a la primera. Guion de entrada: «${TEMAS_SENSIBLES.trauma.permiso}»`;
  }

  const mapa = estado.dimensiones
    .map(d => `  ${d.estado === MaturityState.PENDIENTE ? '○' : d.estado === MaturityState.EN_EXPLORACION ? '◐' : '●'} ${NOMBRE_DIMENSION[d.dimension]}: ${d.hallazgos} datos${d.ejesCubiertos ? `, ${d.ejesCubiertos}/4 ángulos` : ''}`)
    .join('\n');

  return {
    estado,
    objetivo: { fase: 'exploracion', dimension: objetivo.dimension, eje, subbloques: subbloques.map(s => s.id) },
    directiva: `\n--- MAPA DE ANAMNESIS (interno: NUNCA menciones que sigues un mapa) ---
Cobertura actual: ${estado.madurezGlobal}% · ${estado.totalHallazgos} datos con cita textual.
${mapa}

DÓNDE MIRAR SI LA CONVERSACIÓN DEJA SITIO: ${NOMBRE_DIMENSION[objetivo.dimension]}, buscando ${DESCRIPCION_EJE[eje]}.
Preguntas del tono correcto (adáptalas a lo que él acaba de decir, no las recites):
${ejemplos.map(p => `  · ${p}`).join('\n')}${notaVinculo}

Esto es una prioridad de fondo, no una orden: si está en medio de algo, el algo manda (regla 2).

LO QUE YA CONSTA — NO SE REPREGUNTA (regla 3):
${yaSabemos.length ? yaSabemos.join('\n') : '  (aún nada con cita verificada)'}

${REGLAS_CONVERSACION}\n`
  };
}
