# Bloque E — Lógica de aplicación

> El pegamento entre los datos y la pantalla: `App.jsx`, hooks, adaptador, estado.
> **Criterio de cierre:** cero errores de `rules-of-hooks`; ningún dato real de
> usuarios en el bundle; navegación con URL propia por vista.

**Estado del bloque:** 🟡 5 de 8 tareas cerradas
**Depende de:** D
**Bloquea a:** F

---

## Tareas

| ID | Tarea | Estado | Verificación |
|---|---|---|---|
| E1 | 50 referencias indefinidas corregidas | ✅ | `eslint src` sin `no-undef` |
| E2 | Consultas acotadas al propietario (3 fugas) | ✅ | Dashboard psicólogo y gastos filtran por dueño |
| E3 | 5 × `rules-of-hooks` (`useState` condicional en `LegalModals.jsx`) | ✅ | `eslint` sin esa regla |
| E4 | 34 × `set-state-in-effect` | ⬜ | Bajar el contador a 0 |
| E5 | 15 × `immutability` + 5 × `purity` | ⬜ | Bajar a 0 |
| E6 | 4 × `no-dupe-keys` | ✅ | 0 en todo el proyecto |
| E7 | Router de verdad (URL por vista) | ⬜ | Refrescar el navegador conserva la vista |
| E8 | Datos personales fuera del bundle | ✅ | `grep -c "gmail.com\|Emilio Naranjo" dist/assets/*.js` → 0 |

---

## Detalle de las pendientes

### E3 · `useState` condicional (bug real)

`LegalModals.jsx:24-30`: cinco `useState` llamados condicionalmente. Rompe la
regla fundamental de React: si el orden de hooks cambia entre renders, el estado
se corrompe. Mover los `useState` arriba del early-return.

### E4 · `setState` síncrono en efectos

34 casos que provocan renders en cascada. Patrón de arreglo: derivar el valor en
render, o inicializar en el `useState(() => …)`, o suscribirse al sistema externo
correctamente. Ir archivo por archivo; no es urgente pero sí constante.

### E6 · Claves duplicadas (bug real)

`AgentesView.jsx:3595-3596` (`border`, `background`) y `LandingView.jsx:1102,1194`
(`background` dos veces en el mismo objeto de estilo): una de las dos declaraciones
se pierde en silencio. Decidir cuál vale y borrar la otra.

### E7 · Router

Hoy la navegación es `activeTab` en `App.jsx`: sin URLs, sin historial, refrescar
te devuelve al inicio. Introducir `react-router` (o wouter, más ligero) por fases:
primero rutas paralelas al `activeTab`, después retirar el estado.

### E8 · Datos personales fuera del bundle · ✅ HECHA

Era más grande de lo que decía este plan: **52 apariciones** de correos reales
repartidas por 10 archivos, no solo los `MOCK_PROFILES` de `App.jsx`.

Lo que se hizo:
- **Perfiles de demostración inventados.** El modo demo no toca Firestore, así
  que nunca necesitó los UID, correos, fotos de Google ni números de colegiado
  de las tres personas reales. Ahora son «Ana Demo» y compañía.
- **El rol ya no se decide por correo.** `firebaseAdapter` asignaba
  `role: 'supervisor'` según una lista de correos. Además de la fuga, era un
  error: las reglas de Firestore prohíben crear un perfil con rol privilegiado,
  así que un alta nueva por esa vía habría sido rechazada por el servidor. El
  rol sale del perfil, que es lo que las reglas aplican.
- **Los filtros de pacientes van por rol**, no por listas de correos y UID
  escritos a mano que habrían dejado de funcionar con el segundo profesional.
- **El nombre del paciente ya no es el valor por defecto de nadie.** Aparecía
  como nombre de respaldo en el panel del psicólogo y firmando las plantillas
  de escritos al INSS y a la Inspección de Trabajo.
- **Las notas SOAP de la demo no las firma un colegiado real.** Atribuían
  diagnósticos inventados a una persona identificable, con su número de
  colegiado al lado.
- **Un solo psicólogo por defecto**, en `DEFAULT_PSICOLOGO_ID`, en vez de nueve
  copias del mismo identificador por cinco vistas.

Lo que se queda a propósito: el nombre del psicólogo que supervisa la
plataforma en los textos legales —el RGPD exige decir quién responde— y su
ficha profesional en el catálogo, que es lo que el paciente ve para elegir.

---

## Registro del bloque

| Fecha | Cambio |
|---|---|
| 2026-08-31 | E8 cerrada. Al quitar la asignación de rol por correo apareció un fallo de fondo: el cliente escribía `role: 'supervisor'`, que las reglas de Firestore rechazan. Funcionaba de casualidad porque los perfiles ya existían, creados desde la línea de comandos. |
| 2026-08-31 | E3 y E6 cerradas: los 5 `useState` de `LegalModals` suben antes del return condicional, y las 4 claves duplicadas resueltas conservando el valor que ganaba. Lint: 423 → 409. |
| 2026-08-31 | E1-E2 cerradas (D-01, D-02). Lint global: de 471 a 423 problemas. |

> **NOTA EMILIO:**
>
>
