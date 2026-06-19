// I have no idea why this works with UUIDs but it does. DO NOT TOUCH.
const debug = require("debug")("app:requestService");
const {
  PurchaseRequest,
  User,
  Category,
  Deal,
  PriceQuote,
} = require("../sequelize_setup");
const SubscriptionService = require("./subscriptionService");
const AuditHelper = require("../utils/AuditHelper");
const marketMonitoringService = require("./marketMonitoringService");
const { Op } = require("sequelize");
const MSG = require("../utils/responseMessages");
const AppError = require("../utils/appError");
const { appendEventLog } = require("./eventLogService");
const { isShadowRestricted } = require("./sanctionService");
const NotificationService = require("./notificationService");

const STATUS_TRANSITIONS = {
  // Strict F3 State Machine
  draft: ["published", "rfq_published"],
  published: ["under_review", "quoting"],
  rfq_published: ["quoting", "cancelled"],
  under_review: ["published", "cancelled"],
  quoting: ["awaiting_decision", "deal_in_progress"], // Allow direct transition to deal
  awaiting_decision: ["accepted", "deal_in_progress"],
  accepted: ["deal_in_progress", "completed"],
  deal_in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  suspended: ["published", "draft"], // Owner/Admin restoration
};

// Global "ANY" Transitions (Handled in logic)
const GLOBAL_TRANSITIONS = {
  suspended: ["*"], // Can suspend from anywhere
  cancelled: ["*"], // Can cancel from anywhere (subject to policy)
};

class RequestService {
  // =========================
  // CREATE REQUEST
  // =========================
  static async createRequest(buyerId, requestData) {
    const user = await User.findByPk(buyerId);
    if (!user) throw new AppError("User not found", 404);
    if (user.role !== "buyer")
      throw new AppError("Only buyers can create purchase requests", 403);

    if (user.is_restricted || !user.isActive) {
      throw new AppError("حسابك مقيد. لا يمكنك إنشاء طلبات جديدة حالياً.", 403);
    }

    if (
      user.subscriptionTier === "free" &&
      requestData.post_type === "direct"
    ) {
      throw new AppError("الشراء المباشر يتطلب خطة أ أو خطة ب", 403);
    }

    const canCreate = await SubscriptionService.canCreateRequest(buyerId);
    if (!canCreate.canCreate) throw new AppError(canCreate.reason, 403);

    console.log("[Service] ✅ Subscription check passed, running validators...");
    this.validateContactNumbers(user.subscriptionTier, requestData);
    this.validateDeliveryLocations(user.subscriptionTier, requestData);
    this.validateAttachments(user.subscriptionTier, requestData);
    this.validatePrivacySettings(user.subscriptionTier, requestData);
    this.validateDirectPurchase(user.subscriptionTier, requestData);
    this.validateWrittenNumbers(requestData);
    console.log("[Service] ✅ All validators passed, calling PurchaseRequest.create...");

    const request = await PurchaseRequest.create({
      userId: buyerId,
      title: requestData.title,
      categoryId: requestData.categoryId,
      sectorId: requestData.sectorId,
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
      status: "draft",
      post_type: requestData.post_type || "standard",
      auction_type: requestData.auction_type || "public",
      delivery_city: requestData.delivery_city,
      delivery_date: requestData.delivery_date,
      contact_number: requestData.contact_number,
      attachments: requestData.attachments || [],
      expiresAt: requestData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      price_range_min: requestData.price_range_min,
      price_range_max: requestData.price_range_max,
      fixed_price: requestData.fixed_price,
      advanced_options: requestData.advanced_options || {},
      is_active: true,
      deviceFingerprint: requestData.deviceFingerprint,
      organization_id: requestData.organization_id || user.organization_id,
    });

    console.log("[Service] ✅ PurchaseRequest.create succeeded, id:", request.id);

    await SubscriptionService.incrementPostCount(buyerId);
    console.log("[Service] ✅ Post count incremented");

    try {
      const { AuditLog } = require("../sequelize_setup");
      await AuditLog.create({
        user_id: buyerId,
        organization_id: request.organization_id || null,
        action: "CREATE_REQUEST",
        entity_type: "PurchaseRequest",
        entity_id: request.id,
        new_data: request.toJSON(),
      });
    } catch (err) {
      console.error("AuditLog Error:", err);
    }

    return request;
  }

  // =========================
  // EDIT REQUEST
  // =========================
  static async editRequest(requestId, buyerId, updates) {
    const request = await PurchaseRequest.findByPk(requestId);
    if (!request) throw new AppError("Request not found", 404);

    if (request.userId !== buyerId) {
      throw new AppError(
        "Unauthorized: You can only edit your own requests",
        403,
      );
    }

    const user = await User.findByPk(buyerId);
    const currentStatus = request.status;
    const isPremiumBuyer =
      user.subscriptionTier === "plan_a" || user.subscriptionTier === "plan_b";

    // Premium users can edit published/negotiating requests
    if (currentStatus === "published" || currentStatus === "negotiating") {
      if (!isPremiumBuyer) {
        throw new AppError(
          `❌ FORBIDDEN: Cannot edit request in status "${currentStatus}". ` +
            `This requires Plan A or Plan B subscription.`,
          403,
        );
      }
    } else if (currentStatus !== "draft") {
      // If not draft, check quotes (even for premium in other statuses like accepted)
      const quoteCount = await PriceQuote.count({
        where: { purchaseRequestId: requestId },
      });

      if (quoteCount > 0) {
        throw new AppError(
          "Cannot edit request after receiving quotes. Request modification requires admin intervention.",
          400,
        );
      }
    }

    if (updates.images || updates.pdfAttachments) {
      this.validateAttachments(user.subscriptionTier, {
        images: updates.images || request.images,
        pdfAttachments: updates.pdfAttachments || request.pdfAttachments,
      });
    }

    const allowedFields = [
      "title",
      "description",
      "quantity",
      "unit",
      "deliveryLocations",
      "deliveryDates",
      "requiresDelivery",
      "requiresInstallation",
      "contactNumbers",
      "images",
      "pdfAttachments",
      "hideOffers",
      "hidePersonalInfo",
      "fixed_price",
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
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
      return (
        key === Op[opName] ||
        (typeof key === "symbol" && key.toString() === `Symbol(${opName})`)
      );
    };

    const processCondition = (key, value) => {
      // Handle Op.and
      if (key === Op.and || isOp(key, "and")) {
        const andClauses = value
          .map((cond) => {
            const subClauses = [];
            // If cond is an object with multiple keys (e.g. status, expiresAt), process each
            Object.getOwnPropertySymbols(cond)
              .concat(Object.keys(cond))
              .forEach((subKey) => {
                const result = processCondition(subKey, cond[subKey]);
                if (result) subClauses.push(result);
              });
            return subClauses.length > 0
              ? `(${subClauses.join(" AND ")})`
              : null;
          })
          .filter(Boolean);
        return andClauses.length > 0 ? andClauses.join(" AND ") : null;
      }

      // Handle Op.or
      if (key === Op.or || isOp(key, "or")) {
        const orClauses = value
          .map((cond) => {
            const subClauses = [];
            Object.getOwnPropertySymbols(cond)
              .concat(Object.keys(cond))
              .forEach((subKey) => {
                const result = processCondition(subKey, cond[subKey]);
                if (result) subClauses.push(result);
              });
            return subClauses.length > 0
              ? `(${subClauses.join(" AND ")})`
              : null;
          })
          .filter(Boolean);
        return orClauses.length > 0 ? `(${orClauses.join(" OR ")})` : null;
      }

      if (
        typeof value === "object" &&
        value !== null &&
        !(value instanceof Date)
      ) {
        // Handle Operators inside value (e.g. { [Op.in]: ... })
        const ops = Object.getOwnPropertySymbols(value);
        if (ops.length > 0) {
          const opResults = ops
            .map((op) => {
              if (op === Op.in || isOp(op, "in")) {
                const paramName = `param${paramCounter++}`;
                replacements[paramName] = value[op];
                return `"${key}" IN (:${paramName})`;
              }
              if (op === Op.ne || isOp(op, "ne")) {
                const paramName = `param${paramCounter++}`;
                replacements[paramName] = value[op];
                return `"${key}" != :${paramName}`;
              }
              if (op === Op.gt || isOp(op, "gt")) {
                const paramName = `param${paramCounter++}`;
                replacements[paramName] = value[op];
                return `"${key}" > :${paramName}`;
              }
              if (op === Op.iLike || isOp(op, "iLike")) {
                const paramName = `param${paramCounter++}`;
                replacements[paramName] = value[op];
                return `"${key}" ILIKE :${paramName}`;
              }
              return null;
            })
            .filter(Boolean);
          return opResults.join(" AND ");
        }
      }

      // Simple key-value pair
      if (typeof key === "string") {
        const paramName = `param${paramCounter++}`;
        replacements[paramName] = value;
        return `"${key}" = :${paramName}`;
      }

      return null;
    };

    Object.getOwnPropertySymbols(whereConditions)
      .concat(Object.keys(whereConditions))
      .forEach((key) => {
        const result = processCondition(key, whereConditions[key]);
        if (result) clauses.push(result);
      });

    return { sql: clauses.join(" AND "), replacements };
  }

  // =========================
  // HELPER: Execute Free Tier Query with ROW_NUMBER
  // =========================
  static async executeFreeTierQuery(whereConditions, limit, offset) {
    const { sequelize } = require("../sequelize_setup");
    const { sql: whereSql, replacements } =
      this.buildWhereClause(whereConditions);

    // ✅ إضافة logging للتشخيص
    console.log("[DEBUG] Generated WHERE clause:", whereSql);
    console.log("[DEBUG] Replacements:", replacements);

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
      type: sequelize.QueryTypes.SELECT,
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
      type: sequelize.QueryTypes.SELECT,
    });

    const totalCount = parseInt(countResult.count);

    // Manually load associations for raw query results
    const requestIds = results.map((r) => r.id);
    if (requestIds.length > 0) {
      const users = await User.findAll({
        where: { id: { [Op.in]: results.map((r) => r.userId) } },
        attributes: ["id", "name", "subscriptionTier", "rank"],
      });
      const categories = await Category.findAll({
        where: { id: { [Op.in]: results.map((r) => r.categoryId) } },
        attributes: ["id", "name_ar", "name_en"],
      });

      const userMap = {};
      users.forEach((u) => {
        userMap[u.id] = u;
      });
      const categoryMap = {};
      categories.forEach((c) => {
        categoryMap[c.id] = c;
      });

      results.forEach((r) => {
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
        hasPreviousPage: offset > 0,
      },
    };
  }

  // =========================
  // GET ALL REQUESTS (FOR HOMEPAGE) - OPTIMIZED
  // =========================
  static async getAllRequests(
    userRole = null,
    userTier = null,
    filters = {},
    user = null,
  ) {
    const where = {};

    // أ) منطق الدور (Role Logic) - PRESERVED EXACTLY
    if (userRole === "admin" || userRole === "super_admin") {
      // جميع الطلبات ما عدا المسودات
      where.status = { [Op.ne]: "draft" };
    } else if (userRole === "seller" || userRole === "buyer") {
      // فقط المنشورة أو قيد التفاوض
      where.status = { [Op.in]: ["published", "negotiating", "rfq_published"] };
      where[Op.or] = [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: new Date() } },
      ];
    } else {
      // الزوار: نفس البائع/المشتري
      where.status = { [Op.in]: ["published", "negotiating", "rfq_published"] };
      where[Op.or] = [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: new Date() } },
      ];
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
            { description: { [Op.iLike]: searchKeyword } },
          ],
        },
      ];

      // حذف الشروط المكررة - PRESERVED EXACTLY
      delete where.status;
      delete where.expiresAt;
      delete where[Op.or];
      if (where.userId) delete where.userId;
      if (where.categoryId) delete where.categoryId;
      // لا نحذف delivery_city لأنه جزء من currentConditions
    }

    if (user && user.id) {
      const restricted = await isShadowRestricted(user.id);
      if (restricted) {
        // Shadow restricted users can only see requests older than 24 hours
        where.createdAt = {
          [Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000),
        };
      }
    }

    // Extract pagination parameters
    const page = parseInt(filters.page) || 1;
    const limit = Math.min(parseInt(filters.limit) || 20, 100);
    const offset = (page - 1) * limit;

    // ب) قيود الخطة المجانية (Free Tier Logic) - NOW AT DATABASE LEVEL
    if (userRole === "buyer" && userTier === "free") {
      // Use raw SQL with ROW_NUMBER for performance
      return await this.executeFreeTierQuery(where, limit, offset);
    }

    // For all other users: standard Sequelize query with pagination
    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "subscriptionTier", "rank"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["id", "name_ar", "name_en"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      distinct: true,
    });

    return {
      data: rows,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        hasNextPage: page < Math.ceil(count / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  // GET PUBLISHED REQUESTS (جديدة ومعدلة)
  // =========================
  static async getPublishedRequests(categoryId = null, filters = {}) {
    const { Op } = require("sequelize");
    const where = {
      status: filters.status || { [Op.in]: ["published", "rfq_published"] },
      // Include requests with NULL expiresAt OR future expiresAt
      [Op.or]: [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: new Date() } },
      ],
    };
    if (categoryId) where.categoryId = categoryId;

    const limit = parseInt(filters.limit) || 50;
    const page = parseInt(filters.page) || 1;
    const offset = (page - 1) * limit;

    if (filters.search) {
      where[Op.or] = [
        ...(where[Op.or] || []),
        // search is handled separately — keep expiresAt filter intact
      ];
      // Reset or clause with both expiresAt and search
      const expiresAtClause = [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: new Date() } },
      ];
      where[Op.or] = expiresAtClause;
      where.title = { [Op.iLike]: `%${filters.search}%` };
    }

    const rows = await PurchaseRequest.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "subscriptionTier", "rank"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["id", "name_ar", "name_en"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return rows;
  }

  // =========================
  // GET REQUEST DETAILS
  // =========================
  static async getRequestDetails(requestId, userId) {
    // Sensitive telemetry removed as per Sovereign Policy
    try {
      // إعداد الـ includes الأساسية
      const includes = [
        {
          model: User,
          as: "user",
          attributes: [
            "id",
            "name",
            "subscriptionTier",
            "rank",
            "businessName",
          ],
        },
        {
          model: Category,
          as: "category",
          attributes: ["id", "name_ar", "name_en"],
        },
      ];

      // جلب الطلب الأساسي بدون quotes أولاً
      const request = await PurchaseRequest.findByPk(requestId, {
        include: includes,
      });

      if (!request) {
        throw new AppError("Request not found", 404);
      }

      const plainReq = request.get({ plain: true });
      console.log(`Request found: ${plainReq.id}, Status: ${plainReq.status}`);

      // تحديد صلاحيات المستخدم
      console.log("REQ USER ID PASSED TO SERVICE =", userId);
      const user = userId ? await User.findByPk(userId) : null;
      const isOwner = user && user.id === plainReq.userId;
      const isAdmin =
        user && (user.role === "admin" || user.role === "super_admin");
      const isSeller = user && user.role === "seller";

      // جلب الـ quotes بناءً على الصلاحيات
      let quotes = [];
      const quoteWhere = { purchaseRequestId: requestId };

      console.log("USER ROLE =", user?.role);
      console.log("IS SELLER =", isSeller);
      console.log("REQUEST ID =", requestId);
      console.log("QUOTE WHERE =", quoteWhere);

      if (isOwner || isAdmin) {
        // المالك أو الأدمن: يرون جميع الـ quotes
        console.log("USER ID", userId);
        console.log("IS SELLER", isSeller);
        console.log("QUOTE WHERE", quoteWhere);

        console.log("FINAL QUOTE WHERE", JSON.stringify(quoteWhere, null, 2));

        quotes = await PriceQuote.findAll({
          where: quoteWhere,
          include: [
            {
              model: User,
              as: "seller",
              attributes: ["id", "name", "businessName", "rank"],
            },
          ],
          order: [["createdAt", "DESC"]],
          logging: console.log,
        });
        console.log("QUOTES FOUND", quotes.length);
      } else if (isSeller) {
        // البائع: يرون فقط الـ quotes الخاصة بهم في المزاد السري
        if (plainReq.auction_type === "secret") {
          quoteWhere.sellerId = userId;
        }

        console.log("USER ROLE =", user?.role);
        console.log("USER ID =", userId);
        console.log("REQUEST ID =", requestId);
        console.log("QUOTE WHERE =", JSON.stringify(quoteWhere));

        const directCount = await PriceQuote.count({
          where: { purchaseRequestId: requestId }
        });
        console.log("DIRECT COUNT =", directCount);

        const rawQuotes = await PriceQuote.findAll({
          where: { purchaseRequestId: requestId },
          raw: true,
        });
        console.log("RAW QUOTES LENGTH =", rawQuotes.length);

        quotes = await PriceQuote.findAll({
          where: quoteWhere,
          include: [
            {
              model: User,
              as: "seller",
              attributes: ["id", "name", "businessName", "rank"],
            },
          ],
          order: [["createdAt", "DESC"]],
          logging: console.log,
        });
        console.log("NORMAL QUOTES LENGTH =", quotes.length);

        // في المزاد العام، إخفاء معلومات البائعين الآخرين
        if (plainReq.auction_type === "public" && quotes.length > 0) {
          quotes = quotes.map((quote) => {
            const quoteData = quote.get({ plain: true });
            if (quoteData.sellerId !== userId) {
              // إخفاء معلومات البائع الآخر
              quoteData.seller = {
                id: null,
                name: "بائع آخر",
                businessName: "---",
                rank: null,
              };
              quoteData.amount = null;
              quoteData.notes = "عرض مخفي";
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
      if (error instanceof AppError) throw error;
      throw new AppError(
        "An internal error occurred while fetching request details.",
        500,
      );
    }
  }

  // =========================
  // REQUEST MODIFICATION (ADMIN)
  // =========================
  static async requestModification(requestId, buyerId, reason) {
    const request = await PurchaseRequest.findByPk(requestId);
    if (!request) throw new AppError("Request not found", 404);

    if (request.userId !== buyerId) {
      throw new AppError("Unauthorized access denied.", 403);
    }

    if (request.canBeModified()) {
      throw new AppError(
        "You can edit this request directly. No admin approval needed.",
        400,
      );
    }

    await request.update({
      modificationRequested: true,
      modificationReason: reason,
    });

    return request;
  }

  // =========================
  // GET BUYER REQUESTS
  // =========================
  // =========================
  // GET BUYER REQUESTS
  // =========================
  static async getBuyerRequests(buyerId, filters = {}) {
    const where = { userId: buyerId };
    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;

    const page = parseInt(filters.page) || 1;
    const limit = Math.min(parseInt(filters.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const { count, rows } = await PurchaseRequest.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "subscriptionTier"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["id", "name_ar", "name_en"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return {
      data: rows,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalCount: count,
        totalPages: Math.ceil(count / limit),
        hasNextPage: page < Math.ceil(count / limit),
        hasPreviousPage: page > 1,
      },
    };
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
    if (newStatus === "accepted" || newStatus === "deal_in_progress") {
      // Find the accepted quote
      const acceptedQuote = await PriceQuote.findOne({
        where: { purchaseRequestId: request.id, status: "accepted" },
        include: [{ model: User, as: "seller" }],
      });

      if (!acceptedQuote) {
        // Technical integrity error, sanitized for production
        throw new AppError(
          "Integrity Check Failed: Missing accepted quote for deal generation.",
          500,
        );
      }

      const invoiceNumber =
        await require("../utils/invoiceHelper").generateInvoiceNumber(null);
      const taxAmount = require("../utils/invoiceHelper").calculateTax(
        acceptedQuote.amount,
      );

      const invoiceData = {
        invoiceNumber,
        taxAmount,
        date: new Date(),
        buyer: {
          id: request.user.id,
          name: request.user.name,
          email: request.user.email,
          contactNumbers: request.contactNumbers,
        },
        seller: {
          id: acceptedQuote.seller.id,
          name: acceptedQuote.seller.name,
          businessName: acceptedQuote.seller.businessName,
          email: acceptedQuote.seller.email,
        },
        items: [
          {
            description: request.title,
            quantity: request.quantity,
            unit: request.unit,
            price: acceptedQuote.amount,
          },
        ],
        totalAmount: acceptedQuote.amount,
        currency: acceptedQuote.currency,
        terms: acceptedQuote.notes,
      };

      // Use DealService for centralized logic (Limit Check & Commission Generation)
      const DealService = require("./dealService");
      await DealService.createDeal({
        purchaseRequest: request,
        acceptedQuote,
        invoiceData,
      });
    }

    // 2. Notifications
    await NotificationService.sendToUser(
      request.userId,
      "REQUEST_STATUS_CHANGE",
      {
        title: "تحديث حالة الطلب",
        message: `تغيرت حالة طلبك "${request.title}" إلى ${newStatus}`,
        data: { requestId: request.id, status: newStatus },
      },
    );
  }

  /**
   * Transition Request Status (Strict State Machine)
   * Auth assumed handled by Policy/Controller.
   * @param {string} requestId
   * @param {string} newStatus
   * @param {Object} authContext - { principal, actor, delegation } from req.auth
   * @param {string} reason - Optional reason for transition
   */
  static async transitionRequestStatus(
    requestId,
    newStatus,
    authContext,
    reason = null,
  ) {
    const request = await PurchaseRequest.findByPk(requestId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email", "subscriptionTier"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["id", "name_ar", "name_en"],
        },
      ],
    });

    if (!request) throw new AppError("Request not found", 404);

    const currentStatus = request.status;

    // 1. Validation (State Machine)
    if (!this.canTransition(currentStatus, newStatus)) {
      // 🟥 LOGIC RESILIENCY: Auto-suspend sellers attempting illegal jumps
      if (
        authContext &&
        authContext.actor &&
        authContext.actor.role === "seller"
      ) {
        const sellerId = authContext.actor.id;
        console.error(
          `🚨 LOGIC VIOLATION DETECTED: Seller ${sellerId} attempted jump ${currentStatus} -> ${newStatus}. Suspending account.`,
        );

        await User.update(
          { isActive: false, is_restricted: true },
          { where: { id: sellerId } },
        );

        // Log to ActionLogs
        const { ActionLog } = require("../sequelize_setup");
        await ActionLog.create({
          adminId: "SYSTEM_AUTOPILOT",
          targetId: sellerId,
          fieldName: "ACCOUNT_STATUS",
          oldValue: "active",
          newValue: "suspended_due_to_logic_violation",
          ipAddress: authContext.ip || "0.0.0.0",
          timestamp: new Date(),
        });

        throw new AppError(
          "CRITICAL LOGIC VIOLATION: Your account has been suspended for attempting an illegal state transition.",
          403,
        );
      }

      throw new AppError(
        `Invalid Status Transition: ${currentStatus} -> ${newStatus}`,
        400,
      );
    }

    // 1.1 Mandate Rules Validation
    const quoteCount = await PriceQuote.count({
      where: { purchaseRequestId: requestId },
    });

    switch (newStatus) {
      case "quoting":
        // Rule: Quote exists
        if (currentStatus === "published" && quoteCount === 0) {
          throw new AppError(
            "Rule Violation: Cannot move to QUOTING without existing quotes.",
            400,
          );
        }
        break;
      case "awaiting_decision":
        if (quoteCount < 1) {
          throw new AppError(
            "Rule Violation: Insufficient quotes for AWAITING_DECISION.",
            400,
          );
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
      userId: actor ? actor.id : "system",
      userName: actor ? actor.name : "System",
      reason: reason || "State Transition",
      timestamp: new Date().toISOString(),
    });
    // Ensure we write it back if it's a JSON field
    request.setDataValue("statusHistory", statusHistory);
    // request.statusHistory = statusHistory; // Sequelize sometimes needs setDataValue for JSON updates trigger

    // 3. Persist
    await request.save();

    const actualActor = authContext?.actor ||
      authContext?.principal || { id: request.userId };

    await appendEventLog({
      actorId: actualActor?.id || request.userId,
      actorRole: actualActor?.role || "system",
      entityType: "request",
      entityId: request.id,
      actionType: "status_transition",
      beforeState: { status: currentStatus },
      afterState: { status: newStatus },
      ipAddress: authContext?.ip || "127.0.0.1",
      userAgent: authContext?.userAgent || "Internal/Service",
    });

    // 4. Audit Log (Mandatory)
    // Construct mockReq for AuditHelper (which expects req.auth, req.ip, etc)
    const mockReq = {
      auth: authContext || { principal: actualActor, actor: actualActor },
      user: actualActor,
      ip: authContext?.ip || "127.0.0.1",
      headers: { "user-agent": authContext?.userAgent || "Internal/Service" },
      connection: { remoteAddress: authContext?.ip || "127.0.0.1" },
    };

    const target = { type: "PurchaseRequest", id: request.id };
    const details = { previousStatus: currentStatus, newStatus, reason };
    const snapshots = {}; // Could add { before: { status: currentStatus }, after: { status: newStatus } }

    await AuditHelper.log(
      mockReq,
      `REQUEST_STATUS_${newStatus.toUpperCase()}`,
      target,
      snapshots,
      details,
    );

    // 5. 🚀 SIDE EFFECTS (SOVEREIGN SECTOR NOTIFICATIONS)
    if (newStatus === "published" || newStatus === "rfq_published") {
      // Fire and Forget (Async) to not block response
      this.notifySectorSellers(request).catch((err) =>
        console.error("⚠️ Sector Notification Error:", err),
      );
    }

    // 5.1 Side Effects (Async logic separated)
    // We await here for data consistency, but could be backgrounded.
    await this.handleSideEffects(request, newStatus, actor || authContext);

    return request;
  }

  // =========================
  // HELPER: Notify Sector Sellers
  // =========================
  static async notifySectorSellers(request) {
    const NotificationService = require("./notificationService");

    const sectorId = request.sectorId;
    if (!sectorId) return;

    console.log(
      `🔔 Notifying sellers in Sector ID: ${sectorId} for Request: ${request.title}`,
    );

    // Find Subscribed Sellers
    const sellers = await User.findAll({
      attributes: ["id"],
      include: [
        {
          model: Category,
          as: "sectors",
          where: { id: sectorId },
          attributes: [],
          through: { attributes: [] }, // Prevents fetching join table columns
        },
      ],
      where: {
        role: "seller",
        isActive: true,
      },
    });

    if (sellers.length === 0) {
      console.log("ℹ️ No sellers found for this sector.");
      return;
    }

    console.log(`📨 Sending notifications to ${sellers.length} sellers...`);

    const notificationData = {
      requestId: request.id,
      title: "فرصة جديدة!",
      message: `هناك طلب شراء جديد في قطاعك: ${request.title}. قدم عرضك الآن!`,
      link: `/requests/${request.id}`, // Frontend Link
    };

    // Loop and Send
    const interactions = sellers.map((s) => ({
      sellerId: s.id,
      requestId: request.id,
      interactionType: "RECEIVED",
      metadata: { method: "app_notification", sectorId },
    }));
    const { SellerInteractionEvent } = require("../sequelize_setup");
    await SellerInteractionEvent.bulkCreate(interactions);
    await Promise.all(
      sellers.map((s) =>
        NotificationService.sendToUser(
          s.id,
          "NEW_SECTOR_REQUEST",
          notificationData,
        ),
      ),
    );

    console.log("✅ Sector notifications dispatched.");
  }

  // =========================
  // VALIDATION HELPERS
  // =========================
  static validateContactNumbers(tier, requestData) {
    const maxNumbers = { free: 1, plan_a: 2, plan_b: Infinity };
    const contactNumbers = requestData.contactNumbers || [];
    if (contactNumbers.length > maxNumbers[tier]) {
      throw new AppError(MSG.ar.ERR_CONTACT_LIMIT(tier, maxNumbers[tier]), 400);
    }
  }

  static validateDeliveryLocations(tier, requestData) {
    const locations = requestData.deliveryLocations || [];
    if ((tier === "free" || tier === "plan_a") && locations.length > 1) {
      throw new AppError(MSG.ar.ERR_LOCATIONS_PLAN_B, 403);
    }
  }

  static validateAttachments(tier, requestData) {
    const images = requestData.images || [];
    const pdfs = requestData.pdfAttachments || [];
    const locations = requestData.deliveryLocations || [];

    if (tier === "free") {
      if (images.length > 0) throw new AppError(MSG.ar.ERR_IMAGES_PLAN, 403);
      if (pdfs.length > 1) throw new AppError(MSG.ar.ERR_PDF_ONE, 403);
    } else if (tier === "plan_a") {
      if (images.length > 1) throw new AppError(MSG.ar.ERR_IMAGES_PLAN_A, 403);
      if (pdfs.length > 1) throw new AppError(MSG.ar.ERR_PDF_PLAN_A, 403);
    } else if (tier === "plan_b") {
      locations.forEach((loc, idx) => {
        const locAttachments = loc.attachments || [];
        const locImages = locAttachments.filter(
          (a) => a.type === "image",
        ).length;
        const locPDFs = locAttachments.filter((a) => a.type === "pdf").length;
        if (locImages > 2)
          throw new AppError(MSG.ar.ERR_LOC_IMAGES_PLAN_B(idx + 1), 400);
        if (locPDFs > 1)
          throw new AppError(MSG.ar.ERR_LOC_PDF_PLAN_B(idx + 1), 400);
      });
    }
  }

  static validateDirectPurchase(tier, requestData) {
    if (requestData.directPurchase) {
      if (tier === "free")
        throw new AppError(MSG.ar.ERR_DIRECT_TARGET_PLAN, 403);
      if (!requestData.targetSellerId)
        throw new AppError(MSG.ar.ERR_DIRECT_TARGET_MISSING, 400);
    }
  }

  static validatePrivacySettings(tier, requestData) {
    if (tier === "free") {
      if (requestData.hideOffers && requestData.status !== "draft") {
        throw new AppError(
          "Free tier can only hide offers before publishing",
          403,
        );
      }
      if (requestData.hidePersonalInfo) {
        throw new AppError(
          "Hiding personal info requires Plan A or Plan B",
          403,
        );
      }
    }
  }

  static validateWrittenNumbers(requestData) {
    const writtenNumbersRegex =
      /(صفر|واحد|اثنان|اثنين|اثنتين|ثلاثة|ثلاث|اربعة|اربع|أربعة|أربع|خمسة|خمس|ستة|ست|سبعة|سبع|ثمانية|ثمان|تسعة|تسع|عشرة|عشر)/gi;
    const errors = [];
    if (requestData.title && writtenNumbersRegex.test(requestData.title))
      errors.push(MSG.ar.ERR_NO_NUMBERS_IN_TITLE);
    if (
      requestData.description &&
      writtenNumbersRegex.test(requestData.description)
    )
      errors.push(MSG.ar.ERR_NO_NUMBERS_IN_DESC);
    if (errors.length > 0) throw new AppError(errors.join(". "), 400);
  }

  // =========================
  // REPOST REQUEST
  // =========================
  static async repostRequest(requestId, buyerId) {
    const originalRequest = await PurchaseRequest.findByPk(requestId);
    if (!originalRequest) throw new AppError("Request not found", 404);

    if (originalRequest.userId !== buyerId) {
      throw new AppError(
        "Unauthorized: You can only repost your own requests",
        403,
      );
    }

    // 1. التحقق من قيود الاشتراك (هل يمكنه إنشاء طلب جديد؟)
    const canCreate = await SubscriptionService.canCreateRequest(buyerId);
    if (!canCreate.canCreate) throw new AppError(canCreate.reason, 403);

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
    requestData.status = "published"; // أو draft حسب الرغبة، سأجعله published للتسهيل
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
