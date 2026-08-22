import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateRequest, usePublishRequest, useRequestDetails, useUpdateRequest } from '../../hooks/queries/entityQueries';
import { RequestForm } from '../../components/requests/RequestForm';
import { toast } from 'react-hot-toast';

export const IntakeWizard = () => {
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const [draftId, setDraftId] = useState(routeId || null);
  const [autoSaveStatus, setAutoSaveStatus] = useState('');
  
  const createRequestMutation = useCreateRequest();
  const publishRequestMutation = usePublishRequest();
  const updateRequestMutation = useUpdateRequest();
  const { data: requestDetails } = useRequestDetails(draftId);

  const [method, setMethod] = useState('manual'); // manual, ai, attachments
  const [step, setStep] = useState(1); // 1: Input, 2: Preview
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    tender_type: 'PUBLIC',
    title: '',
    sectorId: '',
    description: '',
    quantity: '',
    unit: '',
    project_address: '',
    delivery_date: '',
    expiresAt: '',
    pricing_method: 'OPEN',
    fixed_price: '',
  });

  const [isHydrated, setIsHydrated] = useState(!draftId);

  // Sync draftId when routeId changes
  useEffect(() => {
    if (routeId && routeId !== draftId) {
      setDraftId(routeId);
      setIsHydrated(false);
    }
  }, [routeId]);

  // Load existing draft if ID is present
  useEffect(() => {
    if (requestDetails?.request) {
      const req = requestDetails.request;
      const header = req.header || {};
      const firstItem = req.items?.[0] || {};
      
      setFormData({
        tender_type: header.tender_type || (header.auction_type === 'secret' ? 'PRIVATE' : 'PUBLIC'),
        title: header.title || req.title || '',
        sectorId: header.sectorId ? String(header.sectorId) : (header.categoryId ? String(header.categoryId) : (req.sectorId ? String(req.sectorId) : '')),
        description: header.description || req.description || '',
        quantity: firstItem.quantity !== undefined ? String(firstItem.quantity) : (req.quantity ? String(req.quantity) : ''),
        unit: firstItem.unit || req.unit || '',
        project_address: header.delivery_city || req.deliveryLocations?.[0]?.address || req.delivery_city || '',
        delivery_date: (header.delivery_date || req.delivery_date) ? new Date(header.delivery_date || req.delivery_date).toISOString().split('T')[0] : '',
        expiresAt: (header.expiresAt || req.expiresAt) ? new Date(header.expiresAt || req.expiresAt).toISOString().split('T')[0] : '',
        pricing_method: header.pricing_method || req.pricing_method || 'OPEN',
        fixed_price: (header.fixed_price || req.fixed_price) ? String(header.fixed_price || req.fixed_price) : '',
      });
      setIsHydrated(true);
    }
  }, [requestDetails]);

  // Debounced Auto-Save Draft
  useEffect(() => {
    if (!formData.title || !formData.sectorId) return;
    if (draftId && !isHydrated) return; // Protection Guard: Do not autosave before hydration finishes

    const delayDebounceFn = setTimeout(async () => {
      setAutoSaveStatus('جاري حفظ المسودة تلقائياً...');
      try {
        const defaultItem = {
          lineNumber: 1,
          freeTextDescription: formData.description || formData.title,
          quantity: parseFloat(formData.quantity) || 1,
          unit: formData.unit || 'وحدة',
        };

        const payload = {
          header: {
            title: formData.title,
            description: formData.description,
            sectorId: formData.sectorId ? parseInt(formData.sectorId) : null,
            categoryId: formData.sectorId ? parseInt(formData.sectorId) : null,
            tender_type: formData.tender_type || 'PUBLIC',
            pricing_method: formData.pricing_method || 'OPEN',
            fixed_price: formData.fixed_price ? parseFloat(formData.fixed_price) : null,
            delivery_date: formData.delivery_date || null,
            expiresAt: formData.expiresAt || null,
            delivery_city: formData.project_address || null,
            deliveryLocations: formData.project_address
              ? [{ address: formData.project_address }]
              : [],
          },
          items: [defaultItem],
          invitations: [],
        };

        if (draftId) {
          await updateRequestMutation.mutateAsync({ id: draftId, data: payload });
          setAutoSaveStatus('تم الحفظ تلقائياً ✓');
        } else {
          const response = await createRequestMutation.mutateAsync(payload);
          const newId = response.request?.id || response.data?.request?.id || response.data?.id;
          if (newId) {
            setDraftId(newId);
            setIsHydrated(true);
            window.history.replaceState(null, '', `/intake/${newId}`);
            setAutoSaveStatus('تم الحفظ تلقائياً ✓');
          }
        }
      } catch (error) {
        setAutoSaveStatus('فشل الحفظ التلقائي');
      }
    }, 2500);

    return () => clearTimeout(delayDebounceFn);
  }, [
    formData.title,
    formData.sectorId,
    formData.description,
    formData.quantity,
    formData.unit,
    formData.project_address,
    formData.delivery_date,
    formData.expiresAt,
    formData.pricing_method,
    formData.fixed_price,
    draftId,
    isHydrated
  ]);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.title || !formData.sectorId || !formData.quantity) {
        toast.error('يرجى تعبئة الحقول الإلزامية (العنوان، القطاع، والكمية)');
        return;
      }
      if (formData.quantity && (isNaN(parseFloat(formData.quantity)) || parseFloat(formData.quantity) <= 0)) {
        toast.error('الكمية يجب أن تكون رقماً أكبر من صفر');
        return;
      }
      if (formData.fixed_price && isNaN(parseFloat(formData.fixed_price))) {
        toast.error('الميزانية يجب أن تكون رقماً صحيحاً');
        return;
      }
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
  };

  const handleSaveDraft = async () => {
    await submitRequest('draft');
  };

  const handlePublish = async () => {
    await submitRequest('published');
  };

  const submitRequest = async (targetStatus) => {
    if (!formData.title || !formData.sectorId || !formData.quantity) {
      toast.error('يرجى تعبئة جميع الحقول الإلزامية قبل النشر');
      return;
    }

    setIsSubmitting(true);
    try {
      const defaultItem = {
        lineNumber: 1,
        freeTextDescription: formData.description || formData.title,
        quantity: parseFloat(formData.quantity) || 1,
        unit: formData.unit || 'وحدة',
      };

      const payload = {
        header: {
          title: formData.title,
          description: formData.description,
          sectorId: formData.sectorId ? parseInt(formData.sectorId) : null,
          categoryId: formData.sectorId ? parseInt(formData.sectorId) : null,
          tender_type: formData.tender_type || 'PUBLIC',
          pricing_method: formData.pricing_method || 'OPEN',
          fixed_price: formData.fixed_price ? parseFloat(formData.fixed_price) : null,
          delivery_date: formData.delivery_date || null,
          expiresAt: formData.expiresAt || null,
          delivery_city: formData.project_address || null,
          deliveryLocations: formData.project_address
            ? [{ address: formData.project_address }]
            : [],
        },
        items: [defaultItem],
        invitations: [],
      };

      let activeId = draftId;
      if (activeId) {
        await updateRequestMutation.mutateAsync({ id: activeId, data: payload });
        if (targetStatus === 'published') {
          await publishRequestMutation.mutateAsync(activeId);
          toast.success('تم إنشاء ونشر الطلب بنجاح 🚀');
        } else {
          toast.success('تم حفظ التعديلات كمسودة بنجاح ✓');
        }
        navigate(`/workspace/${activeId}`);
      } else {
        const response = await createRequestMutation.mutateAsync(payload);
        const newId = response.request?.id || response.data?.request?.id || response.data?.id;
        if (newId) {
          setDraftId(newId);
          window.history.replaceState(null, '', `/intake/${newId}`);
          if (targetStatus === 'published') {
            await publishRequestMutation.mutateAsync(newId);
            toast.success('تم إنشاء ونشر الطلب بنجاح 🚀');
          } else {
            toast.success('تم حفظ كمسودة بنجاح ✓');
          }
          navigate(`/workspace/${newId}`);
        } else {
          throw new Error('فشل في العثور على رقم الطلب المسترجع');
        }
      }
    } catch (error) {
      toast.error(error.message || 'فشل معالجة الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  const MethodCard = ({ id, icon, title, desc }) => (
    <div
      onClick={() => setMethod(id)}
      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${method === id ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'}`}
    >
      <div className="flex items-center gap-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className={`font-bold ${method === id ? 'text-indigo-900' : 'text-gray-800'}`}>{title}</h3>
          <p className={`text-sm ${method === id ? 'text-indigo-700' : 'text-gray-500'}`}>{desc}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" dir="rtl">
      
      {/* Header */}
      <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-gray-900">{draftId ? 'تعديل طلب الشراء / RFQ' : 'إنشاء طلب شراء جديد'}</h1>
          <p className="text-gray-500 mt-2">اختر طريقة الإدخال المناسبة، ثم أكمل تفاصيل الطلب.</p>
        </div>
        {autoSaveStatus && (
          <span className="text-xs bg-indigo-50 text-indigo-700 px-3.5 py-2 rounded-full font-bold border border-indigo-100 animate-pulse">
            {autoSaveStatus}
          </span>
        )}
      </div>

      {step === 1 && (
        <div className="space-y-8">
          {/* Method Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MethodCard id="manual" icon="✍️" title="إدخال يدوي" desc="تعبئة النموذج خطوة بخطوة بالكامل." />
            <MethodCard id="ai" icon="✨" title="الذكاء الاصطناعي" desc="اكتب وصفاً وسيولد النظام الطلب تلقائياً." />
            <MethodCard id="attachments" icon="📎" title="من ملف" desc="ارفع (PDF/Excel) وسيقرأه النظام." />
          </div>

          <hr className="border-gray-200" />

          {method === 'ai' && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <span>✨</span> المساعد الذكي
              </h3>
              <p className="text-sm text-indigo-800 mb-4">اكتب ما تحتاجه بلغتك الخاصة وسنقوم بتعبئة النموذج أدناه بالنيابة عنك.</p>
              <textarea 
                rows="3" 
                className="w-full p-3 border border-indigo-300 rounded focus:ring-indigo-500 bg-white"
                placeholder="مثال: أحتاج 50 جهاز كمبيوتر ديل i7 للرياض قبل نهاية الشهر وتكون بضمان سنتين..."
              />
              <button className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded font-semibold text-sm hover:bg-indigo-700 transition-colors">
                توليد الطلب
              </button>
            </div>
          )}

          {method === 'attachments' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <span>📎</span> استخراج من ملف
              </h3>
              <p className="text-sm text-blue-800 mb-4">ارفع كراسة الشروط أو جداول الكميات، وسنقوم بتفريغها هنا.</p>
              <div className="border-2 border-dashed border-blue-300 bg-white p-6 text-center rounded cursor-pointer">
                رفع ملف (قريباً)
              </div>
            </div>
          )}

          {/* Core Form */}
          <RequestForm formData={formData} setFormData={setFormData} />
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">⚠️</span>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 font-bold">مراجعة الطلب قبل النشر</p>
                <p className="text-xs text-yellow-600 mt-1">يرجى التأكد من صحة البيانات أدناه. هذه هي النسخة التي ستظهر للموردين عند نشر الطلب.</p>
              </div>
            </div>
          </div>

          {/* Preview Form */}
          <RequestForm formData={formData} setFormData={setFormData} isPreview={true} />
        </div>
      )}

      {/* Footer Controls */}
      <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center bg-white sticky bottom-0 p-4 rounded-lg shadow-sm">
        {step === 1 ? (
          <>
            <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-900 px-4 py-2 font-medium transition-colors">
              إلغاء
            </button>
            <button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-sm transition-colors">
              متابعة للمراجعة
            </button>
          </>
        ) : (
          <>
            <button onClick={handleBack} className="text-gray-600 hover:text-gray-900 px-4 py-2 font-medium transition-colors border border-gray-300 rounded hover:bg-gray-50">
              رجوع للتعديل
            </button>
            <div className="flex gap-3">
              <button 
                onClick={handleSaveDraft} 
                disabled={isSubmitting}
                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50"
              >
                حفظ كمسودة
              </button>
              <button 
                onClick={handlePublish} 
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-lg font-bold shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'نشر الطلب الآن 🚀'}
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
};
