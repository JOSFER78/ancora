import { useState } from 'react';
import { Scale, Heart, Info, Edit3, Check } from 'lucide-react';

export default function GriefWidget() {
  const [griefSalary, setGriefSalary] = useState(3300);
  const [griefWin, setGriefWin] = useState(400);
  const [griefTotalLost, setGriefTotalLost] = useState(1100000);
  
  const [selectedTrigger, setSelectedTrigger] = useState('');
  const [writeInText, setWriteInText] = useState('');
  const [writingDone, setWritingDone] = useState(false);

  const usdToEurRate = 0.92;
  const eurWin = griefWin * usdToEurRate;
  
  // 150€ por día es aprox. el salario diario neto con 3300€/mes (22 días hábiles)
  const salaryPerDay = griefSalary > 0 ? (griefSalary / 22) : 150;
  const equivalentDaysInEfe = salaryPerDay > 0 ? (eurWin / salaryPerDay).toFixed(1) : 0;
  const schoolMonthsLola = (eurWin / 300).toFixed(1); // 300€ es una cuota escolar aproximada

  const triggersMap = {
    hurry: {
      label: "Tengo prisa por recuperar mi millón de euros hoy",
      phrase: "No puedo recuperar en un día lo que perdí en años. La prisa es un secuestro de mi amígdala. $400 hoy son un ladrillo real. Lola me necesita sano, estable y en casa, no rico.",
    },
    greed: {
      label: "Veo $400 positivos pero quiero dejar correr para ganar $2000",
      phrase: "Aceptar $400 hoy equivale a dos días enteros de madrugar en la Agencia EFE. Tomo mi parcial, protejo mi stop y celebro la ganancia pequeña. Consistencia es libertad.",
    },
    loss_fear: {
      label: "Estoy en -$150 y quiero quitar el Stop Loss para no perder",
      phrase: "Cortar una pérdida pequeña de $150 es una decisión matemática correcta. Si promedio a la baja, destruiré mi cuenta y me quedaré sin nómina antes del día 4. Acepto el corte.",
    }
  };

  const handleTriggerChange = (e) => {
    setSelectedTrigger(e.target.value);
    setWriteInText('');
    setWritingDone(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Explicación y cálculo de Escala */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
        
        {/* Parámetros */}
        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h5 style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>Parámetros de Duelo</h5>
          <div className="form-group">
            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Nómina EFE Mensual (€)</label>
            <input type="number" className="form-input" value={griefSalary} onChange={(e) => setGriefSalary(parseFloat(e.target.value) || 0)} style={{ height: '26px', fontSize: '0.7rem' }} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Ganancia del Trade ($)</label>
            <input type="number" className="form-input" value={griefWin} onChange={(e) => setGriefWin(parseFloat(e.target.value) || 0)} style={{ height: '26px', fontSize: '0.7rem' }} />
          </div>
          <div className="form-group">
            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Pérdidas del Pasado (€)</label>
            <input type="number" className="form-input" value={griefTotalLost} onChange={(e) => setGriefTotalLost(parseFloat(e.target.value) || 0)} style={{ height: '26px', fontSize: '0.7rem' }} />
          </div>
        </div>

        {/* Visualizador de Escala Real (Equivalencias) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          <div style={{ padding: '12px', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '6px' }}>
            <span style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--color-emerald)', textTransform: 'uppercase' }}>Valor Real del Dinero Cobrado</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
              <div>
                💵 Equivale a: <strong style={{ color: '#ffffff' }}>{equivalentDaysInEfe} días</strong> de trabajo neto en la Agencia EFE.
              </div>
              <div>
                🎒 Equivale a: <strong style={{ color: '#ffffff' }}>{schoolMonthsLola} meses</strong> de colegio de tu hija Lola.
              </div>
              <div>
                📉 Equivale a: Reducir tu deuda activa en un <strong style={{ color: 'var(--color-emerald)' }}>{((eurWin / 160000) * 100).toFixed(2)}%</strong>.
              </div>
            </div>
          </div>

          <div style={{ padding: '10px', background: 'rgba(244,63,94,0.03)', border: '1px solid rgba(244,63,94,0.12)', borderRadius: '6px', fontSize: '0.65rem', lineHeight: 1.4 }}>
            <span style={{ color: 'var(--color-rose)', fontWeight: 700 }}>La ceguera de tu amígdala:</span>
            <p style={{ margin: '2px 0 0 0', color: 'var(--text-secondary)' }}>
              Comparar tu ganancia de ${griefWin} contra la pérdida de {griefTotalLost.toLocaleString()} € te hace sentir fracaso y te empuja al tilt. ¡Cierra a mercado y valora tu esfuerzo real!
            </p>
          </div>

        </div>
      </div>

      {/* EJERCICIO CONDUCTUAL (REENCUADRE ESCRITO DE EMILIO) */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
        <h5 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Scale size={14} color="var(--color-cyan)" />
          Entrenamiento de Autocontrol Prefrontal (Barkley)
        </h5>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="form-group">
            <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>¿Cuál es tu disparador o trampa mental en este momento?</label>
            <select className="form-select" value={selectedTrigger} onChange={handleTriggerChange} style={{ height: '30px', fontSize: '0.72rem', background: 'rgba(0,0,0,0.2)' }}>
              <option value="">-- Selecciona tu estado límbico actual --</option>
              <option value="hurry">{triggersMap.hurry.label}</option>
              <option value="greed">{triggersMap.greed.label}</option>
              <option value="loss_fear">{triggersMap.loss_fear.label}</option>
            </select>
          </div>

          {selectedTrigger && (
            <div style={{ padding: '12px', background: 'rgba(6,182,212,0.03)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--color-cyan)', fontWeight: 700 }}>AFIRMACIÓN DE INHIBICIÓN DE WALTER:</span>
              <p style={{ fontSize: '0.72rem', color: '#ffffff', fontStyle: 'italic', margin: 0 }}>
                "{triggersMap[selectedTrigger].phrase}"
              </p>
              
              <div style={{ borderTop: '1px solid rgba(6,182,212,0.1)', paddingTop: '8px' }}>
                <label style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  * Escribe la frase exacta a continuación para reentrenar tu corteza prefrontal:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={writeInText}
                    onChange={(e) => {
                      setWriteInText(e.target.value);
                      if (e.target.value.trim() === triggersMap[selectedTrigger].phrase.trim()) {
                        setWritingDone(true);
                      } else {
                        setWritingDone(false);
                      }
                    }}
                    placeholder="Escribe aquí la afirmación de Walter..."
                    style={{ flex: 1, height: '30px', fontSize: '0.72rem' }}
                    disabled={writingDone}
                  />
                  {writingDone && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-emerald)', fontSize: '0.68rem', fontWeight: 700 }}>
                      <Check size={16} /> ¡Grabado!
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
