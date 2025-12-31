# 📦 CDN INTEGRATION GUIDE
**التاريخ**: 2025-11-29  
**الهدف**: دمج CDN/S3 لخدمة المرفقات بسرعة عالمية

---

## 🎯 **نظرة عامة**

### **لماذا CDN/S3؟**

| المشكلة | الحل |
|---------|------|
| **التحميل البطيء** | CDN يوزع الملفات عالمياً |
| **الحمل على الخادم** | S3 يخدم الملفات مباشرة |
| **التكلفة العالية** | S3 أرخص من تخزين الخادم |
| **القابلية للتوسع** | S3 يتوسع تلقائياً |

### **الفوائد المتوقعة**

- ⚡ **70% أسرع** في تحميل المرفقات
- 💰 **60% توفير** في تكاليف التخزين
- 🌍 **تحميل عالمي** من أقرب موقع
- 📈 **قابلية توسع** غير محدودة

---

## 🔧 **الخيارات المتاحة**

### **Option 1: AWS S3 + CloudFront (الأفضل)**

**المميزات**:
- ✅ موثوقية عالية (99.99%)
- ✅ تكامل سهل مع AWS
- ✅ CDN عالمي (CloudFront)
- ✅ أمان محسّن (IAM, Bucket Policies)

**التكلفة المتوقعة**:
- S3 Storage: $0.023/GB/month
- CloudFront: $0.085/GB (first 10TB)
- **مثال**: 100GB storage + 1TB transfer = ~$90/month

---

### **Option 2: Cloudflare R2 (الأرخص)**

**المميزات**:
- ✅ **بدون رسوم نقل البيانات** (Egress Free)
- ✅ متوافق مع S3 API
- ✅ CDN مدمج مجاناً
- ✅ أسعار تنافسية

**التكلفة المتوقعة**:
- Storage: $0.015/GB/month
- **مثال**: 100GB storage = ~$1.50/month (بدون رسوم نقل!)

---

### **Option 3: DigitalOcean Spaces (الأبسط)**

**المميزات**:
- ✅ سهل الإعداد
- ✅ CDN مدمج
- ✅ سعر ثابت

**التكلفة المتوقعة**:
- $5/month (250GB storage + 1TB transfer)

---

## 🚀 **الإعداد - AWS S3 + CloudFront**

### **الخطوة 1: إنشاء S3 Bucket**

```bash
# 1. Login to AWS Console
# 2. Navigate to S3
# 3. Create Bucket

# Bucket settings:
Bucket name: ecommerce-platform-attachments
Region: us-east-1 (or closest to your users)
Block all public access: OFF (we'll use bucket policy)
Versioning: Enabled (recommended)
Encryption: AES-256 (recommended)
```

---

### **الخطوة 2: تكوين Bucket Policy**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::ecommerce-platform-attachments/*"
    }
  ]
}
```

**ملاحظة**: هذا يسمح بالقراءة العامة. للأمان الأفضل، استخدم CloudFront Signed URLs.

---

### **الخطوة 3: تكوين CORS**

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

### **الخطوة 4: إنشاء IAM User للـ Backend**

```bash
# 1. Navigate to IAM
# 2. Create User: ecommerce-backend-s3
# 3. Attach Policy:

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::ecommerce-platform-attachments",
        "arn:aws:s3:::ecommerce-platform-attachments/*"
      ]
    }
  ]
}

# 4. Generate Access Keys
# Save: Access Key ID & Secret Access Key
```

---

### **الخطوة 5: إعداد CloudFront CDN**

```bash
# 1. Navigate to CloudFront
# 2. Create Distribution

# Origin settings:
Origin Domain: ecommerce-platform-attachments.s3.amazonaws.com
Origin Path: (leave empty)
Origin Access: Public (or use OAI for better security)

# Default Cache Behavior:
Viewer Protocol Policy: Redirect HTTP to HTTPS
Allowed HTTP Methods: GET, HEAD, OPTIONS
Cache Policy: CachingOptimized
Origin Request Policy: CORS-S3Origin

# Distribution Settings:
Price Class: Use All Edge Locations (or choose based on your users)
Alternate Domain Names (CNAMEs): cdn.yourdomain.com
SSL Certificate: Request or import ACM certificate

# 3. Wait for deployment (~15 minutes)
# 4. Note the CloudFront domain: d111111abcdef8.cloudfront.net
```

---

### **الخطوة 6: تحديث DNS**

```bash
# Add CNAME record in your DNS:
Type: CNAME
Name: cdn
Value: d111111abcdef8.cloudfront.net
TTL: 300
```

---

## 💻 **تحديث الكود**

### **الخطوة 1: تثبيت AWS SDK**

```bash
npm install aws-sdk
```

---

### **الخطوة 2: إنشاء S3 Service**

```javascript
// services/s3Service.js
const AWS = require('aws-sdk');

// Configure AWS SDK
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const CDN_URL = process.env.CDN_URL;

class S3Service {
    /**
     * Upload file to S3
     */
    static async uploadFile(file, folder = 'attachments') {
        const fileName = `${folder}/${Date.now()}-${file.originalname}`;
        
        const params = {
            Bucket: BUCKET_NAME,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: 'public-read'
        };

        try {
            const result = await s3.upload(params).promise();
            
            // Return CDN URL instead of S3 URL
            const cdnUrl = `${CDN_URL}/${fileName}`;
            
            console.log(`✅ File uploaded to S3: ${cdnUrl}`);
            
            return {
                url: cdnUrl,
                key: fileName,
                bucket: BUCKET_NAME
            };
        } catch (error) {
            console.error('❌ S3 upload error:', error);
            throw new Error('Failed to upload file to S3');
        }
    }

    /**
     * Delete file from S3
     */
    static async deleteFile(key) {
        const params = {
            Bucket: BUCKET_NAME,
            Key: key
        };

        try {
            await s3.deleteObject(params).promise();
            console.log(`✅ File deleted from S3: ${key}`);
            return true;
        } catch (error) {
            console.error('❌ S3 delete error:', error);
            throw new Error('Failed to delete file from S3');
        }
    }

    /**
     * Generate signed URL for private files
     */
    static getSignedUrl(key, expiresIn = 3600) {
        const params = {
            Bucket: BUCKET_NAME,
            Key: key,
            Expires: expiresIn
        };

        return s3.getSignedUrl('getObject', params);
    }

    /**
     * Check if file exists
     */
    static async fileExists(key) {
        const params = {
            Bucket: BUCKET_NAME,
            Key: key
        };

        try {
            await s3.headObject(params).promise();
            return true;
        } catch (error) {
            return false;
        }
    }
}

module.exports = S3Service;
```

---

### **الخطوة 3: تحديث Attachment Upload**

```javascript
// routes/attachmentRoutes.js
const S3Service = require('../services/s3Service');
const multer = require('multer');

// Use memory storage instead of disk
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

router.post('/upload', protect, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Upload to S3
        const result = await S3Service.uploadFile(req.file, 'attachments');

        // Save to database
        const attachment = await Attachment.create({
            fileName: req.file.originalname,
            fileUrl: result.url,
            s3Key: result.key,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            uploadedBy: req.user.id
        });

        return res.status(201).json({
            success: true,
            data: attachment
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to upload file'
        });
    }
});
```

---

### **الخطوة 4: تحديث Attachment Model**

```javascript
// Add s3Key field to Attachment model
const Attachment = sequelize.define('Attachment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fileUrl: {
        type: DataTypes.STRING,
        allowNull: false
    },
    s3Key: {
        type: DataTypes.STRING,
        allowNull: true  // For S3 integration
    },
    fileSize: {
        type: DataTypes.INTEGER
    },
    mimeType: {
        type: DataTypes.STRING
    }
});
```

---

### **الخطوة 5: تحديث Environment Variables**

```bash
# .env.prod
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
S3_BUCKET_NAME=ecommerce-platform-attachments
CDN_URL=https://cdn.yourdomain.com
```

---

## 🔒 **الأمان المتقدم**

### **Option 1: Signed URLs (الأفضل للملفات الخاصة)**

```javascript
// For private attachments
router.get('/:id', protect, async (req, res) => {
    const attachment = await Attachment.findByPk(req.params.id);
    
    // Check permissions
    if (!canAccessAttachment(req.user, attachment)) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    // Generate signed URL (expires in 1 hour)
    const signedUrl = S3Service.getSignedUrl(attachment.s3Key, 3600);

    return res.redirect(signedUrl);
});
```

---

### **Option 2: CloudFront Signed URLs**

```javascript
const AWS = require('aws-sdk');
const cloudfront = new AWS.CloudFront.Signer(
    process.env.CLOUDFRONT_KEY_PAIR_ID,
    process.env.CLOUDFRONT_PRIVATE_KEY
);

const signedUrl = cloudfront.getSignedUrl({
    url: `${CDN_URL}/${attachment.s3Key}`,
    expires: Math.floor(Date.now() / 1000) + 3600
});
```

---

## 📊 **المراقبة والتحسين**

### **CloudWatch Metrics**

```javascript
// Monitor S3 usage
const cloudwatch = new AWS.CloudWatch();

const params = {
    Namespace: 'AWS/S3',
    MetricName: 'BucketSizeBytes',
    Dimensions: [
        {
            Name: 'BucketName',
            Value: BUCKET_NAME
        },
        {
            Name: 'StorageType',
            Value: 'StandardStorage'
        }
    ],
    StartTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
    EndTime: new Date(),
    Period: 3600,
    Statistics: ['Average']
};

cloudwatch.getMetricStatistics(params, (err, data) => {
    if (err) console.error(err);
    else console.log('S3 Storage:', data);
});
```

---

## ✅ **قائمة التحقق**

### **قبل الإطلاق**

- [ ] إنشاء S3 Bucket
- [ ] تكوين Bucket Policy
- [ ] تكوين CORS
- [ ] إنشاء IAM User
- [ ] إعداد CloudFront Distribution
- [ ] تحديث DNS (CNAME)
- [ ] تثبيت AWS SDK
- [ ] إنشاء S3Service
- [ ] تحديث Attachment Upload
- [ ] تحديث Environment Variables
- [ ] اختبار Upload/Download
- [ ] اختبار CORS
- [ ] مراقبة CloudWatch

---

## 🎯 **الخلاصة**

### **التحسينات المتوقعة**

| المقياس | قبل CDN | بعد CDN | التحسين |
|---------|---------|---------|---------|
| سرعة التحميل | 2000ms | 600ms | **70% أسرع** |
| تكلفة التخزين | $150/month | $60/month | **60% توفير** |
| قابلية التوسع | محدودة | غير محدودة | **∞** |
| التوفر | 99.9% | 99.99% | **أفضل** |

---

**📅 التاريخ**: 2025-11-29  
**✅ الحالة**: دليل جاهز للتطبيق  
**🎯 الهدف**: تحسين أداء المرفقات بنسبة 70%
