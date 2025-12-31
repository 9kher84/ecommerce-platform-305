import React, { useState, useEffect } from 'react';
import {
    Package,
    Edit2,
    Save,
    X,
    CheckCircle,
    Clock,
    XCircle
} from 'lucide-react';

const API_URL = '/api/deals';

// دالة محاكاة للانتظار
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// دالة مساعدة لعرض العلامة بناءً على حالة الصفقة
const getStatusBadge = (status) => {
    const baseStyle = "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full";
    switch (status) {
        case 'pending':
            return <span className={`${baseStyle} bg-yellow-100 text-yellow-800 flex items-center`}><Clock className="w-3 h-3 ml-1" /> بانتظار الرد</span>;
        case 'processing':
            return <span className={`${baseStyle} bg-blue-100 text-blue-800 flex items-center`}><Clock className="w-3 h-3 ml-1" /> قيد التنفيذ</span>;
        case 'completed':
            return <span className={`${baseStyle} bg-green-100 text-green-800 flex items-center`}><CheckCircle className="w-3 h-3 ml-1" /> مكتملة</span>;
        case 'cancelled':
            return <span className={`${baseStyle} bg-red-100 text-red-800 flex items-center`}><XCircle className="w-3 h-3 ml-1" /> ملغاة</span>;
        default:
            return <span className={`${baseStyle} bg-gray-100 text-gray-800`}>{status}</span>;
    }
};

const DealManagement = () => {
    // حالة قائمة الصفقات (بيانات وهمية)
    const [deals, setDeals] = useState([
        { id: 1, postId: 101, buyerId: 5, sellerId: 8, amount: 1500.00, dealStatus: 'pending' },
        { id: 2, postId: 102, buyerId: 3, sellerId: 12, amount: 2300.50, dealStatus: 'processing' },
        { id: 3, postId: 103, buyerId: 7, sellerId: 1, amount: 800.00, dealStatus: 'completed' },
    ]);

    // حالات النظام
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);

    // حالات التعديل
    const [editingStatus, setEditingStatus] = useState('');
    const [statusOptions] = useState(['pending', 'processing', 'completed', 'cancelled']);

    const fetchDeals = async () => {
        setIsLoading(true);
        setError(null);
        await delay(500);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchDeals();
    }, []);

    const startEditing = (deal) => {
        setEditingId(deal.id);
        setEditingStatus(deal.dealStatus);
        setError(null);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingStatus('');
    };

    const handleSaveEdit = async (id) => {
        if (!editingStatus.trim()) {
            setError('يجب تحديد حالة للصفقة.');
            return;
        }

        setIsLoading(true);
        setError(null);
        await delay(800);

        try {
            const updatedDeals = deals.map(d =>
                d.id === id ? { ...d, dealStatus: editingStatus.trim() } : d
            );

            setDeals(updatedDeals);
            cancelEditing();
            alert(`تم تحديث حالة الصفقة #${id} إلى ${editingStatus} (محاكاة).`);
        } catch (err) {
            setError('فشل في تحديث حالة الصفقة. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
                        <Package className="w-8 h-8 ml-3 text-primary-600" />
                        إدارة الصفقات والتعاملات
                    </h1>
                    <p className="text-gray-500 mt-2">مراجعة الصفقات النشطة (العروض المقبولة) وإدارة حالتها يدوياً في حالات الضرورة أو النزاع.</p>
                </header>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {/* قائمة الصفقات الحالية */}
                <div className="bg-white p-6 shadow-xl rounded-2xl border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                        الصفقات النشطة ({deals.filter(d => d.dealStatus === 'pending' || d.dealStatus === 'processing').length})
                    </h2>

                    {deals.length === 0 && !isLoading ? (
                        <p className="text-gray-500 p-4 text-center border-2 border-dashed border-gray-200 rounded-lg">لا توجد صفقات حالياً في النظام.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            معرف الصفقة
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            المبلغ
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                            المشتري/البائع
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            معرف المنشور
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            الحالة
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            الإجراءات
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {deals.map((deal) => (
                                        <tr key={deal.id} className="hover:bg-primary-50 transition duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                **#{deal.id}**
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700">
                                                {deal.amount.toFixed(2)} ر.س
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 hidden sm:table-cell">
                                                <div className='flex flex-col text-xs'>
                                                    <span>المشتري: #{deal.buyerId}</span>
                                                    <span className='text-gray-500'>البائع: #{deal.sellerId}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <a href={`/posts/${deal.postId}`} className='text-primary-600 hover:underline'>#{deal.postId}</a>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                {editingId === deal.id ? (
                                                    <select
                                                        value={editingStatus}
                                                        onChange={(e) => setEditingStatus(e.target.value)}
                                                        className="p-2 border border-blue-300 rounded-lg text-sm"
                                                        disabled={isLoading}
                                                    >
                                                        {statusOptions.map(status => (
                                                            <option key={status} value={status}>
                                                                {status === 'pending' ? 'بانتظار الرد' : status === 'processing' ? 'قيد التنفيذ' : status === 'completed' ? 'مكتملة' : 'مرفوضة/ملغاة'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    getStatusBadge(deal.dealStatus)
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                {editingId === deal.id ? (
                                                    <div className="flex justify-center space-x-2 space-x-reverse">
                                                        <button
                                                            onClick={() => handleSaveEdit(deal.id)}
                                                            className="text-white bg-green-500 hover:bg-green-600 p-2 rounded-full shadow-md transition duration-150"
                                                            title="حفظ التعديلات"
                                                            disabled={isLoading}
                                                        >
                                                            <Save className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={cancelEditing}
                                                            className="text-white bg-red-500 hover:bg-red-600 p-2 rounded-full shadow-md transition duration-150"
                                                            title="إلغاء التعديل"
                                                            disabled={isLoading}
                                                        >
                                                            <X className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-center space-x-2 space-x-reverse">
                                                        <button
                                                            onClick={() => startEditing(deal)}
                                                            className="text-primary-600 hover:text-primary-800 p-2 rounded-full hover:bg-primary-100 transition duration-150"
                                                            title="تعديل حالة الصفقة"
                                                            disabled={isLoading}
                                                        >
                                                            <Edit2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <footer className="mt-8 text-center text-xs text-gray-400">
                    <p>لوحة تحكم المسؤول - الإصدار 1.0</p>
                </footer>
            </div>
        </div>
    );
};

export default DealManagement;