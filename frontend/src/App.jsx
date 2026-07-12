import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from './layouts/AuthLayout';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Dashboard } from './pages/dashboard/Dashboard';
import { MatchRadar } from './pages/dashboard/MatchRadar';
import { IntakeWizard } from './pages/intake/IntakeWizard';
import { RequestsList } from './pages/requests/RequestsList';
import { RequestDetails } from './pages/requests/RequestDetails';
import { ProductsList } from './pages/products/ProductsList';
import { QuotesList } from './pages/quotes/QuotesList';
import { QuoteDetails } from './pages/quotes/QuoteDetails';
import { DealsList } from './pages/deals/DealsList';
import { DealContract } from './pages/deals/DealContract';
import { ProfileSettings } from './pages/settings/ProfileSettings';
import { CompanyProfile } from './pages/settings/CompanyProfile';
import { NotificationBell } from './components/notifications/NotificationBell';
import { useAuth } from './providers/AuthProvider';

// A simple protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="font-bold text-xl text-indigo-600">MarketHub</div>
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

export const App = () => {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
