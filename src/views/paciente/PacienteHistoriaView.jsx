import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  FileText, Activity, Heart, Moon, Upload, Plus, 
  ShieldCheck, Download, Trash2, Edit, Save, Users, 
  AlertTriangle, BookOpen, Layers, Target, Clock, RefreshCw, CheckCircle, Check, XCircle
} from 'lucide-react';
import { 
  getMedications, addMedication, 
  getTimelineEvents, addTimelineEvent, 
  getClinicalDocuments, getClinicalProfile, uploadClinicalDocument,
  getClinicalLifeTree, getClinicalTimelineIndex, getPatientContextSnapshot,
  getPendingProposals, acceptProposal, rejectProposal,
  AuthorityLevels, AuthorityLabels 
} from '../../lib/clinicalEngine';

export default function PacienteHistoriaView({ profile, onProfileUpdated, user, isVirtualDemo }) {
  const [activeTab, setActiveTab] = useState('resumen'); 
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  
  // Pipeline de ingesta de documentos y procesamiento en lote
  const [batchQueue, setBatchQueue] = useState([]); // Array de objetos { id, name, size, progress, status }
  const [isDragging, setIsDragging] = useState(false);

  // Cargar contexto clÃ­nico con fallbacks seguros
  const context = profile?.contexto_terapeutico || {};
  const demoClinicalHistory = isVirtualDemo ? {
    resumen_vital: 'Paciente manifiesta deseo de iniciar proceso de acompaÃ±amiento psicolÃ³gico regular para tratar problemas asociados con ansiedad, autoexigencia y control emocional.',
    antecedentes_psicologicos: 'Previamente realizÃ³ terapia cognitivo-conductual durante 6 meses en 2024 debido a ansiedad laboral. DecidiÃ³ suspenderla por falta de seguimiento diario y sensaciÃ³n de desconexiÃ³n entre sesiones.',
    antecedentes_medicos: 'Hipotiroidismo leve diagnosticado en 2021. Estilo de vida sedentario con periodos de insomnio por rumiaciÃ³n.',
    relaciones_contexto: 'Familia cercana en el extranjero. Convive con su pareja. Trabaja como analista de comunicaciÃ³n con alta presiÃ³n horaria.',
    patrones_comunes: 'Detonantes: plazos de entrega cortos, reuniones de evaluaciÃ³n semanales. Respuestas habituales: rumiaciÃ³n obsesiva nocturna, evitaciÃ³n activa de opiniones divergentes.'
  } : {};
  const clinicalHistory = context.historial_clinico || demoClinicalHistory;

  // Estados locales para ediciÃ³n de narrativa
  const [resumenVital, setResumenVital] = useState(clinicalHistory.resumen_vital || '');
  const [antecedentesPsic, setAntecedentesPsic] = useState(clinicalHistory.antecedentes_psicologicos || '');
  const [antecedentesMed, setAntecedentesMed] = useState(clinicalHistory.antecedentes_medicos || '');
  const [relacionesCtx, setRelacionesCtx] = useState(clinicalHistory.relaciones_contexto || '');
  const [patronesComunes, setPatronesComunes] = useState(clinicalHistory.patrones_comunes || '');
  
  // Nuevos campos para el Formulario ClÃ­nico Profundo
  const [historiaFamiliar, setHistoriaFamiliar] = useState(clinicalHistory.historia_familiar || '');
  const [antecedentesFamSalud, setAntecedentesFamSalud] = useState(clinicalHistory.antecedentes_familiares_salud || '');
  const [redApoyo, setRedApoyo] = useState(clinicalHistory.red_apoyo_social || '');
  const [percepcionSoledad, setPercepcionSoledad] = useState(clinicalHistory.percepcion_soledad || '');
  const [terapiasPreviasDetalle, setTerapiasPreviasDetalle] = useState(clinicalHistory.terapias_previas_detalle || '');
  const [razonAbandono, setRazonAbandono] = useState(clinicalHistory.razon_abandono || '');
  const [habitosSueno, setHabitosSueno] = useState(clinicalHistory.habitos_sueno || '');
  const [habitosVida, setHabitosVida] = useState(clinicalHistory.habitos_vida || '');
  const [estresPercibido, setEstresPercibido] = useState(clinicalHistory.estres_percibido || '');
  
  // Estado para alternar la vista del formulario manual profundo
  const [showManualForm, setShowManualForm] = useState(false);
  
  // MedicaciÃ³n y CronologÃ­a Reales de clinicalEngine
  const [meds, setMeds] = useState([]);
  const [events, setEvents] = useState([]);
  const [proposals, setProposals] = useState([]); // Propuestas pendientes de IA Ãncora
  const [clinicalProfile, setClinicalProfile] = useState(null);
  const [lifeTree, setLifeTree] = useState(null);
  const [timelineIndex, setTimelineIndex] = useState([]);
  const [contextSnapshot, setContextSnapshot] = useState(null);
  const [loadingClinicalData, setLoadingClinicalData] = useState(false);
  
  const [newMed, setNewMed] = useState({ name: '', dose: '', frequency: '', prescriber: '' });
  const [newEvent, setNewEvent] = useState({ date: '', event: '', event_type: 'other' });

  // Estados de ediciÃ³n para medicaciÃ³n y cronologÃ­a
  const [editingMedId, setEditingMedId] = useState(null);
  const [editedMedData, setEditedMedData] = useState({ name: '', dose: '', frequency: '', prescriber: '', authority_level: 3 });

  const [editingEventId, setEditingEventId] = useState(null);
  const [editedEventData, setEditedEventData] = useState({ date: '', event: '', event_type: 'other', associated_emotion: '', intensity: 5, authority_level: 3 });

  // Documentos
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileNameInput, setFileNameInput] = useState('');

  const conclusiones = context.conclusiones || (isVirtualDemo ? [
    'El paciente muestra resistencia a delegar responsabilidades laborales por miedo al error.',
    'La rumiaciÃ³n se activa principalmente a partir de las 20:00h al revisar correos pendientes.'
  ] : []);
  const pautasAccion = context.pautas_accion || (isVirtualDemo ? [
    'Limitar el acceso al correo corporativo despuÃ©s de las 19:00h.',
    'Realizar registro guiado en el diario de Ãncora ante picos de ansiedad.',
    'Practicar respiraciÃ³n diafragmÃ¡tica 4-7-8 durante 5 minutos en momentos de tensiÃ³n.'
  ] : []);

  // Cargar medicaciÃ³n, timeline y propuestas pendientes de clinicalEngine
  const loadClinicalData = async () => {
    if (!profile?.id) return;
    setLoadingClinicalData(true);
    try {
      const [dbMeds, dbEvents, dbProps, dbDocs, dbProfile, dbLifeTree, dbTimelineIndex, dbSnapshot] = await Promise.all([
        getMedications(profile.id),
        getTimelineEvents(profile.id),
        getPendingProposals(profile.id),
        getClinicalDocuments(profile.id),
        getClinicalProfile(profile.id),
        getClinicalLifeTree(profile.id),
        getClinicalTimelineIndex(profile.id),
        getPatientContextSnapshot(profile.id)
      ]);
      setMeds(dbMeds);
      setEvents(dbEvents);
      setProposals(dbProps);
      setUploadedFiles(dbDocs);
      setClinicalProfile(dbProfile);
      setLifeTree(dbLifeTree);
      setTimelineIndex(dbTimelineIndex);
      setContextSnapshot(dbSnapshot);
    } catch (err) {
      console.error("Error loading clinical data from engine:", err);
    } finally {
      setLoadingClinicalData(false);
    }
  };

  useEffect(() => {
    loadClinicalData();
  }, [profile?.id]);

  const formatFileSize = (value) => {
    if (typeof value === 'number') {
      if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(2)} MB`;
      if (value >= 1024) return `${(value / 1024).toFixed(1)} KB`;
      return `${value} B`;
    }
    return value || 'No indicado';
  };

  const formatDateTime = (value) => {
    if (!value) return 'No indicado';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const getDocumentStatusInfo = (status) => {
    const map = {
      pending: { label: 'Pendiente', color: 'var(--text-secondary)' },
      processing: { label: 'Procesando', color: 'var(--color-cyan)' },
      ready: { label: 'Listo', color: 'var(--color-emerald)' },
      error: { label: 'Error', color: 'var(--color-rose)' }
    };
    return map[status] || { label: status || 'Pendiente', color: 'var(--text-secondary)' };
  };

  const getProposalTypeInfo = (type) => {
    const map = {
      medication: { label: 'Medicacion', color: 'var(--color-cyan)' },
      timeline_event: { label: 'Evento', color: 'var(--color-emerald)' },
      clinical_fact: { label: 'Hecho clinico', color: 'var(--color-cyan)' },
      risk_event: { label: 'Riesgo', color: 'var(--color-rose)' },
      profile_patch: { label: 'Perfil clinico', color: 'var(--color-emerald)' },
      question: { label: 'Pregunta', color: 'var(--color-cyan)' }
    };
    return map[type] || { label: type || 'Propuesta', color: 'var(--color-cyan)' };
  };

  const getProposalBody = (prop) => {
    const data = prop.proposal_data || {};
    return data.claim || data.event || data.name || data.question || data.summary_vital || data.risk_summary || 'Propuesta pendiente de revision.';
  };

  const pendingProfilePatches = proposals.filter(p => p.proposal_type === 'profile_patch' && p.status === 'pending');
  const lifeTreeData = lifeTree?.tree_data || {};
  const lifeTreeSections = [
    ['family_origin', 'Familia de origen'],
    ['childhood', 'Infancia'],
    ['adolescence', 'Adolescencia'],
    ['relationships', 'Relaciones'],
    ['ruptures_losses', 'Rupturas y pÃ©rdidas'],
    ['work_studies', 'Trabajo y estudios'],
    ['health', 'Salud'],
    ['supports_resources', 'Apoyos y recursos'],
    ['current_situation', 'SituaciÃ³n actual'],
    ['protective_factors', 'Factores protectores'],
    ['open_questions', 'Preguntas abiertas']
  ];
  const renderTreeValue = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? item : JSON.stringify(item));
    if (typeof value === 'object') return [JSON.stringify(value)];
    return [String(value)];
  };

  // Guardar cambios narrativos en Supabase
  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveStatus('');
    try {
      const updatedHistory = {
        resumen_vital: resumenVital,
        antecedentes_psicologicos: antecedentesPsic,
        antecedentes_medicos: antecedentesMed,
        relaciones_contexto: relacionesCtx,
        patrones_comunes: patronesComunes,
        // Campos de la ficha clÃ­nica profunda
        historia_familiar: historiaFamiliar,
        antecedentes_familiares_salud: antecedentesFamSalud,
        red_apoyo_social: redApoyo,
        percepcion_soledad: percepcionSoledad,
        terapias_previas_detalle: terapiasPreviasDetalle,
        razon_abandono: razonAbandono,
        habitos_sueno: habitosSueno,
        habitos_vida: habitosVida,
        estres_percibido: estresPercibido
      };

      const newContext = {
        ...context,
        historial_clinico: updatedHistory
      };

      const { data, error } = await supabase
        .from('profiles')
        .update({ contexto_terapeutico: newContext })
        .eq('id', profile.id)
        .select()
        .single();

      if (error) throw error;
      
      if (onProfileUpdated) {
        onProfileUpdated(data);
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error("Error saving medical history:", err.message);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  // Agregar medicaciÃ³n real
  const addMed = async () => {
    if (!newMed.name.trim() || !profile?.id) return;
    try {
      const added = await addMedication(profile.id, newMed, AuthorityLevels.DECLARED);
      setMeds(prev => [...prev, added]);
      setNewMed({ name: '', dose: '', frequency: '', prescriber: '' });
    } catch (err) {
      console.error("Error adding medication:", err);
    }
  };

  // Quitar medicaciÃ³n
  const removeMed = async (medId) => {
    try {
      // Para simplificar, si es local o DB, filtramos localmente y actualizamos en localStorage/DB
      setMeds(prev => prev.filter(m => m.id !== medId));
      const key = `meds_${profile.id}`;
      const localMeds = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(localMeds.filter(m => m.id !== medId)));
      
      // Intentar borrar en Supabase
      await supabase.from('medications').delete().eq('id', medId);
    } catch (err) {
      console.error("Error removing medication:", err);
    }
  };

  // Agregar evento de cronologÃ­a real
  const addEvent = async () => {
    if (!newEvent.event.trim() || !newEvent.date || !profile?.id) return;
    try {
      const added = await addTimelineEvent(profile.id, newEvent, AuthorityLevels.DECLARED);
      setEvents(prev => [...prev, added].sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));
      setNewEvent({ date: '', event: '', event_type: 'other' });
    } catch (err) {
      console.error("Error adding event:", err);
    }
  };

  // Quitar evento
  const removeEvent = async (eventId) => {
    try {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      const key = `timeline_${profile.id}`;
      const localEvents = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify(localEvents.filter(e => e.id !== eventId)));

      await supabase.from('timeline_events').delete().eq('id', eventId);
    } catch (err) {
      console.error("Error removing timeline event:", err);
    }
  };

  // Actualizar medicaciÃ³n
  const handleUpdateMed = async (medId) => {
    if (!editedMedData.name.trim()) return;
    try {
      setMeds(prev => prev.map(m => m.id === medId ? { ...m, ...editedMedData } : m));
      const key = `meds_${profile.id}`;
      const localMeds = JSON.parse(localStorage.getItem(key) || '[]');
      const updatedLocal = localMeds.map(m => m.id === medId ? { ...m, ...editedMedData } : m);
      localStorage.setItem(key, JSON.stringify(updatedLocal));

      await supabase
        .from('medications')
        .update({
          name: editedMedData.name,
          dose: editedMedData.dose,
          frequency: editedMedData.frequency,
          prescriber: editedMedData.prescriber,
          authority_level: editedMedData.authority_level
        })
        .eq('id', medId);

      setEditingMedId(null);
    } catch (err) {
      console.error("Error updating medication:", err);
    }
  };

  // Actualizar evento de timeline
  const handleUpdateEvent = async (eventId) => {
    if (!editedEventData.event.trim()) return;
    try {
      const updatedObj = {
        event_date: editedEventData.date,
        description: editedEventData.event,
        event_type: editedEventData.event_type,
        associated_emotion: editedEventData.associated_emotion,
        intensity: editedEventData.intensity,
        authority_level: editedEventData.authority_level
      };

      setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...updatedObj } : e).sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()));
      
      const key = `timeline_${profile.id}`;
      const localEvents = JSON.parse(localStorage.getItem(key) || '[]');
      const updatedLocal = localEvents.map(e => e.id === eventId ? { ...e, ...updatedObj } : e);
      localStorage.setItem(key, JSON.stringify(updatedLocal));

      await supabase
        .from('timeline_events')
        .update(updatedObj)
        .eq('id', eventId);

      setEditingEventId(null);
    } catch (err) {
      console.error("Error updating timeline event:", err);
    }
  };

  // Procesar archivos en lote
  const processBatchQueue = async (filesList) => {
    if (!profile?.id) return;
    const newItems = Array.from(filesList).map(file => ({
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      progress: 0,
      status: 'pending',
      fileObject: file
    }));

    setBatchQueue(prev => [...prev, ...newItems]);

    // Procesar secuencialmente
    for (const item of newItems) {
      await processSingleFile(item);
    }
  };

  const processSingleFile = async (item) => {
    try {
      setBatchQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading', progress: 35 } : q));
      await uploadClinicalDocument(item.fileObject, profile.id);
      setBatchQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'processing', progress: 85 } : q));
      setBatchQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'completed', progress: 100 } : q));
      await loadClinicalData();
    } catch (err) {
      console.error("Error al procesar archivo en pipeline:", err);
      setBatchQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', progress: 100, error: err.message } : q));
    }

    setTimeout(() => {
      setBatchQueue(prev => prev.filter(q => q.id !== item.id));
    }, 1800);
  };

  // Aceptar y consolidar propuestas de IA Ãncora desde el portal del paciente
  const handleAcceptProposal = async (proposal) => {
    try {
      await acceptProposal(proposal);
      await loadClinicalData();
    } catch (err) {
      console.error("Error al consolidar propuesta:", err);
    }
  };

  const handleRejectProposal = async (proposalId) => {
    try {
      await rejectProposal(proposalId, profile.id);
      await loadClinicalData();
    } catch (err) {
      console.error("Error al rechazar propuesta:", err);
    }
  };

  // Subir manualmente escribiendo
  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!fileNameInput.trim() || !profile?.id) return;
    
    const typedNote = fileNameInput.trim();
    const originalFileName = `nota_manual_${new Date().toISOString().substring(0, 10)}.txt`;
    setFileNameInput('');

    const virtualFile = new File([typedNote], originalFileName, { type: 'text/plain' });
    await processBatchQueue([virtualFile]);
  };

  // Manejo de drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processBatchQueue(e.dataTransfer.files);
    }
  };

  // Manejo del paste (pegar)
  const handlePaste = (e) => {
    if (activeTab !== 'documentos') return; // Solo procesar en documentos
    const files = [];
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      for (let i = 0; i < e.clipboardData.files.length; i++) {
        files.push(e.clipboardData.files[i]);
      }
    } else {
      const pastedText = e.clipboardData.getData('text');
      if (pastedText && pastedText.trim().length > 10) {
        const textFile = new File([pastedText], `Texto_Pegado_${new Date().toISOString().substring(0, 10)}.txt`, { type: 'text/plain' });
        files.push(textFile);
      }
    }

    if (files.length > 0) {
      processBatchQueue(files);
    }
  };

  // Registrar listener de paste global en el tab de documentos
  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [activeTab, profile?.id]);

  // Exportar datos
  const exportData = (format) => {
    const rawData = {
      profile: {
        id: user.id,
        email: user.email,
        display_name: profile?.display_name
      },
      conclusiones_clinicas: conclusiones,
      pautas_terapeuticas: pautasAccion,
      historial_clinico: {
        resumen_vital: resumenVital,
        antecedentes_psicologicos: antecedentesPsic,
        antecedentes_medicos: antecedentesMed,
        relaciones_contexto: relacionesCtx,
        patrones_comunes: patronesComunes,
        medicacion: meds,
        cronologia_eventos: events
      }
    };

    let fileContent = '';
    let mimeType = 'application/json';
    let fileName = `expediente_ancora_${user.id}`;

    if (format === 'json') {
      fileContent = JSON.stringify(rawData, null, 2);
      mimeType = 'application/json';
      fileName += '.json';
    } else if (format === 'markdown') {
      fileContent = `# Expediente ClÃ­nico Vivo - Ãncora
**Usuario ID:** ${user.id}
**Email:** ${user.email}

## 1. Resumen Vital
${resumenVital}

## 2. Antecedentes PsicolÃ³gicos
${antecedentesPsic}

## 3. Antecedentes MÃ©dicos
${antecedentesMed}

## 4. Relaciones y Contexto
${relacionesCtx}

## 5. Patrones y Desencadenantes
${patronesComunes}

## 6. Pautas de AcciÃ³n
${pautasAccion.map(p => `- ${p}`).join('\n')}

## 7. Conclusiones IA/PsicÃ³logo
${conclusiones.map(c => `- ${c}`).join('\n')}

## 8. Pauta de MedicaciÃ³n Declarada
${meds.map(m => `- **${m.name}** (${m.dose}): ${m.frequency} prescrito por ${m.prescriber}`).join('\n')}

## 9. CronologÃ­a
${events.map(ev => `- *${ev.date}*: ${ev.event}`).join('\n')}
`;
      mimeType = 'text/markdown';
      fileName += '.md';
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="view-content-limit" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '30px' }}>
      
      {/* Cabecera de Expediente */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Mi Historial ClÃ­nico</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Expediente vivo estructurado y verificado por tu psicÃ³logo asignado.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {saveStatus === 'success' && (
            <span style={{ fontSize: '0.72rem', color: 'var(--color-emerald)', fontWeight: 600 }}>âœ“ Cambios guardados correctamente</span>
          )}
          {saveStatus === 'error' && (
            <span style={{ fontSize: '0.72rem', color: 'var(--color-rose)', fontWeight: 600 }}>âœ— Error al guardar</span>
          )}
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="btn btn-emerald"
            style={{
              height: '34px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 14px',
              background: 'var(--color-emerald)',
              fontWeight: 700
            }}
          >
            {isSaving ? <Clock size={14} className="animate-spin" /> : <Save size={14} />}
            <span>{isSaving ? 'Guardando...' : 'Guardar Ficha'}</span>
          </button>
        </div>
      </div>

      {/* Selector de PestaÃ±as de Historial */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
        {[
          { id: 'resumen', label: 'Resumen Vital', icon: BookOpen },
          { id: 'sintesis_ia', label: 'Sintesis IA', icon: ShieldCheck },
          { id: 'arbol_vital', label: 'Arbol vital', icon: Layers },
          { id: 'cronologia', label: 'Cronologia', icon: Clock },
          { id: 'psicologico', label: 'ðŸ§  Antecedentes PsicolÃ³gicos', icon: Heart },
          { id: 'medico', label: 'ðŸ©º Antecedentes MÃ©dicos', icon: Activity },
          { id: 'medicacion', label: 'ðŸ’Š MedicaciÃ³n', icon: Moon },
          { id: 'relaciones', label: 'ðŸ‘¥ Relaciones y Contexto', icon: Users },
          { id: 'patrones', label: 'ðŸ§© Patrones y Detonantes', icon: Layers },
          { id: 'objetivos', label: 'ðŸŽ¯ Objetivos y Pautas', icon: Target },
          { id: 'documentos', label: 'ðŸ“ Documentos', icon: FileText },
          { id: 'exportacion', label: 'ðŸ“¥ Exportar', icon: Download }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '10px 14px',
                borderRadius: '8px 8px 0 0',
                borderBottom: isActive ? '3px solid var(--color-cyan)' : '3px solid transparent',
                background: isActive ? 'rgba(255,255,255,0.02)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all var(--transition-fast)',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={14} color={isActive ? 'var(--color-cyan)' : 'var(--text-tertiary)'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contenido de las PestaÃ±as */}
      <div className="glass-panel" style={{ padding: '24px', minHeight: '340px', background: 'rgba(5, 33, 58, 0.15)' }}>
        
        {/* PESTAÃ‘A 1: RESUMEN VITAL */}
        {activeTab === 'resumen' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            
            {/* GUÃA DE BIENVENIDA DE WALTER IA (EXPEDIENTE CLÃNICO VIVO) */}
            <div className="glass-panel" style={{ padding: '20px', border: '1px solid rgba(6,182,212,0.15)', background: 'rgba(6,182,212,0.01)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                <Layers size={20} color="var(--color-cyan)" className="animate-pulse-soft" />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: '#ffffff', margin: 0 }}>
                  ðŸš€ Tu Expediente ClÃ­nico Vivo en Ãncora
                </h3>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45, margin: '0 0 16px 0' }}>
                Prepara tu expediente antes de las sesiones de forma flexible y segura. IA Ãncora analizarÃ¡ de forma inmutable la informaciÃ³n que aportes y redactarÃ¡ propuestas que tu psicÃ³logo revisarÃ¡ contigo. Puedes ir aportando datos continuamente.
              </p>
              
              {/* Tarjetas de caracterÃ­sticas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <strong style={{ fontSize: '0.74rem', color: 'var(--color-cyan)', display: 'block', marginBottom: '4px' }}>ðŸ“‚ 1. Todo tipo de Archivos</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', lineHeight: 1.35, display: 'block' }}>
                    Sube informes PDF, analÃ­ticas de sangre, fotos de tus recetas/cajas de medicamentos o notas escritas de texto.
                  </span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <strong style={{ fontSize: '0.74rem', color: 'var(--color-cyan)', display: 'block', marginBottom: '4px' }}>ðŸŽ¤ 2. Diarios y Audios</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', lineHeight: 1.35, display: 'block' }}>
                    Graba diarios de voz o audios de sesiones. IA Ãncora los transcribirÃ¡ de forma privada para extraer la cronologÃ­a de hitos vitales.
                  </span>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <strong style={{ fontSize: '0.74rem', color: 'var(--color-cyan)', display: 'block', marginBottom: '4px' }}>ðŸ”„ 3. Control ClÃ­nico</strong>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', lineHeight: 1.35, display: 'block' }}>
                    La IA no decide tu tratamiento. Cada dato extraÃ­do queda en revisiÃ³n hasta que tu psicÃ³logo lo valide en el panel clÃ­nico.
                  </span>
                </div>
              </div>
            </div>

            {(clinicalProfile || pendingProfilePatches.length > 0) && (
              <div className="glass-panel" style={{ padding: '16px', border: '1px solid rgba(16,185,129,0.18)', background: 'rgba(16,185,129,0.03)', borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <ShieldCheck size={16} color="var(--color-emerald)" />
                  <strong style={{ fontSize: '0.82rem', color: '#ffffff' }}>
                    {clinicalProfile ? 'Perfil clinico consolidado' : 'Borrador IA pendiente de revision'}
                  </strong>
                </div>
                {clinicalProfile ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {clinicalProfile.summary_vital && <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-emerald)' }}>Resumen:</strong> {clinicalProfile.summary_vital}</p>}
                    {clinicalProfile.psychological_history && <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-emerald)' }}>Antecedentes:</strong> {clinicalProfile.psychological_history}</p>}
                    {clinicalProfile.patterns && <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-emerald)' }}>Patrones:</strong> {clinicalProfile.patterns}</p>}
                    {clinicalProfile.goals && <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-emerald)' }}>Objetivos:</strong> {clinicalProfile.goals}</p>}
                    {clinicalProfile.risk_summary && <p style={{ margin: 0 }}><strong style={{ color: 'var(--color-rose)' }}>Riesgo:</strong> {clinicalProfile.risk_summary}</p>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {pendingProfilePatches.map(prop => (
                      <div key={prop.id} style={{ padding: '10px 12px', background: 'rgba(0,0,0,0.18)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <p style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '0.76rem', lineHeight: 1.4 }}>{getProposalBody(prop)}</p>
                        {(prop.source_quote || prop.source_metadata?.quote) && (
                          <span style={{ fontSize: '0.64rem', color: 'var(--text-secondary)' }}>Cita: {prop.source_quote || prop.source_metadata?.quote}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ZONA DE ACCIÃ“N: MÃ‰TODOS DE APORTACIÃ“N */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '16px' }}>
              <button 
                onClick={() => setActiveTab('documentos')}
                className="btn btn-cyan"
                style={{ flex: 1, height: '40px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 'bold', minWidth: '180px', background: 'var(--color-cyan)', color: '#000' }}
              >
                <Upload size={14} />
                <span>Subir e Ingestar Documento / Audio</span>
              </button>
              <button 
                onClick={() => setShowManualForm(!showManualForm)}
                className="btn btn-outline"
                style={{ flex: 1, height: '40px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', minWidth: '180px', color: 'var(--color-cyan)', borderColor: 'rgba(6,182,212,0.3)' }}
              >
                <Layers size={14} />
                <span>{showManualForm ? 'Ocultar Ficha Manual' : 'Rellenar Ficha Manualmente'}</span>
              </button>
            </div>

            {/* FORMULARIO CLÃNICO MANUAL (ONBOARDING PROFUNDO) */}
            {showManualForm ? (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                  <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase', margin: 0 }}>
                    Formulario ClÃ­nico Profundo (Ficha del Paciente)
                  </h4>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>Completa esta informaciÃ³n para dar contexto estructural a tu psicÃ³logo.</span>
                </div>

                {/* Narrativa BÃ¡sica */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>Narrativa General y Motivo de Consulta</label>
                  <textarea
                    value={resumenVital}
                    onChange={(e) => setResumenVital(e.target.value)}
                    className="form-input"
                    rows={4}
                    style={{ width: '100%', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', color: '#ffffff', fontSize: '0.76rem', lineHeight: 1.4, resize: 'vertical' }}
                    placeholder="Resume brevemente por quÃ© decides iniciar este proceso psicolÃ³gico ahora..."
                  />
                </div>

                {/* SECCIÃ“N 1: FAMILIA Y PASADO */}
                <div style={{ padding: '16px', background: 'rgba(0,0,0,0.12)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                    ðŸ‘ª Familia y Pasado
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>DinÃ¡micas Familiares y Relaciones en tu infancia</label>
                    <textarea
                      value={historiaFamiliar}
                      onChange={(e) => setHistoriaFamiliar(e.target.value)}
                      className="form-input"
                      rows={3}
                      style={{ width: '100%', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: '#ffffff', fontSize: '0.74rem', resize: 'vertical' }}
                      placeholder="Â¿CÃ³mo describirÃ­as la relaciÃ³n con tus padres y hermanos durante tu infancia?..."
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Antecedentes Familiares de Salud Mental o FÃ­sica</label>
                    <textarea
                      value={antecedentesFamSalud}
                      onChange={(e) => setAntecedentesFamSalud(e.target.value)}
                      className="form-input"
                      rows={2}
                      style={{ width: '100%', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: '#ffffff', fontSize: '0.74rem', resize: 'vertical' }}
                      placeholder="Â¿Hay antecedentes en tu familia de depresiÃ³n, ansiedad, adicciones u otras patologÃ­as mÃ©dicas?..."
                    />
                  </div>
                </div>

                {/* SECCIÃ“N 2: RELACIONES Y RED DE APOYO */}
                <div style={{ padding: '16px', background: 'rgba(0,0,0,0.12)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                    ðŸ‘¥ Relaciones y Red de Apoyo Social
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>SituaciÃ³n de Pareja actual y Convivencia</label>
                    <textarea
                      value={redApoyo}
                      onChange={(e) => setRedApoyo(e.target.value)}
                      className="form-input"
                      rows={2}
                      style={{ width: '100%', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: '#ffffff', fontSize: '0.74rem', resize: 'vertical' }}
                      placeholder="Â¿Con quiÃ©n convives? Â¿CÃ³mo calificarÃ­as tu relaciÃ³n de pareja actual o de soporte familiar?..."
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Amigos y Sentimientos de Soledad</label>
                    <textarea
                      value={percepcionSoledad}
                      onChange={(e) => setPercepcionSoledad(e.target.value)}
                      className="form-input"
                      rows={2}
                      style={{ width: '100%', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: '#ffffff', fontSize: '0.74rem', resize: 'vertical' }}
                      placeholder="Â¿Cuentas con una red de amigos activa? Â¿Sueles experimentar sentimientos de soledad o aislamiento?..."
                    />
                  </div>
                </div>

                {/* SECCIÃ“N 3: TERAPIAS Y ANTECEDENTES TERAPÃ‰UTICOS */}
                <div style={{ padding: '16px', background: 'rgba(0,0,0,0.12)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                    ðŸ§  Procesos TerapÃ©uticos Anteriores
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Detalle de Terapias Anteriores y su utilidad</label>
                    <textarea
                      value={terapiasPreviasDetalle}
                      onChange={(e) => setTerapiasPreviasDetalle(e.target.value)}
                      className="form-input"
                      rows={2}
                      style={{ width: '100%', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: '#ffffff', fontSize: '0.74rem', resize: 'vertical' }}
                      placeholder="Â¿QuÃ© tipo de terapia realizaste anteriormente? Â¿QuÃ© herramientas te sirvieron o no?..."
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Razones de finalizaciÃ³n o abandono de terapias previas</label>
                    <textarea
                      value={razonAbandono}
                      onChange={(e) => setRazonAbandono(e.target.value)}
                      className="form-input"
                      rows={2}
                      style={{ width: '100%', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: '#ffffff', fontSize: '0.74rem', resize: 'vertical' }}
                      placeholder="Â¿Por quÃ© finalizÃ³ tu Ãºltimo proceso de terapia? (Abandono por falta de seguimiento, alta mÃ©dica, etc.)..."
                    />
                  </div>
                </div>

                {/* SECCIÃ“N 4: HÃBITOS Y ESTILO DE VIDA */}
                <div style={{ padding: '16px', background: 'rgba(0,0,0,0.12)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-emerald)', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                    ðŸ©º HÃ¡bitos de Vida, SueÃ±o y EstrÃ©s
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Calidad del SueÃ±o y Descanso nocturno</label>
                    <textarea
                      value={habitosSueno}
                      onChange={(e) => setHabitosSueno(e.target.value)}
                      className="form-input"
                      rows={2}
                      style={{ width: '100%', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: '#ffffff', fontSize: '0.74rem', resize: 'vertical' }}
                      placeholder="Â¿Sufres de insomnio de conciliaciÃ³n o rumiaciÃ³n nocturna? Â¿CuÃ¡ntas horas sueles dormir?..."
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>AlimentaciÃ³n, Ejercicio y Consumo de estimulantes</label>
                    <textarea
                      value={habitosVida}
                      onChange={(e) => setHabitosVida(e.target.value)}
                      className="form-input"
                      rows={2}
                      style={{ width: '100%', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: '#ffffff', fontSize: '0.74rem', resize: 'vertical' }}
                      placeholder="HÃ¡bitos generales de alimentaciÃ³n, actividad fÃ­sica y consumo de cafeÃ­na/alcohol/tabaco..."
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Nivel de EstrÃ©s laboral o financiero percibido</label>
                    <textarea
                      value={estresPercibido}
                      onChange={(e) => setEstresPercibido(e.target.value)}
                      className="form-input"
                      rows={2}
                      style={{ width: '100%', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: '#ffffff', fontSize: '0.74rem', resize: 'vertical' }}
                      placeholder="Â¿CÃ³mo calificarÃ­as tu nivel actual de estrÃ©s derivado del trabajo, finanzas u otras obligaciones?..."
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="btn btn-emerald"
                  style={{ height: '40px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'var(--color-emerald)', color: '#fff', fontWeight: 'bold', width: '100%' }}
                >
                  {isSaving ? <Clock size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{isSaving ? 'Guardando cambios en expediente...' : 'Guardar y Consolidar Historia'}</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>Narrativa General y Motivo de Consulta</label>
                <textarea
                  value={resumenVital}
                  onChange={(e) => setResumenVital(e.target.value)}
                  className="form-input"
                  rows={8}
                  style={{ width: '100%', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', color: '#ffffff', fontSize: '0.8rem', lineHeight: 1.45, resize: 'vertical' }}
                  placeholder="Escribe un resumen general de tu situaciÃ³n vital actual..."
                />
              </div>
            )}
          </div>
        )}

        {/* PESTAÃ‘A 2: CRONOLOGÃA */}
        {activeTab === 'sintesis_ia' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>Memoria compacta para el chat</span>
                <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  Esta es la sintesis que consume la IA en conversacion. No incluye documentos completos ni extracciones largas.
                </p>
              </div>
              {contextSnapshot?.created_at && (
                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>
                  Actualizada: {formatDateTime(contextSnapshot.created_at)}
                </span>
              )}
            </div>

            <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(6,182,212,0.18)', background: 'rgba(6,182,212,0.025)' }}>
              {contextSnapshot?.content ? (
                <p style={{ whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.76rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                  {contextSnapshot.content}
                </p>
              ) : (
                <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                  Todavia no hay snapshot clinico. Sube documentos o cierra una sesion de chat para que el motor genere la primera sintesis.
                </p>
              )}
            </div>

            {contextSnapshot?.summary?.for_next_session && (
              <div className="glass-panel" style={{ padding: '16px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.16)', background: 'rgba(16,185,129,0.025)' }}>
                <strong style={{ fontSize: '0.78rem', color: 'var(--color-emerald)', display: 'block', marginBottom: '10px' }}>Para proxima sesion</strong>
                <p style={{ margin: '0 0 10px', fontSize: '0.74rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {contextSnapshot.summary.for_next_session.briefing || 'Sin briefing generado.'}
                </p>
                {(contextSnapshot.summary.for_next_session.questions || []).map((question, idx) => (
                  <div key={idx} style={{ fontSize: '0.72rem', color: '#fff', padding: '8px 10px', borderRadius: '6px', background: 'rgba(0,0,0,0.18)', marginBottom: '6px' }}>
                    {question}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'arbol_vital' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', textAlign: 'left' }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>Arbol vital sintetizado</span>
              <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                Organizacion por areas vitales. Todo lo generado por IA debe revisarse antes de tratarlo como dato estable.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {lifeTreeSections.map(([key, label]) => {
                const values = renderTreeValue(lifeTreeData[key]);
                return (
                  <div key={key} className="glass-panel" style={{ padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.12)' }}>
                    <strong style={{ display: 'block', color: '#fff', fontSize: '0.76rem', marginBottom: '8px' }}>{label}</strong>
                    {values.length > 0 ? values.map((item, idx) => (
                      <p key={idx} style={{ margin: '0 0 6px', color: 'var(--text-secondary)', fontSize: '0.72rem', lineHeight: 1.4 }}>
                        {item}
                      </p>
                    )) : (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>Sin datos sintetizados.</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {activeTab === 'cronologia' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>LÃ­nea Temporal de Hitos y Eventos</span>
            {timelineIndex.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px', borderRadius: '8px', border: '1px solid rgba(6,182,212,0.14)', background: 'rgba(6,182,212,0.025)' }}>
                <strong style={{ fontSize: '0.76rem', color: '#fff' }}>Eje cronologico sintetizado por la IA</strong>
                {timelineIndex.map((item) => (
                  <div key={item.id} style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.16)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.72rem', color: 'var(--color-cyan)' }}>{item.event_date || 'Sin fecha clinica'}</strong>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{item.date_precision || 'unknown'} · {item.life_stage || 'unknown'} · {item.domain || 'other'}</span>
                    </div>
                    <p style={{ margin: '0 0 4px', fontSize: '0.75rem', color: '#fff', lineHeight: 1.4 }}>{item.title || item.description}</p>
                    {item.description && item.description !== item.title && (
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.description}</p>
                    )}
                    {Array.isArray(item.evidence_quotes) && item.evidence_quotes[0] && (
                      <p style={{ margin: '6px 0 0', fontSize: '0.66rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Cita: {item.evidence_quotes[0]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Agregar evento */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input 
                type="date"
                value={newEvent.date}
                onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                style={{ height: '36px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 10px', color: '#ffffff' }}
              />
              <input 
                type="text"
                value={newEvent.event}
                onChange={(e) => setNewEvent(prev => ({ ...prev, event: e.target.value }))}
                placeholder="Nombre del evento (ej. Cambio de departamento laboral)..."
                style={{ flex: 1, height: '36px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 12px', color: '#ffffff' }}
              />
              <button 
                type="button" 
                onClick={addEvent}
                className="btn btn-cyan"
                style={{ height: '36px', padding: '0 16px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={14} />
                <span>AÃ±adir</span>
              </button>
            </div>

            {/* Listado de eventos */}
            <div style={{ position: 'relative', paddingLeft: '20px', borderLeft: '2px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
              {events.map((ev) => {
                if (editingEventId === ev.id) {
                  return (
                    <div key={ev.id} style={{ position: 'relative', marginBottom: '10px' }}>
                      <div style={{ position: 'absolute', left: '-26px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-cyan)', border: '2px solid var(--background-secondary)' }} />
                      <div 
                        style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '12px', 
                          background: 'rgba(255,255,255,0.02)', 
                          padding: '16px', 
                          borderRadius: '6px', 
                          border: '1px solid rgba(6,182,212,0.3)',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Fecha</label>
                            <input 
                              type="date"
                              value={editedEventData.date}
                              onChange={(e) => setEditedEventData(prev => ({ ...prev, date: e.target.value }))}
                              style={{ height: '32px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 8px', color: '#ffffff' }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Tipo de Evento</label>
                            <select 
                              value={editedEventData.event_type}
                              onChange={(e) => setEditedEventData(prev => ({ ...prev, event_type: e.target.value }))}
                              style={{ height: '32px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 8px', color: '#ffffff' }}
                            >
                              <option value="vital_event">Suceso Vital</option>
                              <option value="symptom_start">Inicio de SÃ­ntomas</option>
                              <option value="therapy_session">SesiÃ³n de Terapia</option>
                              <option value="crisis">Crisis/Malestar Agudo</option>
                              <option value="other">Otro</option>
                            </select>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>EmociÃ³n Asociada</label>
                            <input 
                              type="text"
                              value={editedEventData.associated_emotion}
                              onChange={(e) => setEditedEventData(prev => ({ ...prev, associated_emotion: e.target.value }))}
                              style={{ height: '32px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 8px', color: '#ffffff' }}
                              placeholder="Ej. Tristeza, Alivio..."
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Intensidad (1-10)</label>
                            <input 
                              type="number"
                              min={1}
                              max={10}
                              value={editedEventData.intensity}
                              onChange={(e) => setEditedEventData(prev => ({ ...prev, intensity: parseInt(e.target.value) || 5 }))}
                              style={{ height: '32px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 8px', color: '#ffffff' }}
                            />
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Autoridad ClÃ­nica</label>
                            <select 
                              value={editedEventData.authority_level}
                              onChange={(e) => setEditedEventData(prev => ({ ...prev, authority_level: parseInt(e.target.value) }))}
                              style={{ height: '32px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 8px', color: '#ffffff' }}
                            >
                              <option value={1}>Validado por PsicÃ³logo</option>
                              <option value={2}>Documentado en Informe</option>
                              <option value={3}>Declarado por Paciente</option>
                              <option value={4}>Inferencia IA Ãncora</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>DescripciÃ³n del Evento</label>
                          <textarea 
                            value={editedEventData.event}
                            onChange={(e) => setEditedEventData(prev => ({ ...prev, event: e.target.value }))}
                            rows={2}
                            style={{ background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '8px', color: '#ffffff', fontSize: '0.75rem', width: '100%', resize: 'vertical' }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          <button 
                            type="button" 
                            onClick={() => handleUpdateEvent(ev.id)}
                            className="btn btn-emerald"
                            style={{ height: '28px', padding: '0 10px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--color-emerald)', color: '#fff', fontWeight: 'bold' }}
                          >
                            <Check size={12} />
                            <span>Guardar</span>
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setEditingEventId(null)}
                            className="btn btn-outline"
                            style={{ height: '28px', padding: '0 10px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                          >
                            <XCircle size={12} />
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={ev.id || ev.event_date + ev.description} style={{ position: 'relative' }}>
                    <div style={{ position: 'absolute', left: '-26px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-cyan)', border: '2px solid var(--background-secondary)' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--background-secondary)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.72rem', color: 'var(--color-cyan)', margin: 0 }}>{ev.event_date || ev.date}</strong>
                          {ev.authority_level && (
                            <span 
                              className="badge" 
                              style={{ 
                                fontSize: '0.52rem', 
                                padding: '1px 5px', 
                                background: ev.authority_level === 1 ? 'rgba(16,185,129,0.1)' : (ev.authority_level === 2 ? 'rgba(6,182,212,0.1)' : 'rgba(245,158,11,0.08)'), 
                                color: ev.authority_level === 1 ? 'var(--color-emerald)' : (ev.authority_level === 2 ? 'var(--color-cyan)' : 'var(--color-amber)') 
                              }}
                            >
                              {ev.authority_level === 1 ? 'Validado por PsicÃ³logo' : (ev.authority_level === 2 ? 'Documentado' : 'Declarado')}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#ffffff' }}>{ev.description || ev.event}</span>
                        {ev.associated_emotion && (
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                            EmociÃ³n: {ev.associated_emotion} (Intensidad: {ev.intensity}/10)
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          type="button" 
                          onClick={() => {
                            setEditingEventId(ev.id);
                            setEditedEventData({
                              date: ev.event_date || ev.date || '',
                              event: ev.description || ev.event || '',
                              event_type: ev.event_type || 'other',
                              associated_emotion: ev.associated_emotion || '',
                              intensity: ev.intensity || 5,
                              authority_level: ev.authority_level || 3
                            });
                          }}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          type="button" 
                          onClick={() => removeEvent(ev.id)}
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Propuestas pendientes para CronologÃ­a */}
            {(() => {
              const pendingTimelineProps = proposals.filter(p => p.proposal_type === 'timeline_event' && p.status === 'pending');
              if (pendingTimelineProps.length === 0) return null;
              return (
                <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(6, 182, 212, 0.03)', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                    <RefreshCw size={14} className="animate-spin-slow" color="var(--color-cyan)" />
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>
                      Propuestas de IA Ãncora para tu CronologÃ­a ({pendingTimelineProps.length})
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pendingTimelineProps.map((prop) => (
                      <div key={prop.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ flex: 1, marginRight: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-cyan)' }}>{prop.proposal_data.date}</span>
                            <span style={{ fontSize: '0.62rem', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-cyan)', padding: '2px 6px', borderRadius: '4px' }}>
                              Confianza: {Math.round(prop.confidence * 100)}%
                            </span>
                            {prop.source_metadata?.fileName && (
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>
                                Origen: {prop.source_metadata.fileName}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.76rem', color: '#ffffff', margin: 0, lineHeight: 1.4 }}>{prop.proposal_data.event}</p>
                          {prop.proposal_data.associated_emotion && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                              EmociÃ³n sugerida: <em>{prop.proposal_data.associated_emotion}</em> (Intensidad: {prop.proposal_data.intensity}/10)
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleAcceptProposal(prop)}
                            className="btn btn-emerald"
                            style={{ padding: '6px 12px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', background: 'var(--color-emerald)', color: '#fff' }}
                          >
                            <Check size={12} />
                            <span>Aceptar</span>
                          </button>
                          <button
                            onClick={() => handleRejectProposal(prop.id)}
                            className="btn btn-outline"
                            style={{ padding: '6px 12px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--color-rose)' }}
                          >
                            <XCircle size={12} />
                            <span>Rechazar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* PESTAÃ‘A 3: ANTECEDENTES PSICOLÃ“GICOS */}
        {activeTab === 'psicologico' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>Procesos TerapÃ©uticos Anteriores y Enfoques</label>
            <textarea
              value={antecedentesPsic}
              onChange={(e) => setAntecedentesPsic(e.target.value)}
              className="form-input"
              rows={8}
              style={{ width: '100%', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', color: '#ffffff', fontSize: '0.8rem', lineHeight: 1.45, resize: 'vertical' }}
              placeholder="Describe terapias anteriores y lo que te ayudÃ³ o no te ayudÃ³..."
            />
          </div>
        )}

        {/* PESTAÃ‘A 4: ANTECEDENTES MÃ‰DICOS */}
        {activeTab === 'medico' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-emerald)', textTransform: 'uppercase' }}>Condiciones MÃ©dicas Generales y Estilo de Vida</label>
            <textarea
              value={antecedentesMed}
              onChange={(e) => setAntecedentesMed(e.target.value)}
              className="form-input"
              rows={8}
              style={{ width: '100%', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', color: '#ffffff', fontSize: '0.8rem', lineHeight: 1.45, resize: 'vertical' }}
              placeholder="Alergias relevantes, cirugÃ­as, analÃ­ticas, hÃ¡bitos, etc..."
            />
          </div>
        )}

        {/* PESTAÃ‘A 5: MEDICACIÃ“N */}
        {activeTab === 'medicacion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>Pauta de MedicaciÃ³n Declarada</span>
            
            {/* Formulario medicaciÃ³n */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              <input 
                type="text"
                value={newMed.name}
                onChange={(e) => setNewMed(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Medicamento (ej. Sertralina)"
                style={{ height: '36px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 10px', color: '#ffffff' }}
              />
              <input 
                type="text"
                value={newMed.dose}
                onChange={(e) => setNewMed(prev => ({ ...prev, dose: e.target.value }))}
                placeholder="Dosis (ej. 50mg)"
                style={{ height: '36px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 10px', color: '#ffffff' }}
              />
              <input 
                type="text"
                value={newMed.frequency}
                onChange={(e) => setNewMed(prev => ({ ...prev, frequency: e.target.value }))}
                placeholder="Frecuencia (ej. Diario en desayuno)"
                style={{ height: '36px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 10px', color: '#ffffff' }}
              />
              <input 
                type="text"
                value={newMed.prescriber}
                onChange={(e) => setNewMed(prev => ({ ...prev, prescriber: e.target.value }))}
                placeholder="MÃ©dico Prescriptor"
                style={{ height: '36px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 10px', color: '#ffffff' }}
              />
              <button 
                type="button" 
                onClick={addMed}
                className="btn btn-cyan"
                style={{ height: '36px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}
              >
                <Plus size={14} />
                <span>Agregar</span>
              </button>
            </div>

            {/* Listado medicaciones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {meds.map((med) => {
                if (editingMedId === med.id) {
                  return (
                    <div 
                      key={med.id}
                      style={{ 
                        padding: '16px', 
                        borderRadius: '8px', 
                        background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid rgba(6,182,212,0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>FÃ¡rmaco</label>
                          <input 
                            type="text"
                            value={editedMedData.name}
                            onChange={(e) => setEditedMedData(prev => ({ ...prev, name: e.target.value }))}
                            style={{ height: '32px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 8px', color: '#ffffff' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Dosis</label>
                          <input 
                            type="text"
                            value={editedMedData.dose}
                            onChange={(e) => setEditedMedData(prev => ({ ...prev, dose: e.target.value }))}
                            style={{ height: '32px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 8px', color: '#ffffff' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Frecuencia</label>
                          <input 
                            type="text"
                            value={editedMedData.frequency}
                            onChange={(e) => setEditedMedData(prev => ({ ...prev, frequency: e.target.value }))}
                            style={{ height: '32px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 8px', color: '#ffffff' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Prescriptor</label>
                          <input 
                            type="text"
                            value={editedMedData.prescriber}
                            onChange={(e) => setEditedMedData(prev => ({ ...prev, prescriber: e.target.value }))}
                            style={{ height: '32px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 8px', color: '#ffffff' }}
                          />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <label style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Autoridad ClÃ­nica</label>
                          <select 
                            value={editedMedData.authority_level}
                            onChange={(e) => setEditedMedData(prev => ({ ...prev, authority_level: parseInt(e.target.value) }))}
                            style={{ height: '32px', fontSize: '0.75rem', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0 8px', color: '#ffffff' }}
                          >
                            <option value={1}>Validado por PsicÃ³logo</option>
                            <option value={2}>Documentado en Informe</option>
                            <option value={3}>Declarado por Paciente</option>
                            <option value={4}>Inferencia IA Ãncora</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button 
                          type="button" 
                          onClick={() => handleUpdateMed(med.id)}
                          className="btn btn-emerald"
                          style={{ height: '28px', padding: '0 10px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--color-emerald)', color: '#fff', fontWeight: 'bold' }}
                        >
                          <Check size={12} />
                          <span>Guardar</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditingMedId(null)}
                          className="btn btn-outline"
                          style={{ height: '28px', padding: '0 10px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                        >
                          <XCircle size={12} />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div 
                    key={med.id}
                    style={{ 
                      padding: '12px 16px', 
                      borderRadius: '8px', 
                      background: 'var(--background-secondary)', 
                      border: '1px solid var(--border)',
                      borderLeft: '4px solid var(--color-cyan)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#ffffff', margin: 0 }}>{med.name} {med.dose}</strong>
                        {med.authority_level && (
                          <span 
                            className="badge" 
                            style={{ 
                              fontSize: '0.52rem', 
                              padding: '1px 5px', 
                              background: med.authority_level === 1 ? 'rgba(16,185,129,0.1)' : (med.authority_level === 2 ? 'rgba(6,182,212,0.1)' : 'rgba(245,158,11,0.08)'), 
                              color: med.authority_level === 1 ? 'var(--color-emerald)' : (med.authority_level === 2 ? 'var(--color-cyan)' : 'var(--color-amber)') 
                            }}
                          >
                            {med.authority_level === 1 ? 'Validado por PsicÃ³logo' : (med.authority_level === 2 ? 'Documentado' : 'Declarado')}
                          </span>
                        )}
                      </div>
                      <span>{med.frequency} Â· Prescriptor: {med.prescriber}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        type="button" 
                        onClick={() => {
                          setEditingMedId(med.id);
                          setEditedMedData({
                            name: med.name || '',
                            dose: med.dose || '',
                            frequency: med.frequency || '',
                            prescriber: med.prescriber || '',
                            authority_level: med.authority_level || 3
                          });
                        }}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => removeMed(med.id)}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Propuestas pendientes para MedicaciÃ³n */}
            {(() => {
              const pendingMedProps = proposals.filter(p => p.proposal_type === 'medication' && p.status === 'pending');
              if (pendingMedProps.length === 0) return null;
              return (
                <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(6, 182, 212, 0.03)', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.15)' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                    <RefreshCw size={14} className="animate-spin-slow" color="var(--color-cyan)" />
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>
                      Propuestas de MedicaciÃ³n detectadas por IA Ãncora ({pendingMedProps.length})
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pendingMedProps.map((prop) => (
                      <div key={prop.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '12px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div style={{ flex: 1, marginRight: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '0.8rem', color: '#ffffff' }}>{prop.proposal_data.name} {prop.proposal_data.dose}</strong>
                            <span style={{ fontSize: '0.62rem', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-cyan)', padding: '2px 6px', borderRadius: '4px' }}>
                              Confianza: {Math.round(prop.confidence * 100)}%
                            </span>
                            {prop.source_metadata?.fileName && (
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)' }}>
                                Origen: {prop.source_metadata.fileName}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0 }}>
                            Frecuencia sugerida: {prop.proposal_data.frequency} Â· Prescriptor sugerido: {prop.proposal_data.prescriber}
                          </p>
                          {prop.source_metadata?.textMessage && (
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', display: 'block', marginTop: '4px', fontStyle: 'italic' }}>
                              MenciÃ³n: "{prop.source_metadata.textMessage}"
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleAcceptProposal(prop)}
                            className="btn btn-emerald"
                            style={{ padding: '6px 12px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', background: 'var(--color-emerald)', color: '#fff' }}
                          >
                            <Check size={12} />
                            <span>Aceptar</span>
                          </button>
                          <button
                            onClick={() => handleRejectProposal(prop.id)}
                            className="btn btn-outline"
                            style={{ padding: '6px 12px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--color-rose)' }}
                          >
                            <XCircle size={12} />
                            <span>Rechazar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Aviso de seguridad */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(245,158,11,0.02)', border: '1px solid rgba(245,158,11,0.12)', padding: '12px', borderRadius: '6px', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              <AlertTriangle size={16} color="var(--color-amber)" style={{ flexShrink: 0 }} />
              <span>
                <strong>Nota de seguridad:</strong> El equipo de psicÃ³logos de ÃNCORA no prescribe ni modifica pautas farmacolÃ³gicas. Esta secciÃ³n recopila la medicaciÃ³n voluntariamente declarada por el paciente para fines de encuadre clÃ­nico multidisciplinar.
              </span>
            </div>
          </div>
        )}

        {/* PESTAÃ‘A 6: RELACIONES Y CONTEXTO */}
        {activeTab === 'relaciones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>Familia, Apoyo Social, Trabajo y Vivienda</label>
            <textarea
              value={relacionesCtx}
              onChange={(e) => setRelacionesCtx(e.target.value)}
              className="form-input"
              rows={8}
              style={{ width: '100%', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', color: '#ffffff', fontSize: '0.8rem', lineHeight: 1.45, resize: 'vertical' }}
              placeholder="Describe tus relaciones interpersonales, tu entorno familiar y situaciÃ³n econÃ³mica..."
            />
          </div>
        )}

        {/* PESTAÃ‘A 7: PATRONES Y DETONANTES */}
        {activeTab === 'patrones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>Pensamientos recurrentes, evitaciones y detonadores habituales</label>
            <textarea
              value={patronesComunes}
              onChange={(e) => setPatronesComunes(e.target.value)}
              className="form-input"
              rows={8}
              style={{ width: '100%', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '6px', padding: '12px', color: '#ffffff', fontSize: '0.8rem', lineHeight: 1.45, resize: 'vertical' }}
              placeholder="Identifica quÃ© activa tu malestar y quÃ© sueles hacer ante ello..."
            />
          </div>
        )}

        {/* PESTAÃ‘A 8: OBJETIVOS Y PAUTAS */}
        {activeTab === 'objetivos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            
            {/* Pautas de acciÃ³n */}
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Pautas clÃ­nicas y compromisos acordados</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {pautasAccion.map((pauta, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.76rem', color: '#ffffff' }}>
                    <span style={{ color: 'var(--color-cyan)', fontWeight: 700 }}>{idx + 1}.</span>
                    <span>{pauta}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Conclusiones IA/Terapeuta */}
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-emerald)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Conclusiones de anÃ¡lisis evolutivo</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {conclusiones.map((concl, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '6px', fontSize: '0.76rem', color: '#ffffff' }}>
                    <span style={{ color: 'var(--color-emerald)', fontWeight: 700 }}>âœ“</span>
                    <span>{concl}</span>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        )}

        {/* PESTAÃ‘A 9: DOCUMENTOS */}
        {activeTab === 'documentos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
            
            {/* Zona Drag & Drop y Paste Premium */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: isDragging ? '2px dashed var(--color-cyan)' : '2px dashed rgba(6, 182, 212, 0.25)',
                background: isDragging ? 'rgba(6, 182, 212, 0.08)' : 'rgba(5, 33, 58, 0.12)',
                padding: '30px 20px',
                borderRadius: '10px',
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isDragging ? '0 0 15px rgba(6, 182, 212, 0.15)' : 'none',
                position: 'relative'
              }}
            >
              <input 
                type="file" 
                id="file-upload-batch" 
                multiple 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    processBatchQueue(e.target.files);
                  }
                }}
                style={{ display: 'none' }}
              />
              
              <div 
                style={{ 
                  width: '46px', 
                  height: '46px', 
                  borderRadius: '50%', 
                  background: isDragging ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.03)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                <Upload size={22} color={isDragging ? 'var(--color-cyan)' : 'var(--text-secondary)'} />
              </div>
              
              <div>
                <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block', marginBottom: '4px' }}>
                  {isDragging ? 'Â¡Suelta tus archivos aquÃ­!' : 'Arrastra y suelta tus archivos clÃ­nicos aquÃ­'}
                </strong>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  O copia y pega (Ctrl+V) texto o imÃ¡genes. Soporta subidas en lote.
                </span>
              </div>
              
              <label 
                htmlFor="file-upload-batch"
                className="btn btn-outline"
                style={{ 
                  height: '32px', 
                  fontSize: '0.72rem', 
                  padding: '0 16px', 
                  borderColor: 'rgba(6,182,212,0.4)', 
                  color: 'var(--color-cyan)',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
                onClick={(e) => e.stopPropagation()} // Previene trigger del drop area
              >
                Examinar Archivos
              </label>
            </div>

            {/* Nota manual persistida como documento real */}
            <form onSubmit={handleFileUpload} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.12)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Nota rapida:</span>
              <input 
                type="text" 
                className="form-input" 
                value={fileNameInput} 
                onChange={(e) => setFileNameInput(e.target.value)}
                placeholder="Escribe una nota breve para procesarla como documento clinico..."
                style={{ height: '32px', fontSize: '0.74rem', border: '1px solid var(--border)', borderRadius: '6px', flex: 1, background: 'var(--background-tertiary)', color: '#fff', padding: '0 10px' }}
              />
              <button type="submit" disabled={batchQueue.length > 0} className="btn btn-cyan" style={{ height: '32px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', padding: '0 12px', background: 'var(--color-cyan)', color: '#000', fontWeight: 'bold' }}>
                <Plus size={12} />
                <span>Procesar Nota</span>
              </button>
            </form>

            {/* Bandeja rÃ¡pida de propuestas de IA Ãncora */}
            {(() => {
              const pendingAllProps = proposals.filter(p => p.status === 'pending');
              if (pendingAllProps.length === 0) return null;
              return (
                <div style={{ padding: '20px', background: 'rgba(6, 182, 212, 0.04)', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.2)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(6, 182, 212, 0.15)', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <RefreshCw size={16} className="animate-spin-slow" color="var(--color-cyan)" />
                      <strong style={{ fontSize: '0.85rem', color: '#ffffff' }}>
                        Bandeja de ExtracciÃ³n ClÃ­nica (IA Ãncora)
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.68rem', background: 'rgba(6, 182, 212, 0.2)', color: 'var(--color-cyan)', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
                      {pendingAllProps.length} propuestas por consolidar
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {pendingAllProps.map((prop) => (
                      <div 
                        key={prop.id} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          background: 'rgba(0,0,0,0.25)', 
                          padding: '12px 16px', 
                          borderRadius: '8px', 
                          border: '1px solid rgba(255,255,255,0.03)',
                          borderLeft: prop.proposal_type === 'medication' ? '4px solid var(--color-cyan)' : '4px solid var(--color-emerald)'
                        }}
                      >
                        <div style={{ flex: 1, marginRight: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.62rem', background: prop.proposal_type === 'medication' ? 'rgba(6,182,212,0.15)' : 'rgba(16,185,129,0.15)', color: prop.proposal_type === 'medication' ? 'var(--color-cyan)' : 'var(--color-emerald)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                              {getProposalTypeInfo(prop.proposal_type).label}
                            </span>
                            <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                              Confianza: {Math.round(prop.confidence * 100)}%
                            </span>
                            {prop.source_metadata?.fileName && (
                              <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', background: 'rgba(255,255,255,0.02)', padding: '1px 5px', borderRadius: '3px' }}>
                                Origen: {prop.source_metadata.fileName}
                              </span>
                            )}
                          </div>
                          
                          {prop.proposal_type === 'medication' ? (
                            <div>
                              <strong style={{ fontSize: '0.78rem', color: '#ffffff' }}>{prop.proposal_data.name} {prop.proposal_data.dose}</strong>
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}> Â· Frecuencia: {prop.proposal_data.frequency}</span>
                            </div>
                          ) : (
                            <div>
                              {prop.proposal_data.date && (
                                <strong style={{ fontSize: '0.72rem', color: 'var(--color-cyan)', marginRight: '6px' }}>{prop.proposal_data.date}</strong>
                              )}
                              <span style={{ fontSize: '0.78rem', color: '#ffffff' }}>{getProposalBody(prop)}</span>
                              {(prop.source_quote || prop.source_metadata?.quote) && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                                  Cita: <em>{prop.source_quote || prop.source_metadata?.quote}</em>
                                </span>
                              )}
                              {prop.proposal_data.associated_emotion && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'block', marginTop: '2px' }}>
                                  EmociÃ³n: <em>{prop.proposal_data.associated_emotion}</em>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleAcceptProposal(prop)}
                            className="btn btn-emerald"
                            style={{ padding: '6px 12px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', background: 'var(--color-emerald)', color: '#fff' }}
                          >
                            <Check size={12} />
                            <span>Consolidar</span>
                          </button>
                          <button
                            onClick={() => handleRejectProposal(prop.id)}
                            className="btn btn-outline"
                            style={{ padding: '6px 12px', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '4px', borderColor: 'rgba(239, 68, 68, 0.4)', color: 'var(--color-rose)' }}
                          >
                            <XCircle size={12} />
                            <span>Descartar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Cola de procesamiento de ingesta en lote */}
            {batchQueue.length > 0 && (
              <div className="glass-panel animate-fade-in" style={{ padding: '16px', border: '1px solid rgba(6,182,212,0.2)', background: 'rgba(6,182,212,0.01)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase', display: 'block' }}>
                  Procesando archivos en el motor clÃ­nico
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {batchQueue.map((item) => (
                    <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.15)', padding: '10px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem' }}>
                        <span style={{ fontWeight: 'bold', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                          ðŸ“„ {item.name} <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', fontWeight: 'normal' }}>({item.size})</span>
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 'bold', color: 'var(--color-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {item.status !== 'completed' && item.status !== 'error' && <RefreshCw size={10} className="animate-spin" />}
                          <span>
                            {item.status === 'pending' && 'En cola...'}
                            {item.status === 'uploading' && 'Subiendo a Supabase...'}
                            {item.status === 'processing' && 'Motor clinico procesando...'}
                            {item.status === 'completed' && 'âœ“ Completado'}
                            {item.status === 'error' && 'âœ— Error'}
                          </span>
                        </span>
                      </div>
                      {item.error && (
                        <span style={{ fontSize: '0.62rem', color: 'var(--color-rose)' }}>{item.error}</span>
                      )}
                      
                      {/* Barra de progreso individual */}
                      <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${item.progress}%`, 
                            height: '100%', 
                            background: item.status === 'error' ? 'var(--color-rose)' : 'linear-gradient(90deg, var(--color-cyan), var(--color-emerald))', 
                            borderRadius: '2px', 
                            transition: 'width 0.4s ease' 
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Listado de Archivos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Archivos Registrados ({uploadedFiles.length})</span>
                <button 
                  onClick={loadClinicalData}
                  style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Refrescar
                </button>
              </div>
              
              {uploadedFiles.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.74rem', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.03)' }}>
                  No hay ningÃºn archivo clÃ­nico en este expediente. Utiliza la zona de arriba para subir documentos.
                </div>
              ) : (
                uploadedFiles.map((file, idx) => (
                  <div 
                    key={file.id || idx} 
                    style={{ 
                      padding: '12px 16px', 
                      borderRadius: '8px', 
                      background: 'var(--background-secondary)', 
                      border: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <FileText size={18} color="var(--color-cyan)" />
                      <div>
                        <strong style={{ fontSize: '0.78rem', color: '#ffffff', display: 'block' }}>{file.file_name || file.name}</strong>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                          TamaÃ±o: {formatFileSize(file.file_size ?? file.size)} Â· Subido el: {formatDateTime(file.created_at || file.date)}
                        </span>
                        <span style={{ fontSize: '0.62rem', color: getDocumentStatusInfo(file.extraction_status).color, display: 'block', marginTop: '2px', fontWeight: 700 }}>
                          Estado: {getDocumentStatusInfo(file.extraction_status).label}
                        </span>
                        {file.extraction_error && (
                          <span style={{ fontSize: '0.62rem', color: 'var(--color-rose)', display: 'block', marginTop: '2px' }}>
                            Error: {file.extraction_error}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button 
                      type="button"
                      className="btn btn-outline" 
                      style={{ height: '28px', fontSize: '0.68rem', padding: '0 12px' }}
                      onClick={() => alert(`Documento: ${file.file_name || file.name}\nEstado: ${getDocumentStatusInfo(file.extraction_status).label}\n\nLas extracciones quedan como propuestas pendientes hasta que se revisen.`)}
                    >
                      Ver Archivo
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        )}

        {/* PESTAÃ‘A 10: EXPORTACIÃ“N */}
        {activeTab === 'exportacion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-cyan)', textTransform: 'uppercase' }}>Descargar Expediente Completo</span>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Puedes exportar en caliente todo tu expediente clÃ­nico de Ãncora. Esto incluye tus pautas acordadas, historial de triaje, datos de diario consolidados y medicaciÃ³n declarada para compartirlo con tu mÃ©dico de cabecera u otro profesional de la salud.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginTop: '10px' }}>
              <button
                onClick={() => exportData('json')}
                className="btn btn-outline"
                style={{ height: '54px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <strong>Exportar como JSON</strong>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>Estructura de base de datos portable</span>
              </button>

              <button
                onClick={() => exportData('markdown')}
                className="btn btn-outline"
                style={{ height: '54px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                <strong>Exportar como Markdown</strong>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>Documento legible con formato markdown</span>
              </button>

              <button
                onClick={() => alert('Generando PDF estructurado de expediente...')}
                className="btn btn-cyan"
                style={{ height: '54px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', background: 'var(--color-cyan)' }}
              >
                <strong>Descargar en PDF</strong>
                <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.7)' }}>DiseÃ±o formal clÃ­nico estructurado</span>
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
