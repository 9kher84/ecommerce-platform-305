# 🐞 تقرير إصلاح دالة getAllRequests

## 📋 الملخص
تم إصلاح خلل حرج في دالة `getAllRequests` في الملف `backend/services/requestService.js` كان يتسبب في:
- فشل التصنيف والبحث
- عدم إظهار الطلبات المنشورة للزوار/المشترين غير المُميّزين بشكل صحيح
- عرض طلبات المستخدم نفسه في قائمة التصفح العامة
- عرض طلبات منتهية الصلاحية

## 🔧 التحديثات المطبقة

### 1. **فلترة الحالة الافتراضية (Mandatory Status Filter)**
```javascript
status: { [Op.in]: ['published', 'negotiating'] }
```
- الآن تظهر **فقط** الطلبات في حالة `published` أو `negotiating`
- لن تظهر الطلبات في حالة `draft`، `cancelled`، `completed`، أو `failed`

### 2. **فلترة تاريخ الانتهاء (Mandatory Expiration Filter)**
```javascript
expiresAt: { [Op.gt]: new Date() }
```
- تظهر فقط الطلبات التي لم تنته صلاحيتها بعد
- يتم استبعاد الطلبات المنتهية تلقائياً

### 3. **استثناء طلبات المستخدم نفسه**
```javascript
if (user && user.role !== 'admin' && user.role !== 'super_admin') {
  where.userId = { [Op.ne]: user.id };
}
```
- المستخدمون العاديون لا يرون طلباتهم الخاصة في قائمة التصفح العامة
- المسؤولون (`admin` و `super_admin`) يمكنهم رؤية جميع الطلبات

### 4. **فلتر التصنيف (Category Filter)**
```javascript
if (filters.categoryId) {
  where.categoryId = filters.categoryId;
}
```
- يعمل فلتر التصنيف بشكل صحيح الآن
- يمكن للمستخدمين تصفية الطلبات حسب التصنيف

### 5. **فلتر البحث النصي (Search Filter)**
```javascript
if (filters.searchQuery) {
  const searchKeyword = `%${filters.searchQuery}%`; 
  
  where[Op.and] = [
    { ...where },
    {
      [Op.or]: [
        { title: { [Op.iLike]: searchKeyword } },
        { description: { [Op.iLike]: searchKeyword } }
      ]
    }
  ];
  
  // مسح الشروط القديمة لتجنب التكرار
  delete where.status; 
  delete where.expiresAt;
  if (where.userId) delete where.userId; 
  if (where.categoryId) delete where.categoryId; 
}
```
- البحث النصي يعمل على حقلي `title` و `description`
- البحث غير حساس لحالة الأحرف (case-insensitive) باستخدام `Op.iLike`
- يتم دمج شروط البحث مع جميع الشروط الأخرى بشكل صحيح

## ✅ النتائج المتوقعة

بعد هذا الإصلاح، يجب أن:

1. ✅ **التصنيف يعمل**: يمكن تصفية الطلبات حسب التصنيف
2. ✅ **البحث يعمل**: يمكن البحث في العنوان والوصف
3. ✅ **الطلبات المنشورة فقط**: تظهر فقط الطلبات في حالة `published` أو `negotiating`
4. ✅ **الطلبات النشطة فقط**: لا تظهر الطلبات المنتهية
5. ✅ **استثناء طلبات المستخدم**: لا يرى المستخدم طلباته الخاصة في قائمة التصفح
6. ✅ **صلاحيات المسؤولين**: المسؤولون يمكنهم رؤية جميع الطلبات

## 🧪 اختبار الإصلاح

### اختبار 1: التصنيف
```javascript
// يجب أن يعرض فقط الطلبات من التصنيف المحدد
const requests = await RequestService.getAllRequests({ categoryId: 1 }, user);
```

### اختبار 2: البحث النصي
```javascript
// يجب أن يعرض الطلبات التي تحتوي على "كمبيوتر" في العنوان أو الوصف
const requests = await RequestService.getAllRequests({ searchQuery: 'كمبيوتر' }, user);
```

### اختبار 3: استثناء طلبات المستخدم
```javascript
// يجب ألا تحتوي النتائج على طلبات المستخدم نفسه
const requests = await RequestService.getAllRequests({}, user);
const myRequests = requests.filter(r => r.userId === user.id);
console.assert(myRequests.length === 0, 'لا يجب أن يرى المستخدم طلباته الخاصة');
```

### اختبار 4: الطلبات المنشورة فقط
```javascript
// يجب أن تحتوي النتائج فقط على طلبات published أو negotiating
const requests = await RequestService.getAllRequests({}, user);
const invalidStatuses = requests.filter(r => 
  !['published', 'negotiating'].includes(r.status)
);
console.assert(invalidStatuses.length === 0, 'يجب أن تكون جميع الطلبات منشورة أو قيد التفاوض');
```

## 📝 ملاحظات إضافية

### منطق الخصوصية (Privacy Logic)
تم الحفاظ على منطق الخصوصية الموجود:
- **الزوار غير المسجلين**: يرون معلومات محدودة فقط
- **المستخدمون المسجلون**: يرون تفاصيل أكثر
- **البائعون بخطة B**: يرون جميع التفاصيل
- **المسؤولون**: يرون كل شيء

### التوافق مع Frontend
يجب التأكد من أن Frontend يمرر المعاملات التالية:
- `filters.categoryId` - لفلترة التصنيف
- `filters.searchQuery` - للبحث النصي
- `filters.limit` - لتحديد عدد النتائج (افتراضي: 100)

## 🔍 الكود المحدث

الملف: `backend/services/requestService.js`
الدالة: `getAllRequests` (السطور 201-291)

تاريخ التحديث: 2025-12-02
الحالة: ✅ تم التطبيق والتحقق من بناء الجملة
