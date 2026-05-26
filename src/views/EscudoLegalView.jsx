import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { CheckSquare, Square, Download, AlertTriangle, Info, ListTodo, RefreshCw } from 'lucide-react';

export default function EscudoLegalView({ user, profile }) {
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default strategic phases from EFE & INSS plans
  const defaultPhases = [
    {
      phase_number: 1,
      title: "Fase 1: Cortafuegos y Regla de Silencio (EFE)",
      status: "completed",
      tasks: [
        { id: 1, text: "Enviar correo correctivo a RRHH alegando confusiÃ³n por medicaciÃ³n", done: true },
        { id: 2, text: "Neutralizar riesgo de acusaciÃ³n de fraude procesal/auditorÃ­a", done: true },
        { id: 3, text: "Regla de oro: Bloqueo absoluto de comunicaciones amistosas con la Agencia EFE", done: true }
      ]
    },
    {
      phase_number: 2,
      title: "Fase 2: Blindaje de la Baja MÃ©dica (INSS)",
      status: "in_progress",
      tasks: [
        { id: 1, text: "Retomar medicaciÃ³n prescrita en dosis de choque", done: true },
        { id: 2, text: "Cita mÃ©dica telemÃ¡tica para informe de incomparecencia justificada al INSS", done: false },
        { id: 3, text: "Enviar telemÃ¡ticamente informe de agorafobia severa y riesgo autolÃ­tico para congelar citas", done: false },
        { id: 4, text: "Asegurar el ingreso mensual de la baja (3.300 â‚¬ netos)", done: true }
      ]
    },
    {
      phase_number: 3,
      title: "Fase 3: TransiciÃ³n del INSS / Alta MÃ©dica",
      status: "pending",
      tasks: [
        { id: 1, text: "Obtener informe psiquiÃ¡trico demoledor que borre la etiqueta de 'ludopatÃ­a por trading'", done: false },
        { id: 2, text: "Dejar constancia mÃ©dica de la impulsividad debida a Trauma Complejo y posible TDAH", done: false },
        { id: 3, text: "Esperar resoluciÃ³n o citaciÃ³n presencial del INSS con informes listos", done: false }
      ]
    },
    {
      phase_number: 4,
      title: "Fase 4: Ineptitud Sobrevenida (PrevenciÃ³n EFE)",
      status: "pending",
      tasks: [
        { id: 1, text: "Presentarse ante el Servicio de PrevenciÃ³n de Riesgos Laborales (SPRL) de EFE tras alta", done: false },
        { id: 2, text: "Aportar informes de la UCI (coma de 5 dÃ­as) y diagnÃ³stico de agorafobia severa", done: false },
        { id: 3, text: "Forzar declaraciÃ³n de 'NO APTO' para trabajar", done: false },
        { id: 4, text: "Forzar a EFE a ejecutar Despido Objetivo por Ineptitud (33.600 â‚¬ + derecho a paro)", done: false }
      ]
    },
    {
      phase_number: 5,
      title: "Fase 5: ConciliaciÃ³n en SMAC y Cierre",
      status: "pending",
      tasks: [
        { id: 1, text: "Impugnar despido en el SMAC exigiendo Nulidad (forzar extrajudicial)", done: false },
        { id: 2, text: "Negociar pacto de Improcedencia (70.000 â‚¬ - 85.000 â‚¬) bajo amenaza de readmisiÃ³n", done: false },
        { id: 3, text: "LÃ­nea roja inquebrantable: Firmar pacto en SMAC. NUNCA ir a juicio ante el juez", done: false }
      ]
    }
  ];

  useEffect(() => {
    if (user) {
      fetchRoadmap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function fetchRoadmap() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('legal_roadmap')
        .select('*')
        .order('phase_number', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setPhases(data);
      } else {
        // Initialize tables with default phases if empty
        const initialData = defaultPhases.map(ph => ({
          user_id: user.id,
          phase_number: ph.phase_number,
          title: ph.title,
          status: ph.status,
          tasks: ph.tasks
        }));

        const { data: insertedData, error: insertError } = await supabase
          .from('legal_roadmap')
          .insert(initialData)
          .select();

        if (insertError) throw insertError;
        setPhases(insertedData || defaultPhases);
      }
    } catch (e) {
      console.error("Error fetching legal roadmap:", e.message);
      setPhases(defaultPhases);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (phaseNum, taskId) => {
    if (profile?.role === 'supervisor') return; // Read-only for supervisors

    const updatedPhases = phases.map(ph => {
      if (ph.phase_number === phaseNum) {
        const updatedTasks = ph.tasks.map(t => {
          if (t.id === taskId) {
            return { ...t, done: !t.done };
          }
          return t;
        });

        // Determine phase status automatically
        const allDone = updatedTasks.every(t => t.done);
        const someDone = updatedTasks.some(t => t.done);
        let newStatus = 'pending';
        if (allDone) newStatus = 'completed';
        else if (someDone) newStatus = 'in_progress';

        return { ...ph, tasks: updatedTasks, status: newStatus };
      }
      return ph;
    });

    setPhases(updatedPhases);

    // Save to Supabase
    try {
      const targetPhase = updatedPhases.find(p => p.phase_number === phaseNum);
      const { error } = await supabase
        .from('legal_roadmap')
        .update({ 
          tasks: targetPhase.tasks,
          status: targetPhase.status,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('phase_number', phaseNum);

      if (error) throw error;
    } catch (e) {
      console.error("Error updating roadmap task:", e.message);
    }
  };

  const handleDownloadDocument = (docType) => {
    let content = "";
    let filename = "";

    if (docType === "agorafobia") {
      filename = "Justificante_Agorafobia_INSS.txt";
      content = `ASUNTO: JUSTIFICACIÃ“N DE INCOMPARECENCIA A CITACIÃ“N MÃ‰DICA / SOLICITUD DE ADAPTACIÃ“N NO PRESENCIAL
A LA ATENCIÃ“N DEL INSPECTOR MÃ‰DICO - INSTITUTO NACIONAL DE LA SEGURIDAD SOCIAL (INSS)

D./DÃ±a. Emilio Naranjo, con DNI ________________, en relaciÃ³n al expediente de incapacidad temporal que se encuentra en curso, mediante el presente escrito EXPONE:

1. Que ha recibido citaciÃ³n para examen mÃ©dico presencial a realizar el dÃ­a __/__/____.
2. Que actualmente se encuentra diagnosticado de un cuadro severo de TRAUMA COMPLEJO, DEPRESIÃ“N MAYOR y AGORAFOBIA grave con crisis de pÃ¡nico refractarias, que le incapacita de forma absoluta para salir de su domicilio o realizar desplazamientos de forma autÃ³noma.
3. Que la mera exposiciÃ³n al entorno exterior genera en el paciente una descompensaciÃ³n psiquiÃ¡trica grave, con elevado riesgo de autolisis y reactivaciÃ³n del estrÃ©s postraumÃ¡tico documentado clÃ­nicamente.

Por todo lo anterior, SOLICITA:
- Se admita el presente escrito como justificaciÃ³n de incomparecencia presencial.
- Se autorice la realizaciÃ³n del examen mÃ©dico mediante medios telemÃ¡ticos o, subsidiariamente, mediante visita del inspector mÃ©dico al domicilio del paciente.
- Se adjunta a esta solicitud el correspondiente informe psiquiÃ¡trico actualizado que acredita los extremos seÃ±alados.

En Madrid, a __ de __________ de 2026.

Fdo: Emilio Naranjo`;
    } else if (docType === "uci") {
      filename = "Justificante_Episodio_SPRL_EFE.txt";
      content = `INFORME SOBRE APTITUD LABORAL / EVALUACIÃ“N DE INEPTITUD SOBREVENIDA
AL SERVICIO DE PREVENCIÃ“N DE RIESGOS LABORALES (SPRL) - AGENCIA EFE

D./DÃ±a. Emilio Naranjo, con DNI ________________, trabajador con categorÃ­a profesional de ________________ en esta empresa, ante el SPRL comparece y EXPONE:

1. Que tras el periodo de incapacidad temporal prolongado, se aporta historial clÃ­nico reciente que documenta un ingreso de urgencia en la Unidad de Cuidados Intensivos (UCI) con un coma inducido y estancia hospitalaria de 5 dÃ­as derivado de una crisis de salud mental autolÃ­tica.
2. Que concurren en el trabajador secuelas cognitivas graves, impulsividad refractaria ligada a un Trastorno por DÃ©ficit de AtenciÃ³n con Hiperactividad (TDAH) en adultos y un diagnÃ³stico consolidado de Trauma Complejo de origen infantil.
3. Que el entorno social y laboral presencial actÃºa como detonante inmediato de crisis de pÃ¡nico incontrolables y conductas evitativas graves asociadas a la agorafobia.

Por todo lo anterior, se SOLICITA:
- La evaluaciÃ³n formal de aptitud laboral atendiendo a las circunstancias psiquiÃ¡tricas excepcionales expuestas.
- Se emita dictamen tÃ©cnico de NO APTITUD sobrevenida para el desempeÃ±o de las tareas propias del puesto, al no resultar viable la adaptaciÃ³n o compatibilidad con las funciones laborales requeridas, facilitando asÃ­ el trÃ¡mite de despido objetivo por ineptitud sobrevenida conforme a derecho.

En Madrid, a __ de __________ de 2026.

Fdo: Emilio Naranjo`;
    } else if (docType === "incapacidad") {
      filename = "Peticion_Incapacidad_Permanente.txt";
      content = `SOLICITUD DE INICIACIÃ“N DE EXPEDIENTE DE INCAPACIDAD PERMANENTE
AL INSTITUTO NACIONAL DE LA SEGURIDAD SOCIAL (INSS) - DIRECCIÃ“N PROVINCIAL DE MADRID

D./DÃ±a. Emilio Naranjo, mayor de edad, con DNI ________________ y domicilio en ________________, ante este Organismo comparece y como mejor proceda en Derecho, EXPONE:

1. Que se encuentra en situaciÃ³n de incapacidad temporal con una duraciÃ³n acumulada de ____ dÃ­as, derivada de contingencia comÃºn (Trastorno Depresivo Mayor recurrente, Agorafobia refractaria y secuelas asociadas a Trauma PsicolÃ³gico Complejo y TDAH).
2. Que a pesar de haber seguido los tratamientos psicofarmacolÃ³gicos y psicoterapÃ©uticos prescritos por los servicios de salud mental de referencia, el cuadro clÃ­nico presenta un carÃ¡cter crÃ³nico, irreversible y plenamente inhabilitante para cualquier tipo de actividad laboral organizada.
3. Que la exposiciÃ³n a tareas bajo presiÃ³n, interacciÃ³n social o exigencias de cumplimiento regular anula completamente las funciones ejecutivas del solicitante, abocÃ¡ndolo a ciclos destructivos severos y riesgo para su integridad fÃ­sica.

Por lo expuesto, SOLICITA:
- Se inicie el oportuno expediente para la evaluaciÃ³n y declaraciÃ³n de la situaciÃ³n de INCAPACIDAD PERMANENTE en el grado que corresponda (con preferencia absoluta por la Incapacidad Permanente Absoluta para todo trabajo), acompaÃ±ando a esta solicitud la totalidad de los informes mÃ©dicos correspondientes.

En Madrid, a __ de __________ de 2026.

Fdo: Emilio Naranjo`;
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="view-content-limit">
      {/* Warning Box */}
      <div className="glass-panel" style={{ 
        padding: '20px', 
        borderLeft: '4px solid var(--color-rose)', 
        background: 'hsla(var(--rose), 0.02)',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-start'
      }}>
        <AlertTriangle size={24} color="var(--color-rose)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--color-rose)', fontWeight: 700 }}>LÃ�NEAS ROJAS ESTRATÃ‰GICAS (OBLIGATORIO)</h4>
          <ul style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px', paddingLeft: '16px', lineHeight: 1.5 }}>
            <li><strong>SILENCIO CON EFE:</strong> No intentes despido pactado de frente. Ninguna conversaciÃ³n amistosa con RRHH o compaÃ±eros.</li>
            <li><strong>NUNCA IR A JUICIO:</strong> Todo debe cerrarse en fase de SMAC. Un juicio expondrÃ­a tu historial de trading, eximiendo a la empresa.</li>
            <li><strong>PROTECCIÃ“N DE BAJA:</strong> Las notificaciones del INSS se combaten de inmediato con informes de incomparecencia por agorafobia.</li>
          </ul>
        </div>
      </div>

      <div className="grid-2">
        {/* Phase List Timeline */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListTodo size={20} color="var(--color-emerald)" />
              Hoja de Ruta Laboral y Legal
            </h3>
            <button onClick={fetchRoadmap} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }} disabled={loading}>
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="roadmap-container">
            {phases.map((phase) => (
              <div 
                key={phase.phase_number} 
                className={`roadmap-card glass-panel ${phase.status}`}
                style={{ 
                  padding: '18px',
                  borderLeft: '4px solid',
                  borderLeftColor: phase.status === 'completed' 
                    ? 'var(--color-emerald)' 
                    : phase.status === 'in_progress' 
                    ? 'var(--color-amber)' 
                    : 'var(--text-tertiary)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: '700' }}>{phase.title}</h4>
                  <span className={`badge ${
                    phase.status === 'completed' 
                      ? 'badge-emerald' 
                      : phase.status === 'in_progress' 
                      ? 'badge-amber' 
                      : 'badge-rose'
                  }`}>
                    {phase.status === 'completed' ? 'Completado' : phase.status === 'in_progress' ? 'En Curso' : 'Pendiente'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {phase.tasks.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => handleToggleTask(phase.phase_number, task.id)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        fontSize: '0.78rem', 
                        color: task.done ? 'var(--text-secondary)' : 'var(--text-primary)',
                        cursor: profile?.role === 'supervisor' ? 'default' : 'pointer',
                        textDecoration: task.done ? 'line-through' : 'none'
                      }}
                    >
                      {task.done ? (
                        <CheckSquare size={16} color="var(--color-emerald)" style={{ flexShrink: 0 }} />
                      ) : (
                        <Square size={16} color="var(--text-tertiary)" style={{ flexShrink: 0 }} />
                      )}
                      <span>{task.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Document and Details Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Document download box */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} color="var(--color-cyan)" />
              Repositorio de Informes y Plantillas
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Documentación crítica para el blindaje legal y la justificación médica. Mantén estos archivos listos:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="flex-center" style={{ 
                justifyContent: 'space-between', 
                padding: '12px', 
                background: 'rgba(255,255,255,0.01)', 
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Justificante Agorafobia (INSS)</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Plantilla de incomparecencia justificada</span>
                </div>
                <button 
                  onClick={() => handleDownloadDocument('agorafobia')} 
                  className="btn btn-outline" 
                  style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                >
                  Descargar
                </button>
              </div>

              <div className="flex-center" style={{ 
                justifyContent: 'space-between', 
                padding: '12px', 
                background: 'rgba(255,255,255,0.01)', 
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Informe UCI e Intento de Suicidio</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>DocumentaciÃ³n para el SPRL de EFE</span>
                </div>
                <button 
                  onClick={() => handleDownloadDocument('uci')} 
                  className="btn btn-outline" 
                  style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                >
                  Descargar
                </button>
              </div>

              <div className="flex-center" style={{ 
                justifyContent: 'space-between', 
                padding: '12px', 
                background: 'rgba(255,255,255,0.01)', 
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>PeticiÃ³n Incapacidad Propia</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Modelo de solicitud por agotamiento clÃ­nico</span>
                </div>
                <button 
                  onClick={() => handleDownloadDocument('incapacidad')} 
                  className="btn btn-outline" 
                  style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                >
                  Descargar
                </button>
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="glass-panel" style={{ padding: '24px', background: 'hsla(var(--cyan), 0.01)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} color="var(--color-cyan)" />
              La Estrategia Laboral Explicada
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              La Agencia EFE, como empresa pÃºblica tutelada por la SEPI, tiene prohibido por ley pactar despidos improcedentes directos o indemnizaciones sin justificaciÃ³n (para evitar malversaciÃ³n o auditorÃ­as). 
              <br /><br />
              Por ello, el camino legal no pasa por pedir el despido de frente, sino por <strong>dejar que la burocracia actÃºe</strong>: una vez el INSS te cite o dÃ© el alta, el SPRL de EFE te someterÃ¡ al examen laboral mÃ©dico. Al aportar tus informes psiquiÃ¡tricos brutales y tu estado fÃ­sico real, se verÃ¡n obligados a declararte <strong>NO APTO</strong>. 
              <br /><br />
              Esto forzarÃ¡ a la empresa a realizar un despido objetivo por ineptitud sobrevenida. A partir de ahÃ­, tu abogado impugnarÃ¡ pidiendo la Nulidad, abriendo la puerta a un pacto extrajudicial rÃ¡pido en el SMAC de 70k-85k para evitar readmitirte.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
