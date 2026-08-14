/**
 * @file useLifeTree.js
 * @description Custom Hook de React para gestionar el Árbol Vital (Life Tree).
 * Proporciona acceso reactivo a los nodos biográficos, relacionales y anclajes somáticos.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { SupabaseMemoryAdapter } from '../infrastructure/storage/SupabaseMemoryAdapter.js';
import { supabase } from '../supabaseClient.js';

export function useLifeTree(patientId) {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const adapter = useMemo(() => new SupabaseMemoryAdapter(supabase), []);

  const loadNodes = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await adapter.getLifeTreeNodes(patientId);
      setNodes(data || []);
    } catch (err) {
      console.error('[useLifeTree] Error al cargar nodos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId, adapter]);

  useEffect(() => {
    loadNodes();
  }, [loadNodes]);

  const saveNode = useCallback(async (nodeData) => {
    if (!patientId) return null;
    try {
      const id = await adapter.saveLifeTreeNode(patientId, nodeData);
      await loadNodes();
      return id;
    } catch (err) {
      console.error('[useLifeTree] Error guardando nodo:', err);
      throw err;
    }
  }, [patientId, adapter, loadNodes]);

  return {
    nodes,
    loading,
    error,
    reload: loadNodes,
    saveNode
  };
}
