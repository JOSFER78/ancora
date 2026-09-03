# Bloque A — Infraestructura

> Dónde vive la aplicación y con qué credenciales habla.
> **Criterio de cierre:** ninguna credencial viva en repo ni bundle; el endpoint
> de IA no responde a peticiones anónimas; `firebase deploy` es reproducible
> desde el repo sin perder nada.

**Estado del bloque:** 🟡 6 de 9 tareas cerradas
**Depende de:** nada (es la base)
**Bloquea a:** C (acceso), D7 (voz a voz)

---

## Tareas

| ID | Tarea | Estado | Verificación |
|---|---|---|---|
| A1 | Reglas de Firestore desplegadas | ✅ | Script anónimo: 8/8 accesos clínicos denegados |
| A2 | 24 índices declarados y desplegados | ✅ | `firebase deploy --only firestore:indexes` sin cambios pendientes |
| A3 | `firebase.json` completo restaurado | ✅ | Bloques `auth`, `firestore`, `headers` presentes |
| A4 | Sitios de hosting sobrantes | ✅ | Solo quedan `ancora-portal` y el por defecto (imborrable, D-17) |
| A5 | Clave de IA fuera del código y del bundle | ✅ | `grep freellmapi- dist/assets/*.js` → 0 |
| A6 | **Rotar la clave antigua de FreeLLMAPI** | ⬜ | La nueva funciona y la vieja devuelve 401 |
| A7 | Borrar los 5 índices huérfanos | ⬜ | `firestore:indexes` sin `userId`/`conversationId` camelCase |
| A8 | Proteger el endpoint del router | ⬜ | `curl` sin credencial → 401/403 |
| A9 | Endpoint de token efímero para voz en directo | ⬜ | Un navegador abre WebSocket a Deepgram sin la clave maestra |

---

## Detalle de las pendientes

### A6 · Rotar la clave de FreeLLMAPI

La clave `freellmapi-bc5d…` viajó incrustada en cada build público y sigue en 2
commits del historial (`a61683c`, `bf1ab35`). **Debe considerarse comprometida.**

1. Generar clave nueva en el panel de FreeLLMAPI.
2. Revocar la antigua.
3. Poner la nueva en `.env.local` como `VITE_AI_API_KEY` (el código ya la lee de ahí).
4. Verificar: el motor antiguo responde con la nueva; con la vieja, 401.

*Nota: reescribir el historial de git (filter-repo) es opcional; con la clave
revocada, el historial deja de ser un riesgo.*

### A7 · Índices huérfanos

Cinco índices apuntan a campos que el código no usa (`userId`, `conversationId`
en camelCase, `patient_id` en `agent_tasks`/`mente_sources` donde el código usa
`user_id`). Borrado:

```bash
npx firebase-tools@latest deploy --only firestore:indexes --project ayuda-emilio-83261 --force
```

⚠️ `--force` borra TODO índice no declarado en `firestore.indexes.json`. Revisar
antes que el archivo declare los 24 buenos (lo hace desde el 31-08-2026).

### A8 · Proteger el endpoint del router

Hoy `POST /v1/chat/completions` responde **sin credencial** y con
`Access-Control-Allow-Origin: *`: cualquiera puede gastar la cuota. Dos opciones
(decisión pendiente, ver PARTE III del plan maestro):

- **Opción clave:** activar la validación de la API key ya creada. Contención
  débil: en una SPA la clave acaba en el bundle.
- **Opción bloqueo por dominio (mejor):** validar el encabezado `Origin` en
  nginx/router y limitar peticiones por IP. La clave deja de ser el único muro.

### A9 · Token efímero para voz en directo

Deepgram streaming (`wss://api.deepgram.com/v1/listen`) exige credencial en el
navegador. La vía correcta: un endpoint en el router que llame a
`POST /v1/auth/grant` de Deepgram y devuelva un token de corta vida al cliente
autenticado. Sin esto, D7 (voz a voz agéntica) queda bloqueado.

---

## Registro del bloque

| Fecha | Cambio |
|---|---|
| 2026-08-31 | A1-A5 cerradas. Reglas verificadas con script anónimo. 24 índices desplegados. Sitio `tevaatocarllorarotravez` borrado (D-18). |

> **NOTA EMILIO:**
>
>
