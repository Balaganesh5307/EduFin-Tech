import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { PaymentModal } from '../../components/payment-modal';
import { motion } from 'framer-motion';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
  Calendar,
  Users,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export const ParentChildFees: React.FC = () => {
  const { user, accessToken } = useAuth();

  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [summary, setSummary] = useState<any>({ totalAssigned: 0, totalPaid: 0, balanceDues: 0 });
  const [feesList, setFeesList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Payment triggers
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [payModalOpen, setPayModalOpen] = useState<boolean>(false);

  const fetchChildFeesData = async () => {
    setLoading(true);
    try {
      // 1. Fetch dashboard data which automatically resolves the child for parent
      const dashboardRes = await fetch('/api/fee-management/dashboard/student', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (dashboardRes.ok) {
        const data = await dashboardRes.json();
        setStudentDetails(data.studentDetails);
        setSummary(data.summary);
        setFeesList(data.fees || []);
        setPaymentsList(data.payments || []);
      }

      // 2. Fetch Ledger details
      const ledgerRes = await fetch('/api/fee-management/ledger/self', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (ledgerRes.ok) {
        const data = await ledgerRes.json();
        setLedgerEntries(data.entries || []);
      }
    } catch (err) {
      console.warn('Parent portal fetch error loading preset backups...', err);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchChildFeesData();
  }, [user]);

  const triggerPayment = (invoice: any) => {
    setActiveInvoice({
      id: invoice._id || invoice.id,
      category: invoice.title,
      amount: invoice.balanceAmount || invoice.amount
    });
    setPayModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPayModalOpen(false);
    alert('Payment captured successfully! Child ledger and billing balances updated.');
    fetchChildFeesData(); // Reload statistics
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2 text-left">
        <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-900 rounded-2xl md:col-span-1"></div>
          <div className="h-64 bg-slate-900 rounded-2xl md:col-span-2"></div>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'Paid Dues', value: summary.totalPaid, color: '#10b981' },
    { name: 'Pending Balance', value: summary.balanceDues, color: '#6366f1' }
  ];

  return (
    <div className="space-y-6 text-left relative">
      {/* Header */}
      <div className="glass-panel border-slate-900 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4 text-left">
        <div className="h-16 w-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <Users className="h-8 w-8" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Dependent Student Registered</span>
          <h3 className="text-xl font-bold text-slate-200 mt-0.5">{studentDetails?.name || 'Alex Johnson'}</h3>
          <p className="text-xs text-slate-400 mt-1">
            Roll: <strong>{studentDetails?.rollNumber || '26-CSE-041'}</strong> | Department: <strong>{studentDetails?.department?.name || 'Computer Science'}</strong> | semester: <strong>{studentDetails?.semester?.name || 'Semester 5'}</strong>
          </p>
        </div>
      </div>

      {/* Row 2: Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Allocations Gauge */}
        <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 flex flex-col items-center">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center mb-4">
            Child Payment Allocation
          </h4>
          
          <div className="h-44 w-full flex items-center justify-center">
            {summary.totalPaid === 0 && summary.balanceDues === 0 ? (
              <span className="text-slate-500 text-xs italic">No fees mapped yet</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="w-full space-y-3 mt-2 text-xs">
            <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
              <span className="flex items-center gap-2 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Total Paid Fees
              </span>
              <span className="font-bold text-slate-200">₹{summary.totalPaid.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
              <span className="flex items-center gap-2 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-indigo-500"></span> Pending Balance
              </span>
              <span className="font-bold text-slate-200">₹{summary.balanceDues.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Installment Grid */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CreditCard className="h-4.5 w-4.5 text-indigo-400" /> Outstanding Bills Schedule
            </h4>

            <div className="divide-y divide-slate-900/60 text-xs">
              {feesList.length === 0 ? (
                <p className="py-6 text-center text-slate-500 italic">No pending fees or invoices listed.</p>
              ) : (
                feesList.map((f) => (
                  <div key={f._id} className="py-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                    <div className="space-y-1">
                      <h5 className="font-bold text-slate-200">{f.title}</h5>
                      <span className="text-[10px] text-slate-500 block">Cycle: {f.academicYear} | Due: {new Date(f.dueDate).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="font-bold text-slate-200 block">₹{f.balanceAmount.toLocaleString()}</span>
                        <span className={`inline-block px-1.5 py-0.5 mt-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                          f.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {f.status}
                        </span>
                      </div>
                      {f.status !== 'Paid' && (
                        <button
                          onClick={() => triggerPayment(f)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-3 rounded-lg hover:shadow-md active:scale-95 transition-all"
                        >
                          Pay Dues
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Receipts and Ledger Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment History */}
        <div className="glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Receipts Download Ledger</h4>
          
          <div className="divide-y divide-slate-900/60 text-[11px] max-h-72 overflow-y-auto pr-1">
            {paymentsList.length === 0 ? (
              <p className="py-8 text-center text-slate-500 italic">No successful payment receipts found.</p>
            ) : (
              paymentsList.map((p) => (
                <div key={p._id || p.transactionId} className="py-3 flex justify-between items-center">
                  <div>
                    <h5 className="font-bold text-slate-300">{p.receiptNumber}</h5>
                    <span className="text-[9px] text-slate-500 font-mono block">Txn: {p.transactionId}</span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <div className="text-right">
                      <span className="font-bold text-slate-200 block">₹{p.amount.toLocaleString()}</span>
                      <span className="text-[9px] text-slate-500">{new Date(p.paidAt).toLocaleDateString()}</span>
                    </div>
                    <button
                      onClick={() => alert(`Receipt downloaded for invoice token ${p.receiptNumber}`)}
                      className="p-1 text-slate-500 hover:text-indigo-400"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ledger Statement Timeline */}
        <div className="glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Child Ledger Statement History
          </h4>

          <div className="space-y-4 max-h-72 overflow-y-auto pr-1 text-[11px] pt-1">
            {ledgerEntries.length === 0 ? (
              <p className="py-8 text-center text-slate-500 italic">No ledger transactions posted.</p>
            ) : (
              ledgerEntries.map((l, index) => (
                <div key={l._id || index} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`h-2 w-2 rounded-full mt-1 shrink-0 ${l.type === 'Debit' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
                    {index !== ledgerEntries.length - 1 && <div className="w-0.5 bg-slate-900 grow min-h-6"></div>}
                  </div>
                  <div className="grow pb-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-300">{l.description}</span>
                      <span className={`font-bold ${l.type === 'Debit' ? 'text-indigo-400' : 'text-emerald-400'}`}>
                        {l.type === 'Debit' ? '+' : '-'} ₹{l.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                      <span>Date: {new Date(l.date).toLocaleDateString()}</span>
                      <span>Dues Balance: ₹{l.balance.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        invoice={activeInvoice}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
