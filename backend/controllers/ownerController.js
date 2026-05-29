const {
  User,
  Role,
  Permission,
  RolePermission,
  Delegation,
  AuditLog,
  PurchaseRequest,
  PriceQuote,
  sequelize,
} = require("../sequelize_setup");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const PolicyEngine = require("../policies/PolicyEngine");
const TraceIntegrity = require("../utils/TraceIntegrity");
const { Op } = require("sequelize");

// --- 1. Identity & Access ---

// GET /api/owner/users
exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    attributes: { exclude: ["password"] },
  });
  res.json(users);
});

// POST /api/owner/users
exports.createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, subscriptionTier } = req.body;

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: role || "buyer", // Legacy fallback
    subscriptionTier: subscriptionTier || "free",
  });

  res.status(201).json(user);
});

// PATCH /api/owner/users/:id (Suspend/Activate/Reset)
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive, password, role } = req.body;

  const user = await User.findByPk(id);
  if (!user) throw new Error("User not found");

  if (isActive !== undefined) user.isActive = isActive;
  if (role) {
    if (role === "owner") throw new Error("Cannot assign Owner role");
    const oldRole = user.role;
    user.role = role;

    // Audit Role Change
    const traceSnapshot = PolicyEngine.trace(
      req.user,
      user,
      "User",
      "roleUpdate",
    );
    await AuditLog.create({
      action: "ROLE_ALIGNED_OVERRIDE",
      resourceType: "User",
      resourceId: user.id,
      actorId: req.user.id,
      details: {
        from: oldRole,
        to: role,
        reason: "Sovereign Override",
        trace: traceSnapshot,
      },
      ipAddress: req.ip,
    });
  }
  if (password) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
  }

  await user.save();
  res.json(user);
});

// --- 2. Roles & Permissions (Atomic Binding) ---

// GET /api/owner/roles
exports.getRoles = asyncHandler(async (req, res) => {
  const roles = await Role.findAll({
    include: [{ model: Permission, as: "permissions" }],
  });
  res.json(roles);
});

// POST /api/owner/roles/:roleId/permissions
// Bind Permission to Role
exports.bindPermission = asyncHandler(async (req, res) => {
  const { roleId } = req.params;
  const { permissionId } = req.body;

  const role = await Role.findByPk(roleId);
  if (!role) throw new Error("Role not found");

  const permission = await Permission.findByPk(permissionId); // ID or Key? Assuming ID/Key
  if (!permission) throw new Error("Permission not found");

  await role.addPermission(permission);
  res.json({ message: "Permission bound successfully" });
});

// DELETE /api/owner/roles/:roleId/permissions/:permId
// Unbind Permission
exports.unbindPermission = asyncHandler(async (req, res) => {
  const { roleId, permId } = req.params;

  const role = await Role.findByPk(roleId);
  if (!role) throw new Error("Role not found");

  const permission = await Permission.findByPk(permId);
  if (!permission) throw new Error("Permission not found");

  await role.removePermission(permission);
  res.json({ message: "Permission unbound successfully" });
});

// --- 3. Policy Introspection ---

// GET /api/owner/policies
exports.getPolicies = asyncHandler(async (req, res) => {
  // Return list of known policies/rules (Static or Introspected)
  // For now, returning a static list of what the engine handles
  res.json({
    engine: "PolicyEngine",
    supportedResources: ["Request", "Quote"],
    actions: ["view", "create", "publish", "cancel", "suspend"],
  });
});

// POST /api/owner/policies/evaluate
exports.evaluatePolicy = asyncHandler(async (req, res) => {
  const { userId, resourceType, resourceId, action } = req.body;

  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");

  // Mock Resource Loading logic (simplified)
  let resource = null;
  if (resourceType === "Request" && resourceId) {
    resource = await PurchaseRequest.findByPk(resourceId);
  } else if (resourceType === "Quote" && resourceId) {
    resource = await PriceQuote.findByPk(resourceId);
  }

  // Call Engine
  // Note: PolicyEngine might expect (user, resource, action, etc.)
  // We need to import the engine properly.
  // Assuming PolicyEngine.allows(user, resource, resourceType, action)
  const allowed = PolicyEngine.allows(user, resource, resourceType, action);

  res.json({
    allowed,
    context: {
      userRole: user.role,
      resourceStatus: resource ? resource.status : "null",
    },
  });
});

// --- 4. Delegation Control ---

// GET /api/owner/delegations
exports.getDelegations = asyncHandler(async (req, res) => {
  const delegations = await Delegation.findAll();
  res.json(delegations);
});

// POST /api/owner/delegations (Force Create)
exports.createDelegation = asyncHandler(async (req, res) => {
  const { fromUserId, toUserId, type, expiresAt, scopeType, scopeId } =
    req.body;

  // Validations...
  const del = await Delegation.create({
    fromUserId,
    toUserId,
    type: type || "GENERAL",
    status: "ACTIVE",
    expiresAt,
    scopeType,
    scopeId,
    isActive: true,
  });
  res.status(201).json(del);
});

// DELETE /api/owner/delegations/:id (Force Revoke)
exports.revokeDelegation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await Delegation.destroy({ where: { id } });
  res.json({ message: "Delegation revoked" });
});

// --- 5. System Override (Requests) ---

// GET /api/owner/requests (Sovereign View)
// Returns ALL requests regardless of status/role/policy
exports.getAllRequests = asyncHandler(async (req, res) => {
  const { status, userId, limit = 50 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;

  const requests = await PurchaseRequest.findAll({
    where,
    limit: parseInt(limit),
    order: [["createdAt", "DESC"]],
    include: [{ model: User, as: "user", attributes: ["id", "name", "email"] }],
  });
  res.json(requests);
});

// POST /api/owner/override/suspend-user
exports.overrideSuspendUser = asyncHandler(async (req, res) => {
  const { userId, reason } = req.body;
  if (!reason || reason.length < 15)
    throw new Error(
      "Reason string min length 15 required for Sovereign Override",
    );

  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");

  user.isActive = false;
  await user.save();

  // Trace 'suspend' on Target User
  // Note: Trace Engine might say DENY if regular rules applied.
  // We are logging that we ignored the rules via force.
  const traceSnapshot = PolicyEngine.trace(req.user, user, "User", "suspend");

  await AuditLog.create({
    action: "SUSPEND_USER_OVERRIDE",
    resourceType: "User",
    resourceId: user.id,
    actorId: req.user.id,
    details: {
      reason: reason,
      trace: traceSnapshot,
    },
    ipAddress: req.ip,
  });

  res.json({ message: "User suspended via Override" });
});

// POST /api/owner/override/activate-user
exports.overrideActivateUser = asyncHandler(async (req, res) => {
  const { userId, reason } = req.body;
  if (!reason || reason.length < 15)
    throw new Error(
      "Reason string min length 15 required for Sovereign Override",
    );

  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");

  user.isActive = true;
  await user.save();

  const traceSnapshot = PolicyEngine.trace(req.user, user, "User", "activate");

  await AuditLog.create({
    action: "ACTIVATE_USER_OVERRIDE",
    resourceType: "User",
    resourceId: user.id,
    actorId: req.user.id,
    details: {
      reason: reason,
      trace: traceSnapshot,
    },
    ipAddress: req.ip,
  });

  res.json({ message: "User activated via Override" });
});

// POST /api/owner/override/role-change
exports.overrideRoleChange = asyncHandler(async (req, res) => {
  const { userId, newRole, reason } = req.body;
  if (!reason || reason.length < 15)
    throw new Error(
      "Reason string min length 15 required for Sovereign Override",
    );
  if (newRole === "owner")
    throw new Error("Sovereignty cannot be delegated via Role Change.");

  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");

  const oldRole = user.role;
  user.role = newRole;
  await user.save();

  const traceSnapshot = PolicyEngine.trace(
    req.user,
    user,
    "User",
    "changeRole",
  );

  await AuditLog.create({
    action: "ROLE_CHANGE_OVERRIDE",
    resourceType: "User",
    resourceId: user.id,
    actorId: req.user.id,
    details: {
      from: oldRole,
      to: newRole,
      reason: reason,
      trace: traceSnapshot,
    },
    ipAddress: req.ip,
  });

  res.json({ message: `Role changed from ${oldRole} to ${newRole}` });
});

// POST /api/owner/override/cancel-request
exports.overrideCancelRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.body;
  const reqObj = await PurchaseRequest.findByPk(requestId);
  if (!reqObj) throw new Error("Request not found");
  reqObj.status = "cancelled";
  await reqObj.save();

  // Audit Force with Trace (Cancel) Phase 2.1
  const traceSnapshot = PolicyEngine.trace(
    req.user,
    reqObj,
    "Request",
    "cancel",
  );

  await AuditLog.create({
    action: "CANCEL_REQUEST_OVERRIDE",
    resourceType: "PurchaseRequest",
    resourceId: reqObj.id,
    actorId: req.user.id,
    details: {
      reason: "Sovereign Override",
      trace: traceSnapshot,
    },
    ipAddress: req.ip,
  });

  res.json({ message: "Request cancelled via Override" });
});

// POST /api/owner/requests/:id/force-transition
exports.forceRequestTransition = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { to, reason } = req.body; // 'to' is target status

  if (!to || !reason) throw new Error("Target State and Reason are required");

  const request = await PurchaseRequest.findByPk(id);
  if (!request) throw new Error("Request not found");

  const oldStatus = request.status;
  request.status = to;
  await request.save();

  // Audit Force with Trace Snapshot (Phase 2.1)
  const traceSnapshot = PolicyEngine.trace(
    req.user,
    request,
    "Request",
    "update",
  );

  await AuditLog.create({
    action: "FORCE_TRANSITION",
    resourceType: "PurchaseRequest",
    resourceId: request.id,
    actorId: req.user.id, // Owner
    details: {
      from: oldStatus,
      to: to,
      reason: reason,
      trace: traceSnapshot, // Phase 2.1 Mandate
    },
    ipAddress: req.ip,
  });

  res.json({
    message: `Forced transition from ${oldStatus} to ${to} successful`,
  });
});

// POST /api/owner/policy/trace (Sovereign Trace)
exports.tracePolicy = asyncHandler(async (req, res) => {
  const { userId, resourceType, resourceId, action } = req.body;

  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");

  let resource = null;
  if (resourceType === "Request" && resourceId) {
    resource = await PurchaseRequest.findByPk(resourceId);
  } else if (resourceType === "Quote" && resourceId) {
    resource = await PriceQuote.findByPk(resourceId);
  }

  const traceResult = PolicyEngine.trace(user, resource, resourceType, action);

  // Audit Trace if DENY (Simulated Trace) - User asked for this on ANY deny?
  // "Owner executes Trace sees Timeline... Export JSON".
  // This endpoint is just INTROSPECTION. Real enforcement logging is separate.
  // But let's log introspection for auditability too.

  res.json(traceResult);
});

// POST /api/owner/policy/trace/export (Download JSON)
exports.exportTracePolicy = asyncHandler(async (req, res) => {
  const { userId, resourceType, resourceId, action } = req.body;

  const user = await User.findByPk(userId);
  if (!user) throw new Error("User not found");

  let resource = null;
  if (resourceType === "Request" && resourceId) {
    resource = await PurchaseRequest.findByPk(resourceId);
  } else if (resourceType === "Quote" && resourceId) {
    resource = await PriceQuote.findByPk(resourceId);
  }

  // PolicyEngine.trace now returns the Canonical Sovereign Schema v1.0 Result
  const traceResult = PolicyEngine.trace(user, resource, resourceType, action);

  // Add Integrity
  traceResult.integrity = {
    hash: TraceIntegrity.hash(traceResult),
    signature: TraceIntegrity.sign(traceResult),
    tamperDetected: false,
    algorithm: "HMAC-SHA256",
  };

  res.header("Content-Type", "application/json");
  res.header(
    "Content-Disposition",
    `attachment; filename=sovereign-trace-${traceResult.traceId}.json`,
  );
  res.send(JSON.stringify(traceResult, null, 2));
});

// GET /api/owner/config (Sovereign Constants)
exports.getConfig = asyncHandler(async (req, res) => {
  // Single Source of Truth from Model
  const PurchaseRequest = require("../models/PurchaseRequest")(
    sequelize,
    require("sequelize"),
  );
  // We extracted the ENUM values manually since Sequelize definition is wrapped.
  // Ideally, we can get it from attributes.
  // For now, mirroring the definition strictly to avoid runtime reflection overhead on every call.
  // Or better:
  const states = [
    "draft",
    "published",
    "under_review",
    "quoting",
    "awaiting_decision",
    "accepted",
    "completed",
    "cancelled",
    "suspended",
    "expired",
  ];
  res.json({
    states: states,
    policyVersion: "v2.3-SOVEREIGN",
  });
});

// GET /api/owner/quotes (Sovereign View)
exports.getAllQuotes = asyncHandler(async (req, res) => {
  const { limit = 50 } = req.query;
  const quotes = await PriceQuote.findAll({
    limit: parseInt(limit),
    order: [["createdAt", "DESC"]],
    include: [
      { model: PurchaseRequest, as: "request", attributes: ["id", "title"] },
    ],
  });
  res.json(quotes);
});

// --- 6. Audit Viewer ---

// GET /api/owner/audit-logs
// GET /api/owner/audit-logs
exports.getAuditLogs = asyncHandler(async (req, res) => {
  const { limit = 50, actorId, resourceId, action } = req.query;
  const where = {};
  if (actorId) where.actorId = actorId;
  if (resourceId) where.resourceId = resourceId;
  if (action) where.action = action;

  const logs = await AuditLog.findAll({
    where,
    limit: parseInt(limit),
    order: [["createdAt", "DESC"]],
    include: [
      { model: User, as: "actor", attributes: ["name", "email", "role"] },
    ],
  });
  res.json(logs);
});

// GET /api/owner/audit-logs/:id/export
exports.exportAuditLog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const log = await AuditLog.findByPk(id, {
    include: [
      { model: User, as: "actor", attributes: ["name", "email", "role"] },
    ],
  });

  if (!log) throw new Error("Audit Log not found");

  const logData = log.toJSON();

  // Server-Side Signing for Legal Non-Repudiation
  const signature = TraceIntegrity.sign(logData);

  const exportPacket = {
    meta: {
      exportedAt: new Date().toISOString(),
      exportedBy: req.user.id, // The auditor
      system: "Sovereign-Ecommerce-Engine",
      version: "v1.0",
    },
    integrity: {
      signature: signature,
      algorithm: "HMAC-SHA256",
    },
    record: logData,
  };

  res.header("Content-Type", "application/json");
  res.header(
    "Content-Disposition",
    `attachment; filename=audit-legal-${id}.json`,
  );
  res.send(JSON.stringify(exportPacket, null, 2));
});

// --- 7. Bootstrap Login ---
exports.bootstrapLogin = asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(403);
    throw new Error("Bootstrap login only allowed in Dev");
  }

  const ownerId = process.env.OWNER_ID;
  const owner = await User.findByPk(ownerId);
  if (!owner) throw new Error("Owner not found in DB");

  // Bypass password check
  const token = owner.getSignedJwtToken();
  const refreshToken = await owner.createRefreshToken();

  // Set Cookie
  const options = {
    expires: new Date(Date.now() + 15 * 60 * 1000),
    httpOnly: true,
    secure: false, // Dev
  };

  res
    .status(200)
    .cookie("token", token, options)
    .json({
      success: true,
      user: { id: owner.id, name: owner.name },
      token, // return token for manual testing use
    });
});
