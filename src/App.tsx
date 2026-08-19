import { Navigate, Route, Routes } from 'react-router-dom';
import type { ReactElement } from 'react';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import DailyEntry from './pages/employee/DailyEntry';
import History from './pages/employee/History';
import Leave from './pages/employee/Leave';
import Stats from './pages/employee/Stats';
import AdminDashboard from './pages/admin/Dashboard';
import AdminEntries from './pages/admin/Entries';
import Employees from './pages/admin/Employees';
import LeaveApprovals from './pages/admin/LeaveApprovals';

function RequireAuth({ role, children }: { role: 'admin' | 'employee'; children: ReactElement }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/app/entry'} replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-ink-faint)' }}>
        Loading…
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/app/entry'} replace /> : <Login />} />

      <Route element={<RequireAuth role="employee"><Layout /></RequireAuth>}>
        <Route path="/app/entry" element={<DailyEntry />} />
        <Route path="/app/history" element={<History />} />
        <Route path="/app/leave" element={<Leave />} />
        <Route path="/app/stats" element={<Stats />} />
      </Route>

      <Route element={<RequireAuth role="admin"><Layout /></RequireAuth>}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/entries" element={<AdminEntries />} />
        <Route path="/admin/employees" element={<Employees />} />
        <Route path="/admin/leave" element={<LeaveApprovals />} />
      </Route>

      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/app/entry') : '/login'} replace />} />
    </Routes>
  );
}
