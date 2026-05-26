import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Send, 
  Brain, 
  AlertCircle, 
  Trash2, 
  Paperclip, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Trophy, 
  ClipboardList, 
  Bookmark, 
  Eye,
  Plus,
  Edit3,
  Check,
  Menu,
  Mic,
  MicOff
} from 'lucide-react';

export default function ChatView({ user, profile, dailyMoodToday, onProfileUpdated }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [imageBase64, setImageBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [panelOpen, setPanelOpen] = useState(window.innerWidth >= 1150); // Panel de contexto evolutivo abierto por defecto en desktop
  const [editingConvId, setEditingConvId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [mobileShowSidebar, setMobileShowSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1150);
  const [selectedModel, setSelectedModel] = useState('2.5');
  const [leftPanelOpen, setLeftPanelOpen] = useState(window.innerWidth >= 1150);
  const [closurePrepared, setClosurePrepared] = useState(false);
  const [showBaseHistory, setShowBaseHistory] = useState(false);

  // Estados para edición manual del diagnóstico de la sesión activa
  const [isEditingSessionDiag, setIsEditingSessionDiag] = useState(false);
  const [editSessionFact, setEditSessionFact] = useState('');
  const [editSessionConclusions, setEditSessionConclusions] = useState('');
  const [editSessionExercises, setEditSessionExercises] = useState('');
  const [editSessionStudies, setEditSessionStudies] = useState('');

  // States and refs for intelligent voice transcription
  const [isRecording, setIsRecording] = useState(false);
  const [transcribingAudio, setTranscribingAudio] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const isSendingRef = useRef(false);

  // Start recording audio from microphone
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
        if (audioBlob.size < 1000) {
          return; // Too short
        }

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
      console.error("Error accessing microphone:", err);
      setError("No se pudo acceder al micrófono: " + err.message);
    }
  };

  // Stop recording audio
  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Toggle recording state
  const handleMicClick = () => {
    if (isRecording) {
      stopAudioRecording();
    } else {
      startAudioRecording();
    }
  };

  // Send base64 audio to Edge Function for transcription
  const sendAudioToTranscribe = async (base64Audio) => {
    setTranscribingAudio(true);
    setError(null);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) {
        throw new Error("Sesión de usuario no disponible.");
      }

      const response = await fetch('https://ysnorelkaccaikvuqgnv.supabase.co/functions/v1/chat-terapeuta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          action: 'transcribe_audio',
          audio: base64Audio
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Fallo en la transcripción de audio.");
      }

      const resData = await response.json();
      if (resData && resData.transcription) {
        setInput(prev => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${resData.transcription}` : resData.transcription;
        });
      } else {
        throw new Error("No se pudo obtener el texto transcribido.");
      }
    } catch (err) {
      console.error("Error transcribing audio:", err.message);
      setError("Error en transcripción inteligente: " + err.message);
    } finally {
      setTranscribingAudio(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1150;
      setIsMobile(mobile);
      if (mobile) {
        setPanelOpen(false);
      } else {
        setPanelOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load conversations list on mount
  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setConversations(data || []);
      
      if (data && data.length > 0) {
        setActiveConversationId(data[0].id);
        setMobileShowSidebar(false);
      } else {
        await handleCreateNewConversation(true);
      }
    } catch (err) {
      console.error("Error loading conversations:", err.message);
    }
  };

  // Step 1: Request clinical conclusions, books, studies, and update right panel context
  const handlePrepareClosure = async () => {
    if (!activeConversationId || loading || isSendingRef.current) return;
    if (!confirm("¿Deseas iniciar la preparación del cierre clínico de esta sesión? Walter investigará lo ocurrido, propondrá soluciones, libros y estudios, y los inyectará en el panel de la derecha.")) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;

      const response = await fetch('https://ysnorelkaccaikvuqgnv.supabase.co/functions/v1/chat-terapeuta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          action: 'prepare_close_conversation',
          conversationId: activeConversationId
        })
      });

      if (!response.ok) throw new Error("Error al preparar el informe de cierre");
      const resData = await response.json();
      if (resData && resData.success) {
        setClosurePrepared(true);
        // Reload conversations to sync activeConv
        await loadConversations();
        // Reload messages to display Walter's markdown report in the chat
        await loadMessages(activeConversationId);
        
        if (resData.updatedContext && onProfileUpdated) {
          onProfileUpdated({
            ...profile,
            contexto_terapeutico: resData.updatedContext
          });
        }
      } else {
        throw new Error(resData.error || "Fallo al preparar el cierre");
      }
    } catch (err) {
      console.error("Error preparing closure:", err);
      setError("No se pudo preparar el informe de cierre: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Final confirm and archive
  const handleConfirmCloseSession = async () => {
    if (!activeConversationId || loading || isSendingRef.current) return;
    if (!confirm("¿Confirmas que toda la información clínica ha quedado clara en el panel derecho y deseas archivar permanentemente esta sesión?")) return;

    setLoading(true);
    setError(null);
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      if (!authSession) return;

      const response = await fetch('https://ysnorelkaccaikvuqgnv.supabase.co/functions/v1/chat-terapeuta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`
        },
        body: JSON.stringify({
          action: 'close_conversation',
          conversationId: activeConversationId
        })
      });

      if (!response.ok) throw new Error("Error en el servicio de cierre definitivo");
      const resData = await response.json();
      if (resData && resData.success) {
        alert("Sesión archivada y cerrada con éxito.");
        setClosurePrepared(false);
        await loadConversations();
      } else {
        throw new Error(resData.error || "Fallo al archivar la sesión");
      }
    } catch (err) {
      console.error("Error closing session:", err);
      setError("No se pudo archivar la sesión: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reabrir una sesión archivada/completada para seguir chateando o editando
  const handleReopenConversation = async () => {
    if (!activeConversationId || loading) return;
    if (!confirm("¿Deseas reabrir esta conversación para poder seguir chateando con Walter y modificar su diagnóstico?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ status: 'active', closed_at: null })
        .eq('id', activeConversationId);
        
      if (error) throw error;
      
      setConversations(prev => prev.map(c => 
        c.id === activeConversationId ? { ...c, status: 'active', closed_at: null } : c
      ));
      alert("Sesión reabierta y devuelta a estado activo con éxito.");
    } catch (err) {
      console.error("Error reopening conversation:", err.message);
      setError("No se pudo reabrir la sesión: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Preparar e iniciar la edición del diagnóstico de la sesión actual
  const startEditingSessionDiag = () => {
    if (!activeConv) return;
    setEditSessionFact(activeConv.captured_fact || '');
    setEditSessionConclusions(
      Array.isArray(parseJsonArray(activeConv.conclusions))
        ? parseJsonArray(activeConv.conclusions).join('\n')
        : String(activeConv.conclusions || '')
    );
    setEditSessionExercises(
      Array.isArray(parseJsonArray(activeConv.solutions_exercises))
        ? parseJsonArray(activeConv.solutions_exercises).join('\n')
        : String(activeConv.solutions_exercises || '')
    );
    setEditSessionStudies(activeConv.clinical_studies || '');
    setIsEditingSessionDiag(true);
  };

  // Guardar la edición manual del diagnóstico de la sesión actual en Supabase
  const handleSaveSessionDiagnosis = async (e) => {
    if (e) e.preventDefault();
    if (!activeConversationId) return;

    try {
      const conclusionsArray = editSessionConclusions.split('\n').map(c => c.trim()).filter(Boolean);
      const exercisesArray = editSessionExercises.split('\n').map(s => s.trim()).filter(Boolean);

      const { error } = await supabase
        .from('conversations')
        .update({
          captured_fact: editSessionFact.trim(),
          conclusions: conclusionsArray,
          solutions_exercises: exercisesArray,
          clinical_studies: editSessionStudies.trim()
        })
        .eq('id', activeConversationId);

      if (error) throw error;

      // Actualizar el estado local
      setConversations(prev => prev.map(c => 
        c.id === activeConversationId ? {
          ...c,
          captured_fact: editSessionFact.trim(),
          conclusions: conclusionsArray,
          solutions_exercises: exercisesArray,
          clinical_studies: editSessionStudies.trim()
        } : c
      ));
      setIsEditingSessionDiag(false);
      alert("Diagnóstico de la sesión guardado correctamente.");
    } catch (err) {
      console.error("Error saving session diagnosis:", err.message);
      alert("Error al guardar el diagnóstico: " + err.message);
    }
  };

  // Create new conversation
  const handleCreateNewConversation = async (isInitial = false) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{ user_id: user.id, title: 'Nueva Sesión con Walter' }])
        .select();
      if (error) throw error;
      
      const newConv = data[0];
      
      // Save initial greeting to database
      const greeting = 'Hola Emilio. Soy Walter. Estoy aquí contigo tanto para ayudarte a reprocesar tu ansiedad y tus bloqueos emocionales, como para vigilar de cerca tu gestión de riesgos en el mercado. Recuerda: Lola te necesita sano, estable y en casa, no millonario. ¿Cómo te encuentras hoy en tu habitación? ¿Has tomado tu Atomoxetina?';
      await supabase.from('messages').insert([{
        conversation_id: newConv.id,
        role: 'assistant',
        content: greeting
      }]);

      setConversations(prev => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setMessages([{ role: 'assistant', content: greeting }]);
    } catch (err) {
      console.error("Error creating conversation:", err.message);
    }
  };

  // Load messages for active conversation
  const loadMessages = async (convId) => {
    if (!convId) return;
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Error loading messages:", err.message);
    }
  };

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load messages when activeConversationId changes
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
      setClosurePrepared(false);
    }
  }, [activeConversationId]);

  // Handle file input upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle paste image from clipboard
  const handlePaste = (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setImageBase64(reader.result);
          };
          reader.readAsDataURL(file);
        }
        break;
      }
    }
  };

  // Delete conversation by ID
  const handleDeleteConversation = async (convId) => {
    if (!convId) return;
    if (confirm("¿Estás seguro de que deseas eliminar permanentemente esta sesión de tu historial en Supabase?")) {
      try {
        const { error } = await supabase
          .from('conversations')
          .delete()
          .eq('id', convId);
        if (error) throw error;
        
        const updated = conversations.filter(c => c.id !== convId);
        setConversations(updated);
        
        if (updated.length === 0) {
          setActiveConversationId(null);
          const emptyCtx = { 
            conclusiones: [], 
            compromisos: [], 
            pautas_accion: [], 
            contexto_base: { diagnostico_inicial: '', mecanismos_defensa: '' }, 
            evoluciones: [], 
            temas: [] 
          };
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ contexto_terapeutico: emptyCtx })
            .eq('id', user.id);
            
          if (!profileError && onProfileUpdated) {
            onProfileUpdated({
              ...profile,
              contexto_terapeutico: emptyCtx
            });
          }
          await handleCreateNewConversation(true);
        } else if (convId === activeConversationId) {
          setActiveConversationId(updated[0].id);
        }
      } catch (err) {
        console.error("Error deleting conversation:", err.message);
      }
    }
  };

  const sendMessageToWalter = async (updatedMessages) => {
    setLoading(true);
    setError(null);

    // Prepare history messages payload for API
    const apiMessages = updatedMessages.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.image && { image: msg.image })
    }));

    // Intentar obtener contexto técnico en tiempo real desde el TradingView Desktop local
    let tradingviewContext = null;
    try {
      // Timeout rápido para no bloquear la experiencia de chat
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const stateRes = await fetch('http://localhost:9223/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'chart_get_state' }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (stateRes.ok) {
        const stateData = await stateRes.json();

        // Obtener valores de los estudios/indicadores en paralelo
        const valuesController = new AbortController();
        const valTimeoutId = setTimeout(() => valuesController.abort(), 1200);
        
        const [valRes, quoteRes, linesRes, tablesRes] = await Promise.allSettled([
          fetch('http://localhost:9223/api/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: 'data_get_study_values' }),
            signal: valuesController.signal
          }),
          fetch('http://localhost:9223/api/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: 'quote_get' }),
            signal: valuesController.signal
          }),
          fetch('http://localhost:9223/api/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: 'data_get_pine_lines' }),
            signal: valuesController.signal
          }),
          fetch('http://localhost:9223/api/mcp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tool: 'data_get_pine_tables' }),
            signal: valuesController.signal
          })
        ]);
        clearTimeout(valTimeoutId);

        const valData = valRes.status === 'fulfilled' && valRes.value.ok ? await valRes.value.json() : null;
        const quoteData = quoteRes.status === 'fulfilled' && quoteRes.value.ok ? await quoteRes.value.json() : null;
        const linesData = linesRes.status === 'fulfilled' && linesRes.value.ok ? await linesRes.value.json() : null;
        const tablesData = tablesRes.status === 'fulfilled' && tablesRes.value.ok ? await tablesRes.value.json() : null;

        tradingviewContext = {
          connected: true,
          state: stateData,
          values: valData,
          quote: quoteData,
          pineLines: linesData,
          pineTables: tablesData
        };
      }
    } catch (e) {
      console.log("TradingView Bridge local no disponible en puerto 9223:", e.message);
      tradingviewContext = { connected: false, error: e.message };
    }

    try {
      // Invoke Supabase Edge Function 'chat-terapeuta'
      const { data, error: funcError } = await supabase.functions.invoke('chat-terapeuta', {
        body: { 
          messages: apiMessages,
          currentMood: dailyMoodToday,
          conversationId: activeConversationId,
          tradingviewContext,
          model: selectedModel
        }
      });

      if (funcError) throw funcError;

      if (data && data.reply) {
        // Fallback client-side: limpiar tags <update_context> sin parsear (por seguridad)
        let cleanReply = data.reply;
        const ctxMatch = cleanReply.match(/<update_context>[\s\S]*?<\/update_context>/i);
        if (ctxMatch) {
          cleanReply = cleanReply.replace(/<update_context>[\s\S]*?<\/update_context>/gi, '').trim();
        }

        // Si hay acciones enviadas por Walter (control de la pantalla local de TradingView)
        if (data.actions && Array.isArray(data.actions) && data.actions.length > 0) {
          // Ejecutar secuencialmente cada una de las acciones
          for (const act of data.actions) {
            try {
              console.log("Walter solicita ejecutar acción local en TradingView:", act);
              const actionRes = await fetch('http://localhost:9223/api/mcp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tool: act.tool,
                  arguments: act.arguments
                })
              });
              const actionResult = await actionRes.json();
              console.log("Resultado de la acción ejecutada:", actionResult);
            } catch (actionErr) {
              console.error("Fallo al ejecutar acción local pedida por Walter:", actionErr);
            }
          }
        }

        if (activeConversationId) {
          await loadMessages(activeConversationId);
        }

        // Si se generó un nuevo título, actualizar la conversación
        if (data.generatedTitle) {
          setConversations(prev => prev.map(c => 
            c.id === activeConversationId ? { ...c, title: data.generatedTitle } : c
          ));
        }
        
        if (data.updatedContext && onProfileUpdated) {
          onProfileUpdated({
            ...profile,
            contexto_terapeutico: data.updatedContext
          });
        }
      } else if (data && data.error) {
        throw new Error(data.error);
      } else {
        throw new Error("No se recibió respuesta del servidor.");
      }
    } catch (err) {
      console.error("Error calling therapist Edge Function:", err.message);
      setError("Error al conectar con Walter: " + err.message);
    } finally {
      setLoading(false);
      isSendingRef.current = false;
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !imageBase64) || loading || isSendingRef.current || !activeConversationId) return;

    // Focus Mode: auto-collapse sidebars
    if (!isMobile) {
      setLeftPanelOpen(false);
      setPanelOpen(false);
    }

    isSendingRef.current = true;
    setLoading(true); // Evitar el Double Submit de forma síncrona inmediata

    const userMessage = { 
      role: 'user', 
      content: input.trim(),
      ...(imageBase64 && { image: imageBase64 })
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setImageBase64(null);

    // 1. Guardar mensaje en Supabase
    try {
      await supabase.from('messages').insert([{
        conversation_id: activeConversationId,
        role: 'user',
        content: userMessage.content,
        image: userMessage.image
      }]);
    } catch (err) {
      console.error("Error saving user message:", err.message);
    }

    await sendMessageToWalter(updatedMessages);
  };

  // Capture Walter Audit Trigger from LocalStorage
  useEffect(() => {
    const trigger = localStorage.getItem('walter_audit_trigger');
    if (trigger) {
      localStorage.removeItem('walter_audit_trigger');
      try {
        const data = JSON.parse(trigger);
        const promptText = `Walter, audita mi posición actual en futuros. Símbolo: ${data.symbol}, Dirección: ${data.side === 'LONG' ? 'LARGO (COMPRA)' : 'CORTO (VENTA)'}, Lote/Tamaño: ${Math.abs(parseFloat(data.volume)).toFixed(4)}, Precio Entrada: ${parseFloat(data.entry).toFixed(4)}, Precio Marca: ${parseFloat(data.mark).toFixed(4)}, PnL Flotante actual: ${parseFloat(data.pnl).toFixed(2)} USDT, Apalancamiento: ${data.leverage}x. Por favor, analízame el gráfico y dame tu pauta de price action y gestión de riesgos para no quemar la cuenta.`;
        
        if (activeConversationId) {
          supabase.from('messages').insert([{
            conversation_id: activeConversationId,
            role: 'user',
            content: promptText
          }]).then(() => {
            const userMsg = { role: 'user', content: promptText };
            setMessages(prev => {
              const updated = [...prev, userMsg];
              sendMessageToWalter(updated);
              return updated;
            });
          });
        }
      } catch (err) {
        console.error("Error loading audit trigger:", err);
      }
    }
  }, [activeConversationId]);

  const activeConv = conversations.find(c => c.id === activeConversationId);
  const isClosed = activeConv?.status === 'completed';

  const defaultCtx = { conclusiones: [], compromisos: [], pautas_accion: [] };
  const userCtx = profile?.contexto_terapeutico || defaultCtx;

  const parseJsonArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [String(val)];
    } catch {
      return [String(val)];
    }
  };

  const handleInputFocus = () => {
    if (!isMobile) {
      setLeftPanelOpen(false);
      setPanelOpen(false);
    }
  };

  const renderMessageContent = (content) => {
    if (!content) return null;
    
    const modelRegex = /\[model:(2.5|3.5|5.5-high|deepseek)\]/i;
    const match = content.match(modelRegex);
    let cleanText = content.replace(modelRegex, '').trim();
    let modelName = match ? match[1] : null;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>
          {cleanText}
        </p>
        {modelName && (
          <div style={{ 
            alignSelf: 'flex-start',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.62rem',
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: modelName === 'deepseek' ? '#a78bfa' : (modelName === '5.5-high' ? 'var(--color-emerald)' : (modelName === '3.5' ? 'var(--color-cyan)' : 'var(--text-secondary)')),
            fontWeight: 700,
            marginTop: '4px'
          }}>
            <span>{modelName === 'deepseek' ? '🐳 DeepSeek V4' : (modelName === '5.5-high' ? '💎 GPT 5.5 High' : (modelName === '3.5' ? '🧠 Gemini 3.5' : '⚡ Gemini 2.5'))}</span>
          </div>
        )}
      </div>
    );
  };

  const handleTriggerSpecialAction = async (actionType) => {
    if (loading || isSendingRef.current || !activeConversationId) return;

    // Focus Mode: auto-collapse sidebars
    if (!isMobile) {
      setLeftPanelOpen(false);
      setPanelOpen(false);
    }
    
    let promptText = "";
    if (actionType === 'investigar') {
      promptText = "Walter, realiza una investigación clínica interna con todo lo que sabes sobre mi perfil y la situación de lo que estamos tratando en esta sesión. Etiqueta el resultado con la fecha de hoy y el tema o temas principales correspondientes para organizarlo.";
    } else if (actionType === 'conclusiones') {
      promptText = "Walter, extrae conclusiones detalladas de lo que estamos tratando ahora mismo, basándote en mi historial de memoria y deudas. Etiqueta el resultado con la fecha de hoy y el tema o temas principales correspondientes para organizarlo.";
    } else if (actionType === 'soluciones') {
      promptText = "Walter, propón posibles soluciones o pautas de reset conductual para este conflicto basándote en mi perfil y situación financiera. Etiqueta el resultado con la fecha de hoy y el tema o temas correspondientes para organizarlo.";
    }

    if (!promptText) return;

    isSendingRef.current = true;
    setLoading(true);

    const userMessage = { 
      role: 'user', 
      content: promptText
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    try {
      await supabase.from('messages').insert([{
        conversation_id: activeConversationId,
        role: 'user',
        content: userMessage.content
      }]);
    } catch (err) {
      console.error("Error saving user message:", err.message);
    }

    await sendMessageToWalter(updatedMessages);
  };

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      gap: isMobile ? '0' : '20px', 
      position: 'relative', 
      overflow: 'hidden',
      paddingBottom: isMobile ? '68px' : '0'
    }}>
      
      {/* OVERLAY PARA MÓVIL */}
      {isMobile && (mobileShowSidebar || panelOpen) && (
        <div 
          onClick={() => {
            setMobileShowSidebar(false);
            setPanelOpen(false);
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 999
          }}
        />
      )}

      {/* COLUMNA 1: SIDEBAR DE CONVERSACIONES HISTÓRICAS */}
      <div className="glass-panel" style={{ 
        width: isMobile ? (mobileShowSidebar ? '260px' : '0px') : (leftPanelOpen ? '260px' : '0px'), 
        opacity: isMobile ? (mobileShowSidebar ? 1 : 0) : (leftPanelOpen ? 1 : 0), 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        borderRight: (leftPanelOpen && !isMobile) ? '1px solid var(--border)' : 'none',
        padding: isMobile ? '16px' : (leftPanelOpen ? '16px' : '0px'),
        background: isMobile ? 'rgba(8, 13, 28, 0.98)' : 'rgba(0,0,0,0.15)',
        backdropFilter: isMobile ? 'blur(10px)' : 'none',
        gap: '12px',
        flexShrink: 0,
        position: isMobile ? 'fixed' : 'relative',
        left: isMobile ? (mobileShowSidebar ? '0px' : '-280px') : '0px',
        top: 0,
        zIndex: isMobile ? 1000 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isMobile && mobileShowSidebar ? 'var(--shadow-lg)' : 'none',
        overflow: 'hidden'
      }}>
        <button
          onClick={() => {
            handleCreateNewConversation();
            setMobileShowSidebar(false);
          }}
          className="btn btn-cyan flex-center animate-glow-cyan"
          style={{ width: '100%', gap: '8px', fontSize: '0.78rem', height: '38px', fontWeight: 700 }}
        >
          <Plus size={16} />
          <span>Nueva Sesión</span>
        </button>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 800 }}>
            Historial de Sesiones
          </span>
          {conversations.length === 0 ? (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>
              Sin sesiones registradas
            </p>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isEditing = editingConvId === conv.id;
              const dateStr = new Date(conv.updated_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
              return (
                <div
                  key={conv.id}
                  onClick={() => { 
                    if (!isEditing) {
                      setActiveConversationId(conv.id); 
                      setMobileShowSidebar(false);
                    }
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid ' + (isActive ? 'var(--color-cyan)' : 'var(--border)'),
                    background: isActive ? 'hsla(var(--cyan), 0.08)' : 'rgba(255,255,255,0.01)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                  className="conv-item-hover"
                >
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            (async () => {
                              const trimmed = editingTitle.trim();
                              if (trimmed) {
                                await supabase.from('conversations').update({ title: trimmed }).eq('id', conv.id);
                                setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, title: trimmed } : c));
                              }
                              setEditingConvId(null);
                            })();
                          }
                          if (e.key === 'Escape') setEditingConvId(null);
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          fontSize: '0.76rem',
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid var(--color-cyan)',
                          borderRadius: '4px',
                          color: '#fff',
                          padding: '3px 6px',
                          outline: 'none',
                          minWidth: 0
                        }}
                      />
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          const trimmed = editingTitle.trim();
                          if (trimmed) {
                            await supabase.from('conversations').update({ title: trimmed }).eq('id', conv.id);
                            setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, title: trimmed } : c));
                          }
                          setEditingConvId(null);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-emerald)', padding: '2px', display: 'flex', alignItems: 'center' }}
                        title="Confirmar"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingConvId(null); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-rose)', padding: '2px', display: 'flex', alignItems: 'center' }}
                        title="Cancelar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingConvId(conv.id);
                          setEditingTitle(conv.title || 'Nueva Sesión con Walter');
                        }}
                        style={{ 
                          fontSize: '0.78rem', 
                          fontWeight: isActive ? 700 : 500, 
                          color: isActive ? 'var(--color-cyan)' : '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          flex: 1,
                          cursor: 'text'
                        }}
                        title="Doble clic para editar título"
                      >
                        {conv.title || 'Nueva Sesión con Walter'}
                      </span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          await handleDeleteConversation(conv.id);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px', display: 'flex', alignItems: 'center', opacity: 0.5, transition: 'opacity 0.2s' }}
                        onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.color = 'var(--color-rose)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.opacity = 0.5; e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                        title="Eliminar conversación"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>
                      {dateStr}
                    </span>
                    <span style={{ 
                      fontSize: '0.52rem', 
                      background: conv.status === 'completed' ? 'rgba(255,255,255,0.03)' : 'rgba(6,182,212,0.08)',
                      border: conv.status === 'completed' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(6,182,212,0.25)',
                      color: conv.status === 'completed' ? 'var(--text-tertiary)' : 'var(--color-cyan)',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      fontWeight: 700,
                      letterSpacing: '0.02em'
                    }}>
                      {conv.status === 'completed' ? 'ARCHIVADA' : 'ACTIVA'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      {/* COLUMNA 2: EL CHAT DE WALTER (CENTRAL) */}
      <div className="chat-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', transition: 'all 0.3s ease' }}>
        
        {/* Chat Header */}
        <div className="chat-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '12px 14px' : '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isMobile ? (
              <button 
                onClick={() => setMobileShowSidebar(!mobileShowSidebar)}
                className="btn btn-outline flex-center"
                style={{ padding: 0, height: '36px', width: '36px', minWidth: 0, borderColor: 'var(--border)' }}
                title="Historial de sesiones"
              >
                <Menu size={18} />
              </button>
            ) : (
              <button 
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                className="btn btn-outline flex-center"
                style={{ padding: 0, height: '36px', width: '36px', minWidth: 0, borderColor: leftPanelOpen ? 'var(--color-cyan)' : 'var(--border)' }}
                title="Historial de sesiones"
              >
                <Menu size={18} color={leftPanelOpen ? 'var(--color-cyan)' : 'var(--text-secondary)'} />
              </button>
            )}
            <div className="flex-center" style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: 'var(--radius-md)', 
              background: 'hsla(var(--cyan), 0.1)', 
              border: '1px solid hsla(var(--cyan), 0.25)',
              color: 'var(--color-cyan)'
            }}>
              <Brain size={22} className="animate-pulse-soft" />
            </div>
            <div>
              {editingConvId === activeConversationId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const trimmed = editingTitle.trim();
                        if (trimmed) {
                          await supabase.from('conversations').update({ title: trimmed }).eq('id', activeConversationId);
                          setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, title: trimmed } : c));
                        }
                        setEditingConvId(null);
                      }
                      if (e.key === 'Escape') setEditingConvId(null);
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      fontSize: '0.8rem',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--color-cyan)',
                      borderRadius: '4px',
                      color: '#ffffff',
                      padding: '2px 6px',
                      outline: 'none'
                    }}
                  />
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const trimmed = editingTitle.trim();
                      if (trimmed) {
                        await supabase.from('conversations').update({ title: trimmed }).eq('id', activeConversationId);
                        setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, title: trimmed } : c));
                      }
                      setEditingConvId(null);
                    }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-emerald)' }}
                  >
                    <Check size={14} />
                  </button>
                </div>
              ) : (
                <h4 
                  onDoubleClick={() => {
                    if (activeConversationId) {
                      setEditingConvId(activeConversationId);
                      setEditingTitle(activeConv?.title || 'Nueva Sesión con Walter');
                    }
                  }}
                  style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, cursor: 'text' }}
                  title="Doble clic para editar título"
                >
                  {activeConv?.title || 'Nueva Sesión con Walter'}
                </h4>
              )}
              <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: 0 }}>
                {isMobile ? 'Walter' : 'Walter — Psicólogo Clínico & Gestor de Riesgo'}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '2px', height: '36px', alignItems: 'center', gap: '2px' }}>
              <button 
                type="button"
                onClick={() => setSelectedModel('2.5')}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  background: selectedModel === '2.5' ? 'hsla(var(--cyan), 0.08)' : 'transparent',
                  border: 'none',
                  borderRadius: '3px',
                  color: selectedModel === '2.5' ? 'var(--color-cyan)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  height: '100%',
                  transition: 'all 0.2s ease'
                }}
                title="Gemini 2.5 Flash - Rápido y ultra-económico"
              >
                ⚡ 2.5
              </button>
              <button 
                type="button"
                onClick={() => setSelectedModel('3.5')}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  background: selectedModel === '3.5' ? 'hsla(var(--cyan), 0.08)' : 'transparent',
                  border: 'none',
                  borderRadius: '3px',
                  color: selectedModel === '3.5' ? 'var(--color-cyan)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  height: '100%',
                  transition: 'all 0.2s ease'
                }}
                title="Gemini 3.5 Flash - Conclusiones y Razonamiento clínico"
              >
                🧠 3.5
              </button>
              <button 
                type="button"
                onClick={() => setSelectedModel('5.5-high')}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  background: selectedModel === '5.5-high' ? 'rgba(16,185,129,0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '3px',
                  color: selectedModel === '5.5-high' ? 'var(--color-emerald)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  height: '100%',
                  transition: 'all 0.2s ease'
                }}
                title="GPT 5.5 High - Modelo premium de alto nivel"
              >
                💎 5.5 High
              </button>
              <button 
                type="button"
                onClick={() => setSelectedModel('deepseek')}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  background: selectedModel === 'deepseek' ? 'rgba(167,139,250,0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '3px',
                  color: selectedModel === 'deepseek' ? '#a78bfa' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  height: '100%',
                  transition: 'all 0.2s ease'
                }}
                title="DeepSeek V4 Pro - Reflexiones clínicas profundas"
              >
                🐳 DeepSeek
              </button>
            </div>

            {!isClosed && (
              <button 
                onClick={closurePrepared ? handleConfirmCloseSession : handlePrepareClosure}
                className={`btn ${closurePrepared ? 'btn-cyan animate-glow-cyan' : 'btn-outline'} flex-center`}
                title={closurePrepared ? "Confirmar y archivar esta conversación" : "Preparar cierre clínico de sesión"}
                style={{ 
                  padding: isMobile ? '8px' : '8px 14px', 
                  borderRadius: 'var(--radius-sm)', 
                  height: '36px', 
                  gap: '6px', 
                  fontSize: '0.72rem', 
                  borderColor: closurePrepared ? 'transparent' : 'var(--color-cyan)', 
                  color: closurePrepared ? '#ffffff' : 'var(--color-cyan)',
                  fontWeight: 700
                }}
                disabled={loading}
              >
                {closurePrepared ? '🔒 Confirmar y Archivar' : '🔒 Preparar Cierre'}
              </button>
            )}
            <button 
              onClick={() => handleDeleteConversation(activeConversationId)}
              className="btn btn-outline flex-center"
              title="Eliminar esta conversación de Supabase"
              style={{ padding: '8px', borderRadius: 'var(--radius-sm)', height: '36px', width: '36px', minWidth: 0, borderColor: 'hsla(var(--rose), 0.3)', color: 'var(--color-rose)' }}
            >
              <Trash2 size={16} />
            </button>
            <button 
              onClick={() => setPanelOpen(!panelOpen)}
              className="btn btn-outline flex-center"
              title={panelOpen ? "Ocultar contexto de la mente" : "Ver contexto de la mente"}
              style={{ padding: '8px', borderRadius: 'var(--radius-sm)', height: '36px', gap: '6px', fontSize: '0.72rem', borderColor: panelOpen ? 'var(--color-cyan)' : 'var(--border)' }}
            >
              <Eye size={16} color={panelOpen ? 'var(--color-cyan)' : 'var(--text-secondary)'} />
              {!isMobile && <span>Memoria</span>}
            </button>
          </div>
        </div>

        {/* Messages list */}
        <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-bubble ${msg.role}`} style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: '10px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: msg.role === 'user' ? '#ffffff' : 'var(--color-cyan)', textTransform: 'uppercase' }}>
                  {msg.role === 'user' ? 'Emilio' : 'Walter'}
                </span>
              </div>
              
              {/* Image attachment rendering */}
              {msg.image && (
                <div style={{ marginBottom: '8px', maxWidth: '320px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <img src={msg.image} alt="Adjunto de Emilio" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
              )}

              {renderMessageContent(msg.content)}
            </div>
          ))}

          {loading && (
            <div className="chat-bubble assistant" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--color-cyan)', textTransform: 'uppercase', display: 'block', marginRight: '6px' }}>Walter</span>
              <div className="flex-center" style={{ gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-cyan)', animation: 'pulse-soft 1s infinite alternate' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-cyan)', animation: 'pulse-soft 1s infinite alternate 0.2s' }} />
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-cyan)', animation: 'pulse-soft 1s infinite alternate 0.4s' }} />
              </div>
            </div>
          )}

          {error && (
            <div className="flex-center" style={{ 
              alignSelf: 'center', 
              background: 'hsla(var(--rose), 0.1)', 
              border: '1px solid hsla(var(--rose), 0.25)', 
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-rose)',
              fontSize: '0.78rem',
              gap: '8px',
              maxWidth: '85%'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {isClosed && activeConv && (
            <div className="glass-panel" style={{ 
              margin: '20px 0', 
              padding: '20px', 
              background: 'linear-gradient(135deg, rgba(6,182,212,0.04), rgba(15,23,42,0.6))', 
              border: '1px solid var(--color-cyan)', 
              borderRadius: '12px',
              boxShadow: 'var(--shadow-cyan)'
            }}>
              <h5 style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-cyan)', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🧠 Informe Clínico de Cierre (Walter)</span>
              </h5>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.78rem' }}>
                <div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>Hecho Clínico Capturado</span>
                  <p style={{ color: '#ffffff', margin: 0, lineHeight: 1.4 }}>{activeConv.captured_fact || "Ninguno registrado."}</p>
                </div>
                
                <div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Conclusiones de la Sesión</span>
                  <ul style={{ margin: 0, paddingLeft: '14px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(() => {
                      if (!activeConv.conclusions) return <li>Sin conclusiones cargadas.</li>;
                      try {
                        const list = typeof activeConv.conclusions === 'string' ? JSON.parse(activeConv.conclusions) : activeConv.conclusions;
                        return Array.isArray(list) ? list.map((c, i) => <li key={i}>{c}</li>) : <li>{String(activeConv.conclusions)}</li>;
                      } catch {
                        return <li>{String(activeConv.conclusions)}</li>;
                      }
                    })()}
                  </ul>
                </div>

                <div>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>Soluciones & Ejercicios Prescritos</span>
                  <ul style={{ margin: 0, paddingLeft: '14px', color: 'var(--color-emerald)', display: 'flex', flexDirection: 'column', gap: '4px', fontWeight: 600 }}>
                    {(() => {
                      if (!activeConv.solutions_exercises) return <li>Sin ejercicios asignados.</li>;
                      try {
                        const list = typeof activeConv.solutions_exercises === 'string' ? JSON.parse(activeConv.solutions_exercises) : activeConv.solutions_exercises;
                        return Array.isArray(list) ? list.map((s, i) => <li key={i}>{s}</li>) : <li>{String(activeConv.solutions_exercises)}</li>;
                      } catch {
                        return <li>{String(activeConv.solutions_exercises)}</li>;
                      }
                    })()}
                  </ul>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 700, marginBottom: '2px' }}>Estudios Clínicos & Casos de Referencia</span>
                  <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45, fontStyle: 'italic' }}>
                    {activeConv.clinical_studies || "Estudio general sobre TDAH y trauma."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--background-secondary)', padding: '16px', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
          {isClosed ? (
            <div className="glass-panel flex-center" style={{ 
              padding: '16px', 
              background: 'rgba(255, 255, 255, 0.01)', 
              borderColor: 'var(--border)', 
              borderRadius: 'var(--radius-md)',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                🔒 <strong>Sesión Archivada y Cerrada.</strong> Se han consolidado el hecho y las conclusiones clínicas en el área de Salud y Mente.
              </span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button 
                  onClick={() => handleCreateNewConversation()}
                  className="btn btn-cyan animate-glow-cyan" 
                  style={{ height: '32px', fontSize: '0.72rem', padding: '0 16px', fontWeight: 700 }}
                >
                  + Nueva Conversación / Tema
                </button>
                <button 
                  onClick={handleReopenConversation}
                  className="btn btn-outline" 
                  style={{ height: '32px', fontSize: '0.72rem', padding: '0 16px', fontWeight: 700, borderColor: 'rgba(6,182,212,0.3)', color: 'var(--color-cyan)' }}
                >
                  🔓 Reabrir Sesión
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Botones de Acción Clínica Rápida */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                <button 
                  type="button" 
                  onClick={() => handleTriggerSpecialAction('investigar')}
                  className="btn btn-outline flex-center"
                  style={{ fontSize: '0.7rem', height: '28px', padding: '0 12px', borderRadius: 'var(--radius-sm)', borderColor: 'rgba(6,182,212,0.3)', color: 'var(--color-cyan)', fontWeight: 700, gap: '4px' }}
                  disabled={loading}
                >
                  🔍 Investigar Contexto
                </button>
                <button 
                  type="button" 
                  onClick={() => handleTriggerSpecialAction('conclusiones')}
                  className="btn btn-outline flex-center"
                  style={{ fontSize: '0.7rem', height: '28px', padding: '0 12px', borderRadius: 'var(--radius-sm)', borderColor: 'rgba(16,185,129,0.3)', color: 'var(--color-emerald)', fontWeight: 700, gap: '4px' }}
                  disabled={loading}
                >
                  📋 Extraer Conclusiones
                </button>
                <button 
                  type="button" 
                  onClick={() => handleTriggerSpecialAction('soluciones')}
                  className="btn btn-outline flex-center"
                  style={{ fontSize: '0.7rem', height: '28px', padding: '0 12px', borderRadius: 'var(--radius-sm)', borderColor: 'rgba(244,63,94,0.3)', color: 'var(--color-rose)', fontWeight: 700, gap: '4px' }}
                  disabled={loading}
                >
                  💡 Posibles Soluciones
                </button>
              </div>

              {/* Miniatura de imagen seleccionada */}
              {imageBase64 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: '12px', width: 'fit-content' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <img src={imageBase64} alt="Previsualización" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Captura lista para enviar</span>
                  <button 
                    type="button" 
                    onClick={() => setImageBase64(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', color: 'var(--color-rose)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <form onSubmit={handleSend} className="chat-input-area" style={{ display: 'flex', gap: '10px', margin: 0, padding: 0, border: 'none', background: 'none' }}>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-outline flex-center"
                  title="Adjuntar Imagen o Captura"
                  style={{ width: '46px', height: '46px', padding: 0, borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
                >
                  <Paperclip size={18} />
                </button>

                <button
                  type="button"
                  onClick={handleMicClick}
                  className={`btn ${isRecording ? 'btn-danger animate-pulse-soft' : 'btn-outline'} flex-center`}
                  title={isRecording ? "Grabando voz... Haz clic para transcribir" : "Dictar mensaje por voz (inteligente)"}
                  disabled={loading || transcribingAudio}
                  style={{ 
                    width: '46px', 
                    height: '46px', 
                    padding: 0, 
                    borderRadius: 'var(--radius-sm)', 
                    flexShrink: 0,
                    backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                    borderColor: isRecording ? '#ef4444' : 'var(--border)',
                    color: isRecording ? '#ef4444' : 'var(--text-secondary)',
                    position: 'relative'
                  }}
                >
                  {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                  {isRecording && (
                    <span style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ef4444',
                      animation: 'pulse 1s infinite'
                    }} />
                  )}
                </button>

                <input 
                  type="text" 
                  className="chat-input" 
                  placeholder={transcribingAudio ? "🧠 Walter transcribiendo y organizando audio..." : "Escribe tu mensaje a Walter o habla por micrófono..."}
                  value={transcribingAudio ? "" : input}
                  onChange={(e) => setInput(e.target.value)}
                  onPaste={handlePaste}
                  onFocus={handleInputFocus}
                  disabled={loading || transcribingAudio}
                  style={{ 
                    flex: 1,
                    fontStyle: transcribingAudio ? 'italic' : 'normal',
                    color: transcribingAudio ? 'var(--color-cyan)' : 'var(--text-primary)'
                  }}
                />
                <button 
                  type="submit" 
                  className="btn btn-cyan animate-glow-cyan" 
                  disabled={loading || (!input.trim() && !imageBase64)}
                  style={{ width: '46px', height: '46px', padding: 0, borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      {/* SECCIÓN DERECHA: PANEL DE CONTEXTO EVOLUTIVO DE EMILIO (MEMORIA) */}
      <div 
        className="glass-panel" 
        style={{ 
          width: isMobile ? '300px' : (panelOpen ? '320px' : '0px'), 
          opacity: panelOpen ? 1 : 0, 
          overflow: 'hidden', 
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          borderLeft: (panelOpen && !isMobile) ? '1px solid var(--border)' : 'none',
          padding: panelOpen ? '20px' : '0px',
          position: isMobile ? 'fixed' : 'relative',
          right: isMobile ? (panelOpen ? '0px' : '-320px') : '0px',
          top: 0,
          zIndex: isMobile ? 1000 : 1,
          background: isMobile ? 'rgba(8, 13, 28, 0.98)' : 'rgba(8, 13, 28, 0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
          <Brain size={18} color="var(--color-cyan)" />
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', margin: 0, whiteSpace: 'nowrap' }}>
            Contexto Clínico & Memoria
          </h4>
        </div>

        {/* COMPONENTE COMPACTO: ESTADO DEL PACIENTE */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '14px',
          fontSize: '0.72rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800, color: '#ffffff' }}>Emilio José Naranjo</span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>47 años</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Ánimo hoy:</span>
            {dailyMoodToday ? (
              <span style={{ 
                fontWeight: 700, 
                color: dailyMoodToday.score > 7 ? 'var(--color-emerald)' : (dailyMoodToday.score > 4 ? 'var(--color-cyan)' : 'var(--color-rose)') 
              }}>
                {dailyMoodToday.score}/10 {dailyMoodToday.score > 7 ? '🟢' : (dailyMoodToday.score > 4 ? '🟡' : '🔴')}
              </span>
            ) : (
              <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Sin registrar</span>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Modelo de Chat:</span>
            <span style={{ fontWeight: 700, color: 'var(--color-cyan)' }}>
              {selectedModel === 'deepseek' ? '🐳 DeepSeek V4' : (selectedModel === '5.5-high' ? '💎 GPT 5.5' : (selectedModel === '3.5' ? '🧠 Gemini 3.5' : '⚡ Gemini 2.5'))}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Riesgo de Trading:</span>
            <span style={{ fontWeight: 700, color: 'var(--color-emerald)' }}>
              Controlado
            </span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* SECCIÓN ÚNICA: DIAGNÓSTICO DE ESTA SESIÓN */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(6,182,212,0.06), rgba(15,23,42,0.8))', 
            border: '1px solid rgba(6,182,212,0.25)', 
            borderRadius: 'var(--radius-md)', 
            padding: '16px',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(6,182,212,0.15)', paddingBottom: '10px', color: 'var(--color-cyan)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={16} />
                <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diagnóstico de esta Sesión</span>
              </div>
              {activeConv && !isEditingSessionDiag && (
                <button 
                  onClick={startEditingSessionDiag}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-cyan)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    borderRadius: '4px'
                  }}
                  className="conv-item-hover"
                  title="Editar diagnóstico manualmente"
                >
                  <Edit3 size={14} />
                </button>
              )}
            </div>
            
            {isEditingSessionDiag ? (
              <form onSubmit={handleSaveSessionDiagnosis} style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.72rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '2px', fontSize: '0.58rem', textTransform: 'uppercase' }}>Foco / Hecho Clínico</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={editSessionFact} 
                    onChange={(e) => setEditSessionFact(e.target.value)} 
                    style={{ width: '100%', fontSize: '0.72rem', height: '28px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0 8px', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '2px', fontSize: '0.58rem', textTransform: 'uppercase' }}>Conclusiones (una por línea)</label>
                  <textarea 
                    rows="3" 
                    className="form-input" 
                    value={editSessionConclusions} 
                    onChange={(e) => setEditSessionConclusions(e.target.value)} 
                    style={{ width: '100%', fontSize: '0.72rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px 8px', resize: 'none', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '2px', fontSize: '0.58rem', textTransform: 'uppercase' }}>Ejercicios o Soluciones (uno por línea)</label>
                  <textarea 
                    rows="3" 
                    className="form-input" 
                    value={editSessionExercises} 
                    onChange={(e) => setEditSessionExercises(e.target.value)} 
                    style={{ width: '100%', fontSize: '0.72rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px 8px', resize: 'none', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: '2px', fontSize: '0.58rem', textTransform: 'uppercase' }}>Investigación Relacionada</label>
                  <textarea 
                    rows="3" 
                    className="form-input" 
                    value={editSessionStudies} 
                    onChange={(e) => setEditSessionStudies(e.target.value)} 
                    style={{ width: '100%', fontSize: '0.72rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '6px 8px', resize: 'none', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button type="submit" className="btn btn-cyan" style={{ flex: 1, fontSize: '0.68rem', height: '26px' }}>Guardar</button>
                  <button type="button" onClick={() => setIsEditingSessionDiag(false)} className="btn btn-outline" style={{ flex: 1, fontSize: '0.68rem', height: '26px' }}>Cancelar</button>
                </div>
              </form>
            ) : activeConv && (activeConv.captured_fact || activeConv.conclusions || activeConv.solutions_exercises || activeConv.clinical_studies) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.72rem' }}>
                {activeConv.captured_fact && (
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(6,182,212,0.02))', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    borderLeft: '4px solid var(--color-cyan)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.58rem', color: 'var(--color-cyan)', display: 'block', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Foco / Hecho Clínico</span>
                    </div>
                    <strong style={{ color: '#ffffff', fontSize: '0.76rem', lineHeight: 1.4, display: 'block' }}>{activeConv.captured_fact}</strong>
                  </div>
                )}
                
                {activeConv.conclusions && parseJsonArray(activeConv.conclusions).length > 0 && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 800, marginBottom: '8px', letterSpacing: '0.05em' }}>Conclusiones</span>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {parseJsonArray(activeConv.conclusions).map((c, i) => (
                        <li key={i} style={{ 
                          lineHeight: 1.4, 
                          background: 'rgba(255,255,255,0.01)', 
                          padding: '6px 8px', 
                          borderRadius: '4px', 
                          border: '1px solid rgba(255,255,255,0.02)',
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span style={{ color: 'var(--text-primary)' }}>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {activeConv.solutions_exercises && parseJsonArray(activeConv.solutions_exercises).length > 0 && (
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.01))', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(16,185,129,0.2)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <span style={{ fontSize: '0.58rem', color: 'var(--color-emerald)', display: 'block', textTransform: 'uppercase', fontWeight: 800, marginBottom: '8px', letterSpacing: '0.05em' }}>Ejercicios o Soluciones</span>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {parseJsonArray(activeConv.solutions_exercises).map((s, i) => (
                        <li key={i} style={{ 
                          lineHeight: 1.4, 
                          background: 'rgba(16,185,129,0.02)', 
                          padding: '6px 8px', 
                          borderRadius: '4px', 
                          border: '1px solid rgba(16,185,129,0.05)',
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          gap: '6px',
                          fontWeight: 600
                        }}>
                          <span style={{ color: 'var(--color-emerald)' }}>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {activeConv.clinical_studies && (
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.01)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '8px',
                    padding: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', display: 'block', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>Investigación Relacionada</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45, fontStyle: 'italic' }}>
                      {activeConv.clinical_studies}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 16px',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.01)',
                borderRadius: '8px',
                border: '1px dashed rgba(255, 255, 255, 0.1)',
                gap: '12px',
                marginTop: '8px'
              }}>
                <Brain size={32} style={{ color: 'rgba(6,182,212,0.4)', animation: 'pulse-soft 2s infinite alternate' }} />
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Sesión en Curso
                </div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  Walter está analizando activamente tu TDAH, impulsividad y operativa en esta conversación.
                </p>
                <p style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.4, fontStyle: 'italic' }}>
                  Pulsa los botones inferiores ("Investigar Contexto", "Extraer Conclusiones" o "🔒 Preparar Cierre") para consolidar el diagnóstico de esta sesión.
                </p>
              </div>
            )}
          </div>

          {/* ACCORDEÓN COLAPSIBLE: MEMORIA HISTÓRICA (MENTE) */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            marginTop: '8px'
          }}>
            <button
              type="button"
              onClick={() => setShowBaseHistory(!showBaseHistory)}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.01)',
                border: 'none',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--color-cyan)',
                fontWeight: 800,
                fontSize: '0.74rem',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={14} />
                <span>Memoria General (Mente)</span>
              </div>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
                {showBaseHistory ? '▼ Ocultar' : '▲ Mostrar'}
              </span>
            </button>
            
            {showBaseHistory && (
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.7rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div>
                  <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>Diagnóstico Base</span>
                  <p style={{ color: 'var(--text-primary)', margin: 0, lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
                    {userCtx.contexto_base?.diagnostico_inicial || "Sin registrar"}
                  </p>
                </div>
                {userCtx.contexto_base?.mecanismos_defensa && Array.isArray(userCtx.contexto_base.mecanismos_defensa) && userCtx.contexto_base.mecanismos_defensa.length > 0 && (
                  <div>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px' }}>Mecanismos de Defensa</span>
                    <ul style={{ margin: 0, paddingLeft: '14px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {userCtx.contexto_base.mecanismos_defensa.map((d, idx) => (
                        <li key={idx} style={{ lineHeight: 1.4 }}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '14px', fontSize: '0.62rem', color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
          * Este contexto se actualiza en tiempo real al consolidar o preparar el informe clínico para dar continuidad y proactividad.
        </div>
      </div>

      {/* FLOATING HANDLES PARA DESPLEGAR DESDE MODO ENFOQUE */}
      {!leftPanelOpen && !isMobile && (
        <button 
          onClick={() => setLeftPanelOpen(true)}
          style={{
            position: 'absolute',
            left: '0px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'rgba(6,182,212,0.08)',
            border: '1px solid rgba(6,182,212,0.25)',
            borderLeft: 'none',
            borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
            width: '24px',
            height: '48px',
            color: 'var(--color-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-cyan)',
            transition: 'all 0.2s ease',
            padding: 0
          }}
          title="Mostrar historial de sesiones"
        >
          <ChevronRight size={14} />
        </button>
      )}

      {!panelOpen && !isMobile && (
        <button 
          onClick={() => setPanelOpen(true)}
          style={{
            position: 'absolute',
            right: '0px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 10,
            background: 'rgba(6,182,212,0.08)',
            border: '1px solid rgba(6,182,212,0.25)',
            borderRight: 'none',
            borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
            width: '24px',
            height: '48px',
            color: 'var(--color-cyan)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-cyan)',
            transition: 'all 0.2s ease',
            padding: 0
          }}
          title="Mostrar memoria y contexto clínico"
        >
          <ChevronLeft size={14} />
        </button>
      )}

    </div>
  );
}
