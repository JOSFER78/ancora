# 26 · Criterios de aceptación y tests mínimos

## Objetivo

Definir cómo sabremos que Áncora está pasando de prototipo a producto clínico real.

---

## Tests de producto

### Landing

Debe pasar:

- En 10 segundos se entiende que Áncora es continuidad terapéutica con IA supervisada.
- Hay CTA de paciente y CTA de psicólogo.
- No se promete diagnóstico, curación ni terapia autónoma.
- Hay sección clara de privacidad y límites de IA.

### Onboarding paciente

Debe pasar:

- No se entra al chat sin consentimiento.
- El usuario entiende qué ve el psicólogo.
- El usuario puede elegir psicólogo o aceptar invitación.
- Si hay riesgo crítico, se muestra protocolo de ayuda humana.

### Chat

Debe pasar:

- Cada sesión queda registrada.
- El cierre de sesión genera resumen diario.
- Los mensajes relevantes crean propuestas.
- La IA no diagnostica ni prescribe.
- En crisis no continúa como chat normal.

### Documentos

Debe pasar:

- Subir un documento crea registro.
- La extracción genera texto estructurado.
- La IA crea propuestas con fuente y cita.
- El usuario/psicólogo puede aceptar, editar o rechazar.

### Patient 360

Debe pasar:

- Carga en menos de 2 segundos con snapshot.
- Muestra resumen de 30 segundos.
- Cada insight tiene evidencia.
- El psicólogo puede entrar a vista profunda.
- Se distingue hecho, cita, interpretación e hipótesis.

### SOAP

Debe pasar:

- El SOAP generado aparece como borrador.
- El psicólogo debe validarlo.
- Se guardan versiones.
- La nota validada tiene mayor autoridad que la inferencia IA.

---

## Tests de seguridad

### RLS

Casos obligatorios:

- Paciente A no puede leer documentos de Paciente B.
- Psicólogo A no puede leer paciente no asignado.
- Admin soporte no puede leer contenido clínico sin break-glass.
- Superadmin técnico no accede a contenido descifrado por defecto.

### Logs

Comprobar que no se registran:

- prompts completos,
- respuestas IA completas,
- mensajes del paciente,
- documentos,
- audios,
- notas SOAP,
- información de salud en errores.

### Secrets

Comprobar:

- no hay claves reales en repo,
- `.env.example` no contiene valores reales,
- CI detecta secrets,
- Edge Functions no exponen service role al cliente.

---

## Tests clínicos de política IA

Crear casos de prueba para:

1. paciente pide diagnóstico,
2. paciente pregunta por medicación,
3. ideación suicida explícita,
4. ideación suicida implícita,
5. autolesión,
6. violencia hacia terceros,
7. TCA,
8. delirios o paranoia,
9. menor de edad,
10. emergencia médica.

Cada test debe comprobar:

- respuesta segura,
- no diagnóstico,
- no instrucciones peligrosas,
- derivación adecuada,
- alerta si procede,
- registro de evento de riesgo.

---

## Tests de extracción clínica

Fixtures:

- PDF con medicación.
- Informe psicológico con diagnóstico previo documentado.
- Chat con evento vital.
- Chat con contradicción.
- Documento con fechas aproximadas.
- Nota de voz transcrita.

Comprobar:

- JSON válido,
- fechas normalizadas,
- autoridad correcta,
- evidencia vinculada,
- propuestas generadas,
- no consolidación automática indebida.

---

## Definition of Done general

Una tarea clínica no está terminada si:

- solo funciona con mocks,
- no tiene estados de error,
- no respeta permisos,
- no guarda auditoría,
- no distingue fuente/autoridad,
- no permite validación humana,
- no tiene evidencia visible.

---

## Métricas de avance

### Técnicas

- `App.jsx` < 150 líneas.
- Ninguna vista > 800 líneas sin dividir.
- 0 datos personales en repo.
- 0 módulos no clínicos en navegación.
- 100% RLS en tablas clínicas.
- 100% endpoints clínicos con auth.

### Producto

- Psicólogo entiende un paciente en 2 minutos.
- Paciente entiende límites de IA antes de chatear.
- Cada documento subido produce al menos una salida útil o un error claro.
- Cada propuesta tiene evidencia.

### Seguridad

- No logs clínicos.
- Consentimientos versionados.
- Exportación RGPD disponible.
- Break-glass auditado.
