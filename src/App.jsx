import { useState, useEffect } from 'react';
import { firebaseClient as db, firebaseClient } from './firebaseAdapter.js';
import { MemoryRepositoryFactory } from './infrastructure/storage/MemoryRepositoryFactory';
import { CognitiveMemoryEngine } from './services/memory/CognitiveMemoryEngine';
import { App as CapApp } from '@capacitor/app';
import './App.css';
import './index.css';

// Views
import LandingView from './views/LandingView';
import DashboardView from './views/DashboardView';
import PsicologoDashboardView from './views/PsicologoDashboardView';
import PsicologoPerfilView from './views/PsicologoPerfilView';
import AdminDashboardView from './views/AdminDashboardView';
import MenteView from './views/MenteView';
import EscudoLegalView from './views/EscudoLegalView';
import AjustesView from './views/AjustesView';
import ChatView from './views/ChatView';
import AgentesView from './views/AgentesView';
import LoginView from './views/LoginView';

// Patient Modular Views
import PacienteHoyView from './views/paciente/PacienteHoyView';
import PacienteChatView from './views/paciente/PacienteChatView';
import PacienteDiarioView from './views/paciente/PacienteDiarioView';
import PacienteTimelineView from './views/paciente/PacienteTimelineView';
import PacienteSesionesView from './views/paciente/PacienteSesionesView';
import PacienteHistoriaView from './views/paciente/PacienteHistoriaView';
import PacientePrivacidadView from './views/paciente/PacientePrivacidadView';
import PacientePerfilView from './views/paciente/PacientePerfilView';
import PacientePlanView from './views/paciente/PacientePlanView';

import { getUserAppMode, GENERIC_NAV_ITEMS, PERSONAL_NAV_ITEMS, PSICOLOGO_NAV_ITEMS, SUPERVISOR_NAV_ITEMS } from './appConfig';


// Icons
import {
  Heart,
  LayoutDashboard,
  Brain,
  FileText,
  Landmark,
  Settings,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  User,
  LogOut,
  Activity,
  Bot,
  Calendar,
  Shield,
  ShieldCheck,
  Video,
  Sparkles,
  CreditCard,
  Menu
} from 'lucide-react';



const MOCK_PROFILES = {
  // 1. Paciente Real (tisute@gmail.com)
  'tisute@gmail.com': {
    id: 'qXj1JXqkcVbJvvRWParVfmUWwN13',
    role: 'paciente',
    display_name: 'Emilio Naranjo',
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocKwdrtZUzAQ-8ZRmjfpqBk_ItBtYhQQJ1n1V6BvNklS_butsq7LFw=s96-c',
    contexto_terapeutico: {
      displayName: 'Emilio',
      name: 'Emilio Naranjo',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocKwdrtZUzAQ-8ZRmjfpqBk_ItBtYhQQJ1n1V6BvNklS_butsq7LFw=s96-c',
      triaje: null,
      assigned_psychologist_id: null,
      paymentStatus: 'free_trial'
    },
    app_config: { verified: true }
  },
  // 2. Psicólogos Clínicos Colegiados
  'usajosefernan@gmail.com': {
    id: '2TOfkVIRccgIgz5WamAIVmUPtD63',
    role: 'psicologo',
    display_name: 'José Fernández',
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocKTiCRCGtON7UckYXir1hkqxQPP9jHgd0A8aQx3mqswe2yNcA=s96-c',
    contexto_terapeutico: {
      fullName: 'José Fernández',
      name: 'José Fernández',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocKTiCRCGtON7UckYXir1hkqxQPP9jHgd0A8aQx3mqswe2yNcA=s96-c',
      licenseNumber: 'M-49ccc',
      sessionPrice: 55
    },
    app_config: {
      verified: true,
      license_number: 'M-49ccc',
      qualification: 'Especialista Clínico Sanitario',
      rc_insurance: 'Seguro RC Activo (Mapfre)'
    }
  },
  'davidsevilla101@gmail.com': {
    id: 'PbygqVfkfGhdRDDXoDNos1KCXvO2',
    role: 'psicologo',
    display_name: 'David Sevilla',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150',
    contexto_terapeutico: {
      fullName: 'David Sevilla',
      name: 'David Sevilla',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150',
      licenseNumber: 'M-41029',
      sessionPrice: 55
    },
    app_config: {
      verified: true,
      license_number: 'M-41029',
      qualification: 'Psicología Infanto-Juvenil y Mediación Familiar',
      rc_insurance: 'Seguro RC Activo (Mapfre)'
    }
  },
  // 3. Super Admin / Supervisor (José Fernández)
  'josferestudio@gmail.com': {
    id: '4TG5w9rwZVa6jikp5PKVOduFKNg2',
    role: 'supervisor',
    display_name: 'José Fernández',
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJaqYt0GdVkc44Ee-ZqsB6IzBica6mdZprmCIFlXU7V3QNenXo=s96-c',
    contexto_terapeutico: {
      displayName: 'José',
      name: 'José Fernández',
      avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJaqYt0GdVkc44Ee-ZqsB6IzBica6mdZprmCIFlXU7V3QNenXo=s96-c'
    },
    app_config: { verified: true }
  }
};

export default function App() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isVirtualDemo, setIsVirtualDemo] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [bottomMenuHidden, setBottomMenuHidden] = useState(false);
  const [activeMobileMenu, setActiveMobileMenu] = useState(null);
  const [bottomMenuCollapsed, setBottomMenuCollapsed] = useState(false);

  // Dynamic Global State
  const [dailyMoodToday, setDailyMoodToday] = useState(null);
  const [totalDebts, setTotalDebts] = useState(160000);
  const [loading, setLoading] = useState(true);
  const [adminViewRole, setAdminViewRole] = useState(null); // null | 'paciente' | 'psicologo' | 'admin' | 'supervisor'


  const userEmail = user?.email?.toLowerCase() || '';
  const isSuperAdmin = userEmail === 'josferestudio@gmail.com';
  const isPsicologoUser = userEmail === 'usajosefernan@gmail.com' || userEmail === 'davidsevilla101@gmail.com' || profile?.role === 'psicologo';
  
  let activeRole = profile?.role;
  if (isPsicologoUser) {
    activeRole = 'psicologo';
  } else if (isSuperAdmin) {
    activeRole = adminViewRole || 'supervisor';
  }

  const appMode = {
    isOwner: isSuperAdmin,
    isPsicologo: activeRole === 'psicologo' || isPsicologoUser,
    isSupervisor: (activeRole === 'supervisor' || activeRole === 'admin' || isSuperAdmin) && !adminViewRole,
    isGeneric: !isPsicologoUser && (activeRole === 'paciente' || (!isSuperAdmin && activeRole !== 'psicologo' && activeRole !== 'supervisor' && activeRole !== 'admin')),
    showPersonalModules: isSuperAdmin && !adminViewRole
  };

  const isVerifiedPsicologo = 
    !appMode.isPsicologo || 
    profile?.app_config?.verified === true || 
    isSuperAdmin;

  useEffect(() => {
    if (activeRole === 'psicologo') {
      setSidebarCollapsed(true);
    } else {
      setSidebarCollapsed(false);
    }
  }, [activeRole]);

  const navItems = appMode.isSupervisor
    ? SUPERVISOR_NAV_ITEMS
    : (appMode.isPsicologo 
        ? PSICOLOGO_NAV_ITEMS 
        : (appMode.showPersonalModules ? PERSONAL_NAV_ITEMS : GENERIC_NAV_ITEMS));


  const navIcons = {
    dashboard: LayoutDashboard,
    mente: Brain,
    escudo: FileText,
    deudas: Landmark,
    agentes: Bot,
    chat: MessageSquare,
    diary: Heart,
    documents: FileText,
    ajustes: Settings,
    timeline: Activity,
    sesiones: Calendar,
    historial: FileText,
    privacidad: Shield,
    perfil_usuario: User,
    plan_terapeutico: Brain,
    perfil: User,
    soap: Sparkles,
    briefing: Video,
    agenda: Calendar
  };

  const navTitle = {
    dashboard: appMode.isSupervisor 
      ? 'Consola de Administración ÁNCORA' 
      : (appMode.isPsicologo ? 'Portal Clínico del Psicólogo' : 'Hoy — Resumen de hoy'),
    mente: appMode.showPersonalModules ? 'Área Psicológica' : 'Contexto',
    escudo: 'Hoja de Ruta Laboral e INSS',
    deudas: 'Caja Libre, Deudas y Viabilidad',
    agentes: 'Agentes Puente y Schedulers',
    chat: appMode.isSupervisor
      ? 'Gestión de Incidencias Técnicas'
      : (appMode.isPsicologo 
          ? 'Gestión de Consultas y Pacientes' 
          : 'Chat diario de apoyo'),
    diary: 'Diario Emocional',
    documents: 'Documentos y Fuentes',
    ajustes: appMode.isPsicologo ? 'Facturas y Stripe' : 'Configuración y Stripe',
    timeline: 'Timeline de Progreso y Síntomas',
    sesiones: 'Tus Sesiones y Reservas',
    historial: 'Mi Historial Clínico Completo',
    privacidad: 'Configuración de Privacidad y Consentimiento',
    perfil_usuario: 'Mi Perfil y Facturas',
    plan_terapeutico: 'Mi Plan Clínico y Objetivos',
    perfil: 'Ficha e Historial de Pacientes',
    soap: 'Notas SOAP y Firma de Sesiones',
    briefing: 'Preparación de Sesión Activa',
    agenda: 'Agenda y Gestión de Citas'
  };


  useEffect(() => {
    if (!navItems.some(item => item.id === activeTab)) {
      setActiveTab('dashboard');
    }
  }, [activeTab, navItems]);

  async function fetchUserProfile(currentUser) {
    if (isVirtualDemo) return;
    try {
      let { data, error } = await firebaseClient
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          const savedRole = localStorage.getItem('pending_oauth_role') || currentUser.user_metadata?.role || 'paciente';
          localStorage.removeItem('pending_oauth_role');
          const { data: newProfile, error: createError } = await firebaseClient
            .from('profiles')
            .insert([{ id: currentUser.id, role: savedRole }])
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
    if (isVirtualDemo) return;
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const { data, error } = await firebaseClient
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
    if (isVirtualDemo) return;
    try {
      const { data, error } = await firebaseClient
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
    db.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (isVirtualDemo) return;
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
    const { data: { subscription } } = db.auth.onAuthStateChange((_event, currentSession) => {
      if (isVirtualDemo) return;
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
  }, [isVirtualDemo]);

  // Controlar el botón "Atrás" de Android
  useEffect(() => {
    const handlerPromise = CapApp.addListener('backButton', (data) => {
      if (activeTab === 'dashboard') {
        CapApp.exitApp();
      } else {
        setActiveTab('dashboard');
      }
    });

    return () => {
      handlerPromise.then(h => h.remove());
    };
  }, [activeTab]);

  useEffect(() => {
    setBottomMenuHidden(false);
  }, [activeTab]);

  const handleMoodSaved = async (newMood) => {
    setDailyMoodToday(newMood);
    if (user?.id) {
      try {
        await db.from('daily_moods').upsert([{
          user_id: user.id,
          date: newMood.date || new Date().toISOString().split('T')[0],
          anxiety_level: newMood.anxiety_level,
          impulsivity_level: newMood.impulsivity_level,
          energy_level: newMood.energy_level,
          notes: newMood.notes || '',
          sleep_hours: newMood.sleep_hours || null,
          triggers: newMood.triggers || [],
          updated_at: new Date().toISOString()
        }]);

        // Sincronizar captura episódica en CognitiveMemoryEngine
        const repo = MemoryRepositoryFactory.getRepository();
        const engine = new CognitiveMemoryEngine({ repository: repo });
        await engine.capture({
          patientId: user.id,
          rawMessage: `Check-in de hoy: Ansiedad ${newMood.anxiety_level}/10, Estrés/Impulsividad ${newMood.impulsivity_level}/10. ${newMood.notes ? 'Notas: ' + newMood.notes : ''}`,
          verbatimQuote: newMood.notes || '',
          authorityLevel: 3,
          category: 'DAILY_CHECKIN',
          emotionalValence: ((10 - (newMood.anxiety_level || 5)) / 10) * 2 - 1
        });
      } catch (err) {
        console.warn('Error al persistir/capturar diario emocional en memoria:', err.message);
      }
    }
  };

  const handleDebtsUpdated = (newSum) => {
    setTotalDebts(newSum);
  };

  const handleLogout = () => {
    setIsVirtualDemo(false);
    setSession(null);
    setUser(null);
    setProfile(null);
    setDailyMoodToday(null);
  };

  const handleEnterDemoMode = async (email, targetTab, extraAction) => {
    setLoading(true);
    try {
      const lowercaseEmail = email.toLowerCase();
      const mockProfile = MOCK_PROFILES[lowercaseEmail] || MOCK_PROFILES['tisute@gmail.com'];
      const clonedProfile = JSON.parse(JSON.stringify(mockProfile));

      if (extraAction === 'clear_psychologist' && clonedProfile.contexto_terapeutico) {
        clonedProfile.contexto_terapeutico.assigned_psychologist_id = null;
        clonedProfile.contexto_terapeutico.paymentStatus = 'free_trial';
      }

      setIsVirtualDemo(true);
      setAdminViewRole(null); // Limpiar cualquier vista intermedia seleccionada por el admin
      setUser({ id: clonedProfile.id, email: lowercaseEmail });
      setSession({ user: { id: clonedProfile.id, email: lowercaseEmail } });
      setProfile(clonedProfile);
      
      setActiveTab(targetTab || 'dashboard');

      setDailyMoodToday(null);
      setTotalDebts(160000);
    } catch (err) {
      console.error("Error al iniciar sesión en modo demo virtual:", err.message);
      alert("Error al acceder a la Demo: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    try {
      setProfileDropdownOpen(false);
      if (!isVirtualDemo) {
        const { error } = await db.auth.signOut();
        if (error) throw error;
      }
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

  // Mobile navigation helper items mapping with submenus
  let bottomBarItems = [];

  if (appMode.isSupervisor) {
    bottomBarItems = [
      { id: 'dashboard', label: 'Consola', icon: LayoutDashboard },
      { id: 'chat', label: 'Incidencias', icon: MessageSquare },
      { id: 'ajustes', label: 'Ajustes', icon: Settings, action: 'logout' }
    ];
  } else if (appMode.isPsicologo) {
    bottomBarItems = [
      {
        id: 'general_menu',
        label: 'General',
        icon: Activity,
        subItems: [
          { id: 'dashboard', label: 'Métricas', icon: Activity },
          { id: 'agenda', label: 'Agenda y Citas', icon: Calendar }
        ]
      },
      {
        id: 'fichas_menu',
        label: 'Fichas',
        icon: User,
        subItems: [
          { id: 'perfil', label: 'Expedientes', icon: User },
          { id: 'soap', label: 'Notas SOAP', icon: Sparkles },
          { id: 'briefing', label: 'Preparación', icon: Video }
        ]
      },
      {
        id: 'cuenta_menu',
        label: 'Mi Cuenta',
        icon: User,
        subItems: [
          { id: 'perfil_usuario', label: 'Mi Perfil', icon: User },
          { id: 'ajustes', label: 'Facturas', icon: CreditCard },
          { id: 'logout', label: 'Salir', icon: LogOut, action: 'logout' }
        ]
      }
    ];
  } else { // Paciente
    bottomBarItems = [
      {
        id: 'hoy_menu',
        label: 'Hoy',
        icon: LayoutDashboard,
        subItems: [
          { id: 'dashboard', label: 'Mi Día', icon: LayoutDashboard },
          { id: 'diary', label: 'Diario', icon: Heart },
          { id: 'timeline', label: 'Progreso', icon: Activity }
        ]
      },
      {
        id: 'clinica_menu',
        label: 'Clínica',
        icon: Calendar,
        subItems: [
          { id: 'sesiones', label: 'Citas', icon: Calendar },
          { id: 'plan_terapeutico', label: 'Plan Clínico', icon: Brain },
          { id: 'historial', label: 'Mi Historial', icon: FileText }
        ]
      },
      {
        id: 'chat',
        label: 'Ánquer',
        icon: MessageSquare,
        directAction: () => {
          setActiveTab('chat');
          setBottomMenuCollapsed(true);
          setActiveMobileMenu(null);
        }
      },
      {
        id: 'cuenta_menu',
        label: 'Mi Cuenta',
        icon: User,
        subItems: [
          { id: 'perfil_usuario', label: 'Mi Perfil', icon: User },
          { id: 'logout', label: 'Salir', icon: LogOut, action: 'logout' }
        ]
      }
    ];
  }

  if (!session) {
    return <LandingView onAuthSuccess={(u) => setUser(u)} onEnterDemo={handleEnterDemoMode} />;
  }

  // 1. Gating Clínico para Pacientes (Triaje Obligatorio)
  // Un paciente autenticado (por Google o email) que aún no ha completado el triaje clínico debe completar la ficha/entrevista inicial
  const isRealPatientWithoutTriage = 
    !isVirtualDemo && 
    !isSuperAdmin && 
    !appMode.isSupervisor && 
    !appMode.isPsicologo && 
    (activeRole === 'paciente' || !activeRole) && 
    !profile?.triaje_completed && 
    !profile?.contexto_terapeutico?.triaje;

  if (isRealPatientWithoutTriage) {
    return (
      <LoginView 
        currentUser={user} 
        initialRole="paciente" 
        initialMode="register" 
        initialStep={2} 
        onAuthSuccess={(updatedUser) => {
          fetchUserProfile(updatedUser || user);
        }} 
      />
    );
  }

  // 2. Gating Sanitario para Psicólogos (Colegiación y KYC Sanitario Obligatorio)
  // Un psicólogo sanitario que aún no ha completado su colegiación o documentación oficial
  const isRealPsychologistWithoutKYC = 
    !isVirtualDemo && 
    !isSuperAdmin && 
    !appMode.isSupervisor && 
    (activeRole === 'psicologo' || appMode.isPsicologo) && 
    !profile?.colegiado?.numero_colegiado && 
    !profile?.app_config?.license_number &&
    !profile?.app_config?.verified;

  if (isRealPsychologistWithoutKYC) {
    return (
      <LoginView 
        currentUser={user} 
        initialRole="psicologo" 
        initialMode="register" 
        initialStep={2} 
        onAuthSuccess={(updatedUser) => {
          fetchUserProfile(updatedUser || user);
        }} 
      />
    );
  }

  return (
    <div className="app-container">

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${bottomMenuHidden ? 'mobile-hidden' : ''}`}>
        <div className="sidebar-brand-section">
          <div className="sidebar-header">
            <div className="sidebar-logo">
              <img src="/ancora_logo.png" alt="ÁNCORA" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(6, 182, 212, 0.4)', boxShadow: '0 0 6px rgba(6, 182, 212, 0.25)' }} />
              <span>ÁNCORA</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.filter(item => item.id !== 'perfil_usuario').map(item => {
            const Icon = navIcons[item.id] || LayoutDashboard;
            const isChat = item.id === 'chat';
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
                style={isChat ? { borderLeft: '3px solid var(--color-cyan)' } : undefined}
              >
                <Icon size={20} color={isChat ? 'var(--color-cyan)' : undefined} />
                <span className="sidebar-link-label" style={isChat ? { color: 'var(--color-cyan)' } : undefined}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer-section">
          <div className="sidebar-footer">
            <span className="sidebar-footer-title">
              <Heart size={14} color="var(--color-rose)" />
              <span>Tu espacio privado</span>
            </span>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '4px' }}>
              {appMode.showPersonalModules
                ? 'Lola te necesita a su lado sano. Cada día sin perder es una victoria para ella.'
                : 'Tu espacio se completa con documentos, notas, conversaciones y registros propios.'}
            </p>
          </div>
        </div>

        {/* Widget del Perfil en la parte inferior del Sidebar (Desktop-only, solo abajo) */}
        <div className="sidebar-profile-widget desktop-only" style={{
          borderTop: '1px solid var(--border)',
          padding: sidebarCollapsed ? '12px 0' : '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: sidebarCollapsed ? 'center' : 'stretch',
          gap: '8px'
        }}>
          <button
            onClick={() => setActiveTab('perfil_usuario')}
            className={`flex-center sidebar-profile-btn ${activeTab === 'perfil_usuario' ? 'active' : ''}`}
            style={{
              width: '100%',
              background: activeTab === 'perfil_usuario' ? 'rgba(6,182,212,0.08)' : 'transparent',
              border: activeTab === 'perfil_usuario' ? '1px solid rgba(6,182,212,0.2)' : 'none',
              borderRadius: '8px',
              padding: sidebarCollapsed ? '6px' : '8px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              color: '#ffffff',
              textAlign: 'left',
              transition: 'all 0.2s ease'
            }}
            title="Mi Perfil de Usuario"
          >
            {profile?.avatar || profile?.contexto_terapeutico?.avatar ? (
              <img 
                src={profile.avatar || profile.contexto_terapeutico.avatar} 
                alt="avatar" 
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} 
              />
            ) : (
              <div className="flex-center" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--background-tertiary)', border: '1px solid var(--border)' }}>
                <User size={14} />
              </div>
            )}
            {!sidebarCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                <strong style={{ fontSize: '0.74rem', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.contexto_terapeutico?.name || profile?.display_name || 'Mi Perfil'}
                </strong>
                <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.role === 'supervisor' ? 'Supervisor' : (profile?.role === 'psicologo' ? 'Psicólogo Habilitado' : 'Paciente')}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Botón de colapso en Desktop */}
        <div className="sidebar-collapse-section desktop-only" style={{ padding: '10px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: '10px',
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '8px 0',
              width: '100%',
              textAlign: 'left',
              transition: 'color var(--transition-fast)'
            }}
            title={sidebarCollapsed ? "Expandir menú de navegación" : "Colapsar menú de navegación"}
          >
            {sidebarCollapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /> <span>Colapsar Menú</span></>}
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="main-content">
        {/* Topbar Header */}
        {/* Topbar Header (Oculta en vista de chat para interfaz pura y unificada de chat) */}
        {activeTab !== 'chat' && (
          <header className="topbar">
            <div className="topbar-title-section" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
              {/* Cabecera para Móviles (Con Logo y Marca) */}
              <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src="/ancora_logo.png" alt="ÁNCORA" style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(6, 182, 212, 0.4)', boxShadow: '0 0 6px rgba(6, 182, 212, 0.25)' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <h1 style={{ fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ffffff', lineHeight: 1.1, fontWeight: 800, margin: 0 }}>
                    ÁNCORA
                  </h1>
                  <span className="topbar-subtitle" style={{ fontSize: '0.55rem', color: 'var(--text-secondary)' }}>
                    {appMode.isPsicologo ? 'Portal Clínico' : 'Acompañamiento'}
                  </span>
                </div>
                <div style={{ width: '1px', height: '16px', background: 'var(--border)', marginInline: '4px' }} />
              </div>

              {/* Título de la Sección Activa (Principal en Desktop, Secundario en Móvil) */}
              <span className="topbar-section-title" style={{ 
                fontSize: 'clamp(0.95rem, 2vw, 1.25rem)', 
                fontWeight: 800, 
                color: '#ffffff', 
                fontFamily: "'Outfit', sans-serif",
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap' 
              }}>
                {navTitle[activeTab] || 'Panel Principal'}
              </span>
            </div>

            <div className="topbar-actions">
              {isSuperAdmin && (
                <div className="flex-center" style={{
                  background: 'rgba(68,125,130,0.08)',
                  border: '1px solid rgba(68,125,130,0.3)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>Super Admin CRM:</span>
                  <select
                    value={adminViewRole || 'admin_crm'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAdminViewRole(val === 'admin_crm' ? null : val);
                    }}
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: 'transparent',
                      color: '#ffffff',
                      border: 'none',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="admin_crm" style={{ background: 'var(--background-secondary)', color: '#ffffff' }}>CRM / Consola Admin</option>
                    <option value="paciente" style={{ background: 'var(--background-secondary)', color: '#ffffff' }}>Vista Paciente</option>
                    <option value="psicologo" style={{ background: 'var(--background-secondary)', color: '#ffffff' }}>Vista Psicólogo</option>
                  </select>
                </div>
              )}

              {/* Diario de Sensaciones Status Indicator (Solo Pacientes) */}
              {appMode.isGeneric && (
                <div className="flex-center" style={{
                  background: 'var(--background-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '6px 12px',
                  gap: '8px',
                  cursor: 'pointer'
                }} onClick={() => setActiveTab('mente')}>
                  <div style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: dailyMoodToday ? 'var(--color-emerald)' : 'var(--color-rose)',
                    boxShadow: `0 0 6px ${dailyMoodToday ? 'var(--color-emerald)' : 'var(--color-rose)'}`
                  }} />
                  <span className="diario-status-text" style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {dailyMoodToday ? 'Diario Completado Hoy' : 'Diario de Sensaciones Pendiente'}
                  </span>
                </div>
              )}
            </div>
          </header>
        )}

        {/* View content injection */}
        <main 
          className={`view-container ${activeTab === 'chat' ? 'chat-view-active' : ''} ${appMode.isPsicologo ? 'psicologo-view-active' : ''}`}
          style={!isVerifiedPsicologo ? {
            filter: 'blur(6px)',
            pointerEvents: 'none',
            userSelect: 'none'
          } : {}}
        >
          {activeTab === 'dashboard' && !appMode.isPsicologo && (
            appMode.isSupervisor ? (
              <AdminDashboardView
                user={user}
                profile={profile}
              />
            ) : appMode.isGeneric ? (
              <PacienteHoyView
                user={user}
                profile={profile}
                onNavigate={(tab) => setActiveTab(tab)}
                dailyMoodToday={dailyMoodToday}
                onMoodSaved={handleMoodSaved}
                isVirtualDemo={isVirtualDemo}
                onAssignPsychologist={async (psychoId, appointment) => {
                  if (isVirtualDemo) {
                    const updatedCT = { 
                      ...(profile?.contexto_terapeutico || {}), 
                      assigned_psychologist_id: psychoId,
                      paymentStatus: 'paid'
                    };
                    setProfile({
                      ...profile,
                      contexto_terapeutico: updatedCT
                    });

                    if (appointment) {
                      const newAppt = {
                        id: 'virtual-appt-' + Date.now(),
                        patient_id: user.id,
                        psychologist_id: psychoId,
                        appointment_date: appointment.date,
                        appointment_time: appointment.time,
                        session_type: 'individual',
                        status: 'upcoming'
                      };
                      const localApptsStr = localStorage.getItem('virtual_appointments') || '[]';
                      const localAppts = JSON.parse(localApptsStr);
                      localAppts.push(newAppt);
                      localStorage.setItem('virtual_appointments', JSON.stringify(localAppts));
                    }
                    return;
                  }

                  try {
                    const updatedCT = { ...(profile?.contexto_terapeutico || {}), assigned_psychologist_id: psychoId };
                    const { data, error } = await firebaseClient
                      .from('profiles')
                      .update({ contexto_terapeutico: updatedCT })
                      .eq('id', user.id)
                      .select()
                      .single();
                    if (error) throw error;

                    if (appointment) {
                      const { error: apptError } = await firebaseClient
                        .from('appointments')
                        .insert({
                          patient_id: user.id,
                          psychologist_id: psychoId,
                          appointment_date: appointment.date,
                          appointment_time: appointment.time,
                          session_type: 'individual',
                          status: 'upcoming'
                        });
                      if (apptError) {
                        console.error("Error creating onboarding appointment:", apptError.message);
                      }
                    }

                    setProfile(data);
                  } catch (err) {
                    console.error("Error saving assigned psychologist:", err.message);
                  }
                }}
              />
            ) : (
              <DashboardView
                user={user}
                profile={profile}
                dailyMoodToday={dailyMoodToday}
                totalDebts={totalDebts}
                appMode={appMode}
                onProfileUpdated={(updatedProfile) => setProfile(updatedProfile)}
              />
            )
          )}

          {appMode.isPsicologo && ['dashboard', 'perfil', 'soap', 'briefing', 'agenda', 'ajustes'].includes(activeTab) && (
            <PsicologoDashboardView
              user={user}
              profile={profile}
              isVirtualDemo={isVirtualDemo}
              onLogout={handleLogout}
              onProfileUpdated={(updatedProfile) => setProfile(updatedProfile)}
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              activeSection={activeTab}
              setActiveSection={setActiveTab}
            />
          )}

          {activeTab === 'mente' && (
            <MenteView
              user={user}
              profile={profile}
              dailyMoodToday={dailyMoodToday}
              onMoodSaved={handleMoodSaved}
              onProfileUpdated={(newProf) => setProfile(newProf)}
              genericMode={appMode.isGeneric}
              genericSection="context"
            />
          )}

          {activeTab === 'escudo' && appMode.showPersonalModules && (
            <EscudoLegalView
              user={user}
              profile={profile}
            />
          )}

          {activeTab === 'agentes' && appMode.showPersonalModules && (
            <AgentesView
              user={user}
              profile={profile}
              sidebarCollapsed={sidebarCollapsed}
              setSidebarCollapsed={setSidebarCollapsed}
              onProfileUpdated={(updatedProfile) => setProfile(updatedProfile)}
            />
          )}

          {activeTab === 'diary' && (
            appMode.isGeneric ? (
              <PacienteDiarioView
                dailyMoodToday={dailyMoodToday}
                onMoodSaved={handleMoodSaved}
              />
            ) : (
              <MenteView
                user={user}
                profile={profile}
                dailyMoodToday={dailyMoodToday}
                onMoodSaved={handleMoodSaved}
                onProfileUpdated={(newProf) => setProfile(newProf)}
                genericMode={true}
                genericSection="diary"
              />
            )
          )}

          {activeTab === 'documents' && (
            <MenteView
              user={user}
              profile={profile}
              dailyMoodToday={dailyMoodToday}
              onMoodSaved={handleMoodSaved}
              onProfileUpdated={(newProf) => setProfile(newProf)}
              genericMode={true}
              genericSection="sources"
            />
          )}

          {activeTab === 'chat' && (
            appMode.isGeneric ? (
              <PacienteChatView
                profile={profile}
                user={user}
                onProfileUpdated={async (updatedProfile) => setProfile(updatedProfile)}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
                bottomMenuHidden={bottomMenuHidden || bottomMenuCollapsed}
                setBottomMenuHidden={setBottomMenuHidden}
                bottomMenuCollapsed={bottomMenuCollapsed}
                setBottomMenuCollapsed={setBottomMenuCollapsed}
                onNavigate={setActiveTab}
              />
            ) : (
              <ChatView
                user={user}
                profile={profile}
                dailyMoodToday={dailyMoodToday}
                onProfileUpdated={(updatedProfile) => setProfile(updatedProfile)}
                genericMode={appMode.isGeneric}
              />
            )
          )}

          {activeTab === 'timeline' && appMode.isGeneric && (
            <PacienteTimelineView isVirtualDemo={isVirtualDemo} />
          )}

          {activeTab === 'sesiones' && appMode.isGeneric && (
            <PacienteSesionesView profile={profile} user={user} isVirtualDemo={isVirtualDemo} />
          )}

          {activeTab === 'historial' && appMode.isGeneric && (
            <PacienteHistoriaView 
              profile={profile}
              onProfileUpdated={async (updatedProfile) => setProfile(updatedProfile)}
              user={user}
              isVirtualDemo={isVirtualDemo}
            />
          )}

          {activeTab === 'privacidad' && appMode.isGeneric && (
            <PacientePrivacidadView
              user={user}
              profile={profile}
              onProfileUpdated={(updatedProfile) => setProfile(updatedProfile)}
            />
          )}

          {activeTab === 'perfil_usuario' && appMode.isGeneric && (
            <PacientePerfilView
              profile={profile}
              onProfileUpdated={async (updatedProfile) => setProfile(updatedProfile)}
              user={user}
              isVirtualDemo={isVirtualDemo}
              onLogout={handleLogoutClick}
            />
          )}

          {activeTab === 'perfil_usuario' && appMode.isPsicologo && (
            <PsicologoPerfilView
              profile={profile}
              onProfileUpdated={async (updatedProfile) => setProfile(updatedProfile)}
              user={user}
              isVirtualDemo={isVirtualDemo}
              onLogout={handleLogoutClick}
            />
          )}

          {activeTab === 'plan_terapeutico' && appMode.isGeneric && (
            <PacientePlanView
              profile={profile}
              user={user}
              isVirtualDemo={isVirtualDemo}
            />
          )}

          {activeTab === 'ajustes' && !appMode.isPsicologo && (
            <AjustesView
              user={user}
              profile={profile}
              onLogout={handleLogout}
              onProfileUpdated={(updatedProfile) => setProfile(updatedProfile)}
            />
          )}

         </main>

        {!isVerifiedPsicologo && (
          <div style={{
            position: 'absolute',
            top: '70px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(5, 33, 58, 0.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '24px'
          }}>
            <div style={{
              background: '#ffffff',
              border: '1px solid rgba(5, 33, 58, 0.08)',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '480px',
              boxShadow: '0 20px 40px rgba(5, 33, 58, 0.15)',
              textAlign: 'center',
              color: '#05213A',
              fontFamily: "'Inter', sans-serif"
            }}>
              <div className="flex-center" style={{
                width: '56px',
                height: '56px',
                margin: '0 auto 16px',
                background: 'linear-gradient(135deg, #447D82, #7F9F88)',
                borderRadius: '16px',
                boxShadow: '0 4px 15px rgba(68, 125, 130, 0.2)'
              }}>
                <Shield size={26} color="#ffffff" />
              </div>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                fontFamily: "'Playfair Display', serif",
                margin: '0 0 12px 0'
              }}>
                Validación Sanitaria de Perfil Pendiente
              </h3>
              <p style={{
                fontSize: '0.78rem',
                color: '#5F6F74',
                lineHeight: 1.5,
                margin: '0 0 20px 0',
                textAlign: 'left'
              }}>
                Tu cuenta de psicólogo ha sido registrada correctamente. Actualmente visualizas el panel clínico en <strong>Modo Demostración</strong> con datos ficticios.
                <br /><br />
                Nuestro equipo médico está verificando tu número de colegiado y seguro de responsabilidad civil para validarte e incluirte en la base de datos de Áncora. Recibirás una notificación por correo una vez se apruebe tu perfil profesional.
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '8px',
                borderTop: '1px solid rgba(5, 33, 58, 0.06)',
                paddingTop: '16px'
              }}>
                <span style={{ fontSize: '0.65rem', color: '#9AA6AB', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} color="#7F9F88" />
                  Áncora Seguridad & RGPD
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fondo invisible para cerrar submenús flotantes al pulsar fuera */}
      {activeMobileMenu && (
        <div 
          className="popover-backdrop" 
          onClick={() => setActiveMobileMenu(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 990,
            background: 'transparent'
          }}
        />
      )}

      {/* Tirador para colapsar/expandir el menú inferior móvil (Oculto en chat para no tapar la interfaz) */}
      {!bottomMenuHidden && activeTab !== 'chat' && (
        <div className="mobile-only" style={{
          position: 'fixed',
          bottom: bottomMenuCollapsed ? '16px' : '62px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1005,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <button
            onClick={() => setBottomMenuCollapsed(!bottomMenuCollapsed)}
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '10px 10px 0 0',
              background: 'rgba(10, 22, 32, 0.94)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderBottom: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 -4px 10px rgba(0,0,0,0.2)'
            }}
            title={bottomMenuCollapsed ? "Expandir menú inferior" : "Plegar menú inferior"}
          >
            {bottomMenuCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      )}

      {/* Barra de navegación inferior disruptiva en dispositivos móviles */}
      <div className={`mobile-bottom-bar ${bottomMenuCollapsed ? 'collapsed' : ''}`} style={bottomMenuHidden ? { display: 'none' } : {}}>
        {bottomBarItems.map(item => {
          const Icon = item.icon || navIcons[item.id] || LayoutDashboard;
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isMenuOpen = activeMobileMenu === item.id;
          
          // Verificar si alguna subsección está activa
          const isChildActive = hasSubItems && item.subItems.some(sub => activeTab === sub.id);
          const isActive = isMenuOpen || (!hasSubItems && activeTab === item.id) || isChildActive;

          return (
            <div key={item.id} className="mobile-nav-item-container" style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              
              {/* Submenú Flotante Contextual (Popover Glassmorphic) */}
              {hasSubItems && isMenuOpen && (
                <div className="mobile-popover-menu animate-pop-in">
                  <div className="mobile-popover-arrow" />
                  <div className="mobile-popover-inner">
                    {item.subItems.map(sub => {
                      const SubIcon = sub.icon || navIcons[sub.id] || LayoutDashboard;
                      const isSubActive = activeTab === sub.id;
                      
                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            if (sub.action === 'logout') {
                              handleLogoutClick();
                            } else {
                              setActiveTab(sub.id);
                            }
                            setActiveMobileMenu(null);
                          }}
                          className={`mobile-popover-item ${isSubActive ? 'active' : ''}`}
                        >
                          <div className="popover-icon-wrapper">
                            <SubIcon size={18} />
                          </div>
                          <span className="popover-item-label">{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Botón Principal de la Barra Inferior */}
              <button
                onClick={() => {
                  if (item.directAction) {
                    item.directAction();
                  } else if (hasSubItems) {
                    setActiveMobileMenu(isMenuOpen ? null : item.id);
                  } else {
                    if (item.action === 'logout') {
                      handleLogoutClick();
                    } else {
                      setActiveTab(item.id);
                    }
                    setActiveMobileMenu(null);
                  }
                }}
                className={`mobile-nav-link ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span className="mobile-nav-label">{item.label}</span>
              </button>
            </div>
          );
        })}
      </div>

    </div>
  );
}
