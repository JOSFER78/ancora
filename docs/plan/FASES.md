# Fases de ejecución

> Las fases son la vista temporal; los bloques (A-H) son la vista por capas.
> Cada fase toma tareas concretas de los bloques. Se cierra una fase cuando su
> prueba de cierre pasa — no antes.

```
A (Infraestructura) ─┬─> C (Acceso) ──────────> G (Producto)
                     ├─> B (Datos) ─> D (IA) ─> E (Lógica) ─> F (Interfaz)
                     └─> A9 ─────────────────>  D7 (voz a voz)
H (Calidad) corre en paralelo, siempre.
```

**Regla:** no se sube de capa con la de abajo abierta. Excepción: F2 y F3
(enganchar lo ya construido) pueden adelantarse.

---

## Fase 0 — Cimientos · ✅ CERRADA (con 2 flecos)

Seguridad, índices, motor reparado, ficha de menores fuera, clave fuera del bundle.

**Flecos:** A6 (rotar clave comprometida) · desplegar el build a hosting.

## Fase 1 — Anamnesis orgánica · 🟢 CASI CERRADA

**Objetivo:** el flujo G2 completo con solo terapia individual.

| Orden | Tarea | De bloque | Estado |
|---|---|---|---|
| 1 | Rotar clave | A6 | ⬜ Requiere a Emilio |
| 2 | Protocolo de riesgo como código | D9 | ✅ 70 pruebas |
| 3 | Grabadora continua en la UI | F2 | ✅ |
| 4 | Ingesta en el panel de historia clínica | F3 | ✅ Texto, audio e imagen |
| 5 | Guion de anamnesis codificado e inyectado en el chat | G2 | ✅ 26 subbloques |
| 6 | Migrar el chat a Claude con streaming | D8 | ✅ Y el resto de vistas |
| 7 | Barra de madurez como brújula | G2 | ✅ Sin el suelo falso del 20% |
| 8 | Bugs reales de React | E3, E6 | ✅ |
| 9 | Prueba de extremo a extremo con el dataset | G2-E2E | ⬜ **Lo que queda** |

**Prueba de cierre:** registro nuevo → conversar → 2 documentos → 1 nota de voz →
ficha poblada con **cero elementos sin cita verificable**.

Validado por piezas contra el endpoint real: el chat (4 turnos, incluidos dos de
riesgo), la ingesta desde foto de informe (8 hallazgos, 0 descartados) y las 164
pruebas automáticas. Falta el recorrido completo por la interfaz con el dataset
de tisute@gmail.com, que es lo que cierra la fase.

## Fase 2 — Memoria que se nota · 🟡 EMPEZADA

~~Recuerdo espontáneo~~ ✅ → doc2query + BM25 → presupuesto de contexto (ya se
puede: D8 hecho) → compactación (`patient_context_snapshots`) → grafo. Todo en G3.

**Prueba de cierre:** dos sesiones separadas por días enlazan solas; nada se
repregunta; el sistema recuerda algo por iniciativa propia.

## Fase 3 — Informe para el psicólogo · 🟢 HECHA (falta probarla con un mes real)

~~G4: panel (F4), guardado en `clinical_reports`, validación N4→N1, versión
resumida para el paciente (L13).~~ Todo construido. Queda generar un informe
con un mes de datos acumulados de verdad.

**Prueba de cierre:** informe del mes generado, dos hallazgos validados, y esos
hallazgos mandan sobre la IA (L4).

## Fase 4 — Portal del psicólogo

G5 + F5 (troceado de `PsicologoDashboardView`) + E7 (router).

**Prueba de cierre:** ciclo completo revisión → nota SOAP → siguiente cita sin
salir de la plataforma.

## Fase 5 — Modalidades e identidad

C7 (DNI) · G6 pareja · G7 familiar/menores · G8 conciliación · G9 superadmin.

**Prueba de cierre:** cada modalidad con su registro, sus consentimientos y sus
reglas de acceso propias.

## Fase 6 — Pulido continuo

Lo que queda de E4-E5, F5-F8, H4-H6. Sin fecha: se va haciendo entre fases.

---

> **NOTA EMILIO:**
>
>
