import { useState, useEffect } from 'react';
import TradingDashboardGrid from '../components/trading/TradingDashboardGrid';
import BingXWidget from '../components/trading/BingXWidget';
import GriefWidget from '../components/trading/GriefWidget';
import PanicSimulatorWidget from '../components/trading/PanicSimulatorWidget';
import SecurityChecklistWidget from '../components/trading/SecurityChecklistWidget';
import ViabilityWidget from '../components/trading/ViabilityWidget';
import { Play, RotateCcw, Snowflake } from 'lucide-react';

export default function TradingView({ user, onTabChange }) {
  // Lógica del Temporizador de Respiración (Reset Fisiológico de Amígdala)
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);

  // Derive breathing state during render
  let breathingState = 'INSPIRA (Toma aire...)';
  if (timerActive) {
    if (timerSeconds > 0) {
      const cycle = Math.floor((30 - timerSeconds) / 4) % 2;
      breathingState = cycle === 0 ? 'INSPIRA (Toma aire...)' : 'EXPIRA (Saca el aire...)';
    }
  } else {
    if (timerSeconds === 0) {
      breathingState = '¡EJECUTA EL CORTE AHORA! Entra a BingX and cierra la mitad de la posición.';
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

  return (
    <div className="view-content-limit" style={{ paddingBottom: '30px' }}>
      
      {/* Dashboard interactivo con los Widgets estilo TradeZella */}
      <TradingDashboardGrid>
        {{
          bingx: (
            <BingXWidget 
              user={user} 
              onTabChange={onTabChange} 
            />
          ),
          calendar: (
            <ViabilityWidget 
              user={user} 
              onlyTradingJournal={true}
              onDebtsUpdated={null}
            />
          ),

          security: (
            <SecurityChecklistWidget 
              dailyMoodToday={null} // Se sincronizará localmente desde Supabase en el widget
            />
          ),
          amigdala: (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  En el segundo exacto en que sientas parálisis ante ganancias o pánico ante pérdidas, el cortisol satura tus neuronas. Activa este reset de 30 segundos:
                </p>

                <div className="timer-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', margin: '20px 0' }}>
                  <div className="timer-circle-outer" style={{
                    position: 'relative',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '2px dashed rgba(6, 182, 212, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div className={`timer-circle-breathing ${timerActive ? 'active' : ''}`} style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      background: 'rgba(6, 182, 212, 0.04)',
                      transform: timerActive ? 'scale(1.2)' : 'scale(0.8)',
                      transition: timerActive ? 'transform 4s ease-in-out infinite alternate' : 'transform 1s ease',
                      zIndex: 0
                    }}></div>
                    <span className="timer-text" style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ffffff', zIndex: 1 }}>
                      {timerSeconds}s
                    </span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span className="badge badge-cyan" style={{ marginBottom: '8px', display: 'inline-block' }}>
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
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <Play size={14} />
                    <span>Iniciar Reset</span>
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={resetTimer}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    <RotateCcw size={14} />
                    <span>Reiniciar</span>
                  </button>
                </div>

                <div className="flex-center" style={{
                  marginTop: '16px',
                  gap: '8px',
                  background: 'hsla(var(--cyan), 0.05)',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid hsla(var(--cyan), 0.15)',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Snowflake size={16} color="var(--color-cyan)" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.3 }}>
                    <strong>Tip de Choque:</strong> Échate agua helada en la cara o sujeta un hielo con las manos para resetear la alarma de la amígdala.
                  </span>
                </div>
              </div>
            </div>
          ),
          grief: (
            <GriefWidget />
          ),
          panic: (
            <PanicSimulatorWidget />
          )
        }}
      </TradingDashboardGrid>

    </div>
  );
}
