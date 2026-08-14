/**
 * @file useClinicalMemory.js
 * @description Custom Hook de React para acceder y operar sobre la memoria clínica de Áncora.
 * Desacopla las vistas (MenteView, PsicologoDashboardView) de la capa de persistencia.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CognitiveMemoryEngine } from '../services/memory/CognitiveMemoryEngine.js';
import { SupabaseMemoryAdapter } from '../infrastructure/storage/SupabaseMemoryAdapter.js';
import { supabase } from '../supabaseClient.js';

export function useClinicalMemory(patientId) {
  const [profile, setProfile] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [directives, setDirectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Instanciar el adaptador de almacenamiento y el motor cognitivo
  const memoryEngine = useMemo(() => {
    const adapter = new SupabaseMemoryAdapter(supabase);
    return new CognitiveMemoryEngine({ repository: adapter });
  }, []);

  const loadMemoryData = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [prof, eps, dirs] = await Promise.all([
        memoryEngine.repo.getSemanticProfile(patientId),
        memoryEngine.repo.getEpisodes(patientId, { limit: 20 }),
        memoryEngine.repo.getActiveDirectives(patientId)
      ]);

      setProfile(prof);
      setEpisodes(eps || []);
      setDirectives(dirs || []);
    } catch (err) {
      console.error('[useClinicalMemory] Error cargando datos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId, memoryEngine]);

  useEffect(() => {
    loadMemoryData();
  }, [loadMemoryData]);

  const addEpisode = useCallback(async (content, verbatimQuote, authorityLevel = 3) => {
    if (!patientId) return;
    try {
      await memoryEngine.capture({
        patientId,
        rawMessage: content,
        verbatimQuote,
        authorityLevel
      });
      await loadMemoryData();
    } catch (err) {
      console.error('[useClinicalMemory] Error agregando episodio:', err);
    }
  }, [patientId, memoryEngine, loadMemoryData]);

  const triggerConsolidation = useCallback(async () => {
    if (!patientId) return;
    try {
      const result = await memoryEngine.consolidate(patientId);
      await loadMemoryData();
      return result;
    } catch (err) {
      console.error('[useClinicalMemory] Error en consolidación:', err);
    }
  }, [patientId, memoryEngine, loadMemoryData]);

  return {
    profile,
    episodes,
    directives,
    loading,
    error,
    reload: loadMemoryData,
    addEpisode,
    triggerConsolidation
  };
}
