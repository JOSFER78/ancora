import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Calendar, TrendingUp, Landmark, Plus, Trash2, Brain, Info
} from 'lucide-react';

const getDayOfWeek = (d) => {
  const date = new Date(2026, 4, d); // Mayo 2026
  let dayOfWeek = date.getDay();
  dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lunes=0, Domingo=6
  return dayOfWeek;
};

const isTradingDay = (dayOfWeek, daysOption) => {
  if (daysOption === 3) return dayOfWeek >= 1 && dayOfWeek <= 3; // MA-JU
  if (daysOption === 4) return dayOfWeek >= 0 && dayOfWeek <= 3; // LU-JU
  if (daysOption === 5) return dayOfWeek >= 0 && dayOfWeek <= 4; // LU-VI
  return false;
};

const formatSafeDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString('es-ES');
};

export default function ViabilityPlan({ user, totalDebts, onDebtsUpdated, targetInput, setTargetInput, daysInput, setDaysInput }) {
  const [calcActiveSubTab, setCalcActiveSubTab] = useState('journal');
  
  // Ingresos y Gastos
  const [efeSalary, setEfeSalary] = useState(2800);
  const [efeExtraAmount, setEfeExtraAmount] = useState(2800);
  const efeExtraMonths = [2, 6, 12];
  
  const [monthlyExpenses, setMonthlyExpenses] = useState(1500);
  const [expensesList, setExpensesList] = useState([]);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  
  // Deudas
  const [debtsList, setDebtsList] = useState([]);
  const [newCreditor, setNewCreditor] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPriority, setNewPriority] = useState(1);
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [sortBy, setSortBy] = useState('priority');
  const [sortOrder, setSortOrder] = useState('asc');

  // Diario de Trading
  const [journalDays, setJournalDays] = useState([]);
  const [selectedJournalDay, setSelectedJournalDay] = useState(null);
  const [journalDayPnl, setJournalDayPnl] = useState('');
  const [journalDayTrades, setJournalDayTrades] = useState('');

  const usdToEurRate = 0.92;
  const startBalance = 2400;

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      setExpensesList(data || []);
    } catch (err) {
      console.error("Error fetching expenses:", err.message);
    }
  };

  const fetchJournalDays = async () => {
    try {
      const { data, error } = await supabase
        .from('journal_days')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      
      const list = (data || []).map(d => ({
        date: d.date,
        pnl: parseFloat(d.pnl) || 0,
        trades: parseInt(d.trades) || 0,
        status: d.status
      }));
      setJournalDays(list);
    } catch (err) {
      console.error("Error fetching journal days:", err.message);
    }
  };

  const fetchDebts = async () => {
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('*')
        .order('priority', { ascending: true });
      if (error) throw error;
      
      const list = data || [];
      setDebtsList(list);
      
      const sum = list.reduce((acc, curr) => {
        const amt = parseFloat(curr.amount) || 0;
        const paid = parseFloat(curr.paid_amount) || 0;
        return acc + (amt - paid);
      }, 0);
      
      if (onDebtsUpdated) onDebtsUpdated(sum);
    } catch (e) {
      console.error("Error fetching debts:", e.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDebts();
      fetchExpenses();
      fetchJournalDays();
    }
  }, [user]);

  useEffect(() => {
    const total = expensesList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    setMonthlyExpenses(total);
  }, [expensesList]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpenseName || !newExpenseAmount || isNaN(newExpenseAmount)) return;
    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          user_id: user.id,
          name: newExpenseName,
          amount: parseFloat(newExpenseAmount)
        }]);
      if (error) throw error;
      setNewExpenseName('');
      setNewExpenseAmount('');
      fetchExpenses();
    } catch (err) {
      console.error("Error adding expense:", err.message);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchExpenses();
    } catch (err) {
      console.error("Error deleting expense:", err.message);
    }
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    if (!newCreditor || !newAmount || isNaN(newAmount)) return;
    try {
      const { error } = await supabase
        .from('debts')
        .insert([{
          user_id: user.id,
          creditor: newCreditor,
          amount: parseFloat(newAmount),
          paid_amount: 0,
          priority: parseInt(newPriority) || (debtsList.length + 1),
          due_date: newDueDate
        }]);
      if (error) throw error;
      setNewCreditor('');
      setNewAmount('');
      setNewPriority(debtsList.length + 2);
      setNewDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      fetchDebts();
    } catch (err) {
      console.error("Error adding debt:", err.message);
    }
  };

  const handlePayDebt = async (debtId, currentPaid, totalAmount) => {
    const payValue = prompt("Cantidad a amortizar (€):");
    if (!payValue || isNaN(payValue)) return;
    
    const newPaid = parseFloat(currentPaid) + parseFloat(payValue);
    if (newPaid > totalAmount) {
      alert("La cantidad amortizada no puede superar la deuda total.");
      return;
    }

    try {
      const { error } = await supabase
        .from('debts')
        .update({ paid_amount: newPaid })
        .eq('id', debtId);
      
      if (error) throw error;
      fetchDebts();
    } catch (err) {
      console.error("Error updating debt payment:", err.message);
    }
  };

  const handleDeleteDebt = async (debtId) => {
    if (!confirm("¿Deseas eliminar esta deudadel registro?")) return;
    try {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', debtId);
      if (error) throw error;
      fetchDebts();
    } catch (err) {
      console.error("Error deleting debt:", err.message);
    }
  };

  const handleDayClick = (dayObj) => {
    if (dayObj.isFuture) return;
    setSelectedJournalDay(dayObj);
    setJournalDayPnl(dayObj.pnl !== 0 ? dayObj.pnl.toString() : '');
    setJournalDayTrades(dayObj.trades > 0 ? dayObj.trades.toString() : '1');
  };

  const handleSaveJournalDay = async () => {
    if (!selectedJournalDay) return;
    const newPnl = parseFloat(journalDayPnl) || 0;
    const newTrades = parseInt(journalDayTrades) || 0;

    let status = 'no_trade';
    if (newPnl > 0) status = 'win';
    else if (newPnl < 0) status = 'loss';

    try {
      const { error } = await supabase
        .from('journal_days')
        .upsert({
          user_id: user.id,
          date: selectedJournalDay.dateStr,
          pnl: newPnl,
          trades: newTrades,
          status: status
        }, { onConflict: 'user_id,date' });
      if (error) throw error;
      setSelectedJournalDay(null);
      fetchJournalDays();
    } catch (err) {
      console.error("Error saving journal day:", err.message);
    }
  };

  const safeTargetInput = parseFloat(targetInput) || 0;
  const safeDaysInput = parseInt(daysInput) || 0;
  const safeDebtInput = parseFloat(totalDebts) || 0;
  const safeMonthlyExpenses = parseFloat(monthlyExpenses) || 0;

  const monthlyTradingIncome = (safeTargetInput * safeDaysInput) * 4.34;
  const monthlyTradingIncomeEur = monthlyTradingIncome * usdToEurRate;
  const netMonthlySavings = monthlyTradingIncomeEur - safeMonthlyExpenses;

  const totalMonthsNeeded = netMonthlySavings > 0 ? (safeDebtInput / netMonthlySavings) : Infinity;

  const getMonthlyIncome = (monthNum) => {
    const base = efeSalary + monthlyTradingIncomeEur;
    const extra = efeExtraMonths.includes(monthNum) ? efeExtraAmount : 0;
    return base + extra;
  };

  const getMonthlyNet = (monthNum) => {
    return getMonthlyIncome(monthNum) - safeMonthlyExpenses;
  };

  const getMonthlyNetEfeOnly = (monthNum) => {
    const base = efeSalary;
    const extra = efeExtraMonths.includes(monthNum) ? efeExtraAmount : 0;
    return base + extra - safeMonthlyExpenses;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setCalcActiveSubTab('journal')}
            className={`btn ${calcActiveSubTab === 'journal' ? 'btn-cyan' : 'btn-outline'}`}
            style={{ padding: '6px 14px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Calendar size={14} />
            Diario & TradeZella (Mayo 2026)
          </button>
          <button
            onClick={() => setCalcActiveSubTab('projections')}
            className={`btn ${calcActiveSubTab === 'projections' ? 'btn-cyan' : 'btn-outline'}`}
            style={{ padding: '6px 14px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <TrendingUp size={14} />
            Plan de Viabilidad
          </button>
          <button
            onClick={() => setCalcActiveSubTab('debts-list')}
            className={`btn ${calcActiveSubTab === 'debts-list' ? 'btn-cyan' : 'btn-outline'}`}
            style={{ padding: '6px 14px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Landmark size={14} />
            Ajustes de Deudas & Gastos
          </button>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Meta Diaria:</span>
            <input 
              type="number" 
              value={targetInput} 
              onChange={(e) => setTargetInput(parseFloat(e.target.value) || 0)}
              className="form-input"
              style={{ width: '80px', height: '28px', padding: '0 8px', fontSize: '0.75rem' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>$</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Frecuencia:</span>
            <select 
              value={daysInput} 
              onChange={(e) => setDaysInput(parseInt(e.target.value))}
              className="form-select"
              style={{ width: '135px', height: '28px', padding: '2px 8px', fontSize: '0.72rem' }}
            >
              <option value="3">3 días (Ma-Ju)</option>
              <option value="4">4 días (Lu-Ju)</option>
              <option value="5">5 días (Lu-Vi)</option>
            </select>
          </div>
        </div>
      </div>

      {calcActiveSubTab === 'journal' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {(() => {
            const winsList = journalDays.filter(d => d.pnl > 0);
            const lossesList = journalDays.filter(d => d.pnl < 0);
            const totalWins = winsList.length;
            const totalLosses = lossesList.length;
            const totalTrades = journalDays.reduce((sum, d) => sum + (d.trades || 0), 0);
            const netPnL = journalDays.reduce((sum, d) => sum + d.pnl, 0);
            
            const winRate = (totalWins + totalLosses) > 0 
              ? ((totalWins / (totalWins + totalLosses)) * 100)
              : 0;
              
            const grossProfits = winsList.reduce((sum, d) => sum + d.pnl, 0);
            const grossLosses = Math.abs(lossesList.reduce((sum, d) => sum + d.pnl, 0));
            const profitFactor = grossLosses > 0 
              ? (grossProfits / grossLosses)
              : grossProfits > 0 ? Infinity : 0;

            const avgWin = totalWins > 0 ? grossProfits / totalWins : 0;
            const avgLoss = totalLosses > 0 ? grossLosses / totalLosses : 0;

            let bestDay = { date: '', pnl: 0 };
            let worstDay = { date: '', pnl: 0 };
            journalDays.forEach(d => {
              if (d.pnl > bestDay.pnl) bestDay = { date: d.date, pnl: d.pnl };
              if (d.pnl < worstDay.pnl) worstDay = { date: d.date, pnl: d.pnl };
            });

            const sortedDays = [...journalDays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            let maxWinStreak = 0;
            let maxLossStreak = 0;
            let currentWinStreak = 0;
            let currentLossStreak = 0;
            let activeWinStreak = 0;
            let activeLossStreak = 0;

            sortedDays.forEach(d => {
              if (d.pnl > 0) {
                activeWinStreak++;
                activeLossStreak = 0;
                if (activeWinStreak > maxWinStreak) maxWinStreak = activeWinStreak;
              } else if (d.pnl < 0) {
                activeLossStreak++;
                activeWinStreak = 0;
                if (activeLossStreak > maxLossStreak) maxLossStreak = activeLossStreak;
              } else {
                activeWinStreak = 0;
                activeLossStreak = 0;
              }
            });

            if (sortedDays.length > 0) {
              let i = sortedDays.length - 1;
              if (sortedDays[i].pnl > 0) {
                while (i >= 0 && sortedDays[i].pnl > 0) {
                  currentWinStreak++;
                  i--;
                }
              } else if (sortedDays[i].pnl < 0) {
                while (i >= 0 && sortedDays[i].pnl < 0) {
                  currentLossStreak++;
                  i--;
                }
              }
            }

            const radius = 40;
            const circ = 2 * Math.PI * radius;
            const winStroke = (winRate / 100) * circ;

            return (
              <div className="glass-panel" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '24px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', borderRight: '1px solid var(--border)', paddingRight: '20px' }}>
                  <div style={{ position: 'relative', width: '110px', height: '110px', flexShrink: 0 }}>
                    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                      <circle cx="50" cy="50" r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                      {(totalWins + totalLosses) > 0 && (
                        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#f43f5e" strokeWidth="10" strokeDasharray={`${circ}`} strokeDashoffset={0} />
                      )}
                      {totalWins > 0 && (
                        <circle cx="50" cy="50" r={radius} fill="transparent" stroke="#10b981" strokeWidth="10" strokeDasharray={`${winStroke} ${circ}`} strokeDashoffset={0} />
                      )}
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', lineHeight: 1 }}>{winRate.toFixed(0)}%</span>
                      <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '2px', letterSpacing: '0.5px' }}>Win Rate</span>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Operaciones Totales</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>{totalTrades} trades</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}><strong>{totalWins}</strong> Ganadores</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#f43f5e', borderRadius: '50%' }}></span>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}><strong>{totalLosses}</strong> Perdedores</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Resultado Neto (PnL USD)</span>
                    <strong style={{ fontSize: '1.25rem', color: netPnL >= 0 ? '#10b981' : '#f43f5e' }}>
                      {netPnL >= 0 ? `+$${netPnL.toLocaleString()}` : `-$${Math.abs(netPnL).toLocaleString()}`}
                    </strong>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
                      Aprox: {(netPnL * usdToEurRate).toFixed(0)} € netos
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block' }}>Factor de Beneficio (PF)</span>
                    <strong style={{ fontSize: '1.25rem', color: profitFactor === Infinity || profitFactor >= 1.5 ? '#10b981' : '#f43f5e' }}>
                      {profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}
                    </strong>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', display: 'block', marginTop: '1px' }}>
                      {profitFactor >= 1.5 ? '🏆 Consistencia Elite' : profitFactor >= 1 ? '⚖️ Estable' : '⚠️ En Riesgo'}
                    </span>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>Avg Win: <strong style={{ color: '#10b981' }}>+${avgWin.toFixed(0)}</strong></span>
                      <span>Avg Loss: <strong style={{ color: '#f43f5e' }}>-${avgLoss.toFixed(0)}</strong></span>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', display: 'flex', overflow: 'hidden' }}>
                      {avgWin + avgLoss > 0 ? (
                        <>
                          <div style={{ width: `${(avgWin / (avgWin + avgLoss)) * 100}%`, background: '#10b981', borderRadius: '4px 0 0 4px' }}></div>
                          <div style={{ width: `${(avgLoss / (avgWin + avgLoss)) * 100}%`, background: '#f43f5e', borderRadius: '0 4px 4px 0' }}></div>
                        </>
                      ) : (
                        <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)' }}></div>
                      )}
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Rachas de Días Operativos</span>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.72rem', fontWeight: 'bold' }}>
                      <span style={{ color: '#10b981' }}>🟢 {currentWinStreak}d / {maxWinStreak}d</span>
                      <span style={{ color: '#f43f5e' }}>🔴 {currentLossStreak}d / {maxLossStreak}d</span>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', fontSize: '0.62rem' }}>
                    <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Extremos del Mes</span>
                    <div>
                      <div style={{ color: '#10b981', fontWeight: 600 }}>Mejor: +${bestDay.pnl.toFixed(0)} ({bestDay.date ? parseInt(bestDay.date.split('-')[2]) : '—'} de mayo)</div>
                      <div style={{ color: '#f43f5e', fontWeight: 600 }}>Peor: -${Math.abs(worstDay.pnl).toFixed(0)} ({worstDay.date ? parseInt(worstDay.date.split('-')[2]) : '—'} de mayo)</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid-2" style={{ gap: '20px', alignItems: 'stretch' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '20px', flexGrow: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0 }}>Diario Operativo Mayo 2026</h3>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Clic para Registrar PnL</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.65rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  <div>LU</div><div>MA</div><div>MI</div><div>JU</div><div>VI</div><div>SA</div><div>DO</div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' }}>
                  {(() => {
                    const totalDays = 31;
                    const startOffset = 4; // Mayo 2026 empieza en viernes
                    const cells = [];

                    for (let i = 0; i < startOffset; i++) {
                      cells.push({ type: 'empty', key: `empty-${i}` });
                    }

                    for (let day = 1; day <= totalDays; day++) {
                      const dateStr = `2026-05-${day.toString().padStart(2, '0')}`;
                      const dayOfWeek = getDayOfWeek(day);
                      const isFuture = day > 25;
                      const realDay = journalDays.find(d => d.date === dateStr);
                      let pnl = 0, trades = 0, status = 'no_trade';
                      if (realDay) { pnl = realDay.pnl; trades = realDay.trades; status = realDay.status; }
                      else if (isFuture && isTradingDay(dayOfWeek, safeDaysInput)) {
                        pnl = safeTargetInput; trades = 1; status = 'projected';
                      }
                      cells.push({ type: 'day', day, dateStr, pnl, trades, status, isFuture, key: `day-${day}` });
                    }

                    const dayCells = cells.filter(c => c.type === 'day');
                    const maxAbsPnl = Math.max(...dayCells.map(c => Math.abs(c.pnl)), 1);

                    return cells.map((cell) => {
                      if (cell.type === 'empty') {
                        return <div key={cell.key} style={{ background: 'rgba(0,0,0,0.12)', borderRadius: 'var(--radius-sm)', minHeight: '82px' }} />;
                      }

                      const isToday = cell.dateStr === '2026-05-25';
                      const barHeightPct = cell.pnl !== 0 ? Math.max(12, (Math.abs(cell.pnl) / maxAbsPnl) * 100) : 0;
                      let barColor = 'transparent';
                      let barBg = 'transparent';
                      let textColor = 'var(--text-secondary)';
                      let pnlText = '';
                      let cellBg = 'rgba(255,255,255,0.015)';
                      let border = '1px solid rgba(255,255,255,0.06)';

                      if (cell.status === 'win') {
                        barColor = '#10b981'; barBg = 'rgba(16,185,129,0.25)'; textColor = '#10b981';
                        pnlText = `+$${cell.pnl}`; cellBg = 'rgba(16,185,129,0.05)';
                        border = '1px solid rgba(16,185,129,0.15)';
                      } else if (cell.status === 'loss') {
                        barColor = '#f43f5e'; barBg = 'rgba(244,63,94,0.25)'; textColor = '#f43f5e';
                        pnlText = `-$${Math.abs(cell.pnl)}`; cellBg = 'rgba(244,63,94,0.05)';
                        border = '1px solid rgba(244,63,94,0.15)';
                      } else if (cell.status === 'projected') {
                        barColor = '#06b6d4'; barBg = 'rgba(6,182,212,0.12)'; textColor = '#06b6d4';
                        pnlText = `+$${cell.pnl}`; cellBg = 'rgba(6,182,212,0.02)';
                        border = '1px dashed rgba(6,182,212,0.15)';
                      } else {
                        pnlText = '—';
                      }

                      if (isToday) {
                        border = '2px solid #06b6d4';
                        cellBg = 'rgba(6,182,212,0.08)';
                      }

                      return (
                        <div
                          key={cell.key}
                          onClick={() => handleDayClick(cell)}
                          style={{
                            background: cellBg, border, borderRadius: '8px',
                            padding: '6px 4px 5px 4px', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'flex-start',
                            cursor: cell.isFuture ? 'default' : 'pointer',
                            minHeight: '82px', transition: 'all 0.2s ease', position: 'relative',
                            gap: '2px'
                          }}
                          className="calendar-day-cell"
                        >
                          <span style={{ fontSize: '0.68rem', fontWeight: isToday ? 800 : 600, color: isToday ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>
                            {cell.day}
                            {isToday && <span style={{ color: '#06b6d4', fontSize: '0.55rem', marginLeft: '2px' }}>●</span>}
                          </span>

                          <div style={{ width: '70%', flexGrow: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '2px 0', minHeight: '28px' }}>
                            {cell.pnl !== 0 ? (
                              <div style={{
                                width: '100%', height: `${barHeightPct}%`, minHeight: '6px',
                                background: `linear-gradient(to top, ${barColor}, ${barBg})`,
                                borderRadius: '3px 3px 1px 1px',
                                opacity: cell.status === 'projected' ? 0.4 : 1
                              }} />
                            ) : (
                              <div style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.05)', borderRadius: '1px' }} />
                            )}
                          </div>

                          <span style={{ fontSize: '0.62rem', fontWeight: 700, color: textColor, lineHeight: 1, whiteSpace: 'nowrap' }}>
                            {pnlText}
                          </span>

                          {cell.trades > 0 && (
                            <span style={{ fontSize: '0.48rem', color: 'rgba(255,255,255,0.3)' }}>{cell.trades}t</span>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                <div style={{ marginTop: '12px', fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', gap: '16px', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '14px', height: '10px', background: '#10b981', borderRadius: '2px' }} /> Ganancia real
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '14px', height: '10px', background: '#f43f5e', borderRadius: '2px' }} /> Pérdida real
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: '14px', height: '10px', background: '#06b6d4', borderRadius: '2px', opacity: 0.5 }} /> Proyectado
                  </div>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '14px' }}>📊 P&L Semanal — Mayo 2026 (Divergencia)</h3>
                
                {(() => {
                  const getWeeklyPnL = (weekIndex) => {
                    let daysRange = [];
                    if (weekIndex === 1) daysRange = [1, 2, 3];
                    else if (weekIndex === 2) daysRange = [4, 5, 6, 7, 8, 9, 10];
                    else if (weekIndex === 3) daysRange = [11, 12, 13, 14, 15, 16, 17];
                    else if (weekIndex === 4) daysRange = [18, 19, 20, 21, 22, 23, 24];
                    else if (weekIndex === 5) daysRange = [25, 26, 27, 28, 29, 30, 31];

                    let totalPnL = 0;
                    daysRange.forEach(day => {
                      const dateStr = `2026-05-${day.toString().padStart(2, '0')}`;
                      const realDay = journalDays.find(d => d.date === dateStr);
                      if (realDay) {
                        totalPnL += realDay.pnl;
                      } else {
                        const dayOfWeek = getDayOfWeek(day);
                        const isFuture = day > 25;
                        if (isFuture && isTradingDay(dayOfWeek, safeDaysInput)) {
                          totalPnL += safeTargetInput;
                        }
                      }
                    });
                    return totalPnL;
                  };

                  const weeks = [1, 2, 3, 4, 5];
                  const weeklyData = weeks.map(w => ({ weekNum: w, totalPnL: getWeeklyPnL(w) }));
                  const maxWeeklyAbs = Math.max(...weeklyData.map(w => Math.abs(w.totalPnL)), 1);

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {weeklyData.map(({ weekNum, totalPnL }) => {
                        const pct = Math.min(100, (Math.abs(totalPnL) / maxWeeklyAbs) * 100);
                        return (
                          <div key={weekNum} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 1fr', alignItems: 'center', height: '22px' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', height: '12px' }}>
                              {totalPnL < 0 && (
                                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(270deg, #f43f5e, #fb7185)', borderRadius: '4px 0 0 4px' }} />
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ fontSize: '0.62rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>SEM {weekNum}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-start', height: '12px' }}>
                              {totalPnL > 0 && (
                                <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '0 4px 4px 0' }} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px', fontSize: '0.58rem', color: 'var(--text-secondary)' }}>
                        <span>◀ Pérdidas semanales</span>
                        <span style={{ fontWeight: 'bold', color: '#ffffff' }}>Eje central $0</span>
                        <span>Ganancias semanales ▶</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '20px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '4px' }}>Evolución de Equity vs Meta</h3>
                <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '10px', margin: '10px 0' }}>
                  {(() => {
                    const projectedPoints = [{ day: 0, val: startBalance }];
                    let currentProjected = startBalance;
                    for (let d = 1; d <= 31; d++) {
                      const dayOfWeek = getDayOfWeek(d);
                      if (isTradingDay(dayOfWeek, safeDaysInput)) {
                        currentProjected += safeTargetInput;
                      }
                      projectedPoints.push({ day: d, val: currentProjected });
                    }

                    const realPoints = [{ day: 0, val: startBalance }];
                    let currentReal = startBalance;
                    for (let d = 1; d <= 25; d++) {
                      const dateStr = `2026-05-${d.toString().padStart(2, '0')}`;
                      const realDay = journalDays.find(x => x.date === dateStr);
                      if (realDay) currentReal += realDay.pnl;
                      realPoints.push({ day: d, val: currentReal });
                    }

                    const maxVal = Math.max(...projectedPoints.map(p => p.val), ...realPoints.map(p => p.val), 3500);
                    const minVal = Math.min(...projectedPoints.map(p => p.val), ...realPoints.map(p => p.val), 1500);
                    const range = maxVal - minVal || 1;

                    const getX = (d) => 24 + (d / 31) * 356;
                    const getY = (v) => 135 - ((v - minVal) / range) * 115;

                    const projPathStr = projectedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.day)} ${getY(p.val)}`).join(' ');
                    const realPathStr = realPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.day)} ${getY(p.val)}`).join(' ');

                    return (
                      <svg viewBox="0 0 400 150" style={{ width: '100%', height: '120px', overflow: 'visible' }}>
                        <line x1="20" y1="20" x2="380" y2="20" stroke="var(--border)" strokeDasharray="3,3" strokeWidth="0.5"/>
                        <line x1="20" y1="77" x2="380" y2="77" stroke="var(--border)" strokeDasharray="3,3" strokeWidth="0.5"/>
                        <line x1="20" y1="135" x2="380" y2="135" stroke="var(--border)" strokeWidth="0.5"/>
                        <path d={projPathStr} fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3,3" strokeLinecap="round"/>
                        {realPoints.length > 1 && (
                          <path d={realPathStr} fill="none" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round"/>
                        )}
                        <circle cx={getX(0)} cy={getY(startBalance)} r="4" fill="#ffffff" stroke="#000" strokeWidth="1.5"/>
                        <circle cx={getX(25)} cy={getY(currentReal)} r="4" fill="#06b6d4" stroke="#0a0f19" strokeWidth="1"/>
                        <circle cx={getX(31)} cy={getY(currentProjected)} r="4" fill="#10b981" stroke="#0a0f19" strokeWidth="1"/>
                      </svg>
                    );
                  })()}
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '20px', borderTop: '2px solid #06b6d4' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🎯 Simulador de Impacto de Cierre (Scalping)
                </h3>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                  Selecciona una meta para ver el impacto inmediato en el tiempo necesario para liquidar tus {safeDebtInput.toLocaleString('es-ES')} € de deuda.
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  {[300, 400, 500, 600].map(val => (
                    <button
                      key={val}
                      type="button"
                      className={`btn ${targetInput === val ? 'btn-cyan' : 'btn-outline'}`}
                      onClick={() => setTargetInput(val)}
                      style={{ flex: 1, padding: '6px 0', fontSize: '0.78rem', fontWeight: 'bold' }}
                    >
                      ${val}/día
                    </button>
                  ))}
                </div>

                {(() => {
                  const calcMonthsToFreedom = () => {
                    let localDebt = safeDebtInput;
                    let monthsCount = 0;
                    const now = new Date();
                    
                    const avgMonthlyNet = efeSalary + (targetInput * safeDaysInput * 4.34 * usdToEurRate) - safeMonthlyExpenses;
                    if (avgMonthlyNet <= 0 && efeExtraAmount <= 0) return Infinity;

                    while (localDebt > 0 && monthsCount < 240) {
                      monthsCount++;
                      const futureDate = new Date(now.getFullYear(), now.getMonth() + monthsCount, 1);
                      const monthNum = futureDate.getMonth() + 1;
                      const monthlyTradingIncomeEurLocal = (targetInput * safeDaysInput) * 4.34 * usdToEurRate;
                      const isExtra = efeExtraMonths.includes(monthNum);
                      const extraVal = isExtra ? efeExtraAmount : 0;
                      const net = efeSalary + monthlyTradingIncomeEurLocal + extraVal - safeMonthlyExpenses;
                      
                      localDebt = Math.max(0, localDebt - (net > 0 ? net : 0));
                    }
                    return monthsCount;
                  };

                  const monthsToFreedom = calcMonthsToFreedom();
                  const freedomDate = new Date();
                  if (monthsToFreedom !== Infinity) freedomDate.setMonth(freedomDate.getMonth() + monthsToFreedom);

                  const getWalterAdvice = (target) => {
                    if (target <= 300) return "Cerrar a $300 es la meta más sana y segura, Emilio. Elimina la presión de tu amígdala y reduce el riesgo de tilt.";
                    if (target <= 400) return "Tu meta estándar de $400 es el punto de equilibrio óptimo. Permite amortizar la deuda a un ritmo acelerado.";
                    if (target <= 500) return "Aceptar $500 requiere un autocontrol de hierro. Asegura parciales y pon el SL en breakeven de inmediato.";
                    return "¡CUIDADO! Buscar $600 al día activa la prisa y la martingala desesperada. No intentes recuperar todo en una semana.";
                  };

                  const localTradingIncomeEur = (targetInput * safeDaysInput * 4.34) * usdToEurRate;
                  const barPct = monthsToFreedom !== Infinity ? Math.min(100, (monthsToFreedom / 60) * 100) : 100;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block' }}>Ingreso Trading Estimado</span>
                          <strong style={{ fontSize: '1rem', color: '#10b981' }}>{localTradingIncomeEur.toFixed(0)} €/mes</strong>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block' }}>Excedente Neto Total</span>
                          <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{(efeSalary + localTradingIncomeEur - safeMonthlyExpenses).toFixed(0)} €/mes</strong>
                        </div>
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '4px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Tiempo para Libertad Financiera</span>
                          <span style={{ fontWeight: 'bold', color: '#06b6d4' }}>{monthsToFreedom !== Infinity ? `${monthsToFreedom} meses` : 'Inviable'}</span>
                        </div>
                        
                        <div style={{ height: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${barPct}%`, height: '100%', background: monthsToFreedom <= 18 ? '#10b981' : monthsToFreedom <= 36 ? '#eab308' : '#f43f5e', borderRadius: '4px' }} />
                        </div>
                        
                        {monthsToFreedom !== Infinity && (
                          <span style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block', textAlign: 'right' }}>
                            🗓️ Proyección de deuda cero: <strong>{freedomDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</strong>
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '10px', background: 'rgba(6,182,212,0.03)', border: '1px solid rgba(6,182,212,0.1)', borderRadius: '8px', padding: '12px', alignItems: 'flex-start' }}>
                        <Brain size={20} color="var(--color-cyan)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div style={{ fontSize: '0.72rem', lineHeight: 1.4 }}>
                          <strong style={{ color: 'var(--color-cyan)', display: 'block', marginBottom: '2px' }}>Consejo de Walter sobre Meta:</strong>
                          <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{getWalterAdvice(targetInput)}"</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {calcActiveSubTab === 'projections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px', borderTop: '2px solid #06b6d4' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '4px' }}>🎯 Comparador de Escenarios — Impacto de Meta Diaria</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '16px' }}>
              {[300, 400, 500, 600].map(target => {
                const isCurrentTarget = target === safeTargetInput;
                const monthlyUsd = target * safeDaysInput * 4.34;
                const monthlyEur = monthlyUsd * usdToEurRate;
                const totalMonthlyNet = efeSalary + monthlyEur - safeMonthlyExpenses;
                const monthsToFreedom = totalMonthlyNet > 0 ? Math.ceil(safeDebtInput / totalMonthlyNet) : Infinity;
                const incomeBarPct = Math.min(100, ((monthlyEur + efeSalary) / (600 * safeDaysInput * 4.34 * usdToEurRate + efeSalary)) * 100);

                return (
                  <div key={target} style={{
                    background: isCurrentTarget ? 'rgba(6,182,212,0.08)' : 'rgba(255,255,255,0.02)',
                    border: isCurrentTarget ? '2px solid #06b6d4' : '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px', padding: '16px 12px',
                    display: 'flex', flexDirection: 'column', gap: '14px'
                  }}>
                    {isCurrentTarget && (
                      <span style={{ position: 'absolute', top: '-9px', right: '10px', background: '#06b6d4', color: '#0a0f19', fontSize: '0.55rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>Tu Meta</span>
                    )}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: isCurrentTarget ? '#06b6d4' : '#ffffff' }}>${target}</div>
                      <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>por día</div>
                    </div>
                    <div>
                      <div style={{ height: '60px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <div style={{ width: '65%', height: `${incomeBarPct}%`, background: isCurrentTarget ? '#06b6d4' : '#10b981', borderRadius: '4px 4px 0 0' }} />
                      </div>
                      <div style={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: isCurrentTarget ? '#06b6d4' : '#10b981', marginTop: '4px' }}>
                        {(monthlyEur + efeSalary).toFixed(0)} €
                      </div>
                    </div>
                    <div style={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.4)' }}>Liquidar en</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: monthsToFreedom <= 24 ? '#10b981' : '#f43f5e' }}>{monthsToFreedom !== Infinity ? `${monthsToFreedom} meses` : '∞'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '4px' }}>Tabla Anual de Flujo de Caja (Próximos 12 meses)</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginTop: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#0b0f19' }}>
                  <tr style={{ color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Mes</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Salario EFE</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Paga Extra</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Trading</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Gastos</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Neto</th>
                    <th style={{ padding: '8px', textAlign: 'right' }}>Deuda Restante</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const rows = [];
                    const now = new Date();
                    let runningDebt = safeDebtInput;
                    for (let i = 0; i < 12; i++) {
                      const futureDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
                      const monthNum = futureDate.getMonth() + 1;
                      const monthLabel = futureDate.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
                      const isExtra = efeExtraMonths.includes(monthNum);
                      const extraVal = isExtra ? efeExtraAmount : 0;
                      const income = getMonthlyIncome(monthNum);
                      const net = getMonthlyNet(monthNum);
                      runningDebt = Math.max(0, runningDebt - (net > 0 ? net : 0));

                      rows.push(
                        <tr key={i} style={{ background: isExtra ? 'rgba(16, 185, 129, 0.04)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>{efeSalary} €</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: isExtra ? '#10b981' : 'var(--text-secondary)' }}>{isExtra ? `+${extraVal} €` : '—'}</td>
                          <td style={{ padding: '8px', textAlign: 'right' }}>{monthlyTradingIncomeEur.toFixed(0)} €</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>{income.toFixed(0)} €</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: '#f43f5e' }}>-{safeMonthlyExpenses.toFixed(0)} €</td>
                          <td style={{ padding: '8px', textAlign: 'right', color: net >= 0 ? '#10b981' : '#f43f5e', fontWeight: 700 }}>{net.toFixed(0)} €</td>
                          <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>{runningDebt.toFixed(0)} €</td>
                        </tr>
                      );
                    }
                    return rows;
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {calcActiveSubTab === 'debts-list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '14px' }}>Registro de Deudas</h3>
            <form onSubmit={handleAddDebt} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input type="text" className="form-input" placeholder="Acreedor (ej. Sabadell)" value={newCreditor} onChange={(e) => setNewCreditor(e.target.value)} required style={{ flex: 2 }} />
              <input type="number" className="form-input" placeholder="Deuda (€)" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} required style={{ flex: 1 }} />
              <input type="number" className="form-input" placeholder="Prio" min="1" value={newPriority} onChange={(e) => setNewPriority(parseInt(e.target.value) || 1)} required style={{ width: '60px' }} />
              <input type="date" className="form-input" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} required style={{ width: '130px' }} />
              <button type="submit" className="btn btn-rose">Agregar</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {debtsList.map(d => {
                const pending = d.amount - d.paid_amount;
                return (
                  <div key={d.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: '#ffffff' }}>{d.creditor}</strong>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>Prioridad: {d.priority} | Vence: {formatSafeDate(d.due_date)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '0.75rem' }}>Pendiente: <strong style={{ color: 'var(--color-rose)' }}>{pending} €</strong></span>
                      <button className="btn btn-outline" onClick={() => handlePayDebt(d.id, d.paid_amount, d.amount)} style={{ padding: '2px 8px', fontSize: '0.65rem', height: '24px' }}>Abonar</button>
                      <button className="btn btn-outline" onClick={() => handleDeleteDebt(d.id)} style={{ padding: '2px 8px', fontSize: '0.65rem', height: '24px', color: 'var(--color-rose)' }}>Eliminar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '14px' }}>Gastos Fijos Mensuales</h3>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input type="text" className="form-input" placeholder="Gasto (ej. Lola Colegio)" value={newExpenseName} onChange={(e) => setNewExpenseName(e.target.value)} required style={{ flex: 2 }} />
              <input type="number" className="form-input" placeholder="Monto (€)" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} required style={{ flex: 1 }} />
              <button type="submit" className="btn btn-cyan">Agregar</button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {expensesList.map(item => (
                <div key={item.id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, color: '#ffffff' }}>{item.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ color: 'var(--color-rose)' }}>{item.amount} €</strong>
                    <button className="btn btn-outline" onClick={() => handleDeleteExpense(item.id)} style={{ padding: '2px 6px', fontSize: '0.65rem', height: '22px' }}>Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedJournalDay && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 8, 16, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel" style={{ width: '380px', padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(8, 13, 28, 0.98))' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Registrar Jornada — {selectedJournalDay.day} de mayo</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              <input type="number" className="form-input" value={journalDayPnl} onChange={(e) => setJournalDayPnl(e.target.value)} placeholder="PnL USD (ej: 400 o -150)" style={{ width: '100%', height: '36px' }} />
              <input type="number" min="0" className="form-input" value={journalDayTrades} onChange={(e) => setJournalDayTrades(e.target.value)} placeholder="Trades (ej: 1)" style={{ width: '100%', height: '36px' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button className="btn btn-outline" onClick={() => setSelectedJournalDay(null)} style={{ flex: 1 }}>Cancelar</button>
              <button className="btn btn-cyan" onClick={handleSaveJournalDay} style={{ flex: 1 }}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
