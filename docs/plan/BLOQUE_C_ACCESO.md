# Bloque C — Acceso y cumplimiento

> Quién puede ver qué, y con qué respaldo legal.
> **Criterio de cierre:** ningún dato de salud se procesa sin consentimiento
> expreso registrado; instrumentos con licencia comprobada; el paciente puede
> ejercer sus derechos desde la app.

**Estado del bloque:** 🟡 3 de 7 tareas cerradas
**Depende de:** A
**Bloquea a:** G (producto con usuarios reales)

---

## Tareas

| ID | Tarea | Estado | Verificación |
|---|---|---|---|
| C1 | Modelo de roles en reglas | ✅ | Paciente/psicólogo asignado/supervisor; verificado en producción |
| C2 | Inmutabilidad de `audit_logs` y `consents` | ✅ | Reglas: `allow update, delete: if false` |
| C3 | Consentimiento informado antes del primer uso | ✅ | Sin consentimiento registrado, la IA no procesa nada del paciente |
| C4 | Licencia de PHQ-9 y GAD-7 | ⬜ | Respuesta documentada con fuente; retirar si no procede |
| C5 | Encargado de tratamiento con el proveedor de IA | ⬜ | Contrato o DPA identificado para el flujo de datos de salud |
| C6 | Modal de privacidad de `PacienteChatView` | ⬜ | El botón abre algo real o desaparece |
| C7 | Verificación de identidad (DNI) en registro | ⬜ | Se ejecuta en Bloque G (fase 5) |

---

## Detalle de las pendientes

### C3 · Consentimiento informado · ✅ HECHA

`src/lib/consentimiento.js` + `src/components/ConsentimientoIA.jsx`.

**Bloquea de verdad**, que era el punto: `invokeChatTerapeuta` y
`uploadClinicalDocument` comprueban el consentimiento antes de tratar un solo
dato y lanzan `ConsentRequiredError` si no consta. Un aviso que se puede
ignorar no es una garantía.

El texto dice qué se trata, para qué, quién lo ve, qué NO hace la IA (no
diagnostica), el límite de la confidencialidad ante una señal de riesgo, y los
derechos. Los cuatro encargados del tratamiento aparecen con nombre, para qué
reciben los datos y dónde están.

Detalles que importan:
- **Versión en el registro** (`ia-clinica-v1-2026-08`) más una huella del texto
  aceptado: dentro de dos años hay que poder demostrar qué firmó esta persona,
  no solo que firmó algo. Subir la versión obliga a volver a pedirlo.
- **Se puede aplazar.** Un consentimiento sin alternativa no es libre, y si no
  es libre no es válido. Quien diga «ahora no» sigue usando el resto.
- **Si la lectura falla, se considera que no hay permiso.** Es preferible
  enseñar la pantalla de más que tratar datos de menos.
- La casilla del registro no vale como consentimiento del artículo 9: no dice
  qué se procesa ni por quién. Se pide aparte, al entrar.

### C4 · PHQ-9 y GAD-7

El registro ya recoge `phq9Scores` y `gad7Scores`. El ACE es de uso libre
(verificado); estos dos no se pudo verificar. Comprobar en las fuentes de los
autores/editores. Si hay restricción: retirarlos del triaje o sustituirlos por
preguntas propias no clonadas.

### C5 · Encargado de tratamiento

El flujo real de datos de salud es: navegador → router propio (VPS Oracle) →
Anthropic / Groq / Deepgram. Para producción con pacientes reales hace falta
mapear ese flujo y tener DPA con cada eslabón (Anthropic y Deepgram los ofrecen
comercialmente; el VPS es tratamiento propio). Mientras tanto: solo dataset de
prueba, como hasta ahora.

### C6 · Modal de privacidad

El botón «Garantía de Seguridad y Privacidad» de `PacienteChatView` llamaba a
`setShowSecurityInfo(true)` sin que existieran ni el estado ni el modal (D-02).
El estado ya existe y no revienta, pero no muestra nada. Decidir: reconstruir el
modal (contenido: qué se guarda, quién lo ve, cómo borrarlo) o quitar el botón.

---

## Registro del bloque

| Fecha | Cambio |
|---|---|
| 2026-08-31 | C3 cerrada: consentimiento explícito del artículo 9 del RGPD, que bloquea chat e ingesta hasta que consta. |
| 2026-08-31 | C1-C2 cerradas con el despliegue de reglas (D-03). |

> **NOTA EMILIO:**
>
>
