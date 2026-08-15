import React from 'react';
import { Download, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const ApkDownloadGuideModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const zipUrl = "/ancora-v1.0.0.zip";

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      background: 'rgba(3, 15, 26, 0.85)',
      backdropFilter: 'blur(10px)'
    }} onClick={onClose}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#05213A',
        border: '1px solid rgba(127, 159, 136, 0.35)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        textAlign: 'left',
        color: '#ffffff'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Botón de Cierre */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            padding: '6px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#9AA6AB',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'}
        >
          <X size={18} />
        </button>

        {/* Encabezado con Icono Oficial de Android */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '14px', borderBottom: '1px solid rgba(127, 159, 136, 0.2)' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: 'rgba(61, 220, 132, 0.12)',
            border: '1px solid rgba(61, 220, 132, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#3DDC84">
              <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.996-3.4572c.1556-.2698.0631-.6137-.2067-.7694-.2694-.1555-.6133-.0631-.7689.2067l-2.0223 3.5028C15.3023 8.1633 13.7027 7.7816 12 7.7816c-1.7027 0-3.3023.3817-4.8805 1.0227L5.0972 5.3015c-.1556-.2698-.4995-.3622-.7689-.2067-.2698.1557-.3623.4996-.2067.7694l1.996 3.4572C2.6841 11.238 0 14.8872 0 19.1667h24c0-4.2795-2.6841-7.9287-6.1185-9.8453"/>
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em' }}>Áncora para Android</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#7F9F88', fontFamily: 'monospace' }}>ancora-v1.0.0.zip (APK Oficial Firmado)</p>
          </div>
        </div>

        {/* Explicación Detallada Paso a Paso */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 700 }}>
            <ShieldAlert size={16} />
            <span>Pasos de Instalación Rápida:</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8rem' }}>
            
            {/* Paso 1 */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(127,159,136,0.15)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(127, 159, 136, 0.25)', color: '#7F9F88', fontWeight: 800, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, color: '#ffffff', fontSize: '0.82rem' }}>Descargar el archivo ZIP</h4>
                <p style={{ margin: '3px 0 0', color: '#9AA6AB', fontSize: '0.74rem', lineHeight: 1.4 }}>
                  Pulsa el botón verde inferior para descargar el paquete <strong style={{ color: '#7F9F88' }}>ancora-v1.0.0.zip</strong> (14.8 MB).
                </p>
              </div>
            </div>

            {/* Paso 2 */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(127,159,136,0.15)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.25)', color: '#06b6d4', fontWeight: 800, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, color: '#ffffff', fontSize: '0.82rem' }}>Descomprimir / Extraer el APK</h4>
                <p style={{ margin: '3px 0 0', color: '#9AA6AB', fontSize: '0.74rem', lineHeight: 1.4 }}>
                  En la carpeta de Descargas de tu móvil, toca el archivo ZIP y selecciona <strong style={{ color: '#7F9F88' }}>"Extraer"</strong> para obtener <strong style={{ color: '#ffffff' }}>ancora.apk</strong>.
                </p>
              </div>
            </div>

            {/* Paso 3 */}
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '14px', border: '1px solid rgba(127,159,136,0.15)', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.25)', color: '#818cf8', fontWeight: 800, fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</span>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700, color: '#ffffff', fontSize: '0.82rem' }}>Instalar APK</h4>
                <p style={{ margin: '3px 0 0', color: '#9AA6AB', fontSize: '0.74rem', lineHeight: 1.4 }}>
                  Toca <strong style={{ color: '#7F9F88' }}>ancora.apk</strong>. Si Play Protect muestra advertencia, toca en <strong style={{ color: '#7F9F88' }}>"Más detalles" ➔ "Instalar de todas formas"</strong>.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Estado y Botón de Descarga Directa */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
          <a
            href="/ancora-v1.0.0.zip"
            download="ancora-v1.0.0.zip"
            onClick={onClose}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '14px',
              background: '#7F9F88',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              textDecoration: 'none',
              cursor: 'pointer',
              boxSizing: 'border-box',
              boxShadow: '0 4px 18px rgba(127, 159, 136, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <Download size={18} />
            <span>Descargar ZIP con APK (11.4 MB)</span>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.7rem', color: '#9AA6AB' }}>
            <CheckCircle2 size={13} color="#3DDC84" />
            <span>Compilación oficial v1.0.0 (com.ancora.health) firmada y verificada</span>
          </div>
        </div>

      </div>
    </div>
  );
};
export default ApkDownloadGuideModal;
