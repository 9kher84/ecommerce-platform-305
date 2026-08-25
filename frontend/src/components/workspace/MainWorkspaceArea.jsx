import React from 'react';
import { PackageAccordion } from './PackageAccordion';
import { FulfillmentSummaryCard } from './FulfillmentSummaryCard';

export const MainWorkspaceArea = ({ activeDomain, project, workPackages = [], onSelectProcess }) => {
  if (activeDomain === 'Overview') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
            <span className="text-xs text-gray-500 font-bold block">إجمالي حزم العمل</span>
            <span className="text-3xl font-black text-gray-900 mt-1 block">{workPackages.length}</span>
          </div>
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
            <span className="text-xs text-gray-500 font-bold block">المفاوضات الفعالة</span>
            <span className="text-3xl font-black text-indigo-600 mt-1 block">
              {workPackages.reduce((acc, wp) => acc + (wp.commercialProcesses?.length || 0), 0)}
            </span>
          </div>
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
            <span className="text-xs text-gray-500 font-bold block">حزم مكتمل الترسية</span>
            <span className="text-3xl font-black text-emerald-600 mt-1 block">
              {workPackages.filter(wp => wp.status === 'awarded').length}
            </span>
          </div>
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-sm">
            <span className="text-xs text-gray-500 font-bold block">طريقة التسعير والميزانية</span>
            <span className="text-lg font-black text-blue-600 mt-1 block truncate">
              {project?.header?.pricing_method === 'OPEN'
                ? 'تسعير مفتوح'
                : (project?.header?.fixed_price !== null && project?.header?.fixed_price !== undefined && project?.header?.fixed_price !== '' && project?.header?.fixed_price !== 'null')
                  ? `ميزانية محددة (${parseFloat(project.header.fixed_price).toLocaleString()} ريال)`
                  : (project?.header?.pricing_method === 'FIXED_BUDGET' ? 'ميزانية غير محددة' : 'تسعير مفتوح')}
            </span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-3">تفاصيل مساحة العمل</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 font-bold">اسم المنشأة/المشروع:</span>
              <p className="text-gray-900 font-medium mt-0.5">
                {project?.header?.title || 'لم يتم تعيين اسم المشروع بعد'}
              </p>
            </div>
            <div>
              <span className="text-gray-500 font-bold">الكمية المطلوبة:</span>
              <p className="text-gray-900 font-medium mt-0.5">
                {(project?.items?.[0]?.quantity !== null && project?.items?.[0]?.quantity !== undefined && project?.items?.[0]?.quantity !== '')
                  ? `${parseFloat(project.items[0].quantity).toLocaleString()} ${project.items[0].unit || ''}`
                  : 'غير محدد'}
              </p>
            </div>
            <div>
              <span className="text-gray-500 font-bold">تاريخ التسليم المستهدف:</span>
              <p className="text-gray-900 font-medium mt-0.5 font-sans">
                {project?.header?.delivery_date ? new Date(project.header.delivery_date).toLocaleDateString() : 'غير محدد'}
              </p>
            </div>
            <div>
              <span className="text-gray-500 font-bold">موقع التسليم:</span>
              <p className="text-gray-900 font-medium mt-0.5">
                {project?.header?.delivery_city || 'غير محدد'}
              </p>
            </div>
            <div>
              <span className="text-gray-500 font-bold">نهاية تقديم العروض:</span>
              <p className="text-gray-900 font-medium mt-0.5 font-sans">
                {project?.header?.expiresAt ? new Date(project.header.expiresAt).toLocaleDateString() : 'غير محدد'}
              </p>
            </div>
            <div className="md:col-span-2">
              <span className="text-gray-500 font-bold">الوصف والتفاصيل:</span>
              <p className="text-gray-700 mt-0.5">
                {project?.header?.description || 'أضف وصف المشروع ليساعد الموردين على تقديم عروض أدق.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeDomain === 'Work') {
    return (
      <div className="space-y-4">
        {/* Render Progressive Accordion View (Zero Page Jump) */}
        <PackageAccordion 
          workPackages={workPackages} 
          onSelectProcess={onSelectProcess}
        />
      </div>
    );
  }

  if (activeDomain === 'Fulfillment' || activeDomain === 'Execution') {
    // Extract Purchase Order ID from awarded work packages if available
    const awardedWp = workPackages.find(wp => wp.status === 'awarded' || wp.purchaseOrder?.id);
    const poId = awardedWp?.purchaseOrder?.id || project?.purchaseOrderId || project?.poId;

    if (!poId) {
      return (
        <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl p-8 text-center space-y-3">
          <div className="text-3xl">📦</div>
          <h3 className="font-bold text-base text-white">مرحلة فحص واستلام البضائع (Goods Receipt & Inspection)</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            ستظهر كميات الاستلام ومستندات الفحص الميدانية بمجرد قبول طلب الشراء (Purchase Order) وبدء شحن البضائع.
          </p>
        </div>
      );
    }

    return <FulfillmentSummaryCard poId={poId} />;
  }

  if (activeDomain === 'Financial') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-3">عدسة المالية والميزانية</h3>
        <p className="text-sm text-gray-600">عرض التكاليف التقديرية والعقود التراكمية على مستوى مساحة العمل.</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-900 text-sm">
          💡 يتم تحديد وقبول القيم المالية مباشرة عبر اللواح الجانبية الخاصة بكل مورد دون الانتقال لصفحة أخرى.
        </div>
      </div>
    );
  }

  if (activeDomain === 'Documents') {
    const attachments = project?.header?.pdfAttachments || project?.pdfAttachments || [];
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-3">عدسة العقود والمستندات</h3>
        {Array.isArray(attachments) && attachments.length > 0 ? (
          <div className="space-y-2">
            {attachments.map((file, idx) => {
              const fileName = typeof file === 'string' ? file : (file?.name || file?.filename || `مستند مرفق ${idx + 1}`);
              const fileUrl = typeof file === 'string' ? file : (file?.url || file?.path || '#');
              return (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <span className="text-sm font-medium text-gray-800">📄 {fileName}</span>
                  {fileUrl !== '#' && (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-indigo-600 hover:underline">
                      عرض الملف ↗
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">لا توجد ملفات مرفقة حالياً في مساحة العمل.</p>
        )}
      </div>
    );
  }

  if (activeDomain === 'Intelligence') {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-3">عدسة الذكاء والتحليلات (AI Perspective)</h3>
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-indigo-900 text-sm">
          🤖 المساعد الذكي يقدم تقييمات استباقية ومستمرة على مستوى مساحة العمل.
        </div>
      </div>
    );
  }

  return null;
};
