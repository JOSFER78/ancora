/**
 * @file FirestoreMemoryAdapter.js
 * @description Adaptador de persistencia real en Google Cloud Firestore para el Cognitive Memory Engine.
 * Implementa IMemoryRepository mediante subcolecciones multitenant optimizadas.
 */

import { IMemoryRepository } from './IMemoryRepository.js';
import { MemoryState } from '../../domain/memory/MemoryTypes.js';

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
    if (!patientId || !this.db) return null;

    try {
      if (typeof this.db.collection === 'function') {
        const docSnap = await this.db.collection('patients').doc(patientId).collection('semanticProfile').doc('current').get();
        if (docSnap.exists) {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            patientId,
            currentSummary: data.currentSummary || data.summary || '',
            activeTriggers: data.activeTriggers || data.triggers || [],
            protectiveAnchors: data.protectiveAnchors || data.anchors || [],
            coreBeliefs: data.coreBeliefs || [],
            riskTrajectory: data.riskTrajectory || { currentRisk: 'low', crisesInLast30Days: 0 },
            lastConsolidatedAt: data.lastConsolidatedAt || data.updatedAt,
            version: data.version || 1
          };
        }
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
   * @param {{ limit?: number, categories?: string[], states?: string[] }} [options] 
   */
  async getEpisodes(patientId, options = {}) {
    if (!patientId || !this.db) return [];

    try {
      if (typeof this.db.collection === 'function') {
        let query = this.db.collection('patients').doc(patientId).collection('episodes');
        
        if (options.states && options.states.length === 1) {
          query = query.where('state', '==', options.states[0]);
        } else if (!options.states) {
          query = query.where('state', '==', MemoryState.ACTIVE);
        }

        if (options.limit) {
          query = query.limit(options.limit);
        }

        const snapshot = await query.get();
        const results = [];
        snapshot.forEach(doc => {
          const d = doc.data();
          results.push({
            id: doc.id,
            patientId,
            content: d.content || d.narrative || '',
            verbatimQuote: d.verbatimQuote || d.verbatim_quote || '',
            authorityLevel: Number(d.authorityLevel || d.authority_level || 3),
            category: d.category || 'USER_EXPRESSION',
            state: d.state || MemoryState.ACTIVE,
            importance: Number(d.importance ?? 0.7),
            clinicalRelevance: Number(d.clinicalRelevance ?? d.clinical_relevance ?? 0.65),
            emotionalValence: Number(d.emotionalValence ?? 0),
            occurredAt: d.occurredAt || d.createdAt,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
          });
        });
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

    const docId = episode.id || 'ep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
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
        snapshot.forEach(doc => {
          const d = doc.data();
          results.push({
            id: doc.id,
            patientId,
            category: d.category,
            title: d.title,
            description: d.description || d.content || '',
            authorityLevel: Number(d.authorityLevel || 3),
            emotionalValence: Number(d.emotionalValence ?? 0),
            salienceWeight: Number(d.salienceWeight ?? 0.7),
            verbatimQuotes: d.verbatimQuotes || [],
            status: d.status || 'ACTIVE',
            createdAt: d.createdAt,
            updatedAt: d.updatedAt
          });
        });
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

    const docId = node.id || 'node_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
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
   * Elimina un nodo del Árbol Vital.
   * @param {string} patientId 
   * @param {string} nodeId 
   */
  async deleteLifeTreeNode(patientId, nodeId) {
    if (!patientId || !nodeId || !this.db) return;
    try {
      if (typeof this.db.collection === 'function') {
        await this.db.collection('patients').doc(patientId).collection('lifeTree').doc(nodeId).delete();
      }
    } catch (err) {
      console.error('[FirestoreMemoryAdapter] Error al eliminar nodo LifeTree:', err.message);
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
        snapshot.forEach(doc => {
          const d = doc.data();
          results.push({
            id: doc.id,
            patientId,
            psychologistId: d.psychologistId,
            category: d.category || 'SAFETY_LIMIT',
            directive: d.directive || d.instruction || '',
            priority: Number(d.priority || 1),
            authorityLevel: 1,
            status: d.status || 'ACTIVE',
            validFrom: d.validFrom || d.createdAt,
            validUntil: d.validUntil || null,
            createdAt: d.createdAt
          });
        });
        return results;
      }
      return [];
    } catch (err) {
      console.warn('[FirestoreMemoryAdapter] Error al leer directivas:', err.message);
      return [];
    }
  }

  /**
   * Guarda una directiva clínica.
   * @param {string} patientId 
   * @param {Object} directive 
   */
  async saveDirective(patientId, directive) {
    if (!patientId || !this.db) return directive.id || 'dir_' + Date.now();

    const docId = directive.id || 'dir_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const data = {
      ...directive,
      id: docId,
      patientId,
      status: directive.status || 'ACTIVE',
      createdAt: directive.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (typeof this.db.collection === 'function') {
        await this.db.collection('patients').doc(patientId).collection('directives').doc(docId).set(data, { merge: true });
      }
      return docId;
    } catch (err) {
      console.error('[FirestoreMemoryAdapter] Error al guardar directiva:', err.message);
      throw err;
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

  /**
   * Obtiene el log de auditoría.
   * @param {string} patientId 
   * @param {{ limit?: number }} [options] 
   */
  async getAuditLogs(patientId, options = {}) {
    if (!this.db) return [];

    try {
      if (typeof this.db.collection === 'function') {
        let query = this.db.collection('auditLogs');
        if (patientId) {
          query = query.where('patientId', '==', patientId);
        }
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
      console.warn('[FirestoreMemoryAdapter] Error al leer auditLogs:', err.message);
      return [];
    }
  }
}
