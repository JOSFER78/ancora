/**
 * @file useClinicalMemory.js
 * @description Custom Hook de React para acceder y operar sobre la memoria clínica de Áncora.
 * Desacopla las vistas (MenteView, PsicologoDashboardView) de la capa de persistencia mediante MemoryRepositoryFactory.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { CognitiveMemoryEngine } from '../services/memory/CognitiveMemoryEngine.js';
import { MemoryRepositoryFactory } from '../infrastructure/storage/MemoryRepositoryFactory.js';
import { AuthorityLevel } from '../domain/memory/MemoryTypes.js';

export function useClinicalMemory(patientId) {
  const [profile, setProfile] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [directives, setDirectives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Instanciar el motor cognitivo a través de la fábrica de repositorios
  const memoryEngine = useMemo(() => {
    const repository = MemoryRepositoryFactory.getRepository();
    return new CognitiveMemoryEngine({ repository });
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
        memoryEngine.repo.getEpisodes(patientId, { limit: 30 }),
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

  const addEpisode = useCallback(async (content, verbatimQuote = '', authorityLevel = AuthorityLevel.LEVEL_3_DECLARED, category = 'USER_EXPRESSION') => {
    if (!patientId) return null;
    try {
      const ep = await memoryEngine.capture({
        patientId,
        rawMessage: content,
        verbatimQuote,
        authorityLevel,
        category
      });
      await loadMemoryData();
      return ep;
    } catch (err) {
      console.error('[useClinicalMemory] Error agregando episodio:', err);
      throw err;
    }
  }, [patientId, memoryEngine, loadMemoryData]);

  const saveDirective = useCallback(async (directiveData) => {
    if (!patientId) return null;
    try {
      const id = await memoryEngine.saveDirective(patientId, directiveData);
      await loadMemoryData();
      return id;
    } catch (err) {
      console.error('[useClinicalMemory] Error guardando directiva:', err);
      throw err;
    }
  }, [patientId, memoryEngine, loadMemoryData]);

  const triggerConsolidation = useCallback(async () => {
    if (!patientId) return null;
    try {
      setLoading(true);
      const result = await memoryEngine.consolidate(patientId);
      await loadMemoryData();
      return result;
    } catch (err) {
      console.error('[useClinicalMemory] Error en consolidación:', err);
      throw err;
    } finally {
      setLoading(false);
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
    saveDirective,
    triggerConsolidation,
    engine: memoryEngine
  };
}

export default useClinicalMemory;
