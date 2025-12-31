# خطة تنفيذ الميزات المتقدمة
## Advanced Features Implementation Plan

**تاريخ الإنشاء:** 2025-11-28
**الحالة:** قيد التنفيذ

---

## الأوامر السبعة | Seven Commands

### ✅ الأولوية 1: الأساسيات والأمان
**Command 2: تأمين دورة حياة المنشور (Status Control)**
- **الهدف:** منع التلاعب بالحالات وضمان تسلسل منطقي
- **المكونات المطلوبة:**
  - `backend/services/statusTransitionService.js` - الخدمة الوحيدة لتغيير الحالات
  - تحديث `requestService.js` لاستخدام الخدمة الجديدة
  - جدول انتقالات الحالة المسموحة
- **قواعد الانتقال:**
  ```
  draft → published
  published → negotiating
  published → accepted (مباشرة إذا قبل العرض)
  negotiating → accepted
  accepted → completed
  any → cancelled (admin only)
  ```

**Command 1: لوحة تحكم المدير (Admin Dashboard)**
- **الهدف:** التحكم الكامل بالمستخدمين والصلاحيات
- **API Endpoints:**
  - `GET /api/admin/users` - قائمة جميع المستخدمين
  - `PUT /api/admin/users/:id/tier` - تعديل subscriptionTier
  - `PUT /api/admin/users/:id/status` - تفعيل/تعطيل الحساب
  - `GET /api/admin/stats` - إحصائيات المنصة
- **Frontend Components:**
  - `AdminDashboard.jsx` - الصفحة الرئيسية
  - `UserManagement.jsx` - إدارة المستخدمين
  - `UserEditModal.jsx` - تعديل بيانات المستخدم

---

### ✅ الأولوية 2: الحماية والوصول
**Command 3: حماية الملفات المرفقة المعدلة**
- **الهدف:** السماح للبائعين بالوصول عند التفاوض، تقييد بعد القبول
- **منطق الوصول:**
  ```javascript
  if (request.status === 'published' || request.status === 'negotiating') {
    // جميع البائعين المصادقين
    return isAuthenticated && user.role === 'seller';
  } else if (request.status === 'accepted' || request.status === 'completed') {
    // المشتري + البائع الفائز + Admin فقط
    return user.id === request.buyerId || 
           user.id === winningQuote.sellerId || 
           user.role === 'admin';
  }
  ```
- **Endpoint:** `GET /api/attachments/:id`

---

### ✅ الأولوية 3: الشفافية والرؤية
**Command 4: عرض المنشورات المكتملة (Completed Posts)**
- **قواعد الرؤية:**
  - **زائر/بائع عادي:** اسم المشتري، المواصفات، المدينة، البائع الفائز
  - **مشتري أ/ب:** كل ما سبق + السعر النهائي + المفاوضات (مجهولة)
- **التعديل:** `getRequestDetails()` في `requestService.js`

**Command 5: رؤية البائع فئة ب (Seller Plan B)**
- **الميزة:** رؤية كاملة للمنشورات المكتملة ما عدا أسماء المنافسين
- **البيانات المتاحة:**
  - اسم المشتري ✅
  - كل الإدخالات والمواصفات ✅
  - كل المفاوضات والأسعار ✅
  - أسماء البائعين المنافسين ❌

---

### ✅ الأولوية 4: ميزات خطة ب للمشتري
**Command 6: السعر الثابت (Fixed Price)**
- **الهدف:** إجبار البائعين على سعر محدد دون مزايدة
- **التعديلات:**
  - إضافة حقل `fixedPrice` لنموذج PurchaseRequest
  - رفض أي عروض لا تطابق `fixedPrice` بالضبط
  - تحديث `submitQuote()` للتحقق من السعر الثابت
- **UI:** إضافة خيار في `PostFormPage.jsx` (Plan B buyers only)

---

### ✅ الأولوية 5: ميزات خطة ب للبائع
**Command 7: مصفوفة التسعير الذكي (Smart Pricing Matrix)**
- **الهدف:** تسعير تلقائي ذكي بناءً على الكمية والمدينة
- **البنية:**
  ```javascript
  PriceMatrix {
    sellerId: UUID,
    categoryId: UUID,
    rules: [
      {
        quantityMin: 1,
        quantityMax: 100,
        cities: ['الرياض', 'جدة'],
        pricePerUnit: 50.00,
        deliveryFee: 100.00
      },
      // ... More rules
    ]
  }
  ```
- **API Endpoints:**
  - `POST /api/seller/pricing-matrix` - إنشاء/تحديث المصفوفة
  - `GET /api/seller/pricing-matrix` - جلب المصفوفة الحالية
  - `POST /api/seller/smart-quote/:requestId` - توليد عرض ذكي
- **نموذج DB:** `SellerPricingMatrix` في `sequelize_setup.js`
- **Frontend:** `SmartPricingConfig.jsx` في Seller Dashboard

---

## 📊 خطة التنفيذ | Execution Plan

### المرحلة 1: الأساسيات (2-3 ساعات)
1. ✅ Command 2: Status Transition Service
2. ✅ Command 1: Admin Dashboard Backend
3. ✅ Command 1: Admin Dashboard Frontend

### المرحلة 2: الحماية (1-2 ساعات)
4. ✅ Command 3: Attachment Protection

### المرحلة 3: الشفافية (2-3 ساعات)
5. ✅ Command 4: Completed Posts Visibility
6. ✅ Command 5: Seller Plan B Visibility

### المرحلة 4: Plan B Features (3-4 ساعات)
7. ✅ Command 6: Fixed Price
8. ✅ Command 7: Smart Pricing Matrix

---

## 🧪 خطة الاختبار | Testing Plan

### اختبارات الأمان
- [ ] محاولة تجاوز Status Transition
- [ ] محاولة الوصول لملفات محمية
- [ ] محاولة مشتري Free استخدام Fixed Price

### اختبارات الوظائف
- [ ] Admin يعدل tier لمستخدم
- [ ] بائع Plan B يرى تفاصيل كاملة
- [ ] Smart Pricing يحسب السعر صحيحاً

---

## 📝 ملاحظات تقنية

### Database Schema Updates
```sql
-- Add to PurchaseRequest
ALTER TABLE "PurchaseRequests" 
  ADD COLUMN "fixedPrice" DECIMAL(10,2),
  ADD COLUMN "isSmartPricingEnabled" BOOLEAN DEFAULT false;

-- Create SellerPricingMatrix
CREATE TABLE "SellerPricingMatrices" (
  "id" UUID PRIMARY KEY,
  "sellerId" UUID REFERENCES "Users"(id),
  "categoryId" UUID REFERENCES "Categories"(id),
  "rules" JSONB,
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
);
```

### Security Considerations
- جميع admin endpoints تتطلب `role === 'admin'`
- Status transitions تُسجل في جدول Audit Log
- Fixed Price comparisons تستخدم دقة عشرية مناسبة

---

## 🚀 الحالة الحالية | Current Status

**بدء التنفيذ:** 2025-11-28 13:15
**التقدم:** 0/7 أوامر مكتملة

---
