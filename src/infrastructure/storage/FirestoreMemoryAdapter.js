/**
 * @file FirestoreMemoryAdapter.js
 * @description Adaptador de persistencia real en Google Cloud Firestore para el Cognitive Memory Engine.
 * Implementa IMemoryRepository mediante subcolecciones multitenant optimizadas.
 */

import { IMemoryRepository } from './IMemoryRepository.js';

export class FirestoreMemoryAdapter extends IMemoryRepository {
  /**
   * @param {Object} firestoreDb Instancia de Firebase Firestore SDK.
   */
  constructor(firestoreDb) {
    super();
    this.db = firestoreDb;
  }

  /**
   * Obtiene el perfil semántico consolidado de un paciente.
   * @param {string} patientId 
   */
  async getSemanticProfile(patientId) {
    if (!patientId) return null;
    if (!this.db) return null;

    try {
      // En Firestore Web SDK v9 modular: doc(db, 'patients', patientId, 'semanticProfile', 'current')
      // O en SDK compat: db.collection('patients').doc(patientId).collection('semanticProfile').doc('current')
      if (typeof this.db.collection === 'function') {
        const docSnap = await this.db.collection('patients').doc(patientId).collection('semanticProfile').doc('current').get();
        return docSnap.exists ? docSnap.data() : null;
      }
      return null;
    } catch (err) {
      console.warn('[FirestoreMemoryAdapter] Error al leer semanticProfile:', err.message);
      return null;
    }
  }

  /**
   * Guarda o actualiza el perfil semántico consolidado.
   * @param {string} patientId 
   * @param {Object} profile 
   */
  async saveSemanticProfile(patientId, profile) {
    if (!patientId || !this.db) return;

    const data = {
      ...profile,
      patientId,
      updatedAt: new Date().toISOString()
    };

    try {
      if (typeof this.db.collection === 'function') {
        await this.db.collection('patients').doc(patientId).collection('semanticProfile').doc('current').set(data, { merge: true });
      }
    } catch (err) {
      console.error('[FirestoreMemoryAdapter] Error al guardar semanticProfile:', err.message);
      throw err;
    }
  }

  /**
   * Obtiene los episodios clínicos activos.
   * @param {string} patientId 
   * @param {{ limit?: number, categories?: string[] }} [options] 
   */
  async getEpisodes(patientId, options = {}) {
    if (!patientId || !this.db) return [];

    try {
      if (typeof this.db.collection === 'function') {
        let query = this.db.collection('patients').doc(patientId).collection('episodes')
          .where('state', '==', 'ACTIVE');
        
        if (options.limit) {
          query = query.limit(options.limit);
        }

        const snapshot = await query.get();
        const results = [];
        snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
        return results;
      }
      return [];
    } catch (err) {
      console.warn('[FirestoreMemoryAdapter] Error al leer episodios:', err.message);
      return [];
    }
  }

  /**
   * Guarda un nuevo episodio clínico con cita textual (verbatim).
   * @param {string} patientId 
   * @param {Object} episode 
   */
  async saveEpisode(patientId, episode) {
    if (!patientId || !this.db) {
      return episode.id || 'ep_' + Date.now();
    }

    const docId = episode.id || 'ep_' + Date.now();
    const data = {
      ...episode,
      id: docId,
      patientId,
      createdAt: episode.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (typeof this.db.collection === 'function') {
        await this.db.collection('patients').doc(patientId).collection('episodes').doc(docId).set(data);
      }
      return docId;
    } catch (err) {
      console.error('[FirestoreMemoryAdapter] Error al guardar episodio:', err.message);
      throw err;
    }
  }

  /**
   * Obtiene los nodos del Árbol Vital.
   * @param {string} patientId 
   * @param {string} [category] 
   */
  async getLifeTreeNodes(patientId, category) {
    if (!patientId || !this.db) return [];

    try {
      if (typeof this.db.collection === 'function') {
        let query = this.db.collection('patients').doc(patientId).collection('lifeTree')
          .where('status', '==', 'ACTIVE');

        if (category) {
          query = query.where('category', '==', category);
        }

        const snapshot = await query.get();
        const results = [];
        snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
        return results;
      }
      return [];
    } catch (err) {
      console.warn('[FirestoreMemoryAdapter] Error al leer LifeTree:', err.message);
      return [];
    }
  }

  /**
   * Guarda o actualiza un nodo del Árbol Vital.
   * @param {string} patientId 
   * @param {Object} node 
   */
  async saveLifeTreeNode(patientId, node) {
    if (!patientId || !this.db) return node.id || 'node_' + Date.now();

    const docId = node.id || 'node_' + Date.now();
    const data = {
      ...node,
      id: docId,
      patientId,
      updatedAt: new Date().toISOString()
    };

    try {
      if (typeof this.db.collection === 'function') {
        await this.db.collection('patients').doc(patientId).collection('lifeTree').doc(docId).set(data, { merge: true });
      }
      return docId;
    } catch (err) {
      console.error('[FirestoreMemoryAdapter] Error al guardar nodo LifeTree:', err.message);
      throw err;
    }
  }

  /**
   * Obtiene directivas clínicas activas.
   * @param {string} patientId 
   */
  async getActiveDirectives(patientId) {
    if (!patientId || !this.db) return [];

    try {
      if (typeof this.db.collection === 'function') {
        const snapshot = await this.db.collection('patients').doc(patientId).collection('directives')
          .where('status', '==', 'ACTIVE')
          .get();

        const results = [];
        snapshot.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
        return results;
      }
      return [];
    } catch (err) {
      console.warn('[FirestoreMemoryAdapter] Error al leer directivas:', err.message);
      return [];
    }
  }

  /**
   * Registra un evento inmutable en el log de auditoría.
   * @param {Object} auditEvent 
   */
  async appendAuditLog(auditEvent) {
    if (!this.db) return;

    const logId = 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const entry = {
      ...auditEvent,
      id: logId,
      timestamp: new Date().toISOString()
    };

    try {
      if (typeof this.db.collection === 'function') {
        await this.db.collection('auditLogs').doc(logId).set(entry);
      }
    } catch (err) {
      console.warn('[FirestoreMemoryAdapter] No se pudo escribir auditLog:', err.message);
    }
  }
}
