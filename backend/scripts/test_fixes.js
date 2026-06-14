const authorize = require("../middleware/authorize");
const RBACService = require("../services/RBACService");
const { User } = require("../sequelize_setup");

async function testFixes() {
  console.log("=== TEST 1: GET /api/requests/published (Missing resource bug) ===");
  const req1 = { 
    user: { id: "test-user-id", role: "seller" },
    headers: {} 
  };
  const res1 = {
    status: (code) => { return { json: (data) => {} } }
  };
  const next1 = () => console.log("✅ Next() called successfully! (Middleware passed for viewPublished)");
  
  const originalHasPermission = RBACService.hasPermission;
  RBACService.hasPermission = async () => true;

  const authorizeMiddleware = authorize(null, "Request", "viewPublished");
  await authorizeMiddleware(req1, res1, next1);

  RBACService.hasPermission = originalHasPermission;

  console.log("\n=== TEST 2: GET /api/quotes/my-quotes (RBAC Fallback bug) ===");
  try {
    // Stub User.findByPk to simulate missing UserRole in DB but user exists as 'seller'
    const originalFindByPk = User.findByPk;
    
    User.findByPk = async (id, options) => {
      // If it's the dynamic RBAC check (with includes), simulate failure (returns null)
      if (options && options.include) return null;
      // If it's the fallback check (attributes: ['role']), return user with role 'seller'
      if (options && options.attributes) return { id, role: "seller" };
      return null;
    };

    const hasViewQuotes = await RBACService.hasPermission("mock-id", "VIEW_QUOTES");
    console.log(`✅ Result for Seller accessing VIEW_QUOTES: ${hasViewQuotes}`);

    const hasAdminPerm = await RBACService.hasPermission("mock-id", "MANAGE_USERS");
    console.log(`✅ Result for Seller accessing MANAGE_USERS: ${hasAdminPerm}`);

    // Restore
    User.findByPk = originalFindByPk;
  } catch (e) {
    console.log("Test 2 error:", e.message);
  }

  process.exit(0);
}

testFixes();
