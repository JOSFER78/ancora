import { useState } from 'react';
import TradingDashboardGrid from '../components/trading/TradingDashboardGrid';
import ViabilityWidget from '../components/trading/ViabilityWidget';
import BingXWidget from '../components/trading/BingXWidget';
import GriefWidget from '../components/trading/GriefWidget';
import PanicSimulatorWidget from '../components/trading/PanicSimulatorWidget';
import SecurityChecklistWidget from '../components/trading/SecurityChecklistWidget';

export default function TradingView({ user, totalDebts, onDebtsUpdated, onTabChange }) {
  // Parámetros de operativa rápidos (sincronizados entre widgets)
  const [targetInput, setTargetInput] = useState(400);
  const [daysInput, setDaysInput] = useState(3); // 3 días a la semana por defecto (MA-JU)

  return (
    <div className="view-content-limit" style={{ paddingBottom: '30px' }}>
      
      {/* Dashboard interactivo con los Widgets estilo TradeZella */}
      <TradingDashboardGrid>
        {{
          bingx: (
            <BingXWidget 
              user={user} 
              onTabChange={onTabChange} 
            />
          ),
          viability: (
            <ViabilityWidget
              user={user}
              totalDebts={totalDebts}
              onDebtsUpdated={onDebtsUpdated}
              targetInput={targetInput}
              setTargetInput={setTargetInput}
              daysInput={daysInput}
              setDaysInput={setDaysInput}
            />
          ),
          security: (
            <SecurityChecklistWidget 
              dailyMoodToday={null} // Se sincronizará localmente desde Supabase en el widget
            />
          ),
          grief: (
            <GriefWidget />
          ),
          panic: (
            <PanicSimulatorWidget />
          )
        }}
      </TradingDashboardGrid>

    </div>
  );
}
