import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkspaceOrchestrator } from '../../hooks/workspace/useWorkspaceOrchestrator';
import { WorkspaceHeader } from '../../components/workspace/WorkspaceHeader';
import { CommandCenter } from '../../components/workspace/CommandCenter';
import { MainWorkspaceArea } from '../../components/workspace/MainWorkspaceArea';
import { RightAssistant } from '../../components/workspace/RightAssistant';
import { BottomStatus } from '../../components/workspace/BottomStatus';
import { SupplierDrawer } from '../../components/workspace/SupplierDrawer';
import { SimpleWorkspaceRenderer } from '../../components/workspace/SimpleWorkspaceRenderer';

export const ProcurementWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Instantiate the Central Workspace Orchestrator & Decision Engine
  const {
    activeDomain,
    viewMode,
    project,
    workPackages,
    events,
    decisions,
    systemStatus,
    pinnedNotes,
    drawerState,
    isLoading,
    isError,
    switchDomain,
    switchViewMode,
    openDrawer,
    closeDrawer,
    addPinnedNote,
    refetch
  } = useWorkspaceOrchestrator(id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
          <p className="font-bold text-sm">جاري تهيئة محرك الصفقة وحفظ السياق (Deal Workspace Engine)...</p>
        </div>
      </div>
    );
  }

  if (isError || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 border rounded-xl shadow-sm text-center max-w-md space-y-4">
          <h2 className="text-xl font-bold text-red-600">تعذر تحميل مساحة العمل</h2>
          <p className="text-sm text-gray-500">صفقة أو حزمة غير موجودة.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-indigo-600 text-white rounded font-bold text-sm hover:bg-indigo-700 transition"
          >
            العودة للوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  // Handle Command Center Actions (Zero Page Jump: Stay inside Workspace)
  const handleActionClick = (actionCard) => {
    if (actionCard.payload?.targetDomain) {
      switchDomain(actionCard.payload.targetDomain);
    } else {
      switchDomain('Work');
    }
  };

  // Handle Selecting a Supplier Process (Opens Slide-over Drawer inside Workspace)
  const handleSelectProcess = (process, workPackage) => {
    openDrawer('supplier_negotiation', { processId: process.id, workPackage });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-between relative overflow-x-hidden pb-12">
      <div>
        <WorkspaceHeader 
          project={project} 
          activeDomain={activeDomain} 
          onDomainChange={switchDomain} 
          viewMode={viewMode}
          onViewModeChange={switchViewMode}
          systemStatus={systemStatus}
        />

        <main className="max-w-[1600px] mx-auto p-6 space-y-6">
          {viewMode === 'SIMPLE' ? (
            /* 🔥 SIMPLE VIEW RENDERER (Individual Lightweight WhatsApp-like Mode) */
            <SimpleWorkspaceRenderer 
              project={project}
              workPackages={workPackages}
              onSelectProcess={handleSelectProcess}
            />
          ) : (
            /* 🔥 PROFESSIONAL VIEW RENDERER (Enterprise Deal Operations Center) */
            <>
              <CommandCenter actions={decisions} onActionClick={handleActionClick} />

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                <div className="lg:col-span-3">
                  <MainWorkspaceArea 
                    activeDomain={activeDomain} 
                    project={project} 
                    workPackages={workPackages}
                    onSelectProcess={handleSelectProcess}
                  />
                </div>
                <div className="lg:col-span-1 h-full">
                  <RightAssistant 
                    events={events} 
                    pinnedNotes={pinnedNotes}
                    onAddNote={addPinnedNote}
                  />
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* Slide-over Supplier Drawer (Zero Page Jump Context Preservation) */}
      <SupplierDrawer
        isOpen={drawerState.isOpen && drawerState.type === 'supplier_negotiation'}
        processId={drawerState.payload?.processId}
        workPackage={drawerState.payload?.workPackage}
        onClose={closeDrawer}
        onAwardSuccess={() => refetch()}
      />

      {/* IDE-like Operating System Status Bar */}
      <BottomStatus activeDomain={activeDomain} systemStatus={systemStatus} />
    </div>
  );
};
