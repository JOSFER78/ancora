import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  User, Mail, CreditCard, Clock, FileText, 
  ShieldCheck, Sparkles, CheckCircle2, Award, ShieldAlert, LogOut,
  Calendar
} from 'lucide-react';

export default function PsicologoPerfilView({ profile, onProfileUpdated, user, isVirtualDemo, onLogout }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const [googleConnected, setGoogleConnected] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(null);

  const [workingDays, setWorkingDays] = useState(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
  const [showDetailedHours, setShowDetailedHours] = useState(true);
  const [showFreeDays, setShowFreeDays] = useState(true);
  const [blockedDates, setBlockedDates] = useState([]);
  
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-11
  
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const getDaysInMonthCount = () => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 0) {
        setCurrentYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => {
      if (prev === 11) {
        setCurrentYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };
  const [customSlots, setCustomSlots] = useState({
    'Lunes': ['10:00', '11:00'],
    'Martes': ['16:00'],
    'Miércoles': ['17:00'],
    'Jueves': ['11:00'],
    'Viernes': ['15:00']
  });

  useEffect(() => {
    const loadPsychologistProfile = async () => {
      if (!user?.id || isVirtualDemo) return;
      try {
        const { data, error } = await supabase
          .from('psychologist_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          if (data.availability) {
            try {
              const avail = typeof data.availability === 'string' ? JSON.parse(data.availability) : data.availability;
              if (avail.working_days) setWorkingDays(avail.working_days);
              if (avail.show_detailed_hours !== undefined) setShowDetailedHours(avail.show_detailed_hours);
              if (avail.show_free_days !== undefined) setShowFreeDays(avail.show_free_days);
              if (avail.blocked_dates) setBlockedDates(avail.blocked_dates);
              if (avail.custom_available_slots) setCustomSlots(avail.custom_available_slots);
              if (avail.google_connected !== undefined) setGoogleConnected(avail.google_connected);
              if (avail.device_connected !== undefined) setDeviceConnected(avail.device_connected);
            } catch (e) {
              console.error("Error parsing availability JSON:", e);
            }
          }
          if (data.session_price) setPriceInput(Number(data.session_price));
          if (data.name) setNameInput(data.name);
          if (data.license_number) setLicenseInput(data.license_number);
          if (data.image_url) setAvatarUrl(data.image_url);
          if (data.bio) setBioInput(data.bio);
          if (data.approach) setApproachInput(data.approach);
          if (data.specialties) {
            setSpecialtiesInput(Array.isArray(data.specialties) ? data.specialties.join(', ') : data.specialties);
          }
        }
      } catch (err) {
        console.error("Error loading psychologist profile:", err.message);
      }
    };
    loadPsychologistProfile();
  }, [user?.id]);

  // Datos del perfil y contexto
  const context = profile?.contexto_terapeutico || {};
  const appConfig = profile?.app_config || {};
  
  const currentName = context.name || profile?.display_name || 'Dr. José Fernández';
  const currentAvatar = profile?.avatar || context.avatar || 'https://lh3.googleusercontent.com/a/ACg8ocKTiCRCGtON7UckYXir1hkqxQPP9jHgd0A8aQx3mqswe2yNcA=s96-c';
  const currentLicense = appConfig.license_number || context.licenseNumber || 'M-49ccc';
  const currentQualification = appConfig.qualification || 'Especialista Clínico Sanitario';
  const currentInsurance = appConfig.rc_insurance || 'Seguro RC Activo (Mapfre)';
  const currentPrice = context.sessionPrice || appConfig.session_price || 55;

  const [nameInput, setNameInput] = useState(currentName);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar);
  const [licenseInput, setLicenseInput] = useState(currentLicense);
  const [qualificationInput, setQualificationInput] = useState(currentQualification);
  const [insuranceInput, setInsuranceInput] = useState(currentInsurance);
  const [priceInput, setPriceInput] = useState(currentPrice);
  const [bioInput, setBioInput] = useState('Especialista en regulación emocional, estrés, ansiedad y protocolos cognitivo-conductuales con monitorización digital.');
  const [specialtiesInput, setSpecialtiesInput] = useState('Ansiedad, Estrés, Terapia Cognitiva, EMDR');
  const [approachInput, setApproachInput] = useState('Terapia Cognitivo-Conductual & Regulación Emocional');

  // Lista de avatares predefinidos para psicólogos
  const PRESET_AVATARS = [
    { label: 'Google Profile', url: user?.user_metadata?.avatar_url || user?.photoURL || 'https://lh3.googleusercontent.com/a/ACg8ocKTiCRCGtON7UckYXir1hkqxQPP9jHgd0A8aQx3mqswe2yNcA=s96-c' },
    { label: 'José (Clínico)', url: 'https://lh3.googleusercontent.com/a/ACg8ocKTiCRCGtON7UckYXir1hkqxQPP9jHgd0A8aQx3mqswe2yNcA=s96-c' },
    { label: 'Profesional 1', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=150&h=150' },
    { label: 'Profesional 2', url: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=150&h=150' }
  ];

  // Historial de liquidaciones Stripe Connect mockeados
  const payoutHistory = [
    { id: 'po_1Nf8x9L2x9o4', date: '01/06/2026', concept: 'Liquidación Mensual Stripe Connect - Consultas Clínicas', method: 'Stripe Split', amount: '345.00 €', status: 'completed' },
    { id: 'po_1Me9u2P1x8p9', date: '01/05/2026', concept: 'Liquidación Mensual Stripe Connect - Consultas Clínicas', method: 'Stripe Split', amount: '412.50 €', status: 'completed' }
  ];

  const handleToggleSync = async (type) => {
    const nextState = type === 'google' ? !googleConnected : !deviceConnected;
    setIsSyncing(type);
    try {
      const availabilityObj = {
        working_days: workingDays,
        show_detailed_hours: showDetailedHours,
        show_free_days: showFreeDays,
        blocked_dates: blockedDates,
        custom_available_slots: customSlots,
        google_connected: type === 'google' ? nextState : googleConnected,
        device_connected: type === 'device' ? nextState : deviceConnected
      };

      if (isVirtualDemo) {
        if (type === 'google') {
          setGoogleConnected(nextState);
          localStorage.setItem(`calendar_sync_google_${user?.id}`, String(nextState));
        } else {
          setDeviceConnected(nextState);
          localStorage.setItem(`calendar_sync_device_${user?.id}`, String(nextState));
        }
        return;
      }
      
      const { error } = await supabase
        .from('psychologist_profiles')
        .update({
          availability: JSON.stringify(availabilityObj)
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      if (type === 'google') {
        setGoogleConnected(nextState);
        localStorage.setItem(`calendar_sync_google_${user?.id}`, String(nextState));
      } else {
        setDeviceConnected(nextState);
        localStorage.setItem(`calendar_sync_device_${user?.id}`, String(nextState));
      }
    } catch (err) {
      console.error("Error updating calendar sync in Supabase:", err.message);
      alert("Error al guardar la sincronización: " + err.message);
    } finally {
      setIsSyncing(null);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveStatus('');
    try {
      const newContext = {
        ...context,
        fullName: nameInput,
        name: nameInput,
        displayName: nameInput.split(' ')[0],
        avatar: avatarUrl,
        sessionPrice: Number(priceInput),
        licenseNumber: licenseInput
      };

      const newAppConfig = {
        ...appConfig,
        license_number: licenseInput,
        qualification: qualificationInput,
        rc_insurance: insuranceInput,
        session_price: Number(priceInput)
      };

      if (isVirtualDemo) {
        if (onProfileUpdated) {
          onProfileUpdated({
            ...profile,
            avatar: avatarUrl,
            display_name: nameInput.split(' ')[0],
            contexto_terapeutico: newContext,
            app_config: newAppConfig
          });
        }
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }

      // En modo real, actualizamos Supabase profiles
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          avatar: avatarUrl,
          display_name: nameInput.split(' ')[0],
          contexto_terapeutico: newContext,
          app_config: newAppConfig
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Guardar también en la tabla psychologist_profiles
      const availabilityObj = {
        working_days: workingDays,
        show_detailed_hours: showDetailedHours,
        show_free_days: showFreeDays,
        blocked_dates: blockedDates,
        custom_available_slots: customSlots,
        google_connected: googleConnected,
        device_connected: deviceConnected
      };

      const specsArray = specialtiesInput.split(',').map(s => s.trim()).filter(Boolean);

      const { error: psychoProfileError } = await supabase
        .from('psychologist_profiles')
        .update({
          name: nameInput,
          session_price: Number(priceInput),
          license_number: licenseInput,
          image_url: avatarUrl,
          bio: bioInput,
          approach: approachInput,
          specialties: specsArray,
          availability: JSON.stringify(availabilityObj)
        })
        .eq('id', user.id);

      if (psychoProfileError) throw psychoProfileError;
      
      if (onProfileUpdated) {
        onProfileUpdated(data);
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error("Error saving psychologist profile data:", err.message);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
      
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Mi Perfil de Terapeuta</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Gestiona tu información pública colegiada, tarifas de consulta y vinculación con la pasarela de pagos.
          </p>
        </div>
        
        {saveStatus === 'success' && (
          <span style={{ fontSize: '0.72rem', color: 'var(--color-emerald)', fontWeight: 600 }}>✓ Cambios guardados con éxito</span>
        )}
        {saveStatus === 'error' && (
          <span style={{ fontSize: '0.72rem', color: 'var(--color-rose)', fontWeight: 600 }}>✗ Error al guardar el perfil</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }} className="grid-responsive-detail">
        
        {/* Columna Izquierda: Formulario de Perfil Clínico */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={16} color="var(--color-cyan)" />
              Datos Profesionales y Colegiatura
            </h3>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative' }}>
                <img 
                  src={avatarUrl} 
                  alt={nameInput} 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-cyan)', boxShadow: '0 0 12px rgba(6,182,212,0.15)' }} 
                />
              </div>

              {/* Presets de avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Foto Profesional</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%', 
                        overflow: 'hidden', 
                        border: avatarUrl === preset.url ? '2px solid var(--color-cyan)' : '1px solid var(--border)',
                        cursor: 'pointer',
                        padding: 0
                      }}
                      title={preset.label}
                    >
                      <img src={preset.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="preset" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Campos del formulario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Nombre Completo (Ej. Dr. o Dra.)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{ height: '36px', fontSize: '0.78rem', paddingLeft: '12px' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Email Clínico (No editable)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} color="var(--text-tertiary)" style={{ position: 'absolute', left: '10px', top: '11px' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={user?.email || 'usajosefernan@gmail.com'}
                    style={{ height: '36px', fontSize: '0.78rem', paddingLeft: '32px', background: 'rgba(0,0,0,0.15)', color: 'var(--text-tertiary)' }}
                    disabled 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Nº de Colegiado</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={licenseInput}
                    onChange={(e) => setLicenseInput(e.target.value)}
                    style={{ height: '36px', fontSize: '0.78rem', paddingLeft: '12px' }}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Precio Consulta (50 min)</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={priceInput}
                      onChange={(e) => setPriceInput(e.target.value)}
                      style={{ height: '36px', fontSize: '0.78rem', paddingLeft: '12px', paddingRight: '24px' }}
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '9px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>€</span>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Cualificación / Especialidad</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={qualificationInput}
                  onChange={(e) => setQualificationInput(e.target.value)}
                  style={{ height: '36px', fontSize: '0.78rem', paddingLeft: '12px' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Seguro Responsabilidad Civil (Axa/Mapfre/etc.)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={insuranceInput}
                  onChange={(e) => setInsuranceInput(e.target.value)}
                  style={{ height: '36px', fontSize: '0.78rem', paddingLeft: '12px' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Enfoque Clínico Principal</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={approachInput}
                  onChange={(e) => setApproachInput(e.target.value)}
                  placeholder="Ej. Terapia Cognitivo-Conductual, EMDR, ACT..."
                  style={{ height: '36px', fontSize: '0.78rem', paddingLeft: '12px' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Especialidades (separadas por comas)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={specialtiesInput}
                  onChange={(e) => setSpecialtiesInput(e.target.value)}
                  placeholder="Ansiedad, Estrés, Trauma, Duelo..."
                  style={{ height: '36px', fontSize: '0.78rem', paddingLeft: '12px' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Biografía Profesional & Presentación</label>
                <textarea 
                  className="form-input" 
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value)}
                  rows={3}
                  placeholder="Describe tu trayectoria, metodología clínica y qué encontrará el paciente en tu consulta..."
                  style={{ fontSize: '0.75rem', padding: '8px 12px', minHeight: '68px', resize: 'vertical' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Foto URL Personalizada</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  style={{ height: '36px', fontSize: '0.72rem', paddingLeft: '12px' }}
                />
              </div>
            </div>

            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="btn btn-cyan"
              style={{ height: '38px', fontSize: '0.78rem', fontWeight: 'bold', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '6px' }}
            >
              {isSaving ? <Clock size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              <span>{isSaving ? 'Guardando...' : 'Guardar Perfil Profesional'}</span>
            </button>
          </div>

          {/* Configuración de Agenda y Disponibilidad */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} color="var(--color-cyan)" />
              Configuración de Agenda y Disponibilidad
            </h3>

            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, textAlign: 'left' }}>
              Define tus días laborables. Los días desmarcados se mostrarán automáticamente en la app del paciente como <strong>Días Libres</strong> (bloqueados para agendar).
            </p>

            {/* Días laborables checkboxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'left' }}>Días de Consulta Activos</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => {
                  const isChecked = workingDays.includes(day);
                  return (
                    <label key={day} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: isChecked ? 'rgba(6,182,212,0.08)' : 'rgba(255,255,255,0.01)',
                      border: '1px solid',
                      borderColor: isChecked ? 'rgba(6,182,212,0.3)' : 'var(--border)',
                      fontSize: '0.72rem',
                      color: isChecked ? '#ffffff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          let updated;
                          if (isChecked) {
                            updated = workingDays.filter(d => d !== day);
                          } else {
                            updated = [...workingDays, day];
                          }
                          setWorkingDays(updated);
                          localStorage.setItem(`therapist_working_days_${user?.id}`, JSON.stringify(updated));
                        }}
                        style={{ accentColor: 'var(--color-cyan)' }}
                      />
                      {day}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Qué mostrar en la app del paciente */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'left' }}>Visibilidad en la App del Paciente</span>
              
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: '#ffffff', cursor: 'pointer' }}>
                <span>Mostrar horas exactas disponibles de mi agenda</span>
                <input
                  type="checkbox"
                  checked={showDetailedHours}
                  onChange={(e) => {
                    setShowDetailedHours(e.target.checked);
                    localStorage.setItem(`therapist_show_hours_${user?.id}`, String(e.target.checked));
                  }}
                  style={{ accentColor: 'var(--color-cyan)', width: '16px', height: '16px' }}
                />
              </label>

              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.74rem', color: '#ffffff', cursor: 'pointer' }}>
                <span>Destacar visualmente mis días libres / vacaciones</span>
                <input
                  type="checkbox"
                  checked={showFreeDays}
                  onChange={(e) => {
                    setShowFreeDays(e.target.checked);
                    localStorage.setItem(`therapist_show_free_days_${user?.id}`, String(e.target.checked));
                  }}
                  style={{ accentColor: 'var(--color-cyan)', width: '16px', height: '16px' }}
                />
              </label>
            </div>

            {/* Calendario mensual interactivo de días libres */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Excepciones y Días Libres ({monthNames[currentMonth]} {currentYear})</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button type="button" onClick={handlePrevMonth} style={{ color: '#ffffff', cursor: 'pointer', background: 'transparent', border: 'none', fontSize: '0.75rem' }}>◀</button>
                  <button type="button" onClick={handleNextMonth} style={{ color: '#ffffff', cursor: 'pointer', background: 'transparent', border: 'none', fontSize: '0.75rem' }}>▶</button>
                </div>
              </div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'left', lineHeight: 1.35 }}>
                Haz clic en cualquier día para marcarlo como <strong>Día Libre / Vacación</strong> (excepción de tu horario laboral).
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBlock: '8px 4px' }}>
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                  <span key={d} style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-tertiary)' }}>{d}</span>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                {/* Celdas vacías de desfase */}
                {Array.from({ length: (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7 }).map((_, idx) => (
                  <div key={`empty-${idx}`} />
                ))}

                {Array.from({ length: getDaysInMonthCount() }, (_, i) => i + 1).map(day => {
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${day < 10 ? '0' + day : day}`;
                  const isBlocked = blockedDates.includes(dateStr);
                  
                  // Día de la semana
                  const dateObj = new Date(currentYear, currentMonth, day);
                  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                  const dayName = dayNames[dateObj.getDay()];
                  const isWorking = workingDays.includes(dayName);

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        if (isBlocked) {
                          setBlockedDates(blockedDates.filter(d => d !== dateStr));
                        } else {
                          setBlockedDates([...blockedDates, dateStr]);
                        }
                      }}
                      style={{
                        height: '28px',
                        borderRadius: '50%',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: isBlocked ? 'rgba(244, 63, 94, 0.15)' : (isWorking ? 'rgba(6, 182, 212, 0.08)' : 'rgba(255, 255, 255, 0.02)'),
                        color: isBlocked ? 'var(--color-rose)' : (isWorking ? '#ffffff' : 'var(--text-secondary)'),
                        border: isBlocked ? '1px solid var(--color-rose)' : '1px solid transparent',
                        textDecoration: isBlocked ? 'line-through' : 'none'
                      }}
                      title={isBlocked ? "Día Libre / Bloqueado (Clic para activar)" : (isWorking ? "Disponible (Clic para bloquear)" : "Día no laborable (Clic para bloquear)")}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Importador de ICS móvil */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)', borderRadius: '8px', padding: '12px' }}>
                <span style={{ fontSize: '0.65rem', color: '#ffffff', fontWeight: 600, textAlign: 'left' }}>Sincronización Fácil con Móvil (.ics)</span>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'left', lineHeight: 1.35 }}>
                  Exporta un archivo <strong>.ics</strong> desde tu Google Calendar, Android o iPhone y súbelo para bloquear automáticamente esos días.
                </p>
                <input 
                  type="file" 
                  accept=".ics"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      const text = event.target.result;
                      const lines = text.split(/\r?\n/);
                      const parsedDates = [];
                      for (let line of lines) {
                        if (line.startsWith('DTSTART')) {
                          const match = line.match(/:(\d{8})/);
                          const matchAlt = line.match(/VALUE=DATE:(\d{8})/);
                          const dateStr = match ? match[1] : (matchAlt ? matchAlt[1] : null);
                          if (dateStr) {
                            const year = dateStr.substring(0, 4);
                            const month = dateStr.substring(4, 6);
                            const day = dateStr.substring(6, 8);
                            // Bloquear fechas del año actual o futuro
                            if (Number(year) >= new Date().getFullYear()) {
                              const formatted = `${year}-${month}-${day}`;
                              if (!parsedDates.includes(formatted)) {
                                parsedDates.push(formatted);
                              }
                            }
                          }
                        }
                      }
                      if (parsedDates.length > 0) {
                        // Agregar las nuevas fechas sin duplicados
                        const newBlocked = [...new Set([...blockedDates, ...parsedDates])];
                        setBlockedDates(newBlocked);
                        alert(`¡Sincronización exitosa! Se han bloqueado ${parsedDates.length} días ocupados importados de tu móvil.`);
                      } else {
                        alert("No se encontraron eventos válidos y futuros en el archivo .ics.");
                      }
                    };
                    reader.readAsText(file);
                  }}
                  style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '4px' }}
                />
              </div>
            </div>
          </div>

          {/* Sincronización de Calendario */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', marginTop: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} color="var(--color-cyan)" />
              Sincronización con Google & Dispositivos
            </h3>

            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, textAlign: 'left' }}>
              Sincroniza tus citas clínicas síncronas de Áncora de manera bidireccional con tu cuenta de Google Calendar, Android o tu iPhone.
            </p>
            <div style={{ background: 'rgba(6,182,212,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(6,182,212,0.1)', fontSize: '0.68rem', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: 1.35 }}>
              ⚠️ <strong>Nota clínica:</strong> Las revisiones semanales terapéuticas son actividades de diario asíncronas internas y no se sincronizan a calendarios externos. Únicamente se sincronizan las sesiones síncronas individuales programadas.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Google Calendar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: googleConnected ? 'var(--color-emerald)' : 'rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 600 }}>Google Calendar</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSync('google')}
                  className={`btn ${googleConnected ? 'btn-outline' : 'btn-cyan'}`}
                  style={{ height: '28px', fontSize: '0.68rem', paddingInline: '12px' }}
                  disabled={isSyncing !== null}
                >
                  {isSyncing === 'google' ? 'Sincronizando...' : (googleConnected ? 'Desconectar' : 'Sincronizar')}
                </button>
              </div>

              {/* Apple / Android Calendar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: deviceConnected ? 'var(--color-emerald)' : 'rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 600 }}>Calendario del Dispositivo (iOS / Android)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleSync('device')}
                  className={`btn ${deviceConnected ? 'btn-outline' : 'btn-cyan'}`}
                  style={{ height: '28px', fontSize: '0.68rem', paddingInline: '12px' }}
                  disabled={isSyncing !== null}
                >
                  {isSyncing === 'device' ? 'Sincronizando...' : (deviceConnected ? 'Desconectar' : 'Sincronizar')}
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={onLogout}
            style={{
              borderColor: 'hsla(var(--rose), 0.3)',
              color: 'var(--color-rose)',
              height: '38px',
              fontSize: '0.78rem',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(244, 63, 94, 0.02)'
            }}
          >
            <LogOut size={14} />
            <span>Cerrar Sesión</span>
          </button>

        </div>

        {/* Columna Derecha: Stripe Connect y Liquidaciones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tarjeta de Stripe Connect */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '4px solid var(--color-cyan)', background: 'rgba(6,182,212,0.02)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={16} color="var(--color-cyan)" />
              Pasarela de Pagos Stripe Connect
            </h3>

            <div>
              <strong style={{ fontSize: '1.05rem', color: '#ffffff', display: 'block' }}>
                Cuenta Conectada (Stripe Split)
              </strong>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                Tus honorarios clínicos se ingresan directamente exentos de IVA. Áncora solo recauda automáticamente su cuota de servicio.
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>ID Stripe Account:</span>
              <strong style={{ fontSize: '0.82rem', color: 'var(--color-cyan)', fontFamily: 'monospace' }}>
                acct_1Mv8x9L2x9o4
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              <span>Estado de verificación:</span>
              <strong style={{ color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} />
                Vinculado y Verificado
              </strong>
            </div>
          </div>

          {/* Liquidaciones Recientes */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="var(--color-emerald)" />
              Liquidaciones de Honorarios
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {payoutHistory.map((invoice, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '12px', 
                    borderRadius: '8px', 
                    background: 'var(--background-secondary)', 
                    border: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <FileText size={16} color="var(--color-cyan)" style={{ flexShrink: 0 }} />
                    <div style={{ textAlign: 'left' }}>
                      <strong style={{ fontSize: '0.74rem', color: '#ffffff', display: 'block', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {invoice.concept}
                      </strong>
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                        Fecha: {invoice.date} · {invoice.method}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.78rem', color: 'var(--color-emerald)' }}>{invoice.amount}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
