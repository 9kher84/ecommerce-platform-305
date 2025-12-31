import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ShoppingBag, Package, CheckCircle, Star } from 'lucide-react';
import apiService from '../services/apiService';
import { useAuth } from '../hooks/useAuth';

const RatingModal = ({ isOpen, onClose, onSubmit, dealId }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(dealId, rating, comment);
            onClose();
        } catch (error) {
            console.error("Rating error", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full">
                <h3 className="text-xl font-bold mb-4 text-center">قيم البائع</h3>
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-center mb-4 space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className={`focus:outline-none transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            >
                                <Star className="w-8 h-8 fill-current" />
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="w-full border border-gray-300 rounded-md p-2 mb-4 focus:ring-indigo-500 focus:border-indigo-500"
                        rows="3"
                        placeholder="اكتب تعليقك هنا..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        required
                    ></textarea>
                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                        >
                            {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DealRow = ({ deal, onUpdateStatus, onRateClick }) => {
    const statusClasses = {
        processing: 'bg-yellow-100 text-yellow-800', // agreed
        agreed: 'bg-yellow-100 text-yellow-800',
        paid: 'bg-blue-100 text-blue-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800'
    };

    const statusLabels = {
        processing: 'قيد التجهيز',
        agreed: 'تم الاتفاق',
        paid: 'تم الدفع',
        delivered: 'تم التسليم',
        cancelled: 'ملغاة'
    };

    // Buyer confirms delivery only after status is 'paid'
    const showConfirmDelivery = deal.status === 'paid';
    // Buyer rates only after status is 'delivered' AND not rated yet (assuming we check that locally or backend prevents dupes)
    const showRate = deal.status === 'delivered';

    return (
        <tr className="border-b hover:bg-gray-50 transition-colors">
            <td className="p-4 font-semibold">
                <Link to={`/posts/${deal.postId}`} className='text-indigo-600 hover:underline block'>
                    {deal.Post?.title || 'طلب محذوف'}
                </Link>
                <span className="text-xs text-gray-500">#{deal.id}</span>
            </td>
            <td className="p-4 text-gray-700">{deal.Seller?.name || 'غير معروف'}</td>
            <td className="p-4 font-bold text-gray-900">{parseFloat(deal.finalAmount).toFixed(2)} ريال</td>
            <td className="p-4">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[deal.status] || 'bg-gray-100 text-gray-800'}`}>
                    {statusLabels[deal.status] || deal.status}
                </span>
            </td>
            <td className="p-4 text-center">
                {showConfirmDelivery && (
                    <button
                        onClick={() => onUpdateStatus(deal.id, 'delivered')}
                        className="bg-green-600 text-white px-4 py-2 text-xs rounded-lg hover:bg-green-700 shadow-sm transition-all"
                    >
                        تأكيد الاستلام
                    </button>
                )}
                {showRate && (
                    <button
                        onClick={() => onRateClick(deal.id)}
                        className="bg-yellow-500 text-white px-4 py-2 text-xs rounded-lg hover:bg-yellow-600 shadow-sm transition-all flex items-center mx-auto"
                    >
                        <Star className="w-3 h-3 ml-1 fill-current" />
                        قيم البائع
                    </button>
                )}
                {deal.status === 'agreed' && <span className='text-xs text-gray-500 italic'>بانتظار تأكيد الدفع من البائع</span>}
            </td>
        </tr>
    );
};

const BuyerDashboard = () => {
    const { user } = useAuth();
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Rating Modal State
    const [ratingModal, setRatingModal] = useState({ isOpen: false, dealId: null });

    // 1. Fetch Deals
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setLoading(true);
                const dealsRes = await apiService.getDeals();
                // Filter deals where user is buyer (should be handled by backend but good to be safe)
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
        if (!window.confirm(`هل أنت متأكد من تأكيد استلام المنتج؟`)) return;

        try {
            await apiService.updateDealStatus(dealId, newStatus);
            alert(`✅ تم تأكيد الاستلام بنجاح.`);

            setDeals(prevDeals => prevDeals.map(deal =>
                deal.id === dealId ? { ...deal, status: newStatus } : deal
            ));
        } catch (err) {
            console.error('Update status failed:', err);
            alert(`فشل التحديث: ${err.response?.data?.message || 'خطأ غير معروف'}`);
        }
    };

    // 3. Handle Rating
    const handleRateClick = (dealId) => {
        setRatingModal({ isOpen: true, dealId });
    };

    const handleSubmitRating = async (dealId, rating, comment) => {
        try {
            await apiService.createRating(dealId, rating, comment);
            alert('شكراً لك! تم إرسال تقييمك بنجاح.');
            // Optionally hide the rate button locally or mark as rated?
            // For now, just close modal. Backend prevents duplicate ratings so next try will fail.
        } catch (err) {
            console.error('Rating failed:', err);
            alert(`فشل التقييم: ${err.response?.data?.message || 'خطأ غير معروف'}`);
            throw err; // Re-throw to keep modal open or handle inside modal
        }
    };


    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-lg text-indigo-600 mr-3">جاري تحميل لوحة تحكم المشتري...</span>
        </div>
    );

    if (error) return (
        <div className="p-8 text-center bg-red-100 text-red-700 border border-red-400 rounded-md m-4">
            {error}
        </div>
    );

    const activeDealsCount = deals.filter(d => ['agreed', 'paid'].includes(d.status)).length;
    const completedDealsCount = deals.filter(d => d.status === 'delivered').length;

    return (
        <div className="p-4 md:p-8 space-y-8 bg-gray-50 min-h-screen">
            <RatingModal
                isOpen={ratingModal.isOpen}
                onClose={() => setRatingModal({ isOpen: false, dealId: null })}
                dealId={ratingModal.dealId}
                onSubmit={handleSubmitRating}
            />

            <div className="flex flex-col md:flex-row justify-between items-center border-b pb-4">
                <h2 className="text-3xl font-bold text-gray-900">لوحة تحكم المشتري</h2>
                <span className="text-gray-500 mt-2 md:mt-0">مرحباً، {user.name}</span>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white border border-blue-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4 mx-auto">
                        <ShoppingBag className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">{activeDealsCount}</p>
                        <p className="text-sm text-gray-500 mt-1">طلبات قيد التنفيذ</p>
                    </div>
                </div>

                <div className="p-6 bg-white border border-green-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4 mx-auto">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-gray-900">{completedDealsCount}</p>
                        <p className="text-sm text-gray-500 mt-1">طلبات مكتملة</p>
                    </div>
                </div>

                <Link to="/posts/new" className="p-6 bg-indigo-600 rounded-xl shadow-md hover:bg-indigo-700 transition-colors flex flex-col justify-center items-center text-white group">
                    <Package className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xl font-bold">طلب جديد</span>
                    <p className="text-indigo-200 text-sm mt-1">اطلب منتجاً الآن</p>
                </Link>
            </div>

            {/* Deals Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="text-xl font-bold text-gray-800">متابعة الطلبات</h3>
                </div>

                <div className="overflow-x-auto">
                    {deals.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">ليس لديك أي طلبات حالياً.</p>
                            <Link to="/posts/new" className="text-indigo-600 font-semibold hover:underline mt-2 inline-block">
                                ابدأ بإنشاء طلب جديد
                            </Link>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">الطلب</th>
                                    <th className="p-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">البائع</th>
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
                                        onRateClick={handleRateClick}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuyerDashboard;