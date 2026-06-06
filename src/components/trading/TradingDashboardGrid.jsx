import { useState, useEffect } from 'react';
import { LayoutGrid, Minimize2, Maximize2, Move } from 'lucide-react';

export default function TradingDashboardGrid({ children }) {
  // Configuración de widgets por defecto: { id, title, colSpan (1 o 2), collapsed (boolean) }
  const [widgets, setWidgets] = useState(() => {
    const defaultWidgets = [
      { id: 'bingx', title: 'Seguimiento de Cuenta & Broker (BingX)', colSpan: 2, collapsed: false },
      { id: 'calendar', title: 'Diario de Consistencia & Calendario Reto', colSpan: 2, collapsed: false },
      { id: 'security', title: 'Checklist de Seguridad', colSpan: 1, collapsed: false },
      { id: 'amigdala', title: 'Reset de Amígdala (Choque Fisiológico)', colSpan: 1, collapsed: false },
      { id: 'grief', title: 'Procesador de Duelos (Ceguera de Escala)', colSpan: 1, collapsed: false },
      { id: 'panic', title: 'Simulador de Pánico (Amígdala)', colSpan: 1, collapsed: false },
    ];

    const saved = localStorage.getItem('tradezella_widgets_layout');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const merged = [...parsed];
          defaultWidgets.forEach(def => {
            if (!merged.some(w => w.id === def.id)) {
              merged.push(def);
            }
          });
          return merged;
        }
      } catch (e) {
        console.error("Error parsing layout, using default", e);
      }
    }
    return defaultWidgets;
  });

  const [draggedId, setDraggedId] = useState(null);

  useEffect(() => {
    localStorage.setItem('tradezella_widgets_layout', JSON.stringify(widgets));
  }, [widgets]);

  const handleDragStart = (e, id) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e, id) => {
    e.preventDefault();
    if (draggedId === null || draggedId === id) return;
    
    // Encontrar índices
    const draggedIdx = widgets.findIndex(w => w.id === draggedId);
    const targetIdx = widgets.findIndex(w => w.id === id);
    
    if (draggedIdx !== -1 && targetIdx !== -1) {
      const newWidgets = [...widgets];
      // Mover elemento
      newWidgets.splice(draggedIdx, 1);
      newWidgets.splice(targetIdx, 0, widgets[draggedIdx]);
      setWidgets(newWidgets);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const toggleCollapse = (id) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, collapsed: !w.collapsed } : w
    ));
  };

  const toggleSize = (id) => {
    setWidgets(prev => prev.map(w => 
      w.id === id ? { ...w, colSpan: w.colSpan === 1 ? 2 : 1 } : w
    ));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Barra de Herramientas del Dashboard */}
      <div className="glass-panel" style={{ 
        padding: '12px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'rgba(0,0,0,0.15)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LayoutGrid size={16} color="var(--color-cyan)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Panel Interactivo TradeZella (Arrastra y Redimensiona tus Widgets)
          </span>
        </div>
        <button 
          onClick={() => {
            if(confirm("¿Restablecer orden por defecto?")) {
              localStorage.removeItem('tradezella_widgets_layout');
              window.location.reload();
            }
          }}
          className="btn btn-outline"
          style={{ padding: '4px 10px', fontSize: '0.65rem', height: '26px' }}
        >
          Restablecer Vista
        </button>
      </div>

      {/* Grid del Dashboard */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '20px',
        alignItems: 'start'
      }}>
        {widgets.map((widget) => {
          const child = children[widget.id];
          if (!child) return null;

          return (
            <div
              key={widget.id}
              draggable
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragOver={(e) => handleDragOver(e, widget.id)}
              onDragEnd={handleDragEnd}
              style={{
                gridColumn: widget.colSpan === 2 ? 'span 2' : 'span 1',
                opacity: draggedId === widget.id ? 0.3 : 1,
                transition: 'opacity 0.2s ease, grid-column 0.3s ease',
                position: 'relative'
              }}
              className="glass-panel widget-card"
            >
              {/* Header del Widget */}
              <div style={{ 
                padding: '12px 16px', 
                borderBottom: '1px solid var(--border)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                background: 'rgba(255,255,255,0.01)',
                cursor: 'grab'
              }} className="widget-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Move size={12} style={{ color: 'var(--text-tertiary)' }} />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                    {widget.title}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Botón Redimensionar */}
                  <button
                    onClick={() => toggleSize(widget.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                    title={widget.colSpan === 1 ? "Expandir a 2 columnas" : "Reducir a 1 columna"}
                  >
                    {widget.colSpan === 1 ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                  </button>
                  {/* Botón Colapsar */}
                  <button
                    onClick={() => toggleCollapse(widget.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px', fontSize: '0.75rem', fontWeight: 'bold' }}
                    title={widget.collapsed ? "Expandir Widget" : "Colapsar Widget"}
                  >
                    {widget.collapsed ? '[+]' : '[—]'}
                  </button>
                </div>
              </div>

              {/* Contenido del Widget */}
              <div style={{ 
                padding: widget.collapsed ? '0px' : '20px', 
                height: widget.collapsed ? '0px' : 'auto', 
                overflow: 'hidden',
                transition: 'padding 0.2s ease, height 0.2s ease'
              }}>
                {!widget.collapsed && child}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
