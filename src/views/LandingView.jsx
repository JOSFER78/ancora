import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { 
  ArrowRight, Brain, FileText, MessageSquare, ShieldCheck, Sparkles, Check, 
  Heart, User, ClipboardList, Lock, Award, Search, Calendar, Star, 
  DollarSign, HelpCircle, ChevronRight, Activity, TrendingUp, Info, 
  Shield, CheckCircle2, UserPlus, Laptop, Smartphone, Mail, AlertTriangle,
  Download, ChevronUp, X
} from 'lucide-react';
import LoginView from './LoginView';
import ApkDownloadGuideModal from '../components/ApkDownloadGuideModal';
import CookieBannerModal from '../components/CookieBannerModal';
import LegalModals from '../components/LegalModals';

export default function LandingView({ onAuthSuccess, onEnterDemo }) {
  const accessRef = useRef(null);
  const marketplaceRef = useRef(null);
  const planesRef = useRef(null);
  const pacientesRef = useRef(null);
  const psicologosRef = useRef(null);
  const comoFuncionaRef = useRef(null);
  const dropdownRef = useRef(null);
  
  // Estado para el modal de login/registro directo encima de la app
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Estados para modales legales y cookies
  const [activeLegalModal, setActiveLegalModal] = useState(null); // 'privacy' | 'terms' | 'help' | 'resources' | 'about' | 'contact' | null
  const [forceOpenCookies, setForceOpenCookies] = useState(false);

  // Estado para el desplegable y guía de la APK de Android en el footer
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Estado de la consola de demostración
  const [showDemoConsole, setShowDemoConsole] = useState(false);

  // Estado para el rol y modo de acceso seleccionado
  const [selectedRole, setSelectedRole] = useState('paciente'); // 'paciente' | 'psicologo'
  const [selectedAuthMode, setSelectedAuthMode] = useState('register'); // 'register' | 'login'

  // Estado para las tarifas interactiva (paciente vs psicólogo)
  const [pricingTab, setPricingTab] = useState('paciente'); // 'paciente' | 'psicologo'

  // Estado para la sección interactiva de muestras de producto (dispositivos)
  const [activePreview, setActivePreview] = useState('diario'); // 'diario' | 'expediente' | 'soap'

  // Estados del Marketplace (Terapeutas cargados desde Áncora)
  const [psychologists, setPsychologists] = useState([]);
  const [loadingPsychologists, setLoadingPsychologists] = useState(true);
  const [errorPsychologists, setErrorPsychologists] = useState(null);

  // Estados de los filtros del Marketplace
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('Todas');
  const [maxPrice, setMaxPrice] = useState(100);
  const [selectedAvailability, setSelectedAvailability] = useState('Cualquiera');

  // Estado del modal de perfil de psicólogo seleccionado
  const [selectedPsychologist, setSelectedPsychologist] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null); // Hueco de agenda virtual seleccionado

  useEffect(() => {
    const fetchPsychologists = async () => {
      try {
        setLoadingPsychologists(true);
        const { data, error } = await supabase
          .from('psychologist_profiles')
          .select('*')
          .order('rating_avg', { ascending: false });

        if (error) throw error;
        setPsychologists(data || []);
      } catch (err) {
        console.error("Error fetching psychologists:", err);
        setErrorPsychologists("No se pudieron cargar los terapeutas de la base de datos.");
      } finally {
        setLoadingPsychologists(false);
      }
    };

    fetchPsychologists();

    // Si se ejecuta en APK nativa o WebView de Android, abrir directamente el acceso encima de la app
    try {
      const isNative = typeof window !== 'undefined' && (
        window.Capacitor?.isNativePlatform?.() || 
        window.location.protocol === 'capacitor:' || 
        (window.location.hostname === 'localhost' && window.navigator.userAgent.includes('Android'))
      );
      if (isNative) {
        setShowAuthModal(true);
      }
    } catch (_) {}
  }, []);

  const scrollToHome = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToPacientes = () => {
    pacientesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToPsicologos = () => {
    psicologosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToComoFunciona = () => {
    comoFuncionaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToMarketplace = () => {
    marketplaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToPlanes = () => {
    planesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToAccess = (role = 'paciente', mode = 'register') => {
    setSelectedRole(role);
    setSelectedAuthMode(mode);
    if (accessRef.current) {
      accessRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filtrado de psicólogos en base a los criterios seleccionados
  const filteredPsychologists = psychologists.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (p.bio && p.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSpecialty = selectedSpecialty === 'Todas' || 
                             p.specialties.some(s => s.toLowerCase().includes(selectedSpecialty.toLowerCase()));
    
    const matchesPrice = parseFloat(p.session_price) <= maxPrice;
    
    let matchesAvailability = true;
    if (selectedAvailability !== 'Cualquiera') {
      if (selectedAvailability === 'Hoy mismo') {
        matchesAvailability = p.availability.toLowerCase().includes('hoy');
      } else if (selectedAvailability === 'Esta semana') {
        matchesAvailability = p.availability.toLowerCase().includes('hoy') || p.availability.toLowerCase().includes('mañana') || p.availability.toLowerCase().includes('esta');
      }
    }

    return matchesSearch && matchesSpecialty && matchesPrice && matchesAvailability;
  });

  // Especialidades únicas mapeadas para los filtros
  const specialtiesList = ['Todas', 'Ansiedad', 'Depresión', 'Estrés', 'Trauma', 'Sueño', 'Pareja'];

  // Huecos simulados de agenda por psicólogo para la ficha detallada
  const mockAgendaSlots = [
    { day: 'Lunes', times: ['10:00', '12:30', '16:00'] },
    { day: 'Martes', times: ['09:30', '11:00', '17:30'] },
    { day: 'Miércoles', times: ['15:00', '16:30', '19:00'] },
    { day: 'Jueves', times: ['11:30', '13:00', '18:00'] },
    { day: 'Viernes', times: ['10:00', '14:30', '16:00'] }
  ];

  const handleConfirmBooking = () => {
    setSelectedPsychologist(null);
    setSelectedSlot(null);
    scrollToAccess('paciente');
  };

  const serifFont = "'Playfair Display', 'Libre Baskerville', 'Georgia', serif";
  const sansFont = "'Inter', sans-serif";

  return (
    <div style={{ minHeight: '100vh', background: '#F8F6F1', color: '#05213A', fontFamily: sansFont }}>
      
      {/* HEADER DE NAVEGACIÓN */}
      <header style={{
        padding: '16px 24px',
        borderBottom: '1px solid rgba(5, 33, 58, 0.1)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(5, 33, 58, 0.95)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1180px', margin: '0 auto', width: '100%' }}>
          <div 
            className="landing-logo-container" 
            onClick={scrollToHome}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <img src="/ancora_logo.png" alt="ÁNCORA" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(6, 182, 212, 0.4)', boxShadow: '0 0 10px rgba(6, 182, 212, 0.25)' }} />
            <span style={{ 
              fontWeight: 'bold', 
              fontSize: '1.55rem', 
              letterSpacing: '-0.01em', 
              color: '#ffffff',
              fontFamily: serifFont
            }}>
              Áncora
            </span>
          </div>

          <nav className="landing-nav" style={{ display: 'flex', gap: '28px', fontSize: '0.8rem', fontWeight: 600, color: '#9AA6AB', marginLeft: 'auto', marginRight: 'auto', alignItems: 'center' }}>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={scrollToPacientes} onMouseEnter={e => e.target.style.color = '#ffffff'} onMouseLeave={e => e.target.style.color = '#9AA6AB'}>Para pacientes</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={scrollToPsicologos} onMouseEnter={e => e.target.style.color = '#ffffff'} onMouseLeave={e => e.target.style.color = '#9AA6AB'}>Para psicólogos</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={scrollToComoFunciona} onMouseEnter={e => e.target.style.color = '#ffffff'} onMouseLeave={e => e.target.style.color = '#9AA6AB'}>Cómo funciona</span>
            <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onClick={scrollToPlanes} onMouseEnter={e => e.target.style.color = '#ffffff'} onMouseLeave={e => e.target.style.color = '#9AA6AB'}>Precios</span>
          </nav>

          <div className="landing-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button 
              onClick={() => scrollToAccess('paciente', 'register')} 
              className="btn" 
              style={{ 
                height: '38px', 
                fontSize: '0.78rem', 
                borderRadius: '999px', 
                background: '#7F9F88', 
                color: '#ffffff', 
                paddingInline: '22px', 
                fontWeight: 'bold', 
                textTransform: 'none', 
                letterSpacing: 'normal',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 10px rgba(127, 159, 136, 0.35)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#6d8a75';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#7F9F88';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span>Iniciar sesión / Registro</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section style={{ 
        position: 'relative', 
        padding: '120px 24px 110px', 
        overflow: 'hidden', 
        backgroundColor: '#05213A',
        backgroundImage: 'linear-gradient(to right, #05213A 45%, rgba(5, 33, 58, 0.85) 65%, rgba(5, 33, 58, 0.2) 100%), url("./hero-faro.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'right center',
        borderBottom: '1px solid rgba(5, 33, 58, 0.1)'
      }}>
        
        <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '40px' }} className="grid-responsive-dashboard">
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '24px', textAlign: 'left' }}>
            <span style={{ 
              display: 'inline-flex', 
              gap: '6px', 
              padding: '6px 14px', 
              fontSize: '0.65rem', 
              letterSpacing: '0.1em',
              fontWeight: 800,
              textTransform: 'uppercase',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '999px',
              color: '#F8F6F1'
            }}>
              PLATAFORMA DE SALUD MENTAL INTEGRAL
            </span>

            <h1 style={{ 
              fontSize: 'clamp(2.8rem, 5.5vw, 4.2rem)', 
              lineHeight: 1.15, 
              fontWeight: 'normal', 
              color: '#ffffff',
              fontFamily: serifFont,
              margin: 0
            }}>
              La terapia con<br />
              continuidad real
            </h1>

            <p style={{ 
              maxWidth: '560px', 
              fontSize: '1rem', 
              color: '#9AA6AB', 
              lineHeight: 1.6,
              margin: 0
            }}>
              Para pacientes: seguimiento diario guiado que te acompaña entre sesiones. Para psicólogos: contexto organizado y herramientas que te devuelven tiempo para lo más importante: tu paciente.
            </p>

            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '10px' }}>
              <button className="btn" onClick={() => scrollToAccess('paciente')} style={{ height: '48px', paddingInline: '26px', fontWeight: 'bold', background: '#7F9F88', color: '#ffffff', borderRadius: '999px', textTransform: 'none', letterSpacing: 'normal', fontSize: '0.82rem', transition: 'all 0.2s' }} onMouseEnter={e => e.target.style.background = '#6B8A74'} onMouseLeave={e => e.target.style.background = '#7F9F88'}>
                <span>Empezar</span>
                <ArrowRight size={16} />
              </button>
              <button className="btn btn-outline" onClick={() => scrollToAccess('psicologo')} style={{ height: '48px', paddingInline: '26px', fontWeight: 'bold', borderRadius: '999px', color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', textTransform: 'none', letterSpacing: 'normal', fontSize: '0.82rem', background: 'transparent' }} onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                <span>Soy psicólogo</span>
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#9AA6AB', marginTop: '10px' }}>
              <ShieldCheck size={16} color="#7F9F88" />
              <span>La IA acompaña, organiza y resume; el criterio clínico siempre es humano.</span>
            </div>
          </div>
          
          <div className="desktop-only" />
        </div>
      </section>

      {/* TRUST STRIP (Caja blanca con sombra suave y textos Navy con separadores) */}
      <section style={{ padding: '0 24px', position: 'relative', zIndex: 10 }}>
        <div style={{
          background: '#ffffff',
          border: '1px solid rgba(5, 33, 58, 0.08)',
          borderRadius: '16px',
          padding: '24px 20px',
          maxWidth: '1180px',
          margin: '-35px auto 45px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          boxShadow: '0 10px 30px rgba(5, 33, 58, 0.06)',
        }}>
          
          <div className="trust-item" style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '10px 16px', borderRight: '1px solid rgba(5, 33, 58, 0.08)' }}>
            <div className="flex-center" style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(127, 159, 136, 0.3)', color: '#7F9F88', flexShrink: 0 }}>
              <User size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#05213A', display: 'block', fontWeight: 'bold' }}>Psicólogos colegiados</strong>
              <span style={{ fontSize: '0.72rem', color: '#5F6F74' }}>Profesionales verificados y habilitados.</span>
            </div>
          </div>

          <div className="trust-item" style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '10px 16px', borderRight: '1px solid rgba(5, 33, 58, 0.08)' }}>
            <div className="flex-center" style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(127, 159, 136, 0.3)', color: '#7F9F88', flexShrink: 0 }}>
              <Lock size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#05213A', display: 'block', fontWeight: 'bold' }}>Privacidad reforzada</strong>
              <span style={{ fontSize: '0.72rem', color: '#5F6F74' }}>Cifrado de extremo a extremo y datos en servidores seguros.</span>
            </div>
          </div>

          <div className="trust-item" style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '10px 16px', borderRight: '1px solid rgba(5, 33, 58, 0.08)' }}>
            <div className="flex-center" style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(127, 159, 136, 0.3)', color: '#7F9F88', flexShrink: 0 }}>
              <Calendar size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#05213A', display: 'block', fontWeight: 'bold' }}>Seguimiento diario</strong>
              <span style={{ fontSize: '0.72rem', color: '#5F6F74' }}>Acompañamiento guiado 7 días a la semana.</span>
            </div>
          </div>

          <div className="trust-item" style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '10px 16px' }}>
            <div className="flex-center" style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1px solid rgba(127, 159, 136, 0.3)', color: '#7F9F88', flexShrink: 0 }}>
              <Brain size={20} />
            </div>
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#05213A', display: 'block', fontWeight: 'bold' }}>No sustituye el criterio clínico</strong>
              <span style={{ fontSize: '0.72rem', color: '#5F6F74' }}>La plataforma apoya, el psicólogo decide.</span>
            </div>
          </div>

        </div>
      </section>

      {/* SECCIÓN "PARA PACIENTES" */}
      <section ref={pacientesRef} style={{ padding: '80px 24px', background: '#F8F6F1' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }} className="landing-section-grid">
          
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 'normal', fontFamily: serifFont, color: '#05213A', margin: 0 }}>Para pacientes</h2>
            <p style={{ fontSize: '0.9rem', color: '#5F6F74', marginTop: '8px', lineHeight: 1.5 }}>
              Más acompañamiento, claridad y herramientas para tu bienestar.
            </p>
            <div style={{ width: '40px', height: '3px', background: '#7F9F88', marginTop: '16px' }} />
          </div>

          <div className="landing-cards-row">
            
            <div className="landing-benefit-card">
              <div className="benefit-icon-circle">
                <MessageSquare size={20} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#05213A', marginBottom: '8px' }}>Chat diario guiado</h4>
              <p style={{ fontSize: '0.82rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                Conversaciones breves que te ayudan a comprender cómo estás y qué necesitas.
              </p>
            </div>

            <div className="landing-benefit-card">
              <div className="benefit-icon-circle">
                <FileText size={20} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#05213A', marginBottom: '8px' }}>Diario emocional</h4>
              <p style={{ fontSize: '0.82rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                Registra lo que sientes con prompts clínicos diseñados por psicólogos.
              </p>
            </div>

            <div className="landing-benefit-card">
              <div className="benefit-icon-circle">
                <ClipboardList size={20} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#05213A', marginBottom: '8px' }}>Historial organizado</h4>
              <p style={{ fontSize: '0.82rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                Todo tu proceso en un solo lugar: sesiones, notas y seguimientos.
              </p>
            </div>

            <div className="landing-benefit-card">
              <div className="benefit-icon-circle">
                <Activity size={20} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#05213A', marginBottom: '8px' }}>Continuidad entre sesiones</h4>
              <p style={{ fontSize: '0.82rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                No estás solo entre citas. Mantén el impulso cada día.
              </p>
            </div>

            <div className="landing-benefit-card">
              <div className="benefit-icon-circle">
                <Lock size={20} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#05213A', marginBottom: '8px' }}>Privacidad total</h4>
              <p style={{ fontSize: '0.82rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                Tú decides qué se comparte. Tus datos están siempre protegidos.
              </p>
            </div>

            <div className="landing-benefit-card">
              <div className="benefit-icon-circle">
                <Award size={20} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#05213A', marginBottom: '8px' }}>Mejor preparación para tu terapia</h4>
              <p style={{ fontSize: '0.82rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                Llegas a sesión con más claridad sobre lo que te pasa.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SECCIÓN "PARA PSICÓLOGOS" */}
      <section ref={psicologosRef} style={{ padding: '80px 24px', background: '#F8F6F1', borderTop: '1px solid rgba(5, 33, 58, 0.05)', borderBottom: '1px solid rgba(5, 33, 58, 0.05)' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }} className="landing-section-grid">
          
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 'normal', fontFamily: serifFont, color: '#05213A', margin: 0 }}>Para psicólogos</h2>
            <p style={{ fontSize: '0.9rem', color: '#5F6F74', marginTop: '8px', lineHeight: 1.5 }}>
              Herramientas clínicas inteligentes que optimizan tu práctica sin comprometer lo humano.
            </p>
            <div style={{ width: '40px', height: '3px', background: '#7F9F88', marginTop: '16px' }} />
          </div>

          <div className="landing-cards-row">
            
            <div className="landing-benefit-card">
              <div className="benefit-icon-circle-gold">
                <Calendar size={20} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#05213A', marginBottom: '8px' }}>Briefing semanal</h4>
              <p style={{ fontSize: '0.82rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                Resumen claro de los últimos 7 días: estado emocional, temas clave y avances.
              </p>
            </div>

            <div className="landing-benefit-card">
              <div className="benefit-icon-circle-gold">
                <Activity size={20} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#05213A', marginBottom: '8px' }}>Panel clínico raw-first</h4>
              <p style={{ fontSize: '0.82rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                Accede a los datos originales antes de cualquier resumen automático.
              </p>
            </div>

            <div className="landing-benefit-card">
              <div className="benefit-icon-circle-gold">
                <ClipboardList size={20} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#05213A', marginBottom: '8px' }}>Notas SOAP asistidas</h4>
              <p style={{ fontSize: '0.82rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                Borradores estructurados que ahorran tiempo sin reemplazar tu juicio clínico.
              </p>
            </div>

            <div className="landing-benefit-card">
              <div className="benefit-icon-circle-gold">
                <AlertTriangle size={20} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#05213A', marginBottom: '8px' }}>Alertas y patrones</h4>
              <p style={{ fontSize: '0.82rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                Señales tempranas y patrones relevantes para intervenir a tiempo.
              </p>
            </div>

            <div className="landing-benefit-card">
              <div className="benefit-icon-circle-gold">
                <CheckCircle2 size={20} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#05213A', marginBottom: '8px' }}>Menos carga administrativa</h4>
              <p style={{ fontSize: '0.82rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                Automatización segura de tareas repetitivas y organización.
              </p>
            </div>

            <div className="landing-benefit-card">
              <div className="benefit-icon-circle-gold">
                <User size={20} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#05213A', marginBottom: '8px' }}>Mejor contexto del paciente</h4>
              <p style={{ fontSize: '0.82rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                Entiende la evolución entre sesiones y toma decisiones informadas.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SECCIÓN "CÓMO FUNCIONA" */}
      <section ref={comoFuncionaRef} style={{ padding: '80px 24px', background: '#F8F6F1' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '50px' }}>
          
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 'normal', fontFamily: serifFont, color: '#05213A' }}>Cómo funciona</h2>
            <p style={{ fontSize: '0.9rem', color: '#5F6F74', marginTop: '8px' }}>
              Un proceso fluido e integrado para consolidar tu salud mental.
            </p>
          </div>

          <div className="timeline-container">
            
            <div className="timeline-step">
              <div className="timeline-step-node">
                <div className="step-number">1</div>
                <div className="step-icon-circle">
                  <UserPlus size={18} />
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#05213A', marginBottom: '6px' }}>Onboarding y triaje</h4>
                <p style={{ fontSize: '0.78rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                  Creas tu cuenta y respondes un breve cuestionario para personalizar tu experiencia y asignar tu psicólogo.
                </p>
              </div>
            </div>

            <div className="timeline-step">
              <div className="timeline-step-node">
                <div className="step-number">2</div>
                <div className="step-icon-circle">
                  <MessageSquare size={18} />
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#05213A', marginBottom: '6px' }}>Seguimiento diario</h4>
                <p style={{ fontSize: '0.78rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                  Áncora te acompaña cada día con conversaciones guiadas, ejercicios y registro emocional.
                </p>
              </div>
            </div>

            <div className="timeline-step">
              <div className="timeline-step-node">
                <div className="step-number">3</div>
                <div className="step-icon-circle">
                  <User size={18} />
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#05213A', marginBottom: '6px' }}>Revisión profesional</h4>
                <p style={{ fontSize: '0.78rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                  Tu psicólogo revisa tu evolución, la información relevante y prepara cada sesión con mejor contexto.
                </p>
              </div>
            </div>

            <div className="timeline-step">
              <div className="timeline-step-node">
                <div className="step-number">4</div>
                <div className="step-icon-circle">
                  <TrendingUp size={18} />
                </div>
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#05213A', marginBottom: '6px' }}>Evolución continua</h4>
                <p style={{ fontSize: '0.78rem', color: '#5F6F74', lineHeight: 1.5, margin: 0 }}>
                  Ajustas objetivos, celebras avances y mantienes el progreso a largo plazo.
                </p>
              </div>
            </div>

          </div>

          <div style={{ 
            background: '#ffffff', 
            padding: '16px 24px', 
            borderRadius: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            maxWidth: '750px',
            margin: '20px auto 0',
            border: '1px solid rgba(127, 159, 136, 0.3)',
            boxShadow: '0 4px 15px rgba(5, 33, 58, 0.01)'
          }}>
            <div className="flex-center" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(127, 159, 136, 0.1)', color: '#7F9F88', flexShrink: 0 }}>
              <ShieldCheck size={16} />
            </div>
            <p style={{ fontSize: '0.78rem', color: '#5F6F74', margin: 0, lineHeight: 1.45, textAlign: 'left' }}>
              Tu psicólogo es el centro de tu tratamiento. La tecnología está al servicio de la relación terapéutica.
            </p>
          </div>

        </div>
      </section>

      {/* SECCIÓN INTERACTIVA: SMARTPHONE Y PORTÁTIL LADO A LADO */}
      <section style={{ position: 'relative', padding: '80px 24px', background: '#ffffff', borderTop: '1px solid rgba(5, 33, 58, 0.05)', borderBottom: '1px solid rgba(5, 33, 58, 0.05)', overflow: 'hidden' }}>
        
        {/* Hojas Decorativas SVG Absolutas (Fidelidad de Mockup) */}
        <div style={{ position: 'absolute', left: '-50px', top: '15%', opacity: 0.12, pointerEvents: 'none', zIndex: 1 }} className="desktop-only">
          <svg width="220" height="380" viewBox="0 0 220 380" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 370 C 50 300, 110 200, 100 10 C 95 60, 60 120, 20 160 C 50 150, 120 180, 150 240 C 100 230, 60 270, 30 320 C 70 300, 150 320, 200 370" stroke="#7F9F88" strokeWidth="6" strokeLinecap="round" />
            <path d="M100 80 C 130 60, 170 80, 190 120 C 150 120, 120 100, 100 80 Z" fill="#7F9F88" />
            <path d="M60 180 C 80 160, 120 170, 140 210 C 110 210, 80 190, 60 180 Z" fill="#7F9F88" />
            <path d="M35 280 C 55 260, 95 270, 115 310 C 85 310, 55 290, 35 280 Z" fill="#7F9F88" />
          </svg>
        </div>

        <div style={{ position: 'absolute', right: '-50px', bottom: '15%', opacity: 0.12, pointerEvents: 'none', zIndex: 1 }} className="desktop-only">
          <svg width="220" height="380" viewBox="0 0 220 380" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'scaleX(-1)' }}>
            <path d="M10 370 C 50 300, 110 200, 100 10 C 95 60, 60 120, 20 160 C 50 150, 120 180, 150 240 C 100 230, 60 270, 30 320 C 70 300, 150 320, 200 370" stroke="#7F9F88" strokeWidth="6" strokeLinecap="round" />
            <path d="M100 80 C 130 60, 170 80, 190 120 C 150 120, 120 100, 100 80 Z" fill="#7F9F88" />
            <path d="M60 180 C 80 160, 120 170, 140 210 C 110 210, 80 190, 60 180 Z" fill="#7F9F88" />
            <path d="M35 280 C 55 260, 95 270, 115 310 C 85 310, 55 290, 35 280 Z" fill="#7F9F88" />
          </svg>
        </div>

        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px', position: 'relative', zIndex: 2 }}>
          
          <div style={{ textAlign: 'center' }}>
            <span className="badge" style={{ background: 'rgba(68, 125, 130, 0.1)', color: '#447D82', marginBottom: '10px' }}>El ecosistema completo</span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 'normal', color: '#05213A', fontFamily: serifFont, margin: 0 }}>Todo lo que necesitas, en un solo lugar</h2>
          </div>

          <div className="devices-section-grid">
            
            {/* Viñetas Paciente (Izquierda) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#05213A', fontFamily: serifFont, margin: 0 }}>Experiencia Paciente</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={16} color="#7F9F88" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: '#5F6F74', lineHeight: 1.4 }}>Conversación guiada cada día</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={16} color="#7F9F88" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: '#5F6F74', lineHeight: 1.4 }}>Ejercicios basados en evidencia</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={16} color="#7F9F88" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: '#5F6F74', lineHeight: 1.4 }}>Seguimiento de ánimo y activadores</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={16} color="#7F9F88" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: '#5F6F74', lineHeight: 1.4 }}>Privacidad y control de tus datos</span>
                </div>
              </div>
            </div>

            {/* Smartphone Mockup */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ 
                width: '270px', 
                height: '520px', 
                borderRadius: '36px', 
                border: '12px solid #111827', 
                background: '#040d1a',
                boxShadow: '0 20px 40px rgba(5, 33, 58, 0.15)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                {/* Notch */}
                <div style={{ width: '100px', height: '18px', background: '#111827', borderRadius: '0 0 16px 16px', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }} />
                
                {/* Header */}
                <div style={{ padding: '24px 14px 10px', background: 'rgba(5, 33, 58, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div className="flex-center" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', color: '#447D82' }}>
                    <Brain size={14} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.72rem', color: '#ffffff', display: 'block' }}>Ánquer IA</strong>
                    <span style={{ fontSize: '0.52rem', color: '#7F9F88', fontWeight: 'bold' }}>Acompañamiento Activo</span>
                  </div>
                </div>

                {/* Chat content */}
                <div style={{ flex: 1, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', fontSize: '0.68rem', textAlign: 'left' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px 8px 8px 0', border: '1px solid rgba(255,255,255,0.05)', alignSelf: 'flex-start', maxWidth: '90%', color: '#9AA6AB' }}>
                    Hola José. He observado en tus registros que presentas inquietud laboral esta mañana. ¿Qué pensamientos te causan tensión?
                  </div>
                  
                  <div style={{ background: 'rgba(68,125,130,0.15)', padding: '10px', borderRadius: '8px 8px 0 8px', border: '1px solid rgba(68,125,130,0.3)', alignSelf: 'flex-end', maxWidth: '90%', color: '#ffffff' }}>
                    Me agobia pensar que no podré entregar el proyecto a tiempo y defraudaré a mi equipo.
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px 8px 8px 0', border: '1px solid rgba(255,255,255,0.05)', alignSelf: 'flex-start', maxWidth: '90%', color: '#9AA6AB' }}>
                    Entiendo. Anoto este disparador de autoexigencia para tu próxima sesión con Lucía. Recuerda realizar la respiración de rescate de 2 minutos.
                  </div>
                </div>

                {/* Input area */}
                <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '6px' }}>
                  <div style={{ flex: 1, height: '28px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', paddingLeft: '10px', fontSize: '0.62rem', display: 'flex', alignItems: 'center', color: '#5F6F74' }}>
                    Escribe tu respuesta...
                  </div>
                  <div className="flex-center" style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#447D82', color: '#ffffff' }}>
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            </div>

            {/* Laptop Mockup */}
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
              <div style={{ 
                width: '100%', 
                maxWidth: '520px',
                height: '350px',
                background: '#040d1a',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                boxShadow: '0 20px 40px rgba(5, 33, 58, 0.25)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {/* Cabecera del Navegador */}
                <div style={{ padding: '8px 16px', background: 'rgba(5, 33, 58, 0.95)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f43f5e' }} />
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eab308' }} />
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <span style={{ fontSize: '0.58rem', color: '#5F6F74', background: 'rgba(0,0,0,0.2)', padding: '2px 30px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      ancora.clinic/pro/dashboard
                    </span>
                  </div>
                </div>

                {/* Contenido del Panel */}
                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '110px 1fr', fontSize: '0.62rem', height: 'calc(100% - 25px)' }}>
                  
                  {/* Sidebar */}
                  <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', background: '#030a14', textAlign: 'left' }}>
                    <span style={{ color: '#5F6F74', fontSize: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase' }}>Clínica</span>
                    <div style={{ background: 'rgba(68,125,130,0.1)', color: '#447D82', padding: '4px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Dashboard</div>
                    <div style={{ color: '#9AA6AB', padding: '4px 6px' }}>Pacientes</div>
                    <div style={{ color: '#9AA6AB', padding: '4px 6px' }}>SOAP Notes</div>
                    <div style={{ color: '#9AA6AB', padding: '4px 6px' }}>Ajustes</div>
                  </div>

                  {/* Detalle */}
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', textAlign: 'left' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '0.72rem', color: '#ffffff' }}>María Fernanda Rodríguez — Expediente</strong>
                      <span className="badge badge-rose" style={{ fontSize: '0.5rem', padding: '2px 6px' }}>Riesgo Moderado</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px' }}>
                        <span style={{ color: '#5F6F74', display: 'block', fontSize: '0.52rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Datos de Sensaciones IA</span>
                        <p style={{ margin: 0, color: '#9AA6AB', fontStyle: 'italic', lineHeight: 1.2, fontSize: '0.58rem' }}>
                          "Siento opresión torácica intensa y pensamientos catastrofistas recurrentes..."
                        </p>
                      </div>
                      
                      <div style={{ background: 'rgba(68,125,130,0.02)', border: '1px solid rgba(68,125,130,0.15)', padding: '8px', borderRadius: '6px' }}>
                        <span style={{ color: '#447D82', display: 'block', fontSize: '0.52rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Notas SOAP sugeridas</span>
                        <div style={{ color: '#9AA6AB', lineHeight: 1.2, fontSize: '0.58rem' }}>
                          <strong>S:</strong> Disnea subjetiva matutina.<br />
                          <strong>O:</strong> Adherencia al diario 92%.
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', padding: '8px', borderRadius: '6px' }}>
                      <span style={{ color: '#5F6F74', display: 'block', fontSize: '0.52rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '2px' }}>Timeline emocional (últimos 30 días)</span>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '40px', paddingTop: '10px' }}>
                        <div style={{ flex: 1, height: '40%', background: '#7F9F88', borderRadius: '2px' }} />
                        <div style={{ flex: 1, height: '60%', background: '#7F9F88', borderRadius: '2px' }} />
                        <div style={{ flex: 1, height: '30%', background: '#f43f5e', borderRadius: '2px' }} />
                        <div style={{ flex: 1, height: '80%', background: '#447D82', borderRadius: '2px' }} />
                        <div style={{ flex: 1, height: '90%', background: '#447D82', borderRadius: '2px' }} />
                        <div style={{ flex: 1, height: '75%', background: '#7F9F88', borderRadius: '2px' }} />
                        <div style={{ flex: 1, height: '85%', background: '#447D82', borderRadius: '2px' }} />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Viñetas Psicólogo (Derecha) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#05213A', fontFamily: serifFont, margin: 0 }}>Experiencia Psicólogo</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={16} color="#7F9F88" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: '#5F6F74', lineHeight: 1.4 }}>Contexto clínico organizado</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={16} color="#7F9F88" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: '#5F6F74', lineHeight: 1.4 }}>Datos raw + resúmenes inteligentes</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={16} color="#7F9F88" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: '#5F6F74', lineHeight: 1.4 }}>Alertas y patrones tempranos</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <CheckCircle2 size={16} color="#7F9F88" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: '#5F6F74', lineHeight: 1.4 }}>Notas SOAP asistidas</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* MARKETPLACE DE PSICÓLOGOS (DIRECTORIO PÚBLICO CON CONSULTA REAL A SUPABASE) */}
      <section ref={marketplaceRef} style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div style={{ textAlign: 'center' }}>
            <span className="badge" style={{ background: 'rgba(68, 125, 130, 0.1)', color: '#447D82', marginBottom: '10px' }}>Directorio Profesional</span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 'normal', color: '#05213A', fontFamily: serifFont }}>Elige a tu Psicólogo Clínico Verificado</h2>
            <p style={{ fontSize: '0.82rem', color: '#5F6F74', marginTop: '4px' }}>
              Encuentra profesionales sanitarios con colegiación activa y especialidades compatibles con tu triaje.
            </p>
          </div>

          {/* BARRA DE BÚSQUEDA Y FILTROS INTERACTIVOS */}
          <div style={{ background: '#ffffff', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(5, 33, 58, 0.05)', borderRadius: '12px', boxShadow: '0 4px 20px rgba(5, 33, 58, 0.02)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              
              {/* Buscador de Texto */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.68rem', color: '#5F6F74' }}>Buscar por nombre o palabra clave</label>
                <div style={{ position: 'relative' }}>
                  <Search size={15} color="#5F6F74" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                  <input 
                    type="text" 
                    className="form-input" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ej. Lucía, ansiedad, sueño..." 
                    style={{ paddingLeft: '36px', height: '38px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid rgba(5, 33, 58, 0.15)', background: '#F8F6F1', color: '#05213A' }}
                  />
                </div>
              </div>

              {/* Selector de Especialidades */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.68rem', color: '#5F6F74' }}>Especialidad clínica</label>
                <select 
                  className="form-select" 
                  value={selectedSpecialty}
                  onChange={(e) => setSelectedSpecialty(e.target.value)}
                  style={{ height: '38px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid rgba(5, 33, 58, 0.15)', background: '#F8F6F1', color: '#05213A' }}
                >
                  {specialtiesList.map(spec => (
                    <option key={spec} value={spec}>{spec === 'Todas' ? 'Todas las especialidades' : spec}</option>
                  ))}
                </select>
              </div>

              {/* Selector de Disponibilidad */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.68rem', color: '#5F6F74' }}>Disponibilidad más cercana</label>
                <select 
                  className="form-select" 
                  value={selectedAvailability}
                  onChange={(e) => setSelectedAvailability(e.target.value)}
                  style={{ height: '38px', fontSize: '0.78rem', borderRadius: '6px', border: '1px solid rgba(5, 33, 58, 0.15)', background: '#F8F6F1', color: '#05213A' }}
                >
                  <option value="Cualquiera">Cualquier fecha</option>
                  <option value="Hoy mismo">Hoy mismo</option>
                  <option value="Esta semana">Esta semana</option>
                </select>
              </div>

              {/* Filtro de Precio Máximo */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.68rem', display: 'flex', justifyContent: 'space-between', color: '#5F6F74' }}>
                  <span>Precio Máximo por Sesión</span>
                  <strong style={{ color: '#447D82' }}>{maxPrice} €</strong>
                </label>
                <input 
                  type="range" 
                  min="40" 
                  max="100" 
                  step="5" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#447D82', cursor: 'pointer', marginTop: '6px' }}
                />
              </div>

            </div>
          </div>

          {/* LISTADO DE TARJETAS DE PSICÓLOGOS */}
          {loadingPsychologists ? (
            <div className="flex-center" style={{ padding: '60px 0', flexDirection: 'column', gap: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid rgba(5, 33, 58, 0.1)', borderTopColor: '#447D82', animation: 'pulse-soft 1s infinite alternate' }} />
              <span style={{ fontSize: '0.75rem', color: '#5F6F74' }}>Consultando base de datos de terapeutas sanitarios...</span>
            </div>
          ) : errorPsychologists ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--color-rose)', background: 'rgba(244,63,94,0.05)', border: '1px dashed rgba(244,63,94,0.2)', borderRadius: '10px' }}>
              {errorPsychologists}
            </div>
          ) : filteredPsychologists.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#5F6F74', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(5, 33, 58, 0.1)', borderRadius: '10px', fontSize: '0.8rem' }}>
              Ningún psicólogo verificado coincide con los filtros de búsqueda aplicados.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '18px' }}>
              {filteredPsychologists.map((psico) => (
                <div 
                  key={psico.id}
                  style={{ 
                    padding: '20px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    gap: '14px',
                    border: '1px solid rgba(5, 33, 58, 0.08)',
                    borderRadius: '12px',
                    background: '#ffffff',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(5, 33, 58, 0.01)'
                  }}
                  onClick={() => setSelectedPsychologist(psico)}
                >
                  <div>
                    {/* Fila superior avatar y rating */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '10px' }}>
                      <img 
                        src={psico.photo_url} 
                        alt={psico.name} 
                        style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(5, 33, 58, 0.1)' }}
                      />
                      <div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#05213A', margin: 0 }}>{psico.name}</h4>
                        <span style={{ fontSize: '0.62rem', color: '#5F6F74', display: 'block' }}>Colegiado: {psico.license_number}</span>
                        
                        {/* Rating */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Star size={11} fill="#f59e0b" color="#f59e0b" />
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#05213A' }}>{psico.rating_avg}</span>
                          <span style={{ fontSize: '0.6rem', color: '#5F6F74' }}>({psico.rating_count})</span>
                        </div>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.72rem', color: '#5F6F74', lineHeight: 1.4, margin: '6px 0 10px 0', height: '4ch', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {psico.bio}
                    </p>

                    {/* Especialidades */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                      {psico.specialties.slice(0, 3).map((spec) => (
                        <span key={spec} className="badge" style={{ fontSize: '0.58rem', padding: '2px 6px', background: '#F8F6F1', border: '1px solid rgba(5, 33, 58, 0.08)', color: '#5F6F74', textTransform: 'none' }}>
                          {spec}
                        </span>
                      ))}
                      {psico.specialties.length > 3 && (
                        <span style={{ fontSize: '0.6rem', color: '#5F6F74', alignSelf: 'center' }}>+{psico.specialties.length - 3}</span>
                      )}
                    </div>
                  </div>

                  {/* Fila inferior de disponibilidad y precio */}
                  <div style={{ borderTop: '1px solid rgba(5, 33, 58, 0.05)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                    <div>
                      <span style={{ color: '#5F6F74', display: 'block', fontSize: '0.6rem' }}>Disponible:</span>
                      <strong style={{ color: '#7F9F88' }}>{psico.availability}</strong>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#5F6F74', display: 'block', fontSize: '0.6rem' }}>Sesión:</span>
                      <strong style={{ color: '#05213A', fontSize: '0.85rem' }}>{psico.session_price} €</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </section>

      {/* SECCIÓN DE PRECIOS Y TARIFAS COMPLETAS (TABS INTERACTIVOS) */}
      <section ref={planesRef} style={{ padding: '60px 24px' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div style={{ textAlign: 'center' }}>
            <span className="badge" style={{ background: 'rgba(127, 159, 136, 0.15)', color: '#7F9F88', marginBottom: '10px' }}>Finanzas Transparentes</span>
            <h2 style={{ fontSize: '2.4rem', fontWeight: 'normal', color: '#05213A', fontFamily: serifFont }}>Tarifas de ÁNCORA</h2>
            <p style={{ fontSize: '0.85rem', color: '#5F6F74', marginTop: '4px' }}>
              Sin tarifas ocultas. División directa de pagos mediante Stripe Connect Split Payments.
            </p>
          </div>

          {/* Pricing Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', background: '#ffffff', padding: '6px', borderRadius: '12px', border: '1px solid rgba(5, 33, 58, 0.08)', maxWidth: '380px', margin: '0 auto' }}>
            <button 
              onClick={() => setPricingTab('paciente')} 
              className={`btn ${pricingTab === 'paciente' ? 'btn-cyan' : 'btn-outline'}`}
              style={{ flex: 1, height: '36px', fontSize: '0.75rem', border: 'none', borderRadius: '8px', textTransform: 'none', letterSpacing: 'normal' }}
            >
              Planes Pacientes
            </button>
            <button 
              onClick={() => setPricingTab('psicologo')} 
              className={`btn ${pricingTab === 'psicologo' ? 'btn-cyan' : 'btn-outline'}`}
              style={{ flex: 1, height: '36px', fontSize: '0.75rem', border: 'none', borderRadius: '8px', textTransform: 'none', letterSpacing: 'normal' }}
            >
              Planes Psicólogos
            </button>
          </div>

          {/* 1. PLANES PACIENTES */}
          {pricingTab === 'paciente' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              
              <div style={{ padding: '28px', background: '#ffffff', border: '1px solid rgba(5, 33, 58, 0.05)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid #7F9F88', boxShadow: '0 4px 20px rgba(5, 33, 58, 0.02)' }}>
                <div>
                  <span className="badge" style={{ background: 'rgba(127, 159, 136, 0.15)', color: '#7F9F88', fontSize: '0.58rem', textTransform: 'none' }}>Encuadre inicial</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#05213A', marginTop: '10px' }}>Onboarding</h3>
                  <p style={{ fontSize: '0.76rem', color: '#5F6F74', height: '4ch', overflow: 'hidden', margin: '4px 0 0 0' }}>Primera toma de contacto y triaje asistido.</p>
                  <div style={{ margin: '14px 0', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <strong style={{ fontSize: '1.8rem', color: '#05213A' }}>49 €</strong>
                    <span style={{ fontSize: '0.7rem', color: '#5F6F74' }}>Pago único</span>
                  </div>
                  <ul style={{ paddingLeft: '14px', fontSize: '0.75rem', color: '#5F6F74', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
                    <li>Triaje clínico (PHQ-9/GAD-7)</li>
                    <li>Asignación de terapeuta</li>
                    <li>Sesión de encuadre (60 min)</li>
                    <li>Historial estructurado</li>
                  </ul>
                </div>
                <button onClick={() => scrollToAccess('paciente')} className="btn" style={{ width: '100%', height: '38px', fontSize: '0.74rem', borderRadius: '6px', marginTop: 'auto', background: '#7F9F88', color: '#ffffff', fontWeight: 'bold', textTransform: 'none', letterSpacing: 'normal' }}>
                  Elegir plan
                </button>
              </div>

              <div style={{ padding: '28px', background: '#ffffff', border: '1px solid rgba(5, 33, 58, 0.05)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid #447D82', boxShadow: '0 4px 20px rgba(5, 33, 58, 0.02)' }}>
                <div>
                  <span className="badge" style={{ background: 'rgba(68, 125, 130, 0.1)', color: '#447D82', fontSize: '0.58rem', textTransform: 'none' }}>Básico</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#05213A', marginTop: '10px' }}>Plan Esencial</h3>
                  <p style={{ fontSize: '0.76rem', color: '#5F6F74', height: '4ch', overflow: 'hidden', margin: '4px 0 0 0' }}>Continuidad diaria y soporte clínico básico.</p>
                  <div style={{ margin: '14px 0', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <strong style={{ fontSize: '1.8rem', color: '#05213A' }}>69 €</strong>
                    <span style={{ fontSize: '0.7rem', color: '#5F6F74' }}>/ mes</span>
                  </div>
                  <ul style={{ paddingLeft: '14px', fontSize: '0.75rem', color: '#5F6F74', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
                    <li>Chat IA diario (15 min/día)</li>
                    <li>Diario de sensaciones</li>
                    <li>Expediente clínico portable</li>
                    <li>1 revisión/sesión mensual</li>
                  </ul>
                </div>
                <button onClick={() => scrollToAccess('paciente')} className="btn btn-cyan" style={{ width: '100%', height: '38px', fontSize: '0.74rem', borderRadius: '6px', marginTop: 'auto', fontWeight: 'bold', textTransform: 'none', letterSpacing: 'normal' }}>
                  Elegir plan
                </button>
              </div>

              <div style={{ padding: '28px', background: '#ffffff', border: '1px solid rgba(5, 33, 58, 0.05)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid #447D82', boxShadow: '0 4px 20px rgba(5, 33, 58, 0.02)', background: 'rgba(68, 125, 130, 0.02)', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.55rem', background: '#447D82', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>RECOMENDADO</span>
                <div>
                  <span className="badge" style={{ background: 'rgba(68, 125, 130, 0.1)', color: '#447D82', fontSize: '0.58rem', textTransform: 'none' }}>Medio</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#05213A', marginTop: '10px' }}>Plan Intermedio</h3>
                  <p style={{ fontSize: '0.76rem', color: '#5F6F74', height: '4ch', overflow: 'hidden', margin: '4px 0 0 0' }}>Seguimiento semanal y pautas de objetivos.</p>
                  <div style={{ margin: '14px 0', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <strong style={{ fontSize: '1.8rem', color: '#05213A' }}>99 €</strong>
                    <span style={{ fontSize: '0.7rem', color: '#5F6F74' }}>/ mes</span>
                  </div>
                  <ul style={{ paddingLeft: '14px', fontSize: '0.75rem', color: '#5F6F74', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
                    <li>Todo el Plan Esencial</li>
                    <li>Revisión semanal breve</li>
                    <li>Monitoreo de objetivos</li>
                    <li>Preparación semanal de sesión</li>
                  </ul>
                </div>
                <button onClick={() => scrollToAccess('paciente')} className="btn btn-cyan" style={{ width: '100%', height: '38px', fontSize: '0.74rem', borderRadius: '6px', marginTop: 'auto', fontWeight: 'bold', textTransform: 'none', letterSpacing: 'normal' }}>
                  Elegir plan
                </button>
              </div>

              <div style={{ padding: '28px', background: '#ffffff', border: '1px solid rgba(5, 33, 58, 0.05)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid #447D82', boxShadow: '0 4px 20px rgba(5, 33, 58, 0.02)' }}>
                <div>
                  <span className="badge" style={{ background: 'rgba(68, 125, 130, 0.1)', color: '#447D82', fontSize: '0.58rem', textTransform: 'none' }}>Intenso</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#05213A', marginTop: '10px' }}>Plan Intensivo</h3>
                  <p style={{ fontSize: '0.76rem', color: '#5F6F74', height: '4ch', overflow: 'hidden', margin: '4px 0 0 0' }}>Máxima frecuencia clínica para alta necesidad.</p>
                  <div style={{ margin: '14px 0', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <strong style={{ fontSize: '1.8rem', color: '#05213A' }}>159 €</strong>
                    <span style={{ fontSize: '0.7rem', color: '#5F6F74' }}>/ mes</span>
                  </div>
                  <ul style={{ paddingLeft: '14px', fontSize: '0.75rem', color: '#5F6F74', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
                    <li>Todo el Plan Intermedio</li>
                    <li>Revisiones asíncronas frecuentes</li>
                    <li>Video-briefings semanales</li>
                    <li>Prioridad en la agenda</li>
                  </ul>
                </div>
                <button onClick={() => scrollToAccess('paciente')} className="btn btn-cyan" style={{ width: '100%', height: '38px', fontSize: '0.74rem', borderRadius: '6px', marginTop: 'auto', fontWeight: 'bold', textTransform: 'none', letterSpacing: 'normal' }}>
                  Elegir plan
                </button>
              </div>

            </div>
          )}

          {/* 2. PLANES PSICÓLOGOS */}
          {pricingTab === 'psicologo' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              
              <div style={{ padding: '28px', background: '#ffffff', border: '1px solid rgba(5, 33, 58, 0.05)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid #7F9F88', boxShadow: '0 4px 20px rgba(5, 33, 58, 0.02)' }}>
                <div>
                  <span className="badge" style={{ background: 'rgba(127, 159, 136, 0.15)', color: '#7F9F88', fontSize: '0.58rem', textTransform: 'none' }}>Entrada</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#05213A', marginTop: '10px' }}>Plan Gratis</h3>
                  <p style={{ fontSize: '0.76rem', color: '#5F6F74', height: '4ch', overflow: 'hidden', margin: '4px 0 0 0' }}>Iniciación profesional sin fricción.</p>
                  <div style={{ margin: '14px 0', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <strong style={{ fontSize: '1.8rem', color: '#05213A' }}>0 €</strong>
                    <span style={{ fontSize: '0.7rem', color: '#5F6F74' }}>/ mes</span>
                  </div>
                  <ul style={{ paddingLeft: '14px', fontSize: '0.75rem', color: '#5F6F74', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
                    <li>Perfil público en el directorio</li>
                    <li>Hasta 5 pacientes vinculados</li>
                    <li>Videollamadas básicas</li>
                    <li>Acceso a diario IA</li>
                  </ul>
                </div>
                <button onClick={() => scrollToAccess('psicologo')} className="btn" style={{ width: '100%', height: '38px', fontSize: '0.74rem', borderRadius: '6px', marginTop: 'auto', background: '#7F9F88', color: '#ffffff', fontWeight: 'bold', textTransform: 'none', letterSpacing: 'normal' }}>
                  Unirme gratis
                </button>
              </div>

              <div style={{ padding: '28px', background: '#ffffff', border: '1px solid rgba(5, 33, 58, 0.05)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid #7F9F88', boxShadow: '0 4px 20px rgba(5, 33, 58, 0.02)' }}>
                <div>
                  <span className="badge" style={{ background: 'rgba(127, 159, 136, 0.15)', color: '#7F9F88', fontSize: '0.58rem', textTransform: 'none' }}>SaaS Básico</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#05213A', marginTop: '10px' }}>Plan Básico</h3>
                  <p style={{ fontSize: '0.76rem', color: '#5F6F74', height: '4ch', overflow: 'hidden', margin: '4px 0 0 0' }}>Para consultas individuales medianas.</p>
                  <div style={{ margin: '14px 0', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <strong style={{ fontSize: '1.8rem', color: '#05213A' }}>29 €</strong>
                    <span style={{ fontSize: '0.7rem', color: '#5F6F74' }}>/ mes</span>
                  </div>
                  <ul style={{ paddingLeft: '14px', fontSize: '0.75rem', color: '#5F6F74', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
                    <li>Hasta 20 pacientes</li>
                    <li>Smart SOAP automático</li>
                    <li>Gráficos de adherencia</li>
                    <li>Agenda y estadísticas</li>
                  </ul>
                </div>
                <button onClick={() => scrollToAccess('psicologo')} className="btn" style={{ width: '100%', height: '38px', fontSize: '0.74rem', borderRadius: '6px', marginTop: 'auto', background: '#7F9F88', color: '#ffffff', fontWeight: 'bold', textTransform: 'none', letterSpacing: 'normal' }}>
                  Comenzar
                </button>
              </div>

              <div style={{ padding: '28px', background: '#ffffff', border: '1px solid rgba(5, 33, 58, 0.05)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid #7F9F88', boxShadow: '0 4px 20px rgba(5, 33, 58, 0.02)', background: 'rgba(127, 159, 136, 0.02)', position: 'relative' }}>
                <span style={{ position: 'absolute', top: '12px', right: '12px', fontSize: '0.55rem', background: '#7F9F88', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>RECOMENDADO</span>
                <div>
                  <span className="badge" style={{ background: 'rgba(127, 159, 136, 0.15)', color: '#7F9F88', fontSize: '0.58rem', textTransform: 'none' }}>SaaS Profesional</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#05213A', marginTop: '10px' }}>Plan Pro</h3>
                  <p style={{ fontSize: '0.76rem', color: '#5F6F74', height: '4ch', overflow: 'hidden', margin: '4px 0 0 0' }}>Pacientes ilimitados y gestión total.</p>
                  <div style={{ margin: '14px 0', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <strong style={{ fontSize: '1.8rem', color: '#05213A' }}>69 €</strong>
                    <span style={{ fontSize: '0.7rem', color: '#5F6F74' }}>/ mes</span>
                  </div>
                  <ul style={{ paddingLeft: '14px', fontSize: '0.75rem', color: '#5F6F74', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
                    <li>Pacientes ilimitados</li>
                    <li>Smart SOAP avanzado</li>
                    <li>Prioridad en matching</li>
                    <li>Reportes fiscales automáticos</li>
                  </ul>
                </div>
                <button onClick={() => scrollToAccess('psicologo')} className="btn" style={{ width: '100%', height: '38px', fontSize: '0.74rem', borderRadius: '6px', marginTop: 'auto', background: '#7F9F88', color: '#ffffff', fontWeight: 'bold', textTransform: 'none', letterSpacing: 'normal' }}>
                  Comenzar
                </button>
              </div>

              <div style={{ padding: '28px', background: '#ffffff', border: '1px solid rgba(5, 33, 58, 0.05)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '4px solid #7F9F88', boxShadow: '0 4px 20px rgba(5, 33, 58, 0.02)' }}>
                <div>
                  <span className="badge" style={{ background: 'rgba(127, 159, 136, 0.15)', color: '#7F9F88', fontSize: '0.58rem', textTransform: 'none' }}>Clínicas</span>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#05213A', marginTop: '10px' }}>Plan Enterprise</h3>
                  <p style={{ fontSize: '0.76rem', color: '#5F6F74', height: '4ch', overflow: 'hidden', margin: '4px 0 0 0' }}>Para centros y equipos de psicólogos.</p>
                  <div style={{ margin: '14px 0', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <strong style={{ fontSize: '1.6rem', color: '#05213A' }}>desde 199 €</strong>
                    <span style={{ fontSize: '0.7rem', color: '#5F6F74' }}>/ mes</span>
                  </div>
                  <ul style={{ paddingLeft: '14px', fontSize: '0.75rem', color: '#5F6F74', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
                    <li>Multi-psicólogo (29€/adicional)</li>
                    <li>Gestión de roles de clínica</li>
                    <li>API dedicada y white-label</li>
                    <li>Soporte y SLA prioritario</li>
                  </ul>
                </div>
                <button onClick={() => scrollToAccess('psicologo')} className="btn" style={{ width: '100%', height: '38px', fontSize: '0.74rem', borderRadius: '6px', marginTop: 'auto', background: '#7F9F88', color: '#ffffff', fontWeight: 'bold', textTransform: 'none', letterSpacing: 'normal' }}>
                  Contactar ventas
                </button>
              </div>

            </div>
          )}

          {/* Tooltip informativo y claim legal de exención de IVA */}
          <div style={{ padding: '24px', background: '#ffffff', border: '1px solid rgba(5, 33, 58, 0.05)', display: 'flex', flexDirection: 'column', gap: '12px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(5, 33, 58, 0.01)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={16} color="#7F9F88" />
              <strong style={{ fontSize: '0.85rem', color: '#05213A' }}>Información importante sobre la facturación de servicios sanitarios:</strong>
            </div>
            
            <p style={{ fontSize: '0.78rem', color: '#5F6F74', margin: 0, lineHeight: 1.5 }}>
              En cumplimiento del <strong>Art. 20.Uno.3 de la Ley del IVA (LIVA)</strong>, los honorarios por consultas y revisiones clínicas prestados por psicólogos sanitarios autorizados están **exentos de IVA**. La cuota mensual del Plan de Continuidad de ÁNCORA se divide de forma transparente: la tarifa correspondiente al servicio clínico del terapeuta se abona directamente exenta de IVA, mientras que la parte correspondiente a la plataforma SaaS (tecnología, hosting e IA) incluye el 21% de IVA correspondiente. Todo el proceso está automatizado de forma segura mediante <strong>Stripe Connect Split Payments</strong>.
            </p>
          </div>

        </div>
      </section>

      {/* REGISTRO / ACCESO DIRECTO */}
      <section ref={accessRef} id="acceso" style={{ padding: '70px 24px 90px', background: '#F8F6F1', borderTop: '1px solid rgba(5, 33, 58, 0.05)' }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: '540px' }}>
              <LoginView 
                onAuthSuccess={onAuthSuccess} 
                initialRole={selectedRole} 
                initialMode={selectedAuthMode} 
              />
            </div>
          </div>
        </div>
      </section>

      {/* CAJA CTA FINAL */}
      <section style={{ padding: '60px 24px 40px', background: '#ffffff' }}>
        <div style={{ 
          maxWidth: '1000px', 
          margin: '0 auto', 
          background: '#05213A', 
          borderRadius: '24px',
          padding: '60px 50px',
          boxShadow: '0 20px 40px rgba(5, 33, 58, 0.15)'
        }}>
          <div className="cta-container-flex">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, textAlign: 'left' }}>
              <h2 style={{ fontSize: '2.6rem', fontWeight: 'normal', color: '#ffffff', fontFamily: serifFont, margin: 0, lineHeight: 1.15 }}>
                Da el siguiente paso hacia tu bienestar.
              </h2>
              <p style={{ fontSize: '0.96rem', color: '#9AA6AB', maxWidth: '540px', margin: 0, lineHeight: 1.5 }}>
                Acompañamiento real, cada día. Psicólogos reales, siempre.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', flexShrink: 0 }}>
              <button onClick={() => scrollToAccess('paciente')} className="btn" style={{ height: '46px', paddingInline: '28px', fontSize: '0.82rem', fontWeight: 'bold', background: '#7F9F88', color: '#ffffff', borderRadius: '999px', textTransform: 'none', letterSpacing: 'normal', transition: 'all 0.2s' }} onMouseEnter={e => e.target.style.background = '#6B8A74'} onMouseLeave={e => e.target.style.background = '#7F9F88'}>
                Empezar ahora
                <ArrowRight size={16} />
              </button>
              <button onClick={() => scrollToAccess('psicologo')} className="btn btn-outline" style={{ height: '46px', paddingInline: '28px', fontSize: '0.82rem', fontWeight: 'bold', color: '#ffffff', borderColor: 'rgba(255,255,255,0.4)', borderRadius: '999px', textTransform: 'none', letterSpacing: 'normal', background: 'transparent' }} onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.target.style.background = 'transparent'}>
                Soy psicólogo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER PROFESIONAL Y COMPLETO ÁNCORA */}
      <footer style={{
        padding: '70px 24px 30px',
        background: '#05213A',
        fontSize: '0.8rem',
        color: '#9AA6AB',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ maxWidth: '1180px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '45px' }}>
          
          <div className="footer-main-grid">
            
            {/* Columna 1: Marca, Misión y Certificaciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <div 
                onClick={scrollToHome}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <img src="/ancora_logo.png" alt="ÁNCORA" style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid rgba(127, 159, 136, 0.4)', boxShadow: '0 0 8px rgba(127, 159, 136, 0.2)' }} />
                <span style={{ fontWeight: 'bold', fontSize: '1.4rem', color: '#ffffff', fontFamily: serifFont }}>Áncora</span>
              </div>
              <p style={{ lineHeight: 1.6, maxWidth: '280px', margin: 0, fontSize: '0.78rem' }}>
                La terapia con continuidad clínica real. Hecha para pacientes. Diseñada para psicólogos sanitarios. Guiada por lo humano.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(61,220,132,0.1)', color: '#3DDC84', border: '1px solid rgba(61,220,132,0.25)', fontWeight: 600 }}>
                  ✓ RGPD / LOPD-GDD
                </span>
                <span style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: '6px', background: 'rgba(68,125,130,0.15)', color: '#7F9F88', border: '1px solid rgba(68,125,130,0.3)', fontWeight: 600 }}>
                  ✓ Colegiado COP M-49ccc
                </span>
              </div>
            </div>

            {/* Columna 2: Producto */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <strong style={{ color: '#ffffff', fontSize: '0.85rem' }}>Producto</strong>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'} onClick={scrollToPacientes}>Para pacientes</span>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'} onClick={scrollToPsicologos}>Para psicólogos</span>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'} onClick={scrollToComoFunciona}>Cómo funciona</span>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'} onClick={scrollToPlanes}>Tarifas y 0€ prueba</span>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'} onClick={() => setActiveLegalModal('privacy')}>Seguridad y Servidores UE</span>
            </div>

            {/* Columna 3: Recursos y Salud Mental */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <strong style={{ color: '#ffffff', fontSize: '0.85rem' }}>Recursos Clínicos</strong>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'} onClick={() => setActiveLegalModal('help')}>Centro de Ayuda / FAQs</span>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'} onClick={() => setActiveLegalModal('resources')}>Guías de Salud Mental</span>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'} onClick={() => setActiveLegalModal('resources')}>Protocolo Anti-Pánico</span>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'} onClick={() => setActiveLegalModal('resources')}>Higiene del Sueño TCC</span>
              <span style={{ cursor: 'pointer', color: '#3DDC84', fontWeight: 600 }} onClick={() => setActiveLegalModal('resources')}>Urgencias: 024 / 112</span>
            </div>

            {/* Columna 4: Empresa y Ética */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
              <strong style={{ color: '#ffffff', fontSize: '0.85rem' }}>Empresa y Deontología</strong>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'} onClick={() => setActiveLegalModal('about')}>Sobre nosotros</span>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'} onClick={() => setActiveLegalModal('about')}>Dirección y Supervisión</span>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'} onClick={() => setActiveLegalModal('about')}>Código Deontológico</span>
              <span style={{ cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'} onClick={() => setActiveLegalModal('contact')}>Contacto y Soporte</span>
            </div>

            {/* Columna 5: Confidencialidad y Redes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
              <strong style={{ color: '#ffffff', fontSize: '0.85rem' }}>Confidencialidad Médica</strong>
              <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.76rem' }}>
                Datos cifrados bajo TLS 1.3 y AES-256. Custodia estricta bajo secreto profesional sanitario.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.72rem', color: '#7F9F88' }}>Atención directa:</span>
                <a href="mailto:soporte@ancora.health" style={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.76rem', fontWeight: 600 }}>
                  soporte@ancora.health
                </a>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                    <rect width="4" height="12" x="2" y="9"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube">
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1 16.2 0A2 2 0 0 1 2.5 17z"/>
                    <polygon points="10 15 15 12 10 9"/>
                  </svg>
                </a>
              </div>
            </div>

          </div>

          {/* Barra Inferior con Políticas y Enlace a Cookies */}
          <div style={{ 
            borderTop: '1px solid rgba(255, 255, 255, 0.05)', 
            paddingTop: '24px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '0.74rem',
            color: '#9AA6AB',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <span>© 2026 Áncora Health, S.L. · Todos los derechos reservados.</span>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <span 
                style={{ cursor: 'pointer', transition: 'color 0.2s' }} 
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} 
                onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'}
                onClick={() => setActiveLegalModal('privacy')}
              >
                Privacidad
              </span>
              <span 
                style={{ cursor: 'pointer', transition: 'color 0.2s' }} 
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} 
                onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'}
                onClick={() => setActiveLegalModal('terms')}
              >
                Términos y condiciones
              </span>
              <span 
                style={{ cursor: 'pointer', transition: 'color 0.2s' }} 
                onMouseEnter={e => e.currentTarget.style.color = '#ffffff'} 
                onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'}
                onClick={() => setForceOpenCookies(true)}
              >
                Política de cookies
              </span>
              <span 
                style={{ cursor: 'pointer', color: '#7F9F88', fontWeight: 600 }} 
                onClick={() => setForceOpenCookies(true)}
              >
                Configurar Cookies
              </span>
            </div>

            {/* BOTÓN ANDROID OFICIAL */}
            <div>
              <button
                type="button"
                onClick={() => setIsGuideOpen(true)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '10px',
                  background: 'rgba(5, 33, 58, 0.6)',
                  border: '1px solid rgba(127, 159, 136, 0.35)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(5, 33, 58, 0.9)';
                  e.currentTarget.style.borderColor = 'rgba(61, 220, 132, 0.5)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(5, 33, 58, 0.6)';
                  e.currentTarget.style.borderColor = 'rgba(127, 159, 136, 0.35)';
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="#3DDC84">
                  <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.1556-.2698.0631-.6137-.2067-.7694-.2694-.1555-.6133-.0631-.7689.2067l-2.0223 3.5028C15.3023 8.1633 13.7027 7.7816 12 7.7816c-1.7027 0-3.3023.3817-4.8805 1.0227L5.0972 5.3015c-.1556-.2698-.4995-.3622-.7689-.2067-.2698.1557-.3623.4996-.2067.7694l1.996 3.4572C2.6841 11.238 0 14.8872 0 19.1667h24c0-4.2795-2.6841-7.9287-6.1185-9.8453"/>
                </svg>
                <span>App Android</span>
                <span style={{ color: '#7F9F88', fontFamily: 'monospace', fontSize: '0.68rem', background: 'rgba(127,159,136,0.15)', padding: '1px 5px', borderRadius: '4px' }}>v1.0.0</span>
              </button>
            </div>
          </div>

        </div>
      </footer>

      {/* GESTOR DE COOKIES RGPD */}
      <CookieBannerModal 
        forceOpenModal={forceOpenCookies} 
        onCloseModal={() => setForceOpenCookies(false)} 
      />

      {/* MODALES LEGALES Y RECURSOS DEL FOOTER */}
      <LegalModals 
        modalType={activeLegalModal} 
        onClose={() => setActiveLegalModal(null)} 
      />

      {/* GUÍA DE INSTALACIÓN EN ANDROID */}
      <ApkDownloadGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      {/* MODAL DETALLES DEL PSICÓLOGO (FICHA PÚBLICA DEL MARKETPLACE) */}
      {selectedPsychologist && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 33, 58, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            border: '1px solid rgba(5, 33, 58, 0.08)',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(5, 33, 58, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative',
            color: '#05213A'
          }}>
            <button 
              onClick={() => { setSelectedPsychologist(null); setSelectedSlot(null); }}
              className="btn btn-outline"
              style={{ position: 'absolute', top: '16px', right: '16px', height: '30px', padding: '0 10px', fontSize: '0.65rem', border: '1px solid rgba(5, 33, 58, 0.1)', color: '#05213A', background: 'transparent' }}
            >
              Cerrar
            </button>

            {/* Cabecera del Psicólogo */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', borderBottom: '1px solid rgba(5, 33, 58, 0.05)', paddingBottom: '16px', marginTop: '10px' }}>
              <img 
                src={selectedPsychologist.photo_url} 
                alt={selectedPsychologist.name} 
                style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #7F9F88' }}
              />
              <div>
                <span className="badge" style={{ fontSize: '0.55rem', padding: '2px 6px', marginBottom: '4px', background: 'rgba(68, 125, 130, 0.1)', color: '#447D82', textTransform: 'none' }}>Habilitación Sanitaria Verificada</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#05213A', margin: 0, fontFamily: serifFont }}>{selectedPsychologist.name}</h3>
                <span style={{ fontSize: '0.7rem', color: '#5F6F74' }}>Psicólogo Sanitario · Colegiado Nº {selectedPsychologist.license_number}</span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                  <Star size={12} fill="#f59e0b" color="#f59e0b" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#05213A' }}>{selectedPsychologist.rating_avg}</span>
                  <span style={{ fontSize: '0.65rem', color: '#5F6F74' }}>({selectedPsychologist.rating_count} valoraciones verificadas de servicio)</span>
                </div>
              </div>
            </div>

            {/* Bio y Enfoque */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <strong style={{ fontSize: '0.78rem', color: '#05213A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Presentación Profesional</strong>
              <p style={{ fontSize: '0.78rem', color: '#5F6F74', lineHeight: 1.45, margin: 0 }}>
                {selectedPsychologist.bio}
              </p>
            </div>

            {/* Especialidades */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <strong style={{ fontSize: '0.78rem', color: '#05213A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Áreas de Intervención</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedPsychologist.specialties.map(spec => (
                  <span key={spec} className="badge" style={{ fontSize: '0.62rem', padding: '4px 8px', background: '#F8F6F1', border: '1px solid rgba(5, 33, 58, 0.08)', color: '#5F6F74', textTransform: 'none' }}>
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* AGENDA VIRTUAL INTERACTIVA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#F8F6F1', padding: '14px', borderRadius: '8px', border: '1px solid rgba(5, 33, 58, 0.05)' }}>
              <div style={{ display: 'flex', justifyItems: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ fontSize: '0.78rem', color: '#05213A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={14} color="#447D82" />
                  Disponibilidad de Citas (Próximos Huecos)
                </strong>
                <span style={{ fontSize: '0.65rem', color: '#7F9F88', fontWeight: 'bold' }}>{selectedPsychologist.availability}</span>
              </div>
              <p style={{ fontSize: '0.68rem', color: '#5F6F74', margin: '0 0 8px 0' }}>
                Selecciona una fecha y hora provisional para agendar tu primera sesión de encuadre de 1h.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {mockAgendaSlots.slice(0, 3).map(slot => (
                  <div key={slot.day} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.7rem' }}>
                    <span style={{ width: '70px', fontWeight: 'bold', color: '#5F6F74' }}>{slot.day}:</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {slot.times.map(t => {
                        const isSelected = selectedSlot?.day === slot.day && selectedSlot?.time === t;
                        return (
                          <button
                            key={t}
                            onClick={() => setSelectedSlot({ day: slot.day, time: t })}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '4px',
                              border: `1px solid ${isSelected ? '#447D82' : 'rgba(5, 33, 58, 0.15)'}`,
                              background: isSelected ? 'rgba(68, 125, 130, 0.1)' : '#ffffff',
                              color: isSelected ? '#447D82' : '#5F6F74',
                              fontSize: '0.68rem',
                              cursor: 'pointer',
                              fontWeight: isSelected ? 'bold' : 'normal',
                              transition: 'all 0.15s'
                            }}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Honorarios y Exención Legal */}
            <div style={{ display: 'flex', justifyItems: 'space-between', alignItems: 'center', background: '#F8F6F1', padding: '12px 16px', borderRadius: '8px', border: '1px dashed rgba(5, 33, 58, 0.15)' }}>
              <div>
                <span style={{ fontSize: '0.62rem', color: '#5F6F74', textTransform: 'uppercase', display: 'block' }}>Honorarios Sesión</span>
                <strong style={{ fontSize: '1rem', color: '#05213A' }}>{selectedPsychologist.session_price} € / sesión 1h</strong>
              </div>
              
              <div style={{ textAlign: 'right', maxWidth: '300px' }}>
                <span style={{ fontSize: '0.62rem', color: '#7F9F88', fontWeight: 'bold', display: 'block' }}>Exento de IVA (Art. 20.Uno.3 LIVA)</span>
                <p style={{ fontSize: '0.58rem', color: '#5F6F74', margin: '2px 0 0 0', lineHeight: 1.2 }}>
                  Facturado directamente por el psicólogo clínico asignado.
                </p>
              </div>
            </div>

            {/* Confirmar Reserva */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button 
                onClick={() => { setSelectedPsychologist(null); setSelectedSlot(null); }}
                className="btn btn-outline"
                style={{ height: '38px', fontSize: '0.75rem', border: '1px solid rgba(5, 33, 58, 0.15)', color: '#05213A', background: 'transparent' }}
              >
                Volver al listado
              </button>
              <button 
                onClick={handleConfirmBooking}
                className="btn btn-cyan"
                disabled={!selectedSlot}
                style={{ height: '38px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'none', letterSpacing: 'normal' }}
              >
                {selectedSlot 
                  ? `Reservar para el ${selectedSlot.day} a las ${selectedSlot.time}`
                  : 'Selecciona una hora para reservar'
                }
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CONSOLA DE DEMOSTRACIÓN A PANTALLA COMPLETA */}
      {showDemoConsole && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(5, 8, 16, 0.96)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '24px',
            fontFamily: sansFont
          }}
          onClick={() => setShowDemoConsole(false)}
        >
          <div 
            className="glass-panel animate-scale-up"
            style={{
              width: '100%',
              maxWidth: '920px',
              background: 'rgba(10, 15, 30, 0.85)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
              color: '#ffffff',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Panel */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-cyan)', margin: 0, fontFamily: serifFont }}>
                  Consola de Demostración de Áncora
                </h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  Accede a cualquier sección de la plataforma de forma instantánea y sin contraseñas
                </p>
              </div>
              <button 
                onClick={() => setShowDemoConsole(false)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                ✕
              </button>
            </div>

            {/* Grid de Tres Columnas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', textAlign: 'left' }}>
              
              {/* COLUMNA 1: PACIENTE */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(16, 185, 129, 0.15)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>👤</span>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-emerald)', margin: 0 }}>Panel del Paciente</h3>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>Pruebas clínicas y diario</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => { setShowDemoConsole(false); onEnterDemo('tisute@gmail.com', 'dashboard', 'clear_psychologist'); }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.74rem', width: '100%', justifyContent: 'flex-start', padding: '10px 12px', height: 'auto', background: 'rgba(16, 185, 129, 0.03)', borderColor: 'rgba(16, 185, 129, 0.1)', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
                  >
                    📋 Onboarding, Triaje y Catálogo
                  </button>
                  <button 
                    onClick={() => { setShowDemoConsole(false); onEnterDemo('tisute@gmail.com', 'dashboard'); }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.74rem', width: '100%', justifyContent: 'flex-start', padding: '10px 12px', height: 'auto', borderColor: 'rgba(255,255,255,0.06)', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
                  >
                    🏠 Hoy (Dashboard de Recuperación)
                  </button>
                  <button 
                    onClick={() => { setShowDemoConsole(false); onEnterDemo('tisute@gmail.com', 'chat'); }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.74rem', width: '100%', justifyContent: 'flex-start', padding: '10px 12px', height: 'auto', borderColor: 'rgba(255,255,255,0.06)', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
                  >
                    💬 Chat Diario con Ánquer (IA)
                  </button>
                  <button 
                    onClick={() => { setShowDemoConsole(false); onEnterDemo('tisute@gmail.com', 'sesiones'); }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.74rem', width: '100%', justifyContent: 'flex-start', padding: '10px 12px', height: 'auto', borderColor: 'rgba(255,255,255,0.06)', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
                  >
                    📅 Agenda de Sesiones y Stripe
                  </button>
                  <button 
                    onClick={() => { setShowDemoConsole(false); onEnterDemo('tisute@gmail.com', 'historial'); }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.74rem', width: '100%', justifyContent: 'flex-start', padding: '10px 12px', height: 'auto', borderColor: 'rgba(255,255,255,0.06)', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
                  >
                    📂 Expediente Clínico (10 Pestañas)
                  </button>
                  <button 
                    onClick={() => { setShowDemoConsole(false); onEnterDemo('tisute@gmail.com', 'privacidad'); }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.74rem', width: '100%', justifyContent: 'flex-start', padding: '10px 12px', height: 'auto', borderColor: 'rgba(255,255,255,0.06)', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
                  >
                    🔒 Privacidad y Control de RGPD
                  </button>
                </div>
              </div>

              {/* COLUMNA 2: PSICÓLOGO */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(6, 182, 212, 0.15)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🩺</span>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--color-cyan)', margin: 0 }}>Portal del Psicólogo</h3>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>Gestión clínica y pacientes</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => { setShowDemoConsole(false); onEnterDemo('usajosefernan@gmail.com', 'dashboard'); }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.74rem', width: '100%', justifyContent: 'flex-start', padding: '10px 12px', height: 'auto', borderColor: 'rgba(255,255,255,0.06)', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
                  >
                    🩺 Portal Clínico (Métricas)
                  </button>
                  <button 
                    onClick={() => { setShowDemoConsole(false); onEnterDemo('usajosefernan@gmail.com', 'perfil'); }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.74rem', width: '100%', justifyContent: 'flex-start', padding: '10px 12px', height: 'auto', borderColor: 'rgba(255,255,255,0.06)', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
                  >
                    📂 Ficha e Historial de Pacientes
                  </button>
                  <button 
                    onClick={() => { setShowDemoConsole(false); onEnterDemo('usajosefernan@gmail.com', 'soap'); }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.74rem', width: '100%', justifyContent: 'flex-start', padding: '10px 12px', height: 'auto', borderColor: 'rgba(255,255,255,0.06)', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
                  >
                    ✍️ Notas SOAP y Copiloto IA
                  </button>
                  <button 
                    onClick={() => { setShowDemoConsole(false); onEnterDemo('usajosefernan@gmail.com', 'agenda'); }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.74rem', width: '100%', justifyContent: 'flex-start', padding: '10px 12px', height: 'auto', borderColor: 'rgba(255,255,255,0.06)', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
                  >
                    📅 Agenda de Citas
                  </button>
                  <button 
                    onClick={() => { setShowDemoConsole(false); onEnterDemo('usajosefernan@gmail.com', 'ajustes'); }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.74rem', width: '100%', justifyContent: 'flex-start', padding: '10px 12px', height: 'auto', borderColor: 'rgba(255,255,255,0.06)', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
                  >
                    💳 Facturación & Stripe Connect
                  </button>
                </div>
              </div>

              {/* COLUMNA 3: ADMIN / CRM */}
              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(251, 191, 36, 0.15)', paddingBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>⚙️</span>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#fbbf24', margin: 0 }}>Super Admin (CRM)</h3>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>Administración y control total</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => { setShowDemoConsole(false); onEnterDemo('josferestudio@gmail.com', 'dashboard'); }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.74rem', width: '100%', justifyContent: 'flex-start', padding: '10px 12px', height: 'auto', borderColor: 'rgba(255,255,255,0.06)', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
                  >
                    👥 CRM Pacientes y Terapeutas
                  </button>
                  <button 
                    onClick={() => { setShowDemoConsole(false); onEnterDemo('josferestudio@gmail.com', 'chat'); }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.74rem', width: '100%', justifyContent: 'flex-start', padding: '10px 12px', height: 'auto', borderColor: 'rgba(255,255,255,0.06)', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
                  >
                    ⚠️ Panel de Incidencias
                  </button>
                  <button 
                    onClick={() => { setShowDemoConsole(false); onEnterDemo('josferestudio@gmail.com', 'ajustes'); }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.74rem', width: '100%', justifyContent: 'flex-start', padding: '10px 12px', height: 'auto', borderColor: 'rgba(255,255,255,0.06)', color: '#ffffff', textAlign: 'left', cursor: 'pointer' }}
                  >
                    ⚙️ Configuración del Sistema
                  </button>
                </div>
              </div>

            </div>

            {/* Nota legal al pie */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
              <span>Áncora Demo Segura</span>
              <button 
                onClick={() => setShowDemoConsole(false)}
                className="btn btn-primary"
                style={{ fontSize: '0.7rem', height: '30px', padding: '0 16px', background: 'rgba(255,255,255,0.05)', color: '#ffffff', borderColor: 'var(--border)' }}
              >
                Volver a la Landing
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL OVERLAY DE ACCESO / REGISTRO DIRECTO */}
      {showAuthModal && (
        <div 
          className="modal-overlay flex-center"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 33, 58, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 1000,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAuthModal(false);
          }}
        >
          <div 
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '460px',
              margin: 'auto'
            }}
          >
            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                zIndex: 20,
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Cerrar ventana de acceso"
            >
              <X size={16} />
            </button>
            <LoginView onAuthSuccess={onAuthSuccess} initialRole={selectedRole} />
          </div>
        </div>
      )}

    </div>
  );
}
