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
import { ProcurementWorkspace } from './pages/workspace/ProcurementWorkspace';
import { OrganizationConsole } from './pages/organization/OrganizationConsole';
import { EnterpriseKnowledgeGraph } from './pages/organization/EnterpriseKnowledgeGraph';
import { AgentInbox } from './pages/agent/AgentInbox';
import { AgentWorkspace } from './pages/agent/AgentWorkspace';
import { AgentMarketplace } from './pages/agent/AgentMarketplace';
import { HumanAiWorkspace } from './pages/agent/HumanAiWorkspace';
import { DigitalEmployeesConsole } from './pages/agent/DigitalEmployeesConsole';
import { SellerPlatformConsole } from './pages/seller/SellerPlatformConsole';
import { B2bLandingPage } from './pages/public/B2bLandingPage';
import { NegotiationWorkspacePage } from './pages/workspace/NegotiationWorkspacePage';
import { CommercialExecutionWorkspacePage } from './pages/workspace/CommercialExecutionWorkspacePage';
import { MerchantPassportPage } from './pages/workspace/MerchantPassportPage';
import { EditDraft } from './pages/requests/EditDraft';
import { WorkPackageDetails } from './pages/requests/WorkPackageDetails';
import { ComparisonWorkspace } from './pages/requests/ComparisonWorkspace';
import { CommercialProcessPage } from './pages/requests/CommercialProcessPage';
import { CommercialInbox } from './pages/inbox/CommercialInbox';
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
import { AiPlatformConsole } from './pages/admin/AiPlatformConsole';
import { SovereignOperationalConsole } from './pages/admin/SovereignOperationalConsole';

import { usePolicy } from './providers/PolicyEngineProvider';

// A simple protected route wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const policy = usePolicy();

  const token = localStorage.getItem('token');

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="font-bold text-xl text-indigo-600 flex items-center gap-6">
            <Link to="/" className="hover:opacity-80">MarketHub</Link>
            <div className="flex gap-4 text-sm font-medium text-gray-600">
              {policy.can('BUYER_PROCUREMENT') && <Link to="/requests" className="hover:text-indigo-600">📋 طلبات الشراء</Link>}
              {policy.can('SELLER_PLATFORM') && <Link to="/seller/platform" className="hover:text-indigo-600">🏬 منصة البائع</Link>}
              <Link to="/merchant/passport" className="hover:text-indigo-600">🛡️ الجواز التجاري</Link>
            </div>
            {policy.can('MANAGE_SYSTEM') && (
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

const RequireCapability = ({ children, capability }) => {
  const policy = usePolicy();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed = policy.can(capability);
  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-4">
          <div className="text-red-500 text-5xl">🛑</div>
          <h2 className="text-xl font-bold text-gray-900">غير مصرح بالدخول</h2>
          <p className="text-gray-500 text-sm">حسابك لا يملك الصلاحيات الكافية للوصول إلى هذه المنصة.</p>
          <Navigate to="/dashboard" replace />
        </div>
      </div>
    );
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const token = localStorage.getItem('token');
  if (!isAuthenticated || !token) {
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
        path="/admin/sovereign-op" 
        element={
          <ProtectedRoute>
            <SovereignOperationalConsole />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/admin/ai-platform" 
        element={
          <ProtectedRoute>
            <AiPlatformConsole />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/workspace/negotiation" 
        element={
          <ProtectedRoute>
            <NegotiationWorkspacePage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/workspace/execution" 
        element={
          <ProtectedRoute>
            <CommercialExecutionWorkspacePage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/merchant/passport" 
        element={
          <ProtectedRoute>
            <MerchantPassportPage />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/seller/platform" 
        element={
          <RequireCapability capability="SELLER_PLATFORM">
            <SellerPlatformConsole />
          </RequireCapability>
        } 
      />

      <Route 
        path="/agent/employees" 
        element={
          <ProtectedRoute>
            <DigitalEmployeesConsole />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/agent/marketplace" 
        element={
          <ProtectedRoute>
            <AgentMarketplace />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/agent/collab" 
        element={
          <ProtectedRoute>
            <HumanAiWorkspace />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/agent/workspace" 
        element={
          <ProtectedRoute>
            <AgentWorkspace />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/agent/inbox" 
        element={
          <ProtectedRoute>
            <AgentInbox />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/organization/graph" 
        element={
          <ProtectedRoute>
            <EnterpriseKnowledgeGraph />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/organization" 
        element={
          <ProtectedRoute>
            <OrganizationConsole />
          </ProtectedRoute>
        } 
      />

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
          <RequireCapability capability="BUYER_PROCUREMENT">
            <div className="p-8">
              <RequestsList />
            </div>
          </RequireCapability>
        } 
      />

      <Route 
        path="/requests/:id" 
        element={
          <RequireCapability capability="BUYER_PROCUREMENT">
            <div className="p-8">
              <RequestDetails />
            </div>
          </RequireCapability>
        } 
      />

      <Route 
        path="/workspace/:id" 
        element={
          <ProtectedRoute>
            <ProcurementWorkspace />
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/requests/:id/packages/:packageId" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <WorkPackageDetails />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/requests/:id/packages/:packageId/compare" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <ComparisonWorkspace />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/requests/:id/packages/:packageId/processes/:processId" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <CommercialProcessPage />
            </div>
          </ProtectedRoute>
        } 
      />

      <Route 
        path="/inbox" 
        element={
          <ProtectedRoute>
            <div className="p-8">
              <CommercialInbox />
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

      <Route path="/" element={<B2bLandingPage />} />
    </Routes>
  );
};

export default App;
