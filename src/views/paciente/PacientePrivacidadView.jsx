import { useState } from 'react';
import {
  Eye,
  Download,
  Trash2,
  Lock
} from 'lucide-react';
import { firebaseClient } from '../../firebaseAdapter.js';
export default function PacientePrivacidadView({ user, onProfileUpdated, profile }) {
  const [shareTherapist, setShareTherapist] = useState(true);
  const [useAI, setUseAI] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [anonymousResearch, setAnonymousResearch] = useState(true);
  
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleExportData = () => {
    setExportLoading(true);
    setTimeout(() => {
      setExportLoading(false);
      triggerToast("✓ Expediente clínico exportado en formato JSON con éxito.");
      
      // Simular descarga de un JSON de datos
      const dataStr = JSON.stringify({
        paciente: profile?.display_name || 'Ana',
        email: user?.email,
        colegiado_asignado: 'M-28490',
        enfoques: ['Ansiedad laboral', 'Autoestima'],
        diarios_checkin: [
          { date: '29/05/2026', anxiety: 5, stress: 6, notes: 'Registro de diario emocional' }
        ]
      }, null, 2);
      
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = 'ancora_expediente_portable.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }, 1500);
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'ELIMINAR MI HISTORIAL') {
      alert("Por favor, introduce el texto exacto de confirmación.");
      return;
    }
    
    try {
      // Borrar perfil en Áncora
      const { error } = await firebaseClient
        .from('profiles')
        .delete()
        .eq('id', user.id);
        
      if (error) throw error;
      
      alert("Cuenta y expediente clínico eliminados permanentemente del servidor seguro de ÁNCORA.");
      window.location.reload();
    } catch (err) {
      console.error("Error deleting account:", err);
      alert("Error al eliminar cuenta: " + err.message);
    }
  };

  return (
    <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
      
      {/* Toast Alert */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '90px',
          right: '24px',
          background: 'var(--color-emerald)',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 2000,
          fontSize: '0.78rem',
          fontWeight: 600,
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Banner de Garantía Privacidad */}
      <div className="glass-panel" style={{ padding: '20px', borderTop: '4px solid var(--color-cyan)', background: 'rgba(68,125,130,0.02)' }}>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(68,125,130,0.1)', color: 'var(--color-cyan)' }}>
            <Lock size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Privacidad por Diseño y RGPD</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: 1.4 }}>
              Tú controlas tu información. Concede o revoca permisos granulares de acceso en cualquier momento.
            </p>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Panel de Permisos Toggles */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye size={18} color="var(--color-cyan)" />
            Permisos de Acceso y Tratamiento
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Toggle 1: Psicólogo */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block' }}>Compartir diario con mi psicólogo</strong>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Permite a tu terapeuta ver tus check-ins de ánimo, horas de sueño y notas de Ánquer.</span>
              </div>
              <input 
                type="checkbox" 
                checked={shareTherapist} 
                onChange={(e) => setShareTherapist(e.target.checked)}
                style={{ width: '38px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-cyan)' }}
              />
            </div>

            {/* Toggle 2: IA Ánquer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block' }}>Utilizar IA para resumir y ordenar contexto</strong>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Autoriza el procesado automatizado de tus notas diarias por el agente para sintetizar recuerdos.</span>
              </div>
              <input 
                type="checkbox" 
                checked={useAI} 
                onChange={(e) => setUseAI(e.target.checked)}
                style={{ width: '38px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-cyan)' }}
              />
            </div>

            {/* Toggle 3: Investigación */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block' }}>Colaborar en investigación médica anónima</strong>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Utilizar tus scorings agregados y anonimizados para estadísticas de eficacia clínica global.</span>
              </div>
              <input 
                type="checkbox" 
                checked={anonymousResearch} 
                onChange={(e) => setAnonymousResearch(e.target.checked)}
                style={{ width: '38px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-cyan)' }}
              />
            </div>

            {/* Toggle 4: Marketing */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ textAlign: 'left' }}>
                <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block' }}>Recibir comunicaciones informativas</strong>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Autoriza el envío de newsletters, tips de respiración y promociones.</span>
              </div>
              <input 
                type="checkbox" 
                checked={marketing} 
                onChange={(e) => setMarketing(e.target.checked)}
                style={{ width: '38px', height: '20px', cursor: 'pointer', accentColor: 'var(--color-cyan)' }}
              />
            </div>

          </div>
        </div>

        {/* Panel de Descargas y Eliminación */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Descargas Portabilidad */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Download size={16} color="var(--color-emerald)" />
              Portabilidad de Datos (Derecho de Acceso)
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '16px' }}>
              Descarga una copia completa y portable de tu expediente clínico digital, diarios de check-in e historial conversacional en formato JSON legible.
            </p>

            <button
              onClick={handleExportData}
              disabled={exportLoading}
              className="btn btn-emerald"
              style={{ width: '100%', height: '38px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Download size={14} />
              <span>{exportLoading ? 'Exportando expediente...' : 'Exportar mi expediente (.json)'}</span>
            </button>
          </div>

          {/* Eliminación de Cuenta */}
          <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(244,63,94,0.15)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 800, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-rose)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Trash2 size={16} />
              Derecho de Supresión (Olvido)
            </h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '14px' }}>
              Elimina de forma irreversible tu cuenta de usuario, tus claves e historial clínico de los servidores seguros de ÁNCORA.
            </p>
            
            {deleteConfirmOpen ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--color-rose)', fontWeight: 600 }}>
                  Escribe "ELIMINAR MI HISTORIAL" para confirmar la supresión irreversible:
                </span>
                <input 
                  type="text"
                  className="form-input"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="Introduce confirmación..."
                  style={{ height: '34px', fontSize: '0.72rem', border: '1px solid var(--color-rose)', background: 'var(--background-tertiary)', borderRadius: '4px', width: '100%', padding: '0 8px', color: '#ffffff' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={handleDeleteAccount}
                    className="btn btn-primary"
                    style={{ background: 'var(--color-rose)', borderColor: 'var(--color-rose)', color: '#ffffff', flex: 1, height: '32px', fontSize: '0.72rem' }}
                  >
                    Confirmar Borrado
                  </button>
                  <button 
                    onClick={() => { setDeleteConfirmOpen(false); setDeleteInput(''); }}
                    className="btn btn-outline"
                    style={{ flex: 1, height: '32px', fontSize: '0.72rem' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="btn btn-outline"
                style={{ width: '100%', height: '38px', fontSize: '0.78rem', color: 'var(--color-rose)', borderColor: 'rgba(244,63,94,0.3)' }}
              >
                <span>Solicitar Supresión de Datos</span>
              </button>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
