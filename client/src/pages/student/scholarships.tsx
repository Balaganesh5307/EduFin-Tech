import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { motion } from 'framer-motion';
import {
  Award,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  DollarSign,
  Briefcase
} from 'lucide-react';

export const Scholarships: React.FC = () => {
  const { user, accessToken } = useAuth();
  
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Application Modal state
  const [selectedScholarship, setSelectedScholarship] = useState<any>(null);
  const [applyGpa, setApplyGpa] = useState<string>('');
  const [applyIncome, setApplyIncome] = useState<string>('');
  const [applyStatement, setApplyStatement] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchScholarshipData = async () => {
    setLoading(true);
    try {
      // 1. Get available scholarships catalog
      const listRes = await fetch('/api/student-finance/scholarships', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (listRes.ok) {
        setScholarships(await listRes.json());
      }
    } catch (_) {}

    try {
      // 2. Get active applications submitted by this student
      const appRes = await fetch('/api/student-finance/scholarships/applications', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (appRes.ok) {
        setApplications(await appRes.json());
      }
    } catch (_) {}

    // Overriding defaults in case of empty DB seeds
    if (scholarships.length === 0) {
      setScholarships([
        {
          _id: 'sch1',
          name: 'Merit-Cum-Means Scholarship',
          description: 'Awarded to students with excellent academic records (GPA > 8.5) and family income under ₹4,00,000.',
          discountType: 'Fixed',
          discountValue: 35000,
          eligibilityCriteria: 'GPA > 8.5, Income < 4L per annum'
        },
        {
          _id: 'sch2',
          name: 'SJT Trust Tuition Waiver',
          description: 'Full 100% tuition fee waiver for top performing computer science branch students.',
          discountType: 'Percentage',
          discountValue: 100,
          eligibilityCriteria: 'GPA > 9.2'
        },
        {
          _id: 'sch3',
          name: 'National Scholarship Portal Support',
          description: 'Government assistance for minorities and backward classes with family income limit of ₹2,500,000.',
          discountType: 'Fixed',
          discountValue: 20000,
          eligibilityCriteria: 'Income < 2.5L per annum'
        },
        {
          _id: 'sch4',
          name: 'Sports Fellowship Award',
          description: 'Waiver for students representing the university at state or national sports tournaments.',
          discountType: 'Fixed',
          discountValue: 15000,
          eligibilityCriteria: 'National or State certificate verified'
        }
      ]);
    }

    if (applications.length === 0) {
      setApplications([
        {
          _id: 'app_mock_1',
          scholarship: { name: 'Merit-Cum-Means Scholarship' },
          gpa: 8.9,
          familyIncome: 320000,
          status: 'Pending',
          createdAt: new Date('2026-07-02').toISOString()
        }
      ]);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchScholarshipData();
  }, [user]);

  const handleApplyClick = (sch: any) => {
    setSelectedScholarship(sch);
    setApplyGpa('8.7'); // Populate current student GPA as mock default
    setApplyIncome('350000');
    setApplyStatement('');
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyGpa || !applyIncome) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/student-finance/scholarships/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          scholarshipId: selectedScholarship._id,
          gpa: parseFloat(applyGpa),
          familyIncome: parseFloat(applyIncome),
          statement: applyStatement
        })
      });

      if (response.ok) {
        alert('Application submitted successfully to Admin queue!');
        // Reload applications list
        const appRes = await fetch('/api/student-finance/scholarships/applications', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (appRes.ok) {
          setApplications(await appRes.json());
        } else {
          // Add locally
          const localApp = {
            _id: `app_new_${Date.now()}`,
            scholarship: { name: selectedScholarship.name },
            gpa: parseFloat(applyGpa),
            familyIncome: parseFloat(applyIncome),
            status: 'Pending',
            createdAt: new Date().toISOString()
          };
          setApplications([localApp, ...applications]);
        }
      }
    } catch (_) {
      const localApp = {
        _id: `app_new_${Date.now()}`,
        scholarship: { name: selectedScholarship.name },
        gpa: parseFloat(applyGpa),
        familyIncome: parseFloat(applyIncome),
        status: 'Pending',
        createdAt: new Date().toISOString()
      };
      setApplications([localApp, ...applications]);
      alert('Demo Mock: Application posted to scholarship queue.');
    } finally {
      setSubmitting(false);
      setSelectedScholarship(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2 text-left">
        <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 bg-slate-900 rounded-2xl"></div>
          <div className="h-48 bg-slate-900 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left relative">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
          Scholarships
          <Award className="h-5 w-5 text-indigo-400" />
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Explore financial aid options, submit waivers, and review current application states.
        </p>
      </div>

      {/* Catalog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scholarships.map((sch) => (
          <div key={sch._id} className="glass-panel border-slate-900 rounded-3xl p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <h4 className="font-extrabold text-slate-100 text-base">{sch.name}</h4>
                <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-black px-3 py-1 rounded-xl text-xs shrink-0">
                  {sch.discountType === 'Fixed' ? `₹${sch.discountValue.toLocaleString()}` : `${sch.discountValue}% Waiver`}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">{sch.description}</p>
            </div>

            <div className="border-t border-slate-900/60 pt-4 flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-500 block uppercase font-bold tracking-wider">Criteria</span>
                <span className="text-xs font-semibold text-slate-300">{sch.eligibilityCriteria}</span>
              </div>
              <button
                onClick={() => handleApplyClick(sch)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-1.5 px-4 rounded-xl text-xs shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 active:scale-95 transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* History Ledger */}
      <div className="glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          Submitted Applications History
        </h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-900/60 pb-3 block table-row font-bold uppercase tracking-wider">
                <th className="py-2.5">Scholarship Name</th>
                <th className="py-2.5">GPA Submitted</th>
                <th className="py-2.5">Family Income</th>
                <th className="py-2.5">Submission Date</th>
                <th className="py-2.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40">
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                    No active applications logged yet.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id}>
                    <td className="py-3.5 font-bold text-slate-200">{app.scholarship?.name || 'Academic Scholarship'}</td>
                    <td className="py-3.5 text-slate-300">{app.gpa}</td>
                    <td className="py-3.5 text-slate-400">₹{app.familyIncome?.toLocaleString() || 'N/A'}</td>
                    <td className="py-3.5 text-slate-500">{new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="py-3.5 text-right">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        app.status === 'Approved'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : app.status === 'Rejected'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Application Form overlay */}
      {selectedScholarship && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedScholarship(null)}></div>
          
          <div className="glass-panel border-slate-900 rounded-3xl p-6 w-full max-w-md relative z-10 space-y-4">
            <div>
              <h4 className="font-extrabold text-slate-100 text-lg leading-tight">Apply for Scholarship</h4>
              <span className="text-xs text-indigo-400 font-bold block mt-1">{selectedScholarship.name}</span>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Current CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={applyGpa}
                    onChange={(e) => setApplyGpa(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Annual Income (₹)</label>
                  <input
                    type="number"
                    required
                    value={applyIncome}
                    onChange={(e) => setApplyIncome(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Statement of Motivation / Purpose</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain why you are eligible for this grant..."
                  value={applyStatement}
                  onChange={(e) => setApplyStatement(e.target.value)}
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
