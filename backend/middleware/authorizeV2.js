const { 
  OrganizationMembership, 
  MembershipTeam, 
  Team, 
  MembershipPermission, 
  Permission 
} = require("../sequelize_setup");

/**
 * Authorization Middleware V2 (Identity & Governance Engine)
 * Evaluates permissions via: Actor -> Membership -> Teams -> Permissions -> DENY Overrides
 * 
 * @param {string} permissionKey - Atomic permission key (e.g. 'CREATE_RFQ', 'APPROVE_AWARD')
 */
const authorizeV2 = (permissionKey) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        console.warn(`[AuthorizeV2 Access Denied] No authenticated user found for request to '${permissionKey}'`);
        return res.status(401).json({ error: "Unauthorized: Authentication required" });
      }

      // 1. Determine active organization context
      const targetOrgId = req.headers["x-organization-id"] || req.headers["x-org-id"];

      // 2. Fetch Active Organization Membership
      const whereClause = { userId: user.id, status: "ACTIVE" };
      if (targetOrgId) {
        whereClause.organizationId = targetOrgId;
      }

      const membership = await OrganizationMembership.findOne({
        where: whereClause,
        include: [
          {
            model: Team,
            as: "teams",
            through: { attributes: [] }
          }
        ]
      });

      if (!membership) {
        console.warn(`[AuthorizeV2 Denied] No Active Membership for User: ${user.id}, Org: ${targetOrgId || 'Default'}`);
        return res.status(403).json({ 
          error: "Forbidden: No Active Organization Membership found",
          details: { userId: user.id, organizationId: targetOrgId }
        });
      }

      // 3. Load Direct Membership Permissions (Explicit ALLOW & DENY)
      const directPermissions = await MembershipPermission.findAll({
        where: { membershipId: membership.id },
        include: [{ model: Permission, as: "permission" }]
      });

      const explicitDenies = new Set();
      const explicitAllows = new Set();

      directPermissions.forEach(mp => {
        const key = mp.permission?.key;
        if (key) {
          if (mp.effect === "DENY") {
            explicitDenies.add(key);
          } else if (mp.effect === "ALLOW") {
            explicitAllows.add(key);
          }
        }
      });

      // 4. DENY OVERRIDES ALLOW: Step 5 Rule
      if (explicitDenies.has(permissionKey)) {
        console.warn(`[AuthorizeV2 Denied - EXPLICIT DENY] Membership: ${membership.id}, Permission: ${permissionKey}`);
        return res.status(403).json({
          error: `Forbidden: Permission '${permissionKey}' is explicitly DENIED for this membership`,
          details: { membershipId: membership.id, permissionKey, reason: "EXPLICIT_DENY" }
        });
      }

      // 5. Check ALLOW (Explicit membership allow OR Owner privilege)
      const isAllowed = explicitAllows.has(permissionKey) || membership.isOwner === true;

      if (!isAllowed) {
        console.warn(`[AuthorizeV2 Denied - NOT GRANTED] Membership: ${membership.id}, Permission: ${permissionKey}`);
        return res.status(403).json({
          error: `Forbidden: Missing required permission '${permissionKey}'`,
          details: { membershipId: membership.id, permissionKey, reason: "PERMISSION_NOT_GRANTED" }
        });
      }

      // 6. Permission Granted
      req.membership = membership;
      return next();

    } catch (err) {
      console.error(`[AuthorizeV2 Error] Unexpected error evaluating permission '${permissionKey}':`, err);
      return res.status(500).json({ error: "Internal Server Error during authorization evaluation" });
    }
  };
};

module.exports = authorizeV2;
