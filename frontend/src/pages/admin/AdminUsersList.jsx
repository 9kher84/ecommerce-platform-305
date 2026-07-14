import React, { useState } from 'react';
import { useAdminUsers, useToggleUserStatus } from '../../hooks/queries/adminQueries';

export const AdminUsersList = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Keep a local state for the debounced search to avoid querying on every keystroke
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Simple debounce logic
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(handler);
  }, [search]);

  const { data, isLoading, isError, error } = useAdminUsers({
    page,
    limit,
    search: debouncedSearch,
    role: roleFilter,
    isActive: statusFilter
  });

  const toggleMutation = useToggleUserStatus();

  const handleToggleStatus = (userId, currentStatus) => {
    if (window.confirm(`هل أنت متأكد من تغيير حالة هذا المستخدم؟`)) {
      toggleMutation.mutate({ userId, isActive: !currentStatus });
    }
  };

  const users = data?.data || [];
  const pagination = data?.pagination || { totalPages: 1, total: 0 };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
          <p className="text-sm text-gray-500 mt-1">إجمالي المستخدمين: {pagination.total}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="ابحث بالاسم أو الإيميل..."
          className="border rounded px-3 py-2 flex-grow focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // reset to first page on search
          }}
        />
        <select
          className="border rounded px-3 py-2 outline-none"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">جميع الأدوار</option>
          <option value="buyer">مشتري</option>
          <option value="seller">مورد</option>
        </select>
        <select
          className="border rounded px-3 py-2 outline-none"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="">جميع الحالات</option>
          <option value="true">نشط</option>
          <option value="false">موقوف</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">البريد الإلكتروني</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الدور</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ التسجيل</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  <div className="flex justify-center my-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-red-600">
                  خطأ: {error?.message}
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  لا يوجد مستخدمين مطابقين للبحث.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'buyer' ? 'bg-indigo-100 text-indigo-800' : 'bg-purple-100 text-purple-800'}`}>
                      {user.role === 'buyer' ? 'مشتري' : 'مورد'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.isActive ? 'نشط' : 'موقوف'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleToggleStatus(user.id, user.isActive)}
                      disabled={toggleMutation.isLoading}
                      className={`text-sm focus:outline-none ${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                    >
                      {user.isActive ? 'إيقاف الحساب' : 'تفعيل الحساب'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2 space-x-reverse">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            السابق
          </button>
          <span className="px-4 py-2 text-sm text-gray-700">
            صفحة {page} من {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border rounded text-sm disabled:opacity-50 hover:bg-gray-50"
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
};
