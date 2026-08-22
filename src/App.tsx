import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui';
import type { UserRole } from '@/lib/types';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { ProfileSetupPage } from '@/pages/auth/ProfileSetupPage';
import { CitizenLayout } from '@/components/layouts/CitizenLayout';
import { WorkerLayout } from '@/components/layouts/WorkerLayout';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { CitizenHome } from '@/pages/citizen/CitizenHome';
import { NearbyPage } from '@/pages/citizen/NearbyPage';
import { ReportIssuePage } from '@/pages/citizen/ReportIssuePage';
import { MyReportsPage } from '@/pages/citizen/MyReportsPage';
import { WorkerTasks } from '@/pages/worker/WorkerTasks';
import { WorkerTasksMap } from '@/pages/worker/WorkerTasksMap';
import { AdminOverview } from '@/pages/admin/AdminOverview';
import { AdminReports } from '@/pages/admin/AdminReports';
import { AdminWorkers } from '@/pages/admin/AdminWorkers';
import { AdminDepartments } from '@/pages/admin/AdminDepartments';
import { AdminAnalytics } from '@/pages/admin/AdminAnalytics';
import { AdminSettings } from '@/pages/admin/AdminSettings';
import { ReportDetail } from '@/pages/ReportDetail';

function ProtectedRoute({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
}) {
  const { session, profile, loading, needsProfile } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner className="min-h-screen" />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (needsProfile && location.pathname !== '/profile-setup')
    return <Navigate to="/profile-setup" replace />;
  if (roles && profile && !roles.includes(profile.role))
    return <Navigate to="/app/home" replace />;
  return <>{children}</>;
}

function RoleLayout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile?.role === 'ADMIN') return <AdminLayout>{children}</AdminLayout>;
  if (profile?.role === 'WORKER') return <WorkerLayout>{children}</WorkerLayout>;
  return <CitizenLayout>{children}</CitizenLayout>;
}

function AppRoutes() {
  const { session } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/app/home" replace /> : <LoginPage />} />
      <Route path="/signup" element={session ? <Navigate to="/app/home" replace /> : <SignupPage />} />
      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute>
            <ProfileSetupPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <RoleLayout>
              <Outlet />
            </RoleLayout>
          </ProtectedRoute>
        }
      >
        <Route path="home" element={<CitizenHome />} />
        <Route path="nearby" element={<NearbyPage />} />
        <Route path="report" element={<ReportIssuePage />} />
        <Route path="my-reports" element={<MyReportsPage />} />
        <Route path="report/:id" element={<ReportDetail />} />
        <Route path="tasks" element={<WorkerTasks />} />
        <Route path="tasks-map" element={<WorkerTasksMap />} />
        <Route path="overview" element={<AdminOverview />} />
        <Route path="admin-reports" element={<AdminReports />} />
        <Route path="admin-workers" element={<AdminWorkers />} />
        <Route path="admin-departments" element={<AdminDepartments />} />
        <Route path="admin-analytics" element={<AdminAnalytics />} />
        <Route path="admin-settings" element={<AdminSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/app/home" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
