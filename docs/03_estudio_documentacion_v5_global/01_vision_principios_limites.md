# 01 · Visión, principios y límites clínicos

## 1. Qué es Áncora

Áncora es una plataforma de continuidad terapéutica que permite que pacientes y psicólogos compartan una memoria clínica viva, organizada y segura.

Su función principal es transformar datos desordenados en contexto útil:

- conversaciones diarias;
- documentos clínicos;
- notas personales;
- audios;
- sesiones;
- cuestionarios;
- revisiones semanales;
- tareas;
- observaciones del psicólogo;
- eventos vitales.

Todo se convierte en una estructura longitudinal que acompaña el proceso terapéutico durante meses o años.

## 2. Qué no es Áncora

Áncora no es:

- un psicólogo IA;
- un chatbot terapéutico autónomo;
- una herramienta de diagnóstico automático;
- una app de autoayuda genérica;
- una base de datos documental pasiva;
- un marketplace sanitario con IA decorativa;
- un sistema que sustituya la relación terapéutica humana.

## 3. Principio human-in-the-loop

Cualquier salida con impacto clínico debe tener control humano:

| Tipo de salida | Puede generarla IA | Requiere validación |
|---|---:|---:|
| Resumen de chat | Sí | Según uso |
| Extracción de datos de archivo | Sí | Paciente/psicólogo según dato |
| Evento de timeline | Sí como propuesta | Sí |
| Riesgo activo | Sí como alerta | Sí, con protocolo conservador |
| Nota SOAP | Sí como borrador | Siempre psicólogo |
| Objetivo terapéutico | Sí como sugerencia | Psicólogo |
| Interpretación clínica | Sí como hipótesis | Psicólogo |
| Diagnóstico | No como diagnóstico propio | Solo profesional |
| Prescripción o cambio de medicación | No | Profesional médico competente |

## 4. Principios no negociables

### 4.1 No diagnóstico

La IA puede detectar menciones, clasificar documentos, organizar antecedentes y señalar que en un archivo aparece un diagnóstico previo.  
No puede emitir diagnósticos propios.

Ejemplo correcto:

> “En el informe subido el 12/05/2026 aparece documentado ‘trastorno de ansiedad generalizada’. Pendiente de revisión por el psicólogo asignado.”

Ejemplo incorrecto:

> “Tienes trastorno de ansiedad generalizada.”

### 4.2 No prescripción

La IA puede identificar medicación declarada o documentada, dosis y fuente.  
No puede recomendar iniciar, suspender o modificar medicación.

### 4.3 No sustitución del psicólogo

El tono de producto debe ser:

- acompañamiento;
- seguimiento;
- organización;
- preparación;
- apoyo al criterio clínico.

No debe usarse:

- terapia con IA;
- psicólogo IA;
- diagnóstico automático;
- cura;
- garantía de mejora.

### 4.4 Separación de hechos e interpretaciones

Cada elemento debe estar clasificado:

- hecho;
- cita literal;
- dato documentado;
- dato declarado;
- inferencia IA;
- validación profesional;
- acción acordada;
- contradicción;
- gap pendiente.

## 5. Filosofía clínica del producto

Áncora debe ayudar a que el trabajo terapéutico tenga continuidad. La sesión deja de ser un evento aislado y se convierte en un punto dentro de una historia viva.

La plataforma debe responder:

- ¿Qué pasó desde la última sesión?
- ¿Qué se repite?
- ¿Qué cambió?
- ¿Qué evitó el paciente?
- ¿Qué tareas realizó?
- ¿Qué documentos modifican el caso?
- ¿Qué riesgos hay?
- ¿Qué debe mirar el psicólogo antes de hablar?
- ¿Qué evidencia respalda cada análisis?

## 6. Modelos de enfoque clínico

El sistema debe ser configurable por psicólogo. No debe imponer un único marco.

En MVP puede soportar:

- enfoque integrador;
- TCC;
- ACT;
- enfoque basado en objetivos;
- enfoque raw-first sin interpretación.

En versiones posteriores puede añadir:

- EMDR como etiquetado de temas, no intervención automática;
- terapia sistémica/familiar;
- duelo;
- pareja;
- trauma;
- sueño;
- adherencia.

## 7. Raw-first evolucionado

El formulario indica una tensión útil: se quiere comodidad y análisis IA desde el principio, pero también citas y frases literales de cada cosa relevante.

La solución recomendada no es ocultar siempre el análisis IA, sino crear un **modelo evidence-first**:

- la IA puede mostrar una conclusión rápida;
- toda conclusión debe incluir evidencia;
- la evidencia debe incluir citas literales, documentos o eventos;
- el psicólogo puede expandir el dato bruto;
- las inferencias sin evidencia suficiente se marcan como débiles;
- las hipótesis clínicas se separan de los hechos.

Ejemplo:

> Patrón posible: aumento de ansiedad anticipatoria laboral.  
> Evidencia: “no voy a dormir antes de la reunión” · chat 14/06; “me bloqueé antes de entrar” · sesión 21/06; check-in ansiedad 8/10 en tres domingos consecutivos.  
> Estado: inferencia IA, pendiente de validación.

## 8. Experiencia de confianza

Áncora debe evitar dos extremos:

1. **IA demasiado pasiva**, que solo guarda mensajes y no aporta inteligencia.
2. **IA demasiado clínica**, que se comporta como terapeuta autónoma.

El punto correcto es:

> IA activa para organizar, preguntar con prudencia, resumir y detectar patrones; humana para decidir, diagnosticar, intervenir y validar.

## 9. Qué debe pasar con la información sensible

Todo dato sensible debe tener:

- fuente;
- fecha;
- tipo;
- nivel de autoridad;
- estado de validación;
- consentimiento aplicable;
- permisos de acceso;
- auditoría;
- política de retención;
- posibilidad de exportación/supresión cuando aplique.

## 10. Métrica norte

La métrica norte del producto no debe ser “número de mensajes con IA”.  
Debe ser:

> reducción del tiempo de preparación clínica manteniendo o aumentando calidad, contexto y seguridad.

Métricas derivadas:

- tiempo medio de preparación antes de sesión;
- porcentaje de información validada;
- número de contradicciones resueltas;
- porcentaje de sesiones con briefing útil;
- uso del Patient 360 por psicólogo;
- reducción de notas manuales;
- satisfacción del psicólogo;
- seguridad: falsos negativos en riesgo, tiempos de respuesta y protocolos activados.
