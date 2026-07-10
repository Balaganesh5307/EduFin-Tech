import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { PaymentModal } from '../../components/payment-modal';
import { motion } from 'framer-motion';
import {
  CreditCard,
  CheckCircle2,
  TrendingUp,
  PiggyBank,
  BrainCircuit,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeInvoice, setActiveInvoice] = useState<any>(null);
  const [payModalOpen, setPayModalOpen] = useState<boolean>(false);
  const [aiAdvice, setAiAdvice] = useState<string>('Analyzing your account logs to generate budget advisory tips...');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        setData(await response.json());
      }
    } catch (err) {
      console.warn('Dashboard API error, rendering mockup defaults...', err);
    }

    try {
      const aiResponse = await fetch('/api/ai/budget-advice', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        setAiAdvice(aiData.advice);
      } else {
        setAiAdvice('Tip: You have spent 72% of your Academics budget. Postpone non-essential expenses to avoid crossing your limits!');
      }
    } catch (_) {
      setAiAdvice('Tip: You have spent 72% of your Academics budget. Postpone non-essential expenses to avoid crossing your limits!');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchDashboard();
  }, [user]);

  const triggerPayment = (invoice: any) => {
    setActiveInvoice(invoice);
    setPayModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setPayModalOpen(false);
    alert('Payment mock posted successfully!');
    if (data && data.summary) {
      setData({
        ...data,
        summary: {
          ...data.summary,
          pendingFees: Math.max(0, data.summary.pendingFees - activeInvoice.amount)
        }
      });
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse p-2 text-left">
        <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="h-28 bg-slate-900 rounded-2xl"></div>
          <div className="h-28 bg-slate-900 rounded-2xl"></div>
          <div className="h-28 bg-slate-900 rounded-2xl"></div>
          <div className="h-28 bg-slate-900 rounded-2xl"></div>
        </div>
        <div className="h-44 bg-slate-900 rounded-2xl"></div>
      </div>
    );
  }

  const sum = data.summary || {
    pendingFees: 45000,
    attendanceRate: 88,
    monthlyBudgetLimit: 12000,
    monthlyExpenses: 8740,
    savingsGoalTarget: 25000,
    savingsGoalCurrent: 18500,
    savingsGoalTitle: 'Semester Exchange Fund'
  };

  const budgetPercent = Math.min(100, Math.round((sum.monthlyExpenses / sum.monthlyBudgetLimit) * 100));
  const savingsPercent = Math.min(100, Math.round((sum.savingsGoalCurrent / sum.savingsGoalTarget) * 100));

  return (
    <div className="space-y-6 text-left">
      {/* Row 1: Quick Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="glass-panel p-5 rounded-2xl flex items-center justify-between border-slate-900 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <div className="z-10">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Outstanding Fees</span>
            <h3 className="text-2xl font-bold mt-1 text-slate-100">₹{sum.pendingFees.toLocaleString()}</h3>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => triggerPayment({ id: 'tuition_fee', category: 'Tuition Installment', amount: sum.pendingFees })}
                className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-1.5 px-3 rounded-lg shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 active:scale-95 transition-all"
              >
                <CreditCard className="h-3.5 w-3.5" /> Pay Now
              </button>
              <Link
                to="/fees"
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold py-1.5"
              >
                Details <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
            <CreditCard className="h-6 w-6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="glass-panel p-5 rounded-2xl flex items-center justify-between border-slate-900"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Avg Attendance</span>
            <h3 className="text-2xl font-bold mt-1 text-slate-100">{sum.attendanceRate}%</h3>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-4.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Satisfactory threshold
            </span>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="glass-panel p-5 rounded-2xl flex items-center justify-between border-slate-900"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Monthly Tracker</span>
            <h3 className="text-2xl font-bold mt-1 text-slate-100">
              ₹{sum.monthlyExpenses.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">/ ₹{sum.monthlyBudgetLimit.toLocaleString()}</span>
            </h3>
            <div className="w-32 bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${budgetPercent > 85 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                style={{ width: `${budgetPercent}%` }}
              ></div>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="glass-panel p-5 rounded-2xl flex items-center justify-between border-slate-900"
        >
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Savings Goal</span>
            <h3 className="text-2xl font-bold mt-1 text-slate-100">
              ₹{sum.savingsGoalCurrent.toLocaleString()}{' '}
              <span className="text-xs text-slate-400 font-normal">/ ₹{sum.savingsGoalTarget.toLocaleString()}</span>
            </h3>
            <div className="w-32 bg-slate-800 h-1.5 rounded-full mt-4 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${savingsPercent}%` }}
              ></div>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0">
            <PiggyBank className="h-6 w-6" />
          </div>
        </motion.div>
      </div>

      {/* AI budget advisor box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="glass-panel border-indigo-500/20 bg-indigo-500/5 rounded-2xl p-5 flex items-start gap-4"
      >
        <div className="rounded-xl bg-indigo-600/20 p-2.5 text-indigo-400 shrink-0">
          <BrainCircuit className="h-6 w-6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-indigo-400 flex items-center gap-1.5">
            AI Financial Assistant <span className="text-[9px] px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full font-bold uppercase tracking-wider">Predictive</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">{aiAdvice}</p>
        </div>
      </motion.div>

      {/* Row 3: Current Academic Courses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel border-slate-900 rounded-2xl p-6 lg:col-span-2 space-y-4">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-400" /> Academic Enrolments & Attendance
          </h4>
          <div className="divide-y divide-slate-900/60">
            {data.courses?.map((course: any) => (
              <div key={course.id || course.code} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{course.code}</span>
                  <h5 className="text-sm font-bold text-slate-200">{course.name}</h5>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Credits</span>
                    <span className="text-xs font-bold text-slate-300">{course.credits}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Attendance</span>
                    <span className={`text-xs font-bold ${course.attendance >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {course.attendance}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Shortcut panels */}
        <div className="glass-panel border-slate-900 rounded-2xl p-6 flex flex-col justify-between text-left">
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" /> Quick Financial Actions
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Access the campus financial ecosystem instantly. Track expenses, apply for waivers, or submit educational credit pipelines.
            </p>
            <div className="grid grid-cols-1 gap-2 pt-2">
              <Link
                to="/fees"
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-200 transition-colors"
              >
                <span>View Outstanding Fees</span>
                <ArrowUpRight className="h-4 w-4 text-slate-500" />
              </Link>
              <Link
                to="/tracker"
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-200 transition-colors"
              >
                <span>Expense & Tracker Portal</span>
                <ArrowUpRight className="h-4 w-4 text-slate-500" />
              </Link>
              <Link
                to="/scholarships"
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-200 transition-colors"
              >
                <span>Apply for Scholarships</span>
                <ArrowUpRight className="h-4 w-4 text-slate-500" />
              </Link>
              <Link
                to="/loans"
                className="p-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-200 transition-colors"
              >
                <span>Education Loans & EMIs</span>
                <ArrowUpRight className="h-4 w-4 text-slate-500" />
              </Link>
            </div>
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
