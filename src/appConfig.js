/**
 * Cuentas con rol elevado, por variable de entorno y sin valor por defecto.
 *
 * Antes estaban escritas aquí como literales: los correos personales de las
 * tres personas reales de la plataforma viajaban al bundle público, donde los
 * lee cualquiera que abra el inspector.
 *
 * LA FUENTE DE VERDAD DEL ROL ES `profiles.role` EN FIRESTORE, que es lo que
 * comprueban las reglas de seguridad. Estas listas son solo un atajo para la
 * interfaz mientras carga el perfil; si se dejan vacías, todo sigue
 * funcionando y el rol sale de Firestore, que es como debe ser.
 *
 *   VITE_OWNER_EMAILS="correo@dominio"
 *   VITE_PSICOLOGO_EMAILS="uno@dominio,otro@dominio"
 */
function readEnvList(key) {
  const raw = (typeof import.meta !== 'undefined' && import.meta.env?.[key]) || '';
  return String(raw)
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

const OWNER_EMAILS = readEnvList('VITE_OWNER_EMAILS');
const PSICOLOGO_EMAILS = readEnvList('VITE_PSICOLOGO_EMAILS');

/** Primer correo de propietario configurado, si lo hay. */
export const OWNER_EMAIL = OWNER_EMAILS[0] || '';

export function isOwnerUser(user) {
  const email = user?.email?.toLowerCase();
  if (!email) return false;
  return OWNER_EMAILS.includes(email);
}

/**
 * ¿Este correo es de psicólogo? Solo como atajo de interfaz: si no consta en
 * la configuración, manda `profiles.role`.
 */
export function isPsicologoEmail(email) {
  const e = String(email || '').toLowerCase();
  return Boolean(e) && PSICOLOGO_EMAILS.includes(e);
}

/** ¿Este correo es de supervisión? Mismo criterio que el propietario. */
export function isSupervisorEmail(email) {
  const e = String(email || '').toLowerCase();
  return Boolean(e) && OWNER_EMAILS.includes(e);
}

export function getUserAppMode(user, profile) {
  const appConfig = profile?.app_config || {};
  const owner = isOwnerUser(user);
  const isPsicologo = profile?.role === 'psicologo';
  const isSupervisor = profile?.role === 'supervisor' || profile?.role === 'admin';

  return {
    isOwner: owner,
    isPsicologo: isPsicologo,
    isSupervisor: isSupervisor,
    isGeneric: !owner && !isPsicologo && !isSupervisor,
    showPersonalModules: owner && appConfig.showPersonalModules !== false
  };
}

export const GENERIC_NAV_ITEMS = [
  { id: 'dashboard', label: 'Hoy' },
  { id: 'chat', label: 'Chat diario' },
  { id: 'diary', label: 'Diario emocional' },
  { id: 'timeline', label: 'Progreso' },
  { id: 'sesiones', label: 'Sesiones' },
  { id: 'plan_terapeutico', label: 'Plan Clínico' },
  { id: 'historial', label: 'Mi historial' },
  { id: 'privacidad', label: 'Privacidad' },
  { id: 'perfil_usuario', label: 'Mi Perfil' }
];


export const PERSONAL_NAV_ITEMS = [
  { id: 'dashboard', label: 'Panel' },
  { id: 'mente', label: 'Mente' },
  { id: 'escudo', label: 'INSS' },
  { id: 'agentes', label: 'Agentes' },
  { id: 'chat', label: 'Chat' },
  { id: 'ajustes', label: 'Ajustes' }
];

export const PSICOLOGO_NAV_ITEMS = [
  { id: 'dashboard', label: 'General' },
  { id: 'perfil', label: 'Pacientes' },
  { id: 'soap', label: 'Notas SOAP' },
  { id: 'briefing', label: 'Preparación' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'ajustes', label: 'Facturas' },
  { id: 'perfil_usuario', label: 'Mi Perfil' }
];

export const SUPERVISOR_NAV_ITEMS = [
  { id: 'dashboard', label: 'Consola Admin' },
  { id: 'chat', label: 'Incidencias' },
  { id: 'ajustes', label: 'Configuración' }
];


/**
 * Psicólogo al que se asigna un paciente cuando no ha elegido ninguno.
 *
 * Estaba escrito a mano en nueve sitios distintos de cinco vistas. No es un
 * dato secreto —los identificadores de `psychologist_profiles` son de lectura
 * pública—, pero tenerlo repetido significa que dar de alta a un segundo
 * profesional obliga a repasar el código entero, y que un paciente puede
 * acabar asignado a alguien sin haberlo elegido.
 *
 * Es un apaño de arranque mientras solo hay un profesional en la plataforma.
 * Lo correcto es que el paciente elija en el catálogo y que sin elección no
 * haya asignación: cuando el catálogo esté vivo, esta constante se borra.
 */
export const DEFAULT_PSICOLOGO_ID =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_DEFAULT_PSICOLOGO_ID) ||
  '2TOfkVIRccgIgz5WamAIVmUPtD63';
