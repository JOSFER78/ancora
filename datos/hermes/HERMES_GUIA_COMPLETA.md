# Hermes Agent en Windows: guia completa de instalacion estable, perfiles, gateway, Desktop, modelos y memoria

Fecha de redaccion: 2026-06-01  
Sistema objetivo principal: Windows 10/11, Hermes Agent nativo, Hermes Desktop, dashboards locales, OpenRouter/Nous, Telegram y ByteRover.

Este documento no es una guia generica de "instala Hermes y ya". Esta escrito para un caso real donde Hermes CLI, Hermes Desktop, gateway, dashboard nativo, `nesquena/hermes-webui`, Telegram, modelos y memoria conviven en la misma maquina y pueden desincronizarse si se tratan como una sola app.

La idea central:

- Hermes funciona mejor cuando separas responsabilidades.
- El chat diario, el gateway siempre activo, los dashboards y las pruebas de modelos no deben depender del mismo proceso ni del mismo estado vivo.
- Cambiar un modelo en una sesion no es lo mismo que cambiar el modelo global.
- Desktop y CLI pueden compartir configuracion, pero no siempre comparten sesion activa, cache ni ciclo de vida.
- Los perfiles son la forma oficial de separar memoria, sesiones, skills, configuracion y gateway.

## Fuentes usadas y como leerlas

Fuentes del usuario:

- `C:\Users\yo\Pictures\Descargaspc\0a\webayudatra\datos\hermes\hermes-problemas.md`
- `C:\Users\yo\Pictures\Descargaspc\hermes-problemas.md`
- Video 1: [Hermes Agent video - tmh6jqocd1Q](https://www.youtube.com/watch?v=tmh6jqocd1Q&t=113s)
- Video 2: [Hermes Agent video - qthG136KThM](https://www.youtube.com/watch?v=qthG136KThM&pp=ugUHEgVlcy1FUw%3D%3D)

Fuentes oficiales o primarias:

- [Hermes Agent Windows Native Guide](https://hermes-agent.nousresearch.com/docs/user-guide/windows-native)
- [Hermes Agent profiles](https://hermes-agent.nousresearch.com/docs/user-guide/profiles/)
- [Hermes Agent configuring models](https://hermes-agent.nousresearch.com/docs/user-guide/configuring-models)
- [Nous Portal integration](https://hermes-agent.nousresearch.com/docs/integrations/nous-portal)
- [OpenRouter Free Models Router](https://openrouter.ai/docs/guides/routing/routers/free-router)
- [GitHub issue #17080 sobre conflictos de perfiles y credenciales exclusivas](https://github.com/NousResearch/hermes-agent/issues/17080)
- [GitHub issue #22502 sobre profile switching y gateway/webui](https://github.com/NousResearch/hermes-agent/issues/22502)
- [Hermes Agent API server](https://hermes-agent.nousresearch.com/docs/user-guide/features/api-server)
- [Hermes Agent installation](https://hermes-agent.nousresearch.com/docs/getting-started/installation)
- [Hermes Agent messaging gateway y systemd](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/messaging/index.md)
- [Hermes Agent multi-profile gateways](https://hermes-agent.nousresearch.com/docs/user-guide/multi-profile-gateways)
- [Hermes Agent Google Gemini](https://hermes-agent.nousresearch.com/docs/guides/google-gemini)
- [Hermes Agent providers](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/integrations/providers.md)
- [Hermes Agent OAuth over SSH](https://hermes-agent.nousresearch.com/docs/guides/oauth-over-ssh)
- [GitHub issue #5910 sobre OAuth providers ocultos en model picker](https://github.com/NousResearch/hermes-agent/issues/5910)
- [GitHub issue #5223 sobre openai-codex omitido en gateway model picker](https://github.com/NousResearch/hermes-agent/issues/5223)
- [OpenAI: usar Codex con tu plan de ChatGPT](https://help.openai.com/en/articles/11369540-using-codex-with-your-chatgpt-plan)
- [OpenAI: Codex CLI y Sign in with ChatGPT](https://help.openai.com/en/articles/11381614-api-codex-cli-and-sign-in-with-chatgpt)
- [Gemini CLI authentication](https://google-gemini.github.io/gemini-cli/docs/get-started/authentication.html)
- [Gemini CLI quotas and pricing](https://google-gemini.github.io/gemini-cli/docs/quota-and-pricing.html)
- [GitHub: nesquena/hermes-webui](https://github.com/nesquena/hermes-webui)
- [Open WebUI: OpenAI-compatible providers](https://docs.openwebui.com/getting-started/quick-start/connect-a-provider/starting-with-openai-compatible)
- [Oracle Cloud Always Free Resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)

Fuentes de comunidad y videos resumidos:

- [OpenClawDatabase: Hermes Agent Complete Setup Guide](https://openclawdatabase.com/news/videos/2026-05-26-hermes-agent-setup-complete-guide/)
- [OpenClawDatabase: Hermes local/private/free con Ollama](https://openclawdatabase.com/news/videos/2026-04-08-hermes-agent-setup-gemma-4-local-free/)
- [Reddit: when to use multiple profiles](https://www.reddit.com/r/hermesagent/comments/1tqwoza/when_to_use_multiple_profiles/)
- [Reddit: stable version of Hermes](https://www.reddit.com/r/hermesagent/comments/1t6rf6h/stable_version_of_hermes/)
- [Reddit: Hermes Agent WebUI](https://www.reddit.com/r/hermesagent/comments/1scttjs/hermes_agent_webui/)
- [Reddit: Hermes with Open WebUI, drawbacks](https://www.reddit.com/r/hermesagent/comments/1tt6bpt/hermes_with_open_webui_any_drawbacks/)
- [Reddit: Best webUI for Hermes](https://www.reddit.com/r/hermesagent/comments/1ts21bm/best_webui_for_hermes/)

Notas de fiabilidad:

- Las fuentes oficiales tienen prioridad.
- GitHub issues sirven para detectar riesgos reales, aunque algunos esten cerrados o no planificados.
- Reddit se usa como experiencia de comunidad, no como verdad tecnica definitiva.
- Las paginas de resumen de videos ayudan cuando el transcript directo de YouTube no esta disponible; no sustituyen a la documentacion oficial.

## Mapa mental de Hermes

Hermes Agent no es una sola pantalla. En una instalacion real de Windows puedes tener al menos estas piezas:

| Pieza | Que es | Estado/ciclo de vida | Riesgo tipico |
|---|---|---|---|
| `hermes chat` / TUI | Chat interactivo en terminal | Proceso vivo mientras la terminal esta abierta | Usa el modelo con el que arranco; no re-lee todo en caliente |
| Hermes Desktop | App Electron/desktop | Tiene cache y estado propio del frontend | Puede mostrar estado viejo o quedarse en una sesion atascada |
| Gateway | Proceso que atiende Telegram, Discord, API server, etc. | Debe vivir aparte como tarea/servicio/proceso controlado | Si esta parado, Desktop/API/mensajeria pueden fallar aunque CLI responda |
| Dashboard nativo | UI web de Hermes | Proceso aparte, normalmente en un puerto local | No siempre equivale al chat CLI |
| `nesquena/hermes-webui` | WebUI comunitario | Proceso Node/Python aparte | Puede apagarse por endpoint shutdown o perder estado de proceso |
| Providers | OpenRouter, Nous, OpenAI Codex, Gemini, Ollama, etc. | Credenciales y modelo en config/auth | Provider autenticado no implica modelo valido |
| Perfiles | Separacion oficial de config, memoria, skills, sesiones y gateway | Cada perfil tiene su propio estado | Clonar mal puede duplicar tokens de Telegram/Discord |
| Memoria | `memories/`, `SOUL.md`, skills, sesiones, ByteRover/Hindsight | Persistente, pero no siempre compartida entre perfiles | Mezclar memoria de chat y de gateway causa comportamiento confuso |
| ByteRover | Hub de memoria/contexto externo | Proyecto propio por ruta | Si no se enlaza, no comparte memoria con Hermes |

Regla practica:

- `CLI responde` no significa `Desktop responde`.
- `Gateway instalado` no significa `Gateway corriendo`.
- `Modelo cambiado en UI` no significa `sesion abierta cambiada`.
- `Provider autenticado` no significa `Tool Gateway disponible`.

## Tu estado real detectado

Segun las comprobaciones locales hechas durante el diagnostico:

| Elemento | Estado detectado |
|---|---|
| Configuracion principal | `C:\Users\yo\AppData\Local\hermes\config.yaml` |
| Provider actual | `openrouter` |
| Modelo actual | `deepseek/deepseek-v4-flash` |
| Fallback provider | `openrouter` |
| Gateway | Instalado como `Hermes_Gateway`, pero en la ultima comprobacion no habia proceso vivo |
| API server | Configurado en `127.0.0.1:8642` |
| Nous Portal | Autenticado, pero sin creditos usables para Tool Gateway gestionado |
| OpenAI Codex | Ya no aparecia autenticado en Hermes en la ultima comprobacion |
| Telegram | Configurado |
| Dashboards | Hay archivos y directorios en `C:\Users\yo\AppData\Local\hermes` |
| `start-all.bat` | Existe, pero lanza dashboards y deja el gateway comentado |

Actualizacion de estado detectada el 2026-06-02:

| Elemento | Estado detectado |
|---|---|
| Hermes local | `v0.15.2 (2026.5.29.2)` |
| Actualizacion disponible | `434 commits behind`; conviene actualizar antes de depurar OAuth/model picker |
| Provider activo | OpenRouter |
| Modelo activo | `deepseek/deepseek-v4-flash` |
| `google-gemini-cli` | Si aparece en `hermes auth list` con OAuth Google PKCE para `josferestudio@gmail.com` |
| `openai-codex` | No esta autenticado ahora; `hermes status` dice "No Codex credentials stored" |
| `nous` | Aparece en `hermes auth list`, pero `hermes status` reporta refresh-token revocado por reuse |
| Gateway | Parado; manager actual `manual process` |
| Lectura correcta | Que un provider este en `auth.json` no garantiza que Desktop, nesquena o `/model` lo listen correctamente |

Esto importa porque tu documento antiguo decia que todo estaba activo, pero el estado real actual ya no coincide totalmente.

## Diferencias entre el documento viejo y el estado actual

Tu `hermes-problemas.md` documentaba una solucion valida para un momento concreto: dashboards activos, gateway activo y providers configurados. El problema es que Hermes es un sistema vivo; el estado puede cambiar entre sesiones.

Cambios importantes detectados:

| Tema | Documento viejo | Estado actual observado | Lectura correcta |
|---|---|---|---|
| Gateway | Activo en `8642` | Instalado, pero sin proceso detectado | Hay que verificar con `hermes gateway status` antes de asumir |
| OpenAI Codex | Rate-limited | No autenticado | Hay que reautenticar si se quiere usar Codex |
| Modelo principal | Varias referencias | `deepseek/deepseek-v4-flash` por OpenRouter | El modelo global actual es OpenRouter/DeepSeek |
| `start-all.bat` | Solucion de estabilidad | Lanza dashboards; gateway comentado | Util para UI, incompleto para API/Desktop/gateway |
| Providers | "No se perdieron" | Algunos siguen, otros no | `auth.json` debe verificarse con `hermes status` y `hermes auth list` |

Conclusion:

El MD viejo es historico y util, pero no debe ser tratado como estado actual. La guia estable debe incluir comandos de verificacion antes de tomar decisiones.

## Instalacion estable en Windows

La documentacion oficial indica que Hermes corre nativamente en Windows 10/11. El instalador de PowerShell instala en `%LOCALAPPDATA%\hermes`, agrega `hermes` al PATH de usuario y provisiona dependencias como Python, Node y PortableGit cuando hace falta.

Instalacion base:

```powershell
iex (irm https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.ps1)
```

Despues de instalar:

```powershell
Get-Command hermes
hermes --version
hermes status
hermes doctor
```

Si `hermes` no aparece:

```powershell
& "$env:LOCALAPPDATA\hermes\bin\hermes.cmd" --version
```

Luego cierra y abre PowerShell. No intentes arreglar PATH a mano salvo que sepas exactamente que estas cambiando.

Rutas importantes en tu instalacion:

| Ruta | Uso |
|---|---|
| `C:\Users\yo\AppData\Local\hermes\hermes-agent` | Codigo e instalacion de Hermes |
| `C:\Users\yo\AppData\Local\hermes\config.yaml` | Configuracion principal local |
| `C:\Users\yo\AppData\Local\hermes\.env` | Variables y tokens locales |
| `C:\Users\yo\AppData\Local\hermes\auth.json` | OAuth y credenciales gestionadas |
| `C:\Users\yo\AppData\Local\hermes\logs\agent.log` | Log principal |
| `C:\Users\yo\AppData\Local\hermes\sessions` | Sesiones CLI/gateway |
| `C:\Users\yo\AppData\Local\hermes\webui` | Estado del WebUI |
| `C:\Users\yo\AppData\Roaming\hermes-desktop` | Cache/estado de Hermes Desktop |

Nota: la guia oficial de Windows menciona `%USERPROFILE%\.hermes` como ubicacion de datos en algunas configuraciones. En tu maquina, el estado operativo real que hemos visto esta en `%LOCALAPPDATA%\hermes`. Para tu caso, manda la evidencia local: usa `hermes status` y las rutas detectadas.

## Arquitectura recomendada para tu caso

Tu problema no se arregla con "abre la app otra vez". Se arregla con separacion de responsabilidades.

Arquitectura recomendada:

| Rol | Nombre sugerido | Funcion | Modelo recomendado | Debe tener gateway |
|---|---|---|---|---|
| Config/base | `default` | Reparar, setup, auth, pruebas, dashboard | Modelo fiable, no necesariamente barato | No obligatorio |
| Chat diario | `chat` | Conversaciones normales, tareas rapidas, bajo coste | OpenRouter barato o `openrouter/free` para pruebas | No |
| Gateway | `gateway` | Telegram/API server/gateway estable | Modelo fiable y con buen tool calling | Si |
| Investigacion/codigo | `research` o `coder` | Tareas largas, codigo, busqueda, analisis | Modelo mas fuerte | Opcional |

Por que esto es estable:

- Si el chat se rompe, no mata Telegram.
- Si cambias modelo para probar, no rompes el gateway.
- Si Desktop queda con cache vieja, el gateway sigue vivo.
- Si un dashboard hace shutdown, no afecta al proceso principal.
- Si OpenRouter free falla o rate-limitea, solo afecta al perfil barato.

## Perfiles de Hermes

La documentacion oficial dice que un perfil tiene su propio `config.yaml`, `.env`, `SOUL.md`, memorias, sesiones, skills, cron jobs y estado de gateway. Eso es exactamente lo que necesitas si quieres una "version para chat" y otra "para otras configuraciones".

Crear perfiles:

```powershell
hermes profile create chat
hermes profile create gateway
hermes profile create admin
```

Ver perfiles:

```powershell
hermes profile list
hermes profile show chat
hermes profile show gateway
```

Usar un perfil explicito:

```powershell
hermes -p chat chat
hermes -p gateway gateway status
hermes -p admin status
```

Hacer que un perfil sea el default temporal:

```powershell
hermes profile use chat
```

Recomendacion practica:

- No uses `--clone-all` para perfiles que vayan a tener gateway propio.
- Evita clonar tokens exclusivos de Telegram, Discord, Slack o WhatsApp.
- Si clonas config, revisa `.env` y desactiva plataformas que no deban compartir token.
- Un token de Telegram no debe estar siendo usado por dos gateways a la vez.

Riesgo documentado en GitHub:

El issue `#17080` explica que clonar perfiles puede copiar tokens exclusivos (`TELEGRAM_BOT_TOKEN`, `DISCORD_BOT_TOKEN`, `SLACK_APP_TOKEN`, etc.) y provocar fallos de gateway. La recomendacion estable es tratar esos tokens como identidad unica por perfil/gateway.

## Modelos: global, sesion viva y gateway

Hermes tiene tres niveles que se confunden mucho:

| Nivel | Como se cambia | A quien afecta |
|---|---|---|
| Modelo global | `hermes model` o dashboard Models | Nuevas sesiones |
| Modelo de sesion viva | `/model` dentro de `hermes chat` | Solo esa sesion |
| Modelo de gateway | Config al crear nuevas sesiones de plataforma | Nuevas conversaciones del gateway; reiniciar fuerza lectura |

La documentacion oficial indica que cuando cambias el modelo desde dashboard o `hermes model`, Hermes escribe en `config.yaml`, pero las sesiones abiertas mantienen el modelo con el que arrancaron.

Comandos:

```powershell
hermes model
hermes status
hermes chat
```

Dentro de una sesion:

```text
/model openrouter/free --provider openrouter
/model deepseek/deepseek-v4-flash --provider openrouter
```

Si quieres que el gateway lea cambios globales:

```powershell
hermes gateway restart
```

Regla:

- Para probar modelos: usa perfil `admin` o una sesion `chat`.
- Para el gateway: elige un modelo fiable y no lo cambies cada rato.
- Para ahorrar: configura auxiliares baratos o un perfil `chat` barato, no sacrifiques el gateway.

## OpenRouter, modelos free y coste

OpenRouter tiene dos rutas distintas:

| Opcion | Significado | Uso recomendado |
|---|---|---|
| `openrouter/free` | Router que elige un modelo free disponible al azar segun capacidades | Pruebas, bajo coste, chat no critico |
| `modelo:free` | Variante gratis de un modelo concreto | Cuando quieres control sobre el modelo |
| `openrouter/auto` | Router automatico que puede usar modelos de pago | No usar si quieres coste cero estricto |
| Modelo de pago concreto | `deepseek/deepseek-v4-flash`, Claude, Gemini, GPT, etc. | Gateway estable, tareas serias |

Segun OpenRouter, `openrouter/free` selecciona automaticamente entre modelos gratuitos disponibles y la respuesta indica que modelo concreto se uso. Limitaciones esperables:

- Menores rate limits.
- Mas latencia.
- Disponibilidad variable.
- No controlas que modelo concreto se usa.
- Puede fallar si tu request requiere una capacidad que ningun free disponible soporta.

Para Hermes estable:

- `openrouter/free` es razonable para perfil `chat`.
- Para `gateway`, usa un modelo concreto y fiable.
- Para tareas largas, evita depender exclusivamente de modelos free.

Ejemplo para perfil barato:

```powershell
hermes -p chat model
```

Selecciona OpenRouter y usa `openrouter/free` si Hermes lo permite en el selector o via `/model`.

Ejemplo para perfil gateway:

```powershell
hermes -p gateway model
```

Selecciona un modelo concreto, por ejemplo `deepseek/deepseek-v4-flash` si te funciona bien, o uno superior si necesitas mas fiabilidad.

## Nous Portal

Nous Portal se configura con:

```powershell
hermes setup --portal
```

Segun la documentacion oficial, esto hace OAuth, configura Nous como provider y puede activar Tool Gateway si la cuenta tiene acceso. En tu caso se detecto:

- Nous Portal autenticado.
- Sin creditos utilizables para Tool Gateway gestionado.

Interpretacion:

- Puedes tener Nous autenticado y aun asi no tener web/image/TTS/browser gestionados.
- Si no hay creditos, no cuentes con Tool Gateway de Nous para automatizaciones.
- Para modelos gratis, OpenRouter free puede ser mas practico.

## OpenAI Codex

En diagnosticos anteriores se habia usado OpenAI Codex y `gpt-5.5`. En el estado mas reciente, Hermes ya no mostraba Codex autenticado.

Si quieres volver a usarlo:

```powershell
hermes model
```

Selecciona OpenAI Codex y completa OAuth si aparece. Luego valida:

```powershell
hermes status
hermes chat -q "responde solo: ok" -Q --max-turns 1
```

No lo uses como supuesto en scripts hasta que `hermes status` confirme que esta autenticado.

## Gemini OAuth y OpenAI Codex OAuth

Hermes puede usar modelos de suscripcion/OAuth, pero hay que distinguirlos de los proveedores con API key. En tu caso esto importa porque antes usaste `gpt-5.5`/Codex y Gemini durante mucho tiempo, pero ahora Desktop y `nesquena/hermes-webui` no los muestran de forma clara.

### Estado real detectado de OAuth

Comprobacion local del 2026-06-02:

| Elemento | Estado |
|---|---|
| Hermes | `v0.15.2 (2026.5.29.2)` |
| Version | `434 commits behind`; hay fixes recientes sobre OAuth/model picker |
| Provider activo | OpenRouter |
| Modelo activo | `deepseek/deepseek-v4-flash` |
| `google-gemini-cli` | Aparece en `hermes auth list` con OAuth Google PKCE |
| `openai-codex` | No autenticado ahora |
| `nous` | Credencial presente, pero refresh token revocado |
| Gateway | Parado, manager `manual process` |

Conclusion: no es correcto decir "se perdio todo". Lo correcto es:

- Gemini OAuth parece seguir almacenado.
- Codex necesita reautenticacion.
- Nous necesita reautenticacion si quieres usarlo.
- Desktop/WebUI pueden no listar providers OAuth aunque `auth.json` tenga credenciales.

### Diferencia entre providers parecidos

| Provider | Autenticacion | Donde vive la credencial | Usa limites de suscripcion | Uso recomendado |
|---|---|---|---|---|
| `openai-codex` | OAuth/device-code con ChatGPT/Codex | `C:\Users\yo\AppData\Local\hermes\auth.json` | Si, limites Codex/agentic usage del plan ChatGPT | Usar modelos Codex/GPT de tu suscripcion para chat/agentes |
| `openai-api` | API key OpenAI normal | `C:\Users\yo\AppData\Local\hermes\.env` | No, factura API | Produccion/API si quieres facturacion controlada |
| `google-gemini-cli` | OAuth Google PKCE/Cloud Code Assist | `auth.json` de Hermes | Puede usar limites tipo Gemini CLI/Code Assist | Chat/agentes con cuota Gemini CLI/Code Assist |
| `gemini` | API key Google AI Studio | `.env` con `GEMINI_API_KEY` o `GOOGLE_API_KEY` | No usa la suscripcion web igual que OAuth; usa cuota/API | Camino oficial de menor riesgo para produccion |
| OpenRouter con GPT/Gemini | API key OpenRouter | `.env` con `OPENROUTER_API_KEY` | No usa tus suscripciones directas ChatGPT/Gemini | Router flexible, modelos free/pago |

Regla practica:

- OAuth de Codex/Gemini intenta aprovechar el acceso de una cuenta/suscripcion.
- API key usa facturacion/cuota API.
- OpenRouter usa OpenRouter, aunque el nombre del modelo diga GPT o Gemini.

### `auth.json` vs `.env`

No mezcles estos dos archivos:

| Archivo | Contenido | Ejemplos |
|---|---|---|
| `C:\Users\yo\AppData\Local\hermes\auth.json` | Tokens OAuth, device-code, credential pool | `openai-codex`, `google-gemini-cli`, `nous`, `xai-oauth` |
| `C:\Users\yo\AppData\Local\hermes\.env` | API keys y variables de entorno | `OPENROUTER_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_API_KEY` |

Si `hermes auth list` muestra un provider OAuth, significa que hay una credencial guardada. No significa necesariamente que:

- el provider sea el activo;
- el token no haya expirado;
- el selector de modelos lo liste;
- Desktop lo refresque;
- el gateway lo vea si corre con otro usuario/perfil.

### Comandos seguros de diagnostico

Estos comandos no deberian iniciar OAuth ni cambiar tokens:

```powershell
hermes --version
hermes status
hermes auth list
hermes auth status openai-codex
hermes auth status google-gemini-cli
hermes model --refresh
```

Lectura:

- `hermes auth list` muestra credenciales almacenadas.
- `hermes status` muestra provider activo y errores de auth reales.
- `hermes model --refresh` limpia cache del selector y vuelve a consultar catalogos.

### Actualizacion recomendada antes de tocar OAuth

Tu Hermes local esta cientos de commits por detras. Como hay issues cerradas sobre providers OAuth que no aparecen en `/model`, conviene actualizar antes de reautenticar una y otra vez.

No ejecutes esto sin aceptar que actualiza Hermes:

```powershell
hermes --version
hermes status
New-Item -ItemType Directory -Force "$env:LOCALAPPDATA\hermes\backups"
Copy-Item "$env:LOCALAPPDATA\hermes\auth.json" "$env:LOCALAPPDATA\hermes\backups\auth-before-oauth-fix-$(Get-Date -Format yyyyMMdd-HHmmss).json"
Copy-Item "$env:LOCALAPPDATA\hermes\config.yaml" "$env:LOCALAPPDATA\hermes\backups\config-before-oauth-fix-$(Get-Date -Format yyyyMMdd-HHmmss).yaml"
hermes update
hermes model --refresh
```

Por que:

- GitHub issue #5910 documenta providers OAuth ocultos en `/model` aunque existan en `auth.json`.
- GitHub issue #5223 documenta `openai-codex` omitido en el picker del gateway.
- Una version vieja puede hacerte pensar que la credencial no existe cuando el fallo es el selector.

### Recuperacion segura de Codex

Codex en Hermes usa `openai-codex`, no `openai-api`.

Segun la documentacion de Hermes, OpenAI Codex autentica con device-code: Hermes muestra una URL/codigo, entras con tu cuenta de ChatGPT/Codex y guarda credenciales en `auth.json`. No necesitas instalar Codex CLI para que Hermes funcione, aunque Hermes puede importar credenciales existentes si las hay.

Reautenticar:

```powershell
hermes auth add openai-codex --type oauth --label codex
```

Despues refrescar selector:

```powershell
hermes model --refresh
```

En el TUI elige:

- Provider: **OpenAI Codex**
- Modelo: el que aparezca en tu catalogo real, por ejemplo `gpt-5.4`, `gpt-5.4-mini` o equivalente actual.

Probar sin tocar el default global:

```powershell
hermes chat -q "responde solo: ok" -Q --max-turns 1 --provider openai-codex -m gpt-5.4
```

Si ese comando responde, Codex funciona desde CLI. Si Desktop o nesquena no lo muestran despues, el problema ya no es "Codex no funciona"; es UI/cache/model picker/gateway.

Importante sobre limites:

- Codex usa limites de Codex/agentic usage de tu plan ChatGPT.
- No es el mismo contador que el chat normal de ChatGPT.
- Tareas largas, contexto grande y agentes consumen mas cuota.
- Si alcanzas limite, puede hacer falta esperar reset, anadir creditos o cambiar a otro provider.

### Gemini OAuth vs Gemini API key

Hermes tiene dos caminos Gemini:

| Camino | Provider | Recomendacion |
|---|---|---|
| OAuth Gemini CLI/Code Assist | `google-gemini-cli` | Util si quieres usar cuotas tipo Gemini CLI/Code Assist |
| API key Google AI Studio | `gemini` | Camino oficial de menor riesgo para produccion |

La documentacion de Hermes avisa que `google-gemini-cli` usa el backend Cloud Code Assist y que Google puede tratar el uso del cliente OAuth de Gemini CLI desde software de terceros como delicado. Por eso:

- Para maxima estabilidad/legalidad tecnica: usa `gemini` con API key.
- Para aprovechar suscripcion/cuota estilo Gemini CLI: usa `google-gemini-cli`, sabiendo que puede romperse o requerir reauth.

Tu caso actual:

- `hermes auth list` ya muestra `google-gemini-cli`.
- Eso significa que antes se autentico con OAuth Google PKCE.
- Falta probar si el runtime todavia puede usarlo.

Probar Gemini OAuth sin cambiar default:

```powershell
hermes chat -q "responde solo: ok" -Q --max-turns 1 --provider google-gemini-cli
```

Si quieres seleccionarlo como default:

```powershell
hermes model --refresh
```

En el TUI elige:

- Provider: **Google Gemini (OAuth)**
- Modelo: el que Hermes muestre como disponible.

### Gemini API key como alternativa estable

Si Gemini OAuth no aparece o falla, usa Google AI Studio con API key:

```powershell
notepad "$env:LOCALAPPDATA\hermes\.env"
```

Anade una de estas variables:

```text
GEMINI_API_KEY=...
```

o:

```text
GOOGLE_API_KEY=...
```

Luego:

```powershell
hermes model --refresh
```

En el TUI elige:

- Provider: **Google AI Studio**
- Modelo Gemini disponible.

Esta via no usa de la misma forma tu suscripcion Gemini web/CLI. Usa cuota/API de Google AI Studio, pero suele ser la ruta mas estable y oficial para integraciones.

### Por que funciona en CLI pero no aparece en Desktop/WebUI

El orden correcto de diagnostico es:

```powershell
hermes auth list
hermes status
hermes chat -q "responde solo: ok" -Q --max-turns 1 --provider openai-codex -m gpt-5.4
hermes chat -q "responde solo: ok" -Q --max-turns 1 --provider google-gemini-cli
hermes gateway restart
hermes gateway status
```

Conclusiones:

- Si CLI responde con `--provider`, OAuth funciona.
- Si CLI responde pero Desktop/WebUI no lista el modelo, el problema es selector/cache/UI.
- Si `auth list` muestra credencial pero `status` dice no logueado, hay inconsistencia de auth store/provider resolution o token expirado/revocado.
- Si gateway falla y CLI funciona, reinicia gateway despues de cambiar provider/modelo.
- Si Desktop se queda con tres puntos, abre chat nuevo despues de validar CLI/gateway.
- Si `nesquena/hermes-webui` no lista un provider OAuth, no asumas que Hermes no lo soporta; puede ser limitacion de la UI.

Causas frecuentes:

| Sintoma | Causa probable | Solucion |
|---|---|---|
| Codex no aparece en Desktop/WebUI | Provider OAuth no refrescado en picker | `hermes model --refresh`, actualizar Hermes, reiniciar UI |
| `auth list` ve Gemini pero `status` no lo usa | Credencial guardada pero no provider activo | Probar con `--provider google-gemini-cli`; luego `hermes model --refresh` |
| CLI Codex responde, Telegram no | Gateway no ve la misma auth/config | Reiniciar gateway; verificar perfil/usuario/HERMES_HOME |
| Gateway dice no Codex credentials | Servicio corre con otro usuario o auth store distinto | Autenticar como el mismo usuario que ejecuta gateway |
| Nous aparece pero falla | Refresh token revocado | `hermes auth add nous` o `hermes model` para reauth |

### Oracle/Linux remoto y OAuth

Si mueves Hermes a Oracle/Linux, autentica OAuth como el mismo usuario que ejecuta Hermes y el servicio `systemd`.

Comandos remotos:

```bash
hermes auth add openai-codex --type oauth --label codex
hermes model --refresh
sudo hermes gateway restart --system
sudo hermes gateway status --system
```

OpenAI Codex usa device-code, asi que normalmente no necesita tunel SSH. Otros OAuth con callback loopback si pueden necesitar tunel o `--manual-paste`.

Regla critica:

- Si el gateway `--system` corre como `root`, pero autenticas como `ubuntu`, el servicio puede no ver `~ubuntu/.hermes/auth.json`.
- La solucion estable es que gateway y auth usen el mismo `HERMES_HOME` y el mismo usuario operativo.

## Gateway estable

El gateway es el proceso que conecta Hermes con plataformas y API server. Si esta parado:

- Telegram no responde.
- API server local puede no responder.
- Desktop puede quedarse pensando si depende del backend local.
- CLI puede seguir funcionando porque puede hablar directo con el provider.

Instalar:

```powershell
hermes gateway install
```

Arrancar:

```powershell
hermes gateway start
```

Estado:

```powershell
hermes gateway status
```

Reiniciar:

```powershell
hermes gateway restart
```

Healthcheck:

```powershell
Invoke-RestMethod http://127.0.0.1:8642/health
```

En Windows, la documentacion oficial explica que `hermes gateway install` usa Scheduled Tasks al inicio de sesion y puede caer a la carpeta Startup si `schtasks` esta bloqueado. Tambien explica que se usa `pythonw.exe` y procesos separados para evitar que Ctrl+C en una terminal mate el gateway.

Tu caso:

- `Hermes_Gateway` aparecia registrado.
- Pero `hermes gateway status` mostro "No gateway process detected".
- Por tanto, la tarea existe pero no garantiza proceso vivo.

Checklist de gateway:

```powershell
hermes gateway status
hermes gateway start
hermes gateway status
Invoke-RestMethod http://127.0.0.1:8642/health
```

Si sigue parado:

```powershell
Get-Content "$env:LOCALAPPDATA\hermes\logs\agent.log" -Tail 200
Get-Content "$env:LOCALAPPDATA\hermes\gateway_state.json"
```

Si el gateway dice que falta `API_SERVER_KEY`, revisa `.env` y no pegues la clave en chats publicos.

## Desktop vs CLI

El CLI y Desktop pueden compartir instalacion/configuracion, pero no son la misma sesion.

Situaciones normales:

| Sintoma | Explicacion probable |
|---|---|
| CLI responde pero Desktop no | Desktop tiene cache/sesion vieja o depende de gateway parado |
| Desktop muestra modelo viejo | La sesion viva no re-leyo config |
| Desktop dice gateway detenido pero CLI dice vivo | UI desincronizada o estado cacheado |
| Cambias modelo en CLI y Desktop no cambia | Cambio fue de sesion, no global |
| Desktop se queda con tres puntos | Sesion atascada, provider/modelo roto o gateway/API parado |

Procedimiento estable:

1. Verifica CLI:

```powershell
hermes chat -q "responde solo: ok" -Q --max-turns 1
```

2. Verifica gateway:

```powershell
hermes gateway status
```

3. Verifica modelo global:

```powershell
hermes status
```

4. Cierra Desktop completamente.

5. Si sigue mal, limpia cache del frontend con backup antes:

```powershell
Copy-Item "$env:APPDATA\hermes-desktop" "$env:APPDATA\hermes-desktop-backup-$(Get-Date -Format yyyyMMdd-HHmmss)" -Recurse
```

Luego limpiar solo cache/sesion, no `auth.json` de Hermes. Esto debe hacerse con cuidado y preferiblemente documentado antes.

### Como tratar Hermes Desktop de forma estable

Hermes Desktop conviene tratarlo como un cliente grafico, no como la fuente de verdad del sistema. La fuente de verdad operativa debe ser:

- `hermes status` para provider/modelo/configuracion.
- `hermes chat -q ...` para saber si el agente responde.
- `hermes gateway status` para saber si el gateway esta vivo.
- `Invoke-RestMethod http://127.0.0.1:8642/health` para saber si la API local responde.

Motivo: Desktop puede tener cache, sesiones antiguas y estado visual propio. Eso permite que ocurran situaciones aparentemente contradictorias:

- Desktop dice "gateway detenido", pero el proceso esta vivo.
- Desktop muestra tres puntos infinitos, pero el CLI responde.
- Desktop sigue en un chat antiguo con modelo anterior.
- Desktop no refresca tras cambiar provider/modelo desde terminal.

Regla estable:

1. Primero valida CLI y gateway.
2. Despues abre Desktop.
3. Si Desktop no responde, crea un chat nuevo.
4. Si sigue igual, cierra Desktop completamente y vuelve a abrirlo.
5. Si persiste, haz backup de cache antes de limpiar estado de UI.

Desktop es util para uso manual, pero no deberia ser el proceso encargado de mantener vivo Telegram, API local, dashboards o memoria compartida.

## Dashboards

Tienes al menos tres superficies de UI:

| UI | Puerto/ruta | Uso recomendado |
|---|---|---|
| Hermes Desktop | App instalada | Chat visual, config basica, comodidad |
| Dashboard nativo | `http://127.0.0.1:9120` | Ver estado, sesiones, modelos, diagnostico |
| `nesquena/hermes-webui` | `http://127.0.0.1:9119` | UI alternativa, gestion mas comoda de algunos flujos |

### El problema real de las interfaces

El problema no es que falte "una pantalla". El problema es que cada pantalla puede vivir en un proceso distinto, con cache distinta y con un nivel distinto de integracion con Hermes.

En la practica, ahora mismo no conviene asumir que existe una UI unica que sustituya perfectamente a CLI, Desktop, gateway, dashboard, memoria y perfiles. La forma estable es separar responsabilidades:

- CLI/TUI: diagnostico y verdad tecnica.
- Gateway/API: servicio local siempre vivo.
- Dashboard nativo: administracion y estado.
- Una UI diaria: solo una, elegida por comodidad.
- Desktop: cliente opcional, no supervisor del sistema.

Si instalas varias interfaces "para arreglar" Hermes, puedes terminar con mas piezas que fallan: mas puertos, mas terminales, mas caches y mas estados falsos.

### Comparativa de interfaces

| Opcion | Ventajas | Limites | Mejor uso | Estabilidad |
|---|---|---|---|---|
| CLI/TUI de Hermes | Es lo mas directo; muestra errores reales; no depende de Electron ni de un navegador | Menos comodo para uso diario largo | Diagnostico, pruebas, reparacion, sesiones tecnicas | Alta |
| Hermes Desktop | Comodo, visual, integrado en Windows | Puede quedarse en sesiones viejas, cachear estado o no reflejar bien gateway/modelo | Chat manual y configuracion ligera | Media |
| Dashboard nativo | Mas cercano a Hermes que una UI externa; util para diagnostico | No siempre es la interfaz mas amable para chatear | Admin, estado, sesiones, modelos, comprobaciones | Media-alta |
| `nesquena/hermes-webui` | UI web especifica para Hermes; segun su README busca paridad con CLI y uso desde navegador/movil | Repo externo, otro proceso, otro puerto, posible acoplamiento a cambios internos de Hermes | UI diaria si te resulta comoda y cubre tus flujos | Media |
| Open WebUI | Proyecto maduro y generico; soporta backends OpenAI-compatible | No es Hermes-nativo; puede no exponer memoria, perfiles, skills o controles propios de Hermes | UI diaria generica si Hermes expone API OpenAI-compatible estable | Media-alta |

### Sobre `nesquena/hermes-webui`

`nesquena/hermes-webui` es interesante porque esta pensado especificamente para Hermes, no para cualquier LLM. Su README lo presenta como una interfaz ligera para usar Hermes desde navegador o movil, con sesiones, workspace, modelo, perfil y controles visibles.

Ventaja real:

- Encaja mejor con Hermes que una UI generica.
- Puede ser mas agradable que Desktop si Desktop se queda colgado.
- Puede permitir trabajar desde navegador/movil.

Coste real:

- Es otra instalacion.
- Es otro proceso.
- Normalmente implica otro puerto, en tu caso `9119`.
- Si Hermes cambia internamente, una UI comunitaria puede romperse antes que el CLI.
- Si el gateway/API base esta mal, la UI tampoco va a arreglarlo.

Conclusion: es buena candidata como UI diaria, pero no debe ser la pieza central del sistema. La pieza central debe ser Hermes CLI + gateway/API.

### Sobre Open WebUI como alternativa

Open WebUI no es especifico de Hermes, pero su documentacion oficial confirma que puede conectarse a servidores OpenAI-compatible. Esto lo hace util si quieres una interfaz mas estandar y mantenida, siempre que Hermes exponga correctamente endpoints tipo:

- `/v1/models`
- `/v1/chat/completions`

Configuracion conceptual:

```text
Base URL: http://127.0.0.1:8642/v1
API Key: la clave local configurada para el API server de Hermes, si aplica
Modelo: el modelo que exponga Hermes o el alias configurado
```

Ventaja real:

- UI mas conocida y con mas comunidad.
- Buena opcion si quieres tratar Hermes como backend OpenAI-compatible.
- Puede ser mas estable como interfaz que una UI muy acoplada a internals de Hermes.

Limite real:

- No sustituye los controles especificos de Hermes.
- Puede no manejar bien perfiles, memoria, skills o sesiones Hermes.
- Es otra dependencia y normalmente otro puerto.
- Si quieres "Hermes completo", una UI generica no sera completa.

Conclusion: Open WebUI es buena alternativa si priorizas una interfaz estable de chat. No es la mejor fuente para administrar Hermes.

### Recomendacion contrastada

Para tu caso concreto, con Desktop dando problemas y `nesquena/hermes-webui` siendo mas amable pero incompleto, la arquitectura mas estable es:

1. Mantener `hermes` CLI/TUI como herramienta de diagnostico.
2. Mantener gateway/API en `127.0.0.1:8642` como nucleo estable.
3. Mantener dashboard nativo en `9120` para administracion y estado.
4. Elegir una sola UI diaria:
   - Opcion A: `nesquena/hermes-webui` en `9119` si quieres algo mas Hermes-nativo.
   - Opcion B: Open WebUI si prefieres una UI generica OpenAI-compatible.
   - Opcion C: Hermes Desktop solo si deja de quedarse colgado en tu maquina.
5. No ejecutar Desktop, `nesquena`, dashboard nativo y Open WebUI todos como solucion permanente si no sabes exactamente que rol cumple cada uno.

Decision practica recomendada ahora:

- Para trabajar estable: CLI + gateway + dashboard nativo.
- Para interfaz amable: sumar solo `nesquena/hermes-webui` o solo Open WebUI.
- Para Desktop: usarlo como cliente opcional, no como supervisor del gateway.

Tu `start-all.bat` actual:

- Lanza `nesquena/hermes-webui` en `9119`.
- Lanza dashboard nativo en `9120`.
- Tiene gateway comentado.

Eso es util para dashboards, pero no basta si Desktop/API/gateway dependen de `8642`.

Version conceptual recomendada para un futuro `start-stable.bat`:

1. Comprobar `hermes gateway status`.
2. Si no hay proceso, ejecutar `hermes gateway start`.
3. Esperar 3-5 segundos.
4. Probar `http://127.0.0.1:8642/health`.
5. Lanzar `nesquena/hermes-webui`.
6. Lanzar dashboard nativo.
7. Mostrar puertos y comandos de diagnostico.

No conviene que el dashboard, gateway y chat CLI vivan en la misma ventana de terminal.

Version mas estable si eliges solo una UI diaria:

1. Arrancar o verificar gateway/API `8642`.
2. Arrancar dashboard nativo `9120` solo si quieres diagnostico.
3. Arrancar una UI diaria:
   - `nesquena/hermes-webui` en `9119`, o
   - Open WebUI en su puerto configurado.
4. Mostrar claramente que Desktop queda fuera del arranque automatico.

Esto reduce estados falsos: si una UI falla, puedes probar directamente el gateway. Si el gateway responde, el problema esta en la UI. Si el gateway no responde, no pierdes tiempo tocando Desktop.

## Memoria

Hermes tiene varias capas de memoria/contexto:

| Capa | Para que sirve | Riesgo |
|---|---|---|
| Sesion viva | Conversacion actual | No se comparte automaticamente |
| `sessions/` | Historial persistente | Puede crecer y arrastrar estado viejo |
| `memories/` | Memoria persistente del agente | Debe separarse por perfil si hay roles distintos |
| `SOUL.md` | Personalidad/instrucciones base | Cambios afectan mejor a sesiones nuevas |
| Skills | Procedimientos reutilizables | Pueden divergir entre perfiles |
| ByteRover/Hindsight | Memoria externa/proyecto | Debe enlazarse explicitamente |

Tu caso con ByteRover:

- Se detecto un proyecto ByteRover para el repo.
- Se detecto otro proyecto ByteRover bajo `C:\Users\yo\AppData\Local\hermes\byterover`.
- Se enlazo la fuente `hermes` como conocimiento de solo lectura desde el proyecto actual en `.brv\sources.json`.

Regla practica:

- Si quieres perfiles con memoria separada: no compartas memoria externa.
- Si quieres varias interfaces con memoria comun: usa una memoria externa comun y documenta quien puede escribir.
- Para gateway estable, evita que el perfil gateway aprenda demasiadas reglas experimentales de tus pruebas de chat.

## Videos: que ideas rescatar

Video 1, segun el resumen indexado de OpenClawDatabase:

- Hermes tiene sentido como agente general siempre encendido.
- Su valor esta en memoria, skills, tareas de fondo y autonomia.
- Hermes no sustituye necesariamente a Codex/Claude Code; se complementan.
- Hermes puede construir/prototipar en segundo plano y luego otra herramienta refina.
- La eleccion de modelo importa: mejores modelos suelen funcionar mejor, pero cuestan mas.

Video 2/local privado, segun resumen indexado:

- Local/Ollama es viable si el modelo sigue instrucciones de herramientas.
- No basta que un modelo "hable bien"; debe poder usar herramientas y seguir pasos.
- Firecrawl self-hosted reduce coste/privacidad frente a APIs cloud.
- Hay que proteger Telegram con allowlist/user ID.
- Para modelos pequenos conviene reset de sesion y compresion de contexto.

Como aplicarlo a tu instalacion:

- Tu maquina Windows puede usar OpenRouter para flexibilidad y Hermes Desktop para comodidad.
- Para estabilidad real, el gateway debe ser un proceso controlado.
- Para coste bajo, usa `openrouter/free` o un perfil barato, no el gateway principal.
- Para privacidad fuerte, considera un perfil local con Ollama, pero no esperes la misma fiabilidad que modelos frontier.

## Seguridad

Hermes puede leer archivos, ejecutar comandos, usar navegador, conectarse a Telegram/Discord y manejar sesiones persistentes. Tratalo como una herramienta con permisos reales.

Practicas recomendadas:

- No pegues API keys en chats.
- Usa `.env` o el sistema de auth de Hermes.
- Protege Telegram con usuarios permitidos.
- No uses el mismo token de Telegram en dos gateways.
- No clones perfiles con credenciales exclusivas sin revisarlas.
- No arranques Hermes como administrador salvo que haya una razon concreta.
- Haz backup antes de limpiar `state.db`, `auth.json`, `.env`, `config.yaml` o caches de Desktop.
- Si un perfil tiene acceso a cosas sensibles, no lo uses para experimentar con modelos free desconocidos.

Backup minimo:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item "$env:LOCALAPPDATA\hermes\config.yaml" "$env:LOCALAPPDATA\hermes\backups\config-$stamp.yaml"
Copy-Item "$env:LOCALAPPDATA\hermes\auth.json" "$env:LOCALAPPDATA\hermes\backups\auth-$stamp.json"
Copy-Item "$env:LOCALAPPDATA\hermes\.env" "$env:LOCALAPPDATA\hermes\backups\env-$stamp.txt"
```

No subas esos backups a Git.

## Comandos esenciales

Diagnostico:

```powershell
hermes status
hermes doctor
hermes gateway status
hermes auth list
hermes model
```

Prueba de chat:

```powershell
hermes chat -q "responde solo: ok" -Q --max-turns 1
```

Gateway:

```powershell
hermes gateway install
hermes gateway start
hermes gateway restart
hermes gateway status
```

Perfiles:

```powershell
hermes profile list
hermes profile create chat
hermes profile create gateway
hermes profile show chat
hermes profile show gateway
```

Dashboards:

```powershell
C:\Users\yo\AppData\Local\hermes\start-all.bat
```

Healthcheck local:

```powershell
Invoke-RestMethod http://127.0.0.1:8642/health
```

Logs:

```powershell
Get-Content "$env:LOCALAPPDATA\hermes\logs\agent.log" -Tail 200
Get-Content "$env:LOCALAPPDATA\hermes\gateway_state.json"
```

Procesos:

```powershell
Get-Process | Where-Object {$_.ProcessName -match 'hermes|python|node'} | Select-Object ProcessName,Id,Path,MainWindowTitle
```

## Troubleshooting por sintomas

| Sintoma | Causa probable | Diagnostico | Solucion estable |
|---|---|---|---|
| Desktop no responde al chat | Gateway/API parado, sesion vieja, provider roto | `hermes gateway status`, `hermes status`, nuevo chat | Arrancar gateway, abrir nuevo chat, limpiar cache Desktop solo con backup |
| CLI responde pero Desktop no | CLI usa provider directo; Desktop depende de backend/local state | Prueba CLI con `hermes chat -q` | Separar: primero CLI, luego gateway, luego Desktop |
| Gateway dice instalado pero detenido | Scheduled Task existe, proceso no | `hermes gateway status` | `hermes gateway start`; revisar logs si cae |
| WebUI se apaga | Shutdown desde UI o proceso sin guardian | Logs del WebUI | Relanzar con `start-all.bat`; evitar depender de una sola ventana |
| Cambie modelo y no cambio el chat | Era sesion viva | Ver banner/modelo de la sesion | Usar `/model` dentro del chat o abrir nueva sesion |
| Telegram no responde | Gateway parado, token duplicado, allowlist, provider falla | `hermes gateway status`, `agent.log` | Gateway estable separado, token unico por perfil |
| OpenRouter free falla | Rate limit, modelo aleatorio no soporta tool calling, disponibilidad variable | Revisar respuesta/log | Usar modelo concreto para tareas serias |
| Nous no tiene herramientas | Cuenta sin creditos Tool Gateway | `hermes status` | Usar APIs propias o OpenRouter; comprar creditos si quieres Tool Gateway |
| Codex no aparece | OAuth no autenticado, selector cacheado o version antigua | `hermes auth status openai-codex`, `hermes model --refresh` | Backup, actualizar Hermes, `hermes auth add openai-codex --type oauth --label codex` |
| Codex funciona en CLI pero no en Telegram/gateway | Gateway usa otra config/auth store o no se reinicio | Probar CLI con `--provider openai-codex`; revisar `hermes gateway status` | Reiniciar gateway y verificar mismo usuario/perfil/HERMES_HOME |
| Gemini OAuth aparece en `auth list` pero no en UI | Credencial guardada pero provider no activo o UI incompleta | `hermes chat ... --provider google-gemini-cli` | Usar `hermes model --refresh`; si falla, probar API key `gemini` |
| Nous aparece pero falla refresh | Refresh token revocado o reutilizado por otro proceso | `hermes status`, `hermes auth status nous` | Reautenticar con `hermes auth add nous`; no compartir refresh token entre procesos |
| Caracteres raros en MD/log | Problema de encoding cp1252/UTF-8 | Ver consola/editor | Usar Windows Terminal y guardar UTF-8 |
| Perfil clonado rompe gateway | Token exclusivo duplicado | Revisar `.env` de perfiles | No clonar tokens; separar bot/token por perfil |

## Recomendacion final de interfaz estable

La mejor solucion no es "instalar mas interfaces". La mejor solucion es decidir que papel cumple cada una.

Arquitectura recomendada:

| Capa | Herramienta | Puerto | Obligatoria | Papel |
|---|---|---:|---|---|
| Nucleo | Hermes CLI/TUI | No aplica | Si | Diagnostico, reparacion, prueba real del agente |
| Servicio | Gateway/API server | `8642` | Si, si usas Desktop/API/Telegram/WebUI | Backend estable |
| Admin | Dashboard nativo | `9120` | Opcional pero recomendable | Ver estado, sesiones, modelos y diagnostico |
| UI diaria | `nesquena/hermes-webui` | `9119` | Opcional | Interfaz Hermes-especifica mas amable |
| UI diaria alternativa | Open WebUI | configurable | Opcional | Interfaz generica OpenAI-compatible |
| Cliente manual | Hermes Desktop | App | Opcional | Chat visual si no se queda colgado |

Decision recomendada para tu maquina:

1. No usar Desktop como fuente de verdad.
2. Usar `hermes gateway status` y `/health` como verdad del backend.
3. Dejar `9120` para dashboard/admin.
4. Elegir una sola UI diaria:
   - `nesquena/hermes-webui` si quieres algo mas integrado con Hermes.
   - Open WebUI si quieres una UI mas generica y mantenida.
5. Mantener CLI/TUI siempre disponible para diagnostico.

### Si quieres menos puertos

Minimo estable:

- CLI/TUI.
- Gateway/API `8642`.
- Desktop solo como cliente manual.

Mejor equilibrio:

- CLI/TUI.
- Gateway/API `8642`.
- Dashboard nativo `9120`.
- Una UI diaria opcional.

Mas comodo, pero mas piezas:

- Gateway/API `8642`.
- Dashboard nativo `9120`.
- `nesquena/hermes-webui` `9119` o Open WebUI.
- Desktop solo para pruebas puntuales.

No recomiendo ejecutar permanentemente Desktop + dashboard nativo + `nesquena` + Open WebUI si el objetivo es estabilidad. Ejecuta muchas superficies solo cuando estes comparando.

### Criterio para elegir UI diaria

Elige `nesquena/hermes-webui` si:

- Quieres algo pensado para Hermes.
- Te importa ver controles de Hermes mas cerca del flujo real.
- Aceptas depender de un repo comunitario y de un puerto extra.

Elige Open WebUI si:

- Quieres una UI generica mas conocida.
- Te basta usar Hermes como backend OpenAI-compatible.
- No necesitas administrar memoria/perfiles/skills desde esa UI.

Elige Hermes Desktop solo si:

- En tu maquina deja de quedarse colgado.
- Lo usas para chats manuales.
- No dependes de su pantalla para saber si el gateway esta vivo.

### Prueba objetiva para decidir

Durante una semana, usa este criterio:

```powershell
hermes chat -q "responde solo: ok" -Q --max-turns 1
hermes gateway status
Invoke-RestMethod http://127.0.0.1:8642/health
```

Si esos tres pasan pero una UI no contesta, el problema es la UI.

Si esos tres fallan, el problema es Hermes/gateway/provider, no la UI.

## Opcion servidor remoto Oracle Cloud Free Tier

Si quieres que Hermes sea mas estable que en Windows Desktop, la opcion mas limpia es mover el nucleo a un servidor Linux remoto y usar Windows solo como cliente. En ese modelo, Hermes vive 24/7 en Linux, el gateway se gestiona con `systemd` y las interfaces se conectan por SSH tunnel, Tailscale o HTTPS.

### Resumen corto

La arquitectura recomendada en Oracle Free Tier es:

```text
Oracle Cloud Ampere A1 ARM64 Ubuntu 24.04
        |
        |-- Hermes CLI/TUI
        |-- Hermes gateway como systemd service
        |-- API server local 127.0.0.1:8642
        |-- dashboard/webui opcional local al servidor
        |
Windows
        |
        |-- SSH tunnel / Tailscale
        |-- navegador / Open WebUI / Desktop remoto compatible
```

La version mas estable no es "Hermes Desktop instalado en el servidor". Es Hermes headless en Linux:

- Ubuntu 24.04 LTS ARM64 o Ubuntu 22.04 LTS ARM64.
- Instalador oficial Linux.
- Gateway como servicio `systemd`.
- API server en `127.0.0.1`.
- Acceso remoto por tunel, no exponiendo puertos internos.
- Modelos cloud por OpenRouter/Nous/OpenAI-compatible, no modelos locales pesados.

### Que da realmente Oracle Always Free

Segun la documentacion oficial de Oracle:

| Recurso | Limite Always Free relevante |
|---|---|
| Compute ARM | `VM.Standard.A1.Flex` |
| CPU/RAM total | 4 OCPU y 24 GB RAM totales por tenancy |
| Distribucion | Puede ser una VM grande o varias VMs pequenas |
| Arquitectura | ARM64, no x86_64 |
| Block Volume | 200 GB total Always Free, incluyendo boot volumes |
| Boot volume minimo/practico | 50 GB por instancia |
| Imagenes elegibles | Oracle Linux, Ubuntu, Oracle Linux Cloud Developer |
| Riesgo | Recursos Always Free inactivos pueden ser reclamados |

Matices importantes:

- Los 24 GB son generosos para Hermes + gateways + dashboards, pero no equivalen a tener GPU.
- Modelos locales grandes con Ollama iran lentos en CPU ARM. Para estabilidad, usa proveedores cloud.
- Algunas regiones tienen falta de capacidad para Ampere A1. Si no deja crear la VM, puede no ser fallo tuyo.
- Aunque sea Always Free, conviene poner alertas de presupuesto y no crear recursos fuera de los limites gratis.
- Oracle puede reclamar instancias Always Free que parezcan inactivas durante varios dias; por eso el backup de `~/.hermes` es obligatorio.

### Por que Linux remoto puede ser mas estable que Windows Desktop

| Tema | Windows Desktop actual | Oracle Linux remoto |
|---|---|---|
| Desktop | Electron/cache/sesiones viejas | No se usa como nucleo |
| Gateway | Scheduled Task puede confundir estado | `systemd` es el modelo nativo de servicio |
| Rutas | `%LOCALAPPDATA%`, PowerShell, encoding | `~/.hermes`, shell POSIX, logs claros |
| Puertos | Desktop/dashboard/webui en Windows | API local en servidor + tunel |
| Arranque | Depende de sesion usuario/Windows | Arranca al boot con system service |
| Diagnostico | Mezcla de CLI, Desktop y servicios | `journalctl`, `systemctl`, `hermes status` |

Conclusion practica: para un agente 24/7, Linux headless es mejor base que Hermes Desktop en Windows.

### Creacion recomendada de la VM

En Oracle Cloud Console:

1. Crear instancia Compute.
2. Shape: `VM.Standard.A1.Flex`.
3. OCPU/RAM: si sera la maquina principal de Hermes, usar `4 OCPU / 24 GB`.
4. Imagen: Ubuntu 24.04 LTS ARM64. Si algo falla con dependencias nuevas, usar Ubuntu 22.04 LTS ARM64.
5. Boot volume: 50 GB minimo; 100 GB si vas a guardar logs, repos y dashboards.
6. SSH key: usar clave propia, no password.
7. Red: subnet publica con public IPv4 si vas a entrar por SSH.
8. Security List/NSG: abrir solo SSH desde tu IP al principio.

No abras `8642`, `9119` ni `9120` a internet. Esos puertos deben quedar privados salvo que pongas reverse proxy HTTPS con autenticacion.

### Primer arranque de Ubuntu

Desde Windows:

```powershell
ssh -i C:\Users\yo\.ssh\oci_hermes.key ubuntu@IP_PUBLICA
```

Si usas Ubuntu, el usuario suele ser `ubuntu`. Si usas Oracle Linux, suele ser `opc`.

En el servidor:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git ca-certificates build-essential pkg-config libssl-dev python3-venv jq ufw
sudo timedatectl set-timezone Europe/Madrid
```

Firewall local basico:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status verbose
```

Ojo: en Oracle tambien debes revisar la Security List/NSG de la VCN. `ufw` no sustituye las reglas de red de OCI.

### Instalacion estable de Hermes en Linux

Instalacion oficial:

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
source ~/.bashrc
hermes --version
```

En servidor headless, si quieres reducir piezas al principio:

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash -s -- --skip-browser
source ~/.bashrc
```

Recomendacion:

- Primera instalacion: usar `--skip-browser` si solo quieres gateway/API/chat estable.
- Instalar browser automation despues si realmente lo necesitas.
- No mezclar instalacion manual, Docker y script oficial el mismo dia. Elige una ruta.

### Configuracion base

Comprobaciones:

```bash
hermes status
hermes doctor
hermes auth list
hermes model
```

Configurar proveedor/modelo:

```bash
hermes setup
hermes model
```

Para Oracle Free Tier, recomendacion de modelos:

- Usar OpenRouter/Nous/OpenAI-compatible para inferencia.
- Usar modelos concretos para gateway.
- Evitar `openrouter/auto` si quieres controlar coste.
- Usar `openrouter/free` solo para pruebas o perfil `chat`, no para el gateway principal.
- No intentar correr modelos locales grandes en CPU ARM si buscas estabilidad.

### API server y gateway

Para frontends tipo Open WebUI, LobeChat o clientes OpenAI-compatible, Hermes expone API compatible en `http://localhost:8642/v1` cuando el API server esta activo.

Config conceptual en `~/.hermes/.env`:

```bash
API_SERVER_ENABLED=true
API_SERVER_KEY=pon-una-clave-larga-local
```

Arrancar en primer plano para probar:

```bash
hermes gateway
```

En otra terminal SSH:

```bash
curl http://127.0.0.1:8642/health
curl http://127.0.0.1:8642/v1/models \
  -H "Authorization: Bearer pon-una-clave-larga-local"
```

Si responde, parar el foreground con `Ctrl+C` y pasar a servicio.

### Gateway como servicio systemd

En VPS/headless, usa servicio de sistema. La documentacion de Hermes recomienda servicio systemd de usuario para portatiles/dev boxes y `--system` para hosts headless que deben volver al arrancar.

Instalar y arrancar:

```bash
sudo hermes gateway install --system
sudo hermes gateway start --system
sudo hermes gateway status --system
```

Si `sudo hermes` no encuentra el comando porque Hermes quedo en `~/.local/bin`, comprueba la ruta:

```bash
which hermes
sudo env "PATH=$PATH" hermes gateway install --system
sudo env "PATH=$PATH" hermes gateway start --system
sudo env "PATH=$PATH" hermes gateway status --system
```

Logs:

```bash
journalctl -u hermes-gateway -f
```

Reinicio:

```bash
sudo hermes gateway restart --system
sudo hermes gateway status --system
```

No instales a la vez servicio de usuario y servicio `--system` salvo que sepas exactamente por que. Dos servicios pueden hacer ambiguo el diagnostico.

### Acceso desde Windows sin exponer puertos

Opcion recomendada: SSH tunnel.

```powershell
ssh -i C:\Users\yo\.ssh\oci_hermes.key `
  -N `
  -L 8642:127.0.0.1:8642 `
  -L 9120:127.0.0.1:9120 `
  -L 9119:127.0.0.1:9119 `
  ubuntu@IP_PUBLICA
```

Con ese tunel abierto, en Windows puedes usar:

- `http://127.0.0.1:8642/health`
- `http://127.0.0.1:9120` si el dashboard nativo corre en el servidor.
- `http://127.0.0.1:9119` si `nesquena/hermes-webui` corre en el servidor.
- Open WebUI local apuntando a `http://127.0.0.1:8642/v1`.

Alternativa mas comoda:

- Tailscale entre Windows y Oracle.
- Cloudflare Tunnel para una UI web.
- Reverse proxy Nginx/Caddy con HTTPS y autenticacion.

Pero para empezar, SSH tunnel es mas seguro y reversible.

### Dashboards en servidor remoto

Hay tres enfoques:

| Enfoque | Descripcion | Recomendacion |
|---|---|---|
| Sin dashboard | Solo CLI + Telegram/API | Maxima estabilidad |
| Dashboard nativo | Admin remoto por tunel a `9120` | Recomendado para diagnostico |
| `nesquena/hermes-webui` remoto | UI diaria por tunel a `9119` | Bueno si quieres interfaz web Hermes-especifica |
| Open WebUI | UI generica conectada a `8642/v1` | Bueno si quieres interfaz estandar |

Para Oracle, recomendacion estable:

1. Primero dejar gateway/API estable.
2. Despues activar dashboard nativo.
3. Solo despues elegir `nesquena` u Open WebUI como UI diaria.
4. No exponer ninguna UI sin auth/HTTPS.

### Telegram en Oracle

Telegram es buen caso de uso para Oracle porque no necesitas abrir un puerto entrante para recibir mensajes si el bot usa polling/cliente saliente.

Checklist:

```bash
hermes gateway setup
sudo hermes gateway restart --system
sudo hermes gateway status --system
journalctl -u hermes-gateway -f
```

Seguridad:

- Configurar allowlist de usuarios.
- No usar el mismo token de Telegram en Windows y Oracle a la vez.
- Si migras Telegram a Oracle, para el gateway de Windows.
- Mantener el perfil `gateway` remoto estable y no cambiarlo para pruebas de modelos.

### Perfiles remotos

En Oracle puedes usar la misma idea que en Windows:

```bash
hermes profile create chat
hermes profile create gateway
hermes profile list
```

Si quieres gateways por perfil, Hermes crea servicios systemd por perfil. Aun asi, empieza con uno:

- `default` o `admin`: configurar y reparar.
- `gateway`: Telegram/API siempre vivo.
- `chat`: pruebas de modelos baratos/free.

No clones tokens exclusivos entre perfiles. Telegram, Discord y similares deben tener un token/bot claro por gateway activo.

### Backups obligatorios

Oracle Free Tier es util, pero no lo trates como almacenamiento unico.

Backup local en el servidor:

```bash
mkdir -p ~/backups
tar -czf ~/backups/hermes-$(date +%F-%H%M).tgz ~/.hermes
ls -lh ~/backups
```

Descargar a Windows:

```powershell
scp -i C:\Users\yo\.ssh\oci_hermes.key ubuntu@IP_PUBLICA:/home/ubuntu/backups/hermes-*.tgz C:\Users\yo\Pictures\Descargaspc\backups\
```

Haz backup antes de:

- Cambiar providers.
- Migrar Telegram.
- Limpiar memoria/sesiones.
- Actualizar Hermes.
- Cambiar de UI diaria.

### Actualizacion segura

No actualices Hermes en el servidor sin poder volver atras.

Checklist:

```bash
hermes status
sudo hermes gateway status --system
tar -czf ~/backups/hermes-pre-update-$(date +%F-%H%M).tgz ~/.hermes
```

Despues actualiza siguiendo el mecanismo oficial disponible en tu version. Si existe `/update` desde gateway o comando CLI de update, usalo. Si no, revisa la documentacion actual antes de reinstalar encima.

Tras actualizar:

```bash
hermes doctor
hermes chat -q "responde solo: ok" -Q --max-turns 1
sudo hermes gateway restart --system
sudo hermes gateway status --system
curl http://127.0.0.1:8642/health
```

### Plan de migracion desde tu Windows actual

No migres todo de golpe. Hazlo en fases:

1. Crear VM Oracle.
2. Instalar Hermes en Linux.
3. Configurar OpenRouter/Nous sin copiar tokens innecesarios.
4. Probar CLI remoto.
5. Activar API server y healthcheck.
6. Instalar gateway `--system`.
7. Conectar Telegram con token nuevo o migrado.
8. Parar gateway de Windows si Telegram ya vive en Oracle.
9. Abrir UI remota por SSH tunnel.
10. Despues de una semana estable, decidir si Windows queda solo como cliente.

### Decision final para Oracle

La opcion mas estable para ti seria:

- Oracle Ubuntu 24.04 ARM64.
- Hermes Linux instalado con script oficial.
- Gateway `--system`.
- API server solo en localhost.
- OpenRouter/Nous como providers.
- Telegram en Oracle, no duplicado en Windows.
- Dashboard nativo solo para admin.
- Una UI diaria por tunel: `nesquena` u Open WebUI.
- Backups semanales de `~/.hermes`.

Esto resuelve la raiz de tus problemas actuales: separa el agente 24/7 de Hermes Desktop y de los estados raros de Windows.

## Rutina diaria recomendada

Al encender el PC:

```powershell
hermes status
hermes gateway status
```

Si el gateway esta parado:

```powershell
hermes gateway start
hermes gateway status
```

Abrir dashboards:

```powershell
C:\Users\yo\AppData\Local\hermes\start-all.bat
```

Probar chat:

```powershell
hermes chat -q "responde solo: ok" -Q --max-turns 1
```

Si Desktop falla:

1. Cerrar Desktop.
2. Confirmar que CLI responde.
3. Confirmar gateway.
4. Abrir Desktop.
5. Crear nuevo chat.

## Rutina semanal recomendada

Una vez por semana:

```powershell
hermes doctor
hermes status
hermes gateway status
```

Revisar:

- Modelo actual.
- Provider autenticado.
- Gateway vivo.
- Tamano de `state.db`.
- Logs con errores repetidos.
- Si OpenRouter free esta fallando demasiado.
- Si Desktop acumula sesiones atascadas.

Backup de configuracion:

```powershell
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
New-Item -ItemType Directory -Force "$env:LOCALAPPDATA\hermes\backups\$stamp"
Copy-Item "$env:LOCALAPPDATA\hermes\config.yaml" "$env:LOCALAPPDATA\hermes\backups\$stamp\config.yaml"
Copy-Item "$env:LOCALAPPDATA\hermes\auth.json" "$env:LOCALAPPDATA\hermes\backups\$stamp\auth.json"
Copy-Item "$env:LOCALAPPDATA\hermes\.env" "$env:LOCALAPPDATA\hermes\backups\$stamp\.env"
```

## Diseno recomendado de perfiles

### Perfil `default`

Uso:

- Configuracion base.
- Reparaciones.
- Pruebas de providers.
- Dashboard/admin.

No usar para:

- Telegram permanente.
- Experimentos peligrosos.
- Modelos free aleatorios en tareas criticas.

### Perfil `chat`

Uso:

- Chat diario.
- Consultas rapidas.
- Modelos baratos.
- `openrouter/free` si quieres coste cero.

Configuracion sugerida:

- Provider: OpenRouter.
- Modelo: `openrouter/free` o un `:free` concreto.
- Gateway: apagado.
- Memoria: separada o enlazada segun quieras continuidad.

### Perfil `gateway`

Uso:

- Telegram.
- API server.
- Integraciones.
- Automatizaciones.

Configuracion sugerida:

- Provider: OpenRouter con modelo concreto y fiable.
- No usar `openrouter/free` si necesitas estabilidad.
- Token de Telegram unico.
- Gateway instalado/arrancado para ese perfil.

### Perfil `research` o `coder`

Uso:

- Tareas largas.
- Codigo.
- Investigacion.
- Web y browser.

Configuracion sugerida:

- Modelo mas fuerte que el perfil `chat`.
- Auxiliares baratos para titulos, compresion y extract.
- Skills especializadas.

## Que no hacer

- No usar el mismo token de Telegram en dos gateways.
- No asumir que Desktop y CLI comparten la misma sesion viva.
- No cambiar el modelo del gateway cada vez que quieras probar un modelo.
- No usar `openrouter/auto` si quieres evitar costes.
- No borrar `auth.json`, `.env`, `state.db` o caches sin backup.
- No tratar `hermes-problemas.md` como estado actual; es un historico.
- No mezclar dashboard, gateway y chat en una misma terminal si buscas estabilidad.
- No correr Desktop, `nesquena`, dashboard nativo y Open WebUI todos como "solucion" permanente si no sabes que rol cumple cada uno.
- No elegir una UI externa como fuente de verdad de la configuracion; usa CLI/gateway/status para confirmar.
- No abrir mas puertos para tapar un fallo base del gateway. Primero arregla `8642`, despues decide la UI.
- No asumir que `auth.json` sano implica que Desktop/nesquena listaran todos los providers OAuth.
- No usar Codex/Gemini OAuth como gateway permanente hasta haberlo probado primero desde CLI y reiniciado gateway.

## Checklist final de instalacion estable

Instalacion:

- [ ] `hermes --version` funciona.
- [ ] `hermes status` funciona.
- [ ] `hermes doctor` no muestra bloqueos criticos.
- [ ] OpenRouter esta autenticado.
- [ ] Nous Portal esta autenticado si se va a usar.
- [ ] `openai-codex` esta autenticado solo si se necesita.
- [ ] `google-gemini-cli` se prueba desde CLI si se va a usar OAuth Gemini.
- [ ] `hermes model --refresh` se ejecuta despues de actualizar, reautenticar o cambiar provider.

Modelos:

- [ ] `default` tiene modelo fiable.
- [ ] `chat` tiene modelo barato/free.
- [ ] `gateway` tiene modelo concreto y estable.
- [ ] Se entiende la diferencia entre `/model` y `hermes model`.
- [ ] Se entiende que `openai-codex` usa limites Codex/agentic usage, no el chat normal de ChatGPT.
- [ ] Se entiende que `google-gemini-cli` y `gemini` no son el mismo provider.

Gateway:

- [ ] `hermes gateway install` ejecutado.
- [ ] `hermes gateway status` muestra PID vivo.
- [ ] `Invoke-RestMethod http://127.0.0.1:8642/health` responde.
- [ ] Telegram tiene allowlist.
- [ ] No hay tokens duplicados entre perfiles.
- [ ] Gateway se reinicia despues de cambiar provider/modelo global.

Dashboards:

- [ ] `nesquena/hermes-webui` abre en `http://127.0.0.1:9119`.
- [ ] Dashboard nativo abre en `http://127.0.0.1:9120`.
- [ ] `start-all.bat` documentado.
- [ ] Se considera crear `start-stable.bat` con gateway incluido.
- [ ] Se ha elegido una sola UI diaria para evitar estados falsos.
- [ ] Desktop no se usa como fuente de verdad del gateway.
- [ ] Si se usa `nesquena`, se acepta que es repo externo y puerto `9119`.
- [ ] Si se usa Open WebUI, se conecta contra el API server de Hermes en `http://127.0.0.1:8642/v1`.
- [ ] Dashboard nativo queda como admin/diagnostico, no necesariamente como chat diario.

Desktop:

- [ ] Desktop se abre despues de validar CLI/gateway.
- [ ] Se crea nuevo chat si una sesion vieja queda atascada.
- [ ] Se sabe donde esta la cache: `C:\Users\yo\AppData\Roaming\hermes-desktop`.
- [ ] Si Desktop no lista Codex/Gemini, primero se prueba CLI con `--provider`.

Oracle remoto:

- [ ] La VM usa `VM.Standard.A1.Flex` dentro de 4 OCPU / 24 GB RAM totales.
- [ ] La imagen es Ubuntu 24.04 LTS ARM64 o Ubuntu 22.04 LTS ARM64.
- [ ] Los puertos `8642`, `9119` y `9120` no estan abiertos publicamente.
- [ ] Gateway remoto esta instalado como `systemd --system`.
- [ ] `sudo hermes gateway status --system` muestra servicio vivo.
- [ ] `curl http://127.0.0.1:8642/health` responde dentro del servidor.
- [ ] Windows accede por SSH tunnel o Tailscale.
- [ ] Telegram no esta duplicado entre Windows y Oracle.
- [ ] Existe backup descargado de `~/.hermes`.

Memoria:

- [ ] Se decide si perfiles comparten memoria o no.
- [ ] ByteRover/Hindsight enlazado solo si se quiere memoria comun.
- [ ] `SOUL.md` y skills revisados por perfil.

## Plan de implementacion futura para tu setup

Este documento no ejecuta cambios de perfiles ni modifica tokens. La implementacion recomendada seria:

1. Hacer backup de `config.yaml`, `.env`, `auth.json` y `start-all.bat`.
2. Crear perfiles `chat`, `gateway` y `admin`.
3. Configurar `chat` con OpenRouter barato/free.
4. Configurar `gateway` con OpenRouter modelo concreto y Telegram.
5. Revisar que `gateway` no herede tokens duplicados de otros perfiles.
6. Crear un `start-stable.bat` que arranque gateway si esta parado y luego dashboards.
7. Elegir una sola UI diaria: `nesquena/hermes-webui`, Open WebUI o Desktop.
8. Ajustar `start-stable.bat` para arrancar solo gateway + dashboard admin + UI diaria elegida.
9. Actualizar Hermes despues de backup si se quieren recuperar providers OAuth en el selector.
10. Reautenticar `openai-codex` solo si se va a usar Codex/ChatGPT subscription.
11. Probar `google-gemini-cli` desde CLI antes de usarlo en Desktop/WebUI.
12. Reiniciar gateway despues de cualquier cambio global de provider/modelo.
13. Documentar en `hermes-problemas.md` la nueva arquitectura.
14. Probar durante una semana sin cambiar el modelo del perfil `gateway`.

Variante remota Oracle:

1. Crear VM Oracle Ampere A1 `4 OCPU / 24 GB RAM` con Ubuntu ARM64.
2. Instalar Hermes por script oficial Linux.
3. Configurar provider/modelo cloud.
4. Activar API server local y probar `/health`.
5. Instalar gateway con `sudo hermes gateway install --system`.
6. Conectar Telegram/API/UI por tunel, no por puertos publicos.
7. Parar gateway Windows si Telegram migra al servidor.
8. Si se usa Codex OAuth remoto, autenticar como el mismo usuario/HERMES_HOME que ejecuta el gateway.
9. Mantener Windows como cliente y Oracle como nucleo 24/7.

## Resumen ejecutivo

La manera estable de usar Hermes en tu maquina es no mezclar todo en un unico estado vivo.

Usa:

- `default/admin` para reparar y configurar.
- `chat` para conversaciones y modelos baratos/free.
- `gateway` para Telegram/API server siempre vivo.
- Dashboards separados en `9119` y `9120`.
- Gateway verificado en `8642`.
- `hermes status` como verdad actual, no documentos antiguos.

Si algo falla, diagnostica en este orden:

1. `hermes status`
2. `hermes chat -q "responde solo: ok" -Q --max-turns 1`
3. `hermes gateway status`
4. `Invoke-RestMethod http://127.0.0.1:8642/health`
5. Logs en `C:\Users\yo\AppData\Local\hermes\logs\agent.log`
6. Desktop/cache solo al final

Con esta separacion, puedes probar modelos, usar Desktop, mantener Telegram y conservar memoria sin que cada cambio rompa todo el sistema.
