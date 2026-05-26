import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Calendar, 
  Brain, 
  Clock, 
  PlusCircle, 
  AlertOctagon, 
  RefreshCw, 
  FileText, 
  UploadCloud, 
  FolderOpen, 
  BookOpen, 
  Trash2, 
  Eye, 
  BookOpenCheck, 
  Plus, 
  CheckCircle2, 
  X 
} from 'lucide-react';

export default function MenteView({ user, profile, dailyMoodToday, onMoodSaved, onProfileUpdated }) {
  // Diary State
  const [anxiety, setAnxiety] = useState(dailyMoodToday?.anxiety_level ?? 5);
  const [impulsivity, setImpulsivity] = useState(dailyMoodToday?.impulsivity_level ?? 5);
  const [atomoxetina, setAtomoxetina] = useState(dailyMoodToday?.atomoxetina_taken ?? false);
  const [trading, setTrading] = useState(dailyMoodToday?.trading_today ?? false);
  const [notes, setNotes] = useState(dailyMoodToday?.notes || '');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('diary'); // 'diary' | 'timeline' | 'sources' | 'clinical_facts' | 'barkley'

  // NotebookLM & clinical facts states
  const [sources, setSources] = useState([]);
  const [completedConversations, setCompletedConversations] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionMessages, setSessionMessages] = useState([]);
  const [transcriptLoading, setTranscriptLoading] = useState(false);

  // Fetch patient sources
  const fetchSources = async () => {
    if (!user) return;
    setSourceLoading(true);
    try {
      const { data, error } = await supabase
        .from('mente_sources')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSources(data || []);
    } catch (err) {
      console.error("Error fetching sources:", err.message);
    } finally {
      setSourceLoading(false);
    }
  };

  // Fetch completed conversations (archived sessions)
  const fetchCompletedConversations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('status', 'completed')
        .order('closed_at', { ascending: false });
      if (error) throw error;
      setCompletedConversations(data || []);
    } catch (err) {
      console.error("Error fetching completed conversations:", err.message);
    }
  };

  // Add text note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!user || !noteTitle.trim() || !noteContent.trim()) return;
    setUploadLoading(true);
    try {
      const { error } = await supabase
        .from('mente_sources')
        .insert([{
          user_id: user.id,
          name: noteTitle.trim(),
          content_type: 'note',
          text_content: noteContent.trim(),
          processed: false
        }]);
      if (error) throw error;
      setNoteTitle('');
      setNoteContent('');
      alert("Nota guardada con éxito.");
      fetchSources();
    } catch (err) {
      console.error("Error saving note source:", err.message);
      alert("Error al guardar la nota: " + err.message);
    } finally {
      setUploadLoading(false);
    }
  };

  const [syncLoading, setSyncLoading] = useState(false);

  const handleSyncProfile = async () => {
    setSyncLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let remaining = 1;
      let latestData = null;
      let totalProcessed = 0;

      while (remaining > 0) {
        const response = await fetch('https://ysnorelkaccaikvuqgnv.supabase.co/functions/v1/chat-terapeuta', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            action: 'sync_clinical_profile'
          })
        });

        let errorMessage = "Fallo al consolidar análisis";
        if (!response.ok) {
          try {
            const errData = await response.json();
            if (errData && errData.error) {
              errorMessage = errData.error;
            }
          } catch (_) {
            try {
              const txt = await response.text();
              if (txt) errorMessage = txt;
            } catch (_) {}
          }
          throw new Error(errorMessage);
        }

        const res = await response.json();
        if (res && res.success && res.data) {
          latestData = res.data;
          totalProcessed += (res.processedCount || 0);
          remaining = res.remainingCount || 0;
          console.log(`Procesados ${totalProcessed} archivos. Quedan ${remaining} restantes.`);
        } else {
          throw new Error(res.error || "Fallo en la consolidación");
        }
      }

      alert(`Diagnóstico y evolución consolidada con éxito. Procesadas ${totalProcessed} nuevas fuentes.`);
      if (onProfileUpdated && latestData) {
        onProfileUpdated({
          ...profile,
          contexto_terapeutico: latestData
        });
      }
      fetchSources(); // Refrescar las fuentes para ver el cambio de badges
    } catch (err) {
      console.error(err);
      alert("Error al sincronizar análisis: " + err.message);
    } finally {
      setSyncLoading(false);
    }
  };

  // Handle file uploads (multiple files of any format)
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !user) return;

    setUploadLoading(true);
    let successCount = 0;

    for (const file of files) {
      try {
        await new Promise((resolve, reject) => {
          const reader = new FileReader();
          
          const isText = file.type?.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.csv');
          
          reader.onload = async (event) => {
            try {
              const content = event.target.result;
              const { error } = await supabase
                .from('mente_sources')
                .insert([{
                  user_id: user.id,
                  name: file.name,
                  content_type: file.type || 'application/octet-stream',
                  text_content: content,
                  processed: false
                }]);
              if (error) throw error;
              successCount++;
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          
          reader.onerror = () => reject(reader.error);

          if (isText) {
            reader.readAsText(file);
          } else {
            // Base64 Data URL for images, PDFs, etc.
            reader.readAsDataURL(file);
          }
        });
      } catch (err) {
        console.error(`Error uploading file ${file.name}:`, err.message);
      }
    }

    alert(`Cargados ${successCount} de ${files.length} archivos con éxito.`);
    setUploadLoading(false);
    fetchSources();
  };

  // Delete source
  const handleDeleteSource = async (id) => {
    if (!confirm("¿Deseas eliminar esta fuente de contexto? Walter ya no la usará de referencia.")) return;
    try {
      const { error } = await supabase
        .from('mente_sources')
        .delete()
        .eq('id', id);
      if (error) throw error;
      setSources(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Error deleting source:", err.message);
    }
  };

  // Load transcript messages
  const loadSessionMessages = async (convId) => {
    setTranscriptLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setSessionMessages(data || []);
    } catch (err) {
      console.error("Error loading session transcript:", err.message);
    } finally {
      setTranscriptLoading(false);
    }
  };

  // Pre-loaded timeline items from docx extracts
  const timelineItems = [
    {
      date: "Infancia (4 - 12 años)",
      title: "Miedo y Conflicto en el Hogar",
      type: "negative",
      desc: "Peleas severas y constantes entre su padre y su hermana mayor. Crece con el miedo en el cuerpo todas las noches. Sentimiento de indefensión y falta de protección.",
      reframe: "Tus miedos infantiles no eran debilidad, sino una reacción normal de supervivencia. Hoy estás a salvo de ese entorno y puedes elegir tu propia protección."
    },
    {
      date: "Edad 9 - 12 años",
      title: "Abusos de su Hermana Mayor",
      type: "negative",
      desc: "Sufre tocamientos y abusos continuados en la cama por parte de su hermana mayor. Ruptura del apego y confusión sobre los límites y el afecto.",
      reframe: "El abuso fue responsabilidad absoluta de la persona mayor. No define tu valor ni tu capacidad de ser amado de forma sana."
    },
    {
      date: "Adolescencia (13 - 18 años)",
      title: "Maltrato Físico Paterno",
      type: "negative",
      desc: "Violencia física extrema (patadas, puñetazos) y persecuciones por parte de su padre debido a malas notas. Recibe mensajes constantes de que es un 'inútil'. Se esconde debajo de la cama.",
      reframe: "La violencia de tu padre proyectaba sus propias frustraciones. El mensaje de 'inútil' fue un maltrato psicológico falso; tu éxito posterior demostró tu gran capacidad intelectual."
    },
    {
      date: "Edad 18 - 24 años",
      title: "Entrada en Agencia EFE y Mentoría",
      type: "positive",
      desc: "Su padre lo mete en la Agencia EFE. Emilio descubre que es un fotógrafo excepcional y su padre se convierte en un gran mentor laboral, revelando una nueva faceta de apoyo.",
      reframe: "Lograste independizarte, aprender un oficio de alto nivel y ganarte el respeto profesional por tus propios méritos."
    },
    {
      date: "Años Posteriores",
      title: "Éxito Financiero y Libertad",
      type: "positive",
      desc: "Genera un patrimonio de cerca de 800.000 € y logra la independencia financiera total mediante su talento analítico.",
      reframe: "Demuestra que tienes un cerebro sumamente potente, capaz de asimilar información compleja y generar riqueza de forma legítima."
    },
    {
      date: "Año 2022",
      title: "La Estafa de 350.000 €",
      type: "negative",
      desc: "Tras pedir excedencia laboral, cae en una estafa documentada perdiendo 350.000 € de golpe. Detonante del bucle de auto-sabotaje y deudas posteriores de 160.000 €.",
      reframe: "Fuiste víctima de una estafa profesional. La pérdida económica activó tu antiguo trauma de 'no merecer el éxito' forjando el autosabotaje actual para volver al fracaso conocido."
    },
    {
      date: "Año 2025 (Junio)",
      title: "Intento de Suicidio e Incapacidad",
      type: "negative",
      desc: "Intento de autolisis ante la demanda de custodia de su hija Lola. 5 días en la UCI en coma. Pérdida temporal de la custodia de Lola.",
      reframe: "Tocaste fondo biológico ante el pánico de perder a tu hija. Sobrevivir es tu oportunidad para reestructurar tu vida con calma burocrática. Lola te necesita estable, no rico."
    }
  ];

  // Sync state when dailyMoodToday changes (e.g. loads from server) without useEffect to prevent cascading render warnings
  const [prevDailyMoodId, setPrevDailyMoodId] = useState(dailyMoodToday?.id || null);
  if (dailyMoodToday && dailyMoodToday.id !== prevDailyMoodId) {
    setPrevDailyMoodId(dailyMoodToday.id);
    setAnxiety(dailyMoodToday.anxiety_level);
    setImpulsivity(dailyMoodToday.impulsivity_level);
    setAtomoxetina(dailyMoodToday.atomoxetina_taken);
    setTrading(dailyMoodToday.trading_today);
    setNotes(dailyMoodToday.notes || '');
  }

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'sources') {
        fetchSources();
      } else if (activeTab === 'clinical_facts') {
        fetchCompletedConversations();
      }
    }
  }, [activeTab, user]);

  async function fetchHistory() {
    try {
      const { data, error } = await supabase
        .from('daily_moods')
        .select('*')
        .order('date', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      setHistory(data || []);
    } catch (e) {
      console.error("Error fetching mood history:", e.message);
    }
  }

  const handleSaveMood = async (e) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const payload = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        anxiety_level: parseInt(anxiety),
        impulsivity_level: parseInt(impulsivity),
        atomoxetina_taken: atomoxetina,
        trading_today: trading,
        notes: notes
      };

      // Upsert using date and user_id constraint
      const { data, error } = await supabase
        .from('daily_moods')
        .upsert(payload, { onConflict: 'user_id, date' })
        .select();

      if (error) throw error;

      if (data && data[0]) {
        onMoodSaved(data[0]);
      }
      fetchHistory();
      alert("Diario guardado con éxito.");
    } catch (err) {
      console.error("Error saving daily mood:", err.message);
      alert("Error al guardar el diario: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const [selectedTimelineItem, setSelectedTimelineItem] = useState(null);

  return (
    <div className="view-content-limit">
      {/* Inner View Navigation */}
      <div className="sub-tabs-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <button 
          onClick={() => setActiveTab('diary')} 
          className={`sub-tab-btn ${activeTab === 'diary' ? 'active' : ''}`}
        >
          1. Diario de Sensaciones
        </button>
        <button 
          onClick={() => setActiveTab('timeline')} 
          className={`sub-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`}
        >
          2. Eje Cronológico de Trauma
        </button>
        <button 
          onClick={() => setActiveTab('sources')} 
          className={`sub-tab-btn ${activeTab === 'sources' ? 'active' : ''}`}
        >
          3. Contexto Paciente (NotebookLM)
        </button>
        <button 
          onClick={() => setActiveTab('clinical_facts')} 
          className={`sub-tab-btn ${activeTab === 'clinical_facts' ? 'active' : ''}`}
          style={{ borderLeft: '2px solid var(--color-cyan)' }}
        >
          4. Hechos y Casos Clínicos
        </button>
        <button 
          onClick={() => setActiveTab('barkley')} 
          className={`sub-tab-btn ${activeTab === 'barkley' ? 'active' : ''}`}
        >
          5. Psicoeducación (Barkley)
        </button>
      </div>

      {/* TAB 1: DIARIO DE SENSACIONES */}
      {activeTab === 'diary' && (
        <div className="grid-2">
          {/* Form Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PlusCircle size={20} color="var(--color-emerald)" />
              Registrar Sensaciones de Hoy
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Este registro permite a Walter (tu terapeuta) supervisar tu ansiedad y el impacto del tratamiento.
            </p>

            <form onSubmit={handleSaveMood} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label">Nivel de Ansiedad ({anxiety}/10)</label>
                  <span style={{ fontSize: '0.75rem', color: anxiety > 7 ? 'var(--color-rose)' : 'var(--text-secondary)' }}>
                    {anxiety > 7 ? 'Muy Elevada' : 'Moderada'}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={anxiety} 
                  onChange={(e) => setAnxiety(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label className="form-label">Nivel de Impulsividad ({impulsivity}/10)</label>
                  <span style={{ fontSize: '0.75rem', color: impulsivity > 7 ? 'var(--color-rose)' : 'var(--text-secondary)' }}>
                    {impulsivity > 7 ? 'Riesgo de Operar' : 'Estable'}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={impulsivity} 
                  onChange={(e) => setImpulsivity(e.target.value)}
                  style={{ width: '100%', accentColor: 'var(--color-emerald)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <label className="checklist-item" style={{ flex: 1, cursor: 'pointer', margin: 0 }} onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={atomoxetina} 
                    onChange={() => setAtomoxetina(!atomoxetina)}
                    style={{ marginRight: '10px', accentColor: 'var(--color-emerald)', width: '16px', height: '16px' }}
                  />
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>¿Atomoxetina tomada?</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Soporte TDAH</span>
                  </div>
                </label>

                <label className="checklist-item" style={{ flex: 1, cursor: 'pointer', margin: 0 }} onClick={(e) => e.stopPropagation()}>
                  <input 
                    type="checkbox" 
                    checked={trading} 
                    onChange={() => setTrading(!trading)}
                    style={{ marginRight: '10px', accentColor: 'var(--color-rose)', width: '16px', height: '16px' }}
                  />
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block' }}>¿Operado hoy?</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Riesgo Financiero</span>
                  </div>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Notas, pensamientos o disparadores (triggers)</label>
                <textarea 
                  className="form-input" 
                  rows="3" 
                  placeholder="Describe cómo te sientes hoy, si hay pensamientos negativos o pánico..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ resize: 'none' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-emerald" 
                disabled={loading || profile?.role === 'supervisor'}
                style={{ height: '44px', width: '100%' }}
              >
                {loading ? 'Guardando...' : profile?.role === 'supervisor' ? 'Modo de Solo Lectura' : 'Guardar en Supabase'}
              </button>
            </form>
          </div>

          {/* History Card */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={20} color="var(--color-cyan)" />
                Historial de Sensaciones
              </h3>
              <button onClick={fetchHistory} style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <RefreshCw size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '360px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {history.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>
                  No hay registros diarios guardados en Supabase.
                </p>
              ) : (
                history.map((h) => (
                  <div key={h.id} style={{ 
                    padding: '14px', 
                    background: 'rgba(255, 255, 255, 0.015)', 
                    border: '1px solid var(--border)', 
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.8rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>{h.date}</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span className={`badge ${h.atomoxetina_taken ? 'badge-emerald' : 'badge-rose'}`}>
                          Ato: {h.atomoxetina_taken ? 'SÍ' : 'NO'}
                        </span>
                        {h.trading_today && (
                          <span className="badge badge-rose">OPERÓ</span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <span>Ansiedad: <strong style={{ color: h.anxiety_level > 7 ? 'var(--color-rose)' : '#ffffff' }}>{h.anxiety_level}/10</strong></span>
                      <span>Impulsividad: <strong style={{ color: h.impulsivity_level > 7 ? 'var(--color-rose)' : '#ffffff' }}>{h.impulsivity_level}/10</strong></span>
                    </div>
                    {h.notes && (
                      <p style={{ color: 'var(--text-primary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.1)', padding: '6px 10px', borderRadius: '4px' }}>
                        "{h.notes}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EJE CRONOLÓGICO DE TRAUMA */}
      {activeTab === 'timeline' && (
        <div className="grid-2">
          {/* Interactive Timeline */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="var(--color-cyan)" />
              Eje Cronológico de Emilio
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Selecciona un hito de tu historia de vida para revelar el reencuadre cognitivo diseñado para tu terapia.
            </p>

            <div className="timeline">
              {timelineItems.map((item, idx) => (
                <div 
                  key={idx} 
                  className="timeline-item" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedTimelineItem(item)}
                >
                  <div className={`timeline-badge ${item.type}`} />
                  <div className="timeline-content" style={{ 
                    border: selectedTimelineItem?.title === item.title ? '1px solid var(--color-cyan)' : '1px solid var(--border)',
                    background: selectedTimelineItem?.title === item.title ? 'hsla(var(--cyan), 0.03)' : 'var(--background-secondary)'
                  }}>
                    <span className="timeline-date">{item.date}</span>
                    <h4 className="timeline-title" style={{ color: item.type === 'positive' ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                      {item.title}
                    </h4>
                    <p className="timeline-desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reframe Panel Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {selectedTimelineItem ? (
                <div>
                  <span className="badge badge-cyan" style={{ marginBottom: '14px' }}>Reencuadre Terapéutico ( Walter )</span>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '10px', color: selectedTimelineItem.type === 'positive' ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                    {selectedTimelineItem.title}
                  </h3>
                  <div style={{ 
                    padding: '16px', 
                    background: 'hsla(var(--cyan), 0.05)', 
                    border: '1px solid hsla(var(--cyan), 0.25)', 
                    borderRadius: 'var(--radius-md)',
                    lineHeight: 1.5,
                    fontSize: '0.85rem'
                  }}>
                    <p style={{ color: '#ffffff', fontWeight: 500 }}>
                      {selectedTimelineItem.reframe}
                    </p>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '20px', lineHeight: 1.4 }}>
                    <strong>Nota de Walter:</strong> En tu terapia EMDR, enfócate en la sensación física que te produce este recuerdo y sustitúyela con esta verdad de reencuadre. El trauma no es tu identidad.
                  </p>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <Brain size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 16px' }} />
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Haz clic en un hito del eje cronológico</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '6px', maxWidth: '280px', margin: '6px auto 0' }}>
                    Visualiza y reprocesa los fantasmas de tu pasado para liberar tu toma de decisiones en el presente.
                  </p>
                </div>
              )}
            </div>
            
            <div className="glass-panel" style={{ padding: '24px', background: 'hsla(var(--emerald), 0.01)' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--color-emerald)' }}>¿Por qué la parálisis en el éxito?</h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Tu trauma infantil te grabó a fuego que <strong>"no mereces nada bueno"</strong>. Cuando vas ganando en el trading, tu cerebro límbico entra en pánico al violar esa regla identitaria antigua. Te paralizas (freeze) en lugar de cerrar, provocando la pérdida para auto-sabotearte y regresar a la "zona de confort traumática" del fracaso conocido.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PSICOEDUCACIÓN BARKLEY */}
      {activeTab === 'barkley' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={22} color="var(--color-emerald)" />
              Manejo del TDAH en el Adulto (Dr. Russell Barkley)
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
              Russell Barkley enseña que el TDAH no es un problema de "saber qué hacer", sino de <strong>"hacer lo que sabes en el punto exacto de ejecución"</strong>. A continuación, se detallan las 3 disfunciones ejecutivas de Emilio y sus soluciones externas obligatorias:
            </p>

            <div className="grid-3">
              {/* Point 1 */}
              <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-rose)', marginBottom: '8px' }}>
                    1. Falla de Inhibición (Impulsividad)
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Incapacidad de frenar el primer impulso. Te lleva a recargar lotes en pérdidas para promediar a la baja, estirar el Stop Loss o meter operaciones impulsivas tras pérdidas.
                  </p>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
                  ESTRUCTURA EXTERNA: Script Equity-Killer que altera contraseña 24h.
                </div>
              </div>

              {/* Point 2 */}
              <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-rose)', marginBottom: '8px' }}>
                    2. Falla en Memoria de Trabajo
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    En el calor del trade, tu plan de trading y las lecciones aprendidas "desaparecen" de tu pantalla mental. Tu cerebro solo experimenta la emoción inmediata del pánico financiero.
                  </p>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
                  ESTRUCTURA EXTERNA: Checklist físico y bloqueos en interfaz.
                </div>
              </div>

              {/* Point 3 */}
              <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-rose)', marginBottom: '8px' }}>
                    3. Desregulación Emocional
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Bajo estrés, tu amígdala sufre un secuestro completo. La adrenalina anula el efecto de la Atomoxetina y la racionalidad matemática desaparece, dando paso a la martingala desesperada.
                  </p>
                </div>
                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--color-emerald)', fontWeight: 600 }}>
                  ESTRUCTURA EXTERNA: Protocolo de choque térmico y respiración 30s.
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel flex-center" style={{ padding: '20px', gap: '14px', background: 'hsla(var(--rose), 0.02)', borderColor: 'hsla(var(--rose), 0.2)' }}>
            <AlertOctagon size={24} color="var(--color-rose)" />
            <span style={{ fontSize: '0.8rem', lineHeight: 1.4, color: 'var(--text-secondary)' }}>
              <strong style={{ color: '#ffffff' }}>Regla de Barkley:</strong> "No confíes en tu fuerza de voluntad en el momento del trade. La fuerza de voluntad es una función ejecutiva dañada por el TDAH. Debes retirar tus privilegios de administrador de tu cuenta mediante reglas técnicas externas."
            </span>
          </div>
        </div>
      )}

      {/* TAB 3: FUENTES DEL PACIENTE (NOTEBOOKLM-STYLE) */}
      {activeTab === 'sources' && (
        <div className="grid-2">
          {/* Upload and creation panel */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UploadCloud size={20} color="var(--color-cyan)" />
                Cargar Contexto Personal (NotebookLM)
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                Sube reportes, notas de texto o informes. Walter los asimilará como contexto complementario en vuestro chat para orientar la terapia.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* File Uploader */}
              <div style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.01)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
              className="conv-item-hover"
              >
                <input 
                  type="file" 
                  multiple
                  onChange={handleFileUpload} 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                  disabled={uploadLoading}
                />
                <UploadCloud size={32} color="var(--color-cyan)" style={{ margin: '0 auto 8px' }} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', color: '#ffffff' }}>
                  {uploadLoading ? 'Procesando archivos...' : 'Arrastra o selecciona archivos (cualquier formato)'}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  Se admiten múltiples imágenes, PDFs, notas de texto o informes
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', fontWeight: 800 }}>O escribe una nota manual</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              {/* Note Form */}
              <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Título de la Nota</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Ej. Anotaciones de pánico, Informe médico 2024..." 
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    required
                    style={{ height: '38px', fontSize: '0.8rem' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.72rem' }}>Contenido de la Fuente</label>
                  <textarea 
                    className="form-input" 
                    rows="5" 
                    placeholder="Escribe o pega aquí el texto que servirá de contexto para Walter..." 
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    required
                    style={{ resize: 'none', fontSize: '0.8rem' }}
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-cyan" 
                  style={{ height: '38px', fontSize: '0.78rem', fontWeight: 700 }}
                  disabled={uploadLoading || !noteTitle.trim() || !noteContent.trim()}
                >
                  {uploadLoading ? 'Guardando...' : 'Añadir a Fuentes'}
                </button>
              </form>
            </div>
          </div>

          {/* Uploaded sources grid */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderOpen size={20} color="var(--color-cyan)" />
              Fuentes en el Cerebro de Walter ({sources.length})
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '420px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sourceLoading ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>
                  Cargando documentos de contexto...
                </p>
              ) : sources.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)' }}>
                  <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ fontSize: '0.8rem', margin: 0 }}>No hay fuentes de contexto subidas.</p>
                  <p style={{ fontSize: '0.7rem', marginTop: '4px' }}>Walter solo usará sus pautas base hasta que agregues fuentes.</p>
                </div>
              ) : (
                sources.map((src) => (
                  <div 
                    key={src.id} 
                    style={{ 
                      padding: '12px 14px', 
                      background: 'rgba(255, 255, 255, 0.015)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 0.2s ease'
                    }}
                    className="conv-item-hover"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <div className="flex-center" style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        background: src.content_type === 'note' ? 'hsla(var(--cyan), 0.08)' : 'rgba(255,255,255,0.03)',
                        border: '1px solid ' + (src.content_type === 'note' ? 'hsla(var(--cyan), 0.2)' : 'var(--border)'),
                        color: 'var(--color-cyan)',
                        flexShrink: 0
                      }}>
                        {src.content_type === 'note' ? <BookOpenCheck size={16} /> : <FileText size={16} />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={src.name}>
                            {src.name}
                          </span>
                          {src.processed ? (
                            <span className="badge badge-emerald" style={{ fontSize: '0.55rem', padding: '1px 6px', height: '16px', textTransform: 'none', letterSpacing: '0.02em', borderRadius: '4px', fontWeight: 600 }}>
                              🧠 Leído por Walter
                            </span>
                          ) : (
                            <span className="badge badge-cyan animate-pulse-soft" style={{ fontSize: '0.55rem', padding: '1px 6px', height: '16px', textTransform: 'none', letterSpacing: '0.02em', borderRadius: '4px', fontWeight: 600, border: '1px solid var(--color-cyan)', boxShadow: '0 0 6px hsla(var(--cyan), 0.3)' }}>
                              🆕 Nuevo (Pendiente Sinc)
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                          {src.content_type === 'note' ? 'Nota manual' : 'Archivo de texto'} • {new Date(src.created_at).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button 
                        onClick={() => setSelectedSource(src)}
                        className="btn btn-outline flex-center"
                        style={{ padding: '6px', borderRadius: '6px', width: '28px', height: '28px', minWidth: 0 }}
                        title="Ver contenido"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteSource(src.id)}
                        className="btn btn-outline flex-center"
                        style={{ padding: '6px', borderRadius: '6px', width: '28px', height: '28px', minWidth: 0, borderColor: 'rgba(244,63,94,0.3)', color: 'var(--color-rose)' }}
                        title="Eliminar de las fuentes"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HECHOS Y CASOS CLÍNICOS CONSOLIDADOS */}
      {activeTab === 'clinical_facts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Diagnostic Sync and Patient Photo */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Brain size={24} color="var(--color-cyan)" />
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: 0, textShadow: '0 0 10px rgba(6,182,212,0.15)' }}>
                    Diagnóstico Clínico & Evolución Psicológica
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                    Análisis terapéutico estructurado y consolidado por Walter para Emilio.
                  </p>
                </div>
              </div>
              
              <button 
                onClick={handleSyncProfile}
                className="btn btn-cyan flex-center animate-glow-cyan"
                style={{ gap: '8px', height: '36px', padding: '0 16px', fontSize: '0.78rem', fontWeight: 700 }}
                disabled={syncLoading}
              >
                <RefreshCw size={14} className={syncLoading ? 'animate-spin' : ''} />
                <span>{syncLoading ? 'Sincronizando Diagnóstico...' : 'Sincronizar Análisis de Walter'}</span>
              </button>
            </div>

            {/* --- CONTEXTO CLÍNICO DE BASE (INMUTABLE) --- */}
            <div>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📌 Contexto Clínico de Base (Inmutable)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {/* Diagnóstico Inicial */}
                <div className="glass-panel" style={{ 
                  padding: '20px', 
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.04), rgba(15, 23, 42, 0.4))', 
                  border: '1px solid hsla(var(--cyan), 0.2)',
                  borderRadius: '12px'
                }}>
                  <h5 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: 0 }}>
                    🧠 Diagnóstico Inicial de Base
                  </h5>
                  <p style={{ fontSize: '0.78rem', lineHeight: 1.55, color: '#ffffff', fontStyle: 'italic', margin: 0 }}>
                    {profile?.contexto_terapeutico?.contexto_base?.diagnostico_inicial || profile?.contexto_terapeutico?.foto_persona || "Paciente con TDAH del adulto con perfil impulsivo severo agravado por trauma complejo de la infancia, lo que desencadena patrones repetitivos de autosabotaje financiero ante hitos de éxito."}
                  </p>
                </div>

                {/* Mecanismos de Defensa Inmutables */}
                <div className="glass-panel" style={{ 
                  padding: '20px', 
                  background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.04), rgba(15, 23, 42, 0.4))', 
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  borderRadius: '12px'
                }}>
                  <h5 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-rose)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', marginTop: 0 }}>
                    ⚠️ Mecanismos de Defensa Crónicos
                  </h5>
                  <p style={{ fontSize: '0.78rem', lineHeight: 1.55, color: '#ffffff', margin: 0, whiteSpace: 'pre-line' }}>
                    {profile?.contexto_terapeutico?.contexto_base?.mecanismos_defensa || "1. Negación de la escala de pérdida (ceguera de escala).\n2. Racionalización del riesgo post-pérdida.\n3. Autosabotaje inconsciente para retornar a la zona de confort traumática (fracaso conocido)."}
                  </p>
                </div>
              </div>
            </div>

            {/* --- LÍNEA DE EVOLUCIÓN DE SESIONES (CRONOLÓGICA) --- */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} color="var(--color-cyan)" />
                Línea de Evolución de Sesiones
              </h4>

              {(!profile?.contexto_terapeutico?.evoluciones || profile.contexto_terapeutico.evoluciones.length === 0) ? (
                <div style={{ padding: '24px', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border)', borderRadius: '12px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    No hay hitos evolutivos registrados todavía. Las evoluciones cronológicas se generan automáticamente al cerrar y consolidar sesiones terapéuticas con Walter.
                  </span>
                </div>
              ) : (
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '20px', 
                  position: 'relative', 
                  paddingLeft: '22px',
                  borderLeft: '2px solid rgba(6, 182, 212, 0.15)',
                  marginLeft: '10px'
                }}>
                  {profile.contexto_terapeutico.evoluciones.map((ev, idx) => (
                    <div key={idx} style={{ position: 'relative' }}>
                      {/* Punto de la línea de tiempo */}
                      <div style={{ 
                        position: 'absolute', 
                        left: '-29px', 
                        top: '4px', 
                        width: '12px', 
                        height: '12px', 
                        borderRadius: '50%', 
                        background: 'var(--color-cyan)', 
                        border: '2px solid var(--background-primary)',
                        boxShadow: '0 0 8px var(--color-cyan)'
                      }} />
                      
                      {/* Card de la Sesión */}
                      <div className="glass-panel" style={{ 
                        padding: '16px', 
                        background: 'rgba(255, 255, 255, 0.015)', 
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '6px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff' }}>
                            {ev.titulo_sesion || `Sesión Clínica`}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            📅 {ev.fecha ? new Date(ev.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Fecha no registrada'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.74rem', lineHeight: 1.45 }}>
                          <p style={{ margin: 0, color: '#ffffff' }}>
                            <strong>Hecho Clínico Analizado:</strong> <span style={{ color: 'var(--color-cyan)' }}>{ev.hecho_clinico}</span>
                          </p>
                          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                            <strong>Análisis Evolutivo:</strong> {ev.analisis_evolutivo}
                          </p>
                          {ev.pautas_y_compromisos && (
                            <div style={{ 
                              marginTop: '4px', 
                              padding: '8px 12px', 
                              background: 'rgba(16, 185, 129, 0.03)', 
                              border: '1px solid rgba(16, 185, 129, 0.12)', 
                              borderRadius: '6px',
                              color: 'var(--color-emerald)'
                            }}>
                              <strong>Pautas y Compromisos de esta sesión:</strong>
                              <p style={{ margin: '2px 0 0 0', fontSize: '0.7rem', color: 'rgba(16, 185, 129, 0.95)' }}>{ev.pautas_y_compromisos}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* --- MAPA DE TEMAS CLÍNICOS GLOBALES --- */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🗺️ Temas Terapéuticos Globales (Eje Conductual)
              </h4>
              {(!profile?.contexto_terapeutico?.temas || profile.contexto_terapeutico.temas.length === 0) ? (
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontStyle: 'italic', margin: 0 }}>
                  Walter mapeará los temas clínicos activos, cerrados y emergentes tras sincronizar el análisis.
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                  {profile.contexto_terapeutico.temas.map((tema, idx) => {
                    let badgeClass = 'badge-cyan';
                    let statusLabel = 'Emergente';
                    if (tema.status === 'active') {
                      badgeClass = 'badge-rose';
                      statusLabel = 'Activo';
                    } else if (tema.status === 'closed') {
                      badgeClass = 'badge-emerald';
                      statusLabel = 'Controlado / Cerrado';
                    }
                    return (
                      <div 
                        key={idx} 
                        style={{ 
                          padding: '12px 14px', 
                          background: 'rgba(255,255,255,0.01)', 
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}
                        className="conv-item-hover"
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ffffff' }}>{tema.title}</span>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: '0.52rem', padding: '1px 5px', fontWeight: 700 }}>{statusLabel}</span>
                        </div>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0 }}>
                          {tema.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* --- MEDIDAS Y CONCLUSIONES CONSOLIDADAS VIGENTES --- */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }} className="grid-3">
              {/* Conclusiones */}
              <div style={{ background: 'rgba(255,255,255,0.012)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <h5 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-cyan)', margin: '0 0 10px 0', borderBottom: '1px solid rgba(6,182,212,0.15)', paddingBottom: '6px' }}>
                  🧠 Conclusiones Psicológicas Consolidadas
                </h5>
                <ul style={{ paddingLeft: '14px', fontSize: '0.72rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
                  {profile?.contexto_terapeutico?.conclusiones && profile.contexto_terapeutico.conclusiones.length > 0 ? (
                    profile.contexto_terapeutico.conclusiones.map((item, idx) => (
                      <li key={idx} style={{ lineHeight: 1.4 }}>{item}</li>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Sin conclusiones registradas. Se consolidarán al archivar sesiones.</span>
                  )}
                </ul>
              </div>

              {/* Compromisos */}
              <div style={{ background: 'rgba(255,255,255,0.012)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <h5 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-emerald)', margin: '0 0 10px 0', borderBottom: '1px solid rgba(16,185,129,0.15)', paddingBottom: '6px' }}>
                  ⚖️ Compromisos de Operativa Consolidados
                </h5>
                <ul style={{ paddingLeft: '14px', fontSize: '0.72rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
                  {profile?.contexto_terapeutico?.compromisos && profile.contexto_terapeutico.compromisos.length > 0 ? (
                    profile.contexto_terapeutico.compromisos.map((item, idx) => (
                      <li key={idx} style={{ lineHeight: 1.4 }}>{item}</li>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Sin compromisos activos de gestión de riesgo.</span>
                  )}
                </ul>
              </div>

              {/* Pautas de Accion */}
              <div style={{ background: 'rgba(255,255,255,0.012)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <h5 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-rose)', margin: '0 0 10px 0', borderBottom: '1px solid rgba(244,63,94,0.15)', paddingBottom: '6px' }}>
                  📋 Pautas de Acción Consolidadas
                </h5>
                <ul style={{ paddingLeft: '14px', fontSize: '0.72rem', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '6px', margin: 0 }}>
                  {profile?.contexto_terapeutico?.pautas_accion && profile.contexto_terapeutico.pautas_accion.length > 0 ? (
                    profile.contexto_terapeutico.pautas_accion.map((item, idx) => (
                      <li key={idx} style={{ lineHeight: 1.4 }}>{item}</li>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Sin pautas o ejercicios prescritos aún.</span>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Archived Sessions Grid */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="var(--color-cyan)" />
              Historial Clínico Consolidad: Hechos Extraídos ({completedConversations.length})
            </h3>

            {completedConversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)' }}>
                <Calendar size={36} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p style={{ fontSize: '0.8rem', margin: 0 }}>No hay sesiones de chat archivadas.</p>
                <p style={{ fontSize: '0.7rem', marginTop: '4px' }}>Finaliza una sesión activa en el Chat con Walter para registrar conclusiones detalladas.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {completedConversations.map((session) => {
                  const closedDate = session.closed_at ? new Date(session.closed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
                  return (
                    <div 
                      key={session.id} 
                      className="glass-panel" 
                      style={{ 
                        padding: '18px', 
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.01), rgba(15,23,42,0.4))',
                        border: '1px solid var(--border)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '14px',
                        transition: 'all 0.2s ease'
                      }}
                      className="conv-item-hover"
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span className="badge badge-cyan" style={{ fontSize: '0.6rem', padding: '2px 8px' }}>Sesión Archivada</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{closedDate}</span>
                        </div>
                        
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
                          {session.title || 'Nueva Sesión con Walter'}
                        </h4>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.74rem' }}>
                          <p style={{ margin: 0, color: '#ffffff', lineHeight: 1.4 }}>
                            <strong>Hecho Clínico:</strong> <span style={{ textDecoration: 'underline', decorationColor: 'var(--color-cyan)' }}>{session.captured_fact || 'No registrado'}</span>
                          </p>

                          <div>
                            <strong style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '2px' }}>Conclusiones:</strong>
                            <ul style={{ margin: 0, paddingLeft: '14px', color: 'var(--text-secondary)' }}>
                              {(() => {
                                if (!session.conclusions) return <li>-</li>;
                                try {
                                  const list = typeof session.conclusions === 'string' ? JSON.parse(session.conclusions) : session.conclusions;
                                  return Array.isArray(list) ? list.slice(0, 2).map((c, i) => <li key={i}>{c}</li>) : <li>{String(session.conclusions)}</li>;
                                } catch {
                                  return <li>{String(session.conclusions)}</li>;
                                }
                              })()}
                            </ul>
                          </div>

                          <div>
                            <strong style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--color-emerald)', marginBottom: '2px' }}>Pautas / Ejercicios:</strong>
                            <ul style={{ margin: 0, paddingLeft: '14px', color: 'var(--color-emerald)', fontWeight: 500 }}>
                              {(() => {
                                if (!session.solutions_exercises) return <li>-</li>;
                                try {
                                  const list = typeof session.solutions_exercises === 'string' ? JSON.parse(session.solutions_exercises) : session.solutions_exercises;
                                  return Array.isArray(list) ? list.slice(0, 2).map((s, i) => <li key={i}>{s}</li>) : <li>{String(session.solutions_exercises)}</li>;
                                } catch {
                                  return <li>{String(session.solutions_exercises)}</li>;
                                }
                              })()}
                            </ul>
                          </div>

                          {session.clinical_studies && (
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.68rem', color: 'var(--text-tertiary)', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px' }}>
                              Estudio: {session.clinical_studies}
                            </p>
                          )}
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedSession(session);
                          loadSessionMessages(session.id);
                        }}
                        className="btn btn-outline flex-center"
                        style={{ width: '100%', gap: '8px', height: '32px', fontSize: '0.74rem', fontWeight: 600, borderColor: 'var(--color-cyan)', color: 'var(--color-cyan)' }}
                      >
                        <BookOpenCheck size={14} />
                        <span>Ver Conversación Completa</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: PREVISUALIZAR FUENTE (NOTEBOOKLM) */}
      {selectedSource && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(7, 10, 19, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="glass-panel animate-glow-cyan" style={{
            width: '100%',
            maxWidth: '650px',
            background: 'var(--background-secondary)',
            border: '1px solid var(--color-cyan)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            maxHeight: '85%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="var(--color-cyan)" />
                <h4 style={{ fontSize: '1rem', margin: 0 }}>{selectedSource.name}</h4>
              </div>
              <button 
                onClick={() => setSelectedSource(null)}
                style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              background: 'rgba(0,0,0,0.2)', 
              padding: '16px', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              fontSize: '0.8rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              color: 'var(--text-primary)',
              maxHeight: '360px'
            }}>
              {selectedSource.text_content}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedSource(null)}
                className="btn btn-cyan"
                style={{ height: '36px', fontSize: '0.78rem', padding: '0 18px' }}
              >
                Cerrar Previsualización
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: VER TRANSCRIPCIÓN DE SESIÓN ARCHIVADA */}
      {selectedSession && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(7, 10, 19, 0.85)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="glass-panel animate-glow-cyan" style={{
            width: '100%',
            maxWidth: '750px',
            background: 'var(--background-secondary)',
            border: '1px solid var(--color-cyan)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: '85%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontSize: '1rem', margin: 0, color: '#ffffff' }}>
                  Transcripción: {selectedSession.title || 'Sesión con Walter'}
                </h4>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                  Sesión archivada el {selectedSession.closed_at ? new Date(selectedSession.closed_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
              <button 
                onClick={() => {
                  setSelectedSession(null);
                  setSessionMessages([]);
                }}
                style={{ color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Transcript Area */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              background: 'rgba(0,0,0,0.2)', 
              padding: '20px', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {transcriptLoading ? (
                <div className="flex-center" style={{ height: '100%', flexDirection: 'column', gap: '8px' }}>
                  <RefreshCw size={24} color="var(--color-cyan)" className="animate-spin" />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Cargando conversación...</span>
                </div>
              ) : sessionMessages.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>
                  No se encontraron mensajes en esta sesión.
                </p>
              ) : (
                sessionMessages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      background: msg.role === 'user' ? 'rgba(255,255,255,0.03)' : 'hsla(var(--cyan), 0.05)',
                      border: '1px solid ' + (msg.role === 'user' ? 'var(--border)' : 'hsla(var(--cyan), 0.25)'),
                      padding: '12px 16px',
                      borderRadius: '12px',
                      borderBottomRightRadius: msg.role === 'user' ? '2px' : '12px',
                      borderBottomLeftRadius: msg.role === 'assistant' ? '2px' : '12px',
                      maxWidth: '85%',
                      fontSize: '0.78rem',
                      lineHeight: 1.5
                    }}
                  >
                    <span style={{ 
                      fontSize: '0.62rem', 
                      fontWeight: 700, 
                      color: msg.role === 'user' ? '#ffffff' : 'var(--color-cyan)', 
                      display: 'block', 
                      textTransform: 'uppercase', 
                      marginBottom: '4px' 
                    }}>
                      {msg.role === 'user' ? 'Emilio' : 'Walter'}
                    </span>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                  </div>
                ))
              )}
            </div>

            {/* Fact cards summary */}
            <div style={{ 
              background: 'rgba(255,255,255,0.01)', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              fontSize: '0.74rem'
            }}>
              <span style={{ fontWeight: 700, color: 'var(--color-cyan)', display: 'block', marginBottom: '2px' }}>
                Hecho Clínico Consolidad:
              </span>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                "{selectedSession.captured_fact || 'No registrado'}"
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                onClick={() => {
                  setSelectedSession(null);
                  setSessionMessages([]);
                }}
                className="btn btn-cyan"
                style={{ height: '36px', fontSize: '0.78rem', padding: '0 18px', fontWeight: 600 }}
              >
                Cerrar Transcripción
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
