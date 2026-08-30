import { useState, useEffect } from 'react';
import { firebaseClient } from '../../firebaseAdapter.js';
import { doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db as firestoreDb } from '../../firebaseClient';
import { 
  User, Mail, CreditCard, Clock, FileText, 
  Download, ShieldCheck, Heart, Sparkles, CheckCircle2, ArrowRight, LogOut,
  Calendar, Trash2, AlertTriangle, RefreshCcw, Lock
} from 'lucide-react';

export default function PacientePerfilView({ profile, onProfileUpdated, user, isVirtualDemo, onLogout }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const [googleConnected, setGoogleConnected] = useState(false);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(null);

  // Estados de borrado y reseteo de cuenta
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteActionType, setDeleteActionType] = useState('delete_account'); // 'delete_account' | 'reset_triage'
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const appConfig = profile?.app_config || {};

  useEffect(() => {
    if (profile?.app_config) {
      if (profile.app_config.calendar_sync_google !== undefined) {
        setGoogleConnected(profile.app_config.calendar_sync_google);
      }
      if (profile.app_config.calendar_sync_device !== undefined) {
        setDeviceConnected(profile.app_config.calendar_sync_device);
      }
    }
  }, [profile]);
  
  // Datos del perfil y contexto
  const context = profile?.contexto_terapeutico || {};
  const currentName = context.name || profile?.display_name || 'Paciente';
  const currentAvatar = profile?.avatar || context.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150';

  const [nameInput, setNameInput] = useState(currentName);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatar);

  // Lista de avatares predefinidos premium para seleccionar rápidamente
  const PRESET_AVATARS = [
    { label: 'Pedro (Joven)', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150' },
    { label: 'David (Medio)', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=150&h=150' },
    { label: 'Sofía (Alternativo)', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150' },
    { label: 'Ana (Profesional)', url: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=150&h=150' }
  ];

  // Historial de pagos
  const hasPsychologist = !!context.assigned_psychologist_id;
  const paymentHistory = hasPsychologist ? [
    { id: 'ch_3Mv8x9L2x9o4', date: 'Hoy', concept: 'Depósito de Triaje Clínico Seguro & Enclave Privado', method: 'Visa **** 4242', amount: '0.00 €', status: 'completed' },
    { id: 'ch_2Kd9u2P1x8p9', date: 'Registro', concept: 'Activación de Expediente Clínico Cifrado', method: 'Tarifa 0€', amount: '0.00 €', status: 'completed' }
  ] : [
    { id: 'ch_2Kd9u2P1x8p9', date: 'Hoy', concept: 'Licencia Gratuita de Enclave Temporal', method: 'Gratuito', amount: '0.00 €', status: 'completed' }
  ];

  const handleToggleSync = async (type) => {
    const nextState = type === 'google' ? !googleConnected : !deviceConnected;
    setIsSyncing(type);
    try {
      const appConfigObj = {
        ...appConfig,
        [type === 'google' ? 'calendar_sync_google' : 'calendar_sync_device']: nextState
      };
      
      const userId = profile?.id || user?.id || user?.uid;
      if (userId) {
        await firebaseClient.from('profiles').update({ app_config: appConfigObj }).eq('id', userId);
        if (onProfileUpdated) {
          onProfileUpdated({ ...profile, app_config: appConfigObj });
        }
      }
      if (type === 'google') setGoogleConnected(nextState);
      else setDeviceConnected(nextState);
    } catch (err) {
      console.error('Error al cambiar sincronización de calendario:', err);
    } finally {
      setIsSyncing(null);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const userId = profile?.id || user?.id || user?.uid;
      const updatedProfile = {
        ...profile,
        display_name: nameInput,
        avatar: avatarUrl,
        contexto_terapeutico: {
          ...context,
          name: nameInput,
          avatar: avatarUrl
        }
      };

      if (userId) {
        await firebaseClient.from('profiles').update({
          display_name: nameInput,
          avatar: avatarUrl,
          contexto_terapeutico: updatedProfile.contexto_terapeutico
        }).eq('id', userId);
      }

      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
      setSaveStatus('¡Perfil actualizado con éxito!');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Error al guardar perfil:', err);
      setSaveStatus('Error al guardar.');
    } finally {
      setIsSaving(false);
    }
  };

  // -------------------------------------------------------------
  // FUNCIÓN PARA BORRAR USUARIO O RESETEAR TRIAGE
  // -------------------------------------------------------------
  const handleExecuteDeleteOrReset = async () => {
    setIsDeleting(true);
    const targetId = String(profile?.id || user?.id || user?.uid || '');

    try {
      if (deleteActionType === 'delete_account') {
        // 1. Borrar de Firestore
        if (targetId) {
          try {
            await deleteDoc(doc(firestoreDb, 'profiles', targetId));
          } catch (fsErr) {
            console.warn('[DeleteUser] Firestore deleteDoc notice:', fsErr);
          }
        }

        // 2. Borrar de Firebase
        if (targetId) {
          await Promise.allSettled([
            firebaseClient.from('clinical_profiles').delete().eq('patient_id', targetId),
            firebaseClient.from('timeline_events').delete().eq('patient_id', targetId),
            firebaseClient.from('clinical_life_tree').delete().eq('patient_id', targetId),
            firebaseClient.from('medications').delete().eq('patient_id', targetId),
            firebaseClient.from('clinical_documents').delete().eq('patient_id', targetId),
            firebaseClient.from('consents').delete().eq('user_id', targetId),
            firebaseClient.from('chat_messages').delete().eq('patient_id', targetId),
            firebaseClient.from('diario_entries').delete().eq('user_id', targetId),
            firebaseClient.from('profiles').delete().eq('id', targetId)
          ]);
        }

        // 3. Limpiar almacenamiento local
        localStorage.clear();
        sessionStorage.clear();

        // 4. Cerrar sesión
        try {
          await firebaseClient.auth.signOut();
        } catch (e) {}

        if (onLogout) {
          onLogout();
        } else {
          window.location.href = '/';
        }
      } else {
        // Reset de Triaje (Empezar de cero)
        if (targetId) {
          try {
            const resetCtx = {
              ...context,
              triaje: null,
              motivo: '',
              tags: [],
              historial_clinico: {},
              assigned_psychologist_id: null
            };
            const profileRef = doc(db, 'profiles', targetId);
            await setDoc(profileRef, { contexto_terapeutico: resetCtx, triaje_completed: false }, { merge: true });
          } catch (fsErr) {
            console.warn('[ResetTriage] Firestore reset notice:', fsErr);
          }

          await Promise.allSettled([
            db.from('clinical_profiles').delete().eq('patient_id', targetId),
            db.from('timeline_events').delete().eq('patient_id', targetId),
            db.from('clinical_life_tree').delete().eq('patient_id', targetId),
            db.from('medications').delete().eq('patient_id', targetId)
          ]);
        }

        setShowDeleteModal(false);
        if (onLogout) {
          onLogout();
        } else {
          window.location.href = '/';
        }
      }
    } catch (err) {
      console.error('Error en borrado/reseteo:', err);
      alert('Error: ' + (err.message || 'No se pudo completar la acción.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto', textAlign: 'left' }}>
      
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Mi Perfil & Ajustes de Cuenta 👤
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Gestiona tu identidad encriptada, sincronización de calendario y datos de cuenta.
          </p>
        </div>
      </div>

      {saveStatus && (
        <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', color: 'var(--color-emerald)', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{saveStatus}</span>
        </div>
      )}

      {/* Grid Principal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        
        {/* Columna Izquierda: Datos Personales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={16} color="var(--color-cyan)" />
              Identidad del Paciente
            </h3>

            {/* Selector de Avatar */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <img 
                src={avatarUrl} 
                alt="Avatar" 
                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-cyan)' }} 
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Seleccionar avatar rápido:</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatarUrl(preset.url)}
                      style={{ 
                        width: '32px', 
                        height: '32px', 
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

            {/* Inputs del formulario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Nombre Completo</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  style={{ height: '36px', fontSize: '0.78rem', paddingLeft: '12px' }}
                  placeholder="Tu nombre completo..."
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Email Registrado</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} color="var(--text-tertiary)" style={{ position: 'absolute', left: '10px', top: '11px' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={user?.email || profile?.email || 'usuario@ancora.com'}
                    style={{ height: '36px', fontSize: '0.78rem', paddingLeft: '32px', background: 'rgba(0,0,0,0.15)', color: 'var(--text-tertiary)' }}
                    disabled 
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="btn btn-cyan"
              style={{ height: '38px', fontSize: '0.78rem', fontWeight: 'bold', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '6px' }}
            >
              {isSaving ? <Clock size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              <span>{isSaving ? 'Guardando...' : 'Guardar Datos del Perfil'}</span>
            </button>
          </div>

          {/* Sincronización de Calendario */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} color="var(--color-cyan)" />
              Sincronización de Calendario
            </h3>

            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4, textAlign: 'left' }}>
              Vincula tus sesiones clínicas síncronas confirmadas con tus cuentas personales de Google, Apple o Android.
            </p>

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
                  <span style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: 600 }}>Dispositivo (iOS / Android)</span>
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

          {/* ------------------------------------------------------------- */}
          {/* ZONA DE PRIVACIDAD, BORRADO Y DERECHO AL OLVIDO (RGPD ART. 17) */}
          {/* ------------------------------------------------------------- */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid rgba(244, 63, 94, 0.2)', background: 'rgba(244, 63, 94, 0.02)' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-rose)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trash2 size={16} />
              Privacidad y Borrado de Datos (RGPD)
            </h3>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
              Puedes reiniciar tus datos de prueba o solicitar la eliminación total e irrevocable de tu cuenta, historial y diarios.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setDeleteActionType('reset_triage');
                  setShowDeleteModal(true);
                  setDeleteConfirmText('');
                }}
                className="btn btn-outline"
                style={{
                  height: '36px',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <RefreshCcw size={13} />
                <span>Reiniciar Triaje</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeleteActionType('delete_account');
                  setShowDeleteModal(true);
                  setDeleteConfirmText('');
                }}
                className="btn btn-outline"
                style={{
                  borderColor: 'rgba(244, 63, 94, 0.4)',
                  color: 'var(--color-rose)',
                  height: '36px',
                  fontSize: '0.72rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'rgba(244, 63, 94, 0.04)'
                }}
              >
                <Trash2 size={13} />
                <span>Borrar Usuario</span>
              </button>
            </div>
          </div>

          {/* Botón de Cerrar Sesión */}
          <button
            type="button"
            className="btn btn-outline"
            onClick={onLogout}
            style={{
              height: '38px',
              fontSize: '0.78rem',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <LogOut size={14} />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* Columna Derecha: Suscripción y Facturas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tarjeta del Plan Actual */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '4px solid var(--color-cyan)', background: 'rgba(6,182,212,0.02)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={16} color="var(--color-cyan)" />
              Plan Activo & Acompañamiento
            </h3>

            <div>
              <strong style={{ fontSize: '1.05rem', color: '#ffffff', display: 'block' }}>
                {hasPsychologist ? 'Plan Supervisado con Terapeuta Colegiado' : 'Registro Gratuito & Diario Libre'}
              </strong>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                {hasPsychologist ? 'Acceso completo al diario encriptado, chat con IA y expediente supervisado' : 'Acceso gratuito para diario reflexivo, chat y selección de psicólogo'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Cuota de Mantenimiento:</span>
              <strong style={{ fontSize: '1.3rem', color: 'var(--color-emerald)' }}>
                0,00 €
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              <span>Estado del plan:</span>
              <strong style={{ color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} />
                Activo (Tarifa 0€)
              </strong>
            </div>
          </div>

          {/* Tarjeta del Historial de Pagos (Facturas) */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} color="var(--color-emerald)" />
              Historial de Pagos y Facturas
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {paymentHistory.map((invoice, idx) => (
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

      {/* ------------------------------------------------------------- */}
      {/* MODAL DE CONFIRMACIÓN DE BORRADO / REINICIO DE CUENTA */}
      {/* ------------------------------------------------------------- */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 33, 58, 0.75)',
          backdropFilter: 'blur(5px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#0e1e28',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-rose)' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                {deleteActionType === 'delete_account' ? '¿Eliminar Usuario Permanentemente?' : '¿Reiniciar Triaje y Datos de Prueba?'}
              </h3>
            </div>

            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
              {deleteActionType === 'delete_account' 
                ? 'Esta acción eliminará de forma inmediata e irreversible tu cuenta, tu expediente clínico, tu árbol vital, tus diarios y tus conversaciones con Áncora en cumplimiento del RGPD (Derecho al Olvido).'
                : 'Se reseteará tu triaje clínico, motivo y expediente para que puedas completar el cuestionario inicial nuevamente desde cero.'}
            </p>

            <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '10px 12px', borderRadius: '8px', fontSize: '0.72rem', color: 'var(--color-rose)' }}>
              ⚠️ Para confirmar, escribe <strong>BORRAR</strong> a continuación:
            </div>

            <input 
              type="text" 
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Escribe BORRAR"
              style={{
                height: '38px',
                paddingInline: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.3)',
                color: '#ffffff',
                fontSize: '0.8rem'
              }}
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="btn btn-outline"
                style={{ flex: 1, height: '38px', borderRadius: '8px', fontSize: '0.78rem' }}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleExecuteDeleteOrReset}
                disabled={isDeleting || deleteConfirmText.trim().toUpperCase() !== 'BORRAR'}
                className="btn"
                style={{
                  flex: 1,
                  height: '38px',
                  borderRadius: '8px',
                  background: deleteConfirmText.trim().toUpperCase() === 'BORRAR' ? '#f43f5e' : 'rgba(244, 63, 94, 0.3)',
                  color: '#ffffff',
                  fontWeight: 700,
                  border: 'none',
                  cursor: deleteConfirmText.trim().toUpperCase() === 'BORRAR' ? 'pointer' : 'not-allowed',
                  fontSize: '0.78rem'
                }}
              >
                {isDeleting ? 'Procesando...' : (deleteActionType === 'delete_account' ? 'Eliminar Definitivamente' : 'Confirmar Reinicio')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
