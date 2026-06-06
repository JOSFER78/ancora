import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Calendar, Clock, Video, ChevronLeft, ChevronRight, 
  CheckCircle2, User, AlertCircle, CreditCard, ShieldCheck, RefreshCw, Landmark
} from 'lucide-react';

export default function PacienteSesionesView({ profile, user, isVirtualDemo }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [sessionType, setSessionType] = useState('individual'); // 'individual' | 'seguimiento' | 'pareja'
  
  // Checkout States
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Sincronización Real de Sesiones
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Catálogo de psicólogos
  const mockPsychologists = [
    {
      id: '19057a26-ebcb-4d42-a668-80250299912a',
      name: 'Ana Ramos',
      email: 'tisutet@hormail.com',
      license: 'M-19057',
      photo_url: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200',
      rating: '0.0',
      reviews: 0,
      specialties: ['Ansiedad', 'Estrés', 'Autovaloración'],
      price: 49,
      approach: 'Cognitivo-Conductual (TCC)'
    },
    {
      id: '49ccc6ae-e064-49c3-9951-4678c46b175a',
      name: 'José Fernández',
      email: 'usajosefernan@gmail.com',
      license: 'M-49ccc',
      photo_url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
      rating: '0.0',
      reviews: 0,
      specialties: ['Depresión', 'Trauma', 'Duelo'],
      price: 55,
      approach: 'EMDR y Mindfulness'
    },
    {
      id: '7b32049e-cb5e-4c24-9390-c32508dda09d',
      name: 'Elena Custer',
      email: 'elena.custer@gmail.com',
      license: 'M-31204',
      photo_url: 'https://images.unsplash.com/photo-1582750433449-64c86b1fdf30?auto=format&fit=crop&q=80&w=200',
      rating: '0.0',
      reviews: 0,
      specialties: ['Fobias', 'Ansiedad', 'TCC'],
      price: 50,
      approach: 'Cognitivo-Conductual (TCC)'
    },
    {
      id: 'c2104500-1111-2222-3333-444455556666',
      name: 'Carlos Ruiz',
      email: 'carlos.ruiz@gmail.com',
      license: 'M-21045',
      photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
      rating: '4.8',
      reviews: 45,
      specialties: ['Ansiedad', 'Fobias', 'Sueño'],
      price: 45,
      approach: 'Cognitivo-Conductual (TCC)'
    },
    {
      id: 'd1849200-1111-2222-3333-444455556666',
      name: 'Sofía Vergara',
      email: 'sofia.vergara@gmail.com',
      license: 'M-18492',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      rating: '4.9',
      reviews: 62,
      specialties: ['Pareja', 'Autoestima', 'Estrés'],
      price: 65,
      approach: 'Sistémico y Gestalt'
    },
    {
      id: 'e3298100-1111-2222-3333-444455556666',
      name: 'Javier Gómez',
      email: 'javier.gomez@gmail.com',
      license: 'M-32981',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      rating: '4.7',
      reviews: 28,
      specialties: ['Depresión', 'Duelo', 'Autoestima'],
      price: 50,
      approach: 'Humanista'
    }
  ];

  const assignedPsychoId = profile?.contexto_terapeutico?.assigned_psychologist_id || null;
  const assignedPsycho = mockPsychologists.find(p => p.id === assignedPsychoId) || null;

  const fetchSessions = async () => {
    if (!user?.id) return;
    if (isVirtualDemo) {
      try {
        setLoadingSessions(true);
        const localApptsStr = localStorage.getItem('virtual_appointments') || '[]';
        const localAppts = JSON.parse(localApptsStr).filter(a => a.patient_id === user.id);
        
        const mapped = localAppts.map(a => {
          const psycho = mockPsychologists.find(p => p.id === a.psychologist_id);
          return {
            id: a.id,
            date: `${a.appointment_date} — ${a.appointment_time}h`,
            psychologist: psycho ? psycho.name : 'Terapeuta Áncora',
            status: a.status,
            type: a.session_type === 'individual' ? 'Individual' : (a.session_type === 'pareja' ? 'Pareja' : 'Revisión')
          };
        });

        mapped.sort((x, y) => {
          // Ordenar citas por ID/timestamp desc
          return y.id.localeCompare(x.id);
        });

        setScheduledSessions(mapped);
      } catch (err) {
        console.error("Error loading virtual appointments:", err);
      } finally {
        setLoadingSessions(false);
      }
      return;
    }

    try {
      setLoadingSessions(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id);

      if (error) throw error;

      const mapped = (data || []).map(a => {
        const psycho = mockPsychologists.find(p => p.id === a.psychologist_id);
        return {
          id: a.id,
          date: `${a.appointment_date} — ${a.appointment_time}h`,
          psychologist: psycho ? psycho.name : 'Terapeuta Áncora',
          status: a.status,
          type: a.session_type === 'individual' ? 'Individual' : (a.session_type === 'pareja' ? 'Pareja' : 'Revisión')
        };
      });

      // Ordenar por fecha y hora descendente
      mapped.sort((x, y) => new Date(y.id) - new Date(x.id)); // o por ID temporal

      setScheduledSessions(mapped);
    } catch (err) {
      console.error("Error loading appointments:", err.message);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user?.id, assignedPsychoId]);

  // Obtener slots dinámicos según el día seleccionado y disponibilidad del terapeuta
  const getAvailableSlotsForDate = () => {
    if (!selectedDate || !assignedPsycho) return [];
    
    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dateObj = new Date(2026, 5, selectedDate); // Junio 2026
    const dayName = dayNames[dateObj.getDay()];
    
    const psychoEmail = assignedPsycho.email;
    const slotsStr = localStorage.getItem('availability_slots_' + psychoEmail);
    
    if (slotsStr) {
      const slots = JSON.parse(slotsStr);
      return slots
        .filter(s => s.day === dayName && s.status === 'available')
        .map(s => s.hour)
        .sort();
    }
    
    // Slots por defecto si no hay localStorage
    if (psychoEmail === 'tisutet@hormail.com') {
      // Ana Ramos
      if (dayName === 'Lunes') return ['10:00', '11:00'];
      if (dayName === 'Martes') return ['16:00'];
      if (dayName === 'Miércoles') return ['17:00'];
      if (dayName === 'Jueves') return ['11:00'];
      if (dayName === 'Viernes') return ['15:00'];
    } else if (psychoEmail === 'usajosefernan@gmail.com') {
      // José Fernández
      if (dayName === 'Lunes') return ['09:00'];
      if (dayName === 'Martes') return ['15:00'];
      if (dayName === 'Jueves') return ['17:00'];
    }
    
    // Slots genéricos para otros terapeutas
    if (dayName === 'Sábado' || dayName === 'Domingo') return [];
    return ['09:00', '11:00', '16:00', '17:30'];
  };

  const currentAvailableSlots = getAvailableSlotsForDate();

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
    
    const dateStr = `2026-06-${selectedDate < 10 ? '0' + selectedDate : selectedDate}`;
    
    if (isVirtualDemo) {
      try {
        const newAppt = {
          id: 'virtual-appt-' + Date.now(),
          patient_id: user.id,
          psychologist_id: assignedPsychoId,
          appointment_date: dateStr,
          appointment_time: selectedSlot,
          session_type: sessionType,
          status: 'upcoming'
        };

        const localApptsStr = localStorage.getItem('virtual_appointments') || '[]';
        const localAppts = JSON.parse(localApptsStr);
        localAppts.push(newAppt);
        localStorage.setItem('virtual_appointments', JSON.stringify(localAppts));

        setTimeout(() => {
          setCheckoutLoading(false);
          setBookingSuccess(true);
          setShowCheckout(false);
          fetchSessions();
        }, 1500);
      } catch (err) {
        console.error("Error saving virtual appointment:", err);
        setCheckoutLoading(false);
      }
      return;
    }

    try {
      // Formatear fecha para guardarla en Supabase
      const newAppt = {
        patient_id: user.id,
        psychologist_id: assignedPsychoId,
        appointment_date: dateStr,
        appointment_time: selectedSlot,
        session_type: sessionType,
        status: 'upcoming'
      };

      const { error } = await supabase
        .from('appointments')
        .insert(newAppt);

      if (error) throw error;

      setTimeout(() => {
        setCheckoutLoading(false);
        setBookingSuccess(true);
        setShowCheckout(false);
        fetchSessions(); // Recargar de Supabase
      }, 1500);

    } catch (err) {
      console.error("Error saving appointment:", err.message);
      alert("Error al guardar la cita en Supabase: " + err.message);
      setCheckoutLoading(false);
    }
  };

  const fillTestCard = () => {
    setCardName(profile?.contexto_terapeutico?.displayName || 'Pedro Sanz');
    setCardNumber('4242424242424242');
    setCardExpiry('12/29');
    setCardCvc('123');
  };

  const getDaysInMonth = () => {
    const days = [];
    for (let i = 1; i <= 30; i++) {
      days.push(i);
    }
    return days;
  };

  const psychoPrice = assignedPsycho?.price || 49;
  const platformPriceBase = 10.00;
  const platformIva = 2.10; 
  const totalAmount = psychoPrice + platformPriceBase + platformIva;

  if (!assignedPsychoId) {
    return (
      <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div className="flex-center" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-rose)' }}>
            <AlertCircle size={32} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>No tienes un psicólogo asignado</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.5 }}>
            Para agendar o revisar tus sesiones, primero debes realizar el triaje inicial y elegir a tu psicólogo clínico de referencia en el panel de control principal.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
      
      {/* Próximas Sesiones Programadas */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
          🗓️ Tus Sesiones Programadas (Supabase real)
        </h3>
        
        {loadingSessions ? (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Cargando tus citas reales de la base de datos...
          </div>
        ) : scheduledSessions.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-tertiary)', border: '1px dashed var(--border)', borderRadius: '8px' }}>
            No tienes ninguna sesión programada todavía.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {scheduledSessions.map(sess => (
              <div 
                key={sess.id} 
                style={{ 
                  padding: '14px 18px', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'var(--background-secondary)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  <div className="flex-center" style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: sess.status === 'upcoming' ? 'rgba(68,125,130,0.1)' : 'rgba(255,255,255,0.03)',
                    color: sess.status === 'upcoming' ? 'var(--color-cyan)' : 'var(--text-tertiary)' 
                  }}>
                    <Video size={18} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block' }}>{sess.date}</strong>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                      {sess.type} · Con {sess.psychologist}
                    </span>
                  </div>
                </div>

                <div>
                  {sess.status === 'upcoming' ? (
                    <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>Programada (Pago OK)</span>
                  ) : (
                    <span className="badge" style={{ fontSize: '0.62rem', background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border)' }}>Realizada</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reservar Nueva Sesión */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '20px' }}>
          Reservar Nueva Sesión con {assignedPsycho.name}
        </h3>

        {bookingSuccess ? (
          <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
            <div className="flex-center" style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'rgba(127,159,136,0.1)', color: 'var(--color-emerald)' }}>
              <CheckCircle2 size={32} />
            </div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-emerald)' }}>¡Reserva Guardada en Supabase!</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Tu consulta para el día <strong>{selectedDate} de Junio de 2026</strong> a las <strong>{selectedSlot}h</strong> ha quedado reservada y cobrada con éxito en Stripe Demo.
            </p>
            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
              <button 
                onClick={() => {
                  setBookingSuccess(false);
                  setSelectedDate(null);
                  setSelectedSlot(null);
                }}
                className="btn btn-outline" 
                style={{ height: '36px', fontSize: '0.75rem' }}
              >
                Reservar otra sesión
              </button>
            </div>
          </div>
        ) : showCheckout ? (
          <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Stripe Connect Split (Demo Mode)</span>
              <button 
                type="button" 
                onClick={fillTestCard} 
                className="btn btn-outline" 
                style={{ height: '26px', fontSize: '0.64rem', padding: '0 8px', borderColor: 'var(--color-cyan)', color: 'var(--color-cyan)' }}
              >
                💳 Autorellenar Tarjeta Demo
              </button>
            </div>

            {/* Split Fiscal */}
            <div style={{ background: 'rgba(68, 125, 130, 0.04)', border: '1px solid rgba(68, 125, 130, 0.2)', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h5 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Landmark size={14} color="var(--color-cyan)" />
                Desglose del Pago (Split en Origen)
              </h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Sesión con {assignedPsycho.name} (Exento de IVA - Art. 20.Uno.3 LIVA):</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{psychoPrice.toFixed(2)} €</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Soporte Software & IA Áncora:</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{platformPriceBase.toFixed(2)} €</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>IVA Soporte Software (21%):</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{platformIva.toFixed(2)} €</span>
                </div>
                <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-cyan)' }}>
                  <span>Total Transacción Seguro Stripe:</span>
                  <span>{totalAmount.toFixed(2)} €</span>
                </div>
              </div>
            </div>

            {/* Formulario Tarjeta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Nombre en Tarjeta</label>
                <input 
                  type="text" 
                  required
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Titular de la tarjeta" 
                  className="form-input"
                  style={{ height: '36px', fontSize: '0.78rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', width: '100%', padding: '0 12px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Número de Tarjeta</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').substring(0, 16))}
                    placeholder="4242 4242 4242 4242" 
                    className="form-input"
                    style={{ height: '36px', fontSize: '0.78rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', width: '100%', padding: '0 40px 0 12px' }}
                  />
                  <CreditCard size={16} color="var(--text-tertiary)" style={{ position: 'absolute', right: '12px', top: '10px' }} />
                </div>
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Caducidad</label>
                  <input 
                    type="text" 
                    required
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value.substring(0, 5))}
                    placeholder="MM/AA" 
                    className="form-input"
                    style={{ height: '36px', fontSize: '0.78rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', width: '100%', padding: '0 12px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>CVC</label>
                  <input 
                    type="text" 
                    required
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 4))}
                    placeholder="123" 
                    className="form-input"
                    style={{ height: '36px', fontSize: '0.78rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', width: '100%', padding: '0 12px' }}
                  />
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowCheckout(false)}
                className="btn btn-outline"
                style={{ height: '38px', fontSize: '0.78rem' }}
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={checkoutLoading || !cardName || !cardNumber}
                className="btn btn-emerald"
                style={{ height: '38px', fontSize: '0.78rem', background: 'var(--color-emerald)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', padding: '0 20px' }}
              >
                {checkoutLoading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Confirmando con Stripe...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={14} />
                    <span>Pagar {totalAmount.toFixed(2)} € (Demo)</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* 1. Tipo de Sesión */}
            <div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>1. Selecciona el Tipo de Consulta:</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {[
                  { id: 'individual', label: '👤 Individual (1h)', desc: `${psychoPrice}€ Sesión clínica` },
                  { id: 'seguimiento', label: '🔄 Revisión (1h)', desc: `${psychoPrice}€ Sesión de ajuste` },
                  { id: 'pareja', label: '👥 Pareja (1h)', desc: `${psychoPrice}€ Terapia dual` }
                ].map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSessionType(type.id)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: sessionType === type.id ? 'var(--color-cyan)' : 'var(--border)',
                      background: sessionType === type.id ? 'rgba(68,125,130,0.08)' : 'rgba(255,255,255,0.01)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all var(--transition-fast)'
                    }}
                  >
                    <strong style={{ fontSize: '0.78rem', color: '#ffffff', display: 'block' }}>{type.label}</strong>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{type.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Calendario y Horas */}
            <div className="grid-2" style={{ gap: '24px', alignItems: 'flex-start' }}>
              
              {/* Calendario Mensual */}
              <div style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff' }}>Junio 2026</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button style={{ color: 'var(--text-tertiary)' }} disabled><ChevronLeft size={16} /></button>
                    <button style={{ color: 'var(--text-tertiary)' }} disabled><ChevronRight size={16} /></button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '8px' }}>
                  {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                    <span key={d} style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>{d}</span>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                  {getDaysInMonth().map(day => {
                    const isSelected = selectedDate === day;
                    const isWeekend = [6, 7, 13, 14, 20, 21, 27, 28].includes(day);
                    
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => !isWeekend && handleDaySelect(day)}
                        disabled={isWeekend}
                        style={{
                          height: '32px',
                          borderRadius: '50%',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: isWeekend ? 'default' : 'pointer',
                          background: isSelected ? 'var(--color-cyan)' : 'transparent',
                          color: isSelected ? '#ffffff' : (isWeekend ? 'var(--text-tertiary)' : 'var(--text-primary)'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: isSelected ? 'none' : '1px solid transparent',
                          transition: 'all var(--transition-fast)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isWeekend && !isSelected) e.currentTarget.style.borderColor = 'var(--color-cyan)';
                        }}
                        onMouseLeave={(e) => {
                          if (!isWeekend && !isSelected) e.currentTarget.style.borderColor = 'transparent';
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Slots de Horas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  {selectedDate ? `Horarios disponibles para el ${selectedDate} de Junio:` : 'Selecciona un día en el calendario:'}
                </span>

                {selectedDate ? (
                  currentAvailableSlots.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {currentAvailableSlots.map(slot => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              height: '36px',
                              borderRadius: '6px',
                              border: '1px solid',
                              borderColor: isSelected ? 'var(--color-cyan)' : 'var(--border)',
                              background: isSelected ? 'rgba(68,125,130,0.1)' : 'rgba(255,255,255,0.01)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              color: isSelected ? 'var(--color-cyan)' : '#ffffff',
                              cursor: 'pointer',
                              transition: 'all var(--transition-fast)'
                            }}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: '20px 10px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                      <AlertCircle size={16} style={{ marginBottom: '6px', opacity: 0.5, color: 'var(--color-rose)' }} />
                      <p style={{ margin: 0 }}>El terapeuta no tiene disponibilidad configurada para este día de la semana. Por favor, selecciona otra fecha.</p>
                    </div>
                  )
                ) : (
                  <div style={{ padding: '30px 10px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: '8px', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                    <AlertCircle size={16} style={{ marginBottom: '6px', opacity: 0.5 }} />
                    <p>Por favor, haz clic en un día laborable del calendario para cargar los horarios de consulta.</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleProceedToCheckout}
                  disabled={!selectedDate || !selectedSlot}
                  className="btn btn-emerald"
                  style={{ height: '40px', fontSize: '0.78rem', marginTop: '10px', opacity: (selectedDate && selectedSlot) ? 1 : 0.6 }}
                >
                  Proceder al Pago Seguro (Stripe Connect)
                </button>
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
}
