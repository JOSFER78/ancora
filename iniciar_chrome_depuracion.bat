@echo off
cls
cd /d "%~dp0"
echo ============================================================
echo   Survival Emilio - Automatizacion de OAuth 2.0 (Google/Supabase)
echo ============================================================
echo.
echo Se abrira una ventana temporal de Chrome en tu pantalla.
echo.
echo 1. Si te pide iniciar sesion en Google o Supabase, LOGUEATE.
echo 2. El script detectara que has entrado y hara el resto SOLO.
echo.
echo ** IMPORTANTE: No cierres esta ventana de consola ni la de Chrome **
echo ============================================================
echo.

node scratch/automate_oauth.cjs

echo.
echo ============================================================
echo   Proceso finalizado. Puedes volver al chat.
echo ============================================================
pause
