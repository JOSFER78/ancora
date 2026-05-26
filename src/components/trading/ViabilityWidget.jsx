import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Calendar, 
  TrendingUp, 
  Landmark, 
  Plus, 
  Trash2, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  PieChart, 
  AlertTriangle,
  RefreshCw,
  Heart
} from 'lucide-react';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const getExpenseIcon = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('colegio') || lower.includes('escuela') || lower.includes('clase')) return '🎒';
  if (lower.includes('extraescolar')) return '🎨';
  if (lower.includes('deuda') || lower.includes('soluciona') || lower.includes('banco') || lower.includes('prestamo')) return '💸';
  if (lower.includes('susana')) return '👩';
  if (lower.includes('cuca')) return '👧';
  if (lower.includes('gastos propios') || lower.includes('propio') || lower.includes('personal') || lower.includes('bolsillo')) return '👤';
  if (lower.includes('alquiler') || lower.includes('hipoteca') || lower.includes('piso') || lower.includes('casa')) return '🏠';
  if (lower.includes('luz') || lower.includes('electricidad')) return '⚡';
  if (lower.includes('agua')) return '💧';
  if (lower.includes('internet') || lower.includes('fibra') || lower.includes('wifi') || lower.includes('telefono') || lower.includes('movil')) return '🌐';
  if (lower.includes('seguro') || lower.includes('adeslas') || lower.includes('salud') || lower.includes('mutua')) return '🛡️';
  if (lower.includes('super') || lower.includes('comida') || lower.includes('compra') || lower.includes('mercadona') || lower.includes('carrefour')) return '🛒';
  if (lower.includes('coche') || lower.includes('moto') || lower.includes('gasolina') || lower.includes('gasoil') || lower.includes('peaje')) return '🚗';
  if (lower.includes('gym') || lower.includes('gimnasio') || lower.includes('deporte') || lower.includes('crossfit')) return '💪';
  if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('ocio') || lower.includes('suscripcion')) return '🎬';
  return '💰';
};

export default function ViabilityWidget({ user, totalDebts, onDebtsUpdated, targetInput, setTargetInput, daysInput, setDaysInput }) {
  // Estado de navegación temporal y vista
  const [currentMonth, setCurrentMonth] = useState(4); // Mayo (index 4) por defecto
  const [currentYear, setCurrentYear] = useState(2026);
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'year'
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'forecast' | 'settings'

  // Datos financieros y de configuración
  const [efeSalary, setEfeSalary] = useState(() => {
    const saved = localStorage.getItem('efe_salary');
    return saved ? parseFloat(saved) : 2800;
  });
  const [efeExtraAmount, setEfeExtraAmount] = useState(() => {
    const saved = localStorage.getItem('efe_extra_amount');
    return saved ? parseFloat(saved) : 2800;
  });
  const efeExtraMonths = [2, 6, 12];
  
  const [monthlyExpenses, setMonthlyExpenses] = useState(1500);
  const [expensesList, setExpensesList] = useState([]);
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  // Capital de trading (BingX o manual)
  const [startBalance, setStartBalance] = useState(() => {
    const saved = localStorage.getItem('start_balance');
    return saved ? parseFloat(saved) : 2400;
  });
  const [liveBalanceLoading, setLiveBalanceLoading] = useState(false);

  // Deudas
  const [debtsList, setDebtsList] = useState([]);
  const [newCreditor, setNewCreditor] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPriority, setNewPriority] = useState(1);

  // Historial de Amortizaciones
  const [debtPaymentsList, setDebtPaymentsList] = useState([]);
  const [expandedHistories, setExpandedHistories] = useState({});

  // Edición Inline de Prioridad
  const [editingDebtPriorityId, setEditingDebtPriorityId] = useState(null);
  const [tempPriorityValue, setTempPriorityValue] = useState(1);

  // Formulario de Amortización Premium
  const [amortizingDebtId, setAmortizingDebtId] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Parámetros de simulación de previsión
  const [simDailyTarget, setSimDailyTarget] = useState(400);
  const [simDaysPerWeek, setSimDaysPerWeek] = useState(3);
  const [simIncludeTrading, setSimIncludeTrading] = useState(true);
  const [simWinRate, setSimWinRate] = useState(70);

  // Diario operativo
  const [journalDays, setJournalDays] = useState([]);
  const [selectedJournalDay, setSelectedJournalDay] = useState(null);
  const [journalDayPnl, setJournalDayPnl] = useState('');
  const [journalDayTrades, setJournalDayTrades] = useState('');
  const [journalDayRisk, setJournalDayRisk] = useState('');

  const usdToEurRate = 0.92;

  // Consulta de gastos desde Supabase
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

  // Consulta de diario desde Supabase
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
        status: d.status,
        risk: d.risk !== null && d.risk !== undefined ? parseFloat(d.risk) : null
      }));
      setJournalDays(list);
    } catch (err) {
      console.error("Error fetching journal days:", err.message);
    }
  };

  // Consulta de historial de pagos (amortizaciones)
  const fetchDebtPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('debt_payments')
        .select('*')
        .order('payment_date', { ascending: false });
      if (error) throw error;
      setDebtPaymentsList(data || []);
    } catch (err) {
      console.error("Error fetching debt payments:", err.message);
    }
  };

  // Consulta de deudas desde Supabase
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

  const fetchLiveBalance = async () => {
    try {
      setLiveBalanceLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('https://ysnorelkaccaikvuqgnv.supabase.co/functions/v1/chat-terapeuta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ action: 'get_bingx_data' })
      });

      if (!response.ok) throw new Error("API error");
      const resData = await response.json();
      if (resData && resData.balance) {
        const liveVal = parseFloat(resData.balance.equity || resData.balance.balance || 0);
        if (liveVal > 0) {
          setStartBalance(liveVal);
        }
      }
    } catch (err) {
      console.error("Error fetching live balance in ViabilityWidget:", err.message);
    } finally {
      setLiveBalanceLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('efe_salary', efeSalary.toString());
  }, [efeSalary]);

  useEffect(() => {
    localStorage.setItem('efe_extra_amount', efeExtraAmount.toString());
  }, [efeExtraAmount]);

  useEffect(() => {
    localStorage.setItem('start_balance', startBalance.toString());
  }, [startBalance]);

  useEffect(() => {
    if (user) {
      fetchDebts();
      fetchExpenses();
      fetchJournalDays();
      fetchLiveBalance();
      fetchDebtPayments();
    }
  }, [user]);

  // Listener para sincronización externa (ej. desde BingX Widget)
  useEffect(() => {
    const handleSync = () => {
      fetchJournalDays();
      fetchLiveBalance();
    };
    window.addEventListener('sync_journal_days', handleSync);
    return () => window.removeEventListener('sync_journal_days', handleSync);
  }, []);

  useEffect(() => {
    const total = expensesList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    setMonthlyExpenses(total);
  }, [expensesList]);

  // Manejo de inserciones y borrados de gastos
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

  // Manejo de deudas
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
          priority: parseInt(newPriority) || (debtsList.length + 1)
        }]);
      if (error) throw error;
      setNewCreditor('');
      setNewAmount('');
      setNewPriority(debtsList.length + 2);
      fetchDebts();
    } catch (err) {
      console.error("Error adding debt:", err.message);
    }
  };

  const submitAmortization = async (debtId, currentPaid, totalAmount) => {
    const amountVal = parseFloat(payAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Por favor, introduce una cantidad válida.");
      return;
    }
    const newPaid = parseFloat(currentPaid) + amountVal;
    if (newPaid > totalAmount) {
      alert("La cantidad amortizada no puede superar la deuda total.");
      return;
    }

    try {
      // 1. Registrar pago
      const { error: paymentError } = await supabase
        .from('debt_payments')
        .insert([{
          debt_id: debtId,
          user_id: user.id,
          amount: amountVal,
          payment_date: payDate
        }]);
      if (paymentError) throw paymentError;

      // 2. Incrementar amortización en la deuda
      const { error: debtError } = await supabase
        .from('debts')
        .update({ paid_amount: newPaid })
        .eq('id', debtId);
      if (debtError) throw debtError;

      // Resetear
      setAmortizingDebtId(null);
      setPayAmount('');
      fetchDebts();
      fetchDebtPayments();
    } catch (err) {
      console.error("Error submitting amortization:", err.message);
      alert("Error al registrar amortización: " + err.message);
    }
  };

  const savePriority = async (debtId) => {
    try {
      const { error } = await supabase
        .from('debts')
        .update({ priority: tempPriorityValue })
        .eq('id', debtId);
      if (error) throw error;
      setEditingDebtPriorityId(null);
      fetchDebts();
    } catch (err) {
      console.error("Error saving debt priority:", err.message);
    }
  };

  const toggleHistory = (debtId) => {
    setExpandedHistories(prev => ({
      ...prev,
      [debtId]: !prev[debtId]
    }));
  };

  const handleDeleteDebt = async (debtId) => {
    if (!confirm("¿Deseas eliminar esta deuda?")) return;
    try {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', debtId);
      if (error) throw error;
      fetchDebts();
      fetchDebtPayments();
    } catch (err) {
      console.error("Error deleting debt:", err.message);
    }
  };

  const handleDayClick = (dayObj) => {
    setSelectedJournalDay(dayObj);
    setJournalDayPnl(dayObj.pnl !== 0 ? dayObj.pnl.toString() : '');
    setJournalDayTrades(dayObj.trades > 0 ? dayObj.trades.toString() : '1');
    setJournalDayRisk(dayObj.risk !== undefined && dayObj.risk !== null && dayObj.isManualRisk ? dayObj.risk.toString() : '');
  };

  const handleSaveJournalDay = async () => {
    if (!selectedJournalDay) return;
    const newPnl = parseFloat(journalDayPnl) || 0;
    const newTrades = parseInt(journalDayTrades) || 0;
    const newRisk = journalDayRisk.trim() !== '' ? parseFloat(journalDayRisk) : null;

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
          status: status,
          risk: newRisk
        }, { onConflict: 'user_id,date' });
      if (error) throw error;
      setSelectedJournalDay(null);
      fetchJournalDays();
    } catch (err) {
      console.error("Error saving journal day:", err.message);
    }
  };

  // --- LÓGICA DE CÁLCULO DINÁMICO DE FECHAS & MEDIAS ---

  // Obtener la media de P&L de trading real de las sesiones operadas registradas (en USD)
  const getAveragePnl = () => {
    const realSessions = journalDays.filter(d => d.trades > 0);
    if (realSessions.length === 0) return 0;
    const totalPnl = realSessions.reduce((sum, d) => sum + d.pnl, 0);
    return totalPnl / realSessions.length;
  };

  const averageTradingPnl = getAveragePnl(); // media en USD por sesión

  // Navegar entre meses
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Comprobar si un día de la semana es día operativo programado
  const isPlannedTradingDay = (dayOfWeek) => {
    const dVal = parseInt(daysInput) || 5;
    if (dVal === 3) return dayOfWeek >= 1 && dayOfWeek <= 3; // MA-JU (Martes=1, Miércoles=2, Jueves=3)
    if (dVal === 4) return dayOfWeek >= 0 && dayOfWeek <= 3; // LU-JU (Lunes=0, Martes=1, Miércoles=2, Jueves=3)
    return dayOfWeek >= 0 && dayOfWeek <= 4; // LU-VI (Lunes=0...Viernes=4)
  };

  const getEquityOnDate = (targetDateStr) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    if (targetDateStr === todayStr) return startBalance;

    const targetDate = new Date(targetDateStr);
    const todayDate = new Date(todayStr);

    let totalDiff = 0; // in USD

    if (targetDate < todayDate) {
      // Past: sum from targetDate (inclusive) to today (inclusive)
      let tempDate = new Date(targetDate);

      while (tempDate <= todayDate) {
        const y = tempDate.getFullYear();
        const m = tempDate.getMonth();
        const d = tempDate.getDate();
        const curDateStr = `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

        const dayOfWeek = tempDate.getDay() === 0 ? 6 : tempDate.getDay() - 1;
        const dailyEfeSalary = efeSalary / 30;
        const dailyExpense = monthlyExpenses / 30;

        let efeIncome = dailyEfeSalary;
        if (efeExtraMonths.includes(m + 1)) {
          efeIncome += efeExtraAmount / 30;
        }
        let fixedExpense = dailyExpense;
        const dailyDeptsPaid = debtPaymentsList
          .filter(p => p.payment_date === curDateStr)
          .reduce((sum, p) => sum + parseFloat(p.amount), 0);

        const realDay = journalDays.find(x => x.date === curDateStr);
        let tPnl = realDay ? realDay.pnl : 0;
        const tPnlEur = tPnl * usdToEurRate;
        const dailySobrante = tPnlEur + efeIncome - fixedExpense - dailyDeptsPaid;
        const dailySobranteUsd = dailySobrante / usdToEurRate;

        totalDiff += tPnl + dailySobranteUsd;

        tempDate.setDate(tempDate.getDate() + 1);
      }
      return startBalance - totalDiff;
    } else {
      // Future: sum from today + 1 (inclusive) to targetDate (inclusive)
      let tempDate = new Date(todayDate);
      tempDate.setDate(tempDate.getDate() + 1);

      while (tempDate <= targetDate) {
        const y = tempDate.getFullYear();
        const m = tempDate.getMonth();
        const d = tempDate.getDate();
        const curDateStr = `${y}-${(m + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;

        const dayOfWeek = tempDate.getDay() === 0 ? 6 : tempDate.getDay() - 1;
        const dailyEfeSalary = efeSalary / 30;
        const dailyExpense = monthlyExpenses / 30;

        let efeIncome = dailyEfeSalary;
        if (efeExtraMonths.includes(m + 1)) {
          efeIncome += efeExtraAmount / 30;
        }
        let fixedExpense = dailyExpense;
        const dailyDeptsPaid = debtPaymentsList
          .filter(p => p.payment_date === curDateStr)
          .reduce((sum, p) => sum + parseFloat(p.amount), 0);

        const realDay = journalDays.find(x => x.date === curDateStr);
        let tPnl = 0;
        if (realDay) {
          tPnl = realDay.pnl;
        } else if (isPlannedTradingDay(dayOfWeek)) {
          tPnl = averageTradingPnl;
        }

        const tPnlEur = tPnl * usdToEurRate;
        const dailySobrante = tPnlEur + efeIncome - fixedExpense - dailyDeptsPaid;
        const dailySobranteUsd = dailySobrante / usdToEurRate;

        totalDiff += tPnl + dailySobranteUsd;

        tempDate.setDate(tempDate.getDate() + 1);
      }
      return startBalance + totalDiff;
    }
  };

  // Generar datos diarios del mes seleccionado
  const generateMonthData = (month, year) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Obtener offset del primer día (Lunes = 0, Domingo = 6)
    let firstDayIndex = new Date(year, month, 1).getDay();
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    // Prorrateo diario de nómina de EFE y gastos fijos
    const dailyEfeSalary = efeSalary / 30; // en EUR
    const dailyExpense = monthlyExpenses / 30; // en EUR

    // Saldo acumulado
    const firstDayDateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
    let runningEquity = getEquityOnDate(firstDayDateStr);
    const resultDays = [];

    // Hoy en fecha real local de Emilio (CET/CEST)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const cellDate = new Date(dateStr);
      const dayOfWeek = cellDate.getDay() === 0 ? 6 : cellDate.getDay() - 1; // Lunes = 0

      const isFuture = cellDate > today;
      const isToday = dateStr === todayStr;

      // 1. Ingreso de nómina prorrateada (EFE) + paga extra
      let efeIncome = dailyEfeSalary;
      const isExtraMonth = efeExtraMonths.includes(month + 1);
      if (isExtraMonth) {
        efeIncome += efeExtraAmount / 30;
      }

      // 2. Gastos fijos prorrateados del día
      let fixedExpense = dailyExpense;

      // 3. Deudas amortizadas reales registradas en este día concreto (desde el historial de pagos)
      const dailyDeptsPaid = debtPaymentsList
        .filter(p => p.payment_date === dateStr)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      // 4. PnL de Trading (real o proyectado)
      const realDay = journalDays.find(x => x.date === dateStr);
      let tPnl = 0; // en USD
      let tradesCount = 0;
      let isProjected = false;
      let isManualRisk = false;
      let manualRisk = null;

      if (realDay) {
        tPnl = realDay.pnl;
        tradesCount = realDay.trades;
        isManualRisk = realDay.risk !== null && realDay.risk !== undefined;
        manualRisk = isManualRisk ? realDay.risk : null;
      } else if (isFuture && isPlannedTradingDay(dayOfWeek)) {
        isProjected = true;
        tradesCount = 1;
        tPnl = averageTradingPnl; // strictly project using the true average (which is 0 if no traded days exist)
      }

      const tPnlEur = tPnl * usdToEurRate;

      // 5. Calcular Sobrante Neto diario (Ingresos - Gastos)
      const dailySobrante = tPnlEur + efeIncome - fixedExpense - dailyDeptsPaid;

      // 6. Riesgo permitido por día (Límite de pérdida del 1.5% de la Equity, o manual)
      const allowedDailyRisk = isManualRisk && manualRisk !== null ? manualRisk : Math.abs(runningEquity * 0.015);

      // Actualizar la Equity acumulada diaria
      const dailySobranteUsd = dailySobrante / usdToEurRate;
      runningEquity += tPnl + dailySobranteUsd;

      resultDays.push({
        day,
        dateStr,
        dayOfWeek,
        isFuture,
        isToday,
        pnl: tPnl,
        pnlEur: tPnlEur,
        trades: tradesCount,
        isProjected,
        efeIncome,
        fixedExpense,
        debtsPaid: dailyDeptsPaid,
        sobrante: dailySobrante,
        equity: runningEquity,
        risk: allowedDailyRisk,
        isManualRisk,
        riskValue: manualRisk
      });
    }

    return { days: resultDays, offset: firstDayIndex };
  };

  const { days: calendarDays, offset: firstDayOffset } = generateMonthData(currentMonth, currentYear);

  // Generar datos anuales para la vista consolidada de 12 meses
  const generateYearData = (year) => {
    return MONTH_NAMES.map((name, idx) => {
      const { days } = generateMonthData(idx, year);
      
      const totalTradingPnl = days.reduce((sum, d) => sum + (d.isProjected ? 0 : d.pnl), 0);
      const projectedTradingPnl = days.reduce((sum, d) => sum + (d.isProjected ? d.pnl : 0), 0);
      
      const totalSobranteReal = days.reduce((sum, d) => sum + (d.isFuture ? 0 : d.sobrante), 0);
      const totalSobranteProjected = days.reduce((sum, d) => sum + (d.isFuture ? d.sobrante : 0), 0);
      
      const totalDebtsPaid = days.reduce((sum, d) => sum + d.debtsPaid, 0);

      const totalIngresos = days.reduce((sum, d) => sum + d.efeIncome + (d.pnlEur > 0 ? d.pnlEur : 0), 0);
      const totalGastos = days.reduce((sum, d) => sum + d.fixedExpense + d.debtsPaid + (d.pnlEur < 0 ? Math.abs(d.pnlEur) : 0), 0);

      // Calcular tasa de acierto (win rate) del mes
      const tradedDays = days.filter(d => !d.isProjected && d.trades > 0 && d.pnl !== 0);
      const winningDays = tradedDays.filter(d => d.pnl > 0);
      const winRate = tradedDays.length > 0 ? (winningDays.length / tradedDays.length) * 100 : 0;

      return {
        monthIndex: idx,
        name,
        tradingPnl: totalTradingPnl,
        projectedPnl: projectedTradingPnl,
        sobrante: totalSobranteReal,
        projectedSobrante: totalSobranteProjected,
        debtsPaid: totalDebtsPaid,
        ingresos: totalIngresos,
        gastos: totalGastos,
        winRate: winRate.toFixed(0),
        tradedDaysCount: tradedDays.length
      };
    });
  };
  const runForecastSimulation = () => {
    const activeDebts = debtsList
      .map(d => ({
        id: d.id,
        creditor: d.creditor,
        remaining: parseFloat(d.amount) - parseFloat(d.paid_amount),
        amount: parseFloat(d.amount),
        priority: parseInt(d.priority) || 99
      }))
      .filter(d => d.remaining > 0)
      .sort((a, b) => a.priority - b.priority);

    const totalInitialDebt = activeDebts.reduce((sum, d) => sum + d.remaining, 0);

    const results = [];
    let tempDebts = activeDebts.map(d => ({ ...d }));
    let currentTotalDebt = totalInitialDebt;

    // Fecha de inicio de simulación: Mayo 2026
    let simMonth = 4; // Mayo (index 4)
    let simYear = 2026;

    const simMonthlyTradingPnl = simIncludeTrading ? (parseFloat(simDailyTarget) * parseFloat(simDaysPerWeek) * 4.33 * usdToEurRate) : 0;
    const simMonthlyIncome = efeSalary + simMonthlyTradingPnl;
    const simMonthlyExpenses = monthlyExpenses;

    let monthsCount = 0;
    let debtZeroMonth = null;
    let debtZeroYear = null;

    while (currentTotalDebt > 0 && monthsCount < 36) {
      // 1. Calcular excedente de este mes
      let monthlyCaja = simMonthlyIncome - simMonthlyExpenses;
      
      // Paga extra en index 5 (Junio) y 11 (Diciembre)
      if (simMonth === 5 || simMonth === 11) {
        monthlyCaja += efeExtraAmount;
      }

      const initialDebtThisMonth = currentTotalDebt;
      const settledThisMonth = [];

      // 2. Distribuir excedente a las deudas por prioridad
      let tempCaja = monthlyCaja;
      if (tempCaja > 0) {
        for (let i = 0; i < tempDebts.length; i++) {
          const d = tempDebts[i];
          if (d.remaining <= 0) continue;

          if (tempCaja >= d.remaining) {
            tempCaja -= d.remaining;
            d.remaining = 0;
            settledThisMonth.push(d.creditor);
          } else {
            d.remaining -= tempCaja;
            tempCaja = 0;
            break; // Se acabó la caja mensual
          }
        }
      }

      currentTotalDebt = tempDebts.reduce((sum, d) => sum + d.remaining, 0);

      let extraIncome = 0;
      if (simMonth === 5 || simMonth === 11) {
        extraIncome = efeExtraAmount;
      }
      const totalIncomeThisMonth = simMonthlyIncome + extraIncome;
      const totalExpensesThisMonth = simMonthlyExpenses;

      results.push({
        monthName: MONTH_NAMES[simMonth],
        year: simYear,
        caja: monthlyCaja,
        ingresos: totalIncomeThisMonth,
        gastos: totalExpensesThisMonth,
        initialDebt: initialDebtThisMonth,
        finalDebt: currentTotalDebt,
        settled: settledThisMonth,
        debtDetails: tempDebts.map(d => ({ creditor: d.creditor, remaining: d.remaining }))
      });

      if (currentTotalDebt === 0) {
        debtZeroMonth = MONTH_NAMES[simMonth];
        debtZeroYear = simYear;
        break;
      }

      // Avanzar mes
      simMonth++;
      if (simMonth > 11) {
        simMonth = 0;
        simYear++;
      }
      monthsCount++;
    }

    return {
      timeline: results,
      totalInitialDebt,
      debtZeroMonth,
      debtZeroYear,
      monthsToZero: monthsCount + 1
    };
  };

  const yearMonthsData = generateYearData(currentYear);

  return (
    <div className="glass-panel" style={{ padding: '20px', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* CABECERA CON CONTROL DE VISTA & MES */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={20} color="var(--color-cyan)" />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, textShadow: '0 0 10px rgba(6,182,212,0.15)' }}>
            {viewMode === 'month' ? `${MONTH_NAMES[currentMonth]} ${currentYear}` : `Consolidado Anual ${currentYear}`}
          </h3>
        </div>

        {/* Controles de Navegación y Alternador Mensual/Anual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {viewMode === 'month' && (
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px' }}>
              <button onClick={handlePrevMonth} className="btn-icon" style={{ padding: '4px 8px' }} title="Mes anterior">
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleNextMonth} className="btn-icon" style={{ padding: '4px 8px' }} title="Mes siguiente">
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '6px', padding: '2px', flexWrap: 'wrap', gap: '2px' }}>
            <button 
              onClick={() => { setViewMode('month'); setActiveTab('calendar'); }}
              className={`sub-tab-btn ${viewMode === 'month' && activeTab === 'calendar' ? 'active' : ''}`}
              style={{ fontSize: '0.68rem', padding: '4px 10px', borderRadius: '4px' }}
            >
              Mensual
            </button>
            <button 
              onClick={() => setViewMode('year')}
              className={`sub-tab-btn ${viewMode === 'year' ? 'active' : ''}`}
              style={{ fontSize: '0.68rem', padding: '4px 10px', borderRadius: '4px' }}
            >
              Vista Anual
            </button>
            <button 
              onClick={() => { setViewMode('month'); setActiveTab('forecast'); }}
              className={`sub-tab-btn ${viewMode === 'month' && activeTab === 'forecast' ? 'active' : ''}`}
              style={{ fontSize: '0.68rem', padding: '4px 10px', borderRadius: '4px' }}
            >
              🔮 Previsión de Deudas
            </button>
            <button 
              onClick={() => { setViewMode('month'); setActiveTab('settings'); }}
              className={`sub-tab-btn ${viewMode === 'month' && activeTab === 'settings' ? 'active' : ''}`}
              style={{ fontSize: '0.68rem', padding: '4px 10px', borderRadius: '4px' }}
            >
              🔧 Ajustes Fijos
            </button>
          </div>
        </div>
      </div>

      {/* METRICAS CLAVE SUPERIOR */}
      {viewMode === 'month' && activeTab === 'calendar' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {(() => {
            const wins = calendarDays.filter(d => !d.isProjected && d.pnl > 0);
            const losses = calendarDays.filter(d => !d.isProjected && d.pnl < 0);
            const netRealPnl = calendarDays.filter(d => !d.isProjected).reduce((sum, d) => sum + d.pnl, 0);
            const netProjPnl = calendarDays.filter(d => d.isProjected).reduce((sum, d) => sum + d.pnl, 0);
            const winRate = (wins.length + losses.length) > 0 ? ((wins.length / (wins.length + losses.length)) * 100).toFixed(0) : 0;
            const totalSobrante = calendarDays.reduce((sum, d) => sum + d.sobrante, 0);
            
            return (
              <>
                <div style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Win Rate (Real)</span>
                  <strong style={{ fontSize: '1.05rem', color: winRate >= 50 ? 'var(--color-emerald)' : 'var(--color-rose)', textShadow: `0 0 10px ${winRate >= 50 ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)'}` }}>
                    {winRate}%
                  </strong>
                </div>
                <div style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>P&L Trading (Real)</span>
                  <strong style={{ fontSize: '1.05rem', color: netRealPnl >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                    {netRealPnl >= 0 ? `+$${netRealPnl.toLocaleString(undefined, {maximumFractionDigits:0})}` : `-$${Math.abs(netRealPnl).toLocaleString(undefined, {maximumFractionDigits:0})}`}
                  </strong>
                </div>
                <div style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Proyección Fin de Mes</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--color-cyan)' }}>
                    +${(netRealPnl + netProjPnl).toLocaleString(undefined, {maximumFractionDigits:0})}
                  </strong>
                </div>
                <div style={{ padding: '12px 10px', background: totalSobrante >= 0 ? 'rgba(16,185,129,0.03)' : 'rgba(244,63,94,0.03)', border: `1px solid ${totalSobrante >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.12)'}`, borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Caja Neta Sobrante</span>
                  <strong style={{ fontSize: '1.05rem', color: totalSobrante >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                    {totalSobrante >= 0 ? `+${totalSobrante.toLocaleString(undefined, {maximumFractionDigits:0})} €` : `-${Math.abs(totalSobrante).toLocaleString(undefined, {maximumFractionDigits:0})} €`}
                  </strong>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* METRICAS VISTA ANUAL */}
      {viewMode === 'year' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {(() => {
            const annualRealTrading = yearMonthsData.reduce((sum, m) => sum + m.tradingPnl, 0);
            const annualProjectedTrading = yearMonthsData.reduce((sum, m) => sum + m.projectedPnl, 0);
            const annualSobrante = yearMonthsData.reduce((sum, m) => sum + m.sobrante + m.projectedSobrante, 0);
            const annualDebtsPaid = yearMonthsData.reduce((sum, m) => sum + m.debtsPaid, 0);
            return (
              <>
                <div style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Trading Real Acumulado</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--color-emerald)' }}>+${annualRealTrading.toLocaleString(undefined, {maximumFractionDigits:0})}</strong>
                </div>
                <div style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Trading Proyectado Restante</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--color-cyan)' }}>+${annualProjectedTrading.toLocaleString(undefined, {maximumFractionDigits:0})}</strong>
                </div>
                <div style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>
                    {annualSobrante >= 0 ? 'Sobrante Total de Caja' : 'Déficit Total de Caja'}
                  </span>
                  <strong style={{ fontSize: '1.05rem', color: annualSobrante >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                    {annualSobrante >= 0 ? `+${annualSobrante.toFixed(0)} €` : `-${Math.abs(annualSobrante).toFixed(0)} €`}
                  </strong>
                </div>
                <div style={{ padding: '12px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase' }}>Deudas Amortizadas este Año</span>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--color-emerald)' }}>{annualDebtsPaid.toFixed(0)} €</strong>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* --- VISTA CALENDARIO MENSUAL --- */}
      {viewMode === 'month' && activeTab === 'calendar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          
          {/* Cabecera del día de la semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.62rem', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '4px' }}>
            <div>LUNES</div><div>MARTES</div><div>MIÉRCOLES</div><div>JUEVES</div><div>VIERNES</div><div>SÁBADO</div><div>DOMINGO</div>
          </div>

          {/* Celdas del Calendario */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
            {/* Rellenar offset de inicio de mes */}
            {Array.from({ length: firstDayOffset }).map((_, idx) => (
              <div key={`offset-${idx}`} style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '6px', minHeight: '105px', border: '1px solid rgba(255,255,255,0.01)' }} />
            ))}

            {/* Días reales del mes */}
            {calendarDays.map((dayObj) => {
              const { day, isToday, isFuture, pnl, trades, isProjected, debtsPaid, sobrante, equity, risk } = dayObj;
              
              let pnlColor = 'var(--text-secondary)';
              let pnlText = '—';
              let cellBg = 'rgba(255,255,255,0.005)';
              let border = '1px solid rgba(255,255,255,0.04)';

              if (pnl > 0) {
                pnlColor = isProjected ? 'rgba(16,185,129,0.55)' : 'var(--color-emerald)';
                pnlText = `+$${pnl.toFixed(0)}`;
                cellBg = isProjected ? 'rgba(16,185,129,0.01)' : 'rgba(16,185,129,0.03)';
                border = `1px solid ${isProjected ? 'rgba(16,185,129,0.07)' : 'rgba(16,185,129,0.12)'}`;
              } else if (pnl < 0) {
                pnlColor = 'var(--color-rose)';
                pnlText = `-$${Math.abs(pnl).toFixed(0)}`;
                cellBg = 'rgba(244,63,94,0.03)';
                border = '1px solid rgba(244,63,94,0.12)';
              }

              if (isToday) {
                border = '2px solid var(--color-cyan)';
                cellBg = 'rgba(6,182,212,0.05)';
              }

              return (
                <div
                  key={`day-${day}`}
                  onClick={() => handleDayClick(dayObj)}
                  style={{
                    background: cellBg,
                    border,
                    borderRadius: '8px',
                    padding: '6px',
                    minHeight: '105px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  className="calendar-day-cell"
                >
                  {/* Número de día y Tag de Hoy */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: isToday ? 900 : 600, color: isToday ? '#ffffff' : 'rgba(255,255,255,0.35)' }}>
                      {day}
                    </span>
                    {isToday && (
                      <span style={{ fontSize: '0.5rem', background: 'var(--color-cyan)', color: '#000000', padding: '0px 4px', borderRadius: '3px', fontWeight: 800 }}>
                        HOY
                      </span>
                    )}
                  </div>

                  {/* PnL de Trading */}
                  <div style={{ textAlign: 'center', margin: '4px 0' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 800, color: pnlColor }}>
                      {pnlText}
                    </div>
                    {trades > 0 && (
                      <div style={{ fontSize: '0.52rem', color: 'rgba(255,255,255,0.2)' }}>
                        {trades} trade{trades > 1 ? 's' : ''} {isProjected && '(prev)'}
                      </div>
                    )}
                  </div>

                  {/* Desglose de Caja Diaria */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '3px' }}>
                    {(() => {
                      const dailyIng = efeIncome + (pnlEur > 0 ? pnlEur : 0);
                      const dailyGas = fixedExpense + debtsPaid + (pnlEur < 0 ? Math.abs(pnlEur) : 0);
                      return (
                        <>
                          <div style={{ fontSize: '0.50rem', display: 'flex', justifyContent: 'space-between', color: 'rgba(16, 185, 129, 0.7)' }}>
                            <span>Ingreso:</span>
                            <span style={{ fontWeight: 600 }}>+{dailyIng.toFixed(0)}€</span>
                          </div>
                          <div style={{ fontSize: '0.50rem', display: 'flex', justifyContent: 'space-between', color: 'rgba(244, 63, 94, 0.7)' }}>
                            <span>Gasto:</span>
                            <span style={{ fontWeight: 600 }}>-{dailyGas.toFixed(0)}€</span>
                          </div>
                          <div style={{ fontSize: '0.54rem', display: 'flex', justifyContent: 'space-between', color: sobrante >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)', marginTop: '1px', borderTop: '1px dashed rgba(255,255,255,0.03)', paddingTop: '1px' }}>
                            <span>{sobrante >= 0 ? 'Sobrante:' : 'Déficit:'}</span>
                            <span style={{ fontWeight: 700 }}>
                              {sobrante >= 0 ? `+${sobrante.toFixed(0)}` : `-${Math.abs(sobrante).toFixed(0)}`}€
                            </span>
                          </div>
                        </>
                      );
                    })()}
                    
                    {/* Equity Acumulada */}
                    <div style={{ fontSize: '0.54rem', display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                      <span>Equity:</span>
                      <span style={{ fontWeight: 700, color: '#ffffff' }}>${equity.toFixed(0)}</span>
                    </div>

                    {/* Riesgo permitido (Riesgo Día) */}
                    <div style={{ fontSize: '0.48rem', display: 'flex', justifyContent: 'space-between', color: dayObj.isManualRisk ? 'var(--color-cyan)' : 'rgba(244,63,94,0.45)' }}>
                      <span>Riesgo día{dayObj.isManualRisk ? ' (M)' : ''}:</span>
                      <span style={{ fontWeight: 700 }}>-${risk.toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* --- VISTA ANUAL CONSOLIDADA (12 MESES) --- */}
      {viewMode === 'year' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {yearMonthsData.map((m, idx) => {
            const netTrading = m.tradingPnl + m.projectedPnl;
            const netSobrante = m.sobrante + m.projectedSobrante;
            const isFutureMonth = idx > currentMonth && currentYear === 2026;
            
            return (
              <div 
                key={idx}
                onClick={() => {
                  setCurrentMonth(idx);
                  setViewMode('month');
                  setActiveTab('calendar');
                }}
                className="calendar-day-cell"
                style={{ 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '10px', 
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  transition: 'transform 0.2s ease, border-color 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff' }}>{m.name}</span>
                  {isFutureMonth && (
                    <span style={{ fontSize: '0.48rem', border: '1px dashed var(--color-cyan)', color: 'var(--color-cyan)', padding: '1px 4px', borderRadius: '4px' }}>
                      Previsto
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.62rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ingresos:</span>
                    <strong style={{ color: 'var(--color-emerald)' }}>
                      +{m.ingresos.toLocaleString(undefined, {maximumFractionDigits:0})} €
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Gastos:</span>
                    <strong style={{ color: 'var(--color-rose)' }}>
                      -{m.gastos.toLocaleString(undefined, {maximumFractionDigits:0})} €
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.05)', paddingTop: '2px', marginTop: '1px' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{netSobrante >= 0 ? 'Sobrante Neto:' : 'Déficit Neto:'}</span>
                    <strong style={{ color: netSobrante >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                      {netSobrante >= 0 ? `+${netSobrante.toLocaleString(undefined, {maximumFractionDigits:0})} €` : `-${Math.abs(netSobrante).toLocaleString(undefined, {maximumFractionDigits:0})} €`}
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.02)', paddingTop: '4px', marginTop: '2px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>Win Rate / Operado:</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {m.tradedDaysCount > 0 ? `${m.winRate}% (${m.tradedDaysCount}d)` : 'Sin trades'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- PESTAÑA PREVISIÓN DE AMORTIZACIÓN DINÁMICA --- */}
      {viewMode === 'month' && activeTab === 'forecast' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-cyan)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔮 Simulador de Proyección de Deuda Cero
            </h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.4 }}>
              Proyecta matemáticamente la amortización secuencial de tus pasivos según el orden de prioridad. El simulador acumula tu excedente mensual ordinario (nómina de EFE menos gastos fijos) y añade el beneficio neto estimado de trading en BingX.
            </p>

            {/* Controles del Simulador */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
              gap: '16px', 
              background: 'rgba(0,0,0,0.15)', 
              border: '1px solid var(--border)', 
              borderRadius: '10px', 
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  ¿Incluir Beneficios de Trading?
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <input 
                    type="checkbox" 
                    id="sim-include-trading" 
                    checked={simIncludeTrading}
                    onChange={(e) => setSimIncludeTrading(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-cyan)' }}
                  />
                  <label htmlFor="sim-include-trading" style={{ fontSize: '0.75rem', color: '#ffffff', cursor: 'pointer' }}>
                    Sí, sumar trading diario
                  </label>
                </div>
              </div>

              {simIncludeTrading && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                      PnL Medio Diario ($ USD)
                    </label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={simDailyTarget}
                      onChange={(e) => setSimDailyTarget(parseFloat(e.target.value) || 0)}
                      style={{ height: '32px', fontSize: '0.8rem', width: '100%' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                      Días Operados a la Semana
                    </label>
                    <select 
                      className="form-input" 
                      value={simDaysPerWeek}
                      onChange={(e) => setSimDaysPerWeek(parseInt(e.target.value) || 1)}
                      style={{ height: '32px', fontSize: '0.8rem', padding: '0 8px', width: '100%' }}
                    >
                      <option value="1">1 día (Solo domingos/elegido)</option>
                      <option value="2">2 días (Operativa puntual)</option>
                      <option value="3">3 días (MA-JU - Recomendado)</option>
                      <option value="4">4 días (LU-JU)</option>
                      <option value="5">5 días (LU-VI)</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>
                  Caja Libre de Nómina EFE
                </span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--color-emerald)', marginTop: '4px' }}>
                  +{(efeSalary - monthlyExpenses).toLocaleString()} €/mes
                </strong>
                <span style={{ fontSize: '0.52rem', color: 'var(--text-tertiary)' }}>
                  (Nómina {efeSalary} € - Gastos fijos {monthlyExpenses} €)
                </span>
              </div>
            </div>

            {/* Ejecución de la Simulación */}
            {(() => {
              const simData = runForecastSimulation();
              const { timeline, totalInitialDebt, debtZeroMonth, debtZeroYear, monthsToZero } = simData;

              if (totalInitialDebt === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--border)', borderRadius: '10px' }}>
                    <span style={{ fontSize: '2.5rem' }}>🎉</span>
                    <h5 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-emerald)', marginTop: '12px' }}>
                      ¡Sin deudas activas!
                    </h5>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                      No tienes deudas pendientes por liquidar. Tu cortisol financiero está bajo control.
                    </p>
                  </div>
                );
              }

              // Calcular deudas liquidadas en la simulación
              const totalSettledCount = debtsList.filter(d => (parseFloat(d.amount) - parseFloat(d.paid_amount)) > 0).length;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Banner de Hito Deuda Cero */}
                  <div style={{ 
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(16, 185, 129, 0.05))',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 80%)',
                      pointerEvents: 'none'
                    }} />
                    
                    <span style={{ fontSize: '0.62rem', color: 'var(--color-cyan)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      HITO DEUDA CERO ESTIMADO
                    </span>
                    <strong style={{ fontSize: '2rem', color: '#ffffff', letterSpacing: '-0.02em', textShadow: '0 0 16px rgba(6, 182, 212, 0.5)' }}>
                      {debtZeroMonth ? `${debtZeroMonth} de ${debtZeroYear}` : 'Más de 3 años'}
                    </strong>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {debtZeroMonth ? `Liquidando tus ${totalInitialDebt.toLocaleString()} € de deuda en ${monthsToZero} meses.` : 'Ajusta los parámetros para acelerar el pago.'}
                    </span>

                    <div style={{ 
                      marginTop: '10px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: 'rgba(0,0,0,0.2)', 
                      padding: '8px 14px', 
                      borderRadius: '30px', 
                      border: '1px solid rgba(255,255,255,0.05)',
                      fontSize: '0.68rem',
                      color: 'var(--text-secondary)',
                      fontWeight: 600
                    }}>
                      <Heart size={12} color="var(--color-rose)" />
                      <span>Para Lola: {debtZeroMonth ? `Tranquilidad garantizada para Lola en ${debtZeroYear}` : 'Persistencia diaria'}</span>
                    </div>
                  </div>

                  {/* Gráfico SVG de Reducción de Deuda */}
                  <div style={{ background: 'rgba(0, 0, 0, 0.12)', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px' }}>
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                      Evolución de la Deuda Pendiente (€)
                    </h5>
                    
                    {/* Renderizado de Barras SVG */}
                    <div style={{ width: '100%', overflowX: 'auto' }}>
                      <svg width={Math.max(timeline.length * 60, 500)} height="160" viewBox={`0 0 ${Math.max(timeline.length * 60, 500)} 160`}>
                        {timeline.map((item, idx) => {
                          const maxVal = totalInitialDebt;
                          const barHeight = maxVal > 0 ? (item.finalDebt / maxVal) * 110 : 0;
                          const x = idx * 60 + 40;
                          const y = 130 - barHeight;
                          const barWidth = 32;
                          
                          // Gradiente de color según disminuye la deuda
                          const ratio = maxVal > 0 ? (item.finalDebt / maxVal) : 0;
                          const barColor = ratio > 0.6 ? 'var(--color-rose)' : ratio > 0.2 ? 'var(--color-cyan)' : 'var(--color-emerald)';
                          
                          return (
                            <g key={idx} style={{ cursor: 'pointer' }}>
                              <title>
                                {item.monthName} {item.year}: {item.finalDebt.toLocaleString(undefined, {maximumFractionDigits:0})} € pendientes
                              </title>
                              {/* Barra de Deuda */}
                              <rect 
                                x={x} 
                                y={y} 
                                width={barWidth} 
                                height={Math.max(barHeight, 2)} 
                                rx="3"
                                fill={barColor}
                                opacity={0.8}
                                style={{ transition: 'all 0.3s ease' }}
                              />
                              {/* Texto de Valor encima */}
                              {idx % 2 === 0 && (
                                <text 
                                  x={x + barWidth/2} 
                                  y={y - 6} 
                                  fill="var(--text-secondary)" 
                                  fontSize="8" 
                                  fontWeight="bold"
                                  textAnchor="middle"
                                >
                                  {Math.round(item.finalDebt).toLocaleString()}€
                                </text>
                              )}
                              {/* Etiqueta del Mes debajo */}
                              <text 
                                x={x + barWidth/2} 
                                y="146" 
                                fill="var(--text-tertiary)" 
                                fontSize="7" 
                                textAnchor="middle"
                              >
                                {item.monthName.substring(0, 3)}.
                              </text>
                            </g>
                          );
                        })}
                        {/* Línea Base */}
                        <line x1="10" y1="130" x2={timeline.length * 60 + 40} y2="130" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                      </svg>
                    </div>
                  </div>

                  {/* Línea de Tiempo de Hitos Mensuales */}
                  <div>
                    <h5 style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                      Detalle de Liquidación Mes a Mes
                    </h5>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                      {timeline.map((m, idx) => (
                        <div key={idx} style={{ 
                          background: 'rgba(255, 255, 255, 0.01)', 
                          border: '1px solid var(--border)', 
                          borderRadius: '8px', 
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '4px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#ffffff' }}>{m.monthName} {m.year}</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.68rem', margin: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.02)', paddingBottom: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Ingresos:</span>
                              <strong style={{ color: 'var(--color-emerald)' }}>+{m.ingresos.toLocaleString(undefined, {maximumFractionDigits:0})} €</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Gastos:</span>
                              <strong style={{ color: 'var(--color-rose)' }}>-{m.gastos.toLocaleString(undefined, {maximumFractionDigits:0})} €</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', paddingTop: '2px', borderTop: '1px dashed rgba(255,255,255,0.05)' }}>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Excedente:</span>
                              <strong style={{ color: m.caja >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                                {m.caja >= 0 ? `+${m.caja.toLocaleString(undefined, {maximumFractionDigits:0})} €` : `-${Math.abs(m.caja).toLocaleString(undefined, {maximumFractionDigits:0})} €`}
                              </strong>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginTop: '2px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Deuda Pendiente:</span>
                            <strong style={{ color: m.finalDebt === 0 ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                              {m.finalDebt.toLocaleString(undefined, {maximumFractionDigits:0})} €
                            </strong>
                          </div>

                          {m.settled.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                              {m.settled.map((cred, cIdx) => (
                                <span key={cIdx} style={{ 
                                  fontSize: '0.52rem', 
                                  background: 'rgba(16, 185, 129, 0.15)', 
                                  color: 'var(--color-emerald)', 
                                  border: '1px solid rgba(16, 185, 129, 0.25)', 
                                  padding: '2px 6px', 
                                  borderRadius: '4px',
                                  fontWeight: 800
                                }}>
                                  🎉 LIQUIDADA: {cred}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- VISTA AJUSTES FIJOS UNIFICADOS (VERDE, ROJO, AZUL) --- */}
      {viewMode === 'month' && activeTab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* PANEL SUPERIOR DE MÉTRICAS Y GRÁFICOS */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center', justifyContent: 'space-around' }}>
            {/* 1. Indicador Circular de Carga de Gastos */}
            {(() => {
              const pct = efeSalary > 0 ? Math.min((monthlyExpenses / efeSalary) * 100, 150) : 0;
              const radius = 40;
              const strokeWidth = 6;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (Math.min(pct, 100) / 100) * circumference;
              const gaugeColor = pct > 80 ? 'var(--color-rose)' : pct > 50 ? 'var(--color-amber)' : 'var(--color-emerald)';
              
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="45" cy="45" r={radius} fill="transparent" stroke="rgba(255, 255, 255, 0.03)" strokeWidth={strokeWidth} />
                      <circle cx="45" cy="45" r={radius} fill="transparent" stroke={gaugeColor} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Carga de Gastos</span>
                    <strong style={{ fontSize: '0.9rem', color: gaugeColor }}>{monthlyExpenses.toLocaleString()} € consumidos</strong>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-tertiary)', display: 'block' }}>de {efeSalary.toLocaleString()} € de nómina</span>
                  </div>
                </div>
              );
            })()}

            {/* 2. Indicador Circular del Progreso de Deuda */}
            {(() => {
              const totalAmount = debtsList.reduce((sum, d) => sum + parseFloat(d.amount), 0);
              const totalPaid = debtsList.reduce((sum, d) => sum + parseFloat(d.paid_amount), 0);
              const remaining = totalAmount - totalPaid;
              const pctPaid = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;
              
              const radius = 40;
              const strokeWidth = 6;
              const circumference = 2 * Math.PI * radius;
              const strokeDashoffset = circumference - (Math.min(pctPaid, 100) / 100) * circumference;
              
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="45" cy="45" r={radius} fill="transparent" stroke="rgba(255, 255, 255, 0.03)" strokeWidth={strokeWidth} />
                      <circle cx="45" cy="45" r={radius} fill="transparent" stroke="var(--color-cyan)" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
                    </svg>
                    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>{pctPaid.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Amortización Global</span>
                    <strong style={{ fontSize: '0.9rem', color: 'var(--color-cyan)' }}>{totalPaid.toLocaleString()} € pagados</strong>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'block' }}>Pendiente: <strong style={{ color: 'var(--color-rose)' }}>{remaining.toLocaleString()} €</strong></span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* CUADRÍCULA DE AJUSTES FIJOS UNIFICADOS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            
            {/* COLUMNA VERDE — INGRESOS Y CAPITAL */}
            <div className="glass-panel" style={{ padding: '18px', borderTop: '4px solid var(--color-emerald)', background: 'rgba(16, 185, 129, 0.015)' }}>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-emerald)', marginBottom: '14px', borderBottom: '1px solid rgba(16,185,129,0.1)', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🟢 Ingresos & Capital
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Capital de Trading BingX */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px' }}>
                  <label style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Capital Trading (USD)
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={startBalance} 
                      onChange={(e) => setStartBalance(parseFloat(e.target.value) || 0)} 
                      style={{ height: '32px', fontSize: '0.78rem', flex: 1 }} 
                    />
                    <button
                      type="button"
                      onClick={fetchLiveBalance}
                      disabled={liveBalanceLoading}
                      className="btn btn-outline flex-center"
                      style={{ width: '32px', height: '32px', padding: 0, minWidth: 0, borderRadius: 'var(--radius-sm)' }}
                      title="Sincronizar Balance real de BingX"
                    >
                      <RefreshCw size={12} className={liveBalanceLoading ? "animate-spin" : ""} />
                    </button>
                  </div>
                  <span style={{ fontSize: '0.5rem', color: 'var(--text-tertiary)' }}>
                    Sincronizado con la equity en tiempo real de tu cuenta BingX.
                  </span>
                </div>

                {/* Nómina EFE mensual */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <label style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Nómina Mensual EFE (€)
                  </label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={efeSalary} 
                    onChange={(e) => setEfeSalary(parseFloat(e.target.value) || 0)} 
                    style={{ height: '32px', fontSize: '0.78rem' }} 
                  />
                </div>

                {/* Paga Extra */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <label style={{ fontSize: '0.58rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                    Paga Extra (€)
                  </label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={efeExtraAmount} 
                    onChange={(e) => setEfeExtraAmount(parseFloat(e.target.value) || 0)} 
                    style={{ height: '32px', fontSize: '0.78rem' }} 
                  />
                </div>

                {/* Caja Libre Calculada */}
                <div style={{ 
                  marginTop: '10px',
                  background: 'rgba(16, 185, 129, 0.05)', 
                  border: '1px solid rgba(16, 185, 129, 0.15)',
                  borderRadius: '8px', 
                  padding: '12px',
                  fontSize: '0.72rem',
                  lineHeight: 1.4
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Caja Libre de Nómina:</span>
                    <strong style={{ color: 'var(--color-emerald)' }}>{(efeSalary - monthlyExpenses).toLocaleString()} €/mes</strong>
                  </div>
                  <span style={{ fontSize: '0.52rem', color: 'var(--text-tertiary)', display: 'block' }}>
                    Dinero garantizado disponible mensualmente tras deducir tus gastos fijos (sin contar trading).
                  </span>
                </div>
              </div>
            </div>

            {/* COLUMNA ROJA — GASTOS FIJOS */}
            <div className="glass-panel" style={{ padding: '18px', borderTop: '4px solid var(--color-rose)', background: 'rgba(244, 63, 94, 0.015)' }}>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-rose)', marginBottom: '14px', borderBottom: '1px solid rgba(244,63,94,0.1)', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🔴 Gastos Fijos ({monthlyExpenses.toLocaleString()} €)
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Formulario rápido para añadir gasto */}
                <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px' }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Añadir Gasto Mensual
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Concepto..." 
                      value={newExpenseName} 
                      onChange={(e) => setNewExpenseName(e.target.value)} 
                      required 
                      style={{ height: '30px', fontSize: '0.75rem', flex: 1 }} 
                    />
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="€..." 
                      value={newExpenseAmount} 
                      onChange={(e) => setNewExpenseAmount(e.target.value)} 
                      required 
                      style={{ height: '30px', fontSize: '0.75rem', width: '70px' }} 
                    />
                    <button type="submit" className="btn btn-emerald" style={{ padding: '0 10px', height: '30px', fontSize: '0.7rem', fontWeight: 700, background: 'var(--color-rose)', border: 'none' }}>
                      +
                    </button>
                  </div>
                </form>

                {/* Lista de Gastos */}
                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {expensesList.length === 0 ? (
                    <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-tertiary)', padding: '20px' }}>
                      Sin gastos fijos mensuales.
                    </div>
                  ) : (
                    expensesList.map(item => (
                      <div 
                        key={item.id} 
                        style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          padding: '8px 10px', 
                          background: 'rgba(255,255,255,0.01)', 
                          border: '1px solid var(--border)', 
                          borderRadius: '6px', 
                          fontSize: '0.72rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.9rem' }}>{getExpenseIcon(item.name)}</span>
                          <span style={{ color: '#ffffff', fontWeight: 600 }}>{item.name}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, color: 'var(--color-rose)' }}>
                            {parseFloat(item.amount).toLocaleString(undefined, {maximumFractionDigits: 0})} €
                          </span>
                          <button 
                            onClick={() => handleDeleteExpense(item.id)} 
                            className="btn-icon" 
                            style={{ color: 'var(--color-rose)', opacity: 0.6, cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* COLUMNA AZUL — DEUDAS */}
            <div className="glass-panel" style={{ padding: '18px', borderTop: '4px solid var(--color-cyan)', background: 'rgba(6, 182, 212, 0.015)' }}>
              <h5 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-cyan)', marginBottom: '14px', borderBottom: '1px solid rgba(6,182,212,0.1)', paddingBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                🔵 Deudas & Acreedores
              </h5>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Formulario rápido para añadir deuda */}
                <form onSubmit={handleAddDebt} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '8px', padding: '10px' }}>
                  <span style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Registrar Deuda
                  </span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Acreedor..." 
                      value={newCreditor} 
                      onChange={(e) => setNewCreditor(e.target.value)} 
                      required 
                      style={{ height: '30px', fontSize: '0.72rem', flex: 1, minWidth: '90px' }} 
                    />
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Total €..." 
                      value={newAmount} 
                      onChange={(e) => setNewAmount(e.target.value)} 
                      required 
                      style={{ height: '30px', fontSize: '0.72rem', width: '70px' }} 
                    />
                    <input 
                      type="number" 
                      className="form-input" 
                      placeholder="Prio (1-9)..." 
                      min="1"
                      value={newPriority} 
                      onChange={(e) => setNewPriority(parseInt(e.target.value) || 1)} 
                      required 
                      style={{ height: '30px', fontSize: '0.72rem', width: '50px' }} 
                    />
                    <button type="submit" className="btn btn-cyan animate-glow-cyan" style={{ padding: '0 10px', height: '30px', fontSize: '0.7rem', fontWeight: 700 }}>
                      +
                    </button>
                  </div>
                </form>

                {/* Lista de Deudas */}
                <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {debtsList.length === 0 ? (
                    <div style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-tertiary)', padding: '20px' }}>
                      Sin deudas registradas.
                    </div>
                  ) : (
                    debtsList.map(d => {
                      const paidPercent = d.amount > 0 ? (d.paid_amount / d.amount) * 100 : 0;
                      const remaining = d.amount - d.paid_amount;
                      const myPayments = debtPaymentsList.filter(p => p.debt_id === d.id);

                      let badgeClass = 'badge-rose';
                      let prioLabel = 'Prioridad Alta';
                      if (d.priority > 3 && d.priority <= 7) {
                        badgeClass = 'badge-amber';
                        prioLabel = 'Prioridad Media';
                      } else if (d.priority > 7) {
                        badgeClass = 'badge-emerald';
                        prioLabel = 'Prioridad Baja';
                      }

                      return (
                        <div 
                          key={d.id} 
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '8px', 
                            padding: '10px', 
                            background: 'rgba(255,255,255,0.01)', 
                            border: '1px solid var(--border)', 
                            borderRadius: '8px', 
                            fontSize: '0.72rem',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: '#ffffff', fontSize: '0.78rem' }}>{d.creditor}</strong>
                            
                            {/* Edición inline de prioridad por doble clic */}
                            {editingDebtPriorityId === d.id ? (
                              <input 
                                type="number"
                                value={tempPriorityValue}
                                onChange={(e) => setTempPriorityValue(parseInt(e.target.value) || 1)}
                                onBlur={() => savePriority(d.id)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') savePriority(d.id);
                                  if (e.key === 'Escape') setEditingDebtPriorityId(null);
                                }}
                                autoFocus
                                style={{ width: '45px', height: '18px', fontSize: '0.62rem', padding: '0 4px', background: 'var(--background-tertiary)', border: '1px solid var(--color-cyan)', borderRadius: '3px', color: '#ffffff' }}
                              />
                            ) : (
                              <span 
                                onDoubleClick={() => {
                                  setEditingDebtPriorityId(d.id);
                                  setTempPriorityValue(d.priority);
                                }}
                                className={`badge ${badgeClass}`} 
                                style={{ fontSize: '0.5rem', padding: '1px 5px', fontWeight: 700, cursor: 'pointer' }}
                                title="Doble clic para cambiar prioridad"
                              >
                                Prio {d.priority} ({prioLabel.substring(10)})
                              </span>
                            )}
                          </div>

                          {/* Barra de progreso */}
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                              <span>Amortizado: <strong>{d.paid_amount.toLocaleString()} € ({paidPercent.toFixed(0)}%)</strong></span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.03)', borderRadius: '2px', overflow: 'hidden' }}>
                              <div style={{ width: `${paidPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-cyan), var(--color-emerald))', transition: 'width 0.3s ease' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.58rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              <span>Pendiente: <strong style={{ color: 'var(--color-rose)' }}>{remaining.toLocaleString()} €</strong></span>
                              <span>Total: <strong>{d.amount.toLocaleString()} €</strong></span>
                            </div>
                          </div>

                          {/* Formulario inline de Amortización Premium */}
                          {amortizingDebtId === d.id ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '0.5rem', color: 'var(--text-secondary)' }}>IMPORTE (€)</label>
                                  <input 
                                    type="number"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    placeholder="0"
                                    style={{ width: '100%', height: '24px', fontSize: '0.68rem', padding: '2px 4px', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '3px', color: '#ffffff' }}
                                  />
                                </div>
                                <div style={{ flex: 1 }}>
                                  <label style={{ fontSize: '0.5rem', color: 'var(--text-secondary)' }}>FECHA</label>
                                  <input 
                                    type="date"
                                    value={payDate}
                                    onChange={(e) => setPayDate(e.target.value)}
                                    style={{ width: '100%', height: '24px', fontSize: '0.68rem', padding: '2px 4px', background: 'var(--background-tertiary)', border: '1px solid var(--border)', borderRadius: '3px', color: '#ffffff' }}
                                  />
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                <button 
                                  type="button"
                                  onClick={() => setAmortizingDebtId(null)}
                                  className="btn btn-outline"
                                  style={{ padding: '0 6px', fontSize: '0.58rem', height: '20px', textTransform: 'none' }}
                                >
                                  Cancelar
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => submitAmortization(d.id, d.paid_amount, d.amount)}
                                  className="btn btn-emerald"
                                  style={{ padding: '0 6px', fontSize: '0.58rem', height: '20px', textTransform: 'none', background: 'var(--color-cyan)', color: '#000' }}
                                >
                                  Guardar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '6px', marginTop: '2px' }}>
                              <button 
                                onClick={() => {
                                  setAmortizingDebtId(d.id);
                                  setPayAmount('');
                                  setPayDate(new Date().toISOString().split('T')[0]);
                                }}
                                className="btn btn-outline"
                                style={{ padding: '1px 6px', fontSize: '0.58rem', height: '20px', textTransform: 'none' }}
                              >
                                Amortizar...
                              </button>
                              <button 
                                onClick={() => handleDeleteDebt(d.id)}
                                className="btn-icon"
                                style={{ color: 'var(--color-rose)', display: 'flex', alignItems: 'center', padding: '2px' }}
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          )}

                          {/* Historial colapsable */}
                          {myPayments.length > 0 && (
                            <div style={{ borderTop: '1px dashed rgba(255,255,255,0.04)', paddingTop: '4px', marginTop: '2px' }}>
                              <button 
                                type="button"
                                onClick={() => toggleHistory(d.id)}
                                style={{ background: 'none', border: 'none', color: 'var(--color-cyan)', fontSize: '0.55rem', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '2px' }}
                              >
                                {expandedHistories[d.id] ? '▼ Ocultar Pagos' : `▶ Ver Pagos (${myPayments.length})`}
                              </button>
                              
                              {expandedHistories[d.id] && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '4px', paddingLeft: '6px', borderLeft: '1px solid rgba(6,182,212,0.3)', maxHeight: '70px', overflowY: 'auto' }}>
                                  {myPayments.map(p => (
                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.54rem', color: 'var(--text-secondary)' }}>
                                      <span>📅 {new Date(p.payment_date).toLocaleDateString('es-ES')}</span>
                                      <strong style={{ color: 'var(--color-emerald)' }}>+{parseFloat(p.amount).toLocaleString()} €</strong>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL EDICIÓN DIARIO DE TRADES */}
      {selectedJournalDay && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(5, 8, 16, 0.82)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="glass-panel" style={{ width: '310px', padding: '20px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(8, 13, 28, 0.99))', border: '1px solid var(--border)' }}>
            <h5 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '6px' }}>
              Diario: {selectedJournalDay.day} de {MONTH_NAMES[currentMonth]}
            </h5>
            
            {/* Contexto Rápido de Caja */}
            {(() => {
              const dailyPnlEur = (parseFloat(journalDayPnl) || 0) * usdToEurRate;
              const totalIng = selectedJournalDay.efeIncome + (dailyPnlEur > 0 ? dailyPnlEur : 0);
              const totalGas = selectedJournalDay.fixedExpense + selectedJournalDay.debtsPaid + (dailyPnlEur < 0 ? Math.abs(dailyPnlEur) : 0);
              const netSobrante = totalIng - totalGas;
              return (
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '10px', marginTop: '10px', fontSize: '0.68rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ingresos totales:</span>
                    <strong style={{ color: 'var(--color-emerald)' }}>+{totalIng.toFixed(1)} €</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Gastos totales:</span>
                    <strong style={{ color: 'var(--color-rose)' }}>-{totalGas.toFixed(1)} €</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed rgba(255,255,255,0.08)', paddingTop: '4px', marginTop: '2px' }}>
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>{netSobrante >= 0 ? 'Excedente Neto:' : 'Déficit Neto:'}</span>
                    <strong style={{ color: netSobrante >= 0 ? 'var(--color-emerald)' : 'var(--color-rose)' }}>
                      {netSobrante >= 0 ? `+${netSobrante.toFixed(1)}` : `-${Math.abs(netSobrante).toFixed(1)}`} €
                    </strong>
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div>
                <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  PnL del Trading (USD)
                </label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={journalDayPnl} 
                  onChange={(e) => setJournalDayPnl(e.target.value)} 
                  placeholder="Ej: 400 o -150" 
                  style={{ width: '100%', height: '32px', fontSize: '0.8rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Número de Operaciones
                </label>
                <input 
                  type="number" 
                  min="0" 
                  className="form-input" 
                  value={journalDayTrades} 
                  onChange={(e) => setJournalDayTrades(e.target.value)} 
                  placeholder="1" 
                  style={{ width: '100%', height: '32px', fontSize: '0.8rem' }} 
                />
              </div>
              <div>
                <label style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Límite de Riesgo Diario Manual (USD)
                </label>
                <input 
                  type="number" 
                  min="0" 
                  step="any"
                  className="form-input" 
                  value={journalDayRisk} 
                  onChange={(e) => setJournalDayRisk(e.target.value)} 
                  placeholder="Ej: 300 (vacío para usar 1.5% de equity)" 
                  style={{ width: '100%', height: '32px', fontSize: '0.8rem' }} 
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button className="btn btn-outline" onClick={() => setSelectedJournalDay(null)} style={{ flex: 1, padding: '6px 0', fontSize: '0.72rem', height: '32px' }}>
                Cancelar
              </button>
              <button className="btn btn-cyan animate-glow-cyan" onClick={handleSaveJournalDay} style={{ flex: 1, padding: '6px 0', fontSize: '0.72rem', height: '32px' }}>
                Guardar Día
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
