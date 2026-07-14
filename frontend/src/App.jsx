import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { Dashboard } from './pages/dashboard/Dashboard';
import { MatchRadar } from './pages/dashboard/MatchRadar';
import { IntakeWizard } from './pages/intake/IntakeWizard';
import { RequestsList } from './pages/requests/RequestsList';
import { RequestDetails } from './pages/requests/RequestDetails';
import { EditDraft } from './pages/requests/EditDraft';
import { ProductsList } from './pages/products/ProductsList';
import { QuotesList } from './pages/quotes/QuotesList';
import { QuoteDetails } from './pages/quotes/QuoteDetails';
import { DealsList } from './pages/deals/DealsList';
import { DealContract } from './pages/deals/DealContract';
import { ProfileSettings } from './pages/settings/ProfileSettings';
import { CompanyProfile } from './pages/settings/CompanyProfile';
import { NotificationBell } from './components/notifications/NotificationBell';
import { useAuth } from './providers/AuthProvider';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersList } from './pages/admin/AdminUsersList';

// A simple protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="font-bold text-xl text-indigo-600 flex items-center gap-6">
            <Link to="/dashboard">MarketHub</Link>
            {user?.isAdmin && (
              <div className="flex gap-4 text-sm font-medium text-gray-600">
                <Link to="/admin" className="hover:text-indigo-600">لوحة الإدارة</Link>
                <Link to="/admin/users" className="hover:text-indigo-600">المستخدمين</Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
          </div>
        </div>
      </header>
      <main>
        {children}
      </main>
    </div>
  );
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!user?.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <ProtectedRoute>{children}</ProtectedRoute>;
};

export const App = () => {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Route>
      
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <Dashboard />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/match-radar" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <MatchRadar />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/intake" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <IntakeWizard />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/requests" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <RequestsList />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/requests/:id" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <RequestDetails />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/requests/:id/edit" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <EditDraft />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/products" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <ProductsList />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/quotes" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <QuotesList />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/quotes/:id" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <QuoteDetails />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/deals" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <DealsList />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/deals/:id" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <DealContract />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/settings/profile" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <ProfileSettings />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/settings/company" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <CompanyProfile />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin" 
        element={
          <AdminRoute>
            <div className="p-8">
              <AdminDashboard />
            </div>
          </AdminRoute>
        } 
      />

      <Route 
        path="/admin/users" 
        element={
          <AdminRoute>
            <div className="p-8">
              <AdminUsersList />
            </div>
          </AdminRoute>
        } 
      />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
