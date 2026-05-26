import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './App.css';
import './index.css';

// Views
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import MenteView from './views/MenteView';
import EscudoLegalView from './views/EscudoLegalView';
import TradingView from './views/TradingView';
import AjustesView from './views/AjustesView';
import ChatView from './views/ChatView';

// Icons
import { 
  ShieldAlert, 
  Heart, 
  LayoutDashboard, 
  Brain, 
  FileText, 
  Landmark, 
  Settings, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  User,
  LogOut
} from 'lucide-react';

export default function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  // Dynamic Global State
  const [dailyMoodToday, setDailyMoodToday] = useState(null);
  const [totalDebts, setTotalDebts] = useState(160000);
  const [loading, setLoading] = useState(true);

  async function fetchUserProfile(currentUser) {
    try {
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (error) {
        // If profile doesn't exist, create it (fallback if trigger fails)
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: currentUser.id, role: 'emilio' }])
            .select()
            .single();
          
          if (createError) throw createError;
          setProfile(newProfile);
        } else {
          throw error;
        }
      } else {
        setProfile(data);
      }
    } catch (e) {
      console.error("Error fetching user profile:", e.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTodayMood(currentUser) {
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('daily_moods')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('date', todayDate)
        .single();
      
      if (!error && data) {
        setDailyMoodToday(data);
      }
    } catch (e) {
      console.error("Error fetching today mood:", e.message);
    }
  }

  async function fetchTotalDebts(currentUser) {
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .eq('user_id', currentUser.id);
      
      if (!error && data) {
        const sum = data.reduce((acc, curr) => {
          const amt = parseFloat(curr.amount) || 0;
          const paid = parseFloat(curr.paid_amount) || 0;
          return acc + (amt - paid);
        }, 0);
        setTotalDebts(sum);
      }
    } catch (e) {
      console.error("Error fetching total debts:", e.message);
    }
  }

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        fetchUserProfile(initialSession.user);
        fetchTodayMood(initialSession.user);
        fetchTotalDebts(initialSession.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user);
        fetchTodayMood(currentSession.user);
        fetchTotalDebts(currentSession.user);
      } else {
        setProfile(null);
        setDailyMoodToday(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleMoodSaved = (newMood) => {
    setDailyMoodToday(newMood);
  };

  const handleDebtsUpdated = (newSum) => {
    setTotalDebts(newSum);
  };

  const handleLogout = () => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setDailyMoodToday(null);
  };

  const handleLogoutClick = async () => {
    try {
      setProfileDropdownOpen(false);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      handleLogout();
    } catch (e) {
      console.error("Logout error:", e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '4px solid var(--border)', borderTopColor: 'var(--color-emerald)', animation: 'pulse-soft 1s infinite alternate' }} />
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Verificando credenciales seguras...</span>
      </div>
    );
  }

  if (!session) {
    return <LoginView onAuthSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand-section">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <ShieldAlert size={20} color="var(--color-rose)" />
              <span>SISTEMA EN-78</span>
            </div>
            <button 
              className="sidebar-toggle-btn flex-center"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span className="sidebar-link-label">Panel</span>
          </button>

          <button 
            onClick={() => setActiveTab('mente')}
            className={`sidebar-link ${activeTab === 'mente' ? 'active' : ''}`}
          >
            <Brain size={20} />
            <span className="sidebar-link-label">Mente</span>
          </button>

          <button 
            onClick={() => setActiveTab('escudo')}
            className={`sidebar-link ${activeTab === 'escudo' ? 'active' : ''}`}
          >
            <FileText size={20} />
            <span className="sidebar-link-label">INSS</span>
          </button>

          <button 
            onClick={() => setActiveTab('trading')}
            className={`sidebar-link ${activeTab === 'trading' ? 'active' : ''}`}
          >
            <Landmark size={20} />
            <span className="sidebar-link-label">Deudas</span>
          </button>

          <button 
            onClick={() => setActiveTab('chat')}
            className={`sidebar-link ${activeTab === 'chat' ? 'active' : ''}`}
            style={{ borderLeft: '3px solid var(--color-cyan)' }}
          >
            <MessageSquare size={20} color="var(--color-cyan)" />
            <span className="sidebar-link-label" style={{ color: 'var(--color-cyan)' }}>Walter</span>
          </button>

          <button 
            onClick={() => setActiveTab('ajustes')}
            className={`sidebar-link ${activeTab === 'ajustes' ? 'active' : ''}`}
          >
            <Settings size={20} />
            <span className="sidebar-link-label">Ajustes</span>
          </button>
        </nav>

        <div className="sidebar-footer-section">
          <div className="sidebar-footer">
            <span className="sidebar-footer-title">
              <Heart size={14} color="var(--color-rose)" />
              <span>Motivo de Vida</span>
            </span>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '4px' }}>
              Lola te necesita a su lado sano. Cada día sin perder es una victoria para ella.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="main-content">
        {/* Topbar Header */}
        <header className="topbar">
          <div className="topbar-title-section">
            <h1 style={{ fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {activeTab === 'dashboard' && 'Panel Principal de Control'}
              {activeTab === 'mente' && 'Área Psicológica (Mente)'}
              {activeTab === 'escudo' && 'Hoja de Ruta Laboral e INSS'}
              {activeTab === 'trading' && 'Blindaje Operativo y Deudas'}
              {activeTab === 'chat' && 'Sesión Clínica y Riesgo'}
              {activeTab === 'ajustes' && 'Configuración de Credenciales'}
            </h1>
            <span className="topbar-subtitle">
              Paciente: Emilio José Naranjo Fernández — Agencia EFE
            </span>
          </div>

          <div className="topbar-actions">
            {/* Atomoxetina Status Indicator */}
            <div className="flex-center" style={{ 
              background: 'var(--background-tertiary)', 
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              gap: '8px'
            }}>
              <div style={{ 
                width: '7px', 
                height: '7px', 
                borderRadius: '50%', 
                backgroundColor: dailyMoodToday?.atomoxetina_taken ? 'var(--color-emerald)' : 'var(--color-rose)',
                boxShadow: `0 0 6px ${dailyMoodToday?.atomoxetina_taken ? 'var(--color-emerald)' : 'var(--color-rose)'}`
              }} />
              <span className="atomoxetina-status-text" style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {dailyMoodToday?.atomoxetina_taken ? 'Atomoxetina Activa' : 'Atomoxetina Inactiva'}
              </span>
            </div>

            {/* Total Debt indicator */}
            <div className="flex-center" style={{ 
              background: 'var(--background-tertiary)', 
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 12px',
              gap: '6px',
              fontSize: '0.7rem',
              fontWeight: 700
            }}>
              <span className="debt-indicator-label" style={{ color: 'var(--text-secondary)' }}>Deuda:</span>
              <span style={{ color: 'var(--color-rose)' }}>{totalDebts.toLocaleString()} €</span>
            </div>

            {/* Profile Dropdown Trigger */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex-center profile-dropdown-trigger" 
                style={{ 
                  background: 'var(--background-tertiary)', 
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  gap: '6px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: profile?.role === 'supervisor' ? 'var(--color-cyan)' : 'var(--color-emerald)',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <User size={14} />
                <span className="profile-trigger-name">{profile?.role === 'supervisor' ? 'Supervisor' : 'Emilio'}</span>
              </button>

              {profileDropdownOpen && (
                <div className="profile-dropdown-menu" style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '220px',
                  background: 'var(--background-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '12px',
                  zIndex: 1050,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block' }}>Email</span>
                    <strong style={{ fontSize: '0.72rem', color: '#ffffff', wordBreak: 'break-all' }}>{user?.email}</strong>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Rol actual</span>
                    <div style={{ 
                      fontSize: '0.7rem', 
                      fontWeight: 600, 
                      padding: '4px 8px', 
                      borderRadius: '4px',
                      background: profile?.role === 'supervisor' ? 'rgba(6,182,212,0.1)' : 'rgba(16,185,129,0.1)',
                      color: profile?.role === 'supervisor' ? 'var(--color-cyan)' : 'var(--color-emerald)',
                      border: `1px solid ${profile?.role === 'supervisor' ? 'rgba(6,182,212,0.2)' : 'rgba(16,185,129,0.2)'}`
                    }}>
                      {profile?.role === 'supervisor' ? 'Supervisor (Walter/Familia)' : 'Paciente (Emilio)'}
                    </div>
                  </div>
                  <button 
                    onClick={handleLogoutClick}
                    className="btn btn-outline" 
                    style={{ 
                      width: '100%', 
                      borderColor: 'hsla(var(--rose), 0.3)', 
                      color: 'var(--color-rose)', 
                      height: '32px',
                      fontSize: '0.72rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <LogOut size={14} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* View content injection */}
        <main className={`view-container ${activeTab === 'chat' ? 'chat-view-active' : ''}`}>
          {activeTab === 'dashboard' && (
            <DashboardView 
              profile={profile} 
              dailyMoodToday={dailyMoodToday} 
              totalDebts={totalDebts} 
            />
          )}

          {activeTab === 'mente' && (
            <MenteView 
              user={user} 
              profile={profile} 
              dailyMoodToday={dailyMoodToday} 
              onMoodSaved={handleMoodSaved} 
              onProfileUpdated={(newProf) => setProfile(newProf)}
            />
          )}

          {activeTab === 'escudo' && (
            <EscudoLegalView 
              user={user} 
              profile={profile} 
            />
          )}

          {activeTab === 'trading' && (
            <TradingView 
              user={user} 
              totalDebts={totalDebts} 
              onDebtsUpdated={handleDebtsUpdated} 
              onTabChange={setActiveTab}
            />
          )}

          {activeTab === 'chat' && (
            <ChatView 
              user={user} 
              profile={profile}
              dailyMoodToday={dailyMoodToday} 
              onProfileUpdated={(updatedProfile) => setProfile(updatedProfile)}
            />
          )}

          {activeTab === 'ajustes' && (
            <AjustesView 
              user={user} 
              profile={profile} 
              onLogout={handleLogout} 
              onProfileUpdated={(updatedProfile) => setProfile(updatedProfile)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
