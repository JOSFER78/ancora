# Áncora ⚓ — Plan Maestro

> Índice del plan. El detalle vive en `docs/plan/`, **un archivo por bloque**,
> para poder editar, anotar y cerrar cada uno por separado sin tocar los demás.
> Escribe tus notas en los bloques `> **NOTA EMILIO:**` de cada archivo.

**Última revisión:** 31 de agosto de 2026 · Rama `main`

---

## El plan, en una pantalla

| Documento | Qué contiene | Estado |
|---|---|---|
| [La Biblia](docs/plan/BIBLIA.md) | 18 leyes · 20 descubrimientos · 5 rectificaciones · catálogo de IA · mapa de datos | Vivo, se acumula |
| [Fases](docs/plan/FASES.md) | La vista temporal: qué se hace en cada fase y su prueba de cierre | Fase 0 cerrada |
| [Bloque A — Infraestructura](docs/plan/BLOQUE_A_INFRAESTRUCTURA.md) | Firebase, hosting, claves, router | 🟡 6/9 |
| [Bloque B — Datos](docs/plan/BLOQUE_B_DATOS.md) | Esquema, nomenclatura, RGPD | 🟡 1/6 |
| [Bloque C — Acceso](docs/plan/BLOQUE_C_ACCESO.md) | Roles, consentimientos, licencias | 🟡 3/7 |
| [Bloque D — Servicios de IA](docs/plan/BLOQUE_D_SERVICIOS_IA.md) | El motor: ingesta, informes, voz, grabadora | 🟢 8/9 |
| [Bloque E — Lógica](docs/plan/BLOQUE_E_LOGICA.md) | App.jsx, hooks, router, bugs de React | 🟡 5/8 |
| [Bloque F — Interfaz](docs/plan/BLOQUE_F_INTERFAZ.md) | Vistas, enganches de F2/F3, troceado | 🟡 4/8 |
| [Bloque G — Producto](docs/plan/BLOQUE_G_PRODUCTO.md) | Los flujos completos, G2 anamnesis desglosada | 🟡 3/9 (G2, G4 y parte de G3) |
| [Bloque H — Calidad](docs/plan/BLOQUE_H_CALIDAD.md) | Lint, tests, CI, bundle | 🟢 6/6 |

**Orden de capas:** A → B/C → D → E → F → G, con H siempre en paralelo.
No se sube de capa con la de abajo abierta (excepción: F2 y F3).

---

## Lo inmediato, en orden

1. **A6** — rotar la clave comprometida *(te toca a ti: hay que entrar en OmniRoute)*
2. ~~**D9** — el 016~~ ✅ hecho como código, con 70 pruebas
3. ~~**E3 + E6** — bugs reales de React~~ ✅ hechos
4. ~~**F3** — ingesta enganchada~~ ✅ texto, audio y **fotos de informes**
5. ~~**F2** — grabadora continua~~ ✅ botón en «Hoy», con revisión antes de guardar
6. ~~**G2** — motor de anamnesis y barra de madurez~~ ✅
7. ~~**D8** — migración del motor antiguo~~ ✅ ningún camino de IA lo usa ya
8. **G2-E2E** — el recorrido completo por la interfaz con el dataset real:
   es lo único que falta para cerrar la fase 1

## Lo que ha entrado después

- **C3** ✅ consentimiento del artículo 9 del RGPD, que **bloquea** chat e ingesta
- **E8** ✅ datos personales fuera del bundle público (52 correos, nombres, UID)
- **F4 + G4** ✅ informe periódico con validación hallazgo a hallazgo (N4 → N1)
- **G3 (2 de 5)** ✅ recuerdo espontáneo + BM25 en la recuperación de memoria
- **H completo** ✅ `npm run verificar`: lint, tamaño y privacidad, con CI

## Decisiones que necesito de Emilio

| # | Decisión | Bloquea |
|---|---|---|
| 1 | ¿Endpoint de token efímero en el router? | D7 · voz a voz agéntica |
| 2 | ¿Clave del router o bloqueo por dominio? | A8 |
| 3 | ¿Rotar ya la clave antigua? | A6 |
| 4 | ¿Licencia de PHQ-9 y GAD-7? | C4 |
| 5 | ¿Borrar los 5 índices huérfanos con `--force`? | A7 |
| 6 | Modal de privacidad: ¿reconstruir o quitar? | C6 |
| 7 | ¿Consagrar la convención `patient_id`/`user_id` sin migrar? | B3 |

---

## Cómo se trabaja con este plan

- **Cada bloque es autónomo:** tiene sus tareas con ID (`A6`, `F3`…), su criterio
  de cierre verificable y su registro de cambios al pie. Se edita solo, sin
  merge-conflicts con los demás.
- **Los IDs son estables:** en commits, notas y conversaciones se referencia
  `F3` o `D9`, no «lo del panel».
- **Todo descubrimiento va a la Biblia** con el siguiente número libre (D-21…).
  Toda metedura de pata, a Rectificaciones. Nada se borra.
- **Cerrar una tarea exige su verificación**, no la sensación de que está hecha.

## Comandos útiles

```bash
npm test                                    # 6 suites, 213 pruebas
npm run verificar                           # lint, tamaño y privacidad del bundle
npm run guion                               # recompila el banco de preguntas
npx eslint src                              # lint
npx vite build                              # build
npx firebase-tools@latest deploy --only firestore:rules,firestore:indexes --project ayuda-emilio-83261
```

> **NOTA EMILIO:**
>
>
