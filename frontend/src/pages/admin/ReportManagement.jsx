import React, { useState, useEffect } from 'react';
import {
    AlertTriangle,
    CheckCircle,
    XOctagon,
    Loader2,
    List,
    Save,
    X,
    Clock,
    User,
    Package,
    MessageCircle,
    Edit2
} from 'lucide-react';

const API_URL = '/api/reports';

// دالة محاكاة للانتظار
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// دالة مساعدة لعرض الأيقونة بناءً على نوع الكيان
const getEntityIcon = (type) => {
    switch (type) {
        case 'user':
            return <User className="w-4 h-4 text-blue-500" />;
        case 'post':
            return <Package className="w-4 h-4 text-green-500" />;
        case 'deal':
            return <MessageCircle className="w-4 h-4 text-purple-500" />;
        default:
            return <List className="w-4 h-4 text-gray-500" />;
    }
};

// دالة مساعدة لعرض العلامة بناءً على حالة البلاغ
const getStatusBadge = (status) => {
    const baseStyle = "px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full";
    switch (status) {
        case 'pending':
            return <span className={`${baseStyle} bg-yellow-100 text-yellow-800 flex items-center`}><Clock className="w-3 h-3 ml-1" /> قيد المراجعة</span>;
        case 'resolved':
            return <span className={`${baseStyle} bg-green-100 text-green-800 flex items-center`}><CheckCircle className="w-3 h-3 ml-1" /> تم الحل</span>;
        case 'rejected':
            return <span className={`${baseStyle} bg-red-100 text-red-800 flex items-center`}><XOctagon className="w-3 h-3 ml-1" /> مرفوض</span>;
        default:
            return <span className={`${baseStyle} bg-gray-100 text-gray-800`}>{status}</span>;
    }
};

const ReportManagement = () => {
    // حالة قائمة البلاغات (بيانات وهمية)
    const [reports, setReports] = useState([
        { id: 101, entityType: 'user', entityId: 5, reportStatus: 'pending', reason: 'محتوى غير لائق في الملف الشخصي', createdAt: '2025-11-15', reporterId: 3 },
        { id: 102, entityType: 'post', entityId: 23, reportStatus: 'resolved', reason: 'إعلان مكرر', createdAt: '2025-11-14', reporterId: 8 },
        { id: 103, entityType: 'deal', entityId: 45, reportStatus: 'pending', reason: 'تأخير في الدفع', createdAt: '2025-11-16', reporterId: 1 },
        { id: 104, entityType: 'other', entityId: null, reportStatus: 'rejected', reason: 'بلاغ كاذب/غير مفهوم', createdAt: '2025-11-13', reporterId: 6 },
    ]);

    // حالات النظام
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingId, setEditingId] = useState(null);

    // حالات التعديل
    const [editingStatus, setEditingStatus] = useState('');
    const [statusOptions] = useState(['pending', 'resolved', 'rejected']);

    const fetchReports = async () => {
        setIsLoading(true);
        setError(null);
        await delay(500);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const startEditing = (report) => {
        setEditingId(report.id);
        setEditingStatus(report.reportStatus);
        setError(null);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditingStatus('');
    };

    const handleSaveEdit = async (id) => {
        if (!editingStatus.trim()) {
            setError('يجب تحديد حالة للبلاغ.');
            return;
        }

        setIsLoading(true);
        setError(null);
        await delay(800);

        try {
            const updatedReports = reports.map(r =>
                r.id === id ? { ...r, reportStatus: editingStatus.trim() } : r
            );

            setReports(updatedReports);
            cancelEditing();
            alert(`تم تحديث حالة البلاغ #${id} بنجاح (محاكاة).`);
        } catch (err) {
            setError('فشل في تحديث حالة البلاغ. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">

            <div className="max-w-6xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
                        <AlertTriangle className="w-8 h-8 ml-3 text-red-600" />
                        إدارة البلاغات والرقابة
                    </h1>
                    <p className="text-gray-500 mt-2">مراجعة وتصنيف وحل البلاغات المقدمة من المستخدمين حول المنشورات، الصفقات، أو الحسابات.</p>
                </header>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                {/* قائمة البلاغات الحالية */}
                <div className="bg-white p-6 shadow-xl rounded-2xl border border-gray-100">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">
                        البلاغات التي تحتاج إلى مراجعة ({reports.filter(r => r.reportStatus === 'pending').length})
                    </h2>

                    {reports.length === 0 && !isLoading ? (
                        <p className="text-gray-500 p-4 text-center border-2 border-dashed border-gray-200 rounded-lg">لا توجد بلاغات حالياً في النظام.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            معرف البلاغ
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            النوع
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                            الكيان المُبلغ عنه
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            السبب الرئيسي
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
                                    {reports.map((report) => (
                                        <tr key={report.id} className="hover:bg-red-50 transition duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                **#{report.id}**
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                <div className='flex items-center space-x-2 space-x-reverse capitalize'>
                                                    {getEntityIcon(report.entityType)}
                                                    <span className='font-semibold'>{report.entityType === 'user' ? 'مستخدم' : report.entityType === 'post' ? 'منشور' : report.entityType === 'deal' ? 'صفقة' : 'أخرى'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                                                {report.entityId ? `#${report.entityId}` : 'لا يوجد كيان محدد'}
                                            </td>
                                            <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-700" title={report.reason}>
                                                {report.reason}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                                {editingId === report.id ? (
                                                    <select
                                                        value={editingStatus}
                                                        onChange={(e) => setEditingStatus(e.target.value)}
                                                        className="p-2 border border-blue-300 rounded-lg text-sm"
                                                        disabled={isLoading}
                                                    >
                                                        {statusOptions.map(status => (
                                                            <option key={status} value={status}>
                                                                {status === 'pending' ? 'قيد المراجعة' : status === 'resolved' ? 'تم الحل' : 'مرفوض'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    getStatusBadge(report.reportStatus)
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                {editingId === report.id ? (
                                                    <div className="flex justify-center space-x-2 space-x-reverse">
                                                        <button
                                                            onClick={() => handleSaveEdit(report.id)}
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
                                                            onClick={() => startEditing(report)}
                                                            className="text-primary-600 hover:text-primary-800 p-2 rounded-full hover:bg-primary-100 transition duration-150"
                                                            title="مراجعة وتعديل الحالة"
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

export default ReportManagement;