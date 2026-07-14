import React from 'react';
import { useAdminStats } from '../../hooks/queries/adminQueries';

export const AdminDashboard = () => {
  const { data, isLoading, isError, error } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        خطأ في تحميل الإحصائيات: {error?.message}
      </div>
    );
  }

  const stats = data?.data || {};

  const StatCard = ({ title, value, colorClass }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center justify-center">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <p className={`text-3xl font-bold ${colorClass}`}>{value || 0}</p>
    </div>
  );

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لوحة تحكم الإدارة</h1>
        <p className="text-sm text-gray-500 mt-1">نظرة عامة على أداء المنصة والمستخدمين</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Users" value={stats.totalUsers} colorClass="text-blue-600" />
        <StatCard title="Active Users" value={stats.activeUsers} colorClass="text-green-600" />
        <StatCard title="Total Buyers" value={stats.totalBuyers} colorClass="text-indigo-600" />
        <StatCard title="Total Sellers" value={stats.totalSellers} colorClass="text-purple-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <StatCard title="Published RFQs" value={stats.publishedRFQs} colorClass="text-teal-600" />
        <StatCard title="Draft RFQs" value={stats.draftRFQs} colorClass="text-gray-600" />
        <StatCard title="Total Quotes" value={stats.totalQuotes} colorClass="text-orange-600" />
        <StatCard title="Active Deals" value={stats.activeDeals} colorClass="text-blue-500" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <StatCard title="Closed Deals" value={stats.closedDeals} colorClass="text-green-700" />
      </div>
    </div>
  );
};
