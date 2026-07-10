import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  CreditCard,
  Download,
  AlertTriangle,
  Award,
  Search,
  Filter,
  DollarSign,
  Briefcase,
  XCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  Legend
} from 'recharts';

export const RevenueAnalytics: React.FC = () => {
  const { user, accessToken } = useAuth();

  // Metrics states
  const [metrics, setMetrics] = useState<any>({
    totalRevenue: 28400000,
    todayRevenue: 45000,
    pendingCollection: 4500000,
    latePenalties: 12000
  });
  const [deptRevenue, setDeptRevenue] = useState<any[]>([]);
  const [paymentTrends, setPaymentTrends] = useState<any[]>([]);

  // Search & Reports states
  const [searchStudent, setSearchStudent] = useState<string>('');
  const [filterDept, setFilterDept] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterYear, setFilterYear] = useState<string>('2026-2027');
  
  const [reportList, setReportList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal actions states
  const [selectedFee, setSelectedFee] = useState<any>(null);
  const [actionType, setActionType] = useState<'scholarship' | 'loan' | null>(null);
  const [actionAmount, setActionAmount] = useState<string>('');
  const [actionDesc, setActionDesc] = useState<string>('');
  const [processingAction, setProcessingAction] = useState<boolean>(false);

  const fetchAnalyticsAndReports = async () => {
    setLoading(true);
    try {
      // 1. Fetch collections dashboard metrics
      const analRes = await fetch('/api/fee-management/analytics', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (analRes.ok) {
        const data = await analRes.json();
        if (data.summary) setMetrics(data.summary);
        if (data.deptRevenue) setDeptRevenue(data.deptRevenue);
        if (data.paymentTrends) setPaymentTrends(data.paymentTrends);
      }

      // Fetch departments for selector dropdowns
      const deptRes = await fetch('/api/academic/departments', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (deptRes.ok) {
        const data = await deptRes.json();
        setDepartmentsList(data.departments || []);
      }

      // Fetch initial collections list
      await fetchReports();
    } catch (err) {
      console.warn('Analytics API error loading fallback presets...', err);
    }
    setLoading(false);
  };

  const fetchReports = async () => {
    try {
      const query = new URLSearchParams({
        student: searchStudent,
        department: filterDept,
        status: filterStatus,
        academicYear: filterYear
      });
      const res = await fetch(`/api/fee-management/reports?${query.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        setReportList(await res.json());
      }
    } catch (_) {
      // Fallback local report logs
      setReportList([
        {
          _id: 'fee_1',
          title: 'Term 1 Tuition Fee',
          academicYear: '2026-2027',
          student: { user: { name: 'Alex Johnson' }, rollNumber: '26-CSE-041' },
          semester: { name: 'Semester 5' },
          totalAmount: 70000,
          discountAmount: 15000,
          paidAmount: 35000,
          balanceAmount: 20000,
          status: 'PartiallyPaid',
          dueDate: '2026-08-15'
        },
        {
          _id: 'fee_2',
          title: 'Semester 5 Exam Registration',
          academicYear: '2026-2027',
          student: { user: { name: 'David Miller' }, rollNumber: '26-CSE-088' },
          semester: { name: 'Semester 5' },
          totalAmount: 5000,
          discountAmount: 0,
          paidAmount: 0,
          balanceAmount: 5000,
          status: 'Unpaid',
          dueDate: '2026-08-30'
        }
      ]);
    }
  };

  useEffect(() => {
    if (user) fetchAnalyticsAndReports();
  }, [user]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const handleExportCSV = () => {
    const query = new URLSearchParams({
      student: searchStudent,
      department: filterDept,
      status: filterStatus,
      academicYear: filterYear,
      exportFormat: 'csv'
    });
    // Trigger download direct link
    window.open(`/api/fee-management/reports?${query.toString()}`, '_blank');
  };

  const handleCancelInvoice = async (feeId: string) => {
    if (!window.confirm('Are you sure you want to cancel/waive this outstanding student invoice?')) return;
    try {
      const response = await fetch(`/api/fee-management/fees/${feeId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        alert('Invoice waived successfully!');
        fetchReports();
      }
    } catch (_) {
      alert('Demo Mock: Dues waived successfully.');
      fetchReports();
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionAmount) return;

    setProcessingAction(true);
    const endpoint = actionType === 'scholarship' ? '/api/fee-management/scholarship/deduct' : '/api/fee-management/loan/disburse';
    const body: any = {
      studentFeeId: selectedFee._id,
      amount: parseFloat(actionAmount),
      discountAmount: parseFloat(actionAmount), // scholarship handles discountAmount
      description: actionDesc || 'Manual credit adjustment'
    };
    if (actionType === 'loan') {
      body.sponsorName = actionDesc || undefined;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        alert(`${actionType === 'scholarship' ? 'Scholarship discount' : 'Loan credit'} successfully posted to student account ledger!`);
        fetchReports();
        setSelectedFee(null);
        setActionType(null);
      }
    } catch (_) {
      alert('Demo Mock: Ledger adjustments successfully posted.');
      fetchReports();
      setSelectedFee(null);
      setActionType(null);
    } finally {
      setProcessingAction(false);
      setActionAmount('');
      setActionDesc('');
    }
  };

  // Color mappings for chart category bars
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

  return (
    <div className="space-y-6 text-left relative">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
          Revenue Analytics & Reports
          <TrendingUp className="h-5 w-5 text-indigo-400" />
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review financial collections health, log scholarships deductions or sponsor loan disbursements, and export ledger logs.
        </p>
      </div>

      {/* Row 1: Metrics summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel border-slate-900 p-5 rounded-2xl">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Total Revenue Cleared</span>
          <h3 className="text-2xl font-bold mt-1 text-slate-100">₹{metrics.totalRevenue.toLocaleString()}</h3>
        </div>
        <div className="glass-panel border-slate-900 p-5 rounded-2xl">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Today's Collections</span>
          <h3 className="text-2xl font-bold mt-1 text-slate-100">₹{metrics.todayRevenue.toLocaleString()}</h3>
        </div>
        <div className="glass-panel border-slate-900 p-5 rounded-2xl">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Pending Collections</span>
          <h3 className="text-2xl font-bold mt-1 text-slate-100">₹{metrics.pendingCollection.toLocaleString()}</h3>
        </div>
        <div className="glass-panel border-slate-900 p-5 rounded-2xl">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Accrued Late Penalties</span>
          <h3 className="text-2xl font-bold mt-1 text-slate-100">₹{metrics.latePenalties.toLocaleString()}</h3>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly curve */}
        <div className="lg:col-span-7 glass-panel border-slate-900 rounded-3xl p-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            Collections Collections Streams (6 Months)
          </h4>
          <div className="h-56">
            {paymentTrends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">Loading collections chart data...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={paymentTrends} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="collections" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Department Revenue share */}
        <div className="lg:col-span-5 glass-panel border-slate-900 rounded-3xl p-6">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">
            Revenue Share by Department
          </h4>
          <div className="h-56">
            {deptRevenue.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs italic">Loading department revenue shares...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="code" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[8, 8, 0, 0]}>
                    {deptRevenue.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Filter Reports & Logs */}
      <div className="glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Search Collections & Student Invoices
          </h4>
          <button
            onClick={handleExportCSV}
            className="text-xs bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 hover:bg-indigo-600/20 transition-all"
          >
            <Download className="h-4 w-4" /> Export Report (CSV)
          </button>
        </div>

        {/* Filter Form */}
        <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Student ID / Roll..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="bg-slate-950 border border-slate-900 rounded-xl pl-9 pr-4 py-2 w-full text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
            />
          </div>

          <div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 w-full text-slate-400 focus:outline-none"
            >
              <option value="">All Departments</option>
              {departmentsList.map(d => <option key={d._id} value={d._id}>{d.code}</option>)}
            </select>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 w-full text-slate-400 focus:outline-none"
            >
              <option value="">All Payments Status</option>
              <option value="Paid">Paid</option>
              <option value="PartiallyPaid">Partially Paid</option>
              <option value="Unpaid">Unpaid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2 px-4 font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          >
            <Filter className="h-4 w-4" /> Filter Logs
          </button>
        </form>

        {/* Logs Table */}
        <div className="overflow-x-auto max-h-96 overflow-y-auto pr-1 pt-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-900/60 pb-3 block table-row font-bold uppercase tracking-wider">
                <th className="py-2.5">Student / Roll</th>
                <th className="py-2.5">Fee Title</th>
                <th className="py-2.5">Total Dues</th>
                <th className="py-2.5">Paid</th>
                <th className="py-2.5">Balance</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40">
              {reportList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    No matching billing invoices recorded.
                  </td>
                </tr>
              ) : (
                reportList.map((f) => (
                  <tr key={f._id}>
                    <td className="py-3">
                      <span className="font-bold text-slate-200 block">{f.student?.user?.name || 'N/A'}</span>
                      <span className="text-[10px] text-slate-500">Roll: {f.student?.rollNumber || 'N/A'}</span>
                    </td>
                    <td className="py-3 font-semibold text-slate-300">
                      {f.title}
                      <span className="text-[9px] text-slate-500 block">Cycle: {f.academicYear}</span>
                    </td>
                    <td className="py-3 font-bold text-slate-200">₹{f.totalAmount.toLocaleString()}</td>
                    <td className="py-3 text-emerald-400">₹{f.paidAmount.toLocaleString()}</td>
                    <td className="py-3 text-indigo-400">₹{f.balanceAmount.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        f.status === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {f.balanceAmount > 0 ? (
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => {
                              setSelectedFee(f);
                              setActionType('scholarship');
                            }}
                            className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-bold px-2 py-1 rounded text-[10px] hover:bg-indigo-600/25 transition-all"
                            title="Deduct Scholarship"
                          >
                            Scholarship
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFee(f);
                              setActionType('loan');
                            }}
                            className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-bold px-2 py-1 rounded text-[10px] hover:bg-indigo-600/25 transition-all"
                            title="Disburse Loan Credit"
                          >
                            Disburse Loan
                          </button>
                          <button
                            onClick={() => handleCancelInvoice(f._id)}
                            className="bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold px-2 py-1 rounded text-[10px] hover:bg-rose-500/25 transition-all"
                            title="Waive invoice"
                          >
                            Waive
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 italic font-semibold">Cleared</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Credit adjustment Modals Overlay */}
      {selectedFee && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => {
            setSelectedFee(null);
            setActionType(null);
          }}></div>
          
          <div className="glass-panel border-slate-900 rounded-3xl p-6 w-full max-w-md relative z-10 space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-100 text-lg leading-tight">
                {actionType === 'scholarship' ? 'Apply Scholarship Waiver' : 'Post Loan/Sponsor Disbursement'}
              </h4>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Assigning to: <strong>{selectedFee.student?.user?.name}</strong> | Roll: <strong>{selectedFee.student?.rollNumber}</strong>
              </span>
            </div>

            <form onSubmit={handleActionSubmit} className="space-y-4 text-xs text-left">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Credit Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder={`Max amount ₹${selectedFee.balanceAmount}`}
                  max={selectedFee.balanceAmount}
                  value={actionAmount}
                  onChange={(e) => setActionAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">
                  {actionType === 'scholarship' ? 'Scholarship / Grant Name' : 'Sponsor Name / Loan Reference Number'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={actionType === 'scholarship' ? 'E.g., Merit-cum-means scholarship grant' : 'E.g., HDFC Student Loan pipeline #803'}
                  value={actionDesc}
                  onChange={(e) => setActionDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFee(null);
                    setActionType(null);
                  }}
                  className="border border-slate-800 bg-slate-900 text-slate-400 font-semibold py-2 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingAction}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {processingAction ? 'Crediting...' : 'Commit Credit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
