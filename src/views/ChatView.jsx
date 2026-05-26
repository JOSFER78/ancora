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

  // Close clinical session and extract conclusions
  const handleCloseSession = async () => {
    if (!activeConversationId) return;
    if (!confirm("¿Deseas dar por finalizada esta sesión y pedir a Walter que extraiga las conclusiones y pautas clínicas? El chat quedará archivado.")) return;
    
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

      if (!response.ok) throw new Error("Error en el servicio de cierre");
      const resData = await response.json();
      if (resData && resData.success) {
        alert("Sesión archivada y conclusiones extraídas con éxito.");
        await loadConversations();
      } else {
        throw new Error(resData.error || "Fallo al archivar");
      }
    } catch (err) {
      console.error("Error closing session:", err);
      setError("No se pudo cerrar la sesión: " + err.message);
    } finally {
      setLoading(false);
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
          tradingviewContext
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
        width: '260px', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        borderRight: '1px solid var(--border)',
        padding: '16px',
        background: isMobile ? 'rgba(8, 13, 28, 0.98)' : 'rgba(0,0,0,0.15)',
        backdropFilter: isMobile ? 'blur(10px)' : 'none',
        gap: '12px',
        flexShrink: 0,
        position: isMobile ? 'fixed' : 'relative',
        left: isMobile ? (mobileShowSidebar ? '0px' : '-280px') : '0px',
        top: 0,
        zIndex: isMobile ? 1000 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: isMobile && mobileShowSidebar ? 'var(--shadow-lg)' : 'none'
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
            {isMobile && (
              <button 
                onClick={() => setMobileShowSidebar(!mobileShowSidebar)}
                className="btn btn-outline flex-center"
                style={{ padding: 0, height: '36px', width: '36px', minWidth: 0, borderColor: 'var(--border)' }}
                title="Historial de sesiones"
              >
                <Menu size={18} />
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
            {!isClosed && (
              <button 
                onClick={handleCloseSession}
                className="btn btn-outline flex-center"
                title="Dar por finalizada esta sesión y extraer conclusiones de Walter"
                style={{ 
                  padding: isMobile ? '8px' : '8px 14px', 
                  borderRadius: 'var(--radius-sm)', 
                  height: '36px', 
                  gap: '6px', 
                  fontSize: '0.72rem', 
                  borderColor: 'var(--color-cyan)', 
                  color: 'var(--color-cyan)',
                  fontWeight: 700
                }}
                disabled={loading}
              >
                🔒 {!isMobile && <span>Finalizar Sesión</span>}
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
            <div key={idx} className={`chat-bubble ${msg.role}`}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
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

              <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>{msg.content}</p>
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
              <button 
                onClick={() => handleCreateNewConversation()}
                className="btn btn-cyan animate-glow-cyan" 
                style={{ height: '32px', fontSize: '0.72rem', padding: '0 16px', fontWeight: 700 }}
              >
                + Nueva Conversación / Tema
              </button>
            </div>
          ) : (
            <>
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
                  disabled={loading || transcribingAudio}
                  style={{ 
                    flex: 1,
                    fontStyle: transcribingAudio ? 'italic' : 'normal',
                    color: transcribingAudio ? 'var(--color-cyan)' : 'var(--text-primary)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const marketPrompt = 'Dame un análisis rápido del mercado: XAUUSD, BTCUSD, EURUSD. Necesito precios actuales y tu perspectiva.';
                    setInput(marketPrompt);
                    setTimeout(() => {
                      const form = document.querySelector('.chat-input-area');
                      if (form) form.requestSubmit();
                    }, 50);
                  }}
                  className="btn btn-outline flex-center"
                  title="Análisis rápido de mercado"
                  disabled={loading}
                  style={{ width: '46px', height: '46px', padding: 0, borderRadius: 'var(--radius-sm)', flexShrink: 0, fontSize: '1.2rem' }}
                >
                  📊
                </button>
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
          background: isMobile ? 'rgba(8, 13, 28, 0.98)' : 'rgba(0,0,0,0.15)',
          backdropFilter: isMobile ? 'blur(10px)' : 'none',
          boxShadow: isMobile && panelOpen ? 'var(--shadow-lg)' : 'none'
        }}
      >        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px' }}>
          <Brain size={18} color="var(--color-cyan)" />
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', margin: 0, whiteSpace: 'nowrap' }}>
            Contexto Clínico & Memoria
          </h4>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* A. Conclusiones Clínicas */}
          <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--color-cyan)' }}>
              <Bookmark size={15} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Conclusiones de Walter</span>
            </div>
            
            {(!userCtx.conclusiones || userCtx.conclusiones.length === 0) ? (
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: 0, fontStyle: 'italic' }}>
                Ninguna conclusión guardada. Walter extraerá pautas de comportamiento de Emilio a medida que converséis.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {userCtx.conclusiones.map((c, idx) => (
                  <li key={idx} style={{ lineHeight: 1.4 }}>{c}</li>
                ))}
              </ul>
            )}
          </div>

          {/* B. Compromisos de Operativa */}
          <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--color-emerald)' }}>
              <Trophy size={15} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Compromisos de Operativa</span>
            </div>
            
            {(!userCtx.compromisos || userCtx.compromisos.length === 0) ? (
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: 0, fontStyle: 'italic' }}>
                No hay compromisos activos. Emilio debe acordar límites estrictos de gestión de riesgo con Walter.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {userCtx.compromisos.map((c, idx) => (
                  <li key={idx} style={{ lineHeight: 1.4, fontWeight: 600, color: 'var(--color-emerald)' }}>{c}</li>
                ))}
              </ul>
            )}
          </div>

          {/* C. Pautas de Acción Prescritas */}
          <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', color: 'var(--color-rose)' }}>
              <ClipboardList size={15} />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pautas de Reset</span>
            </div>
            
            {(!userCtx.pautas_accion || userCtx.pautas_accion.length === 0) ? (
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: 0, fontStyle: 'italic' }}>
                Ninguna pauta configurada. Usa técnicas conductuales cuando sientas ansiedad extrema.
              </p>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {userCtx.pautas_accion.map((p, idx) => (
                  <li key={idx} style={{ lineHeight: 1.4 }}>{p}</li>
                ))}
              </ul>
            )}
          </div>

        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '14px', fontSize: '0.62rem', color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
          * Este contexto se almacena cifrado en Supabase y se alimenta dinámicamente de vuestras sesiones para dar continuidad y proactividad clínica.
        </div>
      </div>

    </div>
  );
}
