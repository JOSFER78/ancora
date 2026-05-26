# launch_tradingview_debug.ps1
# Script para iniciar TradingView Desktop habilitando Chrome DevTools Protocol en el puerto 9222.

# 1. Cerrar instancias previas de TradingView
Write-Host "Cerrando instancias abiertas de TradingView..." -ForegroundColor Cyan
Stop-Process -Name "TradingView" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Intentar localizar el ejecutable
$Paths = @(
    "$env:LOCALAPPDATA\TradingView\TradingView.exe",
    "$env:ProgramFiles\TradingView\TradingView.exe",
    "${env:ProgramFiles(x86)}\TradingView\TradingView.exe"
)

$TV_EXE = $null
foreach ($Path in $Paths) {
    if (Test-Path $Path) {
        $TV_EXE = $Path
        break
    }
}

# Si no se encuentra en las carpetas estándar, buscar en WindowsApps (Microsoft Store)
if (-not $TV_EXE) {
    Write-Host "Buscando en WindowsApps..." -ForegroundColor Yellow
    $StorePath = Get-ChildItem -Path "$env:ProgramFiles\WindowsApps" -Filter "TradingView.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if ($StorePath) {
        $TV_EXE = $StorePath
    }
}

# Si sigue sin encontrarse, intentar usar where.exe
if (-not $TV_EXE) {
    $WhereResult = where.exe TradingView.exe 2>$null
    if ($WhereResult) {
        $TV_EXE = $WhereResult[0]
    }
}

if (-not $TV_EXE) {
    Write-Error "No se pudo localizar el ejecutable de TradingView Desktop de manera automática."
    Write-Host "Por favor, inicia la aplicación manualmente desde la consola con:" -ForegroundColor Yellow
    Write-Host "  `\"C:\Ruta\A\TradingView.exe`\" --remote-debugging-port=9222" -ForegroundColor Green
    Exit 1
}

# 3. Lanzar TradingView Desktop con depuración remota en el puerto 9222
Write-Host "Localizado TradingView en: $TV_EXE" -ForegroundColor Green
Write-Host "Iniciando con --remote-debugging-port=9222..." -ForegroundColor Cyan
Start-Process -FilePath $TV_EXE -ArgumentList "--remote-debugging-port=9222"

# 4. Esperar y validar el puerto
Write-Host "Esperando a que la interfaz CDP esté disponible en el puerto 9222..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

$Url = "http://localhost:9222/json/version"
try {
    # Usar curl.exe para evitar los problemas internos de Invoke-WebRequest si el parseo de HTML falla en PowerShell
    $Response = curl.exe -s $Url
    if ($Response) {
        Write-Host "`n¡Conexión CDP exitosa! TradingView está listo para conectarse con la IA." -ForegroundColor Green
        Write-Host $Response -ForegroundColor Gray
    } else {
        Write-Warning "El puerto 9222 respondió, pero no devolvió datos. Abre TradingView y entra en un gráfico."
    }
} catch {
    Write-Warning "No se pudo conectar a $Url. Asegúrate de que TradingView se está ejecutando correctamente."
}
