import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Pause, Play, Square, X, Loader2, Check, Quote, AlertTriangle } from 'lucide-react';
import {
  createContinuousRecorder,
  processRecordingSession,
  RECORDER_STATES
} from '../services/continuousRecorderService.js';

/**
 * Grabadora continua: un botón, y a hablar.
 *
 * DECISIONES DE INTERFAZ QUE NO SON DECORATIVAS
 * --------------------------------------------
 * 1. **El medidor cae a cero en pausa.** No es un adorno: es la única forma de
 *    que la persona VEA que no se está grabando. Un icono de pausa se puede
 *    malinterpretar; una barra plana, no.
 * 2. **Una sesión, aunque se pause diez veces.** Grabar → pausar → seguir
 *    produce una sola nota, porque la persona está contando una sola cosa.
 * 3. **Nada se guarda sin que lo lea antes.** Al parar se muestra la nota
 *    organizada con sus citas, y hasta que no dice «guardar» no toca el
 *    expediente. Es material clínico suyo, no un borrador automático.
 * 4. **Aviso al cerrar la pestaña con la grabación viva**, que si no se pierde
 *    entera y sin rastro.
 *
 * @param {Object} props
 * @param {Object} props.patientContext  Contexto para desambiguar referencias.
 * @param {Function} props.onSave        Recibe ({nota, verbatim, trazabilidad}).
 * @param {Function} [props.onClose]
 */
export default function GrabadoraContinua({ patientContext = {}, onSave, onClose }) {
  const [estado, setEstado] = useState(RECORDER_STATES.IDLE);
  const [nivel, setNivel] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [tramos, setTramos] = useState(0);
  const [procesando, setProcesando] = useState(false);
  const [pasoProceso, setPasoProceso] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const recorderRef = useRef(null);
  const grabandoRef = useRef(false);

  const enCurso = estado === RECORDER_STATES.RECORDING || estado === RECORDER_STATES.PAUSED;

  // El aviso de cierre necesita saber si hay grabación viva, pero el listener
  // se registra una sola vez. La referencia se sincroniza en un efecto: leerla
  // o escribirla durante el render rompe las reglas de React.
  useEffect(() => {
    grabandoRef.current = enCurso || procesando;
  }, [enCurso, procesando]);

  // Si se cierra la pestaña a media grabación, se pierde entera. Avisar es lo
  // mínimo: el navegador no permite guardar nada por nosotros.
  useEffect(() => {
    const aviso = (e) => {
      if (!grabandoRef.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, []);

  // Al desmontar, soltar el micrófono pase lo que pase.
  useEffect(() => () => { recorderRef.current?.cancel?.(); }, []);

  const iniciar = useCallback(async () => {
    setError('');
    setResultado(null);
    try {
      const rec = createContinuousRecorder({
        onStateChange: setEstado,
        onLevel: setNivel,
        onTick: setSegundos
      });
      recorderRef.current = rec;
      await rec.start();
      setTramos(rec.segmentCount);
    } catch (err) {
      setError(
        err?.name === 'NotAllowedError'
          ? 'No has dado permiso para usar el micrófono. Puedes activarlo en el candado de la barra de direcciones.'
          : `No se ha podido abrir el micrófono: ${err.message}`
      );
    }
  }, []);

  const pausar = useCallback(() => {
    recorderRef.current?.pause();
    setNivel(0);
    setTramos(recorderRef.current?.segmentCount || 0);
  }, []);

  const reanudar = useCallback(async () => {
    try {
      await recorderRef.current?.resume();
    } catch (err) {
      setError(`No se ha podido reanudar: ${err.message}`);
    }
  }, []);

  const terminar = useCallback(async () => {
    const rec = recorderRef.current;
    if (!rec) return;
    const { segments } = rec.stop();
    setNivel(0);

    if (!segments.length) {
      setError('No se ha grabado nada.');
      return;
    }

    setProcesando(true);
    setPasoProceso('Transcribiendo lo que has contado...');
    try {
      const salida = await processRecordingSession({
        segments,
        patientContext,
        onProgress: (p) => setPasoProceso(p?.label || 'Procesando...')
      });
      setResultado(salida);
    } catch (err) {
      setError(`No se ha podido procesar la grabación: ${err.message}`);
    } finally {
      setProcesando(false);
      setPasoProceso('');
    }
  }, [patientContext]);

  const descartar = useCallback(() => {
    recorderRef.current?.cancel();
    recorderRef.current = null;
    setEstado(RECORDER_STATES.IDLE);
    setResultado(null);
    setSegundos(0);
    setTramos(0);
    setNivel(0);
    setError('');
  }, []);

  const guardar = useCallback(async () => {
    if (!resultado || !onSave) return;
    setGuardando(true);
    try {
      await onSave(resultado);
      descartar();
      onClose?.();
    } catch (err) {
      setError(`No se ha podido guardar: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  }, [resultado, onSave, onClose, descartar]);

  const reloj = `${String(Math.floor(segundos / 60)).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;

  return (
    <div className="grabadora">
      <div className="grabadora-cabecera">
        <h3>{resultado ? 'Tu nota' : 'Grabadora'}</h3>
        {onClose && (
          <button
            type="button"
            onClick={() => { if (!enCurso && !procesando) { descartar(); onClose(); } }}
            disabled={enCurso || procesando}
            aria-label="Cerrar grabadora"
            className="grabadora-cerrar"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {error && (
        <p className="grabadora-error" role="alert">
          <AlertTriangle size={14} /> {error}
        </p>
      )}

      {/* --- Grabando o en pausa --- */}
      {!resultado && !procesando && (
        <>
          <div className="grabadora-medidor" aria-hidden="true">
            <div
              className="grabadora-nivel"
              style={{
                width: `${Math.min(100, Math.round(nivel * 140))}%`,
                background: estado === RECORDER_STATES.PAUSED ? '#94a3b8' : '#447D82'
              }}
            />
          </div>

          <p className="grabadora-estado" aria-live="polite">
            {estado === RECORDER_STATES.RECORDING && `Grabando · ${reloj}`}
            {estado === RECORDER_STATES.PAUSED && `En pausa · ${reloj} · no se está grabando`}
            {estado === RECORDER_STATES.IDLE && 'Cuéntame lo que quieras. Puedes parar y seguir cuando te apetezca.'}
            {tramos > 1 && ` · ${tramos} tramos`}
          </p>

          <div className="grabadora-botones">
            {estado === RECORDER_STATES.IDLE && (
              <button type="button" onClick={iniciar} className="btn btn-cyan">
                <Mic size={16} /> Empezar a grabar
              </button>
            )}
            {estado === RECORDER_STATES.RECORDING && (
              <>
                <button type="button" onClick={pausar} className="btn">
                  <Pause size={16} /> Pausa
                </button>
                <button type="button" onClick={terminar} className="btn btn-cyan">
                  <Square size={16} /> Terminar
                </button>
              </>
            )}
            {estado === RECORDER_STATES.PAUSED && (
              <>
                <button type="button" onClick={reanudar} className="btn btn-cyan">
                  <Play size={16} /> Seguir
                </button>
                <button type="button" onClick={terminar} className="btn">
                  <Square size={16} /> Terminar
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* --- Procesando --- */}
      {procesando && (
        <p className="grabadora-procesando" aria-live="polite">
          <Loader2 size={16} className="girando" /> {pasoProceso}
        </p>
      )}

      {/* --- Nota lista, pendiente de que la lea --- */}
      {resultado && (
        <div className="grabadora-resultado">
          <h4>{resultado.nota?.titulo || 'Nota de voz'}</h4>
          <p className="grabadora-resumen">{resultado.nota?.resumen}</p>

          <div className="grabadora-texto">
            {String(resultado.nota?.texto_organizado || '')
              .split('\n')
              .filter(Boolean)
              .map((parrafo, i) => <p key={`p-${i}`}>{parrafo}</p>)}
          </div>

          {resultado.nota?.citas_literales?.length > 0 && (
            <div className="grabadora-citas">
              <h5><Quote size={13} /> Tus palabras, tal cual</h5>
              {resultado.nota.citas_literales.map((c, i) => (
                <blockquote key={`c-${i}`}>«{c.cita}»</blockquote>
              ))}
            </div>
          )}

          {resultado.nota?.cabos_sueltos?.length > 0 && (
            <div className="grabadora-cabos">
              <h5>Cosas que dejaste a medias</h5>
              <ul>
                {resultado.nota.cabos_sueltos.map((c, i) => <li key={`cs-${i}`}>{c}</li>)}
              </ul>
            </div>
          )}

          {resultado.fallos?.length > 0 && (
            <p className="grabadora-aviso">
              <AlertTriangle size={13} /> {resultado.fallos.length} de {resultado.porSegmento?.length || '?'} tramos
              no se han podido transcribir. Lo demás sí está.
            </p>
          )}

          <p className="grabadora-nota-pie">
            Se guarda también la transcripción literal, para que tu psicólogo/a pueda ver
            exactamente lo que dijiste.
          </p>

          <div className="grabadora-botones">
            <button type="button" onClick={guardar} disabled={guardando} className="btn btn-cyan">
              {guardando ? <Loader2 size={16} className="girando" /> : <Check size={16} />}
              {guardando ? 'Guardando...' : 'Guardar en mi historia'}
            </button>
            <button type="button" onClick={descartar} disabled={guardando} className="btn">
              Descartar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
