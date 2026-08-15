import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { db, auth } from '../firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getRedirectResult } from 'firebase/auth';
import { LegalModals } from '../components/LegalModals';
import { 
  Shield, Mail, Lock, LogIn, AlertCircle, RefreshCw, ClipboardCheck, 
  ArrowRight, ArrowLeft, CheckCircle2, User, Sparkles, ShieldCheck, 
  Calendar, Check, AlertTriangle, CreditCard, Upload, Brain, Star,
  ExternalLink, CheckCircle, HelpCircle, FileText, Send, PhoneCall
} from 'lucide-react';

export default function LoginView({ 
  onAuthSuccess, 
  initialRole = 'paciente',
  initialMode = 'login',
  initialStep = 1,
  currentUser = null
}) {
  const [authMode, setAuthMode] = useState(initialMode); // 'login' | 'register' | 'verify_email' | 'forgot_password'
  const [role, setRole] = useState(initialRole); // 'paciente' | 'psicologo'
  const [currentStep, setCurrentStep] = useState(initialStep);
  
  // Credentials
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [legalModal, setLegalModal] = useState(null); // 'terms' | 'privacy' | 'consent' | 'help' | null

  // State flags
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [googleAuthUser, setGoogleAuthUser] = useState(currentUser || null);
  const [emailSentTo, setEmailSentTo] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer effect
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Sync props when parent changes
  useEffect(() => {
    if (initialMode) {
      setAuthMode(initialMode);
      setCurrentStep(initialStep || 1);
      setError(null);
      setSuccessMsg(null);
    }
  }, [initialMode, initialStep]);

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
      setError(null);
    }
  }, [initialRole]);

  useEffect(() => {
    if (auth) {
      getRedirectResult(auth).then(async (result) => {
        if (result?.user) {
          console.log('[Firebase Auth] Resultado de login por redirección:', result.user.email);
          const profileDocRef = doc(db, 'profiles', String(result.user.uid));
          const snap = await getDoc(profileDocRef);
          if (snap.exists() && onAuthSuccess) {
            onAuthSuccess(result.user, snap.data());
          }
        }
      }).catch(err => {
        if (err?.code !== 'auth/null-user') {
          console.warn('[Firebase Auth] Redirección no completada:', err?.message);
        }
      });
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      setGoogleAuthUser(currentUser);
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.displayName) {
        setDisplayName(currentUser.displayName);
        setPatientProfile(prev => ({ ...prev, displayName: currentUser.displayName }));
      }
    }
  }, [currentUser]);

  // Patient Registration State
  const [patientConsent, setPatientConsent] = useState(false);
  const [patientProfile, setPatientProfile] = useState({
    displayName: currentUser?.displayName || '',
    consultationType: 'individual', // 'individual' | 'pareja' | 'familiar'
    birthYear: '',
    country: 'España',
    modality: 'online',
    therapistGender: 'indiferente',
    motivo: '',
    selectedTags: [],
    // Pareja
    partnerName: '',
    relationshipDuration: '',
    // Familia / Menor
    tutorName: '',
    tutorPhone: '',
    childName: '',
    childAge: '',
    // Screening ágil
    quickWellbeingScores: {
      stress: 1,
      mood: 1
    },
    phq9Scores: Array(9).fill(-1),
    gad7Scores: Array(7).fill(-1),
    emergencyContactName: '',
    emergencyContactPhone: '',
    crisisPlanAccepted: false,
    selectedPsychologistId: '2TOfkVIRccgIgz5WamAIVmUPtD63',
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

  // Catálogo Oficial de Psicólogos Sanitarios Especializados
  const mockPsychologists = [
    {
      id: '2TOfkVIRccgIgz5WamAIVmUPtD63',
      name: 'José Fernández',
      license: 'M-49ccc',
      roleType: 'individual',
      photo_url: 'https://lh3.googleusercontent.com/a/ACg8ocKTiCRCGtON7UckYXir1hkqxQPP9jHgd0A8aQx3mqswe2yNcA=s96-c',
      rating: '5.0',
      reviews: 18,
      specialties: ['Ansiedad', 'Estrés', 'Terapia Cognitiva', 'Regulación Emocional'],
      price: 55,
      approach: 'Terapia Cognitivo-Conductual & Regulación Emocional'
    },
    {
      id: 'psy-pareja-01',
      name: 'Dra. Elena Ruiz',
      license: 'M-38291',
      roleType: 'pareja',
      photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
      rating: '4.9',
      reviews: 24,
      specialties: ['Terapia de Pareja', 'Comunicación', 'Afectividad y Vínculo'],
      price: 65,
      approach: 'Enfoque Sistémico y Terapia Focalizada en las Emociones'
    },
    {
      id: 'psy-infantil-01',
      name: 'Carlos Mendoza',
      license: 'M-41029',
      roleType: 'familiar',
      photo_url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
      rating: '5.0',
      reviews: 31,
      specialties: ['Infanto-Juvenil', 'Conducta', 'Ansiedad Escolar', 'Orientación a Padres'],
      price: 60,
      approach: 'Psicología Infanto-Juvenil y Mediación Familiar'
    }
  ];

  // Focos y Etiquetas Segmentadas por Modalidad
  const individualTags = ['Ansiedad', 'Depresión y Ánimo', 'Estrés Laboral', 'Autoestima', 'Duelo', 'Trauma', 'Sueño e Insomnio', 'Fobia y Pánico'];
  const coupleTags = ['Comunicación y Discusiones', 'Convivencia y Rutinas', 'Confianza y Fidelidad', 'Intimidad y Afecto', 'Crianza Compartida', 'Crisis Vital'];
  const familyTags = ['Conducta en Casa', 'Ansiedad Escolar y Exámenes', 'Gestión de la Frustración', 'Socialización y Amigos', 'Cambios Familiares', 'Sueño y Miedos Infantiles'];

  const specialtyTags = patientProfile.consultationType === 'pareja' 
    ? coupleTags 
    : (patientProfile.consultationType === 'familiar' ? familyTags : individualTags);

  const approachTags = ['TCC', 'ACT', 'EMDR', 'Sistémico', 'Gestalt', 'Humanista'];

  // Cuestionario de Triaje Clínico (Opcional / Referencia)
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

  // 1. INICIAR SESIÓN CON EMAIL Y CONTRASEÑA
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (authError) throw authError;

      if (data?.user) {
        // Verificar si el usuario requiere triaje inicial (solo para pacientes)
        if (role === 'paciente') {
          const profileDocRef = doc(db, 'profiles', String(data.user.uid));
          const profileSnap = await getDoc(profileDocRef);
          const profileData = profileSnap.exists() ? profileSnap.data() : null;

          if (!profileData?.triaje_completed && !profileData?.contexto_terapeutico?.triaje) {
            // Usuario autenticado pero sin triaje completado
            setGoogleAuthUser(data.user);
            setDisplayName(data.user.displayName || profileData?.display_name || '');
            setPatientProfile(prev => ({
              ...prev,
              displayName: data.user.displayName || profileData?.display_name || prev.displayName
            }));
            setAuthMode('register');
            setRole('paciente');
            setCurrentStep(2); // Ir directo al consentimiento y triaje
            setSuccessMsg('Para acceder a tu espacio personal, completa tu triaje clínico inicial.');
            return;
          }
        }

        if (onAuthSuccess) {
          onAuthSuccess(data.user);
        }
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      let msg = err.message || 'Error al iniciar sesión';
      if (msg.includes('auth/invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        msg = 'Credenciales no válidas. Revisa tu correo y contraseña.';
      } else if (msg.includes('auth/too-many-requests')) {
        msg = 'Demasiados intentos fallidos. Por favor, espera unos minutos o restablece tu contraseña.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. INICIAR SESIÓN O REGISTRO CON GOOGLE
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      localStorage.setItem('pending_oauth_role', role);
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (oauthError) throw oauthError;

      if (data?.user) {
        const profileDocRef = doc(db, 'profiles', String(data.user.uid));
        const profileSnap = await getDoc(profileDocRef);
        const profileData = profileSnap.exists() ? profileSnap.data() : null;

        // Comprobar si es un paciente que necesita triaje
        if (role === 'paciente' && (!profileData?.triaje_completed && !profileData?.contexto_terapeutico?.triaje)) {
          setGoogleAuthUser(data.user);
          setEmail(data.user.email || '');
          const gName = data.user.displayName || data.user.email?.split('@')[0] || '';
          setDisplayName(gName);
          setPatientProfile(prev => ({
            ...prev,
            displayName: gName
          }));
          setAuthMode('register');
          setRole('paciente');
          setCurrentStep(2); // Salta el paso 1 de credenciales y va al Consentimiento + Triaje
          setSuccessMsg(`¡Conectado con Google como ${data.user.email}! Completa ahora tu triaje clínico para configurar tu seguimiento.`);
          return;
        }

        // Comprobar si es un psicólogo que necesita colegiación
        if (role === 'psicologo' && (!profileData?.colegiado?.numero_colegiado)) {
          setGoogleAuthUser(data.user);
          setEmail(data.user.email || '');
          const gName = data.user.displayName || '';
          const parts = gName.split(' ');
          setPsyProfile(prev => ({
            ...prev,
            firstName: parts[0] || '',
            lastName: parts.slice(1).join(' ') || ''
          }));
          setAuthMode('register');
          setRole('psicologo');
          setCurrentStep(2); // Salta el paso 1 y va directo a Colegiación y KYC Sanitario
          setSuccessMsg(`¡Conectado con Google como ${data.user.email}! Completa ahora tu número de colegiado y datos sanitarios.`);
          return;
        }

        // Si es psicólogo o paciente con triaje completado
        if (onAuthSuccess) {
          onAuthSuccess(data.user);
        }
      }
    } catch (err) {
      console.error('Error al acceder con Google:', err);
      let msg = err.message || 'Error al iniciar sesión con Google.';
      if (err?.code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        const curHost = typeof window !== 'undefined' ? window.location.hostname : 'tu dominio actual';
        msg = `Dominio no autorizado en Firebase ("${curHost}"). Accede mediante "http://localhost:5173" o añade "${curHost}" en Firebase Console > Authentication > Settings > Authorized domains.`;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // 3. FINALIZAR REGISTRO PACIENTE (Con Email/Password o Google)
  const handleFinalSubmitPatient = async () => {
    setLoading(true);
    setError(null);
    try {
      let finalUser = googleAuthUser;

      // Si no es un usuario de Google ya autenticado, creamos la cuenta en Firebase
      if (!finalUser) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: { 
              role: 'paciente',
              displayName: patientProfile.displayName || displayName
            }
          }
        });

        if (signUpError) throw signUpError;
        finalUser = signUpData.user;
      }

      if (finalUser) {
        let patientNameFinal = patientProfile.displayName || displayName || finalUser.email?.split('@')[0] || 'Paciente';
        if (patientProfile.consultationType === 'pareja' && patientProfile.partnerName) {
          patientNameFinal = `${patientProfile.displayName || displayName} y ${patientProfile.partnerName}`;
        } else if (patientProfile.consultationType === 'familiar' && patientProfile.childName) {
          patientNameFinal = `${patientProfile.childName} (Tutor: ${patientProfile.displayName || displayName})`;
        }

        const formattedDate = new Date().toISOString();
        const dateOnly = formattedDate.split('T')[0];
        const tagsToSave = patientProfile.selectedTags || [];

        // Construir historial clínico según la modalidad seleccionada
        let initialClinicalHistory = {};
        let fotoPersona = '';
        let sintesisIa = '';

        if (patientProfile.consultationType === 'pareja') {
          initialClinicalHistory = {
            resumen_vital: `Terapia de Pareja: ${patientProfile.motivo || 'Mejora de la comunicación y vínculo afectivo.'}`,
            antecedentes_psicologicos: `Consulta de pareja iniciada en Áncora. Miembros: ${patientProfile.displayName} y ${patientProfile.partnerName || 'Pareja'}. Tiempo de relación: ${patientProfile.relationshipDuration || 'No especificado'}. Focos terapéuticos: ${tagsToSave.join(', ')}.`,
            antecedentes_medicos: `Modalidad: ${patientProfile.modality || 'Online'}. País: ${patientProfile.country || 'España'}.`,
            relaciones_contexto: `Dinámica de pareja en convivencia/relación de ${patientProfile.relationshipDuration || 'tiempo prolongado'}.`,
            patrones_comunes: `Focos declarados en el triaje de pareja: ${tagsToSave.join(', ')}.`
          };
          fotoPersona = `Consulta de Pareja: ${patientProfile.displayName} y ${patientProfile.partnerName || 'Pareja'} (${patientProfile.relationshipDuration || 'Relación activa'}). Motivo: "${patientProfile.motivo || 'Mejora relacional'}". Focos: ${tagsToSave.join(', ')}.`;
          sintesisIa = `Pareja en proceso de acompañamiento psicológico con encuadre vincular. Áreas prioritarias de intervención: ${tagsToSave.join(', ')}. Motivo expresado: "${patientProfile.motivo || 'Sin especificar'}".`;
        } else if (patientProfile.consultationType === 'familiar') {
          initialClinicalHistory = {
            resumen_vital: `Atención Infanto-Juvenil para ${patientProfile.childName || 'el menor'} (${patientProfile.childAge ? patientProfile.childAge + ' años' : 'Edad no indicada'}). Motivo: ${patientProfile.motivo || 'Acompañamiento y regulación emocional infantil.'}`,
            antecedentes_psicologicos: `Formulario de triaje completado por el tutor legal: ${patientProfile.displayName || 'Tutor'} (Tel: ${patientProfile.tutorPhone || 'Sin teléfono'}). Menor: ${patientProfile.childName} (${patientProfile.childAge ? patientProfile.childAge + ' años' : 'N/A'}). Inquietudes declaradas: ${tagsToSave.join(', ')}.`,
            antecedentes_medicos: `Edad del menor: ${patientProfile.childAge || 'No indicada'}. Modalidad preferida: ${patientProfile.modality || 'Online'}.`,
            relaciones_contexto: `Núcleo familiar con tutor legal ${patientProfile.displayName || 'Tutor'} y menor ${patientProfile.childName || 'Menor'}.`,
            patrones_comunes: `Inquietudes manifestadas por el tutor: ${tagsToSave.join(', ')}.`
          };
          fotoPersona = `Atención Infanto-Juvenil: ${patientProfile.childName || 'Menor'} (${patientProfile.childAge || 'N/A'} años). Tutor responsable: ${patientProfile.displayName || 'Tutor'}. Inquietudes: ${tagsToSave.join(', ')}.`;
          sintesisIa = `Atención psicológica infanto-juvenil. Tutor legal ha solicitado apoyo por: ${tagsToSave.join(', ')}. Motivo observado por el tutor: "${patientProfile.motivo || ''}".`;
        } else {
          // Individual
          const stressVal = patientProfile.quickWellbeingScores?.stress ?? 1;
          const moodVal = patientProfile.quickWellbeingScores?.mood ?? 1;
          initialClinicalHistory = {
            resumen_vital: patientProfile.motivo || 'Acompañamiento psicológico individual y bienestar.',
            antecedentes_psicologicos: `Triaje clínico ágil completado. Focos y síntomas: ${tagsToSave.join(', ') || 'Bienestar general'}. Nivel de agobio/ansiedad basal: ${stressVal}/3. Nivel de desánimo basal: ${moodVal}/3.`,
            antecedentes_medicos: `Año de nacimiento: ${patientProfile.birthYear || 'No indicado'}. País: ${patientProfile.country || 'España'}. Modalidad: ${patientProfile.modality || 'Online'}.`,
            relaciones_contexto: patientProfile.emergencyContactName 
              ? `Contacto de emergencia: ${patientProfile.emergencyContactName} (${patientProfile.emergencyContactPhone || 'Sin teléfono'}).`
              : 'Sin contacto de emergencia especificado en el registro.',
            patrones_comunes: `Focos declarados: ${tagsToSave.join(', ') || 'Ansiedad, Autoexigencia'}.`
          };
          fotoPersona = `${patientNameFinal} (Adulto, nacido en ${patientProfile.birthYear || 'N/A'}). Motivo: "${patientProfile.motivo || 'N/A'}". Focos: ${tagsToSave.join(', ')}.`;
          sintesisIa = `Paciente registrado para acompañamiento individual. Focos prioritarios: ${tagsToSave.join(', ')}. Motivo de consulta: "${patientProfile.motivo || ''}".`;
        }

        // Asignación de terapeuta según modalidad
        let assignedPsyId = patientProfile.selectedPsychologistId || '2TOfkVIRccgIgz5WamAIVmUPtD63';
        if (patientProfile.consultationType === 'pareja') assignedPsyId = 'psy-pareja-01';
        if (patientProfile.consultationType === 'familiar') assignedPsyId = 'psy-infantil-01';

        const completePatientData = {
          id: finalUser.uid || finalUser.id,
          email: finalUser.email || email.trim(),
          role: 'paciente',
          display_name: patientNameFinal,
          triaje_completed: true,
          email_verified: finalUser.emailVerified || false,
          contexto_terapeutico: {
            displayName: patientNameFinal,
            consultationType: patientProfile.consultationType,
            birthYear: patientProfile.birthYear,
            country: patientProfile.country,
            preferredModality: patientProfile.modality,
            motivo: patientProfile.motivo,
            tags: tagsToSave,
            partnerName: patientProfile.partnerName,
            relationshipDuration: patientProfile.relationshipDuration,
            tutorName: patientProfile.displayName,
            tutorPhone: patientProfile.tutorPhone,
            childName: patientProfile.childName,
            childAge: patientProfile.childAge,
            triaje: {
              stressScore: patientProfile.quickWellbeingScores?.stress ?? 1,
              moodScore: patientProfile.quickWellbeingScores?.mood ?? 1,
              phq9: phq9Total > 0 ? phq9Total : undefined,
              gad7: gad7Total > 0 ? gad7Total : undefined,
              highRisk: isHighRisk,
              completedAt: formattedDate
            },
            emergencyContact: {
              name: patientProfile.emergencyContactName,
              phone: patientProfile.emergencyContactPhone
            },
            assigned_psychologist_id: assignedPsyId,
            paymentStatus: 'free_trial',
            historial_clinico: initialClinicalHistory,
            foto_persona: fotoPersona,
            sintesis_ia: sintesisIa,
            conclusiones: [
              `Modalidad de atención: ${patientProfile.consultationType.toUpperCase()}`,
              `Motivo inicial declarado: "${patientProfile.motivo || 'Acompañamiento psicológico y bienestar'}"`
            ],
            pautas_accion: [
              'La IA continuará la exploración clínica cálida e invisible en el chat diario.',
              'Expediente vivo sincronizado con el psicólogo colegiado asignado.'
            ],
            temas: tagsToSave.map(tag => ({
              title: tag,
              status: 'active',
              createdAt: formattedDate
            }))
          },
          updated_at: formattedDate,
          created_at: formattedDate
        };

        const profileDocRef = doc(db, 'profiles', String(finalUser.uid || finalUser.id));
        await setDoc(profileDocRef, completePatientData, { merge: true });

        // Sincronizar simultáneamente en clinical_profiles, timeline_events y clinical_life_tree
        try {
          const userIdStr = String(finalUser.uid || finalUser.id);
          
          await supabase.from('clinical_profiles').upsert({
            patient_id: userIdStr,
            summary_vital: patientProfile.motivo || `Paciente registrado (${patientProfile.consultationType}).`,
            psychological_history: initialClinicalHistory.antecedentes_psicologicos,
            medical_history: initialClinicalHistory.antecedentes_medicos,
            relationship_context: initialClinicalHistory.relaciones_contexto,
            patterns: initialClinicalHistory.patrones_comunes,
            goals: 'Completar expediente clínico y comenzar acompañamiento terapéutico.',
            risk_summary: isHighRisk ? 'Riesgo elevado detectado en triaje basal.' : 'Sin riesgo inminente detectado en triaje inicial.',
            last_synthesized_at: formattedDate
          }, { onConflict: 'patient_id' });

          await supabase.from('timeline_events').insert([{
            patient_id: userIdStr,
            date: dateOnly,
            event: `Registro y triaje completado en Áncora ⚓ (${patientProfile.consultationType})`,
            event_type: 'vital_event',
            authority_level: 3,
            created_at: formattedDate
          }]);

          await supabase.from('clinical_life_tree').upsert({
            patient_id: userIdStr,
            tree_data: {
              current_situation: [
                `Modalidad: ${patientProfile.consultationType}`,
                `Motivo inicial: ${patientProfile.motivo || 'No indicado'}`,
                `Focos: ${tagsToSave.join(', ') || 'Bienestar general'}`
              ],
              health: [
                `Modalidad preferida: ${patientProfile.modality || 'Online'}`
              ],
              relationships: [
                initialClinicalHistory.relaciones_contexto
              ],
              open_questions: [
                'Explorar historia vital, antecedentes familiares, calidad de sueño y rutinas diarias en conversaciones sucesivas.'
              ]
            },
            updated_at: formattedDate
          }, { onConflict: 'patient_id' });
        } catch (syncErr) {
          console.warn('[Triaje Sync] Nota de sincronización de tablas clínicas secundarias:', syncErr);
        }

        // Insertar registro formal de consentimiento clínico (Ley 41/2002 / RGPD Art. 9)
        try {
          await supabase.from('consents').insert([{
            user_id: finalUser.uid || finalUser.id,
            version: 'v1.0-2026',
            terms_accepted: true,
            clinical_consent_accepted: true,
            ip_hash: 'client_registered_ip_hash',
            user_agent_hash: navigator.userAgent ? 'secured_agent' : 'browser',
            created_at: formattedDate
          }]);
        } catch (cErr) {
          console.warn('Consent record sync note:', cErr);
        }

        // Si fue registro con Google (cuenta ya verificada), entra directo
        if (googleAuthUser) {
          setSuccessMsg('¡Triaje completado con éxito! Bienvenido a Áncora.');
          if (onAuthSuccess) {
            onAuthSuccess({ ...finalUser, triaje_completed: true });
          }
        } else {
          // Registro con Email/Password -> Pantalla de verificación de correo
          setEmailSentTo(email.trim());
          setResendCooldown(60);
          setAuthMode('verify_email');
        }
      }
    } catch (err) {
      console.error('Error al finalizar el registro:', err);
      setError(err.message || 'Error al completar el registro.');
    } finally {
      setLoading(false);
    }
  };

  // 4. FINALIZAR REGISTRO PSICÓLOGO
  const handleFinalSubmitPsychologist = async () => {
    setLoading(true);
    setError(null);
    try {
      let finalUser = googleAuthUser;

      if (!finalUser) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: { 
              role: 'psicologo',
              displayName: `${psyProfile.firstName} ${psyProfile.lastName}`.trim()
            }
          }
        });

        if (signUpError) throw signUpError;
        finalUser = signUpData.user;
      }

      if (finalUser) {
        const profileDocRef = doc(db, 'profiles', String(finalUser.uid || finalUser.id));
        const completePsyData = {
          id: finalUser.uid || finalUser.id,
          email: finalUser.email || email.trim(),
          role: 'psicologo',
          display_name: `${psyProfile.firstName} ${psyProfile.lastName}`.trim(),
          email_verified: finalUser.emailVerified || false,
          colegiado: {
            nombre: psyProfile.firstName,
            apellidos: psyProfile.lastName,
            numero_colegiado: psyProfile.licenseNumber,
            colegio_oficial: psyProfile.college,
            aseguradora_rc: psyProfile.insuranceName,
            poliza_rc: psyProfile.insurancePolicy,
            es_autonomo: psyProfile.isAutonomo,
            documento_titulo: psyProfile.uploadedFileName || 'pendiente'
          },
          perfil_clinico: {
            bio: psyProfile.bio,
            especialidades: psyProfile.selectedSpecialties,
            precio_sesion: psyProfile.sessionPrice,
            dias_disponibles: psyProfile.availabilityDays,
            buffer_minutos: psyProfile.bufferMinutes,
            stripe_conectado: psyProfile.stripeConnected
          },
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };

        await setDoc(profileDocRef, completePsyData, { merge: true });

        if (googleAuthUser) {
          setSuccessMsg('¡Perfil profesional registrado con éxito!');
          if (onAuthSuccess) {
            onAuthSuccess(finalUser);
          }
        } else {
          setEmailSentTo(email.trim());
          setResendCooldown(60);
          setAuthMode('verify_email');
        }
      }
    } catch (err) {
      console.error('Error al registrar psicólogo:', err);
      setError(err.message || 'Error al completar el registro profesional.');
    } finally {
      setLoading(false);
    }
  };

  // 5. REENVIAR CORREO DE VERIFICACIÓN
  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const { error: resendError } = await supabase.auth.resendVerificationEmail();
      if (resendError) throw resendError;
      setSuccessMsg(`Correo de verificación reenviado con éxito a ${emailSentTo || email}. Revisa tu bandeja de entrada y spam.`);
      setResendCooldown(60);
    } catch (err) {
      console.error('Error al reenviar verificación:', err);
      setError(err.message || 'No se pudo reenviar el correo. Si el problema persiste, intenta iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  // 6. RECUPERAR CONTRASEÑA
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Por favor introduce un correo electrónico válido.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (resetErr) throw resetErr;
      setSuccessMsg(`Te hemos enviado un enlace de recuperación a ${email}. Revisa tu correo.`);
    } catch (err) {
      console.error('Error al recuperar contraseña:', err);
      setError(err.message || 'Error al enviar enlace de recuperación.');
    } finally {
      setLoading(false);
    }
  };

  const consentTextPaciente = `CONSENTIMIENTO INFORMADO DE TELEPSICOLOGÍA v1.0
1. Aceptas que Ánquer es un asistente de apoyo basado en inteligencia artificial y no emite diagnósticos independientes ni sustituye al psicólogo clínico humano.
2. Autorizas el almacenamiento cifrado y tratamiento de tus datos para el seguimiento de tu terapia (RGPD Art. 9).
3. Eres propietario único de tu expediente clínico, el cual es 100% portable y descargable.
4. En caso de crisis severas o de riesgo vital, te comprometes a contactar al 024, 112 o acudir a un centro de urgencias.`;

  const consentTextPsicologo = `CONSENTIMIENTO DE USO PROFESIONAL Y STRIPE CONNECT v1.0
1. Aceptas registrarte como psicólogo clínico independiente (freelance).
2. Declaras poseer habilitación sanitaria (MPGS o PIR) y colegiación activa en España.
3. Stripe Connect procesará los cobros directos de los pacientes con split fiscal automatizado.
4. El copiloto SOAP genera borradores clínicos y no reemplaza tu criterio ni firma profesional.
5. Te comprometes a cumplir con el secreto profesional médico y la RGPD.`;

  const serifFont = "'Playfair Display', 'Libre Baskerville', 'Georgia', serif";
  const sansFont = "'Inter', sans-serif";

  return (
    <div className="flex-center" style={{ minHeight: '100vh', padding: '30px 16px', background: '#F8F6F1', fontFamily: sansFont, color: '#05213A' }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid rgba(5, 33, 58, 0.08)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: (authMode === 'register' && currentStep === 2) ? '640px' : '440px',
        padding: '36px 32px',
        boxShadow: '0 25px 50px rgba(5, 33, 58, 0.06)',
        transition: 'all 0.3s ease'
      }}>
        
        {/* CABECERA SOBRIA */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div className="flex-center" style={{ 
            width: '52px', 
            height: '52px', 
            margin: '0 auto 12px',
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(68, 125, 130, 0.4)',
            boxShadow: '0 4px 15px rgba(68, 125, 130, 0.2)',
            background: '#05213A'
          }}>
            <img src="/ancora_logo.png" alt="Áncora" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: serifFont, color: '#05213A', margin: 0 }}>
            {authMode === 'login' && 'Iniciar Sesión'}
            {authMode === 'register' && (role === 'psicologo' ? 'Registro Profesional' : 'Crear Cuenta')}
            {authMode === 'verify_email' && 'Verificación de Correo'}
            {authMode === 'forgot_password' && 'Recuperar Contraseña'}
          </h2>
          
          <p style={{ fontSize: '0.78rem', color: '#5F6F74', marginTop: '6px', lineHeight: 1.4 }}>
            {authMode === 'login' && 'Acceso al espacio confidencial de Áncora'}
            {authMode === 'register' && (
              role === 'psicologo' 
                ? 'Alta para psicólogos sanitarios colegiados' 
                : (currentStep === 1 ? 'Plataforma confidencial de acompañamiento psicológico' : 'Modalidad de consulta y asignación de especialista')
            )}
            {authMode === 'verify_email' && 'Confirma tu dirección de email para activar tu cuenta'}
            {authMode === 'forgot_password' && 'Enlace seguro para restablecer tu acceso'}
          </p>
        </div>

        {/* MENSAJES DE ALERTA O ERROR */}
        {error && (
          <div style={{ 
            background: 'rgba(244, 63, 94, 0.08)', 
            border: '1px solid rgba(244, 63, 94, 0.2)', 
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#f43f5e',
            fontSize: '0.76rem',
            textAlign: 'left'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, lineHeight: 1.4 }}>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ 
            background: 'rgba(127, 159, 136, 0.12)', 
            border: '1px solid rgba(127, 159, 136, 0.3)', 
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#447D82',
            fontSize: '0.76rem',
            textAlign: 'left'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1, lineHeight: 1.4 }}>{successMsg}</span>
          </div>
        )}

        {/* SELECTOR PRINCIPAL: INICIAR SESIÓN / CREAR CUENTA */}
        {(authMode === 'login' || (authMode === 'register' && currentStep === 1)) && (
          <div style={{ display: 'flex', background: '#F8F6F1', padding: '4px', borderRadius: '12px', border: '1px solid rgba(5,33,58,0.08)', marginBottom: '20px' }}>
            <button 
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError(null);
                setSuccessMsg(null);
              }}
              style={{ 
                flex: 1, 
                height: '38px', 
                fontSize: '0.8rem', 
                fontWeight: 700, 
                borderRadius: '8px', 
                background: authMode === 'login' ? '#05213A' : 'transparent', 
                color: authMode === 'login' ? '#ffffff' : '#5F6F74', 
                cursor: 'pointer', 
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: authMode === 'login' ? '0 2px 8px rgba(5,33,58,0.2)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <LogIn size={15} />
              <span>Iniciar Sesión</span>
            </button>

            <button 
              type="button"
              onClick={() => {
                setAuthMode('register');
                setCurrentStep(1);
                setError(null);
                setSuccessMsg(null);
              }}
              style={{ 
                flex: 1, 
                height: '38px', 
                fontSize: '0.8rem', 
                fontWeight: 700, 
                borderRadius: '8px', 
                background: authMode === 'register' ? '#05213A' : 'transparent', 
                color: authMode === 'register' ? '#ffffff' : '#5F6F74', 
                cursor: 'pointer', 
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: authMode === 'register' ? '0 2px 8px rgba(5,33,58,0.2)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <User size={15} />
              <span>Crear Cuenta</span>
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VISTA 1: MODO INICIO DE SESIÓN */}
        {/* ------------------------------------------------------------- */}
        {authMode === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Selector de rol */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                type="button"
                onClick={() => { setRole('paciente'); setError(null); }}
                style={{ 
                  flex: 1, 
                  height: '34px', 
                  fontSize: '0.76rem', 
                  fontWeight: 600, 
                  borderRadius: '8px', 
                  background: role === 'paciente' ? '#447D82' : '#F8F6F1', 
                  color: role === 'paciente' ? '#ffffff' : '#5F6F74', 
                  cursor: 'pointer', 
                  border: `1px solid ${role === 'paciente' ? '#447D82' : 'rgba(5,33,58,0.1)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>Paciente</span>
              </button>
              <button 
                type="button"
                onClick={() => { setRole('psicologo'); setError(null); }}
                style={{ 
                  flex: 1, 
                  height: '34px', 
                  fontSize: '0.76rem', 
                  fontWeight: 600, 
                  borderRadius: '8px', 
                  background: role === 'psicologo' ? '#447D82' : '#F8F6F1', 
                  color: role === 'psicologo' ? '#ffffff' : '#5F6F74', 
                  cursor: 'pointer', 
                  border: `1px solid ${role === 'psicologo' ? '#447D82' : 'rgba(5,33,58,0.1)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>Psicólogo Sanitario</span>
              </button>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'left' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>CORREO ELECTRÓNICO</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#9AA6AB" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input 
                  type="email" 
                  placeholder={role === 'psicologo' ? "correo@cop.es" : "usuario@ejemplo.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '38px', height: '38px', fontSize: '0.8rem', width: '100%', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A' }}
                  required 
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>CONTRASEÑA</label>
                <button
                  type="button"
                  onClick={() => { setAuthMode('forgot_password'); setError(null); }}
                  style={{ background: 'none', border: 'none', color: '#447D82', fontSize: '0.68rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#9AA6AB" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input 
                  type="password" 
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
              disabled={loading}
              style={{ 
                width: '100%', 
                marginTop: '4px', 
                height: '42px', 
                fontSize: '0.82rem', 
                borderRadius: '8px', 
                background: '#447D82', 
                color: '#ffffff', 
                fontWeight: 700, 
                cursor: 'pointer', 
                border: 'none',
                boxShadow: '0 4px 14px rgba(68,125,130,0.2)',
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Accediendo...' : 'Iniciar Sesión'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '6px 0', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(5, 33, 58, 0.08)' }} />
              <span style={{ fontSize: '0.62rem', color: '#9AA6AB', fontWeight: 700 }}>O ACCEDE CON</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(5, 33, 58, 0.08)' }} />
            </div>

            <button 
              type="button" 
              onClick={handleGoogleLogin}
              disabled={loading}
              style={{ 
                width: '100%', 
                height: '40px', 
                fontSize: '0.8rem', 
                borderRadius: '8px', 
                background: '#ffffff', 
                border: '1px solid rgba(5, 33, 58, 0.15)',
                color: '#05213A', 
                fontWeight: 600, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '10px'
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
          </form>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VISTA 2: MODO REGISTRO (DIRECTO Y LIMPIO) */}
        {/* ------------------------------------------------------------- */}
        {authMode === 'register' && (
          <div>
            
            {/* Banner de usuario autenticado con Google si procede */}
            {googleAuthUser && (
              <div style={{ background: 'rgba(68,125,130,0.08)', border: '1px solid rgba(68,125,130,0.2)', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.74rem', color: '#447D82', textAlign: 'left' }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>Registrando cuenta con Google: <strong>{googleAuthUser.email}</strong></span>
              </div>
            )}

            {/* Selector de Rol en Paso 1 */}
            {!googleAuthUser && currentStep === 1 && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button 
                  type="button"
                  onClick={() => { setRole('paciente'); setError(null); }}
                  style={{ 
                    flex: 1, 
                    height: '34px', 
                    fontSize: '0.76rem', 
                    fontWeight: 600, 
                    borderRadius: '8px', 
                    background: role === 'paciente' ? '#447D82' : '#F8F6F1', 
                    color: role === 'paciente' ? '#ffffff' : '#5F6F74', 
                    cursor: 'pointer', 
                    border: `1px solid ${role === 'paciente' ? '#447D82' : 'rgba(5,33,58,0.1)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Paciente</span>
                </button>
                <button 
                  type="button"
                  onClick={() => { setRole('psicologo'); setError(null); }}
                  style={{ 
                    flex: 1, 
                    height: '34px', 
                    fontSize: '0.76rem', 
                    fontWeight: 600, 
                    borderRadius: '8px', 
                    background: role === 'psicologo' ? '#447D82' : '#F8F6F1', 
                    color: role === 'psicologo' ? '#ffffff' : '#5F6F74', 
                    cursor: 'pointer', 
                    border: `1px solid ${role === 'psicologo' ? '#447D82' : 'rgba(5,33,58,0.1)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Psicólogo Sanitario</span>
                </button>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* FLUJO PACIENTE (SOLO 2 PASOS: 1. DATOS -> 2. MODALIDAD Y ESPECIALISTA) */}
            {/* ------------------------------------------------------------- */}
            {role === 'paciente' && (
              <div>
                
                {/* Paso 1: Datos de Acceso */}
                {currentStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                    
                    {/* Botón rápido con Google */}
                    <button 
                      type="button" 
                      onClick={handleGoogleLogin}
                      disabled={loading}
                      style={{ 
                        width: '100%', 
                        height: '40px', 
                        fontSize: '0.8rem', 
                        borderRadius: '8px', 
                        background: '#ffffff', 
                        border: '1px solid rgba(5, 33, 58, 0.15)',
                        color: '#05213A', 
                        fontWeight: 600, 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '10px'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.797 2.717v2.258h2.909c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                        <path d="M3.964 10.707a5.416 5.416 0 0 1-.283-1.707c0-.593.102-1.17.283-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.806 11.426 0 9 0 5.484 0 2.457 2.023.957 4.961l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335" />
                      </svg>
                      <span>Registrarse con Google</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '2px 0', gap: '10px' }}>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(5, 33, 58, 0.08)' }} />
                      <span style={{ fontSize: '0.62rem', color: '#9AA6AB', fontWeight: 700 }}>O CON TU CORREO</span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(5, 33, 58, 0.08)' }} />
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>NOMBRE O ALIAS</label>
                      <input 
                        type="text" 
                        value={displayName}
                        onChange={(e) => {
                          setDisplayName(e.target.value);
                          setPatientProfile(prev => ({ ...prev, displayName: e.target.value }));
                        }}
                        placeholder="Tu nombre o iniciales"
                        style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                      />
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>CORREO ELECTRÓNICO</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tuemail@ejemplo.com"
                        style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>CONTRASEÑA</label>
                        <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mín. 6 caracteres"
                          style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                        />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>CONFIRMAR</label>
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repite contraseña"
                          style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>

                    {/* Checkbox de Condiciones Legales y Sanitarias */}
                    <div style={{ background: 'rgba(68,125,130,0.04)', border: '1px solid rgba(68,125,130,0.12)', borderRadius: '8px', padding: '10px 12px' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.72rem', color: '#5F6F74', cursor: 'pointer', lineHeight: 1.45 }}>
                        <input 
                          type="checkbox" 
                          checked={termsAccepted} 
                          onChange={(e) => setTermsAccepted(e.target.checked)} 
                          style={{ marginTop: '2px', accentColor: '#447D82' }} 
                        />
                        <span>
                          Acepto los{' '}
                          <button type="button" onClick={() => setLegalModal('terms')} style={{ background: 'none', border: 'none', color: '#447D82', textDecoration: 'underline', padding: 0, font: 'inherit', cursor: 'pointer', fontWeight: 600 }}>Términos de Uso</button>, la{' '}
                          <button type="button" onClick={() => setLegalModal('privacy')} style={{ background: 'none', border: 'none', color: '#447D82', textDecoration: 'underline', padding: 0, font: 'inherit', cursor: 'pointer', fontWeight: 600 }}>Política de Privacidad</button> y el{' '}
                          <button type="button" onClick={() => setLegalModal('consent')} style={{ background: 'none', border: 'none', color: '#447D82', textDecoration: 'underline', padding: 0, font: 'inherit', cursor: 'pointer', fontWeight: 600 }}>Consentimiento Clínico (Ley 41/2002)</button>.
                        </span>
                      </label>
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        if (!displayName.trim()) {
                          setError('Por favor indica tu nombre o alias.');
                          return;
                        }
                        if (!email.includes('@')) {
                          setError('Por favor introduce un correo electrónico válido.');
                          return;
                        }
                        if (password.length < 6) {
                          setError('La contraseña debe tener al menos 6 caracteres.');
                          return;
                        }
                        if (password !== confirmPassword) {
                          setError('Las contraseñas no coinciden.');
                          return;
                        }
                        if (!termsAccepted) {
                          setError('Debes aceptar los términos de uso y el consentimiento clínico para continuar.');
                          return;
                        }
                        setError(null);
                        setCurrentStep(2);
                      }}
                      className="btn"
                      style={{ height: '42px', background: '#447D82', color: '#ffffff', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', border: 'none', marginTop: '4px' }}
                    >
                      Continuar a Selección de Modalidad <ArrowRight size={16} />
                    </button>
                  </div>
                )}

                {/* Paso 2: Selección de Modalidad & Finalización Directa */}
                {currentStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                    
                    {/* Selector de Modalidad */}
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#05213A', display: 'block', marginBottom: '8px' }}>
                        Modalidad de Acompañamiento
                      </span>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '8px' }}>
                        {[
                          { id: 'individual', title: 'Individual', desc: 'Adultos y jóvenes' },
                          { id: 'pareja', title: 'Terapia de Pareja', desc: 'Relación y convivencia' },
                          { id: 'familiar', title: 'Familia e Infancia', desc: 'Para padres y tutores' }
                        ].map(mod => {
                          const isSel = patientProfile.consultationType === mod.id;
                          return (
                            <div 
                              key={mod.id}
                              onClick={() => setPatientProfile(prev => ({ ...prev, consultationType: mod.id }))}
                              style={{
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: `2px solid ${isSel ? '#447D82' : 'rgba(5,33,58,0.1)'}`,
                                background: isSel ? 'rgba(68,125,130,0.06)' : '#ffffff',
                                cursor: 'pointer',
                                transition: 'all 0.15s'
                              }}
                            >
                              <strong style={{ fontSize: '0.78rem', color: '#05213A', display: 'block' }}>{mod.title}</strong>
                              <span style={{ fontSize: '0.64rem', color: '#5F6F74' }}>{mod.desc}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Inputs según modalidad */}
                    {patientProfile.consultationType === 'individual' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>AÑO DE NACIMIENTO</label>
                          <input 
                            type="number" 
                            value={patientProfile.birthYear}
                            onChange={(e) => setPatientProfile({ ...patientProfile, birthYear: e.target.value })}
                            placeholder="Ej. 1994"
                            style={{ height: '36px', paddingInline: '10px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.78rem' }}
                          />
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>MODALIDAD PREFERIDA</label>
                          <select 
                            value={patientProfile.modality}
                            onChange={(e) => setPatientProfile({ ...patientProfile, modality: e.target.value })}
                            style={{ height: '36px', paddingInline: '8px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', width: '100%', fontSize: '0.74rem' }}
                          >
                            <option value="online">Videollamada Online</option>
                            <option value="presencial">Terapia Presencial</option>
                            <option value="hibrida">Híbrida</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {patientProfile.consultationType === 'pareja' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>NOMBRE DE TU PAREJA</label>
                          <input 
                            type="text" 
                            value={patientProfile.partnerName}
                            onChange={(e) => setPatientProfile({ ...patientProfile, partnerName: e.target.value })}
                            placeholder="Ej. Carlos / Andrea"
                            style={{ height: '36px', paddingInline: '10px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.78rem' }}
                          />
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>TIEMPO DE RELACIÓN</label>
                          <input 
                            type="text" 
                            value={patientProfile.relationshipDuration}
                            onChange={(e) => setPatientProfile({ ...patientProfile, relationshipDuration: e.target.value })}
                            placeholder="Ej. 4 años"
                            style={{ height: '36px', paddingInline: '10px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.78rem' }}
                          />
                        </div>
                      </div>
                    )}

                    {patientProfile.consultationType === 'familiar' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>NOMBRE DEL MENOR</label>
                          <input 
                            type="text" 
                            value={patientProfile.childName}
                            onChange={(e) => setPatientProfile({ ...patientProfile, childName: e.target.value })}
                            placeholder="Ej. Lucas / Sofía"
                            style={{ height: '36px', paddingInline: '10px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.78rem' }}
                          />
                        </div>
                        <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>EDAD DEL MENOR</label>
                          <input 
                            type="number" 
                            value={patientProfile.childAge}
                            onChange={(e) => setPatientProfile({ ...patientProfile, childAge: e.target.value })}
                            placeholder="Ej. 9"
                            style={{ height: '36px', paddingInline: '10px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.78rem' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Foco de consulta */}
                    <div>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74', display: 'block', marginBottom: '6px' }}>
                        ÁREAS O TEMAS DE INTERÉS
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(patientProfile.consultationType === 'pareja' ? coupleTags : (patientProfile.consultationType === 'familiar' ? familyTags : individualTags)).map(tag => {
                          const isSelected = patientProfile.selectedTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => togglePatientTag(tag)}
                              style={{ 
                                cursor: 'pointer',
                                padding: '5px 10px',
                                borderRadius: '999px',
                                background: isSelected ? '#447D82' : '#F8F6F1',
                                border: `1px solid ${isSelected ? '#447D82' : 'rgba(5,33,58,0.1)'}`,
                                color: isSelected ? '#ffffff' : '#5F6F74',
                                fontSize: '0.68rem',
                                fontWeight: isSelected ? 700 : 500,
                                transition: 'all 0.15s'
                              }}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Terapeuta asignado */}
                    {(() => {
                      const selectedPsy = mockPsychologists.find(p => p.roleType === patientProfile.consultationType) || mockPsychologists[0];
                      return (
                        <div 
                          style={{ 
                            padding: '12px', 
                            border: '1px solid rgba(68,125,130,0.3)',
                            background: 'rgba(68,125,130,0.03)',
                            borderRadius: '8px',
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'center'
                          }}
                        >
                          <img src={selectedPsy.photo_url} alt={selectedPsy.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                          <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '0.82rem', color: '#05213A', display: 'block' }}>{selectedPsy.name}</strong>
                            <span style={{ fontSize: '0.64rem', color: '#5F6F74', display: 'block' }}>{selectedPsy.approach} · Colegiado {selectedPsy.license}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#447D82' }}>Supervisión Activa</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Botones de acción */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                      {!googleAuthUser && (
                        <button type="button" onClick={() => setCurrentStep(1)} className="btn btn-outline" style={{ flex: 1, borderRadius: '8px', height: '40px', fontSize: '0.78rem' }}>
                          <ArrowLeft size={14} /> Atrás
                        </button>
                      )}
                      <button 
                        type="button"
                        onClick={handleFinalSubmitPatient}
                        disabled={loading}
                        className="btn" 
                        style={{ flex: 2, background: '#447D82', color: '#ffffff', borderRadius: '8px', fontWeight: 700, border: 'none', cursor: 'pointer', height: '40px', fontSize: '0.8rem' }}
                      >
                        {loading ? 'Activando...' : 'Completar Registro y Entrar'}
                      </button>
                    </div>

                  </div>
                )}

              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* FLUJO PSICÓLOGO (PASOS 1 AL 6) */}
            {/* ------------------------------------------------------------- */}
            {role === 'psicologo' && (
              <div>
                
                {/* Paso 1: Cuenta Profesional */}
                {currentStep === 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                    
                    {/* Botón rápido con Google para Psicólogos */}
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
                        fontWeight: 600, 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '10px',
                        marginBottom: '4px',
                        transition: 'all 0.15s'
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
                        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.797 2.717v2.258h2.909c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4" />
                        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                        <path d="M3.964 10.707a5.416 5.416 0 0 1-.283-1.707c0-.593.102-1.17.283-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
                        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.806 11.426 0 9 0 5.484 0 2.457 2.023.957 4.961l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#EA4335" />
                      </svg>
                      <span>Registrarse con Google (Profesional)</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0', gap: '10px' }}>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(5, 33, 58, 0.08)' }} />
                      <span style={{ fontSize: '0.62rem', color: '#9AA6AB', fontWeight: 700 }}>O CON EMAIL PROFESIONAL</span>
                      <div style={{ flex: 1, height: '1px', background: 'rgba(5, 33, 58, 0.08)' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>NOMBRE</label>
                        <input 
                          type="text" 
                          value={psyProfile.firstName}
                          onChange={(e) => setPsyProfile({ ...psyProfile, firstName: e.target.value })}
                          placeholder="Ej. Lucía"
                          style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                        />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>APELLIDOS</label>
                        <input 
                          type="text" 
                          value={psyProfile.lastName}
                          onChange={(e) => setPsyProfile({ ...psyProfile, lastName: e.target.value })}
                          placeholder="Ej. Vega"
                          style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>EMAIL PROFESIONAL</label>
                      <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ejemplo@cop.es"
                        style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>CONTRASEÑA</label>
                        <input 
                          type="password" 
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mín. 6 caracteres"
                          style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                        />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>CONFIRMAR</label>
                        <input 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repite contraseña"
                          style={{ height: '38px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ background: 'rgba(68,125,130,0.04)', border: '1px solid rgba(68,125,130,0.12)', borderRadius: '8px', padding: '10px 12px' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.72rem', color: '#5F6F74', cursor: 'pointer', lineHeight: 1.45 }}>
                        <input 
                          type="checkbox" 
                          checked={termsAccepted} 
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          style={{ marginTop: '2px', accentColor: '#447D82' }} 
                        />
                        <span>
                          Acepto las{' '}
                          <button type="button" onClick={() => setLegalModal('terms')} style={{ background: 'none', border: 'none', color: '#447D82', textDecoration: 'underline', padding: 0, font: 'inherit', cursor: 'pointer', fontWeight: 600 }}>Condiciones de la Plataforma Profesional</button> y la{' '}
                          <button type="button" onClick={() => setLegalModal('privacy')} style={{ background: 'none', border: 'none', color: '#447D82', textDecoration: 'underline', padding: 0, font: 'inherit', cursor: 'pointer', fontWeight: 600 }}>Política de Privacidad de Salud</button>.
                        </span>
                      </label>
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        if (!psyProfile.firstName || !psyProfile.lastName || !email.includes('@') || password.length < 6) {
                          setError('Completa todos los campos obligatorios.');
                          return;
                        }
                        if (password !== confirmPassword) {
                          setError('Las contraseñas no coinciden.');
                          return;
                        }
                        if (!termsAccepted) {
                          setError('Debes aceptar las condiciones de la plataforma.');
                          return;
                        }
                        setError(null);
                        setCurrentStep(2);
                      }}
                      className="btn"
                      style={{ height: '42px', background: '#447D82', color: '#ffffff', borderRadius: '999px', fontWeight: 700, cursor: 'pointer', border: 'none', marginTop: '6px' }}
                    >
                      Continuar a Colegiación <ArrowRight size={15} />
                    </button>
                  </div>
                )}

                {/* Paso 2: KYC Sanitario y Credenciales */}
                {currentStep === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>NÚMERO DE COLEGIADO</label>
                      <input 
                        type="text" 
                        value={psyProfile.licenseNumber}
                        onChange={(e) => setPsyProfile({ ...psyProfile, licenseNumber: e.target.value })}
                        placeholder="Ej. M-29837"
                        style={{ height: '36px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                      />
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>COLEGIO OFICIAL DE PSICOLOGÍA (COP)</label>
                      <input 
                        type="text" 
                        value={psyProfile.college}
                        onChange={(e) => setPsyProfile({ ...psyProfile, college: e.target.value })}
                        style={{ height: '36px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>ASEGURADORA RC</label>
                        <input 
                          type="text" 
                          value={psyProfile.insuranceName}
                          onChange={(e) => setPsyProfile({ ...psyProfile, insuranceName: e.target.value })}
                          placeholder="Ej. Broker's"
                          style={{ height: '36px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                        />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>Nº PÓLIZA RC</label>
                        <input 
                          type="text" 
                          value={psyProfile.insurancePolicy}
                          onChange={(e) => setPsyProfile({ ...psyProfile, insurancePolicy: e.target.value })}
                          placeholder="Ej. RC-92841"
                          style={{ height: '36px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>

                    <div 
                      style={{ border: '2px dashed rgba(68,125,130,0.4)', borderRadius: '10px', padding: '14px', textAlign: 'center', background: '#F8F6F1', cursor: 'pointer' }} 
                      onClick={() => setPsyProfile({ ...psyProfile, uploadedFileName: 'titulo_sanitario_verificado.pdf' })}
                    >
                      <Upload size={20} color="#447D82" style={{ margin: '0 auto 4px' }} />
                      <span style={{ fontSize: '0.72rem', color: '#5F6F74', display: 'block' }}>
                        {psyProfile.uploadedFileName ? `Cargado: ${psyProfile.uploadedFileName}` : 'Adjuntar certificado o título sanitario (PDF)'}
                      </span>
                    </div>

                    <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.7rem', color: '#5F6F74', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={psyProfile.isAutonomo} 
                        onChange={(e) => setPsyProfile({ ...psyProfile, isAutonomo: e.target.checked })}
                        style={{ marginTop: '2px', accentColor: '#447D82' }}
                      />
                      <span>Declaro estar de alta en el régimen de autónomos o mutualidad sanitaria.</span>
                    </label>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" onClick={() => setCurrentStep(1)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '40px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        type="button"
                        onClick={() => {
                          if (!psyProfile.licenseNumber || !psyProfile.isAutonomo) {
                            setError('Completa el número de colegiado y confirma tu situación de autónomo.');
                          } else {
                            setError(null);
                            setCurrentStep(3);
                          }
                        }}
                        className="btn" 
                        style={{ flex: 1, background: '#447D82', color: '#ffffff', borderRadius: '999px', fontWeight: 700, border: 'none', height: '40px' }}
                      >
                        Siguiente: Perfil <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Paso 3: Perfil Clínico y Especialidades */}
                {currentStep === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>PRESENTACIÓN CLÍNICA (BIO)</label>
                      <textarea 
                        value={psyProfile.bio}
                        onChange={(e) => setPsyProfile({ ...psyProfile, bio: e.target.value })}
                        placeholder="Describe brevemente tu orientación terapéutica y experiencia..."
                        style={{ height: '65px', padding: '10px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.75rem', resize: 'none', width: '100%' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74', display: 'block', marginBottom: '6px' }}>ESPECIALIDADES PRINCIPALES</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {specialtyTags.map(tag => {
                          const isSelected = psyProfile.selectedSpecialties.includes(tag);
                          return (
                            <button 
                              key={tag} 
                              type="button"
                              onClick={() => togglePsySpecialty(tag)}
                              style={{ 
                                cursor: 'pointer',
                                padding: '5px 10px',
                                borderRadius: '999px',
                                background: isSelected ? '#447D82' : '#F8F6F1',
                                border: `1px solid ${isSelected ? '#447D82' : 'rgba(5,33,58,0.1)'}`,
                                color: isSelected ? '#ffffff' : '#5F6F74',
                                fontSize: '0.7rem',
                                fontWeight: isSelected ? 700 : 500
                              }}
                            >
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>HONORARIOS POR SESIÓN (1 HORA)</label>
                      <input 
                        type="number" 
                        value={psyProfile.sessionPrice}
                        onChange={(e) => setPsyProfile({ ...psyProfile, sessionPrice: e.target.value })}
                        style={{ height: '36px', paddingInline: '12px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.8rem' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" onClick={() => setCurrentStep(2)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '40px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        type="button"
                        onClick={() => {
                          if (psyProfile.selectedSpecialties.length === 0) {
                            setError('Selecciona al menos una especialidad.');
                          } else {
                            setError(null);
                            setCurrentStep(4);
                          }
                        }}
                        className="btn" 
                        style={{ flex: 1, background: '#447D82', color: '#ffffff', borderRadius: '999px', fontWeight: 700, border: 'none', height: '40px' }}
                      >
                        Siguiente: Disponibilidad <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Paso 4: Disponibilidad y Buffer */}
                {currentStep === 4 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                    <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>DÍAS DE ATENCIÓN HABILITADOS</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '6px' }}>
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
                            fontSize: '0.68rem',
                            textTransform: 'capitalize',
                            borderRadius: '6px',
                            border: `1px solid ${psyProfile.availabilityDays[day] ? '#447D82' : 'rgba(5,33,58,0.1)'}`,
                            background: psyProfile.availabilityDays[day] ? '#447D82' : '#F8F6F1',
                            color: psyProfile.availabilityDays[day] ? '#ffffff' : '#5F6F74',
                            cursor: 'pointer',
                            fontWeight: psyProfile.availabilityDays[day] ? 700 : 500
                          }}
                        >
                          {day}
                        </button>
                      ))}
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '6px' }}>
                      <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>BUFFER ENTRE CONSULTAS (MINUTOS)</label>
                      <select 
                        value={psyProfile.bufferMinutes}
                        onChange={(e) => setPsyProfile({ ...psyProfile, bufferMinutes: e.target.value })}
                        style={{ height: '36px', paddingInline: '10px', border: '1px solid rgba(5,33,58,0.12)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', width: '100%', fontSize: '0.8rem' }}
                      >
                        <option value="5">5 Minutos</option>
                        <option value="10">10 Minutos</option>
                        <option value="15">15 Minutos</option>
                        <option value="20">20 Minutos</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" onClick={() => setCurrentStep(3)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '40px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        type="button"
                        onClick={() => setCurrentStep(5)}
                        className="btn" 
                        style={{ flex: 1, background: '#447D82', color: '#ffffff', borderRadius: '999px', fontWeight: 700, border: 'none', height: '40px' }}
                      >
                        Pasarela de Cobros <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Paso 5: Stripe Connect y Split Fiscal */}
                {currentStep === 5 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                    <div style={{ background: '#05213A', padding: '16px', borderRadius: '12px', color: '#ffffff', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#7F9F88' }}>
                        <ShieldCheck size={20} />
                        <strong style={{ fontSize: '0.82rem' }}>Pasarela Profesional Stripe Connect</strong>
                      </div>
                      <p style={{ fontSize: '0.68rem', color: '#9AA6AB', lineHeight: 1.4, margin: 0 }}>
                        Recibes tus honorarios directos exentos de IVA conforme al Art. 20.Uno.3º de la Ley del IVA.
                      </p>
                    </div>

                    {psyProfile.stripeConnected ? (
                      <div style={{ background: 'rgba(127, 159, 136, 0.1)', border: '1px solid #7F9F88', borderRadius: '8px', padding: '10px', textAlign: 'center', fontSize: '0.76rem', color: '#447D82', fontWeight: 700 }}>
                        ✓ Cuenta bancaria vinculada para liquidaciones directas
                      </div>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setPsyProfile({ ...psyProfile, stripeConnected: true })}
                        style={{ height: '40px', background: '#05213A', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
                      >
                        <span>Vincular cuenta con Stripe Connect</span>
                      </button>
                    )}

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" onClick={() => setCurrentStep(4)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '40px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        type="button"
                        onClick={() => {
                          if (!psyProfile.stripeConnected) {
                            setError('Vincula tu cuenta Stripe Connect para liquidar tus consultas.');
                          } else {
                            setError(null);
                            setCurrentStep(6);
                          }
                        }}
                        className="btn" 
                        style={{ flex: 1, background: '#447D82', color: '#ffffff', borderRadius: '999px', fontWeight: 700, border: 'none', height: '40px' }}
                      >
                        Siguiente: Deontología <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Paso 6: Deontología y Finalización */}
                {currentStep === 6 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                    <div style={{ background: '#F8F6F1', border: '1px solid rgba(5,33,58,0.08)', borderRadius: '8px', padding: '12px', maxHeight: '140px', overflowY: 'auto', fontSize: '0.7rem', color: '#5F6F74', whiteSpace: 'pre-line', lineHeight: 1.45 }}>
                      {consentTextPsicologo}
                    </div>

                    <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.72rem', cursor: 'pointer', color: '#5F6F74' }}>
                      <input 
                        type="checkbox" 
                        checked={patientConsent} 
                        onChange={(e) => setPatientConsent(e.target.checked)} 
                        style={{ marginTop: '2px', accentColor: '#447D82' }}
                      />
                      <span>Declaro bajo juramento mi habilitación sanitaria activa y colegiación en el COP.</span>
                    </label>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" onClick={() => setCurrentStep(5)} className="btn btn-outline" style={{ flex: 1, borderRadius: '999px', height: '42px' }}><ArrowLeft size={15} /> Atrás</button>
                      <button 
                        type="button"
                        onClick={handleFinalSubmitPsychologist}
                        disabled={loading}
                        className="btn" 
                        style={{ flex: 1, background: '#447D82', color: '#ffffff', borderRadius: '999px', fontWeight: 700, border: 'none', cursor: 'pointer', height: '42px' }}
                      >
                        {loading ? 'Confirmando...' : 'Finalizar Registro Profesional'}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* VOLVER AL LOGIN */}
            <div style={{ marginTop: '18px', textAlign: 'center', fontSize: '0.76rem', color: '#5F6F74' }}>
              ¿Ya tienes cuenta activa?{' '}
              <button
                type="button" 
                onClick={() => { setAuthMode('login'); setCurrentStep(1); setError(null); }} 
                style={{ background: 'none', border: 'none', color: '#447D82', cursor: 'pointer', fontWeight: 700, textDecoration: 'underline', padding: 0 }}
              >
                Inicia sesión aquí
              </button>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VISTA 3: CONFIRMACIÓN DE VERIFICACIÓN DE CORREO PENDIENTE */}
        {/* ------------------------------------------------------------- */}
        {authMode === 'verify_email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center', padding: '10px 0' }}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              background: 'rgba(68,125,130,0.12)', 
              border: '2px solid #447D82',
              color: '#447D82',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto'
            }}>
              <Send size={28} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#05213A' }}>
                ¡Te hemos enviado un correo de verificación!
              </span>
              <span style={{ fontSize: '0.78rem', color: '#5F6F74', lineHeight: 1.5 }}>
                Hemos enviado un enlace seguro a <strong style={{ color: '#05213A' }}>{emailSentTo || email}</strong>. Haz clic en el enlace para validar tu cuenta y completar tu acceso.
              </span>
            </div>

            <div style={{ background: '#F8F6F1', border: '1px solid rgba(5,33,58,0.08)', borderRadius: '12px', padding: '14px', fontSize: '0.72rem', color: '#5F6F74', textAlign: 'left', lineHeight: 1.45 }}>
              <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: '#05213A' }}>Consejos de seguridad:</p>
              <ul style={{ margin: 0, paddingLeft: '16px' }}>
                <li>Si no lo ves en tu bandeja principal, revisa la carpeta de <em>Spam</em> o <em>Promociones</em>.</li>
                <li>Una vez verificado tu correo, pulsa en "Ir a Iniciar Sesión".</li>
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                type="button"
                onClick={handleResendEmail}
                disabled={loading || resendCooldown > 0}
                style={{ 
                  height: '42px', 
                  borderRadius: '999px', 
                  background: resendCooldown > 0 ? '#E2E8F0' : '#447D82', 
                  color: resendCooldown > 0 ? '#94A3B8' : '#ffffff', 
                  fontWeight: 700, 
                  fontSize: '0.8rem',
                  border: 'none', 
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <RefreshCw size={14} className={loading ? 'spin' : ''} />
                <span>{resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar correo de verificación'}</span>
              </button>

              <button 
                type="button"
                onClick={() => { setAuthMode('login'); setError(null); setSuccessMsg('Inicia sesión con tu correo verificado.'); }}
                style={{ 
                  height: '42px', 
                  borderRadius: '999px', 
                  background: '#ffffff', 
                  border: '1px solid rgba(5,33,58,0.15)',
                  color: '#05213A', 
                  fontWeight: 700, 
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
              >
                Ya lo he verificado · Iniciar Sesión
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VISTA 4: RECUPERAR CONTRASEÑA */}
        {/* ------------------------------------------------------------- */}
        {authMode === 'forgot_password' && (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>CORREO ELECTRÓNICO REGISTRADO</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#9AA6AB" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="tuemail@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '38px', height: '40px', fontSize: '0.8rem', width: '100%', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '10px', background: '#F8F6F1', color: '#05213A' }}
                  required 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                width: '100%', 
                height: '44px', 
                fontSize: '0.82rem', 
                borderRadius: '999px', 
                background: '#447D82', 
                color: '#ffffff', 
                fontWeight: 700, 
                cursor: 'pointer', 
                border: 'none'
              }}
            >
              {loading ? 'Enviando enlace...' : 'Enviar Enlace de Recuperación'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setError(null); }}
                style={{ background: 'none', border: 'none', color: '#447D82', fontSize: '0.76rem', cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          </form>
        )}

      </div>

      {/* Modal Legal Flotante si el usuario hace clic en los enlaces legales */}
      {legalModal && (
        <LegalModals modalType={legalModal} onClose={() => setLegalModal(null)} />
      )}
    </div>
  );
}
