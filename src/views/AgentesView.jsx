import { useState, useEffect, useRef } from 'react';
import { firebaseClient as db, firebaseClient } from '../firebaseAdapter.js';
import { invokeChatTerapeuta } from '../lib/chatTerapeuta';
import {
  Bot,
  Brain,
  TrendingUp,
  Search,
  Shield,
  Play,
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  MessageSquare,
  ChevronRight,
  Terminal,
  Activity,
  CheckCircle2,
  AlertOctagon,
  HelpCircle,
  Edit2,
  Trash2,
  X,
  Paperclip,
  Mic,
  MicOff,
  Send
} from 'lucide-react';

const ICON_MAP = {
  Brain: Brain,
  TrendingUp: TrendingUp,
  Search: Search,
  Shield: Shield,
  Bot: Bot,
  Activity: Activity
};

const COLOR_PRESETS = [
  { name: 'Esmeralda', value: 'var(--color-emerald)' },
  { name: 'Cian', value: 'var(--color-cyan)' },
  { name: 'Rosa/Rojo', value: 'var(--color-rose)' },
  { name: 'Ámbar/Oro', value: '#f59e0b' },
  { name: 'Violeta/Morado', value: '#8b5cf6' },
  { name: 'Azul', value: '#3b82f6' }
];

const formatBoldText = (text) => {
  if (!text) return '';
  // Convertir marcas de markdown a negrita estilizada, removiendo almohadillas accidentales
  let cleanText = text.replace(/#+/g, '').trim();
  return cleanText.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #ffffff; font-weight: 800; font-family: \'Inter\', sans-serif;">$1</strong>');
};

const renderStructuredContent = (text, agentColor) => {
  if (!text) return null;
  const paragraphs = text.split('\n');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {paragraphs.map((line, pIdx) => {
        const rawLine = line.trim();
        if (rawLine === '---' || rawLine === '***' || rawLine === '___') {
          return <hr key={pIdx} style={{ border: 0, borderTop: '1px solid rgba(255, 255, 255, 0.08)', margin: '18px 0' }} />;
        }
        
        let trimmed = rawLine;
        if (/^\s*#+\s+/.test(trimmed)) {
          trimmed = trimmed.replace(/^\s*#+\s+/, '');
        }
        if (trimmed.startsWith('####')) {
          const title = trimmed.replace(/^####\s+/, '').trim();
          return (
            <h6 key={pIdx} style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff', margin: '14px 0 6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px' }}>
              {title}
            </h6>
          );
        }
        trimmed = trimmed.replace(/^\s*[#\s*\-]+\s*/, '- ').trim(); // Limpiar hashes huérfanos del principio de línea
        if (!trimmed || trimmed === '-') return null;
        
        // List item check
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const content = trimmed.substring(2).trim();
          return (
            <div key={pIdx} style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              fontSize: '0.82rem',
              color: '#e2e8f0',
              lineHeight: '1.65',
              padding: '12px 16px',
              background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.005) 100%)',
              borderLeft: `3px solid ${agentColor}`,
              borderRadius: '0 8px 8px 0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderTop: '1px solid rgba(255,255,255,0.02)',
              marginBottom: '2px'
            }}>
              <span style={{ 
                color: agentColor, 
                fontSize: '0.75rem', 
                flexShrink: 0,
                marginTop: '3px',
                filter: `drop-shadow(0 0 4px ${agentColor})`
              }}>✦</span>
              <span dangerouslySetInnerHTML={{ __html: formatBoldText(content) }} style={{ flex: 1 }} />
            </div>
          );
        }
        
        // Numbered list item check
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          const num = numMatch[1];
          const content = numMatch[2].trim();
          return (
            <div key={pIdx} style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              fontSize: '0.82rem',
              color: '#e2e8f0',
              lineHeight: '1.65',
              padding: '12px 16px',
              background: `linear-gradient(90deg, ${agentColor}08 0%, rgba(255,255,255,0.005) 100%)`,
              borderLeft: `3px solid ${agentColor}`,
              borderRadius: '0 8px 8px 0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderTop: '1px solid rgba(255,255,255,0.02)',
              marginBottom: '2px'
            }}>
              <strong style={{ 
                color: agentColor, 
                fontFamily: 'monospace', 
                flexShrink: 0,
                fontSize: '0.85rem',
                minWidth: '18px',
                textShadow: `0 0 8px ${agentColor}40`
              }}>{num}.</strong>
              <span dangerouslySetInnerHTML={{ __html: formatBoldText(content) }} style={{ flex: 1 }} />
            </div>
          );
        }
        
        // Bold title line check
        if (trimmed.startsWith('**') && (trimmed.endsWith('**') || (trimmed.includes('**:') && trimmed.length < 120))) {
          return (
            <h5 key={pIdx} style={{ 
              fontSize: '0.88rem', 
              fontWeight: 800, 
              color: '#ffffff', 
              margin: '20px 0 8px 0', 
              textTransform: 'none',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ display: 'inline-block', width: '4px', height: '14px', background: agentColor, borderRadius: '2px', boxShadow: `0 0 8px ${agentColor}` }} />
              <span dangerouslySetInnerHTML={{ __html: formatBoldText(trimmed) }} />
            </h5>
          );
        }
        
        // Normal paragraph
        return (
          <p key={pIdx} style={{ 
            fontSize: '0.82rem', 
            color: '#cbd5e1', 
            lineHeight: '1.65', 
            margin: '8px 0',
            textAlign: 'justify',
            textJustify: 'inter-word'
          }}
             dangerouslySetInnerHTML={{ __html: formatBoldText(trimmed) }} />
        );
      })}
    </div>
  );
};

const parseReportToVisualHTML = (resultText, agentColor = 'var(--color-cyan)', selectedSection = 'all', setSelectedSection) => {
  if (!resultText) return <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Sin informe registrado.</p>;

  // Dividir por cabeceras ###, ## o #
  const sections = resultText.split(/(?=### |## |# )/);
  
  const getTabStyle = (isActive) => ({
    padding: '8px 18px',
    fontSize: '0.72rem',
    fontWeight: 700,
    background: isActive ? `linear-gradient(135deg, ${agentColor}22 0%, ${agentColor}0c 100%)` : 'rgba(255, 255, 255, 0.01)',
    borderColor: isActive ? agentColor : 'var(--border)',
    color: isActive ? '#ffffff' : 'var(--text-secondary)',
    height: '34px',
    borderRadius: '17px',
    cursor: 'pointer',
    border: '1px solid',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: isActive ? `0 4px 15px ${agentColor}18, inset 0 1px 0 rgba(255,255,255,0.05)` : 'none',
    letterSpacing: '0.01em'
  });

  const sectionsMenu = setSelectedSection ? (
    <div style={{ 
      display: 'flex', 
      gap: '10px', 
      marginBottom: '22px', 
      borderBottom: '1px solid rgba(255, 255, 255, 0.06)', 
      paddingBottom: '14px',
      overflowX: 'auto',
      whiteSpace: 'nowrap',
      paddingRight: '10px'
    }}>
      <button onClick={() => setSelectedSection('all')} style={getTabStyle(selectedSection === 'all')}>📚 Todo el Informe</button>
      <button onClick={() => setSelectedSection('macro')} style={getTabStyle(selectedSection === 'macro')}>📰 Geopolítica & Macro</button>
      <button onClick={() => setSelectedSection('onchain')} style={getTabStyle(selectedSection === 'onchain')}>📊 Métricas On-chain</button>
      <button onClick={() => setSelectedSection('psy')} style={getTabStyle(selectedSection === 'psy')}>🧠 Fisiología & Trauma</button>
    </div>
  ) : null;

  // Filtrar secciones
  const filteredSections = sections.filter(section => {
    if (selectedSection === 'all') return true;
    const lowerSec = section.toLowerCase();
    if (selectedSection === 'macro' && (lowerSec.includes('noticia') || lowerSec.includes('general') || lowerSec.includes('geopolítica') || lowerSec.includes('macro') || lowerSec.includes('bolsa') || lowerSec.includes('spacex') || lowerSec.includes('openai'))) return true;
    if (selectedSection === 'onchain' && (lowerSec.includes('métrica') || lowerSec.includes('onchain') || lowerSec.includes('correlación') || lowerSec.includes('precio') || lowerSec.includes('técnico') || lowerSec.includes('activo') || lowerSec.includes('bitcoin') || lowerSec.includes('btc') || lowerSec.includes('oro'))) return true;
    if (selectedSection === 'psy' && (lowerSec.includes('cortisol') || lowerSec.includes('trauma') || lowerSec.includes('amígdala') || lowerSec.includes('tdah') || lowerSec.includes('psicolo') || lowerSec.includes('conductual') || lowerSec.includes('respiración') || lowerSec.includes('somática') || lowerSec.includes('soma') || lowerSec.includes('vago') || lowerSec.includes('sensacion'))) return true;
    return false;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', width: '100%' }}>
      {sectionsMenu}
      {filteredSections.length === 0 ? (
        <div style={{ 
          padding: '40px 20px', 
          textAlign: 'center', 
          color: 'var(--text-tertiary)', 
          border: '1px dashed var(--border)', 
          borderRadius: '12px', 
          fontSize: '0.78rem',
          background: 'rgba(255,255,255,0.005)'
        }}>
          No hay datos registrados en esta sección del informe.
        </div>
      ) : (
        filteredSections.map((section, idx) => {
          const lines = section.split('\n');
          const headingLine = lines[0] || '';
          // Limpiar cualquier hash (#) del inicio del encabezado
          const headingText = headingLine.replace(/^(### |## |# |#### )/, '').replace(/^[#\s]+/, '').trim();
          const contentLines = lines.slice(1);
          const contentText = contentLines.join('\n').trim();
          
          // Si el título es idéntico a un hash, o está vacío y el contenido también, ignorar
          if ((!headingText || headingText === '#') && !contentText) return null;

          const lowerText = (headingText + " " + contentText).toLowerCase();
          const isTechnicalOrPrices = headingText.toLowerCase().includes('técnico') || headingText.toLowerCase().includes('precio') || headingText.toLowerCase().includes('activo') || headingText.toLowerCase().includes('financiero') || headingText.toLowerCase().includes('cripto') || lowerText.includes('oro') || lowerText.includes('brent');
          const isMetrics = headingText.toLowerCase().includes('métrica') || headingText.toLowerCase().includes('onchain') || headingText.toLowerCase().includes('correlación');
          const isNewsOrGeopolitics = headingText.toLowerCase().includes('noticia') || headingText.toLowerCase().includes('general') || headingText.toLowerCase().includes('geopolítica') || headingText.toLowerCase().includes('macro') || lowerText.includes('spacex') || lowerText.includes('openai');
          const isPsychologyOrTrauma = headingText.toLowerCase().includes('cortisol') || headingText.toLowerCase().includes('trauma') || headingText.toLowerCase().includes('amígdala') || headingText.toLowerCase().includes('tdah') || headingText.toLowerCase().includes('psicolo') || headingText.toLowerCase().includes('conductual') || lowerText.includes('bloqueo');

          // Extraer nivel de activación si corresponde a psicología/cortisol
          let cortisolLevel = null;
          let cortisolStatus = '';
          let cortisolAlert = '';
          let cortisolColor = 'var(--color-cyan)';

          if (isPsychologyOrTrauma || lowerText.includes('cortisol') || lowerText.includes('estrés') || lowerText.includes('estres') || lowerText.includes('ansiedad')) {
            if (lowerText.includes('cortisol') || lowerText.includes('estrés') || lowerText.includes('estres')) {
              cortisolLevel = 76;
              cortisolStatus = 'Elevado (Fase de Resistencia)';
              cortisolAlert = 'Señal de fatiga adrenal. Riesgo de bloqueo prefrontal. Aplicar reset térmico de amígdala.';
              cortisolColor = '#f59e0b';
            } else if (lowerText.includes('trauma') || lowerText.includes('pánico') || lowerText.includes('panico') || lowerText.includes('agorafobia') || lowerText.includes('bloqueo')) {
              cortisolLevel = 88;
              cortisolStatus = 'Crítico (Alarma Neurovegetativa)';
              cortisolAlert = 'Activación extrema del sistema límbico. Evitar cualquier toma de decisiones financieras en caliente.';
              cortisolColor = '#f43f5e';
            } else if (lowerText.includes('tdah') || lowerText.includes('impulsiv')) {
              cortisolLevel = 62;
              cortisolStatus = 'Moderado (Búsqueda de Dopamina)';
              cortisolAlert = 'Andamiaje visual requerido. Activar desconexión temporal diferida de 24h.';
              cortisolColor = 'var(--color-cyan)';
            }
          }

          // Selección de la infografía adecuada
          let imageAsset = null;
          if (lowerText.includes('cortisol') || lowerText.includes('estrés') || lowerText.includes('estres') || lowerText.includes('adrenalina')) {
            imageAsset = {
              src: '/infografia_cortisol_trading.png',
              title: 'Fisiología del Cortisol y Estrés Agudo',
              desc: 'Bucle neuroendocrino del cortisol durante picos de tensión: la activación prolongada del eje HPA bloquea la corteza prefrontal, afectando la toma de decisiones.'
            };
          } else if (lowerText.includes('trauma') || lowerText.includes('amígdala') || lowerText.includes('amigdala') || lowerText.includes('vago') || lowerText.includes('agorafobia') || lowerText.includes('bloqueo')) {
            imageAsset = {
              src: '/esquema_trauma_amigdala.png',
              title: 'Secuestro de la Amígdala vs Regulación Somática',
              desc: 'Mapa del procesamiento del miedo de vía rápida. Muestra cómo el reset térmico somático activa el nervio vago y la vía parasimpática para desescalar el pánico.'
            };
          } else if (lowerText.includes('tdah') || lowerText.includes('script') || lowerText.includes('blindaje') || lowerText.includes('rutina')) {
            imageAsset = {
              src: '/infografia_tdah_trading.png',
              title: 'Andamiajes Conductuales y Funciones Ejecutivas',
              desc: 'Arquitectura del andamiaje externo. Estructuración de rutinas y pausas asistidas para compensar la dificultad inhibitoria en el TDAH.'
            };
          }

          // RENDER 1: SECCIÓN DE PRECIOS O TÉCNICA (BLOOMBERG PREMIUM STYLE)
          const kpis = [];
          const regexKpi = /^\*\s+\*\*([^*]+)\*\*:\s*(.*)$/;
          contentLines.forEach(line => {
            const cleanLine = line.trim();
            const match = cleanLine.match(regexKpi);
            if (match) {
              const name = match[1].trim();
              const rest = match[2].trim();
              let value = '';
              let desc = rest;
              const valMatch = rest.match(/^(?:[^\d]*\s+)?(\$[0-9,]+(?:\.[0-9]+)?|\b[0-9]+(?:[\.,][0-9]+)?\s*(?:puntos|%|oz|BTC|USD)?)/i) || rest.match(/^\s*([^\.]+)\./);
              if (valMatch) {
                value = valMatch[1].trim();
                desc = rest.replace(value, '').trim().replace(/^[^\w\s\d]+/, '');
              } else {
                const splitIndex = rest.indexOf('.');
                if (splitIndex !== -1) {
                  value = rest.slice(0, splitIndex).trim();
                  desc = rest.slice(splitIndex + 1).trim();
                } else {
                  value = rest;
                  desc = '';
                }
              }
              kpis.push({ name, value, desc });
            }
          });

          if (isTechnicalOrPrices && kpis.length > 0) {

            return (
              <div key={idx} style={{
                padding: '26px',
                borderLeft: `4px solid ${agentColor}`,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                borderRight: '1px solid rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: 'linear-gradient(135deg, rgba(13, 20, 38, 0.8) 0%, rgba(7, 10, 22, 0.95) 100%)',
                boxShadow: `0 16px 40px rgba(0, 0, 0, 0.4), 0 0 24px ${agentColor}0a`,
                borderRadius: '16px',
                backdropFilter: 'blur(12px)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Micro-resplandor decorativo de fondo */}
                <div style={{
                  position: 'absolute',
                  top: '-50px',
                  right: '-50px',
                  width: '120px',
                  height: '120px',
                  background: agentColor,
                  opacity: '0.04',
                  borderRadius: '50%',
                  filter: 'blur(40px)',
                  pointerEvents: 'none'
                }} />

                <h4 style={{ 
                  fontSize: '0.88rem', 
                  fontWeight: 900, 
                  color: '#ffffff', 
                  marginBottom: '18px', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em', 
                  display: 'flex', 
                  gap: '10px', 
                  alignItems: 'center',
                  background: `linear-gradient(90deg, #ffffff 0%, ${agentColor}cc 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  <TrendingUp size={18} color={agentColor} style={{ filter: `drop-shadow(0 0 6px ${agentColor})`, WebkitTextFillColor: 'initial' }} />
                  <span>{headingText}</span>
                </h4>
                
                <div className="grid-2" style={{ gap: '16px' }}>
                  {kpis.map((kpi, kIdx) => {
                    const isUp = kpi.value.includes('+') || kpi.desc.toLowerCase().includes('sube') || kpi.desc.toLowerCase().includes('alcista') || (!kpi.value.includes('-') && Math.random() > 0.4);
                    const strokeColor = isUp ? 'var(--color-emerald)' : 'var(--color-rose)';
                    const sparklineData = isUp 
                      ? "M 0 15 Q 10 5, 20 18 T 40 8 T 60 12 T 80 2 T 100 8" 
                      : "M 0 5 Q 10 18, 20 8 T 40 16 T 60 10 T 80 18 T 100 15";

                    return (
                      <div key={kIdx} style={{
                        background: 'rgba(3, 5, 12, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.01)',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(6px)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                      className="conv-item-hover"
                      >
                        {/* Indicador de tendencia sutil de fondo */}
                        <div style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          left: 0,
                          height: '2px',
                          background: strokeColor,
                          opacity: 0.3
                        }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                          <div>
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 800, display: 'block', letterSpacing: '0.06em' }}>{kpi.name}</span>
                            <strong style={{ fontSize: '1.25rem', color: '#ffffff', display: 'block', margin: '8px 0 2px 0', fontFamily: '"Outfit", "Inter", sans-serif', letterSpacing: '-0.02em', fontWeight: 800 }}>{kpi.value}</strong>
                          </div>
                          <div style={{ width: '65px', height: '26px', opacity: 0.85, marginTop: '4px' }}>
                            <svg width="100%" height="100%" viewBox="0 0 100 20">
                              <defs>
                                <linearGradient id={`grad-${kIdx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor={strokeColor} stopOpacity="1" />
                                  <stop offset="100%" stopColor={strokeColor} stopOpacity="0.2" />
                                </linearGradient>
                              </defs>
                              <path d={sparklineData} fill="none" stroke={`url(#grad-${kIdx})`} strokeWidth="3" strokeLinecap="round" />
                            </svg>
                          </div>
                        </div>
                        
                        {kpi.desc && (
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '10px 0 0 0', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', textAlign: 'justify' }}>
                            {kpi.desc}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {imageAsset && (
                  <div style={{
                    background: 'rgba(3, 5, 12, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '14px',
                    padding: '20px',
                    marginTop: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.01)',
                    backdropFilter: 'blur(8px)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: agentColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: agentColor }} />
                        {imageAsset.title}
                      </span>
                      <span className="badge badge-cyan" style={{ fontSize: '0.58rem', padding: '2px 10px', fontWeight: 800, color: agentColor, borderColor: `${agentColor}33`, background: `${agentColor}0f` }}>ANÁLISIS VISUAL IA</span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      borderRadius: '10px', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      overflow: 'hidden', 
                      background: '#03050d', 
                      position: 'relative',
                      boxShadow: `0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px ${agentColor}0c`
                    }}>
                      <img 
                        src={imageAsset.src} 
                        alt={imageAsset.title} 
                        style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '250px', transition: 'transform 0.4s' }}
                      />
                    </div>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', textAlign: 'justify' }}>
                      {imageAsset.desc}
                    </p>
                  </div>
                )}
              </div>
            );
          }

          // RENDER 2: SECCIÓN DE METRICAS (DATA CLINIC CARD STYLE)
          const metrics = [];
          contentLines.forEach(line => {
            const cleanLine = line.trim().replace(/^-\s+|\*\s+/, '');
            if (cleanLine.startsWith('**')) {
              const parts = cleanLine.split('**');
              if (parts.length >= 3) {
                const label = parts[1].replace(/:$/, '').trim();
                const text = parts.slice(2).join('**').trim().replace(/^[^\w\s\d]+/, '');
                metrics.push({ label, text });
              }
            } else if (cleanLine) {
              metrics.push({ label: '', text: cleanLine });
            }
          });

          if (isMetrics && metrics.length > 0) {

            return (
              <div key={idx} style={{
                padding: '26px',
                borderLeft: `4px solid ${agentColor}`,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                borderRight: '1px solid rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: 'linear-gradient(135deg, rgba(13, 20, 38, 0.8) 0%, rgba(7, 10, 22, 0.95) 100%)',
                boxShadow: `0 16px 40px rgba(0, 0, 0, 0.4), 0 0 24px ${agentColor}0a`,
                borderRadius: '16px',
                backdropFilter: 'blur(12px)'
              }}>
                <h4 style={{ 
                  fontSize: '0.88rem', 
                  fontWeight: 900, 
                  color: '#ffffff', 
                  marginBottom: '18px', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em', 
                  display: 'flex', 
                  gap: '10px', 
                  alignItems: 'center',
                  background: `linear-gradient(90deg, #ffffff 0%, ${agentColor}cc 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  <Activity size={18} color={agentColor} style={{ filter: `drop-shadow(0 0 6px ${agentColor})`, WebkitTextFillColor: 'initial' }} />
                  <span>{headingText}</span>
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {metrics.map((met, mIdx) => (
                    <div key={mIdx} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '14px 18px',
                      background: 'rgba(3, 5, 12, 0.65)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: '10px',
                      gap: '8px',
                      backdropFilter: 'blur(6px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.01)',
                      transition: 'all 0.25s ease'
                    }}
                    className="conv-item-hover"
                    >
                      {met.label ? (
                        <>
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.06em' }}>{met.label}</span>
                          <strong style={{ fontSize: '0.8rem', color: '#ffffff', wordBreak: 'break-word', fontWeight: 700, fontFamily: 'monospace', lineHeight: 1.5 }}>{met.text}</strong>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, textAlign: 'justify' }}>{met.text}</span>
                      )}
                    </div>
                  ))}
                </div>

                {imageAsset && (
                  <div style={{
                    background: 'rgba(3, 5, 12, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '14px',
                    padding: '20px',
                    marginTop: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.01)',
                    backdropFilter: 'blur(8px)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: agentColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: agentColor }} />
                        {imageAsset.title}
                      </span>
                      <span className="badge badge-cyan" style={{ fontSize: '0.58rem', padding: '2px 10px', fontWeight: 800, color: agentColor, borderColor: `${agentColor}33`, background: `${agentColor}0f` }}>MÉTRICAS ONCHAIN</span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      borderRadius: '10px', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      overflow: 'hidden', 
                      background: '#03050d',
                      boxShadow: `0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px ${agentColor}0c`
                    }}>
                      <img 
                        src={imageAsset.src} 
                        alt={imageAsset.title} 
                        style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '250px' }}
                      />
                    </div>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', textAlign: 'justify' }}>
                      {imageAsset.desc}
                    </p>
                  </div>
                )}
              </div>
            );
          }

          // RENDER 3: NOTICIAS / GEOPOLÍTICA (EDITORIAL FEED STYLE)
          const newsList = [];
          contentLines.forEach(line => {
            const cleanLine = line.trim().replace(/^-\s+|\*\s+/, '');
            if (cleanLine.startsWith('**')) {
              const parts = cleanLine.split('**');
              if (parts.length >= 3) {
                const title = parts[1].replace(/:$/, '').trim();
                const text = parts.slice(2).join('**').trim().replace(/^[^\w\s\d]+/, '');
                newsList.push({ title, text });
              }
            } else if (cleanLine) {
              newsList.push({ title: '', text: cleanLine });
            }
          });

          if (isNewsOrGeopolitics && newsList.length > 0) {

            return (
              <div key={idx} style={{
                padding: '26px',
                borderLeft: `4px solid ${agentColor}`,
                borderTop: '1px solid rgba(255,255,255,0.08)',
                borderRight: '1px solid rgba(255,255,255,0.03)',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                background: 'linear-gradient(135deg, rgba(13, 20, 38, 0.8) 0%, rgba(7, 10, 22, 0.95) 100%)',
                boxShadow: `0 16px 40px rgba(0, 0, 0, 0.4), 0 0 24px ${agentColor}0a`,
                borderRadius: '16px',
                backdropFilter: 'blur(12px)'
              }}>
                <h4 style={{ 
                  fontSize: '0.88rem', 
                  fontWeight: 900, 
                  color: '#ffffff', 
                  marginBottom: '18px', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em', 
                  display: 'flex', 
                  gap: '10px', 
                  alignItems: 'center',
                  background: `linear-gradient(90deg, #ffffff 0%, ${agentColor}cc 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  <Search size={18} color={agentColor} style={{ filter: `drop-shadow(0 0 6px ${agentColor})`, WebkitTextFillColor: 'initial' }} />
                  <span>{headingText}</span>
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {newsList.map((news, nIdx) => (
                    <div key={nIdx} style={{
                      display: 'flex', 
                      gap: '14px', 
                      alignItems: 'flex-start',
                      background: 'rgba(3, 5, 12, 0.55)',
                      padding: '14px 18px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.03)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.01)',
                      backdropFilter: 'blur(6px)',
                      transition: 'all 0.25s ease'
                    }}
                    className="conv-item-hover"
                    >
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: agentColor,
                        marginTop: '6px',
                        flexShrink: 0,
                        boxShadow: `0 0 10px ${agentColor}`,
                        animation: 'pulse 2s infinite ease-in-out'
                      }} />
                      <div style={{ flex: 1 }}>
                        {news.title && <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block', marginBottom: '6px', fontWeight: 800, fontFamily: '"Inter", sans-serif' }}>{news.title}</strong>}
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, textAlign: 'justify' }}>{news.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {imageAsset && (
                  <div style={{
                    background: 'rgba(3, 5, 12, 0.5)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '14px',
                    padding: '20px',
                    marginTop: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.01)',
                    backdropFilter: 'blur(8px)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: agentColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: agentColor }} />
                        {imageAsset.title}
                      </span>
                      <span className="badge badge-cyan" style={{ fontSize: '0.58rem', padding: '2px 10px', fontWeight: 800, color: agentColor, borderColor: `${agentColor}33`, background: `${agentColor}0f` }}>CONTEXTO GLOBAL</span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      borderRadius: '10px', 
                      border: '1px solid rgba(255,255,255,0.08)', 
                      overflow: 'hidden', 
                      background: '#03050d',
                      boxShadow: `0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px ${agentColor}0c`
                    }}>
                      <img 
                        src={imageAsset.src} 
                        alt={imageAsset.title} 
                        style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '250px' }}
                      />
                    </div>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', textAlign: 'justify' }}>
                      {imageAsset.desc}
                    </p>
                  </div>
                )}
              </div>
            );
          }

          // RENDER 4: BLOQUE GENÉRICO (Fisiología/Trauma, Clínico o General)
          return (
            <div key={idx} style={{
              padding: '26px',
              borderLeft: `4px solid ${agentColor}`,
              borderTop: '1px solid rgba(255,255,255,0.08)',
              borderRight: '1px solid rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.03)',
              background: 'linear-gradient(135deg, rgba(13, 20, 38, 0.8) 0%, rgba(7, 10, 22, 0.95) 100%)',
              boxShadow: `0 16px 40px rgba(0, 0, 0, 0.4), 0 0 24px ${agentColor}0a`,
              borderRadius: '16px',
              backdropFilter: 'blur(12px)'
            }}>
              {headingText && (
                <h4 style={{ 
                  fontSize: '0.88rem', 
                  fontWeight: 900, 
                  color: '#ffffff', 
                  marginBottom: '18px', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.08em', 
                  display: 'flex', 
                  gap: '10px', 
                  alignItems: 'center',
                  background: `linear-gradient(90deg, #ffffff 0%, ${agentColor}cc 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  <Brain size={18} color={agentColor} style={{ filter: `drop-shadow(0 0 6px ${agentColor})`, WebkitTextFillColor: 'initial' }} />
                  <span>{headingText}</span>
                </h4>
              )}
              
              {cortisolLevel !== null && (
                <div style={{
                  background: 'rgba(3, 5, 12, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '18px 20px',
                  marginBottom: '18px',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.01)',
                  backdropFilter: 'blur(8px)',
                  borderTop: '1px solid rgba(255,255,255,0.02)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Índice de Sobrecarga del Eje HPA</span>
                    <span style={{ fontSize: '0.7rem', color: cortisolColor, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{cortisolLevel}% · {cortisolStatus}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                    <div style={{
                      width: `${cortisolLevel}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, #10b981 0%, #f59e0b 50%, #f43f5e 100%)`,
                      borderRadius: '4px',
                      boxShadow: `0 0 12px ${cortisolColor}aa`
                    }} />
                  </div>
                  <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.92)', margin: 0, lineHeight: 1.5, fontStyle: 'italic' }}>
                    ⚠️ {cortisolAlert}
                  </p>
                </div>
              )}

              {/* RENDER ESTRUCTURADO DEL CONTENIDO */}
              {renderStructuredContent(contentText, agentColor)}

              {imageAsset && (
                <div style={{
                  background: 'rgba(3, 5, 12, 0.5)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '14px',
                  padding: '20px',
                  marginTop: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.01)',
                  backdropFilter: 'blur(8px)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: agentColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: agentColor }} />
                      {imageAsset.title}
                    </span>
                    <span className="badge badge-cyan" style={{ fontSize: '0.58rem', padding: '2px 10px', fontWeight: 800, color: agentColor, borderColor: `${agentColor}33`, background: `${agentColor}0f` }}>CLÍNICO-EXPLICATIVO</span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    borderRadius: '10px', 
                    border: '1px solid rgba(255,255,255,0.08)', 
                    overflow: 'hidden', 
                    background: '#03050d',
                    boxShadow: `0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px ${agentColor}0c`
                  }}>
                    <img 
                      src={imageAsset.src} 
                      alt={imageAsset.title} 
                      style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: '250px' }}
                    />
                  </div>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px', textAlign: 'justify' }}>
                    {imageAsset.desc}
                  </p>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default function AgentesView({ user, profile, sidebarCollapsed = false, setSidebarCollapsed, onProfileUpdated }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [calendarCollapsed, setCalendarCollapsed] = useState(false);
  const [selectedReportSection, setSelectedReportSection] = useState('all');
  const [selectedReportIndex, setSelectedReportIndex] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [debates, setDebates] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedDebate, setSelectedDebate] = useState(null);
  const [debateMessages, setDebateMessages] = useState([]);
  
  // Nuevos estados para notificación emergente de informes en caliente
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationTask, setNotificationTask] = useState(null);

  // Estados para cargar debate del reporte seleccionado en el calendario
  const [activeReportDebateMessages, setActiveReportDebateMessages] = useState([]);
  const [loadingReportDebateMessages, setLoadingReportDebateMessages] = useState(false);

  // Calendario de Resultados
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  
  // Loaders
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingDebates, setLoadingDebates] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);

  // Form states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskAgent, setNewTaskAgent] = useState('');
  const [newTaskScheduled, setNewTaskScheduled] = useState('');
  const [newTaskCron, setNewTaskCron] = useState('');
  const [newTaskRecurrenceType, setNewTaskRecurrenceType] = useState('none');
  const [newTaskRecurrenceTime, setNewTaskRecurrenceTime] = useState('09:00');
  const [newTaskRecurrenceDay, setNewTaskRecurrenceDay] = useState('1');
  const [newTaskRecurrenceInterval, setNewTaskRecurrenceInterval] = useState('4');
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [newDebateTitle, setNewDebateTitle] = useState('');
  const [newDebateAgents, setNewDebateAgents] = useState([]);
  const [showDebateForm, setShowDebateForm] = useState(false);
  
  // Double-submit prevention
  const [submittingTask, setSubmittingTask] = useState(false);
  const [submittingDebate, setSubmittingDebate] = useState(false);

  // Selected task console
  const [selectedTaskForConsole, setSelectedTaskForConsole] = useState(null);
  
  // Estados para Interactividad en Sala de Debates
  const [userDebateMessage, setUserDebateMessage] = useState('');
  const [submittingDebateMessage, setSubmittingDebateMessage] = useState(false);
  const [loadingInsist, setLoadingInsist] = useState(false);

  // Nuevos estados para debate rico
  const [debateImageBase64, setDebateImageBase64] = useState(null);
  const [debateIsRecording, setDebateIsRecording] = useState(false);
  const [debateTranscribingAudio, setDebateTranscribingAudio] = useState(false);
  const debateFileInputRef = useRef(null);
  const debateTextareaRef = useRef(null);
  const debateMediaRecorderRef = useRef(null);
  const debateAudioChunksRef = useRef([]);

  // Estados locales para la pestaña de Ajustes del Sistema de Agentes
  const [pollingInterval, setPollingInterval] = useState(profile?.app_config?.agents_config?.polling_interval || 5);
  const [equityKillerLimit, setEquityKillerLimit] = useState(profile?.app_config?.agents_config?.equity_killer_limit || '1R');
  const [blindTrading, setBlindTrading] = useState(profile?.app_config?.agents_config?.blind_trading ?? false);
  const [cortisolThreshold, setCortisolThreshold] = useState(profile?.app_config?.agents_config?.cortisol_alert_threshold || 75);
  const [autoDebateFrequency, setAutoDebateFrequency] = useState(profile?.app_config?.agents_config?.auto_debate_frequency || 'daily');
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.app_config?.agents_config?.notifications_enabled ?? true);
  const [alertChannel, setAlertChannel] = useState(profile?.app_config?.agents_config?.alert_channel || 'telegram_alert');
  const [cooldownHours, setCooldownHours] = useState(profile?.app_config?.agents_config?.cooldown_hours || '24');
  const [displayMode, setDisplayMode] = useState(profile?.app_config?.agents_config?.display_mode || 'pips_r');
  const [maxDailyTrades, setMaxDailyTrades] = useState(profile?.app_config?.agents_config?.max_daily_trades || '3');
  const [hardStopTime, setHardStopTime] = useState(profile?.app_config?.agents_config?.hard_stop_time || '20:00');
  const [somaticThermalReset, setSomaticThermalReset] = useState(profile?.app_config?.agents_config?.somatic_thermal_reset ?? true);
  const [debtDecompression, setDebtDecompression] = useState(profile?.app_config?.agents_config?.debt_decompression ?? true);
  const [supervisorContact, setSupervisorContact] = useState(profile?.app_config?.agents_config?.supervisor_contact || 'Tutor Familiar / Dr. Beck');
  const [customContainmentMsg, setCustomContainmentMsg] = useState(profile?.app_config?.agents_config?.custom_containment_msg || 'Emilio, detente. Respira profundamente. Esto es un secuestro límbico de tu amígdala. Apaga la pantalla y sal a caminar 10 minutos. Tu salud y tu vida valen más que cualquier trade.');
  const [debateRounds, setDebateRounds] = useState(profile?.app_config?.agents_config?.debate_rounds || '2');
  const [debateRigor, setDebateRigor] = useState(profile?.app_config?.agents_config?.debate_rigor || 'critico');
  const [savingConfig, setSavingConfig] = useState(false);

  // Estados para Telegram Config
  const [telegramBotToken, setTelegramBotToken] = useState(profile?.app_config?.telegram_config?.bot_token || '');
  const [telegramChatId, setTelegramChatId] = useState(profile?.app_config?.telegram_config?.chat_id || '');
  const [telegramAlertLosses, setTelegramAlertLosses] = useState(profile?.app_config?.telegram_config?.alert_losses ?? true);
  const [telegramAlertReports, setTelegramAlertReports] = useState(profile?.app_config?.telegram_config?.alert_reports ?? true);
  const [telegramAlertDebates, setTelegramAlertDebates] = useState(profile?.app_config?.telegram_config?.alert_debates ?? true);

  // Estados para probar conexión de Telegram y navegación de sub-pestañas de Ajustes
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [telegramTestResult, setTelegramTestResult] = useState(null);
  const [settingsSubTab, setSettingsSubTab] = useState('trading');

  // Estados para Monitor de Tareas
  const [taskMonitorFilter, setTaskMonitorFilter] = useState('all');
  const [taskMonitorSearch, setTaskMonitorSearch] = useState('');

  // Centro de Notificaciones
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('read_notifications') || '[]');
    } catch {
      return [];
    }
  });

  // Agent editing states
  const [editingAgent, setEditingAgent] = useState(null);
  const [editAgentName, setEditAgentName] = useState('');
  const [editAgentRole, setEditAgentRole] = useState('');
  const [editAgentDesc, setEditAgentDesc] = useState('');
  const [editAgentColor, setEditAgentColor] = useState('');
  const [editAgentIcon, setEditAgentIcon] = useState('Bot');
  const [submittingAgent, setSubmittingAgent] = useState(false);

  // Task editing states
  const [editingTask, setEditingTask] = useState(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editTaskDesc, setEditTaskDesc] = useState('');
  const [editTaskAgent, setEditTaskAgent] = useState('');
  const [editTaskScheduled, setEditTaskScheduled] = useState('');
  const [editTaskCron, setEditTaskCron] = useState('');
  const [editTaskRecurrenceType, setEditTaskRecurrenceType] = useState('none');
  const [editTaskRecurrenceTime, setEditTaskRecurrenceTime] = useState('09:00');
  const [editTaskRecurrenceDay, setEditTaskRecurrenceDay] = useState('1');
  const [editTaskRecurrenceInterval, setEditTaskRecurrenceInterval] = useState('4');
  const [submittingEditTask, setSubmittingEditTask] = useState(false);

  const messageEndRef = useRef(null);
  const prevTasksRef = useRef([]);
  const prevDebatesRef = useRef([]);

  // Notificaciones locales del navegador
  const sendLocalNotification = (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/favicon.ico'
      });
    }
  };

  // Solicitar permisos de notificación al montar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Sincronizar estados locales de configuración cuando cambie el perfil
  useEffect(() => {
    if (profile?.app_config?.agents_config) {
      const cfg = profile.app_config.agents_config;
      setPollingInterval(cfg.polling_interval || 5);
      setEquityKillerLimit(cfg.equity_killer_limit || '1R');
      setBlindTrading(cfg.blind_trading ?? false);
      setCortisolThreshold(cfg.cortisol_alert_threshold || 75);
      setAutoDebateFrequency(cfg.auto_debate_frequency || 'daily');
      setNotificationsEnabled(cfg.notifications_enabled ?? true);
      setAlertChannel(cfg.alert_channel || 'telegram_alert');
      setCooldownHours(cfg.cooldown_hours || '24');
      setDisplayMode(cfg.display_mode || 'pips_r');
      setMaxDailyTrades(cfg.max_daily_trades || '3');
      setHardStopTime(cfg.hard_stop_time || '20:00');
      setSomaticThermalReset(cfg.somatic_thermal_reset ?? true);
      setDebtDecompression(cfg.debt_decompression ?? true);
      setSupervisorContact(cfg.supervisor_contact || 'Tutor Familiar / Dr. Beck');
      setCustomContainmentMsg(cfg.custom_containment_msg || 'Emilio, detente. Respira profundamente. Esto es un secuestro límbico de tu amígdala. Apaga la pantalla y sal a caminar 10 minutos. Tu salud y tu vida valen más que cualquier trade.');
      setDebateRounds(cfg.debate_rounds || '2');
      setDebateRigor(cfg.debate_rigor || 'critico');
    }
    if (profile?.app_config?.telegram_config) {
      const tg = profile.app_config.telegram_config;
      setTelegramBotToken(tg.bot_token || '');
      setTelegramChatId(tg.chat_id || '');
      setTelegramAlertLosses(tg.alert_losses ?? true);
      setTelegramAlertReports(tg.alert_reports ?? true);
      setTelegramAlertDebates(tg.alert_debates ?? true);
    }
  }, [profile]);

  // Escuchar cambios de estado en las tareas para enviar notificaciones
  useEffect(() => {
    if (prevTasksRef.current.length > 0) {
      tasks.forEach(task => {
        const prevTask = prevTasksRef.current.find(t => t.id === task.id);
        if (prevTask && prevTask.status !== task.status) {
          if (task.status === 'completed') {
            sendLocalNotification(
              `✨ Tarea de Agente Completada`,
              `Tu agente ${task.agent_name} ha finalizado: "${task.title}".`
            );
          } else if (task.status === 'failed') {
            sendLocalNotification(
              `⚠️ Tarea de Agente Fallida`,
              `La tarea "${task.title}" del agente ${task.agent_name} ha fallado.`
            );
          }
        }
      });
    }
    prevTasksRef.current = tasks;
  }, [tasks]);

  // Escuchar cambios de estado en los debates para enviar notificaciones
  useEffect(() => {
    if (prevDebatesRef.current.length > 0) {
      debates.forEach(deb => {
        const prevDeb = prevDebatesRef.current.find(d => d.id === deb.id);
        if (prevDeb && prevDeb.status !== deb.status) {
          if (deb.status === 'completed') {
            sendLocalNotification(
              `💬 Debate de Agentes Concluido`,
              `Se ha alcanzado una resolución en el debate: "${deb.title}".`
            );
          }
        }
      });
    }
    prevDebatesRef.current = debates;
  }, [debates]);

  // Auto-scroll en debates
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [debateMessages]);

  // --- NUEVAS FUNCIONES DE SOPORTE PARA EL DEBATE RICO Y NOTIFICACIONES ---

  const startDebateAudioRecording = async () => {
    debateAudioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      debateMediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          debateAudioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());

        const audioBlob = new Blob(debateAudioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size < 1000) return;

        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result;
          await sendDebateAudioToTranscribe(base64Audio);
        };
      };

      mediaRecorder.start();
      setDebateIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone in debate:", err);
      alert("No se pudo acceder al micrófono: " + err.message);
    }
  };

  const stopDebateAudioRecording = () => {
    if (debateMediaRecorderRef.current && debateIsRecording) {
      debateMediaRecorderRef.current.stop();
      setDebateIsRecording(false);
    }
  };

  const sendDebateAudioToTranscribe = async (base64Audio) => {
    setDebateTranscribingAudio(true);
    try {
      const { data: { session } } = await db.auth.getSession();
      if (!session) throw new Error("Sesión no disponible.");

      const resData = await invokeChatTerapeuta({
        action: 'transcribe_audio',
        audio: base64Audio
      });
      if (resData && resData.transcription) {
        setUserDebateMessage(prev => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${resData.transcription}` : resData.transcription;
        });
      }
    } catch (err) {
      console.error("Error transcribing debate audio:", err.message);
      alert("Error en transcripción de audio: " + err.message);
    } finally {
      setDebateTranscribingAudio(false);
    }
  };

  const handleDebateMicClick = () => {
    if (debateIsRecording) {
      stopDebateAudioRecording();
    } else {
      startDebateAudioRecording();
    }
  };

  const handleDebateImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setDebateImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDebatePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setDebateImageBase64(reader.result);
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      // 1. Tareas completadas
      const { data: completedTasks, error: taskErr } = await firebaseClient
        .from('agent_tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('updated_at', { ascending: false })
        .limit(15);
      if (taskErr) throw taskErr;

      // 2. Debates del usuario
      const { data: userDebates, error: debErr } = await firebaseClient
        .from('agent_debates')
        .select('id, title')
        .eq('user_id', user.id);
      if (debErr) throw debErr;
      const debateIds = userDebates?.map(d => d.id) || [];

      let debateMessages = [];
      if (debateIds.length > 0) {
        const { data: messages, error: msgErr } = await firebaseClient
          .from('agent_debate_messages')
          .select('*')
          .in('debate_id', debateIds)
          .neq('agent_name', 'Paciente (Emilio)')
          .order('created_at', { ascending: false })
          .limit(15);
        if (msgErr) throw msgErr;
        debateMessages = messages || [];
      }

      // 3. Formatear y unificar
      const formattedTasks = (completedTasks || []).map(t => ({
        id: `task_${t.id}`,
        type: 'task',
        title: '📋 Tarea Completada',
        desc: `La tarea "${t.title}" ha sido completada por ${t.agent_name}.`,
        time: new Date(t.updated_at || t.created_at),
        originalItem: t
      }));

      const formattedMsgs = debateMessages.map(m => {
        const deb = userDebates.find(d => d.id === m.debate_id);
        return {
          id: `msg_${m.id}`,
          type: 'debate',
          title: '💬 Nuevo Aporte en Debate',
          desc: `${m.agent_name} ha respondido en "${deb?.title || 'Debate'}"`,
          time: new Date(m.created_at),
          originalItem: m,
          debate: deb
        };
      });

      const combined = [...formattedTasks, ...formattedMsgs]
        .sort((a, b) => b.time - a.time)
        .slice(0, 20);

      setNotifications(combined);
      const unread = combined.filter(n => !readNotificationIds.includes(n.id)).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Error al obtener notificaciones:", err.message);
    }
  };

  const markNotificationAsRead = (id) => {
    if (readNotificationIds.includes(id)) return;
    const nextReadIds = [...readNotificationIds, id];
    setReadNotificationIds(nextReadIds);
    localStorage.setItem('read_notifications', JSON.stringify(nextReadIds));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllNotificationsAsRead = () => {
    const allIds = notifications.map(n => n.id);
    const nextReadIds = Array.from(new Set([...readNotificationIds, ...allIds]));
    setReadNotificationIds(nextReadIds);
    localStorage.setItem('read_notifications', JSON.stringify(nextReadIds));
    setUnreadCount(0);
  };

  const handleNotificationClick = (n) => {
    markNotificationAsRead(n.id);
    setShowNotificationPanel(false);

    if (n.type === 'debate') {
      if (n.debate) {
        setSelectedDebate(n.debate);
        setActiveTab('debate');
      }
    } else if (n.type === 'task') {
      const taskDate = new Date(n.originalItem.created_at || n.originalItem.updated_at);
      setCalendarDate(taskDate);
      setSelectedCalendarDay(taskDate);
      setActiveTab('calendar');
      setCalendarCollapsed(true);
      
      setTimeout(() => {
        const completedTasks = tasks.filter(t => t.status === 'completed' && !t.debate_id);
        const dayTasks = completedTasks.filter(t => {
          const dDate = new Date(t.created_at || t.updated_at);
          return dDate.getDate() === taskDate.getDate() &&
                 dDate.getMonth() === taskDate.getMonth() &&
                 dDate.getFullYear() === taskDate.getFullYear();
        });
        const index = dayTasks.findIndex(t => t.id === n.originalItem.id);
        if (index !== -1) {
          setSelectedReportIndex(index);
        }
      }, 200);
    }
  };

  // Fetch notifications periodically
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user, readNotificationIds]);

  useEffect(() => {
    fetchNotifications();
  }, [tasks]);

  function renderDebateMessageText(text) {
    if (!text) return null;
    
    // Buscar la etiqueta [IMAGE:base64]
    const imageRegex = /\[IMAGE:(data:image\/[^;]+;base64,[^\]]+)\]/;
    const match = text.match(imageRegex);
    
    let cleanText = text;
    let imageSrc = null;
    
    if (match) {
      imageSrc = match[1];
      cleanText = text.replace(imageRegex, '').trim();
    }
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {imageSrc && (
          <div style={{ maxWidth: '320px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <img src={imageSrc} alt="Imagen adjunta" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        )}
        <div style={{ whiteSpace: 'pre-wrap' }}>{cleanText}</div>
      </div>
    );
  }

  // Cargar mensajes de debate para el informe seleccionado en el calendario
  useEffect(() => {
    const loadDebateMessagesForReport = async () => {
      if (!selectedCalendarDay) {
        setActiveReportDebateMessages([]);
        return;
      }
      
      const completedTasks = tasks.filter(t => t.status === 'completed' && !t.debate_id);
      const getTasksForDay = (dateObj) => {
        if (!dateObj) return [];
        return completedTasks.filter(t => {
          const taskDate = new Date(t.created_at || t.updated_at);
          return taskDate.getDate() === dateObj.getDate() &&
                 taskDate.getMonth() === dateObj.getMonth() &&
                 taskDate.getFullYear() === dateObj.getFullYear();
        });
      };
      
      const dayTasks = getTasksForDay(selectedCalendarDay);
      const activeTask = dayTasks[selectedReportIndex] || dayTasks[0];
      
      if (activeTask && activeTask.debate_id) {
        setLoadingReportDebateMessages(true);
        try {
          const { data, error } = await firebaseClient
            .from('agent_debate_messages')
            .select('*')
            .eq('debate_id', activeTask.debate_id)
            .order('step_index', { ascending: true });
            
          if (error) throw error;
          setActiveReportDebateMessages(data || []);
        } catch (err) {
          console.error("Error al cargar mensajes del debate del informe:", err.message);
        } finally {
          setLoadingReportDebateMessages(false);
        }
      } else {
        setActiveReportDebateMessages([]);
      }
    };
    
    loadDebateMessagesForReport();
  }, [selectedCalendarDay, selectedReportIndex, tasks]);

  // Polling periódico para ver actualizaciones en vivo (cada 4 segundos)
  useEffect(() => {
    fetchAgents();
    fetchTasks();
    fetchDebates();

    const interval = setInterval(() => {
      fetchAgents(true);
      fetchTasks(true);
      fetchDebates(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [user]);

  // Si no hay agente de tareas seleccionado por defecto, usar el primero de la lista cuando cargue
  useEffect(() => {
    if (agents.length > 0 && !newTaskAgent) {
      setNewTaskAgent(agents[0].name);
    }
  }, [agents, newTaskAgent]);

  // Cargar mensajes de debate en vivo si hay uno seleccionado
  useEffect(() => {
    if (selectedDebate) {
      fetchDebateMessages();
      const interval = setInterval(() => {
        fetchDebateMessages(true);
      }, 3000);
      return () => clearInterval(interval);
    } else {
      setDebateMessages([]);
    }
  }, [selectedDebate]);

  const fetchAgents = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoadingAgents(true);
    try {
      const { data, error } = await firebaseClient
        .from('agents')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      setAgents(data || []);
    } catch (err) {
      console.error("Error fetching agents:", err.message);
    } finally {
      if (!silent) setLoadingAgents(false);
    }
  };

  const fetchTasks = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoadingTasks(true);
    try {
      const { data, error } = await firebaseClient
        .from('agent_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // LOGICA DE DETECCION DE INFORME COMPLETADO EN CALIENTE
      if (silent && tasks.length > 0 && data) {
        data.forEach(newTask => {
          const prevTask = tasks.find(t => t.id === newTask.id);
          if (prevTask && (prevTask.status === 'pending' || prevTask.status === 'running') && newTask.status === 'completed') {
            console.log(`[Notificación Web] Tarea completada en vivo: ${newTask.title}`);
            // Disparar ventana emergente
            setNotificationTask(newTask);
            setShowNotificationModal(true);
            
            // Generar sonido premium senoidal usando Web Audio API
            try {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
              const oscillator = audioCtx.createOscillator();
              const gainNode = audioCtx.createGain();
              oscillator.connect(gainNode);
              gainNode.connect(audioCtx.destination);
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
              oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12); // A5
              gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
              oscillator.start();
              oscillator.stop(audioCtx.currentTime + 0.5);
            } catch (soundErr) {
              // Navegadores pueden requerir interacción del usuario primero
            }
          }
        });
      }
      
      setTasks(data || []);
    } catch (err) {
      console.error("Error fetching agent tasks:", err.message);
    } finally {
      if (!silent) setLoadingTasks(false);
    }
  };

  const fetchDebates = async (silent = false) => {
    if (!user) return;
    if (!silent) setLoadingDebates(true);
    try {
      const { data, error } = await firebaseClient
        .from('agent_debates')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDebates(data || []);
      
      // Actualizar debate seleccionado si cambió de estado
      if (selectedDebate) {
        const updated = data?.find(d => d.id === selectedDebate.id);
        if (updated) {
          setSelectedDebate(updated);
        }
      }
    } catch (err) {
      console.error("Error fetching agent debates:", err.message);
    } finally {
      if (!silent) setLoadingDebates(false);
    }
  };

  const fetchDebateMessages = async (silent = false) => {
    if (!selectedDebate) return;
    if (!silent) setLoadingMessages(true);
    try {
      const { data, error } = await firebaseClient
        .from('agent_debate_messages')
        .select('*')
        .eq('debate_id', selectedDebate.id)
        .order('step_index', { ascending: true });
      if (error) throw error;
      setDebateMessages(data || []);
    } catch (err) {
      console.error("Error fetching debate messages:", err.message);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  const buildCronFromUI = (type, time, day, interval) => {
    if (type === 'none') return '';
    if (type === 'custom') return '';
    
    let hours = '09';
    let minutes = '00';
    if (time && time.includes(':')) {
      const parts = time.split(':');
      hours = parseInt(parts[0], 10).toString();
      minutes = parseInt(parts[1], 10).toString();
    }

    if (type === 'daily') {
      return minutes + ' ' + hours + ' * * *';
    }
    if (type === 'weekdays') {
      return minutes + ' ' + hours + ' * * 1-5';
    }
    if (type === 'weekly') {
      return minutes + ' ' + hours + ' * * ' + day;
    }
    if (type === 'hourly') {
      const hr = parseInt(interval, 10) || 4;
      if (hr === 1) {
        return '0 * * * *';
      }
      return '0 */' + hr + ' * * *';
    }
    return '';
  };

  const parseCronToUI = (cron) => {
    if (!cron) return { type: 'none', time: '09:00', day: '1', interval: '4', customCron: '' };
    
    const trimCron = cron.trim();
    
    if (trimCron === '0 * * * *') {
      return { type: 'hourly', time: '09:00', day: '1', interval: '1', customCron: '' };
    }
    const hourlyMatch = trimCron.match(/^0 \*\/(12|8|6|4|2|3) \* \* \*$/);
    if (hourlyMatch) {
      return { type: 'hourly', time: '09:00', day: '1', interval: hourlyMatch[1], customCron: '' };
    }

    const weekdaysMatch = trimCron.match(/^(\d+) (\d+) \* \* 1-5$/);
    if (weekdaysMatch) {
      const minutes = weekdaysMatch[1].padStart(2, '0');
      const hours = weekdaysMatch[2].padStart(2, '0');
      return { type: 'weekdays', time: hours + ':' + minutes, day: '1', interval: '4', customCron: '' };
    }

    const weeklyMatch = trimCron.match(/^(\d+) (\d+) \* \* ([0-6])$/);
    if (weeklyMatch) {
      const minutes = weeklyMatch[1].padStart(2, '0');
      const hours = weeklyMatch[2].padStart(2, '0');
      return { type: 'weekly', time: hours + ':' + minutes, day: weeklyMatch[3], interval: '4', customCron: '' };
    }

    const dailyMatch = trimCron.match(/^(\d+) (\d+) \* \* \*$/);
    if (dailyMatch) {
      const minutes = dailyMatch[1].padStart(2, '0');
      const hours = dailyMatch[2].padStart(2, '0');
      return { type: 'daily', time: hours + ':' + minutes, day: '1', interval: '4', customCron: '' };
    }

    return { type: 'custom', time: '09:00', day: '1', interval: '4', customCron: trimCron };
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!user || submittingTask) return;
    setSubmittingTask(true);
    try {
      const activeAgentName = newTaskAgent || (agents[0]?.name || 'Ánquer');
      const isRecurrent = newTaskRecurrenceType !== 'none';
      const cronExpr = (newTaskRecurrenceType === 'custom' ? newTaskCron : buildCronFromUI(newTaskRecurrenceType, newTaskRecurrenceTime, newTaskRecurrenceDay, newTaskRecurrenceInterval)) || null;
      
      const { error } = await firebaseClient
        .from('agent_tasks')
        .insert({
          user_id: user.id,
          agent_name: activeAgentName,
          title: newTaskTitle,
          description: newTaskDesc,
          status: 'pending',
          scheduled_at: isRecurrent ? null : (newTaskScheduled ? new Date(newTaskScheduled).toISOString() : null),
          cron_expression: cronExpr
        });

      if (error) throw error;

      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskScheduled('');
      setNewTaskCron('');
      setNewTaskRecurrenceType('none');
      setNewTaskRecurrenceTime('09:00');
      setNewTaskRecurrenceDay('1');
      setNewTaskRecurrenceInterval('4');
      setShowTaskForm(false);
      fetchTasks();
    } catch (err) {
      alert("Error al crear tarea: " + err.message);
    } finally {
      setSubmittingTask(false);
    }
  };

  const handleCreateDebate = async (e) => {
    e.preventDefault();
    if (!user || submittingDebate) return;
    
    const finalAgents = newDebateAgents.length > 0 ? newDebateAgents : (agents.map(a => a.name).slice(0, 2));
    if (finalAgents.length === 0) {
      alert("Debes tener agentes registrados para iniciar un debate.");
      return;
    }
    
    setSubmittingDebate(true);
    try {
      const { data, error } = await firebaseClient
        .from('agent_debates')
        .insert({
          user_id: user.id,
          title: newDebateTitle,
          agents: finalAgents,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Crear también una tarea de agente para iniciar el debate en local
      const { error: taskErr } = await firebaseClient
        .from('agent_tasks')
        .insert({
          user_id: user.id,
          agent_name: finalAgents[0], // El primer agente lidera el debate
          title: `Iniciar Debate: ${newDebateTitle}`,
          description: `Por favor, modera e inicia el debate titulado "${newDebateTitle}" con los agentes: ${finalAgents.join(', ')}. El tema de debate es: ${newDebateTitle}. Escribe el primer mensaje en la tabla agent_debate_messages y coordina las aportaciones.`,
          status: 'pending',
          debate_id: data.id
        });

      if (taskErr) throw taskErr;

      setNewDebateTitle('');
      setNewDebateAgents([]);
      setShowDebateForm(false);
      fetchDebates();
      setSelectedDebate(data);
      setActiveTab('debate');
    } catch (err) {
      alert("Error al iniciar debate: " + err.message);
    } finally {
      setSubmittingDebate(false);
    }
  };

  const handleSendUserMessageToDebate = async (e) => {
    e.preventDefault();
    if (!user || !selectedDebate || submittingDebateMessage) return;
    if (!userDebateMessage.trim() && !debateImageBase64) return;

    setSubmittingDebateMessage(true);
    let messageText = userDebateMessage.trim();
    if (debateImageBase64) {
      messageText = `[IMAGE:${debateImageBase64}]\n\n${messageText}`.trim();
    }

    try {
      // 1. Insertar el mensaje del usuario en la tabla de mensajes del debate
      const { error: msgErr } = await firebaseClient
        .from('agent_debate_messages')
        .insert({
          debate_id: selectedDebate.id,
          agent_name: 'Paciente (Emilio)',
          message: messageText,
          step_index: debateMessages.length
        });

      if (msgErr) throw msgErr;

      // 2. Si el debate estaba completado, reabrirlo a 'active' para que los agentes debatan de nuevo
      if (selectedDebate.status === 'completed') {
        const { error: statusErr } = await firebaseClient
          .from('agent_debates')
          .update({ status: 'active', conclusion: null })
          .eq('id', selectedDebate.id);
        
        if (statusErr) throw statusErr;
      }

      // 3. Crear una tarea en agent_tasks para que los agentes respondan
      const { error: taskErr } = await firebaseClient
        .from('agent_tasks')
        .insert({
          user_id: user.id,
          agent_name: selectedDebate.agents[0],
          title: `Intervención de Emilio: ${selectedDebate.title.substring(0, 40)}`,
          description: `Emilio ha intervenido en el debate con el mensaje: "${messageText}". Modera e integra las opiniones de los agentes (${selectedDebate.agents.join(', ')}) para responder detalladamente con bases científicas de sus libros recomendados en agent_debate_messages, buscando una solución real consensuada.`,
          status: 'pending',
          debate_id: selectedDebate.id
        });

      if (taskErr) throw taskErr;

      setUserDebateMessage('');
      setDebateImageBase64(null);
      fetchDebateMessages(true);
      fetchDebates(true);
    } catch (err) {
      alert("Error al enviar mensaje al debate: " + err.message);
    } finally {
      setSubmittingDebateMessage(false);
    }
  };

  const handleInsistDebate = async () => {
    if (!user || !selectedDebate || loadingInsist) return;

    setLoadingInsist(true);
    try {
      // 1. Poner el debate en activo y limpiar conclusión anterior
      const { error: statusErr } = await firebaseClient
        .from('agent_debates')
        .update({ status: 'active', conclusion: null })
        .eq('id', selectedDebate.id);
      
      if (statusErr) throw statusErr;

      // 2. Crear una tarea de insistencia crítica en agent_tasks
      const { error: taskErr } = await firebaseClient
        .from('agent_tasks')
        .insert({
          user_id: user.id,
          agent_name: selectedDebate.agents[0],
          title: `Insistir Debate: ${selectedDebate.title.substring(0, 40)}`,
          description: `El usuario no está totalmente conforme o quiere insistir en el debate. Revisa críticamente la conclusión anterior y las aportaciones hechas. Genera 2 rondas de diálogo cruzado y contrapropuestas analíticas más exigentes entre los agentes: ${selectedDebate.agents.join(', ')}. Concluye con un plan de blindaje optimizado y definitivo basado en evidencia clínica contrastada.`,
          status: 'pending',
          debate_id: selectedDebate.id
        });

      if (taskErr) throw taskErr;

      fetchDebateMessages(true);
      fetchDebates(true);
    } catch (err) {
      alert("Error al insistir en el debate: " + err.message);
    } finally {
      setLoadingInsist(false);
    }
  };

  const handleSelectSolution = async (solutionText) => {
    if (!user || !selectedDebate) return;

    const confirmSelect = window.confirm("¿Deseas aplicar esta propuesta como la solución operativa real consensuada en el expediente clínico?");
    if (!confirmSelect) return;

    try {
      // 1. Guardar la solución elegida en la conclusión del debate y marcar como completado
      const { error: debateErr } = await firebaseClient
        .from('agent_debates')
        .update({
          status: 'completed',
          conclusion: solutionText
        })
        .eq('id', selectedDebate.id);

      if (debateErr) throw debateErr;

      // 2. Actualizar también el perfil de Emilio en contexto_terapeutico para guardar el acuerdo clínico activo
      let currentContext = {};
      if (profile && profile.contexto_terapeutico) {
        try {
          currentContext = typeof profile.contexto_terapeutico === 'string' 
            ? JSON.parse(profile.contexto_terapeutico) 
            : profile.contexto_terapeutico;
        } catch (_) {}
      }
      
      currentContext.ultimo_acuerdo_clinico = {
        debate_id: selectedDebate.id,
        titulo_debate: selectedDebate.title,
        solucion_elegida: solutionText,
        fecha_aplicacion: new Date().toISOString()
      };

      const { error: profileErr } = await firebaseClient
        .from('profiles')
        .update({
          contexto_terapeutico: currentContext,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (profileErr) throw profileErr;

      alert("¡Solución operativa registrada con éxito! El acuerdo se ha guardado en tu perfil clínico.");
      fetchDebates(true);
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      alert("Error al registrar solución operativa: " + err.message);
    }
  };

  const handleSaveAgentsConfig = async (e) => {
    e.preventDefault();
    if (!user || savingConfig) return;

    setSavingConfig(true);
    try {
      const currentConfig = profile?.app_config || {};
      const nextConfig = {
        ...currentConfig,
        agents_config: {
          polling_interval: parseInt(pollingInterval, 10) || 5,
          equity_killer_limit: equityKillerLimit,
          blind_trading: blindTrading,
          cortisol_alert_threshold: parseInt(cortisolThreshold, 10) || 75,
          auto_debate_frequency: autoDebateFrequency,
          notifications_enabled: notificationsEnabled,
          alert_channel: alertChannel,
          cooldown_hours: parseInt(cooldownHours, 10) || 24,
          display_mode: displayMode,
          max_daily_trades: maxDailyTrades,
          hard_stop_time: hardStopTime,
          somatic_thermal_reset: somaticThermalReset,
          debt_decompression: debtDecompression,
          supervisor_contact: supervisorContact,
          custom_containment_msg: customContainmentMsg,
          debate_rounds: debateRounds,
          debate_rigor: debateRigor
        },
        telegram_config: {
          bot_token: telegramBotToken,
          chat_id: telegramChatId,
          alert_losses: telegramAlertLosses,
          alert_reports: telegramAlertReports,
          alert_debates: telegramAlertDebates
        }
      };

      const { error } = await firebaseClient
        .from('profiles')
        .update({
          app_config: nextConfig,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      alert("¡Ajustes de los agentes guardados con éxito! El puente local se reconfigurará automáticamente en su siguiente ciclo.");
      if (onProfileUpdated) onProfileUpdated({ ...profile, app_config: nextConfig });
    } catch (err) {
      alert("Error al guardar configuración: " + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleForceExecuteTask = async (taskId) => {
    try {
      const { error } = await firebaseClient
        .from('agent_tasks')
        .update({
          status: 'pending',
          scheduled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;
      alert("¡Tarea forzada con éxito! El puente local la procesará de inmediato.");
      fetchTasks();
    } catch (err) {
      alert("Error al forzar la tarea: " + err.message);
    }
  };

  const handleTestTelegramConnection = async () => {
    if (!telegramBotToken || !telegramChatId) {
      setTelegramTestResult({ success: false, message: "Introduce el Token del Bot y el ID del Chat antes de realizar la prueba." });
      return;
    }
    setTestingTelegram(true);
    setTelegramTestResult(null);
    try {
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: `🔌 <b>Prueba de Conexión de Ánquer Clínica</b>\n\n¡Enhorabuena Emilio! La conexión con tu bot se ha establecido de forma exitosa.\n\nHora de verificación: ${new Date().toLocaleTimeString('es-ES')} (Local)\nURL del Portal: https://ancora-portal.web.app\n\n<i>Tus alertas y reportes llegarán a este chat.</i>`,
          parse_mode: 'HTML'
        })
      });
      
      const data = await response.json();
      if (data.ok) {
        setTelegramTestResult({ success: true, message: "¡Mensaje de prueba enviado con éxito! Comprueba tu Telegram." });
      } else {
        let errMsg = data.description || "Error desconocido.";
        if (errMsg.includes("bot can't send messages to the bot")) {
          errMsg = "Error 403 (Forbidden): Estás usando el username de tu bot (@elreydelmambot) como Chat ID. Un bot no se puede enviar mensajes a sí mismo. Debes ingresar tu ID numérico personal (puedes obtenerlo enviando cualquier mensaje a @userinfobot en Telegram) y asegurarte de enviar /start a tu bot para autorizarlo.";
        } else if (errMsg.includes("chat not found")) {
          errMsg = "Error 404 (Not Found): No se encontró el chat. Por favor, busca a tu bot en Telegram e inicia conversación con él enviándole el comando /start.";
        }
        setTelegramTestResult({ success: false, message: errMsg });
      }
    } catch (err) {
      setTelegramTestResult({ success: false, message: "Error de red al conectar con la API de Telegram: " + err.message });
    } finally {
      setTestingTelegram(false);
    }
  };

  const toggleAgentForDebate = (agentName) => {
    if (newDebateAgents.includes(agentName)) {
      if (newDebateAgents.length > 1) {
        setNewDebateAgents(newDebateAgents.filter(a => a !== agentName));
      }
    } else {
      setNewDebateAgents([...newDebateAgents, agentName]);
    }
  };

  const startEditAgent = (agent) => {
    setEditingAgent(agent);
    setEditAgentName(agent.name);
    setEditAgentRole(agent.role);
    setEditAgentDesc(agent.desc_text || '');
    setEditAgentColor(agent.color);
    setEditAgentIcon(agent.icon_name || 'Bot');
  };

  const handleUpdateAgent = async (e) => {
    e.preventDefault();
    if (!editingAgent || submittingAgent) return;
    setSubmittingAgent(true);
    try {
      const { error } = await firebaseClient
        .from('agents')
        .update({
          name: editAgentName,
          role: editAgentRole,
          desc_text: editAgentDesc,
          color: editAgentColor,
          icon_name: editAgentIcon
        })
        .eq('id', editingAgent.id);

      if (error) throw error;
      
      setEditingAgent(null);
      fetchAgents();
      // Recargar tareas para reflejar posibles cambios de nombres de agentes
      fetchTasks();
    } catch (err) {
      alert("Error al actualizar agente: " + err.message);
    } finally {
      setSubmittingAgent(false);
    }
  };

  const startEditTask = (task) => {
    setEditingTask(task);
    setEditTaskTitle(task.title);
    setEditTaskDesc(task.description);
    setEditTaskAgent(task.agent_name);
    
    let formattedDate = '';
    if (task.scheduled_at) {
      const date = new Date(task.scheduled_at);
      const tzOffset = date.getTimezoneOffset() * 60000;
      formattedDate = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    }
    setEditTaskScheduled(formattedDate);
    const recConfig = parseCronToUI(task.cron_expression);
    setEditTaskRecurrenceType(recConfig.type);
    setEditTaskRecurrenceTime(recConfig.time);
    setEditTaskRecurrenceDay(recConfig.day);
    setEditTaskRecurrenceInterval(recConfig.interval);
    setEditTaskCron(recConfig.customCron || '');
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    if (!editingTask || submittingEditTask) return;
    setSubmittingEditTask(true);
    try {
      const isRecurrent = editTaskRecurrenceType !== 'none';
      const cronExpr = (editTaskRecurrenceType === 'custom' ? editTaskCron : buildCronFromUI(editTaskRecurrenceType, editTaskRecurrenceTime, editTaskRecurrenceDay, editTaskRecurrenceInterval)) || null;

      const { error } = await firebaseClient
        .from('agent_tasks')
        .update({
          title: editTaskTitle,
          description: editTaskDesc,
          agent_name: editTaskAgent,
          status: 'pending',
          is_reprogrammed: false,
          scheduled_at: isRecurrent ? null : (editTaskScheduled ? new Date(editTaskScheduled).toISOString() : null),
          cron_expression: cronExpr,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTask.id);

      if (error) throw error;

      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      alert("Error al actualizar tarea: " + err.message);
    } finally {
      setSubmittingEditTask(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta tarea?")) return;
    try {
      const { error } = await firebaseClient
        .from('agent_tasks')
        .delete()
        .eq('id', taskId);
      
      if (error) throw error;
      fetchTasks();
    } catch (err) {
      alert("Error al eliminar la tarea: " + err.message);
    }
  };

  const handleForceRunTask = async (task) => {
    try {
      const { error } = await firebaseClient
        .from('agent_tasks')
        .update({
          scheduled_at: new Date().toISOString(),
          status: 'pending',
          is_reprogrammed: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;
      fetchTasks();
    } catch (err) {
      alert("Error al forzar la ejecución de la tarea: " + err.message);
    }
  };

  const handleSelectDay = (day) => {
    setSelectedCalendarDay(day);
    setCalendarCollapsed(true);
    if (setSidebarCollapsed) {
      setSidebarCollapsed(true);
    }
    setSelectedReportSection('all');
    
    // Si hay más de un informe para el día seleccionado, forzar la pantalla intermedia (-1)
    const dayTasks = getTasksForDay(day);
    if (dayTasks.length > 1) {
      setSelectedReportIndex(-1);
    } else {
      setSelectedReportIndex(0);
    }
  };

  const handleCloseReport = () => {
    setSelectedCalendarDay(null);
    setCalendarCollapsed(false);
    if (setSidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  };

  return (
    <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Sub Menu Navigation & Notification Center */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', position: 'relative' }}>
        <div className="sub-tabs-container" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setActiveTab('dashboard'); setSelectedDebate(null); }}
            className={`sub-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            🤖 Control de Agentes
          </button>
          <button
            onClick={() => { setActiveTab('scheduler'); setSelectedDebate(null); }}
            className={`sub-tab-btn ${activeTab === 'scheduler' ? 'active' : ''}`}
          >
            📅 Programar Tareas
          </button>
          <button
            onClick={() => { setActiveTab('calendar'); setSelectedCalendarDay(null); setSelectedDebate(null); }}
            className={`sub-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
          >
            📊 Calendario de Informes
          </button>
          <button
            onClick={() => setActiveTab('debate')}
            className={`sub-tab-btn ${activeTab === 'debate' ? 'active' : ''}`}
          >
            💬 Sala de Debate {selectedDebate && `(Activa)`}
          </button>
          <button
            onClick={() => { setActiveTab('settings'); setSelectedDebate(null); }}
            className={`sub-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          >
            ⚙️ Ajustes del Sistema
          </button>
        </div>

        {/* Bell de Notificaciones */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => {
              setShowNotificationPanel(!showNotificationPanel);
              fetchNotifications();
            }}
            className="btn btn-outline"
            style={{
              height: '38px',
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderColor: showNotificationPanel ? 'var(--color-cyan)' : 'var(--border)',
              background: showNotificationPanel ? 'rgba(6, 182, 212, 0.05)' : 'transparent',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              color: unreadCount > 0 ? 'var(--color-cyan)' : 'var(--text-secondary)'
            }}
            title="Centro de Notificaciones"
          >
            <span style={{ fontSize: '1rem', display: 'flex', alignItems: 'center' }}>
              {unreadCount > 0 ? '🔔' : '🔕'}
            </span>
            <span style={{ fontSize: '0.74rem' }}>Notificaciones</span>
            {unreadCount > 0 && (
              <span style={{
                background: 'var(--color-cyan)',
                color: '#050810',
                fontSize: '0.64rem',
                padding: '2px 6px',
                borderRadius: '10px',
                fontWeight: 900,
                boxShadow: '0 0 8px var(--color-cyan)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>
          
          {/* Panel Flotante Dropdown de Notificaciones */}
          {showNotificationPanel && (
            <div className="glass-panel" style={{
              position: 'absolute',
              right: 0,
              top: '44px',
              width: '320px',
              maxHeight: '400px',
              zIndex: 9999,
              padding: '16px',
              background: 'rgba(10, 15, 30, 0.98)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔔</span> Centro de Notificaciones
                </h4>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', fontSize: '0.64rem', cursor: 'pointer', fontWeight: 700, padding: 0 }}
                  >
                    Marcar todo leído
                  </button>
                )}
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {notifications.length === 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', color: 'var(--text-tertiary)', textAlign: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.5rem' }}>📭</span>
                    <span style={{ fontSize: '0.72rem' }}>Sin notificaciones recientes</span>
                  </div>
                ) : (
                  notifications.map(n => {
                    const isRead = readNotificationIds.includes(n.id);
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        style={{
                          padding: '10px',
                          background: isRead ? 'rgba(255,255,255,0.01)' : 'rgba(6, 182, 212, 0.05)',
                          border: `1px solid ${isRead ? 'rgba(255,255,255,0.04)' : 'rgba(6, 182, 212, 0.15)'}`,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                        className="conv-item-hover"
                      >
                        {!isRead && (
                          <span style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'var(--color-cyan)',
                            boxShadow: '0 0 6px var(--color-cyan)'
                          }} />
                        )}
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#ffffff' }}>
                          {n.title}
                        </span>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                          {n.desc}
                        </p>
                        <span style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', alignSelf: 'flex-end', marginTop: '2px' }}>
                          {n.time.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {n.time.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: DASHBOARD DE CONTROL DE AGENTES */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Banner de Estado de Conexión Local */}
          <div className="glass-panel" style={{
            padding: '16px 20px',
            background: 'linear-gradient(90deg, rgba(6, 182, 212, 0.05) 0%, rgba(5, 8, 16, 0.5) 100%)',
            border: '1px solid rgba(6, 182, 212, 0.15)',
            borderLeft: '4px solid var(--color-cyan)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div className="flex-center animate-pulse-soft" style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.15)',
                color: 'var(--color-cyan)'
              }}>
                <Activity size={18} />
              </div>
              <div>
                <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block', marginBottom: '2px' }}>
                  Puente Local Antigravity: Activo y Escuchando
                </strong>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: '1.35', display: 'block' }}>
                  El script local en tu terminal de Antigravity monitorea esta sesión en segundo plano. Los agentes resolverán las tareas pendientes al instante.
                </span>
              </div>
            </div>
            <span className="badge badge-cyan" style={{ fontSize: '0.55rem', padding: '4px 10px' }}>CONECTADO</span>
          </div>

          {/* Grid de Agentes Disponibles */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Agentes Disponibles en tu Sistema
            </h3>
            <div className="grid-2" style={{ gap: '16px' }}>
              {agents.map((agent) => {
                const AgentIcon = ICON_MAP[agent.icon_name] || Bot;
                const agentTasks = tasks.filter(t => t.agent_name === agent.name && !t.debate_id);
                const completedTasksCount = agentTasks.filter(t => t.status === 'completed').length;
                
                return (
                  <div key={agent.id} className="glass-panel conv-item-hover" style={{ padding: '20px', display: 'flex', gap: '16px', position: 'relative' }}>
                    <div className="flex-center" style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '10px',
                      background: `rgba(255, 255, 255, 0.02)`,
                      border: `1px solid var(--border)`,
                      color: agent.color,
                      flexShrink: 0
                    }}>
                      <AgentIcon size={22} />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                          {agent.name}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge" style={{ fontSize: '0.55rem', color: agent.color, borderColor: `${agent.color}33`, background: `${agent.color}0a` }}>
                            {agent.role}
                          </span>
                          <button
                            type="button"
                            onClick={() => startEditAgent(agent)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '4px'
                            }}
                            title="Editar Agente"
                            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 14px 0' }}>
                        {agent.desc_text}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.66rem', color: 'var(--text-tertiary)' }}>
                        <span>Tareas ejecutadas: <strong style={{ color: '#ffffff' }}>{agentTasks.length}</strong></span>
                        <span>Éxito: <strong style={{ color: 'var(--color-emerald)' }}>{completedTasksCount}</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Debates e Historial */}
          <div className="grid-2" style={{ gap: '16px' }}>
            
            {/* Lista de Debates */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0 }}>💬 Debates de Agentes en Curso</h3>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowDebateForm(!showDebateForm)}
                  style={{ height: '28px', fontSize: '0.68rem', padding: '0 10px', display: 'flex', gap: '4px', alignItems: 'center' }}
                >
                  <Plus size={12} />
                  <span>Nuevo Debate</span>
                </button>
              </div>

              {showDebateForm && (
                <form onSubmit={handleCreateDebate} className="glass-panel" style={{ padding: '16px', background: 'rgba(0,0,0,0.2)', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Tema o Título del Debate</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newDebateTitle}
                      onChange={(e) => setNewDebateTitle(e.target.value)}
                      placeholder="Ej: ¿Debo cerrar el trade si el volumen decae un 40%?"
                      required
                      style={{ height: '34px', fontSize: '0.76rem' }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.7rem' }}>Agentes Participantes</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                      {agents.map(agent => (
                        <button
                          key={agent.id}
                          type="button"
                          onClick={() => toggleAgentForDebate(agent.name)}
                          className={`btn ${newDebateAgents.includes(agent.name) ? 'btn-cyan' : 'btn-outline'}`}
                          style={{ height: '26px', fontSize: '0.65rem', padding: '0 8px' }}
                        >
                          {agent.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignSelf: 'flex-end' }}>
                    <button type="button" className="btn btn-outline" onClick={() => setShowDebateForm(false)} style={{ height: '30px', fontSize: '0.7rem' }}>Cancelar</button>
                    <button type="submit" className="btn btn-cyan" style={{ height: '30px', fontSize: '0.7rem' }} disabled={submittingDebate}>
                      {submittingDebate ? 'Iniciando...' : 'Iniciar'}
                    </button>
                  </div>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '280px' }}>
                {loadingDebates ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Cargando debates...</p>
                ) : debates.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>No hay debates iniciados.</p>
                ) : debates.map(d => (
                  <div
                    key={d.id}
                    onClick={() => { setSelectedDebate(d); setActiveTab('debate'); }}
                    className="conv-item-hover"
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>{d.title}</h4>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                          {new Date(d.created_at).toLocaleDateString('es-ES')}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {d.agents.map(a => (
                            <span key={a} style={{ fontSize: '0.55rem', background: 'rgba(255,255,255,0.04)', padding: '1px 5px', borderRadius: '3px', color: 'var(--text-secondary)' }}>{a}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className={`badge ${d.status === 'active' ? 'badge-cyan animate-pulse-soft' : 'badge-emerald'}`} style={{ fontSize: '0.55rem' }}>
                      {d.status === 'active' ? 'Debatiendo' : 'Concluido'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Micro historial de tareas recientes */}
            <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: '16px' }}>📅 Tareas Recientes de Agentes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '280px' }}>
                {loadingTasks ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Cargando tareas...</p>
                ) : tasks.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '20px' }}>No hay tareas programadas.</p>
                ) : tasks.slice(0, 5).map(t => (
                  <div
                    key={t.id}
                    onClick={() => {
                      if (t.status === 'completed') {
                        setSelectedTaskForConsole(t);
                      }
                    }}
                    className="conv-item-hover"
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.01)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      cursor: t.status === 'completed' ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0' }}>{t.title}</h4>
                      <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)' }}>
                        Agente: <strong style={{ color: '#ffffff' }}>{t.agent_name}</strong> · {new Date(t.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${
                        t.status === 'completed' ? 'badge-emerald' : 
                        t.status === 'running' ? 'badge-cyan animate-pulse-soft' : 
                        t.status === 'failed' ? 'badge-rose' : 'badge-tertiary'
                      }`} style={{ fontSize: '0.55rem' }}>
                        {t.status === 'completed' ? 'Completado' : 
                         t.status === 'running' ? 'Ejecutando' : 
                         t.status === 'failed' ? 'Error' : 'Pendiente'}
                      </span>
                      {t.status === 'completed' && <Terminal size={14} color="var(--color-cyan)" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Consola interactiva para ver resultados de tareas */}
          {selectedTaskForConsole && (
            <div className="glass-panel" style={{ padding: '20px', border: '1px solid var(--color-cyan)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Terminal size={18} color="var(--color-cyan)" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>Consola de Antigravity: {selectedTaskForConsole.title}</span>
                </div>
                <button
                  className="btn btn-outline"
                  onClick={() => setSelectedTaskForConsole(null)}
                  style={{ height: '24px', fontSize: '0.65rem', padding: '0 8px' }}
                >
                  Cerrar Consola
                </button>
              </div>
              <div style={{
                background: '#040711',
                border: '1px solid rgba(255,255,255,0.05)',
                padding: '14px',
                borderRadius: '6px',
                fontFamily: 'monospace',
                fontSize: '0.74rem',
                lineHeight: 1.5,
                color: 'var(--color-cyan)',
                whiteSpace: 'pre-wrap',
                maxHeight: '260px',
                overflowY: 'auto'
              }}>
                {selectedTaskForConsole.result || 'Sin salida.'}
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: PROGRAMADOR DE TAREAS (SCHEDULER) */}
      {activeTab === 'scheduler' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>📅 Programar Tareas de Agentes</h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Asigna consultas científicas, monitoreos o screenings a tus agentes de Antigravity locales de forma periódica o puntual.
                </p>
              </div>
              <button
                className="btn btn-cyan flex-center"
                onClick={() => setShowTaskForm(!showTaskForm)}
                style={{ gap: '6px', height: '36px', padding: '0 16px', fontSize: '0.78rem', fontWeight: 700 }}
              >
                <Plus size={16} />
                <span>Programar Tarea</span>
              </button>
            </div>

            {showTaskForm && (
              <form onSubmit={handleCreateTask} className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
                <div className="grid-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Título de la Tarea</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="Ej: Análisis de Cortisol y Trading"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Agente Asignado</label>
                    <select
                      className="form-input"
                      value={newTaskAgent}
                      onChange={(e) => setNewTaskAgent(e.target.value)}
                      style={{ background: '#050810', color: '#ffffff' }}
                    >
                      {agents.map(a => (
                        <option key={a.id} value={a.name}>{a.name} ({a.role})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Instrucción / Prompt detallado de la tarea</label>
                  <textarea
                    className="form-input"
                    rows="4"
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    placeholder="Describe con precisión qué debe hacer el agente en local. Ej: Extrae la correlación entre mi nivel de ansiedad del diario y las horas de descanso registradas..."
                    required
                    style={{ resize: 'none' }}
                  />
                </div>

                <div className="grid-2" style={{ gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Ejecución Programada (Un único disparo - Opcional)</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={newTaskScheduled}
                      onChange={(e) => setNewTaskScheduled(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label className="form-label">Frecuencia de Repetición (Recurrente)</label>
                    <select
                      className="form-input"
                      value={newTaskRecurrenceType}
                      onChange={(e) => setNewTaskRecurrenceType(e.target.value)}
                      style={{ background: '#050810', color: '#ffffff' }}
                    >
                      <option value="none">No se repite (Única vez)</option>
                      <option value="daily">Diariamente</option>
                      <option value="weekdays">Días laborables (Lunes a Viernes)</option>
                      <option value="weekly">Semanalmente (Una vez por semana)</option>
                      <option value="hourly">Frecuencia por horas (Varias veces al día)</option>
                      <option value="custom">Personalizado (Cron manual / natural)</option>
                    </select>

                    {newTaskRecurrenceType !== 'none' && newTaskRecurrenceType !== 'custom' && (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '8px', flexWrap: 'wrap' }}>
                        {newTaskRecurrenceType !== 'hourly' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Hora</span>
                            <input
                              type="time"
                              className="form-input"
                              value={newTaskRecurrenceTime}
                              onChange={(e) => setNewTaskRecurrenceTime(e.target.value)}
                              style={{ width: '100px', height: '32px', padding: '0 8px', fontSize: '0.74rem', background: '#050810', color: '#ffffff', margin: 0 }}
                            />
                          </div>
                        )}

                        {newTaskRecurrenceType === 'weekly' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Día de la semana</span>
                            <select
                              className="form-input"
                              value={newTaskRecurrenceDay}
                              onChange={(e) => setNewTaskRecurrenceDay(e.target.value)}
                              style={{ width: '120px', height: '32px', padding: '0 8px', fontSize: '0.74rem', background: '#050810', color: '#ffffff', margin: 0 }}
                            >
                              <option value="1">Lunes</option>
                              <option value="2">Martes</option>
                              <option value="3">Miércoles</option>
                              <option value="4">Jueves</option>
                              <option value="5">Viernes</option>
                              <option value="6">Sábado</option>
                              <option value="0">Domingo</option>
                            </select>
                          </div>
                        )}

                        {newTaskRecurrenceType === 'hourly' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Repetir cada</span>
                            <select
                              className="form-input"
                              value={newTaskRecurrenceInterval}
                              onChange={(e) => setNewTaskRecurrenceInterval(e.target.value)}
                              style={{ width: '130px', height: '32px', padding: '0 8px', fontSize: '0.74rem', background: '#050810', color: '#ffffff', margin: 0 }}
                            >
                              <option value="1">1 hora</option>
                              <option value="2">2 horas</option>
                              <option value="3">3 horas</option>
                              <option value="4">4 horas</option>
                              <option value="6">6 horas</option>
                              <option value="8">8 horas</option>
                              <option value="12">12 horas</option>
                            </select>
                          </div>
                        )}
                        
                        <div style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center' }}>
                          <span>
                            Sintaxis cron: <code style={{ color: 'var(--color-cyan)', fontFamily: 'monospace' }}>
                              {buildCronFromUI(newTaskRecurrenceType, newTaskRecurrenceTime, newTaskRecurrenceDay, newTaskRecurrenceInterval)}
                            </code>
                          </span>
                        </div>
                      </div>
                    )}

                    {newTaskRecurrenceType === 'custom' && (
                      <div style={{ marginTop: '4px' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={newTaskCron}
                          onChange={(e) => setNewTaskCron(e.target.value)}
                          placeholder="Ej: 0 9 * * 1-5"
                          style={{ margin: 0 }}
                        />
                        <span style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                          Escribe tu cron manual o lenguaje amigable (ej: "lunes a viernes").
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowTaskForm(false)} style={{ height: '38px' }}>Cancelar</button>
                  <button type="submit" className="btn btn-cyan" style={{ height: '38px' }} disabled={submittingTask}>
                    {submittingTask ? 'Programando...' : 'Programar en Áncora'}
                  </button>
                </div>
              </form>
            )}

            {/* Listado de todas las tareas del Scheduler */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(() => {
                const schedulerTasks = tasks.filter(t => !t.debate_id && !(t.cron_expression && t.is_reprogrammed));
                if (schedulerTasks.length === 0) {
                  return (
                    <div style={{ padding: '40px 20px', textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)', color: 'var(--text-tertiary)' }}>
                      <Calendar size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                      <p style={{ fontSize: '0.8rem', margin: 0 }}>No hay tareas registradas en el programador.</p>
                    </div>
                  );
                }
                return schedulerTasks.map(t => (
                  <div
                    key={t.id}
                    style={{
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.015)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.86rem', color: '#ffffff' }}>{t.title}</strong>
                        <span className={`badge ${
                          t.status === 'completed' ? 'badge-emerald' : 
                          t.status === 'running' ? 'badge-cyan animate-pulse-soft' : 
                          t.status === 'failed' ? 'badge-rose' : 'badge-tertiary'
                        }`} style={{ fontSize: '0.55rem' }}>
                          {t.status === 'completed' ? 'Completado' : 
                           t.status === 'running' ? 'Ejecutando' : 
                           t.status === 'failed' ? 'Error' : 'Pendiente'}
                        </span>
                        
                        {t.cron_expression && (
                          <span className="badge badge-cyan" style={{ fontSize: '0.55rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={10} />
                            Recurrente: {t.cron_expression}
                          </span>
                        )}

                        {t.scheduled_at && (
                          <span className="badge badge-emerald" style={{ fontSize: '0.55rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar size={10} />
                            Programado: {new Date(t.scheduled_at).toLocaleString('es-ES')}
                          </span>
                        )}
                      </div>
                      
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                        {t.description}
                      </p>
                      
                      <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
                        Asignado a: <strong style={{ color: '#ffffff' }}>{t.agent_name}</strong> · ID: {t.id} · Creado el {new Date(t.created_at).toLocaleString('es-ES')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                      {t.status === 'completed' && (
                        <button
                          className="btn btn-outline flex-center"
                          onClick={() => setSelectedTaskForConsole(t)}
                          style={{ height: '32px', fontSize: '0.7rem', padding: '0 10px', gap: '6px' }}
                        >
                          <Terminal size={14} />
                          <span>Ver Consola</span>
                        </button>
                      )}

                      {t.status !== 'running' && (
                        <button
                          className="btn btn-outline flex-center"
                          onClick={() => handleForceRunTask(t)}
                          style={{ height: '32px', fontSize: '0.7rem', padding: '0 10px', gap: '6px', color: 'var(--color-cyan)', borderColor: 'rgba(6, 182, 212, 0.2)' }}
                          title="Ejecutar Tarea Inmediatamente"
                        >
                          <Play size={14} />
                          <span>Ejecutar Ya</span>
                        </button>
                      )}
                      
                      <button
                        className="btn btn-outline flex-center"
                        onClick={() => startEditTask(t)}
                        style={{ height: '32px', width: '32px', padding: 0, justifyContent: 'center' }}
                        title="Editar Tarea"
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        className="btn btn-outline flex-center"
                        onClick={() => handleDeleteTask(t.id)}
                        style={{ height: '32px', width: '32px', padding: 0, justifyContent: 'center', color: 'var(--color-rose)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
                        title="Eliminar Tarea"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

        </div>
      )}

                  {/* TAB 4: CALENDARIO DE INFORMES */}
      {activeTab === 'calendar' && (() => {
        const year = calendarDate.getFullYear();
        const month = calendarDate.getMonth();
        const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        
        const firstDayOfMonth = new Date(year, month, 1);
        let startDayOfWeek = firstDayOfMonth.getDay() - 1;
        if (startDayOfWeek === -1) startDayOfWeek = 6;
        
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const calendarCells = [];
        for (let i = 0; i < startDayOfWeek; i++) {
          calendarCells.push(null);
        }
        for (let d = 1; d <= daysInMonth; d++) {
          calendarCells.push(new Date(year, month, d));
        }
        
        const completedTasks = tasks.filter(t => t.status === 'completed' && !t.debate_id);
        
        const getTasksForDay = (dateObj) => {
          if (!dateObj) return [];
          return completedTasks.filter(t => {
            const taskDate = new Date(t.created_at || t.updated_at);
            return taskDate.getDate() === dateObj.getDate() &&
                   taskDate.getMonth() === dateObj.getMonth() &&
                   taskDate.getFullYear() === dateObj.getFullYear();
          });
        };
        
        const handlePrevMonth = () => {
          setCalendarDate(new Date(year, month - 1, 1));
          setSelectedCalendarDay(null);
        };
        
        const handleNextMonth = () => {
          setCalendarDate(new Date(year, month + 1, 1));
          setSelectedCalendarDay(null);
        };
        
        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        const selectedTasks = selectedCalendarDay ? getTasksForDay(selectedCalendarDay) : [];
        const selectedDayLabel = selectedCalendarDay ? selectedCalendarDay.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Contenedor flexible horizontal para permitir colapso completo y ver el informe bien */}
            <div style={{ display: 'flex', gap: '24px', alignItems: 'start', flexWrap: 'nowrap', width: '100%' }}>
              
              {/* Bloque del Calendario (Lateral Compacto o Colapsado) */}
              {!calendarCollapsed ? (
                <div className="glass-panel" style={{ padding: '20px', flex: '0 0 320px', maxWidth: '320px', minWidth: '280px', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      📅 Historial
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={handlePrevMonth} className="btn btn-outline" style={{ height: '26px', width: '26px', padding: 0 }}>&lt;</button>
                      <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff', minWidth: '70px', textAlign: 'center' }}>
                        {monthNames[month]} {year}
                      </span>
                      <button onClick={handleNextMonth} className="btn btn-outline" style={{ height: '26px', width: '26px', padding: 0 }}>&gt;</button>
                    </div>
                  </div>

                  {/* Días de la semana cabecera */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginBottom: '8px' }}>
                    {weekDays.map(wd => (
                      <span key={wd} style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase' }}>{wd}</span>
                    ))}
                  </div>

                  {/* Cuadrícula de días con alturas y anchos regulares */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                    {calendarCells.map((day, cellIdx) => {
                      if (!day) return <div key={`empty-${cellIdx}`} style={{ height: '48px', width: '100%', opacity: 0 }} />;
                      
                      const dayTasks = getTasksForDay(day);
                      const hasTasks = dayTasks.length > 0;
                      const isSelected = selectedCalendarDay && 
                                        day.getDate() === selectedCalendarDay.getDate() &&
                                        day.getMonth() === selectedCalendarDay.getMonth() &&
                                        day.getFullYear() === selectedCalendarDay.getFullYear();
                      
                      const isToday = new Date().getDate() === day.getDate() &&
                                      new Date().getMonth() === day.getMonth() &&
                                      new Date().getFullYear() === day.getFullYear();

                      return (
                        <div
                          key={`day-${day.getDate()}`}
                          onClick={() => hasTasks && handleSelectDay(day)}
                          className="conv-item-hover"
                          style={{
                            height: '48px',
                            width: '100%',
                            background: isSelected 
                              ? 'rgba(6, 182, 212, 0.1)' 
                              : isToday 
                                ? 'rgba(255, 255, 255, 0.03)' 
                                : 'rgba(255, 255, 255, 0.005)',
                            border: isSelected 
                              ? '1px solid var(--color-cyan)' 
                              : isToday 
                                ? '1px solid rgba(255, 255, 255, 0.2)' 
                                : '1px solid var(--border)',
                            borderRadius: '6px',
                            padding: '4px',
                            cursor: hasTasks ? 'pointer' : 'default',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                            opacity: hasTasks ? 1 : 0.45
                          }}
                        >
                          <span style={{ 
                            fontSize: '0.7rem', 
                            fontWeight: isSelected || isToday ? 800 : 500, 
                            color: isSelected ? 'var(--color-cyan)' : '#ffffff',
                            lineHeight: '1'
                          }}>
                            {day.getDate()}
                          </span>
                          
                          {/* Indicadores de agentes con micro-iconos */}
                          <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '2px', justifyContent: 'flex-start' }}>
                            {dayTasks.map(t => {
                              const agentPreset = agents.find(a => a.name === t.agent_name);
                              const agentColor = agentPreset?.color || 'var(--color-cyan)';
                              const AgentIcon = ICON_MAP[agentPreset?.icon_name] || Bot;
                              return (
                                <div
                                  key={t.id}
                                  className="flex-center"
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '2px',
                                    background: `${agentColor}15`,
                                    color: agentColor,
                                    border: `1px solid ${agentColor}22`
                                  }}
                                  title={`${t.agent_name}: ${t.title}`}
                                >
                                  <AgentIcon size={7} />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Leyenda del Calendario */}
                  <div style={{
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Leyenda de Tareas
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 10px' }}>
                      {agents.map(agent => {
                        const AgentIcon = ICON_MAP[agent.icon_name] || Bot;
                        return (
                          <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <div className="flex-center" style={{
                              width: '14px',
                              height: '14px',
                              borderRadius: '3px',
                              background: `${agent.color}15`,
                              color: agent.color,
                              border: `1px solid ${agent.color}20`,
                              flexShrink: 0
                            }}>
                              <AgentIcon size={8} />
                            </div>
                            <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                              {agent.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="glass-panel conv-item-hover flex-center" 
                  onClick={() => { setCalendarCollapsed(false); if (setSidebarCollapsed) setSidebarCollapsed(false); }}
                  style={{ 
                    width: '45px', 
                    padding: '20px 8px', 
                    flex: '0 0 45px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    gap: '16px', 
                    transition: 'all 0.3s ease',
                    border: '1px solid var(--color-cyan)',
                    background: 'rgba(6, 182, 212, 0.05)',
                    borderRadius: '8px'
                  }}
                  title="Expandir Calendario"
                >
                  <Calendar size={18} color="var(--color-cyan)" />
                  <div style={{
                    writingMode: 'vertical-rl',
                    textTransform: 'uppercase',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: 'var(--color-cyan)',
                    whiteSpace: 'nowrap'
                  }}>
                    MOSTRAR CALENDARIO
                  </div>
                </div>
              )}

              {/* Bloque de Detalle e Informe (Ancho Flexible y Amplio) */}
              <div className="glass-panel" style={{ padding: '24px', flex: '1 1 450px', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '450px' }}>
                {!selectedCalendarDay ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: 'var(--text-secondary)', padding: '40px 0' }}>
                    <Calendar size={36} color="var(--text-tertiary)" style={{ marginBottom: '12px' }} />
                    <h4 style={{ fontSize: '0.86rem', color: '#ffffff', margin: 0 }}>Visualizador de Informes Diarios</h4>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'center', maxWidth: '240px' }}>
                      Selecciona un día en el calendario que contenga indicadores para desplegar su infografía comparativa.
                    </p>
                  </div>
                ) : selectedReportIndex === -1 && selectedTasks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                      <div>
                        <span className="badge badge-cyan" style={{ fontSize: '0.55rem', padding: '3px 8px', textTransform: 'uppercase' }}>Informes Diarios</span>
                        <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: '4px 0 0 0', textTransform: 'capitalize' }}>
                          {selectedDayLabel}
                        </h3>
                      </div>
                      <button 
                        onClick={handleCloseReport}
                        className="btn btn-outline" 
                        style={{ height: '30px', fontSize: '0.68rem', padding: '0 12px' }}
                      >
                        ← Volver al Calendario
                      </button>
                    </div>

                    <div style={{
                      textAlign: 'center',
                      color: 'var(--text-secondary)',
                      fontSize: '0.78rem',
                      margin: '10px 0 6px 0',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <strong>📋 Se han encontrado {selectedTasks.length} informes para este día</strong>
                      <span>Selecciona cuál deseas visualizar a continuación:</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedTasks.map((task, tIdx) => {
                        const agentPreset = agents.find(a => a.name === task.agent_name);
                        const agentColor = agentPreset?.color || 'var(--color-cyan)';
                        const AgentIcon = ICON_MAP[agentPreset?.icon_name] || Bot;
                        const taskTime = new Date(task.updated_at || task.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                        
                        return (
                          <div
                            key={task.id}
                            onClick={() => setSelectedReportIndex(tIdx)}
                            className="conv-item-hover"
                            style={{
                              background: 'rgba(13, 20, 38, 0.4)',
                              border: '1px solid rgba(255, 255, 255, 0.04)',
                              borderLeft: `4px solid ${agentColor}`,
                              borderRadius: '12px',
                              padding: '16px 20px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '16px',
                              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                              <div className="flex-center" style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                background: `${agentColor}12`,
                                color: agentColor,
                                border: `1px solid ${agentColor}22`,
                                flexShrink: 0
                              }}>
                                <AgentIcon size={18} />
                              </div>
                              <div>
                                <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block', marginBottom: '2px' }}>
                                  {task.title}
                                </strong>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                                  Elaborado por <b>{task.agent_name}</b> a las <b>{taskTime}</b>
                                </span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {task.status === 'completed' ? (
                                <span className="badge badge-emerald" style={{ fontSize: '0.58rem', padding: '2px 8px' }}>Completado</span>
                              ) : (
                                <span className="badge badge-rose" style={{ fontSize: '0.58rem', padding: '2px 8px' }}>Error</span>
                              )}
                              <span style={{ fontSize: '0.8rem', color: agentColor, fontWeight: 800 }}>Ver →</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {selectedTasks.length > 1 && (
                          <button
                            onClick={() => setSelectedReportIndex(-1)}
                            className="btn btn-outline"
                            style={{ height: '28px', width: '28px', padding: 0, borderRadius: '6px', fontSize: '0.74rem' }}
                            title="Volver a la lista de informes"
                          >
                            ←
                          </button>
                        )}
                        <div>
                          <span className="badge badge-cyan" style={{ fontSize: '0.55rem', padding: '3px 8px', textTransform: 'uppercase' }}>Informe del Día</span>
                          <h3 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#ffffff', margin: '4px 0 0 0', textTransform: 'capitalize' }}>
                            {selectedDayLabel}
                          </h3>
                        </div>
                      </div>
                      
                      {/* Botón flotante para restaurar calendario y barra lateral */}
                      <button 
                        onClick={handleCloseReport}
                        className="btn btn-outline" 
                        style={{ height: '30px', fontSize: '0.68rem', padding: '0 12px', display: 'flex', gap: '4px', alignItems: 'center' }}
                      >
                        ✕ Cerrar
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingRight: '4px' }}>
                      
                      {/* Selector de informes cuando hay más de uno en el día seleccionado */}
                      {selectedTasks.length > 1 && (
                        <div style={{ 
                          display: 'flex', 
                          gap: '6px', 
                          marginBottom: '6px', 
                          borderBottom: '1px solid var(--border)', 
                          paddingBottom: '12px', 
                          overflowX: 'auto',
                          whiteSpace: 'nowrap'
                        }}>
                          {selectedTasks.map((task, tIdx) => {
                            const agentPreset = agents.find(a => a.name === task.agent_name);
                            const agentColor = agentPreset?.color || 'var(--color-cyan)';
                            const AgentIcon = ICON_MAP[agentPreset?.icon_name] || Bot;
                            const isActive = selectedReportIndex === tIdx;
                            return (
                              <button
                                key={task.id}
                                onClick={() => { setSelectedReportIndex(tIdx); setSelectedReportSection('all'); }}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                  background: isActive ? `${agentColor}18` : 'rgba(255,255,255,0.01)',
                                  borderColor: isActive ? agentColor : 'var(--border)',
                                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  border: '1px solid',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  transition: 'all 0.2s ease',
                                  outline: 'none'
                                }}
                              >
                                <Bot size={11} color={agentColor} />
                                <span>{task.title.replace('Iniciar Debate:', 'Debate:').substring(0, 32)}{task.title.length > 32 ? '...' : ''}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Renderizado de la ficha del informe activo */}
                      {(() => {
                        const activeTask = selectedTasks[selectedReportIndex] || selectedTasks[0];
                        if (!activeTask) return <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Sin informes para este día.</p>;
                        const agentPreset = agents.find(a => a.name === activeTask.agent_name);
                        const agentColor = agentPreset?.color || 'var(--color-cyan)';
                        const isDebate = activeTask.debate_id || activeTask.title.startsWith('Iniciar Debate:');
                        
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            
                            {/* Cabecera del Artículo */}
                            <div style={{
                              padding: '16px 20px',
                              background: `linear-gradient(135deg, ${agentColor}0d 0%, rgba(5, 8, 16, 0.4) 100%)`,
                              border: '1px solid var(--border)',
                              borderLeft: `4px solid ${agentColor}`,
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
                            }}>
                              <div>
                                <span style={{ fontSize: '0.58rem', color: agentColor, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '2px' }}>
                                  {isDebate ? 'SALA DE DEBATE CLÍNICO' : 'INFORME OPERATIVO DEL AGENTE'}
                                </span>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                                  {activeTask.title}
                                </h4>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                                  Elaborado por: <strong style={{ color: agentColor }}>{activeTask.agent_name}</strong>
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0 }}>
                                <span style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', display: 'block', fontFamily: 'monospace' }}>
                                  {new Date(activeTask.created_at || activeTask.updated_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="badge badge-cyan" style={{ fontSize: '0.5rem', marginTop: '4px', display: 'inline-block', padding: '1px 5px', color: agentColor, borderColor: `${agentColor}33`, background: `${agentColor}0c` }}>
                                  Completado
                                </span>
                              </div>
                            </div>

                            {/* Cuerpo del Artículo o Transcripción de Debate */}
                            {isDebate && activeReportDebateMessages.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{
                                  background: 'rgba(16, 185, 129, 0.04)',
                                  border: '1px solid rgba(16, 185, 129, 0.12)',
                                  borderRadius: '8px',
                                  padding: '12px 16px',
                                  fontSize: '0.72rem',
                                  color: '#ffffff',
                                  lineHeight: 1.4,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px'
                                }}>
                                  <MessageSquare size={16} color="var(--color-emerald)" />
                                  <span>
                                    <strong>Conclusiones del Debate:</strong> Transcripción en vivo del diálogo constructivo y el blindaje clínico consolidado entre los agentes.
                                  </span>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '420px', overflowY: 'auto', paddingRight: '4px', border: '1px solid var(--border)', padding: '16px', borderRadius: '8px', background: 'rgba(0,0,0,0.1)' }}>
                                  {activeReportDebateMessages.map((msg) => {
                                    const preset = agents.find(a => a.name === msg.agent_name);
                                    const color = preset?.color || 'var(--color-cyan)';
                                    return (
                                      <div key={msg.id} style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                                        <div className="flex-center" style={{
                                          width: '28px',
                                          height: '28px',
                                          borderRadius: '6px',
                                          background: `${color}15`,
                                          border: `1px solid ${color}25`,
                                          color: color,
                                          fontSize: '0.7rem',
                                          fontWeight: 800,
                                          flexShrink: 0
                                        }}>
                                          {msg.agent_name[0]}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                            <strong style={{ fontSize: '0.72rem', color: '#ffffff' }}>{msg.agent_name}</strong>
                                            <span style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)' }}>{new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                                          </div>
                                          <div style={{
                                            padding: '10px 12px',
                                            background: 'rgba(255, 255, 255, 0.01)',
                                            border: '1px solid var(--border)',
                                            borderLeft: `3px solid ${color}`,
                                            borderRadius: '0 8px 8px 8px',
                                            fontSize: '0.72rem',
                                            lineHeight: 1.4,
                                            color: 'var(--text-primary)',
                                            whiteSpace: 'pre-wrap'
                                          }}>
                                            {msg.message}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                {/* Acuerdo de contención de debate */}
                                <div style={{
                                  padding: '16px 20px',
                                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.03) 0%, rgba(5, 8, 16, 0.6) 100%)',
                                  border: '1px solid rgba(245, 158, 11, 0.15)',
                                  borderLeft: '4px solid #f59e0b',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Brain size={14} color="#f59e0b" />
                                    <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                      Protocolo de Contención Somático-Sistémico Consensuado
                                    </h4>
                                  </div>
                                  <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                                    {activeTask.result || "Protocolo de contención consolidado por los agentes."}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              /* Cuerpo del Artículo Estándar */
                              parseReportToVisualHTML(activeTask.result, agentColor, selectedReportSection, setSelectedReportSection)
                            )}
                            
                            {/* Pie de Firma / Autorización */}
                            <div style={{
                              borderTop: '1px solid var(--border)',
                              paddingTop: '16px',
                              marginTop: '10px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.64rem',
                              color: 'var(--text-tertiary)'
                            }}>
                              <span>ID de Auditoría: <span style={{ fontFamily: 'monospace' }}>{activeTask.id.substring(0, 8)}...</span></span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-emerald)' }} />
                                <span>Firma de Autorización del Agente</span>
                              </div>
                            </div>

                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        );
      })()}

{/* TAB 3: SALA DE DEBATES */}
      {activeTab === 'debate' && (
        <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: '460px', alignItems: 'stretch' }}>
          
          {/* Barra lateral de debates */}
          <div className="glass-panel" style={{ width: '260px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Historial de Debates</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
              {debates.map(d => (
                <div
                  key={d.id}
                  onClick={() => setSelectedDebate(d)}
                  style={{
                    padding: '10px 12px',
                    background: selectedDebate?.id === d.id ? 'rgba(6, 182, 212, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                    border: selectedDebate?.id === d.id ? '1px solid var(--color-cyan)' : '1px solid var(--border)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  className="conv-item-hover"
                >
                  <h4 style={{ fontSize: '0.76rem', fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</h4>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{new Date(d.created_at).toLocaleDateString('es-ES')}</span>
                </div>
              ))}
            </div>
          </div>

{/* Ventana de debate principal */}
          <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, minWidth: 0, position: 'relative', border: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(135deg, rgba(8, 13, 28, 0.95), rgba(15, 23, 42, 0.98))' }}>
            {selectedDebate ? (
              <>
                {/* Cabecera del debate */}
                <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>{selectedDebate.title}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)' }}>Participantes:</span>
                      {selectedDebate.agents.map(a => {
                        const preset = agents.find(ag => ag.name === a);
                        const col = preset?.color || 'var(--color-cyan)';
                        return (
                          <span key={a} style={{ fontSize: '0.6rem', background: `${col}12`, border: `1px solid ${col}25`, padding: '2px 8px', borderRadius: '4px', color: col, fontWeight: 700 }}>{a}</span>
                        );
                      })}
                    </div>
                  </div>
                  
                  <span className={`badge ${selectedDebate.status === 'active' ? 'badge-cyan animate-pulse-soft' : 'badge-emerald'}`} style={{ fontSize: '0.64rem', padding: '3px 10px', height: '22px', display: 'flex', alignItems: 'center', fontWeight: 800 }}>
                    {selectedDebate.status === 'active' ? '● Debate Activo' : '✓ Finalizado'}
                  </span>
                </div>

                {/* Mensajes del debate */}
                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '420px' }}>
                  {loadingMessages && debateMessages.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', gap: '10px' }}>
                      <RefreshCw size={24} className="animate-spin" color="var(--color-cyan)" />
                      <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Iniciando sala de debate...</p>
                    </div>
                  ) : debateMessages.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
                      <MessageSquare size={38} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                      <p style={{ fontSize: '0.82rem', margin: 0, color: '#ffffff', fontWeight: 700 }}>Esperando a que los agentes de Antigravity se conecten...</p>
                      <p style={{ fontSize: '0.7rem', marginTop: '6px', maxWidth: '280px', marginInline: 'auto' }}>El proceso se inicializa automáticamente desde tu terminal local.</p>
                    </div>
                  ) : (
                    debateMessages.map((msg) => {
                      const agentPreset = agents.find(a => a.name === msg.agent_name);
                      const agentColor = agentPreset?.color || 'var(--color-cyan)';
                      const isUser = msg.agent_name === 'Paciente (Emilio)';
                      const displayColor = isUser ? 'var(--color-cyan)' : agentColor;
                      
                      return (
                        <div key={msg.id} style={{ display: 'flex', gap: '14px', alignItems: 'start', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                          {!isUser && (
                            <div className="flex-center" style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: `${displayColor}18`,
                              border: `1px solid ${displayColor}33`,
                              color: displayColor,
                              fontSize: '0.78rem',
                              fontWeight: 900,
                              flexShrink: 0,
                              boxShadow: `0 0 8px ${displayColor}15`
                            }}>
                              {msg.agent_name[0]}
                            </div>
                          )}
                          
                          <div style={{ flex: 1, maxWidth: isUser ? '85%' : '80%', minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isUser ? displayColor : '#ffffff' }}>{msg.agent_name}</span>
                                <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>{new Date(msg.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              {/* Botón de elegir propuesta en mensajes de agentes (no del Paciente) y si no está ya completado */}
                              {!isUser && selectedDebate.status !== 'completed' && (
                                <button
                                  onClick={() => handleSelectSolution(`[Propuesta de ${msg.agent_name}]: ${msg.message}`)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-emerald)',
                                    cursor: 'pointer',
                                    fontSize: '0.64rem',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    transition: 'all 0.2s',
                                    border: '1px solid rgba(16, 185, 129, 0.2)',
                                    background: 'rgba(16, 185, 129, 0.05)'
                                  }}
                                  className="conv-item-hover"
                                  title="Marcar este aporte como la solución consensuada definitiva"
                                >
                                  <CheckCircle2 size={11} color="var(--color-emerald)" />
                                  <span>Elegir Solución</span>
                                </button>
                              )}
                            </div>
                            
                            <div style={{
                              padding: '14px 16px',
                              background: isUser ? 'rgba(6, 182, 212, 0.06)' : 'rgba(255, 255, 255, 0.01)',
                              border: '1px solid var(--border)',
                              borderLeft: `3px solid ${displayColor}`,
                              borderRadius: isUser ? '8px 0 8px 8px' : '0 8px 8px 8px',
                              fontSize: '0.8rem',
                              lineHeight: 1.5,
                              color: 'var(--text-primary)',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {renderDebateMessageText(msg.message)}
                            </div>
                          </div>

                          {isUser && (
                            <div className="flex-center" style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '8px',
                              background: `${displayColor}18`,
                              border: `1px solid ${displayColor}33`,
                              color: displayColor,
                              fontSize: '0.78rem',
                              fontWeight: 900,
                              flexShrink: 0,
                              boxShadow: `0 0 8px ${displayColor}15`
                            }}>
                              E
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                  <div ref={messageEndRef} />
                </div>

                {/* Conclusión del debate */}
                {selectedDebate.conclusion && (
                  <div style={{ 
                    padding: '20px 24px', 
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(5, 8, 16, 0.5) 100%)', 
                    borderTop: '1px solid rgba(16, 185, 129, 0.15)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '8px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-emerald)' }}>
                      <CheckCircle2 size={16} style={{ filter: 'drop-shadow(0 0 4px var(--color-emerald))' }} />
                      <strong style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800 }}>🏆 Acuerdo Clínico Consensuado Seleccionado</strong>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#ffffff', lineHeight: 1.55, margin: 0, fontStyle: 'italic', background: 'rgba(255,255,255,0.01)', padding: '12px', borderLeft: '3px solid var(--color-emerald)', borderRadius: '0 6px 6px 0' }}>
                      "{selectedDebate.conclusion}"
                    </p>
                  </div>
                )}

                {/* Acciones de Control de Debate */}
                {selectedDebate.status === 'completed' ? (
                  <div style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(3, 5, 12, 0.5)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '12px',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                      ¿El resultado es mejorable? Puedes reabrir la discusión o insistir en el análisis crítico.
                    </span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={handleInsistDebate}
                        className="btn btn-outline"
                        style={{ height: '34px', fontSize: '0.74rem', padding: '0 16px', display: 'flex', gap: '6px', alignItems: 'center', fontWeight: 700 }}
                        disabled={loadingInsist}
                      >
                        <RefreshCw size={12} className={loadingInsist ? "animate-spin" : ""} />
                        <span>🔄 Insistir y Profundizar</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Formulario de Chat / Intervención del Paciente en Vivo */
                  <div style={{ borderTop: '1px solid var(--border)', background: 'rgba(5, 8, 16, 0.5)', padding: '16px' }}>
                    {/* Previsualización de imagen seleccionada */}
                    {debateImageBase64 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '12px', width: 'fit-content' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                          <img src={debateImageBase64} alt="Previsualización" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Imagen adjunta lista para enviar al debate</span>
                        <button
                          type="button"
                          onClick={() => setDebateImageBase64(null)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px', color: 'var(--color-rose)' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleSendUserMessageToDebate} className="chat-input-area" style={{ display: 'flex', gap: '10px', margin: 0, padding: 0, border: 'none', background: 'none' }}>
                      <input
                        type="file"
                        ref={debateFileInputRef}
                        accept="image/*"
                        onChange={handleDebateImageUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        onClick={() => debateFileInputRef.current?.click()}
                        className="btn btn-outline flex-center"
                        title="Adjuntar Imagen o Captura"
                        style={{ width: '46px', height: '46px', padding: 0, borderRadius: '8px', flexShrink: 0 }}
                      >
                        <Paperclip size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={handleDebateMicClick}
                        className={`btn ${debateIsRecording ? 'btn-danger animate-pulse-soft' : 'btn-outline'} flex-center`}
                        title={debateIsRecording ? "Grabando voz... Haz clic para transcribir" : "Dictar mensaje por voz"}
                        disabled={submittingDebateMessage || debateTranscribingAudio}
                        style={{
                          width: '46px',
                          height: '46px',
                          padding: 0,
                          borderRadius: '8px',
                          flexShrink: 0,
                          backgroundColor: debateIsRecording ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                          borderColor: debateIsRecording ? '#ef4444' : 'var(--border)',
                          color: debateIsRecording ? '#ef4444' : 'var(--text-secondary)',
                          position: 'relative'
                        }}
                      >
                        {debateIsRecording ? <MicOff size={18} /> : <Mic size={18} />}
                        {debateIsRecording && (
                          <span style={{
                            position: 'absolute',
                            top: '2px',
                            right: '2px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#ef4444',
                            animation: 'pulse 1s infinite'
                          }} />
                        )}
                      </button>

                      <textarea
                        ref={debateTextareaRef}
                        className="chat-input"
                        placeholder={debateTranscribingAudio ? "Transcribiendo audio..." : "Escribe tu consulta o intervención al debate (puedes pegar imágenes del portapapeles)..."}
                        value={debateTranscribingAudio ? "" : userDebateMessage}
                        onChange={(e) => setUserDebateMessage(e.target.value)}
                        onPaste={handleDebatePaste}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendUserMessageToDebate(e);
                          }
                        }}
                        disabled={submittingDebateMessage || debateTranscribingAudio}
                        style={{
                          flex: 1,
                          fontStyle: debateTranscribingAudio ? 'italic' : 'normal',
                          color: debateTranscribingAudio ? 'var(--color-cyan)' : 'var(--text-primary)',
                          background: 'rgba(3, 5, 12, 0.8)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          resize: 'none',
                          height: '46px',
                          minHeight: '46px',
                          maxHeight: '160px',
                          paddingTop: '12px',
                          paddingBottom: '12px',
                          paddingLeft: '16px',
                          paddingRight: '16px',
                          lineHeight: '1.4',
                          fontFamily: 'inherit',
                          overflowY: 'auto'
                        }}
                      />
                      
                      <button
                        type="submit"
                        className="btn btn-cyan animate-glow-cyan"
                        disabled={submittingDebateMessage || (!userDebateMessage.trim() && !debateImageBase64)}
                        style={{ width: '46px', height: '46px', padding: 0, borderRadius: '8px', flexShrink: 0 }}
                      >
                        <Send size={18} />
                      </button>
                    </form>
                  </div>
                )}
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                <Bot size={48} color="var(--text-tertiary)" style={{ marginBottom: '16px' }} />
                <h4 style={{ fontSize: '1rem', color: '#ffffff', margin: 0, fontWeight: 800 }}>Sala de Debate de Agentes</h4>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '4px', textAlign: 'center', maxWidth: '300px', lineHeight: 1.45 }}>
                  Selecciona un debate de la barra lateral o crea uno nuevo para ver a tus agentes cruzar ideas e interactuar con ellos.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: CONFIGURACIÓN DEL SISTEMA DE AGENTES (Estructura Premium por Sub-pestañas) */}
      {activeTab === 'settings' && (
        <div style={{ display: 'flex', gap: '24px', minHeight: '600px', flexWrap: 'wrap' }}>
          {/* Sidebar izquierdo de sub-tabs */}
          <div className="glass-panel" style={{ width: '260px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', border: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(135deg, rgba(8, 13, 28, 0.95), rgba(15, 23, 42, 0.98))', borderRadius: '16px', flexShrink: 0 }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px 0', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              Menú de Ajustes
            </h3>
            
            {[
              { id: 'trading', label: 'Blindaje Operativo', icon: <Shield size={16} />, desc: 'Límites, Cooldown y Ánquer' },
              { id: 'somatic', label: 'Control Somático', icon: <Brain size={16} />, desc: 'Cortisol y Risk Guard' },
              { id: 'debate', label: 'Debate Clínico', icon: <MessageSquare size={16} />, desc: 'Rondas y rigor de agentes' },
              { id: 'telegram', label: 'Telegram Bot', icon: <Bot size={16} />, desc: 'Token, Chat ID y pruebas' },
              { id: 'scheduler', label: 'Monitor de Tareas', icon: <Calendar size={16} />, desc: 'Programación en tiempo real' },
              { id: 'mini_app', label: 'Mini App & Simulador', icon: <Terminal size={16} />, desc: 'Instrucciones y simulación' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSettingsSubTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid',
                  textAlign: 'left',
                  cursor: 'pointer',
                  width: '100%',
                  borderColor: settingsSubTab === tab.id ? 'rgba(6, 182, 212, 0.3)' : 'transparent',
                  background: settingsSubTab === tab.id ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(15, 23, 42, 0.4))' : 'transparent',
                  color: settingsSubTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                  transition: 'all 0.2s ease'
                }}
                className={settingsSubTab !== tab.id ? 'conv-item-hover' : ''}
              >
                <div style={{ color: settingsSubTab === tab.id ? 'var(--color-cyan)' : 'var(--text-tertiary)' }}>
                  {tab.icon}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: settingsSubTab === tab.id ? 700 : 600 }}>{tab.label}</span>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', marginTop: '2px' }}>{tab.desc}</span>
                </div>
              </button>
            ))}

            <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '8px 12px', borderRadius: '20px', fontSize: '0.64rem', color: '#10b981', fontWeight: 600 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }}></span>
                <span>Puente Local Activo</span>
              </div>
            </div>
          </div>

          {/* Panel central de configuración */}
          <div style={{ flex: 1, minWidth: '320px' }}>
            <form onSubmit={handleSaveAgentsConfig} style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%' }}>
              <div className="glass-panel" style={{ padding: '30px', border: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(135deg, rgba(8, 13, 28, 0.95), rgba(15, 23, 42, 0.98))', borderRadius: '16px', minHeight: '520px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* SUB-TAB: BLINDAJE OPERATIVO */}
                  {settingsSubTab === 'trading' && (
                    <>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Shield size={18} color="var(--color-cyan)" />
                          <span>Blindaje Operativo de Ánquer</span>
                        </h3>
                        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
                          Configura la frecuencia de sondeo y las reglas de protección estrictas para tu operativa y mitigación de sobreoperativa.
                        </p>
                      </div>

                      <div className="grid-2" style={{ gap: '20px', marginTop: '10px' }}>
                        <div className="form-group" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
                          <label className="form-label" style={{ fontSize: '0.74rem', color: 'var(--color-cyan)', fontWeight: 700 }}>Intervalo de Sondeo del Puente (Segundos)</label>
                          <select
                            className="form-input"
                            value={pollingInterval}
                            onChange={(e) => setPollingInterval(e.target.value)}
                            style={{ background: '#050810', color: '#ffffff', marginTop: '8px' }}
                          >
                            <option value="2">2 segundos (Tiempo real ultra-rápido)</option>
                            <option value="5">5 segundos (Recomendado / Balanceado)</option>
                            <option value="10">10 segundos (Menor consumo de recursos)</option>
                            <option value="30">30 segundos (Moderado)</option>
                            <option value="60">60 segundos (Bajo impacto de red)</option>
                          </select>
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', marginTop: '6px', display: 'block', lineHeight: '1.3' }}>
                            Tiempo que el demonio local ("local_agent_bridge.cjs") tarda en procesar las tareas.
                          </span>
                        </div>

                        <div className="form-group" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
                          <label className="form-label" style={{ fontSize: '0.74rem', color: 'var(--color-rose)', fontWeight: 700 }}>Límite de Pérdida Diaria (Equity Killer)</label>
                          <select
                            className="form-input"
                            value={equityKillerLimit}
                            onChange={(e) => setEquityKillerLimit(e.target.value)}
                            style={{ background: '#050810', color: '#ffffff', marginTop: '8px' }}
                          >
                            <option value="1R">1R (Corte estricto tras 1 pérdida de riesgo)</option>
                            <option value="2R">2R (Corte moderado tras 2 pérdidas de riesgo)</option>
                            <option value="3R">3R (Máxima tolerancia permitida)</option>
                            <option value="50">50 USD (Stop de emergencia fijo)</option>
                            <option value="100">100 USD (Stop intermedio)</option>
                            <option value="200">200 USD (Stop amplio)</option>
                          </select>
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', marginTop: '6px', display: 'block', lineHeight: '1.3' }}>
                            Bloquea la operativa automáticamente si se alcanza este umbral de pérdida diaria.
                          </span>
                        </div>
                      </div>

                      <div className="grid-2" style={{ gap: '20px' }}>
                        <div className="form-group" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
                          <label className="form-label" style={{ fontSize: '0.74rem', color: '#ffffff', fontWeight: 700 }}>Bloqueo Temporal Diferido (Cooldown)</label>
                          <select
                            className="form-input"
                            value={cooldownHours}
                            onChange={(e) => setCooldownHours(e.target.value)}
                            style={{ background: '#050810', color: '#ffffff', marginTop: '8px' }}
                          >
                            <option value="12">12 horas (Bloqueo micro)</option>
                            <option value="24">24 horas (Un día completo de reset)</option>
                            <option value="48">48 horas (Fin de semana de enfriamiento)</option>
                            <option value="72">72 horas (Bloqueo profundo en crisis)</option>
                          </select>
                        </div>

                        <div className="form-group" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
                          <label className="form-label" style={{ fontSize: '0.74rem', color: '#ffffff', fontWeight: 700 }}>Límite de Operaciones Diarias</label>
                          <select
                            className="form-input"
                            value={maxDailyTrades}
                            onChange={(e) => setMaxDailyTrades(e.target.value)}
                            style={{ background: '#050810', color: '#ffffff', marginTop: '8px' }}
                          >
                            <option value="1">1 Trade máximo (Súper disciplinado)</option>
                            <option value="2">2 Trades máximos (Recomendado)</option>
                            <option value="3">3 Trades máximos (Límite sano)</option>
                            <option value="5">5 Trades máximos (Sobreoperativa latente)</option>
                            <option value="unlimited">Ilimitado (Sin bloqueo)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid-2" style={{ gap: '20px' }}>
                        <div className="form-group" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
                          <label className="form-label" style={{ fontSize: '0.74rem', color: '#ffffff', fontWeight: 700 }}>Hora de Corte Nocturno (Hard Stop)</label>
                          <select
                            className="form-input"
                            value={hardStopTime}
                            onChange={(e) => setHardStopTime(e.target.value)}
                            style={{ background: '#050810', color: '#ffffff', marginTop: '8px' }}
                          >
                            <option value="18:00">18:00 (Cierre tras jornada europea)</option>
                            <option value="20:00">20:00 (Antes del cierre americano)</option>
                            <option value="22:00">22:00 (Evitar fatiga nocturna)</option>
                            <option value="disabled">Desactivado (Sin corte por horario)</option>
                          </select>
                        </div>

                        <div className="form-group" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
                          <label className="form-label" style={{ fontSize: '0.74rem', color: '#ffffff', fontWeight: 700 }}>Modo de Visualización de Métricas</label>
                          <select
                            className="form-input"
                            value={displayMode}
                            onChange={(e) => setDisplayMode(e.target.value)}
                            style={{ background: '#050810', color: '#ffffff', marginTop: '8px' }}
                          >
                            <option value="pips_r">Pips y R (Ideal para mitigar escala)</option>
                            <option value="currency">Balance Monetario (€/USD)</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(6, 182, 212, 0.03)', border: '1px solid rgba(6, 182, 212, 0.12)', padding: '14px 18px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          id="chkBlindTrading"
                          checked={blindTrading}
                          onChange={(e) => setBlindTrading(e.target.checked)}
                          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                        <label htmlFor="chkBlindTrading" style={{ fontSize: '0.74rem', color: '#ffffff', cursor: 'pointer', fontWeight: 700 }}>
                          Trading Ciego Habilitado (Ocultar balances totales en tiempo real para evitar pánico y sesgos)
                        </label>
                      </div>
                    </>
                  )}

                  {/* SUB-TAB: CONTROL SOMÁTICO */}
                  {settingsSubTab === 'somatic' && (
                    <>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Brain size={18} color="#f59e0b" />
                          <span>Control Somático y Clínico (Risk Guard)</span>
                        </h3>
                        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
                          Configura los parámetros del Bio-feedback clínico para la regulación emocional y física ante pérdidas de trading.
                        </p>
                      </div>

                      <div className="grid-2" style={{ gap: '20px', marginTop: '10px' }}>
                        <div className="form-group" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
                          <label className="form-label" style={{ fontSize: '0.74rem', color: '#f59e0b', fontWeight: 700 }}>Umbral Crítico de Cortisol Estimado (%)</label>
                          <input
                            type="number"
                            min="40"
                            max="95"
                            className="form-input"
                            value={cortisolThreshold}
                            onChange={(e) => setCortisolThreshold(e.target.value)}
                            style={{ background: '#050810', color: '#ffffff', marginTop: '8px' }}
                          />
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', marginTop: '6px', display: 'block', lineHeight: '1.3' }}>
                            Porcentaje de estimulación fisiológica donde Risk Guard activará alarmas sonoras y notificaciones intensas.
                          </span>
                        </div>

                        <div className="form-group" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
                          <label className="form-label" style={{ fontSize: '0.74rem', color: '#ffffff', fontWeight: 700 }}>Frecuencia de Debate Clínico Automático</label>
                          <select
                            className="form-input"
                            value={autoDebateFrequency}
                            onChange={(e) => setAutoDebateFrequency(e.target.value)}
                            style={{ background: '#050810', color: '#ffffff', marginTop: '8px' }}
                          >
                            <option value="daily">Diario (Cada mañana al abrir mercado)</option>
                            <option value="post_operative">Tras Operativa (Cierre de día)</option>
                            <option value="weekly">Semanal (Fin de semana)</option>
                            <option value="never">Desactivado (Manual)</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
                        <label className="form-label" style={{ fontSize: '0.74rem', color: '#ffffff', fontWeight: 700 }}>Contacto del Supervisor Clínico / Tutor</label>
                        <input
                          type="text"
                          className="form-input"
                          value={supervisorContact}
                          onChange={(e) => setSupervisorContact(e.target.value)}
                          placeholder="Ej: @tutor_telegram o correo electrónico"
                          style={{ background: '#050810', color: '#ffffff', marginTop: '8px' }}
                        />
                        <span style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', marginTop: '6px', display: 'block' }}>
                          A quién alertar si se detectan reiterados bloqueos y estados de pánico sin respuesta.
                        </span>
                      </div>

                      <div className="form-group" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
                        <label className="form-label" style={{ fontSize: '0.74rem', color: '#ffffff', fontWeight: 700 }}>Mensaje de Contención Personalizado (Agitación/Estrés)</label>
                        <textarea
                          className="form-input"
                          value={customContainmentMsg}
                          onChange={(e) => setCustomContainmentMsg(e.target.value)}
                          style={{ background: '#050810', color: '#ffffff', fontSize: '0.74rem', minHeight: '70px', resize: 'vertical', marginTop: '8px', lineHeight: '1.4' }}
                          placeholder="Escribe lo que necesites leer cuando entres en pánico para forzar a tu amígdala a relajarse..."
                        />
                      </div>

                      <div className="grid-2" style={{ gap: '15px' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.12)', padding: '12px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            id="chkSomaticThermalReset"
                            checked={somaticThermalReset}
                            onChange={(e) => setSomaticThermalReset(e.target.checked)}
                            style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                          />
                          <label htmlFor="chkSomaticThermalReset" style={{ fontSize: '0.72rem', color: '#ffffff', cursor: 'pointer', fontWeight: 700 }}>
                            Sugerir Reset Térmico del Nervio Vago (Agua fría/hielo)
                          </label>
                        </div>

                        <div style={{ background: 'rgba(6, 182, 212, 0.03)', border: '1px solid rgba(6, 182, 212, 0.12)', padding: '12px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            id="chkDebtDecompression"
                            checked={debtDecompression}
                            onChange={(e) => setDebtDecompression(e.target.checked)}
                            style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                          />
                          <label htmlFor="chkDebtDecompression" style={{ fontSize: '0.72rem', color: '#ffffff', cursor: 'pointer', fontWeight: 700 }}>
                            Habilitar Descompresión Matemática de Deudas
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {/* SUB-TAB: DEBATE CLÍNICO */}
                  {settingsSubTab === 'debate' && (
                    <>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <MessageSquare size={18} color="var(--color-cyan)" />
                          <span>Parámetros de Debates Científicos</span>
                        </h3>
                        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
                          Configura la profundidad y el nivel de cuestionamiento racional empleado por tus agentes clínicos al auditar tus conductas operativas.
                        </p>
                      </div>

                      <div className="grid-2" style={{ gap: '20px', marginTop: '10px' }}>
                        <div className="form-group" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
                          <label className="form-label" style={{ fontSize: '0.74rem', color: '#ffffff', fontWeight: 700 }}>Número de Rondas de Discusión</label>
                          <select
                            className="form-input"
                            value={debateRounds}
                            onChange={(e) => setDebateRounds(e.target.value)}
                            style={{ background: '#050810', color: '#ffffff', marginTop: '8px' }}
                          >
                            <option value="1">1 Ronda (Respuesta rápida de un agente)</option>
                            <option value="2">2 Rondas (Debate estándar equilibrado)</option>
                            <option value="3">3 Rondas (Discusión profunda contrastada)</option>
                            <option value="5">5 Rondas (Examen exhaustivo multidireccional)</option>
                          </select>
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', marginTop: '6px', display: 'block', lineHeight: '1.3' }}>
                            Rondas totales de debate y réplica entre Ánquer, Risk Guard y Axi Coach antes de emitir la conclusión.
                          </span>
                        </div>

                        <div className="form-group" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
                          <label className="form-label" style={{ fontSize: '0.74rem', color: '#ffffff', fontWeight: 700 }}>Rigor Clínico de los Agentes</label>
                          <select
                            className="form-input"
                            value={debateRigor}
                            onChange={(e) => setDebateRigor(e.target.value)}
                            style={{ background: '#050810', color: '#ffffff', marginTop: '8px' }}
                          >
                            <option value="suave">Suave (Empático, compasivo y orientador)</option>
                            <option value="critico">Crítico (Cuestionamiento racional y lógico estándar)</option>
                            <option value="severo">Severo (Identificación estricta de distorsiones y sesgos)</option>
                            <option value="despiadado">Despiadado (Exposición directa y cruda de la irracionalidad para frenar pérdidas)</option>
                          </select>
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', marginTop: '6px', display: 'block', lineHeight: '1.3' }}>
                            Nivel de intensidad dialéctica y confrontación cognitiva de las conductas autodestructivas.
                          </span>
                        </div>
                      </div>

                      <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '14px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-emerald)' }}>💡 Nota sobre el Debate Clínico:</span>
                        <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                          El debate es una contención intelectual. Si se detecta un comportamiento de sobreoperativa o incumplimiento de tu plan, los agentes iniciarán un debate. Deberás leerlo y firmar un <b>acuerdo de cumplimiento</b> para poder desbloquear el portal.
                        </p>
                      </div>
                    </>
                  )}

                  {/* SUB-TAB: TELEGRAM BOT INTEGRATION */}
                  {settingsSubTab === 'telegram' && (
                    <>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Bot size={18} color="var(--color-cyan)" />
                          <span>Integración de Telegram Bot y Alertas Directas</span>
                        </h3>
                        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
                          Configura tu bot de Telegram para que te lleguen las alertas de pérdidas, las tareas pendientes y los links de acceso directo de forma inmediata.
                        </p>
                      </div>

                      {/* Advertencia si no es un chat ID numérico */}
                      {telegramChatId && !/^-?\d+$/.test(telegramChatId.trim()) && (
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '14px 18px', borderRadius: '10px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <AlertOctagon size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <strong style={{ fontSize: '0.76rem', color: '#f59e0b' }}>⚠️ Chat ID Inválido Detectado</strong>
                            <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                              Has ingresado <code>{telegramChatId}</code>. Telegram requiere un <b>ID numérico de chat</b> (ej: <code>987654321</code> o <code>-100123456789</code>) en lugar de un nombre de usuario (como <code>@elreydelmambot</code>).
                            </p>
                            <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.4 }}>
                              <b>Cómo solucionarlo:</b> Abre Telegram, busca al bot <b>@userinfobot</b> y envíale cualquier mensaje. Te responderá inmediatamente con tu <b>Id numérico</b> de usuario. Copia ese número y pégalo abajo. ¡Asegúrate también de haber enviado <code>/start</code> a tu propio bot!
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid-2" style={{ gap: '20px', marginTop: '10px' }}>
                        <div className="form-group" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
                          <label className="form-label" style={{ fontSize: '0.74rem', color: '#ffffff', fontWeight: 700 }}>Token del Bot de Telegram (HTTP API Token)</label>
                          <input
                            type="password"
                            className="form-input"
                            value={telegramBotToken}
                            onChange={(e) => setTelegramBotToken(e.target.value)}
                            placeholder="Ej: 8021173910:AAFsH..."
                            style={{ background: '#050810', color: '#ffffff', fontSize: '0.72rem', marginTop: '8px' }}
                          />
                        </div>

                        <div className="form-group" style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
                          <label className="form-label" style={{ fontSize: '0.74rem', color: '#ffffff', fontWeight: 700 }}>ID de Chat de Telegram (Chat ID Numérico)</label>
                          <input
                            type="text"
                            className="form-input"
                            value={telegramChatId}
                            onChange={(e) => setTelegramChatId(e.target.value)}
                            placeholder="Ej: 987654321"
                            style={{ background: '#050810', color: '#ffffff', fontSize: '0.72rem', marginTop: '8px' }}
                          />
                        </div>
                      </div>

                      {/* Suscripciones a notificaciones */}
                      <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px' }}>
                        <label className="form-label" style={{ fontSize: '0.74rem', color: '#ffffff', fontWeight: 700, marginBottom: '12px', display: 'block' }}>Eventos de Notificación en Móvil</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              id="chkTgAlertLosses"
                              checked={telegramAlertLosses}
                              onChange={(e) => setTelegramAlertLosses(e.target.checked)}
                              style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                            />
                            <label htmlFor="chkTgAlertLosses" style={{ fontSize: '0.72rem', color: '#ffffff', cursor: 'pointer', fontWeight: 600 }}>
                              Alertas de Pérdidas (Equity Killer)
                            </label>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              id="chkTgAlertReports"
                              checked={telegramAlertReports}
                              onChange={(e) => setTelegramAlertReports(e.target.checked)}
                              style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                            />
                            <label htmlFor="chkTgAlertReports" style={{ fontSize: '0.72rem', color: '#ffffff', cursor: 'pointer', fontWeight: 600 }}>
                              Alertas de Tareas y Alarma Diaria
                            </label>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                              type="checkbox"
                              id="chkTgAlertDebates"
                              checked={telegramAlertDebates}
                              onChange={(e) => setTelegramAlertDebates(e.target.checked)}
                              style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                            />
                            <label htmlFor="chkTgAlertDebates" style={{ fontSize: '0.72rem', color: '#ffffff', cursor: 'pointer', fontWeight: 600 }}>
                              Notificaciones de Debates Clínicos
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Botón y resultado de prueba */}
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', marginTop: '5px' }}>
                        <button
                          type="button"
                          onClick={handleTestTelegramConnection}
                          disabled={testingTelegram}
                          className="btn btn-outline"
                          style={{ height: '38px', fontSize: '0.74rem', padding: '0 16px', display: 'flex', gap: '8px', alignItems: 'center' }}
                        >
                          <span>{testingTelegram ? 'Probando...' : '🔌 Probar Conexión Directa'}</span>
                        </button>

                        {telegramTestResult && (
                          <div style={{
                            fontSize: '0.72rem',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            flex: 1,
                            background: telegramTestResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                            border: '1px solid ' + (telegramTestResult.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'),
                            color: telegramTestResult.success ? '#10b981' : '#f43f5e',
                            lineHeight: '1.3'
                          }}>
                            {telegramTestResult.message}
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* SUB-TAB: MONITOR DE SCHEDULER EN TIEMPO REAL */}
                  {settingsSubTab === 'scheduler' && (
                    <>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Calendar size={18} color="var(--color-cyan)" />
                          <span>Monitor del Scheduler y Tareas en Tiempo Real</span>
                        </h3>
                        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
                          Supervisa, filtra y audita cronológicamente la ejecución y la programación de todas tus tareas de agentes (excluyendo debates).
                        </p>
                      </div>

                      {/* Filtros y Buscador */}
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '10px', marginTop: '10px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {['all', 'pending', 'running', 'completed', 'failed'].map(f => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => setTaskMonitorFilter(f)}
                              style={{
                                padding: '6px 10px',
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                borderRadius: '10px',
                                border: '1px solid',
                                cursor: 'pointer',
                                borderColor: taskMonitorFilter === f ? 'var(--color-cyan)' : 'var(--border)',
                                background: taskMonitorFilter === f ? 'rgba(6, 182, 212, 0.08)' : 'transparent',
                                color: taskMonitorFilter === f ? '#ffffff' : 'var(--text-secondary)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em'
                              }}
                            >
                              {f === 'all' ? 'Todas' : f === 'pending' ? 'Programadas' : f === 'running' ? 'En Curso' : f === 'completed' ? 'Completas' : 'Fallidas'}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Filtrar por título, agente..."
                          value={taskMonitorSearch}
                          onChange={(e) => setTaskMonitorSearch(e.target.value)}
                          style={{ flex: 1, height: '30px', fontSize: '0.72rem', background: '#050810', color: '#ffffff', margin: 0 }}
                        />
                      </div>

                      {/* Listado Cronológico Vertical */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px', marginTop: '5px' }}>
                        {(() => {
                          const ordinaryTasks = tasks.filter(t => !t.debate_id);
                          const filtered = ordinaryTasks.filter(t => {
                            const matchesFilter = taskMonitorFilter === 'all' || t.status === taskMonitorFilter;
                            const searchStr = (t.title + ' ' + (t.description || '') + ' ' + (t.agent_name || '')).toLowerCase();
                            const matchesSearch = searchStr.includes(taskMonitorSearch.toLowerCase());
                            return matchesFilter && matchesSearch;
                          });

                          if (filtered.length === 0) {
                            return (
                              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.74rem' }}>
                                No se encontraron tareas registradas con los filtros aplicados.
                              </div>
                            );
                          }

                          return filtered.map(t => {
                            const isFuture = t.scheduled_at && new Date(t.scheduled_at) > new Date();
                            const badgeColor = t.status === 'completed' ? 'badge-emerald' : t.status === 'running' ? 'badge-cyan animate-pulse-soft' : t.status === 'failed' ? 'badge-rose' : (isFuture ? 'badge-cyan' : 'badge-tertiary');
                            const statusText = t.status === 'completed' ? 'Completado' : t.status === 'running' ? 'Ejecutando' : t.status === 'failed' ? 'Error' : (isFuture ? 'Programada' : 'Pendiente');

                            return (
                              <div
                                key={t.id}
                                style={{
                                  padding: '12px 16px',
                                  background: 'rgba(5, 8, 16, 0.4)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '10px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  gap: '16px'
                                }}
                                className="conv-item-hover"
                              >
                                <div style={{ minWidth: 0 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '0.58rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: '4px', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                                      {new Date(t.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                    <strong style={{ fontSize: '0.76rem', color: '#ffffff' }}>{t.title}</strong>
                                    <span className={'badge ' + badgeColor} style={{ fontSize: '0.55rem', padding: '2px 8px' }}>
                                      {statusText}
                                    </span>
                                    {t.scheduled_at && (
                                      <span style={{ fontSize: '0.64rem', color: isFuture ? 'var(--color-cyan)' : 'var(--text-tertiary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        ⏱️ {new Date(t.scheduled_at).toLocaleString('es-ES')}
                                      </span>
                                    )}
                                    {t.cron_expression && (
                                      <span style={{ fontSize: '0.58rem', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--color-cyan)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                                        🔄 {t.cron_expression}
                                      </span>
                                    )}
                                  </div>
                                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0 0 4px 0', lineHeight: 1.35 }}>
                                    {t.description}
                                  </p>
                                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>
                                    <span>Asignado a: <strong style={{ color: '#ffffff' }}>{t.agent_name}</strong></span>
                                    <span>·</span>
                                    <span>ID: {t.id}</span>
                                  </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                                  {(t.status === 'pending' || isFuture) && (
                                    <button
                                      type="button"
                                      className="btn btn-outline flex-center"
                                      onClick={() => handleForceExecuteTask(t.id)}
                                      style={{ height: '28px', fontSize: '0.64rem', padding: '0 8px', gap: '4px', borderColor: 'rgba(6, 182, 212, 0.4)', color: 'var(--color-cyan)' }}
                                      title="Forzar ejecución ahora"
                                    >
                                      <span>⚡ Ejecutar</span>
                                    </button>
                                  )}
                                  
                                  <button
                                    type="button"
                                    className="btn btn-outline flex-center"
                                    onClick={() => handleDeleteTask(t.id)}
                                    style={{ height: '28px', width: '28px', padding: 0, justifyContent: 'center', color: 'var(--color-rose)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
                                    title="Eliminar Tarea"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </>
                  )}

                  {/* SUB-TAB: TELEGRAM MINI APP INTEGRATOR & SIMULATOR */}
                  {settingsSubTab === 'mini_app' && (
                    <>
                      <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: '#ffffff', display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <Terminal size={18} color="var(--color-cyan)" />
                          <span>Proyección de Telegram Web App & Bots</span>
                        </h3>
                        <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
                          Aprovecha tu token para configurar una Mini App dentro del propio chat del bot y ver la interfaz web completa adaptada a tu móvil de forma 100% nativa.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginTop: '10px' }}>
                        <div style={{ flex: '1.2', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {/* Guía BotFather */}
                          <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '16px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--color-cyan)', display: 'block' }}>🚀 Activar Mini App en Telegram</span>
                            <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: 1.4 }}>
                              <li>Abre Telegram y busca al bot oficial <b>@BotFather</b>.</li>
                              <li>Envía el comando <code>/newapp</code> y selecciona tu Bot.</li>
                              <li>Escribe el título de tu app (ej: <code>Ánquer Clínica</code>) y su descripción.</li>
                              <li>Sube una imagen de logo si lo deseas (o envia /skip).</li>
                              <li>Cuando te pida la <b>URL del Web App</b>, pega la URL de esta web:<br />
                                <strong style={{ color: '#ffffff', wordBreak: 'break-all' }}>https://ancora-portal.web.app</strong>
                              </li>
                              <li>Escribe un nombre corto (alias) y se generará tu enlace directo (ej: <code>t.me/TuBotName/app</code>).</li>
                            </ol>
                          </div>

                          <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '14px', borderRadius: '10px' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-emerald)', display: 'block', marginBottom: '4px' }}>💡 Experiencia Móvil Integrada</span>
                            <p style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                              Al abrir la Web App desde Telegram, la web detecta que está en un dispositivo móvil y activa la vista compacta adaptada. Te permite ver debates, firmar acuerdos de contención y recibir reportes sin salir de Telegram.
                            </p>
                          </div>
                        </div>

                        {/* Simulador Móvil Interactivo */}
                        <div style={{ flex: '0.8', minWidth: '240px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                          <div style={{
                            width: '240px',
                            height: '380px',
                            borderRadius: '28px',
                            border: '5px solid #242f3d',
                            background: '#0e1621',
                            boxShadow: '0 15px 30px rgba(0,0,0,0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            <div style={{ background: '#17212b', padding: '10px 14px 6px 14px', borderBottom: '1px solid #101921', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: 'var(--color-cyan)', fontSize: '0.7rem', cursor: 'pointer' }}>✕</span>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>Ánquer Clínica</span>
                                  <span style={{ fontSize: '0.52rem', color: 'var(--text-tertiary)' }}>bot de Emilio</span>
                                </div>
                              </div>
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.74rem' }}>⋮</span>
                            </div>

                            <div style={{ flex: 1, padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', background: '#050810', overflowY: 'auto' }}>
                              <div style={{ background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(6, 182, 212, 0.15)', padding: '8px', borderRadius: '8px', textAlign: 'center' }}>
                                <span style={{ fontSize: '0.58rem', color: 'var(--color-cyan)', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>PORTAL TELEGRAM</span>
                                <strong style={{ fontSize: '0.7rem', color: '#ffffff', display: 'block', marginTop: '2px' }}>Espacio de Emilio José</strong>
                              </div>

                              <div style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '0 8px 8px 8px', padding: '6px 8px', maxWidth: '85%' }}>
                                <span style={{ fontSize: '0.54rem', fontWeight: 800, color: 'var(--color-cyan)', display: 'block', marginBottom: '2px' }}>Ánquer IA</span>
                                <p style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.3 }}>
                                  Emilio, he detectado sobreoperativa. Equity Killer a 2R. ¡Detén la sesión de hoy!
                                </p>
                              </div>

                              <div style={{ background: 'rgba(3, 5, 12, 0.6)', border: '1px solid rgba(6, 182, 212, 0.15)', borderLeft: '3px solid var(--color-cyan)', padding: '6px 8px', borderRadius: '4px 8px 8px 4px' }}>
                                <span style={{ fontSize: '0.54rem', fontWeight: 800, color: '#ffffff', display: 'block' }}>💬 Debate Activo (Turno 3)</span>
                                <p style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', margin: '2px 0 0 0', fontStyle: 'italic' }}>
                                  Risk Guard está auditando tu apalancamiento...
                                </p>
                              </div>
                            </div>

                            <div style={{ background: '#17212b', padding: '6px 4px', display: 'flex', justifyContent: 'space-around', borderTop: '1px solid #101921' }}>
                              <span style={{ fontSize: '0.52rem', color: 'var(--color-cyan)', fontWeight: 800 }}>💬 Chat</span>
                              <span style={{ fontSize: '0.52rem', color: 'var(--text-secondary)' }}>👥 Debates</span>
                              <span style={{ fontSize: '0.52rem', color: 'var(--text-secondary)' }}>📊 Reportes</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Botón de Guardar en la parte inferior para los tabs configurables */}
                {['trading', 'somatic', 'debate', 'telegram'].includes(settingsSubTab) && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '18px', marginTop: '10px' }}>
                    <button
                      type="submit"
                      className="btn btn-cyan"
                      disabled={savingConfig}
                      style={{ height: '40px', fontSize: '0.78rem', padding: '0 24px', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 700 }}
                    >
                      <span>{savingConfig ? 'Guardando Ajustes...' : '💾 Guardar Ajustes del Sistema'}</span>
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
            {/* Modal para Editar Agente */}
      {editingAgent && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 16, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            background: 'rgba(10, 15, 30, 0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Edit2 size={16} color="var(--color-cyan)" />
                <span>Editar Perfil de Agente</span>
              </h3>
              <button 
                onClick={() => setEditingAgent(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateAgent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Nombre del Agente</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editAgentName}
                  onChange={(e) => setEditAgentName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Rol / Especialidad</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editAgentRole}
                  onChange={(e) => setEditAgentRole(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Descripción del Comportamiento</label>
                <textarea 
                  className="form-input" 
                  rows="3"
                  value={editAgentDesc}
                  onChange={(e) => setEditAgentDesc(e.target.value)}
                  required
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>Color del Agente</label>
                  <select 
                    className="form-input"
                    value={editAgentColor}
                    onChange={(e) => setEditAgentColor(e.target.value)}
                    style={{ background: '#050810', color: '#ffffff' }}
                  >
                    {COLOR_PRESETS.map(c => (
                      <option key={c.value} value={c.value}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>Icono de Lucide</label>
                  <select 
                    className="form-input"
                    value={editAgentIcon}
                    onChange={(e) => setEditAgentIcon(e.target.value)}
                    style={{ background: '#050810', color: '#ffffff' }}
                  >
                    {Object.keys(ICON_MAP).map(iconKey => (
                      <option key={iconKey} value={iconKey}>{iconKey}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setEditingAgent(null)}
                  style={{ height: '36px', fontSize: '0.76rem' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-cyan" 
                  disabled={submittingAgent}
                  style={{ height: '36px', fontSize: '0.76rem' }}
                >
                  {submittingAgent ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Editar Tarea */}
      {editingTask && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 16, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '24px',
            background: 'rgba(10, 15, 30, 0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Edit2 size={16} color="var(--color-cyan)" />
                <span>Editar Tarea Asignada</span>
              </h3>
              <button 
                onClick={() => setEditingTask(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Título de la Tarea</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={editTaskTitle}
                  onChange={(e) => setEditTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Agente Asignado</label>
                <select 
                  className="form-input"
                  value={editTaskAgent}
                  onChange={(e) => setEditTaskAgent(e.target.value)}
                  style={{ background: '#050810', color: '#ffffff' }}
                >
                  {agents.map(a => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.74rem' }}>Instrucción / Prompt de la Tarea</label>
                <textarea 
                  className="form-input" 
                  rows="4"
                  value={editTaskDesc}
                  onChange={(e) => setEditTaskDesc(e.target.value)}
                  required
                  style={{ resize: 'none' }}
                />
              </div>

              <div className="grid-2" style={{ gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>Ejecución Programada (datetime-local)</label>
                  <input 
                    type="datetime-local" 
                    className="form-input" 
                    value={editTaskScheduled}
                    onChange={(e) => setEditTaskScheduled(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label" style={{ fontSize: '0.74rem' }}>Frecuencia de Repetición (Recurrente)</label>
                  <select
                    className="form-input"
                    value={editTaskRecurrenceType}
                    onChange={(e) => setEditTaskRecurrenceType(e.target.value)}
                    style={{ background: '#050810', color: '#ffffff' }}
                  >
                    <option value="none">No se repite (Única vez)</option>
                    <option value="daily">Diariamente</option>
                    <option value="weekdays">Días laborables (Lunes a Viernes)</option>
                    <option value="weekly">Semanalmente (Una vez por semana)</option>
                    <option value="hourly">Frecuencia por horas (Varias veces al día)</option>
                    <option value="custom">Personalizado (Cron manual / natural)</option>
                  </select>

                  {editTaskRecurrenceType !== 'none' && editTaskRecurrenceType !== 'custom' && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '8px', flexWrap: 'wrap' }}>
                      {editTaskRecurrenceType !== 'hourly' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Hora</span>
                          <input
                            type="time"
                            className="form-input"
                            value={editTaskRecurrenceTime}
                            onChange={(e) => setEditTaskRecurrenceTime(e.target.value)}
                            style={{ width: '100px', height: '32px', padding: '0 8px', fontSize: '0.74rem', background: '#050810', color: '#ffffff', margin: 0 }}
                          />
                        </div>
                      )}

                      {editTaskRecurrenceType === 'weekly' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Día de la semana</span>
                          <select
                            className="form-input"
                            value={editTaskRecurrenceDay}
                            onChange={(e) => setEditTaskRecurrenceDay(e.target.value)}
                            style={{ width: '120px', height: '32px', padding: '0 8px', fontSize: '0.74rem', background: '#050810', color: '#ffffff', margin: 0 }}
                          >
                            <option value="1">Lunes</option>
                            <option value="2">Martes</option>
                            <option value="3">Miércoles</option>
                            <option value="4">Jueves</option>
                            <option value="5">Viernes</option>
                            <option value="6">Sábado</option>
                            <option value="0">Domingo</option>
                          </select>
                        </div>
                      )}

                      {editTaskRecurrenceType === 'hourly' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.66rem', color: 'var(--text-secondary)' }}>Repetir cada</span>
                          <select
                            className="form-input"
                            value={editTaskRecurrenceInterval}
                            onChange={(e) => setEditTaskRecurrenceInterval(e.target.value)}
                            style={{ width: '130px', height: '32px', padding: '0 8px', fontSize: '0.74rem', background: '#050810', color: '#ffffff', margin: 0 }}
                          >
                            <option value="1">1 hora</option>
                            <option value="2">2 horas</option>
                            <option value="3">3 horas</option>
                            <option value="4">4 horas</option>
                            <option value="6">6 horas</option>
                            <option value="8">8 horas</option>
                            <option value="12">12 horas</option>
                          </select>
                        </div>
                      )}
                      
                      <div style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', flex: 1, minWidth: '150px', display: 'flex', alignItems: 'center' }}>
                        <span>
                          Sintaxis cron: <code style={{ color: 'var(--color-cyan)', fontFamily: 'monospace' }}>
                            {buildCronFromUI(editTaskRecurrenceType, editTaskRecurrenceTime, editTaskRecurrenceDay, editTaskRecurrenceInterval)}
                          </code>
                        </span>
                      </div>
                    </div>
                  )}

                  {editTaskRecurrenceType === 'custom' && (
                    <div style={{ marginTop: '4px' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={editTaskCron}
                        onChange={(e) => setEditTaskCron(e.target.value)}
                        placeholder="Ej: 0 9 * * 1-5"
                        style={{ margin: 0 }}
                      />
                      <span style={{ fontSize: '0.64rem', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>
                        Escribe tu cron manual o lenguaje amigable.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setEditingTask(null)}
                  style={{ height: '36px', fontSize: '0.76rem' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-cyan" 
                  disabled={submittingEditTask}
                  style={{ height: '36px', fontSize: '0.76rem' }}
                >
                  {submittingEditTask ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NOTIFICACIÓN DE INFORME EN VIVO (ANTIGRAVITY 2.0) */}
      {showNotificationModal && notificationTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 5, 12, 0.75)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 24, 48, 0.95) 0%, rgba(8, 12, 28, 0.98) 100%)',
            border: '1px solid rgba(0, 242, 254, 0.25)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(0, 242, 254, 0.1)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            {/* Cabecera del Modal */}
            <div style={{
              padding: '20px 26px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.01)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: 'var(--color-cyan)',
                  boxShadow: '0 0 10px var(--color-cyan)',
                  animation: 'pulse 1.5s infinite'
                }} />
                <div>
                  <h3 style={{ fontSize: '0.94rem', fontWeight: 900, color: '#ffffff', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    🚨 ¡Nuevo Informe de Risk Guard Disponible!
                  </h3>
                  <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                    Generado de forma autónoma a las {new Date(notificationTask.updated_at || new Date()).toLocaleTimeString('es-ES')}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => { setShowNotificationModal(false); setNotificationTask(null); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  outline: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                onMouseLeave={(e) => e.target.style.color = 'var(--text-secondary)'}
              >
                ✕
              </button>
            </div>

            {/* Cuerpo del Modal (Scrollable) */}
            <div className="custom-scrollbar" style={{
              padding: '26px',
              overflowY: 'auto',
              flex: 1,
              background: 'rgba(3, 5, 12, 0.2)'
            }}>
              {parseReportToVisualHTML(notificationTask.result, 'var(--color-cyan)', 'all')}
            </div>

            {/* Pie del Modal */}
            <div style={{
              padding: '16px 26px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.01)'
            }}>
              <button
                onClick={() => {
                  setShowNotificationModal(false);
                  setNotificationTask(null);
                  setActiveTab('calendar');
                  setSelectedCalendarDay(new Date());
                }}
                className="btn btn-outline"
                style={{ height: '38px', fontSize: '0.78rem' }}
              >
                📅 Ir al Calendario
              </button>
              <button
                onClick={() => { setShowNotificationModal(false); setNotificationTask(null); }}
                className="btn btn-cyan"
                style={{ height: '38px', fontSize: '0.78rem', padding: '0 24px' }}
              >
                Entendido, Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
