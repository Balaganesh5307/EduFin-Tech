import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import {
  TrendingUp,
  CreditCard,
  Award,
  GraduationCap,
  Users,
  Search,
  BookOpen,
  Calendar,
  Sparkles,
  Download,
  Activity,
  ShieldCheck,
  AlertTriangle,
  BrainCircuit,
  Filter,
  RefreshCw,
  Sliders,
  DollarSign
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export const AdminAnalytics: React.FC = () => {
  const { user, accessToken } = useAuth();

  // Search & Filter state
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [acadYear, setAcadYear] = useState<string>('2026');
  const [semester, setSemester] = useState<string>('Semester 5');
  const [deptCode, setDeptCode] = useState<string>('CSE');

  // BI Data State
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Report Generator State
  const [reportType, setReportType] = useState<string>('Revenue');
  const [reportFormat, setReportFormat] = useState<'PDF' | 'Excel' | 'CSV'>('CSV');
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [generating, setGenerating] = useState<boolean>(false);

  // Activity stream logs state (admin only)
  const [activities, setActivities] = useState<any[]>([]);

  const fetchAnalytics = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await fetch(`/api/analytics/dashboard?acadYear=${acadYear}&semester=${semester}&dept=${deptCode}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalyticsData(data);
        if (data.activities) setActivities(data.activities);
      }
    } catch (err) {
      console.warn('Failed retrieving analytics database, loading offline mockups...', err);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    if (user) fetchAnalytics();
  }, [user, acadYear, semester, deptCode]);

  // Report download builder
  const triggerReportDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch('/api/analytics/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          reportType,
          format: reportFormat,
          dateFrom,
          dateTo,
          department: deptCode
        })
      });

      if (res.ok) {
        if (reportFormat === 'CSV' || reportFormat === 'Excel') {
          const blob = await res.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `edufin_report_${reportType.toLowerCase()}_${Date.now()}.${reportFormat === 'CSV' ? 'csv' : 'xls'}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        } else {
          // PDF mock compiler
          const data = await res.json();
          setGeneratedReport(data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading || !analyticsData) {
    return (
      <div className="space-y-6 animate-pulse p-2 text-left">
        <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-28 bg-slate-900 rounded-2xl"></div>
          <div className="h-28 bg-slate-900 rounded-2xl"></div>
          <div className="h-28 bg-slate-900 rounded-2xl"></div>
          <div className="h-28 bg-slate-900 rounded-2xl"></div>
        </div>
        <div className="h-80 bg-slate-900 rounded-3xl"></div>
      </div>
    );
  }

  const role = user?.role || 'Admin';
  const kpis = analyticsData.kpis || {};
  const viz = analyticsData.visualizations || {};
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-6 text-left relative">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
            Business Intelligence & Executive Analytics
            <Sparkles className="h-5 w-5 text-indigo-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">Institutional records metrics aggregated curves for: <strong>{role}</strong></p>
        </div>

        <button
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-850 hover:text-slate-200 active:scale-95 transition-all"
        >
          <RefreshCw className={`h-4 w-4 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Global Search & Parameter Filters bar */}
      <div className="glass-panel border-slate-900 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Academic Year</label>
          <select
            value={acadYear}
            onChange={(e) => setAcadYear(e.target.value)}
            className="w-full bg-slate-900 border border-slate-900 rounded-xl px-3 py-2.5 text-xs text-slate-400 focus:outline-none"
          >
            <option value="2025">2025 - 2026</option>
            <option value="2026">2026 - 2027</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Semester Term</label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full bg-slate-900 border border-slate-900 rounded-xl px-3 py-2.5 text-xs text-slate-400 focus:outline-none"
          >
            <option value="Semester 3">Semester 3</option>
            <option value="Semester 5">Semester 5</option>
            <option value="Semester 7">Semester 7</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Department</label>
          <select
            value={deptCode}
            onChange={(e) => setDeptCode(e.target.value)}
            className="w-full bg-slate-900 border border-slate-900 rounded-xl px-3 py-2.5 text-xs text-slate-400 focus:outline-none"
          >
            <option value="CSE">Computer Science (CSE)</option>
            <option value="ECE">Electronics (ECE)</option>
            <option value="ME">Mechanical Engineering (ME)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Filter Start Date</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full bg-slate-900 border border-slate-900 rounded-xl px-3.5 py-2 text-xs text-slate-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Filter End Date</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full bg-slate-900 border border-slate-900 rounded-xl px-3.5 py-2 text-xs text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* ----------------------------------------------------
          A. SUPER ADMIN / ADMIN BI DASHBOARD
      ---------------------------------------------------- */}
      {(role === 'SuperAdmin' || role === 'Admin') && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Total Revenue (INR)</span>
                <h3 className="text-xl font-bold text-slate-100 mt-1">₹{(kpis.totalRevenue || 0).toLocaleString()}</h3>
                <span className="text-[10px] text-emerald-400 font-semibold block pt-1.5">₹{(kpis.pendingFees || 0).toLocaleString()} outstanding</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Students Strength</span>
                <h3 className="text-xl font-bold text-slate-100 mt-1">{kpis.totalStudents || 0} Registered</h3>
                <span className="text-[10px] text-slate-500 font-medium block pt-1.5">MAU rate: {kpis.monthlyActiveUsers}%</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Scholarship Waivers</span>
                <h3 className="text-xl font-bold text-slate-100 mt-1">₹{(kpis.scholarshipDistributed || 0).toLocaleString()}</h3>
                <span className="text-[10px] text-indigo-400 font-semibold block pt-1.5">Tuition credits sync active</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Education Loan Lines</span>
                <h3 className="text-xl font-bold text-slate-100 mt-1">₹{(kpis.loanPortfolio || 0).toLocaleString()}</h3>
                <span className="text-[10px] text-indigo-400 font-semibold block pt-1.5">Approved collateral aids</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Charts Bento */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Revenue Trend chart */}
            <div className="lg:col-span-8 glass-panel border-slate-900 rounded-3xl p-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <TrendingUp className="h-4.5 w-4.5 text-indigo-400" /> Revenue Collection Collections Timeline
              </h4>
              <div className="h-64">
                {viz.monthlyCollections ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={viz.monthlyCollections} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="amount" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-500 text-xs italic py-16 text-center">No trend metrics found.</p>
                )}
              </div>
            </div>

            {/* Department Revenue Breakdown */}
            <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 text-center">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Department Allocations</h4>
              <div className="h-56">
                {viz.departmentRevenue ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={viz.departmentRevenue} margin={{ left: -25 }}>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={30}>
                        {viz.departmentRevenue.map((_: any, idx: number) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-slate-500 text-xs italic py-16 text-center">No department metrics.</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Split Pie charts */}
            <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 flex flex-col items-center justify-center">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Waivers vs Loan Splitting</h4>
              <div className="h-44 w-full">
                {viz.loanScholarshipSplit ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={viz.loanScholarshipSplit}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {viz.loanScholarshipSplit.map((_: any, idx: number) => (
                          <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
              <div className="space-y-2.5 w-full text-xs mt-2">
                {viz.loanScholarshipSplit?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-950/30 p-2.5 rounded-xl border border-slate-900">
                    <span className="flex items-center gap-2 text-slate-400">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      {item.name}
                    </span>
                    <strong className="text-slate-200">₹{item.value.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Predictive BI analytics forecasts (Placeholders) */}
            <div className="lg:col-span-8 glass-panel border-indigo-500/10 bg-indigo-500/5 rounded-3xl p-6 text-left">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                <BrainCircuit className="h-4.5 w-4.5 animate-pulse" /> AI Forecast Indicators (Predictive Placeholders)
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-start">
                    <strong className="text-slate-300">Fee Default Risk</strong>
                    <span className="text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold uppercase">Critical</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">8% default risk detected for Semester 5 student cohorts due to scholarship delays.</p>
                </div>

                <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-start">
                    <strong className="text-slate-300">Expense Forecast</strong>
                    <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase">Optimal</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">Projecting ₹180,000 operational payouts for lab infrastructure expansion in Q3.</p>
                </div>

                <div className="p-4 bg-slate-950/40 border border-slate-900 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-start">
                    <strong className="text-slate-300">Enrollments Growth</strong>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase">Positive</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">Estimated 14% enrollment applications growth for academic year 2027 based on current queries.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          B. STUDENT PERSONAL ANALYTICS
      ---------------------------------------------------- */}
      {role === 'Student' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Savings Growth</span>
                <h3 className="text-xl font-bold text-slate-100 mt-1">₹{kpis.netSavings?.toLocaleString()}</h3>
                <span className="text-[10px] text-slate-500 font-medium block pt-1">Target limit set: ₹50,000</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Budget Utilized</span>
                <h3 className="text-xl font-bold text-slate-100 mt-1">{kpis.budgetUtilization}%</h3>
                <span className="text-[10px] text-indigo-400 font-semibold block pt-1">Safe spending limits</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Sliders className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider block">Academic GPA</span>
                <h3 className="text-xl font-bold text-slate-100 mt-1">{kpis.cgpa}</h3>
                <span className="text-[10px] text-emerald-400 font-semibold block pt-1">Attendance: {kpis.attendanceRate}%</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-pink-500/10 text-pink-400 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Income vs Expenses breakdown */}
            <div className="glass-panel border-slate-900 rounded-3xl p-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Monthly Spending Breakdown</h4>
              <div className="h-64">
                {viz.incomeVsExpense ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={viz.incomeVsExpense}>
                      <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        <Cell fill="#10b981" />
                        <Cell fill="#6366f1" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : null}
              </div>
            </div>

            {/* Savings Goal timelines */}
            <div className="glass-panel border-slate-900 rounded-3xl p-6 text-left space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Savings Goal Progress</h4>
              <div className="space-y-3.5">
                {viz.savings?.length === 0 ? (
                  <p className="text-slate-500 text-xs italic py-8 text-center">No active savings targets set.</p>
                ) : (
                  viz.savings?.map((item: any, idx: number) => (
                    <div key={idx} className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-bold text-slate-350">
                        <span>{item.name}</span>
                        <span>{item.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-900">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${item.progress}%` }}></div>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 pt-0.5">
                        <span>Saved: ₹{item.saved.toLocaleString()}</span>
                        <span>Target: ₹{item.target.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          C. REPORT GENERATOR BOARD (ADMIN ONLY)
      ---------------------------------------------------- */}
      {(role === 'SuperAdmin' || role === 'Admin') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Report configuration controller */}
          <div className="lg:col-span-5 glass-panel border-slate-900 rounded-3xl p-6 text-left space-y-4 text-xs">
            <div>
              <h3 className="font-extrabold text-slate-100 text-sm">BI Report Generator Panel</h3>
              <p className="text-slate-500 text-[11px] mt-0.5">Configure template exports with parameter filtering tags.</p>
            </div>

            <form onSubmit={triggerReportDownload} className="space-y-4 pt-1">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Select Report Category</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-400 focus:outline-none"
                >
                  <option value="Revenue">Revenue Summary Statement</option>
                  <option value="Attendance">Attendance Register Report</option>
                  <option value="Scholarship">Scholarship Disbursements Audit</option>
                  <option value="Loan">Loan Portfolio Analytics</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Select Export Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['PDF', 'Excel', 'CSV'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setReportFormat(fmt)}
                      className={`py-2 rounded-xl border font-bold text-center active:scale-95 transition-all ${
                        reportFormat === fmt
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-850'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-95 disabled:opacity-55"
              >
                <Download className="h-4.5 w-4.5" />
                {generating ? 'Compiling File...' : 'Export Statement'}
              </button>
            </form>
          </div>

          {/* Inline Report viewer panel */}
          <div className="lg:col-span-7 glass-panel border-slate-900 rounded-3xl p-6 flex flex-col justify-between text-xs">
            {generatedReport ? (
              <div className="space-y-4 h-full flex flex-col justify-between text-left">
                <div>
                  <div className="flex justify-between items-start border-b border-slate-900 pb-3">
                    <div>
                      <strong className="text-slate-200 text-sm block font-extrabold">{generatedReport.reportType} Report Output</strong>
                      <span className="text-[9px] text-slate-500">Document generated successfully (Ready to Print)</span>
                    </div>
                    <button
                      onClick={() => window.print()}
                      className="text-[10px] text-indigo-400 hover:underline flex items-center gap-0.5"
                    >
                      Print Document
                    </button>
                  </div>

                  <div className="overflow-x-auto mt-4 pr-1">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase tracking-wider pb-2 block table-row">
                          {generatedReport.headers.map((h: string, idx: number) => (
                            <th key={idx} className="py-2">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900/60">
                        {generatedReport.rows.map((row: any[], rowIdx: number) => (
                          <tr key={rowIdx}>
                            {row.map((cell: any, cellIdx: number) => (
                              <td key={cellIdx} className="py-3 font-semibold text-slate-350">{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 pt-3 border-t border-slate-900">
                  Document generated by {user?.email} on {new Date().toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 italic py-12">
                <BookOpen className="h-8 w-8 text-slate-600 mb-2.5" />
                Select parameters and compile report statements to view results.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          D. SYSTEM HEALTH & AUDIT STREAM LOGS (ADMIN ONLY)
      ---------------------------------------------------- */}
      {(role === 'SuperAdmin' || role === 'Admin') && (
        <div className="glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-indigo-400" /> Live Audit Log Feed Activity
          </h4>
          
          <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1 text-xs">
            {activities.length === 0 ? (
              <p className="text-slate-500 italic py-6 text-center">No system operations logged.</p>
            ) : (
              activities.map((log: any) => (
                <div key={log._id} className="p-3 bg-slate-950/40 border border-slate-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <strong className="text-slate-200 font-bold">{log.module} / {log.action}</strong>
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-850 rounded text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        {log.role}
                      </span>
                    </div>
                    <p className="text-slate-400 text-[11px] mt-1 leading-normal">{log.description}</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-550 shrink-0">
                    <span className="block font-medium">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    <span>IP: {log.ipAddress || '127.0.0.1'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
