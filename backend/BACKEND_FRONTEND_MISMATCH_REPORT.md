# تقرير شامل: مشاكل عدم التطابق بين Backend و Frontend

**التاريخ:** 2025-12-01  
**الخطأ الرئيسي:** 500 Internal Server Error في `GET /api/requests`  
**التأثير:** عدم قدرة المستخدمين على تصفح الصفحة الرئيسية (HomePage)

---

## 1. المشكلة الأساسية: عدم تطابق أسماء العلاقات (Association Names)

### الوصف:

يوجد تعارض في تسمية العلاقات بين نموذج `PurchaseRequest` ونموذج `Category` في قاعدة البيانات.

### التفاصيل الفنية:

#### في `sequelize_setup.js` (السطر 417):

```javascript
model: Category,
attributes: ['id', 'name_ar', 'name_en']
// لا يوجد اسم مستعار (alias) محدد
```

#### في `RequestService.js` (السطر 417-419):

```javascript
{
    model: Category,
    attributes: ['id', 'name_ar', 'name_en']
}
```

### المشكلة:

- عند استدعاء `PurchaseRequest.findAll()` مع `include: [{ model: Category }]`، يجب أن يكون هناك علاقة معرفة بشكل صحيح في `sequelize_setup.js`
- العلاقة الحالية في `sequelize_setup.js` (السطر 536):
  ```javascript
  Category.hasMany(PurchaseRequest, {
    foreignKey: "categoryId",
    as: "requests",
  });
  ```
- لكن العلاقة العكسية `PurchaseRequest.belongsTo(Category)` تستخدم اسم مستعار `'category'` (السطر 540):
  ```javascript
  PurchaseRequest.belongsTo(Category, {
    foreignKey: "categoryId",
    as: "category",
  });
  ```

### النتيجة:

عند محاولة `include` الـ `Category` في `getAllRequests`، يحدث خطأ لأن Sequelize لا يجد العلاقة بالاسم الصحيح.

---

## 2. المشكلة الثانوية: عدم تطابق هيكل البيانات المُرجعة

### الوصف:

Frontend يتوقع حقول معينة بأسماء محددة، لكن Backend يُرجع أسماء مختلفة.

### التفاصيل:

#### في `RequestService.getAllRequests()` (السطر 451):

```javascript
category: plainReq.category,  // ❌ خطأ: plainReq.category غير موجود
```

**السبب:**

- عند استخدام `req.get({ plain: true })`، يتم تحويل الكائن إلى JSON عادي
- الـ `Category` المُضمّن يصبح بالاسم المستعار المحدد في العلاقة
- في حالتنا، الاسم المستعار هو `'category'` (بحرف صغير)
- لكن عند عدم وجود علاقة صحيحة، `plainReq.category` سيكون `undefined`

#### في `HomePage.jsx` (السطر 57):

```javascript
const catId = request.categoryId; // ✅ صحيح
```

**لكن:**
Frontend يتوقع أيضاً وجود `request.category` (كائن Category كامل) في بعض الأماكن، بينما Backend قد لا يُرجعه بسبب خطأ العلاقة.

---

## 3. مشكلة إضافية: عدم تطابق في حقل `Buyer/user`

### الوصف:

تم تغيير اسم العلاقة من `Buyer` إلى `user` في التعديلات الأخيرة، لكن بعض الأجزاء لم تُحدّث.

### التفاصيل:

#### في `RequestService.getAllRequests()` (السطر 458):

```javascript
buyer: { name: 'مشتري' },  // ❌ خطأ: Frontend قد يتوقع 'user' بدلاً من 'buyer'
```

#### في `RequestService.getAllRequests()` (السطر 472):

```javascript
plainReq.user = { ...plainReq.user, name: "مشتري مخفي" }; // ✅ صحيح
```

**التعارض:**

- للزوار (Guests): يُرجع `buyer: { name: 'مشتري' }`
- للمستخدمين المسجلين: يُرجع `user: { ... }`
- هذا يخلق عدم اتساق في هيكل البيانات

---

## 4. مشكلة في `getPublishedRequests()`

### الوصف:

نفس مشكلة العلاقات موجودة في `getPublishedRequests()`.

### التفاصيل:

#### في `RequestService.getPublishedRequests()` (السطر 388-396):

```javascript
const requests = await PurchaseRequest.findAll({
  where,
  include: [
    {
      model: User,
      as: "user", // ✅ صحيح
      attributes: ["id", "name", "subscriptionTier", "rank"],
    },
  ],
  // ❌ خطأ: لا يوجد include للـ Category
  order: [["createdAt", "DESC"]],
  limit: filters.limit || 50,
});
```

**المشكلة:**

- لا يتم تضمين `Category` في `getPublishedRequests()`
- إذا كان Frontend يتوقع `request.category`، سيحصل على `undefined`

---

## 5. مشكلة في `getRequestDetails()`

### الوصف:

نفس مشكلة العلاقات، لكن هنا تؤثر على تفاصيل الطلب الفردي.

### التفاصيل:

#### في `RequestService.getRequestDetails()` (السطر 488-491):

```javascript
{
    model: Category,
    attributes: ['id', 'name_ar', 'name_en']
}
```

**المشكلة:**

- إذا لم تكن العلاقة محددة بشكل صحيح في `sequelize_setup.js`، سيفشل الاستعلام
- يجب استخدام `as: 'category'` إذا كانت العلاقة معرفة بهذا الاسم

---

## 6. مشكلة محتملة: عدم وجود بيانات في قاعدة البيانات

### الوصف:

عند اختبار `getBuyerRequests()` في السكريبت، أُرجع `0 requests`.

### التفاصيل:

```
Testing getBuyerRequests for user: 11111111-1111-1111-1111-111111111111 (مشتري مجاني)
Success! Requests found: 0
```

**التأثير:**

- إذا لم تكن هناك بيانات تجريبية في قاعدة البيانات، سيكون من الصعب اختبار الحلول
- قد يكون هذا سبباً إضافياً لعدم ظهور أي شيء في الواجهة الأمامية

---

## 7. ملخص المشاكل المكتشفة

| #   | المشكلة                                        | الموقع                      | الخطورة   |
| --- | ---------------------------------------------- | --------------------------- | --------- |
| 1   | عدم تطابق اسم العلاقة `Category`               | `RequestService.js:417`     | 🔴 حرجة   |
| 2   | استخدام `plainReq.category` بدون تحديد `as`    | `RequestService.js:451`     | 🔴 حرجة   |
| 3   | عدم اتساق في `buyer` vs `user`                 | `RequestService.js:458,472` | 🟡 متوسطة |
| 4   | عدم تضمين `Category` في `getPublishedRequests` | `RequestService.js:388-396` | 🟡 متوسطة |
| 5   | عدم وجود بيانات تجريبية                        | قاعدة البيانات              | 🟢 منخفضة |
| 6   | عدم تحديد `as: 'category'` في `include`        | جميع الدوال                 | 🔴 حرجة   |

---

## 8. السبب الجذري (Root Cause)

**المشكلة الأساسية:**
عند إعادة كتابة `RequestService.js` لتصحيح مشكلة `userId` vs `buyerId`، تم نسيان تحديث `include` statements لتتطابق مع أسماء العلاقات المعرفة في `sequelize_setup.js`.

**العلاقات الصحيحة في `sequelize_setup.js`:**

```javascript
// السطر 539
PurchaseRequest.belongsTo(User, { foreignKey: "userId", as: "user" });

// السطر 540
PurchaseRequest.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});
```

**الاستخدام الخاطئ في `RequestService.js`:**

```javascript
include: [
  {
    model: User,
    as: "user", // ✅ صحيح
    attributes: ["id", "name", "subscriptionTier", "rank"],
  },
  {
    model: Category,
    // ❌ خطأ: لم يتم تحديد as: 'category'
    attributes: ["id", "name_ar", "name_en"],
  },
];
```

---

## 9. التأثير على المستخدم النهائي

1. **الصفحة الرئيسية (HomePage):** لا تُحمّل أي طلبات (500 Error)
2. **لوحة تحكم المشتري (BuyerDashboard):** قد تعمل لأنها تستخدم `getBuyerRequests` (تم إصلاحها)
3. **تفاصيل الطلب:** قد تفشل إذا كانت تعتمد على `Category`
4. **البحث والفلترة:** لا تعمل بسبب فشل `getAllRequests`

---

## 10. الخلاصة

المشكلة الرئيسية هي **عدم تحديد `as: 'category'`** في جميع استعلامات `include` التي تتضمن `Category` في `RequestService.js`.

هذا يؤدي إلى فشل Sequelize في العثور على العلاقة الصحيحة، مما يسبب خطأ 500 في الخادم.

الحل يتطلب:

1. إضافة `as: 'category'` في جميع `include` statements للـ `Category`
2. التأكد من أن `plainReq.category` موجود قبل استخدامه
3. توحيد استخدام `user` بدلاً من `buyer` في جميع الأماكن
4. إضافة بيانات تجريبية لاختبار الحلول

---

**تم إعداد هذا التقرير بواسطة:** Antigravity AI  
**التاريخ:** 2025-12-01 01:03 UTC+3
