/**
 * @file TokenBudgetManager.js
 * @description Gestor Elástico de Presupuesto de Tokens para el Áncora Cognitive Memory Engine.
 * Previene el 'Lost in the Middle' y el desbordamiento de contexto mediante particionamiento dinámico.
 */

import { DEFAULT_TOKEN_BUDGET } from '../../domain/memory/MemoryTypes.js';

export class TokenBudgetManager {
  /**
   * @param {number} [totalBudget=16384] Presupuesto total de tokens de la ventana de contexto.
   */
  constructor(totalBudget = DEFAULT_TOKEN_BUDGET) {
    this.totalBudget = totalBudget;
  }

  /**
   * Distribución presupuestaria porcentual según especificación clínica:
   * - System & Seguridad: 12%
   * - Directivas Clínicas N1: 10%
   * - Estado Clínico del Paciente: 8%
   * - Memoria Episódica y Hechos: 25%
   * - Working Memory (Diálogo Reciente): 30%
   * - Reserva de Generación Salida: 10%
   * - Margen de Seguridad: 5%
   * 
   * @returns {{ systemCore: number, directives: number, patientState: number, episodicMemory: number, workingMemory: number, outputGeneration: number, safetyMargin: number }}
   */
  getBudgetDistribution() {
    return {
      systemCore: Math.floor(this.totalBudget * 0.12),
      directives: Math.floor(this.totalBudget * 0.10),
      patientState: Math.floor(this.totalBudget * 0.08),
      episodicMemory: Math.floor(this.totalBudget * 0.25),
      workingMemory: Math.floor(this.totalBudget * 0.30),
      outputGeneration: Math.floor(this.totalBudget * 0.10),
      safetyMargin: Math.floor(this.totalBudget * 0.05)
    };
  }

  /**
   * Estima el número de tokens para un texto dado (1 token ≈ 4 caracteres en promedio).
   * @param {string} text 
   * @returns {number}
   */
  static estimateTokens(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Trunca un texto para asegurar que no excede un límite de tokens sin cortar palabras.
   * @param {string} text 
   * @param {number} maxTokens 
   * @returns {string}
   */
  static truncateToTokenLimit(text, maxTokens) {
    if (!text) return '';
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) return text;
    
    const truncated = text.substring(0, maxChars);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
  }
}
