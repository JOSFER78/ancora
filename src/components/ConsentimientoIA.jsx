import { useState } from 'react';
import { ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import { CONSENT_TEXT, registrarConsentimientoIA } from '../lib/consentimiento.js';

/**
 * Pantalla de consentimiento para el tratamiento de datos de salud con IA.
 *
 * Bloquea: mientras no se acepte, el chat y la ingesta no arrancan. No es una
 * decisión de interfaz, es lo que exige el artículo 9 del RGPD para los datos
 * de categoría especial.
 *
 * DOS COSAS QUE NO SON ADORNO
 * ---------------------------
 * 1. **El botón de aceptar nace desactivado** y solo se enciende al marcar la
 *    casilla. Aceptar tiene que ser un acto, no el resultado de darle a
 *    «siguiente» sin mirar.
 * 2. **No hay botón de rechazar que parezca un error.** Quien no quiera, cierra
 *    y sigue usando el resto de la plataforma. Un consentimiento con una única
 *    salida no es libre, y si no es libre no es válido.
 */
export default function ConsentimientoIA({ userId, onAceptado, onCancelar }) {
  const [marcado, setMarcado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const aceptar = async () => {
    if (!marcado || !userId) return;
    setGuardando(true);
    setError('');
    try {
      await registrarConsentimientoIA(userId, { aceptado: true });
      onAceptado?.();
    } catch (err) {
      setError(`No se ha podido registrar tu consentimiento: ${err.message}. No se ha tratado ningún dato.`);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="consentimiento">
      <header className="consentimiento-cabecera">
        <ShieldCheck size={22} />
        <div>
          <h2>{CONSENT_TEXT.titulo}</h2>
          <p className="consentimiento-version">Versión {CONSENT_TEXT.version}</p>
        </div>
      </header>

      <p className="consentimiento-intro">{CONSENT_TEXT.intro}</p>

      <div className="consentimiento-cuerpo">
        {CONSENT_TEXT.secciones.map(sec => (
          <section key={sec.titulo}>
            <h3>{sec.titulo}</h3>
            <p>{sec.texto}</p>
          </section>
        ))}

        <section>
          <h3>Por dónde pasan tus datos</h3>
          <ul className="consentimiento-encargados">
            {CONSENT_TEXT.encargados.map(e => (
              <li key={e.nombre}>
                <strong>{e.nombre}</strong> — {e.para}. <em>{e.donde}.</em>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {error && (
        <p className="consentimiento-error" role="alert">
          <AlertTriangle size={14} /> {error}
        </p>
      )}

      <label className="consentimiento-casilla">
        <input
          type="checkbox"
          checked={marcado}
          onChange={e => setMarcado(e.target.checked)}
        />
        <span>
          He leído lo anterior y doy mi consentimiento explícito para que se traten
          mis datos de salud con este fin. Sé que puedo retirarlo cuando quiera.
        </span>
      </label>

      <div className="consentimiento-botones">
        <button
          type="button"
          className="btn btn-cyan"
          disabled={!marcado || guardando}
          onClick={aceptar}
        >
          {guardando ? <Loader2 size={16} className="girando" /> : null}
          {guardando ? 'Registrando...' : 'Doy mi consentimiento'}
        </button>
        {onCancelar && (
          <button type="button" className="btn" onClick={onCancelar} disabled={guardando}>
            Ahora no
          </button>
        )}
      </div>

      <p className="consentimiento-pie">
        Si dices «ahora no», puedes seguir usando el resto de la plataforma y
        decidir más adelante. Tu psicólogo/a sigue siendo el centro de tu proceso.
      </p>
    </div>
  );
}
