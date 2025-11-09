import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { PermissionsProvider } from './contexts/PermissionsContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { CaissePage } from './pages/Caisse';
import { StockPage } from './pages/Stock';
import { TresoreriePage } from './pages/Tresorerie';
import { ComptabilitePage } from './pages/Comptabilite';
import { AdminPage } from './pages/Admin';
import { AdminUsersPage } from './pages/AdminUsers';
import { AdminRolesPage } from './pages/AdminRoles';
import { AdminLogsPage } from './pages/AdminLogs';
import { AdminConfigPage } from './pages/AdminConfig';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PermissionsProvider>
          <Toaster />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/caisse"
              element={
                <ProtectedRoute>
                  <CaissePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/stock"
              element={
                <ProtectedRoute>
                  <StockPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/comptabilite"
              element={
                <ProtectedRoute>
                  <ComptabilitePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tresorerie"
              element={
                <ProtectedRoute>
                  <TresoreriePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute>
                  <AdminUsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/roles"
              element={
                <ProtectedRoute>
                  <AdminRolesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedRoute>
                  <AdminLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/config"
              element={
                <ProtectedRoute>
                  <AdminConfigPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PermissionsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
