# Bloque H — Calidad

> Que lo saneado no se vuelva a ensuciar. Corre en paralelo a todos los demás.
> **Criterio de cierre:** `npm test` existe y pasa; el lint no crece; el build
> avisa si el bundle engorda.

**Estado del bloque:** 🟢 6 de 6 tareas cerradas

---

## Estado del lint (31-08-2026): 423 problemas

| Regla | Nº | Gravedad | Bloque que lo arregla |
|---|---|---|---|
| `no-unused-vars` | 310 | Ruido | F7 |
| `react-hooks/set-state-in-effect` | 34 | Rendimiento | E4 |
| `react-hooks/exhaustive-deps` | 22 | Bugs sutiles | E4 |
| `react-hooks/immutability` | 15 | Bugs sutiles | E5 |
| `no-empty` | 12 | Ruido | F7 |
| `no-useless-escape` | 7 | Ruido | F7 |
| `react-hooks/rules-of-hooks` | 5 | **Bug real** | E3 |
| `react-hooks/purity` | 5 | Bug real | E5 |
| `no-dupe-keys` | 4 | Bug real | E6 |

Solo **14 de 423 son bugs reales**. No confundir ruido con deuda.

---

## Tareas

| ID | Tarea | Estado | Verificación |
|---|---|---|---|
| H1 | `process` declarado en ESLint | ✅ | Sin falsos `no-undef` en servicios |
| H2 | Script de test en `package.json` | ✅ | `npm test` lanza 4 suites, 164 pruebas |
| H3 | ESLint ignora `android/`, `ios/`, `scratch/`, `docs/` | ✅ | También `public/` |
| H4 | CI que bloquee si el lint empeora | ✅ | `.github/workflows/calidad.yml` + `npm run verificar` |
| H5 | Tests de los servicios de IA | ✅ | 30 pruebas puras + 70 de riesgo + 41 de anamnesis |
| H6 | Presupuesto de bundle | ✅ | Umbral en 2035 KB, y solo puede bajar |

---

## Detalle

### H2 · Script de test

```json
"scripts": {
  "test": "node src/tests/cognitive_memory_test.js"
}
```
Y ampliar con H5 cuando existan.

### H3 · Ignorar carpetas compiladas

En `eslint.config.js`, `globalIgnores(['dist', 'android', 'ios', 'scratch', 'docs'])`.
Hoy lintea los bundles de Capacitor y tarda de más.

### H5 · Tests de servicios (sin red)

Las piezas puras se prueban con casos fijos, sin llamar a la IA:
- `cleanTextForSpeech` — los 4 casos que ya destaparon 3 bugs (URL comida,
  espacio perdido, espacio huérfano).
- `splitIntoSentences` — primer fragmento corto, agrupación posterior.
- `evidenceIsGrounded` — cita exacta, cita con elipsis, paráfrasis (debe caer).
- `parseModelJSON` — con vallas markdown, con texto alrededor, truncado (debe fallar limpio).

### H4 y H6 · El guardia de umbrales · ✅ HECHAS

`npm run verificar` (y el flujo de CI) comprueban tres cosas:

1. **Lint que no sube.** Umbral en 409, y **solo puede bajar**: cada limpieza lo
   ajusta con `npm run verificar -- --actualizar`. Exigir cero hoy llevaría a
   silenciar reglas para que pase, que es peor que tener el aviso.
2. **Bundle que no engorda.** 2035 KB. Cuando llegue el troceado por vistas
   (E7), bajará solo.
3. **Cero datos personales en el bundle.** Este no tiene umbral: busca correos y
   nombres reales en `dist/` y falla si aparece alguno. Es lo que impide que se
   deshaga E8 sin que nadie se dé cuenta.

El CI comprueba además que el banco de preguntas generado sigue coincidiendo con
el guion clínico (`--check`), para cazar a quien edite el archivo generado a
mano en vez del markdown.

---

## Registro del bloque

| Fecha | Cambio |
|---|---|
| 2026-08-31 | H4 y H6 cerradas. **Bloque H completo.** El guardia vigila lint, tamaño y ausencia de datos personales; el CI lo ejecuta en cada push y pull request. |
| 2026-08-31 | H2, H3 y H5 cerradas. `npm test` lanza 4 suites (164 pruebas, todas verdes). Las pruebas destaparon 2 bugs reales antes de llegar a producción: la verificación de citas descartaba evidencia entrecomillada (D-24) y se podía alcanzar el nivel de vínculo B sin cumplir el A. |
| 2026-08-31 | H1 cerrada. Lint: 471 → 423 (las 48 arregladas eran los bugs de referencia y `process`). |

> **NOTA EMILIO:**
>
>
