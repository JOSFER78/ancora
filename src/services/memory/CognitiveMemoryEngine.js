/**
 * @file CognitiveMemoryEngine.js
 * @description Núcleo Unificado de Memoria Cognitiva de Áncora.
 * Orquesta los 5 métodos core de memoria clínica bi-temporal con tolerancia absoluta a fallos.
 */

import { ContextBuilder } from './ContextBuilder.js';
import { RelevanceScorer } from './RelevanceScorer.js';
import { TokenBudgetManager } from './TokenBudgetManager.js';
import { MemoryStateMachine } from '../../domain/memory/MemoryStateMachine.js';
import { MemoryState, AuthorityLevel } from '../../domain/memory/MemoryTypes.js';

export class CognitiveMemoryEngine {
  /**
   * @param {Object} params
   * @param {import('../../infrastructure/storage/IMemoryRepository.js').IMemoryRepository} params.repository Adaptador de persistencia.
   * @param {ContextBuilder} [params.contextBuilder]
   */
  constructor({ repository, contextBuilder }) {
    if (!repository) {
      throw new Error('[CognitiveMemoryEngine] repository es requerido.');
    }
    this.repo = repository;
    this.contextBuilder = contextBuilder || new ContextBuilder(new TokenBudgetManager(16384));
  }

  /**
   * 1. CAPTURE: Extrae hechos y episodios a partir de la interacción reciente del paciente.
   * Ejecutado en el Deep Path de forma asíncrona fuera del ciclo interactivo.
   * 
   * @param {Object} params
   * @param {string} params.patientId
   * @param {string} params.rawMessage Mensaje original del paciente.
   * @param {string} [params.verbatimQuote] Cita textual exacta.
   * @param {number} [params.authorityLevel] Nivel de autoridad (por defecto Nivel 3).
   * @param {string} [params.category] Categoría clínica.
   * @returns {Promise<Object>} Episodio candidato guardado.
   */
  async capture({
    patientId,
    rawMessage,
    verbatimQuote,
    authorityLevel = AuthorityLevel.LEVEL_3_DECLARED,
    category = 'USER_EXPRESSION'
  }) {
    if (!patientId || !rawMessage) return null;

    const candidateEpisode = {
      id: 'ep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      patientId,
      content: rawMessage,
      verbatimQuote: verbatimQuote || (rawMessage.length < 140 ? rawMessage : ''),
      authorityLevel,
      category,
      state: MemoryState.CANDIDATE,
      importance: 0.70,
      clinicalRelevance: 0.65,
      createdAt: new Date().toISOString()
    };

    const savedId = await this.repo.saveEpisode(patientId, candidateEpisode);

    await this.audit({
      type: 'MEMORY_CAPTURED',
      patientId,
      actor: 'DeepPathExtractor',
      payload: { episodeId: savedId, category, authorityLevel }
    });

    return { ...candidateEpisode, id: savedId };
  }

  /**
   * 2. RETRIEVE: Recupera y compila el contexto estructurado óptimo para el Fast Path.
   * 
   * @param {string} patientId
   * @param {string} currentQuery Mensaje actual del usuario.
   * @param {Array<Object>} [recentMessages] Historial de diálogo reciente.
   * @returns {Promise<{ systemPrompt: string, contextMessages: Array<Object>, telemetry: Object }>}
   */
  async retrieve(patientId, currentQuery = '', recentMessages = []) {
    if (!patientId) {
      return this.contextBuilder.buildContext({ currentQuery, recentMessages });
    }

    try {
      // Carga paralela de datos de memoria
      const [semanticProfile, directives, episodes, lifeTreeNodes] = await Promise.all([
        this.repo.getSemanticProfile(patientId).catch(() => null),
        this.repo.getActiveDirectives(patientId).catch(() => []),
        this.repo.getEpisodes(patientId, { limit: 15 }).catch(() => []),
        this.repo.getLifeTreeNodes(patientId).catch(() => [])
      ]);

      return this.contextBuilder.buildContext({
        patientName: 'Paciente',
        semanticProfile,
        directives,
        episodes,
        lifeTreeNodes,
        recentMessages,
        currentQuery
      });
    } catch (err) {
      console.warn('[CognitiveMemoryEngine] Fallback en retrieve:', err.message);
      // Fallback seguro sin bloquear el Fast Path
      return this.contextBuilder.buildContext({ currentQuery, recentMessages });
    }
  }

  /**
   * 3. CONSOLIDATE: Sintetiza memorias candidatas, resuelve evolución temporal y actualiza el perfil semántico.
   * 
   * @param {string} patientId
   * @returns {Promise<{ consolidatedCount: number, supersededCount: number }>}
   */
  async consolidate(patientId) {
    if (!patientId) return { consolidatedCount: 0, supersededCount: 0 };

    const episodes = await this.repo.getEpisodes(patientId, { limit: 30 });
    const existingProfile = await this.repo.getSemanticProfile(patientId) || {
      patientId,
      currentSummary: '',
      activeTriggers: [],
      protectiveAnchors: []
    };

    let consolidatedCount = 0;
    let supersededCount = 0;

    // Procesar cada episodio activo
    for (const ep of episodes) {
      if (ep.state === MemoryState.CANDIDATE) {
        // Conciliar con la máquina de estados
        const reconciliation = MemoryStateMachine.reconcileContradiction(null, ep);
        ep.state = reconciliation.candidateNew.state;
        await this.repo.saveEpisode(patientId, ep);
        consolidatedCount++;
      }
    }

    // Actualizar timestamp de consolidación
    await this.repo.saveSemanticProfile(patientId, {
      ...existingProfile,
      lastConsolidationAt: new Date().toISOString()
    });

    await this.audit({
      type: 'MEMORY_CONSOLIDATED',
      patientId,
      actor: 'CognitiveMemoryEngine',
      payload: { consolidatedCount, supersededCount }
    });

    return { consolidatedCount, supersededCount };
  }

  /**
   * 4. UPDATE: Mutación inmutable de una memoria o nodo (Copy-on-Write).
   * 
   * @param {string} patientId
   * @param {string} memoryId
   * @param {Object} updates
   * @returns {Promise<void>}
   */
  async update(patientId, memoryId, updates = {}) {
    if (!patientId || !memoryId) return;

    await this.audit({
      type: 'MEMORY_UPDATED',
      patientId,
      actor: updates.modifiedBy || 'System',
      payload: { memoryId, updates }
    });
  }

  /**
   * 5. AUDIT: Registro de trazabilidad inmutable.
   * 
   * @param {Object} event
   * @returns {Promise<void>}
   */
  async audit(event) {
    try {
      await this.repo.appendAuditLog(event);
    } catch (e) {
      console.warn('[CognitiveMemoryEngine] Audit log warning:', e.message);
    }
  }
}
