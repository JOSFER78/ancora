@echo off
title Sistema EN-78 - Inicio Automatico
echo Iniciando Servidor Vite de Localhost...
start cmd /k "cd /d c:\Users\yo\Pictures\Descargaspc\0a\webayudatra && npm run dev"
echo Iniciando Puente de Agentes Local (Cron y Telegram)...
start cmd /k "cd /d c:\Users\yo\Pictures\Descargaspc\0a\webayudatra && node C:\Users\yo\.gemini\antigravity\brain\5f6a5f5a-e5a7-4bb8-8f87-3d06fc0b9cad\scratch\local_agent_bridge.cjs"
echo Todo en marcha. Puedes minimizar estas ventanas.
exit
