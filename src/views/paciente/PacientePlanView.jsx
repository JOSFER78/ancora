import { useState, useEffect } from 'react';
import {
  Target,
  CheckSquare,
  Sparkles,
  TrendingUp,
  Award,
  Clock,
  ShieldCheck,
  Plus,
  Trash2,
  MessageSquare
} from 'lucide-react';

import {
  getClinicalTasksSync,
  saveClinicalTasksSync,
  calculateAdherence,
  getAgendaTopicsSync,
  saveAgendaTopicsSync
} from '../../services/clinicalSyncService.js';
export default function PacientePlanView({ profile, user, isVirtualDemo, onNavigate }) {
  const [loading, setLoading] = useState(false);
  const userId = user?.id || profile?.id || 'guest';
  
  // Objetivos clínicos demo/reales
  const [objectives, setObjectives] = useState([
    { id: 'obj-1', title: 'Regular Ansiedad Laboral', desc: 'Identificar picos de estrés y aplicar técnicas cognitivo-conductuales antes de reuniones.', category: 'Ansiedad' },
    { id: 'obj-2', title: 'Mejorar Higiene del Sueño', desc: 'Establecer rutina de desactivación nocturna de pantallas y dormir al menos 7 horas.', category: 'Salud' },
    { id: 'obj-3', title: 'Establecer Límites Asertivos', desc: 'Aprender a delegar tareas y comunicar disponibilidad sin culpa a iguales.', category: 'Asertividad' }
  ]);

  // Tareas y ejercicios semanales interactivos sincronizados
  const [tasks, setTasks] = useState(() => getClinicalTasksSync(userId));
  const [adherence, setAdherence] = useState(() => calculateAdherence(getClinicalTasksSync(userId)));

  // Temas y puntos a tratar en consulta sincronizados
  const [agendaTopics, setAgendaTopics] = useState(() => getAgendaTopicsSync(userId));
  const [newTopicText, setNewTopicText] = useState('');

  // Escuchar eventos reactivos de sincronización
  useEffect(() => {
    const handleTasksUpdated = (e) => {
      if (e.detail) {
        setTasks(e.detail);
        setAdherence(calculateAdherence(e.detail));
      }
    };
    const handleAgendaUpdated = (e) => {
      if (e.detail) setAgendaTopics(e.detail);
    };

    window.addEventListener('ancora_tasks_updated', handleTasksUpdated);
    window.addEventListener('ancora_agenda_updated', handleAgendaUpdated);
    return () => {
      window.removeEventListener('ancora_tasks_updated', handleTasksUpdated);
      window.removeEventListener('ancora_agenda_updated', handleAgendaUpdated);
    };
  }, []);

  const handleToggleTask = (taskId) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    setTasks(updated);
    setAdherence(calculateAdherence(updated));
    saveClinicalTasksSync(userId, updated);
  };

  const handleAddTopic = (e) => {
    e?.preventDefault();
    if (!newTopicText || !newTopicText.trim()) return;
    const newTopic = {
      id: `top-${Date.now()}`,
      text: newTopicText.trim(),
      done: false,
      source: 'plan',
      date: 'Hoy'
    };
    const updated = [newTopic, ...agendaTopics];
    setAgendaTopics(updated);
    saveAgendaTopicsSync(userId, updated);
    setNewTopicText('');
  };

  const handleToggleTopic = (id) => {
    const updated = agendaTopics.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setAgendaTopics(updated);
    saveAgendaTopicsSync(userId, updated);
  };

  const handleDeleteTopic = (id) => {
    const updated = agendaTopics.filter(t => t.id !== id);
    setAgendaTopics(updated);
    saveAgendaTopicsSync(userId, updated);
  };

  // Rutinas recomendadas por el terapeuta
  const routines = [
    { title: 'Check-in Emocional en Áncora', frequency: 'Diario', icon: Sparkles, color: 'var(--color-cyan)' },
    { title: 'Paseo al aire libre sin dispositivos', frequency: '3 veces/semana', icon: Clock, color: 'var(--color-emerald)' },
    { title: 'Toma de Medicación (si está pautada)', frequency: 'Diario (Mañanas)', icon: ShieldCheck, color: 'var(--color-cyan)' }
  ];

  const getAdherenceColor = (val) => {
    if (val >= 80) return 'var(--color-emerald)';
    if (val >= 50) return 'var(--color-amber)';
    return 'var(--color-rose)';
  };

  return (
    <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
      
      {/* Cabecera y Racha */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Mi Plan Clínico y Tareas</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Visualiza los objetivos pautados por tu psicóloga y haz seguimiento de tus ejercicios semanales.
          </p>
        </div>

        {/* Widget de Racha / Nivel */}
        <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: 'rgba(6,182,212,0.03)', borderColor: 'rgba(6,182,212,0.1)' }}>
          <div className="flex-center" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: 'var(--color-emerald)' }}>
            <Award size={18} />
          </div>
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Nivel de Adherencia</span>
            <strong style={{ fontSize: '0.82rem', color: '#ffffff' }}>
              {adherence >= 80 ? 'Excelente' : (adherence >= 50 ? 'Estable' : 'Requiere foco')}
            </strong>
          </div>
        </div>
      </div>

      {/* Grid de Contenidos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }} className="grid-responsive-detail">
        
        {/* Columna Izquierda: Objetivos y Tareas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tareas Semanales */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={16} color="var(--color-cyan)" />
              Tareas y Ejercicios de la Semana
            </h3>

            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>
              Completa estas actividades diarias o semanales diseñadas para trabajar en tus metas clínicas. Al marcarlas, tu adherencia se actualizará en tiempo real.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {tasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => handleToggleTask(task.id)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    background: task.done ? 'rgba(16,185,129,0.03)' : 'rgba(255,255,255,0.01)',
                    border: '1px solid',
                    borderColor: task.done ? 'rgba(16,185,129,0.15)' : 'var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: task.done ? 'inset 0 0 10px rgba(16,185,129,0.02)' : 'none'
                  }}
                  className="task-row-interactive"
                >
                  {/* Custom Checkbox */}
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    border: '2px solid',
                    borderColor: task.done ? 'var(--color-emerald)' : 'var(--text-tertiary)',
                    background: task.done ? 'var(--color-emerald)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}>
                    {task.done && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 4.5L3.5 7L9 1" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>

                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <span style={{ 
                      fontSize: '0.78rem', 
                      color: task.done ? 'var(--text-secondary)' : '#ffffff',
                      textDecoration: task.done ? 'line-through' : 'none',
                      fontWeight: task.done ? 500 : 600,
                      transition: 'all 0.2s'
                    }}>
                      {task.title}
                    </span>
                  </div>

                  <span className="badge" style={{ 
                    fontSize: '0.58rem', 
                    padding: '2px 8px', 
                    background: task.done ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
                    color: task.done ? 'var(--color-emerald)' : 'var(--text-secondary)',
                    borderColor: task.done ? 'rgba(16,185,129,0.15)' : 'transparent'
                  }}>
                    +{task.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Objetivos Clínicos */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={16} color="var(--color-cyan)" />
              Objetivos Terapéuticos Activos
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {objectives.map(obj => (
                <div 
                  key={obj.id}
                  style={{
                    padding: '14px',
                    borderRadius: '8px',
                    background: 'var(--background-secondary)',
                    border: '1px solid var(--border)',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '0.82rem', color: '#ffffff' }}>{obj.title}</strong>
                    <span className="badge badge-cyan" style={{ fontSize: '0.55rem', textTransform: 'uppercase' }}>{obj.category}</span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    {obj.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Columna Derecha: Adherencia y Rutinas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Adherencia Semanal */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', borderLeft: '4px solid var(--color-cyan)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', width: '100%', textAlign: 'left', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="var(--color-cyan)" />
              Adherencia General
            </h3>

            {/* Círculo de progreso SVG */}
            <div style={{ position: 'relative', width: '130px', height: '130px', margin: '10px 0' }}>
              <svg width="130" height="130" viewBox="0 0 130 130">
                <circle 
                  cx="65" 
                  cy="65" 
                  r="52" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.03)" 
                  strokeWidth="8" 
                />
                <circle 
                  cx="65" 
                  cy="65" 
                  r="52" 
                  fill="none" 
                  stroke={getAdherenceColor(adherence)} 
                  strokeWidth="8" 
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - adherence / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 65 65)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s' }}
                />
              </svg>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#ffffff' }}>{adherence}%</span>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completado</span>
              </div>
            </div>

            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Mantén tu nivel por encima del 80% completando los ejercicios recomendados. Esto facilita la monitorización de síntomas clínicos de tu psicóloga.
            </p>
          </div>

          {/* Rutinas pautadas */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="var(--color-emerald)" />
              Rutinas & Hábitos Clínicos
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {routines.map((routine, idx) => {
                const Icon = routine.icon;
                return (
                  <div 
                    key={idx}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.01)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left'
                    }}
                  >
                    <div className="flex-center" style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', color: routine.color }}>
                      <Icon size={14} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '0.74rem', color: '#ffffff', display: 'block' }}>{routine.title}</strong>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Frecuencia: {routine.frequency}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Temas Sincronizados para Consulta */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={16} color="var(--color-cyan)" />
                Temas para tu Consulta
              </h3>
              <span className="badge badge-cyan" style={{ fontSize: '0.55rem' }}>
                {agendaTopics.filter(t => !t.done).length} pendientes
              </span>
            </div>

            <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.3 }}>
              Puntos anotados que se sincronizan en tiempo real con tu historial del chat para tratar con tu terapeuta.
            </p>

            <form onSubmit={handleAddTopic} style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="+ Anotar duda o tema clínico..."
                value={newTopicText}
                onChange={(e) => setNewTopicText(e.target.value)}
                style={{
                  flex: 1,
                  fontSize: '0.72rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '6px 10px', background: 'var(--color-cyan)', fontSize: '0.7rem' }}
                title="Añadir tema"
              >
                <Plus size={14} />
              </button>
            </form>

            {agendaTopics.length === 0 ? (
              <span style={{ fontSize: '0.66rem', color: 'var(--text-tertiary)', fontStyle: 'italic', display: 'block', padding: '6px 0' }}>
                No tienes temas pendientes anotados para tu próxima consulta.
              </span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
                {agendaTopics.map(topic => (
                  <div
                    key={topic.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: topic.done ? 'rgba(255,255,255,0.01)' : 'rgba(6,182,212,0.05)',
                      border: '1px solid',
                      borderColor: topic.done ? 'rgba(255,255,255,0.03)' : 'rgba(6,182,212,0.18)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={topic.done}
                        onChange={() => handleToggleTopic(topic.id)}
                        style={{ cursor: 'pointer', marginTop: '2px', accentColor: 'var(--color-cyan)' }}
                      />
                      <span style={{
                        fontSize: '0.7rem',
                        color: topic.done ? 'var(--text-tertiary)' : '#ffffff',
                        textDecoration: topic.done ? 'line-through' : 'none',
                        lineHeight: 1.3
                      }}>
                        {topic.text}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteTopic(topic.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px' }}
                      title="Eliminar"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
