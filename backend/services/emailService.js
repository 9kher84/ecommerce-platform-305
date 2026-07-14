// backend/services/emailService.js

const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const templates = require('../templates/emailTemplates');
const { User, Category } = require('../sequelize_setup');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isDevelopment = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    this.initTransporter();
  }

  initTransporter() {
    // Determine provider from env, default to smtp
    const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
    const port = process.env.SMTP_PORT || 587;
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASS || '';

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port == 465, // true for 465, false for other ports
      auth: { user, pass }
    });
  }

  /**
   * Internal send method designed to be provider-agnostic.
   * Can be easily swapped with an enqueue() method later if a Queue is added.
   * @param {Object} options { to, subject, html }
   * @returns {Object} { status: 'SUCCESS' | 'FAILED' | 'SKIPPED', error?: string }
   */
  async send(options) {
    if (this.isDevelopment && process.env.EMAIL_MOCK_MODE === 'true') {
      logger.info(`[EmailService] Mock mode enabled. SKIPPED sending email to ${options.to}`);
      logger.info(`[EmailService] MOCK_HTML_CONTENT:\n${options.html}`);
      return { status: 'SKIPPED' };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM || '"B2B Platform" <noreply@ecommerce-platform.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`[EmailService] SUCCESS sending email to ${options.to}`, { messageId: info.messageId });
      
      // In development, if using ethereal, print the preview URL
      if (this.isDevelopment && process.env.SMTP_HOST === 'smtp.ethereal.email') {
        logger.info(`[EmailService] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
      }
      
      return { status: 'SUCCESS' };
    } catch (error) {
      logger.error(`[EmailService] FAILED sending email to ${options.to}`, { error: error.message });
      return { status: 'FAILED', error: error.message };
    }
  }

  // =========================================================
  // Business Use Cases
  // =========================================================

  async sendPasswordReset(user, resetToken) {
    // Assuming FRONTEND_URL is set in environment or default
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
    const html = templates.getPasswordResetTemplate(resetUrl);

    return this.send({
      to: user.email,
      subject: 'إعادة تعيين كلمة المرور',
      html,
    });
  }

  async sendRegistrationWelcome(user) {
    const html = templates.getRegistrationWelcomeTemplate(user.name || user.email);
    return this.send({
      to: user.email,
      subject: 'مرحباً بك في منصة B2B',
      html,
    });
  }

  async sendRFQNotification(sellersEmails, rfqTitle, rfqId) {
    if (!sellersEmails || sellersEmails.length === 0) return { status: 'SKIPPED' };
    const html = templates.getRFQNotificationTemplate(rfqTitle, rfqId);
    
    // Using BCC to send to multiple sellers without them seeing each other
    return this.send({
      to: process.env.EMAIL_FROM || 'noreply@ecommerce-platform.com',
      bcc: sellersEmails.join(','),
      subject: 'إشعار: طلب تسعير جديد',
      html,
    });
  }

  async notifySellersForRFQ(request) {
    try {
      const sellers = await User.findAll({
        where: { role: 'seller', isActive: true },
        include: [{ 
          model: Category, 
          as: 'sectors', 
          where: { id: request.sectorId } 
        }]
      });
      const sellerEmails = sellers.map(s => s.email);
      return await this.sendRFQNotification(sellerEmails, request.title || 'طلب تسعير', request.id);
    } catch (error) {
      logger.error(`[EmailService] Failed to notify sellers for RFQ ${request.id}`, { error: error.message });
      return { status: 'FAILED', error: error.message };
    }
  }

  async notifyBuyerForQuote(quote) {
    try {
      // Fetch full quote with Request and Buyer info
      const fullQuote = await require('../sequelize_setup').PriceQuote.findByPk(quote.id, {
        include: [{ 
          model: require('../sequelize_setup').PurchaseRequest, 
          as: 'request', 
          include: [{ model: User, as: 'buyer' }] 
        }, {
          model: User,
          as: 'seller'
        }]
      });
      if (!fullQuote || !fullQuote.request || !fullQuote.request.buyer) return { status: 'SKIPPED' };
      
      const buyerEmail = fullQuote.request.buyer.email;
      const sellerName = fullQuote.seller.name;
      const rfqTitle = fullQuote.request.title;
      
      return await this.sendQuoteSubmitted(buyerEmail, sellerName, rfqTitle);
    } catch (error) {
      logger.error(`[EmailService] Failed to notify buyer for quote ${quote.id}`, { error: error.message });
      return { status: 'FAILED', error: error.message };
    }
  }

  async sendQuoteSubmitted(buyerEmail, sellerName, rfqTitle) {
    const html = templates.getQuoteSubmittedTemplate(sellerName, rfqTitle);
    return this.send({
      to: buyerEmail,
      subject: 'تم تقديم عرض جديد لطلبكم',
      html,
    });
  }

  async notifySellerForAcceptance(quoteId) {
    try {
      const fullQuote = await require('../sequelize_setup').PriceQuote.findByPk(quoteId, {
        include: [{ 
          model: require('../sequelize_setup').PurchaseRequest, 
          as: 'request', 
          include: [{ model: User, as: 'buyer' }] 
        }, {
          model: User,
          as: 'seller'
        }]
      });
      if (!fullQuote || !fullQuote.seller || !fullQuote.request) return { status: 'SKIPPED' };

      const sellerEmail = fullQuote.seller.email;
      const buyerName = fullQuote.request.buyer.name;
      const rfqTitle = fullQuote.request.title;

      return await this.sendQuoteAccepted(sellerEmail, buyerName, rfqTitle);
    } catch (error) {
      logger.error(`[EmailService] Failed to notify seller for accepted quote ${quoteId}`, { error: error.message });
      return { status: 'FAILED', error: error.message };
    }
  }

  async sendQuoteAccepted(sellerEmail, buyerName, rfqTitle) {
    const html = templates.getQuoteAcceptedTemplate(buyerName, rfqTitle);
    return this.send({
      to: sellerEmail,
      subject: 'تهانينا: تم قبول عرضكم',
      html,
    });
  }

  async notifyPartiesForDeal(dealId) {
    try {
      const { Deal, User } = require('../sequelize_setup');
      const deal = await Deal.findByPk(dealId, {
        include: [
          { model: User, as: 'buyer' },
          { model: User, as: 'seller' }
        ]
      });
      if (!deal) return { status: 'SKIPPED' };

      const parties = {
        buyerEmail: deal.buyer?.email,
        buyerName: deal.buyer?.name,
        sellerEmail: deal.seller?.email,
        sellerName: deal.seller?.name
      };

      return await this.sendDealCreated(parties, dealId);
    } catch (error) {
      logger.error(`[EmailService] Failed to notify parties for deal ${dealId}`, { error: error.message });
      return { status: 'FAILED', error: error.message };
    }
  }

  async sendDealCreated(parties, dealId) {
    // parties: { buyerEmail, buyerName, sellerEmail, sellerName }
    const results = [];
    if (parties.buyerEmail) {
      const buyerHtml = templates.getDealCreatedTemplate(dealId, parties.sellerName, 'seller');
      results.push(await this.send({ to: parties.buyerEmail, subject: 'إشعار إنشاء صفقة', html: buyerHtml }));
    }
    if (parties.sellerEmail) {
      const sellerHtml = templates.getDealCreatedTemplate(dealId, parties.buyerName, 'buyer');
      results.push(await this.send({ to: parties.sellerEmail, subject: 'إشعار إنشاء صفقة', html: sellerHtml }));
    }
    return results;
  }
}

module.exports = new EmailService();
