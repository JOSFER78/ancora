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
   * Ejecuta una transición formal de estado devolviendo una copia inmutable.
   * @param {Object} memory 
   * @param {string} targetState 
   * @param {string} [reason] 
   * @param {string} [actor] 
   * @returns {Object}
   */
  static transition(memory, targetState, reason = '', actor = 'system') {
    if (!memory) return null;
    const currentState = memory.state || MemoryState.CANDIDATE;
    
    if (!this.isValidTransition(currentState, targetState)) {
      console.warn(`[MemoryStateMachine] Transición no permitida: ${currentState} -> ${targetState}`);
      return memory;
    }

    return {
      ...memory,
      state: targetState,
      stateTransitionHistory: [
        ...(memory.stateTransitionHistory || []),
        {
          fromState: currentState,
          toState: targetState,
          reason,
          actor,
          timestamp: new Date().toISOString()
        }
      ],
      updatedAt: new Date().toISOString()
    };
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
      return { 
        action: 'KEEP_BOTH', 
        candidateNew: { 
          ...newMemory, 
          state: newMemory.state === MemoryState.CANDIDATE ? MemoryState.ACTIVE : (newMemory.state || MemoryState.ACTIVE) 
        } 
      };
    }

    const existingAuth = existingMemory.authorityLevel || AuthorityLevel.LEVEL_3_DECLARED;
    const newAuth = newMemory.authorityLevel || AuthorityLevel.LEVEL_3_DECLARED;

    // Regla 1: Precedencia por Nivel de Autoridad Epistemológica
    // Si la nueva memoria tiene mayor autoridad (ej. Nivel 1 Psicólogo vs Nivel 4 IA o N3 Paciente), prevalece N1.
    if (newAuth < existingAuth) {
      return {
        action: 'SUPERSEDE',
        updatedExisting: {
          ...existingMemory,
          state: MemoryState.SUPERSEDED,
          supersededBy: newMemory.id,
          supersededReason: `Prevalencia de mayor autoridad clínica (N${newAuth} vs N${existingAuth})`,
          updatedAt: new Date().toISOString()
        },
        candidateNew: {
          ...newMemory,
          state: MemoryState.ACTIVE,
          supersedes: existingMemory.id
        }
      };
    }

    // Si la existente tiene mayor autoridad y la nueva es una inferencia IA (N4), la existente no se altera
    if (existingAuth < newAuth) {
      return {
        action: 'KEEP_BOTH',
        candidateNew: {
          ...newMemory,
          state: MemoryState.CANDIDATE,
          subordinatedTo: existingMemory.id
        }
      };
    }

    // Regla 2: Evolución Temporal Clínica (Diferencia de fechas significativa ≥ 14 días)
    const existingDate = new Date(existingMemory.occurredAt || existingMemory.recordedAt || existingMemory.createdAt || Date.now()).getTime();
    const newDate = new Date(newMemory.occurredAt || newMemory.recordedAt || newMemory.createdAt || Date.now()).getTime();
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
          supersedes: existingMemory.id,
          evolutionData: {
            previousMemoryId: existingMemory.id,
            evolutionReason: 'possible_change_over_time',
            transitionDate: new Date().toISOString()
          }
        }
      };
    }

    // Regla 3: Conflicto sincrónico dentro del mismo marco temporal sin jerarquía clara
    if (existingAuth === newAuth && newAuth === AuthorityLevel.LEVEL_3_DECLARED) {
      return {
        action: 'DISPUTE',
        updatedExisting: {
          ...existingMemory,
          state: MemoryState.DISPUTED,
          disputeNote: 'Expresiones del paciente aparentemente contradictorias en corto intervalo (< 14 días)',
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
