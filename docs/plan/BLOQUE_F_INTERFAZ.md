# Bloque F — Interfaz

> Lo que ve el usuario. La capa más sucia y la que menos corre prisa — salvo F2
> y F3, que enganchan lo ya construido y van primero.
> **Criterio de cierre:** ninguna vista por encima de 800 líneas; estilos en CSS;
> navegable con teclado.

**Estado del bloque:** 🟡 4 de 8 tareas cerradas
**Depende de:** D (servicios), E (lógica)
**Bloquea a:** G

---

## Estado medido (31-08-2026)

| Archivo | Líneas | Estilos en línea |
|---|---|---|
| `AgentesView.jsx` | 5.040 | 597 |
| `PsicologoDashboardView.jsx` | 4.820 | 717 |
| `MenteView.jsx` | 4.205 | 505 |
| `PacienteChatView.jsx` | 2.716 | — |
| `LandingView.jsx` | 1.959 | 455 |
| `LoginView.jsx` | 1.951 | — |
| `ChatView.jsx` | 1.803 | — |
| `PacienteHoyView.jsx` | 1.714 | 256 |

Total de estilos en línea en el proyecto: **~2.530**.

---

## Tareas

| ID | Tarea | Estado | Verificación |
|---|---|---|---|
| F1 | Ficha de menores eliminada del registro | ✅ | 0 rastros; solo individual seleccionable |
| F2 | **Enganchar la grabadora continua a la UI** | ✅ | Botón en «Hoy» → modal → grabar/pausar/seguir → nota revisable → guardada con su verbatim |
| F3 | **Enganchar la ingesta al panel de historia clínica** | ✅ | Foto de informe → 8 hallazgos, 4 anclajes, 1 señal de riesgo, 0 descartados |
| F4 | Panel de informe en el portal del psicólogo | ✅ | Genera, guarda, valida hallazgo a hallazgo y comparte resumen |
| F5 | Trocear las 4 vistas de +2.500 líneas | ⬜ | Ninguna >800 líneas |
| F6 | Estilos en línea → clases CSS | ⬜ | Contador de `style={{` en descenso por archivo |
| F7 | Limpiar 310 `no-unused-vars` | ⬜ | Lint sin esa regla |
| F8 | Accesibilidad básica | ⬜ | Foco visible, roles ARIA en modales, contraste AA |

---

## Detalle de las inmediatas

### F2 · Grabadora continua en la UI · ✅ HECHA

`src/components/GrabadoraContinua.jsx`, con acceso directo en `PacienteHoyView`.
Lo que se hizo y por qué:

1. **Acceso directo** — botón «Grabar una nota de voz» en la vista Hoy, que abre
   la grabadora en modal. Un toque, sin menús intermedios.
2. **El medidor cae a cero en pausa**, y el texto lo dice: «en pausa · no se
   está grabando». No es decoración: es cómo la persona ve que no se la graba.
3. Al terminar, `processRecordingSession()` y **previsualización obligatoria**:
   la nota organizada, sus citas literales y los cabos sueltos. Nada llega al
   expediente sin que lo lea antes.
4. Persistencia con `guardarNotaDeVoz()`: nota organizada **y** transcripción
   literal (L2), como `clinical_documents` con `source_kind: 'nota_voz'` y N3.
   Los temas con cita entran además en el árbol vital.
5. Aviso `beforeunload` con grabación viva, y liberación del micrófono al
   desmontar el componente pase lo que pase.

### F3 · Ingesta en el panel de historia clínica · ✅ HECHA

`uploadClinicalDocument` pasa por `ingestClinicalSource`, y el botón de síntesis
repasa las conversaciones con el mismo motor. Antes le pedía al modelo que
«rellenara las seis dimensiones» a partir de un resumen: lo que no estaba, se
lo inventaba, y nada de lo que salía llevaba cita.

Cubre las tres entradas: texto, audio (Whisper) e **imagen** (visión, D-21).
Cada bloque se guarda con su autoridad —N2 para documentos clínicos, N3 para
material del propio paciente— y lo que no tiene cita se descarta y se cuenta.
Las señales de riesgo del documento van a `risk_events`, y las dudas abiertas
alimentan el sonsacado del chat.

**Validación real** (foto de un informe de alta): 8 hallazgos, 4 anclajes
protectores, 7 hitos, 1 señal de riesgo, la medicación con dosis y prescriptor,
y **0 elementos descartados por falta de evidencia**. 47 s de principio a fin.

### F5 · Troceado de vistas (cuando toque)

Regla práctica: extraer primero los sub-componentes puros (tarjetas, listas,
modales) a `src/components/`, después los hooks de datos (`useXxx`) y dejar la
vista como composición. Un archivo por sesión de trabajo, con build y lint verdes
entre cada uno. Empezar por `PsicologoDashboardView` (es la que toca Fase 3-4).

---

## Registro del bloque

| Fecha | Cambio |
|---|---|
| 2026-08-31 | F4 cerrada: `PanelInforme` en la ficha del paciente. Cada hallazgo se acepta o se descarta a mano —eso es lo que sube una inferencia N4 a criterio clínico N1— y compartir un resumen con el paciente es un acto aparte y voluntario (L13). |
| 2026-08-31 | F2 y F3 cerradas. La ingesta acepta fotos de informes (D-21). Al validar contra el endpoint apareció un fallo mío: los hallazgos vienen en `resultado.extraction`, no en la raíz, así que no se guardaba nada y sin ruido. `persistIngestionResult` acepta ahora las dos formas. |
| 2026-08-31 | F1 cerrada: ficha de menores fuera, psicólogos ficticios eliminados, modalidades pareja/familiar en «Próximamente». |

> **NOTA EMILIO:**
>
>
