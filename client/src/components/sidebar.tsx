import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/auth.context';
import { ThemeToggle } from './theme-toggle';
import {
  LayoutDashboard,
  CreditCard,
  PiggyBank,
  Award,
  BookOpen,
  CalendarCheck,
  TrendingUp,
  ShieldCheck,
  LogOut,
  FolderLock,
  User,
  GraduationCap
} from 'lucide-react';

interface SidebarProps {
  onNavigate?: () => void;
  onProfileClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate, onProfileClick }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  // Determine navigation menu items based on Role
  const getNavLinks = () => {
    const role = user.role;
    const common = [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard }
    ];

    switch (role) {
      case 'Student':
        return [
          ...common,
          { to: '/fees', label: 'Fees & Payments', icon: CreditCard },
          { to: '/tracker', label: 'Personal Tracker', icon: PiggyBank },
          { to: '/scholarships', label: 'Scholarships', icon: Award },
          { to: '/loans', label: 'Education Loans', icon: GraduationCap }
        ];

      case 'Parent':
        return [
          ...common,
          { to: '/child-fees', label: 'Child Fee Status', icon: CreditCard },
          { to: '/progress', label: 'Child Progress', icon: TrendingUp }
        ];

      case 'Faculty':
        return [
          ...common,
          { to: '/attendance', label: 'Attendance Management', icon: CalendarCheck },
          { to: '/reports', label: 'Academics Reports', icon: BookOpen }
        ];

      case 'Admin':
        return [
          ...common,
          { to: '/revenue', label: 'Revenue Analytics', icon: TrendingUp },
          { to: '/scholarships-approvals', label: 'Scholarship Center', icon: Award },
          { to: '/loan-pipelines', label: 'Loan Pipelines', icon: GraduationCap }
        ];

      case 'SuperAdmin':
        return [
          ...common,
          { to: '/revenue', label: 'Revenue Analytics', icon: TrendingUp },
          { to: '/scholarships-approvals', label: 'Scholarship Center', icon: Award },
          { to: '/loan-pipelines', label: 'Loan Pipelines', icon: GraduationCap },
          { to: '/audit-logs', label: 'System Audit Logs', icon: FolderLock }
        ];

      default:
        return common;
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-72 flex-col bg-slate-900 border-r border-slate-800/80 p-6 text-slate-100">
      {/* Brand Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.33l-7.5-5-7.5 5V21m15 0H3" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight tracking-tight bg-gradient-to-r from-indigo-200 via-indigo-400 to-indigo-200 bg-clip-text text-transparent">EduFin</h1>
            <span className="text-[10px] font-medium tracking-wider text-slate-500 uppercase">Campus Ecosystem</span>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Nav Section */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Profile */}
      <div className="mt-auto border-t border-slate-800/80 pt-5">
        <div
          onClick={onProfileClick}
          className="mb-4 flex items-center gap-3 cursor-pointer p-1.5 rounded-xl hover:bg-slate-800/40 transition-all hover:scale-102 active:scale-98"
        >
          <img
            src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.role}`}
            alt={user.name}
            className="h-10 w-10 rounded-xl bg-slate-800 object-cover ring-2 ring-indigo-500/20"
          />
          <div className="overflow-hidden">
            <h4 className="truncate text-sm font-semibold text-slate-200">{user.name}</h4>
            <span className="text-[11px] font-medium tracking-wide text-indigo-400/90 uppercase">{user.role}</span>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm font-medium text-rose-400 transition-all hover:bg-rose-500/15 hover:text-rose-300 active:scale-[0.98]"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
