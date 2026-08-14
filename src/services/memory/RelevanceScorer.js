/**
 * @file RelevanceScorer.js
 * @description Algoritmo de Scoring de Relevancia Clínica No Destructivo.
 * Implementa la ecuación de recuperación con suelo asintótico alpha = 0.25 y factor de autoridad.
 */

import { AuthorityWeights, ASYMPTOTIC_RECENCY_FLOOR, HALF_LIFE_DAYS } from '../../domain/memory/MemoryTypes.js';

export class RelevanceScorer {
  /**
   * Calcula el factor de recencia no destructivo con suelo asintótico.
   * R(Δt) = alpha + (1 - alpha) / (1 + ln(1 + Δt / tau))
   * Garantiza que recuerdos de hace años nunca caen por debajo de alpha (0.25).
   * 
   * @param {number} daysSinceEvent Días transcurridos desde el registro del hecho.
   * @returns {number} Valor entre 0.25 y 1.00.
   */
  static computeRecency(daysSinceEvent) {
    const dt = Math.max(0, daysSinceEvent);
    const alpha = ASYMPTOTIC_RECENCY_FLOOR;
    const tau = HALF_LIFE_DAYS;
    
    return alpha + (1 - alpha) / (1 + Math.log(1 + dt / tau));
  }

  /**
   * Calcula el factor de refuerzo clínico basado en repeticiones y validaciones.
   * Reinf = tanh(0.15 * n_recalls + 0.5 * n_validated)
   * 
   * @param {number} recalls Número de veces que el recuerdo ha sido reactivado.
   * @param {number} validations Número de veces que el psicólogo ha validado el hecho.
   * @returns {number} Valor entre 0.00 y 1.00.
   */
  static computeReinforcement(recalls = 0, validations = 0) {
    return Math.tanh(0.15 * recalls + 0.50 * validations);
  }

  /**
   * Calcula la similitud léxica/semántica aproximada entre la consulta y el texto.
   * (En producción con embeddings, se sustituye por CosineSimilarity de vectores).
   * 
   * @param {string} query Consulta del paciente o contexto actual.
   * @param {string} text Contenido del recuerdo.
   * @returns {number} Valor entre 0.00 y 1.00.
   */
  static computeSemanticSimilarity(query, text) {
    if (!query || !text) return 0.1;

    const qTokens = new Set(query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3));
    const tTokens = new Set(text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3));

    if (qTokens.size === 0) return 0.2;

    let matchCount = 0;
    for (const token of qTokens) {
      if (tTokens.has(token)) matchCount++;
    }

    const jaccard = matchCount / (qTokens.size + tTokens.size - matchCount);
    // Asignar base mínima de 0.15 si hay términos médicos o clínicos coincidentes
    return Math.min(1.0, Math.max(0.15, jaccard * 2.5));
  }

  /**
   * Calcula el Retrieval Score definitivo de una memoria.
   * S_retrieval = 0.30*Sim + 0.20*I + 0.20*CR + 0.10*Recency + 0.10*Reinf + 0.10*Auth
   * 
   * @param {Object} memory Objeto de memoria clínica.
   * @param {string} query Texto de la consulta o mensaje reciente.
   * @returns {number} Score entre 0.00 y 1.00.
   */
  static scoreMemory(memory, query = '') {
    const memoryText = `${memory.title || ''} ${memory.content || ''} ${memory.verbatimQuote || ''}`;
    
    // 1. Similitud semántica
    const sim = memory.embeddingSimilarity !== undefined 
      ? memory.embeddingSimilarity 
      : this.computeSemanticSimilarity(query, memoryText);

    // 2. Importancia intrínseca (I)
    const importance = memory.importance !== undefined ? memory.importance : 0.70;

    // 3. Resonancia clínica / emocional (CR)
    const clinicalRelevance = memory.clinicalRelevance !== undefined ? memory.clinicalRelevance : 0.65;

    // 4. Recencia con suelo no destructivo
    const eventDate = new Date(memory.recordedAt || memory.createdAt || Date.now());
    const days = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
    const recency = this.computeRecency(days);

    // 5. Refuerzo
    const reinforcement = this.computeReinforcement(memory.recallCount || 0, memory.psychologistValidated ? 1 : 0);

    // 6. Autoridad clínica
    const authWeight = AuthorityWeights[memory.authorityLevel] || AuthorityWeights[3];

    // Ponderación multifactorial
    const finalScore = (0.30 * sim) +
                       (0.20 * importance) +
                       (0.20 * clinicalRelevance) +
                       (0.10 * recency) +
                       (0.10 * reinforcement) +
                       (0.10 * authWeight);

    return Number(finalScore.toFixed(4));
  }
}
