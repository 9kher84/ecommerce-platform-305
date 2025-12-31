// components/OwnerDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const OwnerDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [permissionModal, setPermissionModal] = useState(false);

    useEffect(() => {
        if (user?.role === 'owner') {
            fetchUsers();
            fetchAdmins();
        }
    }, [user]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/admin/users/all', {
                withCredentials: true
            });
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (error) {
            console.error('خطأ في جلب المستخدمين:', error);
            alert('فشل في جلب بيانات المستخدمين');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdmins = async () => {
        try {
            const res = await axios.get('/api/admin/admins', {
                withCredentials: true
            });
            if (res.data.success) {
                setAdmins(res.data.data);
            }
        } catch (error) {
            console.error('خطأ في جلب الأدمنز:', error);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.')) {
            return;
        }

        try {
            const res = await axios.delete(`/api/admin/users/${userId}/delete`, {
                withCredentials: true
            });

            if (res.data.success) {
                alert('تم حذف المستخدم بنجاح');
                fetchUsers();
            }
        } catch (error) {
            console.error('خطأ في حذف المستخدم:', error);
            alert(error.response?.data?.error || 'فشل في حذف المستخدم');
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        const action = currentStatus ? 'تعطيل' : 'تفعيل';
        if (!window.confirm(`هل أنت متأكد من ${action} هذا المستخدم؟`)) {
            return;
        }

        try {
            const res = await axios.post(`/api/admin/users/${userId}/toggle-status`, {}, {
                withCredentials: true
            });

            if (res.data.success) {
                alert(`تم ${action} المستخدم بنجاح`);
                fetchUsers();
            }
        } catch (error) {
            console.error('خطأ في تغيير حالة المستخدم:', error);
            alert(error.response?.data?.error || 'فشل في تغيير الحالة');
        }
    };

    const handleUpdatePermissions = async (userId, permissions) => {
        try {
            const res = await axios.put(`/api/admin/users/${userId}/update`, {
                adminPermissions: permissions,
                isAdmin: permissions.length > 0
            }, {
                withCredentials: true
            });

            if (res.data.success) {
                alert('تم تحديث الصلاحيات بنجاح');
                setPermissionModal(false);
                fetchUsers();
                fetchAdmins();
            }
        } catch (error) {
            console.error('خطأ في تحديث الصلاحيات:', error);
            alert(error.response?.data?.error || 'فشل في تحديث الصلاحيات');
        }
    };

    const handleMakeAdmin = async (userId) => {
        if (!window.confirm('هل تريد منح هذا المستخدم صلاحيات الأدمن؟')) {
            return;
        }

        try {
            const defaultPermissions = ['manage_posts', 'manage_deals', 'view_logs'];

            const res = await axios.put(`/api/admin/users/${userId}/update`, {
                isAdmin: true,
                adminPermissions: defaultPermissions,
                adminStatus: 'active'
            }, {
                withCredentials: true
            });

            if (res.data.success) {
                alert('تم تعيين المستخدم كأدمن بنجاح');
                fetchUsers();
                fetchAdmins();
            }
        } catch (error) {
            console.error('خطأ في تعيين الأدمن:', error);
            alert(error.response?.data?.error || 'فشل في تعيين الأدمن');
        }
    };

    const handleRevokeAdmin = async (userId) => {
        if (!window.confirm('هل تريد سحب صلاحيات الأدمن من هذا المستخدم؟')) {
            return;
        }

        try {
            const res = await axios.put(`/api/admin/users/${userId}/update`, {
                isAdmin: false,
                adminPermissions: [],
                adminStatus: 'revoked'
            }, {
                withCredentials: true
            });

            if (res.data.success) {
                alert('تم سحب صلاحيات الأدمن بنجاح');
                fetchUsers();
                fetchAdmins();
            }
        } catch (error) {
            console.error('خطأ في سحب صلاحيات الأدمن:', error);
            alert(error.response?.data?.error || 'فشل في سحب الصلاحيات');
        }
    };

    const permissionOptions = [
        { id: 'manage_users', label: 'إدارة المستخدمين' },
        { id: 'manage_posts', label: 'إدارة المنشورات' },
        { id: 'manage_deals', label: 'إدارة الصفقات' },
        { id: 'manage_categories', label: 'إدارة التصنيفات' },
        { id: 'view_logs', label: 'عرض السجلات' },
        { id: 'edit_settings', label: 'تعديل الإعدادات' },
        { id: 'all', label: 'جميع الصلاحيات' }
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    👑 لوحة تحكم المالك الرئيسي
                </h1>
                <p className="text-gray-600 mt-2">
                    لديك جميع الصلاحيات لإدارة النظام بالكامل
                </p>
            </div>

            {/* التبويبات */}
            <div className="flex gap-2 mb-6 bg-white p-2 rounded-lg shadow">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-md ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                >
                    👥 جميع المستخدمين
                </button>
                <button
                    onClick={() => setActiveTab('admins')}
                    className={`px-4 py-2 rounded-md ${activeTab === 'admins' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                >
                    🛡️ الأدمنز
                </button>
                <button
                    onClick={() => setActiveTab('system')}
                    className={`px-4 py-2 rounded-md ${activeTab === 'system' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                >
                    ⚙️ أدوات النظام
                </button>
            </div>

            {/* المحتوى */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                {loading ? (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">جاري التحميل...</p>
                    </div>
                ) : activeTab === 'users' ? (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">جميع المستخدمين ({users.length})</h2>
                            <div className="text-sm text-gray-500">
                                إجمالي المستخدمين: {users.length} | الأدمنز: {admins.length}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-3 border-b">ID</th>
                                        <th className="p-3 border-b">الاسم</th>
                                        <th className="p-3 border-b">البريد</th>
                                        <th className="p-3 border-b">الدور</th>
                                        <th className="p-3 border-b">الأدمن</th>
                                        <th className="p-3 border-b">الحالة</th>
                                        <th className="p-3 border-b">تاريخ التسجيل</th>
                                        <th className="p-3 border-b">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(userItem => (
                                        <tr key={userItem.id} className="hover:bg-gray-50 border-b">
                                            <td className="p-3 font-mono text-sm">#{userItem.id}</td>
                                            <td className="p-3 font-medium">{userItem.name}</td>
                                            <td className="p-3 text-gray-500">{userItem.email}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-1 rounded text-xs ${userItem.role === 'owner' ? 'bg-purple-100 text-purple-800' :
                                                        userItem.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                                                            userItem.role === 'seller' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {userItem.role === 'owner' ? 'مالك' :
                                                        userItem.role === 'admin' ? 'أدمن' :
                                                            userItem.role === 'seller' ? 'بائع' : 'مشتري'}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                {userItem.isAdmin ? (
                                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                                        ✓ أدمن
                                                    </span>
                                                ) : (
                                                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                                        مستخدم عادي
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {userItem.isActive ? (
                                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                                        نشط
                                                    </span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                                                        معطل
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-sm text-gray-500">
                                                {new Date(userItem.createdAt).toLocaleDateString('ar-SA')}
                                            </td>
                                            <td className="p-3">
                                                <div className="flex gap-2">
                                                    {!userItem.isAdmin && userItem.role !== 'owner' && (
                                                        <button
                                                            onClick={() => handleMakeAdmin(userItem.id)}
                                                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                                                        >
                                                            جعله أدمن
                                                        </button>
                                                    )}

                                                    {userItem.isAdmin && userItem.role !== 'owner' && (
                                                        <button
                                                            onClick={() => handleRevokeAdmin(userItem.id)}
                                                            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                                                        >
                                                            سحب الأدمن
                                                        </button>
                                                    )}

                                                    {userItem.role !== 'owner' && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedUser(userItem);
                                                                setPermissionModal(true);
                                                            }}
                                                            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700"
                                                        >
                                                            الصلاحيات
                                                        </button>
                                                    )}

                                                    {userItem.role !== 'owner' && userItem.id !== user?.id && (
                                                        <button
                                                            onClick={() => handleToggleStatus(userItem.id, userItem.isActive)}
                                                            className={`px-3 py-1 rounded text-sm ${userItem.isActive
                                                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                                                    : 'bg-green-600 text-white hover:bg-green-700'
                                                                }`}
                                                        >
                                                            {userItem.isActive ? 'تعطيل' : 'تفعيل'}
                                                        </button>
                                                    )}

                                                    {userItem.role !== 'owner' && userItem.id !== user?.id && (
                                                        <button
                                                            onClick={() => handleDeleteUser(userItem.id)}
                                                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                                                        >
                                                            حذف
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab === 'admins' ? (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">إدارة الأدمنز ({admins.length})</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {admins.map(admin => (
                                <div key={admin.id} className="border rounded-lg p-4 hover:shadow-md">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h3 className="font-semibold">{admin.name}</h3>
                                            <p className="text-sm text-gray-500">{admin.email}</p>
                                        </div>
                                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                            {admin.adminStatus || 'active'}
                                        </span>
                                    </div>

                                    <div className="mb-3">
                                        <p className="text-sm text-gray-600 mb-1">الصلاحيات:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {admin.adminPermissions && admin.adminPermissions.length > 0 ? (
                                                admin.adminPermissions.map(perm => (
                                                    <span key={perm} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                                        {perm}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-500">لا توجد صلاحيات محددة</span>
                                            )}
                                        </div>
                                    </div>

                                    {admin.role !== 'owner' && (
                                        <div className="flex gap-2 mt-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(admin);
                                                    setPermissionModal(true);
                                                }}
                                                className="flex-1 bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700"
                                            >
                                                تعديل الصلاحيات
                                            </button>
                                            <button
                                                onClick={() => handleRevokeAdmin(admin.id)}
                                                className="flex-1 bg-red-600 text-white py-2 rounded text-sm hover:bg-red-700"
                                            >
                                                إزالة الأدمن
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">أدوات النظام المتقدمة</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 border rounded bg-red-50">
                                <h3 className="font-bold text-red-800">تفريغ قاعدة البيانات</h3>
                                <p className="text-sm text-red-700 mb-3">تحذير: هذا الإجراء يحذف جميع البيانات ولا يمكن التراجع عنه.</p>
                                <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                                    تفريغ قاعدة البيانات
                                </button>
                            </div>

                            <div className="p-4 border rounded bg-yellow-50">
                                <h3 className="font-bold text-yellow-800">نسخ احتياطي كامل</h3>
                                <p className="text-sm text-yellow-700 mb-3">إنشاء نسخة احتياطية شاملة للنظام.</p>
                                <button className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700">
                                    إنشاء نسخة احتياطية
                                </button>
                            </div>

                            <div className="p-4 border rounded bg-purple-50">
                                <h3 className="font-bold text-purple-800">سجلات النظام</h3>
                                <p className="text-sm text-purple-700 mb-3">عرض وتحليل سجلات النظام التفصيلية.</p>
                                <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                                    عرض السجلات الكاملة
                                </button>
                            </div>

                            <div className="p-4 border rounded bg-green-50">
                                <h3 className="font-bold text-green-800">إحصائيات النظام</h3>
                                <p className="text-sm text-green-700 mb-3">تقارير وإحصائيات مفصلة عن النظام.</p>
                                <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                                    عرض التقارير
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal لإدارة الصلاحيات */}
            {permissionModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                        <h3 className="text-xl font-semibold mb-4">
                            إدارة صلاحيات {selectedUser.name}
                        </h3>

                        <div className="space-y-3 mb-6">
                            {permissionOptions.map(option => (
                                <label key={option.id} className="flex items-center space-x-3 space-x-reverse">
                                    <input
                                        type="checkbox"
                                        checked={selectedUser.adminPermissions?.includes(option.id) || false}
                                        onChange={(e) => {
                                            const newPermissions = e.target.checked
                                                ? [...(selectedUser.adminPermissions || []), option.id]
                                                : selectedUser.adminPermissions.filter(p => p !== option.id);
                                            setSelectedUser({
                                                ...selectedUser,
                                                adminPermissions: newPermissions
                                            });
                                        }}
                                        className="h-5 w-5 text-blue-600"
                                    />
                                    <span>{option.label}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setPermissionModal(false)}
                                className="px-4 py-2 border rounded hover:bg-gray-100"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={() => handleUpdatePermissions(selectedUser.id, selectedUser.adminPermissions || [])}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                حفظ الصلاحيات
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;