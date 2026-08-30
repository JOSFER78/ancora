/**
 * @file MemoryRepositoryFactory.js
 * @description Fábrica y Singleton del Repositorio de Memoria Cognitiva de Áncora.
 * Conecta el motor cognitivo directamente con Google Cloud Firestore y Firebase.
 */

import { FirestoreMemoryAdapter } from './FirestoreMemoryAdapter.js';
import { dbClient } from '../../firebaseAdapter.js';

let activeRepositoryInstance = null;

export class MemoryRepositoryFactory {
  /**
   * Obtiene la instancia activa del repositorio de memoria.
   * Por defecto utiliza FirestoreMemoryAdapter sobre Firebase / Firestore.
   * 
   * @returns {import('./IMemoryRepository.js').IMemoryRepository}
   */
  static getRepository() {
    if (activeRepositoryInstance) {
      return activeRepositoryInstance;
    }

    activeRepositoryInstance = new FirestoreMemoryAdapter(dbClient);
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

export default MemoryRepositoryFactory;
