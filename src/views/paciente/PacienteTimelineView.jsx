import { useState } from 'react';
import { 
  Calendar, TrendingUp, TrendingDown, Clock, 
  AlertTriangle, Heart, MessageSquare, Star, Sparkles
} from 'lucide-react';

export default function PacienteTimelineView({ isVirtualDemo }) {
  const [activeRange, setActiveRange] = useState('7d'); // '7d' | '30d' | '3m'
  
  // Datos de Tendencia Simulado/Real
  const trends = isVirtualDemo ? [
    { label: 'Ansiedad', val: '-18%', type: 'good', icon: TrendingDown, color: 'var(--color-emerald)' },
    { label: 'Calidad de Sueño', val: '+5%', type: 'good', icon: TrendingUp, color: 'var(--color-emerald)' },
    { label: 'Energía Diaria', val: '+22%', type: 'good', icon: TrendingUp, color: 'var(--color-emerald)' },
    { label: 'Estrés Percibido', val: '+10%', type: 'bad', icon: TrendingUp, color: 'var(--color-rose)' }
  ] : [
    { label: 'Ansiedad', val: '--', type: 'good', icon: TrendingDown, color: 'var(--text-tertiary)' },
    { label: 'Calidad de Sueño', val: '--', type: 'good', icon: TrendingUp, color: 'var(--text-tertiary)' },
    { label: 'Energía Diaria', val: '--', type: 'good', icon: TrendingUp, color: 'var(--text-tertiary)' },
    { label: 'Estrés Percibido', val: '--', type: 'bad', icon: TrendingUp, color: 'var(--text-tertiary)' }
  ];

  // Frecuencia de disparadores
  const triggersFrequency = isVirtualDemo ? [
    { label: '💼 Sobrecarga laboral', pct: 65, count: 5 },
    { label: '📱 Videollamadas / Reuniones', pct: 40, count: 3 },
    { label: '🌙 Falta de sueño', pct: 28, count: 2 },
    { label: '🏠 Conflicto familiar', pct: 15, count: 1 }
  ] : [];

  // Eventos de la Línea de Tiempo
  const timelineEvents = isVirtualDemo ? [
    {
      id: 1,
      date: 'Hoy, 29 de Mayo',
      type: 'check_in',
      title: 'Registro de diario emocional',
      detail: 'Ánimo regular, ansiedad moderada (5/10), estrés elevado (6/10) tras reunión. Durmió 7 horas.',
      tag: 'Trabajo'
    },
    {
      id: 2,
      date: 'Ayer, 28 de Mayo',
      type: 'chat',
      title: 'Chat de acompañamiento con Walter',
      detail: 'Habló sobre el miedo a fallar en los entregables del trabajo. Walter estructuró 3 tareas conductuales.',
      tag: 'Autoexigencia'
    },
    {
      id: 3,
      date: '22 de Mayo, 17:00h',
      type: 'session',
      title: 'Sesión clínica de videollamada',
      detail: 'Consulta regular con la Dra. María Fernández. Se abordó el esquema de perfeccionismo y autoexigencia.',
      tag: 'Terapia'
    },
    {
      id: 4,
      date: '19 de Mayo',
      type: 'check_in',
      title: 'Registro de diario emocional',
      detail: 'Ánimo muy bueno, energía alta (8/10), baja ansiedad. Durmió 8 horas durante el fin de semana.',
      tag: 'Descanso'
    }
  ] : [];

  return (
    <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
      
      {/* Filtros de Rango de Tiempo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Timeline Emocional y Progreso</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Visualización longitudinal de tu evolución clínica.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '6px', background: 'var(--background-secondary)', border: '1px solid var(--border)', borderRadius: '20px', padding: '3px' }}>
          {['7d', '30d', '3m'].map(range => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '6px 14px',
                borderRadius: '16px',
                background: activeRange === range ? 'var(--color-emerald)' : 'transparent',
                color: activeRange === range ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              {range === '7d' && 'Últimos 7 días'}
              {range === '30d' && 'Últimos 30 días'}
              {range === '3m' && 'Últimos 3 meses'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Tendencias y Disparadores */}
      <div className="grid-2" style={{ gap: '20px' }}>
        
        {/* Caja de Tendencias */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            📊 Tendencias Semanales
          </h3>
          
          <div className="grid-2" style={{ gap: '12px' }}>
            {trends.map((trend, idx) => {
              const Icon = trend.icon;
              return (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '16px', 
                    borderRadius: 'var(--radius-md)', 
                    background: 'var(--background-secondary)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{trend.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <Icon size={16} color={trend.color} />
                    <strong style={{ fontSize: '1.2rem', color: trend.color }}>{trend.val}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Caja de Disparadores Frecuentes */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
            ⚠️ Disparadores Más Frecuentes
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'center', minHeight: '120px' }}>
            {triggersFrequency.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '0.72rem', lineHeight: 1.4 }}>
                No hay disparadores registrados aún. Tus detonantes frecuentes aparecerán a medida que interactúes con tu diario emocional.
              </div>
            ) : (
              triggersFrequency.map((trig, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>{trig.label}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{trig.count} veces ({trig.pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'var(--background-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${trig.pct}%`, 
                        height: '100%', 
                        background: trig.pct > 50 ? 'var(--color-rose)' : 'var(--color-cyan)', 
                        borderRadius: '3px' 
                      }} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Línea de Tiempo de Eventos (Vertical) */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
          ⏳ Historial de Sesiones y Registros
        </h3>

        {timelineEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--text-tertiary)', fontStyle: 'italic', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <Calendar size={24} style={{ opacity: 0.5 }} />
            <span>Tu línea de tiempo está lista para comenzar.</span>
            <span style={{ fontSize: '0.68rem', maxWidth: '300px', margin: '4px auto 0', lineHeight: 1.45 }}>
              Aquí verás tus hitos, registros de diario emocional y resúmenes de consultas a medida que inicies tu proceso.
            </span>
          </div>
        ) : (
          <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '2px solid var(--border)' }}>
            {timelineEvents.map((evt, idx) => (
              <div 
                key={evt.id} 
                style={{ 
                  position: 'relative', 
                  marginBottom: idx === timelineEvents.length - 1 ? '0' : '28px' 
                }}
              >
                {/* Punto indicador del Timeline */}
                <div 
                  style={{
                    position: 'absolute',
                    left: '-31px',
                    top: '4px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: evt.type === 'session' ? 'var(--color-cyan)' : (evt.type === 'chat' ? 'var(--color-emerald)' : 'var(--border)'),
                    border: '2px solid var(--background-secondary)',
                    boxShadow: `0 0 6px ${evt.type === 'session' ? 'var(--color-cyan)' : (evt.type === 'chat' ? 'var(--color-emerald)' : 'transparent')}`
                  }} 
                />

                {/* Event Card */}
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      {evt.date}
                    </span>
                    
                    {evt.tag && (
                      <span 
                        className="badge" 
                        style={{ 
                          fontSize: '0.62rem', 
                          padding: '2px 8px',
                          background: evt.type === 'session' ? 'rgba(68,125,130,0.1)' : 'rgba(255,255,255,0.02)',
                          borderColor: evt.type === 'session' ? 'var(--color-cyan)' : 'var(--border)',
                          color: evt.type === 'session' ? 'var(--color-cyan)' : 'var(--text-secondary)',
                          textTransform: 'none'
                        }}
                      >
                        {evt.tag}
                      </span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#ffffff', marginTop: '6px' }}>
                    {evt.title}
                  </h4>
                  
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
                    {evt.detail}
                  </p>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
