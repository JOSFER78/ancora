import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { invokeChatTerapeuta } from '../../lib/chatTerapeuta';
import { buildPatientSnapshot, processConversationTurn, uploadClinicalDocument } from '../../lib/clinicalEngine';
import PlanConsumptionWidget from '../../components/PlanConsumptionWidget';
import { 
  Send, Mic, MicOff, AlertTriangle, Bot, User, 
  Sparkles, Clock, RefreshCw, Volume2, ShieldAlert, Upload, MessageCircle,
  Plus, Trash2, Edit3, Folder, Download, Menu, ArrowLeft, Square, X,
  Maximize2, Minimize2, Calendar
} from 'lucide-react';

export default function PacienteChatView({ profile, user, onProfileUpdated, sidebarCollapsed = false, setSidebarCollapsed, bottomMenuHidden = false, setBottomMenuHidden }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [appointments, setAppointments] = useState([]);

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
  const [failedMessageText, setFailedMessageText] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Topic folders and mapping states
  const [topicFolders, setTopicFolders] = useState(() => {
    const saved = localStorage.getItem(`chat_folders_${user?.id}`);
    return saved ? JSON.parse(saved) : ['General', 'Estrés Laboral', 'Sueño y Descanso'];
  });

  const [convFolderMap, setConvFolderMap] = useState(() => {
    const saved = localStorage.getItem(`chat_conv_folders_${user?.id}`);
    return saved ? JSON.parse(saved) : {};
  });

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
      const { data: dbAppts, error: apptErr } = await supabase
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

  // Agrupar conversaciones por semanas
  const getGroupedConversations = () => {
    const groups = {
      'Esta semana': [],
      'La semana pasada': [],
      'Hace dos semanas': [],
      'Anteriores': []
    };

    conversations.forEach(conv => {
      const date = conv.created_at ? new Date(conv.created_at) : new Date();
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 7) {
        groups['Esta semana'].push(conv);
      } else if (diffDays <= 14) {
        groups['La semana pasada'].push(conv);
      } else if (diffDays <= 21) {
        groups['Hace dos semanas'].push(conv);
      } else {
        groups['Anteriores'].push(conv);
      }
    });

    return Object.keys(groups).reduce((acc, key) => {
      if (groups[key].length > 0) {
        acc[key] = groups[key];
      }
      return acc;
    }, {});
  };

  // Obtener etiqueta de Sesión o Revisión para una conversación
  const getConversationIndicator = (conv) => {
    if (!conv.created_at) return null;
    const convDateStr = new Date(conv.created_at).toISOString().split('T')[0];

    // Buscar si hay cita en esa fecha
    const hasAppointment = appointments.some(appt => {
      if (!appt.appointment_date) return false;
      const apptDateStr = new Date(appt.appointment_date).toISOString().split('T')[0];
      return apptDateStr === convDateStr;
    });

    if (hasAppointment) {
      return { type: 'session', label: 'Sesión 🩺', color: 'var(--color-cyan)', bgColor: 'rgba(68,125,130,0.1)' };
    }

    // Si la sesión está completada/archivada en BD, es una revisión ya hecha por la psicóloga
    if (conv.status === 'completed' || conv.status === 'archived') {
      return { type: 'revision', label: 'Revisión 📋', color: 'var(--color-emerald)', bgColor: 'rgba(127,159,136,0.1)' };
    }

    // Alternar de forma simulada en modo Demo/Desarrollo para poblar visualmente
    const isMock = user?.email?.toLowerCase().includes('demo') || user?.email === 'tisute@gmail.com' || user?.email === 'josferestudio@gmail.com';
    if (isMock) {
      const date = new Date(conv.created_at);
      const day = date.getDate();
      if (day % 3 === 0) {
        return { type: 'session', label: 'Sesión 🩺', color: 'var(--color-cyan)', bgColor: 'rgba(68,125,130,0.12)' };
      } else if (day % 3 === 1) {
        return { type: 'revision', label: 'Revisión 📋', color: 'var(--color-emerald)', bgColor: 'rgba(127,159,136,0.12)' };
      }
    }

    return null;
  };

  const getRoadmapGuideMessage = (todayIdx, completedReviews, isPremium, startOfWeekDay) => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const todayName = days[todayIdx];
    
    const startIdx = days.indexOf(startOfWeekDay);
    const limitIdx = (startIdx + 6) % 7;
    const limitDayName = days[limitIdx];
    
    if (isPremium) {
      if (completedReviews >= 3) {
        return `¡Gran trabajo! Has completado tus 3 revisiones semanales premium de este ciclo.`;
      }
      const pendingCount = 3 - completedReviews;
      return `Hoy es ${todayName}. Tienes ${pendingCount} revisión/es clínica/s pendientes antes del ${startOfWeekDay}.`;
    } else {
      if (completedReviews >= 1) {
        return `¡Revisión semanal de tu suscripción completada! Siguiente período inicia el ${startOfWeekDay}.`;
      }
      return `Hoy es ${todayName}. Recuerda realizar tu revisión semanal obligatoria antes del ${startOfWeekDay} (límite ${limitDayName}).`;
    }
  };

  const getWeekRangeStr = (groupName) => {
    if (groupName === 'Esta semana') {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      const sunday = new Date(now.setDate(diff + 6));
      const options = { day: 'numeric', month: 'short' };
      return `(${monday.toLocaleDateString('es-ES', options)} - ${sunday.toLocaleDateString('es-ES', options)})`;
    }
    return '';
  };

  useEffect(() => {
    voiceModeRef.current = voiceConversationMode;
  }, [voiceConversationMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, agentStatus]);

  // Cargar/crear conversación activa en Supabase
  const loadConversations = async () => {
    try {
      const { data, error: fetchErr } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'archived')
        .order('updated_at', { ascending: false });

      if (fetchErr) throw fetchErr;

      if (data && data.length > 0) {
        setConversations(data);
        setActiveConversationId(data[0].id);
      } else {
        // Crear una nueva conversación si no existe
        const { data: newConv, error: createErr } = await supabase
          .from('conversations')
          .insert([{ 
            user_id: user.id, 
            title: 'Nueva sesión con IA Áncora', 
            status: 'active' 
          }])
          .select()
          .single();

        if (createErr) throw createErr;
        setConversations([newConv]);
        setActiveConversationId(newConv.id);
      }
    } catch (err) {
      console.error("Error loading conversations in patient chat:", err.message);
      setError("No se pudieron cargar las conversaciones: " + err.message);
    }
  };

  // Cargar mensajes de la conversación activa
  const loadMessages = async (convId) => {
    if (!convId) return;
    try {
      const { data, error: msgErr } = await supabase
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
      const { data, error: fetchErr } = await supabase
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

  // Enviar mensaje real a Supabase & Edge Function
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
      const { data: savedUserMsg, error: saveUserErr } = await supabase
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
      const { data: dbHistory, error: historyErr } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });

      if (historyErr) throw historyErr;

      // 3. Invocar la Edge Function de chat-terapeuta
      setAgentStatus('updating');
      
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const resData = await invokeChatTerapeuta({
        conversationId: activeConversationId,
        messages: dbHistory || [],
        model: 'free'
      }, controller.signal);

      if (resData && resData.reply) {
        setFailedMessageText('');
        // Recargar mensajes de la base de datos para sincronizar
        await loadMessages(activeConversationId);

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
      const { error: renameErr } = await supabase
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
      const { error: deleteErr } = await supabase
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
      const { data: newConv, error: createErr } = await supabase
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

  // Exportar chat a Markdown
  const handleExportChat = () => {
    if (messages.length === 0) return;
    const conversation = conversations.find(c => c.id === activeConversationId);
    const title = conversation ? conversation.title : "Sesión de Chat";
    let md = `# Historial de Conversación: ${title}\n`;
    md += `Fecha de exportación: ${new Date().toLocaleDateString()}\n\n`;
    md += `---\n\n`;
    
    messages.forEach(m => {
      const role = m.sender === 'user' ? 'Paciente' : 'IA Áncora (Walter)';
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
      const { data: creditsBefore } = await supabase
        .from('patient_credits')
        .select('*')
        .eq('patient_id', user.id)
        .maybeSingle();

      await uploadClinicalDocument(file, user.id);
      await loadMessages(activeConversationId);

      // Obtener créditos después de subir
      const { data: creditsAfter } = await supabase
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

      {/* Sidebar Izquierdo de Historial Colapsable */}
      <div className={`chat-sidebar-left ${showSidebar ? '' : 'collapsed'}`} style={{ overflowY: 'auto' }}>
        <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderBottom: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Historial Clínico</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={handleCreateNewConversation} className="sidebar-btn-new" title="Nueva sesión de diario">
              <Plus size={14} />
            </button>
            <button onClick={() => setShowSidebar(false)} className="sidebar-btn-new" title="Cerrar Historial" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Crear Carpeta de Tema */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="text"
              placeholder="Nueva carpeta de tema..."
              id="new-folder-input"
              style={{
                flex: 1,
                fontSize: '0.7rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '4px 8px',
                color: '#ffffff',
                height: '24px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = e.target.value.trim();
                  if (val) {
                    handleCreateFolder(val);
                    e.target.value = '';
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const input = document.getElementById('new-folder-input');
                const val = input?.value?.trim();
                if (val) {
                  handleCreateFolder(val);
                  input.value = '';
                }
              }}
              className="sidebar-btn-new"
              style={{ width: '24px', height: '24px' }}
              title="Añadir Tema"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        <div className="sidebar-conversations-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 12px' }}>
          {Object.entries(getGroupedConversations()).map(([groupName, groupConvs]) => {
            const completedReviewsCount = groupConvs.filter(c => {
              const ind = getConversationIndicator(c);
              return ind && ind.type === 'revision';
            }).length;

            const isThisWeek = groupName === 'Esta semana';
            const weekAppointments = isThisWeek
              ? appointments.filter(appt => {
                  if (!appt.appointment_date) return false;
                  const apptDate = new Date(appt.appointment_date);
                  const now = new Date();
                  const diffTime = Math.abs(now - apptDate);
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  return diffDays <= 7;
                })
              : [];

            return (
              <div key={groupName} className="sidebar-folder-section" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Cabecera del Periodo */}
                <div className="sidebar-folder-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    <Calendar size={12} />
                    <span>{groupName} {getWeekRangeStr(groupName)}</span>
                  </span>
                  <span className="badge" style={{ fontSize: '0.55rem', padding: '2px 6px', background: 'rgba(255,255,255,0.03)', border: 'none' }}>
                    {groupConvs.length}
                  </span>
                </div>

                {/* Hoja de Ruta Semanal Integrada en Calendario (Solo para esta semana activa) */}
                {isThisWeek && (
                  <div className="weekly-roadmap" style={{
                    background: 'rgba(10, 22, 30, 0.4)',
                    borderRadius: '8px',
                    padding: '10px',
                    border: '1px solid var(--border)',
                    marginBottom: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 700 }}>
                      <span>Calendario Semanal</span>
                      <span style={{ color: 'var(--color-cyan)' }}>{isPremium ? 'Premium (3 Revs)' : 'Básico (1 Rev)'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px', marginBottom: '8px' }}>
                      {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((dayName, idx) => {
                        const isToday = idx === todayIndex;
                        const hasSession = weekAppointments.some(appt => {
                          const apptDay = (new Date(appt.appointment_date).getDay() + 6) % 7;
                          return apptDay === idx;
                        });
                        
                        const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                        const startIdx = DAYS_OF_WEEK.indexOf(startOfWeekDay) !== -1 ? DAYS_OF_WEEK.indexOf(startOfWeekDay) : 0;
                        
                        const isReviewDay = isPremium 
                          ? (idx === (startIdx + 2) % 7 || idx === (startIdx + 4) % 7 || idx === (startIdx + 6) % 7)
                          : (idx === (startIdx + 6) % 7);
                        
                        let reviewStatus = 'none';
                        if (isReviewDay) {
                          let reviewNumber = 1;
                          if (isPremium) {
                            if (idx === (startIdx + 2) % 7) reviewNumber = 1;
                            if (idx === (startIdx + 4) % 7) reviewNumber = 2;
                            if (idx === (startIdx + 6) % 7) reviewNumber = 3;
                          }
                          reviewStatus = completedReviewsCount >= reviewNumber ? 'completed' : 'pending';
                        }

                        return (
                          <div key={idx} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            flex: 1
                          }}>
                            <span style={{ 
                              fontSize: '0.62rem', 
                              fontWeight: isToday ? 800 : 500, 
                              color: isToday ? 'var(--color-cyan)' : 'var(--text-secondary)' 
                            }}>
                              {dayName}
                            </span>
                            <div style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              background: isToday 
                                ? 'rgba(6,182,212,0.15)' 
                                : (reviewStatus === 'completed' ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)'),
                              border: isToday
                                ? '1px solid var(--color-cyan)'
                                : (reviewStatus === 'completed' 
                                    ? '1px solid var(--color-emerald)' 
                                    : (reviewStatus === 'pending' ? '1px dashed var(--color-amber)' : '1px solid transparent')),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.65rem'
                            }}>
                              {hasSession ? (
                                <span title="Sesión Programada" style={{ fontSize: '0.55rem' }}>🩺</span>
                              ) : reviewStatus === 'completed' ? (
                                <span title="Revisión Completada" style={{ color: 'var(--color-emerald)', fontSize: '0.55rem', fontWeight: 900 }}>✓</span>
                              ) : reviewStatus === 'pending' ? (
                                <span title="Revisión Pendiente" style={{ color: 'var(--color-amber)', fontSize: '0.55rem', fontWeight: 800 }}>📋</span>
                              ) : (
                                <span style={{ color: 'var(--text-tertiary)', fontSize: '0.45rem' }}>•</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.3, textAlign: 'left', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
                      {getRoadmapGuideMessage(todayIndex, completedReviewsCount, isPremium, startOfWeekDay)}
                    </div>
                  </div>
                )}

                {/* Listado de Sesiones con Terapeuta de esta semana */}
                {isThisWeek && weekAppointments.length > 0 && (
                  <div style={{
                    background: 'rgba(6,182,212,0.04)',
                    border: '1px solid rgba(6,182,212,0.15)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    textAlign: 'left',
                    marginBottom: '4px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase', marginBottom: '4px' }}>
                      <span>Sesiones esta semana</span>
                    </div>
                    {weekAppointments.map((appt, idx) => {
                      const apptDate = new Date(appt.appointment_date);
                      const dayName = apptDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
                      return (
                        <div key={idx} style={{ fontSize: '0.65rem', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                          <span>{dayName} ({appt.appointment_time || '17:00'})</span>
                          <span className="badge badge-cyan" style={{ fontSize: '0.5rem', padding: '1px 3px', textTransform: 'none' }}>Sesión 🩺</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Carpetas de Temas y Acordeones */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {topicFolders.map(folderName => {
                    const folderConvs = groupConvs.filter(conv => {
                      const assignedFolder = convFolderMap[conv.id] || 'General';
                      return assignedFolder === folderName;
                    });

                    return (
                      <details key={folderName} open={folderName === 'General'} style={{
                        background: 'rgba(255,255,255,0.01)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '6px 8px'
                      }}>
                        <summary style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          outline: 'none',
                          userSelect: 'none'
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Folder size={11} color="var(--color-cyan)" />
                            <span>{folderName}</span>
                          </span>
                          <span className="badge" style={{ fontSize: '0.55rem', padding: '1px 5px', background: 'rgba(255,255,255,0.04)' }}>
                            {folderConvs.length}
                          </span>
                        </summary>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', paddingLeft: '4px' }}>
                          {folderConvs.length === 0 ? (
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontStyle: 'italic', padding: '4px' }}>
                              Sin diarios en esta carpeta
                            </span>
                          ) : (
                            folderConvs.map(conv => {
                              const indicator = getConversationIndicator(conv);
                              
                              if (isEditingTitle === conv.id) {
                                return (
                                  <div key={conv.id} className="sidebar-item-btn active" style={{ padding: '4px 8px' }}>
                                    <input
                                      type="text"
                                      className="chat-title-input"
                                      style={{ fontSize: '0.72rem', width: '100%', height: '24px', background: 'var(--background-secondary)' }}
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
                                  className={`sidebar-item-btn ${activeConversationId === conv.id ? 'active' : ''}`}
                                  onClick={() => {
                                    setActiveConversationId(conv.id);
                                    setShowSidebar(false);
                                  }}
                                  style={{ 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    alignItems: 'flex-start', 
                                    gap: '4px', 
                                    padding: '8px 10px',
                                    borderRadius: '6px'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: '4px' }}>
                                    <span className="sidebar-item-text" style={{ fontSize: '0.7rem', fontWeight: activeConversationId === conv.id ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {conv.title}
                                    </span>
                                    
                                    <div className="sidebar-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                      {/* Selector de Carpeta */}
                                      <select
                                        value={convFolderMap[conv.id] || 'General'}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          handleMoveConversationToFolder(conv.id, e.target.value);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                          fontSize: '0.55rem',
                                          background: 'rgba(10, 22, 30, 0.8)',
                                          color: 'var(--text-secondary)',
                                          border: '1px solid var(--border)',
                                          borderRadius: '4px',
                                          padding: '1px 2px',
                                          cursor: 'pointer',
                                          maxWidth: '55px',
                                          outline: 'none'
                                        }}
                                        title="Mover de carpeta"
                                      >
                                        {topicFolders.map(f => (
                                          <option key={f} value={f}>{f}</option>
                                        ))}
                                      </select>

                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setIsEditingTitle(conv.id); setTempTitle(conv.title); }} 
                                        className="sidebar-item-action-btn"
                                        title="Renombrar"
                                        style={{ padding: '2px' }}
                                      >
                                        <Edit3 size={10} />
                                      </button>
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); handleDeleteConversation(conv.id); }} 
                                        className="sidebar-item-action-btn delete"
                                        title="Eliminar"
                                        style={{ padding: '2px' }}
                                      >
                                        <Trash2 size={10} />
                                      </button>
                                    </div>
                                  </div>

                                  {indicator && (
                                    <span className="badge" style={{ 
                                      fontSize: '0.55rem', 
                                      padding: '1px 6px', 
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
                              );
                            })
                          )}
                        </div>
                      </details>
                    );
                  })}
                </div>
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
      
        {/* Cabecera del Chat */}
        <div style={{ padding: '8px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <button 
                onClick={() => setShowSidebar(!showSidebar)} 
                className="sidebar-toggle-btn"
                title={showSidebar ? "Ocultar historial" : "Mostrar historial"}
                style={{
                  width: '28px',
                  height: '28px',
                  color: showSidebar ? 'var(--color-cyan)' : 'var(--text-secondary)',
                  borderColor: showSidebar ? 'rgba(68,125,130,0.4)' : 'var(--border)'
                }}
              >
                <Menu size={12} />
              </button>
            </div>
            <div>
              <div className="chat-title-container">
                {isEditingHeaderTitle ? (
                  <input
                    type="text"
                    className="chat-title-input"
                    style={{ fontSize: '0.8rem', padding: '2px 4px', width: '180px', height: '24px' }}
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
                  <h3 
                    className="chat-title-text"
                    style={{ fontSize: '0.82rem', padding: '2px 4px', margin: 0 }}
                    onClick={() => {
                      const activeConv = conversations.find(c => c.id === activeConversationId);
                      setTempTitle(activeConv ? activeConv.title : '');
                      setIsEditingHeaderTitle(true);
                    }}
                  >
                    {conversations.find(c => c.id === activeConversationId)?.title || 'Sesión de Chat'}
                    <Edit3 size={9} style={{ opacity: 0.5 }} />
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-emerald)', display: 'inline-block' }} />
                  </h3>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {/* Botón de Pantalla Completa (Ocultar/Mostrar Menú Inferior en Móvil) */}
            <button
              onClick={() => setBottomMenuHidden(!bottomMenuHidden)}
              className="header-action-btn mobile-only"
              title={bottomMenuHidden ? "Mostrar menú de navegación" : "Ocultar menú de navegación (Pantalla completa)"}
              style={{
                width: '28px',
                height: '28px',
                color: bottomMenuHidden ? 'var(--color-cyan)' : 'var(--text-secondary)',
                borderColor: bottomMenuHidden ? 'rgba(68,125,130,0.4)' : 'var(--border)'
              }}
            >
              {bottomMenuHidden ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
            </button>

            {/* Botón de Exportar Chat */}
            <button
              onClick={handleExportChat}
              className="header-action-btn"
              title="Exportar conversación a Markdown"
              disabled={messages.length <= 1}
              style={{ width: '28px', height: '28px', opacity: messages.length <= 1 ? 0.4 : 1 }}
            >
              <Download size={12} />
            </button>

            {/* Widget de Créditos de IA (Minimalista) */}
            {profile?.id && (
              <PlanConsumptionWidget patientId={profile.id} forceRefreshFlag={refreshCreditsFlag} minimal={true} />
            )}

            {/* Botón de crisis de emergencia */}
            <button
              onClick={() => setShowCrisisPlan(true)}
              className="header-action-btn"
              style={{
                width: '28px',
                height: '28px',
                background: 'rgba(244, 63, 94, 0.1)',
                borderColor: 'rgba(244, 63, 94, 0.3)',
                color: 'var(--color-rose)'
              }}
              title="Esto es Urgente"
            >
              <ShieldAlert size={12} />
            </button>
          </div>
        </div>

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
                {agentStatus !== 'online' && 'Walter está elaborando respuesta...'}
                {!isRecording && !transcribingAudio && agentStatus === 'online' && 'Modo de voz activo'}
              </div>
              
              <p className="voice-status-text">
                {isRecording && 'Cuéntale a Walter tus preocupaciones o cómo te sientes. El micrófono está abierto.'}
                {transcribingAudio && 'Transcribiendo tu audio con inteligencia artificial...'}
                {agentStatus !== 'online' && 'Generando la respuesta clínica adaptada a tu perfil...'}
                {!isRecording && !transcribingAudio && agentStatus === 'online' && 'Pulsa el botón circular para empezar a hablar con Walter.'}
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
