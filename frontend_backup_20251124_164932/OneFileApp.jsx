import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, setLogLevel, doc, onSnapshot } from 'firebase/firestore';

// يتم تحميل مكتبة Lucide React للرموز (Icons)
import { Home, LogIn, LogOut, User, DollarSign, Users, Briefcase, ChevronDown, List, X, Loader2, Mail, Lock, CheckCircle, AlertTriangle } from 'lucide-react';


// ----------------------------------------------------------
// 1. إعدادات وثوابت Firebase
// ----------------------------------------------------------

// الثوابت العالمية يتم توفيرها بواسطة بيئة التشغيل (Canvas)
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// تهيئة Firebase
const app = Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

// تعيين مستوى التسجيل للمساعدة في تصحيح الأخطاء
if (db) {
    setLogLevel('error');
}


// ----------------------------------------------------------
// 2. دالة مساعدة لطلب الـ API
// ----------------------------------------------------------

/**
 * دالة موحدة لإجراء طلبات Fetch إلى الـ API، مع تضمين رمز الحماية (Token).
 * @param {string} endpoint - مسار الـ API (مثل /api/posts)
 * @param {object} options - خيارات الطلب (method, body, headers)
 * @returns {Promise<object>} - بيانات الاستجابة
 */
const fetchApi = async (endpoint, options = {}) => {
    // جلب الرمز الحالي من Firebase Auth
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : null;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const apiUrl = `/api${endpoint}`;

    try {
        const response = await fetch(apiUrl, { ...options, headers });
        const data = await response.json();
        
        if (!response.ok) {
            // يتم طرح الخطأ من الـ API Middleware (errorHandler)
            throw new Error(data.message || 'حدث خطأ في طلب API');
        }

        return data;

    } catch (error) {
        console.error('API Call Error:', error);
        throw error;
    }
};


// ----------------------------------------------------------
// 3. مكونات الواجهة الأمامية (UI Components)
// ----------------------------------------------------------

// حالة التنقل في التطبيق (بسيطة باستخدام string)
const PAGES = {
    DASHBOARD: 'Dashboard',
    CATEGORIES: 'Categories',
    POSTS: 'Posts',
    OFFERS: 'Offers',
    PROFILE: 'Profile',
    ADMIN_USERS: 'AdminUsers',
    ADMIN_TRANSACTIONS: 'AdminTransactions',
    LOGIN: 'Login',
    REGISTER: 'Register'
};

/**
 * مكون رسالة خطأ أو نجاح
 */
const StatusMessage = ({ message, type }) => {
    if (!message) return null;
    
    const baseClasses = "p-4 rounded-xl flex items-center mb-4";
    let classes = "";
    let Icon = AlertTriangle;

    switch (type) {
        case 'error':
            classes = "bg-red-100 text-red-800 border border-red-200";
            Icon = X;
            break;
        case 'success':
            classes = "bg-green-100 text-green-800 border border-green-200";
            Icon = CheckCircle;
            break;
        default:
            classes = "bg-blue-100 text-blue-800 border border-blue-200";
            Icon = AlertTriangle;
    }

    return (
        <div className={`${baseClasses} ${classes}`}>
            <Icon className="w-5 h-5 ml-2 flex-shrink-0" />
            <span className="text-sm">{message}</span>
        </div>
    );
};

// ----------------------------------------------------------
// مكون تسجيل الدخول (LoginComponent)
// ----------------------------------------------------------
const LoginComponent = ({ onNavigate, onShowMessage }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const data = await fetchApi('/users/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            // نجاح تسجيل الدخول - لا نحتاج لتحديث حالة المستخدم يدوياً
            // لأن مستمع onAuthStateChanged سيتكفل بالتحديث.
            onShowMessage('تم تسجيل الدخول بنجاح.', 'success');
            onNavigate(PAGES.DASHBOARD); // الانتقال إلى لوحة التحكم
            
        } catch (err) {
            const errorMessage = err.message.includes('password') 
                ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' 
                : err.message || 'فشل تسجيل الدخول.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">تسجيل الدخول</h1>
            
            <StatusMessage message={error} type="error" />

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        البريد الإلكتروني
                    </label>
                    <div className="relative">
                        <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 transition duration-150"
                            placeholder="example@domain.com"
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        كلمة المرور
                    </label>
                    <div className="relative">
                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 transition duration-150"
                            placeholder="********"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <LogIn className="w-5 h-5 ml-2" />}
                    {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    هل أنت مستخدم جديد؟
                    <button
                        onClick={() => onNavigate(PAGES.REGISTER)}
                        className="font-medium text-primary-600 hover:text-primary-500 mr-1 focus:outline-none"
                    >
                        أنشئ حساباً
                    </button>
                </p>
            </div>
        </div>
    );
};


// ----------------------------------------------------------
// مكون تسجيل حساب جديد (RegisterComponent)
// ----------------------------------------------------------
const RegisterComponent = ({ onNavigate, onShowMessage }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('buyer'); // الافتراضي 'مشتري'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const data = await fetchApi('/users/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password, role }),
            });
            
            // نجاح التسجيل
            onShowMessage(`تم إنشاء الحساب بنجاح، مرحباً بك يا ${data.data.user.name}. يرجى تسجيل الدخول.`, 'success');
            onNavigate(PAGES.LOGIN);

        } catch (err) {
            const errorMessage = err.message.includes('duplicate key') 
                ? 'هذا البريد الإلكتروني مسجل بالفعل.'
                : err.message || 'فشل التسجيل. يرجى مراجعة البيانات.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-8 bg-white rounded-xl shadow-2xl border border-gray-100">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">إنشاء حساب جديد</h1>
            
            <StatusMessage message={error} type="error" />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* الاسم */}
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        الاسم الكامل
                    </label>
                    <div className="relative">
                        <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 transition duration-150"
                            placeholder="أدخل اسمك"
                        />
                    </div>
                </div>

                {/* البريد الإلكتروني */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        البريد الإلكتروني
                    </label>
                    <div className="relative">
                        <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 transition duration-150"
                            placeholder="example@domain.com"
                        />
                    </div>
                </div>

                {/* كلمة المرور */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        كلمة المرور
                    </label>
                    <div className="relative">
                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 transition duration-150"
                            placeholder="********"
                        />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        يجب أن تحتوي على 6 أحرف على الأقل.
                    </p>
                </div>
                
                {/* الدور */}
                <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                        دورك الأساسي
                    </label>
                    <select
                        id="role"
                        name="role"
                        required
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="w-full py-2 px-3 border border-gray-300 bg-white rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 transition duration-150"
                    >
                        <option value="buyer">مشتري (لتقديم العروض)</option>
                        <option value="seller">بائع (لنشر منتجاتك)</option>
                    </select>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-lg font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : <User className="w-5 h-5 ml-2" />}
                    {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    لديك حساب بالفعل؟
                    <button
                        onClick={() => onNavigate(PAGES.LOGIN)}
                        className="font-medium text-primary-600 hover:text-primary-500 mr-1 focus:outline-none"
                    >
                        تسجيل الدخول
                    </button>
                </p>
            </div>
        </div>
    );
};


/**
 * مكون الناف بار العلوي
 */
const Navbar = ({ currentPage, onNavigate, user, isAuthReady, onLogout }) => {
    // ... (هذا المكون لا يتغير، تم حذفه هنا للاختصار لكنه موجود في الملف الكامل)
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = useMemo(() => {
        const items = [
            { id: PAGES.DASHBOARD, label: 'لوحة التحكم', icon: Home, roles: ['buyer', 'seller', 'admin', 'super_admin'] },
            { id: PAGES.POSTS, label: 'المنشورات', icon: Briefcase, roles: ['buyer', 'seller', 'admin', 'super_admin'] },
        ];

        if (user && user.role) {
            if (user.role === 'admin' || user.role === 'super_admin') {
                items.push(
                    { id: PAGES.CATEGORIES, label: 'إدارة التصنيفات', icon: List, roles: ['admin', 'super_admin'] },
                    { id: PAGES.ADMIN_USERS, label: 'إدارة المستخدمين', icon: Users, roles: ['admin', 'super_admin'] },
                    { id: PAGES.ADMIN_TRANSACTIONS, label: 'سجل الصفقات', icon: DollarSign, roles: ['admin', 'super_admin'] },
                );
            }
        }
        return items;
    }, [user]);

    const filteredNavItems = navItems.filter(item => 
        user && item.roles.includes(user.role)
    );

    return (
        <header className="bg-white shadow-md sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex-shrink-0">
                        <span className="text-2xl font-bold text-primary-600">منصة المزايدة</span>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-4 space-x-reverse">
                        {filteredNavItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out ${
                                    currentPage === item.id 
                                        ? 'bg-primary-50 text-primary-700' 
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <item.icon className="w-4 h-4" />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>

                    {/* Auth & Profile Section */}
                    <div className="hidden md:flex items-center space-x-4 space-x-reverse">
                        {isAuthReady ? (
                            user ? (
                                <div className="relative">
                                    <button 
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className="flex items-center space-x-2 space-x-reverse text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none"
                                    >
                                        <User className="w-5 h-5 text-primary-500" />
                                        <span>{user.name || 'المستخدم'} ({user.role})</span>
                                        <ChevronDown className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : 'rotate-0'}`} />
                                    </button>
                                    {isMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-100">
                                            <button
                                                onClick={() => { onNavigate(PAGES.PROFILE); setIsMenuOpen(false); }}
                                                className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 space-x-reverse"
                                            >
                                                <User className="w-4 h-4" /> <span>الملف الشخصي</span>
                                            </button>
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <button
                                                onClick={onLogout}
                                                className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 space-x-reverse"
                                            >
                                                <LogOut className="w-4 h-4" /> <span>تسجيل الخروج</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => onNavigate(PAGES.LOGIN)}
                                        className="text-gray-700 hover:text-gray-900 text-sm font-medium flex items-center"
                                    >
                                        <LogIn className="w-4 h-4 ml-1" /> تسجيل الدخول
                                    </button>
                                    <button 
                                        onClick={() => onNavigate(PAGES.REGISTER)}
                                        className="bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition"
                                    >
                                        إنشاء حساب
                                    </button>
                                </>
                            )
                        ) : (
                            <div className="text-gray-500 text-sm flex items-center space-x-2 space-x-reverse">
                                <Loader2 className="w-4 h-4 animate-spin" /> <span>جاري التحميل...</span>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X className="h-6 w-6" /> : <List className="h-6 w-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white shadow-lg pb-3">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {filteredNavItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => { onNavigate(item.id); setIsMenuOpen(false); }}
                                className={`w-full text-right flex items-center space-x-2 space-x-reverse px-3 py-2 rounded-md text-base font-medium transition duration-150 ease-in-out ${
                                    currentPage === item.id 
                                        ? 'bg-primary-50 text-primary-700' 
                                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="pt-4 pb-3 border-t border-gray-200">
                        {isAuthReady && !user ? (
                            <div className="flex flex-col px-5 space-y-2">
                                <button
                                    onClick={() => { onNavigate(PAGES.LOGIN); setIsMenuOpen(false); }}
                                    className="w-full text-center bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded-md text-base font-medium transition"
                                >
                                    تسجيل الدخول
                                </button>
                                <button
                                    onClick={() => { onNavigate(PAGES.REGISTER); setIsMenuOpen(false); }}
                                    className="w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-base font-medium transition"
                                >
                                    إنشاء حساب
                                </button>
                            </div>
                        ) : (
                            user && (
                                <div className="px-5">
                                    <div className="flex items-center justify-between py-2">
                                        <div className="flex items-center space-x-2 space-x-reverse">
                                            <User className="w-6 h-6 text-primary-500" />
                                            <div className="font-medium text-gray-900">{user.name || 'المستخدم'}</div>
                                        </div>
                                        <div className="text-sm text-gray-500">({user.role})</div>
                                    </div>
                                    <button
                                        onClick={() => { onNavigate(PAGES.PROFILE); setIsMenuOpen(false); }}
                                        className="w-full text-right px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2 space-x-reverse rounded-md mt-2"
                                    >
                                        <User className="w-4 h-4" /> <span>الملف الشخصي</span>
                                    </button>
                                    <button
                                        onClick={onLogout}
                                        className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 space-x-reverse rounded-md mt-1"
                                    >
                                        <LogOut className="w-4 h-4" /> <span>تسجيل الخروج</span>
                                    </button>
                                </div>
                            )
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};


/**
 * مكون رسالة (Alert/Modal) بسيط
 */
const SimpleMessageModal = ({ message, type = 'info', onClose }) => {
    const colorClasses = {
        info: 'bg-blue-100 text-blue-800 border-blue-200',
        success: 'bg-green-100 text-green-800 border-green-200',
        error: 'bg-red-100 text-red-800 border-red-200',
        warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className={`p-6 rounded-lg shadow-2xl max-w-sm w-full border-t-4 ${colorClasses[type]}`}>
                <div className="flex justify-between items-start">
                    <p className="font-medium">{message}</p>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {type === 'error' && <p className="text-xs mt-2">يرجى المحاولة مرة أخرى.</p>}
            </div>
        </div>
    );
};


// ----------------------------------------------------------
// 4. المكون الرئيسي للتطبيق (App)
// ----------------------------------------------------------

const App = () => {
    // حالة المستخدم
    const [user, setUser] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    
    // حالة التنقل
    const [currentPage, setCurrentPage] = useState(PAGES.LOGIN); // ابدأ من صفحة الدخول
    
    // حالة الرسائل والإشعارات
    const [message, setMessage] = useState(null);
    const [messageType, setMessageType] = useState('info');

    // ------------------------------------------------------------------
    // أ. تهيئة Firebase والمصادقة (Initial Auth and State Management)
    // ------------------------------------------------------------------

    useEffect(() => {
        if (!auth) {
            console.error('Firebase Auth is not initialized.');
            setIsAuthReady(true);
            return;
        }

        // 1. تسجيل الدخول بالرمز الأولي أو كمجهول
        const signInInitial = async () => {
            try {
                if (initialAuthToken) {
                    await signInWithCustomToken(auth, initialAuthToken);
                } else {
                    await signInAnonymously(auth);
                }
            } catch (error) {
                console.error("Initial Firebase sign-in failed:", error);
                // إذا فشل الرمز الأولي، حاول الدخول كمجهول
                try {
                    await signInAnonymously(auth);
                } catch (anonError) {
                    console.error("Anonymous sign-in failed:", anonError);
                }
            }
        };

        signInInitial();

        // 2. الاستماع لتغير حالة المصادقة (Auth State Listener)
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUserId(firebaseUser.uid);
                
                // جلب بيانات المستخدم المخصصة من Firestore (الدور، الاسم، إلخ)
                if (db) {
                    const userDocRef = doc(db, 'artifacts', appId, 'users', firebaseUser.uid, 'profile', 'data');
                    
                    // الاستماع للتغييرات في الوقت الفعلي
                    const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
                        if (docSnap.exists()) {
                            const userData = docSnap.data();
                            
                            // دمج بيانات Firebase الأساسية مع بيانات Firestore
                            const finalUser = {
                                id: firebaseUser.uid,
                                email: firebaseUser.email,
                                role: userData.role || 'buyer', // الافتراضي 'buyer'
                                name: userData.name || 'مستخدم جديد',
                                ...userData
                            };
                            setUser(finalUser);
                            // الانتقال إلى لوحة التحكم بمجرد تحميل بيانات المستخدم بنجاح
                            setCurrentPage(PAGES.DASHBOARD); 
                        } else {
                            // المستخدم مسجل في Firebase لكن ليس لديه ملف شخصي في Firestore بعد
                            setUser({ 
                                id: firebaseUser.uid, 
                                email: firebaseUser.email, 
                                role: 'buyer', 
                                name: 'مستخدم مجهول' 
                            });
                        }
                        setIsAuthReady(true);
                    }, (error) => {
                        console.error("Firestore Snapshot Error:", error);
                        setIsAuthReady(true);
                    });
                    
                    return () => unsubscribeDoc(); // إزالة مستمع Firestore عند التنظيف
                } else {
                    // لا يوجد اتصال بـ Firestore، نستخدم بيانات Firebase فقط
                    setUser({ id: firebaseUser.uid, email: firebaseUser.email, role: 'unknown', name: 'مستخدم' });
                    setIsAuthReady(true);
                    setCurrentPage(PAGES.DASHBOARD); 
                }
            } else {
                setUser(null);
                setUserId(null);
                setIsAuthReady(true);
                setCurrentPage(PAGES.LOGIN); // الانتقال إلى صفحة الدخول عند تسجيل الخروج
            }
        });

        // إزالة مستمع Auth عند إلغاء تحميل المكون
        return () => unsubscribe();
    }, []);

    // ------------------------------------------------------------------
    // ب. وظائف الـ UI
    // ------------------------------------------------------------------

    const handleLogout = useCallback(async () => {
        if (!auth) return;
        try {
            await auth.signOut();
            setCurrentPage(PAGES.LOGIN);
            setMessage('تم تسجيل الخروج بنجاح.');
            setMessageType('success');
        } catch (error) {
            console.error('Logout error:', error);
            setMessage('فشل تسجيل الخروج.');
            setMessageType('error');
        }
    }, []);

    const showMessage = useCallback((msg, type = 'info') => {
        setMessage(msg);
        setMessageType(type);
    }, []);
    
    // دالة لتحديد المكون الذي سيتم عرضه بناءً على الصفحة الحالية
    const renderPage = () => {
        if (!isAuthReady) {
            return <LoadingScreen />;
        }
        
        // إذا لم يكن هناك مستخدم مسجل، اعرض صفحة الدخول أو التسجيل
        if (!user) {
            if (currentPage === PAGES.REGISTER) {
                return <RegisterComponent onNavigate={setCurrentPage} onShowMessage={showMessage} />;
            }
            return <LoginComponent onNavigate={setCurrentPage} onShowMessage={showMessage} />;
        }
        
        // صفحات التطبيق المحمية
        switch (currentPage) {
            case PAGES.DASHBOARD:
                // TODO: يتم بناء مكون DashboardComponent هنا
                return <PlaceholderPage title="لوحة التحكم" description={`أهلاً بك يا ${user.name}، دورك هو: ${user.role}. سيتم بناء لوحة التحكم الديناميكية هنا.`} />;
            case PAGES.PROFILE:
                // TODO: يتم بناء مكون ProfileComponent هنا
                return <PlaceholderPage title="الملف الشخصي" description="سيتم بناء واجهة لتحديث الملف الشخصي هنا." />;
            case PAGES.POSTS:
                // TODO: يتم بناء مكون PostsManagementComponent هنا
                return <PlaceholderPage title="إدارة المنشورات" description="سيتم بناء واجهة إنشاء/إدارة المنشورات والمزايدة هنا." />;
            case PAGES.CATEGORIES:
                // TODO: يتم بناء مكون CategoriesManagementComponent هنا
                if (user.role === 'admin' || user.role === 'super_admin') {
                    return <PlaceholderPage title="إدارة التصنيفات" description="سيتم بناء واجهة إضافة/تعديل التصنيفات هنا." />;
                }
                return <PermissionDenied />;
            case PAGES.ADMIN_USERS:
                // TODO: يتم بناء مكون AdminUsersManagementComponent هنا
                if (user.role === 'admin' || user.role === 'super_admin') {
                    return <PlaceholderPage title="إدارة المستخدمين" description="سيتم بناء واجهة حظر/تعديل أدوار المستخدمين هنا." />;
                }
                return <PermissionDenied />;
            case PAGES.ADMIN_TRANSACTIONS:
                // TODO: يتم بناء مكون AdminTransactionsComponent هنا
                if (user.role === 'admin' || user.role === 'super_admin') {
                    return <PlaceholderPage title="سجل الصفقات" description="سيتم بناء واجهة تقارير الصفقات هنا." />;
                }
                return <PermissionDenied />;
            default:
                return <PlaceholderPage title="صفحة غير موجودة" description="عُد إلى لوحة التحكم." actionLabel="لوحة التحكم" action={() => setCurrentPage(PAGES.DASHBOARD)} />;
        }
    };

    return (
        <div dir="rtl" className="min-h-screen bg-gray-50 flex flex-col font-sans antialiased">
            <style>{`
                /* Font import for Inter (Tailwind default) - Arabic is handled by default system fonts */
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
                body {
                    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
                }
            `}</style>
            
            <Navbar 
                currentPage={currentPage} 
                onNavigate={setCurrentPage} 
                user={user} 
                isAuthReady={isAuthReady} 
                onLogout={handleLogout} 
            />

            <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
                {renderPage()}
            </main>

            {message && (
                <SimpleMessageModal 
                    message={message} 
                    type={messageType} 
                    onClose={() => setMessage(null)} 
                />
            )}
            
            {/* جعل دالة fetchApi متاحة عالميًا لتكون مساعدة في المكونات اللاحقة */}
            {window && (window.fetchApi = fetchApi)}
        </div>
    );
};

// ----------------------------------------------------------
// 5. مكونات الإجراءات والرسائل (Helper Components)
// ----------------------------------------------------------

const LoadingScreen = () => (
    <div className="flex items-center justify-center h-64 text-gray-600">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500 ml-2" />
        <span>جاري تحميل بيانات التطبيق...</span>
    </div>
);

const PermissionDenied = () => (
    <div className="p-10 text-center bg-red-50 border border-red-200 rounded-xl shadow-lg mt-8">
        <X className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-red-800">صلاحيات غير كافية</h2>
        <p className="text-red-700 mt-2">عذراً، هذه الصفحة مخصصة للمسؤولين فقط.</p>
    </div>
);

const PlaceholderPage = ({ title, description, actionLabel, action }) => (
    <div className="p-10 text-center bg-white border border-gray-100 rounded-xl shadow-lg mt-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">{title}</h1>
        <p className="text-lg text-gray-600 mb-6">{description}</p>
        <p className="text-sm text-gray-400 mb-8">
            <span className="font-bold">ملاحظة:</span> هذه واجهة وهمية، سيتم استبدالها بمكون React الكامل في الخطوات التالية.
        </p>
        {action && (
            <button
                onClick={action}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl text-lg font-medium shadow-md transition duration-150"
            >
                {actionLabel}
            </button>
        )}
    </div>
);

export default App;