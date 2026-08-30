import { useState, useEffect } from 'react';
import { firebaseClient as db, firebaseClient } from '../../firebaseAdapter.js';
import { 
  Calendar, Clock, Video, ChevronLeft, ChevronRight, 
  CheckCircle2, User, AlertCircle, CreditCard, ShieldCheck, RefreshCw, Landmark, Star, Award, Check, X
} from 'lucide-react';

export default function PacienteSesionesView({ profile, user, isVirtualDemo, onProfileUpdated }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-11
  
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const [sessionType, setSessionType] = useState('individual');
  
  // Checkout States
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Sincronización Real de Sesiones
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Perfil del psicólogo desde Áncora
  const [psychoProfile, setPsychoProfile] = useState(null);
  const [loadingPsycho, setLoadingPsycho] = useState(true);
  const [changingPsycho, setChangingPsycho] = useState(false);

  // Catálogo oficial de psicólogos colegiados
  const OFFICIAL_PSYCHOLOGISTS = [
    {
      id: '2TOfkVIRccgIgz5WamAIVmUPtD63',
      name: 'José Fernández',
      email: 'usajosefernan@gmail.com',
      license: 'M-49ccc',
      photo_url: 'https://lh3.googleusercontent.com/a/ACg8ocKTiCRCGtON7UckYXir1hkqxQPP9jHgd0A8aQx3mqswe2yNcA=s96-c',
      rating: '5.0',
      reviews: 18,
      specialties: ['Ansiedad', 'Estrés', 'Terapia Cognitiva', 'EMDR'],
      price: 55,
      approach: 'Terapia Cognitivo-Conductual & Regulación Emocional'
    },
    {
      id: 'psy-elena-ruiz',
      name: 'Dra. Elena Ruiz',
      email: 'elena.ruiz@ancora.clinic',
      license: 'M-38291',
      photo_url: 'https://images.unsplash.com/photo-1594824813598-f5424cf3b5a1?w=150&auto=format&fit=crop&q=80',
      rating: '4.9',
      reviews: 24,
      specialties: ['Terapia de Pareja', 'Apego', 'Duelo', 'Autoestima'],
      price: 55,
      approach: 'Terapia Sistémica & Focalizada en las Emociones'
    },
    {
      id: 'psy-carlos-mendoza',
      name: 'Carlos Mendoza',
      email: 'carlos.mendoza@ancora.clinic',
      license: 'M-41029',
      photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
      rating: '4.9',
      reviews: 15,
      specialties: ['Terapia Adultos', 'Gestión del Estrés', 'Trauma Complejo'],
      price: 55,
      approach: 'Terapia de Aceptación y Compromiso (ACT)'
    }
  ];

  const [psychologistsList, setPsychologistsList] = useState(OFFICIAL_PSYCHOLOGISTS);

  useEffect(() => {
    const fetchPsychologists = async () => {
      try {
        const { data, error } = await db.from('psychologist_profiles').select('*');
        if (!error && data && data.length > 0) {
          const mapped = data.map(p => ({
            id: p.id || p.user_id || '2TOfkVIRccgIgz5WamAIVmUPtD63',
            email: p.email || 'usajosefernan@gmail.com',
            name: p.name || 'José Fernández',
            license: p.license_number || 'M-49ccc',
            photo_url: p.image_url || p.photo_url || 'https://lh3.googleusercontent.com/a/ACg8ocKTiCRCGtON7UckYXir1hkqxQPP9jHgd0A8aQx3mqswe2yNcA=s96-c',
            rating: p.rating_avg ? String(p.rating_avg) : '5.0',
            reviews: p.rating_count || 18,
            specialties: Array.isArray(p.specialties) ? p.specialties : ['Ansiedad', 'Estrés', 'Terapia Cognitiva'],
            price: Number(p.session_price) || 55,
            approach: p.approach || 'Terapia Cognitivo-Conductual & Regulación Emocional'
          }));
          setPsychologistsList(mapped);
        }
      } catch (e) {}
    };
    fetchPsychologists();
  }, []);

  const assignedPsychoId = profile?.contexto_terapeutico?.assigned_psychologist_id || null;
  const assignedPsycho = psychologistsList.find(p => p.id === assignedPsychoId) || (assignedPsychoId ? OFFICIAL_PSYCHOLOGISTS[0] : null);

  const handleSelectPsychologist = async (psycho) => {
    if (!user?.id) return;
    try {
      const updatedContext = {
        ...(profile?.contexto_terapeutico || {}),
        assigned_psychologist_id: psycho.id
      };

      await db.from('profiles').update({
        contexto_terapeutico: updatedContext,
        updated_at: new Date().toISOString()
      }).eq('id', user.id);

      if (onProfileUpdated) {
        onProfileUpdated({ ...profile, contexto_terapeutico: updatedContext });
      }
      setChangingPsycho(false);
    } catch (err) {
      console.error("Error al asignar psicólogo:", err);
    }
  };

  const fetchSessions = async () => {
    if (!user?.id) return;
    try {
      setLoadingSessions(true);
      const { data, error } = await firebaseClient
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id);

      if (error) throw error;

      const mapped = (data || []).map(a => {
        const psycho = psychologistsList.find(p => p.id === a.psychologist_id);
        return {
          id: a.id,
          date: `${a.appointment_date} — ${a.appointment_time}h`,
          psychologist: psycho ? psycho.name : (assignedPsycho ? assignedPsycho.name : 'Terapeuta Áncora'),
          status: a.status || 'confirmed',
          type: a.session_type === 'individual' ? 'Individual' : (a.session_type === 'pareja' ? 'Pareja' : 'Revisión')
        };
      });

      mapped.sort((x, y) => new Date(y.date.split(' — ')[0]) - new Date(x.date.split(' — ')[0]));
      setScheduledSessions(mapped);
    } catch (err) {
      console.error("Error loading appointments:", err.message);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    const loadAssignedPsychologist = async () => {
      if (!assignedPsychoId) {
        setLoadingPsycho(false);
        return;
      }
      try {
        setLoadingPsycho(true);
        const { data, error } = await firebaseClient
          .from('psychologist_profiles')
          .select('*')
          .eq('id', assignedPsychoId)
          .maybeSingle();
        
        if (!error && data) {
          setPsychoProfile(data);
        }
      } catch (err) {
        console.error("Error loading assigned psychologist profile:", err.message);
      } finally {
        setLoadingPsycho(false);
      }
    };
    loadAssignedPsychologist();
    fetchSessions();
  }, [user?.id, assignedPsychoId]);

  // Calcular rango de lunes a domingo para una fecha dada (YYYY-MM-DD)
  const getWeekRange = (dateStr) => {
    if (!dateStr) return { start: '', end: '', startLabel: '', endLabel: '' };
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Ajustar a Lunes
    const monday = new Date(y, m - 1, diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const format = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
    return {
      start: format(monday),
      end: format(sunday),
      startLabel: `${monday.getDate()} de ${monthNames[monday.getMonth()]}`,
      endLabel: `${sunday.getDate()} de ${monthNames[sunday.getMonth()]}`
    };
  };

  // Comprobar si ya existe una cita (revisión o sesión) en la misma semana natural
  const getExistingSessionInWeek = (dateStr) => {
    if (!dateStr || !scheduledSessions.length) return null;
    const { start, end } = getWeekRange(dateStr);
    return scheduledSessions.find(s => {
      const sDate = s.date.split(' — ')[0]?.trim();
      return sDate >= start && sDate <= end && s.status !== 'cancelled' && s.status !== 'Cancelada';
    });
  };

  // Comprobar citas del mes actual (máximo 4)
  const getExistingSessionsInMonth = (year, month) => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return scheduledSessions.filter(s => {
      const sDate = s.date.split(' — ')[0]?.trim();
      return sDate.startsWith(monthPrefix) && s.status !== 'cancelled' && s.status !== 'Cancelada';
    });
  };

  // Parsear disponibilidad del psicólogo
  let availability = null;
  if (psychoProfile?.availability) {
    try {
      availability = typeof psychoProfile.availability === 'string' 
        ? JSON.parse(psychoProfile.availability) 
        : psychoProfile.availability;
    } catch (e) {
      console.error("Error parsing availability JSON:", e);
    }
  }

  // Obtener slots dinámicos según el día seleccionado y disponibilidad real
  const getAvailableSlotsForDate = () => {
    if (!selectedDate || !assignedPsychoId) return [];
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dateObj = new Date(currentYear, currentMonth, selectedDate);
    const dayName = dayNames[dateObj.getDay()];
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${selectedDate < 10 ? '0' + selectedDate : selectedDate}`;

    if (dayName === 'Sábado' || dayName === 'Domingo') return [];

    if (availability && availability.blocked_dates && availability.blocked_dates.includes(dateStr)) {
      return [];
    }

    if (availability && availability.custom_available_slots && availability.custom_available_slots[dayName]) {
      const reservedHours = scheduledSessions
        .filter(s => s.date.split(' — ')[0]?.trim() === dateStr)
        .map(s => s.date.split(' — ')[1]?.replace('h', '')?.trim());

      return availability.custom_available_slots[dayName]
        .filter(h => !reservedHours.includes(h))
        .sort();
    }
    
    return ['09:00', '10:30', '12:00', '16:00', '17:30', '19:00'];
  };

  const handleDaySelect = (day) => {
    setSelectedDate(day);
    setSelectedSlot(null);
  };

  const handleProceedToCheckout = () => {
    if (!selectedDate || !selectedSlot) return;
    setShowCheckout(true);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    setCheckoutLoading(true);
    
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${selectedDate < 10 ? '0' + selectedDate : selectedDate}`;
    const isRevision = sessionType === 'revision';
    const duration = isRevision ? 15 : 50;
    const price = isRevision ? 15 : (assignedPsycho?.price || 55);

    try {
      const newAppt = {
        id: 'appt_' + Math.random().toString(36).substring(2, 10),
        patient_id: user.id,
        psychologist_id: assignedPsychoId || '2TOfkVIRccgIgz5WamAIVmUPtD63',
        appointment_date: dateStr,
        appointment_time: selectedSlot,
        duration_minutes: duration,
        session_type: sessionType,
        price_eur: price,
        status: 'confirmed',
        created_at: new Date().toISOString()
      };

      const { error } = await firebaseClient
        .from('appointments')
        .insert(newAppt);

      if (error) throw error;

      setTimeout(() => {
        setCheckoutLoading(false);
        setBookingSuccess(true);
        setShowCheckout(false);
        fetchSessions();
      }, 800);

    } catch (err) {
      console.error("Error saving appointment:", err.message);
      alert("Error al agendar la sesión: " + err.message);
      setCheckoutLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const numDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= numDays; i++) {
      days.push(i);
    }
    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 0) {
        setCurrentYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 11) {
        setCurrentYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
    setSelectedDate(null);
    setSelectedSlot(null);
  };

  // VISTA 1: Catálogo para Elegir / Cambiar Psicólogo
  if (!assignedPsychoId || changingPsycho) {
    return (
      <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Elige tu Psicólogo Colegiado de Referencia
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Selecciona el profesional especializado que supervisará tu proceso y coordinará tus sesiones.
            </p>
          </div>
          {assignedPsychoId && (
            <button 
              type="button" 
              onClick={() => setChangingPsycho(false)}
              className="btn btn-outline" 
              style={{ height: '34px', fontSize: '0.76rem' }}
            >
              Volver a mis Citas
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {psychologistsList.map(psy => (
            <div key={psy.id} className="glass-panel" style={{ 
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              border: psy.id === assignedPsychoId ? '2px solid var(--color-cyan)' : '1px solid var(--border)'
            }}>
              <div>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '14px' }}>
                  <img 
                    src={psy.photo_url} 
                    alt={psy.name} 
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-cyan)' }} 
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h4 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {psy.name}
                      </h4>
                      <span className="badge badge-cyan" style={{ fontSize: '0.66rem', padding: '2px 6px' }}>
                        Col. {psy.license}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <Star size={13} color="var(--color-amber)" fill="var(--color-amber)" />
                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#ffffff' }}>{psy.rating}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>({psy.reviews} valoraciones)</span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 12px 0' }}>
                  {psy.approach}
                </p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
                  {psy.specialties.map((spec, i) => (
                    <span key={i} className="badge" style={{ fontSize: '0.66rem', padding: '3px 8px' }}>
                      {spec}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff' }}>{psy.price} €</span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}> / sesión (50 min)</span>
                </div>

                <button 
                  type="button" 
                  onClick={() => handleSelectPsychologist(psy)}
                  className={`btn ${psy.id === assignedPsychoId ? 'btn-primary' : 'btn-outline'}`}
                  style={{ 
                    fontSize: '0.78rem',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {psy.id === assignedPsychoId ? (
                    <>
                      <Check size={14} />
                      <span>Asignado</span>
                    </>
                  ) : (
                    <span>Elegir Profesional</span>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // VISTA 2: Panel de Gestión de Citas y Calendario
  return (
    <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* Cabecera del Profesional Asignado */}
      <div className="glass-panel" style={{ 
        padding: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img 
            src={assignedPsycho?.photo_url} 
            alt={assignedPsycho?.name} 
            style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-cyan)' }} 
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                {assignedPsycho?.name}
              </h3>
              <span className="badge badge-cyan" style={{ fontSize: '0.66rem', padding: '2px 7px' }}>
                Col. {assignedPsycho?.license}
              </span>
            </div>
            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Tu psicólogo colegiado de referencia en Áncora
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            type="button" 
            onClick={() => setChangingPsycho(true)}
            className="btn btn-outline" 
            style={{ height: '34px', fontSize: '0.76rem' }}
          >
            Cambiar de Profesional
          </button>
        </div>
      </div>

      {/* Próximas Sesiones Programadas */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            🗓️ Tus Sesiones Programadas
          </h3>
          <button 
            type="button" 
            onClick={fetchSessions}
            style={{ background: 'transparent', border: 'none', color: 'var(--color-cyan)', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <RefreshCw size={12} className={loadingSessions ? 'animate-spin' : ''} />
            <span>Actualizar</span>
          </button>
        </div>
        
        {loadingSessions ? (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Cargando tus citas sincronizadas...
          </div>
        ) : scheduledSessions.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px dashed var(--border)' }}>
            No tienes ninguna sesión programada todavía. Selecciona un día en el calendario inferior para reservar tu próxima sesión.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {scheduledSessions.map(sess => (
              <div 
                key={sess.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 16px', 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '10px',
                  fontSize: '0.78rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="flex-center" style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(68,125,130,0.15)', color: 'var(--color-cyan)' }}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <strong style={{ color: '#ffffff', display: 'block' }}>{sess.date}</strong>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>Con {sess.psychologist} ({sess.type})</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
                    Confirmada
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Calendario y Reserva de Nueva Cita */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Reservar Actividad Clínica con {assignedPsycho?.name}
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Elige entre una Revisión Semanal (asíncrona) o una Consulta Individual (síncrona). Máximo 1 actividad por semana.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              type="button" 
              onClick={handlePrevMonth}
              className="btn btn-outline" 
              style={{ height: '30px', width: '30px', padding: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffffff', minWidth: '130px', textAlign: 'center' }}>
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button 
              type="button" 
              onClick={handleNextMonth}
              className="btn btn-outline" 
              style={{ height: '30px', width: '30px', padding: 0, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 1. Selector de Modalidad Clínica: Revisión (15 min) vs Consulta (50 min) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div 
            onClick={() => setSessionType('revision')}
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              border: sessionType === 'revision' ? '2px solid var(--color-cyan)' : '1px solid var(--border)',
              background: sessionType === 'revision' ? 'rgba(68,125,130,0.18)' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#ffffff' }}>📋 Revisión Semanal</span>
              <span className="badge badge-cyan" style={{ fontSize: '0.64rem' }}>15 MIN</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Análisis evolutivo de tu diario, seguimiento del chat con la IA y pautas clínicas personalizadas.
            </p>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-cyan)', marginTop: '2px' }}>
              15.00 € / revisión
            </span>
          </div>

          <div 
            onClick={() => setSessionType('individual')}
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              border: sessionType === 'individual' ? '2px solid var(--color-emerald)' : '1px solid var(--border)',
              background: sessionType === 'individual' ? 'rgba(127,159,136,0.18)' : 'rgba(255,255,255,0.02)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#ffffff' }}>🎙️ Consulta Individual</span>
              <span className="badge badge-emerald" style={{ fontSize: '0.64rem' }}>50 MIN</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Sesión clínica síncrona 1 a 1 por videollamada cifrada directamente con tu psicólogo colegiado.
            </p>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-emerald)', marginTop: '2px' }}>
              {assignedPsycho?.price || 55}.00 € / consulta
            </span>
          </div>
        </div>

        {/* 2. Rejilla del Calendario */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center' }}>
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d, i) => (
            <div key={i} style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', padding: '6px 0' }}>
              {d}
            </div>
          ))}

          {getDaysInMonth().map(day => {
            const isSelected = selectedDate === day;
            const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const thisDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${day < 10 ? '0' + day : day}`;
            const hasBookingThisDay = scheduledSessions.some(s => s.date.startsWith(thisDateStr));

            return (
              <button
                key={day}
                type="button"
                disabled={isWeekend}
                onClick={() => handleDaySelect(day)}
                style={{
                  height: '40px',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid var(--color-cyan)' : (hasBookingThisDay ? '1px solid var(--color-emerald)' : '1px solid var(--border)'),
                  background: isSelected ? 'var(--color-cyan)' : (hasBookingThisDay ? 'rgba(127,159,136,0.15)' : (isWeekend ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.03)')),
                  color: isSelected ? '#ffffff' : (isWeekend ? 'var(--text-tertiary)' : 'var(--text-primary)'),
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: '0.8rem',
                  cursor: isWeekend ? 'not-allowed' : 'pointer',
                  transition: 'all var(--transition-fast)',
                  position: 'relative'
                }}
              >
                {day}
                {hasBookingThisDay && (
                  <span style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: 'var(--color-emerald)' }} />
                )}
              </button>
            );
          })}
        </div>

        {/* 3. Selección de Horas y Validación Semanal */}
        {selectedDate && (() => {
          const selectedDateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${selectedDate < 10 ? '0' + selectedDate : selectedDate}`;
          const existingWeekAppt = getExistingSessionInWeek(selectedDateStr);
          const weekRange = getWeekRange(selectedDateStr);
          const availableSlots = getAvailableSlotsForDate();

          return (
            <div style={{ marginTop: '22px', paddingTop: '18px', borderTop: '1px solid var(--border)' }}>
              {existingWeekAppt ? (
                <div style={{
                  background: 'rgba(245,158,11,0.12)',
                  border: '1px solid var(--color-amber)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}>
                  <div className="flex-center" style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(245,158,11,0.2)', color: 'var(--color-amber)', flexShrink: 0 }}>
                    ⚠️
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.84rem', color: '#ffffff', display: 'block' }}>
                      Límite de 1 Actividad Semanal Alcanzado
                    </strong>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.45 }}>
                      Ya dispones de una <strong>{existingWeekAppt.type}</strong> agendada para el <strong>{existingWeekAppt.date}</strong> (semana del {weekRange.startLabel} al {weekRange.endLabel}).
                      <br />
                      En Áncora pautamos <strong>un máximo de 1 cita por semana</strong> (hasta 4 al mes) para que tengas tiempo suficiente de asimilar el trabajo terapéutico y registrar tus vivencias en el chat diario con la IA antes del siguiente encuentro.
                      <br />
                      <span style={{ color: 'var(--color-amber)', fontWeight: 600, display: 'inline-block', marginTop: '4px' }}>
                        👉 Por favor, selecciona una fecha en otra semana libre del calendario.
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
                    Horas disponibles para el {selectedDate} de {monthNames[currentMonth]}:
                  </h4>

                  {availableSlots.length === 0 ? (
                    <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
                      No hay huecos disponibles en la agenda del profesional para este día. Prueba seleccionando otra fecha.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {availableSlots.map(slot => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlot(slot)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: selectedSlot === slot ? '2px solid var(--color-cyan)' : '1px solid var(--border)',
                            background: selectedSlot === slot ? 'rgba(68,125,130,0.25)' : 'rgba(255,255,255,0.03)',
                            color: selectedSlot === slot ? 'var(--color-cyan)' : 'var(--text-primary)',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            cursor: 'pointer'
                          }}
                        >
                          {slot}h
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedSlot && (
                    <div style={{ marginTop: '18px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={handleProceedToCheckout}
                        className="btn btn-primary"
                        style={{ fontSize: '0.82rem', padding: '10px 22px' }}
                      >
                        Continuar con la Reserva ({selectedDate} {monthNames[currentMonth]} a las {selectedSlot}h — {sessionType === 'revision' ? 'Revisión 15 min' : 'Consulta 50 min'})
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })()}
      </div>

      {/* Modal de Confirmación y Checkout */}
      {showCheckout && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 19, 32, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'left',
            background: 'rgba(5, 26, 44, 0.95)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#ffffff' }}>
                Confirmar Reserva de Sesión
              </h3>
              <button 
                type="button" 
                onClick={() => setShowCheckout(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '14px', borderRadius: '10px', fontSize: '0.78rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Profesional:</strong> {assignedPsycho?.name}</div>
              <div><strong>Fecha y Hora:</strong> {selectedDate} de {monthNames[currentMonth]} {currentYear} a las {selectedSlot}h</div>
              <div><strong>Importe:</strong> {assignedPsycho?.price || 55} € (Sesión Clínica 50 min)</div>
            </div>

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCheckout(false)}
                  className="btn btn-outline" 
                  style={{ flex: 1, height: '36px', fontSize: '0.78rem' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={checkoutLoading}
                  className="btn btn-primary" 
                  style={{ flex: 1, height: '36px', fontSize: '0.78rem' }}
                >
                  {checkoutLoading ? 'Confirmando...' : 'Confirmar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Éxito */}
      {bookingSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 19, 32, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '380px',
            width: '100%',
            padding: '28px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(5, 26, 44, 0.95)',
            border: '1px solid var(--border)'
          }}>
            <CheckCircle2 size={44} color="var(--color-emerald)" />
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>¡Sesión Agendada!</h4>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              La cita ha sido guardada en Firestore y notificada a tu psicólogo ({assignedPsycho?.name}).
            </p>
            <button
              type="button"
              onClick={() => setBookingSuccess(false)}
              className="btn btn-primary"
              style={{ width: '100%', height: '36px', fontSize: '0.78rem', marginTop: '8px' }}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
