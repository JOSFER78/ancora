import { useState, useEffect } from 'react';
import { Gamepad2, Brain, AlertOctagon, Heart, RefreshCw, Eye, ShieldCheck } from 'lucide-react';

export default function PanicSimulatorWidget() {
  const [step, setStep] = useState('intro'); // 'intro' | 'trade_win' | 'trade_panic' | 'breathing' | 'loss_cut' | 'liquidated' | 'success_end'
  const [balance, setBalance] = useState(2400);
  const [pnl, setPnl] = useState(0);
  const [price, setPrice] = useState(2400.00);
  const [heartRate, setHeartRate] = useState(70);
  const [dialogueText, setDialogueText] = useState('');
  
  // Temporizador de respiración obligatorio
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [timerActive, setTimerActive] = useState(false);

  // Fluctuación de precio en tiempo real durante el simulador
  useEffect(() => {
    let interval;
    if (step === 'trade_win' || step === 'trade_panic') {
      interval = setInterval(() => {
        const change = (Math.random() - 0.5) * 8;
        setPrice(prev => {
          const next = prev + change;
          if (step === 'trade_win') {
            // Fluctúa alrededor de 2425 (ganancia)
            const targetPnl = Math.round((next - 2400.00) * 45); // Lotes simulados
            setPnl(targetPnl);
            setBalance(2400 + targetPnl);
          } else if (step === 'trade_panic') {
            // Fluctúa hacia abajo alrededor de 2380 (pérdida)
            const targetPnl = Math.round((next - 2400.00) * 45) - 300;
            setPnl(targetPnl);
            setBalance(2400 + targetPnl);
          }
          return next;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Lógica del temporizador de respiración
  useEffect(() => {
    let t;
    if (timerActive && secondsLeft > 0) {
      t = setInterval(() => {
        setSecondsLeft(s => s - 1);
        setHeartRate(hr => Math.max(72, hr - 3)); // El corazón se calma con la respiración
      }, 1000);
    } else if (secondsLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(t);
  }, [timerActive, secondsLeft]);

  const handleStartSimulation = () => {
    setStep('trade_win');
    setBalance(2400);
    setPnl(250);
    setPrice(2405.50);
    setHeartRate(85);
  };

  const handleHoldGreed = () => {
    setStep('trade_panic');
    setPrice(2385.00);
    setPnl(-650);
    setBalance(1750);
    setHeartRate(120); // Pánico
  };

  const handleStartBreathing = () => {
    setStep('breathing');
    setSecondsLeft(15);
    setTimerActive(true);
  };

  const handleCutLoss = () => {
    setStep('loss_cut');
    setBalance(1600);
    setPnl(-800);
    setHeartRate(80);
  };

  const handleAverageDown = () => {
    setStep('liquidated');
    setBalance(0);
    setPnl(-2400);
    setHeartRate(140);
  };

  const handleCloseHalf = () => {
    setStep('success_end');
    setBalance(3000);
    setPnl(600);
    setHeartRate(72);
  };

  // Derive breathing cycle state
  let breathingState = 'INSPIRA (Toma aire...)';
  if (timerActive) {
    const cycle = Math.floor((15 - secondsLeft) / 4) % 2;
    breathingState = cycle === 0 ? 'INSPIRA (Toma aire...)' : 'EXPIRA (Saca el aire...)';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Intro del Simulador */}
      {step === 'intro' && (
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <Gamepad2 size={36} color="var(--color-cyan)" style={{ marginInline: 'auto', marginBottom: '8px' }} />
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Entrenamiento de Amígdala Inmersivo</h4>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.45 }}>
            Emilio, simula operar el Oro (XAUUSD) con una cuenta demo de $2.400. Pon a prueba tus impulsos cerebrales frente a la excitación y al pánico de forma controlada en frío.
          </p>
          <button onClick={handleStartSimulation} className="btn btn-cyan" style={{ marginTop: '14px', width: '100%', height: '36px', fontSize: '0.75rem', fontWeight: 700 }}>
            Iniciar Simulación Límbica
          </button>
        </div>
      )}

      {/* ESCENARIO 1: LA CODICIA (EXCITACIÓN EN GANANCIAS) */}
      {step === 'trade_win' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px', fontSize: '0.7rem' }}>
            <span>Oro Spot: <strong style={{ color: '#10b981' }}>${price.toFixed(2)}</strong></span>
            <span>Corazón: <strong style={{ color: 'var(--color-rose)' }}>💓 {heartRate} ppm</strong></span>
          </div>

          <div style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--color-emerald)', fontWeight: 800 }}>El trade va a tu favor</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', margin: '6px 0 0 0' }}>
              ${pnl} USD <span style={{ fontSize: '0.75rem', color: 'var(--color-emerald)' }}>(+{((pnl / 2400)*100).toFixed(0)}%)</span>
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
              Tu balance flotante sube con fuerza. Tu cerebro TDAH experimenta una oleada de dopamina. Te dice que esta es la operación milagrosa que pagará tus 160.000€ de deuda. ¿Qué haces?
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleHoldGreed} className="btn btn-rose" style={{ flex: 1, fontSize: '0.7rem', padding: '10px 0' }}>
              Mantener ("Es muy poco, necesito los 160k ya")
            </button>
            <button onClick={handleCloseHalf} className="btn btn-emerald animate-glow-emerald" style={{ flex: 1, fontSize: '0.7rem', padding: '10px 0' }}>
              Cerrar el 50% y poner SL en Breakeven
            </button>
          </div>
        </div>
      )}

      {/* ESCENARIO 2: SECUESTRO POR PÁNICO (PARÁLISIS) */}
      {step === 'trade_panic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px', fontSize: '0.7rem' }}>
            <span>Oro Spot: <strong style={{ color: 'var(--color-rose)' }}>${price.toFixed(2)}</strong></span>
            <span style={{ animation: 'pulse-soft 0.5s infinite alternate' }}>Corazón: <strong style={{ color: 'var(--color-rose)' }}>💓 {heartRate} ppm (TAQUICARDIA)</strong></span>
          </div>

          <div style={{ background: 'rgba(244,63,94,0.06)', border: '1px solid rgba(244,63,94,0.25)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
            <AlertOctagon size={24} color="var(--color-rose)" style={{ marginInline: 'auto', marginBottom: '6px', animation: 'spin 4s linear infinite' }} />
            <span style={{ fontSize: '0.62rem', textTransform: 'uppercase', color: 'var(--color-rose)', fontWeight: 800 }}>Secuestro de Amígdala Detectado</span>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', margin: '4px 0 0 0' }}>
              {pnl} USD <span style={{ fontSize: '0.75rem', color: 'var(--color-rose)' }}>({((pnl / 2400)*100).toFixed(0)}%)</span>
            </h3>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
              El precio se da la vuelta violentamente. Sientes un nudo en el estómago, sudor frío y parálisis mental ("Freeze"). Eres incapaz de cerrar porque te niegas a perder $600.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border)' }}>
            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block' }}>
              * Describe tu diálogo mental o justificación en este segundo de parálisis:
            </label>
            <input 
              type="text" 
              className="form-input" 
              value={dialogueText}
              onChange={(e) => setDialogueText(e.target.value)}
              placeholder="Ej: Tengo miedo a perder, espero que rebote..."
              style={{ height: '30px', fontSize: '0.72rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleAverageDown} className="btn btn-rose" style={{ flex: 1, fontSize: '0.7rem', padding: '10px 0' }}>
              Ponderar (Meter más lotes y quitar el Stop Loss)
            </button>
            <button 
              onClick={handleStartBreathing} 
              disabled={dialogueText.trim().length < 8}
              className="btn btn-cyan" 
              style={{ flex: 1, fontSize: '0.7rem', padding: '10px 0', opacity: dialogueText.trim().length < 8 ? 0.5 : 1 }}
              title="Describe primero tu diálogo mental para activar el enfriamiento"
            >
              Iniciar Enfriamiento de Amígdala
            </button>
          </div>
        </div>
      )}

      {/* ESCENARIO 2.5: RESPIRACIÓN OBLIGATORIA (RESET) */}
      {step === 'breathing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', textAlign: 'center' }}>
          <Brain size={28} color="var(--color-cyan)" className="animate-pulse-soft" />
          <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Reset Fisiológico de Choque</h4>
          
          <div style={{ position: 'relative', width: '90px', height: '90px', margin: '10px 0' }}>
            <div className={`timer-circle-breathing active`} style={{ width: '100%', height: '100%', border: '4px solid var(--color-cyan)', borderRadius: '50%', position: 'absolute', transform: 'scale(0.8)' }}></div>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 900, color: '#ffffff' }}>
              {secondsLeft}s
            </div>
          </div>

          <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>{breathingState}</span>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', maxWidth: '280px', lineHeight: 1.4 }}>
            Tu cerebro límbico está desconectando. Sigue la expansión de la respiración 4-7-8 para reactivar tu corteza prefrontal y tomar una decisión matemática.
          </p>

          <button 
            onClick={handleCutLoss} 
            disabled={secondsLeft > 0}
            className="btn btn-emerald animate-glow-emerald" 
            style={{ width: '100%', height: '36px', fontSize: '0.72rem', fontWeight: 700, opacity: secondsLeft > 0 ? 0.5 : 1 }}
          >
            {secondsLeft > 0 ? `Bloqueado por respiración (${secondsLeft}s)...` : "Desbloquear Cierre y Cortar Posición"}
          </button>
        </div>
      )}

      {/* ESCENARIO 3: CORTE DE PÉRDIDAS SANO */}
      {step === 'loss_cut' && (
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <Heart size={36} color="var(--color-emerald)" style={{ marginInline: 'auto', marginBottom: '8px' }} />
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Pérdida Aceptada con Éxito</h4>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.45 }}>
            Has cerrado a mercado perdiendo <strong style={{ color: 'var(--color-rose)' }}>-$800</strong>. Sientes dolor en tu orgullo, pero te quedan <strong style={{ color: '#ffffff' }}>$1.600</strong> en el balance de tu cuenta. Has evitado la ruina y sigues con vida.
          </p>
          <button onClick={() => setStep('intro')} className="btn btn-outline" style={{ marginTop: '14px', width: '100%', height: '34px', fontSize: '0.7rem' }}>
            Reiniciar Entrenamiento
          </button>
        </div>
      )}

      {/* ESCENARIO 4: LA RUINA TOTAL (AVERAGE DOWN) */}
      {step === 'liquidated' && (
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <AlertOctagon size={36} color="var(--color-rose)" style={{ marginInline: 'auto', marginBottom: '8px', animation: 'bounce 1s infinite' }} />
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-rose)', margin: 0 }}>CUENTA LIQUIDADA ($0)</h4>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.45 }}>
            El mercado ha barrido tu posición. Has quemado los $2.400 netos. Experimentas desesperación y culpa. Has boicoteado tu nómina antes del día 4 y tendrás que volver a pedir prestado.
          </p>
          <button onClick={() => setStep('intro')} className="btn btn-rose" style={{ marginTop: '14px', width: '100%', height: '34px', fontSize: '0.7rem', fontWeight: 700 }}>
            Reiniciar y Aprender de la Crisis
          </button>
        </div>
      )}

      {/* ESCENARIO 5: ÉXITO (CIERRE PARCIAL Y DISCIPLINA) */}
      {step === 'success_end' && (
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <ShieldCheck size={36} color="var(--color-emerald)" style={{ marginInline: 'auto', marginBottom: '8px' }} />
          <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-emerald)', margin: 0 }}>¡Disciplina Consolidada!</h4>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.45 }}>
            Has cerrado tu parcial y asegurado <strong style={{ color: 'var(--color-emerald)' }}>+$600</strong> limpios. Tu stop-loss a breakeven protege el resto. Estás operando con el proceso matemático correcto, no con emociones.
          </p>
          <button onClick={() => setStep('intro')} className="btn btn-cyan" style={{ marginTop: '14px', width: '100%', height: '34px', fontSize: '0.7rem', fontWeight: 700 }}>
            Reiniciar Entrenamiento
          </button>
        </div>
      )}

    </div>
  );
}
