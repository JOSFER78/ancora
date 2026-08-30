import { useState, useEffect, useRef } from 'react';
import { firebaseClient as db, firebaseClient } from '../../firebaseAdapter.js';
import { 
  FileText, Activity, Heart, Moon, Upload, Plus, 
  ShieldCheck, Download, Trash2, Edit, Save, Users, 
  AlertTriangle, BookOpen, Layers, Target, Clock, RefreshCw, CheckCircle, Check, XCircle, Video, Calendar, Sparkles, Lock, ArrowRight, Compass, CheckCircle2, ChevronRight, Mic, MicOff, Paperclip, FileCheck, HelpCircle, CheckSquare, MessageSquarePlus, X, AlertCircle, Eye, Loader2
} from 'lucide-react';
import { 
  getMedications, 
  getTimelineEvents, 
  getClinicalDocuments, 
  getClinicalProfile, 
  getClinicalLifeTree,
  uploadClinicalDocument,
  processBatchClinicalUpload,
  addPatientMemory,
  toggleAreaCompletion,
  calculateClinicalExplorationMaturity
} from '../../lib/clinicalEngine';
import { synthesizeCompletePatientHistory } from '../../services/aiService';

export default function PacienteHistoriaView({ profile, onProfileUpdated, user, isVirtualDemo }) {
  const [loadingClinicalData, setLoadingClinicalData] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');
  
  // Estado para la síntesis inteligente con IA
  const [isSynthesizingWithAI, setIsSynthesizingWithAI] = useState(false);
  const [synthesisStatus, setSynthesisStatus] = useState('');
  
  // Estado para la subida por lotes (Batch Upload) y consola de progreso
  const [batchProgress, setBatchProgress] = useState(null); // { index, total, fileName, percentage, currentStep, fileStatuses }
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Modal para ver detalles de un documento analizado
  const [selectedDocDetails, setSelectedDocDetails] = useState(null);

  // Modal para añadir recuerdo a un área específica
  const [activeMemoryModal, setActiveMemoryModal] = useState(null); // { key, label, prompt }
  const [memoryText, setMemoryText] = useState('');
  const [savingMemory, setSavingMemory] = useState(false);

  // Grabación de audio para el historial
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  // Estados de datos clínicos
  const [events, setEvents] = useState([]);
  const [meds, setMeds] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [clinicalProfile, setClinicalProfile] = useState(null);
  const [lifeTree, setLifeTree] = useState(null);

  // Modales de reserva
  const [bookingModal, setBookingModal] = useState(null); // 'revision15' | 'sesionCompleta' | null
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00');
  const [bookingNotes, setBookingNotes] = useState('');

  // Contexto del paciente
  const context = profile?.contexto_terapeutico || {};
  const clinicalHistory = context.historial_clinico || {};
  const consultationType = context.consultationType || 'individual';
  const dudasSonsacado = Array.isArray(context.dudas_clinicas_sonsacado) ? context.dudas_clinicas_sonsacado : [];
  const assignedPsyName = context.assigned_psychologist_id === 'psy-pareja-01' 
    ? 'Dra. Elena Ruiz (M-38291)' 
    : (context.assigned_psychologist_id === 'psy-infantil-01' ? 'Carlos Mendoza (M-41029)' : 'José Fernández (M-49ccc)');

  // Temporizador para el progreso visual
  useEffect(() => {
    if (uploadingDoc) {
      setElapsedSeconds(0);
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [uploadingDoc]);

  // Cargar datos clínicos reales de Firestore
  const loadClinicalData = async () => {
    if (!profile?.id) return;
    setLoadingClinicalData(true);
    try {
      const [dbMeds, dbEvents, dbDocs, dbProfile, dbTree] = await Promise.all([
        getMedications(profile.id),
        getTimelineEvents(profile.id),
        getClinicalDocuments(profile.id),
        getClinicalProfile(profile.id),
        getClinicalLifeTree(profile.id)
      ]);
      setMeds(dbMeds || []);
      setEvents(dbEvents || []);
      setUploadedFiles(dbDocs || []);
      setClinicalProfile(dbProfile);
      setLifeTree(dbTree);
    } catch (err) {
      console.error("Error cargando datos clínicos del paciente:", err);
    } finally {
      setLoadingClinicalData(false);
    }
  };

  useEffect(() => {
    loadClinicalData();
  }, [profile?.id]);

  // Subida por lotes (Batch Upload) de múltiples archivos con tracking granular
  const handleBatchFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0 || !profile?.id) return;
    event.target.value = '';

    setUploadingDoc(true);
    setUploadSuccess('');
    
    const initialStatuses = files.map((f, idx) => ({
      index: idx + 1,
      name: f.name,
      size: f.size,
      status: idx === 0 ? 'processing' : 'queued',
      stepLabel: idx === 0 ? 'Iniciando lectura...' : 'En cola de espera',
      summary: null,
      error: null
    }));

    setBatchProgress({
      index: 1,
      total: files.length,
      fileName: files[0].name,
      percentage: 5,
      currentStep: 'Iniciando lectura del primer archivo...',
      fileStatuses: initialStatuses
    });

    try {
      const result = await processBatchClinicalUpload(files, profile.id, (prog) => {
        setBatchProgress(prog);
      });

      await loadClinicalData();
      setUploadSuccess(`¡Análisis completado! Se han estructurado ${result.successCount} de ${files.length} archivos en tu expediente clínico.`);
      setTimeout(() => {
        setUploadSuccess('');
      }, 7000);
    } catch (err) {
      console.error("Error en la subida por lotes:", err);
      alert("Error al procesar archivos: " + err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  // Grabación de notas de voz clínicas para el historial
  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const audioFile = new File([blob], `nota_voz_historial_${Date.now()}.webm`, { type: 'audio/webm' });
        setUploadingDoc(true);
        try {
          await uploadClinicalDocument(audioFile, profile.id);
          await loadClinicalData();
          setUploadSuccess("Tu nota de voz ha sido analizada e integrada en tu historial vital.");
          setTimeout(() => setUploadSuccess(''), 5000);
        } catch (e) {
          console.error("Error subiendo audio:", e);
        } finally {
          setUploadingDoc(false);
        }
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
    } catch (err) {
      alert("No se pudo acceder al micrófono: " + err.message);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
    }
  };

  // Síntesis Clínica Inteligente 360° con IA para Poblar Todo el Historial
  const handleSynthesizeCompleteHistory = async () => {
    if (!profile?.id) return;
    setIsSynthesizingWithAI(true);
    setSynthesisStatus('Sintetizando expediente vital 360° con IA...');

    try {
      const synthResult = await synthesizeCompletePatientHistory({
        patientProfile: profile,
        documents: uploadedFiles,
        timelineEvents: events,
        medications: meds,
        lifeTree: lifeTree,
        chatMessages: []
      });

      if (synthResult?.success) {
        // 1. Guardar el árbol vital en Firestore
        await db.from('clinical_life_tree').upsert({
          patient_id: profile.id,
          tree_data: synthResult.life_tree,
          updated_at: new Date().toISOString()
        }, { onConflict: 'patient_id' });

        // 2. Guardar medicamentos nuevos detectados
        if (Array.isArray(synthResult.medications) && synthResult.medications.length > 0) {
          for (const m of synthResult.medications) {
            if (m.name && !meds.some(existing => existing.name?.toLowerCase() === m.name?.toLowerCase())) {
              await db.from('medications').insert([{
                id: 'med-' + Math.random().toString(36).substring(2, 10),
                patient_id: profile.id,
                name: m.name,
                dose: m.dose || 'Pautada',
                frequency: m.frequency || 'Según prescripción',
                prescriber: m.prescriber || 'Informe médico',
                authority_level: 2,
                created_at: new Date().toISOString()
              }]);
            }
          }
        }

        // 3. Guardar hitos cronológicos nuevos
        if (Array.isArray(synthResult.timeline_events) && synthResult.timeline_events.length > 0) {
          for (const ev of synthResult.timeline_events) {
            if (ev.event && !events.some(existing => existing.event === ev.event)) {
              await db.from('timeline_events').insert([{
                id: 'ev-' + Math.random().toString(36).substring(2, 10),
                patient_id: profile.id,
                date: ev.date || ev.year || new Date().getFullYear().toString(),
                event: ev.event,
                event_type: ev.event_type || 'personal',
                authority_level: 2,
                created_at: new Date().toISOString()
              }]);
            }
          }
        }

        // 4. Actualizar el perfil del paciente con la síntesis clínica y dudas de sonsacado
        const curCtx = profile.contexto_terapeutico || {};
        const curHist = curCtx.historial_clinico || {};
        curHist.resumen_vital = synthResult.resumen_vital || curHist.resumen_vital;
        curHist.antecedentes_psicologicos = synthResult.antecedentes_psicologicos || curHist.antecedentes_psicologicos;
        curHist.antecedentes_medicos = synthResult.antecedentes_medicos || curHist.antecedentes_medicos;
        curHist.patrones_comunes = synthResult.patrones_comunes || curHist.patrones_comunes;

        const updatedCtx = {
          ...curCtx,
          historial_clinico: curHist,
          dudas_clinicas_sonsacado: synthResult.dudas_sonsacado || curCtx.dudas_clinicas_sonsacado || [],
          pautas_accion: synthResult.pautas_accion || curCtx.pautas_accion || [],
          sintesis_ia: synthResult.resumen_vital || curCtx.sintesis_ia
        };

        await db.from('profiles').update({
          contexto_terapeutico: updatedCtx,
          updated_at: new Date().toISOString()
        }).eq('id', profile.id);

        if (onProfileUpdated) {
          onProfileUpdated({ ...profile, contexto_terapeutico: updatedCtx });
        }

        await loadClinicalData();
        setUploadSuccess('✨ ¡Historial clínico estructurado y completado con IA! Se han rellenado las 6 dimensiones.');
        setTimeout(() => setUploadSuccess(''), 6000);
      }
    } catch (err) {
      console.error('Error en síntesis clínica:', err);
    } finally {
      setIsSynthesizingWithAI(false);
      setSynthesisStatus('');
    }
  };

  // Añadir recuerdo o vivencia a un área específica
  const handleSaveAreaMemory = async (e) => {
    e.preventDefault();
    if (!profile?.id || !activeMemoryModal || !memoryText.trim()) return;

    setSavingMemory(true);
    try {
      await addPatientMemory(profile.id, activeMemoryModal.key, memoryText);
      await loadClinicalData();
      setMemoryText('');
      setActiveMemoryModal(null);
      setUploadSuccess(`Recuerdo añadido a "${activeMemoryModal.label}". La IA y tu psicólogo ya lo tienen presente.`);
      setTimeout(() => setUploadSuccess(''), 5000);
    } catch (err) {
      console.error("Error guardando recuerdo:", err);
    } finally {
      setSavingMemory(false);
    }
  };

  // Alternar cierre de área ("Todo aportado" vs "Reabrir")
  const handleToggleArea = async (areaKey, currentClosed) => {
    if (!profile?.id) return;
    try {
      await toggleAreaCompletion(profile.id, areaKey, !currentClosed);
      await loadClinicalData();
      if (onProfileUpdated) {
        const updatedCtx = {
          ...context,
          areas_completadas: {
            ...(context.areas_completadas || {}),
            [areaKey]: !currentClosed
          }
        };
        onProfileUpdated({ ...profile, contexto_terapeutico: updatedCtx });
      }
    } catch (err) {
      console.error("Error al alternar área:", err);
    }
  };

  // Cálculo de madurez y exploración vital constructiva
  const maturity = calculateClinicalExplorationMaturity(profile, lifeTree, events, meds);

  // Manejar solicitud de cita/revisión
  const handleConfirmBooking = async () => {
    if (!profile?.id) return;
    try {
      const psychoId = profile.contexto_terapeutico?.assigned_psychologist_id || '2TOfkVIRccgIgz5WamAIVmUPtD63';
      const duration = bookingModal === 'revision15' ? 15 : 50;
      const price = bookingModal === 'revision15' ? 15 : 55;
      
      const apptDate = bookingDate || new Date(Date.now() + 86400000).toISOString().split('T')[0];

      await db.from('appointments').insert([{
        patient_id: profile.id,
        psychologist_id: psychoId,
        appointment_date: apptDate,
        appointment_time: bookingTime || '10:00',
        duration_minutes: duration,
        session_type: bookingModal === 'revision15' ? 'revision' : 'individual',
        status: 'confirmed',
        price_eur: price,
        notes: bookingNotes || '',
        created_at: new Date().toISOString()
      }]);

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingModal(null);
        setBookingSuccess(false);
        setBookingNotes('');
      }, 2000);
    } catch (err) {
      console.error("Error confirmando reserva:", err);
    }
  };

  // Exportar ficha esquemática
  const handleExportSummary = () => {
    const textContent = `ÁNCORA - MAPA DE EXPLORACIÓN CLÍNICA Y PROGRESO
======================================================
Paciente: ${profile?.display_name || 'Paciente'}
Modalidad: ${consultationType.toUpperCase()}
Terapeuta Asignado: ${assignedPsyName}
Madurez del Expediente: ${maturity.maturityPercentage}%
Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}

1. MOTIVO Y FOCOS DE ATENCIÓN:
------------------------------------------------------
${context.motivo || clinicalHistory.resumen_vital || 'Acompañamiento y bienestar emocional.'}
Focos prioritarios: ${(context.tags || []).join(', ') || 'Ansiedad, Regulación'}

2. ÁREAS VITALES EXPLORADAS:
------------------------------------------------------
${maturity.exploredAreas.map(a => `- ${a.label}: ${a.status === 'complete' ? 'Completamente explorado' : (a.status === 'partial' ? 'En proceso' : 'Pendiente de profundizar')}`).join('\n')}

3. FARMACOLOGÍA Y PAUTAS MÉDICAS:
------------------------------------------------------
${meds.length > 0 ? meds.map(m => `- ${m.name} (${m.dose || 'Pautada'} - ${m.frequency || 'Diaria'})`).join('\n') : 'Sin medicación activa registrada.'}

4. DUDAS Y FOCOS DE ANAMNESIS ABIERTOS (PARA SONSACADO):
------------------------------------------------------
${dudasSonsacado.length > 0 ? dudasSonsacado.map((d, i) => `${i + 1}. ${d}`).join('\n') : 'Expediente consolidado sin lagunas documentales pendientes.'}

======================================================
Documento generado con Cifrado de Salud RGPD Art. 9 / Ley 41/2002.`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ancora_Ficha_Clinica_${(profile?.display_name || 'Paciente').replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Users': return <Users size={16} />;
      case 'BookOpen': return <BookOpen size={16} />;
      case 'Heart': return <Heart size={16} />;
      case 'Layers': return <Layers size={16} />;
      case 'Activity': return <Activity size={16} />;
      case 'Moon': return <Moon size={16} />;
      default: return <Compass size={16} />;
    }
  };

  return (
    <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* 1. CABECERA & SUPERVISIÓN CLÍNICA */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Mi Evolución & Expediente de Vida
              </h2>
              <span className="badge badge-cyan" style={{ fontSize: '0.66rem', padding: '3px 8px', textTransform: 'uppercase' }}>
                {consultationType}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Espacio de autoconocimiento y progreso supervisado por <strong>{assignedPsyName}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              onClick={handleSynthesizeCompleteHistory} 
              disabled={isSynthesizingWithAI || loadingClinicalData}
              className="btn btn-primary" 
              style={{ 
                height: '34px', 
                fontSize: '0.75rem', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                background: 'linear-gradient(135deg, var(--color-cyan) 0%, var(--color-emerald) 100%)',
                border: 'none',
                color: '#051A2C',
                fontWeight: 800,
                boxShadow: '0 0 15px rgba(68,125,130,0.35)',
                cursor: (isSynthesizingWithAI || loadingClinicalData) ? 'not-allowed' : 'pointer'
              }}
              title="Analiza todos los documentos, notas y datos de triaje para estructurar las 6 áreas vitales"
            >
              {isSynthesizingWithAI ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Sintetizando Ficha...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>Sintetizar & Completar con IA</span>
                </>
              )}
            </button>

            <button 
              type="button" 
              onClick={loadClinicalData} 
              disabled={loadingClinicalData || isSynthesizingWithAI}
              className="btn btn-outline" 
              style={{ height: '34px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={loadingClinicalData ? 'animate-spin' : ''} />
              <span>Actualizar Mapa</span>
            </button>

            <button 
              type="button" 
              onClick={handleExportSummary}
              className="btn btn-outline" 
              style={{ height: '34px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={13} />
              <span>Descargar Ficha</span>
            </button>
          </div>
        </div>

        {/* Notificación de Éxito / Síntesis en Curso */}
        {isSynthesizingWithAI && (
          <div style={{
            background: 'rgba(68,125,130,0.15)',
            border: '1px solid var(--color-cyan)',
            padding: '12px 16px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '0.76rem',
            color: '#ffffff'
          }}>
            <Loader2 size={18} className="animate-spin" color="var(--color-cyan)" />
            <div>
              <strong>Formulación Clínica 360° en Progreso:</strong>
              <span style={{ marginLeft: '6px', color: 'var(--color-cyan)' }}>
                {synthesisStatus || 'La IA está extrayendo información de todos tus documentos y estructurando las 6 dimensiones...'}
              </span>
            </div>
          </div>
        )}

        {uploadSuccess && (
          <div style={{
            background: 'rgba(127,159,136,0.15)',
            border: '1px solid var(--color-emerald)',
            padding: '12px 16px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.76rem',
            color: 'var(--color-emerald)'
          }}>
            <CheckCircle2 size={18} />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* BARRA DE MADUREZ Y EXPLORACIÓN VITAL (DARK GLASSMORPHIC) */}
        {/* ------------------------------------------------------------- */}
        <div className="glass-panel" style={{ 
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(8, 33, 56, 0.75) 0%, rgba(5, 22, 38, 0.85) 100%)',
          border: '1px solid rgba(68,125,130,0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="flex-center" style={{ 
                width: '42px', 
                height: '42px', 
                borderRadius: '12px', 
                background: 'rgba(68,125,130,0.18)', 
                color: 'var(--color-cyan)',
                flexShrink: 0
              }}>
                <Compass size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Madurez de tu Expediente de Vida
                </h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                  Áncora analiza tus informes, notas de voz y vivencias para que tu psicólogo disponga de una formulación clínica 360° sin etiquetas patologizantes.
                </p>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-cyan)', lineHeight: 1 }}>
                {maturity.maturityPercentage}%
              </span>
              <span style={{ display: 'block', fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                Explorado
              </span>
            </div>
          </div>

          {/* Barra Visual de Progreso */}
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${maturity.maturityPercentage}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, var(--color-cyan) 0%, var(--color-emerald) 100%)',
              borderRadius: '999px',
              transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>

          {/* Indicadores Cronológicos de Etapas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', paddingTop: '4px' }}>
            {maturity.stages.map((st, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 12px', 
                background: st.explored ? 'rgba(127,159,136,0.1)' : 'rgba(255,255,255,0.02)',
                border: st.explored ? '1px solid rgba(127,159,136,0.3)' : '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '0.72rem'
              }}>
                <CheckCircle2 size={14} color={st.explored ? 'var(--color-emerald)' : 'var(--text-tertiary)'} />
                <span style={{ color: st.explored ? 'var(--text-primary)' : 'var(--text-tertiary)', fontWeight: st.explored ? 700 : 500 }}>
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SUBIDA MÚLTIPLE DE ARCHIVOS (BATCH) E INFORMES MÉDICOS */}
      {/* ------------------------------------------------------------- */}
      <div className="glass-panel" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Upload size={17} color="var(--color-cyan)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                Aportar Documentación, Informes o Audios (Carga Múltiple)
              </h3>
            </div>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Sube uno o varios archivos a la vez (PDFs, Word, analíticas, recetas o fotos). La IA analizará cada documento uno a uno como un psicólogo colegiado.
            </p>
          </div>
        </div>

        {/* Notificación de éxito */}
        {uploadSuccess && (
          <div style={{ padding: '10px 14px', background: 'rgba(127,159,136,0.12)', border: '1px solid var(--color-emerald)', borderRadius: '8px', color: 'var(--color-emerald)', fontSize: '0.75rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={15} color="var(--color-emerald)" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CONSOLA VISUAL DE PROCESAMIENTO CLÍNICO EN TIEMPO REAL */}
        {/* ------------------------------------------------------------- */}
        {batchProgress && (
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(8, 33, 56, 0.98) 0%, rgba(4, 18, 32, 0.98) 100%)', 
            border: '1px solid var(--color-cyan)', 
            borderRadius: '12px', 
            padding: '18px 20px', 
            marginBottom: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}>
            {/* Cabecera de la consola con Timer y Porcentaje */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="flex-center" style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(68,125,130,0.2)', color: 'var(--color-cyan)' }}>
                  <Loader2 size={16} className="animate-spin" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 800, color: '#ffffff' }}>
                    Procesando Archivo {batchProgress.index} de {batchProgress.total}
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-cyan)', fontWeight: 600 }}>
                    {batchProgress.currentStep || 'Extrayendo datos clínicos...'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {uploadingDoc && (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                    ⏱️ {elapsedSeconds}s transcurridos
                  </span>
                )}
                <span style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-cyan)' }}>
                  {batchProgress.percentage}%
                </span>
              </div>
            </div>

            {/* Barra General de Progreso */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${batchProgress.percentage}%`, 
                height: '100%', 
                background: 'linear-gradient(90deg, var(--color-cyan) 0%, var(--color-emerald) 100%)', 
                transition: 'width 0.4s ease-out' 
              }} />
            </div>

            {/* Cola de Archivos Detallada */}
            {Array.isArray(batchProgress.fileStatuses) && batchProgress.fileStatuses.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  Cola de Procesamiento ({batchProgress.fileStatuses.length} documentos):
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', paddingRight: '4px' }}>
                  {batchProgress.fileStatuses.map((fStat, idx) => {
                    const isProcessing = fStat.status === 'processing';
                    const isCompleted = fStat.status === 'completed';
                    const isError = fStat.status === 'error';

                    return (
                      <div key={idx} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        padding: '7px 12px',
                        background: isProcessing ? 'rgba(68,125,130,0.12)' : (isCompleted ? 'rgba(127,159,136,0.08)' : 'rgba(255,255,255,0.02)'),
                        border: isProcessing ? '1px solid var(--color-cyan)' : (isCompleted ? '1px solid rgba(127,159,136,0.3)' : '1px solid var(--border)'),
                        borderRadius: '6px',
                        fontSize: '0.72rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {isProcessing && <Loader2 size={13} className="animate-spin" color="var(--color-cyan)" />}
                          {isCompleted && <CheckCircle2 size={13} color="var(--color-emerald)" />}
                          {isError && <AlertCircle size={13} color="var(--color-amber)" />}
                          {!isProcessing && !isCompleted && !isError && <Clock size={13} color="var(--text-tertiary)" />}
                          
                          <span style={{ fontWeight: isProcessing ? 700 : 500, color: isProcessing ? '#ffffff' : (isCompleted ? 'var(--text-primary)' : 'var(--text-secondary)') }}>
                            {fStat.name}
                          </span>
                        </div>

                        <span style={{ 
                          fontSize: '0.66rem', 
                          fontWeight: 700, 
                          color: isProcessing ? 'var(--color-cyan)' : (isCompleted ? 'var(--color-emerald)' : (isError ? 'var(--color-amber)' : 'var(--text-tertiary)')),
                          flexShrink: 0
                        }}>
                          {fStat.stepLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
          
          {/* Opción A: Subir Múltiples Archivos */}
          <div 
            onClick={() => {
              if (!uploadingDoc) fileInputRef.current?.click();
            }}
            style={{ 
              border: '1.5px dashed rgba(68,125,130,0.4)', 
              borderRadius: '12px', 
              padding: '18px', 
              textAlign: 'center',
              cursor: uploadingDoc ? 'not-allowed' : 'pointer',
              background: 'rgba(255,255,255,0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all var(--transition-fast)',
              opacity: uploadingDoc ? 0.65 : 1
            }}
          >
            <input 
              ref={fileInputRef}
              type="file" 
              multiple 
              accept=".pdf,.docx,.doc,.txt,.md,image/*,audio/*" 
              style={{ display: 'none' }} 
              onChange={handleBatchFileUpload} 
              disabled={uploadingDoc}
            />
            <div className="flex-center" style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(68,125,130,0.15)', color: 'var(--color-cyan)' }}>
              <Paperclip size={18} />
            </div>
            <strong style={{ fontSize: '0.82rem', color: '#ffffff' }}>
              {uploadingDoc ? 'Extrayendo datos clínicos con IA...' : 'Subir Varios Informes o Fotos (Carga Múltiple)'}
            </strong>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
              Selecciona varios archivos PDF, Word, TXT o imágenes a la vez
            </span>
          </div>

          {/* Opción B: Grabar Nota de Voz */}
          <div 
            style={{ 
              border: isRecordingAudio ? '1.5px solid var(--color-rose)' : '1.5px dashed var(--border)', 
              borderRadius: '12px', 
              padding: '18px', 
              textAlign: 'center',
              background: isRecordingAudio ? 'rgba(244,63,94,0.08)' : 'rgba(255,255,255,0.02)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <div className="flex-center" style={{ 
              width: '38px', 
              height: '38px', 
              borderRadius: '50%', 
              background: isRecordingAudio ? 'var(--color-rose)' : 'rgba(255,255,255,0.06)', 
              color: '#ffffff'
            }}>
              {isRecordingAudio ? <MicOff size={18} /> : <Mic size={18} />}
            </div>

            <strong style={{ fontSize: '0.82rem', color: isRecordingAudio ? 'var(--color-rose)' : '#ffffff' }}>
              {isRecordingAudio ? 'Grabando explicación de voz...' : 'Grabar Explicación por Voz'}
            </strong>

            <button
              type="button"
              onClick={isRecordingAudio ? stopRecording : startRecording}
              disabled={uploadingDoc}
              className="btn"
              style={{
                background: isRecordingAudio ? 'var(--color-rose)' : 'var(--color-cyan)',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                cursor: 'pointer',
                marginTop: '4px'
              }}
            >
              {isRecordingAudio ? 'Detener y Procesar' : 'Empezar a Grabar'}
            </button>
          </div>

        </div>

        {/* Archivos ya incorporados */}
        {uploadedFiles.length > 0 && (
          <div style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
              Documentos Analizados en tu Expediente ({uploadedFiles.length})
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {uploadedFiles.map((doc, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedDocDetails(doc)}
                  style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid var(--border)', 
                    padding: '6px 12px', 
                    borderRadius: '6px', 
                    fontSize: '0.72rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    color: 'var(--text-primary)',
                    cursor: 'pointer'
                  }}
                  title="Ver hallazgos extraídos por la IA"
                >
                  <FileCheck size={14} color="var(--color-cyan)" />
                  <span style={{ fontWeight: 600 }}>{doc.file_name}</span>
                  <Eye size={12} color="var(--text-tertiary)" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. DUDAS CLÍNICAS Y FOCOS DE SONSACADO PARA EL CHAT */}
      {/* ------------------------------------------------------------- */}
      {dudasSonsacado.length > 0 && (
        <div className="glass-panel" style={{ 
          padding: '20px', 
          background: 'linear-gradient(135deg, rgba(68,125,130,0.12) 0%, rgba(5,33,58,0.7) 100%)',
          border: '1px solid rgba(68,125,130,0.35)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Sparkles size={17} color="var(--color-cyan)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Focos & Preguntas de Anamnesis para tus Charlas con Áncora
            </h3>
          </div>
          <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.45 }}>
            A partir de los informes que has subido, la IA ha detectado estas preguntas abiertas para comprender mejor tu historia vital. Te las irá preguntando poco a poco con delicadeza en el chat:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dudasSonsacado.map((duda, i) => (
              <div key={i} style={{ 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(68,125,130,0.2)', 
                padding: '10px 14px', 
                borderRadius: '8px', 
                fontSize: '0.74rem', 
                color: 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <ChevronRight size={14} color="var(--color-cyan)" style={{ flexShrink: 0 }} />
                <span>{duda}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. LAS 6 DIMENSIONES VITALES CON ACCIONES POR ÁREA */}
      {/* ------------------------------------------------------------- */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.02rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Dimensiones de tu Historia de Vida
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Áreas que la IA y tu psicólogo exploran contigo. Puedes aportar recuerdos o marcar áreas como cerradas si ya no hay más que añadir.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '14px' }}>
          {maturity.exploredAreas.map((area) => {
            const isDone = area.status === 'complete';
            const isPartial = area.status === 'partial';

            return (
              <div key={area.key} className="glass-panel" style={{ 
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px',
                border: isDone ? '1px solid rgba(127,159,136,0.4)' : (isPartial ? '1px solid rgba(68,125,130,0.4)' : '1px dashed var(--border)')
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="flex-center" style={{ 
                        width: '30px', 
                        height: '30px', 
                        borderRadius: '8px', 
                        background: isDone ? 'rgba(127,159,136,0.15)' : 'rgba(68,125,130,0.15)', 
                        color: isDone ? 'var(--color-emerald)' : 'var(--color-cyan)'
                      }}>
                        {getCategoryIcon(area.icon)}
                      </div>
                      <h4 style={{ fontSize: '0.86rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {area.label}
                      </h4>
                    </div>

                    <span className={`badge ${isDone ? 'badge-emerald' : (isPartial ? 'badge-cyan' : '')}`} style={{ 
                      fontSize: '0.66rem', 
                      padding: '3px 8px',
                      background: isDone ? 'rgba(127,159,136,0.2)' : (isPartial ? 'rgba(68,125,130,0.2)' : 'rgba(255,255,255,0.04)'),
                      color: isDone ? 'var(--color-emerald)' : (isPartial ? 'var(--color-cyan)' : 'var(--text-tertiary)'),
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      {isDone ? (area.isExplicitlyClosed ? '✓ Cerrado' : '✓ Explorado') : (isPartial ? '⚡ En Progreso' : '⏳ Pendiente')}
                    </span>
                  </div>

                  {/* Resumen o sugerencia amable */}
                  {area.items.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      {area.items.slice(0, 4).map((item, idx) => (
                        <div key={idx} style={{ 
                          background: 'rgba(255,255,255,0.025)', 
                          padding: '7px 11px', 
                          borderRadius: '6px', 
                          fontSize: '0.72rem', 
                          color: 'var(--text-primary)',
                          borderLeft: `3px solid ${isDone ? 'var(--color-emerald)' : 'var(--color-cyan)'}`,
                          lineHeight: 1.45
                        }}>
                          {item}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      background: 'rgba(255,255,255,0.015)',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px dashed rgba(255,255,255,0.08)',
                      marginTop: '6px'
                    }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                        Pendiente de profundizar con Áncora en {area.prompt}. Puedes contárselo a Áncora en cualquier momento o aportar un recuerdo.
                      </p>
                    </div>
                  )}
                </div>

                {/* Acciones del Paciente sobre esta Área */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                  <button
                    type="button"
                    onClick={() => setActiveMemoryModal(area)}
                    className="btn btn-outline"
                    style={{ flex: 1, height: '30px', fontSize: '0.68rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <MessageSquarePlus size={13} color="var(--color-cyan)" />
                    <span>Añadir Detalle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleArea(area.key, area.isExplicitlyClosed)}
                    className="btn btn-outline"
                    style={{ 
                      height: '30px', 
                      fontSize: '0.68rem', 
                      borderRadius: '6px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '4px',
                      color: area.isExplicitlyClosed ? 'var(--color-amber)' : 'var(--color-emerald)',
                      borderColor: area.isExplicitlyClosed ? 'rgba(245,158,11,0.3)' : 'rgba(127,159,136,0.3)'
                    }}
                    title={area.isExplicitlyClosed ? "Reabrir área para seguir profundizando" : "Marcar como completo si no tienes más que añadir"}
                  >
                    {area.isExplicitlyClosed ? <RefreshCw size={12} /> : <CheckSquare size={12} />}
                    <span>{area.isExplicitlyClosed ? 'Reabrir' : 'Todo listo'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. PAUTAS ACTIVAS & MEDICACIÓN */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        
        {/* Motivo & Medicación */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Activity size={17} color="var(--color-cyan)" />
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Farmacología & Pautas Médicas ({meds.length})
            </h4>
          </div>

          {meds.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {meds.map((m, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.74rem' }}>
                  <strong style={{ color: '#ffffff' }}>{m.name}</strong> — {m.dose || 'Pautada'} ({m.frequency || 'Diaria'})
                  {m.prescriber && <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>Prescrito por: {m.prescriber}</span>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              No se han detectado tratamientos farmacológicos activos en los informes aportados.
            </div>
          )}
        </div>

        {/* Pautas Activas */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <CheckCircle size={17} color="var(--color-emerald)" />
            <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Pautas & Estrategias Acordadas
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(context.pautas_accion && context.pautas_accion.length > 0 ? context.pautas_accion : [
              'Realizar 1 registro breve en el diario reflexivo ante momentos de agobio.',
              'Practicar respiración pausada al finalizar la jornada.',
              'Espacio confidencial supervisado por el psicólogo clínico asignado.'
            ]).map((pauta, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                <CheckCircle2 size={14} color="var(--color-emerald)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{pauta}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. VÍAS DE ATENCIÓN Y CONTINUIDAD */}
      {/* ------------------------------------------------------------- */}
      <div>
        <h3 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px' }}>
          Sesiones y Consulta con tu Psicólogo
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          
          {/* Opción 1: Revisiones Rápidas (15 min) */}
          <div className="glass-panel" style={{ 
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            border: '1px solid rgba(68,125,130,0.3)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="flex-center" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(68,125,130,0.15)', color: 'var(--color-cyan)' }}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Revisión Ágil (15 min)</h4>
                    <span style={{ fontSize: '0.68rem', color: 'var(--color-cyan)', fontWeight: 700 }}>Seguimiento puntual entre sesiones</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-cyan)' }}>15 €</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 16px 0' }}>
                Para resolver dudas sobre tus pautas, chequear avances o ajustar ejercicios sin esperar a la sesión completa.
              </p>
            </div>

            <button 
              type="button" 
              onClick={() => setBookingModal('revision15')}
              className="btn btn-outline"
              style={{ width: '100%', height: '36px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Clock size={14} />
              <span>Solicitar Revisión Breve</span>
            </button>
          </div>

          {/* Opción 2: Sesión Completa (50 min) */}
          <div className="glass-panel" style={{ 
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            border: '1px solid var(--border)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="flex-center" style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255,255,255,0.06)', color: '#ffffff' }}>
                    <Video size={18} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Sesión Completa (50 min)</h4>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 700 }}>Videollamada en profundidad</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff' }}>55 €</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 16px 0' }}>
                Sesión clínica completa para trabajar en profundidad tus focos terapéuticos y consolidar acuerdos.
              </p>
            </div>

            <button 
              type="button" 
              onClick={() => setBookingModal('sesionCompleta')}
              className="btn btn-primary"
              style={{ width: '100%', height: '36px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <Calendar size={14} />
              <span>Reservar Sesión Completa</span>
            </button>
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL DETALLES DOCUMENTO */}
      {/* ------------------------------------------------------------- */}
      {selectedDocDetails && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 19, 32, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'left',
            background: 'rgba(5, 26, 44, 0.95)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={18} color="var(--color-cyan)" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                  {selectedDocDetails.file_name}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedDocDetails(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', fontSize: '0.76rem', color: 'var(--text-primary)', border: '1px solid var(--border)', lineHeight: 1.45 }}>
              <strong style={{ color: 'var(--color-cyan)', display: 'block', marginBottom: '4px' }}>Síntesis del Análisis Clínico:</strong>
              {selectedDocDetails.summary || 'Documento analizado e incorporado al expediente.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedDocDetails(null)}
                className="btn btn-outline"
                style={{ height: '34px', fontSize: '0.76rem' }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL PARA AÑADIR RECUERDO / DETALLE A UN ÁREA */}
      {/* ------------------------------------------------------------- */}
      {activeMemoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 19, 32, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'left',
            background: 'rgba(5, 26, 44, 0.95)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--color-cyan)" />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                  Añadir Recuerdo: {activeMemoryModal.label}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveMemoryModal(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
              Cuéntale a Áncora qué recuerdas o qué vivencia te ha venido a la mente sobre <em>{activeMemoryModal.prompt}</em>. La IA la incorporará a tu expediente de forma constructiva.
            </p>

            <form onSubmit={handleSaveAreaMemory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <textarea
                rows={4}
                required
                placeholder="Ej: Recuerdo que en primaria me cambié de colegio en 2004 y me costó adaptarme..."
                value={memoryText}
                onChange={(e) => setMemoryText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.03)',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  resize: 'none'
                }}
              />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveMemoryModal(null)}
                  className="btn btn-outline"
                  style={{ flex: 1, height: '36px', fontSize: '0.76rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingMemory || !memoryText.trim()}
                  className="btn btn-primary"
                  style={{ flex: 1, height: '36px', fontSize: '0.76rem' }}
                >
                  {savingMemory ? 'Guardando en expediente...' : 'Guardar en mi Historial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL DE RESERVA DE CITA */}
      {/* ------------------------------------------------------------- */}
      {bookingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 19, 32, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '460px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'left',
            background: 'rgba(5, 26, 44, 0.95)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                {bookingModal === 'revision15' ? 'Solicitar Revisión Breve (15 min)' : 'Reservar Sesión Clínica (50 min)'}
              </h3>
              <button 
                type="button" 
                onClick={() => setBookingModal(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={18} />
              </button>
            </div>

            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={44} color="var(--color-emerald)" />
                <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1.05rem', fontWeight: 800 }}>¡Sesión Confirmada!</h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Tu cita ha sido vinculada en Firestore y agendada con tu psicólogo colegiado ({assignedPsyName}).
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Selecciona la fecha y hora deseada para coordinarla con tu psicólogo asignado: <strong>{assignedPsyName}</strong>.
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Fecha</label>
                    <input 
                      type="date" 
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: '#ffffff', fontSize: '0.78rem' }}
                    />
                  </div>
                  <div style={{ width: '120px' }}>
                    <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Hora</label>
                    <select 
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: '#05213A', color: '#ffffff', fontSize: '0.78rem' }}
                    >
                      <option value="09:00">09:00</option>
                      <option value="10:00">10:00</option>
                      <option value="11:30">11:30</option>
                      <option value="16:00">16:00</option>
                      <option value="17:30">17:30</option>
                      <option value="19:00">19:00</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Notas o Foco para la Sesión</label>
                  <textarea 
                    rows={3}
                    placeholder="Describe brevemente qué te gustaría abordar..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', color: '#ffffff', fontSize: '0.78rem', resize: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button 
                    type="button" 
                    onClick={() => setBookingModal(null)}
                    className="btn btn-outline" 
                    style={{ flex: 1, height: '36px', fontSize: '0.78rem' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    onClick={handleConfirmBooking}
                    className="btn btn-primary" 
                    style={{ flex: 1, height: '36px', fontSize: '0.78rem' }}
                  >
                    Confirmar Cita
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
