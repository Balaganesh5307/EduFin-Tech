import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/auth.context';
import { ProtectedRoute } from './components/protected-route';
import { DashboardLayout } from './layouts/dashboard-layout';
import { Login } from './pages/login';
import { ForgotPassword } from './pages/forgot-password';
import { ResetPassword } from './pages/reset-password';
import { VerifyEmail } from './pages/verify-email';
import { DashboardsIndex } from './pages/dashboards/index';
import { StudentDirectory } from './pages/admin/student-directory';
import { StudentProfile } from './pages/student/student-profile';
import { AttendanceLedger } from './pages/faculty/attendance-ledger';
import { FeesPayments } from './pages/student/fees-payments';
import { PersonalTracker } from './pages/student/personal-tracker';
import { Scholarships } from './pages/student/scholarships';
import { EducationLoans } from './pages/student/education-loans';
import { AdminFeeManagement } from './pages/admin/fee-management';
import { RevenueAnalytics } from './pages/admin/revenue-analytics';
import { ParentChildFees } from './pages/parent/child-fees';
import { AIChatbot } from './components/chatbot';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />

          {/* Protected dashboard routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              {/* Common landing page pointing to role-based dashboard */}
              <Route path="/" element={<DashboardsIndex />} />
              
              {/* Core Student / Faculty / Admin routes */}
              <Route path="/admin/students" element={<StudentDirectory />} />
              <Route path="/student/profile" element={<StudentProfile />} />
              <Route path="/faculty/attendance" element={<AttendanceLedger />} />
              
              {/* Core Fee Management & Payment Ecosystem routes */}
              <Route path="/fees" element={<FeesPayments />} />
              <Route path="/child-fees" element={<ParentChildFees />} />
              <Route path="/tracker" element={<PersonalTracker />} />
              <Route path="/scholarships" element={<Scholarships />} />
              <Route path="/scholarships-approvals" element={<DashboardsIndex />} />
              <Route path="/loans" element={<EducationLoans />} />
              <Route path="/loan-pipelines" element={<DashboardsIndex />} />
              <Route path="/revenue" element={<RevenueAnalytics />} />
              <Route path="/admin/fees" element={<AdminFeeManagement />} />
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
