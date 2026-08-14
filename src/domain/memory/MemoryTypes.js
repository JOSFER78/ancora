/**
 * @file MemoryTypes.js
 * @description Tipos, Enums y Esquemas de Dominio para el Áncora Cognitive Memory Engine.
 * Diseñado bajo principios de Cero Simulación y Cero Complacencia Clínica.
 */

/**
 * Niveles de Autoridad Epistemológica Estricta.
 * @readonly
 * @enum {number}
 */
export const AuthorityLevel = {
  LEVEL_1_PSYCHOLOGIST: 1, // Validado por Psicólogo Colegiado (Máxima autoridad)
  LEVEL_2_DOCUMENTED: 2,   // Documentado en Informes Médicos / Analíticas / PDF
  LEVEL_3_DECLARED: 3,     // Declarado por el Paciente (Vivencia subjetiva/fenoménica)
  LEVEL_4_AI_INFERENCE: 4  // Inferencia IA / Walter (Borrador en cuarentena)
};

/**
 * Ponderación numérica para cálculo de retrieval score por nivel de autoridad.
 */
export const AuthorityWeights = {
  [AuthorityLevel.LEVEL_1_PSYCHOLOGIST]: 1.00,
  [AuthorityLevel.LEVEL_2_DOCUMENTED]: 0.85,
  [AuthorityLevel.LEVEL_3_DECLARED]: 0.65,
  [AuthorityLevel.LEVEL_4_AI_INFERENCE]: 0.40
};

/**
 * Estados del Ciclo de Vida de una Memoria Clínica.
 * @readonly
 * @enum {string}
 */
export const MemoryState = {
  CANDIDATE: 'CANDIDATE',   // Recién extraído en Deep Path, pendiente de conciliación
  ACTIVE: 'ACTIVE',         // Válido y vigente, elegible para Context Builder
  SUPERSEDED: 'SUPERSEDED', // Sustituido por evolución temporal (no se borra)
  DISPUTED: 'DISPUTED',     // Contradicción activa pendiente de revisión humana
  ARCHIVED: 'ARCHIVED'      // Preservado histórico fuera de foco activo
};

/**
 * Categorías del Árbol Vital (Life Tree).
 * @readonly
 * @enum {string}
 */
export const LifeTreeCategory = {
  INFANCY: 'INFANCY',               // Infancia, crianza y desarrollo
  FAMILY: 'FAMILY',                 // Familia de origen y relaciones nucleares
  RELATIONSHIPS: 'RELATIONSHIPS',   // Pareja, amistades y soporte social
  CAREER_FINANCE: 'CAREER_FINANCE', // Trabajo, vocación, proyectos y deudas
  HEALTH_SOMATIC: 'HEALTH_SOMATIC', // Salud física, síntomas corporales y pánico
  TRAUMA_CRISIS: 'TRAUMA_CRISIS',   // Eventos disruptivos y pérdidas
  PROTECTIVE_ANCHORS: 'PROTECTIVE_ANCHORS' // Recursos de afrontamiento y anclajes
};

/**
 * Categorías de Directivas Clínicas impuestas por el psicólogo.
 * @readonly
 * @enum {string}
 */
export const DirectiveCategory = {
  SAFETY_LIMIT: 'SAFETY_LIMIT',     // Límites éticos y prevención de riesgo
  SOMATIC_ANCHOR: 'SOMATIC_ANCHOR', // Ejercicios corporales (Freeze protocol, respiración)
  COGNITIVE_FRAME: 'COGNITIVE_FRAME', // Encuadre de distorsiones (reestructuración)
  BEHAVIORAL_TASK: 'BEHAVIORAL_TASK', // Tareas entre sesiones (ej. apagado de pantallas)
  COMMUNICATION_STYLE: 'COMMUNICATION_STYLE' // Tono de la IA (directo, empático, sin complacencia)
};

/**
 * Factor de Suelo Asintótico de Recencia (Non-destructive decay).
 * Garantiza que ninguna memoria clínica desaparece con el tiempo.
 */
export const ASYMPTOTIC_RECENCY_FLOOR = 0.25;

/**
 * Vida media base en días para modulación de recencia.
 */
export const HALF_LIFE_DAYS = 30;
