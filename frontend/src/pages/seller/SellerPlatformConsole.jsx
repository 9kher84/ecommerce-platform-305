import React, { useState } from 'react';
import { Button } from '../../components/common/Button';
import { ProductIngressModal } from '../product/ProductIngressModal';
import { useSellerStats } from '../../hooks/queries/dashboardQueries';
import { useQuery } from '@tanstack/react-query';
import { commercialService } from '../../services/commercialService';
import { invoiceService } from '../../services/invoiceService';
import { entityService } from '../../services/entityService';
import {
  useAcceptPO,
  useStartPreparation,
  useMarkReadyToShip,
  useCreateShipment,
  useDispatchShipment
} from '../../hooks/queries/commercialQueries';

export const SellerPlatformConsole = () => {
  const [activeModule, setActiveModule] = useState('TODAY_BUSINESS');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [activeShipmentModalPO, setActiveShipmentModalPO] = useState(null);
  const [shipmentFormData, setShipmentFormData] = useState({ carrier: '', trackingNumber: '', lines: [] });

  const acceptPOMutation = useAcceptPO();
  const startPrepMutation = useStartPreparation();
  const markReadyMutation = useMarkReadyToShip();
  const createShipmentMutation = useCreateShipment();
  const dispatchShipmentMutation = useDispatchShipment();
  
  // Real Domain Queries using Canonical Frontend Services
  const { data: canonicalRequestsData, isLoading: isRequestsLoading } = useQuery({
    queryKey: ['requests', 'published'],
    queryFn: () => entityService.getRequests(),
    staleTime: 30 * 1000,
  });

  const { data: sellerStatsData, isLoading: isStatsLoading } = useSellerStats();

  const { data: inboxData, isLoading: isInboxLoading } = useQuery({
    queryKey: ['negotiations', 'inbox'],
    queryFn: () => commercialService.getInbox(),
    staleTime: 30 * 1000,
  });

  const { data: sellerPOsData, isLoading: isPOsLoading } = useQuery({
    queryKey: ['purchaseOrders', 'seller'],
    queryFn: () => commercialService.getSellerPOs(),
    staleTime: 30 * 1000,
  });

  const { data: myInvoicesData, isLoading: isInvoicesLoading } = useQuery({
    queryKey: ['invoices', 'my'],
    queryFn: () => invoiceService.getMyInvoices(),
    staleTime: 30 * 1000,
  });

  // Preserved Design Contract
  const [capabilities] = useState({
    tier: 'PRO',
    enabledModules: [
      'TODAY_BUSINESS',
      'PURCHASE_OPPORTUNITIES',
      'QUOTATIONS',
      'ORDERS_AND_FULFILLMENT',
      'PRODUCTS_INGRESS',
      'INVENTORY',
      'CUSTOMER_DEALS',
      'FINANCE',
      'PERFORMANCE_METRICS',
      'REPORTS',
      'AI_INTELLIGENCE',
      'SETTINGS'
    ]
  });

  const navItems = [
    { id: 'TODAY_BUSINESS', label: "إنجازات اليوم (Today's Business)", icon: '⚡' },
    { id: 'PURCHASE_OPPORTUNITIES', label: 'فرص الشراء (RFQs)', icon: '🎯' },
    { id: 'QUOTATIONS', label: 'العروض والمفاوضات (Quotes)', icon: '📝' },
    { id: 'ORDERS_AND_FULFILLMENT', label: 'الطلبات والشحن (Orders)', icon: '📦' },
    { id: 'PRODUCTS_INGRESS', label: 'إدارة المنتجات (Products)', icon: '🏷️' },
    { id: 'INVENTORY', label: 'المخزون (Inventory)', icon: '🏢' },
    { id: 'FINANCE', label: 'المالية والعمولات (Finance)', icon: '💳' },
    { id: 'PERFORMANCE_METRICS', label: 'الأداء الفعلي (Performance)', icon: '📊' },
    { id: 'AI_INTELLIGENCE', label: 'ذكاء السوق (AI Engine)', icon: '🤖' },
    { id: 'SETTINGS', label: 'الإعدادات (Settings)', icon: '⚙️' }
  ].filter(item => capabilities.enabledModules.includes(item.id));

  // Compute Card Metrics with STRICT Business Semantics
  // 1. Canonical RFQs Opportunity Count matching /requests page (published / active RFQs)
  const rfqsCount = canonicalRequestsData ?
    (Array.isArray(canonicalRequestsData.data) ? canonicalRequestsData.data.length : (Array.isArray(canonicalRequestsData) ? canonicalRequestsData.length : (canonicalRequestsData.count || 0)))
    : null;


  // 2. Negotiations Awaiting Seller Action (status: waiting_seller OR pending_award)
  const pendingInboxCount = inboxData?.data ?
    (Array.isArray(inboxData.data) ? inboxData.data.filter(p => p.status === 'waiting_seller' || p.status === 'pending_award').length : 0) : null;

  // 3. Actionable POs Requiring Seller Confirmation/Fulfillment (businessStatus: issued OR fulfillmentStatus: pending/preparing)
  const pendingPOsCount = sellerPOsData?.data ?
    (Array.isArray(sellerPOsData.data) ? sellerPOsData.data.filter(po => po.businessStatus === 'issued' || po.fulfillmentStatus === 'pending' || po.fulfillmentStatus === 'preparing').length : 0) : null;

  // 4. Outstanding / Due Seller Obligations Amount (status: pending OR partially_paid OR overdue)
  const outstandingInvoicesAmount = myInvoicesData?.data ?
    (Array.isArray(myInvoicesData.data)
      ? myInvoicesData.data
          .filter(inv => inv.status === 'pending' || inv.status === 'partially_paid' || inv.status === 'overdue')
          .reduce((sum, inv) => sum + (parseFloat(inv.totalAmount || 0) - parseFloat(inv.paidAmount || 0)), 0)
      : 0) : null;

  // Seller Stats - Strictly Mapped
  const sellerStats = sellerStatsData?.stats;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      
      {/* Top Header Navigation */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-wrap justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/20">
            🏬
          </div>
          <div>
            <h1 className="font-black text-sm text-white">منصة البائع الذكية (Seller Capability Platform)</h1>
            <span className="text-[11px] text-slate-400">نظام التشغيل المتقدم للبائعين والتجار والمصانع</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full font-mono font-bold">
            {capabilities.tier} TIER
          </span>
          <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-3 py-1 rounded-full font-mono font-bold">
            Reputation: 4.85 / 5.0
          </span>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar Capabilities Navigation */}
        <aside className="w-full md:w-64 bg-slate-900/60 border-r border-slate-800 p-4 space-y-1">
          <div className="text-[10px] font-bold text-slate-500 uppercase px-3 py-2">الوحدات المفعلة (Capabilities)</div>
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition text-right ${
                activeModule === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
              }`}>
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Dynamic Capability Module Body */}
        <main className="flex-1 p-6 bg-slate-950 overflow-y-auto">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsAddProductOpen(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20">
              + إضافة منتج ومخزون جديد
            </Button>
          </div>

          {isAddProductOpen && (
            <ProductIngressModal isOpen={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} />
          )}

          {activeModule === 'TODAY_BUSINESS' && (
            <div className="space-y-6">
              <h2 className="text-lg font-black text-white">إنجازات ومهام اليوم (Today's Business Actions)</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: RFQs / Opportunities */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">فرص شراء جديدة</span>
                    <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] px-2 py-0.5 rounded-full font-mono">MARKET</span>
                  </div>
                  <div className="text-2xl font-black text-indigo-400 font-mono">
                    {isRequestsLoading ? '...' : (rfqsCount !== null ? `${rfqsCount} طلبات` : 'غير متاح')}
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">فرص الشراء المتاحة</span>
                    <Button onClick={() => window.location.href = '/requests'} className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] px-3 py-1 font-bold">
                      تقديم عرض سعر ❯
                    </Button>
                  </div>
                </div>

                {/* Card 2: Offers awaiting seller response */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">عروض ينتظر رد البائع</span>
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-full font-mono">عاجل</span>
                  </div>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {isInboxLoading ? '...' : (pendingInboxCount !== null ? `${pendingInboxCount} عرض` : 'غير متاح')}
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">مفاوضات جارية</span>
                    <Button onClick={() => window.location.href = '/workspace/negotiation'} className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] px-3 py-1 font-bold">
                      فتح المفاوضة ❯
                    </Button>
                  </div>
                </div>

                {/* Card 3: Shipments requiring confirmation */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">شحنات تحتاج تأكيد</span>
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded-full font-mono">قيد الشحن</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {isPOsLoading ? '...' : (pendingPOsCount !== null ? `${pendingPOsCount} شحنة` : 'غير متاح')}
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">تأكيد التوريد والضمان</span>
                    <Button onClick={() => window.location.href = '/workspace/execution'} className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] px-3 py-1 font-bold">
                      متابعة الشحن ❯
                    </Button>
                  </div>
                </div>

                {/* Card 4: Financial obligations / Outstanding Due Invoices Amount */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-slate-400">الفواتير المستحقة</span>
                    <span className="bg-slate-500/10 text-slate-300 border border-slate-500/20 text-[10px] px-2 py-0.5 rounded-full font-mono">FINANCE</span>
                  </div>
                  <div className="text-2xl font-black text-slate-300 font-mono">
                    {isInvoicesLoading ? '...' : (outstandingInvoicesAmount !== null ? `SAR ${outstandingInvoicesAmount.toLocaleString()}` : 'غير متاح')}
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                    <span className="text-slate-400">سجل الفواتير المستحقة</span>
                    <Button onClick={() => window.location.href = '/merchant/passport'} className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] px-3 py-1 font-bold">
                      جواز السفر ❯
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'PERFORMANCE_METRICS' && (
            <div className="space-y-6">
              <h2 className="text-lg font-black text-white">مؤشرات الأداء الرقمية الحقيقية (Factual History Metrics)</h2>
              
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <span className="text-xs text-slate-400 block">إجمالي العروض</span>
                  <strong className="text-2xl font-black text-white font-mono">
                    {isStatsLoading ? '...' : (sellerStats?.totalQuotes ?? '0')}
                  </strong>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">العروض المقبولة</span>
                  <strong className="text-2xl font-black text-emerald-400 font-mono">
                    {isStatsLoading ? '...' : (sellerStats?.acceptedQuotes ?? '0')}
                  </strong>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">نسبة الفوز</span>
                  <strong className="text-2xl font-black text-indigo-400 font-mono">
                    {isStatsLoading ? '...' : (sellerStats?.winRate ?? '0%')}
                  </strong>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">الباقة النشطة</span>
                  <strong className="text-2xl font-black text-amber-400 font-mono">
                    {isStatsLoading ? '...' : (sellerStats?.plan || 'PRO')}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {activeModule === 'ORDERS_AND_FULFILLMENT' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-white">الطلبات وأوامر الشراء (Orders & Fulfillment)</h2>
                  <p className="text-xs text-slate-400 mt-1">مراجعة وتأكيد أوامر الشراء الصادرة من المشتري ومتابعة الشحن للتوريد.</p>
                </div>
              </div>

              {isPOsLoading ? (
                <div className="p-8 text-center text-slate-400 text-xs font-mono animate-pulse">جاري تحميل أوامر الشراء الصادرة...</div>
              ) : !sellerPOsData?.data || sellerPOsData.data.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-2">
                  <div className="text-3xl">📦</div>
                  <h3 className="text-sm font-bold text-white">لا توجد أوامر شراء صادرة حالياً</h3>
                  <p className="text-xs text-slate-400">ستظهر هنا جميع أوامر الشراء المعتمدة فور ترسية المنافسات وتأكيد المشتري.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sellerPOsData.data.map((po) => (
                    <div key={po.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
                      <div className="flex flex-wrap justify-between items-center gap-3 border-b border-slate-800 pb-3">
                        <div>
                          <span className="text-xs font-mono font-bold text-indigo-400">أمر شراء رقم #{po.purchaseOrderNumber || po.id?.substring(0, 8)}</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">تاريخ الإصدار: {new Date(po.createdAt).toLocaleDateString('ar-SA')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                            po.businessStatus === 'accepted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            po.businessStatus === 'issued' || po.businessStatus === 'draft' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}>
                            الحالة: {po.businessStatus === 'accepted' ? 'تمت موافقة المورد (Accepted)' : 'بانتظار موافقة المورد (Pending Acceptance)'}
                          </span>
                        </div>
                      </div>

                      {/* PO Line Items Snapshot */}
                      <div className="space-y-2">
                        <div className="text-[11px] font-bold text-slate-400">تفاصيل العقد والشروط المجمدة (Frozen Commercial Snapshot):</div>
                        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 space-y-2 text-xs">
                          {po.lines && po.lines.length > 0 ? (
                            po.lines.map((line, idx) => (
                              <div key={line.id || idx} className="flex justify-between items-center text-slate-300">
                                <span>صنف رقم #{line.productDNAId?.substring(0, 8) || (idx + 1)}</span>
                                <span className="font-mono text-slate-400">الكمية: {line.quantity} × {line.unitPrice} SAR</span>
                              </div>
                            ))
                          ) : (
                            <div className="flex justify-between items-center text-slate-300">
                              <span>إجمالي قيمة أمر الشراء الأصلي</span>
                              <span className="font-mono font-bold text-emerald-400">SAR {Number(po.totalAmount || 0).toLocaleString()}</span>
                            </div>
                          )}
                          <div className="border-t border-slate-800 pt-2 flex justify-between items-center font-bold text-white">
                            <span>المبلغ الإجمالي المعتمد:</span>
                            <span className="font-mono text-emerald-400">SAR {Number(po.totalAmount || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Footer */}
                      <div className="flex flex-wrap justify-end gap-3 pt-2">
                        {po.businessStatus !== 'accepted' ? (
                          <Button
                            disabled={acceptPOMutation.isPending}
                            onClick={() => {
                              if (window.confirm('هل أنت متأكد من قبول أمر الشراء والتأكيد النهائي للمشتري؟')) {
                                acceptPOMutation.mutate(po.id, {
                                  onSuccess: () => {
                                    alert('تم قبول أمر الشراء بنجاح! تم تحويل حالة الطلب إلى مقبول وتجهيزه للشحن.');
                                  },
                                  onError: (err) => {
                                    alert(err?.message || 'حدث خطأ أثناء قبول أمر الشراء.');
                                  }
                                });
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50">
                            {acceptPOMutation.isPending ? 'جاري القبول...' : '✓ قبول أمر الشراء (Accept PO)'}
                          </Button>
                        ) : (
                          <>
                            {/* State 1: pending -> start preparation */}
                            {po.fulfillmentStatus === 'pending' && (
                              <Button
                                disabled={startPrepMutation.isPending}
                                onClick={() => {
                                  startPrepMutation.mutate(po.id, {
                                    onSuccess: () => alert('تم بدء تجهيز الطلب بنجاح.'),
                                    onError: (err) => alert(err?.message || 'حدث خطأ أثناء بدء التجهيز.')
                                  });
                                }}
                                className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-600/20 disabled:opacity-50">
                                {startPrepMutation.isPending ? 'جاري بدء التجهيز...' : '⚙️ بدء تجهيز الطلب (Start Preparation)'}
                              </Button>
                            )}

                            {/* State 2: preparing -> mark ready to ship */}
                            {po.fulfillmentStatus === 'preparing' && (
                              <Button
                                disabled={markReadyMutation.isPending}
                                onClick={() => {
                                  markReadyMutation.mutate(po.id, {
                                    onSuccess: () => alert('تم تأكيد تجهيز الطلب كـ جاهز للشحن.'),
                                    onError: (err) => alert(err?.message || 'حدث خطأ أثناء التحديث.')
                                  });
                                }}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50">
                                {markReadyMutation.isPending ? 'جاري تحديث الحالة...' : '📦 تم التجهيز / جاهز للشحن (Mark Ready)'}
                              </Button>
                            )}

                            {/* State 3: ready_to_ship OR partially_shipped -> open create shipment modal */}
                            {(po.fulfillmentStatus === 'ready_to_ship' || po.fulfillmentStatus === 'partially_shipped') && (
                              <Button
                                onClick={() => {
                                  commercialService.getFulfillmentSummary(po.id).then((res) => {
                                    const summaryData = res?.data || {};
                                    const summaryLines = summaryData.lines || [];
                                    const initialLines = (po.lines || []).map(line => {
                                      const lineSummary = summaryLines.find(l => l.purchaseOrderLineId === line.id);
                                      const remainingQty = lineSummary ? lineSummary.remainingQuantity : (parseFloat(line.quantity) || 0);
                                      return {
                                        purchaseOrderLineId: line.id,
                                        quantityShipped: Math.min(remainingQty, parseFloat(line.quantity) || 1),
                                        orderedQuantity: parseFloat(line.quantity) || 0,
                                        remainingQuantity: remainingQty
                                      };
                                    });
                                    setShipmentFormData({ carrier: '', trackingNumber: '', lines: initialLines });
                                    setActiveShipmentModalPO(po);
                                  }).catch(() => {
                                    const initialLines = (po.lines || []).map(line => ({
                                      purchaseOrderLineId: line.id,
                                      quantityShipped: parseFloat(line.quantity) || 1,
                                      orderedQuantity: parseFloat(line.quantity) || 0,
                                      remainingQuantity: parseFloat(line.quantity) || 0
                                    }));
                                    setShipmentFormData({ carrier: '', trackingNumber: '', lines: initialLines });
                                    setActiveShipmentModalPO(po);
                                  });
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20">
                                🚚 + إنشاء وتأكيد شحنة جديدة (Create Shipment)
                              </Button>
                            )}

                            {/* State 4: shipped / received status badges */}
                            {po.fulfillmentStatus === 'shipped' && (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-4 py-2 rounded-xl font-bold">
                                ✓ تم شحن أمر الشراء بالكامل (Shipped)
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Interactive Shipment Creation Modal */}
              {activeShipmentModalPO && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-lg space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <h3 className="text-sm font-bold text-white">إنشاء شحنة لأمر الشراء #{activeShipmentModalPO.purchaseOrderNumber || activeShipmentModalPO.id?.substring(0, 8)}</h3>
                      <button onClick={() => setActiveShipmentModalPO(null)} className="text-slate-400 hover:text-white text-xs">✕ إغلاق</button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1 font-bold">شركة الشحن (Carrier):</label>
                        <input
                          type="text"
                          placeholder="مثال: DHL / Aramex / توريد مباشر"
                          value={shipmentFormData.carrier}
                          onChange={(e) => setShipmentFormData({ ...shipmentFormData, carrier: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-bold">رقم التتبع التجاري (Tracking Number):</label>
                        <input
                          type="text"
                          placeholder="مثال: TRK-99281203"
                          value={shipmentFormData.trackingNumber}
                          onChange={(e) => setShipmentFormData({ ...shipmentFormData, trackingNumber: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <span className="block font-bold text-slate-400">كميات أصناف الشحنة (Physical Quantities):</span>
                        {activeShipmentModalPO.lines && activeShipmentModalPO.lines.map((line, idx) => {
                          const formLine = shipmentFormData.lines.find(l => l.purchaseOrderLineId === line.id);
                          const remainingQty = formLine?.remainingQuantity !== undefined ? formLine.remainingQuantity : (parseFloat(line.quantity) || 0);
                          const isFullyShipped = remainingQty <= 0;

                          return (
                            <div key={line.id || idx} className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                              <span className="text-slate-300">
                                صنف #{line.productDNAId?.substring(0, 8) || (idx + 1)} (المتبقي: {remainingQty} من {line.quantity})
                                {isFullyShipped && <span className="text-[10px] text-emerald-400 font-bold mr-2">(تم الشحن بالكامل)</span>}
                              </span>
                              {!isFullyShipped ? (
                                <input
                                  type="number"
                                  min="1"
                                  max={remainingQty}
                                  value={formLine?.quantityShipped ?? remainingQty}
                                  onChange={(e) => {
                                    const parsedVal = parseFloat(e.target.value) || 0;
                                    const clampedQty = Math.min(remainingQty, Math.max(0, parsedVal));
                                    const updatedLines = shipmentFormData.lines.map(l =>
                                      l.purchaseOrderLineId === line.id ? { ...l, quantityShipped: clampedQty, quantityPacked: clampedQty, quantityLoaded: clampedQty } : l
                                    );
                                    setShipmentFormData({ ...shipmentFormData, lines: updatedLines });
                                  }}
                                  className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center text-white font-mono"
                                />
                              ) : (
                                <span className="text-xs font-mono text-slate-500 font-bold">0</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                      <Button onClick={() => setActiveShipmentModalPO(null)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs px-4 py-2">
                        إلغاء
                      </Button>
                      <Button
                        disabled={createShipmentMutation.isPending || dispatchShipmentMutation.isPending}
                        onClick={() => {
                          createShipmentMutation.mutate({
                            poId: activeShipmentModalPO.id,
                            carrier: shipmentFormData.carrier,
                            trackingNumber: shipmentFormData.trackingNumber,
                            lines: shipmentFormData.lines
                          }, {
                            onSuccess: (createdShipmentData) => {
                              const createdShipmentId = createdShipmentData?.data?.id || createdShipmentData?.id;
                              if (createdShipmentId) {
                                dispatchShipmentMutation.mutate(createdShipmentId, {
                                  onSuccess: () => {
                                    alert('تم إنشاء الشحنة وتأكيد إرسالها بنجاح!');
                                    setActiveShipmentModalPO(null);
                                  },
                                  onError: (err) => alert('تم إنشاء الشحنة ولكن حدث خطأ في التأكيد: ' + (err?.message || ''))
                                });
                              } else {
                                alert('تم إنشاء الشحنة بنجاح.');
                                setActiveShipmentModalPO(null);
                              }
                            },
                            onError: (err) => alert(err?.message || 'حدث خطأ أثناء إنشاء الشحنة.')
                          });
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-lg shadow-emerald-600/20 disabled:opacity-50">
                        {createShipmentMutation.isPending || dispatchShipmentMutation.isPending ? 'جاري التنفيذ...' : '✓ إنشاء وتأكيد الشحنة (Dispatch)'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeModule !== 'TODAY_BUSINESS' && activeModule !== 'PERFORMANCE_METRICS' && activeModule !== 'ORDERS_AND_FULFILLMENT' && (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center space-y-3">
              <div className="text-3xl">⚙️</div>
              <h3 className="text-sm font-bold text-white">وحدة {activeModule} مفعلة وجاهزة بنظام الصلاحيات الديناميكي</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">تتم إدارة ومراقبة هذه الوحدة بالكامل من محرك التحكم السيادي دون الحاجة لإعادة كتابة الكود.</p>
            </div>
          )}
        </main>

      </div>
    </div>
  );
};
