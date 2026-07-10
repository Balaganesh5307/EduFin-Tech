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
  DollarSign
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

export const FeesPayments: React.FC = () => {
  const { user, accessToken } = useAuth();
  
  const [fees, setFees] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [payModalOpen, setPayModalOpen] = useState<boolean>(false);

  const fetchFeesData = async () => {
    setLoading(true);
    try {
      // 1. Fetch current due fees
      const feesResponse = await fetch('/api/student-finance/fees', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (feesResponse.ok) {
        setFees(await feesResponse.json());
      } else {
        throw new Error();
      }
    } catch (err) {
      console.warn('Fallback due fees mock loaded...');
      setFees([
        { id: 'f1', category: 'Tuition Fee installment', amount: 35000, dueDate: '2026-08-15', status: 'Unpaid' },
        { id: 'f2', category: 'Library Service Fee', amount: 5000, dueDate: '2026-08-15', status: 'Unpaid' },
        { id: 'f3', category: 'Exam Registration Fee', amount: 5000, dueDate: '2026-09-01', status: 'Unpaid' },
        { id: 'f4', category: 'Campus Hostel Fee', amount: 30000, dueDate: '2026-06-10', status: 'Paid' }
      ]);
    }

    try {
      // 2. Fetch payment receipts history
      const historyResponse = await fetch('/api/payment/history', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (historyResponse.ok) {
        const histData = await historyResponse.json();
        setHistory(histData.payments || []);
      }
    } catch (_) {
      setHistory([
        {
          id: 'pay_1',
          category: 'Campus Hostel Fee',
          amount: 30000,
          paymentMethod: 'Razorpay',
          status: 'Completed',
          transactionId: 'txn_c2c8f0e5b721',
          receiptNumber: 'RCPT-852003',
          paidAt: '2026-06-10'
        },
        {
          id: 'pay_2',
          category: 'Academic Registration',
          amount: 15000,
          paymentMethod: 'BankTransfer',
          status: 'Completed',
          transactionId: 'txn_d8c90382ab30',
          receiptNumber: 'RCPT-102941',
          paidAt: '2025-12-15'
        }
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchFeesData();
  }, [user]);

  const triggerPayment = (invoice: any) => {
    setActiveInvoice({
      id: invoice.id,
      category: invoice.category,
      amount: invoice.amount
    });
    setPayModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPayModalOpen(false);
    alert('Payment successfully authorized (Demo Sandbox verification).');
    
    // Update local state to show paid
    const updatedFees = fees.map(f => {
      if (f.id === activeInvoice.id) {
        return { ...f, status: 'Paid' };
      }
      return f;
    });
    setFees(updatedFees);

    // Add to history
    const newTxn = {
      id: `pay_new_${Date.now()}`,
      category: activeInvoice.category,
      amount: activeInvoice.amount,
      paymentMethod: 'Razorpay',
      status: 'Completed',
      transactionId: `txn_${Math.random().toString(36).substring(2, 12)}`,
      receiptNumber: `RCPT-${Math.floor(100000 + Math.random() * 900000)}`,
      paidAt: new Date().toISOString().split('T')[0]
    };
    setHistory([newTxn, ...history]);
  };

  const outstandingAmt = fees
    .filter(f => f.status !== 'Paid')
    .reduce((sum, current) => sum + current.amount, 0);

  const clearedAmt = fees
    .filter(f => f.status === 'Paid')
    .reduce((sum, current) => sum + current.amount, 0);

  const chartData = [
    { name: 'Paid Dues', value: clearedAmt, color: '#10b981' },
    { name: 'Pending Dues', value: outstandingAmt, color: '#6366f1' }
  ];

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

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
          Fees & Payments Hub
          <Receipt className="h-5 w-5 text-indigo-400" />
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Review pending dues structures, submit term installments, and verify payment receipt logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cleared vs Outstanding Gauge */}
        <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 flex flex-col items-center">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center mb-4">
            Payment Progress Allocation
          </h4>
          
          <div className="h-48 w-full flex items-center justify-center">
            {clearedAmt === 0 && outstandingAmt === 0 ? (
              <span className="text-slate-500 text-xs italic">No fees mapped yet</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
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
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Cleared Amount
              </span>
              <span className="font-bold text-slate-200">₹{clearedAmt.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
              <span className="flex items-center gap-2 text-slate-400">
                <span className="h-2 w-2 rounded-full bg-indigo-500"></span> Outstanding Dues
              </span>
              <span className="font-bold text-slate-200">₹{outstandingAmt.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Bill Installments */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-400" /> Installments Due Schedule
            </h4>
            
            <div className="divide-y divide-slate-900/80">
              {fees.map((fee) => (
                <div key={fee.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between first:pt-0 last:pb-0 gap-3">
                  <div className="space-y-1">
                    <h5 className="text-sm font-bold text-slate-200">{fee.category}</h5>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-500" /> Due Date: {fee.dueDate}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-100 block">₹{fee.amount.toLocaleString()}</span>
                      <span className={`inline-block px-2 py-0.5 mt-1 rounded text-[9px] font-bold uppercase tracking-wider ${
                        fee.status === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {fee.status}
                      </span>
                    </div>
                    {fee.status !== 'Paid' && (
                      <button
                        onClick={() => triggerPayment(fee)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 active:scale-95 transition-all shrink-0"
                      >
                        Checkout
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Receipts History */}
      <div className="glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Receipt className="h-4 w-4 text-indigo-400" /> Historic Payment Logs
        </h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-900/60 pb-3 block table-row font-bold uppercase tracking-wider">
                <th className="py-2.5">Receipt / Transaction ID</th>
                <th className="py-2.5">Category</th>
                <th className="py-2.5">Method</th>
                <th className="py-2.5">Paid Date</th>
                <th className="py-2.5 text-right">Settled Amount</th>
                <th className="py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40">
              {history.map((h) => (
                <tr key={h.id}>
                  <td className="py-3.5">
                    <span className="font-semibold text-slate-200 block">{h.receiptNumber}</span>
                    <span className="text-[9px] text-slate-500 font-mono">{h.transactionId}</span>
                  </td>
                  <td className="py-3.5 font-medium text-slate-300">{h.category}</td>
                  <td className="py-3.5 text-slate-400">
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-full text-[10px] uppercase font-semibold">
                      {h.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-500">{h.paidAt}</td>
                  <td className="py-3.5 text-right font-black text-slate-200">₹{h.amount.toLocaleString()}</td>
                  <td className="py-3.5 text-right">
                    <button
                      onClick={() => alert(`Simulated receipt PDF download for receipt token: ${h.receiptNumber}`)}
                      className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors"
                      title="Download receipt PDF"
                    >
                      <Download className="h-4.5 w-4.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
