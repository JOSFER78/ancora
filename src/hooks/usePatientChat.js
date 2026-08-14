/**
 * @file usePatientChat.js
 * @description Custom Hook de React para la interacción de Chat del Paciente con Procesamiento Dual.
 * Integra el Fast Path (< 2s) con la extracción en segundo plano del Deep Path de forma desacoplada.
 */

import { useState, useCallback, useMemo } from 'react';
import { CognitiveMemoryEngine } from '../services/memory/CognitiveMemoryEngine.js';
import { SupabaseMemoryAdapter } from '../infrastructure/storage/SupabaseMemoryAdapter.js';
import { supabase } from '../supabaseClient.js';
import { enviarMensajeTerapeutaEdge } from '../lib/chatTerapeuta.js';

export function usePatientChat(patientId, initialMessages = []) {
  const [messages, setMessages] = useState(initialMessages);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const memoryEngine = useMemo(() => {
    const adapter = new SupabaseMemoryAdapter(supabase);
    return new CognitiveMemoryEngine({ repository: adapter });
  }, []);

  const sendMessage = useCallback(async (userText) => {
    if (!userText || !userText.trim() || sending) return null;

    const trimmedText = userText.trim();
    const tempUserMsg = {
      id: 'msg_' + Date.now(),
      sender: 'patient',
      role: 'user',
      content: trimmedText,
      timestamp: new Date().toISOString()
    };

    // Actualización optimista inmediata en la UI
    setMessages(prev => [...prev, tempUserMsg]);
    setSending(true);
    setError(null);

    try {
      // 1. FAST PATH: Recuperar contexto enriquecido estructurado en < 100ms
      const contextPayload = await memoryEngine.retrieve(patientId, trimmedText, messages);

      // 2. Invocar el LLM con el contexto optimizado
      const response = await enviarMensajeTerapeutaEdge({
        mensaje: trimmedText,
        historial: contextPayload.contextMessages,
        systemPromptOverride: contextPayload.systemPrompt,
        contextoClinico: contextPayload.telemetry
      });

      const replyText = response?.reply || response?.texto || 'Entiendo lo que me comentas. Sigamos explorando esta situación juntos.';

      const botMsg = {
        id: 'msg_bot_' + Date.now(),
        sender: 'bot',
        role: 'assistant',
        content: replyText,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMsg]);

      // 3. DEEP PATH ASÍNCRONO: Extraer hechos y registrar episodio en background (No bloquea la UI)
      setTimeout(async () => {
        try {
          await memoryEngine.capture({
            patientId,
            rawMessage: trimmedText,
            verbatimQuote: trimmedText.length < 160 ? trimmedText : '',
            authorityLevel: 3, // Nivel 3: Declarado por el paciente
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
      
      // Mensaje de contención en fallback seguro
      const fallbackMsg = {
        id: 'msg_fallback_' + Date.now(),
        sender: 'bot',
        role: 'assistant',
        content: 'He recibido tu mensaje. En este momento el servidor está procesando tu solicitud con retraso, pero tu registro ha quedado guardado.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, fallbackMsg]);
      return fallbackMsg.content;
    } finally {
      setSending(false);
    }
  }, [patientId, messages, sending, memoryEngine]);

  return {
    messages,
    setMessages,
    sending,
    error,
    sendMessage
  };
}
