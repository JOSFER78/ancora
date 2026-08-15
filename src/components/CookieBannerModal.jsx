import React, { useState, useEffect } from 'react';
import { ShieldCheck, Cookie, Settings, Check, X, Lock, Eye, BarChart2 } from 'lucide-react';

export const CookieBannerModal = ({ forceOpenModal = false, onCloseModal = () => {} }) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Estados de preferencias
  const [preferences, setPreferences] = useState({
    essential: true, // Siempre true e inmutable
    preferences: true,
    analytics: false
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem('ancora_cookies_consent');
    if (!savedConsent) {
      // Mostrar banner tras 1.2 segundos para entrada suave
      const timer = setTimeout(() => setShowBanner(true), 1200);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(savedConsent);
        setPreferences(parsed);
      } catch (_) {}
    }
  }, []);

  useEffect(() => {
    if (forceOpenModal) {
      setShowConfigModal(true);
    }
  }, [forceOpenModal]);

  const saveConsent = (prefObj) => {
    const finalPref = { ...prefObj, essential: true, timestamp: new Date().toISOString() };
    localStorage.setItem('ancora_cookies_consent', JSON.stringify(finalPref));
    setPreferences(finalPref);
    setShowBanner(false);
    setShowConfigModal(false);
    onCloseModal();
  };

  const handleAcceptAll = () => {
    saveConsent({ essential: true, preferences: true, analytics: true });
  };

  const handleRejectNonEssential = () => {
    saveConsent({ essential: true, preferences: false, analytics: false });
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
  };

  return (
    <>
      {/* 1. BANNER FLOTANTE INFERIOR RGPD */}
      {showBanner && !showConfigModal && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '920px',
          zIndex: 99990,
          background: 'rgba(5, 33, 58, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(127, 159, 136, 0.35)',
          borderRadius: '18px',
          padding: '20px 24px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.65), 0 0 30px rgba(68,125,130,0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          animation: 'fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          color: '#ffffff',
          textAlign: 'left'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'rgba(68,125,130,0.15)',
              border: '1px solid rgba(68,125,130,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: 'var(--color-cyan, #447d82)'
            }}>
              <Cookie size={22} />
            </div>
            
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#ffffff' }}>
                  Privacidad y Gestión de Cookies en Áncora
                </h4>
                <span style={{ 
                  fontSize: '0.62rem', 
                  padding: '2px 6px', 
                  borderRadius: '4px', 
                  background: 'rgba(127,159,136,0.15)', 
                  color: '#7F9F88',
                  fontWeight: 700
                }}>
                  RGPD / LOPD-GDD
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.76rem', color: '#9AA6AB', lineHeight: 1.5 }}>
                Utilizamos cookies técnicas necesarias para garantizar la seguridad clínica, la autenticación y el funcionamiento de la plataforma. Las cookies analíticas opcionales nos ayudan a mejorar la experiencia sin recopilar datos de salud identificables.
              </p>
            </div>
          </div>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            alignItems: 'center', 
            gap: '10px', 
            flexWrap: 'wrap',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: '14px'
          }}>
            <button
              onClick={() => setShowConfigModal(true)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#CBD5E1',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#ffffff'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
            >
              <Settings size={14} />
              <span>Configurar</span>
            </button>

            <button
              onClick={handleRejectNonEssential}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
            >
              Rechazar Opcionales
            </button>

            <button
              onClick={handleAcceptAll}
              style={{
                background: '#447d82',
                border: '1px solid #447d82',
                color: '#ffffff',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(68,125,130,0.35)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#366468'}
              onMouseLeave={e => e.currentTarget.style.background = '#447d82'}
            >
              <Check size={14} />
              <span>Aceptar Todas</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. MODAL DETALLADO DE CONFIGURACIÓN DE COOKIES */}
      {showConfigModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(3, 15, 26, 0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => {
            setShowConfigModal(false);
            onCloseModal();
          }}
        >
          <div 
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#05213A',
              border: '1px solid rgba(127, 159, 136, 0.35)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              textAlign: 'left',
              color: '#ffffff'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(68,125,130,0.15)',
                  border: '1px solid rgba(68,125,130,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-cyan, #447d82)'
                }}>
                  <Cookie size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                    Centro de Preferencias de Cookies
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: '#9AA6AB' }}>
                    Áncora Health, S.L. · Cumplimiento RGPD (UE 2016/679)
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowConfigModal(false);
                  onCloseModal();
                }}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#9AA6AB',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.5 }}>
              En Áncora la confidencialidad médica es primordial. Las cookies son pequeños archivos de texto que nos permiten ofrecer un servicio seguro y estable. Puedes personalizar tus preferencias a continuación:
            </p>

            {/* Bloques de Categorías de Cookies */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* 1. Cookies Esenciales */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(127,159,136,0.2)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={16} color="#3DDC84" />
                    <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>1. Cookies Técnicas y de Seguridad</strong>
                  </div>
                  <span style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: '#3DDC84',
                    background: 'rgba(61, 220, 132, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    Siempre Activas
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#9AA6AB', lineHeight: 1.45 }}>
                  Indispensables para el inicio de sesión cifrado, protección CSRF, sesiones de videollamada y acceso seguro al historial médico bajo TLS 1.3. No pueden ser desactivadas.
                </p>
              </div>

              {/* 2. Cookies de Personalización */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Eye size={16} color="#60A5FA" />
                    <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>2. Cookies de Preferencias y Visualización</strong>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '6px' }}>
                    <input 
                      type="checkbox"
                      checked={preferences.preferences}
                      onChange={(e) => setPreferences(prev => ({ ...prev, preferences: e.target.checked }))}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#447d82' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: preferences.preferences ? '#60A5FA' : '#9AA6AB' }}>
                      {preferences.preferences ? 'Habilitadas' : 'Deshabilitadas'}
                    </span>
                  </label>
                </div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#9AA6AB', lineHeight: 1.45 }}>
                  Recuerdan el estado de interfaz preferido (modo oscuro/claro, navegación rápida del terapeuta, idioma).
                </p>
              </div>

              {/* 3. Cookies Analíticas */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={16} color="#A78BFA" />
                    <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>3. Cookies Analíticas Anonimizadas</strong>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '6px' }}>
                    <input 
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                      style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#447d82' }}
                    />
                    <span style={{ fontSize: '0.7rem', color: preferences.analytics ? '#A78BFA' : '#9AA6AB' }}>
                      {preferences.analytics ? 'Habilitadas' : 'Deshabilitadas'}
                    </span>
                  </label>
                </div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#9AA6AB', lineHeight: 1.45 }}>
                  Métricas de tiempo de carga y rendimiento de red totalmente anonimizadas. No rastrean información personal ni historial clínico del paciente.
                </p>
              </div>

            </div>

            {/* Botonera de Acciones en Modal */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              gap: '10px', 
              flexWrap: 'wrap',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '16px'
            }}>
              <button
                onClick={handleRejectNonEssential}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#CBD5E1',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '0.74rem',
                  cursor: 'pointer'
                }}
              >
                Rechazar Opcionales
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleSaveCustom}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Guardar Preferencias
                </button>

                <button
                  onClick={handleAcceptAll}
                  style={{
                    background: '#447d82',
                    border: '1px solid #447d82',
                    color: '#ffffff',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Aceptar Todas
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default CookieBannerModal;
