import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../components/sidebar';
import { useAuth } from '../contexts/auth.context';
import { ProfileModal } from '../components/profile-modal';
import { Bell, Search, Menu, X, Sparkles, BookOpen } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);

  const notifications = [
    { id: '1', title: 'Upcoming Tuition Fee Due', text: '₹35,000 Tuition installment is due on 15th August.', time: '2h ago', unread: true },
    { id: '2', title: 'Scholarship Recommended', text: 'AI matching found "Merit-Cum-Means Scholarship" matching your credentials.', time: '1d ago', unread: false }
  ];

  // Resolve page header titles based on path
  const getHeaderTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Overview';
      case '/fees':
      case '/child-fees':
        return 'Fee Hub';
      case '/tracker':
        return 'Expense Tracker';
      case '/scholarships':
      case '/scholarships-approvals':
        return 'Scholarship Portal';
      case '/loans':
      case '/loan-pipelines':
        return 'Education Loan Pipeline';
      case '/attendance':
        return 'Class Attendance';
      case '/progress':
        return 'Academic Progress';
      case '/reports':
        return 'Academic Reports';
      case '/audit-logs':
        return 'Audit Security Logs';
      default:
        return 'EduFin';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Desktop Sidebar (Left Panel) */}
      <div className="hidden lg:block w-72 shrink-0">
        <Sidebar onProfileClick={() => setProfileOpen(true)} />
      </div>

      {/* Mobile Drawer (Left Panel Overlay) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)}></div>
          {/* Sidebar Drawer */}
          <div className="relative flex w-72 flex-col bg-slate-900 border-r border-slate-800 animate-slide-in">
            <Sidebar onNavigate={() => setMobileOpen(false)} onProfileClick={() => setProfileOpen(true)} />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-5 right-5 text-slate-400 p-1.5 hover:bg-slate-800 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        
        {/* Top Header Bar */}
        <header className="h-20 bg-slate-950/60 backdrop-blur-md border-b border-slate-900 sticky top-0 z-10 px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-slate-400 hover:text-slate-200 p-2 hover:bg-slate-900 rounded-xl"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {/* Title / Breadcrumbs */}
            <div>
              <h2 className="text-xl font-bold text-slate-100 leading-none">{getHeaderTitle()}</h2>
              <span className="text-[10px] text-slate-500 font-medium">EduFin Campus Portal</span>
            </div>
          </div>

          {/* Quick Actions Search, Alerts, profile */}
          <div className="flex items-center gap-4 relative">
            
            {/* Search Input */}
            <div className="relative max-w-xs hidden sm:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search financials, receipts..."
                className="bg-slate-900/80 border border-slate-900 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-52 placeholder-slate-600 transition-all focus:w-64"
              />
            </div>

            {/* Notification Center */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 bg-slate-900 border border-slate-900 text-slate-400 hover:text-slate-200 rounded-xl transition-all"
              >
                <Bell className="h-4.5 w-4.5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-indigo-500 ring-2 ring-slate-900"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 glass-panel rounded-2xl border border-slate-800 shadow-2xl overflow-hidden animate-fade-in">
                  <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-100">Notifications</span>
                    <button className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide hover:underline">Mark all read</button>
                  </div>
                  <div className="divide-y divide-slate-900/60 max-h-64 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-4 hover:bg-slate-900/40 transition-colors text-left space-y-1">
                        <div className="flex justify-between items-start">
                          <span className={`text-xs font-semibold ${n.unread ? 'text-slate-100' : 'text-slate-400'}`}>
                            {n.title}
                          </span>
                          <span className="text-[9px] text-slate-500">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">{n.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Micro AI badge */}
            <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase select-none">
              <Sparkles className="h-3 w-3 animate-pulse" />
              <span>AI Connected</span>
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 lg:p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>

      {/* Global Profile Settings Modal */}
      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
};
