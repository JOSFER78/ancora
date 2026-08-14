/**
 * @file TokenBudgetManager.js
 * @description Gestor Elástico de Presupuesto de Tokens para el Context Builder.
 * Elimina la ventana fija de W=10 mensajes y asigna cuotas proporcionales seguras.
 */

export class TokenBudgetManager {
  /**
   * @param {number} totalContextWindow Tamaño total de la ventana del modelo (por defecto 16,384 tokens).
   */
  constructor(totalContextWindow = 16384) {
    this.totalWindow = totalContextWindow;
  }

  /**
   * Estima el número de tokens de un texto (aproximación 4 caracteres = 1 token para español/inglés).
   * @param {string} text 
   * @returns {number}
   */
  static estimateTokens(text = '') {
    if (!text) return 0;
    return Math.ceil(text.length / 3.8);
  }

  /**
   * Trunca un texto para ajustarlo a un presupuesto máximo de tokens.
   * @param {string} text 
   * @param {number} maxTokens 
   * @returns {string}
   */
  static truncateToTokenLimit(text = '', maxTokens = 500) {
    const maxChars = Math.floor(maxTokens * 3.8);
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars) + '... [Contexto ajustado por límite de tokens]';
  }

  /**
   * Calcula la distribución de cuotas de tokens disponibles.
   * @returns {{
   *   system: number,
   *   directives: number,
   *   patientState: number,
   *   episodicMemory: number,
   *   workingMemory: number,
   *   outputReserve: number
   * }}
   */
  getBudgetDistribution() {
    const reserve = Math.floor(this.totalWindow * 0.15); // 15% reserva de respuesta
    const available = this.totalWindow - reserve;

    return {
      system: Math.floor(available * 0.15),        // 15% System Prompt e identidad
      directives: Math.floor(available * 0.12),    // 12% Directivas clínicas N1 activas
      patientState: Math.floor(available * 0.10),  // 10% Estado y perfil actual
      episodicMemory: Math.floor(available * 0.28),// 28% Memorias episódicas y Life Tree
      workingMemory: Math.floor(available * 0.35), // 35% Historial de diálogo reciente
      outputReserve: reserve
    };
  }
}
