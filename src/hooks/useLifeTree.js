/**
 * @file useLifeTree.js
 * @description Custom Hook de React para gestionar el Árbol Vital (Life Tree).
 * Proporciona acceso reactivo a los nodos biográficos, relacionales y anclajes somáticos.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MemoryRepositoryFactory } from '../infrastructure/storage/MemoryRepositoryFactory.js';

export function useLifeTree(patientId, selectedCategory = null) {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const repository = useMemo(() => MemoryRepositoryFactory.getRepository(), []);

  const loadNodes = useCallback(async () => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await repository.getLifeTreeNodes(patientId, selectedCategory);
      setNodes(data || []);
    } catch (err) {
      console.error('[useLifeTree] Error al cargar nodos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId, selectedCategory, repository]);

  useEffect(() => {
    loadNodes();
  }, [loadNodes]);

  const saveNode = useCallback(async (nodeData) => {
    if (!patientId) return null;
    try {
      const id = await repository.saveLifeTreeNode(patientId, nodeData);
      await loadNodes();
      return id;
    } catch (err) {
      console.error('[useLifeTree] Error guardando nodo:', err);
      throw err;
    }
  }, [patientId, repository, loadNodes]);

  const deleteNode = useCallback(async (nodeId) => {
    if (!patientId || !nodeId) return;
    try {
      await repository.deleteLifeTreeNode(patientId, nodeId);
      await loadNodes();
    } catch (err) {
      console.error('[useLifeTree] Error eliminando nodo:', err);
      throw err;
    }
  }, [patientId, repository, loadNodes]);

  return {
    nodes,
    loading,
    error,
    reload: loadNodes,
    saveNode,
    deleteNode
  };
}

export default useLifeTree;
