/**
 * @file SupabaseMemoryAdapter.js
 * @description Adaptador de persistencia universal para el Áncora Cognitive Memory Engine.
 * Conecta el contrato IMemoryRepository con las tablas relacionales / FirestoreQueryBuilder de Supabase.
 */

import { IMemoryRepository } from './IMemoryRepository.js';
import { MemoryState } from '../../domain/memory/MemoryTypes.js';

export class SupabaseMemoryAdapter extends IMemoryRepository {
  /**
   * @param {Object} supabaseClient Instancia del cliente de Supabase.
   */
  constructor(supabaseClient) {
    super();
    if (!supabaseClient) {
      throw new Error('[SupabaseMemoryAdapter] supabaseClient es requerido.');
    }
    this.supabase = supabaseClient;
  }

  /**
   * Obtiene el perfil semántico consolidado de un paciente.
   * @param {string} patientId 
   * @returns {Promise<Object|null>}
   */
  async getSemanticProfile(patientId) {
    if (!patientId) return null;

    try {
      // 1. Intentar leer de clinical_profiles
      const { data: clinicalProfile, error: cpErr } = await this.supabase
        .from('clinical_profiles')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (!cpErr && clinicalProfile) {
        return {
          id: clinicalProfile.id,
          patientId: clinicalProfile.patient_id,
          currentSummary: clinicalProfile.summary || clinicalProfile.current_summary || '',
          activeTriggers: clinicalProfile.triggers || clinicalProfile.active_triggers || [],
          protectiveAnchors: clinicalProfile.protective_anchors || clinicalProfile.coping_anchors || [],
          coreBeliefs: clinicalProfile.core_beliefs || [],
          riskTrajectory: clinicalProfile.risk_trajectory || { currentRisk: 'low', crisesInLast30Days: 0 },
          lastConsolidatedAt: clinicalProfile.last_consolidated_at || clinicalProfile.updated_at,
          version: clinicalProfile.version || 1
        };
      }

      // 2. Fallback a profiles.contexto_terapeutico
      const { data: userProfile, error: upErr } = await this.supabase
        .from('profiles')
        .select('id, display_name, contexto_terapeutico')
        .eq('id', patientId)
        .maybeSingle();

      if (!upErr && userProfile?.contexto_terapeutico) {
        const ctx = userProfile.contexto_terapeutico;
        const triage = ctx.triaje || {};
        const summary = ctx.foto_persona || 
          ctx.sintesis_ia || 
          ctx.historial_clinico?.resumen_vital || 
          (ctx.motivo ? `Motivo de consulta inicial: ${ctx.motivo}` : '') || 
          ctx.resumen_vital || '';

        return {
          id: 'sp_' + patientId,
          patientId,
          displayName: ctx.displayName || userProfile.display_name || '',
          motivo: ctx.motivo || '',
          triage: ctx.triaje || null,
          currentSummary: summary,
          activeTriggers: ctx.tags || ctx.triggers || ctx.disparadores || [],
          protectiveAnchors: ctx.protective_anchors || ctx.anclajes || [],
          coreBeliefs: ctx.core_beliefs || [],
          riskTrajectory: { currentRisk: triage.highRisk ? 'high' : (ctx.risk_level || 'low'), crisesInLast30Days: 0 },
          lastConsolidatedAt: ctx.last_updated || new Date().toISOString(),
          version: 1
        };
      }

      return null;
    } catch (err) {
      console.warn('[SupabaseMemoryAdapter] Error al leer semanticProfile:', err.message);
      return null;
    }
  }

  /**
   * Guarda o actualiza el perfil semántico del paciente.
   * @param {string} patientId 
   * @param {Object} profile 
   */
  async saveSemanticProfile(patientId, profile) {
    if (!patientId || !profile) return;

    const payload = {
      patient_id: patientId,
      summary: profile.currentSummary || profile.summary || '',
      active_triggers: profile.activeTriggers || [],
      protective_anchors: profile.protectiveAnchors || [],
      core_beliefs: profile.coreBeliefs || [],
      risk_trajectory: profile.riskTrajectory || {},
      last_consolidated_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await this.supabase.from('clinical_profiles').upsert([payload]);

      // Sincronizar en profiles.contexto_terapeutico para compatibilidad total con vistas legacy
      const { data: userProfile } = await this.supabase.from('profiles').select('contexto_terapeutico').eq('id', patientId).maybeSingle();
      const currentCtx = userProfile?.contexto_terapeutico || {};
      await this.supabase.from('profiles').update({
        contexto_terapeutico: {
          ...currentCtx,
          foto_persona: payload.summary || currentCtx.foto_persona,
          triggers: payload.active_triggers,
          protective_anchors: payload.protective_anchors
        }
      }).eq('id', patientId);
    } catch (err) {
      console.error('[SupabaseMemoryAdapter] Error al guardar semanticProfile:', err.message);
      throw err;
    }
  }

  /**
   * Obtiene los episodios clínicos activos de un paciente.
   * @param {string} patientId 
   * @param {{ limit?: number, categories?: string[], states?: string[] }} [options] 
   */
  async getEpisodes(patientId, options = {}) {
    if (!patientId) return [];

    try {
      let query = this.supabase
        .from('clinical_episodes')
        .select('*')
        .eq('patient_id', patientId);

      if (options.states && options.states.length > 0) {
        query = query.in('state', options.states);
      }

      if (options.categories && options.categories.length > 0) {
        query = query.in('category', options.categories);
      }

      query = query.order('created_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) {
        // Si no existe clinical_episodes, intentar con episodes
        const fallbackRes = await this.supabase
          .from('episodes')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })
          .limit(options.limit || 20);
        return (fallbackRes.data || []).map(this._normalizeEpisode);
      }

      return (data || []).map(this._normalizeEpisode);
    } catch (err) {
      console.warn('[SupabaseMemoryAdapter] Error al leer episodios:', err.message);
      return [];
    }
  }

  /**
   * Guarda un nuevo episodio clínico con cita textual (verbatim).
   * @param {string} patientId 
   * @param {Object} episode 
   */
  async saveEpisode(patientId, episode) {
    if (!patientId || !episode) return null;

    const docId = episode.id || 'ep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const row = {
      id: docId,
      patient_id: patientId,
      content: episode.content || episode.narrative || '',
      verbatim_quote: episode.verbatimQuote || episode.verbatim_quote || '',
      authority_level: Number(episode.authorityLevel || episode.authority_level || 3),
      category: episode.category || 'USER_EXPRESSION',
      state: episode.state || MemoryState.ACTIVE,
      importance: Number(episode.importance ?? 0.7),
      clinical_relevance: Number(episode.clinicalRelevance ?? episode.clinical_relevance ?? 0.65),
      emotional_valence: Number(episode.emotionalValence ?? episode.emotional_valence ?? 0),
      occurred_at: episode.occurredAt || episode.occurred_at || new Date().toISOString(),
      created_at: episode.createdAt || episode.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await this.supabase.from('clinical_episodes').upsert([row]);
      return docId;
    } catch (err) {
      console.error('[SupabaseMemoryAdapter] Error al guardar episodio:', err.message);
      throw err;
    }
  }

  /**
   * Obtiene los nodos del Árbol Vital (Life Tree).
   * @param {string} patientId 
   * @param {string} [category] 
   */
  async getLifeTreeNodes(patientId, category) {
    if (!patientId) return [];

    try {
      let query = this.supabase
        .from('clinical_life_tree')
        .select('*')
        .eq('patient_id', patientId);

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) {
        console.warn('[SupabaseMemoryAdapter] Fallback lifeTree:', error.message);
        return [];
      }

      return (data || []).map(n => ({
        id: n.id,
        patientId: n.patient_id,
        category: n.category,
        title: n.title,
        description: n.description || n.content || '',
        authorityLevel: Number(n.authority_level || 3),
        emotionalValence: Number(n.emotional_valence ?? 0),
        salienceWeight: Number(n.salience_weight ?? 0.7),
        verbatimQuotes: n.verbatim_quotes || (n.verbatim_quote ? [n.verbatim_quote] : []),
        status: n.status || 'ACTIVE',
        createdAt: n.created_at,
        updatedAt: n.updated_at
      }));
    } catch (err) {
      console.warn('[SupabaseMemoryAdapter] Error al leer LifeTree:', err.message);
      return [];
    }
  }

  /**
   * Guarda o actualiza un nodo del Árbol Vital.
   * @param {string} patientId 
   * @param {Object} node 
   */
  async saveLifeTreeNode(patientId, node) {
    if (!patientId || !node) return null;

    const docId = node.id || 'lt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const row = {
      id: docId,
      patient_id: patientId,
      category: node.category || 'PROTECTIVE_ANCHORS',
      title: node.title || 'Nodo Vital',
      description: node.description || node.content || '',
      authority_level: Number(node.authorityLevel || node.authority_level || 3),
      emotional_valence: Number(node.emotionalValence ?? node.emotional_valence ?? 0),
      salience_weight: Number(node.salienceWeight ?? node.salience_weight ?? 0.7),
      verbatim_quotes: node.verbatimQuotes || [],
      status: node.status || 'ACTIVE',
      created_at: node.createdAt || node.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await this.supabase.from('clinical_life_tree').upsert([row]);
      return docId;
    } catch (err) {
      console.error('[SupabaseMemoryAdapter] Error al guardar nodo en LifeTree:', err.message);
      throw err;
    }
  }

  /**
   * Elimina un nodo del Árbol Vital.
   * @param {string} patientId 
   * @param {string} nodeId 
   */
  async deleteLifeTreeNode(patientId, nodeId) {
    if (!patientId || !nodeId) return;
    try {
      await this.supabase.from('clinical_life_tree').delete().eq('id', nodeId);
    } catch (err) {
      console.error('[SupabaseMemoryAdapter] Error al borrar nodo LifeTree:', err.message);
      throw err;
    }
  }

  /**
   * Obtiene las directivas clínicas activas impuestas por el psicólogo.
   * @param {string} patientId 
   */
  async getActiveDirectives(patientId) {
    if (!patientId) return [];

    try {
      const { data, error } = await this.supabase
        .from('clinical_directives')
        .select('*')
        .eq('patient_id', patientId)
        .order('priority', { ascending: true });

      if (error) {
        return [];
      }

      return (data || []).map(d => ({
        id: d.id,
        patientId: d.patient_id,
        psychologistId: d.psychologist_id,
        category: d.category || d.scope || 'SAFETY_LIMIT',
        directive: d.directive || d.instruction || '',
        priority: Number(d.priority || 1),
        authorityLevel: 1, // Directivas siempre son Nivel 1
        status: d.status || 'ACTIVE',
        validFrom: d.valid_from || d.created_at,
        validUntil: d.valid_until || null,
        createdAt: d.created_at
      }));
    } catch (err) {
      console.warn('[SupabaseMemoryAdapter] Error al leer directivas:', err.message);
      return [];
    }
  }

  /**
   * Guarda o actualiza una directiva clínica.
   * @param {string} patientId 
   * @param {Object} directive 
   */
  async saveDirective(patientId, directive) {
    if (!patientId || !directive) return null;

    const docId = directive.id || 'dir_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const row = {
      id: docId,
      patient_id: patientId,
      psychologist_id: directive.psychologistId || directive.psychologist_id || 'system',
      category: directive.category || directive.scope || 'SAFETY_LIMIT',
      directive: directive.directive || directive.instruction || '',
      instruction: directive.instruction || directive.directive || '',
      priority: Number(directive.priority || 1),
      status: directive.status || 'ACTIVE',
      valid_from: directive.validFrom || directive.valid_from || new Date().toISOString(),
      valid_until: directive.validUntil || directive.valid_until || null,
      created_at: directive.createdAt || directive.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    try {
      await this.supabase.from('clinical_directives').upsert([row]);
      return docId;
    } catch (err) {
      console.error('[SupabaseMemoryAdapter] Error al guardar directiva:', err.message);
      throw err;
    }
  }

  /**
   * Registra un evento en el log inmutable de auditoría.
   * @param {Object} auditEvent 
   */
  async appendAuditLog(auditEvent) {
    const logId = 'audit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const row = {
      id: logId,
      patient_id: auditEvent.patientId || auditEvent.patient_id || 'system',
      event_type: auditEvent.type || auditEvent.eventType || 'GENERIC',
      actor: typeof auditEvent.actor === 'string' ? auditEvent.actor : JSON.stringify(auditEvent.actor || {}),
      payload: auditEvent.payload || {},
      created_at: new Date().toISOString()
    };

    try {
      await this.supabase.from('audit_logs').insert([row]);
    } catch (err) {
      console.warn('[SupabaseMemoryAdapter] Error registrando auditoría:', err.message);
    }
  }

  /**
   * Recupera logs de auditoría.
   * @param {string} patientId 
   * @param {{ limit?: number }} [options] 
   */
  async getAuditLogs(patientId, options = {}) {
    if (!patientId) return [];

    try {
      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(options.limit || 50);

      if (error) return [];
      return data || [];
    } catch (err) {
      console.warn('[SupabaseMemoryAdapter] Error al leer auditLogs:', err.message);
      return [];
    }
  }

  _normalizeEpisode(ep) {
    return {
      id: ep.id,
      patientId: ep.patient_id,
      content: ep.content || ep.narrative || '',
      verbatimQuote: ep.verbatim_quote || ep.verbatimQuote || '',
      authorityLevel: Number(ep.authority_level || ep.authorityLevel || 3),
      category: ep.category || 'USER_EXPRESSION',
      state: ep.state || MemoryState.ACTIVE,
      importance: Number(ep.importance ?? 0.7),
      clinicalRelevance: Number(ep.clinical_relevance ?? ep.clinicalRelevance ?? 0.65),
      emotionalValence: Number(ep.emotional_valence ?? ep.emotionalValence ?? 0),
      occurredAt: ep.occurred_at || ep.created_at,
      createdAt: ep.created_at,
      updatedAt: ep.updated_at
    };
  }
}
