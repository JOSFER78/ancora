# 🏗️ Resumen de Estado y Solución de Estabilidad

> Fecha: 31 de mayo de 2026
> Sistema: Windows 10 — Hermes Agent v0.15.1

---

## 📡 Estado actual — todo en pie

| Servicio | Puerto | URL | Estado |
|----------|--------|-----|--------|
| **nesquena/hermes-webui** | 9119 | http://127.0.0.1:9119 | ✅ Activo |
| **Dashboard nativo Hermes** | 9120 | http://127.0.0.1:9120 | ✅ Activo |
| **Gateway Hermes** | 8642 | http://127.0.0.1:8642/health | ✅ Activo (`{"status": "ok"}`) |

---

## 🔐 Providers configurados

| Provider | Estado | Notas |
|----------|--------|-------|
| **google-gemini-cli** | ✅ Autenticado | `josferestudio@gmail.com` — OAuth Google PKCE |
| **openrouter** | ✅ API key | Models: deepseek, gpt-5.5, etc. |
| **nous** | ✅ OAuth | Nous Portal |
| **openai-codex** | ⏳ Rate-limited | Se resetea solo (~30 min) |

---

## 🩺 ¿Qué pasó?

**Los dashboards NO se "reiniciaron solos".** El log mostró un `POST /api/shutdown` llamado desde el propio WebUI, que apagó el servidor. Al no haber un proceso guardian, se quedó caído.

**Los providers NO se perdieron.** Siguen todos en `auth.json`. `hermes auth list` los muestra intactos.

**Los datos NO desaparecen.** Todo está en `C:\Users\yo\AppData\Local\hermes/`:

| Ruta | Contenido |
|------|-----------|
| `config.yaml` | Configuración general |
| `auth.json` | Credenciales OAuth + API keys |
| `webui/sessions/` | Historial de chats del dashboard |
| `sessions/` | Sesiones de Hermes |
| `hermes-webui/` | Código fuente del dashboard nesquena |

---

## ✅ Solución — `start-all.bat`

Se creó un lanzador en:

```
C:\Users\yo\AppData\Local\hermes\start-all.bat
```

**¿Qué hace?** Abre dos ventanas CMD minimizadas:

1. **nesquena/hermes-webui** → http://127.0.0.1:9119
2. **Dashboard nativo** → http://127.0.0.1:9120

Estos procesos viven en sus **propias ventanas**, independientes de la sesión de chat de Hermes. No se caen al cambiar de modelo, hacer `/new` o cerrar Telegram.

---

## 🔧 Cómo usarlo

### Cada vez que enciendas el PC

1. Abre el Explorador de Windows
2. Ve a `C:\Users\yo\AppData\Local\hermes\`
3. Haz doble clic en **`start-all.bat`**
4. Espera 5 segundos
5. Abre en el navegador: **http://127.0.0.1:9119**

### (Opcional) Para que arranque solo

Crea un acceso directo de `start-all.bat` en:

```
C:\Users\yo\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\
```

Así arrancará automáticamente cada vez que inicies sesión en Windows.

---

## 💬 Cómo cambiar de modelo

Desde el dashboard nesquena (9119) puedes cambiar el modelo en el selector.
O desde Telegram con `/model`. Los providers no se pierden.

Comandos útiles:

```bash
hermes -m gemini-3.1-pro-preview --provider google-gemini-cli
hermes -m deepseek/deepseek-v4-flash --provider openrouter
```

---

## 📋 Historial de lo que se hizo

1. **Diagnóstico** — Se detectó que nesquena webui se había apagado por `POST /api/shutdown`
2. **Verificación** — Se confirmó que todos los providers siguen autenticados
3. **Relanzamiento** — Se arrancaron ambos dashboards como procesos independientes (no tareas programadas)
4. **Creación de `start-all.bat`** — Lanzador con un clic
5. **Actualización de memoria persistente** — El agente recuerda esta configuración

---

## ⚠️ Notas importantes

- El `.bat` lanza procesos que dependen de **tu sesión de Windows**. Al cerrar sesión o apagar, hay que volver a ejecutarlo.
- Las tareas programadas (`schtasks`) se descartaron porque Windows las ejecuta en un contexto de sesión diferente y las mata con SIGINT al cambiar de usuario.
- Si algún dashboard se cae, simplemente ejecuta `start-all.bat` otra vez.
