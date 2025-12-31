-- backend/schema.sql
-- هيكل قاعدة البيانات لتطبيق "منصة العروض والتجارة الإلكترونية"

-- ----------------------------------------------------------------------
-- دالة لتعيين حقل updated_at تلقائياً (تستخدم مع Trigger)
-- ----------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- ----------------------------------------------------------------------
-- 1. Users Table (جدول المستخدمين)
-- ----------------------------------------------------------------------
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  -- الأدوار الممكنة: buyer, seller, owner, super_admin
  role VARCHAR(20) CHECK (role IN ('buyer', 'seller', 'owner', 'super_admin')) NOT NULL,
  post_limit INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- تفعيل التحديث التلقائي على جدول المستخدمين
CREATE TRIGGER update_user_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- ----------------------------------------------------------------------
-- 2. Categories Table (جدول الفئات)
-- ----------------------------------------------------------------------
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name_ar VARCHAR(100) NOT NULL,
  parent_id INTEGER REFERENCES categories(id), -- يدعم الفئات الفرعية
  is_generic BOOLEAN DEFAULT false
);

-- ----------------------------------------------------------------------
-- 3. Seller Categories (ربط البائعين بالفئات)
-- ----------------------------------------------------------------------
CREATE TABLE seller_categories (
  seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (seller_id, category_id)
);

-- ----------------------------------------------------------------------
-- 4. User Restrictions (جدول قيود المستخدمين)
-- ----------------------------------------------------------------------
CREATE TABLE user_restrictions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  restriction_type VARCHAR(50) NOT NULL, -- مثال: 'temporary_ban', 'post_freeze'
  reason TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------
-- 5. Posts Table (جدول الطلبات/المنشورات من المشترين)
-- ----------------------------------------------------------------------
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  buyer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  -- رؤية السعر المطلوبة: 'secret' (خاص بالبائعين) أو 'public'
  price_visibility VARCHAR(10) CHECK (price_visibility IN ('secret', 'public')) NOT NULL,
  desired_price NUMERIC(10,2),
  status VARCHAR(20) DEFAULT 'active', -- مثال: 'active', 'awarded', 'closed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------
-- 6. Offers Table (جدول العروض من البائعين)
-- ----------------------------------------------------------------------
CREATE TABLE offers (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
  seller_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  offered_price NUMERIC(10,2) NOT NULL,
  textual_offer TEXT,
  delivery_date DATE,
  status VARCHAR(20) DEFAULT 'pending', -- مثال: 'pending', 'accepted', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------
-- 7. Negotiations Table (جدول المفاوضات)
-- ----------------------------------------------------------------------
CREATE TABLE negotiations (
  id SERIAL PRIMARY KEY,
  offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  proposed_price NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------
-- 8. Deals Table (جدول الصفقات المنجزة)
-- ----------------------------------------------------------------------
CREATE TABLE deals (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE UNIQUE, -- كل منشور يؤدي إلى صفقة واحدة فقط
  awarded_offer_id INTEGER REFERENCES offers(id) ON DELETE CASCADE UNIQUE,
  final_price NUMERIC(10,2) NOT NULL,
  deal_value NUMERIC(10,2) NOT NULL, -- قيمة الصفقة الكلية (قد تكون مختلفة عن final_price)
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------
-- 9. Commissions Table (جدول العمولات)
-- ----------------------------------------------------------------------
CREATE TABLE commissions (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE UNIQUE, -- عمولة واحدة لكل صفقة
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- مثال: 'pending', 'paid', 'canceled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------
-- 10. Notifications Table (جدول الإشعارات)
-- ----------------------------------------------------------------------
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------
-- 11. Admin Controls Table (جدول تحكم الإدارة)
-- ----------------------------------------------------------------------
CREATE TABLE admin_controls (
  id SERIAL PRIMARY KEY,
  feature_name VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  settings JSONB, -- لتخزين إعدادات متغيرة بصيغة JSON
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------
-- 12. Activity Logs Table (جدول سجلات النشاط)
-- ----------------------------------------------------------------------
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  performed_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------
-- 💡 التحسين: الفهارس (Indexes) لزيادة سرعة الاستعلامات
-- ----------------------------------------------------------------------
-- 1. فهرس على المنشورات (Posts) لتسريع الجلب/التصفية حسب الحالة والتاريخ
CREATE INDEX CONCURRENTLY idx_posts_status_created 
ON posts(status, created_at DESC);

-- 2. فهرس على العروض (Offers) لتسريع البحث عن العروض المرتبطة بمنشور وحالتها
CREATE INDEX CONCURRENTLY idx_offers_post_status 
ON offers(post_id, status);

-- 3. فهرس على المستخدمين (Users) لتسريع البحث عن طريق البريد الإلكتروني
CREATE INDEX CONCURRENTLY idx_users_email 
ON users(email); 

-- 4. فهرس على الإشعارات (Notifications) لتسريع جلب إشعارات المستخدمين
CREATE INDEX CONCURRENTLY idx_notifications_recipient 
ON notifications(recipient_id, is_read);

-- ⬇️ الإضافات الجديدة: فهارس مفاتيح الربط (Foreign Key Indexes) ⬇️
-- (لتسريع عمليات البحث والانضمام على مفاتيح الربط التي ليست مفاتيح أساسية)

-- 5. فهرس على الأعمدة الأجنبية (Foreign Keys) في جدول posts
CREATE INDEX idx_posts_buyer_id ON posts(buyer_id);
CREATE INDEX idx_posts_category_id ON posts(category_id);

-- 6. فهرس على الأعمدة الأجنبية في جدول offers
CREATE INDEX idx_offers_seller_id ON offers(seller_id);
CREATE INDEX idx_offers_post_id ON offers(post_id); -- تم التأكيد هنا (مزدوجة جزئياً مع idx_offers_post_status)

-- 7. فهرس على الأعمدة الأجنبية في جدول deals
CREATE INDEX idx_deals_post_id ON deals(post_id);