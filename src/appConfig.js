export const OWNER_EMAIL = 'josferestudio@gmail.com';

export function isOwnerUser(user) {
  return user?.email?.toLowerCase() === OWNER_EMAIL;
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

