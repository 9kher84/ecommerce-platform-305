import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Loader2, AlertTriangle, CheckCircle, X } from 'lucide-react';
import apiService from '../services/apiService';
import { useAuth } from '../hooks/useAuth';

// ----------------------------------------------------------------------
// مكون فرعي: لعرض صف واحد من العروض
// ----------------------------------------------------------------------
const OfferRow = ({ offer, onAcceptOffer }) => {
    // تنسيق حالة العرض
    const statusClasses = {
        pending: 'bg-yellow-100 text-yellow-800',
        accepted: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };

    // يمكن قبول العرض فقط إذا كانت حالته 'pending'
    const canAccept = offer.status === 'pending';

    return (
        <tr className="border-b hover:bg-gray-50">
            <td className="p-3 font-semibold">{offer.User?.name || 'مجهول'}</td>
            <td className="p-3 text-lg font-bold text-green-700">{parseFloat(offer.amount).toFixed(2)} ريال</td>
            <td className="p-3 text-gray-500">{new Date(offer.createdAt).toLocaleString('ar-EG')}</td>
            <td className="p-3">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClasses[offer.status] || 'bg-gray-100 text-gray-800'}`}>
                    {offer.status === 'pending' ? 'بانتظار الرد' : (offer.status === 'accepted' ? 'تم القبول (صفقة)' : 'مرفوض')}
                </span>
            </td>
            <td className="p-3 text-center">
                {canAccept && (
                    <button
                        onClick={() => onAcceptOffer(offer.id, offer.amount)}
                        className="bg-green-600 text-white px-3 py-1 text-xs rounded hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                        قبول العرض
                    </button>
                )}
                {!canAccept && offer.status === 'accepted' && <span className='text-xs text-green-500'>تمت كصفقة</span>}
                {!canAccept && offer.status === 'rejected' && <span className='text-xs text-red-500'>مرفوض</span>}
            </td>
        </tr>
    );
};

// ----------------------------------------------------------------------
// مكون الإشعار
// ----------------------------------------------------------------------
const Notification = ({ message, type, onClose }) => {
    if (!message) return null;

    const baseStyle = "fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl flex items-center max-w-sm transition-opacity duration-300";
    let colorStyle;
    let Icon;

    switch (type) {
        case 'success':
            colorStyle = "bg-green-500 text-white";
            Icon = CheckCircle;
            break;
        case 'error':
            colorStyle = "bg-red-500 text-white";
            Icon = AlertTriangle;
            break;
        default:
            colorStyle = "bg-blue-500 text-white";
            Icon = AlertTriangle;
    }

    return (
        <div className={`${baseStyle} ${colorStyle}`}>
            <Icon className="w-5 h-5 ml-3" />
            <p className="flex-grow text-sm">{message}</p>
            <button onClick={onClose} className="ml-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

// ----------------------------------------------------------------------
// المكون الرئيسي: إدارة المنشور والعروض
// ----------------------------------------------------------------------
const PostManagement = () => {
    const { id } = useParams(); // جلب معرف المنشور من المسار
    const { user } = useAuth();
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState({ message: '', type: '' });

    const showNotification = (message, type = 'info') => {
        setNotification({ message, type });
        setTimeout(() => setNotification({ message: '', type: '' }), 5000);
    };

    // 1. جلب بيانات المنشور والعروض
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                setLoading(true);

                // جلب تفاصيل المنشور
                const postRes = await apiService.getPostById(id);
                const fetchedPost = postRes.data.post;

                // التحقق من أن البائع هو المالك قبل عرض الصفحة
                if (fetchedPost.sellerId !== user.id) {
                    showNotification('ليس لديك صلاحية لإدارة هذا المنشور.', 'error');
                    setLoading(false);
                    setTimeout(() => navigate('/my-posts'), 2000);
                    return;
                }

                setPost(fetchedPost);

                // جلب العروض الخاصة بالمنشور
                try {
                    const offersRes = await apiService.getPostOffers(id);
                    setOffers(offersRes.data.offers.sort((a, b) => b.amount - a.amount));
                } catch (offerErr) {
                    if (offerErr.response?.status !== 403) {
                        console.error('فشل في جلب العروض:', offerErr);
                    }
                }

            } catch (err) {
                console.error('فشل في جلب بيانات المنشور:', err);
                showNotification(err.response?.data?.message || 'فشل في تحميل بيانات المنشور.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user, navigate]);

    // 2. معالج قبول العرض
    const handleAcceptOffer = async (offerId, amount) => {
        if (!window.confirm(`هل أنت متأكد من قبول العرض بقيمة ${parseFloat(amount).toFixed(2)} ريال وإغلاق المزايدة؟ هذا الإجراء لا يمكن التراجع عنه.`)) return;

        try {
            await apiService.acceptOffer(offerId);

            showNotification('✅ تم قبول العرض بنجاح. تم إنشاء صفقة (Deal) وإغلاق المنشور.', 'success');

            // تحديث حالة العروض محلياً
            setOffers(prevOffers => prevOffers.map(offer =>
                offer.id === offerId
                    ? { ...offer, status: 'accepted' }
                    : { ...offer, status: offer.status === 'pending' ? 'rejected' : offer.status }
            ));

            // تحديث حالة المنشور
            setPost(prevPost => ({ ...prevPost, status: 'sold' }));

        } catch (err) {
            console.error('فشل قبول العرض:', err.response || err);
            showNotification(`فشل قبول العرض: ${err.response?.data?.message || 'خطأ غير معروف.'}`, 'error');
        }
    };


    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <span className="text-lg text-indigo-600 mr-3">جاري تحميل بيانات المنشور...</span>
        </div>
    );

    if (!post) return (
        <div className="p-8 text-center bg-red-100 text-red-700 border border-red-400 rounded-md">
            المنشور المطلوب غير موجود.
        </div>
    );


    // تصنيف العروض
    const activeOffers = offers.filter(o => o.status === 'pending');

    return (
        <div className="p-4 md:p-8 space-y-8">
            <Notification {...notification} onClose={() => setNotification({ message: '', type: '' })} />

            <Link to="/my-posts" className="text-indigo-600 hover:underline mb-4 block">
                &larr; العودة إلى منشوراتي
            </Link>

            {/* تفاصيل المنشور */}
            <div className="bg-white p-6 rounded-lg shadow-lg border-t-4 border-indigo-600">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{post.title}</h1>
                <p className="text-gray-600 mb-4">{post.description}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>سعر البدء:</strong> <span className="text-blue-600">{parseFloat(post.startingPrice).toFixed(2)} ريال</span></p>
                    <p><strong>أعلى عرض حالي:</strong> <span className="text-green-600">{parseFloat(post.currentHighestOffer || post.startingPrice).toFixed(2)} ريال</span></p>
                    <p><strong>تاريخ الانتهاء:</strong> {new Date(post.expiryDate).toLocaleString('ar-EG')}</p>
                    <p>
                        <strong>الحالة:</strong>
                        <span className={`font-semibold ml-2 p-1 rounded ${post.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {post.status === 'active' ? 'نشط' : (post.status === 'sold' ? 'مُباع' : 'منتهي')}
                        </span>
                    </p>
                </div>
            </div>

            {/* تنبيه حالة المنشور */}
            {post.status !== 'active' && (
                <div className={`p-4 rounded-md ${post.status === 'sold' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} font-medium`}>
                    ⚠️ هذا المنشور **{post.status === 'sold' ? 'مُباع' : 'انتهت مدته'}.** لا يمكن قبول أي عروض جديدة.
                </div>
            )}


            {/* قائمة العروض */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-2xl font-bold mb-4 border-b pb-2">جميع العروض ({offers.length})</h3>

                <div className="overflow-x-auto">
                    {offers.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">لا توجد عروض مقدمة بعد.</p>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">المشتري</th>
                                    <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">قيمة العرض</th>
                                    <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">تاريخ العرض</th>
                                    <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase">الحالة</th>
                                    <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {offers.map((offer) => (
                                    <OfferRow
                                        key={offer.id}
                                        offer={offer}
                                        onAcceptOffer={handleAcceptOffer}
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

export default PostManagement;