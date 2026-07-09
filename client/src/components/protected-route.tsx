import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/auth.context';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="relative flex flex-col items-center gap-3">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-indigo-500 border-indigo-500/20"></div>
          <p className="text-sm font-medium text-slate-400 animate-pulse">Loading EduFin session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 p-6 text-center">
        <div className="glass-panel p-8 max-w-md rounded-2xl flex flex-col items-center gap-4">
          <div className="rounded-full bg-rose-500/10 p-3 text-rose-500">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-100">Access Denied</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your account role <strong>{user.role}</strong> does not have permission to view this resource. Please contact your campus system administrator.
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-2 w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 hover:shadow-indigo-500/20 active:scale-95"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
