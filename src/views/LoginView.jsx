import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Shield, Mail, Lock, LogIn, AlertCircle } from 'lucide-react';

export default function LoginView({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState('emilio'); // default role on registration

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (data.user) {
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: role }
        }
      });

      if (signUpError) throw signUpError;
      
      if (data.user) {
        // Update profile row (which is auto-created by the database trigger) to ensure the role matches.
        // We use .update() instead of .insert() to prevent key collisions with the trigger.
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ role: role })
          .eq('id', data.user.id);
        
        if (profileError) {
          console.error("Error updating profile role:", profileError);
        }
        
        setError('¡Registro completado! Ahora puedes iniciar sesión.');
        setIsRegistering(false);
      }
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div className="flex-center" style={{ 
            width: '64px', 
            height: '64px', 
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, hsl(var(--rose)), hsl(var(--emerald)))',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)'
          }}>
            <Shield size={32} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
            {isRegistering ? 'CREAR ACCESO PRIVADO' : 'SISTEMA DE SURVIVAL'}
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {isRegistering ? 'Configura tus accesos cifrados en la nube' : 'Centro de Control y Blindaje Conductual — Emilio'}
          </p>
        </div>

        {error && (
          <div className="flex-center" style={{ 
            background: error.includes('completado') ? 'hsla(var(--emerald), 0.1)' : 'hsla(var(--rose), 0.1)', 
            border: `1px solid ${error.includes('completado') ? 'hsla(var(--emerald), 0.3)' : 'hsla(var(--rose), 0.3)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '12px',
            marginBottom: '20px',
            gap: '10px',
            color: error.includes('completado') ? 'var(--color-emerald)' : 'var(--color-rose)',
            fontSize: '0.8rem'
          }}>
            <AlertCircle size={18} />
            <span style={{ flex: 1 }}>{error}</span>
          </div>
        )}

        <form onSubmit={isRegistering ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-tertiary)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input 
                type="email" 
                className="form-input" 
                placeholder="ejemplo@ayuda.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '44px' }}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-tertiary)" style={{ position: 'absolute', left: '14px', top: '13px' }} />
              <input 
                type="password" 
                className="form-input" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '44px' }}
                required 
              />
            </div>
          </div>

          {isRegistering && (
            <div className="form-group">
              <label className="form-label">Rol del Usuario</label>
              <select 
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="emilio">Emilio (Acceso completo + Trading)</option>
                <option value="supervisor">Walter / Familiar (Supervisor - Solo lectura)</option>
              </select>
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-emerald" 
            disabled={loading}
            style={{ width: '100%', marginTop: '10px', height: '46px' }}
          >
            {loading ? 'Procesando...' : (
              <>
                <LogIn size={18} />
                <span>{isRegistering ? 'Registrar Acceso' : 'Entrar al Panel'}</span>
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {isRegistering ? (
            <p>
              ¿Ya tienes cuenta?{' '}
              <span 
                onClick={() => setIsRegistering(false)} 
                style={{ color: 'var(--color-emerald)', cursor: 'pointer', fontWeight: 600 }}
              >
                Inicia sesión aquí
              </span>
            </p>
          ) : (
            <p>
              ¿No tienes cuenta?{' '}
              <span 
                onClick={() => setIsRegistering(true)} 
                style={{ color: 'var(--color-emerald)', cursor: 'pointer', fontWeight: 600 }}
              >
                Regístrate aquí
              </span>
            </p>
          )}
        </div>


      </div>
    </div>
  );
}
