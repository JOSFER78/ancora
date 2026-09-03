/**
 * @file riskProtocol.js
 * @description Protocolo de riesgo de Áncora ⚓ — detección, contención y escalado.
 *
 * POR QUÉ ESTO ES CÓDIGO Y NO UNA INSTRUCCIÓN DEL PROMPT
 * -----------------------------------------------------
 * Un modelo puede olvidar una regla, reinterpretarla o dejarse llevar por el
 * tono de la conversación. El protocolo de riesgo no puede depender de eso.
 * Aquí la detección es determinista y el mensaje de contención es literal: el
 * modelo puede añadir calidez alrededor, pero los recursos de ayuda salen de
 * este archivo, siempre iguales y siempre correctos.
 *
 * Esta capa NO sustituye al criterio del modelo, lo respalda: el prompt también
 * lleva la instrucción, y cualquiera de las dos vías que se dispare activa el
 * protocolo. Es una red de seguridad, y una red se pone debajo, no en lugar de.
 *
 * EL RECURSO CORRECTO PARA CADA CASO (esto era un fallo real del guion)
 * --------------------------------------------------------------------
 * - **112** — emergencias. Vale SIEMPRE, para cualquier peligro inmediato.
 * - **024** — línea de atención a la conducta suicida. Gratuita, confidencial,
 *   24 h. Solo para riesgo autolítico.
 * - **016** — atiende **violencia contra las mujeres**. NO es una línea
 *   genérica de violencia: ofrecérsela a un hombre agredido por su hermano, o
 *   a alguien que describe una pelea vecinal, es darle un recurso que no le
 *   corresponde y transmitirle que el sistema no le ha entendido. Aquí solo se
 *   ofrece cuando hay indicios de que la violencia es contra una mujer.
 * - **091 / 062** — Policía Nacional / Guardia Civil, para denunciar cuando no
 *   hay emergencia en curso.
 *
 * Preguntar directamente por la ideación suicida NO la induce (Dazzi et al.,
 * 2014, *Psychological Medicine*): ninguno de los estudios revisados encontró
 * aumento significativo de la ideación tras preguntar, y sí indicios de alivio.
 * Por eso el nivel 2 pregunta sin rodeos en vez de insinuar.
 */

/** Niveles del protocolo. El número importa: se compara con `>=`. */
export const RiskLevel = {
  NINGUNO: 0,
  MALESTAR: 1,
  IDEACION: 2,
  INMINENTE: 3
};

/** Categorías, alineadas con `senales_riesgo.tipo` del pipeline de ingesta. */
export const RiskCategory = {
  AUTOLITICO: 'autolitico',
  VIOLENCIA: 'violencia',
  DESPROTECCION: 'desproteccion',
  CONSUMO: 'consumo',
  OTRO: 'otro'
};

/** Teléfonos, en un solo sitio para que no se contradigan entre pantallas. */
export const HELPLINES = {
  emergencias: { numero: '112', nombre: 'Emergencias' },
  suicidio: {
    numero: '024',
    nombre: 'Línea de atención a la conducta suicida',
    detalle: 'gratuita, confidencial, 24 horas todos los días del año'
  },
  violenciaMujer: {
    numero: '016',
    nombre: 'Atención a la violencia contra las mujeres',
    detalle: 'gratuito, confidencial, no queda registrado en la factura, 24 horas',
    whatsapp: '600 000 016'
  },
  policia: { numero: '091', nombre: 'Policía Nacional' },
  guardiaCivil: { numero: '062', nombre: 'Guardia Civil' }
};

/**
 * Expresiones hechas del castellano que hablan de muerte sin hablar de muerte.
 *
 * Sin esta lista, "me muero de sueño" o "esta reunión me mata" disparan una
 * alerta de riesgo. Un falso positivo aquí no es inocuo: rompe la conversación,
 * asusta al paciente y le enseña a no contar las cosas con naturalidad.
 */
const MODISMOS = [
  /me\s+muero\s+de\s+(risa|sue[ñn]o|hambre|sed|ganas|amor|frío|calor|verg[üu]enza|envidia|aburrimiento)/i,
  /muert[oa]\s+de\s+(risa|sue[ñn]o|hambre|sed|miedo|cansancio|frío|calor|asco|aburrimiento)/i,
  /me\s+mata\s+(el|la|este|esta|lo)\s+\w+/i,
  /matar\s+el\s+tiempo/i,
  /de\s+muerte\b/i,
  /me\s+cort[oé]\s+el\s+pelo/i,
  /(morir|muero)\s+de\s+(risa|amor|ganas)/i
];

/** Patrones por nivel. El orden manda: se evalúa de mayor a menor gravedad. */
const PATRONES = {
  [RiskLevel.INMINENTE]: {
    [RiskCategory.AUTOLITICO]: [
      /\b(ya\s+)?s[eé]\s+c[oó]mo\s+(lo\s+)?(har[ií]a|voy\s+a\s+hacerlo|hacerlo)/i,
      /teng[oa]\s+(pensad[oa]|decidid[oa]|planeado)\s+(cu[aá]ndo|c[oó]mo|el\s+d[ií]a)/i,
      /\b(he|voy\s+a)\s+(comprado|conseguido|reunido)\s+(las\s+)?pastillas\b/i,
      /me\s+(voy\s+a|quiero)\s+(matar|quitar\s+la\s+vida|suicidar)\s*(hoy|esta\s+noche|ya|ahora)/i,
      /lo\s+voy\s+a\s+hacer\s+(hoy|esta\s+noche|ya|ahora|mañana)/i,
      /(he\s+escrito|dej[eé])\s+(una\s+)?(carta|nota)\s+de\s+despedida/i,
      /me\s+(estoy|acabo\s+de)\s+cort(ando|ar)\b/i,
      /me\s+he\s+tomado\s+(todas\s+)?las\s+pastillas/i
    ],
    [RiskCategory.VIOLENCIA]: [
      /(me\s+est[aá]\s+pegando|me\s+acaba\s+de\s+pegar|est[aá]\s+aqu[ií].*(pegando|golpe))/i,
      /(tiene|lleva)\s+un\s+(cuchillo|arma|pistola)/i,
      /(me\s+va\s+a\s+matar|amenaz[oó]\s+con\s+matarme)/i,
      /estoy\s+encerrad[oa]\s+(en|dentro)/i,
      /(me\s+ha\s+violado|me\s+est[aá]\s+forzando)/i
    ],
    [RiskCategory.DESPROTECCION]: [
      /(el|la|mi)\s+(ni[ñn][oa]|cr[ií]a|beb[eé]|hij[oa])\s+(est[aá]|sigue)\s+(sol[oa]|en\s+peligro|sin\s+comer)/i,
      /(le\s+pega|les\s+pega|est[aá]\s+pegando)\s+(a|al)\s+(l[oa]s?\s+)?(ni[ñn][oa]|cr[ií]a|beb[eé]|hij[oa])/i
    ]
  },

  [RiskLevel.IDEACION]: {
    [RiskCategory.AUTOLITICO]: [
      /no\s+quiero\s+(seguir\s+viviendo|vivir|estar\s+aqu[ií]|seguir\s+as[ií])/i,
      /(ser[ií]a|estar[ií]a)\s+mejor\s+(no\s+estar|si\s+no\s+estuviera|desaparecer|no\s+despertar)/i,
      /(pienso|pensar)\s+en\s+(quitarme\s+la\s+vida|suicidarme|matarme|morirme)/i,
      /ganas\s+de\s+(morirme|desaparecer|no\s+despertar)/i,
      /\bideaci[oó]n\s+suicida\b/i,
      /(quiero|querr[ií]a)\s+(morirme|desaparecer|dejar\s+de\s+existir)/i,
      /me\s+(he\s+hecho|hago)\s+(cortes|da[ñn]o)\b/i,
      /(autolesion|autolesión|autolesiones|autolesionarme)/i,
      /(mejor\s+muert[oa]|estar[ií]an\s+mejor\s+sin\s+m[ií])/i
    ],
    [RiskCategory.VIOLENCIA]: [
      /(me\s+(pega|pegaba|agrede|agred[ií]a|empuja|zarandea))\b/i,
      /(me\s+(amenaza|amenaz[oó])|tengo\s+miedo\s+de\s+(que\s+)?(vuelva|[eé]l|ella))/i,
      /(malos\s+tratos|violencia\s+(de\s+g[eé]nero|machista|dom[eé]stica))/i,
      /me\s+oblig[oa]\s+a\s+(tener\s+sexo|acostarme)/i
    ],
    [RiskCategory.CONSUMO]: [
      /(bebo|beber)\s+(todos\s+los\s+d[ií]as|a\s+diario|hasta\s+(perder|no\s+recordar))/i,
      /(me\s+meto|consumo)\s+.*(a\s+diario|todos\s+los\s+d[ií]as)/i,
      /no\s+puedo\s+parar\s+de\s+(beber|consumir|tomar)/i,
      /(sobredosis|me\s+pas[eé]\s+con\s+las\s+pastillas)/i
    ],
    [RiskCategory.DESPROTECCION]: [
      /(dejo|dej[eé])\s+(a\s+)?(l[oa]s?\s+)?(ni[ñn][oa]s?|cr[ií]as?|hij[oa]s?)\s+sol[oa]s?/i,
      /no\s+puedo\s+(cuidar|atender)\s+(a\s+)?(mi|l[oa]s?)\s+(hij[oa]|ni[ñn][oa]|madre|padre|abuel)/i
    ]
  },

  [RiskLevel.MALESTAR]: {
    [RiskCategory.OTRO]: [
      /no\s+(le\s+)?veo\s+(salida|sentido|futuro)/i,
      /no\s+(aguanto|puedo)\s+m[aá]s\b/i,
      /estoy\s+(agotad[oa]|hundid[oa]|rot[oa])\s+de\s+todo/i,
      /soy\s+una\s+carga\s+para/i,
      /(todo\s+me\s+da\s+igual|nada\s+tiene\s+sentido)/i,
      /(no\s+le\s+importo\s+a\s+nadie|estoy\s+complet[ao]mente\s+sol[oa])/i,
      /para\s+qu[eé]\s+(seguir|sigo|molestarme)/i
    ]
  }
};

/**
 * El paciente nombra él mismo el marco: violencia de género o machista.
 * Es la única señal que no admite discusión.
 */
const NOMBRA_VIOLENCIA_GENERO = /violencia\s+(de\s+g[eé]nero|machista)/i;

/** La pareja (o expareja) aparece como agresora. Indicio, no prueba. */
const PAREJA_AGRESORA =
  /(mi|su)\s+(marido|mujer|novi[oa]|pareja|ex|exmarido|exnovi[oa]|compa[ñn]er[oa])\b[^.]{0,60}?\b(me\s+)?(pega|peg[oó]|pegaba|amenaza|amenaz[oó]|agrede|agredi[oó]|maltrata|maltrataba|oblig[ao]|fuerza|controla|revisa|no\s+me\s+deja)/i;

/**
 * Términos de pareja gramaticalmente masculinos. Que el agresor sea un hombre
 * no prueba que la víctima sea una mujer —existen las parejas del mismo sexo—
 * pero, sin ningún dato de género en el expediente, es el indicio disponible.
 */
const PAREJA_MASCULINA = /\b(mi|su)\s+(marido|novio|exmarido|exnovio|compa[ñn]ero)\b/i;

/** Palabras que denotan que quien habla se refiere a sí misma en femenino. */
const AUTORREFERENCIA_FEMENINA = /\b(estoy\s+\w+ada|me\s+siento\s+\w+ada|soy\s+(una\s+)?\w+a\b|aterrada|asustada|harta|agotada|sola|perdida|cansada)\b/i;

function limpiar(texto) {
  return String(texto || '').replace(/\s+/g, ' ').trim();
}

/** ¿El texto es solo una expresión hecha? */
function esModismo(texto) {
  return MODISMOS.some(re => re.test(texto));
}

/**
 * Decide si procede ofrecer el 016.
 *
 * Devuelve `true` SOLO ante indicio positivo. En la duda no se ofrece: el 112
 * cubre cualquier emergencia y no deja fuera a nadie, mientras que ofrecer el
 * 016 a quien no le corresponde sí es un error visible.
 *
 * @param {string} texto            Lo que ha escrito el paciente.
 * @param {Object} [perfil]         Perfil del paciente, si se conoce.
 * @param {string} [perfil.genero]  'mujer' | 'femenino' | 'f' … si consta.
 */
export function aplica016(texto, perfil = {}) {
  const t = limpiar(texto);
  if (!t) return false;

  // 1. Si lo nombra el propio paciente, no hay nada que inferir.
  if (NOMBRA_VIOLENCIA_GENERO.test(t)) return true;

  const generoDeclarado = String(perfil?.genero || perfil?.gender || perfil?.sexo || '').toLowerCase();
  const esMujer = /^(mujer|femenino|femenina|f)$/.test(generoDeclarado);
  const esHombre = /^(hombre|masculino|m|var[oó]n)$/.test(generoDeclarado);

  // 2. El dato del expediente manda sobre cualquier inferencia del texto.
  //    «Mi pareja me amenaza» es idéntico lo diga quien lo diga: si consta que
  //    quien habla es un hombre, el 016 no es su recurso.
  if (esHombre) return false;

  if (!PAREJA_AGRESORA.test(t)) return false;
  if (esMujer) return true;

  // 3. Sin género en el expediente: hacen falta indicios en el propio texto.
  //    Se ofrece como opción, nunca como única vía, y el mensaje dice a quién
  //    atiende la línea, de modo que quien lea sepa si le corresponde.
  return AUTORREFERENCIA_FEMENINA.test(t) || PAREJA_MASCULINA.test(t);
}

/**
 * Analiza el texto del paciente y devuelve el nivel de riesgo detectado.
 *
 * @param {string} texto
 * @param {Object} [opciones]
 * @param {Object} [opciones.perfil]   Perfil del paciente (para el 016).
 * @returns {{
 *   nivel: number, categoria: string, disparador: string|null,
 *   requiere016: boolean, escalado: Object
 * }}
 */
export function detectRisk(texto, { perfil = {} } = {}) {
  const t = limpiar(texto);
  const sinRiesgo = {
    nivel: RiskLevel.NINGUNO,
    categoria: RiskCategory.OTRO,
    disparador: null,
    requiere016: false,
    escalado: ESCALADO[RiskLevel.NINGUNO]
  };

  if (!t || t.length < 3) return sinRiesgo;

  for (const nivel of [RiskLevel.INMINENTE, RiskLevel.IDEACION, RiskLevel.MALESTAR]) {
    const porCategoria = PATRONES[nivel] || {};
    for (const [categoria, patrones] of Object.entries(porCategoria)) {
      for (const re of patrones) {
        const match = t.match(re);
        if (!match) continue;
        // Un modismo no es una señal de riesgo, por muy literal que suene.
        if (esModismo(match[0])) continue;
        return {
          nivel,
          categoria,
          disparador: match[0],
          requiere016: categoria === RiskCategory.VIOLENCIA && aplica016(t, perfil),
          escalado: ESCALADO[nivel]
        };
      }
    }
  }

  return sinRiesgo;
}

/** Qué se hace con el psicólogo en cada nivel. */
export const ESCALADO = {
  [RiskLevel.NINGUNO]: { urgencia: null, notifica: false, bloqueante: false, plazo: null },
  [RiskLevel.MALESTAR]: { urgencia: 'media', notifica: false, bloqueante: false, plazo: 'próxima revisión' },
  [RiskLevel.IDEACION]: { urgencia: 'alta', notifica: true, bloqueante: false, plazo: 'menos de 24 h' },
  [RiskLevel.INMINENTE]: { urgencia: 'critica', notifica: true, bloqueante: true, plazo: 'inmediato' }
};

/**
 * Construye el mensaje de contención con los recursos correctos.
 *
 * Devuelve `null` en nivel 0 y 1: en el nivel 1 no se interrumpe la
 * conversación, solo se marca el fragmento para el psicólogo. Interrumpir a
 * alguien que ha dicho "no puedo más" con una lista de teléfonos es la forma
 * más rápida de que no vuelva a decirlo.
 *
 * @param {Object} riesgo  Lo devuelto por `detectRisk`.
 * @returns {string|null}
 */
export function buildContainmentMessage(riesgo) {
  const bloque = buildResourceBlock(riesgo);
  if (!bloque) return null;
  return `${aperturaCalida(riesgo)}\n\n${bloque}`;
}

/** Una frase de acompañamiento para cuando el bloque va solo, sin texto del modelo. */
function aperturaCalida(riesgo) {
  if (riesgo.categoria === RiskCategory.VIOLENCIA) {
    return riesgo.nivel === RiskLevel.INMINENTE
      ? 'Lo que describes es una situación de peligro real.'
      : 'Gracias por contármelo. Lo que describes es serio y no tendrías por qué estar pasándolo.';
  }
  if (riesgo.categoria === RiskCategory.DESPROTECCION) {
    return 'Lo que cuentas me preocupa por la seguridad de esa persona.';
  }
  return riesgo.nivel === RiskLevel.INMINENTE
    ? 'Lo que me acabas de contar me preocupa de verdad, y quiero que te lo tomes tan en serio como me lo estoy tomando yo.'
    : 'Gracias por contarme esto, sé que no es fácil decirlo en voz alta.';
}

/**
 * Bloque de recursos que el código añade a la respuesta del modelo.
 *
 * Va sin validación emocional al principio —de eso se encarga el modelo, que
 * sabe lo que se acaba de decir— y sin pregunta al final, para no pisarle el
 * cierre. Solo: qué teléfono, para qué sirve, y que el psicólogo se entera.
 */
export function buildResourceBlock(riesgo) {
  if (!riesgo || riesgo.nivel < RiskLevel.IDEACION) return null;

  const { numero: e112 } = HELPLINES.emergencias;
  const { numero: e024, detalle: d024 } = HELPLINES.suicidio;
  const { numero: e016, detalle: d016, whatsapp } = HELPLINES.violenciaMujer;
  const inminente = riesgo.nivel === RiskLevel.INMINENTE;

  const aviso = inminente
    ? 'Voy a avisar a tu psicólogo/a ahora mismo, porque es importante que lo sepa cuanto antes.'
    : 'Voy a avisar a tu psicólogo/a de lo que me has contado, para que pueda hablarlo contigo pronto.';

  if (riesgo.categoria === RiskCategory.VIOLENCIA) {
    const lineas = [`Si estás en peligro${inminente ? ' ahora mismo' : ' en algún momento'}, llama al **${e112}**.`];
    if (riesgo.requiere016) {
      lineas.push(
        `Y si quieres hablar con alguien que sepa exactamente cómo ayudarte con esto, el **${e016}** ` +
        `atiende la violencia contra las mujeres: ${d016}. También por WhatsApp, en el ${whatsapp}.`
      );
    } else if (inminente) {
      lineas.push(
        `Si no hay peligro en este momento pero quieres denunciar lo que está pasando, puedes hacerlo ` +
        `en el **${HELPLINES.policia.numero}** (Policía Nacional) o el **${HELPLINES.guardiaCivil.numero}** (Guardia Civil).`
      );
    }
    return `${lineas.join('\n\n')}\n\n${aviso}`;
  }

  if (riesgo.categoria === RiskCategory.DESPROTECCION) {
    return `Si hay peligro inmediato para esa persona, llama al **${e112}**.\n\n${aviso}`;
  }

  // Autolítico (y cualquier otra categoría que llegue a nivel 2 o 3).
  const lineas = [];
  if (inminente) {
    lineas.push(`Si ahora mismo crees que puedes hacerte daño en cualquier momento, llama ya al **${e112}**.`);
    lineas.push(
      `Y si no es tan inmediato pero necesitas hablar con alguien ya, llama al **${e024}**, ` +
      `la línea de atención a la conducta suicida: ${d024}. Hay personas formadas esperando al otro lado.`
    );
  } else {
    lineas.push(
      `Si en algún momento —hoy, esta noche, cuando sea— esto se hace más fuerte, puedes llamar al ` +
      `**${e024}**, la línea de atención a la conducta suicida: ${d024}. ` +
      `También se puede escribir por chat en su web, si te resulta más fácil que hablar.`
    );
  }
  return `${lineas.join('\n\n')}\n\n${aviso}`;
}

/**
 * Teléfonos que TIENEN que llegarle al paciente en este caso concreto.
 * Es la lista contra la que se comprueba la respuesta antes de enviarla.
 */
export function recursosRequeridos(riesgo) {
  if (!riesgo || riesgo.nivel < RiskLevel.IDEACION) return [];
  const numeros = [];
  if (riesgo.nivel === RiskLevel.INMINENTE) numeros.push(HELPLINES.emergencias.numero);
  if (riesgo.categoria === RiskCategory.AUTOLITICO) numeros.push(HELPLINES.suicidio.numero);
  if (riesgo.categoria === RiskCategory.VIOLENCIA) {
    numeros.push(HELPLINES.emergencias.numero);
    if (riesgo.requiere016) numeros.push(HELPLINES.violenciaMujer.numero);
  }
  if (riesgo.categoria === RiskCategory.DESPROTECCION) numeros.push(HELPLINES.emergencias.numero);
  return [...new Set(numeros)];
}

/**
 * Instrucción que se inyecta en el prompt cuando hay riesgo.
 *
 * NO le pide al modelo que escriba los teléfonos. Se probó y falla: ante
 * "a veces pienso que sería mejor no estar", el modelo hizo la pregunta
 * directa —correcta— pero se dejó el 024 por el camino. Un recurso de ayuda
 * que aparece según le venga al modelo no es un protocolo, es una lotería.
 * Ahora el modelo escribe el acompañamiento y el código añade los recursos
 * (`composeRiskReply`), de modo que salgan siempre y salgan bien.
 */
export function buildRiskDirective(riesgo) {
  if (!riesgo || riesgo.nivel === RiskLevel.NINGUNO) return '';

  if (riesgo.nivel === RiskLevel.MALESTAR) {
    return `\n--- SEÑAL DE MALESTAR DETECTADA (nivel 1) ---\n` +
      `El paciente ha expresado desesperanza ("${riesgo.disparador}"). NO interrumpas la conversación ` +
      `ni ofrezcas teléfonos: eso ahora rompería el clima. Valida lo que ha dicho sin dramatizar, ` +
      `quédate en ello y explora con cuidado cómo de fuerte es y desde cuándo. Queda registrado para ` +
      `su psicólogo/a.\n`;
  }

  // La pregunta directa por la ideación es SOLO para riesgo autolítico. Se
  // probó sin este filtro y, ante "mi hermano me pega", el modelo preguntó
  // por pensamientos suicidas: una pregunta que ahí no venía a cuento.
  const instruccionCentral = riesgo.categoria === RiskCategory.AUTOLITICO
    ? (riesgo.nivel === RiskLevel.IDEACION
        ? `Pregunta de forma directa y sin rodeos si hay pensamientos de hacerse daño o de quitarse la vida. Preguntarlo no induce el riesgo; evitarlo sí deja a la persona sola con ello.`
        : `No explores más: acompaña y transmite que esto se atiende ya.`)
    : riesgo.categoria === RiskCategory.VIOLENCIA
      ? `Céntrate en su seguridad ahora mismo: si está en un sitio seguro y si hay alguien con quien pueda estar. No le preguntes por pensamientos suicidas, que no es de lo que está hablando, y no le pidas que cuente los detalles de lo ocurrido.`
      : `Céntrate en la seguridad de la persona en riesgo. No pidas detalles del episodio.`;

  return `\n--- PROTOCOLO DE RIESGO ACTIVO (nivel ${riesgo.nivel}, ${riesgo.categoria}) ---\n` +
    `Detectado en: "${riesgo.disparador}".\n` +
    `PRIORIDAD ABSOLUTA: deja el mapa de anamnesis. Nada de preguntas exploratorias de otros temas.\n` +
    `${instruccionCentral}\n` +
    `Dile con claridad que vas a avisar a su psicólogo/a.\n` +
    `NO escribas números de teléfono ni nombres de líneas de ayuda: el sistema añade los recursos ` +
    `correctos justo después de tu mensaje. Si los pones tú, saldrán duplicados.\n` +
    `Escribe solo el acompañamiento: breve, cálido, sin dramatizar y sin minimizar.\n`;
}

/**
 * Une lo que ha escrito el modelo con los recursos de ayuda.
 *
 * Si el modelo ya ha dado todos los teléfonos que tocan (pese a que se le pide
 * que no lo haga), se respeta su redacción para no duplicar. Si falta alguno
 * —el caso habitual— se añade el bloque de contención completo.
 *
 * @param {string} textoModelo
 * @param {Object} riesgo
 * @returns {string}
 */
export function composeRiskReply(textoModelo, riesgo) {
  const requeridos = recursosRequeridos(riesgo);
  if (requeridos.length === 0) return textoModelo;

  const texto = String(textoModelo || '').trim();
  const yaEstanTodos = requeridos.every(n => texto.includes(n));
  if (yaEstanTodos) return texto;

  // Con texto del modelo va solo el bloque de recursos: el acompañamiento ya
  // lo ha escrito él, y repetirlo suena a dos personas hablando a la vez.
  // Sin texto, va el mensaje completo, que sí lleva su frase de entrada.
  if (!texto) return buildContainmentMessage(riesgo) || '';
  const recursos = buildResourceBlock(riesgo);
  return recursos ? `${texto}\n\n${recursos}` : texto;
}

/** Traducción del nivel a la severidad que ya usa la colección `risk_events`. */
const SEVERIDAD = {
  [RiskLevel.MALESTAR]: 'low',
  [RiskLevel.IDEACION]: 'high',
  [RiskLevel.INMINENTE]: 'critical'
};

/**
 * Registro de la señal para la colección `risk_events`.
 *
 * Usa los nombres de campo que ya existen ahí (`risk_type`, `severity`,
 * `evidence_quote`, `status`) en lugar de crear un esquema paralelo, y añade
 * los del protocolo. La evidencia va literal: sin dramatizar y sin minimizar.
 */
export function buildRiskRecord(riesgo, { patientId, textoOriginal, conversationId = null } = {}) {
  if (!riesgo || riesgo.nivel === RiskLevel.NINGUNO) return null;
  return {
    patient_id: patientId,
    conversation_id: conversationId,
    document_id: null,
    risk_type: riesgo.categoria,
    severity: SEVERIDAD[riesgo.nivel],
    nivel: riesgo.nivel,
    evidence_quote: limpiar(textoOriginal).slice(0, 500),
    disparador: riesgo.disparador,
    recommended_action: riesgo.escalado.bloqueante
      ? 'Contacto inmediato con el paciente'
      : `Revisar en ${riesgo.escalado.plazo}`,
    urgencia: riesgo.escalado.urgencia,
    requiere_atencion_antes_de: riesgo.escalado.plazo,
    status: 'pending',
    notificado: false,
    authority_level: 3,
    detected_by: 'protocolo_automatico',
    created_at: new Date().toISOString()
  };
}
