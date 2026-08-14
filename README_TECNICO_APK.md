# ⚓ ÁNCORA — Auditoría Técnica y Guía Maestra de la APK Android

> **Documento Técnico de Referencia y Resolución de Problemas de Instalación Móvil.**  
> Este informe documenta la comparativa arquitectónica con **GOALS**, las causas raíz del error de instalación en Android, las correcciones implementadas y el pipeline de compilación y despliegue continuo.

---

## 1. Comparativa de Arquitectura: GOALS vs ÁNCORA

| Parámetro | GOALS (`app.goalskids.app`) 🟢 | ÁNCORA (`com.ancora.health`) 🟢 (Corregido) | ÁNCORA Anterior 🔴 (Estado Fallido) |
| :--- | :--- | :--- | :--- |
| **Origen del archivo de descarga** | Binario APK compilado directo | **GitHub Releases CDN + VPS Nginx** | Firebase Hosting (Servía `index.html` 2.4 KB por `ignore`) |
| **MIME Type servido** | `application/vnd.android.package-archive` | `application/vnd.android.package-archive` | `text/html; charset=utf-8` |
| **Mecanismo de Descarga** | Descarga directa `.apk` | **Descarga directa `.apk`** | Descargaba un `.zip` que no ejecutaba el instalador |
| **Firma Digital (`apksigner`)** | Esquemas v1 (JAR) + v2 (APK Signature) | **Esquemas v1 (JAR) + v2 + v3** | v1 = FALSE (Modificación ZIP rompía `META-INF`) |
| **Tamaño del binario** | ~7.8 MB | **~14.8 MB (Limpio)** | 63.0 MB (Bundle ZIP de 52 MB anidado en assets) |
| **Directiva `ignoreAssetsPattern`** | Excluye `.zip` y `.apk` | **Excluye `.zip` y `.apk`** | `!*.apk:!*.zip` (Forzaba empaquetado de ZIPs dentro de APK) |
| **Compatibilidad Android** | Android 7.0 (SDK 24) a Android 16 (SDK 36) | **Android 7.0 (SDK 24) a Android 16 (SDK 36)** | Fallaba con `INSTALL_PARSE_FAILED_NOT_APK` |

---

## 2. Diagnóstico Empírico de los 4 Fallos Identificados

### 🔴 Fallo 1: Restricción de Ejecutables en Firebase Hosting (Spark Plan)
* **Causa:** Google Firebase Hosting bajo el plan gratuito *Spark* bloquea la subida de binarios ejecutables (`.apk`, `.exe`). El despliegue fallaba con el error HTTP:
  ```text
  HTTP Error: 400, Executable files are forbidden on the Spark billing plan.
  ```
* **Efecto colateral del parche anterior:** Para esquivar el error 400, se añadió `"**/*.apk"` a la directiva `"ignore"` en `firebase.json`. Al no existir el archivo en Firebase CDN, la regla SPA `rewrites: [{"source": "**", "destination": "/index.html"}]` devolvía el código HTML de la página web (2.4 KB).
* **Fallo en Android:** El navegador del móvil descargaba un archivo de texto HTML nombrado como `.apk`. El `PackageInstaller` de Android no podía leer la cabecera de Dalvik y abortaba con *"Error al analizar el paquete"*.

### 🔴 Fallo 2: Función de Descarga Web Forzaba Extensión ZIP
* En `src/services/updateService.js`, la función `triggerApkInstall()` tenía asignado por defecto `a.download = 'ancora-v1.0.0.zip'`, requiriendo descompresión manual en lugar de abrir directamente el instalador de Android.

### 🔴 Fallo 3: Ruptura de la Firma v1 (JAR Signature Scheme)
* Al manipular el APK como un archivo ZIP en caliente mediante scripts Python/Node (`update_apk_icon.py`), se eliminaba la carpeta `META-INF` y solo se firmaba con el bloque v2.
* Dispositivos Android 7–11 y capas como Xiaomi MIUI/HyperOS, Samsung OneUI y Huawei EMUI rechazan APKs sideloaded si carecen de las entradas v1 (`META-INF/MANIFEST.MF`, `*.SF`, `*.RSA`).

### 🔴 Fallo 4: Inflado Recursivo de Assets en Gradle
* En `android/app/build.gradle`, la regla `ignoreAssetsPattern` contenía `!*.apk:!*.zip:!downloads`. El signo `!` indicaba inclusión explícita, empaquetando 52 MB de archivos ZIP comprimidos dentro del propio APK final.

---

## 3. Arquitectura de Producción Implementada

```
                                  [ Usuario Móvil ]
                                          │
                                 (Toca "Descargar APK")
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
         [ GitHub Releases CDN ]                 [ VPS Oracle Nginx ]
     https://github.com/JOSFER78/ancora/      https://143.47.35.167/pro/
      releases/download/v1.0.0/ancora.apk         ancora/ancora.apk
                        │                                   │
               (MIME: application/vnd.android.package-archive)
               (Tamaño: 14.8 MB | Firmas: v1 + v2 + v3)
                        │
                        ▼
            [ Android PackageInstaller ]
       "¿Deseas instalar esta aplicación?"
                        │
                        ▼
                🟢 INSTALACIÓN 100% OK
```

---

## 4. Pipeline de Compilación y Publicación (Comandos)

Para generar una nueva versión del APK y publicarla:

```bash
# 1. Compilar aplicación React / Vite
npm run build

# 2. Sincronizar activos con Capacitor
npx cap sync android

# 3. Compilar APK nativo limpio con Gradle
cd android
./gradlew assembleDebug
cd ..

# 4. Alinear y Firmar con v1 (JAR) + v2/v3
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore ~/.android/debug.keystore -storepass android -keypass android android/app/build/outputs/apk/debug/app-debug.apk androiddebugkey
zipalign -f -p 4 android/app/build/outputs/apk/debug/app-debug.apk dist/ancora.apk
apksigner sign --ks ~/.android/debug.keystore --ks-pass pass:android --ks-key-alias androiddebugkey --key-pass pass:android --v1-signing-enabled true --v2-signing-enabled true --out dist/ancora.apk dist/ancora.apk

# 5. Publicar release en GitHub
gh release create v1.0.1 dist/ancora.apk --title "Áncora Android Native v1.0.1" --notes "Compilación oficial Android APK firmada v1+v2."

# 6. Desplegar frontend web en Firebase Hosting
npx firebase-tools deploy --only hosting
```

---

## 5. Enlaces de Descarga Directa Verificados

* **Descarga APK Oficial (GitHub CDN):**  
  [`https://github.com/JOSFER78/ancora/releases/download/v1.0.0/ancora.apk`](https://github.com/JOSFER78/ancora/releases/download/v1.0.0/ancora.apk)
* **Descarga APK Alternativa (Servidor VPS Nginx Directo):**  
  [`https://143.47.35.167/pro/ancora/ancora.apk`](https://143.47.35.167/pro/ancora/ancora.apk)
* **Portal Web y Verificador In-App:**  
  [`https://ancora-portal.web.app`](https://ancora-portal.web.app)
