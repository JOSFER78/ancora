# 25 · Primer sprint de reconstrucción

## Objetivo del sprint

Dejar el repo preparado para que el resto del desarrollo no sea caótico.

Duración sugerida: 1 semana.

Resultado esperado: repo limpio, rutas claras, módulos no clínicos archivados, permisos base y una primera versión navegable de landing + app paciente + panel psicólogo sin funcionalidades falsas.

---

## Sprint 1 — Tareas

### Tarea 1 — Crear rama y snapshot del prototipo

- Crear tag `prototype-2026-06`.
- Crear rama `rebuild/product-core`.
- Añadir `docs/legacy-prototype.md` con resumen de qué hay en el prototipo.

**Aceptación:** el equipo puede volver al prototipo si necesita consultar una pantalla.

---

### Tarea 2 — Archivar módulos no clínicos

Mover a `_archive/`:

- `tradingview-mcp/`
- `src/components/trading/`
- `src/views/TradingView.jsx`
- scripts `test_bingx*`, `launch_tradingview*`, `iniciar_*` no necesarios,
- documentos personales dentro de `datos/` que no sean documentación de producto.

**Aceptación:** `npm run build` no importa módulos archivados.

---

### Tarea 3 — Limpiar `App.jsx`

Eliminar:

- `MOCK_PROFILES` productivo,
- correos hardcodeados,
- `isSuperAdmin` por email,
- estado de deudas,
- DOM MutationObserver de dinero,
- navegación personal.

Crear:

- `src/app/AppShell.jsx`,
- `src/app/AppRouter.jsx`,
- `src/app/auth/useSessionProfile.js`,
- `src/app/permissions/usePermissions.js`.

**Aceptación:** `App.jsx` queda por debajo de 150 líneas y solo monta providers/rutas.

---

### Tarea 4 — Crear rutas públicas y privadas

Implementar rutas:

- `/`
- `/login`
- `/registro`
- `/app/hoy`
- `/app/chat`
- `/pro/dashboard`
- `/pro/pacientes`
- `/admin/dashboard`

**Aceptación:** navegar por URL funciona y respeta permisos.

---

### Tarea 5 — Demo fixtures seguros

Crear:

```text
src/demo/patients.js
src/demo/psychologists.js
src/demo/clinicalEvidence.js
src/demo/patient360.js
```

Los datos deben ser ficticios y no basados en personas reales.

**Aceptación:** modo demo carga sin Firebase y sin localStorage clínico.

---

### Tarea 6 — Redefinir navegación

Paciente:

- Hoy,
- Chat,
- Diario,
- Timeline,
- Documentos,
- Sesiones,
- Privacidad.

Psicólogo:

- Dashboard,
- Pacientes,
- Agenda,
- SOAP,
- Pagos,
- Perfil.

Admin:

- Verificación,
- Usuarios,
- Auditoría,
- Sistema.

**Aceptación:** no aparecen módulos ajenos a Áncora.

---

### Tarea 7 — Landing v1 correcta

Reescribir `LandingView` con contenido prudente.

Debe decir:

- IA supervisada, no terapeuta IA.
- Memoria persistente.
- Psicólogo humano validando.
- Privacidad por diseño.
- Paciente y psicólogo tienen rutas separadas.

**Aceptación:** no hay claims de curación, diagnóstico automático ni sustitución del profesional.

---

### Tarea 8 — Patient 360 estático/demo

Crear una primera pantalla con datos demo:

- resumen de 30 segundos,
- cambios recientes,
- riesgos,
- objetivos,
- citas literales,
- documentos,
- propuestas pendientes.

**Aceptación:** sirve como contrato visual para conectar luego con datos reales.

---

### Tarea 9 — README realista

Sustituir README actual por uno que diga:

- qué está implementado,
- qué es prototipo,
- qué requiere backend real,
- cómo ejecutar,
- variables de entorno,
- limitaciones actuales,
- hoja de ruta.

**Aceptación:** no promete 100% IA local si el repo usa OpenRouter temporalmente.

---

### Tarea 10 — Checklist de seguridad inicial

Añadir `docs/security-checklist.md` con:

- no datos personales en repo,
- no secrets,
- no logs clínicos,
- RLS obligatoria,
- env vars documentadas,
- soporte sin acceso clínico.

**Aceptación:** el repo puede compartirse con un desarrollador sin exponer datos reales.

---

## Entregables del sprint

- Repo clínico limpio.
- Rutas base.
- Landing correcta.
- Dashboard paciente base.
- Dashboard psicólogo base.
- Patient 360 demo.
- README honesto.
- Módulos personales archivados.

---

## No hacer en este sprint

- No implementar pagos completos.
- No construir IA local real.
- No hacer app nativa.
- No integrar wearables.
- No optimizar diseño fino.
- No añadir features nuevas antes de limpiar.

---

## Criterio de éxito

Al final del sprint, cualquier desarrollador debe poder abrir el repo y entender:

1. qué es Áncora,
2. qué rutas existen,
3. qué módulos son clínicos,
4. qué datos son demo,
5. qué falta para producción.
