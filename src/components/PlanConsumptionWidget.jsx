import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Clock, MessageSquare, RefreshCw, AlertCircle, Info, X, HelpCircle, Sparkles, Zap } from 'lucide-react';

export default function PlanConsumptionWidget({ patientId, forceRefreshFlag, minimal = false }) {
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePopover, setActivePopover] = useState(null); // 'unified' | null
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(null); // id del paquete que se compra
  const popoverRef = useRef(null);

  useEffect(() => {
    fetchCredits();
  }, [patientId, forceRefreshFlag]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setActivePopover(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  async function fetchCredits() {
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchErr } = await supabase
        .from('patient_credits')
        .select('*')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (fetchErr) throw fetchErr;
      setCredits(data);
    } catch (err) {
      console.error('Error fetching patient credits:', err.message);
      setError('No se pudo cargar el estado del plan.');
    } finally {
      setLoading(false);
    }
  }

  // Simulación premium de compra de créditos SaaS
  const handleBuyCredits = async (pkgId, amount) => {
    setPurchaseLoading(pkgId);
    try {
      // Simular delay de pasarela de Stripe
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newUsed = Math.max(0, (credits.text_credits_used || 0) - amount); // Aumentar saldo restando del acumulado de uso
      
      const { error: updateErr } = await supabase
        .from('patient_credits')
        .update({
          text_credits_used: newUsed,
          updated_at: new Date().toISOString()
        })
        .eq('patient_id', patientId);

      if (updateErr) throw updateErr;
      
      alert(`¡Éxito! Se han añadido ${ (amount / 100).toLocaleString() } CR a tu saldo de IA.`);
      setShowUpgradeModal(false);
      fetchCredits();
    } catch (err) {
      console.error("Error al recargar créditos:", err.message);
      alert("Hubo un error con la pasarela de pago: " + err.message);
    } finally {
      setPurchaseLoading(null);
    }
  };

  if (loading && !credits) {
    return (
      <div className={minimal ? "plan-widget-loading-min" : "plan-widget-loading"}>
        <RefreshCw className="animate-spin-slow" size={16} />
        {!minimal && <span>Cargando balance de IA...</span>}
      </div>
    );
  }

  if (error || !credits) {
    return (
      <div className={minimal ? "plan-widget-error-min" : "plan-widget-error"}>
        <AlertCircle size={16} />
        {!minimal && <span>{error || 'Sin plan activo'}</span>}
      </div>
    );
  }

  // Límite de Créditos Unificados (Chat + Voz)
  const textLimit = credits.text_credits_total || 450000;
  const textUsed = credits.text_credits_used || 0;
  
  // Conversión comercial (100 tokens = 1 crédito)
  const totalCredits = textLimit / 100;
  const usedCredits = textUsed / 100;
  const remainingCredits = Math.max(0, (textLimit - textUsed) / 100);
  
  const creditsPercentUsed = Math.min(100, (textUsed / textLimit) * 100);
  const creditsPercentLeft = Math.max(0, 100 - creditsPercentUsed);

  const handlePopoverToggle = (type) => {
    setActivePopover(activePopover === type ? null : type);
  };

  // Paquetes comerciales de créditos
  const creditPackages = [
    { id: 'pkg-basic', name: 'Paquete Esencial', credits: 1000, price: '4,99 €', desc: 'Ideal para 3 horas de chat o 30 min de voz.', popular: false },
    { id: 'pkg-recommended', name: 'Paquete Equilibrio', credits: 2500, price: '9,99 €', desc: 'Equivale a 8 horas de chat o 1.25 horas de voz.', popular: true },
    { id: 'pkg-pro', name: 'Paquete Intensivo', credits: 6000, price: '19,99 €', desc: 'Equivale a 20 horas de chat o 3 horas de voz.', popular: false }
  ];

  // ----------------------------------------------------
  // MODO MINIMALISTA (Para cabecera del Chat)
  // ----------------------------------------------------
  if (minimal) {
    return (
      <div className="plan-consumption-min-wrapper" ref={popoverRef} style={{ display: 'flex', alignItems: 'center' }}>
        {/* Botón Píldora de Créditos Premium Unificado */}
        <button 
          onClick={() => handlePopoverToggle('unified')}
          className={`plan-unified-widget-btn ${activePopover === 'unified' ? 'active' : ''}`}
          title="Ver balance y consumo de créditos de IA"
        >
          <Sparkles size={11} className="text-cyan animate-pulse-soft" />
          <span className="credits-display-value">
            {remainingCredits.toLocaleString('es-ES', { maximumFractionDigits: 0 })} CR
          </span>
        </button>

        {/* Botón de Comprar / Subir Plan (Upgrade) - Solo si baja del 10% y en formato circular discreto */}
        {remainingCredits < (totalCredits * 0.1) && (
          <button 
            onClick={() => setShowUpgradeModal(true)}
            className="plan-upgrade-btn-header-discreet low-credits"
            title="Saldo de IA bajo: Subir Plan y Añadir Créditos"
          >
            <Zap size={11} className="zap-icon" />
          </button>
        )}

        {/* POPOVER CONTEXTUAL FLOTANTE (Estilo Ventana de Contexto de Gemini) */}
        {activePopover === 'unified' && (
          <div className="plan-popover-glass unified-popover animate-fade-in-scale">
            <div className="popover-header">
              <h5 className="popover-title">Ventana de Consumo de IA</h5>
              <div className="popover-actions">
                <button 
                  onClick={() => setShowUpgradeModal(true)} 
                  className="icon-action-btn upgrade-action-btn" 
                  title="Subir Plan / Añadir Créditos"
                  style={{ color: '#a78bfa', marginRight: '4px' }}
                >
                  <Zap size={13} style={{ fill: 'currentColor' }} />
                </button>
                <button onClick={() => setShowInfoModal(true)} className="icon-action-btn" title="Ver equivalencias">
                  <HelpCircle size={14} />
                </button>
                <button onClick={fetchCredits} className="icon-action-btn" title="Actualizar">
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="popover-body">
              {/* Tarjeta de Créditos Principales Unificados */}
              <div className="gemini-style-card">
                <div className="gemini-card-header">
                  <span className="gemini-card-title">Créditos de IA</span>
                  <span className="gemini-card-percent">
                    {Math.round(creditsPercentUsed)}% usado ({Math.round(creditsPercentLeft)}% libre)
                  </span>
                </div>
                
                <div className="progress-bar-bg unified-progress">
                  <div 
                    className="progress-bar-fill bg-cyan-gradient" 
                    style={{ width: `${creditsPercentUsed}%` }} 
                  />
                </div>
                
                <div className="gemini-card-detail">
                  <span className="detail-value">
                    {remainingCredits.toLocaleString('es-ES', { maximumFractionDigits: 0 })} / {totalCredits.toLocaleString('es-ES', { maximumFractionDigits: 0 })} CR
                  </span>
                  <span className="detail-tokens">
                    ({Math.max(0, textLimit - textUsed).toLocaleString('es-ES')} / {textLimit.toLocaleString('es-ES')} tokens disponibles)
                  </span>
                </div>
              </div>

              {/* Sección de Equivalencias */}
              <div className="gemini-sub-metric" style={{ background: 'rgba(255,255,255,0.015)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: '1.4', textAlign: 'left' }}>
                  <div style={{ fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>Este saldo equivale a:</div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '2px' }}>
                    <span>📝</span> <span>~15 min diarios de chat escrito con Ánquer.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span>🎙️</span> <span>~2 horas de voz interactiva real por tokens (equivalente a 4 horas de conversación por turnos y silencios).</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="popover-footer" style={{ marginTop: '8px' }}>
              <span>Renovación de ciclo: {new Date(credits.cycle_end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
            </div>
          </div>
        )}

        {/* MODAL INFORMATIVO EXPLICATIVO */}
        {showInfoModal && (
          <div className="plan-info-modal-backdrop animate-fade-in" style={{ zIndex: 9999 }}>
            <div className="plan-info-modal-card animate-fade-in-scale">
              <div className="modal-card-header">
                <h3>Créditos Unificados de IA</h3>
                <button onClick={() => setShowInfoModal(false)} className="close-modal-btn">
                  <X size={16} />
                </button>
              </div>
              <div className="modal-card-body">
                <p>Áncora gestiona las capacidades de IA de forma transparente a través de créditos unificados de uso (donde <strong>100 tokens equivalen a 1 crédito</strong>):</p>
                
                <div className="modal-info-row">
                  <div className="modal-info-icon-wrapper bg-cyan-alpha">
                    <MessageSquare size={18} className="text-cyan" />
                  </div>
                  <div className="modal-info-content">
                    <h4>Chat Escrito y Guiado</h4>
                    <p>Ideal para realizar diarios guiados y reportes clínicos con tu acompañante virtual Ánquer.</p>
                  </div>
                </div>

                <div className="modal-info-row">
                  <div className="modal-info-icon-wrapper bg-emerald-alpha">
                    <Clock size={18} className="text-emerald" />
                  </div>
                  <div className="modal-info-content">
                    <h4>Conversación de Voz Interactiva</h4>
                    <p>Se descuentan créditos reales exclusivamente por el consumo de tokens en tus respuestas de voz.</p>
                  </div>
                </div>

                <div className="modal-info-callout">
                  <Info size={14} className="text-cyan" />
                  <span>El saldo es 100% compartido: úsalo para chatear por texto o para conversar de voz según tus preferencias.</span>
                </div>
              </div>
              <div className="modal-card-footer">
                <button onClick={() => setShowInfoModal(false)} className="btn btn-primary" style={{ background: 'var(--color-cyan)', color: '#ffffff' }}>
                  Entendido
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE COMPRA / RECARGA DE CRÉDITOS */}
        {showUpgradeModal && (
          <div className="plan-info-modal-backdrop animate-fade-in" style={{ zIndex: 9999 }}>
            <div className="plan-info-modal-card upgrade-modal-card animate-fade-in-scale" style={{ maxWidth: '640px' }}>
              <div className="modal-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Zap size={18} className="text-violet" style={{ color: '#a78bfa' }} />
                  <h3>Subir Plan y Añadir Créditos</h3>
                </div>
                <button onClick={() => setShowUpgradeModal(false)} className="close-modal-btn">
                  <X size={16} />
                </button>
              </div>
              <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'left', margin: 0 }}>
                  Añade créditos adicionales de IA al instante para expandir tus sesiones de chat o voz con Ánquer. Se añadirán a tu cuenta actual de forma permanente.
                </p>

                <div className="upgrade-packages-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '4px' }}>
                  {creditPackages.map(pkg => (
                    <div 
                      key={pkg.id} 
                      className={`upgrade-pkg-card ${pkg.popular ? 'popular' : ''}`}
                      style={{
                        background: pkg.popular ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255,255,255,0.015)',
                        border: pkg.popular ? '2px solid #7c3aed' : '1px solid var(--border)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        position: 'relative',
                        textAlign: 'center',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {pkg.popular && (
                        <span style={{
                          position: 'absolute',
                          top: '-10px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#7c3aed',
                          color: '#ffffff',
                          fontSize: '0.55rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          letterSpacing: '0.05em'
                        }}>Recomendado</span>
                      )}
                      <div>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>{pkg.name}</h4>
                        <p style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', margin: '0 0 12px 0', minHeight: '32px' }}>{pkg.desc}</p>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>+{pkg.credits.toLocaleString()} CR</div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>(equivalente a {(pkg.credits * 100).toLocaleString()} tokens)</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-cyan)', marginBottom: '8px' }}>{pkg.price}</div>
                        <button
                          onClick={() => handleBuyCredits(pkg.id, pkg.credits * 100)}
                          disabled={purchaseLoading !== null}
                          className="btn btn-primary"
                          style={{
                            width: '100%',
                            fontSize: '0.72rem',
                            padding: '6px 12px',
                            background: pkg.popular ? '#7c3aed' : 'transparent',
                            color: '#ffffff',
                            borderColor: '#7c3aed',
                            borderRadius: '8px',
                            cursor: 'pointer'
                          }}
                        >
                          {purchaseLoading === pkg.id ? 'Procesando...' : 'Adquirir'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // MODO DETALLADO/COMPLETO (Para dashboard u otras vistas)
  // ----------------------------------------------------
  return (
    <div className="plan-consumption-widget-glass">
      <div className="widget-header">
        <h4 className="widget-title">Créditos de IA Áncora</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowInfoModal(true)} className="refresh-btn" title="Explicación">
            <Info size={12} />
          </button>
          <button onClick={fetchCredits} className="refresh-btn" title="Actualizar">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="widget-body">
        {/* Créditos de IA Únicos */}
        <div className="metric-row">
          <div className="metric-info">
            <span className="metric-label">
              <Sparkles size={14} className="metric-icon text-cyan" />
              Saldo Único (Chat y Voz)
            </span>
            <span className="metric-value">
              {remainingCredits.toLocaleString('es-ES', { maximumFractionDigits: 0 })} / {totalCredits.toLocaleString('es-ES', { maximumFractionDigits: 0 })} CR
            </span>
          </div>
          <div className="progress-bar-bg">
            <div 
              className="progress-bar-fill bg-cyan-gradient" 
              style={{ width: `${creditsPercentLeft}%` }}
            ></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            <span>Consumido: {Math.round(creditsPercentUsed)}% ({textUsed.toLocaleString('es-ES')} tokens)</span>
            <span>Disponible: {Math.max(0, textLimit - textUsed).toLocaleString('es-ES')} tokens</span>
          </div>
        </div>

        {/* Equivalencias Explicativas de Uso */}
        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(255, 255, 255, 0.015)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
          <h5 style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffffff', margin: '0 0 6px 0', textAlign: 'left' }}>Equivalencias de Uso de Créditos</h5>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', lineHeight: '1.45', display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
            <div>📝 **Chat Guiado Escrito**: ~15 min diarios al mes.</div>
            <div>🎙️ **Conversación de Voz Live**: 2 horas de voz directa (que representan hasta 4 horas de conversación natural con silencios y turnos).</div>
          </div>
        </div>

        {/* Botón Grande de Comprar Créditos */}
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="btn btn-primary animate-shimmer"
          style={{
            width: '100%',
            marginTop: '16px',
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            borderColor: 'transparent',
            fontSize: '0.75rem',
            padding: '8px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontWeight: 800
          }}
        >
          <Zap size={13} />
          Subir Plan y Añadir Créditos
        </button>
      </div>

      <div className="widget-footer" style={{ marginTop: '12px' }}>
        <span>Renovación del plan: {new Date(credits.cycle_end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
      </div>

      {/* MODAL INFORMATIVO EXPLICATIVO */}
      {showInfoModal && (
        <div className="plan-info-modal-backdrop animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="plan-info-modal-card animate-fade-in-scale">
            <div className="modal-card-header">
              <h3>Sistema de Créditos de IA Áncora</h3>
              <button onClick={() => setShowInfoModal(false)} className="close-modal-btn">
                <X size={16} />
              </button>
            </div>
            <div className="modal-card-body">
              <p>Para simplificar el seguimiento, Áncora traduce los consumos del motor de inteligencia artificial en <strong>Créditos y Límites Reales</strong>:</p>
              
              <div className="modal-info-row">
                <div className="modal-info-icon-wrapper bg-cyan-alpha">
                  <MessageSquare size={18} className="text-cyan" />
                </div>
                <div className="modal-info-content">
                  <h4>Chat Escrito (Diario)</h4>
                  <p>Corresponde a un cupo de **450.000 tokens al mes**. Equivale a unos **15 minutos diarios de conversación real** para completar tus registros y diarios con Ánquer sin cobro por inactividad.</p>
                </div>
              </div>

              <div className="modal-info-row">
                <div className="modal-info-icon-wrapper bg-emerald-alpha">
                  <Clock size={18} className="text-emerald" />
                </div>
                <div className="modal-info-content">
                  <h4>Conversación de Voz Live</h4>
                  <p>Corresponde a un cupo de **2 horas reales de voz interactiva** (~4 horas de llamada normal con silencios y turnos). Se deduce por el uso de tokens consumidos.</p>
                </div>
              </div>

              <div className="modal-info-callout">
                <Info size={14} className="text-cyan" />
                <span>Los créditos se consumen exclusivamente por uso real (mensajes enviados, segundos hablados o archivos subidos), nunca por persistencia o ventana abierta.</span>
              </div>
            </div>
            <div className="modal-card-footer">
              <button onClick={() => setShowInfoModal(false)} className="btn btn-primary" style={{ background: 'var(--color-cyan)', color: '#ffffff' }}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE COMPRA / RECARGA DE CRÉDITOS */}
      {showUpgradeModal && (
        <div className="plan-info-modal-backdrop animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="plan-info-modal-card upgrade-modal-card animate-fade-in-scale" style={{ maxWidth: '640px' }}>
            <div className="modal-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={18} className="text-violet" style={{ color: '#a78bfa' }} />
                <h3>Subir Plan y Añadir Créditos</h3>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="close-modal-btn">
                <X size={16} />
              </button>
            </div>
            <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'left', margin: 0 }}>
                Añade créditos adicionales de IA al instante para expandir tus sesiones de chat o voz con Ánquer. Se añadirán a tu cuenta actual de forma permanente.
              </p>

              <div className="upgrade-packages-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '4px' }}>
                {creditPackages.map(pkg => (
                  <div 
                    key={pkg.id} 
                    className={`upgrade-pkg-card ${pkg.popular ? 'popular' : ''}`}
                    style={{
                      background: pkg.popular ? 'rgba(124, 58, 237, 0.08)' : 'rgba(255,255,255,0.015)',
                      border: pkg.popular ? '2px solid #7c3aed' : '1px solid var(--border)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px',
                      position: 'relative',
                      textAlign: 'center',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {pkg.popular && (
                      <span style={{
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#7c3aed',
                        color: '#ffffff',
                        fontSize: '0.55rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        letterSpacing: '0.05em'
                      }}>Recomendado</span>
                    )}
                    <div>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>{pkg.name}</h4>
                      <p style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', margin: '0 0 12px 0', minHeight: '32px' }}>{pkg.desc}</p>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>+{pkg.credits.toLocaleString()} CR</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>(equivalente a {(pkg.credits * 100).toLocaleString()} tokens)</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-cyan)', marginBottom: '8px' }}>{pkg.price}</div>
                      <button
                        onClick={() => handleBuyCredits(pkg.id, pkg.credits * 100)}
                        disabled={purchaseLoading !== null}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          fontSize: '0.72rem',
                          padding: '6px 12px',
                          background: pkg.popular ? '#7c3aed' : 'transparent',
                          color: '#ffffff',
                          borderColor: '#7c3aed',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      >
                        {purchaseLoading === pkg.id ? 'Procesando...' : 'Adquirir'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
