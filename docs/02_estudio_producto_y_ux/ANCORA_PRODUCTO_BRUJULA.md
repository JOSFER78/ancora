# Áncora - Brújula de Producto

**Meta, intención y principios para construir un sistema único de memoria, análisis y seguimiento psicológico asistido por IA**

**Estado del documento:** brújula de producto, no especificación cerrada.  
**Uso previsto:** orientar a desarrollo, diseño, IA y producto antes de decidir pantallas o arquitectura final.  
**Fuentes antiguas de referencia:** ver sección 14.

---

## 0. Cómo debe usarse este documento

Este documento no es una lista rígida de pantallas. No debe entenderse como: “construye exactamente esto”.

Debe entenderse como una brújula:

> Áncora debe buscar la mejor forma posible de conseguir una meta: crear un sistema único de memoria, análisis y seguimiento psicológico que ayude al paciente a organizar su historia y al psicólogo a entender mejor cada caso, ahorrar tiempo y no perder información importante.

Cuando el equipo o una IA programadora vaya a construir una funcionalidad, primero debe leer esta brújula y responder:

1. Qué objetivo de producto resuelve.
2. Qué alternativas de interfaz o arquitectura existen.
3. Qué solución propone y por qué.
4. Qué riesgos tiene.
5. Qué datos necesita.
6. Qué queda abierto para mejorar.

Después se implementa. No antes.

---

## 1. Indicaciones breves del fundador

El fundador quiere que Áncora sea algo distinto a una web de citas, un chatbot o una plataforma de telepsicología normal.

Las ideas principales que no deben perderse son:

- Crear una **memoria persistente y mejorable** de la historia del paciente.
- Recoger datos desde documentos, audios, informes, conversaciones, sesiones y tareas.
- Construir una **historia vital, clínica y terapéutica estructurada**.
- Crear un **Árbol de Vida** o sistema similar que represente vivencias, familia, relaciones, lugares, trabajo, etapas y eventos importantes.
- Crear una **línea de tiempo** con los hechos que han marcado al paciente y por qué.
- Permitir que el paciente corrija datos con lenguaje natural, por texto o voz.
- Separar claramente **dato**, **análisis IA** y **criterio clínico del psicólogo**.
- Dar al psicólogo una plataforma donde gestione toda su cartera de pacientes de forma sencilla.
- Conseguir que el psicólogo sienta que Áncora le ahorra mucho tiempo y le ayuda como un asistente senior.
- No imponer un panel cerrado: buscar la mejor interfaz posible para conseguir esta meta.

---

## 2. Meta principal de Áncora

Áncora debe intentar ser el sistema más avanzado, claro y útil del mercado para organizar la historia psicológica de una persona y ayudar a su psicólogo a entenderla mejor, más rápido y con menos pérdida de información.

No debe construirse como:

- una web de citas;
- un chatbot terapéutico;
- un dashboard de gráficos;
- una ficha clínica plana;
- una app de productividad;
- un marketplace de psicólogos con IA añadida.

Debe construirse como:

> Un sistema operativo del seguimiento psicológico: una memoria viva que organiza la historia del paciente, detecta patrones, ayuda al paciente a entender su evolución y permite al psicólogo llegar a cada sesión con contexto claro, sin sustituir nunca su criterio profesional.

---

## 3. Principio diferencial

El gran diferencial de Áncora es el **control inteligente de datos para seguimiento psicológico**.

El sistema debe recoger información de muchas fuentes:

- documentos;
- informes psicológicos;
- informes médicos;
- audios;
- notas de voz;
- chats;
- sesiones;
- ejercicios;
- comentarios del psicólogo;
- cambios semanales;
- eventos vitales;
- medicación declarada o documentada;
- relaciones familiares, laborales y personales;
- lugares donde ha vivido;
- momentos importantes de su vida.

Después debe estructurar esa información de forma útil.

No basta con almacenar documentos.  
No basta con resumir chats.  
No basta con generar notas SOAP.

Áncora debe construir una visión organizada y evolutiva de la persona.

---

## 4. Separación crítica: dato, análisis IA y criterio clínico

Este es uno de los retos centrales del producto.

Áncora debe diferenciar siempre entre tres capas.

### 4.1 Dato registrado

Es información que existe en una fuente.

Ejemplos:

- “El paciente dijo que vivió en Valencia entre 2018 y 2021.”
- “En el informe aparece tratamiento con X medicación.”
- “En el audio menciona una ruptura en 2020.”
- “En el chat de esta semana habló tres veces de ansiedad laboral.”

Esto no es un diagnóstico de la IA.  
Es información extraída de una fuente.

El paciente puede corregirla si está mal.

### 4.2 Análisis automático de datos

Es lo que la IA observa al analizar patrones.

Ejemplos:

- “El tema trabajo aparece de forma recurrente las últimas tres semanas.”
- “La intensidad emocional declarada aumenta los domingos.”
- “Hay contradicción entre ‘estoy mejor’ y aumento de insomnio registrado.”
- “Esta frase se repite con variaciones en varias conversaciones.”

Esto no es criterio clínico final.  
Es análisis de datos para ayudar al psicólogo.

### 4.3 Criterio clínico del psicólogo

Es lo que solo puede establecer el profesional.

Ejemplos:

- diagnóstico;
- hipótesis clínica;
- formulación del caso;
- plan terapéutico;
- pautas;
- ejercicios;
- prioridades de sesión;
- evaluación de riesgo;
- conclusiones profesionales.

Cuando el psicólogo habla en sesión, valida una nota, asigna ejercicios o establece una hipótesis, eso debe guardarse como información clínica profesional de mayor autoridad.

---

## 5. Árbol de Vida Terapéutico

Una pieza central de Áncora debería ser el **Árbol de Vida Terapéutico**.

No debe ser solo una línea temporal. Debe ser una forma de representar la vida de la persona como un mapa psicológico.

Puede organizarse por ramas:

- familia;
- infancia;
- lugares donde ha vivido;
- estudios;
- trabajo;
- relaciones de pareja;
- amistades;
- salud física;
- salud mental;
- duelos;
- rupturas;
- logros;
- crisis;
- cambios importantes;
- hábitos;
- autoestima;
- vínculos significativos;
- proyectos de vida.

Cada nodo del árbol debería poder tener:

- descripción;
- fecha aproximada o exacta;
- fuente;
- citas literales;
- impacto emocional;
- relación con otros eventos;
- si fue dicho por el paciente, extraído de documento o indicado por psicólogo;
- notas del paciente;
- notas del psicólogo;
- evolución posterior.

El equipo no debe implementar automáticamente un árbol visual clásico si no es lo mejor. Debe estudiar si conviene un árbol, un grafo, una red de relaciones, una línea temporal enriquecida o una mezcla.

La pregunta correcta es:

> ¿Cuál es la forma más clara de representar la vida psicológica de una persona para que paciente y psicólogo la entiendan y la usen?

---

## 6. Línea de Tiempo Vital y Terapéutica

Además del Árbol de Vida, Áncora necesita un eje cronológico.

Debe mostrar:

- eventos vitales importantes;
- inicios y finales de etapas;
- mudanzas;
- relaciones;
- trabajos;
- crisis;
- tratamientos;
- sesiones relevantes;
- cambios de medicación declarados o documentados;
- avances;
- retrocesos;
- ejercicios asignados;
- revisiones del psicólogo;
- frases clave.

Cada evento debe responder:

- qué pasó;
- cuándo pasó;
- por qué fue importante;
- cómo impactó;
- de dónde sale el dato;
- si está corregido por el paciente;
- si tiene comentario del psicólogo;
- qué relación tiene con la terapia actual.

---

## 7. Panel del paciente

El paciente debe tener una experiencia sencilla, humana y útil.

No debe sentirse dentro de una historia clínica fría.

Debe poder ver, como mínimo, estas zonas funcionales.

### 7.1 Hoy

Debe responder:

- cómo estoy;
- qué tengo pendiente;
- próxima sesión;
- tarea o pauta actual;
- mensaje reciente del psicólogo;
- acceso al chat o diario.

### 7.2 Esta semana

Debe responder:

- de qué he hablado con la IA;
- qué temas se han repetido;
- qué emociones han aparecido;
- qué se ha consolidado;
- qué debo revisar;
- qué ha dicho el psicólogo;
- qué ejercicios tengo.

### 7.3 Mi historia

Debe contener:

- Árbol de Vida;
- línea de tiempo;
- documentos subidos;
- datos extraídos;
- datos corregibles;
- eventos importantes;
- evolución;
- sesiones;
- tareas;
- pautas del psicólogo.

### 7.4 Editar mi historia

El paciente debe poder corregir información con lenguaje natural.

Ejemplos:

- “Eso no pasó en 2020, fue en 2021.”
- “No era mi pareja, era una amiga.”
- “Ese medicamento ya no lo tomo.”
- “Ese evento no fue importante para mí.”
- “Añade que viví en Sevilla dos años.”

Esto puede hacerse por texto o voz.

La IA debe entender la corrección, actualizar el dato, conservar histórico de cambios y registrar la fuente de la corrección.

---

## 8. Panel del psicólogo

El psicólogo debe sentir que Áncora le ahorra muchísimo tiempo.

No debe abrir la ficha de un paciente y encontrarse con ruido.

Debe tener dos niveles: cartera y paciente.

### 8.1 Cartera de pacientes

Debe mostrar:

- pacientes activos;
- quién necesita revisión;
- quién tiene alertas;
- quién tiene sesión próxima;
- quién no ha usado la app;
- quién ha empeorado o cambiado significativamente;
- quién tiene ejercicios pendientes;
- quién tiene documentos nuevos;
- ingresos o actividad, si aplica.

Objetivo:

> Que el psicólogo sepa en 30 segundos dónde poner atención.

### 8.2 Paciente 360

Debe permitir entender un paciente en capas.

#### Capa 1 - Resumen de 2 minutos

- estado actual;
- cambios desde última sesión;
- temas principales de la semana;
- riesgos;
- tareas pendientes;
- frases clave;
- foco posible de sesión.

#### Capa 2 - Evidencias

- citas literales;
- check-ins;
- documentos;
- eventos;
- extractos de chats;
- datos corregidos por paciente;
- comparación con semanas anteriores.

#### Capa 3 - Análisis automático de datos

- patrones;
- tendencias;
- contradicciones;
- temas emergentes;
- evolución emocional;
- adherencia;
- posibles gaps;
- preguntas sugeridas.

#### Capa 4 - Criterio del psicólogo

- hipótesis clínica;
- formulación;
- objetivos;
- pautas;
- ejercicios;
- notas SOAP;
- decisiones de plan;
- resumen para el paciente.

El psicólogo debe poder aceptar, ignorar, editar o convertir análisis IA en nota profesional cuando lo considere oportuno.

---

## 9. Semana Terapéutica

Una pantalla o módulo clave debe ser la **Semana Terapéutica**.

Debe responder:

- qué ha pasado esta semana;
- qué ha contado el paciente;
- qué ha detectado la IA como patrón;
- qué frases son importantes;
- qué tareas hizo o no hizo;
- qué ha cambiado desde la semana pasada;
- qué debería mirar el psicólogo antes de la sesión;
- qué se ha consolidado como dato;
- qué queda pendiente.

Este módulo probablemente será una de las razones por las que el psicólogo sienta que la cuota mensual está justificada.

---

## 10. Motor inteligente de Áncora

El motor de Áncora debe trabajar con recursos de IA modernos, pero sin convertir la IA en terapeuta.

Debe usar:

- memoria persistente;
- RAG;
- context harness;
- prompting versionado;
- extracción estructurada;
- análisis asíncrono;
- loops de consolidación;
- resúmenes diarios y semanales;
- detección de patrones;
- citas literales;
- edición natural;
- trazabilidad de fuentes.

El motor tiene cuatro trabajos principales:

### 10.1 Extraer

Convertir archivos, audios, chats y sesiones en datos estructurados.

### 10.2 Ordenar

Colocar cada dato en su sitio: árbol, timeline, antecedentes, documentos, tareas, objetivos, sesiones, citas, medicación, riesgos.

### 10.3 Analizar

Detectar patrones, cambios, contradicciones, frases clave, evolución y señales de riesgo.

### 10.4 Preparar

Crear vistas útiles para paciente y psicólogo: semana terapéutica, Paciente 360, briefing, resumen post-sesión, borrador SOAP y plan de tareas.

---

## 11. Qué debe sentir cada usuario

### 11.1 Paciente

Debe sentir:

- “Mi historia está ordenada.”
- “No tengo que repetirlo todo.”
- “Puedo corregir lo que esté mal.”
- “Veo lo que tengo pendiente.”
- “Mi psicólogo llega mejor preparado.”
- “La IA me acompaña, pero mi proceso sigue siendo humano.”
- “Entiendo mejor mi evolución.”

### 11.2 Psicólogo

Debe sentir:

- “Tengo todos mis pacientes organizados.”
- “No se me olvidan cosas importantes.”
- “Puedo preparar una sesión en 2 minutos.”
- “La IA me trae frases y datos que yo no habría tenido tiempo de revisar.”
- “Me ayuda como un asistente senior, pero no decide por mí.”
- “Me permite atender mejor y ahorrar burocracia.”
- “La cuota mensual está más que pagada por el tiempo que me ahorra.”

---

## 12. Lo que no debe pasar

Áncora no debe convertirse en:

- un chatbot terapéutico autónomo;
- una web de citas más;
- una ficha clínica fría;
- un panel lleno de gráficas inútiles;
- una colección de resúmenes sin evidencia;
- un sistema donde todo lo generado por IA parezca diagnóstico;
- un producto donde el psicólogo tenga que revisar más trabajo del que se ahorra;
- una implementación cerrada que copie pantallas antiguas aunque no sean la mejor solución.

---

## 13. Cómo debe trabajar el equipo de desarrollo o una IA programadora

Antes de implementar cualquier módulo, el equipo debe seguir este protocolo:

1. Leer esta brújula.
2. Identificar qué objetivo de producto se intenta resolver.
3. Proponer 2 o 3 alternativas.
4. Comparar ventajas y riesgos.
5. Elegir la opción más clara y útil.
6. Explicar qué datos necesita.
7. Implementar una versión simple.
8. Validarla con usuario, psicólogo o fundador.
9. Iterar.

### Ejemplo: Árbol de Vida

No implementar directamente “un árbol” porque esté escrito aquí.

Primero preguntar:

- ¿Árbol, grafo, timeline, mapa de relaciones o mezcla?
- ¿Qué entiende mejor el paciente?
- ¿Qué ayuda más al psicólogo?
- ¿Cómo se representan familia, relaciones, trabajo y lugares?
- ¿Cómo se muestran fuentes y correcciones?
- ¿Cómo se evita que sea demasiado complejo?

Después proponer una solución.

### Ejemplo: panel del psicólogo

No crear tarjetas sin criterio.

Primero preguntar:

- ¿Qué necesita saber el psicólogo en 30 segundos?
- ¿Qué necesita en 2 minutos?
- ¿Qué necesita si quiere investigar en profundidad?
- ¿Qué es dato crudo?
- ¿Qué es análisis IA?
- ¿Qué es criterio profesional?

Después diseñar.

---

## 14. Fuentes antiguas de referencia

Estos documentos son **fuentes de contexto**, no instrucciones definitivas.

La brújula manda sobre ellos. Si algún informe antiguo contradice esta brújula, debe considerarse material histórico y no regla activa.

### 14.1 Ruta local de fuentes antiguas

Según la captura aportada, las fuentes están en:

```txt
Imágenes\Descargaspc\0a\ANCORA\datos\fuentes antiguas
```

Ruta recomendada dentro del proyecto, si se organiza el repositorio:

```txt
datos/fuentes antiguas/
```

O, si se quiere separar documentación de código:

```txt
docs/_fuentes_antiguas/
```

### 14.2 Archivos de referencia

| Archivo | Para qué sirve | Uso recomendado |
|---|---|---|
| `Áncora - Informe crítico para desarrollo backend, IA, memoria y datos clinicos.docx` | Base más importante de backend inteligente, memoria, RAG, context harness y pipeline documental. | Consultar cuando se diseñe motor IA, memoria, extracción, Árbol de Vida o Paciente 360. |
| `ancora_informe_unificado_mejorado_v2.docx` | Resumen integrado de problemas de la demo y recomendaciones de backend/IA/datos. | Usar como diagnóstico histórico de carencias. |
| `ancora_landing_premium_spec_desarrollador.docx` | Landing, marketplace, pricing, copy y captación. | Usar solo para marketing y web pública, no para definir el núcleo clínico. |
| `ancora_spec_completa_app_landing_backend_desarrollador.docx` | Spec antigua amplia de app, landing, marketplace, panel clínico y backend agente. | Usar como cantera de módulos y mockups, no como spec definitiva. |
| `informe exteno de ancora.md` | Investigación o análisis externo del planteamiento. | Consultar como apoyo estratégico, no como mandato. |
| `informe_uso_ia_como_psicologo.md` | Riesgos de usar IA como psicólogo y justificación del modelo híbrido. | Usar para límites, seguridad, copy legal y posicionamiento. |
| `mas info_ IA como Terapeuta_ Peligros y Ancora.md` | Argumentos sobre peligros de IA terapeuta y por qué Áncora debe ser supervisada. | Usar para tono, límites y diferenciación frente a chatbots. |
| `plan_tecnico_desarrollo_ancora_app.docx` | Plan técnico, MVP, arquitectura, roles, pagos, IA local y seguridad. | Consultar cuando se pase de brújula a implementación. |

### 14.3 Regla de uso de las fuentes antiguas

Estas fuentes no se entregan sueltas al programador como documentación activa.

Se usan así:

1. Primero se lee esta brújula.
2. Si hay duda concreta, se consulta el archivo antiguo adecuado.
3. Se propone una solución.
4. Se justifica por qué esa solución cumple mejor la meta de Áncora.
5. Solo entonces se programa.

---

## 15. Frase final de dirección

Áncora no debe implementar pantallas por obediencia documental.

Debe buscar siempre la mejor forma de conseguir la meta:

> Crear el sistema más útil del mercado para organizar, analizar y seguir la evolución psicológica de una persona, ayudando al paciente a entender su historia y al psicólogo a ahorrar tiempo sin perder criterio clínico.
