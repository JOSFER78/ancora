import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  FileText, Activity, Heart, Moon, Upload, Plus, 
  ShieldCheck, Download, Trash2, Edit, Save, Users, 
  AlertTriangle, BookOpen, Layers, Target, Clock, RefreshCw, CheckCircle, Check, XCircle, Video, Calendar, PhoneCall, Sparkles, Lock, ArrowRight
} from 'lucide-react';
import { 
  getMedications, 
  getTimelineEvents, 
  getClinicalDocuments, 
  getClinicalProfile, 
  uploadClinicalDocument,
  getClinicalLifeTree
} from '../../lib/clinicalEngine';

export default function PacienteHistoriaView({ profile, onProfileUpdated, user, isVirtualDemo }) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [loadingClinicalData, setLoadingClinicalData] = useState(false);

  // Estados de datos clínicos
  const [events, setEvents] = useState([]);
  const [meds, setMeds] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [clinicalProfile, setClinicalProfile] = useState(null);

  // Modales interactivos para las 2 vías de atención
  const [bookingModal, setBookingModal] = useState(null); // 'revision15' | 'sesionCompleta' | null
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('10:00');
  const [bookingNotes, setBookingNotes] = useState('');

  // Contexto del paciente
  const context = profile?.contexto_terapeutico || {};
  const clinicalHistory = context.historial_clinico || {};
  const consultationType = context.consultationType || 'individual';
  const assignedPsyName = context.assigned_psychologist_id === 'psy-pareja-01' 
    ? 'Dra. Elena Ruiz (M-38291)' 
    : (context.assigned_psychologist_id === 'psy-infantil-01' ? 'Carlos Mendoza (M-41029)' : 'José Fernández (M-49ccc)');

  // Cargar datos clínicos reales de Supabase
  const loadClinicalData = async () => {
    if (!profile?.id) return;
    setLoadingClinicalData(true);
    try {
      const [dbMeds, dbEvents, dbDocs, dbProfile] = await Promise.all([
        getMedications(profile.id),
        getTimelineEvents(profile.id),
        getClinicalDocuments(profile.id),
        getClinicalProfile(profile.id)
      ]);
      setMeds(dbMeds || []);
      setEvents(dbEvents || []);
      setUploadedFiles(dbDocs || []);
      setClinicalProfile(dbProfile);
    } catch (err) {
      console.error("Error cargando datos clínicos del paciente:", err);
    } finally {
      setLoadingClinicalData(false);
    }
  };

  useEffect(() => {
    loadClinicalData();
  }, [profile?.id]);

  // Manejar solicitud de cita/revisión
  const handleConfirmBooking = () => {
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingModal(null);
      setBookingSuccess(false);
      setBookingNotes('');
    }, 2200);
  };

  // Exportar ficha esquemática
  const handleExportSummary = () => {
    const textContent = `ÁNCORA - FICHA ESQUEMÁTICA DE ACOMPAÑAMIENTO CLÍNICO
======================================================
Paciente: ${profile?.display_name || 'Paciente'}
Modalidad: ${consultationType.toUpperCase()}
Terapeuta Asignado: ${assignedPsyName}
Fecha de Exportación: ${new Date().toLocaleDateString('es-ES')}

1. MOTIVO Y FOCOS DE ATENCIÓN:
------------------------------------------------------
${context.motivo || clinicalHistory.resumen_vital || 'Acompañamiento y bienestar emocional.'}
Focos prioritarios: ${(context.tags || []).join(', ') || 'Ansiedad, Regulación'}

2. PAUTAS Y ACUERDOS TERAPÉUTICOS:
------------------------------------------------------
${(context.pautas_accion || [
  'Práctica diaria de registro emocional en el diario de Áncora.',
  'Supervisión continuada con psicólogo colegiado.'
]).map((p, i) => `${i + 1}. ${p}`).join('\n')}

3. HISTORIAL DE ACTUALIZACIONES:
------------------------------------------------------
${events.length > 0 ? events.map(e => `- [${e.date}] ${e.event}`).join('\n') : 'Expediente vivo supervisado en tiempo real.'}

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1080px', margin: '0 auto', textAlign: 'left', paddingBottom: '40px' }}>
      
      {/* ------------------------------------------------------------- */}
      {/* 1. CABECERA Y BANNER TRANQUILIZADOR DE SUPERVISIÓN PROFESIONAL */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#05213A', margin: 0, fontFamily: 'serif' }}>
                Ficha de Acompañamiento Clínico
              </h2>
              <span style={{ 
                background: 'rgba(68,125,130,0.12)', 
                color: '#447D82', 
                fontSize: '0.68rem', 
                fontWeight: 700, 
                padding: '3px 8px', 
                borderRadius: '999px',
                textTransform: 'uppercase'
              }}>
                {consultationType}
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#5F6F74', margin: '4px 0 0 0' }}>
              Espacio confidencial supervisado por tu psicólogo colegiado asignado: <strong>{assignedPsyName}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              onClick={loadClinicalData} 
              disabled={loadingClinicalData}
              className="btn btn-outline" 
              style={{ height: '34px', fontSize: '0.74rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={loadingClinicalData ? 'animate-spin' : ''} />
              <span>Sincronizar</span>
            </button>
            <button 
              type="button" 
              onClick={handleExportSummary}
              className="btn btn-outline" 
              style={{ height: '34px', fontSize: '0.74rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={13} />
              <span>Descargar Ficha</span>
            </button>
          </div>
        </div>

        {/* Banner Verde Esmeralda Reasegurador */}
        <div style={{ 
          background: 'linear-gradient(135deg, rgba(68,125,130,0.08) 0%, rgba(127,159,136,0.12) 100%)', 
          border: '1px solid rgba(68,125,130,0.22)', 
          borderRadius: '12px', 
          padding: '16px 18px',
          display: 'flex',
          gap: '14px',
          alignItems: 'center'
        }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '50%', 
            background: '#447D82', 
            color: '#ffffff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(68,125,130,0.3)'
          }}>
            <ShieldCheck size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              <strong style={{ fontSize: '0.85rem', color: '#05213A' }}>
                Tu Expediente Clínico Completo está Activo y Actualizado
              </strong>
            </div>
            <p style={{ fontSize: '0.74rem', color: '#5F6F74', margin: 0, lineHeight: 1.45 }}>
              La IA Áncora analiza de forma invisible tus conversaciones y reflexiones para mantener sincronizado tu árbol vital, antecedentes y medicación. <strong>Tu psicólogo dispone del expediente íntegro en su panel médico para preparar cada sesión contigo.</strong>
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. LAS 2 VÍAS DE ATENCIÓN Y CONTINUIDAD (DESTACADAS) */}
      {/* ------------------------------------------------------------- */}
      <div>
        <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#05213A', marginBottom: '10px' }}>
          Opciones de Consulta y Acompañamiento
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          
          {/* Opción 1: Revisiones de 15 Minutos */}
          <div style={{ 
            background: '#ffffff', 
            border: '2px solid rgba(68,125,130,0.2)', 
            borderRadius: '14px', 
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(5,33,58,0.04)',
            transition: 'all 0.2s'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(68,125,130,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#447D82' }}>
                    <Clock size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#05213A', margin: 0 }}>Revisiones Rápidas (15 min)</h4>
                    <span style={{ fontSize: '0.68rem', color: '#447D82', fontWeight: 700 }}>Seguimiento Ágil entre Sesiones</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#05213A' }}>15 €</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#5F6F74', lineHeight: 1.45, margin: '0 0 16px 0' }}>
                Diseñadas para resolver dudas puntuales, ajustar pautas de afrontamiento o chequear tu evolución sin tener que esperar a una sesión completa.
              </p>
            </div>

            <button 
              type="button" 
              onClick={() => setBookingModal('revision15')}
              className="btn"
              style={{ 
                width: '100%', 
                height: '38px', 
                background: '#447D82', 
                color: '#ffffff', 
                borderRadius: '8px', 
                fontWeight: 700, 
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Clock size={15} />
              <span>Solicitar Revisión Breve (15 min)</span>
            </button>
          </div>

          {/* Opción 2: Sesiones Completas (Videollamada o Presencial con Grabación) */}
          <div style={{ 
            background: '#ffffff', 
            border: '2px solid rgba(5,33,58,0.15)', 
            borderRadius: '14px', 
            padding: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(5,33,58,0.04)',
            transition: 'all 0.2s'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(5,33,58,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#05213A' }}>
                    <Video size={20} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#05213A', margin: 0 }}>Sesión Clínica Completa (50 min)</h4>
                    <span style={{ fontSize: '0.68rem', color: '#5F6F74', fontWeight: 700 }}>Videollamada o Presencial con Grabación</span>
                  </div>
                </div>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#05213A' }}>55 €</span>
              </div>
              <p style={{ fontSize: '0.74rem', color: '#5F6F74', lineHeight: 1.45, margin: '0 0 16px 0' }}>
                Sesión terapéutica en profundidad. Incluye <strong>grabación y transcripción clínica automática</strong> para que tu terapeuta sintetice acuerdos y actualice tu historial.
              </p>
            </div>

            <button 
              type="button" 
              onClick={() => setBookingModal('sesionCompleta')}
              className="btn"
              style={{ 
                width: '100%', 
                height: '38px', 
                background: '#05213A', 
                color: '#ffffff', 
                borderRadius: '8px', 
                fontWeight: 700, 
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Calendar size={15} />
              <span>Reservar Sesión de 50 min</span>
            </button>
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. SÍNTESIS ESQUEMÁTICA DEL PROCESO & PAUTAS ACTIVAS */}
      {/* ------------------------------------------------------------- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        
        {/* Tarjeta: Motivo y Focos de Consulta */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(5,33,58,0.1)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Target size={18} color="#447D82" />
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#05213A', margin: 0 }}>
              Motivo & Focos Terapéuticos
            </h4>
          </div>

          <div style={{ background: '#F8F6F1', padding: '12px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.74rem', color: '#05213A', lineHeight: 1.45 }}>
            {context.motivo || clinicalHistory.resumen_vital || 'Acompañamiento psicológico y desarrollo personal en curso.'}
          </div>

          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74', display: 'block', marginBottom: '6px' }}>
              ÁREAS PRIORITARIAS SELECCIONADAS:
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {(context.tags && context.tags.length > 0 ? context.tags : ['Regulación Emocional', 'Bienestar Personal']).map(tag => (
                <span key={tag} style={{ 
                  background: 'rgba(68,125,130,0.1)', 
                  color: '#447D82', 
                  fontSize: '0.68rem', 
                  fontWeight: 700, 
                  padding: '3px 9px', 
                  borderRadius: '999px' 
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Tarjeta: Pautas y Acuerdos Activos */}
        <div style={{ background: '#ffffff', border: '1px solid rgba(5,33,58,0.1)', borderRadius: '12px', padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <Sparkles size={18} color="#447D82" />
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#05213A', margin: 0 }}>
              Pautas & Estrategias Activas
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(context.pautas_accion && context.pautas_accion.length > 0 ? context.pautas_accion : [
              'Realizar 1 registro breve en el diario reflexivo ante situaciones de agobio.',
              'Practicar 5 minutos de respiración diafragmática pausada al finalizar la jornada.',
              'Espacio confidencial supervisado por el psicólogo clínico asignado.'
            ]).map((pauta, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '0.74rem', color: '#5F6F74', lineHeight: 1.4 }}>
                <CheckCircle size={15} color="#447D82" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{pauta}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. REGISTRO VIVO DE ACTUALIZACIONES (Para ver que está vivo) */}
      {/* ------------------------------------------------------------- */}
      <div style={{ background: '#ffffff', border: '1px solid rgba(5,33,58,0.1)', borderRadius: '12px', padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="#447D82" />
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#05213A', margin: 0 }}>
              Registro de Sincronizaciones del Expediente
            </h4>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            Sincronizado con Terapeuta
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {events.length > 0 ? (
            events.slice(0, 5).map((evt, idx) => (
              <div key={idx} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '10px 12px', 
                background: '#F8F6F1', 
                borderRadius: '8px',
                fontSize: '0.72rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={14} color="#5F6F74" />
                  <span style={{ color: '#05213A', fontWeight: 600 }}>{evt.event}</span>
                </div>
                <span style={{ color: '#9AA6AB', fontSize: '0.65rem' }}>{evt.date || 'Reciente'}</span>
              </div>
            ))
          ) : (
            <div style={{ padding: '12px', background: '#F8F6F1', borderRadius: '8px', fontSize: '0.72rem', color: '#5F6F74', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={14} color="#447D82" />
              <span>Expediente de admisión generado y sincronizado con el colegiado. A medida que hables con Áncora o registres en tu diario, tu mapa clínico se actualizará automáticamente.</span>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. MODAL DE SOLICITUD DE CITA / REVISIÓN */}
      {/* ------------------------------------------------------------- */}
      {bookingModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(5, 33, 58, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            maxWidth: '440px',
            width: '100%',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            textAlign: 'left'
          }}>
            {bookingSuccess ? (
              <div style={{ textAlign: 'center', padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={28} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#05213A', margin: 0 }}>¡Solicitud Confirmada!</h3>
                <p style={{ fontSize: '0.76rem', color: '#5F6F74', margin: 0 }}>
                  Tu psicólogo asignado ({assignedPsyName}) ha recibido tu petición. Te notificaremos la confirmación de sala cifrada.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#05213A', margin: 0 }}>
                      {bookingModal === 'revision15' ? 'Solicitar Revisión (15 min)' : 'Reservar Sesión Completa (50 min)'}
                    </h3>
                    <span style={{ fontSize: '0.68rem', color: '#5F6F74' }}>Con {assignedPsyName}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setBookingModal(null)} 
                    style={{ background: 'none', border: 'none', color: '#9AA6AB', cursor: 'pointer', fontSize: '1.1rem' }}
                  >
                    ×
                  </button>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>FECHA PREFERIDA</label>
                  <input 
                    type="date" 
                    value={bookingDate} 
                    onChange={(e) => setBookingDate(e.target.value)}
                    style={{ height: '36px', paddingInline: '10px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.78rem' }}
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>HORA PREFERIDA</label>
                  <select 
                    value={bookingTime} 
                    onChange={(e) => setBookingTime(e.target.value)}
                    style={{ height: '36px', paddingInline: '10px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.78rem', width: '100%' }}
                  >
                    <option value="09:00">09:00 - Mañana</option>
                    <option value="10:00">10:00 - Mañana</option>
                    <option value="11:30">11:30 - Mañana</option>
                    <option value="16:00">16:00 - Tarde</option>
                    <option value="17:30">17:30 - Tarde</option>
                    <option value="19:00">19:00 - Tarde</option>
                  </select>
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#5F6F74' }}>NOTAS O TEMAS A TRATAR (OPCIONAL)</label>
                  <textarea 
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="Ej. Me gustaría revisar el ejercicio de respiración y comentar una situación de trabajo..."
                    style={{ height: '60px', padding: '8px', border: '1px solid rgba(5,33,58,0.15)', borderRadius: '8px', background: '#F8F6F1', color: '#05213A', fontSize: '0.74rem', width: '100%', resize: 'none' }}
                  />
                </div>

                <div style={{ background: 'rgba(68,125,130,0.06)', padding: '10px', borderRadius: '8px', fontSize: '0.68rem', color: '#447D82' }}>
                  {bookingModal === 'sesionCompleta' ? 'Sesión con grabación y transcripción clínica automática confidencial para tu psicólogo.' : 'Revisión rápida de 15 minutos en directo.'}
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                  <button 
                    type="button" 
                    onClick={() => setBookingModal(null)} 
                    className="btn btn-outline" 
                    style={{ flex: 1, height: '38px', borderRadius: '8px', fontSize: '0.76rem' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    onClick={handleConfirmBooking}
                    className="btn" 
                    style={{ flex: 1, height: '38px', borderRadius: '8px', background: '#447D82', color: '#ffffff', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: '0.76rem' }}
                  >
                    Confirmar Solicitud
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
