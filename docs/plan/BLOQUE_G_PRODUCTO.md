# Bloque G — Producto

> Que los flujos completos funcionen de principio a fin. Aquí viven las fases
> de producto; cada una se apoya en tareas de los bloques anteriores.
> **Criterio de cierre por flujo:** su prueba de extremo a extremo pasa con el
> dataset real y cero elementos sin evidencia.

**Estado del bloque:** 🟡 1 de 9 flujos cerrados
**Depende de:** C, D, E, F

---

## Flujos

| ID | Flujo | Estado |
|---|---|---|
| G1 | Registro individual de adulto | ✅ Saneado (solo individual; pareja/familiar «Próximamente») |
| G2 | **Anamnesis orgánica** | 🟢 Las 4 vías funcionando; falta la prueba E2E con el dataset |
| G3 | Continuidad y memoria entre sesiones | 🟡 Recuerdo espontáneo hecho; faltan BM25 y compactación |
| G4 | Informe periódico y validación N4→N1 | 🟢 Hecho; falta probarlo con un mes real |
| G5 | Portal del psicólogo completo | ⬜ |
| G6 | Terapia de pareja | ⏸ Aparcado a propósito |
| G7 | Terapia familiar y menores | ⏸ Aparcado a propósito |
| G8 | Conciliación | ⏸ Aparcado a propósito |
| G9 | Panel de superadmin (modelo por tarea desde Firestore) | ⬜ |

---

## G2 · Anamnesis orgánica — desglose

**Objetivo:** que la plataforma le saque al paciente su historia de vida como lo
haría un psicólogo con oficio: sin interrogatorio, por cuatro vías, todo a una
ficha trazable.

**Cuatro vías de entrada a la misma ficha:**

1. **Entrevista guiada en el chat** — ✅ el guion se compila a datos con
   `npm run guion` (26 subbloques, 106 preguntas, 212 repreguntas) y la
   directiva se inyecta en cada turno de `chatTerapeuta`.
2. **Formulario del panel de historia clínica** — ✅ (F3).
3. **Documentos adjuntos** — ✅ texto, audio e imagen (F3).
4. **Notas de voz y grabadora continua** — ✅ (F2).

**Reglas de conversación** (las 10 del guion; van al prompt de sistema):
una pregunta por turno · seguir el hilo · prohibido repreguntar lo ya contado ·
reconducir sin cortar · cuándo callar · validar antes de indagar · no interpretar ·
no forzar cierre de bloque · idioma del paciente · turnos breves.

**Umbrales de vínculo** (medibles por código):
- Nivel A (vulnerabilidad moderada): ≥2 conversaciones y ≥5 hallazgos verificados en ≥2 dimensiones.
- Nivel B (temas sensibles): ≥4 conversaciones, ≥50% de cobertura del árbol, **y**
  señal espontánea del paciente **o** autorización N1 del psicólogo.
  Los números son condición necesaria, no suficiente.

**Protocolo de riesgo** (tres niveles, nunca sujeto a vínculo):
- N1 malestar sin ideación → marca en expediente.
- N2 ideación sin plan → pregunta directa + contención + alerta <24 h.
- N3 riesgo inminente → corta el guion + 112/024 + alerta bloqueante.
- ✅ D9 cerrada: `riskProtocol.js`, 70 pruebas. El 112 siempre; el 024 solo en
  riesgo autolítico; el 016 solo con indicio de violencia contra una mujer.
  Y los teléfonos los pone el código, no el modelo (L19).

**Barra de madurez como brújula:** ✅ `anamnesisState.js`. Estados
`PENDIENTE / EN_EXPLORACION / EXPLORADA / CONSOLIDADA` por dimensión, sobre
hallazgos con evidencia; la dimensión más floja decide hacia dónde mira el chat.
`calculateClinicalExplorationMaturity` ya lee de aquí, y **se quitó el suelo del
20%**: un expediente vacío marca 0%. Enseñarle un 20% a quien no ha contado nada
es mentirle sobre su propio proceso, y encima le quita la razón para contarlo.

**Prueba de cierre (G2-E2E):** registro nuevo → conversar → subir 2 documentos →
1 nota de voz → revisar la ficha a mano buscando invenciones.
**Listón: cero elementos sin cita verificable.**

---

## G3 · Continuidad y memoria — desglose

Del diseño técnico de memoria (scratchpad `diseno_memoria.md`), en este orden:

1. **Recuerdo espontáneo** — ✅ `src/lib/recuerdoEspontaneo.js`, 28 pruebas.
   Tres reglas sobre lo ya guardado: aniversarios que caen hoy, compromisos que
   quedaron en el aire y recursos que lleva semanas sin usar. Cada candidato
   viaja con su cita literal; el modelo decide cómo decirlo.
   Nunca se ofrece si hay señal de riesgo: sacarle a alguien que acaba de decir
   que no puede más que hoy hace dos años de la muerte de su padre sería lo
   contrario de acompañar.
   **Lección de la validación real (D-29):** la primera redacción, llena de
   cautelas («en la duda, cállatelo»), hacía que el modelo se abstuviera
   siempre, también en la conversación tranquila que era justo el momento. Un
   recuerdo que nunca sale no es prudencia: es una función que no existe. Con
   una instrucción imperativa para la fecha de hoy y un ejemplo del tono, sale
   solo cuando toca — y sigue callándose cuando el paciente trae algo urgente.
2. **BM25** — ✅ `src/services/memory/BM25.js`, 21 pruebas. Sustituye al Jaccard
   del `RelevanceScorer`, que trataba «que» igual que «insomnio»: en un
   expediente clínico las palabras corrientes salen en todos los recuerdos y
   las que importan en dos, así que ponderar por rareza (IDF) no es un detalle.
   Incluye saturación de frecuencia, normalización por longitud, y troceado
   castellano (quita tildes, junta singular y plural).
   El índice se construye sobre el corpus completo del paciente antes de
   puntuar, que es lo que hace que el IDF signifique algo: qué palabra
   distingue depende de lo que ESTE paciente cuenta, no de un diccionario.
   ⬜ **Falta la expansión de consulta con Claude**, que es lo que cierra el
   hueco restante: BM25 solo no junta «dormir» con «duermo» (verbo irregular),
   y eso está comprobado en la suite para que no se olvide. Evidencia: +18%
   nDCG@10 con expansión (GenQREnsemble); doc2query lleva BM25 de 0.184 a 0.272
   de MRR@10 en MS MARCO, frente a 0.33-0.36 de la búsqueda densa.
3. **Presupuesto de contexto** — subirlo tras migrar el chat a streaming (D-08).
4. **Compactación** — reaprovechando `patient_context_snapshots` (D-12).
5. **Grafo de relaciones** — el último, payoff más indirecto.

**Prueba de cierre:** dos sesiones separadas por días enlazan solas; el paciente
no repite nada; el sistema menciona sin que se lo pidan algo que solo puede saber
por haberlo recordado.

## G4 · Informe periódico — ✅ HECHO

`src/lib/informes.js` reúne el material del periodo de ocho colecciones, llama
al motor (D4) y guarda en `clinical_reports` con `authority_level: 4`. El panel
(F4) permite aceptar o descartar cada hallazgo: aceptar es lo que lo convierte
en criterio clínico N1, y a partir de ahí manda sobre lo que la IA infiera
después (L4). Compartir un resumen con el paciente es una acción aparte, que
solo hace el profesional (L13).

Un detalle deliberado: si el periodo no tiene material suficiente, **no se
guarda nada**. Un expediente lleno de informes que dicen que no hay nada que
decir solo le estorba al profesional.

Falta la prueba con un mes de datos reales acumulados.

## G5 · Portal del psicólogo — desglose

Ficha 360 alimentada por G2-G4 · notas SOAP desde el informe · agenda con las dos
modalidades (revisión de 15 min y sesión de 50) · troceado de la vista (F5).

## G9 · Superadmin — desglose

Mover `CLINICAL_MODELS` de variables de entorno a un documento
`app_config/ai_models` en Firestore (editable solo por supervisor, L11-L12), con
reserva por tarea y sin recompilar. El catálogo permitido es el de la Biblia §4.

---

## Registro del bloque

| Fecha | Cambio |
|---|---|
| 2026-08-31 | G3 arrancado por donde más se nota: el recuerdo espontáneo, enganchado al chat y validado contra el endpoint real en los dos escenarios (día tranquilo → lo saca; día con urgencia → se calla). |
| 2026-08-31 | G4 completo salvo la prueba con un mes real de datos. |
| 2026-08-31 | G2 con el motor completo: guion compilado a datos (26 subbloques, 106 preguntas), brújula de madurez, niveles de vínculo y directiva inyectada en el chat. Validado contra el endpoint real. Falta la interfaz (barra de madurez y F2/F3). |
| 2026-08-31 | G1 cerrado. G2 diseñado por completo (guion clínico + umbrales + riesgo). |

> **NOTA EMILIO:**
>
>
