import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Settings, Key, User, ShieldAlert, LogOut, CheckCircle2, RefreshCw } from 'lucide-react';


export default function AjustesView({ user, profile, onLogout, onProfileUpdated }) {
  const [apiKey, setApiKey] = useState(profile?.bingx_api_key || '');
  const [apiSecret, setApiSecret] = useState(profile?.bingx_api_secret || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Sync state when profile changes (e.g. loads from server) without useEffect to prevent cascading render warnings
  const [prevProfile, setPrevProfile] = useState(profile);
  if (profile && (profile.id !== prevProfile?.id || profile.bingx_api_key !== prevProfile?.bingx_api_key || profile.bingx_api_secret !== prevProfile?.bingx_api_secret)) {
    setPrevProfile(profile);
    setApiKey(profile.bingx_api_key || '');
    setApiSecret(profile.bingx_api_secret || '');
  }

  const handleSaveKeys = async (e) => {
    e.preventDefault();
    if (profile?.role === 'supervisor') return; // Read-only for supervisors
    
    setLoading(true);
    setMsg(null);
    setTestResult(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          bingx_api_key: apiKey,
          bingx_api_secret: apiSecret,
          role: profile?.role || 'emilio',
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setMsg({ type: 'success', text: 'Claves de API guardadas con éxito en Supabase.' });
      
      // Notify parent App component
      if (onProfileUpdated) {
        onProfileUpdated({
          ...profile,
          bingx_api_key: apiKey,
          bingx_api_secret: apiSecret
        });
      }
    } catch (err) {
      console.error("Error saving API keys:", err.message);
      setMsg({ type: 'error', text: 'Error al guardar claves: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No hay sesión activa.");

      const response = await fetch('https://ysnorelkaccaikvuqgnv.supabase.co/functions/v1/chat-terapeuta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'get_bingx_data' })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || `HTTP error ${response.status}`);
      }

      setTestResult({
        success: true,
        message: '¡Conexión establecida con éxito con BingX!',
        balance: resData.balance?.balance || 0,
        available: resData.balance?.availableBalance || 0,
        positionsCount: resData.positions?.length || 0
      });
    } catch (err) {
      console.error("Error testing connection:", err.message);
      setTestResult({
        success: false,
        message: 'Fallo de conexión: ' + err.message
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      onLogout();
    } catch (e) {
      console.error("Logout error:", e.message);
    }
  };

  return (
    <div className="view-content-limit">
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Settings size={20} color="var(--color-emerald)" />
          Ajustes del Portal
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Configura tus accesos e integraciones. La información está protegida por Row Level Security en la nube de Supabase.
        </p>

        {msg && (
          <div className="flex-center" style={{ 
            padding: '12px', 
            borderRadius: 'var(--radius-sm)', 
            background: msg.type === 'success' ? 'hsla(var(--emerald), 0.1)' : 'hsla(var(--rose), 0.1)',
            border: `1px solid ${msg.type === 'success' ? 'hsla(var(--emerald), 0.25)' : 'hsla(var(--rose), 0.25)'}`,
            color: msg.type === 'success' ? 'var(--color-emerald)' : 'var(--color-rose)',
            fontSize: '0.8rem',
            marginBottom: '20px',
            gap: '8px'
          }}>
            <span>{msg.text}</span>
          </div>
        )}

        <div className="grid-2">
          {/* API Keys Configuration */}
          <form onSubmit={handleSaveKeys} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={18} color="var(--color-emerald)" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Credenciales API de BingX</h4>
            </div>
            
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Al guardar tus API Keys, el chat de Walter (IA) podrá conectarse de forma segura a tu broker para auditar tus trades abiertos en tiempo real y alertarte en caso de riesgo de ruina.
            </p>

            <div className="form-group">
              <label className="form-label">BingX API Key</label>
              <input 
                type="text" 
                className="form-input" 
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Introducir API Key..."
                disabled={profile?.role === 'supervisor'}
              />
            </div>

            <div className="form-group">
              <label className="form-label">BingX API Secret</label>
              <input 
                type="password" 
                className="form-input" 
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="••••••••••••••••••••••••••••••••"
                disabled={profile?.role === 'supervisor'}
              />
            </div>

            <div className="flex-center" style={{ 
              padding: '12px', 
              background: 'hsla(var(--rose), 0.05)', 
              border: '1px solid hsla(var(--rose), 0.15)',
              borderRadius: 'var(--radius-sm)',
              gap: '10px',
              fontSize: '0.7rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.3
            }}>
              <ShieldAlert size={16} color="var(--color-rose)" style={{ flexShrink: 0 }} />
              <span>
                <strong>AVISO IMPORTANTE:</strong> Crea tus API Keys en BingX configurando <strong>únicamente permisos de LECTURA (Read-Only)</strong>. Nunca guardes credenciales con permisos de ejecución de trades o retiros.
              </span>
            </div>

            <button 
              type="submit" 
              className="btn btn-emerald" 
              disabled={loading || profile?.role === 'supervisor'}
              style={{ height: '42px', width: '100%' }}
            >
              {loading ? 'Guardando...' : profile?.role === 'supervisor' ? 'Modo de Solo Lectura' : 'Guardar API Keys'}
            </button>
          </form>

          {/* User profile detail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--color-cyan)" />
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Perfil y Seguridad</h4>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.15)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>Email de Cuenta</span>
                <span style={{ fontWeight: 600, color: '#ffffff' }}>{user?.email}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem' }}>Rol asignado</span>
                <span className={`badge ${profile?.role === 'supervisor' ? 'badge-cyan' : 'badge-emerald'}`} style={{ marginTop: '4px' }}>
                  {profile?.role === 'supervisor' ? 'SUPERVISOR (Walter / Familia)' : 'EMILIO (Paciente / Operador)'}
                </span>
              </div>
            </div>

            {/* Credential Status & Connection Test */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                {profile?.bingx_api_key ? (
                  <>
                    <CheckCircle2 size={16} color="var(--color-emerald)" />
                    <span style={{ fontWeight: 600, color: 'var(--color-emerald)' }}>Claves guardadas en la base de datos</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert size={16} color="var(--color-rose)" />
                    <span style={{ fontWeight: 600, color: 'var(--color-rose)' }}>Claves de API no configuradas</span>
                  </>
                )}
              </div>

              {profile?.bingx_api_key && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleTestConnection}
                    disabled={testLoading}
                    style={{ height: '36px', width: '100%', fontSize: '0.75rem', gap: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {testLoading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Probando conexión...</span>
                      </>
                    ) : (
                      <span>Probar Conexión con BingX</span>
                    )}
                  </button>

                  {testResult && (
                    <div style={{
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      background: testResult.success ? 'hsla(var(--emerald), 0.05)' : 'hsla(var(--rose), 0.05)',
                      border: `1px solid ${testResult.success ? 'hsla(var(--emerald), 0.2)' : 'hsla(var(--rose), 0.2)'}`,
                      fontSize: '0.72rem',
                      color: testResult.success ? 'var(--color-emerald)' : 'var(--color-rose)',
                      lineHeight: 1.4
                    }}>
                      <p style={{ fontWeight: 600, marginBottom: '4px' }}>{testResult.message}</p>
                      {testResult.success && (
                        <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <li>• Balance: <strong>{parseFloat(testResult.balance).toFixed(2)} USDT</strong></li>
                          <li>• Disponible: <strong>{parseFloat(testResult.available).toFixed(2)} USDT</strong></li>
                          <li>• Posiciones Abiertas: <strong>{testResult.positionsCount}</strong></li>
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', marginTop: '16px' }}>
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={handleLogoutClick}
                style={{ width: '100%', borderColor: 'hsla(var(--rose), 0.3)', color: 'var(--color-rose)', height: '42px' }}
              >
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
