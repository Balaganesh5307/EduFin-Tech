import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  DollarSign,
  Plus,
  AlertTriangle,
  Info,
  Clock
} from 'lucide-react';

export const EducationLoans: React.FC = () => {
  const { user, accessToken } = useAuth();
  
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Apply form state
  const [showApplyForm, setShowApplyForm] = useState<boolean>(false);
  const [coName, setCoName] = useState<string>('');
  const [coRelation, setCoRelation] = useState<string>('Father');
  const [coIncome, setCoIncome] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [duration, setDuration] = useState<string>('36');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchLoansData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/student-finance/loans', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        setLoans(await response.json());
      }
    } catch (_) {}

    // Seed defaults offline if DB table is empty
    if (loans.length === 0) {
      // Mock active loan
      const mockInstallments = [];
      const baseDate = new Date();
      for (let i = 1; i <= 6; i++) {
        mockInstallments.push({
          _id: `inst_${i}`,
          dueDate: new Date(baseDate.getFullYear(), baseDate.getMonth() + i - 1, 5).toISOString().split('T')[0],
          amount: 5417,
          status: i === 1 ? 'Paid' : 'Unpaid'
        });
      }

      setLoans([
        {
          _id: 'loan_mock_123',
          coApplicantName: 'Robert Johnson',
          coApplicantRelationship: 'Father',
          coApplicantIncome: 650000,
          loanAmount: 180000,
          interestRate: 7.5,
          durationMonths: 36,
          emiAmount: 5417,
          status: 'Disbursed',
          installments: mockInstallments
        }
      ]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchLoansData();
  }, [user]);

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coName || !coIncome || !amount) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/student-finance/loans/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          coApplicantName: coName,
          coApplicantRelationship: coRelation,
          coApplicantIncome: parseFloat(coIncome),
          loanAmount: parseFloat(amount),
          durationMonths: parseInt(duration)
        })
      });

      if (response.ok) {
        alert('Loan application posted successfully! Admins are reviewing your credentials.');
        setShowApplyForm(false);
        // Reload list
        const listRes = await fetch('/api/student-finance/loans', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (listRes.ok) {
          setLoans(await listRes.json());
        }
      }
    } catch (_) {
      const amt = parseFloat(amount);
      const mths = parseInt(duration);
      const emi = Math.round((amt * (7.5 / 12 / 100) * Math.pow(1 + 7.5 / 12 / 100, mths)) / (Math.pow(1 + 7.5 / 12 / 100, mths) - 1));
      
      const newMockLoan = {
        _id: `loan_new_${Date.now()}`,
        coApplicantName: coName,
        coApplicantRelationship: coRelation,
        coApplicantIncome: parseFloat(coIncome),
        loanAmount: amt,
        interestRate: 7.5,
        durationMonths: mths,
        emiAmount: emi,
        status: 'Pending',
        installments: []
      };
      setLoans([...loans, newMockLoan]);
      setShowApplyForm(false);
      alert('Demo Mock: Loan request submitted successfully (Pending Review).');
    } finally {
      setSubmitting(false);
      setCoName('');
      setCoIncome('');
      setAmount('');
    }
  };

  const handlePayEmi = async (loanId: string, instId: string) => {
    try {
      const response = await fetch(`/api/student-finance/loans/${loanId}/pay-emi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ installmentId: instId })
      });
      if (response.ok) {
        alert('EMI installment paid successfully!');
        // Reload
        const rResponse = await fetch('/api/student-finance/loans', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (rResponse.ok) {
          setLoans(await rResponse.json());
        }
      }
    } catch (_) {
      // Mock local payment update
      const updatedLoans = loans.map(loan => {
        if (loan._id === loanId) {
          const updatedInsts = loan.installments.map((i: any) => {
            if (i._id === instId) {
              return { ...i, status: 'Paid' };
            }
            return i;
          });
          return { ...loan, installments: updatedInsts };
        }
        return loan;
      });
      setLoans(updatedLoans);
      alert('Demo Mock: EMI payment successfully credited!');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2 text-left">
        <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 bg-slate-900 rounded-2xl md:col-span-1"></div>
          <div className="h-44 bg-slate-900 rounded-2xl md:col-span-2"></div>
        </div>
      </div>
    );
  }

  const activeLoan = loans.find(l => l.status === 'Disbursed');
  const pendingLoans = loans.filter(l => l.status === 'Pending');

  return (
    <div className="space-y-6 text-left relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
            Education Loans
            <GraduationCap className="h-5 w-5 text-indigo-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Allocate academic credits, track EMI calendars, and request new educational funds.
          </p>
        </div>
        <button
          onClick={() => setShowApplyForm(!showApplyForm)}
          className="text-xs bg-indigo-600 border border-indigo-600 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" /> Request Loan
        </button>
      </div>

      {/* Row 1: Active Loan Details */}
      {activeLoan ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main metrics */}
          <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Active Disbursed Loan
            </span>
            <h3 className="text-3xl font-black text-slate-100">
              ₹{activeLoan.loanAmount.toLocaleString()}
            </h3>

            <div className="w-full bg-slate-900/40 border border-slate-900/60 rounded-2xl p-4 grid grid-cols-2 gap-3 text-[11px] text-slate-400">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Interest Rate</span>
                <span className="font-bold text-indigo-400">{activeLoan.interestRate}% P.A.</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Tenure</span>
                <span className="font-semibold text-slate-200">{activeLoan.durationMonths} Months</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Monthly EMI</span>
                <span className="font-bold text-slate-200">₹{activeLoan.emiAmount.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Co-Applicant</span>
                <span className="font-semibold text-slate-200 truncate block">{activeLoan.coApplicantName}</span>
              </div>
            </div>

            <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl p-3.5 flex items-start gap-2.5 text-[11px]">
              <Info className="h-4.5 w-4.5 shrink-0" />
              <p>Interest rate is fixed for the entire tenure of this credit pipeline under SBS University guidelines.</p>
            </div>
          </div>

          {/* EMI calendar */}
          <div className="lg:col-span-8 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-indigo-400" /> EMI Installments Schedule
            </h4>
            
            <div className="divide-y divide-slate-900/80 max-h-80 overflow-y-auto pr-1">
              {activeLoan.installments?.map((inst: any, idx: number) => (
                <div key={inst._id || idx} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                      inst.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-900 text-slate-500'
                    }`}>
                      <Clock className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-200 text-xs">Installment #{idx + 1}</h5>
                      <span className="text-[10px] text-slate-500">Due: {inst.dueDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-bold text-slate-100 block text-xs">₹{inst.amount.toLocaleString()}</span>
                      <span className={`inline-block px-1.5 py-0.5 mt-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        inst.status === 'Paid'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {inst.status}
                      </span>
                    </div>
                    {inst.status === 'Unpaid' && (
                      <button
                        onClick={() => handlePayEmi(activeLoan._id, inst._id)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-3 rounded-lg text-[10px] active:scale-95 transition-all shadow-md shadow-indigo-600/5 hover:shadow-indigo-500/10"
                      >
                        Pay EMI
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel border-slate-900 rounded-3xl p-8 text-center text-slate-500 italic">
          No active disbursed education loans located for this account.
        </div>
      )}

      {/* Pending pipeline requests */}
      {pendingLoans.length > 0 && (
        <div className="glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Pending Loan Pipeline Requests
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pendingLoans.map((p) => (
              <div key={p._id} className="p-4 border border-slate-900 bg-slate-950/20 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Requested Value</span>
                    <h5 className="font-extrabold text-slate-200 text-sm">₹{p.loanAmount.toLocaleString()}</h5>
                  </div>
                  <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[8px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    In Review
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 space-y-1">
                  <div>Co-Applicant: <strong>{p.coApplicantName} ({p.coApplicantRelationship})</strong></div>
                  <div>Tenure: <strong>{p.durationMonths} Months</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Form Drawer / Modal overlay */}
      {showApplyForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setShowApplyForm(false)}></div>
          
          <div className="glass-panel border-slate-900 rounded-3xl p-6 w-full max-w-md relative z-10 space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-100 text-lg leading-tight">Request Education Loan</h4>
              <p className="text-xs text-slate-400 mt-1">Submit parameters for academic credit evaluation pipelines.</p>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs text-left">
              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Requested Loan Principal (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="E.g., 200000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Co-Applicant Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g., Robert Johnson"
                    value={coName}
                    onChange={(e) => setCoName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Relationship</label>
                  <select
                    value={coRelation}
                    onChange={(e) => setCoRelation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-400 focus:outline-none"
                  >
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Co-Applicant Annual Income (₹)</label>
                  <input
                    type="number"
                    required
                    placeholder="E.g., 600000"
                    value={coIncome}
                    onChange={(e) => setCoIncome(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Tenure (Months)</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-400 focus:outline-none"
                  >
                    <option value="12">12 Months (1 Year)</option>
                    <option value="24">24 Months (2 Years)</option>
                    <option value="36">36 Months (3 Years)</option>
                    <option value="48">48 Months (4 Years)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyForm(false)}
                  className="border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 font-semibold py-2 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-55"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
