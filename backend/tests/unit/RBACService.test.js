const RBACService = require("../../services/RBACService");
const {
  User,
  Role,
  Permission,
  UserRole,
  RolePermission,
  sequelize,
} = require("../../sequelize_setup");
const { v4: uuidv4 } = require("uuid");

describe("RBACService Unit Tests", () => {
  let userId, roleId, permissionId;

  beforeAll(async () => {
    // We assume verify_auth_schema ran and DB is sync.
    await sequelize.authenticate();
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Setup fresh data
    userId = uuidv4();
    roleId = uuidv4();
    permissionId = uuidv4();

    // Create User
    await User.create({
      id: userId,
      name: "Test RBAC User",
      email: `rbac_${userId}@test.com`,
      password: "password123",
      role: "buyer", // Legacy
    });

    // Create Role
    await Role.create({
      id: roleId,
      name: `Test Role ${roleId}`,
    });

    // Create Permission
    await Permission.create({
      id: permissionId,
      key: `TEST_PERM_${permissionId}`,
    });
  });

  test("should return true if user has the permission via role", async () => {
    // Assign Permission to Role
    await RolePermission.create({ roleId, permissionId });
    // Assign Role to User
    await UserRole.create({ userId, roleId });

    const result = await RBACService.hasPermission(
      userId,
      `TEST_PERM_${permissionId}`,
    );
    expect(result).toBe(true);
  });

  test("should return false if user does not have the role", async () => {
    // Assign Permission to Role BUT Role NOT to User
    await RolePermission.create({ roleId, permissionId });

    const result = await RBACService.hasPermission(
      userId,
      `TEST_PERM_${permissionId}`,
    );
    expect(result).toBe(false);
  });

  test("should return false if role does not have the permission", async () => {
    // Assign Role to User BUT Permission NOT to Role
    await UserRole.create({ userId, roleId });

    const result = await RBACService.hasPermission(
      userId,
      `TEST_PERM_${permissionId}`,
    );
    expect(result).toBe(false);
  });
});
