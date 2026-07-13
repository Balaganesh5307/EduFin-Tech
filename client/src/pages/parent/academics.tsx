import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth.context';
import { TrendingUp, Users } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export const ParentAcademics: React.FC = () => {
  const { user, accessToken } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const FALLBACK_DASHBOARD = {
    child: { name: 'Alex Johnson', rollNumber: '26-CSE-041', department: 'Computer Science & Engineering', course: 'B.Tech CSE', semester: 'Semester 5' },
    academics: {
      attendanceRate: 92,
      gpa: 8.7,
      subjects: [
        { name: 'Database Management Systems', code: 'CS301', grade: 'A', attendance: 94 },
        { name: 'Artificial Intelligence', code: 'CS303', grade: 'A-', attendance: 90 },
        { name: 'Computer Networks', code: 'CS302', grade: 'B+', attendance: 88 },
        { name: 'Software Engineering', code: 'CS304', grade: 'A', attendance: 96 }
      ]
    }
  };

  useEffect(() => {
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
    if (user) loadData();
  }, [user]);

  if (loading || !dashboardData) {
    return (
      <div className="space-y-6 animate-pulse p-2 text-left">
        <div className="h-10 w-48 bg-slate-900 rounded-xl"></div>
        <div className="h-64 bg-slate-900 rounded-2xl"></div>
      </div>
    );
  }

  const child = dashboardData.child;
  const academics = dashboardData.academics;
  const gpaTrend = [
    { sem: 'Sem 1', gpa: 8.2 },
    { sem: 'Sem 2', gpa: 8.5 },
    { sem: 'Sem 3', gpa: 8.3 },
    { sem: 'Sem 4', gpa: 8.7 }
  ];

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2 leading-none">
          Academic Progress Report
          <TrendingUp className="h-5 w-5 text-indigo-400" />
        </h1>
        <p className="text-sm text-slate-400 mt-1">Detailed performance audits, GPA curves, and course metrics for {child.name}.</p>
      </div>

      <div className="glass-panel border-slate-900 rounded-3xl p-6 flex flex-col sm:flex-row items-center gap-4 text-left">
        <div className="h-12 w-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
          <Users className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-200">{child.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Roll: {child.rollNumber} | {child.course} | {child.semester}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* GPA Line Chart */}
        <div className="lg:col-span-8 glass-panel border-slate-900 rounded-3xl p-6 space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="h-4.5 w-4.5 text-indigo-400" /> CGPA Growth Path
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gpaTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="sem" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="gpa" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Course performance */}
        <div className="lg:col-span-4 glass-panel border-slate-900 rounded-3xl p-6 space-y-4 text-xs">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Enrolled Courses & Grades</h4>
          <div className="divide-y divide-slate-800/60">
            {academics.subjects.map((sub: any, idx: number) => (
              <div key={idx} className="py-3.5 flex justify-between first:pt-0 last:pb-0">
                <div>
                  <strong className="text-slate-200 block">{sub.name}</strong>
                  <span className="text-[10px] text-slate-500">Attendance: {sub.attendance}%</span>
                </div>
                <div className="text-right">
                  <span className="text-indigo-400 font-bold block">Grade: {sub.grade}</span>
                  <span className="text-[9px] text-slate-500">Credits: 4</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
