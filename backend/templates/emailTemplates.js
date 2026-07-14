// backend/templates/emailTemplates.js

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; text-align: right; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 15px; }
    h1 { color: #333; }
    p { color: #555; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>منصة التجارة الإلكترونية B2B</h2>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} جميع الحقوق محفوظة.</p>
    </div>
  </div>
</body>
</html>
`;

const getPasswordResetTemplate = (resetUrl) => {
  const content = `
    <h3>إعادة تعيين كلمة المرور</h3>
    <p>لقد طلبتم إعادة تعيين كلمة المرور الخاصة بحسابكم. يمكنكم القيام بذلك عبر النقر على الزر أدناه:</p>
    <a href="${resetUrl}" class="btn">إعادة تعيين كلمة المرور</a>
    <p>إذا لم تقوموا بهذا الطلب، يرجى تجاهل هذه الرسالة.</p>
  `;
  return baseTemplate(content);
};

const getRegistrationWelcomeTemplate = (name) => {
  const content = `
    <h3>مرحباً بكم في منصتنا!</h3>
    <p>أهلاً بك <strong>${name}</strong>،</p>
    <p>تم إنشاء حسابكم بنجاح. نحن سعداء بانضمامكم إلينا ونتطلع لدعم نمو أعمالكم.</p>
    <p>يمكنكم الآن تسجيل الدخول واستكشاف المنصة.</p>
  `;
  return baseTemplate(content);
};

const getRFQNotificationTemplate = (rfqTitle, rfqId) => {
  const content = `
    <h3>طلب تسعير جديد (RFQ)</h3>
    <p>تم نشر طلب تسعير جديد قد يكون من ضمن اهتماماتكم:</p>
    <p><strong>العنوان:</strong> ${rfqTitle}</p>
    <p><strong>الرقم المرجعي:</strong> #${rfqId}</p>
    <p>يرجى زيارة المنصة للاطلاع على التفاصيل وتقديم عرضكم.</p>
  `;
  return baseTemplate(content);
};

const getQuoteSubmittedTemplate = (sellerName, rfqTitle) => {
  const content = `
    <h3>تم تقديم عرض جديد لطلبكم</h3>
    <p>قام المورد <strong>${sellerName}</strong> بتقديم عرض سعر لطلبكم (<strong>${rfqTitle}</strong>).</p>
    <p>يرجى تسجيل الدخول إلى لوحة التحكم لمراجعة العرض واتخاذ القرار.</p>
  `;
  return baseTemplate(content);
};

const getQuoteAcceptedTemplate = (buyerName, rfqTitle) => {
  const content = `
    <h3>تم قبول عرضكم! 🎉</h3>
    <p>يسعدنا إبلاغكم بأن المشتري <strong>${buyerName}</strong> قد وافق على العرض المقدم لطلب التسعير (<strong>${rfqTitle}</strong>).</p>
    <p>سيتم التواصل معكم قريباً لاستكمال إجراءات الصفقة.</p>
  `;
  return baseTemplate(content);
};

const getDealCreatedTemplate = (dealId, counterpartName, role) => {
  const content = `
    <h3>تم إنشاء الصفقة بنجاح</h3>
    <p>تم إنشاء صفقة جديدة برقم <strong>#${dealId}</strong> مع ${role === 'buyer' ? 'المورد' : 'المشتري'} <strong>${counterpartName}</strong>.</p>
    <p>يمكنكم متابعة تفاصيل الصفقة وتحديث حالتها من خلال لوحة التحكم الخاصة بكم.</p>
  `;
  return baseTemplate(content);
};

module.exports = {
  getPasswordResetTemplate,
  getRegistrationWelcomeTemplate,
  getRFQNotificationTemplate,
  getQuoteSubmittedTemplate,
  getQuoteAcceptedTemplate,
  getDealCreatedTemplate,
};
