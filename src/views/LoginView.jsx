import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Shield, Mail, Lock, LogIn, AlertCircle, RefreshCw, ClipboardCheck, 
  ArrowRight, ArrowLeft, CheckCircle2, User, Sparkles, ShieldCheck, 
  Calendar, Check, AlertTriangle, CreditCard, Upload, Brain, Star
} from 'lucide-react';

export default function LoginView({ onAuthSuccess, initialRole = 'paciente' }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [role, setRole] = useState(initialRole); // 'paciente' | 'psicologo'
  const [currentStep, setCurrentStep] = useState(1);
  
  // Credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resetSent, setResetSent] = useState(false);

  // Patient Registration State
  const [patientConsent, setPatientConsent] = useState(false);
  const [patientProfile, setPatientProfile] = useState({
    displayName: '',
    birthYear: '',
    country: 'España',
    modality: 'online',
    therapistGender: 'indiferente',
    motivo: '',
    selectedTags: [],
    phq9Scores: Array(9).fill(-1),
    gad7Scores: Array(7).fill(-1),
    emergencyContactName: '',
    emergencyContactPhone: '',
    crisisPlanAccepted: false,
    selectedPsychologistId: null,
    creditCardNumber: '',
    creditCardExpiry: '',
    creditCardCvc: ''
  });

  // Psychologist Registration State
  const [psyProfile, setPsyProfile] = useState({
    firstName: '',
    lastName: '',
    licenseNumber: '',
    college: 'COP Madrid',
    insuranceName: '',
    insurancePolicy: '',
    isAutonomo: false,
    bio: '',
    selectedSpecialties: [],
    selectedApproaches: [],
    sessionPrice: '60',
    availabilityDays: {
      lunes: true, martes: true, miercoles: true, jueves: true, viernes: true, sabado: false, domingo: false
    },
    bufferMinutes: '15',
    stripeConnected: false,
    uploadedFileName: ''
  });

  // Matching Psicólogos Simulado
  const mockPsychologists = [
    {
      id: '19057a26-ebcb-4d42-a668-80250299912a',
      name: 'Ana Ramos',
      license: 'M-19057',
      photo_url: 'https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200',
      rating: '0.0',
      reviews: 0,
      specialties: ['Ansiedad', 'Estrés', 'Autovaloración'],
      price: 49,
      approach: 'Cognitivo-Conductual (TCC)'
    },
    {
      id: '49ccc6ae-e064-49c3-9951-4678c46b175a',
      name: 'Ami Rena',
      license: 'M-49ccc',
      photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      rating: '0.0',
      reviews: 0,
      specialties: ['Depresión', 'Trauma', 'Duelo'],
      price: 55,
      approach: 'EMDR y Mindfulness'
    },
    {
      id: '7b32049e-cb5e-4c24-9390-c32508dda09d',
      name: 'Elena Custer',
      license: 'M-31204',
      photo_url: 'https://images.unsplash.com/photo-1582750433449-64c86b1fdf30?auto=format&fit=crop&q=80&w=200',
      rating: '0.0',
      reviews: 0,
      specialties: ['Fobias', 'Ansiedad', 'TCC'],
      price: 50,
      approach: 'Cognitivo-Conductual (TCC)'
    },
    {
      id: 'c2104500-1111-2222-3333-444455556666',
      name: 'Carlos Ruiz',
      license: 'M-21045',
      photo_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
      rating: '4.8',
      reviews: 45,
      specialties: ['Ansiedad', 'Fobias', 'Sueño'],
      price: 45,
      approach: 'Cognitivo-Conductual (TCC)'
    },
    {
      id: 'd1849200-1111-2222-3333-444455556666',
      name: 'Sofía Vergara',
      license: 'M-18492',
      photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      rating: '4.9',
      reviews: 62,
      specialties: ['Pareja', 'Autoestima', 'Estrés'],
      price: 65,
      approach: 'Sistémico y Gestalt'
    },
    {
      id: 'e3298100-1111-2222-3333-444455556666',
      name: 'Javier Gómez',
      license: 'M-32981',
      photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
      rating: '4.7',
      reviews: 28,
      specialties: ['Depresión', 'Duelo', 'Autoestima'],
      price: 50,
      approach: 'Humanista'
    }
  ];

  const specialtyTags = ['Ansiedad', 'Depresión', 'Estrés', 'Duelo', 'Trauma', 'Sueño', 'Autoestima', 'Pareja', 'Fobia'];
  const approachTags = ['TCC', 'ACT', 'EMDR', 'Sistémico', 'Gestalt', 'Humanista'];

  // Cuestionario de Triaje Clínico
  const phq9Questions = [
    "Poco interés o placer en hacer las cosas.",
    "Se ha sentido triste, deprimido/a o sin esperanzas.",
    "Dificultad para conciliar o mantener el sueño, o duerme demasiado.",
    "Se ha sentido cansado/a o con poca energía.",
    "Poco apetito o come en exceso.",
    "Se ha sentido mal consigo mismo/a (siente que es un fracaso o que ha defraudado a su familia).",
    "Dificultad para concentrarse en actividades como leer o ver la televisión.",
    "¿Se mueve o habla tan despacio que los demás lo notan? O al contrario, ¿está tan inquieto/a que se mueve mucho más de lo habitual?",
    "Pensamientos de que estaría mejor muerto/a o de lastimarse de alguna manera."
  ];

  const gad7Questions = [
    "Se ha sentido nervioso/a, ansioso/a o con los nervios de punta.",
    "No ha sido capaz de parar o controlar sus preocupaciones.",
    "Se ha preocupado demasiado por diferentes cosas.",
    "Dificultad para relajarse.",
    "Se siente tan inquieto/a que es difícil quedarse quieto/a.",
    "Se ha enojado o irritado fácilmente.",
    "Siente miedo como si algo terrible pudiera pasar."
  ];

  // Cálculos de Triaje
  const phq9Total = patientProfile.phq9Scores.filter(s => s >= 0).reduce((acc, curr) => acc + curr, 0);
  const gad7Total = patientProfile.gad7Scores.filter(s => s >= 0).reduce((acc, curr) => acc + curr, 0);
  const hasSuicidalIdeation = patientProfile.phq9Scores[8] > 0;
  const isHighRisk = phq9Total >= 15 || gad7Total >= 15 || hasSuicidalIdeation;

  const handlePatientScoreSelect = (type, index, score) => {
    if (type === 'phq9') {
      const updated = [...patientProfile.phq9Scores];
      updated[index] = score;
      setPatientProfile({ ...patientProfile, phq9Scores: updated });
    } else {
      const updated = [...patientProfile.gad7Scores];
      updated[index] = score;
      setPatientProfile({ ...patientProfile, gad7Scores: updated });
    }
  };

  const togglePatientTag = (tag) => {
    const tags = [...patientProfile.selectedTags];
    if (tags.includes(tag)) {
      setPatientProfile({ ...patientProfile, selectedTags: tags.filter(t => t !== tag) });
    } else {
      setPatientProfile({ ...patientProfile, selectedTags: [...tags, tag] });
    }
  };

  const togglePsySpecialty = (tag) => {
    const tags = [...psyProfile.selectedSpecialties];
    if (tags.includes(tag)) {
      setPsyProfile({ ...psyProfile, selectedSpecialties: tags.filter(t => t !== tag) });
    } else {
      setPsyProfile({ ...psyProfile, selectedSpecialties: [...tags, tag] });
    }
  };

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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      localStorage.setItem('pending_oauth_role', role); // Guardar rol activo antes del redirect
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Registro del usuario en Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role: role }
        }
      });

      if (signUpError) throw signUpError;
      
      if (data.user) {
        // 2. Actualizar el perfil del usuario recién creado para que tenga el rol correspondiente
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            role: role,
            contexto_terapeutico: role === 'paciente' ? {
              displayName: patientProfile.displayName,
              triaje: { phq9: phq9Total, gad7: gad7Total, highRisk: isHighRisk },
              tags: patientProfile.selectedTags,
              preferredModality: patientProfile.modality
            } : {
              fullName: `${psyProfile.firstName} ${psyProfile.lastName}`,
              licenseNumber: psyProfile.licenseNumber,
              specialties: psyProfile.selectedSpecialties,
              sessionPrice: psyProfile.sessionPrice
            }
          })
          .eq('id', data.user.id);
        
        if (profileError) console.error("Error updating profile:", profileError);

        // 3. Insertar registro formal de consentimiento
        await supabase
          .from('consents')
          .insert([{
            user_id: data.user.id,
            version: 'v1.0-2026',
            ip_hash: 'client_registered_ip_hash',
            user_agent_hash: 'client_registered_ua_hash'
          }]);
        
        setError('¡Registro completado de forma segura! Ahora puedes iniciar sesión con tus credenciales.');
        setIsRegistering(false);
        setCurrentStep(1);
      }
    } catch (err) {
      setError(err.message || 'Error al finalizar el registro en la plataforma.');
    } finally {
      setLoading(false);
    }
  };

  const consentTextPaciente = `CONSENTIMIENTO INFORMADO DE TELEPSICOLOGÍA v1.0
1. Aceptas que Walter es un asistente de apoyo basado en inteligencia artificial y no emite diagnósticos independientes ni sustituye al psicólogo clínico humano.
2. Autorizas el almacenamiento cifrado y tratamiento de tus datos para el seguimiento de tu terapia.
3. Eres propietario único de tu expediente clínico, el cual es 100% portable y descargable.
4. En caso de crisis severas o de riesgo vital, te comprometes a contactar al 024, 112 o servicios presenciales de emergencias.`;

  const consentTextPsicologo = `CONSENTIMIENTO DE USO PROFESIONAL Y STRIPE CONNECT v1.0
1. Aceptas registrarte como psicólogo clínico independiente (freelance).
2. Declaras poseer habilitación sanitaria (MPGS o PIR) y colegiación activa en España.
3. Stripe Connect procesará los cobros directos de los pacientes con split fiscal automatizado.
4. El software SOAP es un copiloto de borrador clínico y no reemplaza tu criterio ni firma profesional.
5. Te comprometes a cumplir con el secreto profesional médico y la RGPD.`;

  const serifFont = "'Playfair Display', 'Libre Baskerville', 'Georgia', serif";
  const sansFont = "'Inter', sans-serif";

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '40px 0', background: '#F8F6F1', fontFamily: sansFont, color: '#05213A' }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid rgba(5, 33, 58, 0.08)',
        borderRadius: '20px',
        width: '100%',
        maxWidth: currentStep > 3 && isRegistering ? '720px' : '460px',
        padding: '36px',
        boxShadow: '0 20px 40px rgba(5, 33, 58, 0.04)',
        transition: 'max-width 0.3s ease'
      }}>
        
        {/* CABECERA COMÚN */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
          
          <h2 style={{ fontSize: '1.45rem', fontWeight: 'bold', fontFamily: serifFont, color: '#05213A', margin: 0 }}>
            {isRegistering 
              ? (role === 'psicologo' ? `Registro Profesional (${currentStep}/6)` : `Expediente Paciente (${currentStep}/8)`)
              : 'Acceso a ÁNCORA'}
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#5F6F74', marginTop: '6px' }}>
            {isRegistering
              ? (role === 'psicologo' ? 'Alta en la red de terapeutas independientes' : 'Triaje clínico inicial y consentimiento')
              : 'Introduce tus credenciales autorizadas'}
          </p>
        </div>

        {error && (
          <div className="flex-center" style={{ 
            background: error.includes('completado') ? 'rgba(127, 159, 136, 0.1)' : 'rgba(244, 63, 94, 0.08)', 
            border: `1px solid ${error.includes('completado') ? '#7F9F88' : 'rgba(244, 63, 94, 0.2)'}`,
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            gap: '10px',
            color: error.includes('completado') ? '#447D82' : '#f43f5e',
            fontSize: '0.78rem',
            textAlign: 'left'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{error}</span>
          </div>
        )}

        {/* 1. MODO INICIO DE SESIÓN */}
        {!isRegistering && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            
            {/* Roles selector en login */}
            <div style={{ display: 'flex', background: '#F8F6F1', padding: '4px', borderRadius: '8px', border: '1px solid rgba(5,33,58,0.08)' }}>
              <button 
                type="button"
                onClick={() => setRole('paciente')}
                style={{ flex: 1, height: '32px', fontSize: '0.74rem', fontWeight: 'bold', borderRadius: '6px', background: role === 'paciente' ? '#ffffff' : 'transparent', color: '#05213A', cursor: 'pointer', border: 'none' }}
              >
                Paciente
              </button>
              <button 
                type="button"
                onClick={() => setRole('psicologo')}
                style={{ flex: 1, height: '32px', fontSize: '0.74rem', fontWeight: 'bold', borderRadius: '6px', background: role === 'psicologo' ? '#ffffff' : 'transparent', color: '#05213A', cursor: 'pointer', border: 'none' }}
              >
                Psicólogo
              </button>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74', textTransform: 'uppercase' }}>Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#9AA6AB" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="ejemplo@ancora.clinic"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '38px', height: '38px', fontSize: '0.8rem', width: '100%', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                  required 
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74', textTransform: 'uppercase' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#9AA6AB" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '38px', height: '38px', fontSize: '0.8rem', width: '100%', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-cyan"
              disabled={loading}
              style={{ width: '100%', marginTop: '8px', height: '42px', fontSize: '0.8rem', borderRadius: '999px', background: '#447D82', color: '#ffffff', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}
            >
              {loading ? 'Procesando...' : 'Entrar al Panel'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '12px 0', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(5, 33, 58, 0.08)' }} />
              <span style={{ fontSize: '0.62rem', color: '#9AA6AB', fontWeight: 700 }}>O BIEN</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(5, 33, 58, 0.08)' }} />
            </div>

            <button 
              type="button" 
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ 
                width: '100%', 
                height: '42px', 
                fontSize: '0.8rem', 
                borderRadius: '999px', 
                background: '#ffffff', 
                border: '1px solid rgba(5, 33, 58, 0.15)',
                color: '#05213A', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.15s'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.797 2.717v2.258h2.909c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.707a5.416 5.416 0 0 1-.283-1.707c0-.593.102-1.17.283-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.806 11.426 0 9 0 5.484 0 2.457 2.023.957 4.961l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              <span>Continuar con Google</span>
            </button>

            <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.76rem', color: '#5F6F74' }}>
              ¿No tienes cuenta?{' '}
              <span 
                onClick={() => { setIsRegistering(true); setCurrentStep(1); }} 
                style={{ color: '#447D82', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
              >
                Regístrate aquí
              </span>
            </div>
          </form>
        )}

        {/* 2. MODO REGISTRO ACTIVO */}
        {isRegistering && (
          <div>
            
            {/* FLUJO REGISTRO PACIENTE */}
            {role === 'paciente' && (
              <div>
                
                {/* Paso 1: Cuenta */}
                {currentStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>CORREO ELECTRÓNICO</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tuemail@ancora.clinic"
                        style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                      />
                    </div>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>CONTRASEÑA</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña segura"
                        style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                      />
                    </div>
                    
                    <button 
                      onClick={() => {
                        if (!email.includes('@') || password.length < 6) {
                          setError('Email inválido o contraseña menor de 6 caracteres.');
                        } else {
                          setError(null);
                          setCurrentStep(2);
                        }
                      }}
                      className="btn"
                      style={{ height: '40px', background: '#447D82', color: '#ffffff', borderRadius: '999px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
                    >
                      Continuar <ArrowRight size={15} />
                    </button>
                  </div>
                )}

                {/* Paso 2: Consentimientos */}
                {currentStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: '#F8F6F1', border: '1px solid rgba(5,33,58,0.08)', borderRadius: '8px', padding: '12px', maxHeight: '150px', overflowY: 'auto', fontSize: '0.7rem', color: '#5F6F74', whiteSpace: 'pre-line', lineHeight: 1.45 }}>
                      {consentTextPaciente}
                    </div>

                    <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.75rem', cursor: 'pointer', color: '#5F6F74' }}>
                      <input 
                        type="checkbox" 
                        checked={patientConsent} 
                        onChange={(e) => setPatientConsent(e.target.checked)} 
                        style={{ marginTop: '2px', accentColor: '#447D82' }}
                      />
                      <span>He leído y acepto obligatoriamente el Consentimiento Informado v1.0.</span>
                    </label>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setCurrentStep(1)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '40px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        onClick={() => {
                          if (!patientConsent) {
                            setError('Debes aceptar el consentimiento clínico.');
                          } else {
                            setError(null);
                            setCurrentStep(3);
                          }
                        }}
                        className="btn" 
                        style={{ flex: 1, background: '#447D82', color: '#ffffff', borderRadius: '999px', fontWeight: 'bold' }}
                      >
                        Siguiente <ArrowRight size={15} /></button>
                    </div>
                  </div>
                )}

                {/* Paso 3: Perfil Básico */}
                {currentStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>NOMBRE DE EXPEDIENTE (Muesca/Alias)</label>
                      <input 
                        type="text" 
                        value={patientProfile.displayName}
                        onChange={(e) => setPatientProfile({ ...patientProfile, displayName: e.target.value })}
                        placeholder="Ej. José"
                        style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                      />
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>AÑO DE NACIMIENTO</label>
                      <input 
                        type="number" 
                        value={patientProfile.birthYear}
                        onChange={(e) => setPatientProfile({ ...patientProfile, birthYear: e.target.value })}
                        placeholder="Ej. 1988"
                        style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                      />
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>MODALIDAD DE TERAPIA PREFERIDA</label>
                      <select 
                        value={patientProfile.modality}
                        onChange={(e) => setPatientProfile({ ...patientProfile, modality: e.target.value })}
                        style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', width: '100%' }}
                      >
                        <option value="online">Videollamada Online</option>
                        <option value="presencial">Terapia Presencial</option>
                        <option value="hibrida">Híbrida (Combinada)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setCurrentStep(2)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '40px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        onClick={() => {
                          if (!patientProfile.displayName.trim() || !patientProfile.birthYear) {
                            setError('Por favor completa el nombre y año de nacimiento.');
                          } else {
                            setError(null);
                            setCurrentStep(4);
                          }
                        }}
                        className="btn" 
                        style={{ flex: 1, background: '#447D82', color: '#ffffff', borderRadius: '999px', fontWeight: 'bold' }}
                      >
                        Siguiente <ArrowRight size={15} /></button>
                    </div>
                  </div>
                )}

                {/* Paso 4: Motivo de consulta */}
                {currentStep === 4 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#5F6F74' }}>SELECCIONA TUS PRINCIPALES PREOCUPACIONES</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {specialtyTags.map(tag => {
                        const isSelected = patientProfile.selectedTags.includes(tag);
                        return (
                          <span 
                            key={tag} 
                            onClick={() => togglePatientTag(tag)}
                            className="badge" 
                            style={{ 
                              cursor: 'pointer',
                              padding: '6px 12px',
                              background: isSelected ? 'rgba(68,125,130,0.15)' : '#F8F6F1',
                              border: `1px solid ${isSelected ? '#447D82' : 'rgba(5,33,58,0.1)'}`,
                              color: isSelected ? '#447D82' : '#5F6F74',
                              textTransform: 'none',
                              fontSize: '0.75rem'
                            }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>DESCRIBE BREVEMENTE TU SITUACIÓN</label>
                      <textarea 
                        value={patientProfile.motivo}
                        onChange={(e) => setPatientProfile({ ...patientProfile, motivo: e.target.value })}
                        placeholder="Ej. Siento angustia en el entorno laboral desde hace unas semanas..."
                        style={{ height: '70px', padding: '10px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.75rem', width: '100%', resize: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setCurrentStep(3)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '40px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        onClick={() => {
                          if (patientProfile.selectedTags.length === 0) {
                            setError('Por favor selecciona al menos una etiqueta.');
                          } else {
                            setError(null);
                            setCurrentStep(5);
                          }
                        }}
                        className="btn" 
                        style={{ flex: 1, background: '#447D82', color: '#ffffff', borderRadius: '999px', fontWeight: 'bold' }}
                      >
                        Triaje Clínico <ArrowRight size={15} /></button>
                    </div>
                  </div>
                )}

                {/* Paso 5: Triaje Clínico PHQ-9 y GAD-7 */}
                {currentStep === 5 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left', maxHeight: '60vh', overflowY: 'auto', paddingRight: '6px' }}>
                    <div style={{ background: 'rgba(68,125,130,0.04)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(68,125,130,0.1)' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#447D82', margin: 0 }}>Evaluación Clínica de Entrada</h4>
                      <p style={{ fontSize: '0.7rem', color: '#5F6F74', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                        Durante las últimas 2 semanas, ¿con qué frecuencia has sentido molestias por los siguientes síntomas?
                      </p>
                    </div>

                    {/* PHQ-9 */}
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#05213A', borderBottom: '1px solid rgba(5,33,58,0.08)', paddingBottom: '6px', marginBottom: '12px' }}>Escala PHQ-9 (Estado de Ánimo)</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {phq9Questions.map((q, idx) => (
                          <div key={`phq-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '0.74rem', color: '#05213A', lineHeight: 1.35 }}>{idx + 1}. {q}</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {["Nunca", "Varios días", "Más de la mitad", "Casi siempre"].map((option, scoreVal) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => handlePatientScoreSelect('phq9', idx, scoreVal)}
                                  style={{
                                    flex: 1,
                                    height: '28px',
                                    fontSize: '0.62rem',
                                    borderRadius: '4px',
                                    border: `1px solid ${patientProfile.phq9Scores[idx] === scoreVal ? '#447D82' : 'rgba(5,33,58,0.08)'}`,
                                    background: patientProfile.phq9Scores[idx] === scoreVal ? 'rgba(68,125,130,0.15)' : '#F8F6F1',
                                    color: patientProfile.phq9Scores[idx] === scoreVal ? '#447D82' : '#5F6F74',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* GAD-7 */}
                    <div style={{ marginTop: '10px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#05213A', borderBottom: '1px solid rgba(5,33,58,0.08)', paddingBottom: '6px', marginBottom: '12px' }}>Escala GAD-7 (Ansiedad)</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {gad7Questions.map((q, idx) => (
                          <div key={`gad-${idx}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontSize: '0.74rem', color: '#05213A', lineHeight: 1.35 }}>{idx + 1}. {q}</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {["Nunca", "Varios días", "Más de la mitad", "Casi siempre"].map((option, scoreVal) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => handlePatientScoreSelect('gad7', idx, scoreVal)}
                                  style={{
                                    flex: 1,
                                    height: '28px',
                                    fontSize: '0.62rem',
                                    borderRadius: '4px',
                                    border: `1px solid ${patientProfile.gad7Scores[idx] === scoreVal ? '#447D82' : 'rgba(5,33,58,0.08)'}`,
                                    background: patientProfile.gad7Scores[idx] === scoreVal ? 'rgba(68,125,130,0.15)' : '#F8F6F1',
                                    color: patientProfile.gad7Scores[idx] === scoreVal ? '#447D82' : '#5F6F74',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                      <button onClick={() => setCurrentStep(4)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '40px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        onClick={() => {
                          const allPhqAnswered = patientProfile.phq9Scores.every(s => s >= 0);
                          const allGadAnswered = patientProfile.gad7Scores.every(s => s >= 0);
                          if (!allPhqAnswered || !allGadAnswered) {
                            setError('Por favor responde a todas las preguntas de triaje para poder valorar tu riesgo.');
                          } else {
                            setError(null);
                            setCurrentStep(6);
                          }
                        }}
                        className="btn" 
                        style={{ flex: 1, background: '#447D82', color: '#ffffff', borderRadius: '999px', fontWeight: 'bold' }}
                      >
                        Valorar Resultados <ArrowRight size={15} /></button>
                    </div>
                  </div>
                )}

                {/* Paso 6: Plan de Crisis (Seguridad del paciente) */}
                {currentStep === 6 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
                    
                    {isHighRisk ? (
                      <div style={{ background: 'rgba(244, 63, 94, 0.04)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#f43f5e' }}>
                          <AlertTriangle size={24} />
                          <h4 style={{ fontSize: '0.92rem', fontWeight: 'bold', margin: 0 }}>Protocolo de Crisis Activado (Riesgo Elevado)</h4>
                        </div>
                        <p style={{ fontSize: '0.74rem', color: '#5F6F74', lineHeight: 1.45, margin: 0 }}>
                          Tus puntuaciones sugieren una alta intensidad de malestar emocional. **Áncora es un entorno de seguimiento, no un servicio médico de urgencias ni atención a crisis.**
                        </p>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>RECURSOS DE AYUDA INMEDIATA (ESPAÑA):</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a href="tel:112" style={{ flex: 1, height: '36px', background: '#f43f5e', color: '#ffffff', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}>
                              Llamar al 112 (Emergencias)
                            </a>
                            <a href="tel:024" style={{ flex: 1, height: '36px', background: '#eab308', color: '#ffffff', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}>
                              Llamar al 024 (Prevención)
                            </a>
                          </div>
                        </div>

                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                          <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>CONTACTO DE EMERGENCIA (OPCIONAL)</label>
                          <input 
                            type="text" 
                            placeholder="Nombre del familiar o amigo"
                            value={patientProfile.emergencyContactName}
                            onChange={(e) => setPatientProfile({ ...patientProfile, emergencyContactName: e.target.value })}
                            style={{ height: '34px', paddingInline: '10px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '6px', background: '#ffffff', color: '#05213A', fontSize: '0.75rem' }}
                          />
                          <input 
                            type="tel" 
                            placeholder="Teléfono del contacto"
                            value={patientProfile.emergencyContactPhone}
                            onChange={(e) => setPatientProfile({ ...patientProfile, emergencyContactPhone: e.target.value })}
                            style={{ height: '34px', paddingInline: '10px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '6px', background: '#ffffff', color: '#05213A', fontSize: '0.75rem', marginTop: '6px' }}
                          />
                        </div>

                        <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.7rem', color: '#5F6F74', cursor: 'pointer' }}>
                          <input 
                            type="checkbox"
                            checked={patientProfile.crisisPlanAccepted}
                            onChange={(e) => setPatientProfile({ ...patientProfile, crisisPlanAccepted: e.target.checked })}
                            style={{ marginTop: '2px', accentColor: '#f43f5e' }}
                          />
                          <span>Entiendo las limitaciones clínicas de la IA y llamaré a emergencias si corre peligro mi integridad.</span>
                        </label>
                      </div>
                    ) : (
                      <div style={{ background: 'rgba(127, 159, 136, 0.05)', border: '1px solid rgba(127, 159, 136, 0.2)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#7F9F88' }}>
                          <CheckCircle2 size={22} />
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: 0 }}>Triaje Completado (Riesgo Bajo / Moderado)</h4>
                        </div>
                        <p style={{ fontSize: '0.74rem', color: '#5F6F74', lineHeight: 1.45, margin: 0 }}>
                          Tus puntuaciones de triaje (PHQ-9: {phq9Total}, GAD-7: {gad7Total}) están en rango seguro. La continuidad diaria te ayudará a optimizar tus sesiones.
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                      <button onClick={() => setCurrentStep(5)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '40px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        onClick={() => {
                          if (isHighRisk && !patientProfile.crisisPlanAccepted) {
                            setError('Debes declarar haber comprendido las pautas de crisis.');
                          } else {
                            setError(null);
                            setCurrentStep(7);
                          }
                        }}
                        className="btn" 
                        style={{ flex: 1, background: '#447D82', color: '#ffffff', borderRadius: '999px', fontWeight: 'bold' }}
                      >
                        Encontrar Psicólogo <ArrowRight size={15} /></button>
                    </div>
                  </div>
                )}

                {/* Paso 7: Matching / Elección de Psicólogo */}
                {currentStep === 7 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
                    <div style={{ background: '#F8F6F1', padding: '12px', borderRadius: '8px', border: '1px solid rgba(5,33,58,0.05)' }}>
                      <span style={{ fontSize: '0.72rem', color: '#5F6F74', display: 'block', lineHeight: 1.4 }}>
                        Basado en tus áreas seleccionadas (**{patientProfile.selectedTags.join(', ')}**), te recomendamos los siguientes terapeutas sanitarios con disponibilidad inmediata:
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {mockPsychologists.map(psico => {
                        const isSelected = patientProfile.selectedPsychologistId === psico.id;
                        return (
                          <div 
                            key={psico.id} 
                            onClick={() => setPatientProfile({ ...patientProfile, selectedPsychologistId: psico.id })}
                            style={{ 
                              padding: '14px', 
                              border: `2px solid ${isSelected ? '#447D82' : 'rgba(5,33,58,0.08)'}`,
                              background: isSelected ? 'rgba(68,125,130,0.03)' : '#ffffff',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              display: 'flex',
                              gap: '12px',
                              alignItems: 'center',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <img src={psico.photo_url} alt={psico.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                            <div style={{ flex: 1 }}>
                              <strong style={{ fontSize: '0.85rem', color: '#05213A', display: 'block' }}>{psico.name}</strong>
                              <span style={{ fontSize: '0.65rem', color: '#5F6F74', display: 'block' }}>Enfoque: {psico.approach} · Colegiado: {psico.license}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                <Star size={11} fill="#f59e0b" color="#f59e0b" />
                                <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#05213A' }}>{psico.rating}</span>
                                <span style={{ fontSize: '0.62rem', color: '#9AA6AB' }}>({psico.reviews} revisiones)</span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 'bold', color: '#05213A', display: 'block' }}>{psico.price} €</span>
                              <span style={{ fontSize: '0.58rem', color: '#5F6F74' }}>Onboarding</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setCurrentStep(6)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '40px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        onClick={() => {
                          if (!patientProfile.selectedPsychologistId) {
                            setError('Por favor selecciona tu terapeuta para iniciar la sesión de encuadre.');
                          } else {
                            setError(null);
                            setCurrentStep(8);
                          }
                        }}
                        className="btn" 
                        style={{ flex: 1, background: '#447D82', color: '#ffffff', borderRadius: '999px', fontWeight: 'bold' }}
                      >
                        Pasarela de Pago <ArrowRight size={15} /></button>
                    </div>
                  </div>
                )}

                {/* Paso 8: Registro en Áncora */}
                {currentStep === 8 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    <div style={{ background: '#05213A', borderRadius: '10px', padding: '16px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.65rem', color: '#9AA6AB', display: 'block', textTransform: 'uppercase' }}>Plan de Continuidad</span>
                        <strong style={{ fontSize: '1rem', fontFamily: serifFont }}>Registro Gratuito & Acceso Libre</strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#7F9F88', display: 'block' }}>0 €</span>
                        <span style={{ fontSize: '0.58rem', color: '#9AA6AB' }}>Cargo Inicial</span>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(127, 159, 136, 0.06)', border: '1px solid rgba(127, 159, 136, 0.15)', borderRadius: '8px', padding: '12px', fontSize: '0.72rem', color: '#5F6F74', lineHeight: 1.4 }}>
                      <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#05213A' }}>Política de Tarifa Cero de Áncora:</p>
                      <p style={{ margin: 0 }}>
                        Puedes registrarte libremente y ver todo tu espacio privado (diario, chat diario con Walter e historial). <strong>No se te cobrará ninguna tarifa hasta que decidas reservar y realizar tu primera consulta formal con tu psicólogo.</strong>
                      </p>
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>NÚMERO DE TARJETA (OPCIONAL)</label>
                      <div style={{ position: 'relative' }}>
                        <CreditCard size={16} color="#9AA6AB" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                        <input 
                          type="text" 
                          placeholder="4242 •••• •••• 4242 (Vincular más tarde)"
                          value={patientProfile.creditCardNumber}
                          onChange={(e) => setPatientProfile({ ...patientProfile, creditCardNumber: e.target.value })}
                          style={{ height: '36px', paddingLeft: '34px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', width: '100%', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>CADUCIDAD</label>
                        <input 
                          type="text" 
                          placeholder="MM/AA"
                          value={patientProfile.creditCardExpiry}
                          onChange={(e) => setPsyProfile({ ...patientProfile, creditCardExpiry: e.target.value })}
                          style={{ height: '36px', paddingInline: '10px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                        />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>CVC / CVV</label>
                        <input 
                          type="text" 
                          placeholder="123"
                          value={patientProfile.creditCardCvc}
                          onChange={(e) => setPatientProfile({ ...patientProfile, creditCardCvc: e.target.value })}
                          style={{ height: '36px', paddingInline: '10px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(5,33,58,0.05)', paddingTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <ShieldCheck size={18} color="#7F9F88" />
                      <span style={{ fontSize: '0.62rem', color: '#5F6F74', lineHeight: 1.35 }}>
                        Cifrado SSL de extremo a extremo. Si decides omitir o guardar la tarjeta, no se realizará ningún cargo hasta la primera consulta.
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <button onClick={() => setCurrentStep(7)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '42px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        onClick={handleFinalSubmit}
                        className="btn" 
                        disabled={loading}
                        style={{ flex: 1, background: '#7F9F88', color: '#ffffff', borderRadius: '999px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                      >
                        {loading ? 'Confirmando...' : 'Finalizar Registro Gratis'}</button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* FLUJO REGISTRO PSICÓLOGO */}
            {role === 'psicologo' && (
              <div>
                
                {/* Paso 1: Cuenta Profesional */}
                {currentStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>NOMBRE</label>
                        <input 
                          type="text" 
                          value={psyProfile.firstName}
                          onChange={(e) => setPsyProfile({ ...psyProfile, firstName: e.target.value })}
                          placeholder="Ej. Lucía"
                          style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                        />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>APELLIDOS</label>
                        <input 
                          type="text" 
                          value={psyProfile.lastName}
                          onChange={(e) => setPsyProfile({ ...psyProfile, lastName: e.target.value })}
                          placeholder="Ej. Vega"
                          style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>EMAIL PROFESIONAL</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ejemplo@cop.es"
                        style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                      />
                    </div>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>CONTRASEÑA ACCESO</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Contraseña segura"
                        style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                      />
                    </div>

                    <button 
                      onClick={() => {
                        if (!psyProfile.firstName || !psyProfile.lastName || !email.includes('@') || password.length < 6) {
                          setError('Completa todos los campos adecuadamente.');
                        } else {
                          setError(null);
                          setCurrentStep(2);
                        }
                      }}
                      className="btn"
                      style={{ height: '40px', background: '#7F9F88', color: '#ffffff', borderRadius: '999px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
                    >
                      Continuar <ArrowRight size={15} />
                    </button>
                  </div>
                )}

                {/* Paso 2: KYC Sanitario y Credenciales */}
                {currentStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>NÚMERO DE COLEGIADO</label>
                      <input 
                        type="text" 
                        value={psyProfile.licenseNumber}
                        onChange={(e) => setPsyProfile({ ...psyProfile, licenseNumber: e.target.value })}
                        placeholder="Ej. M-29837"
                        style={{ height: '36px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                      />
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>COLEGIO OFICIAL DE PSICOLOGÍA</label>
                      <input 
                        type="text" 
                        value={psyProfile.college}
                        onChange={(e) => setPsyProfile({ ...psyProfile, college: e.target.value })}
                        style={{ height: '36px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>ASEGURADORA RC</label>
                        <input 
                          type="text" 
                          value={psyProfile.insuranceName}
                          onChange={(e) => setPsyProfile({ ...psyProfile, insuranceName: e.target.value })}
                          placeholder="Ej. Broker's"
                          style={{ height: '36px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                        />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>Nº PÓLIZA RC</label>
                        <input 
                          type="text" 
                          value={psyProfile.insurancePolicy}
                          onChange={(e) => setPsyProfile({ ...psyProfile, insurancePolicy: e.target.value })}
                          placeholder="Ej. RC-92841"
                          style={{ height: '36px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                        />
                      </div>
                    </div>

                    {/* Subida Acreditación */}
                    <div style={{ border: '2px dashed rgba(127, 159, 136, 0.4)', borderRadius: '10px', padding: '16px', textAlign: 'center', background: '#F8F6F1', cursor: 'pointer' }} onClick={() => setPsyProfile({ ...psyProfile, uploadedFileName: 'titulo_sanitario_verificado.pdf' })}>
                      <Upload size={22} color="#7F9F88" style={{ margin: '0 auto 6px' }} />
                      <span style={{ fontSize: '0.72rem', color: '#5F6F74', display: 'block' }}>
                        {psyProfile.uploadedFileName ? `Cargado: ${psyProfile.uploadedFileName}` : 'Subir título o certificado de habilitación sanitaria (PDF)'}
                      </span>
                    </div>

                    <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.7rem', color: '#5F6F74', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={psyProfile.isAutonomo} 
                        onChange={(e) => setPsyProfile({ ...psyProfile, isAutonomo: e.target.checked })}
                        style={{ marginTop: '2px', accentColor: '#7F9F88' }}
                      />
                      <span>Declaro que me encuentro de alta en el régimen de autónomos o mutualidad.</span>
                    </label>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setCurrentStep(1)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '40px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        onClick={() => {
                          if (!psyProfile.licenseNumber || !psyProfile.uploadedFileName || !psyProfile.isAutonomo) {
                            setError('Completa los datos de colegiación, adjunta el título y declara tu estado de autónomo.');
                          } else {
                            setError(null);
                            setCurrentStep(3);
                          }
                        }}
                        className="btn" 
                        style={{ flex: 1, background: '#7F9F88', color: '#ffffff', borderRadius: '999px', fontWeight: 'bold' }}
                      >
                        Siguiente <ArrowRight size={15} /></button>
                    </div>
                  </div>
                )}

                {/* Paso 3: Perfil Público */}
                {currentStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>PRESENTACIÓN PROFESIONAL (BIO)</label>
                      <textarea 
                        value={psyProfile.bio}
                        onChange={(e) => setPsyProfile({ ...psyProfile, bio: e.target.value })}
                        placeholder="Describe brevemente tu enfoque y trayectoria clínica..."
                        style={{ height: '70px', padding: '10px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.75rem', resize: 'none', width: '100%' }}
                      />
                    </div>

                    <label style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#5F6F74' }}>ESPECIALIDADES CLÍNICAS</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {specialtyTags.map(tag => {
                        const isSelected = psyProfile.selectedSpecialties.includes(tag);
                        return (
                          <span 
                            key={tag} 
                            onClick={() => togglePsySpecialty(tag)}
                            className="badge" 
                            style={{ 
                              cursor: 'pointer',
                              padding: '5px 10px',
                              background: isSelected ? 'rgba(127,159,136,0.15)' : '#F8F6F1',
                              border: `1px solid ${isSelected ? '#7F9F88' : 'rgba(5,33,58,0.1)'}`,
                              color: isSelected ? '#7F9F88' : '#5F6F74',
                              textTransform: 'none',
                              fontSize: '0.7rem'
                            }}
                          >
                            {tag}
                          </span>
                        );
                      })}
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>TARIFA POR SESIÓN (1 HORA)</label>
                      <input 
                        type="number" 
                        value={psyProfile.sessionPrice}
                        onChange={(e) => setPsyProfile({ ...psyProfile, sessionPrice: e.target.value })}
                        style={{ height: '36px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setCurrentStep(2)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '40px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        onClick={() => {
                          if (!psyProfile.bio.trim() || psyProfile.selectedSpecialties.length === 0) {
                            setError('Completa tu bio y selecciona al menos una especialidad.');
                          } else {
                            setError(null);
                            setCurrentStep(4);
                          }
                        }}
                        className="btn" 
                        style={{ flex: 1, background: '#7F9F88', color: '#ffffff', borderRadius: '999px', fontWeight: 'bold' }}
                      >
                        Siguiente <ArrowRight size={15} /></button>
                    </div>
                  </div>
                )}

                {/* Paso 4: Agenda ybuffers */}
                {currentStep === 4 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    <label style={{ fontSize: '0.74rem', fontWeight: 'bold', color: '#5F6F74' }}>DÍAS DE CONSULTA DISPONIBLES</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '8px' }}>
                      {Object.keys(psyProfile.availabilityDays).map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const updated = { ...psyProfile.availabilityDays };
                            updated[day] = !updated[day];
                            setPsyProfile({ ...psyProfile, availabilityDays: updated });
                          }}
                          style={{
                            height: '32px',
                            fontSize: '0.7rem',
                            textTransform: 'capitalize',
                            borderRadius: '6px',
                            border: `1px solid ${psyProfile.availabilityDays[day] ? '#7F9F88' : 'rgba(5,33,58,0.1)'}`,
                            background: psyProfile.availabilityDays[day] ? 'rgba(127,159,136,0.15)' : '#F8F6F1',
                            color: psyProfile.availabilityDays[day] ? '#7F9F88' : '#5F6F74',
                            cursor: 'pointer'
                          }}
                        >
                          {day}
                        </button>
                      ))}
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                      <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#5F6F74' }}>BUFFER ENTRE SESIONES (MINUTOS)</label>
                      <select 
                        value={psyProfile.bufferMinutes}
                        onChange={(e) => setPsyProfile({ ...psyProfile, bufferMinutes: e.target.value })}
                        style={{ height: '36px', paddingInline: '10px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', width: '100%' }}
                      >
                        <option value="5">5 Minutos</option>
                        <option value="10">10 Minutos</option>
                        <option value="15">15 Minutos</option>
                        <option value="20">20 Minutos</option>
                        <option value="30">30 Minutos</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setCurrentStep(3)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '40px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        onClick={() => setCurrentStep(5)}
                        className="btn" 
                        style={{ flex: 1, background: '#7F9F88', color: '#ffffff', borderRadius: '999px', fontWeight: 'bold' }}
                      >
                        Siguiente <ArrowRight size={15} /></button>
                    </div>
                  </div>
                )}

                {/* Paso 5: Stripe Connect */}
                {currentStep === 5 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    <div style={{ background: '#05213A', padding: '20px', borderRadius: '12px', color: '#ffffff', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#7F9F88' }}>
                        <ShieldCheck size={20} />
                        <strong style={{ fontSize: '0.82rem' }}>Pasarela de Pagos Stripe Connect</strong>
                      </div>
                      <p style={{ fontSize: '0.68rem', color: '#9AA6AB', lineHeight: 1.4, margin: 0 }}>
                        Áncora divide de forma transparente los cobros por Stripe Connect: recibes tus honorarios directos exentos de IVA y la plataforma cobra de forma separada el servicio de software.
                      </p>
                    </div>

                    {psyProfile.stripeConnected ? (
                      <div style={{ background: 'rgba(127, 159, 136, 0.1)', border: '1px solid #7F9F88', borderRadius: '8px', padding: '12px', textAlign: 'center', fontSize: '0.78rem', color: '#7F9F88', fontWeight: 'bold' }}>
                        ¡Cuenta vinculada con éxito de forma segura!
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setPsyProfile({ ...psyProfile, stripeConnected: true })}
                        className="btn"
                        style={{ height: '42px', background: '#05213A', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', cursor: 'pointer' }}
                      >
                        <span>Vincular cuenta bancaria con Stripe</span>
                      </button>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setCurrentStep(4)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '40px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        onClick={() => {
                          if (!psyProfile.stripeConnected) {
                            setError('Por favor vincula tu cuenta Stripe Connect para continuar.');
                          } else {
                            setError(null);
                            setCurrentStep(6);
                          }
                        }}
                        className="btn" 
                        style={{ flex: 1, background: '#7F9F88', color: '#ffffff', borderRadius: '999px', fontWeight: 'bold' }}
                      >
                        Siguiente <ArrowRight size={15} /></button>
                    </div>
                  </div>
                )}

                {/* Paso 6: Consentimiento y Finalización */}
                {currentStep === 6 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    <div style={{ background: '#F8F6F1', border: '1px solid rgba(5,33,58,0.08)', borderRadius: '8px', padding: '12px', maxHeight: '150px', overflowY: 'auto', fontSize: '0.7rem', color: '#5F6F74', whiteSpace: 'pre-line', lineHeight: 1.45 }}>
                      {consentTextPsicologo}
                    </div>

                    <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.75rem', cursor: 'pointer', color: '#5F6F74' }}>
                      <input 
                        type="checkbox" 
                        checked={patientConsent} 
                        onChange={(e) => setPatientConsent(e.target.checked)} 
                        style={{ marginTop: '2px', accentColor: '#7F9F88' }}
                      />
                      <span>Acepto obligatoriamente las condiciones profesionales de Áncora.</span>
                    </label>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setCurrentStep(5)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '42px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        onClick={() => {
                          if (!patientConsent) {
                            setError('Debes aceptar las condiciones de uso.');
                          } else {
                            setError(null);
                            handleFinalSubmit();
                          }
                        }}
                        className="btn" 
                        disabled={loading}
                        style={{ flex: 1, background: '#7F9F88', color: '#ffffff', borderRadius: '999px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
                      >
                        {loading ? 'Confirmando...' : 'Finalizar Registro'}</button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* VOLVER AL LOGIN */}
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.76rem', color: '#5F6F74' }}>
              ¿Ya tienes cuenta?{' '}
              <span 
                onClick={() => { setIsRegistering(false); setCurrentStep(1); setError(null); }} 
                style={{ color: '#447D82', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
              >
                Inicia sesión aquí
              </span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
