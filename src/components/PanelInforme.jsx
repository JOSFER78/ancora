import { useState, useRef } from 'react';
import { FileSearch, Loader2, Check, X, AlertTriangle, Share2 } from 'lucide-react';
import { generarYGuardarInforme, validarHallazgo, compartirConPaciente } from '../lib/informes.js';
import { REPORT_PERIODS } from '../services/clinicalReportService.js';

/**
 * Informe periódico del paciente, para el psicólogo.
 *
 * DOS COSAS QUE DEFINEN ESTE PANEL
 * --------------------------------
 * 1. **Cada hallazgo se acepta o se descarta a mano.** Lo que produce la IA es
 *    inferencia (N4) hasta que el profesional la valida; entonces pasa a N1 y
 *    manda sobre lo que la IA infiera después. Sin este paso, el sistema
 *    estaría dejando que un modelo escriba en un expediente clínico.
 * 2. **Compartir con el paciente es un acto aparte.** El informe completo
 *    lleva hipótesis de trabajo y señales de riesgo que no se le entregan sin
 *    más. La versión resumida se genera solo cuando el profesional lo decide.
 */
export default function PanelInforme({ patientId, psychologistId }) {
  const [periodo, setPeriodo] = useState('semanal');
  const [generando, setGenerando] = useState(false);
  const [paso, setPaso] = useState('');
  const [informe, setInforme] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [error, setError] = useState('');
  const [decisiones, setDecisiones] = useState({});
  const [compartido, setCompartido] = useState(false);
  const abortRef = useRef(null);

  const generar = async () => {
    setGenerando(true);
    setError('');
    setInforme(null);
    setDecisiones({});
    setCompartido(false);
    abortRef.current = new AbortController();

    try {
      const { informe: resultado, id, guardado, error: errGuardado } = await generarYGuardarInforme({
        patientId,
        psychologistId,
        periodo,
        onPaso: setPaso,
        signal: abortRef.current.signal
      });
      setInforme(resultado);
      setReportId(id);
      if (!guardado && !resultado?.sin_material) {
        setError(`El informe se ha generado pero no se ha podido guardar${errGuardado ? `: ${errGuardado}` : ''}. Cópialo antes de cerrar.`);
      }
    } catch (err) {
      setError(`No se ha podido generar: ${err.message}`);
    } finally {
      setGenerando(false);
      setPaso('');
    }
  };

  const decidir = async (hallazgo, aceptado) => {
    setDecisiones(prev => ({ ...prev, [hallazgo]: aceptado ? 'validado' : 'descartado' }));
    if (!reportId) return;
    try {
      await validarHallazgo(reportId, { hallazgo, aceptado, psychologistId });
    } catch (err) {
      setError(`No se ha podido registrar la decisión: ${err.message}`);
      setDecisiones(prev => {
        const copia = { ...prev };
        delete copia[hallazgo];
        return copia;
      });
    }
  };

  const compartir = async () => {
    if (!reportId) return;
    try {
      await compartirConPaciente(reportId);
      setCompartido(true);
    } catch (err) {
      setError(`No se ha podido compartir: ${err.message}`);
    }
  };

  const hallazgos = Array.isArray(informe?.hallazgos) ? informe.hallazgos : [];
  const riesgos = Array.isArray(informe?.senales_riesgo) ? informe.senales_riesgo : [];

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px', margin: 0 }}>
        Informe periódico
      </h4>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
          disabled={generando}
          aria-label="Periodo del informe"
          style={{ height: '36px', fontSize: '0.76rem', borderRadius: '6px', padding: '0 10px' }}
        >
          {Object.entries(REPORT_PERIODS).map(([clave, cfg]) => (
            <option key={clave} value={clave}>{cfg.label} · {cfg.days} días</option>
          ))}
        </select>

        <button
          type="button"
          onClick={generar}
          disabled={generando || !patientId}
          className="btn btn-cyan"
          style={{ height: '36px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}
        >
          {generando ? <Loader2 size={14} className="girando" /> : <FileSearch size={14} />}
          <span>{generando ? 'Generando...' : 'Generar informe'}</span>
        </button>
      </div>

      {paso && <p style={{ fontSize: '0.74rem', color: 'var(--color-cyan)', margin: 0 }}>{paso}</p>}

      {error && (
        <p style={{ fontSize: '0.74rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <AlertTriangle size={13} /> {error}
        </p>
      )}

      {informe?.sin_material && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
          En este periodo no hay material suficiente para un informe. No se ha guardado nada:
          un expediente lleno de informes que dicen que no hay nada que decir solo estorba.
        </p>
      )}

      {informe && !informe.sin_material && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          {riesgos.length > 0 && (
            <div style={{ background: 'rgba(185, 28, 28, 0.1)', border: '1px solid rgba(185,28,28,0.3)', borderRadius: '8px', padding: '12px' }}>
              <strong style={{ fontSize: '0.75rem', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={13} /> Señales de riesgo del periodo
              </strong>
              {riesgos.map((r, i) => (
                <p key={`r-${i}`} style={{ fontSize: '0.75rem', color: '#fecaca', margin: '8px 0 0' }}>
                  {r.descripcion || r.tipo} — «{r.evidencia}»
                </p>
              ))}
            </div>
          )}

          {informe.resumen && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {informe.resumen}
            </p>
          )}

          {hallazgos.length > 0 && (
            <div>
              <strong style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Hallazgos · acéptalos o descártalos
              </strong>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', margin: '4px 0 10px' }}>
                Lo que aceptes pasa a ser criterio clínico validado y mandará sobre lo que
                la IA infiera más adelante.
              </p>
              {hallazgos.map((h, i) => {
                const texto = typeof h === 'string' ? h : (h.hallazgo || h.descripcion || '');
                const estado = decisiones[texto];
                return (
                  <div
                    key={`h-${i}`}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      marginBottom: '8px',
                      opacity: estado === 'descartado' ? 0.45 : 1
                    }}
                  >
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 4px' }}>{texto}</p>
                    {h.evidencia && (
                      <p style={{ fontSize: '0.72rem', fontStyle: 'italic', color: 'var(--text-tertiary)', margin: '0 0 8px' }}>
                        «{h.evidencia}»
                      </p>
                    )}
                    {estado ? (
                      <span style={{ fontSize: '0.7rem', color: estado === 'validado' ? 'var(--color-emerald)' : 'var(--text-tertiary)' }}>
                        {estado === 'validado' ? '✓ Validado como criterio clínico' : '✕ Descartado'}
                      </span>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => decidir(texto, true)}
                          className="btn"
                          style={{ height: '28px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Check size={12} /> Validar
                        </button>
                        <button
                          type="button"
                          onClick={() => decidir(texto, false)}
                          className="btn"
                          style={{ height: '28px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <X size={12} /> Descartar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            {compartido ? (
              <span style={{ fontSize: '0.74rem', color: 'var(--color-emerald)' }}>
                ✓ Resumen compartido con el paciente
              </span>
            ) : (
              <button
                type="button"
                onClick={compartir}
                disabled={!reportId}
                className="btn"
                style={{ height: '32px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Share2 size={13} /> Compartir un resumen con el paciente
              </button>
            )}
            <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', margin: '8px 0 0' }}>
              El informe completo es tuyo. Al paciente se le entrega una versión resumida
              y contenida, y solo si tú lo decides.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
