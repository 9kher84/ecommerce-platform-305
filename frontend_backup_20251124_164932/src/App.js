import React from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Tag, Plus, ChevronRight, Home, LogOut, User } from 'lucide-react';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PostDetailsPage from './pages/PostDetailsPage';
import PostFormPage from './pages/PostFormPage';
import AdminDashboardLayout from './pages/admin/AdminDashboardLayout';

// ... (rest of imports)

// ... (inside Routes)


// ----------------------------------------------------------------------
// Components
// ----------------------------------------------------------------------

const Sidebar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const isSuperAdmin = user?.role === 'super_admin';

    const navItems = [
        { path: '/', label: 'الرئيسية', icon: Home },
        ...(user ? [
            { path: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
            { path: '/my-posts', label: 'منشوراتي', icon: Plus },
            { path: '/my-offers', label: 'عروضي', icon: ChevronRight },
        ] : []),
        ...(isSuperAdmin ? [
            { path: '/admin', label: 'إدارة النظام', icon: Users },
        ] : []),
    ];

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="w-64 bg-gray-800 text-white h-full fixed top-0 right-0 p-4 pt-20 z-30 hidden md:block">
            <nav className="space-y-2">
                {navItems.map(item => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg transition duration-150 ${location.pathname === item.path ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700 text-gray-300'
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
                <div className="text-xl font-bold text-indigo-700 cursor-pointer" onClick={() => navigate('/')}>
                    منصة التجارة
                </div>
            </div>
            <div className="flex items-center space-x-4 rtl:space-x-reverse pl-4">
                {user ? (
                    <div className="flex items-center">
                        <span className="text-sm text-gray-600 ml-3 hidden sm:inline">
                            مرحباً، {user.name}
                        </span>
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                            <User className="w-5 h-5" />
                        </div>
                    </div>
                ) : (
                    <div className="space-x-2 rtl:space-x-reverse">
                        <button onClick={() => navigate('/login')} className="text-gray-600 hover:text-indigo-600 font-medium px-3 py-1">دخول</button>
                        <button onClick={() => navigate('/signup')} className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 text-sm font-medium">تسجيل</button>
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
            <main className={`pt-16 ${user ? 'md:mr-64' : ''} min-h-[calc(100vh-4rem)] transition-all duration-300`}>
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
                    <Route path="/posts/:id" element={<PostDetailsPage />} />
                    <Route path="/create-post" element={
                        <ProtectedRoute>
                            <PostFormPage />
                        </ProtectedRoute>
                    } />

                    {/* Protected Routes */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            {/* If Admin, show Admin Dashboard, else show User Dashboard (placeholder for now) */}
                            {/* For now, we can redirect based on role or just show a simple dashboard */}
                            <div className="p-8">
                                <h1 className="text-2xl font-bold mb-4">لوحة التحكم</h1>
                                <p>مرحباً بك في لوحة التحكم الخاصة بك.</p>
                            </div>
                        </ProtectedRoute>
                    } />

                    {/* Admin Route */}
                    <Route path="/admin" element={
                        <ProtectedRoute>
                            <AdminDashboardLayout />
                        </ProtectedRoute>
                    } />
                    <Route path="/my-posts" element={
                        <ProtectedRoute>
                            <div className="p-8">
                                <h1 className="text-2xl font-bold mb-4">منشوراتي</h1>
                                <p>قائمة المنشورات الخاصة بك (قيد التطوير).</p>
                            </div>
                        </ProtectedRoute>
                    } />
                    <Route path="/my-offers" element={
                        <ProtectedRoute>
                            <div className="p-8">
                                <h1 className="text-2xl font-bold mb-4">عروضي</h1>
                                <p>قائمة العروض التي قدمتها (قيد التطوير).</p>
                            </div>
                        </ProtectedRoute>
                    } />
                    <Route path="/post-manage/:id" element={
                        <ProtectedRoute>
                            <div className="p-8">
                                <h1 className="text-2xl font-bold mb-4">إدارة المنشور</h1>
                                <p>صفحة إدارة المنشور (قيد التطوير).</p>
                            </div>
                        </ProtectedRoute>
                    } />
                    <Route path="/my-products" element={
                        <ProtectedRoute>
                            <div className="p-8">
                                <h1 className="text-2xl font-bold mb-4">منتجاتي</h1>
                                <p>قائمة المنتجات الخاصة بك (قيد التطوير).</p>
                            </div>
                        </ProtectedRoute>
                    } />

                    {/* Catch all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Layout>
        </AuthProvider>
    );
};

export default App;