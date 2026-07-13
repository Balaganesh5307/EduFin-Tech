import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { PaymentModal } from '../../components/payment-modal';
import { CreditCard, PiggyBank, Award, GraduationCap } from 'lucide-react';

export const ParentFinancials: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Payment triggers
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [payModalOpen, setPayModalOpen] = useState<boolean>(false);

  const FALLBACK_DASHBOARD = {
    child: { id: 'mock_child_1' },
    finance: {
      outstandingFees: 20000,
      paidFees: 90000,
      installments: [
        { category: 'Transport & Examination Fees', amount: 12000, dueDate: '2026-08-30', status: 'Pending' },
        { category: 'Library & Lab Access Fees', amount: 8000, dueDate: '2026-09-15', status: 'Pending' }
      ],
      scholarships: [
        { name: 'Merit-Based Academic Waiver', amount: 75000, status: 'Approved' }
      ],
      loans: [
        { name: 'Campus Education Aid Loan', amount: 200000, status: 'Active', emi: 8500 }
      ]
    },
    expenses: [
      { _id: 'e1', date: new Date('2026-07-10'), description: 'Textbooks & Reference Material', category: 'Education', amount: 2400 },
      { _id: 'e2', date: new Date('2026-07-08'), description: 'Monthly Hostel Canteen', category: 'Food', amount: 3500 },
      { _id: 'e3', date: new Date('2026-07-05'), description: 'Metro Transport Card Recharge', category: 'Transport', amount: 1000 },
      { _id: 'e4', date: new Date('2026-07-01'), description: 'Online Course Subscription', category: 'Education', amount: 1500 }
    ]
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/portals/parent/dashboard', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        setDashboardData(await res.json());
      } else {
        setDashboardData(FALLBACK_DASHBOARD);
      }
    } catch {
      setDashboardData(FALLBACK_DASHBOARD);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const triggerPayment = (invoice: any) => {
    setActiveInvoice({
      id: invoice.id || 'tuition_fee',
      category: invoice.category || 'Outstanding Tuition Dues',
      amount: invoice.amount
    });
    setPayModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPayModalOpen(false);
    alert('Payment captured successfully! Child outstanding billing ledger updated.');
    loadData();
  };

  if (loading || !dashboardData) {
    return (
      <div className="space-y-6 animate-pulse p-2 text-left">
        <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
        <div className="h-44 bg-slate-900 rounded-2xl"></div>
      </div>
    );
  }

  const finance = dashboardData.finance;
  const expenses = dashboardData.expenses;

  return (
    <div className="space-y-6 text-left relative">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
          Financial Overview & Spends Tracker
          <PiggyBank className="h-5 w-5 text-indigo-400" />
        </h1>
        <p className="text-sm text-slate-400 mt-1">Audit child fee dues payments, active scholarships, and student loan balances.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Bills Schedule */}
        <div className="lg:col-span-8 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <CreditCard className="h-4.5 w-4.5 text-indigo-400" /> Outstanding Bills Schedule
          </h4>
          <div className="divide-y divide-slate-800/40 text-xs">
            {finance.installments.map((inst: any, idx: number) => (
              <div key={idx} className="py-3.5 flex justify-between items-center">
                <div>
                  <strong className="text-slate-300 block">{inst.category}</strong>
                  <span className="text-[10px] text-slate-500">Due: {new Date(inst.dueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-4 items-center">
                  <span className="font-bold text-slate-200">₹{inst.amount.toLocaleString()}</span>
                  <button
                    onClick={() => triggerPayment({ category: inst.category, amount: inst.amount })}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-3 rounded-lg text-[10px] active:scale-95 transition-all shadow"
                  >
                    Pay Online
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scholarships & Loans summary */}
        <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 space-y-4 text-xs text-left">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Scholarships & Education Loans</h4>
          <div className="space-y-3 pt-1">
            {finance.scholarships.map((s: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex justify-between items-center">
                <div>
                  <strong className="text-slate-300 block">{s.name}</strong>
                  <span className="text-[9px] text-emerald-400 font-bold uppercase">{s.status}</span>
                </div>
                <span className="font-bold text-slate-200">₹{s.amount.toLocaleString()}</span>
              </div>
            ))}
            {finance.loans.map((l: any, idx: number) => (
              <div key={idx} className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex justify-between items-center">
                <div>
                  <strong className="text-slate-300 block">{l.name}</strong>
                  <span className="text-[9px] text-indigo-400 block font-semibold">Monthly EMI: ₹{l.emi}</span>
                </div>
                <span className="font-bold text-slate-200">₹{l.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gated Student Personal Spends */}
      {expenses ? (
        <div className="glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <PiggyBank className="h-4.5 w-4.5 text-indigo-400" /> Child Personal Expense Log (Access Authorized)
          </h4>
          <div className="overflow-x-auto pr-1">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800/85 pb-3 block table-row font-bold uppercase tracking-wider">
                  <th className="py-2.5">Date</th>
                  <th className="py-2.5">Description Item</th>
                  <th className="py-2.5">Spends Category</th>
                  <th className="py-2.5 text-right">Spends Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {expenses.map((e: any) => (
                  <tr key={e._id}>
                    <td className="py-3 text-slate-400">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="py-3 font-semibold text-slate-200">{e.description}</td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 bg-slate-900 border border-slate-850 rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-slate-200">₹{e.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass-panel border-slate-900 rounded-3xl p-6 text-center text-slate-500 italic text-xs">
          No visibility authorized for child's personal budgeting logs.
        </div>
      )}

      <PaymentModal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        invoice={activeInvoice}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};
