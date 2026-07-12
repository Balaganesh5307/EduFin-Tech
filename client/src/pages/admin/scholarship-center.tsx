import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { motion } from 'framer-motion';
import {
  Award,
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

export const ScholarshipCenter: React.FC = () => {
  const { user, accessToken } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'applications' | 'create'>('dashboard');

  // Core Data
  const [stats, setStats] = useState<any>({
    totalPrograms: 0,
    totalApps: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    totalAwardedAmount: 0,
    distribution: [],
    monthlyTrends: []
  });
  const [applications, setApplications] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // 1. Program Configurator Form State
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [provider, setProvider] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [maxBeneficiaries, setMaxBeneficiaries] = useState<string>('50');
  const [deadline, setDeadline] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('2026-2027');
  
  // Rule Configurator
  const [minGpa, setMinGpa] = useState<string>('8.0');
  const [minAttendance, setMinAttendance] = useState<string>('75');
  const [maxIncome, setMaxIncome] = useState<string>('400000');
  const [allowedCommunities, setAllowedCommunities] = useState<string>('');
  const [requiredDocs, setRequiredDocs] = useState<string[]>(['IncomeCertificate', 'MarkSheets']);

  // 2. Review Decision Modal
  const [selectedAppReview, setSelectedAppReview] = useState<any>(null);
  const [comments, setComments] = useState<string>('');
  const [decision, setDecision] = useState<'Approved' | 'Rejected' | 'Waitlisted'>('Approved');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  // Bulk operations state
  const [selectedBulkApps, setSelectedBulkApps] = useState<string[]>([]);
  const [showBulkModal, setShowBulkModal] = useState<boolean>(false);
  const [bulkDecision, setBulkDecision] = useState<'Approved' | 'Rejected'>('Approved');
  const [bulkComments, setBulkComments] = useState<string>('');

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1. Fetch dashboard metrics
      const statsRes = await fetch('/api/scholarships/admin/dashboard', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (statsRes.ok) setStats(await statsRes.json());

      // 2. Fetch applications reviewer queue
      const appRes = await fetch('/api/scholarships/admin/applications', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (appRes.ok) setApplications(await appRes.json());

      // Seed categories list
      setCategories([
        { _id: 'cat1', name: 'Government Scholarship' },
        { _id: 'cat2', name: 'Merit Scholarship' },
        { _id: 'cat3', name: 'Sports Scholarship' },
        { _id: 'cat4', name: 'Need-Based Scholarship' }
      ]);
    } catch (err) {
      console.warn('Failed compiling administrator catalog reports:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchAdminData();
  }, [user]);

  // Create Scholarship program
  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !categoryId || !amount || !deadline) return;

    try {
      const allowedComms = allowedCommunities ? allowedCommunities.split(',').map(c => c.trim()) : [];
      const response = await fetch('/api/scholarships/admin/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          title,
          description,
          provider,
          categoryId,
          amount: parseFloat(amount),
          maxBeneficiaries: parseInt(maxBeneficiaries),
          deadline,
          academicYear,
          eligibilityRules: {
            minGpa: parseFloat(minGpa),
            minAttendance: parseFloat(minAttendance),
            maxFamilyIncome: parseFloat(maxIncome),
            allowedCommunities: allowedComms
          },
          requiredDocuments: requiredDocs
        })
      });

      if (response.ok) {
        alert('Scholarship program configured and published successfully!');
        setTitle('');
        setDescription('');
        setProvider('');
        setCategoryId('');
        setAmount('');
        setActiveTab('dashboard');
        fetchAdminData();
      }
    } catch (_) {}
  };

  // Verify supporting document attachment
  const handleVerifyDocument = async (docId: string, status: 'Verified' | 'Rejected') => {
    try {
      const res = await fetch(`/api/scholarships/admin/verify-doc/${docId}`, {
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
        const appRes = await fetch('/api/scholarships/admin/applications', {
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
      const res = await fetch(`/api/scholarships/admin/review/${selectedAppReview.application._id}`, {
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
        alert(`Application successfully marked as ${decision}. Outstanding balance updated!`);
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

  // Bulk Review execution
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBulkApps.length || !bulkComments) return;

    try {
      const res = await fetch('/api/scholarships/admin/bulk-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          applicationIds: selectedBulkApps,
          decision: bulkDecision,
          comments: bulkComments
        })
      });

      if (res.ok) {
        alert('Bulk review processing completed!');
        setSelectedBulkApps([]);
        setShowBulkModal(false);
        setBulkComments('');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/scholarships/admin/export', '_blank');
  };

  const handleSelectBulkRow = (id: string) => {
    if (selectedBulkApps.includes(id)) {
      setSelectedBulkApps(selectedBulkApps.filter(x => x !== id));
    } else {
      setSelectedBulkApps([...selectedBulkApps, id]);
    }
  };

  // Filters application queue
  const filteredApps = applications.filter(app => {
    const student = app.application.student || {};
    const matchesSearch = student.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || app.application.scholarship?.title?.toLowerCase().includes(searchTerm.toLowerCase());
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
            Scholarship Center
            <Award className="h-5 w-5 text-indigo-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage tuition waivers, verify student community/income certificates, and authorize financial aid disbursements.
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
          Admin Dashboard
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 transition-colors ${activeTab === 'applications' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Reviewer Queue ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-3 transition-colors ${activeTab === 'create' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Configure Program
        </button>
      </div>

      {/* TAB 1: ADMIN DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Active Programs</span>
                <h3 className="text-xl font-bold mt-1 text-slate-100">{stats.totalPrograms} Campaigns</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Reviewer Queue</span>
                <h3 className="text-xl font-bold mt-1 text-slate-100">{stats.pendingReview} Pending</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <FolderOpen className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Disbursed Aid</span>
                <h3 className="text-xl font-bold mt-1 text-slate-100">₹{stats.totalAwardedAmount.toLocaleString()}</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>

            <div className="glass-panel border-slate-900 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Applications Total</span>
                <h3 className="text-xl font-bold mt-1 text-slate-100">{stats.totalApps} Received</h3>
              </div>
              <div className="h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Monthly Trend Area Chart */}
            <div className="lg:col-span-8 glass-panel border-slate-900 rounded-3xl p-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
                Scholarship Submissions vs Approvals Trend
              </h4>
              <div className="h-56">
                {stats.monthlyTrends?.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">Loading monthly trends...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.monthlyTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorApplied" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="applied" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorApplied)" name="Applied" />
                      <Area type="monotone" dataKey="approved" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorApproved)" name="Approved" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Department Distribution Pie */}
            <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 flex flex-col items-center">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center mb-4">
                Department Distribution
              </h4>
              <div className="h-44 w-full flex items-center justify-center">
                {stats.distribution?.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">Loading distribution chart...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.distribution?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="w-full text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wide grid grid-cols-2 gap-2">
                {stats.distribution?.slice(0, 4).map((d: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1.5 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="truncate">{d.name} ({d.value})</span>
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
          {/* Filters and Bulk actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex gap-3 w-full sm:w-auto flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search student or scholarship..."
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
                <option value="Verified">Verified</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {selectedBulkApps.length > 0 && (
              <button
                onClick={() => setShowBulkModal(true)}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
              >
                <FileCheck className="h-4.5 w-4.5" /> Bulk Review Decision ({selectedBulkApps.length})
              </button>
            )}
          </div>

          {/* Queue Grid */}
          <div className="glass-panel border-slate-900 rounded-3xl p-6 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800/80 pb-3 block table-row font-bold uppercase tracking-wider">
                  <th className="py-2.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedBulkApps.length === filteredApps.length && filteredApps.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBulkApps(filteredApps.map(a => a.application._id));
                        } else {
                          setSelectedBulkApps([]);
                        }
                      }}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="py-2.5">Student Details</th>
                  <th className="py-2.5">Program Target</th>
                  <th className="py-2.5">Match Assessment</th>
                  <th className="py-2.5">Document Verifications</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 italic">No applications in reviewer queue.</td>
                  </tr>
                ) : (
                  filteredApps.map((item) => {
                    const app = item.application;
                    const student = app.student || {};
                    const sch = app.scholarship || {};
                    return (
                      <tr key={app._id}>
                        <td className="py-3.5">
                          <input
                            type="checkbox"
                            checked={selectedBulkApps.includes(app._id)}
                            onChange={() => handleSelectBulkRow(app._id)}
                            className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="py-3.5 text-left">
                          <h5 className="font-bold text-slate-200">{student.user?.name || 'Unknown Student'}</h5>
                          <span className="text-[10px] text-slate-500 block font-semibold">
                            Roll: {student.rollNumber} | GPA: {app.currentGpa} | Income: ₹{app.familyIncome.toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <h5 className="font-semibold text-slate-200">{sch.title}</h5>
                          <span className="text-[10px] text-indigo-400 font-bold block">Award: ₹{sch.amount?.toLocaleString()}</span>
                        </td>
                        <td className="py-3.5">
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-400 font-bold block">AI score: {app.matchesScore}% Fit</span>
                            <span className="text-[9px] text-slate-500 block font-semibold">Prob: {app.approvalProbability}% Approved</span>
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
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            app.status === 'Approved'
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

      {/* TAB 3: CONFIGURE PROGRAM */}
      {activeTab === 'create' && (
        <div className="glass-panel border-slate-900 rounded-3xl p-6">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-6">
            <Plus className="h-5 w-5 text-indigo-400" /> Create Scholarship Program Campaign
          </h4>

          <form onSubmit={handleCreateProgram} className="space-y-6 text-xs text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Scholarship Program Title</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Merit Tuition Waiver Program"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Funding Provider / Trust</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., University Welfare Endowment"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Disbursement Value (₹)</label>
                    <input
                      type="number"
                      required
                      placeholder="35000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Max Beneficiaries</label>
                    <input
                      type="number"
                      required
                      value={maxBeneficiaries}
                      onChange={(e) => setMaxBeneficiaries(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Application Deadline</label>
                    <input
                      type="date"
                      required
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2 text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Academic Year</label>
                    <input
                      type="text"
                      required
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Select Category type</label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-400 focus:outline-none"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Rules engine configuration */}
              <div className="space-y-4 border-l border-slate-900 pl-6">
                <h5 className="font-bold text-slate-400 uppercase tracking-wider mb-2.5">Configure Eligibility Rules</h5>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Minimum CGPA required</label>
                    <input
                      type="number"
                      step="0.1"
                      value={minGpa}
                      onChange={(e) => setMinGpa(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Min Attendance Rate (%)</label>
                    <input
                      type="number"
                      value={minAttendance}
                      onChange={(e) => setMinAttendance(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Max Family Annual Income (₹)</label>
                  <input
                    type="number"
                    value={maxIncome}
                    onChange={(e) => setMaxIncome(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Allowed Community Categories (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="SC, ST, OBC, Minority"
                    value={allowedCommunities}
                    onChange={(e) => setAllowedCommunities(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3.5 py-2.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Checklist of Required Attachment uploads</label>
                  <div className="grid grid-cols-2 gap-2 pt-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    {['IncomeCertificate', 'CommunityCertificate', 'SportsCertificate', 'MarkSheets', 'RecommendationLetter', 'BankPassbook'].map(doc => {
                      const selected = requiredDocs.includes(doc);
                      return (
                        <label key={doc} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-slate-900/40">
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => {
                              if (selected) {
                                setRequiredDocs(requiredDocs.filter(d => d !== doc));
                              } else {
                                setRequiredDocs([...requiredDocs, doc]);
                              }
                            }}
                            className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{doc}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Program Description / Guidelines details</label>
              <textarea
                rows={4}
                required
                placeholder="Declare program parameters guidelines..."
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
                Publish Scholarship Program
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
                <h4 className="font-extrabold text-slate-100 text-lg leading-tight">Review Application Request</h4>
                <span className="text-[10px] text-indigo-400 font-bold block mt-1">
                  Student: {selectedAppReview.application.student?.user?.name} | Program: {selectedAppReview.application.scholarship?.title}
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
                <div>CGPA: <strong className="text-slate-100">{selectedAppReview.application.currentGpa}</strong></div>
                <div>Income: <strong className="text-slate-100">₹{selectedAppReview.application.familyIncome.toLocaleString()}</strong></div>
              </div>
              <div className="text-[10px] text-slate-400 border-t border-slate-900/60 pt-1.5 leading-relaxed font-medium mt-1">
                <strong>Motivation Statement:</strong> "{selectedAppReview.application.motivationStatement}"
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Decision Decision</label>
              <div className="grid grid-cols-3 gap-2">
                {['Approved', 'Rejected', 'Waitlisted'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setDecision(item as any)}
                    className={`py-2 rounded-xl font-bold transition-all border ${
                      decision === item
                        ? item === 'Approved'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : item === 'Rejected'
                          ? 'border-rose-500 bg-rose-500/10 text-rose-400'
                          : 'border-amber-500 bg-amber-500/10 text-amber-400'
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

      {/* BULK DECISION MODAL OVERLAY */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowBulkModal(false)}></div>
          
          <form onSubmit={handleBulkSubmit} className="glass-panel border-slate-900 rounded-3xl p-6 w-full max-w-md relative z-10 space-y-4 text-xs text-left">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-extrabold text-slate-100 text-lg leading-tight">Execute Bulk Decisions</h4>
                <span className="text-[10px] text-slate-500 font-bold mt-1 block">
                  Processing review updates for {selectedBulkApps.length} student applications.
                </span>
              </div>
              <button type="button" onClick={() => setShowBulkModal(false)} className="text-slate-500 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Decision Decision</label>
              <div className="grid grid-cols-2 gap-3">
                {['Approved', 'Rejected'].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setBulkDecision(item as any)}
                    className={`py-2 rounded-xl font-bold transition-all border ${
                      bulkDecision === item
                        ? item === 'Approved'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-rose-500 bg-rose-500/10 text-rose-400'
                        : 'border-slate-800 bg-slate-900 text-slate-400'
                    }`}
                  >
                    Bulk {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1.5">Auditing Comments</label>
              <textarea
                required
                rows={3}
                placeholder="Bulk review remarks..."
                value={bulkComments}
                onChange={(e) => setBulkComments(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none"
              ></textarea>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-slate-900 mt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="border border-slate-800 bg-slate-900 text-slate-400 py-2 px-4 rounded-xl font-bold hover:bg-slate-850"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-5 rounded-xl shadow active:scale-95"
              >
                Apply Decisions
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
