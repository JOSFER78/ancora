import { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Heart, Snowflake, Play, RotateCcw, AlertTriangle, FileText, TrendingDown } from 'lucide-react';

export default function DashboardView({ dailyMoodToday, totalDebts }) {
  const [checklist, setChecklist] = useState({
    slConfigured: false,
    balanceHidden: false,
    atomoxetinaTaken: dailyMoodToday?.atomoxetina_taken || false,
    blockEnabled: false,
  });

  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);

  // Sync checklist atomoxetinaTaken when dailyMoodToday loads
  const [prevMoodId, setPrevMoodId] = useState(dailyMoodToday?.id || null);
  if (dailyMoodToday && dailyMoodToday.id !== prevMoodId) {
    setPrevMoodId(dailyMoodToday.id);
    setChecklist(prev => ({
      ...prev,
      atomoxetinaTaken: dailyMoodToday.atomoxetina_taken
    }));
  }

  // Derive breathing state during render
  let breathingState = 'INSPIRA (Toma aire...)';
  if (timerActive) {
    if (timerSeconds > 0) {
      const cycle = Math.floor((30 - timerSeconds) / 4) % 2;
      breathingState = cycle === 0 ? 'INSPIRA (Toma aire...)' : 'EXPIRA (Saca el aire...)';
    }
  } else {
    if (timerSeconds === 0) {
      breathingState = '¡EJECUTA EL CORTE AHORA! Entra a BingX y cierra la mitad de la posición.';
    } else if (timerSeconds === 30) {
      breathingState = 'INSPIRA (Toma aire...)';
    } else {
      breathingState = 'Listo para el Reset';
    }
  }

  // Breathing Timer Logic
  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(sec => sec - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimeout(() => setTimerActive(false), 0);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const startTimer = () => {
    setTimerSeconds(30);
    setTimerActive(true);
  };

  const resetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(30);
  };

  const handleChecklistChange = (key) => {
    setChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const allChecked = Object.values(checklist).every(val => val === true);

  return (
    <div className="view-content-limit">
      {/* Top Banner Message */}
      <div className="glass-panel hero-card">
        <div className="hero-glow"></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div className="flex-center animate-pulse-soft" style={{ 
            width: '54px', 
            height: '54px', 
            borderRadius: 'var(--radius-md)', 
            background: 'hsla(var(--rose), 0.1)', 
            border: '1px solid hsla(var(--rose), 0.25)',
            color: 'var(--color-rose)'
          }}>
            <ShieldAlert size={28} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>PROTOCOLO DE SURVIVAL ACTIVO</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              No operes para salvar tu pasado. Opera con calma matemática para cuidar tu futuro.
            </p>
          </div>
          <div className="badge badge-emerald" style={{ padding: '8px 16px' }}>
            <Heart size={14} style={{ marginRight: '6px' }} />
            <span>Lola te necesita sano</span>
          </div>
        </div>
      </div>

      {/* Grid Status Cards */}
      <div className="grid-3">
        {/* Card 1: Atomoxetina */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Tratamiento TDAH</span>
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Medicación Diaria</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              La Atomoxetina proporciona el soporte neuroquímico necesario para mantener tus funciones ejecutivas y de inhibición activas.
            </p>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: dailyMoodToday?.atomoxetina_taken ? 'var(--color-emerald)' : 'var(--color-rose)',
              boxShadow: `0 0 8px ${dailyMoodToday?.atomoxetina_taken ? 'var(--color-emerald)' : 'var(--color-rose)'}`
            }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
              {dailyMoodToday?.atomoxetina_taken ? 'Atomoxetina Activa Hoy' : 'Atomoxetina Pendiente en Diario'}
            </span>
          </div>
        </div>

        {/* Card 2: Deuda */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span className="badge badge-rose" style={{ marginBottom: '12px' }}>Pasivos Consolidados</span>
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Plan de Amortización</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Tus deudas activas ascienden a <strong style={{ color: '#ffffff' }}>{totalDebts.toLocaleString('es-ES')} €</strong>. Cada hito de deudas saldadas reduce tu cortisol y estabiliza tu sistema nervioso.
            </p>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <TrendingDown size={14} color="var(--color-rose)" />
            <span>Fase 1: Estabilización de Deudas</span>
          </div>
        </div>

        {/* Card 3: EFE/INSS Status */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span className="badge badge-amber" style={{ marginBottom: '12px' }}>Escudo Laboral</span>
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Situación EFE / INSS</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Baja médica protegida mediante informes de incomparecencia por agorafobia severa. Salvaguardando tus 3.300 €/mes.
            </p>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <FileText size={14} color="var(--color-amber)" />
            <span>Silencio total con EFE activo</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Section Checklist BingX */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Checklist de Seguridad BingX</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Obligatorio para operar</span>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Tu cerebro es un excelente analista (80% efectividad) pero entra en colapso por pánico en BingX. Completa este blindaje antes de abrir terminales:
          </p>

          <div className="checklist-container">
            <div 
              className={`checklist-item ${checklist.slConfigured ? 'checked' : ''}`}
              onClick={() => handleChecklistChange('slConfigured')}
            >
              <div className="checklist-checkbox">
                {checklist.slConfigured && <span>✓</span>}
              </div>
              <div>
                <h4 className="checklist-item-title">Stop Loss Rígido Precargado</h4>
                <p className="checklist-item-desc">El SL está configurado en el servidor/broker y no será ampliado ni promediado a la baja bajo ningún concepto.</p>
              </div>
            </div>

            <div 
              className={`checklist-item ${checklist.balanceHidden ? 'checked' : ''}`}
              onClick={() => handleChecklistChange('balanceHidden')}
            >
              <div className="checklist-checkbox">
                {checklist.balanceHidden && <span>✓</span>}
              </div>
              <div>
                <h4 className="checklist-item-title">Ocultación del Saldo Monetario</h4>
                <p className="checklist-item-desc">El balance en USD/EUR está tapado en el terminal. Solo visualizas la operación en pips o Unidades de Riesgo (R) para anular la ceguera de escala.</p>
              </div>
            </div>

            <div 
              className={`checklist-item ${checklist.atomoxetinaTaken ? 'checked' : ''}`}
              onClick={() => handleChecklistChange('atomoxetinaTaken')}
            >
              <div className="checklist-checkbox">
                {checklist.atomoxetinaTaken && <span>✓</span>}
              </div>
              <div>
                <h4 className="checklist-item-title">Atomoxetina Ingerida hoy</h4>
                <p className="checklist-item-desc">Has tomado tu dosis diaria prescrita por el psiquiatra para restaurar el autocontrol prefrontal.</p>
              </div>
            </div>

            <div 
              className={`checklist-item ${checklist.blockEnabled ? 'checked' : ''}`}
              onClick={() => handleChecklistChange('blockEnabled')}
            >
              <div className="checklist-checkbox">
                {checklist.blockEnabled && <span>✓</span>}
              </div>
              <div>
                <h4 className="checklist-item-title">Bloqueo Temporal Validado</h4>
                <p className="checklist-item-desc">El script Equity-Killer o tu familiar han validado que no operarás fuera de los límites de dolor diario (-150$ en Fase 1).</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            {allChecked ? (
              <div className="flex-center" style={{ 
                padding: '16px', 
                backgroundColor: 'hsla(var(--emerald), 0.1)', 
                border: '1px solid hsla(var(--emerald), 0.3)', 
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-emerald)',
                gap: '12px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                <ShieldCheck size={20} />
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Operativa Autorizada: Cíñete a Lotes Medidos
                </span>
              </div>
            ) : (
              <div className="flex-center" style={{ 
                padding: '16px', 
                backgroundColor: 'hsla(var(--rose), 0.1)', 
                border: '1px solid hsla(var(--rose), 0.3)', 
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-rose)',
                gap: '12px',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                <AlertTriangle size={20} />
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Operativa Bloqueada: Rellena el Checklist de Seguridad
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Section Reset Amígdala */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '10px' }}>
              Reset Fisiológico de Amígdala
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              En el segundo exacto en que sientas parálisis ante ganancias o pánico ante pérdidas, el cortisol satura tus neuronas. Activa este reset de 30 segundos:
            </p>

            <div className="timer-container">
              <div className="timer-circle-outer">
                <div className={`timer-circle-breathing ${timerActive ? 'active' : ''}`}></div>
                <span className="timer-text">
                  {timerSeconds}s
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span className="badge badge-cyan" style={{ marginBottom: '8px' }}>
                  {breathingState}
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '280px', margin: '0 auto', lineHeight: 1.4 }}>
                  {timerActive ? 'Sincroniza tu respiración con la expansión del aro.' : 'Presiona Iniciar para comenzar a respirar.'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-cyan" 
                onClick={startTimer} 
                disabled={timerActive} 
                style={{ flex: 1 }}
              >
                <Play size={16} />
                <span>Iniciar Reset</span>
              </button>
              <button 
                className="btn btn-outline" 
                onClick={resetTimer} 
                style={{ flex: 1 }}
              >
                <RotateCcw size={16} />
                <span>Reiniciar</span>
              </button>
            </div>
            
            <div className="flex-center" style={{ 
              marginTop: '16px', 
              gap: '8px', 
              background: 'hsla(var(--cyan), 0.05)', 
              padding: '10px', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid hsla(var(--cyan), 0.15)'
            }}>
              <Snowflake size={16} color="var(--color-cyan)" />
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                <strong>Tip de Choque:</strong> Échate agua helada en la cara o sujeta un hielo con las manos para resetear la alarma de la amígdala.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
