/**
 * @file MemoryStateMachine.js
 * @description Máquina de estados bi-temporal para el Áncora Cognitive Memory Engine.
 * Modela la evolución de recuerdos clínicos sin destrucción de datos históricos.
 */

import { MemoryState, AuthorityLevel } from './MemoryTypes.js';

export class MemoryStateMachine {
  /**
   * Evalúa si una transición de estado es válida.
   * @param {string} currentState 
   * @param {string} targetState 
   * @returns {boolean}
   */
  static isValidTransition(currentState, targetState) {
    const transitions = {
      [MemoryState.CANDIDATE]: [MemoryState.ACTIVE, MemoryState.DISPUTED, MemoryState.ARCHIVED],
      [MemoryState.ACTIVE]: [MemoryState.SUPERSEDED, MemoryState.DISPUTED, MemoryState.ARCHIVED],
      [MemoryState.DISPUTED]: [MemoryState.ACTIVE, MemoryState.SUPERSEDED, MemoryState.ARCHIVED],
      [MemoryState.SUPERSEDED]: [MemoryState.ARCHIVED, MemoryState.ACTIVE], // Reactivación excepcional
      [MemoryState.ARCHIVED]: [MemoryState.ACTIVE]
    };

    return (transitions[currentState] || []).includes(targetState);
  }

  /**
   * Resuelve la interacción entre una memoria existente y una nueva observación.
   * Si detecta un cambio biográfico legítimo a lo largo del tiempo, marca la anterior
   * como SUPERSEDED con `possible_change_over_time: true`, preservando la trayectoria.
   * 
   * @param {Object} existingMemory Memoria activa actual en la base de datos.
   * @param {Object} newMemory Observación entrante extraída de la sesión.
   * @returns {{ action: 'SUPERSEDE' | 'DISPUTE' | 'KEEP_BOTH' | 'MERGE', updatedExisting?: Object, candidateNew?: Object }}
   */
  static reconcileContradiction(existingMemory, newMemory) {
    if (!existingMemory) {
      return { action: 'KEEP_BOTH', candidateNew: { ...newMemory, state: MemoryState.ACTIVE } };
    }

    // Regla 1: Precedencia por Nivel de Autoridad Epistemológica
    // Si la nueva memoria tiene mayor autoridad (ej. Nivel 1 Psicólogo vs Nivel 4 IA), prevalece N1.
    if (newMemory.authorityLevel < existingMemory.authorityLevel) {
      return {
        action: 'SUPERSEDE',
        updatedExisting: {
          ...existingMemory,
          state: MemoryState.SUPERSEDED,
          supersededBy: newMemory.id,
          supersededReason: `Prevalencia de mayor autoridad clínica (N${newMemory.authorityLevel} vs N${existingMemory.authorityLevel})`,
          updatedAt: new Date().toISOString()
        },
        candidateNew: {
          ...newMemory,
          state: MemoryState.ACTIVE
        }
      };
    }

    // Regla 2: Evolución Temporal Clínica (Diferencia de fechas significativa)
    const existingDate = new Date(existingMemory.recordedAt || existingMemory.createdAt).getTime();
    const newDate = new Date(newMemory.recordedAt || newMemory.createdAt).getTime();
    const diffDays = Math.abs(newDate - existingDate) / (1000 * 60 * 60 * 24);

    if (diffDays >= 14) {
      // Evolución temporal terapéutica legítima: se conserva el histórico y se activa lo nuevo
      return {
        action: 'SUPERSEDE',
        updatedExisting: {
          ...existingMemory,
          state: MemoryState.SUPERSEDED,
          possibleChangeOverTime: true,
          supersededBy: newMemory.id,
          supersededReason: `Evolución temporal del paciente (${Math.round(diffDays)} días transcurridos)`,
          updatedAt: new Date().toISOString()
        },
        candidateNew: {
          ...newMemory,
          state: MemoryState.ACTIVE,
          supersedes: existingMemory.id
        }
      };
    }

    // Regla 3: Conflicto sincrónico dentro del mismo marco temporal sin jerarquía clara
    if (existingMemory.authorityLevel === newMemory.authorityLevel && newMemory.authorityLevel === AuthorityLevel.LEVEL_3_DECLARED) {
      return {
        action: 'DISPUTE',
        updatedExisting: {
          ...existingMemory,
          state: MemoryState.DISPUTED,
          disputeNote: 'Expresiones del paciente aparentemente contradictorias en corto intervalo',
          updatedAt: new Date().toISOString()
        },
        candidateNew: {
          ...newMemory,
          state: MemoryState.DISPUTED,
          disputeTargetId: existingMemory.id
        }
      };
    }

    return {
      action: 'KEEP_BOTH',
      candidateNew: {
        ...newMemory,
        state: MemoryState.ACTIVE
      }
    };
  }
}
