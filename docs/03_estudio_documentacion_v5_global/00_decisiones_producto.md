# 00 · Decisiones de producto y arquitectura

## 1. Decisión central

Áncora debe diseñarse como una **plataforma de continuidad terapéutica con IA supervisada y memoria clínica persistente**, no como un chatbot psicológico ni como un marketplace con IA añadida.

La IA existe para organizar, resumir, extraer, recordar, estructurar, preparar y alertar.  
La IA no diagnostica, no prescribe y no sustituye al psicólogo.

## 2. Resultado esperado

El sistema debe permitir que un psicólogo abra un paciente y, en aproximadamente dos minutos, pueda entender:

- qué ha ocurrido desde la última sesión;
- qué temas se han repetido;
- qué emociones, síntomas o riesgos aparecen;
- qué documentos nuevos han cambiado la ficha;
- qué contradicciones o lagunas hay;
- qué tareas están pendientes;
- qué citas literales merecen atención;
- qué debería revisar antes de la sesión;
- qué borrador SOAP o briefing propone el sistema;
- qué datos están validados, documentados, declarados o inferidos.

## 3. Prioridad real

La prioridad no debe repartirse de forma uniforme. El core se ordena así:

1. **RAG, contexto y análisis de datos clínicos.**
2. **Extracción estructurada desde archivos.**
3. **Extracción estructurada desde chats/conversaciones.**
4. **Memoria tipo Hermes adaptada a salud mental.**
5. **Patient 360 para psicólogo.**
6. **Dashboard cómodo, rápido y accionable.**

Marketplace, landing, pricing, planes comerciales, reseñas y hardware son importantes, pero son secundarios respecto al sistema clínico-inteligente.

## 4. Frase de visión

> Terapia accesible, guiada y con memoria persistente.

## 5. Diferenciador principal

Áncora combina:

- privacidad fuerte;
- memoria persistente;
- elección de psicólogo y horario;
- organización automática de la historia del paciente;
- preparación clínica eficiente para el profesional.

## 6. Error que no se debe cometer

El error más grave sería vender o construir una “IA psicóloga”.

Áncora puede tener una IA empática, asertiva y compasiva, pero debe estar formulada como:

- asistente de continuidad;
- organizador de memoria;
- copiloto clínico;
- herramienta de preparación;
- motor de análisis supervisado.

No como terapeuta autónoma.

## 7. Qué debe sentir el paciente

El paciente debe sentir:

- que Áncora recuerda lo importante;
- que no tiene que repetir su historia desde cero;
- que sus documentos y conversaciones se ordenan;
- que puede rectificar y validar información;
- que la IA entiende el contexto sin inventar;
- que su psicólogo llega mejor preparado;
- que la privacidad está cuidada.

## 8. Qué debe sentir el psicólogo

El psicólogo debe sentir:

- que todos sus pacientes están organizados;
- que puede revisar cada caso en dos minutos;
- que puede profundizar cuando quiera;
- que no depende de resúmenes opacos;
- que ve citas literales y fuentes;
- que la IA le ahorra burocracia;
- que cobra más por menos tiempo administrativo;
- que mantiene el control clínico.

## 9. Diseño de autoridad de datos

Hay que separar dos conceptos:

### 9.1 Orden operativo de procesamiento

1. La IA procesa archivos y chats.
2. El paciente puede confirmar o rectificar datos personales/declarativos.
3. El psicólogo valida análisis clínico, interpretación, riesgos y acciones.
4. El sistema consolida memoria y Patient 360.

### 9.2 Jerarquía clínica de autoridad

Para tomar decisiones clínicas, el orden debe ser:

1. **Validado por psicólogo.**
2. **Documentado por archivo.**
3. **Declarado o confirmado por paciente.**
4. **Inferido por IA.**

La IA nunca debe sobrescribir datos validados.  
Las inferencias IA deben aparecer como “observación”, “patrón posible” o “pendiente de validación”.

## 10. Criterio editorial del paquete

Esta documentación no se limita a ordenar documentos previos. Propone la mejor versión posible aunque contradiga, priorice o descarte ideas anteriores.

Reglas editoriales:

- priorizar seguridad clínica sobre espectacularidad IA;
- priorizar memoria estructurada sobre prompts largos;
- priorizar trazabilidad sobre resúmenes bonitos;
- priorizar utilidad del psicólogo sobre exceso de pantallas;
- priorizar arquitectura mantenible sobre multiagentes innecesarios;
- priorizar privacidad y consentimiento desde el diseño.

## 11. Qué queda secundario

Se documenta, pero no debe distraer al equipo inicial:

- voz en tiempo real;
- hardware doméstico;
- wearables;
- app nativa completa;
- reseñas/estrellas;
- marketplace abierto;
- pricing detallado;
- landing premium;
- APIs externas como dependencia estructural.

La arquitectura debe admitir estas piezas, pero el primer producto defendible es el motor clínico-inteligente.

## 10. Decisión añadida en v2 · La web debe explicar la intención, no solo enseñar pantallas

La web pública y la app deben construirse alrededor de una idea central:

> Áncora hace que la terapia tenga memoria.

Esto implica que la landing, marketplace, onboarding, app de paciente y panel del psicólogo deben estar conectados por un relato único:

1. el paciente vive cosas entre sesiones;
2. Áncora permite registrarlas y subir documentos;
3. la IA estructura datos con límites clínicos;
4. el paciente puede revisar y rectificar;
5. el psicólogo valida y usa el contexto;
6. la siguiente sesión parte de una historia mejor organizada.

La versión web actual, aunque tenga muchas pantallas, debe corregirse si no comunica este hilo. No basta con mostrar chat, dashboard, planes y perfiles: cada pantalla debe alimentar la memoria clínica viva o facilitar una decisión real.

## 11. Nueva prioridad de documentación

Además del core IA/memoria, la documentación debe cubrir:

- intención de la web;
- mapa end-to-end;
- narrativa pública;
- copy seguro;
- componentes frontend;
- auditoría de demo actual;
- requisitos para rehacer el repositorio.
