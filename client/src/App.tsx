import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/auth.context';
import { ProtectedRoute } from './components/protected-route';
import { DashboardLayout } from './layouts/dashboard-layout';
import { Login } from './pages/login';
import { DashboardsIndex } from './pages/dashboards/index';
import { AIChatbot } from './components/chatbot';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public login route */}
          <Route path="/login" element={<Login />} />

          {/* Protected dashboard routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* Common landing page pointing to role-based dashboard */}
              <Route path="/" element={<DashboardsIndex />} />
              
              {/* Placeholders for other sub-links to keep Router robust */}
              <Route path="/fees" element={<DashboardsIndex />} />
              <Route path="/child-fees" element={<DashboardsIndex />} />
              <Route path="/tracker" element={<DashboardsIndex />} />
              <Route path="/scholarships" element={<DashboardsIndex />} />
              <Route path="/scholarships-approvals" element={<DashboardsIndex />} />
              <Route path="/loans" element={<DashboardsIndex />} />
              <Route path="/loan-pipelines" element={<DashboardsIndex />} />
              <Route path="/attendance" element={<DashboardsIndex />} />
              <Route path="/progress" element={<DashboardsIndex />} />
              <Route path="/reports" element={<DashboardsIndex />} />
              <Route path="/audit-logs" element={<DashboardsIndex />} />
            </Route>
          </Route>

          {/* Fallback redirects */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Global floating AI chatbot advisor */}
        <AIChatbot />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
