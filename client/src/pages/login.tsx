import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/auth.context';
import { Lock, Mail, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const demoAccounts = [
    { email: 'student@edufin.edu', role: 'Student' },
    { email: 'parent@edufin.edu', role: 'Parent' },
    { email: 'faculty@edufin.edu', role: 'Faculty' },
    { email: 'admin@edufin.edu', role: 'Admin' },
    { email: 'superadmin@edufin.edu', role: 'SuperAdmin' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const autofill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setErrorMsg(null);
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-slate-950 overflow-hidden text-slate-100 p-4">
      {/* Background Animated Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center z-10">
        
        {/* Brand/Product Intro Panel */}
        <div className="md:col-span-6 space-y-6 text-left hidden md:block">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 shadow-xl shadow-indigo-600/30">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.33l-7.5-5-7.5 5V21m15 0H3" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">EduFin</h1>
          </div>
          
          <h2 className="text-4xl font-bold tracking-tight text-slate-100 leading-tight">
            AI-Powered Campus Finance <br />
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Ecosystem</span>
          </h2>
          
          <p className="text-slate-400 leading-relaxed max-w-md">
            An all-in-one financial dashboard built for students, parents, faculty, and administrative teams. Track bills, coordinate loans, explore scholarship options, and monitor personal budgets automatically.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2.5 text-sm text-slate-300">
              <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0" />
              <span>Full Razorpay checkout integration</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-300">
              <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0" />
              <span>AI Budget suggestions & matching engine</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-slate-300">
              <CheckCircle2 className="h-5 w-5 text-indigo-400 shrink-0" />
              <span>Independent UI workspaces for each role</span>
            </div>
          </div>
        </div>

        {/* Login Form Panel */}
        <div className="md:col-span-6 w-full max-w-md mx-auto">
          <div className="glass-panel border-slate-800/80 rounded-2xl p-8 shadow-2xl relative">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-white">Sign In</h3>
              <p className="text-sm text-slate-400 mt-1">Enter your campus account credentials below.</p>
            </div>

            {errorMsg && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Campus Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@edufin.edu"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3.5 text-sm font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? 'Authenticating...' : 'Sign In'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick Demo Accounts Seeder Autofiller */}
            <div className="mt-8 pt-6 border-t border-slate-800/80">
              <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-3">Quick Sandbox Demo Login</label>
              <div className="flex flex-wrap gap-2">
                {demoAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => autofill(acc.email)}
                    className="text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:border-indigo-500/50 hover:bg-indigo-950/20 px-3 py-2 rounded-xl transition-all font-medium flex items-center gap-1.5"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400"></span>
                    {acc.role}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
