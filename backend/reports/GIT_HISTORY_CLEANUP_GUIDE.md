# 🔐 دليل تطهير Git History

## الخطوات المطلوبة

### 1. التحضير
```bash
# التأكد من وجود نسخة احتياطية
cd c:\Users\s9khr\sasasa\ecommerce-platformnn\backup_before_purge

# العودة للمشروع الأصلي
cd c:\Users\s9khr\sasasa\ecommerce-platform
```

### 2. تثبيت git-filter-repo (الطريقة الموصى بها)
```bash
# عبر pip
pip install git-filter-repo

# أو تحميل مباشر
# https://github.com/newren/git-filter-repo/releases
```

### 3. تطهير التاريخ
```bash
# إزالة .env من التاريخ بالكامل
git filter-repo --path .env --invert-paths
git filter-repo --path backend/.env --invert-paths
git filter-repo --path backend/config/vault_secrets.json --invert-paths

# إزالة أي ملفات أسرار أخرى
git filter-repo --path .env.production --invert-paths
git filter-repo --path .env.local --invert-paths
```

### 4. التحقق
```bash
# البحث عن أي أثر للأسرار
git log --all --full-history -- "*/.env"
git log --all --full-history -- "*/vault_secrets.json"

# يجب أن تكون النتيجة فارغة
```

### 5. إعادة الرفع (Force Push)
```bash
# تحذير: هذا سيعيد كتابة التاريخ
git push origin --force --all
git push origin --force --tags
```

### 6. إعلام الفريق
```
⚠️ تم إعادة كتابة Git History
يجب على جميع المطورين:
1. حذف النسخة المحلية
2. إعادة Clone من الريبو
```

## البديل: BFG Repo-Cleaner (أسرع)
```bash
# تحميل BFG
# https://rtyley.github.io/bfg-repo-cleaner/

# تشغيل التطهير
java -jar bfg.jar --delete-files .env
java -jar bfg.jar --delete-files vault_secrets.json

# تنظيف
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# رفع التغييرات
git push origin --force --all
```

## ملاحظات مهمة
- ✅ النسخة الاحتياطية موجودة في `ecommerce-platformnn/backup_before_purge`
- ⚠️ Force Push سيؤثر على جميع المطورين
- 🔒 تأكد من تحديث .gitignore قبل البدء
- 📝 وثّق العملية للمراجعة المستقبلية
