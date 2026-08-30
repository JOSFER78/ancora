# Áncora · Documentación unificada del sistema inteligente

**Versión:** 4.0  
**Fecha:** 2026-06-29  
**Formato:** paquete Markdown  
**Propósito:** convertir la documentación previa de Áncora en una especificación unificada, accionable y crítica para producto web, intención comercial, UX, IA, backend, datos clínicos, seguridad y experiencia del psicólogo.


## Novedad de la versión 4.0

Esta versión integra la auditoría real del `.zip` del repositorio `ancora-main`: estructura, pantallas, Firebase, Edge Functions, migraciones, deuda técnica, contradicciones con la promesa de privacidad y plan de reconstrucción.

La documentación ya no define solo el backend inteligente; ahora define también:

- qué quiere comunicar la web pública;
- cómo debe entender Áncora un paciente en 10 segundos;
- cómo debe entenderla un psicólogo en 10 segundos;
- cómo conectar landing, marketplace, onboarding, app, Patient 360, panel del psicólogo y admin;
- qué copy y microcopy usar para no vender una “IA psicóloga”;
- cómo auditar y rehacer una web/demo que ya existe pero está incompleta;
- cómo preparar el repositorio frontend para que deje de ser una demo y pase a ser producto real.

## Decisión central

Áncora no debe construirse como una web con chat, formularios y pagos.  
Áncora debe construirse como un **sistema de continuidad terapéutica con IA supervisada, memoria persistente y organización clínica viva**.

El producto diferencial no es “tener IA”. El producto diferencial es que, a partir de documentos, conversaciones, sesiones, notas de voz, check-ins y revisiones, Áncora convierte información caótica del paciente en:

- una historia clínica psicológica organizada;
- una cronología vital y terapéutica consultable;
- una memoria longitudinal recuperable;
- un Patient 360 útil para el psicólogo;
- resúmenes verificables con citas literales;
- propuestas de actualización de ficha;
- briefings antes de sesión;
- borradores SOAP siempre revisables;
- alertas prudentes de riesgo;
- datos estructurados con fuente, evidencia, confianza y validación.

## Cómo leer este paquete

| Archivo | Para qué sirve |
|---|---|
| `00_decisiones_producto.md` | Resume las decisiones tomadas a partir del formulario y fija los principios no negociables. |
| `01_vision_principios_limites.md` | Define qué es Áncora, qué no es y cuáles son sus límites clínicos, éticos y de producto. |
| `02_arquitectura_backend_ia.md` | Diseña el backend inteligente, servicios, almacenamiento, colas, orquestación y separación de responsabilidades. |
| `03_memoria_rag_context_harness.md` | Especifica memoria caliente, episódica, profunda, RAG, embeddings, context harness y recuperación inteligente. |
| `04_ingesta_extraccion_clinica.md` | Detalla el pipeline para archivos, chats, audios, documentos y propuestas de actualización clínica. |
| `05_patient_360_dashboard_psicologo.md` | Diseña el panel del psicólogo, Patient 360, capas de lectura, evidencias y UX de revisión rápida. |
| `06_modelo_datos_api_eventos.md` | Propone modelo de datos, tablas, estados de validación, eventos, APIs y trazabilidad. |
| `07_agentes_skills_loops_prompts.md` | Define orquestador, herramientas, skills, loops, prompts versionados y salidas JSON. |
| `08_seguridad_privacidad_riesgo.md` | Define privacidad, RGPD/UE, consentimiento, auditoría, crisis, riesgo y límites de IA. |
| `09_roadmap_mvp_target.md` | Ordena MVP, v1, v2, criterios de aceptación y qué queda como secundario. |
| `10_anexos_tecnicos.md` | Incluye esquemas JSON, SQL, ejemplos de APIs, prompts y flujos técnicos. |
| `11_intencion_web_producto.md` | Define la intención de la web: qué quiere hacer Áncora, qué debe entender paciente/psicólogo y cuál es la narrativa central. |
| `12_mapa_web_end_to_end.md` | Mapea landing, marketplace, onboarding, app paciente, panel psicólogo, Patient 360, admin y backend invisible. |
| `13_auditoria_funcional_web_actual.md` | Lista fallos típicos de la web/demo actual y backlog para convertirla en producto conectado. |
| `14_copy_mensajes_microcopy.md` | Propone copy, frases, FAQ, límites de IA y microcopy para seguridad clínica. |
| `15_frontend_ux_componentes.md` | Define componentes UI, navegación, estados vacíos, Evidence Cards, Proposal Cards y layout de Patient 360. |
| `16_requisitos_repo_implementacion.md` | Requisitos para revisar y rehacer el repositorio existente, estructura de carpetas, contratos y PRs. |


## Interpretación del formulario del usuario

Decisiones clave integradas:

- Entrega en **varios archivos Markdown**.
- Público: desarrolladores, producto, psicólogos, legal, inversores y partners.
- Enfoque: documento ambicioso para guiar todo el producto.
- Definición preferente: **plataforma de continuidad terapéutica con IA supervisada**, con memoria persistente.
- Prioridad máxima: RAG/contexto/análisis de datos, extracción desde archivos, extracción desde chats, memoria tipo Hermes, Patient 360 y dashboard cómodo.
- Patient 360: debe contener todo, pero mostrado de forma intuitiva para paciente y psicólogo.
- Modo psicólogo: resumen rápido + profundidad bajo demanda.
- Evidencia: el análisis IA puede mostrarse desde el principio, pero siempre debe ir anclado a frases/citas/documentos concretos.
- Archivos: todos los tipos, por fases.
- IA: debe extraer, estructurar, actualizar, detectar contradicciones, sugerir preguntas, preparar sesión y generar SOAP.
- Validación: la IA procesa; el usuario puede validar/rectificar datos; el psicólogo valida análisis clínico y acciones.
- Memoria: caliente, episódica, profunda, RAG, embeddings, resúmenes, skills y loops.
- Arquitectura IA: orquestador central + herramientas especializadas.
- Infraestructura: agnóstica local/cloud, con privacidad muy fuerte.
- Riesgo: consentimiento/protocolo, revisión humana e híbrido conservador.
- Legal: global, todo lo aplicable, seguridad máxima.
- Secundario: incluir todo, pero separar core de no-core; wearables no son prioridad inicial.
- Criterio editorial: proponer la mejor versión posible aunque cambie bastante lo anterior.

## Principio de diseño más importante

Cada dato clínico debe responder siempre a estas preguntas:

1. ¿Qué sabemos?
2. ¿De dónde viene?
3. ¿Quién lo dijo o documentó?
4. ¿Cuándo ocurrió?
5. ¿Qué confianza tiene?
6. ¿Está validado?
7. ¿Quién lo validó?
8. ¿Qué contradicciones existen?
9. ¿Qué debe ver el psicólogo en 2 minutos?
10. ¿Qué puede revisar si necesita profundidad?

## Nota legal y clínica

Esta documentación es una especificación de producto y arquitectura. No sustituye revisión legal, DPO, comité clínico ni validación sanitaria. Todas las decisiones sobre diagnóstico, tratamiento, crisis y actuación clínica pertenecen al profesional humano habilitado.


## Novedades añadidas tras revisar el repo real

El repositorio actual no debe tratarse como producto final, sino como **prototipo funcional contaminado por código personal, mocks y experimentos**. Contiene ideas valiosas que conviene rescatar, especialmente la landing, la estructura inicial de paciente/psicólogo/admin, `clinicalEngine.js`, las Edge Functions `clinical-ingest`, `clinical-synthesize`, `chat-terapeuta` y varias migraciones clínicas. Pero también contiene problemas estructurales que impiden usarlo como base sanitaria fiable sin una limpieza profunda.

Archivos nuevos de la v4:

- `17_auditoria_real_repo.md` — auditoría directa del repo subido.
- `18_plan_reconstruccion_repo.md` — plan para reconstruirlo por fases sin perder lo útil.
- `19_modelo_funcional_web_final.md` — intención final de la web y app, ya aterrizada al repo.
- `20_backlog_tecnico_por_archivo.md` — qué hacer con cada archivo/carpeta importante.
- `21_readme_nuevo_repo.md` — README recomendado para sustituir el actual cuando la arquitectura esté limpia.

## Dictamen de la v4

El repo actual **no falla por falta de ideas**. Falla porque mezcla en una sola SPA:

- producto sanitario;
- demo comercial;
- prototipo personal de terapia/trading;
- módulos administrativos;
- lógica IA;
- datos mock;
- llamadas reales a Firebase;
- Edge Functions parcialmente sanitarias;
- código legacy con fallback localStorage;
- promesa de privacidad local pero uso de OpenRouter en producción.

La solución no es añadir más pantallas. La solución es **reordenar el producto alrededor de una única columna vertebral**:

> paciente aporta datos → IA estructura con evidencia → paciente puede corregir → psicólogo valida → Patient 360 prepara la sesión → memoria mejora cada semana.

---

## V5 · Plan de reconstrucción por PRs

Esta versión añade una capa ejecutable para desarrollo real del repo:

- `22_plan_prs_ejecutables.md`: secuencia de Pull Requests para reconstruir el producto.
- `23_contratos_api_y_datos.md`: contratos de datos y endpoints mínimos.
- `24_sistema_ia_clinica_desarrollo.md`: módulos IA implementables: context harness, RAG, extractor, risk detector, memory manager.
- `25_tareas_primer_sprint.md`: primer sprint de limpieza y base clínica.
- `26_criterios_aceptacion_y_tests.md`: tests mínimos de producto, seguridad, IA y extracción clínica.
- `27_matriz_archivos_repo_acciones.md`: qué hacer con los archivos actuales del repo.

La recomendación principal es no seguir ampliando el prototipo actual sin antes separar módulos personales, mocks y producto clínico real.
