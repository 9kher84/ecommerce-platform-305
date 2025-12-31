import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Loader2, ShoppingBag, Package, CheckCircle, Star, Plus, FileText, Clock,
    X, AlertTriangle, User, Settings, BarChart2, DollarSign, Bell, RefreshCw, Download, Share2
} from 'lucide-react';
import apiService from '../services/apiService';
import { useAuth } from '../hooks/useAuth';

// ============================================================
// COMPONENTS
// ============================================================

const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
    </div>
);

const InvoiceRow = ({ invoice }) => (
    <tr className="border-b hover:bg-gray-50 transition-colors">
        <td className="p-4 font-medium text-gray-900">{invoice.invoiceNumber}</td>
        <td className="p-4 text-gray-600">{new Date(invoice.date).toLocaleDateString('ar-SA')}</td>
        <td className="p-4 text-gray-900 font-bold">{invoice.amount} ريال</td>
        <td className="p-4">
            <span className={`px-2 py-1 rounded-full text-xs ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {invoice.status === 'paid' ? 'مدفوع' : 'بانتظار الدفع'}
            </span>
        </td>
        <td className="p-4 flex space-x-2">
            <button className="text-gray-500 hover:text-indigo-600" title="تحميل">
                <Download className="w-5 h-5" />
            </button>
            <button className="text-gray-500 hover:text-indigo-600" title="مشاركة">
                <Share2 className="w-5 h-5" />
            </button>
        </td>
    </tr>
);

const LimitIndicator = ({ tier, count, limit }) => {
    const percentage = Math.min((count / limit) * 100, 100);
    const isLimitReached = count >= limit;

    // Limits
    const displayLimit = limit === Infinity ? 'بلا حدود' : limit;

    return (
        <div className="px-6 py-4 border-t border-b bg-gray-50">
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-600">رصيد الطلبات (أسبوعي)</span>
                <span className={`text-xs font-bold ${isLimitReached ? 'text-red-600' : 'text-indigo-600'}`}>
                    {count} / {displayLimit}
                </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                <div
                    className={`h-2.5 rounded-full ${isLimitReached ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${limit === Infinity ? 100 : percentage}%` }}
                ></div>
            </div>
            {isLimitReached && tier === 'free' && (
                <p className="text-[10px] text-red-500 mt-1 font-medium">وصلت للحد الأقصى للنشر هذا الأسبوع</p>
            )}
        </div>
    );
};

// ============================================================
// MAIN DASHBOARD
// ============================================================

const BuyerDashboard = () => {
    const { user: authUser } = useAuth(); // User from context (might be stale)
    const [activeTab, setActiveTab] = useState('account');
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState(null);
    const [requests, setRequests] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [updateMsg, setUpdateMsg] = useState({ type: '', text: '' });

    // Fetch all data on mount
    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            // 1. Profile
            const profileRes = await apiService.getUserProfile();
            setProfile(profileRes.user);
            setFormData({
                name: profileRes.user.name,
                mobile: profileRes.user.mobile || '',
                businessName: profileRes.user.businessName || '',
                email: profileRes.user.email,
                notificationSettings: profileRes.user.notificationSettings || { email: true, whatsapp: false, internal: true }
            });

            // 2. Stats
            const statsRes = await apiService.getBuyerStats();
            setStats(statsRes.stats);

            // 3. Requests
            const requestsRes = await apiService.getMyRequests();
            setRequests(requestsRes.data || []);

            // 4. Invoices
            const invoicesRes = await apiService.getBuyerInvoices();
            setInvoices(invoicesRes.invoices || []);

        } catch (error) {
            console.error("Error fetching dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setUpdateMsg({ type: '', text: '' });
        try {
            await apiService.updateUserProfile({
                name: formData.name,
                mobile: formData.mobile,
                businessName: formData.businessName,
                notificationSettings: formData.notificationSettings
            });
            setUpdateMsg({ type: 'success', text: 'تم تحديث الملف الشخصي بنجاح' });
            setIsEditing(false);
            fetchAllData(); // Refresh data
        } catch (error) {
            setUpdateMsg({ type: 'error', text: error.message });
        }
    };

    const handleRepost = async (requestId) => {
        if (!window.confirm('هل أنت متأكد من إعادة نشر هذا الطلب؟ سيتم خصم من رصيد طلباتك.')) return;
        try {
            await apiService.repostRequest(requestId);
            alert('تم إعادة النشر بنجاح!');
            fetchAllData();
        } catch (error) {
            alert(error.message);
        }
    };

    const handleNotificationChange = (type) => {
        setFormData(prev => ({
            ...prev,
            notificationSettings: {
                ...prev.notificationSettings,
                [type]: !prev.notificationSettings[type]
            }
        }));
    };

    if (loading) return (
        <div className="min-h-screen flex justify-center items-center bg-gray-50">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
        </div>
    );

    const menuItems = [
        { id: 'account', label: 'الحساب الشخصي', icon: User },
        { id: 'requests', label: 'إدارة الطلبات', icon: ShoppingBag },
        { id: 'stats', label: 'الإحصائيات', icon: BarChart2 },
        { id: 'invoices', label: 'الفواتير والصفقات', icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white shadow-md z-10">
                <div className="p-6 border-b">
                    <h2 className="text-xl font-bold text-indigo-600">لوحة المشتري</h2>
                    <p className="text-sm text-gray-500 mt-1">{profile?.name}</p>
                    <span className="inline-block px-2 py-1 mt-2 text-xs font-semibold bg-indigo-100 text-indigo-800 rounded-full">
                        {profile?.subscriptionTier === 'free' ? 'مجاني' : profile?.subscriptionTier === 'plan_a' ? 'خطة أ' : 'خطة ب'}
                    </span>
                </div>

                {/* Limit Indicator */}
                {profile && (
                    <LimitIndicator
                        tier={profile.subscriptionTier}
                        count={profile.weeklyPostCount || 0}
                        limit={profile.subscriptionTier === 'free' ? 3 : profile.subscriptionTier === 'plan_a' ? 10 : Infinity}
                    />
                )}
                <nav className="p-4 space-y-2">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto">

                {/* ACCOUNT TAB */}
                {activeTab === 'account' && (
                    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-gray-900">بيانات الحساب</h2>
                            {!isEditing && (
                                <button onClick={() => setIsEditing(true)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                                    تعديل البيانات
                                </button>
                            )}
                        </div>

                        <div className="p-6">
                            {updateMsg.text && (
                                <div className={`mb-4 p-3 rounded-lg ${updateMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {updateMsg.text}
                                </div>
                            )}

                            <form onSubmit={handleProfileUpdate}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
                                        <input
                                            type="text"
                                            disabled={!isEditing}
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full p-2 border rounded-lg disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
                                        <input
                                            type="email"
                                            disabled={true} // Email change requires verification flow, kept simple here
                                            value={formData.email}
                                            className="w-full p-2 border rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">لا يمكن تغيير البريد مباشرة</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال</label>
                                        <input
                                            type="text"
                                            disabled={!isEditing}
                                            value={formData.mobile}
                                            onChange={e => setFormData({ ...formData, mobile: e.target.value })}
                                            placeholder="05xxxxxxxx"
                                            className="w-full p-2 border rounded-lg disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">اسم الشركة / المؤسسة</label>
                                        <input
                                            type="text"
                                            disabled={!isEditing}
                                            value={formData.businessName}
                                            onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                                            className="w-full p-2 border rounded-lg disabled:bg-gray-100"
                                        />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-gray-900 mb-3">إعدادات التنبيهات</h3>
                                    <div className="space-y-2">
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                disabled={!isEditing}
                                                checked={formData.notificationSettings?.email}
                                                onChange={() => handleNotificationChange('email')}
                                                className="rounded text-indigo-600"
                                            />
                                            <span className="text-sm text-gray-700">تنبيهات البريد الإلكتروني</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                disabled={!isEditing}
                                                checked={formData.notificationSettings?.whatsapp}
                                                onChange={() => handleNotificationChange('whatsapp')}
                                                className="rounded text-indigo-600"
                                            />
                                            <span className="text-sm text-gray-700">تنبيهات واتساب</span>
                                        </label>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                disabled={!isEditing}
                                                checked={formData.notificationSettings?.internal}
                                                onChange={() => handleNotificationChange('internal')}
                                                className="rounded text-indigo-600"
                                            />
                                            <span className="text-sm text-gray-700">إشعارات داخل الموقع</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="border-t pt-4 grid grid-cols-2 gap-4 text-sm text-gray-500">
                                    <div>
                                        <span className="block font-medium">تاريخ التسجيل:</span>
                                        {new Date(profile?.registrationDate).toLocaleDateString('ar-SA')}
                                    </div>
                                    <div>
                                        <span className="block font-medium">التقييم:</span>
                                        <div className="flex items-center text-yellow-500">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="mr-1 text-gray-700">{profile?.buyerRating || '0.0'}</span>
                                        </div>
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="mt-6 flex space-x-3">
                                        <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700">
                                            حفظ التغييرات
                                        </button>
                                        <button type="button" onClick={() => setIsEditing(false)} className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300">
                                            إلغاء
                                        </button>
                                    </div>
                                )}
                            </form>
                        </div>
                    </div>
                )}

                {/* REQUESTS TAB */}
                {activeTab === 'requests' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900">إدارة الطلبات</h2>
                            {profile && (profile.subscriptionTier !== 'free' || (profile.weeklyPostCount || 0) < 3) ? (
                                <Link to="/create-request" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                                    <Plus className="w-5 h-5" />
                                    <span>طلب جديد</span>
                                </Link>
                            ) : (
                                <button disabled className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg flex items-center space-x-2 cursor-not-allowed" title="وصلت للحد الأقصى الأسبوعي">
                                    <Plus className="w-5 h-5" />
                                    <span>طلب جديد (الحد ممتلئ)</span>
                                </button>
                            )}
                        </div>

                        {requests.length === 0 ? (
                            <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                                <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                <p className="text-gray-500">لا توجد طلبات شراء حتى الآن</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {requests.map(req => (
                                    <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h3 className="text-lg font-bold text-gray-900">{req.title}</h3>
                                                    <span className={`px-2 py-0.5 rounded text-xs ${req.status === 'published' ? 'bg-blue-100 text-blue-800' :
                                                        req.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {req.status === 'published' ? 'منشور' : req.status === 'expired' ? 'منتهي' : req.status}
                                                    </span>
                                                </div>
                                                <p className="text-gray-500 text-sm line-clamp-1">{req.description}</p>
                                                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-400">
                                                    <span className="flex items-center"><Clock className="w-4 h-4 ml-1" /> {new Date(req.createdAt).toLocaleDateString('ar-SA')}</span>
                                                    <span className="flex items-center"><FileText className="w-4 h-4 ml-1" /> {req.quoteCount || 0} عروض</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col space-y-2">
                                                <Link to={`/requests/${req.id}`} className="text-indigo-600 hover:bg-indigo-50 px-3 py-1 rounded text-sm text-center">
                                                    التفاصيل
                                                </Link>

                                                {/* Edit Button - Strict Visibility */}
                                                {(req.status === 'draft' || (['plan_a', 'plan_b'].includes(profile?.subscriptionTier) && ['published', 'negotiating'].includes(req.status))) && (
                                                    <Link to={`/edit-request/${req.id}`} className="text-gray-600 hover:bg-gray-100 px-3 py-1 rounded text-sm text-center flex items-center justify-center">
                                                        <span>تعديل</span>
                                                    </Link>
                                                )}
                                                {(req.status === 'expired' || req.status === 'cancelled') && (
                                                    <button
                                                        onClick={() => handleRepost(req.id)}
                                                        className="text-green-600 hover:bg-green-50 px-3 py-1 rounded text-sm flex items-center justify-center"
                                                    >
                                                        <RefreshCw className="w-3 h-3 ml-1" /> إعادة نشر
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* STATS TAB */}
                {activeTab === 'stats' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">الإحصائيات والتحليلات</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="متوسط الأسعار" value={`${stats?.avgQuotePrice || 0} ريال`} icon={DollarSign} color="bg-green-500" />
                            <StatCard title="نسبة القبول" value={`${stats?.acceptanceRate || 0}%`} icon={CheckCircle} color="bg-blue-500" />
                            <StatCard title="الموردين المتفاعلين" value={stats?.uniqueSuppliers || 0} icon={User} color="bg-purple-500" />
                            <StatCard title="إجمالي الطلبات" value={profile?.publishedRequestsCount || 0} icon={ShoppingBag} color="bg-indigo-500" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4">أكثر التصنيفات طلباً</h3>
                                <div className="space-y-3">
                                    {stats?.topCategories?.map((cat, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                            <span className="text-gray-600">{cat.category?.name_ar || 'غير معروف'}</span>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-indigo-500" style={{ width: `${(cat.count / 10) * 100}%` }}></div>
                                                </div>
                                                <span className="text-sm font-bold">{cat.count}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!stats?.topCategories || stats.topCategories.length === 0) && <p className="text-gray-400 text-sm">لا توجد بيانات كافية</p>}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-800 mb-4">الطلبات حسب المدينة</h3>
                                <div className="space-y-3">
                                    {stats?.requestsByCity?.map((city, idx) => (
                                        <div key={idx} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0">
                                            <span className="text-gray-600">{city.delivery_city}</span>
                                            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-bold">{city.count}</span>
                                        </div>
                                    ))}
                                    {(!stats?.requestsByCity || stats.requestsByCity.length === 0) && <p className="text-gray-400 text-sm">لا توجد بيانات كافية</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* INVOICES TAB */}
                {activeTab === 'invoices' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-gray-900">الفواتير والصفقات</h2>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            {invoices.length === 0 ? (
                                <div className="p-12 text-center">
                                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500">لا توجد فواتير حالياً</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right">
                                        <thead className="bg-gray-50 text-gray-500 text-sm">
                                            <tr>
                                                <th className="p-4">رقم الفاتورة</th>
                                                <th className="p-4">التاريخ</th>
                                                <th className="p-4">المبلغ</th>
                                                <th className="p-4">الحالة</th>
                                                <th className="p-4">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {invoices.map(inv => <InvoiceRow key={inv.id} invoice={inv} />)}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default BuyerDashboard;