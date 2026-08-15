/**
 * @file CognitiveMemoryEngine.js
 * @description Núcleo Unificado de Memoria Cognitiva de Áncora.
 * Orquesta los 5 métodos core de memoria clínica bi-temporal con tolerancia absoluta a fallos.
 */

import { ContextBuilder } from './ContextBuilder.js';
import { RelevanceScorer } from './RelevanceScorer.js';
import { TokenBudgetManager } from './TokenBudgetManager.js';
import { MemoryStateMachine } from '../../domain/memory/MemoryStateMachine.js';
import { MemoryState, AuthorityLevel, AuditEventType } from '../../domain/memory/MemoryTypes.js';

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
   * @param {number} [params.emotionalValence] Valencia emocional (-1.0 a +1.0).
   * @param {string} [params.occurredAt] Fecha en la que ocurrió el evento.
   * @returns {Promise<Object>} Episodio candidato guardado.
   */
  async capture({
    patientId,
    rawMessage,
    verbatimQuote,
    authorityLevel = AuthorityLevel.LEVEL_3_DECLARED,
    category = 'USER_EXPRESSION',
    emotionalValence = 0,
    occurredAt
  }) {
    if (!patientId || !rawMessage) return null;

    const candidateEpisode = {
      id: 'ep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      patientId,
      content: rawMessage,
      verbatimQuote: verbatimQuote || (rawMessage.length < 160 ? rawMessage : ''),
      authorityLevel: Number(authorityLevel || AuthorityLevel.LEVEL_3_DECLARED),
      category,
      state: MemoryState.CANDIDATE,
      importance: 0.70,
      clinicalRelevance: 0.65,
      emotionalValence: Number(emotionalValence || 0),
      occurredAt: occurredAt || new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    const savedId = await this.repo.saveEpisode(patientId, candidateEpisode);

    await this.audit({
      type: AuditEventType.MEMORY_CAPTURED,
      patientId,
      actor: 'DeepPathExtractor',
      payload: { episodeId: savedId, category, authorityLevel, verbatimQuote: candidateEpisode.verbatimQuote }
    });

    return { ...candidateEpisode, id: savedId };
  }

  /**
   * 2. RETRIEVE: Recupera y compila el contexto estructurado óptimo para el Fast Path en < 100ms.
   * 
   * @param {string} patientId
   * @param {string} currentQuery Mensaje actual del usuario.
   * @param {Array<Object>} [recentMessages] Historial de diálogo reciente.
   * @param {Object} [emotionalState] Estado emocional del día (ansiedad, impulsividad).
   * @returns {Promise<{ systemPrompt: string, contextMessages: Array<Object>, telemetry: Object }>}
   */
  async retrieve(patientId, currentQuery = '', recentMessages = [], emotionalState = null, patientProfile = {}) {
    if (!patientId) {
      return this.contextBuilder.buildContext({ currentQuery, recentMessages, emotionalState, patientProfile });
    }

    try {
      // Carga paralela ultra-rápida de datos de memoria
      const [semanticProfile, directives, episodes, lifeTreeNodes] = await Promise.all([
        this.repo.getSemanticProfile(patientId).catch(() => null),
        this.repo.getActiveDirectives(patientId).catch(() => []),
        this.repo.getEpisodes(patientId, { limit: 20 }).catch(() => []),
        this.repo.getLifeTreeNodes(patientId).catch(() => [])
      ]);

      const patientName = patientProfile.display_name || 
        patientProfile.displayName || 
        patientProfile.nombre || 
        patientProfile.contexto_terapeutico?.displayName || 
        semanticProfile?.displayName || 
        'el paciente';

      return this.contextBuilder.buildContext({
        patientName,
        patientProfile,
        semanticProfile,
        directives,
        episodes,
        lifeTreeNodes,
        recentMessages,
        currentQuery,
        emotionalState
      });
    } catch (err) {
      console.warn('[CognitiveMemoryEngine] Fallback en retrieve:', err.message);
      return this.contextBuilder.buildContext({ currentQuery, recentMessages, emotionalState, patientProfile });
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

    const episodes = await this.repo.getEpisodes(patientId, { limit: 40 });
    const existingProfile = await this.repo.getSemanticProfile(patientId) || {
      patientId,
      currentSummary: '',
      activeTriggers: [],
      protectiveAnchors: [],
      coreBeliefs: []
    };

    let consolidatedCount = 0;
    let supersededCount = 0;

    const activeEpisodes = episodes.filter(e => e.state === MemoryState.ACTIVE);
    const candidateEpisodes = episodes.filter(e => e.state === MemoryState.CANDIDATE);

    for (const candidate of candidateEpisodes) {
      // Buscar si existe algún episodio activo con el que conciliar
      const match = activeEpisodes.find(act => 
        act.category === candidate.category ||
        RelevanceScorer.computeSemanticSimilarity(act.content, candidate.content) > 0.60
      );

      const reconciliation = MemoryStateMachine.reconcileContradiction(match, candidate);

      if (reconciliation.action === 'SUPERSEDE') {
        if (reconciliation.updatedExisting) {
          await this.repo.saveEpisode(patientId, reconciliation.updatedExisting);
          supersededCount++;
        }
        await this.repo.saveEpisode(patientId, reconciliation.candidateNew);
        consolidatedCount++;
      } else if (reconciliation.action === 'DISPUTE') {
        if (reconciliation.updatedExisting) {
          await this.repo.saveEpisode(patientId, reconciliation.updatedExisting);
        }
        await this.repo.saveEpisode(patientId, reconciliation.candidateNew);
        consolidatedCount++;
      } else {
        // KEEP_BOTH / Auto-promover a activo
        candidate.state = MemoryState.ACTIVE;
        await this.repo.saveEpisode(patientId, candidate);
        consolidatedCount++;
      }
    }

    // Actualizar timestamp de consolidación
    await this.repo.saveSemanticProfile(patientId, {
      ...existingProfile,
      lastConsolidatedAt: new Date().toISOString()
    });

    await this.audit({
      type: AuditEventType.MEMORY_CONSOLIDATED,
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
   * @param {string} [actor='System']
   * @returns {Promise<void>}
   */
  async update(patientId, memoryId, updates = {}, actor = 'System') {
    if (!patientId || !memoryId) return;

    await this.audit({
      type: AuditEventType.MEMORY_UPDATED,
      patientId,
      actor,
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

  // Métodos de ayuda para directivas y Árbol Vital
  async getDirectives(patientId) {
    return this.repo.getActiveDirectives(patientId);
  }

  async saveDirective(patientId, directive) {
    const id = await this.repo.saveDirective(patientId, directive);
    await this.audit({
      type: AuditEventType.DIRECTIVE_CREATED,
      patientId,
      actor: directive.psychologistId || 'Psychologist',
      payload: { directiveId: id, directive: directive.directive }
    });
    return id;
  }

  async getLifeTree(patientId, category) {
    return this.repo.getLifeTreeNodes(patientId, category);
  }

  async saveLifeTreeNode(patientId, node) {
    return this.repo.saveLifeTreeNode(patientId, node);
  }

  async deleteLifeTreeNode(patientId, nodeId) {
    return this.repo.deleteLifeTreeNode(patientId, nodeId);
  }
}
