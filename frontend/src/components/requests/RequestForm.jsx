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

  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [tempSecondValue, setTempSecondValue] = useState('');

  const startEditing = (fieldName, initialVal, initialSecondVal = '') => {
    setEditingField(fieldName);
    setTempValue(initialVal || '');
    setTempSecondValue(initialSecondVal || '');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setTempValue('');
    setTempSecondValue('');
  };

  const saveEditing = (fieldName) => {
    if (fieldName === 'title' && !tempValue.trim()) return;
    if (fieldName === 'quantity' && (isNaN(parseFloat(tempValue)) || parseFloat(tempValue) <= 0)) return;

    if (fieldName === 'quantityUnit') {
      setFormData(prev => ({ ...prev, quantity: tempValue, unit: tempSecondValue }));
    } else if (fieldName === 'pricing') {
      setFormData(prev => ({ ...prev, pricing_method: tempValue, fixed_price: tempValue === 'FIXED_BUDGET' ? tempSecondValue : '' }));
    } else {
      setFormData(prev => ({ ...prev, [fieldName]: tempValue }));
    }
    setEditingField(null);
  };

  if (isPreview) {
    return (
      <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 text-right shadow-sm" dir="rtl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Title & Tender Type */}
          <div className="md:col-span-2 pb-4 border-b">
            {editingField === 'title' ? (
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  className="flex-1 p-2 border border-indigo-400 rounded-lg text-lg font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => saveEditing('title')}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold text-gray-900">{formData.title || 'بدون عنوان'}</h3>
                  <button
                    type="button"
                    onClick={() => startEditing('title', formData.title)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md border border-indigo-200 transition flex items-center gap-1"
                  >
                    <span>✎</span> تعديل
                  </button>
                </div>
                <span className="text-xs font-semibold inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                  {formData.tender_type === 'PUBLIC' ? 'مناقصة عامة' : formData.tender_type === 'PRIVATE' ? 'مناقصة خاصة' : 'مناقصة بالدعوة'}
                </span>
              </div>
            )}
          </div>

          {/* 2. Technical Description */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <span className="block text-sm font-semibold text-gray-500">المواصفات الفنية:</span>
              {editingField !== 'description' && (
                <button
                  type="button"
                  onClick={() => startEditing('description', formData.description)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition"
                >
                  ✎ تعديل
                </button>
              )}
            </div>
            {editingField === 'description' ? (
              <div className="space-y-2">
                <textarea
                  rows="3"
                  className="w-full p-2.5 border border-indigo-400 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => saveEditing('description')}
                    className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition"
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold hover:bg-gray-200 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">{formData.description || 'لم يتم إدخال مواصفات'}</p>
            )}
          </div>

          {/* 3. Sector / Category */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="block text-sm font-semibold text-gray-500">القطاع / التصنيف:</span>
              {editingField !== 'sectorId' && (
                <button
                  type="button"
                  onClick={() => startEditing('sectorId', formData.sectorId)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition"
                >
                  ✎ تعديل
                </button>
              )}
            </div>
            {editingField === 'sectorId' ? (
              <div className="flex items-center gap-2">
                <select
                  className="flex-1 p-2 border border-indigo-400 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  autoFocus
                >
                  <option value="">اختر القطاع...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name_ar || cat.name_en}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => saveEditing('sectorId')}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <p className="text-gray-900 font-medium">
                {categories.find(c => c.id.toString() === formData.sectorId?.toString())?.name_ar || formData.sectorId || 'غير محدد'}
              </p>
            )}
          </div>

          {/* 4. Quantity & Unit */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="block text-sm font-semibold text-gray-500">الكمية والوحدة:</span>
              {editingField !== 'quantityUnit' && (
                <button
                  type="button"
                  onClick={() => startEditing('quantityUnit', formData.quantity, formData.unit)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition"
                >
                  ✎ تعديل
                </button>
              )}
            </div>
            {editingField === 'quantityUnit' ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  className="w-24 p-2 border border-indigo-400 rounded-lg text-sm font-bold text-gray-900"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  placeholder="الكمية"
                  autoFocus
                />
                <input
                  type="text"
                  className="w-24 p-2 border border-indigo-400 rounded-lg text-sm font-bold text-gray-900"
                  value={tempSecondValue}
                  onChange={(e) => setTempSecondValue(e.target.value)}
                  placeholder="الوحدة"
                />
                <button
                  type="button"
                  onClick={() => saveEditing('quantityUnit')}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <p className="text-gray-900 font-medium">
                {formData.quantity || 0} {formData.unit || ''}
              </p>
            )}
          </div>

          {/* 5. Delivery Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="block text-sm font-semibold text-gray-500">تاريخ التسليم:</span>
              {editingField !== 'delivery_date' && (
                <button
                  type="button"
                  onClick={() => startEditing('delivery_date', formData.delivery_date)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition"
                >
                  ✎ تعديل
                </button>
              )}
            </div>
            {editingField === 'delivery_date' ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="p-2 border border-indigo-400 rounded-lg text-sm font-bold text-gray-900"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => saveEditing('delivery_date')}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <p className="text-gray-900 font-medium">{formData.delivery_date || 'غير محدد'}</p>
            )}
          </div>

          {/* 6. Deadline */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="block text-sm font-semibold text-gray-500">نهاية العروض (Deadline):</span>
              {editingField !== 'expiresAt' && (
                <button
                  type="button"
                  onClick={() => startEditing('expiresAt', formData.expiresAt)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition"
                >
                  ✎ تعديل
                </button>
              )}
            </div>
            {editingField === 'expiresAt' ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="p-2 border border-indigo-400 rounded-lg text-sm font-bold text-gray-900"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => saveEditing('expiresAt')}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <p className="text-gray-900 font-medium">{formData.expiresAt || 'غير محدد'}</p>
            )}
          </div>

          {/* 7. Pricing Method */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="block text-sm font-semibold text-gray-500">طريقة التسعير:</span>
              {editingField !== 'pricing' && (
                <button
                  type="button"
                  onClick={() => startEditing('pricing', formData.pricing_method || 'OPEN', formData.fixed_price || '')}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition"
                >
                  ✎ تعديل
                </button>
              )}
            </div>
            {editingField === 'pricing' ? (
              <div className="space-y-2 border border-indigo-300 p-3 rounded-lg bg-indigo-50/50">
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="quickPricingMethod"
                      value="OPEN"
                      checked={tempValue === 'OPEN'}
                      onChange={() => setTempValue('OPEN')}
                    />
                    تسعير مفتوح
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-gray-800 cursor-pointer">
                    <input
                      type="radio"
                      name="quickPricingMethod"
                      value="FIXED_BUDGET"
                      checked={tempValue === 'FIXED_BUDGET'}
                      onChange={() => setTempValue('FIXED_BUDGET')}
                    />
                    ميزانية محددة
                  </label>
                </div>
                {tempValue === 'FIXED_BUDGET' && (
                  <input
                    type="number"
                    className="w-full p-2 border border-indigo-400 rounded text-sm font-bold text-gray-900 bg-white"
                    placeholder="أدخل المبلغ بالريال السعودي"
                    value={tempSecondValue}
                    onChange={(e) => setTempSecondValue(e.target.value)}
                  />
                )}
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => saveEditing('pricing')}
                    className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition"
                  >
                    حفظ
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-bold hover:bg-gray-200 transition"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-900 font-medium">
                {formData.pricing_method === 'OPEN' ? 'تسعير مفتوح (يحدد المورد السعر)' : `ميزانية محددة (${formData.fixed_price || 0} ريال سعودي)`}
              </p>
            )}
          </div>

          {/* 8. Delivery Address */}
          <div className="md:col-span-2 bg-gray-50 p-4 rounded-md">
            <div className="flex items-center justify-between mb-1">
              <span className="block text-sm font-semibold text-gray-500">موقع التسليم:</span>
              {editingField !== 'project_address' && (
                <button
                  type="button"
                  onClick={() => startEditing('project_address', formData.project_address)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded border border-indigo-200 transition"
                >
                  ✎ تعديل
                </button>
              )}
            </div>
            {editingField === 'project_address' ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 p-2 border border-indigo-400 rounded-lg text-sm font-bold text-gray-900 bg-white"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => saveEditing('project_address')}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                >
                  حفظ
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <>
                <p className="text-gray-900 font-medium">{formData.project_address || 'غير محدد'}</p>
                <p className="text-xs text-indigo-600 mt-2">🔒 لن يتم عرض هذا الموقع للموردين حتى يتم قبول عرضهم وترسية الطلب عليهم.</p>
              </>
            )}
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
