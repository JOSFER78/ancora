/**
 * @file SupabaseMemoryAdapter.js
 * @description Adaptador puente en Supabase/PostgreSQL para el Cognitive Memory Engine.
 * Permite compatibilidad retroactiva con las tablas relacionales existentes (contexto_terapeutico, chat_sessions).
 */

import { IMemoryRepository } from './IMemoryRepository.js';

export class SupabaseMemoryAdapter extends IMemoryRepository {
  /**
   * @param {Object} supabaseClient Instancia del cliente de Supabase JS.
   */
  constructor(supabaseClient) {
    super();
    this.supabase = supabaseClient;
  }

  /**
   * Obtiene el perfil semántico / contexto terapéutico desde Supabase.
   * @param {string} patientId 
   */
  async getSemanticProfile(patientId) {
    if (!patientId || !this.supabase) return null;

    try {
      const { data, error } = await this.supabase
        .from('contexto_terapeutico')
        .select('*')
        .eq('user_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('[SupabaseMemoryAdapter] Error en contexto_terapeutico:', error.message);
      }

      return data ? {
        patientId: data.user_id,
        currentSummary: data.resumen_clinico || data.contenido || '',
        activeTriggers: data.disparadores || [],
        protectiveAnchors: data.anclajes_protectores || [],
        updatedAt: data.created_at
      } : null;
    } catch (err) {
      console.warn('[SupabaseMemoryAdapter] Fallo de red:', err.message);
      return null;
    }
  }

  /**
   * Guarda o actualiza el perfil en Supabase.
   * @param {string} patientId 
   * @param {Object} profile 
   */
  async saveSemanticProfile(patientId, profile) {
    if (!patientId || !this.supabase) return;

    try {
      await this.supabase
        .from('contexto_terapeutico')
        .upsert({
          user_id: patientId,
          resumen_clinico: profile.currentSummary || profile.summary,
          disparadores: profile.activeTriggers || [],
          anclajes_protectores: profile.protectiveAnchors || [],
          updated_at: new Date().toISOString()
        });
    } catch (err) {
      console.error('[SupabaseMemoryAdapter] Error al persistir contexto:', err.message);
    }
  }

  /**
   * Obtiene episodios clínicos activos desde Supabase.
   * @param {string} patientId 
   * @param {{ limit?: number }} [options] 
   */
  async getEpisodes(patientId, options = {}) {
    if (!patientId || !this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('episodios_clinicos')
        .select('*')
        .eq('user_id', patientId)
        .eq('estado', 'ACTIVE')
        .limit(options.limit || 20);

      if (error) return [];
      return (data || []).map(row => ({
        id: row.id,
        patientId: row.user_id,
        content: row.contenido,
        verbatimQuote: row.cita_literal,
        authorityLevel: row.nivel_autoridad || 3,
        createdAt: row.created_at
      }));
    } catch (err) {
      return [];
    }
  }

  /**
   * Guarda un nuevo episodio en Supabase.
   * @param {string} patientId 
   * @param {Object} episode 
   */
  async saveEpisode(patientId, episode) {
    if (!patientId || !this.supabase) return episode.id || 'ep_' + Date.now();

    try {
      const { data, error } = await this.supabase
        .from('episodios_clinicos')
        .insert({
          user_id: patientId,
          contenido: episode.content || episode.summary,
          cita_literal: episode.verbatimQuote || '',
          nivel_autoridad: episode.authorityLevel || 3,
          estado: 'ACTIVE',
          created_at: episode.createdAt || new Date().toISOString()
        })
        .select('id')
        .single();

      return data ? data.id : (episode.id || 'ep_' + Date.now());
    } catch (err) {
      return episode.id || 'ep_' + Date.now();
    }
  }

  /**
   * Obtiene los nodos del Árbol Vital en Supabase.
   * @param {string} patientId 
   * @param {string} [category] 
   */
  async getLifeTreeNodes(patientId, category) {
    if (!patientId || !this.supabase) return [];

    try {
      let query = this.supabase
        .from('arbol_vital_nodos')
        .select('*')
        .eq('user_id', patientId);

      if (category) {
        query = query.eq('categoria', category);
      }

      const { data, error } = await query;
      if (error) return [];

      return (data || []).map(r => ({
        id: r.id,
        patientId: r.user_id,
        category: r.categoria,
        title: r.titulo,
        description: r.descripcion,
        emotionalValence: r.valencia_emocional,
        authorityLevel: r.nivel_autoridad || 3,
        status: r.estado || 'ACTIVE'
      }));
    } catch (err) {
      return [];
    }
  }

  /**
   * Guarda un nodo de Árbol Vital en Supabase.
   * @param {string} patientId 
   * @param {Object} node 
   */
  async saveLifeTreeNode(patientId, node) {
    if (!patientId || !this.supabase) return node.id || 'node_' + Date.now();

    try {
      const { data } = await this.supabase
        .from('arbol_vital_nodos')
        .upsert({
          id: node.id,
          user_id: patientId,
          categoria: node.category,
          titulo: node.title,
          descripcion: node.description,
          valencia_emocional: node.emotionalValence || 0,
          nivel_autoridad: node.authorityLevel || 3,
          estado: node.status || 'ACTIVE'
        })
        .select('id')
        .single();

      return data ? data.id : (node.id || 'node_' + Date.now());
    } catch (err) {
      return node.id || 'node_' + Date.now();
    }
  }

  /**
   * Obtiene directivas clínicas activas.
   * @param {string} patientId 
   */
  async getActiveDirectives(patientId) {
    if (!patientId || !this.supabase) return [];

    try {
      const { data, error } = await this.supabase
        .from('directivas_clinicas')
        .select('*')
        .eq('user_id', patientId)
        .eq('activa', true);

      if (error) return [];
      return (data || []).map(d => ({
        id: d.id,
        category: d.categoria,
        directive: d.instruccion,
        priority: d.prioridad || 1,
        authorityLevel: 1, // Directivas siempre Nivel 1 del psicólogo
        status: 'ACTIVE'
      }));
    } catch (err) {
      return [];
    }
  }

  /**
   * Registra log de auditoría.
   * @param {Object} auditEvent 
   */
  async appendAuditLog(auditEvent) {
    if (!this.supabase) return;
    try {
      await this.supabase.from('audit_logs').insert({
        event_type: auditEvent.type,
        patient_id: auditEvent.patientId,
        actor: auditEvent.actor,
        payload: auditEvent.payload,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      // Silencioso en audit
    }
  }
}
