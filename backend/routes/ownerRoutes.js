const express = require('express');
const router = express.Router();
const ownerController = require('../controllers/ownerController');
const { protect } = require('../middleware/authMiddleware');
const ownerAuth = require('../middleware/ownerAuth');

// All Routes require Auth + STRICT Owner Check
// Exception: bootstrap-login (needs to be accessible without token if purely bootstrap, but spec says "Dev Only", we can leave it open or simple auth? 
// Spec: "POST /api/owner/bootstrap-login ... gated by NODE_ENV". 
// Usually bootstrap is the entry point, so NO protect middleware.

router.post('/bootstrap-login', ownerController.bootstrapLogin);

// Apply protection to everything below
router.use(protect);
router.use(ownerAuth);

// 1. Users
router.get('/users', ownerController.getAllUsers);
router.get('/config', ownerController.getConfig);
router.post('/users', ownerController.createUser);
router.patch('/users/:id', ownerController.updateUser);
router.patch('/users/:id', ownerController.updateUser);

// 2. Roles
router.get('/roles', ownerController.getRoles);
router.post('/roles/:roleId/permissions', ownerController.bindPermission);
router.delete('/roles/:roleId/permissions/:permId', ownerController.unbindPermission);

// 3. Policies
router.get('/policies', ownerController.getPolicies);
router.post('/policies/evaluate', ownerController.evaluatePolicy);

// 4. Delegations
router.get('/delegations', ownerController.getDelegations);
router.post('/delegations', ownerController.createDelegation);
router.delete('/delegations/:id', ownerController.revokeDelegation);

// 5. Override (Sovereign)
router.get('/requests', ownerController.getAllRequests);
router.get('/quotes', ownerController.getAllQuotes); // NEW
router.post('/requests/:id/force-transition', ownerController.forceRequestTransition);
router.post('/policy/trace', ownerController.tracePolicy);
router.post('/policy/trace/export', ownerController.exportTracePolicy); // NEW Phase 2
router.post('/override/suspend-user', ownerController.overrideSuspendUser);
router.post('/override/activate-user', ownerController.overrideActivateUser);
router.post('/override/role-change', ownerController.overrideRoleChange);
router.post('/override/cancel-request', ownerController.overrideCancelRequest);

// 6. Audit
router.get('/audit-logs', ownerController.getAuditLogs);

module.exports = router;
