import React, { useState } from 'react';
import { useCategories } from '../../hooks/queries/entityQueries';

export const RequestForm = ({ formData, setFormData, isPreview = false }) => {
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data?.categories || [];
  
  const [dateMode, setDateMode] = useState('simple'); // simple, tender

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  if (isPreview) {
    return (
      <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 text-right" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2 pb-4 border-b">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{formData.title || 'بدون عنوان'}</h3>
            <p className="text-sm font-semibold inline-block px-3 py-1 rounded-full bg-red-100 text-red-800">
              {formData.tender_type === 'PUBLIC' ? 'مناقصة عامة' : formData.tender_type === 'PRIVATE' ? 'مناقصة خاصة' : 'مناقصة بالدعوة'}
            </p>
          </div>
          
          <div className="md:col-span-2">
            <span className="block text-sm font-semibold text-gray-500 mb-1">المواصفات الفنية:</span>
            <p className="text-gray-900 whitespace-pre-wrap">{formData.description || 'لم يتم إدخال مواصفات'}</p>
          </div>

          <div>
            <span className="block text-sm font-semibold text-gray-500 mb-1">القطاع / التصنيف:</span>
            <p className="text-gray-900 font-medium">
              {categories.find(c => c.id.toString() === formData.sectorId?.toString())?.name_ar || formData.sectorId || 'غير محدد'}
            </p>
          </div>

          <div>
            <span className="block text-sm font-semibold text-gray-500 mb-1">الكمية والوحدة:</span>
            <p className="text-gray-900 font-medium">
              {formData.quantity || 0} {formData.unit || ''}
            </p>
          </div>

          <div>
            <span className="block text-sm font-semibold text-gray-500 mb-1">تاريخ التسليم:</span>
            <p className="text-gray-900 font-medium">{formData.delivery_date || 'غير محدد'}</p>
          </div>

          <div>
            <span className="block text-sm font-semibold text-gray-500 mb-1">نهاية العروض (Deadline):</span>
            <p className="text-gray-900 font-medium">{formData.expiresAt || 'غير محدد'}</p>
          </div>

          <div>
            <span className="block text-sm font-semibold text-gray-500 mb-1">طريقة التسعير:</span>
            <p className="text-gray-900 font-medium">
              {formData.pricing_method === 'OPEN' ? 'تسعير مفتوح (يحدد المورد السعر)' : `ميزانية محددة (${formData.fixed_price || 0} ريال سعودي)`}
            </p>
          </div>

          <div className="md:col-span-2 bg-gray-50 p-4 rounded-md">
            <span className="block text-sm font-semibold text-gray-500 mb-1">موقع التسليم:</span>
            <p className="text-gray-900 font-medium">{formData.project_address || 'غير محدد'}</p>
            <p className="text-xs text-indigo-600 mt-2">🔒 لن يتم عرض هذا الموقع للموردين حتى يتم قبول عرضهم وترسية الطلب عليهم.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. نوع المناقصة - Optional Choice, Neutral Styling */}
      <div className="p-4 border border-gray-200 bg-white rounded-lg">
        <label className="block text-sm font-bold text-gray-700 mb-2">نوع المناقصة (اختياري)</label>
        <select
          name="tender_type"
          value={formData.tender_type || 'PUBLIC'}
          onChange={handleChange}
          className="w-full p-2.5 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        >
          <option value="PUBLIC">عامة (مفتوحة لجميع الموردين في السوق)</option>
          <option value="PRIVATE">خاصة (تتطلب موافقة للبائع قبل تقديم عرض)</option>
          <option value="INVITATION" className="hidden">بالدعوة (مخفي حالياً)</option>
        </select>
        <p className="text-xs text-gray-500 mt-2">نوع المناقصة يحدد من يمكنه رؤية طلبك وتقديم العروض (الافتراضي: عامة).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border border-gray-200 p-6 rounded-lg bg-white">
        
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-1">عنوان الطلب*</label>
          <input
            type="text"
            name="title"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2.5 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="مثال: توريد 50 جهاز حاسب آلي بمواصفات متقدمة"
          />
        </div>

        {/* Category */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-1">القطاع / التصنيف*</label>
          <select
            name="sectorId"
            value={formData.sectorId || ''}
            onChange={handleChange}
            className="w-full p-2.5 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="" disabled>اختر التصنيف المناسب لطلبك...</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name_ar}</option>
            ))}
          </select>
        </div>

        {/* Technical Specs */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-gray-700 mb-1">المواصفات الفنية (اختياري)</label>
          <textarea
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2.5 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="يرجى كتابة المواصفات الفنية التفصيلية للطلب..."
          />
        </div>

        {/* Quantity & Unit */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">الكمية*</label>
          <input
            type="number"
            name="quantity"
            required
            min="1"
            value={formData.quantity}
            onChange={handleChange}
            className="w-full p-2.5 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="مثال: 50"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-1">الوحدة (اختياري)</label>
          <input
            type="text"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            className="w-full p-2.5 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="مثال: جهاز, طن, حبة"
          />
        </div>
      </div>

      {/* Location */}
      <div className="border border-gray-200 p-6 rounded-lg bg-white">
        <h4 className="text-lg font-bold text-gray-900 mb-4">موقع التسليم</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">تفاصيل الموقع</label>
            <input
              type="text"
              name="project_address"
              value={formData.project_address}
              onChange={handleChange}
              className="w-full p-2.5 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="مثال: الرياض، حي الحمراء، أو الصق رابط خرائط جوجل هنا، أو إحداثيات (24.77, 46.73)"
            />
          </div>
          <div className="bg-indigo-50 p-3 rounded text-sm text-indigo-800 flex items-start gap-2">
            <span className="text-xl">🔒</span>
            <p><strong>السرية مضمونة:</strong> لن يتم عرض تفاصيل موقع التسليم للموردين. سيتم الكشف عنه فقط للمورد الفائز بعد قبول العرض.</p>
          </div>
        </div>
      </div>

      {/* Dates */}
      <div className="border border-gray-200 p-6 rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-bold text-gray-900">المواعيد والتواريخ</h4>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDateMode('simple')}
              className={`px-3 py-1 text-sm rounded ${dateMode === 'simple' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              الوضع المبسط
            </button>
            <button
              type="button"
              onClick={() => setDateMode('tender')}
              className={`px-3 py-1 text-sm rounded ${dateMode === 'tender' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              وضع المناقصات
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dateMode === 'simple' ? (
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ التسليم المطلوب</label>
              <input
                type="date"
                name="delivery_date"
                value={formData.delivery_date}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 text-left"
                dir="ltr"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">نهاية استقبال العروض</label>
                <input
                  type="date"
                  name="expiresAt"
                  value={formData.expiresAt}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ التسليم المطلوب</label>
                <input
                  type="date"
                  name="delivery_date"
                  value={formData.delivery_date}
                  onChange={handleChange}
                  className="w-full p-2.5 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 text-left"
                  dir="ltr"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pricing */}
      <div className="border border-gray-200 p-6 rounded-lg bg-white">
        <h4 className="text-lg font-bold text-gray-900 mb-4">طريقة التسعير</h4>
        <div className="space-y-4">
          <label className={`flex items-start p-4 border rounded cursor-pointer transition-colors ${formData.pricing_method === 'OPEN' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <input type="radio" name="pricing_method" value="OPEN" checked={formData.pricing_method === 'OPEN' || !formData.pricing_method} onChange={handleChange} className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
            <div className="mr-3">
              <span className="block text-sm font-bold text-gray-900">تسعير مفتوح (Open Pricing)</span>
              <span className="block text-sm text-gray-500 mt-1">يُسمح للموردين بتقديم أفضل أسعارهم التنافسية. هذا هو الخيار الموصى به للحصول على أفضل التخفيضات.</span>
            </div>
          </label>
          <label className={`flex items-start p-4 border rounded cursor-pointer transition-colors ${formData.pricing_method === 'FIXED_BUDGET' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:bg-gray-50'}`}>
            <input type="radio" name="pricing_method" value="FIXED_BUDGET" checked={formData.pricing_method === 'FIXED_BUDGET'} onChange={handleChange} className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
            <div className="mr-3 w-full">
              <span className="block text-sm font-bold text-gray-900">ميزانية محددة (Maximum Budget)</span>
              <span className="block text-sm text-gray-500 mt-1 mb-2">تحديد سقف أعلى للميزانية. لا يمكن للموردين تقديم عروض تتجاوز هذا السقف.</span>
              {formData.pricing_method === 'FIXED_BUDGET' && (
                <div className="mt-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1">الميزانية القصوى (ريال سعودي)*</label>
                  <input
                    type="number"
                    name="fixed_price"
                    required
                    min="1"
                    placeholder="مثال: 50000"
                    value={formData.fixed_price || ''}
                    onChange={handleChange}
                    className="w-full md:w-1/2 p-2 border border-indigo-300 rounded focus:ring-indigo-500 bg-white"
                  />
                </div>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* Attachments UI (Skeleton) */}
      <div className="border border-gray-200 p-6 rounded-lg bg-white">
        <h4 className="text-lg font-bold text-gray-900 mb-2">المرفقات</h4>
        <p className="text-sm text-gray-500 mb-4">ارفع الملفات الداعمة، كراسة الشروط، المخططات، أو جداول الكميات (PDF, Excel, Word).</p>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
          <span className="text-gray-400 text-3xl mb-2 block">📄</span>
          <span className="text-gray-600 font-medium">إسحب وأفلت الملفات هنا، أو انقر للاختيار</span>
        </div>
        <div className="mt-3 bg-blue-50 p-3 rounded flex items-start gap-2">
          <span className="text-blue-600 mt-0.5">🤖</span>
          <p className="text-sm text-blue-800">
            <strong>نظام الفحص الذكي:</strong> سيتم فحص جميع المرفقات بواسطة الذكاء الاصطناعي لحذف (أرقام الجوال، البريد، الروابط، وأسماء جهات الاتصال) لضمان حماية هويتك قبل عرضها للموردين.
          </p>
        </div>
      </div>
      
    </div>
  );
};
