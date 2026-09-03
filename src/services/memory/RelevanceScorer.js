import { BM25Index } from './BM25.js';
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
    const dt = Math.max(0, Number(daysSinceEvent) || 0);
    const alpha = ASYMPTOTIC_RECENCY_FLOOR; // 0.25
    const tau = HALF_LIFE_DAYS;             // 30 días
    
    return alpha + (1 - alpha) / (1 + Math.log(1 + dt / tau));
  }

  /**
   * Calcula el factor de refuerzo clínico basado en repeticiones y validaciones.
   * Reinf = tanh(0.15 * n_recalls + 0.50 * n_validated)
   * 
   * @param {number} recalls Número de veces que el recuerdo ha sido reactivado.
   * @param {number} validations Número de veces que el psicólogo ha validado el hecho.
   * @returns {number} Valor entre 0.00 y 1.00.
   */
  static computeReinforcement(recalls = 0, validations = 0) {
    const r = Math.max(0, Number(recalls) || 0);
    const v = Math.max(0, Number(validations) || 0);
    return Math.tanh(0.15 * r + 0.50 * v);
  }

  /**
   * Calcula la resonancia con el estado emocional activo del paciente.
   * @param {Object} memory 
   * @param {Object} [emotionalState] { anxiety: 1-10, impulsivity: 1-10, risk: 'low'|'moderate'|'high' }
   * @returns {number}
   */
  static computeStateResonance(memory, emotionalState = null) {
    if (!emotionalState) {
      return Number(memory.clinicalRelevance ?? memory.clinical_relevance ?? 0.65);
    }

    let resonance = Number(memory.clinicalRelevance ?? memory.clinical_relevance ?? 0.65);
    const text = `${memory.title || ''} ${memory.content || ''} ${memory.description || ''} ${memory.category || ''}`.toLowerCase();

    // Si el paciente tiene ansiedad alta (>6), dar mayor peso a recuerdos somáticos y de pánico
    if ((emotionalState.anxiety || emotionalState.anxiety_level) >= 6) {
      if (text.includes('pánico') || text.includes('ansiedad') || text.includes('taquicardia') || text.includes('freeze') || text.includes('respiración')) {
        resonance = Math.min(1.0, resonance + 0.25);
      }
    }

    // Si hay riesgo o impulsividad alta (>6), priorizar límites de seguridad y trading
    if ((emotionalState.impulsivity || emotionalState.impulsivity_level) >= 6) {
      if (text.includes('trading') || text.includes('deuda') || text.includes('impulso') || text.includes('dinero') || text.includes('mercado')) {
        resonance = Math.min(1.0, resonance + 0.25);
      }
    }

    return resonance;
  }

  /**
   * Similitud léxica entre la consulta y el texto de un recuerdo.
   *
   * Antes era Jaccard sobre conjuntos de palabras, y eso trataba «que» igual
   * que «insomnio»: en un expediente clínico, donde las palabras corrientes
   * salen en todos los recuerdos y las que importan en dos, era justo lo que
   * no había que hacer. Ahora es BM25, que pondera por rareza (IDF), satura la
   * repetición y compensa la longitud del texto.
   *
   * La búsqueda densa con vectores está descartada por falta de proveedor
   * utilizable con datos de salud (D-07); el hueco que deja se cierra con
   * expansión de consulta, no con embeddings.
   *
   * @param {string} query Consulta del paciente o contexto actual.
   * @param {string} text Contenido del recuerdo.
   * @param {Object} [opciones]
   * @param {BM25Index} [opciones.indice]  Índice del corpus, si se dispone de él.
   * @param {number} [opciones.indiceDoc]  Posición del recuerdo en ese índice.
   * @returns {number} Valor entre 0.00 y 1.00.
   */
  static computeSemanticSimilarity(query, text, { indice = null, indiceDoc = null } = {}) {
    if (!query || !text) return 0.2;

    // Con el corpus entero disponible, BM25 puede usar el IDF real: sabe qué
    // palabras distinguen a ESTE paciente de los demás recuerdos suyos.
    if (indice && indiceDoc !== null && indiceDoc >= 0) {
      return Math.max(0.15, indice.similitud(query, indiceDoc));
    }

    // Sin corpus, se hace un índice de un solo documento. El IDF entonces no
    // aporta —solo hay un documento—, pero la saturación y la normalización
    // por longitud siguen siendo mejores que contar coincidencias a pelo.
    const suelto = new BM25Index([{ t: text }], d => d.t);
    return Math.max(0.15, suelto.similitud(query, 0));
  }

  /**
   * Calcula el Retrieval Score definitivo de una memoria.
   * S_retrieval = 0.30*Sim + 0.20*I + 0.20*CR + 0.10*Recency + 0.10*Reinf + 0.10*Auth
   * 
   * @param {Object} memory Objeto de memoria clínica.
   * @param {string} query Texto de la consulta o mensaje reciente.
   * @param {Object} [emotionalState] Estado emocional actual del paciente.
   * @returns {number} Score entre 0.00 y 1.00.
   */
  static scoreMemory(memory, query = '', emotionalState = null) {
    if (!memory) return 0;

    const memoryText = `${memory.title || ''} ${memory.content || ''} ${memory.description || ''} ${memory.verbatimQuote || memory.verbatim_quote || ''}`;
    
    // 1. Similitud léxica (peso 0.30)
    const sim = memory.embeddingSimilarity !== undefined
      ? memory.embeddingSimilarity
      : this.computeSemanticSimilarity(query, memoryText, {
          indice: memory._bm25Index || null,
          indiceDoc: memory._bm25Doc ?? null
        });

    // 2. Importancia intrínseca (I) (peso 0.20)
    const importance = memory.importance !== undefined ? Number(memory.importance) : 0.70;

    // 3. Resonancia clínica / emocional (CR) (peso 0.20)
    const clinicalRelevance = this.computeStateResonance(memory, emotionalState);

    // 4. Recencia con suelo no destructivo (peso 0.10)
    const eventDate = new Date(memory.occurredAt || memory.occurred_at || memory.recordedAt || memory.createdAt || memory.created_at || Date.now());
    const days = (Date.now() - eventDate.getTime()) / (1000 * 60 * 60 * 24);
    const recency = this.computeRecency(days);

    // 5. Refuerzo Hebbiano (peso 0.10)
    const validations = (memory.psychologistValidated || memory.authorityLevel === 1 || memory.authority_level === 1) ? 1 : 0;
    const reinforcement = this.computeReinforcement(memory.recallCount || 0, validations);

    // 6. Autoridad clínica (peso 0.10)
    const authLevel = Number(memory.authorityLevel || memory.authority_level || 3);
    const authWeight = AuthorityWeights[authLevel] || AuthorityWeights[3];

    // Ponderación multifactorial de 6 factores
    const finalScore = (0.30 * sim) +
                       (0.20 * importance) +
                       (0.20 * clinicalRelevance) +
                       (0.10 * recency) +
                       (0.10 * reinforcement) +
                       (0.10 * authWeight);

    return Number(Math.min(1.0, Math.max(0.0, finalScore)).toFixed(4));
  }
}
