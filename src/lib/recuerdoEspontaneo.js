/**
 * @file recuerdoEspontaneo.js
 * @description Que el sistema se acuerde por su cuenta, no solo cuando le preguntan.
 *
 * LA DIFERENCIA QUE ESTO MARCA
 * ----------------------------
 * Un sistema que responde bien a lo que le preguntas es útil. Uno que un martes
 * cualquiera dice «oye, la semana pasada me contaste que ibas a hablar con tu
 * hermana, ¿lo hiciste?» es otra cosa: es alguien que estaba ahí. Esa sensación
 * —que a uno le sostienen la historia entre sesión y sesión— es la mitad de lo
 * que hace que la terapia funcione, y no se consigue recuperando mejor: se
 * consigue trayendo algo sin que se lo pidan.
 *
 * CÓMO, SIN INVENTAR
 * ------------------
 * Esto NO le pide al modelo que recuerde. Recorre lo que ya está guardado y
 * busca tres cosas concretas que merecen mencionarse hoy, con reglas
 * comprobables sobre fechas y estados:
 *
 *   1. **Aniversarios.** Hoy hace un año de aquello. La fecha está en el
 *      expediente; el cálculo es aritmética, no intuición.
 *   2. **Cabos sueltos.** Dijo que iba a hacer algo y no se ha vuelto a hablar.
 *   3. **Recursos dormidos.** Algo que le sostenía y lleva semanas sin aparecer.
 *
 * Cada candidato viaja con su cita literal. El modelo decide si lo usa y cómo
 * decirlo —a veces no toca, y forzarlo sería peor que callar—, pero el dato
 * que se le ofrece es siempre real y trazable.
 */

import { tieneEvidencia } from './anamnesisState.js';

const DIA_MS = 24 * 60 * 60 * 1000;

/** Margen para considerar que una fecha «cae hoy». */
const VENTANA_ANIVERSARIO_DIAS = 3;
/** Días sin mencionarse para que un compromiso cuente como cabo suelto. */
const DIAS_CABO_SUELTO = 5;
/** Días sin aparecer para que un recurso se considere dormido. */
const DIAS_RECURSO_DORMIDO = 21;

function fecha(valor) {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? null : d;
}

function diasDesde(valor) {
  const d = fecha(valor);
  return d ? Math.floor((Date.now() - d.getTime()) / DIA_MS) : null;
}

/**
 * ¿Cuántos días faltan (o han pasado) para el aniversario de esta fecha?
 * Devuelve un número con signo: negativo si ya pasó este año.
 */
function distanciaAlAniversario(valor) {
  const d = fecha(valor);
  if (!d) return null;
  const hoy = new Date();
  const esteAno = new Date(hoy.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((esteAno.getTime() - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()) / DIA_MS);
}

/**
 * Fechas señaladas: hoy hace años de algo que consta en su historia.
 *
 * Se limita a lo que tiene año completo. Un aniversario doloroso que nadie
 * menciona es de las cosas que más sola dejan a una persona; uno inventado por
 * un cálculo mal hecho, de las que más desconfianza generan.
 */
export function buscarAniversarios(expediente = {}) {
  const salida = [];
  for (const evento of (expediente.eventos_timeline || [])) {
    const cruda = evento.fecha || evento.date || evento.event_date;
    const d = fecha(cruda);
    if (!d || !tieneEvidencia(evento)) continue;

    const anos = new Date().getFullYear() - d.getFullYear();
    if (anos < 1) continue;

    const distancia = distanciaAlAniversario(cruda);
    if (distancia === null || Math.abs(distancia) > VENTANA_ANIVERSARIO_DIAS) continue;

    salida.push({
      tipo: 'aniversario',
      texto: evento.evento || evento.event || '',
      evidencia: evento.evidencia,
      detalle: distancia === 0
        ? `Hoy hace ${anos} ${anos === 1 ? 'año' : 'años'}`
        : distancia > 0
          ? `Dentro de ${distancia} ${distancia === 1 ? 'día' : 'días'} hace ${anos} ${anos === 1 ? 'año' : 'años'}`
          : `Hace ${Math.abs(distancia)} ${Math.abs(distancia) === 1 ? 'día' : 'días'} se cumplieron ${anos} ${anos === 1 ? 'año' : 'años'}`,
      peso: 3
    });
  }
  return salida;
}

/** Verbos de compromiso: «voy a», «he quedado en», «esta semana…». */
const PATRON_COMPROMISO =
  /\b(voy a|iba a|he quedado en|quedé en|tengo que|me he propuesto|esta semana voy|el lunes|mañana)\b/i;

/**
 * Cosas que dijo que iba a hacer y de las que no se ha vuelto a saber.
 *
 * No se pregunta como control («¿lo hiciste?» a secas suena a examen), sino
 * como interés: eso lo decide el modelo con el dato en la mano.
 */
export function buscarCabosSueltos(expediente = {}, episodios = []) {
  const salida = [];
  const textoReciente = (expediente.arbol_vital || [])
    .filter(h => (diasDesde(h.created_at) ?? 99) <= DIAS_CABO_SUELTO)
    .map(h => String(h.hallazgo || '').toLowerCase())
    .join(' ');

  for (const ep of episodios) {
    const contenido = ep.verbatimQuote || ep.content || '';
    const dias = diasDesde(ep.createdAt || ep.created_at);
    if (!contenido || dias === null) continue;
    if (dias < DIAS_CABO_SUELTO || dias > 60) continue;
    if (!PATRON_COMPROMISO.test(contenido)) continue;

    // Si el tema ha vuelto a salir hace poco, ya no es un cabo suelto.
    const palabrasClave = contenido
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter(w => w.length > 5);
    const yaRetomado = palabrasClave.some(w => textoReciente.includes(w));
    if (yaRetomado) continue;

    salida.push({
      tipo: 'cabo_suelto',
      texto: contenido.slice(0, 200),
      evidencia: contenido.slice(0, 200),
      detalle: `Lo dijo hace ${dias} días y no se ha vuelto a hablar de ello`,
      peso: 2
    });
  }
  return salida;
}

/**
 * Recursos que le sostenían y llevan tiempo sin aparecer.
 *
 * Es el candidato más delicado de los tres: señalarle a alguien que ha dejado
 * de hacer lo que le sentaba bien puede sonar a reproche. Por eso se ofrece
 * como dato, con su cita, y el modelo decide si cabe y cómo.
 */
export function buscarRecursosDormidos(expediente = {}) {
  const salida = [];
  const anclajes = [
    ...(expediente.anclajes_protectores || []),
    ...(expediente.arbol_vital || []).filter(h => String(h.valencia).toLowerCase() === 'recurso')
  ];

  for (const ancla of anclajes) {
    if (!tieneEvidencia(ancla)) continue;
    const dias = diasDesde(ancla.created_at || ancla.updated_at);
    if (dias === null || dias < DIAS_RECURSO_DORMIDO) continue;

    salida.push({
      tipo: 'recurso_dormido',
      texto: ancla.ancla || ancla.anclaje || ancla.hallazgo || '',
      evidencia: ancla.evidencia,
      detalle: `Le ayudaba, y hace ${dias} días que no aparece`,
      peso: 1
    });
  }
  return salida;
}

/**
 * Reúne los candidatos y se queda con los mejores.
 *
 * Máximo dos, y nunca dos del mismo tipo. Un turno de conversación con tres
 * recuerdos encadenados no parece atención, parece un informe.
 */
export function buscarRecuerdos(expediente = {}, episodios = [], { maximo = 2 } = {}) {
  const candidatos = [
    ...buscarAniversarios(expediente),
    ...buscarCabosSueltos(expediente, episodios),
    ...buscarRecursosDormidos(expediente)
  ].filter(c => c.texto && c.texto.trim());

  candidatos.sort((a, b) => b.peso - a.peso);

  const elegidos = [];
  const tiposUsados = new Set();
  for (const c of candidatos) {
    if (elegidos.length >= maximo) break;
    if (tiposUsados.has(c.tipo)) continue;
    tiposUsados.add(c.tipo);
    elegidos.push(c);
  }
  return elegidos;
}

/**
 * La parte del prompt que ofrece los recuerdos.
 *
 * Se le da al modelo como oportunidad, no como orden: si el paciente llega
 * hablando de otra cosa, o si hay una señal de riesgo, esto no toca. Traer un
 * aniversario a alguien que acaba de decir que no puede más sería justo lo
 * contrario de acompañar.
 */
export function buildRecallDirective(recuerdos = []) {
  if (!recuerdos.length) return '';

  const lineas = recuerdos.map(r => {
    const etiqueta = {
      aniversario: 'FECHA SEÑALADA',
      cabo_suelto: 'QUEDÓ PENDIENTE',
      recurso_dormido: 'ALGO QUE LE AYUDABA'
    }[r.tipo] || 'RECUERDO';
    return `  · [${etiqueta}] ${r.texto}\n      ${r.detalle}. Lo dijo así: «${r.evidencia}»`;
  });

  // Una fecha señalada que cae HOY no admite «ya lo sacaré otro día»: mañana
  // deja de ser hoy. Probado contra el endpoint real: con una redacción llena
  // de cautelas, el modelo se abstenía SIEMPRE, incluso en la conversación
  // tranquila, que era justo el momento para el que se construyó esto. Un
  // recuerdo que nunca sale no es prudencia, es una función que no existe.
  const hayFechaDeHoy = recuerdos.some(
    r => r.tipo === 'aniversario' && /^Hoy hace/.test(r.detalle || '')
  );

  const instruccion = hayFechaDeHoy
    ? `HOY es esa fecha, y mañana ya no lo será. MENCIÓNALO EN ESTE MISMO TURNO,
salvo que se cumpla alguna de las excepciones de abajo. No lo dejes para más
adelante en la conversación: hazlo ahora.

El tono, más o menos así (con SUS datos, no con estos):
  «Oye… hoy hace [tantos] años de lo de [aquello]. ¿Cómo llevas el día?»

Atiende primero lo que te traiga si trae algo, en una frase, y enlaza. Que nadie
se acuerde de un día así es precisamente lo que hace que pese más.`
    : `Saca UNA si encaja con lo que esté contando, o si viene con poco y hay hueco
para abrir tema. Que alguien se acuerde de lo tuyo sin que se lo pidas es de las
cosas que más acompañan.

El tono, más o menos así (con SUS datos, no con estos):
  «Por cierto, ¿al final [aquello que dijo que iba a hacer]?»`;

  return `\n--- COSAS QUE RECUERDAS DE ÉL (no se las han pedido) ---
${lineas.join('\n')}

${instruccion}

Cuándo NO: si hay cualquier señal de riesgo, o si viene con algo urgente que le
está ocupando entero. Ahí lo suyo manda y esto espera.

Cuando lo saques, con sus palabras y sin ceremonia — como quien se acuerda, no
como quien consulta una ficha. Nunca digas que lo tienes anotado, ni cites la
fecha exacta como un dato de expediente.\n`;
}
