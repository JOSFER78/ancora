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
   * @param {string} [params.patientName='Paciente'] Nombre o alias del paciente.
   * @param {Object} [params.semanticProfile=null] Perfil semántico activo.
   * @param {Array<Object>} [params.directives=[]] Directivas clínicas activas del psicólogo.
   * @param {Array<Object>} [params.episodes=[]] Lista de episodios clínicos.
   * @param {Array<Object>} [params.lifeTreeNodes=[]] Nodos del Árbol Vital.
   * @param {Array<Object>} [params.recentMessages=[]] Historial de mensajes recientes.
   * @param {string} [params.currentQuery=''] Último mensaje enviado por el paciente.
   * @param {Object} [params.emotionalState=null] Estado emocional de hoy (ansiedad/impulsividad).
   * @returns {{ systemPrompt: string, contextMessages: Array<Object>, telemetry: Object }}
   */
  buildContext({
    patientName = 'Paciente',
    patientProfile = {},
    semanticProfile = null,
    directives = [],
    episodes = [],
    lifeTreeNodes = [],
    recentMessages = [],
    currentQuery = '',
    emotionalState = null,
    conversationTitle = null,
    topicFolder = null,
    recentCycleSummaries = []
  }) {
    const budget = this.budgetManager.getBudgetDistribution();

    const ctx = patientProfile.contexto_terapeutico || {};
    const effectiveName = patientProfile.display_name || patientProfile.displayName || ctx.displayName || semanticProfile?.displayName || patientName || 'el paciente';
    const motivoConsulta = ctx.motivo || semanticProfile?.motivo || 'Acompañamiento psicológico y regulación emocional';
    const triageData = ctx.triaje || semanticProfile?.triage || null;
    const focosInteres = ctx.tags || semanticProfile?.activeTriggers || [];
    const contactEmergencia = ctx.emergencyContact || null;
    const anoNacimiento = ctx.birthYear || null;

    // 1. Inyectar System Prompt Base (Identidad y Seguridad Clínica)
    let systemPrompt = `Eres Áncora ⚓, el asistente clínico conversacional experto y empático de apoyo cognitivo-conductual de ${effectiveName}, supervisado directamente por su psicólogo colegiado.\n` +
      `PRINCIPIOS INVIOLABLES DE BLINDAJE CLÍNICO:\n` +
      `- CERO COMPLACENCIA: No valides distorsiones cognitivas, sobregeneralizaciones ni impulsos de riesgo.\n` +
      `- NO ERES EL PSICÓLOGO TITULAR: No emitas diagnósticos independientes ni alteres pautas farmacológicas.\n` +
      `- ENFOCADO EN CONTENCIÓN Y ANCLAJE: Utiliza las directivas y pautas somáticas establecidas por el terapeuta.\n` +
      `- FORMATO: Sé directo, cálido, estructurado y conciso. Párrafos breves, negritas y viñetas limpias. Cierra con preguntas abiertas o pautas somáticas concretas.`;

    // Inyectar Foco del Chat Actual y Continuidad entre Sesiones (Estilo Claude Code / ChatGPT)
    let sessionFocusText = '';
    if (conversationTitle || topicFolder || (recentCycleSummaries && recentCycleSummaries.length > 0)) {
      sessionFocusText += `\n\n--- FOCO DE LA CONVERSACIÓN ACTUAL Y CONTINUIDAD ENTRE SESIONES ---`;
      if (conversationTitle) {
        sessionFocusText += `\n• Título/Foco del chat activo: "${conversationTitle}"`;
      }
      if (topicFolder && topicFolder !== 'General') {
        sessionFocusText += `\n• Carpeta temática asignada: "${topicFolder}"`;
      }
      if (recentCycleSummaries && recentCycleSummaries.length > 0) {
        sessionFocusText += `\n• Otras sesiones recientes de este ciclo terapéutico:`;
        recentCycleSummaries.forEach(s => {
          sessionFocusText += `\n  * "${s.title}": ${s.summary}`;
        });
      }
      sessionFocusText += `\nTen presente este hilo temático para orientar tus intervenciones y mantener la continuidad clínica.`;
    }

    // Inyectar datos del triaje de registro y ficha del paciente
    let triageText = sessionFocusText + `\n\n--- EXPEDIENTE CLÍNICO Y TRIAJE INICIAL CONOCIDO ---` +
      `\n• Nombre del paciente: ${effectiveName}` +
      `\n• Motivo inicial de consulta declarado: "${motivoConsulta}"`;

    if (triageData) {
      triageText += `\n• Puntuaciones de Triaje Basal: PHQ-9 (Depresión/Ánimo) = ${triageData.phq9 !== undefined ? triageData.phq9 + '/27' : 'Completado'} | GAD-7 (Ansiedad/Estrés) = ${triageData.gad7 !== undefined ? triageData.gad7 + '/21' : 'Completado'}`;
      if (triageData.highRisk) triageText += ` (Alerta de riesgo basal)`;
    }
    if (focosInteres.length > 0) {
      triageText += `\n• Focos y Etiquetas declaradas: ${focosInteres.join(', ')}`;
    }
    if (contactEmergencia?.name) {
      triageText += `\n• Contacto de emergencia: ${contactEmergencia.name} (${contactEmergencia.phone || 'Sin teléfono'})`;
    }
    if (anoNacimiento) {
      triageText += `\n• Año de nacimiento: ${anoNacimiento}`;
    }

    // Inyectar Historial Clínico Profundo y Formulación (Trading, Impulsividad, Susana, Heridas de Infancia)
    const hist = ctx.historial_clinico || {};
    if (hist.resumen_vital || hist.patrones_comunes || hist.antecedentes_psicologicos) {
      triageText += `\n\n--- HISTORIAL CLÍNICO Y FORMULACIÓN TERAPÉUTICA ---`;
      if (hist.resumen_vital) triageText += `\n• Resumen Clínico Vital: ${hist.resumen_vital}`;
      if (hist.patrones_comunes) triageText += `\n• Patrones y Disparadores: ${hist.patrones_comunes}`;
      if (hist.antecedentes_psicologicos) triageText += `\n• Antecedentes e Introspección: ${hist.antecedentes_psicologicos}`;
      if (hist.antecedentes_medicos) triageText += `\n• Marcadores Médicos y Somáticos: ${hist.antecedentes_medicos}`;
    }

    // Inyectar Dudas Clínicas y Sonsacado Socrático
    const dudas = ctx.dudas_clinicas_sonsacado || [];
    if (dudas.length > 0) {
      triageText += `\n\n--- DUDAS CLÍNICAS PENDIENTES DE EXPLORAR (SONSACADO SOCRÁTICO) ---`;
      dudas.slice(0, 5).forEach((d, idx) => {
        triageText += `\n${idx + 1}. ${d}`;
      });
    }

    triageText += `\n\n--- DIRECTIVAS DE ROL: PSICÓLOGO CLÍNICO JUNIOR PROACTIVO Y EMPÁTICO ---` +
      `\n1. PROACTIVIDAD TERAPÉUTICA: NUNCA respondas con frases frías, genéricas o pasivas tipo "¿Cómo te encuentras hoy? ¿En qué puedo ayudarte?". Conoces a fondo el expediente de ${effectiveName}. Cuando salude o hable, conecta de inmediato con su realidad vivencial (su gestión del estrés/impulsividad, sus hábitos de descanso, sus figuras de apoyo como Susana o sus metas de vida) de forma cálida y humana.` +
      `\n2. SONSACADO PERSUASIVO SIN DIAGNOSTICAR: Tu rol es escuchar, contener, regular y persuadir con sutileza para que el paciente profundice en su historia (familia, infancia, detonantes, relaciones), utilizando preguntas socráticas suaves extraídas de las dudas clínicas pendientes.` +
      `\n3. NOTAS DE VOZ: Si notas que el tema requiere explayarse, anímale con calidez a enviar una nota de voz ("Si te resulta más cómodo, puedes pulsar el micrófono y grabarme un audio breve contándomelo").`;

    systemPrompt += triageText;

    // 2. Inyectar Directivas Clínicas Nivel 1 (Prioridad Máxima e Inviolable)
    if (directives && directives.length > 0) {
      let directivesText = `\n\n--- DIRECTIVAS CLÍNICAS ACTIVAS (FIJADAS POR EL PSICÓLOGO - NIVEL 1 MÁXIMA PRIORIDAD) ---\n`;
      directives.forEach(d => {
        const cat = d.category || d.scope || 'PAUTA';
        const txt = d.directive || d.instruction || d.instruccion || '';
        directivesText += `• [${cat}] (Prioridad ${d.priority || 1}): ${txt}\n`;
      });
      systemPrompt += TokenBudgetManager.truncateToTokenLimit(directivesText, budget.directives);
    }

    // 3. Inyectar Perfil Semántico y Estado Emocional
    let stateText = `\n\n--- ESTADO CLÍNICO CONSOLIDADO ---`;
    if (emotionalState) {
      stateText += `\nRegistro Emocional Actual: Ansiedad ${(emotionalState.anxiety ?? emotionalState.anxiety_level ?? 'N/A')}/10 | Impulsividad ${(emotionalState.impulsivity ?? emotionalState.impulsivity_level ?? 'N/A')}/10`;
      if (emotionalState.notes) stateText += ` | Nota: "${emotionalState.notes}"`;
    }
    if (semanticProfile) {
      if (semanticProfile.currentSummary) stateText += `\nResumen Clínico: ${semanticProfile.currentSummary}`;
      if (semanticProfile.activeTriggers?.length) stateText += `\nDisparadores conocidos: ${semanticProfile.activeTriggers.join(', ')}`;
      if (semanticProfile.protectiveAnchors?.length) stateText += `\nAnclajes Protectores: ${semanticProfile.protectiveAnchors.join(', ')}`;
      if (semanticProfile.coreBeliefs?.length) {
        stateText += `\nEsquemas/Creencias Nucleares: ${semanticProfile.coreBeliefs.map(b => typeof b === 'string' ? b : b.belief).join('; ')}`;
      }
    }
    systemPrompt += TokenBudgetManager.truncateToTokenLimit(stateText, budget.patientState);

    // 4. Seleccionar y ordenar Recuerdos Episódicos y Life Tree por Retrieval Score
    const allMemories = [
      ...episodes.map(e => ({ ...e, type: 'EPISODIO' })),
      ...lifeTreeNodes.map(n => ({ ...n, type: 'ÁRBOL_VITAL', content: n.description }))
    ];

    const scoredMemories = allMemories.map(mem => ({
      memory: mem,
      score: RelevanceScorer.scoreMemory(mem, currentQuery, emotionalState)
    })).sort((a, b) => b.score - a.score);

    // Tomar solo las memorias más relevantes hasta agotar budget.episodicMemory
    let episodicContextText = `\n\n--- EVIDENCIA BIOGRÁFICA Y HECHOS CLÍNICOS RELEVANTES ---`;
    let usedEpisodicTokens = 0;
    let injectedCount = 0;

    for (const item of scoredMemories) {
      const mem = item.memory;
      let line = `\n• [${mem.type}] [Nivel ${mem.authorityLevel || 3}] `;
      if (mem.verbatimQuote || mem.verbatim_quote) {
        line += `Cita textual: "${mem.verbatimQuote || mem.verbatim_quote}" | `;
      }
      line += `${mem.title ? mem.title + ': ' : ''}${mem.content || mem.description || ''}`;

      const lineTokens = TokenBudgetManager.estimateTokens(line);
      if (usedEpisodicTokens + lineTokens > budget.episodicMemory) break;

      episodicContextText += line;
      usedEpisodicTokens += lineTokens;
      injectedCount++;
    }

    if (injectedCount > 0) {
      systemPrompt += episodicContextText;
    }

    // 5. Ajustar Diálogo Reciente (Working Memory Buffer)
    const contextMessages = [];
    let usedWmTokens = 0;

    const reversed = [...recentMessages].reverse();
    const selectedMessages = [];

    for (const msg of reversed) {
      const text = msg.content || msg.text || '';
      const msgTokens = TokenBudgetManager.estimateTokens(text);
      if (usedWmTokens + msgTokens > budget.workingMemory) break;

      selectedMessages.push(msg);
      usedWmTokens += msgTokens;
    }

    // Reordenar cronológicamente
    selectedMessages.reverse().forEach(m => {
      contextMessages.push({
        role: m.role || (m.sender === 'user' || m.isUser ? 'user' : 'assistant'),
        content: m.content || m.text || ''
      });
    });

    return {
      systemPrompt,
      contextMessages,
      telemetry: {
        estimatedSystemTokens: TokenBudgetManager.estimateTokens(systemPrompt),
        estimatedWmTokens: usedWmTokens,
        injectedMemoriesCount: injectedCount,
        budget
      }
    };
  }
}
