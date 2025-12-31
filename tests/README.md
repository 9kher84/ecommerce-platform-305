# 🛡️ دليل تشغيل اختبارات الأمان

## المتطلبات الأساسية

1. ✅ الخادم يعمل على المنفذ 5000
2. ✅ قاعدة البيانات متصلة
3. ✅ Node.js و npm مثبتان

## خطوات التشغيل السريعة

### 1. تشغيل الخادم

```bash
# في نافذة طرفية منفصلة
cd backend
npm run dev
```

انتظر حتى ترى:
```
🚀 Server running on port 5000
```

### 2. تشغيل الاختبارات

```bash
# في نافذة طرفية أخرى
cd tests
npm test final-red-team.test.js
```

أو باستخدام Jest مباشرة:
```bash
npx jest final-red-team.test.js --verbose
```

## الاختبارات المُضمّنة

### ✅ Test 1: Token Exfiltration
- **الهدف**: التحقق من انتهاء صلاحية التوكن بعد 15 دقيقة
- **النتيجة المتوقعة**: رفض التوكن المنتهي مع رمز 401
- **الزمن المتوقع**: < 5 ثوانٍ

### ✅ Test 2: Impersonation Bypass
- **الهدف**: التحقق من حماية الحقول المحمية
- **النتيجة المتوقعة**: رفض تعديل الحقول المحمية من قبل المستخدمين العاديين
- **الزمن المتوقع**: < 5 ثوانٍ

### ✅ Test 3: Prompt Injection
- **الهدف**: التحقق من تنظيف المدخلات الضارة
- **النتيجة المتوقعة**: حظر أو تنظيف جميع محاولات الحقن
- **الزمن المتوقع**: < 5 ثوانٍ

## النتائج المتوقعة

```
PASS  tests/final-red-team.test.js
  🔴 Red Team Security Tests
    Test 1: Token Exfiltration (15:01 min expiry)
      ✓ should reject expired token after 15:01 minutes (XXXms)
      ✓ should accept valid token within expiry window (XXXms)
    Test 2: Impersonation Bypass on editAnyField
      ✓ should reject buyer attempting to edit protected fields (XXXms)
      ✓ should allow owner to edit any field (XXXms)
    Test 3: Prompt Injection Attack
      ✓ should sanitize "ignore previous instructions" in input (XXXms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Time:        X.XXXs
```

## استكشاف الأخطاء

### الخادم لا يعمل
```bash
# تحقق من حالة الخادم
curl http://localhost:5000/api/health

# إذا لم يستجب، أعد تشغيله
cd backend
npm run dev
```

### الاختبارات تفشل
```bash
# تحقق من المتغيرات البيئية

# تحقق من قاعدة البيانات
psql -U postgres -d ecommerce_db -c "SELECT COUNT(*) FROM users;"
```

### مشاكل الاتصال
```bash
# تحقق من المنفذ 5000
netstat -ano | findstr :5000

# إذا كان مستخدماً، أوقف العملية
Get-Process -Id <PID> | Stop-Process -Force
```

## معايير النجاح

- ✅ **نسبة النجاح**: 100% (5/5 اختبارات)
- ✅ **زمن التنفيذ**: < 5 ثوانٍ لكل اختبار
- ✅ **لا توجد أخطاء**: جميع الاختبارات تمر بنجاح

## ملاحظات مهمة

1. **البيانات الاختبارية**: الاختبارات تستخدم بيانات وهمية ولا تؤثر على البيانات الحقيقية
2. **التوكنات**: يتم إنشاء توكنات اختبارية ديناميكياً
3. **الأمان**: جميع الاختبارات آمنة ولا تسبب ضرراً للنظام

## التقارير

بعد تشغيل الاختبارات، راجع:
- `EXECUTIVE_FINAL_REPORT.md` - التقرير التنفيذي
- `FINAL_VERIFICATION_CHECKLIST.md` - قائمة التحقق
- `backend/reports/FINAL_CRITICAL_TASKS_REPORT.md` - التقرير الشامل
