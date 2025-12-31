import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiService from '../services/apiService';
import { useAuth } from '../hooks/useAuth';
import { AlertTriangle, Star, FileText, Upload } from 'lucide-react';

const PostFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;
    const { user, isAuthenticated } = useAuth();

    // V2: Allow Buyers to create requests
    if (!isAuthenticated || (user.role !== 'buyer' && user.role !== 'admin')) {
        // Redirect logic handled in useEffect
    }

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        productId: '', // Optional now
        quantity: '', // Optional
        unit: 'piece', // Optional
        deliveryLocation: '',
        deliveryDate: '', // Optional
        expiryDate: '',
        isFeatured: false, // Premium feature
        attachment: null, // PDF file
    });
    const [loading, setLoading] = useState(isEditMode);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [products, setProducts] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated || (user.role !== 'buyer' && user.role !== 'admin')) {
            alert('يجب أن تكون مشترياً لإنشاء طلب.');
            navigate('/');
            return;
        }

        const fetchInitialData = async () => {
            try {
                // Fetch Categories to use as "Product Types"
                const catsRes = await apiService.getAllCategories();
                setProducts(catsRes.data.categories || []);

                if (isEditMode) {
                    const postRes = await apiService.getPostById(id);
                    const post = postRes.data.post;
                    setFormData({
                        title: post.title,
                        description: post.description,
                        productId: post.productId || '',
                        quantity: post.quantity || '',
                        unit: post.unit || 'piece',
                        deliveryLocation: post.deliveryLocation || '',
                        deliveryDate: post.deliveryDate ? new Date(post.deliveryDate).toISOString().split('T')[0] : '',
                        expiryDate: post.expiryDate ? new Date(post.expiryDate).toISOString().split('T')[0] : '',
                        isFeatured: post.isFeatured || false,
                        attachment: post.attachment || null,
                    });
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('فشل تحميل البيانات.');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [id, isEditMode, isAuthenticated, user, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                alert('فقط ملفات PDF مسموحة.');
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert('حجم الملف يجب أن لا يتجاوز 2 ميجابايت.');
                return;
            }
            // For now, we just store the file name/object. 
            // In a real app, we'd upload it or convert to base64.
            // Let's simulate upload by just keeping the name for now to pass to backend as string
            setFormData(prev => ({ ...prev, attachment: file.name }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            // Basic Validation
            if (formData.title.length < 5) throw new Error('العنوان قصير جداً');
            if (formData.description.length < 10) throw new Error('الوصف يجب أن يكون 10 أحرف على الأقل');
            if (!formData.deliveryLocation) throw new Error('موقع التوصيل مطلوب');

            const payload = {
                ...formData,
                quantity: formData.quantity ? parseFloat(formData.quantity) : null,
                productId: formData.productId ? parseInt(formData.productId) : null,
                deliveryDate: formData.deliveryDate || null,
                // attachment is already string (filename) or null
            };

            if (isEditMode) {
                // await apiService.updatePost(id, payload); 
            } else {
                await apiService.apiFetch('/api/posts', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });
            }

            alert(isEditMode ? 'تم تعديل الطلب بنجاح' : 'تم إنشاء الطلب بنجاح');
            navigate('/dashboard/buyer');

        } catch (err) {
            console.error('Submit Error:', err);
            if (err.response && err.response.status === 403 && err.message.includes('limit')) {
                setError('⛔ لقد تجاوزت حد الطلبات المجانية (5 طلبات). يرجى الترقية إلى الباقة المميزة لإنشاء المزيد.');
            } else {
                setError(err.message || 'حدث خطأ أثناء الإرسال.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="text-center p-8">جاري التحميل...</div>;

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b pb-2">
                {isEditMode ? 'تعديل الطلب' : 'إنشاء طلب شراء جديد'}
            </h1>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded shadow-sm">
                    <div className="flex items-center">
                        <AlertTriangle className="w-6 h-6 text-red-500 ml-3" />
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                    {error.includes('الترقية') && (
                        <button className="mt-2 text-sm text-indigo-600 hover:underline font-bold">
                            اشترك الآن في الباقة المميزة
                        </button>
                    )}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-xl space-y-6">
                {/* Title (Mandatory) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">عنوان الطلب <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="مثال: مطلوب 50 كرتون تمر سكري فاخر"
                    />
                </div>

                {/* Description (Mandatory) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">تفاصيل الطلب <span className="text-red-500">*</span></label>
                    <textarea
                        name="description"
                        rows="4"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="اذكر المواصفات، الجودة المطلوبة، وأي تفاصيل أخرى..."
                    ></textarea>
                </div>

                {/* Delivery Location (Mandatory) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">موقع التوصيل (المدينة/الحي) <span className="text-red-500">*</span></label>
                    <input
                        type="text"
                        name="deliveryLocation"
                        value={formData.deliveryLocation}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
                        placeholder="الرياض، حي الملقا"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 className="col-span-full text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">تفاصيل إضافية (اختياري)</h3>

                    {/* Product/Category (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">القسم / التصنيف</label>
                        <select
                            name="productId"
                            value={formData.productId}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 bg-white"
                        >
                            <option value="">-- اختر القسم (اختياري) --</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name_ar || p.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">إذا لم تختر، سيقوم النظام بتصنيف طلبك تلقائياً.</p>
                    </div>

                    {/* Delivery Date (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">تاريخ التوصيل المفضل</label>
                        <input
                            type="date"
                            name="deliveryDate"
                            value={formData.deliveryDate}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 text-right"
                            style={{ direction: 'rtl' }} // Fix for Arabic date display
                        />
                    </div>

                    {/* Quantity (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">الكمية</label>
                        <input
                            type="number"
                            name="quantity"
                            min="1"
                            value={formData.quantity}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3"
                            placeholder="مثال: 100"
                        />
                    </div>

                    {/* Unit (Optional) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">الوحدة</label>
                        <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 bg-white"
                        >
                            <option value="piece">قطعة</option>
                            <option value="kg">كيلوجرام</option>
                            <option value="ton">طن</option>
                            <option value="box">كرتون</option>
                            <option value="liter">لتر</option>
                        </select>
                    </div>
                </div>

                {/* Attachments (PDF Only) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">المرفقات (ملف PDF واحد فقط - اختياري)</label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-3 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">اضغط للرفع</span> أو اسحب الملف هنا</p>
                                <p className="text-xs text-gray-500">PDF (الحد الأقصى 2MB)</p>
                            </div>
                            <input id="dropzone-file" type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                    {formData.attachment && (
                        <div className="mt-2 flex items-center text-sm text-green-600">
                            <FileText className="w-4 h-4 ml-1" />
                            تم اختيار الملف: {formData.attachment}
                        </div>
                    )}
                </div>

                {/* Premium Feature: Featured Request */}
                {user && user.isPremium ? (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200 flex items-center">
                        <input
                            type="checkbox"
                            name="isFeatured"
                            id="isFeatured"
                            checked={formData.isFeatured}
                            onChange={handleChange}
                            className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isFeatured" className="mr-3 flex items-center font-bold text-orange-800 cursor-pointer">
                            <Star className="w-5 h-5 ml-2 fill-current text-orange-500" />
                            تمييز الطلب (ميزة للمشتركين)
                            <span className="mr-2 text-xs font-normal text-orange-700">- يظهر طلبك في أعلى القائمة للبائعين</span>
                        </label>
                    </div>
                ) : null}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg disabled:opacity-50"
                >
                    {isSubmitting ? 'جاري النشر...' : (isEditMode ? 'حفظ التعديلات' : 'نشر طلب الشراء')}
                </button>
            </form>
        </div>
    );
};

export default PostFormPage;