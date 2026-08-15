# Fuentes utilizadas y trazabilidad del paquete

Este paquete se ha construido a partir de la documentación aportada por el usuario y del formulario de decisiones `formu.md`.

## Documentos fuente

- `Áncora - Informe crítico para desarrollo backend, IA, memoria y datos clínicos(1).docx`
- `ancora_informe_unificado_mejorado_v2(1).docx`
- `ancora_landing_premium_spec_desarrollador(1).docx`
- `ancora_spec_completa_app_landing_backend_desarrollador.docx`
- `informe exteno de ancora(1).md`
- `informe_mejoras_ancora(1).docx`
- `informe_uso_ia_como_psicologo.md`
- `informe_viabilidad_ancora_completo.md`
- `mas info_ IA como Terapeuta_ Peligros y Ancora.md`
- `plan_tecnico_desarrollo_ancora_app.docx`
- `formu.md`

## Decisiones aplicadas desde el formulario

- Entrega en varios `.md`.
- Documento ambicioso para guiar todo el producto.
- Core: RAG, extracción desde archivos/chats, memoria tipo Hermes, Patient 360.
- IA: orquestador central con herramientas especializadas.
- Privacidad: valor comercial fuerte.
- Infraestructura: agnóstica local/cloud.
- Legal: todo lo aplicable.
- Riesgo: protocolo, consentimiento, sistema híbrido y revisión humana.
- UX psicólogo: resumen rápido + profundidad bajo demanda + citas.
- Criterio editorial: proponer la mejor versión posible aunque cambie bastante.

## Advertencia

El paquete no es dictamen legal ni clínico. Debe revisarse con DPO, legal sanitario y psicólogos habilitados antes de desarrollo en producción.


## Actualización v2

Se añade una capa específica sobre intención de la web y producto completo, motivada por la indicación del usuario de que existe una versión completa en GitHub pero con fallos y carencias.

Documentos añadidos:

- `11_intencion_web_producto.md`
- `12_mapa_web_end_to_end.md`
- `13_auditoria_funcional_web_actual.md`
- `14_copy_mensajes_microcopy.md`
- `15_frontend_ux_componentes.md`
- `16_requisitos_repo_implementacion.md`

Nota: el repositorio de GitHub indicado no se ha podido inspeccionar directamente desde el entorno de esta sesión. Por tanto, la auditoría del archivo `13_auditoria_funcional_web_actual.md` es funcional y estratégica, basada en la intención del producto y en las carencias descritas por el usuario y los documentos previos. Para una auditoría línea a línea del código, subir un `.zip` del repositorio o facilitar acceso técnico estable.


## Fuente adicional v4

- `ancora-main.zip` — repositorio real subido por el usuario, analizado localmente en esta sesión.
- `README (2).md` — README del repo, usado para contrastar la intención declarada con la implementación.

## Hallazgos del repo real incorporados

- Stack real: React 19 + Vite + Capacitor + Supabase + Edge Functions.
- Edge Functions detectadas: `chat-terapeuta`, `clinical-ingest`, `clinical-synthesize`.
- Tablas clínicas detectadas en migraciones: `clinical_documents`, `document_extractions`, `clinical_proposals`, `clinical_facts`, `clinical_profiles`, `timeline_events`, `medications`, `risk_events`, `weekly_reviews`, `clinical_life_tree`, `clinical_timeline_index`, `patient_context_snapshots`, `conversation_memory_updates`, `patient_credits`.
- Problemas críticos: mezcla de producto sanitario con módulos personales/trading, hardcoding de proyecto Supabase, roles inconsistentes, componentes gigantes, uso de OpenRouter pese a promesa de IA local, documentos sensibles en repo, fallback localStorage para datos clínicos y CORS abierto.
