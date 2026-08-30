/**
 * @file IMemoryRepository.js
 * @description Interfaz de repositorio de persistencia para el Áncora Cognitive Memory Engine.
 * Define el contrato que deben cumplir todas las fuentes de almacenamiento (Firestore, Firebase, etc.).
 */

export class IMemoryRepository {
  /**
   * Obtiene el perfil semántico consolidado de un paciente.
   * @param {string} patientId
   * @returns {Promise<Object|null>}
   */
  async getSemanticProfile(patientId) {
    throw new Error('IMemoryRepository.getSemanticProfile not implemented');
  }

  /**
   * Guarda o actualiza el perfil semántico de un paciente.
   * @param {string} patientId
   * @param {Object} profile
   * @returns {Promise<void>}
   */
  async saveSemanticProfile(patientId, profile) {
    throw new Error('IMemoryRepository.saveSemanticProfile not implemented');
  }

  /**
   * Obtiene los episodios clínicos activos de un paciente.
   * @param {string} patientId
   * @param {{ limit?: number, categories?: string[], states?: string[] }} [options]
   * @returns {Promise<Array<Object>>}
   */
  async getEpisodes(patientId, options) {
    throw new Error('IMemoryRepository.getEpisodes not implemented');
  }

  /**
   * Guarda un nuevo episodio clínico con cita textual (verbatim).
   * @param {string} patientId
   * @param {Object} episode
   * @returns {Promise<string>} ID del episodio guardado
   */
  async saveEpisode(patientId, episode) {
    throw new Error('IMemoryRepository.saveEpisode not implemented');
  }

  /**
   * Obtiene los nodos del Árbol Vital (Life Tree).
   * @param {string} patientId
   * @param {string} [category]
   * @returns {Promise<Array<Object>>}
   */
  async getLifeTreeNodes(patientId, category) {
    throw new Error('IMemoryRepository.getLifeTreeNodes not implemented');
  }

  /**
   * Guarda o actualiza un nodo en el Árbol Vital.
   * @param {string} patientId
   * @param {Object} node
   * @returns {Promise<string>} ID del nodo guardado
   */
  async saveLifeTreeNode(patientId, node) {
    throw new Error('IMemoryRepository.saveLifeTreeNode not implemented');
  }

  /**
   * Elimina o archiva un nodo del Árbol Vital.
   * @param {string} patientId
   * @param {string} nodeId
   * @returns {Promise<void>}
   */
  async deleteLifeTreeNode(patientId, nodeId) {
    throw new Error('IMemoryRepository.deleteLifeTreeNode not implemented');
  }

  /**
   * Obtiene las directivas clínicas activas fijadas por el psicólogo.
   * @param {string} patientId
   * @returns {Promise<Array<Object>>}
   */
  async getActiveDirectives(patientId) {
    throw new Error('IMemoryRepository.getActiveDirectives not implemented');
  }

  /**
   * Guarda o actualiza una directiva clínica.
   * @param {string} patientId
   * @param {Object} directive
   * @returns {Promise<string>}
   */
  async saveDirective(patientId, directive) {
    throw new Error('IMemoryRepository.saveDirective not implemented');
  }

  /**
   * Registra un evento inmutable en el log de auditoría.
   * @param {Object} auditEvent
   * @returns {Promise<void>}
   */
  async appendAuditLog(auditEvent) {
    throw new Error('IMemoryRepository.appendAuditLog not implemented');
  }

  /**
   * Recupera el log de auditoría de un paciente.
   * @param {string} patientId
   * @param {{ limit?: number }} [options]
   * @returns {Promise<Array<Object>>}
   */
  async getAuditLogs(patientId, options) {
    throw new Error('IMemoryRepository.getAuditLogs not implemented');
  }
}
