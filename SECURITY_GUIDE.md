# 🔐 دليل الأمان - E-Commerce Platform

## 📋 نظرة عامة

تم تطبيق جميع الإصلاحات الأمنية الحرجة على المشروع. هذا الدليل يشرح كيفية استخدام الميزات الأمنية الجديدة.

---

## 🔑 المفاتيح السرية (Secrets Management)

### توليد مفاتيح جديدة

```bash
# توليد JWT_SECRET جديد:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# توليد SESSION_SECRET جديد:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### إعداد .env

1. انسخ `.env.example` إلى `.env`:
```bash
cp .env.example .env
```

2. املأ القيم المطلوبة:
```env
JWT_SECRET=<your_generated_secret>
SESSION_SECRET=<your_generated_secret>
DB_PASSWORD=<your_db_password>
```

3. **لا ترفع `.env` إلى Git أبداً!**

---

## 🛡️ Rate Limiting

### الحدود الحالية

| Endpoint | الحد | المدة | البيئة |
|----------|------|-------|--------|
| `/api/*` | 100 | 15 دقيقة | Production |
| `/api/auth/login` | 50 | 15 دقيقة | Production |
| `/api/auth/register` | 30 | 15 دقيقة | Production |
| `/api/payments/*` | 20 | 60 دقيقة | Production |

### تعطيل Rate Limiting (للتطوير فقط)

```env
# في .env:
DISABLE_RATE_LIMIT=true
```

---

## 💾 النسخ الاحتياطي (Backups)

### تشغيل Backup يدوياً

**Linux/Mac:**
```bash
cd backend
./scripts/backup.sh
```

**Windows:**
```powershell
cd backend
.\scripts\backup.ps1
```

### جدولة Backup تلقائي

**Linux (Cron):**
```bash
# تحرير crontab:
crontab -e

# إضافة السطر التالي (يومياً الساعة 2 صباحاً):
0 2 * * * cd /path/to/backend && ./scripts/backup.sh
```

**Windows (Task Scheduler):**
```powershell
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-File C:\path\to\backend\scripts\backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "EcommerceDailyBackup" `
    -Action $action -Trigger $trigger -RunLevel Highest
```

### استعادة من Backup

```bash
# Linux/Mac:
./scripts/restore.sh backups/ecommerce_backup_20251209_020000.tar.gz

# Windows: استخدم pg_restore يدوياً
```

---

## 🔒 HTTPS و SSL

### إعداد Let's Encrypt

```bash
# 1. تشغيل سكريبت الإعداد:
cd backend
./scripts/setup-ssl.sh yourdomain.com

# 2. اختبار التكوين:
sudo nginx -t

# 3. إعادة تشغيل Nginx:
sudo systemctl restart nginx
```

### التجديد التلقائي

```bash
# اختبار التجديد:
sudo certbot renew --dry-run

# التجديد يدوياً (إذا لزم الأمر):
sudo certbot renew
```

---

## 🧪 الاختبارات الأمنية

### 1. اختبار JWT

```bash
# تسجيل دخول:
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# استخدام التوكن:
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <your_token>"
```

### 2. اختبار Rate Limiting

```bash
# اختبار Login Rate Limit:
for i in {1..60}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### 3. اختبار Security Headers

```bash
curl -I https://yourdomain.com

# يجب أن تظهر:
# Strict-Transport-Security
# X-Frame-Options
# X-Content-Type-Options
```

### 4. فحص SSL

زيارة: https://www.ssllabs.com/ssltest/analyze.html?d=yourdomain.com

الهدف: Grade A أو A+

---

## 🚨 استكشاف الأخطاء

### مشكلة: "401 Unauthorized" بعد تغيير JWT_SECRET

**الحل:** جميع التوكنات القديمة أصبحت غير صالحة. المستخدمون يحتاجون لتسجيل دخول جديد.

### مشكلة: "429 Too Many Requests"

**الحل:** انتظر 15 دقيقة أو عطّل Rate Limiting في Development:
```env
DISABLE_RATE_LIMIT=true
```

### مشكلة: Backup يفشل

**الأسباب المحتملة:**
1. PostgreSQL غير مثبت أو غير متصل
2. صلاحيات غير كافية
3. مساحة قرص ممتلئة

**الحل:**
```bash
# تحقق من PostgreSQL:
pg_isready -h localhost -p 5432

# تحقق من المساحة:
df -h

# تحقق من الصلاحيات:
chmod +x scripts/backup.sh
```

---

## 📚 موارد إضافية

### التوثيق
- [SECURITY_FIXES_REPORT.md](./SECURITY_FIXES_REPORT.md) - تقرير الإصلاحات الأمنية
- [TECHNICAL_SECURITY_ANALYSIS.md](./TECHNICAL_SECURITY_ANALYSIS.md) - التحليل الأمني الشامل
- [HOSTING_SPECIFICATIONS.md](./HOSTING_SPECIFICATIONS.md) - مواصفات الاستضافة

### أدوات مفيدة
- [SSL Labs](https://www.ssllabs.com/ssltest/) - فحص SSL
- [Security Headers](https://securityheaders.com/) - فحص Security Headers
- [OWASP ZAP](https://www.zaproxy.org/) - Penetration Testing
- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit) - فحص الثغرات

---

## ⚠️ تحذيرات مهمة

### ❌ لا تفعل أبداً:
1. رفع `.env` إلى Git
2. مشاركة `JWT_SECRET` مع أحد
3. تعطيل HTTPS في Production
4. استخدام `COOKIE_SECURE=false` في Production
5. تجاهل `npm audit` warnings

### ✅ افعل دائماً:
1. استخدم مفاتيح عشوائية قوية
2. فعّل HTTPS في Production
3. راجع Security Headers بانتظام
4. اختبر Backups شهرياً
5. حدّث Dependencies بانتظام

---

## 🆘 الدعم

للمساعدة أو الإبلاغ عن مشاكل أمنية:
- Email: security@yourdomain.com
- GitHub Issues: (للمشاكل غير الحرجة فقط)

**للثغرات الأمنية الحرجة:** أرسل بريد مباشر ولا تنشر في Issues العامة.

---

**آخر تحديث:** 2025-12-09  
**الإصدار:** 2.0.0 (Security Hardened)
