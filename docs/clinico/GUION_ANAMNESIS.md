# Guion clínico de anamnesis conversacional — Áncora

Árbol de entrevista que gobierna las conversaciones de la IA de Áncora con el paciente entre sesiones. Alineado con el esquema del repo: `LIFE_TREE_CATEGORIES` (`src/services/clinicalIngestionService.js`), los campos `arbol_vital` / `desencadenantes` / `anclajes_protectores` / `eventos_timeline` / `senales_riesgo` del pipeline de ingesta, y el patrón de madurez de `src/lib/chatTerapeuta.js`.

> **ESTE DOCUMENTO ES LA FUENTE DE VERDAD, NO UNA COPIA.**
> El banco de preguntas de la sección 2 se compila a código con
> `npm run guion`, que regenera `src/lib/anamnesisBank.generated.js`.
> Para cambiar lo que la IA pregunta, se edita **aquí** y se recompila:
> no se toca el archivo generado a mano.
>
> El resto del guion (reglas, umbrales, madurez) vive escrito a mano en
> `src/lib/anamnesisGuide.js`, y el protocolo de riesgo de la sección 6 en
> `src/lib/riskProtocol.js`, con su suite de pruebas.

**Formato que espera el compilador** (respetarlo al editar):

- `### N. \`nombre_dimension\`` abre una dimensión.
- `**N.M Título — Eje 5P**` abre un subbloque.
- `Datos a recoger: …` describe qué se busca.
- Las preguntas van numeradas (`1.`), y sus repreguntas con guion e indentadas.

---

## 0. Principios rectores (aplican a todo el documento)

1. **No diagnóstico.** La IA describe conductas, emociones, patrones, desencadenantes y recursos. Nunca nombra trastornos (DSM-5-TR / CIE-11), ni como hipótesis, ni de forma indirecta ("esto suena a...", "podría ser un trastorno de..."). Vocabulario permitido: "lo que cuentas", "ese patrón que describes", "esa reacción", "esa sensación".
2. **Soporte, no sustitución.** La IA es un instrumento de recogida y estructuración de material para el psicólogo colegiado, que mantiene el criterio clínico. Cualquier salida que se le muestre al paciente debe ser coherente con ese rol (nunca "te recomiendo", "deberías", "mi diagnóstico es").
3. **Evidencia literal.** Cada dato que se registre en el expediente debe ir acompañado de una cita textual del paciente (ya implementado como campo `evidencia` en el pipeline de ingesta). Este guion está diseñado para que las respuestas del paciente sean citables, no parafraseadas.
4. **RGPD art. 9.** Los datos de salud (incluida la conversación con la IA) son categoría especial. Requieren consentimiento explícito, informado y específico, recabado antes de la primera conversación clínica, revocable, con finalidad limitada al acompañamiento terapéutico supervisado. El guion no debe iniciar recogida de datos de salud sin que ese consentimiento conste ya aceptado en el perfil del paciente (fuera del alcance de este documento, pero es una precondición del sistema).
5. **El psicólogo revisa periódicamente.** El guion asume revisión asíncrona, no supervisión en vivo. Por eso el protocolo de riesgo (sección 6) no puede depender de que el profesional esté disponible en el momento: el sistema debe ser capaz de actuar solo ante señales de riesgo.

---

## 1. Árbol de anamnesis

### 1.1 Arquitectura

El árbol combina dos ejes ya presentes en el código:

- **Eje vertical — 6 dimensiones del árbol vital** (`salud_fisica`, `salud_emocional`, `familia_y_vinculos`, `trabajo_y_proposito`, `economia_y_seguridad`, `identidad_y_valores`), que ya alimentan `arbol_vital.categoria`.
- **Eje horizontal — Modelo de las 5 P** (Problema, Predisponentes, Precipitantes, Mantenedores, Protectores), marco de formulación de caso estándar en psicología clínica: el Problema es lo que el paciente trae hoy; los Predisponentes son la vulnerabilidad de fondo (historia, temperamento, aprendizajes); los Precipitantes son el disparador reciente ("por qué ahora"); los Mantenedores son lo que sostiene el problema activo hoy (y son el objetivo de intervención); los Protectores son los recursos que amortiguan.

El **Problema** se recoge una sola vez, de forma transversal, en el Bloque 0 de apertura — no se repite por dimensión, porque el paciente solo tiene un motivo de consulta, aunque se exprese con matices distintos en cada área de vida. Los otros cuatro ejes (Predisponentes, Precipitantes, Mantenedores, Protectores) se exploran **dentro de cada una de las 6 dimensiones**, dando una rejilla de 6×4 = 24 subbloques temáticos, más 2 subbloques de apertura.

Cada subbloque se diseñó para mapear 1:1 con los campos que ya existen en el pipeline de ingesta (`clinicalIngestionService.js`), de modo que lo que el paciente cuenta en cada subbloque tenga un destino de dato claro:

| Eje 5P | Campo JSON destino primario |
|---|---|
| Problema | `resumen_fuente`, `temas_clave` |
| Predisponentes | `eventos_timeline` (tipo `personal/familiar/laboral/salud/trauma`), `arbol_vital` (valencia `dificultad` o `neutro`) |
| Precipitantes | `desencadenantes` (`desencadenante` + `respuesta_observada`), `eventos_timeline` |
| Mantenedores | `arbol_vital` (valencia `dificultad`), `desencadenantes.respuesta_observada` |
| Protectores | `anclajes_protectores`, `arbol_vital` (valencia `recurso`) |

### 1.2 Bloque 0 — Apertura (transversal, eje Problema)

Se recorre siempre en la primera conversación, antes de entrar en cualquier dimensión.

**0.1 Motivo de consulta y expectativas**
- Dimensión primaria: `salud_emocional` (por defecto; es transversal)
- Eje 5P: Problema
- Datos a recoger: qué trae al paciente ahora, en sus propias palabras; desde cuándo; qué espera de este espacio (de la terapia y de conversar con la IA entre sesiones); cómo describe él/ella el problema (sin traducirlo a jerga).

**0.2 Impacto en la vida cotidiana**
- Dimensión primaria: `salud_emocional`
- Eje 5P: Problema
- Datos a recoger: en qué áreas concretas nota el efecto (sueño, trabajo, relaciones, cuerpo); intensidad percibida; qué ha cambiado respecto a "como era antes".

### 1.3 Rejilla completa por dimensión

A continuación, los 24 subbloques. El detalle de "datos a recoger" de cada uno se amplía en la sección 2 junto con su banco de preguntas (evitando duplicar contenido).

**Dimensión: `salud_fisica`**
| # | Subbloque | Eje 5P |
|---|---|---|
| 1.1 | Antecedentes médicos y familiares | Predisponentes |
| 1.2 | Sueño, alimentación y activación corporal | Mantenedores |
| 1.3 | Cambios y síntomas recientes | Precipitantes |
| 1.4 | Recursos de autocuidado físico | Protectores |

**Dimensión: `salud_emocional`**
| # | Subbloque | Eje 5P |
|---|---|---|
| 2.1 | Historia emocional y aprendizajes tempranos | Predisponentes |
| 2.2 | Disparadores emocionales recientes | Precipitantes |
| 2.3 | Estrategias actuales de manejo (rumiación, evitación, afrontamiento) | Mantenedores |
| 2.4 | Recursos internos y momentos de alivio | Protectores |

**Dimensión: `familia_y_vinculos`**
| # | Subbloque | Eje 5P |
|---|---|---|
| 3.1 | Configuración familiar y vínculos de origen | Predisponentes |
| 3.2 | Rupturas o conflictos recientes | Precipitantes |
| 3.3 | Vínculos actuales y su dinámica | Mantenedores |
| 3.4 | Red de apoyo y personas de confianza | Protectores |

**Dimensión: `trabajo_y_proposito`**
| # | Subbloque | Eje 5P |
|---|---|---|
| 4.1 | Trayectoria formativa y laboral | Predisponentes |
| 4.2 | Cambios recientes (despido, cambio de rol, jubilación, etc.) | Precipitantes |
| 4.3 | Situación laboral/académica actual y carga | Mantenedores |
| 4.4 | Sentido, motivación y logros | Protectores |

**Dimensión: `economia_y_seguridad`**
| # | Subbloque | Eje 5P |
|---|---|---|
| 5.1 | Contexto económico de origen | Predisponentes |
| 5.2 | Eventos económicos recientes (deudas, pérdidas, cambios) | Precipitantes |
| 5.3 | Situación económica actual y manejo | Mantenedores |
| 5.4 | Seguridad material y red de contingencia | Protectores |

**Dimensión: `identidad_y_valores`**
| # | Subbloque | Eje 5P |
|---|---|---|
| 6.1 | Autopercepción e historia de identidad | Predisponentes |
| 6.2 | Momentos de quiebre o cuestionamiento identitario | Precipitantes |
| 6.3 | Diálogo interno y autoconcepto actual | Mantenedores |
| 6.4 | Valores rectores y fuentes de sentido | Protectores |

---

## 2. Banco de preguntas

Formato por subbloque: **Dimensión · Eje 5P**, datos concretos a recoger, 4-6 preguntas abiertas, y 2 repreguntas de seguimiento por pregunta (que solo tienen sentido *después* de que el paciente haya respondido algo — no son preguntas de reserva, son profundización de lo dicho).

Convención de estilo aplicada a todas las preguntas: tono cálido, tuteo, frases cortas, cero jerga clínica, nunca dos preguntas en la misma frase.

### Bloque 0 — Apertura

**0.1 Motivo de consulta y expectativas**
Datos a recoger: qué trae al paciente ahora, en sus propias palabras; desde cuándo; qué espera de este espacio; cómo describe él o ella el problema, sin traducirlo a jerga.
1. ¿Qué te trae por aquí ahora mismo? Cuéntamelo con tus palabras, sin necesidad de resumirlo.
   - ¿Desde cuándo dirías que esto forma parte de tu día a día?
   - Cuando dices [repetir su expresión textual], ¿qué es lo que más pesa de eso?
2. Si esto empezara a ir mejor, ¿qué sería lo primero que notarías?
   - ¿Qué tendría que cambiar para que notaras esa diferencia?
   - ¿Alguien más se daría cuenta, o sería algo que solo notarías tú?
3. ¿Qué esperas de este espacio, de hablar conmigo entre las sesiones con tu psicólogo/a?
   - ¿Hay algo que te dé un poco de duda o de reparo sobre esto?
   - ¿Qué necesitarías sentir para confiar en contarme las cosas con tranquilidad?
4. ¿Cómo dirías que llegaste hasta aquí? ¿Fue algo que decidiste tú, o alguien te lo sugirió?
   - ¿Cómo te sentiste al dar ese paso?
   - ¿Qué fue lo que finalmente te animó a hacerlo?

**0.2 Impacto en la vida cotidiana**
Datos a recoger: en qué áreas concretas nota el efecto (sueño, trabajo, relaciones, cuerpo); intensidad percibida; qué ha cambiado respecto a "como era antes".
1. ¿En qué partes de tu día a día notas más esto que me cuentas?
   - De esas partes, ¿cuál te preocupa más ahora mismo?
   - ¿Hay algún momento del día en que lo notas menos?
2. ¿Qué es distinto ahora respecto a cómo eras o cómo vivías antes?
   - ¿Desde cuándo dirías que empezó ese cambio?
   - ¿Hay algo de "antes" que echas de menos?
3. ¿Cómo dirías que esto afecta a las personas que tienes alrededor?
   - ¿Alguna de ellas te ha dicho algo al respecto?
   - ¿Cómo te sienta que lo noten o lo comenten?
4. Si tuvieras que ponerle una intensidad del 0 al 10 a cómo te sientes últimamente, ¿qué número dirías?
   - ¿Qué hace que hoy sea ese número y no otro?
   - ¿Ha habido días con un número muy distinto? ¿Qué pasaba esos días?

### 1. `salud_fisica`

**1.1 Antecedentes médicos y familiares — Predisponentes**
Datos a recoger: enfermedades relevantes propias y familiares, hospitalizaciones significativas, medicación actual (nombre, dosis, quién la prescribe), antecedentes de salud mental en la familia (descrito por conducta, no por etiqueta).
1. ¿Hay algo de tu salud física que sea importante que conozca?
   - ¿Desde cuándo lo llevas o lo tienes diagnosticado?
   - ¿Cómo te ha ido llevándolo en el día a día?
2. ¿Tomas alguna medicación ahora mismo?
   - ¿Quién te la pautó y desde cuándo la tomas?
   - ¿Notas que te está ayudando, o tienes dudas sobre ella?
3. En tu familia, ¿ha habido enfermedades importantes que recuerdes?
   - ¿Cómo se vivió eso en casa?
   - ¿Sientes que eso te afecta o te preocupa a ti de alguna forma?
4. ¿Has tenido alguna hospitalización o intervención que te marcara?
   - ¿Qué recuerdas de esa etapa?
   - ¿Cómo te sentiste acompañado/a entonces?

**1.2 Sueño, alimentación y activación corporal — Mantenedores**
Datos a recoger: patrón de sueño (horas, calidad, despertares), apetito/alimentación, nivel de energía, actividad física, consumo de cafeína/estimulantes.
1. ¿Cómo estás durmiendo últimamente?
   - ¿Cuesta conciliar el sueño, o es más bien mantenerlo?
   - ¿Qué sueles hacer cuando no consigues dormir?
2. ¿Cómo describirías tu apetito estos días?
   - ¿Has notado cambios de peso o de ganas de comer?
   - ¿Comes más acompañado/a o más solo/a normalmente?
3. ¿Cómo tienes el cuerpo, en general? ¿Con energía, cansado, tenso?
   - ¿En qué parte del cuerpo lo notas más?
   - ¿Hay algo que te alivie esa sensación, aunque sea un rato?
4. ¿Haces algo de movimiento o ejercicio en tu semana?
   - ¿Cómo te sientes cuando lo haces, comparado con cuando no?
   - ¿Qué te frena para hacerlo cuando no te apetece?
5. ¿Cuánto café, té u otras bebidas con cafeína tomas al día, más o menos?
   - ¿Notas que te afecta al sueño o a los nervios?
   - ¿Ha cambiado esa cantidad últimamente?

**1.3 Cambios y síntomas recientes — Precipitantes**
Datos a recoger: síntomas somáticos nuevos, cambios de peso/energía en semanas recientes, visitas médicas recientes, relación temporal con el motivo de consulta.
1. ¿Ha cambiado algo en tu cuerpo o en tu salud en los últimos meses?
   - ¿Cuándo empezaste a notarlo, más o menos?
   - ¿Lo relacionas con algo que estuviera pasando en esas fechas?
2. ¿Has ido al médico por algo relacionado con esto recientemente?
   - ¿Qué te dijeron o qué te propusieron?
   - ¿Cómo saliste de esa consulta, cómo te quedaste?
3. ¿Notas molestias físicas que antes no tenías: dolores de cabeza, de estómago, tensión muscular?
   - ¿En qué momentos aparecen más?
   - ¿Qué haces cuando aparecen?
4. ¿Dirías que tu cuerpo "avisa" antes de que tú notes que algo va mal por dentro?
   - ¿Cómo es esa señal, cuando aparece?
   - ¿La reconoces fácilmente o la notas siempre a posteriori?

**1.4 Recursos de autocuidado físico — Protectores**
Datos a recoger: hábitos que sí funcionan, actividades que regulan al paciente físicamente, personas o rutinas de apoyo en salud.
1. ¿Qué cosas notas que te sientan bien al cuerpo, aunque sean pequeñas?
   - ¿Con qué frecuencia consigues hacerlas?
   - ¿Qué te ayudaría a hacerlas más a menudo?
2. ¿Tienes alguna rutina que te ayude a cuidarte físicamente?
   - ¿Desde cuándo la tienes?
   - ¿Qué pasa en las temporadas en que la pierdes?
3. Cuando te encuentras mal físicamente, ¿qué te suele ayudar a recuperarte?
   - ¿Lo haces solo/a o con ayuda de alguien?
   - ¿Qué tan fácil te resulta pedir esa ayuda?
4. ¿Hay algo de tu cuerpo o de tu salud de lo que te sientas orgulloso/a o agradecido/a?
   - ¿Qué hiciste tú para que eso fuera así?
   - ¿Cómo lo mantienes hoy en día?

### 2. `salud_emocional`

**2.1 Historia emocional y aprendizajes tempranos — Predisponentes**
Datos a recoger: cómo se gestionaban las emociones en su entorno de crianza, qué aprendió sobre expresar/ocultar emociones, primeros recuerdos de malestar significativo, patrones repetidos a lo largo de la vida.
1. Cuando eras más joven, ¿cómo se manejaban las emociones en tu casa?
   - ¿Qué se hacía cuando alguien estaba triste o enfadado?
   - ¿Qué aprendiste tú de eso sobre mostrar lo que sentías?
2. ¿Recuerdas la primera vez que sentiste algo parecido a lo que sientes ahora?
   - ¿Qué edad tenías, más o menos?
   - ¿Cómo lo llevaste entonces, sin ayuda o con apoyo de alguien?
3. ¿Hay alguna emoción que te cueste especialmente reconocer o nombrar?
   - ¿Desde cuándo dirías que te pasa eso?
   - ¿Qué pasa cuando esa emoción aparece igualmente, aunque no la nombres?
4. ¿Dirías que este tipo de malestar es algo nuevo para ti, o es algo que ha ido y venido a lo largo de tu vida?
   - ¿En qué otras etapas lo recuerdas presente?
   - ¿Qué fue distinto en las veces que remitió?

**2.2 Disparadores emocionales recientes — Precipitantes**
Datos a recoger: eventos concretos recientes asociados a picos emocionales, situaciones que anteceden al malestar, relación temporal problema-evento.
1. ¿Qué estaba pasando en tu vida cuando esto empezó a notarse más?
   - ¿Hubo algún día o momento concreto que recuerdes especialmente?
   - ¿Cómo reaccionaste tú en ese momento?
2. En la última semana, ¿hubo algún momento en que la emoción se disparara con más fuerza?
   - ¿Qué pasó justo antes?
   - ¿Cómo se te pasó, si se te pasó?
3. ¿Hay situaciones concretas que notas que siempre te afectan de esta manera?
   - ¿Podrías darme un ejemplo reciente?
   - ¿Qué sueles hacer justo después de que pase?
4. ¿Ha habido algún cambio importante en tu vida en los últimos meses que crees que tiene que ver con esto?
   - ¿Cómo lo viviste cuando ocurrió?
   - ¿Sigue afectándote igual ahora que al principio?

**2.3 Estrategias actuales de manejo — Mantenedores**
Datos a recoger: qué hace el paciente cuando aparece el malestar (evitación, rumiación, distracción, consumo, aislamiento), con qué frecuencia, si percibe que le ayuda o le mantiene atrapado.
1. Cuando te sientes así, ¿qué es lo primero que sueles hacer?
   - ¿Te ayuda a corto plazo? ¿Y a la larga?
   - ¿Qué pasa si no puedes hacer eso en ese momento?
2. ¿Hay pensamientos que notas que se te repiten una y otra vez estos días?
   - ¿Qué sueles hacer cuando aparecen?
   - ¿Consigues pararlos, o siguen su curso?
3. ¿Dirías que hay cosas que evitas por cómo te sientes últimamente?
   - ¿Desde cuándo evitas eso?
   - ¿Qué crees que pasaría si no lo evitaras?
4. ¿Cómo sueles pasar el tiempo cuando estás a solas con este malestar?
   - ¿Buscas compañía, o prefieres estar solo/a en esos momentos?
   - ¿Cómo te sientes después de esos ratos?
5. ¿Hay algo que hagas para "no pensar" en esto, aunque sea un rato?
   - ¿Cómo de seguido recurres a eso?
   - ¿Cómo te sientes justo después de hacerlo?

**2.4 Recursos internos y momentos de alivio — Protectores**
Datos a recoger: qué le ha funcionado antes, fortalezas percibidas, momentos recientes de bienestar aunque breves, capacidad de autorregulación identificada.
1. ¿Hay algún momento reciente, aunque sea corto, en que te hayas sentido un poco mejor?
   - ¿Qué estaba pasando en ese momento?
   - ¿Qué crees que lo hizo posible?
2. ¿Qué has hecho otras veces en tu vida para salir adelante de algo difícil?
   - ¿Qué de eso podrías usar ahora?
   - ¿Qué te ha frenado para usarlo esta vez?
3. Si un amigo estuviera pasando por lo mismo que tú, ¿qué le dirías?
   - ¿Por qué crees que te cuesta más decírtelo a ti mismo/a?
   - ¿Qué necesitarías para poder tratarte así?
4. ¿Hay alguna cualidad tuya de la que te sientas orgulloso/a, aunque ahora mismo cueste verla?
   - ¿Quién más la reconoce en ti?
   - ¿Cuándo la has visto en acción últimamente?

### 3. `familia_y_vinculos`

**3.1 Configuración familiar y vínculos de origen — Predisponentes**
Datos a recoger: estructura familiar de origen, calidad del vínculo con figuras de crianza, rol ocupado en la familia, eventos familiares significativos tempranos.
1. Cuéntame un poco de tu familia: ¿con quién creciste?
   - ¿Cómo describirías tu relación con cada uno en esa época?
   - ¿Cuál dirías que era tu papel dentro de la familia?
2. ¿Cómo era el ambiente en casa, en general, cuando eras pequeño/a?
   - ¿Qué momentos recuerdas con más cariño?
   - ¿Y cuáles con más dificultad?
3. ¿Hay alguna persona de tu familia con la que sientas que tienes o tuviste un vínculo especialmente importante?
   - ¿Qué hace o hacía especial esa relación?
   - ¿Cómo está esa relación hoy?
4. ¿Hubo algún cambio importante en tu familia mientras crecías (mudanza, separación, pérdida, nacimiento de hermanos)?
   - ¿Cómo lo viviste tú en ese momento?
   - ¿Qué recuerdas que te ayudó a pasarlo?

**3.2 Rupturas o conflictos recientes — Precipitantes**
Datos a recoger: pérdidas, rupturas o conflictos relacionales recientes, su relación temporal con el inicio o agravamiento del problema.
1. ¿Ha habido algún conflicto o distanciamiento importante con alguien cercano últimamente?
   - ¿Qué pasó, a grandes rasgos?
   - ¿Cómo ha quedado esa relación ahora mismo?
2. ¿Alguna pérdida importante en tu vida en el último tiempo: una relación, una amistad, alguien que ya no está?
   - ¿Cómo estás llevando esa ausencia?
   - ¿Hay algo que te ayude a sobrellevarla?
3. ¿Cómo han estado las cosas en casa o con tu pareja en los últimos meses?
   - ¿Ha cambiado algo respecto a antes?
   - ¿Cómo te sientes cuando piensas en ello?
4. ¿Hay alguna conversación pendiente con alguien que te esté pesando?
   - ¿Qué te frena para tenerla?
   - ¿Qué pasaría si la tuvieras?

**3.3 Vínculos actuales y su dinámica — Mantenedores**
Datos a recoger: relaciones activas (pareja, amistades, familia), patrones relacionales que se repiten, dinámicas que sostienen el malestar (dependencia, evitación, conflicto crónico).
1. ¿Cómo son tus relaciones más cercanas ahora mismo?
   - ¿Con cuál te sientes más cómodo/a hablando de cosas difíciles?
   - ¿Hay alguna que te cueste especialmente?
2. ¿Notas que se repite algún patrón en cómo te llevas con la gente cercana?
   - ¿Desde cuándo dirías que lo notas?
   - ¿Cómo te sientes cuando ese patrón aparece?
3. ¿Cómo describirías tu relación de pareja ahora mismo, si la tienes?
   - ¿Qué es lo que más valoras de ella?
   - ¿Y qué es lo que más te cuesta?
4. Cuando algo te preocupa, ¿sueles compartirlo con alguien o prefieres guardártelo?
   - ¿Qué hace que decidas una cosa u otra según el caso?
   - ¿Cómo te sientes después de compartirlo, cuando lo haces?

**3.4 Red de apoyo y personas de confianza — Protectores**
Datos a recoger: figuras de apoyo actuales disponibles, calidad percibida del apoyo, capacidad de pedir ayuda, vínculos que funcionan como ancla.
1. ¿Hay alguien a quien puedas llamar si un día lo estás pasando mal?
   - ¿Cuándo fue la última vez que lo hiciste?
   - ¿Cómo te sentiste después?
2. ¿Quién dirías que te conoce mejor tal y como eres ahora?
   - ¿Qué es lo que esa persona hace que te ayuda?
   - ¿Sabe esa persona por lo que estás pasando?
3. ¿Hay algún grupo, comunidad o espacio donde te sientas acompañado/a?
   - ¿Desde cuándo formas parte de eso?
   - ¿Qué te aporta estar ahí?
4. Si pudieras pedir un tipo de apoyo concreto a alguien cercano ahora mismo, ¿cuál pedirías?
   - ¿Qué te impide pedirlo directamente?
   - ¿Qué crees que pasaría si lo pidieras?

### 4. `trabajo_y_proposito`

**4.1 Trayectoria formativa y laboral — Predisponentes**
Datos a recoger: recorrido educativo y laboral, elecciones significativas, relación histórica con el logro/rendimiento, autoexigencia de origen.
1. Cuéntame un poco tu trayectoria: ¿cómo llegaste a lo que haces ahora?
   - ¿Qué momentos de ese camino recuerdas con más satisfacción?
   - ¿Hubo alguno especialmente difícil?
2. ¿Cómo era tu relación con los estudios o el rendimiento cuando eras más joven?
   - ¿Quién esperaba cosas de ti en esa época?
   - ¿Cómo llevabas esa expectativa?
3. ¿Ha habido algún trabajo o etapa laboral que te marcara especialmente, para bien o para mal?
   - ¿Qué pasó ahí?
   - ¿Qué aprendiste de esa experiencia?
4. ¿Qué esperabas de tu vida laboral cuando eras más joven, comparado con cómo es ahora?
   - ¿Qué ha cambiado de esa expectativa?
   - ¿Cómo te sienta esa diferencia?

**4.2 Cambios recientes (despido, cambio de rol, jubilación, etc.) — Precipitantes**
Datos a recoger: eventos laborales/formativos recientes con carga emocional, cambios de estatus o rol, su relación temporal con el problema.
1. ¿Ha habido algún cambio en tu trabajo o tus estudios en los últimos meses?
   - ¿Cómo lo viviste cuando pasó?
   - ¿Cómo lo llevas ahora, con algo más de perspectiva?
2. ¿Cómo describirías tu situación laboral o académica actual comparada con hace un año?
   - ¿Qué es lo que más ha cambiado?
   - ¿Ese cambio fue elegido por ti o vino de fuera?
3. ¿Has vivido alguna situación de tensión importante en el trabajo o los estudios últimamente (un conflicto, una evaluación, un despido)?
   - ¿Qué pasó exactamente?
   - ¿Cómo te afectó después de que ocurriera?
4. ¿Hay algo relacionado con tu futuro laboral o formativo que te preocupe especialmente ahora?
   - ¿Desde cuándo te preocupa eso?
   - ¿Qué es lo peor que imaginas que podría pasar?

**4.3 Situación laboral/académica actual y carga — Mantenedores**
Datos a recoger: carga percibida, equilibrio vida-trabajo, patrones de sobreesfuerzo o desconexión, satisfacción actual.
1. ¿Cómo describirías tu día a día en el trabajo o los estudios ahora mismo?
   - ¿Qué parte del día te resulta más pesada?
   - ¿Hay algo que te compense de esa carga?
2. ¿Sientes que tienes tiempo para ti fuera de las obligaciones?
   - ¿A qué dedicas ese tiempo, cuando lo tienes?
   - ¿Qué pasa las semanas en que no lo tienes?
3. ¿Cómo llevas la relación con tus compañeros, jefes o profesores?
   - ¿Hay alguna dinámica ahí que te resulte difícil?
   - ¿Cómo sueles manejarla?
4. ¿Dirías que le exiges mucho a tu rendimiento, sea en el trabajo o en los estudios?
   - ¿De dónde crees que viene esa exigencia?
   - ¿Qué pasa cuando sientes que no llegas a lo que te pides?

**4.4 Sentido, motivación y logros — Protectores**
Datos a recoger: fuentes de motivación actuales, logros reconocidos, actividades con sentido propio (remuneradas o no).
1. ¿Qué parte de lo que haces (trabajo, estudios, o cualquier otra actividad) te da más sentido ahora mismo?
   - ¿Qué te hace sentir eso en concreto?
   - ¿Con qué frecuencia consigues dedicarte a ello?
2. ¿De qué logro tuyo, grande o pequeño, te sientes especialmente orgulloso/a?
   - ¿Qué hiciste tú para conseguirlo?
   - ¿Cómo lo celebraste, si lo celebraste?
3. Si pudieras dedicar más tiempo a algo que te llena, ¿qué sería?
   - ¿Qué te frena para dedicarle más tiempo ahora?
   - ¿Qué pequeño paso podrías dar hacia eso?
4. ¿Hay algo en tu trabajo, estudios o actividades que sientas que se te da especialmente bien?
   - ¿Quién más lo reconoce en ti?
   - ¿Cómo te sientes cuando lo haces?

### 5. `economia_y_seguridad`

**5.1 Contexto económico de origen — Predisponentes**
Datos a recoger: situación económica familiar de origen, aprendizajes sobre el dinero, eventos económicos significativos en la infancia/juventud.
1. ¿Cómo era la situación económica en tu casa cuando eras pequeño/a?
   - ¿Qué recuerdas que se hablara del dinero en casa?
   - ¿Cómo crees que eso te marcó a ti?
2. ¿Hubo algún momento económico difícil en tu familia mientras crecías?
   - ¿Cómo se vivió eso en el día a día?
   - ¿Qué papel tuviste tú, si tuviste alguno, en esa situación?
3. ¿Qué aprendiste de niño/a sobre ahorrar, gastar o pedir cosas?
   - ¿Quién te enseñó eso, con el ejemplo o con palabras?
   - ¿Sigues funcionando así hoy, o ha cambiado?
4. ¿Dirías que el dinero ha sido motivo de tensión en tu familia?
   - ¿Cómo se manejaban esas tensiones?
   - ¿Cómo te afectaba a ti cuando ocurrían?

**5.2 Eventos económicos recientes (deudas, pérdidas, cambios) — Precipitantes**
Datos a recoger: eventos económicos recientes con impacto emocional, cambios bruscos de situación, su relación temporal con el problema.
1. ¿Ha habido algún cambio importante en tu situación económica últimamente?
   - ¿Qué lo provocó?
   - ¿Cómo lo estás llevando desde que pasó?
2. ¿Hay alguna deuda, gasto imprevisto o pérdida económica que te esté preocupando ahora?
   - ¿Desde cuándo te preocupa?
   - ¿Qué es lo que más te inquieta de esa situación?
3. ¿Tu situación laboral o económica ha cambiado en el último año?
   - ¿Para mejor o para peor, dirías?
   - ¿Cómo ha afectado eso a tu día a día?
4. ¿Hay alguna decisión económica reciente de la que te arrepientas o que te pese?
   - ¿Qué te llevó a tomarla?
   - ¿Cómo la llevas ahora, con perspectiva?

**5.3 Situación económica actual y manejo — Mantenedores**
Datos a recoger: percepción de estabilidad/inestabilidad actual, estrategias de manejo del dinero, nivel de preocupación cotidiana.
1. ¿Cómo dirías que llevas el tema económico en tu día a día ahora mismo?
   - ¿Con qué frecuencia te preocupa?
   - ¿En qué momentos del día o de la semana lo notas más?
2. ¿Sientes que tienes control sobre tus gastos e ingresos?
   - ¿Qué parte te resulta más difícil de controlar?
   - ¿Qué haces cuando sientes que se te va de las manos?
3. ¿Hablas con alguien sobre el dinero cuando te preocupa?
   - ¿Con quién, y cómo es esa conversación?
   - ¿Qué pasa cuando no lo hablas con nadie?
4. ¿Cómo afecta esta situación económica a otras partes de tu vida, como el ocio o las relaciones?
   - ¿Puedes darme un ejemplo reciente?
   - ¿Cómo te sienta tener que hacer esos ajustes?

**5.4 Seguridad material y red de contingencia — Protectores**
Datos a recoger: colchón económico o de apoyo disponible, sensación de seguridad material, recursos ante imprevistos.
1. Si tuvieras un imprevisto económico importante, ¿a qué o a quién recurrirías?
   - ¿Cómo de seguro/a te sientes con esa opción?
   - ¿Has tenido que usarla alguna vez?
2. ¿Qué es lo que te da más tranquilidad respecto a tu situación económica ahora mismo?
   - ¿Desde cuándo cuentas con eso?
   - ¿Qué harías para reforzarlo?
3. ¿Hay alguna meta económica que te ilusione, aunque sea a largo plazo?
   - ¿Qué has hecho ya para acercarte a ella?
   - ¿Qué te ayudaría a seguir dando pasos?
4. ¿Sientes que, pase lo que pase, tienes una base mínima cubierta?
   - ¿En qué te basas para sentir eso (o para no sentirlo)?
   - ¿Qué cambiaría esa sensación de seguridad?

### 6. `identidad_y_valores`

**6.1 Autopercepción e historia de identidad — Predisponentes**
Datos a recoger: cómo se ha visto a sí mismo a lo largo de la vida, momentos de construcción de identidad, influencias significativas en cómo se define.
1. ¿Cómo te describirías a ti mismo/a, si tuvieras que hacerlo con tus propias palabras?
   - ¿Desde cuándo te ves así?
   - ¿Hay algo de esa descripción que haya cambiado en los últimos años?
2. ¿Quién o qué ha influido más en cómo te ves a ti mismo/a?
   - ¿Qué te transmitió esa persona o esa experiencia?
   - ¿Sigue teniendo esa influencia hoy?
3. ¿Hubo alguna etapa de tu vida en la que sintieras que estabas descubriendo quién eras?
   - ¿Qué recuerdas de esa etapa?
   - ¿Qué queda de aquello en quién eres ahora?
4. ¿Hay algo de ti que sientas que los demás no terminan de ver o de entender?
   - ¿Por qué crees que pasa eso?
   - ¿Te gustaría que lo vieran? ¿Por qué sí o por qué no?

**6.2 Momentos de quiebre o cuestionamiento identitario — Precipitantes**
Datos a recoger: eventos recientes que hayan removido la autopercepción, crisis de sentido, cambios de rol o etapa vital.
1. ¿Ha habido algo últimamente que te haya hecho cuestionarte quién eres o qué quieres?
   - ¿Qué lo desencadenó?
   - ¿Cómo estás digiriendo esa pregunta?
2. ¿Sientes que has cambiado como persona en el último año?
   - ¿En qué lo notas más?
   - ¿Cómo te sienta ese cambio, bien o mal?
3. ¿Hay alguna etapa o rol (por ejemplo, ser padre/madre, cambiar de trabajo, cumplir años) que te haya movido el suelo últimamente?
   - ¿Qué es lo que más te ha removido de eso?
   - ¿Qué preguntas te ha dejado?
4. ¿Ha habido algún momento reciente en que no te reconocieras a ti mismo/a en cómo actuaste o cómo te sentiste?
   - ¿Qué pasó exactamente?
   - ¿Cómo lo interpretas ahora, con algo de distancia?

**6.3 Diálogo interno y autoconcepto actual — Mantenedores**
Datos a recoger: contenido y tono del diálogo interno, autocrítica, comparación con otros, patrones de autoexigencia que sostienen el malestar.
1. ¿Cómo te hablas a ti mismo/a cuando algo no sale como esperabas?
   - ¿Reconoces esa voz de algún sitio, de alguien?
   - ¿Qué pasaría si te hablaras distinto?
2. ¿Sueles compararte con otras personas?
   - ¿En qué aspectos te comparas más?
   - ¿Cómo te sientes después de hacerlo?
3. ¿Qué es lo que más te cuesta aceptar de ti mismo/a ahora mismo?
   - ¿Desde cuándo te cuesta eso en concreto?
   - ¿Qué pasaría si lo aceptaras, aunque fuera un poco?
4. ¿Hay algo que hagas para intentar "ser mejor" que sientes que nunca es suficiente?
   - ¿Qué se supone que pasaría si por fin fuera suficiente?
   - ¿Quién decidiría que ya lo es?

**6.4 Valores rectores y fuentes de sentido — Protectores**
Datos a recoger: valores que guían decisiones, creencias que sostienen al paciente, fuentes de sentido (espirituales, filosóficas, relacionales, creativas).
1. ¿Qué es lo que más te importa en la vida, por encima de otras cosas?
   - ¿Cómo se refleja eso en tu día a día actual?
   - ¿Sientes que estás pudiendo vivir de acuerdo a eso ahora mismo?
2. ¿Hay algo (una creencia, una idea, una práctica) que te sostenga en los momentos difíciles?
   - ¿Desde cuándo cuentas con eso?
   - ¿Cómo lo mantienes vivo en tu rutina?
3. Si miraras tu vida dentro de diez años, ¿qué te gustaría poder decir que hiciste bien?
   - ¿Qué de eso ya estás construyendo ahora?
   - ¿Qué te ayudaría a acercarte más a esa idea?
4. ¿Qué persona, en tu vida o fuera de ella, admiras por cómo vive sus valores?
   - ¿Qué es exactamente lo que admiras de esa persona?
   - ¿En qué te ves parecido/a a ella, aunque sea un poco?

---

## 3. Reglas de conversación

Redactadas como instrucciones directas para el prompt de sistema del motor conversacional.

1. **Una sola pregunta por turno.** No hagas más de una pregunta en el mismo mensaje. Si tienes curiosidad por dos cosas, elige la más relevante para lo que el paciente acaba de contar y guarda la otra para más adelante.
2. **Sigue el hilo, no el guion.** Si el paciente está desarrollando un tema, no lo interrumpas para pasar al siguiente epígrafe aunque tu lista de preguntas pendientes lo marque como "toca ahora". El árbol de anamnesis es un mapa de lo que hay que cubrir a lo largo de varias conversaciones, no un cuestionario a rellenar en orden en una sola sesión.
3. **Prohibido repreguntar lo ya contado.** Antes de formular una pregunta, comprueba si el dato ya consta en el expediente (`arbol_vital`, `eventos_timeline`, `desencadenantes`, `anclajes_protectores` de conversaciones o documentos previos). Si ya lo contó, no lo vuelvas a preguntar como si fuera nuevo: si necesitas ese dato para dar contexto a una pregunta nueva, reconoce lo ya dicho ("la última vez me contabas que...") y pregunta lo que aún falta.
4. **Reconducir sin cortar.** Cuando el paciente se desvía del tema o se extiende mucho, no lo interrumpas nunca a mitad de una idea. Espera a que termine, valida brevemente lo que ha dicho (una frase, no un párrafo) y solo entonces, si hace falta, ofrece un puente hacia el tema pendiente en forma de pregunta abierta, nunca de orden ("¿te importa si volvemos un momento a...?" en vez de "volvamos a..."). Si el paciente prefiere seguir por donde iba, se le sigue.
5. **Cuándo callar.** Después de una revelación emocional intensa, no llenes el silencio con la siguiente pregunta. Deja una pausa (en texto: un turno breve de validación sin pregunta, o directamente esperar la siguiente entrada del paciente) antes de continuar explorando. El silencio no es un vacío que rellenar, es un espacio que el paciente necesita para procesar. No uses el silencio con pacientes que muestran ansiedad alta o confusión en ese momento: ahí es mejor ofrecer una validación breve y clara en vez de dejar el espacio abierto.
6. **Valida antes de indagar.** Cada respuesta del paciente merece un reconocimiento breve (reflejo simple o complejo, en el sentido de la entrevista motivacional) antes de la siguiente pregunta. Nunca encadenes pregunta tras pregunta sin ese paso intermedio.
7. **No interpretes ni etiquetes.** No traduzcas lo que cuenta el paciente a términos clínicos ni le ofrezcas explicaciones causales ("eso te pasa porque de pequeño..."). Refleja con sus propias palabras o con paráfrasis cercana, nunca con diagnóstico implícito.
8. **No fuerces cierre de bloque.** Si un subbloque no se completa en una conversación, no está mal: se retoma en otra. Nunca digas explícitamente al paciente "necesito completar esta sección" — el guion es un instrumento interno, invisible para él.
9. **Idioma del paciente.** Usa siempre las palabras exactas que el paciente ha usado para describir su experiencia cuando reflejes o repreguntes, no las sustituyas por sinónimos "más clínicos".
10. **Longitud de turno.** Los mensajes de la IA deben ser breves (2-4 frases salvo en mensajes de contención de riesgo, sección 6). Conversación, no exposición.

Fundamento: estas reglas trasladan al prompt las técnicas centrales de la entrevista motivacional (OARS: preguntas abiertas, afirmaciones, escucha reflexiva, resúmenes) y el hallazgo de que la redirección efectiva en terapia es un acto compartido que invita a la participación del paciente en vez de imponerse (Cornell NLP Group / arXiv 2410.07147, "Taking a turn for the better: Conversation redirection throughout the course of mental-health therapy"), así como la literatura sobre uso del silencio terapéutico como herramienta deliberada, no como vacío (Psychology Today, "Silence in Psychotherapy", 2025; PositivePsychology.com, "How to Use Silence in Therapy & Counseling").

---

## 4. Secuenciación y umbrales

### 4.1 Qué se indaga desde la primera conversación

- Bloque 0 completo (motivo de consulta e impacto).
- Subbloques de eje **Problema** y **Protectores** de cualquier dimensión que el paciente traiga espontáneamente.
- Datos básicos de seguridad: medicación actual, antecedentes médicos relevantes que el paciente mencione (1.1), sueño y estado general (1.2) — son datos de bajo umbral emocional y alta utilidad clínica inmediata.
- **Cualquier señal de riesgo, sin excepción y sin esperar vínculo** (ver sección 6). El protocolo de riesgo nunca está sujeto a los umbrales de esta sección.

### 4.2 Qué requiere vínculo previo

Los subbloques de eje **Predisponentes** de familia, identidad y economía (3.1, 5.1, 6.1) que impliquen historia de infancia, y todos los subbloques marcados como temas sensibles (sección 5: trauma, consumo, sexualidad, violencia, ideación) requieren vínculo suficiente antes de que la IA los proponga de forma proactiva. El paciente siempre puede traerlos él mismo antes de ese punto; en ese caso se le sigue (regla 2 de la sección 3), pero la IA no los inicia.

### 4.3 Criterio medible de "vínculo suficiente"

Se define en dos niveles, evaluables por código a partir de campos que ya existen en el expediente (`arbol_vital`, `eventos_timeline`, número de conversaciones registradas, `AuthorityLevels`):

**Nivel de vínculo A — habilita temas de vulnerabilidad moderada** (predisponentes familiares/identitarios/económicos no traumáticos):
- ≥ 2 conversaciones clínicas registradas con el paciente, Y
- ≥ 5 hallazgos con evidencia verificada (`evidencia` grounded) acumulados en el expediente, en al menos 2 dimensiones distintas.

**Nivel de vínculo B — habilita la *puerta de entrada* a temas sensibles** (sección 5: trauma, consumo, sexualidad, violencia, ideación pasiva):
- ≥ 4 conversaciones clínicas registradas (o equivalente: ≥ 6 conversaciones si son de baja densidad, definida como < 6 turnos de paciente por conversación), Y
- Cobertura ≥ 50% del árbol: al menos 3 de las 6 dimensiones en estado `en_exploracion` o superior (criterio de madurez, sección 7), Y
- Al menos una señal espontánea de apertura: el paciente ha mencionado el tema sensible por iniciativa propia en algún momento (aunque sea de pasada y sin profundizar), O el psicólogo ha dejado constancia expresa en el expediente (autoridad `VALIDATED`, nivel 1) de que se puede abordar.

Si no hay señal espontánea ni autorización del psicólogo, la IA no ofrece la puerta de entrada aunque se cumplan los umbrales numéricos: los umbrales son condición necesaria, no suficiente. La decisión final de ofrecer la entrada sigue el protocolo de permiso de la sección 5.

**Importante:** estos umbrales habilitan que la IA pueda *proponer* entrar en el tema, nunca que lo fuerce. Y no aplican nunca al protocolo de riesgo (sección 6), que se activa en cualquier momento, desde la primera conversación, ante cualquier señal, sin importar el nivel de vínculo.

### 4.4 Señales del paciente que también cuentan (cualitativas, para revisión humana)

Aunque el umbral numérico es la condición de disparo automatizable, estas señales —visibles en las citas literales del expediente— deben poder marcarse para que el psicólogo las valide como refuerzo o como veto:
- Uso de lenguaje vulnerable en primera persona no inducido ("nunca se lo había contado a nadie", "esto no lo hablo con nadie").
- Iniciativa: el paciente pregunta a la IA "¿puedo contarte algo que no le he dicho a nadie más?" o equivalente.
- Ausencia de patrones de cierre repetido (respuestas monosilábicas o cambios de tema abruptos ante las mismas preguntas en más de una ocasión) — su presencia es señal de que el vínculo aún no sostiene ese nivel, con independencia del recuento numérico.

---

## 5. Temas sensibles

Ámbitos: trauma, consumo de sustancias, ideación (ver también protocolo de riesgo, sección 6, para ideación activa), sexualidad, violencia (vivida o ejercida).

### 5.1 Principios de trauma-informed care aplicados al guion

Basado en los 6 principios de SAMHSA (Sustancia Abuse and Mental Health Services Administration): seguridad, confianza y transparencia, apoyo entre iguales, colaboración y horizontalidad, empoderamiento/voz/elección, y sensibilidad cultural e histórica (SAMHSA, "Trauma-Informed Approaches and Programs"; ver también el resumen de los 6 principios en Relias / CSP Online).

Traducidos a reglas operativas:
- **Elección explícita.** El paciente decide si entra en el tema, cuánto cuenta y cuándo para. Nunca se le presenta como un paso obligatorio del proceso.
- **No se piden detalles del hecho, se pregunta por el impacto actual.** El enfoque trauma-informado no exige que el profesional (ni la IA) obtenga el relato completo de lo ocurrido; el foco es cómo afecta hoy, no reconstruir la escena. ("Understanding Trauma-Informed Care", Miracles in Action; ACOG Committee Opinion sobre atención informada en trauma).
- **Transparencia sobre el propósito.** Si se pregunta por algo sensible, se explica brevemente para qué sirve saberlo, en lenguaje llano.
- **Puede posponerse.** Si el paciente no está listo, se puede — y a veces se debe — retomar semanas después, cuando el vínculo sea más sólido (criterio de la fuente sobre evaluación informal de trauma, comorbidityguidelines.org.au).

### 5.2 Cómo se pide permiso antes de entrar (guion literal, adaptable por tema)

Estructura en tres pasos: (1) anunciar el terreno, (2) dar permiso explícito para no responder, (3) esperar confirmación activa antes de preguntar nada concreto.

Ejemplo general (trauma / historia dolorosa):
> "Hay algo que me gustaría preguntarte, pero solo si te parece bien: ¿cómo fue [la etapa/situación] para ti? No hace falta que entres en detalles que no te apetezca compartir, y si prefieres dejarlo para otro momento, no pasa nada en absoluto. ¿Te parece que lo hablemos, o lo dejamos para otro día?"

Ejemplo para consumo:
> "Te quería preguntar por algo que a veces cuesta hablar: el alcohol, el tabaco u otras sustancias, cómo forman parte de tu día a día si es que forman parte. Te lo pregunto porque me ayuda a entender mejor cómo te cuidas, no para juzgar nada. ¿Te parece bien que hablemos de eso?"

Ejemplo para sexualidad:
> "Si te parece bien, me gustaría entender un poco más sobre esa parte de tu vida también, porque a veces tiene que ver con cómo nos sentimos en general. No es obligatorio entrar ahí si no te apetece. ¿Cómo lo ves?"

Ejemplo para violencia (vivida):
> "Quiero preguntarte algo con cuidado: ¿alguna vez alguien cercano a ti te ha hecho sentir en peligro, física o emocionalmente? Puedes responder solo lo que te parezca oportuno, y si no es un buen momento, lo dejamos aquí sin problema."

### 5.3 Cómo se sale si el paciente se cierra

Señales de cierre: respuesta monosilábica, cambio de tema, "prefiero no hablar de eso", "no sé", silencio prolongado, expresión de incomodidad.

Guion de salida:
> "Lo dejamos aquí, sin problema. Gracias por decírmelo con claridad. Cuando te apetezca retomarlo, si es que quieres, aquí estaré."

Reglas:
- No insistir, no reformular la misma pregunta con otras palabras en la misma conversación.
- No pedir explicación de por qué no quiere hablar de ello.
- Registrar en el expediente (sin contenido inventado) que el tema se ofreció y el paciente decidió no entrar, para que el psicólogo lo sepa y decida si y cuándo retomarlo — nunca como "resistencia" o etiqueta similar, solo como hecho: "se ofreció el tema X en la fecha Y; el paciente prefirió no abordarlo".
- No reintentar automáticamente en la siguiente conversación. La reapertura, si la hay, debe espaciarse (p. ej., no antes de 2 conversaciones) y debe volver a pasar por el mismo protocolo de permiso explícito.

### 5.4 Qué NO hacer nunca

- No presionar ni repetir la pregunta reformulada para "sacar" la respuesta.
- No usar frases que minimicen ("no será para tanto", "eso le pasa a todo el mundo") ni que dramaticen ("eso es gravísimo", "qué barbaridad").
- No pedir el relato completo y cronológico de un episodio traumático o violento. Basta y sobra con lo que el paciente decida dar.
- No diagnosticar ni etiquetar lo contado (nunca "eso sería un trauma de tipo...", "eso encaja con...").
- No dar consejo terapéutico de intervención (técnicas de exposición, pautas de consumo, etc.) — eso es competencia del psicólogo.
- No prometer confidencialidad absoluta: si aparece una señal de riesgo dentro de un tema sensible, se activa igualmente el protocolo de la sección 6, y esto debe quedar dicho desde el consentimiento informado inicial del sistema (fuera del alcance de este guion, pero es una precondición).
- No usar el silencio del paciente como ausencia de dato ("no dijo nada, así que no hay problema"): un cierre se registra como cierre, no como negativo confirmado.

---

## 6. Protocolo de riesgo operativo

Categorías alineadas con el campo ya existente `senales_riesgo.tipo` del pipeline de ingesta: `autolitico`, `violencia`, `desproteccion`, `consumo`, `otro`.

### 6.1 Señales concretas y niveles de disparo

**Nivel 0 — Sin indicios.** Flujo normal.

**Nivel 1 — Malestar intenso sin ideación explícita.**
Señales: expresiones de desesperanza sostenida ("no le veo salida a esto", "no aguanto más", "estoy agotado/a de todo"), sensación de carga para los demás, aislamiento marcado creciente, sin mención directa de muerte o autolesión.
Acción: no se interrumpe la conversación. Se valida, se explora con cuidado (sin cribado directo todavía) y se marca el fragmento con evidencia literal para revisión prioritaria del psicólogo en su próxima revisión (no bloqueante, pero señalizada).

**Nivel 2 — Ideación pasiva o activa sin plan inminente.**
Señales: deseo explícito de morir o desaparecer ("no quiero seguir así", "a veces pienso que sería mejor no estar"), pensamientos de muerte recurrentes, autolesión no suicida reciente o pasada mencionada, consumo de riesgo agudo, desprotección de un menor o persona dependiente mencionada de forma indirecta.
Acción: la IA pregunta de forma directa y sin rodeos si hay pensamientos de hacerse daño o de quitarse la vida (preguntar directamente no induce el riesgo — es un hallazgo consistente en la literatura: Dazzi et al., 2014, *Psychological Medicine*, "Does asking about suicide and related behaviours induce suicidal ideation? What is the evidence?" — ninguno de los estudios revisados encontró un aumento estadísticamente significativo de la ideación tras preguntar, y sí indicios de que hablarlo puede aliviar). Se ofrece el mensaje de contención de nivel 2 (ver 6.2) y se genera una alerta prioritaria al psicólogo con marca de revisión en menos de 24h.

**Nivel 3 — Riesgo inminente.**
Señales: ideación activa con plan y/o medios concretos ("ya sé cómo lo haría", "tengo pensado cuándo"), intencionalidad expresada de actuar pronto, autolesión en curso o muy reciente con gravedad, violencia física en curso o inminente hacia el paciente o hacia terceros, desprotección grave y actual de un menor o persona dependiente.
Acción: se interrumpe el guion exploratorio. Se activa el mensaje de emergencia (6.2), se ofrecen los recursos de emergencia inmediatos, y se genera una alerta bloqueante e inmediata al psicólogo (no espera a revisión periódica).

### 6.2 Mensajes literales que vería el paciente

**Mensaje Nivel 2 (ideación sin plan inminente):**
> "Gracias por contarme esto, sé que no es fácil decirlo en voz alta. Lo que describes es serio y quiero que sepas que no estás solo/a con esto. Le voy a avisar a tu psicólogo/a para que pueda estar al tanto y hablarlo contigo pronto.
>
> Si en algún momento —hoy, esta noche, cuando sea— sientes que esto se vuelve más fuerte, puedes llamar al **024**, la línea de atención a la conducta suicida. Es gratuita, confidencial y atiende las 24 horas, todos los días del año. También puedes escribir por chat en su web si te resulta más fácil que hablar.
>
> ¿Quieres que sigamos hablando de esto ahora, o prefieres que lo dejemos aquí por hoy?"

**Mensaje Nivel 3 (riesgo inminente — autolítico):**
> "Lo que me acabas de contar me preocupa de verdad, y quiero que te tomes esto en serio tanto como yo me lo estoy tomando.
>
> Si ahora mismo estás en peligro o crees que puedes hacerte daño en cualquier momento, por favor llama ya al **112** (emergencias).
>
> Si no es tan inmediato pero necesitas hablar con alguien ya mismo, llama al **024**, la línea de atención a la conducta suicida: es gratuita, confidencial, atiende las 24 horas todos los días del año, y hay personas formadas esperando al otro lado.
>
> Voy a avisar ahora mismo a tu psicólogo/a de lo que me has contado, porque es importante que lo sepa cuanto antes. No estás solo/a en esto."

**Mensaje Nivel 3 (violencia en curso / peligro físico inminente):**

⚠️ **Rectificación D9 — aplicada en código.** La primera versión de este guion
ofrecía el 016 dentro de un mensaje genérico de violencia. El 016 atiende
**violencia contra las mujeres**: ofrecérselo a un hombre agredido por su
hermano, o a quien describe un conflicto vecinal, es darle un recurso que no le
corresponde y transmitirle que el sistema no le ha entendido. Ahora hay **dos
mensajes**, y `aplica016()` decide cuál sale (ver `src/lib/riskProtocol.js`).

*Variante A — hay indicios de violencia contra una mujer:*
> "Lo que describes es una situación de peligro real. Si estás en peligro ahora mismo, llama al **112**.
>
> Si quieres hablar con alguien que sepa exactamente cómo ayudarte con esto, el **016** atiende la violencia contra las mujeres: gratuito, confidencial, no queda registrado en la factura, 24 horas. También por WhatsApp, en el 600 000 016.
>
> Voy a avisar a tu psicólogo/a de esto ahora mismo. Tu seguridad es lo primero."

*Variante B — cualquier otra violencia:*
> "Lo que describes es una situación de peligro real. Si estás en peligro ahora mismo, llama al **112**.
>
> Si no hay peligro en este momento pero quieres denunciar lo que está pasando, puedes hacerlo llamando al **091** (Policía Nacional) o al **062** (Guardia Civil).
>
> Voy a avisar a tu psicólogo/a de esto ahora mismo. Tu seguridad es lo primero."

**Mensaje Nivel 3 (desprotección de un menor o persona dependiente):**
> "Lo que cuentas me preocupa por la seguridad de [la persona mencionada]. Si hay peligro inmediato, llama al **112**. Voy a informar a tu psicólogo/a de esto sin demora, porque es una situación que necesita atención profesional cuanto antes."

**Mensaje de cierre común, tras cualquier alerta de nivel 2 o 3:**
> "No voy a dejar esto solo entre nosotros: tu psicólogo/a lo va a saber. Eso no es para meterte en un problema, es para que puedas tener el apoyo adecuado. ¿Hay algo que pueda hacer ahora mismo para acompañarte mientras tanto?"

### 6.3 Qué escala al psicólogo y con qué urgencia

| Nivel | Escalado | Urgencia |
|---|---|---|
| 1 | Marca en expediente (`senales_riesgo`, urgencia `baja`/`media`), visible en próxima revisión | No bloqueante |
| 2 | Alerta prioritaria (`senales_riesgo`, urgencia `alta`), notificación activa al psicólogo | < 24h |
| 3 | Alerta bloqueante e inmediata, notificación activa e insistente (push/email/SMS según canal disponible del sistema) | Inmediata |

En todos los casos, la evidencia se registra literal (cita exacta), sin dramatizar ni minimizar (regla ya presente en `clinicalIngestionService.js`, regla 6 del prompt de extracción, y en `clinicalReportService.js`, regla 5: "RIESGO PRIMERO").

### 6.4 Límite explícito

La IA nunca sustituye al 024, al 112 ni al psicólogo. No evalúa el riesgo con una escala clínica formal (no aplica el C-SSRS ni ninguna escala equivalente como si fuera personal sanitario), no decide el plan de intervención, y no debe prometer que "todo va a ir bien". Su función en el protocolo de riesgo es: detectar la señal, contener con calidez, dar el recurso de ayuda inmediata correcto, y escalar sin demora al profesional responsable.

---

## 7. Criterio de madurez por dimensión

Evaluable por código, sin intervención subjetiva, extendiendo el patrón ya existente en `src/lib/chatTerapeuta.js` (estados `pending` / `partial` / `complete` basados en `items.length`) con la estructura de evidencia y autoridad ya presente en `clinicalIngestionService.js` y `clinicalEngine.js` (`AuthorityLevels`).

### 7.1 Unidad de medida

Para cada dimensión `d` del árbol vital, se cuentan los **hallazgos únicos con evidencia verificada** (`evidencia` grounded, según `evidenceIsGrounded()`) presentes en `arbol_vital` con `categoria === d`, más los elementos de `desencadenantes` y `anclajes_protectores` vinculables a esa dimensión.

Se definen tres métricas por dimensión:
- `hallazgos(d)`: nº de hallazgos únicos con evidencia en la dimensión `d`.
- `ejes_cubiertos(d)`: nº de los 4 ejes 5P explorables en `d` (Predisponentes, Precipitantes, Mantenedores, Protectores) que tienen ≥ 1 hallazgo cada uno.
- `valencia_balanceada(d)`: booleano — `true` si hay al menos 1 hallazgo de valencia `recurso` Y al menos 1 de valencia `dificultad` (evita que la dimensión se dé por explorada solo con el lado problemático o solo con el lado positivo).

### 7.2 Estados y umbrales

```
PENDIENTE:
  hallazgos(d) === 0

EN_EXPLORACION:
  hallazgos(d) >= 1 AND hallazgos(d) < 3
  OR (hallazgos(d) >= 3 AND ejes_cubiertos(d) < 3)

EXPLORADA:
  hallazgos(d) >= 3
  AND ejes_cubiertos(d) >= 3
  AND valencia_balanceada(d) === true

CONSOLIDADA:
  cumple EXPLORADA
  AND al menos 1 hallazgo de la dimensión tiene AuthorityLevels.VALIDATED
      (revisado y confirmado por el psicólogo)
  AND ningún hallazgo de la dimensión tiene antigüedad > 6 meses
      sin una revisión o hallazgo nuevo posterior
```

Notas de diseño:
- El umbral de 3 hallazgos con ≥ 3 ejes cubiertos evita que una dimensión se marque como "explorada" con datos repetitivos de un solo ángulo (p. ej., solo Protectores, que es el eje más fácil y menos incómodo de obtener).
- `valencia_balanceada` es la salvaguarda contra el sesgo de positividad o negatividad: una dimensión no está "explorada" si solo se ha mirado su cara amable o solo su cara difícil.
- `CONSOLIDADA` no es requisito para que el sistema considere la dimensión suficientemente cubierta a efectos de secuenciación (sección 4): es un estado adicional que indica que, además, el profesional le ha puesto sello de validación clínica.
- Estos mismos contadores (`hallazgos`, `ejes_cubiertos`) son los que deberían alimentar la variante ampliada del cálculo de `maturityPercentage` que ya existe en `chatTerapeuta.js`, sustituyendo el criterio actual `items.length >= 2` (por categoría, sin distinguir ejes) por este más granular, sin romper la firma de la función ni el rango de salida (0-100).

### 7.3 Agregado global sugerido (para el `maturityPercentage` general del paciente)

```
madurez_global = round(
  Σ_d peso(d) * puntuacion(d)
)

donde puntuacion(d) = 
  PENDIENTE      -> 0
  EN_EXPLORACION -> 50
  EXPLORADA      -> 90
  CONSOLIDADA    -> 100

y peso(d) = 1 / 6 para las 6 dimensiones (peso igual, salvo que el
psicólogo marque una dimensión como prioritaria para este paciente,
en cuyo caso su peso puede ajustarse — extensión futura, no incluida
en el cálculo base).
```

---

## Fuentes consultadas

Toda afirmación empírica de este documento está respaldada por al menos una de las siguientes fuentes, localizadas mediante búsqueda web el 31/08/2026. No se ha incluido ninguna referencia no verificada en esta búsqueda.

- [024. Línea de atención a la conducta suicida — Ministerio de Sanidad](https://www.sanidad.gob.es/linea024/home.htm) — gratuita, confidencial, 24h/365 días, atendida por personal experto.
- [Teléfono 024 — Ayuntamiento de Madrid](https://www.madrid.es/portales/munimadrid/es/Inicio/El-Ayuntamiento/Moratalaz/Telefono-024-Linea-de-atencion-a-la-conducta-suicida/) 
- [Teléfono 016: qué es y cómo funciona — La Moncloa](https://www.lamoncloa.gob.es/serviciosdeprensa/notasprensa/igualdad/paginas/2026/telefono-016-que-es.aspx) — gratuito, confidencial, 24h, no aparece en factura, disponible también por WhatsApp (600 000 016).
- [El 016: cómo funciona y a quién va dirigido — Maldita.es](https://maldita.es/malditateexplica/20230802/016-como-funciona-a-quien-va-dirigido/)
- Dazzi, T. et al. (2014). "Does asking about suicide and related behaviours induce suicidal ideation? What is the evidence?" *Psychological Medicine*. [Cambridge Core](https://www.cambridge.org/core/journals/psychological-medicine/article/does-asking-about-suicide-and-related-behaviours-induce-suicidal-ideation-what-is-the-evidence/FCAEE9E5BC840D76CF10AEBECD921AC9) / [PubMed](https://pubmed.ncbi.nlm.nih.gov/24998511/?dopt=Abstract) — ningún estudio revisado halló aumento estadísticamente significativo de ideación suicida al preguntar directamente por ella.
- [SAMHSA — Trauma-Informed Approaches and Programs](https://www.samhsa.gov/mental-health/trauma-violence/trauma-informed-approaches-programs) — los 6 principios: seguridad; confianza y transparencia; apoyo entre iguales; colaboración y horizontalidad; empoderamiento, voz y elección; cuestiones culturales, históricas y de género.
- [The 6 Core Principles of Trauma Informed Care — CSP Online](https://online.csp.edu/resources/article/principles-of-trauma-informed-care/)
- [Understanding Trauma-Informed Care: Real-World Applications — Miracles in Action](https://www.miraclesinaction.info/blog/2026/february/understanding-trauma-informed-care-approaches-re/) — pedir permiso antes de preguntar por trauma; no es necesario obtener el detalle del hecho, sino entender el impacto actual.
- [A brief outline about Trauma history within informal assessments — comorbidityguidelines.org.au](https://comorbidityguidelines.org.au/informal-assessment/trauma-history) — puede convenir posponer la indagación de trauma varias semanas, hasta que el paciente se sienta seguro y haya vínculo terapéutico.
- [How to Use OARS Skills in Motivational Interviewing — Relias](https://www.relias.com/blog/oars-motivational-interviewing) — Open questions, Affirmations, Reflective listening, Summaries.
- [Motivational Interviewing: OARS — International Society of Substance Use Professionals (ISSUP)](https://www.issup.net/knowledge-share/resources/2019-10/motivational-interviewing-open-questions-affirmation-reflective)
- [5 Ps Case Formulation Framework — Supanote](https://www.supanote.ai/blog/5-ps-case-formulation-framework-a-clinical-guide) — Presenting, Predisposing, Precipitating, Perpetuating, Protective.
- [The 5 Ps Case Formulation — Clinical Documentation Library](https://clinicaldocslibrary.com/guides/five-ps-formulation/)
- ["Taking a turn for the better: Conversation redirection throughout the course of mental-health therapy" — Cornell NLP Group / arXiv 2410.07147](https://www.cs.cornell.edu/~cristian/Redirection_in_Therapy_files/redirection_in_mental_health_therapy.pdf) — la redirección efectiva es un acto compartido que requiere aceptación del paciente, no una imposición del terapeuta.
- [Silence in Psychotherapy — Psychology Today (2025)](https://www.psychologytoday.com/us/blog/things-to-consider/202504/silence-in-psychotherapy)
- [How to Use Silence in Therapy & Counseling — PositivePsychology.com](https://positivepsychology.com/silence-in-therapy/) — el silencio requiere alianza terapéutica previa, debe ser breve y monitorizado, y es menos adecuado con pacientes muy ansiosos.
- [AEPD — ¿Cuáles son las bases de legitimación para el tratamiento de las categorías especiales de datos?](https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/5-bases-legitimadoras-del-tratamiento/FAQ-0215-cuales-son-las-bases-de-legitimacion-para-el-tratamiento-de-las-categorias-especiales-de-datos) — art. 9 RGPD, consentimiento explícito para datos de salud.
- [Categorías especiales de datos (art. 9 RGPD) — Legiscope](https://www.legiscope.com/blog/categorias-especiales-datos-rgpd.html)
- Escala Columbia de severidad suicida (C-SSRS), versión en español — citada solo para contextualizar la lógica de cribado escalonado (de ideación pasiva a plan/medios), no se recomienda su aplicación literal por la IA: [Validación de la versión en español de la C-SSRS — Revista de Psiquiatría y Salud Mental / Elsevier](https://www.elsevier.es/es-revista-spanish-journal-psychiatry-mental-health-286-articulo-validacion-version-espanol-columbia-suicide-severity-S1888989116000616). Este documento NO recomienda que la IA administre el C-SSRS como escala formal (ver 6.4): se cita únicamente como referencia de la progresión clínica de severidad de la ideación (pasiva → activa → plan → intención → preparación) que informa los niveles 1-3 del protocolo de riesgo.

**Nota de honestidad:** no se han encontrado ni citado directrices deontológicas específicas y ya publicadas del Consejo General de la Psicología de España sobre IA conversacional en terapia — la búsqueda confirma que el Código Deontológico está en proceso de actualización con un capítulo de IA previsto para 2026, pero no localicé el texto final de esas directrices. Cualquier alineación de este guion con el futuro código deontológico del COP debe revisarse cuando se publique.

---

## Notas de implementación (no forman parte del guion en sí)

- Este documento está pensado para convertirse en un array de objetos `bloque` → `subbloque` → `{dimension, eje_5p, datos_a_recoger[], preguntas[]}`, donde cada `pregunta` es `{texto, repreguntas: [texto, texto]}`.
- Los campos `dimension` y `eje_5p` de cada subbloque son los que permiten al motor de secuenciación (sección 4) decidir qué ofrecer en cada conversación según el estado de madurez (sección 7) y el nivel de vínculo.
- El Bloque 0 y los mensajes de la sección 6 no deberían randomizarse ni parafrasearse por la IA en tiempo real: son texto literal aprobado, no prompts de generación libre, precisamente por su sensibilidad legal y clínica.
- El resto del banco de preguntas (secciones 1-2) sí está pensado como banco de partida para el modelo conversacional, no como guion rígido palabra por palabra — de ahí la regla 2 y 4 de la sección 3 (seguir el hilo, reconducir sin cortar).
