import { useState } from 'react';
import { firebaseClient as db, firebaseClient } from '../firebaseAdapter.js';
import { isOwnerUser } from '../appConfig';
import { Settings, User, LogOut, Mail, Phone, Lock, CreditCard, Calculator, FileText, Check, AlertCircle, Sparkles } from 'lucide-react';

export default function AjustesView({ user, profile, onLogout, onProfileUpdated }) {
  const owner = isOwnerUser(user);
  
  // Tabs principales
  const [activeSubTab, setActiveSubTab] = useState('perfil'); // 'perfil' | 'suscripcion'

  // Estados del perfil
  const [displayName, setDisplayName] = useState(profile?.app_config?.display_name || '');
  const [defaultStartTab, setDefaultStartTab] = useState(profile?.app_config?.default_start_tab || 'dashboard');
  const [compactMode, setCompactMode] = useState(profile?.app_config?.compact_mode ?? false);
  const [accountEmail, setAccountEmail] = useState(user?.email || '');
  const [mobilePhone, setMobilePhone] = useState(profile?.app_config?.mobile_phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  // Estados del simulador de Stripe Connect Split
  const [triagePaid, setTriagePaid] = useState(profile?.app_config?.onboarding_paid ?? false);
  const [splitTotal, setSplitTotal] = useState(99); // Valor inicial 99€
  const [splitSaaSPercent, setSplitSaaSPercent] = useState(40); // 40% para la plataforma por defecto

  // Estados del modal de facturas
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Evitar desincronización de props del perfil
  const [prevProfile, setPrevProfile] = useState(profile);
  if (profile && (profile.id !== prevProfile?.id || profile?.app_config?.display_name !== prevProfile?.app_config?.display_name || profile?.app_config?.default_start_tab !== prevProfile?.app_config?.default_start_tab || profile?.app_config?.compact_mode !== prevProfile?.app_config?.compact_mode || profile?.app_config?.onboarding_paid !== prevProfile?.app_config?.onboarding_paid)) {
    setPrevProfile(profile);
    setDisplayName(profile?.app_config?.display_name || '');
    setDefaultStartTab(profile?.app_config?.default_start_tab || 'dashboard');
    setCompactMode(profile?.app_config?.compact_mode ?? false);
    setAccountEmail(user?.email || '');
    setMobilePhone(profile?.app_config?.mobile_phone || '');
    setTriagePaid(profile?.app_config?.onboarding_paid ?? false);
  }

  const handleLogoutClick = async () => {
    try {
      const { error } = await db.auth.signOut();
      if (error) throw error;
      onLogout();
    } catch (e) {
      console.error('Logout error:', e.message);
    }
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      if (newPassword || confirmPassword) {
        if (newPassword.length < 8) {
          throw new Error('La nueva contraseña debe tener al menos 8 caracteres.');
        }
        if (newPassword !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden.');
        }
      }

      const authUpdates = {};
      if (accountEmail.trim() && accountEmail.trim().toLowerCase() !== user?.email?.toLowerCase()) {
        authUpdates.email = accountEmail.trim();
      }
      if (newPassword) {
        authUpdates.password = newPassword;
      }
      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await db.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }

      const nextConfig = {
        ...(profile?.app_config || {}),
        display_name: displayName.trim(),
        default_start_tab: defaultStartTab,
        compact_mode: compactMode,
        mobile_phone: mobilePhone.trim()
      };

      const { error: profileError } = await firebaseClient
        .from('profiles')
        .upsert({
          id: user.id,
          role: profile?.role || 'paciente',
          app_config: nextConfig,
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      setNewPassword('');
      setConfirmPassword('');
      setMsg({
        type: 'success',
        text: authUpdates.email
          ? 'Perfil guardado. Se ha enviado un correo para verificar el nuevo email.'
          : 'Perfil guardado correctamente.'
      });
      onProfileUpdated?.({ ...profile, app_config: nextConfig });
    } catch (err) {
      console.error('Error saving account:', err.message);
      setMsg({ type: 'error', text: 'Error al guardar perfil: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  // Cálculos matemáticos del simulador de split
  const saasGross = (splitTotal * (splitSaaSPercent / 100));
  const clinicGross = splitTotal - saasGross;

  // El software SaaS está sujeto a un 21% de IVA en España
  // saasGross = saasBase * 1.21 => saasBase = saasGross / 1.21
  const saasBase = saasGross / 1.21;
  const saasIva = saasGross - saasBase;

  // La consulta médica está exenta de IVA según el Art. 20.Uno.3 LIVA
  const clinicBase = clinicGross;
  const clinicIva = 0;

  // Comisión de Stripe Connect (1.5% + 0.25€) sobre el total cobrado
  const stripeFee = (splitTotal * 0.015) + 0.25;
  // La plataforma absorbe la comisión de Stripe, quedando el neto final para la plataforma
  const saasNet = saasGross - stripeFee;

  // Facturas simuladas predefinidas
  const mockInvoices = [
    {
      id: 'FAC-2026-004',
      date: '2026-06-05',
      concept: 'Mensualidad Plan Esencial',
      total: 69.00,
      saasPart: 35.09, // SaaS: 29€ + 21% IVA
      clinicPart: 33.91,
      psicologo: 'Dra. Lucía Gómez García',
      colegiado: 'COP-M-31415'
    }
  ];

  if (triagePaid) {
    mockInvoices.push({
      id: 'FAC-2026-003',
      date: '2026-06-01',
      concept: 'Onboarding Clínico y Diagnóstico',
      total: 49.00,
      saasPart: 18.15, // SaaS: 15€ + 21% IVA
      clinicPart: 30.85,
      psicologo: 'Ánquer IA & Dr. José Fernández',
      colegiado: 'COP-M-49ccc'
    });
  }

  return (
    <div className="view-content-limit" style={{ paddingBottom: '40px' }}>
      <div className="glass-panel" style={{ padding: '28px', position: 'relative', overflow: 'hidden' }}>
        
        {/* Encabezado Principal */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
              <Settings size={22} color="var(--color-emerald)" />
              Ajustes de ÁNCORA
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Configuración de tu espacio clínico, visualización de planes de suscripción y facturación.
            </p>
          </div>
          
          <button type="button" className="btn btn-outline" onClick={handleLogoutClick} style={{ borderColor: 'hsla(var(--rose), 0.3)', color: 'var(--color-rose)', height: '38px', fontSize: '0.78rem' }}>
            <LogOut size={14} style={{ marginRight: '6px' }} />
            Cerrar sesión
          </button>
        </div>

        {/* Selector de sub-pestañas */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', marginBottom: '24px', paddingBottom: '10px' }}>
          <button 
            onClick={() => setActiveSubTab('perfil')} 
            className={`btn ${activeSubTab === 'perfil' ? 'btn-emerald' : 'btn-outline'}`} 
            style={{ height: '36px', fontSize: '0.78rem', borderRadius: '6px', border: activeSubTab === 'perfil' ? 'none' : '1px solid var(--border)' }}
          >
            <User size={15} style={{ marginRight: '6px' }} /> 
            Mi Perfil
          </button>
          <button 
            onClick={() => setActiveSubTab('suscripcion')} 
            className={`btn ${activeSubTab === 'suscripcion' ? 'btn-emerald' : 'btn-outline'}`} 
            style={{ height: '36px', fontSize: '0.78rem', borderRadius: '6px', border: activeSubTab === 'suscripcion' ? 'none' : '1px solid var(--border)' }}
          >
            <CreditCard size={15} style={{ marginRight: '6px' }} /> 
            Suscripción y Finanzas
          </button>
        </div>

        {/* Mensajes de feedback */}
        {msg && (
          <div className="flex-center" style={{
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            background: msg.type === 'success' ? 'hsla(var(--emerald), 0.08)' : 'hsla(var(--rose), 0.08)',
            border: `1px solid ${msg.type === 'success' ? 'hsla(var(--emerald), 0.2)' : 'hsla(var(--rose), 0.2)'}`,
            color: msg.type === 'success' ? 'var(--color-emerald)' : 'var(--color-rose)',
            fontSize: '0.8rem',
            marginBottom: '20px',
            gap: '8px'
          }}>
            <span>{msg.text}</span>
          </div>
        )}

        {/* PESTAÑA 1: MI PERFIL */}
        {activeSubTab === 'perfil' && (
          <div className="grid-2" style={{ gap: '30px' }}>
            {/* Formulario de perfil */}
            <form onSubmit={handleSaveAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px', marginBottom: '8px' }}>
                Datos de Acceso y Perfil
              </h4>

              <div className="form-group">
                <label className="form-label">Nombre del Paciente</label>
                <input type="text" className="form-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tu nombre" />
              </div>

              <div className="form-group">
                <label className="form-label">Correo Electrónico</label>
                <input type="email" className="form-input" value={accountEmail} onChange={(e) => setAccountEmail(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Teléfono Móvil</label>
                <input type="tel" className="form-input" value={mobilePhone} onChange={(e) => setMobilePhone(e.target.value)} placeholder="+34 ..." />
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Nueva Contraseña</label>
                  <input type="password" className="form-input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirmar Contraseña</label>
                  <input type="password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repetir" autoComplete="new-password" />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Sección de Inicio</label>
                <select className="form-input" value={defaultStartTab} onChange={(e) => setDefaultStartTab(e.target.value)}>
                  <option value="dashboard">Panel de Control</option>
                  <option value="mente">Contexto Terapéutico</option>
                  <option value="chat">Chat con Ánquer</option>
                  <option value="diary">Diario Personal</option>
                  <option value="documents">Mis Documentos</option>
                </select>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', marginTop: '4px' }}>
                <input type="checkbox" checked={compactMode} onChange={() => setCompactMode(!compactMode)} />
                Modo de visualización compacta
              </label>

              <button type="submit" className="btn btn-emerald" disabled={loading} style={{ height: '42px', width: '100%', marginTop: '10px' }}>
                {loading ? 'Guardando...' : 'Actualizar Perfil'}
              </button>
            </form>

            {/* Panel de detalles laterales del Perfil */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                Seguridad & RLS
              </h4>
              
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Toda la información del perfil y del contexto clínico está blindada por las políticas de seguridad a nivel de fila (**Row Level Security**) en la base de datos de Áncora. Nadie excepto tú y tu terapeuta asignado puede acceder a estos datos.
              </p>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Identificador de Usuario (UUID)
                </span>
                <code style={{ fontSize: '0.68rem', color: 'var(--color-cyan)', wordBreak: 'break-all' }}>{user?.id}</code>
                
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginTop: '12px', marginBottom: '4px' }}>
                  Rol en Plataforma
                </span>
                <span className={`badge ${owner ? 'badge-cyan' : 'badge-emerald'}`} style={{ display: 'inline-block' }}>
                  {owner ? 'Administrador' : 'Paciente Clinica'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: SUSCRIPCIÓN Y FINANZAS */}
        {activeSubTab === 'suscripcion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* 1. ESTADO DE LA SUSCRIPCIÓN */}
            <div style={{ 
              background: triagePaid ? 'rgba(16, 185, 129, 0.03)' : 'rgba(245, 158, 11, 0.03)', 
              border: `1px solid ${triagePaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
              padding: '20px', 
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div className="flex-center" style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: triagePaid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  color: triagePaid ? 'var(--color-emerald)' : 'var(--color-amber)'
                }}>
                  <CreditCard size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {triagePaid ? 'Suscripción Activa — Plan Esencial (Simulado)' : 'Onboarding y Triaje Completado'}
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', margin: 0 }}>
                    {triagePaid 
                      ? 'Tu plan está activo. Próxima factura consolidada el 05/07/2026 por 69,00 €.' 
                      : 'Tu triaje es apto. Por favor, efectúa el pago de 49€ en el Dashboard para activar las revisiones clínicas.'}
                  </p>
                </div>
              </div>
              
              <span className={`badge ${triagePaid ? 'badge-emerald' : 'badge-amber'}`} style={{ padding: '6px 12px', fontSize: '0.72rem' }}>
                {triagePaid ? 'Activo' : 'Pendiente de Pago'}
              </span>
            </div>

            {/* 2. TARIFAS Y PLANES DE ÁNCORA */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--color-emerald)" />
                Planes Mensuales Consolidados
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Todos los planes dividen automáticamente el cobro en origen. Sin IVA en los honorarios médicos.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                
                {/* Plan Esencial */}
                <div style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '10px', 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}>
                  {triagePaid && (
                    <span style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(16,185,129,0.1)', color: 'var(--color-emerald)', fontSize: '0.6rem', padding: '3px 8px', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 'bold' }}>
                      Plan Actual
                    </span>
                  )}
                  <div>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#ffffff', margin: '0 0 4px 0' }}>Plan Esencial</h5>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>Para un seguimiento básico y continuado.</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff' }}>69€</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>/ mes</span>
                    </div>
                    
                    <ul style={{ paddingLeft: '16px', margin: '0 0 20px 0', fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <li><strong>SaaS Paciente (29€/mes + IVA)</strong></li>
                      <li>Diario IA Clínico</li>
                      <li><strong>1 Consulta</strong> mensual con psicólogo</li>
                      <li>Historia clínica portable</li>
                    </ul>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SaaS (21% IVA):</span>
                      <span style={{ color: '#ffffff' }}>35,09 €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span>Médico (Exento):</span>
                      <span style={{ color: '#ffffff' }}>33,91 €</span>
                    </div>
                  </div>
                </div>

                {/* Plan Intermedio */}
                <div style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '10px', 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#ffffff', margin: '0 0 4px 0' }}>Plan Intermedio</h5>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>Recomendado para casos de ansiedad moderada.</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff' }}>99€</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>/ mes</span>
                    </div>
                    
                    <ul style={{ paddingLeft: '16px', margin: '0 0 20px 0', fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <li><strong>SaaS Estándar (39€/mes + IVA)</strong></li>
                      <li>Diario IA con estadísticas</li>
                      <li><strong>1 Consulta</strong> con prioridad mensual</li>
                      <li>Revisiones asíncronas semanales</li>
                    </ul>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SaaS (21% IVA):</span>
                      <span style={{ color: '#ffffff' }}>47,19 €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span>Médico (Exento):</span>
                      <span style={{ color: '#ffffff' }}>51,81 €</span>
                    </div>
                  </div>
                </div>

                {/* Plan Intensivo */}
                <div style={{ 
                  background: 'rgba(255,255,255,0.02)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '10px', 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <h5 style={{ fontSize: '0.9rem', fontWeight: '800', color: '#ffffff', margin: '0 0 4px 0' }}>Plan Intensivo</h5>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>Tratamiento de alta frecuencia clínica.</p>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#ffffff' }}>159€</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>/ mes</span>
                    </div>
                    
                    <ul style={{ paddingLeft: '16px', margin: '0 0 20px 0', fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <li><strong>SaaS Estándar (39€/mes + IVA)</strong></li>
                      <li>Diario IA con estadísticas</li>
                      <li><strong>2 Consultas</strong> clínicas al mes</li>
                      <li>Copiloto Smart SOAP activo</li>
                    </ul>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SaaS (21% IVA):</span>
                      <span style={{ color: '#ffffff' }}>47,19 €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span>Médico (Exento):</span>
                      <span style={{ color: '#ffffff' }}>111,81 €</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. SIMULADOR INTERACTIVO DE STRIPE CONNECT SPLIT */}
            <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={18} color="var(--color-cyan)" />
                Simulador del Split Fiscal en Origen (Stripe Connect)
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.4 }}>
                Ajusta el importe total de cobro al paciente y la porción asignada a la plataforma. Observa cómo Stripe Connect divide la transacción y cómo se calculan el IVA y la comisión.
              </p>

              <div className="grid-2" style={{ gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Cobro Total al Paciente</span>
                      <strong style={{ color: '#ffffff', fontSize: '1rem' }}>{splitTotal} €</strong>
                    </label>
                    <input 
                      type="range" 
                      min="40" 
                      max="300" 
                      step="5" 
                      value={splitTotal} 
                      onChange={(e) => setSplitTotal(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--color-cyan)', cursor: 'pointer' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Porcentaje de Plataforma (SaaS)</span>
                      <strong style={{ color: '#ffffff' }}>{splitSaaSPercent}% ({saasGross.toFixed(2)}€)</strong>
                    </label>
                    <input 
                      type="range" 
                      min="10" 
                      max="80" 
                      step="5" 
                      value={splitSaaSPercent} 
                      onChange={(e) => setSplitSaaSPercent(parseInt(e.target.value))}
                      style={{ width: '100%', accentColor: 'var(--color-cyan)', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Representación Gráfica del Split en barra */}
                  <div style={{ marginTop: '10px' }}>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Esquema visual del PaymentIntent Split</span>
                    <div style={{ display: 'flex', width: '100%', height: '14px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${100 - splitSaaSPercent}%`, background: 'var(--color-emerald)', transition: 'width 0.2s' }} title="Parte Clínica" />
                      <div style={{ width: `${splitSaaSPercent * (1 / 1.21)}%`, background: 'var(--color-cyan)', transition: 'width 0.2s' }} title="SaaS Base" />
                      <div style={{ width: `${splitSaaSPercent * (0.21 / 1.21)}%`, background: '#ec4899', transition: 'width 0.2s' }} title="SaaS 21% IVA" />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', background: 'var(--color-emerald)', borderRadius: '2px' }} />
                        Clínica ({100 - splitSaaSPercent}%)
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', background: 'var(--color-cyan)', borderRadius: '2px' }} />
                        SaaS Base
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', background: '#ec4899', borderRadius: '2px' }} />
                        IVA (21%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Desglose Matemático */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>DESTINATARIO</span>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>DESGLOSE FISCAL</span>
                  </div>
                  
                  {/* Fila Plataforma */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span style={{ color: 'var(--color-cyan)' }}>Ancora Clinic S.L. (SaaS)</span>
                      <span style={{ color: '#ffffff' }}>{saasGross.toFixed(2)} €</span>
                    </div>
                    <div style={{ paddingLeft: '10px', color: 'var(--text-secondary)', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• Base Imponible:</span>
                        <span>{saasBase.toFixed(2)} €</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• IVA 21%:</span>
                        <span>{saasIva.toFixed(2)} €</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-rose)' }}>
                        <span>• Stripe Fee absorbido:</span>
                        <span>-{stripeFee.toFixed(2)} €</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-emerald)', fontWeight: 600 }}>
                        <span>• Neto Plataforma:</span>
                        <span>{saasNet.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>

                  {/* Fila Psicólogo */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span style={{ color: 'var(--color-emerald)' }}>Psicólogo Colegiado (Consulta)</span>
                      <span style={{ color: '#ffffff' }}>{clinicGross.toFixed(2)} €</span>
                    </div>
                    <div style={{ paddingLeft: '10px', color: 'var(--text-secondary)', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• Base Imponible:</span>
                        <span>{clinicBase.toFixed(2)} €</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• IVA Repercutido:</span>
                        <span className="badge badge-emerald" style={{ fontSize: '0.55rem', padding: '1px 4px' }}>Exento (Art. 20.Uno.3 LIVA)</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-emerald)', fontWeight: 600 }}>
                        <span>• Neto Terapeuta:</span>
                        <span>{clinicGross.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. HISTORIAL DE FACTURACIÓN */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--color-emerald)" />
                Historial de Facturas Consolidadas
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Haz clic en cualquier factura para visualizar el desglose consolidado de facturas duales emitidas.
              </p>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '10px 8px' }}>ID Factura</th>
                      <th style={{ padding: '10px 8px' }}>Fecha</th>
                      <th style={{ padding: '10px 8px' }}>Concepto</th>
                      <th style={{ padding: '10px 8px' }}>Importe Total</th>
                      <th style={{ padding: '10px 8px', textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockInvoices.map((inv) => (
                      <tr key={inv.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)', hover: { background: 'rgba(255,255,255,0.01)' } }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600, color: '#ffffff' }}>{inv.id}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{inv.date}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>{inv.concept}</td>
                        <td style={{ padding: '12px 8px', fontWeight: 700, color: 'var(--color-emerald)' }}>{inv.total.toFixed(2)} €</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button 
                            onClick={() => setSelectedInvoice(inv)}
                            className="btn btn-outline" 
                            style={{ height: '28px', padding: '0 10px', fontSize: '0.68rem', borderRadius: '4px' }}
                          >
                            Ver Facturas Duales
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* MODAL DE PREVISUALIZACIÓN DE FACTURA DUAL */}
      {selectedInvoice && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--background-secondary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Previsualización de Facturación Dual Coherente
                </h4>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Stripe Connect divide el cobro en origen emitiendo dos facturas independientes.
                </p>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="btn btn-outline"
                style={{ height: '30px', padding: '0 12px', fontSize: '0.72rem' }}
              >
                Cerrar
              </button>
            </div>

            {/* Dos Facturas Lado a Lado */}
            <div className="grid-2" style={{ gap: '20px' }}>
              
              {/* FACTURA A: SAAS PLATAFORMA */}
              <div style={{ background: '#0e1117', border: '1px solid rgba(6, 182, 212, 0.2)', borderRadius: '8px', padding: '16px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--color-cyan)', fontSize: '0.8rem', display: 'block' }}>ANCORA CLINIC S.L.</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.6rem' }}>CIF: B-99887766</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', display: 'block' }}>Calle Serrano 45, Madrid</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 'bold', color: '#ffffff' }}>Factura SaaS</span>
                    <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Nº {selectedInvoice.id}-A</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Fecha:</span> <span style={{ color: '#ffffff' }}>{selectedInvoice.date}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Cliente:</span> <span style={{ color: '#ffffff' }}>{displayName || 'Usuario de Áncora'}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Email:</span> <span style={{ color: '#ffffff' }}>{user.email}</span></div>
                </div>

                {/* Tabla de Conceptos */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 0', marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>Concepto</span>
                    <span>Total</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Suscripción SaaS Licencia de Software & Uso de IA Local</span>
                    <span>{(selectedInvoice.saasPart / 1.21).toFixed(2)} €</span>
                  </div>
                </div>

                {/* Desglose Fiscal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignSelf: 'flex-end', width: '150px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Base Imponible:</span>
                    <span>{(selectedInvoice.saasPart / 1.21).toFixed(2)} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>IVA (21%):</span>
                    <span>{(selectedInvoice.saasPart - (selectedInvoice.saasPart / 1.21)).toFixed(2)} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', fontWeight: 'bold', color: 'var(--color-cyan)' }}>
                    <span>Total Factura:</span>
                    <span>{selectedInvoice.saasPart.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              {/* FACTURA B: SERVICIOS CLÍNICOS */}
              <div style={{ background: '#0e1117', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '16px', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span style={{ fontWeight: 800, color: 'var(--color-emerald)', fontSize: '0.8rem', display: 'block' }}>{selectedInvoice.psicologo}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.6rem' }}>Colegiado: {selectedInvoice.colegiado}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.6rem', display: 'block' }}>NIF/NIE: 44332211-X</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontWeight: 'bold', color: '#ffffff' }}>Factura Médica</span>
                    <span style={{ display: 'block', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Nº {selectedInvoice.id}-B</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Fecha:</span> <span style={{ color: '#ffffff' }}>{selectedInvoice.date}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Cliente:</span> <span style={{ color: '#ffffff' }}>{displayName || 'Usuario de Áncora'}</span></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>NIF:</span> <span style={{ color: '#ffffff' }}>{profile?.app_config?.mobile_phone ? 'Provisto en ficha' : 'No provisto'}</span></div>
                </div>

                {/* Tabla de Conceptos */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 0', marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>Concepto</span>
                    <span>Total</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Servicios Sanitarios de Terapia y Apoyo Clínico</span>
                    <span>{selectedInvoice.clinicPart.toFixed(2)} €</span>
                  </div>
                </div>

                {/* Desglose Fiscal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignSelf: 'flex-end', width: '180px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Base Imponible:</span>
                    <span>{selectedInvoice.clinicPart.toFixed(2)} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>IVA (0%):</span>
                    <span style={{ color: 'var(--color-emerald)', fontSize: '0.58rem' }}>Exento (Art.20.Uno.3 LIVA)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '4px', fontWeight: 'bold', color: 'var(--color-emerald)' }}>
                    <span>Total Factura:</span>
                    <span>{selectedInvoice.clinicPart.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Resumen consolidado */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: '8px', border: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>
                Cobro consolidado en tarjeta del paciente:
              </span>
              <strong style={{ fontSize: '1rem', color: '#ffffff' }}>
                {selectedInvoice.total.toFixed(2)} €
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="btn btn-emerald"
                style={{ height: '36px', fontSize: '0.78rem' }}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
