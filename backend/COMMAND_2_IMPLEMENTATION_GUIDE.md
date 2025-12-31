# ⚠️ URGENT: File Corruption & Command 2 Implementation Guide

**التاريخ**: 2025-11-29  
**الحالة**: ملف `services/requestService.js` تعرض للتلف أثناء التعديل

---

## 🚨 **المشكلة**

أثناء محاولة تطبيق **Command 2 (Strict Status Transition Logic)**، تعرض ملف `services/requestService.js` للتلف بسبب خطأ في عملية الاستبدال.

### الملفات المتأثرة:
- ✅ `services/requestService.js` - **تالف** (يحتاج إلى استعادة)
- ✅ `services/requestService.js.backup` - **تالف أيضاً** (نفس المشكلة)

---

## 🔧 **الحل المطلوب**

### الخطوة 1: استعادة الملف

يجب استعادة ملف `services/requestService.js` من نسخة احتياطية صحيحة. إذا لم تكن متوفرة، يجب إعادة إنشاء الملف.

**الخيارات**:
1. استعادة من version control (إن وُجد)
2. استعادة من نسخة احتياطية خارجية
3. إعادة كتابة الملف من الصفر (غير مستحسن)

---

## 📋 **Command 2: التطبيق المطلوب**

بعد استعادة الملف، يجب تطبيق التعديلات التالية:

### 1️⃣ **إضافة خريطة انتقالات الحالة**

في **بداية الملف** (بعد الـ imports وقبل تعريف الـ class):

```javascript
const { PurchaseRequest, User, Category, Deal, PriceQuote } = require('../sequelize_setup');
const SubscriptionService = require('./subscriptionService');
const StatusTransitionService = require('./statusTransitionService');
const { Op } = require('sequelize');

/**
 * ========================================================================
 * COMMAND 2: STATE MACHINE - STATUS TRANSITION MAP
 * ========================================================================
 * خريطة الانتقالات المسموح بها بين حالات المنشور
 * يمنع هذا المنطق أي انتقال غير منطقي (مثل: published → completed مباشرة)
 * المدير (admin) فقط يمكنه تجاوز هذه القيود
 */
const STATUS_TRANSITIONS = {
    'draft': ['published', 'cancelled'],
    'published': ['negotiating', 'cancelled'],
    'negotiating': ['accepted', 'cancelled'],
    'accepted': ['completed', 'failed', 'cancelled'],
    // الحالات النهائية - لا يمكن التحويل منها
    'completed': [],
    'failed': [],
    'cancelled': []
};

/**
 * RequestService
 * 
 * Manages purchase requests (buyers posting what they want to buy)
 * Includes Commands 4 & 5: Completed posts visibility logic
 */
class RequestService {
    // ... rest of the class
}
```

---

### 2️⃣ **تحديث دالة transitionRequestStatus**

ابحث عن الدالة `static async transitionRequestStatus(requestId, newStatus, user)` وقم بتحديثها:

```javascript
/**
 * ========================================================================
 * COMMAND 2: STRICT STATUS TRANSITION LOGIC
 * ========================================================================
 * المسؤول الوحيد عن تغيير حالة أي PurchaseRequest
 * @param {number} requestId - Request ID
 * @param {string} newStatus - الحالة الجديدة المطلوبة
 * @param {Object} user - كائن المستخدم (يجب أن يحتوي على id و role)
 * @returns {Promise<PurchaseRequest>}
 */
static async transitionRequestStatus(requestId, newStatus, user) {
    const request = await PurchaseRequest.findByPk(requestId, {
        include: [
            { model: User, as: 'Buyer', attributes: ['id', 'subscriptionTier'] }
        ]
    });

    if (!request) {
        throw new Error('Request not found');
    }

    const currentStatus = request.status;

    // ========================================================================
    // ADMIN BYPASS: المسؤولون يمكنهم تغيير الحالة إلى أي شيء دون قيود
    // ========================================================================
    if (user.role === 'admin' || user.role === 'super_admin') {
        await request.update({ status: newStatus });
        console.log(`✅ Admin ${user.id} changed request ${requestId} from ${currentStatus} to ${newStatus}`);
        return request;
    }

    // ========================================================================
    // STRICT TRANSITION VALIDATION (Command 2 - Core Logic)
    // ========================================================================
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus];

    // ⚠️ تطبيق المنطق الصارم: إذا كانت الحالة الجديدة غير مسموح بها
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
        throw new Error(
            `❌ FORBIDDEN STATUS TRANSITION: Cannot change request status from "${currentStatus}" to "${newStatus}". ` +
            `Allowed transitions: ${allowedTransitions?.join(', ') || 'none'}`
        );
    }

    // ========================================================================
    // AUTHORIZATION CHECKS (التحقق من الصلاحيات)
    // ========================================================================

    // فقط المشتري صاحب الطلب يمكنه تغيير الحالة
    if (request.buyerId !== user.id) {
        throw new Error('UNAUTHORIZED: Only the request owner can change its status');
    }

    // ========================================================================
    // BUSINESS LOGIC VALIDATIONS
    // ========================================================================

    // لا يمكن قبول الطلب إلا إذا كان هناك عرض سعر مقبول
    if (newStatus === 'accepted') {
        const acceptedQuote = await PriceQuote.findOne({
            where: {
                purchaseRequestId: requestId,
                status: 'accepted'
            }
        });

        if (!acceptedQuote) {
            throw new Error('Cannot accept request: No accepted quote found. You must accept a quote first.');
        }
    }

    // تنفيذ التحويل
    await request.update({ status: newStatus });
    console.log(`✅ Status transition: Request ${requestId} from ${currentStatus} to ${newStatus} by user ${user.id}`);

    return request;
}
```

---

## 🎯 **الإثبات المطلوب (Command 2 - Final Closure)**

بعد تطبيق التعديلات، يجب تقديم:

### ✅ **Snippet 1: خريطة STATUS_TRANSITIONS**

```javascript
const STATUS_TRANSITIONS = {
    'draft': ['published', 'cancelled'],
    'published': ['negotiating', 'cancelled'],
    'negotiating': ['accepted', 'cancelled'],
    'accepted': ['completed', 'failed', 'cancelled'],
    'completed': [],
    'failed': [],
    'cancelled': []
};
```

### ✅ **Snippet 2: منطق التحقق من التسلسل**

```javascript
// داخل دالة transitionRequestStatus

// التحقق من صلاحية المدير لتجاوز القيود
if (user.role !== 'admin') {
    const allowedTransitions = STATUS_TRANSITIONS[request.status];

    // ⚠️ تطبيق المنطق الصارم
    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
        throw new Error(
            `Forbidden Status Transition: Cannot change request status from ${request.status} to ${newStatus}. ` +
            `Allowed: ${allowedTransitions.join(', ')}`
        );
    }
}
```

---

## 🧪 **اختبار التطبيق**

بعد التطبيق، يجب اختبار السيناريوهات التالية:

### ✅ **سيناريوهات النجاح**
1. `draft` → `published` ✅
2. `published` → `negotiating` ✅
3. `negotiating` → `accepted` ✅
4. `accepted` → `completed` ✅

### ❌ **سيناريوهات الفشل (يجب أن ترفض)**
1. `published` → `completed` ❌ (تخطي negotiating/accepted)
2. `draft` → `accepted` ❌ (تخطي published/negotiating)
3. `completed` → `published` ❌ (من حالة نهائية)
4. `cancelled` → `published` ❌ (من حالة نهائية)

### ✅ **استثناء المدير**
- Admin يمكنه تنفيذ أي انتقال بغض النظر عن القيود ✅

---

## 📊 **الحالة الحالية**

| المتطلب | الحالة | الملاحظات |
|---------|--------|-----------|
| استعادة الملف | ⏳ معلق | يحتاج إلى تدخل يدوي |
| إضافة STATUS_TRANSITIONS | ⏳ معلق | بعد استعادة الملف |
| تحديث transitionRequestStatus | ⏳ معلق | بعد استعادة الملف |
| الاختبار | ⏳ معلق | بعد التطبيق |

---

## 🚀 **الخطوات التالية**

1. **استعادة الملف** من نسخة احتياطية صحيحة
2. **تطبيق التعديلات** المذكورة أعلاه
3. **اختبار السيناريوهات** للتأكد من عمل المنطق
4. **تقديم الإثبات** (Snippets) للتأكيد

---

## ⚠️ **ملاحظة مهمة**

الملف الحالي (`services/requestService.js`) **تالف** ويحتوي على:
- أحرف مشوهة (encoding issues)
- بنية غير صحيحة (missing class declaration)
- imports مفقودة

**يجب استعادته قبل المتابعة!**

---

**📅 تاريخ التقرير**: 2025-11-29 الساعة 09:11 صباحاً  
**⚠️ الأولوية**: عالية جداً - يجب حل المشكلة قبل المتابعة
