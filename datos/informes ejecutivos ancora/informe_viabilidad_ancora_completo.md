## Ancora

# Auditoría Integral de Viabilidad del Proyecto

Análisis consolidado elaborado de forma paralela por 10 agentes virtuales especializados para auditar la viabilidad legal, financiera, técnica, regulatoria y deontológica de una plataforma híbrida de seguimiento de telepsicología basada en modelos locales de IA supervisados por terapeutas freelance en España.

## Conclusiones y Dictamen de los Agentes

Tras el deep research coordinado y el debate de los agentes de auditoría, se emite un dictamen de viabilidad condicionado a un pivote estratégico . El modelo original de "Uberización abierta" con fijación unilateral de tarifas es inviable en España debido a la Sentencia 805/2020 del Tribunal Supremo (riesgo de "falsos autónomos") y el veto del Real Decreto 1907/1996 a testimonios de curación de pacientes sanitarios.

Para sortear estas restricciones de forma óptima, la plataforma adopta una **Fase de Onboarding y Diagnóstico de 99,00 € (promocionado a 49,00 € con cupón)** (split en origen: 25€ al psicólogo por 1h de consulta y 24€ de software a la plataforma en promoción) y una estructura de **planes de suscripción individuales (Esencial 69€, Intermedio 99€, Intensivo 159€/mes) y grupales (Duo 240€, Familiar 380€/mes)** con división de flujos monetarios en origen mediante **Stripe Connect Split Payments**: el psicólogo factura directamente al paciente la parte clínica exenta de IVA (Artículo 20.Uno.3º Ley IVA) y la plataforma factura el servicio informático de software con el 21% de IVA, eliminando la laboralidad y blindando la exención fiscal del profesional.

Para evitar que los psicólogos intenten la fuga de clientes fuera de la app (desintermediación), la plataforma implementa **4 pilares de retención clínica e de incentivo económico**:

- Smart SOAP: Transcripción y redacción automatizada por IA local de informes médicos y notas SOAP, ahorrando un 40% de tiempo administrativo al psicólogo. Si este se va de la app, pierde esta valiosa herramienta de productividad.

- Sincronización del Diario IA: El paciente pierde el chat de acompañamiento diario y su diario emocional si cancela la suscripción en la plataforma.

- Incentivo Económico Asíncrono (Alta Rentabilidad): Al cobrar **15€ netos por revisión de 15 minutos** (tasa de **60€/hora**) frente a **40€ por sesión de 45 minutos** (tasa de **53.33€/hora**), los terapeutas ganan más dinero por minuto en modo asíncrono dentro de la plataforma (herramientas imposibles de replicar por fuera), eliminando cualquier incentivo a la fuga.

- Burocracia Cero: La plataforma gestiona la auto-facturación consolidada y el split de IRPF (Modelo 111). Fuera del sistema, el psicólogo debe asumir costes de gestoría para micro-cobros individuales.

#### Navegación Recomendada

Utiliza el menú de navegación de la barra lateral izquierda para explorar los reportes detallados y, en especial, la sección **11. Debate de Uberización** para leer el debate real de los agentes con el flujo de onboarding y los detalles del Split de Stripe Connect.

## 1. Resumen Ejecutivo y Propuesta de Valor

### Tesis de Viabilidad

El modelo propone una arquitectura híbrida "Human-in-the-Loop" (Copiloto Clínico) . Su premisa fundamental es que la Inteligencia Artificial actúa exclusivamente como un optimizador de procesos de seguimiento clínico, diarios emocionales y generación de briefings, mientras que el diagnóstico, la validación y el criterio clínico final corresponden a psicólogos freelance colegiados y habilitados sanitariamente. Este modelo resuelve la ineficiencia económica de la terapia clásica y evita las contingencias legales, éticas e ineficacia médica de los chatbots terapéuticos automáticos.

### Propuesta de Valor Defensible

La diferenciación competitiva frente a marketplaces genéricos se construye sobre tres pilares tecnológicos e institucionales:

- Privacidad Extrema: Inferencia de modelos de lenguaje de código abierto (open-source) en servidores dedicados bajo control directo de la plataforma. Esto garantiza la soberanía de los datos e impide que las conversaciones íntimas del paciente alimenten APIs comerciales extranjeras que no cumplen rigurosamente con el secreto profesional médico o el RGPD europeo.

- Briefings Clínicos Automáticos: Reducción del tiempo de preparación clínica del psicólogo de 20 minutos a un briefing estructurado de 2 minutos. La IA estructurada resume de manera continua el historial del chat diario del usuario y alerta sobre temas pendientes y distorsiones cognitivas detectadas.

- Seguimiento Diario Activo: El usuario dispone de soporte de acompañamiento diario estructurado mediante técnicas cognitivo-conductuales (TCC), en lugar de estar completamente desasistido entre las sesiones síncronas semanales.

#### Límites Críticos de Alcance

Bajo ningún concepto la IA debe realizar diagnósticos clínicos formales ni prometer sustituir el criterio de un psicólogo humano. El sistema debe presentarse comercialmente como un "servicio de seguimiento aumentado por IA supervisado por terapeutas licenciados", no como un chatbot psicólogo.

## 2. Definición del Producto y Módulos UX

### Principios de UX en Salud Mental (Health UX)

El diseño visual y de interacción se rige por un esquema empático, libre de disparadores de ansiedad y con accesibilidad universal (cumplimiento WCAG 2.1 AAA). Se implementa el sistema de diseño visual "Mente Sana UI" , caracterizado por una paleta cromática pastel relajante (azules apagados, grises cálidos), tipografía sin serifas espaciada y ausencia de gamificación agresiva que pueda trivializar el estado mental del usuario.

### Estructura Funcional de Módulos

#### A. Onboarding y Triaje Inicial con IA

Flujo conversacional empático guiado por la IA. Integra de forma camuflada y contextual los reactivos de las escalas diagnósticas estandarizadas **PHQ-9** (Cribado de Depresión) y **GAD-7** (Cribado de Ansiedad). La IA clasifica al usuario en niveles de riesgo (Leve, Moderado, Grave) y define si el paciente es apto para el seguimiento asíncrono o requiere derivación obligatoria síncrona.

#### Simulador de Triaje Clínico PHQ-9 (Interactiva)

Completa el cuestionario clínico para comprobar la clasificación de riesgo y ver cómo responde la plataforma en caso de crisis:

#### B. Chat de Seguimiento y Diario Emocional

Interfaz conversacional que asiste en el registro de emociones a través de un diario interactivo. La IA está programada para actuar bajo los principios de la terapia cognitiva (identificación y reestructuración de pensamientos distorsionados) sin ejercer psicoterapia autónoma. Los límites del bot son visibles en todo momento mediante una etiqueta interactiva.

#### C. Panel del Terapeuta (Clinical Dashboard) e Informe de 15 Minutos sin Sesgo

Para optimizar el tiempo del psicólogo a **15 minutos semanales por paciente** sin condicionar su criterio clínico (previniendo el sesgo de automatización y el anclaje diagnóstico), el panel de control se estructura en un **Dashboard Configurable de 3 Niveles** con flujo de trabajo **"Raw-First"** (Datos Crudos Primero):

#### 1. Nivel de Datos Crudos (Sin Sesgo IA)

Muestra registros objetivos del paciente: check-ins emocionales semanales, logs de wearables (horas de sueño, HRV, pasos) y **extractos literales (verbatim)** de conversaciones del chat que contienen indicadores de preocupación clínica. Estos datos se exponen de forma neutra, sin adjetivos ni interpretaciones semánticas del LLM.

#### 2. Capa Interpretativa y Toggles de Enfoque Teórico

El psicólogo puede activar o desactivar mediante toggles análisis interpretativos de la IA. La IA clasifica los datos según el marco elegido por el profesional:
 • Enfoque TCC: Identifica pensamientos automáticos y distorsiones cognitivas (catastrofismo, polarización).
 • Enfoque ACT: Resalta patrones de evitación experiencial e inflexibilidad psicológica.

#### Flujo "Raw-First" con Bloqueo Glassmorphic e Indicador de Disonancia

Evitación del Sesgo: La capa interpretativa de la IA (Nivel 2) se muestra inicialmente **difuminada y bloqueada** mediante un filtro CSS glassmorphism . El terapeuta debe revisar activamente los Datos Crudos (Nivel 1) y la **Vista de Discrepancia/Disonancia** (Nivel 3: contraste automático entre lo que el paciente declara conscientemente y sus marcadores de ansiedad u horas de insomnio reales) antes de que el botón *"Revelar Análisis de IA"* se desbloquee, evitando el efecto anclaje.

#### UX de Devolución Rápida y Video-Briefing

El psicólogo no firma PDFs ni redacta informes de texto extensos. Su devolución clínica se realiza en 15 minutos: revisa el panel (5 min), y graba un **Video-Briefing de 5-10 minutos** directamente desde la app. La interfaz le asiste con un **teleprompter inteligente** que superpone los hitos y citas del paciente seleccionados del panel para que el profesional los comente en vivo. Al finalizar, hace clic en *"Validar y Enviar"* (firma ágil con PIN de 4 dígitos), remitiendo el vídeo y el borrador de evolución estructurado al portal del paciente de inmediato.

## 3. Análisis de Competencia e Inteligencia de Mercado Ampliado

El mercado de la telepsicología en España y en el ámbito hispanohablante está en plena fase de consolidación. Sin embargo, las plataformas dominantes adolecen de graves problemas estructurales: precarización de los honorarios del terapeuta, saturación laboral por mensajería continua ("burnout"), ruptura de la alianza terapéutica e infracciones reiteradas de la legislación sanitaria y de privacidad.

Nuestra propuesta aprovecha estas ineficiencias mediante un posicionamiento ético y tecnológico premium . A continuación, se auditan las principales plataformas competidoras en España e internacionales:

### 1. Análisis Detallado de Plataformas en España

#### A. Unobravo (Integrador de Buencoco)

- Cómo funciona: Matching clínico cerrado a través de un cuestionario psicométrico automatizado. Un algoritmo asigna un único terapeuta al paciente de forma privada.

- Tarifas Paciente: 45€/sesión individual (50 min), 55€/sesión de pareja. Primera sesión exploratoria gratuita.

- Precios Psicólogo: Percibe entre 28€ y 32€ brutos/sesión (comisión de la plataforma del ~29% al 37%).

- Debilidades: Nulo soporte de seguimiento activo entre sesiones. El paciente queda desasistido en el día a día.

- Qué mejorar: Proporcionar un diario diario interactivo asistido por IA local que envíe resúmenes automatizados y alertas tempranas al panel clínico del psicólogo.

#### B. Therapyside

- Cómo funciona: Matching privado mediante triaje inicial y chat asíncrono diario complementario al tratamiento por videollamada.

- Tarifas Paciente: Planes de suscripción mensual desde 43€ a 49€ por sesión individual.

- Precios Psicólogo: Percibe entre 25€ y 29€ por sesión síncrona (comisión de la plataforma del ~35% al 48%).

- Debilidades: "Efecto Burnout" por chat continuo. El terapeuta debe contestar mensajes constantemente sin remuneración justa de ese tiempo.

- Qué mejorar: Derivar el chat diario y el soporte de contención a la IA local; el terapeuta solo realiza revisiones clínicas semanales acotadas y estructuradas de 15 min.

#### C. Ifeel

- Cómo funciona: Híbrido enfocado al canal B2B (bienestar corporativo para empleados). Matching semi-manual clínico.

- Tarifas Paciente: Suscripción de 25€ a 30€ semanales para chat asíncrono o planes combinados más caros.

- Precios Psicólogo: Pagos precarios de 12€-18€/hora por chat y 22€-25€ por videollamada asignada.

- Debilidades: Sobresaturación del terapeuta con 40-60 casos simultáneos, bajando drásticamente la calidad clínica.

- Qué mejorar: Foco exclusivo en psicoterapia síncrona completa de alta calidad apoyada en automatizaciones SaaS de baja intermediación.

#### D. Doctoralia (Marketplace Abierto)

- Cómo funciona: Directorio abierto y buscador con perfiles públicos, fotos, currículum y opiniones públicas con estrellas.

- Tarifas Paciente: Libre (fijada por el psicólogo, típicamente de 50€ a 120€/sesión).

- Precios Psicólogo: Sin comisión por cita. Cobran suscripción mensual fija de 120€ a 240€/mes por visibilidad y agenda.

- Debilidades: Testimonios clínicos públicos que violan el RD 1907/1996 de Publicidad Sanitaria y multas graves de la AEPD a profesionales por responder reseñas exponiendo datos asistenciales.

- Qué mejorar: Deshabilitar el teclado libre en las respuestas del psicólogo (usando plantillas neutras) e integrar DLP clínico NLP/NER local para censurar datos de salud del paciente.

#### E. Mundopsicólogos

- Cómo funciona: Directorio masivo por provincias que opera mediante subasta masiva de leads (prospectos) de pacientes.

- Tarifas Paciente: Libre (fijada por el psicólogo autónomo, rango de 40€ a 80€).

- Precios Psicólogo: Suscripción fija de 60€ a 180€/mes basada en cantidad de leads y visualizaciones.

- Debilidades: Subasta a la baja de precios (un lead se envía a 3-5 psicólogos simultáneos) y leads con baja conversión.

- Qué mejorar: Eliminar la subasta destructiva de contactos. Matching clínico directo por afinidad y SaaS de 49€/mes transparente.

#### F. Psonríe (Asistencia Inmediata)

- Cómo funciona: Asistencia inmediata bajo demanda ("Uber de terapia"). El paciente pulsa un botón y habla al instante con el terapeuta de guardia.

- Tarifas Paciente: 22€ por sesión corta de 20 min y 39€ por sesión de 50 min.

- Precios Psicólogo: 0,35€ - 0,45€ por minuto de conexión (unos 18€-22€ por sesión de 50 min).

- Debilidades: Ruptura de la alianza y seguimiento clínico al rotar constantemente los terapeutas según el turno libre.

- Qué mejorar: Foco prioritario en la terapia programada estable y de largo recorrido con el mismo profesional sanitario asignado.

#### G. Somos Estupendas

- Cómo funciona: Clínica digitalizada con perspectiva de género. El triaje y matching se realizan manualmente de forma humana.

- Tarifas Paciente: 42€ por sesión individual de 50 minutos.

- Precios Psicólogo: Reparto de tarifa de ~60% terapeuta / 40% plataforma (tarifas de 22€ a 25€ netas por sesión).

- Debilidades: Nula escalabilidad por la alta dependencia de coordinadores humanos para cribado y matching manual.

- Qué mejorar: Implementar un motor de triaje y matching automatizado asistido por LLM local supervisado clínicamente.

### 2. Análisis Detallado de Plataformas Globales

#### A. BetterHelp (EE.UU. / Internacional)

- Cómo funciona: Gigante de la telepsicología masiva. Asignación algorítmica por cuestionario. Suscripción mensual con chat diario.

- Tarifas Paciente: $280 a $400 al mes (suscripción semanal facturada mensualmente).

- Precios Psicólogo: Cobro de $30 a $70 por hora de servicio efectivo basado en engagement de chat y videollamadas.

- Debilidades: Multa histórica de 7.8M$ de la FTC por transferir ilegalmente datos clínicos e emails de pacientes a Facebook y Snapchat para marketing. Fatiga extrema del psicólogo ante chat masivo sin límites.

- Qué mejorar: Cifrado de base de datos Zero-Knowledge derivado en el cliente (Argon2id) y exclusión total de logs de LLM o rastreadores publicitarios.

#### B. Talkspace (EE.UU. / Corporativo)

- Cómo funciona: Enfoque corporativo integrado con seguros de salud. Suite de IA avanzada compatible con HIPAA.

- Tarifas Paciente: $69 a $129 a la semana (suscripción mensual).

- Precios Psicólogo: $20 a $70+ por hora según geografía y volumen de mensajes.

- Debilidades: Sesiones síncronas reducidas a 30 minutos impuestas por la rentabilidad de las aseguradoras médicas.

- Qué mejorar: Mantener las sesiones clínicas completas en 50 minutos e implementar herramientas IA (Smart SOAP/Smart Insights) respetando el tiempo terapéutico de calidad.

#### C. Cerebral / PlushCare (EE.UU.)

- Cómo funciona: Combinación de psiquiatría farmacológica y psicoterapia clínica por suscripción.

- Tarifas Paciente: Suscripción de ~$30/mes + coste de cada visita con el psiquiatra/psicólogo (~$100 - ~$200/sesión).

- Precios Psicólogo: ~$50 a ~$90 por hora de consulta o psiquiatría.

- Debilidades: Escándalos éticos graves y demandas judiciales por inducir y recetar masivamente medicamentos controlados (ej. Adderall para el TDAH) usando incentivos y anuncios agresivos de redes sociales.

- Qué mejorar: Excluir por completo la prescripción médica o psiquiatría farmacológica directa en el marketplace, manteniéndose en psicoterapia basada en evidencia y acompañamiento no farmacológico.

### 3. Tabla Comparativa de Competidores (Ficha Interactiva)

Haz clic en cualquier plataforma de la lista para expandir los detalles sobre su funcionamiento, debilidades y cómo lo superamos. Usa el buscador y filtros para acotar los resultados.

##### Funcionamiento del Servicio

Combina triaje clínico inicial, chat diario asistido por IA local (en servidor Dual RTX 4090 propio) y seguimiento periódico por un terapeuta asignado a través de revisiones de 15m y videollamadas. El psicólogo dispone de una herramienta que autogenera resúmenes en formato SOAP.

##### Debilidades de Competencia que Corrige

Evita precarización laboral: Comisiones al 0% y retribución neta justa (hasta 60€/h). Previene burnout: La IA local realiza la contención diaria y el diario interactivo, reduciendo la carga del psicólogo a revisiones acotadas. Privacidad: Los chats no tocan APIs de terceros ni logs permanentes.

##### Funcionamiento del Servicio

Modelo híbrido con chat guiado por IA 24/7 y Sprout Score (gráfico de evolución basado en registros del diario e informes). Ofrece videollamadas estándar e interacciones rápidas (microsesiones) de 15 minutos.

##### Debilidades de la Plataforma

Limitada notoriedad de marca en España. Viabilidad comercial de la startup muy comprometida a largo plazo con la comisión del 20% sobre precios de 30€ de sesión. Cero privacidad Zero-Knowledge (datos expuestos en nube clásica).

##### Funcionamiento del Servicio

Los pacientes rellenan un cuestionario clínico inicial y el algoritmo propietario les asigna un psicólogo específico. No hay perfiles públicos con estrellas ni libre elección.

##### Debilidades de la Plataforma

Desconexión asistencial: carece de soporte o chat interactivo de seguimiento entre sesiones. Rigidez del matching: si falla el terapeuta asignado, el paciente suele abandonar frustrado el servicio. Tarifas que precarizan al terapeuta senior.

##### Funcionamiento del Servicio

Matching privado y chat asíncrono diario complementario con el terapeuta dentro de la app móvil. El paciente envía mensajes y el psicólogo responde una o dos veces al día.

##### Debilidades de la Plataforma

Burnout profesional: La promesa de chat continuo asíncrono sobrecarga al terapeuta sin retribución justa de ese tiempo. Comisiones abusivas: Incentiva que los terapeutas senior desvíen a los pacientes fuera de la plataforma.

##### Funcionamiento del Servicio

Modelo centrado principalmente en el canal de bienestar corporativo B2B para empleados. Ofrece planes de terapia escrita y videollamadas con asignación semi-manual.

##### Debilidades de la Plataforma

Extrema precarización laboral y descontento del colectivo de psicólogos. Cada profesional maneja hasta 60 casos simultáneos, lo que diluye drásticamente la calidad clínica y genera alta rotación.

##### Funcionamiento del Servicio

Marketplace de salud donde el paciente busca libremente por ubicación o síntomas y lee valoraciones por estrellas y testimonios para concertar cita.

##### Debilidades de la Plataforma

El sistema de estrellas y valoraciones de curación vulnera el RD 1907/1996 de Publicidad Sanitaria. Alto riesgo de multas de la AEPD a profesionales por responder reseñas desvelando datos médicos.

##### Funcionamiento del Servicio

El paciente solicita presupuesto y sus datos son enviados a varios psicólogos para que compitan de forma abierta en su bandeja de entrada privada.

##### Debilidades de la Plataforma

Genera una subasta destructiva de precios clínicos a la baja. Leads inactivos o falsos por los que el profesional paga igual de su cuota mensual, erosionando la rentabilidad del terapeuta.

##### Funcionamiento del Servicio

Conexión en directo en menos de 2 minutos por chat, voz o video con el psicólogo de guardia libre en ese momento en la aplicación.

##### Debilidades de la Plataforma

Ruptura completa de la alianza terapéutica y el seguimiento continuado al rotar de terapeuta en cada llamada. Atracción de perfiles muy junior debido a las bajas tarifas netas.

##### Funcionamiento del Servicio

Clínica digital especializada en psicología con perspectiva de género. El triaje y matching se realizan de forma manual por psicólogas coordinadoras.

##### Debilidades de la Plataforma

Falta de escalabilidad tecnológica debido a la dependencia de coordinadores humanos para cribar y emparejar manualmente, limitando el crecimiento geográfico y aumentando costes fijos.

##### Funcionamiento del Servicio

Líder internacional en telepsicología masiva. La suscripción da derecho a chat ilimitado y a una videollamada corta semanal.

##### Debilidades de la Plataforma

Multa de 7.8 millones de dólares por la FTC por transferir ilegalmente datos de salud de pacientes a anunciantes (Facebook/Snapchat). Burnout crónico por chat diario ilimitado.

##### Funcionamiento del Servicio

Plataforma orientada al mercado de seguros corporativos estadounidenses. Posee resúmenes inteligentes e insights de chats para el terapeuta.

##### Debilidades de la Plataforma

Sesiones síncronas muy cortas (restringidas a solo 30 minutos) exigidas por aseguradoras para maximizar los márgenes comerciales, mermando el alcance psicoterapéutico.

### Comparativa Financiera Analítica (Precio al Paciente vs. Retribución Profesional)

Análisis cruzado del precio por hora equivalente de terapia síncrona (1 hora de tiempo del terapeuta en videollamada) y de las tarifas mensuales de suscripción.

#### Perspectiva del Paciente (Tarifa por 1 hora equivalente)

- Ancora App (Nuestra): Suscripciones desde 69 €/mes (Esencial: chat IA local + 1 sesión mensual). Extras y add-ons configurables a la carta con descuentos por volumen.

- BetterHelp: Suscripción de $280-$400/mes que incluye 4 sesiones síncronas de 30-45 min. Equivalente a un coste de $80 a $120 por hora de videollamada real .

- Unobravo / Buencoco: Pago por sesión de 45€ (50 min), equivalente a 54 € por hora de videollamada síncrona .

- Therapyside: Suscripción de 180€/mes por 4 sesiones (50 min), equivalente a 54 € por hora de videollamada .

#### Perspectiva del Terapeuta (Retribución neta por 1 hora de trabajo)

- Ancora App (Nuestra): El psicólogo percibe honorarios fijos y exentos de IVA de 15 € netos por revisión de 15m (tasa de 60 €/h) y 40 € netos por videollamada de 45m (tasa de 53,33 €/h), cobrados directamente mediante Stripe Connect. Los descuentos por volumen son absorbidos por el margen tecnológico SaaS de la plataforma.

- Unobravo / Buencoco: El terapeuta recibe ~30€ por 50 min de videollamada, equivalente a 36 €/hora netos .

- Therapyside: El terapeuta recibe ~27€ por 50 min de videollamada, equivalente a 32,40 €/hora netos .

- BetterHelp / Talkspace: Pago variable de $20 a $70 por hora de videollamada efectiva en el modelo de contratista 1099, sin estabilidad horaria.

Nuestra plataforma se posicionará bajo el concepto de "Clínica Tecnológica de Alta Retribución y Continuidad Basada en Datos (RGPD)" . Su ventaja competitiva descansa sobre tres pilares fundamentales que corrigen los fallos de los competidores analizados:

- Fair-Trade Therapy (Comisiones Éticas): Al operar como proveedor de infraestructura SaaS (49€/mes) y delegar el flujo de facturación directa vía Stripe Connect, el psicólogo percibe hasta un 40% más por sesión que en Therapyside o Unobravo, garantizando la captación y fidelidad de terapeutas senior experimentados.

- Copiloto Clínico (Smart SOAP): Integramos IA local basada en RAG para transcribir videollamadas y autogenerar las notas de progreso clínico (SOAP). Esto ahorra un 40% del tiempo burocrático del psicólogo sin mercantilizar el trato directo.

- Seguridad de Datos Zero-Knowledge: Todo el historial clínico, diarios emocionales de la IA local y videollamadas se blindan mediante claves derivadas del cliente (Argon2id), impidiendo filtraciones de datos (BetterHelp) y garantizando el cumplimiento estricto del RGPD europeo.

## 4. Captación de Psicólogos Freelance y Colaboración

### Estrategia de Captación

La captación de los primeros 10-20 psicólogos sanitarios colaboradores se centrará en canales formales para asegurar la legalidad:

- Tablones de Empleo de Colegios Oficiales (COP): Publicación oficial que garantiza la visibilidad ante profesionales en ejercicio activo.

- LinkedIn Recruiter: Búsqueda booleana dirigida: `(MPGS OR "General Sanitario" OR "Especialista en Psicología Clínica") AND Colegiado`.

- Mundopsicólogos y Doctoralia: Captación activa de psicólogos que ya trabajan online como autónomos independientes.

### Requisitos Profesionales Sanitarios obligatorios

Para operar legalmente en España (Ley 33/2011 General de Salud Pública), los colaboradores deben aportar:

- Título homologado y habilitación como **Psicólogo General Sanitario** (MPGS) o **Especialista en Psicología Clínica** (PIR).

- Colegiación activa en el Colegio Oficial de Psicología correspondiente.

- Seguro de Responsabilidad Civil profesional con cobertura mínima de 150.000 €.

- Alta en el régimen de autónomos (RETA) o mutualidad médica equivalente.

#### Simulación Financiera del Colaborador (15h/semana)

Un psicólogo dedicando 15 horas semanales (10h de videollamadas y 5h de revisiones asíncronas de IA) puede facturar **2.107 € netos al mes** exentos de IVA en nuestra plataforma, superando ampliamente la rentabilidad por hora de los portales líderes.

## 5. Viabilidad Técnica del Hardware e IA Local Premium

### Configuración de Servidores de Gama Alta ("Pepino GPU")

Para garantizar una confidencialidad médica absoluta y la soberanía física de los datos, el sistema operará bajo servidores locales dedicados de alto rendimiento en lugar de APIs comerciales extranjeras. La configuración optimizada de referencia es:

- Workstation Local "Dual RTX 4090" (~6.530€): Equipado con 2x GPUs NVIDIA GeForce RTX 4090 (48GB GDDR6X VRAM total, bus PCIe Gen 5 directo a CPU con ancho de banda ~2.016 GB/s), procesador AMD Ryzen 9 9950X (16 núcleos) y 128GB de memoria RAM DDR5.

- vLLM con Tensor Parallelism (TP=2) y PagedAttention: Divide y paraleliza el modelo en ambas tarjetas de manera síncrona mediante intercomunicación directa a través de memoria compartida local (`FI_PROVIDER="shm"`), maximizando el ancho de banda.

### Modelos de Razonamiento, Concurrencia y Benchmarks de Velocidad

Se despliegan modelos de razonamiento lógico y clínico avanzados de gran escala en local (**70B / 72B parámetros**) e inferencia síncrona de audio/voz:

#### Evaluación de Calidad Clínica y Seguridad en Español (Escala 1-100)

#### Velocidad de Inferencia por Usuario (Tokens/segundo en TP=2)

*Nota: Exceso de asignación de KV Cache sobre el pool de VRAM libre, forzando desalojo temporal de bloques a RAM de sistema.

### Aplanamiento de Concurrencia mediante Reservas de Slots de 15 Minutos

Para garantizar una respuesta instantánea de voz interactiva y no saturar los servidores privados locales, la plataforma limita el chat a **15 minutos al día acumulables** bajo un sistema de **reserva de franjas horarias obligatoria** en la aplicación.

#### Ajuste de Concurrencia por Audio/Voz (Whisper)

• El Reto del Audio: Si 40 usuarios intentaran chatear por voz síncronamente a la vez en la misma máquina, la transcripción con Whisper y el LLM colapsarían la GPU, disparando la latencia de respuesta por encima de los 10 segundos.
 • Límite Seguro de Reservas: Reajustamos el límite a **10 usuarios reservados por bloque de 15 minutos por servidor (PC)**. Esto garantiza que la transcripción, la inferencia y el TTS se procesen de forma inmediata con una latencia total percibida de <1.5 segundos .

#### Capacidad Operativa y Reservas por Bloque

• Rendimiento Diario por PC: Con 64 bloques de 15 minutos al día (16 horas operativas), una única máquina Dual GPU atiende con soltura a 640 sesiones de chat diarias de 15 minutos .
 • Escalabilidad Inicial: Para dar servicio a 1.000 usuarios activos diarios (DAU), solo necesitamos **2 PCs Dual GPU** funcionando en paralelo en casa, proporcionando un margen de seguridad de más de 200 slots ociosos al día.

### Escalabilidad Eléctrica Doméstica y Transición a Data Center

Al alojar la infraestructura física inicialmente de forma residencial, debemos respetar las limitaciones técnicas de la red eléctrica en España:

#### Límite Eléctrico Monofásico Doméstico

• Potencia Máxima por Circuito: Un circuito de enchufes estándar en España (16A a 230V) soporta un consumo máximo de **3.680W**.
 • Consumo del Servidor: Un PC Dual RTX 4090 consume **~900W** en inferencia activa total.
 • Límite Doméstico Seguro: Se pueden conectar un máximo de **3 PCs Dual GPU por circuito de enchufes independiente** (2.700W combinados) para no sobrepasar el límite de seguridad y evitar cortes por sobrecarga del ICP doméstico.

#### Plan de Crecimiento y Migración a Data Center

• Fase Beta/Lanzamiento: Iniciaremos con 2 PCs en casa (consumo de ~1.800W, cubierto de sobra por cualquier enchufe doméstico).
 • Fase de Crecimiento (1.000+ DAU): Al superar los 1.000 usuarios activos (que generan ingresos de ~40.000€/mes), migraremos la granja de servidores físicos a **servidores dedicados Bare Metal GPU** en un Data Center especializado en España (ej. OVHcloud Madrid o hosting nacional). Esto elimina la complejidad de climatización y energía en casa, garantizando la soberanía de los datos a nivel nacional bajo el Esquema Nacional de Seguridad (ENS) y el RGPD.

### Lógica de Colas de Prioridad en Redis/BullMQ para Créditos Libres

Si el usuario consume sus 15 minutos diarios acumulables, puede comprar "créditos libres" de IA para seguir conversando. Para no interferir con el rendimiento de las sesiones programadas, el sistema gestiona los mensajes en un pipeline diferenciado:

- Cola de Alta Prioridad (Reserved Slots): Los mensajes de usuarios con slots de tiempo reservados en la agenda entran al vLLM de forma inmediata, garantizando una respuesta instantánea (latencia <1.5s).

- Cola de Baja Prioridad (Free Credits): Los mensajes comprados con créditos libres se encolan en Redis mediante BullMQ. Si hay ranuras libres en el slot reservado del PC (los 10 usuarios reservados están leyendo o escribiendo), se procesan al instante. Si las ranuras están ocupadas, el mensaje libre espera unos segundos. En la UI se muestra de forma transparente: "Servidores a alta capacidad. Procesando en cola de espera..." , incentivando psicológicamente al usuario a realizar reservas planificadas.

### Catálogo de Modelos Locales de Inteligencia Extrema (Clase GPT-5)

Para garantizar que el usuario note una IA "extremadamente inteligente" y conversacionalmente fluida en su diario de acompañamiento emocional, el hardware local del servidor se optimiza para ejecutar de manera nativa los siguientes modelos líderes:

- DeepSeek-R1 (Distill Qwen 70B): Inteligencia de razonamiento analítico de clase mundial. Destaca por su **Chain-of-Thought (Cadena de Pensamiento)** en el chat; el usuario ve las trazas de pensamiento de la IA (etiquetas <thought> ) antes de recibir su respuesta empática, lo que transmite de forma transparente una profunda comprensión clínica y lógica.

`<thought>`

- GLM-4-9B / GLM-5.1 (Zhipu AI): Referencia en fluidez conversacional en español y seguimiento de extensas directrices de comportamiento terapéutico. Se ejecuta a velocidades de **>110 tokens/s** en la Dual RTX 4090, lo que garantiza tiempos de respuesta instantáneos.

- Qwen 2.5 72B / MiniMax-Text-01 (45B MoE): Modelos extremadamente potentes en lógica matemática, codificación y síntesis de historias clínicas en español, idóneos para redactar de forma neutral los borradores de evolución para el psicólogo.

#### Speculative Decoding & Prefix Caching

• Decodificación Especulativa: Un modelo borrador ligero (Llama 3 8B AWQ, 5.5GB VRAM) propone tokens a >120 t/s, los cuales son validados en paralelo por Qwen/DeepSeek 70B, aumentando la velocidad de respuesta interactiva del usuario a 75-80 tokens/s.
 • Automatic Prefix Caching (APC): Almacena en VRAM el KV Cache del prompt clínico de referencia compartido, reduciendo el TTFT a menos de 35ms .

#### Arquitectura RAG Desacoplada

Se configura un límite estricto de contexto de **4.096 tokens** por consulta. El pre-procesamiento e indexación semántica a largo plazo se gestionan en local sobre la CPU y la RAM del sistema (Qdrant Vector DB, ocupando ~2GB de RAM), reservando la preciada VRAM de las GPUs exclusivamente para la inferencia activa.

### Matriz Comparativa de Modelos Locales y Requisitos de VRAM

A continuación se detalla la configuración y los requisitos físicos de VRAM para ejecutar los modelos de última generación locales en la Workstation Dual RTX 4090 (48GB VRAM total) bajo vLLM con Tensor Parallelism (TP=2), contemplando el espacio fijo asignado a la transcripción local con Whisper:

Comparativa de Modelos LLM en Producción Local - Workstation Dual RTX 4090 (48GB VRAM)

### Evaluación de Calidad Clínica y Seguridad (Escala 1-100)

### Velocidad de Inferencia por Usuario (Tokens/segundo en TP=2)

*Nota: Los modelos de 70B/72B experimentan una caída drástica de rendimiento a partir de los 4 usuarios debido a que la demanda de KV Cache supera el pool asignado de la GPU 0, forzando a vLLM a desalojar (eviction/preemption) bloques de memoria a la RAM del sistema.

### Procesamiento de Notas de Voz 100% Local (Soberanía y Privacidad Real)

Para mantener intacto el posicionamiento comercial de "Privacidad Absoluta: Tus datos jamás salen de nuestra máquina física" , se descarta el uso de APIs externas en la nube (como Gemini o OpenAI). Aunque estas ofrezcan contratos BAA/HIPAA, el envío de audios con pensamientos íntimos a servidores de terceros erosiona la confianza psicológica del paciente y debilita la narrativa de marca.

En su lugar, se implementa una dinámica de Notas de Voz Asíncronas con Transcripción y Procesamiento Local :

#### Pipeline de Audio Local (Faster-Whisper-Large-v3 + DeepSeek-R1-70B)

• Grabación e Ingesta: El usuario graba su nota de voz en la aplicación (de 10 segundos a 3 minutos) y el archivo de audio cifrado se envía al servidor local propio.
 • Transcripción Ultrarrápida (Faster-Whisper): Se ejecuta Faster-Whisper-Large-v3 (o su versión destilada) cuantizado a INT8. Consume apenas ~1.5 GB de VRAM y transcribe un audio de 1 minuto en menos de 0.8 segundos en la GPU RTX 4090.
 • Razonamiento y Respuesta: El texto transcrito se inyecta directamente en el LLM local DeepSeek-R1-Distill-Qwen-70B . Este modelo de razonamiento profundo genera su Chain-of-Thought (cadena de pensamiento) y devuelve una respuesta escrita de alta empatía y encuadre clínico.

`Faster-Whisper-Large-v3`

`DeepSeek-R1-Distill-Qwen-70B`

#### Ventajas en UX y Latencia Conversacional

• Latencia Tolerable: Transcripción (0.8s) + Pensamiento profundo de R1 (~4-6s) = Latencia total de ~5 a 7 segundos . En un formato de diario de voz/chat, esta espera es completamente aceptable y se percibe como el "tiempo de reflexión natural de un terapeuta".
 • Cero Complicaciones Técnicas: Se elimina la necesidad de conexiones WebSockets de baja latencia continuas, cancelación de eco en navegadores móviles e inestabilidad de red en llamadas en directo.
 • Privacidad del 100%: Todo el procesamiento del audio a texto y el análisis clínico ocurre in situ en la máquina Dual RTX 4090. Ningún dato de salud del usuario toca redes de terceros.

#### Demostración: Simulador de Chat y Memoria Hermes

Escribe un mensaje de prueba (ej. "Me siento triste y con ganas de llorar" o "No puedo dormir bien") y observa cómo la IA procesa y actualiza el JSON de perfil clínico de forma local y privada:

#### Perfil de Memoria Hermes (JSON)

```
{}
```

{}

#### Análisis Económico de Inferencia: Rentabilidad del Pack de 15€ (5 Horas)

Cada pack de 15€ otorga al usuario **5 horas de inferencia activa en la GPU** (3,00€ / hora de GPU al 100%).
 • Coste Operativo (COGS) por hora: **0,811 €** (incluye 0,582€ de depreciación física del PC a 3 años, 0,162€ de electricidad activa de 900W a 0,18€/kWh y 0,067€ de mantenimiento).
 • Margen Bruto de la Plataforma: **73,0%** (10,95€ de beneficio bruto real por pack vendido).
 • Retorno de Inversión (ROI): A una tasa media de ocupación del 50% (6h de inferencia activa al día), el servidor premium de 6.530€ se amortiza en **~16,5 meses**, rindiendo un **ROI de 178,8%** a los 3 años de vida útil. ¡Comprar más PCs de gama alta es extraordinariamente rentable!

# T2: Chatbot con Memoria y Evolucion Clinica — Diseno de Sistema para Ancora

## Indice

- Arquitectura de Memoria (3 Niveles)

- Evolucion Clinica

- Pipeline RAG

- Memoria Tipo Hermes

- Ciclo Diario de 15 Min

- Deteccion de Crisis

- Estratificacion de Modelos

## 1. ARQUITECTURA DE MEMORIA (3 NIVELES)

El sistema de memoria de Ancora sigue una arquitectura jerarquica de tres niveles que emula la estructura de la memoria humana: una ventana atencional inmediata (corto plazo), consolidacion episodica diaria (medio plazo) e historia clinica completa indexada (largo plazo).

```
+------------------------------------------------------------------+
| SISTEMA DE MEMORIA ANCORA |
+------------------------------------------------------------------+
| |
| CORTO PLAZO (Working Memory) |
| +------------------------------------------------------------+ |
| | Ventana de contexto: 4K-8K tokens | |
| | Almacen: KV Cache en VRAM (vLLM PagedAttention) | |
| | Persistencia: duracion de la sesion de 15 min | |
| | Limpieza: al cerrar sesion se extraen "hechos del dia" | |
| +------------------------------------------------------------+ |
| | |
| v |
| MEDIO PLAZO (Episodic Memory) |
| +------------------------------------------------------------+ |
| | Resumen diario: compresion de la sesion del dia | |
| | Resumen semanal: consolidacion de 7 resumenes diarios | |
| | Almacen: PostgreSQL (tabla `daily_summaries`) | |
| | Trigger: fin de sesion (diario) / sabado noche (semanal) | |
| +------------------------------------------------------------+ |
| | |
| v |
| LARGO PLAZO (Semantic Memory) |
| +------------------------------------------------------------+ |
| | Vector DB (pgvector / Qdrant) | |
| | Chunks: conversaciones, diarios, informes SOAP | |
| | Metadatos: timestamp, tipo, emocion asociada, temas | |
| | Indexacion: nightly batch (20:00-08:00) | |
| +------------------------------------------------------------+ |
| |
+------------------------------------------------------------------+
```

+------------------------------------------------------------------+ | SISTEMA DE MEMORIA ANCORA | +------------------------------------------------------------------+ | | | CORTO PLAZO (Working Memory) | | +------------------------------------------------------------+ | | | Ventana de contexto: 4K-8K tokens | | | | Almacen: KV Cache en VRAM (vLLM PagedAttention) | | | | Persistencia: duracion de la sesion de 15 min | | | | Limpieza: al cerrar sesion se extraen "hechos del dia" | | | +------------------------------------------------------------+ | | | | | v | | MEDIO PLAZO (Episodic Memory) | | +------------------------------------------------------------+ | | | Resumen diario: compresion de la sesion del dia | | | | Resumen semanal: consolidacion de 7 resumenes diarios | | | | Almacen: PostgreSQL (tabla `daily_summaries`) | | | | Trigger: fin de sesion (diario) / sabado noche (semanal) | | | +------------------------------------------------------------+ | | | | | v | | LARGO PLAZO (Semantic Memory) | | +------------------------------------------------------------+ | | | Vector DB (pgvector / Qdrant) | | | | Chunks: conversaciones, diarios, informes SOAP | | | | Metadatos: timestamp, tipo, emocion asociada, temas | | | | Indexacion: nightly batch (20:00-08:00) | | | +------------------------------------------------------------+ | | | +------------------------------------------------------------------+

### 1.1 Memoria a Corto Plazo (Working Memory)

Gestionada directamente por vLLM mediante PagedAttention con KV Cache cuantizada.

- Ventana maxima: 8,192 tokens por sesion de 15 minutos

- Tamaño efectivo: ~4,000 tokens para dejar margen para RAG y system prompt

- Ubicacion fisica: VRAM de las GPUs (~1.31 GB por usuario a 8K contexto con KV Cache 8-bit)

- Mecanismo de extraccion: Al cerrar la sesion, el sistema ejecuta un prompt de extraccion para obtener hechos clave, estado emocional y temas pendientes

```
PROMPT DE EXTRACCION POST-SESION (ejecutado en el modelo 8B-14B):

Sistema: Extrae los siguientes campos de la conversacion reciente.
 Devuelve SOLO JSON valido.

Campos:
- hechos_del_dia: array de strings con hechos literales
- estado_emocional_predominante: {emocion: string, intensidad: 1-10}
- temas_pendientes: array de strings
- distorsiones_cognitivas_detectadas: array de strings
- nivel_riesgo: "bajo" | "medio" | "alto"
- citas_literales_relevantes: array de {texto: string, contexto: string}
```

PROMPT DE EXTRACCION POST-SESION (ejecutado en el modelo 8B-14B): Sistema: Extrae los siguientes campos de la conversacion reciente. Devuelve SOLO JSON valido. Campos: - hechos_del_dia: array de strings con hechos literales - estado_emocional_predominante: {emocion: string, intensidad: 1-10} - temas_pendientes: array de strings - distorsiones_cognitivas_detectadas: array de strings - nivel_riesgo: "bajo" | "medio" | "alto" - citas_literales_relevantes: array de {texto: string, contexto: string}

### 1.2 Memoria a Medio Plazo (Episodic Memory)

Almacenada en PostgreSQL, tabla daily_summaries . Cada resumen usa ~500-800 tokens comprimidos.

`daily_summaries`

```
Tabla: daily_summaries
+------------------+------------------+-------------------------------------------+
| Columna | Tipo | Descripcion |
+------------------+------------------+-------------------------------------------+
| id | UUID PRIMARY KEY | |
| patient_id | UUID FK | Referencia al paciente |
| session_date | DATE | Fecha de la sesion |
| summary_text | TEXT | Resumen comprimido (~500 tokens max) |
| embedding_id | UUID | Referencia al chunk en vector DB |
| dominant_emotion | VARCHAR(50) | Emocion predominante del dia |
| emotion_score | FLOAT | 1.0 - 10.0 |
| topics | TEXT[] | Array de temas tocados |
| risk_flag | BOOLEAN | Si se detecto algo relevante |
| session_count | INTEGER | Numero de interacciones en el dia |
| created_at | TIMESTAMPTZ | |
+------------------+------------------+-------------------------------------------+

Tabla: weekly_summaries
+------------------+------------------+-------------------------------------------+
| Columna | Tipo | Descripcion |
+------------------+------------------+-------------------------------------------+
| id | UUID PRIMARY KEY | |
| patient_id | UUID FK | |
| week_start | DATE | Lunes de la semana |
| week_end | DATE | Domingo |
| consolidated_text| TEXT | ~1000 tokens, fusion de 7 resumenes |
| embedding_id | UUID | |
| trend | VARCHAR(20) | 'mejoria' | 'estancamiento' | 'retroceso' |
| patterns | JSONB | Patrones emocionales detectados |
| created_at | TIMESTAMPTZ | |
+------------------+------------------+-------------------------------------------+
```

Tabla: daily_summaries +------------------+------------------+-------------------------------------------+ | Columna | Tipo | Descripcion | +------------------+------------------+-------------------------------------------+ | id | UUID PRIMARY KEY | | | patient_id | UUID FK | Referencia al paciente | | session_date | DATE | Fecha de la sesion | | summary_text | TEXT | Resumen comprimido (~500 tokens max) | | embedding_id | UUID | Referencia al chunk en vector DB | | dominant_emotion | VARCHAR(50) | Emocion predominante del dia | | emotion_score | FLOAT | 1.0 - 10.0 | | topics | TEXT[] | Array de temas tocados | | risk_flag | BOOLEAN | Si se detecto algo relevante | | session_count | INTEGER | Numero de interacciones en el dia | | created_at | TIMESTAMPTZ | | +------------------+------------------+-------------------------------------------+ Tabla: weekly_summaries +------------------+------------------+-------------------------------------------+ | Columna | Tipo | Descripcion | +------------------+------------------+-------------------------------------------+ | id | UUID PRIMARY KEY | | | patient_id | UUID FK | | | week_start | DATE | Lunes de la semana | | week_end | DATE | Domingo | | consolidated_text| TEXT | ~1000 tokens, fusion de 7 resumenes | | embedding_id | UUID | | | trend | VARCHAR(20) | 'mejoria' | 'estancamiento' | 'retroceso' | | patterns | JSONB | Patrones emocionales detectados | | created_at | TIMESTAMPTZ | | +------------------+------------------+-------------------------------------------+

Estrategia de consolidacion:

```
DIARIO (fin de sesion de 15 min):
 1. Ejecutar prompt de extraccion post-sesion (modelo 8-14B)
 2. Generar resumen comprimido de ~500 tokens
 3. Almacenar en daily_summaries
 4. Marcar para embedding nocturno

SEMANAL (domingo 22:00 - batch nocturno):
 1. Recuperar los 7 resumenes diarios de la semana
 2. Prompt al modelo 14-32B: "Consolida estos 7 resumenes en uno solo
 de ~1000 tokens. Identifica patrones, progreso y temas recurrentes."
 3. Almacenar en weekly_summaries
 4. Actualizar perfil psicologico del paciente
 5. Generar embedding del resumen semanal consolidado

NOCTURNO (20:00-08:00, nightly batch):
 1. Recorrer todos los daily_summaries del dia sin embedding
 2. Generar embeddings con modelo ligero (all-MiniLM-L6-v2 o similar)
 3. Insertar en pgvector/Qdrant con metadatos
 4. Actualizar indices de patrones emocionales
 5. Generar briefings SOAP pendientes
 6. Ejecutar deteccion de tendencias (modelo 14-32B)
```

DIARIO (fin de sesion de 15 min): 1. Ejecutar prompt de extraccion post-sesion (modelo 8-14B) 2. Generar resumen comprimido de ~500 tokens 3. Almacenar en daily_summaries 4. Marcar para embedding nocturno SEMANAL (domingo 22:00 - batch nocturno): 1. Recuperar los 7 resumenes diarios de la semana 2. Prompt al modelo 14-32B: "Consolida estos 7 resumenes en uno solo de ~1000 tokens. Identifica patrones, progreso y temas recurrentes." 3. Almacenar en weekly_summaries 4. Actualizar perfil psicologico del paciente 5. Generar embedding del resumen semanal consolidado NOCTURNO (20:00-08:00, nightly batch): 1. Recorrer todos los daily_summaries del dia sin embedding 2. Generar embeddings con modelo ligero (all-MiniLM-L6-v2 o similar) 3. Insertar en pgvector/Qdrant con metadatos 4. Actualizar indices de patrones emocionales 5. Generar briefings SOAP pendientes 6. Ejecutar deteccion de tendencias (modelo 14-32B)

### 1.3 Memoria a Largo Plazo (Semantic Memory)

Indexada en base de datos vectorial. Diferentes tipos de contenido se almacenan con metadatos para retrieval segmentado.

```
Chunks en Vector DB (pgvector / Qdrant):
+------------------+------------------------------------------------------+
| Campo | Descripcion |
+------------------+------------------------------------------------------+
| id | UUID |
| patient_id | Para aislamiento por paciente |
| content | Texto del chunk |
| embedding | Vector de 384-768 dimensiones |
| metadata | JSONB: tipo, timestamp, emocion, temas, session_id |
| content_type | 'conversacion' | 'diario' | 'soap' | 'resumen' |
| created_at | TIMESTAMPTZ |
| source | Origen: 'chat' | 'whisper_transcript' | 'soap' |
+------------------+------------------------------------------------------+
```

Chunks en Vector DB (pgvector / Qdrant): +------------------+------------------------------------------------------+ | Campo | Descripcion | +------------------+------------------------------------------------------+ | id | UUID | | patient_id | Para aislamiento por paciente | | content | Texto del chunk | | embedding | Vector de 384-768 dimensiones | | metadata | JSONB: tipo, timestamp, emocion, temas, session_id | | content_type | 'conversacion' | 'diario' | 'soap' | 'resumen' | | created_at | TIMESTAMPTZ | | source | Origen: 'chat' | 'whisper_transcript' | 'soap' | +------------------+------------------------------------------------------+

Flujo de insercion nocturna (codigo Python conceptual):

```
# nightly_batch.py — Ejecutado via cron a las 20:00
import asyncio
from pgvector.psycopg2 import register_vector
from sentence_transformers import SentenceTransformer
import psycopg2
import json

# Modelo de embeddings ligero (~80MB, CPU)
embedder = SentenceTransformer('all-MiniLM-L6-v2')

async def nightly_batch():
 conn = psycopg2.connect(dsn="dbname=ancora user=ancora")
 register_vector(conn)
 cur = conn.cursor()

 # 1. Obtener daily_summaries sin embedding del dia
 cur.execute("""
 SELECT id, summary_text, patient_id, dominant_emotion, topics
 FROM daily_summaries
 WHERE embedding_id IS NULL
 AND created_at::date = CURRENT_DATE
 """)

 rows = cur.fetchall()
 for row in rows:
 summary_id, text, patient_id, emotion, topics = row

 # Generar embedding
 vector = embedder.encode(text).tolist()

 # Insertar en vector DB
 cur.execute("""
 INSERT INTO vector_chunks
 (patient_id, content, embedding, metadata, content_type)
 VALUES (%s, %s, %s, %s, 'resumen')
 RETURNING id
 """, (patient_id, text, vector, json.dumps({
 'emotion': emotion,
 'topics': topics,
 'date': str(date.today()),
 'summary_id': str(summary_id)
 })))

 embedding_id = cur.fetchone()[0]

 # Actualizar referencia en daily_summaries
 cur.execute("""
 UPDATE daily_summaries
 SET embedding_id = %s
 WHERE id = %s
 """, (embedding_id, summary_id))

 # 2. Actualizar patrones emocionales
 await detect_emotional_patterns(cur, conn)

 # 3. Generar briefings SOAP pendientes
 await generate_pending_soap(cur, conn)

 conn.commit()
 cur.close()
 conn.close()
```

# nightly_batch.py — Ejecutado via cron a las 20:00 import asyncio from pgvector.psycopg2 import register_vector from sentence_transformers import SentenceTransformer import psycopg2 import json # Modelo de embeddings ligero (~80MB, CPU) embedder = SentenceTransformer('all-MiniLM-L6-v2') async def nightly_batch(): conn = psycopg2.connect(dsn="dbname=ancora user=ancora") register_vector(conn) cur = conn.cursor() # 1. Obtener daily_summaries sin embedding del dia cur.execute(""" SELECT id, summary_text, patient_id, dominant_emotion, topics FROM daily_summaries WHERE embedding_id IS NULL AND created_at::date = CURRENT_DATE """) rows = cur.fetchall() for row in rows: summary_id, text, patient_id, emotion, topics = row # Generar embedding vector = embedder.encode(text).tolist() # Insertar en vector DB cur.execute(""" INSERT INTO vector_chunks (patient_id, content, embedding, metadata, content_type) VALUES (%s, %s, %s, %s, 'resumen') RETURNING id """, (patient_id, text, vector, json.dumps({ 'emotion': emotion, 'topics': topics, 'date': str(date.today()), 'summary_id': str(summary_id) }))) embedding_id = cur.fetchone()[0] # Actualizar referencia en daily_summaries cur.execute(""" UPDATE daily_summaries SET embedding_id = %s WHERE id = %s """, (embedding_id, summary_id)) # 2. Actualizar patrones emocionales await detect_emotional_patterns(cur, conn) # 3. Generar briefings SOAP pendientes await generate_pending_soap(cur, conn) conn.commit() cur.close() conn.close()

## 2. EVOLUCION CLINICA

### 2.1 Deteccion de Patrones Emocionales

El sistema analiza tres dimensiones principales en cada interaccion:

```
Dimensiones de Analisis:
+-------------------+------------------------------------------------------+
| Dimension | Metrica |
+-------------------+------------------------------------------------------+
| Emocional | Clasificador de emociones (6 basicas + 3 clinicas) |
| | - Alegria, Tristeza, Ira, Miedo, Asco, Sorpresa |
| | - Ansiedad, Verguenza, Culpa (clinicas) |
| | Intensidad: 1-10 |
+-------------------+------------------------------------------------------+
| Tono del Lenguaje | Analisis linguistico: |
| | - Proporcion pronombres 1ra/2da persona |
| | - Densidad de palabras negativas vs positivas |
| | - Longitud media de frase (indica energia) |
| | - Uso de absolutistas ("siempre", "nunca", "todo") |
+-------------------+------------------------------------------------------+
| Tematico | Clasificacion de topicos: |
| | - Trabajo, Relaciones, Autoestima, Salud, Familia... |
| | - Recurrencia: cuantas veces aparece un tema en N dias|
| | - Co-ocurrencia: temas que aparecen juntos |
+-------------------+------------------------------------------------------+
```

Dimensiones de Analisis: +-------------------+------------------------------------------------------+ | Dimension | Metrica | +-------------------+------------------------------------------------------+ | Emocional | Clasificador de emociones (6 basicas + 3 clinicas) | | | - Alegria, Tristeza, Ira, Miedo, Asco, Sorpresa | | | - Ansiedad, Verguenza, Culpa (clinicas) | | | Intensidad: 1-10 | +-------------------+------------------------------------------------------+ | Tono del Lenguaje | Analisis linguistico: | | | - Proporcion pronombres 1ra/2da persona | | | - Densidad de palabras negativas vs positivas | | | - Longitud media de frase (indica energia) | | | - Uso de absolutistas ("siempre", "nunca", "todo") | +-------------------+------------------------------------------------------+ | Tematico | Clasificacion de topicos: | | | - Trabajo, Relaciones, Autoestima, Salud, Familia... | | | - Recurrencia: cuantas veces aparece un tema en N dias| | | - Co-ocurrencia: temas que aparecen juntos | +-------------------+------------------------------------------------------+

Algoritmo de deteccion de patrones (ejecutado cada noche):

```
def detect_emotional_patterns(patient_id, days=14):
 """
 Analiza los ultimos N dias de resumenes para detectar:
 - Patrones emocionales dominantes
 - Ciclos (ej. ansiedad los domingos por la noche)
 - Correlaciones entre eventos y estados
 """
 resumenes = get_daily_summaries(patient_id, last_n_days=days)

 # Vector de emociones diarias
 emotion_series = [r.dominant_emotion for r in resumenes]
 intensity_series = [r.emotion_score for r in resumenes]

 # Patron 1: Frecuencia relativa de cada emocion
 from collections import Counter
 freq = Counter(emotion_series)
 dominant = freq.most_common(3)

 # Patron 2: Volatilidad emocional (cambios bruscos)
 volatility = sum(
 abs(intensity_series[i] - intensity_series[i-1])
 for i in range(1, len(intensity_series))
 ) / len(intensity_series)

 # Patron 3: Estancamiento (misma emocion dominante >5 dias seguidos)
 stagnation = max(
 len(list(g))
 for _, g in groupby(emotion_series)
 )

 return {
 'emociones_dominantes': dominant,
 'volatilidad': round(volatility, 2),
 'dias_estancamiento': stagnation,
 'tendencia': classify_trend(resumenes)
 }
```

def detect_emotional_patterns(patient_id, days=14): """ Analiza los ultimos N dias de resumenes para detectar: - Patrones emocionales dominantes - Ciclos (ej. ansiedad los domingos por la noche) - Correlaciones entre eventos y estados """ resumenes = get_daily_summaries(patient_id, last_n_days=days) # Vector de emociones diarias emotion_series = [r.dominant_emotion for r in resumenes] intensity_series = [r.emotion_score for r in resumenes] # Patron 1: Frecuencia relativa de cada emocion from collections import Counter freq = Counter(emotion_series) dominant = freq.most_common(3) # Patron 2: Volatilidad emocional (cambios bruscos) volatility = sum( abs(intensity_series[i] - intensity_series[i-1]) for i in range(1, len(intensity_series)) ) / len(intensity_series) # Patron 3: Estancamiento (misma emocion dominante >5 dias seguidos) stagnation = max( len(list(g)) for _, g in groupby(emotion_series) ) return { 'emociones_dominantes': dominant, 'volatilidad': round(volatility, 2), 'dias_estancamiento': stagnation, 'tendencia': classify_trend(resumenes) }

### 2.2 Identificacion de Progreso vs Estancamiento vs Retroceso

Cada resumen semanal recibe una clasificacion de tendencia basada en criterios compuestos:

```
CRITERIOS DE CLASIFICACION:

PROGRESO (mejoria):
- disminucion de intensidad de emociones negativas (>20% vs semana anterior)
- aumento de variedad emocional
- disminucion de absolutistas en el lenguaje (>30%)
- mencion de estrategias de afrontamiento aplicadas
- reduccion de temas de crisis recurrente

ESTANCAMIENTO:
- misma emocion dominante durante >=7 sesiones
- intensidad estable +/- 1 punto
- mismo conjunto de temas recurrentes sin variacion
- lenguaje sin cambios en densidad negativa/positiva

RETROCESO:
- aumento de intensidad de emociones negativas (>20%)
- reaparicion de temas que se consideraban resueltos
- aumento de lenguaje absolutista
- disminucion de mencion de estrategias
- indicadores de evitacion (cambio brusco de tema, silencios)
```

CRITERIOS DE CLASIFICACION: PROGRESO (mejoria): - disminucion de intensidad de emociones negativas (>20% vs semana anterior) - aumento de variedad emocional - disminucion de absolutistas en el lenguaje (>30%) - mencion de estrategias de afrontamiento aplicadas - reduccion de temas de crisis recurrente ESTANCAMIENTO: - misma emocion dominante durante >=7 sesiones - intensidad estable +/- 1 punto - mismo conjunto de temas recurrentes sin variacion - lenguaje sin cambios en densidad negativa/positiva RETROCESO: - aumento de intensidad de emociones negativas (>20%) - reaparicion de temas que se consideraban resueltos - aumento de lenguaje absolutista - disminucion de mencion de estrategias - indicadores de evitacion (cambio brusco de tema, silencios)

### 2.3 Actualizacion del Perfil Psicologico

El perfil psicologico del paciente es un documento JSON que se actualiza con cada interaccion significativa (nudge tras N interacciones, donde N se determina por la significancia del cambio detectado).

Ver seccion 4. Memoria Tipo Hermes para la estructura completa del perfil.

### 2.4 Alertas Automaticas al Psicologo

Sistema de alertas escalonadas:

```
NIVELES DE ALERTA:

🟢 NIVEL VERDE (Informativo):
 - "Patron detectado: tu paciente muestra aumento de ansiedad
 los fines de semana"
 - "Tema emergente: ha mencionado conflictos laborales 3 veces
 esta semana"
 - Canal: notificacion push en el dashboard

🟡 NIVEL AMBAR (Requiere atencion):
 - "Estancamiento detectado: 10 dias consecutivos con ansiedad
 como emocion dominante"
 - "Retroceso: aumento del 40% en lenguaje absolutista esta semana"
 - Canal: email + notificacion dashboard

🔴 NIVEL ROJO (Urgente):
 - "Posible crisis detectada: ideacion suicida en la sesion de hoy"
 - "Alerta de autolesion: patron de lenguaje compatible"
 - Canal: email + SMS + notificacion app + llamada si configurado
```

NIVELES DE ALERTA: 🟢 NIVEL VERDE (Informativo): - "Patron detectado: tu paciente muestra aumento de ansiedad los fines de semana" - "Tema emergente: ha mencionado conflictos laborales 3 veces esta semana" - Canal: notificacion push en el dashboard 🟡 NIVEL AMBAR (Requiere atencion): - "Estancamiento detectado: 10 dias consecutivos con ansiedad como emocion dominante" - "Retroceso: aumento del 40% en lenguaje absolutista esta semana" - Canal: email + notificacion dashboard 🔴 NIVEL ROJO (Urgente): - "Posible crisis detectada: ideacion suicida en la sesion de hoy" - "Alerta de autolesion: patron de lenguaje compatible" - Canal: email + SMS + notificacion app + llamada si configurado

```
// sistema_alertas.js — Logica de alertas en backend Node.js
const nodemailer = require('nodemailer');
const twilio = require('twilio');

async function evaluarYNotificar(patientId, sessionData) {
 const alertas = [];

 // 1. Evaluar riesgo inmediato (ver seccion 6)
 if (sessionData.nivel_riesgo === 'alto') {
 alertas.push({
 nivel: 'rojo',
 tipo: 'crisis',
 mensaje: 'ALERTA DE CRISIS: Se ha detectado ideacion suicida/autolesion',
 canales: ['email', 'sms', 'push']
 });
 }

 // 2. Evaluar estancamiento
 const patrones = await detectarPatrones(patientId, 14);
 if (patrones.dias_estancamiento >= 7) {
 alertas.push({
 nivel: 'ambar',
 tipo: 'estancamiento',
 mensaje: `Estancamiento detectado: ${patrones.dias_estancamiento} dias
 con misma emocion dominante`,
 canales: ['email', 'push']
 });
 }

 // 3. Evaluar retroceso
 if (patrones.tendencia === 'retroceso') {
 alertas.push({
 nivel: 'ambar',
 tipo: 'retroceso',
 mensaje: 'Retroceso detectado en tendencia semanal',
 canales: ['email', 'push']
 });
 }

 // Enviar alertas
 for (const alerta of alertas) {
 await enviarAlerta(patientId, alerta);
 }

 return alertas;
}
```

// sistema_alertas.js — Logica de alertas en backend Node.js const nodemailer = require('nodemailer'); const twilio = require('twilio'); async function evaluarYNotificar(patientId, sessionData) { const alertas = []; // 1. Evaluar riesgo inmediato (ver seccion 6) if (sessionData.nivel_riesgo === 'alto') { alertas.push({ nivel: 'rojo', tipo: 'crisis', mensaje: 'ALERTA DE CRISIS: Se ha detectado ideacion suicida/autolesion', canales: ['email', 'sms', 'push'] }); } // 2. Evaluar estancamiento const patrones = await detectarPatrones(patientId, 14); if (patrones.dias_estancamiento >= 7) { alertas.push({ nivel: 'ambar', tipo: 'estancamiento', mensaje: `Estancamiento detectado: ${patrones.dias_estancamiento} dias con misma emocion dominante`, canales: ['email', 'push'] }); } // 3. Evaluar retroceso if (patrones.tendencia === 'retroceso') { alertas.push({ nivel: 'ambar', tipo: 'retroceso', mensaje: 'Retroceso detectado en tendencia semanal', canales: ['email', 'push'] }); } // Enviar alertas for (const alerta of alertas) { await enviarAlerta(patientId, alerta); } return alertas; }

### 2.5 Metricas Detalladas

```
METRICAS POR PACIENTE (calculadas en nightly batch):

| Metrica | Formula / Origen |
|--------------------------------------|--------------------------------------------|
| Frecuencia de emociones | Conteo de emociones dominantes / total dias|
| Tono del lenguaje (ratio neg/pos) | Analisis lexico con diccionario NRC |
| Temas recurrentes | Clasificador de topicos sobre N chunks |
| Volatilidad emocional | Desviacion estandar de intensidad diaria |
| Progresion de intensidad | Pendiente de regresion lineal (14 dias) |
| Densidad de absolutistas | Frecuencia de "siempre/nunca/todo" / total |
| Ratio de adherencia | Sesiones realizadas / sesiones esperadas |
| Tiempo hasta primera respuesta | Latencia del paciente en contestar |
| Longitud media de intervencion | Tokens promedio por mensaje del paciente |
| Exploracion de nuevos temas | Proporcion de topicos nuevos vs repetidos |
```

METRICAS POR PACIENTE (calculadas en nightly batch): | Metrica | Formula / Origen | |--------------------------------------|--------------------------------------------| | Frecuencia de emociones | Conteo de emociones dominantes / total dias| | Tono del lenguaje (ratio neg/pos) | Analisis lexico con diccionario NRC | | Temas recurrentes | Clasificador de topicos sobre N chunks | | Volatilidad emocional | Desviacion estandar de intensidad diaria | | Progresion de intensidad | Pendiente de regresion lineal (14 dias) | | Densidad de absolutistas | Frecuencia de "siempre/nunca/todo" / total | | Ratio de adherencia | Sesiones realizadas / sesiones esperadas | | Tiempo hasta primera respuesta | Latencia del paciente en contestar | | Longitud media de intervencion | Tokens promedio por mensaje del paciente | | Exploracion de nuevos temas | Proporcion de topicos nuevos vs repetidos |

## 3. PIPELINE RAG

### 3.1 Base de Datos Vectorial

Para Ancora se recomienda pgvector (extension nativa de PostgreSQL) sobre Qdrant por:

- Menos servicios que mantener (una unica base de datos)

- Transacciones ACID con el resto de datos clinicos

- Backup unificado

- Suficiente rendimiento para 1,000 DAU con ~100K chunks

```
CONFIGURACION PGVECTOR:

-- Activar extension
CREATE EXTENSION vector;

-- Tabla de chunks
CREATE TABLE vector_chunks (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 patient_id UUID NOT NULL REFERENCES patients(id),
 content TEXT NOT NULL,
 embedding vector(384), -- all-MiniLM-L6-v2
 metadata JSONB DEFAULT '{}',
 content_type VARCHAR(50) NOT NULL,
 source VARCHAR(50) DEFAULT 'chat',
 created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices
CREATE INDEX idx_chunks_patient ON vector_chunks(patient_id);

-- Indice vectorial (IVFFlat para balance velocidad/calidad)
CREATE INDEX idx_chunks_embedding ON vector_chunks
 USING ivfflat (embedding vector_cosine_ops)
 WITH (lists = 100);

-- O, para mayor precision (HNSW, mas lento en insercion):
CREATE INDEX idx_chunks_embedding_hnsw ON vector_chunks
 USING hnsw (embedding vector_cosine_ops);
```

CONFIGURACION PGVECTOR: -- Activar extension CREATE EXTENSION vector; -- Tabla de chunks CREATE TABLE vector_chunks ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID NOT NULL REFERENCES patients(id), content TEXT NOT NULL, embedding vector(384), -- all-MiniLM-L6-v2 metadata JSONB DEFAULT '{}', content_type VARCHAR(50) NOT NULL, source VARCHAR(50) DEFAULT 'chat', created_at TIMESTAMPTZ DEFAULT NOW() ); -- Indices CREATE INDEX idx_chunks_patient ON vector_chunks(patient_id); -- Indice vectorial (IVFFlat para balance velocidad/calidad) CREATE INDEX idx_chunks_embedding ON vector_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100); -- O, para mayor precision (HNSW, mas lento en insercion): CREATE INDEX idx_chunks_embedding_hnsw ON vector_chunks USING hnsw (embedding vector_cosine_ops);

### 3.2 Embeddings

Modelo recomendado: sentence-transformers/all-MiniLM-L6-v2

`sentence-transformers/all-MiniLM-L6-v2`

- Dimensiones: 384

- Velocidad en CPU: ~10K docs/segundo

- Tamaño: ~80MB

- Calidad: suficiente para matching semantico clinico

Tipos de contenido embedido:

```
1. CONVERSACIONES (del chat diario)
 Chunk size: 256 tokens
 Overlap: 32 tokens
 Metadata: {type: "conversacion", date, emotion, topics, session_id}

2. DIARIOS (resumenes diarios)
 Chunk size: 512 tokens (el resumen completo como 1 chunk)
 Metadata: {type: "diario", date, dominant_emotion, score}

3. INFORMES SOAP (generados por el modelo 70B)
 Chunk size: 512 tokens
 Metadata: {type: "soap", date, validated_by_therapist, sections}

4. NOTAS DEL PSICOLOGO
 Chunk size: 512 tokens
 Metadata: {type: "nota_psicologo", date, therapist_id}
```

1. CONVERSACIONES (del chat diario) Chunk size: 256 tokens Overlap: 32 tokens Metadata: {type: "conversacion", date, emotion, topics, session_id} 2. DIARIOS (resumenes diarios) Chunk size: 512 tokens (el resumen completo como 1 chunk) Metadata: {type: "diario", date, dominant_emotion, score} 3. INFORMES SOAP (generados por el modelo 70B) Chunk size: 512 tokens Metadata: {type: "soap", date, validated_by_therapist, sections} 4. NOTAS DEL PSICOLOGO Chunk size: 512 tokens Metadata: {type: "nota_psicologo", date, therapist_id}

### 3.3 Retrieval Semantico

El retrieval usa consultas del modelo 8-14B como embedding query, no el texto crudo del usuario. Esto mejora significativamente la relevancia.

```
FLUJO DE RETRIEVAL:

Mensaje del usuario:
 "Hoy me siento muy ansioso por la reunion de trabajo"

Paso 1: Expandir query con el modelo pequeno (8B):
 Query expandida: "ansiedad laboral, sintomas de ansiedad,
 estres por reuniones, anticipacion negativa, rendimiento
 laboral bajo presion"

Paso 2: Embedding de la query expandida (all-MiniLM-L6-v2)

Paso 3: Busqueda coseno en pgvector:
 SELECT content, metadata, 1 - (embedding <=> :query_vec) AS sim
 FROM vector_chunks
 WHERE patient_id = :patient_id
 AND 1 - (embedding <=> :query_vec) > 0.7
 ORDER BY sim DESC
 LIMIT 15;

Paso 4: Reranking (ver 3.4)

Paso 5: Seleccion top-K que quepan en ventana de 4K tokens
```

FLUJO DE RETRIEVAL: Mensaje del usuario: "Hoy me siento muy ansioso por la reunion de trabajo" Paso 1: Expandir query con el modelo pequeno (8B): Query expandida: "ansiedad laboral, sintomas de ansiedad, estres por reuniones, anticipacion negativa, rendimiento laboral bajo presion" Paso 2: Embedding de la query expandida (all-MiniLM-L6-v2) Paso 3: Busqueda coseno en pgvector: SELECT content, metadata, 1 - (embedding <=> :query_vec) AS sim FROM vector_chunks WHERE patient_id = :patient_id AND 1 - (embedding <=> :query_vec) > 0.7 ORDER BY sim DESC LIMIT 15; Paso 4: Reranking (ver 3.4) Paso 5: Seleccion top-K que quepan en ventana de 4K tokens

### 3.4 Reranking

El reranker filtra los resultados del retrieval inicial para eliminar falsos positivos.

```
from sentence_transformers import CrossEncoder

# Modelo reranker (~50MB, CPU)
reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

def rerank(query, candidates, top_k=5):
 """
 Toma los candidatos del retrieval vectorial y los reordena
 segun relevancia real respecto a la query.
 """
 pairs = [[query, c['content']] for c in candidates]
 scores = reranker.predict(pairs)

 scored = list(zip(candidates, scores))
 scored.sort(key=lambda x: x[1], reverse=True)

 # Umbral de relevancia: descartar < 0.3
 filtered = [c for c, s in scored if s > 0.3]

 return filtered[:top_k]
```

from sentence_transformers import CrossEncoder # Modelo reranker (~50MB, CPU) reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2') def rerank(query, candidates, top_k=5): """ Toma los candidatos del retrieval vectorial y los reordena segun relevancia real respecto a la query. """ pairs = [[query, c['content']] for c in candidates] scores = reranker.predict(pairs) scored = list(zip(candidates, scores)) scored.sort(key=lambda x: x[1], reverse=True) # Umbral de relevancia: descartar < 0.3 filtered = [c for c, s in scored if s > 0.3] return filtered[:top_k]

### 3.5 Ventana de Contexto Dinamica

El prompt final se construye con un presupuesto maximo de 4,096 tokens para la seccion de contexto RAG.

```
ESTRUCTURA DEL PROMPT FINAL (max 8,192 tokens total):

+------------------------------------------------------------------+
| System Prompt (fijo, ~600 tokens) |
| - Instrucciones de rol (IA clinica de soporte) |
| - Reglas de seguridad (no diagnosticar, no prescribir) |
| - Formato de respuesta (empatico, socratico) |
+------------------------------------------------------------------+
| Contexto Psicologico del Paciente (~400 tokens) |
| - Perfil comprimido extraido de memoria Hermes |
| - Estado emocional actual |
| - Temas pendientes |
+------------------------------------------------------------------+
| Contexto RAG (variable, max 4,096 tokens) |
| - Resumen del dia anterior (si existe) |
| - Chunks relevantes recuperados + rerankeados |
| - Notas SOAP recientes |
+------------------------------------------------------------------+
| Conversacion Actual (~2,000 tokens) |
| - Ultimos N intercambios (hasta llenar ventana) |
+------------------------------------------------------------------+
| Prompt de salida (~100 tokens) |
| - Instruccion de formato de respuesta |
+------------------------------------------------------------------+

AJUSTE DINAMICO:
 1. Medir tokens del System Prompt (fijo, conocido)
 2. Medir tokens del Contexto Psicologico
 3. Calcular tokens disponibles para RAG = 4096 - usado
 4. Iterar chunks rerankeados y agregar mientras quepan
 5. Si no cabe todo, truncar chunks individuales (perder final)
```

ESTRUCTURA DEL PROMPT FINAL (max 8,192 tokens total): +------------------------------------------------------------------+ | System Prompt (fijo, ~600 tokens) | | - Instrucciones de rol (IA clinica de soporte) | | - Reglas de seguridad (no diagnosticar, no prescribir) | | - Formato de respuesta (empatico, socratico) | +------------------------------------------------------------------+ | Contexto Psicologico del Paciente (~400 tokens) | | - Perfil comprimido extraido de memoria Hermes | | - Estado emocional actual | | - Temas pendientes | +------------------------------------------------------------------+ | Contexto RAG (variable, max 4,096 tokens) | | - Resumen del dia anterior (si existe) | | - Chunks relevantes recuperados + rerankeados | | - Notas SOAP recientes | +------------------------------------------------------------------+ | Conversacion Actual (~2,000 tokens) | | - Ultimos N intercambios (hasta llenar ventana) | +------------------------------------------------------------------+ | Prompt de salida (~100 tokens) | | - Instruccion de formato de respuesta | +------------------------------------------------------------------+ AJUSTE DINAMICO: 1. Medir tokens del System Prompt (fijo, conocido) 2. Medir tokens del Contexto Psicologico 3. Calcular tokens disponibles para RAG = 4096 - usado 4. Iterar chunks rerankeados y agregar mientras quepan 5. Si no cabe todo, truncar chunks individuales (perder final)

## 4. MEMORIA TIPO HERMES

Inspirado en el sistema de memoria persistente de Hermes, Ancora implementa una estructura de "hechos persistentes" que evoluciona con cada interaccion.

### 4.1 Estructura Completa en JSON

```
{
 "patient_id": "uuid-del-paciente",
 "version": 7,
 "ultima_actualizacion": "2026-05-31T02:00:00Z",

 "datos_demograficos": {
 "edad": 34,
 "genero": "femenino",
 "ocupacion": "desarrolladora de software",
 "ubicacion": "Madrid"
 },

 "hechos_persistentes": {
 "creencias_fundamentales": [
 "Cree que no es lo suficientemente buena en su trabajo",
 "Cree que los demas la juzgan constantemente",
 "Cree que debe complacer a todos para ser aceptada"
 ],
 "relaciones_significativas": [
 {
 "persona": "madre",
 "tipo": "familiar",
 "calidad": "conflictiva",
 "patron": "critica constante, busca aprobacion",
 "eventos_recientes": ["discusion por telefono el 2026-05-28"]
 },
 {
 "persona": "pareja",
 "tipo": "romantica",
 "calidad": "estable",
 "patron": "apoyo, pero dificultad para expresar necesidades",
 "eventos_recientes": []
 }
 ],
 "eventos_vitales": [
 {
 "fecha": "2025-11-15",
 "tipo": "laboral",
 "descripcion": "ascenso a lider de equipo",
 "impacto_emocional": "estres positivo inicial, luego ansiedad"
 },
 {
 "fecha": "2025-03-10",
 "tipo": "perdida",
 "descripcion": "fallecimiento del padre",
 "impacto_emocional": "duelo no procesado, evita hablar del tema"
 }
 ]
 },

 "perfil_psicologico": {
 "diagnostico_trabajado": "Trastorno de Ansiedad Generalizada (TAG)",
 "enfoque_terapeutico": "TCC con elementos de ACT",
 "distorsiones_cognitivas_frecuentes": [
 "lectura de mente",
 "catastrofismo",
 "polarizacion (blanco o negro)",
 "personalizacion"
 ],
 "patrones_emocionales": {
 "ansiedad": {
 "frecuencia": "alta (70% de los dias)",
 "intensidad_media": 7.2,
 "desencadenantes_comunes": ["reuniones laborales", "criticas", "incertidumbre"],
 "sintomas_expresados": ["taquicardia", "nudo en el estomago", "insomnio"],
 "tendencia_14d": "estable_alta"
 },
 "tristeza": {
 "frecuencia": "media (30% de los dias)",
 "intensidad_media": 5.8,
 "desencadenantes_comunes": ["recuerdos del padre", "sentirse sola"],
 "tendencia_14d": "descendente"
 },
 "ira": {
 "frecuencia": "baja (10% de los dias)",
 "intensidad_media": 4.0,
 "desencadenantes_comunes": ["injusticia percibida", "no ser escuchada"],
 "tendencia_14d": "estable_baja"
 }
 },
 "progreso_medido": {
 "estado_actual": "progreso_lento",
 "mejoras_detectadas": [
 "menos absolutistas en el lenguaje (-25% vs mes anterior)",
 "identifica sus distorsiones con mayor rapidez",
 "ha aplicado 3 ejercicios de exposicion"
 ],
 "areas_estancadas": [
 "autoestima laboral",
 "duelo del padre (evitacion)"
 ],
 "objetivos_terapeuticos": [
 "reducir ansiedad ante reuniones",
 "procesar duelo del padre",
 "establecer limites interpersonales"
 ]
 }
 },

 "gaps": {
 "temas_no_explorados": [
 {
 "tema": "relacion con el padre fallecido",
 "prioridad": "alta",
 "motivo": "evitacion sistematica del tema",
 "intentos_previos_preguntar": 2,
 "respuesta_del_paciente": "cambio de tema / respuesta evasiva",
 "estrategia_sugerida": "abordar de forma indirecta, preguntar por recuerdos neutros"
 },
 {
 "tema": "historial de terapia previa",
 "prioridad": "media",
 "motivo": "no ha mencionado si tuvo terapia antes",
 "intentos_previos_preguntar": 1,
 "ultimo_intento": "2026-05-20",
 "estrategia_sugerida": "preguntar en contexto de 'estrategias que ya has probado'"
 }
 ],
 "ejercicios_pendientes": [
 "registro de pensamientos automaticos (3 registros pendientes)",
 "ejercicio de exposicion a reuniones (no realizado)"
 ]
 },

 "metricas_del_lenguaje": {
 "promedio_palabras_por_mensaje": 45.3,
 "ratio_pronombres_1ra_vs_2da": 3.2,
 "frecuencia_absolutistas_ultima_semana": 12,
 "vocabulario_emocional_detectado": ["ansiedad", "miedo", "frustracion", "soledad", "esperanza"],
 "temas_recurrentes_ultimos_30dias": [
 {"tema": "trabajo", "menciones": 23},
 {"tema": "familia", "menciones": 15},
 {"tema": "autoestima", "menciones": 14},
 {"tema": "relacion_pareja", "menciones": 8}
 ]
 },

 "resumenes_recientes": {
 "ultimo_dia": {
 "fecha": "2026-05-30",
 "emocion_dominante": "ansiedad",
 "intensidad": 8,
 "tema_principal": "reunion importante manana",
 "cita_literal": "No voy a dormir en toda la noche, voy a hacer el ridiculo"
 },
 "ultima_semana": {
 "fecha_inicio": "2026-05-24",
 "fecha_fin": "2026-05-30",
 "tendencia": "estancamiento_leve",
 "patron_detectado": "la ansiedad se intensifica los domingos por la noche",
 "tema_mas_recurrente": "anticipacion negativa de eventos laborales"
 }
 }
}
```

{ "patient_id": "uuid-del-paciente", "version": 7, "ultima_actualizacion": "2026-05-31T02:00:00Z", "datos_demograficos": { "edad": 34, "genero": "femenino", "ocupacion": "desarrolladora de software", "ubicacion": "Madrid" }, "hechos_persistentes": { "creencias_fundamentales": [ "Cree que no es lo suficientemente buena en su trabajo", "Cree que los demas la juzgan constantemente", "Cree que debe complacer a todos para ser aceptada" ], "relaciones_significativas": [ { "persona": "madre", "tipo": "familiar", "calidad": "conflictiva", "patron": "critica constante, busca aprobacion", "eventos_recientes": ["discusion por telefono el 2026-05-28"] }, { "persona": "pareja", "tipo": "romantica", "calidad": "estable", "patron": "apoyo, pero dificultad para expresar necesidades", "eventos_recientes": [] } ], "eventos_vitales": [ { "fecha": "2025-11-15", "tipo": "laboral", "descripcion": "ascenso a lider de equipo", "impacto_emocional": "estres positivo inicial, luego ansiedad" }, { "fecha": "2025-03-10", "tipo": "perdida", "descripcion": "fallecimiento del padre", "impacto_emocional": "duelo no procesado, evita hablar del tema" } ] }, "perfil_psicologico": { "diagnostico_trabajado": "Trastorno de Ansiedad Generalizada (TAG)", "enfoque_terapeutico": "TCC con elementos de ACT", "distorsiones_cognitivas_frecuentes": [ "lectura de mente", "catastrofismo", "polarizacion (blanco o negro)", "personalizacion" ], "patrones_emocionales": { "ansiedad": { "frecuencia": "alta (70% de los dias)", "intensidad_media": 7.2, "desencadenantes_comunes": ["reuniones laborales", "criticas", "incertidumbre"], "sintomas_expresados": ["taquicardia", "nudo en el estomago", "insomnio"], "tendencia_14d": "estable_alta" }, "tristeza": { "frecuencia": "media (30% de los dias)", "intensidad_media": 5.8, "desencadenantes_comunes": ["recuerdos del padre", "sentirse sola"], "tendencia_14d": "descendente" }, "ira": { "frecuencia": "baja (10% de los dias)", "intensidad_media": 4.0, "desencadenantes_comunes": ["injusticia percibida", "no ser escuchada"], "tendencia_14d": "estable_baja" } }, "progreso_medido": { "estado_actual": "progreso_lento", "mejoras_detectadas": [ "menos absolutistas en el lenguaje (-25% vs mes anterior)", "identifica sus distorsiones con mayor rapidez", "ha aplicado 3 ejercicios de exposicion" ], "areas_estancadas": [ "autoestima laboral", "duelo del padre (evitacion)" ], "objetivos_terapeuticos": [ "reducir ansiedad ante reuniones", "procesar duelo del padre", "establecer limites interpersonales" ] } }, "gaps": { "temas_no_explorados": [ { "tema": "relacion con el padre fallecido", "prioridad": "alta", "motivo": "evitacion sistematica del tema", "intentos_previos_preguntar": 2, "respuesta_del_paciente": "cambio de tema / respuesta evasiva", "estrategia_sugerida": "abordar de forma indirecta, preguntar por recuerdos neutros" }, { "tema": "historial de terapia previa", "prioridad": "media", "motivo": "no ha mencionado si tuvo terapia antes", "intentos_previos_preguntar": 1, "ultimo_intento": "2026-05-20", "estrategia_sugerida": "preguntar en contexto de 'estrategias que ya has probado'" } ], "ejercicios_pendientes": [ "registro de pensamientos automaticos (3 registros pendientes)", "ejercicio de exposicion a reuniones (no realizado)" ] }, "metricas_del_lenguaje": { "promedio_palabras_por_mensaje": 45.3, "ratio_pronombres_1ra_vs_2da": 3.2, "frecuencia_absolutistas_ultima_semana": 12, "vocabulario_emocional_detectado": ["ansiedad", "miedo", "frustracion", "soledad", "esperanza"], "temas_recurrentes_ultimos_30dias": [ {"tema": "trabajo", "menciones": 23}, {"tema": "familia", "menciones": 15}, {"tema": "autoestima", "menciones": 14}, {"tema": "relacion_pareja", "menciones": 8} ] }, "resumenes_recientes": { "ultimo_dia": { "fecha": "2026-05-30", "emocion_dominante": "ansiedad", "intensidad": 8, "tema_principal": "reunion importante manana", "cita_literal": "No voy a dormir en toda la noche, voy a hacer el ridiculo" }, "ultima_semana": { "fecha_inicio": "2026-05-24", "fecha_fin": "2026-05-30", "tendencia": "estancamiento_leve", "patron_detectado": "la ansiedad se intensifica los domingos por la noche", "tema_mas_recurrente": "anticipacion negativa de eventos laborales" } } }

### 4.2 Mecanismo de Actualizacion (Nudge)

El perfil no se reescribe en cada interaccion. Se actualiza mediante un sistema de "nudge" que evalua si la nueva informacion es suficientemente significativa para justificar la reescritura.

```
class MemoryNudgeSystem:
 """Sistema de actualizacion perezosa de memoria tipo Hermes."""

 def __init__(self, patient_id):
 self.patient_id = patient_id
 self.umbral_significancia = 0.5 # 0-1

 async def evaluate_nudge(self, session_data):
 """
 Evalua si la sesion reciente merece actualizar el perfil.
 Retorna True si el cambio es significativo.
 """
 cambios = []

 # 1. Cambio emocional significativo
 if abs(session_data.intensidad - self.profile.patron_base) > 2:
 cambios.append(('intensidad_emocional', 0.7))

 # 2. Nuevo tema emergente
 temas_nuevos = set(session_data.temas) - set(self.profile.temas_recurrentes)
 if temas_nuevos:
 cambios.append(('nuevos_temas', 0.6 * len(temas_nuevos)))

 # 3. Detectada nueva distorsion cognitiva
 nuevas_distorsiones = (
 set(session_data.distorsiones) -
 set(self.profile.distorsiones_frecuentes)
 )
 if nuevas_distorsiones:
 cambios.append(('nuevas_distorsiones', 0.8))

 # 4. Menciona relacion no registrada
 for mencion in session_data.relaciones_mencionadas:
 if mencion not in [r.persona for r in self.profile.hechos_persistentes.relaciones]:
 cambios.append(('nueva_relacion', 0.9))
 break

 # 5. Evento vital significativo
 if session_data.tiene_evento_vital:
 cambios.append(('evento_vital', 1.0))

 # Calcular puntuacion total
 puntuacion = sum(peso for _, peso in cambios) / max(len(cambios), 1)

 return puntuacion >= self.umbral_significancia
```

class MemoryNudgeSystem: """Sistema de actualizacion perezosa de memoria tipo Hermes.""" def __init__(self, patient_id): self.patient_id = patient_id self.umbral_significancia = 0.5 # 0-1 async def evaluate_nudge(self, session_data): """ Evalua si la sesion reciente merece actualizar el perfil. Retorna True si el cambio es significativo. """ cambios = [] # 1. Cambio emocional significativo if abs(session_data.intensidad - self.profile.patron_base) > 2: cambios.append(('intensidad_emocional', 0.7)) # 2. Nuevo tema emergente temas_nuevos = set(session_data.temas) - set(self.profile.temas_recurrentes) if temas_nuevos: cambios.append(('nuevos_temas', 0.6 * len(temas_nuevos))) # 3. Detectada nueva distorsion cognitiva nuevas_distorsiones = ( set(session_data.distorsiones) - set(self.profile.distorsiones_frecuentes) ) if nuevas_distorsiones: cambios.append(('nuevas_distorsiones', 0.8)) # 4. Menciona relacion no registrada for mencion in session_data.relaciones_mencionadas: if mencion not in [r.persona for r in self.profile.hechos_persistentes.relaciones]: cambios.append(('nueva_relacion', 0.9)) break # 5. Evento vital significativo if session_data.tiene_evento_vital: cambios.append(('evento_vital', 1.0)) # Calcular puntuacion total puntuacion = sum(peso for _, peso in cambios) / max(len(cambios), 1) return puntuacion >= self.umbral_significancia

### 4.3 Campo de Gaps

El campo gaps es fundamental: registra temas que el sistema sabe que debe explorar pero que no han sido abordados o han sido evadidos.

`gaps`

Logica de autogestion de gaps:

```
CADA NOCHE, en el batch:
 1. Revisar gaps con 'prioridad: alta' que no se han preguntado en 3+ dias
 2. Si un gap tiene 'intentos >= 3' sin exito, escalar al psicologo
 con: "Tema X ha sido evadido 3 veces, posible resistencia"
 3. Si un gap se resuelve (paciente habla del tema), mover a
 'temas_explorados' y actualizar el perfil

EJEMPLO DE HEURISTICA DE ABORDAJE:

funcion sugerir_abordaje(gap, estado_actual):
 si gap.intentos == 0:
 # Primer intento: pregunta directa pero suave
 return "He notado que no hemos hablado mucho de [tema].
 ?Te gustaria compartir algo sobre ello?"

 si gap.intentos == 1:
 # Segundo intento: indirecto, en contexto
 return "A veces cuando pasa [evento_actual], la gente
 nota conexiones con [tema]. ?Te resuena algo?"

 si gap.intentos == 2:
 # Tercer intento: normalizar, reducir presion
 return "No hace falta que hables de [tema] si no te sientes
 preparada. Solo quiero que sepas que cuando quieras,
 podemos abordarlo juntas."

 si gap.intentos >= 3:
 # Escalar al psicologo, no insistir mas
 return None # No preguntar, dejar al humano
```

CADA NOCHE, en el batch: 1. Revisar gaps con 'prioridad: alta' que no se han preguntado en 3+ dias 2. Si un gap tiene 'intentos >= 3' sin exito, escalar al psicologo con: "Tema X ha sido evadido 3 veces, posible resistencia" 3. Si un gap se resuelve (paciente habla del tema), mover a 'temas_explorados' y actualizar el perfil EJEMPLO DE HEURISTICA DE ABORDAJE: funcion sugerir_abordaje(gap, estado_actual): si gap.intentos == 0: # Primer intento: pregunta directa pero suave return "He notado que no hemos hablado mucho de [tema]. ?Te gustaria compartir algo sobre ello?" si gap.intentos == 1: # Segundo intento: indirecto, en contexto return "A veces cuando pasa [evento_actual], la gente nota conexiones con [tema]. ?Te resuena algo?" si gap.intentos == 2: # Tercer intento: normalizar, reducir presion return "No hace falta que hables de [tema] si no te sientes preparada. Solo quiero que sepas que cuando quieras, podemos abordarlo juntas." si gap.intentos >= 3: # Escalar al psicologo, no insistir mas return None # No preguntar, dejar al humano

## 5. CICLO DIARIO DE 15 MIN

### 5.1 Flujo Completo

```
CICLO DIARIO DE 15 MINUTOS
============================

FASE 0: PRE-SESION (back-end, < 1s)
+----+ Inicia cuando el paciente abre el chat
| |
| +--> 1. Cargar perfil psicologico comprimido
| +--> 2. Recuperar resumen del dia anterior
| +--> 3. Recuperar chunks RAG relevantes
| (ultima semana, gaps, temas pendientes)
| +--> 4. Construir prompt inicial con contexto
| +--> 5. Cargar modelo 8-14B en VRAM (si no esta caliente)
|
+----> [PACIENTE VE INTERFAZ: "Hola [nombre], ?como estas hoy?"]

FASE 1: CHECK-IN EMOCIONAL (~2 min)
+----+ La IA guia un check-in estructurado
| |
| +--> ?Como te sientes hoy? (escala 1-10)
| +--> ?Que ha pasado desde nuestra ultima charla?
| +--> ?Hay algo especifico que quieras trabajar hoy?
|
| [Clasificador NLP evalua riesgo en tiempo real]
| Si riesgo "alto" ---> ACTIVAR PROTOCOLO DE CRISIS
| Si riesgo "medio" --> marcar para alerta al psicologo
|
+----> [REGISTRO: estado_emocional_inicial, temas_del_dia]

FASE 2: TRABAJO TERAPEUTICO GUIADO (~10 min)
+----+ La IA aplica tecnicas segun el enfoque y contexto
| |
| ENFOQUE TCC:
| +--> Identificar pensamiento automatico
| +--> ?Que evidencia apoyo/refuta ese pensamiento?
| +--> ?Que le dirias a un amigo en tu situacion?
| +--> Reestructuracion cognitiva guiada
|
| ENFOQUE ACT:
| +--> ?Que estas evitando en este momento?
| +--> Ejercicio de defusion (nombrar el pensamiento)
| +--> ?Que valores guian tus acciones esta semana?
|
| INTERVENCIONES MIXTAS:
| +--> Psicoeducacion breve (si aplica)
| +--> Ejercicio practico (respiración, grounding)
| +--> Exploracion de gaps pendientes (max 1 intento por sesion)
|
+----> [REGISTRO: intervencion_realizada, respuesta_paciente]

FASE 3: CIERRE Y PLAN (~3 min)
+----+ La IA cierra la sesion estructuradamente
| |
| +--> Resumir lo trabajado hoy (1-2 frases)
| +--> ?Que te llevas de esta conversacion?
| +--> Tarea sugerida para la semana
| +--> ?Algo mas que quieras compartir?
| +--> Recordatorio de la proxima sesion con psicologo
|
| [CIERRE AUTOMATICO: registrar fin de sesion]
|
+----> [PACIENTE VE: "Gracias por compartir. Nos vemos manana."]

FASE 4: POST-SESION (back-end, ~2s)
+----+ Ejecutar pipeline de cierre inmediato
| |
| +--> 1. Extraer hechos del dia (prompt de extraccion)
| +--> 2. Generar resumen diario (~500 tokens)
| +--> 3. Detectar distorsiones cognitivas
| +--> 4. Evaluar necesidad de nudge (ver 4.2)
| +--> 5. Almacenar en daily_summaries
| +--> 6. Marcar para embedding nocturno
| +--> 7. Evaluar alertas para el psicologo
| +--> 8. Cerrar sesion, liberar KV Cache
|
+----> [DATOS LISTOS PARA EL BATCH NOCTURNO]

=== FIN DEL CICLO DIARIO ===
```

CICLO DIARIO DE 15 MINUTOS ============================ FASE 0: PRE-SESION (back-end, < 1s) +----+ Inicia cuando el paciente abre el chat | | | +--> 1. Cargar perfil psicologico comprimido | +--> 2. Recuperar resumen del dia anterior | +--> 3. Recuperar chunks RAG relevantes | (ultima semana, gaps, temas pendientes) | +--> 4. Construir prompt inicial con contexto | +--> 5. Cargar modelo 8-14B en VRAM (si no esta caliente) | +----> [PACIENTE VE INTERFAZ: "Hola [nombre], ?como estas hoy?"] FASE 1: CHECK-IN EMOCIONAL (~2 min) +----+ La IA guia un check-in estructurado | | | +--> ?Como te sientes hoy? (escala 1-10) | +--> ?Que ha pasado desde nuestra ultima charla? | +--> ?Hay algo especifico que quieras trabajar hoy? | | [Clasificador NLP evalua riesgo en tiempo real] | Si riesgo "alto" ---> ACTIVAR PROTOCOLO DE CRISIS | Si riesgo "medio" --> marcar para alerta al psicologo | +----> [REGISTRO: estado_emocional_inicial, temas_del_dia] FASE 2: TRABAJO TERAPEUTICO GUIADO (~10 min) +----+ La IA aplica tecnicas segun el enfoque y contexto | | | ENFOQUE TCC: | +--> Identificar pensamiento automatico | +--> ?Que evidencia apoyo/refuta ese pensamiento? | +--> ?Que le dirias a un amigo en tu situacion? | +--> Reestructuracion cognitiva guiada | | ENFOQUE ACT: | +--> ?Que estas evitando en este momento? | +--> Ejercicio de defusion (nombrar el pensamiento) | +--> ?Que valores guian tus acciones esta semana? | | INTERVENCIONES MIXTAS: | +--> Psicoeducacion breve (si aplica) | +--> Ejercicio practico (respiración, grounding) | +--> Exploracion de gaps pendientes (max 1 intento por sesion) | +----> [REGISTRO: intervencion_realizada, respuesta_paciente] FASE 3: CIERRE Y PLAN (~3 min) +----+ La IA cierra la sesion estructuradamente | | | +--> Resumir lo trabajado hoy (1-2 frases) | +--> ?Que te llevas de esta conversacion? | +--> Tarea sugerida para la semana | +--> ?Algo mas que quieras compartir? | +--> Recordatorio de la proxima sesion con psicologo | | [CIERRE AUTOMATICO: registrar fin de sesion] | +----> [PACIENTE VE: "Gracias por compartir. Nos vemos manana."] FASE 4: POST-SESION (back-end, ~2s) +----+ Ejecutar pipeline de cierre inmediato | | | +--> 1. Extraer hechos del dia (prompt de extraccion) | +--> 2. Generar resumen diario (~500 tokens) | +--> 3. Detectar distorsiones cognitivas | +--> 4. Evaluar necesidad de nudge (ver 4.2) | +--> 5. Almacenar en daily_summaries | +--> 6. Marcar para embedding nocturno | +--> 7. Evaluar alertas para el psicologo | +--> 8. Cerrar sesion, liberar KV Cache | +----> [DATOS LISTOS PARA EL BATCH NOCTURNO] === FIN DEL CICLO DIARIO ===

### 5.2 Resumen Automatico (Post-Sesion)

El prompt de resumen post-sesion se ejecuta en el modelo 8-14B (el mismo del chat diario) para no consumir recursos del modelo grande:

```
PROMPT DE RESUMEN AUTOMATICO:

Sistema: Eres un asistente clinico que resume sesiones de terapia.
Genera un resumen estructurado en JSON de la conversacion reciente.

Debes extraer:
1. "resumen": 2-3 frases del contenido principal
2. "emocion_dominante": una emocion principal
3. "intensidad_emocional": 1-10
4. "distorsiones_cognitivas": array (vacio si no hay)
5. "temas_mencionados": array
6. "intervencion_realizada": tipo de intervencion
7. "respuesta_a_intervencion": "receptivo"|"neutral"|"resistente"
8. "temas_pendientes": array de temas no cerrados
9. "citas_literales": array de frases textuales relevantes
10. "nivel_riesgo": "bajo"|"medio"|"alto"

Devuelve SOLO el JSON, sin texto adicional.
```

PROMPT DE RESUMEN AUTOMATICO: Sistema: Eres un asistente clinico que resume sesiones de terapia. Genera un resumen estructurado en JSON de la conversacion reciente. Debes extraer: 1. "resumen": 2-3 frases del contenido principal 2. "emocion_dominante": una emocion principal 3. "intensidad_emocional": 1-10 4. "distorsiones_cognitivas": array (vacio si no hay) 5. "temas_mencionados": array 6. "intervencion_realizada": tipo de intervencion 7. "respuesta_a_intervencion": "receptivo"|"neutral"|"resistente" 8. "temas_pendientes": array de temas no cerrados 9. "citas_literales": array de frases textuales relevantes 10. "nivel_riesgo": "bajo"|"medio"|"alto" Devuelve SOLO el JSON, sin texto adicional.

### 5.3 Batch Nocturno (20:00 - 08:00)

```
NOCTURNO: PROCESAMIENTO EN BACKGROUND
========================================

PIPELINE NOCTURNO (orquestado por cron + BullMQ):

20:00 ─── 1. Activar workers nocturnos
 2. Pausar workers de chat diurno
 3. Iniciar pipeline

20:00-20:15 ─── A. EMBEDDINGS DEL DIA
 +----> Recorrer daily_summaries del dia sin embedding
 +----> all-MiniLM-L6-v2 en CPU
 +----> Insertar en pgvector

20:15-20:30 ─── B. DETECCION DE PATRONES
 +----> Leer ultimos 14-30 resumenes del paciente
 +----> Modelo 14-32B: detectar tendencias, patrones
 +----> Actualizar perfil psicologico (si nudge > umbral)
 +----> Actualizar campo trends en weekly_summary

20:30-21:00 ─── C. BRIEFING SOAP (si es domingo o fin de mes)
 +----> Modelo 70B: generar o refrescar informe SOAP
 +----> Almacenar en tabla soap_reports
 +----> Embedding del SOAP generado

21:00-21:15 ─── D. GAPS Y ALERTAS
 +----> Revisar gaps con prioridad alta no preguntados en 3+ dias
 +----> Evaluar alertas para psicologo
 +----> Notificaciones push programadas

21:15-23:00 ─── E. TRANSCRIPCIONES WHISPER (pendientes del dia)
 +----> Procesar cola de audios en GPU secundaria (RTX 3060/4060)
 +----> Faster-Whisper-Large-v3 en INT8

23:00-06:00 ─── F. PROCESAMIENTO DIFERIDO
 +----> Limpieza de KV Cache
 +----> Compactacion de tablas
 +----> Backups

06:00-08:00 ─── G. PREPARACION DIURNA
 +----> Preparar resumenes del dia para cada paciente
 +----> Precargar contextos de pacientes con sesion temprano
 +----> Ready para el dia

08:00 ─── 1. Activar workers diurnos
 2. Pausar workers nocturnos
```

NOCTURNO: PROCESAMIENTO EN BACKGROUND ======================================== PIPELINE NOCTURNO (orquestado por cron + BullMQ): 20:00 ─── 1. Activar workers nocturnos 2. Pausar workers de chat diurno 3. Iniciar pipeline 20:00-20:15 ─── A. EMBEDDINGS DEL DIA +----> Recorrer daily_summaries del dia sin embedding +----> all-MiniLM-L6-v2 en CPU +----> Insertar en pgvector 20:15-20:30 ─── B. DETECCION DE PATRONES +----> Leer ultimos 14-30 resumenes del paciente +----> Modelo 14-32B: detectar tendencias, patrones +----> Actualizar perfil psicologico (si nudge > umbral) +----> Actualizar campo trends en weekly_summary 20:30-21:00 ─── C. BRIEFING SOAP (si es domingo o fin de mes) +----> Modelo 70B: generar o refrescar informe SOAP +----> Almacenar en tabla soap_reports +----> Embedding del SOAP generado 21:00-21:15 ─── D. GAPS Y ALERTAS +----> Revisar gaps con prioridad alta no preguntados en 3+ dias +----> Evaluar alertas para psicologo +----> Notificaciones push programadas 21:15-23:00 ─── E. TRANSCRIPCIONES WHISPER (pendientes del dia) +----> Procesar cola de audios en GPU secundaria (RTX 3060/4060) +----> Faster-Whisper-Large-v3 en INT8 23:00-06:00 ─── F. PROCESAMIENTO DIFERIDO +----> Limpieza de KV Cache +----> Compactacion de tablas +----> Backups 06:00-08:00 ─── G. PREPARACION DIURNA +----> Preparar resumenes del dia para cada paciente +----> Precargar contextos de pacientes con sesion temprano +----> Ready para el dia 08:00 ─── 1. Activar workers diurnos 2. Pausar workers nocturnos

## 6. DETECCION DE CRISIS

### 6.1 Clasificador NLP en Tiempo Real

Arquitectura de dos capas: reglas + modelo pequeno.

```
CAPA 1: REGLAS (siempre activas, <1ms)
+----> Lista negra de palabras clave con contexto
 - Terminos explicitos: "suicid", "matarme", "autolesion",
 "cortarme", "pastillas", "desaparecer"
 - Se evalua en el mensaje TEXTO PLANO del usuario
 (antes de cualquier procesamiento LLM)
 - Si se detecta: pasar a evaluacion semantica

CAPA 2: CLASIFICADOR SEMANTICO (modelo pequeno, <80ms)
+----> Modelo: BERTiny o DistilBERT fine-tuned en espanol
 (o Qwen-2.5-7B-Instruct con prompt de clasificacion binaria)
+----> Entrada: el mensaje del usuario
+----> Salida: {crisis: bool, tipo: string, confianza: 0-1}
+----> Clases:
 - ideacion_suicida: pensamientos o planes de suicidio
 - autolesion: deseo o acto de autolesionarse
 - brote_psicotico: desconexion de realidad, delirios
 - violencia: deseo de hacer dano a otros
 - panico: ataque de panico en curso
 - abuso: revelacion de abuso en curso
 - ninguna: sin riesgo detectado
```

CAPA 1: REGLAS (siempre activas, <1ms) +----> Lista negra de palabras clave con contexto - Terminos explicitos: "suicid", "matarme", "autolesion", "cortarme", "pastillas", "desaparecer" - Se evalua en el mensaje TEXTO PLANO del usuario (antes de cualquier procesamiento LLM) - Si se detecta: pasar a evaluacion semantica CAPA 2: CLASIFICADOR SEMANTICO (modelo pequeno, <80ms) +----> Modelo: BERTiny o DistilBERT fine-tuned en espanol (o Qwen-2.5-7B-Instruct con prompt de clasificacion binaria) +----> Entrada: el mensaje del usuario +----> Salida: {crisis: bool, tipo: string, confianza: 0-1} +----> Clases: - ideacion_suicida: pensamientos o planes de suicidio - autolesion: deseo o acto de autolesionarse - brote_psicotico: desconexion de realidad, delirios - violencia: deseo de hacer dano a otros - panico: ataque de panico en curso - abuso: revelacion de abuso en curso - ninguna: sin riesgo detectado

```
# crisis_detector.py — Clasificador ligero en tiempo real
from transformers import pipeline
import re

class CrisisDetector:
 def __init__(self):
 # Modelo pequeno para clasificacion (~50MB)
 self.classifier = pipeline(
 "text-classification",
 model="ancora/crisis-detector-es-v1", # fine-tuned DistilBERT
 return_all_scores=True
 )
 # Palabras clave de alta prioridad (kill-switch inmediato)
 self.kill_words = {
 "suicidio", "suicidarme", "suicida", "matarme",
 "quitarme la vida", "autolesion", "cortarme",
 "lastimarme", "no quiero vivir", "acabar con todo",
 "voy a hacerlo", "ya no aguanto mas"
 }

 async def evaluate(self, message: str, session_context: dict) -> dict:
 """
 Evalua un mensaje en tiempo real.
 Retorna dict con nivel de alerta y accion a tomar.
 """
 message_lower = message.lower()

 # CAPA 1: Kill words (ejecutar inmediato)
 for kw in self.kill_words:
 if kw in message_lower:
 return {
 "alerta": "ROJA",
 "tipo": "ideacion_suicida",
 "confianza": 1.0,
 "accion": "kill_switch"
 }

 # CAPA 2: Clasificador semantico
 result = self.classifier(message)
 top = max(result[0], key=lambda x: x['score'])

 if top['label'] != 'ninguna' and top['score'] > 0.7:
 return {
 "alerta": "ROJA" if top['score'] > 0.9 else "AMARILLA",
 "tipo": top['label'],
 "confianza": top['score'],
 "accion": "kill_switch" if top['score'] > 0.9 else "alerta_psicologo"
 }

 # CAPA 3: Evaluacion de tendencia (depresion sostenida)
 if await self._evaluate_depression_trend(session_context):
 return {
 "alerta": "AMARILLA",
 "tipo": "depresion_sostenida",
 "confianza": 0.7,
 "accion": "alerta_psicologo"
 }

 return {
 "alerta": "VERDE",
 "tipo": "ninguna",
 "confianza": 1.0,
 "accion": "ninguna"
 }

 async def _evaluate_depression_trend(self, context):
 """Evalua si hay patron de depresion sostenida."""
 # Logica: si en los ultimos 7 dias la emocion dominante
 # es tristeza con intensidad > 7 y el paciente muestra
 # lenguaje de desesperanza
 return False # Implementar con datos reales
```

# crisis_detector.py — Clasificador ligero en tiempo real from transformers import pipeline import re class CrisisDetector: def __init__(self): # Modelo pequeno para clasificacion (~50MB) self.classifier = pipeline( "text-classification", model="ancora/crisis-detector-es-v1", # fine-tuned DistilBERT return_all_scores=True ) # Palabras clave de alta prioridad (kill-switch inmediato) self.kill_words = { "suicidio", "suicidarme", "suicida", "matarme", "quitarme la vida", "autolesion", "cortarme", "lastimarme", "no quiero vivir", "acabar con todo", "voy a hacerlo", "ya no aguanto mas" } async def evaluate(self, message: str, session_context: dict) -> dict: """ Evalua un mensaje en tiempo real. Retorna dict con nivel de alerta y accion a tomar. """ message_lower = message.lower() # CAPA 1: Kill words (ejecutar inmediato) for kw in self.kill_words: if kw in message_lower: return { "alerta": "ROJA", "tipo": "ideacion_suicida", "confianza": 1.0, "accion": "kill_switch" } # CAPA 2: Clasificador semantico result = self.classifier(message) top = max(result[0], key=lambda x: x['score']) if top['label'] != 'ninguna' and top['score'] > 0.7: return { "alerta": "ROJA" if top['score'] > 0.9 else "AMARILLA", "tipo": top['label'], "confianza": top['score'], "accion": "kill_switch" if top['score'] > 0.9 else "alerta_psicologo" } # CAPA 3: Evaluacion de tendencia (depresion sostenida) if await self._evaluate_depression_trend(session_context): return { "alerta": "AMARILLA", "tipo": "depresion_sostenida", "confianza": 0.7, "accion": "alerta_psicologo" } return { "alerta": "VERDE", "tipo": "ninguna", "confianza": 1.0, "accion": "ninguna" } async def _evaluate_depression_trend(self, context): """Evalua si hay patron de depresion sostenida.""" # Logica: si en los ultimos 7 dias la emocion dominante # es tristeza con intensidad > 7 y el paciente muestra # lenguaje de desesperanza return False # Implementar con datos reales

### 6.2 Kill-Switch

```
// kill_switch.js — Protocolo de emergencia
async function activarKillSwitch(patientId, message, detection) {
 // 1. CONGELAR CHAT INMEDIATAMENTE
 await redis.set(`chat:frozen:${patientId}`, 'true', 'EX', 3600);
 // Bloquear envio de nuevos mensajes
 // Marcar sesion como "en crisis"

 // 2. MOSTRAR INTERFAZ DE EMERGENCIA
 // El frontend detecta el flag frozen=true y renderiza:
 // - Overlay rojo con mensaje de contencion
 // - Numeros de emergencia: 024 (suicidio), 112
 // - Boton "Hablar con alguien ahora" -> conecta con psicologo
 // - Boton de respiracion guiada (contencion inmediata)
 await sendToClient(patientId, {
 type: 'CRISIS_MODE',
 data: {
 mensaje: "Estamos aqui para ayudarte. Estos recursos pueden apoyarte ahora mismo.",
 emergencias: [
 { nombre: "Linea 024 (Suicidio)", numero: "024", descripcion: "Linea de prevencion del suicidio" },
 { nombre: "Emergencias", numero: "112", descripcion: "Emergencias nacionales" },
 { nombre: "Telefono de la Esperanza", numero: "717 003 717", descripcion: "Atencion 24h" }
 ],
 grounding_ejercicio: {
 instruccion: "Respira profundamente 5 segundos...",
 pasos: ["Inhala 4s", "Manten 4s", "Exhala 6s"]
 }
 }
 });

 // 3. ALERTA PRIORITARIA AL PSICOLOGO
 const psicologo = await db.getAssignedTherapist(patientId);
 await Promise.all([
 sendEmail(psicologo.email, {
 subject: `[URGENTE] Alerta de crisis - Paciente ${patientId}`,
 body: `Se ha detectado ${detection.tipo} (confianza: ${detection.confianza})
 Mensaje: "${message}"
 Accion inmediata requerida.`
 }),
 sendSMS(psicologo.telefono, `ANCORA ALERTA: Paciente en crisis.
 ${detection.tipo}. Acceda al panel.`),
 sendPushNotification(psicologo.id, {
 title: 'ALERTA DE CRISIS',
 body: `${detection.tipo} detectado en paciente. Acceda ahora.`,
 priority: 'high',
 data: { patientId, crisisType: detection.tipo }
 })
 ]);

 // 4. REGISTRO EN LOG DE AUDITORIA INMUTABLE
 // Usar append-only log (hash chain o blockchain ligero)
 const logEntry = {
 timestamp: new Date().toISOString(),
 patientId,
 tipo: detection.tipo,
 confianza: detection.confianza,
 mensaje_resumen: message.substring(0, 200),
 acciones_tomadas: ['kill_switch', 'email_psicologo', 'sms_psicologo',
 'push_notification', 'emergency_ui'],
 hash_anterior: await auditLog.getLastHash(),
 hash_actual: null // Se computa al insertar
 };
 logEntry.hash = crypto.createHash('sha256')
 .update(JSON.stringify(logEntry))
 .digest('hex');
 await auditLog.append(logEntry);
}
```

// kill_switch.js — Protocolo de emergencia async function activarKillSwitch(patientId, message, detection) { // 1. CONGELAR CHAT INMEDIATAMENTE await redis.set(`chat:frozen:${patientId}`, 'true', 'EX', 3600); // Bloquear envio de nuevos mensajes // Marcar sesion como "en crisis" // 2. MOSTRAR INTERFAZ DE EMERGENCIA // El frontend detecta el flag frozen=true y renderiza: // - Overlay rojo con mensaje de contencion // - Numeros de emergencia: 024 (suicidio), 112 // - Boton "Hablar con alguien ahora" -> conecta con psicologo // - Boton de respiracion guiada (contencion inmediata) await sendToClient(patientId, { type: 'CRISIS_MODE', data: { mensaje: "Estamos aqui para ayudarte. Estos recursos pueden apoyarte ahora mismo.", emergencias: [ { nombre: "Linea 024 (Suicidio)", numero: "024", descripcion: "Linea de prevencion del suicidio" }, { nombre: "Emergencias", numero: "112", descripcion: "Emergencias nacionales" }, { nombre: "Telefono de la Esperanza", numero: "717 003 717", descripcion: "Atencion 24h" } ], grounding_ejercicio: { instruccion: "Respira profundamente 5 segundos...", pasos: ["Inhala 4s", "Manten 4s", "Exhala 6s"] } } }); // 3. ALERTA PRIORITARIA AL PSICOLOGO const psicologo = await db.getAssignedTherapist(patientId); await Promise.all([ sendEmail(psicologo.email, { subject: `[URGENTE] Alerta de crisis - Paciente ${patientId}`, body: `Se ha detectado ${detection.tipo} (confianza: ${detection.confianza}) Mensaje: "${message}" Accion inmediata requerida.` }), sendSMS(psicologo.telefono, `ANCORA ALERTA: Paciente en crisis. ${detection.tipo}. Acceda al panel.`), sendPushNotification(psicologo.id, { title: 'ALERTA DE CRISIS', body: `${detection.tipo} detectado en paciente. Acceda ahora.`, priority: 'high', data: { patientId, crisisType: detection.tipo } }) ]); // 4. REGISTRO EN LOG DE AUDITORIA INMUTABLE // Usar append-only log (hash chain o blockchain ligero) const logEntry = { timestamp: new Date().toISOString(), patientId, tipo: detection.tipo, confianza: detection.confianza, mensaje_resumen: message.substring(0, 200), acciones_tomadas: ['kill_switch', 'email_psicologo', 'sms_psicologo', 'push_notification', 'emergency_ui'], hash_anterior: await auditLog.getLastHash(), hash_actual: null // Se computa al insertar }; logEntry.hash = crypto.createHash('sha256') .update(JSON.stringify(logEntry)) .digest('hex'); await auditLog.append(logEntry); }

### 6.3 Log de Auditoria Inmutable

Estructura de hash chain para garantizar inmutabilidad:

```
Tabla: audit_log
+------------------+------------------+-----------------------------------+
| Columna | Tipo | Descripcion |
+------------------+------------------+-----------------------------------+
| id | BIGSERIAL | |
| timestamp | TIMESTAMPTZ | |
| patient_id | UUID | |
| event_type | VARCHAR(50) | 'crisis' | 'access' | 'soap_gen' |
| severity | VARCHAR(10) | 'rojo' | 'ambar' | 'verde' |
| payload | JSONB | Datos del evento |
| actor_type | VARCHAR(20) | 'system' | 'therapist' | 'patient' |
| actor_id | UUID | |
| hash_prev | VARCHAR(64) | SHA256 del registro anterior |
| hash_curr | VARCHAR(64) | SHA256 de este registro |
+------------------+------------------+-----------------------------------+

Verificacion de integridad:
 SELECT hash_curr FROM audit_log ORDER BY id DESC LIMIT 1;
 -> Debe coincidir con SHA256(prev_hash_chain + payload)
 Si no coincide -> ALERTA DE SEGURIDAD: log manipulado
```

Tabla: audit_log +------------------+------------------+-----------------------------------+ | Columna | Tipo | Descripcion | +------------------+------------------+-----------------------------------+ | id | BIGSERIAL | | | timestamp | TIMESTAMPTZ | | | patient_id | UUID | | | event_type | VARCHAR(50) | 'crisis' | 'access' | 'soap_gen' | | severity | VARCHAR(10) | 'rojo' | 'ambar' | 'verde' | | payload | JSONB | Datos del evento | | actor_type | VARCHAR(20) | 'system' | 'therapist' | 'patient' | | actor_id | UUID | | | hash_prev | VARCHAR(64) | SHA256 del registro anterior | | hash_curr | VARCHAR(64) | SHA256 de este registro | +------------------+------------------+-----------------------------------+ Verificacion de integridad: SELECT hash_curr FROM audit_log ORDER BY id DESC LIMIT 1; -> Debe coincidir con SHA256(prev_hash_chain + payload) Si no coincide -> ALERTA DE SEGURIDAD: log manipulado

## 7. ESTRATIFICACION DE MODELOS

### 7.1 Distribucion por Capa

```
ESTRATIFICACION DE MODELOS SEGUN CAPA DE PROCESAMIENTO
========================================================

CAPA 0: CLASIFICADOR + REGLAS (siempre local, CPU)
┌──────────────────────────────────────────────────────────────┐
│ Modelo: DistilBERT / BERTiny (fine-tuned crisis detection) │
│ Parametros: ~67M │
│ Cuantizacion: INT8 │
│ VRAM: ~50MB (CPU: 0MB, RAM: ~150MB) │
│ Velocidad: <5ms por clasificacion │
│ Tarea: deteccion de crisis en tiempo real │
│ Consumo: despreciable │
└──────────────────────────────────────────────────────────────┘

CAPA 1: CHAT DIARIO INTERACTIVO (GPU, ~110 t/s)
┌──────────────────────────────────────────────────────────────┐
│ Modelo: GLM-4-9B / Qwen-2.5-7B-Instruct │
│ Parametros: 7B-14B │
│ Cuantizacion: FP16 (nativa) o AWQ 4-bit │
│ VRAM: ~9-12 GB │
│ Velocidad: 80-110 t/s │
│ Tarea: conversacion diaria guiada, check-ins, extraccion │
│ Nota: PEQUEÑO Y RAPIDO para el 85% de interacciones │
│ El paciente NO necesita CoT de 70B para el dia a dia │
└──────────────────────────────────────────────────────────────┘

CAPA 2: RESUMENES SEMANALES (GPU, ~45 t/s)
┌──────────────────────────────────────────────────────────────┐
│ Modelo: Gemma-2-27B / Llama-3-8B-Instruct (para resumenes) │
│ Parametros: 8B-32B │
│ Cuantizacion: FP8 o AWQ 4-bit │
│ VRAM: ~15-28 GB │
│ Velocidad: 30-70 t/s │
│ Tarea: consolidacion de resumenes semanales, deteccion de │
│ patrones, actualizacion de perfil psicologico │
│ Nota: se ejecuta en BATCH NOCTURNO, no en tiempo real │
└──────────────────────────────────────────────────────────────┘

CAPA 3: BRIEFINGS CLINICOS SOAP (GPU, ~25 t/s)
┌──────────────────────────────────────────────────────────────┐
│ Modelo: DeepSeek-R1-Distill-Llama-70B / Qwen-72B │
│ Parametros: 70B │
│ Cuantizacion: AWQ 4-bit / EXL2 4.0 bpw │
│ VRAM: ~35 GB (+ KV Cache ~2 GB) │
│ Velocidad: 25-60 t/s │
│ Tarea: generacion de informes SOAP estructurados, │
│ analisis clinico profundo, deteccion de patrones │
│ complejos, briefings para el psicologo │
│ Nota: SOLO para el briefing semanal/mensual. NO para chat │
└──────────────────────────────────────────────────────────────┘

CAPA 4: EMBEDDINGS (CPU, batch nocturno)
┌──────────────────────────────────────────────────────────────┐
│ Modelo: all-MiniLM-L6-v2 / paraphrase-multilingual-MiniLM │
│ Parametros: ~22M │
│ Dimension: 384 │
│ VRAM: 0MB (se ejecuta en CPU) │
│ Velocidad: ~10K docs/segundo en CPU (20 nucleos) │
│ Tarea: embedding de chunks para RAG │
│ Consumo: ~500MB RAM │
└──────────────────────────────────────────────────────────────┘
```

ESTRATIFICACION DE MODELOS SEGUN CAPA DE PROCESAMIENTO ======================================================== CAPA 0: CLASIFICADOR + REGLAS (siempre local, CPU) ┌──────────────────────────────────────────────────────────────┐ │ Modelo: DistilBERT / BERTiny (fine-tuned crisis detection) │ │ Parametros: ~67M │ │ Cuantizacion: INT8 │ │ VRAM: ~50MB (CPU: 0MB, RAM: ~150MB) │ │ Velocidad: <5ms por clasificacion │ │ Tarea: deteccion de crisis en tiempo real │ │ Consumo: despreciable │ └──────────────────────────────────────────────────────────────┘ CAPA 1: CHAT DIARIO INTERACTIVO (GPU, ~110 t/s) ┌──────────────────────────────────────────────────────────────┐ │ Modelo: GLM-4-9B / Qwen-2.5-7B-Instruct │ │ Parametros: 7B-14B │ │ Cuantizacion: FP16 (nativa) o AWQ 4-bit │ │ VRAM: ~9-12 GB │ │ Velocidad: 80-110 t/s │ │ Tarea: conversacion diaria guiada, check-ins, extraccion │ │ Nota: PEQUEÑO Y RAPIDO para el 85% de interacciones │ │ El paciente NO necesita CoT de 70B para el dia a dia │ └──────────────────────────────────────────────────────────────┘ CAPA 2: RESUMENES SEMANALES (GPU, ~45 t/s) ┌──────────────────────────────────────────────────────────────┐ │ Modelo: Gemma-2-27B / Llama-3-8B-Instruct (para resumenes) │ │ Parametros: 8B-32B │ │ Cuantizacion: FP8 o AWQ 4-bit │ │ VRAM: ~15-28 GB │ │ Velocidad: 30-70 t/s │ │ Tarea: consolidacion de resumenes semanales, deteccion de │ │ patrones, actualizacion de perfil psicologico │ │ Nota: se ejecuta en BATCH NOCTURNO, no en tiempo real │ └──────────────────────────────────────────────────────────────┘ CAPA 3: BRIEFINGS CLINICOS SOAP (GPU, ~25 t/s) ┌──────────────────────────────────────────────────────────────┐ │ Modelo: DeepSeek-R1-Distill-Llama-70B / Qwen-72B │ │ Parametros: 70B │ │ Cuantizacion: AWQ 4-bit / EXL2 4.0 bpw │ │ VRAM: ~35 GB (+ KV Cache ~2 GB) │ │ Velocidad: 25-60 t/s │ │ Tarea: generacion de informes SOAP estructurados, │ │ analisis clinico profundo, deteccion de patrones │ │ complejos, briefings para el psicologo │ │ Nota: SOLO para el briefing semanal/mensual. NO para chat │ └──────────────────────────────────────────────────────────────┘ CAPA 4: EMBEDDINGS (CPU, batch nocturno) ┌──────────────────────────────────────────────────────────────┐ │ Modelo: all-MiniLM-L6-v2 / paraphrase-multilingual-MiniLM │ │ Parametros: ~22M │ │ Dimension: 384 │ │ VRAM: 0MB (se ejecuta en CPU) │ │ Velocidad: ~10K docs/segundo en CPU (20 nucleos) │ │ Tarea: embedding de chunks para RAG │ │ Consumo: ~500MB RAM │ └──────────────────────────────────────────────────────────────┘

### 7.2 Logica de Enrutamiento

```
# model_router.py — Enrutamiento inteligente de requests a modelos
from enum import Enum

class ModelTier(Enum):
 CRISIS = "crisis" # Clasificador, siempre disponible
 CHAT = "chat" # 8-14B, chat diario
 ANALYSIS = "analysis" # 14-32B, analisis nocturno
 CLINICAL = "clinical" # 70B, briefings SOAP

class ModelRouter:
 def __init__(self):
 self.tiers = {
 ModelTier.CRISIS: {"model": "crisis-detector", "max_concurrent": 100},
 ModelTier.CHAT: {"model": "glm-4-9b", "max_concurrent": 270},
 ModelTier.ANALYSIS: {"model": "gemma-2-27b", "max_concurrent": 8},
 ModelTier.CLINICAL: {"model": "deepseek-r1-70b", "max_concurrent": 4},
 }

 def determine_tier(self, request_type: str, is_night: bool) -> ModelTier:
 """
 Determina que modelo debe procesar una request segun:
 - Tipo de tarea
 - Hora del dia (night batch vs real-time)
 """
 # Mapa de tareas a tier
 task_map = {
 "chat_message": ModelTier.CHAT,
 "crisis_eval": ModelTier.CRISIS,
 "daily_summary": ModelTier.CHAT,
 "weekly_summary": ModelTier.ANALYSIS,
 "soap_generation": ModelTier.CLINICAL,
 "pattern_detection": ModelTier.ANALYSIS,
 "memory_nudge": ModelTier.ANALYSIS,
 "embedding": ModelTier.CRISIS, # Se ejecuta en CPU, no GPU
 }

 tier = task_map.get(request_type, ModelTier.CHAT)

 # Validar disponibilidad segun hora
 if not is_night and tier in [ModelTier.ANALYSIS, ModelTier.CLINICAL]:
 # Durante el dia, reenviar tareas pesadas a la cola nocturna
 return None # Marcar para cola nocturna

 return tier
```

# model_router.py — Enrutamiento inteligente de requests a modelos from enum import Enum class ModelTier(Enum): CRISIS = "crisis" # Clasificador, siempre disponible CHAT = "chat" # 8-14B, chat diario ANALYSIS = "analysis" # 14-32B, analisis nocturno CLINICAL = "clinical" # 70B, briefings SOAP class ModelRouter: def __init__(self): self.tiers = { ModelTier.CRISIS: {"model": "crisis-detector", "max_concurrent": 100}, ModelTier.CHAT: {"model": "glm-4-9b", "max_concurrent": 270}, ModelTier.ANALYSIS: {"model": "gemma-2-27b", "max_concurrent": 8}, ModelTier.CLINICAL: {"model": "deepseek-r1-70b", "max_concurrent": 4}, } def determine_tier(self, request_type: str, is_night: bool) -> ModelTier: """ Determina que modelo debe procesar una request segun: - Tipo de tarea - Hora del dia (night batch vs real-time) """ # Mapa de tareas a tier task_map = { "chat_message": ModelTier.CHAT, "crisis_eval": ModelTier.CRISIS, "daily_summary": ModelTier.CHAT, "weekly_summary": ModelTier.ANALYSIS, "soap_generation": ModelTier.CLINICAL, "pattern_detection": ModelTier.ANALYSIS, "memory_nudge": ModelTier.ANALYSIS, "embedding": ModelTier.CRISIS, # Se ejecuta en CPU, no GPU } tier = task_map.get(request_type, ModelTier.CHAT) # Validar disponibilidad segun hora if not is_night and tier in [ModelTier.ANALYSIS, ModelTier.CLINICAL]: # Durante el dia, reenviar tareas pesadas a la cola nocturna return None # Marcar para cola nocturna return tier

### 7.3 Matriz de Decision

```
CUANDO USAR CADA MODELO
========================

| Escenario | Modelo | Tiempo | Por que no mas grande |
|--------------------------------|---------------|------------|-----------------------|
| "Hola, ?como estas hoy?" | 8-14B | < 1s | 70B no aporta valor |
| | | | extra para saludo |
| "Hoy tuve un dia horrible..." | 8-14B | < 2s | La empatia no |
| | | | requiere 70B |
| Detectar ideacion suicida | Clasificador | < 5ms | Latencia critica, |
| | + reglas | | modelo grande es lento|
| Resumir la sesion de hoy | 8-14B | < 1s | Suficiente para |
| | | | ~500 tokens de resumen|
| Consolidar 7 resumenes | 14-32B | batch | Necesita razonar |
| de la semana | | nocturno | sobre patrones |
| Generar informe SOAP | 70B | batch | Maxima calidad para |
| para el psicologo | | nocturno | el clinico humano |
| Actualizar perfil psicologico | 14-32B | batch | Requiere analisis |
| | | nocturno | multidimensional |
| Embedding diario para RAG | MiniLM (CPU) | batch | CPU suficiente, |
| | | nocturno | no desperdiciar VRAM |
| Reranking de retrieval | Cross-Encoder | < 50ms | CPU, modelo pequeno |
| | (CPU) | | |

COSTE ESTIMADO POR TAREA (en funcion de tokens generados):

| Tarea | Tokens In | Tokens Out | Modelo | Coste GPU* |
|-------------------|------------|------------|-------------|-------------|
| Chat mensaje | ~2,000 | ~200 | 8-14B | 0.0003 € |
| Resumen diario | ~3,000 | ~500 | 8-14B | 0.0005 € |
| Resumen semanal | ~4,000 | ~1,000 | 14-32B | 0.002 € |
| Briefing SOAP | ~6,000 | ~2,000 | 70B | 0.015 € |
| Embedding chunk | 512 | 384-dim | MiniLM (CPU)| 0.00001 € |
| Clasificacion | ~200 | binaria | DistilBERT | < 0.00001 € |

* Coste redondeado incluyendo electricidad + amortizacion de hardware
 a 3 anos. CLARAMENTE RENTABLE con planes desde 30-40 €/mes.
```

CUANDO USAR CADA MODELO ======================== | Escenario | Modelo | Tiempo | Por que no mas grande | |--------------------------------|---------------|------------|-----------------------| | "Hola, ?como estas hoy?" | 8-14B | < 1s | 70B no aporta valor | | | | | extra para saludo | | "Hoy tuve un dia horrible..." | 8-14B | < 2s | La empatia no | | | | | requiere 70B | | Detectar ideacion suicida | Clasificador | < 5ms | Latencia critica, | | | + reglas | | modelo grande es lento| | Resumir la sesion de hoy | 8-14B | < 1s | Suficiente para | | | | | ~500 tokens de resumen| | Consolidar 7 resumenes | 14-32B | batch | Necesita razonar | | de la semana | | nocturno | sobre patrones | | Generar informe SOAP | 70B | batch | Maxima calidad para | | para el psicologo | | nocturno | el clinico humano | | Actualizar perfil psicologico | 14-32B | batch | Requiere analisis | | | | nocturno | multidimensional | | Embedding diario para RAG | MiniLM (CPU) | batch | CPU suficiente, | | | | nocturno | no desperdiciar VRAM | | Reranking de retrieval | Cross-Encoder | < 50ms | CPU, modelo pequeno | | | (CPU) | | | COSTE ESTIMADO POR TAREA (en funcion de tokens generados): | Tarea | Tokens In | Tokens Out | Modelo | Coste GPU* | |-------------------|------------|------------|-------------|-------------| | Chat mensaje | ~2,000 | ~200 | 8-14B | 0.0003 € | | Resumen diario | ~3,000 | ~500 | 8-14B | 0.0005 € | | Resumen semanal | ~4,000 | ~1,000 | 14-32B | 0.002 € | | Briefing SOAP | ~6,000 | ~2,000 | 70B | 0.015 € | | Embedding chunk | 512 | 384-dim | MiniLM (CPU)| 0.00001 € | | Clasificacion | ~200 | binaria | DistilBERT | < 0.00001 € | * Coste redondeado incluyendo electricidad + amortizacion de hardware a 3 anos. CLARAMENTE RENTABLE con planes desde 30-40 €/mes.

### 7.4 Ejemplo de Flujo Completo con Enrutamiento

```
EJEMPLO: UN DIA EN LA VIDA DEL SISTEMA
=========================================

09:00 - PACIENTE abre el chat
 └─> Frontend envia request POST /api/chat
 └─> Backend: model_router.determine_tier("chat_message")
 └─> Es de dia -> ModelTier.CHAT -> GLM-4-9B
 └─> Se construye prompt con:
 - System prompt (600t)
 - Perfil comprimido (400t)
 - Resumen de ayer (300t)
 - Top 5 chunks RAG (1,200t)
 - Conversacion actual (1,500t)
 Total: ~4,000 tokens
 └─> GLM-4-9B genera respuesta empatica (~200 tokens, ~2ms)

09:00 (paralelo) - CLASIFICADOR DE RIESGO
 └─> El mensaje del paciente se pasa por CrisisDetector
 └─> Salida: {alerta: "VERDE", tipo: "ninguna"}
 └─> No se toma accion adicional

09:02 - Fin de sesion (15 min)
 └─> BACKEND ejecuta prompt de resumen en GLM-4-9B
 └─> Almacena daily_summary en PostgreSQL
 └─> Marca para embedding nocturno

--- MAS TARDE ---

20:00 - INICIO BATCH NOCTURNO
 └─> 1. Embeddings: all-MiniLM-L6-v2 en CPU
 Procesa todos los daily_summaries del dia
 500 pacientes * 1 chunk = 500 docs -> ~50ms
 └─> 2. Deteccion de patrones: Gemma-2-27B
 Este paciente: ultimos 14 dias
 Detecta: "ansiedad alta los domingos por la noche"
 Actualiza perfil psicologico
 └─> 3. Briefing SOAP: solo si toca esta semana
 Para este paciente no toca -> skip
 └─> 4. Gaps: revisar gaps del perfil
 Gap "relacion con padre" -> 3 dias sin preguntar
 Prioridad alta -> marcar para preguntar manana
 └─> 5. Notificaciones: agenda alertas para manana

--- FIN DEL CICLO ---
```

EJEMPLO: UN DIA EN LA VIDA DEL SISTEMA ========================================= 09:00 - PACIENTE abre el chat └─> Frontend envia request POST /api/chat └─> Backend: model_router.determine_tier("chat_message") └─> Es de dia -> ModelTier.CHAT -> GLM-4-9B └─> Se construye prompt con: - System prompt (600t) - Perfil comprimido (400t) - Resumen de ayer (300t) - Top 5 chunks RAG (1,200t) - Conversacion actual (1,500t) Total: ~4,000 tokens └─> GLM-4-9B genera respuesta empatica (~200 tokens, ~2ms) 09:00 (paralelo) - CLASIFICADOR DE RIESGO └─> El mensaje del paciente se pasa por CrisisDetector └─> Salida: {alerta: "VERDE", tipo: "ninguna"} └─> No se toma accion adicional 09:02 - Fin de sesion (15 min) └─> BACKEND ejecuta prompt de resumen en GLM-4-9B └─> Almacena daily_summary en PostgreSQL └─> Marca para embedding nocturno --- MAS TARDE --- 20:00 - INICIO BATCH NOCTURNO └─> 1. Embeddings: all-MiniLM-L6-v2 en CPU Procesa todos los daily_summaries del dia 500 pacientes * 1 chunk = 500 docs -> ~50ms └─> 2. Deteccion de patrones: Gemma-2-27B Este paciente: ultimos 14 dias Detecta: "ansiedad alta los domingos por la noche" Actualiza perfil psicologico └─> 3. Briefing SOAP: solo si toca esta semana Para este paciente no toca -> skip └─> 4. Gaps: revisar gaps del perfil Gap "relacion con padre" -> 3 dias sin preguntar Prioridad alta -> marcar para preguntar manana └─> 5. Notificaciones: agenda alertas para manana --- FIN DEL CICLO ---

## RESUMEN DE ARQUITECTURA

```
+-----------+
 | PACIENTE |
 +-----+-----+
 |
 +-----v-----+ +------------------+
 | FRONTEND | | PSICOLOGO DASH |
 | (React/PWA)| | (React/PWA) |
 +-----+------+ +--------+---------+
 | |
 +-----v-----------------------v---------+
 | API GATEWAY (Nginx + Node) |
 +-----+-----------------------+---------+
 | |
 +-----v-----+ +------v--------+
 | REDIS | | PostgreSQL |
 | (colas) | | + pgvector |
 +-----------+ +-------+--------+
 | |
 +-----v------------------------v--------+
 | vLLM (GPU Cluster) |
 | +--------+ +--------+ +--------+ |
 | | Crisis | | 8-14B | | 70B | |
 | | Detector| | (Chat) | | (SOAP) | |
 | | (CPU) | | (GPU) | | (GPU) | |
 | +--------+ +--------+ +--------+ |
 | |
 | +--------+ +-----------+ |
 | | 14-32B | | Whisper | |
 | |(Analisis| | (GPU sec) | |
 | | Nocturno| |(Audio) | |
 | +--------+ +-----------+ |
 +---------------------------------------+
 |
 +-----v-----+
 | MiniLM |
 | (embeddings|
 | CPU) |
 +-----------+
```

+-----------+ | PACIENTE | +-----+-----+ | +-----v-----+ +------------------+ | FRONTEND | | PSICOLOGO DASH | | (React/PWA)| | (React/PWA) | +-----+------+ +--------+---------+ | | +-----v-----------------------v---------+ | API GATEWAY (Nginx + Node) | +-----+-----------------------+---------+ | | +-----v-----+ +------v--------+ | REDIS | | PostgreSQL | | (colas) | | + pgvector | +-----------+ +-------+--------+ | | +-----v------------------------v--------+ | vLLM (GPU Cluster) | | +--------+ +--------+ +--------+ | | | Crisis | | 8-14B | | 70B | | | | Detector| | (Chat) | | (SOAP) | | | | (CPU) | | (GPU) | | (GPU) | | | +--------+ +--------+ +--------+ | | | | +--------+ +-----------+ | | | 14-32B | | Whisper | | | |(Analisis| | (GPU sec) | | | | Nocturno| |(Audio) | | | +--------+ +-----------+ | +---------------------------------------+ | +-----v-----+ | MiniLM | | (embeddings| | CPU) | +-----------+

Documento generado como parte de la investigacion tecnica de Ancora (ancora.clinic). Arquitectura para chatbot con memoria persistente, evolucion clinica y estratificacion de modelos locales en servidor privado.

## 6. Viabilidad Técnica y Arquitectura de Software

### Topología y Backend Híbrido

La plataforma se diseña bajo un desacoplamiento de servicios:

- Frontend: React.js con Vite, SPA (Single Page Application) empaquetada con TailwindCSS, optimizada para rapidez y rendimiento en dispositivos móviles.

- Backend de Negocio: Node.js con Express, encargado de la gestión de roles, facturación, citas y autenticación de usuarios.

- Motor de IA e Inferencia: FastAPI (Python), interactuando con vLLM y el almacén vectorial para gestionar la cola de prioridades de generación y prompts.

### Diseño de Colas de Prioridad de Cómputo

Dado que los recursos de GPU propios son finitos, las llamadas del chat de los usuarios se organizan mediante **Redis y BullMQ**:

- Prioridad Alta (Tiempo Real): Chats de usuarios activos. Si la GPU está saturada, se activa un protocolo de WebSockets que muestra al usuario un indicador visual de "IA procesando" sin colgar la petición.

- Prioridad Baja (Asíncrona): Generación nocturna de briefings SOAP e informes de progreso del panel del terapeuta, programados en franjas de carga cero (02:00 a 06:00 AM).

#### Videollamada RTC con Encriptación Extrema

Las sesiones síncronas se despliegan utilizando una arquitectura WebRTC híbrida (P2P para sesiones individuales y SFU vía LiveKit ). Se implementan WebRTC Insertable Streams con cifrado asimétrico **SFrame (AES-GCM-256)** del lado del cliente, garantizando que el audio y video de la sesión estén cifrados de extremo a extremo e imposibilitando su descifrado en el servidor.

### Arquitectura de Chat Híbrido Cifrado (Planes Duo y Familiar)

Para dar soporte a los planes Duo (parejas) y Familiar, la plataforma implementa una infraestructura de mensajería híbrida donde coexisten chats clínicos personales (estrictamente privados) y chats grupales comunes (mediados por la IA sistémica), todo bajo un modelo criptográfico Zero-Knowledge .

#### 1. Cifrado Zero-Knowledge E2EE (WebCrypto API)

- Chat Personal: Cada mensaje individual se cifra localmente en el navegador con una clave de sesión simétrica AES-GCM de 256 bits . Esta clave se cifra para el destinatario (el nodo de IA clínica local) mediante RSA-OAEP de 4096 bits .

- Chat Grupal: El creador genera localmente una clave de grupo simétrica ($K_G$, AES-GCM 256). Recupera del servidor las claves públicas de identidad de los participantes aprobados (familiares y la IA mediadora) y cifra $K_G$ individualmente para cada uno. Los bloques cifrados se guardan en la tabla claves_grupo_usuario . El servidor de base de datos PostgreSQL almacena ciegamente perfiles y mensajes en campos binarios BYTEA cifrados.

`claves_grupo_usuario`

`BYTEA`

#### 2. Procesamiento de IA en RAM Volátil (vLLM)

- Cero Persistencia: El servidor de control API descifra los mensajes grupales en memoria RAM volátil para formar el prompt clínico del motor local vLLM. Una vez generada la respuesta (cifrada con $K_G$), los buffers de texto plano se sobrescriben explícitamente con ceros ( Memory Zeroing ) en la RAM.

- Inmunidad ante disco: Se configuran las flags mlock y mlockall del kernel Linux para evitar que la memoria física que contiene texto clínico en claro sea escrita en el swap en disco. vLLM se arranca con --disable-log-requests y --disable-log-stats , y Nginx excluye los cuerpos de petición de los logs.

`mlock`

`mlockall`

`--disable-log-requests`

`--disable-log-stats`

#### 3. Flujo Clínico Aislado del Terapeuta

El terapeuta **no es miembro** del chat de la familia ni de los chats individuales y no posee acceso a las claves simétricas o privadas correspondientes. La IA mediadora (que sí cuenta con acceso a la clave $K_G$ cifrada para ella) ejecuta un pipeline de agregación sistémica en memoria, extrae métricas cuantitativas abstractas (cohesión, polaridad de comunicación, turnos y temas recurrentes) y las cifra utilizando la **clave pública del Terapeuta**. El psicólogo visualiza el análisis en la pestaña "Dinámica Relacional" sin violar el secreto individual.

#### 4. Salvaguardas en la UI (UX Safeguards)

Las claves descifradas se almacenan únicamente de forma efímera en el sessionStorage o en variables del estado de la aplicación. Se desactiva la copia al portapapeles en los globos del chat individual para evitar fugas accidentales hacia el chat familiar común. En aplicaciones móviles nativas (Capacitor), se activa la flag FLAG_SECURE del sistema operativo para bloquear capturas de pantalla de chats clínicos.

`sessionStorage`

`FLAG_SECURE`

#### Código Técnico de Referencia (Cifrado de Clave de Grupo en Cliente)

```
// 1. Generación local de la clave simétrica de grupo (AES-GCM 256 bits) 
async function generateGroupKey() {
 return await window.crypto.subtle.generateKey(
 { name: "AES-GCM", length: 256 },
 true, // Extraíble
 ["encrypt", "decrypt"]
 );
}

 // 2. Cifrar la clave de grupo con la clave pública RSA-OAEP de un miembro 
async function encryptGroupKeyForMember(groupKey, memberPublicKeyPEM) {
 const rawKey = await window.crypto.subtle.exportKey("raw", groupKey);
 const publicKey = await importPublicKeyFromPEM(memberPublicKeyPEM);
 const encryptedRawKey = await window.crypto.subtle.encrypt(
 { name: "RSA-OAEP" },
 publicKey,
 rawKey
 );
 return new Uint8Array(encryptedRawKey);
}
```

# T1 — ARQUITECTURA GLOBAL MULTI-PSICÓLOGO PARA ANCORA (ancora.clinic)

Versión: 1.0

Fecha: 2026-05-31

Propósito: Documento técnico de arquitectura para plataforma multi-tenant de telepsicología híbrida con IA local en GPU propia + psicólogos humanos en el loop.

Base: Informes previos en anchora1.0.md , informe ancora2.0.md , evolucion tecnica_ancora.md .

`anchora1.0.md`

`informe ancora2.0.md`

`evolucion tecnica_ancora.md`

## ÍNDICE

- MODELO MULTI-TENANT

- IMPORTACIÓN DE PACIENTES

- CANALIZACIÓN DE LEADS

- VISTAS POR ROL

- ARQUITECTURA BACKEND ESCALABLE

- IA MULTI-TENANT

## 1. MODELO MULTI-TENANT

### 1.1 Comparativa de Estrategias de Aislamiento

Tabla comparativa detallada:

```
+----------------------------------+-------------------+---------------------+-------------------+
| Aspecto | Schema-per-Tenant | RLS (1 schema) | DB Separada |
+----------------------------------+-------------------+---------------------+-------------------+
| Aislamiento físico | NO | NO | SI |
| Aislamiento lógico | FUERTE | CONFIANZA EN RLS | TOTAL |
| Migraciones | N por tenant | 1 global | N por tenant |
| Backup/Restore por tenant | Schema-level | Fila-level (complejo)| DB-level (simple) |
| Latencia cross-tenant queries | NO (imposible) | SI (filtrada) | NO (imposible) |
| Pool de conexiones eficiente | SI (1 pool) | SI (1 pool) | NO (N pools) |
| Coste infra para 100 tenants | ~1 servidor | ~1 servidor | ~10 servidores |
| Cifrado Zero-Knowledge | Compatible | Compatible | Compatible |
+----------------------------------+-------------------+---------------------+-------------------+
```

+----------------------------------+-------------------+---------------------+-------------------+ | Aspecto | Schema-per-Tenant | RLS (1 schema) | DB Separada | +----------------------------------+-------------------+---------------------+-------------------+ | Aislamiento físico | NO | NO | SI | | Aislamiento lógico | FUERTE | CONFIANZA EN RLS | TOTAL | | Migraciones | N por tenant | 1 global | N por tenant | | Backup/Restore por tenant | Schema-level | Fila-level (complejo)| DB-level (simple) | | Latencia cross-tenant queries | NO (imposible) | SI (filtrada) | NO (imposible) | | Pool de conexiones eficiente | SI (1 pool) | SI (1 pool) | NO (N pools) | | Coste infra para 100 tenants | ~1 servidor | ~1 servidor | ~10 servidores | | Cifrado Zero-Knowledge | Compatible | Compatible | Compatible | +----------------------------------+-------------------+---------------------+-------------------+

### 1.2 Recomendación para Ancora: Híbrido Schema-per-Tenant + RLS + ZK

Para Ancora, la arquitectura óptima es híbrida :

Capa 1: Schema-per-tenant para datos clínicos sensibles.

Cada psicólogo (tenant) tiene su propio esquema PostgreSQL: tenant_<uuid> . Dentro de cada esquema:

`tenant_<uuid>`

- pacientes , sesiones , notas soap , diarios , mensajes chat

`pacientes`

`sesiones`

`notas soap`

`diarios`

`mensajes chat`

- Cada tabla tiene tenant_id como columna (redundancia de seguridad).

`tenant_id`

Capa 2: RLS como defensa en profundidad.

Políticas RLS activadas en cada tabla que verifican current setting('app.tenant id') = tenant_id . Esto asegura que incluso en errores de código, una consulta no pueda filtrar datos entre tenants.

`current setting('app.tenant id') = tenant_id`

```
-- Política RLS genérica para tablas clínicas
CREATE POLICY tenant_isolation ON pacientes
 USING (tenant_id = current_setting('app.tenant_id')::UUID);
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;

-- La sesión de BD se configura así en cada request
SET app.tenant_id = '550e8400-e29b-41d4-a716-446655440000';
```

-- Política RLS genérica para tablas clínicas CREATE POLICY tenant_isolation ON pacientes USING (tenant_id = current_setting('app.tenant_id')::UUID); ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY; -- La sesión de BD se configura así en cada request SET app.tenant_id = '550e8400-e29b-41d4-a716-446655440000';

Capa 3: Schema compartido para datos no sensibles.

Un schema public compartido contiene:

`public`

- usuarios global (login, roles, tenant id)

`usuarios global`

- psicologos_publicos (directorio, perfil público)

`psicologos_publicos`

- facturacion (pagos, Stripe Connect)

`facturacion`

### 1.3 Cifrado Zero-Knowledge (ZK) Multi-Tenant

Cada tenant tiene un Key Encryption Key (KEK) propio, cifrado con una clave maestra del sistema (HSM). El flujo:

```
[Cliente] [Servidor PostgreSQL]
 | |
 |-- Login con password ------------------>|
 | |-- Deriva KEK con Argon2id
 |<-- Nonce + salt ------------------------|
 | |
 |-- (Cliente) Deriva Data Key (DK) |
 | DK = HKDF(KEK, tenant_salt) |
 | |
 |-- Cifra mensaje con AES-256-GCM + DK -->| Almacena BYTEA cifrado
 | | (no puede descifrar)
 |<-- BYTEA cifrado -----------------------|
```

[Cliente] [Servidor PostgreSQL] | | |-- Login con password ------------------>| | |-- Deriva KEK con Argon2id |<-- Nonce + salt ------------------------| | | |-- (Cliente) Deriva Data Key (DK) | | DK = HKDF(KEK, tenant_salt) | | | |-- Cifra mensaje con AES-256-GCM + DK -->| Almacena BYTEA cifrado | | (no puede descifrar) |<-- BYTEA cifrado -----------------------|

Claves por tenant almacenadas en tabla separada:

```
CREATE TABLE tenant_keys (
 tenant_id UUID PRIMARY KEY,
 kek_encrypted BYTEA NOT NULL, -- KEK cifrado con clave maestra HSM
 kek_salt BYTEA NOT NULL,
 kek_kdf_params JSONB, -- Argon2id params (memoria, iteraciones)
 rotation_version INT DEFAULT 1,
 created_at TIMESTAMPTZ DEFAULT NOW(),
 rotated_at TIMESTAMPTZ
);
```

CREATE TABLE tenant_keys ( tenant_id UUID PRIMARY KEY, kek_encrypted BYTEA NOT NULL, -- KEK cifrado con clave maestra HSM kek_salt BYTEA NOT NULL, kek_kdf_params JSONB, -- Argon2id params (memoria, iteraciones) rotation_version INT DEFAULT 1, created_at TIMESTAMPTZ DEFAULT NOW(), rotated_at TIMESTAMPTZ );

La clave maestra del sistema vive en un HSM (Azure Key Vault o HashiCorp Vault). Rotación automática cada 90 días con re-cifrado de KEKs.

### 1.4 Matriz de Aislamiento por Tipo de Dato

## 2. IMPORTACIÓN DE PACIENTES

### 2.1 Flujo General de Incorporación de Pacientes

```
┌─────────────────────────────────────┐
 │ PSICÓLOGO EN PANEL ANCORA │
 │ (ya verificó credenciales + KYC) │
 └──────────┬──────────────────────────┘
 │
 ┌────────────────┼────────────────────┐
 ▼ ▼ ▼
 ┌────────────┐ ┌──────────────┐ ┌──────────────────┐
 │ Invitación │ │ Código QR │ │ CSV/Excel masivo │
 │ Email/SMS │ │ (presencial) │ │ (lote pacientes) │
 └──────┬─────┘ └──────┬───────┘ └────────┬─────────┘
 │ │ │
 ▼ ▼ ▼
 ┌──────────────────────────────────────────────────────┐
 │ TOKEN DE INVITACIÓN (JWT cifrado) │
 │ payload: tenant_id, paciente_id, exp │
 │ cifrado con KEK del tenant │
 └──────────────────────┬───────────────────────────────┘
 │
 ▼
 ┌────────────────────────┐
 │ PACIENTE ACEPTA │
 │ - Verifica identidad │
 │ - Crea KEK personal │
 │ - Firma consentimiento │
 │ - Onboarding guiado │
 └────────────────────────┘
```

┌─────────────────────────────────────┐ │ PSICÓLOGO EN PANEL ANCORA │ │ (ya verificó credenciales + KYC) │ └──────────┬──────────────────────────┘ │ ┌────────────────┼────────────────────┐ ▼ ▼ ▼ ┌────────────┐ ┌──────────────┐ ┌──────────────────┐ │ Invitación │ │ Código QR │ │ CSV/Excel masivo │ │ Email/SMS │ │ (presencial) │ │ (lote pacientes) │ └──────┬─────┘ └──────┬───────┘ └────────┬─────────┘ │ │ │ ▼ ▼ ▼ ┌──────────────────────────────────────────────────────┐ │ TOKEN DE INVITACIÓN (JWT cifrado) │ │ payload: tenant_id, paciente_id, exp │ │ cifrado con KEK del tenant │ └──────────────────────┬───────────────────────────────┘ │ ▼ ┌────────────────────────┐ │ PACIENTE ACEPTA │ │ - Verifica identidad │ │ - Crea KEK personal │ │ - Firma consentimiento │ │ - Onboarding guiado │ └────────────────────────┘

### 2.2 Invitación por Email/SMS con Enlace Mágico

Token de invitación (backend):

```
// Generación del token mágico
const jwt = require('jsonwebtoken');

function generateMagicLink(tenantId, patientEmail) {
 const payload = {
 type: 'patient_invite',
 tenant_id: tenantId,
 email: patientEmail,
 nonce: crypto.randomBytes(16).toString('hex'),
 iat: Math.floor(Date.now() / 1000),
 exp: Math.floor(Date.now() / 1000) + (7 * 24 * 3600) // 7 días
 };

 // Ciframos el payload con la KEK del tenant
 const encryptedToken = encryptWithTenantKEK(
 JSON.stringify(payload),
 tenantId
 );

 return Buffer.from(encryptedToken).toString('base64url');
}
```

// Generación del token mágico const jwt = require('jsonwebtoken'); function generateMagicLink(tenantId, patientEmail) { const payload = { type: 'patient_invite', tenant_id: tenantId, email: patientEmail, nonce: crypto.randomBytes(16).toString('hex'), iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + (7 * 24 * 3600) // 7 días }; // Ciframos el payload con la KEK del tenant const encryptedToken = encryptWithTenantKEK( JSON.stringify(payload), tenantId ); return Buffer.from(encryptedToken).toString('base64url'); }

Email template:

```
Asunto: [Psicólogo] te ha invitado a Ancora — Tu espacio de terapia

Hola [Nombre],

Tu psicólogo/a [NombrePsicólogo] te ha invitado a unirte a su espacio
en Ancora, la plataforma de terapia con seguimiento continuo.

Para aceptar la invitación y comenzar tu historia psicológica:

[ BOTÓN: ACEPTAR INVITACIÓN ]
https://ancora.clinic/invitacion?token=abc123...xyz

Este enlace es de uso único y expira en 7 días.

¿Qué incluye?
- Diario guiado para registrar tu semana
- Chat con IA de acompañamiento (cifrado extremo a extremo)
- Preparación estructurada para tus sesiones
- Historial portable que no se pierde

Tu privacidad está protegida: todos tus datos se procesan en servidores
locales cifrados. Ningún dato sale de España.
```

Asunto: [Psicólogo] te ha invitado a Ancora — Tu espacio de terapia Hola [Nombre], Tu psicólogo/a [NombrePsicólogo] te ha invitado a unirte a su espacio en Ancora, la plataforma de terapia con seguimiento continuo. Para aceptar la invitación y comenzar tu historia psicológica: [ BOTÓN: ACEPTAR INVITACIÓN ] https://ancora.clinic/invitacion?token=abc123...xyz Este enlace es de uso único y expira en 7 días. ¿Qué incluye? - Diario guiado para registrar tu semana - Chat con IA de acompañamiento (cifrado extremo a extremo) - Preparación estructurada para tus sesiones - Historial portable que no se pierde Tu privacidad está protegida: todos tus datos se procesan en servidores locales cifrados. Ningún dato sale de España.

Flujo de validación del token:

```
1. Paciente hace clic en enlace
2. Frontend POST /api/invitations/validate { token }
3. Backend descifra token con KEK del tenant
4. Verifica:
 - Firma válida
 - No expirado
 - No revocado (check en tabla invitation_revocations)
 - Email coincide con sesión actual (si ya logueado)
5. Si ok: crea relación paciente-psicólogo en tenant schema
6. Redirige a onboarding
```

1. Paciente hace clic en enlace 2. Frontend POST /api/invitations/validate { token } 3. Backend descifra token con KEK del tenant 4. Verifica: - Firma válida - No expirado - No revocado (check en tabla invitation_revocations) - Email coincide con sesión actual (si ya logueado) 5. Si ok: crea relación paciente-psicólogo en tenant schema 6. Redirige a onboarding

### 2.3 Código QR Único

Generación desde panel del psicólogo:

```
// Endpoint: GET /api/psychologist/qr-code
async function generateQRCode(tenantId) {
 const sessionToken = await createTemporarySession({
 tenant_id: tenantId,
 type: 'qr_scan',
 expires_in: '15m', // QR rota cada 15 minutos por seguridad
 max_uses: 1,
 uses: 0
 });

 const qrPayload = {
 v: 1,
 t: 'psych_invite',
 ts: tenantId.substring(0, 8), // prefijo de tenant
 s: sessionToken.shortCode,
 h: sessionToken.hmac // HMAC para verificación offline
 };

 // Codificar como URL: ancora://invite?data=base64(qrPayload)
 return `ancora://invite?d=${Buffer.from(JSON.stringify(qrPayload)).toString('base64')}`;
}
```

// Endpoint: GET /api/psychologist/qr-code async function generateQRCode(tenantId) { const sessionToken = await createTemporarySession({ tenant_id: tenantId, type: 'qr_scan', expires_in: '15m', // QR rota cada 15 minutos por seguridad max_uses: 1, uses: 0 }); const qrPayload = { v: 1, t: 'psych_invite', ts: tenantId.substring(0, 8), // prefijo de tenant s: sessionToken.shortCode, h: sessionToken.hmac // HMAC para verificación offline }; // Codificar como URL: ancora://invite?data=base64(qrPayload) return `ancora://invite?d=${Buffer.from(JSON.stringify(qrPayload)).toString('base64')}`; }

Escenario de uso:

- Psicólogo abre panel -> "Invitar paciente" -> "Mostrar QR"

- El QR se regenera cada 15 minutos automáticamente (rotación temporal)

- Si el QR se escanea pero el paciente no completa el registro en 15 min, expira

- Paciente escanea -> abre app/web -> vincula automáticamente al psicólogo

- El QR contiene nonce + HMAC para prevenir escaneos fraudulentos

API de verificación:

```
POST /api/invitations/qr-verify
Body: { qr_data: "ancora://invite?d=..." }
Response: {
 psicologo: { nombre, foto_url, especialidad },
 invitacion: { id, expires_in_seconds },
 patient_token: "jwt..." // pre-autenticado para onboarding
}
```

POST /api/invitations/qr-verify Body: { qr_data: "ancora://invite?d=..." } Response: { psicologo: { nombre, foto_url, especialidad }, invitacion: { id, expires_in_seconds }, patient_token: "jwt..." // pre-autenticado para onboarding }

### 2.4 Subida CSV/Excel Masiva

Formato del CSV:

```
nombre,email,telefono,notas,enfoque_preferido
Ana García,ana@email.com,+34600111222,"Ansiedad social","TCC"
Carlos Ruiz,carlos@email.com,+34600333444,"Terapia de pareja","Sistémico"
Maria López,maria@email.com,+34600555666,"Depresión leve","ACT"
```

nombre,email,telefono,notas,enfoque_preferido Ana García,ana@email.com,+34600111222,"Ansiedad social","TCC" Carlos Ruiz,carlos@email.com,+34600333444,"Terapia de pareja","Sistémico" Maria López,maria@email.com,+34600555666,"Depresión leve","ACT"

Pipeline de procesamiento:

```
1. Psicólogo sube CSV via POST /api/invitations/batch
2. Backend valida cabeceras y filas
3. Se procesa en lotes de 50 mediante BullMQ (cola batch-invitations)
4. Por cada fila:
 a. Validación de email/telefono (formato)
 b. Checksum contra pacientes existentes (evitar duplicados)
 c. Generación de token individual
 d. Enqueue para envío (email o SMS según disponibilidad)
5. Respuesta inmediata con resumen:
 {
 total: 150,
 validos: 148,
 duplicados: 2,
 errores: 0,
 batch_id: "uuid"
 }
6. Webhook en frontend cuando el batch se complete
```

1. Psicólogo sube CSV via POST /api/invitations/batch 2. Backend valida cabeceras y filas 3. Se procesa en lotes de 50 mediante BullMQ (cola batch-invitations) 4. Por cada fila: a. Validación de email/telefono (formato) b. Checksum contra pacientes existentes (evitar duplicados) c. Generación de token individual d. Enqueue para envío (email o SMS según disponibilidad) 5. Respuesta inmediata con resumen: { total: 150, validos: 148, duplicados: 2, errores: 0, batch_id: "uuid" } 6. Webhook en frontend cuando el batch se complete

Worker de batch:

```
// cola: batch-invitations
// consumers: 4 workers concurrentes
async function processBatchInvitation(job: Job) {
 const { row, tenantId, batchId } = job.data;

 // 1. Validar
 const exists = await db.query(
 `SELECT id FROM ${tenantId}.pacientes WHERE email = $1`,
 [row.email]
 );
 if (exists) return { status: 'duplicate', email: row.email };

 // 2. Crear paciente pendiente
 const patientId = crypto.randomUUID();
 await db.query(
 `INSERT INTO ${tenantId}.pacientes_pendientes
 (id, nombre, email, telefono, notas, tenant_id)
 VALUES ($1, $2, $3, $4, $5, $6)`,
 [patientId, row.nombre, row.email, row.telefono, row.notas, tenantId]
 );

 // 3. Generar token
 const token = generateMagicLink(tenantId, row.email);

 // 4. Enviar según canal disponible
 if (row.email) {
 await emailQueue.add('send-invite', { to: row.email, token, tenantId });
 }
 if (row.telefono) {
 await smsQueue.add('send-invite', { to: row.telefono, token, tenantId });
 }

 return { status: 'queued', email: row.email, token_preview: token.substring(0, 8) + '...' };
}
```

// cola: batch-invitations // consumers: 4 workers concurrentes async function processBatchInvitation(job: Job) { const { row, tenantId, batchId } = job.data; // 1. Validar const exists = await db.query( `SELECT id FROM ${tenantId}.pacientes WHERE email = $1`, [row.email] ); if (exists) return { status: 'duplicate', email: row.email }; // 2. Crear paciente pendiente const patientId = crypto.randomUUID(); await db.query( `INSERT INTO ${tenantId}.pacientes_pendientes (id, nombre, email, telefono, notas, tenant_id) VALUES ($1, $2, $3, $4, $5, $6)`, [patientId, row.nombre, row.email, row.telefono, row.notas, tenantId] ); // 3. Generar token const token = generateMagicLink(tenantId, row.email); // 4. Enviar según canal disponible if (row.email) { await emailQueue.add('send-invite', { to: row.email, token, tenantId }); } if (row.telefono) { await smsQueue.add('send-invite', { to: row.telefono, token, tenantId }); } return { status: 'queued', email: row.email, token_preview: token.substring(0, 8) + '...' }; }

### 2.5 Enlace Público para Autoregistro

URL estructurada: https://ancora.clinic/psicologo/dr-garcia

`https://ancora.clinic/psicologo/dr-garcia`

Modelo de slug por psicólogo:

```
CREATE TABLE public.psicologos_perfiles (
 id UUID PRIMARY KEY,
 tenant_id UUID NOT NULL REFERENCES public.tenants(id),
 slug VARCHAR(100) UNIQUE NOT NULL, -- "dr-garcia"
 nombre_publico VARCHAR(200) NOT NULL, -- "Dr. Juan García"
 titulos VARCHAR(500), -- "Psicólogo General Sanitario (MPGS)"
 especialidades TEXT[], -- ["TCC", "Ansiedad", "Depresión"]
 experiencia_anos INT,
 precio_sesion DECIMAL(10,2),
 bio TEXT,
 foto_url VARCHAR(500),
 video_presentacion_url VARCHAR(500),
 disponibilidad JSONB, -- Horarios semanales
 activo BOOLEAN DEFAULT true,
 created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_psicologos_slug ON public.psicologos_perfiles(slug);
```

CREATE TABLE public.psicologos_perfiles ( id UUID PRIMARY KEY, tenant_id UUID NOT NULL REFERENCES public.tenants(id), slug VARCHAR(100) UNIQUE NOT NULL, -- "dr-garcia" nombre_publico VARCHAR(200) NOT NULL, -- "Dr. Juan García" titulos VARCHAR(500), -- "Psicólogo General Sanitario (MPGS)" especialidades TEXT[], -- ["TCC", "Ansiedad", "Depresión"] experiencia_anos INT, precio_sesion DECIMAL(10,2), bio TEXT, foto_url VARCHAR(500), video_presentacion_url VARCHAR(500), disponibilidad JSONB, -- Horarios semanales activo BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT NOW() ); CREATE UNIQUE INDEX idx_psicologos_slug ON public.psicologos_perfiles(slug);

Flujo de autoregistro:

```
Paciente visita: ancora.clinic/psicologo/dr-garcia
 │
 ▼
 ┌────────────────────────────┐
 │ LANDING PÚBLICA │
 │ - Foto, bio, experiencia │
 │ - Enfoques terapéuticos │
 │ - Precios │
 │ - Testimonios (no clínicos)│
 │ - CTA: "Empezar terapia" │
 └───────────┬────────────────┘
 │
 ▼
 ┌────────────────────────────┐
 │ REGISTRO EXPRESS │
 │ - Nombre, email │
 │ - Password (deriva KEK) │
 │ - Consentimiento explícito│
 │ (Art. 9 RGPD) │
 └───────────┬────────────────┘
 │
 ▼
 ┌────────────────────────────┐
 │ PRE-TRIAJE (PHQ-9 / GAD-7)│
 │ - Cribado automático │
 │ - Si riesgo alto: │
 │ pantalla de crisis + │
 │ derivación a 024/112 │
 └───────────┬────────────────┘
 │
 ▼
 ┌────────────────────────────┐
 │ VINCULACIÓN CON │
 │ PSICÓLOGO SELECCIONADO │
 │ - Crea relación en schema │
 │ - Notifica al psicólogo │
 │ - Activa plan de prueba │
 │ (7 días diario IA + │
 │ 1 sesión de encuadre) │
 └────────────────────────────┘
```

Paciente visita: ancora.clinic/psicologo/dr-garcia │ ▼ ┌────────────────────────────┐ │ LANDING PÚBLICA │ │ - Foto, bio, experiencia │ │ - Enfoques terapéuticos │ │ - Precios │ │ - Testimonios (no clínicos)│ │ - CTA: "Empezar terapia" │ └───────────┬────────────────┘ │ ▼ ┌────────────────────────────┐ │ REGISTRO EXPRESS │ │ - Nombre, email │ │ - Password (deriva KEK) │ │ - Consentimiento explícito│ │ (Art. 9 RGPD) │ └───────────┬────────────────┘ │ ▼ ┌────────────────────────────┐ │ PRE-TRIAJE (PHQ-9 / GAD-7)│ │ - Cribado automático │ │ - Si riesgo alto: │ │ pantalla de crisis + │ │ derivación a 024/112 │ └───────────┬────────────────┘ │ ▼ ┌────────────────────────────┐ │ VINCULACIÓN CON │ │ PSICÓLOGO SELECCIONADO │ │ - Crea relación en schema │ │ - Notifica al psicólogo │ │ - Activa plan de prueba │ │ (7 días diario IA + │ │ 1 sesión de encuadre) │ └────────────────────────────┘

### 2.6 API REST para Integración con Clínicas

Endpoints públicos (con API Key de clínica):

```
POST /api/v1/integration/patients - Crear paciente y enviar invitación
GET /api/v1/integration/patients/:id - Estado de invitación
POST /api/v1/integration/patients/batch - Importación masiva
DELETE /api/v1/integration/patients/:id - Revocar invitación
GET /api/v1/integration/patients/report - Reporte de adopción
```

POST /api/v1/integration/patients - Crear paciente y enviar invitación GET /api/v1/integration/patients/:id - Estado de invitación POST /api/v1/integration/patients/batch - Importación masiva DELETE /api/v1/integration/patients/:id - Revocar invitación GET /api/v1/integration/patients/report - Reporte de adopción

Autenticación: API Key + HMAC firmado:

```
// Firma de request
function signRequest(apiKey: string, secret: string, body: string, timestamp: string) {
 const message = `${timestamp}.${apiKey}.${body}`;
 return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

// Headers requeridos
Headers: {
 'X-API-Key': 'ancora_sk_live_xxxxxxxxx',
 'X-Timestamp': new Date().toISOString(),
 'X-Signature': 'hmac_sha256_hex'
}
```

// Firma de request function signRequest(apiKey: string, secret: string, body: string, timestamp: string) { const message = `${timestamp}.${apiKey}.${body}`; return crypto.createHmac('sha256', secret).update(message).digest('hex'); } // Headers requeridos Headers: { 'X-API-Key': 'ancora_sk_live_xxxxxxxxx', 'X-Timestamp': new Date().toISOString(), 'X-Signature': 'hmac_sha256_hex' }

Ejemplo de integración (Python):

```
import requests, hmac, hashlib, json

API_KEY = "ancora_sk_live_clinica_xxx"
API_SECRET = b"supersecreto123"

def invite_patient(nombre, email, telefono=""):
 timestamp = datetime.utcnow().isoformat()
 body = json.dumps({
 "nombre": nombre,
 "email": email,
 "telefono": telefono,
 "invitacion_tipo": "email", # email | sms | ambos
 "mensaje_personalizado": f"Tu psicóloga {nombre_psic} te espera en Ancora"
 })
 signature = hmac.new(API_SECRET, f"{timestamp}.{API_KEY}.{body}".encode(), hashlib.sha256).hexdigest()

 resp = requests.post(
 "https://api.ancora.clinic/v1/integration/patients",
 headers={
 "X-API-Key": API_KEY,
 "X-Timestamp": timestamp,
 "X-Signature": signature,
 "Content-Type": "application/json"
 },
 data=body
 )
 return resp.json()

# Usar para integración con software de clínica (ej. Clinikae, Doctoralia API)
resultado = invite_patient("Ana García", "ana@clinica.com", "+34600111222")
```

import requests, hmac, hashlib, json API_KEY = "ancora_sk_live_clinica_xxx" API_SECRET = b"supersecreto123" def invite_patient(nombre, email, telefono=""): timestamp = datetime.utcnow().isoformat() body = json.dumps({ "nombre": nombre, "email": email, "telefono": telefono, "invitacion_tipo": "email", # email | sms | ambos "mensaje_personalizado": f"Tu psicóloga {nombre_psic} te espera en Ancora" }) signature = hmac.new(API_SECRET, f"{timestamp}.{API_KEY}.{body}".encode(), hashlib.sha256).hexdigest() resp = requests.post( "https://api.ancora.clinic/v1/integration/patients", headers={ "X-API-Key": API_KEY, "X-Timestamp": timestamp, "X-Signature": signature, "Content-Type": "application/json" }, data=body ) return resp.json() # Usar para integración con software de clínica (ej. Clinikae, Doctoralia API) resultado = invite_patient("Ana García", "ana@clinica.com", "+34600111222")

## 3. CANALIZACIÓN DE LEADS

### 3.1 Directorio de Psicólogos con Filtros

Modelo de datos del directorio público:

```
-- Vista pública (solo psicólogos activos con perfil completo)
CREATE VIEW public.directorio_psicologos AS
SELECT
 pp.id,
 pp.slug,
 pp.nombre_publico,
 pp.foto_url,
 pp.titulos,
 pp.especialidades,
 pp.experiencia_anos,
 pp.bio,
 pp.precio_sesion,
 pp.disponibilidad,
 -- Métricas agregadas (sin datos clínicos)
 COALESCE(pr.puntuacion_media, 0) as puntuacion_media,
 COALESCE(pr.num_resenas, 0) as num_resenas,
 COALESCE(pr.tasa_respuesta, 0) as tasa_respuesta
FROM public.psicologos_perfiles pp
LEFT JOIN public.psicologos_reputacion pr ON pp.id = pr.psicologo_id
WHERE pp.activo = true;
```

-- Vista pública (solo psicólogos activos con perfil completo) CREATE VIEW public.directorio_psicologos AS SELECT pp.id, pp.slug, pp.nombre_publico, pp.foto_url, pp.titulos, pp.especialidades, pp.experiencia_anos, pp.bio, pp.precio_sesion, pp.disponibilidad, -- Métricas agregadas (sin datos clínicos) COALESCE(pr.puntuacion_media, 0) as puntuacion_media, COALESCE(pr.num_resenas, 0) as num_resenas, COALESCE(pr.tasa_respuesta, 0) as tasa_respuesta FROM public.psicologos_perfiles pp LEFT JOIN public.psicologos_reputacion pr ON pp.id = pr.psicologo_id WHERE pp.activo = true;

Endpoints de filtrado:

```
GET /api/v1/directorio
 ?especialidad=TCC,Ansiedad
 &precio_min=40
 &precio_max=80
 &experiencia_min=5
 &genero=femenino
 &idioma=espanol,ingles
 &disponibilidad=lunes_manana,miercoles_tarde
 &orden=puntuacion
 &pagina=1
 &limite=20
```

GET /api/v1/directorio ?especialidad=TCC,Ansiedad &precio_min=40 &precio_max=80 &experiencia_min=5 &genero=femenino &idioma=espanol,ingles &disponibilidad=lunes_manana,miercoles_tarde &orden=puntuacion &pagina=1 &limite=20

Respuesta paginada:

```
{
 "data": [
 {
 "id": "uuid",
 "slug": "dra-maria-lopez",
 "nombre": "Dra. Maria López",
 "foto": "https://cdn.ancora.clinic/psicologos/uuid_foto.webp",
 "titulos": "Psicóloga General Sanitaria (MPGS nº M-12345)",
 "especialidades": ["TCC", "Ansiedad", "Depresión"],
 "experiencia": 12,
 "precio": 60,
 "puntuacion": 4.8,
 "resenas": 34,
 "disponibilidad": { "lunes": ["09:00-13:00", "16:00-20:00"], "martes": [...] },
 "badges": ["Verificado COP", "Respuesta < 2h", "Enfoque TCC"]
 }
 ],
 "pagination": {
 "total": 156,
 "page": 1,
 "per_page": 20,
 "total_pages": 8
 },
 "filters_activos": {
 "especialidad": ["TCC", "Ansiedad"]
 }
}
```

{ "data": [ { "id": "uuid", "slug": "dra-maria-lopez", "nombre": "Dra. Maria López", "foto": "https://cdn.ancora.clinic/psicologos/uuid_foto.webp", "titulos": "Psicóloga General Sanitaria (MPGS nº M-12345)", "especialidades": ["TCC", "Ansiedad", "Depresión"], "experiencia": 12, "precio": 60, "puntuacion": 4.8, "resenas": 34, "disponibilidad": { "lunes": ["09:00-13:00", "16:00-20:00"], "martes": [...] }, "badges": ["Verificado COP", "Respuesta < 2h", "Enfoque TCC"] } ], "pagination": { "total": 156, "page": 1, "per_page": 20, "total_pages": 8 }, "filters_activos": { "especialidad": ["TCC", "Ansiedad"] } }

### 3.2 Sistema de Matching (Algoritmo vs Libre Elección)

Modelo híbrido con dos modos:

#### Modo A: Libre Elección (recomendado, 80% de usuarios)

El paciente navega el directorio, filtra, y selecciona manualmente. La plataforma ofrece recomendaciones inteligentes basadas en:

- Especialidad declarada por el paciente en el triaje

- Preferencias de precio, género, y horario

- Experiencia en problemas similares

- Disponibilidad actual

Algoritmo de ranking (sin ser caja negra):

```
Score(paciente, psicologo) =
 w1 * match_especialidad(psicologo.especialidades, paciente.necesidades)
+ w2 * (1 - abs(psicologo.precio - paciente.precio_max) / paciente.precio_max)
+ w3 * match_disponibilidad(psicologo.disponibilidad, paciente.horarios)
+ w4 * match_genero(psicologo.genero, paciente.preferencia_genero)
+ w5 * psicologo.puntuacion / 5.0
+ w6 * (psicologo.experiencia / 30) // normalizado a [0,1]
```

Score(paciente, psicologo) = w1 * match_especialidad(psicologo.especialidades, paciente.necesidades) + w2 * (1 - abs(psicologo.precio - paciente.precio_max) / paciente.precio_max) + w3 * match_disponibilidad(psicologo.disponibilidad, paciente.horarios) + w4 * match_genero(psicologo.genero, paciente.preferencia_genero) + w5 * psicologo.puntuacion / 5.0 + w6 * (psicologo.experiencia / 30) // normalizado a [0,1]

Donde w1..w6 = [0.30, 0.20, 0.20, 0.10, 0.10, 0.10] (pesos configurables por psicólogo).

`w1..w6 = [0.30, 0.20, 0.20, 0.10, 0.10, 0.10]`

#### Modo B: Matching Asistido (opcional, para indecisos)

- Paciente completa triaje extendido (PHQ-9 + GAD-7 + preferencias)

- Algoritmo asigna top-3 psicólogos compatibles

- Paciente revisa perfiles y elige

- Matching no es vinculante: puede cambiar en cualquier momento

Restricción regulatoria: El paciente SIEMPRE tiene la última elección. No hay asignación automática sin consentimiento.

### 3.3 Flujo de Onboarding para Paciente Nuevo

```
FASE 1: REGISTRO
 │
 ├── Si viene por invitación (psicólogo conocido):
 │ - Valida token mágico / QR
 │ - Pre-vinculado al psicólogo
 │ - Solo necesita crear su KEK (Argon2id)
 │ - Firma consentimiento informado
 │
 ├── Si viene por autoregistro (slug público):
 │ - Ya seleccionó psicólogo en el directorio
 │ - Registro + KEK + vinculación directa
 │
 └── Si viene sin psicólogo definido:
 - Registro básico (email + password)
 - Deriva KEK del password
 - Pasa a Fase 2

FASE 2: TRIAJE (PHQ-9 + GAD-7)
 │
 ├── Cuestionario interactivo (IA guía)
 ├── 9 preguntas PHQ-9 (Depresión)
 ├── 7 preguntas GAD-7 (Ansiedad)
 │
 ├── Resultado RIESGO BAJO/LEVE:
 │ - Continua a Fase 3
 │
 ├── Resultado RIESGO MODERADO:
 │ - Continua a Fase 3
 │ - + Recomendación de sesión síncrona temprana
 │
 └── Resultado RIESGO GRAVE/CRÍTICO:
 - Pantalla de crisis (protocolo kill-switch)
 - Números de emergencia (024, 112)
 - Bloqueo de onboarding
 - Notificación a psicólogo (si está vinculado)
 - Derivación a recursos presenciales

FASE 3: SELECCIÓN DE PSICÓLOGO (si no tiene)
 │
 ├── Directorio filtrado por resultados de triaje
 ├── Recomendaciones IA (top 3)
 ├── Previsualización de perfiles
 └── Selección y vinculación

FASE 4: PLAN DE TRATAMIENTO INICIAL
 │
 ├── Configuración de plan (Esencial / Intermedio / Intensivo)
 ├── Stripe Connect: pago de matrícula (49€ promo)
 ├── Stripe Connect: suscripción recurrente
 ├── Split automático: psicólogo ↔ plataforma
 │
 └── PRIMERA SEMANA:
 - 7 días de diario guiado (chat IA)
 - 1 sesión de encuadre con psicólogo (60 min)
 - Generación de historia psicológica inicial
```

FASE 1: REGISTRO │ ├── Si viene por invitación (psicólogo conocido): │ - Valida token mágico / QR │ - Pre-vinculado al psicólogo │ - Solo necesita crear su KEK (Argon2id) │ - Firma consentimiento informado │ ├── Si viene por autoregistro (slug público): │ - Ya seleccionó psicólogo en el directorio │ - Registro + KEK + vinculación directa │ └── Si viene sin psicólogo definido: - Registro básico (email + password) - Deriva KEK del password - Pasa a Fase 2 FASE 2: TRIAJE (PHQ-9 + GAD-7) │ ├── Cuestionario interactivo (IA guía) ├── 9 preguntas PHQ-9 (Depresión) ├── 7 preguntas GAD-7 (Ansiedad) │ ├── Resultado RIESGO BAJO/LEVE: │ - Continua a Fase 3 │ ├── Resultado RIESGO MODERADO: │ - Continua a Fase 3 │ - + Recomendación de sesión síncrona temprana │ └── Resultado RIESGO GRAVE/CRÍTICO: - Pantalla de crisis (protocolo kill-switch) - Números de emergencia (024, 112) - Bloqueo de onboarding - Notificación a psicólogo (si está vinculado) - Derivación a recursos presenciales FASE 3: SELECCIÓN DE PSICÓLOGO (si no tiene) │ ├── Directorio filtrado por resultados de triaje ├── Recomendaciones IA (top 3) ├── Previsualización de perfiles └── Selección y vinculación FASE 4: PLAN DE TRATAMIENTO INICIAL │ ├── Configuración de plan (Esencial / Intermedio / Intensivo) ├── Stripe Connect: pago de matrícula (49€ promo) ├── Stripe Connect: suscripción recurrente ├── Split automático: psicólogo ↔ plataforma │ └── PRIMERA SEMANA: - 7 días de diario guiado (chat IA) - 1 sesión de encuadre con psicólogo (60 min) - Generación de historia psicológica inicial

## 4. VISTAS POR ROL

### 4.1 Panel Psicólogo (Clinical Dashboard)

```
┌──────────────────────────────────────────────────────────────┐
│ [LOGO] ANCORA · Panel Clínico [Notificaciones] ⏰ │
├──────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ RESUMEN DEL DÍA ││
│ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ││
│ │ │ 12 │ │ 3 │ │ 5 │ │ 2 │ ││
│ │ │Pacien│ │Citas │ │Revis.│ │Alert.│ ││
│ │ │activos│ │hoy │ │pend. │ │crisis│ ││
│ │ └──────┘ └──────┘ └──────┘ └──────┘ ││
│ └──────────────────────────────────────────────────────────┘│
│ │
│ ┌───────────┬─────────────┬────────────┬──────────────────┐│
│ │ PACIENTE │ ÚLTIMA │ PRÓXIMA │ ALERTAS ││
│ │ │ ACTIVIDAD │ CITA │ ││
│ ├───────────┼─────────────┼────────────┼──────────────────┤│
│ │ Ana G. │ Hoy 09:15 │ Lun 16:00 │ 🔴 Crisis leve ││
│ │ │ (diario) │ (video) │ detectada ││
│ ├───────────┼─────────────┼────────────┼──────────────────┤│
│ │ Carlos R. │ Ayer 22:30 │ Mar 11:00 │ 🟡 Patrón de ││
│ │ │ (audio 2min)│ (revisión) │ rumiación ││
│ ├───────────┼─────────────┼────────────┼──────────────────┤│
│ │ Maria L. │ Hoy 07:45 │ Mié 18:30 │ 🟢 Sin alertas ││
│ │ │ (diario) │ (video) │ ││
│ └───────────┴─────────────┴────────────┴──────────────────┘│
│ │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ CALENDARIO SEMANAL ││
│ │ ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐ ││
│ │ │ Lun │ Mar │ Mié │ Jue │ Vie │ Sáb │ Dom │ ││
│ │ │ 3c │ 2c │ 4c │ 1c │ 3c │ — │ — │ ││
│ │ │1rev │2rev │1rev │3rev │1rev │ │ │ ││
│ │ └─────┴─────┴─────┴─────┴─────┴─────┴─────┘ ││
│ └──────────────────────────────────────────────────────────┘│
│ │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ VISTA RAW-FIRST (Paciente seleccionado: Ana G.) ││
│ │ ││
│ │ [NIVEL 1: DATOS CRUDOS — SIN SESGO IA] ││
│ │ ┌────────────────────────────────────────────────────┐ ││
│ │ │ "Hoy me he sentido abrumada en el trabajo. │ ││
│ │ │ No he podido concentrarme en nada." │ ││
│ │ │ — Diario: 31/05/2026 09:15 │ ││
│ │ │ │ ││
│ │ │ Sueño: 5.2h (↓ 23% vs media semanal) │ ││
│ │ │ Ánimo reportado: 3/10 │ ││
│ │ │ Ejercicio: No │ ││
│ │ └────────────────────────────────────────────────────┘ ││
│ │ ││
│ │ [NIVEL 2: ANÁLISIS IA — BLOQUEADO] ││
│ │ ┌────────────────────────────────────────────────────┐ ││
│ │ │ [GLASSMORPHISM — Desbloquear para ver análisis] │ ││
│ │ │ [ Desbloquear Análisis IA — Requiere revisar │ ││
│ │ │ datos crudos primero (5min mínimo) ] │ ││
│ │ └────────────────────────────────────────────────────┘ ││
│ │ ││
│ │ [NIVEL 3: DISONANCIA] ││
│ │ ┌────────────────────────────────────────────────────┐ ││
│ │ │ Paciente reporta: "Estoy bien, sin novedades" │ ││
│ │ │ Marcadores objetivos: │ ││
│ │ │ - Sueño: 4.1h (↓ 38%) │ ││
│ │ │ - HRV: 28ms (↓ 45%) │ ││
│ │ │ - Ánimo reportado: 3/10 │ ││
│ │ │ ⚠ DISONANCIA DETECTADA │ ││
│ │ └────────────────────────────────────────────────────┘ ││
│ └──────────────────────────────────────────────────────────┘│
│ │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ SOAP (Subjetivo, Objetivo, Análisis, Plan) ││
│ │ ││
│ │ S: [Pre-llenado por IA] "Paciente reporta ansiedad ││
│ │ laboral, insomnio y falta de concentración..." ││
│ │ ││
│ │ O: [Pre-llenado por IA] PHQ-9: 14/27 (moderado). ││
│ │ GAD-7: 12/21 (moderado). Sueño: 5.2h media. ││
│ │ ││
│ │ A: [Editable por psicólogo] ││
│ │ ┌────────────────────────────────────────────────────┐ ││
│ │ │ ________________________________________________ │ ││
│ │ │ ________________________________________________ │ ││
│ │ └────────────────────────────────────────────────────┘ ││
│ │ ││
│ │ P: [Editable por psicólogo] ││
│ │ ┌────────────────────────────────────────────────────┐ ││
│ │ │ ________________________________________________ │ ││
│ │ │ ________________________________________________ │ ││
│ │ └────────────────────────────────────────────────────┘ ││
│ │ ││
│ │ [ Firmar y Enviar ] con PIN de 4 dígitos ││
│ └──────────────────────────────────────────────────────────┘│
│ │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ FACTURACIÓN ││
│ │ ┌──────┬──────────┬──────────┬──────────┬───────────┐ ││
│ │ │ Mes │ Pacientes│ Ingresos │ Comisión │ Neto │ ││
│ │ ├──────┼──────────┼──────────┼──────────┼───────────┤ ││
│ │ │ Mayo │ 12 │ 960€ │ 468€ │ 492€ │ ││
│ │ │ Abr │ 10 │ 800€ │ 390€ │ 410€ │ ││
│ │ └──────┴──────────┴──────────┴──────────┴───────────┘ ││
│ │ Stripe Connect: [Ver Dashboard] [Exportar facturas] ││
│ └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

┌──────────────────────────────────────────────────────────────┐ │ [LOGO] ANCORA · Panel Clínico [Notificaciones] ⏰ │ ├──────────────────────────────────────────────────────────────┤ │ │ │ ┌──────────────────────────────────────────────────────────┐│ │ │ RESUMEN DEL DÍA ││ │ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ││ │ │ │ 12 │ │ 3 │ │ 5 │ │ 2 │ ││ │ │ │Pacien│ │Citas │ │Revis.│ │Alert.│ ││ │ │ │activos│ │hoy │ │pend. │ │crisis│ ││ │ │ └──────┘ └──────┘ └──────┘ └──────┘ ││ │ └──────────────────────────────────────────────────────────┘│ │ │ │ ┌───────────┬─────────────┬────────────┬──────────────────┐│ │ │ PACIENTE │ ÚLTIMA │ PRÓXIMA │ ALERTAS ││ │ │ │ ACTIVIDAD │ CITA │ ││ │ ├───────────┼─────────────┼────────────┼──────────────────┤│ │ │ Ana G. │ Hoy 09:15 │ Lun 16:00 │ 🔴 Crisis leve ││ │ │ │ (diario) │ (video) │ detectada ││ │ ├───────────┼─────────────┼────────────┼──────────────────┤│ │ │ Carlos R. │ Ayer 22:30 │ Mar 11:00 │ 🟡 Patrón de ││ │ │ │ (audio 2min)│ (revisión) │ rumiación ││ │ ├───────────┼─────────────┼────────────┼──────────────────┤│ │ │ Maria L. │ Hoy 07:45 │ Mié 18:30 │ 🟢 Sin alertas ││ │ │ │ (diario) │ (video) │ ││ │ └───────────┴─────────────┴────────────┴──────────────────┘│ │ │ │ ┌──────────────────────────────────────────────────────────┐│ │ │ CALENDARIO SEMANAL ││ │ │ ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐ ││ │ │ │ Lun │ Mar │ Mié │ Jue │ Vie │ Sáb │ Dom │ ││ │ │ │ 3c │ 2c │ 4c │ 1c │ 3c │ — │ — │ ││ │ │ │1rev │2rev │1rev │3rev │1rev │ │ │ ││ │ │ └─────┴─────┴─────┴─────┴─────┴─────┴─────┘ ││ │ └──────────────────────────────────────────────────────────┘│ │ │ │ ┌──────────────────────────────────────────────────────────┐│ │ │ VISTA RAW-FIRST (Paciente seleccionado: Ana G.) ││ │ │ ││ │ │ [NIVEL 1: DATOS CRUDOS — SIN SESGO IA] ││ │ │ ┌────────────────────────────────────────────────────┐ ││ │ │ │ "Hoy me he sentido abrumada en el trabajo. │ ││ │ │ │ No he podido concentrarme en nada." │ ││ │ │ │ — Diario: 31/05/2026 09:15 │ ││ │ │ │ │ ││ │ │ │ Sueño: 5.2h (↓ 23% vs media semanal) │ ││ │ │ │ Ánimo reportado: 3/10 │ ││ │ │ │ Ejercicio: No │ ││ │ │ └────────────────────────────────────────────────────┘ ││ │ │ ││ │ │ [NIVEL 2: ANÁLISIS IA — BLOQUEADO] ││ │ │ ┌────────────────────────────────────────────────────┐ ││ │ │ │ [GLASSMORPHISM — Desbloquear para ver análisis] │ ││ │ │ │ [ Desbloquear Análisis IA — Requiere revisar │ ││ │ │ │ datos crudos primero (5min mínimo) ] │ ││ │ │ └────────────────────────────────────────────────────┘ ││ │ │ ││ │ │ [NIVEL 3: DISONANCIA] ││ │ │ ┌────────────────────────────────────────────────────┐ ││ │ │ │ Paciente reporta: "Estoy bien, sin novedades" │ ││ │ │ │ Marcadores objetivos: │ ││ │ │ │ - Sueño: 4.1h (↓ 38%) │ ││ │ │ │ - HRV: 28ms (↓ 45%) │ ││ │ │ │ - Ánimo reportado: 3/10 │ ││ │ │ │ ⚠ DISONANCIA DETECTADA │ ││ │ │ └────────────────────────────────────────────────────┘ ││ │ └──────────────────────────────────────────────────────────┘│ │ │ │ ┌──────────────────────────────────────────────────────────┐│ │ │ SOAP (Subjetivo, Objetivo, Análisis, Plan) ││ │ │ ││ │ │ S: [Pre-llenado por IA] "Paciente reporta ansiedad ││ │ │ laboral, insomnio y falta de concentración..." ││ │ │ ││ │ │ O: [Pre-llenado por IA] PHQ-9: 14/27 (moderado). ││ │ │ GAD-7: 12/21 (moderado). Sueño: 5.2h media. ││ │ │ ││ │ │ A: [Editable por psicólogo] ││ │ │ ┌────────────────────────────────────────────────────┐ ││ │ │ │ ________________________________________________ │ ││ │ │ │ ________________________________________________ │ ││ │ │ └────────────────────────────────────────────────────┘ ││ │ │ ││ │ │ P: [Editable por psicólogo] ││ │ │ ┌────────────────────────────────────────────────────┐ ││ │ │ │ ________________________________________________ │ ││ │ │ │ ________________________________________________ │ ││ │ │ └────────────────────────────────────────────────────┘ ││ │ │ ││ │ │ [ Firmar y Enviar ] con PIN de 4 dígitos ││ │ └──────────────────────────────────────────────────────────┘│ │ │ │ ┌──────────────────────────────────────────────────────────┐│ │ │ FACTURACIÓN ││ │ │ ┌──────┬──────────┬──────────┬──────────┬───────────┐ ││ │ │ │ Mes │ Pacientes│ Ingresos │ Comisión │ Neto │ ││ │ │ ├──────┼──────────┼──────────┼──────────┼───────────┤ ││ │ │ │ Mayo │ 12 │ 960€ │ 468€ │ 492€ │ ││ │ │ │ Abr │ 10 │ 800€ │ 390€ │ 410€ │ ││ │ │ └──────┴──────────┴──────────┴──────────┴───────────┘ ││ │ │ Stripe Connect: [Ver Dashboard] [Exportar facturas] ││ │ └──────────────────────────────────────────────────────────┘│ └──────────────────────────────────────────────────────────────┘

### 4.2 Panel Paciente

```
┌──────────────────────────────────────────────────────────────┐
│ [LOGO] Bienvenida, Ana [🔔] [⚙️] │
├──────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ MI HISTORIA PSICOLÓGICA ││
│ │ ┌────────────────────────────────────────────────────┐ ││
│ │ │ 📅 Línea de Tiempo │ ││
│ │ │ │ ││
│ │ │ ───●────●────●────●────●────●────●────●──── │ ││
│ │ │ Sem1 Sem2 Sem3 Sem4 Sem5 Sem6 Sem7 Sem8 │ ││
│ │ │ ↑ ↑ │ ││
│ │ │ Inicio terapia Última sesión │ ││
│ │ │ │ ││
│ │ │ Progreso: ████████░░░░ 65% │ ││
│ │ │ Ánimo medio: 4.2/10 → 6.8/10 (+2.6) │ ││
│ │ │ Sesiones completadas: 6 de 8 │ ││
│ │ └────────────────────────────────────────────────────┘ ││
│ └──────────────────────────────────────────────────────────┘│
│ │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ DIARIO EMOCIONAL (HOY) ││
│ │ ┌────────────────────────────────────────────────────┐ ││
│ │ │ ¿Cómo te sientes hoy? │ ││
│ │ │ │ ││
│ │ │ [😢] [🙁] [😐] [🙂] [😊] → Seleccionado: 😐 │ ││
│ │ │ │ ││
│ │ │ ¿Qué ha pasado hoy? │ ││
│ │ │ ┌────────────────────────────────────────────┐ │ ││
│ │ │ │ He tenido una discusión con mi pareja y │ │ ││
│ │ │ │ me siento frustrada... no sé cómo │ │ ││
│ │ │ │ manejar estas situaciones... │ │ ││
│ │ │ └────────────────────────────────────────────┘ │ ││
│ │ │ │ ││
│ │ │ [Enviar] (Te quedan 12 min de IA hoy) │ ││
│ │ └────────────────────────────────────────────────────┘ ││
│ │ ││
│ │ ┌────────────────────────────────────────────────────┐ ││
│ │ │ RESPUESTA DE IA (vía DeepSeek-R1-70B en GPU local)│ ││
│ │ │ │ ││
│ │ │ <thought> │ ││
│ │ │ La paciente reporta frustración post-conflicto │ ││
│ │ │ de pareja. Identifico posible patrón de │ ││
│ │ │ comunicación no asertiva. La emoción base │ ││
│ │ │ parece ser tristeza/impotencia más que ira. │ ││
│ │ │ </thought> │ ││
│ │ │ │ ││
│ │ │ "Entiendo que te sientas frustrada. Las │ ││
│ │ │ discusiones de pareja suelen activar patrones │ ││
│ │ │ de comunicación que no siempre reflejan lo que │ ││
│ │ │ realmente queremos expresar. │ ││
│ │ │ │ ││
│ │ │ ¿Has notado alguna señal física antes de que │ ││
│ │ │ comenzara la discusión? (tensión en hombros, │ ││
│ │ │ respiración acelerada...) │ ││
│ │ │ │ ││
│ │ │ 📝 Nota para tu psicóloga: Esta entrada ha sido │ ││
│ │ │ marcada para revisión en tu próxima sesión. │ ││
│ │ └────────────────────────────────────────────────────┘ ││
│ └──────────────────────────────────────────────────────────┘│
│ │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ PRÓXIMAS SESIONES ││
│ │ ┌────────────────────────────────────────────────────┐ ││
│ │ │ 📅 Lun 02 Jun — 16:00 — Videollamada (45 min) │ ││
│ │ │ con Dra. María López │ ││
│ │ │ Temas: Comunicación asertiva │ ││
│ │ │ [Unirme] [Reprogramar] │ ││
│ │ │ │ ││
│ │ │ 📅 Vie 06 Jun — Revisión asíncrona │ ││
│ │ │ Tu psicóloga revisará tu diario semanal │ ││
│ │ │ y te dejará un video-briefing │ ││
│ │ └────────────────────────────────────────────────────┘ ││
│ └──────────────────────────────────────────────────────────┘│
│ │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ PROGRESO Y RECURSOS ││
│ │ ┌──────┬──────┬──────┐ ┌──────────────────────────┐ ││
│ │ │Ánimo │Sueño │Ejer. │ │ Recursos recomendados │ ││
│ │ │ 6/10 │ 5.2h │ No │ │ - Ejercicio respiración │ ││
│ │ │ ↗25% │ ↘23% │ — │ │ - Hoja de comunicación │ ││
│ │ └──────┴──────┴──────┘ │ asertiva (validado por │ ││
│ │ │ tu psicóloga) │ ││
│ │ └──────────────────────────┘ ││
│ └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

┌──────────────────────────────────────────────────────────────┐ │ [LOGO] Bienvenida, Ana [🔔] [⚙️] │ ├──────────────────────────────────────────────────────────────┤ │ │ │ ┌──────────────────────────────────────────────────────────┐│ │ │ MI HISTORIA PSICOLÓGICA ││ │ │ ┌────────────────────────────────────────────────────┐ ││ │ │ │ 📅 Línea de Tiempo │ ││ │ │ │ │ ││ │ │ │ ───●────●────●────●────●────●────●────●──── │ ││ │ │ │ Sem1 Sem2 Sem3 Sem4 Sem5 Sem6 Sem7 Sem8 │ ││ │ │ │ ↑ ↑ │ ││ │ │ │ Inicio terapia Última sesión │ ││ │ │ │ │ ││ │ │ │ Progreso: ████████░░░░ 65% │ ││ │ │ │ Ánimo medio: 4.2/10 → 6.8/10 (+2.6) │ ││ │ │ │ Sesiones completadas: 6 de 8 │ ││ │ │ └────────────────────────────────────────────────────┘ ││ │ └──────────────────────────────────────────────────────────┘│ │ │ │ ┌──────────────────────────────────────────────────────────┐│ │ │ DIARIO EMOCIONAL (HOY) ││ │ │ ┌────────────────────────────────────────────────────┐ ││ │ │ │ ¿Cómo te sientes hoy? │ ││ │ │ │ │ ││ │ │ │ [😢] [🙁] [😐] [🙂] [😊] → Seleccionado: 😐 │ ││ │ │ │ │ ││ │ │ │ ¿Qué ha pasado hoy? │ ││ │ │ │ ┌────────────────────────────────────────────┐ │ ││ │ │ │ │ He tenido una discusión con mi pareja y │ │ ││ │ │ │ │ me siento frustrada... no sé cómo │ │ ││ │ │ │ │ manejar estas situaciones... │ │ ││ │ │ │ └────────────────────────────────────────────┘ │ ││ │ │ │ │ ││ │ │ │ [Enviar] (Te quedan 12 min de IA hoy) │ ││ │ │ └────────────────────────────────────────────────────┘ ││ │ │ ││ │ │ ┌────────────────────────────────────────────────────┐ ││ │ │ │ RESPUESTA DE IA (vía DeepSeek-R1-70B en GPU local)│ ││ │ │ │ │ ││ │ │ │ <thought> │ ││ │ │ │ La paciente reporta frustración post-conflicto │ ││ │ │ │ de pareja. Identifico posible patrón de │ ││ │ │ │ comunicación no asertiva. La emoción base │ ││ │ │ │ parece ser tristeza/impotencia más que ira. │ ││ │ │ │ </thought> │ ││ │ │ │ │ ││ │ │ │ "Entiendo que te sientas frustrada. Las │ ││ │ │ │ discusiones de pareja suelen activar patrones │ ││ │ │ │ de comunicación que no siempre reflejan lo que │ ││ │ │ │ realmente queremos expresar. │ ││ │ │ │ │ ││ │ │ │ ¿Has notado alguna señal física antes de que │ ││ │ │ │ comenzara la discusión? (tensión en hombros, │ ││ │ │ │ respiración acelerada...) │ ││ │ │ │ │ ││ │ │ │ 📝 Nota para tu psicóloga: Esta entrada ha sido │ ││ │ │ │ marcada para revisión en tu próxima sesión. │ ││ │ │ └────────────────────────────────────────────────────┘ ││ │ └──────────────────────────────────────────────────────────┘│ │ │ │ ┌──────────────────────────────────────────────────────────┐│ │ │ PRÓXIMAS SESIONES ││ │ │ ┌────────────────────────────────────────────────────┐ ││ │ │ │ 📅 Lun 02 Jun — 16:00 — Videollamada (45 min) │ ││ │ │ │ con Dra. María López │ ││ │ │ │ Temas: Comunicación asertiva │ ││ │ │ │ [Unirme] [Reprogramar] │ ││ │ │ │ │ ││ │ │ │ 📅 Vie 06 Jun — Revisión asíncrona │ ││ │ │ │ Tu psicóloga revisará tu diario semanal │ ││ │ │ │ y te dejará un video-briefing │ ││ │ │ └────────────────────────────────────────────────────┘ ││ │ └──────────────────────────────────────────────────────────┘│ │ │ │ ┌──────────────────────────────────────────────────────────┐│ │ │ PROGRESO Y RECURSOS ││ │ │ ┌──────┬──────┬──────┐ ┌──────────────────────────┐ ││ │ │ │Ánimo │Sueño │Ejer. │ │ Recursos recomendados │ ││ │ │ │ 6/10 │ 5.2h │ No │ │ - Ejercicio respiración │ ││ │ │ │ ↗25% │ ↘23% │ — │ │ - Hoja de comunicación │ ││ │ │ └──────┴──────┴──────┘ │ asertiva (validado por │ ││ │ │ │ tu psicóloga) │ ││ │ │ └──────────────────────────┘ ││ │ └──────────────────────────────────────────────────────────┘│ └──────────────────────────────────────────────────────────────┘

### 4.3 Panel Admin (Supervisión Global)

```
┌──────────────────────────────────────────────────────────────┐
│ [LOGO] ANCORA · Administración [Advertencias] │
├──────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ MÉTRICAS GLOBALES DEL SISTEMA ││
│ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ││
│ │ │ 47 │ │ 1,234 │ │ 89.2% │ │ 12.3% │ ││
│ │ │Psicólog.│ │Pacientes│ │Retención│ │Churn │ ││
│ │ │activos │ │activos │ │(30d) │ │mensual │ ││
│ │ └─────────┘ └─────────┘ └─────────┘ └─────────┘ ││
│ └──────────────────────────────────────────────────────────┘│
│ │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ GPU CLUSTER STATUS ││
│ │ ┌────────────┬──────┬────────┬────────┬───────────┐ ││
│ │ │ Servidor │ GPU │ VRAM │ Temp │ Slots │ ││
│ │ ├────────────┼──────┼────────┼────────┼───────────┤ ││
│ │ │ ancora-gpu1│ 0 │ 89% │ 72°C │ 9/10 oc. │ ││
│ │ │ ancora-gpu1│ 1 │ 92% │ 68°C │ 9/10 oc. │ ││
│ │ │ ancora-gpu2│ 0 │ 45% │ 55°C │ 4/10 oc. │ ││
│ │ │ ancora-gpu2│ 1 │ 41% │ 53°C │ 4/10 oc. │ ││
│ │ └────────────┴──────┴────────┴────────┴───────────┘ ││
│ │ [Scale Up] [Balance Load] [View Logs] ││
│ └──────────────────────────────────────────────────────────┘│
│ │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ PAGOS Y COMPLIANCE ││
│ │ ┌────────────────────────────────────────────────────┐ ││
│ │ │ Ingresos del mes: 48,234€ │ ││
│ │ │ Pending payouts: 23,890€ (49 psicólogos) │ ││
│ │ │ Stripe Connect fees: 723€ │ ││
│ │ │ │ ││
│ │ │ ┌────────┬────────┬────────┬────────┬──────────┐ │ ││
│ │ │ │ ID │Psicólogo│Pacientes│ Ingreso│ Payout │ │ ││
│ │ │ ├────────┼────────┼────────┼────────┼──────────┤ │ ││
│ │ │ │ t-001 │Dra. L. │ 12 │ 960€ │ 468€ │ │ ││
│ │ │ │ t-002 │Dr. G. │ 8 │ 640€ │ 312€ │ │ ││
│ │ │ │ t-003 │Dr. M. │ 15 │ 1.200€ │ 585€ │ │ ││
│ │ │ └────────┴────────┴────────┴────────┴──────────┘ │ ││
│ │ └────────────────────────────────────────────────────┘ ││
│ │ ││
│ │ ┌────────────────────────────────────────────────────┐ ││
│ │ │ AUDITORÍA Y LOGS INMUTABLES │ ││
│ │ │ ┌──────┬───────────┬──────────┬────────────────┐ │ ││
│ │ │ │ Hora │ Usuario │ Acción │ Hash Check │ │ ││
│ │ │ ├──────┼───────────┼──────────┼────────────────┤ │ ││
│ │ │ │09:15 │ p-ana-g │ read │ 0x7F3A...B1C2 │ │ ││
│ │ │ │ │ │ diario │ ✓ Valido │ │ ││
│ │ │ │09:17 │ p-ana-g │ read │ 0x9E12...D4F5 │ │ ││
│ │ │ │ │ │ sesiones │ ✓ Valido │ │ ││
│ │ │ └──────┴───────────┴──────────┴────────────────┘ │ ││
│ │ └────────────────────────────────────────────────────┘ ││
│ └──────────────────────────────────────────────────────────┘│
│ │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ ALERTAS Y COMPLIANCE ││
│ │ ┌──────────────────────────────────────────────────────┐││
│ │ │ 🟢 Todos los psicólogos tienen seguro RC activo │││
│ │ │ 🟢 Licencias COP verificadas (última: hoy 06:00) │││
│ │ │ 🟢 Backup WORM completado (03:12, 12.4GB) │││
│ │ │ 🟡 3 psicólogos sin Stripe Connect configurado │││
│ │ │ 🔴 1 psicólogo con licencia por expirar (<7 días) │││
│ │ └──────────────────────────────────────────────────────┘││
│ └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

┌──────────────────────────────────────────────────────────────┐ │ [LOGO] ANCORA · Administración [Advertencias] │ ├──────────────────────────────────────────────────────────────┤ │ │ │ ┌──────────────────────────────────────────────────────────┐│ │ │ MÉTRICAS GLOBALES DEL SISTEMA ││ │ │ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ││ │ │ │ 47 │ │ 1,234 │ │ 89.2% │ │ 12.3% │ ││ │ │ │Psicólog.│ │Pacientes│ │Retención│ │Churn │ ││ │ │ │activos │ │activos │ │(30d) │ │mensual │ ││ │ │ └─────────┘ └─────────┘ └─────────┘ └─────────┘ ││ │ └──────────────────────────────────────────────────────────┘│ │ │ │ ┌──────────────────────────────────────────────────────────┐│ │ │ GPU CLUSTER STATUS ││ │ │ ┌────────────┬──────┬────────┬────────┬───────────┐ ││ │ │ │ Servidor │ GPU │ VRAM │ Temp │ Slots │ ││ │ │ ├────────────┼──────┼────────┼────────┼───────────┤ ││ │ │ │ ancora-gpu1│ 0 │ 89% │ 72°C │ 9/10 oc. │ ││ │ │ │ ancora-gpu1│ 1 │ 92% │ 68°C │ 9/10 oc. │ ││ │ │ │ ancora-gpu2│ 0 │ 45% │ 55°C │ 4/10 oc. │ ││ │ │ │ ancora-gpu2│ 1 │ 41% │ 53°C │ 4/10 oc. │ ││ │ │ └────────────┴──────┴────────┴────────┴───────────┘ ││ │ │ [Scale Up] [Balance Load] [View Logs] ││ │ └──────────────────────────────────────────────────────────┘│ │ │ │ ┌──────────────────────────────────────────────────────────┐│ │ │ PAGOS Y COMPLIANCE ││ │ │ ┌────────────────────────────────────────────────────┐ ││ │ │ │ Ingresos del mes: 48,234€ │ ││ │ │ │ Pending payouts: 23,890€ (49 psicólogos) │ ││ │ │ │ Stripe Connect fees: 723€ │ ││ │ │ │ │ ││ │ │ │ ┌────────┬────────┬────────┬────────┬──────────┐ │ ││ │ │ │ │ ID │Psicólogo│Pacientes│ Ingreso│ Payout │ │ ││ │ │ │ ├────────┼────────┼────────┼────────┼──────────┤ │ ││ │ │ │ │ t-001 │Dra. L. │ 12 │ 960€ │ 468€ │ │ ││ │ │ │ │ t-002 │Dr. G. │ 8 │ 640€ │ 312€ │ │ ││ │ │ │ │ t-003 │Dr. M. │ 15 │ 1.200€ │ 585€ │ │ ││ │ │ │ └────────┴────────┴────────┴────────┴──────────┘ │ ││ │ │ └────────────────────────────────────────────────────┘ ││ │ │ ││ │ │ ┌────────────────────────────────────────────────────┐ ││ │ │ │ AUDITORÍA Y LOGS INMUTABLES │ ││ │ │ │ ┌──────┬───────────┬──────────┬────────────────┐ │ ││ │ │ │ │ Hora │ Usuario │ Acción │ Hash Check │ │ ││ │ │ │ ├──────┼───────────┼──────────┼────────────────┤ │ ││ │ │ │ │09:15 │ p-ana-g │ read │ 0x7F3A...B1C2 │ │ ││ │ │ │ │ │ │ diario │ ✓ Valido │ │ ││ │ │ │ │09:17 │ p-ana-g │ read │ 0x9E12...D4F5 │ │ ││ │ │ │ │ │ │ sesiones │ ✓ Valido │ │ ││ │ │ │ └──────┴───────────┴──────────┴────────────────┘ │ ││ │ │ └────────────────────────────────────────────────────┘ ││ │ └──────────────────────────────────────────────────────────┘│ │ │ │ ┌──────────────────────────────────────────────────────────┐│ │ │ ALERTAS Y COMPLIANCE ││ │ │ ┌──────────────────────────────────────────────────────┐││ │ │ │ 🟢 Todos los psicólogos tienen seguro RC activo │││ │ │ │ 🟢 Licencias COP verificadas (última: hoy 06:00) │││ │ │ │ 🟢 Backup WORM completado (03:12, 12.4GB) │││ │ │ │ 🟡 3 psicólogos sin Stripe Connect configurado │││ │ │ │ 🔴 1 psicólogo con licencia por expirar (<7 días) │││ │ │ └──────────────────────────────────────────────────────┘││ │ └──────────────────────────────────────────────────────────┘│ └──────────────────────────────────────────────────────────────┘

## 5. ARQUITECTURA BACKEND ESCALABLE

### 5.1 Diagrama General de Arquitectura

```
┌─────────────┐
 │ DNS/Cloudflare │
 │ (DDoS, WAF, SSL)│
 └──────┬───────┘
 │
 ▼
 ┌─────────────┐
 │ Nginx (L7) │
 │ (Rate limit, │
 │ SSL term) │
 └──────┬───────┘
 │
 ┌─────────────────┼─────────────────┐
 │ │ │
 ▼ ▼ ▼
 ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
 │ API REST │ │ WebSocket │ │ IA Gateway │
 │ (Express/ │ │ (Socket.io) │ │ (FastAPI/ │
 │ NestJS) │ │ (Chat real) │ │ vLLM proxy) │
 └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
 │ │ │
 ▼ ▼ ▼
 ┌──────────────────────────────────────────────┐
 │ REDIS CLUSTER │
 │ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ │
 │ │ Cache │ │ BullMQ │ │ Session│ │Rate │ │
 │ │ tenant │ │ queues │ │ Store │ │Limit │ │
 │ │prefix │ │ x3 │ │ │ │ │ │
 │ └────────┘ └────────┘ └────────┘ └──────┘ │
 └──────────────────────────────────────────────┘
 │ │
 ▼ ▼
 ┌──────────────────────────────────────────────┐
 │ POSTGRESQL CLUSTER (Patroni) │
 │ ┌────────────────┐ ┌──────────────────────┐ │
 │ │ Schema Public │ │ Schema per Tenant │ │
 │ │ (global) │ │ (tenant_<uuid>) │ │
 │ │ - usuarios │ │ - pacientes │ │
 │ │ - tenants │ │ - sesiones │ │
 │ │ - perfiles pub │ │ - diarios │ │
 │ │ - facturacion │ │ - notas_soap │ │
 │ │ - logs │ │ - mensajes │ │
 │ └────────────────┘ └──────────────────────┘ │
 │ + RLS policies + cifrado BYTEA │
 └──────────────────────────────────────────────┘
 │
 ▼
 ┌──────────────────────────────────────────────┐
 │ OBJECT STORAGE (S3/MinIO) │
 │ ┌────────────────┐ ┌──────────────────────┐ │
 │ │ Documentos │ │ Backups WORM │ │
 │ │ (cifrados AES) │ │ (inmutables, cifr.) │ │
 │ │ - grabaciones │ │ - diarios (increm) │ │
 │ │ - fotos │ │ - semanales (full) │ │
 │ │ - documentos │ │ - retención 5 años │ │
 │ └────────────────┘ └──────────────────────┘ │
 └──────────────────────────────────────────────┘
```

┌─────────────┐ │ DNS/Cloudflare │ │ (DDoS, WAF, SSL)│ └──────┬───────┘ │ ▼ ┌─────────────┐ │ Nginx (L7) │ │ (Rate limit, │ │ SSL term) │ └──────┬───────┘ │ ┌─────────────────┼─────────────────┐ │ │ │ ▼ ▼ ▼ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │ API REST │ │ WebSocket │ │ IA Gateway │ │ (Express/ │ │ (Socket.io) │ │ (FastAPI/ │ │ NestJS) │ │ (Chat real) │ │ vLLM proxy) │ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ │ │ │ ▼ ▼ ▼ ┌──────────────────────────────────────────────┐ │ REDIS CLUSTER │ │ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────┐ │ │ │ Cache │ │ BullMQ │ │ Session│ │Rate │ │ │ │ tenant │ │ queues │ │ Store │ │Limit │ │ │ │prefix │ │ x3 │ │ │ │ │ │ │ └────────┘ └────────┘ └────────┘ └──────┘ │ └──────────────────────────────────────────────┘ │ │ ▼ ▼ ┌──────────────────────────────────────────────┐ │ POSTGRESQL CLUSTER (Patroni) │ │ ┌────────────────┐ ┌──────────────────────┐ │ │ │ Schema Public │ │ Schema per Tenant │ │ │ │ (global) │ │ (tenant_<uuid>) │ │ │ │ - usuarios │ │ - pacientes │ │ │ │ - tenants │ │ - sesiones │ │ │ │ - perfiles pub │ │ - diarios │ │ │ │ - facturacion │ │ - notas_soap │ │ │ │ - logs │ │ - mensajes │ │ │ └────────────────┘ └──────────────────────┘ │ │ + RLS policies + cifrado BYTEA │ └──────────────────────────────────────────────┘ │ ▼ ┌──────────────────────────────────────────────┐ │ OBJECT STORAGE (S3/MinIO) │ │ ┌────────────────┐ ┌──────────────────────┐ │ │ │ Documentos │ │ Backups WORM │ │ │ │ (cifrados AES) │ │ (inmutables, cifr.) │ │ │ │ - grabaciones │ │ - diarios (increm) │ │ │ │ - fotos │ │ - semanales (full) │ │ │ │ - documentos │ │ - retención 5 años │ │ │ └────────────────┘ └──────────────────────┘ │ └──────────────────────────────────────────────┘

### 5.2 API: REST vs GraphQL

Decisión: REST como principal, GraphQL solo para consultas complejas del dashboard.

Uso en Ancora:

- 95% REST : Autenticación, pacientes, sesiones, facturación, directorio.

- 5% GraphQL : Dashboard del psicólogo (múltiples fuentes agregadas en 1 query).

### 5.3 Endpoints Clave REST

```
# AUTENTICACIÓN
POST /api/v1/auth/register - Registro paciente
POST /api/v1/auth/login - Login (deriva KEK)
POST /api/v1/auth/refresh - Refresh JWT
POST /api/v1/auth/logout - Invalida refresh token
POST /api/v1/auth/forgot-password - Reset (pierde KEK)
POST /api/v1/auth/reset-password - Nuevo KEK

# PSICÓLOGOS (multi-tenant)
POST /api/v1/psychologists/register - Alta psicólogo (KYC)
GET /api/v1/psychologists/profile - Perfil privado
PUT /api/v1/psychologists/profile - Actualizar perfil público
POST /api/v1/psychologists/verify - Verificar colegiación

# PACIENTES (dentro del tenant)
GET /api/v1/patients - Listar pacientes
GET /api/v1/patients/:id - Detalle paciente
POST /api/v1/patients - Crear paciente
POST /api/v1/patients/:id/invite - Enviar invitación
POST /api/v1/patients/batch/import - CSV masivo

# SESIONES
GET /api/v1/sessions - Calendario sesiones
POST /api/v1/sessions - Crear sesión
PUT /api/v1/sessions/:id - Reprogramar
DELETE /api/v1/sessions/:id - Cancelar
POST /api/v1/sessions/:id/start-video - Iniciar WebRTC

# DIARIO / CHAT IA
POST /api/v1/diary/entry - Crear entrada diario
GET /api/v1/diary/history - Historial diario
POST /api/v1/diary/send-to-ai - Enviar al LLM local

# NOTAS SOAP
GET /api/v1/soap/patients/:id/latest - Última nota SOAP
POST /api/v1/soap/patients/:id - Generar borrador IA
PUT /api/v1/soap/:id - Actualizar (firmar)

# DIRECTORIO PÚBLICO
GET /api/v1/directory - Listar psicólogos
GET /api/v1/directory/:slug - Perfil público

# FACTURACIÓN
GET /api/v1/billing/plans - Planes disponibles
POST /api/v1/billing/subscribe - Stripe checkout
GET /api/v1/billing/invoices - Historial facturas
POST /api/v1/billing/cancel - Cancelar suscripción

# ADMIN
GET /api/v1/admin/metrics - Métricas globales
GET /api/v1/admin/gpu-status - Estado GPU cluster
GET /api/v1/admin/audit-log - Logs de auditoría
POST /api/v1/admin/backup/trigger - Backup manual
```

# AUTENTICACIÓN POST /api/v1/auth/register - Registro paciente POST /api/v1/auth/login - Login (deriva KEK) POST /api/v1/auth/refresh - Refresh JWT POST /api/v1/auth/logout - Invalida refresh token POST /api/v1/auth/forgot-password - Reset (pierde KEK) POST /api/v1/auth/reset-password - Nuevo KEK # PSICÓLOGOS (multi-tenant) POST /api/v1/psychologists/register - Alta psicólogo (KYC) GET /api/v1/psychologists/profile - Perfil privado PUT /api/v1/psychologists/profile - Actualizar perfil público POST /api/v1/psychologists/verify - Verificar colegiación # PACIENTES (dentro del tenant) GET /api/v1/patients - Listar pacientes GET /api/v1/patients/:id - Detalle paciente POST /api/v1/patients - Crear paciente POST /api/v1/patients/:id/invite - Enviar invitación POST /api/v1/patients/batch/import - CSV masivo # SESIONES GET /api/v1/sessions - Calendario sesiones POST /api/v1/sessions - Crear sesión PUT /api/v1/sessions/:id - Reprogramar DELETE /api/v1/sessions/:id - Cancelar POST /api/v1/sessions/:id/start-video - Iniciar WebRTC # DIARIO / CHAT IA POST /api/v1/diary/entry - Crear entrada diario GET /api/v1/diary/history - Historial diario POST /api/v1/diary/send-to-ai - Enviar al LLM local # NOTAS SOAP GET /api/v1/soap/patients/:id/latest - Última nota SOAP POST /api/v1/soap/patients/:id - Generar borrador IA PUT /api/v1/soap/:id - Actualizar (firmar) # DIRECTORIO PÚBLICO GET /api/v1/directory - Listar psicólogos GET /api/v1/directory/:slug - Perfil público # FACTURACIÓN GET /api/v1/billing/plans - Planes disponibles POST /api/v1/billing/subscribe - Stripe checkout GET /api/v1/billing/invoices - Historial facturas POST /api/v1/billing/cancel - Cancelar suscripción # ADMIN GET /api/v1/admin/metrics - Métricas globales GET /api/v1/admin/gpu-status - Estado GPU cluster GET /api/v1/admin/audit-log - Logs de auditoría POST /api/v1/admin/backup/trigger - Backup manual

### 5.4 Autenticación JWT con Roles y Permisos

Estructura del token JWT:

```
{
 "sub": "550e8400-e29b-41d4-a716-446655440000",
 "role": "patient",
 "tenant_id": "660e8400-e29b-41d4-a716-446655440001",
 "psychologist_id": null,
 "permissions": [
 "diary:read",
 "diary:write",
 "session:read",
 "session:write_own"
 ],
 "kek_salt": "a1b2c3d4e5f6...",
 "iat": 1717119600,
 "exp": 1717123200
}
```

{ "sub": "550e8400-e29b-41d4-a716-446655440000", "role": "patient", "tenant_id": "660e8400-e29b-41d4-a716-446655440001", "psychologist_id": null, "permissions": [ "diary:read", "diary:write", "session:read", "session:write_own" ], "kek_salt": "a1b2c3d4e5f6...", "iat": 1717119600, "exp": 1717123200 }

Roles y permisos:

`superadmin`

`admin`

`psychologist`

`patient`

`support`

Middleware de autorización:

```
function authorize(...requiredPermissions: string[]) {
 return (req: Request, res: Response, next: NextFunction) => {
 const user = req.user; // Seteado por middleware JWT

 // Superadmin bypass
 if (user.role === 'superadmin') return next();

 // Verificar tenant context
 if (user.tenant_id !== req.headers['x-tenant-id']) {
 return res.status(403).json({ error: 'cross_tenant_access_denied' });
 }

 // Verificar permisos
 const hasPermission = requiredPermissions.every(
 p => user.permissions.includes(p)
 );

 if (!hasPermission) {
 return res.status(403).json({ error: 'insufficient_permissions' });
 }

 next();
 };
}

// Uso en endpoints
router.get(
 '/api/v1/patients/:id',
 authenticate,
 authorize('patient:read'),
 patientController.getById
);
```

function authorize(...requiredPermissions: string[]) { return (req: Request, res: Response, next: NextFunction) => { const user = req.user; // Seteado por middleware JWT // Superadmin bypass if (user.role === 'superadmin') return next(); // Verificar tenant context if (user.tenant_id !== req.headers['x-tenant-id']) { return res.status(403).json({ error: 'cross_tenant_access_denied' }); } // Verificar permisos const hasPermission = requiredPermissions.every( p => user.permissions.includes(p) ); if (!hasPermission) { return res.status(403).json({ error: 'insufficient_permissions' }); } next(); }; } // Uso en endpoints router.get( '/api/v1/patients/:id', authenticate, authorize('patient:read'), patientController.getById );

Refresh token rotation:

- Access token: 30 min (corto, mínimo riesgo)

- Refresh token: 7 días (rotación con familia de tokens)

- KEK derivado del password: hasta logout o cambio de password

### 5.5 PostgreSQL: Esquema por Tenant + RLS

Arquitectura de schemas:

```
-- Schema global
CREATE SCHEMA public;
 -- Tablas globales: usuarios, tenants, perfiles, facturación, logs

-- Schema por tenant (creado en onboarding del psicólogo)
CREATE SCHEMA tenant_660e8400_e29b_41d4_a716_446655440001;
 -- Tablas clínicas aisladas

-- Función para crear schema de tenant
CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_id UUID)
RETURNS VOID AS $$
BEGIN
 EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', 'tenant_' || tenant_id);

 EXECUTE format('
 CREATE TABLE %I.pacientes (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 nombre VARCHAR(200) NOT NULL,
 email VARCHAR(255) UNIQUE NOT NULL,
 telefono VARCHAR(20),
 fecha_alta TIMESTAMPTZ DEFAULT NOW(),
 activo BOOLEAN DEFAULT true,
 notas_cifradas BYTEA, -- AES-256-GCM cifrado con KEK del paciente
 tenant_id UUID NOT NULL DEFAULT $1
 )', 'tenant_' || tenant_id, tenant_id);

 EXECUTE format('
 CREATE TABLE %I.sesiones (...)
 ', 'tenant_' || tenant_id);

 EXECUTE format('
 CREATE TABLE %I.diario_entries (
 id UUID PRIMARY KEY,
 paciente_id UUID NOT NULL REFERENCES %I.pacientes(id),
 contenido_cifrado BYTEA NOT NULL,
 tipo VARCHAR(20) DEFAULT ''texto'', -- texto | audio | mood
 mood_score INT CHECK (mood_score BETWEEN 1 AND 10),
 created_at TIMESTAMPTZ DEFAULT NOW(),
 tenant_id UUID NOT NULL
 )', 'tenant_' || tenant_id, 'tenant_' || tenant_id);

 -- RLS policies
 EXECUTE format('
 ALTER TABLE %I.diario_entries ENABLE ROW LEVEL SECURITY;
 CREATE POLICY tenant_isolation ON %I.diario_entries
 USING (tenant_id = current_setting(''app.tenant_id'')::UUID);
 ', 'tenant_' || tenant_id, 'tenant_' || tenant_id);
END;
$$ LANGUAGE plpgsql;
```

-- Schema global CREATE SCHEMA public; -- Tablas globales: usuarios, tenants, perfiles, facturación, logs -- Schema por tenant (creado en onboarding del psicólogo) CREATE SCHEMA tenant_660e8400_e29b_41d4_a716_446655440001; -- Tablas clínicas aisladas -- Función para crear schema de tenant CREATE OR REPLACE FUNCTION create_tenant_schema(tenant_id UUID) RETURNS VOID AS $$ BEGIN EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', 'tenant_' || tenant_id); EXECUTE format(' CREATE TABLE %I.pacientes ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), nombre VARCHAR(200) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, telefono VARCHAR(20), fecha_alta TIMESTAMPTZ DEFAULT NOW(), activo BOOLEAN DEFAULT true, notas_cifradas BYTEA, -- AES-256-GCM cifrado con KEK del paciente tenant_id UUID NOT NULL DEFAULT $1 )', 'tenant_' || tenant_id, tenant_id); EXECUTE format(' CREATE TABLE %I.sesiones (...) ', 'tenant_' || tenant_id); EXECUTE format(' CREATE TABLE %I.diario_entries ( id UUID PRIMARY KEY, paciente_id UUID NOT NULL REFERENCES %I.pacientes(id), contenido_cifrado BYTEA NOT NULL, tipo VARCHAR(20) DEFAULT ''texto'', -- texto | audio | mood mood_score INT CHECK (mood_score BETWEEN 1 AND 10), created_at TIMESTAMPTZ DEFAULT NOW(), tenant_id UUID NOT NULL )', 'tenant_' || tenant_id, 'tenant_' || tenant_id); -- RLS policies EXECUTE format(' ALTER TABLE %I.diario_entries ENABLE ROW LEVEL SECURITY; CREATE POLICY tenant_isolation ON %I.diario_entries USING (tenant_id = current_setting(''app.tenant_id'')::UUID); ', 'tenant_' || tenant_id, 'tenant_' || tenant_id); END; $$ LANGUAGE plpgsql;

Pool de conexiones con PgBouncer:

```
[databases]
* = host=127.0.0.1 port=5432 dbname=ancora

[pgbouncer]
pool_mode = transaction
max_client_conn = 500
default_pool_size = 50
reserve_pool_size = 10
reserve_pool_timeout = 5.0
server_reset_query = DISCARD ALL
```

[databases] * = host=127.0.0.1 port=5432 dbname=ancora [pgbouncer] pool_mode = transaction max_client_conn = 500 default_pool_size = 50 reserve_pool_size = 10 reserve_pool_timeout = 5.0 server_reset_query = DISCARD ALL

### 5.6 Redis por Tenant para Caché y Colas

Estrategia de namespacing (prefijo por tenant):

```
Redis Keys (prefijadas por tenant):
 cache:<tenant_id>:paciente:<id> → JSON perfil paciente (TTL 5min)
 cache:<tenant_id>:stats:dashboard → Dashboard stats (TTL 1min)
 rate:<tenant_id>:ia_requests:<patient_id> → Rate limit diario IA
 session:<tenant_id>:<patient_id> → Estado chat en curso

BullMQ Queue Names:
 bull:ia-high-priority:<tenant_id> → Chat IA tiempo real (prioridad alta)
 bull:ia-batch:<tenant_id> → Procesamiento nocturno (SOAP, RAG)
 bull:email:<tenant_id> → Emails transaccionales
 bull:notifications:<tenant_id> → Notificaciones push
 bull:batch-invitations:<tenant_id> → Invitaciones masivas CSV
```

Redis Keys (prefijadas por tenant): cache:<tenant_id>:paciente:<id> → JSON perfil paciente (TTL 5min) cache:<tenant_id>:stats:dashboard → Dashboard stats (TTL 1min) rate:<tenant_id>:ia_requests:<patient_id> → Rate limit diario IA session:<tenant_id>:<patient_id> → Estado chat en curso BullMQ Queue Names: bull:ia-high-priority:<tenant_id> → Chat IA tiempo real (prioridad alta) bull:ia-batch:<tenant_id> → Procesamiento nocturno (SOAP, RAG) bull:email:<tenant_id> → Emails transaccionales bull:notifications:<tenant_id> → Notificaciones push bull:batch-invitations:<tenant_id> → Invitaciones masivas CSV

Ejemplo de rate limiting por tenant para IA:

```
// Cada paciente tiene 15 min/día de chat IA
const RATE_LIMIT_KEY = `rate:${tenantId}:ia_requests:${patientId}`;

async function checkIaQuota(tenantId: string, patientId: string): Promise<{
 allowed: boolean;
 remainingMinutes: number;
}> {
 const dailyBudget = 15 * 60; // 15 minutos en segundos
 const key = `rate:${tenantId}:ia_requests:${patientId}`;

 // Usar campo TTL de Redis para expiry a medianoche
 const used = await redis.get(key);
 const secondsUsed = used ? parseInt(used) : 0;
 const remaining = Math.max(0, dailyBudget - secondsUsed);

 return {
 allowed: remaining > 0,
 remainingMinutes: Math.floor(remaining / 60)
 };
}

// Cada request de IA consume ~30 segundos de cuota
async function consumeIaQuota(tenantId: string, patientId: string, seconds: number = 30) {
 const key = `rate:${tenantId}:ia_requests:${patientId}`;
 const midnight = new Date();
 midnight.setHours(24, 0, 0, 0);
 const ttl = Math.floor((midnight.getTime() - Date.now()) / 1000);

 await redis.incrby(key, seconds);
 await redis.expire(key, ttl); // Expira a medianoche UTC+2
}
```

// Cada paciente tiene 15 min/día de chat IA const RATE_LIMIT_KEY = `rate:${tenantId}:ia_requests:${patientId}`; async function checkIaQuota(tenantId: string, patientId: string): Promise<{ allowed: boolean; remainingMinutes: number; }> { const dailyBudget = 15 * 60; // 15 minutos en segundos const key = `rate:${tenantId}:ia_requests:${patientId}`; // Usar campo TTL de Redis para expiry a medianoche const used = await redis.get(key); const secondsUsed = used ? parseInt(used) : 0; const remaining = Math.max(0, dailyBudget - secondsUsed); return { allowed: remaining > 0, remainingMinutes: Math.floor(remaining / 60) }; } // Cada request de IA consume ~30 segundos de cuota async function consumeIaQuota(tenantId: string, patientId: string, seconds: number = 30) { const key = `rate:${tenantId}:ia_requests:${patientId}`; const midnight = new Date(); midnight.setHours(24, 0, 0, 0); const ttl = Math.floor((midnight.getTime() - Date.now()) / 1000); await redis.incrby(key, seconds); await redis.expire(key, ttl); // Expira a medianoche UTC+2 }

### 5.7 Almacenamiento Cifrado de Sesiones y Documentos

Documentos almacenados:

Cifrado de archivos en cliente (navegador):

```
// Cliente: cifrar antes de subir
async function encryptFile(file, patientKek) {
 const iv = crypto.getRandomValues(new Uint8Array(12));
 const key = await crypto.subtle.importKey(
 'raw', patientKek, { name: 'AES-GCM' }, false, ['encrypt']
 );

 const encrypted = await crypto.subtle.encrypt(
 { name: 'AES-GCM', iv },
 key,
 file
 );

 return {
 encryptedBlob: new Blob([iv, new Uint8Array(encrypted)]),
 metadata: {
 algorithm: 'AES-256-GCM',
 iv: Array.from(iv),
 originalType: file.type,
 size: file.size
 }
 };
}

// Servidor: almacena ciegamente
app.post('/api/v1/documents/upload', async (req, res) => {
 // req.file ya viene cifrado desde el cliente
 const s3Key = `${req.user.tenantId}/documents/${uuidv4()}.enc`;
 await s3.putObject({
 Bucket: 'ancora-clinical-docs',
 Key: s3Key,
 Body: req.file.buffer,
 Metadata: { tenantId: req.user.tenantId, patientId: req.params.patientId }
 });
 res.json({ s3Key });
});
```

// Cliente: cifrar antes de subir async function encryptFile(file, patientKek) { const iv = crypto.getRandomValues(new Uint8Array(12)); const key = await crypto.subtle.importKey( 'raw', patientKek, { name: 'AES-GCM' }, false, ['encrypt'] ); const encrypted = await crypto.subtle.encrypt( { name: 'AES-GCM', iv }, key, file ); return { encryptedBlob: new Blob([iv, new Uint8Array(encrypted)]), metadata: { algorithm: 'AES-256-GCM', iv: Array.from(iv), originalType: file.type, size: file.size } }; } // Servidor: almacena ciegamente app.post('/api/v1/documents/upload', async (req, res) => { // req.file ya viene cifrado desde el cliente const s3Key = `${req.user.tenantId}/documents/${uuidv4()}.enc`; await s3.putObject({ Bucket: 'ancora-clinical-docs', Key: s3Key, Body: req.file.buffer, Metadata: { tenantId: req.user.tenantId, patientId: req.params.patientId } }); res.json({ s3Key }); });

### 5.8 Estrategia de Backups (Incrementales Diarios, WORM)

```
HORARIO DE BACKUPS
 
 00:00 ─── Backup FULL semanal (domingo) ───→ S3 Glacier (WORM)
 Retención: 12 semanas
 Política: Object Lock en modo Compliance (5 años)
 Inmutable: ni el admin root puede borrar

 03:00 ─── Backup INCREMENTAL diario ──────→ MinIO local + S3
 Retención: 30 días
 Archivos .sql.gz cifrados con AES-256

 04:00 ─── Backup WAL (cada 5 min) ────────→ S3 Standard
 Retención: 7 días
 Permite Point-In-Time Recovery

 05:00 ─── Backup DOCUMENTOS ──────────────→ S3 Glacier (WORM)
 Retención: 5 años mínimo (cumplimiento LOPD)
```

HORARIO DE BACKUPS 00:00 ─── Backup FULL semanal (domingo) ───→ S3 Glacier (WORM) Retención: 12 semanas Política: Object Lock en modo Compliance (5 años) Inmutable: ni el admin root puede borrar 03:00 ─── Backup INCREMENTAL diario ──────→ MinIO local + S3 Retención: 30 días Archivos .sql.gz cifrados con AES-256 04:00 ─── Backup WAL (cada 5 min) ────────→ S3 Standard Retención: 7 días Permite Point-In-Time Recovery 05:00 ─── Backup DOCUMENTOS ──────────────→ S3 Glacier (WORM) Retención: 5 años mínimo (cumplimiento LOPD)

Configuración de WORM (Object Lock) con AWS S3:

```
# Backup semanal con Object Lock Compliance Mode
aws s3api put-object-lock-configuration \
 --bucket ancora-backups-clinicos \
 --object-lock-configuration '{
 "ObjectLockEnabled": "Enabled",
 "Rule": {
 "DefaultRetention": {
 "Mode": "COMPLIANCE",
 "Days": 1825 # 5 años
 }
 }
 }'

# Subir backup con retención explícita
aws s3 cp ancora_weekly_20260531.sql.gz.gpg \
 s3://ancora-backups-clinicos/weekly/ \
 --object-lock-mode COMPLIANCE \
 --object-lock-retain-until-date "2031-05-31T00:00:00Z"
```

# Backup semanal con Object Lock Compliance Mode aws s3api put-object-lock-configuration \ --bucket ancora-backups-clinicos \ --object-lock-configuration '{ "ObjectLockEnabled": "Enabled", "Rule": { "DefaultRetention": { "Mode": "COMPLIANCE", "Days": 1825 # 5 años } } }' # Subir backup con retención explícita aws s3 cp ancora_weekly_20260531.sql.gz.gpg \ s3://ancora-backups-clinicos/weekly/ \ --object-lock-mode COMPLIANCE \ --object-lock-retain-until-date "2031-05-31T00:00:00Z"

Script de backup con pg_dump por tenant:

```
#!/bin/bash
# backup_diario.sh — Backup incremental por schema

BACKUP_DIR="/mnt/backups/incremental"
DATE=$(date +%Y%m%d_%H%M)
TENANTS=$(psql -t -c "SELECT schema_name FROM information_schema.schemata
 WHERE schema_name LIKE 'tenant_%'")

for tenant in $TENANTS; do
 # Cifrar con clave del HSM
 pg_dump -n "$tenant" ancora | gzip | \
 gpg --encrypt --recipient BACKUP_MASTER_KEY \
 > "$BACKUP_DIR/${tenant}_${DATE}.sql.gz.gpg"
done

# Subir a S3 con WORM
aws s3 cp "$BACKUP_DIR/" "s3://ancora-backups-clinicos/incremental/" \
 --recursive \
 --object-lock-mode COMPLIANCE \
 --object-lock-retain-until-date $(date -d "+30 days" +%Y-%m-%dT%H:%M:%SZ)
```

#!/bin/bash # backup_diario.sh — Backup incremental por schema BACKUP_DIR="/mnt/backups/incremental" DATE=$(date +%Y%m%d_%H%M) TENANTS=$(psql -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant_%'") for tenant in $TENANTS; do # Cifrar con clave del HSM pg_dump -n "$tenant" ancora | gzip | \ gpg --encrypt --recipient BACKUP_MASTER_KEY \ > "$BACKUP_DIR/${tenant}_${DATE}.sql.gz.gpg" done # Subir a S3 con WORM aws s3 cp "$BACKUP_DIR/" "s3://ancora-backups-clinicos/incremental/" \ --recursive \ --object-lock-mode COMPLIANCE \ --object-lock-retain-until-date $(date -d "+30 days" +%Y-%m-%dT%H:%M:%SZ)

Crypto-shredding (baja definitiva de paciente):

```
-- En lugar de borrar datos físicos, destruimos la clave
DELETE FROM tenant_keys WHERE tenant_id = $1 AND paciente_id = $2;
-- Todos los BYTEA cifrados pasan a ser indescifrables irreversiblemente
-- Los backups WORM aún existen, pero son ilegibles = cumplimiento legal
```

-- En lugar de borrar datos físicos, destruimos la clave DELETE FROM tenant_keys WHERE tenant_id = $1 AND paciente_id = $2; -- Todos los BYTEA cifrados pasan a ser indescifrables irreversiblemente -- Los backups WORM aún existen, pero son ilegibles = cumplimiento legal

## 6. IA MULTI-TENANT

### 6.1 Arquitectura de Inferencia Compartida con Aislamiento

```
┌─────────────────────────────────┐
 │ CLUSTER GPU LOCAL │
 │ (Dual RTX 4090 — 48GB VRAM) │
 │ vLLM con Tensor Parallelism TP=2│
 └──────────────┬──────────────────┘
 │
 ┌────────────────┼──────────────────┐
 │ │ │
 ▼ ▼ ▼
 ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
 │ tenant_001 │ │ tenant_002 │ │ tenant_003 │
 │ queue │ │ queue │ │ queue │
 │ (BullMQ) │ │ (BullMQ) │ │ (BullMQ) │
 └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
 │ │ │
 └─────────────────┼──────────────────┘
 │
 ▼
 ┌──────────────────┐
 │ IA Gateway │
 │ (FastAPI) │
 │ │
 │ 1. Descifrar │
 │ prompt (RAM) │
 │ 2. Formatear │
 │ system prompt │
 │ 3. Enviar a vLLM │
 │ 4. Cifrar resp. │
 │ 5. Zero memory │
 └──────────────────┘
 │
 ▼
 ┌──────────────────┐
 │ vLLM Server │
 │ (GPU 0 & 1) │
 │ │
 │ - No logging │
 │ - mlock RAM │
 │ - No swap │
 │ - Context per │
 │ tenant slot │
 └──────────────────┘
```

┌─────────────────────────────────┐ │ CLUSTER GPU LOCAL │ │ (Dual RTX 4090 — 48GB VRAM) │ │ vLLM con Tensor Parallelism TP=2│ └──────────────┬──────────────────┘ │ ┌────────────────┼──────────────────┐ │ │ │ ▼ ▼ ▼ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │ tenant_001 │ │ tenant_002 │ │ tenant_003 │ │ queue │ │ queue │ │ queue │ │ (BullMQ) │ │ (BullMQ) │ │ (BullMQ) │ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ │ │ │ └─────────────────┼──────────────────┘ │ ▼ ┌──────────────────┐ │ IA Gateway │ │ (FastAPI) │ │ │ │ 1. Descifrar │ │ prompt (RAM) │ │ 2. Formatear │ │ system prompt │ │ 3. Enviar a vLLM │ │ 4. Cifrar resp. │ │ 5. Zero memory │ └──────────────────┘ │ ▼ ┌──────────────────┐ │ vLLM Server │ │ (GPU 0 & 1) │ │ │ │ - No logging │ │ - mlock RAM │ │ - No swap │ │ - Context per │ │ tenant slot │ └──────────────────┘

### 6.2 Cola de Inferencia por Tenant

Estructura de colas BullMQ:

```
// Cada tenant tiene su propia cola de inferencia
const iaQueues = new Map<string, Queue>();

function getIaQueue(tenantId: string): Queue {
 if (!iaQueues.has(tenantId)) {
 iaQueues.set(tenantId, new Queue(
 `ia-${tenantId}`,
 {
 redis: { host: 'redis-cluster', port: 6379 },
 defaultJobOptions: {
 removeOnComplete: true, // No persistir prompts procesados
 removeOnFail: 100, // Solo últimos 100 fallos
 attempts: 3,
 backoff: { type: 'exponential', delay: 1000 }
 }
 }
 ));
 }
 return iaQueues.get(tenantId)!;
}
```

// Cada tenant tiene su propia cola de inferencia const iaQueues = new Map<string, Queue>(); function getIaQueue(tenantId: string): Queue { if (!iaQueues.has(tenantId)) { iaQueues.set(tenantId, new Queue( `ia-${tenantId}`, { redis: { host: 'redis-cluster', port: 6379 }, defaultJobOptions: { removeOnComplete: true, // No persistir prompts procesados removeOnFail: 100, // Solo últimos 100 fallos attempts: 3, backoff: { type: 'exponential', delay: 1000 } } } )); } return iaQueues.get(tenantId)!; }

Priorización entre tenants:

```
// Policy de fairness: Round-robin ponderado por tamaño del tenant
class TenantFairnessScheduler {
 private tenantQuotas: Map<string, {
 patientsActivos: number; // N de pacientes
 slotsAsignados: number; // Slots de 15min/día total
 tokensConsumidosHoy: number; // Tracker de uso diario
 prioridad: number; // 1-10 (calculado)
 }>;

 // Calcular prioridad cada 5 minutos
 async recalculatePriorities() {
 // Prioridad base = pacientes activos / max_pacientes * 10
 // Penalización si ha consumido mucho hoy
 // Bonus si es hora punta para su franja horaria
 }

 // Obtener próximo job de la cola más prioritaria
 async dequeueNext(): Promise<Job | null> {
 const sortedTenants = [...this.tenantQuotas.entries()]
 .sort((a, b) => b[1].prioridad - a[1].prioridad);

 for (const [tenantId] of sortedTenants) {
 const queue = getIaQueue(tenantId);
 const job = await queue.getNextJob();
 if (job) return job;
 }
 return null;
 }
}
```

// Policy de fairness: Round-robin ponderado por tamaño del tenant class TenantFairnessScheduler { private tenantQuotas: Map<string, { patientsActivos: number; // N de pacientes slotsAsignados: number; // Slots de 15min/día total tokensConsumidosHoy: number; // Tracker de uso diario prioridad: number; // 1-10 (calculado) }>; // Calcular prioridad cada 5 minutos async recalculatePriorities() { // Prioridad base = pacientes activos / max_pacientes * 10 // Penalización si ha consumido mucho hoy // Bonus si es hora punta para su franja horaria } // Obtener próximo job de la cola más prioritaria async dequeueNext(): Promise<Job | null> { const sortedTenants = [...this.tenantQuotas.entries()] .sort((a, b) => b[1].prioridad - a[1].prioridad); for (const [tenantId] of sortedTenants) { const queue = getIaQueue(tenantId); const job = await queue.getNextJob(); if (job) return job; } return null; } }

### 6.3 Contexto Cifrado en RAM Volátil

Pipeline de procesamiento (sin persistencia):

```
1. RECEPCIÓN: Job de BullMQ contiene prompt cifrado (BYTEA)

2. DESCIFRADO EN RAM:
 - Obtener KEK del tenant desde HSM (cifrado en tránsito)
 - Descifrar prompt con AES-256-GCM en buffer RAM
 - KEK descartado inmediatamente después
 - Variable: let decrypted = Buffer.alloc(0)

3. FORMATEO DEL PROMPT:
 - Inyectar system prompt clínico (del tenant, en RAM)
 - Inyectar contexto de sesión previa (solo últimos N tokens)
 - Ensamblar en estructura { system, messages, tools }

4. INFERENCIA vLLM:
 - Enviar a vLLM via HTTP (localhost:8000)
 - vLLM configurado sin logging
 - Respuesta en buffer RAM

5. CIFRADO DE RESPUESTA:
 - Cifrar con misma KEK (o KEK del paciente si es personal)
 - Almacenar solo BYTEA cifrado en PostgreSQL

6. ZEROING DE MEMORIA:
 - Sobrescribir buffers con ceros
 - Explicit Buffer.alloc(0) + garbage collection
```

1. RECEPCIÓN: Job de BullMQ contiene prompt cifrado (BYTEA) 2. DESCIFRADO EN RAM: - Obtener KEK del tenant desde HSM (cifrado en tránsito) - Descifrar prompt con AES-256-GCM en buffer RAM - KEK descartado inmediatamente después - Variable: let decrypted = Buffer.alloc(0) 3. FORMATEO DEL PROMPT: - Inyectar system prompt clínico (del tenant, en RAM) - Inyectar contexto de sesión previa (solo últimos N tokens) - Ensamblar en estructura { system, messages, tools } 4. INFERENCIA vLLM: - Enviar a vLLM via HTTP (localhost:8000) - vLLM configurado sin logging - Respuesta en buffer RAM 5. CIFRADO DE RESPUESTA: - Cifrar con misma KEK (o KEK del paciente si es personal) - Almacenar solo BYTEA cifrado en PostgreSQL 6. ZEROING DE MEMORIA: - Sobrescribir buffers con ceros - Explicit Buffer.alloc(0) + garbage collection

Configuración de vLLM para zero-persistencia:

```
# Flags de vLLM para entorno clínico
vllm serve deepseek-r1-distill-qwen-70b \
 --tensor-parallel-size 2 \
 --max-model-len 8192 \
 --gpu-memory-utilization 0.90 \
 --disable-log-requests \ # No loguear prompts
 --disable-log-stats \ # No loguear estadísticas
 --trust-remote-code \
 --enforce-eager \
 --max-num-batched-tokens 8192 \
 --max-num-seqs 8 \
 --kv-cache-dtype fp8 \
 --device cuda \
 --host 127.0.0.1 \
 --port 8000

# Kernel parameter: evitar swap
echo "vm.swappiness=0" >> /etc/sysctl.conf
echo "vm.overcommit_memory=1" >> /etc/sysctl.conf
sysctl -p

# mlock all: evitar que memoria con datos clínicos vaya a disco
# Se configura en systemd service
[Service]
LimitMEMLOCK=infinity
ExecStartPre=/bin/bash -c 'echo mlock > /sys/kernel/mm/transparent_hugepage/enabled'
```

# Flags de vLLM para entorno clínico vllm serve deepseek-r1-distill-qwen-70b \ --tensor-parallel-size 2 \ --max-model-len 8192 \ --gpu-memory-utilization 0.90 \ --disable-log-requests \ # No loguear prompts --disable-log-stats \ # No loguear estadísticas --trust-remote-code \ --enforce-eager \ --max-num-batched-tokens 8192 \ --max-num-seqs 8 \ --kv-cache-dtype fp8 \ --device cuda \ --host 127.0.0.1 \ --port 8000 # Kernel parameter: evitar swap echo "vm.swappiness=0" >> /etc/sysctl.conf echo "vm.overcommit_memory=1" >> /etc/sysctl.conf sysctl -p # mlock all: evitar que memoria con datos clínicos vaya a disco # Se configura en systemd service [Service] LimitMEMLOCK=infinity ExecStartPre=/bin/bash -c 'echo mlock > /sys/kernel/mm/transparent_hugepage/enabled'

Zeroing explícito en Node.js:

```
function secureZero(buffer: Buffer): void {
 buffer.fill(0);
 // Forzar que el optimizador V8 no elimine la operación
 // (usando crypto API para asegurar escritura)
 crypto.webcrypto.getRandomValues(buffer);
 buffer.fill(0);
}

// En el worker de IA
async function processIaRequest(job: Job) {
 const encryptedPrompt = Buffer.from(job.data.prompt, 'hex');
 const tenantKek = await getTenantKek(job.data.tenantId);

 // Buffer temporal (RAM)
 const decryptedPrompt = Buffer.alloc(encryptedPrompt.length);
 try {
 const decipher = crypto.createDecipheriv('aes-256-gcm', tenantKek, iv);
 decryptedPrompt.set(decipher.update(encryptedPrompt));

 // ... proceso de inferencia ...

 const response = await sendToVllm(decryptedPrompt.toString('utf-8'));
 const encryptedResponse = encryptWithKek(response, tenantKek);
 await storeEncrypted(job.data.patientId, encryptedResponse);
 } finally {
 // Zeroing forzoso
 secureZero(decryptedPrompt);
 secureZero(tenantKek);
 global.gc?.(); // Forzar GC si está disponible (--expose-gc)
 }
}
```

function secureZero(buffer: Buffer): void { buffer.fill(0); // Forzar que el optimizador V8 no elimine la operación // (usando crypto API para asegurar escritura) crypto.webcrypto.getRandomValues(buffer); buffer.fill(0); } // En el worker de IA async function processIaRequest(job: Job) { const encryptedPrompt = Buffer.from(job.data.prompt, 'hex'); const tenantKek = await getTenantKek(job.data.tenantId); // Buffer temporal (RAM) const decryptedPrompt = Buffer.alloc(encryptedPrompt.length); try { const decipher = crypto.createDecipheriv('aes-256-gcm', tenantKek, iv); decryptedPrompt.set(decipher.update(encryptedPrompt)); // ... proceso de inferencia ... const response = await sendToVllm(decryptedPrompt.toString('utf-8')); const encryptedResponse = encryptWithKek(response, tenantKek); await storeEncrypted(job.data.patientId, encryptedResponse); } finally { // Zeroing forzoso secureZero(decryptedPrompt); secureZero(tenantKek); global.gc?.(); // Forzar GC si está disponible (--expose-gc) } }

### 6.4 Sin Persistencia de Logs de Prompts/Respuestas

Política de no-logueo:

Configuración de Nginx para excluir bodies de logs:

```
# No loguear cuerpos de requests de IA
location /api/v1/diary/send-to-ai {
 access_log /var/log/nginx/ancora-ia.log main_body_off;
 # ...
}

# Formato de log sin body
log_format main_body_off '$remote_addr - $remote_user [$time_local] '
 '"$request" $status $body_bytes_sent '
 '"$http_referer" "$http_user_agent"';
```

# No loguear cuerpos de requests de IA location /api/v1/diary/send-to-ai { access_log /var/log/nginx/ancora-ia.log main_body_off; # ... } # Formato de log sin body log_format main_body_off '$remote_addr - $remote_user [$time_local] ' '"$request" $status $body_bytes_sent ' '"$http_referer" "$http_user_agent"';

### 6.5 Priorización y Fairness entre Psicólogos

Modelo de fairness:

```
Tenant A (psicólogo con 40 pacientes activos):
 - Prioridad base: 8/10
 - Slots/día: 40 * 15min = 600 min
 - Límite de requests concurrentes: 4
 - Latencia objetivo: < 2s

Tenant B (psicólogo nuevo, 5 pacientes):
 - Prioridad base: 4/10
 - Slots/día: 5 * 15min = 75 min
 - Límite de requests concurrentes: 2
 - Latencia objetivo: < 3s

Tenant C (psicólogo premium, 25 pacientes, plan Intensivo):
 - Prioridad base: 9/10 (bonus por plan)
 - Slots/día: 25 * 30min = 750 min (doble por plan)
 - Límite de requests concurrentes: 6
 - Latencia objetivo: < 1.5s
```

Tenant A (psicólogo con 40 pacientes activos): - Prioridad base: 8/10 - Slots/día: 40 * 15min = 600 min - Límite de requests concurrentes: 4 - Latencia objetivo: < 2s Tenant B (psicólogo nuevo, 5 pacientes): - Prioridad base: 4/10 - Slots/día: 5 * 15min = 75 min - Límite de requests concurrentes: 2 - Latencia objetivo: < 3s Tenant C (psicólogo premium, 25 pacientes, plan Intensivo): - Prioridad base: 9/10 (bonus por plan) - Slots/día: 25 * 30min = 750 min (doble por plan) - Límite de requests concurrentes: 6 - Latencia objetivo: < 1.5s

Implementación con weighted fair queuing:

```
class WeightedFairQueue {
 private queues: Map<string, {
 jobs: Job[];
 weight: number; // Peso proporcional
 lastDequeued: number; // Timestamp último servicio
 }>;

 // Algoritmo de Deficit Round Robin
 async nextJob(): Promise<Job | null> {
 const now = Date.now();
 let bestTenant: string | null = null;
 let bestScore = -Infinity;

 for (const [tenantId, q] of this.queues) {
 if (q.jobs.length === 0) continue;

 // Tiempo desde último servicio (más espera = más prioridad)
 const waitTime = now - q.lastDequeued;

 // Score = weight * (waitTime / 1000) - penalización por uso excesivo
 const usagePenalty = await this.getUsagePenalty(tenantId);
 const score = q.weight * (waitTime / 1000) - usagePenalty;

 if (score > bestScore) {
 bestScore = score;
 bestTenant = tenantId;
 }
 }

 if (!bestTenant) return null;

 const q = this.queues.get(bestTenant)!;
 q.lastDequeued = now;
 return q.jobs.shift()!;
 }

 private async getUsagePenalty(tenantId: string): Promise<number> {
 // Penalización si ha consumido > 80% de su cuota horaria
 const key = `ia_quota:${tenantId}:${new Date().getHours()}`;
 const used = await redis.get(key) || 0;
 const quota = this.getTenantQuota(tenantId);

 if (used > quota * 0.8) {
 return (used - quota * 0.8) / quota * 10;
 }
 return 0;
 }
}
```

class WeightedFairQueue { private queues: Map<string, { jobs: Job[]; weight: number; // Peso proporcional lastDequeued: number; // Timestamp último servicio }>; // Algoritmo de Deficit Round Robin async nextJob(): Promise<Job | null> { const now = Date.now(); let bestTenant: string | null = null; let bestScore = -Infinity; for (const [tenantId, q] of this.queues) { if (q.jobs.length === 0) continue; // Tiempo desde último servicio (más espera = más prioridad) const waitTime = now - q.lastDequeued; // Score = weight * (waitTime / 1000) - penalización por uso excesivo const usagePenalty = await this.getUsagePenalty(tenantId); const score = q.weight * (waitTime / 1000) - usagePenalty; if (score > bestScore) { bestScore = score; bestTenant = tenantId; } } if (!bestTenant) return null; const q = this.queues.get(bestTenant)!; q.lastDequeued = now; return q.jobs.shift()!; } private async getUsagePenalty(tenantId: string): Promise<number> { // Penalización si ha consumido > 80% de su cuota horaria const key = `ia_quota:${tenantId}:${new Date().getHours()}`; const used = await redis.get(key) || 0; const quota = this.getTenantQuota(tenantId); if (used > quota * 0.8) { return (used - quota * 0.8) / quota * 10; } return 0; } }

### 6.6 Capacidad por Servidor (Dual RTX 4090)

Distribución de VRAM detallada:

```
GPU 0 (24 GB):
 ├── Model weights (AWQ 4-bit): 19.25 GB
 ├── KV Cache pool: 1.57 GB (~19,625 tokens)
 ├── Whisper (Fijo): 1.50 GB
 ├── CUDA overhead: 1.50 GB
 └── Margen: 0.18 GB
 ───────────────────────────────────────
 Total: 24.00 GB

GPU 1 (24 GB):
 ├── Model weights (AWQ 4-bit): 19.25 GB
 ├── KV Cache pool: 1.57 GB
 ├── CUDA overhead: 1.50 GB
 └── Margen: 1.68 GB
 ───────────────────────────────────────
 Total: 24.00 GB
```

GPU 0 (24 GB): ├── Model weights (AWQ 4-bit): 19.25 GB ├── KV Cache pool: 1.57 GB (~19,625 tokens) ├── Whisper (Fijo): 1.50 GB ├── CUDA overhead: 1.50 GB └── Margen: 0.18 GB ─────────────────────────────────────── Total: 24.00 GB GPU 1 (24 GB): ├── Model weights (AWQ 4-bit): 19.25 GB ├── KV Cache pool: 1.57 GB ├── CUDA overhead: 1.50 GB └── Margen: 1.68 GB ─────────────────────────────────────── Total: 24.00 GB

### 6.7 Aislamiento Criptográfico en la GPU

Ciclo completo de una request de IA multi-tenant:

```
[Paciente A - Tenant 001] [Paciente B - Tenant 002]
 │ │
 ▼ ▼
 Cifra mensaje con KEK A Cifra mensaje con KEK B
 │ │
 ▼ ▼
 ┌────────────────────────────────────────────────────┐
 │ API GATEWAY (FastAPI) │
 │ │
 │ 1. Descifra mensaje A con KEK A (RAM exclusiva) │
 │ 2. Descifra mensaje B con KEK B (RAM exclusiva) │
 │ 3. Formatea prompts con system prompt de cada │
 │ tenant │
 │ 4. Encola en cola de prioridad │
 └──────────────────────┬─────────────────────────────┘
 │
 ▼
 ┌────────────────────────────────────────────────────┐
 │ vLLM (GPU) │
 │ │
 │ Aislamiento garantizado por: │
 │ - KV Cache separada por request (vLLM nativo) │
 │ - Continuous batching: nunca mezcla contextos │
 │ de diferentes pacientes en el mismo lote │
 │ - Sin persistencia: VRAM se sobrescribe con │
 │ cada nuevo batch │
 │ - mlock: VRAM nunca va a swap en disco │
 │ - --disable-log-requests: ningún prompt se loguea │
 └──────────────────────┬─────────────────────────────┘
 │
 ▼
 ┌────────────────────────────────────────────────────┐
 │ API GATEWAY (FastAPI) │
 │ │
 │ 5. Recibe respuesta en RAM volátil │
 │ 6. Cifra respuesta A con KEK A │
 │ 7. Cifra respuesta B con KEK B │
 │ 8. Zeroing de buffers │
 │ 9. Envía BYTEA cifrado a PostgreSQL │
 └──────┬─────────────────────────────────┬───────────┘
 │ │
 ▼ ▼
 [Paciente A recibe respuesta] [Paciente B recibe respuesta]
 Solo KEK A puede descifrar Solo KEK B puede descifrar
```

[Paciente A - Tenant 001] [Paciente B - Tenant 002] │ │ ▼ ▼ Cifra mensaje con KEK A Cifra mensaje con KEK B │ │ ▼ ▼ ┌────────────────────────────────────────────────────┐ │ API GATEWAY (FastAPI) │ │ │ │ 1. Descifra mensaje A con KEK A (RAM exclusiva) │ │ 2. Descifra mensaje B con KEK B (RAM exclusiva) │ │ 3. Formatea prompts con system prompt de cada │ │ tenant │ │ 4. Encola en cola de prioridad │ └──────────────────────┬─────────────────────────────┘ │ ▼ ┌────────────────────────────────────────────────────┐ │ vLLM (GPU) │ │ │ │ Aislamiento garantizado por: │ │ - KV Cache separada por request (vLLM nativo) │ │ - Continuous batching: nunca mezcla contextos │ │ de diferentes pacientes en el mismo lote │ │ - Sin persistencia: VRAM se sobrescribe con │ │ cada nuevo batch │ │ - mlock: VRAM nunca va a swap en disco │ │ - --disable-log-requests: ningún prompt se loguea │ └──────────────────────┬─────────────────────────────┘ │ ▼ ┌────────────────────────────────────────────────────┐ │ API GATEWAY (FastAPI) │ │ │ │ 5. Recibe respuesta en RAM volátil │ │ 6. Cifra respuesta A con KEK A │ │ 7. Cifra respuesta B con KEK B │ │ 8. Zeroing de buffers │ │ 9. Envía BYTEA cifrado a PostgreSQL │ └──────┬─────────────────────────────────┬───────────┘ │ │ ▼ ▼ [Paciente A recibe respuesta] [Paciente B recibe respuesta] Solo KEK A puede descifrar Solo KEK B puede descifrar

### 6.8 Escalabilidad Horizontal (N servidores GPU)

```
Cuando un servidor GPU alcanza >80% de ocupación sostenida:

┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ GPU Server 1 │ │ GPU Server 2 │ │ GPU Server N │
│ (Dual 4090) │ │ (Dual 4090) │ │ (Dual 4090) │
│ Tenants: │ │ Tenants: │ │ Tenants: │
│ A, B, C │ │ D, E, F │ │ G, H, I │
│ Ocupación: 75% │ │ Ocupación: 82% │ │ Ocupación: 45% │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
 │ │ │
 └──────────────────────┼──────────────────────┘
 │
 ▼
 ┌──────────────────────┐
 │ Orchestrator │
 │ (balanceador) │
 │ │
 │ - Asigna tenants a │
 │ servidores │
 │ - Rebalancea cada │
 │ 60 min │
 │ - Migra tenants si │
 │ un server falla │
 └──────────────────────┘
```

Cuando un servidor GPU alcanza >80% de ocupación sostenida: ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │ GPU Server 1 │ │ GPU Server 2 │ │ GPU Server N │ │ (Dual 4090) │ │ (Dual 4090) │ │ (Dual 4090) │ │ Tenants: │ │ Tenants: │ │ Tenants: │ │ A, B, C │ │ D, E, F │ │ G, H, I │ │ Ocupación: 75% │ │ Ocupación: 82% │ │ Ocupación: 45% │ └────────┬────────┘ └────────┬────────┘ └────────┬────────┘ │ │ │ └──────────────────────┼──────────────────────┘ │ ▼ ┌──────────────────────┐ │ Orchestrator │ │ (balanceador) │ │ │ │ - Asigna tenants a │ │ servidores │ │ - Rebalancea cada │ │ 60 min │ │ - Migra tenants si │ │ un server falla │ └──────────────────────┘

Migración de tenant entre servidores (sin downtime):

```
1. Orchestrator detecta server 2 > 80% ocupación
2. Selecciona tenant F (menor carga) para migrar a server 3
3. Server 3 carga el modelo (si no está ya cargado) (~30s)
4. Se replica KV Cache caliente de tenant F a server 3
5. Redis actualiza routing: ia_router:tenant_F → server_3
6. Nuevas requests van a server 3
7. Server 2 drena requests pendientes de tenant F
8. Server 2 libera VRAM de tenant F
```

1. Orchestrator detecta server 2 > 80% ocupación 2. Selecciona tenant F (menor carga) para migrar a server 3 3. Server 3 carga el modelo (si no está ya cargado) (~30s) 4. Se replica KV Cache caliente de tenant F a server 3 5. Redis actualiza routing: ia_router:tenant_F → server_3 6. Nuevas requests van a server 3 7. Server 2 drena requests pendientes de tenant F 8. Server 2 libera VRAM de tenant F

## APÉNDICE A: Glosario de Términos Técnicos

## APÉNDICE B: Decisiones Técnicas Clave

- Schema-per-tenant + RLS en lugar de DB separada: Por coste operativo y flexibilidad. Un cluster PostgreSQL puede manejar cientos de miles de pacientes con aislamiento criptográfico.

- REST > GraphQL para 95% de la API : Por simplicidad de caching, rate limiting y seguridad. GraphQL reservado para queries agregadas del dashboard.

- BullMQ sobre Redis nativo : Por persistencia de jobs, reintentos automáticos, y visibilidad del estado de colas.

- vLLM como engine de inferencia : Por su continuous batching nativo, PagedAttention para gestión eficiente de KV Cache, y soporte para Tensor Parallelism.

- No persistencia de logs de IA : Por cumplimiento RGPD (Art. 9) y confianza del paciente. Los prompts se cifran antes de entrar a la cola y se descifran solo en RAM volátil por milisegundos.

- mlock + swappiness=0 : Para garantizar que datos clínicos en RAM nunca se escriban en disco (swap), incluso bajo presión de memoria.

- Stripe Connect con split payments : Para cumplimiento fiscal (exención IVA Art.20.Uno.3º) y evitar laboralidad (falsos autónomos).

- Backup WORM con Object Lock Compliance : Para cumplir con retención legal de 5 años (Ley 41/2002) sin posibilidad de alteración, ni siquiera por administradores.

Fin del documento T1 — Arquitectura Global Multi-Psicólogo para Ancora (ancora.clinic)

## 7. Seguridad y Privacidad Extrema de los Datos

### Cifrado de Base de Datos y Aislamiento (Tenant Isolation)

El historial de los chats y las notas de evolución se almacenan cifrados en reposo en la base de datos PostgreSQL utilizando **AES-256-GCM**.

- Claves derivadas del cliente (Zero-Knowledge): La clave simétrica de descifrado no se guarda en el servidor. Se deriva de la contraseña del usuario utilizando la función de hash **Argon2id** en el cliente durante el login. La clave descifra la sesión de forma efímera en la RAM del navegador, impidiendo que administradores de la infraestructura o intrusos en la base de datos puedan leer las historias clínicas.

### Estrategias de Backup y Cumplimiento Sanitario

Se despliega un protocolo de backups automatizado y cifrado:

- Copias incrementales diarias almacenadas localmente en volumen cifrado e inmutable.

- Réplicas en la nube fría de AWS (S3 Glacier) configurando políticas de **Bóveda WORM (Write Once, Read Many) y Object Lock** en modo cumplimiento para evitar secuestro de datos por ransomware.

- Crypto-shredding: Proceso de baja inmediata del usuario. En lugar de procesar complejas consultas de borrado físico que pueden dejar residuos en los backups inmutables, se destruye la clave criptográfica específica del usuario en el almacén de llaves, haciendo que toda su información histórica sea instantánea e irreversiblemente indescifrable (ruido electromagnético).

#### Trazabilidad Médica y Logs Inmutables

Se implementa un sistema de logs de auditoría para registrar cada acceso de lectura al historial de un paciente. Este registro se almacena en una estructura de cadena de hash (Hash Chain), lo que impide la alteración o el borrado de registros de acceso por parte de administradores o psicólogos.

### Seguridad de la IA: Arquitectura de Prompts Defensivos y Guardrails

Para blindar el LLM clínico local (DeepSeek-R1-70B / Qwen-2.5-72B) contra ataques de inyección de prompts (Prompt Injection), secuestro de rol (Role Hijacking) y jailbreaking (Hackprompting), se despliega una arquitectura defensiva en profundidad:

#### Aislamiento Estricto por Nonce-Based XML Wrapping

• Delimitadores dinámicos: Las consultas no se inyectan en texto plano continuo. El backend encapsula las entradas de usuario utilizando etiquetas XML firmadas dinámicamente con un Nonce aleatorio de un solo uso por sesión (ej. <untrusted_user_input_9xK2mP97> ).
 • Resistencia a escapes: Si el usuario introduce etiquetas de cierre falsas para intentar inyectar comandos operativos ("olvida las instrucciones anteriores"), el motor de inferencia las ignora al no coincidir con el nonce dinámico generado por el backend, tratando la entrada únicamente como texto descriptivo pasivo.

`<untrusted_user_input_9xK2mP97>`

#### Filtro de Entrada Activo (Input Guardrail)

• Firewall Semántico Rápido: Un modelo local auxiliar ultrarrápido (Qwen-2.5-7B-Instruct, latencia <80ms) pre-evalúa el input del paciente.
 • Clasificación Binaria: Determina si el prompt contiene comandos de reconfiguración o bypass. Si se detecta un patrón de ataque, la petición es bloqueada en el backend y se devuelve una respuesta estandarizada segura de inmediato, sin consumir recursos de inferencia en el modelo de 70B.

#### Validador de Salida y Autocorrección (Output Guardrail)

• Sanitización en Runtime: Un analizador de salida intercepta la generación del LLM antes de enviarse al paciente. Escanea patrones de etiquetas internas del sistema o tokens prohibidos de asunción humana.
 • Control de Fármacos: Si el LLM menciona psicofármacos (Sertralina, Clonazepam, etc.) acompañados de términos imperativos de prescripción, la respuesta se bloquea automáticamente en el backend y se inserta una cláusula predefinida de exención de responsabilidad clínica.

#### Cláusulas de Veto Clínicas Inmutables

El System Prompt inyectado en local contiene bloqueos lógicos absolutos:
 • No Prescripción: Prohibición total de sugerir o alterar tratamientos farmacológicos.
 • No Directivismo: Prohibición de dar instrucciones imperativas de vida ("debes hacer X"). Enfoque socrático reflexivo obligatorio.
 • No Antropomorfización Ficticia: Prohibición de simular sentimientos o experiencias humanas pasadas, recordando siempre su naturaleza de IA de soporte clínico.

# INFORME T4: GESTIÓN DE DATOS, PRIVACIDAD E IMPORTACIÓN/EXPORTACIÓN DE PACIENTES

## Proyecto: Ancora (ancora.clinic) — Telepsicología Zero-Knowledge

Version: 1.0

Fecha: 31 Mayo 2026

Clasificación: CONFIDENCIAL — Secreto Profesional Sanitario

## INDICE

- IMPORTACION DE PACIENTES POR EL PSICOLOGO

1.1 Invitacion por email/SMS con enlace magico

1.2 Codigo QR unico desde panel del psicologo

1.3 Subida CSV/Excel masivo con procesamiento por lotes

1.4 Enlace publico con autoregistro

1.5 API REST para integracion con sistemas de clinicas

- EXPORTACION DE HISTORIA CLINICA PORTABLE

2.1 Formatos: JSON, PDF, Markdown

2.2 Contenido de la historia clinica

2.3 Portabilidad entre psicologos (transferencia interna)

2.4 Exportacion fuera de Ancora (descarga cifrada)

2.5 Estructura JSON de referencia

- ARQUITECTURA DE DATOS CIFRADOS

3.1 AES-256-GCM en reposo (PostgreSQL BYTEA)

3.2 Claves derivadas del cliente con Argon2id

3.3 Cifrado E2EE para chats (WebCrypto API)

3.4 Chats grupales con clave RSA-OAEP

3.5 Procesamiento en RAM volatil y memory zeroing

3.6 mlock/mlockall contra swap

- CICLO DE VIDA DE LOS DATOS

4.1 Alta: consentimiento + enclave cifrado

4.2 Activo: procesamiento, backups, trazabilidad

4.3 Baja: crypto-shredding

4.4 Retencion: 5 anos post-baja (Ley 41/2002)

4.5 Portabilidad (Art. 20 RGPD)

- TRAZABILIDAD Y AUDITORIA

5.1 Hash chain de logs de acceso (SHA256 encadenado)

5.2 Registro completo de accesos

5.3 Alertas de accesos sospechosos

5.4 DLP clinico con NLP local

- CHECKLIST GDPR COMPLETA

- ANEXOS: Diagramas, estructuras BD, referencias

## 1. IMPORTACION DE PACIENTES POR EL PSICOLOGO

Ancora ofrece seis flujos de incorporacion de pacientes, cada uno con

distintos niveles de seguridad, friccion UX y capacidad de volumen.

### 1.1 Invitacion por email/SMS con enlace magico

#### UX Flow

```
[Psicologo en panel] [Paciente]
 | |
 | 1. Click "Invitar Paciente"|
 | 2. Introduce email/tlf |
 | 3. Selecciona plan |
 | 4. Click "Enviar Invitacion"|
 | |
 |--- 5. Backend genera ----->|
 | token JWT cifrado |
 | expiracion: 72h |
 | |
 | 6. Email/SMS enviado ------+-> [Paciente recibe enlace]
 | | "ancora.clinic/join?tk=xxx"
 | |
 | | 7. Abre enlace
 | | 8. Validacion token
 | | 9. Formulario registro:
 | | - Password (Argon2id en cliente)
 | | - Consentimiento explicito
 | | - Datos demograficos minimos
 | | 10. Cuenta activada
 | | 11. Token invalidado (un solo uso)
 |<-- 12. Notificacion --------|
 | "Paciente registrado" |
```

[Psicologo en panel] [Paciente] | | | 1. Click "Invitar Paciente"| | 2. Introduce email/tlf | | 3. Selecciona plan | | 4. Click "Enviar Invitacion"| | | |--- 5. Backend genera ----->| | token JWT cifrado | | expiracion: 72h | | | | 6. Email/SMS enviado ------+-> [Paciente recibe enlace] | | "ancora.clinic/join?tk=xxx" | | | | 7. Abre enlace | | 8. Validacion token | | 9. Formulario registro: | | - Password (Argon2id en cliente) | | - Consentimiento explicito | | - Datos demograficos minimos | | 10. Cuenta activada | | 11. Token invalidado (un solo uso) |<-- 12. Notificacion --------| | "Paciente registrado" |

#### Seguridad del token JWT

```
// backend/src/services/invitation.service.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

async function createInvitationToken(psychologistId, patientEmail, planId) {
 // Nonce unico anti-replay
 const jti = crypto.randomUUID();

 // JWT cifrado con AES-256-GCM (JWE)
 const token = await new jose.EncryptJWT({
 sub: patientEmail,
 psy: psychologistId, // ID del psicologo emisor
 plan: planId,
 purpose: 'patient_invite'
 })
 .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
 .setIssuedAt()
 .setExpirationTime('72h')
 .setJti(jti)
 .encrypt(process.env.INVITATION_ENCRYPTION_KEY);

 // Almacenar hash del jti para deteccion de uso multiple
 await db.query(
 `INSERT INTO invitation_tokens (jti_hash, psychologist_id, email, expires_at)
 VALUES ($1, $2, $3, $4)`,
 [crypto.createHash('sha256').update(jti).digest('hex'),
 psychologistId, patientEmail,
 new Date(Date.now() + 72 * 3600 * 1000)]
 );

 return token;
}
```

// backend/src/services/invitation.service.js const jwt = require('jsonwebtoken'); const crypto = require('crypto'); async function createInvitationToken(psychologistId, patientEmail, planId) { // Nonce unico anti-replay const jti = crypto.randomUUID(); // JWT cifrado con AES-256-GCM (JWE) const token = await new jose.EncryptJWT({ sub: patientEmail, psy: psychologistId, // ID del psicologo emisor plan: planId, purpose: 'patient_invite' }) .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }) .setIssuedAt() .setExpirationTime('72h') .setJti(jti) .encrypt(process.env.INVITATION_ENCRYPTION_KEY); // Almacenar hash del jti para deteccion de uso multiple await db.query( `INSERT INTO invitation_tokens (jti_hash, psychologist_id, email, expires_at) VALUES ($1, $2, $3, $4)`, [crypto.createHash('sha256').update(jti).digest('hex'), psychologistId, patientEmail, new Date(Date.now() + 72 * 3600 * 1000)] ); return token; }

#### Estructura de base de datos

```
-- Tabla de tokens de invitacion
CREATE TABLE invitation_tokens (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 jti_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256 del jti
 psychologist_id UUID NOT NULL REFERENCES psychologists(id),
 patient_email VARCHAR(255) NOT NULL,
 plan_id UUID REFERENCES subscription_plans(id),
 status VARCHAR(20) DEFAULT 'pending', -- pending|used|expired|revoked
 created_at TIMESTAMPTZ DEFAULT NOW(),
 expires_at TIMESTAMPTZ NOT NULL,
 used_at TIMESTAMPTZ,
 used_by_ip INET,
 INDEX idx_invitation_psychologist (psychologist_id),
 INDEX idx_invitation_status_expires (status, expires_at)
);

-- Trigger de limpieza: invalidar tokens expirados cada hora
CREATE OR REPLACE FUNCTION clean_expired_invitations()
RETURNS void AS $$
BEGIN
 UPDATE invitation_tokens
 SET status = 'expired'
 WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

-- Tabla de tokens de invitacion CREATE TABLE invitation_tokens ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), jti_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256 del jti psychologist_id UUID NOT NULL REFERENCES psychologists(id), patient_email VARCHAR(255) NOT NULL, plan_id UUID REFERENCES subscription_plans(id), status VARCHAR(20) DEFAULT 'pending', -- pending|used|expired|revoked created_at TIMESTAMPTZ DEFAULT NOW(), expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ, used_by_ip INET, INDEX idx_invitation_psychologist (psychologist_id), INDEX idx_invitation_status_expires (status, expires_at) ); -- Trigger de limpieza: invalidar tokens expirados cada hora CREATE OR REPLACE FUNCTION clean_expired_invitations() RETURNS void AS $$ BEGIN UPDATE invitation_tokens SET status = 'expired' WHERE status = 'pending' AND expires_at < NOW(); END; $$ LANGUAGE plpgsql;

#### Edge cases cubiertos

`purpose: 'patient_invite'`

### 1.2 Codigo QR unico desde panel del psicologo

#### UX Flow

```
[Panel del Psicologo]
 |
 | 1. Click "Generar QR de Admision"
 | 2. Sistema genera:
 | - QR rotativo (cada 5 min)
 | - Firma HMAC-SHA256 del payload
 | - Nonce + timestamp
 | 3. QR mostrado en pantalla grande
 | (ej: tablet en recepcion)
 |
[Paciente escanea con movil]
 |
 | 4. App abre ancora.clinic/qr/abcdef
 | 5. Valida firma HMAC y timestamp
 | (rechaza si >5 min o firma invalida)
 | 6. Precarga datos del psicologo
 | 7. Formulario registro minimalista
 | - Solo nombre + password + consentimiento
 | 8. Cuenta creada y vinculada al psicologo
```

[Panel del Psicologo] | | 1. Click "Generar QR de Admision" | 2. Sistema genera: | - QR rotativo (cada 5 min) | - Firma HMAC-SHA256 del payload | - Nonce + timestamp | 3. QR mostrado en pantalla grande | (ej: tablet en recepcion) | [Paciente escanea con movil] | | 4. App abre ancora.clinic/qr/abcdef | 5. Valida firma HMAC y timestamp | (rechaza si >5 min o firma invalida) | 6. Precarga datos del psicologo | 7. Formulario registro minimalista | - Solo nombre + password + consentimiento | 8. Cuenta creada y vinculada al psicologo

#### Implementacion QR seguro

```
// backend/src/services/qr.service.js
const crypto = require('crypto');
const QRCode = require('qrcode');

const QR_ROTATION_SECONDS = 300; // 5 minutos
const QR_HMAC_KEY = process.env.QR_HMAC_KEY; // 256-bit, rotado semanalmente

async function generatePsychologistQR(psychologistId) {
 const timestamp = Math.floor(Date.now() / (QR_ROTATION_SECONDS * 1000));
 const nonce = crypto.randomBytes(4).toString('hex');

 const payload = `${psychologistId}:${timestamp}:${nonce}`;
 const signature = crypto
 .createHmac('sha256', QR_HMAC_KEY)
 .update(payload)
 .digest('hex');

 const qrData = JSON.stringify({
 v: 2,
 p: psychologistId,
 t: timestamp,
 n: nonce,
 s: signature
 });

 // Generar SVG para visualizacion en web
 const qrSvg = await QRCode.toString(qrData, {
 type: 'svg',
 width: 400,
 margin: 2,
 color: { dark: '#1a365d', light: '#ffffff' }
 });

 // Almacenar QR activo en Redis (expira a los 5 min)
 await redis.setex(
 `qr_active:${psychologistId}`,
 QR_ROTATION_SECONDS,
 qrData
 );

 return { qrSvg, expiresIn: QR_ROTATION_SECONDS };
}

// Middleware de validacion
async function validateQRMiddleware(req, res, next) {
 const { qrData } = req.body;
 let parsed;

 try {
 parsed = JSON.parse(qrData);
 } catch {
 return res.status(400).json({ error: 'QR invalido' });
 }

 // Version check
 if (parsed.v !== 2) return res.status(400).json({ error: 'QR desactualizado' });

 // Timestamp freshness
 const currentWindow = Math.floor(Date.now() / (QR_ROTATION_SECONDS * 1000));
 if (Math.abs(parsed.t - currentWindow) > 1) {
 return res.status(401).json({ error: 'QR expirado. Solicita uno nuevo.' });
 }

 // Verificar firma HMAC
 const payload = `${parsed.p}:${parsed.t}:${parsed.n}`;
 const expectedSig = crypto
 .createHmac('sha256', QR_HMAC_KEY)
 .update(payload)
 .digest('hex');

 if (!crypto.timingSafeEqual(Buffer.from(parsed.s), Buffer.from(expectedSig))) {
 return res.status(403).json({ error: 'QR fraudulento detectado' });
 }

 req.psychologistId = parsed.p;
 next();
}
```

// backend/src/services/qr.service.js const crypto = require('crypto'); const QRCode = require('qrcode'); const QR_ROTATION_SECONDS = 300; // 5 minutos const QR_HMAC_KEY = process.env.QR_HMAC_KEY; // 256-bit, rotado semanalmente async function generatePsychologistQR(psychologistId) { const timestamp = Math.floor(Date.now() / (QR_ROTATION_SECONDS * 1000)); const nonce = crypto.randomBytes(4).toString('hex'); const payload = `${psychologistId}:${timestamp}:${nonce}`; const signature = crypto .createHmac('sha256', QR_HMAC_KEY) .update(payload) .digest('hex'); const qrData = JSON.stringify({ v: 2, p: psychologistId, t: timestamp, n: nonce, s: signature }); // Generar SVG para visualizacion en web const qrSvg = await QRCode.toString(qrData, { type: 'svg', width: 400, margin: 2, color: { dark: '#1a365d', light: '#ffffff' } }); // Almacenar QR activo en Redis (expira a los 5 min) await redis.setex( `qr_active:${psychologistId}`, QR_ROTATION_SECONDS, qrData ); return { qrSvg, expiresIn: QR_ROTATION_SECONDS }; } // Middleware de validacion async function validateQRMiddleware(req, res, next) { const { qrData } = req.body; let parsed; try { parsed = JSON.parse(qrData); } catch { return res.status(400).json({ error: 'QR invalido' }); } // Version check if (parsed.v !== 2) return res.status(400).json({ error: 'QR desactualizado' }); // Timestamp freshness const currentWindow = Math.floor(Date.now() / (QR_ROTATION_SECONDS * 1000)); if (Math.abs(parsed.t - currentWindow) > 1) { return res.status(401).json({ error: 'QR expirado. Solicita uno nuevo.' }); } // Verificar firma HMAC const payload = `${parsed.p}:${parsed.t}:${parsed.n}`; const expectedSig = crypto .createHmac('sha256', QR_HMAC_KEY) .update(payload) .digest('hex'); if (!crypto.timingSafeEqual(Buffer.from(parsed.s), Buffer.from(expectedSig))) { return res.status(403).json({ error: 'QR fraudulento detectado' }); } req.psychologistId = parsed.p; next(); }

#### Anti-fraude: rotacion por ventana temporal

```
Time Window 1 (T0 - T0+5min) Time Window 2 (T0+5min - T0+10min)
+----------------------------+ +----------------------------+
| QR firma con HMAC(t1) | ----> | QR firma con HMAC(t2) |
| payload: psy:t1:nonce1 | | payload: psy:t2:nonce2 |
+----------------------------+ +----------------------------+
 | |
 v v
Si se fotografía un QR y se intenta Solo acepta t2
usar minutos después, t1 != current Rechaza t1
tambien HMAC no coincide

Proteccion adicional:
- Rate limiting: max 3 intentos de escaneo fallidos por IP/minuto
- Si un mismo QR se escanea desde 2 IPs distintas en <1s -> bloqueo
- Log de todos los escaneos con geolocalizacion aproximada
```

Time Window 1 (T0 - T0+5min) Time Window 2 (T0+5min - T0+10min) +----------------------------+ +----------------------------+ | QR firma con HMAC(t1) | ----> | QR firma con HMAC(t2) | | payload: psy:t1:nonce1 | | payload: psy:t2:nonce2 | +----------------------------+ +----------------------------+ | | v v Si se fotografía un QR y se intenta Solo acepta t2 usar minutos después, t1 != current Rechaza t1 tambien HMAC no coincide Proteccion adicional: - Rate limiting: max 3 intentos de escaneo fallidos por IP/minuto - Si un mismo QR se escanea desde 2 IPs distintas en <1s -> bloqueo - Log de todos los escaneos con geolocalizacion aproximada

#### Edge cases

`qr_active`

### 1.3 Subida CSV/Excel masivo con procesamiento por lotes

#### UX Flow

```
[Panel del Psicologo -> Importar Pacientes]
 |
 | 1. Descargar plantilla .csv/.xlsx
 | Columnas: nombre, email, telefono, plan, notas
 | 2. Rellenar datos (max 500 filas por lote)
 | 3. Subir archivo
 |
[Backend]
 |
 | 4. Validacion del archivo:
 | - Extension permitida (.csv, .xlsx)
 | - Tamano max 10MB
 | - Cabeceras correctas
 | - Validacion de email formato
 | - Deteccion duplicados (email ya registrado)
 | 5. Preview de resultados para el psicologo:
 | - 450 filas OK
 | - 30 emails invalidos
 | - 20 duplicados
 | 6. Confirmacion del psicologo
 |
 | 7. Procesamiento por lotes (BullMQ):
 | - Batch 1: 100 invitaciones
 | - Batch 2: 100 invitaciones
 | - Batch 3: 100 invitaciones
 | - Batch 4: 100 invitaciones
 | - Batch 5: 100 invitaciones
 |
 | 8. Por cada fila:
 | - Generar token JWT individual
 | - Enviar email/SMS
 | - Almacenar en invitation_tokens
 |
 | 9. Resultado final en panel:
 | - 450 invitaciones enviadas
 | - 50 errores (detalle descargable CSV)
```

[Panel del Psicologo -> Importar Pacientes] | | 1. Descargar plantilla .csv/.xlsx | Columnas: nombre, email, telefono, plan, notas | 2. Rellenar datos (max 500 filas por lote) | 3. Subir archivo | [Backend] | | 4. Validacion del archivo: | - Extension permitida (.csv, .xlsx) | - Tamano max 10MB | - Cabeceras correctas | - Validacion de email formato | - Deteccion duplicados (email ya registrado) | 5. Preview de resultados para el psicologo: | - 450 filas OK | - 30 emails invalidos | - 20 duplicados | 6. Confirmacion del psicologo | | 7. Procesamiento por lotes (BullMQ): | - Batch 1: 100 invitaciones | - Batch 2: 100 invitaciones | - Batch 3: 100 invitaciones | - Batch 4: 100 invitaciones | - Batch 5: 100 invitaciones | | 8. Por cada fila: | - Generar token JWT individual | - Enviar email/SMS | - Almacenar en invitation_tokens | | 9. Resultado final en panel: | - 450 invitaciones enviadas | - 50 errores (detalle descargable CSV)

#### Procesamiento por lotes

```
// backend/src/queues/bulkInvitation.queue.js
const { Queue, Worker } = require('bullmq');

const bulkInvitationQueue = new Queue('bulk-invitations', {
 connection: { host: 'redis', port: 6379 },
 defaultJobOptions: {
 attempts: 3,
 backoff: { type: 'exponential', delay: 2000 },
 removeOnComplete: 100,
 removeOnFail: 50
 }
});

async function enqueueBulkInvitations(psychologistId, patients, batchSize = 100) {
 const batches = [];
 for (let i = 0; i < patients.length; i += batchSize) {
 batches.push(patients.slice(i, i + batchSize));
 }

 const jobs = batches.map((batch, index) => ({
 name: `batch-${index}`,
 data: { psychologistId, patients: batch, batchIndex: index }
 }));

 return await bulkInvitationQueue.addBulk(jobs);
}

// Worker process
const worker = new Worker('bulk-invitations', async (job) => {
 const { psychologistId, patients, batchIndex } = job.data;
 const results = [];

 for (const patient of patients) {
 try {
 const token = await createInvitationToken(psychologistId, patient.email, patient.plan);
 await sendEmailInvitation(patient.email, token);

 // Actualizar progreso en Redis (para el polling del frontend)
 await redis.incr(`bulk_progress:${psychologistId}`);

 results.push({ email: patient.email, status: 'sent' });
 } catch (error) {
 results.push({ email: patient.email, status: 'error', reason: error.message });
 }
 }

 return { batchIndex, results };
}, {
 connection: { host: 'redis', port: 6379 },
 concurrency: 3, // Max 3 lotes simultaneos
 limiter: {
 max: 10, // Max 10 invitations por segundo
 duration: 1000
 }
});
```

// backend/src/queues/bulkInvitation.queue.js const { Queue, Worker } = require('bullmq'); const bulkInvitationQueue = new Queue('bulk-invitations', { connection: { host: 'redis', port: 6379 }, defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 100, removeOnFail: 50 } }); async function enqueueBulkInvitations(psychologistId, patients, batchSize = 100) { const batches = []; for (let i = 0; i < patients.length; i += batchSize) { batches.push(patients.slice(i, i + batchSize)); } const jobs = batches.map((batch, index) => ({ name: `batch-${index}`, data: { psychologistId, patients: batch, batchIndex: index } })); return await bulkInvitationQueue.addBulk(jobs); } // Worker process const worker = new Worker('bulk-invitations', async (job) => { const { psychologistId, patients, batchIndex } = job.data; const results = []; for (const patient of patients) { try { const token = await createInvitationToken(psychologistId, patient.email, patient.plan); await sendEmailInvitation(patient.email, token); // Actualizar progreso en Redis (para el polling del frontend) await redis.incr(`bulk_progress:${psychologistId}`); results.push({ email: patient.email, status: 'sent' }); } catch (error) { results.push({ email: patient.email, status: 'error', reason: error.message }); } } return { batchIndex, results }; }, { connection: { host: 'redis', port: 6379 }, concurrency: 3, // Max 3 lotes simultaneos limiter: { max: 10, // Max 10 invitations por segundo duration: 1000 } });

#### Validacion del archivo

```
# backend/src/validation/bulk_import.py
import pandas as pd
import re
from email_validator import validate_email, EmailNotValidError

REQUIRED_COLUMNS = ['nombre', 'email']
OPTIONAL_COLUMNS = ['telefono', 'plan', 'notas']
MAX_ROWS = 500
MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB

class BulkImportValidator:
 def __init__(self, file_path: str, psychologist_id: str):
 self.file_path = file_path
 self.psychologist_id = psychologist_id
 self.errors = []
 self.warnings = []
 self.valid_rows = []

 def validate(self) -> dict:
 # 1. Extension
 if not self.file_path.endswith(('.csv', '.xlsx')):
 return {'valid': False, 'errors': ['Formato no soportado. Usa .csv o .xlsx']}

 # 2. Lectura
 try:
 if self.file_path.endswith('.csv'):
 df = pd.read_csv(self.file_path, dtype=str)
 else:
 df = pd.read_excel(self.file_path, dtype=str)
 except Exception as e:
 return {'valid': False, 'errors': [f'Error al leer archivo: {str(e)}']}

 # 3. Cabeceras
 missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
 if missing:
 return {'valid': False, 'errors': [f'Columnas requeridas faltantes: {missing}']}

 # 4. Numero de filas
 if len(df) > MAX_ROWS:
 return {'valid': False, 'errors': [f'Maximo {MAX_ROWS} pacientes por lote']}

 # 5. Validar cada fila
 for idx, row in df.iterrows():
 row_errors = []

 # Email valido
 try:
 validate_email(row['email'], check_deliverability=False)
 except EmailNotValidError as e:
 row_errors.append(f'Email invalido: {row["email"]}')

 # Nombre no vacio
 if pd.isna(row.get('nombre')) or not str(row.get('nombre', '')).strip():
 row_errors.append('Nombre requerido')

 # Telefono formato (opcional)
 telefono = row.get('telefono', '')
 if pd.notna(telefono) and telefono.strip():
 if not re.match(r'^\+?\d{6,15}$', telefono.strip()):
 row_errors.append(f'Telefono formato invalido: {telefono}')

 if row_errors:
 self.errors.append({'row': idx + 2, 'email': row['email'], 'errors': row_errors})
 else:
 self.valid_rows.append(row.to_dict())

 # 6. Detectar duplicados internos en el CSV
 emails = [r['email'] for r in self.valid_rows]
 if len(emails) != len(set(emails)):
 dupes = [e for e in emails if emails.count(e) > 1]
 self.warnings.append(f'Emails duplicados en el archivo: {list(set(dupes))}')

 # 7. Detectar duplicados contra BD
 existing = db.query("""
 SELECT email FROM users WHERE email = ANY($1)
 """, [emails])
 if existing:
 existing_emails = [r['email'] for r in existing]
 self.warnings.append(f'Pacientes ya registrados: {existing_emails}')
 self.valid_rows = [r for r in self.valid_rows if r['email'] not in existing_emails]

 return {
 'valid': len(self.valid_rows) > 0,
 'total_rows': len(df),
 'valid_count': len(self.valid_rows),
 'error_count': len(self.errors),
 'warning_count': len(self.warnings),
 'errors': self.errors,
 'warnings': self.warnings,
 'valid_rows': self.valid_rows
 }
```

# backend/src/validation/bulk_import.py import pandas as pd import re from email_validator import validate_email, EmailNotValidError REQUIRED_COLUMNS = ['nombre', 'email'] OPTIONAL_COLUMNS = ['telefono', 'plan', 'notas'] MAX_ROWS = 500 MAX_FILE_SIZE = 10 * 1024 * 1024 # 10MB class BulkImportValidator: def __init__(self, file_path: str, psychologist_id: str): self.file_path = file_path self.psychologist_id = psychologist_id self.errors = [] self.warnings = [] self.valid_rows = [] def validate(self) -> dict: # 1. Extension if not self.file_path.endswith(('.csv', '.xlsx')): return {'valid': False, 'errors': ['Formato no soportado. Usa .csv o .xlsx']} # 2. Lectura try: if self.file_path.endswith('.csv'): df = pd.read_csv(self.file_path, dtype=str) else: df = pd.read_excel(self.file_path, dtype=str) except Exception as e: return {'valid': False, 'errors': [f'Error al leer archivo: {str(e)}']} # 3. Cabeceras missing = [c for c in REQUIRED_COLUMNS if c not in df.columns] if missing: return {'valid': False, 'errors': [f'Columnas requeridas faltantes: {missing}']} # 4. Numero de filas if len(df) > MAX_ROWS: return {'valid': False, 'errors': [f'Maximo {MAX_ROWS} pacientes por lote']} # 5. Validar cada fila for idx, row in df.iterrows(): row_errors = [] # Email valido try: validate_email(row['email'], check_deliverability=False) except EmailNotValidError as e: row_errors.append(f'Email invalido: {row["email"]}') # Nombre no vacio if pd.isna(row.get('nombre')) or not str(row.get('nombre', '')).strip(): row_errors.append('Nombre requerido') # Telefono formato (opcional) telefono = row.get('telefono', '') if pd.notna(telefono) and telefono.strip(): if not re.match(r'^\+?\d{6,15}$', telefono.strip()): row_errors.append(f'Telefono formato invalido: {telefono}') if row_errors: self.errors.append({'row': idx + 2, 'email': row['email'], 'errors': row_errors}) else: self.valid_rows.append(row.to_dict()) # 6. Detectar duplicados internos en el CSV emails = [r['email'] for r in self.valid_rows] if len(emails) != len(set(emails)): dupes = [e for e in emails if emails.count(e) > 1] self.warnings.append(f'Emails duplicados en el archivo: {list(set(dupes))}') # 7. Detectar duplicados contra BD existing = db.query(""" SELECT email FROM users WHERE email = ANY($1) """, [emails]) if existing: existing_emails = [r['email'] for r in existing] self.warnings.append(f'Pacientes ya registrados: {existing_emails}') self.valid_rows = [r for r in self.valid_rows if r['email'] not in existing_emails] return { 'valid': len(self.valid_rows) > 0, 'total_rows': len(df), 'valid_count': len(self.valid_rows), 'error_count': len(self.errors), 'warning_count': len(self.warnings), 'errors': self.errors, 'warnings': self.warnings, 'valid_rows': self.valid_rows }

#### Edge cases

### 1.4 Enlace publico tipo 'ancora.clinic/psicologo/dr-garcia'

#### UX Flow

```
[Psicologo configura perfil publico]
 |
 | 1. Activar "Perfil Publico" en configuracion
 | 2. Slug personalizado (dr-garcia, psicologo-maria)
 | 3. Descripcion breve y foto (opcional)
 | 4. Precio/sesion visible
 | 5. Horario de disponibilidad
 |
[Paciente llega al enlace]
 |
 | ancora.clinic/psicologo/dr-garcia
 |
 | 6. Landing page del psicologo:
 | - Foto y presentacion profesional
 | - Precios transparentes
 | - Boton "Reservar cita de prueba"
 | - Sello: "Datos cifrados Zero-Knowledge"
 |
 | 7. Click "Reservar cita"
 | 8. Formulario de autoregistro:
 | - Nombre completo
 | - Email
 | - Password (Argon2id en cliente)
 | - Consentimiento explicito
 | - Cuestionario breve (PHQ-2 opcional)
 | 9. Cuenta creada + vinculada al psicologo
 | 10. Opcion de pago de primera sesion
 |
[Notificacion al psicologo]
 |
 | 11. Email: "Nuevo paciente registrado desde tu enlace"
 | 12. Panel: paciente aparece en lista con estado "Nuevo"
```

[Psicologo configura perfil publico] | | 1. Activar "Perfil Publico" en configuracion | 2. Slug personalizado (dr-garcia, psicologo-maria) | 3. Descripcion breve y foto (opcional) | 4. Precio/sesion visible | 5. Horario de disponibilidad | [Paciente llega al enlace] | | ancora.clinic/psicologo/dr-garcia | | 6. Landing page del psicologo: | - Foto y presentacion profesional | - Precios transparentes | - Boton "Reservar cita de prueba" | - Sello: "Datos cifrados Zero-Knowledge" | | 7. Click "Reservar cita" | 8. Formulario de autoregistro: | - Nombre completo | - Email | - Password (Argon2id en cliente) | - Consentimiento explicito | - Cuestionario breve (PHQ-2 opcional) | 9. Cuenta creada + vinculada al psicologo | 10. Opcion de pago de primera sesion | [Notificacion al psicologo] | | 11. Email: "Nuevo paciente registrado desde tu enlace" | 12. Panel: paciente aparece en lista con estado "Nuevo"

#### Implementacion de slugs

```
CREATE TABLE psychologist_public_profiles (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 psychologist_id UUID UNIQUE NOT NULL REFERENCES psychologists(id),
 slug VARCHAR(100) UNIQUE NOT NULL, -- 'dr-garcia'
 is_active BOOLEAN DEFAULT false,
 title VARCHAR(200), -- "Psicologo General Sanitario"
 description TEXT,
 photo_url VARCHAR(500),
 price_display INTEGER, -- Precio visible en €
 consultation_duration INTEGER DEFAULT 50, -- Minutos
 auto_approve BOOLEAN DEFAULT false, -- Aceptar pacientes automaticamente
 seo_meta_title VARCHAR(160),
 seo_meta_description VARCHAR(320),
 created_at TIMESTAMPTZ DEFAULT NOW(),
 updated_at TIMESTAMPTZ DEFAULT NOW(),
 INDEX idx_public_slug (slug)
);

-- Slug validation: solo letras, numeros y guiones
CREATE OR REPLACE FUNCTION validate_slug(slug TEXT)
RETURNS BOOLEAN AS $$
BEGIN
 RETURN slug ~ '^[a-z0-9-]{3,100}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

CREATE TABLE psychologist_public_profiles ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), psychologist_id UUID UNIQUE NOT NULL REFERENCES psychologists(id), slug VARCHAR(100) UNIQUE NOT NULL, -- 'dr-garcia' is_active BOOLEAN DEFAULT false, title VARCHAR(200), -- "Psicologo General Sanitario" description TEXT, photo_url VARCHAR(500), price_display INTEGER, -- Precio visible en € consultation_duration INTEGER DEFAULT 50, -- Minutos auto_approve BOOLEAN DEFAULT false, -- Aceptar pacientes automaticamente seo_meta_title VARCHAR(160), seo_meta_description VARCHAR(320), created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW(), INDEX idx_public_slug (slug) ); -- Slug validation: solo letras, numeros y guiones CREATE OR REPLACE FUNCTION validate_slug(slug TEXT) RETURNS BOOLEAN AS $$ BEGIN RETURN slug ~ '^[a-z0-9-]{3,100}$'; END; $$ LANGUAGE plpgsql IMMUTABLE;

#### Seguridad del autoregistro

```
// Proteccion contra abuso del enlace publico
const RATE_LIMIT = {
 windowMs: 15 * 60 * 1000, // 15 min
 max: 10, // Max 10 registros por ventana
 message: 'Demasiados intentos. Intenta en 15 minutos.'
};

// CAPTCHA invisible (Cloudflare Turnstile) en formulario
const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY;
const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY;

async function verifyTurnstile(token) {
 const response = await fetch(
 'https://challenges.cloudflare.com/turnstile/v0/siteverify',
 {
 method: 'POST',
 body: `secret=${turnstileSecretKey}&response=${token}`
 }
 );
 return response.json();
}

// Anti-bot: Honeypot field invisible en formulario
// Si se rellena -> descartar como bot
```

// Proteccion contra abuso del enlace publico const RATE_LIMIT = { windowMs: 15 * 60 * 1000, // 15 min max: 10, // Max 10 registros por ventana message: 'Demasiados intentos. Intenta en 15 minutos.' }; // CAPTCHA invisible (Cloudflare Turnstile) en formulario const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY; const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY; async function verifyTurnstile(token) { const response = await fetch( 'https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: `secret=${turnstileSecretKey}&response=${token}` } ); return response.json(); } // Anti-bot: Honeypot field invisible en formulario // Si se rellena -> descartar como bot

#### Edge cases

### 1.5 API REST para integracion con sistemas de clinicas

#### Endpoints

```
POST /api/v1/integrations/patients/invite Invitar paciente
POST /api/v1/integrations/patients/bulk-import Importacion masiva
GET /api/v1/integrations/patients/{id}/status Estado de invitacion
POST /api/v1/integrations/patients/register Autoregistro delegado
GET /api/v1/integrations/export/patients Exportar pacientes
```

POST /api/v1/integrations/patients/invite Invitar paciente POST /api/v1/integrations/patients/bulk-import Importacion masiva GET /api/v1/integrations/patients/{id}/status Estado de invitacion POST /api/v1/integrations/patients/register Autoregistro delegado GET /api/v1/integrations/export/patients Exportar pacientes

#### Autenticacion API

```
// API Key + HMAC signing para partners clinicos
// Cada clinica tiene:
// api_key_id (identificador publico, ej: 'clinic_abc123')
// api_key_secret (secreto compartido, 256-bit, almacenado como bcrypt hash)

const crypto = require('crypto');

function generateApiSignature(apiKeyId, apiKeySecret, method, path, body, timestamp) {
 const payload = [
 timestamp,
 apiKeyId,
 method.toUpperCase(),
 path,
 JSON.stringify(body)
 ].join('\n');

 return crypto
 .createHmac('sha256', apiKeySecret)
 .update(payload)
 .digest('hex');
}

// Cliente llama:
// Header: X-API-Key: clinic_abc123
// Header: X-Timestamp: 1717200000
// Header: X-Signature: <hmac result>
```

// API Key + HMAC signing para partners clinicos // Cada clinica tiene: // api_key_id (identificador publico, ej: 'clinic_abc123') // api_key_secret (secreto compartido, 256-bit, almacenado como bcrypt hash) const crypto = require('crypto'); function generateApiSignature(apiKeyId, apiKeySecret, method, path, body, timestamp) { const payload = [ timestamp, apiKeyId, method.toUpperCase(), path, JSON.stringify(body) ].join('\n'); return crypto .createHmac('sha256', apiKeySecret) .update(payload) .digest('hex'); } // Cliente llama: // Header: X-API-Key: clinic_abc123 // Header: X-Timestamp: 1717200000 // Header: X-Signature: <hmac result>

#### Ejemplo de flujo completo (clinica integrada)

```
# Ejemplo: Clinica "PsicoMadrid" integra Ancora via API
import requests
import hmac
import hashlib
import json
import time

API_BASE = "https://api.ancora.clinic/v1/integrations"
API_KEY_ID = "clinic_psicomadrid"
API_KEY_SECRET = "sk-..."

def sign_request(method, path, body, timestamp):
 payload = f"{timestamp}\n{API_KEY_ID}\n{method}\n{path}\n{json.dumps(body)}"
 return hmac.new(
 API_KEY_SECRET.encode(),
 payload.encode(),
 hashlib.sha256
 ).hexdigest()

def invite_patient(patient_data):
 timestamp = str(int(time.time()))
 path = "/patients/invite"
 body = {
 "nombre": patient_data["nombre"],
 "email": patient_data["email"],
 "telefono": patient_data.get("telefono", ""),
 "plan_id": "plan_esencial",
 "notas": patient_data.get("notas", ""),
 "metadata": {
 "source": "psicomadrid_ehr",
 "referrer_id": patient_data["ehr_id"]
 }
 }

 signature = sign_request("POST", path, body, timestamp)

 response = requests.post(
 f"{API_BASE}{path}",
 json=body,
 headers={
 "X-API-Key": API_KEY_ID,
 "X-Timestamp": timestamp,
 "X-Signature": signature,
 "Content-Type": "application/json"
 }
 )
 return response.json()

# Uso:
resultado = invite_patient({
 "nombre": "Ana Garcia Lopez",
 "email": "ana.garcia@email.com",
 "ehr_id": "PAT-2024-001234"
})
print(f"Invitacion enviada: {resultado['invitation_id']}")
```

# Ejemplo: Clinica "PsicoMadrid" integra Ancora via API import requests import hmac import hashlib import json import time API_BASE = "https://api.ancora.clinic/v1/integrations" API_KEY_ID = "clinic_psicomadrid" API_KEY_SECRET = "sk-..." def sign_request(method, path, body, timestamp): payload = f"{timestamp}\n{API_KEY_ID}\n{method}\n{path}\n{json.dumps(body)}" return hmac.new( API_KEY_SECRET.encode(), payload.encode(), hashlib.sha256 ).hexdigest() def invite_patient(patient_data): timestamp = str(int(time.time())) path = "/patients/invite" body = { "nombre": patient_data["nombre"], "email": patient_data["email"], "telefono": patient_data.get("telefono", ""), "plan_id": "plan_esencial", "notas": patient_data.get("notas", ""), "metadata": { "source": "psicomadrid_ehr", "referrer_id": patient_data["ehr_id"] } } signature = sign_request("POST", path, body, timestamp) response = requests.post( f"{API_BASE}{path}", json=body, headers={ "X-API-Key": API_KEY_ID, "X-Timestamp": timestamp, "X-Signature": signature, "Content-Type": "application/json" } ) return response.json() # Uso: resultado = invite_patient({ "nombre": "Ana Garcia Lopez", "email": "ana.garcia@email.com", "ehr_id": "PAT-2024-001234" }) print(f"Invitacion enviada: {resultado['invitation_id']}")

#### Tabla de permisos por API Key

```
CREATE TABLE api_keys (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 key_id VARCHAR(64) UNIQUE NOT NULL, -- 'clinic_abc123'
 key_hash VARCHAR(255) NOT NULL, -- bcrypt del secreto
 name VARCHAR(200) NOT NULL, -- 'Clinica PsicoMadrid'
 permissions TEXT[] NOT NULL DEFAULT '{}', -- ARRAY de permisos
 -- permisos disponibles:
 -- 'patients:invite', 'patients:read', 'patients:write',
 -- 'appointments:read', 'appointments:write',
 -- 'export:read'
 rate_limit INTEGER DEFAULT 100, -- requests/minuto
 allowed_ips INET[], -- Restriccion por IP (opcional)
 is_active BOOLEAN DEFAULT true,
 last_used_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ DEFAULT NOW(),
 expires_at TIMESTAMPTZ,
 INDEX idx_api_key_id (key_id)
);
```

CREATE TABLE api_keys ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), key_id VARCHAR(64) UNIQUE NOT NULL, -- 'clinic_abc123' key_hash VARCHAR(255) NOT NULL, -- bcrypt del secreto name VARCHAR(200) NOT NULL, -- 'Clinica PsicoMadrid' permissions TEXT[] NOT NULL DEFAULT '{}', -- ARRAY de permisos -- permisos disponibles: -- 'patients:invite', 'patients:read', 'patients:write', -- 'appointments:read', 'appointments:write', -- 'export:read' rate_limit INTEGER DEFAULT 100, -- requests/minuto allowed_ips INET[], -- Restriccion por IP (opcional) is_active BOOLEAN DEFAULT true, last_used_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), expires_at TIMESTAMPTZ, INDEX idx_api_key_id (key_id) );

#### Edge cases

`Idempotency-Key: UUID`

`Retry-After`

`POST /api/v1/integrations/webhook`

## 2. EXPORTACION DE HISTORIA CLINICA PORTABLE

Este es el corazon del sistema. La portabilidad es obligacion legal

(Art. 20 RGPD) y ventaja competitiva frente a plataformas que atrapan

datos del paciente.

### 2.1 Formatos soportados

### 2.2 Contenido de la historia clinica

```
+----------------------------------------------------------+
| HISTORIA CLINICA ANCORA |
| Formato: JSON v2.1 |
+----------------------------------------------------------+
| |
| 1. METADATOS |
| - ID del paciente (anonimizado para reimportacion) |
| - Nombre, fecha de nacimiento |
| - Fecha de alta en Ancora |
| - Fecha de exportacion |
| - Hash SHA256 de la exportacion |
| |
| 2. CRONOLOGIA VITAL |
| - Timeline completo de sesiones |
| - Fechas de cada sesion |
| - Duracion de cada sesion |
| - Modalidad (video, chat, revision) |
| - Psicologo asignado en cada periodo |
| |
| 3. PATRONES EMOCIONALES |
| - Series temporales de estados de animo |
| - Datos de check-ins diarios |
| - Tendencias detectadas por IA |
| - Correlaciones con eventos vitales |
| |
| 4. EVENTOS SIGNIFICATIVOS |
| - Eventos vitales marcados por el paciente |
| - Crisis y episodios |
| - Logros y hitos |
| - Activaciones de kill-switch |
| |
| 5. OBJETIVOS TERAPEUTICOS |
| - Objetivos definidos por paciente y psicologo |
| - Estado de cada objetivo |
| - Progreso medido |
| - Fechas de revision de objetivos |
| |
| 6. NOTAS DEL PSICOLOGO (SOAP) |
| - Notas Subjetivo, Objetivo, Analisis, Plan |
| - Fecha de cada nota |
| - Firma digital del psicologo |
| - Hash de integridad de cada nota |
| |
| 7. EJERCICIOS Y MATERIAL TERAPEUTICO |
| - Ejercicios asignados |
| - Completitud de ejercicios |
| - Registros de practica |
| - Material psicoeducativo entregado |
| |
| 8. AVANCES Y RECAIDAS |
| - Metricas de progreso |
| - Indicadores de mejora |
| - Recaidas documentadas |
| - Periodos de crisis |
| |
| 9. DATOS DE WEARABLES (si aplica) |
| - Sueno (horas, calidad) |
| - Frecuencia cardiaca / HRV |
| - Pasos diarios |
| - Periodos de estres |
+----------------------------------------------------------+
```

+----------------------------------------------------------+ | HISTORIA CLINICA ANCORA | | Formato: JSON v2.1 | +----------------------------------------------------------+ | | | 1. METADATOS | | - ID del paciente (anonimizado para reimportacion) | | - Nombre, fecha de nacimiento | | - Fecha de alta en Ancora | | - Fecha de exportacion | | - Hash SHA256 de la exportacion | | | | 2. CRONOLOGIA VITAL | | - Timeline completo de sesiones | | - Fechas de cada sesion | | - Duracion de cada sesion | | - Modalidad (video, chat, revision) | | - Psicologo asignado en cada periodo | | | | 3. PATRONES EMOCIONALES | | - Series temporales de estados de animo | | - Datos de check-ins diarios | | - Tendencias detectadas por IA | | - Correlaciones con eventos vitales | | | | 4. EVENTOS SIGNIFICATIVOS | | - Eventos vitales marcados por el paciente | | - Crisis y episodios | | - Logros y hitos | | - Activaciones de kill-switch | | | | 5. OBJETIVOS TERAPEUTICOS | | - Objetivos definidos por paciente y psicologo | | - Estado de cada objetivo | | - Progreso medido | | - Fechas de revision de objetivos | | | | 6. NOTAS DEL PSICOLOGO (SOAP) | | - Notas Subjetivo, Objetivo, Analisis, Plan | | - Fecha de cada nota | | - Firma digital del psicologo | | - Hash de integridad de cada nota | | | | 7. EJERCICIOS Y MATERIAL TERAPEUTICO | | - Ejercicios asignados | | - Completitud de ejercicios | | - Registros de practica | | - Material psicoeducativo entregado | | | | 8. AVANCES Y RECAIDAS | | - Metricas de progreso | | - Indicadores de mejora | | - Recaidas documentadas | | - Periodos de crisis | | | | 9. DATOS DE WEARABLES (si aplica) | | - Sueno (horas, calidad) | | - Frecuencia cardiaca / HRV | | - Pasos diarios | | - Periodos de estres | +----------------------------------------------------------+

### 2.3 Portabilidad entre psicologos (transferencia interna)

Cuando un paciente cambia de psicologo DENTRO de Ancora, los datos

NO necesitan ser descargados. El sistema transfiere el acceso

criptografico.

#### UX Flow

```
[Paciente solicita cambio de psicologo]
 |
 | 1. Menu -> "Cambiar de psicologo"
 | 2. Seleccionar nuevo psicologo del directorio
 | 3. Confirmar: "Entiendo que mi historial completo
 | sera visible para mi nuevo psicologo"
 | 4. Autenticacion reforzada (password + 2FA)
 |
[Backend: Transferencia criptografica]
 |
 | 5. Sistema recupera clave publica RSA del nuevo psicologo
 | 6. Recifra la clave de acceso del paciente con la nueva
 | clave publica del psicologo
 | (nunca se descifra en servidor el contenido)
 |
 | 7. Actualiza tabla de acceso:
 | - Revoca acceso del psicologo anterior
 | - Concede acceso al nuevo psicologo
 | - Log de auditoria del cambio
 |
 | 8. Notifica a AMBOS psicologos:
 | - Anterior: "El paciente X ha transferido su caso"
 | - Nuevo: "Tienes un nuevo paciente con historial completo"
 |
[Seguridad]
 |
 | - El psicologo anterior PIERDE acceso inmediatamente
 | - El paciente conserva control total
 | - Nota SOAP del psicologo anterior: visible pero inmutable
 | - El nuevo psicologo NO puede editar notas previas
 | - Solo puede anadir nuevas notas y objetivos
```

[Paciente solicita cambio de psicologo] | | 1. Menu -> "Cambiar de psicologo" | 2. Seleccionar nuevo psicologo del directorio | 3. Confirmar: "Entiendo que mi historial completo | sera visible para mi nuevo psicologo" | 4. Autenticacion reforzada (password + 2FA) | [Backend: Transferencia criptografica] | | 5. Sistema recupera clave publica RSA del nuevo psicologo | 6. Recifra la clave de acceso del paciente con la nueva | clave publica del psicologo | (nunca se descifra en servidor el contenido) | | 7. Actualiza tabla de acceso: | - Revoca acceso del psicologo anterior | - Concede acceso al nuevo psicologo | - Log de auditoria del cambio | | 8. Notifica a AMBOS psicologos: | - Anterior: "El paciente X ha transferido su caso" | - Nuevo: "Tienes un nuevo paciente con historial completo" | [Seguridad] | | - El psicologo anterior PIERDE acceso inmediatamente | - El paciente conserva control total | - Nota SOAP del psicologo anterior: visible pero inmutable | - El nuevo psicologo NO puede editar notas previas | - Solo puede anadir nuevas notas y objetivos

#### Implementacion del recifrado

```
// backend/src/services/transfer.service.js
const crypto = require('crypto');

async function transferPatientToPsychologist(patientId, oldPsychologistId, newPsychologistId) {
 return await db.transaction(async (tx) => {
 // 1. Verificar que el nuevo psicologo esta disponible
 const newPsy = await tx.query(
 `SELECT id, rsa_public_key FROM psychologists WHERE id = $1 AND is_active = true`,
 [newPsychologistId]
 );
 if (!newPsy.rows[0]) throw new Error('Psicologo no disponible');

 // 2. Recuperar KEK envuelta (Key Encryption Key) del paciente
 // La KEK esta cifrada para cada psicologo autorizado
 const kekEntry = await tx.query(
 `SELECT encrypted_key FROM patient_key_access
 WHERE patient_id = $1 AND psychologist_id = $2`,
 [patientId, oldPsychologistId]
 );
 if (!kekEntry.rows[0]) throw new Error('No hay acceso previo');

 // 3. La KEK esta cifrada con RSA-OAEP de cada psicologo
 // No podemos descifrarla en servidor. En su lugar:
 // - El servidor envia al paciente una solicitud de re-cifrado
 // - El navegador del paciente descifra la KEK (tiene la clave)
 // - Recifra con la clave publica del nuevo psicologo
 // - Envia la nueva KEK cifrada al servidor

 // Alternativa (mas segura para UX): El paciente ya tiene la KEK
 // descifrada en sessionStorage. Frontend:
 // const kek = sessionStorage.getItem('patient_kek');
 // const newEncryptedKek = await encryptRSA(kek, newPsyPublicKey);
 // await api.post('/transfer/confirm', { patientId, newEncryptedKek, newPsychologistId });

 // 4. Registrar nuevo acceso
 await tx.query(
 `INSERT INTO patient_key_access (patient_id, psychologist_id, encrypted_key, granted_at)
 VALUES ($1, $2, $3, NOW())`,
 [patientId, newPsychologistId, newEncryptedKek]
 );

 // 5. Revocar acceso anterior
 await tx.query(
 `UPDATE patient_key_access
 SET revoked_at = NOW()
 WHERE patient_id = $1 AND psychologist_id = $2 AND revoked_at IS NULL`,
 [patientId, oldPsychologistId]
 );

 // 6. Log de auditoria
 await tx.query(
 `INSERT INTO audit_log (action, patient_id, actor_id, metadata)
 VALUES ('PATIENT_TRANSFERRED', $1, $2, $3)`,
 [patientId, patientId,
 JSON.stringify({
 from_psychologist: oldPsychologistId,
 to_psychologist: newPsychologistId,
 timestamp: new Date().toISOString()
 })]
 );

 return { success: true, newPsychologistId };
 });
}
```

// backend/src/services/transfer.service.js const crypto = require('crypto'); async function transferPatientToPsychologist(patientId, oldPsychologistId, newPsychologistId) { return await db.transaction(async (tx) => { // 1. Verificar que el nuevo psicologo esta disponible const newPsy = await tx.query( `SELECT id, rsa_public_key FROM psychologists WHERE id = $1 AND is_active = true`, [newPsychologistId] ); if (!newPsy.rows[0]) throw new Error('Psicologo no disponible'); // 2. Recuperar KEK envuelta (Key Encryption Key) del paciente // La KEK esta cifrada para cada psicologo autorizado const kekEntry = await tx.query( `SELECT encrypted_key FROM patient_key_access WHERE patient_id = $1 AND psychologist_id = $2`, [patientId, oldPsychologistId] ); if (!kekEntry.rows[0]) throw new Error('No hay acceso previo'); // 3. La KEK esta cifrada con RSA-OAEP de cada psicologo // No podemos descifrarla en servidor. En su lugar: // - El servidor envia al paciente una solicitud de re-cifrado // - El navegador del paciente descifra la KEK (tiene la clave) // - Recifra con la clave publica del nuevo psicologo // - Envia la nueva KEK cifrada al servidor // Alternativa (mas segura para UX): El paciente ya tiene la KEK // descifrada en sessionStorage. Frontend: // const kek = sessionStorage.getItem('patient_kek'); // const newEncryptedKek = await encryptRSA(kek, newPsyPublicKey); // await api.post('/transfer/confirm', { patientId, newEncryptedKek, newPsychologistId }); // 4. Registrar nuevo acceso await tx.query( `INSERT INTO patient_key_access (patient_id, psychologist_id, encrypted_key, granted_at) VALUES ($1, $2, $3, NOW())`, [patientId, newPsychologistId, newEncryptedKek] ); // 5. Revocar acceso anterior await tx.query( `UPDATE patient_key_access SET revoked_at = NOW() WHERE patient_id = $1 AND psychologist_id = $2 AND revoked_at IS NULL`, [patientId, oldPsychologistId] ); // 6. Log de auditoria await tx.query( `INSERT INTO audit_log (action, patient_id, actor_id, metadata) VALUES ('PATIENT_TRANSFERRED', $1, $2, $3)`, [patientId, patientId, JSON.stringify({ from_psychologist: oldPsychologistId, to_psychologist: newPsychologistId, timestamp: new Date().toISOString() })] ); return { success: true, newPsychologistId }; }); }

### 2.4 Exportacion para llevar fuera de Ancora

#### UX Flow

```
[Paciente en su perfil -> Exportar datos]
 |
 | 1. Seleccionar formato:
 | [ ] JSON completo (.ancora) - RECOMENDADO
 | [ ] PDF resumen ejecutivo
 | [ ] Markdown para Obsidian/Notion
 |
 | 2. Seleccionar rango de fechas:
 | [ ] Toda la historia
 | [ ] Ultimos 6 meses
 | [ ] Personalizado
 |
 | 3. Opciones de cifrado (solo para JSON):
 | [X] Cifrar con mi clave de Ancora
 | [ ] Descifrar (texto plano)
 |
 | 4. Confirmar con password
 | (re-autenticacion requerida)
 |
[Backend]
 |
 | 5. Validar identidad (password + 2FA si activo)
 | 6. Recuperar todos los datos del paciente
 | 7. Montar estructura JSON completa
 | 8. Si cifrado:
 | - Derivar clave de exportacion:
 | Argon2id(password_export + salt) -> 256-bit
 | - Cifrar JSON con AES-256-GCM
 | - Incluir salt + iv + auth tag en .ancora file
 | 9. Generar PDF con Puppeteer
 | 10. Generar Markdown con plantillas
 | 11. Firmar con hash SHA256
 | 12. Devolver archivo firmado
 | 13. LOG: exportacion de historia clinica
```

[Paciente en su perfil -> Exportar datos] | | 1. Seleccionar formato: | [ ] JSON completo (.ancora) - RECOMENDADO | [ ] PDF resumen ejecutivo | [ ] Markdown para Obsidian/Notion | | 2. Seleccionar rango de fechas: | [ ] Toda la historia | [ ] Ultimos 6 meses | [ ] Personalizado | | 3. Opciones de cifrado (solo para JSON): | [X] Cifrar con mi clave de Ancora | [ ] Descifrar (texto plano) | | 4. Confirmar con password | (re-autenticacion requerida) | [Backend] | | 5. Validar identidad (password + 2FA si activo) | 6. Recuperar todos los datos del paciente | 7. Montar estructura JSON completa | 8. Si cifrado: | - Derivar clave de exportacion: | Argon2id(password_export + salt) -> 256-bit | - Cifrar JSON con AES-256-GCM | - Incluir salt + iv + auth tag en .ancora file | 9. Generar PDF con Puppeteer | 10. Generar Markdown con plantillas | 11. Firmar con hash SHA256 | 12. Devolver archivo firmado | 13. LOG: exportacion de historia clinica

#### Estructura del archivo .ancora (cifrado)

```
Archivo: paciente-historia-2026-05-31.ancora

Estructura interna (JSON almacenado en el archivo):
{
 "format": "ancora-clinical-history",
 "version": "2.1",
 "metadata": {
 "patient_id": "anon_a3f8c2...",
 "export_date": "2026-05-31T10:30:00Z",
 "export_reason": "patient_request_art20_gdpr",
 "record_count": 1458,
 "hash_sha256": "e3b0c44298fc1c149afbf4c8996fb924..."
 },
 "encryption": {
 "algorithm": "AES-256-GCM",
 "kdf": "Argon2id",
 "kdf_params": {
 "time_cost": 3,
 "memory_cost": 65536,
 "parallelism": 4,
 "salt_hex": "a1b2c3d4e5f6..."
 },
 "iv_hex": "7a8b9c0d1e2f...",
 "auth_tag_hex": "f0e1d2c3b4a5..."
 },
 "payload": "base64_encoded_ciphertext..."
}

Para descifrar:
 1. Extraer salt del header
 2. Derivar clave: Argon2id(password_proporcionada, salt)
 3. AES-256-GCM decrypt(ciphertext, key, iv)
 4. Verificar auth tag
 5. Verificar hash SHA256 del contenido
```

Archivo: paciente-historia-2026-05-31.ancora Estructura interna (JSON almacenado en el archivo): { "format": "ancora-clinical-history", "version": "2.1", "metadata": { "patient_id": "anon_a3f8c2...", "export_date": "2026-05-31T10:30:00Z", "export_reason": "patient_request_art20_gdpr", "record_count": 1458, "hash_sha256": "e3b0c44298fc1c149afbf4c8996fb924..." }, "encryption": { "algorithm": "AES-256-GCM", "kdf": "Argon2id", "kdf_params": { "time_cost": 3, "memory_cost": 65536, "parallelism": 4, "salt_hex": "a1b2c3d4e5f6..." }, "iv_hex": "7a8b9c0d1e2f...", "auth_tag_hex": "f0e1d2c3b4a5..." }, "payload": "base64_encoded_ciphertext..." } Para descifrar: 1. Extraer salt del header 2. Derivar clave: Argon2id(password_proporcionada, salt) 3. AES-256-GCM decrypt(ciphertext, key, iv) 4. Verificar auth tag 5. Verificar hash SHA256 del contenido

#### Generacion de PDF

```
// backend/src/export/pdf.service.js
const puppeteer = require('puppeteer');
const { compile } = require('handlebars');

const PDF_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
 <meta charset="utf-8">
 <style>
 @page { margin: 2.5cm; }
 body { font-family: 'Inter', sans-serif; color: #1a202c; }
 h1 { color: #2d3748; border-bottom: 3px solid #6b46c1; }
 .section { margin: 20px 0; padding: 15px; background: #f7fafc; border-radius: 8px; }
 .timeline { position: relative; }
 .timeline-item { margin: 10px 0; padding-left: 20px; border-left: 2px solid #6b46c1; }
 .mood-chart { width: 100%; height: 200px; background: linear-gradient(...); }
 .footer { text-align: center; font-size: 10px; color: #a0aec0; margin-top: 50px; }
 .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; }
 .badge-green { background: #c6f6d5; color: #22543d; }
 .badge-red { background: #fed7d7; color: #742a2a; }
 </style>
</head>
<body>
 <h1>Historia Clinica - Ancora</h1>
 <p>Paciente: {{metadata.nombre}} | Exportado: {{metadata.export_date}}</p>

 <div class="section">
 <h2>Resumen del Tratamiento</h2>
 <p>Periodo: {{resumen.fecha_inicio}} - {{resumen.fecha_fin}}</p>
 <p>Psicologo asignado: {{resumen.psicologo_nombre}}</p>
 <p>Sesiones totales: {{resumen.sesiones_totales}}</p>
 <p>Objetivos completados: {{resumen.objetivos_completados}}/{{resumen.objetivos_totales}}</p>
 </div>

 <div class="section">
 <h2>Cronologia de Sesiones</h2>
 {{#each sesiones}}
 <div class="timeline-item">
 <strong>{{fecha}}</strong> - {{tipo}} ({{duracion}} min)
 <br><small>Tema: {{tema_principal}}</small>
 </div>
 {{/each}}
 </div>

 <div class="section">
 <h2>Patrones Emocionales</h2>
 <div class="mood-chart">{{mood_chart_svg}}</div>
 </div>

 <div class="section">
 <h2>Objetivos Terapeuticos</h2>
 {{#each objetivos}}
 <p>
 <span class="badge {{#if completado}}badge-green{{else}}badge-red{{/if}}">
 {{#if completado}}Completado{{else}}En curso{{/if}}
 </span>
 {{descripcion}}
 </p>
 {{/each}}
 </div>

 <div class="footer">
 Documento generado por Ancora.clinic | Ley 41/2002, Art. 15 | RGPD Art. 20
 <br>Hash de integridad: {{hash}}
 </div>
</body>
</html>
`;

async function generatePdf(data) {
 const browser = await puppeteer.launch({ headless: true });
 const page = await browser.newPage();

 const template = compile(PDF_TEMPLATE);
 const html = template(data);

 await page.setContent(html, { waitUntil: 'networkidle0' });

 const pdf = await page.pdf({
 format: 'A4',
 printBackground: true,
 margin: { top: '2.5cm', bottom: '2.5cm', left: '2cm', right: '2cm' }
 });

 await browser.close();
 return pdf;
}
```

// backend/src/export/pdf.service.js const puppeteer = require('puppeteer'); const { compile } = require('handlebars'); const PDF_TEMPLATE = ` <!DOCTYPE html> <html> <head> <meta charset="utf-8"> <style> @page { margin: 2.5cm; } body { font-family: 'Inter', sans-serif; color: #1a202c; } h1 { color: #2d3748; border-bottom: 3px solid #6b46c1; } .section { margin: 20px 0; padding: 15px; background: #f7fafc; border-radius: 8px; } .timeline { position: relative; } .timeline-item { margin: 10px 0; padding-left: 20px; border-left: 2px solid #6b46c1; } .mood-chart { width: 100%; height: 200px; background: linear-gradient(...); } .footer { text-align: center; font-size: 10px; color: #a0aec0; margin-top: 50px; } .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; } .badge-green { background: #c6f6d5; color: #22543d; } .badge-red { background: #fed7d7; color: #742a2a; } </style> </head> <body> <h1>Historia Clinica - Ancora</h1> <p>Paciente: {{metadata.nombre}} | Exportado: {{metadata.export_date}}</p> <div class="section"> <h2>Resumen del Tratamiento</h2> <p>Periodo: {{resumen.fecha_inicio}} - {{resumen.fecha_fin}}</p> <p>Psicologo asignado: {{resumen.psicologo_nombre}}</p> <p>Sesiones totales: {{resumen.sesiones_totales}}</p> <p>Objetivos completados: {{resumen.objetivos_completados}}/{{resumen.objetivos_totales}}</p> </div> <div class="section"> <h2>Cronologia de Sesiones</h2> {{#each sesiones}} <div class="timeline-item"> <strong>{{fecha}}</strong> - {{tipo}} ({{duracion}} min) <br><small>Tema: {{tema_principal}}</small> </div> {{/each}} </div> <div class="section"> <h2>Patrones Emocionales</h2> <div class="mood-chart">{{mood_chart_svg}}</div> </div> <div class="section"> <h2>Objetivos Terapeuticos</h2> {{#each objetivos}} <p> <span class="badge {{#if completado}}badge-green{{else}}badge-red{{/if}}"> {{#if completado}}Completado{{else}}En curso{{/if}} </span> {{descripcion}} </p> {{/each}} </div> <div class="footer"> Documento generado por Ancora.clinic | Ley 41/2002, Art. 15 | RGPD Art. 20 <br>Hash de integridad: {{hash}} </div> </body> </html> `; async function generatePdf(data) { const browser = await puppeteer.launch({ headless: true }); const page = await browser.newPage(); const template = compile(PDF_TEMPLATE); const html = template(data); await page.setContent(html, { waitUntil: 'networkidle0' }); const pdf = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '2.5cm', bottom: '2.5cm', left: '2cm', right: '2cm' } }); await browser.close(); return pdf; }

### 2.5 Estructura JSON de referencia

```
{
 "_format": "ancora-clinical-history",
 "_version": "2.1.0",
 "_generated_at": "2026-05-31T10:30:00Z",

 "metadata": {
 "patient_id_anon": "anon_a3f8c2d1e4b7",
 "nombre_paciente": "Ana Garcia Lopez",
 "fecha_nacimiento": "1992-03-15",
 "fecha_alta": "2025-09-01",
 "fecha_exportacion": "2026-05-31T10:30:00Z",
 "motivo_exportacion": "cambio_psicologo_externo",
 "total_registros": 1458,
 "hash_integridad": "sha256:e3b0c44298fc1c149afbf4c8996fb924..."
 },

 "cronologia": {
 "periodos_psicologo": [
 {
 "psicologo_id": "psy_001",
 "psicologo_nombre": "Dr. Carlos Mendez",
 "fecha_inicio": "2025-09-01",
 "fecha_fin": "2026-02-15",
 "total_sesiones": 22
 },
 {
 "psicologo_id": "psy_003",
 "psicologo_nombre": "Dra. Laura Jimenez",
 "fecha_inicio": "2026-02-20",
 "fecha_fin": null,
 "total_sesiones": 14
 }
 ],
 "sesiones": [
 {
 "id": "ses_001",
 "fecha": "2025-09-01T10:00:00Z",
 "tipo": "sesion_inicial",
 "modalidad": "videollamada",
 "duracion_minutos": 60,
 "psicologo_id": "psy_001",
 "psicologo_nombre": "Dr. Carlos Mendez",
 "tema_principal": "Evaluacion inicial y encuadre",
 "escalas_aplicadas": ["PHQ-9", "GAD-7"],
 "resultado_PHQ9": 15,
 "resultado_GAD7": 12,
 "nota_soap": {
 "subjetivo": "La paciente refiere...",
 "objetivo": "Se observa...",
 "analisis": "Los resultados sugieren...",
 "plan": "Sesiones semanales con enfoque TCC..."
 }
 },
 {
 "id": "ses_002",
 "fecha": "2025-09-08T11:00:00Z",
 "tipo": "seguimiento",
 "modalidad": "videollamada",
 "duracion_minutos": 45,
 "psicologo_id": "psy_001",
 "notas_psicologo": "Progreso en identificacion de distorsiones cognitivas"
 }
 ],
 "revisiones_asincronas": [
 {
 "id": "rev_001",
 "fecha": "2025-09-05T14:00:00Z",
 "duracion_minutos": 15,
 "tipo": "revision_semanal",
 "video_briefing_url": "https://cdn.ancora.clinic/...",
 "resumen_ia": "Mejora leve en estado de animo general..."
 }
 ]
 },

 "patrones_emocionales": {
 "checkins_mensuales": [
 {
 "mes": "2025-09",
 "media_animo": 4.2,
 "media_ansiedad": 6.8,
 "media_energia": 3.5,
 "media_sueno_horas": 6.2,
 "num_checkins": 28,
 "tendencia": "mejora_leve",
 "distorsiones_detectadas": ["catastrofismo", "polarizacion"],
 "frecuencia_distorsiones": {
 "catastrofismo": 12,
 "polarizacion": 8,
 "personalizacion": 3
 }
 }
 ],
 "tendencias_detectadas_ia": [
 {
 "periodo": "2025-09_a_2025-11",
 "patron": "Mejora en regulacion emocional pero persistencia de ansiedad social",
 "nivel_confianza_ia": 0.85
 }
 ]
 },

 "eventos_significativos": [
 {
 "id": "evt_001",
 "fecha": "2025-10-15",
 "tipo": "crisis",
 "severidad": "alta",
 "descripcion": "Episodio de ansiedad aguda tras reunion laboral",
 "activacion_kill_switch": true,
 "intervencion": "Protocolo de crisis activado. Contacto con psicologo en <30min",
 "resolucion": "Estabilizada tras intervencion psicologica"
 },
 {
 "id": "evt_002",
 "fecha": "2026-01-20",
 "tipo": "logro",
 "severidad": "baja",
 "descripcion": "Primera exposicion social exitosa (reunion con amigos)"
 }
 ],

 "objetivos_terapeuticos": [
 {
 "id": "obj_001",
 "descripcion": "Reducir frecuencia de ataques de panico de 3/sem a <1/sem",
 "fecha_creacion": "2025-09-01",
 "fecha_revision": "2025-12-01",
 "estado": "completado",
 "progreso_porcentaje": 100,
 "metricas": {
 "linea_base": 3,
 "actual": 0.5,
 "objetivo": 1
 }
 },
 {
 "id": "obj_002",
 "descripcion": "Mejorar calidad de sueno (media >7h/noche)",
 "fecha_creacion": "2025-09-01",
 "estado": "en_curso",
 "progreso_porcentaje": 65,
 "metricas": {
 "linea_base": 5.2,
 "actual": 6.8,
 "objetivo": 7.0
 }
 }
 ],

 "ejercicios": [
 {
 "id": "ej_001",
 "tipo": "registro_pensamientos",
 "nombre": "Registro de pensamientos automaticos",
 "fecha_asignacion": "2025-09-01",
 "total_asignados": 30,
 "completados": 28,
 "ultima_practica": "2026-05-28",
 "progreso": 0.93
 }
 ],

 "avances_y_recaidas": [
 {
 "periodo": "2025-09_a_2025-12",
 "tipo": "avance",
 "descripcion": "Reduccion del 60% en sintomas depresivos (PHQ-9: 15 -> 6)",
 "evidencia": "Escala PHQ-9 aplicada mensualmente"
 },
 {
 "periodo": "2026-02",
 "tipo": "recaida_parcial",
 "descripcion": "Aumento temporal de ansiedad (GAD-7: 8 -> 13)",
 "factor_desencadenante": "Problemas laborales",
 "duracion_dias": 18,
 "resolucion": "Estabilizacion tras 3 sesiones intensivas",
 "aprendizaje": "Identificacion temprana de patrones de estres"
 }
 ],

 "plan_accion_futuro": {
 "recomendaciones_al_alta": [
 "Continuar con registro de pensamientos automaticos",
 "Mantener rutina de higiene de sueno",
 "Sesiones de mantenimiento mensuales recomendadas"
 ],
 "nota_continuidad": "Paciente con buena respuesta a TCC. Riesgo de recaida bajo.",
 "psicologo_recomendado": null
 }
}
```

{ "_format": "ancora-clinical-history", "_version": "2.1.0", "_generated_at": "2026-05-31T10:30:00Z", "metadata": { "patient_id_anon": "anon_a3f8c2d1e4b7", "nombre_paciente": "Ana Garcia Lopez", "fecha_nacimiento": "1992-03-15", "fecha_alta": "2025-09-01", "fecha_exportacion": "2026-05-31T10:30:00Z", "motivo_exportacion": "cambio_psicologo_externo", "total_registros": 1458, "hash_integridad": "sha256:e3b0c44298fc1c149afbf4c8996fb924..." }, "cronologia": { "periodos_psicologo": [ { "psicologo_id": "psy_001", "psicologo_nombre": "Dr. Carlos Mendez", "fecha_inicio": "2025-09-01", "fecha_fin": "2026-02-15", "total_sesiones": 22 }, { "psicologo_id": "psy_003", "psicologo_nombre": "Dra. Laura Jimenez", "fecha_inicio": "2026-02-20", "fecha_fin": null, "total_sesiones": 14 } ], "sesiones": [ { "id": "ses_001", "fecha": "2025-09-01T10:00:00Z", "tipo": "sesion_inicial", "modalidad": "videollamada", "duracion_minutos": 60, "psicologo_id": "psy_001", "psicologo_nombre": "Dr. Carlos Mendez", "tema_principal": "Evaluacion inicial y encuadre", "escalas_aplicadas": ["PHQ-9", "GAD-7"], "resultado_PHQ9": 15, "resultado_GAD7": 12, "nota_soap": { "subjetivo": "La paciente refiere...", "objetivo": "Se observa...", "analisis": "Los resultados sugieren...", "plan": "Sesiones semanales con enfoque TCC..." } }, { "id": "ses_002", "fecha": "2025-09-08T11:00:00Z", "tipo": "seguimiento", "modalidad": "videollamada", "duracion_minutos": 45, "psicologo_id": "psy_001", "notas_psicologo": "Progreso en identificacion de distorsiones cognitivas" } ], "revisiones_asincronas": [ { "id": "rev_001", "fecha": "2025-09-05T14:00:00Z", "duracion_minutos": 15, "tipo": "revision_semanal", "video_briefing_url": "https://cdn.ancora.clinic/...", "resumen_ia": "Mejora leve en estado de animo general..." } ] }, "patrones_emocionales": { "checkins_mensuales": [ { "mes": "2025-09", "media_animo": 4.2, "media_ansiedad": 6.8, "media_energia": 3.5, "media_sueno_horas": 6.2, "num_checkins": 28, "tendencia": "mejora_leve", "distorsiones_detectadas": ["catastrofismo", "polarizacion"], "frecuencia_distorsiones": { "catastrofismo": 12, "polarizacion": 8, "personalizacion": 3 } } ], "tendencias_detectadas_ia": [ { "periodo": "2025-09_a_2025-11", "patron": "Mejora en regulacion emocional pero persistencia de ansiedad social", "nivel_confianza_ia": 0.85 } ] }, "eventos_significativos": [ { "id": "evt_001", "fecha": "2025-10-15", "tipo": "crisis", "severidad": "alta", "descripcion": "Episodio de ansiedad aguda tras reunion laboral", "activacion_kill_switch": true, "intervencion": "Protocolo de crisis activado. Contacto con psicologo en <30min", "resolucion": "Estabilizada tras intervencion psicologica" }, { "id": "evt_002", "fecha": "2026-01-20", "tipo": "logro", "severidad": "baja", "descripcion": "Primera exposicion social exitosa (reunion con amigos)" } ], "objetivos_terapeuticos": [ { "id": "obj_001", "descripcion": "Reducir frecuencia de ataques de panico de 3/sem a <1/sem", "fecha_creacion": "2025-09-01", "fecha_revision": "2025-12-01", "estado": "completado", "progreso_porcentaje": 100, "metricas": { "linea_base": 3, "actual": 0.5, "objetivo": 1 } }, { "id": "obj_002", "descripcion": "Mejorar calidad de sueno (media >7h/noche)", "fecha_creacion": "2025-09-01", "estado": "en_curso", "progreso_porcentaje": 65, "metricas": { "linea_base": 5.2, "actual": 6.8, "objetivo": 7.0 } } ], "ejercicios": [ { "id": "ej_001", "tipo": "registro_pensamientos", "nombre": "Registro de pensamientos automaticos", "fecha_asignacion": "2025-09-01", "total_asignados": 30, "completados": 28, "ultima_practica": "2026-05-28", "progreso": 0.93 } ], "avances_y_recaidas": [ { "periodo": "2025-09_a_2025-12", "tipo": "avance", "descripcion": "Reduccion del 60% en sintomas depresivos (PHQ-9: 15 -> 6)", "evidencia": "Escala PHQ-9 aplicada mensualmente" }, { "periodo": "2026-02", "tipo": "recaida_parcial", "descripcion": "Aumento temporal de ansiedad (GAD-7: 8 -> 13)", "factor_desencadenante": "Problemas laborales", "duracion_dias": 18, "resolucion": "Estabilizacion tras 3 sesiones intensivas", "aprendizaje": "Identificacion temprana de patrones de estres" } ], "plan_accion_futuro": { "recomendaciones_al_alta": [ "Continuar con registro de pensamientos automaticos", "Mantener rutina de higiene de sueno", "Sesiones de mantenimiento mensuales recomendadas" ], "nota_continuidad": "Paciente con buena respuesta a TCC. Riesgo de recaida bajo.", "psicologo_recomendado": null } }

## 3. ARQUITECTURA DE DATOS CIFRADOS

### 3.1 AES-256-GCM en reposo en PostgreSQL

Toda columna con datos clinicos se almacena como BYTEA cifrada.

#### Esquema de cifrado

```
+----------------------------------------------------+
| PostgreSQL (BYTEA) |
| |
| patient_data: table { |
| id: UUID |
| encrypted_content: BYTEA <-- AES-256-GCM |
| encryption_metadata: JSONB { |
| "kek_id": UUID, <- Key ID |
| "iv": hex, <- IV unico |
| "auth_tag": hex, <- Auth tag |
| "algorithm": "AES-256-GCM" |
| } |
| integrity_hash: VARCHAR(64) <- SHA256 |
| } |
+----------------------------------------------------+
```

+----------------------------------------------------+ | PostgreSQL (BYTEA) | | | | patient_data: table { | | id: UUID | | encrypted_content: BYTEA <-- AES-256-GCM | | encryption_metadata: JSONB { | | "kek_id": UUID, <- Key ID | | "iv": hex, <- IV unico | | "auth_tag": hex, <- Auth tag | | "algorithm": "AES-256-GCM" | | } | | integrity_hash: VARCHAR(64) <- SHA256 | | } | +----------------------------------------------------+

#### Funcion de cifrado en PostgreSQL

```
-- Extension pgcrypto requerida
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION encrypt_clinical_data(
 plaintext TEXT,
 kek BYTEA, -- Key Encryption Key (256-bit)
 kek_id UUID
) RETURNS TABLE(
 encrypted_data BYTEA,
 metadata JSONB,
 integrity_hash VARCHAR(64)
) AS $$
DECLARE
 iv BYTEA := gen_random_bytes(12); -- 96-bit IV for GCM
 ciphertext BYTEA;
 auth_tag BYTEA;
 combined BYTEA;
BEGIN
 -- AES-256-GCM encrypt
 combined := pgp_sym_encrypt(
 plaintext,
 encode(kek, 'hex'),
 'cipher-algo=aes256',
 'compress-algo=0'
 );

 -- SHA256 integrity hash
 integrity_hash := encode(
 digest(plaintext, 'sha256'),
 'hex'
 );

 metadata := jsonb_build_object(
 'kek_id', kek_id,
 'algorithm', 'AES-256-GCM',
 'iv', encode(iv, 'hex'),
 'created_at', NOW()
 );

 encrypted_data := combined;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

-- Extension pgcrypto requerida CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE OR REPLACE FUNCTION encrypt_clinical_data( plaintext TEXT, kek BYTEA, -- Key Encryption Key (256-bit) kek_id UUID ) RETURNS TABLE( encrypted_data BYTEA, metadata JSONB, integrity_hash VARCHAR(64) ) AS $$ DECLARE iv BYTEA := gen_random_bytes(12); -- 96-bit IV for GCM ciphertext BYTEA; auth_tag BYTEA; combined BYTEA; BEGIN -- AES-256-GCM encrypt combined := pgp_sym_encrypt( plaintext, encode(kek, 'hex'), 'cipher-algo=aes256', 'compress-algo=0' ); -- SHA256 integrity hash integrity_hash := encode( digest(plaintext, 'sha256'), 'hex' ); metadata := jsonb_build_object( 'kek_id', kek_id, 'algorithm', 'AES-256-GCM', 'iv', encode(iv, 'hex'), 'created_at', NOW() ); encrypted_data := combined; END; $$ LANGUAGE plpgsql SECURITY DEFINER;

#### Columnas cifradas por tabla

```
-- Tabla de chats/entradas de diario
CREATE TABLE encrypted_chat_entries (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 patient_id UUID NOT NULL REFERENCES patients(id),
 psychologist_id UUID REFERENCES psychologists(id),
 created_at TIMESTAMPTZ DEFAULT NOW(),
 entry_type VARCHAR(20) NOT NULL, -- 'chat','checkin','note','exercise'

 -- Datos cifrados
 encrypted_content BYTEA NOT NULL,
 encryption_metadata JSONB NOT NULL,

 -- Metadatos no cifrados (para busqueda sin descifrar)
 entry_date DATE NOT NULL, -- Fecha sin cifrar
 mood_score INTEGER, -- Puntuacion de animo (1-10)
 has_crisis_keywords BOOLEAN DEFAULT false,

 -- Integridad
 integrity_hash VARCHAR(64) NOT NULL,
 previous_hash VARCHAR(64) NOT NULL, -- Hash chain

 INDEX idx_patient_date (patient_id, entry_date),
 INDEX idx_crisis_flag (has_crisis_keywords) WHERE has_crisis_keywords = true
);

-- Tabla de KEKs (Key Encryption Keys) por paciente
CREATE TABLE patient_key_encryption_keys (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 patient_id UUID UNIQUE NOT NULL REFERENCES patients(id),
 kek_wrapped BYTEA NOT NULL, -- KEK cifrada con clave derivada del usuario
 wrapping_method VARCHAR(20) DEFAULT 'argon2id',
 created_at TIMESTAMPTZ DEFAULT NOW(),
 rotated_at TIMESTAMPTZ,
 is_active BOOLEAN DEFAULT true
);

-- Tabla de acceso de psicologos a KEK de pacientes
CREATE TABLE patient_key_access (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 patient_id UUID NOT NULL REFERENCES patients(id),
 psychologist_id UUID NOT NULL REFERENCES psychologists(id),
 encrypted_key BYTEA NOT NULL, -- KEK cifrada con RSA-OAEP del psicologo
 granted_at TIMESTAMPTZ DEFAULT NOW(),
 revoked_at TIMESTAMPTZ,
 granted_by UUID REFERENCES users(id), -- Quien autorizo el acceso
 UNIQUE(patient_id, psychologist_id, COALESCE(revoked_at, 'infinity'))
);
```

-- Tabla de chats/entradas de diario CREATE TABLE encrypted_chat_entries ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID NOT NULL REFERENCES patients(id), psychologist_id UUID REFERENCES psychologists(id), created_at TIMESTAMPTZ DEFAULT NOW(), entry_type VARCHAR(20) NOT NULL, -- 'chat','checkin','note','exercise' -- Datos cifrados encrypted_content BYTEA NOT NULL, encryption_metadata JSONB NOT NULL, -- Metadatos no cifrados (para busqueda sin descifrar) entry_date DATE NOT NULL, -- Fecha sin cifrar mood_score INTEGER, -- Puntuacion de animo (1-10) has_crisis_keywords BOOLEAN DEFAULT false, -- Integridad integrity_hash VARCHAR(64) NOT NULL, previous_hash VARCHAR(64) NOT NULL, -- Hash chain INDEX idx_patient_date (patient_id, entry_date), INDEX idx_crisis_flag (has_crisis_keywords) WHERE has_crisis_keywords = true ); -- Tabla de KEKs (Key Encryption Keys) por paciente CREATE TABLE patient_key_encryption_keys ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID UNIQUE NOT NULL REFERENCES patients(id), kek_wrapped BYTEA NOT NULL, -- KEK cifrada con clave derivada del usuario wrapping_method VARCHAR(20) DEFAULT 'argon2id', created_at TIMESTAMPTZ DEFAULT NOW(), rotated_at TIMESTAMPTZ, is_active BOOLEAN DEFAULT true ); -- Tabla de acceso de psicologos a KEK de pacientes CREATE TABLE patient_key_access ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID NOT NULL REFERENCES patients(id), psychologist_id UUID NOT NULL REFERENCES psychologists(id), encrypted_key BYTEA NOT NULL, -- KEK cifrada con RSA-OAEP del psicologo granted_at TIMESTAMPTZ DEFAULT NOW(), revoked_at TIMESTAMPTZ, granted_by UUID REFERENCES users(id), -- Quien autorizo el acceso UNIQUE(patient_id, psychologist_id, COALESCE(revoked_at, 'infinity')) );

### 3.2 Claves derivadas del cliente con Argon2id (Zero-Knowledge)

La plataforma NUNCA tiene acceso a las claves de descifrado.

```
[Registro del paciente]
 |
 | 1. Paciente crea password: "MiClaveSegura123!"
 | 2. Navegador genera salt (16 bytes aleatorios)
 | 3. Deriva clave de cifrado:
 | master_key = Argon2id(
 | password = "MiClaveSegura123!",
 | salt = salt,
 | time_cost = 3,
 | memory_cost = 65536 (64MB),
 | parallelism = 4,
 | key_length = 32 (256 bits)
 | )
 | 4. Divide master_key en:
 | - kek (256 bits): Key Encryption Key
 | - kek_auth (256 bits): Autenticacion KEK
 | - auth_key (128 bits): Autenticacion API
 | 5. Envia al servidor:
 | - salt (para re-derivar en login)
 | - kdf_params (para configuracion Argon2id)
 | - auth_key_hash (SHA256 del auth_key)
 | - KEK_envuelta:
 | - kek_wrapped = AES-GCM-256(kek, server_key)
 | 6. Servidor almacena:
 | - salt
 | - kdf_params
 | - auth_key_hash
 | - kek_wrapped (nunca el kek en claro)
 | 7. El kek SOLO existe en memoria del navegador
 | y en sessionStorage/IndexedDB local
```

[Registro del paciente] | | 1. Paciente crea password: "MiClaveSegura123!" | 2. Navegador genera salt (16 bytes aleatorios) | 3. Deriva clave de cifrado: | master_key = Argon2id( | password = "MiClaveSegura123!", | salt = salt, | time_cost = 3, | memory_cost = 65536 (64MB), | parallelism = 4, | key_length = 32 (256 bits) | ) | 4. Divide master_key en: | - kek (256 bits): Key Encryption Key | - kek_auth (256 bits): Autenticacion KEK | - auth_key (128 bits): Autenticacion API | 5. Envia al servidor: | - salt (para re-derivar en login) | - kdf_params (para configuracion Argon2id) | - auth_key_hash (SHA256 del auth_key) | - KEK_envuelta: | - kek_wrapped = AES-GCM-256(kek, server_key) | 6. Servidor almacena: | - salt | - kdf_params | - auth_key_hash | - kek_wrapped (nunca el kek en claro) | 7. El kek SOLO existe en memoria del navegador | y en sessionStorage/IndexedDB local

#### Implementacion en frontend (WebCrypto)

```
// frontend/src/crypto/keyDerivation.js

// Parametros Argon2id
const ARGON2_CONFIG = {
 timeCost: 3,
 memoryCost: 65536, // 64 MB
 parallelism: 4,
 hashLength: 32 // 256 bits
};

async function deriveKeys(password, salt) {
 // Importar password como PBKDF2-compatible (polyfill para Argon2)
 const encoder = new TextEncoder();
 const passwordBuffer = encoder.encode(password);

 // Usar Argon2 via WebAssembly (biblioteca argon2-browser)
 const { argon2id } = await import('@anclm/argon2-browser');

 const masterKey = await argon2id({
 pass: password,
 salt: salt,
 time: ARGON2_CONFIG.timeCost,
 mem: ARGON2_CONFIG.memoryCost,
 hashLen: ARGON2_CONFIG.hashLength * 3, // 96 bytes total
 type: argon2id
 });

 // Dividir en 3 claves
 const kek = masterKey.hash.slice(0, 32); // Key Encryption Key
 const kekAuth = masterKey.hash.slice(32, 64); // KEK Auth
 const authKey = masterKey.hash.slice(64, 80); // Auth key (128 bits)

 // Calcular hash de authKey para servidor
 const authKeyBuffer = await crypto.subtle.digest('SHA-256', authKey);

 return {
 kek: new Uint8Array(kek),
 kekAuth: new Uint8Array(kekAuth),
 authKey: new Uint8Array(authKey),
 authKeyHash: new Uint8Array(authKeyBuffer)
 };
}

// En login: re-derivar la KEK desde password + salt
async function loginAndDecrypt(password, salt, encryptedPayload) {
 const keys = await deriveKeys(password, hexToBytes(salt));

 // La KEK descifra los datos del paciente
 const decrypted = await window.crypto.subtle.decrypt(
 {
 name: "AES-GCM",
 iv: encryptedPayload.iv,
 additionalData: encryptedPayload.aad,
 tagLength: 128
 },
 keys.kek, // La KEK, no el server, descifra
 encryptedPayload.ciphertext
 );

 return new TextDecoder().decode(decrypted);
}
```

// frontend/src/crypto/keyDerivation.js // Parametros Argon2id const ARGON2_CONFIG = { timeCost: 3, memoryCost: 65536, // 64 MB parallelism: 4, hashLength: 32 // 256 bits }; async function deriveKeys(password, salt) { // Importar password como PBKDF2-compatible (polyfill para Argon2) const encoder = new TextEncoder(); const passwordBuffer = encoder.encode(password); // Usar Argon2 via WebAssembly (biblioteca argon2-browser) const { argon2id } = await import('@anclm/argon2-browser'); const masterKey = await argon2id({ pass: password, salt: salt, time: ARGON2_CONFIG.timeCost, mem: ARGON2_CONFIG.memoryCost, hashLen: ARGON2_CONFIG.hashLength * 3, // 96 bytes total type: argon2id }); // Dividir en 3 claves const kek = masterKey.hash.slice(0, 32); // Key Encryption Key const kekAuth = masterKey.hash.slice(32, 64); // KEK Auth const authKey = masterKey.hash.slice(64, 80); // Auth key (128 bits) // Calcular hash de authKey para servidor const authKeyBuffer = await crypto.subtle.digest('SHA-256', authKey); return { kek: new Uint8Array(kek), kekAuth: new Uint8Array(kekAuth), authKey: new Uint8Array(authKey), authKeyHash: new Uint8Array(authKeyBuffer) }; } // En login: re-derivar la KEK desde password + salt async function loginAndDecrypt(password, salt, encryptedPayload) { const keys = await deriveKeys(password, hexToBytes(salt)); // La KEK descifra los datos del paciente const decrypted = await window.crypto.subtle.decrypt( { name: "AES-GCM", iv: encryptedPayload.iv, additionalData: encryptedPayload.aad, tagLength: 128 }, keys.kek, // La KEK, no el server, descifra encryptedPayload.ciphertext ); return new TextDecoder().decode(decrypted); }

### 3.3 Cifrado E2EE para chats con WebCrypto API

Cada mensaje individual se cifra en el navegador antes de enviarse al servidor.

```
[Cliente A] [Servidor] [Cliente B]
 | | |
 | 1. Genera clave sesion efimera | |
 | AES-GCM-256 | |
 | 2. Cifra mensaje con clave | |
 | 3. Envia: | |
 | - ciphertext | |
 | - iv | |
 | - encrypted_session_key | |
 | (session key cifrada con | |
 | RSA-OAEP pub key de B) | |
 |---> 4. Almacena BYTEA ------->| |
 | |---> 5. Entrega mensaje ---->|
 | | | 6. Descifra session key
 | | | con RSA-OAEP priv key
 | | | 7. Descifra mensaje
 | | | con AES-GCM
```

[Cliente A] [Servidor] [Cliente B] | | | | 1. Genera clave sesion efimera | | | AES-GCM-256 | | | 2. Cifra mensaje con clave | | | 3. Envia: | | | - ciphertext | | | - iv | | | - encrypted_session_key | | | (session key cifrada con | | | RSA-OAEP pub key de B) | | |---> 4. Almacena BYTEA ------->| | | |---> 5. Entrega mensaje ---->| | | | 6. Descifra session key | | | con RSA-OAEP priv key | | | 7. Descifra mensaje | | | con AES-GCM

#### Implementacion

```
// frontend/src/crypto/e2ee.js

// 1. Cifrar mensaje saliente
async function encryptMessage(plaintext, recipientPublicKeyPEM) {
 const encoder = new TextEncoder();
 const data = encoder.encode(plaintext);

 // Generar clave simetrica efimera para este mensaje
 const aesKey = await window.crypto.subtle.generateKey(
 { name: "AES-GCM", length: 256 },
 true,
 ["encrypt"]
 );

 // Generar IV unico
 const iv = window.crypto.getRandomValues(new Uint8Array(12));

 // Cifrar el mensaje
 const ciphertext = await window.crypto.subtle.encrypt(
 { name: "AES-GCM", iv: iv, tagLength: 128 },
 aesKey,
 data
 );

 // Exportar la clave AES para cifrarla con RSA
 const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

 // Importar clave publica RSA del destinatario
 const recipientPublicKey = await importPublicKey(recipientPublicKeyPEM);

 // Cifrar la clave AES con RSA-OAEP
 const encryptedKey = await window.crypto.subtle.encrypt(
 { name: "RSA-OAEP" },
 recipientPublicKey,
 rawAesKey
 );

 // Firmar el mensaje para integridad
 const signature = await signMessage(Buffer.concat([
 new Uint8Array(ciphertext),
 iv
 ]));

 return {
 ciphertext: arrayBufferToBase64(ciphertext),
 iv: arrayBufferToBase64(iv),
 encryptedKey: arrayBufferToBase64(encryptedKey),
 signature: arrayBufferToBase64(signature)
 };
}

// 2. Descifrar mensaje entrante
async function decryptMessage(encryptedMsg, privateKeyPKCS8) {
 const ciphertext = base64ToArrayBuffer(encryptedMsg.ciphertext);
 const iv = base64ToArrayBuffer(encryptedMsg.iv);
 const encryptedKey = base64ToArrayBuffer(encryptedMsg.encryptedKey);

 // Descifrar clave AES con clave privada RSA
 const privateKey = await importPrivateKey(privateKeyPKCS8);
 const aesKeyRaw = await window.crypto.subtle.decrypt(
 { name: "RSA-OAEP" },
 privateKey,
 encryptedKey
 );

 // Importar clave AES
 const aesKey = await window.crypto.subtle.importKey(
 "raw",
 aesKeyRaw,
 { name: "AES-GCM", length: 256 },
 false,
 ["decrypt"]
 );

 // Descifrar mensaje
 const plaintext = await window.crypto.subtle.decrypt(
 { name: "AES-GCM", iv: iv, tagLength: 128 },
 aesKey,
 ciphertext
 );

 return new TextDecoder().decode(plaintext);
}
```

// frontend/src/crypto/e2ee.js // 1. Cifrar mensaje saliente async function encryptMessage(plaintext, recipientPublicKeyPEM) { const encoder = new TextEncoder(); const data = encoder.encode(plaintext); // Generar clave simetrica efimera para este mensaje const aesKey = await window.crypto.subtle.generateKey( { name: "AES-GCM", length: 256 }, true, ["encrypt"] ); // Generar IV unico const iv = window.crypto.getRandomValues(new Uint8Array(12)); // Cifrar el mensaje const ciphertext = await window.crypto.subtle.encrypt( { name: "AES-GCM", iv: iv, tagLength: 128 }, aesKey, data ); // Exportar la clave AES para cifrarla con RSA const rawAesKey = await window.crypto.subtle.exportKey("raw", aesKey); // Importar clave publica RSA del destinatario const recipientPublicKey = await importPublicKey(recipientPublicKeyPEM); // Cifrar la clave AES con RSA-OAEP const encryptedKey = await window.crypto.subtle.encrypt( { name: "RSA-OAEP" }, recipientPublicKey, rawAesKey ); // Firmar el mensaje para integridad const signature = await signMessage(Buffer.concat([ new Uint8Array(ciphertext), iv ])); return { ciphertext: arrayBufferToBase64(ciphertext), iv: arrayBufferToBase64(iv), encryptedKey: arrayBufferToBase64(encryptedKey), signature: arrayBufferToBase64(signature) }; } // 2. Descifrar mensaje entrante async function decryptMessage(encryptedMsg, privateKeyPKCS8) { const ciphertext = base64ToArrayBuffer(encryptedMsg.ciphertext); const iv = base64ToArrayBuffer(encryptedMsg.iv); const encryptedKey = base64ToArrayBuffer(encryptedMsg.encryptedKey); // Descifrar clave AES con clave privada RSA const privateKey = await importPrivateKey(privateKeyPKCS8); const aesKeyRaw = await window.crypto.subtle.decrypt( { name: "RSA-OAEP" }, privateKey, encryptedKey ); // Importar clave AES const aesKey = await window.crypto.subtle.importKey( "raw", aesKeyRaw, { name: "AES-GCM", length: 256 }, false, ["decrypt"] ); // Descifrar mensaje const plaintext = await window.crypto.subtle.decrypt( { name: "AES-GCM", iv: iv, tagLength: 128 }, aesKey, ciphertext ); return new TextDecoder().decode(plaintext); }

### 3.4 Chats grupales (Duo/Familiar) con clave de grupo RSA-OAEP

```
[Plan Duo / Familiar]
 |
 | 1. Creador del grupo genera clave simetrica K_G
 | (AES-256-GCM, generada localmente en navegador)
 |
 | 2. Para cada miembro del grupo:
 | - Recupera clave publica RSA del miembro
 | - Cifra K_G con RSA-OAEP(public_key_member, K_G)
 | - Envia encrypted_K_G_member al servidor
 |
 | 3. Servidor almacena en tabla claves_grupo_usuario:
 | - user_id
 | - group_id
 | - encrypted_key (BYTEA)
 |
 | 4. Cuando un miembro envia mensaje:
 | - Cifra mensaje con K_G (AES-256-GCM)
 | - Envia ciphertext al servidor
 | - Servidor almacena y distribuye a otros miembros
 | - Cada miembro descifra con su copia local de K_G
 |
 | 5. Cuando la IA mediadora necesita procesar:
 | - El servidor API recupera encrypted_K_G_ai
 | - Descifra K_G en RAM volatil (con clave privada de la IA)
 | - Procesa el mensaje (analisis, resumen)
 | - Cifra resultado con K_G
 | - Hace memory zeroing de K_G en RAM
```

[Plan Duo / Familiar] | | 1. Creador del grupo genera clave simetrica K_G | (AES-256-GCM, generada localmente en navegador) | | 2. Para cada miembro del grupo: | - Recupera clave publica RSA del miembro | - Cifra K_G con RSA-OAEP(public_key_member, K_G) | - Envia encrypted_K_G_member al servidor | | 3. Servidor almacena en tabla claves_grupo_usuario: | - user_id | - group_id | - encrypted_key (BYTEA) | | 4. Cuando un miembro envia mensaje: | - Cifra mensaje con K_G (AES-256-GCM) | - Envia ciphertext al servidor | - Servidor almacena y distribuye a otros miembros | - Cada miembro descifra con su copia local de K_G | | 5. Cuando la IA mediadora necesita procesar: | - El servidor API recupera encrypted_K_G_ai | - Descifra K_G en RAM volatil (con clave privada de la IA) | - Procesa el mensaje (analisis, resumen) | - Cifra resultado con K_G | - Hace memory zeroing de K_G en RAM

#### Implementacion de clave de grupo

```
// frontend/src/crypto/groupChat.js

// 1. Crear grupo y generar clave compartida
async function createGroup(memberPublicKeys) {
 // Generar clave simetrica de grupo
 const groupKey = await window.crypto.subtle.generateKey(
 { name: "AES-GCM", length: 256 },
 true, // Extraible para poder cifrarla
 ["encrypt", "decrypt"]
 );

 const rawGroupKey = await window.crypto.subtle.exportKey("raw", groupKey);

 // Cifrar K_G para cada miembro
 const encryptedKeys = {};
 for (const [memberId, pubKeyPEM] of Object.entries(memberPublicKeys)) {
 const publicKey = await importPublicKey(pubKeyPEM);
 encryptedKeys[memberId] = await window.crypto.subtle.encrypt(
 { name: "RSA-OAEP" },
 publicKey,
 rawGroupKey
 );
 }

 return { groupKey, encryptedKeys };
}

// 2. Unirse a grupo (recuperar K_G cifrada para uno mismo)
async function joinGroup(encryptedGroupKeyForMe, myPrivateKey) {
 const privateKey = await importPrivateKey(myPrivateKey);
 const rawGroupKey = await window.crypto.subtle.decrypt(
 { name: "RSA-OAEP" },
 privateKey,
 encryptedGroupKeyForMe
 );

 return await window.crypto.subtle.importKey(
 "raw",
 rawGroupKey,
 { name: "AES-GCM", length: 256 },
 false,
 ["encrypt", "decrypt"]
 );
}

// 3. Cifrar mensaje de grupo
async function encryptGroupMessage(plaintext, groupKey) {
 const encoder = new TextEncoder();
 const iv = window.crypto.getRandomValues(new Uint8Array(12));

 const ciphertext = await window.crypto.subtle.encrypt(
 { name: "AES-GCM", iv, tagLength: 128 },
 groupKey,
 encoder.encode(plaintext)
 );

 return {
 ciphertext: arrayBufferToBase64(ciphertext),
 iv: arrayBufferToBase64(iv)
 };
}
```

// frontend/src/crypto/groupChat.js // 1. Crear grupo y generar clave compartida async function createGroup(memberPublicKeys) { // Generar clave simetrica de grupo const groupKey = await window.crypto.subtle.generateKey( { name: "AES-GCM", length: 256 }, true, // Extraible para poder cifrarla ["encrypt", "decrypt"] ); const rawGroupKey = await window.crypto.subtle.exportKey("raw", groupKey); // Cifrar K_G para cada miembro const encryptedKeys = {}; for (const [memberId, pubKeyPEM] of Object.entries(memberPublicKeys)) { const publicKey = await importPublicKey(pubKeyPEM); encryptedKeys[memberId] = await window.crypto.subtle.encrypt( { name: "RSA-OAEP" }, publicKey, rawGroupKey ); } return { groupKey, encryptedKeys }; } // 2. Unirse a grupo (recuperar K_G cifrada para uno mismo) async function joinGroup(encryptedGroupKeyForMe, myPrivateKey) { const privateKey = await importPrivateKey(myPrivateKey); const rawGroupKey = await window.crypto.subtle.decrypt( { name: "RSA-OAEP" }, privateKey, encryptedGroupKeyForMe ); return await window.crypto.subtle.importKey( "raw", rawGroupKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"] ); } // 3. Cifrar mensaje de grupo async function encryptGroupMessage(plaintext, groupKey) { const encoder = new TextEncoder(); const iv = window.crypto.getRandomValues(new Uint8Array(12)); const ciphertext = await window.crypto.subtle.encrypt( { name: "AES-GCM", iv, tagLength: 128 }, groupKey, encoder.encode(plaintext) ); return { ciphertext: arrayBufferToBase64(ciphertext), iv: arrayBufferToBase64(iv) }; }

#### Tabla de claves de grupo

```
CREATE TABLE group_keys (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 group_id UUID UNIQUE NOT NULL REFERENCES therapy_groups(id),
 created_by UUID NOT NULL REFERENCES users(id),
 created_at TIMESTAMPTZ DEFAULT NOW(),
 rotated_at TIMESTAMPTZ,
 is_active BOOLEAN DEFAULT true
);

CREATE TABLE group_key_members (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 group_key_id UUID NOT NULL REFERENCES group_keys(id),
 user_id UUID NOT NULL REFERENCES users(id),
 encrypted_key BYTEA NOT NULL, -- K_G cifrada con RSA-OAEP del miembro
 joined_at TIMESTAMPTZ DEFAULT NOW(),
 left_at TIMESTAMPTZ,
 UNIQUE(group_key_id, user_id, COALESCE(left_at, 'infinity'))
);
```

CREATE TABLE group_keys ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), group_id UUID UNIQUE NOT NULL REFERENCES therapy_groups(id), created_by UUID NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ DEFAULT NOW(), rotated_at TIMESTAMPTZ, is_active BOOLEAN DEFAULT true ); CREATE TABLE group_key_members ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), group_key_id UUID NOT NULL REFERENCES group_keys(id), user_id UUID NOT NULL REFERENCES users(id), encrypted_key BYTEA NOT NULL, -- K_G cifrada con RSA-OAEP del miembro joined_at TIMESTAMPTZ DEFAULT NOW(), left_at TIMESTAMPTZ, UNIQUE(group_key_id, user_id, COALESCE(left_at, 'infinity')) );

### 3.5 Procesamiento en RAM volatil con memory zeroing explicito

Todo dato clinico descifrado se procesa EXCLUSIVAMENTE en RAM

y se sobrescribe con ceros inmediatamente despues de usar.

```
// backend/src/crypto/memoryZeroing.js
const { sensitive } = require('@sensitive-utils/memory-safe');
const { randomBytes } = require('crypto');

class SecureBuffer {
 constructor(size) {
 this.buffer = Buffer.allocUnsafe(size);
 // Llenar con ruido para evitar data remanente de alloc previo
 this.buffer.fill(0x42);
 }

 write(data, offset = 0) {
 const written = this.buffer.write(data, offset);
 // Prevenir que el compilador optimice la escritura
 // (noop que fuerza retention)
 process.noDeprecation = true;
 return written;
 }

 read(offset = 0, length = this.buffer.length) {
 return this.buffer.slice(offset, offset + length);
 }

 /**
 * Sobrescribe el buffer con ceros de forma segura
 * Garantizado por V8 (--zero-fill-buffers no es suficiente)
 */
 zeroize() {
 // Sobrescribir 3 veces: ceros, unos, ceros
 this.buffer.fill(0x00);
 this.buffer.fill(0xFF);
 this.buffer.fill(0x00);

 // Forzar que V8 no optimice esta funcion
 // (evita que el GC mueva datos sin limpiar)
 if (typeof global.gc === 'function') {
 global.gc();
 }
 }

 /**
 * Limpieza automatica con destructor
 */
 destroy() {
 this.zeroize();
 this.buffer = null;
 }
}

// Ejemplo de uso en pipeline de IA
async function processClinicalMessage(encryptedPayload) {
 const secureBuf = new SecureBuffer(65536);

 try {
 // Solo en RAM: descifrar KEK
 const kek = await decryptKEK(encryptedPayload.kekId);
 secureBuf.write(kek);

 // Descifrar contenido en RAM
 const plaintext = await aes256GcmDecrypt(
 secureBuf.read(0, 32), // KEK desde buffer seguro
 encryptedPayload.ciphertext,
 encryptedPayload.iv
 );

 // Procesar con LLM (el modelo se ejecuta en GPU,
 // pero el prompt se construye en RAM del sistema)
 const response = await llm.process(plaintext);

 // El resultado se vuelve a cifrar antes de almacenar
 return response;

 } finally {
 // SIEMPRE limpiar memoria
 secureBuf.destroy();
 kek?.zeroize?.();
 plaintext?.zeroize?.();
 }
}
```

// backend/src/crypto/memoryZeroing.js const { sensitive } = require('@sensitive-utils/memory-safe'); const { randomBytes } = require('crypto'); class SecureBuffer { constructor(size) { this.buffer = Buffer.allocUnsafe(size); // Llenar con ruido para evitar data remanente de alloc previo this.buffer.fill(0x42); } write(data, offset = 0) { const written = this.buffer.write(data, offset); // Prevenir que el compilador optimice la escritura // (noop que fuerza retention) process.noDeprecation = true; return written; } read(offset = 0, length = this.buffer.length) { return this.buffer.slice(offset, offset + length); } /** * Sobrescribe el buffer con ceros de forma segura * Garantizado por V8 (--zero-fill-buffers no es suficiente) */ zeroize() { // Sobrescribir 3 veces: ceros, unos, ceros this.buffer.fill(0x00); this.buffer.fill(0xFF); this.buffer.fill(0x00); // Forzar que V8 no optimice esta funcion // (evita que el GC mueva datos sin limpiar) if (typeof global.gc === 'function') { global.gc(); } } /** * Limpieza automatica con destructor */ destroy() { this.zeroize(); this.buffer = null; } } // Ejemplo de uso en pipeline de IA async function processClinicalMessage(encryptedPayload) { const secureBuf = new SecureBuffer(65536); try { // Solo en RAM: descifrar KEK const kek = await decryptKEK(encryptedPayload.kekId); secureBuf.write(kek); // Descifrar contenido en RAM const plaintext = await aes256GcmDecrypt( secureBuf.read(0, 32), // KEK desde buffer seguro encryptedPayload.ciphertext, encryptedPayload.iv ); // Procesar con LLM (el modelo se ejecuta en GPU, // pero el prompt se construye en RAM del sistema) const response = await llm.process(plaintext); // El resultado se vuelve a cifrar antes de almacenar return response; } finally { // SIEMPRE limpiar memoria secureBuf.destroy(); kek?.zeroize?.(); plaintext?.zeroize?.(); } }

### 3.6 mlock/mlockall para evitar swap de datos sensibles

```
// backend/init_secure_memory.c
// Binario auxiliar que se ejecuta al inicio del servicio
// para bloquear toda la memoria del proceso en RAM fisica

#define _GNU_SOURCE
#include <sys/mman.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[]) {
 // mlockall: Bloquear todas las paginas de memoria actuales Y futuras
 // MCL_CURRENT: Bloquear paginas ya asignadas
 // MCL_FUTURE: Bloquear futuras asignaciones
 // MCL_ONFAULT: Solo bloquear cuando se acceda (menos agresivo)
 if (mlockall(MCL_CURRENT | MCL_FUTURE | MCL_ONFAULT) == -1) {
 perror("mlockall failed");
 fprintf(stderr, "Ejecutar como root o configurar:\n");
 fprintf(stderr, " sudo setcap cap_ipc_lock+ep /path/to/process\n");
 fprintf(stderr, "O en docker: --security-opt seccomp=unconfined\n");
 return 1;
 }

 // Verificar limite RLIMIT_MEMLOCK
 struct rlimit rlim;
 if (getrlimit(RLIMIT_MEMLOCK, &rlim) == 0) {
 printf("MEMLOCK limits: soft=%lu hard=%lu\n",
 rlim.rlim_cur, rlim.rlim_max);
 }

 return 0;
}
```

// backend/init_secure_memory.c // Binario auxiliar que se ejecuta al inicio del servicio // para bloquear toda la memoria del proceso en RAM fisica #define _GNU_SOURCE #include <sys/mman.h> #include <unistd.h> #include <stdio.h> #include <stdlib.h> int main(int argc, char *argv[]) { // mlockall: Bloquear todas las paginas de memoria actuales Y futuras // MCL_CURRENT: Bloquear paginas ya asignadas // MCL_FUTURE: Bloquear futuras asignaciones // MCL_ONFAULT: Solo bloquear cuando se acceda (menos agresivo) if (mlockall(MCL_CURRENT | MCL_FUTURE | MCL_ONFAULT) == -1) { perror("mlockall failed"); fprintf(stderr, "Ejecutar como root o configurar:\n"); fprintf(stderr, " sudo setcap cap_ipc_lock+ep /path/to/process\n"); fprintf(stderr, "O en docker: --security-opt seccomp=unconfined\n"); return 1; } // Verificar limite RLIMIT_MEMLOCK struct rlimit rlim; if (getrlimit(RLIMIT_MEMLOCK, &rlim) == 0) { printf("MEMLOCK limits: soft=%lu hard=%lu\n", rlim.rlim_cur, rlim.rlim_max); } return 0; }

#### Configuracion de produccion

```
# /etc/systemd/system/ancora-backend.service
[Service]
# Aumentar limite de memoria lockeable
LimitMEMLOCK=infinity

# Capacidad para mlockall
AmbientCapabilities=CAP_IPC_LOCK

# Prevenir core dumps (pueden contener datos sensibles)
LimitCORE=0

# No permitir dump de memoria del proceso
MemoryDenyWriteExecute=true

# Protecciones adicionales
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
NoNewPrivileges=true
```

# /etc/systemd/system/ancora-backend.service [Service] # Aumentar limite de memoria lockeable LimitMEMLOCK=infinity # Capacidad para mlockall AmbientCapabilities=CAP_IPC_LOCK # Prevenir core dumps (pueden contener datos sensibles) LimitCORE=0 # No permitir dump de memoria del proceso MemoryDenyWriteExecute=true # Protecciones adicionales ProtectSystem=strict ProtectHome=true PrivateTmp=true NoNewPrivileges=true

```
# docker-compose.yml seccion backend
 backend:
 image: ancora-backend:latest
 security_opt:
 - seccomp=unconfined # Necesario para mlockall
 - apparmor=unconfined
 cap_add:
 - IPC_LOCK # Capacidad para mlock/mlockall
 ulimits:
 memlock:
 soft: -1 # Sin limite
 hard: -1
 environment:
 - NODE_OPTIONS=--zero-fill-buffers # V8 zeroes allocated buffers
 - NODE_PENDING_DEPRECATION=1
 volumes:
 # No montar discos de swap dentro del contenedor
 - type: tmpfs
 target: /tmp
 tmpfs:
 size: 128M
 noexec: true
 nosuid: true
```

# docker-compose.yml seccion backend backend: image: ancora-backend:latest security_opt: - seccomp=unconfined # Necesario para mlockall - apparmor=unconfined cap_add: - IPC_LOCK # Capacidad para mlock/mlockall ulimits: memlock: soft: -1 # Sin limite hard: -1 environment: - NODE_OPTIONS=--zero-fill-buffers # V8 zeroes allocated buffers - NODE_PENDING_DEPRECATION=1 volumes: # No montar discos de swap dentro del contenedor - type: tmpfs target: /tmp tmpfs: size: 128M noexec: true nosuid: true

#### Verificacion de que mlock funciona

```
# Comprobar que un proceso tiene paginas lockeadas
# desde el host (o con nsenter en Docker)
sudo nsenter -t $(docker inspect -f '{{.State.Pid}}' ancora-backend) -m

# Dentro del namespace:
cat /proc/self/status | grep -i lock
# VmSwap: 0 kB <- CRITICO: debe ser 0
# VmLck: 123456 kB <- Memoria lockeada

# Verificar con /proc/self/maps | grep -i lock
# Si VmSwap > 0, hay datos sensibles yendose a disco
```

# Comprobar que un proceso tiene paginas lockeadas # desde el host (o con nsenter en Docker) sudo nsenter -t $(docker inspect -f '{{.State.Pid}}' ancora-backend) -m # Dentro del namespace: cat /proc/self/status | grep -i lock # VmSwap: 0 kB <- CRITICO: debe ser 0 # VmLck: 123456 kB <- Memoria lockeada # Verificar con /proc/self/maps | grep -i lock # Si VmSwap > 0, hay datos sensibles yendose a disco

## 4. CICLO DE VIDA DE LOS DATOS

### 4.1 Alta: consentimiento explicito + configuracion enclave cifrado

```
FLUJO DE ALTA DE PACIENTE
========================================

FASE 1: PRE-REGISTRO
 [ ] Paciente recibe invitacion (cualquier metodo del punto 1)
 [ ] Acepta terminos de servicio
 [ ] Crea password (evaluacion de fortaleza en cliente)
 [ ] Deriva KEK con Argon2id en navegador
 [ ] Genera par RSA (para E2EE chats)

FASE 2: CONSENTIMIENTO EXPLICITO (Art. 9 RGPD)
 [ ] Checkbox 1: "Consiento el tratamiento de mis datos de salud
 para telepsicologia con el psicologo asignado"
 [NO PREMARCADO - accion afirmativa requerida]
 [ ] Checkbox 2: "Autorizo a la IA local a procesar mis datos
 clinicos para generar resumenes y alertas"
 [NO PREMARCADO]
 [ ] Checkbox 3: "Entiendo que puedo revocar mi consentimiento
 en cualquier momento, solicitando la baja y destruccion
 de mis datos"
 [ ] Firma electronica simple (checkbox + timestamp + IP)

FASE 3: CONFIGURACION ENCLAVE CIFRADO
 [ ] Salt de Argon2id almacenado en servidor
 [ ] KEK envuelta (wrapped con server key) almacenada
 [ ] Clave publica RSA almacenada
 [ ] Clave privada RSA cifrada con KEK, almacenada
 (nunca en claro en servidor)
 [ ] Backup de recovery: frase de recuperacion de 12 palabras
 (BIP39, almacenada SOLO en el cliente)

FASE 4: PRIMERA CARGA DE DATOS
 [ ] Cuestionario inicial (PHQ-9, GAD-7)
 [ ] Datos demograficos minimos
 [ ] Toda la informacion se cifra con KEK antes de enviar
```

FLUJO DE ALTA DE PACIENTE ======================================== FASE 1: PRE-REGISTRO [ ] Paciente recibe invitacion (cualquier metodo del punto 1) [ ] Acepta terminos de servicio [ ] Crea password (evaluacion de fortaleza en cliente) [ ] Deriva KEK con Argon2id en navegador [ ] Genera par RSA (para E2EE chats) FASE 2: CONSENTIMIENTO EXPLICITO (Art. 9 RGPD) [ ] Checkbox 1: "Consiento el tratamiento de mis datos de salud para telepsicologia con el psicologo asignado" [NO PREMARCADO - accion afirmativa requerida] [ ] Checkbox 2: "Autorizo a la IA local a procesar mis datos clinicos para generar resumenes y alertas" [NO PREMARCADO] [ ] Checkbox 3: "Entiendo que puedo revocar mi consentimiento en cualquier momento, solicitando la baja y destruccion de mis datos" [ ] Firma electronica simple (checkbox + timestamp + IP) FASE 3: CONFIGURACION ENCLAVE CIFRADO [ ] Salt de Argon2id almacenado en servidor [ ] KEK envuelta (wrapped con server key) almacenada [ ] Clave publica RSA almacenada [ ] Clave privada RSA cifrada con KEK, almacenada (nunca en claro en servidor) [ ] Backup de recovery: frase de recuperacion de 12 palabras (BIP39, almacenada SOLO en el cliente) FASE 4: PRIMERA CARGA DE DATOS [ ] Cuestionario inicial (PHQ-9, GAD-7) [ ] Datos demograficos minimos [ ] Toda la informacion se cifra con KEK antes de enviar

#### Log de consentimiento

```
CREATE TABLE consent_records (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 patient_id UUID NOT NULL REFERENCES patients(id),
 consent_type VARCHAR(50) NOT NULL,
 -- 'treatment': Art. 9.2.a
 -- 'ai_processing': procesamiento IA
 -- 'data_transfer': transferencia a otro psicologo
 -- 'export': exportacion de datos
 -- 'revocation': revocacion de consentimiento
 granted BOOLEAN NOT NULL,
 ip_address INET,
 user_agent TEXT,
 signed_hash VARCHAR(64), -- Hash firmado de los terminos aceptados
 version_terms VARCHAR(20), -- 'v1.2' de los terminos aceptados
 created_at TIMESTAMPTZ DEFAULT NOW(),
 INDEX idx_patient_consent (patient_id, consent_type)
);

-- Cada consetimiento queda registrado inmutablemente
-- Trigger de no-borrado: solo INSERT, nunca DELETE o UPDATE
CREATE OR REPLACE FUNCTION prevent_consent_alteration()
RETURNS TRIGGER AS $$
BEGIN
 RAISE EXCEPTION 'Consent records are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER immutable_consent
 BEFORE UPDATE OR DELETE ON consent_records
 FOR EACH ROW EXECUTE FUNCTION prevent_consent_alteration();
```

CREATE TABLE consent_records ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), patient_id UUID NOT NULL REFERENCES patients(id), consent_type VARCHAR(50) NOT NULL, -- 'treatment': Art. 9.2.a -- 'ai_processing': procesamiento IA -- 'data_transfer': transferencia a otro psicologo -- 'export': exportacion de datos -- 'revocation': revocacion de consentimiento granted BOOLEAN NOT NULL, ip_address INET, user_agent TEXT, signed_hash VARCHAR(64), -- Hash firmado de los terminos aceptados version_terms VARCHAR(20), -- 'v1.2' de los terminos aceptados created_at TIMESTAMPTZ DEFAULT NOW(), INDEX idx_patient_consent (patient_id, consent_type) ); -- Cada consetimiento queda registrado inmutablemente -- Trigger de no-borrado: solo INSERT, nunca DELETE o UPDATE CREATE OR REPLACE FUNCTION prevent_consent_alteration() RETURNS TRIGGER AS $$ BEGIN RAISE EXCEPTION 'Consent records are immutable'; END; $$ LANGUAGE plpgsql; CREATE TRIGGER immutable_consent BEFORE UPDATE OR DELETE ON consent_records FOR EACH ROW EXECUTE FUNCTION prevent_consent_alteration();

### 4.2 Activo: procesamiento diario cifrado, backups incrementales, trazabilidad

#### Procesamiento diario

```
CADA DIA (cron jobs)
========================================

02:00 AM - Procesamiento nocturno
 [ ] Revisar chats del dia anterior
 [ ] Generar resumenes IA (en RAM, cifrar antes de almacenar)
 [ ] Detectar patrones anomalos
 [ ] Actualizar metricas de progreso

06:00 AM - Backup incremental
 [ ] pg_dump cifrado -> bucket S3 (cifrado lado cliente)
 [ ] Solo datos de las ultimas 24h
 [ ] Hash de integridad verificado

Cada hora - Health check
 [ ] Verificar integridad de KEKs (que los accesos existen)
 [ ] Rotar claves de sesion de chat si >24h
 [ ] Limpiar tokens expirados
 [ ] Verificar estado de mlock (VmSwap debe ser 0)

Tiempo real - Trazabilidad
 [ ] Cada acceso a datos -> audit_log
 [ ] Cada mensaje -> hash chain
 [ ] Cada cambio en objetivos -> log
```

CADA DIA (cron jobs) ======================================== 02:00 AM - Procesamiento nocturno [ ] Revisar chats del dia anterior [ ] Generar resumenes IA (en RAM, cifrar antes de almacenar) [ ] Detectar patrones anomalos [ ] Actualizar metricas de progreso 06:00 AM - Backup incremental [ ] pg_dump cifrado -> bucket S3 (cifrado lado cliente) [ ] Solo datos de las ultimas 24h [ ] Hash de integridad verificado Cada hora - Health check [ ] Verificar integridad de KEKs (que los accesos existen) [ ] Rotar claves de sesion de chat si >24h [ ] Limpiar tokens expirados [ ] Verificar estado de mlock (VmSwap debe ser 0) Tiempo real - Trazabilidad [ ] Cada acceso a datos -> audit_log [ ] Cada mensaje -> hash chain [ ] Cada cambio en objetivos -> log

#### Backup strategy

```
#!/bin/bash
# scripts/backup.sh - Backup incremental cifrado

BACKUP_DIR="/data/backups/$(date +%Y-%m-%d)"
ENCRYPTION_KEY_ID="backup-key-$(date +%Y%m)"

mkdir -p "$BACKUP_DIR"

# 1. Backup WAL (Write-Ahead Log) de PostgreSQL
# Permite Point-In-Time Recovery
pg_basebackup \
 -D "$BACKUP_DIR/pg_wal" \
 -X stream \
 -z \
 -P \
 --wal-method=stream

# 2. Cifrar backup con clave de respaldo
# (clave almacenada en HSM, no en servidor)
openssl enc -aes-256-gcm \
 -K "$(hsm_get_key $ENCRYPTION_KEY_ID)" \
 -iv "$(openssl rand -hex 12)" \
 -in "$BACKUP_DIR/pg_wal.tar.gz" \
 -out "$BACKUP_DIR/pg_wal.tar.gz.enc"

# 3. Subir a S3 Glacier (WORM + Object Lock)
aws s3 cp \
 "$BACKUP_DIR/pg_wal.tar.gz.enc" \
 "s3://ancora-backups/${BACKUP_DIR}/pg_wal.tar.gz.enc" \
 --storage-class GLACIER \
 --sse aws:kms

# 4. Verificar hash
sha256sum "$BACKUP_DIR/pg_wal.tar.gz.enc" > "$BACKUP_DIR/hash.sha256"

# 5. Limpiar backups locales > 30 dias
find /data/backups -mtime +30 -delete
```

#!/bin/bash # scripts/backup.sh - Backup incremental cifrado BACKUP_DIR="/data/backups/$(date +%Y-%m-%d)" ENCRYPTION_KEY_ID="backup-key-$(date +%Y%m)" mkdir -p "$BACKUP_DIR" # 1. Backup WAL (Write-Ahead Log) de PostgreSQL # Permite Point-In-Time Recovery pg_basebackup \ -D "$BACKUP_DIR/pg_wal" \ -X stream \ -z \ -P \ --wal-method=stream # 2. Cifrar backup con clave de respaldo # (clave almacenada en HSM, no en servidor) openssl enc -aes-256-gcm \ -K "$(hsm_get_key $ENCRYPTION_KEY_ID)" \ -iv "$(openssl rand -hex 12)" \ -in "$BACKUP_DIR/pg_wal.tar.gz" \ -out "$BACKUP_DIR/pg_wal.tar.gz.enc" # 3. Subir a S3 Glacier (WORM + Object Lock) aws s3 cp \ "$BACKUP_DIR/pg_wal.tar.gz.enc" \ "s3://ancora-backups/${BACKUP_DIR}/pg_wal.tar.gz.enc" \ --storage-class GLACIER \ --sse aws:kms # 4. Verificar hash sha256sum "$BACKUP_DIR/pg_wal.tar.gz.enc" > "$BACKUP_DIR/hash.sha256" # 5. Limpiar backups locales > 30 dias find /data/backups -mtime +30 -delete

### 4.3 Baja: crypto-shredding

El metodo MAS SEGURO para eliminar datos: no borrar los bytes,

sino destruir la clave que los descifra.

```
FLUJO DE BAJA DEL PACIENTE
========================================

FASE 1: SOLICITUD
 [ ] Paciente: "Solicitar baja de mi cuenta"
 [ ] Confirmacion: "?Que deseas hacer con tus datos?"
 [ ] Opcion A: Exportar historia clinica (recomendado)
 [ ] Opcion B: Borrar todo (crypto-shredding)
 [ ] Opcion C: Anonimizar (datos para investigacion)
 [ ] Re-autenticacion (password + 2FA obligatorio)

FASE 2: EXPORTACION (si aplica)
 [ ] Generar JSON completo cifrado
 [ ] Enviar por email enlace de descarga (expira 7 dias)
 [ ] Log de exportacion

FASE 3: CRYPTO-SHREDDING
 [ ] 1. Revocar acceso de psicologos
 UPDATE patient_key_access SET revoked_at = NOW()
 WHERE patient_id = $1 AND revoked_at IS NULL

 [ ] 2. Destruir KEK del paciente en HSM
 hsm_destroy_key(kek_id_del_paciente)
 Esto es INSTANTANEO e IRREVERSIBLE

 [ ] 3. Sobrescribir KEK envuelta en BD
 UPDATE patient_key_encryption_keys
 SET kek_wrapped = pgp_sym_encrypt('DESTROYED', 'tombstone')
 WHERE patient_id = $1

 [ ] 4. Marcar datos como cryptoshredded
 UPDATE encrypted_chat_entries
 SET encryption_metadata = jsonb_set(
 encryption_metadata,
 '{status}',
 '"cryptoshredded"'
 )
 WHERE patient_id = $1

 [ ] 5. Los backups inmutables en S3 contienen datos cifrados
 cuya clave YA NO EXISTE. Son ceniza criptografica.

FASE 4: NOTIFICACIONES
 [ ] Email al paciente: "Tus datos han sido destruidos"
 [ ] Notificacion al psicologo:
 "El paciente X ha solicitado la baja definitiva"
 [ ] Registro en audit_log (inmutable)
 [ ] Iniciar contador de retencion legal (5 anos para metadatos)
```

FLUJO DE BAJA DEL PACIENTE ======================================== FASE 1: SOLICITUD [ ] Paciente: "Solicitar baja de mi cuenta" [ ] Confirmacion: "?Que deseas hacer con tus datos?" [ ] Opcion A: Exportar historia clinica (recomendado) [ ] Opcion B: Borrar todo (crypto-shredding) [ ] Opcion C: Anonimizar (datos para investigacion) [ ] Re-autenticacion (password + 2FA obligatorio) FASE 2: EXPORTACION (si aplica) [ ] Generar JSON completo cifrado [ ] Enviar por email enlace de descarga (expira 7 dias) [ ] Log de exportacion FASE 3: CRYPTO-SHREDDING [ ] 1. Revocar acceso de psicologos UPDATE patient_key_access SET revoked_at = NOW() WHERE patient_id = $1 AND revoked_at IS NULL [ ] 2. Destruir KEK del paciente en HSM hsm_destroy_key(kek_id_del_paciente) Esto es INSTANTANEO e IRREVERSIBLE [ ] 3. Sobrescribir KEK envuelta en BD UPDATE patient_key_encryption_keys SET kek_wrapped = pgp_sym_encrypt('DESTROYED', 'tombstone') WHERE patient_id = $1 [ ] 4. Marcar datos como cryptoshredded UPDATE encrypted_chat_entries SET encryption_metadata = jsonb_set( encryption_metadata, '{status}', '"cryptoshredded"' ) WHERE patient_id = $1 [ ] 5. Los backups inmutables en S3 contienen datos cifrados cuya clave YA NO EXISTE. Son ceniza criptografica. FASE 4: NOTIFICACIONES [ ] Email al paciente: "Tus datos han sido destruidos" [ ] Notificacion al psicologo: "El paciente X ha solicitado la baja definitiva" [ ] Registro en audit_log (inmutable) [ ] Iniciar contador de retencion legal (5 anos para metadatos)

#### Implementacion de crypto-shredding

```
// backend/src/services/cryptoShredding.service.js
const { HSM } = require('./hsm.client');

async function cryptoShredding(patientId) {
 return await db.transaction(async (tx) => {
 // 1. Obtener KEK ID del paciente
 const kekRecord = await tx.query(
 `SELECT id FROM patient_key_encryption_keys WHERE patient_id = $1 AND is_active = true`,
 [patientId]
 );

 if (kekRecord.rows.length === 0) {
 throw new Error('KEK no encontrada para este paciente');
 }

 const kekId = kekRecord.rows[0].id;

 // 2. Destruir KEK en HSM (FIPS 140-2 Level 3)
 await HSM.destroyKey(kekId);

 // 3. Marcar KEK como destruida
 await tx.query(
 `UPDATE patient_key_encryption_keys
 SET is_active = false,
 kek_wrapped = NULL,
 destroyed_at = NOW()
 WHERE id = $1`,
 [kekId]
 );

 // 4. Revocar TODOS los accesos pendientes
 await tx.query(
 `UPDATE patient_key_access
 SET revoked_at = NOW()
 WHERE patient_id = $1 AND revoked_at IS NULL`,
 [patientId]
 );

 // 5. Eliminar claves de grupo si es plan Duo/Familiar
 await tx.query(
 `UPDATE group_key_members
 SET left_at = NOW()
 WHERE user_id = $1 AND left_at IS NULL`,
 [patientId]
 );

 // 6. Anonimizar datos de identificacion directa
 // (conservamos metadatos minimos por obligacion legal)
 await tx.query(
 `UPDATE patients
 SET email_hash = NULL,
 phone_hash = NULL,
 full_name_encrypted = NULL,
 is_anonymized = true,
 anonymized_at = NOW()
 WHERE id = $1`,
 [patientId]
 );

 // 7. Log de auditoria
 await tx.query(
 `INSERT INTO audit_log (action, patient_id, actor_id, metadata)
 VALUES ('CRYPTO_SHREDDING', $1, $1, $2)`,
 [patientId, JSON.stringify({
 method: 'hsm_key_destruction',
 kek_id: kekId,
 records_cryptoshredded: true,
 timestamp: new Date().toISOString()
 })]
 );

 return {
 success: true,
 method: 'crypto_shredding',
 message: 'Todos los datos han sido criptograficamente destruidos. Las claves de descifrado ya no existen.',
 recovery_possible: false
 };
 });
}
```

// backend/src/services/cryptoShredding.service.js const { HSM } = require('./hsm.client'); async function cryptoShredding(patientId) { return await db.transaction(async (tx) => { // 1. Obtener KEK ID del paciente const kekRecord = await tx.query( `SELECT id FROM patient_key_encryption_keys WHERE patient_id = $1 AND is_active = true`, [patientId] ); if (kekRecord.rows.length === 0) { throw new Error('KEK no encontrada para este paciente'); } const kekId = kekRecord.rows[0].id; // 2. Destruir KEK en HSM (FIPS 140-2 Level 3) await HSM.destroyKey(kekId); // 3. Marcar KEK como destruida await tx.query( `UPDATE patient_key_encryption_keys SET is_active = false, kek_wrapped = NULL, destroyed_at = NOW() WHERE id = $1`, [kekId] ); // 4. Revocar TODOS los accesos pendientes await tx.query( `UPDATE patient_key_access SET revoked_at = NOW() WHERE patient_id = $1 AND revoked_at IS NULL`, [patientId] ); // 5. Eliminar claves de grupo si es plan Duo/Familiar await tx.query( `UPDATE group_key_members SET left_at = NOW() WHERE user_id = $1 AND left_at IS NULL`, [patientId] ); // 6. Anonimizar datos de identificacion directa // (conservamos metadatos minimos por obligacion legal) await tx.query( `UPDATE patients SET email_hash = NULL, phone_hash = NULL, full_name_encrypted = NULL, is_anonymized = true, anonymized_at = NOW() WHERE id = $1`, [patientId] ); // 7. Log de auditoria await tx.query( `INSERT INTO audit_log (action, patient_id, actor_id, metadata) VALUES ('CRYPTO_SHREDDING', $1, $1, $2)`, [patientId, JSON.stringify({ method: 'hsm_key_destruction', kek_id: kekId, records_cryptoshredded: true, timestamp: new Date().toISOString() })] ); return { success: true, method: 'crypto_shredding', message: 'Todos los datos han sido criptograficamente destruidos. Las claves de descifrado ya no existen.', recovery_possible: false }; }); }

### 4.4 Retencion: 5 anos post-baja (Ley 41/2002)

```
LINEA DE TIEMPO DE RETENCION DE DATOS
========================================

t=0: ALTA DEL PACIENTE
 [Datos completos cifrados activos]

t=+X meses: BAJA DEL PACIENTE
 [Crypto-shredding de datos clinicos]
 [Conservacion de metadatos minimos]

t=BAJA: INICIO PERIODO DE RETENCION LEGAL
 [Ley 41/2002, Art. 17: "Los centros sanitarios tienen
 la obligacion de conservar la documentacion clinica
 durante un minimo de cinco anos desde el alta"]

 Datos conservados (MINIMOS, solo metadatos):
 - ID del paciente (hash anonimizado)
 - Fechas de inicio y fin de tratamiento
 - Psicologo(s) asignado(s)
 - Diagnosticos principales (codificados, sin texto libre)
 - Consentimientos (prueba de conformidad legal)

 Datos DESTRUIDOS (crypto-shredding completo):
 - Todo el contenido de chats
 - Notas SOAP del psicologo
 - Diarios emocionales
 - Registros de check-ins
 - Ejercicios y respuestas
 - Grabaciones de sesiones
 - Cualquier texto libre del paciente

t=BAJA + 5 ANOS: DESTRUCCION TOTAL
 [Crypto-shredding de metadatos restantes]
 [Los datos en backups inmutables son ilegibles]
 [Certificado de destruccion emitido]
 [Notificacion al paciente (si email todavia existe)]
```

LINEA DE TIEMPO DE RETENCION DE DATOS ======================================== t=0: ALTA DEL PACIENTE [Datos completos cifrados activos] t=+X meses: BAJA DEL PACIENTE [Crypto-shredding de datos clinicos] [Conservacion de metadatos minimos] t=BAJA: INICIO PERIODO DE RETENCION LEGAL [Ley 41/2002, Art. 17: "Los centros sanitarios tienen la obligacion de conservar la documentacion clinica durante un minimo de cinco anos desde el alta"] Datos conservados (MINIMOS, solo metadatos): - ID del paciente (hash anonimizado) - Fechas de inicio y fin de tratamiento - Psicologo(s) asignado(s) - Diagnosticos principales (codificados, sin texto libre) - Consentimientos (prueba de conformidad legal) Datos DESTRUIDOS (crypto-shredding completo): - Todo el contenido de chats - Notas SOAP del psicologo - Diarios emocionales - Registros de check-ins - Ejercicios y respuestas - Grabaciones de sesiones - Cualquier texto libre del paciente t=BAJA + 5 ANOS: DESTRUCCION TOTAL [Crypto-shredding de metadatos restantes] [Los datos en backups inmutables son ilegibles] [Certificado de destruccion emitido] [Notificacion al paciente (si email todavia existe)]

#### Implementacion del gestor de retencion

```
-- Programado mensualmente
CREATE OR REPLACE FUNCTION process_retention_policy()
RETURNS TABLE(action_taken TEXT, patient_count INT) AS $$
DECLARE
 rec RECORD;
 count_crypto_shred INT := 0;
 count_full_destroy INT := 0;
BEGIN
 -- FASE 1: Pacientes que solicitaron baja -> crypto-shredding
 -- Los datos clinicos se destruyen inmediatamente
 -- (ejecutado en tiempo real en la baja, no aqui)

 -- FASE 2: Pacientes con baja + 5 anos -> destruccion total
 FOR rec IN
 SELECT id, baja_at FROM patients
 WHERE is_anonymized = true
 AND baja_at < NOW() - INTERVAL '5 years'
 AND full_destroyed_at IS NULL
 LOOP
 -- Crypto-shredding de los ultimos metadatos
 PERFORM crypto_shredding_metadata(rec.id);

 UPDATE patients
 SET full_destroyed_at = NOW()
 WHERE id = rec.id;

 count_full_destroy := count_full_destroy + 1;
 END LOOP;

 -- FASE 3: Notificar pacientes (opcional, si hay email)
 -- (no implementado por privacidad - no tenemos email)

 RETURN QUERY
 SELECT 'crypto_shred_completed'::TEXT, count_crypto_shred
 UNION ALL
 SELECT 'full_destroy_completed'::TEXT, count_full_destroy;
END;
$$ LANGUAGE plpgsql;

-- Cron job mensual
SELECT cron.schedule(
 'retention-policy',
 '0 3 1 * *', -- 3:00 AM cada 1 del mes
 'SELECT process_retention_policy()'
);
```

-- Programado mensualmente CREATE OR REPLACE FUNCTION process_retention_policy() RETURNS TABLE(action_taken TEXT, patient_count INT) AS $$ DECLARE rec RECORD; count_crypto_shred INT := 0; count_full_destroy INT := 0; BEGIN -- FASE 1: Pacientes que solicitaron baja -> crypto-shredding -- Los datos clinicos se destruyen inmediatamente -- (ejecutado en tiempo real en la baja, no aqui) -- FASE 2: Pacientes con baja + 5 anos -> destruccion total FOR rec IN SELECT id, baja_at FROM patients WHERE is_anonymized = true AND baja_at < NOW() - INTERVAL '5 years' AND full_destroyed_at IS NULL LOOP -- Crypto-shredding de los ultimos metadatos PERFORM crypto_shredding_metadata(rec.id); UPDATE patients SET full_destroyed_at = NOW() WHERE id = rec.id; count_full_destroy := count_full_destroy + 1; END LOOP; -- FASE 3: Notificar pacientes (opcional, si hay email) -- (no implementado por privacidad - no tenemos email) RETURN QUERY SELECT 'crypto_shred_completed'::TEXT, count_crypto_shred UNION ALL SELECT 'full_destroy_completed'::TEXT, count_full_destroy; END; $$ LANGUAGE plpgsql; -- Cron job mensual SELECT cron.schedule( 'retention-policy', '0 3 1 * *', -- 3:00 AM cada 1 del mes 'SELECT process_retention_policy()' );

### 4.5 Portabilidad: derecho del paciente a exportar (Art. 20 RGPD)

```
DERECHO DE PORTABILIDAD - Art. 20 RGPD
========================================

El paciente tiene derecho a:
 [ ] Recibir sus datos en formato estructurado, de uso comun
 y lectura mecanica (JSON, no PDF)
 [ ] Transmitir esos datos a otro responsable del tratamiento
 (otra plataforma de psicologia)
 [ ] Que Ancora transmita directamente a otro sistema
 (si tecnicamente posible)

PROCEDIMIENTO:
 [ ] 1. Solicitud del paciente (email, formulario web, panel)
 [ ] 2. Plazo maximo: 1 mes (Art. 12.3 RGPD)
 [ ] 3. Verificacion de identidad (2FA obligatorio)
 [ ] 4. Generacion del archivo JSON completo
 [ ] 5. Entrega: descarga directa cifrada
 [ ] 6. Sin coste para el paciente (Art. 12.5)
 [ ] 7. Log de la exportacion

LIMITACIONES:
 [ ] No incluye datos de otros pacientes (planes Duo/Familiar)
 - Solo los datos INDIVIDUALES del solicitante
 [ ] No incluye datos anonimizados
 [ ] Las notas del psicologo son del paciente (Ley 41/2002, Art. 15)
 - SI se incluyen en la exportacion

FORMATOS SOPORTADOS:
 [ ] JSON (.ancora) - Recomendado, completa
 [ ] PDF - Resumen ejecutivo
 [ ] Markdown - Para re-importacion en otras herramientas
 [ ] CSV - Datos tabulares (check-ins, metricas)
```

DERECHO DE PORTABILIDAD - Art. 20 RGPD ======================================== El paciente tiene derecho a: [ ] Recibir sus datos en formato estructurado, de uso comun y lectura mecanica (JSON, no PDF) [ ] Transmitir esos datos a otro responsable del tratamiento (otra plataforma de psicologia) [ ] Que Ancora transmita directamente a otro sistema (si tecnicamente posible) PROCEDIMIENTO: [ ] 1. Solicitud del paciente (email, formulario web, panel) [ ] 2. Plazo maximo: 1 mes (Art. 12.3 RGPD) [ ] 3. Verificacion de identidad (2FA obligatorio) [ ] 4. Generacion del archivo JSON completo [ ] 5. Entrega: descarga directa cifrada [ ] 6. Sin coste para el paciente (Art. 12.5) [ ] 7. Log de la exportacion LIMITACIONES: [ ] No incluye datos de otros pacientes (planes Duo/Familiar) - Solo los datos INDIVIDUALES del solicitante [ ] No incluye datos anonimizados [ ] Las notas del psicologo son del paciente (Ley 41/2002, Art. 15) - SI se incluyen en la exportacion FORMATOS SOPORTADOS: [ ] JSON (.ancora) - Recomendado, completa [ ] PDF - Resumen ejecutivo [ ] Markdown - Para re-importacion en otras herramientas [ ] CSV - Datos tabulares (check-ins, metricas)

## 5. TRAZABILIDAD Y AUDITORIA

### 5.1 Hash chain de logs de acceso (SHA256 encadenado)

Cada registro de auditoria contiene un hash del registro anterior,

formando una cadena inmutable. Modificar o eliminar un registro

rompe la cadena.

```
Estructura de la hash chain
========================================

Genesis Block (primer registro de auditoria)
+----------------------------------------------------+
| id: 1 |
| action: "SYSTEM_INIT" |
| timestamp: 2026-01-01T00:00:00Z |
| previous_hash: "0000000000000000..." | <-- Hash cero (genesis)
| current_hash: "a1b2c3d4e5f6..." |
| hash_input: "1|SYSTEM_INIT|2026-01-01T00:00:00Z| |
| 0000000000000000..." |
+----------------------------------------------------+
 |
 v (previous_hash apunta aqui)

Block 2: "PSYCHOLOGIST_ACCESS"
+----------------------------------------------------+
| id: 2 |
| action: "PSYCHOLOGIST_ACCESS" |
| patient_id: "pat_001" |
| psychologist_id: "psy_003" |
| timestamp: 2026-01-01T10:30:00Z |
| previous_hash: "a1b2c3d4e5f6..." | <-- Hash del block 1
| current_hash: "f0e1d2c3b4a5..." |
| hash_input: "2|PSYCHOLOGIST_ACCESS|pat_001| |
| psy_003|2026-01-01T10:30:00Z| |
| a1b2c3d4e5f6..." |
+----------------------------------------------------+
 |
 v

Block 3: "PATIENT_EXPORT"
+----------------------------------------------------+
| id: 3 |
| ... |
| previous_hash: "f0e1d2c3b4a5..." |
+----------------------------------------------------+
```

Estructura de la hash chain ======================================== Genesis Block (primer registro de auditoria) +----------------------------------------------------+ | id: 1 | | action: "SYSTEM_INIT" | | timestamp: 2026-01-01T00:00:00Z | | previous_hash: "0000000000000000..." | <-- Hash cero (genesis) | current_hash: "a1b2c3d4e5f6..." | | hash_input: "1|SYSTEM_INIT|2026-01-01T00:00:00Z| | | 0000000000000000..." | +----------------------------------------------------+ | v (previous_hash apunta aqui) Block 2: "PSYCHOLOGIST_ACCESS" +----------------------------------------------------+ | id: 2 | | action: "PSYCHOLOGIST_ACCESS" | | patient_id: "pat_001" | | psychologist_id: "psy_003" | | timestamp: 2026-01-01T10:30:00Z | | previous_hash: "a1b2c3d4e5f6..." | <-- Hash del block 1 | current_hash: "f0e1d2c3b4a5..." | | hash_input: "2|PSYCHOLOGIST_ACCESS|pat_001| | | psy_003|2026-01-01T10:30:00Z| | | a1b2c3d4e5f6..." | +----------------------------------------------------+ | v Block 3: "PATIENT_EXPORT" +----------------------------------------------------+ | id: 3 | | ... | | previous_hash: "f0e1d2c3b4a5..." | +----------------------------------------------------+

#### Implementacion

```
CREATE TABLE audit_hash_chain (
 id BIGSERIAL PRIMARY KEY,
 action VARCHAR(50) NOT NULL,
 patient_id UUID,
 actor_id UUID NOT NULL, -- Quien hizo la accion
 actor_type VARCHAR(20) NOT NULL, -- 'patient', 'psychologist', 'admin', 'system'
 metadata JSONB, -- Datos adicionales de la accion
 ip_address INET, -- IP del actor
 user_agent TEXT, -- Browser/device
 geo_location JSONB, -- Pais/ciudad aproximada
 timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

 -- Hash chain
 previous_hash VARCHAR(64) NOT NULL,
 current_hash VARCHAR(64) NOT NULL UNIQUE,

 INDEX idx_audit_patient (patient_id),
 INDEX idx_audit_actor (actor_id),
 INDEX idx_audit_timestamp (timestamp)
);

-- Funcion para generar el hash de un registro
CREATE OR REPLACE FUNCTION compute_audit_hash(
 id BIGINT,
 action VARCHAR,
 patient_id UUID,
 actor_id UUID,
 actor_type VARCHAR,
 metadata JSONB,
 ip_address INET,
 timestamp TIMESTAMPTZ,
 previous_hash VARCHAR
) RETURNS VARCHAR(64) AS $$
BEGIN
 RETURN encode(
 digest(
 format('%s|%s|%s|%s|%s|%s|%s|%s|%s',
 id, action, COALESCE(patient_id::text, ''),
 actor_id, actor_type,
 COALESCE(metadata::text, ''),
 COALESCE(ip_address::text, ''),
 timestamp::text,
 previous_hash
 ),
 'sha256'
 ),
 'hex'
 );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger que genera el hash chain automaticamente
CREATE OR REPLACE FUNCTION audit_hash_chain_trigger()
RETURNS TRIGGER AS $$
DECLARE
 prev_hash VARCHAR(64);
BEGIN
 -- Obtener el hash del ultimo registro
 SELECT COALESCE(
 (SELECT current_hash FROM audit_hash_chain ORDER BY id DESC LIMIT 1),
 '0000000000000000000000000000000000000000000000000000000000000000'
 ) INTO prev_hash;

 NEW.previous_hash := prev_hash;
 NEW.current_hash := compute_audit_hash(
 NEW.id, NEW.action, NEW.patient_id,
 NEW.actor_id, NEW.actor_type, NEW.metadata,
 NEW.ip_address, NEW.timestamp, prev_hash
 );

 RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_hash
 BEFORE INSERT ON audit_hash_chain
 FOR EACH ROW
 EXECUTE FUNCTION audit_hash_chain_trigger();

-- Funcion de verificacion de integridad
CREATE OR REPLACE FUNCTION verify_audit_chain()
RETURNS TABLE(chain_valid BOOLEAN, broken_at BIGINT) AS $$
DECLARE
 rec RECORD;
 expected_hash VARCHAR(64);
 prev_hash VARCHAR(64) := '0000000000000000000000000000000000000000000000000000000000000000';
 current_id BIGINT;
BEGIN
 chain_valid := true;
 broken_at := NULL;

 FOR rec IN SELECT * FROM audit_hash_chain ORDER BY id LOOP
 expected_hash := compute_audit_hash(
 rec.id, rec.action, rec.patient_id,
 rec.actor_id, rec.actor_type, rec.metadata,
 rec.ip_address, rec.timestamp, prev_hash
 );

 IF expected_hash != rec.current_hash THEN
 chain_valid := false;
 broken_at := rec.id;
 RETURN NEXT;
 RETURN;
 END IF;

 IF rec.previous_hash != prev_hash THEN
 chain_valid := false;
 broken_at := rec.id;
 RETURN NEXT;
 RETURN;
 END IF;

 prev_hash := rec.current_hash;
 END LOOP;

 RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
```

CREATE TABLE audit_hash_chain ( id BIGSERIAL PRIMARY KEY, action VARCHAR(50) NOT NULL, patient_id UUID, actor_id UUID NOT NULL, -- Quien hizo la accion actor_type VARCHAR(20) NOT NULL, -- 'patient', 'psychologist', 'admin', 'system' metadata JSONB, -- Datos adicionales de la accion ip_address INET, -- IP del actor user_agent TEXT, -- Browser/device geo_location JSONB, -- Pais/ciudad aproximada timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- Hash chain previous_hash VARCHAR(64) NOT NULL, current_hash VARCHAR(64) NOT NULL UNIQUE, INDEX idx_audit_patient (patient_id), INDEX idx_audit_actor (actor_id), INDEX idx_audit_timestamp (timestamp) ); -- Funcion para generar el hash de un registro CREATE OR REPLACE FUNCTION compute_audit_hash( id BIGINT, action VARCHAR, patient_id UUID, actor_id UUID, actor_type VARCHAR, metadata JSONB, ip_address INET, timestamp TIMESTAMPTZ, previous_hash VARCHAR ) RETURNS VARCHAR(64) AS $$ BEGIN RETURN encode( digest( format('%s|%s|%s|%s|%s|%s|%s|%s|%s', id, action, COALESCE(patient_id::text, ''), actor_id, actor_type, COALESCE(metadata::text, ''), COALESCE(ip_address::text, ''), timestamp::text, previous_hash ), 'sha256' ), 'hex' ); END; $$ LANGUAGE plpgsql IMMUTABLE; -- Trigger que genera el hash chain automaticamente CREATE OR REPLACE FUNCTION audit_hash_chain_trigger() RETURNS TRIGGER AS $$ DECLARE prev_hash VARCHAR(64); BEGIN -- Obtener el hash del ultimo registro SELECT COALESCE( (SELECT current_hash FROM audit_hash_chain ORDER BY id DESC LIMIT 1), '0000000000000000000000000000000000000000000000000000000000000000' ) INTO prev_hash; NEW.previous_hash := prev_hash; NEW.current_hash := compute_audit_hash( NEW.id, NEW.action, NEW.patient_id, NEW.actor_id, NEW.actor_type, NEW.metadata, NEW.ip_address, NEW.timestamp, prev_hash ); RETURN NEW; END; $$ LANGUAGE plpgsql; CREATE TRIGGER trg_audit_hash BEFORE INSERT ON audit_hash_chain FOR EACH ROW EXECUTE FUNCTION audit_hash_chain_trigger(); -- Funcion de verificacion de integridad CREATE OR REPLACE FUNCTION verify_audit_chain() RETURNS TABLE(chain_valid BOOLEAN, broken_at BIGINT) AS $$ DECLARE rec RECORD; expected_hash VARCHAR(64); prev_hash VARCHAR(64) := '0000000000000000000000000000000000000000000000000000000000000000'; current_id BIGINT; BEGIN chain_valid := true; broken_at := NULL; FOR rec IN SELECT * FROM audit_hash_chain ORDER BY id LOOP expected_hash := compute_audit_hash( rec.id, rec.action, rec.patient_id, rec.actor_id, rec.actor_type, rec.metadata, rec.ip_address, rec.timestamp, prev_hash ); IF expected_hash != rec.current_hash THEN chain_valid := false; broken_at := rec.id; RETURN NEXT; RETURN; END IF; IF rec.previous_hash != prev_hash THEN chain_valid := false; broken_at := rec.id; RETURN NEXT; RETURN; END IF; prev_hash := rec.current_hash; END LOOP; RETURN NEXT; END; $$ LANGUAGE plpgsql;

### 5.2 Cada acceso: quien, cuando, que dato, IP, user-agent

```
-- Acceso a historia clinica
INSERT INTO audit_hash_chain (action, patient_id, actor_id, actor_type,
 metadata, ip_address, user_agent)
VALUES (
 'CLINICAL_HISTORY_ACCESS',
 'pat_001',
 'psy_003',
 'psychologist',
 jsonb_build_object(
 'access_type', 'full_history',
 'sections_accessed', ARRAY['notes', 'chat', 'exercises'],
 'reason', 'weekly_review',
 'session_id', 'ses_abc123' -- Para correlacion con sesion activa
 ),
 '83.45.12.78',
 'Mozilla/5.0 Chrome/125...'
);

-- Ejemplo de logs de acciones registradas:
ACCIONES REGISTRADAS:
 CLINICAL_HISTORY_ACCESS - Acceso a historia clinica
 CHAT_READ - Lectura de chat
 NOTE_CREATED - Nota SOAP creada
 NOTE_MODIFIED - Nota SOAP modificada
 NOTE_VALIDATED - Nota firmada/validada
 PATIENT_CREATED - Alta de paciente
 PATIENT_TRANSFERRED - Transferencia entre psicologos
 PATIENT_EXPORTED - Exportacion de datos
 PATIENT_CRYPTO_SHREDDED - Destruccion de datos
 CONSENT_GRANTED - Consentimiento otorgado
 CONSENT_REVOKED - Consentimiento revocado
 INVITATION_SENT - Invitacion enviada
 INVITATION_USED - Invitacion aceptada
 API_ACCESS - Acceso via API REST
 SYSTEM_LOGIN - Inicio de sesion
 LOGIN_FAILED - Intento fallido de login
 PASSWORD_CHANGED - Cambio de password
 KEY_ROTATED - Rotacion de claves
 EXPORT_DOWNLOAD - Descarga de exportacion
```

-- Acceso a historia clinica INSERT INTO audit_hash_chain (action, patient_id, actor_id, actor_type, metadata, ip_address, user_agent) VALUES ( 'CLINICAL_HISTORY_ACCESS', 'pat_001', 'psy_003', 'psychologist', jsonb_build_object( 'access_type', 'full_history', 'sections_accessed', ARRAY['notes', 'chat', 'exercises'], 'reason', 'weekly_review', 'session_id', 'ses_abc123' -- Para correlacion con sesion activa ), '83.45.12.78', 'Mozilla/5.0 Chrome/125...' ); -- Ejemplo de logs de acciones registradas: ACCIONES REGISTRADAS: CLINICAL_HISTORY_ACCESS - Acceso a historia clinica CHAT_READ - Lectura de chat NOTE_CREATED - Nota SOAP creada NOTE_MODIFIED - Nota SOAP modificada NOTE_VALIDATED - Nota firmada/validada PATIENT_CREATED - Alta de paciente PATIENT_TRANSFERRED - Transferencia entre psicologos PATIENT_EXPORTED - Exportacion de datos PATIENT_CRYPTO_SHREDDED - Destruccion de datos CONSENT_GRANTED - Consentimiento otorgado CONSENT_REVOKED - Consentimiento revocado INVITATION_SENT - Invitacion enviada INVITATION_USED - Invitacion aceptada API_ACCESS - Acceso via API REST SYSTEM_LOGIN - Inicio de sesion LOGIN_FAILED - Intento fallido de login PASSWORD_CHANGED - Cambio de password KEY_ROTATED - Rotacion de claves EXPORT_DOWNLOAD - Descarga de exportacion

### 5.3 Alertas de accesos sospechosos

```
// backend/src/monitoring/anomalyDetector.js
const { createHash } = require('crypto');
const { Redis } = require('ioredis');

class ClinicalAnomalyDetector {
 constructor() {
 this.redis = new Redis();
 this.TELEGRAM_WEBHOOK = process.env.ALERT_WEBHOOK;
 }

 /**
 * Evaluar cada acceso en tiempo real
 */
 async evaluateAccess(auditEntry) {
 const alerts = [];

 // REGLA 1: Acceso fuera del horario laboral
 const hour = new Date().getHours();
 if (hour < 7 || hour > 22) {
 alerts.push({
 severity: 'medium',
 rule: 'OFF_HOURS_ACCESS',
 detail: `Acceso a las ${hour}:00 (fuera de horario 7:00-22:00)`
 });
 }

 // REGLA 2: Geografia anomalia
 if (auditEntry.geo_location?.country_code
 && !this.isExpectedCountry(auditEntry.actor_id, auditEntry.geo_location.country_code)) {
 alerts.push({
 severity: 'high',
 rule: 'UNEXPECTED_GEOGRAPHY',
 detail: `Acceso desde pais no esperado: ${auditEntry.geo_location.country_code}`
 });
 }

 // REGLA 3: Frecuencia de acceso anomala
 const recentAccessCount = await this.getRecentAccessCount(
 auditEntry.actor_id, 5 * 60 // Ultimos 5 minutos
 );
 if (recentAccessCount > 20) {
 alerts.push({
 severity: 'high',
 rule: 'HIGH_FREQUENCY_ACCESS',
 detail: `${recentAccessCount} accesos en 5 minutos`
 });
 }

 // REGLA 4: Acceso a multiples pacientes en poco tiempo
 const uniquePatients5min = await this.getUniquePatientsCount(
 auditEntry.actor_id, 5 * 60
 );
 if (uniquePatients5min > 5 && auditEntry.actor_type === 'psychologist') {
 alerts.push({
 severity: 'critical',
 rule: 'MASS_PATIENT_ACCESS',
 detail: `Accedio a ${uniquePatients5min} pacientes diferentes en 5 min`
 });
 }

 // REGLA 5: Intentos de login fallidos
 const failedLogins = await this.getFailedLoginCount(
 auditEntry.actor_id, 15 * 60 // Ultimos 15 min
 );
 if (failedLogins > 5) {
 alerts.push({
 severity: 'critical',
 rule: 'BRUTE_FORCE_ATTEMPT',
 detail: `${failedLogins} intentos fallidos de login en 15 min`
 });
 }

 // REGLA 6: Dispositivo/browser no reconocido
 const knownDevice = await this.isKnownDevice(
 auditEntry.actor_id, auditEntry.user_agent
 );
 if (!knownDevice && auditEntry.action === 'SYSTEM_LOGIN') {
 alerts.push({
 severity: 'medium',
 rule: 'UNKNOWN_DEVICE',
 detail: `Nuevo dispositivo detectado: ${auditEntry.user_agent?.substring(0, 80)}`
 });
 }

 // Procesar alertas
 for (const alert of alerts) {
 await this.processAlert(alert, auditEntry);
 }

 return alerts;
 }

 async processAlert(alert, auditEntry) {
 // Almacenar alerta
 await this.redis.lpush(
 `alerts:${alert.severity}`,
 JSON.stringify({ alert, auditEntry, timestamp: new Date() })
 );

 // Notificar inmediato si severidad alta o critica
 if (['high', 'critical'].includes(alert.severity)) {
 await this.notifySecurityTeam(alert, auditEntry);
 }

 // Si severidad critica: bloquear temporalmente
 if (alert.severity === 'critical') {
 await this.temporarilyBlockAccess(auditEntry.actor_id);
 }
 }

 async notifySecurityTeam(alert, auditEntry) {
 const message = `
[ALERTA DE SEGURIDAD - ANCORA]
Severidad: ${alert.severity.toUpperCase()}
Regla: ${alert.rule}
Detalle: ${alert.detail}
Actor: ${auditEntry.actor_id} (${auditEntry.actor_type})
IP: ${auditEntry.ip_address}
Timestamp: ${auditEntry.timestamp}

Accion requerida inmediata si severidad CRITICAL.
 `;

 // Enviar a canal de seguridad (Telegram/Slack/PagerDuty)
 await fetch(this.TELEGRAM_WEBHOOK, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ text: message })
 });
 }

 async temporarilyBlockAccess(actorId) {
 await this.redis.setex(`blocked:${actorId}`, 600, 'true'); // 10 min
 // En produccion: revocar sesiones activas, notificar, escalar
 }

 // Helpers con Redis
 async getRecentAccessCount(actorId, windowSeconds) {
 const key = `access_count:${actorId}`;
 const multi = this.redis.multi();
 multi.lpush(key, Date.now());
 multi.ltrim(key, 0, 999);
 multi.expire(key, windowSeconds);
 const results = await multi.exec();

 const all = await this.redis.lrange(key, 0, -1);
 const cutoff = Date.now() - windowSeconds * 1000;
 return all.filter(t => parseInt(t) > cutoff).length;
 }

 async getUniquePatientsCount(actorId, windowSeconds) {
 const key = `unique_patients:${actorId}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;
 return await this.redis.scard(key);
 }

 async getFailedLoginCount(actorId, windowSeconds) {
 const key = `failed_logins:${actorId}`;
 const count = await this.redis.get(key);
 return parseInt(count || '0');
 }
}
```

// backend/src/monitoring/anomalyDetector.js const { createHash } = require('crypto'); const { Redis } = require('ioredis'); class ClinicalAnomalyDetector { constructor() { this.redis = new Redis(); this.TELEGRAM_WEBHOOK = process.env.ALERT_WEBHOOK; } /** * Evaluar cada acceso en tiempo real */ async evaluateAccess(auditEntry) { const alerts = []; // REGLA 1: Acceso fuera del horario laboral const hour = new Date().getHours(); if (hour < 7 || hour > 22) { alerts.push({ severity: 'medium', rule: 'OFF_HOURS_ACCESS', detail: `Acceso a las ${hour}:00 (fuera de horario 7:00-22:00)` }); } // REGLA 2: Geografia anomalia if (auditEntry.geo_location?.country_code && !this.isExpectedCountry(auditEntry.actor_id, auditEntry.geo_location.country_code)) { alerts.push({ severity: 'high', rule: 'UNEXPECTED_GEOGRAPHY', detail: `Acceso desde pais no esperado: ${auditEntry.geo_location.country_code}` }); } // REGLA 3: Frecuencia de acceso anomala const recentAccessCount = await this.getRecentAccessCount( auditEntry.actor_id, 5 * 60 // Ultimos 5 minutos ); if (recentAccessCount > 20) { alerts.push({ severity: 'high', rule: 'HIGH_FREQUENCY_ACCESS', detail: `${recentAccessCount} accesos en 5 minutos` }); } // REGLA 4: Acceso a multiples pacientes en poco tiempo const uniquePatients5min = await this.getUniquePatientsCount( auditEntry.actor_id, 5 * 60 ); if (uniquePatients5min > 5 && auditEntry.actor_type === 'psychologist') { alerts.push({ severity: 'critical', rule: 'MASS_PATIENT_ACCESS', detail: `Accedio a ${uniquePatients5min} pacientes diferentes en 5 min` }); } // REGLA 5: Intentos de login fallidos const failedLogins = await this.getFailedLoginCount( auditEntry.actor_id, 15 * 60 // Ultimos 15 min ); if (failedLogins > 5) { alerts.push({ severity: 'critical', rule: 'BRUTE_FORCE_ATTEMPT', detail: `${failedLogins} intentos fallidos de login en 15 min` }); } // REGLA 6: Dispositivo/browser no reconocido const knownDevice = await this.isKnownDevice( auditEntry.actor_id, auditEntry.user_agent ); if (!knownDevice && auditEntry.action === 'SYSTEM_LOGIN') { alerts.push({ severity: 'medium', rule: 'UNKNOWN_DEVICE', detail: `Nuevo dispositivo detectado: ${auditEntry.user_agent?.substring(0, 80)}` }); } // Procesar alertas for (const alert of alerts) { await this.processAlert(alert, auditEntry); } return alerts; } async processAlert(alert, auditEntry) { // Almacenar alerta await this.redis.lpush( `alerts:${alert.severity}`, JSON.stringify({ alert, auditEntry, timestamp: new Date() }) ); // Notificar inmediato si severidad alta o critica if (['high', 'critical'].includes(alert.severity)) { await this.notifySecurityTeam(alert, auditEntry); } // Si severidad critica: bloquear temporalmente if (alert.severity === 'critical') { await this.temporarilyBlockAccess(auditEntry.actor_id); } } async notifySecurityTeam(alert, auditEntry) { const message = ` [ALERTA DE SEGURIDAD - ANCORA] Severidad: ${alert.severity.toUpperCase()} Regla: ${alert.rule} Detalle: ${alert.detail} Actor: ${auditEntry.actor_id} (${auditEntry.actor_type}) IP: ${auditEntry.ip_address} Timestamp: ${auditEntry.timestamp} Accion requerida inmediata si severidad CRITICAL. `; // Enviar a canal de seguridad (Telegram/Slack/PagerDuty) await fetch(this.TELEGRAM_WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: message }) }); } async temporarilyBlockAccess(actorId) { await this.redis.setex(`blocked:${actorId}`, 600, 'true'); // 10 min // En produccion: revocar sesiones activas, notificar, escalar } // Helpers con Redis async getRecentAccessCount(actorId, windowSeconds) { const key = `access_count:${actorId}`; const multi = this.redis.multi(); multi.lpush(key, Date.now()); multi.ltrim(key, 0, 999); multi.expire(key, windowSeconds); const results = await multi.exec(); const all = await this.redis.lrange(key, 0, -1); const cutoff = Date.now() - windowSeconds * 1000; return all.filter(t => parseInt(t) > cutoff).length; } async getUniquePatientsCount(actorId, windowSeconds) { const key = `unique_patients:${actorId}:${Math.floor(Date.now() / (windowSeconds * 1000))}`; return await this.redis.scard(key); } async getFailedLoginCount(actorId, windowSeconds) { const key = `failed_logins:${actorId}`; const count = await this.redis.get(key); return parseInt(count || '0'); } }

### 5.4 DLP clinico: NLP local para enmascarar datos de salud

Cuando un paciente escribe una opinion publica (reseña del psicologo),

el sistema detecta automaticamente datos de salud y los enmascara

antes de publicar.

```
# backend/src/dlp/clinical_dlp.py
import re
import spacy
from typing import List, Tuple, Optional

class ClinicalDLP:
 """
 Data Loss Prevention for clinical data.
 Runs locally (no API calls) on the same server.
 Uses spaCy es_core_news_sm for Spanish NER.
 """

 def __init__(self):
 self.nlp = spacy.load("es_core_news_sm")

 # Patrones de datos de salud
 self.health_patterns = [
 # Diagnosticos comunes
 r'\b(?:depresi[oó]n|ansiedad|tdah|toc|bipolar|esquizofrenia|'
 r'trastorno\s+(?:l[ií]mite|alimenticio|obsesivo|bipolar|'
 r'de\s+(?:ansiedad|personalidad|p[aá]nico|estr[eé]s)))\b',

 # Medicamentos
 r'\b(?:sertralina|fluoxetina|escitalopram|paroxetina|'
 r'clonazepam|diazepam|lorazepam|alprazolam|'
 r'olanzapina|risperidona|quetiapina|aripiprazol|'
 r'methylphenidate|atomoxetina)\b',

 # Sintomas y crisis
 r'\b(?:intento\s+de\s+suicidio|autolesiones?|'
 r'ataque\s+de\s+p[aá]nico|ideaci[oó]n\s+suicida|'
 r'crisis\s+ansiosa|episodio\s+(?:man[ií]aco|depresivo))\b',

 # Pronosticos y evaluaciones
 r'\b(?:phq-9|gad-7|baremo|diagn[oó]stico|pron[oó]stico)\b',
 ]

 # Compilar patrones
 self.compiled_patterns = [
 re.compile(p, re.IGNORECASE) for p in self.health_patterns
 ]

 # Tags de reemplazo
 self.mask_tags = {
 'diagnosis': '[DIAGNOSTICO]',
 'medication': '[MEDICACION]',
 'symptom': '[SINTOMA]',
 'assessment': '[EVALUACION]',
 'clinical_data': '[DATOS_CLINICOS]',
 }

 def mask_health_data(self, text: str, user_id: Optional[str] = None) -> Tuple[str, List[dict]]:
 """
 Mask health-related data in public-facing text.
 Returns (masked_text, list_of_masked_entities).

 Ejemplo:
 Input: "Mi psicologa me ayudo mucho con mi depresion y ansiedad.
 Antes tomaba sertralina pero ahora estoy mucho mejor."
 Output: "Mi psicologa me ayudo mucho con mi [DIAGNOSTICO] y [DIAGNOSTICO].
 Antes tomaba [MEDICACION] pero ahora estoy mucho mejor."
 """
 masked_entities = []

 # 1. NER con spaCy para nombres propios
 doc = self.nlp(text)
 for ent in doc.ents:
 if ent.label_ in ('PER', 'MISC'): # Personas, nombres propios
 masked_entities.append({
 'text': ent.text,
 'label': 'PERSONAL_IDENTIFIER',
 'start': ent.start_char,
 'end': ent.end_char,
 'mask': '[IDENTIFICADOR]'
 })

 # 2. Patrones de salud
 for pattern in self.compiled_patterns:
 for match in pattern.finditer(text):
 # Determinar tipo basado en el patron
 matched_text = match.group()
 mask_type = self._classify_match(matched_text)

 masked_entities.append({
 'text': matched_text,
 'label': mask_type,
 'start': match.start(),
 'end': match.end(),
 'mask': self.mask_tags.get(mask_type, '[DATOS_CLINICOS]')
 })

 # 3. Aplicar mascaras (de atras a adelante para no romper indices)
 # Ordenar por posicion (reversa para no afectar offsets)
 masked_entities.sort(key=lambda x: x['start'], reverse=True)
 masked_text = text
 for entity in masked_entities:
 masked_text = (
 masked_text[:entity['start']]
 + entity['mask']
 + masked_text[entity['end']:]
 )

 # 4. Log de deteccion (para auditoria DLP)
 self._log_dlp_action(user_id, masked_entities)

 return masked_text, masked_entities

 def _classify_match(self, text: str) -> str:
 """Classify what type of clinical data was detected."""
 text_lower = text.lower()

 medication_keywords = ['sertralina', 'fluoxetina', 'clonazepam', 'diazepam',
 'olanzapina', 'risperidona', 'methylphenidate']
 diagnosis_keywords = ['depresi', 'ansiedad', 'tdah', 'toc', 'bipolar',
 'trastorno', 'esquizofrenia']
 symptom_keywords = ['suicidio', 'autolesion', 'panico', 'crisis',
 'episodio']
 assessment_keywords = ['phq-9', 'gad-7', 'baremo', 'diagnostico', 'pronostico']

 for kw in medication_keywords:
 if kw in text_lower:
 return 'medication'
 for kw in diagnosis_keywords:
 if kw in text_lower:
 return 'diagnosis'
 for kw in symptom_keywords:
 if kw in text_lower:
 return 'symptom'
 for kw in assessment_keywords:
 if kw in text_lower:
 return 'assessment'
 return 'clinical_data'

 def _log_dlp_action(self, user_id, entities):
 """Log DLP actions for audit."""
 if entities:
 # Log anonimo (sin texto original) para auditoria DLP
 log_entry = {
 'user_id': user_id,
 'entities_detected': len(entities),
 'entity_types': list(set(e['label'] for e in entities)),
 'action': 'masked',
 'timestamp': __import__('datetime').datetime.now().isoformat()
 }
 # Enviar a audit log
 # (implementacion simplificada)
 print(f"[DLP] Masked {len(entities)} entities for user {user_id}")

# Uso en middleware de reseñas
dlp = ClinicalDLP()

def review_middleware(request):
 """Middleware que procesa reseñas antes de publicar."""
 review_text = request.json.get('text')
 user_id = request.user.id

 masked_text, entities = dlp.mask_health_data(review_text, user_id)

 if entities:
 # Si se enmascaro algo, notificar al usuario
 return {
 'masked_text': masked_text,
 'warning': 'Se han enmascarado datos de salud en tu reseña '
 'para cumplir con el RD 1907/1996 de Publicidad Sanitaria.',
 'entities_masked': len(entities)
 }

 return {'text': review_text, 'masked': False}
```

# backend/src/dlp/clinical_dlp.py import re import spacy from typing import List, Tuple, Optional class ClinicalDLP: """ Data Loss Prevention for clinical data. Runs locally (no API calls) on the same server. Uses spaCy es_core_news_sm for Spanish NER. """ def __init__(self): self.nlp = spacy.load("es_core_news_sm") # Patrones de datos de salud self.health_patterns = [ # Diagnosticos comunes r'\b(?:depresi[oó]n|ansiedad|tdah|toc|bipolar|esquizofrenia|' r'trastorno\s+(?:l[ií]mite|alimenticio|obsesivo|bipolar|' r'de\s+(?:ansiedad|personalidad|p[aá]nico|estr[eé]s)))\b', # Medicamentos r'\b(?:sertralina|fluoxetina|escitalopram|paroxetina|' r'clonazepam|diazepam|lorazepam|alprazolam|' r'olanzapina|risperidona|quetiapina|aripiprazol|' r'methylphenidate|atomoxetina)\b', # Sintomas y crisis r'\b(?:intento\s+de\s+suicidio|autolesiones?|' r'ataque\s+de\s+p[aá]nico|ideaci[oó]n\s+suicida|' r'crisis\s+ansiosa|episodio\s+(?:man[ií]aco|depresivo))\b', # Pronosticos y evaluaciones r'\b(?:phq-9|gad-7|baremo|diagn[oó]stico|pron[oó]stico)\b', ] # Compilar patrones self.compiled_patterns = [ re.compile(p, re.IGNORECASE) for p in self.health_patterns ] # Tags de reemplazo self.mask_tags = { 'diagnosis': '[DIAGNOSTICO]', 'medication': '[MEDICACION]', 'symptom': '[SINTOMA]', 'assessment': '[EVALUACION]', 'clinical_data': '[DATOS_CLINICOS]', } def mask_health_data(self, text: str, user_id: Optional[str] = None) -> Tuple[str, List[dict]]: """ Mask health-related data in public-facing text. Returns (masked_text, list_of_masked_entities). Ejemplo: Input: "Mi psicologa me ayudo mucho con mi depresion y ansiedad. Antes tomaba sertralina pero ahora estoy mucho mejor." Output: "Mi psicologa me ayudo mucho con mi [DIAGNOSTICO] y [DIAGNOSTICO]. Antes tomaba [MEDICACION] pero ahora estoy mucho mejor." """ masked_entities = [] # 1. NER con spaCy para nombres propios doc = self.nlp(text) for ent in doc.ents: if ent.label_ in ('PER', 'MISC'): # Personas, nombres propios masked_entities.append({ 'text': ent.text, 'label': 'PERSONAL_IDENTIFIER', 'start': ent.start_char, 'end': ent.end_char, 'mask': '[IDENTIFICADOR]' }) # 2. Patrones de salud for pattern in self.compiled_patterns: for match in pattern.finditer(text): # Determinar tipo basado en el patron matched_text = match.group() mask_type = self._classify_match(matched_text) masked_entities.append({ 'text': matched_text, 'label': mask_type, 'start': match.start(), 'end': match.end(), 'mask': self.mask_tags.get(mask_type, '[DATOS_CLINICOS]') }) # 3. Aplicar mascaras (de atras a adelante para no romper indices) # Ordenar por posicion (reversa para no afectar offsets) masked_entities.sort(key=lambda x: x['start'], reverse=True) masked_text = text for entity in masked_entities: masked_text = ( masked_text[:entity['start']] + entity['mask'] + masked_text[entity['end']:] ) # 4. Log de deteccion (para auditoria DLP) self._log_dlp_action(user_id, masked_entities) return masked_text, masked_entities def _classify_match(self, text: str) -> str: """Classify what type of clinical data was detected.""" text_lower = text.lower() medication_keywords = ['sertralina', 'fluoxetina', 'clonazepam', 'diazepam', 'olanzapina', 'risperidona', 'methylphenidate'] diagnosis_keywords = ['depresi', 'ansiedad', 'tdah', 'toc', 'bipolar', 'trastorno', 'esquizofrenia'] symptom_keywords = ['suicidio', 'autolesion', 'panico', 'crisis', 'episodio'] assessment_keywords = ['phq-9', 'gad-7', 'baremo', 'diagnostico', 'pronostico'] for kw in medication_keywords: if kw in text_lower: return 'medication' for kw in diagnosis_keywords: if kw in text_lower: return 'diagnosis' for kw in symptom_keywords: if kw in text_lower: return 'symptom' for kw in assessment_keywords: if kw in text_lower: return 'assessment' return 'clinical_data' def _log_dlp_action(self, user_id, entities): """Log DLP actions for audit.""" if entities: # Log anonimo (sin texto original) para auditoria DLP log_entry = { 'user_id': user_id, 'entities_detected': len(entities), 'entity_types': list(set(e['label'] for e in entities)), 'action': 'masked', 'timestamp': __import__('datetime').datetime.now().isoformat() } # Enviar a audit log # (implementacion simplificada) print(f"[DLP] Masked {len(entities)} entities for user {user_id}") # Uso en middleware de reseñas dlp = ClinicalDLP() def review_middleware(request): """Middleware que procesa reseñas antes de publicar.""" review_text = request.json.get('text') user_id = request.user.id masked_text, entities = dlp.mask_health_data(review_text, user_id) if entities: # Si se enmascaro algo, notificar al usuario return { 'masked_text': masked_text, 'warning': 'Se han enmascarado datos de salud en tu reseña ' 'para cumplir con el RD 1907/1996 de Publicidad Sanitaria.', 'entities_masked': len(entities) } return {'text': review_text, 'masked': False}

## 6. CHECKLIST GDPR COMPLETA

### Checklist actionable para implementacion

```
======================================================================
CHECKLIST DE CUMPLIMIENTO GDPR - ANCORA (ancora.clinic)
======================================================================
Proyecto: Telepsicologia Zero-Knowledge con IA local
Responsable: [DPO asignado]
Fecha ultima revision: [dd/mm/aaaa]
======================================================================

[ ] = PENDIENTE
[+] = EN PROGRESO
[X] = COMPLETADO
[N] = NO APLICA

----------------------------------------------------------------------
1. CONSENTIMIENTO EXPLICITO SEPARADO (Art. 7, 9 RGPD)
----------------------------------------------------------------------

[X] 1.1 Consentimiento para TRATAMIENTO de datos de salud
 - Checkbox separado, NO premarcado
 - Texto claro: "Consiento el tratamiento de mis datos de salud
 para la prestacion de servicios de telepsicologia"
 - No agrupado con terminos y condiciones generales

[X] 1.2 Consentimiento para PROCESAMIENTO POR IA
 - "Autorizo el procesamiento automatizado de mis datos clinicos
 por el sistema de IA local para generar resumenes y alertas
 para mi psicologo"

[X] 1.3 Consentimiento para TRANSFERENCIA
 - "Consiento la transferencia de mi historia clinica a otro
 psicologo dentro de la plataforma si asi lo solicito"

[+] 1.4 Consentimiento para DATOS DE MENORES
 - Consentimiento del tutor legal
 - Verificacion de edad del tutor
 - Almacenamiento separado

[X] 1.5 Registro inmutable de cada consentimiento
 - Tabla consent_records (solo INSERT, nunca UPDATE/DELETE)
 - Hash SHA256 de los terminos aceptados

[X] 1.6 Mecanismo de REVOCACION
 - El paciente puede revocar en cualquier momento desde su panel
 - La revocacion no afecta tratamientos previos
 - Proceso claro de baja y destruccion de datos

----------------------------------------------------------------------
2. DPIA / EIPD (EVALUACION DE IMPACTO, Art. 35)
----------------------------------------------------------------------

[X] 2.1 Documento DPIA completo elaborado
 - Descripcion sistematica del tratamiento
 - Evaluacion de necesidad y proporcionalidad
 - Gestion de riesgos para derechos y libertades

[X] 2.2 Consulta previa a AEPD si DPIA identifica alto riesgo
 - Riesgo residual evaluado (ver seccion 3)

[X] 2.3 Medidas previstas para mitigar riesgos
 - Cifrado Zero-Knowledge
 - Datos solo en RAM (mlock)
 - Crypto-shredding
 - Minimizacion de datos
 - Pseudonimizacion en analytics

[+] 2.4 Revision anual del DPIA
 - Programada para [fecha]
 - O antes si hay cambios significativos en el tratamiento

----------------------------------------------------------------------
3. DPO (DELEGADO DE PROTECCION DE DATOS, Art. 37-39)
----------------------------------------------------------------------

[X] 3.1 DPO designado y notificado a AEPD
 - Nombre: [Nombre del DPO]
 - Contacto: dpo@ancora.clinic
 - Publicado en web y app

[X] 3.2 DPO con cualificacion profesional
 - Conocimiento especializado en proteccion de datos
 - Experiencia en datos de salud

[X] 3.3 DPO involucrado en todas las cuestiones de PDP
 - Consultado en diseno de nuevos tratamientos
 - Acceso directo a direccion

[X] 3.4 Canal de comunicacion directo con DPO
 - Email, formulario web, telefono
 - Tiempo de respuesta < 48h

----------------------------------------------------------------------
4. MINIMIZACION DE DATOS (Art. 5.1.c)
----------------------------------------------------------------------

[X] 4.1 Solo datos ESTRICTAMENTE NECESARIOS
 - Nombre, email, fecha nacimiento (no DNI)
 - Datos clinicos minimos para el tratamiento psicologico
 - No se recogen datos de tarjeta de credito (Stripe)

[X] 4.2 No se recogen datos EXCESIVOS
 - No orientacion sexual (si no relevante)
 - No ideologia, religion, raza (si no relevante)
 - No datos geneticos ni biometricos

[X] 4.3 Datos solo visibles para quien los necesita
 - Psicologo: solo datos de sus pacientes
 - Paciente: solo sus propios datos
 - Administrador: sin acceso a contenido clinico

[X] 4.4 Politica de retencion definida
 - Datos clinicos: destruidos inmediatamente tras baja
 - Metadatos minimos: 5 anos (Ley 41/2002)
 - Destruccion total: 5 anos post-baja

----------------------------------------------------------------------
5. TRAZABILIDAD (Art. 5.2, Art. 30)
----------------------------------------------------------------------

[X] 5.1 Registro de actividades de tratamiento
 - Documento actualizado con todas las categorias
 - Finalidad, categorias, destinatarios, plazos

[X] 5.2 Log de accesos con hash chain
 - SHA256 encadenado (ver seccion 5.1)
 - Inmutable: cualquier alteracion rompe la cadena
 - Verificacion periodica de integridad

[X] 5.3 Registro de consentimientos
 - Version de terminos aceptados almacenada
 - Fecha y hora exacta
 - IP y user-agent

[X] 5.4 Registro de exportaciones
 - Quien, cuando, que se exporto
 - Hash de integridad del archivo exportado

[X] 5.5 Sistema de alertas de accesos sospechosos
 - Deteccion de patrones anomalos
 - Bloqueo automatico de cuentas comprometidas
 - Notificacion al DPO en < 5 min

----------------------------------------------------------------------
6. CIFRADO FUERTE (Art. 32, Art. 25 - Privacy by Design)
----------------------------------------------------------------------

[X] 6.1 Cifrado en reposo (AES-256-GCM)
 - Columnas BYTEA en PostgreSQL
 - Clave por paciente (KEK derivada de Argon2id)

[X] 6.2 Cifrado en transito (TLS 1.3)
 - HTTPS obligatorio en todos los endpoints
 - HSTS preload
 - Certificados con validez < 90 dias

[X] 6.3 Cifrado extremo a extremo (E2EE)
 - Chats: WebCrypto API en navegador
 - Claves RSA-OAEP de 4096 bits
 - Claves efimeras por mensaje

[X] 6.4 Zero-Knowledge Architecture
 - Servidor NO tiene acceso a claves de descifrado
 - KEK derivada en cliente con Argon2id
 - Crypto-shredding: destruir KEK = destruir datos

[X] 6.5 mlock/mlockall contra swap
 - Memoria lockeada en RAM fisica
 - VmSwap = 0 kB verificado

[X] 6.6 Memory zeroing explicito
 - Buffers sobrescritos con 0xFF y 0x00
 - GC forzado despues de limpieza

----------------------------------------------------------------------
7. POLITICA DE CONSERVACION (Art. 5.1.e)
----------------------------------------------------------------------

[X] 7.1 Plazos de conservacion documentados
 - Datos activos: mientras dure la relacion terapeutica
 - Datos post-baja: crypto-shredding inmediato
 - Metadatos minimos: 5 anos desde baja
 - Destruccion total: 5 anos desde baja

[X] 7.2 Procedimiento de destruccion segura
 - Crypto-shredding via HSM key destruction
 - Verificacion posterior de ilegibilidad
 - Certificado de destruccion emitido

[X] 7.3 Revision periodica de datos almacenados
 - Script mensual (process_retention_policy)
 - Identificar y destruir datos fuera de plazo

[X] 7.4 Datos en backups
 - Backups cifrados, claves separadas
 - Si se destruye KEK, backups son ilegibles
 - WORM policy evita alteracion de backups

----------------------------------------------------------------------
8. PORTABILIDAD (Art. 20)
----------------------------------------------------------------------

[X] 8.1 Derecho a recibir datos en formato estructurado
 - JSON (.ancora): formato completo y portable
 - PDF: resumen ejecutivo legible
 - Markdown: para re-importacion

[X] 8.2 Derecho a transmitir a otro responsable
 - Transferencia directa entre psicologos Ancora
 - Exportacion para llevar a otra plataforma

[X] 8.3 Sin coste para el paciente
 - Primera exportacion siempre gratuita
 - Exportaciones recurrentes sin coste adicional

[X] 8.4 Plazo maximo de 1 mes
 - Exportacion generada en < 1 hora tipicamente
 - Notificacion si plazo mayor (max 3 meses con justificacion)

[X] 8.5 Verificacion de identidad
 - Autenticacion reforzada (password + 2FA)
 - Log de todas las exportaciones

----------------------------------------------------------------------
9. BORRADO / ANONIMIZACION (Art. 17 - Derecho al Olvido)
----------------------------------------------------------------------

[X] 9.1 Procedimiento de borrado completo
 - Crypto-shredding como metodo principal
 - Sobrescritura de KEK en HSM
 - Verificacion post-borrado

[X] 9.2 Procedimiento de anonimizacion (opcional)
 - Pseudonimizacion irreversible
 - Datos solo para investigacion agregada
 - Sin posibilidad de re-identificacion

[X] 9.3 Comunicacion a terceros
 - Notificacion al psicologo de la baja
 - Verificacion de que ya no accede

[X] 9.4 Excepciones documentadas
 - Datos necesarios para defensa legal
 - Metadatos obligatorios por Ley 41/2002
 - Interes publico en investigacion (anonimizados)

----------------------------------------------------------------------
10. NOTIFICACION DE BRECHAS (Art. 33, 34)
----------------------------------------------------------------------

[ ] 10.1 Procedimiento de deteccion de brechas
 - Sistema de monitorizacion continua
 - Alertas automaticas de accesos anomales
 - Revision manual diaria de alertas

[ ] 10.2 Plantilla de notificacion a AEPD (< 72h)
 - Nature of the breach
 - Categories of data involved
 - Approximate number of affected individuals
 - Contact of DPO
 - Measures taken or proposed

[ ] 10.3 Plantilla de comunicacion a afectados
 - Si alto riesgo para derechos y libertades
 - Medidas de mitigacion recomendadas

[ ] 10.4 Registro de brechas (interno)
 - Fecha de descubrimiento
 - Fecha de notificacion
 - Medidas correctivas
 - Lecciones aprendidas

[ ] 10.5 Simulacros de brecha de seguridad
 - Al menos 1 simulacro anual
 - Evaluacion de tiempos de respuesta
 - Mejora continua de procedimientos

----------------------------------------------------------------------
PUNTUACION DE CUMPLIMIENTO: XX/YY (Z%)
Observaciones:
 1. [a completar]
 2. [a completar]
 3. [a completar]

Firma del DPO: ______________________ Fecha: ______________
======================================================================
```

====================================================================== CHECKLIST DE CUMPLIMIENTO GDPR - ANCORA (ancora.clinic) ====================================================================== Proyecto: Telepsicologia Zero-Knowledge con IA local Responsable: [DPO asignado] Fecha ultima revision: [dd/mm/aaaa] ====================================================================== [ ] = PENDIENTE [+] = EN PROGRESO [X] = COMPLETADO [N] = NO APLICA ---------------------------------------------------------------------- 1. CONSENTIMIENTO EXPLICITO SEPARADO (Art. 7, 9 RGPD) ---------------------------------------------------------------------- [X] 1.1 Consentimiento para TRATAMIENTO de datos de salud - Checkbox separado, NO premarcado - Texto claro: "Consiento el tratamiento de mis datos de salud para la prestacion de servicios de telepsicologia" - No agrupado con terminos y condiciones generales [X] 1.2 Consentimiento para PROCESAMIENTO POR IA - "Autorizo el procesamiento automatizado de mis datos clinicos por el sistema de IA local para generar resumenes y alertas para mi psicologo" [X] 1.3 Consentimiento para TRANSFERENCIA - "Consiento la transferencia de mi historia clinica a otro psicologo dentro de la plataforma si asi lo solicito" [+] 1.4 Consentimiento para DATOS DE MENORES - Consentimiento del tutor legal - Verificacion de edad del tutor - Almacenamiento separado [X] 1.5 Registro inmutable de cada consentimiento - Tabla consent_records (solo INSERT, nunca UPDATE/DELETE) - Hash SHA256 de los terminos aceptados [X] 1.6 Mecanismo de REVOCACION - El paciente puede revocar en cualquier momento desde su panel - La revocacion no afecta tratamientos previos - Proceso claro de baja y destruccion de datos ---------------------------------------------------------------------- 2. DPIA / EIPD (EVALUACION DE IMPACTO, Art. 35) ---------------------------------------------------------------------- [X] 2.1 Documento DPIA completo elaborado - Descripcion sistematica del tratamiento - Evaluacion de necesidad y proporcionalidad - Gestion de riesgos para derechos y libertades [X] 2.2 Consulta previa a AEPD si DPIA identifica alto riesgo - Riesgo residual evaluado (ver seccion 3) [X] 2.3 Medidas previstas para mitigar riesgos - Cifrado Zero-Knowledge - Datos solo en RAM (mlock) - Crypto-shredding - Minimizacion de datos - Pseudonimizacion en analytics [+] 2.4 Revision anual del DPIA - Programada para [fecha] - O antes si hay cambios significativos en el tratamiento ---------------------------------------------------------------------- 3. DPO (DELEGADO DE PROTECCION DE DATOS, Art. 37-39) ---------------------------------------------------------------------- [X] 3.1 DPO designado y notificado a AEPD - Nombre: [Nombre del DPO] - Contacto: dpo@ancora.clinic - Publicado en web y app [X] 3.2 DPO con cualificacion profesional - Conocimiento especializado en proteccion de datos - Experiencia en datos de salud [X] 3.3 DPO involucrado en todas las cuestiones de PDP - Consultado en diseno de nuevos tratamientos - Acceso directo a direccion [X] 3.4 Canal de comunicacion directo con DPO - Email, formulario web, telefono - Tiempo de respuesta < 48h ---------------------------------------------------------------------- 4. MINIMIZACION DE DATOS (Art. 5.1.c) ---------------------------------------------------------------------- [X] 4.1 Solo datos ESTRICTAMENTE NECESARIOS - Nombre, email, fecha nacimiento (no DNI) - Datos clinicos minimos para el tratamiento psicologico - No se recogen datos de tarjeta de credito (Stripe) [X] 4.2 No se recogen datos EXCESIVOS - No orientacion sexual (si no relevante) - No ideologia, religion, raza (si no relevante) - No datos geneticos ni biometricos [X] 4.3 Datos solo visibles para quien los necesita - Psicologo: solo datos de sus pacientes - Paciente: solo sus propios datos - Administrador: sin acceso a contenido clinico [X] 4.4 Politica de retencion definida - Datos clinicos: destruidos inmediatamente tras baja - Metadatos minimos: 5 anos (Ley 41/2002) - Destruccion total: 5 anos post-baja ---------------------------------------------------------------------- 5. TRAZABILIDAD (Art. 5.2, Art. 30) ---------------------------------------------------------------------- [X] 5.1 Registro de actividades de tratamiento - Documento actualizado con todas las categorias - Finalidad, categorias, destinatarios, plazos [X] 5.2 Log de accesos con hash chain - SHA256 encadenado (ver seccion 5.1) - Inmutable: cualquier alteracion rompe la cadena - Verificacion periodica de integridad [X] 5.3 Registro de consentimientos - Version de terminos aceptados almacenada - Fecha y hora exacta - IP y user-agent [X] 5.4 Registro de exportaciones - Quien, cuando, que se exporto - Hash de integridad del archivo exportado [X] 5.5 Sistema de alertas de accesos sospechosos - Deteccion de patrones anomalos - Bloqueo automatico de cuentas comprometidas - Notificacion al DPO en < 5 min ---------------------------------------------------------------------- 6. CIFRADO FUERTE (Art. 32, Art. 25 - Privacy by Design) ---------------------------------------------------------------------- [X] 6.1 Cifrado en reposo (AES-256-GCM) - Columnas BYTEA en PostgreSQL - Clave por paciente (KEK derivada de Argon2id) [X] 6.2 Cifrado en transito (TLS 1.3) - HTTPS obligatorio en todos los endpoints - HSTS preload - Certificados con validez < 90 dias [X] 6.3 Cifrado extremo a extremo (E2EE) - Chats: WebCrypto API en navegador - Claves RSA-OAEP de 4096 bits - Claves efimeras por mensaje [X] 6.4 Zero-Knowledge Architecture - Servidor NO tiene acceso a claves de descifrado - KEK derivada en cliente con Argon2id - Crypto-shredding: destruir KEK = destruir datos [X] 6.5 mlock/mlockall contra swap - Memoria lockeada en RAM fisica - VmSwap = 0 kB verificado [X] 6.6 Memory zeroing explicito - Buffers sobrescritos con 0xFF y 0x00 - GC forzado despues de limpieza ---------------------------------------------------------------------- 7. POLITICA DE CONSERVACION (Art. 5.1.e) ---------------------------------------------------------------------- [X] 7.1 Plazos de conservacion documentados - Datos activos: mientras dure la relacion terapeutica - Datos post-baja: crypto-shredding inmediato - Metadatos minimos: 5 anos desde baja - Destruccion total: 5 anos desde baja [X] 7.2 Procedimiento de destruccion segura - Crypto-shredding via HSM key destruction - Verificacion posterior de ilegibilidad - Certificado de destruccion emitido [X] 7.3 Revision periodica de datos almacenados - Script mensual (process_retention_policy) - Identificar y destruir datos fuera de plazo [X] 7.4 Datos en backups - Backups cifrados, claves separadas - Si se destruye KEK, backups son ilegibles - WORM policy evita alteracion de backups ---------------------------------------------------------------------- 8. PORTABILIDAD (Art. 20) ---------------------------------------------------------------------- [X] 8.1 Derecho a recibir datos en formato estructurado - JSON (.ancora): formato completo y portable - PDF: resumen ejecutivo legible - Markdown: para re-importacion [X] 8.2 Derecho a transmitir a otro responsable - Transferencia directa entre psicologos Ancora - Exportacion para llevar a otra plataforma [X] 8.3 Sin coste para el paciente - Primera exportacion siempre gratuita - Exportaciones recurrentes sin coste adicional [X] 8.4 Plazo maximo de 1 mes - Exportacion generada en < 1 hora tipicamente - Notificacion si plazo mayor (max 3 meses con justificacion) [X] 8.5 Verificacion de identidad - Autenticacion reforzada (password + 2FA) - Log de todas las exportaciones ---------------------------------------------------------------------- 9. BORRADO / ANONIMIZACION (Art. 17 - Derecho al Olvido) ---------------------------------------------------------------------- [X] 9.1 Procedimiento de borrado completo - Crypto-shredding como metodo principal - Sobrescritura de KEK en HSM - Verificacion post-borrado [X] 9.2 Procedimiento de anonimizacion (opcional) - Pseudonimizacion irreversible - Datos solo para investigacion agregada - Sin posibilidad de re-identificacion [X] 9.3 Comunicacion a terceros - Notificacion al psicologo de la baja - Verificacion de que ya no accede [X] 9.4 Excepciones documentadas - Datos necesarios para defensa legal - Metadatos obligatorios por Ley 41/2002 - Interes publico en investigacion (anonimizados) ---------------------------------------------------------------------- 10. NOTIFICACION DE BRECHAS (Art. 33, 34) ---------------------------------------------------------------------- [ ] 10.1 Procedimiento de deteccion de brechas - Sistema de monitorizacion continua - Alertas automaticas de accesos anomales - Revision manual diaria de alertas [ ] 10.2 Plantilla de notificacion a AEPD (< 72h) - Nature of the breach - Categories of data involved - Approximate number of affected individuals - Contact of DPO - Measures taken or proposed [ ] 10.3 Plantilla de comunicacion a afectados - Si alto riesgo para derechos y libertades - Medidas de mitigacion recomendadas [ ] 10.4 Registro de brechas (interno) - Fecha de descubrimiento - Fecha de notificacion - Medidas correctivas - Lecciones aprendidas [ ] 10.5 Simulacros de brecha de seguridad - Al menos 1 simulacro anual - Evaluacion de tiempos de respuesta - Mejora continua de procedimientos ---------------------------------------------------------------------- PUNTUACION DE CUMPLIMIENTO: XX/YY (Z%) Observaciones: 1. [a completar] 2. [a completar] 3. [a completar] Firma del DPO: ______________________ Fecha: ______________ ======================================================================

## 7. ANEXOS

### A. Diagrama de arquitectura completo

```
+====================================================================+
| ANCORA - ARQUITECTURA DE DATOS |
+====================================================================+
| |
| [NAVEGADOR DEL PACIENTE] [NAVEGADOR DEL PSICOLOGO] |
| +----------------------+ +----------------------+ |
| | WebCrypto API | | WebCrypto API | |
| | - Argon2id derivacion| | - RSA keypair | |
| | - AES-GCM encrypt | | - AES-GCM decrypt | |
| | - RSA-OAEP wrap key | | - RSA-OAEP unwrap | |
| | - sessionStorage KEK | | - sessionStorage KEK | |
| | - IndexedDB local | | - IndexedDB local | |
| +----------+-----------+ +----------+-----------+ |
| | | |
| | TLS 1.3 | TLS 1.3 |
| v v |
| +================================================================+|
| | API GATEWAY / LOAD BALANCER ||
| | (Nginx, TLS termination) ||
| +================================================================+|
| | | |
| +----------+--------------------+ |
| | |
| v |
| +================================================================+|
| | BACKEND (Node.js / FastAPI) ||
| | ||
| | +------------------+ +----------------+ +------------+ ||
| | | Auth Service | | Clinical Svc | | Export Svc | ||
| | | - JWT + 2FA | | - SOAP notes | | - JSON | ||
| | | - API Keys | | - Objectives | | - PDF | ||
| | | - Invitations | | - Exercises | | - Markdown | ||
| | +------------------+ +----------------+ +------------+ ||
| | ||
| | +------------------+ +----------------+ +------------+ ||
| | | Crypto Service | | Audit Service | | DLP Svc | ||
| | | - KEK management | | - Hash chain | | - NLP mask | ||
| | | - HSM client | | - Anomaly det | | - spacy NER| ||
| | +------------------+ +----------------+ +------------+ ||
| +================================================================+|
| | | | |
| v v v |
| +------------------+ +----------+ +---------------------+ |
| | PostgreSQL (BYTEA)| | Redis | | GPU Server (vLLM) | |
| | AES-256-GCM | | - Queues | | - DeepSeek-R1-70B | |
| | Hash chain audit | | - Rate | | - GLM-4-9B | |
| | KEK store (HSM) | | - Cache | | - Memory zeroing | |
| | Encrypted backups | | - Session| | - mlockall | |
| +------------------+ +----------+ +---------------------+ |
| | | |
| v v |
| +------------------+ +---------------------+ |
| | S3 Glacier WORM | | HSM (FIPS 140-2 L3) | |
| | - Backups cifrados| | - KEK storage | |
| | - Object Lock | | - Key destruction | |
| | - Inmutables | | - Crypto-shredding | |
| +------------------+ +---------------------+ |
| |
+====================================================================+
```

+====================================================================+ | ANCORA - ARQUITECTURA DE DATOS | +====================================================================+ | | | [NAVEGADOR DEL PACIENTE] [NAVEGADOR DEL PSICOLOGO] | | +----------------------+ +----------------------+ | | | WebCrypto API | | WebCrypto API | | | | - Argon2id derivacion| | - RSA keypair | | | | - AES-GCM encrypt | | - AES-GCM decrypt | | | | - RSA-OAEP wrap key | | - RSA-OAEP unwrap | | | | - sessionStorage KEK | | - sessionStorage KEK | | | | - IndexedDB local | | - IndexedDB local | | | +----------+-----------+ +----------+-----------+ | | | | | | | TLS 1.3 | TLS 1.3 | | v v | | +================================================================+| | | API GATEWAY / LOAD BALANCER || | | (Nginx, TLS termination) || | +================================================================+| | | | | | +----------+--------------------+ | | | | | v | | +================================================================+| | | BACKEND (Node.js / FastAPI) || | | || | | +------------------+ +----------------+ +------------+ || | | | Auth Service | | Clinical Svc | | Export Svc | || | | | - JWT + 2FA | | - SOAP notes | | - JSON | || | | | - API Keys | | - Objectives | | - PDF | || | | | - Invitations | | - Exercises | | - Markdown | || | | +------------------+ +----------------+ +------------+ || | | || | | +------------------+ +----------------+ +------------+ || | | | Crypto Service | | Audit Service | | DLP Svc | || | | | - KEK management | | - Hash chain | | - NLP mask | || | | | - HSM client | | - Anomaly det | | - spacy NER| || | | +------------------+ +----------------+ +------------+ || | +================================================================+| | | | | | | v v v | | +------------------+ +----------+ +---------------------+ | | | PostgreSQL (BYTEA)| | Redis | | GPU Server (vLLM) | | | | AES-256-GCM | | - Queues | | - DeepSeek-R1-70B | | | | Hash chain audit | | - Rate | | - GLM-4-9B | | | | KEK store (HSM) | | - Cache | | - Memory zeroing | | | | Encrypted backups | | - Session| | - mlockall | | | +------------------+ +----------+ +---------------------+ | | | | | | v v | | +------------------+ +---------------------+ | | | S3 Glacier WORM | | HSM (FIPS 140-2 L3) | | | | - Backups cifrados| | - KEK storage | | | | - Object Lock | | - Key destruction | | | | - Inmutables | | - Crypto-shredding | | | +------------------+ +---------------------+ | | | +====================================================================+

### B. Flujo de datos completo (extremadamente simplificado)

```
DATOS EN MOVIMIENTO (en transito)
==================================
Paciente escribiendo en chat:
 1. Navegador: cifra mensaje con AES-GCM-256 (clave efimera)
 2. Clave AES cifrada con RSA-OAEP (clave publica del psicologo)
 3. TLS 1.3: cifra todo el payload para el servidor
 4. Servidor: almacena BYTEA en PostgreSQL
 5. NO PUEDE descifrar (no tiene la clave privada RSA del psicologo)
 -> Dato seguro incluso si servidor comprometido

DATOS EN REPOSO
==================================
 1. Contenido: AES-256-GCM cifrado (BYTEA)
 2. Clave del contenido: KEK del paciente (256-bit)
 3. KEK: almacenada en HSM, envuelta para servidor con server key
 4. En navegador del paciente: KEK derivada de password via Argon2id
 5. Backup: cifrado con backup key (almacenada en cofre HSM separado)
 -> Sin KEK, los BYTEA son ruido

DATOS EN PROCESAMIENTO (RAM)
==================================
 1. Servidor descifra KEK (solo temporalmente, en buffer seguro)
 2. Descifra contenido del paciente en RAM
 3. Construye prompt para LLM local (GPU)
 4. Genera respuesta en RAM
 5. Cifra respuesta con KEK del paciente
 6. Hace memory zeroing de KEK y texto plano
 7. VmSwap = 0 kB (mlock evita swap)
 -> Datos solo existen en RAM volatil, por microsegundos

DATOS EN BAJA
==================================
 1. Crypto-shredding: destruir KEK en HSM
 2. Todos los BYTEA del paciente se vuelven ilegibles
 3. Backups inmutables: contienen BYTEA sin KEK = ceniza
 4. Metadatos minimos: conservados 5 anos
 5. Destruccion total a los 5 anos: destruir tambien metadatos
 -> Datos irrecuperables, no es necesario borrar fisicamente
```

DATOS EN MOVIMIENTO (en transito) ================================== Paciente escribiendo en chat: 1. Navegador: cifra mensaje con AES-GCM-256 (clave efimera) 2. Clave AES cifrada con RSA-OAEP (clave publica del psicologo) 3. TLS 1.3: cifra todo el payload para el servidor 4. Servidor: almacena BYTEA en PostgreSQL 5. NO PUEDE descifrar (no tiene la clave privada RSA del psicologo) -> Dato seguro incluso si servidor comprometido DATOS EN REPOSO ================================== 1. Contenido: AES-256-GCM cifrado (BYTEA) 2. Clave del contenido: KEK del paciente (256-bit) 3. KEK: almacenada en HSM, envuelta para servidor con server key 4. En navegador del paciente: KEK derivada de password via Argon2id 5. Backup: cifrado con backup key (almacenada en cofre HSM separado) -> Sin KEK, los BYTEA son ruido DATOS EN PROCESAMIENTO (RAM) ================================== 1. Servidor descifra KEK (solo temporalmente, en buffer seguro) 2. Descifra contenido del paciente en RAM 3. Construye prompt para LLM local (GPU) 4. Genera respuesta en RAM 5. Cifra respuesta con KEK del paciente 6. Hace memory zeroing de KEK y texto plano 7. VmSwap = 0 kB (mlock evita swap) -> Datos solo existen en RAM volatil, por microsegundos DATOS EN BAJA ================================== 1. Crypto-shredding: destruir KEK en HSM 2. Todos los BYTEA del paciente se vuelven ilegibles 3. Backups inmutables: contienen BYTEA sin KEK = ceniza 4. Metadatos minimos: conservados 5 anos 5. Destruccion total a los 5 anos: destruir tambien metadatos -> Datos irrecuperables, no es necesario borrar fisicamente

### C. Codigos de respuesta para errores de seguridad

```
Codigos de error E2E (Extensiones de API):
 E2E_001 - Clave publica RSA del destinatario no encontrada
 E2E_002 - Clave privada RSA no disponible en sessionStorage
 E2E_003 - Fallo de descifrado AES-GCM (auth tag invalido)
 E2E_004 - KEK del paciente no encontrada en HSM
 E2E_005 - KEK destruida (crypto-shredding aplicado)
 E2E_006 - Clave de grupo no disponible (usuario no es miembro)
 E2E_007 - Clave de grupo rotada, solicitar nueva

Errores de auditoria:
 AUD_001 - Hash chain rota en registro N (posible manipulacion)
 AUD_002 - Intento de alteracion de registro de auditoria
 AUD_003 - Firma de consentimiento no coincide con terminos
 AUD_004 - Frecuencia de acceso anomala detectada

Errores de importacion:
 IMP_001 - Token de invitacion expirado
 IMP_002 - Token de invitacion ya utilizado
 IMP_003 - QR invalido (firma HMAC no coincide)
 IMP_004 - QR expirado (ventana temporal superada)
 IMP_005 - Archivo CSV invalido (cabeceras incorrectas)
 IMP_006 - Demasiados pacientes en un lote (>500)
 IMP_007 - API Key invalida o expirada
 IMP_008 - Firma HMAC de API request no coincide
 IMP_009 - Email del paciente ya registrado
```

Codigos de error E2E (Extensiones de API): E2E_001 - Clave publica RSA del destinatario no encontrada E2E_002 - Clave privada RSA no disponible en sessionStorage E2E_003 - Fallo de descifrado AES-GCM (auth tag invalido) E2E_004 - KEK del paciente no encontrada en HSM E2E_005 - KEK destruida (crypto-shredding aplicado) E2E_006 - Clave de grupo no disponible (usuario no es miembro) E2E_007 - Clave de grupo rotada, solicitar nueva Errores de auditoria: AUD_001 - Hash chain rota en registro N (posible manipulacion) AUD_002 - Intento de alteracion de registro de auditoria AUD_003 - Firma de consentimiento no coincide con terminos AUD_004 - Frecuencia de acceso anomala detectada Errores de importacion: IMP_001 - Token de invitacion expirado IMP_002 - Token de invitacion ya utilizado IMP_003 - QR invalido (firma HMAC no coincide) IMP_004 - QR expirado (ventana temporal superada) IMP_005 - Archivo CSV invalido (cabeceras incorrectas) IMP_006 - Demasiados pacientes en un lote (>500) IMP_007 - API Key invalida o expirada IMP_008 - Firma HMAC de API request no coincide IMP_009 - Email del paciente ya registrado

### D. Referencias legales

```
- REGLAMENTO (UE) 2016/679 (RGPD)
 Art. 5: Principios relativos al tratamiento
 Art. 7: Condiciones para el consentimiento
 Art. 9: Categorias especiales de datos personales
 Art. 12: Transparencia y modalidades
 Art. 15: Derecho de acceso del interesado
 Art. 17: Derecho a la supresion (derecho al olvido)
 Art. 20: Derecho a la portabilidad de los datos
 Art. 25: Proteccion de datos desde el diseno
 Art. 30: Registro de actividades de tratamiento
 Art. 32: Seguridad del tratamiento
 Art. 33: Notificacion de violaciones de seguridad
 Art. 35: Evaluacion de impacto

- LEY ORGANICA 3/2018 (LOPDGDD - Espana)
 Art. 9: Derecho a la portabilidad
 Art. 10: Derecho de supresion

- LEY 41/2002 (Ley de Autonomia del Paciente - Espana)
 Art. 14: Derecho a la historia clinica
 Art. 15: Contenido de la historia clinica
 Art. 16: Acceso a la historia clinica
 Art. 17: Conservacion de la documentacion clinica (5 anos)

- REAL DECRETO 1907/1996
 Publicidad y promocion comercial de productos sanitarios
 Prohibicion de testimonios de pacientes

- CODIGO DEONTOLOGICO DEL PSICOLOGO (Espana)
 Art. 50-51: Secreto profesional y publicidad
 Art. 55: Consentimiento informado

- LEY 34/2002 (LSSI-CE)
 Comunicaciones comerciales electronicas

- REGLAMENTO eIDAS (UE) 910/2014
 Firma electronica cualificada
 (aplica a firma de consentimientos digitales)
```

- REGLAMENTO (UE) 2016/679 (RGPD) Art. 5: Principios relativos al tratamiento Art. 7: Condiciones para el consentimiento Art. 9: Categorias especiales de datos personales Art. 12: Transparencia y modalidades Art. 15: Derecho de acceso del interesado Art. 17: Derecho a la supresion (derecho al olvido) Art. 20: Derecho a la portabilidad de los datos Art. 25: Proteccion de datos desde el diseno Art. 30: Registro de actividades de tratamiento Art. 32: Seguridad del tratamiento Art. 33: Notificacion de violaciones de seguridad Art. 35: Evaluacion de impacto - LEY ORGANICA 3/2018 (LOPDGDD - Espana) Art. 9: Derecho a la portabilidad Art. 10: Derecho de supresion - LEY 41/2002 (Ley de Autonomia del Paciente - Espana) Art. 14: Derecho a la historia clinica Art. 15: Contenido de la historia clinica Art. 16: Acceso a la historia clinica Art. 17: Conservacion de la documentacion clinica (5 anos) - REAL DECRETO 1907/1996 Publicidad y promocion comercial de productos sanitarios Prohibicion de testimonios de pacientes - CODIGO DEONTOLOGICO DEL PSICOLOGO (Espana) Art. 50-51: Secreto profesional y publicidad Art. 55: Consentimiento informado - LEY 34/2002 (LSSI-CE) Comunicaciones comerciales electronicas - REGLAMENTO eIDAS (UE) 910/2014 Firma electronica cualificada (aplica a firma de consentimientos digitales)

FIN DEL INFORME T4

Documento generado para el proyecto Ancora (ancora.clinic)

Clasificacion: CONFIDENCIAL - Secreto Profesional Sanitario

Version del informe: 1.0 | 31 Mayo 2026

## 8. Viabilidad Legal y RGPD en España

### Cumplimiento del RGPD para Categorías Especiales

Los datos de psicología son datos de salud y requieren el nivel máximo de cumplimiento (Art. 9 RGPD):

- Consentimiento Explícito: Debe ser recabado mediante una acción inequívoca (firma digital OTP o doble casilla de aceptación sin premarcar), separado de la aceptación de los términos y condiciones generales del servicio.

- EIPD (Evaluación de Impacto): Obligatoria antes de iniciar el tratamiento, documentando la gestión del riesgo clínico, anonimización DLP y exclusión de logs del LLM.

### Prohibición de Testimonios y Calificación por Estrellas

El **Real Decreto 1907/1996 de Publicidad Sanitaria** prohíbe de forma expresa el uso de testimonios de pacientes para la captación comercial y promoción de servicios con finalidad sanitaria.

#### Inviabilidad del Modelo Uber con Estrellas Clínicas Públicas

Un listado público de psicólogos donde se expongan valoraciones por estrellas de "curación" y testimonios clínicos vulnera la ley y el Código Deontológico (Art. 50/51). El marketplace debe enfocar la evaluación únicamente a factores de servicio (instalaciones, amabilidad, claridad de tarifa y puntualidad) a través de preguntas de respuesta cerrada. Además, la plataforma implementará un pipeline NLP local de enmascaramiento (DLP clínico) para evitar que el paciente introduzca datos de salud en el texto libre.

### Prevención de Sanciones AEPD en Respuestas

La AEPD sanciona de forma sistemática a profesionales sanitarios que responden a quejas o reseñas en Google/Doctoralia detallando la relación asistencial o defendiéndose con datos del historial clínico del paciente.

#### Estandarización de Respuestas sin Confirmación

Para evitar fallos humanos y blindar legalmente al psicólogo, el panel de administración de la plataforma deshabilitará el teclado para respuestas libres en reseñas de cara al público. En su lugar, se forzará la selección de plantillas pre-aprobadas legalmente que mantengan la neutralidad clínica y deriven la conversación al chat seguro interno.

### Encuadre Fiscal del IVA

La **Ley del IVA de España (Art. 20.Uno.3º)** exime de IVA a los servicios sanitarios de telepsicología prestados por profesionales habilitados (PGS/PIR) que realicen diagnóstico, prevención o tratamiento síncrono. Sin embargo, el soporte diario por chat asíncrono y los reportes e informes de progreso autogenerados por la IA **tributan obligatoriamente al 21% de IVA** al catalogarse fiscalmente como "servicios prestados por vía electrónica" sin intervención humana síncrona relevante.

### Legalidad del Monitoreo Anti-Disintermediación y Cifrado Clínico

Para atajar la desintermediación contractual sin infringir la ley, la plataforma implementa una cláusula mercantil específica y un sistema de auditoría automatizado:

- Marco Legal (Consentimiento Informado Dual): De acuerdo con el Reglamento General de Protección de Datos (RGPD, Art. 6.1.b - ejecución de contrato y Art. 9.2.a - consentimiento explícito para datos médicos), tanto el paciente como el psicólogo firman digitalmente un consentimiento que autoriza a la plataforma a procesar de forma automatizada las sesiones y chats.

- Auditoría Automatizada por NLP (Sin Humano en el Bucle): Con el fin de salvaguardar el secreto profesional médico y la privacidad, el análisis se realiza en local por un script automatizado que procesa los metadatos y la transcripción de las sesiones WebRTC (generada mediante Whisper local). Ningún administrador humano escucha o lee las consultas.

- Cláusula de Suscripción Exclusiva de Canal y Penalización: El contrato B2B firmado por el psicólogo establece que cualquier intento de desviar el paciente fuera de la plataforma (ej. compartir números de teléfono, direcciones de correo electrónico, cuentas bancarias, Bizum o programar citas físicas presenciales) constituye un fraude comercial directo. El sistema NLP de auditoría detecta automáticamente patrones de fuga (e.g. expresiones como "te paso mi teléfono", "hablamos por WhatsApp", "pásame un Bizum", "nos vemos en mi consulta privada") y ejecuta en tiempo real la **suspensión cautelar de la cuenta del profesional**, cancelando de inmediato las citas y bloqueando los payouts de Stripe Connect pending admin review.

## 9. Riesgo Sanitario, Deontología y Gestión de Crisis

### Mecanismo de Detección de Crisis (NLP Kill-Switch)

La IA cuenta con un algoritmo prioritario de clasificación de texto (NLP en tiempo real) programado para interceptar palabras clave y estructuras semánticas que apunten a ideación suicida, autolesiones o brotes psicóticos.

#### Protocolo de Bloqueo de Crisis

Ante la detección de una alerta grave, el sistema ejecuta un "Kill-Switch" automático : congela temporalmente la interacción con la IA, bloquea el chat ordinario y muestra una interfaz persistente de soporte inmediato con pautas de contención y los números de emergencia nacionales en España (024: Prevención del Suicidio, 112: Emergencias, 717 003 717: Teléfono de la Esperanza). Paralelamente, emite una alerta prioritaria al psicólogo asignado.

### Registro de Notas y Deber de Custodia

De acuerdo con la legislación sanitaria española (Ley 41/2002), es obligatorio mantener un registro ordenado y veraz de la historia clínica.

- Notas SOAP Inmutables: Las notas de evolución estructuradas en SOAP (Subjetivo, Objetivo, Análisis, Plan) validadas por el psicólogo tras cada revisión semanal se guardarán firmadas digitalmente y se custodiarán por un período mínimo obligatorio de **5 años** tras la baja del paciente, incluso si el profesional freelance rescinde su colaboración con la plataforma.

## 10. Viabilidad Económica y Modelado Financiero Unitario

### Estructura de Tarifas y Configuración de Extras

Presentación simplificada y directa de la facturación de Ancora: tarifas de suscripción y add-ons técnicos en un lado, y cupones promocionales de lanzamiento en el otro.

### Calculadora Reactiva de MRR y Retorno de Inversión (LTV/CAC)

Mueve los sliders de volumen para ver cómo impacta el crecimiento del gabinete en el MRR, las GPUs necesarias y el break-even mensual:

#### 💳 Planes Mensuales (Terapia Híbrida)

Suscripción de software e inferencia de IA local integrada con atención clínica.

#### ⚡ Configurar Add-ons (Descuento por Volumen)

Selecciona packs de ampliación a la carta. La porción del psicólogo se mantiene intacta (€15/revisión, €40/sesión) y los descuentos se absorben en el margen SaaS de la plataforma:

#### 🎯 Matrícula & Triaje Clínico Inicial (Pago Único)

Fase inicial de onboarding y encuadre clínico. Obligatoria antes de iniciar la suscripción recurrente.

- ✔ 1 semana de Diario IA encriptado: Ingesta de datos y carga de historial privada.

- ✔ 1 sesión obligatoria (1 Hora): Entrevista presencial con tu psicólogo para encuadre clínico.

- ✔ Cupón de Lanzamiento Activo: TRIAGO50

`TRIAGO50`

#### 🎁 Cupones y Promociones Activas

Ahorros promocionales vigentes para reducir las barreras de entrada:

Ahorra 10,00 €/mes adicionales los 3 primeros meses en el Plan Duo con el cupón:

`DUO2026`

Código de prescripción médica que descuenta la tasa a 49€ y otorga un 10% de descuento durante los primeros 3 meses:

`PSIQUIASAFE`

Obtén un 15% de descuento directo sobre la tarifa mensual al contratar cualquier suscripción en modalidad anual.

#### 🛡 Privacidad Criptográfica "Zero-Knowledge" (Duo/Familiar)

Cómo destacamos en el mercado de terapia de pareja y familiar:

- ✔ Diarios IA 100% Estancos: Aunque la pareja comparta terapeuta, los diarios emocionales de la IA están separados criptográficamente. Las claves de descifrado se derivan de la contraseña individual del usuario en su dispositivo (mediante WebCrypto API). La plataforma no puede leerlos sin consentimiento.

- ✔ Tres Cortafuegos en el Panel del Terapeuta: El profesional accede a una vista clínica diferenciada en tres pestañas estancas: Paciente A, Paciente B y Dinámica Relacional (coincidencias de conflictos/metas compartidos consentidos explícitamente). Evita filtraciones y sesgos.

- ✔ Toggles Anti-Sesgo y "Raw-First": El profesional puede apagar los análisis de la IA o reordenar el flujo para leer primero las citas literales antes de desplegar las síntesis y propuestas SOAP de la IA, evitando el sesgo de confirmación.

#### 📊 Panel de Consumo y Balance del Paciente

Simulación en tiempo real del área personal del usuario. Muestra lo consumido y lo que queda disponible este mes (pulsa sobre cualquier plan para cambiar la simulación):

### Métricas de Cliente Proyectadas (Promedio de Cohorte)

#### Eficiencia de Comercialización (Estándar vs. Promo)

- CAC (Coste Adquisición Promedio): 50.00 €

- CAC Neto Real (Promo Lanzamiento): **31.00 €** (compensado por el margen de 19€ de la matrícula promo)

- CAC Neto Real (Tarifa Estándar): **11.00 €** (compensado por el margen de 39€ netos de la matrícula estándar)

- Churn Rate mensual estimado / Vida Media: 15.0 % / 6.67 meses

- LTV Promedio (Promo Lanzamiento): **211.64 €** (Margen de 31.73€/mes por 6.67 meses)

- LTV Promedio (Tarifa Estándar): **266.13 €** (Margen de 39.90€/mes por 6.67 meses)

- Ratio LTV/CAC Neto (Promo / Estándar): **6.8x** en promoción / **24.2x** en tarifa estándar

- Payback del CAC promedio (Promo / Estándar): **30 días** en promo / **9 días** en tarifa estándar

#### Punto de Equilibrio (Break-Even)

Bajo la Fase MVP (costes fijos mensuales de 800€/mes para servidores GPU locales, mantenimiento de WebRTC y soporte), el punto de equilibrio operativo se alcanza con solo **20 usuarios activos mensuales** para cubrir todos los gastos operativos de la plataforma.

# Modelo de Doble Facturación SaaS para Ancora (ancora.clinic)

## Investigación Completa: Dual SaaS + Stripe Connect Split Payments

## Índice

- SAAS Paciente (29-39 EUR/mes)

- SAAS Psicólogo (tiers: Gratuito, Básico, Pro, Enterprise)

- Stripe Connect Split Payments

- Implicaciones Fiscales (IVA, IRPF, Modelos 111/347)

- Métricas Financieras y Proyecciones

- Estrategia de Monetización

## 1. SAAS Paciente (29-39 EUR/mes)

### 1.1 Qué incluye

El paciente paga una suscripción mensual a Ancora por el software e infraestructura de IA local, separada completamente de los honorarios del psicólogo.

### 1.2 Justificación del precio (29-39 EUR/mes)

Análisis de valor vs competencia:

Conclusión de precio:

- 29 EUR/mes es el precio de entrada (plan promocional/básico, solo funciones esenciales).

- 39 EUR/mes es el precio estándar (funciones completas: historial + diario + estadísticas + exportación).

- En ambos casos, el precio es inferior a una sola sesión de terapia tradicional (45-80 EUR), ofreciendo valor continuo durante 30 días.

- Comparativa: un paciente paga 29 EUR/mes (SaaS) + 50-80 EUR/sesión (psicólogo, 1-4 veces al mes) = 79-349 EUR/mes total. Frente a 45 EUR/sesión de Unobravo x 4 semanas = 180 EUR/mes sin seguimiento diario.

### 1.3 Onboarding: 49 EUR (promo)

Pago único de activación que cubre:

Estrategia: La plataforma absorbe pérdida en onboarding a cambio de:

- Activar al paciente en el ecosistema.

- Que el psicólogo reciba su honorario completo (sin comisión en primera sesión).

- Iniciar la historia psicológica portable (lock-in del paciente).

- Iniciar la suscripción SaaS mensual recurrente.

## 2. SAAS Psicólogo (tiers)

### 2.1 Tabla comparativa de features por tier

### 2.2 Descripción detallada por tier

#### Gratuito (0 EUR/mes)

- Objetivo: Hook de entrada. Barrera cero para atraer psicólogos.

- Límite: 5 pacientes activos. Suficiente para probar la plataforma, validar el modelo y empezar a generar ingresos sin coste.

- Funcionalidades: Perfil profesional, recepción de pacientes invitados, lectura del diario IA, videollamadas básicas.

- Sin SOAP automático: El psicólogo debe redactar notas manualmente. Este es el principal "dolor" que fuerza la conversión a pago.

- Sin estadísticas: No ve gráficos de progreso ni métricas agregadas.

Estrategia de conversión: Al alcanzar 5 pacientes, se bloquea la posibilidad de añadir más hasta que se actualice a Básico o Pro. El psicólogo ya ha invertido tiempo en la plataforma (5 pacientes configurados, flujo aprendido) y los pacientes ya tienen su historia en Ancora, generando lock-in bidireccional.

#### Básico (29 EUR/mes)

- Objetivo: Plan de entrada para psicólogos individuales con carga moderada.

- Límite: 20 pacientes. Cubre a la mayoría de psicólogos en solitario.

- Smart SOAP: Generación automática de notas clínicas en formato SOAP (Subjetivo, Objetivo, Análisis, Plan) a partir de la transcripción de la sesión y el diario del paciente. Ahorro estimado: 40% del tiempo administrativo.

- Estadísticas básicas: Gráficos de adherencia, evolución semanal, check-ins cumplidos.

- Valor por 29 EUR/mes: Equivale a ~1 hora de trabajo administrativo ahorrada. Si el psicólogo factura 50-80 EUR/hora, el retorno es inmediato.

#### Pro (69 EUR/mes)

- Objetivo: Plan premium para psicólogos con alta demanda o que quieren maximizar productividad.

- Pacientes ilimitados: Sin restricción de capacidad.

- SOAP avanzado: Edición colaborativa, plantillas personalizables, detección automática de sesgos, integración de escalas clínicas (PHQ-9, GAD-7) en las notas.

- Prioridad matching: Los pacientes entrantes que buscan psicólogo ven primero los perfiles Pro. El algoritmo de matching pondera positivamente a los planes de pago.

- Facturación automatizada + informes fiscales: Resumen trimestral preparado para Modelo 111 y 347.

- Exportación completa: Posibilidad de descargar el historial de todos los pacientes en formato estructurado.

#### Enterprise (personalizado)

- Objetivo: Clínicas, centros de psicología, grupos sanitarios.

- Multi-psicólogo: Gestión de equipos (hasta 20+ profesionales) con roles diferenciados (psicólogo titular, supervisor, administrativo).

- API completa: Integración con sistemas de historia clínica electrónica (HIS/EHR), sistemas de facturación, CRM.

- White-label parcial: La clínica puede usar su propia marca en el portal del paciente (dominio personalizado, logo, colores), mientras Ancora gestiona la infraestructura.

- Soporte dedicado: SLA de 1 hora para incidencias críticas.

- Precio: Desde 199 EUR/mes base + 29 EUR/mes por psicólogo adicional, negociable según volumen.

## 3. Stripe Connect Split Payments

### 3.1 Flujo de pago

```
PACIENTE
 |
 | Pago único: 29 EUR (SaaS) + 50 EUR (sesión) = 79 EUR
 v
STRIPE CHECKOUT
 |
 | Split en origen (Destination Charges)
 v
+------------------+------------------+
| Ancora (29 EUR) | Psicólogo (50 EUR) |
| + IVA 21% = 6.09 EUR | Exento IVA (Art. 20.Uno.3) |
| Neto plataforma: 35.09 EUR | Neto psicólogo: 50 EUR |
+------------------+------------------+
```

PACIENTE | | Pago único: 29 EUR (SaaS) + 50 EUR (sesión) = 79 EUR v STRIPE CHECKOUT | | Split en origen (Destination Charges) v +------------------+------------------+ | Ancora (29 EUR) | Psicólogo (50 EUR) | | + IVA 21% = 6.09 EUR | Exento IVA (Art. 20.Uno.3) | | Neto plataforma: 35.09 EUR | Neto psicólogo: 50 EUR | +------------------+------------------+

Explicación del split:

- El paciente introduce su tarjeta una sola vez en Stripe Checkout.

- Stripe divide el pago en origen mediante transfer_data[destination] en el PaymentIntent.

`transfer_data[destination]`

- La parte del psicólogo (50 EUR) se envía directamente a su cuenta Stripe Connect (exento de IVA, el psicólogo factura directamente al paciente).

- La parte de Ancora (29 EUR + 21% IVA) va a la cuenta principal de la plataforma.

- La comisión de Stripe (~1.5% + 0.25 EUR) se aplica sobre el total (79 EUR) y se descuenta de la parte de la plataforma (o se prorratea, según configuración).

### 3.2 Código de ejemplo: Configuración Stripe Connect

```
import stripe
import os
from decimal import Decimal

stripe.api_key = os.environ["STRIPE_SECRET_KEY"]

# --- CONFIGURACIÓN INICIAL ---

# 1. Crear cuenta Connect para un psicólogo (onboarding)
def crear_cuenta_psicologo(email: str, nombre: str) -> str:
 """Crea una cuenta Stripe Connect Express para el psicólogo."""
 account = stripe.Account.create(
 type="express",
 country="ES",
 email=email,
 business_type="individual",
 capabilities={
 "transfers": {"requested": True},
 },
 business_profile={
 "name": nombre,
 "product_description": "Servicios de psicología online",
 "url": "https://ancora.clinic",
 },
 individual={
 "first_name": nombre.split()[0],
 "last_name": " ".join(nombre.split()[1:]),
 },
 tos_acceptance={
 "service_agreement": "recipient",
 },
 )
 # Generar link de onboarding para que complete verificación
 account_link = stripe.AccountLink.create(
 account=account.id,
 refresh_url="https://ancora.clinic/psicologo/onboarding/refresh",
 return_url="https://ancora.clinic/psicologo/onboarding/complete",
 type="account_onboarding",
 )
 return account.id, account_link.url

# --- PROCESAMIENTO DE PAGO CON SPLIT ---

def cobrar_con_split(
 paciente_email: str,
 monto_total: Decimal, # 79.00 EUR
 monto_plataforma: Decimal, # 29.00 EUR
 monto_psicologo: Decimal, # 50.00 EUR
 id_cuenta_psicologo: str,
 id_paciente: str,
 id_psicologo: str,
) -> dict:
 """
 Crea un PaymentIntent con split en origen.
 La parte del psicólogo se transfiere directamente a su cuenta Connect.
 La parte de plataforma se liquida en la cuenta principal de Ancora.
 """
 # Stripe cobra ~1.5% + 0.25 EUR sobre el total
 # Calculamos tarifa Stripe estimada
 tarifa_stripe = (monto_total * Decimal("0.015")) + Decimal("0.25")

 # La plataforma absorbe la tarifa de Stripe (se descuenta de su parte)
 monto_liquidacion_plataforma = monto_plataforma - tarifa_stripe

 # Crear PaymentIntent con destino
 payment_intent = stripe.PaymentIntent.create(
 amount=int(monto_total * 100), # Stripe usa céntimos
 currency="eur",
 description=f"Ancora: SaaS + Sesión - Paciente {id_paciente}",
 statement_descriptor="ANCORA CLINIC",
 metadata={
 "tipo": "sesion_saas",
 "id_paciente": id_paciente,
 "id_psicologo": id_psicologo,
 "monto_plataforma_cents": int(monto_plataforma * 100),
 "monto_psicologo_cents": int(monto_psicologo * 100),
 },
 # Configuración del split
 transfer_data={
 "destination": id_cuenta_psicologo,
 "amount": int(monto_psicologo * 100), # 50 EUR al psicólogo
 },
 # La plataforma retiene el resto (29 EUR - Stripe fee)
 on_behalf_of=id_cuenta_psicologo,
 receipt_email=paciente_email,
 )

 return {
 "client_secret": payment_intent.client_secret,
 "id": payment_intent.id,
 "monto_psicologo": float(monto_psicologo),
 "monto_plataforma": float(monto_liquidacion_plataforma),
 }

# --- GESTIÓN DE REEMBOLSOS ---

def procesar_reembolso(
 payment_intent_id: str,
 monto: Decimal = None,
 motivo: str = "solicitud_paciente",
):
 """
 Reembolso parcial o total. Stripe maneja automáticamente
 la devolución de fondos desde ambas cuentas.
 """
 params = {
 "payment_intent": payment_intent_id,
 "reason": motivo,
 }
 if monto is not None:
 params["amount"] = int(monto * 100)

 refund = stripe.Refund.create(**params)
 return {
 "id": refund.id,
 "status": refund.status,
 "monto_reembolsado": refund.amount / 100,
 }

# --- VERIFICACIÓN DE SALDOS ---

def verificar_balance_psicologo(id_cuenta_psicologo: str) -> dict:
 """Comprueba el balance disponible de un psicólogo antes de payout."""
 balance = stripe.Balance.retrieve(
 stripe_account=id_cuenta_psicologo
 )
 disponible = sum(
 bal.amount for bal in balance.available
 if bal.currency == "eur"
 )
 pendiente = sum(
 bal.amount for bal in balance.pending
 if bal.currency == "eur"
 )
 return {
 "disponible": disponible / 100,
 "pendiente": pendiente / 100,
 }
```

import stripe import os from decimal import Decimal stripe.api_key = os.environ["STRIPE_SECRET_KEY"] # --- CONFIGURACIÓN INICIAL --- # 1. Crear cuenta Connect para un psicólogo (onboarding) def crear_cuenta_psicologo(email: str, nombre: str) -> str: """Crea una cuenta Stripe Connect Express para el psicólogo.""" account = stripe.Account.create( type="express", country="ES", email=email, business_type="individual", capabilities={ "transfers": {"requested": True}, }, business_profile={ "name": nombre, "product_description": "Servicios de psicología online", "url": "https://ancora.clinic", }, individual={ "first_name": nombre.split()[0], "last_name": " ".join(nombre.split()[1:]), }, tos_acceptance={ "service_agreement": "recipient", }, ) # Generar link de onboarding para que complete verificación account_link = stripe.AccountLink.create( account=account.id, refresh_url="https://ancora.clinic/psicologo/onboarding/refresh", return_url="https://ancora.clinic/psicologo/onboarding/complete", type="account_onboarding", ) return account.id, account_link.url # --- PROCESAMIENTO DE PAGO CON SPLIT --- def cobrar_con_split( paciente_email: str, monto_total: Decimal, # 79.00 EUR monto_plataforma: Decimal, # 29.00 EUR monto_psicologo: Decimal, # 50.00 EUR id_cuenta_psicologo: str, id_paciente: str, id_psicologo: str, ) -> dict: """ Crea un PaymentIntent con split en origen. La parte del psicólogo se transfiere directamente a su cuenta Connect. La parte de plataforma se liquida en la cuenta principal de Ancora. """ # Stripe cobra ~1.5% + 0.25 EUR sobre el total # Calculamos tarifa Stripe estimada tarifa_stripe = (monto_total * Decimal("0.015")) + Decimal("0.25") # La plataforma absorbe la tarifa de Stripe (se descuenta de su parte) monto_liquidacion_plataforma = monto_plataforma - tarifa_stripe # Crear PaymentIntent con destino payment_intent = stripe.PaymentIntent.create( amount=int(monto_total * 100), # Stripe usa céntimos currency="eur", description=f"Ancora: SaaS + Sesión - Paciente {id_paciente}", statement_descriptor="ANCORA CLINIC", metadata={ "tipo": "sesion_saas", "id_paciente": id_paciente, "id_psicologo": id_psicologo, "monto_plataforma_cents": int(monto_plataforma * 100), "monto_psicologo_cents": int(monto_psicologo * 100), }, # Configuración del split transfer_data={ "destination": id_cuenta_psicologo, "amount": int(monto_psicologo * 100), # 50 EUR al psicólogo }, # La plataforma retiene el resto (29 EUR - Stripe fee) on_behalf_of=id_cuenta_psicologo, receipt_email=paciente_email, ) return { "client_secret": payment_intent.client_secret, "id": payment_intent.id, "monto_psicologo": float(monto_psicologo), "monto_plataforma": float(monto_liquidacion_plataforma), } # --- GESTIÓN DE REEMBOLSOS --- def procesar_reembolso( payment_intent_id: str, monto: Decimal = None, motivo: str = "solicitud_paciente", ): """ Reembolso parcial o total. Stripe maneja automáticamente la devolución de fondos desde ambas cuentas. """ params = { "payment_intent": payment_intent_id, "reason": motivo, } if monto is not None: params["amount"] = int(monto * 100) refund = stripe.Refund.create(**params) return { "id": refund.id, "status": refund.status, "monto_reembolsado": refund.amount / 100, } # --- VERIFICACIÓN DE SALDOS --- def verificar_balance_psicologo(id_cuenta_psicologo: str) -> dict: """Comprueba el balance disponible de un psicólogo antes de payout.""" balance = stripe.Balance.retrieve( stripe_account=id_cuenta_psicologo ) disponible = sum( bal.amount for bal in balance.available if bal.currency == "eur" ) pendiente = sum( bal.amount for bal in balance.pending if bal.currency == "eur" ) return { "disponible": disponible / 100, "pendiente": pendiente / 100, }

### 3.3 Manejo de reembolsos, disputas y fallos

#### Reembolsos

- Stripe reembolsa desde la cuenta que recibió los fondos.

- Si el reembolso es total: Stripe descuenta de ambas cuentas (plataforma + psicólogo) en proporción al split original.

- Si el reembolso es parcial: Stripe prorratea automáticamente.

- Riesgo: Si el psicólogo ya ha retirado los fondos (payout realizado), su balance Connect puede quedar en negativo. Stripe cobrará futuros pagos al psicólogo hasta cubrir el descubierto.

#### Disputas (chargebacks)

- La disputa se descuenta de la cuenta de la plataforma (quien tiene la relación contractual directa con Stripe).

- La plataforma puede trasladar parte o toda la disputa al psicólogo si se demuestra que el servicio clínico fue defectuoso.

- Recomendación: Configurar stripe_account en el PaymentIntent para que Stripe priorice el saldo de la cuenta destino (psicólogo) para cubrir disputas.

`stripe_account`

#### Fallos de pago

- Implementar Striwebhooks para payment intent.payment failed :

`payment intent.payment failed`

- Notificar al paciente por email/SMS.

- Suspender acceso al SaaS (no renovar sesión de IA) pero mantener la historia clínica accesible (deber ético).

- Notificar al psicólogo que el paciente tiene un pago pendiente.

- Reintentos automáticos: Stripe Smart Retries (3 intentos en días distintos).

- Suspensión progresiva:

- Día 1-3: Recordatorio amistoso.

- Día 4-7: Chat IA desactivado (solo lectura de historial).

- Día 8+: Perfil en pausa. Psicólogo notificado. No se programan nuevas sesiones hasta regularizar.

## 4. Implicaciones Fiscales

### 4.1 IVA SaaS 21%

Base legal: Servicios prestados por vía electrónica (Ley 37/1992 IVA, Art. 69. Uno).

La suscripción SaaS de Ancora (29-39 EUR/mes) califica como servicio electrónico :

- No hay intervención humana directa en la prestación del servicio.

- Es automatizado, estandarizado, sin personalización por persona física.

- Se entrega a través de internet.

Tipo aplicable: 21% de IVA en España (régimen general).

Cálculo:

- Precio SaaS: 29.00 EUR (base imponible base, puede haber recargo de equivalencia si aplica... en general, tipo general)

- Ejemplo real:

- Precio sin IVA: 29.00 EUR

- IVA 21%: 6.09 EUR

- Total cobrado al paciente: 35.09 EUR

Factura que emite Ancora al paciente:

```
ANCORA CLINIC SL
CIF: Pendiente
Factura SaaS - [Nº Factura]
Fecha: [dd/mm/aaaa]
Cliente: [Nombre Paciente] - [NIF]

Concepto:
Suscripción mensual plataforma Ancora (software + IA local)
 - Historia psicológica portable
 - Diario IA (15 min/día)
 - Estadísticas de progreso
 - Exportación de datos

Base imponible: 29.00 EUR
IVA 21%: 6.09 EUR
Total: 35.09 EUR
```

ANCORA CLINIC SL CIF: Pendiente Factura SaaS - [Nº Factura] Fecha: [dd/mm/aaaa] Cliente: [Nombre Paciente] - [NIF] Concepto: Suscripción mensual plataforma Ancora (software + IA local) - Historia psicológica portable - Diario IA (15 min/día) - Estadísticas de progreso - Exportación de datos Base imponible: 29.00 EUR IVA 21%: 6.09 EUR Total: 35.09 EUR

### 4.2 Exención IVA Psicólogo (Art. 20.Uno.3 Ley IVA)

Base legal: Ley 37/1992, Artículo 20, apartado Uno, número 3:

"Estarán exentas [...] las prestaciones de servicios de asistencia sanitaria por profesionales sanitarios [...] cualquiera que sea la persona o entidad a cuyo cargo se realicen."

Requisitos para aplicar la exención:

- El psicólogo debe ser profesional sanitario habilitado (MPGS o PIR).

- La prestación debe tener finalidad de diagnóstico, prevención o tratamiento.

- La relación es directa psicólogo-paciente (aunque medie plataforma).

Factura que emite el psicólogo al paciente (a través de Ancora):

```
[Nombre Psicólogo]
[NIF/CIF]
[Nº Colegiado]

Factura Servicios Clínicos - [Nº Factura]
Fecha: [dd/mm/aaaa]
Cliente: [Nombre Paciente] - [NIF]

Concepto:
Servicio de psicología online (sesión 50 min)
 - Diagnóstico y tratamiento psicológico
 - Revisión de historial clínico

Base imponible: 50.00 EUR
IVA: Exento (Art. 20.Uno.3 LIVA)
Total: 50.00 EUR
```

[Nombre Psicólogo] [NIF/CIF] [Nº Colegiado] Factura Servicios Clínicos - [Nº Factura] Fecha: [dd/mm/aaaa] Cliente: [Nombre Paciente] - [NIF] Concepto: Servicio de psicología online (sesión 50 min) - Diagnóstico y tratamiento psicológico - Revisión de historial clínico Base imponible: 50.00 EUR IVA: Exento (Art. 20.Uno.3 LIVA) Total: 50.00 EUR

Importante: El psicólogo NO cobra IVA, pero debe incluir en su factura la referencia al artículo de exención.

### 4.3 IRPF: Retenciones y Modelo 111

#### Retenciones aplicables

#### Flujo de retenciones con Stripe Connect

Actualmente, Stripe Connect NO retiene IRPF automáticamente. La responsabilidad es del psicólogo:

- El psicólogo emite su factura exenta de IVA al paciente.

- El paciente (persona física) NO está obligado a retener IRPF porque no es empresario.

- El psicólogo ingresa sus facturas en su declaración trimestral (Modelo 130/131) y anual (Renta).

- Alternativamente, Ancora puede actuar como pagador si contrata al psicólogo como profesional, reteniendo el 15% en cada pago. Pero esto crea riesgo de laboralidad.

Modelo recomendado para Ancora:

- Ancora no retiene IRPF al psicólogo para evitar relación laboral.

- El psicólogo declara sus ingresos directamente en sus modelos trimestrales.

- Ancora emite un certificado anual de ingresos (Modelo 347 o certificado de retenciones si aplica) para que el psicólogo lo use en su declaración.

#### Modelo 111 (retenciones IRPF)

Ancora debe presentar Modelo 111 si retiene IRPF a los psicólogos. Si opta por no retener (para evitar laboralidad), NO presenta 111 por estos pagos.

Si Ancora contrata a un psicólogo como profesional externo con retención:

- Trimestral: Modelo 111 (retenciones practicadas).

- Anual: Modelo 190 (resumen anual de retenciones).

### 4.4 Facturación automatizada

Arquitectura de facturación:

```
PACIENTE
 |--- Pago único (Stripe)
 |
 v
SISTEMA ANCORA
 |
 |--- Genera factura SaaS (Ancora -> Paciente)
 | Base: 29 EUR + IVA 21% = 35.09 EUR
 | IVA: Ingresado en Hacienda (Modelo 303 trimestral)
 |
 |--- Genera factura clínica (Psicólogo -> Paciente)
 | Base: 50 EUR. Exenta IVA.
 | Enviada al psicólogo para su contabilidad
 |
 |--- Reporte mensual al psicólogo
 | "Tus facturas emitidas: XX EUR"
 | "Tus cobros recibidos: XX EUR"
 | "Resumen para Modelo 130/131"
```

PACIENTE |--- Pago único (Stripe) | v SISTEMA ANCORA | |--- Genera factura SaaS (Ancora -> Paciente) | Base: 29 EUR + IVA 21% = 35.09 EUR | IVA: Ingresado en Hacienda (Modelo 303 trimestral) | |--- Genera factura clínica (Psicólogo -> Paciente) | Base: 50 EUR. Exenta IVA. | Enviada al psicólogo para su contabilidad | |--- Reporte mensual al psicólogo | "Tus facturas emitidas: XX EUR" | "Tus cobros recibidos: XX EUR" | "Resumen para Modelo 130/131"

### 4.5 Declaración en el Modelo 347

El Modelo 347 declara operaciones con terceros > 3.005,06 EUR anuales.

#### Flujo 1: Ancora -> Paciente (SaaS)

#### Flujo 2: Ancora -> Psicólogo (pagos)

#### Flujo 3: Psicólogo -> Paciente (factura clínica)

El psicólogo declara sus facturas a pacientes en su propio Modelo 347. Si un paciente suma > 3.005 EUR en honorarios al año (poco probable en terapia estándar), debe declararse.

#### Resumen de obligaciones fiscales de Ancora

## 5. Métricas Financieras

### 5.1 Margen por plan de psicólogo

Nota: El margen es casi 100% porque el SaaS es puro software. Los costes principales son:

- Infraestructura GPU local (amortizable, ~545 EUR/mes para servidor dual RTX 4090).

- Ancho de banda y storage (AWS S3-compatible, ~50-200 EUR/mes).

- Stripe fees (~1.5% + 0.25 EUR por transacción).

### 5.2 Mix de ingresos estimado (100 psicólogos + 300 pacientes)

Escenario realista a 12 meses:

### 5.3 LTV segmentado

#### Paciente que llega por psicólogo (canal orgánico)

Características: Paciente que llega porque su psicólogo ya está en Ancora. Alta retención porque el psicólogo es su ancla. Bajo churn.

#### Paciente que llega por canal frío (ads, SEO, redes)

Conclusión: El canal frío es mucho menos rentable. Hay que minimizar la inversión en ads fríos y maximizar la adquisición vía psicólogos (efecto red).

### 5.4 CAC por canal

### 5.5 Proyección a 6, 12 y 24 meses

Supuestos:

- Crecimiento mensual: 15% primeros 6 meses, 10% siguientes 6, 8% después.

- Churn pacientes SaaS: 8% (psicólogo-derivados) / 15% (fríos) - ponderado 10%.

- Churn psicólogos de pago: 5% mensual.

- 50% de los psicólogos gratuitos se convierten a pago al alcanzar 5 pacientes.

- Cada psicólogo de pago trae 3 pacientes nuevos (efecto viral).

- Onboarding: 49 EUR/paciente nuevo (40% lo pagan).

Punto de equilibrio: Mes 1-2 (con 20 pacientes + 10 psicólogos). Esto valida el modelo como rápidamente rentable.

## 6. Estrategia de Monetización

### 6.1 Hook: psicólogo gratis hasta 5 pacientes (barrera cero)

Estrategia: El plan gratuito elimina toda barrera de entrada para el psicólogo:

- Sin tarjeta de crédito requerida para registrarse.

- Funcionalidades suficientes para probar el valor del producto.

- 5 pacientes gratuitos: margen suficiente para validar el modelo sin comprometer ingresos.

Conversión forzada: Al llegar al paciente número 6, el sistema:

- Muestra un mensaje: "Has alcanzado tu límite de pacientes gratuitos. Actualiza a Básico o Pro para seguir añadiendo pacientes".

- Los 5 pacientes existentes siguen funcionando (no se pierde el trabajo).

- Se bloquea la incorporación de nuevos pacientes hasta la actualización.

- El psicólogo ya ha invertido tiempo en la plataforma: alta probabilidad de conversión.

Métrica objetivo: 50% de conversión de gratuito a pago en los primeros 3 meses.

### 6.2 Upgrade forzado al llegar a 5 pacientes

Mecanismo de bloqueo progresivo:

Trigger emocional: El psicólogo ve el valor de la plataforma con sus 5 pacientes (diario IA estructurado, panel clínico, ahorro de tiempo). La alternativa es migrar a otro sistema o gestionar manualmente, perdiendo toda la inversión de tiempo y datos estructurados.

### 6.3 Referral: descuento por invitar a otro psicólogo

Mecanismo:

- Cada psicólogo tiene un código de referral único.

- Cuando un invitado se registra y paga su primer mes de cualquier plan de pago:

- El psicólogo referente recibe 50% de descuento en su próxima mensualidad.

- El psicólogo invitado recibe primer mes a mitad de precio .

- Límite: máximo 5 descuentos acumulables por mes (máximo un plan Pro gratis).

Efecto red: Si cada psicólogo invita a 2-3 colegas al año, el crecimiento es exponencial sin costes de adquisición.

### 6.4 Paciente: onboarding 49 EUR + SaaS mensual

Estructura de precios al paciente:

Separación clara: El paciente entiende que paga:

- A Ancora por el software (29-39 EUR/mes).

- Al psicólogo por la terapia (50-80 EUR/sesión, pactado directamente con el profesional).

Ventaja competitiva: El paciente sabe exactamente qué paga y a quién. Sin comisiones ocultas ni mezcla de conceptos.

### 6.5 Paquetes de créditos extra

Monetización de uso intensivo:

Coste operativo de chat extra:

- Servidor dual RTX 4090: 6.530 EUR (amortizado a 3 años) = 181 EUR/mes.

- Electricidad (900W x 12h/día x 0,18 EUR/kWh) = 58 EUR/mes.

- Mantenimiento: 50 EUR/mes.

- Total coste servidor/mes: ~289 EUR.

- Capacidad: 640 sesiones de 15 min/día = 160 horas/mes.

- Coste por hora de chat IA: ~1,81 EUR.

- Pack de 5 horas a 9 EUR = 1,80 EUR/hora de coste -> 7,20 EUR de margen.

## Resumen Ejecutivo del Modelo

Esquema general:

```
PACIENTE
 |
 | Pago único por todo
 v
 STRIPE CONNECT
 |
 +--------+--------+
 | |
 v v
 ANCORA (29-39 EUR) PSICOLOGO (50-80 EUR)
 + IVA 21% Exento IVA
 Factura SaaS Factura clínica
 | |
 v v
 Declara: Declara:
 - Modelo 303 (IVA) - Modelo 130/131 (IRPF)
 - Modelo 347 - Modelo 347
 - Impuesto Sociedades
```

PACIENTE | | Pago único por todo v STRIPE CONNECT | +--------+--------+ | | v v ANCORA (29-39 EUR) PSICOLOGO (50-80 EUR) + IVA 21% Exento IVA Factura SaaS Factura clínica | | v v Declara: Declara: - Modelo 303 (IVA) - Modelo 130/131 (IRPF) - Modelo 347 - Modelo 347 - Impuesto Sociedades

Ventajas del modelo:

- Sin riesgo de laboralidad: El psicólogo no es empleado, es cliente del SaaS y prestador de servicios clínicos independiente.

- Blindaje fiscal del psicólogo: Sus honorarios están exentos de IVA (Art. 20.Uno.3 LIVA), no actúa como intermediario sino como profesional sanitario directo.

- Margen altísimo en SaaS: 95%+ en planes de psicólogo, 73%+ en packs de créditos.

- Efecto red viral: Psicólogos traen pacientes, pacientes retienen psicólogos. Crecimiento orgánico.

- Rentabilidad desde el mes 1: Con solo 20 pacientes + 10 psicólogos se cubren costes fijos.

- LTV/CAC excepcional en canal orgánico: 79x cuando el paciente llega vía su psicólogo.

- Escalabilidad predecible: Cada servidor GPU adicional (6.530 EUR) soporta ~1.000 DAU y se amortiza en ~16 meses.

Riesgos principales:

- Churn en canal frío: LTV/CAC de 0.07x en escenario pesimista de ads. Minimizar inversión en publicidad fría.

- Dependencia de psicólogos: Si abandonan, arrastran pacientes. Mitigar con lock-in de historia psicológica + Smart SOAP.

- Complejidad fiscal del split: Stripe Connect no maneja retenciones IRPF automáticas. Requiere desarrollo de capa de facturación.

- Riesgo de disputas: Chargebacks afectan a ambas cuentas. Política clara de reembolsos necesaria.

Documento generado para Ancora.clinic - Mayo 2026

Próxima iteración: Integración con API de facturación (FacturaScripts/Anfix) y automatización del Modelo 111.

## 11. Debate de Uberización y Modelo de Colaboración

### Solución Estratégica al Modelo "Uber"

La plataforma se redefine como un Marketplace de Infraestructura SaaS con Cobro en Split . Para cumplir estrictamente con la legislación en España (eliminación de laboralidad por cuenta ajena de falsos autónomos y exención sanitaria de IVA), el sistema procesa el cobro del usuario en origen dividiéndolo instantáneamente:

#### 1. Facturación en Origen y Stripe Connect Split

La suscripción mensual del paciente se divide en origen en la pasarela de pagos. La plataforma cobra una cuota fija mensual de **49,00 €** (IVA incluido: 40.50€ base + 8.50€ IVA) por el software de IA y WebRTC, emitiendo una factura de servicio informático al paciente. La parte clínica (30€, 70€ o 140€ según el plan) se transfiere directamente a la cuenta del psicólogo (quien emite una factura exenta de IVA al paciente). Esto garantiza la independencia mercantil absoluta del terapeuta y elude la laboralidad.

#### 2. Moderación de Opiniones por DLP y Respuestas Neutras

Las reseñas públicas se limitan a valorar la logística del servicio (puntualidad, amabilidad, trato). Un sistema NLP/NER local enmascara de forma automatizada referencias a patologías o fármacos expuestos por los pacientes en sus comentarios. Además, se deshabilita el texto libre a los terapeutas para responder, obligando al uso de plantillas neutras para evitar infracciones de la AEPD.

### Estrategia Antifuga y Control de Desintermediación

Para atajar el riesgo de que el psicólogo y el paciente abandonen la app para realizar la terapia síncrona de forma externa y directa (cobro en negro), el sistema implementa cuatro mecanismos de retención e incentivo :

#### Smart SOAP y Copiloto IA (Terapeutas)

La IA transcribe de forma segura la videollamada y autogenera de forma gratuita el informe médico en formato SOAP (Subjetivo, Objetivo, Análisis, Plan) en el panel clínico del profesional. Si el terapeuta saca al paciente de la plataforma, pierde esta herramienta inteligente que le ahorra un 40% de tiempo administrativo semanal.

#### Sincronización del Diario IA (Pacientes)

El paciente solo puede acceder a su chat de acompañamiento 24/7 y su diario emocional si su suscripción mensual sigue activa en la plataforma. Si deciden continuar fuera del sistema, el paciente pierde el asistente diario que le ayuda a procesar pensamientos distornos en el día a día.

#### Incentivo Económico Asíncrono (Alta Rentabilidad)

El psicólogo recibe 15€ netos por realizar revisiones de texto asíncronas de 15 minutos (tasa de **60 €/hora**). Esta tarifa por minuto es superior a la de la videollamada síncrona de 45 minutos (que paga **40 € netos**, es decir, **53.33 €/hora**). Dado que el psicólogo gana más por minuto en modo asíncrono y estas revisiones dependen por completo de la IA y el panel del software, el profesional no tiene incentivos a fugarse.

#### Burocracia Cero y Automatización Fiscal

La plataforma realiza la auto-facturación automatizada y gestiona el split del IRPF para presentarlo directamente a Hacienda en nombre del psicólogo. Operar fuera de la plataforma les obligaría a contratar una gestoría externa para emitir facturas mensuales de micro-importes por cada paciente.

### Video-Briefing Asíncrono (Teleprompter Clínico Simplificado)

Para eliminar la fricción operativa y burocrática, se descarta la firma de informes formales y PDFs complejos (los cuales no forman parte de la práctica diaria de los terapeutas). El seguimiento asíncrono se realiza mediante un flujo ágil:

- Borrador Clínico y Validación: La IA local resume las conversaciones semanales del paciente y le genera un borrador de análisis en el panel. El psicólogo revisa e introduce sus correcciones de forma ágil, y al pulsar **"Validar y Enviar Devolución"** el borrador se guarda en el expediente.

- Teleprompter y Grabación: El software abre una ventana de teleprompter con los puntos clave clínicos que debe transmitir. El psicólogo graba un vídeo de 5-10 minutos directamente desde su webcam leyendo el teleprompter. **Este vídeo actúa como la devolución clínica oficial y la prueba de auditoría del servicio.** El paciente recibe el vídeo y el borrador en su app.

### Gestión Operativa de Horarios y Reservas de GPU (Concurrencia)

La coexistencia de sesiones síncronas, revisiones y chats interactivos de IA requiere un balanceo operativo estricto para evitar la saturación de los servidores locales de GPU y los calendarios:

- Bandeja de Tareas Decoupled (Calendarios libres): Las videollamadas (45 min) se reservan de forma síncrona integrando Google Calendar. Sin embargo, las revisiones asíncronas (Video-Briefings) se listan en una bandeja de entrada común. El psicólogo tiene un SLA flexible de 24-48 horas para realizarlas a su conveniencia, sin coordinar agendas en directo.

- Reservas de Slots de IA y Concurrencia Real de GPU: Cada usuario dispone de **15 minutos de chat de IA al día** incluidos. Las conversaciones con la IA se estructuran mediante reservas en el calendario in-app para aplanar la curva de carga de la GPU. Gracias a que el procesamiento de inferencia autoregresiva es discreto y asíncrono (la generación dura 1-2 segundos por mensaje mientras el usuario lee y escribe), un límite de **8 usuarios en generación activa simultánea** en la Dual RTX 4090 se traduce en la capacidad de soportar **más de 80 chats concurrentes en tiempo real** por servidor sin degradación de velocidad.

- IA de Razonamiento Clínico de Gama Alta (Se nota la Inteligencia): En lugar de usar bots genéricos y de baja capacidad, el servidor local corre modelos premium como **DeepSeek-R1-70B** (que muestra su cadena de pensamiento <thought> al paciente, generando una altísima sensación de comprensión analítica e inteligencia clínica) y **GLM-4-9B / GLM-5.1** (ejecutados a más de 110 tokens/s para respuestas de chat instantáneas).

`<thought>`

- Monetización de Créditos Libres (Upsell de Alto Margen): Si el usuario agota sus 15 minutos diarios y desea continuar interactuando con la IA de gama alta, puede adquirir packs de "Créditos Libres" de **15€ por 5 horas de chat**. En el servidor Dual RTX 4090, el coste operativo neto (luz y amortización) por hora de GPU es de solo **0,811€**, lo que representa un **73,0% de Margen Bruto** (10,95€ de beneficio por pack). Esto permite monetizar de forma masiva a los usuarios intensivos, financiando directamente la compra de más ordenadores locales.

### Plan de Distribución y Oferta de Lanzamiento

La captación inicial de pacientes y profesionales se realiza bajo tres canales comerciales:

- B2B2C (Prescripción Médica y Psiquiátrica): Alianzas con psiquiatras privados y clínicas médicas. Los psiquiatras derivan pacientes a nuestra app para su seguimiento diario de conducta y emociones, recibiendo informes de progreso para sus consultas.

- Captación B2B Terapeutas (Colegios Oficiales): Ofrecer la suite SaaS de forma gratuita durante los primeros 3 meses a psicólogos colegiados que traigan sus propios pacientes externos a la plataforma, convirtiéndolos en prescriptores.

- Oferta Hook de Onboarding a Mitad de Precio (49€): Para romper la barrera de entrada, el mes 1 (Semana 1 de triaje + 1h sesión + 3 semanas de plan esencial) se ofrece como promoción de lanzamiento a **49,00 €** en lugar de 99,00 €. La plataforma absorbe el 100% de su cuota de software (0€), transfiriendo íntegramente los 49€ al psicólogo. Esto genera un CAC neto de 0€ para la plataforma y acelera la tracción.

### Flujo de Onboarding Clínico Automatizado

A continuación se detalla el flujo de onboarding que permite a un terapeuta entrar a trabajar de forma segura, garantizando la verificación sanitaria y el cumplimiento de las normativas de forma autónoma:

#### 1 Registro & KYC

El terapeuta introduce datos básicos y firma digitalmente (vía pasarela certificada eIDAS) el Contrato Mercantil y el Anexo de Encargado de Tratamiento (Art. 28 RGPD).

#### 2 Carga de Credenciales

Subida obligatoria del Título de Psicólogo General Sanitario (PGS) o PIR, número de colegiado, Certificado de Delitos Sexuales y Seguro de Responsabilidad Civil (SRC).

#### 3 Verificación RPA

Un script de RPA dinámico consulta en tiempo real el registro oficial del REPS del Ministerio de Sanidad y los Colegios Oficiales autonómicos para validar la licencia activa.

#### 4 Activación y Stripe

Activación automática del perfil público (< 24 horas tras verificación del backoffice). El psicólogo conecta su Stripe Connect, fija sus precios y comienza a recibir pacientes.

#### Auditoría de Licencias Mensual

Un cron job automatizado en Node.js ejecuta mensualmente la verificación del número de colegiado de toda la base de datos de profesionales. Si un psicólogo es inhabilitado o causa baja en su colegio oficial, su perfil en la plataforma se suspende cautelarmente en tiempo real, cancelando citas programadas.

### Transcripción del Debate Oficial de los Agentes (21 Interacciones)

A continuación se presenta el registro oficial y literal del debate sostenido por los agentes virtuales encargados de auditar la viabilidad legal, de protección de datos (RGPD) y fiscalidad del modelo en España.

## 12. Estrategia de Marketing, Branding y Distribución (Proyecto Ancora)

### Nombre Seleccionado: Ancora (ancora.clinic)

Tagline: "Ancora: Tu espacio de terapia en servidor privado". Enraizamiento, estabilidad y soberanía física de tus datos.

### Identidad Cromática y Psicología del Consumidor

Paleta de colores curada y de alta accesibilidad (cumplimiento estricto de contraste WCAG 2.1 AAA) diseñada para mitigar la ansiedad y evocar solidez médica:

#### Canales de Difusión y Captación Sostenibles

- Prescripción B2B2C: Alianzas con psiquiatras privados en Madrid/Barcelona a través de dossiers médicos interactivos destacando el secreto profesional bajo red física local.

- Penetración en COP: Impartición de talleres gratuitos sobre ciberseguridad, LOPDGDD y ética digital en colegios de psicólogos oficiales para captar prescriptores de la plataforma.

- SEO y Ads Segmentados: Pujas por palabras clave informacionales de privacidad de datos y anuncios segmentados en LinkedIn/Meta para perfiles profesionales de alta sensibilidad (directivos, desarrolladores, abogados).

#### Copywriting Estratégico y CTAs Clave

• Titular Hero: "Tus conversaciones de terapia no pertenecen a la nube corporativa de terceros. Pertenecen a ti." 
 • CTA Principal: Reservar mi Slot Clínico Seguro 
 • Neutralización de la resistencia a la IA: Demostrar que los datos se procesan de forma privada en memoria de GPU efímera en nuestros propios servidores residenciales en España y no en APIs públicas comerciales. "Ninguna multinacional externa puede leer tus pensamientos."

`Reservar mi Slot Clínico Seguro`

### Desarrollo del Marketing Mix y Posicionamiento Diferencial

Estudio exhaustivo del plan de marketing de Ancora estructurado en 5 pilares para destacar e irrumpir en el mercado español:

#### 1. Posicionamiento: El "Búnker de la Psicología Digital"

A diferencia de marketplaces generalistas de terapeutas (Unobravo, Buencoco, Therapyside) que actúan como meros intermediarios comerciales y almacenan la información del paciente en servicios cloud de bases de datos compartidos, Ancora se posiciona como una marca de seguridad y soberanía clínica física .
 
 El mensaje clave ataca de frente la nube comercial: Ancora es el único puerto seguro que no revende tus datos, no usa APIs públicas de grandes tecnológicas extranjeras y procesa de forma encriptada en servidores de hardware propios independientes localizados en territorio español.

#### 2. Psicología del Consumidor y Objeciones ante la IA

Identificamos dos grandes resistencias en el target clínico y de usuarios finales:
 
 • Resistencia 1: "¿Una máquina fría me va a evaluar?": Se combate el miedo humanizando el rol de la IA. No sustituye al psicólogo; actúa como un "Asistente de Autoconocimiento Asistido". El psicólogo humano colegiado sigue siendo el responsable único del diagnóstico clínico semanal.
 
 • Resistencia 2: "Mis secretos se filtrarán": Se demuestra visualmente la arquitectura de cifrado homomórfico y el aislamiento en bases de datos independientes. Se desmantela la objeción técnica explicando el procesamiento efímero *in-memory* en GPUs sin generación de logs persistentes.

#### 3. Táctica B2B2C: Psiquiatras como Prescriptores Sólidos

Para evitar gastar el 100% del presupuesto en tráfico de pago (donde la subasta de Google Ads está saturada de capital riesgo extranjero), Ancora creará una red orgánica de recomendación médica:
 
 • El Problema del Psiquiatra: Muchos médicos y psiquiatras privados de España recomiendan terapia semanal a sus pacientes, pero temen que las apps de mensajería (WhatsApp, Zoom) vulneren el secreto profesional o los expongan a sanciones de la AEPD.
 
 • Nuestra Solución: Proporcionar un dossier formal técnico demostrando el cumplimiento deontológico del Colegio Oficial de Psicología (COP). Al recomendar Ancora, el médico sabe que los datos están seguros en servidores privados independientes, lo que le exime de cualquier riesgo legal.

#### 4. Exclusividad e Incentivos del Sistema de Slots Reservados

El sistema de **slots reservados de 15 minutos diarios** (acumulables) se utiliza en marketing no como una limitación, sino como un **potenciador psicológico de compromiso y valor**:
 
 • Terapia Organizada: Chatear sin límites fomenta la rumiación destructiva. Reservar tu franja diaria de 15 minutos enseña al paciente a crear un espacio de introspección ordenado, con hora de inicio y fin, aumentando el valor terapéutico del diario emocional.
 
 • Garantía de Rendimiento: Al igual que en una consulta de prestigio, reservar tu slot asegura que toda la potencia de hardware de nuestros servidores esté dedicada a ti en exclusiva, garantizando una respuesta inmediata.

#### 5. Retención de Pacientes y Prevención de Desintermediación (Churn & Fuga)

La mayor amenaza para plataformas como Unobravo o Therapyside es la **desintermediación**: que el psicólogo se lleve al paciente fuera de la app tras las primeras sesiones para no pagar la comisión. Ancora neutraliza este riesgo mediante incentivos cruzados insustituibles fuera del ecosistema:
 
 • Para el Paciente (El Historial Cifrado y el Diario IA): Si el paciente abandona la suscripción de la plataforma para irse con el psicólogo por fuera, pierde el acceso a la IA clínica diaria y al histórico de su diario emocional encriptado en el servidor privado de Ancora. La IA actúa como una barrera de salida técnica insustituible.
 
 • Para el Psicólogo (La Herramienta de Productividad SOAP): La plataforma proporciona al psicólogo un minisoftware que le autogenera resúmenes estructurados en formato SOAP clínicos y gráficos de evolución de sus pacientes bajo cifrado extremo. Esto le ahorra un 40% de tiempo administrativo. Fuera de Ancora, el terapeuta pierde esta automatización y debe volver a rellenar informes manualmente.
 
 • Incentivo Económico Asíncrono de Alta Rentabilidad: Al pagar **15€ netos al psicólogo por cada revisión asíncrona de 15 minutos** (tasa de **60€/hora** netos en la plataforma) frente a **40€ por sesión síncrona de 45 minutos** (tasa de **53.33€/hora**), los psicólogos ganan más dinero por minuto trabajado en modo asíncrono dentro del sistema que atendiendo fuera por videollamada, eliminando cualquier deseo de fuga.

### Transcripción del Debate Completo (50 Interacciones de Agentes)

Usa los siguientes filtros interactivos para explorar la deliberación de 50 pasos realizada por el comité de marketing para definir la estrategia de Ancora:

| Plataforma | Región | Modelo Matching | Tarifa Paciente | Retribución Clínica | Comisión / SaaS | Rol IA / Chat | Seguridad / Privacidad | Valoraciones Públicas | Detalle |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ancora (Nuestra Plataforma) Líder | España/SaaS | Matching de afinidad + Diarios Cifrados | Desde 69 € / mes (Híbrida) Duo: 180 €/mes \| Familiar: 239 €/mes | Premium (15€/revisión de 15m, 40€/sesión de 45m) | SaaS 49€/mes (0% comisión sobre cobros) | Soporte Diario con IA local (slots de 15m) | Zero-Knowledge cifrado en cliente (WebCrypto API) | No (Matching privado asistido) | [Ver] |
| Funcionamiento del Servicio Combina triaje clínico inicial, chat diario asistido por IA local (en servidor Dual RTX 4090 propio) y seguimiento periódico por un terapeuta asignado a través de revisiones de 15m y videollamadas. El psicólogo dispone de una herramienta que autogenera resúmenes en formato SOAP. Debilidades de Competencia que Corrige Evita precarización laboral: Comisiones al 0% y retribución neta justa (hasta 60€/h). Previene burnout: La IA local realiza la contención diaria y el diario interactivo, reduciendo la carga del psicólogo a revisiones acotadas. Privacidad: Los chats no tocan APIs de terceros ni logs permanentes. |  |  |  |  |  |  |  |  |  |
| Sprout | España | Diario con IA + Microsesiones | Desde 30€ / sesión (Micros: 15m / 15€) | 80% de la tarifa del profesional | 20% comisión por sesión | Acompañamiento con IA + Sprout Score | Estándar en la nube (No E2EE) | No (Matching privado interno) | [Ver] |
| Funcionamiento del Servicio Modelo híbrido con chat guiado por IA 24/7 y Sprout Score (gráfico de evolución basado en registros del diario e informes). Ofrece videollamadas estándar e interacciones rápidas (microsesiones) de 15 minutos. Debilidades de la Plataforma Limitada notoriedad de marca en España. Viabilidad comercial de la startup muy comprometida a largo plazo con la comisión del 20% sobre precios de 30€ de sesión. Cero privacidad Zero-Knowledge (datos expuestos en nube clásica). |  |  |  |  |  |  |  |  |  |
| Unobravo / Buencoco | España | Algoritmo psicométrico cerrado | 45 € / sesión individual (50 min) Pareja: 55 €/sesión | 28 € - 32 € brutos por sesión | 29% a 37% comisión de plataforma | No tiene (Solo videollamadas) | Estándar en nube (Base de datos compartida) | No (Asignación algorítmica cerrada) | [Ver] |
| Funcionamiento del Servicio Los pacientes rellenan un cuestionario clínico inicial y el algoritmo propietario les asigna un psicólogo específico. No hay perfiles públicos con estrellas ni libre elección. Debilidades de la Plataforma Desconexión asistencial: carece de soporte o chat interactivo de seguimiento entre sesiones. Rigidez del matching: si falla el terapeuta asignado, el paciente suele abandonar frustrado el servicio. Tarifas que precarizan al terapeuta senior. |  |  |  |  |  |  |  |  |  |
| Therapyside | España | Triaje + chat diario asíncrono | Planes desde 43 € a 49 € / sesión (fact. semanal) | 25 € - 29 € por sesión síncrona | 35% a 48% comisión de plataforma | No tiene (Chat humano complementario) | Estándar en la nube (No E2EE) | No (Asignación por triaje) | [Ver] |
| Funcionamiento del Servicio Matching privado y chat asíncrono diario complementario con el terapeuta dentro de la app móvil. El paciente envía mensajes y el psicólogo responde una o dos veces al día. Debilidades de la Plataforma Burnout profesional: La promesa de chat continuo asíncrono sobrecarga al terapeuta sin retribución justa de ese tiempo. Comisiones abusivas: Incentiva que los terapeutas senior desvíen a los pacientes fuera de la plataforma. |  |  |  |  |  |  |  |  |  |
| Ifeel | España | Triaje semi-manual enfocado a B2B | Suscripción de 100 € a 220 € / mes | 12€-18€/h (chat), 22€-25€ (videollamada) | Comisión muy alta (~50%) | No tiene (Diario y chat humano) | Estándar en la nube | No (Asignación privada) | [Ver] |
| Funcionamiento del Servicio Modelo centrado principalmente en el canal de bienestar corporativo B2B para empleados. Ofrece planes de terapia escrita y videollamadas con asignación semi-manual. Debilidades de la Plataforma Extrema precarización laboral y descontento del colectivo de psicólogos. Cada profesional maneja hasta 60 casos simultáneos, lo que diluye drásticamente la calidad clínica y genera alta rotación. |  |  |  |  |  |  |  |  |  |
| Doctoralia | España | Buscador abierto de perfiles | Libre (fijada por el terapeuta, 50-120€) | 100% de la consulta (Exenta IVA) | Suscripción fija mensual (120 € - 240 €) | No tiene | Estándar (Respuestas públicas sin control) | Sí (Estrellas y comentarios públicos) | [Ver] |
| Funcionamiento del Servicio Marketplace de salud donde el paciente busca libremente por ubicación o síntomas y lee valoraciones por estrellas y testimonios para concertar cita. Debilidades de la Plataforma El sistema de estrellas y valoraciones de curación vulnera el RD 1907/1996 de Publicidad Sanitaria. Alto riesgo de multas de la AEPD a profesionales por responder reseñas desvelando datos médicos. |  |  |  |  |  |  |  |  |  |
| Mundopsicólogos | España | Directorio geolocalizado de leads | Libre (fijada por el psicólogo, 40-80€) | 100% de la consulta | Suscripción mensual por leads (60-180€) | No tiene | Estándar | Sí (Comentarios públicos) | [Ver] |
| Funcionamiento del Servicio El paciente solicita presupuesto y sus datos son enviados a varios psicólogos para que compitan de forma abierta en su bandeja de entrada privada. Debilidades de la Plataforma Genera una subasta destructiva de precios clínicos a la baja. Leads inactivos o falsos por los que el profesional paga igual de su cuota mensual, erosionando la rentabilidad del terapeuta. |  |  |  |  |  |  |  |  |  |
| Psonríe | España | Asistencia inmediata ("Uber" de guardia) | 22 € (20 min) \| 39 € (50 min) | 0,35 € - 0,45 € / minuto (~18-22€/sesión) | Comisión de plataforma del ~50% | No tiene | Estándar | No (Rotativo inmediato) | [Ver] |
| Funcionamiento del Servicio Conexión en directo en menos de 2 minutos por chat, voz o video con el psicólogo de guardia libre en ese momento en la aplicación. Debilidades de la Plataforma Ruptura completa de la alianza terapéutica y el seguimiento continuado al rotar de terapeuta en cada llamada. Atracción de perfiles muy junior debido a las bajas tarifas netas. |  |  |  |  |  |  |  |  |  |
| Somos Estupendas | España | Matching manual por coordinadoras | 42 € / sesión individual de 50 minutos | 22 € - 25 € netos por sesión | ~40% comisión de la plataforma | No tiene | Estándar | No (Asignación privada) | [Ver] |
| Funcionamiento del Servicio Clínica digital especializada en psicología con perspectiva de género. El triaje y matching se realizan de forma manual por psicólogas coordinadoras. Debilidades de la Plataforma Falta de escalabilidad tecnológica debido a la dependencia de coordinadores humanos para cribar y emparejar manualmente, limitando el crecimiento geográfico y aumentando costes fijos. |  |  |  |  |  |  |  |  |  |
| BetterHelp | Global | Matching algorítmico cerrado + chat diario | $280 - $400 / mes (suscripción semanal) | $30 a $70 por hora de videollamada / chat | Comisión alta de plataforma (~50%) | No tiene (Solo chat humano asíncrono) | Estándar (Sancionada por venta de datos ads) | No (Asignación algorítmica) | [Ver] |
| Funcionamiento del Servicio Líder internacional en telepsicología masiva. La suscripción da derecho a chat ilimitado y a una videollamada corta semanal. Debilidades de la Plataforma Multa de 7.8 millones de dólares por la FTC por transferir ilegalmente datos de salud de pacientes a anunciantes (Facebook/Snapchat). Burnout crónico por chat diario ilimitado. |  |  |  |  |  |  |  |  |  |
| Talkspace | Global | Matching algorítmico y seguros médicos | $69 - $129 semanales (fact. mensual) | $20 a $70 por hora de servicio efectivo | Comisión de plataforma alta (~50%) | Asistente de notas clínicas (Smart Notes) | Estándar (HIPAA corporativo) | No (Asignación algorítmica) | [Ver] |
| Funcionamiento del Servicio Plataforma orientada al mercado de seguros corporativos estadounidenses. Posee resúmenes inteligentes e insights de chats para el terapeuta. Debilidades de la Plataforma Sesiones síncronas muy cortas (restringidas a solo 30 minutos) exigidas por aseguradoras para maximizar los márgenes comerciales, mermando el alcance psicoterapéutico. |  |  |  |  |  |  |  |  |  |

| Métrica / Parámetro de Hardware | DeepSeek-R1-Distill-Qwen-70B | Llama 3.3 70B Instruct | Qwen 2.5 72B Instruct | Gemma 2 27B Instruct | GLM-4-9B / GLM-5 |
| --- | --- | --- | --- | --- | --- |
| Cuantización Recomendada | AWQ (4-bit) | AWQ (4-bit) | AWQ (4-bit) | FP8 (8-bit) | FP16 (Nativa) |
| VRAM Modelo (Total) | 38.5 GB | 38.5 GB | 39.5 GB | 28.5 GB | 18.0 GB |
| VRAM Modelo / GPU (TP=2) | 19.25 GB | 19.25 GB | 19.75 GB | 14.25 GB | 9.00 GB |
| VRAM Whisper (Fijo en GPU 0) | 1.50 GB | 1.50 GB | 1.50 GB | 1.50 GB | 1.50 GB |
| Overhead CUDA/vLLM (Total) | 3.00 GB | 3.00 GB | 3.00 GB | 3.00 GB | 3.00 GB |
| VRAM Libre para KV Cache (GPU 0) | 1.75 GB | 1.75 GB | 1.25 GB | 6.75 GB | 12.00 GB |
| Pool Asignable KV Cache (90% GPU 0) | 1.57 GB | 1.57 GB | 1.12 GB | 6.07 GB | 10.80 GB |
| KV Cache FP8 por Token (por GPU) | 80 KB | 80 KB | 80 KB | 184 KB | 10 KB |
| Capacidad de Tokens en Pool | ~19.625 tokens | ~19.625 tokens | ~14.000 tokens | ~33.000 tokens | ~1.080.000 tokens |
| Usuarios Activos en Memoria (4K Context) | 4 | 4 | 3 | 8 | 270 |
| Usuarios Clínicos en Slots de 15 min | 10 | 10 | 7 | 20 | 30 |

| Modelo / Cuantización | 1 Usuario | 2 Usuarios | 4 Usuarios | 8 Usuarios |
| --- | --- | --- | --- | --- |
| Llama 3.3 70B (AWQ) | 26.0 t/s | 18.5 t/s | 12.0 t/s | 7.0 t/s (OOM)* |
| DeepSeek-R1-Distill-Qwen-70B (AWQ) | 24.5 t/s | 17.2 t/s | 11.1 t/s | 6.4 t/s (OOM)* |
| Gemma 2 27B (FP8) | 52.0 t/s | 38.0 t/s | 24.0 t/s | 13.5 t/s |
| GLM-4-9B / GLM-5 (FP16) | 110.0 t/s | 85.0 t/s | 58.0 t/s | 32.0 t/s |

| Modelo de IA | Params | Cuantización | VRAM Estática | VRAM Cache | Usuarios VRAM | Slots 15m | Tokens/s | Calidad Clínica | Coste / M | Soberanía / ENS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DeepSeek-R1 (Qwen-70B) | 70.6B | AWQ (4-bit) | ~19.25GB/GPU | 1.57GB/GPU | 4 act. | 10 u/PC | 46 (75 CoT) | 95 / 100 | 0,18 € | ✓ 100% Soberano (España) |
| Llama 3.3 Instruct (70B) | 70.6B | AWQ (4-bit) | ~19.25GB/GPU | 1.57GB/GPU | 4 act. | 10 u/PC | 48 (80 Spec) | 89 / 100 | 0,18 € | ✓ 100% Soberano (España) |
| Qwen 2.5 Instruct (72B) | 72.7B | AWQ (4-bit) | ~19.75GB/GPU | 1.12GB/GPU | 3 act. | 7 u/PC | 42 (70 Spec) | 86 / 100 | 0,19 € | ✓ 100% Soberano (España) |
| Gemma 2 Instruct (27B) | 27.2B | FP8 (8-bit) | ~14.25GB/GPU | 6.07GB/GPU | 8 act. | 20 u/PC | 72 t/s | 79 / 100 | 0,11 € | ✓ 100% Soberano (España) |
| GLM-4-Chat / GLM-5.1 (9B) | 9.0B | FP16 (Nativa) | ~9.00GB/GPU | 10.8GB/GPU | 270 act. | 30 u/PC | 110 t/s | 74 / 100 | 0,05 € | ✓ 100% Soberano (España) |

| Estrategia | Aislamiento | Coste Operativo | Escalabilidad | Cumplimiento RGPD | Complejidad |
| --- | --- | --- | --- | --- | --- |
| Base de datos separada | Total (físico/lógico) | Alto (N servidores) | Baja (operaciones N instancias) | Maximo | Alta |
| Schema-per-tenant | Lógico (esquemas en misma DB) | Medio (1 cluster, N schemas) | Media (hasta ~5000 tenants) | Alto | Media |
| Row-Level Security (RLS) | Fila (políticas por tenant_id) | Bajo (1 DB, 1 schema) | Alta (millones de filas) | Medio-alto | Baja |

| Tipo de Dato | Schema | Cifrado | RLS | Backup |
| --- | --- | --- | --- | --- |
| Diarios emocionales (chat IA) | Schema tenant | AES-256-GCM + DK | SI | Cifrado en reposo |
| Notas SOAP (validadas psicólogo) | Schema tenant | AES-256-GCM + DK | SI | Backup inmutable WORM |
| Mensajes chat grupal (Duo/Familiar) | Schema tenant | E2EE (clave grupo) | SI | Cifrado, no descifrable |
| Perfil público psicólogo | Schema public | Sin cifrado (datos públicos) | NO | Backup regular |
| Facturación / Stripe | Schema public | Tokenización Stripe | tenant_id | Backup con retención fiscal |
| Logs de auditoría | Schema public | Hash chain inmutable | NO | Append-only WORM |

| Aspecto | REST | GraphQL |
| --- | --- | --- |
| Endpoints | ~80 endpoints | ~15 queries + mutations |
| Caching | Nativo (HTTP cache, CDN) | Complejo (persistir queries) |
| Complejidad server | Baja | Alta (resolvers, dataloaders) |
| Complejidad client | Alta (múltiples requests) | Baja (1 query) |
| Rate limiting | Por endpoint | Por query (cost analysis) |
| Seguridad | Natural (cada endpoint) | Compleja (query depth) |
| Recomendado para | CRUD, auth, subidas | Dashboards dinámicos |

| Rol | Permisos clave |
| --- | --- |
| superadmin | * (sistema, BD, GPU, todos los tenants) |
| admin | Métricas globales, pagos, compliance, suspender psicólogos |
| psychologist | Schema de su tenant: pacientes, sesiones, SOAP, facturación propia |
| patient | Su propio diario, sesiones, progreso. Solo lectura de su psicólogo |
| support | Lectura limitada de logs, tickets, estado del sistema |

| Tipo | Almacenamiento | Cifrado | Retención |
| --- | --- | --- | --- |
| Grabaciones WebRTC | S3-compatible (MinIO) | AES-256-GCM (clave por paciente) | 5 años (Ley 41/2002) |
| Fotos perfil | S3-compatible (MinIO) | Sin cifrar (públicas) | Mientras activo |
| Documentos clínicos | S3-compatible (MinIO) | AES-256-GCM (KEK del paciente) | 5 años post-baja |
| Backups DB | S3 Glacier + MinIO | AES-256 (clave maestra HSM) | 5 años (WORM) |

| Componente | Logs permitidos | Logs prohibidos |
| --- | --- | --- |
| Nginx (reverse proxy) | IP origen, timestamp, endpoint, status code, latency | Request body, response body |
| API Gateway (FastAPI) | ID de request, tenant_id (anonimizado), duración | Prompt, respuesta, contexto clínico |
| vLLM | Número de requests, tokens/s, VRAM usage | Contenido de prompts, respuestas generadas |
| BullMQ (Redis) | Estado de jobs, errores, tiempos de proceso | Payload de jobs (cifrado en Redis) |
| PostgreSQL | Slow queries, conexiones, locks | Contenido BYTEA (cifrado) |
| Application logs (Winston) | IDs, timestamps, errores genéricos | Cualquier dato del paciente |

| Métrica | Valor |
| --- | --- |
| Modelo principal | DeepSeek-R1-Distill-Qwen-70B (AWQ 4-bit) |
| VRAM total | 48 GB (24 GB x 2 GPUs) |
| VRAM modelo | ~38.5 GB (TP=2) |
| KV Cache disponible | ~9.5 GB (FP8 pooled) |
| Slots concurrentes | 10 slots de 15 min por bloque |
| Pacientes activos por servidor | ~100-150 (distribución Poisson) |
| Latencia promedio | ~1.5s (TTFT) |
| Tokens/s agregados | ~45 t/s (DeepSeek-R1), ~75 t/s (con speculative decoding) |
| Cobertura horaria | 08:00-20:00 (chat diurno), 20:00-08:00 (procesamiento batch) |

| Término | Definición |
| --- | --- |
| KEK | Key Encryption Key. Clave maestra del tenant para cifrar datos clínicos. |
| DK | Data Key. Derivada del KEK + salt, usada para cifrar cada mensaje. |
| Argon2id | Función de derivación de clave resistente a ASIC/GPU. |
| WORM | Write Once Read Many. Almacenamiento inmutable para cumplimiento legal. |
| Crypto-shredding | Destrucción de datos mediante eliminación de la clave criptográfica. |
| RLS | Row-Level Security. Políticas de PostgreSQL que filtran filas por tenant. |
| TP | Tensor Parallelism. Divide el modelo entre múltiples GPUs. |
| TTFT | Time To First Token. Latencia hasta el primer token generado. |
| SOAP | Subjetivo, Objetivo, Análisis, Plan. Formato de notas clínicas. |
| Raw-First | Paradigma UX donde los datos crudos se muestran antes que el análisis IA. |

| Escenario | Accion |
| --- | --- |
| Token expirado | Mostrar "Enlace expirado. Solicita nueva invitacion a tu psicologo." |
| Token reutilizado | Detectar por jti_hash UNIQUE, mostrar "Este enlace ya fue usado." |
| Email ya registrado | Redirigir a login con mensaje: "Ya tienes cuenta. Inicia sesion." |
| Token revocado por psicologo | CRUD en panel: "Invitacion cancelada." |
| Intento de escalado de privilegios | El JWT lleva purpose: 'patient_invite' , validado en middleware |
| Multiple invitaciones mismo email | Solo el ultimo token activo es valido; previos se marcan revoked |
| Enlace abierto en dispositivo no seguro | Mostrar advertencia de seguridad antes del formulario |

| Escenario | Accion |
| --- | --- |
| QR en foto en redes sociales | Inutil tras 5 min por ventana temporal |
| Paciente escanea desde otra ciudad | Normal, el QR vincula al psicologo, no geolocaliza |
| Pantalla del psicologo compartida en Zoom | Misma proteccion: temporal + HMAC |
| Ataque de repeticion (replay) | Nonce + timestamp unicos; HMAC invalido tras ventana |
| Psicologo cierra sesion sin limpiar QR | QR se invalida al marcar qr_active como null en Redis |
| Paciente escanea pero no completa registro | No hay impacto; QR expira en 5 min igualmente |

| Escenario | Accion |
| --- | --- |
| CSV con caracteres especiales (acentos, enees) | Detectar encoding y forzar UTF-8 |
| Archivo .xlsx corrupto | Capturar exception y pedir re-subida |
| 500 filas, 400 emails invalidos | Mostrar preview: "Solo 100 validos. ?Confirmar?" |
| Un email aparece 10 veces en el CSV | Enviar una sola invitacion, notificar duplicados |
| Lote parcialmente enviado y servidor cae | BullMQ retry con backoff exponencial |
| Psicologo cancela importacion a medio proceso | BullMQ: eliminar trabajos pendientes de ese batchId |
| Email invalido (sin @) | Marcar fila como error, continuar con las demas |

| Escenario | Accion |
| --- | --- |
| Slug ya ocupado | Sugerir alternativas: dr-garcia-1, dr-garcia-madrid |
| Psicologo desactiva perfil | Redirigir a 410 Gone con mensaje |
| Paciente se registra pero psicologo no acepta | Estado "pendiente de aprobacion" en panel |
| Spam bots atacan formulario | Turnstile + rate limiting + honeypot |
| Psicologo cambia slug | 301 redirect del antiguo al nuevo + notificar pacientes |
| Enlace indexado en Google por error | Meta noindex en perfiles no activados |
| Paciente ya existente intenta registrarse de nuevo | Email ya registrado -> mostrar login con recordatorio |
| Psicologo elimina su cuenta | Perfil publico se desactiva inmediatamente |

| Escenario | Accion |
| --- | --- |
| API Key robada | Rotar inmediatamente desde panel; notificar a clinica |
| Clinica envia datos duplicados | Idempotency key en header Idempotency-Key: UUID |
| Rate limit excedido | HTTP 429 + header Retry-After |
| Clinica desea webhook de confirmacion | Configurar webhook URL: POST /api/v1/integrations/webhook |
| Paciente invitado por API que ya existe | Devolver error 409 Conflict con detalle |
| Integracion con EHR extranjero (HIPAA) | Endpoint dedicado con firma adicional FHIR |
| Timeout de respuesta >30s | Procesamiento asincrono con polling de estado |

| Formato | Proposito | Contenido | Tamano tipico | Cifrado |
| --- | --- | --- | --- | --- |
| JSON (.ancora) | Completo, portable, reimportable | Historia clinica COMPLETA | 50KB - 5MB | Clave paciente (AES-256-GCM) |
| PDF | Resumen ejecutivo psicologo-paciente | Datos principales, graficos, cronologia | 10-30 paginas | Sin cifrar (visible para paciente) |
| Markdown | Importable a Obsidian/Notion | Estructura completa en texto plano | 30KB - 1MB | Sin cifrar (descarga voluntaria) |

| Feature | Descripción | Valor percibido |
| --- | --- | --- |
| Historia psicológica portable | Perfil vital cronológico: eventos, patrones, detonantes, relaciones, hipótesis, objetivos, avances. Reutilizable con cualquier psicólogo en la plataforma. | Moat principal. Rompe la pérdida de contexto al cambiar de terapeuta. |
| Diario IA | Chat guiado diario (15 min/día) con IA local (DeepSeek-R1-70B / GLM-5.1). Identifica patrones, distorsiones cognitivas, temas recurrentes. | Acompañamiento continuo entre sesiones. |
| Chat IA | 15 minutos diarios acumulables. Respuesta en <1.5s TTFT. Procesamiento 100% local en servidor propio. | Sin dependencia de APIs externas. Privacidad total. |
| Estadísticas de progreso | Gráficos de evolución emocional, adherencia, temas trabajados, hitos alcanzados. | Visibilidad del avance terapéutico. |
| Exportación | Descarga cifrada del historial completo en formato interoperable (JSON estructurado + PDF resumen). | Portabilidad real. El paciente es dueño de sus datos. |

| Competidor | Precio | Qué incluye | Diferencia con Ancora |
| --- | --- | --- | --- |
| Unobravo | 45 EUR/sesión (50 min) | Solo videollamada. Sin seguimiento entre sesiones. | Ancora ofrece seguimiento diario IA + historia estructurada por menos precio mensual. |
| Therapyside | 43-49 EUR/semana (172-196 EUR/mes) | Chat asíncrono + 1 sesión/semana. | Ancora separa SaaS (29-39 EUR) de la sesión con psicólogo (50-80 EUR). Total inferior. |
| ifeel | 30 EUR/semana (120 EUR/mes) chat | Chat con terapeuta humano (quemado). | Ancora descarga el chat diario en IA local; el psicólogo solo revisa. |
| BetterHelp | $280-400/mes | Chat ilimitado + 1 sesión/semana. | Ancora ofrece privacidad real (servidor local, no nube USA) a fracción del precio. |
| Talkspace | $69-129/semana ($276-516/mes) | Mensajería + sesiones cortas. | Ancora es 5-10x más barato con mejor privacidad y misma estructura. |

| Concepto | Valor real | Margen plataforma |
| --- | --- | --- |
| Triaje IA (PHQ-9 + GAD-7 automatizados) | 15 EUR (coste inferencia + análisis) | --- |
| Primera sesión (1h) con psicólogo asignado | 50-80 EUR (honorarios psicólogo) | --- |
| 1 semana de diario IA + historial estructurado | 7 EUR (coste inferencia 7 días) | --- |
| Total valor real | 72-102 EUR | --- |
| Precio promocional | 49 EUR | --- |
| Subvención plataforma | 23-53 EUR absorbidos | Captación de usuario + activación |

| Feature | Gratuito | Básico (29 EUR/mes) | Pro (69 EUR/mes) | Enterprise (personalizado) |
| --- | --- | --- | --- | --- |
| Límite pacientes activos | Hasta 5 | Hasta 20 | Ilimitados | Ilimitados |
| Panel clínico (Clinical Dashboard) | Básico | Completo | Completo + avanzado | Personalizado |
| Diario IA del paciente (lectura) | SI | SI | SI | SI |
| Estadísticas de progreso por paciente | NO | SI (básicas) | SI (avanzadas + gráficos) | SI + informes exportables |
| Smart SOAP automático | NO | SI (generación automática) | SI (avanzado + edición) | SI + API para HIS |
| Video-briefing con teleprompter | NO | SI | SI + editor | SI + white-label |
| Matching con pacientes | Manual (solo invitados) | Algoritmo básico | Prioridad en matching | Matching dedicado |
| Facturación automatizada | NO (manual) | SI (Stripe Connect) | SI + informes fiscales | SI + API contable |
| Exportación de datos clínicos | NO | NO | SI (JSON, PDF, FHIR básico) | SI + integración EHR |
| API de acceso | NO | NO | NO | SI |
| Multi-psicólogo (clínicas) | NO | NO | NO | SI (hasta 20+ perfiles) |
| White-label parcial | NO | NO | NO | SI (logo propio, dominio) |
| Soporte | Email (72h) | Chat (24h) | Prioridad (4h) | Dedicado (SLA 1h) |

| Situación | Retención IRPF | Base legal |
| --- | --- | --- |
| Psicólogo autónomo (persona física) | 15% (primer año: 7%) | Art. 101 LIRPF, RD 439/2007 |
| Psicólogo profesional (actividad económica) | 15% | Art. 95 RIRPF |
| Clínica/empresa (sociedad) | No aplica retención | --- |

| Concepto | Valor |
| --- | --- |
| Cuota mensual SaaS | 35.09 EUR (IVA incl.) |
| Umbral 347 | 3.005,06 EUR anuales |
| Equivale a | ~86 meses de suscripción (7+ años) |
| Conclusión | Un paciente individual NO alcanza el umbral 347. Solo pacientes con múltiples servicios que sumen > 3.005 EUR. |

| Concepto | Valor |
| --- | --- |
| Pago medio mensual a psicólogo | 50-500 EUR |
| Umbral 347 | 3.005,06 EUR anuales |
| Equivale a | 60-600 EUR/mes durante 12 meses |
| Conclusión | Si un psicólogo recibe > 3.005 EUR/año, Ancora debe incluirle en el 347. Psicólogos a tiempo parcial pueden no alcanzarlo. |

| Modelo | Periodicidad | Qué declara |
| --- | --- | --- |
| 303 | Trimestral | IVA repercutido (SaaS 21%) - IVA soportado (gastos) |
| 111 | Trimestral | IRPF retenido a psicólogos (si aplica) |
| 190 | Anual | Resumen retenciones IRPF (si aplica) |
| 347 | Anual | Operaciones con psicólogos > 3.005 EUR/año |
| 349 | Trimestral | Operaciones intracomunitarias (si aplica) |
| 200 | Anual | Impuesto de Sociedades |

| Plan | Precio | Coste directo | Margen bruto | % Margen |
| --- | --- | --- | --- | --- |
| Gratuito | 0 EUR | 0,50 EUR/mes (ancho de banda + storage) | -0,50 EUR | N/A |
| Básico | 29 EUR | 1,50 EUR (IA + storage + ancho de banda) | 27,50 EUR | 94,8% |
| Pro | 69 EUR | 3,00 EUR (IA intensiva + storage + prioridad) | 66,00 EUR | 95,7% |
| Enterprise | 199 EUR base | 10 EUR (infraestructura dedicada) | 189 EUR+ | 95%+ |

| Categoría | Cantidad | Precio medio | Ingreso mensual | % del total |
| --- | --- | --- | --- | --- |
| Psicólogos |  |  |  |  |
| Gratuito | 50 | 0 EUR | 0 EUR | 0% |
| Básico | 30 | 29 EUR | 870 EUR | 4.2% |
| Pro | 15 | 69 EUR | 1.035 EUR | 5.0% |
| Enterprise | 5 | 299 EUR | 1.495 EUR | 7.2% |
| Subtotal psicólogos | 100 |  | 3.400 EUR | 16.4% |
|  |  |  |  |  |
| Pacientes |  |  |  |  |
| SaaS básico | 200 | 29 EUR | 5.800 EUR | 28.0% |
| SaaS estándar | 100 | 39 EUR | 3.900 EUR | 18.8% |
| Subtotal SaaS pacientes | 300 |  | 9.700 EUR | 46.8% |
|  |  |  |  |  |
| Onboarding | 50 nuevos/mes | 49 EUR | 2.450 EUR | 11.8% |
| Créditos extra | 30 packs/mes | 15 EUR | 450 EUR | 2.2% |
| Subtotal transaccional |  |  | 2.900 EUR | 14.0% |
|  |  |  |  |  |
| Total ingresos recurrentes |  |  | 13.100 EUR/mes |  |
| Total ingresos totales |  |  | 16.000 EUR/mes | 100% |

| Parámetro | Valor |
| --- | --- |
| Cuota mensual media | 32 EUR (mix 29+39) |
| Churn mensual estimado | 8% |
| Vida media (1/churn) | 12.5 meses |
| LTV bruto | 400 EUR |
| Coste adquisición (CAC) | 5 EUR (invitación del psicólogo) |
| LTV neto | 395 EUR |
| Ratio LTV/CAC | 79x |

| Parámetro | Valor optimista | Valor pesimista |
| --- | --- | --- |
| Cuota mensual media | 32 EUR | 32 EUR |
| Churn mensual | 15% | 25% |
| Vida media | 6.7 meses | 4 meses |
| LTV bruto | 214 EUR | 128 EUR |
| CAC (ads + contenido) | 80 EUR | 120 EUR |
| LTV neto | 134 EUR | 8 EUR |
| Ratio LTV/CAC | 2.7x | 0.07x |

| Canal | CAC estimado | Conversión a pago | Escalabilidad | Prioridad |
| --- | --- | --- | --- | --- |
| Psicólogo invita a paciente | 5 EUR | Alta (>60%) | Alta (efecto red) | 1 |
| B2B2C (psiquiatras derivan) | 25 EUR | Media (40%) | Media (relacional) | 2 |
| SEO (contenido terapéutico) | 40 EUR | Media (30%) | Alta (largo plazo) | 3 |
| LinkedIn Ads (profesionales) | 60 EUR | Media (25%) | Media | 4 |
| Meta/Google Ads (frío) | 100-120 EUR | Baja (<10%) | Alta (caro) | 5 |
| TikTok / redes sociales | 80 EUR | Muy baja (<5%) | Alta (volátil) | 6 |

| Métrica | Mes 1 | Mes 6 | Mes 12 | Mes 24 |
| --- | --- | --- | --- | --- |
| Psicólogos activos | 10 | 50 | 120 | 350 |
| Psicólogos de pago | 2 | 15 | 45 | 150 |
| Pacientes SaaS | 20 | 120 | 350 | 1.200 |
| Nuevos pacientes/mes | 20 | 40 | 60 | 120 |
|  |  |  |  |  |
| Ingresos mensuales |  |  |  |  |
| SaaS psicólogos | 58 EUR | 540 EUR | 1.890 EUR | 7.350 EUR |
| SaaS pacientes | 580 EUR | 3.480 EUR | 10.150 EUR | 34.800 EUR |
| Onboarding | 980 EUR | 1.960 EUR | 2.940 EUR | 5.880 EUR |
| Créditos extra | 0 EUR | 180 EUR | 525 EUR | 1.800 EUR |
| Total ingresos | 1.618 EUR | 6.160 EUR | 15.505 EUR | 49.830 EUR |
|  |  |  |  |  |
| Costes |  |  |  |  |
| Infraestructura GPU | 545 EUR | 545 EUR | 1.090 EUR | 2.180 EUR |
| Stripe fees (~2%) | 32 EUR | 123 EUR | 310 EUR | 997 EUR |
| Hosting + storage | 100 EUR | 200 EUR | 400 EUR | 800 EUR |
| Marketing | 300 EUR | 1.000 EUR | 2.000 EUR | 4.000 EUR |
| Soporte + compliance | 500 EUR | 1.000 EUR | 2.000 EUR | 4.000 EUR |
| Total costes | 1.477 EUR | 2.868 EUR | 5.800 EUR | 11.977 EUR |
|  |  |  |  |  |
| Resultado |  |  |  |  |
| Ingresos totales | 1.618 EUR | 6.160 EUR | 15.505 EUR | 49.830 EUR |
| Costes totales | 1.477 EUR | 2.868 EUR | 5.800 EUR | 11.977 EUR |
| Margen neto | 141 EUR | 3.292 EUR | 9.705 EUR | 37.853 EUR |
| Margen % | 8.7% | 53.4% | 62.6% | 76.0% |

| Nº pacientes | Estado | Acción del sistema |
| --- | --- | --- |
| 1-4 | Normal | Sin restricciones |
| 5 | Último gratuito | Notificación: "Has llegado al límite. Actualiza para seguir creciendo." |
| 5+ | Bloqueado | No se puede añadir paciente nº6 hasta actualizar a plan de pago. |

| Concepto | Precio | Periodicidad | Observaciones |
| --- | --- | --- | --- |
| Onboarding (triaje + 1h sesión) | 49 EUR (promo) | Único | Valor real: 72-102 EUR. Subvencionado por plataforma. |
|  | 99 EUR (estándar) | Único | Precio real sin promoción. |
| SaaS paciente básico | 29 EUR/mes | Mensual | Funciones esenciales (historial + diario 15 min/día + chat) |
| SaaS paciente estándar | 39 EUR/mes | Mensual | + estadísticas avanzadas + exportación + prioridad en chat |

| Pack | Precio | Incluye | Coste/hora GPU | Margen plataforma |
| --- | --- | --- | --- | --- |
| Chat Extra Básico | 9 EUR | +5 horas chat IA (30 min extra/día) | 1,80 EUR/hora | 73% |
| Chat Extra Intensivo | 25 EUR | +20 horas chat IA (2h extra/día) | 1,25 EUR/hora | 81% |
| Revisión Premium | 15 EUR | 1 revisión extra de psicólogo (urgente, 24h) | N/A (pago a psicólogo) | Variable |
| Pack Exportación Avanzada | 5 EUR | Exportación FHIR + JSON completo + informe PDF personalizado | 0,50 EUR | 90% |
