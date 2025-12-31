const debug = require('debug')('app:requestService');
const { PurchaseRequest, User, Category, Deal, PriceQuote } = require('../sequelize_setup');
const SubscriptionService = require('./subscriptionService');
const AuditHelper = require('../utils/AuditHelper');
const { Op } = require('sequelize');
const MSG = require('../utils/responseMessages');

const STATUS_TRANSITIONS = {
  // Strict F3 State Machine
  draft: ['published'],
  published: ['under_review', 'quoting'],
  under_review: ['published', 'cancelled'],
  quoting: ['awaiting_decision'],
  awaiting_decision: ['accepted'],
  accepted: ['completed'],
  completed: [],
  cancelled: [],
  suspended: ['published', 'draft'] // Owner/Admin restoration
};

// Global "ANY" Transitions (Handled in logic)
const GLOBAL_TRANSITIONS = {
  suspended: ['*'], // Can suspend from anywhere
  cancelled: ['*']  // Can cancel from anywhere (subject to policy)
};

class RequestService {
  // =========================
  // CREATE REQUEST
  // =========================
  static async createRequest(buyerId, requestData) {
    const user = await User.findByPk(buyerId);
    if (!user) throw new Error('User not found');
    if (user.role !== 'buyer') throw new Error('Only buyers can create purchase requests');

    if (user.subscriptionTier === 'free' && requestData.post_type === 'direct') {
      const error = new Error('الشراء المباشر يتطلب خطة أ أو خطة ب');
      error.statusCode = 403;
      throw error;
    }

    const canCreate = await SubscriptionService.canCreateRequest(buyerId);
    if (!canCreate.canCreate) throw new Error(canCreate.reason);

    this.validateContactNumbers(user.subscriptionTier, requestData);
    this.validateDeliveryLocations(user.subscriptionTier, requestData);
    this.validateAttachments(user.subscriptionTier, requestData);
    this.validatePrivacySettings(user.subscriptionTier, requestData);
    this.validateDirectPurchase(user.subscriptionTier, requestData);
    this.validateWrittenNumbers(requestData);

    const request = await PurchaseRequest.create({
      userId: buyerId,
      title: requestData.title,
      categoryId: requestData.categoryId,
      description: requestData.description,
      quantity: requestData.quantity,
      unit: requestData.unit,
      deliveryLocations: requestData.deliveryLocations || [],
      deliveryDates: requestData.deliveryDates,
      requiresDelivery: requestData.requiresDelivery !== false,
      requiresInstallation: requestData.requiresInstallation || false,
      contactNumbers: requestData.contactNumbers || [],
      images: requestData.images || [],
      pdfAttachments: requestData.pdfAttachments || [],
      hideOffers: requestData.hideOffers || false,
      hidePersonalInfo: requestData.hidePersonalInfo || false,
      directPurchase: requestData.directPurchase || false,
      targetSellerId: requestData.targetSellerId || null,
      status: 'draft',
      post_type: requestData.post_type || 'standard',
      auction_type: requestData.auction_type || 'public',
      delivery_city: requestData.delivery_city,
      delivery_date: requestData.delivery_date,
      contact_number: requestData.contact_number,
      attachments: requestData.attachments || [],
      price_range_min: requestData.price_range_min,
      price_range_max: requestData.price_range_max,
      fixed_price: requestData.fixed_price,
      advanced_options: requestData.advanced_options || {},
      is_active: true,
      deviceFingerprint: requestData.deviceFingerprint
    });

    await SubscriptionService.incrementPostCount(buyerId);
    return request;
  }

  // =========================
  // EDIT REQUEST
  // =========================
  static async editRequest(requestId, buyerId, updates) {
    const request = await PurchaseRequest.findByPk(requestId);
    if (!request) throw new Error('Request not found');

    if (request.userId !== buyerId) {
      throw new Error('Unauthorized: You can only edit your own requests');
    }

    const user = await User.findByPk(buyerId);
    const currentStatus = request.status;
    const isPremiumBuyer = user.subscriptionTier === 'plan_a' || user.subscriptionTier === 'plan_b';

    // Premium users can edit published/negotiating requests
    if (currentStatus === 'published' || currentStatus === 'negotiating') {
      if (!isPremiumBuyer) {
        throw new Error(
          `❌ FORBIDDEN: Cannot edit request in status "${currentStatus}". ` +
          `This requires Plan A or Plan B subscription.`
        );
      }
    } else if (currentStatus !== 'draft') {
      // If not draft, check quotes (even for premium in other statuses like accepted)
      const quoteCount = await PriceQuote.count({
        where: { purchaseRequestId: requestId }
      });

      if (quoteCount > 0) {
        throw new Error(
          'Cannot edit request after receiving quotes. Request modification requires admin intervention.'
        );
      }
    }

    if (updates.images || updates.pdfAttachments) {
      this.validateAttachments(user.subscriptionTier, {
        images: updates.images || request.images,
        pdfAttachments: updates.pdfAttachments || request.pdfAttachments
      });
    }

    const allowedFields = [
      'title', 'description', 'quantity', 'unit',
      'deliveryLocations', 'deliveryDates',
      'requiresDelivery', 'requiresInstallation',
      'contactNumbers', 'images', 'pdfAttachments',
      'hideOffers', 'hidePersonalInfo', 'fixed_price'
    ];

    const updateData = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });

    updateData.lastModifiedAt = new Date();
    await request.update(updateData);
    return request;
  }

  // =========================
  // HELPER: Build SQL WHERE clause from Sequelize conditions
  // =========================
  static buildWhereClause(whereConditions, replacements = {}) {
    const clauses = [];
    let paramCounter = Object.keys(replacements).length + 1;

    // Helper to get Op key safely (handling Symbols)
    const isOp = (key, opName) => {
      return key === Op[opName] || (typeof key === 'symbol' && key.toString() === `Symbol(${opName})`);
    };

    const processCondition = (key, value) => {
      // Handle Op.and
      if (key === Op.and || isOp(key, 'and')) {
        const andClauses = value.map(cond => {
          const subClauses = [];
          // If cond is an object with multiple keys (e.g. status, expiresAt), process each
          Object.getOwnPropertySymbols(cond).concat(Object.keys(cond)).forEach(subKey => {
            const result = processCondition(subKey, cond[subKey]);
            if (result) subClauses.push(result);
          });
          return subClauses.length > 0 ? `(${subClauses.join(' AND ')})` : null;
        }).filter(Boolean);
        return andClauses.length > 0 ? andClauses.join(' AND ') : null;
      }

      // Handle Op.or
      if (key === Op.or || isOp(key, 'or')) {
        const orClauses = value.map(cond => {
          const subClauses = [];
          Object.getOwnPropertySymbols(cond).concat(Object.keys(cond)).forEach(subKey => {
            const result = processCondition(subKey, cond[subKey]);
            if (result) subClauses.push(result);
          });
          return subClauses.length > 0 ? `(${subClauses.join(' AND ')})` : null;
        }).filter(Boolean);
        return orClauses.length > 0 ? `(${orClauses.join(' OR ')})` : null;
      }

      if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        // Handle Operators inside value (e.g. { [Op.in]: ... })
        const ops = Object.getOwnPropertySymbols(value);
        if (ops.length > 0) {
          const opResults = ops.map(op => {
            if (op === Op.in || isOp(op, 'in')) {
              const paramName = `param${paramCounter++}`;
              replacements[paramName] = value[op];
              return `"${key}" IN (:${paramName})`;
            }
            if (op === Op.ne || isOp(op, 'ne')) {
              const paramName = `param${paramCounter++}`;
              replacements[paramName] = value[op];
              return `"${key}" != :${paramName}`;
            }
            if (op === Op.gt || isOp(op, 'gt')) {
              const paramName = `param${paramCounter++}`;
              replacements[paramName] = value[op];
              return `"${key}" > :${paramName}`;
            }
            if (op === Op.iLike || isOp(op, 'iLike')) {
              const paramName = `param${paramCounter++}`;
              replacements[paramName] = value[op];
              return `"${key}" ILIKE :${paramName}`;
            }
            return null;
          }).filter(Boolean);
          return opResults.join(' AND ');
        }
      }

      // Simple key-value pair
      if (typeof key === 'string') {
        const paramName = `param${paramCounter++}`;
        replacements[paramName] = value;
        return `"${key}" = :${paramName}`;
      }

      return null;
    };

    Object.getOwnPropertySymbols(whereConditions).concat(Object.keys(whereConditions)).forEach(key => {
      const result = processCondition(key, whereConditions[key]);
      if (result) clauses.push(result);
    });

    return { sql: clauses.join(' AND '), replacements };
  }

  // =========================
  // HELPER: Execute Free Tier Query with ROW_NUMBER
  // =========================
  static async executeFreeTierQuery(whereConditions, limit, offset) {
    const { sequelize } = require('../sequelize_setup');
    const { sql: whereSql, replacements } = this.buildWhereClause(whereConditions);

    // ✅ إضافة logging للتشخيص
    console.log('[DEBUG] Generated WHERE clause:', whereSql);
    console.log('[DEBUG] Replacements:', replacements);

    // Add pagination params to replacements
    replacements.limit = limit;
    replacements.offset = offset;

    const query = `
    WITH base_filtered AS (
      SELECT pr.*
      FROM "PurchaseRequests" pr
      WHERE ${whereSql}
    ),
    ranked_requests AS (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY "categoryId" 
          ORDER BY "createdAt" DESC
        ) as row_num
      FROM base_filtered
    )
    SELECT 
      id, "userId", "categoryId", title, description, quantity, unit,
      "deliveryLocations", "deliveryDates", status, "post_type", "auction_type",
      "delivery_city", "pdfAttachments", "fixed_price", "targetSellerId",
      "viewCount", "quoteCount", "expiresAt", "modificationRequested",
      "modificationReason", "lastModifiedAt", "createdAt", "updatedAt",
      "hideOffers", "hidePersonalInfo", "directPurchase", "images",
      "contactNumbers", "requiresDelivery", "requiresInstallation",
      "attachments", "price_range_min", "price_range_max", "advanced_options",
      "is_active", "contact_number", "delivery_date"
    FROM ranked_requests
    WHERE row_num <= 3
    ORDER BY "createdAt" DESC
    LIMIT :limit OFFSET :offset;
  `;

    const results = await sequelize.query(query, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Get total count for pagination
    const countQuery = `
    WITH base_filtered AS (
      SELECT pr.*
      FROM "PurchaseRequests" pr
      WHERE ${whereSql}
    ),
    ranked_requests AS (
      SELECT *,
        ROW_NUMBER() OVER (
          PARTITION BY "categoryId" 
          ORDER BY "createdAt" DESC
        ) as row_num
      FROM base_filtered
    )
    SELECT COUNT(*) as count
    FROM ranked_requests
    WHERE row_num <= 3;
  `;

    const [countResult] = await sequelize.query(countQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const totalCount = parseInt(countResult.count);

    // Manually load associations for raw query results
    const requestIds = results.map(r => r.id);
    if (requestIds.length > 0) {
      const users = await User.findAll({
        where: { id: { [Op.in]: results.map(r => r.userId) } },
        attributes: ['id', 'name', 'subscriptionTier', 'rank']
      });
      const categories = await Category.findAll({
        where: { id: { [Op.in]: results.map(r => r.categoryId) } },
        attributes: ['id', 'name_ar', 'name_en']
      });

      const userMap = {};
      users.forEach(u => { userMap[u.id] = u; });
      const categoryMap = {};
      categories.forEach(c => { categoryMap[c.id] = c; });

      results.forEach(r => {
        r.user = userMap[r.userId] || null;
        r.category = categoryMap[r.categoryId] || null;
      });
    }

    return {
      data: results,
      pagination: {
        currentPage: Math.floor(offset / limit) + 1,
        pageSize: limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: offset + limit < totalCount,
        hasPreviousPage: offset > 0
      }
    };
  }

  // =========================
  // GET ALL REQUESTS (FOR HOMEPAGE) - OPTIMIZED
  // =========================
  static async getAllRequests(userRole = null, userTier = null, filters = {}, user = null) {
    const where = {};

    // أ) منطق الدور (Role Logic) - PRESERVED EXACTLY
    if (userRole === 'admin' || userRole === 'super_admin') {
      // جميع الطلبات ما عدا المسودات
      where.status = { [Op.ne]: 'draft' };
    } else if (userRole === 'seller' || userRole === 'buyer') {
      // فقط المنشورة أو قيد التفاوض
      where.status = { [Op.in]: ['published', 'negotiating'] };
      where.expiresAt = { [Op.gt]: new Date() };
    } else {
      // الزوار: نفس البائع/المشتري
      where.status = { [Op.in]: ['published', 'negotiating'] };
      where.expiresAt = { [Op.gt]: new Date() };
    }

    // ج) فلتر التصنيف - PRESERVED EXACTLY
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    // هـ) فلتر المدينة - يجب أن يكون خارج كتلة البحث
    if (filters.city) {
      where.delivery_city = filters.city;
    }

    // د) فلتر البحث النصي - PRESERVED EXACTLY
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const searchKeyword = `%${filters.searchQuery.trim()}%`;
      const currentConditions = { ...where };

      where[Op.and] = [
        currentConditions,
        {
          [Op.or]: [
            { title: { [Op.iLike]: searchKeyword } },
            { description: { [Op.iLike]: searchKeyword } }
          ]
        }
      ];

      // حذف الشروط المكررة - PRESERVED EXACTLY
      delete where.status;
      delete where.expiresAt;
      if (where.userId) delete where.userId;
      if (where.categoryId) delete where.categoryId;
      // لا نحذف delivery_city لأنه جزء من currentConditions
    }

    // Extract pagination parameters
    const page = parseInt(filters.page) || 1;
    const limit = Math.min(parseInt(filters.limit) || 20, 100);
    const offset = (page - 1) * limit;

    // ب) قيود الخطة المجانية (Free Tier Logic) - NOW AT DATABASE LEVEL
    if (userRole === 'buyer' && userTier === 'free') {
      // Use raw SQL with ROW_NUMBER for performance
      return await this.executeFreeTierQuery(where, limit, offset);
    }

    // For all other users: standard Sequelize query with pagination
    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'subscriptionTier', 'rank'] },
        { model: Category, as: 'category', attributes: ['id', 'name_ar', 'name_en'] }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    return {
      data: rows,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        hasNextPage: page < Math.ceil(count / limit),
        hasPreviousPage: page > 1
      }
    };
  }

  // GET PUBLISHED REQUESTS (جديدة ومعدلة)
  // =========================
  static async getPublishedRequests(categoryId = null, filters = {}) {
    const where = {
      status: 'published',
      expiresAt: { [Op.gt]: new Date() }
    };
    if (categoryId) where.categoryId = categoryId;

    return await PurchaseRequest.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'subscriptionTier', 'rank'] },
        { model: Category, as: 'category', attributes: ['id', 'name_ar', 'name_en'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: filters.limit || 50 // حد معقول افتراضي
    });
  }

  // =========================
  // GET REQUEST DETAILS
  // =========================
  static async getRequestDetails(requestId, userId) {
    console.log(`Fetching request details for ID: ${requestId}, User ID: ${userId}`);

    try {
      // إعداد الـ includes الأساسية
      const includes = [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'subscriptionTier', 'rank', 'businessName']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name_ar', 'name_en']
        }
      ];

      // جلب الطلب الأساسي بدون quotes أولاً
      const request = await PurchaseRequest.findByPk(requestId, {
        include: includes
      });

      if (!request) {
        console.error(`Request not found: ${requestId}`);
        throw new Error('Request not found');
      }

      const plainReq = request.get({ plain: true });
      console.log(`Request found: ${plainReq.id}, Status: ${plainReq.status}`);

      // تحديد صلاحيات المستخدم
      const user = userId ? await User.findByPk(userId) : null;
      const isOwner = user && user.id === plainReq.userId;
      const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');
      const isSeller = user && user.role === 'seller';

      // جلب الـ quotes بناءً على الصلاحيات
      let quotes = [];
      const quoteWhere = { purchaseRequestId: requestId };

      if (isOwner || isAdmin) {
        // المالك أو الأدمن: يرون جميع الـ quotes
        quotes = await PriceQuote.findAll({
          where: quoteWhere,
          include: [
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'name', 'businessName', 'rank']
            }
          ],
          order: [['createdAt', 'DESC']]
        });
      } else if (isSeller) {
        // البائع: يرون فقط الـ quotes الخاصة بهم في المزاد السري
        if (plainReq.auction_type === 'secret') {
          quoteWhere.sellerId = userId;
        }

        quotes = await PriceQuote.findAll({
          where: quoteWhere,
          include: [
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'name', 'businessName', 'rank']
            }
          ],
          order: [['createdAt', 'DESC']]
        });

        // في المزاد العام، إخفاء معلومات البائعين الآخرين
        if (plainReq.auction_type === 'public' && quotes.length > 0) {
          quotes = quotes.map(quote => {
            const quoteData = quote.get({ plain: true });
            if (quoteData.sellerId !== userId) {
              // إخفاء معلومات البائع الآخر
              quoteData.seller = {
                id: null,
                name: 'بائع آخر',
                businessName: '---',
                rank: null
              };
              quoteData.amount = null;
              quoteData.notes = 'عرض مخفي';
            }
            return quoteData;
          });
        }
      }

      // إضافة الـ quotes للطلب
      plainReq.quotes = quotes;
      plainReq.quoteCount = quotes.length;

      // إخفاء معلومات الاتصال إذا لم يكن مالك أو أدمن
      if (!isOwner && !isAdmin) {
        if (plainReq.contactNumbers) plainReq.contactNumbers = [];
        if (plainReq.contact_number) plainReq.contact_number = null;
        if (plainReq.user && plainReq.user.email) {
          delete plainReq.user.email;
        }
      }

      console.log(`Returning request with ${plainReq.quotes.length} quotes`);
      return plainReq;

    } catch (error) {
      console.error('Error in getRequestDetails:', error);
      throw error;
    }
  }

  // =========================
  // REQUEST MODIFICATION (ADMIN)
  // =========================
  static async requestModification(requestId, buyerId, reason) {
    const request = await PurchaseRequest.findByPk(requestId);
    if (!request) throw new Error('Request not found');

    if (request.userId !== buyerId) {
      throw new Error('Unauthorized');
    }

    if (request.canBeModified()) {
      throw new Error('You can edit this request directly. No admin approval needed.');
    }

    await request.update({
      modificationRequested: true,
      modificationReason: reason
    });

    return request;
  }

  // =========================
  // GET BUYER REQUESTS
  // =========================
  static async getBuyerRequests(buyerId, filters = {}) {
    const where = { userId: buyerId };
    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;

    return await PurchaseRequest.findAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'subscriptionTier'] },
        { model: Category, as: 'category', attributes: ['id', 'name_ar', 'name_en'] }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  // =========================
  // STATE MACHINE & TRANSITIONS
  // =========================

  static canTransition(currentStatus, newStatus) {
    // 1. Check Global Rules (ANY -> X)
    if (GLOBAL_TRANSITIONS[newStatus]) {
      return true; // Policy/Auth will restrict who can do this (e.g. Owner/Buyer)
    }

    // 2. Check Specific State Map
    const allowed = STATUS_TRANSITIONS[currentStatus];
    return allowed && allowed.includes(newStatus);
  }

  static async handleSideEffects(request, newStatus, actor) {
    // 1. Deal Creation on Acceptance
    if (newStatus === 'accepted') {
      // Find the accepted quote
      const acceptedQuote = await PriceQuote.findOne({
        where: { purchaseRequestId: request.id, status: 'accepted' },
        include: [{ model: User, as: 'seller' }]
      });

      if (!acceptedQuote) {
        // Technical integrity error, not auth error
        throw new Error('Integrity Error: Cannot accept request without an accepted quote.');
      }

      const invoiceData = {
        invoiceNumber: `INV-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        date: new Date(),
        buyer: {
          id: request.user.id,
          name: request.user.name,
          email: request.user.email,
          contactNumbers: request.contactNumbers
        },
        seller: {
          id: acceptedQuote.seller.id,
          name: acceptedQuote.seller.name,
          businessName: acceptedQuote.seller.businessName,
          email: acceptedQuote.seller.email
        },
        items: [{
          description: request.title,
          quantity: request.quantity,
          unit: request.unit,
          price: acceptedQuote.amount
        }],
        totalAmount: acceptedQuote.amount,
        currency: acceptedQuote.currency,
        terms: acceptedQuote.notes
      };

      await Deal.create({
        purchaseRequestId: request.id,
        priceQuoteId: acceptedQuote.id,
        buyerId: request.userId,
        sellerId: acceptedQuote.sellerId,
        finalAmount: acceptedQuote.amount,
        status: 'processing',
        invoiceData
      });
    }

    // 2. Future: Notifications
    // await NotificationService.notifyStatusChange(request, newStatus, actor);
  }



  /**
   * Transition Request Status (Strict State Machine)
   * Auth assumed handled by Policy/Controller.
   * @param {string} requestId 
   * @param {string} newStatus 
   * @param {Object} authContext - { principal, actor, delegation } from req.auth
   * @param {string} reason - Optional reason for transition
   */
  static async transitionRequestStatus(requestId, newStatus, authContext, reason = null) {
    const request = await PurchaseRequest.findByPk(requestId, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email', 'subscriptionTier'] },
        { model: Category, as: 'category', attributes: ['id', 'name_ar', 'name_en'] }
      ]
    });

    if (!request) throw new Error('Request not found');

    const currentStatus = request.status;

    // 1. Validation (State Machine)
    // Check for Admin Override Logic if needed, or strict Strict.
    // Spec: "No side transitions."
    if (!this.canTransition(currentStatus, newStatus)) {
      throw new Error(`Invalid Status Transition: ${currentStatus} -> ${newStatus}`);
    }

    // 1.1 Mandate Rules Validation
    const quoteCount = await PriceQuote.count({ where: { purchaseRequestId: requestId } });

    switch (newStatus) {
      case 'quoting':
        // Rule: Quote exists
        if (currentStatus === 'published' && quoteCount === 0) {
          // Technically, this is called AFTER quote creation in QuoteService, ensuring count > 0.
          // But if called manually without quotes, it should fail.
          throw new Error('Rule Violation: Cannot move to QUOTING without existing quotes.');
        }
        break;
      case 'awaiting_decision':
        // Rule: >= N quotes (Let's assume N=1 for now, or 3?)
        // Mandate says ">= N". Usually implies N > 1 or N > 0.
        // Let's enforce N=1 at least.
        if (quoteCount < 1) {
          throw new Error('Rule Violation: Insufficient quotes for AWAITING_DECISION.');
        }
        break;
    }

    // 2. Apply State
    request.status = newStatus;

    // 2.1 Update Status History (Legacy Support)
    const { actor } = authContext || {};
    const statusHistory = request.statusHistory || []; // Assuming model has this field as JSONB
    statusHistory.push({
      from: currentStatus,
      to: newStatus,
      userId: actor ? actor.id : 'system',
      userName: actor ? actor.name : 'System',
      reason: reason || 'State Transition',
      timestamp: new Date().toISOString()
    });
    // Ensure we write it back if it's a JSON field
    request.setDataValue('statusHistory', statusHistory);
    // request.statusHistory = statusHistory; // Sequelize sometimes needs setDataValue for JSON updates trigger

    // 3. Persist
    await request.save();

    // 4. Audit Log (Mandatory)
    // Construct mockReq for AuditHelper (which expects req.auth, req.ip, etc)
    const mockReq = {
      auth: authContext,
      user: authContext.principal || { id: authContext.id }, // Fallback
      ip: authContext.ip,
      headers: { 'user-agent': authContext.userAgent },
      connection: { remoteAddress: authContext.ip }
    };

    const target = { type: 'PurchaseRequest', id: request.id };
    const details = { previousStatus: currentStatus, newStatus, reason };
    const snapshots = {}; // Could add { before: { status: currentStatus }, after: { status: newStatus } }

    await AuditHelper.log(mockReq, `REQUEST_STATUS_${newStatus.toUpperCase()}`, target, snapshots, details);

    // 5. Side Effects (Async logic separated)
    // We await here for data consistency, but could be backgrounded.
    await this.handleSideEffects(request, newStatus, actor || authContext);

    return request;
  }

  // =========================
  // VALIDATION HELPERS
  // =========================
  static validateContactNumbers(tier, requestData) {
    const maxNumbers = { free: 1, plan_a: 2, plan_b: Infinity };
    const contactNumbers = requestData.contactNumbers || [];
    if (contactNumbers.length > maxNumbers[tier]) {
      throw new Error(MSG.ar.ERR_CONTACT_LIMIT(tier, maxNumbers[tier]));
    }
  }

  static validateDeliveryLocations(tier, requestData) {
    const locations = requestData.deliveryLocations || [];
    if ((tier === 'free' || tier === 'plan_a') && locations.length > 1) {
      throw new Error(MSG.ar.ERR_LOCATIONS_PLAN_B);
    }
  }

  static validateAttachments(tier, requestData) {
    const images = requestData.images || [];
    const pdfs = requestData.pdfAttachments || [];
    const locations = requestData.deliveryLocations || [];

    if (tier === 'free') {
      if (images.length > 0) throw new Error(MSG.ar.ERR_IMAGES_PLAN);
      if (pdfs.length > 1) throw new Error(MSG.ar.ERR_PDF_ONE);
    } else if (tier === 'plan_a') {
      if (images.length > 1) throw new Error(MSG.ar.ERR_IMAGES_PLAN_A);
      if (pdfs.length > 1) throw new Error(MSG.ar.ERR_PDF_PLAN_A);
    } else if (tier === 'plan_b') {
      locations.forEach((loc, idx) => {
        const locAttachments = loc.attachments || [];
        const locImages = locAttachments.filter(a => a.type === 'image').length;
        const locPDFs = locAttachments.filter(a => a.type === 'pdf').length;
        if (locImages > 2) throw new Error(MSG.ar.ERR_LOC_IMAGES_PLAN_B(idx + 1));
        if (locPDFs > 1) throw new Error(MSG.ar.ERR_LOC_PDF_PLAN_B(idx + 1));
      });
    }
  }

  static validateDirectPurchase(tier, requestData) {
    if (requestData.directPurchase) {
      if (tier === 'free') throw new Error(MSG.ar.ERR_DIRECT_TARGET_PLAN);
      if (!requestData.targetSellerId) throw new Error(MSG.ar.ERR_DIRECT_TARGET_MISSING);
    }
  }

  static validatePrivacySettings(tier, requestData) {
    if (tier === 'free') {
      if (requestData.hideOffers && requestData.status !== 'draft') {
        throw new Error('Free tier can only hide offers before publishing');
      }
      if (requestData.hidePersonalInfo) {
        throw new Error('Hiding personal info requires Plan A or Plan B');
      }
    }
  }

  static validateWrittenNumbers(requestData) {
    const writtenNumbersRegex = /(صفر|واحد|اثنان|اثنين|اثنتين|ثلاثة|ثلاث|اربعة|اربع|أربعة|أربع|خمسة|خمس|ستة|ست|سبعة|سبع|ثمانية|ثمان|تسعة|تسع|عشرة|عشر)/gi;
    const errors = [];
    if (requestData.title && writtenNumbersRegex.test(requestData.title)) errors.push(MSG.ar.ERR_NO_NUMBERS_IN_TITLE);
    if (requestData.description && writtenNumbersRegex.test(requestData.description)) errors.push(MSG.ar.ERR_NO_NUMBERS_IN_DESC);
    if (errors.length > 0) throw new Error(errors.join('. '));
  }

  // =========================
  // REPOST REQUEST
  // =========================
  static async repostRequest(requestId, buyerId) {
    const originalRequest = await PurchaseRequest.findByPk(requestId);
    if (!originalRequest) throw new Error('Request not found');

    if (originalRequest.userId !== buyerId) {
      throw new Error('Unauthorized: You can only repost your own requests');
    }

    // 1. التحقق من قيود الاشتراك (هل يمكنه إنشاء طلب جديد؟)
    const canCreate = await SubscriptionService.canCreateRequest(buyerId);
    if (!canCreate.canCreate) throw new Error(canCreate.reason);

    // 2. نسخ البيانات
    const requestData = originalRequest.toJSON();

    // إزالة الحقول التي يجب أن تكون جديدة
    delete requestData.id;
    delete requestData.createdAt;
    delete requestData.updatedAt;
    delete requestData.status;
    delete requestData.viewCount;
    delete requestData.quoteCount;
    delete requestData.modificationRequested;
    delete requestData.modificationReason;
    delete requestData.lastModifiedAt;

    // تعيين قيم جديدة
    requestData.status = 'published'; // أو draft حسب الرغبة، سأجعله published للتسهيل
    requestData.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 أيام افتراضياً
    requestData.is_active = true;

    // 3. إنشاء الطلب الجديد
    const newRequest = await PurchaseRequest.create(requestData);

    // 4. تحديث عداد المنشورات
    await SubscriptionService.incrementPostCount(buyerId);

    return newRequest;
  }
}

module.exports = RequestService;
