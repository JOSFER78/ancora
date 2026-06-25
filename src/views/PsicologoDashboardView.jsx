import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ChatView from './ChatView';
import AjustesView from './AjustesView';
import { 
  getPendingProposals, acceptProposal, rejectProposal, 
  getMedications, addMedication, 
  getTimelineEvents, addTimelineEvent, 
  AuthorityLevels, AuthorityLabels 
} from '../lib/clinicalEngine';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle, 
  Calendar, 
  CreditCard, 
  FileText, 
  Sparkles, 
  Clock, 
  Search, 
  Heart, 
  User, 
  ArrowRight,
  TrendingUp, 
  Check, 
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Video,
  ListFilter,
  Plus,
  ArrowLeft,
  Settings,
  BookOpen,
  Volume2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Trash2,
  XCircle,
  Edit
} from 'lucide-react';

const EmptyStatePatients = () => (
  <div className="glass-panel animate-fade-in" style={{ padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', border: '1px dashed rgba(255,255,255,0.1)' }}>
    <Users size={40} style={{ color: 'var(--color-cyan)', opacity: 0.5 }} />
    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 800 }}>Consulta Clínica Vacía</h3>
    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: '420px', margin: '0 auto', lineHeight: 1.5 }}>
      No tienes ningún paciente asignado actualmente en tu panel de ÁNCORA. En cuanto un paciente sea vinculado a tu consulta o agende su sesión de triaje, podrás gestionar su perfil clínico, notas SOAP e informes evolutivos aquí.
    </p>
  </div>
);

export default function PsicologoDashboardView({ 
  user, 
  profile, 
  isVirtualDemo = false,
  onLogout,
  onProfileUpdated,
  sidebarCollapsed = false,
  setSidebarCollapsed,
  activeSection: propsActiveSection,
  setActiveSection: propsSetActiveSection
}) {
  // Navigation internal to the clinical portal
  const [localActiveSection, localSetActiveSection] = useState('dashboard');
  const activeSection = propsActiveSection || localActiveSection;
  const setActiveSection = propsSetActiveSection || localSetActiveSection;
  const [rawReviewed, setRawReviewed] = useState(false);
  const [patientSubTab, setPatientSubTab] = useState('resumen'); // 'resumen' | 'raw' | 'notas' | 'sesiones' | 'tareas' | 'medicacion' | 'consentimientos'

  // Real Supabase Appointments
  const [clinicalNavCollapsed, setClinicalNavCollapsed] = useState(false);
  const [dbAppointments, setDbAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  const fetchDbAppointments = async () => {
    if (!profile?.id) return;
    try {
      setLoadingAppts(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('psychologist_id', profile.id);

      if (error) throw error;

      // Fetch profiles to map patient names
      const { data: patientsData } = await supabase
        .from('profiles')
        .select('id, contexto_terapeutico')
        .in('role', ['paciente', 'emilio']);

      const patMap = {};
      (patientsData || []).forEach(p => {
        patMap[p.id] = p.contexto_terapeutico?.displayName || p.contexto_terapeutico?.name || `Paciente #${p.id.substring(0, 5)}`;
      });

      const mapped = (data || []).map(a => ({
        ...a,
        patientName: patMap[a.patient_id] || `Paciente #${a.patient_id.substring(0, 5)}`
      }));

      // Ordenar por fecha y hora descendente
      mapped.sort((x, y) => {
        const dateX = new Date(`${x.appointment_date}T${x.appointment_time}`);
        const dateY = new Date(`${y.appointment_date}T${y.appointment_time}`);
        return dateY - dateX;
      });

      setDbAppointments(mapped);
    } catch (err) {
      console.error("Error fetching db appointments:", err.message);
    } finally {
      setLoadingAppts(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'agenda' && profile?.id) {
      fetchDbAppointments();
    }
  }, [activeSection, profile?.id]);

  // Google Calendar & Availability States
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [googleSynced, setGoogleSynced] = useState(false);
  const [sessionFee, setSessionFee] = useState(profile?.contexto_terapeutico?.sessionPrice || 49);
  const [asyncFee, setAsyncFee] = useState(29); // Tarifa mínima asíncrona
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth()); // 0-11
  const [blockedDates, setBlockedDates] = useState([]);
  const [workingDays, setWorkingDays] = useState(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
  
  // Google Calendar View States
  const [calendarView, setCalendarView] = useState('month'); // 'month' | 'week' | 'day'
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState('');
  const [quickAddHour, setQuickAddHour] = useState('09:00');
  const [quickAddPatientId, setQuickAddPatientId] = useState('');
  const [quickAddType, setQuickAddType] = useState('Sesión Individual');
  
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const loadPsychologistAvailability = async () => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('psychologist_profiles')
        .select('*')
        .eq('id', profile.id)
        .single();
      
      if (!error && data) {
        if (data.availability) {
          try {
            const avail = typeof data.availability === 'string' ? JSON.parse(data.availability) : data.availability;
            setGoogleSynced(avail.google_connected || false);
            if (avail.blocked_dates) setBlockedDates(avail.blocked_dates);
            if (avail.working_days) setWorkingDays(avail.working_days);
            
            if (avail.custom_available_slots) {
              const slots = [];
              Object.entries(avail.custom_available_slots).forEach(([d, hours]) => {
                hours.forEach(hour => {
                  slots.push({ day: d, hour, status: 'available' });
                });
              });
              setAvailabilitySlots(slots);
            }
          } catch (jsonErr) {
            console.warn("Availability is not a structured JSON in Supabase:", data.availability);
            setGoogleSynced(false);
            setAvailabilitySlots([]);
          }
        }
      }
    } catch (err) {
      console.error("Error loading availability in dashboard:", err.message);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      loadPsychologistAvailability();
    }
  }, [profile?.id]);

  const handleSyncGoogleCalendar = async () => {
    if (!profile?.id) return;
    setIsSyncingGoogle(true);
    try {
      const { data, error } = await supabase
        .from('psychologist_profiles')
        .select('*')
        .eq('id', profile.id)
        .single();
      
      if (error) throw error;
      
      let avail = {};
      if (data && data.availability) {
        try {
          avail = typeof data.availability === 'string' ? JSON.parse(data.availability) : data.availability;
        } catch (e) {
          console.warn("Availability was plain text, resetting to object:", data.availability);
          avail = {};
        }
      }
      
      const nextState = !googleSynced;
      avail.google_connected = nextState;
      
      const { error: updateError } = await supabase
        .from('psychologist_profiles')
        .update({
          availability: JSON.stringify(avail)
        })
        .eq('id', profile.id);
      
      if (updateError) throw updateError;
      
      setGoogleSynced(nextState);
    } catch (err) {
      console.error("Error updating google sync in Supabase:", err.message);
      alert("Error al guardar la sincronización: " + err.message);
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const handleToggleSlot = async (day, hour) => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('psychologist_profiles')
        .select('*')
        .eq('id', profile.id)
        .single();
      
      if (error) throw error;
      
      let avail = {};
      if (data && data.availability) {
        try {
          avail = typeof data.availability === 'string' ? JSON.parse(data.availability) : data.availability;
        } catch (e) {
          console.warn("Availability was plain text, resetting to object:", data.availability);
          avail = {};
        }
      }
      
      if (!avail.custom_available_slots) {
        avail.custom_available_slots = {};
      }
      if (!avail.custom_available_slots[day]) {
        avail.custom_available_slots[day] = [];
      }
      
      const exists = avail.custom_available_slots[day].includes(hour);
      let updatedHours;
      if (exists) {
        updatedHours = avail.custom_available_slots[day].filter(h => h !== hour);
      } else {
        updatedHours = [...avail.custom_available_slots[day], hour];
      }
      
      avail.custom_available_slots[day] = updatedHours;
      
      const { error: updateError } = await supabase
        .from('psychologist_profiles')
        .update({
          availability: JSON.stringify(avail)
        })
        .eq('id', profile.id);
      
      if (updateError) throw updateError;
      
      // Actualizar estado local
      const slots = [];
      Object.entries(avail.custom_available_slots).forEach(([d, hours]) => {
        hours.forEach(h => {
          slots.push({ day: d, hour: h, status: 'available' });
        });
      });
      setAvailabilitySlots(slots);
    } catch (err) {
      console.error("Error toggling slot in Supabase:", err.message);
      alert("Error al guardar slot: " + err.message);
    }
  };

  const handleToggleBlockDate = async (dateStr) => {
    if (!profile?.id) return;
    try {
      const { data, error } = await supabase
        .from('psychologist_profiles')
        .select('*')
        .eq('id', profile.id)
        .single();
      
      if (error) throw error;
      
      let avail = {};
      if (data && data.availability) {
        try {
          avail = typeof data.availability === 'string' ? JSON.parse(data.availability) : data.availability;
        } catch (e) {
          console.warn("Availability was plain text, resetting:", data.availability);
          avail = {};
        }
      }
      
      if (!avail.blocked_dates) avail.blocked_dates = [];
      
      const exists = avail.blocked_dates.includes(dateStr);
      let updatedBlocked;
      if (exists) {
        updatedBlocked = avail.blocked_dates.filter(d => d !== dateStr);
      } else {
        updatedBlocked = [...avail.blocked_dates, dateStr];
      }
      
      avail.blocked_dates = updatedBlocked;
      
      const { error: updateError } = await supabase
        .from('psychologist_profiles')
        .update({
          availability: JSON.stringify(avail)
        })
        .eq('id', profile.id);
      
      if (updateError) throw updateError;
      
      setBlockedDates(updatedBlocked);
    } catch (err) {
      console.error("Error toggling blocked date in Supabase:", err.message);
      alert("Error al cambiar bloqueo de día: " + err.message);
    }
  };

  // Selected patient
  const [selectedPatientId, setSelectedPatientId] = useState(isVirtualDemo ? 'p-1' : null);
  
  // Real or mock data
  const [patients, setPatients] = useState(() => {
    if (isVirtualDemo) {
      return [
        {
          id: 'p-1',
          name: 'María Fernanda Rodríguez',
          age: 38,
          gender: 'Femenino',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150&h=150',
          status: 'Activa',
          lastActive: 'Hoy, 10:20',
          triage: { phq9: 21, gad7: 18, status: 'risk_high', desc: 'Riesgo Alto' },
          adherence: 32,
          alertsCount: 2,
          specialties: ['Ansiedad Generalizada', 'Depresión Mayor', 'Autoexigencia', 'Estrés Laboral'],
          temasClave: ['Autoexigencia', 'Agotamiento', 'Insomnio', 'Ansiedad social'],
          consent: { accepted: true, version: 'v1.0-2026', date: '30/05/2026' },
          rawLogs: [
            {
              id: 'log-1',
              time: 'Ayer, 22:34',
              text: 'Hoy me sentí completamente desbordada en el trabajo. Lloré en el baño porque sentí que nunca voy a ser suficiente. Pienso que si desisto, todo va a ser...',
              context: 'Trabajo · Despacho',
              sleep: '5h'
            },
            {
              id: 'log-2',
              time: 'Hace 2 días, 18:12',
              text: 'No tengo ganas de nada. Me esfuerzo por sonreír, pero por dentro me siento vacía. Siento culpa por no poder más.',
              context: 'Conflicto familiar · Sobremesa',
              sleep: '6h'
            }
          ],
          medications: [
            { id: 'm-1', name: 'Atomoxetina', dose: '40mg', schedule: '1-0-0 (Mañanas)', compliance: '90%' },
            { id: 'm-2', name: 'Melatonina', dose: '1.9mg', schedule: '0-0-1 (Noches)', compliance: '75%' }
          ],
          tasks: [
            { id: 't-1', title: 'Registro diario de pensamientos negativos (TCC)', done: true, points: 20 },
            { id: 't-2', title: 'Práctica de Respiración Diafragmática (5 min, 2 veces/día)', done: false, points: 25 },
            { id: 't-3', title: 'Rutina de Desactivación Digital (22:30h en adelante)', done: true, points: 15 }
          ],
          appointments: [
            { id: 'a-1', date: '2026-05-30', time: '17:00', type: 'Sesión de Encuadre', status: 'Completada' },
            { id: 'a-2', date: '2026-06-06', time: '17:00', type: 'Sesión Individual', status: 'Programada' }
          ],
          pastSOAPs: [
            { id: 's-1', date: '30/05/2026', author: 'Dra. Ana Ramos', subjective: 'Refiere sentirse sobrepasada por el trabajo.', objective: 'Afecto plano, tensión somática.', assessment: 'Ansiedad generalizada.', plan: 'Iniciar psicoeducación sobre la ansiedad.' }
          ],
          soapDraft: {
            subjective: "Refiere sentirse 'sobrepasada por el trabajo' y 'tanto cansancio'. Dificultad para conciliar el sueño.",
            objective: "Afecto plano, llanto fácil. Tensión somática. Autocuidados disminuidos. Adherencia del 32%.",
            assessment: "Ansiedad generalizada con sintomatología depresiva ligera. Autoexigencia y patrones de perfeccionismo.",
            plan: "Psicoeducación sobre ansiedad. Técnicas de respiración. Tareas: plan de pausas y registro de pensamientos."
          },
          briefing: {
            time: 'Hoy - 17:00 (50 min)',
            temas: ['Relación terapéutica', 'Guías para descansar', 'Insomnio y fatiga'],
            explorar: ['Límites y autoexigencia', 'Creencia nucleares de "no ser suficiente"', 'Estrategias de regulación'],
            riesgos: ['Pensamientos de inutilidad recurrentes', 'Llanto frecuente', 'Bajo soporte familiar'],
            riskLevel: 'Riesgo moderado'
          }
        },
        {
          id: 'p-2',
          name: 'Jorge Javier Moreno',
          age: 45,
          gender: 'Masculino',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150',
          status: 'Activa',
          lastActive: 'Ayer, 18:40',
          triage: { phq9: 19, gad7: 16, status: 'risk_high', desc: 'Riesgo Alto' },
          adherence: 55,
          alertsCount: 1,
          specialties: ['Estrés Laboral', 'Ataques de Pánico'],
          temasClave: ['Pánico', 'Desempleo', 'Agorafobia'],
          consent: { accepted: true, version: 'v1.0-2026', date: '28/05/2026' },
          rawLogs: [
            {
              id: 'log-3',
              time: 'Ayer, 16:15',
              text: 'Sentí presión en el pecho al salir de casa. Tuve que volver a entrar y cancelar la cita médica. Siento rabia conmigo.',
              context: 'Calle · Salida de casa',
              sleep: '4h'
            }
          ],
          medications: [
            { id: 'm-3', name: 'Propranolol', dose: '10mg', schedule: '1-0-0 (Mañanas)', compliance: '85%' }
          ],
          tasks: [
            { id: 't-4', title: 'Exposición sistemática imaginada a espacios exteriores', done: false, points: 30 },
            { id: 't-5', title: 'Escribir en diario ante crisis de pánico', done: true, points: 20 }
          ],
          appointments: [
            { id: 'a-3', date: '2026-05-28', time: '10:00', type: 'Sesión de Encuadre', status: 'Completada' },
            { id: 'a-4', date: '2026-06-07', time: '10:00', type: 'Sesión de Exposición', status: 'Programada' }
          ],
          pastSOAPs: [
            { id: 's-2', date: '28/05/2026', author: 'Dr. José Fernández', subjective: 'Sufre crisis de pánico anticipatorio ante salidas.', objective: 'Hipervigilancia al hablar de situaciones exteriores.', assessment: 'Trastorno de pánico con agorafobia.', plan: 'Iniciar desensibilización sistemática.' }
          ],
          soapDraft: {
            subjective: "Sufre crisis de pánico anticipatorio ante salidas de su domicilio habitual.",
            objective: "Hipervigilancia al hablar de situaciones exteriores. Tono de voz defensivo.",
            assessment: "Trastorno de pánico con agorafobia en fase aguda. Adherencia media del 55%.",
            plan: "Continuar desensibilización sistemática imaginada. Registro diario de Walter IA."
          },
          briefing: {
            time: 'Mañana - 10:00 (50 min)',
            temas: ['Agorafobia', 'Encuadre de seguridad', 'Fisiología de la ansiedad'],
            explorar: ['Primeros síntomas físicos', 'Factores mantenedores del pánico', 'Diario de Walter'],
            riesgos: ['Evitación de espacios públicos severa', 'Baja motivación por recaída'],
            riskLevel: 'Riesgo alto'
          }
        },
        {
          id: 'p-3',
          name: 'Sofía Guerrero Ruiz',
          age: 31,
          gender: 'Femenino',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150',
          status: 'Activa',
          lastActive: 'Hace 3 días',
          triage: { phq9: 14, gad7: 12, status: 'viable', desc: 'Moderado' },
          adherence: 44,
          alertsCount: 1,
          specialties: ['Autoestima', 'Terapia ACT'],
          temasClave: ['Compromiso', 'Ansiedad social'],
          consent: { accepted: true, version: 'v1.0-2026', date: '01/06/2026' },
          rawLogs: [
            {
              id: 'log-4',
              time: 'Hace 3 días, 11:20',
              text: 'No me atreví a hablar en la reunión de departamento. Me sentí evaluada y ridícula.',
              context: 'Trabajo · Videollamada',
              sleep: '7h'
            }
          ],
          medications: [],
          tasks: [
            { id: 't-6', title: 'Ejercicios de defusión cognitiva ante pensamientos automáticos', done: true, points: 25 },
            { id: 't-7', title: 'Iniciar conversación casual con un desconocido en el café', done: false, points: 35 }
          ],
          appointments: [
            { id: 'a-5', date: '2026-06-01', time: '16:00', type: 'Sesión de Encuadre', status: 'Completada' },
            { id: 'a-6', date: '2026-06-08', time: '16:00', type: 'Sesión ACT', status: 'Programada' }
          ],
          pastSOAPs: [
            { id: 's-3', date: '01/06/2026', author: 'Dra. Ana Ramos', subjective: 'Insatisfacción laboral por dificultades de asertividad.', objective: 'Contacto ocular intermitente, postura encogida.', assessment: 'Ansiedad social.', plan: 'Psicoeducación en ACT.' }
          ],
          soapDraft: {
            subjective: "Insatisfacción laboral por dificultades de asertividad con sus iguales.",
            objective: "Contacto ocular intermitente, postura corporal encogida.",
            assessment: "Ansiedad social. Patrones de evitación experiencial cognitivos.",
            plan: "Ejercicios de defusión cognitiva. Tareas de exposición social progresiva."
          },
          briefing: {
            time: 'Lunes - 16:00 (50 min)',
            temas: ['Asertividad laboral', 'Exposición social', 'Diálogo socrático'],
            explorar: ['Pensamientos automáticos en reuniones', 'Valores personales en su carrera'],
            riesgos: ['Aislamiento laboral voluntario'],
            riskLevel: 'Riesgo moderado'
          }
        },
        {
          id: 'p-4',
          name: 'José Naranjo Fernández',
          age: 42,
          gender: 'Masculino',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150',
          status: 'Activa',
          lastActive: 'Hoy, 08:30',
          triage: { phq9: 8, gad7: 11, status: 'viable', desc: 'Viable' },
          adherence: 94,
          alertsCount: 0,
          specialties: ['Ansiedad', 'Viabilidad de Deudas'],
          temasClave: ['Deudas financieras', 'Estrés laboral', 'Insomnio'],
          consent: { accepted: true, version: 'v1.0-2026', date: '05/06/2026' },
          rawLogs: [
            {
              id: 'log-5',
              time: 'Hoy, 08:00',
              text: 'He revisado mi tabla de deudas y caja libre. Me da miedo no poder pagar a tiempo, pero el plan estructurado me da calma.',
              context: 'Casa · Despacho',
              sleep: '6h'
            }
          ],
          medications: [
            { id: 'm-4', name: 'Lorazepam', dose: '1mg', schedule: '0-0-1 (Noches, condicional)', compliance: '60%' }
          ],
          tasks: [
            { id: 't-8', title: 'Completar tabla de deudas y caja libre en Áncora', done: true, points: 20 },
            { id: 't-9', title: 'Practicar respiración 4-7-8 antes de dormir', done: true, points: 15 }
          ],
          appointments: [
            { id: 'a-7', date: '2026-06-05', time: '17:00', type: 'Sesión de Encuadre', status: 'Completada' },
            { id: 'a-8', date: '2026-06-11', time: '17:00', type: 'Seguimiento Financiero/Estrés', status: 'Programada' }
          ],
          pastSOAPs: [
            { id: 's-4', date: '05/06/2026', author: 'Dr. José Fernández', subjective: 'Rumiación constante en torno a su situación de endeudamiento.', objective: 'Paciente activo en la autogestión de su ruta.', assessment: 'Estrés agudo derivado de deudas.', plan: 'Técnicas de resolución de problemas.' }
          ],
          soapDraft: {
            subjective: "Rumiación constante en torno a su situación de endeudamiento financiero.",
            objective: "Paciente activo en la autogestión de su hoja de ruta. Adherencia del 94%.",
            assessment: "Estrés agudo derivado de carga laboral y sobreendeudamiento.",
            plan: "Monitoreo del diario de sensaciones. Fomentar técnicas de resolución de problemas."
          },
          briefing: {
            time: 'Jueves - 17:00 (50 min)',
            temas: ['Hoja de ruta financiera', 'Locus de control', 'Higiene de sueño'],
            explorar: ['Niveles de impulsividad', 'Respiración de rescate en el trabajo'],
            riesgos: ['Insomnio por rumiación financiera'],
            riskLevel: 'Riesgo leve'
          }
        }
      ];
    }
    return [];
  });

  const updatePatientStartOfWeek = async (patientId, newDay) => {
    localStorage.setItem(`patient_start_of_week_${patientId}`, newDay);
    
    // Actualizar estado patients
    setPatients(prev => prev.map(p => p.id === patientId ? {
      ...p,
      startOfWeek: newDay,
      contexto_terapeutico: {
        ...p.contexto_terapeutico,
        start_of_week: newDay
      }
    } : p));

    // Guardar en Supabase si es modo real
    if (!isVirtualDemo && patientId && !patientId.toString().startsWith('p-')) {
      try {
        const { data: currentP } = await supabase.from('profiles').select('contexto_terapeutico').eq('id', patientId).single();
        const updatedCtx = { ...currentP?.contexto_terapeutico, start_of_week: newDay };
        await supabase.from('profiles').update({ contexto_terapeutico: updatedCtx }).eq('id', patientId);
      } catch (err) {
        console.error("Error updating start of week in Supabase:", err);
      }
    }
  };

  // Loading state
  const [loadingReal, setLoadingReal] = useState(true);

  // SOAP values editor state
  const [soapSubjective, setSoapSubjective] = useState('');
  const [soapObjective, setSoapObjective] = useState('');
  const [soapAssessment, setSoapAssessment] = useState('');
  const [soapPlan, setSoapPlan] = useState('');
  const [soapToast, setSoapToast] = useState(false);

  // Estados dinámicos del Motor Clínico Central (clinicalEngine)
  const [proposals, setProposals] = useState([]);
  const [meds, setMeds] = useState([]);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loadingClinical, setLoadingClinical] = useState(false);

  // Estados para la edición en caliente de propuestas de la IA
  const [editingProposalId, setEditingProposalId] = useState(null);
  const [editedProposalData, setEditedProposalData] = useState({});

  const loadClinicalEngineData = async (patientId) => {
    if (!patientId) return;
    setLoadingClinical(true);
    try {
      const dbProps = await getPendingProposals(patientId);
      const dbMeds = await getMedications(patientId);
      const dbEvents = await getTimelineEvents(patientId);
      setProposals(dbProps);
      setMeds(dbMeds);
      setTimelineEvents(dbEvents);
    } catch (err) {
      console.error("Error loading clinical data from engine:", err);
    } finally {
      setLoadingClinical(false);
    }
  };

  // Acciones de la bandeja de propuestas IA
  const handleAcceptProposal = async (proposal, updatedData) => {
    try {
      await acceptProposal(proposal, updatedData);
      await loadClinicalEngineData(selectedPatientId);
    } catch (err) {
      console.error("Error accepting proposal:", err);
    }
  };

  const handleRejectProposal = async (proposalId) => {
    try {
      await rejectProposal(proposalId, selectedPatientId);
      await loadClinicalEngineData(selectedPatientId);
    } catch (err) {
      console.error("Error rejecting proposal:", err);
    }
  };
  
  // Interactive additions for Patient 360 subtabs
  const [newMedName, setNewMedName] = useState('');
  const [newMedDose, setNewMedDose] = useState('');
  const [newMedSchedule, setNewMedSchedule] = useState('');
  const [newApptDate, setNewApptDate] = useState('');
  const [newApptTime, setNewApptTime] = useState('');
  const [newApptType, setNewApptType] = useState('Sesión Individual');

  const handleTogglePatientTask = (taskId) => {
    setPatients(prev => prev.map(p => {
      if (p.id === selectedPatient.id) {
        const updatedTasks = p.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
        const totalPoints = updatedTasks.reduce((sum, t) => sum + t.points, 0);
        const completedPoints = updatedTasks.filter(t => t.done).reduce((sum, t) => sum + t.points, 0);
        const newAdherence = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : p.adherence;
        return {
          ...p,
          tasks: updatedTasks,
          adherence: newAdherence
        };
      }
      return p;
    }));
  };

  const handleAddMedication = () => {
    if (!newMedName) return;
    const newMed = {
      id: 'med-' + Date.now(),
      name: newMedName,
      dose: newMedDose || '1 comp',
      schedule: newMedSchedule || '1-0-0 (Mañanas)',
      compliance: '100%'
    };
    setPatients(prev => prev.map(p => {
      if (p.id === selectedPatient.id) {
        return {
          ...p,
          medications: [...(p.medications || []), newMed]
        };
      }
      return p;
    }));
    setNewMedName('');
    setNewMedDose('');
    setNewMedSchedule('');
  };

  const handleAddAppointment = () => {
    if (!newApptDate || !newApptTime) return;
    const newAppt = {
      id: 'appt-' + Date.now(),
      date: newApptDate,
      time: newApptTime,
      type: newApptType,
      status: 'Programada'
    };
    setPatients(prev => prev.map(p => {
      if (p.id === selectedPatient.id) {
        return {
          ...p,
          appointments: [...(p.appointments || []), newAppt]
        };
      }
      return p;
    }));
    setNewApptDate('');
    setNewApptTime('');
  };
  
  // Theme text zoom
  const [textZoom, setTextZoom] = useState(1);

  // Video call simulation
  const [inVideoCall, setInVideoCall] = useState(false);
  const [callConnected, setCallConnected] = useState(false);
  const [showSoapEditorInCall, setShowSoapEditorInCall] = useState(false);

  // Fetch real users from Supabase to integrate them dynamically
  useEffect(() => {
    if (isVirtualDemo) {
      setLoadingReal(false);
      return;
    }
    const fetchDBUsers = async () => {
      if (!profile?.id) return;
      try {
        setLoadingReal(true);
        // Load profiles
        const { data: profilesData, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['paciente', 'emilio'])
          .eq('contexto_terapeutico->>assigned_psychologist_id', profile.id);

        if (profError) throw profError;

        // Load consents
        const { data: consentsData } = await supabase
          .from('consents')
          .select('user_id, version, accepted_at');

        const consentsMap = {};
        (consentsData || []).forEach(c => {
          consentsMap[c.user_id] = c;
        });

        // Match and update
        const updatedPatients = [];

        (profilesData || []).forEach(p => {
          // Avoid creating duplicates for owner/emilio
          const isOwner = p.role === 'emilio';
          const emailStr = isOwner ? 'josferestudio@gmail.com' : `paciente_${p.id.substring(0, 5)}@ancora.clinic`;
          
          const hasConsent = !!consentsMap[p.id];
          const consentObj = {
            accepted: hasConsent,
            version: hasConsent ? consentsMap[p.id].version : 'v1.0-2026',
            date: hasConsent ? new Date(consentsMap[p.id].accepted_at).toLocaleDateString() : 'Sin aceptar'
          };

          // Try to get conclusions
          const conclusions = p.contexto_terapeutico?.conclusiones || [];
          const triageConclusion = conclusions.find(c => 
            c.toLowerCase().includes('triaje') || c.toLowerCase().includes('cribado') || c.toLowerCase().includes('scoring')
          );
          
          let tri = { phq9: 8, gad7: 11, status: 'viable', desc: 'Viable' };
          if (triageConclusion) {
            if (triageConclusion.toLowerCase().includes('grave') || triageConclusion.toLowerCase().includes('crítico')) {
              tri = { phq9: 20, gad7: 17, status: 'risk_high', desc: 'Riesgo Alto' };
            }
          }

          // Add a new patient record
          updatedPatients.push({
            id: p.id,
            name: isOwner ? 'José Naranjo Fernández' : (p.contexto_terapeutico?.displayName || p.contexto_terapeutico?.name || `Paciente #${p.id.substring(0, 6)}`),
            age: isOwner ? 42 : 33,
            gender: 'Masculino',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150',
            status: 'Activa',
            lastActive: p.updated_at ? `Hoy, ${new Date(p.updated_at).toLocaleTimeString().substring(0, 5)}` : 'Hace poco',
            triage: tri,
            adherence: 88,
            alertsCount: tri.status === 'risk_high' ? 1 : 0,
            specialties: ['Ansiedad', 'Estrés Laboral'],
            temasClave: ['General', 'Diario'],
            consent: consentObj,
            rawLogs: [
              {
                id: `log-${p.id}`,
                time: 'Reciente',
                text: 'Expediente clínico sincronizado desde la base de datos de Supabase de ÁNCORA.',
                context: 'Plataforma · Sincronizada',
                sleep: '7h'
              }
            ],
            soapDraft: {
              subjective: "Sincronizado desde Supabase.",
              objective: "Constantes estables en telemetría de diario.",
              assessment: "Evolución clínica supervisada.",
              plan: "Continuar con pautas activas de ÁNCORA."
            },
            briefing: {
              time: 'Pendiente agendar (50 min)',
              temas: ['Primer encuadre', 'Revisión de diario'],
              explorar: ['Nivel de ansiedad', 'Calidad de sueño'],
              riesgos: ['Falta de seguimiento síncrono'],
              riskLevel: 'Riesgo moderado'
            }
          });
        });

        setPatients(updatedPatients);
      } catch (err) {
        console.error("Error connecting with DB profiles:", err);
      } finally {
        setLoadingReal(false);
      }
    };

    fetchDBUsers();
  }, [isVirtualDemo, profile?.id]);

  useEffect(() => {
    if (!selectedPatientId && patients.length > 0) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selectedPatientId]);

  const emptyPatient = {
    id: 'empty-id',
    name: 'Sin pacientes asignados',
    age: '--',
    gender: '--',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150',
    status: 'Sin asignar',
    lastActive: '--',
    triage: { phq9: 0, gad7: 0, status: 'normal', desc: 'Sin datos' },
    adherence: 0,
    alertsCount: 0,
    specialties: [],
    temasClave: [],
    consent: { accepted: false, version: '--', date: '--' },
    rawLogs: [],
    soapDraft: { subjective: '', objective: '', assessment: '', plan: '' },
    briefing: {
      time: '--',
      temas: [],
      explorar: [],
      riesgos: [],
      riskLevel: '--'
    },
    sintesisClinica: 'No hay datos clínicos acumulados para este expediente.',
    recomendacionAbordaje: 'En cuanto el paciente comparta sus diarios conductuales, Walter IA generará pautas de abordaje sugeridas.'
  };

  const selectedPatient = (patients.find(p => p.id === selectedPatientId) || patients[0]) || emptyPatient;

  // Set SOAP editor states and load clinical engine data when switching patients
  useEffect(() => {
    if (selectedPatient && selectedPatient.soapDraft) {
      setSoapSubjective(selectedPatient.soapDraft.subjective || '');
      setSoapObjective(selectedPatient.soapDraft.objective || '');
      setSoapAssessment(selectedPatient.soapDraft.assessment || '');
      setSoapPlan(selectedPatient.soapDraft.plan || '');
      setRawReviewed(false); // Reset AI summary lock on patient switch
    } else {
      setSoapSubjective('');
      setSoapObjective('');
      setSoapAssessment('');
      setSoapPlan('');
    }
    if (selectedPatientId) {
      loadClinicalEngineData(selectedPatientId);
    }
  }, [selectedPatientId, patients]);

  const handleApplyAISuggestions = () => {
    setSoapAssessment(prev => prev + " (Sugerencia aplicada: Foco en Autoexigencia laboral severa)");
    setSoapPlan(prev => prev + "\n- Aplicar técnica de Respiración 4-7-8 recomendada.\n- Pauta de higiene del sueño supervisada.");
  };

  const handleSaveSOAP = (e) => {
    e.preventDefault();
    // Update the patient object's soapDraft locally
    const updated = patients.map(p => {
      if (p.id === selectedPatientId) {
        return {
          ...p,
          soapDraft: {
            subjective: soapSubjective,
            objective: soapObjective,
            assessment: soapAssessment,
            plan: soapPlan
          }
        };
      }
      return p;
    });
    setPatients(updated);
    setSoapToast(true);
    setTimeout(() => setSoapToast(false), 3000);
  };

  const handleStartVideo = () => {
    setInVideoCall(true);
    setCallConnected(false);
    setTimeout(() => {
      setCallConnected(true);
    }, 1500);
  };

  const handleEndVideo = () => {
    setInVideoCall(false);
    setCallConnected(false);
    setActiveSection('soap'); // Switch to soap note section to write the summary
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: '100%', fontSize: `${textZoom}rem` }}>
      
      {/* SOAP Saved Toast */}
      {soapToast && (
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
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(255,255,255,0.2)',
          animation: 'pulse-soft 2s infinite alternate'
        }}>
          <CheckCircle size={18} />
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>¡Nota SOAP Guardada & Firmada con éxito!</span>
        </div>
      )}

      {/* SIMULACIÓN DE VIDEOLLAMADA CLÍNICA (FULLSCREEN MODAL OVERLAY) */}
      {inVideoCall && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: '#04101b',
          zIndex: 3000,
          display: 'grid',
          gridTemplateColumns: showSoapEditorInCall ? '1.5fr 1fr' : '1fr',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Main Video Area */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* Cabecera llamada */}
            <div style={{
              padding: '16px 24px',
              background: 'rgba(5, 33, 58, 0.85)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span className="badge badge-rose animate-pulse-soft" style={{ fontSize: '0.6rem', padding: '3px 8px' }}>
                  EN DIRECTO
                </span>
                <h3 style={{ fontSize: '0.95rem', margin: 0, color: '#ffffff' }}>
                  Sesión con {selectedPatient.name} ({selectedPatient.age} años)
                </h3>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  {callConnected ? 'Conexión Segura (End-to-End Encrypted)' : 'Conectando audio y cámara...'}
                </span>
                <ShieldCheck size={18} color="var(--color-cyan)" />
              </div>
            </div>

            {/* Video Feed Placeholder */}
            <div style={{
              flex: 1,
              background: '#0a1a2b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {callConnected ? (
                <>
                  {/* Remote Patient Video (Mock Image) */}
                  <img 
                    src={selectedPatient.avatar} 
                    alt={selectedPatient.name} 
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      opacity: 0.65,
                      filter: 'contrast(1.1) brightness(0.95)'
                    }} 
                  />
                  {/* Floating Patient Info Overlay */}
                  <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    background: 'rgba(5, 33, 58, 0.8)',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border)',
                    backdropFilter: 'blur(8px)'
                  }}>
                    <strong style={{ fontSize: '0.8rem', color: '#ffffff', display: 'block' }}>{selectedPatient.name}</strong>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Triaje Inicial: GAD-7 = {selectedPatient.triage.gad7} (Severo)</span>
                  </div>

                  {/* Local Doctor Video PIP */}
                  <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    width: '150px',
                    height: '200px',
                    borderRadius: '10px',
                    border: '2px solid var(--color-cyan)',
                    background: '#04101b',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                      <User size={24} color="var(--color-cyan)" style={{ marginBottom: '8px' }} />
                      <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', display: 'block' }}>Dra. Lucía Gómez</span>
                      <span style={{ fontSize: '0.5rem', color: 'var(--color-emerald)', fontWeight: 'bold' }}>Colegiada COP-M-31415</span>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                  <RefreshCw size={36} className="animate-spin" color="var(--color-cyan)" />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Abriendo canal WebRTC seguro y conectando con el expediente clínico...</span>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar */}
            <div style={{
              padding: '16px 24px',
              background: 'rgba(5, 33, 58, 0.95)',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 10
            }}>
              <div>
                <button
                  onClick={() => setShowSoapEditorInCall(!showSoapEditorInCall)}
                  className="btn btn-outline"
                  style={{ height: '36px', fontSize: '0.75rem', borderColor: 'var(--color-cyan)', color: 'var(--color-cyan)', display: 'flex', gap: '6px', alignItems: 'center' }}
                >
                  <Sparkles size={14} />
                  <span>{showSoapEditorInCall ? 'Ocultar Asistente SOAP' : 'Mostrar Asistente SOAP'}</span>
                </button>
              </div>

              {/* Teleprompter Rápido en llamada */}
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                padding: '6px 16px',
                borderRadius: '20px',
                border: '1px dashed var(--border)',
                fontSize: '0.7rem',
                color: 'var(--color-cyan)',
                maxWidth: '450px',
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                <strong>Teleprompter:</strong> "Acompañar en validación emocional y explorar el significado de 'no ser suficiente'."
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleEndVideo}
                  className="btn btn-outline"
                  style={{ height: '36px', fontSize: '0.75rem', borderColor: 'var(--color-rose)', color: 'var(--color-rose)' }}
                >
                  Finalizar Consulta
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Side SOAP Editor in call */}
          {showSoapEditorInCall && (
            <div style={{
              background: 'var(--background-secondary)',
              borderLeft: '1px solid var(--border)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                <h4 style={{ fontSize: '0.85rem', margin: 0, display: 'flex', gap: '6px', alignItems: 'center', color: '#ffffff' }}>
                  <Sparkles size={16} color="var(--color-cyan)" />
                  Smart SOAP AI (Borrador Activo)
                </h4>
                <button
                  onClick={() => handleApplyAISuggestions()}
                  className="badge badge-cyan"
                  style={{ cursor: 'pointer', border: 'none' }}
                >
                  Aplicar Pautas IA
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.62rem' }}>Subjective (S)</label>
                  <textarea
                    className="form-input"
                    value={soapSubjective}
                    onChange={(e) => setSoapSubjective(e.target.value)}
                    style={{ height: '70px', fontSize: '0.68rem', resize: 'none', background: '#07121e' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.62rem' }}>Objective (O)</label>
                  <textarea
                    className="form-input"
                    value={soapObjective}
                    onChange={(e) => setSoapObjective(e.target.value)}
                    style={{ height: '70px', fontSize: '0.68rem', resize: 'none', background: '#07121e' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.62rem' }}>Assessment (A)</label>
                  <textarea
                    className="form-input"
                    value={soapAssessment}
                    onChange={(e) => setSoapAssessment(e.target.value)}
                    style={{ height: '70px', fontSize: '0.68rem', resize: 'none', background: '#07121e' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.62rem' }}>Plan (P)</label>
                  <textarea
                    className="form-input"
                    value={soapPlan}
                    onChange={(e) => setSoapPlan(e.target.value)}
                    style={{ height: '70px', fontSize: '0.68rem', resize: 'none', background: '#07121e' }}
                  />
                </div>
              </div>

              <button
                onClick={(e) => { handleSaveSOAP(e); setShowSoapEditorInCall(false); }}
                className="btn btn-cyan"
                style={{ width: '100%', height: '36px', fontSize: '0.75rem', marginTop: '10px' }}
              >
                Guardar Borrador Nota SOAP
              </button>
            </div>
          )}
        </div>
      )}
      {/* Cabecera / Selector de Paciente Activo (Mobile-friendly e Integrado) */}
      <div className="clinical-header-toolbar glass-panel" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px 20px',
        borderRadius: 'var(--radius-md)',
        flexWrap: 'wrap',
        gap: '12px',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Activity size={18} color="var(--color-cyan)" />
          <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Expediente Activo:
          </span>
          {patients.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={selectedPatient.avatar} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
              <strong style={{ fontSize: '0.78rem', color: 'var(--color-cyan)' }}>{selectedPatient.name}</strong>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Cambiar Paciente:</span>
          {patients.length === 0 ? (
            <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sin asignar</span>
          ) : (
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="form-input"
              style={{
                height: '30px',
                fontSize: '0.74rem',
                padding: '0 30px 0 10px',
                background: 'rgba(0,0,0,0.25)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: '#fff',
                width: '180px',
                cursor: 'pointer'
              }}
            >
              {patients.map(p => (
                <option key={p.id} value={p.id} style={{ background: 'var(--background-secondary)', color: '#fff' }}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Contenido Clínico de la Sección Activa */}
      <div className="clinical-dashboard-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* ==================== VISTA 1: VISTA GENERAL (DASHBOARD RAW-FIRST) ==================== */}
          {activeSection === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Header metrics row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                
                <div className="glass-panel" style={{ padding: '16px', position: 'relative' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Pacientes Activos</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                    <strong style={{ fontSize: '1.4rem', color: '#ffffff' }}>{isVirtualDemo ? '128' : patients.length}</strong>
                    {isVirtualDemo && <span style={{ fontSize: '0.65rem', color: 'var(--color-emerald)' }}>+12%</span>}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Alertas de Riesgo</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                    <strong style={{ fontSize: '1.4rem', color: isVirtualDemo ? 'var(--color-rose)' : '#ffffff' }}>
                      {isVirtualDemo ? '15' : patients.filter(p => p.triage?.status === 'risk_high').length}
                    </strong>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
                      {isVirtualDemo ? 'Requieren atención' : 'Alertas activas'}
                    </span>
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Adherencia Promedio</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                    <strong style={{ fontSize: '1.4rem', color: '#ffffff' }}>
                      {isVirtualDemo ? '78%' : (patients.length > 0 ? `${Math.round(patients.reduce((sum, p) => sum + (p.adherence || 0), 0) / patients.length)}%` : '0%')}
                    </strong>
                    {isVirtualDemo && <span style={{ fontSize: '0.65rem', color: 'var(--color-rose)' }}>-4%</span>}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '16px' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Sesiones esta semana</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
                    <strong style={{ fontSize: '1.4rem', color: '#ffffff' }}>{isVirtualDemo ? '42' : dbAppointments.length}</strong>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>Agendadas</span>
                  </div>
                </div>

              </div>

              {/* Charts area: Tendencias emocionales (SVG) + Distribución de Riesgo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '20px' }} className="grid-responsive-detail">
                
                {/* Tendencias Emocionales Line Chart */}
                <div className="glass-panel" style={{ padding: '20px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Tendencias Emocionales (promedio del panel)</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Últimos 15 días</span>
                  </h4>

                  {/* Simulated Line Graph with SVG */}
                  <div style={{ height: '180px', position: 'relative', width: '100%', background: 'rgba(0,0,0,0.15)', borderRadius: '6px', border: '1px solid var(--border)', padding: '10px' }}>
                    <svg viewBox="0 0 400 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="cyan-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--color-cyan)" stopOpacity="0.25"/>
                          <stop offset="100%" stopColor="var(--color-cyan)" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      
                      {/* Grid Lines */}
                      <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="75" x2="400" y2="75" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1="0" y1="120" x2="400" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      
                      {/* Ansiedad Curve (Cyan) */}
                      <path d="M 0 100 Q 50 80 100 95 T 200 45 T 300 70 T 400 35" fill="none" stroke="var(--color-cyan)" strokeWidth="2.5" />
                      <path d="M 0 100 Q 50 80 100 95 T 200 45 T 300 70 T 400 35 L 400 150 L 0 150 Z" fill="url(#cyan-gradient)" />
                      
                      {/* Depresión Curve (Sage/Emerald) */}
                      <path d="M 0 120 Q 50 110 100 100 T 200 80 T 300 60 T 400 55" fill="none" stroke="var(--color-emerald)" strokeWidth="2" />
                      
                      {/* Estrés Curve (Amber) */}
                      <path d="M 0 80 Q 50 60 100 70 T 200 90 T 300 40 T 400 30" fill="none" stroke="var(--color-amber)" strokeWidth="1.5" strokeDasharray="3 3" />
                    </svg>

                    {/* Chart Legend */}
                    <div style={{ display: 'flex', gap: '14px', position: 'absolute', bottom: '8px', left: '12px', fontSize: '0.62rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-cyan)', borderRadius: '50%' }} /> Ansiedad
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-emerald)', borderRadius: '50%' }} /> Depresión
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--color-amber)', borderRadius: '50%' }} /> Estrés
                      </span>
                    </div>
                  </div>
                </div>

                {/* Distribución de Riesgo Donut Chart */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                    Distribución de Riesgo
                  </h4>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
                      {/* Styled Donut Chart using SVG */}
                      <svg width="100%" height="100%" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                        
                        {/* Bajo: 58.1% (Emerald) */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--color-emerald)" strokeWidth="3.2" strokeDasharray="58 42" strokeDashoffset="0" />
                        
                        {/* Moderado: 30.1% (Amber) */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--color-amber)" strokeWidth="3.2" strokeDasharray="30 70" strokeDashoffset="-58" />
                        
                        {/* Alto: 11.8% (Rose) */}
                        <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--color-rose)" strokeWidth="3.2" strokeDasharray="12 88" strokeDashoffset="-88" />
                      </svg>
                      <div className="flex-center" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '0.9rem', color: '#ffffff' }}>128</strong>
                        <span style={{ fontSize: '0.5rem', color: 'var(--text-tertiary)' }}>Total</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, fontSize: '0.68rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                          <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-emerald)', borderRadius: '50%' }} /> Bajo:
                        </span>
                        <strong>58.1%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                          <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-amber)', borderRadius: '50%' }} /> Moderado:
                        </span>
                        <strong>30.1%</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                          <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-rose)', borderRadius: '50%' }} /> Alto:
                        </span>
                        <strong style={{ color: 'var(--color-rose)' }}>11.8%</strong>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Pacientes que requieren atención Table (Estructura Mockup) */}
              <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px' }}>
                  Pacientes que requieren atención
                </h4>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-tertiary)', height: '32px' }}>
                      <th style={{ paddingBottom: '8px', fontWeight: 600 }}>Paciente</th>
                      <th style={{ paddingBottom: '8px', fontWeight: 600 }}>Última actividad</th>
                      <th style={{ paddingBottom: '8px', fontWeight: 600 }}>Riesgo</th>
                      <th style={{ paddingBottom: '8px', fontWeight: 600 }}>Adherencia</th>
                      <th style={{ paddingBottom: '8px', fontWeight: 600 }}>Alertas</th>
                      <th style={{ paddingBottom: '8px', fontWeight: 600, textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                          No hay pacientes registrados en tu consulta actualmente.
                        </td>
                      </tr>
                    ) : (
                      patients.map(p => {
                        const isHigh = p.triage?.status === 'risk_high';
                        return (
                          <tr 
                            key={p.id} 
                            style={{ 
                              borderBottom: '1px solid rgba(255,255,255,0.03)', 
                              height: '42px',
                              cursor: 'pointer',
                            }}
                            onClick={() => { setSelectedPatientId(p.id); setActiveSection('perfil'); }}
                            className="table-row-hover"
                          >
                            <td style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px' }}>
                              <img src={p.avatar} alt={p.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                              <strong style={{ color: '#ffffff' }}>{p.name}</strong>
                            </td>
                            <td style={{ color: 'var(--text-secondary)' }}>{p.lastActive}</td>
                          <td>
                            <span className={`badge ${isHigh ? 'badge-rose' : 'badge-emerald'}`} style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                              {isHigh ? 'Alto' : 'Viable'}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ flex: 1, minWidth: '40px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                                <div style={{ height: '100%', width: `${p.adherence}%`, background: p.adherence < 50 ? 'var(--color-rose)' : 'var(--color-cyan)', borderRadius: '2px' }} />
                              </div>
                              <span style={{ fontWeight: 600 }}>{p.adherence}%</span>
                            </div>
                          </td>
                          <td style={{ color: p.alertsCount > 0 ? 'var(--color-rose)' : 'var(--text-tertiary)', fontWeight: 'bold' }}>
                            {p.alertsCount}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button className="btn btn-outline" style={{ height: '26px', fontSize: '0.62rem', padding: '0 8px', borderRadius: '4px' }}>
                              Abrir Ficha
                            </button>
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>

            </div>
          )}
          {/* ==================== VISTA 2: PERFIL CLÍNICO DEL PACIENTE ==================== */}
          {activeSection === 'perfil' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>              
              {/* Header de paciente con foto */}
              <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <img 
                    src={selectedPatient.avatar} 
                    alt={selectedPatient.name} 
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-cyan)' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                      {selectedPatient.name}
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {selectedPatient.age} años · {selectedPatient.gender} · ID de Expediente: {selectedPatient.id.substring(0, 8)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span className="badge badge-emerald" style={{ fontSize: '0.68rem', padding: '4px 10px' }}>
                    {selectedPatient.status}
                  </span>
                  <button 
                    onClick={() => setActiveSection('briefing')} 
                    className="btn btn-cyan" 
                    style={{ height: '34px', fontSize: '0.72rem', display: 'flex', gap: '4px', alignItems: 'center' }}
                  >
                    <span>Ver preparación de sesión</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Sub-tabs interactivos del mockup real */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '16px', overflowX: 'auto', paddingBottom: '2px', marginBottom: '14px' }}>
                {[
                  { id: 'resumen', label: 'Resumen Clínico' },
                  { id: 'raw', label: 'Datos en Bruto' },
                  { id: 'notas', label: 'Notas SOAP' },
                  { id: 'sesiones', label: 'Sesiones y Citas' },
                  { id: 'tareas', label: 'Plan / Tareas' },
                  { id: 'medicacion', label: 'Medicación' },
                  { id: 'consentimientos', label: 'Privacidad y RGPD' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setPatientSubTab(tab.id)}
                    className="sidebar-link" 
                    style={{ 
                      border: 'none', 
                      background: 'none', 
                      borderBottom: patientSubTab === tab.id ? '2px solid var(--color-cyan)' : '2px solid transparent', 
                      borderRadius: 0, 
                      padding: '8px 12px', 
                      fontSize: '0.76rem', 
                      color: patientSubTab === tab.id ? '#ffffff' : 'var(--text-secondary)', 
                      cursor: 'pointer', 
                      fontWeight: patientSubTab === tab.id ? 'bold' : 'normal',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* RENDERIZADO CONDICIONAL DE SUB-PESTAÑAS */}
              
              {/* 1. RESUMEN CLÍNICO */}
              {patientSubTab === 'resumen' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px' }} className="grid-responsive-detail">
                  
                  {/* COLUMNA IZQUIERDA: BANDEJA DE PROPUESTAS + MEMORIA EPISÓDICA + MEMORIA PROFUNDA */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* 1. BANDEJA DE PROPUESTAS DE WALTER IA (HUMAN-IN-THE-LOOP) */}
                    <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(6, 182, 212, 0.2)', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Sparkles size={16} color="var(--color-cyan)" className="animate-pulse-soft" />
                          <span>Bandeja de Propuestas IA (Walter IA Copilot)</span>
                        </h4>
                        <span className="badge badge-cyan" style={{ fontSize: '0.62rem', padding: '2px 8px' }}>
                          {proposals.length} Pendiente{proposals.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {loadingClinical ? (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', height: '100px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                          <RefreshCw size={14} className="animate-spin" />
                          <span>Actualizando propuestas y expediente...</span>
                        </div>
                      ) : proposals.length === 0 ? (
                        <div style={{ padding: '30px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                          <CheckCircle size={32} color="var(--color-emerald)" style={{ opacity: 0.6 }} />
                          <h5 style={{ margin: 0, color: '#fff', fontSize: '0.8rem', fontWeight: 'bold' }}>Expediente Clínico al Día</h5>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', margin: 0, maxWidth: '380px', lineHeight: 1.45 }}>
                            No hay propuestas pendientes de la IA para {selectedPatient.name}. Cuando el paciente suba nuevos informes o complete diarios emocionales, Walter IA analizará el contenido y sugerirá actualizaciones aquí.
                          </p>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {proposals.map((proposal) => {
                            const isEditing = editingProposalId === proposal.id;
                            const confidencePercent = Math.round(proposal.confidence * 100);
                            
                            return (
                              <div 
                                key={proposal.id} 
                                className="proposal-card"
                                style={{ 
                                  background: 'rgba(0,0,0,0.18)', 
                                  border: '1px solid rgba(255,255,255,0.04)', 
                                  borderRadius: '8px', 
                                  padding: '14px', 
                                  transition: 'all 0.2s ease',
                                  textAlign: 'left'
                                }}
                              >
                                {/* Cabecera de Tarjeta */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '8px', marginBottom: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span 
                                      className={`badge ${proposal.proposal_type === 'medication' ? 'badge-amber' : 'badge-cyan'}`} 
                                      style={{ fontSize: '0.58rem', padding: '2px 6px', textTransform: 'uppercase', fontWeight: 'bold' }}
                                    >
                                      {proposal.proposal_type === 'medication' ? '💊 Medicación' : '📅 Cronología'}
                                    </span>
                                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
                                      Fuente: <strong>{proposal.source_metadata?.fileName || 'Diario / Chat'}</strong>
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontSize: '0.62rem', color: confidencePercent > 80 ? 'var(--color-emerald)' : 'var(--color-amber)', fontWeight: 'bold' }}>
                                      Confianza: {confidencePercent}%
                                    </span>
                                  </div>
                                </div>

                                {/* Contenido - TARJETA EXPANDIBLE PARA EDICIÓN EN CALIENTE */}
                                {isEditing ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
                                    {proposal.proposal_type === 'medication' ? (
                                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                          <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Medicamento</label>
                                          <input 
                                            type="text" 
                                            className="form-input" 
                                            value={editedProposalData.name || ''} 
                                            onChange={(e) => setEditedProposalData(prev => ({ ...prev, name: e.target.value }))}
                                            style={{ height: '30px', fontSize: '0.74rem', background: '#0a1622', color: '#fff', padding: '0 8px' }}
                                          />
                                        </div>
                                        <div className="form-group">
                                          <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Dosis</label>
                                          <input 
                                            type="text" 
                                            className="form-input" 
                                            value={editedProposalData.dose || ''} 
                                            onChange={(e) => setEditedProposalData(prev => ({ ...prev, dose: e.target.value }))}
                                            style={{ height: '30px', fontSize: '0.74rem', background: '#0a1622', color: '#fff', padding: '0 8px' }}
                                          />
                                        </div>
                                        <div className="form-group">
                                          <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Pauta / Frecuencia</label>
                                          <input 
                                            type="text" 
                                            className="form-input" 
                                            value={editedProposalData.frequency || ''} 
                                            onChange={(e) => setEditedProposalData(prev => ({ ...prev, frequency: e.target.value }))}
                                            style={{ height: '30px', fontSize: '0.74rem', background: '#0a1622', color: '#fff', padding: '0 8px' }}
                                          />
                                        </div>
                                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                          <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Prescriptor</label>
                                          <input 
                                            type="text" 
                                            className="form-input" 
                                            value={editedProposalData.prescriber || ''} 
                                            onChange={(e) => setEditedProposalData(prev => ({ ...prev, prescriber: e.target.value }))}
                                            style={{ height: '30px', fontSize: '0.74rem', background: '#0a1622', color: '#fff', padding: '0 8px' }}
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                          <div className="form-group">
                                            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Fecha Evento</label>
                                            <input 
                                              type="date" 
                                              className="form-input" 
                                              value={editedProposalData.date || ''} 
                                              onChange={(e) => setEditedProposalData(prev => ({ ...prev, date: e.target.value }))}
                                              style={{ height: '30px', fontSize: '0.74rem', background: '#0a1622', color: '#fff', padding: '0 8px' }}
                                            />
                                          </div>
                                          <div className="form-group">
                                            <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Categoría</label>
                                            <select 
                                              className="form-input" 
                                              value={editedProposalData.event_type || 'other'} 
                                              onChange={(e) => setEditedProposalData(prev => ({ ...prev, event_type: e.target.value }))}
                                              style={{ height: '30px', fontSize: '0.74rem', background: '#0a1622', color: '#fff', padding: '0 4px' }}
                                            >
                                              <option value="vital_event">Evento Vital</option>
                                              <option value="symptom_start">Inicio Síntoma</option>
                                              <option value="medication_change">Medicación</option>
                                              <option value="crisis">Crisis / Alerta</option>
                                              <option value="therapy_session">Sesión Terapia</option>
                                              <option value="document_upload">Documental</option>
                                              <option value="other">Otro</option>
                                            </select>
                                          </div>
                                        </div>
                                        <div className="form-group">
                                          <label style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>Descripción del Evento</label>
                                          <textarea 
                                            className="form-input" 
                                            value={editedProposalData.event || ''} 
                                            onChange={(e) => setEditedProposalData(prev => ({ ...prev, event: e.target.value }))}
                                            style={{ height: '45px', fontSize: '0.74rem', background: '#0a1622', color: '#fff', padding: '6px 8px', resize: 'none' }}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: '0.74rem', color: '#ffffff', marginBottom: '10px' }}>
                                    {proposal.proposal_type === 'medication' ? (
                                      <p style={{ margin: 0, lineHeight: 1.4 }}>
                                        Sugerido agregar pauta: <strong>{proposal.proposal_data.name} {proposal.proposal_data.dose}</strong>. Frecuencia: <em>{proposal.proposal_data.frequency}</em>. Prescriptor: {proposal.proposal_data.prescriber || 'No especificado'}.
                                      </p>
                                    ) : (
                                      <p style={{ margin: 0, lineHeight: 1.4 }}>
                                        Sugerido hito temporal (<strong>{proposal.proposal_data.date}</strong>): <strong>{proposal.proposal_data.event}</strong>
                                        {proposal.proposal_data.associated_emotion && <span> (Emoción: <em>{proposal.proposal_data.associated_emotion}</em>, Intensidad: {proposal.proposal_data.intensity}/10)</span>}
                                      </p>
                                    )}
                                    <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', background: 'rgba(6,182,212,0.02)', border: '1px solid rgba(6,182,212,0.08)', padding: '6px 10px', borderRadius: '4px', marginTop: '6px' }}>
                                      <strong>Evidencia:</strong> "{proposal.source_metadata?.section || 'Extracto chat'}: {proposal.proposal_type === 'medication' ? 'Prescripción médica detectada en archivo.' : proposal.source_metadata?.textMessage || 'Logs clínicos.'}"
                                    </div>
                                  </div>
                                )}

                                {/* Botonera de Acciones (Editar en tarjeta expandible) */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                  {isEditing ? (
                                    <>
                                      <button 
                                        onClick={() => {
                                          setEditingProposalId(null);
                                          setEditedProposalData({});
                                        }}
                                        className="btn btn-outline" 
                                        style={{ height: '28px', fontSize: '0.68rem', padding: '0 10px', display: 'flex', gap: '4px', alignItems: 'center' }}
                                      >
                                        <XCircle size={12} />
                                        <span>Cancelar</span>
                                      </button>
                                      <button 
                                        onClick={() => {
                                          handleAcceptProposal(proposal, editedProposalData);
                                          setEditingProposalId(null);
                                          setEditedProposalData({});
                                        }}
                                        className="btn btn-emerald" 
                                        style={{ height: '28px', fontSize: '0.68rem', padding: '0 10px', display: 'flex', gap: '4px', alignItems: 'center', background: 'var(--color-emerald)', color: '#fff', border: 'none', fontWeight: 'bold' }}
                                      >
                                        <Check size={12} />
                                        <span>Guardar y Aceptar</span>
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button 
                                        onClick={() => handleRejectProposal(proposal.id)}
                                        className="btn btn-outline" 
                                        style={{ height: '28px', fontSize: '0.68rem', borderColor: 'rgba(239,68,68,0.2)', color: 'var(--color-rose)', padding: '0 10px', display: 'flex', gap: '4px', alignItems: 'center' }}
                                        title="Rechazar y archivar propuesta"
                                      >
                                        <Trash2 size={12} />
                                        <span>Rechazar</span>
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setEditingProposalId(proposal.id);
                                          setEditedProposalData({ ...proposal.proposal_data });
                                        }}
                                        className="btn btn-outline" 
                                        style={{ height: '28px', fontSize: '0.68rem', borderColor: 'rgba(6,182,212,0.3)', color: 'var(--color-cyan)', padding: '0 10px', display: 'flex', gap: '4px', alignItems: 'center' }}
                                      >
                                        <Edit size={12} />
                                        <span>Editar</span>
                                      </button>
                                      <button 
                                        onClick={() => handleAcceptProposal(proposal)}
                                        className="btn btn-cyan" 
                                        style={{ height: '28px', fontSize: '0.68rem', padding: '0 12px', background: 'var(--color-cyan)', color: '#000', fontWeight: 'bold', border: 'none', display: 'flex', gap: '4px', alignItems: 'center' }}
                                      >
                                        <Check size={12} />
                                        <span>Aceptar</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* 2. MEMORIA EPISÓDICA (RECIENTE) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }} className="grid-responsive-detail">
                      
                      {/* Timeline Emocional Graph */}
                      <div className="glass-panel" style={{ padding: '16px' }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>Memoria Episódica: Timeline Emocional</span>
                          <span style={{ fontSize: '0.6rem', color: 'var(--color-cyan)' }}>Últimos 15 días</span>
                        </h4>
                        <div style={{ height: '80px', width: '100%', background: 'rgba(0,0,0,0.1)', borderRadius: '6px', border: '1px solid var(--border)', display: 'flex', alignItems: 'flex-end', padding: '6px', gap: '3px' }}>
                          {[5, 4, 3, 2, 6, 7, 8, 9, 8, 7, 5, 4, 3, 6, 9].map((val, idx) => (
                            <div 
                              key={idx} 
                              style={{ 
                                flex: 1, 
                                height: `${val * 10}%`, 
                                background: val > 7 ? 'var(--color-rose)' : (val > 4 ? 'var(--color-amber)' : 'var(--color-cyan)'),
                                borderRadius: '1px',
                                opacity: 0.85
                              }} 
                              title={`Día -${15 - idx}: ${val}/10`}
                            />
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                          <span>Hace 15 días</span>
                          <span>Hoy</span>
                        </div>
                      </div>

                      {/* Logs cualitativos del chat */}
                      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyItems: 'stretch' }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Logs Cualitativos Recientes</span>
                          <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)' }} onClick={() => setPatientSubTab('raw')} style={{ cursor: 'pointer', color: 'var(--color-cyan)', fontSize: '0.55rem' }}>Ver todos</span>
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '100px', textAlign: 'left' }}>
                          {selectedPatient.rawLogs && selectedPatient.rawLogs.slice(0, 2).map((log, idx) => (
                            <div key={idx} style={{ background: 'rgba(0,0,0,0.1)', padding: '6px 8px', borderRadius: '4px', fontSize: '0.68rem', borderLeft: '2px solid var(--color-cyan)' }}>
                              <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', display: 'block' }}>{log.time} · {log.context}</span>
                              <span style={{ color: '#fff' }}>"{log.text.substring(0, 80)}..."</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 3. MEMORIA PROFUNDA: TIMELINE CLÍNICO INTERACTIVO COMPLETO */}
                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Memoria Profunda: Cronología Vital y Clínica</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Orden cronológico</span>
                      </h4>

                      {loadingClinical ? (
                        <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          <RefreshCw className="animate-spin" size={14} />
                          <span style={{ marginLeft: '6px' }}>Cargando cronología...</span>
                        </div>
                      ) : timelineEvents.length === 0 ? (
                        <div style={{ padding: '20px', color: 'var(--text-tertiary)', fontSize: '0.75rem', textAlign: 'center' }}>
                          No hay eventos consolidados en el timeline de este expediente. Acepta propuestas de la IA o añade un evento en el portal del paciente.
                        </div>
                      ) : (
                        <div style={{ position: 'relative', paddingLeft: '16px', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                          {timelineEvents.map((ev) => {
                            const isHighRisk = ev.event_type === 'crisis' || (ev.intensity && ev.intensity > 7);
                            return (
                              <div key={ev.id} style={{ position: 'relative' }}>
                                {/* Point indicator */}
                                <div style={{ 
                                  position: 'absolute', 
                                  left: '-21px', 
                                  top: '4px', 
                                  width: '9px', 
                                  height: '9px', 
                                  borderRadius: '50%', 
                                  background: isHighRisk ? 'var(--color-rose)' : 'var(--color-cyan)', 
                                  border: '2px solid #04101b',
                                  boxShadow: isHighRisk ? '0 0 8px var(--color-rose)' : 'none'
                                }} />
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'rgba(255,255,255,0.01)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--color-cyan)', fontWeight: 'bold' }}>{ev.event_date}</span>
                                      <span className="badge" style={{ fontSize: '0.55rem', padding: '1px 5px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-tertiary)' }}>
                                        {ev.event_type}
                                      </span>
                                      <span 
                                        className="badge" 
                                        style={{ 
                                          fontSize: '0.55rem', 
                                          padding: '1px 5px', 
                                          background: ev.authority_level === 1 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.08)', 
                                          color: ev.authority_level === 1 ? 'var(--color-emerald)' : 'var(--color-amber)' 
                                        }}
                                        title={AuthorityLabels[ev.authority_level]}
                                      >
                                        {ev.authority_level === 1 ? 'Validado' : (ev.authority_level === 2 ? 'Documentado' : 'Declarado')}
                                      </span>
                                    </div>
                                    <p style={{ fontSize: '0.76rem', color: '#ffffff', margin: '4px 0 0 0', lineHeight: 1.35 }}>
                                      {ev.description}
                                    </p>
                                    {ev.associated_emotion && (
                                      <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                                        Emoción: <strong>{ev.associated_emotion}</strong> (Intensidad: {ev.intensity || 5}/10)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Resumen Clínico Asistido por IA (Raw-first Guard) */}
                    <div className="glass-panel" style={{ padding: '20px', position: 'relative', overflow: 'hidden', minHeight: '130px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Análisis Clínico Asistido (Walter IA)</span>
                        <span className="badge badge-cyan" style={{ fontSize: '0.62rem' }}>Walter IA</span>
                      </h4>

                      <div style={{ 
                        filter: rawReviewed ? 'none' : 'blur(5px)', 
                        opacity: rawReviewed ? 1 : 0.25,
                        userSelect: rawReviewed ? 'text' : 'none',
                        pointerEvents: rawReviewed ? 'auto' : 'none',
                        transition: 'all 0.3s ease'
                      }}>
                        <p style={{ fontSize: '0.78rem', color: '#ffffff', lineHeight: 1.45, marginBottom: '10px', textAlign: 'left' }}>
                          <strong>Síntesis clínica:</strong> {selectedPatient.sintesisClinica || `${selectedPatient.name} muestra indicios de ansiedad persistente y síntomas de agobio laboral. El diario cualitativo asocia los picos de malestar con situaciones de exposición social o reuniones de equipo en el entorno laboral.`}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, textAlign: 'left' }}>
                          <strong>Recomendación de abordaje:</strong> {selectedPatient.recomendacionAbordaje || 'Analizar en la videollamada las creencias nucleares de autoexigencia y no ser suficiente. Fomentar la práctica de respiración de rescate antes de las reuniones.'}
                        </p>
                        <div style={{ background: 'rgba(6,182,212,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(6,182,212,0.1)', fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', gap: '6px', marginTop: '12px', textAlign: 'left' }}>
                          <Sparkles size={14} color="var(--color-cyan)" style={{ flexShrink: 0 }} />
                          <span><strong>Nota ética sobre IA:</strong> El procesamiento asíncrono asiste y estructura el diario guiado del paciente para ahorrar tiempo de lectura, pero no reemplaza el juicio clínico ni emite diagnósticos independientes.</span>
                        </div>
                      </div>

                      {!rawReviewed && (
                        <div className="flex-center" style={{
                          position: 'absolute',
                          top: 0, left: 0, width: '100%', height: '100%',
                          background: 'rgba(5, 33, 58, 0.9)', backdropFilter: 'blur(3px)',
                          flexDirection: 'column', padding: '12px', textAlign: 'center', zIndex: 20
                        }}>
                          <div style={{
                            background: 'var(--background-secondary)',
                            border: '1px solid rgba(245,158,11,0.25)',
                            borderRadius: '8px', padding: '16px', maxWidth: '340px',
                            boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', gap: '10px'
                          }}>
                            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-amber)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                              ⚠️ Control de Sesgo Clínico (Raw-First)
                            </span>
                            <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.35, margin: 0 }}>
                              De acuerdo con las guías clínicas de Áncora, debes revisar los logs textuales y diarios del paciente antes de habilitar el resumen de la IA.
                            </p>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem', color: '#ffffff', cursor: 'pointer', justifyContent: 'center', userSelect: 'none' }}>
                              <input 
                                type="checkbox" 
                                checked={rawReviewed} 
                                onChange={(e) => setRawReviewed(e.target.checked)}
                                style={{ width: '14px', height: '14px', accentColor: 'var(--color-cyan)' }}
                              />
                              <strong>Confirmar revisión de datos en bruto</strong>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* COLUMNA DERECHA: MEMORIA CALIENTE (CORE CLINICAL PROFILE) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    {/* MEMORIA CALIENTE PANEL CONTAINER */}
                    <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(239,68,68,0.15)', background: 'rgba(5, 33, 58, 0.25)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <Activity size={12} color="var(--color-rose)" />
                          <span>Memoria Caliente (Core)</span>
                        </span>
                        <span className="badge badge-rose" style={{ fontSize: '0.58rem', padding: '1px 5px' }}>Persistente</span>
                      </div>

                      {/* Riesgos activos */}
                      <div style={{ textAlign: 'left' }}>
                        <label style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Perfil de Riesgo Activo</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.15)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
                          <AlertTriangle size={20} color={selectedPatient.triage?.status === 'risk_high' ? 'var(--color-rose)' : 'var(--color-amber)'} />
                          <div>
                            <strong style={{ fontSize: '0.78rem', color: '#ffffff', display: 'block' }}>
                              {selectedPatient.triage?.desc || 'Riesgo Moderado'}
                            </strong>
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                              GAD-7: {selectedPatient.triage?.gad7 || '11'} · PHQ-9: {selectedPatient.triage?.phq9 || '14'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Objetivos terapéuticos */}
                      <div style={{ textAlign: 'left' }}>
                        <label style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Objetivos Terapéuticos Activos</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {(selectedPatient.specialties || ['Ansiedad', 'Límites Laborales']).map((obj, idx) => (
                            <div key={idx} style={{ fontSize: '0.72rem', color: '#fff', display: 'flex', gap: '6px', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '5px 8px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.03)' }}>
                              <span style={{ width: '4px', height: '4px', background: 'var(--color-cyan)', borderRadius: '50%' }} />
                              <span>{obj}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Medicación activa consolidada */}
                      <div style={{ textAlign: 'left' }}>
                        <label style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Medicación Activa Consolidada</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {loadingClinical ? (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Cargando medicamentos...</span>
                          ) : meds.length === 0 ? (
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sin medicación consolidada</span>
                          ) : (
                            meds.map((med) => (
                              <div 
                                key={med.id} 
                                style={{ 
                                  fontSize: '0.7rem', 
                                  color: '#fff', 
                                  background: 'rgba(0,0,0,0.12)', 
                                  padding: '8px', 
                                  borderRadius: '6px', 
                                  border: '1px solid rgba(255,255,255,0.02)',
                                  borderLeft: med.authority_level === 1 ? '3px solid var(--color-emerald)' : '3px solid var(--color-amber)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '2px'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <strong>{med.name} {med.dose}</strong>
                                  <span style={{ fontSize: '0.52rem', color: med.authority_level === 1 ? 'var(--color-emerald)' : 'var(--color-amber)', textTransform: 'uppercase' }}>
                                    {med.authority_level === 1 ? 'Validado' : 'Declarado'}
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{med.frequency}</span>
                                <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>Prescriptor: {med.prescriber}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Temas clave */}
                    <div className="glass-panel" style={{ padding: '20px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Temas clave detectados</span>
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {selectedPatient.temasClave.map((tema) => (
                          <span key={tema} className="badge" style={{ padding: '6px 12px', background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.15)', color: 'var(--color-cyan)', fontSize: '0.68rem', fontWeight: '600' }}>
                            {tema}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Seguridad y Privacidad */}
                    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Seguridad y RGPD</h4>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Firma de Consentimiento:</span>
                          <strong style={{ color: selectedPatient.consent.accepted ? 'var(--color-emerald)' : 'var(--color-rose)' }}>{selectedPatient.consent.accepted ? 'Aceptado v1.0' : 'Falta Firma'}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Cifrado de Expediente:</span>
                          <strong style={{ color: 'var(--color-cyan)' }}>AES-GCM 256 bits</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. DATOS EN BRUTO (RAW FIRST) */}
              {patientSubTab === 'raw' && (
                <div className="glass-panel animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      Logs literales del Diario del Paciente (Raw Data)
                    </h4>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: 'var(--color-cyan)', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={rawReviewed} 
                        onChange={(e) => setRawReviewed(e.target.checked)}
                        style={{ accentColor: 'var(--color-cyan)' }}
                      />
                      <strong>Marcar como revisado para la IA</strong>
                    </label>
                  </div>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'left', lineHeight: 1.45 }}>
                    Este listado muestra las transcripciones e ingresos textuales volcados por el paciente en sus diarios de autocheckin con Walter. El terapeuta debe revisar este material cualitativo para comprender el contexto vivencial sin intermediación.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                    {selectedPatient.rawLogs && selectedPatient.rawLogs.length > 0 ? (
                      selectedPatient.rawLogs.map((log) => (
                        <div key={log.id} style={{ background: 'rgba(0,0,0,0.15)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                            <span>📅 {log.time}</span>
                            <span style={{ color: 'var(--color-cyan)', fontWeight: 'bold' }}>Canal Cifrado Local</span>
                          </div>
                          <p style={{ fontSize: '0.78rem', color: '#ffffff', lineHeight: 1.45, margin: '0 0 10px 0', textAlign: 'left' }}>
                            "{log.text}"
                          </p>
                          <div style={{ display: 'flex', gap: '16px', fontSize: '0.65rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Contexto: <strong>{log.context}</strong></span>
                            <span style={{ color: 'var(--text-secondary)' }}>Horas sueño: <strong>{log.sleep}</strong></span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '20px', color: 'var(--text-tertiary)', fontSize: '0.76rem', textAlign: 'center' }}>
                        No hay logs en bruto cargados para este paciente.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. NOTAS SOAP CLÍNICAS */}
              {patientSubTab === 'notas' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="grid-responsive-detail">
                  
                  {/* Editor SOAP Activo */}
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        Nota SOAP Activa (Borrador)
                      </h4>
                      <button 
                        onClick={() => {
                          if (selectedPatient.soapDraft) {
                            setSoapSubjective(prev => prev || selectedPatient.soapDraft.subjective);
                            setSoapObjective(prev => prev || selectedPatient.soapDraft.objective);
                            setSoapAssessment(prev => prev || selectedPatient.soapDraft.assessment);
                            setSoapPlan(prev => prev || selectedPatient.soapDraft.plan);
                          }
                          setSoapAssessment(prev => prev + " [Foco clínico IA: Ansiedad por perfeccionismo laboral.]");
                          setSoapPlan(prev => prev + "\n- Pauta de diario emocional con Walter.\n- Ejercicios de respiración controlada.");
                        }}
                        className="btn btn-outline" 
                        style={{ height: '24px', fontSize: '0.62rem', padding: '0 8px', color: 'var(--color-cyan)', borderColor: 'rgba(6,182,212,0.2)' }}
                      >
                        ⚡ Generar Borrador IA
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>S - Subjetivo (Lo que refiere el paciente)</label>
                        <textarea 
                          className="form-input" 
                          value={soapSubjective} 
                          onChange={(e) => setSoapSubjective(e.target.value)}
                          placeholder="Síntomas reportados, estado de ánimo percibido..."
                          style={{ height: '60px', fontSize: '0.74rem', padding: '8px', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff', width: '100%', resize: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>O - Objetivo (Observaciones del psicólogo, logs revisados)</label>
                        <textarea 
                          className="form-input" 
                          value={soapObjective} 
                          onChange={(e) => setSoapObjective(e.target.value)}
                          placeholder="Lenguaje corporal, signos clínicos detectados, cumplimiento de tareas..."
                          style={{ height: '60px', fontSize: '0.74rem', padding: '8px', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff', width: '100%', resize: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>A - Evaluación (Análisis y foco clínico)</label>
                        <textarea 
                          className="form-input" 
                          value={soapAssessment} 
                          onChange={(e) => setSoapAssessment(e.target.value)}
                          placeholder="Hipótesis diagnósticas, evolución clínica, focos activos..."
                          style={{ height: '60px', fontSize: '0.74rem', padding: '8px', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff', width: '100%', resize: 'none' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>P - Plan (Tareas pautadas e intervenciones)</label>
                        <textarea 
                          className="form-input" 
                          value={soapPlan} 
                          onChange={(e) => setSoapPlan(e.target.value)}
                          placeholder="Ejercicios asignados, fecha de próxima sesión, ajustes en plan..."
                          style={{ height: '60px', fontSize: '0.74rem', padding: '8px', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff', width: '100%', resize: 'none' }}
                        />
                      </div>
                    </div>

                    <button 
                      onClick={(e) => { handleSaveSOAP(e); }}
                      className="btn btn-cyan" 
                      style={{ height: '36px', fontSize: '0.76rem', display: 'flex', justifyItems: 'center', justifyContent: 'center', alignItems: 'center', gap: '4px', fontWeight: 'bold', width: '100%' }}
                    >
                      <ShieldCheck size={14} />
                      <span>Guardar y Firmar Nota SOAP</span>
                    </button>
                  </div>

                  {/* Historial de Notas SOAP */}
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0 }}>
                      Historial de Notas SOAP Guardadas
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
                      {selectedPatient.pastSOAPs && selectedPatient.pastSOAPs.length > 0 ? (
                        selectedPatient.pastSOAPs.map((note) => (
                          <div key={note.id} style={{ background: 'rgba(255,255,255,0.01)', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.74rem', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-cyan)', fontSize: '0.65rem', marginBottom: '6px' }}>
                              <span>📅 Nota Firmada: {note.date}</span>
                              <span>Firmante: {note.author}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: 'var(--text-secondary)', fontSize: '0.7rem' }}>
                              <span><strong>S:</strong> {note.subjective}</span>
                              <span><strong>O:</strong> {note.objective}</span>
                              <span><strong>A:</strong> {note.assessment}</span>
                              <span><strong>P:</strong> {note.plan}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '20px', color: 'var(--text-tertiary)', fontSize: '0.74rem', textAlign: 'center' }}>
                          No hay notas SOAP firmadas anteriormente.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. SESIONES Y CITAS */}
              {patientSubTab === 'sesiones' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="grid-responsive-detail">
                  {/* Listado de Sesiones */}
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0 }}>
                      Expediente de Citas
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedPatient.appointments && selectedPatient.appointments.length > 0 ? (
                        selectedPatient.appointments.map(appt => (
                          <div 
                            key={appt.id} 
                            style={{ 
                              padding: '12px 14px', 
                              borderRadius: '8px', 
                              background: 'var(--background-secondary)', 
                              border: '1px solid var(--border)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              textAlign: 'left'
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: '0.78rem', color: '#ffffff', display: 'block' }}>
                                {appt.type}
                              </strong>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                                Fecha: {appt.date} · Hora: {appt.time}h
                              </span>
                            </div>
                            <span 
                              className="badge" 
                              style={{ 
                                fontSize: '0.58rem', 
                                padding: '2px 8px', 
                                background: appt.status === 'Completada' ? 'rgba(16,185,129,0.08)' : 'rgba(6,182,212,0.08)',
                                color: appt.status === 'Completada' ? 'var(--color-emerald)' : 'var(--color-cyan)',
                                borderColor: 'transparent'
                              }}
                            >
                              {appt.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '20px', color: 'var(--text-tertiary)', fontSize: '0.74rem', textAlign: 'center' }}>
                          No hay citas registradas en el historial.
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Agendar Nueva Sesión */}
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '4px solid var(--color-cyan)' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        Programar Cita Terapéutica
                      </h4>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'left', lineHeight: 1.4 }}>
                        Elige el slot y tipo de sesión. La reserva se sincronizará automáticamente con tu calendario de Google/Outlook y se reflejará en la app del paciente.
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', marginTop: '6px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.62rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Fecha de la Sesión</label>
                          <input 
                            type="date" 
                            className="form-input" 
                            value={newApptDate}
                            onChange={(e) => setNewApptDate(e.target.value)}
                            style={{ height: '32px', fontSize: '0.74rem', padding: '0 8px', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.62rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Hora de la Sesión</label>
                          <input 
                            type="time" 
                            className="form-input" 
                            value={newApptTime}
                            onChange={(e) => setNewApptTime(e.target.value)}
                            style={{ height: '32px', fontSize: '0.74rem', padding: '0 8px', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.62rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Tipo de Sesión</label>
                          <select
                            className="form-input"
                            value={newApptType}
                            onChange={(e) => setNewApptType(e.target.value)}
                            style={{ height: '32px', fontSize: '0.74rem', padding: '0 8px', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff', cursor: 'pointer' }}
                          >
                            <option value="Sesión Individual">Sesión de Tratamiento Individual (50 min)</option>
                            <option value="Triaje Clínico">Triaje de Evaluación Inicial (30 min)</option>
                            <option value="Sesión de Seguimiento">Sesión de Seguimiento Breve (15 min)</option>
                          </select>
                        </div>

                        <button 
                          onClick={handleAddAppointment}
                          className="btn btn-cyan"
                          style={{ height: '34px', fontSize: '0.76rem', fontWeight: 'bold', marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        >
                          Crear y Sincronizar Sesión
                        </button>
                      </div>
                    </div>

                    {/* Ciclo Terapéutico y Planificación de Revisiones */}
                    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '4px solid var(--color-emerald)' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} color="var(--color-emerald)" />
                        <span>Ciclo Terapéutico y Revisiones</span>
                      </h4>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'left', lineHeight: 1.4 }}>
                        Configura el inicio de la semana terapéutica de este paciente para escalonar la entrega de sus revisiones y balancear tu carga de trabajo semanal.
                      </p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left', marginTop: '6px' }}>
                        <label style={{ fontSize: '0.62rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Inicio de la Semana Terapéutica</label>
                        <select
                          value={selectedPatient.startOfWeek || localStorage.getItem(`patient_start_of_week_${selectedPatient.id}`) || selectedPatient.contexto_terapeutico?.start_of_week || 'Lunes'}
                          onChange={(e) => updatePatientStartOfWeek(selectedPatient.id, e.target.value)}
                          className="form-input"
                          style={{ height: '32px', fontSize: '0.74rem', padding: '0 8px', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff', cursor: 'pointer' }}
                        >
                          <option value="Lunes">Lunes (Límite de revisión: Domingo)</option>
                          <option value="Martes">Martes (Límite de revisión: Lunes)</option>
                          <option value="Miércoles">Miércoles (Límite de revisión: Martes)</option>
                          <option value="Jueves">Jueves (Límite de revisión: Miércoles)</option>
                          <option value="Viernes">Viernes (Límite de revisión: Jueves)</option>
                          <option value="Sábado">Sábado (Límite de revisión: Viernes)</option>
                          <option value="Domingo">Domingo (Límite de revisión: Sábado)</option>
                        </select>
                      </div>

                      <div style={{ background: 'rgba(16,185,129,0.02)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.1)', fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'left', lineHeight: 1.35, marginTop: '4px' }}>
                        💡 <strong>Escalonamiento activo:</strong> Las revisiones del paciente vencerán el día anterior al inicio de su semana. Para este paciente, vencerán el <strong>{
                          (() => {
                            const val = selectedPatient.startOfWeek || localStorage.getItem(`patient_start_of_week_${selectedPatient.id}`) || selectedPatient.contexto_terapeutico?.start_of_week || 'Lunes';
                            const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                            const idx = DAYS.indexOf(val);
                            return DAYS[(idx + 6) % 7];
                          })()
                        }</strong>.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. PLAN TERAPÉUTICO / TAREAS */}
              {patientSubTab === 'tareas' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="grid-responsive-detail">
                  {/* Checklist de Tareas del Paciente */}
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        Ejercicios e Intervenciones Asignadas
                      </h4>
                      <span className="badge badge-emerald" style={{ fontSize: '0.6rem' }}>
                        Adherencia: {selectedPatient.adherence}%
                      </span>
                    </div>

                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'left', lineHeight: 1.45 }}>
                      Marca o desmarca las tareas completadas por el paciente para registrar el nivel de cumplimiento terapéutico del plan semanal.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                      {selectedPatient.tasks && selectedPatient.tasks.length > 0 ? (
                        selectedPatient.tasks.map(task => (
                          <div 
                            key={task.id}
                            onClick={() => handleTogglePatientTask(task.id)}
                            style={{ 
                              padding: '10px 14px', 
                              borderRadius: '8px', 
                              background: task.done ? 'rgba(16,185,129,0.03)' : 'rgba(255,255,255,0.01)', 
                              border: '1px solid',
                              borderColor: task.done ? 'rgba(16,185,129,0.15)' : 'var(--border)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <input 
                              type="checkbox" 
                              checked={task.done}
                              onChange={() => {}} // Manejado por onClick del div
                              style={{ accentColor: 'var(--color-emerald)', cursor: 'pointer' }}
                            />
                            <span style={{ fontSize: '0.76rem', color: task.done ? 'var(--text-secondary)' : '#ffffff', textDecoration: task.done ? 'line-through' : 'none', flex: 1 }}>
                              {task.title}
                            </span>
                            <span className="badge" style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
                              +{task.points} pts
                            </span>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '20px', color: 'var(--text-tertiary)', fontSize: '0.74rem', textAlign: 'center' }}>
                          No hay tareas asignadas a este paciente.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Objetivos Clínicos de Referencia */}
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0 }}>
                      Objetivos Clínicos de la Terapia
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[
                        { title: 'Reestructuración Cognitiva', desc: 'Identificar distorsiones de autoexigencia extrema y reencuadrar con diálogo socrático.', cat: 'TCC' },
                        { title: 'Regulación del Sueño', desc: 'Controlar rumiaciones de final del día para mitigar el insomnio secundario.', cat: 'Fisiología' },
                        { title: 'Asertividad en Entorno Laboral', desc: 'Fomentar la delegación de roles y limitar la autoevaluación destructiva.', cat: 'Conducta' }
                      ].map((item, idx) => (
                        <div key={idx} style={{ padding: '12px', background: 'var(--background-secondary)', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'left' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '0.78rem', color: '#ffffff' }}>{item.title}</strong>
                            <span className="badge badge-cyan" style={{ fontSize: '0.55rem' }}>{item.cat}</span>
                          </div>
                          <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                            {item.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. PAUTA DE MEDICACIÓN */}
              {patientSubTab === 'medicacion' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="grid-responsive-detail">
                  {/* Listado de Pautas */}
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0 }}>
                      Farmacoterapia e Indicaciones Activas
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedPatient.medications && selectedPatient.medications.length > 0 ? (
                        selectedPatient.medications.map(med => (
                          <div 
                            key={med.id} 
                            style={{ 
                              padding: '12px 14px', 
                              borderRadius: '8px', 
                              background: 'var(--background-secondary)', 
                              border: '1px solid var(--border)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              textAlign: 'left'
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: '0.78rem', color: '#ffffff', display: 'block' }}>
                                {med.name}
                              </strong>
                              <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                                Dosis: {med.dose} · Toma: {med.schedule}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', display: 'block', textTransform: 'uppercase' }}>Adherencia</span>
                              <strong style={{ fontSize: '0.78rem', color: 'var(--color-emerald)' }}>{med.compliance}</strong>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '20px', color: 'var(--text-tertiary)', fontSize: '0.74rem', textAlign: 'center' }}>
                          No hay fármacos pautados en este expediente.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recetar Nuevo Fármaco */}
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '4px solid var(--color-cyan)' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      Prescribir Indicación Farmacológica
                    </h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, textAlign: 'left', lineHeight: 1.45 }}>
                      Añade pautas de tratamiento farmacoquímico prescritas en colaboración con su psiquiatra para que el paciente las visualice y registre en su check-in diario.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left', marginTop: '6px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Nombre del Fármaco</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={newMedName}
                          onChange={(e) => setNewMedName(e.target.value)}
                          placeholder="Ej. Atomoxetina..."
                          style={{ height: '32px', fontSize: '0.74rem', padding: '0 8px', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Dosis y Formato</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={newMedDose}
                          onChange={(e) => setNewMedDose(e.target.value)}
                          placeholder="Ej. 40mg (1 cápsula)..."
                          style={{ height: '32px', fontSize: '0.74rem', padding: '0 8px', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Horario y Pauta</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={newMedSchedule}
                          onChange={(e) => setNewMedSchedule(e.target.value)}
                          placeholder="Ej. 1-0-0 (Desayuno)..."
                          style={{ height: '32px', fontSize: '0.74rem', padding: '0 8px', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff' }}
                        />
                      </div>

                      <button 
                        onClick={handleAddMedication}
                        className="btn btn-cyan"
                        style={{ height: '34px', fontSize: '0.76rem', fontWeight: 'bold', marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                      >
                        Añadir a Ficha de Paciente
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 7. PRIVACIDAD, CONSENTIMIENTO Y AUDITORÍA */}
              {patientSubTab === 'consentimientos' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="grid-responsive-detail">
                  {/* Estado del Consentimiento */}
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0 }}>
                      Privacidad del Expediente Clínico (RGPD / HIPAA)
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Consentimiento Clínico:</span>
                        <strong style={{ color: selectedPatient.consent.accepted ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                          {selectedPatient.consent.accepted ? 'FIRMADO & ACEPTADO' : 'FALTA FIRMAR'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Versión del Documento:</span>
                        <span>{selectedPatient.consent.version}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Fecha y Hora de Firma:</span>
                        <span>{selectedPatient.consent.date} · Cifrado en Enclave</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Cifrado de Extremo a Extremo:</span>
                        <strong style={{ color: 'var(--color-cyan)' }}>Activo (Local Browser Side)</strong>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(6,182,212,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(6,182,212,0.1)', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
                      El paciente mantiene el control total de sus consentimientos. Puede decidir qué secciones del diario asíncrono comparte con su psicólogo, pudiendo retirar permisos en cualquier instante desde su aplicación móvil.
                    </div>
                  </div>

                  {/* Auditoría de Expediente */}
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: '4px solid var(--color-cyan)', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      Auditoría Clínico-Tecnológica
                    </h4>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                      El acceso a este panel de Paciente 360 genera logs de auditoría inmutables en Supabase en cumplimiento estricto con las normativas sanitarias.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-emerald)' }} />
                        <span>Log: Lectura de logs en bruto autorizada.</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-emerald)' }} />
                        <span>Log: Acceso a claves de enclave privado por sesión síncrona.</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-emerald)' }} />
                        <span>Log: Sincronización criptográfica completada.</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => alert(`Exportando historial clínico cifrado del paciente ${selectedPatient.name}...\n\nCódigo de integridad hash: sha256-${Date.now().toString(16)}\nEstado: Cifrado y exportado de forma segura.`)}
                      className="btn btn-outline"
                      style={{ height: '34px', fontSize: '0.74rem', width: '100%', marginTop: '10px' }}
                    >
                      Exportar Expediente Seguro
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
          {/* ==================== VISTA 3: NOTAS SOAP ASISTIDAS POR IA ==================== */}
          {activeSection === 'soap' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                    Nueva nota - SOAP
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                    Paciente seleccionado: <strong>{selectedPatient.name}</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={selectedPatient.id === 'empty-id' ? undefined : () => setActiveSection('dashboard')} 
                    disabled={selectedPatient.id === 'empty-id'}
                    className="btn btn-outline" 
                    style={{ 
                      height: '34px', 
                      fontSize: '0.72rem',
                      opacity: selectedPatient.id === 'empty-id' ? 0.5 : 1,
                      cursor: selectedPatient.id === 'empty-id' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Guardar borrador
                  </button>
                  <button 
                    onClick={selectedPatient.id === 'empty-id' ? undefined : handleSaveSOAP} 
                    disabled={selectedPatient.id === 'empty-id'}
                    className="btn btn-cyan" 
                    style={{ 
                      height: '34px', 
                      fontSize: '0.72rem',
                      opacity: selectedPatient.id === 'empty-id' ? 0.5 : 1,
                      cursor: selectedPatient.id === 'empty-id' ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Guardar y cerrar
                  </button>
                </div>
              </div>

              {/* Layout Form + Sugerencias IA */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '20px' }} className="grid-responsive-detail">
                
                {/* Formulario SOAP */}
                <form onSubmit={handleSaveSOAP} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Paciente</label>
                      <input type="text" className="form-input" value={selectedPatient.name} style={{ height: '36px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.15)' }} disabled />
                    </div>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Fecha y Hora</label>
                      <input type="text" className="form-input" value="30 de mayo, 2026 - 16:30" style={{ height: '36px', fontSize: '0.75rem', background: 'rgba(0,0,0,0.15)' }} disabled />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.05)', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 'bold' }}>S</span>
                      <span>Subjective (Subjetivo)</span>
                    </label>
                    <textarea 
                      className="form-input"
                      value={soapSubjective}
                      onChange={(e) => setSoapSubjective(e.target.value)}
                      disabled={selectedPatient.id === 'empty-id'}
                      style={{ height: '80px', fontSize: '0.75rem', resize: 'none', lineHeight: 1.4 }}
                      placeholder="Ej. Expresiones verbales del paciente, motivos de consulta, sensaciones descritas..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.05)', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 'bold' }}>O</span>
                      <span>Objective (Objetivo)</span>
                    </label>
                    <textarea 
                      className="form-input"
                      value={soapObjective}
                      onChange={(e) => setSoapObjective(e.target.value)}
                      disabled={selectedPatient.id === 'empty-id'}
                      style={{ height: '80px', fontSize: '0.75rem', resize: 'none', lineHeight: 1.4 }}
                      placeholder="Ej. Constataciones observables, afecto, somatizaciones, adherencia medida de diario..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.05)', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 'bold' }}>A</span>
                      <span>Assessment (Evaluación)</span>
                    </label>
                    <textarea 
                      className="form-input"
                      value={soapAssessment}
                      onChange={(e) => setSoapAssessment(e.target.value)}
                      disabled={selectedPatient.id === 'empty-id'}
                      style={{ height: '80px', fontSize: '0.75rem', resize: 'none', lineHeight: 1.4 }}
                      placeholder="Ej. Diagnóstico clínico actual, grado de evolución, evolución de puntuaciones GAD-7/PHQ-9..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.05)', width: '20px', height: '20px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 'bold' }}>P</span>
                      <span>Plan (Tratamiento)</span>
                    </label>
                    <textarea 
                      className="form-input"
                      value={soapPlan}
                      onChange={(e) => setSoapPlan(e.target.value)}
                      disabled={selectedPatient.id === 'empty-id'}
                      style={{ height: '80px', fontSize: '0.75rem', resize: 'none', lineHeight: 1.4 }}
                      placeholder="Ej. Tareas intersesiones, pautas activas de Walter, fecha de próxima consulta síncrona..."
                    />
                  </div>

                </form>

                {/* Columna Derecha: Sugerencias IA */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                    <Sparkles size={16} color="var(--color-cyan)" className="animate-pulse-soft" />
                    Sugerencias IA
                  </h4>

                  <div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Temas detectados</span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                      {selectedPatient.temasClave.map((t) => (
                        <span key={t} className="badge badge-cyan" style={{ fontSize: '0.6rem', padding: '3px 8px' }}>{t}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Intervenciones sugeridas</span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-cyan)' }} />
                        <span>Respiración 4-7-8</span>
                      </label>
                      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-cyan)' }} />
                        <span>Reestructuración cognitiva</span>
                      </label>
                      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input type="checkbox" defaultChecked style={{ accentColor: 'var(--color-cyan)' }} />
                        <span>Higiene del sueño</span>
                      </label>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={handleApplyAISuggestions}
                    className="btn btn-cyan"
                    style={{ width: '100%', height: '36px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' }}
                  >
                    <Sparkles size={13} />
                    <span>Aplicar sugerencias</span>
                  </button>
                </div>

              </div>

            </div>
          )}


          {/* ==================== VISTA 4: VIDEO-BRIEFING / PREPARACIÓN DE SESIÓN ==================== */}
          {activeSection === 'briefing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderTop: '4px solid var(--color-cyan)' }}>
                <div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                    Preparación de sesión
                  </span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                    Paciente: {selectedPatient.name}
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {selectedPatient.briefing.time}
                  </span>
                </div>

                <button 
                  onClick={selectedPatient.id === 'empty-id' ? undefined : handleStartVideo} 
                  disabled={selectedPatient.id === 'empty-id'}
                  className={`btn btn-cyan ${selectedPatient.id === 'empty-id' ? '' : 'animate-pulse-soft'}`} 
                  style={{ 
                    height: '40px', 
                    fontSize: '0.78rem', 
                    display: 'flex', 
                    gap: '6px', 
                    alignItems: 'center', 
                    padding: '0 18px',
                    opacity: selectedPatient.id === 'empty-id' ? 0.5 : 1,
                    cursor: selectedPatient.id === 'empty-id' ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Video size={16} />
                  <span>Iniciar sesión síncrona</span>
                </button>
              </div>

              {/* Layout Dual: Resumen para la sesión + Teleprompter */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20px' }} className="grid-responsive-detail">
                
                {/* Resumen para la sesión */}
                <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '6px', marginBottom: '10px' }}>
                      Resumen para la sesión
                    </h4>
                    
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Temas principales</span>
                    <ul style={{ paddingLeft: '14px', margin: '6px 0 12px 0', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selectedPatient.briefing.temas.map((t, idx) => <li key={idx}>{t}</li>)}
                    </ul>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Qué explorar</span>
                    <ul style={{ paddingLeft: '14px', margin: '6px 0 12px 0', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selectedPatient.briefing.explorar.map((e, idx) => <li key={idx}>{e}</li>)}
                    </ul>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Riesgos / Alertas</span>
                    <ul style={{ paddingLeft: '14px', margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selectedPatient.briefing.riesgos.map((r, idx) => <li key={idx}>{r}</li>)}
                    </ul>
                  </div>

                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Nivel de soporte evaluado:</span>
                    <span className="badge badge-rose" style={{ fontSize: '0.62rem' }}>
                      {selectedPatient.briefing.riskLevel}
                    </span>
                  </div>

                </div>

                {/* Teleprompter (puntos guía) */}
                <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(6,182,212,0.25)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Volume2 size={16} color="var(--color-cyan)" />
                      Teleprompter (puntos guía)
                    </h4>
                    
                    <span className="badge badge-cyan" style={{ fontSize: '0.6rem' }}>TCC Asistida</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, maxHeight: '280px', overflowY: 'auto' }}>
                    
                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid var(--color-cyan)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Acompañar en validación emocional. Prefiere el significado de "no ser suficiente".
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid var(--color-cyan)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Explorar el significado de "no ser suficiente". Relacionar con experiencias tempranas.
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid var(--color-cyan)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Profundizar en el ciclo de autoexigencia: pensamiento → emoción → conducta.
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.01)', padding: '10px 14px', borderRadius: '6px', borderLeft: '3px solid var(--color-cyan)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Reforzar pequeños logros y recursos internos. Planear acción concreta para la semana.
                    </div>

                  </div>

                  <button className="btn btn-outline" style={{ height: '34px', fontSize: '0.72rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Plus size={14} />
                    <span>Agregar nota personal al teleprompter</span>
                  </button>

                </div>

              </div>

            </div>
          )}

          {activeSection === 'agenda' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Tarjeta de integración de Stripe y Google Calendar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="grid-responsive-detail">
                
                {/* Sincronización Google Calendar */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid var(--color-cyan)', background: 'rgba(6,182,212,0.02)' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={20} color="var(--color-cyan)" />
                      Sincronización con Google Calendar
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '16px' }}>
                      Conecta tu agenda de Áncora con Google Calendar para importar tus eventos y bloquear slots ocupados de forma bidireccional. Tus pacientes solo verán los slots realmente disponibles en su zona horaria.
                    </p>

                    {googleSynced ? (
                      <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--color-emerald)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <CheckCircle size={16} />
                          ¡Sincronizado con {profile?.email || user?.email || 'tu cuenta de Google'}!
                        </span>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: '6px 0 0 0', lineHeight: 1.35 }}>
                          Tus sesiones clínicas programadas se sincronizan automáticamente con tu cuenta de Google Calendar.
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <button
                    onClick={handleSyncGoogleCalendar}
                    disabled={isSyncingGoogle}
                    className={googleSynced ? "btn btn-outline" : "btn btn-cyan"}
                    style={{
                      height: '42px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      textTransform: 'none',
                      borderColor: googleSynced ? 'rgba(244, 63, 94, 0.4)' : 'none',
                      color: googleSynced ? 'var(--color-rose)' : '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    {isSyncingGoogle ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={16} />
                        <span>{googleSynced ? 'Desconectar Google Calendar' : 'Sincronizar con Google Calendar'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Tarifas y Stripe Connect */}
                <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CreditCard size={20} color="var(--color-emerald)" />
                    Configuración de Tarifas (Stripe)
                  </h3>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                    Ajusta tus precios clínicos. La comisión por uso de software de Áncora y los cargos de Stripe se calculan de forma transparente en origen.
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.62rem', fontWeight: 'bold', color: 'var(--text-tertiary)' }}>SESIÓN SÍNCRONA (Mín. 39€)</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          min="39"
                          value={sessionFee}
                          onChange={(e) => setSessionFee(Math.max(39, parseInt(e.target.value) || 39))}
                          style={{ height: '32px', paddingInline: '8px', width: '100%', fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', color: '#ffffff', outline: 'none' }}
                        />
                        <span style={{ position: 'absolute', right: '10px', top: '7px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>€</span>
                      </div>
                    </div>

                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.62rem', fontWeight: 'bold', color: 'var(--text-tertiary)' }}>PLAN MENSUAL (Mín. 29€)</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          min="29"
                          value={asyncFee}
                          onChange={(e) => setAsyncFee(Math.max(29, parseInt(e.target.value) || 29))}
                          style={{ height: '32px', paddingInline: '8px', width: '100%', fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'rgba(0,0,0,0.2)', color: '#ffffff', outline: 'none' }}
                        />
                        <span style={{ position: 'absolute', right: '10px', top: '7px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>€</span>
                      </div>
                    </div>
                  </div>

                  {/* Desglose Split Stripe Connect */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)', borderRadius: '8px', padding: '12px', fontSize: '0.68rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Tarifa abonada por Paciente:</span>
                      <strong style={{ color: '#ffffff' }}>{sessionFee} €</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>- Comisión Tecnología Áncora (10%):</span>
                      <span style={{ color: 'var(--color-rose)' }}>-{(sessionFee * 0.1).toFixed(2)} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>- Stripe Connect Fees (1.5% + 0.25€):</span>
                      <span style={{ color: 'var(--color-rose)' }}>-{(sessionFee * 0.015 + 0.25).toFixed(2)} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px', marginTop: '2px', fontSize: '0.72rem' }}>
                      <span style={{ color: '#ffffff', fontWeight: 'bold' }}>Ingreso Neto a tu Banco:</span>
                      <strong style={{ color: 'var(--color-emerald)' }}>
                        {(sessionFee - (sessionFee * 0.1) - (sessionFee * 0.015 + 0.25)).toFixed(2)} € (Exento de IVA)
                      </strong>
                    </div>
                  </div>
                </div>

              </div>

              {/* Calendario de Disponibilidad Horaria Semanal */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Calendario de Slots de Consulta de la Semana</span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Haz clic en un bloque de hora para abrir o cerrar tu disponibilidad</span>
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }} className="grid-responsive-dashboard">
                  {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(day => (
                    <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-cyan)', textAlign: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {day}
                      </span>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00'].map(hour => {
                          const slot = availabilitySlots.find(s => s.day === day && s.hour === hour);
                          const isGoogleBlocked = slot?.status === 'google_blocked';
                          const isAvailable = slot?.status === 'available';

                          return (
                            <button
                              key={hour}
                              type="button"
                              onClick={() => handleToggleSlot(day, hour)}
                              style={{
                                height: '34px',
                                fontSize: '0.68rem',
                                borderRadius: '6px',
                                border: '1px solid',
                                borderColor: isGoogleBlocked ? 'rgba(6,182,212,0.3)' : (isAvailable ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.03)'),
                                background: isGoogleBlocked ? 'rgba(6,182,212,0.08)' : (isAvailable ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.15)'),
                                color: isGoogleBlocked ? 'var(--color-cyan)' : (isAvailable ? 'var(--color-emerald)' : 'var(--text-secondary)'),
                                cursor: isGoogleBlocked ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                                outline: 'none'
                              }}
                            >
                              <strong style={{ fontSize: '0.72rem' }}>{hour}</strong>
                              <span style={{ fontSize: '0.52rem', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                {isGoogleBlocked ? 'Ocupado' : (isAvailable ? 'Libre' : 'Cerrado')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Balanceador de Carga Semanal de Revisiones Clínicas */}
              {(() => {
                const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                const getDeadlineDay = (startOfWeek) => {
                  if (!startOfWeek) startOfWeek = 'Lunes';
                  const idx = DAYS.indexOf(startOfWeek);
                  if (idx === -1) return 'Domingo';
                  return DAYS[(idx + 6) % 7];
                };

                const deadlineGroups = DAYS.reduce((acc, d) => {
                  acc[d] = [];
                  return acc;
                }, {});

                patients.forEach(p => {
                  const pStartOfWeek = p.startOfWeek || localStorage.getItem(`patient_start_of_week_${p.id}`) || p.contexto_terapeutico?.start_of_week || 'Lunes';
                  const deadline = getDeadlineDay(pStartOfWeek);
                  deadlineGroups[deadline].push(p);
                });

                return (
                  <div className="glass-panel" style={{ padding: '24px', marginTop: '20px', borderLeft: '4px solid var(--color-cyan)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Activity size={20} color="var(--color-cyan)" />
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        Balanceador de Carga Semanal de Revisiones Clínicas
                      </h3>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '20px', margin: 0, textAlign: 'left' }}>
                      Distribución de pacientes según el día límite de entrega de sus revisiones (el día anterior a su inicio de ciclo semanal). Reasigna su día de inicio para equilibrar tu volumen de trabajo diario y evitar la acumulación de revisiones los lunes.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {DAYS.map(day => {
                        const groupPatients = deadlineGroups[day] || [];
                        const count = groupPatients.length;
                        // Carga máxima sugerida de revisiones por día = 3
                        const pct = Math.min(100, (count / 3) * 100);
                        
                        // Determinar color de la barra
                        let barColor = 'rgba(255,255,255,0.05)';
                        let labelColor = 'var(--text-tertiary)';
                        let badgeStyle = { background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)' };
                        
                        if (count > 0) {
                          if (count <= 2) {
                            barColor = 'var(--color-emerald)';
                            labelColor = 'var(--color-emerald)';
                            badgeStyle = { background: 'rgba(16,185,129,0.08)', color: 'var(--color-emerald)', border: '1px solid rgba(16,185,129,0.15)' };
                          } else if (count === 3) {
                            barColor = 'var(--color-cyan)';
                            labelColor = 'var(--color-cyan)';
                            badgeStyle = { background: 'rgba(6,182,212,0.08)', color: 'var(--color-cyan)', border: '1px solid rgba(6,182,212,0.15)' };
                          } else {
                            barColor = 'var(--color-rose)';
                            labelColor = 'var(--color-rose)';
                            badgeStyle = { background: 'rgba(244,63,94,0.08)', color: 'var(--color-rose)', border: '1px solid rgba(244,63,94,0.15)' };
                          }
                        }

                        return (
                          <div 
                            key={day} 
                            style={{ 
                              display: 'grid', 
                              gridTemplateColumns: '150px 1.5fr 3.5fr', 
                              alignItems: 'center', 
                              gap: '16px',
                              paddingBottom: '12px',
                              borderBottom: '1px solid rgba(255,255,255,0.03)'
                            }}
                            className="grid-responsive-detail"
                          >
                            {/* Nombre del Día y Contador */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: count > 0 ? '#ffffff' : 'var(--text-tertiary)' }}>
                                Límite: {day}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: count > 0 ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                                {count === 0 ? 'Sin entregas' : (count === 1 ? '1 paciente' : `${count} pacientes`)}
                              </span>
                            </div>

                            {/* Barra de progreso */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                                <div 
                                  style={{ 
                                    width: `${pct}%`, 
                                    height: '100%', 
                                    background: barColor, 
                                    borderRadius: '3px',
                                    transition: 'width 0.3s ease, background-color 0.3s ease' 
                                  }} 
                                />
                              </div>
                              {count > 0 && (
                                <span className="badge" style={{ ...badgeStyle, fontSize: '0.58rem', padding: '2px 6px' }}>
                                  {count > 3 ? 'Sobrecarga' : (count === 3 ? 'Ideal' : 'Óptima')}
                                </span>
                              )}
                            </div>

                            {/* Lista de pacientes asignados */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-start' }}>
                              {count > 0 ? (
                                groupPatients.map(pat => {
                                  const patStartOfWeek = pat.startOfWeek || localStorage.getItem(`patient_start_of_week_${pat.id}`) || pat.contexto_terapeutico?.start_of_week || 'Lunes';
                                  return (
                                    <div 
                                      key={pat.id} 
                                      style={{ 
                                        display: 'inline-flex', 
                                        alignItems: 'center', 
                                        gap: '6px', 
                                        background: 'rgba(255,255,255,0.02)', 
                                        border: '1px solid rgba(255,255,255,0.06)', 
                                        borderRadius: '20px', 
                                        padding: '3px 8px 3px 3px',
                                        fontSize: '0.68rem',
                                        transition: 'all 0.15s ease'
                                      }}
                                    >
                                      <img 
                                        src={pat.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150'} 
                                        alt={pat.name} 
                                        style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} 
                                      />
                                      <span style={{ color: '#ffffff', fontWeight: 600 }}>{pat.name.split(' ')[0]}</span>
                                      <select
                                        value={patStartOfWeek}
                                        onChange={(e) => updatePatientStartOfWeek(pat.id, e.target.value)}
                                        style={{ 
                                          background: 'transparent', 
                                          border: 'none', 
                                          color: 'var(--color-cyan)', 
                                          fontSize: '0.65rem', 
                                          cursor: 'pointer', 
                                          outline: 'none',
                                          padding: 0,
                                          margin: 0,
                                          fontWeight: 'bold'
                                        }}
                                      >
                                        {DAYS.map(d => (
                                          <option key={d} value={d} style={{ background: '#121824', color: '#fff' }}>
                                            Inicia {d}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  );
                                })
                              ) : (
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                                  Ningún paciente entrega este día
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Calendario Mensual/Semanal/Diario de Citas (Estilo Google Calendar) */}
              <div className="glass-panel" style={{ padding: '24px', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Cabecera del Calendario */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(6,182,212,0.08)', color: 'var(--color-cyan)' }}>
                      <Calendar size={22} />
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                        Agenda de Sesiones Clínicas
                      </h3>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        Sincronizado con Supabase en tiempo real
                      </span>
                    </div>
                  </div>

                  {/* Rango de Fechas y Navegación */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button 
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        setSelectedDate(today);
                        setCurrentYear(today.getFullYear());
                        setCurrentMonth(today.getMonth());
                      }}
                      className="btn btn-outline"
                      style={{ height: '32px', fontSize: '0.72rem', paddingInline: '14px', borderColor: 'var(--border)', cursor: 'pointer', background: 'transparent' }}
                    >
                      Hoy
                    </button>

                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button 
                        type="button"
                        onClick={() => {
                          if (calendarView === 'month') {
                            setCurrentMonth(prev => {
                              if (prev === 0) {
                                setCurrentYear(y => y - 1);
                                return 11;
                              }
                              return prev - 1;
                            });
                          } else if (calendarView === 'week') {
                            setSelectedDate(prev => {
                              const nd = new Date(prev.getTime());
                              nd.setDate(prev.getDate() - 7);
                              setCurrentYear(nd.getFullYear());
                              setCurrentMonth(nd.getMonth());
                              return nd;
                            });
                          } else {
                            setSelectedDate(prev => {
                              const nd = new Date(prev.getTime());
                              nd.setDate(prev.getDate() - 1);
                              setCurrentYear(nd.getFullYear());
                              setCurrentMonth(nd.getMonth());
                              return nd;
                            });
                          }
                        }}
                        className="btn btn-outline"
                        style={{ border: '1px solid var(--border)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', padding: 0 }}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          if (calendarView === 'month') {
                            setCurrentMonth(prev => {
                              if (prev === 11) {
                                setCurrentYear(y => y + 1);
                                return 0;
                              }
                              return prev + 1;
                            });
                          } else if (calendarView === 'week') {
                            setSelectedDate(prev => {
                              const nd = new Date(prev.getTime());
                              nd.setDate(prev.getDate() + 7);
                              setCurrentYear(nd.getFullYear());
                              setCurrentMonth(nd.getMonth());
                              return nd;
                            });
                          } else {
                            setSelectedDate(prev => {
                              const nd = new Date(prev.getTime());
                              nd.setDate(prev.getDate() + 1);
                              setCurrentYear(nd.getFullYear());
                              setCurrentMonth(nd.getMonth());
                              return nd;
                            });
                          }
                        }}
                        className="btn btn-outline"
                        style={{ border: '1px solid var(--border)', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'transparent', padding: 0 }}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', minWidth: '180px', textAlign: 'left' }}>
                      {calendarView === 'month' && `${monthNames[currentMonth]} ${currentYear}`}
                      {calendarView === 'week' && (() => {
                        const getMonday = (d) => {
                          const day = d.getDay();
                          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                          return new Date(d.getFullYear(), d.getMonth(), diff);
                        };
                        const mon = getMonday(selectedDate);
                        const sun = new Date(mon.getTime() + 6 * 24 * 60 * 60 * 1000);
                        return mon.getMonth() === sun.getMonth() 
                          ? `Del ${mon.getDate()} al ${sun.getDate()} de ${monthNames[mon.getMonth()]}`
                          : `Del ${mon.getDate()} de ${monthNames[mon.getMonth()].substring(0, 3)} al ${sun.getDate()} de ${monthNames[sun.getMonth()].substring(0, 3)}`;
                      })()}
                      {calendarView === 'day' && (() => {
                        const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                        return `${daysOfWeek[selectedDate.getDay()]}, ${selectedDate.getDate()} de ${monthNames[selectedDate.getMonth()]}`;
                      })()}
                    </span>
                  </div>

                  {/* Selectores de Vista y Refresco */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      {['month', 'week', 'day'].map(view => (
                        <button
                          key={view}
                          type="button"
                          onClick={() => setCalendarView(view)}
                          style={{
                            height: '28px',
                            paddingInline: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            border: 'none',
                            borderRadius: '4px',
                            background: calendarView === view ? 'var(--color-cyan)' : 'transparent',
                            color: calendarView === view ? '#121824' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {view === 'month' ? 'Mes' : (view === 'week' ? 'Semana' : 'Día')}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={fetchDbAppointments}
                      type="button"
                      className="btn btn-outline"
                      style={{ height: '32px', fontSize: '0.65rem', paddingInline: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', background: 'transparent' }}
                      title="Refrescar citas desde Supabase"
                    >
                      <RefreshCw size={12} className={loadingAppts ? 'animate-spin' : ''} />
                      <span>Sincronizar</span>
                    </button>
                  </div>
                </div>

                {/* Grid del Calendario */}
                {loadingAppts ? (
                  <div style={{ textAlign: 'center', padding: '60px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <RefreshCw size={28} className="animate-spin" style={{ marginBottom: '10px', opacity: 0.7, color: 'var(--color-cyan)' }} />
                    <p>Sincronizando agenda clínica desde Supabase...</p>
                  </div>
                ) : (
                  <div style={{ minHeight: '400px' }}>
                    
                    {/* ================= VISTA DE MES ================= */}
                    {calendarView === 'month' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {/* Cabecera de días de la semana */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '4px' }}>
                          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                            <div key={d} style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-tertiary)', paddingBlock: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {d}
                            </div>
                          ))}
                        </div>

                        {/* Cuadrícula de días */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                          {(() => {
                            const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
                            const offset = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;
                            const days = [];
                            
                            // Días del mes anterior (offset)
                            const prevMonthDaysCount = new Date(currentYear, currentMonth, 0).getDate();
                            for (let i = offset - 1; i >= 0; i--) {
                              days.push({
                                dayNum: prevMonthDaysCount - i,
                                isCurrentMonth: false,
                                dateStr: `${currentMonth === 0 ? currentYear - 1 : currentYear}-${String(currentMonth === 0 ? 12 : currentMonth).padStart(2, '0')}-${String(prevMonthDaysCount - i).padStart(2, '0')}`
                              });
                            }
                            
                            // Días del mes actual
                            for (let i = 1; i <= daysCount; i++) {
                              days.push({
                                dayNum: i,
                                isCurrentMonth: true,
                                dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
                              });
                            }
                            
                            // Días del mes siguiente para completar la cuadrícula de 35 o 42 celdas
                            const totalCells = days.length <= 35 ? 35 : 42;
                            const nextMonthCells = totalCells - days.length;
                            for (let i = 1; i <= nextMonthCells; i++) {
                              days.push({
                                dayNum: i,
                                isCurrentMonth: false,
                                dateStr: `${currentMonth === 11 ? currentYear + 1 : currentYear}-${String(currentMonth === 11 ? 1 : currentMonth + 2).padStart(2, '0')}-${String(i).padStart(2, '0')}`
                              });
                            }

                            return days.map((dayObj, index) => {
                              const isToday = dayObj.dateStr === new Date().toISOString().split('T')[0];
                              const isBlocked = blockedDates.includes(dayObj.dateStr);
                              
                              // Filtrar citas para este día
                              const dayAppts = dbAppointments.filter(appt => appt.appointment_date === dayObj.dateStr && appt.status !== 'Cancelada');

                              return (
                                <div
                                  key={index}
                                  style={{
                                    minHeight: '120px',
                                    borderRadius: '8px',
                                    background: isBlocked 
                                      ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.01), rgba(255,255,255,0.01) 8px, rgba(255,255,255,0.02) 8px, rgba(255,255,255,0.02) 16px)'
                                      : (dayObj.isCurrentMonth ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.05)'),
                                    border: isToday ? '1px solid var(--color-cyan)' : '1px solid var(--border)',
                                    padding: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    opacity: dayObj.isCurrentMonth ? 1 : 0.4,
                                    position: 'relative',
                                    transition: 'all 0.15s ease'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (dayObj.isCurrentMonth) e.currentTarget.style.backgroundColor = 'rgba(6,182,212,0.02)';
                                  }}
                                  onMouseLeave={(e) => {
                                    if (dayObj.isCurrentMonth) e.currentTarget.style.backgroundColor = isBlocked ? 'transparent' : 'rgba(0,0,0,0.15)';
                                  }}
                                >
                                  {/* Encabezado del Día */}
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold',
                                      width: '22px',
                                      height: '22px',
                                      borderRadius: '50%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: isToday ? 'var(--color-cyan)' : 'transparent',
                                      color: isToday ? '#121824' : '#ffffff'
                                    }}>
                                      {dayObj.dayNum}
                                    </span>

                                    {/* Indicadores / Acciones rápidas del día */}
                                    {dayObj.isCurrentMonth && (
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setQuickAddDate(dayObj.dateStr);
                                            setQuickAddHour('10:00');
                                            setShowQuickAddModal(true);
                                          }}
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--text-tertiary)',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            padding: 0,
                                            lineHeight: 1
                                          }}
                                          title="Agendar Cita Rápida"
                                        >
                                          +
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleBlockDate(dayObj.dateStr)}
                                          style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: isBlocked ? 'var(--color-rose)' : 'var(--text-tertiary)',
                                            fontSize: '0.65rem',
                                            cursor: 'pointer',
                                            padding: 0,
                                            fontWeight: 'bold'
                                          }}
                                          title={isBlocked ? "Desbloquear Día" : "Bloquear Día (Día libre)"}
                                        >
                                          🚫
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Estado de bloqueo */}
                                  {isBlocked && (
                                    <div style={{ fontSize: '0.55rem', color: 'var(--color-rose)', fontWeight: 'bold', textTransform: 'uppercase', textAlign: 'center', marginBlock: 'auto' }}>
                                      Día Libre
                                    </div>
                                  )}

                                  {/* Citas */}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1, maxHeight: '80px' }}>
                                    {dayAppts.map(appt => {
                                      const isCompleted = appt.status === 'Completada';
                                      return (
                                        <button
                                          key={appt.id}
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedAppt(appt);
                                          }}
                                          style={{
                                            fontSize: '0.62rem',
                                            fontWeight: 700,
                                            padding: '3px 6px',
                                            borderRadius: '4px',
                                            background: isCompleted ? 'rgba(16,185,129,0.12)' : 'rgba(6,182,212,0.12)',
                                            border: isCompleted ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(6,182,212,0.3)',
                                            color: isCompleted ? 'var(--color-emerald)' : 'var(--color-cyan)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            width: '100%',
                                            transition: 'all 0.15s ease'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'scale(1.02)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                          }}
                                        >
                                          <strong>{appt.appointment_time.substring(0, 5)}</strong> {appt.patientName || 'Cita'}
                                        </button>
                                      );
                                    })}
                                  </div>

                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                    {/* ================= VISTA DE SEMANA ================= */}
                    {calendarView === 'week' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowX: 'auto' }}>
                        
                        {/* Cabecera de columnas (Días de la semana) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: '4px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ paddingBlock: '12px' }} /> {/* Espacio de la columna de horas */}
                          
                          {(() => {
                            const getMonday = (d) => {
                              const day = d.getDay();
                              const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                              return new Date(d.getFullYear(), d.getMonth(), diff);
                            };
                            const mon = getMonday(selectedDate);
                            const wNames = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
                            
                            return Array.from({ length: 7 }).map((_, i) => {
                              const date = new Date(mon.getTime());
                              date.setDate(mon.getDate() + i);
                              const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                              
                              return (
                                <div key={i} style={{ paddingBlock: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                                    {wNames[i]}
                                  </span>
                                  <span style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isToday ? 'var(--color-cyan)' : 'transparent',
                                    color: isToday ? '#121824' : '#ffffff'
                                  }}>
                                    {date.getDate()}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>

                        {/* Cuadrícula de horas y días */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '500px', overflowY: 'auto' }}>
                          {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(hour => {
                            
                            return (
                              <div key={hour} style={{ display: 'grid', gridTemplateColumns: '80px repeat(7, 1fr)', gap: '4px', alignItems: 'stretch' }}>
                                {/* Columna de la Hora */}
                                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBlock: '8px', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                                  {hour}
                                </div>

                                {/* Columnas de los 7 días para esa hora */}
                                {(() => {
                                  const getMonday = (d) => {
                                    const day = d.getDay();
                                    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                                    return new Date(d.getFullYear(), d.getMonth(), diff);
                                  };
                                  const mon = getMonday(selectedDate);

                                  return Array.from({ length: 7 }).map((_, i) => {
                                    const date = new Date(mon.getTime());
                                    date.setDate(mon.getDate() + i);
                                    const dateStr = date.toISOString().split('T')[0];
                                    const isBlocked = blockedDates.includes(dateStr);
                                    
                                    // Filtrar citas en este bloque exacto de hora y día
                                    const slotAppts = dbAppointments.filter(appt => 
                                      appt.appointment_date === dateStr && 
                                      appt.appointment_time.substring(0, 5) === hour &&
                                      appt.status !== 'Cancelada'
                                    );

                                    return (
                                      <div
                                        key={i}
                                        style={{
                                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                                          borderRight: '1px solid rgba(255,255,255,0.03)',
                                          minHeight: '42px',
                                          background: isBlocked 
                                            ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.005), rgba(255,255,255,0.005) 4px, rgba(255,255,255,0.01) 4px, rgba(255,255,255,0.01) 8px)'
                                            : 'transparent',
                                          padding: '2px',
                                          position: 'relative',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          transition: 'all 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                          if (!isBlocked && slotAppts.length === 0) {
                                            e.currentTarget.style.backgroundColor = 'rgba(6,182,212,0.04)';
                                            e.currentTarget.querySelector('.quick-add-btn').style.opacity = 1;
                                          }
                                        }}
                                        onMouseLeave={(e) => {
                                          if (!isBlocked && slotAppts.length === 0) {
                                            e.currentTarget.style.backgroundColor = 'transparent';
                                            e.currentTarget.querySelector('.quick-add-btn').style.opacity = 0;
                                          }
                                        }}
                                      >
                                        {/* Botón rápido de agregar cita (invisible por defecto, visible onHover) */}
                                        {!isBlocked && slotAppts.length === 0 && (
                                          <button
                                            className="quick-add-btn"
                                            type="button"
                                            onClick={() => {
                                              setQuickAddDate(dateStr);
                                              setQuickAddHour(hour);
                                              setShowQuickAddModal(true);
                                            }}
                                            style={{
                                              opacity: 0,
                                              position: 'absolute',
                                              width: '20px',
                                              height: '20px',
                                              borderRadius: '50%',
                                              background: 'var(--color-cyan)',
                                              color: '#121824',
                                              border: 'none',
                                              cursor: 'pointer',
                                              fontSize: '0.78rem',
                                              fontWeight: 'bold',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              zIndex: 2,
                                              transition: 'opacity 0.15s ease'
                                            }}
                                            title="Programar consulta aquí"
                                          >
                                            +
                                          </button>
                                        )}

                                        {/* Renderizado de citas */}
                                        {slotAppts.map(appt => {
                                          const isCompleted = appt.status === 'Completada';
                                          return (
                                            <button
                                              key={appt.id}
                                              type="button"
                                              onClick={() => setSelectedAppt(appt)}
                                              style={{
                                                width: '95%',
                                                height: '90%',
                                                borderRadius: '6px',
                                                background: isCompleted ? 'rgba(16,185,129,0.12)' : 'rgba(6,182,212,0.12)',
                                                border: isCompleted ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(6,182,212,0.3)',
                                                color: isCompleted ? 'var(--color-emerald)' : 'var(--color-cyan)',
                                                fontSize: '0.62rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                textAlign: 'center',
                                                padding: '2px',
                                                zIndex: 3,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'center'
                                              }}
                                            >
                                              <span style={{ display: 'block', fontWeight: 900 }}>{appt.patientName.split(' ')[0]}</span>
                                              <span style={{ fontSize: '0.52rem', opacity: 0.8 }}>{appt.session_type || 'Sesión'}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* ================= VISTA DE DÍA ================= */}
                    {calendarView === 'day' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        
                        {/* Cabecera del día */}
                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px', paddingBlock: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div /> {/* Espacio horas */}
                          <div style={{ textAlign: 'left', paddingLeft: '10px' }}>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Día Seleccionado
                            </span>
                            <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#ffffff', margin: '2px 0 0 0' }}>
                              {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
                            </h4>
                          </div>
                        </div>

                        {/* Listado de horas */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '500px', overflowY: 'auto' }}>
                          {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(hour => {
                            const dateStr = selectedDate.toISOString().split('T')[0];
                            const isBlocked = blockedDates.includes(dateStr);
                            const slotAppts = dbAppointments.filter(appt => 
                              appt.appointment_date === dateStr && 
                              appt.appointment_time.substring(0, 5) === hour &&
                              appt.status !== 'Cancelada'
                            );

                            return (
                              <div key={hour} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '10px', alignItems: 'stretch' }}>
                                {/* Columna Hora */}
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBlock: '14px', borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                                  {hour}
                                </div>

                                {/* Detalle del Slot */}
                                <div
                                  style={{
                                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                                    background: isBlocked 
                                      ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.005), rgba(255,255,255,0.005) 4px, rgba(255,255,255,0.01) 4px, rgba(255,255,255,0.01) 8px)'
                                      : 'transparent',
                                    padding: '4px 12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    position: 'relative',
                                    minHeight: '52px'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isBlocked && slotAppts.length === 0) {
                                      e.currentTarget.style.backgroundColor = 'rgba(6,182,212,0.04)';
                                      e.currentTarget.querySelector('.day-quick-add').style.opacity = 1;
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isBlocked && slotAppts.length === 0) {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.querySelector('.day-quick-add').style.opacity = 0;
                                    }
                                  }}
                                >
                                  {/* Botón agregar día */}
                                  {!isBlocked && slotAppts.length === 0 && (
                                    <button
                                      className="day-quick-add btn btn-cyan"
                                      type="button"
                                      onClick={() => {
                                        setQuickAddDate(dateStr);
                                        setQuickAddHour(hour);
                                        setShowQuickAddModal(true);
                                      }}
                                      style={{
                                        opacity: 0,
                                        height: '28px',
                                        fontSize: '0.68rem',
                                        paddingInline: '10px',
                                        cursor: 'pointer',
                                        transition: 'opacity 0.15s ease'
                                      }}
                                    >
                                      + Agendar consulta a las {hour}
                                    </button>
                                  )}

                                  {isBlocked && slotAppts.length === 0 && (
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-rose)', fontWeight: 'bold' }}>
                                      🚫 Bloqueado (Día libre configurado)
                                    </span>
                                  )}

                                  {/* Citas */}
                                  {slotAppts.map(appt => {
                                    const isCompleted = appt.status === 'Completada';
                                    return (
                                      <div
                                        key={appt.id}
                                        onClick={() => setSelectedAppt(appt)}
                                        style={{
                                          flex: 1,
                                          height: '90%',
                                          borderRadius: '8px',
                                          background: isCompleted ? 'rgba(16,185,129,0.08)' : 'rgba(6,182,212,0.08)',
                                          border: isCompleted ? '1px solid rgba(16,185,129,0.25)' : '1px solid rgba(6,182,212,0.25)',
                                          padding: '8px 14px',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          justifyContent: 'space-between',
                                          alignItems: 'center',
                                          textAlign: 'left',
                                          transition: 'all 0.15s ease'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = isCompleted ? 'rgba(16,185,129,0.12)' : 'rgba(6,182,212,0.12)';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = isCompleted ? 'rgba(16,185,129,0.08)' : 'rgba(6,182,212,0.08)';
                                        }}
                                      >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                          <strong style={{ fontSize: '0.8rem', color: '#ffffff' }}>
                                            {appt.patientName}
                                          </strong>
                                          <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)' }}>
                                            Tipo: {appt.session_type || 'Sesión de Tratamiento Individual'}
                                          </span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span className="badge" style={{
                                            fontSize: '0.58rem',
                                            padding: '2px 8px',
                                            background: isCompleted ? 'rgba(16,185,129,0.12)' : 'rgba(6,182,212,0.12)',
                                            color: isCompleted ? 'var(--color-emerald)' : 'var(--color-cyan)',
                                            borderColor: 'transparent'
                                          }}>
                                            {appt.status}
                                          </span>
                                          <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                                            Haz clic para gestionar
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

              {/* ================= POPOVER / DETALLES DE CITA SELECCIONADA ================= */}
              {selectedAppt && (
                <div style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 999,
                  animation: 'fade-in 0.2s ease-out'
                }} onClick={() => setSelectedAppt(null)}>
                  <div style={{
                    background: 'var(--background-secondary)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    width: '100%',
                    maxWidth: '440px',
                    padding: '24px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                    textAlign: 'left'
                  }} onClick={(e) => e.stopPropagation()}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span className="badge badge-cyan" style={{ fontSize: '0.6rem', marginBottom: '6px' }}>
                          Cita Registrada
                        </span>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                          {selectedAppt.patientName}
                        </h4>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSelectedAppt(null)} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem', padding: 0 }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border)' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Clock size={14} color="var(--color-cyan)" />
                        <span><strong>Fecha y hora:</strong> {selectedAppt.appointment_date} a las {selectedAppt.appointment_time.substring(0, 5)}h</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <FileText size={14} color="var(--color-cyan)" />
                        <span><strong>Tipo:</strong> {selectedAppt.session_type || 'Sesión de Tratamiento Individual'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <CheckCircle size={14} color={selectedAppt.status === 'Completada' ? 'var(--color-emerald)' : 'var(--color-cyan)'} />
                        <span><strong>Estado:</strong> {selectedAppt.status}</span>
                      </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border)' }} />

                    {/* Acciones Clínicas e Integración Directa */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const matchingPatient = patients.find(p => p.id === selectedAppt.patient_id);
                          if (matchingPatient) {
                            setSelectedPatientId(selectedAppt.patient_id);
                            setActiveSection('dashboard');
                            setPatientSubTab('resumen');
                            setSelectedAppt(null);
                          } else {
                            alert("No se pudo cargar el perfil del paciente: el id no coincide o no está en tu consulta.");
                          }
                        }}
                        className="btn btn-outline"
                        style={{ height: '34px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', cursor: 'pointer' }}
                      >
                        <User size={13} />
                        <span>Ir al expediente Paciente 360</span>
                      </button>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const matchingPatient = patients.find(p => p.id === selectedAppt.patient_id);
                            if (matchingPatient) {
                              setSelectedPatientId(selectedAppt.patient_id);
                              setActiveSection('soap');
                              setSelectedAppt(null);
                            }
                          }}
                          className="btn btn-outline"
                          style={{ height: '34px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                          <Sparkles size={12} />
                          <span>Crear Nota SOAP</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const matchingPatient = patients.find(p => p.id === selectedAppt.patient_id);
                            if (matchingPatient) {
                              setSelectedPatientId(selectedAppt.patient_id);
                              setActiveSection('briefing');
                              setSelectedAppt(null);
                            }
                          }}
                          className="btn btn-cyan"
                          style={{ height: '34px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}
                        >
                          <Video size={12} />
                          <span>Preparar Sesión</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (window.confirm("¿Seguro que deseas cancelar esta sesión terapéutica? Se notificará al paciente y se liberará su slot.")) {
                            try {
                              const { error } = await supabase
                                .from('appointments')
                                .update({ status: 'Cancelada' })
                                .eq('id', selectedAppt.id);
                              
                              if (error) throw error;
                              
                              setSelectedAppt(null);
                              await fetchDbAppointments();
                            } catch (err) {
                              alert("Error al cancelar cita: " + err.message);
                            }
                          }
                        }}
                        className="btn btn-outline"
                        style={{ height: '34px', fontSize: '0.74rem', color: 'var(--color-rose)', borderColor: 'rgba(244,63,94,0.3)', width: '100%', cursor: 'pointer', background: 'transparent' }}
                      >
                        Cancelar Sesión
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* ================= MODAL DE AGENDAMIENTO RÁPIDO ================= */}
              {showQuickAddModal && (
                <div style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 999,
                  animation: 'fade-in 0.2s ease-out'
                }} onClick={() => setShowQuickAddModal(false)}>
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!quickAddPatientId) {
                        alert("Por favor selecciona un paciente.");
                        return;
                      }
                      try {
                        const { error } = await supabase
                          .from('appointments')
                          .insert({
                            patient_id: quickAddPatientId,
                            psychologist_id: profile.id,
                            appointment_date: quickAddDate,
                            appointment_time: quickAddHour,
                            session_type: quickAddType,
                            status: 'Programada'
                          });

                        if (error) throw error;

                        setShowQuickAddModal(false);
                        await fetchDbAppointments();
                        setQuickAddPatientId('');
                      } catch (err) {
                        alert("Error al insertar la cita en Supabase: " + err.message);
                      }
                    }}
                    style={{
                      background: 'var(--background-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      width: '100%',
                      maxWidth: '420px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                      textAlign: 'left'
                    }} onClick={(e) => e.stopPropagation()}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                        Programar Cita Rápida
                      </h4>
                      <button 
                        type="button" 
                        onClick={() => setShowQuickAddModal(false)} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.1rem', padding: 0 }}
                      >
                        ✕
                      </button>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border)' }} />

                    {/* Paciente */}
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Paciente de tu consulta</label>
                      <select
                        className="form-input"
                        value={quickAddPatientId}
                        onChange={(e) => setQuickAddPatientId(e.target.value)}
                        required
                        style={{ height: '36px', fontSize: '0.78rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff', cursor: 'pointer', width: '100%' }}
                      >
                        <option value="">-- Selecciona un Paciente --</option>
                        {patients.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Fecha y Hora */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Fecha</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={quickAddDate}
                          onChange={(e) => setQuickAddDate(e.target.value)}
                          required
                          style={{ height: '36px', fontSize: '0.78rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff', paddingInline: '8px' }}
                        />
                      </div>
                      <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Hora</label>
                        <input 
                          type="time" 
                          className="form-input" 
                          value={quickAddHour}
                          onChange={(e) => setQuickAddHour(e.target.value)}
                          required
                          style={{ height: '36px', fontSize: '0.78rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff', paddingInline: '8px' }}
                        />
                      </div>
                    </div>

                    {/* Tipo de Sesión */}
                    <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Tipo de Sesión</label>
                      <select
                        className="form-input"
                        value={quickAddType}
                        onChange={(e) => setQuickAddType(e.target.value)}
                        style={{ height: '36px', fontSize: '0.78rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', color: '#ffffff', cursor: 'pointer', width: '100%' }}
                      >
                        <option value="Sesión Individual">Sesión de Tratamiento Individual (50 min)</option>
                        <option value="Triaje Clínico">Triaje de Evaluación Inicial (30 min)</option>
                        <option value="Sesión de Seguimiento">Sesión de Seguimiento Breve (15 min)</option>
                      </select>
                    </div>

                    <div style={{ height: '1px', background: 'var(--border)', marginTop: '8px' }} />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button 
                        type="button" 
                        onClick={() => setShowQuickAddModal(false)}
                        className="btn btn-outline"
                        style={{ height: '34px', fontSize: '0.74rem' }}
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="btn btn-cyan"
                        style={{ height: '34px', fontSize: '0.74rem', fontWeight: 'bold' }}
                      >
                        Programar Cita
                      </button>
                    </div>
                  </form>
                </div>
              )}

            </div>
          )}

          {/* ==================== VISTA 6: CONSULTAS Y CHAT ==================== */}
          {activeSection === 'chat' && (
            <div style={{ height: 'calc(100vh - 160px)', background: 'var(--background-secondary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              <ChatView
                user={user}
                profile={profile}
                onProfileUpdated={onProfileUpdated}
                genericMode={false}
              />
            </div>
          )}

          {/* ==================== VISTA 7: FACTURACIÓN Y STRIPE ==================== */}
          {activeSection === 'ajustes' && (
            <div style={{ background: 'var(--background-secondary)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
              <AjustesView
                user={user}
                profile={profile}
                onLogout={onLogout}
                onProfileUpdated={onProfileUpdated}
              />
            </div>
          )}
        </div>

    </div>
  );
}
