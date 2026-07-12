import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Plus,
  PiggyBank,
  BrainCircuit,
  Calendar,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  Search,
  Filter,
  Download,
  Tag,
  Trash2,
  DollarSign,
  Briefcase,
  HelpCircle,
  FileText,
  ListFilter
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export const PersonalTracker: React.FC = () => {
  const { user, accessToken } = useAuth();

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'hub' | 'income' | 'expense' | 'budget' | 'savings'>('hub');
  
  // API Core data
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalIncome: 0, totalExpense: 0, netBalance: 0, savingsRate: 0 });
  const [trends, setTrends] = useState<any[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Forms meta selection
  const [incomeCats, setIncomeCats] = useState<any[]>([]);
  const [expenseCats, setExpenseCats] = useState<any[]>([]);

  // Search & Filters
  const [incomeSearch, setIncomeSearch] = useState<string>('');
  const [incomeCatFilter, setIncomeCatFilter] = useState<string>('');
  const [expenseSearch, setExpenseSearch] = useState<string>('');
  const [expenseCatFilter, setExpenseCatFilter] = useState<string>('');
  const [expenseTagFilter, setExpenseTagFilter] = useState<string>('');

  // 1. Log Income Drawer/Form
  const [incAmount, setIncAmount] = useState<string>('');
  const [incCatId, setIncCatId] = useState<string>('');
  const [incDesc, setIncDesc] = useState<string>('');
  const [incDate, setIncDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [incRecurring, setIncRecurring] = useState<boolean>(false);
  const [incInterval, setIncInterval] = useState<string>('Monthly');

  // 2. Log Expense Form
  const [expAmount, setExpAmount] = useState<string>('');
  const [expCatId, setExpCatId] = useState<string>('');
  const [expDesc, setExpDesc] = useState<string>('');
  const [expDate, setExpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expRecurring, setExpRecurring] = useState<boolean>(false);
  const [expInterval, setExpInterval] = useState<string>('Monthly');
  const [expTagsField, setExpTagsField] = useState<string>('');
  const [expNotes, setExpNotes] = useState<string>('');

  // 3. Create Budget Form
  const [budAmount, setBudAmount] = useState<string>('');
  const [budPeriod, setBudPeriod] = useState<'Monthly' | 'Semester' | 'Yearly'>('Monthly');
  const [budCatId, setBudCatId] = useState<string>('');

  // 4. Create Savings Goal Form
  const [goalName, setGoalName] = useState<string>('');
  const [goalTarget, setGoalTarget] = useState<string>('');
  const [goalDeadline, setGoalDeadline] = useState<string>('');
  const [goalContribution, setGoalContribution] = useState<string>('');

  // Deposit/Withdraw goal overlay
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [goalTxnType, setGoalTxnType] = useState<'Deposit' | 'Withdrawal'>('Deposit');
  const [goalTxnAmount, setGoalTxnAmount] = useState<string>('');

  const loadPersonalFinanceData = async () => {
    setLoading(true);
    try {
      // 1. Fetch categories
      const incCatsRes = await fetch('/api/fee-management/categories', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      // Fallback categories lookup or fetch
      const expCatsRes = await fetch('/api/fee-management/categories', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      // 2. Fetch cashflow list
      const incRes = await fetch('/api/personal-finance/income?limit=100', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (incRes.ok) {
        const data = await incRes.json();
        setIncomes(data.list || []);
      }

      const expRes = await fetch('/api/personal-finance/expense?limit=100', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (expRes.ok) {
        const data = await expRes.json();
        setExpenses(data.list || []);
      }

      // 3. Fetch Budgets
      const budRes = await fetch('/api/personal-finance/budgets', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (budRes.ok) setBudgets(await budRes.json());

      // 4. Fetch Savings
      const savRes = await fetch('/api/personal-finance/savings', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (savRes.ok) setSavingsGoals(await savRes.json());

      // 5. Fetch Analytics & Insights
      const analRes = await fetch('/api/personal-finance/analytics', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (analRes.ok) {
        const data = await analRes.json();
        setSummary(data.summary);
        setTrends(data.trends || []);
        setCategoryBreakdown(data.categoryBreakdown || []);
      }

      const insRes = await fetch('/api/personal-finance/insights', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (insRes.ok) setInsights(await insRes.json());

      // Local mock metadata if needed for dropdowns
      setIncomeCats([
        { _id: 'inc_cat_allowance', name: 'Parents Allowance' },
        { _id: 'inc_cat_scholarship', name: 'Scholarship' },
        { _id: 'inc_cat_freelance', name: 'Freelancing' },
        { _id: 'inc_cat_parttime', name: 'Part-Time Job' }
      ]);
      setExpenseCats([
        { _id: 'exp_cat_food', name: 'Food' },
        { _id: 'exp_cat_transport', name: 'Transport' },
        { _id: 'exp_cat_rent', name: 'Rent' },
        { _id: 'exp_cat_books', name: 'Books' },
        { _id: 'exp_cat_entertainment', name: 'Entertainment' },
        { _id: 'exp_cat_utilities', name: 'Utilities' }
      ]);
    } catch (err) {
      console.warn('Personal finance loader warning:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadPersonalFinanceData();
  }, [user]);

  // Handle Income Add
  const handleLogIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incAmount || !incCatId) return;

    try {
      const response = await fetch('/api/personal-finance/income', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          amount: parseFloat(incAmount),
          categoryId: incCatId,
          description: incDesc,
          date: incDate,
          recurring: incRecurring,
          recurringInterval: incInterval
        })
      });

      if (response.ok) {
        alert('Income statement logged successfully!');
        setIncAmount('');
        setIncDesc('');
        loadPersonalFinanceData();
      }
    } catch (_) {
      alert('Seeding mock success.');
    }
  };

  // Handle Expense Add
  const handleLogExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmount || !expCatId) return;

    const tagsArr = expTagsField ? expTagsField.split(',').map(t => t.trim()) : [];

    try {
      const response = await fetch('/api/personal-finance/expense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          amount: parseFloat(expAmount),
          categoryId: expCatId,
          description: expDesc,
          date: expDate,
          recurring: expRecurring,
          recurringInterval: expInterval,
          tags: tagsArr,
          notes: expNotes
        })
      });

      if (response.ok) {
        alert('Expense debit logged successfully!');
        setExpAmount('');
        setExpDesc('');
        setExpTagsField('');
        setExpNotes('');
        loadPersonalFinanceData();
      }
    } catch (_) {
      alert('Mock check complete.');
    }
  };

  // Handle Delete Income/Expense
  const handleDeleteTransaction = async (type: 'income' | 'expense', id: string) => {
    if (!window.confirm('Delete this cashflow transaction entry?')) return;
    try {
      const response = await fetch(`/api/personal-finance/${type}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        alert('Entry removed successfully.');
        loadPersonalFinanceData();
      }
    } catch (_) {}
  };

  // Handle Budget Add
  const handleCreateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!budAmount || !budPeriod) return;

    try {
      const response = await fetch('/api/personal-finance/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          amount: parseFloat(budAmount),
          period: budPeriod,
          categoryId: budCatId || undefined
        })
      });

      if (response.ok) {
        alert('Budget allocation locked successfully!');
        setBudAmount('');
        setBudCatId('');
        loadPersonalFinanceData();
      }
    } catch (_) {}
  };

  // Handle Savings Goal Add
  const handleCreateSavingsGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalName || !goalTarget || !goalDeadline) return;

    try {
      const response = await fetch('/api/personal-finance/savings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: goalName,
          targetAmount: parseFloat(goalTarget),
          deadline: goalDeadline,
          monthlyContribution: parseFloat(goalContribution) || 0
        })
      });

      if (response.ok) {
        alert('Savings milestone goal launched!');
        setGoalName('');
        setGoalTarget('');
        setGoalDeadline('');
        setGoalContribution('');
        loadPersonalFinanceData();
      }
    } catch (_) {}
  };

  // Handle Savings Goal Deposit transaction
  const handleGoalTxnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTxnAmount) return;

    try {
      const response = await fetch(`/api/personal-finance/savings/${selectedGoal._id}/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          amount: parseFloat(goalTxnAmount),
          type: goalTxnType
        })
      });

      if (response.ok) {
        alert('Milestone cash adjustments logged!');
        setSelectedGoal(null);
        setGoalTxnAmount('');
        loadPersonalFinanceData();
      }
    } catch (_) {}
  };

  const handleExportCSV = () => {
    window.open(`/api/personal-finance/reports/export`, '_blank');
  };

  // Filtered income/expense lists for UI
  const filteredIncomes = incomes.filter(i => {
    const matchesSearch = i.description?.toLowerCase().includes(incomeSearch.toLowerCase());
    const matchesCat = incomeCatFilter ? i.category?.name === incomeCatFilter : true;
    return matchesSearch && matchesCat;
  });

  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = e.description?.toLowerCase().includes(expenseSearch.toLowerCase());
    const matchesCat = expenseCatFilter ? e.category?.name === expenseCatFilter : true;
    const matchesTag = expenseTagFilter ? e.tags?.includes(expenseTagFilter) : true;
    return matchesSearch && matchesCat && matchesTag;
  });

  // Calculate expense calendar events mapping (simple mock for current month)
  const currentMonthDays = Array.from({ length: 30 }, (_, idx) => idx + 1);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2 text-left">
        <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
        <div className="h-64 bg-slate-900 rounded-2xl"></div>
      </div>
    );
  }

  // Visual HSL colors
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6 text-left relative">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
            Personal Finance & Expenses
            <PiggyBank className="h-5 w-5 text-indigo-400 font-bold" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Build budgets, track allowances and freelancing credits, monitor utility spends, and check your AI financial advisory logs.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-indigo-600/20 transition-all shadow"
        >
          <Download className="h-4 w-4" /> Export Report (CSV)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-900 gap-6 text-xs font-bold uppercase tracking-wider text-slate-500">
        <button
          onClick={() => setActiveTab('hub')}
          className={`pb-3 transition-colors ${activeTab === 'hub' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Finance Hub
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`pb-3 transition-colors ${activeTab === 'income' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Income statements
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`pb-3 transition-colors ${activeTab === 'expense' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Expense Registers
        </button>
        <button
          onClick={() => setActiveTab('budget')}
          className={`pb-3 transition-colors ${activeTab === 'budget' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Budgets Config
        </button>
        <button
          onClick={() => setActiveTab('savings')}
          className={`pb-3 transition-colors ${activeTab === 'savings' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Savings Goals
        </button>
      </div>

      {/* 1. FINANCIAL HUB TAB */}
      {activeTab === 'hub' && (
        <div className="space-y-6">
          {/* Row 1: KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Total Income</span>
                <h3 className="text-xl font-bold mt-1 text-slate-100">₹{summary.totalIncome.toLocaleString()}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Total Expense</span>
                <h3 className="text-xl font-bold mt-1 text-slate-100">₹{summary.totalExpense.toLocaleString()}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Net Balance Surplus</span>
                <h3 className={`text-xl font-bold mt-1 ${summary.netBalance >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
                  ₹{summary.netBalance.toLocaleString()}
                </h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Savings Rate index</span>
                <h3 className="text-xl font-bold mt-1 text-slate-100">{summary.savingsRate}%</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Row 2: Charts and Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Cash flow line chart */}
            <div className="lg:col-span-8 glass-panel border-slate-900 rounded-3xl p-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Cash Flow Trends (Income vs Expense)
              </h4>
              <div className="h-56">
                {trends.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">Seeding cashflow trends chart...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInc)" name="Income" />
                      <Area type="monotone" dataKey="expense" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" name="Expense" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Expense Categories Distribution Pie */}
            <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 flex flex-col items-center">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center mb-4">
                Expense Category Breakdown
              </h4>
              <div className="h-44 w-full flex items-center justify-center">
                {categoryBreakdown.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">Create an expense log to view distribution</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              {/* Category Legends list */}
              <div className="w-full grid grid-cols-2 gap-2 text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wide">
                {categoryBreakdown.slice(0, 4).map((c, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="truncate">{c.name} (₹{c.value.toLocaleString()})</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: AI Intelligence Advisor Insights */}
          <div className="glass-panel border-slate-900 rounded-3xl p-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-indigo-400" /> Smart Financial Intelligence Advisor
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-left">
              {insights.map((insight) => (
                <div key={insight._id} className="p-4 rounded-2xl bg-indigo-950/15 border border-indigo-900/20 flex flex-col justify-between space-y-3">
                  <div>
                    <h5 className="font-extrabold text-slate-200 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                      {insight.title}
                    </h5>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed font-medium">
                      {insight.message}
                    </p>
                  </div>
                  {insight.score !== undefined && (
                    <div className="flex justify-between items-center border-t border-indigo-900/30 pt-2 text-[10px] font-bold text-indigo-400 uppercase">
                      <span>Index Score</span>
                      <span className="text-slate-100 font-extrabold">{insight.score} / 100</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. INCOME STATEMENT TAB */}
      {activeTab === 'income' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Income log form */}
          <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-indigo-400" /> Log Income Credits
            </h4>

            <form onSubmit={handleLogIncome} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="E.g., 5000"
                  value={incAmount}
                  onChange={(e) => setIncAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Select Income Category</label>
                <select
                  required
                  value={incCatId}
                  onChange={(e) => setIncCatId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-400 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Choose Category --</option>
                  {incomeCats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Description / Notes</label>
                <input
                  type="text"
                  placeholder="Allowance from Parents, Part-Time wage, etc."
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={incDate}
                  onChange={(e) => setIncDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 border-t border-slate-900 pt-3">
                <input
                  type="checkbox"
                  id="incRecurring"
                  checked={incRecurring}
                  onChange={(e) => setIncRecurring(e.target.checked)}
                  className="rounded border-slate-900 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="incRecurring" className="text-[10px] font-bold text-slate-400 uppercase">Is Recurring Stipend?</label>
              </div>

              {incRecurring && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Interval Cycle</label>
                  <select
                    value={incInterval}
                    onChange={(e) => setIncInterval(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-400"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold shadow-md active:scale-95 transition-all"
              >
                Log Income Entry
              </button>
            </form>
          </div>

          {/* Income statement list */}
          <div className="lg:col-span-8 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Income History Statements</h4>
              
              <div className="flex gap-2 text-xs w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search description..."
                  value={incomeSearch}
                  onChange={(e) => setIncomeSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none w-full sm:w-36"
                />
                <select
                  value={incomeCatFilter}
                  onChange={(e) => setIncomeCatFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-900 rounded-xl px-2 py-1.5 text-slate-400 focus:outline-none"
                >
                  <option value="">All Categories</option>
                  {incomeCats.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto pr-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-900/60 pb-3 block table-row font-bold uppercase tracking-wider">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Source Category</th>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5 text-right">Amount</th>
                    <th className="py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {filteredIncomes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 italic">No matching incomes found.</td>
                    </tr>
                  ) : (
                    filteredIncomes.map((i) => (
                      <tr key={i._id}>
                        <td className="py-3 text-slate-500">{new Date(i.date).toLocaleDateString()}</td>
                        <td className="py-3 font-semibold text-slate-200">{i.category?.name || 'Allowance'}</td>
                        <td className="py-3 text-slate-400">{i.description || 'N/A'}</td>
                        <td className="py-3 text-right text-emerald-400 font-bold">₹{i.amount.toLocaleString()}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDeleteTransaction('income', i._id)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. EXPENSE LOGGERS TAB */}
      {activeTab === 'expense' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Expense form */}
            <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Plus className="h-4.5 w-4.5 text-indigo-400" /> Log Spends Debits
              </h4>

              <form onSubmit={handleLogExpense} className="space-y-4 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="E.g., 650"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Select Expense Category</label>
                  <select
                    required
                    value={expCatId}
                    onChange={(e) => setExpCatId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-400 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Choose Category --</option>
                    {expenseCats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="E.g., Dinner at Foodcourt"
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Transaction Tags (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="Leisure, food, books"
                    value={expTagsField}
                    onChange={(e) => setExpTagsField(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Notes</label>
                    <input
                      type="text"
                      placeholder="Extra notes..."
                      value={expNotes}
                      onChange={(e) => setExpNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-slate-900 pt-3">
                  <input
                    type="checkbox"
                    id="expRecurring"
                    checked={expRecurring}
                    onChange={(e) => setExpRecurring(e.target.checked)}
                    className="rounded border-slate-900 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="expRecurring" className="text-[10px] font-bold text-slate-400 uppercase">Is Recurring Bill?</label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-semibold shadow-md active:scale-95 transition-all"
                >
                  Log Expense Debit
                </button>
              </form>
            </div>

            {/* Expense table list */}
            <div className="lg:col-span-8 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expense Transaction Registers</h4>
                
                <div className="flex gap-2 text-xs w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search description..."
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)} // Search
                    className="bg-slate-950 border border-slate-900 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none w-full sm:w-36"
                  />
                  <select
                    value={expenseCatFilter}
                    onChange={(e) => setExpenseCatFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-900 rounded-xl px-2 py-1.5 text-slate-400 focus:outline-none"
                  >
                    <option value="">All Categories</option>
                    {expenseCats.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto max-h-96 overflow-y-auto pr-1">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-900/60 pb-3 block table-row font-bold uppercase tracking-wider">
                      <th className="py-2.5">Date</th>
                      <th className="py-2.5">Item Spends</th>
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">Tags</th>
                      <th className="py-2.5 text-right">Amount</th>
                      <th className="py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/40">
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 italic">No expenditures logged yet.</td>
                      </tr>
                    ) : (
                      filteredExpenses.map((e) => (
                        <tr key={e._id}>
                          <td className="py-3 text-slate-500">{new Date(e.date).toLocaleDateString()}</td>
                          <td className="py-3 font-semibold text-slate-200">{e.description || 'N/A'}</td>
                          <td className="py-3 text-slate-400">{e.category?.name || 'General'}</td>
                          <td className="py-3">
                            <div className="flex gap-1 flex-wrap">
                              {e.tags?.map((t: string, idx: number) => (
                                <span key={idx} className="bg-indigo-950/20 text-indigo-400 border border-indigo-900/30 text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold uppercase tracking-wider">
                                  <Tag className="h-2 w-2" /> {t}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 text-right text-rose-400 font-bold">₹{e.amount.toLocaleString()}</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleDeleteTransaction('expense', e._id)}
                              className="text-rose-400 hover:text-rose-300 p-1"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Expense Calendar widget */}
          <div className="glass-panel border-slate-900 rounded-3xl p-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-indigo-400" /> Daily Expenditure Calendar Grid
            </h4>
            <div className="grid grid-cols-7 gap-3 text-center text-xs">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-slate-500 font-bold uppercase tracking-wider">{d}</div>
              ))}
              {currentMonthDays.map((day) => {
                // Find if there are transactions on this mock date index
                const dayExp = expenses.filter(e => new Date(e.date).getDate() === day);
                const hasTxns = dayExp.length > 0;
                const totalSpent = dayExp.reduce((sum, e) => sum + e.amount, 0);

                return (
                  <div
                    key={day}
                    className={`relative p-3 border border-slate-900/60 rounded-xl flex flex-col justify-between items-center min-h-16 ${
                      hasTxns ? 'bg-indigo-950/5 border-indigo-900/20' : 'bg-slate-950/10'
                    }`}
                  >
                    <span className="font-bold text-slate-400 text-[10px] self-start leading-none">{day}</span>
                    {hasTxns && (
                      <span className="text-[10px] font-black text-rose-400 mt-2">
                        ₹{totalSpent.toLocaleString()}
                      </span>
                    )}
                    {hasTxns && (
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1 animate-pulse"></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. BUDGET TAB */}
      {activeTab === 'budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Create Budget */}
          <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-indigo-400" /> Declare Dues Limits Cap
            </h4>
            <form onSubmit={handleCreateBudget} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Limit Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="E.g., 15000"
                  value={budAmount}
                  onChange={(e) => setBudAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Period Cycle</label>
                <select
                  value={budPeriod}
                  onChange={(e) => setBudPeriod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-400"
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Semester">Semester</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Limit to Category (Optional)</label>
                <select
                  value={budCatId}
                  onChange={(e) => setBudCatId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-400"
                >
                  <option value="">-- Apply to All Spends --</option>
                  {expenseCats.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 px-4 font-semibold active:scale-95 transition-all"
              >
                Create Budget Cap
              </button>
            </form>
          </div>

          {/* List budgets progress */}
          <div className="lg:col-span-8 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Budgets Monitors</h4>
            <div className="space-y-6">
              {budgets.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-6 text-center">No active budget allocations defined.</p>
              ) : (
                budgets.map((b) => {
                  const pct = Math.min(100, Math.round((b.spentAmount / b.amount) * 100));
                  return (
                    <div key={b._id} className="p-4 border border-slate-900/60 bg-slate-950/20 rounded-2xl space-y-3 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-extrabold text-slate-200">
                            {b.category ? `Category: ${b.category.name}` : 'Overall Budget Cap'}
                          </h5>
                          <span className="text-[10px] text-slate-500">Period: {b.period}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-200 block">₹{b.spentAmount.toLocaleString()} / ₹{b.amount.toLocaleString()}</span>
                          <span className={`text-[9px] font-bold ${b.isExceeded ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
                            {b.isExceeded ? 'LIMIT EXCEEDED' : `${pct}% Spent`}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${b.isExceeded ? 'bg-rose-500' : 'bg-indigo-500'}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-500">
                          <span>Exhausted: {pct}%</span>
                          <span>Remaining Balance: ₹{b.remainingAmount.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. SAVINGS TAB */}
      {activeTab === 'savings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Create Goal */}
          <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-indigo-400" /> Create Savings Target Goal
            </h4>
            <form onSubmit={handleCreateSavingsGoal} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. New Laptop Fund"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="45000"
                    value={goalTarget}
                    onChange={(e) => setGoalTarget(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Target Monthly</label>
                  <input
                    type="number"
                    placeholder="3000"
                    value={goalContribution}
                    onChange={(e) => setGoalContribution(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Deadline Date</label>
                <input
                  type="date"
                  required
                  value={goalDeadline}
                  onChange={(e) => setGoalDeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 px-4 font-semibold active:scale-95 transition-all"
              >
                Launch Savings Goal
              </button>
            </form>
          </div>

          {/* Goals list */}
          <div className="lg:col-span-8 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Savings Goals Milestones</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savingsGoals.length === 0 ? (
                <p className="text-slate-500 text-xs italic py-6 text-center col-span-2">No active savings targets initialized.</p>
              ) : (
                savingsGoals.map((g) => {
                  const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                  return (
                    <div key={g._id} className="p-5 border border-slate-900/60 bg-slate-950/20 rounded-2xl flex flex-col justify-between min-h-48 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <h5 className="font-extrabold text-slate-200 text-sm">{g.name}</h5>
                          <span className="text-[10px] text-slate-500 block mt-0.5">Deadline: {new Date(g.deadline).toLocaleDateString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-indigo-400 text-sm block">₹{g.currentAmount.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-500">/ ₹{g.targetAmount.toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="space-y-1 mt-4">
                        <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
                          <span>{pct}% Achieved</span>
                          <span>Remaining: ₹{Math.max(0, g.targetAmount - g.currentAmount).toLocaleString()}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-between items-center border-t border-slate-900/60 pt-3 mt-3">
                        <button
                          onClick={() => {
                            setSelectedGoal(g);
                            setGoalTxnType('Deposit');
                          }}
                          className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-bold px-3 py-1.5 rounded-lg text-[10px] hover:bg-indigo-600/20 transition-all"
                        >
                          + Deposit/Contribution
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('Delete this savings goal?')) {
                              fetch(`/api/personal-finance/savings/${g._id}`, {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${accessToken}` }
                              }).then(() => loadPersonalFinanceData());
                            }
                          }}
                          className="text-rose-400 hover:text-rose-300 p-1"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contribution overlay modal */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedGoal(null)}></div>
          <div className="glass-panel border-slate-900 rounded-3xl p-6 w-full max-w-sm relative z-10 space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-100 text-lg">Goal adjustments: "{selectedGoal.name}"</h4>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Target: ₹{selectedGoal.targetAmount.toLocaleString()} | Current: ₹{selectedGoal.currentAmount.toLocaleString()}
              </span>
            </div>

            <form onSubmit={handleGoalTxnSubmit} className="space-y-4 text-xs text-left">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Transaction Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGoalTxnType('Deposit')}
                    className={`py-2 rounded-xl font-bold transition-all border ${
                      goalTxnType === 'Deposit'
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoalTxnType('Withdrawal')}
                    className={`py-2 rounded-xl font-bold transition-all border ${
                      goalTxnType === 'Withdrawal'
                        ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    Withdrawal
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Adjustment Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="E.g., 2000"
                  value={goalTxnAmount}
                  onChange={(e) => setGoalTxnAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedGoal(null)}
                  className="border border-slate-800 bg-slate-900 text-slate-400 py-2 px-4 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl active:scale-95 transition-all"
                >
                  Post Logs
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
