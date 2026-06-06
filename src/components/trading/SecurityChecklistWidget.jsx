import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { ShieldCheck, ShieldAlert, AlertOctagon, Terminal, Copy } from 'lucide-react';

export default function SecurityChecklistWidget({ dailyMoodToday }) {
  const [checklist, setChecklist] = useState({
    slConfigured: false,
    balanceHidden: false,
    diaryCompleted: dailyMoodToday ? true : false,
    blockEnabled: false,
  });

  const [copied, setCopied] = useState(false);

  // Sincronizar checklist al recibir el diario de hoy
  useEffect(() => {
    if (dailyMoodToday) {
      setChecklist(prev => ({
        ...prev,
        diaryCompleted: true
      }));
    } else {
      setChecklist(prev => ({
        ...prev,
        diaryCompleted: false
      }));
    }
  }, [dailyMoodToday]);

  const handleCheckChange = (key) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const allChecked = Object.values(checklist).every(val => val === true);

  // Script de PowerShell dinámico para bloquear BingX localmente en Windows
  const powershellBlockScript = `# Script de PowerShell (Ejecutar como Administrador) para Bloqueo Físico de BingX

# 1. Definir dominio de BingX a bloquear
$Domain = "open-api.bingx.com"
$WebDomain = "bingx.com"
$HostsPath = "$env:windir\\System32\\drivers\\etc\\hosts"

# 2. Agregar redirección a localhost para impedir acceso físico
If (Select-String -Path $HostsPath -Pattern $Domain) {
    Write-Host "BingX ya está bloqueado en tu archivo hosts local." -ForegroundColor Yellow
} Else {
    Add-Content -Path $HostsPath -Value "\`r\`n127.0.0.1 $Domain"
    Add-Content -Path $HostsPath -Value "127.0.0.1 www.$Domain"
    Add-Content -Path $HostsPath -Value "127.0.0.1 $WebDomain"
    Add-Content -Path $HostsPath -Value "127.0.0.1 www.$WebDomain"
    Write-Host "¡BLOQUEO ACTIVO! BingX ha sido redirigido a local. Tu amígdala está protegida." -ForegroundColor Red
    # Limpiar caché DNS para aplicar de inmediato
    ipconfig /flushdns | Out-Null
}`;

  const powershellUnblockScript = `# Script de PowerShell (Ejecutar como Administrador) para Desbloquear BingX

$HostsPath = "$env:windir\\System32\\drivers\\etc\\hosts"
$Content = Get-Content -Path $HostsPath
$NewContent = $Content | Where-Object { $_ -notmatch "bingx" }
Set-Content -Path $HostsPath -Value $NewContent
Write-Host "¡Desbloqueo autorizado! Opera con tu checklist validado y lotes medidos." -ForegroundColor Green
ipconfig /flushdns | Out-Null`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Estado Operativo */}
      <div>
        {allChecked ? (
          <div style={{ padding: '12px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
            <ShieldCheck size={18} />
            <span>OPERATIVA AUTORIZADA — OPERA CON LOTES MEDIDOS</span>
          </div>
        ) : (
          <div style={{ padding: '12px', background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '6px', color: 'var(--color-rose)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', fontWeight: 700 }}>
            <ShieldAlert size={18} />
            <span>OPERATIVA BLOQUEADA — COMPLETA EL CHECKLIST</span>
          </div>
        )}
      </div>

      {/* Lista de Checkboxes */}
      <div className="checklist-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        <div 
          onClick={() => handleCheckChange('slConfigured')}
          style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', background: checklist.slConfigured ? 'rgba(16,185,129,0.02)' : 'rgba(255,255,255,0.01)', display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}
        >
          <input type="checkbox" checked={checklist.slConfigured} readOnly style={{ accentColor: 'var(--color-emerald)' }} />
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', display: 'block' }}>Stop Loss Rígido Precargado</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>El SL está configurado en el servidor y no será ampliado a la baja.</span>
          </div>
        </div>

        <div 
          onClick={() => handleCheckChange('balanceHidden')}
          style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', background: checklist.balanceHidden ? 'rgba(16,185,129,0.02)' : 'rgba(255,255,255,0.01)', display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}
        >
          <input type="checkbox" checked={checklist.balanceHidden} readOnly style={{ accentColor: 'var(--color-emerald)' }} />
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', display: 'block' }}>Ocultación de Saldo Monetario</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>El balance en EUR/USD está tapado. Solo visualizas pips o R de riesgo.</span>
          </div>
        </div>

        <div 
          onClick={() => handleCheckChange('diaryCompleted')}
          style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', background: checklist.diaryCompleted ? 'rgba(16,185,129,0.02)' : 'rgba(255,255,255,0.01)', display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}
        >
          <input type="checkbox" checked={checklist.diaryCompleted} readOnly style={{ accentColor: 'var(--color-emerald)' }} />
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', display: 'block' }}>Diario de Sensaciones Registrado</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Has registrado tus niveles de cortisol, ansiedad e impulsividad hoy antes de operar.</span>
          </div>
        </div>

        <div 
          onClick={() => handleCheckChange('blockEnabled')}
          style={{ padding: '10px', border: '1px solid var(--border)', borderRadius: '6px', background: checklist.blockEnabled ? 'rgba(16,185,129,0.02)' : 'rgba(255,255,255,0.01)', display: 'flex', gap: '10px', alignItems: 'center', cursor: 'pointer' }}
        >
          <input type="checkbox" checked={checklist.blockEnabled} readOnly style={{ accentColor: 'var(--color-emerald)' }} />
          <div>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', display: 'block' }}>Límites de Pérdida Diaria Activos</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Tu script Equity-Killer o tu familiar han validado el límite diario (-150$).</span>
          </div>
        </div>

      </div>

      {/* BLOQUEO EN WINDOWS (SCRIPT HOSTS) */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        <h5 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Terminal size={14} color="var(--color-cyan)" />
          Generador de Bloqueo Físico en Windows
        </h5>
        
        <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: '0 0 10px 0' }}>
          Russell Barkley enseña que no debes confiar en tu fuerza de voluntad. Ejecuta este script en PowerShell como Administrador para bloquear/desbloquear físicamente el acceso al broker en tu ordenador:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: allChecked ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
              {allChecked ? "Script de DESBLOQUEO Autorizado" : "Script de BLOQUEO Preventivo"}
            </span>
            <button 
              onClick={() => copyToClipboard(allChecked ? powershellUnblockScript : powershellBlockScript)}
              style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.62rem' }}
            >
              <Copy size={11} />
              <span>{copied ? "Copiado" : "Copiar"}</span>
            </button>
          </div>
          <pre style={{ margin: 0, padding: 0, fontSize: '0.58rem', overflowX: 'auto', color: 'rgba(255,255,255,0.6)', maxHeight: '100px', whiteSpace: 'pre-wrap', lineHeight: 1.3 }}>
            {allChecked ? powershellUnblockScript : powershellBlockScript}
          </pre>
        </div>
      </div>
    </div>
  );
}
