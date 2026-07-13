import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { BookOpen, TrendingUp, Users } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

export const FacultyReports: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);

  const mockPerformanceData = [
    { name: 'DBMS', averageScore: 78, highestScore: 98 },
    { name: 'AI', averageScore: 82, highestScore: 95 },
    { name: 'Networks', averageScore: 74, highestScore: 92 },
    { name: 'SoftEng', averageScore: 85, highestScore: 100 }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-2 text-left">
        <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
        <div className="h-64 bg-slate-900 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
          Academics Evaluation Reports
          <BookOpen className="h-5 w-5 text-indigo-400" />
        </h1>
        <p className="text-sm text-slate-400 mt-1.5">Consolidated classroom evaluation metrics and grade sheets averages.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Classroom collections performance */}
        <div className="lg:col-span-8 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-indigo-400" /> Course Evaluations Curve
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockPerformanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="averageScore" stroke="#6366f1" fillOpacity={1} fill="url(#colorAvg)" strokeWidth={2} />
                <Area type="monotone" dataKey="highestScore" stroke="#10b981" fill="none" strokeWidth={2} strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown sidebar */}
        <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 space-y-4 text-xs">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Department Summaries</h4>
          <div className="space-y-3 pt-1">
            <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex justify-between items-center">
              <div>
                <strong className="text-slate-300 block">Classrooms Count</strong>
                <span className="text-[10px] text-slate-500">Total assigned branches</span>
              </div>
              <span className="font-bold text-slate-200 text-sm">4 Batches</span>
            </div>
            <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex justify-between items-center">
              <div>
                <strong className="text-slate-300 block">Average Attendance</strong>
                <span className="text-[10px] text-slate-500">Cumulative student rate</span>
              </div>
              <span className="font-bold text-emerald-400 text-sm">88%</span>
            </div>
            <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl flex justify-between items-center">
              <div>
                <strong className="text-slate-300 block">Average CGPA</strong>
                <span className="text-[10px] text-slate-500">Term evaluation grade</span>
              </div>
              <span className="font-bold text-indigo-400 text-sm">8.2 / 10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
