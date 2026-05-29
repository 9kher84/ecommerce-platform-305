import React from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Plus,
  Home,
  LogOut,
  User,
  Search,
} from "lucide-react";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import NotificationBell from "./components/NotificationBell";
import "./i18n"; // Initialize i18n

// Pages - V2.0
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import BuyerDashboard from "./pages/BuyerDashboard";
import SellerDashboard from "./pages/SellerDashboard";
import CreateRequestPage from "./pages/CreateRequestPage";
import RequestDetailsPage from "./pages/RequestDetailsPage";
import ChatPage from "./pages/ChatPage";
import RFQsPage from "./pages/RFQsPage";
import SubmitQuote from "./pages/SubmitQuote";
import DecisionBoard from "./pages/DecisionBoard";
import Invoice from "./pages/Invoice";
import AdminDashboardLayout from "./pages/admin/AdminDashboardLayout";
// Owner Pages
import OwnerLogin from "./pages/owner/OwnerLogin";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerPanel from "./pages/owner/OwnerPanel";
import SupervisorPanel from "./pages/supervisor/SupervisorPanel";

// Legacy pages (deprecated)
import PostDetailsPage from "./pages/PostDetailsPage";
import PostFormPage from "./pages/PostFormPage";

// ----------------------------------------------------------------------
// Components
// ----------------------------------------------------------------------

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = user?.role === "super_admin" || user?.role === "admin";
  const isOwner =
    user?.role === "owner" || user?.email === "owner@sovereign.net";
  const isBuyer = user?.role === "buyer";
  const isSeller = user?.role === "seller";

  const navItems = [
    { path: "/", label: "الرئيسية", icon: Home },
    ...(isOwner
      ? [
          {
            path: "/owner/dashboard",
            label: "التحكم السيادي",
            icon: LayoutDashboard,
          },
        ]
      : []),
    ...(isBuyer
      ? [
          {
            path: "/buyer-dashboard",
            label: "لوحة التحكم",
            icon: LayoutDashboard,
          },
          { path: "/create-request", label: "طلب شراء جديد", icon: Plus },
        ]
      : []),
    ...(isSeller
      ? [
          {
            path: "/seller-dashboard",
            label: "لوحة التحكم",
            icon: LayoutDashboard,
          },
          { path: "/rfqs", label: "طلبات العروض (RFQs)", icon: Search },
        ]
      : []),
    ...(isSuperAdmin && !isOwner
      ? [{ path: "/admin", label: "إدارة النظام", icon: Users }]
      : []),
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="w-64 bg-gray-800 text-white h-full fixed top-0 right-0 p-4 pt-20 z-30 hidden md:block">
      <nav className="space-y-2">
        {navItems.map((item, index) => (
          <button
            key={`${item.path}-${index}`} // أضف index لجعل key فريداً
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg transition duration-150 ${
              location.pathname === item.path
                ? "bg-indigo-600 text-white"
                : "hover:bg-gray-700 text-gray-300"
            }`}
          >
            <item.icon className="w-5 h-5 ml-3" />
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}

        {user && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg transition duration-150 hover:bg-red-600 text-gray-300 hover:text-white mt-8"
          >
            <LogOut className="w-5 h-5 ml-3" />
            <span className="text-sm font-medium">تسجيل الخروج</span>
          </button>
        )}
      </nav>
    </div>
  );
};

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 right-0 w-full bg-white shadow-md z-40 p-4 flex justify-between items-center rtl:border-r border-gray-200 h-16">
      <div className="flex items-center pr-4 md:pr-64 transition-all duration-300">
        <div
          className="text-xl font-bold text-indigo-700 cursor-pointer"
          onClick={() => navigate("/")}
        >
          منصة التجارة V2.0
        </div>
      </div>
      <div className="flex items-center gap-3 pl-4">
        {user ? (
          <div className="flex items-center gap-3">
            {/* 🔔 جرس الإشعارات */}
            <NotificationBell />
            <span className="text-sm text-gray-600 hidden sm:inline">
              مرحباً، {user.name}
            </span>
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <User className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <div className="space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => navigate("/login")}
              className="text-gray-600 hover:text-indigo-600 font-medium px-3 py-1"
            >
              دخول
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              تسجيل
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

const Layout = ({ children }) => {
  const { user } = useAuth();
  return (
    <div dir="rtl" className="bg-gray-100 min-h-screen">
      <Header />
      {user && <Sidebar />}
      <main
        className={`pt-16 ${user ? "md:mr-64" : ""} min-h-[calc(100vh-4rem)] transition-all duration-300`}
      >
        {children}
      </main>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Role-based Dashboard Router
const DashboardRouter = () => {
  const { user } = useAuth();

  if (user?.role === "owner" || user?.email === "owner@sovereign.net") {
    return <Navigate to="/owner/dashboard" replace />;
  } else if (user?.role === "admin" || user?.role === "super_admin") {
    // Allow admin to access owner dashboard if they are essentially the owner or high priv
    if (user?.email === "owner@sovereign.net")
      return <Navigate to="/owner/dashboard" replace />;
    return <Navigate to="/admin" replace />;
  } else if (user?.role === "buyer") {
    return <Navigate to="/buyer-dashboard" replace />;
  } else if (user?.role === "seller") {
    return <Navigate to="/seller-dashboard" replace />;
  } else if (user?.role === "supervisor") {
    return <Navigate to="/supervisor/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
};

// ----------------------------------------------------------------------
// Main App
// ----------------------------------------------------------------------

const App = () => {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* V2.0 Routes - Purchase Requests */}
          <Route path="/requests/:id" element={<RequestDetailsPage />} />
          <Route
            path="/create-request"
            element={
              <ProtectedRoute>
                <CreateRequestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rfqs"
            element={
              <ProtectedRoute>
                <RFQsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit-quote/:id"
            element={
              <ProtectedRoute>
                <SubmitQuote />
              </ProtectedRoute>
            }
          />
          <Route
            path="/decision-board/:id"
            element={
              <ProtectedRoute>
                <DecisionBoard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoice/:id"
            element={
              <ProtectedRoute>
                <Invoice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:requestId"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />

          {/* Dashboard Routes - Role-based */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer-dashboard"
            element={
              <ProtectedRoute>
                <BuyerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller-dashboard"
            element={
              <ProtectedRoute>
                <SellerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Main Owner Route */}
          <Route
            path="/owner/dashboard/*"
            element={
              <ProtectedRoute>
                <OwnerPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/supervisor/dashboard/*"
            element={
              <ProtectedRoute>
                <SupervisorPanel />
              </ProtectedRoute>
            }
          />

          {/* Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminDashboardLayout />
              </ProtectedRoute>
            }
          />

          {/* Legacy Routes (deprecated but kept for backward compatibility) */}
          <Route path="/posts/:id" element={<PostDetailsPage />} />
          <Route
            path="/create-post"
            element={
              <ProtectedRoute>
                <PostFormPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
};

export default App;
