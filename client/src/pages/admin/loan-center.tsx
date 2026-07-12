import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  FileText,
  DollarSign,
  Users,
  Download,
  Check,
  X,
  FileCheck,
  AlertTriangle,
  FolderOpen
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
  Legend
} from 'recharts';

export const LoanCenter: React.FC = () => {
  const { user, accessToken } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'create'>('dashboard');

  // Core Data
  const [stats, setStats] = useState<any>({
    totalPortfolio: 0,
    totalCollected: 0,
    totalApplications: 0,
    pendingReview: 0,
    approvedLoans: 0,
    rejectedLoans: 0,
    defaultRate: 0,
    monthlyCollections: [],
    recoveryTrends: []
  });
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // 1. Create Scheme Form State
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [processingFee, setProcessingFee] = useState<string>('0');
  const [repaymentPeriodMonths, setRepaymentPeriodMonths] = useState<string>('36');
  const [gracePeriodMonths, setGracePeriodMonths] = useState<string>('6');
  
  // Rules
  const [minGpa, setMinGpa] = useState<string>('6.5');
  const [maxIncome, setMaxIncome] = useState<string>('450000');
  const [requireCollateral, setRequireCollateral] = useState<boolean>(false);

  // 2. Review Decision Modal
  const [selectedAppReview, setSelectedAppReview] = useState<any>(null);
  const [comments, setComments] = useState<string>('');
  const [decision, setDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch dashboard metrics
      const statsRes = await fetch('/api/loans/admin/dashboard', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (statsRes.ok) setStats(await statsRes.json());

      // 2. Fetch applications reviewer queue
      const appRes = await fetch('/api/loans/admin/applications', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (appRes.ok) setApplications(await appRes.json());
    } catch (err) {
      console.warn('Failed compiling administrator reports:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchAdminData();
  }, [user]);

  // Create Loan scheme program
  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description || !minAmount || !maxAmount || !interestRate) return;

    try {
      const response = await fetch('/api/loans/admin/schemes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name,
          description,
          minAmount: parseFloat(minAmount),
          maxAmount: parseFloat(maxAmount),
          interestRate: parseFloat(interestRate),
          processingFee: parseFloat(processingFee),
          repaymentPeriodMonths: parseInt(repaymentPeriodMonths),
          gracePeriodMonths: parseInt(gracePeriodMonths),
          minGpa: parseFloat(minGpa),
          maxFamilyIncome: parseFloat(maxIncome),
          requireCollateral
        })
      });

      if (response.ok) {
        alert('Loan scheme configured and published successfully!');
        setName('');
        setDescription('');
        setMinAmount('');
        setMaxAmount('');
        setInterestRate('');
        setActiveTab('dashboard');
        fetchAdminData();
      }
    } catch (_) {}
  };

  // Verify supporting document attachment
  const handleVerifyDocument = async (docId: string, status: 'Verified' | 'Rejected') => {
    try {
      const res = await fetch(`/api/loans/admin/verify-doc/${docId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ verificationStatus: status })
      });
      if (res.ok) {
        alert(`Document verification status updated to ${status}.`);
        // Refresh local applications state
        const appRes = await fetch('/api/loans/admin/applications', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (appRes.ok) setApplications(await appRes.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Post Decision Review
  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppReview || !comments) return;

    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/loans/admin/review/${selectedAppReview.application._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          decision,
          comments
        })
      });

      if (res.ok) {
        alert(`Application successfully marked as ${decision}. Outstanding fee ledger updated!`);
        setSelectedAppReview(null);
        setComments('');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/loans/admin/export', '_blank');
  };

  // Filters application queue
  const filteredApps = applications.filter(app => {
    const student = app.application.student || {};
    const matchesSearch = student.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || app.application.scheme?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter ? app.application.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6 text-left relative">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
            Loan Pipelines Center
            <GraduationCap className="h-5 w-5 text-indigo-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review education loan pipelines, check applicant default risks, and configure institutional repayment schemes.
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
      <div className="flex border-b border-slate-800/80 gap-6 text-xs font-bold uppercase tracking-wider text-slate-500">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 transition-colors ${activeTab === 'dashboard' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Portfolio Dashboard
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 transition-colors ${activeTab === 'applications' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Applications Reviewer Queue ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-3 transition-colors ${activeTab === 'create' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Configure Scheme
        </button>
      </div>

      {/* TAB 1: PORTFOLIO DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Total Loan Portfolio</span>
                <h3 className="text-xl font-bold mt-1 text-slate-100">₹{stats.totalPortfolio.toLocaleString()}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <GraduationCap className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Collected Principal</span>
                <h3 className="text-xl font-bold mt-1 text-slate-100">₹{stats.totalCollected.toLocaleString()}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Pending Reviews</span>
                <h3 className="text-xl font-bold mt-1 text-slate-100">{stats.pendingReview} Applications</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <FolderOpen className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Defaults Risk Rate</span>
                <h3 className="text-xl font-bold mt-1 text-slate-100">{stats.defaultRate}% AI rating</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Collections Area */}
            <div className="lg:col-span-8 glass-panel border-slate-900 rounded-3xl p-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Monthly EMI Collection Inflow Rate
              </h4>
              <div className="h-56">
                {stats.monthlyCollections?.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">Loading collections database...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.monthlyCollections} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCollected)" name="EMI Collections (₹)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Recovery Rate Pie */}
            <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 flex flex-col items-center">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center mb-4">
                Portfolio Balance Distribution
              </h4>
              <div className="h-44 w-full flex items-center justify-center">
                {stats.recoveryTrends?.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">Loading trends...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.recoveryTrends}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.recoveryTrends?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="w-full text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wide grid grid-cols-2 gap-2">
                {stats.recoveryTrends?.map((r: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1.5 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="truncate">{r.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVIEWER QUEUE */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex gap-3 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search student name or scheme..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="Disbursed">Disbursed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Queue Grid */}
          <div className="glass-panel border-slate-900 rounded-3xl p-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800/80 pb-3 block table-row font-bold uppercase tracking-wider">
                  <th className="py-2.5">Student Details</th>
                  <th className="py-2.5">Scheme Details</th>
                  <th className="py-2.5">AI Risk Rating</th>
                  <th className="py-2.5">Document Verifications</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">No applications in reviewer queue.</td>
                  </tr>
                ) : (
                  filteredApps.map((item) => {
                    const app = item.application;
                    const student = app.student || {};
                    const sch = app.scheme || {};
                    return (
                      <tr key={app._id}>
                        <td className="py-3.5 text-left">
                          <h5 className="font-bold text-slate-200">{student.user?.name || 'Unknown Student'}</h5>
                          <span className="text-[10px] text-slate-500 block font-semibold">
                            Roll: {student.rollNumber} | Department: {student.department?.name || 'CSE'}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <h5 className="font-semibold text-slate-200">{sch.name}</h5>
                          <span className="text-[10px] text-indigo-400 font-bold block">Requested: ₹{app.amountRequested?.toLocaleString()}</span>
                        </td>
                        <td className="py-3.5">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">Score: {app.riskScore}% Risk</span>
                            <span className="text-[9px] text-slate-500 block font-semibold">Prob: {app.approvalProbability}% Approval</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="space-y-1">
                            {item.documents.map((doc: any) => (
                              <div key={doc._id} className="flex items-center gap-1.5 text-[10px]">
                                <span className="font-semibold text-slate-400 truncate max-w-[120px]">{doc.documentType}:</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleVerifyDocument(doc._id, 'Verified')}
                                    className={`p-0.5 rounded text-[9px] font-bold ${
                                      doc.verificationStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 hover:text-slate-200'
                                    }`}
                                  >
                                    Verify
                                  </button>
                                  <button
                                    onClick={() => handleVerifyDocument(doc._id, 'Rejected')}
                                    className={`p-0.5 rounded text-[9px] font-bold ${
                                      doc.verificationStatus === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-slate-800 text-slate-500 hover:text-slate-200'
                                    }`}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            app.status === 'Disbursed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : app.status === 'Rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => setSelectedAppReview(item)}
                            className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-600/20 transition-all"
                          >
                            Review Request
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURE SCHEME */}
      {activeTab === 'create' && (
        <div className="glass-panel border-slate-900 rounded-3xl p-6">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-6">
            <Plus className="h-5 w-5 text-indigo-400" /> Create Education Loan Scheme Campaign
          </h4>

          <form onSubmit={handleCreateScheme} className="space-y-6 text-xs text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Scheme Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Merit Moratorium Loan Plan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Minimum Limit (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="10000"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Maximum Limit (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="500000"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Interest P.A. (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      required
                      placeholder="7.5"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Moratorium (Grace)</label>
                    <input
                      type="number"
                      required
                      value={gracePeriodMonths}
                      onChange={(e) => setGracePeriodMonths(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Tenure (Months)</label>
                    <input
                      type="number"
                      required
                      value={repaymentPeriodMonths}
                      onChange={(e) => setRepaymentPeriodMonths(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Processing Fee (₹)</label>
                    <input
                      type="number"
                      value={processingFee}
                      onChange={(e) => setProcessingFee(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200"
                    />
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-400 uppercase tracking-wide">
                      <input
                        type="checkbox"
                        checked={requireCollateral}
                        onChange={(e) => setRequireCollateral(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Require Collateral</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Rules & Guideline fields */}
              <div className="space-y-4 border-l border-slate-900 pl-6">
                <h5 className="font-bold text-slate-400 uppercase tracking-wider mb-2.5">Configure Eligibility Rules</h5>
                
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Minimum CGPA Limit</label>
                  <input
                    type="number"
                    step="0.1"
                    value={minGpa}
                    onChange={(e) => setMinGpa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Maximum Household Income Limit (₹)</label>
                  <input
                    type="number"
                    value={maxIncome}
                    onChange={(e) => setMaxIncome(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Scheme Guidelines / Disclaimers details</label>
              <textarea
                rows={4}
                required
                placeholder="Declare scheme guidelines details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-slate-200 placeholder-slate-600 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3.5 border-t border-slate-900 pt-4">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-400 font-semibold py-2.5 px-5 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl shadow active:scale-95 transition-all"
              >
                Publish Loan Scheme
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SINGLE REVIEW DECISION MODAL OVERLAY */}
      {selectedAppReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedAppReview(null)}></div>
          
          <form onSubmit={handlePostReview} className="glass-panel border-slate-900 rounded-3xl p-6 w-full max-w-md relative z-10 space-y-4 text-xs text-left">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-extrabold text-slate-100 text-lg leading-tight">Review Loan Request</h4>
                <span className="text-[10px] text-indigo-400 font-bold block mt-1">
                  Student: {selectedAppReview.application.student?.user?.name} | Scheme: {selectedAppReview.application.scheme?.name}
                </span>
              </div>
              <button type="button" onClick={() => setSelectedAppReview(null)} className="text-slate-500 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Verification checklist reminder */}
            <div className="p-3 bg-slate-950 border border-slate-900 rounded-xl space-y-2">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Student Metrics Verification</span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-300">
                <div>Requested: <strong className="text-slate-100">₹{selectedAppReview.application.amountRequested?.toLocaleString()}</strong></div>
                <div>moratorium grace: <strong className="text-slate-100">{selectedAppReview.application.scheme?.gracePeriodMonths} Months</strong></div>
              </div>
              <div className="text-[10px] text-slate-400 border-t border-slate-900/60 pt-1.5 leading-relaxed font-medium mt-1">
                <strong>Borrowing Statement:</strong> "{selectedAppReview.application.purpose}"
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Decision Decision</label>
              <div className="grid grid-cols-2 gap-3">
                {['Approved', 'Rejected'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDecision(item as any)}
                    className={`py-2 rounded-xl font-bold transition-all border ${
                      decision === item
                        ? item === 'Approved'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-rose-500 bg-rose-500/10 text-rose-400'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Reviewer Remarks / Auditing Comments</label>
              <textarea
                required
                rows={3}
                placeholder="Type reviewer decisions details..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-900 mt-2">
              <button
                type="button"
                onClick={() => setSelectedAppReview(null)}
                className="border border-slate-800 bg-slate-900 text-slate-400 py-2 px-4 rounded-xl font-bold hover:bg-slate-850"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReview}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-5 rounded-xl shadow active:scale-95 disabled:opacity-55"
              >
                {submittingReview ? 'Submitting...' : 'Post Decision'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
