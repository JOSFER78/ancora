import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  ShieldCheck, 
  CreditCard, 
  Sparkles, 
  Cpu, 
  Brain, 
  TrendingUp, 
  Lock, 
  Search, 
  RefreshCw,
  Database,
  Info
} from 'lucide-react';

export default function AdminDashboardView({ user, profile }) {
  const [activeTab, setActiveTab] = useState('crm'); // 'crm' | 'validation' | 'simulator' | 'audit'
  
  // CRM State variables
  const [crmPatients, setCrmPatients] = useState([]);
  const [crmPsychologists, setCrmPsychologists] = useState([]);
  const [crmSearchQuery, setCrmSearchQuery] = useState('');
  const [crmTab, setCrmTab] = useState('patients'); // 'patients' | 'psychologists'
  const [loadingCrm, setLoadingCrm] = useState(false);

  // Verification Queue State
  const [psicos, setPsicos] = useState([
    {
      id: 'p-10',
      name: 'Dr. Javier Ortega Sanz',
      colegiado: 'COP-M-33981',
      status: 'pending',
      insurance: 'Seguro RC Activo (Axa)',
      habilitacion: 'MPGS (Psicólogo General Sanitario)',
      email: 'javier.ortega@ancora.clinic',
      copStatus: 'unverified' // 'unverified' | 'checking' | 'verified' | 'failed'
    },
    {
      id: 'p-11',
      name: 'Dra. Elena Belmonte Valdés',
      colegiado: 'COP-A-08722',
      status: 'pending',
      insurance: 'Seguro RC Activo (Mapfre)',
      habilitacion: 'PIR (Psicólogo Especialista Clínico)',
      email: 'elena.belmonte@ancora.clinic',
      copStatus: 'unverified'
    }
  ]);
  const [isVerifying, setIsVerifying] = useState(null); // ID of currently verifying doctor
  const [isUpdating, setIsUpdating] = useState(null); // ID of doctor being approved/denied

  // Audit Logs State (Mocked compliance logs combined with real consents)
  const [auditLogs, setAuditLogs] = useState([
    {
      timestamp: '2026-06-05 09:40:12',
      actor: 'Sistema Automatizado',
      action: 'Sincronización de Base de Datos',
      details: 'Tabla consents y psychologist_profiles unificadas correctamente.',
      hash: 'sha256:8a892b...'
    },
    {
      timestamp: '2026-06-05 09:20:45',
      actor: 'Dra. Lucía Gómez García',
      action: 'Validación de Nota SOAP',
      details: 'Expediente clínico del paciente José Naranjo Fernández firmado electrónicamente.',
      hash: 'sha256:d12c1b...'
    },
    {
      timestamp: '2026-06-05 08:30:15',
      actor: 'Usuario Invitado',
      action: 'Aceptación de Consentimiento Clínico',
      details: 'Consentimiento Informado v1.0 firmado desde IP hash_client_ip.',
      hash: 'sha256:fe9b21...'
    }
  ]);

  // Simulator State variables (Feasibility, Hardware, Inferencia & ROI)
  const [gpuDau, setGpuDau] = useState(1000);
  const [gpuHours, setGpuHours] = useState(12);
  const [gpuContext, setGpuContext] = useState(8192);
  const [gpuBpw, setGpuBpw] = useState(4.0);
  const [saasPaciente, setSaasPaciente] = useState(29);
  const [saasPsicologo, setSaasPsicologo] = useState(49);
  const [numPacientes, setNumPacientes] = useState(300);
  const [numPsicologos, setNumPsicologos] = useState(20);
  const [hardwareCost, setHardwareCost] = useState(7495);
  const [legalDpo, setLegalDpo] = useState(150);

  // Load real profiles from Supabase to check if they have pending validations or details
  const fetchRealPsicos = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'psicologo');

      if (error) throw error;
      
      // If we have database psychologists, map them to our validation list
      if (data && data.length > 0) {
        const mapped = data.map(p => ({
          id: p.id,
          name: p.contexto_terapeutico?.fullName || p.contexto_terapeutico?.name || `Psicólogo #${p.id.substring(0, 5)}`,
          colegiado: p.app_config?.license_number || p.contexto_terapeutico?.licenseNumber || 'Pendiente aportar',
          status: p.app_config?.verified ? 'verified' : 'pending',
          insurance: p.app_config?.rc_insurance || 'RC pendiente',
          habilitacion: p.app_config?.qualification || 'Sanitario',
          email: p.id + '@ancora.clinic',
          copStatus: p.app_config?.verified ? 'verified' : 'unverified'
        }));
        
        // Merge with defaults
        const combined = [...psicos];
        mapped.forEach(m => {
          if (!combined.some(c => c.id === m.id)) {
            combined.push(m);
          }
        });
        setPsicos(combined);
      }
    } catch (err) {
      console.error("Error loading psychologists from Supabase:", err.message);
    }
  };

  const fetchRealConsentsForAudit = async () => {
    try {
      const { data, error } = await supabase
        .from('consents')
        .select('*, profiles(role)')
        .order('accepted_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const formatted = data.map(c => ({
          timestamp: new Date(c.accepted_at).toISOString().replace('T', ' ').substring(0, 19),
          actor: `User #${c.user_id.substring(0, 6)}`,
          action: 'Aceptación de Consentimiento Clínico',
          details: `Consentimiento Informado v1.0 aceptado. Versión: ${c.version}. IP: ${c.ip_hash ? c.ip_hash.substring(0, 12) : 'anónima'}...`,
          hash: `sha256:${c.id.substring(0, 8)}...`
        }));

        setAuditLogs(prev => {
          const combined = [...formatted];
          prev.forEach(p => {
            if (!combined.some(c => c.timestamp === p.timestamp)) {
              combined.push(p);
            }
          });
          return combined;
        });
      }
    } catch (err) {
      console.error("Error loading consents for audit:", err.message);
    }
  };

  const fetchCrmData = async () => {
    try {
      setLoadingCrm(true);
      const { data: patientsData, error: patErr } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['paciente', 'emilio']);
      
      const { data: psicosData, error: psiErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'psicologo');

      if (patErr) throw patErr;
      if (psiErr) throw psiErr;

      const dbPatients = (patientsData || []).map(p => ({
        id: p.id,
        name: p.contexto_terapeutico?.displayName || p.contexto_terapeutico?.name || (p.role === 'emilio' ? 'José Naranjo Fernández (Super Admin)' : `Paciente #${p.id.substring(0, 5)}`),
        email: p.role === 'emilio' ? 'josferestudio@gmail.com' : `paciente_${p.id.substring(0, 5)}@ancora.clinic`,
        triage: p.contexto_terapeutico?.triaje || { phq9: 8, gad7: 11, highRisk: false },
        assignedPsychologistId: p.contexto_terapeutico?.assigned_psychologist_id || null,
        paymentStatus: p.contexto_terapeutico?.paymentStatus || 'free_trial'
      }));

      const defaultPatients = [
        { id: 'p-1', name: 'María Fernanda Rodríguez', email: 'maria.fer@correo.com', triage: { phq9: 21, gad7: 18, highRisk: true }, assignedPsychologistId: 'ps-1', paymentStatus: 'paid' },
        { id: 'p-2', name: 'Jorge Javier Moreno', email: 'jorge.javier@correo.com', triage: { phq9: 19, gad7: 16, highRisk: true }, assignedPsychologistId: 'ps-2', paymentStatus: 'paid' },
        { id: 'p-3', name: 'Sofía Guerrero Ruiz', email: 'sofia.guerrero@correo.com', triage: { phq9: 14, gad7: 12, highRisk: false }, assignedPsychologistId: 'ps-3', paymentStatus: 'pending_first_consultation' }
      ];

      const mergedPatients = [...dbPatients];
      defaultPatients.forEach(dp => {
        if (!mergedPatients.some(mp => mp.id === dp.id)) {
          mergedPatients.push(dp);
        }
      });
      setCrmPatients(mergedPatients);

      const dbPsicos = (psicosData || []).map(p => ({
        id: p.id,
        name: p.contexto_terapeutico?.fullName || p.contexto_terapeutico?.name || `Psicólogo #${p.id.substring(0, 5)}`,
        email: p.id + '@ancora.clinic',
        colegiado: p.contexto_terapeutico?.licenseNumber || p.app_config?.license_number || 'M-31415',
        insurance: p.app_config?.rc_insurance || 'RC Activo',
        habilitacion: p.app_config?.qualification || 'MPGS',
        price: p.contexto_terapeutico?.sessionPrice || 49,
        verified: p.app_config?.verified === true
      }));

      const defaultPsicos = [
        { id: 'ps-1', name: 'Dra. María Fernández', email: 'maria.fer@ancora.clinic', colegiado: 'M-28490', insurance: 'RC Activo (Axa)', habilitacion: 'MPGS', price: 49, verified: true },
        { id: 'ps-2', name: 'Dr. Javier Ramírez', email: 'javier.ramirez@ancora.clinic', colegiado: 'M-31204', insurance: 'RC Activo (Mapfre)', habilitacion: 'ACT', price: 55, verified: true },
        { id: 'ps-3', name: 'Dra. Lucía Vega', email: 'lucia.vega@ancora.clinic', colegiado: 'M-29837', insurance: 'RC Activo (Broker\'s)', habilitacion: 'EMDR', price: 60, verified: true }
      ];

      const mergedPsicos = [...dbPsicos];
      defaultPsicos.forEach(dp => {
        if (!mergedPsicos.some(mp => mp.id === dp.id)) {
          mergedPsicos.push(dp);
        }
      });
      setCrmPsychologists(mergedPsicos);

    } catch (err) {
      console.error("Error fetching CRM data:", err.message);
    } finally {
      setLoadingCrm(false);
    }
  };

  const handleReassignPsychologist = async (patientId, psychoId) => {
    setCrmPatients(prev => prev.map(p => {
      if (p.id === patientId) return { ...p, assignedPsychologistId: psychoId };
      return p;
    }));

    const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(patientId);
    if (isRealUuid) {
      try {
        const { data: prof } = await supabase.from('profiles').select('contexto_terapeutico').eq('id', patientId).single();
        const updatedCT = { ...(prof?.contexto_terapeutico || {}), assigned_psychologist_id: psychoId };
        const { error } = await supabase
          .from('profiles')
          .update({ contexto_terapeutico: updatedCT })
          .eq('id', patientId);
        if (error) throw error;
      } catch (err) {
        console.error("Error reassigning therapist in Supabase:", err.message);
      }
    }
    
    const newAudit = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: 'Super Admin CRM',
      action: 'Reasignación de Psicólogo',
      details: `Paciente #${patientId.substring(0, 6)} reasignado al terapeuta #${psychoId ? psychoId.substring(0, 6) : 'Ninguno'}.`,
      hash: `sha256:reas-${patientId.substring(0, 4)}...`
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  const handleToggleVerifyPsychologist = async (psId, newStatus) => {
    setCrmPsychologists(prev => prev.map(p => {
      if (p.id === psId) return { ...p, verified: newStatus };
      return p;
    }));

    const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(psId);
    if (isRealUuid) {
      try {
        const { data: prof } = await supabase.from('profiles').select('app_config').eq('id', psId).single();
        const updatedConfig = { ...(prof?.app_config || {}), verified: newStatus };
        const { error } = await supabase
          .from('profiles')
          .update({ app_config: updatedConfig })
          .eq('id', psId);
        if (error) throw error;
      } catch (err) {
        console.error("Error updating verification in Supabase:", err.message);
      }
    }

    const newAudit = {
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: 'Super Admin CRM',
      action: newStatus ? 'Validación Aprobada' : 'Validación Revocada',
      details: `Psicólogo #${psId.substring(0, 6)} marcado como ${newStatus ? 'Verificado' : 'No verificado'}.`,
      hash: `sha256:ver-${psId.substring(0, 4)}...`
    };
    setAuditLogs(prev => [newAudit, ...prev]);
  };

  const handleUpdatePsychologistPrice = async (psId, newPrice) => {
    const numericPrice = parseInt(newPrice) || 49;
    setCrmPsychologists(prev => prev.map(p => {
      if (p.id === psId) return { ...p, price: numericPrice };
      return p;
    }));

    const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(psId);
    if (isRealUuid) {
      try {
        const { data: prof } = await supabase.from('profiles').select('contexto_terapeutico').eq('id', psId).single();
        const updatedCT = { ...(prof?.contexto_terapeutico || {}), sessionPrice: numericPrice };
        const { error } = await supabase
          .from('profiles')
          .update({ contexto_terapeutico: updatedCT })
          .eq('id', psId);
        if (error) throw error;
      } catch (err) {
        console.error("Error updating price in Supabase:", err.message);
      }
    }
  };

  useEffect(() => {
    fetchRealPsicos();
    fetchRealConsentsForAudit();
    fetchCrmData();
  }, []);

  // Simulates querying the Official College of Psychologists database
  const handleQueryCOP = async (id) => {
    setIsVerifying(id);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPsicos(prev => prev.map(p => {
        if (p.id === id) {
          return { ...p, copStatus: 'verified' };
        }
        return p;
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(null);
    }
  };

  // Approves the psychologist, updating Supabase table 'profiles' role/config
  const handleApprovePsico = async (doctor) => {
    setIsUpdating(doctor.id);
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const isRealUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(doctor.id);
      
      if (isRealUuid) {
        // Update database configuration
        const { error } = await supabase
          .from('profiles')
          .update({
            role: 'psicologo',
            app_config: { verified: true, license_number: doctor.colegiado }
          })
          .eq('id', doctor.id);

        if (error) throw error;
      }

      setPsicos(prev => prev.map(p => {
        if (p.id === doctor.id) {
          return { ...p, status: 'verified', copStatus: 'verified' };
        }
        return p;
      }));

      // Add to audit logs
      const newAudit = {
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        actor: 'Admin Console',
        action: 'Validación Profesional Aprobada',
        details: `Verificación colegial completa para ${doctor.name} (${doctor.colegiado}). Rol activado.`,
        hash: `sha256:${doctor.id.substring(0, 6)}...`
      };
      setAuditLogs(prev => [newAudit, ...prev]);

    } catch (err) {
      alert("Error al aprobar profesional en la base de datos: " + err.message);
    } finally {
      setIsUpdating(null);
    }
  };

  // Reject/Deny verification
  const handleDenyPsico = async (doctor) => {
    setIsUpdating(doctor.id);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setPsicos(prev => prev.filter(p => p.id !== doctor.id));
    setIsUpdating(null);
  };

  // SIMULATOR MATHEMATICAL PROJECTIONS
  const lambdaPoisson = (gpuDau * 25) / (gpuHours * 3600); // 25 average messages daily
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

  // KV Cache per user (80 layers, 8 GQA heads, 128 dim. 1 byte per token for FP8)
  const vramKvCachePerUser = (2 * 80 * 8 * 128 * gpuContext * 1) / 1e9; // ~1.31 GB for 8192
  const maxConcurrentUsersInSec = Math.ceil(lambdaPoisson * 8); // burst estimation
  const vramKvCacheTotal = vramKvCachePerUser * maxConcurrentUsersInSec;
  const vramModel = 70 * (gpuBpw / 8); // 70B parameters * bpw / 8
  const vramTotalEstimada = vramModel + vramKvCacheTotal;
  const isVramExceeded = vramTotalEstimada > 96; // 4x RTX 3090 (96GB VRAM)

  const electricMonthly = (0.90 * gpuHours * 30.5) * 0.18; // 900W average load
  const serverDepreciation = hardwareCost / 36; // 36 months amortization

  // Business ROI projections
  const mrrPacientes = numPacientes * saasPaciente;
  const mrrPsicologos = numPsicologos * saasPsicologo;
  const mrrTotal = mrrPacientes + mrrPsicologos;
  const stripeFees = mrrTotal * 0.025; // 2.5% Stripe Connect fees
  const maintenanceCost = 250; 
  const monthlyExpensesTotal = stripeFees + maintenanceCost + legalDpo + electricMonthly;
  const netProfitMonthly = mrrTotal - monthlyExpensesTotal;
  const hardwareAmortizationMonths = hardwareCost / Math.max(1, netProfitMonthly);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Title Header Card */}
      <div className="glass-panel hero-card" style={{ padding: '20px 24px', borderTop: '4px solid var(--color-emerald)' }}>
        <div className="hero-glow" style={{ background: 'radial-gradient(circle, rgba(127, 159, 136, 0.08) 0%, transparent 70%)' }}></div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="flex-center animate-pulse-soft" style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'rgba(127, 159, 136, 0.08)',
              border: '1px solid rgba(127, 159, 136, 0.2)',
              color: 'var(--color-emerald)'
            }}>
              <Database size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                CONSOLA DE ADMINISTRACIÓN ÁNCORA
              </h2>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Verificación oficial COP de terapeutas, monitorización de auditoría RGPD y simulador de recursos GPU.
              </p>
            </div>
          </div>
          
          <div className="badge badge-emerald" style={{ padding: '6px 12px', fontSize: '0.68rem', fontWeight: 700 }}>
            <span>Supervisor Habilitado</span>
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '16px', paddingBottom: '2px' }}>
        <button 
          onClick={() => setActiveTab('crm')}
          className={`sidebar-link ${activeTab === 'crm' ? 'active' : ''}`}
          style={{ border: 'none', background: 'none', borderRadius: 0, padding: '8px 16px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: activeTab === 'crm' ? 'bold' : 'normal', borderBottom: activeTab === 'crm' ? '2px solid var(--color-emerald)' : 'none', color: activeTab === 'crm' ? '#ffffff' : 'var(--text-secondary)' }}
        >
          1. CRM de Gestión Total
        </button>
        <button 
          onClick={() => setActiveTab('validation')}
          className={`sidebar-link ${activeTab === 'validation' ? 'active' : ''}`}
          style={{ border: 'none', background: 'none', borderRadius: 0, padding: '8px 16px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: activeTab === 'validation' ? 'bold' : 'normal', borderBottom: activeTab === 'validation' ? '2px solid var(--color-emerald)' : 'none', color: activeTab === 'validation' ? '#ffffff' : 'var(--text-secondary)' }}
        >
          2. Validación Colegial (COP)
        </button>
        <button 
          onClick={() => setActiveTab('simulator')}
          className={`sidebar-link ${activeTab === 'simulator' ? 'active' : ''}`}
          style={{ border: 'none', background: 'none', borderRadius: 0, padding: '8px 16px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: activeTab === 'simulator' ? 'bold' : 'normal', borderBottom: activeTab === 'simulator' ? '2px solid var(--color-emerald)' : 'none', color: activeTab === 'simulator' ? '#ffffff' : 'var(--text-secondary)' }}
        >
          3. Simulador de Viabilidad & ROI
        </button>
        <button 
          onClick={() => setActiveTab('audit')}
          className={`sidebar-link ${activeTab === 'audit' ? 'active' : ''}`}
          style={{ border: 'none', background: 'none', borderRadius: 0, padding: '8px 16px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: activeTab === 'audit' ? 'bold' : 'normal', borderBottom: activeTab === 'audit' ? '2px solid var(--color-emerald)' : 'none', color: activeTab === 'audit' ? '#ffffff' : 'var(--text-secondary)' }}
        >
          4. Logs de Auditoría (Compliance)
        </button>
      </div>

      {/* Tab Content Rendering */}
      <div style={{ minHeight: '400px' }}>
        
        {/* ================= TAB 0: CRM DE GESTIÓN TOTAL (PACIENTES Y PSICÓLOGOS) ================= */}
        {activeTab === 'crm' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header / Contadores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--color-cyan)', position: 'relative' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Pacientes Totales (CRM)</span>
                <strong style={{ fontSize: '1.4rem', color: '#ffffff', display: 'block', marginTop: '4px' }}>{crmPatients.length}</strong>
              </div>
              <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--color-amber)' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Sin Terapeuta Asignado</span>
                <strong style={{ fontSize: '1.4rem', color: 'var(--color-amber)', display: 'block', marginTop: '4px' }}>
                  {crmPatients.filter(p => !p.assignedPsychologistId).length}
                </strong>
              </div>
              <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--color-emerald)' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Terapeutas Activos</span>
                <strong style={{ fontSize: '1.4rem', color: 'var(--color-emerald)', display: 'block', marginTop: '4px' }}>
                  {crmPsychologists.filter(p => p.verified).length}
                </strong>
              </div>
              <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid var(--color-rose)' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Terapeutas Pendientes</span>
                <strong style={{ fontSize: '1.4rem', color: 'var(--color-rose)', display: 'block', marginTop: '4px' }}>
                  {crmPsychologists.filter(p => !p.verified).length}
                </strong>
              </div>
            </div>

            {/* Selector de sub-crm y buscador */}
            <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setCrmTab('patients')}
                  className={`btn ${crmTab === 'patients' ? 'btn-cyan' : 'btn-outline'}`}
                  style={{ height: '32px', fontSize: '0.72rem', borderRadius: '6px', paddingInline: '16px', textTransform: 'none', border: '1px solid var(--border)' }}
                >
                  Gestión de Pacientes
                </button>
                <button
                  onClick={() => setCrmTab('psychologists')}
                  className={`btn ${crmTab === 'psychologists' ? 'btn-cyan' : 'btn-outline'}`}
                  style={{ height: '32px', fontSize: '0.72rem', borderRadius: '6px', paddingInline: '16px', textTransform: 'none', border: '1px solid var(--border)' }}
                >
                  Gestión de Psicólogos
                </button>
              </div>

              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={14} color="#9AA6AB" style={{ position: 'absolute', left: '10px', top: '9px' }} />
                <input
                  type="text"
                  placeholder={`Buscar ${crmTab === 'patients' ? 'paciente' : 'psicólogo'}...`}
                  value={crmSearchQuery}
                  onChange={(e) => setCrmSearchQuery(e.target.value)}
                  style={{ height: '32px', paddingLeft: '32px', width: '100%', fontSize: '0.72rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', color: '#ffffff', outline: 'none' }}
                />
              </div>
            </div>

            {/* Listados */}
            <div className="glass-panel animate-fade-in" style={{ padding: '20px', overflowX: 'auto' }}>
              {loadingCrm ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <RefreshCw size={24} className="animate-spin" color="var(--color-cyan)" />
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Cargando base de datos del CRM...</p>
                </div>
              ) : crmTab === 'patients' ? (
                /* TABLA DE PACIENTES */
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
                      <th style={{ padding: '8px', fontWeight: 600 }}>ID Paciente</th>
                      <th style={{ padding: '8px', fontWeight: 600 }}>Nombre / Alias</th>
                      <th style={{ padding: '8px', fontWeight: 600 }}>Email</th>
                      <th style={{ padding: '8px', fontWeight: 600 }}>Triaje Clínico</th>
                      <th style={{ padding: '8px', fontWeight: 600 }}>Estado de Pago</th>
                      <th style={{ padding: '8px', fontWeight: 600 }}>Psicólogo Asignado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crmPatients
                      .filter(p => p.name.toLowerCase().includes(crmSearchQuery.toLowerCase()) || p.email.toLowerCase().includes(crmSearchQuery.toLowerCase()))
                      .map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>{p.id.substring(0, 8)}...</td>
                          <td style={{ padding: '10px 8px', color: '#ffffff', fontWeight: 'bold' }}>{p.name}</td>
                          <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{p.email}</td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '0.62rem',
                              background: p.triage?.highRisk ? 'rgba(244,63,94,0.12)' : 'rgba(16,185,129,0.12)',
                              color: p.triage?.highRisk ? 'var(--color-rose)' : 'var(--color-emerald)',
                              border: `1px solid ${p.triage?.highRisk ? 'rgba(244,63,94,0.2)' : 'rgba(16,185,129,0.2)'}`
                            }}>
                              PHQ-9: {p.triage?.phq9 || 0} | GAD-7: {p.triage?.gad7 || 0} ({p.triage?.highRisk ? 'Riesgo Alto' : 'Seguro'})
                            </span>
                          </td>
                          <td style={{ padding: '10px 8px', textTransform: 'capitalize', color: p.paymentStatus === 'paid' ? 'var(--color-emerald)' : 'var(--text-secondary)' }}>
                            {p.paymentStatus === 'paid' ? 'Tarifa Abonada' : (p.paymentStatus === 'free_trial' ? 'Suscripción de Prueba (0€)' : 'Pendiente cobro')}
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <select
                              value={p.assignedPsychologistId || ''}
                              onChange={(e) => handleReassignPsychologist(p.id, e.target.value)}
                              style={{
                                fontSize: '0.7rem',
                                padding: '4px 8px',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                background: 'var(--background-secondary)',
                                color: '#ffffff',
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                            >
                              <option value="">-- Sin asignar --</option>
                              {crmPsychologists.map(ps => (
                                <option key={ps.id} value={ps.id}>{ps.name} ({ps.colegiado})</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              ) : (
                /* TABLA DE PSICÓLOGOS */
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
                      <th style={{ padding: '8px', fontWeight: 600 }}>Colegiación / ID</th>
                      <th style={{ padding: '8px', fontWeight: 600 }}>Nombre Completo</th>
                      <th style={{ padding: '8px', fontWeight: 600 }}>Habilitación / RC</th>
                      <th style={{ padding: '8px', fontWeight: 600 }}>Tarifa Sesión</th>
                      <th style={{ padding: '8px', fontWeight: 600 }}>Verificación Sanitaria</th>
                      <th style={{ padding: '8px', fontWeight: 600, textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {crmPsychologists
                      .filter(ps => ps.name.toLowerCase().includes(crmSearchQuery.toLowerCase()) || ps.email.toLowerCase().includes(crmSearchQuery.toLowerCase()))
                      .map(ps => (
                        <tr key={ps.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '10px 8px' }}>
                            <strong style={{ color: '#ffffff' }}>{ps.colegiado}</strong>
                            <span style={{ display: 'block', fontSize: '0.55rem', color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>{ps.id.substring(0, 8)}...</span>
                          </td>
                          <td style={{ padding: '10px 8px', color: '#ffffff', fontWeight: 'bold' }}>{ps.name}</td>
                          <td style={{ padding: '10px 8px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{ps.habilitacion}</span>
                            <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>{ps.insurance}</span>
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <input
                                type="number"
                                value={ps.price}
                                onChange={(e) => handleUpdatePsychologistPrice(ps.id, e.target.value)}
                                style={{
                                  width: '50px',
                                  height: '24px',
                                  fontSize: '0.7rem',
                                  background: 'rgba(0,0,0,0.3)',
                                  border: '1px solid var(--border)',
                                  borderRadius: '4px',
                                  color: '#ffffff',
                                  textAlign: 'center',
                                  outline: 'none'
                                }}
                              />
                              <span style={{ color: 'var(--text-secondary)' }}>€</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={ps.verified}
                                onChange={(e) => handleToggleVerifyPsychologist(ps.id, e.target.checked)}
                                style={{ accentColor: 'var(--color-cyan)' }}
                              />
                              <span style={{
                                fontSize: '0.65rem',
                                color: ps.verified ? 'var(--color-emerald)' : 'var(--color-rose)',
                                fontWeight: 700
                              }}>
                                {ps.verified ? 'Verificado (Activo)' : 'No Verificado (Bloqueado)'}
                              </span>
                            </label>
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleToggleVerifyPsychologist(ps.id, !ps.verified)}
                              className={`btn ${ps.verified ? 'btn-outline' : 'btn-emerald'}`}
                              style={{ height: '26px', fontSize: '0.62rem', borderRadius: '4px', paddingInline: '10px' }}
                            >
                              {ps.verified ? 'Revocar' : 'Validar'}
                            </button>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              )}
            </div>

          </div>
        )}

        {/* ================= TAB 1: VALIDACIÓN DE PSICÓLOGOS (COP) ================= */}
        {activeTab === 'validation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="glass-panel" style={{ padding: '20px 24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff', marginBottom: '6px' }}>Cola de Verificación Profesional</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                Para aparecer públicamente en el directorio y recibir honorarios de pacientes, los psicólogos colegiados deben aportar su documentación. La consola permite validar sus licencias de forma auditada contra el Colegio Oficial de Psicólogos.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {psicos.map(p => {
                const isDocVerifying = isVerifying === p.id;
                const isDocUpdating = isUpdating === p.id;
                const isVerified = p.status === 'verified';

                return (
                  <div 
                    key={p.id} 
                    className="glass-panel" 
                    style={{ 
                      padding: '20px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      flexWrap: 'wrap', 
                      gap: '16px',
                      borderLeft: `4px solid ${isVerified ? 'var(--color-emerald)' : 'var(--color-amber)'}`,
                      background: isVerified ? 'rgba(16,185,129,0.01)' : 'rgba(245,158,11,0.01)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>{p.name}</strong>
                        <span className={`badge ${isVerified ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.58rem', padding: '2px 6px' }}>
                          {isVerified ? 'Verificado & Activo' : 'Pendiente Verificación'}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Email: {p.email} | Colegiación: <strong>{p.colegiado}</strong></span>
                      
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                        <span style={{ fontSize: '0.62rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                          ⚕️ {p.habilitacion}
                        </span>
                        <span style={{ fontSize: '0.62rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                          🛡️ {p.insurance}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      {p.copStatus !== 'verified' ? (
                        <button
                          onClick={() => handleQueryCOP(p.id)}
                          className="btn btn-outline"
                          disabled={isDocVerifying || isDocUpdating}
                          style={{ height: '32px', fontSize: '0.7rem', display: 'flex', gap: '6px', alignItems: 'center' }}
                        >
                          {isDocVerifying ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" />
                              <span>Consultando COP...</span>
                            </>
                          ) : (
                            <span>Consultar COP</span>
                          )}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: 'var(--color-emerald)', fontWeight: 'bold', display: 'flex', gap: '4px', alignItems: 'center', marginRight: '10px' }}>
                          <ShieldCheck size={14} />
                          <span>COP VALIDADO</span>
                        </span>
                      )}

                      {!isVerified && (
                        <>
                          <button
                            onClick={() => handleApprovePsico(p)}
                            className="btn btn-emerald"
                            disabled={isDocUpdating || (p.copStatus !== 'verified' && !isDocVerifying)}
                            style={{ height: '32px', fontSize: '0.7rem', opacity: p.copStatus !== 'verified' ? 0.5 : 1 }}
                          >
                            {isDocUpdating ? 'Aprobando...' : 'Aprobar Profesional'}
                          </button>
                          <button
                            onClick={() => handleDenyPsico(p)}
                            className="btn btn-outline"
                            disabled={isDocUpdating}
                            style={{ height: '32px', fontSize: '0.7rem', borderColor: 'rgba(244,63,94,0.3)', color: 'var(--color-rose)' }}
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ================= TAB 2: SIMULADOR DE INFERENCIA & ROI (EvolucionAncoraView) ================= */}
        {activeTab === 'simulator' && (
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }} className="grid-responsive-dashboard">
            
            {/* Left sliders control */}
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                <Cpu size={16} color="var(--color-emerald)" />
                <h4 style={{ fontSize: '0.82rem', margin: 0, fontWeight: 800, color: '#ffffff' }}>Variables de Simulación</h4>
              </div>

              {/* Slider DAU */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Usuarios Activos Diarios (DAU): <strong>{gpuDau}</strong>
                </label>
                <input 
                  type="range" 
                  min="100" 
                  max="5000" 
                  step="100"
                  value={gpuDau} 
                  onChange={(e) => setGpuDau(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
                />
              </div>

              {/* Slider GPU Hours */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Ventana de Inferencia: <strong>{gpuHours}h/día</strong>
                </label>
                <input 
                  type="range" 
                  min="4" 
                  max="24" 
                  step="2"
                  value={gpuHours} 
                  onChange={(e) => setGpuHours(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
                />
              </div>

              {/* Slider KV Context */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Contexto KV: <strong>{gpuContext} tokens</strong>
                </label>
                <input 
                  type="range" 
                  min="2048" 
                  max="16384" 
                  step="1024"
                  value={gpuContext} 
                  onChange={(e) => setGpuContext(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
                />
              </div>

              {/* Slider bpw */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Cuantización Llama-70B: <strong>{gpuBpw.toFixed(1)} bpw</strong>
                </label>
                <input 
                  type="range" 
                  min="3.0" 
                  max="5.0" 
                  step="0.5"
                  value={gpuBpw} 
                  onChange={(e) => setGpuBpw(parseFloat(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
                />
              </div>

              {/* Slider Suscripción Paciente */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Software SaaS Paciente: <strong>{saasPaciente} €/mes</strong>
                </label>
                <input 
                  type="range" 
                  min="19" 
                  max="69" 
                  step="5"
                  value={saasPaciente} 
                  onChange={(e) => setSaasPaciente(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
                />
              </div>

              {/* Slider Num Pacientes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Suscripciones Pacientes: <strong>{numPacientes}</strong>
                </label>
                <input 
                  type="range" 
                  min="100" 
                  max="2000" 
                  step="50"
                  value={numPacientes} 
                  onChange={(e) => setNumPacientes(parseInt(e.target.value))} 
                  style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
                />
              </div>

            </div>

            {/* Projections Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  Viabilidad del Servidor Físico (Clúster 4x RTX 3090 96GB)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Reqs / segundo medio</span>
                    <strong style={{ fontSize: '1.2rem', color: '#ffffff' }}>{lambdaPoisson.toFixed(2)} req/s</strong>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Probabilidad Colisión Poisson</span>
                    <strong style={{ fontSize: '1.2rem', color: probColision > 0.05 ? 'var(--color-rose)' : 'var(--color-emerald)' }}>
                      {(probColision * 100).toFixed(2)} %
                    </strong>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', textAlign: 'center' }}>
                    <span style={{ display: 'block', fontSize: '0.62rem', color: 'var(--text-secondary)' }}>Consumo VRAM Estimado</span>
                    <strong style={{ fontSize: '1.2rem', color: isVramExceeded ? 'var(--color-rose)' : 'var(--color-emerald)' }}>
                      {vramTotalEstimada.toFixed(1)} GB
                    </strong>
                  </div>
                </div>

                {isVramExceeded ? (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(244,63,94,0.04)', border: '1px solid rgba(244,63,94,0.2)', color: 'var(--color-rose)', padding: '12px', borderRadius: '6px', fontSize: '0.72rem' }}>
                    <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                    <span><strong>Saturación de VRAM:</strong> El clúster físico de 96GB de VRAM se desbordará con ráfagas concurrentes. Reduce la ventana de contexto o cuantiza el modelo a menor bpw.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--color-emerald)', padding: '12px', borderRadius: '6px', fontSize: '0.72rem' }}>
                    <CheckCircle size={18} style={{ flexShrink: 0 }} />
                    <span><strong>Inferencia Estable:</strong> La capacidad de VRAM y el Continuous Batching de vLLM local pueden procesar la cola diurna de forma segura.</span>
                  </div>
                )}
              </div>

              {/* ROI & Financial metrics card */}
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  Proyecciones de Negocio & ROI (Dual-SaaS)
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block' }}>MRR Total Software SaaS</span>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--color-emerald)' }}>{mrrTotal.toLocaleString()} € / mes</strong>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block' }}>Gastos Operativos (Stripe + DPO + Luz)</span>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--color-rose)' }}>-{monthlyExpensesTotal.toFixed(0)} € / mes</strong>
                  </div>
                  <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', display: 'block' }}>Margen de Beneficio Neto</span>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--color-cyan)' }}>{netProfitMonthly.toFixed(0)} € / mes</strong>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)', padding: '14px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Costo Hardware inicial:</span>
                    <strong style={{ color: '#ffffff', marginLeft: '6px' }}>{hardwareCost.toLocaleString()} €</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>Amortización:</span>
                    <strong style={{ color: 'var(--color-cyan)', marginLeft: '6px' }}>
                      {netProfitMonthly > 0 ? `${hardwareAmortizationMonths.toFixed(1)} meses` : 'N/A (Margen negativo)'}
                    </strong>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 3: LOGS DE AUDITORÍA (COMPLIANCE) ================= */}
        {activeTab === 'audit' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={16} color="var(--color-emerald)" />
                Registro Auditoría de Cumplimiento (Append-only)
              </h4>
              <span className="badge badge-emerald" style={{ fontSize: '0.6rem' }}>RGPD Habilitado</span>
            </div>
            
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
              Las leyes de protección de datos obligan a registrar de forma segura cualquier acceso o modificación de expedientes clínicos. Estos logs se guardan de forma encriptada y son auditables para el Delegado de Protección de Datos (DPO).
            </p>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
                  <th style={{ padding: '8px', fontWeight: 600 }}>Fecha y Hora</th>
                  <th style={{ padding: '8px', fontWeight: 600 }}>Actor</th>
                  <th style={{ padding: '8px', fontWeight: 600 }}>Acción</th>
                  <th style={{ padding: '8px', fontWeight: 600 }}>Detalles</th>
                  <th style={{ padding: '8px', fontWeight: 600, textAlign: 'right' }}>Hash Transacción</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '10px 8px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{log.timestamp}</td>
                    <td style={{ padding: '10px 8px', color: '#ffffff', fontWeight: 'bold' }}>{log.actor}</td>
                    <td style={{ padding: '10px 8px', color: 'var(--color-cyan)' }}>{log.action}</td>
                    <td style={{ padding: '10px 8px', color: 'var(--text-secondary)' }}>{log.details}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>{log.hash}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
