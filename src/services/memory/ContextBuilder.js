/**
 * @file ContextBuilder.js
 * @description Compilador de Contexto Clínico Estructurado de Cero Alucinaciones.
 * Ensambla el payload óptimo para el LLM respetando las cuotas de tokens y niveles de autoridad.
 */

import { TokenBudgetManager } from './TokenBudgetManager.js';
import { RelevanceScorer } from './RelevanceScorer.js';

export class ContextBuilder {
  /**
   * @param {TokenBudgetManager} budgetManager 
   */
  constructor(budgetManager = new TokenBudgetManager(16384)) {
    this.budgetManager = budgetManager;
  }

  /**
   * Compila el contexto completo estructurado para el Fast Path.
   * 
   * @param {Object} params
   * @param {string} params.patientName Nombre o alias del paciente.
   * @param {Object} params.semanticProfile Perfil semántico activo.
   * @param {Array<Object>} params.directives Directivas clínicas activas del psicólogo.
   * @param {Array<Object>} params.episodes Lista de episodios candidatos.
   * @param {Array<Object>} params.lifeTreeNodes Nodos del Árbol Vital.
   * @param {Array<Object>} params.recentMessages Historial de mensajes recientes.
   * @param {string} params.currentQuery Último mensaje enviado por el paciente.
   * @returns {{ systemPrompt: string, contextMessages: Array<Object>, telemetry: Object }}
   */
  buildContext({
    patientName = 'Paciente',
    semanticProfile = null,
    directives = [],
    episodes = [],
    lifeTreeNodes = [],
    recentMessages = [],
    currentQuery = ''
  }) {
    const budget = this.budgetManager.getBudgetDistribution();

    // 1. Inyectar System Prompt Base (Identidad y Seguridad Clínica)
    let systemPrompt = `Eres Áncora, el asistente de apoyo cognitivo-conductual del paciente ${patientName}, supervisado directamente por su psicólogo colegiado.\n` +
      `PRINCIPIOS INVIOLABLES:\n` +
      `- CERO COMPLACENCIA: No valides distorsiones cognitivas ni prometas soluciones mágicas.\n` +
      `- NO ERES EL PSICÓLOGO TITULAR: No emitas diagnósticos clínicos independientes ni modifiques pautas farmacológicas.\n` +
      `- ENFOCADO EN CONTENCIÓN Y ANCLAJE: Utiliza las directivas y pautas somáticas establecidas por su terapeuta.\n` +
      `- BREVEDAD Y CONTACTO: Sé directo, cálido y conciso.`;

    // 2. Inyectar Directivas Clínicas Nivel 1
    if (directives && directives.length > 0) {
      let directivesText = `\n\nDIRECTIVAS CLÍNICAS ACTIVAS (FIJADAS POR EL PSICÓLOGO - PRIORIDAD MÁXIMA):\n`;
      directives.forEach(d => {
        directivesText += `- [${d.category || 'PAUTA'}] ${d.directive || d.instruccion || ''}\n`;
      });
      systemPrompt += TokenBudgetManager.truncateToTokenLimit(directivesText, budget.directives);
    }

    // 3. Inyectar Perfil Semántico y Diagnóstico Activo
    if (semanticProfile) {
      let stateText = `\n\nESTADO CLÍNICO CONSOLIDADO:\n`;
      if (semanticProfile.currentSummary) stateText += `Resumen: ${semanticProfile.currentSummary}\n`;
      if (semanticProfile.activeTriggers?.length) stateText += `Disparadores conocidos: ${semanticProfile.activeTriggers.join(', ')}\n`;
      if (semanticProfile.protectiveAnchors?.length) stateText += `Anclajes protectores: ${semanticProfile.protectiveAnchors.join(', ')}\n`;
      systemPrompt += TokenBudgetManager.truncateToTokenLimit(stateText, budget.patientState);
    }

    // 4. Seleccionar y ordenar Recuerdos Episódicos y Life Tree por Retrieval Score
    const allMemories = [
      ...episodes.map(e => ({ ...e, type: 'EPISODE' })),
      ...lifeTreeNodes.map(n => ({ ...n, type: 'LIFE_TREE', content: n.description }))
    ];

    const scoredMemories = allMemories.map(mem => ({
      memory: mem,
      score: RelevanceScorer.scoreMemory(mem, currentQuery)
    })).sort((a, b) => b.score - a.score);

    // Tomar solo las memorias más relevantes hasta agotar budget.episodicMemory
    let episodicContextText = `\n\nHECHOS BIOGRÁFICOS Y EPISODIOS RELEVANTES:\n`;
    let usedEpisodicTokens = 0;

    for (const item of scoredMemories) {
      const mem = item.memory;
      let line = `- (${mem.type}) [Nivel ${mem.authorityLevel || 3}] `;
      if (mem.verbatimQuote) line += `Cita literal: "${mem.verbatimQuote}" | `;
      line += `${mem.title ? mem.title + ': ' : ''}${mem.content || mem.description || ''}\n`;

      const lineTokens = TokenBudgetManager.estimateTokens(line);
      if (usedEpisodicTokens + lineTokens > budget.episodicMemory) break;

      episodicContextText += line;
      usedEpisodicTokens += lineTokens;
    }

    if (usedEpisodicTokens > 0) {
      systemPrompt += episodicContextText;
    }

    // 5. Ajustar Diálogo Reciente (Working Memory Buffer)
    const contextMessages = [];
    let usedWmTokens = 0;

    // Recorrer los mensajes de más reciente a más antiguo para respetar el budget
    const reversed = [...recentMessages].reverse();
    const selectedMessages = [];

    for (const msg of reversed) {
      const msgTokens = TokenBudgetManager.estimateTokens(msg.content || '');
      if (usedWmTokens + msgTokens > budget.workingMemory) break;

      selectedMessages.push(msg);
      usedWmTokens += msgTokens;
    }

    // Reordenar cronológicamente
    selectedMessages.reverse().forEach(m => {
      contextMessages.push({
        role: m.role || (m.sender === 'patient' ? 'user' : 'assistant'),
        content: m.content || ''
      });
    });

    return {
      systemPrompt,
      contextMessages,
      telemetry: {
        estimatedSystemTokens: TokenBudgetManager.estimateTokens(systemPrompt),
        estimatedWmTokens: usedWmTokens,
        injectedMemoriesCount: scoredMemories.length,
        budget
      }
    };
  }
}
