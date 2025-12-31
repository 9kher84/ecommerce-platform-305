import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, TrendingUp, Package, DollarSign, CheckCircle } from 'lucide-react';
import apiService from '../services/apiService';
import { useAuth } from '../hooks/useAuth';

const DealRow = ({ deal, onUpdateStatus }) => {
    const statusClasses = {
        processing: 'bg-yellow-100 text-yellow-800',
        agreed: 'bg-yellow-100 text-yellow-800',
        paid: 'bg-blue-100 text-blue-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
    };

    const statusLabels = {
        processing: 'قيد التجهيز',
        agreed: 'بانتظار الدفع',
        paid: 'تم الدفع',
        delivered: 'تم التسليم',
        cancelled: 'ملغاة'
    };

    // Seller confirms payment when status is 'agreed'
    const showConfirmPayment = deal.status === 'agreed';

    return (
        <tr className="border-b hover:bg-gray-50 transition-colors">
            <td className="p-4 font-semibold">
                <Link to={`/posts/${deal.postId}`} className='text-indigo-600 hover:underline block'>
                    {deal.Post?.title || 'طلب محذوف'}
                </Link>
                <span className="text-xs text-gray-500">#{deal.id}</span>
            </td>
            <td className="p-4 text-gray-700">{deal.Buyer?.name || 'غير معروف'}</td>
            <td className="p-4 font-bold text-gray-900">{parseFloat(deal.finalAmount).toFixed(2)} ريال</td>
            <td className="p-4">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[deal.status] || 'bg-gray-100 text-gray-800'}`}>
                    {statusLabels[deal.status] || deal.status}
                </span>
            </td>
            <td className="p-4 text-center">
                {showConfirmPayment ? (
                    <button
                        onClick={() => onUpdateStatus(deal.id, 'paid')}
                        className="bg-blue-600 text-white px-4 py-2 text-xs rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                    >
                        تأكيد استلام الدفع
                    </button>
                ) : (
                    <span className="text-xs text-gray-400">-</span>
                )}
            </td>
        </tr>
    );
};

const SellerDashboard = () => {
    const { user } = useAuth();
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Fetch Deals
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const dealsRes = await apiService.getDeals();
                // Backend should filter deals where user is seller
                setDeals(dealsRes.data.deals || []);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
                setError('فشل في تحميل البيانات');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // 2. Handle Status Update
    const handleUpdateDealStatus = async (dealId, newStatus) => {
        if (!window.confirm(`هل أنت متأكد من تأكيد استلام المبلغ؟`)) return;

        try {
            await apiService.updateDealStatus(dealId, newStatus);
            alert(`✅ تم تأكيد الدفع بنجاح. يرجى تجهيز الطلب للتسليم.`);

            setDeals(prevDeals => prevDeals.map(deal =>
                deal.id === dealId ? { ...deal, status: newStatus } : deal
            ));
        } catch (err) {
            console.error('Update status failed:', err);
            alert(`فشل التحديث: ${err.response?.data?.message || 'خطأ غير معروف'}`);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-lg text-indigo-600 mr-3">جاري تحميل لوحة تحكم البائع...</span>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center bg-red-100 text-red-700 border border-red-400 rounded-md m-4">
            {error}
        </div>
    );

    // Calculate Stats
    const totalSales = deals
        .filter(d => ['paid', 'delivered'].includes(d.status))
        .reduce((sum, d) => sum + parseFloat(d.finalAmount), 0);
    <DollarSign className="w-6 h-6 text-green-600" />
                    </div >
    <div className="text-center">
        <p className="text-3xl font-bold text-gray-900">{totalSales.toFixed(2)} ريال</p>
        <p className="text-sm text-gray-500 mt-1">إجمالي المبيعات</p>
    </div>
                </div >

                <div className="p-6 bg-white border border-blue-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4 mx-auto">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">{activeDealsCount}</p>
                        <p className="text-sm text-gray-500 mt-1">صفقات نشطة</p>
                    </div>
                </div>

                <div className="p-6 bg-white border border-indigo-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center w-12 h-12 bg-indigo-100 rounded-full mb-4 mx-auto">
                        <CheckCircle className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">{completedDealsCount}</p>
                        <p className="text-sm text-gray-500 mt-1">صفقات مكتملة</p>
                    </div>
                </div>
            </div >

    {/* Deals Table */ }
    < div className = "bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200" >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800">إدارة المبيعات</h3>
                    <Link to="/posts" className="text-indigo-600 text-sm font-semibold hover:underline">
                        تصفح الطلبات الجديدة
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    {deals.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">لا توجد مبيعات حتى الآن.</p>
                            <Link to="/posts" className="text-indigo-600 font-semibold hover:underline mt-2 inline-block">
                                تصفح طلبات المشترين
                            </Link>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">الطلب</th>
                                    <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">المشتري</th>
                                    <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">المبلغ</th>
                                    <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">الحالة</th>
                                    <th className="p-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {deals.map((deal) => (
                                    <DealRow
                                        key={deal.id}
                                        deal={deal}
                                        onUpdateStatus={handleUpdateDealStatus}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div >
        </div >
    );
};

export default SellerDashboard;