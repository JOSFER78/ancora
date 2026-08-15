import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { invokeChatTerapeuta } from '../lib/chatTerapeuta';
import { MemoryRepositoryFactory } from '../infrastructure/storage/MemoryRepositoryFactory';
import { CognitiveMemoryEngine } from '../services/memory/CognitiveMemoryEngine';
import {
  Calendar,
  Brain,
  Clock,
  PlusCircle,
  AlertOctagon,
  RefreshCw,
  FileText,
  UploadCloud,
  FolderOpen,
  BookOpen,
  Trash2,
  Eye,
  BookOpenCheck,
  Plus,
  CheckCircle2,
  X,
  Activity,
  Mic,
  MicOff,
  Video,
  Search,
  Sparkles
} from 'lucide-react';

const DEFAULT_RESOURCES = [
  {
    autor: "Dr. Bessel van der Kolk",
    titulo: "El cuerpo lleva la cuenta: Cerebro, mente y cuerpo en la superación del trauma (Libro)",
    tipo: "libro",
    sintoma: "Trauma Complejo y Regulación Somática",
    justificacion: "Detalla científicamente cómo las experiencias traumáticas de la infancia se almacenan físicamente en el cuerpo y alteran de forma permanente el sistema de alerta (amígdala), provocando respuestas involuntarias de lucha/huida/parálisis.",
    adaptacion: "Cuando experimentas pánico y parálisis (freeze) ante el estrés agudo, no es una decisión racional; es tu cuerpo recreando físicamente la indefensión. Regular primero el cuerpo mediante estímulos somáticos es imprescindible antes de razonar.",
    practica: "Choque térmico somático: Sostener cubos de hielo en las manos o lavar la cara con agua helada por 30 segundos ante picos de pánico y sobrecarga emocional."
  },
  {
    autor: "Dr. Russell Barkley",
    titulo: "Tomar el control del TDAH en la edad adulta: Guía clínica de autorregulación (Libro & Estudios)",
    tipo: "estudio",
    sintoma: "Funciones Ejecutivas e Impulsividad",
    justificacion: "Demuestra que las dificultades del TDAH no son por falta de conocimiento o de voluntad, sino por un déficit neurobiológico en la inhibición de conductas en tiempo real y la ceguera temporal.",
    adaptacion: "La fuerza de voluntad tiende a fallar bajo estrés intenso. No se puede depender del autocontrol puramente subjetivo en momentos de sobrecarga; la contención eficaz requiere un andamiaje externo estructurado.",
    practica: "Mantener rutinas estructuradas con recordatorios externos no manipulables y división de tareas complejas en micro-bloques de 15 minutos."
  },
  {
    autor: "Dra. Marian Rojas Estapé",
    titulo: "Cortisol, Estrés Crónico y Bucle de Alerta Límbica (Charla / Video)",
    tipo: "video",
    sintoma: "Cortisol Alto y Visión de Túnel ante la Sobrecarga",
    justificacion: "Explica la fisiología del estrés: la mente interpreta la sobrecarga continua como una amenaza física. Inunda el organismo de cortisol y bloquea las decisiones lógicas de la corteza prefrontal.",
    adaptacion: "Tras un episodio de estrés agudo, el cortisol permanece elevado por horas. Ignorarlo arrastra a la sobreexigencia y el agotamiento. Es indispensable desengancharse físicamente de las pantallas.",
    practica: "Pausa de desconexión activa: Levantarse y caminar al aire libre durante 15 minutos tras completar un bloque de trabajo intenso."
  },
  {
    autor: "Dr. Jeffrey Young",
    titulo: "Terapia de Esquemas: Desmantelar Patrones de Autosabotaje (Manual)",
    tipo: "libro",
    sintoma: "Autosabotaje por Estafa y Bucle de Deudas",
    justificacion: "Describe cómo los mensajes de minusvalía infantil activan esquemas inconscientes de 'Fracaso' y 'Exclusión'. El paciente sabotea activamente sus ganancias para confirmar su identidad herida.",
    adaptacion: "Identificar que ganar dinero te genera miedo de 'dejar de ser Emilio, el que está en deudas'. Quemas tus ganancias del día 4 para autocastigarte y cumplir tu profecía. Verbalizar el esquema le resta poder.",
    practica: "Escribir en el diario al iniciar: 'Hoy reconozco mi esquema de fracaso. Acepto mi derecho a ganar y elijo parar la operativa tras alcanzar mi objetivo de R1'."
  },
  {
    autor: "Dra. Ingeborg Bosch",
    titulo: "Integración de la Realidad del Pasado (PRI): Desmantelar la Agorafobia (Ensayo)",
    tipo: "ensayo",
    sintoma: "Agorafobia como Defensa Deflectora de Trauma",
    justificacion: "La agorafobia es una defensa de 'temor de desvío': el cerebro proyecta el dolor insoportable de la falta de protección infantil hacia el miedo físico a salir al exterior o los espacios abiertos.",
    adaptacion: "El peligro real no está afuera, en la calle o en la plaza. Está en revivir la indefensión original de tu infancia. Entender esto te permite recordarle a tu cuerpo que hoy eres un adulto independiente y seguro.",
    practica: "Exposición gradual controlada: salir al portal de casa durante 5 minutos practicando respiraciones de descompresión (4s inhalar, 8s exhalar) dos veces al día."
  },
  {
    autor: "Dr. Gabor Maté",
    titulo: "Cuando el cuerpo dice NO: El precio del estrés oculto (Estudio Clínico)",
    tipo: "libro",
    sintoma: "Psicopatología Somática y Deudas",
    justificacion: "Vincula el estrés emocional reprimido y el autosabotaje crónico con la manifestación de síntomas físicos y la fatiga mental severa. El estrés constante por deudas drena la dopamina, empeorando el TDAH.",
    adaptacion: "La deuda constante es un estresor fisiológico invisible que te empuja a tomar decisiones financieras desesperadas para buscar dopamina. Romper el bucle requiere priorizar la calma física sobre la urgencia mental.",
    practica: "Pausa dopaminérgica: desconexión digital absoluta de pantallas de trading a partir de las 18:00 para re-equilibrar el sistema de recompensa cerebral."
  },
  {
    autor: "Dr. Richard Schwartz",
    titulo: "Sistemas de Familia Interna (IFS): Sanar las Partes Protectoras Exiliadas (Manual)",
    tipo: "libro",
    sintoma: "Partes en Conflicto e Ideación Suicida",
    justificacion: "Explica cómo la mente se divide en 'partes'. La ideación suicida o el autosabotaje extremo suelen ser partes 'bombero' que intentan apagar un dolor emocional intolerable mediante medidas destructivas extremas.",
    adaptacion: "Cuando surjan pensamientos intrusivos o de autodestrucción, no los juzgues como maldad propia; reconócelos como una parte protectora asustada que intenta apagar el dolor de las deudas. Agradécele su intención de protegerte pero dile que hoy tú estás a cargo.",
    practica: "Diálogo interno IFS escrito: Sentar y escribir qué siente esa parte asustada, escuchándola sin juzgar y ofreciéndole calma desde el 'Self' adulto."
  },
  {
    autor: "Dr. Stephen Porges",
    titulo: "La Teoría Polivagal: Neurobiología de la Seguridad y Regulación (Estudio)",
    tipo: "estudio",
    sintoma: "Regulación del Nervio Vago en Agorafobia",
    justificacion: "Describe cómo el sistema nervioso autónomo tiene tres estados. En la agorafobia, el cuerpo entra en estado de colapso dorsal (cierre completo). Reactivar la vía ventral es clave para la seguridad.",
    adaptacion: "Salir a la calle requiere activar el estado vagal ventral (seguridad social). Escuchar música relajante, sonreír voluntariamente o hablar con alguien de confianza activa los nervios craneales que mitigan el pánico.",
    practica: "Reactivación ventral: cantar, tararear o realizar gárgaras de agua tibia durante 2 minutos antes de salir de casa para estimular mecánicamente el nervio vago."
  },
  {
    autor: "Dr. Daniel Kahneman",
    titulo: "Pensar rápido, pensar despacio: Sesgos cognitivos de escala y balance (Libro)",
    tipo: "libro",
    sintoma: "Ceguera de Escala y Gestión Financiera",
    justificacion: "Expone la teoría de las perspectivas: las pérdidas duelen el doble de lo que agradan las ganancias. Explica la ceguera de escala, donde montos grandes pierden sentido bajo fatiga ejecutiva.",
    adaptacion: "En rachas perdedoras, el cerebro de Emilio pierde la noción del valor real del dinero (ceguera de escala). Tratas una cuenta de $10,000 como si fueran centavos. Necesitas anclar los números a objetos reales de tu día a día.",
    practica: "Conversión a horas de trabajo: Traducir cada pérdida en el diario al número de horas que necesitas trabajar en tu empleo protegido para recuperarlo físicamente."
  },
  {
    autor: "Asociación Americana de Psiquiatría (APA)",
    titulo: "Guía de Tratamiento Clínico Basado en Evidencia para el Pánico y Agorafobia (Directriz)",
    tipo: "estudio",
    sintoma: "Protocolos de Exposición In Vivo Graduada",
    justificacion: "Establece científicamente que la evitación de los espacios temidos refuerza el circuito del miedo en la amígdala. Solo la exposición sistemática y graduada sin evitación cognitiva extingue la fobia.",
    adaptacion: "Si evitas salir hoy porque tienes ansiedad, estás reforzando en tu cerebro que la calle es peligrosa. Debes exponerte aunque haya ansiedad, permitiendo que la curva del pánico suba y bucle de forma natural.",
    practica: "Desensibilización sistemática: Registrar en una libreta el nivel de ansiedad (0-10) cada 2 minutos al estar parado en la acera exterior, observando cómo remite sola tras 10 minutos."
  },
  {
    autor: "Dra. Kristin Neff",
    titulo: "Self-Compassion: El poder de la autocompasión frente a la culpa extrema (Estudio)",
    tipo: "ensayo",
    sintoma: "Culpa por Pérdidas e Ideación Suicida",
    justificacion: "Demuestra que la autocrítica feroz tras un fracaso (como perder el sueldo en el trading) bloquea el aprendizaje y empuja al cerebro a conductas de autodestrucción extrema como el suicidio.",
    adaptacion: "Castigarte verbalmente por haber fallado solo incrementa la desregulación que te llevó a cometer el error en primer lugar. Tratarte con compasión es una herramienta de supervivencia clínica fundamental.",
    practica: "Carta autocompasiva: Escribir una breve carta dirigida a ti mismo hablándote con el mismo cariño y comprensión con el que le hablarías a tu mejor amigo si estuviera pasando por tu situación."
  },
  {
    autor: "Dr. Richard Davidson",
    titulo: "El perfil emocional de tu cerebro: Neurociencia afectiva y resiliencia (Estudio)",
    tipo: "estudio",
    sintoma: "Resiliencia / Prevención y Meditación",
    justificacion: "Mide cómo los circuitos de la corteza prefrontal izquierda determinan la velocidad con la que nos recuperamos de una crisis emocional o un stop financiero doloroso.",
    adaptacion: "El entrenamiento en atención plena (mindfulness) engrosa físicamente la corteza prefrontal izquierda y reduce el tamaño de la amígdala hiperactiva. Es gimnasia mental preventiva.",
    practica: "Atención plena a la respiración: 5 minutos al día de meditación sentada enfocada únicamente en sentir el aire entrar y salir por la nariz, regresando el foco sin juzgar cada vez que divague."
  },
  {
    autor: "Dr. Martin Seligman",
    titulo: "Indefensión aprendida: Sobre el fracaso crónico y el autosabotaje adaptativo (Libro)",
    tipo: "libro",
    sintoma: "Fracaso Crónico e Indefensión Aprendida",
    justificacion: "Explica cómo la exposición reiterada a crisis incontrolables (estafas del pasado, pérdidas sistemáticas, acumulación de deudas) apaga la iniciativa de cambio del sujeto, llevándole a actuar con indefensión ante la creencia irracional de que haga lo que haga nada cambiará.",
    adaptacion: "Emilio boicotea sus rachas positivas porque su cerebro ha integrado el rol de 'deudor atrapado' como su única zona de seguridad familiar. Superar esto exige recuperar pequeños umbrales de agencia personal diaria.",
    practica: "Reatribución de agencia: Registrar en el diario 3 hitos sencillos controlados exclusivamente por tus decisiones (ej. ordenar la mesa, no abrir gráficos a destiempo, dar 10 pasos en la calle) y celebrarlos."
  },
  {
    autor: "Dr. Hans Selye",
    titulo: "El estrés de la vida: Fisiología de la Fatiga Adrenal y Síndrome de Adaptación (Estudio Clínico)",
    tipo: "estudio",
    sintoma: "Fatiga Adrenal y Agotamiento del Sistema Nervioso",
    justificacion: "Mapea las fases de la respuesta al estrés (alarma, resistencia, agotamiento). El estrés financiero continuado consume las reservas de cortisol y aldosterona, induciendo fatiga crónica y desregulación emocional severa.",
    adaptacion: "La anhedonia o desgana de Emilio no es pereza; es fatiga física extrema de su eje HPA debido a años de sobre-excitación y preocupación constante por deudas. Requiere recuperación biológica activa.",
    practica: "Protocolo de descompresión: 10 minutos de elevación de piernas a 90 grados en pared acompañado de exhalaciones largas prolongadas después de la operativa de mercado para inducir el tono parasimpático."
  },
  {
    autor: "Dr. Walter Mischel",
    titulo: "La prueba del malvavisco: Descuento hiperbólico y el andamiaje del autocontrol (Libro & Estudios)",
    tipo: "libro",
    sintoma: "Sesgo de Presentismo y TDAH",
    justificacion: "Demuestra que bajo tensión emocional, el cerebro con TDAH prioriza el alivio de cortísimo plazo (ej. ingresar dinero impulsivamente el día de cobro para operar) frente al beneficio de largo plazo, por fallas en la memoria ejecutiva de trabajo.",
    adaptacion: "El día 4 del mes sufres de amnesia emocional del dolor de deudas. La dopamina del cobro secuestra tu cerebro. Necesitas filtros de bloqueo físico antes de que el dinero esté disponible.",
    practica: "Técnica del retraso diferido: Configurar en las cuentas bancarias transferencias automatizadas inamovibles hacia la cuenta de pago de deudas el mismo día 3 del mes, previniendo la autogestión."
  },
  {
    autor: "Dr. Aaron T. Beck",
    titulo: "Terapia cognitiva de la desesperanza y la ideación suicida (Manual)",
    tipo: "ensayo",
    sintoma: "Ideación Suicida Crónica y Desesperanza del 2025",
    justificacion: "Demuestra que la desesperanza (creencia rígida de que el futuro no puede mejorar y de que el sujeto es una carga permanente) es el predictor clínico directo de la ideación suicida. Para desactivarla, se debe desmantelar racionalmente el sesgo catastrofista.",
    adaptacion: "Cuando sientes la urgencia de desaparecer, es una parte de tu mente colapsada ante la presión financiera. Recuerda que las deudas son un problema matemático lineal y resoluble, no una condena biológica ni moral.",
    practica: "Ficha de anclaje de emergencia: Portar en la cartera una tarjeta física escrita con la frase: 'Las deudas se resuelven con sumas y restas en el tiempo. Mi dolor es una tormenta en la amígdala que pasará en 20 minutos si aplico frío físico'."
  }
];

const EXPANDED_CLINICAL_DOSSIERS = {
  "vanderkolk": "=== FICHA DE INVESTIGACIÓN CLÍNICA DETALLADA ===\n\n1. MARCO CONCEPTUAL Y TESIS CENTRAL:\nLa tesis central de Bessel van der Kolk en \"El cuerpo lleva la cuenta\" es que el trauma no es simplemente una serie de eventos cognitivos o memorias dolorosas del pasado que se pueden resolver con el raciocinio; es un cambio biológico y físico persistente que se almacena en el cuerpo. Las experiencias traumáticas tempranas reconfiguran el sistema nervioso del individuo, dejándolo atrapado en un estado de hiperalerta y alarma fisiológica crónica. Esta impronta somática provoca que situaciones inocuas del presente se experimenten en el cuerpo físico como una amenaza inminente para la supervivencia personal.\n\n2. EVIDENCIA CIENTÍFICA Y HALLAZGOS CLAVE:\n- Estudios con tomografía por emisión de positrones (PET) en pacientes traumatizados revelan que cuando reviven el trauma, el córtex prefrontal dorsolateral izquierdo (responsable de situar los eventos en el espacio y el tiempo) se desactiva por completo, provocando una desorientación temporal absoluta donde el pasado se siente como el presente.\n- Se observa una desconexión severa en el área de Broca (centro del lenguaje articulado), lo que impide verbalizar la experiencia de manera lógica y coherente.\n- El hemisferio derecho, que procesa las sensaciones visuales y somáticas rudimentarias, se enciende violentamente, demostrando que el trauma se experimenta como terror corporal mudo.\n\n3. MECANISMOS NEUROBIOLÓGICOS / PSICOLÓGICOS:\n- Hipersensibilización de la Amígdala: Actúa como un detector de humo averiado que reacciona con pánico (liberando adrenalina y cortisol) ante la menor señal que guarde parecido con el trauma original.\n- Falla del Córtex Prefrontal Medio (CPFm): La estructura encargada de inhibir la respuesta amigdalina está atrofiada o bloqueada, imposibilitando el autocontrol cognitivo voluntario.\n- Respuesta de Inmovilización Dorsal (Freeze): El sistema autónomo se colapsa ante la indefensión, induciendo analgesia y despersonalización somática profunda (se apaga el sentido del yo físico).\n\n4. APLICACIÓN OPERATIVA Y PROPUESTA DE EJERCICIO:\nEl pánico e incapacidad de cerrar ganancias en Emilio es la respuesta corporal de parálisis (freeze) inducida por la amígdala. Bajo tensión, Emilio sufre de ceguera prefrontal.\n- Protocolo de Exposición y Reset Térmico: Utilizar cubos de hielo en las manos o inmersión facial en agua helada (30s) para inducir el reflejo de buceo de los mamíferos. Esto estimula el tono vagal, ralentiza el pulso y reactiva la CPFm, sacando a Emilio del secuestro amigdalino en segundos.",
  "barkley": "=== FICHA DE INVESTIGACIÓN CLÍNICA DETALLADA ===\n\n1. MARCO CONCEPTUAL Y TESIS CENTRAL:\nEl Dr. Russell Barkley postula que el TDAH en el adulto no es una anomalía leve de la atención, sino un trastorno grave del neurodesarrollo que afecta directamente a la inhibición conductual y al sistema de funciones ejecutivas de la corteza prefrontal. La tesis central es que el TDAH produce una disfunción en la auto-regulación a lo largo del tiempo, induciendo una \"miopía temporal\" severa donde el sujeto es constitucionalmente ciego al futuro a largo plazo. Su conducta se rige de forma exclusiva por las consecuencias inmediatas y la búsqueda urgente de gratificación/alivio en el presente.\n\n2. EVIDENCIA CIENTÍFICA Y HALLAZGOS CLAVE:\n- Las investigaciones cuantitativas muestran que los adultos con TDAH tienen un déficit estructural del 30% al 40% en la memoria de trabajo no verbal (visualización interna) y verbal (auto-instrucciones habladas).\n- La capacidad de demorar recompensas (descuento hiperbólico) está drásticamente alterada. Bajo tensión emocional o aburrimiento, prefieren un beneficio menor inmediato (ej. operar impulsivamente) frente a uno mayor diferido (ej. rentabilidad mensual).\n- Los planes cognitivos y la autogestión de voluntad fallan de forma sistemática en el punto de rendimiento (\"point of performance\") real.\n\n3. MECANISMOS NEUROBIOLÓGICOS / PSICOLÓGICOS:\n- Hipofunción en los circuitos fronto-estriatales que conectan la corteza prefrontal dorsolateral con los ganglios basales.\n- Regulación deficiente de la neurotransmisión de dopamina y noradrenalina. La corteza prefrontal carece del nivel de base necesario para sostener el foco cognitivo en tareas abstractas a largo plazo, buscando picos dopaminérgicos bruscos mediante la impulsividad.\n- Incapacidad para inhibir las respuestas prepotentes motoras, lo que se traduce en sobreoperación y ruptura de reglas del trading.\n\n4. APLICACIÓN OPERATIVA Y PROPUESTA DE EJERCICIO:\nPara Emilio, la fuerza de voluntad subjetiva o las buenas intenciones de seguir su plan de trading son biológicamente inútiles en momentos críticos. Necesita andamiajes físicos externos no manipulables.\n- Férula Operativa Externa (Equity-Killer): Configurar un script automático local que liquide todas las posiciones abiertas y bloquee el acceso a la plataforma por 24 horas si se alcanza el límite de pérdida diaria de 1R. Las claves del router o de la plataforma deben ser custodiadas por un tercero o un gestor de contraseñas bloqueado temporalmente.",
  "rojasestape": "=== FICHA DE INVESTIGACIÓN CLÍNICA DETALLADA ===\n\n1. MARCO CONCEPTUAL Y TESIS CENTRAL:\nLa Dra. Marian Rojas Estapé analiza el impacto devastador de la intoxicación crónica por cortisol. Su tesis principal es que el organismo humano es incapaz de distinguir entre una amenaza física real de vida o muerte (ej. el ataque de un depredador) y una amenaza puramente psicológica o simbólica (ej. la preocupación constante por deudas, la pérdida de dinero en bolsa, o la posibilidad del fracaso social). Ambas situaciones disparan con la misma intensidad el bucle de alerta límbica y la liberación de la hormona del estrés.\n\n2. EVIDENCIA CIENTÍFICA Y HALLAZGOS CLAVE:\n- La liberación continuada de cortisol deteriora la neurogénesis en la zona subgranular del hipocampo y daña de forma directa la microglía cerebral, induciendo estados inflamatorios sistémicos subclínicos.\n- Se produce una atrofia de las ramificaciones dendríticas de las neuronas prefrontales, lo que correlaciona de manera directa con fallos de memoria, pérdida de foco, irritabilidad crónica e incapacidad para autorregular los impulsos agresivos o de huida.\n\n3. MECANISMOS NEUROBIOLÓGICOS / PSICOLÓGICOS:\n- Activación persistente del Eje Hipotálamo-Hipófisis-Adrenal (HPA), que inunda el torrente sanguíneo de cortisol e inhibe funciones no vitales (como la digestión y el sistema inmune).\n- Fenómeno de \"Visión de Túnel\": Bajo cortisol elevado, la irrigación sanguínea se desvía de las áreas lógicas de la corteza prefrontal hacia las zonas basales de supervivencia. El sujeto pierde la capacidad de tener perspectiva del balance general del dinero y se enfoca de manera obsesiva en el trade inmediato.\n\n4. APLICACIÓN OPERATIVA Y PROPUESTA DE EJERCICIO:\nEmilio experimenta este bucle después de un trade perdedor. El aumento del cortisol inhibe su capacidad lógica y le empuja a la sobreoperación impulsiva para \"vengar\" la pérdida y apagar la señal física de angustia.\n- Protocolo One and Done y Marcha Parasimpática: Tras cerrar un trade (sea ganador o perdedor), apagar inmediatamente el monitor. Realizar 15 minutos de caminata al aire libre con atención en la marcha, forzando la respiración rítmica (inhalar en 4 pasos, exhalar en 8 pasos). Esto permite metabolizar mecánicamente el cortisol libre y restaurar el flujo sanguíneo prefrontal.",
  "young": "=== FICHA DE INVESTIGACIÓN CLÍNICA DETALLADA ===\n\n1. MARCO CONCEPTUAL Y TESIS CENTRAL:\nLa Terapia de Esquemas de Jeffrey Young propone que los Esquemas Tempranos Desadaptativos (ETD) son patrones cognitivos, emocionales y de memoria extremadamente rígidos que se originan durante la infancia o adolescencia como resultado de la insatisfacción sistemática de necesidades emocionales básicas (tales como la seguridad, el afecto, la autonomía y los límites límites sanos). Estos esquemas actúan como plantillas de procesamiento inconsciente en la adultez, empujando al individuo a comportamientos autodestructivos y autosabotajes con el fin inconsciente de confirmar su dolorosa identidad de origen.\n\n2. EVIDENCIA CIENTÍFICA Y HALLAZGOS CLAVE:\n- Estudios clínicos longitudinales muestran que esquemas como \"Fracaso\", \"Privación Emocional\" y \"Vulnerabilidad al daño\" correlacionan de manera directa con el autosabotaje conductual recurrente en la edad adulta.\n- El cerebro humano tiene sesgo de coherencia: prefiere mantener un esquema de dolor familiar antes que experimentar la disonancia cognitiva de ser exitoso o seguro. El éxito se percibe inconscientemente como una amenaza a la lealtad familiar o al guion vital aprendido.\n\n3. MECANISMOS NEUROBIOLÓGICOS / PSICOLÓGICOS:\n- Activación de los \"Modos de Esquema\": Cuando el sujeto se expone a una situación de estrés (ej. ganancias acumuladas en el trading), se activa un modo defensivo (ej. el \"Niño Vulnerable\" o el \"Padre Punitivo\") que boicotea de forma repentina el logro, quemando el dinero para retornar al estado de seguridad del esquema original: \"ser el deudor desprotegido\".\n\n4. APLICACIÓN OPERATIVA Y PROPUESTA DE EJERCICIO:\nEmilio sabotea sus rachas de ganancias porque tener dinero acumulado colisiona con su esquema nuclear de Fracaso y Deuda Crónica. Su cerebro sabotea las ganancias para retornar al rol seguro de víctima estafada e indefensa.\n- Tarjeta de Confrontación de Esquemas de Young: Escribir una tarjeta física de bolsillo y leerla antes de cada sesión operativa: \"Hoy reconozco que mi impulso de tomar trades absurdos y arriesgar de más es mi Esquema de Fracaso intentando mantenerme en el rol familiar del deudor. Mi adulto sano sabe que merezco la estabilidad. Elijo cerrar mi plataforma al alcanzar 1R y aceptar la incomodidad de la ganancia\".",
  "bosch": "=== FICHA DE INVESTIGACIÓN CLÍNICA DETALLADA ===\n\n1. MARCO CONCEPTUAL Y TESIS CENTRAL:\nIngeborg Bosch, creadora de la Integración de la Realidad del Pasado (PRI), sostiene que los trastornos de ansiedad contemporáneos, y específicamente la agorafobia, no son causados por los espacios físicos abiertos en sí mismos, sino que representan un mecanismo de defensa secundario del cerebro diseñado para desviar o \"deflectar\" el dolor y la indefensión originales vividos en la infancia (trauma del desarrollo). Al proyectar la indefensión interna hacia el exterior (\"la calle o la plaza es el peligro\"), el cerebro del adulto crea una ilusión de control: si me quedo en casa, estaré a salvo.\n\n2. EVIDENCIA CIENTÍFICA Y HALLAZGOS CLAVE:\n- Estudios clínicos bajo la perspectiva del trauma complejo apoyan que la agorafobia presenta una comorbilidad altísima con historias de negligencia emocional o falta de protección parental en los primeros años de vida.\n- La agorafobia funciona como una evitación cognitiva y conductual que impide la habituación orgánica del pánico, atrapando al sujeto en un bucle donde cada evitación valida e incrementa el circuito del miedo en la amígdala.\n\n3. MECANISMOS NEUROBIOLÓGICOS / PSICOLÓGICOS:\n- Proyección Somática y Temor de Desvío: El dolor intolerable de la desprotección infantil original es bloqueado por las defensas del ego. Este dolor es canalizado hacia una fobia física exteriorizable.\n- Hiperreactividad vegetativa simpática: El sujeto sufre de hiperventilación, taquicardia y desrealización no por un fallo físico, sino porque su sistema nervioso ha interpretado que salir de la zona de seguridad equivale a la muerte infantil original.\n\n4. APLICACIÓN OPERATIVA Y PROPUESTA DE EJERCICIO:\nLa agorafobia de Emilio se disparó tras las estafas y la acumulación de deudas. Su mente usa la fobia a la calle como un escudo para desviar el dolor insoportable de la quiebra financiera y la pérdida de control de su vida laboral.\n- Ejercicio PRI de Desmantelamiento de Proyecciones: Al sentir el impulso de evitar salir, Emilio debe sentarse y verbalizar en voz alta: \"El portal o la calle no son peligrosos para mi yo adulto de 2026. El peligro real ya pasó; ocurrió en mi infancia cuando estaba indefenso. Hoy tengo piernas, dinero y recursos para protegerme a mí mismo. Elijo dar 20 pasos fuera de casa sintiendo mis pies firmes en el suelo\".",
  "mate": "=== FICHA DE INVESTIGACIÓN CLÍNICA DETALLADA ===\n\n1. MARCO CONCEPTUAL Y TESIS CENTRAL:\nEl Dr. Gabor Maté postula en su obra \"Cuando el cuerpo dice NO\" que el estrés psicológico no es un fenómeno abstracto mental, sino una alteración fisiológica directa que daña los sistemas inmunológico, hormonal y nervioso. La incapacidad crónica de expresar sanamente las necesidades emocionales, de poner límites físicos y de afrontar las pérdidas de manera regulada fuerza al cuerpo físico a manifestar enfermedades o síntomas somáticos crónicos. El cuerpo somatiza la defensa que la mente ha sido incapaz de verbalizar o gestionar racionalmente.\n\n2. EVIDENCIA CIENTÍFICA Y HALLAZGOS CLAVE:\n- Las investigaciones en psiconeuroinmunología demuestran una relación directa entre el estrés crónico prolongado (provocado por deudas crónicas o humillaciones laborales) y la atrofia del timo, la desregulación de las citocinas inflamatorias y la disminución de la sensibilidad a los receptores de dopamina en el cuerpo estriado.\n- El agotamiento del sistema dopaminérgico agrava de manera exponencial el déficit de atención (TDAH), incrementando la búsqueda desesperada de dopamina rápida (operaciones impulsivas, juego).\n\n3. MECANISMOS NEUROBIOLÓGICOS / PSICOLÓGICOS:\n- Fatiga Crónica del Eje HPA: Tras años de excitación constante bajo amenaza, las glándulas suprarrenales sufren de una incapacidad para producir niveles homeostáticos de cortisol, derivando en fatiga crónica, apatía motora profunda y un estado constante de anhedonia.\n- Desregulación dopaminérgica: La falta de dopamina libre en el espacio sináptico apaga la motivación intrínseca, haciendo que las tareas cotidianas se sientan imposibles.\n\n4. APLICACIÓN OPERATIVA Y PROPUESTA DE EJERCICIO:\nLa fatiga y desgana extrema de Emilio son la señal de que su cuerpo le está forzando a parar ante el estrés acumulado por deudas. No es flojera o falta de carácter; es el agotamiento biológico de su eje suprarrenal.\n- Protocolo de Ayuno de Dopamina Operativa: Desconexión digital total de todas las pantallas de trading, foros y métricas de mercado a partir de las 18:00 horas todos los días. Dedicar esas horas a descansar en penumbra, realizar estiramientos somáticos y permitir que el sistema de recompensa cerebral reduzca de manera natural sus umbrales de base.",
  "schwartz": "=== FICHA DE INVESTIGACIÓN CLÍNICA DETALLADA ===\n\n1. MARCO CONCEPTUAL Y TESIS CENTRAL:\nEl modelo de Sistemas de Familia Interna (IFS) de Richard Schwartz sostiene que la mente no es un ente monolítico, sino un sistema dinámico compuesto por múltiples subpersonalidades o \"partes\", las cuales orbitan alrededor de una esencia sana y sabia llamada el \"Self\" (el Sí mismo). Los traumas infantiles fuerzan a estas partes a adoptar roles extremos y destructivos para proteger al sistema de experimentar de nuevo el dolor de las heridas de rechazo y abandono originales.\n\n2. EVIDENCIA CIENTÍFICA Y HALLAZGOS CLAVE:\n- Estudios empíricos sobre IFS en pacientes con trauma severo muestran que las conductas autodestructivas extremas (como la ideación suicida crónica o la automutilación) están dirigidas por subpersonalidades protectoras llamadas \"Bomberos\" (Firefighters).\n- Los \"Bomberos\" no buscan dañar al sujeto por malicia; actúan en pánico absoluto cuando un disparador externo amenaza con exponer las heridas de las partes \"Exiliadas\" (ej. sentir la vergüenza insoportable de ser estafado de nuevo o no tener para pagar la comida). Su objetivo es apagar el dolor emocional a cualquier precio, incluso destruyendo el soporte biológico.\n\n3. MECANISMOS NEUROBIOLÓGICOS / PSICOLÓGICOS:\n- Fusión de Partes: Una parte asustada o punitiva toma el control completo del circuito prefrontal y de la conducta motora, bloqueando temporalmente el acceso a la compasión, la curiosidad y la perspectiva del Self de Emilio.\n- Activación de los protectores \"Mánagers\" (controladores rígidos) y \"Bomberos\" (impulsivos y destructivos).\n\n4. APLICACIÓN OPERATIVA Y PROPUESTA DE EJERCICIO:\nCuando Emilio experimenta pensamientos intrusivos de muerte o la urgencia de quemar sus ganancias, se trata de una parte \"Bombero\" sintiendo pánico ante la presión financiera acumulada. El suicidio o el autosabotaje son intentos desesperados de esa parte por proteger a Emilio de sentir la humillación e indefensión de las deudas.\n- Ejercicio IFS de Diálogo Escrito con el Bombero: Emilio debe sentarse con papel y lápiz al surgir la idea destructiva y escribir: \"Veo a la parte que me pide rendirme o autosabotearme. Comprendo que estás aterrorizada por las deudas y quieres apagar mi sufrimiento. Agradezco que intentes protegerme, pero yo soy el adulto aquí y tengo un plan matemático para resolverlo. Puedes relajarte un momento, yo me haré cargo\".",
  "porges": "=== FICHA DE INVESTIGACIÓN CLÍNICA DETALLADA ===\n\n1. MARCO CONCEPTUAL Y TESIS CENTRAL:\nLa Teoría Polivagal del Dr. Stephen Porges propone que el sistema nervioso autónomo humano procesa las señales de peligro del entorno a través de tres niveles filogenéticos, jerarquizados según su antigüedad evolutiva. La neurocepción (evaluación subcortical inconsciente del peligro) determina en cuál de estos tres estados nos encontramos. El trauma crónico impide que el sistema nervioso retorne a un estado de seguridad vagal ventral, atrapándolo en la lucha/huida simpática o en el colapso vegetativo de la inmovilización dorsal.\n\n2. EVIDENCIA CIENTÍFICA Y HALLAZGOS CLAVE:\n- La variabilidad de la frecuencia cardíaca (VFC) es el marcador biofísico de la salud polivagal. Valores bajos de VFC correlacionan de manera directa con estados persistentes de colapso, fobias y vulnerabilidad al pánico.\n- Se demuestra que la agorafobia es una respuesta biológica de inmovilización dorsal (freeze / colapso somático) que se activa cuando la neurocepción detecta que las estrategias de lucha o huida simpáticas son inútiles ante la magnitud percibida del peligro.\n\n3. MECANISMOS NEUROBIOLÓGICOS / PSICOLÓGICOS:\n- Rama Vagal Dorsal (Inmovilización / Colapso): Ralentiza los latidos, baja la presión arterial y produce disociación. Es el estado en el que Emilio se siente \"paralizado\" sin poder salir de casa.\n- Rama Vagal Ventral (Seguridad y Conexión Social): Modula los músculos faciales, el oído medio y el corazón, permitiendo la relajación, la comunicación y el pensamiento creativo.\n\n4. APLICACIÓN OPERATIVA Y PROPUESTA DE EJERCICIO:\nPara que Emilio pueda salir de casa a realizar sus exposiciones de agorafobia, debe activar mecánicamente su rama vagal ventral para contrarrestar la neurocepción de peligro dorsal.\n- Protocolo de Estimulación Vagal Ventral Mecánica: Antes de salir de casa, realizar 2 minutos de gárgaras vigorosas con agua templada o tararear una canción con resonancia en el pecho. Esto estimula físicamente las ramas faríngea y laríngea de los nervios craneales asociados al nervio vago ventral, forzando de manera biológica al cerebro a interpretar que se encuentra en un entorno seguro.",
  "kahneman": "=== FICHA DE INVESTIGACIÓN CLÍNICA DETALLADA ===\n\n1. MARCO CONCEPTUAL Y TESIS CENTRAL:\nDaniel Kahneman describe el funcionamiento mental mediante la interacción de dos modos de pensamiento: el Sistema 1 (rápido, asociativo, intuitivo, cargado emocionalmente y que demanda muy poco esfuerzo) y el Sistema 2 (lento, deliberado, analítico, lógico y que requiere un alto gasto energético). Bajo fatiga ejecutiva o estrés agudo, los recursos limitados del Sistema 2 se agotan por completo, dejando el control del comportamiento y las finanzas a merced de los sesgos heurísticos automáticos del Sistema 1.\n\n2. EVIDENCIA CIENTÍFICA Y HALLAZGOS CLAVE:\n- Teoría de las Perspectivas: Demuestra que el dolor subjetivo provocado por una pérdida financiera es exactamente el doble de intenso que el placer que genera obtener esa misma cantidad de dinero. Esto induce una aversión al riesgo asimétrica y patológica.\n- Ceguera de Escala: Cuando el cerebro está fatigado o expuesto a números muy grandes de forma constante (ej. deudas masivas), pierde la noción del valor real de cada unidad monetaria individual, tratando cantidades significativas como números vacíos abstractos.\n\n3. MECANISMOS NEUROBIOLÓGICOS / PSICOLÓGICOS:\n- Agotamiento del Ego (Depleción del Control Prefrontal): El esfuerzo mental continuo consume la glucosa cerebral disponible en las áreas prefrontales dorsolaterales, desactivando el control inhibitorio del Sistema 2 y permitiendo que la amígdala y el estriado del Sistema 1 tomen decisiones de forma inmediata.\n\n4. APLICACIÓN OPERATIVA Y PROPUESTA DE EJERCICIO:\nEmilio experimenta ceguera de escala en el trading cuando pierde la noción del valor real del dinero y opera con lotajes desproporcionados, asumiendo pérdidas enormes sin correlación con su realidad socioeconómica.\n- Ejercicio de Anclaje de Escala Real de Kahneman: Registrar cada stop-loss de trading en el diario y traducirlo de manera explícita en bienes físicos equivalentes de su vida diaria (ej. \"He perdido $150, lo que equivale a la compra de comida de toda la semana o a 15 horas de mi trabajo protegido\"). Esto desmantela la abstracción del Sistema 1 y ancla los números a la realidad física de su presupuesto.",
  "seligman": "=== FICHA DE INVESTIGACIÓN CLÍNICA DETALLADA ===\n\n1. MARCO CONCEPTUAL Y TESIS CENTRAL:\nEl modelo de Indefensión Aprendida de Martin Seligman describe el estado psicológico en el que un sujeto aprende de manera cognitiva y biológica que sus acciones individuales no tienen ningún efecto para modificar los resultados de su entorno. Cuando un individuo se expone repetidamente a eventos aversivos y traumáticos incontrolables (como pérdidas financieras continuas, estafas recurrentes o crisis de pánico ineludibles), su cerebro apaga la iniciativa de acción y cae en una resignación pasiva, asumiendo que el dolor futuro es inevitable.\n\n2. EVIDENCIA CIENTÍFICA Y HALLAZGOS CLAVE:\n- Experimentos clínicos demuestran que tras ser sometidos a estímulos aversivos incontrolables, los sujetos pierden la capacidad de aprendizaje adaptativo, incluso cuando en fases posteriores la salida o solución es evidente y sencilla.\n- La indefensión aprendida correlaciona de forma directa con niveles bajísimos de norepinefrina en el locus coeruleus y una atrofia en los mecanismos de la dopamina estriatal, imitando los síntomas de la depresión mayor.\n\n3. MECANISMOS NEUROBIOLÓGICOS / PSICOLÓGICOS:\n- Desactivación de la Corteza Prefrontal Ventromedial (CPFvm): Esta estructura es la encargada de registrar el \"control sobre el estresor\". Si la CPFvm no se activa, el núcleo del rafe dorsal inunda el cerebro de serotonina inhibidora, apagando la conducta de escape o superación.\n\n4. APLICACIÓN OPERATIVA Y PROPUESTA DE EJERCICIO:\nEmilio actúa con pasividad y autosabotaje ante sus deudas porque su cerebro ha integrado que \"haga lo que haga, siempre estaré en la ruina\" (indefensión aprendida). Romper este bucle requiere recuperar el sentido de agencia personal mediante pequeños éxitos controlados.\n- Protocolo de Reatribución de Agencia Diaria de Seligman: Cada noche, Emilio debe registrar en su diario 3 hitos sencillos que hayan estado bajo su control absoluto de decisión (ej. \"Hoy he salido a la acera por 5 minutos\", \"Hoy he cocinado mi comida en lugar de pedir ultraprocesados\", \"Hoy he respetado el límite de 1R en mi trading\"). Anotar estos hitos activa de forma progresiva la CPFvm, revirtiendo la indefensión biológica.",
  "barlow": "=== FICHA DE INVESTIGACIÓN CLÍNICA DETALLADA ===\n\n1. MARCO CONCEPTUAL Y TESIS CENTRAL:\nEl Dr. David Barlow diseñó el Protocolo Unificado y la Terapia de Control del Pánico basándose en la premisa de que las crisis de pánico y la agorafobia no son anomalías orgánicas inexplicables, sino un condicionamiento clásico del miedo ante sensaciones corporales normales de activación (miedo al miedo). El sujeto interpreta un aumento del pulso, mareo o tensión como señales inequívocas de una catástrofe inminente (ej. volverse loco, desmayarse, sufrir un infarto). La evitación sistemática de estas sensaciones impide que la amígdala aprenda que la alarma es falsa.\n\n2. EVIDENCIA CIENTÍFICA Y HALLAZGOS CLAVE:\n- Ensayos clínicos aleatorizados sitúan a la Terapia de Control del Pánico como el estándar de oro (Gold Standard) para el tratamiento de trastornos de pánico con agorafobia, demostrando tasas de remisión superiores al 80%.\n- La exposición interoceptiva repetida extingue la respuesta de condicionamiento de miedo en la amígdala al habituar al sistema nervioso autónomo a experimentar las sensaciones somáticas sin recurrir a conductas de evitación o seguridad.\n\n3. MECANISMOS NEUROBIOLÓGICOS / PSICOLÓGICOS:\n- Extinción del Miedo: Se crean nuevas vías neuronales inhibitorias desde el córtex prefrontal hacia la amígdala (vía de seguridad), las cuales superponen la realidad lógica de seguridad sobre la alarma biológica automática de la amígdala.\n- Reestructuración cognitiva de las distorsiones de catastrofización física.\n\n4. APLICACIÓN OPERATIVA Y PROPUESTA DE EJERCICIO:\nEmilio debe dejar de ver la taquicardia o la disnea del pánico como enemigos de los que debe huir refugiándose en casa. Son alarmas fisiológicas inocuas que descenderán solas si permanece en la situación.\n- Ejercicio de Exposición Interoceptiva y Registro de Pánico: Realizar de forma controlada hiperventilación voluntaria (respirar rápido por la boca) durante 60 segundos estando en casa para provocar las sensaciones de mareo y aceleración cardíaca. Registrar la ansiedad (0-10) y esperar sin hacer nada a que la curva de ansiedad descienda de forma natural. Repetir diariamente para extinguir el condicionamiento límbico.",
  "beck": "=== FICHA DE INVESTIGACIÓN CLÍNICA DETALLADA ===\n\n1. MARCO CONCEPTUAL Y TESIS CENTRAL:\nEl Dr. Aaron T. Beck, padre de la Terapia Cognitiva, postula que la desesperanza (la creencia rígida de que el futuro es sombrío y no puede mejorar, combinada con la percepción de que el yo es una carga intolerable para los demás) es el predictor clínico directo de la ideación suicida y el colapso emocional extremo. Su tesis central es que la depresión se mantiene por una \"Tríada Cognitiva\" desadaptativa: una visión negativa de sí mismo (incompetente, fracasado), del mundo (exigente, hostil) y del futuro (sin salida, oscuro).\n\n2. EVIDENCIA CIENTÍFICA Y HALLAZGOS CLAVE:\n- Estudios empíricos longitudinales demuestran que la puntuación en la Escala de Desesperanza de Beck es el predictor estadístico más fiable de intentos de suicidio en pacientes psiquiátricos, superando al diagnóstico de depresión en sí mismo.\n- Beck demostró que la ideación suicida no es una elección racional, sino un intento de escape irracional ante un dolor psicológico percibido erróneamente como estático e infinito (visión de túnel depresiva).\n\n3. MECANISMOS NEUROBIOLÓGICOS / PSICOLÓGICOS:\n- Sesgo de Procesamiento Selectivo de Información: El cerebro deprimido filtra e ignora de manera activa los datos positivos o neutrales del entorno, almacenando y magnificando únicamente los fracasos y pérdidas.\n- Rigidez Cognitiva Prefrontal: Incapacidad de generar soluciones alternativas para resolver los problemas reales (como deudas financieras), reduciendo las opciones a dos alternativas polarizadas: la ruina total o la desaparición física.\n\n4. APLICACIÓN OPERATIVA Y PROPUESTA DE EJERCICIO:\nLa desesperanza e ideación suicida que Emilio sufrió en 2025 son la respuesta límite ante la presión matemática de sus deudas. Su mente colapsó al interpretar las deudas como una condena biológica e identitaria inmutable, en lugar de un problema lineal que se resuelve con sumas y restas en el tiempo.\n- Ficha de Emergencia y Anclaje Racional de Beck: Portar en la cartera una tarjeta escrita a mano con el siguiente anclaje para leer en momentos de colapso: \"Las deudas son un problema numérico externo, lineal y resoluble con matemáticas aplicadas a lo largo del tiempo. Mi dolor actual es una tormenta química transitoria en mi amígdala que bajará en 20 minutos si bebo agua fría y aplico respiración diafragmática. Mi vida vale infinitamente más que cualquier balance de cuenta\"."
};

const parseResource = (resource) => {
  if (!resource) return { autor: '', titulo: '', tipo: 'libro', sintoma: 'General', justificacion: '', adaptacion: '', practica: '', resumen_ampliado: '', fuente_original_url: '' };
  
  let resObj = { autor: '', titulo: '', tipo: 'libro', sintoma: 'General', justificacion: '', adaptacion: '', practica: '', resumen_ampliado: '', fuente_original_url: '' };
  
  if (typeof resource === 'object' && resource !== null) {
    resObj = {
      autor: resource.autor || '',
      titulo: resource.titulo || resource.libro || '',
      tipo: resource.tipo || 'libro',
      sintoma: resource.sintoma || 'General',
      justificacion: resource.justificacion || '',
      adaptacion: resource.adaptacion || '',
      practica: resource.practica || resource.ejercicio_practico || '',
      resumen_ampliado: resource.resumen_ampliado || '',
      fuente_original_url: resource.fuente_original_url || resource.url_fuente || ''
    };
  } else {
    const str = String(resource).trim();
    if (str.startsWith('{') && str.endsWith('}')) {
      try {
        const parsed = JSON.parse(str);
        resObj = {
          autor: parsed.autor || '',
          titulo: parsed.titulo || parsed.libro || '',
          tipo: parsed.tipo || 'libro',
          sintoma: parsed.sintoma || 'General',
          justificacion: parsed.justificacion || '',
          adaptacion: parsed.adaptacion || '',
          practica: parsed.practica || parsed.ejercicio_practico || '',
          resumen_ampliado: parsed.resumen_ampliado || '',
          fuente_original_url: parsed.fuente_original_url || parsed.url_fuente || ''
        };
      } catch (_) {}
    } else {
      const cleanStr = str.replace(/^[+|]+$/g, '');
      const regExp = /^([^-(]+)s*-s*([^()]+)s*(?:((.*)))?$/;
      const match = cleanStr.match(regExp);
      
      let autor = '';
      let titulo = '';
      let justificacion = '';
      let adaptacion = '';
      let practica = '';
      let sintoma = 'General';
      let tipo = 'libro';

      if (match) {
        autor = match[1].replace(/[[]]/g, '').trim();
        titulo = match[2].replace(/[[]]/g, '').trim();
        const extra = match[3] ? match[3].trim() : '';
        
        if (extra.toLowerCase().includes('video') || titulo.toLowerCase().includes('video') || titulo.toLowerCase().includes('youtube') || titulo.toLowerCase().includes('charla')) {
          tipo = 'video';
        } else if (extra.toLowerCase().includes('estudio') || extra.toLowerCase().includes('paper') || titulo.toLowerCase().includes('estudio')) {
          tipo = 'estudio';
        } else if (extra.toLowerCase().includes('ensayo') || titulo.toLowerCase().includes('ensayo')) {
          tipo = 'ensayo';
        }

        const contentToSearch = (titulo + ' ' + extra).toLowerCase();
        if (contentToSearch.includes('tdah') || contentToSearch.includes('impulsiv') || contentToSearch.includes('ejecutiv')) {
          sintoma = 'Impulsividad / TDAH';
        } else if (contentToSearch.includes('trauma') || contentToSearch.includes('infancia') || contentToSearch.includes('abuso')) {
          sintoma = 'Trauma Complejo';
        } else if (contentToSearch.includes('agorafobia') || contentToSearch.includes('pánico') || contentToSearch.includes('ansiedad') || contentToSearch.includes('fobia')) {
          sintoma = 'Agorafobia y Pánico';
        } else if (contentToSearch.includes('deuda') || contentToSearch.includes('estafa') || contentToSearch.includes('dinero')) {
          sintoma = 'Bucle de Deudas';
        }

        const adaptIndex = extra.toLowerCase().indexOf('adaptación:');
        const practIndex = extra.toLowerCase().indexOf('práctica:');

        if (adaptIndex !== -1 || practIndex !== -1) {
          if (adaptIndex !== -1 && practIndex !== -1 && practIndex > adaptIndex) {
            justificacion = extra.slice(0, adaptIndex).trim();
            adaptacion = extra.slice(adaptIndex + 11, practIndex).trim();
            practica = extra.slice(practIndex + 9).trim();
          } else if (adaptIndex !== -1) {
            justificacion = extra.slice(0, adaptIndex).trim();
            adaptacion = extra.slice(adaptIndex + 11).trim();
          } else {
            justificacion = extra.slice(0, practIndex).trim();
            practica = extra.slice(practIndex + 9).trim();
          }
        } else {
          justificacion = extra;
        }
      } else {
        titulo = cleanStr;
      }
      
      resObj = { autor, titulo, tipo, sintoma, justificacion, adaptacion, practica, resumen_ampliado: '', fuente_original_url: '' };
    }
  }

  // Auto-enriquecer si no tienen resumen ampliado o URL (para las 12 fuentes clínicas base)
  if (!resObj.resumen_ampliado) {
    const titleLower = resObj.titulo.toLowerCase();
    const authorLower = resObj.autor.toLowerCase();
    
    if (authorLower.includes('van der kolk') || titleLower.includes('cuerpo lleva')) {
      resObj.resumen_ampliado = EXPANDED_CLINICAL_DOSSIERS.vanderkolk;
      resObj.fuente_original_url = "https://pubmed.ncbi.nlm.nih.gov/25024248/";
    } else if (authorLower.includes('barkley') || titleLower.includes('control del tdah')) {
      resObj.resumen_ampliado = EXPANDED_CLINICAL_DOSSIERS.barkley;
      resObj.fuente_original_url = "https://www.sciencedirect.com/science/article/pii/S000169181500028X";
    } else if (authorLower.includes('rojas estapé') || titleLower.includes('cortisol')) {
      resObj.resumen_ampliado = EXPANDED_CLINICAL_DOSSIERS.rojasestape;
      resObj.fuente_original_url = "https://www.youtube.com/watch?v=5D_m3a9f0Zc";
    } else if (authorLower.includes('young') || titleLower.includes('esquemas')) {
      resObj.resumen_ampliado = EXPANDED_CLINICAL_DOSSIERS.young;
      resObj.fuente_original_url = "https://www.sciencedirect.com/science/article/pii/B978012818697800014X";
    } else if (authorLower.includes('bosch') || titleLower.includes('pri') || titleLower.includes('agorafobia')) {
      resObj.resumen_ampliado = EXPANDED_CLINICAL_DOSSIERS.bosch;
      resObj.fuente_original_url = "https://www.sciencedirect.com/science/article/abs/pii/S088761851200057X";
    } else if (authorLower.includes('maté') || titleLower.includes('cuerpo dice no')) {
      resObj.resumen_ampliado = EXPANDED_CLINICAL_DOSSIERS.mate;
      resObj.fuente_original_url = "https://pubmed.ncbi.nlm.nih.gov/11029487/";
    } else if (authorLower.includes('schwartz') || titleLower.includes('ifs') || titleLower.includes('familia interna')) {
      resObj.resumen_ampliado = EXPANDED_CLINICAL_DOSSIERS.schwartz;
      resObj.fuente_original_url = "https://www.psychotherapy.net/article/ifs-schwartz";
    } else if (authorLower.includes('porges') || titleLower.includes('polivagal')) {
      resObj.resumen_ampliado = EXPANDED_CLINICAL_DOSSIERS.porges;
      resObj.fuente_original_url = "https://pubmed.ncbi.nlm.nih.gov/19875690/";
    } else if (authorLower.includes('kahneman') || titleLower.includes('pensar rápido')) {
      resObj.resumen_ampliado = EXPANDED_CLINICAL_DOSSIERS.kahneman;
      resObj.fuente_original_url = "https://www.nobelprize.org/prizes/economic-sciences/2002/kahneman/facts/";
    } else if (authorLower.includes('seligman') || titleLower.includes('indefensión')) {
      resObj.resumen_ampliado = EXPANDED_CLINICAL_DOSSIERS.seligman;
      resObj.fuente_original_url = "https://pubmed.ncbi.nlm.nih.gov/11029481/";
    } else if (authorLower.includes('barlow') || titleLower.includes('terapia de control')) {
      resObj.resumen_ampliado = EXPANDED_CLINICAL_DOSSIERS.barlow;
      resObj.fuente_original_url = "https://pubmed.ncbi.nlm.nih.gov/20422111/";
    } else if (authorLower.includes('beck') || titleLower.includes('depresión') || titleLower.includes('desesperanza')) {
      resObj.resumen_ampliado = EXPANDED_CLINICAL_DOSSIERS.beck;
      resObj.fuente_original_url = "https://pubmed.ncbi.nlm.nih.gov/22022112/";
    } else {
      resObj.resumen_ampliado = `Este protocolo de investigación clínica consolidado aborda los fundamentos metodológicos y cognitivos sobre: "${resObj.sintoma}". Analiza las bases científicas del síntoma y las pautas conductuales recomendadas por el andamiaje del equipo de Antigravity.`;
      resObj.fuente_original_url = "https://pubmed.ncbi.nlm.nih.gov/?term=" + encodeURIComponent(resObj.autor + " " + resObj.titulo);
    }
  }

  return resObj;
};

export default function MenteView({ user, profile, dailyMoodToday, onMoodSaved, onProfileUpdated, genericMode = false, genericSection = 'context' }) {
  const [cancelSyncRequested, setCancelSyncRequested] = useState(false);
  const cancelSyncRef = useRef(false);
  // States para el portal web de recursos científicos (Tab 5)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Estados para búsqueda de fuentes con Ánquer IA
  const [customSearchTopic, setCustomSearchTopic] = useState('');
  const [availableTopics, setAvailableTopics] = useState([
    'TDAH / Impulsividad y Control Ejecutivo',
    'Trauma Complejo y Regulación Somática',
    'Cortisol Alto y Visión de Túnel',
    'Pánico, Agorafobia y Exposición Somática',
    'Dinero, Deudas y Autosabotaje Financiero',
    'Resiliencia, Culpa y Desesperanza'
  ]);
  const [selectedTopicDropdown, setSelectedTopicDropdown] = useState('TDAH / Impulsividad y Control Ejecutivo');
  const [isEditingTopics, setIsEditingTopics] = useState(false);
  const [newTopicToDropdown, setNewTopicToDropdown] = useState('');
  const [searchAgentStatus, setSearchAgentStatus] = useState('idle'); // 'idle' | 'searching' | 'completed' | 'failed'
  const [searchTaskId, setSearchTaskId] = useState(null);
  const [searchTaskError, setSearchTaskError] = useState('');

  // Estados para la ficha expandida detallada del recurso
  const [selectedResourceDetail, setSelectedResourceDetail] = useState(null);
  const [modalDetailTab, setModalDetailTab] = useState('resumen'); // 'resumen' | 'adaptacion' | 'ejercicio' | 'original'

  const handleTriggerSearchAgent = async () => {
    const topicToSearch = selectedTopicDropdown === 'custom' ? customSearchTopic : selectedTopicDropdown;
    if (!topicToSearch.trim()) return;

    setSearchAgentStatus('searching');
    setSearchTaskError('');
    
    try {
      // 1. Crear tarea de agente
      const { data, error } = await supabase
        .from('agent_tasks')
        .insert({
          user_id: user.id,
          agent_name: 'Ánquer',
          title: `Investigar Fuentes: ${topicToSearch.trim()}`,
          description: `Investigar y buscar fuentes científicas y clínicas de alta calidad sobre el tema: "${topicToSearch.trim()}". Genera una ficha técnica de la fuente, una ficha adaptada al caso de Emilio (TDAH, trauma, agorafobia, deudas, trading) y propuestas de ejercicios prácticos, y guárdalas en su perfil.`,
          status: 'pending'
        })
        .select()
        .single();
        
      if (error) throw error;
      
      const taskId = data.id;
      setSearchTaskId(taskId);
      
      // 2. Polling
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        if (attempts > 50) { // Límite de 1.25 minutos
          clearInterval(interval);
          setSearchAgentStatus('failed');
          setSearchTaskError('Tiempo de espera agotado. Ánquer IA no respondió a tiempo.');
          return;
        }
        
        const { data: taskData, error: fetchErr } = await supabase
          .from('agent_tasks')
          .select('status, result')
          .eq('id', taskId)
          .single();
          
        if (fetchErr) {
          console.error("Error al consultar estado de tarea:", fetchErr);
          return;
        }
        
        if (taskData.status === 'completed') {
          clearInterval(interval);
          
          try {
            // Guardar en el perfil del usuario utilizando la sesión autenticada del cliente
            const currentCtx = profile?.contexto_terapeutico || {};
            const currentFuentes = currentCtx.fuentes_ayuda || [];
            
            const newFuenteParsed = JSON.parse(taskData.result);
            const seenTitles = new Set(currentFuentes.map(f => (f.titulo || f.libro || '').toLowerCase().trim()));
            
            const updatedFuentes = [...currentFuentes];
            if (!seenTitles.has((newFuenteParsed.titulo || '').toLowerCase().trim())) {
              updatedFuentes.push(newFuenteParsed);
            }
            
            const updatedCtx = {
              ...currentCtx,
              fuentes_ayuda: updatedFuentes
            };
            
            const { error: profileErr } = await supabase
              .from('profiles')
              .update({ contexto_terapeutico: updatedCtx })
              .eq('id', user.id);
              
            if (profileErr) throw profileErr;
            
            if (onProfileUpdated) {
              onProfileUpdated({
                ...profile,
                contexto_terapeutico: updatedCtx
              });
            }
            
            setSearchAgentStatus('completed');
            setCustomSearchTopic('');
            setTimeout(() => setSearchAgentStatus('idle'), 4000);
          } catch (saveErr) {
            console.error("Error al guardar la fuente en el perfil:", saveErr);
            setSearchAgentStatus('failed');
            setSearchTaskError('Error al guardar la fuente en el expediente: ' + saveErr.message);
          }
        } else if (taskData.status === 'failed') {
          clearInterval(interval);
          setSearchAgentStatus('failed');
          setSearchTaskError('Ánquer IA reportó un error al investigar.');
        }
      }, 1500);
      
    } catch (err) {
      setSearchAgentStatus('failed');
      setSearchTaskError(err.message || 'Error desconocido al iniciar la búsqueda.');
    }
  };

  // Diary State
  const [anxiety, setAnxiety] = useState(dailyMoodToday?.anxiety_level ?? 5);
  const [impulsivity, setImpulsivity] = useState(dailyMoodToday?.impulsivity_level ?? 5);
  const [atomoxetina, setAtomoxetina] = useState(dailyMoodToday?.atomoxetina_taken ?? false);
  const [trading, setTrading] = useState(false);
  const [notes, setNotes] = useState(dailyMoodToday?.notes || '');
  const [isDictatingNotes, setIsDictatingNotes] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('diary'); // 'diary' | 'timeline' | 'sources' | 'clinical_facts' | 'barkley'

  // NotebookLM & clinical facts states
  const [sources, setSources] = useState([]);
  const [completedConversations, setCompletedConversations] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  // Estados para sincronización interactiva y progreso en tiempo real
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState({
    active: false,
    percentage: 0,
    totalProcessed: 0,
    totalErrors: 0,
    totalCount: 0,
    remainingCount: 0,
    processedItems: [], // lista de { name, type }
    errorItems: [],
    currentActivity: ''
  });

  // Estados para edición manual de Mente
  const [isEditingMente, setIsEditingMente] = useState(false);
  const [editDiagnosticoBase, setEditDiagnosticoBase] = useState('');
  const [editMecanismosDefensa, setEditMecanismosDefensa] = useState('');
  const [editConclusiones, setEditConclusiones] = useState('');
  const [editCompromisos, setEditCompromisos] = useState('');
  const [editPautasAccion, setEditPautasAccion] = useState('');

  // Fetch patient sources
  const fetchSources = async () => {
    if (!user) return;
    setSourceLoading(true);
    try {
      const { data, error } = await supabase
        .from('mente_sources')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSources(data || []);
    } catch (err) {
      console.error("Error fetching sources:", err.message);
    } finally {
      setSourceLoading(false);
    }
  };

  // Fetch completed conversations (archived sessions)
  const fetchCompletedConversations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('closed_at', { ascending: false });
      if (error) throw error;
      setCompletedConversations(data || []);
    } catch (err) {
      console.error("Error fetching completed conversations:", err.message);
    }
  };

  // Add text note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!user || !noteTitle.trim() || !noteContent.trim()) return;
    setUploadLoading(true);
    try {
      const { error } = await supabase
        .from('mente_sources')
        .insert([{
          user_id: user.id,
          name: noteTitle.trim(),
          content_type: 'note',
          text_content: noteContent.trim(),
          processed: false,
          sync_status: 'pending',
          extracted_text: noteContent.trim(),
          extraction_status: 'ready',
          extraction_model: 'direct',
          extracted_at: new Date().toISOString(),
          extraction_error: null
        }]);
      if (error) throw error;
      setNoteTitle('');
      setNoteContent('');
      alert("Nota guardada con éxito.");
      fetchSources();
    } catch (err) {
      console.error("Error saving note source:", err.message);
      alert("Error al guardar la nota: " + err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const [syncLoading, setSyncLoading] = useState(false);

  const handleSyncProfile = () => {
    setShowSyncModal(true);
  };

  const startSyncProcess = async (resetOption, onlyOption) => {
    cancelSyncRef.current = false;
    setCancelSyncRequested(false);
    setShowSyncModal(false);
    setSyncLoading(true);
    setSyncStatus({
      active: true,
      percentage: 0,
      totalProcessed: 0,
      totalErrors: 0,
      totalCount: 0,
      remainingCount: 0,
      processedItems: [],
      errorItems: [],
      currentActivity: 'Iniciando conexión con Áncora...'
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No se pudo obtener la sesión activa de Áncora.");
      }

      setSyncStatus(prev => ({ ...prev, percentage: 5, currentActivity: 'Preparando cola de análisis...' }));
      
      const prepRes = await invokeChatTerapeuta({
        action: 'prepare_mente_sync',
        reset: resetOption,
        only: onlyOption
      });

      if (!prepRes || !prepRes.success) {
        throw new Error(prepRes?.error || "Error al inicializar la cola de sincronización.");
      }

      const runId = prepRes.runId;
      const queue = prepRes.queue || [];
      const totalCount = prepRes.totalCount || 0;

      if (totalCount === 0) {
        setSyncStatus(prev => ({
          ...prev,
          percentage: 100,
          currentActivity: 'Todo el historial clínico ya está consolidado.',
          totalCount: 0,
          remainingCount: 0
        }));
        await new Promise(resolve => setTimeout(resolve, 1500));
        return;
      }

      let totalProcessed = 0;
      let totalErrors = 0;
      let itemsList = [];
      let errorItemsList = [];

      setSyncStatus(prev => ({
        ...prev,
        percentage: 10,
        totalCount,
        remainingCount: totalCount,
        currentActivity: `Cola inicializada. Encontrados ${totalCount} elementos.`
      }));

      for (let i = 0; i < queue.length; i++) {
        if (cancelSyncRef.current) {
          setSyncStatus(prev => ({ ...prev, currentActivity: 'Sincronización cancelada por el usuario.' }));
          break;
        }

        const item = queue[i];
        const itemNumber = i + 1;
        const tempPercentage = Math.round(10 + ((i / totalCount) * 80));

        setSyncStatus(prev => ({
          ...prev,
          percentage: tempPercentage,
          currentActivity: `Analizando [${itemNumber}/${totalCount}]: obteniendo datos...`
        }));

        try {
          const itemRes = await invokeChatTerapeuta({
            action: 'process_mente_sync_item',
            runId,
            item
          });

          if (itemRes && itemRes.success) {
            totalProcessed++;
            const name = itemRes.processedItem?.name || `Elemento ${item.id}`;
            itemsList.push({ name, type: item.type, status: 'analyzed' });
            setSyncStatus(prev => ({
              ...prev,
              totalProcessed,
              processedItems: [...itemsList],
              currentActivity: `Revisado: ${name}`
            }));
          } else {
            totalErrors++;
            const name = itemRes?.processedItem?.name || `Elemento ${item.id}`;
            const errorMsg = itemRes?.error || 'Error desconocido';
            errorItemsList.push({ name, type: item.type, error: errorMsg, status: 'error' });
            setSyncStatus(prev => ({
              ...prev,
              totalErrors,
              errorItems: [...errorItemsList],
              currentActivity: `Fallo en: ${name} (${errorMsg})`
            }));
          }
        } catch (itemErr) {
          totalErrors++;
          const errorMsg = itemErr.message || String(itemErr);
          errorItemsList.push({ name: `Elemento ${item.id}`, type: item.type, error: errorMsg, status: 'error' });
          setSyncStatus(prev => ({
            ...prev,
            totalErrors,
            errorItems: [...errorItemsList],
            currentActivity: `Fallo en elemento: ${errorMsg}`
          }));
        }
      }

      if (cancelSyncRef.current) {
        setSyncStatus(prev => ({ ...prev, active: false }));
        setSyncLoading(false);
        return;
      }

      setSyncStatus(prev => ({
        ...prev,
        percentage: 90,
        currentActivity: 'Consolidando diagnóstico clínico global (Ánquer)...'
      }));

      const consRes = await invokeChatTerapeuta({
        action: 'consolidate_mente_sync',
        runId
      });

      if (!consRes || !consRes.success) {
        throw new Error(consRes?.error || "Error al consolidar la base de datos de Mente.");
      }

      const finalData = consRes.data;

      setSyncStatus(prev => ({
        ...prev,
        percentage: 100,
        currentActivity: totalErrors > 0 
          ? 'Sincronización finalizada con algunos errores.' 
          : '¡Estructura de Mente consolidada con éxito!'
      }));

      await new Promise(resolve => setTimeout(resolve, 1500));

      if (onProfileUpdated && finalData) {
        onProfileUpdated({
          ...profile,
          contexto_terapeutico: finalData
        });
      }
      fetchSources();
      fetchCompletedConversations();
    } catch (err) {
      console.error(err);
      alert("Error al sincronizar análisis de Mente: " + err.message);
    } finally {
      setSyncLoading(false);
      setSyncStatus(prev => ({ ...prev, active: false }));
    }
  };

  // Cargar estados e iniciar edición manual de Mente
  const startEditingMente = () => {
    if (!profile) return;
    const ctx = profile.contexto_terapeutico || {};
    setEditDiagnosticoBase(ctx.contexto_base?.diagnostico_inicial || ctx.foto_persona || '');

    const defensa = ctx.contexto_base?.mecanismos_defensa;
    setEditMecanismosDefensa(
      Array.isArray(defensa) ? defensa.join('\n') : String(defensa || '')
    );

    setEditConclusiones(Array.isArray(ctx.conclusiones) ? ctx.conclusiones.join('\n') : '');
    setEditCompromisos(Array.isArray(ctx.compromisos) ? ctx.compromisos.join('\n') : '');
    setEditPautasAccion(Array.isArray(ctx.pautas_accion) ? ctx.pautas_accion.join('\n') : '');
    setIsEditingMente(true);
  };

  // Guardar cambios manuales de Mente en la base de datos Supabase
  const handleSaveMente = async (e) => {
    if (e) e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const updatedCtx = {
        ...(profile.contexto_terapeutico || {}),
        contexto_base: {
          diagnostico_inicial: editDiagnosticoBase.trim(),
          mecanismos_defensa: editMecanismosDefensa.split('\n').map(x => x.trim()).filter(Boolean)
        },
        conclusiones: editConclusiones.split('\n').map(x => x.trim()).filter(Boolean),
        compromisos: editCompromisos.split('\n').map(x => x.trim()).filter(Boolean),
        pautas_accion: editPautasAccion.split('\n').map(x => x.trim()).filter(Boolean)
      };

      const { error } = await supabase
        .from('profiles')
        .update({ contexto_terapeutico: updatedCtx })
        .eq('id', user.id);

      if (error) throw error;

      // Sincronizar con el motor de memoria cognitiva
      try {
        const repo = MemoryRepositoryFactory.getRepository();
        const engine = new CognitiveMemoryEngine({ repository: repo });
        await engine.repo.saveSemanticProfile(user.id, {
          patientId: user.id,
          currentSummary: editDiagnosticoBase.trim(),
          activeTriggers: updatedCtx.triggers || [],
          protectiveAnchors: updatedCtx.protective_anchors || updatedCtx.pautas_accion || [],
          coreBeliefs: updatedCtx.conclusiones || []
        });
        await engine.consolidate(user.id);
      } catch (memSyncErr) {
        console.warn('Advertencia al sincronizar memoria cognitiva:', memSyncErr.message);
      }

      if (onProfileUpdated) {
        onProfileUpdated({
          ...profile,
          contexto_terapeutico: updatedCtx
        });
      }
      setIsEditingMente(false);
      alert("Memoria consolidada (Mente) actualizada correctamente.");
    } catch (err) {
      console.error("Error saving mente:", err.message);
      alert("Error al guardar la memoria: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle file uploads (multiple files of any format)
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !user) return;

    setUploadLoading(true);
    let successCount = 0;

    for (const file of files) {
      try {
        await new Promise((resolve, reject) => {
          const reader = new FileReader();

          const isText = file.type?.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.csv');

          reader.onload = async (event) => {
            try {
              const content = event.target.result;
              const extractionReady = isText;
              const { error } = await supabase
                .from('mente_sources')
                .insert([{
                  user_id: user.id,
                  name: file.name,
                  content_type: file.type || 'application/octet-stream',
                  text_content: content,
                  processed: false,
                  sync_status: 'pending',
                  extracted_text: extractionReady ? content : null,
                  extraction_status: extractionReady ? 'ready' : 'pending',
                  extraction_model: extractionReady ? 'direct' : null,
                  extracted_at: extractionReady ? new Date().toISOString() : null,
                  extraction_error: null
                }]);
              if (error) throw error;
              successCount++;
              resolve();
            } catch (err) {
              reject(err);
            }
          };

          reader.onerror = () => reject(reader.error);

          if (isText) {
            reader.readAsText(file);
          } else {
            // Base64 Data URL for images, PDFs, etc.
            reader.readAsDataURL(file);
          }
        });
      } catch (err) {
        console.error(`Error uploading file ${file.name}:`, err.message);
      }
    }

    alert(`Cargados ${successCount} de ${files.length} archivos con éxito.`);
    setUploadLoading(false);
    fetchSources();
  };

  // Delete source
  const handleDeleteSource = async (id) => {
    if (!confirm("¿Deseas eliminar esta fuente de contexto? Ánquer ya no la usará de referencia.")) return;
    try {
      const { error } = await supabase
        .from('mente_sources')
        .delete()
        .eq('user_id', user.id)
        .eq('id', id);
      if (error) throw error;
      setSources(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Error deleting source:", err.message);
    }
  };

  // Load transcript messages
  const loadSessionMessages = async (convId) => {
    setTranscriptLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setSessionMessages(data || []);
    } catch (err) {
      console.error("Error loading session transcript:", err.message);
    } finally {
      setTranscriptLoading(false);
    }
  };

  // Pre-loaded timeline items from docx extracts
  const timelineItems = [
    {
      date: "Infancia (4 - 12 años)",
      title: "Miedo y Conflicto en el Hogar",
      type: "negative",
      desc: "Peleas severas y constantes entre su padre y su hermana mayor. Crece con el miedo en el cuerpo todas las noches. Sentimiento de indefensión y falta de protección.",
      reframe: "Tus miedos infantiles no eran debilidad, sino una reacción normal de supervivencia. Hoy estás a salvo de ese entorno y puedes elegir tu propia protección."
    },
    {
      date: "Edad 9 - 12 años",
      title: "Abusos de su Hermana Mayor",
      type: "negative",
      desc: "Sufre tocamientos y abusos continuados en la cama por parte de su hermana mayor. Ruptura del apego y confusión sobre los límites y el afecto.",
      reframe: "El abuso fue responsabilidad absoluta de la persona mayor. No define tu valor ni tu capacidad de ser amado de forma sana."
    },
    {
      date: "Adolescencia (13 - 18 años)",
      title: "Maltrato Físico Paterno",
      type: "negative",
      desc: "Violencia física extrema (patadas, puñetazos) y persecuciones por parte de su padre debido a malas notas. Recibe mensajes constantes de que es un 'inútil'. Se esconde debajo de la cama.",
      reframe: "La violencia de tu padre proyectaba sus propias frustraciones. El mensaje de 'inútil' fue un maltrato psicológico falso; tu éxito posterior demostró tu gran capacidad intelectual."
    },
    {
      date: "Edad 18 - 24 años",
      title: "Entrada en Agencia EFE y Mentoría",
      type: "positive",
      desc: "Su padre lo mete en la Agencia EFE. Usuario descubre que es un fotógrafo excepcional y su padre se convierte en un gran mentor laboral, revelando una nueva faceta de apoyo.",
      reframe: "Lograste independizarte, aprender un oficio de alto nivel y ganarte el respeto profesional por tus propios méritos."
    },
    {
      date: "Años Posteriores",
      title: "Éxito Financiero y Libertad",
      type: "positive",
      desc: "Genera un patrimonio de cerca de 800.000 € y logra la independencia financiera total mediante su talento analítico.",
      reframe: "Demuestra que tienes un cerebro sumamente potente, capaz de asimilar información compleja y generar riqueza de forma legítima."
    },
    {
      date: "Año 2022",
      title: "La Estafa de 350.000 €",
      type: "negative",
      desc: "Tras pedir excedencia laboral, cae en una estafa documentada perdiendo 350.000 € de golpe. Detonante del bucle de auto-sabotaje y deudas posteriores de 160.000 €.",
      reframe: "Fuiste víctima de una estafa profesional. La pérdida económica activó tu antiguo trauma de 'no merecer el éxito' forjando el autosabotaje actual para volver al fracaso conocido."
    },
    {
      date: "Año 2025 (Junio)",
      title: "Intento de Suicidio e Incapacidad",
      type: "negative",
      desc: "Intento de autolisis ante la demanda de custodia de su hija Lola. 5 días en la UCI en coma. Pérdida temporal de la custodia de Lola.",
      reframe: "Tocaste fondo biológico ante el pánico de perder a tu hija. Sobrevivir es tu oportunidad para reestructurar tu vida con calma burocrática. Lola te necesita estable, no rico."
    }
  ];

  // Helper para estimar orden cronológico de hitos históricos y sesiones reales de Emilio (Nacido en 1979)
  const getEvSortValue = (fechaStr) => {
    if (!fechaStr) return 0;
    const str = String(fechaStr).toLowerCase();
    
    const matchIso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (matchIso) {
      return new Date(fechaStr).getTime();
    }

    const matchYear = str.match(/\b(19\d{2}|20\d{2})\b/);
    if (matchYear) {
      const year = parseInt(matchYear[1], 10);
      if (str.includes("julio") || str.includes("07-04")) return year * 10000 + 704;
      if (str.includes("junio")) return year * 10000 + 600;
      if (str.includes("actualidad")) return year * 10000 + 999;
      return year * 10000;
    }

    const birthYear = 1979;
    const matchAgeRange = str.match(/(?:edad|infancia|adolescencia)?\s*\(?(\d+)\s*[-–]\s*(\d+)/) || str.match(/edad\s+(\d+)\s*[-–]\s*(\d+)/);
    if (matchAgeRange) {
      const startAge = parseInt(matchAgeRange[1], 10);
      return (birthYear + startAge) * 10000;
    }

    const matchAge = str.match(/(?:edad|años)\s*(\d+)/) || str.match(/\b(\d+)\s*años\b/);
    if (matchAge) {
      const age = parseInt(matchAge[1], 10);
      if (age < 100) {
        return (birthYear + age) * 10000;
      }
    }

    if (str.includes("infancia")) return (birthYear + 4) * 10000;
    if (str.includes("adolescencia")) return (birthYear + 13) * 10000;
    if (str.includes("posteriores")) return 2005 * 10000;

    return 0;
  };

  const dynamicTimelineItems = useMemo(() => {
    const evs = profile?.contexto_terapeutico?.evoluciones;
    if (!Array.isArray(evs) || evs.length === 0) {
      return timelineItems;
    }
    
    // Deduplicar evoluciones por título normalizado para quedarnos con la versión más detallada y elaborada
    const uniqueEvsMap = new Map();
    evs.forEach(ev => {
      const title = (ev.titulo_sesion || ev.hecho_clinico || 'Sesión Clínica').trim().toLowerCase();
      const existing = uniqueEvsMap.get(title);
      const descLen = (ev.analisis_evolutivo || ev.hecho_clinico || '').length;
      const existingLen = existing ? (existing.analisis_evolutivo || existing.hecho_clinico || '').length : -1;
      
      if (!existing || descLen > existingLen) {
        uniqueEvsMap.set(title, ev);
      }
    });

    const dedupedEvs = Array.from(uniqueEvsMap.values());

    // Ordenar de antiguo a reciente por fecha
    const sortedEvs = dedupedEvs.sort((a, b) => getEvSortValue(a.fecha) - getEvSortValue(b.fecha));
    
    // Mapeamos las evoluciones dinámicas al formato interactivo de la línea de tiempo
    return sortedEvs.map(ev => ({
      date: ev.fecha ? String(ev.fecha).trim() : 'Fecha no registrada',
      title: ev.titulo_sesion || ev.hecho_clinico || 'Sesión Clínica',
      type: ev.type === 'positive' ? 'positive' : 'negative',
      desc: ev.analisis_evolutivo || ev.hecho_clinico || '',
      reframe: ev.reframe || ev.reencuadre || 'Reencuadre no definido aún.',
      hechoClinico: ev.hecho_clinico,
      pautas: ev.pautas_y_compromisos
    }));
  }, [profile?.contexto_terapeutico?.evoluciones]);

  // Sync state when dailyMoodToday changes (e.g. loads from server) without useEffect to prevent cascading render warnings
  const [prevDailyMoodId, setPrevDailyMoodId] = useState(dailyMoodToday?.id || null);
  if (dailyMoodToday && dailyMoodToday.id !== prevDailyMoodId) {
    setPrevDailyMoodId(dailyMoodToday.id);
    setAnxiety(dailyMoodToday.anxiety_level);
    setImpulsivity(dailyMoodToday.impulsivity_level);
    setAtomoxetina(dailyMoodToday.atomoxetina_taken);
    setTrading(false);
    setNotes(dailyMoodToday.notes || '');
  }

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  useEffect(() => {
    if (!genericMode) return;
    if (genericSection === 'documents' || genericSection === 'sources') setActiveTab('sources');
    else if (genericSection === 'diary') setActiveTab('diary');
    else setActiveTab('clinical_facts');
  }, [genericMode, genericSection]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'sources') {
        fetchSources();
      } else if (activeTab === 'clinical_facts') {
        fetchCompletedConversations();
      }
    }
  }, [activeTab, user]);

  async function fetchHistory() {
    try {
      const { data, error } = await supabase
        .from('daily_moods')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setHistory(data || []);
    } catch (e) {
      console.error("Error fetching mood history:", e.message);
    }
  }

  const handleDictateNotes = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("El reconocimiento de voz no está soportado en tu navegador actual. Prueba con Google Chrome o Microsoft Edge.");
      return;
    }

    if (isDictatingNotes) {
      if (window.sensationsSpeechRecognition) {
        window.sensationsSpeechRecognition.stop();
      }
      setIsDictatingNotes(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsDictatingNotes(true);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsDictatingNotes(false);
    };

    recognition.onend = () => {
      setIsDictatingNotes(false);
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setNotes(prev => prev ? prev + " " + speechToText : speechToText);
    };

    window.sensationsSpeechRecognition = recognition;
    recognition.start();
  };

  const handleSaveMood = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const payload = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        anxiety_level: parseInt(anxiety),
        impulsivity_level: parseInt(impulsivity),
        atomoxetina_taken: atomoxetina,
        trading_today: false,
        notes: notes,
        is_analyzed: false
      };

      // Upsert using date and user_id constraint
      const { data, error } = await supabase
        .from('daily_moods')
        .upsert(payload, { onConflict: 'user_id, date' })
        .select();

      if (error) throw error;

      if (data && data[0]) {
        onMoodSaved(data[0]);
      }
      fetchHistory();
      alert("Diario guardado con éxito.");
    } catch (err) {
      console.error("Error saving daily mood:", err.message);
      alert("Error al guardar el diario: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const [selectedTimelineItem, setSelectedTimelineItem] = useState(null);

  const [checkedItems, setCheckedItems] = useState(() => {
    try {
      const saved = localStorage.getItem(`mente_checked_${user?.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`mente_checked_${user.id}`, JSON.stringify(checkedItems));
    }
  }, [checkedItems, user?.id]);

  const toggleCheckItem = (category, index) => {
    const key = `${category}-${index}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const renderDate = (fechaStr) => {
    if (!fechaStr) return 'Fecha no registrada';
    const dateObj = new Date(fechaStr);
    if (!isNaN(dateObj.getTime()) && fechaStr.includes('-')) {
      return dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return fechaStr;
  };

  const parseTemaDescription = (description) => {
    if (!description) return { conflicto: '', solucion: '' };
    const parts = description.split(/💡/);
    if (parts.length > 1) {
      return {
        conflicto: parts[0].trim().replace(/\n+$/, ''),
        solucion: parts[1].trim()
      };
    }
    const doubleBreak = description.split('\n\n');
    if (doubleBreak.length > 1) {
      return {
        conflicto: doubleBreak[0].trim(),
        solucion: doubleBreak.slice(1).join('\n\n').trim()
      };
    }
    return { conflicto: description, solucion: '' };
  };

  if (genericMode) {
    const ctx = profile?.contexto_terapeutico || {};
    const hasContext =
      Boolean(ctx.foto_persona) ||
      Boolean(ctx.contexto_base?.diagnostico_inicial) ||
      (Array.isArray(ctx.conclusiones) && ctx.conclusiones.length > 0) ||
      (Array.isArray(ctx.temas) && ctx.temas.length > 0);

    return (
      <div className="view-content-limit">
        <div className="sub-tabs-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <button onClick={() => setActiveTab('clinical_facts')} className={`sub-tab-btn ${activeTab === 'clinical_facts' ? 'active' : ''}`}>
            Contexto
          </button>
          <button onClick={() => setActiveTab('diary')} className={`sub-tab-btn ${activeTab === 'diary' ? 'active' : ''}`}>
            Diario
          </button>
          <button onClick={() => setActiveTab('sources')} className={`sub-tab-btn ${activeTab === 'sources' ? 'active' : ''}`}>
            Documentos
          </button>
        </div>

        {activeTab === 'clinical_facts' && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <span className="badge badge-cyan" style={{ marginBottom: '10px' }}>Memoria privada</span>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Contexto personal</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                Este espacio se completa con tus documentos, notas y conversaciones cerradas. No contiene datos de otros usuarios.
              </p>
            </div>

            {!hasContext ? (
              <div style={{ padding: '22px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                Aún no hay contexto consolidado. Sube una nota o documento y usa el chat para empezar a construir tu memoria.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <h4 style={{ fontSize: '0.85rem', margin: '0 0 8px 0', color: '#ffffff' }}>Síntesis</h4>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                    {ctx.contexto_base?.diagnostico_inicial || ctx.foto_persona || 'Sin síntesis principal.'}
                  </p>
                </div>
                {Array.isArray(ctx.conclusiones) && ctx.conclusiones.length > 0 && (
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ fontSize: '0.85rem', margin: '0 0 8px 0', color: '#ffffff' }}>Conclusiones</h4>
                    <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.78rem', lineHeight: 1.5 }}>
                      {ctx.conclusiones.map((item, idx) => <li key={idx}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'diary' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', marginTop: 0 }}>Diario del día</h3>
            <form onSubmit={handleSaveMood} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label className="form-label">Ansiedad: {anxiety}/10</label>
              <input type="range" min="1" max="10" value={anxiety} onChange={(e) => setAnxiety(e.target.value)} />
              <label className="form-label">Nivel del d?a: {impulsivity}/10</label>
              <input type="range" min="1" max="10" value={impulsivity} onChange={(e) => setImpulsivity(e.target.value)} />
              {/* Checkbox de trading removido */}
              <textarea className="form-input" rows="5" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas del día..." style={{ resize: 'vertical' }} />
              <button className="btn btn-cyan" disabled={loading} style={{ alignSelf: 'flex-start' }}>
                Guardar diario
              </button>
            </form>

            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h4 style={{ fontSize: '0.9rem', color: '#ffffff' }}>Últimos registros</h4>
              {history.length === 0 ? (
                <div style={{ padding: '16px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Todavía no hay entradas de diario.
                </div>
              ) : history.map(item => (
                <div key={item.id} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: '#ffffff' }}>{new Date(item.date).toLocaleDateString('es-ES')}</strong>
                  <span> · Estado {item.anxiety_level}/10 · Claridad {item.impulsivity_level}/10</span>
                  {item.notes && <p style={{ margin: '6px 0 0 0', whiteSpace: 'pre-wrap' }}>{item.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Documentos y notas</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                Sube contexto propio. Cada archivo queda asociado a tu usuario y se puede resumir después en el chat.
              </p>
            </div>

            <form onSubmit={handleAddNote} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 260px) 1fr auto', gap: '10px', alignItems: 'start' }}>
              <input className="form-input" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Título de la nota" />
              <textarea className="form-input" rows="3" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Contenido..." style={{ resize: 'vertical' }} />
              <button className="btn btn-cyan" disabled={uploadLoading}>Guardar</button>
            </form>

            <input type="file" multiple onChange={handleFileUpload} className="form-input" />

            {sourceLoading ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Cargando documentos...</div>
            ) : sources.length === 0 ? (
              <div style={{ padding: '18px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                No hay documentos ni notas todavía.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sources.map(src => (
                  <div key={src.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <strong style={{ color: '#ffffff', fontSize: '0.82rem' }}>{src.name}</strong>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.68rem', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span>{src.content_type || 'nota'}</span>
                        <span className={`badge ${src.sync_status === 'error' ? 'badge-rose' : (src.sync_status === 'analyzed' || src.processed ? 'badge-emerald' : 'badge-cyan')}`} style={{ fontSize: '0.55rem', padding: '1px 6px' }}>
                          {src.sync_status === 'error' ? 'Error' : (src.sync_status === 'analyzed' || src.processed ? 'Analizado' : 'Pendiente')}
                        </span>
                      </div>
                    </div>
                    <button className="btn btn-outline" onClick={() => handleDeleteSource(src.id)} style={{ height: '30px', fontSize: '0.68rem' }}>
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="view-content-limit">
      {/* Inner View Navigation */}
      <div className="sub-tabs-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <button
          onClick={() => setActiveTab('diary')}
          className={`sub-tab-btn ${activeTab === 'diary' ? 'active' : ''}`}
          style={{
            borderLeft: '2px solid var(--color-emerald)',
            position: 'relative',
            overflow: 'visible'
          }}
        >
          🔥 1. Diario de Sensaciones
          <span style={{
            position: 'absolute',
            top: '-7px',
            right: '-6px',
            background: 'var(--color-emerald)',
            color: '#000000',
            fontSize: '0.45rem',
            fontWeight: 900,
            padding: '1px 5px',
            borderRadius: '10px',
            boxShadow: '0 0 8px rgba(16,185,129,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Diario
          </span>
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`sub-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
        >
          2. Eje Cronológico de Trauma
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`sub-tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
        >
          3. Contexto Paciente (NotebookLM)
        </button>
        <button
          onClick={() => setActiveTab('clinical_facts')}
          className={`sub-tab-btn ${activeTab === 'clinical_facts' ? 'active' : ''}`}
          style={{ borderLeft: '2px solid var(--color-cyan)' }}
        >
          4. Hechos y Casos Clínicos
        </button>
        <button
          onClick={() => setActiveTab('barkley')}
          className={`sub-tab-btn ${activeTab === 'barkley' ? 'active' : ''}`}
        >
          📚 5. Recursos y Evidencia Científica
        </button>
      </div>

      {/* TAB 1: DIARIO DE SENSACIONES */}
      {activeTab === 'diary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Banner de Recordatorio Diario */}
          <div className="glass-panel" style={{
            padding: '16px 20px',
            background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 8, 16, 0.5) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.15)',
            borderLeft: '4px solid var(--color-emerald)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{ fontSize: '1.4rem' }}>📅</div>
            <div>
              <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block', marginBottom: '2px' }}>
                ACTIVIDAD RECOMENDADA: Registro Diario de Cortisol & Impulsividad
              </strong>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.35', display: 'block' }}>
                Registra tus sensaciones físicas, ansiedad e impulsividad a diario (especialmente antes de empezar a operar). Ánquer analizará tus sesgos emocionales y los integrará de manera incremental en tu plan de blindaje clínico.
              </span>
            </div>
          </div>

          <div className="grid-2">
            {/* Form Card */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlusCircle size={20} color="var(--color-emerald)" />
                Registrar Sensaciones de Hoy
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Este registro permite a Ánquer (tu terapeuta) supervisar tu ansiedad y el impacto del tratamiento.
              </p>

              <form onSubmit={handleSaveMood} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="form-label">Nivel de Ansiedad ({anxiety}/10)</label>
                    <span style={{ fontSize: '0.75rem', color: anxiety > 7 ? 'var(--color-rose)' : 'var(--text-secondary)' }}>
                      {anxiety > 7 ? 'Muy Elevada' : 'Moderada'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={anxiety}
                    onChange={(e) => setAnxiety(e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
                  />
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label className="form-label">Nivel de Impulsividad ({impulsivity}/10)</label>
                    <span style={{ fontSize: '0.75rem', color: impulsivity > 7 ? 'var(--color-rose)' : 'var(--text-secondary)' }}>
                      {impulsivity > 7 ? 'Riesgo de Operar' : 'Estable'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={impulsivity}
                    onChange={(e) => setImpulsivity(e.target.value)}
                    style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
                  />
                </div>

                {/* Checkbox de operado hoy de trading removido */}

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Notas, pensamientos o disparadores (triggers)</label>
                    <button
                      type="button"
                      onClick={handleDictateNotes}
                      className={`btn-icon ${isDictatingNotes ? 'animate-pulse-soft' : ''}`}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: isDictatingNotes ? 'var(--color-rose)' : 'var(--color-cyan)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.68rem',
                        fontWeight: 700
                      }}
                      title={isDictatingNotes ? "Grabando voz... Haz clic para detener" : "Dictar notas por voz"}
                    >
                      {isDictatingNotes ? <MicOff size={13} /> : <Mic size={13} />}
                      <span>{isDictatingNotes ? 'Grabando...' : 'Dictar por voz'}</span>
                    </button>
                  </div>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder={isDictatingNotes ? "Escuchando... Habla ahora." : "Describe cómo te sientes hoy, si hay pensamientos negativos o pánico..."}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={{ resize: 'none', border: isDictatingNotes ? '1px solid var(--color-rose)' : '1px solid var(--border)' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-emerald"
                  disabled={loading || profile?.role === 'supervisor'}
                  style={{ height: '44px', width: '100%' }}
                >
                  {loading ? 'Guardando...' : profile?.role === 'supervisor' ? 'Modo de Solo Lectura' : 'Guardar en Áncora'}
                </button>
              </form>
            </div>

          {/* History Card */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="var(--color-cyan)" />
                Historial de Sensaciones
              </h3>
              <button onClick={fetchHistory} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <RefreshCw size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '360px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>
                  No hay registros diarios guardados en Áncora.
                </p>
              ) : (
                history.map((h) => (
                  <div key={h.id} style={{
                    padding: '14px',
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>{h.date}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {h.trading_today && (
                          <span className="badge badge-rose">OPERÓ</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <span>Ansiedad: <strong style={{ color: h.anxiety_level > 7 ? 'var(--color-rose)' : '#ffffff' }}>{h.anxiety_level}/10</strong></span>
                      <span>Nivel del d?a: <strong style={{ color: h.impulsivity_level > 7 ? 'var(--color-rose)' : '#ffffff' }}>{h.impulsivity_level}/10</strong></span>
                    </div>
                    {h.notes && (
                      <p style={{ color: 'var(--text-primary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.1)', padding: '6px 10px', borderRadius: '4px' }}>
                        "{h.notes}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* TAB 2: EJE CRONOLÓGICO DE TRAUMA */}
      {activeTab === 'timeline' && (
        <div className="grid-2">
          {/* Interactive Timeline */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="var(--color-cyan)" />
              Eje Cronológico de Usuario
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Selecciona un hito de tu historia de vida para revelar el reencuadre cognitivo diseñado para tu terapia.
            </p>

            <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {dynamicTimelineItems.map((item, idx) => (
                <div
                  key={idx}
                  className="timeline-item"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedTimelineItem(item)}
                >
                  <div className={`timeline-badge ${item.type}`} />
                  <div className="timeline-content" style={{
                    border: selectedTimelineItem?.title === item.title ? '1px solid var(--color-cyan)' : '1px solid var(--border)',
                    background: selectedTimelineItem?.title === item.title ? 'hsla(var(--cyan), 0.03)' : 'var(--background-secondary)'
                  }}>
                    <span className="timeline-date">{item.date}</span>
                    <h4 className="timeline-title" style={{ color: item.type === 'positive' ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                      {item.title}
                    </h4>
                    <p className="timeline-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reframe Panel Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {selectedTimelineItem ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <span className="badge badge-cyan" style={{ marginBottom: '4px', alignSelf: 'flex-start' }}>Reencuadre Terapéutico ( Ánquer )</span>
                  
                  <h3 style={{ fontSize: '1.25rem', margin: 0, color: selectedTimelineItem.type === 'positive' ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                    {selectedTimelineItem.title}
                  </h3>

                  {selectedTimelineItem.hechoClinico && (
                    <div style={{ fontSize: '0.75rem', color: '#ffffff', borderLeft: '2px solid var(--color-cyan)', paddingLeft: '8px' }}>
                      <strong>Detonante Clínico:</strong> {selectedTimelineItem.hechoClinico}
                    </div>
                  )}

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong>Análisis Evolutivo:</strong> {selectedTimelineItem.desc}
                  </div>

                  <div style={{
                    padding: '16px',
                    background: 'hsla(var(--cyan), 0.05)',
                    border: '1px solid hsla(var(--cyan), 0.25)',
                    borderRadius: 'var(--radius-md)',
                    lineHeight: 1.5,
                    fontSize: '0.85rem',
                    marginTop: '4px'
                  }}>
                    <p style={{ color: '#ffffff', fontWeight: 500, margin: 0 }}>
                      {selectedTimelineItem.reframe}
                    </p>
                  </div>

                  {selectedTimelineItem.pautas && (
                    <div style={{
                      padding: '10px 12px',
                      background: 'rgba(16, 185, 129, 0.03)',
                      border: '1px solid rgba(16, 185, 129, 0.12)',
                      borderRadius: '6px',
                      color: 'var(--color-emerald)',
                      fontSize: '0.7rem'
                    }}>
                      <strong>💡 Pauta recomendada:</strong>
                      <p style={{ margin: '2px 0 0 0', color: 'rgba(255,255,255,0.95)' }}>
                        {selectedTimelineItem.pautas}
                      </p>
                    </div>
                  )}

                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4, margin: 0 }}>
                    <strong>Nota de Ánquer:</strong> En tu terapia EMDR, enfócate en la sensación física que te produce este recuerdo y sustitúyela con esta verdad de reencuadre. El trauma no es tu identidad.
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Brain size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 16px' }} />
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Haz clic en un hito del eje cronológico</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '6px', maxWidth: '280px', margin: '6px auto 0' }}>
                    Visualiza y reprocesa los fantasmas de tu pasado para liberar tu toma de decisiones en el presente.
                  </p>
                </div>
              )}
            </div>

            <div className="glass-panel" style={{ padding: '24px', background: 'hsla(var(--emerald), 0.01)' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--color-emerald)' }}>¿Por qué la parálisis en el éxito?</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Tu trauma infantil te grabó a fuego que <strong>"no mereces nada bueno"</strong>. Cuando vas ganando en el trading, tu cerebro límbico entra en pánico al violar esa regla identitaria antigua. Te paralizas (freeze) en lugar de cerrar, provocando la pérdida para auto-sabotearte y regresar a la "zona de confort traumática" del fracaso conocido.
              </p>
            </div>
          </div>
        </div>
      )}



      {/* TAB 5: RECURSOS Y EVIDENCIA CIENTÍFICA */}
      {activeTab === 'barkley' && (() => {
        const profileFuentes = profile?.contexto_terapeutico?.fuentes_ayuda || [];
        
        // Combinar DEFAULT_RESOURCES y fuentes del perfil desduplicadas por título
        const combined = [...DEFAULT_RESOURCES, ...profileFuentes];
        const seenTitles = new Set();
        const listToDisplay = [];
        for (const item of combined) {
          const parsed = parseResource(item);
          const titleKey = (parsed.titulo || parsed.libro || '').toLowerCase().trim();
          if (titleKey && !seenTitles.has(titleKey)) {
            seenTitles.add(titleKey);
            listToDisplay.push(parsed);
          }
        }
        
        const hasFuentes = profileFuentes.length > 0;

        // Clasificar y filtrar recursos
        const filteredResources = listToDisplay.map((item, idx) => ({ ...item, originalIdx: idx }))
          .filter(parsed => {
            // Filtro de categorías
            if (selectedCategory !== 'All') {
              const cat = selectedCategory.toLowerCase();
              const symptom = parsed.sintoma.toLowerCase();
              if (cat === 'trauma' && !symptom.includes('trauma')) return false;
              if (cat === 'tdah' && (!symptom.includes('tdah') && !symptom.includes('impulsiv') && !symptom.includes('ejecutiv'))) return false;
              if (cat === 'panico' && (!symptom.includes('agorafobia') && !symptom.includes('pánico') && !symptom.includes('ansiedad') && !symptom.includes('fobia'))) return false;
              if (cat === 'deudas' && (!symptom.includes('deuda') && !symptom.includes('autosabotaje') && !symptom.includes('dinero') && !symptom.includes('escala'))) return false;
              if (cat === 'resiliencia' && (!symptom.includes('resiliencia') && !symptom.includes('culpa') && !symptom.includes('suicidio') && !symptom.includes('vago') && !symptom.includes('meditación'))) return false;
            }
            // Buscador por texto
            if (searchTerm.trim() !== '') {
              const term = searchTerm.toLowerCase();
              return parsed.autor.toLowerCase().includes(term) ||
                     parsed.titulo.toLowerCase().includes(term) ||
                     parsed.justificacion.toLowerCase().includes(term) ||
                     parsed.adaptacion.toLowerCase().includes(term) ||
                     parsed.practica.toLowerCase().includes(term);
            }
            return true;
          });

        // Contar el progreso
        const totalItems = listToDisplay.length;
        const completedCount = listToDisplay.filter((_, idx) => checkedItems[`resource_${idx}`]).length;
        const percentCompleted = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

        const categories = [
          { id: 'All', label: '📚 Todos', color: 'var(--color-cyan)' },
          { id: 'Trauma', label: '🧠 Trauma Complejo', color: 'var(--color-cyan)' },
          { id: 'TDAH', label: '⚡ TDAH / Impulsividad', color: '#f59e0b' },
          { id: 'Panico', label: '📊 Pánico / Agorafobia', color: 'var(--color-rose)' },
          { id: 'Deudas', label: '💸 Dinero y Autosabotaje', color: '#8b5cf6' },
          { id: 'Resiliencia', label: '🛡️ Resiliencia / Calma', color: 'var(--color-emerald)' }
        ];

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Banner explicativo del origen de la información */}
            <div className="glass-panel" style={{
              padding: '16px 20px',
              background: hasFuentes 
                ? 'linear-gradient(90deg, rgba(6, 182, 212, 0.05) 0%, rgba(5, 8, 16, 0.5) 100%)'
                : 'linear-gradient(90deg, rgba(16, 185, 129, 0.03) 0%, rgba(5, 8, 16, 0.5) 100%)',
              border: hasFuentes 
                ? '1px solid rgba(6, 182, 212, 0.15)'
                : '1px solid rgba(16, 185, 129, 0.12)',
              borderLeft: hasFuentes
                ? '4px solid var(--color-cyan)'
                : '4px solid var(--color-emerald)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px'
            }}>
              <div style={{ fontSize: '1.4rem' }}>{hasFuentes ? '✨' : '📚'}</div>
              <div>
                <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block', marginBottom: '2px' }}>
                  {hasFuentes 
                    ? 'Recursos Personalizados Encontrados por Ánquer' 
                    : 'Portal de Evidencia Científica y Lectura Clínica'}
                </strong>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: '1.4', display: 'block' }}>
                  {hasFuentes 
                    ? 'Este portal compila referencias personalizadas obtenidas mediante el Deep Research clínico de Ánquer sobre tu caso.'
                    : ' Ánquer no ha consolidado recursos específicos para tu caso actual. Abajo se listan las fuentes científicas base del andamiaje conductual. Sincroniza tu Mente para poblar este catálogo.'}
                </span>
              </div>
            </div>

            {/* Buscador de Fuentes mediante Ánquer IA */}
            <div className="glass-panel" style={{
              padding: '20px',
              border: '1px solid rgba(6, 182, 212, 0.15)',
              background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(5, 8, 16, 0.3) 100%)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--color-cyan)" className={searchAgentStatus === 'searching' ? 'animate-spin' : ''} />
                  <h4 style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Buscador de Fuentes Científicas Ánquer IA
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingTopics(!isEditingTopics)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-cyan)',
                    fontSize: '0.68rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 700
                  }}
                  className="conv-item-hover"
                >
                  ⚙️ {isEditingTopics ? 'Cerrar Gestor de Temas' : 'Administrar Temas de Síntomas'}
                </button>
              </div>

              <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                Selecciona un síntoma o tema para que Ánquer realice una búsqueda profunda de literatura científica comprobada (estilo NotebookLM con Deep Search) y genere fichas adaptadas con ejercicios prácticos.
              </p>

              {/* GESTIÓN DE TEMAS (COLLAPSIBLE) */}
              {isEditingTopics && (
                <div style={{
                  background: 'rgba(5, 8, 16, 0.5)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginTop: '4px'
                }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--color-cyan)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Editar Temas de Síntomas Existentes
                  </span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto', paddingRight: '4px' }}>
                    {availableTopics.map((topic, tIdx) => (
                      <div key={tIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => {
                            const updated = [...availableTopics];
                            updated[tIdx] = e.target.value;
                            setAvailableTopics(updated);
                          }}
                          style={{
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            color: '#ffffff',
                            fontSize: '0.72rem',
                            padding: '4px 8px',
                            flex: 1,
                            outline: 'none'
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = availableTopics.filter((_, i) => i !== tIdx);
                            setAvailableTopics(updated);
                            if (selectedTopicDropdown === topic) {
                              setSelectedTopicDropdown(updated[0] || 'custom');
                            }
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-rose)',
                            cursor: 'pointer',
                            padding: '4px'
                          }}
                          className="conv-item-hover"
                          title="Eliminar tema"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '8px', marginTop: '4px' }}>
                    <input
                      type="text"
                      placeholder="Añadir nuevo tema de síntoma..."
                      value={newTopicToDropdown}
                      onChange={(e) => setNewTopicToDropdown(e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        color: '#ffffff',
                        fontSize: '0.72rem',
                        padding: '4px 8px',
                        flex: 1,
                        outline: 'none'
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newTopicToDropdown.trim()) {
                            setAvailableTopics([...availableTopics, newTopicToDropdown.trim()]);
                            setSelectedTopicDropdown(newTopicToDropdown.trim());
                            setNewTopicToDropdown('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newTopicToDropdown.trim()) {
                          setAvailableTopics([...availableTopics, newTopicToDropdown.trim()]);
                          setSelectedTopicDropdown(newTopicToDropdown.trim());
                          setNewTopicToDropdown('');
                        }
                      }}
                      className="btn btn-cyan"
                      style={{ height: '26px', padding: '0 10px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={10} /> Añadir
                    </button>
                  </div>
                </div>
              )}

              {/* FORMULARIO DE BÚSQUEDA */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  
                  {/* Selector de Síntomas */}
                  <div style={{ flex: '1 1 200px' }}>
                    <select
                      value={selectedTopicDropdown}
                      onChange={(e) => setSelectedTopicDropdown(e.target.value)}
                      disabled={searchAgentStatus === 'searching'}
                      style={{
                        background: 'rgba(5, 8, 16, 0.6)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        color: '#ffffff',
                        fontSize: '0.74rem',
                        outline: 'none',
                        width: '100%',
                        height: '34px',
                        cursor: 'pointer'
                      }}
                    >
                      {availableTopics.map((topic, tIdx) => (
                        <option key={tIdx} value={topic} style={{ background: '#0a0f1e', color: '#fff' }}>
                          {topic}
                        </option>
                      ))}
                      <option value="custom" style={{ background: '#0a0f1e', color: 'var(--color-cyan)' }}>
                        ➕ Tema Libre / Personalizado...
                      </option>
                    </select>
                  </div>

                  {/* Botón de Ejecutar */}
                  <button
                    onClick={handleTriggerSearchAgent}
                    disabled={searchAgentStatus === 'searching' || (selectedTopicDropdown === 'custom' && !customSearchTopic.trim())}
                    className="btn btn-cyan"
                    style={{
                      height: '34px',
                      padding: '0 16px',
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: searchAgentStatus === 'searching' || (selectedTopicDropdown === 'custom' && !customSearchTopic.trim()) ? 'not-allowed' : 'pointer',
                      opacity: (selectedTopicDropdown === 'custom' && !customSearchTopic.trim()) ? 0.5 : 1
                    }}
                  >
                    {searchAgentStatus === 'searching' ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Buscando...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        <span>Buscar Fuentes con IA</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Input de búsqueda libre si se escoge esa opción */}
                {selectedTopicDropdown === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(5, 8, 16, 0.6)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px' }}>
                    <Search size={14} color="var(--color-cyan)" />
                    <input
                      type="text"
                      placeholder="Escribe el síntoma o tema libre a buscar con Ánquer IA (ej. Trauma de rechazo, adicciones)..."
                      value={customSearchTopic}
                      onChange={(e) => setCustomSearchTopic(e.target.value)}
                      disabled={searchAgentStatus === 'searching'}
                      style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.74rem', outline: 'none', width: '100%' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleTriggerSearchAgent();
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {searchAgentStatus === 'searching' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(6, 182, 212, 0.05)', border: '1px solid rgba(6, 182, 212, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                  <RefreshCw size={12} color="var(--color-cyan)" className="animate-spin" />
                  <span style={{ fontSize: '0.64rem', color: 'var(--color-cyan)', fontWeight: 600 }}>
                    Ánquer está realizando una búsqueda profunda (Deep Search) en bases de datos clínicas. Esto podría tardar unos segundos...
                  </span>
                </div>
              )}

              {searchAgentStatus === 'completed' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                  <CheckCircle2 size={12} color="var(--color-emerald)" />
                  <span style={{ fontSize: '0.64rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
                    ¡Investigación completada! Ficha científica y ejercicios cargados. Haz clic en la tarjeta de abajo para ver la ficha ampliada.
                  </span>
                </div>
              )}

              {searchAgentStatus === 'failed' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                  <AlertOctagon size={12} color="var(--color-rose)" />
                  <span style={{ fontSize: '0.64rem', color: 'var(--color-rose)', fontWeight: 600 }}>
                    Error de Búsqueda: {searchTaskError || 'No se pudo contactar con Ánquer.'}
                  </span>
                </div>
              )}
            </div>
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                
                {/* Buscador interactivo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(5, 8, 16, 0.6)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px 12px', flex: '1 1 300px' }}>
                  <Search size={16} color="var(--text-tertiary)" />
                  <input
                    type="text"
                    placeholder="Buscar referencias por autor, libro o pauta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.76rem', outline: 'none', width: '100%' }}
                  />
                </div>

                {/* Barra de progreso clínico */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px', flex: '0 0 auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.64rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                    <span>Prácticas Clínicas Aplicadas</span>
                    <span style={{ color: 'var(--color-cyan)', fontWeight: 800 }}>{completedCount} / {totalItems} ({percentCompleted}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${percentCompleted}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-emerald) 0%, var(--color-cyan) 100%)', borderRadius: '3px' }} />
                  </div>
                </div>
              </div>

              {/* Botones de Categorías */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '14px' }}>
                {categories.map(cat => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className="sub-tab-btn"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        background: isActive ? `rgba(${cat.id === 'All' ? '6,182,212' : cat.id === 'TDAH' ? '245,158,11' : cat.id === 'Panico' ? '244,63,94' : cat.id === 'Deudas' ? '139,92,246' : '16,185,129'}, 0.12)` : 'transparent',
                        borderColor: isActive ? cat.color : 'var(--border)',
                        color: isActive ? '#ffffff' : 'var(--text-secondary)',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        borderRadius: '14px'
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Listado de Tarjetas en Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
              {filteredResources.length === 0 ? (
                <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
                  No se encontraron referencias para tu búsqueda.
                </div>
              ) : (
                filteredResources.map((parsed) => {
                  const idx = parsed.originalIdx;
                  let ResourceIcon = BookOpen;
                  if (parsed.tipo === 'video') ResourceIcon = Video;
                  else if (parsed.tipo === 'estudio') ResourceIcon = FileText;
                  else if (parsed.tipo === 'ensayo') ResourceIcon = BookOpenCheck;

                  let symptomColor = 'var(--color-emerald)';
                  if (parsed.sintoma.toLowerCase().includes('tdah') || parsed.sintoma.toLowerCase().includes('impulsiv')) {
                    symptomColor = '#f59e0b';
                  } else if (parsed.sintoma.toLowerCase().includes('trauma')) {
                    symptomColor = 'var(--color-cyan)';
                  } else if (parsed.sintoma.toLowerCase().includes('agorafobia') || parsed.sintoma.toLowerCase().includes('pánico')) {
                    symptomColor = 'var(--color-rose)';
                  } else if (parsed.sintoma.toLowerCase().includes('deuda') || parsed.sintoma.toLowerCase().includes('escala') || parsed.sintoma.toLowerCase().includes('dinero') || parsed.sintoma.toLowerCase().includes('autosabotaje')) {
                    symptomColor = '#8b5cf6';
                  } else if (parsed.sintoma.toLowerCase().includes('resiliencia') || parsed.sintoma.toLowerCase().includes('calma') || parsed.sintoma.toLowerCase().includes('meditación')) {
                    symptomColor = 'var(--color-emerald)';
                  }

                  return (
                    <div
                      key={idx}
                      className="conv-item-hover glass-panel"
                      style={{
                        padding: '20px',
                        borderLeft: `4px solid ${symptomColor}`,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'all 0.25s ease',
                        background: 'rgba(5, 8, 16, 0.2)',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSelectedResourceDetail(parsed);
                        setModalDetailTab('resumen');
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '10px' }}>
                        <div>
                          {parsed.autor && (
                            <span style={{ 
                              fontSize: '0.58rem', 
                              fontWeight: '800', 
                              color: symptomColor,
                              textTransform: 'uppercase', 
                              letterSpacing: '0.08em',
                              display: 'block',
                              marginBottom: '2px'
                            }}>
                              {parsed.autor}
                            </span>
                          )}
                          <h4 style={{ 
                            fontSize: '0.84rem', 
                            fontWeight: '800', 
                            color: '#ffffff', 
                            margin: 0,
                            lineHeight: '1.3'
                          }}>
                            {parsed.titulo}
                          </h4>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                          <div className="flex-center" style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            background: 'rgba(255,255,255,0.02)',
                            border: '1px solid var(--border)',
                            color: symptomColor
                          }} title={parsed.tipo.toUpperCase()}>
                            <ResourceIcon size={12} />
                          </div>
                        </div>
                      </div>

                      <span className="badge" style={{ 
                        alignSelf: 'flex-start',
                        background: `${symptomColor}12`,
                        color: symptomColor,
                        borderColor: `${symptomColor}25`,
                        fontSize: '0.55rem',
                        padding: '1px 6px',
                        fontWeight: '700'
                      }}>
                        {parsed.sintoma}
                      </span>

                      {parsed.justificacion && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                          <span style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '2px', letterSpacing: '0.04em' }}>¿Por qué ayuda?</span>
                          <p style={{ 
                            fontSize: '0.68rem', 
                            color: 'var(--text-secondary)', 
                            lineHeight: '1.4',
                            margin: 0
                          }}>
                            {parsed.justificacion}
                          </p>
                        </div>
                      )}

                      {parsed.adaptacion && (
                        <div style={{
                          padding: '10px 12px',
                          background: 'rgba(5, 8, 16, 0.45)',
                          border: '1px solid rgba(255, 255, 255, 0.02)',
                          borderRadius: '6px',
                          borderLeft: `3px solid ${symptomColor}`
                        }}>
                          <span style={{ fontSize: '0.58rem', color: symptomColor, textTransform: 'uppercase', display: 'block', marginBottom: '2px', letterSpacing: '0.04em' }}>Adaptación a Emilio:</span>
                          <p style={{ 
                            fontSize: '0.68rem', 
                            color: 'var(--text-primary)', 
                            lineHeight: '1.4',
                            margin: 0
                          }}>
                            {parsed.adaptacion}
                          </p>
                        </div>
                      )}

                      {parsed.practica && (
                        <div style={{ 
                          paddingTop: '8px', 
                          borderTop: '1px solid rgba(255, 255, 255, 0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <div 
                            style={{
                              display: 'flex',
                              gap: '8px',
                              alignItems: 'flex-start',
                              fontSize: '0.66rem',
                              color: 'var(--text-secondary)',
                              background: 'rgba(5, 8, 16, 0.3)',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              style={{ marginTop: '2px', cursor: 'pointer', accentColor: symptomColor }}
                              id={`check-${idx}`}
                              checked={!!checkedItems[`resource_${idx}`]}
                              onChange={(e) => {
                                const newChecked = { ...checkedItems, [`resource_${idx}`]: e.target.checked };
                                setCheckedItems(newChecked);
                                localStorage.setItem(`mente_checked_${user?.id}`, JSON.stringify(newChecked));
                              }}
                            />
                            <label htmlFor={`check-${idx}`} style={{ cursor: 'pointer', lineHeight: '1.35' }}>
                              <strong style={{ color: symptomColor }}>Práctica: </strong>{parsed.practica}
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Panel inferior sobre la regulación biológica */}
            <div className="glass-panel flex-center" style={{ padding: '20px', gap: '14px', background: 'rgba(255,255,255,0.01)', borderColor: 'var(--border)' }}>
              <AlertOctagon size={24} color="var(--color-cyan)" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.74rem', lineHeight: 1.45, color: 'var(--text-secondary)' }}>
                <strong style={{ color: '#ffffff' }}>Evidencia sobre la Regulación:</strong> Los estudios demuestran que las dificultades de autocontrol en entornos de alto estrés (como el trading financiero) no se deben a la falta de conocimiento o de voluntad, sino al agotamiento fisiológico de las funciones ejecutivas de la corteza prefrontal. La única intervención eficaz es la creación de andamiajes externos y el blindaje operativo que restrinja el acceso a cuentas de trading cuando la impulsividad o la ansiedad superen el umbral límite.
              </span>
            </div>

          </div>
        );
      })()}

      {/* TAB 3: FUENTES DEL PACIENTE (NOTEBOOKLM-STYLE) */}
      {activeTab === 'sources' && (
        <div className="grid-2">
          {/* Upload and creation panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UploadCloud size={20} color="var(--color-cyan)" />
                Cargar Contexto Personal (NotebookLM)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Sube reportes, notas de texto o informes. Ánquer los asimilará como contexto complementario en vuestro chat para orientar la terapia.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* File Uploader */}
              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.01)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              className="conv-item-hover"
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                  disabled={uploadLoading}
                />
                <UploadCloud size={32} color="var(--color-cyan)" style={{ margin: '0 auto 8px' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', color: '#ffffff' }}>
                  {uploadLoading ? 'Procesando archivos...' : 'Arrastra o selecciona archivos'}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  Se admiten múltiples imágenes, PDFs, notas de texto o informes
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 800 }}>O escribe una nota manual</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              {/* Note Form */}
              <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Título de la Nota</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Anotaciones de pánico, Informe médico 2024..."
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    required
                    style={{ height: '38px', fontSize: '0.8rem' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Contenido de la Fuente</label>
                  <textarea
                    className="form-input"
                    rows="5"
                    placeholder="Escribe o pega aquí el texto que servirá de contexto para Ánquer..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    required
                    style={{ resize: 'none', fontSize: '0.8rem' }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-cyan"
                  style={{ height: '38px', fontSize: '0.78rem', fontWeight: 700 }}
                  disabled={uploadLoading || !noteTitle.trim() || !noteContent.trim()}
                >
                  {uploadLoading ? 'Guardando...' : 'Añadir a Fuentes'}
                </button>
              </form>
            </div>
          </div>

          {/* Uploaded sources grid */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderOpen size={20} color="var(--color-cyan)" />
              Documentos y notas ({sources.length})
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '420px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sourceLoading ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>
                  Cargando documentos...
                </p>
              ) : sources.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
                  <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>Aún no has subido documentos o notas.</p>
                  <p style={{ fontSize: '0.7rem', marginTop: '4px' }}>Ánquer solo usará sus pautas base hasta que agregues fuentes.</p>
                </div>
              ) : (
                sources.map((src) => (
                  <div
                    key={src.id}
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.015)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 0.2s ease'
                    }}
                    className="conv-item-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div className="flex-center" style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: src.content_type === 'note' ? 'hsla(var(--cyan), 0.08)' : 'rgba(255,255,255,0.03)',
                        border: '1px solid ' + (src.content_type === 'note' ? 'hsla(var(--cyan), 0.2)' : 'var(--border)'),
                        color: 'var(--color-cyan)',
                        flexShrink: 0
                      }}>
                        {src.content_type === 'note' ? <BookOpenCheck size={16} /> : <FileText size={16} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={src.name}>
                            {src.name}
                          </span>
                          {src.sync_status === 'error' ? (
                            <span className="badge badge-rose" title={src.extraction_error || ''} style={{ fontSize: '0.55rem', padding: '1px 6px', height: '16px', textTransform: 'none', letterSpacing: '0.02em', borderRadius: '4px', fontWeight: 600 }}>
                              Error al analizar
                            </span>
                          ) : (src.sync_status === 'analyzed' || src.processed) ? (
                            <span className="badge badge-emerald" style={{ fontSize: '0.55rem', padding: '1px 6px', height: '16px', textTransform: 'none', letterSpacing: '0.02em', borderRadius: '4px', fontWeight: 600 }}>
                              🧠 Leído por Ánquer
                            </span>
                          ) : (
                            <span className="badge badge-cyan animate-pulse-soft" style={{ fontSize: '0.55rem', padding: '1px 6px', height: '16px', textTransform: 'none', letterSpacing: '0.02em', borderRadius: '4px', fontWeight: 600, border: '1px solid var(--color-cyan)', boxShadow: '0 0 6px hsla(var(--cyan), 0.3)' }}>
                              🆕 Nuevo (Pendiente Sinc)
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                          {src.content_type === 'note' ? 'Nota manual' : 'Archivo de texto'} • {new Date(src.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => setSelectedSource(src)}
                        className="btn btn-outline flex-center"
                        style={{ padding: '6px', borderRadius: '6px', width: '28px', height: '28px', minWidth: 0 }}
                        title="Ver contenido"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSource(src.id)}
                        className="btn btn-outline flex-center"
                        style={{ padding: '6px', borderRadius: '6px', width: '28px', height: '28px', minWidth: 0, borderColor: 'rgba(244,63,94,0.3)', color: 'var(--color-rose)' }}
                        title="Eliminar de las fuentes"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HECHOS Y CASOS CLÍNICOS CONSOLIDADOS */}
      {activeTab === 'clinical_facts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Diagnostic Sync and Patient Photo */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Brain size={24} color="var(--color-cyan)" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, textShadow: '0 0 10px rgba(6,182,212,0.15)' }}>
                    Diagnóstico Clínico & Evolución Psicológica
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                    Análisis terapéutico estructurado y consolidado por Ánquer para Usuario.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {!isEditingMente ? (
                  <button
                    onClick={startEditingMente}
                    className="btn btn-outline flex-center"
                    style={{ gap: '8px', height: '36px', padding: '0 16px', fontSize: '0.78rem', fontWeight: 700 }}
                  >
                    ✏️ Editar Memoria
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveMente}
                      className="btn btn-emerald flex-center animate-glow-emerald"
                      style={{ gap: '8px', height: '36px', padding: '0 16px', fontSize: '0.78rem', fontWeight: 700 }}
                    >
                      💾 Guardar Memoria
                    </button>
                    <button
                      onClick={() => setIsEditingMente(false)}
                      className="btn btn-outline flex-center"
                      style={{ gap: '8px', height: '36px', padding: '0 16px', fontSize: '0.78rem', fontWeight: 700 }}
                    >
                      Cancelar
                    </button>
                  </>
                )}
                <button
                  onClick={handleSyncProfile}
                  className="btn btn-cyan flex-center animate-glow-cyan"
                  style={{ gap: '8px', height: '36px', padding: '0 16px', fontSize: '0.78rem', fontWeight: 700 }}
                  disabled={syncLoading || isEditingMente}
                >
                  <RefreshCw size={14} className={syncLoading ? 'animate-spin' : ''} />
                  <span>{syncLoading ? 'Sincronizando...' : 'Sincronizar Mente'}</span>
                </button>
              </div>
            </div>

            {/* --- EDICIÓN O VISUALIZACIÓN DE MEMORIA CLÍNICA --- */}
            {isEditingMente ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-cyan)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ✏️ Editando Memoria Clínica de Usuario
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--color-cyan)', fontWeight: 800, fontSize: '0.78rem', marginBottom: '6px', display: 'block' }}>🧠 Diagnóstico Inicial de Base</label>
                    <textarea
                      className="form-input"
                      rows="6"
                      value={editDiagnosticoBase}
                      onChange={(e) => setEditDiagnosticoBase(e.target.value)}
                      style={{ width: '100%', fontSize: '0.78rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: '#fff', resize: 'none', padding: '10px', borderRadius: '6px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--color-rose)', fontWeight: 800, fontSize: '0.78rem', marginBottom: '6px', display: 'block' }}>⚠️ Mecanismos de Defensa Crónicos (uno por línea)</label>
                    <textarea
                      className="form-input"
                      rows="6"
                      value={editMecanismosDefensa}
                      onChange={(e) => setEditMecanismosDefensa(e.target.value)}
                      style={{ width: '100%', fontSize: '0.78rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: '#fff', resize: 'none', padding: '10px', borderRadius: '6px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--color-cyan)', fontWeight: 800, fontSize: '0.78rem', marginBottom: '6px', display: 'block' }}>🧠 Conclusiones Psicológicas (una por línea)</label>
                    <textarea
                      className="form-input"
                      rows="8"
                      value={editConclusiones}
                      onChange={(e) => setEditConclusiones(e.target.value)}
                      style={{ width: '100%', fontSize: '0.78rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: '#fff', resize: 'none', padding: '10px', borderRadius: '6px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--color-emerald)', fontWeight: 800, fontSize: '0.78rem', marginBottom: '6px', display: 'block' }}>⚖️ Compromisos de Operativa (uno por línea)</label>
                    <textarea
                      className="form-input"
                      rows="8"
                      value={editCompromisos}
                      onChange={(e) => setEditCompromisos(e.target.value)}
                      style={{ width: '100%', fontSize: '0.78rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: '#fff', resize: 'none', padding: '10px', borderRadius: '6px' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--color-rose)', fontWeight: 800, fontSize: '0.78rem', marginBottom: '6px', display: 'block' }}>📋 Pautas de Acción Consolidadas (una por línea)</label>
                    <textarea
                      className="form-input"
                      rows="8"
                      value={editPautasAccion}
                      onChange={(e) => setEditPautasAccion(e.target.value)}
                      style={{ width: '100%', fontSize: '0.78rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: '#fff', resize: 'none', padding: '10px', borderRadius: '6px' }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                  {/* --- CROQUIS INTERACTIVO DE SUPERVIVENCIA Y BLINDAJE (SISTEMA EN-78) --- */}
                  <div className="glass-panel" style={{
                    padding: '24px',
                    background: 'linear-gradient(135deg, rgba(10, 15, 30, 0.95), rgba(20, 25, 45, 0.98))',
                    border: '1px solid rgba(6, 182, 212, 0.25)',
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5), 0 0 15px rgba(6, 182, 212, 0.05)'
                  }}>
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '14px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <span className="badge badge-cyan" style={{ fontSize: '0.62rem', padding: '2px 8px', marginBottom: '6px', display: 'inline-block', fontWeight: 700 }}>Estructura EN-78</span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Brain size={18} color="var(--color-cyan)" />
                          Croquis Dinámico de Supervivencia y Blindaje Conductual
                        </h4>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                          Mapeo en tiempo real del escudo clínico, operativo (férula conductual de trading) y legal de Emilio. Se actualiza con el botón de sincronización.
                        </p>
                      </div>
                      <div className="flex-center" style={{ gap: '8px' }}>
                        <span className="badge badge-emerald" style={{ fontSize: '0.6rem', padding: '3px 8px', fontWeight: 700 }}>
                          Ánquer: Soul del Chat Sincronizado
                        </span>
                      </div>
                    </div>

                    <div className="grid-3" style={{ gap: '20px' }}>
                      {/* ÁMBITO CLÍNICO */}
                      <div className="glass-panel" style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(164, 114, 192, 0.2)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <h5 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-cyan)', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>1. ÁMBITO CLÍNICO (Sanación)</span>
                          <span style={{ fontSize: '0.58rem', color: 'var(--color-cyan)' }}>Base del Sistema</span>
                        </h5>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.72rem', lineHeight: 1.45 }}>
                          <div>
                            <strong style={{ color: '#ffffff', display: 'block' }}>Trauma de Desarrollo & Esquemas:</strong>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              Abusos en infancia e invalidación. Generan creencia nuclear de "fracaso" y "no merecimiento".
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '6px 10px', borderRadius: '6px' }}>
                            <strong style={{ color: '#ffffff' }}>Diario de Sensaciones:</strong>
                            {dailyMoodToday ? (
                              <span className="badge badge-emerald" style={{ fontSize: '0.58rem', fontWeight: 700 }}>✔ Registrado hoy</span>
                            ) : (
                              <span className="badge badge-rose" style={{ fontSize: '0.58rem', fontWeight: 700 }}>▲ Registro pendiente</span>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.15)', padding: '8px 10px', borderRadius: '6px' }}>
                            <strong style={{ color: '#ffffff', display: 'block' }}>Reset de Amígdala (Cortafuegos):</strong>
                            {anxiety > 7 ? (
                              <div className="alert alert-rose animate-pulse-soft" style={{ padding: '6px', fontSize: '0.66rem', margin: 0, borderRadius: '4px', fontWeight: 700 }}>
                                🚨 Ansiedad alta ({anxiety}/10). Se recomienda aplicar agua helada en la cara (10s) para inducir reset térmico.
                              </div>
                            ) : (
                              <span style={{ color: 'var(--color-cyan)', fontSize: '0.68rem' }}>
                                Estímulo térmico listo. Ansiedad actual controlada ({anxiety}/10).
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Ámbito operativo de trading removido */}

                      {/* ÁMBITO LEGAL Y LABORAL */}
                      <div className="glass-panel" style={{
                        padding: '16px',
                        background: 'rgba(255, 255, 255, 0.01)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        <h5 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-cyan)', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>3. LEGAL & SUPERVIVENCIA</span>
                          <span style={{ fontSize: '0.58rem', color: 'var(--color-emerald)' }}>Sustento Burocrático</span>
                        </h5>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.72rem', lineHeight: 1.45 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '6px 10px', borderRadius: '6px' }}>
                            <strong style={{ color: '#ffffff' }}>Nómina por Baja IT (EFE):</strong>
                            <span className="badge badge-emerald" style={{ fontSize: '0.58rem', fontWeight: 700 }}>Estable (3.300 €/mes)</span>
                          </div>

                          <div>
                            <strong style={{ color: '#ffffff', display: 'block' }}>Salida Laboral ("No Apto" SMAC):</strong>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              Esperar alta del INSS &rarr; Servicio de Prevención EFE ("No Apto") &rarr; Despido Objetivo (33.600€ + paro) &rarr; Conciliación SMAC por Nulidad (Pacto: 70k-85k€).
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '6px 10px', borderRadius: '6px' }}>
                            <strong style={{ color: '#ffffff' }}>Alternativa Permanente:</strong>
                            <span style={{ color: 'var(--color-cyan)', fontSize: '0.66rem' }}>Incapacidad INSS por UCI/Agorafobia (100%)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- CONTEXTO CLÍNICO DE BASE (INMUTABLE) --- */}
                  
                  {/* Fila superior: Diagnóstico y Mecanismos */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {/* Diagnóstico Base */}
                    <div className="glass-panel" style={{
                      padding: '24px',
                      background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.05), rgba(15, 23, 42, 0.6))',
                      border: '1px solid hsla(var(--cyan), 0.25)',
                      borderRadius: '12px',
                      boxShadow: '0 0 15px rgba(6, 182, 212, 0.05)'
                    }}>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-cyan)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
                        <Brain size={16} />
                        Diagnóstico Clínico de Base (Ánquer)
                      </h5>
                      <p style={{ fontSize: '0.78rem', lineHeight: 1.6, color: '#ffffff', fontStyle: 'italic', margin: 0 }}>
                        {profile?.contexto_terapeutico?.contexto_base?.diagnostico_inicial || profile?.contexto_terapeutico?.foto_persona || "Paciente con TDAH del adulto con perfil impulsivo severo agravado por trauma complejo de la infancia, lo que desencadena patrones repetitivos de autosabotaje financiero ante hitos de éxito."}
                      </p>
                    </div>

                    {/* Mecanismos de Defensa */}
                    <div className="glass-panel" style={{
                      padding: '24px',
                      background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05), rgba(15, 23, 42, 0.6))',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      borderRadius: '12px',
                      boxShadow: '0 0 15px rgba(244, 63, 94, 0.05)'
                    }}>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-rose)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 0 }}>
                        <AlertOctagon size={16} />
                        Mecanismos de Defensa Crónicos
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(() => {
                          const defensas = profile?.contexto_terapeutico?.contexto_base?.mecanismos_defensa;
                          const list = Array.isArray(defensas) ? defensas : (typeof defensas === 'string' ? defensas.split('\n') : []);
                          if (list.length === 0) {
                            return <p style={{ fontSize: '0.78rem', lineHeight: 1.6, color: '#ffffff', margin: 0 }}>1. Negación de la escala de pérdida (ceguera de escala).\n2. Racionalización del riesgo post-pérdida.\n3. Autosabotaje inconsciente para retornar a la zona de confort traumática.</p>;
                          }
                          return list.map((def, dIdx) => (
                            <div key={dIdx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.78rem', lineHeight: 1.5, color: '#ffffff' }}>
                              <span style={{ color: 'var(--color-rose)', fontWeight: 800 }}>{dIdx + 1}.</span>
                              <span>{def}</span>
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* --- LÍNEA DE EVOLUCIÓN DE SESIONES (CRONOLÓGICA) --- */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={16} color="var(--color-cyan)" />
                      Línea de Evolución de Sesiones
                    </h4>

                    {(!profile?.contexto_terapeutico?.evoluciones || profile.contexto_terapeutico.evoluciones.length === 0) ? (
                      <div style={{ padding: '24px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)', borderRadius: '12px', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          No hay hitos evolutivos registrados todavía. Las evoluciones cronológicas se generan automáticamente al cerrar y consolidar sesiones terapéuticas con Ánquer.
                        </span>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '18px',
                        position: 'relative',
                        paddingLeft: '22px',
                        borderLeft: '2px solid rgba(6, 182, 212, 0.15)',
                        marginLeft: '10px'
                      }}>
                        {[...profile.contexto_terapeutico.evoluciones].filter(ev => ev.sesion_id || ev.session_id).sort((a, b) => getEvSortValue(a.fecha) - getEvSortValue(b.fecha)).map((ev, idx) => (
                          <div key={idx} style={{ position: 'relative' }}>
                            {/* Punto de la línea de tiempo */}
                            <div style={{
                              position: 'absolute',
                              left: '-29px',
                              top: '4px',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              background: ev.type === 'positive' ? 'var(--color-emerald)' : 'var(--color-cyan)',
                              border: '2px solid var(--background-primary)',
                              boxShadow: ev.type === 'positive' ? '0 0 8px var(--color-emerald)' : '0 0 8px var(--color-cyan)'
                            }} />

                            {/* Card de la Sesión */}
                            <div className="glass-panel" style={{
                              padding: '16px',
                              background: 'rgba(255, 255, 255, 0.015)',
                              border: '1px solid var(--border)',
                              borderRadius: '10px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff' }}>
                                  {ev.titulo_sesion || `Sesión Clínica`}
                                </span>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                  {renderDate(ev.fecha)}
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.74rem', lineHeight: 1.45 }}>
                                <p style={{ margin: 0, color: '#ffffff' }}>
                                  <strong>Hecho Clínico Analizado:</strong> <span style={{ color: 'var(--color-cyan)' }}>{ev.hecho_clinico}</span>
                                </p>
                                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                                  <strong>Análisis Evolutivo:</strong> {ev.analisis_evolutivo}
                                </p>
                                {ev.reframe && (
                                  <p style={{ margin: '4px 0 0 0', color: '#ffffff', fontStyle: 'italic', background: 'rgba(6,182,212,0.04)', padding: '6px 10px', borderRadius: '4px', borderLeft: '2px solid var(--color-cyan)' }}>
                                    <strong>Reencuadre:</strong> {ev.reframe}
                                  </p>
                                )}
                                {ev.pautas_y_compromisos && (
                                  <div style={{
                                    marginTop: '4px',
                                    padding: '8px 12px',
                                    background: 'rgba(16, 185, 129, 0.03)',
                                    border: '1px solid rgba(16, 185, 129, 0.12)',
                                    borderRadius: '6px',
                                    color: 'var(--color-emerald)'
                                  }}>
                                    <strong>Pautas y Compromisos de esta sesión:</strong>
                                    <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: 'rgba(16, 185, 129, 0.95)' }}>
                                      {Array.isArray(ev.pautas_y_compromisos) ? ev.pautas_y_compromisos.join('\n') : ev.pautas_y_compromisos}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* --- MAPA DE TEMAS CLÍNICOS GLOBALES (Rejilla de 6 Tarjetas) --- */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      🗺️ Temas Terapéuticos Globales (Eje Conductual - Máx 6)
                    </h4>
                    {(!profile?.contexto_terapeutico?.temas || profile.contexto_terapeutico.temas.length === 0) ? (
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>
                        Ánquer mapeará los temas clínicos activos, cerrados y emergentes tras sincronizar el análisis.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {profile.contexto_terapeutico.temas.slice(0, 6).map((tema, idx) => {
                          let badgeClass = 'badge-cyan';
                          let statusLabel = 'Emergente';
                          if (tema.status === 'active') {
                            badgeClass = 'badge-rose';
                            statusLabel = 'Activo';
                          } else if (tema.status === 'closed') {
                            badgeClass = 'badge-emerald';
                            statusLabel = 'Controlado / Cerrado';
                          }

                          const { conflicto, solucion } = parseTemaDescription(tema.description);

                          return (
                            <div
                              key={idx}
                              style={{
                                padding: '16px',
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.01), rgba(15,23,42,0.3))',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                              }}
                              className="conv-item-hover"
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff' }}>{tema.title}</span>
                                <span className={`badge ${badgeClass}`} style={{ fontSize: '0.55rem', padding: '2px 6px', fontWeight: 700 }}>{statusLabel}</span>
                              </div>
                              
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.74rem', lineHeight: 1.45 }}>
                                {/* Conflicto / Patrón */}
                                <div style={{ color: 'rgba(255,255,255,0.85)' }}>
                                  <strong style={{ color: 'var(--color-rose)', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '2px' }}>⚠️ Conflicto o Patrón:</strong>
                                  {conflicto || tema.description}
                                </div>
                                
                                {/* Solución */}
                                {solucion && (
                                  <div style={{ 
                                    marginTop: '4px',
                                    padding: '8px 10px', 
                                    background: 'rgba(6,182,212,0.03)', 
                                    border: '1px solid rgba(6,182,212,0.12)', 
                                    borderRadius: '6px',
                                    color: '#ffffff'
                                  }}>
                                    <strong style={{ color: 'var(--color-cyan)', display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '2px' }}>💡 Enfoque de Solución:</strong>
                                    {solucion}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* --- MEDIDAS Y CONCLUSIONES CONSOLIDADAS VIGENTES --- */}
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }} className="grid-3">
                    {/* Conclusiones */}
                    <div style={{ background: 'rgba(255,255,255,0.012)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                      <h5 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-cyan)', margin: '0 0 12px 0', borderBottom: '1px solid rgba(6,182,212,0.15)', paddingBottom: '6px' }}>
                        🧠 Conclusiones Psicológicas Consolidadas
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {profile?.contexto_terapeutico?.conclusiones && profile.contexto_terapeutico.conclusiones.length > 0 ? (
                          profile.contexto_terapeutico.conclusiones.map((item, idx) => {
                            const isChecked = !!checkedItems[`conclusiones-${idx}`];
                            return (
                              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.72rem', lineHeight: 1.4 }}>
                                <span 
                                  onClick={() => toggleCheckItem('conclusiones', idx)}
                                  style={{
                                    width: '15px',
                                    height: '15px',
                                    borderRadius: '50%',
                                    border: isChecked ? '1px solid var(--color-emerald)' : '1px solid var(--border)',
                                    background: isChecked ? 'var(--color-emerald)' : 'transparent',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '9px',
                                    color: '#fff',
                                    transition: 'all 0.2s ease',
                                    flexShrink: 0,
                                    boxShadow: isChecked ? '0 0 5px rgba(16, 185, 129, 0.4)' : 'none',
                                    marginTop: '1px'
                                  }}
                                >
                                  {isChecked && '✓'}
                                </span>
                                <span style={{ 
                                  textDecoration: isChecked ? 'line-through' : 'none', 
                                  opacity: isChecked ? 0.6 : 1,
                                  color: '#ffffff',
                                  transition: 'all 0.2s ease'
                                }}>
                                  {item}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.72rem' }}>Sin conclusiones registradas. Se consolidarán al archivar sesiones.</span>
                        )}
                      </div>
                    </div>

                    {/* Compromisos */}
                    <div style={{ background: 'rgba(255,255,255,0.012)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                      <h5 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-emerald)', margin: '0 0 12px 0', borderBottom: '1px solid rgba(16,185,129,0.15)', paddingBottom: '6px' }}>
                        ⚖️ Compromisos de Operativa Consolidados
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {profile?.contexto_terapeutico?.compromisos && profile.contexto_terapeutico.compromisos.length > 0 ? (
                          profile.contexto_terapeutico.compromisos.map((item, idx) => {
                            const isChecked = !!checkedItems[`compromisos-${idx}`];
                            return (
                              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.72rem', lineHeight: 1.4 }}>
                                <span 
                                  onClick={() => toggleCheckItem('compromisos', idx)}
                                  style={{
                                    width: '15px',
                                    height: '15px',
                                    borderRadius: '50%',
                                    border: isChecked ? '1px solid var(--color-emerald)' : '1px solid var(--border)',
                                    background: isChecked ? 'var(--color-emerald)' : 'transparent',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '9px',
                                    color: '#fff',
                                    transition: 'all 0.2s ease',
                                    flexShrink: 0,
                                    boxShadow: isChecked ? '0 0 5px rgba(16, 185, 129, 0.4)' : 'none',
                                    marginTop: '1px'
                                  }}
                                >
                                  {isChecked && '✓'}
                                </span>
                                <span style={{ 
                                  textDecoration: isChecked ? 'line-through' : 'none', 
                                  opacity: isChecked ? 0.6 : 1,
                                  color: '#ffffff',
                                  transition: 'all 0.2s ease'
                                }}>
                                  {item}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.72rem' }}>Sin compromisos activos de gestión de riesgo.</span>
                        )}
                      </div>
                    </div>

                    {/* Pautas de Accion */}
                    <div style={{ background: 'rgba(255,255,255,0.012)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                      <h5 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-rose)', margin: '0 0 12px 0', borderBottom: '1px solid rgba(244,63,94,0.15)', paddingBottom: '6px' }}>
                        📋 Pautas de Acción Consolidadas
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {profile?.contexto_terapeutico?.pautas_accion && profile.contexto_terapeutico.pautas_accion.length > 0 ? (
                          profile.contexto_terapeutico.pautas_accion.map((item, idx) => {
                            const isChecked = !!checkedItems[`pautas-${idx}`];
                            return (
                              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.72rem', lineHeight: 1.4 }}>
                                <span 
                                  onClick={() => toggleCheckItem('pautas', idx)}
                                  style={{
                                    width: '15px',
                                    height: '15px',
                                    borderRadius: '50%',
                                    border: isChecked ? '1px solid var(--color-emerald)' : '1px solid var(--border)',
                                    background: isChecked ? 'var(--color-emerald)' : 'transparent',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontSize: '9px',
                                    color: '#fff',
                                    transition: 'all 0.2s ease',
                                    flexShrink: 0,
                                    boxShadow: isChecked ? '0 0 5px rgba(16, 185, 129, 0.4)' : 'none',
                                    marginTop: '1px'
                                  }}
                                >
                                  {isChecked && '✓'}
                                </span>
                                <span style={{ 
                                  textDecoration: isChecked ? 'line-through' : 'none', 
                                  opacity: isChecked ? 0.6 : 1,
                                  color: '#ffffff',
                                  transition: 'all 0.2s ease'
                                }}>
                                  {item}
                                </span>
                              </div>
                            );
                          })
                        ) : (
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.72rem' }}>Sin pautas o ejercicios prescritos aún.</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* --- REFERENCIAS CLÍNICAS Y LITERATURA DE APOYO --- */}
                  {profile?.contexto_terapeutico?.fuentes_ayuda && profile.contexto_terapeutico.fuentes_ayuda.length > 0 && (
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen size={16} color="var(--color-cyan)" />
                        Literatura de Apoyo & Referencias Clínicas Contrastadas
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                        {profile.contexto_terapeutico.fuentes_ayuda.map((fuente, idx) => {
                          const matches = fuente.match(/^([^-]+)-(.*?)\((.*?)\)$/) || fuente.match(/^([^-]+)-(.*)$/);
                          let autor = '';
                          let libro = fuente;
                          let justificase = '';
                          if (matches) {
                            autor = matches[1].trim();
                            if (matches.length > 3) {
                              libro = matches[2].trim();
                              justificase = matches[3].trim();
                            } else {
                              libro = matches[2].trim();
                            }
                          }
                          return (
                            <div
                              key={idx}
                              style={{
                                padding: '12px 14px',
                                background: 'rgba(6, 182, 212, 0.015)',
                                border: '1px solid rgba(6, 182, 212, 0.12)',
                                borderRadius: '8px',
                                display: 'flex',
                                gap: '10px',
                                alignItems: 'flex-start'
                              }}
                              className="conv-item-hover"
                            >
                              <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '6px', borderRadius: '6px', color: 'var(--color-cyan)', display: 'flex', flexShrink: 0 }}>
                                <BookOpen size={14} />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {autor ? (
                                  <>
                                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ffffff' }}>{libro}</span>
                                    <span style={{ fontSize: '0.66rem', color: 'var(--color-cyan)', fontWeight: 600 }}>{autor}</span>
                                  </>
                                ) : (
                                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ffffff' }}>{fuente}</span>
                                )}
                                {justificase && (
                                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '4px', lineHeight: 1.3 }}>
                                    {justificase}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}
          </div>

          {/* Archived Sessions Grid */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="var(--color-cyan)" />
              Historial Clínico Consolidad: Hechos Extraídos ({completedConversations.length})
            </h3>

            {completedConversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
                <Calendar size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p style={{ fontSize: '0.8rem', margin: 0 }}>No hay sesiones de chat archivadas.</p>
                <p style={{ fontSize: '0.7rem', marginTop: '4px' }}>Finaliza una sesión activa en el Chat con Ánquer para registrar conclusiones detalladas.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {completedConversations.map((session) => {
                  const closedDate = session.closed_at ? new Date(session.closed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
                  return (
                    <div
                      key={session.id}
                      className="glass-panel"
                      style={{
                        padding: '18px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.01), rgba(15,23,42,0.4))',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                        transition: 'all 0.2s ease'
                      }}
                      className="conv-item-hover"
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span className="badge badge-cyan" style={{ fontSize: '0.6rem', padding: '2px 8px' }}>Sesión Archivada</span>
                            <span className={`badge ${session.context_sync_status === 'error' ? 'badge-rose' : (session.context_sync_status === 'analyzed' ? 'badge-emerald' : 'badge-cyan')}`} style={{ fontSize: '0.6rem', padding: '2px 8px' }}>
                              {session.context_sync_status === 'error' ? 'Error Mente' : (session.context_sync_status === 'analyzed' ? 'En Mente' : 'Pendiente Mente')}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{closedDate}</span>
                        </div>

                        <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
                          {session.title || 'Nueva Sesión con Ánquer'}
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.74rem' }}>
                          <p style={{ margin: 0, color: '#ffffff', lineHeight: 1.4 }}>
                            <strong>Hecho Clínico:</strong> <span style={{ textDecoration: 'underline', decorationColor: 'var(--color-cyan)' }}>{session.captured_fact || 'No registrado'}</span>
                          </p>

                          <div>
                            <strong style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '2px' }}>Conclusiones:</strong>
                            <ul style={{ margin: 0, paddingLeft: '14px', color: 'var(--text-secondary)' }}>
                              {(() => {
                                if (!session.conclusions) return <li>-</li>;
                                try {
                                  const list = typeof session.conclusions === 'string' ? JSON.parse(session.conclusions) : session.conclusions;
                                  return Array.isArray(list) ? list.slice(0, 2).map((c, i) => <li key={i}>{c}</li>) : <li>{String(session.conclusions)}</li>;
                                } catch {
                                  return <li>{String(session.conclusions)}</li>;
                                }
                              })()}
                            </ul>
                          </div>

                          <div>
                            <strong style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-emerald)', marginBottom: '2px' }}>Pautas / Ejercicios:</strong>
                            <ul style={{ margin: 0, paddingLeft: '14px', color: 'var(--color-emerald)', fontWeight: 500 }}>
                              {(() => {
                                if (!session.solutions_exercises) return <li>-</li>;
                                try {
                                  const list = typeof session.solutions_exercises === 'string' ? JSON.parse(session.solutions_exercises) : session.solutions_exercises;
                                  return Array.isArray(list) ? list.slice(0, 2).map((s, i) => <li key={i}>{s}</li>) : <li>{String(session.solutions_exercises)}</li>;
                                } catch {
                                  return <li>{String(session.solutions_exercises)}</li>;
                                }
                              })()}
                            </ul>
                          </div>

                          {session.clinical_studies && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.68rem', color: 'var(--text-tertiary)', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
                              Estudio: {session.clinical_studies}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedSession(session);
                          loadSessionMessages(session.id);
                        }}
                        className="btn btn-outline flex-center"
                        style={{ width: '100%', gap: '8px', height: '32px', fontSize: '0.74rem', fontWeight: 600, borderColor: 'var(--color-cyan)', color: 'var(--color-cyan)' }}
                      >
                        <BookOpenCheck size={14} />
                        <span>Ver Conversación Completa</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Historial de Sensaciones Diarias Cronológicas */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Activity size={20} color="var(--color-amber)" />
                Historial Terapéutico de Sensaciones Diarias ({history.length})
              </h3>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: 0 }}>
                Registro diario de cortisol, impulsividad y triggers emocionales.
              </p>
            </div>

            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
                <Activity size={36} style={{ margin: '0 auto 10px', opacity: 0.5, color: 'var(--color-amber)' }} />
                <p style={{ fontSize: '0.8rem', margin: 0 }}>No hay sensaciones registradas en el diario.</p>
                <p style={{ fontSize: '0.7rem', marginTop: '4px' }}>Regístralas en la pestaña "1. Diario de Sensaciones" para empezar a trazar tu evolución diaria.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {history.map((mood) => {
                  const dateStr = new Date(mood.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
                  const isAnalyzed = mood.is_analyzed === true;
                  
                  return (
                    <div
                      key={mood.id}
                      className="glass-panel"
                      style={{
                        padding: '18px',
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.005) 0%, rgba(15,23,42,0.3) 100%)',
                        border: `1px solid ${isAnalyzed ? 'var(--border)' : 'rgba(245, 158, 11, 0.25)'}`,
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                      className="conv-item-hover"
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span className="badge badge-cyan" style={{ fontSize: '0.6rem', padding: '2px 8px' }}>Registro Diario</span>
                            <span className={`badge ${isAnalyzed ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.6rem', padding: '2px 8px', fontWeight: 700 }}>
                              {isAnalyzed ? 'Analizado (En Mente)' : 'No Analizado (Pendiente)'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{dateStr}</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.15)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.68rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.55rem', textTransform: 'uppercase', fontWeight: 700 }}>Ansiedad</span>
                            <strong style={{ color: mood.anxiety_level > 7 ? 'var(--color-rose)' : 'var(--color-emerald)', fontSize: '0.85rem', fontWeight: 900 }}>
                              {mood.anxiety_level || 1}/10
                            </strong>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.15)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.68rem' }}>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.55rem', textTransform: 'uppercase', fontWeight: 700 }}>Impulsividad</span>
                            <strong style={{ color: mood.impulsivity_level > 7 ? 'var(--color-rose)' : 'var(--color-emerald)', fontSize: '0.85rem', fontWeight: 900 }}>
                              {mood.impulsivity_level || 1}/10
                            </strong>
                          </div>
                        </div>

                        {mood.notes && (
                          <div style={{ background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px', fontSize: '0.7rem', borderLeft: '3px solid rgba(255,255,255,0.05)', marginTop: '4px' }}>
                            <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>Notas & Disparadores:</span>
                            <p style={{ color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>{mood.notes}</p>
                          </div>
                        )}
                      </div>

                      {!isAnalyzed && (
                        <button
                          onClick={() => startSyncProcess(false, 'all')}
                          className="btn btn-outline flex-center"
                          style={{
                            width: '100%',
                            gap: '6px',
                            height: '30px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            borderColor: 'var(--color-amber)',
                            color: 'var(--color-amber)',
                            background: 'rgba(245, 158, 11, 0.02)',
                            textTransform: 'none',
                            marginTop: '4px'
                          }}
                          title="Analizar esta sensación e integrarla en el diagnóstico de Ánquer"
                        >
                          <Brain size={12} />
                          <span>Analizar con Ánquer</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: PREVISUALIZAR FUENTE (NOTEBOOKLM) */}
      {selectedSource && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(7, 10, 19, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="glass-panel animate-glow-cyan" style={{
            width: '100%',
            maxWidth: '650px',
            background: 'var(--background-secondary)',
            border: '1px solid var(--color-cyan)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '85%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--color-cyan)" />
                <h4 style={{ fontSize: '1rem', margin: 0 }}>{selectedSource.name}</h4>
              </div>
              <button
                onClick={() => setSelectedSource(null)}
                style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.2)',
              padding: '16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              color: 'var(--text-primary)',
              maxHeight: '360px'
            }}>
              {selectedSource.extracted_text || selectedSource.text_content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedSource(null)}
                className="btn btn-cyan"
                style={{ height: '36px', fontSize: '0.78rem', padding: '0 18px' }}
              >
                Cerrar Previsualización
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER TRANSCRIPCIÓN DE SESIÓN ARCHIVADA */}
      {selectedSession && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(7, 10, 19, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="glass-panel animate-glow-cyan" style={{
            width: '100%',
            maxWidth: '750px',
            background: 'var(--background-secondary)',
            border: '1px solid var(--color-cyan)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: '85%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '1rem', margin: 0, color: '#ffffff' }}>
                  Transcripción: {selectedSession.title || 'Sesión con Ánquer'}
                </h4>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  Sesión archivada el {selectedSession.closed_at ? new Date(selectedSession.closed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedSession(null);
                  setSessionMessages([]);
                }}
                style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Transcript Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.2)',
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {transcriptLoading ? (
                <div className="flex-center" style={{ height: '100%', flexDirection: 'column', gap: '8px' }}>
                  <RefreshCw size={24} color="var(--color-cyan)" className="animate-spin" />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Cargando conversación...</span>
                </div>
              ) : sessionMessages.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>
                  No se encontraron mensajes en esta sesión.
                </p>
              ) : (
                sessionMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      background: msg.role === 'user' ? 'rgba(255,255,255,0.03)' : 'hsla(var(--cyan), 0.05)',
                      border: '1px solid ' + (msg.role === 'user' ? 'var(--border)' : 'hsla(var(--cyan), 0.25)'),
                      padding: '12px 16px',
                      borderRadius: '12px',
                      borderBottomRightRadius: msg.role === 'user' ? '2px' : '12px',
                      borderBottomLeftRadius: msg.role === 'assistant' ? '2px' : '12px',
                      maxWidth: '85%',
                      fontSize: '0.78rem',
                      lineHeight: 1.5
                    }}
                  >
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      color: msg.role === 'user' ? '#ffffff' : 'var(--color-cyan)',
                      display: 'block',
                      textTransform: 'uppercase',
                      marginBottom: '4px'
                    }}>
                      {msg.role === 'user' ? 'Usuario' : 'Ánquer'}
                    </span>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Fact cards summary */}
            <div style={{
              background: 'rgba(255,255,255,0.01)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              fontSize: '0.74rem'
            }}>
              <span style={{ fontWeight: 700, color: 'var(--color-cyan)', display: 'block', marginBottom: '2px' }}>
                Hecho Clínico Consolidad:
              </span>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "{selectedSession.captured_fact || 'No registrado'}"
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setSelectedSession(null);
                  setSessionMessages([]);
                }}
                className="btn btn-cyan"
                style={{ height: '36px', fontSize: '0.78rem', padding: '0 18px', fontWeight: 600 }}
              >
                Cerrar Transcripción
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE OPCIONES DE SINCRONIZACIÓN */}
      {showSyncModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(8, 13, 28, 0.75)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '620px',
            padding: '30px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            background: 'linear-gradient(135deg, rgba(8, 13, 28, 0.95), rgba(15, 23, 42, 0.98))',
            boxShadow: 'var(--shadow-cyan)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <RefreshCw size={20} className="animate-pulse-soft" color="var(--color-cyan)" />
                Sincronizar Análisis de Ánquer
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
                Selecciona el método de consolidación para actualizar tu perfil clínico en Mente.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Tarjeta Incremental */}
              <div
                onClick={() => startSyncProcess(false, 'all')}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(6, 182, 212, 0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = '1px solid var(--color-cyan)';
                  e.currentTarget.style.background = 'rgba(6, 182, 212, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(6, 182, 212, 0.15)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(6, 182, 212, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-cyan)',
                  flexShrink: 0
                }}>
                  <RefreshCw size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Sincronización Incremental
                    <span style={{ fontSize: '0.58rem', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-cyan)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>RECOMENDADO</span>
                  </h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                    Procesa únicamente los nuevos documentos y sesiones de chat terminadas desde la última sincronización. Rápido y eficiente.
                  </p>
                </div>
              </div>

              {/* Tarjeta Completa */}
              <div
                onClick={() => startSyncProcess(true, 'all')}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(167, 139, 250, 0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = '1px solid #a78bfa';
                  e.currentTarget.style.background = 'rgba(167, 139, 250, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(167, 139, 250, 0.15)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(167, 139, 250, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#a78bfa',
                  flexShrink: 0
                }}>
                  <Clock size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Sincronización Completa</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                    Reanaliza y reconstruye tu diagnóstico completo desde el principio. Procesa de nuevo todo tu historial de chats y documentos. Más lento.
                  </p>
                </div>
              </div>

              {/* Tarjeta Solo Documentos */}
              <div
                onClick={() => startSyncProcess(false, 'sources')}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = '1px solid var(--color-emerald)';
                  e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = '1px solid rgba(16, 185, 129, 0.15)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-emerald)',
                  flexShrink: 0
                }}>
                  <FileText size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Solo Documentos (NotebookLM)</h4>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                    Analiza y consolida únicamente las notas, PDF e imágenes cargadas, ignorando las conversaciones terapéuticas del chat.
                  </p>
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button
                onClick={() => setShowSyncModal(false)}
                className="btn btn-outline"
                style={{ height: '36px', fontSize: '0.78rem', padding: '0 20px', fontWeight: 700 }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE DE FICHA AMPLIADA (WALTER RESEARCH) */}
      {selectedResourceDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(8, 13, 28, 0.8)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200
        }}
        onClick={() => setSelectedResourceDetail(null)}
        >
          <div className="glass-panel animate-glow-cyan" style={{
            width: '90%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '30px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            background: 'linear-gradient(135deg, rgba(8, 13, 28, 0.98), rgba(15, 23, 42, 0.99))',
            boxShadow: 'var(--shadow-cyan)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '4px' }}>
                  {selectedResourceDetail.autor || 'Autor Desconocido'}
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0, lineHeight: '1.3' }}>
                  {selectedResourceDetail.titulo}
                </h3>
                <span className="badge badge-cyan" style={{ fontSize: '0.6rem', marginTop: '6px', display: 'inline-block' }}>
                  {selectedResourceDetail.sintoma}
                </span>
              </div>
              <button 
                onClick={() => setSelectedResourceDetail(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                className="conv-item-hover"
              >
                <X size={20} />
              </button>
            </div>

            {/* Pestañas (Tabs) */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '10px', flexWrap: 'wrap' }}>
              {[
                { id: 'resumen', label: '📖 Resumen y Ficha' },
                { id: 'adaptacion', label: '🎯 Adaptación a Emilio' },
                { id: 'ejercicio', label: '⚡ Ejercicio Práctico' },
                { id: 'original', label: '🔗 Fuente Original' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setModalDetailTab(tab.id)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: '1px solid ' + (modalDetailTab === tab.id ? 'var(--color-cyan)' : 'transparent'),
                    background: modalDetailTab === tab.id ? 'rgba(6,182,212,0.12)' : 'transparent',
                    color: modalDetailTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="conv-item-hover"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contenido según Pestaña */}
            <div style={{ flex: 1, minHeight: '200px', display: 'flex', flexDirection: 'column', gap: '14px', lineHeight: 1.5, fontSize: '0.8rem' }}>
              {modalDetailTab === 'resumen' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ margin: 0, color: 'var(--color-cyan)', fontSize: '0.85rem', fontWeight: 800 }}>Investigación Clínica y Fundamentos Científicos</h4>
                  <p style={{ color: '#ffffff', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.78rem' }}>
                    {selectedResourceDetail.resumen_ampliado || 'Cargando resumen detallado del recurso...'}
                  </p>
                  {selectedResourceDetail.justificacion && (
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '8px' }}>
                      <strong style={{ color: 'var(--color-cyan)', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>¿Por qué es una fuente de importancia clínica comprobada?</strong>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>{selectedResourceDetail.justificacion}</span>
                    </div>
                  )}
                </div>
              )}

              {modalDetailTab === 'adaptacion' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ margin: 0, color: 'var(--color-rose)', fontSize: '0.85rem', fontWeight: 800 }}>¿Por qué y cómo se aplica al caso de Emilio?</h4>
                  <p style={{ color: '#ffffff', margin: 0, whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.78rem' }}>
                    {selectedResourceDetail.adaptacion || 'Este recurso ayuda a Emilio a comprender cómo sus síntomas específicos (como el TDAH, agorafobia o las respuestas al trauma) interactúan con sus finanzas y su operativa diaria.'}
                  </p>
                  <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(244,63,94,0.03)', border: '1px solid rgba(244,63,94,0.15)', marginTop: '8px' }}>
                    <span style={{ color: 'var(--color-rose)', fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Relevancia en la Terapia de Emilio</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>
                      Las ganancias no consolidadas en el trading y la sobreoperación por impulsividad se abordan de raíz mediante esta perspectiva clínica, ofreciendo una férula conductual que actúa como cortafuegos biológico.
                    </span>
                  </div>
                </div>
              )}

              {modalDetailTab === 'ejercicio' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h4 style={{ margin: 0, color: 'var(--color-emerald)', fontSize: '0.85rem', fontWeight: 800 }}>Pautas y Ejercicios Recomendados</h4>
                  <p style={{ color: '#ffffff', margin: 0 }}>
                    Realizar de forma sistemática y consciente la siguiente práctica terapéutica para reprogramar el comportamiento:
                  </p>
                  <div style={{
                    padding: '16px',
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    marginTop: '8px',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6'
                  }}>
                    {selectedResourceDetail.practica || 'No hay un ejercicio específico prescrito para esta fuente.'}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontStyle: 'italic', marginTop: '4px' }}>
                    * Recuerda registrar tu nivel de ansiedad e impulsividad en el diario al realizar o tras finalizar tus prácticas.
                  </span>
                </div>
              )}

              {modalDetailTab === 'original' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center', justifyContent: 'center', padding: '30px 10px', textAlign: 'center' }}>
                  <BookOpen size={48} color="var(--color-cyan)" style={{ marginBottom: '10px' }} />
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', color: '#ffffff', fontSize: '0.9rem', fontWeight: 800 }}>Enlace Científico y Documentación Original</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', maxWidth: '380px', margin: 0 }}>
                      Accede a la publicación original, estudio científico de PubMed, base de datos de Google Scholar, o contenido del autor original.
                    </p>
                  </div>
                  {selectedResourceDetail.fuente_original_url ? (
                    <a
                      href={selectedResourceDetail.fuente_original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-cyan"
                      style={{
                        padding: '10px 24px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '10px'
                      }}
                    >
                      <Search size={14} />
                      Abrir Fuente Original
                    </a>
                  ) : (
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(selectedResourceDetail.autor + " " + selectedResourceDetail.titulo)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-cyan"
                      style={{
                        padding: '10px 24px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginTop: '10px'
                      }}
                    >
                      <Search size={14} />
                      Buscar en PubMed
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Pie del Modal */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px', gap: '10px' }}>
              <button
                onClick={() => setSelectedResourceDetail(null)}
                className="btn btn-outline"
                style={{ height: '36px', fontSize: '0.78rem', padding: '0 20px', fontWeight: 700 }}
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PROGRESO DE SINCRONIZACIÓN */}
      {syncStatus.active && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(8, 13, 28, 0.8)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1200
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '480px',
            padding: '30px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(6, 182, 212, 0.4)',
            background: 'linear-gradient(135deg, rgba(8, 13, 28, 0.96), rgba(15, 23, 42, 0.99))',
            boxShadow: 'var(--shadow-cyan)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshCw size={32} className="animate-spin" color="var(--color-cyan)" style={{ animationDuration: '3s' }} />
                <Brain size={16} color="#ffffff" style={{ position: 'absolute', animation: 'pulse-soft 2s infinite alternate' }} />
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: '4px 0 0 0' }}>
                Consolidando Mente
              </h3>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: 0 }}>
                Revisando documentos y sesiones pendientes para actualizar el mapa estable...
              </p>
            </div>

            {/* Barra y porcentaje */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                <span style={{ color: 'var(--color-cyan)', fontWeight: 700 }}>Progreso real</span>
                <span style={{ color: '#ffffff', fontWeight: 800 }}>{syncStatus.percentage}%</span>
              </div>
              <div style={{
                width: '100%',
                height: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '3px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.02)'
              }}>
                <div style={{
                  width: `${syncStatus.percentage}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, var(--color-cyan), var(--color-emerald))',
                  borderRadius: '3px',
                  boxShadow: '0 0 10px var(--color-cyan)',
                  transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
            </div>

            {/* Actividad */}
            <div style={{
              background: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              borderRadius: 'var(--radius-sm)',
              padding: '8px 12px',
              fontSize: '0.68rem',
              color: 'var(--color-cyan)',
              fontStyle: 'italic',
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {syncStatus.currentActivity}
            </div>

            {/* Historial de elementos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800 }}>
                Elementos revisados ({syncStatus.totalProcessed}{syncStatus.totalErrors > 0 ? ` OK, ${syncStatus.totalErrors} error` : ''}{syncStatus.totalCount ? ` / ${syncStatus.totalCount}` : ''})
              </span>
              <div style={{
                maxHeight: '120px',
                minHeight: '70px',
                overflowY: 'auto',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}>
                {[...syncStatus.processedItems, ...syncStatus.errorItems].length === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    Preparando lote...
                  </div>
                ) : (
                  [...syncStatus.processedItems, ...syncStatus.errorItems].map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.65rem',
                      padding: '3px 6px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.02)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden' }}>
                        <span style={{ flexShrink: 0 }}>
                          {item.type === 'source' ? '📄' : '💬'}
                        </span>
                        <span style={{
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {item.name}
                        </span>
                      </div>
                      <span
                        title={item.error || ''}
                        style={{ color: item.status === 'error' ? 'var(--color-rose)' : 'var(--color-emerald)', fontWeight: 800, flexShrink: 0 }}
                      >
                        {item.status === 'error' ? 'ERROR' : 'OK'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Botón de Cancelación o Cierre */}
            {syncStatus.percentage < 100 && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  cancelSyncRef.current = true;
                  setCancelSyncRequested(true);
                  setSyncStatus(prev => ({ ...prev, currentActivity: 'Cancelando proceso...' }));
                }}
                disabled={cancelSyncRequested}
                style={{
                  width: '100%',
                  height: '36px',
                  fontSize: '0.75rem',
                  borderColor: 'rgba(239, 68, 68, 0.4)',
                  color: 'rgba(254, 226, 226, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {cancelSyncRequested ? 'Cancelando...' : 'Cancelar Sincronización'}
              </button>
            )}
            {syncStatus.percentage === 100 && (
              <button
                type="button"
                className="btn btn-cyan"
                onClick={() => {
                  setSyncStatus(prev => ({ ...prev, active: false }));
                }}
                style={{
                  width: '100%',
                  height: '36px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Cerrar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
