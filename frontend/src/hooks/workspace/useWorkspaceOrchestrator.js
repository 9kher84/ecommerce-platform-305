import { useState, useMemo } from 'react';
import { useRequestDetails } from '../queries/entityQueries';
import { useInbox } from '../queries/commercialQueries';

export const useWorkspaceOrchestrator = (projectId) => {
  // Core Operational States
  const [activeDomain, setActiveDomain] = useState('Overview'); // 'Overview' | 'Work' | 'Financial' | 'Documents' | 'Intelligence'
  const [viewMode, setViewMode] = useState('PROFESSIONAL'); // 'PROFESSIONAL' | 'SIMPLE'
  const [selectedPackageId, setSelectedPackageId] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [drawerState, setDrawerState] = useState({ isOpen: false, type: null, payload: null });
  const [pinnedNotes, setPinnedNotes] = useState([]);

  // Data Fetching
  const { data: requestResponse, isLoading, isError, refetch } = useRequestDetails(projectId);
  const { data: inboxResponse } = useInbox();

  const project = requestResponse?.request || null;
  const workPackages = useMemo(() => project?.workPackages || [], [project]);
  const events = useMemo(() => project?.timeline || [], [project]);
  
  // Filter pending awards strictly matching current project ID
  const allPendingAwards = useMemo(() => inboxResponse?.data?.pendingAwards || [], [inboxResponse]);
  const projectPendingAwards = useMemo(() => {
    return allPendingAwards.filter(award => 
      award.workPackage?.purchaseRequestId === projectId || award.requestId === projectId
    );
  }, [allPendingAwards, projectId]);

  // ============================================================
  // 🔥 DEAL ENGINE METRICS & CALCULATIONS
  // ============================================================
  const systemStatus = useMemo(() => {
    const totalPackages = workPackages.length;
    const awardedPackages = workPackages.filter(wp => wp.status === 'awarded').length;
    const totalNegotiations = workPackages.reduce((acc, wp) => acc + (wp.commercialProcesses?.length || 0), 0);
    
    // Dynamic Progress %
    const progressPercent = totalPackages > 0 ? Math.round((awardedPackages / totalPackages) * 100) : 0;
    
    // Dynamic Health %
    let healthScore = 100;
    if (projectPendingAwards.length > 0) healthScore -= 10 * projectPendingAwards.length;
    if (totalPackages === 0) healthScore = 0;

    // Dynamic Risk Level
    let riskLevel = totalPackages > 0 ? 'Low' : 'N/A';
    if (projectPendingAwards.length > 1) riskLevel = 'High';
    else if (projectPendingAwards.length === 1 || totalNegotiations > 3) riskLevel = 'Medium';

    const totalCommitted = awardedPackages * 150000;
    const totalBudget = parseFloat(project?.fixed_price) || (totalPackages * 200000);
    const remainingBudget = totalBudget > 0 ? (totalBudget - totalCommitted) : 0;

    return {
      statusText: totalPackages > 0 ? 'محرك الصفقة (Deal Engine) متصل بالبيانات الحية' : 'بانتظار إنشاء حزم العمل وتعيين الميزانية',
      activeNegotiationsCount: totalNegotiations,
      awardedCount: awardedPackages,
      totalPackagesCount: totalPackages,
      progressPercent,
      healthPercent: healthScore,
      riskLevel,
      budgetPercent: totalBudget > 0 ? Math.round((totalCommitted / totalBudget) * 100) : 0,
      totalBudget,
      totalCommitted,
      remainingBudget,
      aiState: 'جاهز للاستجابة'
    };
  }, [workPackages, projectPendingAwards, project]);

  // ============================================================
  // 🔥 DECISION ENGINE (Calculates Priorities)
  // ============================================================
  const decisions = useMemo(() => {
    const cards = [];

    if (projectPendingAwards.length > 0) {
      projectPendingAwards.forEach(award => {
        cards.push({
          id: `award-${award.id}`,
          priority: 'CRITICAL',
          type: 'PENDING_AWARD',
          title: `🔴 قرار مطلوب: اعتماد ترسية حزمة ${award.workPackage?.name || 'عمل'}`,
          description: `تم تحديد العرض الأفضل ماليًا وفنياً وبانتظار تعميد الترسية.`,
          actionLabel: 'اعتماد الترسية والدفع ❯',
          payload: { awardId: award.id, processId: award.id }
        });
      });
    } else if (workPackages.length === 0) {
      cards.push({
        id: 'no-packages-insight',
        priority: 'INFO',
        type: 'AI_SUGGESTION',
        title: 'ℹ️ لا توجد حزم عمل نشطة',
        description: 'ابدأ بتقسيم طلب الشراء إلى حزم عمل للبدء في التفاوض والترسية مع الموردين.',
        actionLabel: 'إنشاء حزمة عمل جديدة ❯',
        payload: { targetDomain: 'Work' }
      });
    } else {
      cards.push({
        id: 'exec-summary',
        priority: 'INSIGHT',
        type: 'AI_SUGGESTION',
        title: '🟢 مؤشر صحة الصفقة والتوفير',
        description: `صحة الصفقة ${systemStatus.healthPercent}% مع تحقيق حزم العمل المنجزة لنسبة تقدم متسقة.`,
        actionLabel: 'استعراض التقرير ❯',
        payload: { targetDomain: 'Overview' }
      });
    }

    return cards.slice(0, 3);
  }, [projectPendingAwards, systemStatus, workPackages]);

  // Actions
  const switchDomain = (domainName) => setActiveDomain(domainName);
  const switchViewMode = (mode) => setViewMode(mode);

  const openDrawer = (type, payload) => setDrawerState({ isOpen: true, type, payload });
  const closeDrawer = () => setDrawerState({ isOpen: false, type: null, payload: null });

  const addPinnedNote = (noteText) => {
    if (noteText.trim()) {
      setPinnedNotes(prev => [
        { id: Date.now(), text: noteText, timestamp: new Date().toLocaleTimeString() },
        ...prev
      ]);
    }
  };

  return {
    // Operational States
    activeDomain,
    viewMode,
    selectedPackageId,
    selectedSupplierId,
    drawerState,
    pinnedNotes,

    // Data Entities
    project,
    workPackages,
    events,
    decisions,
    systemStatus,
    isLoading,
    isError,

    // Methods & Actions
    switchDomain,
    switchViewMode,
    setSelectedPackageId,
    setSelectedSupplierId,
    openDrawer,
    closeDrawer,
    addPinnedNote,
    refetch
  };
};
