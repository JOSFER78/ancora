import { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  User, Mail, CreditCard, Clock, FileText, 
  Download, ShieldCheck, Heart, Sparkles, CheckCircle2, ArrowRight
} from 'lucide-react';

export default function PacientePerfilView({ profile, onProfileUpdated, user, isVirtualDemo }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  
  // Datos del perfil y contexto
  const context = profile?.contexto_terapeutico || {};
  const currentName = context.name || profile?.display_name || 'Pedro Sanz';
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

  // Historial de pagos mockeados para demo / real
  // Si el usuario ya asignó psicólogo, mostramos el pago del triaje de 49€ realizado
  const hasPsychologist = !!context.assigned_psychologist_id;
  const paymentHistory = hasPsychologist ? [
    { id: 'ch_3Mv8x9L2x9o4', date: '30/05/2026', concept: 'Depósito de Triaje Clínico Seguro & Enclave Privado', method: 'Visa **** 4242', amount: '49.00 €', status: 'completed' },
    { id: 'ch_2Kd9u2P1x8p9', date: '29/05/2026', concept: 'Cuota de Activación de Licencia Virtual (Firma Digital)', method: 'Stripe 0€', amount: '0.00 €', status: 'completed' }
  ] : [
    { id: 'ch_2Kd9u2P1x8p9', date: 'Hoy', concept: 'Suscripción Demo - Licencia de Enclave Temporal Activada', method: 'Gratuito (Demo)', amount: '0.00 €', status: 'completed' }
  ];

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveStatus('');
    try {
      const newContext = {
        ...context,
        name: nameInput,
        displayName: nameInput.split(' ')[0]
      };

      if (isVirtualDemo) {
        // En modo virtual, guardamos temporalmente en el estado global
        if (onProfileUpdated) {
          onProfileUpdated({
            ...profile,
            avatar: avatarUrl,
            display_name: nameInput.split(' ')[0],
            contexto_terapeutico: newContext
          });
        }
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(''), 3000);
        return;
      }

      // En modo real, actualizamos Supabase
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          avatar: avatarUrl,
          display_name: nameInput.split(' ')[0],
          contexto_terapeutico: newContext
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      
      if (onProfileUpdated) {
        onProfileUpdated(data);
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error("Error saving user profile data:", err.message);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadInvoice = (invoice) => {
    alert(`Descargando factura simplificada digital:\n\nID: ${invoice.id}\nFecha: ${invoice.date}\nConcepto: ${invoice.concept}\nImporte: ${invoice.amount}\nEstado: COMPLETED (Cifrado local verificado)`);
  };

  return (
    <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
      
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Mi Perfil de Usuario</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Gestiona tus datos de acceso, tu suscripción y el historial histórico de facturación.
          </p>
        </div>
        
        {saveStatus === 'success' && (
          <span style={{ fontSize: '0.72rem', color: 'var(--color-emerald)', fontWeight: 600 }}>✓ Cambios guardados correctamente</span>
        )}
        {saveStatus === 'error' && (
          <span style={{ fontSize: '0.72rem', color: 'var(--color-rose)', fontWeight: 600 }}>✗ Error al guardar perfil</span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }} className="grid-responsive-detail">
        
        {/* Columna Izquierda: Datos del Perfil */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tarjeta de Edición de Perfil */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={16} color="var(--color-cyan)" />
              Datos Personales
            </h3>

            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Avatar circular */}
              <div style={{ position: 'relative' }}>
                <img 
                  src={avatarUrl} 
                  alt={nameInput} 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-cyan)', boxShadow: '0 0 12px rgba(6,182,212,0.15)' }} 
                />
              </div>

              {/* Selector de avatares rápidos */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 'bold', textTransform: 'uppercase' }}>Elige un Retrato</span>
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
                <label style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Email (No editable)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} color="var(--text-tertiary)" style={{ position: 'absolute', left: '10px', top: '11px' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={user?.email || 'tisute@gmail.com'}
                    style={{ height: '36px', fontSize: '0.78rem', paddingLeft: '32px', background: 'rgba(0,0,0,0.15)', color: 'var(--text-tertiary)' }}
                    disabled 
                  />
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>URL del Avatar Personalizado</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  style={{ height: '36px', fontSize: '0.72rem', paddingLeft: '12px' }}
                  placeholder="Copia una URL de imagen externa..."
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
              <span>{isSaving ? 'Guardando...' : 'Guardar Datos del Perfil'}</span>
            </button>
          </div>

        </div>

        {/* Columna Derecha: Suscripción y Facturas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tarjeta del Plan Actual */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '4px solid var(--color-cyan)', background: 'rgba(6,182,212,0.02)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={16} color="var(--color-cyan)" />
              Suscripción Activa
            </h3>

            <div>
              <strong style={{ fontSize: '1.05rem', color: '#ffffff', display: 'block' }}>
                {hasPsychologist ? 'Plan Terapia Premium Síncrona' : 'Periodo de Triaje y Configuración'}
              </strong>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                {hasPsychologist ? 'Acceso completo al enclave, diario encriptado y cita semanal de 15min' : 'Acceso efímero para completar perfil, cargar informes y elegir psicólogo'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '4px' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Precio mensual:</span>
              <strong style={{ fontSize: '1.3rem', color: 'var(--color-cyan)' }}>
                {hasPsychologist ? '49.00 € / mes' : 'Gratuito (Prueba)'}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              <span>Estado del plan:</span>
              <strong style={{ color: hasPsychologist ? 'var(--color-emerald)' : 'var(--color-amber)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={12} />
                {hasPsychologist ? 'Activo (Suscripción Stripe)' : 'Triaje pendiente'}
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
                    <button 
                      type="button"
                      onClick={() => handleDownloadInvoice(invoice)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '4px' }}
                      title="Descargar PDF"
                    >
                      <Download size={14} />
                    </button>
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
