import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { invokeChatTerapeuta } from '../../lib/chatTerapeuta';
import { 
  Send, Mic, MicOff, AlertTriangle, Bot, User, 
  Sparkles, Clock, RefreshCw, Volume2, ShieldAlert
} from 'lucide-react';

export default function PacienteChatView({ profile, user, onProfileUpdated }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [transcribingAudio, setTranscribingAudio] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [agentStatus, setAgentStatus] = useState('online'); // 'online' | 'typing' | 'updating'
  const [minutesUsed, setMinutesUsed] = useState(4); // 4 de 15 min usados
  const [showCrisisPlan, setShowCrisisPlan] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const isSendingRef = useRef(false);

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
            title: 'Nueva Sesión con Walter', 
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
      const formatted = (data || []).map(m => ({
        id: m.id,
        sender: m.role === 'user' ? 'user' : 'bot',
        text: String(m.content || '').replace(/\[model:.*?\]/g, '').trim(),
        time: new Date(m.created_at).toLocaleTimeString().substring(0, 5)
      }));

      // Si no hay mensajes, inyectar el saludo inicial
      if (formatted.length === 0) {
        setMessages([
          {
            id: 'init-1',
            sender: 'bot',
            text: 'Hola, soy tu acompañante de diario guiado. Estoy aquí para escucharte y ayudarte a estructurar lo que te preocupa para tu próxima sesión.',
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
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

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
      const { error: saveUserErr } = await supabase
        .from('messages')
        .insert([{
          conversation_id: activeConversationId,
          role: 'user',
          content: textToSend
        }]);

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
      const resData = await invokeChatTerapeuta({
        conversationId: activeConversationId,
        messages: dbHistory || [],
        model: 'free'
      });

      if (resData && resData.reply) {
        // Recargar mensajes de la base de datos para sincronizar
        await loadMessages(activeConversationId);

        // Actualizar contexto y perfil en caliente si es necesario
        if (resData.updatedContext && onProfileUpdated) {
          onProfileUpdated({
            ...profile,
            contexto_terapeutico: resData.updatedContext
          });
        }
      } else {
        throw new Error(resData?.error || "Respuesta vacía del servidor.");
      }
    } catch (err) {
      console.error("Error sending message to Hermes:", err.message);
      setError("Error al conectar con Walter: " + err.message);
      
      // Mostrar mensaje de error en UI
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'bot',
        text: "Lo siento, he tenido dificultades para sincronizar tu mensaje. Por favor, asegúrate de que tu conexión a internet sea estable.",
        time: new Date().toLocaleTimeString().substring(0, 5)
      }]);
    } finally {
      setAgentStatus('online');
      isSendingRef.current = false;
      setMinutesUsed(m => Math.min(15, m + 1));
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
        setInputVal(prev => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${resData.transcription}` : resData.transcription;
        });
      } else {
        throw new Error("No se obtuvo transcripción legible.");
      }
    } catch (err) {
      console.error("Transcription error:", err.message);
      setError("Error de transcripción: " + err.message);
    } finally {
      setTranscribingAudio(false);
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      stopAudioRecording();
    } else {
      startAudioRecording();
    }
  };

  return (
    <div className="glass-panel" style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Cabecera del Chat */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(68,125,130,0.1)', border: '1px solid rgba(68,125,130,0.3)', color: 'var(--color-cyan)' }}>
            <Bot size={22} className={agentStatus === 'typing' || transcribingAudio ? 'animate-bounce' : ''} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Walter <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-emerald)' }} />
            </h3>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              {agentStatus === 'online' && !transcribingAudio && 'Listo para escucharte'}
              {agentStatus === 'typing' && 'Pensando respuesta clínica...'}
              {agentStatus === 'updating' && 'Actualizando memoria en Supabase...'}
              {transcribingAudio && 'Transcribiendo audio de voz a texto...'}
            </span>
          </div>
        </div>

        {/* Limitador de minutos diarios */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', display: 'block', textTransform: 'uppercase' }}>Minutos de chat hoy</span>
            <strong style={{ fontSize: '0.78rem', color: '#ffffff' }}>{minutesUsed} / 15 min usados</strong>
          </div>
          <div style={{ width: '70px', height: '6px', background: 'var(--background-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${(minutesUsed / 15) * 100}%`, height: '100%', background: 'var(--color-cyan)', transition: 'width 0.3s' }} />
          </div>
        </div>

        {/* Botón de crisis de emergencia */}
        <button
          onClick={() => setShowCrisisPlan(true)}
          className="badge badge-rose"
          style={{ cursor: 'pointer', padding: '6px 12px', border: '1px solid rgba(244,63,94,0.3)', fontSize: '0.65rem' }}
        >
          <ShieldAlert size={12} />
          <span>Esto es Urgente</span>
        </button>
      </div>

      {/* Banner Informativo Ético sobre la IA */}
      <div style={{ 
        background: 'rgba(6,182,212,0.03)', 
        borderBottom: '1px solid var(--border)', 
        padding: '8px 20px', 
        fontSize: '0.7rem', 
        color: 'var(--text-secondary)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <Sparkles size={12} color="var(--color-cyan)" style={{ flexShrink: 0 }} />
        <span style={{ textAlign: 'left', lineHeight: 1.35 }}>
          <strong>Nota ética:</strong> Walter es una IA de apoyo emocional y preparación de sesiones. No emite diagnósticos clínicos, no prescribe tratamientos médicos ni sustituye en ningún caso a tu psicóloga colegiada.
        </span>
      </div>

      {/* Cuerpo de Mensajes */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)', color: 'var(--color-rose)', padding: '12px 16px', borderRadius: '6px', fontSize: '0.75rem', textAlign: 'left' }}>
            {error}
          </div>
        )}

        {messages.map(msg => {
          const isBot = msg.sender === 'bot';
          return (
            <div 
              key={msg.id} 
              style={{ 
                display: 'flex', 
                justifyContent: isBot ? 'flex-start' : 'flex-end',
                gap: '10px',
                maxWidth: '85%',
                alignSelf: isBot ? 'flex-start' : 'flex-end'
              }}
            >
              {isBot && (
                <div className="flex-center" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(68,125,130,0.08)', color: 'var(--color-cyan)', flexShrink: 0, marginTop: '4px' }}>
                  <Bot size={14} />
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div 
                  style={{ 
                    padding: '12px 16px', 
                    borderRadius: isBot ? '0 16px 16px 16px' : '16px 0 16px 16px',
                    background: isBot ? 'var(--background-secondary)' : 'rgba(68,125,130,0.15)',
                    border: '1px solid',
                    borderColor: isBot ? 'var(--border)' : 'rgba(68,125,130,0.25)',
                    fontSize: '0.8rem',
                    lineHeight: 1.45,
                    color: isBot ? 'var(--text-primary)' : '#ffffff',
                    whiteSpace: 'pre-wrap',
                    textAlign: 'left'
                  }}
                >
                  {msg.text}
                </div>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', alignSelf: isBot ? 'flex-start' : 'flex-end' }}>
                  {msg.time}
                </span>
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

      {/* Input / Acciones del Chat */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', background: 'var(--background-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Leyenda clínica de seguridad */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
          <span>Tu psicóloga puede revisar el diario asíncrono acumulado para preparar la sesión.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Volume2 size={12} color="var(--color-emerald)" />
            Soporta audios
          </span>
        </div>

        {/* Input Form */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          
          {/* Botón Nota de Voz */}
          <button
            type="button"
            onClick={handleToggleRecord}
            className="flex-center"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: isRecording ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.02)',
              border: '1px solid',
              borderColor: isRecording ? 'var(--color-rose)' : 'var(--border)',
              color: isRecording ? 'var(--color-rose)' : 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              flexShrink: 0
            }}
          >
            {isRecording ? <MicOff size={18} className="animate-pulse-soft" /> : <Mic size={18} />}
          </button>

          {/* Caja de Texto */}
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputVal)}
              disabled={isRecording || transcribingAudio}
              placeholder={isRecording ? "Grabando... (Pulsa el micrófono para transcribir)" : transcribingAudio ? "Procesando audio..." : "Cuéntale a Walter cómo te sientes..."}
              style={{
                width: '100%',
                height: '42px',
                background: 'var(--background-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: '21px',
                padding: '0 40px 0 16px',
                fontSize: '0.8rem',
                color: '#ffffff'
              }}
            />
            {agentStatus !== 'online' && (
              <RefreshCw size={14} className="animate-spin" style={{ position: 'absolute', right: '14px', top: '14px', color: 'var(--color-cyan)' }} />
            )}
          </div>

          {/* Botón Enviar */}
          <button
            type="button"
            onClick={() => handleSend(inputVal)}
            disabled={!inputVal.trim() || isRecording || transcribingAudio}
            className="flex-center"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: inputVal.trim() ? 'var(--color-cyan)' : 'rgba(255,255,255,0.02)',
              border: '1px solid',
              borderColor: inputVal.trim() ? 'var(--color-cyan)' : 'var(--border)',
              color: inputVal.trim() ? '#ffffff' : 'var(--text-tertiary)',
              cursor: inputVal.trim() ? 'pointer' : 'default',
              transition: 'all var(--transition-fast)',
              flexShrink: 0
            }}
          >
            <Send size={16} />
          </button>

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
  );
}
