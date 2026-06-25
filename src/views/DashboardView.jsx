import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Heart, 
  Brain, 
  Landmark, 
  FileText, 
  Activity, 
  AlertTriangle, 
  TrendingDown, 
  Clock,
  CreditCard,
  RefreshCw,
  Sparkles,
  Calendar,
  Star,
  ExternalLink
} from 'lucide-react';

export default function DashboardView({ user, profile, dailyMoodToday, totalDebts, appMode, onProfileUpdated }) {
  // Estado local para cargar gastos y calcular caja libre real en el panel
  const [cajaLibreData, setCajaLibreData] = useState({ efeSalary: 2800, monthlyExpenses: 1500 });
  const [moodHistory, setMoodHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Estados locales para el pago del onboarding
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    if (!user) return;

    const loadDashboardData = async () => {
      try {
        // 1. Cargar gastos (relevante para Emilio)
        if (!appMode?.isGeneric) {
          const { data: expData } = await supabase
            .from('expenses')
            .select('amount');
          const expensesTotal = (expData || []).reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
          const savedSalary = parseFloat(localStorage.getItem('efe_salary')) || 2800;
          
          setCajaLibreData({
            efeSalary: savedSalary,
            monthlyExpenses: expensesTotal
          });
        }

        // 2. Cargar historial de diario (últimos 3 días) - relevante para ambos si tienen datos
        setHistoryLoading(true);
        const { data: moodData } = await supabase
          .from('daily_moods')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(3);
        setMoodHistory(moodData || []);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadDashboardData();
  }, [user, appMode, dailyMoodToday]);

  const handlePerformPayment = async (e) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      alert("Por favor, rellena todos los campos de la tarjeta de crédito.");
      return;
    }
    
    setPaymentLoading(true);
    try {
      // Simular retardo de red de 2 segundos para dar realismo a Stripe Connect
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const nextConfig = {
        ...(profile?.app_config || {}),
        onboarding_paid: true
      };

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          role: profile?.role || 'emilio',
          app_config: nextConfig,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setPaymentSuccess(true);
      setTimeout(() => {
        onProfileUpdated?.({ ...profile, app_config: nextConfig });
      }, 1000);
    } catch (err) {
      console.error("Error al procesar pago simulado:", err);
      alert("Error al procesar el pago: " + err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  // RENDER PARA USUARIOS GENÉRICOS (Aislamiento de Privacidad & Triaje Clínico de ÁNCORA)
  if (appMode?.isGeneric) {
    const conclusiones = profile?.contexto_terapeutico?.conclusiones || [];
    const triageConclusion = conclusiones.find(c => 
      c.toLowerCase().includes('triaje') || c.toLowerCase().includes('cribado') || c.toLowerCase().includes('scoring')
    );

    let triageState = 'pending'; // 'pending' | 'viable' | 'risk_high'
    let triageDetails = '';

    if (triageConclusion) {
      triageDetails = triageConclusion;
      if (triageConclusion.toLowerCase().includes('grave') || triageConclusion.toLowerCase().includes('crítico')) {
        triageState = 'risk_high';
      } else {
        triageState = 'viable';
      }
    }

    const onboardingPaid = profile?.app_config?.onboarding_paid === true;

    return (
      <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
        
        {/* CASO A: TRIAJE PENDIENTE */}
        {triageState === 'pending' && (
          <div className="glass-panel hero-card" style={{ padding: '28px', borderTop: '4px solid var(--color-amber)', background: 'rgba(245, 158, 11, 0.02)' }}>
            <div className="hero-glow" style={{ background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div className="flex-center animate-pulse-soft" style={{
                width: '54px',
                height: '54px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                color: 'var(--color-amber)'
              }}>
                <Brain size={28} />
              </div>
              <div style={{ flex: 1 }}>
                <span className="badge badge-amber" style={{ marginBottom: '6px' }}>Cribado Clínico Obligatorio</span>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '4px', color: '#ffffff', fontWeight: 800 }}>Bienvenido a ÁNCORA: Onboarding Clínico</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Tu espacio privado de salud mental está listo. Para completar tu diagnóstico inicial de ansiedad (**GAD-7**) y depresión (**PHQ-9**), por favor inicia tu triaje conversacional chateando con Walter.
                </p>
              </div>
            </div>

            <div className="grid-3" style={{ marginTop: '28px', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.01)' }}>
                <span className="badge badge-cyan" style={{ marginBottom: '12px' }}>Contexto</span>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Añade tu base</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.35 }}>
                  Sube notas, PDF, imágenes o texto para construir un resumen útil y privado para que Walter trabaje contigo.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.01)' }}>
                <span className="badge badge-emerald" style={{ marginBottom: '12px' }}>Chat</span>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Inicia tu triaje</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.35 }}>
                  Habla de tus niveles de estrés y sueño. Walter guiará las preguntas de triaje de forma discreta y empática.
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255,255,255,0.01)' }}>
                <span className="badge badge-amber" style={{ marginBottom: '12px' }}>Diario</span>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700' }}>Registra tu estado</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.35 }}>
                  Registra niveles de estrés, ansiedad o notas personales para monitorizar tu progreso con el tiempo.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CASO B: RIESGO ALTO (DERIVACIÓN INMEDIATA) */}
        {triageState === 'risk_high' && (
          <div className="glass-panel hero-card" style={{ padding: '28px', borderTop: '4px solid var(--color-rose)', background: 'rgba(244, 63, 94, 0.02)' }}>
            <div className="hero-glow" style={{ background: 'radial-gradient(circle, rgba(244, 63, 94, 0.08) 0%, transparent 70%)' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              <div className="flex-center animate-pulse-soft" style={{
                width: '54px',
                height: '54px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(244, 63, 94, 0.08)',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                color: 'var(--color-rose)'
              }}>
                <AlertTriangle size={28} />
              </div>
              <div style={{ flex: 1 }}>
                <span className="badge badge-rose" style={{ marginBottom: '6px' }}>Recomendación de Derivación Síncrona</span>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '4px', color: '#ffffff', fontWeight: 800 }}>Atención Clínica Requerida</h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {triageDetails}. Te recomendamos encarecidamente coordinar una sesión síncrona de urgencia o presencial con tu psicólogo de referencia. Si sufres una crisis severa, llama inmediatamente al **024** (atención al suicidio) o acude a urgencias médicas.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CASO C: TRIAJE VIABLE Y PENDIENTE DE PAGO (FORMULARIO DE PAGO SIMULADO) */}
        {triageState === 'viable' && !onboardingPaid && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Banner de Apto */}
            <div className="glass-panel" style={{ padding: '24px 28px', borderTop: '4px solid var(--color-emerald)', background: 'rgba(16, 185, 129, 0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div className="flex-center animate-pulse-soft" style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  color: 'var(--color-emerald)'
                }}>
                  <ShieldCheck size={28} />
                </div>
                <div style={{ flex: 1 }}>
                  <span className="badge badge-emerald" style={{ marginBottom: '6px' }}>Triaje Completado — Apto para Seguimiento</span>
                  <h2 style={{ fontSize: '1.2rem', marginBottom: '4px', color: '#ffffff', fontWeight: 800 }}>Diagnóstico Inicial Favorable</h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: 0 }}>
                    {triageDetails}. Tu perfil de cribado indica niveles de riesgo moderados/leves, lo que te hace idóneo para el modelo de terapia asíncrona guiada de ÁNCORA.
                  </p>
                </div>
              </div>
            </div>

            {/* Layout de Compra Dual */}
            <div className="grid-2" style={{ gap: '24px' }}>
              
              {/* Explicación de Valor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Activación de Onboarding & 1ª Consulta
                </h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Para activar tu expediente clínico virtual y asignarte formalmente a tu psicólogo clínico de referencia, realizamos un cobro único promocional subvencionado por la plataforma.
                </p>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: '#ffffff', fontWeight: '600' }}>Onboarding Promocional Completo</span>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--color-emerald)' }}>49,00 €</strong>
                  </div>
                  
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>SaaS Software Licencia (Ancora Clinic SL, IVA incl.):</span>
                      <span>18,15 €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Consulta Clínica Médica (Psicólogo, Exento IVA):</span>
                      <span>30,85 €</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Star size={14} color="var(--color-emerald)" />
                    <span>Incluye 1ª Sesión de Terapia virtual de 1h de duración.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Star size={14} color="var(--color-emerald)" />
                    <span>Incluye una semana completa de Diario IA guiado por Walter.</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Star size={14} color="var(--color-emerald)" />
                    <span>Historia clínica portable estructurada en DOCKER/Supabase.</span>
                  </div>
                </div>
              </div>

              {/* Formulario de Pago de Stripe */}
              <div className="glass-panel" style={{ padding: '24px', border: '1px solid rgba(6,182,212,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CreditCard size={16} color="var(--color-cyan)" />
                    Pasarela de Pago Stripe Connect
                  </h4>
                  <span className="badge badge-cyan" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>Sandbox</span>
                </div>

                {paymentSuccess ? (
                  <div className="flex-center" style={{ flexDirection: 'column', gap: '12px', padding: '40px 0', textAlign: 'center' }}>
                    <div className="flex-center animate-pulse-soft" style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', color: 'var(--color-emerald)' }}>
                      <ShieldCheck size={26} />
                    </div>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--color-emerald)' }}>¡Pago Procesado con Éxito!</strong>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Stripe Connect ha dividido el pago y generado tu expediente. Redirigiendo...
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handlePerformPayment} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.7rem' }}>Titular de la Tarjeta</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={cardName} 
                        onChange={(e) => setCardName(e.target.value)} 
                        placeholder="Ej. José Naranjo Fernández" 
                        required 
                        style={{ height: '36px', fontSize: '0.75rem' }}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Número de Tarjeta</span>
                        <span style={{ fontSize: '0.6rem', color: 'var(--color-cyan)', cursor: 'pointer', fontWeight: 700 }} onClick={() => setCardNumber('4242424242424242')}>Autocompletar prueba</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <CreditCard size={15} color="var(--text-tertiary)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                        <input 
                          type="text" 
                          className="form-input" 
                          value={cardNumber} 
                          onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())} 
                          maxLength="19"
                          placeholder="4242 4242 4242 4242" 
                          required 
                          style={{ height: '36px', fontSize: '0.75rem', paddingLeft: '32px' }}
                        />
                      </div>
                    </div>

                    <div className="grid-2" style={{ gap: '10px' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>Caducidad</label>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={cardExpiry} 
                          onChange={(e) => setCardExpiry(e.target.value)} 
                          placeholder="MM/AA" 
                          maxLength="5"
                          required 
                          style={{ height: '36px', fontSize: '0.75rem', textAlign: 'center' }}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.7rem' }}>CVC / CVV</label>
                        <input 
                          type="password" 
                          className="form-input" 
                          value={cardCvc} 
                          onChange={(e) => setCardCvc(e.target.value)} 
                          placeholder="123" 
                          maxLength="3"
                          required 
                          style={{ height: '36px', fontSize: '0.75rem', textAlign: 'center' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(6,182,212,0.03)', border: '1px solid rgba(6,182,212,0.1)', borderRadius: '6px', padding: '10px', fontSize: '0.62rem', color: 'var(--text-secondary)', lineHeight: 1.35, marginTop: '4px' }}>
                      <ShieldCheck size={16} color="var(--color-cyan)" style={{ flexShrink: 0 }} />
                      <span>Pago dividido en origen de forma segura por Stripe Connect. Cumple con la normativa PCI-DSS.</span>
                    </div>

                    <button type="submit" className="btn btn-emerald" disabled={paymentLoading} style={{ height: '40px', fontSize: '0.78rem', width: '100%', marginTop: '10px' }}>
                      {paymentLoading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                          <RefreshCw size={14} className="animate-spin" />
                          Procesando pago seguro en Stripe...
                        </span>
                      ) : (
                        <span>Pagar 49,00 € & Activar Seguimiento</span>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CASO D: TRIAJE VIABLE Y PAGO REALIZADO (DASHBOARD DEL PACIENTE ACTIVO) */}
        {triageState === 'viable' && onboardingPaid && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Header del Paciente */}
            <div className="glass-panel hero-card" style={{ padding: '20px 24px', borderTop: '4px solid var(--color-emerald)' }}>
              <div className="hero-glow" style={{ background: 'radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%)' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div className="flex-center" style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', color: 'var(--color-emerald)' }}>
                    <Brain size={24} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                      MI PANEL DE SEGUIMIENTO CLÍNICO
                    </h2>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                      Suscripción Activa — Plan Esencial. Diagnóstico inicial favorable.
                    </p>
                  </div>
                </div>

                <span className="badge badge-emerald" style={{ padding: '5px 10px', fontSize: '0.68rem' }}>
                  Suscripción Activa
                </span>
              </div>
            </div>

            {/* Grid Principal */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              
              {/* Bloque Terapeuta Asignado */}
              <div className="glass-panel" style={{ padding: '16px', borderTop: '4px solid var(--color-emerald)', background: 'rgba(16, 185, 129, 0.01)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
                    👩‍⚕️ Psicólogo Asignado
                  </span>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                    <div className="flex-center" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                      <User size={20} color="var(--color-emerald)" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: '#ffffff', margin: 0 }}>Dra. Lucía Gómez García</h4>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Colegiada COP-M-31415</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.35, margin: 0 }}>
                    Tu terapeuta supervisa de forma asíncrona tu diario y notas del contexto. Programará intervenciones clínicas si detecta desviaciones significativas en tu scoring.
                  </p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)' }}>
                    <Calendar size={12} /> Próxima sesión:
                  </span>
                  <strong style={{ color: '#ffffff' }}>Jueves 11 de Jun, 17:00h</strong>
                </div>
              </div>

              {/* Bloque Pautas de Auto-Regulación */}
              <div className="glass-panel" style={{ padding: '16px', borderTop: '4px solid var(--color-cyan)', background: 'rgba(6, 182, 212, 0.01)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
                    📋 Pautas Recomendadas
                  </span>
                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 6px 0', color: '#ffffff' }}>
                    Recomendaciones Clínicas Activas
                  </h3>
                  
                  <ul style={{ paddingLeft: '14px', margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <li>Practicar 10 min de respiración diafragmática al levantarse.</li>
                    <li>Registrar el Diario de Sensaciones a diario con Walter.</li>
                    <li>Evitar estímulos estresores en las 2 horas previas a dormir.</li>
                  </ul>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', marginTop: '14px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                  <ShieldCheck size={12} color="var(--color-cyan)" />
                  <span>Actualizado por terapeuta hace 2 días</span>
                </div>
              </div>

              {/* Bloque Estado del Diario IA */}
              <div className="glass-panel" style={{ padding: '16px', borderTop: '4px solid var(--color-amber)', background: 'rgba(245, 158, 11, 0.01)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      🧠 Diario IA y Sensaciones
                    </span>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: dailyMoodToday ? 'var(--color-emerald)' : 'var(--color-rose)',
                      boxShadow: `0 0 8px ${dailyMoodToday ? 'var(--color-emerald)' : 'var(--color-rose)'}`
                    }}></div>
                  </div>

                  <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 4px 0', color: '#ffffff' }}>
                    Registro de hoy
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.35 }}>
                    {dailyMoodToday 
                      ? 'Has completado tu registro de sensaciones diario. Walter ha actualizado tu gráfica clínica.' 
                      : 'Pendiente de registrar hoy. Walter necesita supervisar tu ansiedad clínica.'}
                  </p>

                  {dailyMoodToday ? (
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.72rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Ansiedad Hoy:</span>
                        <strong style={{ color: dailyMoodToday.anxiety_level > 7 ? 'var(--color-rose)' : '#ffffff' }}>
                          {dailyMoodToday.anxiety_level}/10
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Impulsividad:</span>
                        <strong style={{ color: dailyMoodToday.impulsivity_level > 7 ? 'var(--color-rose)' : '#ffffff' }}>
                          {dailyMoodToday.impulsivity_level}/10
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '8px', background: 'rgba(244, 63, 94, 0.04)', border: '1px dashed rgba(244, 63, 94, 0.2)', borderRadius: '6px', fontSize: '0.7rem', textAlign: 'center', color: 'var(--color-rose)', fontWeight: 700 }}>
                      ⚠️ Registro Diario Pendiente
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', marginTop: '14px' }}>
                  <span style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                    Días Recientes
                  </span>
                  {historyLoading ? (
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>Cargando...</span>
                  ) : moodHistory.length === 0 ? (
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>Sin registros históricos.</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      {moodHistory.slice(0, 2).map(mood => (
                        <div key={mood.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                          <span>📅 {mood.date}</span>
                          <span>Ans: <strong style={{ color: '#ffffff' }}>{mood.anxiety_level}</strong> | Imp: <strong style={{ color: '#ffffff' }}>{mood.impulsivity_level}</strong></span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    );
  }

  // RENDER PREMIUM PARA EMILIO (OWNER / TERAPEUTA)
  const cajaLibre = cajaLibreData.efeSalary - cajaLibreData.monthlyExpenses;
  const isCajaPositive = cajaLibre >= 0;

  return (
    <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '30px' }}>
      
      {/* Banner Principal de Bienvenida */}
      <div className="glass-panel hero-card" style={{ padding: '20px 24px' }}>
        <div className="hero-glow"></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="flex-center animate-pulse-soft" style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: 'var(--color-emerald)'
            }}>
              <Brain size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.02em', color: '#ffffff', margin: 0 }}>
                DASHBOARD CLÍNICO DE SEGUIMIENTO
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Área central de control y blindaje cognitivo de ÁNCORA.
              </p>
            </div>
          </div>
          
          <div className="badge badge-emerald" style={{ padding: '6px 12px', fontSize: '0.68rem', fontWeight: 700 }}>
            <Heart size={12} style={{ marginRight: '4px' }} />
            <span>Privacidad Protegida</span>
          </div>
        </div>
      </div>

      {/* Grid de 4 Resúmenes Premium */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* BLOQUE 1: SENSACIONES (ÁREA PSICOLÓGICA) */}
        <div className="glass-panel" style={{ padding: '16px', borderTop: '4px solid var(--color-emerald)', background: 'rgba(16, 185, 129, 0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🧠 Área Psicológica
            </span>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: dailyMoodToday ? 'var(--color-emerald)' : 'var(--color-rose)',
              boxShadow: `0 0 8px ${dailyMoodToday ? 'var(--color-emerald)' : 'var(--color-rose)'}`
            }}></div>
          </div>

          <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 4px 0', color: '#ffffff' }}>
            Registro de Sensaciones
          </h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.35 }}>
            {dailyMoodToday 
              ? 'Has completado el registro del día. Walter ha integrado tus datos en la base clínica.' 
              : 'Pendiente de registrar hoy. Walter necesita supervisar tu amígdala antes de que operes.'}
          </p>

          {dailyMoodToday ? (
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.72rem', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ansiedad Hoy:</span>
                <strong style={{ color: dailyMoodToday.anxiety_level > 7 ? 'var(--color-rose)' : '#ffffff' }}>
                  {dailyMoodToday.anxiety_level}/10
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Impulsividad:</span>
                <strong style={{ color: dailyMoodToday.impulsivity_level > 7 ? 'var(--color-rose)' : '#ffffff' }}>
                  {dailyMoodToday.impulsivity_level}/10
                </strong>
              </div>
            </div>
          ) : (
            <div style={{ padding: '10px', background: 'rgba(244, 63, 94, 0.05)', border: '1px dashed rgba(244, 63, 94, 0.2)', borderRadius: '6px', fontSize: '0.72rem', textAlign: 'center', color: 'var(--color-rose)', fontWeight: 700, marginBottom: '10px' }}>
              ⚠️ Registro Diario Pendiente
            </div>
          )}

          {/* Micro Historial */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
            <span style={{ fontSize: '0.58rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Historial de Días Recientes
            </span>
            {historyLoading ? (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Cargando...</span>
            ) : moodHistory.length === 0 ? (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Sin registros históricos.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {moodHistory.map(mood => (
                  <div key={mood.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                    <span>📅 {mood.date}</span>
                    <span>Ans: <strong style={{ color: '#ffffff' }}>{mood.anxiety_level}</strong> | Imp: <strong style={{ color: '#ffffff' }}>{mood.impulsivity_level}</strong></span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>



        {/* BLOQUE 3: ESCUDO LABORAL (INSS) */}
        <div className="glass-panel" style={{ padding: '16px', borderTop: '4px solid var(--color-amber)', background: 'rgba(245, 158, 11, 0.01)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--color-amber)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              🛡️ Escudo Laboral
            </span>
            <FileText size={14} color="var(--color-amber)" />
          </div>

          <h3 style={{ fontSize: '0.92rem', fontWeight: 800, margin: '0 0 4px 0', color: '#ffffff' }}>
            Situación EFE / INSS
          </h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.35 }}>
            Garantía de ingresos pasivos mensuales mediante protección del puesto de trabajo.
          </p>

          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Ingreso EFE:</span>
              <strong style={{ color: 'var(--color-emerald)' }}>3.300 €/mes</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Estado de Baja:</span>
              <strong style={{ color: 'var(--color-emerald)' }}>Activa y Justificada</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Tribunal INSS:</span>
              <strong style={{ color: '#ffffff' }}>Protegido por Informes</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
            <ShieldCheck size={12} color="var(--color-amber)" />
            <span>Evidencia médica de Agorafobia activa.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
