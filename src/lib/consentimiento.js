/**
 * @file consentimiento.js
 * @description Consentimiento informado para el tratamiento de datos de salud
 * con inteligencia artificial.
 *
 * POR QUÉ ESTO BLOQUEA
 * --------------------
 * Lo que se habla con Áncora son datos de salud: categoría especial del
 * artículo 9 del RGPD. Tratarlos exige consentimiento **explícito, informado y
 * específico**, recabado ANTES del tratamiento, no después. Una casilla de
 * «acepto los términos» en el registro no cubre esto: no dice qué se procesa,
 * ni por quién, ni para qué.
 *
 * Por eso la comprobación no es un aviso que se pueda ignorar: si no consta el
 * consentimiento, el chat y la ingesta no arrancan. Un aviso que se puede
 * saltar no es una garantía, y aquí lo que hay detrás es el historial
 * psicológico de una persona.
 *
 * QUÉ HACE QUE UN CONSENTIMIENTO SEA VÁLIDO
 * -----------------------------------------
 * Que sea de la versión vigente del texto. Si cambia lo que se trata o quién
 * lo trata, el consentimiento anterior ya no ampara el nuevo tratamiento: se
 * sube la versión y se vuelve a pedir. Los registros antiguos no se borran
 * —`consents` es inmutable (L5)—, se acumulan.
 */

import { firebaseClient as db } from '../firebaseAdapter.js';

/**
 * Versión vigente del texto de consentimiento.
 *
 * Subirla obliga a todo el mundo a volver a aceptar. Se sube cuando cambia lo
 * que se trata, la finalidad, o los encargados del tratamiento — nunca por una
 * corrección de estilo.
 */
export const CONSENT_VERSION = 'ia-clinica-v1-2026-08';

/** Encargados del tratamiento a los que llegan los datos. */
export const ENCARGADOS = [
  {
    nombre: 'Anthropic',
    para: 'Conversaciones y análisis del material clínico',
    donde: 'Estados Unidos, con cláusulas contractuales tipo de la UE'
  },
  {
    nombre: 'Groq',
    para: 'Transcripción de las notas de voz',
    donde: 'Estados Unidos, con cláusulas contractuales tipo de la UE'
  },
  {
    nombre: 'Deepgram',
    para: 'Voz sintética del acompañamiento hablado',
    donde: 'Estados Unidos, con cláusulas contractuales tipo de la UE'
  },
  {
    nombre: 'Google (Firebase)',
    para: 'Almacenamiento del expediente y autenticación',
    donde: 'Unión Europea'
  }
];

/**
 * El texto que se le enseña al paciente.
 *
 * En castellano llano y en primera persona. Un consentimiento que no se
 * entiende no es informado, por muy firmado que esté.
 */
export const CONSENT_TEXT = {
  titulo: 'Cómo se tratan tus datos de salud',
  version: CONSENT_VERSION,
  intro:
    'Antes de empezar necesitamos tu permiso explícito, porque lo que cuentes aquí ' +
    'son datos de salud y la ley los protege de forma especial. Léelo con calma: ' +
    'está escrito para entenderse.',
  secciones: [
    {
      titulo: 'Qué se trata',
      texto:
        'Lo que escribes en el chat, las notas de voz que grabes, los documentos ' +
        'clínicos que subas y lo que de ahí se extrae para tu historia: hechos de ' +
        'tu vida, cómo te sientes, qué te ayuda y qué te cuesta.'
    },
    {
      titulo: 'Para qué',
      texto:
        'Para acompañarte entre sesiones y para que tu psicólogo/a llegue a la ' +
        'sesión sabiendo lo que ha pasado. No se usa para publicidad, no se vende ' +
        'a nadie y no se emplea para entrenar modelos de inteligencia artificial.'
    },
    {
      titulo: 'Quién lo ve',
      texto:
        'Tú y el psicólogo/a que tengas asignado. Nadie más del equipo accede a tu ' +
        'expediente. Cada acceso queda registrado.'
    },
    {
      titulo: 'Qué NO hace la inteligencia artificial',
      texto:
        'No diagnostica, no pone nombre a lo que te pasa y no decide tu tratamiento. ' +
        'Recoge y ordena lo que cuentas para que lo valore un profesional colegiado, ' +
        'que es quien mantiene el criterio clínico.'
    },
    {
      titulo: 'El límite de la confidencialidad',
      texto:
        'Si aparece una señal de riesgo para tu vida o tu seguridad, se avisa a tu ' +
        'psicólogo/a aunque no lo pidas. Es la única excepción, y preferimos ' +
        'decírtelo ahora que sorprenderte luego.'
    },
    {
      titulo: 'Tus derechos',
      texto:
        'Puedes retirar este permiso cuando quieras, sin dar explicaciones, y pedir ' +
        'ver, corregir o borrar todo lo que consta sobre ti. Retirarlo no afecta al ' +
        'tratamiento que ya se hizo mientras estaba vigente, y no te penaliza en nada.'
    }
  ],
  encargados: ENCARGADOS
};

/** Consentimientos registrados de un usuario, del más reciente al más antiguo. */
export async function loadConsents(userId) {
  if (!userId) return [];
  try {
    const { data } = await db.from('consents').select('*').eq('user_id', userId);
    return Array.isArray(data)
      ? [...data].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
      : [];
  } catch (err) {
    console.warn('[consentimiento] No se han podido leer los consentimientos:', err?.message);
    return [];
  }
}

/** ¿Este registro ampara el tratamiento que hacemos hoy? */
export function esVigente(registro) {
  if (!registro) return false;
  if (registro.revoked_at) return false;
  return (
    registro.ai_consent_version === CONSENT_VERSION &&
    registro.ai_processing_accepted === true
  );
}

/**
 * ¿Puede este paciente usar el chat y la ingesta?
 *
 * Ante un fallo de lectura devuelve `false`. Es deliberado: si no se puede
 * comprobar que hay permiso, no hay permiso. Es preferible que el paciente vea
 * la pantalla de consentimiento de más a que se traten sus datos de menos.
 */
export async function tieneConsentimientoIA(userId) {
  const registros = await loadConsents(userId);
  return registros.some(esVigente);
}

/**
 * Registra la aceptación. `consents` es inmutable: se inserta uno nuevo, nunca
 * se modifica el anterior.
 */
export async function registrarConsentimientoIA(userId, { aceptado = true } = {}) {
  if (!userId) throw new Error('registrarConsentimientoIA necesita el id del usuario.');
  if (!aceptado) throw new Error('No se registra un consentimiento no aceptado.');

  const registro = {
    user_id: userId,
    version: CONSENT_VERSION,
    ai_consent_version: CONSENT_VERSION,
    ai_processing_accepted: true,
    terms_accepted: true,
    clinical_consent_accepted: true,
    encargados: ENCARGADOS.map(e => e.nombre),
    // Se guarda el texto aceptado, no solo su versión: dentro de dos años hay
    // que poder demostrar QUÉ aceptó exactamente esta persona.
    texto_hash: await hashTexto(JSON.stringify(CONSENT_TEXT)),
    user_agent: typeof navigator !== 'undefined' ? String(navigator.userAgent).slice(0, 300) : '',
    created_at: new Date().toISOString()
  };

  await db.from('consents').insert([registro]);
  return registro;
}

/** Huella del texto aceptado, para probar después qué versión se firmó. */
async function hashTexto(texto) {
  try {
    const datos = new TextEncoder().encode(texto);
    const buffer = await globalThis.crypto.subtle.digest('SHA-256', datos);
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .slice(0, 32);
  } catch {
    return '';
  }
}

/** Error que distingue «falta permiso» de un fallo cualquiera. */
export class ConsentRequiredError extends Error {
  constructor(message = 'Falta el consentimiento para el tratamiento de datos de salud con IA.') {
    super(message);
    this.name = 'ConsentRequiredError';
    this.code = 'consent_required';
    this.version = CONSENT_VERSION;
  }
}
