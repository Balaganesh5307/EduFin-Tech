import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { PaymentModal } from '../../components/payment-modal';
import { StudentDashboard } from '../student/dashboard';
import { ParentDashboard } from '../parent/dashboard';
import { FacultyDashboard } from '../faculty/dashboard';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  CreditCard,
  TrendingUp,
  PiggyBank,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Plus,
  BrainCircuit,
  GraduationCap,
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  Award,
  Users,
  Terminal,
  Activity,
  HardDrive
} from 'lucide-react';

export const DashboardsIndex: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [payModalOpen, setPayModalOpen] = useState<boolean>(false);
  const [expenseTitle, setExpenseTitle] = useState<string>('');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseCategory, setExpenseCategory] = useState<string>('Food');
  const [markedAttendance, setMarkedAttendance] = useState<Record<string, string>>({});
  const [aiAdvice, setAiAdvice] = useState<string>('Analyzing your account logs to generate budget advisory tips...');

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/dashboard', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (response.ok) {
          const resData = await response.json();
          setData(resData);
        }
      } catch (err) {
        console.warn('Dashboard API failed. Loading mock data based on role...', err);
      }
      
      // AI budget advice loader simulation
      try {
        const aiResponse = await fetch('/api/ai/budget-advice', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          setAiAdvice(aiData.advice);
        }
      } catch (_) {}
      
      setLoading(false);
    };

    fetchDashboard();
  }, [user, accessToken]);

  if (loading || !user) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-28 bg-slate-900 rounded-2xl"></div>
          <div className="h-28 bg-slate-900 rounded-2xl"></div>
          <div className="h-28 bg-slate-900 rounded-2xl"></div>
          <div className="h-28 bg-slate-900 rounded-2xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="h-96 bg-slate-900 rounded-2xl md:col-span-8"></div>
          <div className="h-96 bg-slate-900 rounded-2xl md:col-span-4"></div>
        </div>
      </div>
    );
  }

  // Handle Pay trigger
  const triggerPayment = (invoice: any) => {
    setActiveInvoice(invoice);
    setPayModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPayModalOpen(false);
    alert('Payment mock posted successfully!');
    // Re-trigger update logic locally
    if (data && data.summary) {
      setData({
        ...data,
        summary: {
          ...data.summary,
          pendingFees: Math.max(0, data.summary.pendingFees - activeInvoice.amount)
        }
      });
    }
  };

  const submitExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || !expenseAmount) return;

    const amt = parseFloat(expenseAmount);
    if (isNaN(amt)) return;

    // Locally append to expense arrays for high fidelity visual interactivity
    const newExpense = {
      id: 'e_new_' + Date.now(),
      title: expenseTitle,
      amount: amt,
      category: expenseCategory,
      date: new Date().toISOString().split('T')[0]
    };

    const currentExpenses = data.recentExpenses || [];
    const currentSum = data.summary || {};

    setData({
      ...data,
      recentExpenses: [newExpense, ...currentExpenses],
      summary: {
        ...currentSum,
        monthlyExpenses: (currentSum.monthlyExpenses || 0) + amt
      }
    });

    setExpenseTitle('');
    setExpenseAmount('');
  };

  // ----------------------------------------------------
  // 1. STUDENT VIEW
  // ----------------------------------------------------
  const renderStudent = () => {
    const sum = data?.summary || { pendingFees: 45000, attendanceRate: 88, monthlyBudgetLimit: 12000, monthlyExpenses: 8740, savingsGoalTarget: 25000, savingsGoalCurrent: 18500, savingsGoalTitle: "Semester Exchange Fund" };
    const courses = data?.courses || [];
    const fees = data?.feeInstallments || [];
    const expenses = data?.recentExpenses || [];
    const expenseChartData = [
      { name: 'Academics', value: 2400, color: '#6366f1' },
      { name: 'Food', value: 3850, color: '#10b981' },
      { name: 'Travel', value: 1500, color: '#f59e0b' },
      { name: 'Other', value: 990, color: '#ec4899' }
    ];

    const budgetPercent = Math.min(100, Math.round((sum.monthlyExpenses / sum.monthlyBudgetLimit) * 100));
    const savingsPercent = Math.min(100, Math.round((sum.savingsGoalCurrent / sum.savingsGoalTarget) * 100));

    return (
      <div className="space-y-6">
        {/* Row 1: Quick Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-slate-900 relative overflow-hidden group">
            <div className="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Outstanding Fees</span>
              <h3 className="text-2xl font-bold mt-1 text-slate-100">₹{sum.pendingFees.toLocaleString()}</h3>
              <button
                onClick={() => triggerPayment({ id: 'tuition_fee', category: 'Tuition Installment', amount: sum.pendingFees })}
                className="mt-3.5 flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1.5 px-3 rounded-lg shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 active:scale-95 transition-all"
              >
                <CreditCard className="h-3.5 w-3.5" /> Pay Online
              </button>
            </div>
            <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-slate-900">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Avg Attendance</span>
              <h3 className="text-2xl font-bold mt-1 text-slate-100">{sum.attendanceRate}%</h3>
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-3">
                <CheckCircle2 className="h-3.5 w-3.5" /> Satisfactory threshold
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-slate-900">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Budget Limit</span>
              <h3 className="text-2xl font-bold mt-1 text-slate-100">₹{sum.monthlyExpenses.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ ₹{sum.monthlyBudgetLimit.toLocaleString()}</span></h3>
              <div className="w-32 bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${budgetPercent > 85 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${budgetPercent}%` }}></div>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl flex items-center justify-between border-slate-900">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Goal Savings</span>
              <h3 className="text-2xl font-bold mt-1 text-slate-100">₹{sum.savingsGoalCurrent.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ ₹{sum.savingsGoalTarget.toLocaleString()}</span></h3>
              <div className="w-32 bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${savingsPercent}%` }}></div>
              </div>
            </div>
            <div className="h-12 w-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400">
              <PiggyBank className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Row 2: AI advice panel */}
        <div className="glass-panel border-indigo-500/20 bg-indigo-500/5 rounded-2xl p-5 flex items-start gap-4">
          <div className="rounded-xl bg-indigo-600/20 p-2 text-indigo-400 shrink-0">
            <BrainCircuit className="h-6 w-6 animate-pulse" />
          </div>
          <div className="text-left space-y-1.5">
            <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
              AI Budget Advisor <span className="text-[9px] px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full font-bold uppercase tracking-wider">Predictive</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">{aiAdvice}</p>
          </div>
        </div>

        {/* Row 3: Bento charts & lists */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Courses & Attendance tracker */}
          <div className="glass-panel border-slate-900 rounded-2xl p-6 md:col-span-8 space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-400" /> Current Academic Courses
            </h4>
            <div className="divide-y divide-slate-900/60">
              {courses.map((course: any) => (
                <div key={course.id} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="text-left">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{course.code}</span>
                    <h5 className="text-sm font-bold text-slate-200">{course.name}</h5>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Credits</span>
                      <span className="text-xs font-bold text-slate-300">{course.credits}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Attendance</span>
                      <span className={`text-xs font-bold ${course.attendance >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {course.attendance}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Expense logging */}
          <div className="glass-panel border-slate-900 rounded-2xl p-6 md:col-span-4 space-y-4 text-left">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Plus className="h-4.5 w-4.5 text-indigo-400" /> Log Daily Expense
            </h4>
            <form onSubmit={submitExpense} className="space-y-3.5 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g., Text Book purchase"
                  value={expenseTitle}
                  onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="1200"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-400 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Food">Food</option>
                    <option value="Academics">Academics</option>
                    <option value="Travel">Travel</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-semibold shadow-md active:scale-95 transition-all"
              >
                Log Transaction
              </button>
            </form>
          </div>
        </div>

        {/* Row 4: Expenses List & Fee categories */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="glass-panel border-slate-900 rounded-2xl p-6 md:col-span-8 space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-400" /> Recent Expenditures
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-900/60 pb-3 block table-row">
                    <th className="py-2.5 font-bold uppercase tracking-wider">Transaction</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider">Category</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider">Date</th>
                    <th className="py-2.5 font-bold uppercase tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/40">
                  {expenses.map((e: any) => (
                    <tr key={e.id}>
                      <td className="py-3 font-semibold text-slate-200">{e.title}</td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-bold tracking-wide uppercase text-slate-400">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500">{e.date}</td>
                      <td className="py-3 text-right font-bold text-slate-200">₹{e.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel border-slate-900 rounded-2xl p-6 md:col-span-4 space-y-4 text-left">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="h-4.5 w-4.5 text-indigo-400" /> Bill Schedule
            </h4>
            <div className="space-y-3">
              {fees.map((fee: any) => (
                <div key={fee.id} className="p-3.5 rounded-xl border border-slate-900 bg-slate-950/20 flex justify-between items-center text-xs">
                  <div>
                    <h5 className="font-semibold text-slate-200">{fee.category}</h5>
                    <span className="text-[10px] text-slate-500">Due: {fee.dueDate}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-300 block mb-1">₹{fee.amount.toLocaleString()}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      fee.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {fee.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    );
  };

  // ----------------------------------------------------
  // 2. PARENT VIEW
  // ----------------------------------------------------
  const renderParent = () => {
    return <ParentDashboard />;
  };

  // ----------------------------------------------------
  // 3. FACULTY VIEW
  // ----------------------------------------------------
  const renderFaculty = () => {
    return <FacultyDashboard />;
  };

  // ----------------------------------------------------
  // 4. ADMIN & SUPERADMIN VIEW
  // ----------------------------------------------------
  const renderAdmin = () => {
    const adminData = data || {
      summary: { totalRevenue: 28400000, pendingFees: 4500000, scholarshipDisbursed: 1200000, activeLoans: 8, feeDefaultRate: 4.8 },
      revenueTrends: [
        { month: 'Jan', collections: 4200000, projected: 4500000 },
        { month: 'Feb', collections: 3800000, projected: 4000000 },
        { month: 'Mar', collections: 5100000, projected: 5000000 },
        { month: 'Apr', collections: 2900000, projected: 3000000 },
        { month: 'May', collections: 6400000, projected: 6500000 },
        { month: 'Jun', collections: 6000000, projected: 6200000 }
      ],
      feeDefaultersRisk: [
        { id: 'r1', studentName: 'David Miller', studentId: 'STU-483', risk: 'High', dueAmount: 75000, defaultProb: 88 },
        { id: 'r2', studentName: 'Emma Watson', studentId: 'STU-102', risk: 'Medium', dueAmount: 40000, defaultProb: 52 }
      ],
      scholarshipStats: { applied: 38, approved: 12, pending: 26 },
      loanStats: { applied: 14, approved: 6, pending: 8 },
      systemHealth: user.role === 'SuperAdmin' ? { dbStatus: 'Connected', cpuLoad: '12%', activeSessions: 231, auditAlerts: 0 } : undefined
    };

    return (
      <div className="space-y-6">
        {/* Row 1: Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel border-slate-900 p-5 rounded-2xl text-left space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Collection Revenue</span>
            <h4 className="text-2xl font-bold text-slate-100">₹{(adminData.summary?.totalRevenue || 0).toLocaleString()}</h4>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-2">
              <TrendingUp className="h-3.5 w-3.5" /> +12.4% vs last semester
            </span>
          </div>

          <div className="glass-panel border-slate-900 p-5 rounded-2xl text-left space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Pending Fee Collections</span>
            <h4 className="text-2xl font-bold text-slate-100">₹{(adminData.summary?.pendingFees || 0).toLocaleString()}</h4>
            <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-1 mt-2">
              <AlertTriangle className="h-3.5 w-3.5" /> 84 students default risk
            </span>
          </div>

          <div className="glass-panel border-slate-900 p-5 rounded-2xl text-left space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Active Campus Loans</span>
            <h4 className="text-2xl font-bold text-slate-100">{adminData.summary?.activeLoans} Disbursed</h4>
            <span className="text-[10px] text-slate-500 font-semibold block mt-2">₹1,850,000 total pipeline size</span>
          </div>

          <div className="glass-panel border-slate-900 p-5 rounded-2xl text-left space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Scholarship Disbursements</span>
            <h4 className="text-2xl font-bold text-slate-100">₹{(adminData.summary?.scholarshipDisbursed || 0).toLocaleString()}</h4>
            <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1 mt-2">
              <Award className="h-3.5 w-3.5" /> 12 merit applications approved
            </span>
          </div>
        </div>

        {/* Row 2: AI predictive panel */}
        <div className="glass-panel border-indigo-500/20 bg-indigo-500/5 rounded-2xl p-5 flex items-start gap-4">
          <div className="rounded-xl bg-indigo-600/20 p-2 text-indigo-400 shrink-0">
            <BrainCircuit className="h-6 w-6 animate-pulse" />
          </div>
          <div className="text-left space-y-1">
            <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
              AI Campus Finance Engine <span className="text-[9px] px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full font-bold uppercase tracking-wider">Active</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Institutions fee collection default rate is projected at <strong>{adminData.summary?.feeDefaultRate}%</strong> for this cycle. AI risk analyzers flagged 2 accounts in the high-probability bracket (default &gt; 80%). We recommend configuring auto-reminders before the 15th August deadline.
            </p>
          </div>
        </div>

        {/* Row 3: Revenue chart & AI risk list */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Revenue chart */}
          <div className="glass-panel border-slate-900 rounded-2xl p-6 lg:col-span-8 space-y-4 text-left">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-400" /> Revenue Collection Streams
              </h4>
              <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full font-semibold border border-indigo-500/10 uppercase">Financial Year 2026</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={adminData.revenueTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v/100000}L`} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="collections" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Default risk assessment */}
          <div className="glass-panel border-slate-900 rounded-2xl p-6 lg:col-span-4 space-y-4 text-left">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <BrainCircuit className="h-4.5 w-4.5 text-indigo-400" /> AI Fee Default Risk
            </h4>
            <div className="space-y-3.5">
              {adminData.feeDefaultersRisk?.map((r: any) => (
                <div key={r.id} className="p-3.5 rounded-xl border border-slate-900 bg-slate-950/20 space-y-2 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-semibold text-slate-200">{r.studentName}</h5>
                      <span className="text-[9px] text-slate-500">ID: {r.studentId}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      r.risk === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {r.risk} Risk
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-900/60 pt-2">
                    <span>Due Amount: <strong>₹{r.dueAmount.toLocaleString()}</strong></span>
                    <span>Prob: <strong className={r.risk === 'High' ? 'text-rose-400' : 'text-amber-400'}>{r.defaultProb}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: Super Admin exclusive audit widgets */}
        {user.role === 'SuperAdmin' && adminData.systemHealth && (
          <div className="glass-panel border-slate-900 rounded-2xl p-6 text-left space-y-4">
            <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <Terminal className="h-4.5 w-4.5" /> Super Admin Security Center
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                <HardDrive className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Database Node</span>
                  <span className="font-bold text-slate-200">{adminData.systemHealth.dbStatus}</span>
                </div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                <Activity className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Server CPU Load</span>
                  <span className="font-bold text-slate-200">{adminData.systemHealth.cpuLoad}</span>
                </div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                <Users className="h-5 w-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Active Sessions</span>
                  <span className="font-bold text-slate-200">{adminData.systemHealth.activeSessions}</span>
                </div>
              </div>
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Audit Alerts</span>
                  <span className="font-bold text-emerald-400">{adminData.systemHealth.auditAlerts} Warnings</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getDashboardBody = () => {
    switch (user.role) {
      case 'Student':
        return <StudentDashboard />;
      case 'Parent':
        return renderParent();
      case 'Faculty':
        return renderFaculty();
      case 'Admin':
      case 'SuperAdmin':
        return renderAdmin();
      default:
        return <div>Invalid View</div>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Dashboard Greeting Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
            Welcome back, {user.name}
            <Sparkles className="h-5 w-5 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
          </h1>
          <p className="text-sm text-slate-400 mt-1">Here is a summary of your campus financial actions today.</p>
        </div>
        <div className="text-xs bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 font-medium text-slate-400 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-400" /> {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Main Dashboard Render */}
      {getDashboardBody()}

      {/* Razorpay checkout loader */}
      <PaymentModal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        invoice={activeInvoice}
        onSuccess={handlePaymentSuccess}
      />
    </motion.div>
  );
};
