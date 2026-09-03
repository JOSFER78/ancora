/**
 * @file anamnesisBank.generated.js
 * @description ARCHIVO GENERADO — no editar a mano.
 *
 * Compilado desde `docs/clinico/GUION_ANAMNESIS.md` (sección 2) con
 * `npm run guion`. Para cambiar una pregunta se edita el guion y se
 * recompila: cualquier cambio hecho aquí se pierde en la siguiente
 * regeneración.
 *
 * Contenido: 26 subbloques · 106 preguntas · 7 dimensiones.
 */

/**
 * @typedef {Object} Pregunta
 * @property {string} texto            Pregunta abierta, tal cual se le hace al paciente.
 * @property {string[]} seguimiento    Repreguntas, válidas SOLO tras una respuesta.
 *
 * @typedef {Object} Subbloque
 * @property {string} id               "1.2"
 * @property {string} dimension        Dimensión del árbol vital ("apertura" en el bloque 0).
 * @property {string} titulo
 * @property {string} eje              Eje de las 5 P.
 * @property {string} datos            Qué se busca recoger aquí.
 * @property {Pregunta[]} preguntas
 */

/** @type {Subbloque[]} */
export const BANCO_PREGUNTAS = [
  {
    "id": "0.1",
    "dimension": "apertura",
    "titulo": "Motivo de consulta y expectativas",
    "eje": "problema",
    "datos": "qué trae al paciente ahora, en sus propias palabras; desde cuándo; qué espera de este espacio; cómo describe él o ella el problema, sin traducirlo a jerga.",
    "preguntas": [
      {
        "texto": "¿Qué te trae por aquí ahora mismo? Cuéntamelo con tus palabras, sin necesidad de resumirlo.",
        "seguimiento": [
          "¿Desde cuándo dirías que esto forma parte de tu día a día?",
          "Cuando dices [repetir su expresión textual], ¿qué es lo que más pesa de eso?"
        ]
      },
      {
        "texto": "Si esto empezara a ir mejor, ¿qué sería lo primero que notarías?",
        "seguimiento": [
          "¿Qué tendría que cambiar para que notaras esa diferencia?",
          "¿Alguien más se daría cuenta, o sería algo que solo notarías tú?"
        ]
      },
      {
        "texto": "¿Qué esperas de este espacio, de hablar conmigo entre las sesiones con tu psicólogo/a?",
        "seguimiento": [
          "¿Hay algo que te dé un poco de duda o de reparo sobre esto?",
          "¿Qué necesitarías sentir para confiar en contarme las cosas con tranquilidad?"
        ]
      },
      {
        "texto": "¿Cómo dirías que llegaste hasta aquí? ¿Fue algo que decidiste tú, o alguien te lo sugirió?",
        "seguimiento": [
          "¿Cómo te sentiste al dar ese paso?",
          "¿Qué fue lo que finalmente te animó a hacerlo?"
        ]
      }
    ]
  },
  {
    "id": "0.2",
    "dimension": "apertura",
    "titulo": "Impacto en la vida cotidiana",
    "eje": "problema",
    "datos": "en qué áreas concretas nota el efecto (sueño, trabajo, relaciones, cuerpo); intensidad percibida; qué ha cambiado respecto a \"como era antes\".",
    "preguntas": [
      {
        "texto": "¿En qué partes de tu día a día notas más esto que me cuentas?",
        "seguimiento": [
          "De esas partes, ¿cuál te preocupa más ahora mismo?",
          "¿Hay algún momento del día en que lo notas menos?"
        ]
      },
      {
        "texto": "¿Qué es distinto ahora respecto a cómo eras o cómo vivías antes?",
        "seguimiento": [
          "¿Desde cuándo dirías que empezó ese cambio?",
          "¿Hay algo de \"antes\" que echas de menos?"
        ]
      },
      {
        "texto": "¿Cómo dirías que esto afecta a las personas que tienes alrededor?",
        "seguimiento": [
          "¿Alguna de ellas te ha dicho algo al respecto?",
          "¿Cómo te sienta que lo noten o lo comenten?"
        ]
      },
      {
        "texto": "Si tuvieras que ponerle una intensidad del 0 al 10 a cómo te sientes últimamente, ¿qué número dirías?",
        "seguimiento": [
          "¿Qué hace que hoy sea ese número y no otro?",
          "¿Ha habido días con un número muy distinto? ¿Qué pasaba esos días?"
        ]
      }
    ]
  },
  {
    "id": "1.1",
    "dimension": "salud_fisica",
    "titulo": "Antecedentes médicos y familiares",
    "eje": "predisponentes",
    "datos": "enfermedades relevantes propias y familiares, hospitalizaciones significativas, medicación actual (nombre, dosis, quién la prescribe), antecedentes de salud mental en la familia (descrito por conducta, no por etiqueta).",
    "preguntas": [
      {
        "texto": "¿Hay algo de tu salud física que sea importante que conozca?",
        "seguimiento": [
          "¿Desde cuándo lo llevas o lo tienes diagnosticado?",
          "¿Cómo te ha ido llevándolo en el día a día?"
        ]
      },
      {
        "texto": "¿Tomas alguna medicación ahora mismo?",
        "seguimiento": [
          "¿Quién te la pautó y desde cuándo la tomas?",
          "¿Notas que te está ayudando, o tienes dudas sobre ella?"
        ]
      },
      {
        "texto": "En tu familia, ¿ha habido enfermedades importantes que recuerdes?",
        "seguimiento": [
          "¿Cómo se vivió eso en casa?",
          "¿Sientes que eso te afecta o te preocupa a ti de alguna forma?"
        ]
      },
      {
        "texto": "¿Has tenido alguna hospitalización o intervención que te marcara?",
        "seguimiento": [
          "¿Qué recuerdas de esa etapa?",
          "¿Cómo te sentiste acompañado/a entonces?"
        ]
      }
    ]
  },
  {
    "id": "1.2",
    "dimension": "salud_fisica",
    "titulo": "Sueño, alimentación y activación corporal",
    "eje": "mantenedores",
    "datos": "patrón de sueño (horas, calidad, despertares), apetito/alimentación, nivel de energía, actividad física, consumo de cafeína/estimulantes.",
    "preguntas": [
      {
        "texto": "¿Cómo estás durmiendo últimamente?",
        "seguimiento": [
          "¿Cuesta conciliar el sueño, o es más bien mantenerlo?",
          "¿Qué sueles hacer cuando no consigues dormir?"
        ]
      },
      {
        "texto": "¿Cómo describirías tu apetito estos días?",
        "seguimiento": [
          "¿Has notado cambios de peso o de ganas de comer?",
          "¿Comes más acompañado/a o más solo/a normalmente?"
        ]
      },
      {
        "texto": "¿Cómo tienes el cuerpo, en general? ¿Con energía, cansado, tenso?",
        "seguimiento": [
          "¿En qué parte del cuerpo lo notas más?",
          "¿Hay algo que te alivie esa sensación, aunque sea un rato?"
        ]
      },
      {
        "texto": "¿Haces algo de movimiento o ejercicio en tu semana?",
        "seguimiento": [
          "¿Cómo te sientes cuando lo haces, comparado con cuando no?",
          "¿Qué te frena para hacerlo cuando no te apetece?"
        ]
      },
      {
        "texto": "¿Cuánto café, té u otras bebidas con cafeína tomas al día, más o menos?",
        "seguimiento": [
          "¿Notas que te afecta al sueño o a los nervios?",
          "¿Ha cambiado esa cantidad últimamente?"
        ]
      }
    ]
  },
  {
    "id": "1.3",
    "dimension": "salud_fisica",
    "titulo": "Cambios y síntomas recientes",
    "eje": "precipitantes",
    "datos": "síntomas somáticos nuevos, cambios de peso/energía en semanas recientes, visitas médicas recientes, relación temporal con el motivo de consulta.",
    "preguntas": [
      {
        "texto": "¿Ha cambiado algo en tu cuerpo o en tu salud en los últimos meses?",
        "seguimiento": [
          "¿Cuándo empezaste a notarlo, más o menos?",
          "¿Lo relacionas con algo que estuviera pasando en esas fechas?"
        ]
      },
      {
        "texto": "¿Has ido al médico por algo relacionado con esto recientemente?",
        "seguimiento": [
          "¿Qué te dijeron o qué te propusieron?",
          "¿Cómo saliste de esa consulta, cómo te quedaste?"
        ]
      },
      {
        "texto": "¿Notas molestias físicas que antes no tenías: dolores de cabeza, de estómago, tensión muscular?",
        "seguimiento": [
          "¿En qué momentos aparecen más?",
          "¿Qué haces cuando aparecen?"
        ]
      },
      {
        "texto": "¿Dirías que tu cuerpo \"avisa\" antes de que tú notes que algo va mal por dentro?",
        "seguimiento": [
          "¿Cómo es esa señal, cuando aparece?",
          "¿La reconoces fácilmente o la notas siempre a posteriori?"
        ]
      }
    ]
  },
  {
    "id": "1.4",
    "dimension": "salud_fisica",
    "titulo": "Recursos de autocuidado físico",
    "eje": "protectores",
    "datos": "hábitos que sí funcionan, actividades que regulan al paciente físicamente, personas o rutinas de apoyo en salud.",
    "preguntas": [
      {
        "texto": "¿Qué cosas notas que te sientan bien al cuerpo, aunque sean pequeñas?",
        "seguimiento": [
          "¿Con qué frecuencia consigues hacerlas?",
          "¿Qué te ayudaría a hacerlas más a menudo?"
        ]
      },
      {
        "texto": "¿Tienes alguna rutina que te ayude a cuidarte físicamente?",
        "seguimiento": [
          "¿Desde cuándo la tienes?",
          "¿Qué pasa en las temporadas en que la pierdes?"
        ]
      },
      {
        "texto": "Cuando te encuentras mal físicamente, ¿qué te suele ayudar a recuperarte?",
        "seguimiento": [
          "¿Lo haces solo/a o con ayuda de alguien?",
          "¿Qué tan fácil te resulta pedir esa ayuda?"
        ]
      },
      {
        "texto": "¿Hay algo de tu cuerpo o de tu salud de lo que te sientas orgulloso/a o agradecido/a?",
        "seguimiento": [
          "¿Qué hiciste tú para que eso fuera así?",
          "¿Cómo lo mantienes hoy en día?"
        ]
      }
    ]
  },
  {
    "id": "2.1",
    "dimension": "salud_emocional",
    "titulo": "Historia emocional y aprendizajes tempranos",
    "eje": "predisponentes",
    "datos": "cómo se gestionaban las emociones en su entorno de crianza, qué aprendió sobre expresar/ocultar emociones, primeros recuerdos de malestar significativo, patrones repetidos a lo largo de la vida.",
    "preguntas": [
      {
        "texto": "Cuando eras más joven, ¿cómo se manejaban las emociones en tu casa?",
        "seguimiento": [
          "¿Qué se hacía cuando alguien estaba triste o enfadado?",
          "¿Qué aprendiste tú de eso sobre mostrar lo que sentías?"
        ]
      },
      {
        "texto": "¿Recuerdas la primera vez que sentiste algo parecido a lo que sientes ahora?",
        "seguimiento": [
          "¿Qué edad tenías, más o menos?",
          "¿Cómo lo llevaste entonces, sin ayuda o con apoyo de alguien?"
        ]
      },
      {
        "texto": "¿Hay alguna emoción que te cueste especialmente reconocer o nombrar?",
        "seguimiento": [
          "¿Desde cuándo dirías que te pasa eso?",
          "¿Qué pasa cuando esa emoción aparece igualmente, aunque no la nombres?"
        ]
      },
      {
        "texto": "¿Dirías que este tipo de malestar es algo nuevo para ti, o es algo que ha ido y venido a lo largo de tu vida?",
        "seguimiento": [
          "¿En qué otras etapas lo recuerdas presente?",
          "¿Qué fue distinto en las veces que remitió?"
        ]
      }
    ]
  },
  {
    "id": "2.2",
    "dimension": "salud_emocional",
    "titulo": "Disparadores emocionales recientes",
    "eje": "precipitantes",
    "datos": "eventos concretos recientes asociados a picos emocionales, situaciones que anteceden al malestar, relación temporal problema-evento.",
    "preguntas": [
      {
        "texto": "¿Qué estaba pasando en tu vida cuando esto empezó a notarse más?",
        "seguimiento": [
          "¿Hubo algún día o momento concreto que recuerdes especialmente?",
          "¿Cómo reaccionaste tú en ese momento?"
        ]
      },
      {
        "texto": "En la última semana, ¿hubo algún momento en que la emoción se disparara con más fuerza?",
        "seguimiento": [
          "¿Qué pasó justo antes?",
          "¿Cómo se te pasó, si se te pasó?"
        ]
      },
      {
        "texto": "¿Hay situaciones concretas que notas que siempre te afectan de esta manera?",
        "seguimiento": [
          "¿Podrías darme un ejemplo reciente?",
          "¿Qué sueles hacer justo después de que pase?"
        ]
      },
      {
        "texto": "¿Ha habido algún cambio importante en tu vida en los últimos meses que crees que tiene que ver con esto?",
        "seguimiento": [
          "¿Cómo lo viviste cuando ocurrió?",
          "¿Sigue afectándote igual ahora que al principio?"
        ]
      }
    ]
  },
  {
    "id": "2.3",
    "dimension": "salud_emocional",
    "titulo": "Estrategias actuales de manejo",
    "eje": "mantenedores",
    "datos": "qué hace el paciente cuando aparece el malestar (evitación, rumiación, distracción, consumo, aislamiento), con qué frecuencia, si percibe que le ayuda o le mantiene atrapado.",
    "preguntas": [
      {
        "texto": "Cuando te sientes así, ¿qué es lo primero que sueles hacer?",
        "seguimiento": [
          "¿Te ayuda a corto plazo? ¿Y a la larga?",
          "¿Qué pasa si no puedes hacer eso en ese momento?"
        ]
      },
      {
        "texto": "¿Hay pensamientos que notas que se te repiten una y otra vez estos días?",
        "seguimiento": [
          "¿Qué sueles hacer cuando aparecen?",
          "¿Consigues pararlos, o siguen su curso?"
        ]
      },
      {
        "texto": "¿Dirías que hay cosas que evitas por cómo te sientes últimamente?",
        "seguimiento": [
          "¿Desde cuándo evitas eso?",
          "¿Qué crees que pasaría si no lo evitaras?"
        ]
      },
      {
        "texto": "¿Cómo sueles pasar el tiempo cuando estás a solas con este malestar?",
        "seguimiento": [
          "¿Buscas compañía, o prefieres estar solo/a en esos momentos?",
          "¿Cómo te sientes después de esos ratos?"
        ]
      },
      {
        "texto": "¿Hay algo que hagas para \"no pensar\" en esto, aunque sea un rato?",
        "seguimiento": [
          "¿Cómo de seguido recurres a eso?",
          "¿Cómo te sientes justo después de hacerlo?"
        ]
      }
    ]
  },
  {
    "id": "2.4",
    "dimension": "salud_emocional",
    "titulo": "Recursos internos y momentos de alivio",
    "eje": "protectores",
    "datos": "qué le ha funcionado antes, fortalezas percibidas, momentos recientes de bienestar aunque breves, capacidad de autorregulación identificada.",
    "preguntas": [
      {
        "texto": "¿Hay algún momento reciente, aunque sea corto, en que te hayas sentido un poco mejor?",
        "seguimiento": [
          "¿Qué estaba pasando en ese momento?",
          "¿Qué crees que lo hizo posible?"
        ]
      },
      {
        "texto": "¿Qué has hecho otras veces en tu vida para salir adelante de algo difícil?",
        "seguimiento": [
          "¿Qué de eso podrías usar ahora?",
          "¿Qué te ha frenado para usarlo esta vez?"
        ]
      },
      {
        "texto": "Si un amigo estuviera pasando por lo mismo que tú, ¿qué le dirías?",
        "seguimiento": [
          "¿Por qué crees que te cuesta más decírtelo a ti mismo/a?",
          "¿Qué necesitarías para poder tratarte así?"
        ]
      },
      {
        "texto": "¿Hay alguna cualidad tuya de la que te sientas orgulloso/a, aunque ahora mismo cueste verla?",
        "seguimiento": [
          "¿Quién más la reconoce en ti?",
          "¿Cuándo la has visto en acción últimamente?"
        ]
      }
    ]
  },
  {
    "id": "3.1",
    "dimension": "familia_y_vinculos",
    "titulo": "Configuración familiar y vínculos de origen",
    "eje": "predisponentes",
    "datos": "estructura familiar de origen, calidad del vínculo con figuras de crianza, rol ocupado en la familia, eventos familiares significativos tempranos.",
    "preguntas": [
      {
        "texto": "Cuéntame un poco de tu familia: ¿con quién creciste?",
        "seguimiento": [
          "¿Cómo describirías tu relación con cada uno en esa época?",
          "¿Cuál dirías que era tu papel dentro de la familia?"
        ]
      },
      {
        "texto": "¿Cómo era el ambiente en casa, en general, cuando eras pequeño/a?",
        "seguimiento": [
          "¿Qué momentos recuerdas con más cariño?",
          "¿Y cuáles con más dificultad?"
        ]
      },
      {
        "texto": "¿Hay alguna persona de tu familia con la que sientas que tienes o tuviste un vínculo especialmente importante?",
        "seguimiento": [
          "¿Qué hace o hacía especial esa relación?",
          "¿Cómo está esa relación hoy?"
        ]
      },
      {
        "texto": "¿Hubo algún cambio importante en tu familia mientras crecías (mudanza, separación, pérdida, nacimiento de hermanos)?",
        "seguimiento": [
          "¿Cómo lo viviste tú en ese momento?",
          "¿Qué recuerdas que te ayudó a pasarlo?"
        ]
      }
    ]
  },
  {
    "id": "3.2",
    "dimension": "familia_y_vinculos",
    "titulo": "Rupturas o conflictos recientes",
    "eje": "precipitantes",
    "datos": "pérdidas, rupturas o conflictos relacionales recientes, su relación temporal con el inicio o agravamiento del problema.",
    "preguntas": [
      {
        "texto": "¿Ha habido algún conflicto o distanciamiento importante con alguien cercano últimamente?",
        "seguimiento": [
          "¿Qué pasó, a grandes rasgos?",
          "¿Cómo ha quedado esa relación ahora mismo?"
        ]
      },
      {
        "texto": "¿Alguna pérdida importante en tu vida en el último tiempo: una relación, una amistad, alguien que ya no está?",
        "seguimiento": [
          "¿Cómo estás llevando esa ausencia?",
          "¿Hay algo que te ayude a sobrellevarla?"
        ]
      },
      {
        "texto": "¿Cómo han estado las cosas en casa o con tu pareja en los últimos meses?",
        "seguimiento": [
          "¿Ha cambiado algo respecto a antes?",
          "¿Cómo te sientes cuando piensas en ello?"
        ]
      },
      {
        "texto": "¿Hay alguna conversación pendiente con alguien que te esté pesando?",
        "seguimiento": [
          "¿Qué te frena para tenerla?",
          "¿Qué pasaría si la tuvieras?"
        ]
      }
    ]
  },
  {
    "id": "3.3",
    "dimension": "familia_y_vinculos",
    "titulo": "Vínculos actuales y su dinámica",
    "eje": "mantenedores",
    "datos": "relaciones activas (pareja, amistades, familia), patrones relacionales que se repiten, dinámicas que sostienen el malestar (dependencia, evitación, conflicto crónico).",
    "preguntas": [
      {
        "texto": "¿Cómo son tus relaciones más cercanas ahora mismo?",
        "seguimiento": [
          "¿Con cuál te sientes más cómodo/a hablando de cosas difíciles?",
          "¿Hay alguna que te cueste especialmente?"
        ]
      },
      {
        "texto": "¿Notas que se repite algún patrón en cómo te llevas con la gente cercana?",
        "seguimiento": [
          "¿Desde cuándo dirías que lo notas?",
          "¿Cómo te sientes cuando ese patrón aparece?"
        ]
      },
      {
        "texto": "¿Cómo describirías tu relación de pareja ahora mismo, si la tienes?",
        "seguimiento": [
          "¿Qué es lo que más valoras de ella?",
          "¿Y qué es lo que más te cuesta?"
        ]
      },
      {
        "texto": "Cuando algo te preocupa, ¿sueles compartirlo con alguien o prefieres guardártelo?",
        "seguimiento": [
          "¿Qué hace que decidas una cosa u otra según el caso?",
          "¿Cómo te sientes después de compartirlo, cuando lo haces?"
        ]
      }
    ]
  },
  {
    "id": "3.4",
    "dimension": "familia_y_vinculos",
    "titulo": "Red de apoyo y personas de confianza",
    "eje": "protectores",
    "datos": "figuras de apoyo actuales disponibles, calidad percibida del apoyo, capacidad de pedir ayuda, vínculos que funcionan como ancla.",
    "preguntas": [
      {
        "texto": "¿Hay alguien a quien puedas llamar si un día lo estás pasando mal?",
        "seguimiento": [
          "¿Cuándo fue la última vez que lo hiciste?",
          "¿Cómo te sentiste después?"
        ]
      },
      {
        "texto": "¿Quién dirías que te conoce mejor tal y como eres ahora?",
        "seguimiento": [
          "¿Qué es lo que esa persona hace que te ayuda?",
          "¿Sabe esa persona por lo que estás pasando?"
        ]
      },
      {
        "texto": "¿Hay algún grupo, comunidad o espacio donde te sientas acompañado/a?",
        "seguimiento": [
          "¿Desde cuándo formas parte de eso?",
          "¿Qué te aporta estar ahí?"
        ]
      },
      {
        "texto": "Si pudieras pedir un tipo de apoyo concreto a alguien cercano ahora mismo, ¿cuál pedirías?",
        "seguimiento": [
          "¿Qué te impide pedirlo directamente?",
          "¿Qué crees que pasaría si lo pidieras?"
        ]
      }
    ]
  },
  {
    "id": "4.1",
    "dimension": "trabajo_y_proposito",
    "titulo": "Trayectoria formativa y laboral",
    "eje": "predisponentes",
    "datos": "recorrido educativo y laboral, elecciones significativas, relación histórica con el logro/rendimiento, autoexigencia de origen.",
    "preguntas": [
      {
        "texto": "Cuéntame un poco tu trayectoria: ¿cómo llegaste a lo que haces ahora?",
        "seguimiento": [
          "¿Qué momentos de ese camino recuerdas con más satisfacción?",
          "¿Hubo alguno especialmente difícil?"
        ]
      },
      {
        "texto": "¿Cómo era tu relación con los estudios o el rendimiento cuando eras más joven?",
        "seguimiento": [
          "¿Quién esperaba cosas de ti en esa época?",
          "¿Cómo llevabas esa expectativa?"
        ]
      },
      {
        "texto": "¿Ha habido algún trabajo o etapa laboral que te marcara especialmente, para bien o para mal?",
        "seguimiento": [
          "¿Qué pasó ahí?",
          "¿Qué aprendiste de esa experiencia?"
        ]
      },
      {
        "texto": "¿Qué esperabas de tu vida laboral cuando eras más joven, comparado con cómo es ahora?",
        "seguimiento": [
          "¿Qué ha cambiado de esa expectativa?",
          "¿Cómo te sienta esa diferencia?"
        ]
      }
    ]
  },
  {
    "id": "4.2",
    "dimension": "trabajo_y_proposito",
    "titulo": "Cambios recientes (despido, cambio de rol, jubilación, etc.)",
    "eje": "precipitantes",
    "datos": "eventos laborales/formativos recientes con carga emocional, cambios de estatus o rol, su relación temporal con el problema.",
    "preguntas": [
      {
        "texto": "¿Ha habido algún cambio en tu trabajo o tus estudios en los últimos meses?",
        "seguimiento": [
          "¿Cómo lo viviste cuando pasó?",
          "¿Cómo lo llevas ahora, con algo más de perspectiva?"
        ]
      },
      {
        "texto": "¿Cómo describirías tu situación laboral o académica actual comparada con hace un año?",
        "seguimiento": [
          "¿Qué es lo que más ha cambiado?",
          "¿Ese cambio fue elegido por ti o vino de fuera?"
        ]
      },
      {
        "texto": "¿Has vivido alguna situación de tensión importante en el trabajo o los estudios últimamente (un conflicto, una evaluación, un despido)?",
        "seguimiento": [
          "¿Qué pasó exactamente?",
          "¿Cómo te afectó después de que ocurriera?"
        ]
      },
      {
        "texto": "¿Hay algo relacionado con tu futuro laboral o formativo que te preocupe especialmente ahora?",
        "seguimiento": [
          "¿Desde cuándo te preocupa eso?",
          "¿Qué es lo peor que imaginas que podría pasar?"
        ]
      }
    ]
  },
  {
    "id": "4.3",
    "dimension": "trabajo_y_proposito",
    "titulo": "Situación laboral/académica actual y carga",
    "eje": "mantenedores",
    "datos": "carga percibida, equilibrio vida-trabajo, patrones de sobreesfuerzo o desconexión, satisfacción actual.",
    "preguntas": [
      {
        "texto": "¿Cómo describirías tu día a día en el trabajo o los estudios ahora mismo?",
        "seguimiento": [
          "¿Qué parte del día te resulta más pesada?",
          "¿Hay algo que te compense de esa carga?"
        ]
      },
      {
        "texto": "¿Sientes que tienes tiempo para ti fuera de las obligaciones?",
        "seguimiento": [
          "¿A qué dedicas ese tiempo, cuando lo tienes?",
          "¿Qué pasa las semanas en que no lo tienes?"
        ]
      },
      {
        "texto": "¿Cómo llevas la relación con tus compañeros, jefes o profesores?",
        "seguimiento": [
          "¿Hay alguna dinámica ahí que te resulte difícil?",
          "¿Cómo sueles manejarla?"
        ]
      },
      {
        "texto": "¿Dirías que le exiges mucho a tu rendimiento, sea en el trabajo o en los estudios?",
        "seguimiento": [
          "¿De dónde crees que viene esa exigencia?",
          "¿Qué pasa cuando sientes que no llegas a lo que te pides?"
        ]
      }
    ]
  },
  {
    "id": "4.4",
    "dimension": "trabajo_y_proposito",
    "titulo": "Sentido, motivación y logros",
    "eje": "protectores",
    "datos": "fuentes de motivación actuales, logros reconocidos, actividades con sentido propio (remuneradas o no).",
    "preguntas": [
      {
        "texto": "¿Qué parte de lo que haces (trabajo, estudios, o cualquier otra actividad) te da más sentido ahora mismo?",
        "seguimiento": [
          "¿Qué te hace sentir eso en concreto?",
          "¿Con qué frecuencia consigues dedicarte a ello?"
        ]
      },
      {
        "texto": "¿De qué logro tuyo, grande o pequeño, te sientes especialmente orgulloso/a?",
        "seguimiento": [
          "¿Qué hiciste tú para conseguirlo?",
          "¿Cómo lo celebraste, si lo celebraste?"
        ]
      },
      {
        "texto": "Si pudieras dedicar más tiempo a algo que te llena, ¿qué sería?",
        "seguimiento": [
          "¿Qué te frena para dedicarle más tiempo ahora?",
          "¿Qué pequeño paso podrías dar hacia eso?"
        ]
      },
      {
        "texto": "¿Hay algo en tu trabajo, estudios o actividades que sientas que se te da especialmente bien?",
        "seguimiento": [
          "¿Quién más lo reconoce en ti?",
          "¿Cómo te sientes cuando lo haces?"
        ]
      }
    ]
  },
  {
    "id": "5.1",
    "dimension": "economia_y_seguridad",
    "titulo": "Contexto económico de origen",
    "eje": "predisponentes",
    "datos": "situación económica familiar de origen, aprendizajes sobre el dinero, eventos económicos significativos en la infancia/juventud.",
    "preguntas": [
      {
        "texto": "¿Cómo era la situación económica en tu casa cuando eras pequeño/a?",
        "seguimiento": [
          "¿Qué recuerdas que se hablara del dinero en casa?",
          "¿Cómo crees que eso te marcó a ti?"
        ]
      },
      {
        "texto": "¿Hubo algún momento económico difícil en tu familia mientras crecías?",
        "seguimiento": [
          "¿Cómo se vivió eso en el día a día?",
          "¿Qué papel tuviste tú, si tuviste alguno, en esa situación?"
        ]
      },
      {
        "texto": "¿Qué aprendiste de niño/a sobre ahorrar, gastar o pedir cosas?",
        "seguimiento": [
          "¿Quién te enseñó eso, con el ejemplo o con palabras?",
          "¿Sigues funcionando así hoy, o ha cambiado?"
        ]
      },
      {
        "texto": "¿Dirías que el dinero ha sido motivo de tensión en tu familia?",
        "seguimiento": [
          "¿Cómo se manejaban esas tensiones?",
          "¿Cómo te afectaba a ti cuando ocurrían?"
        ]
      }
    ]
  },
  {
    "id": "5.2",
    "dimension": "economia_y_seguridad",
    "titulo": "Eventos económicos recientes (deudas, pérdidas, cambios)",
    "eje": "precipitantes",
    "datos": "eventos económicos recientes con impacto emocional, cambios bruscos de situación, su relación temporal con el problema.",
    "preguntas": [
      {
        "texto": "¿Ha habido algún cambio importante en tu situación económica últimamente?",
        "seguimiento": [
          "¿Qué lo provocó?",
          "¿Cómo lo estás llevando desde que pasó?"
        ]
      },
      {
        "texto": "¿Hay alguna deuda, gasto imprevisto o pérdida económica que te esté preocupando ahora?",
        "seguimiento": [
          "¿Desde cuándo te preocupa?",
          "¿Qué es lo que más te inquieta de esa situación?"
        ]
      },
      {
        "texto": "¿Tu situación laboral o económica ha cambiado en el último año?",
        "seguimiento": [
          "¿Para mejor o para peor, dirías?",
          "¿Cómo ha afectado eso a tu día a día?"
        ]
      },
      {
        "texto": "¿Hay alguna decisión económica reciente de la que te arrepientas o que te pese?",
        "seguimiento": [
          "¿Qué te llevó a tomarla?",
          "¿Cómo la llevas ahora, con perspectiva?"
        ]
      }
    ]
  },
  {
    "id": "5.3",
    "dimension": "economia_y_seguridad",
    "titulo": "Situación económica actual y manejo",
    "eje": "mantenedores",
    "datos": "percepción de estabilidad/inestabilidad actual, estrategias de manejo del dinero, nivel de preocupación cotidiana.",
    "preguntas": [
      {
        "texto": "¿Cómo dirías que llevas el tema económico en tu día a día ahora mismo?",
        "seguimiento": [
          "¿Con qué frecuencia te preocupa?",
          "¿En qué momentos del día o de la semana lo notas más?"
        ]
      },
      {
        "texto": "¿Sientes que tienes control sobre tus gastos e ingresos?",
        "seguimiento": [
          "¿Qué parte te resulta más difícil de controlar?",
          "¿Qué haces cuando sientes que se te va de las manos?"
        ]
      },
      {
        "texto": "¿Hablas con alguien sobre el dinero cuando te preocupa?",
        "seguimiento": [
          "¿Con quién, y cómo es esa conversación?",
          "¿Qué pasa cuando no lo hablas con nadie?"
        ]
      },
      {
        "texto": "¿Cómo afecta esta situación económica a otras partes de tu vida, como el ocio o las relaciones?",
        "seguimiento": [
          "¿Puedes darme un ejemplo reciente?",
          "¿Cómo te sienta tener que hacer esos ajustes?"
        ]
      }
    ]
  },
  {
    "id": "5.4",
    "dimension": "economia_y_seguridad",
    "titulo": "Seguridad material y red de contingencia",
    "eje": "protectores",
    "datos": "colchón económico o de apoyo disponible, sensación de seguridad material, recursos ante imprevistos.",
    "preguntas": [
      {
        "texto": "Si tuvieras un imprevisto económico importante, ¿a qué o a quién recurrirías?",
        "seguimiento": [
          "¿Cómo de seguro/a te sientes con esa opción?",
          "¿Has tenido que usarla alguna vez?"
        ]
      },
      {
        "texto": "¿Qué es lo que te da más tranquilidad respecto a tu situación económica ahora mismo?",
        "seguimiento": [
          "¿Desde cuándo cuentas con eso?",
          "¿Qué harías para reforzarlo?"
        ]
      },
      {
        "texto": "¿Hay alguna meta económica que te ilusione, aunque sea a largo plazo?",
        "seguimiento": [
          "¿Qué has hecho ya para acercarte a ella?",
          "¿Qué te ayudaría a seguir dando pasos?"
        ]
      },
      {
        "texto": "¿Sientes que, pase lo que pase, tienes una base mínima cubierta?",
        "seguimiento": [
          "¿En qué te basas para sentir eso (o para no sentirlo)?",
          "¿Qué cambiaría esa sensación de seguridad?"
        ]
      }
    ]
  },
  {
    "id": "6.1",
    "dimension": "identidad_y_valores",
    "titulo": "Autopercepción e historia de identidad",
    "eje": "predisponentes",
    "datos": "cómo se ha visto a sí mismo a lo largo de la vida, momentos de construcción de identidad, influencias significativas en cómo se define.",
    "preguntas": [
      {
        "texto": "¿Cómo te describirías a ti mismo/a, si tuvieras que hacerlo con tus propias palabras?",
        "seguimiento": [
          "¿Desde cuándo te ves así?",
          "¿Hay algo de esa descripción que haya cambiado en los últimos años?"
        ]
      },
      {
        "texto": "¿Quién o qué ha influido más en cómo te ves a ti mismo/a?",
        "seguimiento": [
          "¿Qué te transmitió esa persona o esa experiencia?",
          "¿Sigue teniendo esa influencia hoy?"
        ]
      },
      {
        "texto": "¿Hubo alguna etapa de tu vida en la que sintieras que estabas descubriendo quién eras?",
        "seguimiento": [
          "¿Qué recuerdas de esa etapa?",
          "¿Qué queda de aquello en quién eres ahora?"
        ]
      },
      {
        "texto": "¿Hay algo de ti que sientas que los demás no terminan de ver o de entender?",
        "seguimiento": [
          "¿Por qué crees que pasa eso?",
          "¿Te gustaría que lo vieran? ¿Por qué sí o por qué no?"
        ]
      }
    ]
  },
  {
    "id": "6.2",
    "dimension": "identidad_y_valores",
    "titulo": "Momentos de quiebre o cuestionamiento identitario",
    "eje": "precipitantes",
    "datos": "eventos recientes que hayan removido la autopercepción, crisis de sentido, cambios de rol o etapa vital.",
    "preguntas": [
      {
        "texto": "¿Ha habido algo últimamente que te haya hecho cuestionarte quién eres o qué quieres?",
        "seguimiento": [
          "¿Qué lo desencadenó?",
          "¿Cómo estás digiriendo esa pregunta?"
        ]
      },
      {
        "texto": "¿Sientes que has cambiado como persona en el último año?",
        "seguimiento": [
          "¿En qué lo notas más?",
          "¿Cómo te sienta ese cambio, bien o mal?"
        ]
      },
      {
        "texto": "¿Hay alguna etapa o rol (por ejemplo, ser padre/madre, cambiar de trabajo, cumplir años) que te haya movido el suelo últimamente?",
        "seguimiento": [
          "¿Qué es lo que más te ha removido de eso?",
          "¿Qué preguntas te ha dejado?"
        ]
      },
      {
        "texto": "¿Ha habido algún momento reciente en que no te reconocieras a ti mismo/a en cómo actuaste o cómo te sentiste?",
        "seguimiento": [
          "¿Qué pasó exactamente?",
          "¿Cómo lo interpretas ahora, con algo de distancia?"
        ]
      }
    ]
  },
  {
    "id": "6.3",
    "dimension": "identidad_y_valores",
    "titulo": "Diálogo interno y autoconcepto actual",
    "eje": "mantenedores",
    "datos": "contenido y tono del diálogo interno, autocrítica, comparación con otros, patrones de autoexigencia que sostienen el malestar.",
    "preguntas": [
      {
        "texto": "¿Cómo te hablas a ti mismo/a cuando algo no sale como esperabas?",
        "seguimiento": [
          "¿Reconoces esa voz de algún sitio, de alguien?",
          "¿Qué pasaría si te hablaras distinto?"
        ]
      },
      {
        "texto": "¿Sueles compararte con otras personas?",
        "seguimiento": [
          "¿En qué aspectos te comparas más?",
          "¿Cómo te sientes después de hacerlo?"
        ]
      },
      {
        "texto": "¿Qué es lo que más te cuesta aceptar de ti mismo/a ahora mismo?",
        "seguimiento": [
          "¿Desde cuándo te cuesta eso en concreto?",
          "¿Qué pasaría si lo aceptaras, aunque fuera un poco?"
        ]
      },
      {
        "texto": "¿Hay algo que hagas para intentar \"ser mejor\" que sientes que nunca es suficiente?",
        "seguimiento": [
          "¿Qué se supone que pasaría si por fin fuera suficiente?",
          "¿Quién decidiría que ya lo es?"
        ]
      }
    ]
  },
  {
    "id": "6.4",
    "dimension": "identidad_y_valores",
    "titulo": "Valores rectores y fuentes de sentido",
    "eje": "protectores",
    "datos": "valores que guían decisiones, creencias que sostienen al paciente, fuentes de sentido (espirituales, filosóficas, relacionales, creativas).",
    "preguntas": [
      {
        "texto": "¿Qué es lo que más te importa en la vida, por encima de otras cosas?",
        "seguimiento": [
          "¿Cómo se refleja eso en tu día a día actual?",
          "¿Sientes que estás pudiendo vivir de acuerdo a eso ahora mismo?"
        ]
      },
      {
        "texto": "¿Hay algo (una creencia, una idea, una práctica) que te sostenga en los momentos difíciles?",
        "seguimiento": [
          "¿Desde cuándo cuentas con eso?",
          "¿Cómo lo mantienes vivo en tu rutina?"
        ]
      },
      {
        "texto": "Si miraras tu vida dentro de diez años, ¿qué te gustaría poder decir que hiciste bien?",
        "seguimiento": [
          "¿Qué de eso ya estás construyendo ahora?",
          "¿Qué te ayudaría a acercarte más a esa idea?"
        ]
      },
      {
        "texto": "¿Qué persona, en tu vida o fuera de ella, admiras por cómo vive sus valores?",
        "seguimiento": [
          "¿Qué es exactamente lo que admiras de esa persona?",
          "¿En qué te ves parecido/a a ella, aunque sea un poco?"
        ]
      }
    ]
  }
];

export default BANCO_PREGUNTAS;
