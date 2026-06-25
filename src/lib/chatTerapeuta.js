import { supabase } from '../supabaseClient';

async function buildFunctionError(error) {
  let message = error?.message || 'Error al conectar con la función chat-terapeuta.';

  try {
    if (error?.context && typeof error.context.json === 'function') {
      const payload = await error.context.json();
      if (payload?.error) {
        message = payload.error;
      }
    }
  } catch (_) {
    // Keep the original Supabase Functions error when the body is not JSON.
  }

  if (/failed to fetch/i.test(message)) {
    message = 'No se pudo conectar con la función de Supabase. Revisa que chat-terapeuta esté desplegada y accesible.';
  }

  return new Error(message);
}

export async function invokeChatTerapeuta(body, signal = null) {
  let timeoutMs = 90000;
  if (body?.action === 'consolidate_mente_sync') {
    timeoutMs = 180000;
  } else if (body?.action === 'process_mente_sync_item') {
    timeoutMs = 60000;
  } else if (body?.action === 'prepare_mente_sync') {
    timeoutMs = 45000;
  }
  const timeout = new Promise((_, reject) => {
    globalThis.setTimeout(() => {
      reject(new Error('La función de Supabase ha tardado demasiado en responder.'));
    }, timeoutMs);
  });

  let result;
  try {
    result = await Promise.race([
      supabase.functions.invoke('chat-terapeuta', { body, signal }),
      timeout
    ]);
  } catch (error) {
    throw await buildFunctionError(error);
  }

  const { data, error } = result;

  if (!error) {
    return data;
  }

  throw await buildFunctionError(error);
}
