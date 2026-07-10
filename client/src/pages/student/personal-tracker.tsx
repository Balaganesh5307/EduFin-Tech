import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Plus,
  PiggyBank,
  BrainCircuit,
  Calendar,
  Sparkles,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export const PersonalTracker: React.FC = () => {
  const { user, accessToken } = useAuth();
  
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budget, setBudget] = useState<any>({ limitAmount: 12000, spentAmount: 8740 });
  const [savings, setSavings] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Expense form state
  const [expenseTitle, setExpenseTitle] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<string>('Food');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Savings form state
  const [goalTitle, setGoalTitle] = useState<string>('');
  const [goalTarget, setGoalTarget] = useState<string>('');
  const [goalCurrent, setGoalCurrent] = useState<string>('');
  const [goalDate, setGoalDate] = useState<string>('');
  const [showGoalForm, setShowGoalForm] = useState<boolean>(false);

  // Budget adjust state
  const [budgetLimitField, setBudgetLimitField] = useState<string>('12000');
  const [editingBudget, setEditingBudget] = useState<boolean>(false);

  const fetchTrackerData = async () => {
    setLoading(true);
    try {
      // 1. Get expenses
      const expRes = await fetch('/api/student-finance/expenses', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (expRes.ok) {
        setExpenses(await expRes.json());
      }
    } catch (_) {}

    try {
      // 2. Get budget
      const budRes = await fetch('/api/student-finance/budget', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (budRes.ok) {
        const bud = await budRes.json();
        setBudget(bud);
        setBudgetLimitField(bud.limitAmount.toString());
      }
    } catch (_) {}

    try {
      // 3. Get savings goals
      const savRes = await fetch('/api/student-finance/savings', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (savRes.ok) {
        setSavings(await savRes.json());
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchTrackerData();
  }, [user]);

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;

    const amt = parseFloat(expenseAmount);
    if (isNaN(amt)) return;

    try {
      const response = await fetch('/api/student-finance/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          title: expenseTitle,
          amount: amt,
          category: expenseCategory,
          date: expenseDate
        })
      });

      if (response.ok) {
        const result = await response.json();
        setExpenses(prev => [result, ...prev]);
        setBudget((prev: any) => ({
          ...prev,
          spentAmount: prev.spentAmount + amt
        }));
        setExpenseTitle('');
        setExpenseAmount('');
      }
    } catch (_) {
      // Mock local addition
      const mockResult = {
        _id: `e_mock_${Date.now()}`,
        title: expenseTitle,
        amount: amt,
        category: expenseCategory,
        date: expenseDate
      };
      setExpenses(prev => [mockResult, ...prev]);
      setBudget((prev: any) => ({
        ...prev,
        spentAmount: prev.spentAmount + amt
      }));
      setExpenseTitle('');
      setExpenseAmount('');
    }
  };

  const handleBudgetUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budgetLimitField);
    if (isNaN(limit)) return;

    try {
      const response = await fetch('/api/student-finance/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ limitAmount: limit })
      });
      if (response.ok) {
        const result = await response.json();
        setBudget(result);
        setEditingBudget(false);
      }
    } catch (_) {
      setBudget((prev: any) => ({ ...prev, limitAmount: limit }));
      setEditingBudget(false);
    }
  };

  const handleGoalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTarget) return;

    try {
      const response = await fetch('/api/student-finance/savings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          title: goalTitle,
          targetAmount: parseFloat(goalTarget),
          currentAmount: parseFloat(goalCurrent) || 0,
          targetDate: goalDate
        })
      });
      if (response.ok) {
        const result = await response.json();
        setSavings(prev => [...prev, result]);
        setGoalTitle('');
        setGoalTarget('');
        setGoalCurrent('');
        setGoalDate('');
        setShowGoalForm(false);
      }
    } catch (_) {
      const mockGoal = {
        _id: `g_mock_${Date.now()}`,
        title: goalTitle,
        targetAmount: parseFloat(goalTarget),
        currentAmount: parseFloat(goalCurrent) || 0,
        targetDate: goalDate || new Date().toISOString()
      };
      setSavings(prev => [...prev, mockGoal]);
      setGoalTitle('');
      setGoalTarget('');
      setGoalCurrent('');
      setGoalDate('');
      setShowGoalForm(false);
    }
  };

  // Prepare chart data (cumulative over transactions)
  const chartData = [...expenses]
    .reverse()
    .reduce((arr: any[], current: any, index: number) => {
      const previousTotal = index > 0 ? arr[index - 1].spent : 0;
      arr.push({
        date: new Date(current.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        spent: previousTotal + current.amount
      });
      return arr;
    }, []);

  const budgetPercent = Math.min(100, Math.round((budget.spentAmount / budget.limitAmount) * 100));

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2 text-left">
        <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
        <div className="h-64 bg-slate-900 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-44 bg-slate-900 rounded-2xl"></div>
          <div className="h-44 bg-slate-900 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
          Personal Tracker
          <PiggyBank className="h-5 w-5 text-indigo-400" />
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Keep tabs on daily expenditure habits, allocate monthly limits, and watch your savings goals grow.
        </p>
      </div>

      {/* Row 1: Budget indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Budget Control */}
        <div className="lg:col-span-5 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Budget Status Limit
            </span>
            <button
              onClick={() => setEditingBudget(!editingBudget)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
            >
              {editingBudget ? 'Cancel' : 'Edit Limit'}
            </button>
          </div>

          {editingBudget ? (
            <form onSubmit={handleBudgetUpdate} className="flex gap-2 items-center">
              <input
                type="number"
                value={budgetLimitField}
                onChange={(e) => setBudgetLimitField(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-32"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs"
              >
                Save
              </button>
            </form>
          ) : (
            <div>
              <h3 className="text-2xl font-black text-slate-100">
                ₹{budget.spentAmount.toLocaleString()}{' '}
                <span className="text-sm text-slate-400 font-normal">/ ₹{budget.limitAmount.toLocaleString()}</span>
              </h3>
            </div>
          )}

          <div className="space-y-2">
            <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetPercent > 90 ? 'bg-rose-500' : budgetPercent > 75 ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${budgetPercent}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>{budgetPercent}% Exhausted</span>
              <span>Remaining: ₹{Math.max(0, budget.limitAmount - budget.spentAmount).toLocaleString()}</span>
            </div>
          </div>

          {budgetPercent > 85 && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-3.5 flex items-start gap-2.5 text-xs">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
              <p>Warning: Budget limits are close to being crossed this month. Keep non-essential spends in check!</p>
            </div>
          )}
        </div>

        {/* Dynamic spend curve */}
        <div className="lg:col-span-7 glass-panel border-slate-900 rounded-3xl p-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            Cumulative Expenditure Curve
          </h4>
          <div className="h-44 w-full">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">
                Add an expense to render the timeline chart
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="spent" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpent)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Logs & Entry Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Logger */}
        <div className="lg:col-span-5 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Plus className="h-4 w-4 text-indigo-400" /> Log Daily Expense
          </h4>
          
          <form onSubmit={handleExpenseSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Expense Title
              </label>
              <input
                type="text"
                required
                placeholder="E.g., DBMS Textbook"
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  placeholder="1200"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Category
                </label>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Food">Food</option>
                  <option value="Accommodation">Accommodation</option>
                  <option value="Academics">Academics</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Travel">Travel</option>
                  <option value="Medical">Medical</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Transaction Date
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-semibold shadow-md active:scale-95 transition-all"
            >
              Log Transaction
            </button>
          </form>
        </div>

        {/* History table */}
        <div className="lg:col-span-7 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Recent Expenditures Logs
          </h4>
          
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-900/60 pb-3 block table-row font-bold uppercase tracking-wider">
                  <th className="py-2.5">Transaction</th>
                  <th className="py-2.5">Category</th>
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500 italic">
                      No expenditures logged yet.
                    </td>
                  </tr>
                ) : (
                  expenses.map((e) => (
                    <tr key={e._id || e.id}>
                      <td className="py-3 font-semibold text-slate-200">{e.title}</td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 bg-slate-950 border border-slate-900 rounded-full text-[9px] font-bold tracking-wide uppercase text-slate-400">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td className="py-3 text-right font-bold text-slate-200">₹{e.amount.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 3: Savings Goals */}
      <div className="glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <PiggyBank className="h-4.5 w-4.5 text-indigo-400" /> Active Savings Goals
          </h4>
          <button
            onClick={() => setShowGoalForm(!showGoalForm)}
            className="text-xs bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg hover:bg-indigo-600/20 transition-all font-semibold"
          >
            {showGoalForm ? 'Close Form' : 'New Goal'}
          </button>
        </div>

        {showGoalForm && (
          <form onSubmit={handleGoalSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border border-slate-900 bg-slate-950/20 rounded-2xl items-end">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Goal Title</label>
              <input
                type="text"
                required
                placeholder="Laptop fund"
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Target Amount (₹)</label>
              <input
                type="number"
                required
                placeholder="50000"
                value={goalTarget}
                onChange={(e) => setGoalTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none w-full"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-500 uppercase">Current Savings (₹)</label>
              <input
                type="number"
                placeholder="10000"
                value={goalCurrent}
                onChange={(e) => setGoalCurrent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none w-full"
              />
            </div>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs active:scale-95 transition-all w-full"
            >
              Add Goal
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {savings.map((s) => {
            const pct = Math.min(100, Math.round((s.currentAmount / s.targetAmount) * 100));
            return (
              <div key={s._id} className="p-5 border border-slate-900 bg-slate-950/20 rounded-2xl flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-extrabold text-slate-200 text-sm">{s.title}</h5>
                    <span className="text-[10px] text-slate-500">
                      Target: {new Date(s.targetDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-indigo-400">₹{s.currentAmount.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500 block">/ ₹{s.targetAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>{pct}% Achieved</span>
                    <span>Remaining: ₹{Math.max(0, s.targetAmount - s.currentAmount).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
