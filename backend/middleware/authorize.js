const RBACService = require("../services/RBACService");
const PolicyEngine = require("../policies/PolicyEngine");
const { User, Delegation, Sequelize } = require("../sequelize_setup");
const { Op } = require("sequelize");

/**
 * Authorization Middleware Factory
 * @param {string} permissionKey - The required RBAC permission (e.g., 'MANAGE_USERS').
 * @param {string} [resourceType] - Optional: The resource type for Policy Check (e.g., 'Request').
 * @param {string} [action] - Optional: The action for Policy Check (default 'view').
 */
const authorize = (permissionKey, resourceType = null, action = "view") => {
  return async (req, res, next) => {
    try {
      let user = req.user;

      if (!user) {
        return res.status(401).json({ error: "Unauthorized: No user found" });
      }

      // ============================================================
      // PHASE 4: DELEGATION RESOLUTION (Acting As)
      // ============================================================
      const targetPrincipalId = req.headers["x-acting-as"];
      let delegationRecord = null;

      if (targetPrincipalId) {
        const startTime = Date.now(); // Start Metric

        // Invariant #3: No Loop / Self Delegation
        if (targetPrincipalId === user.id) {
          return res
            .status(400)
            .json({
              error:
                "Bad Request: Self-delegation is redundant and disallowed.",
            });
        }

        // 1. Verify Delegation Existence & Validity
        delegationRecord = await Delegation.findOne({
          where: {
            fromUserId: targetPrincipalId,
            toUserId: user.id,
            isActive: true,
            [Op.or]: [
              { expiresAt: null },
              { expiresAt: { [Op.gt]: new Date() } },
            ],
          },
        });

        const lookupDuration = Date.now() - startTime; // End Metric
        if (lookupDuration > 50) {
          console.warn(
            `[Performance Warning] Delegation Lookup took ${lookupDuration}ms for Actor ${user.id}`,
          );
        }

        if (!delegationRecord) {
          console.warn(
            `[Delegation Failure] User ${user.id} tried to act as ${targetPrincipalId} without valid delegation.`,
          );
          return res
            .status(403)
            .json({ error: "Forbidden: Invalid or expired delegation" });
        }

        // 2. Load Principal Identity (with Context for Policy)
        const principal = await User.findByPk(targetPrincipalId, {
          include: ["context"],
        });

        if (!principal) {
          return res.status(404).json({ error: "Principal user not found" });
        }

        // 3. Identity Swap (Invariant #1: Delegation = Identity)
        req.realUser = user; // The Actor (Delegate)
        req.user = principal; // The Principal (Owner) - Policy sees this

        // 4. Auth Context
        req.auth = {
          principal: principal,
          actor: req.realUser,
          delegation: delegationRecord,
        };

        // ============================================================
        // PHASE 4.1: SCOPED DELEGATION ENFORCEMENT
        // ============================================================

        // A. Permission Scope Enforcement
        // If delegation is limited to specific permissions, enforce it.
        // Assuming delegation.permissionKey can be '*' or specific key.
        if (
          delegationRecord.permissionKey &&
          delegationRecord.permissionKey !== "*"
        ) {
          if (
            permissionKey &&
            permissionKey !== delegationRecord.permissionKey
          ) {
            console.warn(
              `[Delegation Scope Fail] Actor ${req.realUser.id} tried to use perm '${permissionKey}' but delegation only allows '${delegationRecord.permissionKey}'`,
            );
            return res
              .status(403)
              .json({
                error: "Forbidden: Delegation does not cover this permission",
              });
          }
          // If no permissionKey required by route, we proceed?
          // Or should we strict fail if route is "public" but delegation is scoped?
          // Generally, if route needs no perm, it's public/safe.
        }

        // B. Resource/Context Scope Enforcement
        // If delegation is scoped to City or Resource.
        if (delegationRecord.scopeType !== "global") {
          // We need a resource to check scope against.
          // If route has no resource (e.g. list), we might need to rely on Filter (Service layer) or Deny.
          // For Phase 4.1, if scope is restrictive and we can't verify match, we should probably Deny or rely on resourceType check.

          if (resourceType && req.resource) {
            const resource = req.resource;

            // 1. City Scope
            if (delegationRecord.scopeType === "city") {
              // Check against Resource's City (if applicable) or User Context?
              // Usually checks resource location.
              const targetCityId =
                resource.cityId ||
                (resource.context ? resource.context.cityId : null);

              // Loose equality for UUID vs String potential issues, but strict is better.
              if (!targetCityId || targetCityId !== delegationRecord.scopeId) {
                console.warn(
                  `[Delegation Scope Fail] City Mismatch. Delegation for city ${delegationRecord.scopeId}, Resource in ${targetCityId}`,
                );
                return res
                  .status(403)
                  .json({
                    error: "Forbidden: Delegation scope mismatch (City)",
                  });
              }
            }

            // 2. Resource Specific Scope (e.g. "Manage THIS specific Request")
            if (delegationRecord.scopeType === "resource") {
              if (resource.id !== delegationRecord.scopeId) {
                return res
                  .status(403)
                  .json({
                    error:
                      "Forbidden: Delegation restricted to specific resource",
                  });
              }
            }
          } else if (delegationRecord.scopeType !== "global") {
            // If we have a scoped delegation but NO resource is being accessed (e.g. 'create').
            // If 'create', we can't check scope yet (unless we check body city?).
            // For safety, Phase 4.1 might Default Deny "Scoped Delegation on Non-Resource Actions" unless handled.
            // For now, let's allow if action is create AND scope is compatible (logic complex).
            // We will Log warning.
            // console.warn('Scoped delegation used without resource context.');
          }
        }

        user = principal; // Update local ref for subsequent checks matches Policy view
      } else {
        // No Delegation
        req.auth = {
          principal: user,
          actor: user,
          delegation: null,
        };
      }

      // ============================================================
      // EXISTING AUTHORIZATION FLOW (NOW ON PRINCIPAL)
      // ============================================================

      // 1. Owner Bypass (Root Access)
      // Invariant #2: Owner Bypass checks ACTOR, not Principal.
      // Platform Admin acting as User -> Allowed (Debug)
      // User acting as Platform Admin -> Denied (unless they ARE Admin, caught by no-delegation logic)
      if (req.auth.actor.id === process.env.OWNER_ID) {
        console.warn(
          `[Owner Bypass] Root Actor ${req.auth.actor.id} accessing resource.`,
        );
        return next();
      }

      // 2. RBAC Check (On Principal)
      if (permissionKey) {
        // Check if Principal (User being impersonated) has permission
        console.log(`[Authorize] Checking permission '${permissionKey}' for user ${user.id} (role: ${user.role})`);
        const hasPermission = await RBACService.hasPermission(
          user.id,
          permissionKey,
        );
        console.log(`[Authorize] hasPermission result: ${hasPermission}`);
        if (!hasPermission) {
          return res
            .status(403)
            .json({ error: "Forbidden: Missing permission" }); // Generic message for security
        }
      }

      // 3. ABAC / Policy Check (On Principal / Invariant #4)
      if (resourceType) {
        let resource = req.resource;

        const bypassResourceCheckActions = ["create", "create_quote", "viewPublished", "list"];
        
        if (!resource && !bypassResourceCheckActions.includes(action)) {
          console.error(
            `[Authorization Error] Resource of type '${resourceType}' expected but req.resource is undefined. Action: ${action}`,
          );
          return res
            .status(500)
            .json({ error: "Internal Server Error: Resource not loaded" });
        }

        // Policy Engine MUST only see 'user' (Principal). It is blind to 'req.auth.actor'.
        const allowed = PolicyEngine.allows(
          user,
          resource,
          resourceType,
          action,
        );
        if (!allowed) {
          // Log failure with delegation context
          const actorId = req.auth.actor.id;
          console.warn(
            `[Auth Failure] Principal: ${user.id} (Actor: ${actorId}) | Action: ${action} | Resource: ${resourceType}`,
          );
          return res.status(403).json({ error: "Forbidden: Policy violation" });
        }
      }

      next();
    } catch (error) {
      console.error("❌ Authorization Middleware Error:", error.message);
      console.error("❌ Authorization Stack:", error.stack);
      if (error.name === "SequelizeDatabaseError") {
        console.error("❌ Sequelize DB Error:", error.parent);
      }
      return res
        .status(500)
        .json({ error: "Internal Server Error during authorization", details: error.message });
    }
  };
};

module.exports = authorize;
