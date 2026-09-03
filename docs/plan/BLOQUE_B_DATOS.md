# Bloque B — Datos

> Que lo guardado sea coherente, íntegro y con un solo nombre para cada cosa.
> **Criterio de cierre:** cada colección documentada con sus campos y su dueño;
> sin códigos de error de PostgREST; existe procedimiento de borrado completo de
> un paciente (RGPD).

**Estado del bloque:** 🟡 1 de 6 tareas cerradas
**Depende de:** A
**Bloquea a:** D (los servicios escriben en estas colecciones)

---

## Tareas

| ID | Tarea | Estado | Verificación |
|---|---|---|---|
| B1 | Ficha del paciente de prueba corregida | ✅ | `consultationType: individual`, sin `familyUnit`; copia previa guardada |
| B2 | Documentar el esquema de las 35 colecciones | ⬜ | Un `docs/plan/ESQUEMA_DATOS.md` con campos, tipos y dueño por colección |
| B3 | Unificar `patient_id` / `user_id` | ⬜ | Decisión tomada y, si procede, migración ejecutada |
| B4 | Eliminar deuda Supabase (`PGRST116`) | ⬜ | `grep -r PGRST116 src` → 0 |
| B5 | Colecciones sin uso real: decidir | ⬜ | Lista revisada; las muertas, documentadas o retiradas |
| B6 | Borrado RGPD de un paciente completo | ⬜ | Un script borra todo rastro de un `patient_id` y deja acta en `audit_logs` |

---

## Detalle de las pendientes

### B2 · Esquema de colecciones

Partir del mapa de la Biblia (§5) y completarlo leyendo los `insert` reales del
código (los payloads están en las vistas y servicios). Documentar por colección:
campos, tipo, obligatoriedad, quién escribe y quién lee.

### B3 · `patient_id` vs `user_id`

El mismo paciente es `patient_id` en lo clínico y `user_id` en lo personal.
Funciona, pero ya produjo índices huérfanos con el nombre equivocado (D-04).

Opciones:
- **No migrar** y consagrar la convención (documentarla en B2 y en la Biblia):
  clínico → `patient_id`, personal → `user_id`. Coste cero, ambigüedad contenida.
- **Migrar todo a un solo nombre**: coste alto (35 colecciones, reglas, índices,
  consultas) y riesgo. Solo tiene sentido si molesta de verdad.

**Recomendación:** no migrar; consagrar la convención. Decisión de Emilio.

### B4 · Deuda Supabase

`PGRST116` (código de error de PostgREST) aparece en `App.jsx` (1) y
`firebaseAdapter.js` (3). El adaptador lo emite para imitar a Supabase y `App.jsx`
lo comprueba para saber si el perfil no existe. Sustituir por un código propio
(`NOT_FOUND`) en el adaptador y en sus consumidores.

### B6 · Borrado RGPD

`PacientePerfilView` ya intenta borrar 4 colecciones (y estaba roto hasta D-01),
pero el rastro real de un paciente toca ~16 colecciones con `patient_id` y ~12
con `user_id`. Hace falta un procedimiento único y completo, que borre también
Storage y deje acta inmutable del borrado.

---

## Registro del bloque

| Fecha | Cambio |
|---|---|
| 2026-08-31 | Hallazgo para B6: `PacientePerfilView` borra `consents` al ejercer el derecho de supresión, y las reglas lo **deniegan** (`allow update, delete: if false`, ley L5). El borrado RGPD no puede hacerse desde el cliente: necesita una función con credenciales de administración. Además, un consentimiento es la prueba de que hubo permiso: se conserva aunque se borre el expediente. |
| 2026-08-31 | B1 cerrada. Residuo de menor eliminado del perfil real (D-14), copia en scratchpad. |

> **NOTA EMILIO:**
>
>
