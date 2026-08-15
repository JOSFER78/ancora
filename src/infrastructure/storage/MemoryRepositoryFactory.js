/**
 * @file MemoryRepositoryFactory.js
 * @description Fábrica y Singleton del Repositorio de Memoria Cognitiva de Áncora.
 * Desacopla la elección del adaptador de persistencia (Supabase / Firestore) de los hooks y servicios.
 */

import { SupabaseMemoryAdapter } from './SupabaseMemoryAdapter.js';
import { FirestoreMemoryAdapter } from './FirestoreMemoryAdapter.js';
import { supabase } from '../../supabaseClient.js';
import { db } from '../../firebaseClient.js';

let activeRepositoryInstance = null;

export class MemoryRepositoryFactory {
  /**
   * Obtiene la instancia activa del repositorio de memoria.
   * Por defecto utiliza SupabaseMemoryAdapter sobre el cliente unificado de Supabase/Firestore.
   * 
   * @param {'supabase' | 'firestore'} [type='supabase']
   * @returns {import('./IMemoryRepository.js').IMemoryRepository}
   */
  static getRepository(type = 'supabase') {
    if (activeRepositoryInstance) {
      return activeRepositoryInstance;
    }

    if (type === 'firestore' && db) {
      activeRepositoryInstance = new FirestoreMemoryAdapter(db);
    } else {
      activeRepositoryInstance = new SupabaseMemoryAdapter(supabase);
    }

    return activeRepositoryInstance;
  }

  /**
   * Permite inyectar un repositorio para pruebas unitarias o entornos personalizados.
   * @param {import('./IMemoryRepository.js').IMemoryRepository} repo
   */
  static setRepository(repo) {
    activeRepositoryInstance = repo;
  }

  /**
   * Reinicia la instancia del singleton.
   */
  static reset() {
    activeRepositoryInstance = null;
  }
}
