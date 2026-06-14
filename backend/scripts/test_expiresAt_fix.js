const { PurchaseRequest, User } = require('../sequelize_setup');
const RequestService = require('../services/requestService');

async function run() {
  try {
    // 1. Fix all existing requests (Migration)
    console.log("🔄 تحديث الطلبات الحالية التي لا تملك تاريخ انتهاء (expiresAt = NULL)...");
    const [updatedCount] = await PurchaseRequest.update(
      { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { where: { expiresAt: null } }
    );
    console.log(`✅ تم تحديث ${updatedCount} طلب بنجاح.\n`);

    // 2. Test new request creation
    console.log("📝 إنشاء طلب شراء جديد لاختبار الإصلاح الجذري...");
    
    // Find a buyer to create the request
    const buyer = await User.findOne({ where: { role: 'buyer' } });
    if (!buyer) {
      console.log("❌ لا يوجد buyer لإنشاء الطلب.");
      process.exit(1);
    }

    const newRequest = await RequestService.createRequest(buyer.id, {
      title: "Test Request - ExpiresAt Fix",
      description: "Testing expiresAt default value",
      categoryId: 1,
      sectorId: 1,
      quantity: 10,
      unit: "KG",
      post_type: "standard"
    });

    console.log("✅ تم إنشاء الطلب الجديد. قيمة expiresAt هي:");
    console.log(`👉 ${newRequest.expiresAt}`);
    
    // Publish it
    await RequestService.transitionRequestStatus(newRequest.id, "rfq_published", { actor: buyer });
    console.log(`✅ تم نشر الطلب بحالة: rfq_published\n`);

    // 3. Test getPublishedRequests
    console.log("🔍 اختبار دالة GET /api/requests/published...");
    const publishedRequests = await RequestService.getPublishedRequests(null, {});
    
    const found = publishedRequests.find(r => r.id === newRequest.id);
    if (found) {
      console.log(`✅ الإثبات القاطع: الطلب الجديد يظهر بنجاح في قائمة الطلبات المنشورة!`);
      console.log(`- ID: ${found.id}`);
      console.log(`- Status: ${found.status}`);
      console.log(`- ExpiresAt: ${found.expiresAt}`);
    } else {
      console.log(`❌ فشل: الطلب لم يظهر في القائمة.`);
    }

  } catch(e) {
    console.error('ERROR:', e.message);
  } finally {
    process.exit(0);
  }
}

run();
