import React from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { Button } from '../../components/common/Button';
import { useBuyerStats, useSellerStats } from '../../hooks/queries/dashboardQueries';
import { BuyerProjectsList } from '../../components/dashboard/BuyerProjectsList';
import { PendingActions } from '../../components/dashboard/PendingActions';
import { MatchRadar } from './MatchRadar';

export const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = React.useState('stats');

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

        {/* Pending Actions for Buyers */}
        {user?.role === 'buyer' && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">إجراءات تحتاج قرارك</h3>
            <PendingActions />
          </div>
        )}
        
        {user?.role === 'buyer' && (
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
            <button
              className={`py-2 px-4 font-medium text-sm focus:outline-none whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('stats')}
            >
              الإحصائيات
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm focus:outline-none whitespace-nowrap ${
                activeTab === 'active_projects'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('active_projects')}
            >
              المشاريع النشطة
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm focus:outline-none whitespace-nowrap ${
                activeTab === 'drafts'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('drafts')}
            >
              المسودات (Drafts)
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm focus:outline-none whitespace-nowrap ${
                activeTab === 'completed'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('completed')}
            >
              المشاريع المكتملة
            </button>
          </div>
        )}

        {user?.role === 'seller' && (
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                activeTab === 'stats'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('stats')}
            >
              الإحصائيات والأداء
            </button>
            <button
              className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                activeTab === 'match_radar'
                  ? 'border-b-2 border-indigo-500 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('match_radar')}
            >
              الفرص والمطابقات
            </button>
          </div>
        )}

        {activeTab === 'stats' && <DashboardStats role={user?.role} />}
        {activeTab === 'active_projects' && user?.role === 'buyer' && <BuyerProjectsList statusFilter="active" />}
        {activeTab === 'drafts' && user?.role === 'buyer' && <BuyerProjectsList statusFilter="draft" />}
        {activeTab === 'completed' && user?.role === 'buyer' && <BuyerProjectsList statusFilter="completed" />}
        {activeTab === 'match_radar' && user?.role === 'seller' && <MatchRadar />}
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
          <p className="text-2xl font-bold text-gray-900">{stats?.avgQuotePrice || 0} ريال</p>
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
