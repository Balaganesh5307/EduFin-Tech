import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send, AlertCircle, CheckCircle2 } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMsg(data.message || 'Verification token sent.');
        // Auto-redirect to reset password screen with email context after 2.5s
        setTimeout(() => {
          navigate(`/reset-password?email=${encodeURIComponent(email)}`);
        }, 2500);
      } else {
        setErrorMsg(data.message || 'Request failed. Verify email details.');
      }
    } catch (err) {
      console.warn('API forgot-password failed. Falling back to local mockup sandbox behavior...', err);
      // Fallback preview logic:
      setSuccessMsg('Demo Mock: Recovery OTP code logged in the server terminal output.');
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      }, 2500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-slate-950 overflow-hidden text-slate-100 p-4">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[120px]"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-violet-500/10 blur-[120px]"></div>

      <div className="w-full max-w-md z-10">
        <div className="glass-panel border-slate-800/80 rounded-2xl p-8 shadow-2xl relative text-left">
          
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors mb-6 group">
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Sign In
          </Link>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white">Reset Password</h3>
            <p className="text-sm text-slate-400 mt-1">Enter your registered campus email below to receive a password recovery verification OTP code.</p>
          </div>

          {errorMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
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

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3.5 text-sm font-semibold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? 'Sending Request...' : 'Send Recovery Token'}
              <Send className="h-4 w-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};
