import { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  HelpCircle,
  BookOpen,
  Mail,
  X,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Building2
} from 'lucide-react';
export const LegalModals = ({ modalType, onClose }) => {
  // Los hooks van SIEMPRE antes de cualquier return condicional: si el orden
  // cambia entre renders, React corrompe el estado (regla de los hooks).
  // Estado para acordeones de FAQ
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Formulario de contacto
  const [contactSent, setContactSent] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      onClose();
    }, 2000);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99995,
        background: 'rgba(3, 15, 26, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '88vh',
          overflowY: 'auto',
          background: '#05213A',
          border: '1px solid rgba(127, 159, 136, 0.35)',
          borderRadius: '24px',
          padding: '28px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          textAlign: 'left',
          color: '#ffffff'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Botón de Cierre */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9AA6AB',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={e => e.currentTarget.style.color = '#9AA6AB'}
        >
          <X size={16} />
        </button>

        {/* 1. MODAL: POLÍTICA DE PRIVACIDAD Y PROTECCIÓN DE DATOS SANITARIOS */}
        {modalType === 'privacy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(61,220,132,0.12)', border: '1px solid rgba(61,220,132,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3DDC84' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Política de Privacidad y Datos Clínicos</h3>
                <span style={{ fontSize: '0.72rem', color: '#7F9F88' }}>Conforme al RGPD (UE 2016/679) y Ley Orgánica 3/2018 (LOPD-GDD)</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.55 }}>
              <div style={{ background: 'rgba(61,220,132,0.05)', border: '1px solid rgba(61,220,132,0.2)', padding: '12px 16px', borderRadius: '10px' }}>
                <strong style={{ color: '#3DDC84', display: 'block', marginBottom: '4px' }}>🛡️ Compromiso de Máxima Confidencialidad Médica</strong>
                Los datos de salud mental constituyen categorías especiales de datos (Art. 9 RGPD). Áncora aplica cifrado de grado bancario AES-256 en reposo y TLS 1.3 en tránsito en servidores ubicados exclusivamente en la Unión Europea.
              </div>

              <div>
                <h5 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.85rem' }}>1. Responsable del Tratamiento</h5>
                <p style={{ margin: 0 }}>
                  <strong>Áncora Health, S.L.</strong> · NIF: B-89421501 · Domicilio: Calle Gran Vía 42, 28013 Madrid (España). Correo de contacto del Delegado de Protección de Datos (DPO): <code style={{ color: '#7F9F88' }}>dpo@ancora.health</code>.
                </p>
              </div>

              <div>
                <h5 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.85rem' }}>2. Finalidad del Tratamiento y Legitimación</h5>
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  <li>Prestación de servicios de telepsicología sanitaria y continuidad terapéutica.</li>
                  <li>Asistencia conversacional inteligente y pre-clasificación de información clínica para su posterior validación por su psicólogo colegiado.</li>
                  <li>Gestión de citas, facturación y recordatorios clínicos.</li>
                </ul>
              </div>

              <div>
                <h5 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.85rem' }}>3. Conservación de Historias Clínicas</h5>
                <p style={{ margin: 0 }}>
                  Conforme a la <strong>Ley 41/2002 Básica de Autonomía del Paciente</strong>, la documentación clínica se conservará como mínimo durante 5 años desde la fecha del alta de cada proceso asistencial, garantizando su integridad y custodia confidencial.
                </p>
              </div>

              <div>
                <h5 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.85rem' }}>4. Derechos ARCO-POL del Paciente</h5>
                <p style={{ margin: 0 }}>
                  Tienes derecho de Acceso, Rectificación, Cancelación, Oposición, Limitación del tratamiento y Portabilidad de tu historia clínica. Puedes ejercer tus derechos en cualquier momento escribiendo a <code style={{ color: '#7F9F88' }}>privacidad@ancora.health</code>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. MODAL: TÉRMINOS Y CONDICIONES DE CONTRATACIÓN */}
        {modalType === 'terms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(68,125,130,0.15)', border: '1px solid rgba(68,125,130,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#447d82' }}>
                <FileText size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Términos y Condiciones de Uso</h3>
                <span style={{ fontSize: '0.72rem', color: '#9AA6AB' }}>Condiciones generales de contratación y prestación de servicios</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.55 }}>
              <div>
                <h5 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.85rem' }}>1. Objeto de la Plataforma</h5>
                <p style={{ margin: 0 }}>
                  Áncora es una plataforma digital de telepsicología que conecta a pacientes con <strong>psicólogos generales sanitarios debidamente colegiados</strong> en España, complementando el proceso terapéutico con herramientas de IA clínica para la continuidad entre sesiones.
                </p>
              </div>

              <div>
                <h5 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.85rem' }}>2. Garantía de Tarifa Cero (0,00 € Primer Contacto)</h5>
                <p style={{ margin: 0 }}>
                  Al registrarse, el usuario autoriza un método de pago seguro a través de Stripe con <strong>cargo inicial de 0,00 €</strong>. La facturación de las consultas individuales se realiza únicamente tras la celebración efectiva de la sesión con su terapeuta asignado.
                </p>
              </div>

              <div>
                <h5 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.85rem' }}>3. Alcance de la Inteligencia Artificial (Ánquer)</h5>
                <p style={{ margin: 0 }}>
                  El asistente de IA Ánquer actúa como una herramienta de apoyo psicoeducativo, registro emocional y preparación de consultas. <strong>En ningún caso sustituye el juicio clínico, diagnóstico o intervención de su psicólogo sanitario asignado.</strong>
                </p>
              </div>

              <div>
                <h5 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.85rem' }}>4. Protocolo de Urgencias y Emergencias</h5>
                <p style={{ margin: 0 }}>
                  Áncora no es un servicio de urgencias médicas de 24 horas. Si estás en una situación de crisis grave o riesgo vital inminente, debes acudir al centro de urgencias más cercano o contactar con el <strong>024 (Línea de atención a la conducta suicida)</strong> o el <strong>112</strong> en España.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2.1 MODAL: CONSENTIMIENTO INFORMADO CLÍNICO */}
        {modalType === 'consent' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(127, 159, 136, 0.15)', border: '1px solid rgba(127, 159, 136, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7F9F88' }}>
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Consentimiento Informado Clínico</h3>
                <span style={{ fontSize: '0.72rem', color: '#9AA6AB' }}>Ley 41/2002 de Autonomía del Paciente y Código Deontológico Sanitario</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.55 }}>
              <div style={{ background: 'rgba(127, 159, 136, 0.08)', border: '1px solid rgba(127, 159, 136, 0.2)', borderRadius: '10px', padding: '12px' }}>
                <p style={{ margin: 0, color: '#7F9F88', fontWeight: 600 }}>
                  En cumplimiento de la Ley 41/2002 y el RGPD (Art. 9), este documento formaliza tu consentimiento para recibir atención telepsicológica asistida por tecnologías de memoria clínica continua.
                </p>
              </div>

              <div>
                <h5 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.85rem' }}>1. Naturaleza del Servicio y Rol de los Profesionales</h5>
                <p style={{ margin: 0 }}>
                  La atención psicológica es prestada exclusivamente por <strong>psicólogos sanitarios colegiados</strong> en el Colegio Oficial de la Psicología (COP) con habilitación sanitaria legal en España. Las sesiones se desarrollan mediante videoconsulta cifrada de punto a punto.
                </p>
              </div>

              <div>
                <h5 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.85rem' }}>2. Alcance del Asistente Ánquer y Algoritmos Clínicos</h5>
                <p style={{ margin: 0 }}>
                  El módulo inteligente <em>Ánquer</em> proporciona acompañamiento reflexivo diario, registro estructurado del estado de ánimo y apoyo al terapeuta en la preparación de las notas clínicas. <strong>Ánquer no es un médico ni un psicólogo, no emite diagnósticos nosológicos independientes ni prescribe tratamientos farmacológicos.</strong>
                </p>
              </div>

              <div>
                <h5 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.85rem' }}>3. Protocolo de Seguridad en Crisis y Riesgo Autolítico</h5>
                <p style={{ margin: 0 }}>
                  Áncora no constituye un servicio de urgencias hospitalarias ni de rescate inmediato. Si el sistema detecta ideación autolítica activa o riesgo de daño inminente en los cuestionarios de triaje (PHQ-9 ítem 9) o diarios, se activará el protocolo de seguridad redirigiendo de inmediato a las líneas nacionales <strong>024</strong> y <strong>112</strong>.
                </p>
              </div>

              <div>
                <h5 style={{ margin: '0 0 4px 0', color: '#ffffff', fontSize: '0.85rem' }}>4. Confidencialidad, Secreto Profesional y Portabilidad</h5>
                <p style={{ margin: 0 }}>
                  Todos tus registros terapéuticos están sujetos al más estricto secreto profesional sanitario. Tu historial clínico te pertenece en exclusiva: puedes revocar este consentimiento y descargar tu expediente completo en cualquier momento sin penalización alguna.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. MODAL: CENTRO DE AYUDA Y PREGUNTAS FRECUENTES (FAQ) */}
        {modalType === 'help' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60A5FA' }}>
                <HelpCircle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Centro de Ayuda y Preguntas Frecuentes</h3>
                <span style={{ fontSize: '0.72rem', color: '#9AA6AB' }}>Todo lo que necesitas saber sobre el funcionamiento de Áncora</span>
              </div>
            </div>

            {/* Listado de Acordeones */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                {
                  q: '¿Cómo garantiza Áncora la privacidad y secreto profesional?',
                  a: 'Toda la información viaja encriptada bajo TLS 1.3 y se custodia en servidores con certificación ISO 27001 dentro del Espacio Económico Europeo. Solo tú y tu psicólogo asignado tenéis acceso a tus registros e historial.'
                },
                {
                  q: '¿Qué cualificación tienen los psicólogos de la plataforma?',
                  a: 'Todos los terapeutas en Áncora son Psicólogos Generales Sanitarios o Especialistas Clínicos colegiados en colegios oficiales de España (COP), con seguro de responsabilidad civil activo y experiencia contrastada.'
                },
                {
                  q: '¿Cómo funciona la Tarifa Cero de prueba?',
                  a: 'Puedes registrarte, completar tu triaje con Ánquer, subir tu documentación médica y reservar tu cita de prueba sin ningún cargo (0,00 €). Solo se abona la sesión cuando se realiza efectivamente.'
                },
                {
                  q: '¿Qué hace la IA Ánquer entre sesión y sesión?',
                  a: 'Ánquer te acompaña en el día a día para registrar tus emociones, realizar ejercicios de respiración o reflexión guiada, y sintetizar los avances para que tu terapeuta llegue a cada sesión con el contexto completo preparado.'
                },
                {
                  q: '¿Puedo cambiar de terapeuta si no siento afinidad?',
                  a: 'Sí, en cualquier momento puedes solicitar un cambio de profesional desde tu panel de paciente sin ningún tipo de penalización ni coste adicional.'
                }
              ].map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div 
                    key={idx}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid',
                      borderColor: isOpen ? 'rgba(68,125,130,0.4)' : 'rgba(255,255,255,0.06)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'all 0.2s'
                    }}
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: 'transparent',
                        border: 'none',
                        color: '#ffffff',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontSize: '0.82rem',
                        fontWeight: 700
                      }}
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp size={16} color="#447d82" /> : <ChevronDown size={16} color="#9AA6AB" />}
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 16px 14px', fontSize: '0.76rem', color: '#9AA6AB', lineHeight: 1.5 }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4. MODAL: GUÍAS CLÍNICAS Y RECURSOS TERAPÉUTICOS */}
        {modalType === 'resources' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A78BFA' }}>
                <BookOpen size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Guías y Recursos de Apoyo Clínico</h3>
                <span style={{ fontSize: '0.72rem', color: '#9AA6AB' }}>Herramientas psicoeducativas diseñadas por el equipo de psicología</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
                <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block', marginBottom: '4px' }}>🌿 Protocolo Anti-Pánico</strong>
                <p style={{ fontSize: '0.72rem', color: '#9AA6AB', margin: 0, lineHeight: 1.4 }}>
                  Técnica diafragmática 4-7-8 y anclaje sensorial 5-4-3-2-1 para desactivar picos agudos de ansiedad.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
                <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block', marginBottom: '4px' }}>🌙 Higiene del Sueño</strong>
                <p style={{ fontSize: '0.72rem', color: '#9AA6AB', margin: 0, lineHeight: 1.4 }}>
                  Pautas basadas en TCC-Insomnio para la sincronización circadiana y reducción del insomnio de conciliación.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
                <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block', marginBottom: '4px' }}>🧠 Registro de Distorsiones</strong>
                <p style={{ fontSize: '0.72rem', color: '#9AA6AB', margin: 0, lineHeight: 1.4 }}>
                  Plantilla de reestructuración cognitiva para identificar catastrofización, lectura de pensamiento y sesgos.
                </p>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
                <strong style={{ fontSize: '0.82rem', color: '#ffffff', display: 'block', marginBottom: '4px' }}>🛡️ Teléfonos de Emergencia 24/7</strong>
                <p style={{ fontSize: '0.72rem', color: '#3DDC84', margin: 0, lineHeight: 1.4, fontWeight: 600 }}>
                  Línea 024 (Prevención de la Conducta Suicida - Gratuito) · Urgencias 112.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. MODAL: SOBRE NOSOTROS Y CÓDIGO DEONTOLÓGICO */}
        {modalType === 'about' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(127,159,136,0.15)', border: '1px solid rgba(127,159,136,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7F9F88' }}>
                <Building2 size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Sobre Áncora Health</h3>
                <span style={{ fontSize: '0.72rem', color: '#9AA6AB' }}>Misión clínica, dirección médica y código ético</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.78rem', color: '#CBD5E1', lineHeight: 1.55 }}>
              <p style={{ margin: 0 }}>
                Áncora nació con una misión clara: <strong>resolver la desconexión que ocurre entre sesión y sesión de terapia</strong>. En los modelos tradicionales, el paciente vive su semana en soledad y el psicólogo invierte un tiempo valioso en recopilar lo que ocurrió.
              </p>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(127,159,136,0.2)', padding: '14px', borderRadius: '12px' }}>
                <strong style={{ color: '#ffffff', display: 'block', marginBottom: '4px' }}>👨‍⚕️ Dirección Clínica y Supervisión Colegiada</strong>
                Bajo la supervisión del <strong>Dr. José Fernández</strong> (Colegiado M-49ccc), todo el sistema opera estrictamente bajo el <strong>Código Deontológico del Psicólogo</strong> (Consejo General de la Psicología de España), garantizando que la tecnología siempre sirva al ser humano y nunca al revés.
              </div>
            </div>
          </div>
        )}

        {/* 6. MODAL: CONTACTO Y ATENCIÓN CLÍNICA */}
        {modalType === 'contact' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(68,125,130,0.15)', border: '1px solid rgba(68,125,130,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#447d82' }}>
                <Mail size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Contacto y Soporte</h3>
                <span style={{ fontSize: '0.72rem', color: '#9AA6AB' }}>Estamos aquí para resolver cualquier duda o consulta</span>
              </div>
            </div>

            {contactSent ? (
              <div style={{ background: 'rgba(61,220,132,0.1)', border: '1px solid rgba(61,220,132,0.3)', padding: '24px', borderRadius: '14px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={32} color="#3DDC84" />
                <h4 style={{ margin: 0, color: '#ffffff', fontSize: '0.95rem' }}>¡Mensaje Enviado con Éxito!</h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#CBD5E1' }}>
                  Nuestro equipo clínico de atención te responderá en un plazo máximo de 24 horas laborables.
                </p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.68rem', color: '#9AA6AB', textTransform: 'uppercase', fontWeight: 700 }}>Nombre</label>
                    <input 
                      type="text" 
                      required
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                      placeholder="Tu nombre..."
                      className="form-input"
                      style={{ height: '36px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0 10px', color: '#ffffff' }}
                    />
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.68rem', color: '#9AA6AB', textTransform: 'uppercase', fontWeight: 700 }}>Email</label>
                    <input 
                      type="email" 
                      required
                      value={contactEmail}
                      onChange={e => setContactEmail(e.target.value)}
                      placeholder="tuemail@ejemplo.com"
                      className="form-input"
                      style={{ height: '36px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0 10px', color: '#ffffff' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.68rem', color: '#9AA6AB', textTransform: 'uppercase', fontWeight: 700 }}>Mensaje o Consulta</label>
                  <textarea 
                    rows={4}
                    required
                    value={contactMessage}
                    onChange={e => setContactMessage(e.target.value)}
                    placeholder="Escribe aquí tu consulta o duda asistencial..."
                    className="form-input"
                    style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px', color: '#ffffff', resize: 'vertical' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#7F9F88' }}>
                    soporte@ancora.health · Madrid, España
                  </span>

                  <button
                    type="submit"
                    style={{
                      background: '#447d82',
                      border: '1px solid #447d82',
                      color: '#ffffff',
                      padding: '8px 20px',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(68,125,130,0.35)'
                    }}
                  >
                    Enviar Mensaje
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default LegalModals;
