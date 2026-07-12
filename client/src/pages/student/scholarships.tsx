import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  DollarSign,
  Briefcase,
  Search,
  Filter,
  Plus,
  Trash2,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowUpRight,
  X,
  UploadCloud,
  Check,
  AlertTriangle
} from 'lucide-react';

export const Scholarships: React.FC = () => {
  const { user, accessToken } = useAuth();

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'catalog' | 'applied'>('catalog');

  // Core Data
  const [catalog, setCatalog] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Apply Modal state
  const [selectedScholarship, setSelectedScholarship] = useState<any>(null);
  const [motivation, setMotivation] = useState<string>('');
  const [userGpa, setUserGpa] = useState<string>('8.85'); // default student metrics
  const [userIncome, setUserIncome] = useState<string>('320000');
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({}); // docType -> filename
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Timeline & Detail modal
  const [activeAppDetails, setActiveAppDetails] = useState<any>(null);

  const fetchScholarshipsData = async () => {
    setLoading(true);
    try {
      // 1. Get Catalog
      const catRes = await fetch('/api/scholarships', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (catRes.ok) setCatalog(await catRes.json());

      // 2. Get Student Applications
      const appRes = await fetch('/api/scholarships/my-applications', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (appRes.ok) setApplications(await appRes.json());
    } catch (err) {
      console.warn('Failed to retrieve live aid details:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchScholarshipsData();
  }, [user]);

  // Handle Application Submit
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScholarship || !motivation || !userGpa || !userIncome) return;

    setSubmitting(true);
    try {
      const applyRes = await fetch('/api/scholarships/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          scholarshipId: selectedScholarship._id,
          currentGpa: parseFloat(userGpa),
          familyIncome: parseFloat(userIncome),
          motivationStatement: motivation
        })
      });

      if (applyRes.ok) {
        const newApp = await applyRes.json();

        // Upload attached mock documents
        for (const [docType, filename] of Object.entries(uploadedFiles)) {
          await fetch('/api/scholarships/upload-doc', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              applicationId: newApp._id,
              documentType: docType,
              filename
            })
          });
        }

        alert('Application submitted successfully to Admin queue!');
        setSelectedScholarship(null);
        setMotivation('');
        setUploadedFiles({});
        fetchScholarshipsData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Withdraw active request
  const handleWithdraw = async (appId: string) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;

    try {
      const res = await fetch(`/api/scholarships/withdraw/${appId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (res.ok) {
        alert('Application successfully withdrawn.');
        fetchScholarshipsData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Check student eligibility client-side for prompt indicator
  const verifyCriteriaEligibility = (rules: any) => {
    const gpa = parseFloat(userGpa);
    const income = parseFloat(userIncome);

    const gpaOk = gpa >= (rules?.minGpa || 0);
    const incomeOk = income <= (rules?.maxFamilyIncome || 99999999);
    
    return {
      isEligible: gpaOk && incomeOk,
      gpaOk,
      incomeOk
    };
  };

  // Filters
  const filteredCatalog = catalog.filter(sch => {
    const matchesSearch = sch.title.toLowerCase().includes(searchTerm.toLowerCase()) || sch.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter ? sch.category?.name === categoryFilter : true;
    return matchesSearch && matchesCat;
  });

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

  // Predefined Categories
  const categories = [
    'Government Scholarship',
    'Merit Scholarship',
    'Sports Scholarship',
    'Need-Based Scholarship',
    'Research Scholarship',
    'International Scholarship'
  ];

  return (
    <div className="space-y-6 text-left relative">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
            Scholarships & Financial Aid
            <Award className="h-5 w-5 text-indigo-400" />
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Explore aid options, verify criteria, submit waivers, and review current application processing states.
          </p>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 flex items-center gap-2.5 text-xs text-slate-400">
          <span className="font-bold">GPA: {userGpa}</span>
          <span className="h-3 w-px bg-slate-800"></span>
          <span className="font-bold">Income: ₹{parseInt(userIncome).toLocaleString()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800/80 gap-6 text-xs font-bold uppercase tracking-wider text-slate-500">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`pb-3 transition-colors ${activeTab === 'catalog' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          Browse Catalog
        </button>
        <button
          onClick={() => setActiveTab('applied')}
          className={`pb-3 transition-colors ${activeTab === 'applied' ? 'border-b-2 border-indigo-500 text-indigo-400' : 'hover:text-slate-300'}`}
        >
          My Applications ({applications.length})
        </button>
      </div>

      {/* 1. BROWSE CATALOG TAB */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search scholarship name or provider..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 focus:outline-none"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Catalog Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCatalog.map((sch) => {
              const check = verifyCriteriaEligibility(sch.eligibilityRules);
              return (
                <div key={sch._id} className="glass-panel border-slate-900 rounded-3xl p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <span className="text-[9px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          {sch.category?.name || 'Fellowship'}
                        </span>
                        <h4 className="font-extrabold text-slate-100 text-base mt-1.5">{sch.title}</h4>
                      </div>
                      <span className="bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 font-black px-3 py-1 rounded-xl text-xs shrink-0">
                        ₹{sch.amount.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">{sch.description}</p>
                    <span className="text-[10px] text-slate-500 font-semibold block">Provider: {sch.provider}</span>
                  </div>

                  <div className="border-t border-slate-800/60 pt-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Eligibility Check</span>
                      <div className="flex items-center gap-1.5">
                        {check.isEligible ? (
                          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Eligible
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" /> Criteria mismatch
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedScholarship(sch)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-4 rounded-xl text-xs active:scale-95 transition-all shadow"
                    >
                      Apply Online
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. MY APPLICATIONS TAB */}
      {activeTab === 'applied' && (
        <div className="glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Submitted Financial Aid Applications
          </h4>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800/80 pb-3 block table-row font-bold uppercase tracking-wider">
                  <th className="py-2.5">Scholarship Title</th>
                  <th className="py-2.5">CGPA Submitted</th>
                  <th className="py-2.5">Family Income</th>
                  <th className="py-2.5">Match Rating</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                      No active scholarship application logs found.
                    </td>
                  </tr>
                ) : (
                  applications.map((item) => {
                    const app = item.application;
                    return (
                      <tr key={app._id}>
                        <td className="py-3.5 font-bold text-slate-200">
                          {app.scholarship?.title || 'Academic Grant'}
                          <span className="text-[10px] text-slate-500 block font-normal mt-0.5">Submitted: {new Date(app.submissionDate).toLocaleDateString()}</span>
                        </td>
                        <td className="py-3.5 text-slate-300">{app.currentGpa}</td>
                        <td className="py-3.5 text-slate-400">₹{app.familyIncome.toLocaleString()}</td>
                        <td className="py-3.5 text-indigo-400 font-bold">{app.matchesScore}% Fit</td>
                        <td className="py-3.5">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            app.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : app.status === 'Rejected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : app.status === 'Withdrawn'
                              ? 'bg-slate-800 text-slate-500 border border-slate-700'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="flex justify-end gap-3.5 items-center">
                            <button
                              onClick={() => setActiveAppDetails(item)}
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                            >
                              Track Progress
                            </button>
                            {app.status === 'Submitted' && (
                              <button
                                onClick={() => handleWithdraw(app._id)}
                                className="text-rose-400 hover:text-rose-300"
                              >
                                Withdraw
                              </button>
                            )}
                            {app.status === 'Approved' && (
                              <a
                                href={`/api/scholarships/approval-letter/${app._id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-emerald-400 font-bold flex items-center gap-0.5"
                              >
                                Letter <ArrowUpRight className="h-3 w-3" />
                              </a>
                            )}
                          </div>
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

      {/* 3. SUBMIT NEW APPLICATION MODAL OVERLAY */}
      {selectedScholarship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedScholarship(null)}></div>
          
          <div className="glass-panel border-slate-900 rounded-3xl p-6 w-full max-w-lg relative z-10 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-extrabold text-slate-100 text-lg leading-tight">Apply for Scholarship</h4>
                <span className="text-xs text-indigo-400 font-bold block mt-1">{selectedScholarship.title}</span>
              </div>
              <button onClick={() => setSelectedScholarship(null)} className="text-slate-500 hover:text-slate-300 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Eligibility Warnings */}
            {(() => {
              const check = verifyCriteriaEligibility(selectedScholarship.eligibilityRules);
              if (!check.isEligible) {
                return (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl p-3.5 flex items-start gap-2.5 text-xs">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Eligibility Warning:</p>
                      <ul className="list-disc pl-4 mt-1 space-y-0.5 font-medium">
                        {!check.gpaOk && <li>Your current GPA ({userGpa}) is below the required minimum ({selectedScholarship.eligibilityRules.minGpa})</li>}
                        {!check.incomeOk && <li>Your family income (₹{parseInt(userIncome).toLocaleString()}) exceeds the limit (₹{selectedScholarship.eligibilityRules.maxFamilyIncome.toLocaleString()})</li>}
                      </ul>
                    </div>
                  </div>
                );
              }
              return (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3.5 flex items-start gap-2.5 text-xs">
                  <Check className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <p className="font-medium">You meet all eligibility requirements! Your profile has been pre-matched successfully.</p>
                </div>
              );
            })()}

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Current CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={userGpa}
                    onChange={(e) => setUserGpa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Annual Household Income (₹)</label>
                  <input
                    type="number"
                    required
                    value={userIncome}
                    onChange={(e) => setUserIncome(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Required Documents Upload</label>
                <div className="space-y-2.5 pt-1.5">
                  {selectedScholarship.requiredDocuments.map((docType: string) => {
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
                              const fname = `${docType.toLowerCase()}_copy_${userGpa}.pdf`;
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
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Motivation Statement</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your achievements, extra-curricular credits, or financial circumstances..."
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 focus:outline-none placeholder-slate-600"
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedScholarship(null)}
                  className="border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 font-semibold py-2 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-5 rounded-xl shadow-md active:scale-95 transition-all disabled:opacity-55"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. TRACKING TIMELINE MODAL OVERLAY */}
      {activeAppDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setActiveAppDetails(null)}></div>
          
          <div className="glass-panel border-slate-900 rounded-3xl p-6 w-full max-w-md relative z-10 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-extrabold text-slate-100 text-base leading-tight">
                  {activeAppDetails.application?.scholarship?.title}
                </h4>
                <span className="text-[11px] text-indigo-400 font-bold mt-1 block">
                  Application ID: {activeAppDetails.application?._id}
                </span>
              </div>
              <button onClick={() => setActiveAppDetails(null)} className="text-slate-500 hover:text-slate-300 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* AI match ratings index */}
            <div className="grid grid-cols-3 gap-3 text-center border-y border-slate-900 py-3">
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-900">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Match Score</span>
                <span className="text-sm font-black text-indigo-400">{activeAppDetails.application?.matchesScore}%</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-900">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Eligible Rating</span>
                <span className="text-sm font-black text-emerald-400">{activeAppDetails.application?.eligibilityScore}%</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-xl border border-slate-900">
                <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Approval Prob</span>
                <span className="text-sm font-black text-indigo-400">{activeAppDetails.application?.approvalProbability}%</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4 text-xs">
              <h5 className="font-bold text-slate-400 uppercase tracking-wider">Disbursement Progress Timeline</h5>
              <div className="relative pl-6 space-y-4 border-l border-slate-800">
                {activeAppDetails.timeline?.map((step: any, idx: number) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-[30px] top-0.5 h-4 w-4 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center shrink-0">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-400"></div>
                    </div>
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 font-bold block">{new Date(step.date).toLocaleString()}</span>
                      <h6 className="font-bold text-slate-200 mt-0.5">{step.status}</h6>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setActiveAppDetails(null)}
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
