import React from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { Button } from '../../components/common/Button';
import { useBuyerStats, useSellerStats } from '../../hooks/queries/dashboardQueries';

export const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
          <Button onClick={logout} variant="secondary">
            تسجيل الخروج
          </Button>
        </div>
        
        <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4 mb-6">
          <h2 className="text-lg font-medium text-indigo-900 mb-2">مرحباً بك، {user?.name}</h2>
          <p className="text-indigo-700">
            أنت مسجل الدخول بصلاحية: <span className="font-bold">{user?.role}</span>
          </p>
          <p className="text-indigo-700">
            البريد الإلكتروني: {user?.email}
          </p>
        </div>
        
        <DashboardStats role={user?.role} />
      </div>
    </div>
  );
};

const DashboardStats = ({ role }) => {
  const buyerQuery = useBuyerStats();
  const sellerQuery = useSellerStats();

  if (role === 'buyer' && buyerQuery.data) {
    const stats = buyerQuery.data.stats;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border rounded shadow-sm">
          <h3 className="text-gray-500 text-sm">متوسط السعر</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.avgQuotePrice || 0}</p>
        </div>
        <div className="bg-white p-4 border rounded shadow-sm">
          <h3 className="text-gray-500 text-sm">الموردين الفريدين</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.uniqueSuppliers || 0}</p>
        </div>
        <div className="bg-white p-4 border rounded shadow-sm">
          <h3 className="text-gray-500 text-sm">نسبة القبول</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.acceptanceRate || '0%'}</p>
        </div>
      </div>
    );
  }

  if (role === 'seller' && sellerQuery.data) {
    const stats = sellerQuery.data.stats;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 border rounded shadow-sm">
          <h3 className="text-gray-500 text-sm">إجمالي العروض</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.totalQuotes || 0}</p>
        </div>
        <div className="bg-white p-4 border rounded shadow-sm">
          <h3 className="text-gray-500 text-sm">العروض المقبولة</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.acceptedQuotes || 0}</p>
        </div>
        <div className="bg-white p-4 border rounded shadow-sm">
          <h3 className="text-gray-500 text-sm">معدل الفوز</h3>
          <p className="text-2xl font-bold text-gray-900">{stats?.winRate || '0%'}</p>
        </div>
      </div>
    );
  }

  return null;
};
