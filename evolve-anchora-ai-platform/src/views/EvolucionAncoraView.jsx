import { useState } from 'react';
import { 
  Cpu, 
  Brain, 
  FolderSync, 
  ShieldCheck, 
  Coins, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  FileText,
  Clock,
  Lock,
  UserCheck,
  Percent,
  Search,
  DollarSign
} from 'lucide-react';

export default function EvolucionAncoraView() {
  const [activeTab, setActiveTab] = useState('inferencia');

  // --- ESTADO REACTIVO PARA SIMULADORES ---
  // 1. Inferencia & GPU
  const [gpuDau, setGpuDau] = useState(1000);
  const [gpuHours, setGpuHours] = useState(12);
  const [gpuContext, setGpuContext] = useState(8192);
  const [gpuBpw, setGpuBpw] = useState(4.0);

  // 2. Chatbot Hermes
  const [hermesNudge, setHermesNudge] = useState(0.5);
  const [hermesK, setHermesK] = useState(15);
  const [hermesContextRag, setHermesContextRag] = useState(4096);
  const [hermesCrisisSens, setHermesCrisisSens] = useState(0.90);

  // 3. UX Clínico
  const [uxFiles, setUxFiles] = useState(12);
  const [uxAudioDuration, setUxAudioDuration] = useState(15);
  const [uxManualSoap, setUxManualSoap] = useState(20);

  // 4. Legal & Compliance
  const [legalDpo, setLegalDpo] = useState(150);
  const [legalContingency, setLegalContingency] = useState(10);

  // 5. Doble SaaS & ROI
  const [saasPaciente, setSaasPaciente] = useState(29);
  const [saasPsicologo, setSaasPsicologo] = useState(49);
  const [numPacientes, setNumPacientes] = useState(300);
  const [numPsicologos, setNumPsicologos] = useState(20);
  const [hardwareCost, setHardwareCost] = useState(7495);

  // 6. Estrategia & Naming
  const [marketingCanal, setMarketingCanal] = useState('organico');
  const [marketingChurn, setMarketingChurn] = useState(10);
  const [marketingConversion, setMarketingConversion] = useState(3);
  const [selectedName, setSelectedName] = useState('Ancora');

  // --- CÁLCULOS REACTIVOS ---

  // 1. Inferencia & GPU
  const lambdaPoisson = (gpuDau * 25) / (gpuHours * 3600); // 25 mensajes de media por usuario al día
  
  // Probabilidad de colisión (Poisson: P(X >= 4) con lambda dado)
  const getPoissonProb = (k, l) => {
    let fact = 1;
    for (let i = 1; i <= k; i++) fact *= i;
    return (Math.pow(l, k) * Math.exp(-l)) / fact;
  };
  const probColision = 1 - (
    getPoissonProb(0, lambdaPoisson) + 
    getPoissonProb(1, lambdaPoisson) + 
    getPoissonProb(2, lambdaPoisson) + 
    getPoissonProb(3, lambdaPoisson)
  );

  // KV Cache VRAM por usuario concurrentes en el mismo segundo (Continuous Batching)
  // vLLM Llama-70B: 80 capas, 8 cabezas GQA, 128 dim. Bytes/token = 1 para FP8
  const vramKvCachePerUser = (2 * 80 * 8 * 128 * gpuContext * 1) / 1e9; // ~1.31 GB para 8192
  const usuariosConcurrentesMax = Math.ceil(lambdaPoisson * 10); // Estimamos un factor de ráfaga de 10x
  const vramKvCacheTotal = vramKvCachePerUser * usuariosConcurrentesMax;
  const vramModelo = 70 * (gpuBpw / 8); // 70B parámetros * bpw/8 bytes
  const vramTotalEstimada = vramModelo + vramKvCacheTotal;
  const hardwareSaturado = vramTotalEstimada > 96; // Límite de las 4x RTX 3090 (96GB VRAM)

  const consumoMensualKwh = 0.90 * gpuHours * 30.5; // 900W de consumo medio
  const costeElectricoMensual = consumoMensualKwh * 0.18; // 0.18 €/kWh
  const depreciacionMensual = 7495 / 36; // 36 meses de amortización

  // 2. Chatbot Hermes
  const latenciaRAG = 1.2 * hermesK; // 1.2ms por fragmento de pgvector
  const compresionHechos = 100 - (hermesNudge * 45); // A mayor nudge, más filtra y comprime
  const falsosPositivosCrisis = (1.0 - hermesCrisisSens) * 10.0;

  // 3. UX Clínico
  const tiempoWhisperSegundos = (uxFiles * uxAudioDuration * 60) * 0.0083; // Whisper Large v3 procesa 1 hora en 30s (~0.0083 ratio)
  const tiempoWhisperMinutos = tiempoWhisperSegundos / 60;
  const horasAhorradasSemana = ((uxManualSoap - 3) * 15) / 60; // 15 sesiones/semana, SOAP tarda 3 min con IA

  // 4. Legal & Compliance
  const costeCumplimientoAnual = (legalDpo * 12) + 1200; // DPO mensual + auditorías/DPIA
  const ivaSaasPaciente = saasPaciente - (saasPaciente / 1.21); // 21% IVA incluido
  const contingenciaCalculada = (legalDpo * 12) * (1 + (legalContingency / 100));

  // 5. Doble SaaS & ROI
  const mrrPacientes = numPacientes * saasPaciente;
  const mrrPsicologos = numPsicologos * saasPsicologo;
  const mrrTotal = mrrPacientes + mrrPsicologos;
  const costesVariablesSaaS = (mrrTotal * 0.025) + 200 + legalDpo; // Stripe (2.5%) + hosting/mantenimiento + DPO
  const margenNetoMensual = mrrTotal - costesVariablesSaaS;
  const roiHardware3Anos = ((margenNetoMensual * 36) - hardwareCost) / hardwareCost * 100;
  const tiempoAmortizacionMeses = hardwareCost / Math.max(1, margenNetoMensual);
  const breakEvenPacientes = Math.ceil((costesVariablesSaaS) / saasPaciente);

  // 6. Estrategia & Naming
  let cacCanal = 5;
  if (marketingCanal === 'b2b2c') cacCanal = 25;
  if (marketingCanal === 'seo') cacCanal = 40;
  if (marketingCanal === 'ads') cacCanal = 100;

  const vidaMediaUsuario = 1 / (marketingChurn / 100);
  const ltvBruto = saasPaciente * vidaMediaUsuario;
  const ratioLtvCac = ltvBruto / cacCanal;

  const namingAlternatives = [
    { name: 'Ancora', semantic: 'Ancla, estabilidad y arraigo en terapia.', sound: 'Fuerte en español, conceptual en inglés.', domain: 'ancora.clinic (Disponible)' },
    { name: 'EvoTherapy', semantic: 'Terapia evolucionada con inteligencia estructurada.', sound: 'Excelente pronunciación global.', domain: 'evotherapy.io (Premium)' },
    { name: 'PsychFlow', semantic: 'Flujo y continuidad del diario mental.', sound: 'Sonoridad moderna de startup SaaS.', domain: 'psychflow.app (Disponible)' },
    { name: 'PsycheRadix', semantic: 'La raíz de la mente, historia estructurada.', sound: 'Más clínico y formal.', domain: 'psycheradix.com (Disponible)' },
    { name: 'WorldTherapy', semantic: 'Terapia sin fronteras ni pérdida de historial.', sound: 'Muy amplio pero genérico.', domain: 'worldtherapy.forum (Disponible)' },
  ];

  return (
    <div className="evolucion-container" style={{ padding: '24px', color: 'var(--text-primary)' }}>
      {/* Header Sección */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px', borderLeft: '4px solid var(--color-cyan)', relative: 'overflow' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: 'var(--color-cyan)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>PANEL DE EVOLUCIÓN Y VIABILIDAD ÁNCORA</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Simulador interactivo multi-agente en tiempo real de la tesis de negocio, arquitectura de inferencia y compliance legal de Áncora.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs de Agentes */}
      <div className="evolucion-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        <button 
          onClick={() => setActiveTab('inferencia')} 
          className={`tab-btn flex-center ${activeTab === 'inferencia' ? 'active' : ''}`}
          style={{ padding: '12px 18px', gap: '8px', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: activeTab === 'inferencia' ? 'rgba(6,182,212,0.1)' : 'var(--background-secondary)', cursor: 'pointer', transition: 'all 0.2s', color: activeTab === 'inferencia' ? 'var(--color-cyan)' : 'var(--text-secondary)' }}
        >
          <Cpu size={16} />
          <span>1. Inferencia & GPU</span>
        </button>

        <button 
          onClick={() => setActiveTab('hermes')} 
          className={`tab-btn flex-center ${activeTab === 'hermes' ? 'active' : ''}`}
          style={{ padding: '12px 18px', gap: '8px', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: activeTab === 'hermes' ? 'rgba(16,185,129,0.1)' : 'var(--background-secondary)', cursor: 'pointer', transition: 'all 0.2s', color: activeTab === 'hermes' ? 'var(--color-emerald)' : 'var(--text-secondary)' }}
        >
          <Brain size={16} />
          <span>2. Chatbot Hermes</span>
        </button>

        <button 
          onClick={() => setActiveTab('ux')} 
          className={`tab-btn flex-center ${activeTab === 'ux' ? 'active' : ''}`}
          style={{ padding: '12px 18px', gap: '8px', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: activeTab === 'ux' ? 'rgba(245,158,11,0.1)' : 'var(--background-secondary)', cursor: 'pointer', transition: 'all 0.2s', color: activeTab === 'ux' ? 'var(--color-amber)' : 'var(--text-secondary)' }}
        >
          <FolderSync size={16} />
          <span>3. UX Clínico & Alta</span>
        </button>

        <button 
          onClick={() => setActiveTab('legal')} 
          className={`tab-btn flex-center ${activeTab === 'legal' ? 'active' : ''}`}
          style={{ padding: '12px 18px', gap: '8px', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: activeTab === 'legal' ? 'rgba(239,68,68,0.1)' : 'var(--background-secondary)', cursor: 'pointer', transition: 'all 0.2s', color: activeTab === 'legal' ? 'var(--color-rose)' : 'var(--text-secondary)' }}
        >
          <ShieldCheck size={16} />
          <span>4. Legal & Compliance</span>
        </button>

        <button 
          onClick={() => setActiveTab('saas')} 
          className={`tab-btn flex-center ${activeTab === 'saas' ? 'active' : ''}`}
          style={{ padding: '12px 18px', gap: '8px', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: activeTab === 'saas' ? 'rgba(168,85,247,0.1)' : 'var(--background-secondary)', cursor: 'pointer', transition: 'all 0.2s', color: activeTab === 'saas' ? 'rgb(168,85,247)' : 'var(--text-secondary)' }}
        >
          <Coins size={16} />
          <span>5. Doble SaaS & ROI</span>
        </button>

        <button 
          onClick={() => setActiveTab('marketing')} 
          className={`tab-btn flex-center ${activeTab === 'marketing' ? 'active' : ''}`}
          style={{ padding: '12px 18px', gap: '8px', fontSize: '0.8rem', fontWeight: 700, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: activeTab === 'marketing' ? 'rgba(236,72,153,0.1)' : 'var(--background-secondary)', cursor: 'pointer', transition: 'all 0.2s', color: activeTab === 'marketing' ? 'rgb(236,72,153)' : 'var(--text-secondary)' }}
        >
          <Lightbulb size={16} />
          <span>6. Naming & Marketing</span>
        </button>
      </div>

      {/* CONTENIDO DE TABS */}
      <div className="tab-content" style={{ animation: 'fade-in 0.3s ease-out' }}>
        
        {/* ================= INFERENCIA & GPU ================= */}
        {activeTab === 'inferencia' && (
          <div className="grid-1-2" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
            {/* Formulario Lateral */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Cpu size={18} color="var(--color-cyan)" />
                <h4 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700 }}>Parámetros de Inferencia</h4>
              </div>

              {/* Input DAU */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Usuarios Activos Diarios (DAU): <strong>{gpuDau}</strong>
                </label>
                <input 
                  type="range" 
                  min="100" 
                  max="5000" 
                  step="50" 
                  value={gpuDau} 
                  onChange={(e) => setGpuDau(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-cyan)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>100</span>
                  <span>5.000</span>
                </div>
              </div>

              {/* Input Horas Activas */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Ventana Diurna de Inferencia: <strong>{gpuHours}h</strong>
                </label>
                <input 
                  type="range" 
                  min="4" 
                  max="24" 
                  step="1" 
                  value={gpuHours} 
                  onChange={(e) => setGpuHours(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-cyan)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>4h (Pico)</span>
                  <span>24h (24/7)</span>
                </div>
              </div>

              {/* Input Contexto */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Ventana de Contexto (KV): <strong>{gpuContext} tokens</strong>
                </label>
                <input 
                  type="select" 
                  style={{ display: 'none' }} // Usamos un slider simulado
                />
                <input 
                  type="range" 
                  min="2048" 
                  max="16384" 
                  step="1024" 
                  value={gpuContext} 
                  onChange={(e) => setGpuContext(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-cyan)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>2K (Corto)</span>
                  <span>16K (Largo)</span>
                </div>
              </div>

              {/* Input bpw */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Cuantización de Llama-70B: <strong>{gpuBpw.toFixed(1)} bpw</strong>
                </label>
                <input 
                  type="range" 
                  min="3.0" 
                  max="5.0" 
                  step="0.5" 
                  value={gpuBpw} 
                  onChange={(e) => setGpuBpw(parseFloat(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-cyan)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>3.0 (Ligero)</span>
                  <span>5.0 (Preciso)</span>
                </div>
              </div>
            </div>

            {/* Detalle y Reporte del Agente */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <span className="badge" style={{ background: 'rgba(6,182,212,0.1)', color: 'var(--color-cyan)', border: '1px solid rgba(6,182,212,0.2)' }}>
                      AGENTE 1: INFERENCIA LOCAL & HARDWARE
                    </span>
                    <h3 style={{ fontSize: '1.25rem', marginTop: '6px' }}>Cálculo de Concurrencia de Tráfico y Capacidad Física</h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Estado Servidor</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: hardwareSaturado ? 'var(--color-rose)' : 'var(--color-emerald)', boxShadow: `0 0 8px ${hardwareSaturado ? 'var(--color-rose)' : 'var(--color-emerald)'}` }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: hardwareSaturado ? 'var(--color-rose)' : 'var(--color-emerald)' }}>
                        {hardwareSaturado ? 'VRAM EXCEDIDA' : 'ESTABLE (96GB)'}
                      </span>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Para dar soporte a <strong>{gpuDau} usuarios activos al día</strong> con una ventana diurna de <strong>{gpuHours} horas</strong>, modelamos la entrada de peticiones conversacionales interactivos de baja latencia usando una <strong>Distribución de Poisson</strong>. Eliminando la reserva estricta de slots en el calendario, confiamos en la naturaleza asíncrona de la redacción humana:
                </p>

                {/* KPIs de Inferencia */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '20px' }}>
                  <div className="metric-card" style={{ borderTop: '3px solid var(--color-cyan)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>{lambdaPoisson.toFixed(2)} / s</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Peticiones Media ($\lambda$)</span>
                  </div>

                  <div className="metric-card" style={{ borderTop: '3px solid var(--color-cyan)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: probColision > 0.05 ? 'var(--color-rose)' : 'var(--color-emerald)' }}>
                      {(probColision * 100).toFixed(2)} %
                    </span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>P(Colisión &ge; 4 req/s)</span>
                  </div>

                  <div className="metric-card" style={{ borderTop: '3px solid var(--color-cyan)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>{vramTotalEstimada.toFixed(1)} GB</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>VRAM Llama-70B + KV Cache</span>
                  </div>

                  <div className="metric-card" style={{ borderTop: '3px solid var(--color-cyan)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>{(60).toFixed(0)} t/s</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Rendimiento Inferencia</span>
                  </div>
                </div>

                {/* Explicación Técnica y Alertas */}
                <div style={{ marginTop: '20px' }}>
                  {hardwareSaturado ? (
                    <div className="flex-center" style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--color-rose)', gap: '10px', fontSize: '0.8rem' }}>
                      <AlertTriangle size={18} />
                      <span>
                        <strong>¡Peligro de Desbordamiento!</strong> La VRAM requerida para alojar el contexto de los usuarios concurrentes ({vramTotalEstimada.toFixed(1)} GB) supera los 96 GB libres de las 4x RTX 3090. Reduce la ventana de contexto a 4096 o amplía las horas de inferencia para redistribuir la carga.
                      </span>
                    </div>
                  ) : (
                    <div className="flex-center" style={{ padding: '12px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--color-emerald)', gap: '10px', fontSize: '0.8rem' }}>
                      <CheckCircle size={18} />
                      <span>
                        <strong>Capacidad Física Validada:</strong> La Workstation soporta con éxito la carga máxima proyectada sin superar el límite físico de 96 GB VRAM. Continuous Batching en vLLM puede procesar las colas simultáneas de forma instantánea.
                      </span>
                    </div>
                  )}
                </div>

                {/* Desglose de Gastos Operativos de Inferencia */}
                <h4 style={{ fontSize: '0.9rem', marginTop: '24px', marginBottom: '12px', fontWeight: 700 }}>Desglose de Costes Operativos del Servidor (Mensual)</h4>
                <div className="table-wrap">
                  <table className="data-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--sovereign-blue)' }}>
                        <th style={{ padding: '8px 12px' }}>Concepto</th>
                        <th style={{ padding: '8px 12px' }}>Fórmula / Detalles</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Coste Estimado</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px 12px' }}>Consumo Eléctrico</td>
                        <td style={{ padding: '8px 12px' }}>{consumoMensualKwh.toFixed(1)} kWh consumidos a 0.18 €/kWh (Activo 900W)</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{costeElectricoMensual.toFixed(2)} €/mes</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 12px' }}>Depreciación de Hardware</td>
                        <td style={{ padding: '8px 12px' }}>Amortización lineal a 3 años de la Workstation (~7.495 €)</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>{depreciacionMensual.toFixed(2)} €/mes</td>
                      </tr>
                      <tr className="highlight-row" style={{ background: 'rgba(6,182,212,0.05)' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 700 }}>Coste Operativo Total Fijo</td>
                        <td style={{ padding: '8px 12px' }}>Electricidad + Depreciación del Servidor Físico</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--color-cyan)' }}>
                          {(costeElectricoMensual + depreciacionMensual).toFixed(2)} €/mes
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= CHATBOT HERMES ================= */}
        {activeTab === 'hermes' && (
          <div className="grid-1-2" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
            {/* Formulario Lateral */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Brain size={18} color="var(--color-emerald)" />
                <h4 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700 }}>Configuración de Memoria</h4>
              </div>

              {/* Nudge threshold */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Umbral de Nudge (Significancia): <strong>{hermesNudge.toFixed(2)}</strong>
                </label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.05" 
                  value={hermesNudge} 
                  onChange={(e) => setHermesNudge(parseFloat(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>0.1 (Hiperactivo)</span>
                  <span>1.0 (Perezoso)</span>
                </div>
              </div>

              {/* pgvector retrieval K */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Retorno de Fragmentos (K RAG): <strong>{hermesK} chunks</strong>
                </label>
                <input 
                  type="range" 
                  min="5" 
                  max="30" 
                  step="1" 
                  value={hermesK} 
                  onChange={(e) => setHermesK(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>5 (Rápido)</span>
                  <span>30 (Completo)</span>
                </div>
              </div>

              {/* Contexto RAG */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Contexto Asignado a RAG: <strong>{hermesContextRag} tokens</strong>
                </label>
                <input 
                  type="range" 
                  min="2048" 
                  max="8192" 
                  step="512" 
                  value={hermesContextRag} 
                  onChange={(e) => setHermesContextRag(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>2K</span>
                  <span>8K</span>
                </div>
              </div>

              {/* Sensibilidad Crisis */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Sensibilidad Crisis Detector: <strong>{(hermesCrisisSens * 100).toFixed(0)}%</strong>
                </label>
                <input 
                  type="range" 
                  min="0.70" 
                  max="0.99" 
                  step="0.01" 
                  value={hermesCrisisSens} 
                  onChange={(e) => setHermesCrisisSens(parseFloat(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>70%</span>
                  <span>99% (Máxima)</span>
                </div>
              </div>
            </div>

            {/* Contenido Agente */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--color-emerald)', border: '1px solid rgba(16,185,129,0.2)' }}>
                      AGENTE 2: CHATBOT & MEMORIA COGNITIVA
                    </span>
                    <h3 style={{ fontSize: '1.25rem', marginTop: '6px' }}>Arquitectura de Memoria Persistente Hermes y Detección de Crisis</h3>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  El chatbot de contención emocional en local no debe diagnosticar ni proponer tratamientos. Funciona como un <strong>observador persistente</strong> de la vida del usuario que convierte experiencias conversacionales desestructuradas en una estructura lógica estructurada en 3 niveles de memoria, emulando la arquitectura cognitiva de Hermes:
                </p>

                {/* Diagrama de 3 Niveles */}
                <div style={{ background: 'var(--background-tertiary)', borderRadius: 'var(--radius)', padding: '20px', border: '1px solid var(--border)', marginTop: '16px' }}>
                  <h4 style={{ fontSize: '0.85rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-emerald)' }}>Estructura de la Memoria Cognitiva</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ padding: '12px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 'var(--radius-sm)' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--color-amber)', display: 'block' }}>Nivel 1: Corto Plazo (Working Memory)</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        VRAM Cache activa durante la conversación de 15 minutos diaria. KV Cache de hasta {gpuContext} tokens por usuario. Limpieza completa al finalizar la sesión.
                      </span>
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-sm)' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--color-emerald)', display: 'block' }}>Nivel 2: Medio Plazo (Episodic Memory)</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Compresión perezosa (lazy nudge) en JSON de Hechos Persistentes. Actualiza solo si la significancia supera el umbral de <strong>{hermesNudge.toFixed(2)}</strong>. Eficiencia de filtrado de ruido del <strong>{compresionHechos.toFixed(0)}%</strong>.
                      </span>
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 'var(--radius-sm)' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--color-cyan)', display: 'block' }}>Nivel 3: Largo Plazo (Semantic Memory)</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Vectorización semántica nocturna de resúmenes mediante `all-MiniLM-L6-v2` indexada en `pgvector`. Búsqueda coseno de {hermesK} fragmentos (K) con latencia estimada de <strong>{latenciaRAG.toFixed(1)} ms</strong>.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Kill Switch y Detección de Crisis */}
                <h4 style={{ fontSize: '0.9rem', marginTop: '24px', marginBottom: '12px', fontWeight: 700 }}>Protocolo Inmediato de Detección de Crisis (Kill-Switch)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="glass-panel" style={{ padding: '16px', background: 'rgba(239,68,68,0.02)', borderColor: 'rgba(239,68,68,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-rose)' }} />
                      <strong style={{ fontSize: '0.8rem', color: 'var(--color-rose)' }}>Capa 1: Análisis Léxico (&lt;1ms)</strong>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Filtrado de texto plano del usuario antes de enviar a inferencia buscando palabras críticas ("suicidio", "autolesión", "no quiero vivir"). Activación del protocolo instantáneo.
                    </p>
                  </div>

                  <div className="glass-panel" style={{ padding: '16px', background: 'rgba(239,68,68,0.02)', borderColor: 'rgba(239,68,68,0.15)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-rose)' }} />
                      <strong style={{ fontSize: '0.8rem', color: 'var(--color-rose)' }}>Capa 2: DistilBERT Semántico (&lt;80ms)</strong>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      Clasificación de intencionalidad semántica local en CPU. Si el nivel de confianza supera el <strong>{(hermesCrisisSens * 100).toFixed(0)}%</strong>, congela el chat y activa la pasarela de emergencia con tasa de error del <strong>{falsosPositivosCrisis.toFixed(1)}%</strong>.
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--color-rose)', fontSize: '0.75rem', lineHeight: 1.5 }}>
                  <strong>Kill-Switch Protocol Activado:</strong> Oculta inmediatamente la caja de chat interactiva, bloquea el envío de prompts, muestra los teléfonos oficiales de ayuda en crisis (024, 717 003 717) y envía una alerta push con prioridad crítica SMS al psicólogo asignado mediante WebHooks locales.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= UX CLÍNICO & ALTA ================= */}
        {activeTab === 'ux' && (
          <div className="grid-1-2" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
            {/* Formulario Lateral */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <FolderSync size={18} color="var(--color-amber)" />
                <h4 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700 }}>Parámetros de Importación</h4>
              </div>

              {/* Expedientes a importar */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Expedientes a Importar: <strong>{uxFiles} archivos</strong>
                </label>
                <input 
                  type="range" 
                  min="2" 
                  max="50" 
                  step="2" 
                  value={uxFiles} 
                  onChange={(e) => setUxFiles(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-amber)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>2</span>
                  <span>50</span>
                </div>
              </div>

              {/* Duración de audios */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Duración de Audios Históricos: <strong>{uxAudioDuration} min</strong>
                </label>
                <input 
                  type="range" 
                  min="5" 
                  max="60" 
                  step="5" 
                  value={uxAudioDuration} 
                  onChange={(e) => setUxAudioDuration(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-amber)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>5 min</span>
                  <span>60 min</span>
                </div>
              </div>

              {/* Tiempo SOAP manual */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Redacción SOAP Manual: <strong>{uxManualSoap} min/sesión</strong>
                </label>
                <input 
                  type="range" 
                  min="10" 
                  max="45" 
                  step="5" 
                  value={uxManualSoap} 
                  onChange={(e) => setUxManualSoap(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-amber)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>10 min</span>
                  <span>45 min</span>
                </div>
              </div>
            </div>

            {/* Contenido Agente */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--color-amber)', border: '1px solid rgba(245,158,11,0.2)' }}>
                      AGENTE 3: GESTIÓN DOCUMENTAL & UX CLÍNICO
                    </span>
                    <h3 style={{ fontSize: '1.25rem', marginTop: '6px' }}>Alta de Psicólogos, Importación de Pacientes y Smart SOAP</h3>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  La facilidad de migrar gabinetes tradicionales enteros es la clave de retención B2B de Áncora. El onboarding de psicólogos y la ingesta local de expedientes históricos debe ser fluida, privada y automática:
                </p>

                {/* KPIs de UX */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  <div className="metric-card" style={{ borderTop: '3px solid var(--color-amber)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>{tiempoWhisperMinutos.toFixed(1)} min</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Procesamiento Whisper Nocturno</span>
                  </div>

                  <div className="metric-card" style={{ borderTop: '3px solid var(--color-amber)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-emerald)' }}>{horasAhorradasSemana.toFixed(1)} horas</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Tiempo Ahorrado/Semana por Terapeuta</span>
                  </div>
                </div>

                {/* Mockup del Flujo de Alta y Validación */}
                <h4 style={{ fontSize: '0.9rem', marginTop: '24px', marginBottom: '12px', fontWeight: 700 }}>Flujo de Registro y Validación Colegial (Colegio Oficial de Psicólogos)</h4>
                <div className="glass-panel" style={{ padding: '16px', background: 'rgba(90,122,104,0.03)' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.8rem', marginBottom: '10px' }}>
                    <UserCheck size={16} color="var(--color-amber)" />
                    <strong>Paso 1: Validación Deontológica</strong>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '12px' }}>
                    El psicólogo introduce su número de colegiado y CCAA. El sistema realiza una consulta automática vía scraping HTTPS seguro a la API del Colegio Oficial de Psicólogos (COP) para verificar la vigencia de la licencia y la exención de inhabilitaciones deontológicas en tiempo real.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.8rem', marginBottom: '10px', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    <FolderSync size={16} color="var(--color-amber)" />
                    <strong>Paso 2: Ingesta y Estructuración Local (Raw-First)</strong>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    Al importar {uxFiles} expedientes (audios de {uxAudioDuration} min o PDFs desorganizados), el motor Whisper local y Llama-70B transcriben y extraen: hechos clave, cronología de eventos y relaciones significativas. Estos se cargan en el panel del psicólogo bajo el principio <strong>"Raw-First" con bloqueo glassmorphic</strong> (el diagnóstico está inicialmente oculto para evitar sesgos diagnósticos previos hasta que el terapeuta los valide explícitamente).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= LEGAL & COMPLIANCE ================= */}
        {activeTab === 'legal' && (
          <div className="grid-1-2" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
            {/* Formulario Lateral */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <ShieldCheck size={18} color="var(--color-rose)" />
                <h4 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700 }}>Parámetros Legales</h4>
              </div>

              {/* DPO Fee */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Cuota Mensual DPO/Asesoría: <strong>{legalDpo} €/mes</strong>
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="500" 
                  step="25" 
                  value={legalDpo} 
                  onChange={(e) => setLegalDpo(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-rose)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>50 €</span>
                  <span>500 €</span>
                </div>
              </div>

              {/* Margen de contingencia */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Margen de Contingencia Legal: <strong>{legalContingency} %</strong>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="30" 
                  step="5" 
                  value={legalContingency} 
                  onChange={(e) => setLegalContingency(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-rose)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>0% (Ninguno)</span>
                  <span>30% (Alto)</span>
                </div>
              </div>
            </div>

            {/* Contenido Agente */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--color-rose)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      AGENTE 4: LEGAL & COMPLIANCE
                    </span>
                    <h3 style={{ fontSize: '1.25rem', marginTop: '6px' }}>Escudo Deontológico, Ley del IVA y Mitigación de Laboralidad</h3>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  El tratamiento de datos de salud en España exige cumplir estrictamente el RGPD (Art. 9) y la Ley General de Publicidad Sanitaria (RD 1907/1996). La plataforma se blinda legalmente mediante políticas claras de datos y facturación:
                </p>

                {/* KPIs Legales */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  <div className="metric-card" style={{ borderTop: '3px solid var(--color-rose)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>{costeCumplimientoAnual.toFixed(0)} €</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Coste Anual de Compliance</span>
                  </div>

                  <div className="metric-card" style={{ borderTop: '3px solid var(--color-rose)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>{contingenciaCalculada.toFixed(0)} €</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Presupuesto con Contingencia</span>
                  </div>

                  <div className="metric-card" style={{ borderTop: '3px solid var(--color-rose)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-rose)' }}>{ivaSaasPaciente.toFixed(2)} €</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>IVA 21% por Paciente Declarado</span>
                  </div>
                </div>

                {/* Pilares del Escudo Legal */}
                <h4 style={{ fontSize: '0.9rem', marginTop: '24px', marginBottom: '12px', fontWeight: 700 }}>Blindaje en los Tres Frentes Críticos</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div className="glass-panel" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.8rem', marginBottom: '8px' }}>
                      <Lock size={16} color="var(--color-rose)" />
                      <strong>1. Tratamiento RGPD de Datos de Salud</strong>
                    </div>
                    <ul style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', paddingLeft: '14px', lineHeight: 1.5 }}>
                      <li>Consentimiento explícito dual (IA + clínica) no premarcado.</li>
                      <li>DPO (Delegado de Protección de Datos) externo certificado.</li>
                      <li>Inmutabilidad con Hash Chain de los accesos clínicos.</li>
                    </ul>
                  </div>

                  <div className="glass-panel" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.8rem', marginBottom: '8px' }}>
                      <Percent size={16} color="var(--color-rose)" />
                      <strong>2. Tributación de IVA (LIVA Art. 20)</strong>
                    </div>
                    <ul style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', paddingLeft: '14px', lineHeight: 1.5 }}>
                      <li>Sesiones del psicólogo están <strong>exentas de IVA</strong> por su naturaleza médica.</li>
                      <li>El uso del software SaaS de la plataforma sí devenga el <strong>21% de IVA</strong>.</li>
                      <li>Facturación separada mediante Split Payments de Stripe.</li>
                    </ul>
                  </div>

                  <div className="glass-panel" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.8rem', marginBottom: '8px' }}>
                      <UserCheck size={16} color="var(--color-rose)" />
                      <strong>3. Evitar Riesgo de Falsos Autónomos</strong>
                    </div>
                    <ul style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', paddingLeft: '14px', lineHeight: 1.5 }}>
                      <li>Stripe Connect Split: El cobro se realiza directamente a la cuenta del psicólogo.</li>
                      <li>Áncora no recauda el honorario clínico, solo recibe una comisión de software.</li>
                      <li>El terapeuta define sus propios precios y horarios libremente.</li>
                    </ul>
                  </div>
                </div>

                <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-sm)', color: 'var(--color-rose)', fontSize: '0.75rem', lineHeight: 1.5 }}>
                  <strong>Regulación Publicitaria (RD 1907/1996):</strong> Quedan estrictamente prohibidas las reseñas y estrellas de calidad clínica del psicólogo de forma pública (para evitar la promoción engañosa de tratamientos). Las valoraciones de la plataforma se limitarán únicamente a la calidad técnica de la videollamada y del soporte de la app.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= DOBLE SAAS & ROI ================= */}
        {activeTab === 'saas' && (
          <div className="grid-1-2" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
            {/* Formulario Lateral */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Coins size={18} color="rgb(168,85,247)" />
                <h4 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700 }}>Parámetros Financieros</h4>
              </div>

              {/* Suscripción Paciente */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  SaaS Paciente: <strong>{saasPaciente} €/mes</strong>
                </label>
                <input 
                  type="range" 
                  min="19" 
                  max="49" 
                  step="2" 
                  value={saasPaciente} 
                  onChange={(e) => setSaasPaciente(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'rgb(168,85,247)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>19 €</span>
                  <span>49 €</span>
                </div>
              </div>

              {/* Suscripción Psicólogo */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  SaaS Psicólogo (Básico): <strong>{saasPsicologo} €/mes</strong>
                </label>
                <input 
                  type="range" 
                  min="29" 
                  max="99" 
                  step="5" 
                  value={saasPsicologo} 
                  onChange={(e) => setSaasPsicologo(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'rgb(168,85,247)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>29 €</span>
                  <span>99 €</span>
                </div>
              </div>

              {/* Número de Pacientes */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Pacientes de Pago: <strong>{numPacientes}</strong>
                </label>
                <input 
                  type="range" 
                  min="50" 
                  max="1000" 
                  step="50" 
                  value={numPacientes} 
                  onChange={(e) => setNumPacientes(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'rgb(168,85,247)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>50</span>
                  <span>1000</span>
                </div>
              </div>

              {/* Número de Psicólogos */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Psicólogos Activos SaaS: <strong>{numPsicologos}</strong>
                </label>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  step="5" 
                  value={numPsicologos} 
                  onChange={(e) => setNumPsicologos(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'rgb(168,85,247)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>5</span>
                  <span>100</span>
                </div>
              </div>

              {/* Coste Hardware */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Inversión Inicial Hardware: <strong>{hardwareCost} €</strong>
                </label>
                <input 
                  type="range" 
                  min="5000" 
                  max="15000" 
                  step="500" 
                  value={hardwareCost} 
                  onChange={(e) => setHardwareCost(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'rgb(168,85,247)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>5.000 €</span>
                  <span>15.000 €</span>
                </div>
              </div>
            </div>

            {/* Contenido Agente */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <span className="badge" style={{ background: 'rgba(168,85,247,0.1)', color: 'rgb(168,85,247)', border: '1px solid rgba(168,85,247,0.2)' }}>
                      AGENTE 5: ESTRATEGIA DUAL-SAAS & FINANZAS
                    </span>
                    <h3 style={{ fontSize: '1.25rem', marginTop: '6px' }}>Modelo de Negocio Dual, Proyecciones de MRR y ROI del Hardware</h3>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  La economía de Áncora evoluciona de un simple marketplace a un modelo de suscripción dual **SaaS**. Cobramos al paciente por el diario emocional y la historia clínica portable, y al psicólogo por la infraestructura de Smart SOAP y gestión cifrada:
                </p>

                {/* KPIs Financieros */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  <div className="metric-card" style={{ borderTop: '3px solid rgb(168,85,247)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>{mrrTotal.toLocaleString()} €</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>MRR Total Estimado</span>
                  </div>

                  <div className="metric-card" style={{ borderTop: '3px solid rgb(168,85,247)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-emerald)' }}>{margenNetoMensual.toLocaleString(undefined, {maximumFractionDigits: 0})} €/mes</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Margen Neto Mensual</span>
                  </div>

                  <div className="metric-card" style={{ borderTop: '3px solid rgb(168,85,247)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-cyan)' }}>{roiHardware3Anos.toFixed(0)}%</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>ROI Hardware a 3 años</span>
                  </div>

                  <div className="metric-card" style={{ borderTop: '3px solid rgb(168,85,247)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                      {tiempoAmortizacionMeses < 1 ? 'Instantánea' : `${tiempoAmortizacionMeses.toFixed(1)} meses`}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Tiempo de Amortización</span>
                  </div>
                </div>

                {/* Break-Even Simulator */}
                <h4 style={{ fontSize: '0.9rem', marginTop: '24px', marginBottom: '12px', fontWeight: 700 }}>Punto de Equilibrio (Break-Even): {breakEvenPacientes} Pacientes</h4>
                <div style={{ background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                    <span>Punto de Equilibrio</span>
                    <span>Pacientes Requeridos: {breakEvenPacientes} / {numPacientes}</span>
                  </div>
                  <div style={{ height: '14px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      background: 'linear-gradient(90deg, var(--color-cyan), var(--color-emerald))', 
                      width: `${Math.min(100, (numPacientes / breakEvenPacientes) * 50)}%`,
                      borderRadius: '10px'
                    }}></div>
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
                    Con una base de costes fijos estimada de <strong>{costesVariablesSaaS.toLocaleString(undefined, {maximumFractionDigits: 0})} €/mes</strong> (Stripe Connect fees, hosting, mantenimiento de la GPU local y cuota de compliance DPO), la plataforma alcanza su punto de rentabilidad con solo <strong>{breakEvenPacientes} pacientes</strong> en el plan SaaS de {saasPaciente} €/mes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= NAMING & MARKETING ================= */}
        {activeTab === 'marketing' && (
          <div className="grid-1-2" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
            {/* Formulario Lateral */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Lightbulb size={18} color="rgb(236,72,153)" />
                <h4 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700 }}>Canal de Captación</h4>
              </div>

              {/* Selector de canal */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Canal de Marketing Prioritario:
                </label>
                <select 
                  value={marketingCanal} 
                  onChange={(e) => setMarketingCanal(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '4px', background: 'var(--background-tertiary)', border: '1px solid var(--border)', color: '#ffffff', fontSize: '0.8rem', outline: 'none' }}
                >
                  <option value="organico">Psicólogo invita a Paciente (CAC: 5€)</option>
                  <option value="b2b2c">B2B2C Psiquiatras (CAC: 25€)</option>
                  <option value="seo">Contenido Orgánico SEO (CAC: 40€)</option>
                  <option value="ads">Publicidad Meta/Google (CAC: 100€)</option>
                </select>
              </div>

              {/* Churn Rate */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Tasa de Abandono (Churn): <strong>{marketingChurn} %/mes</strong>
                </label>
                <input 
                  type="range" 
                  min="5" 
                  max="25" 
                  step="1" 
                  value={marketingChurn} 
                  onChange={(e) => setMarketingChurn(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'rgb(236,72,153)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>5% (Fiel)</span>
                  <span>25% (Volátil)</span>
                </div>
              </div>
            </div>

            {/* Contenido Agente */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '20px' }}>
                  <div>
                    <span className="badge" style={{ background: 'rgba(236,72,153,0.1)', color: 'rgb(236,72,153)', border: '1px solid rgba(236,72,153,0.2)' }}>
                      AGENTE 6: BRANDING, NAMING & ADQUISICIÓN
                    </span>
                    <h3 style={{ fontSize: '1.25rem', marginTop: '6px' }}>Estrategia de Naming Global y Modelo de Captación Ponderado</h3>
                  </div>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Dado el modelo de historia clínica portable, el moat de Áncora reside en el posicionamiento comercial: **"No vuelvas a empezar tu terapia desde cero"**. El ratio LTV/CAC define qué canales de adquisición priorizaremos para crecer orgánicamente:
                </p>

                {/* KPIs de Adquisición */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '16px' }}>
                  <div className="metric-card" style={{ borderTop: '3px solid rgb(236,72,153)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>{cacCanal} €</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>CAC del Canal Seleccionado</span>
                  </div>

                  <div className="metric-card" style={{ borderTop: '3px solid rgb(236,72,153)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>{vidaMediaUsuario.toFixed(1)} meses</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Vida Media del Paciente (LT)</span>
                  </div>

                  <div className="metric-card" style={{ borderTop: '3px solid rgb(236,72,153)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>{ltvBruto.toFixed(0)} €</span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>LTV del Paciente</span>
                  </div>

                  <div className="metric-card" style={{ borderTop: '3px solid rgb(236,72,153)', background: 'var(--background-tertiary)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: ratioLtvCac > 5 ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                      {ratioLtvCac.toFixed(1)} x
                    </span>
                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Ratio LTV / CAC</span>
                  </div>
                </div>

                {/* Tabla de Naming Global */}
                <h4 style={{ fontSize: '0.9rem', marginTop: '24px', marginBottom: '12px', fontWeight: 700 }}>Valoración de Alternativas de Naming Global</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Evaluación de nombres comerciales globales para abarcar múltiples idiomas tras la propuesta del agente de marketing (manteniendo <strong>{selectedName}</strong> de referencia en la UI):
                </p>
                
                <div className="table-wrap">
                  <table className="data-table" style={{ width: '100%', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--sovereign-blue)' }}>
                        <th style={{ padding: '8px 12px' }}>Nombre</th>
                        <th style={{ padding: '8px 12px' }}>Semántica y Concepto</th>
                        <th style={{ padding: '8px 12px' }}>Fórmula / Sonoridad</th>
                        <th style={{ padding: '8px 12px' }}>Dominio sugerido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {namingAlternatives.map((alt) => (
                        <tr 
                          key={alt.name} 
                          onClick={() => setSelectedName(alt.name)} 
                          style={{ cursor: 'pointer', background: selectedName === alt.name ? 'rgba(236,72,153,0.05)' : 'none' }}
                        >
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: selectedName === alt.name ? 'rgb(236,72,153)' : '#ffffff' }}>
                            {alt.name} {selectedName === alt.name ? '✓' : ''}
                          </td>
                          <td style={{ padding: '8px 12px' }}>{alt.semantic}</td>
                          <td style={{ padding: '8px 12px' }}>{alt.sound}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--color-cyan)', fontSize: '0.75rem' }}>{alt.domain}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
