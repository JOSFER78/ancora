import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { RefreshCw, Brain, Landmark, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function BingXWidget({ user, onTabChange }) {
  const [bingxData, setBingxData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncingHistory, setSyncingHistory] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchBingxLive = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión de Supabase inactiva.");

      const response = await fetch('https://ysnorelkaccaikvuqgnv.supabase.co/functions/v1/chat-terapeuta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'get_bingx_data' })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || `Error HTTP ${response.status}`);
      }

      setBingxData(resData);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error fetching BingX data:", err.message);
      setError(err.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSyncHistory = async () => {
    setSyncingHistory(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesión de Supabase inactiva.");

      // Llamada a la Edge Function para sincronizar el historial
      const response = await fetch('https://ysnorelkaccaikvuqgnv.supabase.co/functions/v1/chat-terapeuta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'sync_closed_trades' })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || `Error de Sincronización HTTP ${response.status}`);
      }

      // Disparar evento global para avisar a ViabilityWidget que recargue
      window.dispatchEvent(new Event('sync_journal_days'));
      alert(`Sincronización completada: se sincronizaron y consolidaron los trades de los últimos días.`);
      
      // Actualizar datos de balances/posiciones actuales
      fetchBingxLive(true);
    } catch (err) {
      console.error("Error syncing closed trades:", err.message);
      alert("Error al sincronizar el historial: " + err.message);
      setError(err.message);
    } finally {
      setSyncingHistory(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBingxLive();
    }
  }, [user]);

  const handleAuditClick = (pos) => {
    localStorage.setItem('walter_audit_trigger', JSON.stringify({
      symbol: pos.symbol,
      side: pos.positionSide || (parseFloat(pos.positionAmt || pos.volume || 0) > 0 ? 'LONG' : 'SHORT'),
      volume: pos.positionAmt || pos.volume || 0,
      entry: pos.entryPrice,
      pnl: pos.unrealizedProfit,
      leverage: pos.leverage,
      mark: pos.markPrice || pos.entryPrice
    }));
    if (onTabChange) {
      onTabChange('chat');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Botones de control y estado de actualización */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Landmark size={18} color="var(--color-cyan)" />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
            {lastUpdated ? `Última consulta: ${lastUpdated}` : 'Conexión pendiente'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => fetchBingxLive()} 
            disabled={loading}
            className="btn btn-outline flex-center"
            style={{ padding: '6px 12px', fontSize: '0.7rem', height: '30px', gap: '6px' }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            <span>Actualizar Live</span>
          </button>
          <button 
            onClick={handleSyncHistory} 
            disabled={syncingHistory}
            className="btn btn-emerald flex-center animate-glow-emerald"
            style={{ padding: '6px 12px', fontSize: '0.7rem', height: '30px', gap: '6px' }}
            title="Importa posiciones cerradas e inserta el P&L neto en el diario de consistencia"
          >
            <RefreshCw size={12} className={syncingHistory ? "animate-spin" : ""} />
            <span>Sincronizar Historial</span>
          </button>
        </div>
      </div>

      {/* ERROR DE CONEXIÓN */}
      {error && (
        <div className="glass-panel" style={{ padding: '16px', border: '1px solid hsla(var(--rose), 0.2)', background: 'hsla(var(--rose), 0.03)', textAlign: 'center' }}>
          <AlertTriangle size={24} color="var(--color-rose)" style={{ marginInline: 'auto', marginBottom: '8px' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>
            {error === "No se han configurado las claves de API de BingX en Ajustes." 
              ? "Las credenciales de lectura no están configuradas en la pestaña de Ajustes."
              : `Fallo de conexión con la API de BingX: ${error}`
            }
          </span>
        </div>
      )}

      {/* VISTA DE BALANCES */}
      {bingxData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {(() => {
            const balance = bingxData.balance || {};
            const positions = bingxData.positions || [];
            const totalUnrealizedPnl = positions.reduce((sum, pos) => sum + parseFloat(pos.unrealizedProfit || 0), 0);
            const marginUsed = parseFloat(balance.balance || 0) - parseFloat(balance.availableBalance || 0);

            return (
              <>
                <div style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Balance de Futuros</span>
                  <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{parseFloat(balance.balance || 0).toFixed(2)} USDT</strong>
                </div>
                <div style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Disponible</span>
                  <strong style={{ fontSize: '1rem', color: 'var(--color-emerald)' }}>{parseFloat(balance.availableBalance || 0).toFixed(2)} USDT</strong>
                </div>
                <div style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Margen Retenido</span>
                  <strong style={{ fontSize: '1rem', color: 'var(--color-cyan)' }}>{marginUsed.toFixed(2)} USDT</strong>
                </div>
                <div style={{ padding: '12px 10px', background: totalUnrealizedPnl >= 0 ? 'rgba(16,185,129,0.05)' : 'rgba(244,63,94,0.05)', border: `1px solid ${totalUnrealizedPnl >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(244,63,94,0.15)'}`, borderRadius: '6px' }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>PnL Flotante</span>
                  <strong style={{ fontSize: '1rem', color: totalUnrealizedPnl >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                    {totalUnrealizedPnl >= 0 ? '+' : ''}{totalUnrealizedPnl.toFixed(2)} USDT
                  </strong>
                </div>

                {/* TABLA DE POSICIONES ABIERTAS */}
                <div style={{ gridColumn: 'span 4', marginTop: '10px' }}>
                  <h5 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>Posiciones Abiertas en Tiempo Real</h5>
                  {positions.length === 0 ? (
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.005)', border: '1px dashed var(--border)', borderRadius: '6px', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                      No hay posiciones abiertas en BingX en este momento.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '6px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#0b0f19', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
                            <th style={{ padding: '6px' }}>Activo</th>
                            <th style={{ padding: '6px' }}>Lado</th>
                            <th style={{ padding: '6px' }}>Apalancamiento</th>
                            <th style={{ padding: '6px' }}>Tamaño</th>
                            <th style={{ padding: '6px' }}>Entrada</th>
                            <th style={{ padding: '6px' }}>Precio Marca</th>
                            <th style={{ padding: '6px', textAlign: 'right' }}>PnL Flotante</th>
                            <th style={{ padding: '6px', textAlign: 'center' }}>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {positions.map((pos, idx) => {
                            const pnl = parseFloat(pos.unrealizedProfit || 0);
                            const isLong = pos.positionSide === 'LONG' || parseFloat(pos.positionAmt || pos.volume || 0) > 0;
                            return (
                              <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                <td style={{ padding: '6px', fontWeight: 700 }}>{pos.symbol}</td>
                                <td style={{ padding: '6px' }}>
                                  <span className={`badge ${isLong ? 'badge-emerald' : 'badge-rose'}`} style={{ padding: '1px 6px', fontSize: '0.55rem' }}>
                                    {isLong ? 'LARGO' : 'CORTO'}
                                  </span>
                                </td>
                                <td style={{ padding: '6px' }}>{pos.leverage}x</td>
                                <td style={{ padding: '6px' }}>{Math.abs(parseFloat(pos.positionAmt || pos.volume || 0)).toFixed(4)}</td>
                                <td style={{ padding: '6px' }}>{parseFloat(pos.entryPrice || 0).toFixed(2)}</td>
                                <td style={{ padding: '6px' }}>{parseFloat(pos.markPrice || 0).toFixed(2)}</td>
                                <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700, color: pnl >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                                  {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)} USDT
                                </td>
                                <td style={{ padding: '6px', textAlign: 'center' }}>
                                  <button
                                    onClick={() => handleAuditClick(pos)}
                                    className="btn btn-cyan"
                                    style={{ padding: '2px 8px', fontSize: '0.6rem', height: '22px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <Brain size={11} />
                                    <span>Auditar</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
