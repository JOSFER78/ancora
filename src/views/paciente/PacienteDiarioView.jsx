import { useState } from 'react';
import {
  Heart,
  TrendingUp,
  Check,
  Moon,
  Zap,
  Sparkles,
  HelpCircle
} from 'lucide-react';
export default function PacienteDiarioView({ onMoodSaved, dailyMoodToday }) {
  const [mood, setMood] = useState(dailyMoodToday?.notes ? 4 : 3); // 1-5 Scale
  const [anxiety, setAnxiety] = useState(dailyMoodToday?.anxiety_level || 4); // 1-10 Scale
  const [stress, setStress] = useState(dailyMoodToday?.impulsivity_level || 5); // 1-10 Scale
  const [sleepHours, setSleepHours] = useState(7); // 1-12 Hours
  const [energy, setEnergy] = useState(6); // 1-10 Scale
  const [selectedTriggers, setSelectedTriggers] = useState([]);
  const [notes, setNotes] = useState(dailyMoodToday?.notes || '');
  const [saved, setSaved] = useState(!!dailyMoodToday);

  const triggersList = [
    { id: 'trabajo', label: '💼 Trabajo' },
    { id: 'pareja', label: '❤️ Pareja' },
    { id: 'familia', label: '🏠 Familia' },
    { id: 'salud', label: '🩺 Salud' },
    { id: 'soledad', label: '👤 Soledad' },
    { id: 'dinero', label: '💵 Dinero' },
    { id: 'sueno', label: '🌙 Falta de sueño' },
    { id: 'redes', label: '📱 Redes sociales' },
    { id: 'alimentacion', label: '🍎 Alimentación' }
  ];

  const handleToggleTrigger = (id) => {
    if (selectedTriggers.includes(id)) {
      setSelectedTriggers(prev => prev.filter(t => t !== id));
    } else {
      setSelectedTriggers(prev => [...prev, id]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    if (onMoodSaved) {
      const todayDate = new Date().toISOString().split('T')[0];
      const newMood = {
        date: todayDate,
        anxiety_level: anxiety,
        impulsivity_level: stress, // mapeado como estrés/impulsividad
        energy_level: energy,
        notes: notes,
        sleep_hours: sleepHours,
        triggers: selectedTriggers
      };
      onMoodSaved(newMood);
    }
  };

  return (
    <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
      
      {/* Banner Informativo */}
      <div className="glass-panel" style={{ padding: '16px 20px', borderLeft: '4px solid var(--color-emerald)', background: 'rgba(127,159,136,0.02)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <Sparkles size={16} color="var(--color-emerald)" />
          Diario Emocional y Correlaciones
        </h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.45 }}>
          Registra tus niveles cotidianos. Ánquer procesa estos datos de forma local y anónima para extraer tendencias e identificar detonantes clínicos que tu psicólogo revisará contigo.
        </p>
      </div>

      <div className="grid-2" style={{ gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Formulario de Registro */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Heart size={18} color="var(--color-rose)" />
            Check-in Diario
          </h3>

          {saved ? (
            <div style={{ textAlign: 'center', padding: '30px 0', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
              <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(127,159,136,0.1)', color: 'var(--color-emerald)' }}>
                <Check size={26} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-emerald)' }}>¡Registro Guardado con Éxito!</h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Tu psicóloga asignada ya tiene acceso a esta actualización en su panel clínico.
              </p>
              <button 
                onClick={() => setSaved(false)}
                className="btn btn-outline" 
                style={{ height: '32px', fontSize: '0.72rem', marginTop: '10px' }}
              >
                Modificar registro de hoy
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Ánimo General */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Ánimo General</span>
                  <strong style={{ color: 'var(--color-emerald)' }}>
                    {mood === 1 && '😢 Muy desanimado'}
                    {mood === 2 && '🙁 Algo triste'}
                    {mood === 3 && '😐 Neutral'}
                    {mood === 4 && '🙂 Contento'}
                    {mood === 5 && '😀 Muy feliz'}
                  </strong>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="5" 
                  value={mood} 
                  onChange={(e) => setMood(parseInt(e.target.value))}
                  style={{ width: '100%', height: '6px', background: 'var(--background-tertiary)', borderRadius: '3px', outline: 'none' }}
                />
              </div>

              {/* Grid Deslizadores */}
              <div className="grid-2" style={{ gap: '16px' }}>
                
                {/* Ansiedad */}
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Nivel de Ansiedad</span>
                    <strong>{anxiety} / 10</strong>
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={anxiety} 
                    onChange={(e) => setAnxiety(parseInt(e.target.value))}
                    style={{ width: '100%', height: '6px', background: 'var(--background-tertiary)' }}
                  />
                </div>

                {/* Estrés */}
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Nivel de Estrés</span>
                    <strong>{stress} / 10</strong>
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={stress} 
                    onChange={(e) => setStress(parseInt(e.target.value))}
                    style={{ width: '100%', height: '6px', background: 'var(--background-tertiary)' }}
                  />
                </div>

              </div>

              {/* Grid Energía y Sueño */}
              <div className="grid-2" style={{ gap: '16px' }}>
                
                {/* Sueño */}
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Horas de Sueño</span>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Moon size={12} /> {sleepHours}h
                    </strong>
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="12" 
                    value={sleepHours} 
                    onChange={(e) => setSleepHours(parseInt(e.target.value))}
                    style={{ width: '100%', height: '6px', background: 'var(--background-tertiary)' }}
                  />
                </div>

                {/* Energía */}
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Nivel de Energía</span>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Zap size={12} color="var(--color-amber)" /> {energy} / 10
                    </strong>
                  </label>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    value={energy} 
                    onChange={(e) => setEnergy(parseInt(e.target.value))}
                    style={{ width: '100%', height: '6px', background: 'var(--background-tertiary)' }}
                  />
                </div>

              </div>

              {/* Disparadores (Triggers) */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.72rem', marginBottom: '8px', display: 'block' }}>
                  ¿Qué factores han influido hoy en tu estado emocional? (Selecciona los que apliquen)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {triggersList.map(trigger => {
                    const isSelected = selectedTriggers.includes(trigger.id);
                    return (
                      <button
                        key={trigger.id}
                        type="button"
                        onClick={() => handleToggleTrigger(trigger.id)}
                        className="badge"
                        style={{
                          fontSize: '0.7rem',
                          padding: '6px 12px',
                          background: isSelected ? 'rgba(127,159,136,0.12)' : 'rgba(255,255,255,0.02)',
                          borderColor: isSelected ? 'var(--color-emerald)' : 'var(--border)',
                          color: isSelected ? 'var(--color-emerald)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                          textTransform: 'none'
                        }}
                      >
                        {trigger.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notas de Contexto */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.72rem' }}>Notas cualitativas u observaciones del día (Privado)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe qué ocurrió hoy, cómo reaccionaste o qué pensamientos automáticos tuviste..."
                  style={{
                    width: '100%',
                    height: '80px',
                    background: 'var(--background-tertiary)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '10px',
                    fontSize: '0.78rem',
                    color: '#ffffff',
                    resize: 'none'
                  }}
                />
              </div>

              <button type="submit" className="btn btn-emerald" style={{ height: '40px', width: '100%', fontSize: '0.82rem', marginTop: '6px' }}>
                <span>Guardar Registro Diario</span>
              </button>

            </form>
          )}
        </div>

        {/* insights y Preparación de Sesión */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Insights de Tendencia */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={16} color="var(--color-cyan)" />
              Patrones Identificados por la IA
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(68,125,130,0.04)', borderLeft: '3px solid var(--color-cyan)', fontSize: '0.75rem', lineHeight: 1.4 }}>
                <strong>Correlación Sueño - Ansiedad:</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Esta semana tus picos de ansiedad (puntuación &gt; 7) ocurrieron en días con menos de 6 horas de sueño acumuladas.
                </p>
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(68,125,130,0.04)', borderLeft: '3px solid var(--color-cyan)', fontSize: '0.75rem', lineHeight: 1.4 }}>
                <strong>Detonante Principal:</strong>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                  El tag <strong>💼 Trabajo</strong> se asoció con un incremento del 35% en tu nivel de estrés diario en comparación con los fines de semana.
                </p>
              </div>

            </div>

            <p style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', marginTop: '14px', lineHeight: 1.35 }}>
              *Estos insights son estimaciones estadísticas de correlación basadas en tus registros conductuales y no representan diagnósticos médicos autónomos.
            </p>
          </div>

          {/* Preparación de Sesión */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={16} color="var(--color-emerald)" />
              Preparación de tu Próxima Sesión
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '14px' }}>
              Ánquer ha estructurado estos temas clave para que los trates en tu próxima sesión con tu terapeuta:
            </p>
            
            <ul style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.4 }}>
              <li>Explorar las sensaciones de taquicardia declaradas en la reunión de ventas de esta semana.</li>
              <li>Revisar los límites establecidos en las horas extra laborales.</li>
              <li>Analizar las causas del insomnio de conciliación registrado el martes por la noche.</li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
}
