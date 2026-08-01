import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/AuthProvider';
import { useRequestDetails } from '../../hooks/queries/entityQueries';
import { SubmitProposalModal } from '../../components/commercial/SubmitProposalModal';
import { getErrorMessage } from '../../utils/errorUtils';

export const RequestDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [selectedWorkPackageId, setSelectedWorkPackageId] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  const { data: response, isLoading, isError, error } = useRequestDetails(id);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-md">
        Error loading details: {getErrorMessage(error)}
      </div>
    );
  }

  const project = response?.request || response?.data;

  if (!project) {
    return <div className="p-4 text-center text-gray-500">Project not found</div>;
  }

  const workPackages = project.workPackages || [];
  
  // Calculate KPIs
  const packageCount = workPackages.length;
  const supplierCount = workPackages.reduce((acc, wp) => acc + (wp.commercialProcesses?.length || 0), 0);
  const awardedCount = workPackages.filter(wp => wp.status === 'awarded').length;
  // For pending decisions, we'd ideally look at process statuses, but we simplify here
  const pendingDecisions = workPackages.reduce((acc, wp) => acc + (wp.commercialProcesses?.filter(p => p.status === 'waiting_buyer' || p.status === 'pending_award').length || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* KPI Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <button onClick={() => navigate(-1)} className="text-sm text-indigo-600 hover:text-indigo-800 mb-2 inline-block">
              ← عودة للمشاريع
            </button>
            <h1 className="text-2xl font-bold text-gray-900">مشروع: {project.title}</h1>
            <p className="text-gray-500 mt-2">{project.description}</p>
          </div>
          <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-bold">
            الحالة: {project.status.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
            <div className="text-3xl font-black text-gray-800">{packageCount}</div>
            <div className="text-xs text-gray-500 font-medium uppercase mt-1">عدد الحزم</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">
            <div className="text-3xl font-black text-gray-800">{supplierCount}</div>
            <div className="text-xs text-gray-500 font-medium uppercase mt-1">المفاوضات النشطة</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 text-center">
            <div className="text-3xl font-black text-orange-600">{pendingDecisions}</div>
            <div className="text-xs text-orange-600 font-medium uppercase mt-1">بانتظار قراري</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
            <div className="text-3xl font-black text-green-600">{awardedCount}</div>
            <div className="text-xs text-green-600 font-medium uppercase mt-1">حزم تمت ترسيتها</div>
          </div>
        </div>
      </div>

      {/* Work Packages List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 p-4">
          <h2 className="text-lg font-bold text-gray-800">حزم العمل (Work Packages)</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {workPackages.map((wp) => {
            const wpSuppliers = wp.commercialProcesses?.length || 0;
            return (
              <div 
                key={wp.id} 
                className="p-4 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors"
                onClick={() => navigate(`/requests/${id}/packages/${wp.id}`)}
              >
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{wp.name}</h3>
                  <div className="text-sm text-gray-500 flex gap-4 mt-1">
                    <span>الموردين/المفاوضات: <strong className="text-gray-700">{wpSuppliers}</strong></span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${wp.status === 'awarded' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {wp.status.toUpperCase()}
                  </span>
                  
                  {user?.role === 'seller' && wp.status !== 'awarded' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedWorkPackageId(wp.id);
                        setIsModalOpen(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded hover:bg-indigo-700 transition"
                    >
                      تقديم عرض
                    </button>
                  )}

                  {user?.role !== 'seller' && (
                    <span className="text-gray-400">❯</span>
                  )}
                </div>
              </div>
            );
          })}
          {workPackages.length === 0 && (
            <div className="p-8 text-center text-gray-500">لا توجد حزم عمل لهذا المشروع.</div>
          )}
        </div>
      </div>

      {selectedWorkPackageId && (
        <SubmitProposalModal
          isOpen={isModalOpen}
          workPackageId={selectedWorkPackageId}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedWorkPackageId(null);
          }}
        />
      )}
    </div>
  );
};
