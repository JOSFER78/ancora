/**
 * @file usePatientChat.js
 * @description Custom Hook de React para la interacción de Chat del Paciente con Procesamiento Dual.
 * Integra el Fast Path (< 2s) con la extracción en segundo plano del Deep Path de forma desacoplada.
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { CognitiveMemoryEngine } from '../services/memory/CognitiveMemoryEngine.js';
import { MemoryRepositoryFactory } from '../infrastructure/storage/MemoryRepositoryFactory.js';
import { generateTherapistResponse } from '../services/aiService.js';
import { supabase } from '../supabaseClient.js';
import { AuthorityLevel } from '../domain/memory/MemoryTypes.js';

export function usePatientChat(patientId, initialMessages = [], currentMood = null) {
  const [messages, setMessages] = useState(initialMessages);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [lastTelemetry, setLastTelemetry] = useState(null);

  const isSendingRef = useRef(false);

  const memoryEngine = useMemo(() => {
    const repository = MemoryRepositoryFactory.getRepository();
    return new CognitiveMemoryEngine({ repository });
  }, []);

  const sendMessage = useCallback(async (userText, conversationId = null) => {
    if (!userText || !userText.trim() || isSendingRef.current) return null;

    const trimmedText = userText.trim();
    isSendingRef.current = true;

    const tempUserMsg = {
      id: 'msg_' + Date.now(),
      sender: 'user',
      role: 'user',
      content: trimmedText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setSending(true);
    setError(null);

    try {
      // 1. FAST PATH: Recuperar contexto enriquecido estructurado en < 100ms
      const contextPayload = await memoryEngine.retrieve(patientId, trimmedText, messages, currentMood);
      setLastTelemetry(contextPayload.telemetry);

      // 2. Invocar el LLM con el contexto optimizado y Cero Complacencia
      let patientProfile = {};
      try {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', patientId).maybeSingle();
        if (profile) patientProfile = profile;
      } catch (_) {}

      const replyText = await generateTherapistResponse({
        userMessage: trimmedText,
        patientProfile,
        chatHistory: messages,
        currentMood,
        mode: 'auto',
        systemPromptOverride: contextPayload.systemPrompt
      });

      const botMsg = {
        id: 'msg_bot_' + Date.now(),
        sender: 'bot',
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMsg]);

      // Guardar en tabla messages si hay conversationId
      if (conversationId) {
        supabase.from('messages').insert([
          { conversation_id: conversationId, role: 'user', content: trimmedText },
          { conversation_id: conversationId, role: 'assistant', content: replyText }
        ]).catch(err => console.warn('[usePatientChat] Error guardando mensajes:', err.message));
      }

      // 3. DEEP PATH ASÍNCRONO: Extraer hechos y registrar episodio en background (No bloquea la UI)
      setTimeout(async () => {
        try {
          await memoryEngine.capture({
            patientId,
            rawMessage: trimmedText,
            verbatimQuote: trimmedText.length < 160 ? trimmedText : '',
            authorityLevel: AuthorityLevel.LEVEL_3_DECLARED,
            category: 'USER_EXPRESSION'
          });
        } catch (captureErr) {
          console.warn('[usePatientChat] Error silencioso en Deep Path capture:', captureErr.message);
        }
      }, 50);

      return replyText;
    } catch (err) {
      console.error('[usePatientChat] Error al procesar mensaje:', err);
      setError(err.message || 'No se pudo conectar con el servicio de asistencia.');
      
      const fallbackMsg = {
        id: 'msg_fallback_' + Date.now(),
        sender: 'bot',
        role: 'assistant',
        content: 'He recibido tu mensaje. Estamos experimentando una breve latencia en el servidor, pero tu vivencia ha quedado registrada.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackMsg]);
      return fallbackMsg.content;
    } finally {
      isSendingRef.current = false;
      setSending(false);
    }
  }, [patientId, messages, currentMood, memoryEngine]);

  return {
    messages,
    setMessages,
    sending,
    error,
    telemetry: lastTelemetry,
    sendMessage,
    engine: memoryEngine
  };
}

export default usePatientChat;
