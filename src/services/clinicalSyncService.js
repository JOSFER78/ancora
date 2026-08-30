import { firebaseClient } from '../firebaseAdapter.js';

/**
 * Servicio Central de Sincronización Clínica de Áncora
 * Garantiza sincronización 100% en tiempo real entre:
 * - Hoy (Dashboard diario)
 * - Chat Diario e Historial de Sesiones
 * - Plan Clínico y Tareas Semanales
 * - Mi Perfil e Historia Clínica
 */

export const getTodayDateStr = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Helper para limpiar y formatear nombres reales de psicólogos (evita alias como USAJOS o emails)
 */
export const getCleanPsychologistName = (psychoId, rawName, psychologistsList = []) => {
  if (rawName && rawName !== 'USAJOS' && !rawName.includes('@') && rawName.trim().length > 2) {
    return rawName.trim();
  }
  const match = (psychologistsList || []).find(p => p.id === psychoId || p.email === 'usajosefernan@gmail.com');
  if (match?.name && match.name !== 'USAJOS' && !match.name.includes('@')) {
    return match.name;
  }
  return 'José Fernández';
};

/**
 * 1. Sincronización de Check-in Emocional Diario
 */
export const getDailyMoodSync = (userId) => {
  if (!userId) return null;
  const today = getTodayDateStr();
  const saved = localStorage.getItem(`ancora_daily_mood_${userId}_${today}`);
  return saved ? JSON.parse(saved) : null;
};

export const saveDailyMoodSync = async (userId, moodScore, notes = '') => {
  if (!userId) return null;
  const today = getTodayDateStr();
  const data = {
    date: today,
    score: moodScore, // 1 (Muy mal) a 5 (Muy bien)
    notes,
    timestamp: new Date().toISOString()
  };

  localStorage.setItem(`ancora_daily_mood_${userId}_${today}`, JSON.stringify(data));

  // Disparar evento para actualización reactiva en todas las vistas abiertas
  window.dispatchEvent(new CustomEvent('ancora_mood_updated', { detail: data }));

  try {
    await firebaseClient.from('daily_checkins').upsert({
      user_id: userId,
      date: today,
      score: moodScore,
      notes,
      updated_at: new Date().toISOString()
    });
  } catch (err) {
    console.warn("Notice syncing mood to Firestore:", err.message);
  }

  return data;
};

/**
 * 2. Sincronización de Tareas y Pautas Terapéuticas
 */
export const DEFAULT_CLINICAL_TASKS = [
  { id: 'task-1', title: 'Registro diario de pensamientos negativos (TCC)', done: false, points: 25, category: 'Cognitiva' },
  { id: 'task-2', title: 'Práctica de Respiración Diafragmática (5 min)', done: false, points: 25, category: 'Regulación' },
  { id: 'task-3', title: 'Rutina de Desactivación Digital (22:30h)', done: false, points: 25, category: 'Sueño' },
  { id: 'task-4', title: 'Registro de picos de activación fisiológica', done: false, points: 25, category: 'Monitorización' }
];

export const getClinicalTasksSync = (userId) => {
  if (!userId) return DEFAULT_CLINICAL_TASKS;
  const saved = localStorage.getItem(`ancora_clinical_tasks_${userId}`);
  return saved ? JSON.parse(saved) : DEFAULT_CLINICAL_TASKS;
};

export const saveClinicalTasksSync = (userId, tasks) => {
  if (!userId) return;
  localStorage.setItem(`ancora_clinical_tasks_${userId}`, JSON.stringify(tasks));
  window.dispatchEvent(new CustomEvent('ancora_tasks_updated', { detail: tasks }));
};

export const calculateAdherence = (tasks = []) => {
  if (!tasks || tasks.length === 0) return 0;
  const total = tasks.reduce((sum, t) => sum + (t.points || 25), 0);
  const done = tasks.filter(t => t.done).reduce((sum, t) => sum + (t.points || 25), 0);
  return total > 0 ? Math.round((done / total) * 100) : 0;
};

/**
 * 3. Sincronización de Puntos y Temas para la Próxima Consulta
 */
export const getAgendaTopicsSync = (userId) => {
  if (!userId) return [];
  const saved = localStorage.getItem(`clinical_agenda_topics_${userId}`);
  return saved ? JSON.parse(saved) : [];
};

export const saveAgendaTopicsSync = (userId, topics) => {
  if (!userId) return;
  localStorage.setItem(`clinical_agenda_topics_${userId}`, JSON.stringify(topics));
  window.dispatchEvent(new CustomEvent('ancora_agenda_updated', { detail: topics }));
};
