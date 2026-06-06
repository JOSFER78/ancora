# Informe de traspaso: webayudatra / fallo de sincronizacion de Mente

Fecha: 2026-05-26  
Workspace: `C:\Users\yo\Pictures\Descargaspc\0a\webayudatra`  
App local: `http://localhost:5180/`  
Supabase project ref: `ysnorelkaccaikvuqgnv`  
No incluir ni imprimir `SUPABASE_ACCESS_TOKEN`.

## Resumen ejecutivo

La app es un producto React/Vite conectado a Supabase. Se esta convirtiendo de una app personalizada de Josfer a una app generica privada por usuario, con un modo especial para `josferestudio@gmail.com`.

El problema activo es el boton de sincronizacion de Mente. Al pulsar `Analizar todo desde 0`, el modal queda bloqueado en progreso inicial, normalmente `12%`, con texto tipo `Analizando todo desde 0...` o `Preparando lote...`, y no aparecen elementos revisados. El usuario indica que solo hay unos 12 archivos, asi que no deberia tardar indefinidamente.

Se desplegaron migraciones y la Edge Function en Supabase, pero la sincronizacion sigue sin funcionar desde la UI. La causa probable esta en la Edge Function `chat-terapeuta`, dentro del action `sync_clinical_profile`, no en la pantalla modal.

## Stack y scripts

Proyecto:

```json
{
  "name": "webayudatra",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.106.2",
    "lucide-react": "^1.16.0",
    "react": "^19.2.6",
    "react-dom": "^19.2.6"
  },
  "devDependencies": {
    "supabase": "^2.101.0",
    "vite": "^8.0.12"
  }
}
```

Supabase client:

- `src/supabaseClient.js`
- URL remota: `https://ysnorelkaccaikvuqgnv.supabase.co`
- El frontend usa `supabase.functions.invoke('chat-terapeuta', { body })` mediante helper.

## Estado git actual

Hay un working tree sucio con muchos cambios. No revertir nada sin pedir permiso.

Archivos modificados importantes:

- `src/App.jsx`
- `src/views/MenteView.jsx`
- `src/views/ChatView.jsx`
- `src/views/AjustesView.jsx`
- `src/views/DashboardView.jsx`
- `src/views/LoginView.jsx`
- `src/views/EscudoLegalView.jsx`
- `src/components/trading/BingXWidget.jsx`
- `src/components/trading/ViabilityWidget.jsx`
- `supabase/functions/chat-terapeuta/index.ts`
- `index.html`
- `package.json`
- `package-lock.json`

Archivos nuevos relevantes:

- `src/appConfig.js`
- `src/lib/chatTerapeuta.js`
- `src/views/LandingView.jsx`
- `supabase/migrations/20260526000000_user_data_isolation.sql`
- `supabase/migrations/20260526010000_mente_sync_status.sql`
- `handoff_sync_issue_report.md`

Tambien hay scripts temporales y logs sin versionar:

- `test_sync_real.cjs`
- `test_prepare_and_close.cjs`
- `test_docx.cjs`
- `supabase_logs.txt`
- `supabase_serve.txt`
- `project_context.md`
- otros.

## Cambios ya hechos

### 1. App generica y privada por usuario

Se empezo a limpiar la app para que usuarios normales vean menus genericos:

- `Panel`
- `Contexto`
- `Chat`
- `Diario`
- `Documentos`
- `Ajustes`

Se mantuvieron modulos privados para Josfer cuando `appMode.showPersonalModules` lo permite.

Se limpiaron textos corruptos de codificacion tipo `AnÃ¡lisis`, `SesiÃ³n`, `ðŸ...`. Una busqueda posterior no encontraba restos de `Ã`, `Â`, `ðŸ`, `â€`, etc. en `index.html`, `src` ni en `supabase/functions/chat-terapeuta/index.ts`.

### 2. Helper central para Edge Function

Archivo: `src/lib/chatTerapeuta.js`

Funcion:

```js
export async function invokeChatTerapeuta(body) {
  const timeoutMs = body?.action === 'sync_clinical_profile' ? 180000 : 90000;
  ...
  supabase.functions.invoke('chat-terapeuta', { body })
}
```

Reemplaza llamadas directas a:

```txt
https://ysnorelkaccaikvuqgnv.supabase.co/functions/v1/chat-terapeuta
```

Uso actual:

- `src/views/MenteView.jsx`
- `src/views/ChatView.jsx`
- `src/views/AjustesView.jsx`
- `src/components/trading/BingXWidget.jsx`
- `src/components/trading/ViabilityWidget.jsx`

### 3. Modelos

En `supabase/functions/chat-terapeuta/index.ts`:

```ts
const TEXT_MODEL = "deepseek/deepseek-v4-pro";
const EXTRACTION_MODEL = "google/gemini-2.5-flash";
const MENTE_SYNC_BATCH_SIZE = 3;
```

DeepSeek V4 Pro se usa para texto, chat, cierres y sincronizacion. Gemini 2.5 Flash queda para extraccion de PDF/imagenes/audio segun flujo existente.

### 4. Migraciones Supabase

Migraciones creadas:

- `supabase/migrations/20260526000000_user_data_isolation.sql`
- `supabase/migrations/20260526010000_mente_sync_status.sql`

Aplicadas en remoto mediante Supabase Management API. Historial remoto verificado:

```json
[
  {"version":"20260526185600","name":"20260526000000_user_data_isolation"},
  {"version":"20260526185612","name":"20260526010000_mente_sync_status"}
]
```

Columnas remotas verificadas:

```txt
conversations.context_sync_run_id
conversations.context_sync_status
conversations.context_synced_at
mente_sources.analysis_run_id
mente_sources.analyzed_at
mente_sources.extracted_text
mente_sources.extraction_error
mente_sources.extraction_status
mente_sources.sync_status
profiles.app_config
profiles.contexto_terapeutico
```

### 5. Edge Function desplegada

Funcion remota:

- slug: `chat-terapeuta`
- status: `ACTIVE`
- verify_jwt: `true`
- version actual desplegada: `68`
- project ref: `ysnorelkaccaikvuqgnv`

Ultimo deploy se hizo con Management API:

```powershell
curl.exe -X POST `
  -H "Authorization: Bearer $env:SUPABASE_ACCESS_TOKEN" `
  -F "metadata=@$metadataPath;type=application/json" `
  -F "file=@supabase/functions/chat-terapeuta/index.ts;filename=index.ts;type=application/typescript" `
  "https://api.supabase.com/v1/projects/$ref/functions/deploy?slug=chat-terapeuta"
```

No usar ni mostrar el token.

## Estado exacto del flujo de sincronizacion

### Frontend

Archivo: `src/views/MenteView.jsx`

Puntos importantes:

- Importa `invokeChatTerapeuta`.
- `handleSyncProfile` ahora llama directamente:

```js
startSyncProcess(true, 'all');
```

- Eso evita que el usuario elija incremental por defecto.
- `startSyncProcess(resetOption, onlyOption)` llama:

```js
invokeChatTerapeuta({
  action: 'sync_clinical_profile',
  reset: resetOption && isFirstCall,
  only: onlyOption
});
```

- El modal empieza en `12%` y muestra `Analizando todo desde 0...`.
- Cuando la funcion no responde, el modal queda ahi, sin `processedItems`.

Opciones viejas del modal siguen existiendo en el JSX:

- incremental: `startSyncProcess(false, 'all')`
- completa: `startSyncProcess(true, 'all')`
- solo documentos: `startSyncProcess(false, 'sources')`

Pero el boton principal ya no abre ese selector; inicia completa.

### Backend / Edge Function

Archivo: `supabase/functions/chat-terapeuta/index.ts`

Hay dos bloques `if (action === "sync_clinical_profile")`:

1. Bloque nuevo, activo, empieza cerca de la linea 1618.
2. Bloque viejo, muerto o inalcanzable, empieza cerca de la linea 1993.

El primer bloque devuelve respuesta antes de llegar al segundo, asi que el segundo no deberia ejecutarse. Aun asi, mantener dos implementaciones con el mismo action dificulta depurar y conviene eliminar o aislar la vieja cuando se arregle el fallo.

El bloque nuevo hace:

- Lee `OPENROUTER_API_KEY`.
- Lee `mente_sources`, `profiles`, `conversations`.
- Construye `stableCtx = stripSyncRun(originalCtx)`.
- Si `reset=true`, usa modo `complete`.
- Si hay `sync_run` activo y no es reset, lo reutiliza.
- Crea `syncRun` con:

```ts
queue_sources
queue_conversations
processed_sources
processed_conversations
error_sources
error_conversations
draft_context
```

- Filtra `remainingItems`.
- Si `remainingItems.length <= 12`, actualmente fuerza lote de 1:

```ts
const effectiveBatchSize = remainingItems.length <= 12 ? 1 : MENTE_SYNC_BATCH_SIZE;
const batchItems = remainingItems.slice(0, effectiveBatchSize);
```

Esto se hizo para evitar que el primer lote fuera demasiado grande y bloqueara el navegador.

Despues por cada item:

- Si es source: `getSourceTextForSync(...)`
- Si es conversation: `fetchConversationMessages(...)` y `buildConversationContextText(...)`
- Si hay texto, llama a OpenRouter:

```ts
callOpenRouter(TEXT_MODEL, ..., 45000, openrouterApiKey)
```

- Fusiona resultado en `finalCtx`.
- Marca fuentes/conversaciones como `analyzed` o `error`.
- Guarda en `profiles.contexto_terapeutico`.

Punto critico:

El usuario sigue viendo bloqueo antes de que aparezca el primer elemento procesado. Eso implica que la primera llamada a `sync_clinical_profile` no devuelve pronto. Puede estar bloqueando en:

- `getSourceTextForSync` para el primer archivo.
- Extraccion Gemini de PDF/imagen.
- Descarga/lectura del contenido base64 desde `mente_sources.text_content`.
- Llamada `callOpenRouter` a DeepSeek.
- Guardado/fusion del perfil.
- Un `sync_run` activo antiguo en `profiles.contexto_terapeutico` que deja la cola en estado incoherente.

## Sospechas tecnicas principales

### Sospecha 1: falta instrumentacion visible

La UI solo sabe que llamo a la funcion. No recibe eventos intermedios. Si la funcion tarda 45-180s, el modal parece congelado. Aunque haya `12%`, no hay polling ni logs visibles.

Solucion recomendada:

- Hacer que la primera llamada solo prepare la cola y devuelva inmediatamente.
- Crear action separado `sync_clinical_profile_step`.
- El frontend llama step por step y actualiza el modal tras cada respuesta.

### Sospecha 2: `getSourceTextForSync` puede tardar o colgarse con el primer archivo

Si el primer item es PDF o imagen grande, Gemini/OpenRouter puede tardar demasiado. Incluso con batch size 1, la primera llamada puede quedar bloqueada.

Solucion recomendada:

- Antes de llamar a modelos, devolver listado de cola con IDs/nombres/tipos.
- Extraer texto en action independiente por archivo.
- Guardar `extraction_status`.
- No llamar a DeepSeek hasta que todos los textos esten `ready`.

### Sospecha 3: duplicidad de `sync_clinical_profile`

Aunque el segundo bloque no deberia ejecutarse, tener dos implementaciones con el mismo action es un riesgo. La vieja usa otra logica y textos mojibake parcialmente viejos.

Solucion recomendada:

- Eliminar el bloque viejo o renombrarlo temporalmente a `sync_clinical_profile_legacy`.
- Dejar una sola fuente de verdad.

### Sospecha 4: estado `sync_run` activo en perfil

El contexto puede tener:

```json
{
  "sync_run": {
    "status": "active",
    ...
  }
}
```

En reset deberia ignorarlo, pero si hubo un intento incompleto podria quedar una cola vieja o `draft_context` pesado.

Solucion recomendada:

- Crear action `reset_mente_sync_state` para borrar solo `contexto_terapeutico.sync_run`.
- O ejecutar SQL puntual:

```sql
update profiles
set contexto_terapeutico = contexto_terapeutico - 'sync_run'
where id = '<USER_ID>';
```

No ejecutar sin confirmar usuario exacto.

### Sospecha 5: timeout del helper demasiado largo para UX

`src/lib/chatTerapeuta.js` usa 180s para `sync_clinical_profile`. Si la funcion se bloquea, el usuario espera demasiado.

Solucion recomendada:

- Reducir timeout de sync a 60s durante depuracion.
- Mostrar error recuperable con detalle.
- Añadir boton `Cancelar / cerrar` que no deje la UI atrapada.

## Validaciones ya hechas

Compilacion frontend:

```powershell
npm run build
```

Resultado: correcto. Vite build paso. Aviso de chunk grande, no bloqueante.

Parse/bundle de Edge Function:

```powershell
npx esbuild supabase/functions/chat-terapeuta/index.ts --bundle --platform=neutral --format=esm --external:https://esm.sh/* --outfile=$env:TEMP\chat-terapeuta-edge-check.js
```

Resultado: correcto despues de los cambios.

Diff check:

```powershell
git diff --check -- src/views/MenteView.jsx supabase/functions/chat-terapeuta/index.ts
```

Resultado: correcto, solo warnings CRLF.

Browser:

- `http://localhost:5180/` carga.
- Titulo: `Espacio Privado de Contexto`.
- No habia errores de consola tras recarga antes de la prueba de sync.
- El fallo aparece al ejecutar el sync.

## Recomendacion concreta para la siguiente IA

No seguir cambiando el porcentaje del modal. El problema no es visual. Hay que separar la sincronizacion en fases observables.

Plan tecnico recomendado:

1. Crear action `prepare_mente_sync`.
   - Entrada: `{ reset, only }`.
   - Limpia `sync_run` si reset.
   - Construye cola con `sources` y `conversations`.
   - Guarda `sync_run`.
   - Devuelve inmediatamente `{ totalCount, pendingItems }`.

2. Crear action `process_mente_sync_item`.
   - Toma solo el siguiente item pendiente.
   - Si es documento, extrae texto y lo deja `extracted_text`.
   - Si es conversacion, genera texto con mensajes.
   - Devuelve `{ processedItem, remainingCount, errorItems }`.
   - No consolida todo el mapa todavia.

3. Crear action `consolidate_mente_sync`.
   - Toma todos los `extracted_text` listos y sesiones procesadas.
   - Llama a DeepSeek una sola vez o en partes controladas.
   - Guarda `profiles.contexto_terapeutico`.
   - Marca `sync_run.status = completed`.

4. En UI:
   - `startSyncProcess` debe hacer `prepare`.
   - Luego bucle de `process item`.
   - Mostrar nombre real de archivo/sesion en cada paso.
   - Al final llamar `consolidate`.
   - Si un paso falla, mostrar el nombre y permitir continuar con el siguiente.

5. Eliminar o renombrar el segundo bloque `sync_clinical_profile` antiguo.

6. Añadir logs temporales claros en Edge Function:

```ts
console.log("[mente-sync] prepare", { userId, reset, only });
console.log("[mente-sync] queue", { sources: queueSources.length, conversations: queueConversations.length });
console.log("[mente-sync] item:start", { type: item.type, id: item.id, name: item.name });
console.log("[mente-sync] item:text-ready", { id: item.id, chars: cleanText.length });
console.log("[mente-sync] openrouter:start", { model: TEXT_MODEL });
console.log("[mente-sync] openrouter:done", { chars: replyText?.length || 0 });
```

No loguear datos privados ni contenido de documentos.

## Comandos utiles para la siguiente IA

Ver estado:

```powershell
git status --short
```

Buscar flujo sync:

```powershell
rg -n "sync_clinical_profile|sync_run|MENTE_SYNC_BATCH_SIZE|invokeChatTerapeuta" src/views/MenteView.jsx src/lib/chatTerapeuta.js supabase/functions/chat-terapeuta/index.ts
```

Compilar frontend:

```powershell
npm run build
```

Validar Edge Function:

```powershell
npx esbuild supabase/functions/chat-terapeuta/index.ts --bundle --platform=neutral --format=esm --external:https://esm.sh/* --outfile=$env:TEMP\chat-terapeuta-edge-check.js
```

Deploy Edge Function con Management API:

```powershell
$ref = $env:SUPABASE_PROJECT_REF
$metadataPath = Join-Path $env:TEMP 'supabase_function_metadata.json'
[System.IO.File]::WriteAllText($metadataPath, '{"entrypoint_path":"index.ts","verify_jwt":true,"name":"chat-terapeuta"}', [System.Text.UTF8Encoding]::new($false))
curl.exe -sS -w "`nHTTP_STATUS:%{http_code}`n" -X POST -H "Authorization: Bearer $env:SUPABASE_ACCESS_TOKEN" -F "metadata=@$metadataPath;type=application/json" -F "file=@supabase/functions/chat-terapeuta/index.ts;filename=index.ts;type=application/typescript" "https://api.supabase.com/v1/projects/$ref/functions/deploy?slug=chat-terapeuta"
```

Consultar funcion remota:

```powershell
curl.exe -sS -H "Authorization: Bearer $env:SUPABASE_ACCESS_TOKEN" "https://api.supabase.com/v1/projects/$env:SUPABASE_PROJECT_REF/functions/chat-terapeuta"
```

Consultar migraciones remotas:

```powershell
curl.exe -sS -H "Authorization: Bearer $env:SUPABASE_ACCESS_TOKEN" "https://api.supabase.com/v1/projects/$env:SUPABASE_PROJECT_REF/database/migrations"
```

## Advertencias

- No imprimir `SUPABASE_ACCESS_TOKEN`.
- No hacer `git reset --hard`.
- No revertir cambios de usuario.
- La pagina privada de `josferestudio@gmail.com` no debe romperse.
- Trading/BingX debe quedar fuera de usuarios genericos, pero puede seguir para Josfer.
- Audio no se debia tocar salvo compatibilidad.
- La app generica no debe mostrar datos personales de Josfer ni textos clinicos asumidos.

## Estado final del problema

La infraestructura remota esta desplegada y la UI llama al action correcto, pero la sincronizacion de Mente sigue colgandose antes de completar el primer paso visible. La siguiente intervencion debe convertir la sincronizacion en un flujo por fases y no en una unica llamada larga a `sync_clinical_profile`.

