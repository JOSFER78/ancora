import { useState, useEffect, useRef } from 'react';
import { firebaseClient as db, firebaseClient } from '../../firebaseAdapter.js';
import { invokeChatTerapeuta } from '../../lib/chatTerapeuta';
import { askClinicalAI } from '../../services/aiService.js';
import { buildPatientSnapshot, processConversationTurn, uploadClinicalDocument } from '../../lib/clinicalEngine';
import PlanConsumptionWidget from '../../components/PlanConsumptionWidget';
import { 
  Send, Mic, MicOff, AlertTriangle, Bot, User, 
  Sparkles, Clock, RefreshCw, Volume2, ShieldAlert, Upload, MessageCircle,
  Plus, Trash2, Edit3, Folder, Download, Menu, ArrowLeft, Square, X,
  Maximize2, Minimize2, Calendar, CheckCircle, MoreVertical
} from 'lucide-react';
import { 
  getAgendaTopicsSync, 
  saveAgendaTopicsSync, 
  getCleanPsychologistName 
} from '../../services/clinicalSyncService.js';

export default function PacienteChatView({ 
  profile, 
  user, 
  onProfileUpdated, 
  sidebarCollapsed = false, 
  setSidebarCollapsed, 
  bottomMenuHidden = false, 
  setBottomMenuHidden,
  bottomMenuCollapsed = false,
  setBottomMenuCollapsed,
  onNavigate
}) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [showHeaderDropdown, setShowHeaderDropdown] = useState(false);

  // Variables de suscripción y tiempo (sincronización de calendario y semana terapéutica)
  const todayIndex = (new Date().getDay() + 6) % 7; // 0=Lunes, ..., 6=Domingo
  const isPremium = !!profile?.contexto_terapeutico?.assigned_psychologist_id;
  const startOfWeekDay = profile?.contexto_terapeutico?.start_of_week || 
                          localStorage.getItem(`patient_start_of_week_${user?.id}`) || 
                          'Lunes';
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [transcribingAudio, setTranscribingAudio] = useState(false);
  const [voiceConversationMode, setVoiceConversationMode] = useState(false);
  const [uploadingChatDoc, setUploadingChatDoc] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const voiceModeRef = useRef(false);

  const [agentStatus, setAgentStatus] = useState('online'); // 'online' | 'typing' | 'updating'
  const [minutesUsed, setMinutesUsed] = useState(4); // 4 de 15 min usados
  const [showCrisisPlan, setShowCrisisPlan] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para control de límites de IA
  const [creditsExceeded, setCreditsExceeded] = useState(false);
  const [liveCreditsExceeded, setLiveCreditsExceeded] = useState(false);
  const [refreshCreditsFlag, setRefreshCreditsFlag] = useState(0);
  const [lastTokensUsed, setLastTokensUsed] = useState(null);
  const [lastActionType, setLastActionType] = useState(null); // 'text' | 'transcribe' | 'document' | null
  
  // Nuevos estados para control premium y UI
  const [showSidebar, setShowSidebar] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(null); // id de la conversación que se está renombrando en el sidebar
  const [isEditingHeaderTitle, setIsEditingHeaderTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isSynthesizingSession, setIsSynthesizingSession] = useState(false);
  const [synthesisSuccessModal, setSynthesisSuccessModal] = useState(null);
  const [failedMessageText, setFailedMessageText] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'history'
  const [folders, setFolders] = useState(() => {
    const saved = localStorage.getItem(`chat_conv_folders_${user?.id}`);
    return saved ? JSON.parse(saved) : {};
  });

  const [selectedTopicFilter, setSelectedTopicFilter] = useState('all');

  const [selectedCalendarDay, setSelectedCalendarDay] = useState((new Date().getDay() + 6) % 7);
  const [newAgendaTopic, setNewAgendaTopic] = useState('');
  const [showPendingTopicsSection, setShowPendingTopicsSection] = useState(true);
  const [assignedPsycho, setAssignedPsycho] = useState(null);
  const userId = user?.id || profile?.id || 'guest';
  
  // Lista de temas reales sincronizados entre Chat y Plan Clínico
  const [agendaTopics, setAgendaTopics] = useState(() => getAgendaTopicsSync(userId));

  useEffect(() => {
    const handleAgendaSync = (e) => {
      if (e.detail) setAgendaTopics(e.detail);
    };
    window.addEventListener('ancora_agenda_updated', handleAgendaSync);
    return () => window.removeEventListener('ancora_agenda_updated', handleAgendaSync);
  }, []);

  // Cargar perfil real del psicólogo asignado desde Firestore
  useEffect(() => {
    const loadAssignedPsychologist = async () => {
      const psychoId = profile?.contexto_terapeutico?.assigned_psychologist_id || user?.assigned_psychologist_id;
      if (!psychoId) return;
      try {
        const { data, error } = await firebaseClient
          .from('psychologist_profiles')
          .select('*')
          .eq('id', psychoId)
          .maybeSingle();

        if (!error && data) {
          setAssignedPsycho(data);
        }
      } catch (err) {
        console.warn("Notice loading psychologist profile:", err.message);
      }
    };

    loadAssignedPsychologist();
  }, [profile, user]);

  const handleAddAgendaTopic = (text) => {
    if (!text || !text.trim()) return;
    const newTopic = {
      id: `top-${Date.now()}`,
      text: text.trim(),
      done: false,
      source: 'chat',
      date: 'Hoy'
    };
    const updated = [newTopic, ...agendaTopics];
    setAgendaTopics(updated);
    saveAgendaTopicsSync(userId, updated);
    setNewAgendaTopic('');
  };

  const handleToggleAgendaTopic = (id) => {
    const updated = agendaTopics.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setAgendaTopics(updated);
    saveAgendaTopicsSync(userId, updated);
  };

  const handleDeleteAgendaTopic = (id) => {
    const updated = agendaTopics.filter(t => t.id !== id);
    setAgendaTopics(updated);
    saveAgendaTopicsSync(userId, updated);
  };

  // Cuenta atrás determinista
  const getCountdownStr = (dateStr, timeStr) => {
    if (!dateStr) return '';
    const target = new Date(`${dateStr}T${timeStr || '11:00'}:00`);
    const now = new Date();
    const diffMs = target - now;
    if (diffMs < 0) return 'Concluida';
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 0) {
      return diffHours <= 1 ? 'Hoy en breve' : `Hoy (${diffHours}h)`;
    }
    if (diffDays === 1) return 'Falta 1 día';
    return `Faltan ${diffDays} días`;
  };

  // Renderizador de tarjeta de cita con modalidad, duración y psicólogo real (Cero Mocks)
  const renderEnrichedAppointmentCard = (appt, isHero = false) => {
    if (!appt) return null;
    const isRevision = appt.session_type === 'revision' || appt.appointment_type === 'revision15' || appt.duration === 15;
    const isPresencial = appt.modality === 'presencial' || (appt.location && appt.location.toLowerCase().includes('consulta'));
    const modalityIcon = isPresencial ? '🏥' : '💻';
    const modalityLabel = isPresencial ? 'Presencial en Consulta' : 'Videollamada en Directo';
    const durationLabel = isRevision ? 'Revisión Asíncrona (15 min)' : (appt.duration ? `Consulta (${appt.duration} min)` : 'Consulta Individual (50 min)');
    const dateFormatted = new Date(appt.appointment_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    const timeFormatted = appt.appointment_time || '11:00';
    const countdown = getCountdownStr(appt.appointment_date, appt.appointment_time);
    
    // Obtener nombre exclusivamente de fuentes reales y limpiar alias como USAJOS
    const psychoName = getCleanPsychologistName(
      appt.psychologist_id,
      appt.psychologist_name || assignedPsycho?.name || profile?.contexto_terapeutico?.assigned_psychologist_name,
      assignedPsycho ? [assignedPsycho] : []
    );

    return (
      <div 
        key={appt.id || appt.appointment_date}
        style={{
          margin: isHero ? '6px 14px 10px 14px' : '0 0 10px 0',
          padding: '10px 12px',
          borderRadius: '10px',
          background: 'rgba(10, 22, 30, 0.75)',
          border: '1px solid rgba(6, 182, 212, 0.28)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ 
            fontSize: '0.65rem', 
            fontWeight: 800, 
            color: 'var(--color-cyan)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.03em'
          }}>
            <span>{modalityIcon}</span>
            <span>{durationLabel}</span>
          </span>
          {countdown && (
            <span className="badge badge-cyan" style={{ fontSize: '0.55rem', padding: '1px 6px', fontWeight: 700 }}>
              {countdown}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '2px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff' }}>
            {dateFormatted} • {timeFormatted}h
          </span>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>
            {modalityLabel}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🩺</span> {psychoName}
          </span>
          {!isPresencial && (
            <span style={{ color: 'var(--color-cyan)', fontWeight: 600, fontSize: '0.58rem' }}>
              Enlace de videollamada listo
            </span>
          )}
        </div>
      </div>
    );
  };

  const groupConversationsByDate = (convList) => {
    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayDateStr = yesterday.toISOString().split('T')[0];

    const dayGroups = {};

    (convList || []).forEach(conv => {
      const convDate = conv.created_at ? new Date(conv.created_at) : now;
      const convDateStr = convDate.toISOString().split('T')[0];

      let dayLabel = convDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
      if (convDateStr === todayDateStr) {
        dayLabel = 'Hoy';
      } else if (convDateStr === yesterdayDateStr) {
        dayLabel = 'Ayer';
      } else {
        dayLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
      }

      if (!dayGroups[dayLabel]) {
        dayGroups[dayLabel] = [];
      }
      dayGroups[dayLabel].push(conv);
    });

    return dayGroups;
  };

  const handleCreateFolder = (folderName) => {
    if (!folderName.trim()) return;
    const name = folderName.trim();
    if (topicFolders.includes(name)) return;
    const updated = [...topicFolders, name];
    setTopicFolders(updated);
    localStorage.setItem(`chat_folders_${user?.id}`, JSON.stringify(updated));
  };

  const handleMoveConversationToFolder = (convId, folderName) => {
    const updatedMap = { ...convFolderMap, [convId]: folderName };
    setConvFolderMap(updatedMap);
    localStorage.setItem(`chat_conv_folders_${user?.id}`, JSON.stringify(updatedMap));
  };
  
  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isSendingRef = useRef(false);
  const voiceSessionStartTimeRef = useRef(null);

  // Cargar citas reales y virtuales
  const loadAppointments = async () => {
    if (!user?.id) return;
    try {
      const { data: dbAppts, error: apptErr } = await firebaseClient
        .from('appointments')
        .select('*')
        .eq('patient_id', user.id);

      if (apptErr) throw apptErr;

      const localApptsStr = localStorage.getItem('virtual_appointments') || '[]';
      const localAppts = JSON.parse(localApptsStr);

      const combined = [...(dbAppts || []), ...localAppts];
      setAppointments(combined);
    } catch (err) {
      console.warn("No se pudieron cargar citas de base de datos, usando localStorage:", err.message);
      const localApptsStr = localStorage.getItem('virtual_appointments') || '[]';
      const localAppts = JSON.parse(localApptsStr);
      setAppointments(localAppts);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadAppointments();
    }
  }, [user?.id]);

  // Agrupar conversaciones por Ciclos Clínicos reales delimitados por las citas con el psicólogo
  const getGroupedConversations = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const validAppts = (appointments || [])
      .filter(a => a.appointment_date && a.status !== 'cancelled' && a.status !== 'Cancelada')
      .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

    // Identificar citas pasadas (concluidas) y citas futuras (pendientes)
    const pastAppts = validAppts.filter(a => a.appointment_date < todayStr || a.status === 'completed');
    const upcomingAppts = validAppts.filter(a => a.appointment_date >= todayStr && a.status !== 'completed');

    const nextUpcomingAppt = upcomingAppts[0] || null;
    const lastPastAppt = pastAppts[pastAppts.length - 1] || null;

    // Fecha límite inferior del ciclo activo (fecha de la última cita concluida)
    const activeCycleStartDate = lastPastAppt ? new Date(lastPastAppt.appointment_date) : null;
    if (activeCycleStartDate) {
      activeCycleStartDate.setHours(23, 59, 59, 999);
    }

    // Título del Ciclo Activo
    let activeCycleName = '📍 Sesiones Pendientes de Revisión';
    if (nextUpcomingAppt) {
      const apptType = nextUpcomingAppt.session_type === 'revision' ? 'Revisión' : 'Consulta';
      const formattedDate = new Date(nextUpcomingAppt.appointment_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      activeCycleName = `📍 Hacia ${apptType} del ${formattedDate}`;
    }

    const groups = {};
    groups[activeCycleName] = [];

    // Definir contenedores para ciclos pasados basados en citas anteriores
    if (pastAppts.length > 0) {
      pastAppts.slice().reverse().forEach((pAppt) => {
        const apptType = pAppt.session_type === 'revision' ? 'Revisión' : 'Consulta';
        const pDate = new Date(pAppt.appointment_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        const cycleTitle = `📁 Ciclo ${pDate} • ${apptType} Finalizada`;
        groups[cycleTitle] = [];
      });
    }

    const generalHistoricalName = '📁 Histórico Anterior';
    groups[generalHistoricalName] = [];

    // Distribuir cada conversación estrictamente por su fecha de creación vs las fechas de las citas
    conversations.forEach(conv => {
      const convDate = conv.created_at ? new Date(conv.created_at) : now;
      
      // Si fue creada DESPUÉS de la última cita concluida, pertenece al ciclo activo
      if (!activeCycleStartDate || convDate > activeCycleStartDate) {
        groups[activeCycleName].push(conv);
        return;
      }

      // Si pertenece a un ciclo pasado delimitado por citas
      let placed = false;
      for (let i = 0; i < pastAppts.length; i++) {
        const currentPastAppt = pastAppts[i];
        const prevPastAppt = i > 0 ? pastAppts[i - 1] : null;

        const endDate = new Date(currentPastAppt.appointment_date);
        endDate.setHours(23, 59, 59, 999);

        const startDate = prevPastAppt ? new Date(prevPastAppt.appointment_date) : new Date(0);

        if (convDate > startDate && convDate <= endDate) {
          const apptType = currentPastAppt.session_type === 'revision' ? 'Revisión' : 'Consulta';
          const pDate = new Date(currentPastAppt.appointment_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
          const cycleTitle = `📁 Ciclo ${pDate} • ${apptType} Finalizada`;
          if (groups[cycleTitle]) {
            groups[cycleTitle].push(conv);
            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        groups[generalHistoricalName].push(conv);
      }
    });

    // Retornar grupos estructurados (el activo siempre visible)
    return Object.keys(groups).reduce((acc, key) => {
      if (groups[key].length > 0 || key === activeCycleName) {
        acc[key] = groups[key];
      }
      return acc;
    }, {});
  };

  // Obtener etiqueta determinista real de Sesión o Revisión (Cero Mocks)
  const getConversationIndicator = (conv) => {
    if (!conv.created_at) return null;
    const convDateStr = new Date(conv.created_at).toISOString().split('T')[0];

    // Buscar si hay cita real en esa fecha en Firestore
    const matchedAppt = appointments.find(appt => {
      if (!appt.appointment_date) return false;
      const apptDateStr = new Date(appt.appointment_date).toISOString().split('T')[0];
      return apptDateStr === convDateStr && appt.status !== 'cancelled' && appt.status !== 'Cancelada';
    });

    if (matchedAppt) {
      const isRevision = matchedAppt.session_type === 'revision';
      return { 
        type: isRevision ? 'revision' : 'session', 
        label: isRevision ? 'Revisión 📋' : 'Consulta 🩺', 
        color: isRevision ? 'var(--color-emerald)' : 'var(--color-cyan)', 
        bgColor: isRevision ? 'rgba(127,159,136,0.1)' : 'rgba(68,125,130,0.1)' 
      };
    }

    if (conv.status === 'completed' || conv.status === 'archived') {
      return { type: 'completed', label: 'Sintetizada ✓', color: 'var(--color-emerald)', bgColor: 'rgba(16,185,129,0.1)' };
    }

    return null;
  };

  const getRoadmapGuideMessage = (todayIdx, completedReviews, isPremium, startOfWeekDay) => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const todayName = days[todayIdx];
    return `Hoy es ${todayName}. Tus reflexiones diarias en el chat se estructuran automáticamente para la revisión de tu psicólogo colegiado.`;
  };

  const getWeekRangeStr = (groupName) => {
    if (groupName.includes('Ciclo Activo') || groupName.includes('Hacia')) {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff));
      const sunday = new Date(now.setDate(diff + 6));
      const options = { day: 'numeric', month: 'short' };
      return `(${monday.toLocaleDateString('es-ES', options)} - ${sunday.toLocaleDateString('es-ES', options)})`;
    }
    return '';
  };

  const renderConversationCard = (conv) => {
    const isCurrent = activeConversationId === conv.id;
    const formattedTime = conv.created_at ? new Date(conv.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '10:35';
    const indicator = getConversationIndicator(conv);

    if (isEditingTitle === conv.id) {
      return (
        <div key={conv.id} style={{ padding: '6px 8px', background: 'rgba(6,182,212,0.1)', border: '1px solid var(--color-cyan)', borderRadius: '6px' }}>
          <input
            type="text"
            className="chat-title-input"
            style={{ fontSize: '0.72rem', width: '100%', height: '24px', background: 'var(--background-secondary)', color: '#ffffff', border: 'none', outline: 'none', padding: '0 4px' }}
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameConversation(conv.id, tempTitle);
                setIsEditingTitle(null);
              } else if (e.key === 'Escape') {
                setIsEditingTitle(null);
              }
            }}
            onBlur={() => {
              handleRenameConversation(conv.id, tempTitle);
              setIsEditingTitle(null);
            }}
            autoFocus
          />
        </div>
      );
    }

    return (
      <div 
        key={conv.id} 
        onClick={() => {
          setActiveConversationId(conv.id);
          setShowSidebar(false);
        }}
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '3px', 
          padding: '8px 10px',
          borderRadius: '8px',
          background: isCurrent ? 'rgba(6,182,212,0.12)' : 'rgba(255,255,255,0.02)',
          border: '1px solid',
          borderColor: isCurrent ? 'var(--color-cyan)' : 'rgba(255,255,255,0.06)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)'
        }}
        onMouseOver={(e) => {
          if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
        }}
        onMouseOut={(e) => {
          if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
        }}
      >
        {/* Título de la Sesión + Acciones Rápidas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
          <span style={{ 
            fontSize: '0.74rem', 
            fontWeight: isCurrent ? 700 : 500, 
            color: isCurrent ? '#ffffff' : 'var(--text-secondary)',
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            {conv.title || 'Sesión sin título'}
          </span>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsEditingTitle(conv.id); setTempTitle(conv.title); }} 
              className="sidebar-item-action-btn"
              title="Renombrar sesión"
              style={{ padding: '2px', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
            >
              <Edit3 size={11} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }} 
              className="sidebar-item-action-btn delete"
              title="Eliminar sesión"
              style={{ padding: '2px', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>

        {/* Subtítulo: Hora y Estado */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
          <span>{formattedTime}</span>
          {conv.summary ? (
            <span style={{ color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
              <Sparkles size={9} /> Sintetizado
            </span>
          ) : (
            <span style={{ color: 'var(--color-emerald)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
              🟢 Activa
            </span>
          )}
          {indicator && (
            <span className="badge" style={{ 
              fontSize: '0.5rem', 
              padding: '0 4px', 
              color: indicator.color, 
              backgroundColor: indicator.bgColor,
              border: `1px solid ${indicator.color}33`,
              borderRadius: '4px',
              fontWeight: '600'
            }}>
              {indicator.label}
            </span>
          )}
        </div>
      </div>
    );
  };

  useEffect(() => {
    voiceModeRef.current = voiceConversationMode;
  }, [voiceConversationMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentStatus]);

  // Cargar/crear conversación activa en Áncora
  const loadConversations = async () => {
    const userId = user?.id || profile?.id;
    if (!userId) return;
    try {
      const { data, error: fetchErr } = await firebaseClient
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (fetchErr) {
        console.warn("Notice loading conversations:", fetchErr.message);
      }

      const activeConvs = (data || []).filter(c => c.status !== 'archived');

      if (activeConvs.length > 0) {
        setConversations(activeConvs);
        setActiveConversationId(activeConvs[0].id);
        setError(null);
      } else {
        // Crear una nueva conversación si no existe
        const newDocId = 'conv_' + Math.random().toString(36).substring(2, 10);
        await firebaseClient
          .from('conversations')
          .insert([{ 
            id: newDocId,
            user_id: userId, 
            title: 'Sesión de Apoyo Diario con Áncora ⚓', 
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        const newConv = {
          id: newDocId,
          user_id: userId,
          title: 'Sesión de Apoyo Diario con Áncora ⚓',
          status: 'active'
        };
        setConversations([newConv]);
        setActiveConversationId(newDocId);
        setError(null);
      }
    } catch (err) {
      console.warn("Fallback initializing conversation session:", err.message);
      const fallbackId = 'conv_local_' + (userId || 'user');
      setConversations([{ id: fallbackId, title: 'Sesión de Chat Áncora', status: 'active' }]);
      setActiveConversationId(fallbackId);
      setError(null);
    }
  };

  // Cargar mensajes de la conversación activa
  const loadMessages = async (convId) => {
    if (!convId) return;
    try {
      const { data, error: msgErr } = await firebaseClient
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (msgErr) throw msgErr;

      // Adaptar formato a la UI
      const formatted = (data || []).map(m => {
        const contentStr = String(m.content || '');
        const usageMatch = contentStr.match(/\[usage:(.*?)\|(.*?)\|(.*?)\]/);
        let usageDetails = null;
        if (usageMatch) {
          const inStr = usageMatch[1];
          const outStr = usageMatch[2];
          const cacheStr = usageMatch[3];
          
          const parseTokenVal = (str) => {
            if (str.endsWith('k')) {
              return parseFloat(str.slice(0, -1)) * 1000;
            }
            return parseFloat(str) || 0;
          };
          
          const inTokens = parseTokenVal(inStr);
          const outTokens = parseTokenVal(outStr);
          const cachePercentVal = cacheStr.replace('%', '');
          
          const totalTokens = inTokens + outTokens;
          const costCredits = totalTokens / 100;
          
          const formatTokens = (num) => {
            if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
            return String(num);
          };
          
          usageDetails = {
            in: inStr.includes('k') ? inStr : formatTokens(inTokens),
            out: outStr.includes('k') ? outStr : formatTokens(outTokens),
            cache: cacheStr.includes('%') ? cacheStr : `${cachePercentVal}%`,
            credits: costCredits.toLocaleString('es-ES', { maximumFractionDigits: 1 }) + ' CR'
          };
        }

        return {
          id: m.id,
          sender: m.role === 'user' ? 'user' : 'bot',
          text: contentStr
            .replace(/\[model:.*?\]/g, '')
            .replace(/\[usage:.*?\]/g, '')
            .trim(),
          time: new Date(m.created_at).toLocaleTimeString().substring(0, 5),
          usageDetails
        };
      });

      // Si no hay mensajes, inyectar el saludo inicial
      if (formatted.length === 0) {
        setMessages([
          {
            id: 'init-1',
            sender: 'bot',
            text: '⚠️ Nota ética: IA Áncora es una IA de apoyo emocional y preparación de sesiones. No emite diagnósticos clínicos, no prescribe tratamientos médicos ni sustituye en ningún caso a tu psicóloga colegiada.\n\nHola, soy tu acompañante de diario guiado. Estoy aquí para escucharte y ayudarte a estructurar lo que te preocupa para tu próxima sesión.',
            time: new Date().toLocaleTimeString().substring(0, 5)
          }
        ]);
      } else {
        setMessages(formatted);
      }
    } catch (err) {
      console.error("Error loading messages:", err.message);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (voiceSessionStartTimeRef.current) {
        const elapsed = Math.round((Date.now() - voiceSessionStartTimeRef.current) / 1000);
        voiceSessionStartTimeRef.current = null;
        if (elapsed > 0) {
          invokeChatTerapeuta({
            action: 'live_session_close',
            durationSeconds: elapsed
          }).catch(err => console.error("Error al cobrar llamada de voz al desmontar:", err));
        }
      }
    };
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  const checkCredits = async () => {
    if (!profile?.id) return;
    try {
      const { data, error: fetchErr } = await firebaseClient
        .from('patient_credits')
        .select('*')
        .eq('patient_id', profile.id)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      if (data) {
        const textLimit = data.text_credits_total || 450000;
        const textUsed = data.text_credits_used || 0;
        const isExceeded = textUsed >= textLimit;
        setCreditsExceeded(isExceeded);

        const liveLimit = data.live_credits_total || 14400;
        const liveUsed = data.live_credits_used || 0;
        setLiveCreditsExceeded(liveUsed >= liveLimit);
      }
    } catch (err) {
      console.error('Error al comprobar créditos:', err.message);
    }
  };

  useEffect(() => {
    checkCredits();
  }, [profile?.id, refreshCreditsFlag]);

  // Enviar mensaje real a Áncora & Edge Function
  const handleSend = async (textToSend) => {
    if (!textToSend.trim() || isSendingRef.current || !activeConversationId) return;

    isSendingRef.current = true;
    setError(null);
    setInputVal('');

    // Añadir mensaje a UI
    const tempUserMsg = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString().substring(0, 5)
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setAgentStatus('typing');

    try {
      // 1. Guardar mensaje de usuario en base de datos
      const { data: savedUserMsg, error: saveUserErr } = await firebaseClient
        .from('messages')
        .insert([{
          conversation_id: activeConversationId,
          role: 'user',
          content: textToSend
        }])
        .select()
        .single();

      if (saveUserErr) throw saveUserErr;

      // 2. Cargar historial completo de la conversación
      const { data: dbHistory, error: historyErr } = await firebaseClient
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });

      if (historyErr) throw historyErr;

      // 3. Invocar la Edge Function de chat-terapeuta
      setAgentStatus('updating');
      
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const currentActiveConv = conversations.find(c => c.id === activeConversationId);
      const assignedFolder = convFolderMap[activeConversationId] || 'General';

      const resData = await invokeChatTerapeuta({
        patientId: user?.id || profile?.id,
        patientProfile: profile,
        conversationId: activeConversationId,
        conversationTitle: currentActiveConv?.title || null,
        topicFolder: assignedFolder,
        recentCycleSummaries: conversations
          .filter(c => c.id !== activeConversationId && c.summary)
          .slice(0, 3)
          .map(c => ({ title: c.title, summary: c.summary })),
        messages: dbHistory || [],
        model: 'auto'
      }, controller.signal);

      if (resData && resData.reply) {
        setFailedMessageText('');
        // Recargar mensajes de la base de datos para sincronizar
        await loadMessages(activeConversationId);

        // Auto-titulación inteligente estilo ChatGPT en background si el título es genérico
        const isGenericTitle = !currentActiveConv?.title || 
          /^(diario|entrada sin t[ií]tulo|sesi[oó]n|nuevo chat|chat)/i.test(currentActiveConv.title.trim());

        if (isGenericTitle && textToSend.length > 4) {
          askClinicalAI({
            messages: [
              {
                role: 'system',
                content: 'Genera un título clínico ultra-conciso (3 a 5 palabras, en español, sin comillas ni puntos finales) que resuma el tema central de este mensaje del paciente para el expediente.'
              },
              {
                role: 'user',
                content: textToSend
              }
            ],
            model: 'gemini-3.5-flash-lite',
            temperature: 0.3
          }).then(aiTitle => {
            const cleanTitle = String(aiTitle || '').trim().replace(/^["']|["']$/g, '');
            if (cleanTitle && cleanTitle.length > 3 && cleanTitle.length < 60) {
              handleRenameConversation(activeConversationId, cleanTitle);
            }
          }).catch(titleErr => console.warn('Auto-titulación silenciosa omitida:', titleErr));
        }

        if (resData.tokensUsed) {
          setLastTokensUsed(resData.tokensUsed);
          setLastActionType('text');
        }

        // Actualizar contexto y perfil en caliente si es necesario
        if (resData.updatedContext && onProfileUpdated) {
          onProfileUpdated({
            ...profile,
            contexto_terapeutico: resData.updatedContext
          });
        }
        processConversationTurn(activeConversationId, savedUserMsg?.id)
          .then(() => buildPatientSnapshot(user.id))
          .catch((memoryErr) => console.warn('No se pudo actualizar memoria conversacional:', memoryErr));
      } else {
        throw new Error(resData?.error || "Respuesta vacía del servidor.");
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        console.log("Generación detenida.");
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'bot',
          text: "Generación de respuesta detenida por el usuario.",
          time: new Date().toLocaleTimeString().substring(0, 5)
        }]);
      } else {
        console.error("Error sending message to IA Áncora:", err.message);
        setError("Error al conectar con IA Áncora: " + err.message);
        setFailedMessageText(textToSend); // Guardar para reintento
        
        // Mostrar mensaje de error en UI
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'bot',
          text: "Lo siento, he tenido dificultades para sincronizar tu mensaje. Por favor, asegúrate de que tu conexión a internet sea estable.",
          time: new Date().toLocaleTimeString().substring(0, 5)
        }]);
      }
    } finally {
      setAgentStatus('online');
      isSendingRef.current = false;
      abortControllerRef.current = null;
      setMinutesUsed(m => Math.min(15, m + 1));
      setRefreshCreditsFlag(prev => prev + 1);
      if (voiceModeRef.current && !isRecording && !transcribingAudio) {
        setTimeout(() => {
          if (voiceModeRef.current && !isSendingRef.current) startAudioRecording();
        }, 700);
      }
    }
  };

  // Detener la generación
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setAgentStatus('online');
      isSendingRef.current = false;
    }
  };

  // Reintentar el envío del último mensaje que falló
  const handleRetrySend = async () => {
    if (!failedMessageText) return;
    const textToRetry = failedMessageText;
    setFailedMessageText('');
    
    // Limpiar mensaje de error autogenerado
    setMessages(prev => prev.filter(m => !m.text.includes("dificultades para sincronizar")));
    await handleSend(textToRetry);
  };

  // Renombrar conversación en la BD
  const handleRenameConversation = async (convId, newTitle) => {
    if (!newTitle.trim()) return;
    try {
      const { error: renameErr } = await firebaseClient
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', convId);

      if (renameErr) throw renameErr;
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, title: newTitle } : c));
    } catch (err) {
      console.error("Error renombrando conversación:", err.message);
      setError("No se pudo renombrar la conversación: " + err.message);
    }
  };

  const handleRenameHeader = async (newTitle) => {
    if (!newTitle.trim() || !activeConversationId) {
      setIsEditingHeaderTitle(false);
      return;
    }
    await handleRenameConversation(activeConversationId, newTitle);
    setIsEditingHeaderTitle(false);
  };

  // Eliminar conversación (archivar)
  const handleDeleteConversation = async (convId) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta conversación?")) return;
    try {
      const { error: deleteErr } = await firebaseClient
        .from('conversations')
        .update({ status: 'archived' })
        .eq('id', convId);

      if (deleteErr) throw deleteErr;

      setConversations(prev => prev.filter(c => c.id !== convId));
      if (activeConversationId === convId) {
        const remaining = conversations.filter(c => c.id !== convId);
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
        } else {
          loadConversations();
        }
      }
    } catch (err) {
      console.error("Error eliminando conversación:", err.message);
      setError("No se pudo eliminar la conversación: " + err.message);
    }
  };

  // Crear una nueva conversación
  const handleCreateNewConversation = async () => {
    try {
      const { data: newConv, error: createErr } = await firebaseClient
        .from('conversations')
        .insert([{ 
          user_id: user.id, 
          title: `Diario ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`, 
          status: 'active' 
        }])
        .select()
        .single();

      if (createErr) throw createErr;
      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
    } catch (err) {
      console.error("Error al crear conversación:", err.message);
      setError("No se pudo crear la conversación: " + err.message);
    }
  };

  // Cerrar y sintetizar sesión para evitar desbordamiento de contexto y alimentar al psicólogo
  const handleSynthesizeAndStartNewSession = async () => {
    const userId = user?.id || profile?.id;
    if (!userId || isSynthesizingSession || messages.length <= 1) return;

    setIsSynthesizingSession(true);
    setError(null);

    try {
      // 1. Transcripción de la sesión actual
      const transcript = messages
        .filter(m => m.text && !m.text.includes('⚠️ Nota ética'))
        .map(m => `${m.sender === 'user' ? 'Paciente' : 'IA'}: ${m.text}`)
        .join('\n\n');

      // 2. Invocar IA para síntesis estructurada clínica
      const prompt = `Eres un psicólogo clínico asistente en Áncora. Sintetiza esta conversación diaria del paciente para su expediente y para la revisión de su psicólogo colegiado.
      
CONVERSACIÓN A SINTETIZAR:
${transcript}

Genera un informe clínico breve (3-4 líneas) estructurado en:
- Resumen vivencial y desahogo
- Focos emocionales detectados
- Datos de contexto o avances relevantes
Sé empático, riguroso y conciso.`;

      const aiSynthesis = await askClinicalAI({
        messages: [
          { role: 'system', content: 'Eres un asistente clínico experto en síntesis y formulación terapéutica.' },
          { role: 'user', content: prompt }
        ],
        model: 'auto',
        temperature: 0.3
      });

      const cleanSummary = String(aiSynthesis || '')
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .trim();

      // 3. Marcar conversación actual como completada en Firestore
      await firebaseClient
        .from('conversations')
        .update({
          status: 'completed',
          summary: cleanSummary,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', activeConversationId);

      // 4. Crear nueva sesión activa limpia
      const newDocId = 'conv_' + Math.random().toString(36).substring(2, 10);
      const newTitle = `Sesión ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;

      await firebaseClient
        .from('conversations')
        .insert([{
          id: newDocId,
          user_id: userId,
          title: newTitle,
          status: 'active',
          previous_summary: cleanSummary,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }]);

      const newConv = {
        id: newDocId,
        user_id: userId,
        title: newTitle,
        status: 'active',
        previous_summary: cleanSummary
      };

      setConversations(prev => [
        newConv,
        ...prev.map(c => c.id === activeConversationId ? { ...c, status: 'completed', summary: cleanSummary } : c)
      ]);

      setActiveConversationId(newDocId);
      setSynthesisSuccessModal(cleanSummary);

      // Inyectar mensaje inicial en la nueva conversación
      setMessages([
        {
          id: 'new-session-init',
          sender: 'bot',
          text: `✨ **Sesión anterior sintetizada y registrada en tu expediente** para la revisión de tu psicólogo colegiado.\n\n> *"${cleanSummary}"*\n\nHe abierto este nuevo espacio limpio con contexto renovado. ¿De qué te gustaría hablar hoy?`,
          time: new Date().toLocaleTimeString().substring(0, 5)
        }
      ]);

    } catch (err) {
      console.error("Error al sintetizar sesión:", err);
      setError("No se pudo sintetizar la sesión: " + err.message);
    } finally {
      setIsSynthesizingSession(false);
    }
  };

  // Exportar chat a Markdown
  const handleExportChat = () => {
    if (messages.length === 0) return;
    const conversation = conversations.find(c => c.id === activeConversationId);
    const title = conversation ? conversation.title : "Sesión de Chat";
    let md = `# Historial de Conversación: ${title}\n`;
    md += `Fecha de exportación: ${new Date().toLocaleDateString()}\n\n`;
    md += `---\n\n`;
    
    messages.forEach(m => {
      const role = m.sender === 'user' ? 'Paciente' : 'IA Áncora (Ánquer)';
      md += `**${role}** [${m.time}]:\n${m.text}\n\n`;
    });
    
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${title.replace(/\s+/g, '_')}_historial.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = () => {
    setIsDraggingFile(false);
  };

  const handleFileDrop = async (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (file && user?.id) {
      await uploadFileFromUI(file);
    }
  };

  const handlePaste = async (e) => {
    const file = e.clipboardData.files?.[0];
    if (file && user?.id) {
      e.preventDefault();
      await uploadFileFromUI(file);
    }
  };

  const uploadFileFromUI = async (file) => {
    setUploadingChatDoc(true);
    setError(null);
    try {
      // Obtener créditos antes de subir
      const { data: creditsBefore } = await firebaseClient
        .from('patient_credits')
        .select('*')
        .eq('patient_id', user.id)
        .maybeSingle();

      await uploadClinicalDocument(file, user.id);
      await loadMessages(activeConversationId);

      // Obtener créditos después de subir
      const { data: creditsAfter } = await firebaseClient
        .from('patient_credits')
        .select('*')
        .eq('patient_id', user.id)
        .maybeSingle();

      let diff = 0;
      if (creditsBefore && creditsAfter) {
        diff = (creditsAfter.text_credits_used || 0) - (creditsBefore.text_credits_used || 0);
      }

      setMessages(prev => [...prev, {
        id: `upload-${Date.now()}`,
        sender: 'bot',
        text: `He guardado y procesado "${file.name}". Lo usaré como síntesis clínica pendiente de revisión, no como documento completo dentro del chat.`,
        time: new Date().toLocaleTimeString().substring(0, 5)
      }]);

      if (diff > 0) {
        setLastTokensUsed(diff);
        setLastActionType('document_charged');
      } else {
        setLastTokensUsed(0);
        setLastActionType('document_free');
      }
    } catch (err) {
      console.error("Error al procesar archivo:", err.message);
      setError("No se pudo procesar el documento desde el chat: " + err.message);
    } finally {
      setUploadingChatDoc(false);
      setRefreshCreditsFlag(prev => prev + 1);
    }
  };

  // GRABACIÓN DE AUDIO E INTEGRACIÓN DE TRANSCRIPCIÓN INTELIGENTE
  const startAudioRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 1000) return;

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          await sendAudioToTranscribe(base64Audio);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access error:", err);
      setError("No se pudo acceder al micrófono: " + err.message);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToTranscribe = async (base64Audio) => {
    setTranscribingAudio(true);
    setError(null);
    try {
      const resData = await invokeChatTerapeuta({
        action: 'transcribe_audio',
        audio: base64Audio
      });
      if (resData && resData.transcription) {
        if (resData.tokensUsed) {
          setLastTokensUsed(resData.tokensUsed);
          setLastActionType('transcribe');
        }
        if (voiceModeRef.current) {
          await handleSend(resData.transcription);
        } else {
          setInputVal(prev => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${resData.transcription}` : resData.transcription;
          });
        }
      } else {
        throw new Error("No se obtuvo transcripción legible.");
      }
    } catch (err) {
      console.error("Transcription error:", err.message);
      setError("Error de transcripción: " + err.message);
    } finally {
      setTranscribingAudio(false);
      setRefreshCreditsFlag(prev => prev + 1);
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      stopAudioRecording();
    } else {
      startAudioRecording();
    }
  };

  const handleVoiceConversationToggle = async () => {
    const next = !voiceConversationMode;
    setVoiceConversationMode(next);
    voiceModeRef.current = next;
    
    if (next) {
      voiceSessionStartTimeRef.current = Date.now();
      if (!isRecording && !isSendingRef.current) {
        startAudioRecording();
      }
    } else {
      if (isRecording) {
        stopAudioRecording();
      }
      
      if (voiceSessionStartTimeRef.current) {
        const elapsed = Math.round((Date.now() - voiceSessionStartTimeRef.current) / 1000);
        voiceSessionStartTimeRef.current = null;
        if (elapsed > 0) {
          try {
            await invokeChatTerapeuta({
              action: 'live_session_close',
              durationSeconds: elapsed
            });
            setRefreshCreditsFlag(prev => prev + 1);
          } catch (err) {
            console.error("Error al cerrar sesión de voz:", err);
          }
        }
      }
    }
  };

  const handleChatDocumentUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user?.id) return;
    await uploadFileFromUI(file);
  };

  const quickActions = [
    { label: '¿Qué sabes de mí?', text: '¿Qué sabes de mí a partir de mi síntesis clínica y mis temas pendientes?' },
    { label: 'Preparar próxima sesión', text: 'Ayúdame a preparar mi próxima sesión con mi psicóloga usando mi historial sintetizado.' },
    { label: 'Estoy mal ahora', text: 'Estoy mal ahora. Ayúdame a ordenar lo que me pasa y dime qué debería comunicar a mi psicóloga.' }
  ];

  return (
    <div className="chat-layout-wrapper" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleFileDrop}>
      
      {/* Backdrop de Auto-Colapso para Móviles */}
      {showSidebar && (
        <div 
          className="mobile-only" 
          onClick={() => setShowSidebar(false)}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 1400,
            cursor: 'pointer'
          }}
        />
      )}

      {/* Sidebar Izquierdo de Historial Colapsable (Estilo Integral de Línea Temporal y Plan) */}
      <div className={`chat-sidebar-left ${showSidebar ? '' : 'collapsed'}`} style={{ overflowY: 'auto' }}>
        
        {/* Cabecera del Sidebar */}
        <div className="sidebar-header" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={15} color="var(--color-cyan)" />
            <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em', margin: 0 }}>Historial & Plan Clínico</h4>
          </div>
          <button onClick={() => setShowSidebar(false)} className="sidebar-btn-new" title="Cerrar Historial" style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={14} />
          </button>
        </div>

        {/* Botón Principal: Iniciar Nueva Sesión */}
        <div style={{ padding: '10px 14px 4px 14px' }}>
          <button
            onClick={handleCreateNewConversation}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.35)',
              color: 'var(--color-cyan)',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(6, 182, 212, 0.22)'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(6, 182, 212, 0.12)'; }}
          >
            <Plus size={14} />
            <span>Iniciar Nueva Sesión</span>
          </button>
        </div>

        {/* 1. Tarjeta de Próxima Cita (Real-Only con Modalidad y Psicólogo Real) */}
        {(() => {
          const now = new Date();
          const todayStr = now.toISOString().split('T')[0];
          const nextAppt = (appointments || [])
            .filter(a => a.appointment_date && a.appointment_date >= todayStr && a.status !== 'cancelled' && a.status !== 'Cancelada' && a.status !== 'completed')
            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))[0];

          return nextAppt ? renderEnrichedAppointmentCard(nextAppt, true) : null;
        })()}

        {/* 2. Mini-Calendario Semanal Sincronizado */}
        <div style={{
          margin: '0 14px 10px 14px',
          background: 'rgba(10, 22, 30, 0.65)',
          borderRadius: '10px',
          padding: '10px',
          border: '1px solid rgba(6, 182, 212, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Semana Terapéutica
            </span>
            <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)' }}>
              Sincronizado
            </span>
          </div>

          {/* Días L M X J V S D */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '3px' }}>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dayLetter, idx) => {
              const isToday = idx === todayIndex;
              const isSelected = idx === selectedCalendarDay;

              const now = new Date();
              const currentDayOfWeek = (now.getDay() + 6) % 7;
              const targetDay = new Date(now);
              targetDay.setDate(now.getDate() - currentDayOfWeek + idx);
              const targetDateStr = targetDay.toISOString().split('T')[0];

              const hasChat = conversations.some(c => c.created_at && c.created_at.startsWith(targetDateStr));
              const dayAppt = (appointments || []).find(a => a.appointment_date === targetDateStr && a.status !== 'cancelled' && a.status !== 'Cancelada');

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedCalendarDay(idx)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    padding: '5px 1px',
                    borderRadius: '6px',
                    background: isSelected ? 'rgba(6, 182, 212, 0.2)' : (isToday ? 'rgba(255,255,255,0.05)' : 'transparent'),
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--color-cyan)' : (isToday ? 'rgba(6,182,212,0.4)' : 'transparent'),
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <span style={{ fontSize: '0.58rem', fontWeight: isToday ? 800 : 600, color: isToday ? 'var(--color-cyan)' : 'var(--text-secondary)' }}>
                    {dayLetter}
                  </span>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: dayAppt ? 'rgba(6, 182, 212, 0.2)' : (hasChat ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.02)'),
                    border: dayAppt ? '1px solid var(--color-cyan)' : (hasChat ? '1px solid var(--color-emerald)' : '1px solid rgba(255,255,255,0.04)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.5rem'
                  }}>
                    {dayAppt ? (
                      <span>{dayAppt.modality === 'presencial' ? '🏥' : (dayAppt.session_type === 'revision' ? '📋' : '💻')}</span>
                    ) : hasChat ? (
                      <span style={{ color: 'var(--color-emerald)', fontWeight: 800 }}>✓</span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.35rem' }}>•</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Resumen del Día Seleccionado */}
          {(() => {
            const now = new Date();
            const currentDayOfWeek = (now.getDay() + 6) % 7;
            const targetDay = new Date(now);
            targetDay.setDate(now.getDate() - currentDayOfWeek + selectedCalendarDay);
            const targetDateStr = targetDay.toISOString().split('T')[0];
            const dayAppt = (appointments || []).find(a => a.appointment_date === targetDateStr && a.status !== 'cancelled' && a.status !== 'Cancelada');
            const dayConvs = conversations.filter(c => c.created_at && c.created_at.startsWith(targetDateStr));

            return (
              <div style={{ marginTop: '2px', padding: '5px 8px', borderRadius: '6px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                <div style={{ fontWeight: 700, color: '#ffffff' }}>
                  {targetDay.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
                {dayAppt ? (
                  <div style={{ color: 'var(--color-cyan)', fontWeight: 600 }}>
                    {dayAppt.modality === 'presencial' ? '🏥 Presencial' : '💻 Videollamada'} • {dayAppt.session_type === 'revision' ? 'Revisión' : 'Consulta'} ({dayAppt.appointment_time || '11:00'}h)
                  </div>
                ) : dayConvs.length > 0 ? (
                  <div style={{ color: 'var(--color-emerald)' }}>
                    ✓ {dayConvs.length} {dayConvs.length === 1 ? 'diario registrado' : 'diarios registrados'}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                    Sin citas programadas • Diario libre
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* 3. Puntos y Pautas para Consulta (Desplegable / Integrado) */}
        <details 
          open={showPendingTopicsSection}
          onToggle={(e) => setShowPendingTopicsSection(e.target.open)}
          style={{
            margin: '0 14px 10px 14px',
            background: 'rgba(10, 22, 30, 0.65)',
            borderRadius: '10px',
            padding: '10px',
            border: '1px solid rgba(6, 182, 212, 0.2)'
          }}
        >
          <summary style={{
            fontSize: '0.64rem',
            fontWeight: 800,
            color: 'var(--color-cyan)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            outline: 'none',
            userSelect: 'none'
          }}>
            <span>📋 Temas para Consulta</span>
            <span className="badge badge-cyan" style={{ fontSize: '0.52rem', padding: '1px 5px' }}>
              {agendaTopics.filter(t => !t.done).length} pendientes
            </span>
          </summary>

          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              <input
                type="text"
                placeholder="+ Añadir punto o duda a tratar..."
                value={newAgendaTopic}
                onChange={(e) => setNewAgendaTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddAgendaTopic(newAgendaTopic);
                }}
                style={{
                  flex: 1,
                  fontSize: '0.65rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: '#ffffff',
                  outline: 'none'
                }}
              />
              <button
                onClick={() => handleAddAgendaTopic(newAgendaTopic)}
                className="sidebar-btn-new"
                style={{ width: '24px', height: '24px', flexShrink: 0 }}
                title="Añadir punto"
              >
                <Plus size={12} />
              </button>
            </div>

            {agendaTopics.length === 0 ? (
              <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '4px 2px' }}>
                No tienes temas pendientes anotados para tu próxima consulta.
              </span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                {agendaTopics.map(topic => (
                  <div
                    key={topic.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '6px',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      background: topic.done ? 'rgba(255,255,255,0.01)' : 'rgba(6,182,212,0.05)',
                      border: '1px solid',
                      borderColor: topic.done ? 'rgba(255,255,255,0.03)' : 'rgba(6,182,212,0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={topic.done}
                        onChange={() => handleToggleAgendaTopic(topic.id)}
                        style={{ cursor: 'pointer', marginTop: '2px', accentColor: 'var(--color-cyan)' }}
                      />
                      <span style={{
                        fontSize: '0.65rem',
                        color: topic.done ? 'var(--text-tertiary)' : '#ffffff',
                        textDecoration: topic.done ? 'line-through' : 'none',
                        lineHeight: 1.3
                      }}>
                        {topic.text}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteAgendaTopic(topic.id)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: '2px' }}
                      title="Eliminar"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>

        {/* 4. Lista Cronológica de Sesiones Agrupadas por Ciclo */}
        <div className="sidebar-conversations-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '0 14px 20px 14px' }}>
          {Object.entries(getGroupedConversations()).map(([groupName, groupConvs]) => {
            const isThisActiveCycle = groupName.includes('Hacia') || groupName.includes('Ciclo Activo') || groupName.includes('Pendientes');
            const dayGrouped = groupConversationsByDate(groupConvs);

            if (!isThisActiveCycle) {
              return (
                <details key={groupName} style={{
                  background: 'rgba(255,255,255,0.015)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '8px 10px'
                }}>
                  <summary style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    outline: 'none',
                    userSelect: 'none'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Folder size={12} color="var(--text-tertiary)" />
                      <span>{groupName}</span>
                    </span>
                    <span className="badge" style={{ fontSize: '0.55rem', padding: '1px 5px', background: 'rgba(255,255,255,0.04)' }}>
                      {groupConvs.length}
                    </span>
                  </summary>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                    {groupConvs.map(conv => renderConversationCard(conv))}
                  </div>
                </details>
              );
            }

            return (
              <div key={groupName} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Cabecera del Ciclo Activo */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {groupName}
                  </span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.55rem', padding: '1px 5px' }}>
                    {groupConvs.length} {groupConvs.length === 1 ? 'sesión' : 'sesiones'}
                  </span>
                </div>

                {/* Lista de Sesiones por Día */}
                {Object.entries(dayGrouped).map(([dayLabel, dayConvs]) => (
                  <div key={dayLabel} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', paddingLeft: '2px' }}>
                      {dayLabel}
                    </span>
                    {dayConvs.map(conv => renderConversationCard(conv))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenedor Principal del Chat */}
      <div 
        className="glass-panel chat-main-container" 
        style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
        onPaste={handlePaste}
      >
        {/* Overlay Drag & Drop */}
        {isDraggingFile && (
          <div className="drag-drop-overlay">
            <div className="drag-drop-overlay-content">
              <Upload size={32} className="animate-bounce" />
              <h4>Arrastra tu archivo aquí</h4>
              <p>Formatos soportados: PDF, imágenes, audios o documentos de texto.</p>
            </div>
          </div>
        )}
      
        {/* Cabecera del Chat - Minimalista, Profesional & 100% Sin Caos */}
        <div style={{ 
          height: '46px',
          padding: '0 12px', 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '8px',
          background: 'rgba(8, 16, 22, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 50
        }}>
          {/* Lado Izquierdo: Toggle Historial + Nuevo Chat + Título Truncado */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
            <button 
              onClick={() => setShowSidebar(!showSidebar)} 
              className="sidebar-toggle-btn"
              title={showSidebar ? "Ocultar historial de sesiones" : "Mostrar historial de sesiones"}
              style={{
                width: '28px',
                height: '28px',
                color: showSidebar ? 'var(--color-cyan)' : 'var(--text-secondary)',
                borderColor: showSidebar ? 'rgba(68,125,130,0.4)' : 'var(--border)',
                flexShrink: 0
              }}
            >
              <Menu size={13} />
            </button>

            {/* Botón Nuevo Chat Rápido (Estilo ChatGPT / Claude) */}
            <button
              onClick={handleCreateNewConversation}
              className="sidebar-toggle-btn"
              title="Iniciar nueva sesión limpia"
              style={{
                width: '28px',
                height: '28px',
                color: 'var(--color-cyan)',
                borderColor: 'rgba(6, 182, 212, 0.3)',
                background: 'rgba(6, 182, 212, 0.08)',
                flexShrink: 0
              }}
            >
              <Plus size={13} />
            </button>

            {/* Título de la Sesión con Truncate */}
            <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
              {isEditingHeaderTitle ? (
                <input
                  type="text"
                  className="chat-title-input"
                  style={{ fontSize: '0.78rem', padding: '2px 6px', width: '100%', maxWidth: '200px', height: '26px' }}
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameHeader(tempTitle);
                    } else if (e.key === 'Escape') {
                      setIsEditingHeaderTitle(false);
                    }
                  }}
                  onBlur={() => handleRenameHeader(tempTitle)}
                  autoFocus
                />
              ) : (
                <div 
                  onClick={() => {
                    const activeConv = conversations.find(c => c.id === activeConversationId);
                    setTempTitle(activeConv ? activeConv.title : '');
                    setIsEditingHeaderTitle(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    overflow: 'hidden'
                  }}
                  title="Haz clic para renombrar esta conversación"
                >
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '180px'
                  }}>
                    {conversations.find(c => c.id === activeConversationId)?.title || 'Sesión Activa'}
                  </span>
                  <Edit3 size={10} style={{ opacity: 0.4, flexShrink: 0 }} />
                </div>
              )}
            </div>
          </div>

          {/* Lado Derecho: Indicador de Contexto Compacto + Menú de Opciones '...' */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* Pill de Contexto Compacto */}
            <div 
              title={`Contexto clínico: ${messages.length} de 16 mensajes recomendados para mantener frescura y foco.`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 7px',
                borderRadius: '12px',
                background: messages.length >= 18 ? 'rgba(244,63,94,0.12)' : (messages.length >= 12 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.1)'),
                border: messages.length >= 18 ? '1px solid rgba(244,63,94,0.3)' : (messages.length >= 12 ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(16,185,129,0.2)'),
                fontSize: '0.62rem',
                fontWeight: 700,
                color: messages.length >= 18 ? 'var(--color-rose)' : (messages.length >= 12 ? 'var(--color-amber)' : 'var(--color-emerald)')
              }}
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: messages.length >= 18 ? 'var(--color-rose)' : (messages.length >= 12 ? 'var(--color-amber)' : 'var(--color-emerald)') }} />
              <span>{messages.length}/16</span>
            </div>

            {/* Botón de Opciones MoreVertical */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowHeaderDropdown(!showHeaderDropdown)}
                className="header-action-btn"
                title="Opciones de la sesión"
                style={{
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: showHeaderDropdown ? 'var(--color-cyan)' : 'var(--text-secondary)',
                  borderColor: showHeaderDropdown ? 'var(--color-cyan)' : 'var(--border)',
                  background: showHeaderDropdown ? 'rgba(6,182,212,0.12)' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <MoreVertical size={14} />
              </button>

              {/* Menú Dropdown Elegante Glassmorphic */}
              {showHeaderDropdown && (
                <>
                  <div 
                    onClick={() => setShowHeaderDropdown(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 100 }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '220px',
                    background: 'rgba(10, 22, 32, 0.98)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(68, 125, 130, 0.3)',
                    borderRadius: '12px',
                    padding: '6px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    zIndex: 101,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    animation: 'scaleUp 0.15s ease-out'
                  }}>
                    {/* Concluir & Sintetizar */}
                    <button
                      onClick={() => {
                        setShowHeaderDropdown(false);
                        handleSynthesizeAndStartNewSession();
                      }}
                      disabled={isSynthesizingSession || messages.length <= 1}
                      className="btn btn-ghost"
                      style={{
                        padding: '8px 10px',
                        fontSize: '0.72rem',
                        justifyContent: 'flex-start',
                        borderRadius: '8px',
                        color: 'var(--color-cyan)',
                        opacity: messages.length <= 1 ? 0.4 : 1,
                        gap: '8px',
                        cursor: (isSynthesizingSession || messages.length <= 1) ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Sparkles size={13} className={isSynthesizingSession ? 'animate-spin' : ''} />
                      <span>{isSynthesizingSession ? 'Sintetizando...' : 'Concluir & Sintetizar'}</span>
                    </button>

                    {/* Alternar Pantalla Completa */}
                    <button
                      onClick={() => {
                        setShowHeaderDropdown(false);
                        if (setBottomMenuCollapsed) {
                          setBottomMenuCollapsed(!bottomMenuCollapsed);
                        } else if (setBottomMenuHidden) {
                          setBottomMenuHidden(!bottomMenuHidden);
                        }
                      }}
                      className="btn btn-ghost"
                      style={{
                        padding: '8px 10px',
                        fontSize: '0.72rem',
                        justifyContent: 'flex-start',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      {(bottomMenuCollapsed || bottomMenuHidden) ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                      <span>{(bottomMenuCollapsed || bottomMenuHidden) ? 'Mostrar Barra Inferior' : 'Pantalla Completa'}</span>
                    </button>

                    {/* Exportar Conversación */}
                    <button
                      onClick={() => {
                        setShowHeaderDropdown(false);
                        handleExportChat();
                      }}
                      disabled={messages.length <= 1}
                      className="btn btn-ghost"
                      style={{
                        padding: '8px 10px',
                        fontSize: '0.72rem',
                        justifyContent: 'flex-start',
                        borderRadius: '8px',
                        color: 'var(--text-primary)',
                        opacity: messages.length <= 1 ? 0.4 : 1,
                        gap: '8px',
                        cursor: messages.length <= 1 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      <Download size={13} />
                      <span>Exportar a Markdown</span>
                    </button>

                    <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

                    {/* Protocolo de Crisis */}
                    <button
                      onClick={() => {
                        setShowHeaderDropdown(false);
                        setShowCrisisPlan(true);
                      }}
                      className="btn btn-ghost"
                      style={{
                        padding: '8px 10px',
                        fontSize: '0.72rem',
                        justifyContent: 'flex-start',
                        borderRadius: '8px',
                        color: 'var(--color-rose)',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <AlertTriangle size={13} />
                      <span>Plan de Urgencias / Crisis</span>
                    </button>

                    {/* Garantía de Seguridad y Privacidad */}
                    <button
                      onClick={() => {
                        setShowHeaderDropdown(false);
                        setShowSecurityInfo(true);
                      }}
                      className="btn btn-ghost"
                      style={{
                        padding: '8px 10px',
                        fontSize: '0.72rem',
                        justifyContent: 'flex-start',
                        borderRadius: '8px',
                        color: 'var(--text-tertiary)',
                        gap: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      <ShieldAlert size={13} />
                      <span>Privacidad LOPDGDD</span>
                    </button>

                    {/* Consumo de Créditos */}
                    {profile?.id && (
                      <div style={{ padding: '6px 10px', borderTop: '1px solid var(--border)', marginTop: '2px' }}>
                        <PlanConsumptionWidget patientId={profile.id} forceRefreshFlag={refreshCreditsFlag} minimal={true} />
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal de Confirmación de Síntesis */}
        {synthesisSuccessModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(3, 19, 32, 0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 3000,
            padding: '16px'
          }}>
            <div className="glass-panel animate-scale-up" style={{ maxWidth: '520px', width: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid var(--color-cyan)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="flex-center" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(6,182,212,0.15)', color: 'var(--color-cyan)' }}>
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    Sesión Sintetizada & Registrada
                  </h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                    Ficha clínica incorporada para la revisión de tu psicólogo colegiado
                  </span>
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '14px', border: '1px solid var(--border)', fontSize: '0.76rem', color: '#ffffff', lineHeight: 1.5, maxHeight: '240px', overflowY: 'auto' }}>
                <strong style={{ color: 'var(--color-cyan)', display: 'block', marginBottom: '6px' }}>
                  📋 Síntesis Clínica de la Sesión:
                </strong>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {synthesisSuccessModal}
                </p>
              </div>

              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', margin: 0 }}>
                💡 Se ha iniciado un nuevo espacio de chat con contexto limpio para mantener la máxima agilidad y foco de la IA.
              </p>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSynthesisSuccessModal(null)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.78rem', padding: '8px 18px' }}
                >
                  Continuar al Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cuerpo del Chat (Mensajes o Modo de Voz Inmersivo) */}
        {voiceConversationMode ? (
          <div className="voice-immersive-panel">
            <div className="voice-status-container">
              <div className={`voice-status-badge ${
                isRecording ? 'listening' : 
                transcribingAudio ? 'transcribing' : 
                agentStatus !== 'online' ? 'thinking' : ''
              }`}>
                <span className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                {isRecording && 'Escuchando tu voz...'}
                {transcribingAudio && 'Procesando transcripción...'}
                {agentStatus !== 'online' && 'Ánquer está elaborando respuesta...'}
                {!isRecording && !transcribingAudio && agentStatus === 'online' && 'Modo de voz activo'}
              </div>
              
              <p className="voice-status-text">
                {isRecording && 'Cuéntale a Ánquer tus preocupaciones o cómo te sientes. El micrófono está abierto.'}
                {transcribingAudio && 'Transcribiendo tu audio con inteligencia artificial...'}
                {agentStatus !== 'online' && 'Generando la respuesta clínica adaptada a tu perfil...'}
                {!isRecording && !transcribingAudio && agentStatus === 'online' && 'Pulsa el botón circular para empezar a hablar con Ánquer.'}
              </p>
            </div>

            {/* Visualizador de ondas */}
            <div className={`voice-waves-visualizer ${isRecording || agentStatus !== 'online' ? 'active' : ''}`}>
              {Array.from({ length: 15 }).map((_, i) => (
                <div key={i} className="voice-wave-bar" />
              ))}
            </div>

            {/* Botón circular principal */}
            <button 
              type="button"
              onClick={handleToggleRecord}
              className={`voice-action-btn-large ${isRecording ? 'recording' : ''}`}
              disabled={transcribingAudio || agentStatus !== 'online'}
            >
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>

            {/* Botón para salir */}
            <button 
              type="button" 
              onClick={handleVoiceConversationToggle}
              className="voice-close-panel-btn"
            >
              <ArrowLeft size={14} />
              <span>Volver al chat escrito</span>
            </button>
          </div>
        ) : (
          /* Cuerpo de Mensajes Escritos */
          <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {error && (
              <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: 'var(--color-rose)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.72rem', textAlign: 'left' }}>
                {error}
              </div>
            )}

            {messages.map((msg, index) => {
              const isBot = msg.sender === 'bot';
              const isLastUserMsg = !isBot && index === messages.length - 1;
              const isFailed = isLastUserMsg && failedMessageText === msg.text;

              return (
                <div 
                  key={msg.id} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: isBot ? 'flex-start' : 'flex-end',
                    gap: '8px',
                    maxWidth: '88%',
                    alignSelf: isBot ? 'flex-start' : 'flex-end'
                  }}
                >
                  {isBot && (
                    <div className="flex-center" style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(68,125,130,0.08)', color: 'var(--color-cyan)', flexShrink: 0, marginTop: '2px' }}>
                      <Bot size={12} />
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div 
                      style={{ 
                        padding: '8px 12px', 
                        borderRadius: isBot ? '0 12px 12px 12px' : '12px 0 12px 12px',
                        background: isBot ? 'var(--background-secondary)' : 'rgba(68,125,130,0.15)',
                        border: '1px solid',
                        borderColor: isFailed ? 'var(--color-rose)' : (isBot ? 'var(--border)' : 'rgba(68,125,130,0.25)'),
                        fontSize: '0.78rem',
                        lineHeight: 1.45,
                        color: isBot ? 'var(--text-primary)' : '#ffffff',
                        whiteSpace: 'pre-wrap',
                        textAlign: 'left'
                      }}
                    >
                      {msg.text}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', alignSelf: isBot ? 'flex-start' : 'flex-end', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>
                        {msg.time}
                      </span>
                      {isBot && msg.usageDetails && (
                        <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', opacity: 0.75 }}>
                          • {msg.usageDetails.in} in • {msg.usageDetails.out} out • {msg.usageDetails.cache} en caché • {msg.usageDetails.credits}
                        </span>
                      )}
                      {isFailed && (
                        <button 
                          onClick={handleRetrySend} 
                          className="retry-message-btn" 
                          title="Reintentar enviar mensaje"
                        >
                          <RefreshCw size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Indicador de escritura del agente */}
            {(agentStatus !== 'online' || transcribingAudio) && (
              <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start' }}>
                <div className="flex-center animate-pulse-soft" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(68,125,130,0.08)', color: 'var(--color-cyan)' }}>
                  <Bot size={14} />
                </div>
                <div style={{ background: 'var(--background-secondary)', border: '1px solid var(--border)', padding: '10px 16px', borderRadius: '0 12px 12px 12px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-secondary)', animation: 'bounce 1s infinite' }} />
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-secondary)', animation: 'bounce 1s infinite 0.2s' }} />
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--text-secondary)', animation: 'bounce 1s infinite 0.4s' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input / Acciones del Chat */}
        <div className={`chat-input-wrapper-container ${bottomMenuHidden ? 'menu-hidden' : ''}`}>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleChatDocumentUpload}
            accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg,.webp,.m4a,.mp3,.wav,.webm"
            style={{ display: 'none' }}
          />

          {creditsExceeded && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '6px',
              color: 'var(--color-amber)',
              fontSize: '0.68rem',
              textAlign: 'left'
            }}>
              <AlertTriangle size={12} style={{ flexShrink: 0 }} />
              <span><strong>Límite superado:</strong> Cupo semanal agotado.</span>
            </div>
          )}

          {liveCreditsExceeded && !creditsExceeded && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              background: 'rgba(244,63,94,0.08)',
              border: '1px solid rgba(244,63,94,0.25)',
              borderRadius: '6px',
              color: 'var(--color-rose)',
              fontSize: '0.68rem',
              textAlign: 'left'
            }}>
              <AlertTriangle size={12} style={{ flexShrink: 0 }} />
              <span><strong>Límite de voz agotado:</strong> Cupo mensual de voz agotado.</span>
            </div>
          )}

          {lastActionType && lastActionType !== 'document_free' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              background: 'rgba(68,125,130,0.05)',
              border: '1px solid rgba(68,125,130,0.15)',
              borderRadius: '6px',
              color: 'var(--color-cyan)',
              fontSize: '0.68rem',
              textAlign: 'left',
              animation: 'fadeIn 0.3s ease'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={11} />
                <span>
                  {lastActionType === 'transcribe' ? 'Último audio transcrito' : 
                   lastActionType.startsWith('document') ? 'Último documento procesado' : 'Última respuesta de IA'}
                </span>
              </span>
              <span style={{ fontWeight: 600 }}>
                {lastActionType === 'document_free' ? '0 CR (Cupo gratuito)' :
                 lastActionType === 'document_charged' ? `+${(lastTokensUsed / 100).toFixed(0)} CR (+${lastTokensUsed.toLocaleString()} tokens)` :
                 `+${(lastTokensUsed / 100).toFixed(1)} CR (+${lastTokensUsed.toLocaleString()} tokens)`}
              </span>
            </div>
          )}

          {/* Menú flotante de acciones rápidas */}
          {showQuickActions && (
            <div 
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: '12px',
                right: '12px',
                background: 'rgba(8, 16, 22, 0.96)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(68, 125, 130, 0.3)',
                borderRadius: '12px',
                padding: '10px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px', padding: '0 4px' }}>
                <span style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                  Acciones & Sugerencias
                </span>
                <button 
                  onClick={() => setShowQuickActions(false)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', padding: 0 }}
                >
                  <X size={12} />
                </button>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      handleSend(action.text);
                      setShowQuickActions(false);
                    }}
                    disabled={agentStatus !== 'online' || isRecording || transcribingAudio || creditsExceeded}
                    className="btn btn-ghost"
                    style={{ 
                      padding: '6px 10px', 
                      fontSize: '0.72rem', 
                      textAlign: 'left', 
                      justifyContent: 'flex-start',
                      borderRadius: '6px', 
                      opacity: creditsExceeded ? 0.4 : 1,
                      width: '100%',
                      color: 'var(--text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Sparkles size={11} style={{ color: 'var(--color-cyan)', flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{action.label}</span>
                  </button>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '6px', marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={() => {
                    handleVoiceConversationToggle();
                    setShowQuickActions(false);
                  }}
                  disabled={liveCreditsExceeded}
                  className={voiceConversationMode ? 'btn btn-primary' : 'btn btn-ghost'}
                  style={{ 
                    width: '100%',
                    padding: '6px 10px', 
                    fontSize: '0.72rem', 
                    borderRadius: '6px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '6px',
                    opacity: liveCreditsExceeded ? 0.4 : 1,
                    cursor: liveCreditsExceeded ? 'not-allowed' : 'pointer'
                  }}
                >
                  <MessageCircle size={12} />
                  {liveCreditsExceeded ? 'Voz agotada' : voiceConversationMode ? 'Desactivar voz' : 'Hablar por voz (Modo Live)'}
                </button>
              </div>
            </div>
          )}

          {/* Fila única horizontal minimalista */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center', width: '100%' }}>
            
            {/* Botón Volver al Menú (Acceso Rápido Ergonómico para Pulgar en Móvil) */}
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="flex-center header-action-btn mobile-only"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title="Volver al Panel Principal (Menú)"
              >
                <ArrowLeft size={13} />
              </button>
            )}

            {/* Subir archivo */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingChatDoc || creditsExceeded}
              className="flex-center header-action-btn"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                cursor: (uploadingChatDoc || creditsExceeded) ? 'not-allowed' : 'pointer',
                opacity: (uploadingChatDoc || creditsExceeded) ? 0.4 : 1,
                transition: 'all var(--transition-fast)',
                flexShrink: 0
              }}
              title="Subir archivo"
            >
              {uploadingChatDoc ? <RefreshCw size={12} className="animate-spin" /> : <Upload size={12} />}
            </button>

            {/* Toggle de Sugerencias */}
            <button
              type="button"
              onClick={() => setShowQuickActions(!showQuickActions)}
              disabled={creditsExceeded}
              className="flex-center header-action-btn"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: showQuickActions ? 'rgba(68,125,130,0.15)' : 'rgba(255,255,255,0.02)',
                border: '1px solid',
                borderColor: showQuickActions ? 'var(--color-cyan)' : 'var(--border)',
                color: showQuickActions ? 'var(--color-cyan)' : 'var(--text-secondary)',
                cursor: creditsExceeded ? 'not-allowed' : 'pointer',
                opacity: creditsExceeded ? 0.4 : 1,
                transition: 'all var(--transition-fast)',
                flexShrink: 0
              }}
              title="Sugerencias y voz"
            >
              <Sparkles size={12} />
            </button>

            {/* Input de texto */}
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputVal)}
                disabled={isRecording || transcribingAudio || creditsExceeded || voiceConversationMode}
                placeholder={
                  creditsExceeded 
                    ? "Límite semanal superado." 
                    : voiceConversationMode 
                      ? "Modo de voz activo." 
                      : isRecording 
                        ? "Grabando audio..." 
                        : transcribingAudio 
                          ? "Transcribiendo..." 
                          : "Escribe un mensaje..."
                }
                style={{
                  width: '100%',
                  height: '32px',
                  background: 'var(--background-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: '16px',
                  padding: '0 28px 0 12px',
                  fontSize: '0.75rem',
                  color: '#ffffff',
                  opacity: (creditsExceeded || voiceConversationMode) ? 0.6 : 1,
                  outline: 'none',
                  transition: 'border-color var(--transition-fast)'
                }}
              />
              {agentStatus !== 'online' && (
                <RefreshCw size={11} className="animate-spin" style={{ position: 'absolute', right: '10px', top: '10px', color: 'var(--color-cyan)' }} />
              )}
            </div>

            {/* Grabar nota de voz */}
            <button
              type="button"
              onClick={handleToggleRecord}
              disabled={creditsExceeded || voiceConversationMode}
              className="flex-center header-action-btn"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isRecording ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.02)',
                border: '1px solid',
                borderColor: isRecording ? 'var(--color-rose)' : 'var(--border)',
                color: isRecording ? 'var(--color-rose)' : 'var(--text-secondary)',
                cursor: (creditsExceeded || voiceConversationMode) ? 'not-allowed' : 'pointer',
                opacity: (creditsExceeded || voiceConversationMode) ? 0.4 : 1,
                transition: 'all var(--transition-fast)',
                flexShrink: 0
              }}
              title={isRecording ? "Detener y transcribir" : "Grabar nota de voz"}
            >
              {isRecording ? <MicOff size={12} className="animate-pulse-soft" /> : <Mic size={12} />}
            </button>

            {/* Enviar / Parar */}
            {agentStatus !== 'online' ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="btn-stop-generation"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  color: 'var(--color-rose)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
                title="Detener respuesta"
              >
                <Square size={10} fill="currentColor" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSend(inputVal)}
                disabled={!inputVal.trim() || isRecording || transcribingAudio || creditsExceeded || voiceConversationMode}
                className="flex-center"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: (inputVal.trim() && !creditsExceeded && !voiceConversationMode) ? 'var(--color-cyan)' : 'rgba(255,255,255,0.02)',
                  border: '1px solid',
                  borderColor: (inputVal.trim() && !creditsExceeded && !voiceConversationMode) ? 'var(--color-cyan)' : 'var(--border)',
                  color: (inputVal.trim() && !creditsExceeded && !voiceConversationMode) ? '#ffffff' : 'var(--text-tertiary)',
                  cursor: (inputVal.trim() && !creditsExceeded && !voiceConversationMode) ? 'pointer' : 'default',
                  transition: 'all var(--transition-fast)',
                  flexShrink: 0,
                  opacity: (inputVal.trim() && !creditsExceeded && !voiceConversationMode) ? 1 : 0.4
                }}
                title="Enviar"
              >
                <Send size={12} />
              </button>
            )}

          </div>
        </div>

        {/* Modal de Plan de Crisis (Urgencia) */}
        {showCrisisPlan && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 3000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div className="glass-panel" style={{
              maxWidth: '500px',
              width: '100%',
              padding: '28px',
              borderTop: '6px solid var(--color-rose)',
              background: 'var(--background-secondary)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div className="flex-center animate-pulse-soft" style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(244,63,94,0.1)',
                color: 'var(--color-rose)',
                alignSelf: 'center'
              }}>
                <AlertTriangle size={32} />
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Protocolo de Emergencia Activo
              </h3>
              
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Si estás sufriendo una crisis de ansiedad aguda grave, te sientes en peligro o tienes pensamientos de autolesión, por favor ponte en contacto inmediato con los servicios profesionales de emergencia pública.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <a 
                  href="tel:112" 
                  className="btn btn-primary"
                  style={{ 
                    background: 'var(--color-rose)', 
                    borderColor: 'rgba(244,63,94,0.4)', 
                    color: '#ffffff',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}
                >
                  Llamar a Emergencias (112)
                </a>

                <a 
                  href="tel:024" 
                  className="btn btn-outline"
                  style={{ 
                    borderColor: 'rgba(244,63,94,0.3)', 
                    color: 'var(--color-rose)',
                    height: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700
                  }}
                >
                  Línea de Prevención del Suicidio (024)
                </a>
              </div>

              <button
                onClick={() => setShowCrisisPlan(false)}
                className="btn btn-outline"
                style={{ height: '36px', fontSize: '0.75rem', marginTop: '14px', width: '100%' }}
              >
                Cerrar y volver al Chat diario
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
