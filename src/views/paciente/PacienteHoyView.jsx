import { useState, useEffect } from 'react';
import { 
  Calendar, Clock, Heart, Brain, ArrowRight, MessageSquare, 
  CheckSquare, Plus, ChevronRight, TrendingUp, Sparkles, Shield,
  Video, Star, CreditCard, ShieldCheck, CheckCircle, ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../supabaseClient';
import PlanConsumptionWidget from '../../components/PlanConsumptionWidget';

export default function PacienteHoyView({ 
  user,
  profile, 
  onNavigate, 
  dailyMoodToday, 
  onMoodSaved,
  onAssignPsychologist,
  isVirtualDemo = false
}) {
  const [selectedMood, setSelectedMood] = useState(dailyMoodToday?.anxiety_level ? Math.round((10 - dailyMoodToday.anxiety_level) / 2.5) : null);
  const [moodSavedLocal, setMoodSavedLocal] = useState(!!dailyMoodToday);

  // Función helper para generar slots reales dinámicos basados en la fecha de hoy
  const getDynamicSlots = (offset) => {
    const slots = [];
    const today = new Date();
    
    // Slot 1: Hoy (o mañana si hoy es tarde)
    const dateStr1 = today.toISOString().split('T')[0];
    const dateLabel1 = `Hoy (${today.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})`;
    slots.push({ label: `${dateLabel1} - 16:00h`, date: dateStr1, time: '16:00' });
    slots.push({ label: `${dateLabel1} - 18:30h`, date: dateStr1, time: '18:30' });

    // Slot 2: Mañana
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const dateStr2 = tomorrow.toISOString().split('T')[0];
    const dateLabel2 = `Mañana (${tomorrow.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})`;
    slots.push({ label: `${dateLabel2} - 10:00h`, date: dateStr2, time: '10:00' });
    slots.push({ label: `${dateLabel2} - 15:30h`, date: dateStr2, time: '15:30' });

    // Slot 3: Próximos días
    const future = new Date();
    future.setDate(today.getDate() + 2 + (offset % 3));
    const dateStr3 = future.toISOString().split('T')[0];
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const dayName = days[future.getDay()];
    const dateLabel3 = `${dayName} (${future.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })})`;
    slots.push({ label: `${dateLabel3} - 11:30h`, date: dateStr3, time: '11:30' });
    slots.push({ label: `${dateLabel3} - 17:00h`, date: dateStr3, time: '17:00' });

    return slots;
  };

  // Catálogo oficial de psicólogos (Cargado en tiempo real desde Firestore)
  const OFFICIAL_PSYCHOLOGISTS = [
    {
      id: '2TOfkVIRccgIgz5WamAIVmUPtD63',
      email: 'usajosefernan@gmail.com',
      name: 'José Fernández',
      license: 'M-49ccc',
      photo_url: 'https://lh3.googleusercontent.com/a/ACg8ocKTiCRCGtON7UckYXir1hkqxQPP9jHgd0A8aQx3mqswe2yNcA=s96-c',
      rating: '5.0',
      reviews: 18,
      specialties: ['Ansiedad', 'Estrés', 'Terapia Cognitiva', 'EMDR'],
      price: 55,
      approach: 'Terapia Cognitivo-Conductual & Regulación Emocional',
      experience: '11 años de experiencia clínica',
      education: 'Graduado en Psicología Clínica. Máster en Terapia Cognitiva y Regulación Emocional.',
      bio: 'Especialista en regulación emocional, estrés, ansiedad y protocolos cognitivo-conductuales con monitorización digital en Áncora.',
      slots: []
    }
  ];

  const [psychologistsList, setPsychologistsList] = useState(OFFICIAL_PSYCHOLOGISTS);

  useEffect(() => {
    const fetchPsychologists = async () => {
      try {
        const { data, error } = await supabase
          .from('psychologist_profiles')
          .select('*');
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
            approach: p.approach || 'Terapia Cognitivo-Conductual & Regulación Emocional',
            experience: p.experience || '11 años de experiencia clínica',
            education: p.education || 'Graduado en Psicología Clínica. Colegiado M-49ccc.',
            bio: p.bio || 'Especialista en regulación emocional y protocolos cognitivos con monitorización digital.',
            slots: []
          }));
          setPsychologistsList(mapped);
        }
      } catch (err) {
        console.warn('Error cargando psicólogos de Firestore:', err.message);
      }
    };
    fetchPsychologists();
  }, []);

  // Helper para leer slots dinámicos del psicólogo desde localStorage
  const getPsychoSlotsFromConfig = (psychoEmail) => {
    const local = localStorage.getItem(`availability_slots_${psychoEmail}`);
    let rawSlots = [];
    if (local) {
      rawSlots = JSON.parse(local);
    } else {
      rawSlots = [
        { day: 'Lunes', hour: '09:00', status: 'available' },
        { day: 'Lunes', hour: '11:00', status: 'available' },
        { day: 'Martes', hour: '15:00', status: 'available' },
        { day: 'Miércoles', hour: '17:00', status: 'available' },
        { day: 'Jueves', hour: '17:00', status: 'available' },
        { day: 'Viernes', hour: '10:00', status: 'available' }
      ];
    }

    const availableList = rawSlots.filter(s => s.status === 'available');
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    return availableList.map(s => {
      const targetDayIndex = daysOfWeek.indexOf(s.day);
      const today = new Date();
      const todayDayIndex = today.getDay();
      
      let diff = targetDayIndex - todayDayIndex;
      if (diff < 0) diff += 7; 
      
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + diff);
      
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      
      return {
        label: `${s.day} ${dd}/${mm} - ${s.hour}h`,
        date: `${yyyy}-${mm}-${dd}`,
        time: s.hour
      };
    });
  };

  const assignedPsychoId = profile?.contexto_terapeutico?.assigned_psychologist_id || null;
  const assignedPsycho = psychologistsList.find(p => p.id === assignedPsychoId) || (assignedPsychoId ? OFFICIAL_PSYCHOLOGISTS[0] : null);

  // Onboarding States
  const [onboardingStep, setOnboardingStep] = useState(1); // 1: Triaje, 2: Catálogo, 3: Stripe 0€
  const [tempSelectedPsychoId, setTempSelectedPsychoId] = useState(null);
  
  // Filtros de Psicólogos
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterApproach, setFilterApproach] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedPsychoForDetail, setSelectedPsychoForDetail] = useState(null);
  
  // Triaje clínico interactivo
  const [triajeAnswers, setTriajeAnswers] = useState({ q1: 0, q2: 0, q3: 0, q4: 0 });
  const [cardName, setCardName] = useState(profile?.contexto_terapeutico?.name || profile?.display_name || 'Pedro Sanz');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const triajeScore = triajeAnswers.q1 + triajeAnswers.q2 + triajeAnswers.q3 + triajeAnswers.q4;
  let triajeLevel = 'Leve';
  let triajeColor = 'var(--color-emerald)';
  if (triajeScore >= 8) {
    triajeLevel = 'Severo';
    triajeColor = 'var(--color-rose)';
  } else if (triajeScore >= 4) {
    triajeLevel = 'Moderado';
    triajeColor = 'var(--color-amber)';
  }

  const displayName = profile?.display_name || 
                      profile?.displayName || 
                      profile?.contexto_terapeutico?.displayName || 
                      profile?.contexto_terapeutico?.name || 
                      user?.user_metadata?.full_name || 
                      user?.user_metadata?.name || 
                      (user?.email ? user.email.split('@')[0] : '') || 
                      'Paciente';
  
  // Emojis de Caritas (Check-in emocional)
  const moodCaritas = [
    { value: 1, emoji: '😢', label: 'Muy mal', anxiety: 9, energy: 2 },
    { value: 2, emoji: '🙁', label: 'Mal', anxiety: 7, energy: 4 },
    { value: 3, emoji: '😐', label: 'Regular', anxiety: 5, energy: 5 },
    { value: 4, emoji: '🙂', label: 'Bien', anxiety: 3, energy: 7 },
    { value: 5, emoji: '😀', label: 'Muy bien', anxiety: 1, energy: 9 }
  ];

  const handleMoodSelect = async (carita) => {
    setSelectedMood(carita.value);
    setMoodSavedLocal(true);
    
    // Si tenemos callback, guardamos en la base de datos o simulamos
    if (onMoodSaved) {
      const todayDate = new Date().toISOString().split('T')[0];
      const newMood = {
        date: todayDate,
        anxiety_level: carita.anxiety,
        impulsivity_level: 5, // Default/Simulado
        energy_level: carita.energy,
        notes: `Check-in de carita: ${carita.label}`
      };
      onMoodSaved(newMood);
    }
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!tempSelectedPsychoId) {
      alert("Por favor, selecciona un psicólogo primero.");
      return;
    }
    if (!selectedSlot) {
      alert("Por favor, selecciona una fecha y hora para tu primera cita en el perfil del psicólogo.");
      return;
    }
    setCheckoutLoading(true);
    setTimeout(() => {
      setCheckoutLoading(false);
      onAssignPsychologist(tempSelectedPsychoId, {
        date: selectedSlot.date,
        time: selectedSlot.time
      });
    }, 1500);
  };

  // Real data state
  const [streakDays, setStreakDays] = useState(0);
  const [loadingStreak, setLoadingStreak] = useState(false);
  const [nextAppt, setNextAppt] = useState(null);
  const [loadingAppt, setLoadingAppt] = useState(false);
  const [weekData, setWeekData] = useState([]);
  const [hasMoodsThisWeek, setHasMoodsThisWeek] = useState(false);
  const [stabilityPercentage, setStabilityPercentage] = useState(84);

  useEffect(() => {
    if (isVirtualDemo) {
      setStreakDays(12);
      return;
    }
    const fetchStreakAndMoods = async () => {
      if (!profile?.id) return;
      try {
        setLoadingStreak(true);
        const { data, error } = await supabase
          .from('daily_moods')
          .select('date, anxiety_level')
          .eq('user_id', profile.id)
          .order('date', { ascending: false });
        if (error) throw error;
        
        if (!data || data.length === 0) {
          setStreakDays(0);
          setHasMoodsThisWeek(false);
          setWeekData([]);
          return;
        }
        
        // 1. Calcular Racha
        let streak = 0;
        let today = new Date();
        today.setHours(0,0,0,0);
        let yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const moodDates = data.map(d => d.date);
        
        let checkDate = new Date(today);
        if (!moodDates.includes(today.toISOString().split('T')[0])) {
          checkDate = new Date(yesterday);
        }
        
        while (true) {
          const dateStr = checkDate.toISOString().split('T')[0];
          if (moodDates.includes(dateStr)) {
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }
        setStreakDays(streak);

        // 2. Calcular Gráfico de la semana (últimos 7 días)
        const last7Days = [];
        const daysShort = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
        let hasAnyThisWeek = false;
        let anxietySum = 0;
        let moodsCount = 0;

        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const found = data.find(m => m.date === dateStr);
          
          let val = 50; // valor por defecto medio
          if (found) {
            hasAnyThisWeek = true;
            val = (10 - found.anxiety_level) * 10;
            anxietySum += found.anxiety_level;
            moodsCount++;
          }
          
          last7Days.push({
            day: daysShort[d.getDay()],
            val: val,
            hasData: !!found
          });
        }

        setHasMoodsThisWeek(hasAnyThisWeek);
        setWeekData(last7Days);

        if (moodsCount > 1) {
          const avgAnxiety = anxietySum / moodsCount;
          let varianceSum = 0;
          data.slice(0, moodsCount).forEach(m => {
            varianceSum += Math.abs(m.anxiety_level - avgAnxiety);
          });
          const stability = Math.max(0, Math.min(100, Math.round(100 - (varianceSum / moodsCount) * 10)));
          setStabilityPercentage(stability);
        } else {
          setStabilityPercentage(100);
        }

      } catch (err) {
        console.error("Error fetching daily moods history:", err.message);
      } finally {
        setLoadingStreak(false);
      }
    };

    fetchStreakAndMoods();
  }, [profile?.id, dailyMoodToday, isVirtualDemo]);

  useEffect(() => {
    const fetchNextAppointment = async () => {
      if (!profile?.id) return;
      setLoadingAppt(true);
      if (isVirtualDemo) {
        try {
          const localApptsStr = localStorage.getItem('virtual_appointments') || '[]';
          const localAppts = JSON.parse(localApptsStr).filter(
            a => a.patient_id === profile.id && a.status === 'upcoming'
          );
          if (localAppts.length > 0) {
            localAppts.sort((x, y) => {
              const dx = new Date(`${x.appointment_date}T${x.appointment_time}`);
              const dy = new Date(`${y.appointment_date}T${y.appointment_time}`);
              return dx - dy;
            });
            setNextAppt(localAppts[0]);
          } else {
            setNextAppt(null);
          }
        } catch (err) {
          console.error("Error loading virtual appt:", err);
        } finally {
          setLoadingAppt(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', profile.id)
          .eq('status', 'upcoming')
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const upcoming = data.filter(a => {
            const apptDateTime = new Date(`${a.appointment_date}T${a.appointment_time}`);
            return apptDateTime > new Date();
          });
          setNextAppt(upcoming[0] || null);
        } else {
          setNextAppt(null);
        }
      } catch (err) {
        console.error("Error fetching next appointment:", err.message);
      } finally {
        setLoadingAppt(false);
      }
    };

    fetchNextAppointment();
  }, [profile?.id, isVirtualDemo]);

  const formatApptDate = (dateStr, timeStr) => {
    try {
      const date = new Date(`${dateStr}T${timeStr}`);
      const options = { weekday: 'long', day: 'numeric', month: 'long' };
      const formattedDate = date.toLocaleDateString('es-ES', options);
      const capitalized = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
      return `${capitalized} — ${timeStr}h`;
    } catch (e) {
      return `${dateStr} — ${timeStr}h`;
    }
  };

  const getRemainingTime = (dateStr, timeStr) => {
    try {
      const apptDate = new Date(`${dateStr}T${timeStr}`);
      const now = new Date();
      const diffMs = apptDate - now;
      if (diffMs <= 0) return 'Ahora mismo';
      
      const diffMins = Math.floor(diffMs / 1000 / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        return `Restan: ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
      }
      if (diffHours > 0) {
        const remainingMins = diffMins % 60;
        return `Restan: ${diffHours}h ${remainingMins}m`;
      }
      return `Restan: ${diffMins} min`;
    } catch (e) {
      return '';
    }
  };

  const getSvgPath = (data) => {
    if (!data || data.length === 0) return '';
    return data.map((d, idx) => {
      const x = idx * 48 + 20;
      const y = 100 - d.val * 0.8;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const getSvgAreaPath = (data) => {
    if (!data || data.length === 0) return '';
    const linePath = getSvgPath(data);
    const lastX = (data.length - 1) * 48 + 20;
    return `${linePath} L ${lastX} 100 L 20 100 Z`;
  };

  // Mock de datos del plan clínico del paciente (para demo)
  const mockEnfoques = ['Ansiedad laboral', 'Autoestima', 'Regulación emocional'];
  const mockWeekData = [
    { day: 'L', val: 70 },
    { day: 'M', val: 62 },
    { day: 'X', val: 80 },
    { day: 'J', val: 55 },
    { day: 'V', val: 75 },
    { day: 'S', val: 88 },
    { day: 'D', val: 85 }
  ];

  // RENDER DE ONBOARDING SI NO TIENE PSICÓLOGO
  if (!assignedPsychoId) {
    return (
      <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px', maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Cabecera del Onboarding */}
        <div style={{ textAlign: 'center', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, fontFamily: "'Playfair Display', serif", margin: 0, background: 'linear-gradient(135deg, #ffffff, #7F9F88)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Bienvenido a Áncora, {displayName}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            Personaliza tu espacio terapéutico y selecciona a tu psicólogo de referencia.
          </p>
        </div>

        {/* Pasos Indicador */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '10px' }}>
          {[
            { step: 1, label: '1. Triaje Clínico' },
            { step: 2, label: '2. Catálogo' },
            { step: 3, label: '3. Pasarela 0€' }
          ].map(s => (
            <div 
              key={s.step} 
              style={{ 
                fontSize: '0.8rem', 
                fontWeight: onboardingStep === s.step ? 800 : 500,
                color: onboardingStep === s.step ? 'var(--color-cyan)' : 'var(--text-tertiary)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s'
              }}
            >
              <span style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                background: onboardingStep === s.step ? 'rgba(68,125,130,0.1)' : 'transparent',
                border: `1.5px solid ${onboardingStep === s.step ? 'var(--color-cyan)' : 'var(--border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem'
              }}>
                {s.step}
              </span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* CONTENIDO DE PASOS */}
        <div className="glass-panel" style={{ padding: '32px', minHeight: '340px', background: 'rgba(5, 33, 58, 0.25)', borderColor: 'rgba(255,255,255,0.03)' }}>
          
          {/* PASO 1: TRIAJE CLÍNICO */}
          {onboardingStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              
              {/* Bloque explicativo premium del funcionamiento */}
              <div className="glass-panel" style={{ padding: '20px', background: 'rgba(68, 125, 130, 0.04)', borderColor: 'rgba(68, 125, 130, 0.15)', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-cyan)', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} />
                  ¿CÓMO FUNCIONA TU PROCESO EN ÁNCORA?
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-cyan)', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>1</span>
                      <strong style={{ fontSize: '0.72rem', color: '#ffffff' }}>Elige Terapeuta</strong>
                    </div>
                    <p style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                      Explora libremente el catálogo y selecciona al profesional de tu preferencia.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-cyan)', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>2</span>
                      <strong style={{ fontSize: '0.72rem', color: '#ffffff' }}>Sesión de Encuadre</strong>
                    </div>
                    <p style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                      Cita de 1 hora para valorar tu caso y encuadrar objetivos clínicos iniciales.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-cyan)', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>3</span>
                      <strong style={{ fontSize: '0.72rem', color: '#ffffff' }}>Perfil Clínico</strong>
                    </div>
                    <p style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                      Sube tu información de salud y habla a diario con Ánquer (IA) para soporte.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-cyan)', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>4</span>
                      <strong style={{ fontSize: '0.72rem', color: '#ffffff' }}>Cita Semanal</strong>
                    </div>
                    <p style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                      A la semana se tiene la cita agendada para el tratamiento estructurado.
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-cyan)', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>5</span>
                      <strong style={{ fontSize: '0.72rem', color: '#ffffff' }}>Suscripción Flexible</strong>
                    </div>
                    <p style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                      Decide con total libertad si continuar con la facturación mensual o no.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Evaluación Inicial</span>
                <span style={{ fontSize: '0.75rem', color: triajeColor, fontWeight: 700 }}>
                  Puntuación de Malestar: {triajeScore} ({triajeLevel})
                </span>
              </div>
              
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Por favor, indícanos cómo te has sentido durante las últimas dos semanas para orientar tu proceso de triaje.
              </p>

              {[
                { key: 'q1', label: '1. ¿Poco interés o placer en hacer las cosas?' },
                { key: 'q2', label: '2. ¿Sentirse decaído/a, deprimido/a o sin esperanzas?' },
                { key: 'q3', label: '3. ¿Sentirse nervioso/a, ansioso/a o con los nervios de punta?' },
                { key: 'q4', label: '4. ¿No poder detener o controlar la preocupación?' }
              ].map(q => (
                <div key={q.key} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#ffffff' }}>{q.label}</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { v: 0, l: 'Nunca' },
                      { v: 1, l: 'Varios días' },
                      { v: 2, l: 'La mitad' },
                      { v: 3, l: 'Casi siempre' }
                    ].map(opt => (
                      <button
                        key={opt.v}
                        onClick={() => setTriajeAnswers(prev => ({ ...prev, [q.key]: opt.v }))}
                        className="btn"
                        style={{
                          flex: 1,
                          fontSize: '0.7rem',
                          height: '32px',
                          padding: 0,
                          background: triajeAnswers[q.key] === opt.v ? 'rgba(68,125,130,0.15)' : 'rgba(255,255,255,0.01)',
                          borderColor: triajeAnswers[q.key] === opt.v ? 'var(--color-cyan)' : 'var(--border)',
                          color: triajeAnswers[q.key] === opt.v ? '#ffffff' : 'var(--text-secondary)',
                          fontWeight: triajeAnswers[q.key] === opt.v ? 700 : 400
                        }}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  onClick={() => setOnboardingStep(2)}
                  className="btn btn-primary"
                  style={{ background: 'var(--color-cyan)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '0 20px', height: '40px' }}
                >
                  <span>Ver Psicólogos Disponibles</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* PASO 2: CATÁLOGO DE PSICÓLOGOS */}
          {onboardingStep === 2 && (() => {
            const filteredPsychologists = psychologistsList.filter(psy => {
              const matchesName = psy.name.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesSpecialty = filterSpecialty === '' || psy.specialties.includes(filterSpecialty);
              const matchesApproach = filterApproach === '' || psy.approach.includes(filterApproach);
              let matchesPrice = true;
              if (filterMaxPrice === 'under50') matchesPrice = psy.price < 50;
              else if (filterMaxPrice === '50to55') matchesPrice = psy.price >= 50 && psy.price <= 55;
              else if (filterMaxPrice === 'over55') matchesPrice = psy.price > 55;
              return matchesName && matchesSpecialty && matchesApproach && matchesPrice;
            });

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Paso 2 de 3</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Selecciona el psicólogo y agenda tu slot de prueba</span>
                </div>

                {/* Panel de Filtros Superior */}
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.015)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    
                    {/* Búsqueda por nombre */}
                    <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Buscar Terapeuta</label>
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar por nombre (ej. José Fernández)..."
                        className="form-input"
                        style={{ height: '36px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 10px', width: '100%' }}
                      />
                    </div>

                    {/* Especialidad */}
                    <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Especialidad</label>
                      <select 
                        value={filterSpecialty}
                        onChange={(e) => setFilterSpecialty(e.target.value)}
                        className="form-input"
                        style={{ height: '36px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 10px', cursor: 'pointer', color: '#ffffff' }}
                      >
                        <option value="">Todas</option>
                        <option value="Ansiedad">Ansiedad</option>
                        <option value="Depresión">Depresión</option>
                        <option value="Estrés">Estrés</option>
                        <option value="Trauma">Trauma</option>
                        <option value="Duelo">Duelo</option>
                        <option value="Fobias">Fobias</option>
                        <option value="Autoestima">Autoestima</option>
                        <option value="Sueño">Sueño</option>
                        <option value="Pareja">Pareja</option>
                      </select>
                    </div>

                    {/* Enfoque */}
                    <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Enfoque Clínico</label>
                      <select 
                        value={filterApproach}
                        onChange={(e) => setFilterApproach(e.target.value)}
                        className="form-input"
                        style={{ height: '36px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 10px', cursor: 'pointer', color: '#ffffff' }}
                      >
                        <option value="">Todos</option>
                        <option value="TCC">Cognitivo-Conductual (TCC)</option>
                        <option value="EMDR">EMDR</option>
                        <option value="Mindfulness">Mindfulness</option>
                        <option value="ACT">Aceptación y Compromiso (ACT)</option>
                        <option value="Sistémico">Sistémico</option>
                        <option value="Humanista">Humanista</option>
                      </select>
                    </div>

                    {/* Tarifa */}
                    <div style={{ flex: '1 1 140px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Tarifa Máxima</label>
                      <select 
                        value={filterMaxPrice}
                        onChange={(e) => setFilterMaxPrice(e.target.value)}
                        className="form-input"
                        style={{ height: '36px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 10px', cursor: 'pointer', color: '#ffffff' }}
                      >
                        <option value="">Cualquier precio</option>
                        <option value="under50">Menos de 50€</option>
                        <option value="50to55">Entre 50€ y 55€</option>
                        <option value="over55">Más de 55€</option>
                      </select>
                    </div>

                  </div>
                </div>

                {/* Listado de Psicólogos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {filteredPsychologists.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      No se encontraron psicólogos que coincidan con los filtros aplicados. Prueba a restablecer los criterios.
                    </div>
                  ) : (
                    filteredPsychologists.map(psy => {
                      const isSelected = tempSelectedPsychoId === psy.id;
                      const hasSelectedSlotForThisPsycho = isSelected && selectedSlot;
                      const isNew = parseFloat(psy.rating) === 0;

                      return (
                        <div 
                          key={psy.id}
                          style={{
                            padding: '16px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.01)',
                            border: '1px solid',
                            borderColor: isSelected ? 'var(--color-cyan)' : 'var(--border)',
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'center',
                            transition: 'all 0.2s',
                            boxShadow: isSelected ? '0 4px 20px rgba(68,125,130,0.1)' : 'none'
                          }}
                        >
                          <img 
                            src={psy.photo_url} 
                            alt={psy.name} 
                            style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                              <div style={{ minWidth: 0 }}>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {psy.name}
                                </h4>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {psy.approach} · Colegiado {psy.license}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: isNew ? 'rgba(255,255,255,0.05)' : 'rgba(251,191,36,0.08)', padding: '2px 8px', borderRadius: '4px', flexShrink: 0 }}>
                                <Star size={12} color={isNew ? 'var(--text-tertiary)' : '#fbbf24'} fill={isNew ? 'none' : '#fbbf24'} />
                                <strong style={{ fontSize: '0.7rem', color: isNew ? 'var(--text-secondary)' : '#fbbf24' }}>
                                  {isNew ? '0.0' : psy.rating}
                                </strong>
                                <span style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)' }}>({psy.reviews})</span>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                              {psy.specialties.map(spec => (
                                <span key={spec} className="badge badge-cyan" style={{ fontSize: '0.6rem', padding: '2px 6px', textTransform: 'none' }}>
                                  {spec}
                                </span>
                              ))}
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', flexShrink: 0 }}>
                            <div>
                              <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{psy.price}€</strong>
                              <span style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', display: 'block' }}>POR SESIÓN</span>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => setSelectedPsychoForDetail(psy)}
                                className="btn btn-outline"
                                style={{ fontSize: '0.68rem', padding: '0 8px', height: '28px', minWidth: 'auto', borderColor: 'rgba(255,255,255,0.1)', background: 'transparent' }}
                              >
                                Ver Perfil y CV
                              </button>
                              
                              <button
                                onClick={() => {
                                  setTempSelectedPsychoId(psy.id);
                                  setSelectedPsychoForDetail(psy); // Abrir directamente para obligar a seleccionar slot
                                }}
                                className="btn"
                                style={{ 
                                  fontSize: '0.68rem', 
                                  padding: '0 10px', 
                                  height: '28px', 
                                  background: isSelected ? 'var(--color-cyan)' : 'rgba(255,255,255,0.05)', 
                                  color: '#ffffff',
                                  fontWeight: isSelected ? 700 : 400,
                                  borderColor: isSelected ? 'var(--color-cyan)' : 'var(--border)'
                                }}
                              >
                                {isSelected ? (hasSelectedSlotForThisPsycho ? 'Seleccionado ✓' : 'Falta Slot') : 'Seleccionar'}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Resumen de cita seleccionada */}
                {tempSelectedPsychoId && selectedSlot && (
                  <div className="glass-panel" style={{ padding: '12px 16px', background: 'rgba(68,125,130,0.08)', borderColor: 'rgba(68,125,130,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <CheckSquare size={16} color="var(--color-cyan)" />
                      <span style={{ fontSize: '0.78rem', color: '#ffffff' }}>
                        Cita de prueba con <strong>{psychologistsList.find(p => p.id === tempSelectedPsychoId)?.name}</strong> reservada para: <strong>{selectedSlot.label}</strong>
                      </span>
                    </div>
                    <button 
                      onClick={() => { setSelectedSlot(null); setTempSelectedPsychoId(null); }}
                      style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '0.7rem' }}
                    >
                      Cambiar
                    </button>
                  </div>
                )}

                {/* Navegación inferior */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                  <button
                    onClick={() => setOnboardingStep(1)}
                    className="btn btn-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', height: '40px', padding: '0 16px' }}
                  >
                    <ArrowLeft size={14} />
                    <span>Volver a Triaje</span>
                  </button>
                  <button
                    disabled={!tempSelectedPsychoId || !selectedSlot}
                    onClick={() => setOnboardingStep(3)}
                    className="btn btn-primary"
                    style={{ 
                      background: tempSelectedPsychoId && selectedSlot ? 'var(--color-cyan)' : 'rgba(255,255,255,0.02)', 
                      color: tempSelectedPsychoId && selectedSlot ? '#ffffff' : 'var(--text-tertiary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px', 
                      fontSize: '0.8rem', 
                      padding: '0 20px', 
                      height: '40px',
                      cursor: tempSelectedPsychoId && selectedSlot ? 'pointer' : 'not-allowed',
                      borderColor: tempSelectedPsychoId && selectedSlot ? 'var(--color-cyan)' : 'var(--border)'
                    }}
                  >
                    <span>Continuar a Pasarela</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* MODAL DETALLE / CV CLÍNICO Y AGENDA */}
                {selectedPsychoForDetail && (
                  <div 
                    style={{
                      position: 'fixed',
                      top: 0, left: 0, right: 0, bottom: 0,
                      background: 'rgba(0,0,0,0.8)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2000,
                      padding: '20px',
                      transition: 'all 0.3s'
                    }}
                    onClick={() => setSelectedPsychoForDetail(null)}
                  >
                    <div 
                      className="glass-panel animate-scale-up"
                      style={{
                        width: '100%',
                        maxWidth: '580px',
                        background: 'var(--background-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '16px',
                        padding: '24px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        textAlign: 'left',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Cabecera del Perfil */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                          <img 
                            src={selectedPsychoForDetail.photo_url} 
                            alt={selectedPsychoForDetail.name} 
                            style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-cyan)' }}
                          />
                          <div>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                              {selectedPsychoForDetail.name}
                            </h3>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                              {selectedPsychoForDetail.approach} · Colegiado {selectedPsychoForDetail.license}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                              <Star size={12} color={parseFloat(selectedPsychoForDetail.rating) === 0 ? 'var(--text-tertiary)' : '#fbbf24'} fill={parseFloat(selectedPsychoForDetail.rating) === 0 ? 'none' : '#fbbf24'} />
                              <strong style={{ fontSize: '0.7rem', color: parseFloat(selectedPsychoForDetail.rating) === 0 ? 'var(--text-secondary)' : '#fbbf24' }}>
                                {parseFloat(selectedPsychoForDetail.rating) === 0 ? '0.0' : selectedPsychoForDetail.rating}
                              </strong>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>({selectedPsychoForDetail.reviews} opiniones)</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedPsychoForDetail(null)}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border)',
                            color: '#ffffff',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          ✕
                        </button>
                      </div>

                      {/* Enfoque y Especialidades */}
                      <div style={{ marginBottom: '20px' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Especialidades</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {selectedPsychoForDetail.specialties.map(spec => (
                            <span key={spec} className="badge badge-cyan" style={{ fontSize: '0.65rem', padding: '4px 8px', textTransform: 'none' }}>
                              {spec}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* CV Clínico - Educación & Experiencia */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Experiencia</span>
                          <p style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 750, margin: 0 }}>{selectedPsychoForDetail.experience}</p>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Educación Académica</span>
                          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>{selectedPsychoForDetail.education}</p>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Trayectoria y Biografía</span>
                          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>{selectedPsychoForDetail.bio}</p>
                        </div>
                      </div>

                      {/* Agenda Interactiva (Slots de Prueba) */}
                      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '20px' }}>
                        
                        {/* Fichas Visuales y Dinámicas de Recomendación de Agenda */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }} className="grid-responsive-dashboard">
                          
                          {/* Ficha 1: Recomendado (+7 días) */}
                          <div 
                            style={{ 
                              padding: '12px 14px', 
                              borderRadius: '10px', 
                              background: 'rgba(16, 185, 129, 0.03)', 
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              textAlign: 'left'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Sparkles size={14} color="var(--color-emerald)" />
                              <strong style={{ fontSize: '0.72rem', color: 'var(--color-emerald)' }}>Recomendado (+7 días)</strong>
                            </div>
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Periodo de Preparación Clínica</span>
                            <p style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                              Te da una semana para hablar con Ánquer (IA), registrar tu estado emocional y subir tus informes médicos o medicación en "Mi Historial". Así, tu terapeuta tiene tu perfil clínico completo preparado para la cita de 1 hora.
                            </p>
                          </div>

                          {/* Ficha 2: Cita Inmediata (Decisión del Usuario) */}
                          <div 
                            style={{ 
                              padding: '12px 14px', 
                              borderRadius: '10px', 
                              background: 'rgba(6, 182, 212, 0.03)', 
                              border: '1px solid rgba(6, 182, 212, 0.25)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              textAlign: 'left'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Clock size={14} color="var(--color-cyan)" />
                              <strong style={{ fontSize: '0.72rem', color: 'var(--color-cyan)' }}>Cita Inmediata (Tú decides)</strong>
                            </div>
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>Comienzo Express</span>
                            <p style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                              Si necesitas urgencia o deseas empezar ya, puedes elegir slots libres para hoy o mañana (ej. registrarse hoy a las 10 y tener la cita a las 13). Tendrás esas horas previas para completar tu perfil en la app.
                            </p>
                          </div>

                        </div>

                        {/* Nota de recomendación posterior */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '16px' }}>
                          <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: 1.4 }}>
                            <strong>💡 Seguimiento sugerido post-triaje:</strong> Al comenzar tu tratamiento, la recomendación clínica estándar es programar citas preferiblemente semanales para revisiones periódicas (revisiones de 15 min o sesiones síncronas de 1h, según acuerdes en tu plan).
                          </span>
                        </div>

                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
                          Slots Disponibles (Selecciona uno para agendar hoy)
                        </span>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                          {getPsychoSlotsFromConfig(selectedPsychoForDetail.id === '19057a26-ebcb-4d42-a668-80250299912a' ? 'tisutet@hormail.com' : 'usajosefernan@gmail.com').map(slot => {
                            const isSlotSelected = selectedSlot && selectedSlot.date === slot.date && selectedSlot.time === slot.time && tempSelectedPsychoId === selectedPsychoForDetail.id;
                            
                            return (
                              <button
                                key={slot.label}
                                onClick={() => {
                                  setTempSelectedPsychoId(selectedPsychoForDetail.id);
                                  setSelectedSlot(slot);
                                }}
                                className="btn"
                                style={{
                                  fontSize: '0.68rem',
                                  padding: '8px',
                                  height: 'auto',
                                  background: isSlotSelected ? 'rgba(68,125,130,0.25)' : 'rgba(255,255,255,0.01)',
                                  borderColor: isSlotSelected ? 'var(--color-cyan)' : 'var(--border)',
                                  color: isSlotSelected ? '#ffffff' : 'var(--text-secondary)',
                                  fontWeight: isSlotSelected ? 700 : 400,
                                  borderRadius: '6px',
                                  textAlign: 'center',
                                  transition: 'all 0.15s'
                                }}
                              >
                                {slot.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Botón de Confirmación en Modal */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <span style={{ fontSize: '0.8rem', alignSelf: 'center', color: '#ffffff', marginRight: 'auto' }}>
                          Tarifa: <strong>{selectedPsychoForDetail.price}€/sesión</strong>
                        </span>
                        
                        <button
                          onClick={() => setSelectedPsychoForDetail(null)}
                          className="btn btn-outline"
                          style={{ fontSize: '0.76rem', height: '36px', padding: '0 12px' }}
                        >
                          Cerrar
                        </button>
                        
                        <button
                          disabled={!selectedSlot || tempSelectedPsychoId !== selectedPsychoForDetail.id}
                          onClick={() => {
                            setSelectedPsychoForDetail(null);
                          }}
                          className="btn btn-primary"
                          style={{ 
                            fontSize: '0.76rem', 
                            height: '36px', 
                            padding: '0 16px',
                            background: selectedSlot && tempSelectedPsychoId === selectedPsychoForDetail.id ? 'var(--color-cyan)' : 'rgba(255,255,255,0.02)',
                            color: selectedSlot && tempSelectedPsychoId === selectedPsychoForDetail.id ? '#ffffff' : 'var(--text-tertiary)',
                            borderColor: selectedSlot && tempSelectedPsychoId === selectedPsychoForDetail.id ? 'var(--color-cyan)' : 'var(--border)'
                          }}
                        >
                          Confirmar Selección
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* PASO 3: STRIPE 0€ CHECKOUT */}
          {onboardingStep === 3 && (
            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>Checkout Stripe</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--color-emerald)', fontWeight: 700 }}>Tarifa Cero: 0€ Hoy</span>
              </div>

              {/* Explicación de pago */}
              <div style={{ background: 'rgba(127,159,136,0.06)', border: '1px solid rgba(127,159,136,0.2)', padding: '16px', borderRadius: '8px' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} color="var(--color-emerald)" />
                  Garantía de Tarifa Cero de Áncora
                </h5>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                  Vinculamos tu tarjeta para autorizar sesiones futuras bajo las tarifas acordadas con tu terapeuta ({psychologistsList.find(p => p.id === tempSelectedPsychoId)?.price || 55}€/sesión). **No se realizará ningún cargo hoy (0,00 €)**. Solo se facturará tras la realización efectiva de tu primera consulta.
                </p>
              </div>

              {/* Formulario de tarjeta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Nombre en la Tarjeta</label>
                  <input 
                    type="text" 
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Juan Pérez" 
                    className="form-input"
                    style={{ height: '38px', fontSize: '0.78rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', width: '100%', padding: '0 12px' }}
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
                      style={{ height: '38px', fontSize: '0.78rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', width: '100%', padding: '0 40px 0 12px' }}
                    />
                    <CreditCard size={16} color="var(--text-tertiary)" style={{ position: 'absolute', right: '12px', top: '11px' }} />
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
                      style={{ height: '38px', fontSize: '0.78rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', width: '100%', padding: '0 12px' }}
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
                      style={{ height: '38px', fontSize: '0.78rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', width: '100%', padding: '0 12px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setOnboardingStep(2)}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', height: '40px', padding: '0 16px' }}
                >
                  <ArrowLeft size={14} />
                  <span>Volver a Catálogo</span>
                </button>
                <button
                  type="submit"
                  disabled={checkoutLoading || !cardName || !cardNumber}
                  className="btn btn-emerald"
                  style={{ background: 'var(--color-emerald)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', padding: '0 24px', height: '40px', fontWeight: 700 }}
                >
                  {checkoutLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Procesando pasarela...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      <span>Confirmar y Vincular (0€)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Escudo Legal */}
        <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
          <Shield size={20} color="var(--color-emerald)" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45, textAlign: 'left' }}>
            <strong>Privacidad de Pago:</strong> Tus datos de pago son procesados con encriptación SSL de nivel bancario a través de Stripe Connect. Áncora no almacena ni ve tu tarjeta en ningún momento.
          </span>
        </div>

      </div>
    );
  }

  // DEFINIR TERAPEUTA DINÁMICO
  const psychoName = assignedPsycho?.name || 'Dra. María Fernández';
  const psychoPhoto = assignedPsycho?.photo_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200';
  const psychoLicense = assignedPsycho?.license || 'M-28490';
  const psychoRate = assignedPsycho?.price || 49;
  const psychoApproach = assignedPsycho?.approach || 'Cognitivo-Conductual (TCC)';

  return (
    <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
      
      {/* Cabecera / Saludo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            Hola, {displayName} <span className="animate-pulse-soft">👋</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Tu psicólogo sigue siendo el centro de tu proceso. Te acompañamos en cada paso.
          </p>
        </div>
        
        {/* Racha de adherencia */}
        <div className="glass-panel flex-center" style={{ padding: '8px 16px', gap: '10px', background: 'rgba(127,159,136,0.08)', borderColor: 'rgba(127,159,136,0.2)' }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-emerald)', boxShadow: '0 0 8px var(--color-emerald)' }} />
          <div style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Racha de adherencia</span>
            <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>
              {loadingStreak ? 'Cargando...' : `${streakDays} ${streakDays === 1 ? 'día' : 'días'}`}{' '}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                {streakDays > 0 ? '¡Sigue así!' : '¡Empieza hoy!'}
              </span>
            </strong>
          </div>
        </div>
      </div>

      {/* Grid Superior */}
      <div className="grid-2" style={{ gap: '20px' }}>
        
        {/* Tarjeta Próxima Sesión */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid var(--color-cyan)', background: 'rgba(68,125,130,0.02)' }}>
          {loadingAppt ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '150px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cargando cita...</span>
            </div>
          ) : nextAppt ? (
            <>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Próxima Sesión</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} /> {getRemainingTime(nextAppt.appointment_date, nextAppt.appointment_time)}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                  {formatApptDate(nextAppt.appointment_date, nextAppt.appointment_time)}
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-emerald)' }} />
                  Con {psychologistsList.find(p => p.id === nextAppt.psychologist_id)?.name || 'Tu psicólogo'} (Videollamada en vivo)
                </p>
              </div>
              
              <button 
                onClick={() => onNavigate('sesiones')}
                className="btn btn-primary" 
                style={{ 
                  marginTop: '20px', 
                  width: '100%', 
                  background: 'var(--color-cyan)', 
                  borderColor: 'rgba(68,125,130,0.4)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  height: '42px',
                  fontSize: '0.82rem'
                }}
              >
                <Video size={16} />
                <span>Acceder a la sesión en vivo</span>
              </button>
            </>
          ) : (
            <>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Sin sesiones programadas</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px', lineHeight: 1.3 }}>
                  ¿Comenzamos tu proceso?
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  No tienes ninguna cita agendada próximamente. Recomendamos agendar una sesión semanal para tu tratamiento.
                </p>
              </div>
              
              <button 
                onClick={() => onNavigate('sesiones')}
                className="btn btn-primary" 
                style={{ 
                  marginTop: '20px', 
                  width: '100%', 
                  background: 'var(--color-cyan)', 
                  borderColor: 'rgba(68,125,130,0.4)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  height: '42px',
                  fontSize: '0.82rem'
                }}
              >
                <Calendar size={16} />
                <span>Programar Sesión</span>
              </button>
            </>
          )}
        </div>

        {/* Check-in Emocional */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <span className="badge badge-emerald" style={{ fontSize: '0.65rem', marginBottom: '14px' }}>Check-in Emocional</span>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              ¿Cómo te sientes en este momento?
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Registra tu estado de ánimo para que tu psicólogo pueda analizar tu evolución diaria.
            </p>
            
            {/* Emojis Selector */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', margin: '10px 0' }}>
              {moodCaritas.map(carita => (
                <button
                  key={carita.value}
                  onClick={() => handleMoodSelect(carita)}
                  className="flex-center"
                  style={{
                    flexDirection: 'column',
                    gap: '6px',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: selectedMood === carita.value ? 'var(--color-emerald)' : 'transparent',
                    background: selectedMood === carita.value ? 'rgba(127,159,136,0.1)' : 'rgba(255,255,255,0.01)',
                    transition: 'all var(--transition-fast)',
                    cursor: 'pointer',
                    flex: 1
                  }}
                >
                  <span style={{ fontSize: '1.6rem', filter: selectedMood && selectedMood !== carita.value ? 'grayscale(80%)' : 'none' }}>
                    {carita.emoji}
                  </span>
                  <span style={{ fontSize: '0.62rem', color: selectedMood === carita.value ? 'var(--color-emerald)' : 'var(--text-secondary)' }}>
                    {carita.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
            {moodSavedLocal ? (
              <span style={{ fontSize: '0.75rem', color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                ✓ ¡Ánimo registrado correctamente!
              </span>
            ) : (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                Tu diario asíncrono y privado.
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Grid Inferior (3 columnas en desktop) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Columna Izquierda: Gráfico y Enfoques */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Áreas de Enfoque */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              🎯 Enfoques Activos
            </h4>
            {profile?.contexto_terapeutico?.enfoques && profile.contexto_terapeutico.enfoques.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.contexto_terapeutico.enfoques.map(tag => (
                  <span key={tag} className="badge badge-cyan" style={{ fontSize: '0.75rem', padding: '6px 12px', textTransform: 'none' }}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : isVirtualDemo ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {mockEnfoques.map(tag => (
                  <span key={tag} className="badge badge-cyan" style={{ fontSize: '0.75rem', padding: '6px 12px', textTransform: 'none' }}>
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ border: '1px dashed rgba(255,255,255,0.1)', padding: '12px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Sin enfoques activos</span>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', display: 'block', lineHeight: 1.3 }}>
                  Tu psicólogo definirá tus objetivos y enfoques clínicos tras tu sesión de encuadre.
                </span>
              </div>
            )}
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: '14px', lineHeight: 1.35 }}>
              Definidos en tu consulta diagnóstica de onboarding. Tu psicólogo guiará el tratamiento enfocado en estas áreas.
            </p>
          </div>

          {/* Gráfico Semanal Simple */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', margin: 0 }}>
                📈 Estado Emocional Semanal
              </h4>
              <span style={{ fontSize: '0.68rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
                {isVirtualDemo || hasMoodsThisWeek ? `Estabilidad: ${stabilityPercentage}%` : 'Sin datos'}
              </span>
            </div>
            
            {(isVirtualDemo || hasMoodsThisWeek) ? (
              /* SVG Line Graph */
              <div style={{ height: '120px', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '10px 10px 0 10px' }}>
                
                <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100px', pointerEvents: 'none' }}>
                  <path 
                    d={getSvgPath(isVirtualDemo ? mockWeekData : weekData)} 
                    fill="none" 
                    stroke="var(--color-emerald)" 
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <path 
                    d={getSvgAreaPath(isVirtualDemo ? mockWeekData : weekData)} 
                    fill="url(#gradient-mood)" 
                    opacity="0.08"
                  />
                  
                  <defs>
                    <linearGradient id="gradient-mood" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-emerald)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Etiquetas de Días */}
                {(isVirtualDemo ? mockWeekData : weekData).map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', zIndex: 10 }}>
                    {/* Punto sobre la línea */}
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--color-emerald)',
                      boxShadow: '0 0 6px var(--color-emerald)',
                      position: 'absolute',
                      bottom: `${(isVirtualDemo ? d.val : d.val) * 0.8 + 20}px`,
                      left: `${idx * 48 + 20}px`
                    }} />
                    <span style={{ fontSize: '0.68rem', fontWeight: '700', color: 'var(--text-tertiary)' }}>{d.day}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ height: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '6px', padding: '10px' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Gráfico vacío</span>
                <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.35 }}>
                  Realiza registros en tu diario para ver tu tendencia de bienestar aquí.
                </span>
              </div>
            )}
          </div>

        </div>

        {/* Columna Derecha: Acciones, Resumen y Perfil Profesional */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Widget de Consumo de Créditos de IA */}
          {profile?.id && (
            <PlanConsumptionWidget patientId={profile.id} />
          )}

          {/* Acciones Rápidas */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              ⚡ Acciones Rápidas
            </h4>
            <div className="grid-2" style={{ gap: '10px' }}>
              <button 
                onClick={() => onNavigate('chat')}
                className="flex-center" 
                style={{ 
                  flexDirection: 'column', 
                  gap: '8px', 
                  padding: '16px', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border)', 
                  background: 'rgba(255,255,255,0.01)', 
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-emerald)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <MessageSquare size={20} color="var(--color-cyan)" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Abrir Chat</span>
              </button>
              
              <button 
                onClick={() => onNavigate('diary')}
                className="flex-center" 
                style={{ 
                  flexDirection: 'column', 
                  gap: '8px', 
                  padding: '16px', 
                  borderRadius: 'var(--radius-md)', 
                  border: '1px solid var(--border)', 
                  background: 'rgba(255,255,255,0.01)', 
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--color-emerald)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <Heart size={20} color="var(--color-rose)" />
                <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>Nuevo Diario</span>
              </button>
            </div>
          </div>

          {/* Resumen de Última Sesión / Bienvenida */}
          {(!isVirtualDemo && !profile?.contexto_terapeutico?.ultima_sesion) ? (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                📝 Fichas Clínicas
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                Aquí aparecerán los resúmenes, pautas y tareas recomendadas por tu psicólogo al finalizar cada sesión de terapia.
              </p>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                Tu historial clínico es confidencial y está encriptado de extremo a extremo.
              </span>
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '20px', position: 'relative' }}>
              <span className="badge badge-emerald" style={{ fontSize: '0.62rem', position: 'absolute', top: '16px', right: '16px' }}>Validado</span>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                📝 Última sesión {profile?.contexto_terapeutico?.ultima_sesion?.fecha || '(22 May)'}
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '14px' }}>
                {profile?.contexto_terapeutico?.ultima_sesion?.resumen || '"Exploramos situaciones de estrés en el ámbito laboral y tus esquemas de autoexigencia. Acordamos pautas específicas para limitar la rumiación nocturna e iniciar el diario de Ánquer."'}
              </p>
              <button
                onClick={() => onNavigate('historial')}
                className="flex-center"
                style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-emerald)', gap: '4px', cursor: 'pointer', background: 'transparent', border: 'none', padding: 0 }}
              >
                <span>Ver ficha y pautas completas</span>
                <ArrowRight size={12} />
              </button>
            </div>
          )}

          {/* Tu Psicólogo */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
              👩‍⚕️ Psicólogo Elegido
            </h4>
            
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
              <img 
                src={psychoPhoto} 
                alt={psychoName} 
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
              />
              <div style={{ textAlign: 'left' }}>
                <h5 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>{psychoName}</h5>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{psychoApproach}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', display: 'block' }}>Nº Colegiado: {psychoLicense}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '12px', marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Tarifa: {psychoRate} € / sesión</span>
              <button 
                onClick={() => onNavigate('sesiones')}
                className="flex-center" 
                style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-cyan)', gap: '4px', cursor: 'pointer' }}
              >
                <span>Reservar otra</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Caja de Escudo Ético Sanitario */}
      <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
        <Shield size={20} color="var(--color-emerald)" style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          <strong>Garantía ÁNCORA:</strong> Cumplimos estrictamente con la LOPDGDD y el RGPD sanitario. Tus datos clínicos están cifrados y solo tu psicólogo elegido tiene acceso a las conversaciones literales y notas clínicas validadas.
        </span>
      </div>

    </div>
  );
}
