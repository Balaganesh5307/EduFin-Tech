import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Plus,
  Info,
  Clock,
  Search,
  Filter,
  Trash2,
  ChevronRight,
  TrendingUp,
  Download,
  UploadCloud,
  Check,
  AlertTriangle,
  X,
  CreditCard
} from 'lucide-react';

export const EducationLoans: React.FC = () => {
  const { user, accessToken } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'schemes' | 'loans'>('schemes');

  // Core Data
  const [schemes, setSchemes] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Apply Modal state
  const [selectedScheme, setSelectedScheme] = useState<any>(null);
  const [amountRequested, setAmountRequested] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({}); // docType -> filename
  const [submitting, setSubmitting] = useState<boolean>(false);

  // EMI Calculator state
  const [calcPrincipal, setCalcPrincipal] = useState<number>(200000);
  const [calcRate, setCalcRate] = useState<number>(7.5);
  const [calcTenure, setCalcTenure] = useState<number>(36);
  const [calculatedEmi, setCalculatedEmi] = useState<number>(0);

  // Statement modal
  const [selectedLoanStatement, setSelectedLoanStatement] = useState<any>(null);
  const [statementBase64, setStatementBase64] = useState<string>('');
  const [loadingStatement, setLoadingStatement] = useState<boolean>(false);

  const fetchLoansData = async () => {
    setLoading(true);
    try {
      // 1. Get schemes
      const schemesRes = await fetch('/api/loans/schemes', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (schemesRes.ok) setSchemes(await schemesRes.json());

      // 2. Get applications & EMIs
      const appsRes = await fetch('/api/loans/my-applications', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (appsRes.ok) setApplications(await appsRes.json());
    } catch (err) {
      console.warn('Failed retrieving loans catalog:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchLoansData();
  }, [user]);

  // EMI calculation helper
  useEffect(() => {
    const r = calcRate / 12 / 100;
    if (r === 0) {
      setCalculatedEmi(Math.round(calcPrincipal / calcTenure));
    } else {
      const emi = (calcPrincipal * r * Math.pow(1 + r, calcTenure)) / (Math.pow(1 + r, calcTenure) - 1);
      setCalculatedEmi(Math.round(emi));
    }
  }, [calcPrincipal, calcRate, calcTenure]);

  // Trigger apply modal
  const handleApplyClick = (sch: any) => {
    setSelectedScheme(sch);
    setAmountRequested(sch.minAmount.toString());
    setPurpose('');
    setUploadedFiles({});
  };

  // Submit Loan Application
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScheme || !amountRequested || !purpose) return;

    setSubmitting(true);
    try {
      const applyRes = await fetch('/api/loans/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          schemeId: selectedScheme._id,
          amountRequested: parseFloat(amountRequested),
          purpose
        })
      });

      if (applyRes.ok) {
        const newApp = await applyRes.json();

        // Upload attachments
        const docTypes = ['IncomeCertificate', 'IdentityProof', 'AdmissionLetter', 'FeeStructure'];
        for (const docType of docTypes) {
          const fname = uploadedFiles[docType] || `${docType.toLowerCase()}_copy.pdf`;
          await fetch('/api/loans/upload-doc', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              applicationId: newApp._id,
              documentType: docType,
              filename: fname
            })
          });
        }

        alert('Loan application successfully logged! Reviewer pipeline notified.');
        setSelectedScheme(null);
        setPurpose('');
        setUploadedFiles({});
        fetchLoansData();
        setActiveTab('loans');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Pay EMI installment
  const handlePayEmi = async (loanId: string, instId: string) => {
    if (!window.confirm('Confirm EMI installment payment authorization?')) return;

    try {
      const res = await fetch(`/api/loans/${loanId}/pay-emi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          installmentId: instId,
          paymentMethod: 'UPI'
        })
      });
      if (res.ok) {
        alert('EMI installment paid successfully! Academic ledger statement updated.');
        fetchLoansData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Withdraw pending loan
  const handleWithdraw = async (appId: string) => {
    if (!window.confirm('Are you sure you want to retract this loan application?')) return;

    try {
      const res = await fetch(`/api/loans/${appId}/withdraw`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        alert('Loan application successfully withdrawn.');
        fetchLoansData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Retrieve base64 loan statement
  const handleDownloadStatement = async (loan: any) => {
    setSelectedLoanStatement(loan);
    setLoadingStatement(true);
    try {
      const res = await fetch(`/api/loans/${loan.application._id}/statement`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        const textB64 = await res.text();
        setStatementBase64(atob(textB64));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStatement(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2 text-left">
        <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-44 bg-slate-900 rounded-2xl"></div>
          <div className="h-44 bg-slate-900 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Predefined active loan helper
  const activeDisbursed = applications.find(item => item.application.status === 'Disbursed');
  const pendingApps = applications.filter(item => item.application.status === 'Submitted' || item.application.status === 'Verified');

  return (
    <div className="space-y-6 text-left relative">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
          Education Loans & EMIs
          <GraduationCap className="h-5 w-5 text-indigo-400" />
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Apply for tuition waivers, configure moratorium grace periods, and verify repayment schedules.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 gap-6 text-xs font-bold uppercase tracking-wider text-slate-500">
        <button
          onClick={() => setActiveTab('schemes')}
          className={`pb-3 transition-colors ${activeTab === 'schemes' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Loan Schemes Catalog
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`pb-3 transition-colors ${activeTab === 'loans' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          My Loans & Pipeline ({applications.length})
        </button>
      </div>

      {/* TAB 1: BROWSE LOAN SCHEMES */}
      {activeTab === 'schemes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Schemes grid */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {schemes.map((sch) => (
                <div key={sch._id} className="glass-panel border-slate-900 rounded-3xl p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[9px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {sch.interestRate === 0 ? 'Interest-Free' : `${sch.interestRate}% Interest P.A.`}
                    </span>
                    <h4 className="font-extrabold text-slate-100 text-base mt-2">{sch.name}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">{sch.description}</p>
                  </div>

                  <div className="w-full bg-slate-950/40 border border-slate-900/60 rounded-2xl p-3 grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                    <div>Limit: <strong>₹{sch.minAmount.toLocaleString()} - ₹{sch.maxAmount.toLocaleString()}</strong></div>
                    <div>Moratorium: <strong>{sch.gracePeriodMonths} Months</strong></div>
                    <div>Tenure: <strong>{sch.repaymentPeriodMonths} Months</strong></div>
                    <div>Fee: <strong>₹{sch.processingFee} Processing</strong></div>
                  </div>

                  <div className="border-t border-slate-800/60 pt-4 flex justify-between items-center">
                    <button
                      onClick={() => {
                        setCalcPrincipal(sch.maxAmount / 2);
                        setCalcRate(sch.interestRate);
                        setCalcTenure(sch.repaymentPeriodMonths);
                      }}
                      className="text-indigo-400 hover:text-indigo-300 font-bold text-xs"
                    >
                      Simulate EMI
                    </button>
                    <button
                      onClick={() => handleApplyClick(sch)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-4 rounded-xl text-xs active:scale-95 transition-all shadow"
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Amortization Calculator */}
          <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="h-4.5 w-4.5 text-indigo-400" /> EMI Calculator Simulation
            </h4>
            
            <div className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] text-slate-500 font-bold block mb-1">Principal Amount: ₹{calcPrincipal.toLocaleString()}</label>
                <input
                  type="range"
                  min="5000"
                  max="1000000"
                  step="5000"
                  value={calcPrincipal}
                  onChange={(e) => setCalcPrincipal(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Interest P.A. (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calcRate}
                    onChange={(e) => setCalcRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold block mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    value={calcTenure}
                    onChange={(e) => setCalcTenure(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="bg-slate-950 border border-slate-900 rounded-2xl p-4 text-center space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Estimated Monthly EMI</span>
                <span className="text-2xl font-black text-indigo-400">₹{calculatedEmi.toLocaleString()}</span>
                <span className="text-[9px] text-slate-500 block pt-1 leading-none font-medium">Principal & Interest combined</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY LOANS & APPLICATIONS */}
      {activeTab === 'loans' && (
        <div className="space-y-6">
          {/* Active loan section */}
          {activeDisbursed ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Metrics sidebar */}
              <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Disbursed
                    </span>
                    <h4 className="font-extrabold text-slate-100 text-lg mt-2">
                      {activeDisbursed.application.scheme?.name}
                    </h4>
                  </div>
                  <button
                    onClick={() => handleDownloadStatement(activeDisbursed)}
                    className="p-2 bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl transition-all shadow"
                    title="Account Statement"
                  >
                    <Download className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="border-t border-slate-800/60 pt-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Sanctioned Amount:</span>
                    <strong className="text-slate-200">₹{activeDisbursed.application.amountSanctioned?.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Repaid Amount:</span>
                    <strong className="text-emerald-400">₹{activeDisbursed.paidAmount?.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Remaining Principal:</span>
                    <strong className="text-slate-200">₹{activeDisbursed.remainingAmount?.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">Moratorium End:</span>
                    <strong className="text-indigo-400">{new Date(activeDisbursed.application.repaymentStartDate).toLocaleDateString()}</strong>
                  </div>
                </div>

                <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs font-medium leading-relaxed">
                  <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <p>EMI billing cycles trigger on the 5th of each calendar month. Late repayments attract auto-computed moratorium penalty interest logs.</p>
                </div>
              </div>

              {/* Installments Table */}
              <div className="lg:col-span-8 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-indigo-400" /> Repayment Calendar Schedule
                </h4>

                <div className="overflow-x-auto max-h-96 pr-1">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800/80 pb-3 block table-row font-bold uppercase tracking-wider">
                        <th className="py-2.5">Installment</th>
                        <th className="py-2.5">Due Date</th>
                        <th className="py-2.5">Principal</th>
                        <th className="py-2.5">Interest</th>
                        <th className="py-2.5">EMI Total</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5 text-right">Repay Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {activeDisbursed.schedule?.map((inst: any) => (
                        <tr key={inst._id}>
                          <td className="py-3 font-semibold text-slate-200"># {inst.installmentNumber}</td>
                          <td className="py-3 text-slate-400">{new Date(inst.dueDate).toLocaleDateString()}</td>
                          <td className="py-3 text-slate-300">₹{inst.principalAmount.toLocaleString()}</td>
                          <td className="py-3 text-slate-300">₹{inst.interestAmount.toLocaleString()}</td>
                          <td className="py-3 font-bold text-slate-200">₹{(inst.emiAmount + inst.lateFeeApplied).toLocaleString()}</td>
                          <td className="py-3">
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                              inst.status === 'Paid'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {inst.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {inst.status !== 'Paid' ? (
                              <button
                                onClick={() => handlePayEmi(activeDisbursed.application._id, inst._id)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1 px-3 rounded-lg text-[10px] active:scale-95 transition-all shadow"
                              >
                                Pay EMI
                              </button>
                            ) : (
                              <span className="text-emerald-400 font-bold text-[10px] flex items-center justify-end gap-0.5">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Cleared
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel border-slate-900 rounded-3xl p-8 text-center text-slate-500 italic">
              No active disbursed education loan files located.
            </div>
          )}

          {/* Pending Applications table */}
          {pendingApps.length > 0 && (
            <div className="glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Pending Loan Verification Pipelines
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800/80 pb-3 block table-row font-bold uppercase tracking-wider">
                      <th className="py-2.5">Loan Scheme</th>
                      <th className="py-2.5">Requested Amount</th>
                      <th className="py-2.5">Match Assessment</th>
                      <th className="py-2.5">Application Status</th>
                      <th className="py-2.5 text-right">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {pendingApps.map((item: any) => {
                      const app = item.application;
                      return (
                        <tr key={app._id}>
                          <td className="py-3.5 font-bold text-slate-200">
                            {app.scheme?.name}
                            <span className="text-[10px] text-slate-500 block font-normal mt-0.5">Requested on: {new Date(app.submissionDate).toLocaleDateString()}</span>
                          </td>
                          <td className="py-3.5 text-slate-300 font-semibold">₹{app.amountRequested.toLocaleString()}</td>
                          <td className="py-3.5 text-indigo-400 font-bold">{app.approvalProbability}% Approved Probability</td>
                          <td className="py-3.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              {app.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => handleWithdraw(app._id)}
                              className="text-rose-400 hover:text-rose-300 font-bold"
                            >
                              Withdraw Request
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. APPLICATION MODAL OVERLAY */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedScheme(null)}></div>
          
          <div className="glass-panel border-slate-900 rounded-3xl p-6 w-full max-w-lg relative z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-extrabold text-slate-100 text-lg leading-tight">Apply for Education Credit</h4>
                <span className="text-xs text-indigo-400 font-bold block mt-1">{selectedScheme.name}</span>
              </div>
              <button onClick={() => setSelectedScheme(null)} className="text-slate-500 hover:text-slate-300 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scheme Parameters */}
            <div className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl p-3.5 flex items-start gap-2.5 text-xs font-semibold leading-relaxed">
              <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div>
                <p>Scheme Rule Checklist:</p>
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-slate-300 font-medium">
                  <li>MORATORIUM: Payments deferred for the first {selectedScheme.gracePeriodMonths} months post sanction.</li>
                  <li>RATE: Fixed {selectedScheme.interestRate}% interest per annum applied monthly.</li>
                </ul>
              </div>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Request Amount (₹)</label>
                  <input
                    type="number"
                    required
                    min={selectedScheme.minAmount}
                    max={selectedScheme.maxAmount}
                    value={amountRequested}
                    onChange={(e) => setAmountRequested(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                  />
                  <span className="text-[9px] text-slate-500 block pt-1">Limit: ₹{selectedScheme.minAmount.toLocaleString()} - ₹{selectedScheme.maxAmount.toLocaleString()}</span>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">森Moratorium grace (Months)</label>
                  <input
                    type="text"
                    disabled
                    value={`${selectedScheme.gracePeriodMonths} Months`}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Upload Supporting Proofs Checklist</label>
                <div className="space-y-2 pt-1">
                  {['IncomeCertificate', 'IdentityProof', 'AdmissionLetter', 'FeeStructure'].map((docType) => {
                    const hasFile = !!uploadedFiles[docType];
                    return (
                      <div key={docType} className="p-3 bg-slate-950 border border-slate-900 rounded-xl flex items-center justify-between">
                        <span className="font-semibold text-slate-300">{docType}</span>
                        {hasFile ? (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="h-3.5 w-3.5" /> {uploadedFiles[docType]}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const fname = `${docType.toLowerCase()}_verified_${Date.now()}.pdf`;
                              setUploadedFiles(prev => ({ ...prev, [docType]: fname }));
                            }}
                            className="bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-600/20 transition-all"
                          >
                            <UploadCloud className="h-3.5 w-3.5" /> Upload File
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Statement of Purpose / Borrowing Reason</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Specify laptop purchases, hosteling bills, or outstanding tuition fee balance details..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 focus:outline-none placeholder-slate-600"
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedScheme(null)}
                  className="border border-slate-800 bg-slate-900 hover:bg-slate-850 text-slate-400 font-semibold py-2 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-5 rounded-xl shadow active:scale-95 transition-all disabled:opacity-55"
                >
                  {submitting ? 'Submitting...' : 'Submit Loan Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. STATEMENT VIEWER MODAL */}
      {selectedLoanStatement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedLoanStatement(null)}></div>
          
          <div className="glass-panel border-slate-900 rounded-3xl p-6 w-full max-w-2xl relative z-10 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-extrabold text-slate-100 text-base leading-tight">Loan Statement</h4>
                <span className="text-xs text-slate-500 mt-1 block">Account logs auditing records</span>
              </div>
              <button onClick={() => setSelectedLoanStatement(null)} className="text-slate-500 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingStatement ? (
              <div className="h-48 flex items-center justify-center text-slate-500 text-xs italic animate-pulse">Generating account ledger logs...</div>
            ) : (
              <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-900 text-left font-mono text-[10px] text-slate-300 whitespace-pre-wrap select-text max-h-[50vh] overflow-y-auto">
                {statementBase64}
              </pre>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLoanStatement(null)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl text-xs"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
