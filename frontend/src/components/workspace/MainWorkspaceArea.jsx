import React from 'react';
import { PackageAccordion } from './PackageAccordion';

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
            <span className="text-xs text-gray-500 font-bold block">حالة الميزانية المستهدفة</span>
            <span className="text-3xl font-black text-blue-600 mt-1 block">ضمن النطاق</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-3">تفاصيل مساحة العمل</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 font-bold">اسم المنشأة/المشروع:</span>
              <p className="text-gray-900 font-medium mt-0.5">
                {project?.title || 'لم يتم تعيين اسم المشروع بعد'}
              </p>
            </div>
            <div>
              <span className="text-gray-500 font-bold">تاريخ البدء:</span>
              <p className="text-gray-900 font-medium mt-0.5">{project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'اليوم'}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-gray-500 font-bold">الوصف والتفاصيل:</span>
              <p className="text-gray-700 mt-0.5">
                {project?.description || 'أضف وصف المشروع ليساعد الموردين على تقديم عروض أدق.'}
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
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-3">عدسة العقود والمستندات</h3>
        <p className="text-sm text-gray-500">لا توجد ملفات مرفقة حالياً. ارفع المستندات الرسمية لربطها بالحزم.</p>
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
